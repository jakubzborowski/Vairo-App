"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  Check,
  Compass,
  MessageSquare,
  Plus,
  Save,
  Search,
  Users,
  UserRound,
  X,
} from "lucide-react";
import {
  createCustomSkill,
  createTeam,
  saveProfileDetails,
  saveProfileSkills,
  uploadAvatar,
} from "@/app/app/profile/actions";
import { cn } from "@/lib/utils";
import type { Skill, Tag, Team } from "@/types/profile";

type ProfilePageClientProps = {
  profile: {
    full_name: string | null;
    headline: string | null;
    weekly_focus: string | null;
    avatar_url: string | null;
    idea_description: string | null;
    email: string | null;
  };
  ideaTags: Tag[];
  skills: Skill[];
  selectedSkillIds: string[];
  teams: Team[];
};

export function ProfilePageClient({
  profile,
  ideaTags,
  skills: initialSkills,
  selectedSkillIds,
  teams: initialTeams,
}: ProfilePageClientProps) {
  const [skills, setSkills] = useState(initialSkills);
  const [selected, setSelected] = useState(() => new Set(selectedSkillIds));
  const [query, setQuery] = useState("");
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [weeklyFocus, setWeeklyFocus] = useState(profile.weekly_focus ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [teams, setTeams] = useState(initialTeams);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const suggested = useMemo(
    () => skills.filter((s) => s.is_suggested),
    [skills]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? skills.filter((s) => s.label.toLowerCase().includes(q))
      : suggested;
    return pool.slice(0, 24);
  }, [query, skills, suggested]);

  const selectedSkills = skills.filter((s) => selected.has(s.id));

  const toggleSkill = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const flash = (ok: string | null, err: string | null) => {
    setMessage(ok);
    setError(err);
  };

  const onSaveSkills = () => {
    startTransition(async () => {
      const result = await saveProfileSkills([...selected]);
      flash(result.error ? null : "Skille zapisane.", result.error);
    });
  };

  const onSaveProfile = () => {
    const fd = new FormData();
    fd.set("full_name", fullName);
    fd.set("headline", headline);
    fd.set("weekly_focus", weeklyFocus);
    startTransition(async () => {
      const result = await saveProfileDetails(fd);
      flash(result.error ? null : "Profil zapisany.", result.error);
    });
  };

  const onAvatar = (file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.set("avatar", file);
    startTransition(async () => {
      const result = await uploadAvatar(fd);
      if (result.avatarUrl) setAvatarUrl(result.avatarUrl);
      flash(result.error ? null : "Zdjęcie zaktualizowane.", result.error);
    });
  };

  const onCreateSkill = () => {
    const label = query.trim();
    if (!label) return;
    startTransition(async () => {
      const result = await createCustomSkill(label);
      if (result.skill) {
        setSkills((prev) =>
          prev.some((s) => s.id === result.skill!.id)
            ? prev
            : [...prev, result.skill as Skill]
        );
        setSelected((prev) => new Set(prev).add(result.skill!.id));
        setQuery("");
      }
      flash(null, result.error);
    });
  };

  const onCreateTeam = () => {
    const fd = new FormData();
    fd.set("name", teamName);
    fd.set("description", teamDescription);
    startTransition(async () => {
      const result = await createTeam(fd);
      if (result.team) {
        setTeams((prev) => [result.team as Team, ...prev]);
        setTeamName("");
        setTeamDescription("");
      }
      flash(result.error ? null : "Team utworzony.", result.error ?? null);
    });
  };

  const initial = fullName.trim().charAt(0).toUpperCase() || "V";

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
            Profile
          </h1>
          <p className="mt-1 text-[14px] text-white/45">
            Skille, zdjęcie, weekly focus i teamy
          </p>
        </div>
        {(message || error) && (
          <p
            className={cn(
              "rounded-lg border px-3 py-1.5 text-[12px]",
              error
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-vairo/30 bg-vairo/10 text-vairo"
            )}
          >
            {error ?? message}
          </p>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.1fr_0.95fr]">
        {/* Skills */}
        <section className="flex flex-col rounded-2xl border border-white/[0.07] bg-[#121318] p-5">
          <h2 className="font-heading text-[1.35rem] font-semibold text-white">
            What can you do?
          </h2>
          <p className="mt-1 text-[13px] text-white/45">
            Select the hard skills that best describe you.
          </p>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onCreateSkill();
                }
              }}
              placeholder="Search skills…"
              className="h-10 w-full rounded-full border border-white/12 bg-[#0c0d11] pl-9 pr-3 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-vairo/60"
            />
          </div>

          <p className="mt-3 text-[12px] text-white/40">
            {selected.size} skills selected
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {filtered.map((skill) => {
              const active = selected.has(skill.id);
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  className={cn(
                    "h-9 rounded-full border px-3.5 text-[13px] font-medium transition",
                    active
                      ? "border-vairo text-white"
                      : "border-white/20 text-white/75 hover:border-white/40"
                  )}
                >
                  {skill.label}
                </button>
              );
            })}
          </div>

          <div className="mt-auto flex gap-2 pt-6">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-white/15 text-[13px] font-medium text-white/70 transition hover:border-white/30"
            >
              Skip
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onSaveSkills}
              className="btn-vairo inline-flex h-10 flex-1 items-center justify-center rounded-full text-[13px] font-semibold text-white disabled:opacity-60"
            >
              Continue
            </button>
          </div>
        </section>

        {/* Profile card */}
        <section className="rounded-2xl border border-white/[0.07] bg-[#121318] p-5">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => onAvatar(e.target.files?.[0] ?? null)}
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d11]"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                fill
                unoptimized
                className="object-cover transition group-hover:scale-[1.02]"
                sizes="420px"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-white/40">
                <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-[#f9a870] to-[#e8551a] text-2xl font-semibold text-white">
                  {initial}
                </div>
                <span className="text-[13px]">Dodaj zdjęcie profilowe</span>
              </div>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-black/55 py-2 text-center text-[12px] text-white/85 opacity-0 transition group-hover:opacity-100">
              Zmień zdjęcie
            </span>
          </button>

          <div className="mt-4 space-y-2">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Imię i nazwisko"
              className="w-full bg-transparent font-heading text-[1.55rem] font-semibold tracking-tight text-white outline-none placeholder:text-white/30"
            />
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="np. Full-stack Developer"
              className="w-full bg-transparent text-[14px] text-white/50 outline-none placeholder:text-white/30"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {selectedSkills.length > 0 ? (
              selectedSkills.map((skill) => (
                <span
                  key={skill.id}
                  className="rounded-full border border-vairo px-3 py-1 text-[12px] text-white"
                >
                  {skill.label}
                </span>
              ))
            ) : (
              <span className="text-[12px] text-white/35">
                Wybierz skille po lewej
              </span>
            )}
          </div>

          {ideaTags.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] uppercase tracking-wide text-white/35">
                Idea tags
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {ideaTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-white/60"
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.idea_description && (
            <p className="mt-3 line-clamp-3 text-[12px] leading-relaxed text-white/40">
              {profile.idea_description}
            </p>
          )}

          <div className="mt-5 rounded-xl border border-white/10 bg-[#0c0d11]/80 p-3.5">
            <p className="text-[13px] font-semibold text-vairo">Weekly focus</p>
            <textarea
              value={weeklyFocus}
              onChange={(e) => setWeeklyFocus(e.target.value)}
              rows={3}
              placeholder="I'm building something… looking for…"
              className="mt-2 w-full resize-none bg-transparent text-[13px] leading-relaxed text-white/80 outline-none placeholder:text-white/30"
            />
          </div>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setFullName(profile.full_name ?? "");
                setHeadline(profile.headline ?? "");
                setWeeklyFocus(profile.weekly_focus ?? "");
                setSelected(new Set(selectedSkillIds));
                flash(null, null);
              }}
              className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:border-white/30"
              aria-label="Anuluj"
            >
              <X className="size-4" />
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onSaveProfile}
              className="inline-flex size-12 items-center justify-center rounded-full border border-vairo/50 bg-vairo/15 text-vairo transition hover:bg-vairo/25 disabled:opacity-60"
              aria-label="Zapisz"
            >
              <Save className="size-4" />
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                onSaveSkills();
                onSaveProfile();
              }}
              className="inline-flex size-11 items-center justify-center rounded-full border border-vairo bg-vairo text-white transition disabled:opacity-60"
              aria-label="Zapisz wszystko"
            >
              <Check className="size-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-around border-t border-white/[0.06] pt-4 text-white/35">
            <Compass className="size-5" />
            <Users className="size-5" />
            <MessageSquare className="size-5" />
            <UserRound className="size-5 text-vairo" />
          </div>
        </section>

        {/* Teams */}
        <section className="flex flex-col rounded-2xl border border-white/[0.07] bg-[#121318] p-5">
          <h2 className="font-heading text-[1.35rem] font-semibold text-white">
            Teams
          </h2>
          <p className="mt-1 text-[13px] text-white/45">
            Stwórz team wokół swojego pomysłu.
          </p>

          <div className="mt-4 space-y-2.5">
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Nazwa teamu"
              className="h-10 w-full rounded-xl border border-white/12 bg-[#0c0d11] px-3.5 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-vairo/60"
            />
            <textarea
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              placeholder="Krótki opis (opcjonalnie)"
              rows={3}
              className="w-full resize-none rounded-xl border border-white/12 bg-[#0c0d11] px-3.5 py-2.5 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-vairo/60"
            />
            <button
              type="button"
              disabled={pending || teamName.trim().length < 2}
              onClick={onCreateTeam}
              className="btn-vairo inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-[13px] font-semibold text-white disabled:opacity-50"
            >
              <Plus className="size-4" />
              Create team
            </button>
          </div>

          <ul className="mt-5 flex-1 space-y-2.5">
            {teams.length === 0 ? (
              <li className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-[13px] text-white/35">
                Nie masz jeszcze teamu
              </li>
            ) : (
              teams.map((team) => (
                <li
                  key={team.id}
                  className="rounded-xl border border-white/[0.06] bg-[#0c0d11] px-3.5 py-3"
                >
                  <p className="text-[14px] font-medium text-white">
                    {team.name}
                  </p>
                  {team.description && (
                    <p className="mt-1 line-clamp-2 text-[12px] text-white/45">
                      {team.description}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-vairo">Owner</p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
