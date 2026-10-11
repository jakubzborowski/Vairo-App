"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Liczba, która doliczy się do wartości zamiast pojawić się gotowa.
 *
 * To jest ozdoba i tak ją traktujemy — ale ozdoba, która **niesie
 * informację**: ruch od zera w górę mówi, że to jest miara czegoś, co rośnie,
 * a nie przypadkowy numer. Dlatego dostają go tylko panele z metryką
 * (procent kompletności, liczba osób), nigdy etykiety w rodzaju „2 z 5".
 *
 * Trzy rzeczy, które trzeba tu było zrobić dobrze:
 *
 *   • **Wartość startowa to wartość końcowa, nie zero.** Komponent renderuje
 *     się na serwerze i przy pierwszym malowaniu pokazuje gotową liczbę;
 *     dopiero efekt cofa ją do zera i rozpędza. Gdyby startował od zera,
 *     ktoś z wyłączonym JavaScriptem zostałby z „0%" na stałe.
 *   • **`prefers-reduced-motion` sprawdzamy w JS, nie w CSS.** To jest
 *     animacja liczby, nie właściwości — media query jej nie zatrzyma.
 *   • **`requestAnimationFrame`, nie `setInterval`.** Interval rozjeżdża się
 *     z odświeżaniem ekranu i daje szarpanie przy dłuższych wartościach.
 */
export function CountUp({
  value,
  suffix = "",
  durationMs = 750,
  delayMs = 120,
}: {
  value: number;
  suffix?: string;
  durationMs?: number;
  delayMs?: number;
}) {
  const [shown, setShown] = useState(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || value === 0) {
      // Ustawienie stanu odkładamy do następnej klatki. Synchroniczne
      // `setState` w efekcie wywołuje kaskadę renderów — a tutaj i tak
      // najczęściej nie ma czego zmieniać, bo stan startowy to już `value`.
      const id = requestAnimationFrame(() => {
        if (!cancelled) setShown(value);
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(id);
      };
    }

    const start = performance.now() + delayMs;

    const tick = (now: number) => {
      if (cancelled) return;
      const elapsed = now - start;

      if (elapsed < 0) {
        setShown(0);
        frame.current = requestAnimationFrame(tick);
        return;
      }

      const progress = Math.min(elapsed / durationMs, 1);
      // Ta sama krzywa co `--ease-out` w CSS: szybko rusza, miękko dojeżdża.
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(value * eased));

      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [value, durationMs, delayMs]);

  return (
    <>
      {shown}
      {suffix}
    </>
  );
}
