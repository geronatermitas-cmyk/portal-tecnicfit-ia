
// Este archivo DEBE estar en una carpeta /api en la raíz de tu proyecto.
// Plataformas como Vercel o Netlify lo detectarán automáticamente como una función de backend.

import { GoogleGenAI, Type } from '@google/genai';

// La clave de API SÓLO se lee aquí, en el entorno seguro del servidor.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set in serverless function environment.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY, vertexai: true });

// Esta es una función genérica que se adapta a la mayoría de los proveedores de funciones sin servidor.
// Recibe una petición (Request) y devuelve una respuesta (Response).
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { action, payload } = await req.json();

    if (!action || !payload) {
      return new Response(JSON.stringify({ error: 'Missing action or payload' }), { status: 400 });
    }

    let result;

    switch (action) {
      case 'fetchAssistiveDevices':
      case 'fetchAssistiveFunctionalities':
        result = await generateText(payload);
        break;
      case 'generateImageForTerm':
        result = await generateImage(payload);
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400 });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in API handler:', error);
    return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), { status: 500 });
  }
}

// Lógica para generar texto, extraída para mayor claridad.
async function generateText(payload: { prompt: string, schema: any }) {
  const { prompt, schema } = payload;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { role: 'user', parts: [{ text: prompt }] },
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    }
  });
  return JSON.parse(response.text);
}

// Lógica para generar imágenes, extraída para mayor claridad.
async function generateImage(payload: { term: string }) {
  const { term } = payload;
  const prompt = `Un dibujo lineal simple y claro, en blanco y negro, de un/a ${term} sobre un fondo blanco liso. Estilo iconográfico.`;
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '4:3',
    },
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return { imageUrl: `data:image/jpeg;base64,${base64ImageBytes}` };
  }
  return { imageUrl: '' };
}
