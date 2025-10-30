// api/generate.ts  (Node Runtime en Vercel)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { action, payload } = (req.body ?? {}) as {
      action?: string;
      payload?: any;
    };
    if (!action) return res.status(400).json({ error: 'Missing action' });

    switch (action) {
      case 'generateText': {
        const prompt: string = payload?.prompt ?? '';
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        return res.status(200).json({ text: result.response.text() });
      }

      // Si más adelante quieres imágenes, implementa aquí con la API que uses
      case 'generateImageForTerm': {
        return res
          .status(501)
          .json({ error: 'Image generation not implemented in this endpoint' });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? 'Server error' });
  }
}
