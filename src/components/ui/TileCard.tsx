import React from "react";
import type { LucideIcon } from "lucide-react";

type TileCardProps = {
  title: string;
  description: string;
  chips?: string[];
  Icon: LucideIcon;
  AccentCircleBg: string;  // clases tailwind para el círculo
  AccentIconFg: string;    // clases tailwind para el icono
  primaryLabel?: string;
  onPrimary?: () => void;
};

export const TileCard: React.FC<TileCardProps> = ({
  title,
  description,
  chips = [],
  Icon,
  AccentCircleBg,
  AccentIconFg,
  primaryLabel = "Acción",
  onPrimary,
}) => {
  return (
    <div className="flex flex-col items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className={`mb-4 flex h-24 w-24 items-center justify-center rounded-full ${AccentCircleBg}`}>
        <Icon className={`h-10 w-10 ${AccentIconFg}`} />
      </div>

      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>

      <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">{description}</p>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {chips.map((c, i) => (
            <span
              key={`${c}-${i}`}
              className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {onPrimary && (
        <button
          onClick={onPrimary}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          {primaryLabel}
        </button>
      )}
    </div>
  );
};

export default TileCard;