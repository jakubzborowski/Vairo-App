"use client";

import { useCallback } from "react";
import { useT } from "@/i18n/client";
import { dbErrorText } from "@/lib/db-error-keys";

/** Klient: `const dbError = useDbError(); setError(dbError(error.message))`. */
export function useDbError() {
  const t = useT("errors");
  return useCallback((message: string | null | undefined) => dbErrorText(t, message), [t]);
}
