// src/components/DeviceFinder.tsx
import React, { useEffect, useState } from "react";
import { fetchAssistiveDevices } from "../services/geminiService";
import { DisabilityCategory, Device } from "../types";
import { useTextToSpeech } from "../hooks/useTextToSpeech";

// tema/estilo unificado
import { CATEGORY_THEME, accentClasses } from "../styles/theme";
import { TileCard } from "./ui/TileCard";

// Iconos (lucide-react)
import {
  Smartphone,
  Headphones,
  Keyboard,
  Camera,
  Monitor,
  Cpu,
  MousePointerClick,
  Accessibility,
  BadgeInfo,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DeviceFinderProps {
  category: DisabilityCategory;
  goBack: () => void;
}

function pickDeviceIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("braille")) return Keyboard;
  if (n.includes("smart") || n.includes("app") || n.includes("móvil")) return Smartphone;
  if (n.includes("cascos") || n.includes("auriculares") || n.includes("audio")) return Headphones;
  if (n.includes("cámara") || n.includes("lupa")) return Camera;
  if (n.includes("pc") || n.includes("monitor") || n.includes("pantalla")) return Monitor;
  if (n.includes("ia") || n.includes("procesador")) return Cpu;
  if (n.includes("puntero") || n.includes("ratón")) return MousePointerClick;
  if (n.includes("accesib") || n.includes("adapt")) return Accessibility;
  return BadgeInfo;
}

export const DeviceFinder: React.FC<DeviceFinderProps> = ({ category, goBack }) => {
  const [items, setItems] = useState<Device[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { speak } = useTextToSpeech();

  const theme = CATEGORY_THEME[category];
  const { bg: AccentCircleBg, fg: AccentIconFg } = accentClasses(theme.accent);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
    try {
      // permitimos respuestas parciales y luego normalizamos
      const base = (await fetchAssistiveDevices(category)) as Array<Partial<Device>>;

      const normalized: Device[] = base.map((d) => ({
        nombre: d.nombre ?? "",
        descripcion: d.descripcion ?? "",
        caracteristicas: Array.isArray(d.caracteristicas) ? d.caracteristicas : [],
        imageUrl: typeof d.imageUrl === "string" ? d.imageUrl : "",
      }));

      setItems(normalized);
    } catch (e: any) {
      setError(e?.message ?? "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
    })();
  }, [category]);

  return (
    <section aria-labelledby="device-finder-title">
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
        <h2 id="device-finder-title" className="text-3xl md:text-4xl font-bold">
          Catálogo de Dispositivos
        </h2>
        <p className="mt-2 text-xl text-gray-600 dark:text-gray-400">{theme.subtitle}</p>
      </div>

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className={`mb-4 h-24 w-24 rounded-full ${AccentCircleBg}`} />
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
          {items.map((d) => {
            const Icon = pickDeviceIcon(d.nombre);
            return (
              <TileCard
                key={d.nombre}
                title={d.nombre}
                description={d.descripcion}
                chips={(d.caracteristicas || []).slice(0, 4)}
                Icon={Icon}
                AccentCircleBg={AccentCircleBg}
                AccentIconFg={AccentIconFg}
                onPrimary={() =>
                  speak(
                    `Dispositivo: ${d.nombre}. Descripción: ${d.descripcion}. Características: ${d.caracteristicas.join(
                      ", "
                    )}.`
                  )
                }
                primaryLabel="Leer Descripción"
              />
            );
          })}
        </div>
      )}
    </section>
  );
};