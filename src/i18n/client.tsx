"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary, MessageKey, Namespace } from "@/i18n/messages";
import { makeTranslate, type Translate } from "@/i18n/translator";

/**
 * Słownik po stronie przeglądarki.
 *
 * Główny layout (serwer) podaje jeden scalony słownik bieżącego języka.
 * Importujemy tylko TYPY z `@/i18n/messages`, więc pliki JSON nie lądują
 * w paczce klienta — przychodzą raz, w payloadzie layoutu.
 */
type I18nState = { locale: Locale; messages: Dictionary };

const I18nContext = createContext<I18nState | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: I18nState & { children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18n(): I18nState {
  const state = useContext(I18nContext);
  if (!state) throw new Error("useT() poza <I18nProvider> — brakuje go w src/app/layout.tsx");
  return state;
}

export function useLocale(): Locale {
  return useI18n().locale;
}

/** `const t = useT("goals")` → `t("detail.title", { count: 3 })`. */
export function useT<N extends Namespace>(namespace: N): Translate<MessageKey<N>> {
  const { locale, messages } = useI18n();
  return useMemo(
    () => makeTranslate<MessageKey<N>>(locale, messages[namespace], namespace),
    [locale, messages, namespace]
  );
}
