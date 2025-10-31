// src/components/FunctionalityExplorer.tsx
import React, { useEffect, useState } from "react";
import { fetchAssistiveFunctionalities } from "../services/geminiService";
import { DisabilityCategory, Functionality } from "../types";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import { CATEGORY_THEME, accentClasses } from "../styles/theme";
import {
  Mic, Languages, Brain, Waves, BellRing, Volume2, Accessibility,
  Smartphone, Monitor, Headphones, BadgeInfo, type Icon as LucideIcon
} from "lucide-react";
import { TileCard } from "./ui/TileCard";

interface Props { category: DisabilityCategory; goBack: () => void; }

function pickIconByName(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("voz") || n.includes("habla") || n.includes("dictado")) return Mic;
  if (n.includes("seña") || n.includes("sign")) return Languages;
  if (n.includes("sonido") || n.includes("audio") || n.includes("ruido")) return Volume2;
  if (n.includes("alerta") || n.includes("notific")) return BellRing;
  if (n.includes("reconocim") || n.includes("inteligencia") || n.includes("ai")) return Brain;
  if (n.includes("vibrac") || n.includes("haptic")) return Waves;
  if (n.includes("accesib") || n.includes("lector")) return Accessibility;
  if (n.includes("móvil") || n.includes("android") || n.includes("ios")) return Smartphone;
  if (n.includes("pc") || n.includes("windows") || n.includes("mac")) return Monitor;
  if (n.includes("escucha") || n.includes("audio")) return Headphones;
  return BadgeInfo;
}

export const FunctionalityExplorer: React.FC<Props> = ({ category, goBack }) => {
  const [items, setItems] = useState<Functionality[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { speak } = useTextToSpeech();

  const theme = CATEGORY_THEME[category];
  const { bg: AccentCircleBg, fg: AccentIconFg } = accentClasses(theme.accent);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const base = await fetchAssistiveFunctionalities(category);
        // Normalizar por si faltan plataformas
        setItems(base.map(f => ({ ...f, plataformas: Array.isArray(f.plataformas) ? f.plataformas : [] })));
      } catch (e: any) {
        setError(e?.message ?? "Ocurrió un error.");
      } finally {
        setLoading(false);
      }
    })();
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
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Volver
        </button>

        <h2 id="functionality-explorer-title" className="text-3xl md:text-4xl font-bold">
          Funcionalidades y Software
        </h2>
        <p className="mt-2 text-xl text-gray-600 dark:text-gray-400">{theme.subtitle}</p>
      </div>

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className={`mb-4 h-24 w-24 rounded-full ${AccentCircleBg}`}/>
              <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-2 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-2 h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-100 p-4 text-center text-red-700 dark:bg-red-900 dark:text-red-200" role="alert">
          <p className="font-semibold">Error</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const Icon = pickIconByName(it.nombre);
            return (
              <TileCard
                key={it.nombre}
                title={it.nombre}
                description={it.descripcion}
                chips={it.plataformas}
                Icon={Icon}
                AccentCircleBg={AccentCircleBg}
                AccentIconFg={AccentIconFg}
                onPrimary={() =>
                  speak(`Funcionalidad: ${it.nombre}. Descripción: ${it.descripcion}. Plataformas: ${it.plataformas.join(", ")}`)
                }
              />
            );
          })}
        </div>
      )}
    </section>
  );
};