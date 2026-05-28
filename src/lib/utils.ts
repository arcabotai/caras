import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date using Intl.DateTimeFormat.
 * Defaults to Spanish (LATAM) locale.
 */
export function format(
  date: Date,
  formatStr: string,
  locale: string = "es-CL"
): string {
  const localeMap: Record<string, Intl.DateTimeFormatOptions> = {
    "dd MMM yyyy": { day: "2-digit", month: "short", year: "numeric" },
    "dd MMM yyyy, HH:mm": {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  };
  const options = localeMap[formatStr] ?? { dateStyle: "medium" };
  return new Intl.DateTimeFormat(locale, options).format(date);
}
