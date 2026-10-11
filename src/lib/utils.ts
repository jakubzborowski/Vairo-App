import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Polska liczba mnoga w trzech formach.
 *
 * Wzorzec `n === 1 ? "osoba" : "osób"` rozsiany po komponentach dawał
 * „2 osób" i „3 osób" — po polsku to po prostu błąd, a w aplikacji, której
 * obietnicą jest zwykły język, błąd widoczny w pierwszej linijce karty.
 *
 * Reguła: 1 → forma pojedyncza, końcówka 2–4 (ale nie 12–14) → forma „kilka",
 * reszta → forma dopełniacza.
 */
export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  const last = n % 10;
  const lastTwo = n % 100;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return few;
  return many;
}
