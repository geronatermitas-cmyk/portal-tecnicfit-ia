// api/generate.ts  (Vercel Node Runtime)
// Runtime: Node.js (no Edge). Asegúrate en Vercel: Project → Settings → Functions → Node.js 20.x

import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = process.env.GOOGLE_API_KEY;
// Usa un modelo que tu cuenta LISTA realmente (según tu /v1/models):
const MODEL = 'models/gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1/${MODEL}:generateContent`;

function send(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

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
      return {
        ok: false as const,
        status: 502,
        body: { error: 'Upstream error', status: resp.status, details: safeSlice(text, 4000) },
      };
    }
    try {
      return { ok: true as const, status: 200, body: JSON.parse(text) };
    } catch {
      // Gemini siempre responde JSON, pero por si acaso:
      return { ok: true as const, status: 200, body: { raw: text } };
    }
  } catch (e: any) {
    return {
      ok: false as const,
      status: 502,
      body: { error: 'Network error to Google', details: e?.message || String(e) },
    };
  }
}

function partsToText(anyBody: any): string {
  try {
    const parts = anyBody?.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p: any) => p?.text || '').join('');
  } catch {
    return '';
  }
}

function extractJsonSmart(s: string): { ok: true; data: any } | { ok: false; raw: string } {
  // Intenta parsear todo
  try {
    return { ok: true, data: JSON.parse(s) };
  } catch {}
  // Intenta heurística: la 1ª llave/última llave
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = s.slice(start, end + 1);
    try {
      return { ok: true, data: JSON.parse(candidate) };
    } catch {}
  }
  return { ok: false, raw: s };
}

function safeSlice(s: string, n: number) {
  return (s || '').slice(0, n);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

    const { action, payload } = (req.body ?? {}) as { action?: string; payload?: any };
    if (!action) return send(res, 400, { error: 'Missing action' });

    // 0) Ping para comprobar que la función responde
    if (action === 'ping') {
      return send(res, 200, { ok: true, runtime: 'node', model: MODEL, hasKey: Boolean(API_KEY) });
    }

    // 1) Texto libre
    if (action === 'generateText') {
      const prompt: string = payload?.prompt ?? '';
      if (!prompt) return send(res, 400, { error: 'Missing prompt' });
      const up = await callGemini({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
      if (!up.ok) return send(res, up.status, up.body);
      const text = partsToText(up.body);
      return send(res, 200, { text });
    }

    // 2) Estructurado (con fallback)
    if (action === 'generateStructured') {
      const prompt = payload?.prompt;
      const schema = payload?.schema;
      if (!prompt || !schema) return send(res, 400, { error: 'Missing prompt or schema' });

      // 2.a) Intento con responseSchema (modo “fino”)
      const upA = await callGemini({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          // En REST v1 es camelCase:
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      if (upA.ok) {
        const asText = partsToText(upA.body);
        const parsed = extractJsonSmart(asText);
        if (parsed.ok) return send(res, 200, { data: parsed.data });
        // Si el modelo no respetó el JSON (raro), reporta 422 con raw
        return send(res, 422, { error: 'LLM returned non-JSON', raw: safeSlice(asText, 8000) });
      }

      // 2.b) Fallback: pedir JSON por prompt (sin responseSchema)
      const upB = await callGemini({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text:
                  `${prompt}\n\n` +
                  `Responde exclusivamente en JSON válido y nada más. ` +
                  `No incluyas explicación ni marcadores de código.`,
              },
            ],
          },
        ],
      });

      if (!upB.ok) return send(res, upB.status, upB.body);

      const asTextB = partsToText(upB.body);
      const parsedB = extractJsonSmart(asTextB);
      if (parsedB.ok) return send(res, 200, { data: parsedB.data });
      return send(res, 422, { error: 'LLM returned non-JSON (fallback)', raw: safeSlice(asTextB, 8000) });
    }

    // 3) Placeholder imágenes
    if (action === 'generateImageForTerm') {
      return send(res, 501, { error: 'Image generation not implemented' });
    }

    return send(res, 400, { error: `Unknown action: ${action}` });
  } catch (e: any) {
    // Pase lo que pase, **no** tiramos la función
    return send(res, 500, { error: 'Server error', details: e?.message || String(e) });
  }
}