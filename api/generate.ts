// api/generate.ts
// Función de backend que llama a la Generative Language API por REST.
// No usa SDK -> cero problemas de módulos.
// Requiere la env var: GOOGLE_API_KEY

export const config = { runtime: 'edge' }; // también puedes quitar esta línea y usar Node

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'models/gemini-2.5-flash'; // modelo disponible en tu cuenta (según tu listado)

function bad(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function callGeminiGenerateContent(body: unknown) {
  if (!API_KEY) {
    return bad(500, { error: 'Missing GOOGLE_API_KEY' });
  }
  const url = `https://generativelanguage.googleapis.com/v1/${MODEL}:generateContent?key=${API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  // Si Google responde error, lo pasamos tal cual para depurar.
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return bad(500, { error: 'Upstream error', details: text });
  }

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return bad(405, { error: 'Method not allowed' });

  try {
    const { action, payload } = (await req.json?.()) ?? {};
    if (!action) return bad(400, { error: 'Missing action' });

    switch (action) {
      case 'generateText': {
        const prompt: string = payload?.prompt ?? '';
        if (!prompt) return bad(400, { error: 'Missing prompt' });

        // Llamada REST
        const upstream = await callGeminiGenerateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        if (!upstream.ok) return upstream;

        const result = await upstream.json();
        // Extraemos el texto del primer candidato
        const text =
          result?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text)?.join('') ?? '';

        return bad(200, { text });
      }

      case 'generateStructured': {
        // Espera: { prompt: string, schema: object }
        const prompt: string = payload?.prompt ?? '';
        const schema = payload?.schema;
        if (!prompt || !schema) return bad(400, { error: 'Missing prompt or schema' });

        const upstream = await callGeminiGenerateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schema, // objeto JSON Schema plano
          },
        });
        if (!upstream.ok) return upstream;

        const result = await upstream.json();
        const raw =
          result?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text)?.join('') ?? '{}';

        try {
          const data = JSON.parse(raw);
          return bad(200, { data });
        } catch {
          // si el modelo devolviera algo no-JSON
          return bad(422, { error: 'LLM returned non-JSON', raw });
        }
      }

      case 'generateImageForTerm': {
        // No implementado aún
        return bad(501, { error: 'Image generation not implemented' });
      }

      default:
        return bad(400, { error: `Unknown action: ${action}` });
    }
  } catch (e: any) {
    return bad(500, { error: 'Server error', details: e?.message ?? String(e) });
  }
}