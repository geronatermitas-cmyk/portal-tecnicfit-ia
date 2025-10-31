// api/generate.ts  (Vercel Node Runtime, no Edge)
import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = process.env.GOOGLE_API_KEY;
// Modelos listados por tu cuenta (comprobado con /v1/models)
const MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent`;

function send(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json').send(
    typeof body === 'string' ? body : JSON.stringify(body)
  );
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
      // Devuelve el error bruto de Google para poder depurar en consola/Network
      return { ok: false as const, status: resp.status, body: text || resp.statusText };
    }
    // La API puede devolver objeto; lo retornamos como objeto si aplica
    const json = text ? JSON.parse(text) : {};
    return { ok: true as const, status: 200, body: json };
  } catch (e: any) {
    return { ok: false as const, status: 500, body: { error: e?.message ?? 'Server error' } };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Method not allowed' });
  }

  const { action, payload } = (req.body ?? {}) as { action?: string; payload?: any };
  if (!action) return send(res, 400, { error: 'Missing action' });

  // Ping simple para probar function runtime
  if (action === 'ping') {
    return send(res, 200, { ok: true, message: 'Pong!' });
  }

  if (action === 'generateText') {
    const prompt: string = payload?.prompt ?? '';
    const body = {
      contents: [
        { role: 'user', parts: [{ text: prompt }] },
      ],
      // Opcional: puedes ajustar temperatura, topP, etc.
      generation_config: { temperature: 0.4 },
    };
    const r = await callGemini(body);
    return send(res, r.status, r.body);
  }

  if (action === 'generateStructured') {
    const prompt: string = payload?.prompt ?? '';
    const schema: unknown = payload?.schema; // JSON Schema plano

    // Importante: usar snake_case en REST v1
    const body = {
      // Instrucción para forzar respuesta JSON *puro* (sin envoltorios de texto)
      system_instruction: {
        parts: [
          {
            text:
              'Eres un formateador estricto. Devuelve únicamente JSON válido que cumpla el esquema. ' +
              'No añadas texto antes ni después. Sin comentarios, sin Markdown.',
          },
        ],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generation_config: {
        temperature: 0.2,
        // clave correcta en REST v1
        response_mime_type: 'application/json',
        // Gemini v1 soporta response_schema para constrained generation
        response_schema: schema,
      },
    };

    const r = await callGemini(body);
    return send(res, r.status, r.body);
  }

  return send(res, 400, { error: `Unknown action: ${action}` });
}