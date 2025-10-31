import React, { useState, useEffect } from 'react';
import { fetchAssistiveFunctionalities } from '../services/geminiService';
import { DisabilityCategory, Functionality } from '../types';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

// Iconos (lucide-react)
import {
  Mic,
  Ear,
  Languages,
  Brain,
  Waves,
  BellRing,
  Volume2,
  Accessibility,
  Smartphone,
  Monitor,
  Headphones,
  BadgeInfo,
  type Icon as LucideIcon,
} from 'lucide-react';

interface FunctionalityExplorerProps {
  category: DisabilityCategory;
  goBack: () => void;
}

const categorySubtitles: Record<DisabilityCategory, string> = {
  visual: 'Para Discapacidad Visual',
  auditiva: 'Para Discapacidad Auditiva',
  habla: 'Para Discapacidad del Habla',
};

// Heurística simple para elegir icono por nombre
function pickIconByName(name: string): LucideIcon {
  const n = name.toLowerCase();

  if (n.includes('voz') || n.includes('habla') || n.includes('dictado')) return Mic;
  if (n.includes('seña') || n.includes('sign')) return Languages;
  if (n.includes('sonido') || n.includes('audio') || n.includes('ruido')) return Volume2;
  if (n.includes('alerta') || n.includes('notific')) return BellRing;
  if (n.includes('reconocim') || n.includes('ai') || n.includes('inteligencia')) return Brain;
  if (n.includes('vibrac') || n.includes('haptic')) return Waves;
  if (n.includes('accesib') || n.includes('lector')) return Accessibility;
  if (n.includes('móvil') || n.includes('android') || n.includes('ios')) return Smartphone;
  if (n.includes('pc') || n.includes('windows') || n.includes('mac')) return Monitor;
  if (n.includes('audio') || n.includes('escucha')) return Headphones;

  return BadgeInfo;
}

const FunctionalityCard: React.FC<{ item: Functionality; onSpeak: (t: string) => void }> = ({ item, onSpeak }) => {
  const Icon = pickIconByName(item.nombre);

  return (
    <div className="flex flex-col items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      {/* Icono circular estilo portada */}
      <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
        <Icon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
      </div>

      {/* Título */}
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        {item.nombre}
      </h3>

      {/* Descripción (3 líneas máx) */}
      <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
        {item.descripcion}
      </p>

      {/* Chips de plataformas */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {item.plataformas.map((p, i) => (
          <span
            key={`${p}-${i}`}
            className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          >
            {p}
          </span>
        ))}
      </div>

      {/* Botón acción */}
      <button
        onClick={() =>
          onSpeak(
            `Funcionalidad: ${item.nombre}. Descripción: ${item.descripcion}. Plataformas: ${item.plataformas.join(
              ', ',
            )}.`,
          )
        }
        className="mt-4 inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        aria-label={`Leer descripción de ${item.nombre}`}
      >
        Leer Descripción
      </button>
    </div>
  );
};

export const FunctionalityExplorer: React.FC<FunctionalityExplorerProps> = ({ category, goBack }) => {
  const [functionalities, setFunctionalities] = useState<Functionality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { speak } = useTextToSpeech();

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const base = await fetchAssistiveFunctionalities(category);
        // Nos aseguramos de que plataformas exista para la UI
        const normalized = base.map(f => ({
          ...f,
          plataformas: Array.isArray(f.plataformas) ? f.plataformas : [],
        }));
        setFunctionalities(normalized);
      } catch (e: any) {
        setError(e?.message ?? 'Ocurrió un error desconocido.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [category]);

  return (
    <section aria-labelledby="functionality-explorer-title">
      <div className="relative mb-8 text-center">
        <button
          onClick={goBack}
          className="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900"
          aria-label="Volver al menú de categoría"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Volver
        </button>

        <h2 id="functionality-explorer-title" className="text-3xl md:text-4xl font-bold">
          Funcionalidades y Software
        </h2>
        <p className="mt-2 text-xl text-gray-600 dark:text-gray-400">{categorySubtitles[category]}</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-blue-500" />
        </div>
      )}

      {error && (
        <div
          className="rounded-lg bg-red-100 p-4 text-center text-red-700 dark:bg-red-900 dark:text-red-200"
          role="alert"
        >
          <p className="font-semibold">Error</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {!isLoading && functionalities.length === 0 && !error && (
          <p className="col-span-full text-center text-gray-500 dark:text-gray-400">
            No se encontraron funcionalidades.
          </p>
        )}

        {functionalities.map(item => (
          <FunctionalityCard key={item.nombre} item={item} onSpeak={speak} />
        ))}
      </div>
    </section>
  );
};