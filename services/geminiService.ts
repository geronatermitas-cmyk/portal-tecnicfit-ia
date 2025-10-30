
import { DisabilityCategory, Device, Functionality } from '../types';
import { Type } from '@google/genai'; // Solo importamos Type para mantener la definición del schema

// --- FUNCIÓN GENÉRICA PARA LLAMAR A NUESTRO BACKEND ---
async function callApi(action: string, payload: any) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
    throw new Error(errorBody.error || `API request failed with status ${response.status}`);
  }

  return response.json();
}

// --- DEFINICIONES DE SCHEMAS (se envían al backend) ---

const deviceSchema = {
    type: Type.OBJECT,
    properties: {
        nombre: { type: Type.STRING, description: "El nombre del dispositivo." },
        descripcion: { type: Type.STRING, description: "Una breve descripción de para qué sirve el dispositivo." },
        caracteristicas: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Una lista de 3 a 5 características o beneficios clave."
        }
    },
    required: ["nombre", "descripcion", "caracteristicas"]
};

const functionalitySchema = {
    type: Type.OBJECT,
    properties: {
        nombre: { type: Type.STRING, description: "El nombre de la funcionalidad o aplicación." },
        descripcion: { type: Type.STRING, description: "Una breve descripción de para qué sirve." },
        plataformas: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Una lista de plataformas donde está disponible (ej. iOS, Android, Windows, macOS)."
        }
    },
    required: ["nombre", "descripcion", "plataformas"]
};


// --- FUNCIONES QUE LLAMA EL FRONTEND ---

export const fetchAssistiveDevices = async (category: DisabilityCategory): Promise<Omit<Device, 'imageUrl'>[]> => {
  const categoryMap = {
      visual: 'ceguera o discapacidad visual grave',
      auditiva: 'sordera o discapacidad auditiva grave',
      habla: 'mudez o discapacidad del habla grave'
  };
  const prompt = `Genera una lista de 5 dispositivos de asistencia modernos y populares para personas con ${categoryMap[category]}. Para cada dispositivo, proporciona su nombre, una descripción y 3-5 características clave.`;

  try {
    const result = await callApi('fetchAssistiveDevices', { prompt, schema: { type: Type.OBJECT, properties: { dispositivos: { type: Type.ARRAY, items: deviceSchema } }, required: ["dispositivos"] } });
    return (result.dispositivos || []) as Omit<Device, 'imageUrl'>[];
  } catch (error) {
    console.error("Error fetching device data:", error);
    throw new Error("No se pudieron obtener los datos de los dispositivos. Por favor, inténtelo de nuevo más tarde.");
  }
};

export const fetchAssistiveFunctionalities = async (category: DisabilityCategory): Promise<Omit<Functionality, 'imageUrl'>[]> => {
  const categoryMap = {
      visual: 'ceguera o discapacidad visual grave',
      auditiva: 'sordera o discapacidad auditiva grave',
      habla: 'mudez o discapacidad del habla grave'
  };
  const prompt = `Genera una lista de 4 funcionalidades de software, aplicaciones móviles o funciones de sistema operativo para personas con ${categoryMap[category]}. Para cada una, proporciona su nombre, una descripción y las plataformas donde está disponible.`;

  try {
    const result = await callApi('fetchAssistiveFunctionalities', { prompt, schema: { type: Type.OBJECT, properties: { funcionalidades: { type: Type.ARRAY, items: functionalitySchema } }, required: ["funcionalidades"] } });
    return (result.funcionalidades || []) as Omit<Functionality, 'imageUrl'>[];
  } catch (error) {
    console.error("Error fetching functionality data:", error);
    throw new Error("No se pudieron obtener los datos de las funcionalidades. Por favor, inténtelo de nuevo más tarde.");
  }
};

export const generateImageForTerm = async (term: string): Promise<string> => {
  try {
    const result = await callApi('generateImageForTerm', { term });
    return result.imageUrl || '';
  } catch (error) {
    console.error(`Error generating image for term "${term}":`, error);
    return '';
  }
};
