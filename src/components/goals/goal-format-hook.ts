"use client";

import { useMemo } from "react";
import { useLocale, useT } from "@/i18n/client";
import { makeDateFormat, makeGoalFormat } from "./goal-format";

/** Zestaw z goal-format.ts w języku użytkownika — dla komponentów klienckich. */
export function useGoalFormat() {
  const t = useT("goals");
  const locale = useLocale();
  return useMemo(() => makeGoalFormat(t, locale), [t, locale]);
}

/** Same daty (Pliki, Dokumenty, Rozpiska). */
export function useDateFormat() {
  const locale = useLocale();
  return useMemo(() => makeDateFormat(locale), [locale]);
}
