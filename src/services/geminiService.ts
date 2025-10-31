// src/services/geminiService.ts
// Cliente FRONTEND para hablar con /api/generate (backend).
// No usa el SDK de Google en el navegador; solo fetch al backend.

import type { DisabilityCategory, Device, Functionality } from '../types';

/* ---------------------------------- utils ---------------------------------- */

type ApiOk<T> = T;

async function callApi<T = any>(action: string, payload: any): Promise<ApiOk<T>> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${raw || res.statusText}`);
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    // por si el backend devolviera texto
    return raw as unknown as T;
  }
}

/** Quita ```json ... ``` y preámbulos tipo 'json\n' y parsea a objeto */
function parseLooseJSON(input: unknown): any {
  if (input == null) return null;
  if (typeof input === 'object') return input;

  let txt = String(input).trim();
  txt = txt.replace(/^```(?:json)?\s*/i, '');
  txt = txt.replace(/```$/i, '');
  txt = txt.replace(/^json\s*\n/i, '');
  txt = txt.trim();
  try { return JSON.parse(txt); } catch { return null; }
}

/** Devuelve el primer array que encuentre entre varias rutas posibles */
function pickArray(obj: any, keys: string[]): any[] {
  for (const k of keys) {
    const v = obj?.[k];
    if (Array.isArray(v)) return v;
  }
  return [];
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
    `para personas con ${cat}. Para cada uno, devuelve nombre, una descripción ` +
    `clara y entre 3 y 5 características clave. ` +
    `Responde SOLO en JSON válido con esta forma: ` +
    `{"dispositivos":[{"nombre":"...", "descripcion":"...", "caracteristicas":["...","..."]}]}.`
  );
}

function buildFunctionalitiesPrompt(category: DisabilityCategory): string {
  const cat = categoryMap[category];
  return (
    `Genera una lista de 4 funcionalidades de software o aplicaciones que ` +
    `ayuden a personas con ${cat}. Para cada una, devuelve nombre, descripción ` +
    `y una lista de plataformas (iOS, Android, Windows, macOS, etc.). ` +
    `Responde SOLO en JSON válido con esta forma: ` +
    `{"funcionalidades":[{"nombre":"...", "descripcion":"...", "plataformas":["...","..."]}]}.`
  );
}

/* ------------------------------- Schemas ---------------------------------- */

const devicesSchemaWrapper = {
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

const functionalitiesSchemaWrapper = {
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

/* --------------------------- API de alto nivel ----------------------------- */

export async function fetchAssistiveDevices(
  category: DisabilityCategory,
): Promise<Omit<Device, 'imageUrl'>[]> {
  const prompt = buildDevicesPrompt(category);

  const result = await callApi<any>('generateStructured', {
    prompt,
    schema: devicesSchemaWrapper, // hoy no se valida en servidor, pero lo dejamos enviado
  });

  // El backend normalmente ya devuelve objeto; si viniera string, limpiamos aquí:
  const data = typeof result === 'string' ? parseLooseJSON(result) : result;

  // Acepta variantes por si el modelo cambia la clave
  const dispositivos = pickArray(data, ['dispositivos', 'devices', 'result', 'items']);

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

  const result = await callApi<any>('generateStructured', {
    prompt,
    schema: functionalitiesSchemaWrapper,
  });

  const data = typeof result === 'string' ? parseLooseJSON(result) : result;

  // Variantes posibles: funcionalidades / functionalidades / items
  const funcionalidades = pickArray(data, ['funcionalidades', 'functionalidades', 'items']);

  return funcionalidades.map((f: any) => ({
    nombre: String(f?.nombre ?? ''),
    descripcion: String(f?.descripcion ?? ''),
    plataformas: Array.isArray(f?.plataformas)
      ? f.plataformas.map((p: any) => String(p))
      : [],
  }));
}

/* ----------------------------- (Opcional) Img ------------------------------ */

// PNG 1x1 transparente como placeholder
const TRANSPARENT_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEklEQVR42mP8/5+hHgMDAwMjAAAmQwO1PqkW2QAAAABJRU5ErkJggg==';

export async function generateImageForTerm(_term: string): Promise<string> {
  return TRANSPARENT_PNG;
}