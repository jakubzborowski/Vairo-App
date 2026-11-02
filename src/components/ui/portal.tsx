"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const subscribeNoop = () => () => {};

// Ile nakładek jest teraz otwartych — panel z modalem nad nim zdejmuje
// blokadę dopiero wtedy, gdy zamknie się ostatnia.
let openOverlays = 0;

/**
 * Przenosi nakładkę (modal, panel) na koniec `<body>`.
 *
 * Bez tego okno renderowało się wewnątrz `<main>`, a animacja wejścia strony
 * (`app-enter`) i animowane sekcje tworzą własny kontekst warstw. `z-50`
 * okna liczyło się wtedy tylko wewnątrz `<main>` — na telefonie górny pasek
 * aplikacji (`z-20`, poza `<main>`) przykrywał nagłówek okna razem
 * z przyciskiem „Zamknij”.
 *
 * Póki nakładka jest otwarta, strona pod nią się nie przewija — inaczej przy
 * dłuższym oknie były dwa paski przewijania, a kółko myszy przewijało tło.
 *
 * Na serwerze i przy pierwszym renderze klienta nic nie rysuje — `document`
 * jeszcze nie istnieje, a różnica w HTML zepsułaby hydratację.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  useEffect(() => {
    const root = document.documentElement;
    openOverlays += 1;
    if (openOverlays === 1) root.style.overflow = "hidden";
    return () => {
      openOverlays -= 1;
      if (openOverlays === 0) root.style.overflow = "";
    };
  }, []);

  return mounted ? createPortal(children, document.body) : null;
}
