// src/services/geminiService.ts
// Cliente FRONTEND: solo hace fetch a /api/generate (backend en Vercel).
import type { DisabilityCategory, Device, Functionality } from '../types';

/* ------------------------------- utils ---------------------------------- */
type ApiOk<T> = T;

async function callApi<T = any>(action: string, payload: any): Promise<ApiOk<T>> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });

  // intentamos texto primero para mostrar errores legibles del backend
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${raw || res.statusText}`);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    // en 422 el backend puede devolver { raw: "...texto no JSON..." }
    return { raw } as unknown as T;
  }
}

/* -------------------------- prompts y mapeos ---------------------------- */
const categoryMap: Record<DisabilityCategory, string> = {
  visual: 'ceguera o discapacidad visual grave',
  auditiva: 'sordera o discapacidad auditiva grave',
  habla: 'mudez o discapacidad del habla grave',
};

function buildDevicesPrompt(category: DisabilityCategory): string {
  const cat = categoryMap[category];
  return (
    `Devuelve un JSON con la forma:\n` +
    `{"dispositivos":[{"nombre":"","descripcion":"","caracteristicas":["","",""]}]}\n\n` +
    `Instrucción: Lista 5 dispositivos de asistencia modernos para personas con ${cat}. ` +
    `Usa descripciones claras y 3–5 características por ítem. Sin texto fuera del JSON.`
  );
}

function buildFunctionalitiesPrompt(category: DisabilityCategory): string {
  const cat = categoryMap[category];
  return (
    `Devuelve un JSON con la forma:\n` +
    `{"funcionalidades":[{"nombre":"","descripcion":"","plataformas":["iOS","Android"]}]}\n\n` +
    `Instrucción: Lista 4 funcionalidades de software útiles para personas con ${cat}. ` +
    `Incluye plataformas. Sin texto fuera del JSON.`
  );
}

/* ------------------------------- schemas -------------------------------- */
const devicesSchema = {
  type: 'object',
  properties: {
    dispositivos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          descripcion: { type: 'string' },
          caracteristicas: { type: 'array', items: { type: 'string' } },
        },
        required: ['nombre', 'descripcion', 'caracteristicas'],
      },
    },
  },
  required: ['dispositivos'],
} as const;

const functionalitiesSchema = {
  type: 'object',
  properties: {
    funcionalidades: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          descripcion: { type: 'string' },
          plataformas: { type: 'array', items: { type: 'string' } },
        },
        required: ['nombre', 'descripcion', 'plataformas'],
      },
    },
  },
  required: ['funcionalidades'],
} as const;

/* --------------------------- API de alto nivel -------------------------- */
export async function generateFromGemini(prompt: string): Promise<string> {
  const r = await callApi<{ text?: string }>('generateText', { prompt });
  return r?.text ?? '';
}

export async function fetchAssistiveDevices(
  category: DisabilityCategory,
): Promise<Omit<Device, 'imageUrl'>[]> {
  const prompt = buildDevicesPrompt(category);

  // El backend guía al modelo y luego intenta parsear JSON; si no puede, responde 422 con {raw}
  const r = await callApi<{ data?: any; raw?: string }>('generateStructured', {
    prompt,
    schema: devicesSchema,
  });

  const dispositivos = Array.isArray(r?.data?.dispositivos)
    ? r.data.dispositivos
    : [];

  return dispositivos.map((d: any) => ({
    nombre: String(d?.nombre ?? ''),
    descripcion: String(d?.descripcion ?? ''),
    caracteristicas: Array.isArray(d?.caracteristicas)
      ? d.caracteristicas.map((c: any) => String(c))
      : [],
  }));
}

export async function fetchAssistiveFunctionalities(
  category: DisabilityCategory,
): Promise<Omit<Functionality, 'imageUrl'>[]> {
  const prompt = buildFunctionalitiesPrompt(category);

  const r = await callApi<{ data?: any; raw?: string }>('generateStructured', {
    prompt,
    schema: functionalitiesSchema,
  });

  const funcionalidades = Array.isArray(r?.data?.funcionalidades)
    ? r.data.funcionalidades
    : [];

  return funcionalidades.map((f: any) => ({
    nombre: String(f?.nombre ?? ''),
    descripcion: String(f?.descripcion ?? ''),
    plataformas: Array.isArray(f?.plataformas)
      ? f.plataformas.map((p: any) => String(p))
      : [],
  }));
}

/* ----------------------------- stub imágenes ---------------------------- */
const TRANSPARENT_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEklEQVR42mP8/5+hHgMDAwMjAAAmQwO1PqkW2QAAAABJRU5ErkJggg==';

export async function generateImageForTerm(_term: string): Promise<string> {
  return TRANSPARENT_PNG;
}