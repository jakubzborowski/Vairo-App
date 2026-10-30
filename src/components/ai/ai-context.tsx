"use client";

import { createContext, useContext } from "react";

/**
 * Czy mentor AI jest włączony (jest ANTHROPIC_API_KEY na serwerze).
 * Bez klucza przycisków nie ma wcale — CLAUDE.md: zero udawanego UI.
 */
const AiEnabledContext = createContext(false);

export function AiProvider({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  return <AiEnabledContext.Provider value={enabled}>{children}</AiEnabledContext.Provider>;
}

export function useAiEnabled() {
  return useContext(AiEnabledContext);
}
