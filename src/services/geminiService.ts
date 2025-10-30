// src/services/geminiService.ts
// Cliente FRONTEND para hablar con /api/generate (backend).
// NO usa el SDK de Google en el navegador; solo fetch al backend.

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
    // Intento de leer json/texto para dar un error útil
    let msg = res.statusText;
    try {
      const txt = await res.text();
      msg = txt || res.statusText;
    } catch {}
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
    `para personas con ${cat}. Para cada uno, devuelve nombre, una descripción ` +
    `clara y entre 3 y 5 características clave. Responde SOLO en JSON válido.`
  );
}

function buildFunctionalitiesPrompt(category: DisabilityCategory): string {
  const cat = categoryMap[category];
  return (
    `Genera una lista de 4 funcionalidades de software o aplicaciones que ` +
    `ayuden a personas con ${cat}. Para cada una, devuelve nombre, descripción ` +
    `y una lista de plataformas (iOS, Android, Windows, macOS, etc.). ` +
    `Responde SOLO en JSON válido.`
  );
}

/* ------------------------------- "Schemas" --------------------------------- */
/* Guías JSON Schema que enviamos al backend para que fuerce respuesta JSON.   */
/* OJO: aquí son objetos planos, sin depender de ningún paquete externo.       */

const deviceItemSchema = {
  type: 'object',
  properties: {
    nombre: { type: 'string', description: 'Nombre del dispositivo' },
    descripcion: { type: 'string', description: 'Descripción breve' },
    caracteristicas: {
      type: 'array',
      items: { type: 'string' },
      description: '3–5 características clave',
    },
    // Opcional: por si el modelo lo incluye; no es requerido en tu tipo Device (sin imageUrl)
    plataformas: {
      type: 'array',
      items: { type: 'string' },
      description: 'Plataformas o entornos (iOS, Android, PC, etc.)',
    },
  },
  required: ['nombre', 'descripcion', 'caracteristicas'],
} as const;

const devicesSchemaWrapper = {
  type: 'object',
  properties: {
    dispositivos: { type: 'array', items: deviceItemSchema },
  },
  required: ['dispositivos'],
} as const;

const functionalityItemSchema = {
  type: 'object',
  properties: {
    nombre: { type: 'string', description: 'Nombre de la funcionalidad' },
    descripcion: { type: 'string', description: 'Descripción breve' },
    plataformas: {
      type: 'array',
      items: { type: 'string' },
      description: 'Plataformas (iOS, Android, Windows, macOS, etc.)',
    },
  },
  required: ['nombre', 'descripcion', 'plataformas'],
} as const;

const functionalitiesSchemaWrapper = {
  type: 'object',
  properties: {
    funcionalidades: { type: 'array', items: functionalityItemSchema },
  },
  required: ['funcionalidades'],
} as const;

/* --------------------------- API de alto nivel ----------------------------- */

/** Dispositivos de asistencia para una categoría */
export async function fetchAssistiveDevices(
  category: DisabilityCategory,
): Promise<Omit<Device, 'imageUrl'>[]> {
  const prompt = buildDevicesPrompt(category);

  // IMPORTANTE: acción exactamente como la espera tu backend
  const result = await callApi<{ dispositivos: any[] }>('fetchAssistiveDevices', {
    prompt,
    schema: devicesSchemaWrapper,
  });

  const dispositivos = Array.isArray(result?.dispositivos) ? result.dispositivos : [];

  // Normalización a tus tipos (sin imageUrl)
  return dispositivos.map((d: any) => ({
    nombre: String(d?.nombre ?? ''),
    descripcion: String(d?.descripcion ?? ''),
    caracteristicas: Array.isArray(d?.caracteristicas)
      ? d.caracteristicas.map((c: any) => String(c))
      : [],
    // Este campo no existe en tu interfaz Device (sin imageUrl) pero si viene lo ignoramos.
    // plataformas: ... (si quisieras guardarlo en otro sitio)
  }));
}

/** Funcionalidades de software/herramientas para una categoría */
export async function fetchAssistiveFunctionalities(
  category: DisabilityCategory,
): Promise<Omit<Functionality, 'imageUrl'>[]> {
  const prompt = buildFunctionalitiesPrompt(category);

  const result = await callApi<{ funcionalidades: any[] }>('fetchAssistiveFunctionalities', {
    prompt,
    schema: functionalitiesSchemaWrapper,
  });

  const funcionalidades = Array.isArray(result?.funcionalidades)
    ? result.funcionalidades
    : [];

  // Normalización a tu tipo Functionality (sin imageUrl)
  return funcionalidades.map((f: any) => ({
    nombre: String(f?.nombre ?? ''),
    descripcion: String(f?.descripcion ?? ''),
    plataformas: Array.isArray(f?.plataformas)
      ? f.plataformas.map((p: any) => String(p))
      : [],
  }));
}

/* ----------------------------- (Opcional) Img ------------------------------ */
/** Si más adelante quieres imágenes reales desde el backend, crea un endpoint
 *  específico (acción 'generateImageForTerm') y llama igual que arriba.
 *  Mantén SIEMPRE la generación en el backend.
 */

// PNG 1x1 transparente para no romper el UI mientras tanto
const TRANSPARENT_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEklEQVR42mP8/5+hHgMDAwMjAAAmQwO1PqkW2QAAAABJRU5ErkJggg==';

export async function generateImageForTerm(term: string): Promise<string> {
  // Si ya tienes listo el backend de imágenes, descomenta esto y elimina el stub:
  // try {
  //   const res = await callApi<{ imageUrl: string }>('generateImageForTerm', { term });
  //   return res?.imageUrl || TRANSPARENT_PNG;
  // } catch {
  //   return TRANSPARENT_PNG;
  // }

  // Stub temporal:
  return TRANSPARENT_PNG;
}