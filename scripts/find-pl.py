#!/usr/bin/env python3
"""Szuka polskich tekstów w kodzie poza komentarzami (pomoc przy i18n).

  python3 scripts/find-pl.py [ścieżka...]     domyślnie src/

Bierze literały w cudzysłowach i backtickach oraz tekst JSX i zgłasza te,
w których są polskie znaki albo typowe polskie słowa. Pomija komentarze,
importy, klasy CSS i klucze słowników. To heurystyka — pomaga znaleźć, czego
jeszcze nie przeniesiono do słowników, nie zastępuje przeczytania pliku.
"""
import os
import re
import sys

DIACRITICS = re.compile(r"[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]")
WORDS = set("""
a albo ale aby bez być by był była było co czy dla do dni dzień go godz godzin i ich ile im
in jak jako jakie jakiś jeden jedna jedno jego jej jest jeszcze już ją każdy kiedy kim kto
który która które ma mają masz mi może można mnie na nad nam nas nic nie nim niż no o od
oraz osoba osoby osób po pod przed przez przy pusto roli rola sam są się ta tak tam te ten
tej tego temu to tu ty tych tylko tym u w we wszystko wszystkie z za ze że żeby
Dalej Zapisz Anuluj Wróć Usuń Zamknij Dodaj Edytuj Szukaj Wyślij Cele Zadania Etap Profil
Konto Ustawienia Brak Tak Nie Teraz Gotowe Opis Nazwa Nowy Nowa Nowe Pokaż Otwórz Pomiń
Godziny Dozwolone Wybierz Wpisz Zmień Plik Pliki Folder Termin Dokument Dokumenty Wersja
Rozpiska Notatka Kalendarz Pomoc Program Zadanie Cel Zobacz Status Data Tytuł Opcjonalne
""".split())
SKIP_DIRS = {"node_modules", ".next", "i18n"}
LIT = re.compile(r'"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`')


def strip_comments(text: str) -> str:
    out, i, n, in_str = [], 0, len(text), None
    while i < n:
        ch = text[i]
        if in_str:
            out.append(ch)
            if ch == "\\" and i + 1 < n:
                out.append(text[i + 1]); i += 2; continue
            if ch == in_str:
                in_str = None
            i += 1; continue
        if ch in "\"'`":
            in_str = ch; out.append(ch); i += 1; continue
        if text.startswith("//", i) and (i == 0 or text[i - 1] != ":"):
            j = text.find("\n", i); i = n if j < 0 else j; continue
        if text.startswith("/*", i):
            j = text.find("*/", i + 2); j = n if j < 0 else j + 2
            out.append("\n" * text.count("\n", i, j)); i = j; continue
        out.append(ch); i += 1
    return "".join(out)


def polish(s: str) -> bool:
    s = re.sub(r"\$\{[^}]*\}", " ", s)
    if not re.search(r"[A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ]{2}", s):
        return False
    if DIACRITICS.search(s):
        return True
    tokens = s.split()
    if tokens and sum(bool(re.search(r"[-:\[\]/_.#%]|^\d", x)) for x in tokens) * 2 >= len(tokens):
        return False  # lista klas CSS, ścieżka, selektor
    words = re.findall(r"[A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ]+", s)
    hits = [w for w in words if w in WORDS]
    if any(w[0].isupper() and len(w) > 2 for w in hits):
        return True
    return (len(hits) >= 2 and len(hits) * 3 >= len(words)) or (len(hits) >= 1 and len(words) >= 3 and len(hits) * 4 >= len(words))


def scan(path: str):
    text = strip_comments(open(path, encoding="utf8").read())
    hits = []
    for no, line in enumerate(text.split("\n"), 1):
        st = line.strip()
        if not st or st.startswith(("import ", "export * from", "} from ")):
            continue
        if re.search(r'\bt[a-z]*\(\s*["`]', line) and not LIT.sub("", re.sub(r'\bt[a-z]*\(\s*"[^"]*"', "", line)).strip():
            pass
        found = False
        for m in LIT.finditer(line):
            s = m.group(1) if m.group(1) is not None else m.group(2)
            before = line[: m.start()]
            if re.search(r"(className|class|href|src|id|key|type|name|variant|tone|size|icon|role|method|target|rel)\s*=\s*\{?\s*$", before):
                continue
            if re.search(r"\b(t[a-z]*(\.maybe|\.has)?|getT|useT|cn|clsx|require)\(\s*$", before):
                continue
            if polish(s):
                found = True; break
        if not found:
            # Tekst JSX poza literałami: po usunięciu literałów i wyrażeń.
            bare = LIT.sub(" ", line)
            bare = re.sub(r"\{[^{}]*\}", " ", bare)
            bare = re.sub(r"<[^>]*>", " ", bare)
            if re.search(r"[=;()]|=>|&&|\|\||^\s*[\w.]+\s*:", bare):
                bare = ""
            if polish(bare):
                found = True
        if found:
            hits.append((no, st))
    return hits


def main():
    roots = sys.argv[1:] or ["src"]
    total = files = 0
    for root in roots:
        paths = [root] if os.path.isfile(root) else [
            os.path.join(d, f)
            for d, ds, fs in os.walk(root)
            if not (ds.__setitem__(slice(None), [x for x in ds if x not in SKIP_DIRS]))
            for f in fs if f.endswith((".ts", ".tsx"))
        ]
        for path in sorted(paths):
            hits = scan(path)
            if hits:
                files += 1; total += len(hits)
                print(path)
                for no, st in hits:
                    print(f"  {no}: {st[:160]}")
                print()
    print(f"{total} linii w {files} plikach")


if __name__ == "__main__":
    main()
