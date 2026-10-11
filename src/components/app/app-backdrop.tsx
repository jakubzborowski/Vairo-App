import Image from "next/image";

/**
 * Tło całej sekcji po zalogowaniu.
 *
 * Historia tego pliku to spór, który warto zapisać, bo łatwo go powtórzyć.
 * Wersja pierwsza miała **pomarańczowe poświaty** — rozmyte plamy światła pod
 * treścią. Wyglądało tanio i to nie był przypadek: rozmycie nie ma krawędzi,
 * więc nie da się go odczytać jako decyzji projektowej, a nasyceniem
 * konkuruje z przyciskiem, który ma znaczyć „tu kliknij". Wersja druga
 * wyrzuciła kolor w całości i była bezpieczna, ale martwa.
 *
 * Wniosek, który z tego został: **ozdoba musi mieć krawędź.** Rozmyta plama
 * koloru to brud. Rysunek konturowy przy tym samym nasyceniu to grafika.
 * Dlatego fale marki wracają — pomarańczowe, ale jako **linia**, nie jako
 * mgła, i w dwóch przeciwległych rogach, tak jak na materiałach marki.
 *
 * Ruch: cykl 34 i 40 sekund, przesunięcie kilku procent, obrót o dwa stopnie.
 * Tak wolno, że przy patrzeniu nie widać, że coś się dzieje — widać dopiero,
 * że ekran nie jest martwy. Wszystko szybsze zaczyna odciągać wzrok, a tło,
 * które odciąga wzrok, przestaje być tłem. Przy `prefers-reduced-motion` ruch
 * znika całkowicie (obsłużone globalnie w `globals.css`).
 */
export function AppBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Jedno źródło światła u góry — bezbarwne. To ono sprawia, że karty
          niżej czyta się jako przedmioty leżące na powierzchni. */}
      <div className="absolute inset-x-0 top-0 h-[42vh] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0)_100%)]" />

      {/* Lewy górny róg — ale CZYJ róg.
          Na telefonie okno jest całym ekranem, więc fala wychodzi z jego rogu.
          Na desktopie rogiem, który człowiek widzi, jest miejsce, w którym
          kończy się sidebar: fala wychodzi stamtąd (248 px = szerokość
          sidebara). Gdyby trzymała się rogu okna, chowałaby się za menu,
          a rozmywanie menu na tyle, żeby prześwitywała, psuje kontrast logo. */}
      <div className="drift-slow absolute -left-[14vmin] -top-[20vmin] hidden h-[52vmin] w-[52vmin] opacity-[0.12] md:block lg:left-[calc(248px_-_14vmin)]">
        <Image
          src="/brand/wave-smooth.png"
          alt=""
          fill
          sizes="48vmin"
          className="object-contain object-left-top"
          priority={false}
        />
      </div>

      {/* Prawy dolny róg: kontur. Linia znosi skalowanie lepiej niż plama.
          Krycie trzymamy przy 11% — przy 20% rysunek zaczynał prześwitywać
          przez tekst listy „Co teraz", a ozdoba, którą trzeba omijać wzrokiem
          przy czytaniu, przestaje być ozdobą. */}
      <div className="drift-slower absolute -bottom-[16vmin] -right-[14vmin] hidden h-[56vmin] w-[56vmin] opacity-[0.11] md:block">
        <Image
          src="/brand/wave-contour.png"
          alt=""
          fill
          sizes="54vmin"
          className="object-contain object-right-bottom"
          priority={false}
        />
      </div>

      {/* Ziarno na wierzchu. Czysta czerń wygląda jak dziura w ekranie;
          szum daje jej fakturę, kosztuje ~1 kB i nie ma koloru. */}
      <div className="grain absolute inset-0 opacity-[0.035]" />
    </div>
  );
}
