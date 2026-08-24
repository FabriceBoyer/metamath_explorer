import type { VarColor } from "@/lib/metamath/substitution";

/**
 * Explicit (non-interpolated) Tailwind class strings per variable color —
 * Tailwind's JIT scanner needs to see full class names statically, so
 * these can't be built with template strings like `bg-${color}-500`.
 */
export const VAR_COLOR_CLASSES: Record<
  VarColor,
  { chip: string; text: string; ring: string; dot: string }
> = {
  blue: {
    chip: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    text: "text-blue-700 dark:text-blue-300",
    ring: "ring-blue-500/50",
    dot: "bg-blue-500",
  },
  amber: {
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500/50",
    dot: "bg-amber-500",
  },
  emerald: {
    chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-500/50",
    dot: "bg-emerald-500",
  },
  fuchsia: {
    chip: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
    ring: "ring-fuchsia-500/50",
    dot: "bg-fuchsia-500",
  },
  rose: {
    chip: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    text: "text-rose-700 dark:text-rose-300",
    ring: "ring-rose-500/50",
    dot: "bg-rose-500",
  },
  cyan: {
    chip: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
    text: "text-cyan-700 dark:text-cyan-300",
    ring: "ring-cyan-500/50",
    dot: "bg-cyan-500",
  },
};
