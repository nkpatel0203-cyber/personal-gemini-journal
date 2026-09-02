import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    geminiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// 2. Comprehensive AI Journal Reflection & Deep Coaching
app.post('/api/gemini/reflect', async (req, res) => {
  try {
    const { title, content, mood, gratitudes, dailyIntention } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Journal content is required for reflection' });
    }

    const ai = getGemini();

    const prompt = `You are Gemini, a compassionate, deeply perceptive, and psychologically grounded reflective journaling companion.
Analyze the following personal journal entry and provide a holistic, empathetic reflection.

Entry Title: ${title || 'Untitled'}
Mood Selected: ${mood || 'Not specified'}
Daily Intention: ${dailyIntention || 'None'}
Gratitude Notes: ${Array.isArray(gratitudes) ? gratitudes.join(', ') : 'None'}

Journal Content:
"""
${content}
"""

Please provide your reflection strictly adhering to this JSON schema:
- summary: A concise, poetic, and affirming summary of what the writer experienced or expressed (2-3 sentences).
- emotionalTone: A sensitive description of the emotional undercurrent (e.g. "Quiet resolve intertwined with tender vulnerability").
- keyThemes: Array of 2 to 4 major psychological or life themes (e.g. ["Boundary setting", "Self-compassion", "Creative flow"]).
- insights: Array of 2 to 3 profound, encouraging, yet honest personal insights on what this reveals about their values, resilience, or cognitive patterns.
- growthOpportunities: Array of 1 to 2 gentle, practical perspective shifts or micro-habits.
- socraticQuestion: One evocative, open-ended question for their next quiet contemplation or future entry.
- reframing: A kind, wise reframing of any self-criticism, fear, or frustration present in the text (or an encouraging affirmation if already positive).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a mindful, emotionally intelligent journaling guide. Speak with warmth, clarity, dignity, and insight. Avoid clinical or robotic jargon.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            emotionalTone: { type: Type.STRING },
            keyThemes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            growthOpportunities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            socraticQuestion: { type: Type.STRING },
            reframing: { type: Type.STRING },
          },
          required: [
            'summary',
            'emotionalTone',
            'keyThemes',
            'insights',
            'growthOpportunities',
            'socraticQuestion',
            'reframing',
          ],
        },
      },
    });

    const jsonText = response.text?.trim() || '{}';
    const parsedData = JSON.parse(jsonText);

    return res.json({
      success: true,
      reflection: {
        ...parsedData,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating journal reflection:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate reflection with Gemini',
    });
  }
});

// 3. Dynamic Mindful Journal Prompts Generator
app.post('/api/gemini/prompt', async (req, res) => {
  try {
    const { mood, category, recentContext } = req.body;
    const ai = getGemini();

    const prompt = `Generate 3 distinct, deeply evocative, and introspective journaling prompts for a writer right now.
Context:
- Mood: ${mood || 'Open'}
- Category: ${category || 'General Reflection'}
- Recent focus/context: ${recentContext || 'Fresh perspective'}

Return JSON format with a list of prompts. Each prompt should have:
- prompt: The core provocative journaling question/exercise.
- context: A brief sentence on why this prompt is meaningful.
- tag: A short badge like "Deep Work", "Gratitude", "Inner Voice", "Unwind".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  prompt: { type: Type.STRING },
                  context: { type: Type.STRING },
                  tag: { type: Type.STRING },
                },
                required: ['prompt', 'context', 'tag'],
              },
            },
          },
          required: ['prompts'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{"prompts": []}');
    return res.json({ success: true, prompts: parsed.prompts });
  } catch (error: any) {
    console.error('Error generating prompts:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate prompts',
    });
  }
});

// 4. Conversational Socratic Journaling Companion
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, entryContext } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const ai = getGemini();

    // Format conversation history for Gemini
    const systemPrompt = `You are Gemini, a private, compassionate, and wise reflective journaling companion.
The user is writing or exploring their journal entry in real-time.
Your goal is to gently hold space, ask insightful Socratic follow-up questions, validate their feelings without unsolicited fixing, and help them uncover their own truths.
Keep responses concise, conversational (2-4 paragraphs max), warm, and focused on self-discovery.

Current Entry Context:
Title: ${entryContext?.title || 'Draft Entry'}
Mood: ${entryContext?.mood || 'Unspecified'}
Current Text:
"""
${entryContext?.content || '(Starting to write)'}
"""`;

    // Construct multi-turn contents
    const contents = [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nLet us begin our reflective dialogue.` }],
      },
      {
        role: 'model',
        parts: [
          {
            text: `I am here with you in this quiet space. Take your time, breathe, and share whatever is on your mind. What feels most present for you right now?`,
          },
        ],
      },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: contents as any,
    });

    return res.json({
      success: true,
      message: {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: response.text || '',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in chat:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to process reflection chat',
    });
  }
});

// 5. Holistic Multi-Entry Synthesis & Emotional Landscape (Weekly / Monthly)
app.post('/api/gemini/synthesis', async (req, res) => {
  try {
    const { entries, timeframe } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'Entries are required for synthesis' });
    }

    const ai = getGemini();

    const formattedSummaries = entries
      .slice(0, 20)
      .map(
        (e: any, i: number) =>
          `[Entry ${i + 1}] Date: ${e.date?.slice(0, 10)} | Mood: ${e.mood} | Title: ${e.title}\nContent snippet: ${e.content?.slice(0, 350)}...\nGratitude: ${e.gratitudes?.join(', ') || 'N/A'}`
      )
      .join('\n\n');

    const prompt = `Synthesize these ${entries.length} journal entries across the ${timeframe || 'recent period'}.
Entries overview:
${formattedSummaries}

Provide a deep, encouraging, and narrative holistic synthesis with the following structure in JSON:
- timeframe: e.g. "Past 7 Days" or "Past Month"
- dominantThemes: Array of 3 to 5 recurring themes across entries.
- emotionalArc: A paragraph articulating the writer's emotional journey, shifts in energy, and emerging resilience over this timeframe.
- growthCelebrations: Array of 2 to 3 meaningful breakthroughs, moments of courage, or self-awareness exhibited.
- compassionateNudge: A gentle, supportive encouragement for their upcoming week.
- affirmation: A tailor-made, grounded mantra/affirmation derived directly from their own experiences.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            timeframe: { type: Type.STRING },
            dominantThemes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            emotionalArc: { type: Type.STRING },
            growthCelebrations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            compassionateNudge: { type: Type.STRING },
            affirmation: { type: Type.STRING },
          },
          required: [
            'timeframe',
            'dominantThemes',
            'emotionalArc',
            'growthCelebrations',
            'compassionateNudge',
            'affirmation',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({
      success: true,
      synthesis: {
        ...parsed,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating synthesis:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate period synthesis',
    });
  }
});

// 6. Suggest Smart Titles and Meaningful Tags
app.post('/api/gemini/suggest-title-tags', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content required' });
    }

    const ai = getGemini();
    const prompt = `Given this journal entry content, suggest 3 elegant, expressive titles and 4 to 6 relevant tags.
Content:
"""
${content.slice(0, 1500)}
"""

Return JSON format:
- titles: Array of 3 title suggestions (ranging from poetic to descriptive).
- tags: Array of 4 to 6 concise tags (e.g. ["mindfulness", "career", "gratitude", "clarity"]).
- suggestedMood: One of: "serene", "grateful", "energized", "reflective", "creative", "overwhelmed", "melancholic", "hopeful", "grounded".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestedMood: { type: Type.STRING },
          },
          required: ['titles', 'tags', 'suggestedMood'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error('Error suggesting titles and tags:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate suggestions',
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Personal Gemini Journal server running on http://localhost:${PORT}`);
  });
}

startServer();
