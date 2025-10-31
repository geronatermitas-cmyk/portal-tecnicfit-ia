// api/generate.ts  (Node/Edge en Vercel, ESM)
// Asegúrate de tener "type": "module" en package.json

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  throw new Error('Missing GOOGLE_API_KEY in environment variables');
}

// Usa un modelo DISPONIBLE para tu clave (según tu listado v1)
const MODEL_TEXT = 'gemini-2.5-flash';

const genAI = new GoogleGenerativeAI(API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, payload } = (req.body ?? {}) as {
      action?: string;
      payload?: any;
    };

    if (!action) {
      return res.status(400).json({ error: 'Missing action' });
    }

    switch (action) {
      case 'generateText': {
        const prompt: string = payload?.prompt ?? '';
        const model = genAI.getGenerativeModel({ model: MODEL_TEXT });
        const result = await model.generateContent(prompt);
        const text = result.response?.text?.() ?? '';
        return res.status(200).json({ text });
      }

      case 'generateStructured': {
        // Espera: { prompt: string, schema: object }
        const prompt: string = payload?.prompt ?? '';
        const schemaObj: any = payload?.schema ?? null;

        if (!prompt || !schemaObj) {
          return res.status(400).json({ error: 'Missing prompt or schema' });
        }

        const model = genAI.getGenerativeModel({ model: MODEL_TEXT });

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          // Forzamos JSON puro con schema v1 del SDK
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schemaObj as any, // { type: 'object', properties: { ... }, required: [...] }
          },
        });

        const raw = result.response?.text?.() ?? '{}';
        // El SDK devuelve el JSON como string; lo parseamos para darte un objeto
        let data: unknown;
        try {
          data = JSON.parse(raw);
        } catch {
          return res.status(422).json({ error: 'LLM returned non-JSON', raw });
        }
        return res.status(200).json({ data });
      }

      case 'generateImageForTerm': {
        // Aún no implementado (stub)
        return res
          .status(501)
          .json({ error: 'Image generation not implemented in this endpoint' });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (e: any) {
    // Devuelve mensaje y detalles del SDK si están
    const msg = e?.message ?? 'Server error';
    const details = e?.toString?.() ?? String(e);
    return res.status(500).json({ error: 'Server error', details: details || msg });
  }
}