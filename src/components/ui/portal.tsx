"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const subscribeNoop = () => () => {};

/**
 * Przenosi nakładkę (modal, panel) na koniec `<body>`.
 *
 * Bez tego okno renderowało się wewnątrz `<main>`, a animacja wejścia strony
 * (`app-enter`) i animowane sekcje tworzą własny kontekst warstw. `z-50`
 * okna liczyło się wtedy tylko wewnątrz `<main>` — na telefonie górny pasek
 * aplikacji (`z-20`, poza `<main>`) przykrywał nagłówek okna razem
 * z przyciskiem „Zamknij”.
 *
 * Na serwerze i przy pierwszym renderze klienta nic nie rysuje — `document`
 * jeszcze nie istnieje, a różnica w HTML zepsułaby hydratację.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  return mounted ? createPortal(children, document.body) : null;
}
