
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

  async speakText(text: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
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
      contents: `Generate a fun and encouraging 5-question multiple choice quiz for ${level} learners. Topic: ${topic}. Make the questions feel like a game!`,
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

  async generateExamContent(level: ProficiencyLevel, module: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a professional ${level} German exam for the ${module} module.
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
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING }
                },
                required: ["question", "options", "correctAnswer"]
              }
            },
            writingPrompt: { type: Type.STRING },
            speakingPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async evaluateWriting(level: ProficiencyLevel, prompt: string, userText: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
  }
};
