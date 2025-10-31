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
const MODEL  = 'models/gemini-2.5-flash';
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

  // Texto libre
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

  // Estructurado (JSON)
  if (action === 'generateStructured') {
    const prompt: string = payload?.prompt ?? '';
    // Nota: schema está disponible por si quieres incluirlo en el prompt
    const schema = payload?.schema;

    // Pedimos JSON explícitamente en el prompt
    const finalPrompt =
      `${prompt}\n\n` +
      `Responde SOLO con JSON válido sin texto adicional, sin explicación y sin fences.`;

    const requestBody = {
      contents: [{ role: 'user', parts: [{ text: finalPrompt }]}],
      // sin responseMimeType (no soportado en v1 para REST)
    };

    const r = await callGemini(requestBody);
    if (!r.ok) return send(res, r.status, { error: 'LLM error', raw: r.body });

    // Extraemos texto del candidate
    let textOut = '';
    try {
      const j = JSON.parse(r.body as string);
      textOut = j?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    } catch {
      textOut = String(r.body ?? '');
    }

    // Limpieza de fences/preámbulos tipo ```json / json\n
    let clean = (textOut ?? '').trim();
    clean = clean.replace(/^```(?:json)?\s*/i, '');
    clean = clean.replace(/```$/i, '');
    clean = clean.replace(/^json\s*\n/i, '');
    clean = clean.trim();

    // Parseo robusto
    try {
      const obj = JSON.parse(clean);
      return send(res, 200, obj);
    } catch {
      return send(res, 422, { error: 'Non-JSON response', raw: clean });
    }
  }

  // Acción desconocida
  return send(res, 400, { error: `Unknown action: ${action}` });
}