
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProficiencyLevel, QuizQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export const geminiService = {
  async generateLessonContent(level: ProficiencyLevel, topic: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a certified Goethe-Institut examiner. Generate an academically rigorous ${level} lesson about: ${topic}.
      Follow CEFR (Common European Framework of Reference for Languages) standards.
      
      Structure:
      1. Learning Objectives (Academic).
      2. Essential Vocabulary (15 words + articles for nouns).
      3. Grammar Lab: Detailed explanation of rules with examples.
      4. Goethe Exam Context: How this topic appears in official exams.
      5. Useful Phrases: 5 formal and 5 informal sentences.
      6. Kurzfassung (Summary in German).`,
    });
    return response.text;
  },

  async speakText(text: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Speak this German text clearly and professionally: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Professional German-sounding voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), audioCtx);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
    }
  },

  async generateQuiz(level: ProficiencyLevel, topic: string): Promise<QuizQuestion[]> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a 5-question multiple choice quiz for ${level} based on official German exam patterns (Goethe/Telc). Topic: ${topic}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  },

  async evaluateWriting(level: ProficiencyLevel, prompt: string, userText: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Evaluate this ${level} writing task as a Goethe-Institut examiner.
      Prompt: ${prompt}
      Student response: ${userText}
      Score based on: Vocabulary, Grammar Accuracy, and Task Completion.`,
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
  }
};
