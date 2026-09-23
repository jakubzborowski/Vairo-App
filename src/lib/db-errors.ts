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

  return message;
}
