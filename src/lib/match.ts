import { plural } from "@/lib/utils";
import type { PublicProfile, PublicStartup } from "@/types/social";

/**
 * „Dlaczego akurat ta osoba / ten team".
 *
 * Talia pokazywała ludzi w kolejności odświeżenia pola „nad czym pracuję".
 * Bez ani jednego słowa o tym, co ta osoba ma wspólnego z Tobą, przeglądanie
 * jest losowe — a decyzja „czy chcę z kimś pracować" bez przesłanki zamienia
 * się w rzut monetą.
 *
 * **To nie jest algorytm rekomendacji i celowo nim nie będzie.** Nie liczymy
 * żadnego wyniku dopasowania, nie ustawiamy talii „od najlepszych" i nie
 * ukrywamy nikogo. Jedyne, co robimy, to **nazywamy pokrycie, które i tak
 * widać w danych**: Twoje otwarte role kontra jej umiejętności, jej otwarte
 * role kontra Twoje umiejętności, ta sama lokalizacja, deklarowany czas.
 *
 * Trzy zasady, które tu obowiązują:
 *
 *   1. **Żadnego zdania bez pokrycia w bazie.** Jeśli nic się nie zgadza,
 *      funkcja zwraca pustą listę i karta nie pokazuje nic. Wymyślony powód
 *      („świetnie pasujecie!") byłby dokładnie tym fake UI, którego nie ma
 *      w tej aplikacji.
 *   2. **Najwyżej trzy powody.** Lista dziesięciu przestaje być przesłanką,
 *      a staje się kolejną ścianą tekstu do przeczytania.
 *   3. **Rzeczowniki zamiast czasowników przeszłych.** Polszczyzna odmienia
 *      je przez rodzaj, a my nie znamy rodzaju drugiej osoby i nie zamierzamy
 *      go zgadywać. „Deklaruje 12 h" działa dla każdego; „zadeklarował(a)" to
 *      formularz urzędowy.
 */

export type MatchReason = {
  key: string;
  text: string;
};

export type MatchContext = {
  /** Umiejętności, których szukają otwarte role MOICH teamów. */
  wanted: { skill: string; roleTitle: string }[];
  /** Moje własne umiejętności — dopasowujemy je do cudzych otwartych ról. */
  mySkills: string[];
  myLocation: string | null;
};

export const EMPTY_MATCH_CONTEXT: MatchContext = {
  wanted: [],
  mySkills: [],
  myLocation: null,
};

const MAX_REASONS = 3;

const normalize = (value: string) => value.trim().toLowerCase();

/** Porównanie lokalizacji bez czułości na wielkość liter i spacje. */
function sameLocation(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return normalize(a) === normalize(b);
}

/** Łączy nazwy w listę czytaną po polsku: „React, SQL i Figma". */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} i ${names[names.length - 1]}`;
}

/**
 * Część wspólna dwóch list umiejętności. Zwraca etykiety w oryginalnej
 * pisowni z pierwszej listy — „React" ma wyglądać jak „React", a nie „react".
 */
function overlap(mine: string[], theirs: string[]): string[] {
  if (mine.length === 0 || theirs.length === 0) return [];
  const wanted = new Set(theirs.map(normalize));
  const seen = new Set<string>();
  const result: string[] = [];
  for (const label of mine) {
    const key = normalize(label);
    if (!wanted.has(key) || seen.has(key)) continue;
    seen.add(key);
    result.push(label);
  }
  return result;
}

const LOOKING_FOR_REASON: Record<string, string> = {
  team: "Szuka teamu",
  cofounder: "Szuka współzałożyciela",
  collaborators: "Szuka ludzi do swojego projektu",
};

/**
 * Powody, dla których ta OSOBA może Cię zainteresować.
 *
 * Kolejność nie jest przypadkowa — to kolejność siły przesłanki. Pokrycie
 * z otwartą rolą jest konkretem („szukacie Reacta, ona zna Reacta"). Ostatnie
 * pozycje to już tylko kontekst.
 */
export function reasonsForPerson(
  person: PublicProfile,
  ctx: MatchContext
): MatchReason[] {
  const reasons: MatchReason[] = [];
  const personSkills = person.skills.map((skill) => skill.label);

  // 1. Czego szukają moje otwarte role kontra to, co ta osoba umie.
  //    Wybieramy rolę z NAJWIĘKSZYM pokryciem, a nie pierwszą z brzegu —
  //    inaczej przy dwóch rolach zdanie mówiłoby o tej mniej trafnej.
  if (ctx.wanted.length > 0 && personSkills.length > 0) {
    const byRole = new Map<string, string[]>();
    for (const { skill, roleTitle } of ctx.wanted) {
      byRole.set(roleTitle, [...(byRole.get(roleTitle) ?? []), skill]);
    }

    let best: { roleTitle: string; matched: string[] } | null = null;
    for (const [roleTitle, skills] of byRole) {
      const matched = overlap(personSkills, skills);
      if (matched.length === 0) continue;
      if (!best || matched.length > best.matched.length) {
        best = { roleTitle, matched };
      }
    }

    if (best) {
      reasons.push({
        key: "role-match",
        text: `Zna ${joinNames(best.matched.slice(0, 3))} — szukacie tego do roli „${best.roleTitle}”`,
      });
    }
  }

  // 2. Nie mam otwartych ról, ale mam własne umiejętności — wspólny język
  //    też jest przesłanką, tylko słabszą, więc tylko gdy punkt 1 nie zagrał.
  if (reasons.length === 0 && ctx.mySkills.length > 0) {
    const shared = overlap(personSkills, ctx.mySkills);
    if (shared.length > 0) {
      reasons.push({
        key: "shared-skills",
        text: `Wspólne umiejętności: ${joinNames(shared.slice(0, 3))}`,
      });
    }
  }

  // 3. Czego sama szuka. „Na razie nie szukam" celowo pomijamy — to nie jest
  //    powód, żeby kogoś pokazywać.
  const looking = person.looking_for
    ? LOOKING_FOR_REASON[person.looking_for]
    : undefined;
  if (looking) {
    reasons.push({ key: "looking-for", text: looking });
  }

  // 4. Deklarowany czas. Najczęstszy powód, dla którego współpraca się
  //    rozsypuje, więc lepiej, żeby padł przed rozmową, a nie po miesiącu.
  if (person.weekly_hours && person.weekly_hours > 0) {
    reasons.push({
      key: "hours",
      text: `Deklaruje ${person.weekly_hours} h tygodniowo`,
    });
  }

  // 5. Ta sama lokalizacja.
  if (sameLocation(person.location, ctx.myLocation)) {
    reasons.push({ key: "location", text: `Ta sama lokalizacja: ${person.location}` });
  }

  // 6. Zupełnie wolna osoba — dla teamu to informacja, że nie konkuruje
  //    o jej czas z trzema innymi projektami.
  if (person.team_count === 0) {
    reasons.push({ key: "no-team", text: "Nie należy jeszcze do żadnego teamu" });
  }

  return reasons.slice(0, MAX_REASONS);
}

/**
 * Powody, dla których ten TEAM może Cię zainteresować.
 *
 * Tu przesłanką numer jeden jest odwrotne pokrycie: czy któraś z ich otwartych
 * ról pyta o to, co masz w profilu.
 */
export function reasonsForTeam(
  team: PublicStartup,
  ctx: MatchContext
): MatchReason[] {
  const reasons: MatchReason[] = [];
  const openRoles = team.open_roles ?? [];

  let best: { title: string; matched: string[] } | null = null;
  if (ctx.mySkills.length > 0) {
    for (const role of openRoles) {
      const matched = overlap(ctx.mySkills, role.skills ?? []);
      if (matched.length === 0) continue;
      if (!best || matched.length > best.matched.length) {
        best = { title: role.title, matched };
      }
    }
  }

  if (best) {
    reasons.push({
      key: "role-match",
      text: `Rola „${best.title}” pyta o ${joinNames(best.matched.slice(0, 3))} — masz to w profilu`,
    });
  } else if (openRoles.length > 0) {
    // Bez pokrycia mówimy tylko, że w ogóle szukają. To wciąż prawda z bazy,
    // a dla kogoś bez uzupełnionych umiejętności jedyna sensowna przesłanka.
    reasons.push({
      key: "open-roles",
      text: `${openRoles.length} ${plural(openRoles.length, "otwarta rola", "otwarte role", "otwartych ról")}`,
    });
  }

  if (sameLocation(team.location, ctx.myLocation)) {
    reasons.push({ key: "location", text: `Ta sama lokalizacja: ${team.location}` });
  }

  // Mały zespół to inna decyzja niż dołączenie do dziesięciu osób — i jedno,
  // i drugie komuś odpowiada, więc mówimy to wprost zamiast oceniać.
  if (team.member_count > 0 && team.member_count <= 3) {
    reasons.push({
      key: "small-team",
      text: `Wczesny zespół: ${team.member_count} ${plural(team.member_count, "osoba", "osoby", "osób")}`,
    });
  }

  return reasons.slice(0, MAX_REASONS);
}

/**
 * Sam konkret dopasowania, bez kontekstu, który karta w liście i tak pokazuje.
 *
 * W talii warto powiedzieć wszystko — tam decyzja zapada nad jednym zdjęciem.
 * W siatce lokalizacja, godziny i „czego szuka" są już na karcie osobnymi
 * polami, więc powtórzenie ich w zdaniu obok byłoby szumem. Zostaje jedyna
 * informacja, której karta nie niesie: co się z czym pokrywa.
 */
export function matchHighlight(reasons: MatchReason[]): MatchReason | null {
  return (
    reasons.find(
      (reason) => reason.key === "role-match" || reason.key === "shared-skills"
    ) ?? null
  );
}
