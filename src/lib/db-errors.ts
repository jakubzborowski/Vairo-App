/**
 * Jedno miejsce, w ktorym blad bazy zamienia sie w zdanie po polsku.
 *
 * Powod: uzytkownik nie moze nigdy zobaczyc `new row violates row-level
 * security policy for table "startups"`. Taki komunikat nie mowi mu nic poza
 * tym, ze cos jest zepsute — a najczesciej nic zepsute nie jest, tylko nie ma
 * uprawnien albo przekroczyl limit.
 */
export function translateDbError(message: string | null | undefined) {
  if (!message) return null;

  if (message.includes("row-level security")) {
    return "Nie masz uprawnien do tej zmiany. Jesli to blad, popros Foundera o wyzsza role.";
  }
  if (message.includes("startup_limit_reached")) {
    return "Limit 3 teamow na konto zostal osiagniety.";
  }
  if (message.includes("cannot_remove_last_founder")) {
    return "To jedyny Founder tego teamu. Najpierw przekaz te role komus innemu.";
  }
  if (message.includes("general_category_required")) {
    return "Kategorii „Ogolna walidacja” nie da sie usunac — jest obowiazkowa.";
  }
  if (message.includes("duplicate key")) {
    return "To juz istnieje. Odswiez strone i sprawdz, czy nie zostalo dodane wczesniej.";
  }
  if (message.includes("violates check constraint")) {
    return "Wpisana wartosc nie miesci sie w dozwolonym zakresie. Sprawdz dlugosc tekstu albo liczbe.";
  }
  if (message.includes("does not exist") || message.includes("schema cache")) {
    return "Brakuje migracji bazy danych. Odpal brakujace pliki w Supabase → SQL Editor.";
  }
  if (message.includes("goal_proof_required")) {
    return "Cel nie może być ukończony bez dowodu w wymaganym formacie.";
  }
  if (message.includes("goal_locked_reopen_first")) {
    return "Najpierw otwórz cel ponownie. Dopiero wtedy zmienisz wynik, typ albo dowód.";
  }
  if (message.includes("goal_type_mismatch")) {
    return "Ten cel ma inny typ niż warunek programu, więc nie da się go podpiąć.";
  }
  if (message.includes("goal_startup_mismatch")) {
    return "Cel i warunek muszą należeć do tego samego startupu.";
  }
  if (message.includes("goal_owner_not_in_team")) {
    return "Właścicielem może być tylko osoba z tego teamu.";
  }
  if (message.includes("goal_blocker_needs_note")) {
    return "Napisz, co blokuje pracę — samo oznaczenie nic nie mówi.";
  }
  if (message.includes("goal_proof_file_foreign")) {
    return "Ten plik nie należy do tego startupu.";
  }
  if (message.includes("goal_proof_workflow_missing")) {
    return "Nie ma takiej zapisanej wersji Rozpiski.";
  }
  if (message.includes("goal_archived")) {
    return "Zarchiwizowanego celu nie da się ukończyć.";
  }

  return message;
}
