"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Kolejka talii w Odkrywaj.
 *
 * Wcześniej talia trzymała **indeks** w tablicy z serwera — i to był błąd.
 * Lista z serwera zmienia się pod spodem: po wysłaniu zaproszenia ta osoba
 * wypada z wyników (bo rozmowa już trwa), więc tablica kurczyła się o jeden,
 * a indeks jednocześnie rósł o jeden. Efekt: przeskoczona karta albo indeks
 * za końcem tablicy i przedwczesne „to wszyscy".
 *
 * Tutaj nie ma indeksu. Jest zbiór obsłużonych identyfikatorów, a bieżąca
 * karta to pierwszy element, którego w nim nie ma. Taka kolejka jest odporna
 * na dowolne przeładowanie danych z serwera.
 */
export function useDeckQueue<T extends { id: string }>(items: T[]) {
  // Obsłużone w tej wizycie: pominięte ORAZ te, do których już napisano.
  const [handled, setHandled] = useState<string[]>([]);
  // Same pominięcia — tylko one wracają przez „Cofnij".
  const [passed, setPassed] = useState<string[]>([]);

  const handledSet = useMemo(() => new Set(handled), [handled]);

  const queue = useMemo(
    () => items.filter((item) => !handledSet.has(item.id)),
    [items, handledSet]
  );

  const current = queue[0] ?? null;

  /** Karta znika z kolejki — bez zapisywania pominięcia. */
  const handle = useCallback((id: string) => {
    setHandled((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  /** Karta znika jako pominięta i może wrócić przez „Cofnij". */
  const markPassed = useCallback((id: string) => {
    setHandled((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setPassed((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  /**
   * Cofnięcie ostatniego pominięcia bez przeładowania — osoba wraca na swoje
   * miejsce w kolejce. Zwraca false, gdy nie ma czego cofać lokalnie (pominięcie
   * z wcześniejszej wizyty nie ma karty w załadowanej talii).
   */
  const undoLastLocal = useCallback(() => {
    if (passed.length === 0) return false;
    const last = passed[passed.length - 1]!;
    setPassed((prev) => prev.slice(0, -1));
    setHandled((prev) => prev.filter((id) => id !== last));
    return true;
  }, [passed]);

  const reset = useCallback(() => {
    setHandled([]);
    setPassed([]);
  }, []);

  return {
    current,
    queue,
    /** Numer bieżącej karty, licząc od 1. */
    position: items.length - queue.length + 1,
    total: items.length,
    passedHere: passed.length,
    handle,
    markPassed,
    undoLastLocal,
    reset,
  };
}
