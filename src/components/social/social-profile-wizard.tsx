"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, ImagePlus } from "lucide-react";
import { uploadAvatar } from "@/app/app/settings/profile/actions";
import { saveSocialProfile } from "@/app/app/social/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { StepWizard, type WizardStep } from "@/components/ui/step-wizard";
import { cn } from "@/lib/utils";
import {
  LOOKING_FOR_OPTIONS,
  type LookingFor,
  type PublicProfile,
} from "@/types/social";
import { AVATAR_MAX_MB } from "@/types/profile";
import { PersonCover } from "./person-cover";
import { SkillPicker, type SkillOption } from "./skill-picker";

type Props = {
  profileId: string;
  initial: {
    fullName: string;
    avatarUrl: string | null;
    headline: string;
    lookingFor: LookingFor | null;
    location: string;
    weeklyHours: number | null;
    weeklyFocus: string;
    skillIds: string[];
    isDiscoverable: boolean;
    teamCount: number;
  };
  skills: SkillOption[];
};

/**
 * Kreator profilu publicznego — wejście do warstwy Social.
 *
 * Powód istnienia: bez tego człowiek po rejestracji trafiał do Odkrywaj jako
 * pusta karta z inicjałami i nie miał jak się dowiedzieć, że właśnie tak go
 * widzą. Sześć spokojnych ekranów zamiast jednego formularza, a ostatni
 * pokazuje dokładnie tę kartę, którą zobaczą inni.
 */
export function SocialProfileWizard({ profileId, initial, skills }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [catalogue, setCatalogue] = useState(skills);
  const [fullName, setFullName] = useState(initial.fullName);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [headline, setHeadline] = useState(initial.headline);
  const [lookingFor, setLookingFor] = useState<LookingFor | null>(initial.lookingFor);
  const [location, setLocation] = useState(initial.location);
  const [hours, setHours] = useState(
    initial.weeklyHours ? String(initial.weeklyHours) : ""
  );
  const [weeklyFocus, setWeeklyFocus] = useState(initial.weeklyFocus);
  const [skillIds, setSkillIds] = useState(initial.skillIds);
  const [discoverable, setDiscoverable] = useState(initial.isDiscoverable);

  const [error, setError] = useState<string | null>(null);
  const [uploading, startUploading] = useTransition();
  const [saving, startSaving] = useTransition();

  const upload = (file: File) => {
    setError(null);
    startUploading(async () => {
      const formData = new FormData();
      formData.set("avatar", file);
      const result = await uploadAvatar(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setAvatarUrl(result.avatarUrl);
    });
  };

  const finish = () => {
    setError(null);
    startSaving(async () => {
      const result = await saveSocialProfile({
        fullName,
        headline,
        lookingFor,
        location,
        weeklyHours: hours.trim() ? Number(hours) : null,
        weeklyFocus,
        skillIds,
        isDiscoverable: discoverable,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/app/social/discover");
      router.refresh();
    });
  };

  const preview: PublicProfile = {
    id: profileId,
    full_name: fullName || null,
    avatar_url: avatarUrl,
    headline: headline || null,
    weekly_focus: weeklyFocus || null,
    weekly_focus_updated_at: null,
    location: location || null,
    looking_for: lookingFor,
    weekly_hours: hours.trim() ? Number(hours) : null,
    onboarding_path: null,
    created_at: new Date().toISOString(),
    team_count: initial.teamCount,
    skills: catalogue
      .filter((skill) => skillIds.includes(skill.id))
      .map((skill) => ({ id: skill.id, label: skill.label })),
  };

  const steps: WizardStep[] = [
    {
      key: "photo",
      title: "Zacznijmy od zdjęcia",
      description:
        "To pierwsza rzecz, którą widzą inni. Nie musi być profesjonalne — ma pokazywać, że jesteś prawdziwą osobą.",
      // Zdjęcie jest opcjonalne technicznie i nie blokujemy przejścia dalej —
      // blokada wypchnęłaby z aplikacji akurat tych, którzy jej najbardziej
      // potrzebują. Konsekwencję braku widać zresztą na podglądzie karty obok:
      // stoją tam inicjały. Dopisywanie tego jeszcze słowami było trzecim
      // zdaniem o zdjęciu na jednym ekranie, obok opisu kroku i stopki
      // kreatora.
      optional: true,
      render: () => (
        <div className="flex flex-col items-center gap-5">
          <div className="w-full max-w-[280px]">
            <PersonCover person={preview} />
          </div>
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
          <div className="text-center">
            <Button
              variant={avatarUrl ? "secondary" : "primary"}
              size="lg"
              loading={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              {avatarUrl ? "Zmień zdjęcie" : "Wybierz zdjęcie"}
            </Button>
            <p className="mt-2 text-[12.5px] text-[var(--text-subtle)]">
              JPG, PNG albo WebP, do {AVATAR_MAX_MB} MB.
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "name",
      title: "Jak się nazywasz?",
      description: "Imię i nazwisko widoczne na Twojej karcie.",
      canContinue: fullName.trim().length >= 2,
      render: () => (
        <Input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          maxLength={120}
          placeholder="np. Anna Kowalska"
          autoFocus
        />
      ),
    },
    {
      key: "headline",
      title: "Czym się zajmujesz?",
      description:
        "Jedno zdanie pod imieniem. Bez niego karta nie mówi o Tobie nic.",
      help: "Nie musisz mieć tytułu z firmy. „Uczę się programować, robię proste strony” też jest odpowiedzią.",
      canContinue: headline.trim().length > 0,
      render: () => (
        <Field counter={{ value: headline.length, max: 120 }}>
          {({ id }) => (
            <Input
              id={id}
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              maxLength={120}
              placeholder="np. Full-stack developer, wcześniej w fintechu"
              autoFocus
            />
          )}
        </Field>
      ),
    },
    {
      key: "looking",
      title: "Czego teraz szukasz?",
      description: "Po tym filtrują osoby, które budują zespoły.",
      canContinue: lookingFor !== null,
      render: () => (
        <div className="flex flex-col gap-2">
          {LOOKING_FOR_OPTIONS.map((option) => {
            const selected = lookingFor === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setLookingFor(option.value)}
                aria-pressed={selected}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border px-5 py-4 text-left transition-colors",
                  selected
                    ? "border-[var(--vairo)]/60 bg-[var(--vairo)]/8"
                    : "border-white/10 bg-[var(--surface)] hover:border-white/22"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border",
                    selected
                      ? "border-[var(--vairo)] bg-[var(--vairo)] text-black"
                      : "border-white/25"
                  )}
                  aria-hidden="true"
                >
                  {selected ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium text-white">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-[var(--text-muted)]">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      key: "skills",
      title: "Co potrafisz?",
      description:
        "Wybierz co najmniej trzy rzeczy. Teamy szukają po umiejętnościach, nie po nazwiskach.",
      optional: true,
      help: "Nie znajdujesz swojej? Wpisz ją i naciśnij Enter — dodamy ją do listy.",
      render: () => (
        <SkillPicker
          skills={catalogue}
          selectedIds={skillIds}
          onChange={setSkillIds}
          onSkillCreated={(skill) => setCatalogue((prev) => [...prev, skill])}
        />
      ),
    },
    {
      key: "availability",
      title: "Ile realnie masz czasu?",
      description:
        "To najczęstsze źródło rozczarowań w zespołach. Lepiej powiedzieć wprost teraz niż tłumaczyć się za miesiąc.",
      optional: true,
      render: () => (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Godzin tygodniowo">
            {({ id }) => (
              <Input
                id={id}
                type="number"
                min={1}
                max={80}
                value={hours}
                onChange={(event) => setHours(event.target.value)}
                placeholder="np. 10"
              />
            )}
          </Field>
          <Field label="Skąd jesteś" hint="Miasto albo „zdalnie”.">
            {({ id }) => (
              <Input
                id={id}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                maxLength={80}
                placeholder="np. Kraków"
              />
            )}
          </Field>
        </div>
      ),
    },
    {
      key: "focus",
      title: "Nad czym teraz pracujesz?",
      description:
        "Kilka zdań o tym, co robisz albo czego szukasz. To jedyne miejsce, w którym możesz brzmieć jak człowiek, a nie jak CV.",
      optional: true,
      render: () => (
        <Field counter={{ value: weeklyFocus.length, max: 2000 }}>
          {({ id }) => (
            <Textarea
              id={id}
              value={weeklyFocus}
              onChange={(event) => setWeeklyFocus(event.target.value)}
              rows={6}
              maxLength={2000}
              placeholder="Np. Szukam projektu, w którym wezmę odpowiedzialność za cały frontend. Ostatnie dwa lata to panele analityczne i integracje płatności."
            />
          )}
        </Field>
      ),
    },
    {
      key: "preview",
      title: "Tak zobaczą Cię inni",
      description:
        "Dokładnie ta karta pojawia się w Odkrywaj. Możesz jeszcze cofnąć się i coś poprawić.",
      render: () => (
        <div className="flex flex-col items-center gap-5">
          <div className="w-full max-w-[300px]">
            <PersonCover person={preview} />
          </div>

          <button
            type="button"
            onClick={() => setDiscoverable((value) => !value)}
            aria-pressed={discoverable}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors",
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
                  ? "Chcę być widoczny w Odkrywaj"
                  : "Na razie zostaję ukryty"}
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
                {discoverable
                  ? "Inni mogą Cię znaleźć, napisać i zaprosić do teamu. Twój e-mail zobaczą dopiero osoby z tego samego zespołu."
                  : "Nie pojawisz się w wyszukiwarce. Nadal możesz sam pisać i zgłaszać się do projektów."}
              </span>
            </span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <StepWizard
      steps={steps}
      finishLabel="Gotowe, pokaż mi ludzi"
      onFinish={finish}
      finishing={saving}
      error={error}
      onExit={() => router.push("/app")}
      exitLabel="Wróć na start"
    />
  );
}
