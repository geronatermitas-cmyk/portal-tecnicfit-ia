// api/generate.ts — compatible con CommonJS en Vercel
// ❗️Sin imports ESM. Usamos require() y module.exports.

type VercelRequest = any;
type VercelResponse = any;

// Carga del SDK en CommonJS
// @ts-ignore
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY =
  process.env.GOOGLE_API_KEY ||
  process.env.API_KEY ||
  '';

/** Pequeña ayuda para devolver errores consistentes */
function sendError(res: VercelResponse, status: number, msg: string, details?: any) {
  return res.status(status).json({ error: msg, details });
}

module.exports = async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!API_KEY) {
    return sendError(
      res,
      500,
      'Missing API key',
      'Define GOOGLE_API_KEY (o API_KEY) en Vercel → Project → Settings → Environment Variables y redeploy.'
    );
  }

  // Instancia aquí (tras validar clave) para evitar crear el cliente si no hay KEY
  const genAI = new GoogleGenerativeAI(API_KEY);

  try {
    const body = req.body || {};
    const action: string | undefined = body.action;
    const payload: any = body.payload;

    if (!action) return sendError(res, 400, 'Missing action');

    switch (action) {
      /** Texto libre (si lo usas) */
      case 'generateText': {
        const prompt: string = payload?.prompt ?? '';
        if (!prompt) return sendError(res, 400, 'Missing prompt');

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        return res.status(200).json({ text: result.response.text() });
      }

      /** Estructurado (lo que llaman tus pantallas de Catálogo/Funcionalidades) */
      case 'generateStructured': {
        const prompt: string = payload?.prompt ?? '';
        const schema: any = payload?.schema;
        if (!prompt) return sendError(res, 400, 'Missing prompt');
        if (!schema) return sendError(res, 400, 'Missing schema');

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schema,
          } as any,
        });

        const text = result.response.text() || '';
        try {
          const data = JSON.parse(text);
          return res.status(200).json({ data });
        } catch {
          // Si el modelo no respetó el JSON estricto, devolvemos 422 con el texto bruto
          return res.status(422).json({
            error: 'Structured JSON parse failed',
            raw: text,
          });
        }
      }

      /** Aún no implementado (si decides añadir imágenes) */
      case 'generateImageForTerm': {
        return res.status(501).json({ error: 'Image generation not implemented' });
      }

      default:
        return sendError(res, 400, `Unknown action: ${action}`);
    }
  } catch (e: any) {
    console.error('API /api/generate error:', e?.message || e);
    return sendError(res, 500, 'Server error', e?.message || String(e));
  }
};