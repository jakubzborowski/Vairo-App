"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, Eye, EyeOff, Plus, Search } from "lucide-react";
import {
  createCustomSkill,
  saveProfile,
  uploadAvatar,
  type ProfileDraft,
} from "@/app/app/settings/profile/actions";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { SaveBar } from "@/components/ui/save-bar";
import { cn } from "@/lib/utils";
import { AVATAR_MAX_MB, type Skill } from "@/types/profile";

const HEADLINE_MAX = 120;
const FOCUS_MAX = 2000;

type Props = {
  profile: {
    fullName: string;
    headline: string;
    weeklyFocus: string;
    avatarUrl: string | null;
    isDiscoverable: boolean;
    email: string;
  };
  skills: Skill[];
  selectedSkillIds: string[];
};

/**
 * Edytor własnego profilu.
 *
 * Poprzednia wersja tej strony trzymała obok siebie cztery różne konteksty:
 * ekran onboardingu („Skip" / „Continue"), kartę z decku cudzych profili
 * (✗ / 💾 / ✓), mobilny tab bar i faktyczną edycję. Tutaj jest wyłącznie
 * edycja, a zapis ma jedną drogę: pasek na dole, widoczny gdy są zmiany.
 */
export function ProfileEditor({ profile, skills: initialSkills, selectedSkillIds }: Props) {
  const [skills, setSkills] = useState(initialSkills);
  const [draft, setDraft] = useState<ProfileDraft>({
    fullName: profile.fullName,
    headline: profile.headline,
    weeklyFocus: profile.weeklyFocus,
    isDiscoverable: profile.isDiscoverable,
    skillIds: selectedSkillIds,
  });
  const [saved, setSaved] = useState<ProfileDraft>(draft);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => new Set(draft.skillIds), [draft.skillIds]);

  const dirty = useMemo(() => {
    if (
      draft.fullName !== saved.fullName ||
      draft.headline !== saved.headline ||
      draft.weeklyFocus !== saved.weeklyFocus ||
      draft.isDiscoverable !== saved.isDiscoverable
    ) {
      return true;
    }
    if (draft.skillIds.length !== saved.skillIds.length) return true;
    const savedSet = new Set(saved.skillIds);
    return draft.skillIds.some((id) => !savedSet.has(id));
  }, [draft, saved]);

  const visibleSkills = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? skills.filter((s) => s.label.toLowerCase().includes(q))
      : skills.filter((s) => s.is_suggested || selected.has(s.id));
    return pool.slice(0, 30);
  }, [query, skills, selected]);

  const exactMatch = skills.some(
    (s) => s.label.toLowerCase() === query.trim().toLowerCase()
  );
  const canCreate = query.trim().length > 0 && !exactMatch;

  const patch = (next: Partial<ProfileDraft>) => {
    setDraft((prev) => ({ ...prev, ...next }));
    setError(null);
  };

  const toggleSkill = (id: string) => {
    patch({
      skillIds: selected.has(id)
        ? draft.skillIds.filter((s) => s !== id)
        : [...draft.skillIds, id],
    });
  };

  const onCreateSkill = () => {
    const label = query.trim();
    if (!label) return;
    startTransition(async () => {
      const result = await createCustomSkill(label);
      if (result.error || !result.skill) {
        setError(result.error ?? "Nie udało się dodać umiejętności.");
        return;
      }
      const skill = result.skill as Skill;
      setSkills((prev) => (prev.some((s) => s.id === skill.id) ? prev : [...prev, skill]));
      patch({ skillIds: [...new Set([...draft.skillIds, skill.id])] });
      setQuery("");
    });
  };

  const onAvatar = (file: File | null) => {
    if (!file) return;
    const form = new FormData();
    form.set("avatar", file);
    startTransition(async () => {
      const result = await uploadAvatar(form);
      if (result.error) {
        setError(result.error);
        return;
      }
      // Avatar zapisuje się od razu — to upload pliku, nie pole formularza,
      // więc trzymanie go w „niezapisanych zmianach" tylko myliłoby usera.
      if (result.avatarUrl) setAvatarUrl(result.avatarUrl);
      setError(null);
    });
  };

  const onSave = () => {
    startTransition(async () => {
      const result = await saveProfile(draft);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(draft);
      setError(null);
      setSavedAt(Date.now());
    });
  };

  const onDiscard = () => {
    setDraft(saved);
    setError(null);
  };

  const completeness = useMemo(() => {
    const checks = [
      Boolean(avatarUrl),
      draft.fullName.trim().length >= 2,
      draft.headline.trim().length > 0,
      draft.skillIds.length > 0,
      draft.weeklyFocus.trim().length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [avatarUrl, draft]);

  return (
    <div className="mx-auto w-full max-w-3xl pb-4">
      <header className="mb-6">
        <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
          Twój profil
        </h1>
        <p className="mt-1 text-[14px] text-[var(--text-subtle)]">
          To widzą ludzie, którzy trafią na Ciebie w warstwie Social.
        </p>
      </header>

      {completeness < 100 ? (
        <div className="mb-5 rounded-xl border border-white/[0.07] bg-[var(--surface)] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] text-[var(--text-muted)]">
              Profil uzupełniony w{" "}
              <span className="tabular font-semibold text-white">
                {completeness}%
              </span>
            </p>
            <p className="text-[12px] text-[var(--text-subtle)]">
              Niepełny profil rzadziej trafia do wyników
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-[var(--vairo)] transition-[width] duration-300"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        {/* Zdjęcie — osobna karta, bo w Social to ono decyduje,
            czy ktoś w ogóle zatrzyma się na Twojej karcie. Podgląd ma
            te same proporcje co karta w Odkrywaj, żeby nie było
            niespodzianki po publikacji. */}
        <Card>
          <CardHeader>
            <div>
              {/* Bez opisu sekcji. Zdanie „pierwsza rzecz, którą zobaczą inni"
                  i zdanie obok kadru („to zdjęcie decyduje o kliknięciu")
                  mówiły to samo dwa razy na przestrzeni dwudziestu pikseli. */}
              <CardTitle>Zdjęcie profilowe</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => onAvatar(e.target.files?.[0] ?? null)}
            />

            <div className="grid gap-5 sm:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={pending}
                aria-label={avatarUrl ? "Zmień zdjęcie profilowe" : "Dodaj zdjęcie profilowe"}
                className={cn(
                  "group relative aspect-[4/3] w-full overflow-hidden rounded-2xl transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vairo)]",
                  avatarUrl
                    ? "border border-white/10"
                    : "border border-dashed border-white/15 bg-[var(--surface-2)] hover:border-[var(--vairo)]/50"
                )}
              >
                {avatarUrl ? (
                  <>
                    <Image
                      src={avatarUrl}
                      alt=""
                      fill
                      unoptimized
                      sizes="300px"
                      className="object-cover"
                    />
                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-black/65 py-2.5 text-[13px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="size-4" />
                      Zmień zdjęcie
                    </span>
                  </>
                ) : (
                  <span className="flex h-full flex-col items-center justify-center gap-2.5 text-[var(--text-subtle)]">
                    <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-3)] text-[var(--text-muted)] transition-colors group-hover:bg-[var(--vairo)] group-hover:text-white">
                      <Camera className="size-5" strokeWidth={1.75} />
                    </span>
                    <span className="text-[13.5px] font-medium">Dodaj zdjęcie</span>
                  </span>
                )}
              </button>

              {/* Jedna akcja, nie cztery elementy.
                  Było tu: klikalny kadr z napisem „Dodaj zdjęcie", akapit
                  przekonujący, DRUGI przycisk robiący dokładnie to samo co
                  kadr, i nota o formatach. Dwa przyciski do jednej czynności
                  to nie ułatwienie, tylko pytanie „czym one się różnią".
                  Zostaje kadr jako przycisk i dwie linijki: po co i w czym. */}
              <div className="flex flex-col justify-center gap-2">
                <p className="text-[13.5px] leading-relaxed text-[var(--text-muted)]">
                  W Odkrywaj to zdjęcie decyduje o kliknięciu bardziej niż
                  cokolwiek innego w profilu.
                </p>
                <p className="text-[12px] text-[var(--text-faint)]">
                  JPG, PNG albo WebP, do {AVATAR_MAX_MB} MB.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Podstawy */}
        <Card>
          <CardHeader>
            <div>
              {/* „Imię i jedna linijka o Tobie" to spis etykiet pól, które
                  są dwa centymetry niżej. Opis, który streszcza zawartość
                  widoczną gołym okiem, uczy pomijać wszystkie opisy. */}
              <CardTitle>Podstawy</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <Field label="Imię i nazwisko">
              {({ id }) => (
                <Input
                  id={id}
                  value={draft.fullName}
                  onChange={(e) => patch({ fullName: e.target.value })}
                  placeholder="np. Anna Kowalska"
                  autoComplete="name"
                />
              )}
            </Field>

            <Field
              label="Czym się zajmujesz"
              hint="Jedna linijka — pojawia się pod Twoim imieniem."
              counter={{ value: draft.headline.length, max: HEADLINE_MAX }}
            >
              {({ id }) => (
                <Input
                  id={id}
                  value={draft.headline}
                  onChange={(e) => patch({ headline: e.target.value })}
                  placeholder="np. Full-stack Developer"
                  maxLength={HEADLINE_MAX}
                />
              )}
            </Field>
          </CardBody>
        </Card>

        {/* Umiejętności */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Co potrafisz</CardTitle>
              <CardDescription>Po tym znajdują Cię teamy.</CardDescription>
            </div>
            <span className="tabular shrink-0 text-[12px] text-[var(--text-subtle)]">
              {draft.skillIds.length} wybranych
            </span>
          </CardHeader>
          <CardBody>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--text-faint)]"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canCreate) {
                    e.preventDefault();
                    onCreateSkill();
                  }
                }}
                placeholder="Szukaj albo dodaj własną…"
                className="pl-10"
                aria-label="Szukaj umiejętności"
              />
            </div>

            {canCreate ? (
              <button
                type="button"
                onClick={onCreateSkill}
                disabled={pending}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] text-[var(--vairo)] transition-colors hover:bg-[var(--vairo)]/10"
              >
                <Plus className="size-3.5" />
                Dodaj &bdquo;{query.trim()}&rdquo;
              </button>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {visibleSkills.length === 0 ? (
                <p className="text-[13px] text-[var(--text-subtle)]">
                  Brak wyników. Naciśnij Enter, żeby dodać własną umiejętność.
                </p>
              ) : (
                visibleSkills.map((skill) => (
                  <Pill
                    key={skill.id}
                    selected={selected.has(skill.id)}
                    onToggle={() => toggleSkill(skill.id)}
                  >
                    {skill.label}
                  </Pill>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        {/* Weekly focus */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Nad czym teraz pracujesz</CardTitle>
              <CardDescription>
                Po tym ludzie decydują, czy się odezwać.
              </CardDescription>
            </div>
          </CardHeader>
          <CardBody>
            <Field counter={{ value: draft.weeklyFocus.length, max: FOCUS_MAX }}>
              {({ id }) => (
                <Textarea
                  id={id}
                  rows={4}
                  value={draft.weeklyFocus}
                  onChange={(e) => patch({ weeklyFocus: e.target.value })}
                  maxLength={FOCUS_MAX}
                  placeholder="Buduję coś w stylu… Szukam kogoś do…"
                />
              )}
            </Field>
          </CardBody>
        </Card>

        {/* Widoczność */}
        <Card>
          <CardBody className="pt-5">
            <button
              type="button"
              onClick={() => patch({ isDiscoverable: !draft.isDiscoverable })}
              aria-pressed={draft.isDiscoverable}
              className="flex w-full items-center gap-3 text-left"
            >
              <span
                className={cn(
                  "inline-flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                  draft.isDiscoverable
                    ? "bg-[var(--vairo)]/12 text-[var(--vairo)]"
                    : "bg-[var(--surface-2)] text-[var(--text-subtle)]"
                )}
              >
                {draft.isDiscoverable ? (
                  <Eye className="size-4" />
                ) : (
                  <EyeOff className="size-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-white">
                  Widoczność w Social
                </span>
                <span className="block text-[13px] text-[var(--text-subtle)]">
                  {draft.isDiscoverable
                    ? "Inni mogą znaleźć Cię w wyszukiwarce i odkrywaniu."
                    : "Twój profil jest ukryty — nikt Cię nie znajdzie."}
                </span>
              </span>
              <span
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  draft.isDiscoverable
                    ? "bg-[var(--vairo)]"
                    : "bg-white/15"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-5 rounded-full bg-white transition-[left]",
                    draft.isDiscoverable ? "left-[22px]" : "left-0.5"
                  )}
                />
              </span>
            </button>
          </CardBody>
        </Card>
      </div>

      <SaveBar
        dirty={dirty}
        saving={pending}
        error={error}
        savedAt={savedAt}
        onSave={onSave}
        onDiscard={onDiscard}
      />
    </div>
  );
}
