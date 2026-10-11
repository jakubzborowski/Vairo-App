"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  Pause,
  Play,
  Target,
} from "lucide-react";
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

  const [saved, setSaved] = useState(false);
  const [busy, startBusy] = useTransition();

  const dirty =
    tagline !== initialTagline ||
    description !== initialDescription ||
    location !== initialLocation ||
    website !== initialWebsite;

  const save = () => {
    setFormError(null);
    setSaved(false);
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
      setSaved(true);
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

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Rzecz, o którą tu chodzi — karta, którą zobaczą obcy. */}
      <section>
        <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
          Tak widzą Was w Odkrywaj
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

        {/* Logo stoi przy karcie, bo jest jej całym kadrem — nie osobną
            sekcją dwa pudełka niżej. */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
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
          <Button
            variant="secondary"
            size="sm"
            loading={busy}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            {logo ? "Zmień logo" : "Dodaj logo"}
          </Button>
          <p className="text-[12.5px] text-[var(--text-subtle)]">
            Logo wypełnia całe zdjęcie karty. JPG, PNG albo WebP, do 15 MB;
            kwadrat wygląda najlepiej.
          </p>
        </div>

        {logoError ? (
          <p className="mt-2 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
            {logoError}
          </p>
        ) : null}

        {!discoverable ? (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--warning)]/25 bg-[var(--warning)]/8 px-4 py-3 text-[12.5px] leading-relaxed text-[var(--warning)]">
            <EyeOff className="mt-0.5 size-4 shrink-0" />
            <span>
              Ta karta nie pojawia się teraz w Odkrywaj — team ma wyłączoną
              widoczność. Włącz ją obok, gdy uznacie, że jest gotowa.
            </span>
          </p>
        ) : null}
      </section>

      {/* 2. Co piszecie (szeroko) i kto to widzi (wąsko). */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:items-start">
        <Card>
          <CardBody className="flex flex-col gap-5 pt-6">
            <Field
              label="Jedno zdanie o Was"
              hint="To widać na karcie w Odkrywaj. Co robicie i dla kogo."
              counter={{ value: tagline.length, max: 160 }}
            >
              {({ id }) => (
                <Input
                  id={id}
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
              {({ id }) => (
                <Textarea
                  id={id}
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
                {({ id }) => (
                  <Input
                    id={id}
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    maxLength={80}
                    placeholder="np. Wrocław / zdalnie"
                  />
                )}
              </Field>

              <Field label="Strona" hint="Opcjonalna. Wystarczy sam adres.">
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

            {formError ? (
              <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
                {formError}
              </p>
            ) : null}

            <div className="flex items-center gap-3">
              <Button onClick={save} loading={busy} disabled={!dirty}>
                Zapisz
              </Button>
              {saved && !dirty ? (
                <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--success)]">
                  <Check className="size-4" />
                  Zapisane
                </span>
              ) : null}
            </div>
          </CardBody>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <CardBody className="flex flex-col gap-3 pt-6">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
                Kto Was widzi
              </p>

              <button
                type="button"
                onClick={() =>
                  toggleVisibility({
                    isDiscoverable: !discoverable,
                    showStagePublicly: stagePublic,
                  })
                }
                aria-pressed={discoverable}
                disabled={busy}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors disabled:opacity-60",
                  discoverable
                    ? "border-[var(--success)]/35 bg-[var(--success)]/8"
                    : "border-white/10 bg-[var(--surface-2)]"
                )}
              >
                {discoverable ? (
                  <Eye className="mt-0.5 size-4 shrink-0 text-[var(--success)]" />
                ) : (
                  <EyeOff className="mt-0.5 size-4 shrink-0 text-[var(--text-faint)]" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium text-white">
                    {discoverable
                      ? "Team jest widoczny w Odkrywaj"
                      : "Team jest ukryty"}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
                    {discoverable
                      ? "Ludzie mogą Was znaleźć i wysłać zgłoszenie. Pełny opis pomysłu z Idea Stage zostaje prywatny."
                      : "Nie pojawiacie się w wyszukiwarce. Nadal możecie zapraszać ludzi sami."}
                  </span>
                </span>
              </button>

              {/* Etap pokazujemy dopiero po świadomym włączeniu — i pytanie
                  o to ma sens tylko wtedy, gdy team w ogóle jest widoczny.

                  Powód, dla którego to w ogóle jest wybór: etapu nikt nie
                  pisał dla obcych. Wyliczył się z postępu zespołu, a „Idea
                  Stage" da się przeczytać jako „dopiero zaczynają, pewnie nic
                  z tego nie będzie" — i zespół nie ma jak tego sprostować, bo
                  nawet nie wie, że to widać. */}
              {discoverable && stageConsentAvailable ? (
                <button
                  type="button"
                  onClick={() =>
                    toggleVisibility({
                      isDiscoverable: discoverable,
                      showStagePublicly: !stagePublic,
                    })
                  }
                  aria-pressed={stagePublic}
                  disabled={busy}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-60",
                    stagePublic
                      ? "border-white/15 bg-[var(--surface-2)]"
                      : "border-white/8 bg-transparent hover:border-white/15"
                  )}
                >
                  <Target
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      stagePublic ? "text-[var(--vairo)]" : "text-[var(--text-faint)]"
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium text-white">
                      {stagePublic
                        ? "Pokazujecie, na którym etapie jesteście"
                        : "Etap walidacji zostaje prywatny"}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
                      {stagePublic
                        ? "Na karcie widać nazwę etapu. Same odpowiedzi zostają w teamie."
                        : "Nikt z zewnątrz nie widzi, jak daleko jesteście."}
                    </span>
                  </span>
                </button>
              ) : null}
            </CardBody>
          </Card>

          {/* Pauzę i archiwum ustawia decyzja kończąca etap — tutaj jest droga
              powrotna, żeby „Wstrzymaj" nie było ślepą uliczką. */}
          <Card>
            <CardBody className="pt-6">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
                Status startupu
              </p>
              <p className="mt-2 text-[13.5px] text-white">
                {STATUS_COPY[status].label}
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text-subtle)]">
                {STATUS_COPY[status].description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {status !== "active" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={busy}
                    onClick={() => changeStatus("active")}
                  >
                    <Play className="size-4" />
                    Wznów prace
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={busy}
                    onClick={() => changeStatus("paused")}
                  >
                    <Pause className="size-4" />
                    Wstrzymaj
                  </Button>
                )}
                {status !== "archived" && canArchive ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => changeStatus("archived")}
                  >
                    Przenieś do archiwum
                  </Button>
                ) : null}
              </div>
            </CardBody>
          </Card>

          {sideError ? (
            <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
              {sideError}
            </p>
          ) : null}
        </div>
      </div>

      {/* 3. Nieodwracalne osobno, na końcu i z inną ramką — żeby nie
          sąsiadowało z przyciskami, które da się cofnąć. */}
      {canDelete ? (
        <Card className="border-[var(--danger)]/25">
          <CardBody className="pt-6">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--danger)]">
              Nieodwracalne
            </p>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-[var(--text-muted)]">
              Usunięcie startupu kasuje wszystko: odpowiedzi z etapów, otwarte
              role, zgłoszenia i skład zespołu. Nie ma kosza ani cofnięcia.
            </p>
            <div className="mt-4">
              <DeleteStartupButton startupId={startupId} name={name} />
            </div>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
