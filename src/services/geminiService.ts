// src/services/geminiService.ts
// Cliente del FRONTEND para hablar con /api/generate (backend).
// NO usa el SDK de Google en el navegador.

// 👉 Ajusta este import si tu archivo está en otra ruta:
import type { DisabilityCategory, Device, Functionality } from '../types';

/* ---------------------------------- utils ---------------------------------- */

type ApiOk<T> = T;
async function callApi<T = any>(action: string, payload: any): Promise<ApiOk<T>> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return (await res.json()) as T;
}

/* ---------------------------- prompts y mapeos ----------------------------- */

const categoryMap: Record<DisabilityCategory, string> = {
  visual: 'ceguera o discapacidad visual grave',
  auditiva: 'sordera o discapacidad auditiva grave',
  habla: 'mudez o discapacidad del habla grave',
};

function buildDevicesPrompt(category: DisabilityCategory): string {
  const cat = categoryMap[category];
  return (
    `Genera una lista de 5 dispositivos de asistencia modernos y populares ` +
    `para personas con ${cat}. Usa descripciones útiles y neutrales. ` +
    `Evita repetir marcas. Responde SOLO en JSON válido.`
  );
}

function buildFunctionalitiesPrompt(category: DisabilityCategory): string {
  const cat = categoryMap[category];
  return (
    `Genera una lista de 4 funcionalidades de software o apps ` +
    `que ayuden a personas con ${cat}. Incluye descripciones breves. ` +
    `Responde SOLO en JSON válido.`
  );
}

/* ------------------------------- "Schemas" --------------------------------- */
/* OJO: Son guías para el modelo. No validan en cliente; el backend intenta
   forzar JSON puro y, si falla, devuelve 422 con el "raw". */

const deviceSchema = {
  type: 'object',
  properties: {
    dispositivos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string', description: 'Nombre del dispositivo' },
          descripcion: { type: 'string', description: 'Descripción breve' },
          caracteristicas: {
            type: 'array',
            items: { type: 'string' },
            description: '3–5 características clave',
          },
          plataformas: {
            type: 'array',
            items: { type: 'string' },
            description: 'Plataformas o entornos (iOS, Android, PC, etc.)',
          },
        },
        required: ['nombre', 'descripcion', 'caracteristicas'],
      },
    },
  },
  required: ['dispositivos'],
} as const;

const functionalitySchema = {
  type: 'object',
  properties: {
    funcionalidades: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string', description: 'Nombre de la funcionalidad' },
          descripcion: { type: 'string', description: 'Descripción breve' },
          ejemplo: {
            type: 'string',
            description: 'Ejemplo de app o caso de uso (opcional)',
          },
        },
        required: ['nombre', 'descripcion'],
      },
    },
  },
  required: ['funcionalidades'],
} as const;

/* --------------------------- API de alto nivel ----------------------------- */

/** Texto libre (si lo necesitas en algún componente) */
export async function generateFromGemini(prompt: string): Promise<string> {
  const { text } = await callApi<{ text: string }>('generateText', { prompt });
  return text;
}

/** Dispositivos de asistencia para una categoría */
export async function fetchAssistiveDevices(
  category: DisabilityCategory,
): Promise<Omit<Device, 'imageUrl'>[]> {
  const prompt = buildDevicesPrompt(category);

  const { data } = await callApi<{ data: { dispositivos: any[] } }>(
    'generateStructured',
    { prompt, schema: deviceSchema },
  );

  const dispositivos = Array.isArray(data?.dispositivos) ? data.dispositivos : [];

  // Normalización a tus tipos de Device (sin imageUrl)
  return dispositivos.map((d) => ({
    nombre: String(d?.nombre ?? ''),
    descripcion: String(d?.descripcion ?? ''),
    caracteristicas: Array.isArray(d?.caracteristicas)
      ? d.caracteristicas.map((c: any) => String(c))
      : [],
    plataformas: Array.isArray(d?.plataformas)
      ? d.plataformas.map((p: any) => String(p))
      : [],
  }));
}

/** Funcionalidades de software/herramientas para una categoría */
export async function fetchAssistiveFunctionalities(
  category: DisabilityCategory,
): Promise<Omit<Functionality, 'imageUrl'>[]> {
  const prompt = buildFunctionalitiesPrompt(category);

  const { data } = await callApi<{ data: { funcionalidades: any[] } }>(
    'generateStructured',
    { prompt, schema: functionalitySchema },
  );

  const funcionalidades = Array.isArray(data?.funcionalidades)
    ? data.funcionalidades
    : [];

  return funcionalidades.map((f) => ({
    nombre: String(f?.nombre ?? ''),
    descripcion: String(f?.descripcion ?? ''),
    ejemplo: typeof f?.ejemplo === 'string' ? f.ejemplo : undefined,
  }));
}

/* ----------------------------- (Opcional) Img ------------------------------ */
/** Si más adelante quieres imágenes, crea un endpoint específico en /api
 *  y llámalo aquí con fetch, igual que hacemos con generateText/generateStructured.
 *  Mantén SIEMPRE la generación de imágenes/texto en el backend.
 *//
