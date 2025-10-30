// src/services/geminiService.ts
import { DisabilityCategory, Device, Functionality } from './types';

/** ---------- Cliente genérico para la API ---------- */
async function callApi<T = any>(action: string, payload: any): Promise<T> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`API ${response.status}: ${body || response.statusText}`);
  }
  return (await response.json()) as T;
}

/** ---------- Utilidades ---------- */
const categoryMap: Record<DisabilityCategory, string> = {
  visual: 'ceguera o discapacidad visual grave',
  auditiva: 'sordera o discapacidad auditiva grave',
  habla: 'mudez o discapacidad del habla grave',
};

function buildDevicesPrompt(category: DisabilityCategory) {
  const catText = categoryMap[category];
  return (
    `Genera una lista de 5 dispositivos de asistencia **modernos y populares** ` +
    `dirigidos a personas con ${catText}. ` +
    `Escribe resultados neutros, centrados en utilidad. No repitas marcas. ` +
    `Responde SOLO en JSON.`
  );
}

function buildFunctionalitiesPrompt(category: DisabilityCategory) {
  const catText = categoryMap[category];
  return (
    `Genera una lista de 4 funcionalidades de software, apps o herramientas ` +
    `que ayuden a personas con ${catText}. ` +
    `Describe de forma breve y útil. Responde SOLO en JSON.`
  );
}

/** ---------- Schemas (guía para el modelo) ---------- */
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
            description: '3-5 características clave',
          },
          plataformas: {
            type: 'array',
            items: { type: 'string' },
            description: 'Plataformas/entornos donde aplica (iOS, Android, PC, etc.)',
          },
        },
        required: ['nombre', 'descripcion', 'caracteristicas'],
      },
    },
  },
  required: ['dispositivos'],
};

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
};

/** ---------- API de alto nivel que usa tu UI ---------- */

export async function generateFromGemini(prompt: string) {
  const { text } = await callApi<{ text: string }>('generateText', { prompt });
  return text;
}

export async function fetchAssistiveDevices(
  category: DisabilityCategory,
): Promise<Omit<Device, 'imageUrl'>[]> {
  const prompt = buildDevicesPrompt(category);
  const { data } = await callApi<{ data: { dispositivos: any[] } }>(
    'generateStructured',
    { prompt, schema: deviceSchema },
  );

  const dispositivos = (data?.dispositivos ?? []) as any[];
  // Normalización básica hacia tus tipos (sin imageUrl)
  return dispositivos.map((d) => ({
    nombre: String(d.nombre ?? ''),
    descripcion: String(d.descripcion ?? ''),
    caracteristicas: Array.isArray(d.caracteristicas) ? d.caracteristicas.map(String) : [],
    plataformas: Array.isArray(d.plataformas) ? d.plataformas.map(String) : [],
  }));
}

export async function fetchAssistiveFunctionalities(
  category: DisabilityCategory,
): Promise<Omit<Functionality, 'imageUrl'>[]> {
  const prompt = buildFunctionalitiesPrompt(category);
  const { data } = await callApi<{ data: { funcionalidades: any[] } }>(
    'generateStructured',
    { prompt, schema: functionalitySchema },
  );

  const funcionalidades = (data?.funcionalidades ?? []) as any[];
  return funcionalidades.map((f) => ({
    nombre: String(f.nombre ?? ''),
    descripcion: String(f.descripcion ?? ''),
    ejemplo: typeof f.ejemplo === 'string' ? f.ejemplo : undefined,
  }));
}
