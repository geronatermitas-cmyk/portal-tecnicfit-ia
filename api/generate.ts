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
    // dentro del switch (action)
case 'generateStructured': {
  const prompt: string = payload?.prompt ?? '';
  const schema = payload?.schema ?? undefined;

  // Construimos el body mínimo compatible con v1
  const body: any = {
    contents: [{ role: 'user', parts: [{ text: prompt }]}],
  };

  // Llamada al modelo
  const resp = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const rawText = await resp.text();      // ← puede venir con fences
  if (!resp.ok) {
    return send(res, resp.status, { error: 'LLM error', raw: rawText });
  }

  // Extrae el texto del candidate
  let textOut = '';
  try {
    const j = JSON.parse(rawText);
    textOut = j?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  } catch {
    textOut = rawText; // fallback
  }

  // Limpieza de fences y prefijos tipo "json\n"
  let clean = (textOut ?? '').trim();
  clean = clean.replace(/^```(?:json)?\s*/i, ''); // quita ```json o ```
  clean = clean.replace(/```$/i, '');             // quita cierre ```
  clean = clean.replace(/^json\s*\n/i, '');       // quita "json\n" inicial
  clean = clean.trim();

  // Intenta parsear a JSON
  try {
    const obj = JSON.parse(clean);
    return send(res, 200, obj);
  } catch (e: any) {
    // Devuelve 422 con el bruto para que el front lo muestre
    return send(res, 422, { error: 'Non-JSON response', raw: clean });
  }
}