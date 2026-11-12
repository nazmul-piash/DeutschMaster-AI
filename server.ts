import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const TEXT_MODEL = 'gemini-4-hydrogen';
const TTS_MODEL = 'gemini-3.8-flash-lite-tts';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getErrorStatus(error: unknown): number {
  if (error && typeof error === 'object') {
    const status = (error as { status?: unknown }).status;
    if (typeof status === 'number' && status >= 400 && status < 600) {
      return status;
    }
  }
  return 500;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // 1. Generate Lesson Content
  app.post('/api/gemini/lesson', async (req: Request, res: Response) => {
    try {
      const { level, topic } = req.body ?? {};
      if (!level || !topic) {
        res.status(400).json({ error: 'Missing required fields: level and topic.' });
        return;
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
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

      res.json({ text: response.text || '' });
    } catch (error) {
      console.error('Error in /api/gemini/lesson:', error);
      res.status(getErrorStatus(error)).json({ error: getErrorMessage(error) });
    }
  });

  // 2. Text-to-Speech (TTS)
  app.post('/api/gemini/tts', async (req: Request, res: Response) => {
    try {
      const { text } = req.body ?? {};
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Missing required field: text.' });
        return;
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Speak this German text in a warm, friendly, and clear voice: ${text}`,
                speechMetadata: {
                  style: 'Warm, friendly, and clear German language tutor',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      const audioBase64 = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType || 'audio/wav';

      if (!audioBase64) {
        res.status(502).json({ error: 'No audio returned by TTS model.' });
        return;
      }

      res.json({ audioBase64, mimeType });
    } catch (error) {
      console.error('Error in /api/gemini/tts:', error);
      res.status(getErrorStatus(error)).json({ error: getErrorMessage(error) });
    }
  });

  // 3. Generate Quiz
  app.post('/api/gemini/quiz', async (req: Request, res: Response) => {
    try {
      const { level, topic, difficulty = 'Medium' } = req.body ?? {};
      if (!level || !topic) {
        res.status(400).json({ error: 'Missing required fields: level and topic.' });
        return;
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
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
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                questionEn: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['question', 'questionEn', 'options', 'correctAnswer', 'explanation'],
            },
          },
        },
      });

      const questions = JSON.parse(response.text || '[]');
      res.json({ questions });
    } catch (error) {
      console.error('Error in /api/gemini/quiz:', error);
      res.status(getErrorStatus(error)).json({ error: getErrorMessage(error) });
    }
  });

  // 4. Generate Exam Content
  app.post('/api/gemini/exam', async (req: Request, res: Response) => {
    try {
      const { level, module, customPrompt } = req.body ?? {};
      if (!level || !module) {
        res.status(400).json({ error: 'Missing required fields: level and module.' });
        return;
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents:
          customPrompt ||
          `Generate a professional ${level} German exam for the ${module} module.
        If module is 'Reading', provide a text and 5 questions.
        If module is 'Listening', provide a text that will be read aloud and 5 questions.
        If module is 'Writing', provide a prompt.
        If module is 'Speaking', provide 3 discussion points.
        Return the result in JSON format.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: 'The text to read or listen to' },
              textTranslation: { type: Type.STRING, description: 'The English translation of the text' },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    questionTranslation: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                  },
                  required: ['question', 'options', 'correctAnswer'],
                },
              },
              writingPrompt: { type: Type.STRING },
              writingPromptTranslation: { type: Type.STRING },
              speakingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              speakingPointsTranslation: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
      });

      if (!response.text) {
        res.status(502).json({ error: 'Empty response from Gemini API' });
        return;
      }

      const exam = JSON.parse(response.text);
      res.json(exam);
    } catch (error) {
      console.error('Error in /api/gemini/exam:', error);
      res.status(getErrorStatus(error)).json({ error: getErrorMessage(error) });
    }
  });

  // 5. Evaluate Writing
  app.post('/api/gemini/evaluate-writing', async (req: Request, res: Response) => {
    try {
      const { level, prompt, userText } = req.body ?? {};
      if (!level || prompt === undefined || userText === undefined) {
        res.status(400).json({ error: 'Missing required fields: level, prompt, and userText.' });
        return;
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Evaluate this ${level} writing task as a supportive and kind German tutor.
        Prompt: ${prompt}
        Student response: ${userText}
        Focus on encouraging the student while gently pointing out where they can improve.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              mistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
              corrections: { type: Type.STRING },
              feedback: { type: Type.STRING },
            },
            required: ['score', 'mistakes', 'corrections', 'feedback'],
          },
        },
      });

      const evaluation = JSON.parse(response.text || '{}');
      res.json(evaluation);
    } catch (error) {
      console.error('Error in /api/gemini/evaluate-writing:', error);
      res.status(getErrorStatus(error)).json({ error: getErrorMessage(error) });
    }
  });

  // 6. Generate Flashcards
  app.post('/api/gemini/flashcards', async (req: Request, res: Response) => {
    try {
      const {
        level,
        type,
        selectedCategories = [],
        excludeGermanWords = [],
      } = req.body ?? {};

      if (!level || !type) {
        res.status(400).json({ error: 'Missing required fields: level and type.' });
        return;
      }

      const categoryPrompt =
        Array.isArray(selectedCategories) && selectedCategories.length > 0
          ? `Focus primarily on these themes: ${selectedCategories.join(', ')}.`
          : '';

      const excludePrompt =
        Array.isArray(excludeGermanWords) && excludeGermanWords.length > 0
          ? `Ensure you DO NOT generate any of the following already learned or loaded words/phrases: ${excludeGermanWords.slice(0, 100).join(', ')}.`
          : '';

      let typeSpecificPrompt = '';
      if (type === 'word') {
        typeSpecificPrompt = `Generate 12 fresh German nouns, verbs, or adjectives (useful for daily conversation). Nouns MUST include their definite article (der, die, or das) in the 'german' field. Specify the 'gender' as 'der', 'die', or 'das' and provide the raw noun without article in 'nounWithoutArticle'. All items must have 'type' set to 'word'.`;
      } else if (type === 'sentence') {
        typeSpecificPrompt = `Generate 12 helpful, conversational daily German phrases or complete sentences and their English translations. The 'german' field contains the full sentence. Do NOT specify 'gender' or 'nounWithoutArticle' fields for sentences. All items must have 'type' set to 'sentence'.`;
      } else if (type === 'article') {
        typeSpecificPrompt = `Generate 12 German nouns ONLY (which have clear genders: der, die, or das). The 'german' field must STILL include the article (e.g., 'der Hund'), but the 'gender' field MUST specify ('der' | 'die' | 'das') and the 'nounWithoutArticle' field MUST specify the raw noun (e.g., 'Hund'). The student will practice identifying the gender of these nouns. All items must have 'type' set to 'word'.`;
      }

      const prompt = `You are a professional German languages curriculum designer. Create exactly 12 highly engaging German-English flashcards matching level: ${level} and type: ${type}.
      
      Requirements:
      ${typeSpecificPrompt}
      ${categoryPrompt}
      ${excludePrompt}

      Return a JSON array of objects conforming to the FlashcardItem schema.`;

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "A unique random string ID (e.g. 'ai-w-1029')" },
                german: { type: Type.STRING, description: 'The German word or phrase (with article if noun, or the full sentence)' },
                english: { type: Type.STRING, description: 'Clear English translation' },
                pronunciation: { type: Type.STRING, description: "IPA phonetic spelling (e.g., '[ˈʃlʏsl̩]')" },
                hint: { type: Type.STRING, description: 'Brief didactic hint in English helping the user remember or understand the grammar/use' },
                exampleGerman: { type: Type.STRING, description: 'An example German sentence using this item' },
                exampleEnglish: { type: Type.STRING, description: 'English translation of the example sentence' },
                type: { type: Type.STRING, enum: ['word', 'sentence'], description: "The type of item (use 'word' for nouns/verbs, 'sentence' for sentences)" },
                category: { type: Type.STRING, enum: ['work', 'personal', 'family', 'education', 'shopping', 'small_talk'], description: 'Select the most appropriate matching category' },
                gender: { type: Type.STRING, enum: ['der', 'die', 'das'], description: "Definite article if it's a noun. Omit for sentences." },
                nounWithoutArticle: { type: Type.STRING, description: 'For nouns: raw word without der/die/das. Omit for sentences.' },
              },
              required: ['id', 'german', 'english', 'pronunciation', 'hint', 'exampleGerman', 'exampleEnglish', 'type', 'category'],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '[]');
      const items = parsed.map((item: Record<string, unknown>) => ({
        ...item,
        level,
        id: (item.id as string) || `ai-${type}-${Math.random().toString(36).slice(2, 11)}`,
      }));

      res.json({ items });
    } catch (error) {
      console.error('Error in /api/gemini/flashcards:', error);
      res.status(getErrorStatus(error)).json({ error: getErrorMessage(error) });
    }
  });

  // Frontend serving (Vite dev middleware in development, static dist in production)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((req: Request, res: Response, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
        return;
      }
      next();
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
