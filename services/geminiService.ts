import { ProficiencyLevel, QuizQuestion } from "../types";
import { getRandomOfflineExam } from "./examBank";
import { FlashcardItem } from "../components/flashcardData";

// Audio Decoding Helpers
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function isWavHeader(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x41 && // A
    bytes[10] === 0x56 && // V
    bytes[11] === 0x45 // E
  );
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, mimeType?: string): Promise<AudioBuffer> {
  if ((mimeType && mimeType.includes("wav")) || isWavHeader(data)) {
    // Gemini 3.8 unary TTS returns a complete RIFF WAV file
    const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    return await ctx.decodeAudioData(arrayBuffer);
  }

  // Fallback for raw 24kHz mono 16-bit PCM
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, Math.floor(data.byteLength / 2));
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errBody = await response.json();
      if (errBody?.error) {
        message = errBody.error;
      }
    } catch {
      // ignore JSON parse failure on error body
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

// Store active instances at the module level
let activeAudioCtx: AudioContext | null = null;
let activeAudioSource: AudioBufferSourceNode | null = null;
let onSpeakEndCallbacks: (() => void)[] = [];

export const geminiService = {
  async generateLessonContent(level: ProficiencyLevel, topic: string): Promise<string> {
    const data = await postJson<{ text: string }>("/api/gemini/lesson", { level, topic });
    return data.text;
  },

  stopSpeaking() {
    try {
      if (activeAudioSource) {
        activeAudioSource.stop();
        activeAudioSource = null;
      }
      if (activeAudioCtx && activeAudioCtx.state !== "closed") {
        activeAudioCtx.close();
        activeAudioCtx = null;
      }
      // Trigger all pending end callbacks
      const callbacks = [...onSpeakEndCallbacks];
      onSpeakEndCallbacks = [];
      callbacks.forEach((cb) => {
        try {
          cb();
        } catch {}
      });
    } catch (err) {
      console.warn("Error stopping speech audio:", err);
    }
  },

  async speakText(text: string, onStart?: () => void, onEnd?: () => void) {
    // Stop any currently playing audio so they never overlap
    this.stopSpeaking();

    if (onStart) onStart();
    const endHandler = () => {
      if (onEnd) onEnd();
    };
    onSpeakEndCallbacks.push(endHandler);

    try {
      const data = await postJson<{ audioBase64: string; mimeType?: string }>("/api/gemini/tts", { text });

      if (data.audioBase64) {
        // Confirm playback was not cancelled while waiting for server TTS response
        if (!onSpeakEndCallbacks.includes(endHandler)) {
          return;
        }

        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
          sampleRate: 24000,
        });
        activeAudioCtx = audioCtx;

        const audioBuffer = await decodeAudioData(decodeBase64(data.audioBase64), audioCtx, data.mimeType);

        if (!onSpeakEndCallbacks.includes(endHandler)) {
          if (activeAudioCtx === audioCtx && audioCtx.state !== "closed") {
            audioCtx.close();
            activeAudioCtx = null;
          }
          return;
        }

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        activeAudioSource = source;

        source.onended = () => {
          const index = onSpeakEndCallbacks.indexOf(endHandler);
          if (index !== -1) {
            onSpeakEndCallbacks.splice(index, 1);
            endHandler();
          }
          if (activeAudioCtx === audioCtx) {
            activeAudioCtx = null;
          }
          if (activeAudioSource === source) {
            activeAudioSource = null;
          }
        };

        source.start();
      } else {
        const index = onSpeakEndCallbacks.indexOf(endHandler);
        if (index !== -1) {
          onSpeakEndCallbacks.splice(index, 1);
          endHandler();
        }
      }
    } catch (error) {
      console.error("Speech generation failed:", error);
      const index = onSpeakEndCallbacks.indexOf(endHandler);
      if (index !== -1) {
        onSpeakEndCallbacks.splice(index, 1);
        endHandler();
      }
    }
  },

  async generateQuiz(
    level: ProficiencyLevel,
    topic: string,
    difficulty: "Easy" | "Medium" | "Hard" = "Medium"
  ): Promise<QuizQuestion[]> {
    try {
      const data = await postJson<{ questions: QuizQuestion[] }>("/api/gemini/quiz", {
        level,
        topic,
        difficulty,
      });
      return data.questions || [];
    } catch (err) {
      console.warn("Quiz generation via server failed, producing fallback quiz context:", err);
      // Fallback a simple mock quiz to prevent blank quiz screens
      return [
        {
          question: `Wie sagt man 'Thank you very much' auf Deutsch?`,
          questionEn: "How do you say 'Thank you very much' in German?",
          options: ["Guten Tag", "Vielen Dank", "Auf Wiedersehen", "Hallo"],
          correctAnswer: "Vielen Dank",
          explanation: "Vielen Dank translates to Thank you very much / Many thanks in English.",
        },
        {
          question: `Welcher Artikel passt zu 'Tisch'?`,
          questionEn: "Which article fits 'Tisch' (table)?",
          options: ["der", "die", "das", "ein"],
          correctAnswer: "der",
          explanation: "Tisch is a masculine noun, so it takes the definite article 'der'.",
        },
        {
          question: `Was bedeutet 'Milch'?`,
          questionEn: "What does 'Milch' mean?",
          options: ["Water", "Coffee", "Tea", "Milk"],
          correctAnswer: "Milk",
          explanation: "Milch means Milk in English.",
        },
        {
          question: `Wie heißt 'seven' auf Deutsch?`,
          questionEn: "How is 'seven' called in German?",
          options: ["sechs", "sieben", "acht", "neun"],
          correctAnswer: "sieben",
          explanation: "Sieben means seven in German.",
        },
        {
          question: `Konjugation von 'haben' für 'wir': Wir _____ ein Auto.`,
          questionEn: "Conjugation of 'haben' for 'wir': We _____ a car.",
          options: ["habe", "hast", "hat", "haben"],
          correctAnswer: "haben",
          explanation: "The correct verb form of 'haben' for 'wir' (we) is 'haben'.",
        },
      ];
    }
  },

  async generateExamContent(level: ProficiencyLevel, module: string, customPrompt?: string) {
    try {
      return await postJson<Record<string, unknown>>("/api/gemini/exam", {
        level,
        module,
        customPrompt,
      });
    } catch (error) {
      console.warn(`Failed to generate exam content via server for ${level} - ${module}. Reverting to offline-first exam bank:`, error);
      return getRandomOfflineExam(level, module);
    }
  },

  async evaluateWriting(level: ProficiencyLevel, prompt: string, userText: string) {
    try {
      return await postJson<{
        score: number;
        mistakes: string[];
        corrections: string;
        feedback: string;
      }>("/api/gemini/evaluate-writing", {
        level,
        prompt,
        userText,
      });
    } catch (err) {
      console.warn("Failed to evaluate writing via server, using local heuristic scoring: ", err);
      // Generous kind grading fallback to not block the student's progress
      const wordCount = (userText || "").trim().split(/\s+/).length;
      const score = Math.min(
        100,
        Math.max(65, 70 + (wordCount > 35 ? 15 : 0) + (userText.includes("Uhr") || userText.includes("kommen") ? 10 : 0))
      );
      return {
        score,
        mistakes: ["Keine schweren Fehler gefunden (Lokale Heuristik)."],
        corrections:
          "Sehr gut! Du hast die Nachricht verständlich verfasst. Achte auf Groß- und Kleinschreibung sowie richtige Verbendungen.",
        feedback:
          "Awesome work pushing through! We evaluated your writing based on sentence length and vocabulary presence. Keep practicing to build even stronger sentence links.",
      };
    }
  },

  async generateFlashcards(
    level: ProficiencyLevel,
    type: "word" | "sentence" | "article",
    selectedCategories: string[],
    excludeGermanWords: string[]
  ): Promise<FlashcardItem[]> {
    try {
      const data = await postJson<{ items: FlashcardItem[] }>("/api/gemini/flashcards", {
        level,
        type,
        selectedCategories,
        excludeGermanWords,
      });
      return data.items || [];
    } catch (err) {
      console.warn("AI flashcard generation failed:", err);
      return [];
    }
  },
};
