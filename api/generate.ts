// /api/generate.ts  (Vercel Node runtime)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_API_KEY || '';
const MODEL_ID = 'gemini-1.5-flash';

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

function bad(res: VercelResponse, code: number, msg: string, extra?: any) {
  console.error(`[/api/generate] ${code}: ${msg}`, extra || '');
  return res.status(code).json({ error: msg, details: extra });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return bad(res, 405, 'Method not allowed');
    }
    if (!API_KEY || !genAI) {
      return bad(res, 500, 'GOOGLE_API_KEY is missing on server');
    }

    const { action, payload } = (req.body ?? {}) as {
      action?: string;
      payload?: any;
    };
    if (!action) return bad(res, 400, 'Missing action');

    // Helper: genera texto libre
    const generateText = async (prompt: string) => {
      const model = genAI.getGenerativeModel({ model: MODEL_ID });
      const out = await model.generateContent(prompt);
      return out.response?.text() ?? '';
    };

    // Helper: genera JSON (sin obligar responseMimeType; parseamos manual)
    const generateJSON = async (prompt: string) => {
      const model = genAI.getGenerativeModel({ model: MODEL_ID });
      const out = await model.generateContent(
        prompt +
          '\n\nDEVUELVE ÚNICAMENTE JSON VÁLIDO, sin texto extra, siguiendo el esquema pedido.'
      );
      const raw = out.response?.text() ?? '';
      try {
        return { ok: true as const, data: JSON.parse(raw) };
      } catch (e) {
        return { ok: false as const, raw, parseError: String(e) };
      }
    };

    switch (action) {
      case 'generateText': {
        const prompt: string = payload?.prompt ?? '';
        const text = await generateText(prompt);
        return res.status(200).json({ text });
      }

      // Lista de dispositivos
      case 'fetchAssistiveDevices': {
        const prompt: string = payload?.prompt ?? '';
        // Esperamos { dispositivos: [{ nombre, descripcion, caracteristicas[] }] }
        const r = await generateJSON(prompt);
        if (!r.ok) return bad(res, 422, 'JSON parse failed', r);
        return res.status(200).json(r.data);
      }

      // Lista de funcionalidades
      case 'fetchAssistiveFunctionalities': {
        const prompt: string = payload?.prompt ?? '';
        // Esperamos { funcionalidades: [{ nombre, descripcion, plataformas[] }] }
        const r = await generateJSON(prompt);
        if (!r.ok) return bad(res, 422, 'JSON parse failed', r);
        return res.status(200).json(r.data);
      }

      // (Placeholder) Generación de imagen no implementada aquí
      case 'generateImageForTerm': {
        return bad(res, 501, 'Image generation not implemented in this endpoint');
      }

      default:
        return bad(res, 400, `Unknown action: ${action}`);
    }
  } catch (err: any) {
    // Mostramos mensaje y lo reenviamos al cliente para depurar
    return bad(res, 500, err?.message || 'Server error', {
      stack: err?.stack,
      cause: err?.cause,
    });
  }
}