// api/generate.ts (Node runtime - Vercel)
import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'models/gemini-2.5-flash';

function send(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

async function callGemini(body: unknown) {
  if (!API_KEY) return { ok: false, status: 500, body: { error: 'Missing GOOGLE_API_KEY' } };
  const url = `https://generativelanguage.googleapis.com/v1/${MODEL}:generateContent?key=${API_KEY}`;
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await r.text();
  if (!r.ok) return { ok: false, status: 502, body: { error: 'Upstream error', details: text } };
  return { ok: true, status: 200, body: JSON.parse(text) };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const { action, payload } = (req.body ?? {}) as { action?: string; payload?: any };
    if (!action) return send(res, 400, { error: 'Missing action' });

    if (action === 'generateText') {
      const prompt: string = payload?.prompt ?? '';
      if (!prompt) return send(res, 400, { error: 'Missing prompt' });
      const up = await callGemini({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
      if (!up.ok) return send(res, up.status, up.body);
      const parts = (up.body as any)?.candidates?.[0]?.content?.parts ?? [];
      const text = parts.map((p: any) => p?.text || '').join('');
      return send(res, 200, { text });
    }

    if (action === 'generateStructured') {
      const prompt: string = payload?.prompt ?? '';
      const schema = payload?.schema;
      if (!prompt || !schema) return send(res, 400, { error: 'Missing prompt or schema' });
      const up = await callGemini({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: schema },
      });
      if (!up.ok) return send(res, up.status, up.body);
      const raw = (up.body as any)?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('') ?? '{}';
      try { return send(res, 200, { data: JSON.parse(raw) }); }
      catch { return send(res, 422, { error: 'LLM returned non-JSON', raw }); }
    }

    if (action === 'generateImageForTerm') {
      return send(res, 501, { error: 'Image generation not implemented' });
    }

    return send(res, 400, { error: `Unknown action: ${action}` });
  } catch (e: any) {
    return send(res, 500, { error: 'Server error', details: e?.message ?? String(e) });
  }
}