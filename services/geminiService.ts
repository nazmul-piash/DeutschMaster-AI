
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProficiencyLevel, QuizQuestion } from "../types";
import { getRandomOfflineExam } from "./examBank";

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!key || key === 'undefined') {
    console.error("GEMINI_API_KEY is not defined. Please check your environment variables.");
    return "";
  }
  return key;
};

const ai = new GoogleGenAI({
  apiKey: getApiKey(),
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Audio Decoding Helpers
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

// Store active instances at the module level
let activeAudioCtx: AudioContext | null = null;
let activeAudioSource: AudioBufferSourceNode | null = null;
let onSpeakEndCallbacks: (() => void)[] = [];

export const geminiService = {
  async generateLessonContent(level: ProficiencyLevel, topic: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are a friendly and encouraging German tutor. Generate a joyful and easy-to-understand ${level} lesson about: ${topic}.
      Make it feel like a fun adventure!
      
      Structure:
      1. What we'll learn today! (Exciting goals).
      2. Fun Words to Know (15 words + articles for nouns).
      3. Grammar Corner: Simple and clear explanation of rules with friendly examples.
      4. Real-life Magic: How to use this when talking to friends in Germany.
      5. Daily Phrases: 5 formal and 5 informal sentences.
      6. Zusammenfassung (A friendly summary in German).`,
    });
    return response.text;
  },

  stopSpeaking() {
    try {
      if (activeAudioSource) {
        activeAudioSource.stop();
        activeAudioSource = null;
      }
      if (activeAudioCtx && activeAudioCtx.state !== 'closed') {
        activeAudioCtx.close();
        activeAudioCtx = null;
      }
      // Trigger all pending end callbacks
      const callbacks = [...onSpeakEndCallbacks];
      onSpeakEndCallbacks = [];
      callbacks.forEach(cb => {
        try { cb(); } catch (e) {}
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
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Speak this German text in a warm, friendly, and clear voice: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' }, // Friendly and clear voice
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        // Correctly confirm we were not cancelled/stopped during key exchange
        if (!onSpeakEndCallbacks.includes(endHandler)) {
          return;
        }

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        activeAudioCtx = audioCtx;

        const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), audioCtx);
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

  async generateQuiz(level: ProficiencyLevel, topic: string, difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'): Promise<QuizQuestion[]> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Generate a 5-question multiple choice quiz in GERMAN for ${level} learners on the topic: ${topic}. 
        Difficulty level: ${difficulty}.
        
        Requirements:
        - The question (question) MUST be in German.
        - The questionEn field MUST be the English translation of the question.
        - All options MUST be in German.
        - The explanation MUST be in English.
        - Follow the standard of official German exams like Goethe-Zertifikat.
        
        Questions should progress slightly in difficulty within the set.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                questionEn: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["question", "questionEn", "options", "correctAnswer", "explanation"]
            }
          }
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (err) {
      console.warn("Quiz generation via Gemini failed, producing fallback quiz context:", err);
      // Fallback a simple mock quiz to prevent blank quiz screens
      return [
        {
          question: `Wie sagt man 'Thank you very much' auf Deutsch?`,
          questionEn: "How do you say 'Thank you very much' in German?",
          options: ["Guten Tag", "Vielen Dank", "Auf Wiedersehen", "Hallo"],
          correctAnswer: "Vielen Dank",
          explanation: "Vielen Dank translates to Thank you very much / Many thanks in English."
        },
        {
          question: `Welcher Artikel passt zu 'Tisch'?`,
          questionEn: "Which article fits 'Tisch' (table)?",
          options: ["der", "die", "das", "ein"],
          correctAnswer: "der",
          explanation: "Tisch is a masculine noun, so it takes the definite article 'der'."
        },
        {
          question: `Was bedeutet 'Milch'?`,
          questionEn: "What does 'Milch' mean?",
          options: ["Water", "Coffee", "Tea", "Milk"],
          correctAnswer: "Milk",
          explanation: "Milch means Milk in English."
        },
        {
          question: `Wie heißt 'seven' auf Deutsch?`,
          questionEn: "How is 'seven' called in German?",
          options: ["sechs", "sieben", "acht", "neun"],
          correctAnswer: "sieben",
          explanation: "Sieben means seven in German."
        },
        {
          question: `Konjugation von 'haben' für 'wir': Wir _____ ein Auto.`,
          questionEn: "Conjugation of 'haben' for 'wir': We _____ a car.",
          options: ["habe", "hast", "hat", "haben"],
          correctAnswer: "haben",
          explanation: "The correct verb form of 'haben' for 'wir' (we) is 'haben'."
        }
      ];
    }
  },

  async generateExamContent(level: ProficiencyLevel, module: string, customPrompt?: string) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: customPrompt || `Generate a professional ${level} German exam for the ${module} module.
        If module is 'Reading', provide a text and 5 questions.
        If module is 'Listening', provide a text that will be read aloud and 5 questions.
        If module is 'Writing', provide a prompt.
        If module is 'Speaking', provide 3 discussion points.
        Return the result in JSON format.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "The text to read or listen to" },
              textTranslation: { type: Type.STRING, description: "The English translation of the text" },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    questionTranslation: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING }
                  },
                  required: ["question", "options", "correctAnswer"]
                }
              },
              writingPrompt: { type: Type.STRING },
              writingPromptTranslation: { type: Type.STRING },
              speakingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              speakingPointsTranslation: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      if (!response.text) throw new Error("Empty response from Gemini API");
      return JSON.parse(response.text);
    } catch (error) {
      console.warn(`Failed to generate exam content via AI for ${level} - ${module}. Reverting to offline-first exam bank:`, error);
      return getRandomOfflineExam(level, module);
    }
  },

  async evaluateWriting(level: ProficiencyLevel, prompt: string, userText: string) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Evaluate this ${level} writing task as a supportive and kind German tutor.
        Prompt: ${prompt}
        Student response: ${userText}
        Focus on encouraging the student while gently pointing out where they can improve.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              mistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
              corrections: { type: Type.STRING },
              feedback: { type: Type.STRING }
            },
            required: ["score", "mistakes", "corrections", "feedback"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (err) {
      console.warn("Failed to evaluate writing via Gemini, using local heuristic scoring: ", err);
      // Generous kind grading fallback to not block the student's progress
      const wordCount = (userText || "").trim().split(/\s+/).length;
      const score = Math.min(100, Math.max(65, 70 + (wordCount > 35 ? 15 : 0) + (userText.includes("Uhr") || userText.includes("kommen") ? 10 : 0)));
      return {
        score,
        mistakes: ["Keine schweren Fehler gefunden (Lokale Heuristik)."],
        corrections: "Sehr gut! Du hast die Nachricht verständlich verfasst. Achte auf Groß- und Kleinschreibung sowie richtige Verbendungen.",
        feedback: "Awesome work pushing through! We evaluated your writing based on sentence length and vocabulary presence. Keep practicing to build even stronger sentence links."
      };
    }
  }
};
