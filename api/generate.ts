// api/generate.ts  (Vercel Node Runtime)
import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = process.env.GOOGLE_API_KEY;
// Usa un modelo que SÍ te aparece en /v1/models
const MODEL = 'models/gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1/${MODEL}:generateContent`;

function send(res: VercelResponse, status: number, body: unknown) {
  res.status(status)
    .setHeader('Content-Type', 'application/json')
    .send(JSON.stringify(body));
}

async function callGemini(body: unknown) {
  if (!API_KEY) return { ok: false, status: 500, body: { error: 'Missing GOOGLE_API_KEY' } };

  let resp: Response;
  try {
    resp = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    return { ok: false, status: 502, body: { error: 'Network error to Google', details: e?.message || String(e) } };
  }

  const text = await resp.text();
  if (!resp.ok) {
    return { ok: false, status: 502, body: { error: 'Upstream error', status: resp.status, details: text } };
  }

  try {
    return { ok: true, status: 200, body: JSON.parse(text) };
  } catch {
    return { ok: true, status: 200, body: { raw: text } };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  try {
    const { action, payload } = (req.body ?? {}) as { action?: string; payload?: any };
    if (!action) return send(res, 400, { error: 'Missing action' });

    if (action === 'generateText') {
      const prompt: string = payload?.prompt ?? '';
      if (!prompt) return send(res, 400, { error: 'Missing prompt' });

      const up = await callGemini({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      if (!up.ok) return send(res, up.status, up.body);

      const parts = (up.body as any)?.candidates?.[0]?.content?.parts ?? [];
      const text = parts.map((p: any) => p?.text || '').join('');
      return send(res, 200, { text });
    }

    if (action === 'generateStructured') {
      const prompt = payload?.prompt;
      const schema = payload?.schema;
      if (!prompt || !schema) return send(res, 400, { error: 'Missing prompt or schema' });

      const up = await callGemini({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema, // JSON Schema plano (objetos/arrays/strings)
        },
      });
      if (!up.ok) return send(res, up.status, up.body);

      // El modelo devuelve JSON como texto dentro de parts[].text
      const raw = (up.body as any)?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text || '')
        .join('') ?? '{}';

      try {
        const data = JSON.parse(raw);
        return send(res, 200, { data });
      } catch {
        // Si por lo que sea devuelve Markdown o texto no JSON, devolvemos 422 con el raw
        return send(res, 422, { error: 'LLM returned non-JSON', raw });
      }
    }

    if (action === 'generateImageForTerm') {
      // Aún no implementado; el frontend ahora mismo no debería llamarlo
      return send(res, 501, { error: 'Image generation not implemented' });
    }

    return send(res, 400, { error: `Unknown action: ${action}` });
  } catch (e: any) {
    return send(res, 500, { error: 'Server error', details: e?.message || String(e) });
  }
}