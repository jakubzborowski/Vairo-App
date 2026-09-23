"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, ImagePlus, Pause, Play } from "lucide-react";
import {
  saveTeamProfile,
  setStartupStatus,
  uploadTeamLogo,
} from "@/app/app/team/actions";
import { TeamLogo } from "@/components/social/team-logo";
import { DeleteStartupButton } from "./delete-startup-button";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { StartupStatus } from "@/types/startup";

type Props = {
  startupId: string;
  name: string;
  logoUrl: string | null;
  tagline: string;
  description: string;
  location: string;
  websiteUrl: string;
  isDiscoverable: boolean;
  status: StartupStatus;
  canArchive: boolean;
  /** Usunąć startup może wyłącznie Founder. */
  canDelete: boolean;
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
  status,
  canArchive,
  canDelete,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [logo, setLogo] = useState(logoUrl);
  const [tagline, setTagline] = useState(initialTagline);
  const [description, setDescription] = useState(initialDescription);
  const [location, setLocation] = useState(initialLocation);
  const [website, setWebsite] = useState(initialWebsite);
  const [discoverable, setDiscoverable] = useState(initialDiscoverable);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, startBusy] = useTransition();

  const dirty =
    tagline !== initialTagline ||
    description !== initialDescription ||
    location !== initialLocation ||
    website !== initialWebsite ||
    discoverable !== initialDiscoverable;

  const save = () => {
    setError(null);
    setSaved(false);
    startBusy(async () => {
      const result = await saveTeamProfile({
        startupId,
        tagline,
        description,
        location,
        websiteUrl: website,
        isDiscoverable: discoverable,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  };

  const upload = (file: File) => {
    setError(null);
    startBusy(async () => {
      const formData = new FormData();
      formData.set("startup_id", startupId);
      formData.set("logo", file);
      const result = await uploadTeamLogo(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setLogo(result.logoUrl);
      router.refresh();
    });
  };

  const changeStatus = (next: StartupStatus) => {
    setError(null);
    startBusy(async () => {
      const result = await setStartupStatus({ startupId, status: next });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Logo osobną kartą: w Odkrywaj to pierwsza rzecz, którą widać. */}
      <Card>
        <CardBody className="pt-6">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
            Logo teamu
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-5">
            <TeamLogo
              src={logo}
              name={name}
              size="lg"
              className="size-28 rounded-2xl text-[36px]"
            />
            <div className="min-w-0">
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
                loading={busy}
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="size-4" />
                {logo ? "Zmień logo" : "Dodaj logo"}
              </Button>
              <p className="mt-2 text-[12.5px] text-[var(--text-subtle)]">
                JPG, PNG albo WebP, do 15 MB. Kwadrat wygląda najlepiej.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-5 pt-6">
          <button
            type="button"
            onClick={() => setDiscoverable((value) => !value)}
            aria-pressed={discoverable}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors",
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
            hint="Dłuższy opis na stronie teamu. Tyle, ile chcesz pokazać obcym."
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

          {error ? (
            <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
              {error}
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

      {/* Pauzę i archiwum ustawia decyzja kończąca etap — tutaj jest droga
          powrotna, żeby „Wstrzymaj" nie było ślepą uliczką. */}
      <Card>
        <CardBody className="pt-6">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
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

      {/* Nieodwracalne osobno, na końcu i z inną ramką — żeby nie sąsiadowało
          z przyciskami, które da się cofnąć. */}
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
