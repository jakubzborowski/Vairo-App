"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, EyeOff, ImagePlus, Pause, Play } from "lucide-react";
import {
  saveTeamProfile,
  setStartupStatus,
  setTeamVisibility,
  uploadTeamLogo,
} from "@/app/app/team/actions";
import { TeamPreviewCard } from "./team-preview";
import { DeleteStartupButton } from "./delete-startup-button";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SaveBar } from "@/components/ui/save-bar";
import { scoreTeamProfile } from "@/lib/profile-completeness";
import { cn } from "@/lib/utils";
import type { StartupStatus } from "@/types/startup";

type PreviewRole = {
  id: string;
  title: string;
  weeklyHours: number | null;
  skills: { id: string; label: string }[];
};

type Props = {
  startupId: string;
  name: string;
  logoUrl: string | null;
  tagline: string;
  description: string;
  location: string;
  websiteUrl: string;
  isDiscoverable: boolean;
  /** Czy w profilu publicznym pokazywać etap walidacji (migracja 016). */
  showStagePublicly: boolean;
  /**
   * Czy kolumna z migracji 016 w ogóle istnieje. Bez niej przełącznik znika:
   * przycisk, który nic nie zapisuje, to fake UI, nawet gdy powód jest
   * techniczny.
   */
  stageConsentAvailable: boolean;
  status: StartupStatus;
  canArchive: boolean;
  /** Usunąć startup może wyłącznie Founder. */
  canDelete: boolean;
  /** Do podglądu karty — liczby i role są z bazy, nie z formularza. */
  memberCount: number;
  stageLabel: string | null;
  openRoles: PreviewRole[];
};

const STATUS_COPY: Record<StartupStatus, { label: string; description: string }> = {
  active: {
    label: "Aktywny",
    description: "Normalna praca. Team może być widoczny w Odkrywaj.",
  },
  paused: {
    label: "Na pauzie",
    description:
      "Odłożony na później. Nie pojawia się w Odkrywaj, ale wszystko zostaje na miejscu.",
  },
  archived: {
    label: "W archiwum",
    description:
      "Pomysł zamknięty. Dane zostają, team znika z wyszukiwarki.",
  },
};

/**
 * Profil publiczny teamu — to, co widzą obcy.
 *
 * Ekran zaczyna się od **karty, a nie od formularza**. Wcześniej była to
 * kolumna czterech pudełek, w której człowiek wypełniał pola, nie widząc ani
 * razu rzeczy, którą się nimi składa — a to jest ten rodzaj niepewności,
 * przez który pola zostają puste. Teraz podgląd stoi na górze, na całą
 * szerokość, i **zmienia się w trakcie pisania**: tekst wpisany w „jedno
 * zdanie" ląduje na karcie od razu.
 *
 * Świadomie nie ma tu pełnego opisu pomysłu: `idea_description` zostaje
 * prywatny, a na zewnątrz idzie wyłącznie to, co founder napisze w tych
 * dwóch polach. Rozdzielenie jest po to, żeby nikt nie opublikował
 * przypadkiem wszystkiego, co wpisał w Idea Stage.
 */
export function TeamProfileEditor({
  startupId,
  name,
  logoUrl,
  tagline: initialTagline,
  description: initialDescription,
  location: initialLocation,
  websiteUrl: initialWebsite,
  isDiscoverable: initialDiscoverable,
  showStagePublicly: initialStagePublic,
  stageConsentAvailable,
  status,
  canArchive,
  canDelete,
  memberCount,
  stageLabel,
  openRoles,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [logo, setLogo] = useState(logoUrl);
  const [tagline, setTagline] = useState(initialTagline);
  const [description, setDescription] = useState(initialDescription);
  const [location, setLocation] = useState(initialLocation);
  const [website, setWebsite] = useState(initialWebsite);
  const [discoverable, setDiscoverable] = useState(initialDiscoverable);
  const [stagePublic, setStagePublic] = useState(initialStagePublic);

  // Trzy osobne błędy, bo są trzy osobne miejsca do kliknięcia. Jeden wspólny
  // komunikat pokazywałby się przy formularzu także wtedy, gdy nie udało się
  // wgrać logo — czyli daleko od przycisku, który go wywołał.
  const [formError, setFormError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [sideError, setSideError] = useState<string | null>(null);

  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [busy, startBusy] = useTransition();

  const dirty =
    tagline !== initialTagline ||
    description !== initialDescription ||
    location !== initialLocation ||
    website !== initialWebsite;

  const save = () => {
    setFormError(null);
    setSavedAt(null);
    startBusy(async () => {
      const result = await saveTeamProfile({
        startupId,
        tagline,
        description,
        location,
        websiteUrl: website,
        isDiscoverable: discoverable,
        showStagePublicly: stagePublic,
      });
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    });
  };

  /**
   * Przełączniki zapisują się OD RAZU.
   *
   * Widoczność była wcześniej częścią formularza i wchodziła w życie dopiero
   * po kliknięciu „Zapisz" na dole. Przełącznik, który nie przełącza, jest
   * najgorszym rodzajem fake UI — wygląda dokładnie jak działający. Stan
   * wraca do poprzedniego, jeśli baza odmówi.
   */
  const toggleVisibility = (next: {
    isDiscoverable: boolean;
    showStagePublicly: boolean;
  }) => {
    const previous = { discoverable, stagePublic };
    setSideError(null);
    setDiscoverable(next.isDiscoverable);
    setStagePublic(next.showStagePublicly);

    startBusy(async () => {
      const result = await setTeamVisibility({ startupId, ...next });
      if (result.error) {
        setDiscoverable(previous.discoverable);
        setStagePublic(previous.stagePublic);
        setSideError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const upload = (file: File) => {
    setLogoError(null);
    startBusy(async () => {
      const formData = new FormData();
      formData.set("startup_id", startupId);
      formData.set("logo", file);
      const result = await uploadTeamLogo(formData);
      if (result.error) {
        setLogoError(result.error);
        return;
      }
      setLogo(result.logoUrl);
      router.refresh();
    });
  };

  const changeStatus = (next: StartupStatus) => {
    setSideError(null);
    startBusy(async () => {
      const result = await setStartupStatus({ startupId, status: next });
      if (result.error) {
        setSideError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const readiness = scoreTeamProfile({
    logo_url: logo,
    public_tagline: tagline,
    public_description: description,
    location,
    openRoleCount: openRoles.length,
  });
  const readyCount = 5 - readiness.missing.length;

  const discard = () => {
    setTagline(initialTagline);
    setDescription(initialDescription);
    setLocation(initialLocation);
    setWebsite(initialWebsite);
    setFormError(null);
  };

  const focusField = (key: string) => {
    if (key === "avatar") {
      fileRef.current?.click();
      return;
    }
    if (key === "skills") {
      router.push("/app/team");
      return;
    }
    const id = key === "headline" ? "pole-tagline" : key === "focus" ? "pole-opis" : "pole-lokalizacja";
    document.getElementById(id)?.focus();
  };

  const preview = (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
        Podgląd karty w Odkrywaj
      </p>
      <TeamPreviewCard
        name={name}
        logoUrl={logo}
        tagline={tagline}
        location={location}
        memberCount={memberCount}
        stageLabel={stagePublic ? stageLabel : null}
        openRoles={openRoles}
      />
      {!discoverable ? (
        <p className="flex items-start gap-2 rounded-xl border border-[var(--warning)]/25 bg-[var(--warning)]/8 px-4 py-3 text-[12.5px] leading-relaxed text-[var(--warning)]">
          <EyeOff className="mt-0.5 size-4 shrink-0" />
          <span>
            Ta karta nie pojawia się teraz w Odkrywaj — team ma wyłączoną widoczność.
          </span>
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* Telefon: edycja i podgląd to dwie zakładki — na 390 px nie zmieszczą
          się obok siebie, a przełącznik jest zawsze pod kciukiem. */}
      <div
        role="tablist"
        aria-label="Widok"
        className="inline-flex w-fit rounded-xl border border-white/[0.08] bg-[var(--surface)] p-1 lg:hidden"
      >
        {(
          [
            ["edit", "Edycja"],
            ["preview", "Podgląd"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mobileTab === id}
            onClick={() => setMobileTab(id)}
            className={cn(
              "inline-flex h-11 items-center rounded-lg px-4 text-[13px] font-medium",
              mobileTab === id ? "bg-[var(--surface-3)] text-white" : "text-[var(--text-muted)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-start">
        <div className={cn("flex flex-col gap-5", mobileTab === "preview" && "hidden lg:flex")}>
          {/* Gotowość profilu — licznik mówi, czego brakuje, i prowadzi do pola. */}
          <section className="rounded-[18px] border border-white/[0.07] bg-[var(--surface)] px-5 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[15px] font-medium text-white">
                Profil gotowy w {readiness.score}%
              </p>
              <span className="tabular text-[12.5px] text-[var(--text-subtle)]">{readyCount} z 5</span>
            </div>
            <span className="mt-2.5 flex gap-1" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    index < readyCount ? "bg-[var(--success)]" : "bg-white/10"
                  )}
                />
              ))}
            </span>
            {readiness.missing.length > 0 ? (
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-muted)]">
                Brakuje:{" "}
                {readiness.missing.map((piece, index) => (
                  <span key={piece.key}>
                    {index > 0 ? ", " : ""}
                    <button
                      type="button"
                      onClick={() => focusField(piece.key)}
                      className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
                    >
                      {piece.label.replace(/^(Dodaj|Napisz|Opisz) /, "").replace(/^co najmniej /, "")}
                    </button>
                  </span>
                ))}
                .
              </p>
            ) : (
              <p className="mt-3 text-[13px] text-[var(--success)]">Komplet — karta mówi wszystko, co powinna.</p>
            )}
          </section>

          <Card>
            <CardBody className="flex flex-col gap-5 pt-6">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) upload(file);
                    event.target.value = "";
                  }}
                />
                <Button variant="secondary" size="sm" loading={busy} onClick={() => fileRef.current?.click()}>
                  <ImagePlus className="size-4" />
                  {logo ? "Zmień logo" : "Dodaj logo"}
                </Button>
                <p className="text-[12.5px] text-[var(--text-subtle)]">
                  Kwadrat, JPG, PNG albo WebP do 15 MB. Bez logo karta pokazuje pierwszą literę nazwy.
                </p>
                {logoError ? (
                  <p className="w-full rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
                    {logoError}
                  </p>
                ) : null}
              </div>

              <Field
                label="Jedno zdanie o Was"
                hint="To widać na karcie w Odkrywaj. Co robicie i dla kogo."
                counter={{ value: tagline.length, max: 160 }}
              >
                {({ invalid }) => (
                  <Input
                    id="pole-tagline"
                    aria-invalid={invalid}
                    value={tagline}
                    onChange={(event) => setTagline(event.target.value)}
                    maxLength={160}
                    placeholder="np. Rezerwacje dla małych gabinetów kosmetycznych"
                  />
                )}
              </Field>

              <Field
                label="O projekcie"
                hint="Dłuższy opis na stronie teamu — nie na karcie. Tyle, ile chcecie pokazać obcym."
                counter={{ value: description.length, max: 1200 }}
              >
                {() => (
                  <Textarea
                    id="pole-opis"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={6}
                    maxLength={1200}
                    placeholder="Nad czym pracujecie, na jakim jesteście etapie, kogo szukacie i czego oczekujecie."
                  />
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Lokalizacja" hint="Miasto albo „zdalnie”.">
                  {() => (
                    <Input
                      id="pole-lokalizacja"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      maxLength={80}
                      placeholder="np. Wrocław / zdalnie"
                    />
                  )}
                </Field>

                <Field label="Strona · opcjonalnie" hint="Wystarczy sam adres.">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                      maxLength={200}
                      placeholder="np. mojprojekt.pl"
                    />
                  )}
                </Field>
              </div>
            </CardBody>
          </Card>

          {/* Zgody — przełączniki z jednym zdaniem skutku. Zapisują się od razu. */}
          <section className="flex flex-col gap-2.5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
              Kto Was widzi
            </p>
            <Toggle
              on={discoverable}
              disabled={busy}
              title="Team widoczny w Odkrywaj"
              effect={
                discoverable
                  ? "Ludzie mogą Was znaleźć i wysłać zgłoszenie. Opis pomysłu z Idea Stage zostaje prywatny."
                  : "Nie pojawiacie się w wyszukiwarce. Nadal możecie zapraszać ludzi sami."
              }
              onChange={() => toggleVisibility({ isDiscoverable: !discoverable, showStagePublicly: stagePublic })}
            />
            {discoverable && stageConsentAvailable ? (
              <Toggle
                on={stagePublic}
                disabled={busy}
                title="Pokazujcie, na którym etapie jesteście"
                effect={
                  stagePublic
                    ? "Na karcie widać nazwę etapu. Same odpowiedzi zostają w teamie."
                    : "Nikt z zewnątrz nie widzi, jak daleko jesteście."
                }
                onChange={() => toggleVisibility({ isDiscoverable: discoverable, showStagePublicly: !stagePublic })}
              />
            ) : null}
            {sideError ? (
              <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
                {sideError}
              </p>
            ) : null}
          </section>

          {/* Archiwizacja i usunięcie schowane na dole — nie sąsiadują
              z polami, które poprawia się co tydzień. */}
          <details className="group rounded-[18px] border border-white/[0.07] bg-[var(--surface)]">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-5 text-[13.5px] font-medium text-[var(--text-muted)] hover:text-white">
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
              Zaawansowane: status, archiwizacja i usunięcie teamu
            </summary>
            <div className="flex flex-col gap-5 border-t border-white/[0.06] px-5 py-5">
              <div>
                <p className="text-[13.5px] text-white">{STATUS_COPY[status].label}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text-subtle)]">
                  {STATUS_COPY[status].description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {status !== "active" ? (
                    <Button variant="secondary" size="sm" loading={busy} onClick={() => changeStatus("active")}>
                      <Play className="size-4" />
                      Wznów prace
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" loading={busy} onClick={() => changeStatus("paused")}>
                      <Pause className="size-4" />
                      Wstrzymaj
                    </Button>
                  )}
                  {status !== "archived" && canArchive ? (
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => changeStatus("archived")}>
                      Przenieś do archiwum
                    </Button>
                  ) : null}
                </div>
              </div>
              {canDelete ? (
                <div className="rounded-xl border border-[var(--danger)]/25 p-4">
                  <p className="text-[13.5px] font-medium text-[var(--danger-text)]">Nieodwracalne</p>
                  <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[var(--text-muted)]">
                    Usunięcie startupu kasuje wszystko: odpowiedzi z etapów, otwarte role,
                    zgłoszenia i skład zespołu. Nie ma kosza ani cofnięcia.
                  </p>
                  <div className="mt-3">
                    <DeleteStartupButton startupId={startupId} name={name} />
                  </div>
                </div>
              ) : null}
            </div>
          </details>
        </div>

        <aside className={cn("lg:sticky lg:top-6", mobileTab === "edit" && "hidden lg:block")}>
          {preview}
        </aside>
      </div>

      <SaveBar
        dirty={dirty}
        saving={busy}
        error={formError}
        savedAt={savedAt}
        onSave={save}
        onDiscard={discard}
      />
    </div>
  );
}

/** Przełącznik zgody: tytuł, jedno zdanie skutku i stan, który widać kątem oka. */
function Toggle({
  on,
  disabled,
  title,
  effect,
  onChange,
}: {
  on: boolean;
  disabled?: boolean;
  title: string;
  effect: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onChange}
      className="flex items-start gap-3.5 rounded-[18px] border border-white/[0.07] bg-[var(--surface)] px-4 py-3.5 text-left transition-colors hover:border-white/15 disabled:opacity-60"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-white">{title}</span>
        <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--text-subtle)]">{effect}</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-10 shrink-0 rounded-full transition-colors",
          on ? "bg-[var(--success)]" : "bg-white/15"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
            on ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}
