// src/styles/theme.ts
import type { DisabilityCategory } from "../types";

export const CATEGORY_THEME: Record<
  DisabilityCategory,
  { subtitle: string; accent: "blue" | "green" | "purple" }
> = {
  visual:   { subtitle: "Para Discapacidad Visual",   accent: "blue"  },
  auditiva: { subtitle: "Para Discapacidad Auditiva", accent: "green" },
  habla:    { subtitle: "Para Discapacidad del Habla",accent: "purple"},
};

export function accentClasses(accent: "blue" | "green" | "purple") {
  const map = {
    blue:   { bg: "bg-blue-100 dark:bg-blue-900/40",   fg: "text-blue-600 dark:text-blue-400" },
    green:  { bg: "bg-green-100 dark:bg-green-900/40", fg: "text-green-600 dark:text-green-400" },
    purple: { bg: "bg-violet-100 dark:bg-violet-900/40", fg: "text-violet-600 dark:text-violet-400" },
  } as const;
  return map[accent];
}