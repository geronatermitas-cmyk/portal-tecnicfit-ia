// api/generate.ts
// Runtime: Node.js 20 (no Edge).
// Usa la variable de entorno GOOGLE_API_KEY definida en Vercel.

const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const MODEL = "models/gemini-2.5-flash"; // asegúrate de que exista en tu cuenta
const API_URL = `https://generativelanguage.googleapis.com/v1/${MODEL}:generateContent`;

/** Envía respuesta JSON estándar */
function send(res: any, status: number, body: unknown) {
  res
    .status(status)
    .setHeader("Content-Type", "application/json")
    .send(typeof body === "string" ? body : JSON.stringify(body));
}

/** Llama al endpoint Gemini con un body arbitrario */
async function callGemini(body: unknown) {
  if (!API_KEY) {
    return {
      ok: false,
      status: 500,
      body: { error: "Missing GOOGLE_API_KEY" },
    };
  }

  try {
    const resp = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    if (!resp.ok) return { ok: false, status: resp.status, body: text };
    return { ok: true, status: 200, body: text };
  } catch (e: any) {
    return {
      ok: false,
      status: 500,
      body: { error: e?.message ?? "Server error" },
    };
  }
}

/** Controlador principal para la API */
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return send(res, 405, { error: "Method not allowed" });
  }

  try {
    const { action, payload } = (req.body ?? {}) as {
      action?: string;
      payload?: any;
    };

    if (!action) return send(res, 400, { error: "Missing action" });

    // Acción 1: generar texto libre
    if (action === "generateText") {
      const prompt = payload?.prompt ?? "";
      const out = await callGemini({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      return send(res, out.status, out.body);
    }

    // Acción 2: generar respuesta estructurada (JSON)
    if (action === "generateStructured") {
      const prompt = payload?.prompt ?? "";
      const schema = payload?.schema ?? {};

      const out = await callGemini({
        systemInstruction: {
          parts: [
            {
              text:
                "Responde SOLO en JSON válido con este esquema aproximado:\n" +
                JSON.stringify(schema),
            },
          ],
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      return send(res, out.status, out.body);
    }

    // Acción 3: simple ping para probar conexión
    if (action === "ping") {
      return send(res, 200, { ok: true, message: "Pong!" });
    }

    return send(res, 400, { error: `Unknown action: ${action}` });
  } catch (e: any) {
    return send(res, 500, { error: e?.message ?? "Server error" });
  }
}