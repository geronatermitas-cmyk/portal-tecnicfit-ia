// src/services/geminiService.ts
// Cliente FRONTEND: habla con /api/generate (backend de Vercel).
// No usa SDKs en el navegador; solo fetch al backend.

import type { DisabilityCategory, Device, Functionality } from '../types';

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

type ApiOk<T> = T;

async function callApi<T = any>(action: string, payload: any): Promise<T> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });

  const raw = await res.text();

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${raw}`);
  }

  // El backend puede devolver texto plano (JSON en string) o un objeto JSON.
  // Aquí siempre intentamos parsear; si no es JSON, devolvemos el string tal cual.
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

/* -------------------------------------------------------------------------- */
/* Prompts                                                                    */
/* -------------------------------------------------------------------------- */

const categoryMap: Record<DisabilityCategory, string> = {
  visual: 'ceguera o discapacidad visual grave',
  auditiva: 'sordera o discapacidad auditiva grave',
  habla: 'mudez o discapacidad del habla grave',
};

function devicesPrompt(category: DisabilityCategory): string {
  return (
    `Genera una lista de 5 dispositivos de asistencia modernos y populares ` +
    `para personas con ${categoryMap[category]}. Para cada uno, devuelve: ` +
    `nombre, descripción y 3-5 características. ` +
    `Responde SOLO en JSON válido con la clave "dispositivos".`
  );
}

function functionalitiesPrompt(category: DisabilityCategory): string {
  return (
    `Genera 4 funcionalidades (software/apps) para personas con ${categoryMap[category]}. ` +
    `Devuelve para cada una: nombre, descripción y plataformas (iOS, Android, Windows, macOS). ` +
    `Responde SOLO en JSON válido con la clave "funcionalidades".`
  );
}

/* -------------------------------------------------------------------------- */
/* Schemas (guías JSON que el backend envía al modelo)                        */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* API de alto nivel                                                          */
/* -------------------------------------------------------------------------- */

export async function fetchAssistiveDevices(
  category: DisabilityCategory,
): Promise<Omit<Device, 'imageUrl'>[]> {
  const prompt = devicesPrompt(category);

  // El backend devuelve un STRING JSON (texto plano) para generateStructured
  const out = await callApi<any>('generateStructured', {
    prompt,
    schema: devicesSchema,
  });

  const obj = typeof out === 'string' ? JSON.parse(out) : out;
  const dispositivos = Array.isArray(obj?.dispositivos) ? obj.dispositivos : [];

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
  const prompt = functionalitiesPrompt(category);

  const out = await callApi<any>('generateStructured', {
    prompt,
    schema: functionalitiesSchema,
  });

  const obj = typeof out === 'string' ? JSON.parse(out) : out;
  const funcionalidades = Array.isArray(obj?.funcionalidades)
    ? obj.funcionalidades
    : [];

  return funcionalidades.map((f: any) => ({
    nombre: String(f?.nombre ?? ''),
    descripcion: String(f?.descripcion ?? ''),
    plataformas: Array.isArray(f?.plataformas)
      ? f.plataformas.map((p: any) => String(p))
      : [],
  }));
}

/* -------------------------------------------------------------------------- */
/* Imagen (stub temporal)                                                     */
/* -------------------------------------------------------------------------- */

const TRANSPARENT_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEklEQVR42mP8/5+hHgMDAwMjAAAmQwO1PqkW2QAAAABJRU5ErkJggg==';

export async function generateImageForTerm(_term: string): Promise<string> {
  // Si implementas el endpoint en el backend, llama aquí:
  // const { imageUrl } = await callApi<{ imageUrl: string }>('generateImageForTerm', { term: _term });
  // return imageUrl || TRANSPARENT_PNG;
  return TRANSPARENT_PNG;
}