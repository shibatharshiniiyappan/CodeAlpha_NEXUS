import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API Route for NEXUS Context-Aware Assistant
app.post('/api/assistant', async (req, res) => {
  const { prompt, context } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `You are NEXUS Assistant, an authoritative AI intelligence agent for the NEXUS Smart City Operations and Decision Support Platform.
You assist city operations directors by analyzing simulated smart city telemetry across mobility, energy microgrids, atmospheric quality, and building intelligence.
Guidelines:
1. Base your response directly on the provided context (selected district, selected building, active alerts, policy scenario settings, and predictive risk assessments).
2. Maintain a professional, executive command-center tone.
3. Be concise, structured, and quantitative where telemetry values are available.
4. Note that all data represents synthetic simulated telemetry for urban decision-support exploration.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `CURRENT URBAN TELEMETRY CONTEXT:\n${JSON.stringify(
                  context,
                  null,
                  2
                )}\n\nUSER QUESTION: ${prompt}`,
              },
            ],
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      const text = response.text || '';
      return res.json({
        reply: text,
        isAiGenerated: true,
        modelUsed: 'gemini-3.8-flash',
      });
    } catch (error) {
      console.warn('Gemini API call returned an error, falling back:', error);
    }
  }

  // Graceful fallback for environments without an active API key
  return res.status(503).json({
    error: 'Gemini API unavailable or key unconfigured, client local engine active',
  });
});

// Vite Dev Server or Production Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`NEXUS Command Server online at http://localhost:${PORT}`);
  });
}

startServer();
