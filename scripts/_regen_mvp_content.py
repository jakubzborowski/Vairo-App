# -*- coding: utf-8 -*-
"""Regeneruje mvp-v1.json + mvp-v1.guides.json z extractów DOCX.

Poprawki:
1. Point keys z prefiksem kategorii → brak kolizji answer_key między warstwami.
2. goal_conditions na podpunktach z podręczników B2B/B2C (+ heurystyka short).
3. Przewodniki: długi podręcznik per punkt (B2B/B2C); short — wycinek Przewodnika.
4. Bez opcji „Wstrzymuję projekt” (pauza = close_stage).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTRACT = ROOT / "_plan" / "docx-extract"
OUT_JSON = ROOT / "supabase" / "content" / "mvp-v1.json"
OUT_GUIDES = ROOT / "supabase" / "content" / "mvp-v1.guides.json"


def slugify(text: str) -> str:
    t = text.lower()
    for a, b in {
        "ą": "a", "ć": "c", "ę": "e", "ł": "l", "ń": "n",
        "ó": "o", "ś": "s", "ź": "z", "ż": "z",
    }.items():
        t = t.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:80]


def load(name: str) -> str:
    return (EXTRACT / name).read_text(encoding="utf-8")


def split_short_points(text: str) -> list[tuple[str, list[tuple[str, str]]]]:
    """Format short DOCX: 'Punkt N: Tytuł' + linie 'Podpunkt: pytanie'."""
    m = re.search(r"^Punkt\s+1\b", text, re.M)
    if not m:
        raise SystemExit("brak Punkt 1 w short doc")
    body = text[m.start() :]
    cut = re.search(r"^Przewodnik\b", body, re.M)
    if cut:
        body = body[: cut.start()]

    titles = re.findall(r"^Punkt\s+\d+:\s*(.+)$", body, re.M)
    chunks = re.split(r"^Punkt\s+\d+:\s*.+$", body, flags=re.M)[1:]
    if len(titles) != len(chunks):
        raise SystemExit(f"niespójne punkty: {len(titles)} vs {len(chunks)}")

    points: list[tuple[str, list[tuple[str, str]]]] = []
    for title, chunk in zip(titles, chunks):
        subs: list[tuple[str, str]] = []
        for line in chunk.splitlines():
            line = line.strip()
            if not line or line.startswith("Punkt "):
                continue
            if ":" not in line:
                continue
            stitle, question = line.split(":", 1)
            stitle = stitle.strip()
            question = question.strip()
            if not stitle or not question:
                continue
            # odrzuć linie typu "B2C - MVP"
            if len(stitle) < 3:
                continue
            subs.append((stitle, question))
        points.append((title.strip(), subs))
    return points


def extract_przewodnik(text: str) -> str:
    m = re.search(r"^Przewodnik[^\n]*\n(.*?)(?=^[A-Z].*Podręcznik|^[A-Z].*Podrecznik|\Z)", text, re.M | re.S)
    if not m:
        m = re.search(r"^Przewodnik[^\n]*\n(.*)", text, re.M | re.S)
    if not m:
        return ""
    body = m.group(1)
    # odetnij podręcznik jeśli regex nie złapał
    cut = re.search(r"\n(?:B2B |B2C |)?Execution:\s*Podr", body)
    if cut:
        body = body[: cut.start()]
    return body.strip()


def extract_handbook_points(text: str) -> dict[str, str]:
    i = re.search(r"Podręcznik|Podrecznik", text)
    if not i:
        return {}
    # znajdź początek sekcji podręcznika (linia z Podręcznik)
    start = text.rfind("\n", 0, i.start()) + 1
    # idź do pierwszego "Punkt N:" po markerze
    hb = text[start:]
    first_punkt = re.search(r"^Punkt\s+\d+:", hb, re.M)
    if not first_punkt:
        return {}
    hb = hb[first_punkt.start() :]
    parts = re.split(r"\n(?=Punkt\s+\d+:)", hb)
    out: dict[str, str] = {}
    for part in parts:
        part = part.strip()
        if not part.startswith("Punkt"):
            continue
        first, _, rest = part.partition("\n")
        tm = re.match(r"Punkt\s+\d+:\s*(.+)$", first.strip())
        if not tm:
            continue
        title = tm.group(1).strip()
        body = re.sub(r"\n{3,}", "\n\n", rest.strip())
        out[title] = body
    return out


def handbook_section_goals(text: str) -> list[tuple[str, str, str]]:
    """Lista (slug tytułu sekcji handbook 1.x, body, goal_type)."""
    i = re.search(r"Podręcznik|Podrecznik", text)
    if not i:
        return []
    start = text.rfind("\n", 0, i.start()) + 1
    hb = text[start:]
    results = []
    for m in re.finditer(r"^(\d+\.\d+)\.\s+(.+)$", hb, re.M):
        num, title = m.group(1), m.group(2).strip()
        s = m.end()
        nxt = re.search(r"^\d+\.\d+\.\s+|^Punkt\s+\d+:", hb[s:], re.M)
        body = hb[s : s + (nxt.start() if nxt else len(hb))]
        if "Wynik budowy" in body:
            gtype = "build_result"
        elif "Wynik testu" in body:
            gtype = "product_test"
        elif re.search(r"Podepnij\s+(istniejąc\w+\s+)?Goal", body, re.I):
            gtype = "research"
        elif re.search(
            r"\bproof\b|dowód|dowodem|karcie celu|w karcie celu",
            body,
            re.I,
        ):
            # sekcja kontynuuje poprzedni cel — typ z poprzedniej sekcji punktu
            gtype = "_proof"
        else:
            gtype = None
        results.append((num, title, body, gtype))
    # uzupełnij _proof typem z poprzedniej sekcji tego samego punktu
    last = None
    filled = []
    for num, title, body, gtype in results:
        if gtype == "_proof":
            gtype = last or "build_result"
        if gtype and gtype != "_proof":
            last = gtype
        filled.append((num, title, body, gtype))
    return filled


def match_handbook_goal(sub_title: str, sections: list) -> str | None:
    """Dopasuj short subpoint do sekcji podręcznika po fragmencie tytułu."""
    st = sub_title.lower()
    st_slug = slugify(sub_title)
    best = None
    for num, title, body, gtype in sections:
        if not gtype:
            continue
        # tytuł sekcji może łączyć dwa short: "A oraz B" / "A i B"
        if st in title.lower() or st_slug in slugify(title):
            return gtype
        # pierwsze znaczące słowa
        words = [w for w in re.split(r"\W+", st) if len(w) > 5]
        if words and all(w in title.lower() or w in body.lower()[:400] for w in words[:2]):
            best = gtype
    return best


def point_excerpt(przewodnik: str, point_title: str) -> str:
    if not przewodnik:
        return ""
    words = [w for w in re.split(r"\W+", point_title.lower()) if len(w) > 4]
    if not words:
        return re.sub(r"\s+", " ", przewodnik).strip()

    # Hardware (i podobne) — osobne akapity: weź najwyżej punktowany
    paras = [p.strip() for p in re.split(r"\n\s*\n", przewodnik) if p.strip()]
    if len(paras) > 1:
        scored = []
        for p in paras:
            pl = p.lower()
            score = sum(1 for w in words if w in pl)
            scored.append((score, p))
        scored.sort(key=lambda x: -x[0])
        if scored[0][0] > 0:
            return scored[0][1]

    # Jeden długi akapit — wybierz 1–2 najlepsze zdania, nie cały skrót
    sentences = re.split(r"(?<=[.!?])\s+", re.sub(r"\s+", " ", przewodnik))
    scored = []
    for i, s in enumerate(sentences):
        sl = s.lower()
        score = sum(2 if w in sl else 0 for w in words[:3])
        score += sum(1 for w in words[3:] if w in sl)
        # lekki bonus za pozycję zgodną z numerem punktu (wcześniejsze punkty → wcześniejsze zdania)
        scored.append((score, i, s))
    scored.sort(key=lambda x: (-x[0], x[1]))
    if scored and scored[0][0] > 0:
        # weź najlepsze + ewentualnie sąsiada z wynikiem > 0
        best_i = scored[0][1]
        picked = [scored[0][2]]
        for score, i, s in scored[1:]:
            if score > 0 and abs(i - best_i) == 1 and len(picked) < 2:
                picked.append(s)
        # zachowaj kolejność zdania
        order = {s: n for n, s in enumerate(sentences)}
        picked.sort(key=lambda s: order[s])
        return " ".join(picked).strip()
    return sentences[0].strip() if sentences else ""


def note_field(question: str, help_text: str | None = None) -> dict:
    return {
        "key": "note",
        "kind": "long_text",
        "question": question,
        "help": help_text or question,
        "config": {"min": 20},
    }


def decision_field(question: str) -> dict:
    q = question if question.rstrip().endswith("?") else f"{question.rstrip(' .')} — co wybierasz?"
    return {
        "key": "decision",
        "kind": "select",
        "question": q,
        "help": (
            "Wybierz kierunek pracy. Żeby wstrzymać albo zarchiwizować startup, "
            "zakończ etap decyzją pauza lub archiwum — sama odpowiedź tego nie zrobi."
        ),
        "config": {
            "options": [
                {"value": "continue", "label": "Kontynuuję w tym kierunku"},
                {"value": "improve", "label": "Najpierw poprawiam produkt"},
                {"value": "pivot", "label": "Zmieniam kierunek"},
            ]
        },
    }


DECISION_TITLES = {
    "oceń potrzebę zmiany kierunku",
    "ocen potrzebę zmiany kierunku",
    "podejmij decyzję o dalszym działaniu",
    "podejmij decyzje o dalszym dzialaniu",
    "podejmij decyzję o zamówieniu masowym",
    "podejmij decyzje o zamowieniu masowym",
    "podejmij decyzję o skalowaniu lub zmianie",
    "podejmij decyzje o skalowaniu lub zmianie",
}


def is_decision(title: str) -> bool:
    return slugify(title) in {slugify(t) for t in DECISION_TITLES} or title.lower() in DECISION_TITLES


def infer_goal_short(sub_title: str, point_title: str) -> str | None:
    """Heurystyka dla warstw bez długiego podręcznika (general/saas/hardware)."""
    if is_decision(sub_title):
        return None
    blob = f"{point_title} {sub_title}".lower()

    # decyzje / kierunek bez twardego wyniku
    if any(
        x in blob
        for x in (
            "rozważ zmian",
            "rozwaz zmian",
            "określ kolejny kierunek",
            "okresl kolejny kierunek",
            "określ kolejną iterację",
            "okresl kolejna iteracje",
        )
    ):
        return None

    build = (
        "zbuduj", "zrealizuj", "uruchom", "połącz", "polacz", "przygotuj mvp",
        "udostępnij saas", "udostepnij saas", "wprowadź", "wprowadz",
        "wyślij", "wyslij", "zaktualizuj", "firmware", "zamknij listę",
        "renegocj", "procedur",
    )
    test = (
        "test", "obserwuj", "udostępnij", "udostepnij", "zmierz", "retenc",
        "aktywac", "onboarding", "nps", "awaryj", "konwers", "churn",
        "odnowień", "odnowien", "anulowań", "anulowan", "powracal",
        "unboxing", "przesył", "przesyl", "rma",
    )
    research = (
        "feedback", "opini", "konsult", "analiz", "wniosk", "barier",
        "uster", "wywiad", "zadowolen", "potrzeb", "oczekiw", "problem",
    )

    if any(h in blob for h in build) and not any(h in sub_title.lower() for h in ("test", "zmierz", "obserw")):
        return "build_result"
    if any(h in blob for h in test):
        return "product_test"
    if any(h in blob for h in research):
        return "research"
    if "popraw" in blob or "ulepsz" in blob or "priorytet" in blob:
        return "build_result"
    return "product_test"


def build_category(
    cat_key: str,
    cat_title: str,
    always_active: bool,
    intro: str,
    short_text: str,
    handbook_text: str | None,
) -> tuple[dict, dict]:
    points_src = split_short_points(short_text)
    przewodnik = extract_przewodnik(short_text)
    hb_points = extract_handbook_points(handbook_text) if handbook_text else {}
    hb_sections = handbook_section_goals(handbook_text) if handbook_text else []

    guides: dict[str, dict] = {}
    points_out = []

    for ptitle, subs in points_src:
        pkey = f"{cat_key}-{slugify(ptitle)}"
        guide_key = pkey

        guide_body = None
        pslug = slugify(ptitle)
        if ptitle in hb_points:
            guide_body = hb_points[ptitle]
        else:
            # handbook czasem dokłada sufiks, np. „… (User Research)”
            for ht, body in hb_points.items():
                hslug = slugify(ht)
                if hslug == pslug or hslug.startswith(pslug) or pslug.startswith(hslug):
                    guide_body = body
                    break
        if not guide_body:
            guide_body = point_excerpt(przewodnik, ptitle) or re.sub(
                r"\s+", " ", przewodnik
            ).strip()
        if not guide_body:
            raise SystemExit(f"pusty przewodnik: {cat_key}/{ptitle}")

        guides[guide_key] = {"title": ptitle, "body": guide_body, "sources": []}

        subpoints_out = []
        for stitle, question in subs:
            skey = slugify(stitle)

            if is_decision(stitle):
                subpoints_out.append(
                    {"key": skey, "title": stitle, "fields": [decision_field(question)]}
                )
                continue

            gtype = None
            if hb_sections:
                gtype = match_handbook_goal(stitle, hb_sections)
            if not gtype:
                gtype = infer_goal_short(stitle, ptitle)

            counts = (
                "defined"
                if any(
                    x in stitle.lower()
                    for x in ("określ", "okresl", "ustal", "zaplanuj", "wybierz", "przygotuj procedur")
                )
                else "completed"
            )

            help_text = question
            sp: dict = {
                "key": skey,
                "title": stitle,
                "fields": [note_field(question, help_text)],
            }
            if gtype:
                sp["goal_conditions"] = [
                    {
                        "goal_type_id": gtype,
                        "min_count": 1,
                        "counts_when": counts,
                    }
                ]
                sp["fields"][0]["help"] = (
                    f"{question} Podepnij cel wymagany w tym punkcie i dołącz dowód w karcie celu."
                )
            subpoints_out.append(sp)

        points_out.append(
            {
                "key": pkey,
                "title": ptitle,
                "guide": guide_key,
                "subpoints": subpoints_out,
            }
        )

    return (
        {
            "key": cat_key,
            "title": cat_title,
            "always_active": always_active,
            "intro": intro,
            "points": points_out,
        },
        guides,
    )


def main() -> None:
    specs = [
        (
            "general",
            "Ogólna walidacja",
            True,
            "Wspólna podstawa dla każdego produktu — niezależnie od kategorii.",
            "Walidacja Ogólna.txt",
            None,
        ),
        (
            "saas",
            "SaaS",
            False,
            "Warstwa dla produktu subskrypcyjnego — uruchomienie, użycie i model.",
            "Saas.txt",
            None,
        ),
        (
            "hardware",
            "Hardware",
            False,
            "Warstwa dla urządzenia — pierwsza seria, awarie, łańcuch i decyzja o skali.",
            "Hardware.txt",
            None,
        ),
        (
            "b2b",
            "B2B",
            False,
            "Warstwa dla sprzedaży do firm — MVP, test z klientami biznesowymi, feedback.",
            "B2B.txt",
            "B2B.txt",
        ),
        (
            "b2c",
            "B2C",
            False,
            "Warstwa dla produktów konsumenckich — udostępnienie, test, poprawki.",
            "B2C.txt",
            "B2C.txt",
        ),
    ]

    categories = []
    all_guides: dict[str, dict] = {}
    for cat_key, cat_title, always, intro, short_name, hb_name in specs:
        short = load(short_name)
        hb = load(hb_name) if hb_name else None
        cat, guides = build_category(cat_key, cat_title, always, intro, short, hb)
        categories.append(cat)
        all_guides[cat_key] = guides

    doc = {
        "key": "mvp",
        "version": 1,
        "position": 5,
        "title": "MVP Stage",
        "subtitle": "Wypuść i sprawdź",
        "intro": (
            "Udostępniasz pierwszą wersję odbiorcom, zbierasz reakcje i poprawiasz produkt. "
            "Tracker, zespół i materiały z Execution zostają dostępne."
        ),
        "finish_label": "Kończę program",
        "categories": categories,
    }

    keys: dict[str, list[str]] = {}
    counts = {}
    goal_count = 0
    stop_left = 0
    for cat in categories:
        pc = sc = gc = 0
        for pt in cat["points"]:
            pc += 1
            for sp in pt["subpoints"]:
                sc += 1
                if sp.get("goal_conditions"):
                    goal_count += 1
                    gc += 1
                for f in sp["fields"]:
                    sk = f.get("shared") or f"mvp.{pt['key']}.{sp['key']}.{f['key']}"
                    keys.setdefault(sk, []).append(f"{cat['key']}/{pt['key']}/{sp['key']}")
                    if f.get("kind") == "select":
                        for opt in f.get("config", {}).get("options", []):
                            if opt.get("value") == "stop":
                                stop_left += 1
        counts[cat["key"]] = (pc, sc, gc)

    coll = {k: v for k, v in keys.items() if len(v) > 1}
    print("counts (points, subpoints, with_goals):", counts)
    print("goal_conditions total", goal_count)
    print("collisions", len(coll))
    print("stop options left", stop_left)
    if coll:
        for k, v in list(coll.items())[:15]:
            print(" COLL", k)
            for x in v:
                print("  ", x)
        raise SystemExit("kolizje answer_key")

    expected = {
        "general": (6, 23),
        "saas": (6, 29),
        "hardware": (5, 17),
        "b2b": (6, 23),
        "b2c": (5, 17),
    }
    for k, (ep, es) in expected.items():
        pc, sc, _ = counts[k]
        if (pc, sc) != (ep, es):
            raise SystemExit(f"{k}: oczekiwano {ep}/{es}, jest {pc}/{sc}")

    OUT_JSON.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_GUIDES.write_text(json.dumps(all_guides, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("wrote", OUT_JSON.relative_to(ROOT))
    print("wrote", OUT_GUIDES.relative_to(ROOT))
    for cat in ("b2b", "b2c", "general"):
        lengths = sorted(len(g["body"]) for g in all_guides[cat].values())
        print(f"  {cat} guide lengths: min={lengths[0]} max={lengths[-1]}")


if __name__ == "__main__":
    main()
