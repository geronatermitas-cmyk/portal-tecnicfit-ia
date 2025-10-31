// api/generate.ts  (Vercel Node Runtime, sin @vercel/node)
import type { IncomingMessage, ServerResponse } from 'http';

// Tipos mínimos para contentar a TypeScript (Vercel añade estos métodos en runtime)
type VercelRequest = IncomingMessage & {
  method?: string;
  body?: any;
};
type VercelResponse = ServerResponse & {
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string) => VercelResponse;
  send: (body: any) => void;
};

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'models/gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1/${MODEL}:generateContent`;

/** Envío JSON con status */
function send(res: VercelResponse, status: number, body: unknown) {
  res
    .status(status)
    .setHeader('Content-Type', 'application/json')
    .send(typeof body === 'string' ? body : JSON.stringify(body));
}

/** Llamada básica a Gemini v1 generateContent */
async function callGemini(body: unknown) {
  if (!API_KEY) {
    return { ok: false as const, status: 500, body: { error: 'Missing GOOGLE_API_KEY' } };
  }
  try {
    const resp = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await resp.text();
    if (!resp.ok) {
      return { ok: false as const, status: resp.status, body: text };
    }
    return { ok: true as const, status: 200, body: text };
  } catch (e: any) {
    return { ok: false as const, status: 500, body: { error: e?.message ?? 'Server error' } };
  }
}

/** Extrae el texto plano de la respuesta de Gemini v1 */
function extractText(geminiJson: any): string {
  const parts = geminiJson?.candidates?.[0]?.content?.parts;
  const txt = Array.isArray(parts) ? parts.map((p: any) => p?.text ?? '').join('') : '';
  return txt ?? '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Method not allowed' });
  }

  // Vercel parsea JSON en req.body; si viniera string, intenta parsear
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { /* ignorar */ }
  }

  const { action, payload } = (body ?? {}) as { action?: string; payload?: any };
  if (!action) return send(res, 400, { error: 'Missing action' });

  // Ping simple para pruebas
  if (action === 'ping') {
    return send(res, 200, { ok: true, message: 'Pong!' });
  }

  if (action === 'generateText') {
    const prompt: string = payload?.prompt ?? '';
    const requestBody = {
      contents: [{ role: 'user', parts: [{ text: prompt }]}],
      generationConfig: { temperature: 0.7 },
    };
    const r = await callGemini(requestBody);
    if (!r.ok) return send(res, r.status, { error: 'Server error', details: r.body });

    const data = JSON.parse(r.body as string);
    const text = extractText(data);
    return send(res, 200, { text });
  }

  if (action === 'generateStructured') {
    // Forzamos salida JSON vía prompt y validamos aquí
    const prompt: string = payload?.prompt ?? '';
    const schema = payload?.schema; // lo incluimos en el prompt para guiar
    const sys = [
      'Responde SOLO con JSON válido, sin texto adicional.',
      'Ajusta exactamente la estructura solicitada.',
    ].join(' ');

    const fullPrompt =
      `${sys}\n\nEsquema orientativo:\n${JSON.stringify(schema)}\n\n` +
      `Instrucción:\n${prompt}`;

    const requestBody = {
      contents: [{ role: 'user', parts: [{ text: fullPrompt }]}],
      generationConfig: { temperature: 0.4 },
    };

    const r = await callGemini(requestBody);
    if (!r.ok) return send(res, r.status, { error: 'Server error', details: r.body });

    try {
      const data = JSON.parse(r.body as string);
      const text = extractText(data).trim();

      try {
        const parsed = JSON.parse(text);
        return send(res, 200, { data: parsed, raw: text });
      } catch {
        // Si no fue JSON puro, devolvemos 422 con el texto crudo para que el front lo muestre
        return send(res, 422, { error: 'Non-JSON response', raw: text });
      }
    } catch (e: any) {
      return send(res, 500, { error: 'Bad response from model', details: e?.message });
    }
  }

  return send(res, 400, { error: `Unknown action: ${action}` });
}