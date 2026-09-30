/**
 * Jeden tłumacz błędów bazy na polski.
 *
 * Postgres i PostgREST mówią po angielsku, kodami i nazwami ograniczeń.
 * Człowiek, który pierwszy raz widzi tę aplikację, ma z tego zrozumieć, co
 * zrobić dalej — więc każdy komunikat mówi **co się stało i co z tym zrobić**,
 * a nie jak nazywa się naruszony constraint.
 *
 * Dwie rzeczy, które ten plik miał źle i warto zapisać dlaczego:
 *
 * **Polskie znaki.** Komunikaty były pisane bez ogonków („uprawnien", „Jesli
 * to blad", „Odswiez"), bo powstały w pliku SQL, gdzie tak jest bezpieczniej.
 * Ale to jest tekst pokazywany użytkownikowi w aplikacji, w której cała reszta
 * ma poprawną polszczyznę — i akurat pojawia się w najgorszym momencie, czyli
 * gdy coś poszło nie tak. Wygląda wtedy jak druga, gorsza aplikacja pod spodem.
 *
 * **Surowy komunikat na końcu.** Funkcja kończyła się `return message`, czyli
 * przy nieznanym błędzie wypluwała do interfejsu tekst Postgresa. CLAUDE.md
 * mówi wprost: „żaden komunikat błędu nie wychodzi surowy". Teraz nieznany
 * błąd dostaje zdanie po polsku, a oryginał ląduje w logu serwera — tam, gdzie
 * jest komuś potrzebny.
 */
export function translateDbError(message: string | null | undefined) {
  if (!message) return null;

  if (message.includes("row-level security")) {
    return "Nie masz uprawnień do tej zmiany. Jeśli to pomyłka, poproś Foundera o wyższą rolę.";
  }
  if (message.includes("startup_limit_reached")) {
    return "Limit 3 teamów na konto został osiągnięty.";
  }
  if (message.includes("cannot_remove_last_founder")) {
    return "To jedyny Founder tego teamu. Najpierw przekaż tę rolę komuś innemu.";
  }
  if (message.includes("general_category_required")) {
    return "Kategorii „Ogólna walidacja” nie da się usunąć — jest obowiązkowa.";
  }
  if (message.includes("duplicate key")) {
    return "To już istnieje. Odśwież stronę i sprawdź, czy nie zostało dodane wcześniej.";
  }
  if (message.includes("violates check constraint")) {
    return "Wpisana wartość nie mieści się w dozwolonym zakresie. Sprawdź długość tekstu albo liczbę.";
  }
  if (message.includes("violates foreign key")) {
    return "Element, do którego to się odwołuje, już nie istnieje. Odśwież stronę.";
  }
  if (message.includes("does not exist") || message.includes("schema cache")) {
    return "Brakuje migracji bazy danych. Odpal brakujące pliki w Supabase → SQL Editor.";
  }
  if (message.includes("JWT") || message.includes("not_authenticated")) {
    return "Sesja wygasła. Zaloguj się ponownie.";
  }

  // Nieznany błąd: user dostaje zdanie, z którym da się coś zrobić, a pełna
  // treść trafia do logu serwera — nie na ekran.
  console.error("[db]", message);
  return "Coś poszło nie tak po stronie bazy. Odśwież stronę i spróbuj jeszcze raz.";
}
