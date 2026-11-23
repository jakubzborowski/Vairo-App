#!/usr/bin/env python3
"""Szuka polskich tekstów w kodzie poza komentarzami (pomoc przy i18n).

  python3 scripts/find-pl.py [ścieżka...]     domyślnie src/

Zgłasza linie z polskimi znakami albo typowymi polskimi słowami w literałach
i tekście JSX. Komentarze (//, /* */, {/* */}) są pomijane. To heurystyka —
pomaga znaleźć, czego jeszcze nie przeniesiono do słowników, nie zastępuje
przeczytania pliku.
"""
import os
import re
import sys

DIACRITICS = re.compile(r"[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]")
WORDS = re.compile(
    r"\b(Dalej|Zapisz|Anuluj|Wróć|Usuń|Zamknij|Dodaj|Edytuj|Szukaj|Wyślij|Zespół|Cele|"
    r"Zadania|Etap|Profil|Konto|Ustawienia|Wyloguj|Zaloguj|Brak|Tak|Nie|albo|oraz|jest|"
    r"się|tego|przez|żeby|Twój|Twoje|Twoja|Ciebie|nie ma|zobacz|Zobacz|Otwórz|Pomiń|tydz|"
    r"Czeka|Wycofaj|Przyjmij|Napisz|Pokaż|Nowy|Nowa|Nowe|Szukam|Ustaw|Edytuj|Kopiuj|Plik|Pliki|"
    r"Folder|Zadanie|Termin|Terminy|Dokument|Dokumenty|Wersja|Wersje|Rozpiska|Notatka|Opis|"
    r"Nazwa|Tytu|Status|Teraz|Dzisiaj|Jutro|Wczoraj|Gotowe|Zrobione|Blokada|Dowod|Dowody|"
    r"Kontakt|Rozmowa|Rozmowy|Wiadomo|Zaproszenie|Zgłoszenie|Profil|Umiej|Branż|Kategori|projekt\w*|Projekt\w*|Strona|Kogo|Kto|Pasuje|dla|czy|jak|Jak|jeszcze|Ci|zespo\w*|Zespo\w*|Rekrut\w*|Pomoc|Opinie|Program|Kalendarz|Dodano|Zmieniono|Wpisz|Wybierz|Opcjonalnie|minut|godzin|dni|osoba|osoby|osob)\b"
)
SKIP_DIRS = {"node_modules", ".next", "i18n"}


def strip_comments(text: str) -> str:
    out = []
    i = 0
    n = len(text)
    in_str = None
    while i < n:
        ch = text[i]
        if in_str:
            out.append(ch)
            if ch == "\\" and i + 1 < n:
                out.append(text[i + 1])
                i += 2
                continue
            if ch == in_str:
                in_str = None
            i += 1
            continue
        if ch in "\"'`":
            in_str = ch
            out.append(ch)
            i += 1
            continue
        if text.startswith("//", i) and (i == 0 or text[i - 1] != ":"):
            j = text.find("\n", i)
            j = n if j < 0 else j
            i = j
            continue
        if text.startswith("/*", i):
            j = text.find("*/", i + 2)
            j = n if j < 0 else j + 2
            out.append("\n" * text.count("\n", i, j))
            i = j
            continue
        out.append(ch)
        i += 1
    return "".join(out)


def scan(path: str):
    with open(path, encoding="utf8") as f:
        text = f.read()
    stripped = strip_comments(text)
    hits = []
    for no, line in enumerate(stripped.split("\n"), 1):
        if "console." in line:
            continue
        if DIACRITICS.search(line) or WORDS.search(line):
            hits.append((no, line.strip()))
    return hits


def main():
    roots = sys.argv[1:] or ["src"]
    total = 0
    files = 0
    for root in roots:
        paths = [root] if os.path.isfile(root) else [
            os.path.join(d, f)
            for d, dirs, fs in os.walk(root)
            if not (set(d.split(os.sep)) & SKIP_DIRS)
            for f in fs
            if f.endswith((".ts", ".tsx"))
        ]
        for path in sorted(paths):
            hits = scan(path)
            if hits:
                files += 1
                total += len(hits)
                print(f"\n{path}")
                for no, line in hits:
                    print(f"  {no}: {line[:140]}")
    print(f"\n{total} linii w {files} plikach")


if __name__ == "__main__":
    main()
