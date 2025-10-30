// api/generate.ts
// Función Serverless compatible con Vercel (Node.js Runtime)
// Maneja peticiones POST desde el frontend (fetch desde geminiService.ts)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Inicialización segura ---
const API_KEY = process.env.API_KEY || process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  throw new Error("❌ Falta la variable de entorno API_KEY (configúrala en Vercel).");
}
const genAI = new GoogleGenerativeAI(API_KEY);

// --- Handler principal ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, payload } = req.body || {};
    if (!action || !payload) {
      return res.status(400).json({ error: 'Missing action or payload' });
    }

    let result;

    switch (action) {
      // Generar texto estructurado (JSON con dispositivos o funcionalidades)
      case 'fetchAssistiveDevices':
      case 'fetchAssistiveFunctionalities': {
        const prompt = payload.prompt;
        const schema = payload.schema;

        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        });

        const response = await model.generateContent(prompt);
        const text = response.response.text();

        try {
          result = JSON.parse(text);
        } catch (e) {
          console.error('Error al parsear JSON desde Gemini:', text);
          return res.status(500).json({ error: 'Invalid JSON returned by Gemini' });
        }

        break;
      }

      // Generación de imagen (por ahora devuelves placeholder)
      case 'generateImageForTerm': {
        const TRANSPARENT_PNG =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEklEQVR42mP8/5+hHgMDAwMjAAAmQwO1PqkW2QAAAABJRU5ErkJggg==';
        result = { imageUrl: TRANSPARENT_PNG };
        break;
      }

      // Texto libre (si lo necesitas para debugging)
      case 'generateText': {
        const prompt: string = payload?.prompt ?? '';
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const response = await model.generateContent(prompt);
        result = { text: response.response.text() };
        break;
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('API Error:', error);
    return res
      .status(500)
      .json({ error: error?.message || 'An internal server error occurred' });
  }
}