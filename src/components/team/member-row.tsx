"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Crown,
  Pencil,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  removeMember,
  transferFounder,
  updateJobTitle,
  updateMemberRole,
} from "@/app/app/team/actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { Modal } from "@/components/ui/modal";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";
import { JOB_TITLE_SUGGESTIONS } from "@/types/social";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type StartupRole } from "@/types/startup";
import type { TeamMember } from "@/lib/social";

const ROLE_ICONS: Record<StartupRole, typeof Crown> = {
  founder: Crown,
  admin: ShieldCheck,
  member: User,
};

type Props = {
  startupId: string;
  member: TeamMember;
  viewerId: string;
  viewerRole: StartupRole;
  /** Liczba Founderów — ostatniego nie da się zdegradować ani usunąć. */
  founderCount: number;
};

/**
 * Jeden wiersz składu teamu.
 *
 * Rola i stanowisko są tu celowo obok siebie i wyraźnie rozdzielone:
 * stanowisko to wizytówka („CTO"), rola to uprawnienia. Pod każdą rolą
 * w menu widać, co daje — bez tego ludzie nadają Admina wszystkim,
 * bo brzmi poważniej.
 */
export function MemberRow({
  startupId,
  member,
  viewerId,
  viewerRole,
  founderCount,
}: Props) {
  const router = useRouter();
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(member.jobTitle ?? "");
  const [roleOpen, setRoleOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const isSelf = member.profileId === viewerId;
  const canManage = viewerRole === "founder" || viewerRole === "admin";
  const canEditTitle = isSelf || canManage;
  // Ostatni Founder musi najpierw przekazać rolę — tego pilnuje też trigger.
  const isLastFounder = member.role === "founder" && founderCount <= 1;
  const canChangeRole = canManage && !isLastFounder;
  const canRemove = canManage && !isSelf && !isLastFounder;

  const Icon = ROLE_ICONS[member.role];

  const run = (fn: () => Promise<{ error: string | null }>, after?: () => void) => {
    setError(null);
    startBusy(async () => {
      const result = await fn();
      if (result.error) {
        setError(result.error);
        return;
      }
      after?.();
      router.refresh();
    });
  };

  return (
    <li className="rounded-2xl border border-white/[0.07] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-start gap-4">
        <Avatar src={member.avatarUrl} name={member.fullName} size="md" />

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <Link
              href={
                isSelf ? "/app/social/me" : `/app/social/people/${member.profileId}`
              }
              className="text-[14.5px] font-semibold text-white underline-offset-2 hover:underline"
            >
              {member.fullName ?? "Bez imienia"}
            </Link>
            {isSelf ? <Badge>to Ty</Badge> : null}
          </p>

          {/* Stanowisko: edycja w miejscu, bez osobnego ekranu. */}
          {editingTitle ? (
            <div className="mt-2 max-w-sm">
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={48}
                placeholder="np. CTO"
                autoFocus
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {JOB_TITLE_SUGGESTIONS.slice(0, 6).map((suggestion) => (
                  <Pill
                    key={suggestion}
                    selected={title === suggestion}
                    onToggle={() =>
                      setTitle((prev) => (prev === suggestion ? "" : suggestion))
                    }
                  >
                    {suggestion}
                  </Pill>
                ))}
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <Button
                  size="sm"
                  loading={busy}
                  onClick={() =>
                    run(
                      () =>
                        updateJobTitle({
                          startupId,
                          profileId: member.profileId,
                          jobTitle: title,
                        }),
                      () => setEditingTitle(false)
                    )
                  }
                >
                  <Check className="size-4" />
                  Zapisz
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    setTitle(member.jobTitle ?? "");
                    setEditingTitle(false);
                  }}
                >
                  Anuluj
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 text-[13px] text-[var(--text-subtle)]">
              {member.jobTitle ?? (
                <span className="italic text-[var(--text-faint)]">
                  Bez stanowiska
                </span>
              )}
            </p>
          )}

          {member.headline ? (
            <p className="mt-1 text-[12.5px] text-[var(--text-faint)]">
              {member.headline}
            </p>
          ) : null}
          {member.email ? (
            <p className="mt-0.5 text-[12px] text-[var(--text-faint)]">
              {member.email}
            </p>
          ) : null}

          {member.skills.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {member.skills.slice(0, 6).map((skill) => (
                <Pill key={skill}>{skill}</Pill>
              ))}
            </div>
          ) : null}
        </div>

        {/* Rola jako plakietka do CZYTANIA, akcje pod trzema kropkami.
            Wcześniej po prawej stały trzy klikalne rzeczy — przycisk roli,
            ołówek przy stanowisku i kosz — więc wiersz o jednej osobie miał
            trzy wezwania do działania. Teraz wiersz mówi, kto to jest i co
            może; co z tym zrobić, sprawdza się na żądanie. */}
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            title={
              isLastFounder
                ? "Jedyny Founder — najpierw przekaż tę rolę komuś innemu"
                : ROLE_DESCRIPTIONS[member.role]
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 text-[12.5px] text-[var(--text-muted)]"
          >
            <Icon className="size-3.5" />
            {ROLE_LABELS[member.role]}
          </span>

          {canEditTitle || canChangeRole || canRemove ? (
            <Menu label={`Zarządzaj: ${member.fullName ?? "osoba"}`}>
              {(close) => (
                <>
                  {canEditTitle ? (
                    <MenuItem
                      icon={Pencil}
                      onClick={() => {
                        setEditingTitle(true);
                        close();
                      }}
                    >
                      Zmień stanowisko
                    </MenuItem>
                  ) : null}

                  {canChangeRole ? (
                    <MenuItem
                      icon={ShieldCheck}
                      onClick={() => {
                        setRoleOpen(true);
                        close();
                      }}
                    >
                      Zmień rolę
                    </MenuItem>
                  ) : null}

                  {canRemove ? (
                    <>
                      <MenuSeparator />
                      <MenuItem
                        icon={Trash2}
                        tone="danger"
                        onClick={() => {
                          setConfirmRemove(true);
                          close();
                        }}
                      >
                        Usuń z teamu
                      </MenuItem>
                    </>
                  ) : null}
                </>
              )}
            </Menu>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      {roleOpen ? (
        <Modal
          title={`Uprawnienia: ${member.fullName ?? "członek teamu"}`}
          description="To jest jedyne miejsce, które decyduje, kto może zmieniać dane etapów i skład teamu. Stanowisko (CEO, CTO) nie daje uprawnień."
          onClose={() => setRoleOpen(false)}
          footer={
            <Button variant="ghost" onClick={() => setRoleOpen(false)} disabled={busy}>
              Zamknij
            </Button>
          }
        >
          <div className="flex flex-col gap-1.5">
            {(["founder", "admin", "member"] as StartupRole[]).map((role) => {
              const selected = member.role === role;
              // Rolę Foundera nadaje tylko Founder — Admin nie może awansować
              // siebie do poziomu, na którym da się usunąć cały startup.
              const blocked = role === "founder" && viewerRole !== "founder";
              const RoleIcon = ROLE_ICONS[role];

              return (
                <button
                  key={role}
                  type="button"
                  disabled={blocked || busy || selected}
                  onClick={() =>
                    run(
                      () =>
                        updateMemberRole({
                          startupId,
                          profileId: member.profileId,
                          role,
                        }),
                      () => setRoleOpen(false)
                    )
                  }
                  className={cn(
                    "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-colors",
                    selected
                      ? "border-[var(--vairo)]/60 bg-[var(--vairo)]/8"
                      : "border-white/10 hover:border-white/22",
                    blocked && "cursor-not-allowed opacity-45"
                  )}
                >
                  <RoleIcon
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      selected ? "text-[var(--vairo)]" : "text-[var(--text-faint)]"
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[14px] font-medium text-white">
                      {ROLE_LABELS[role]}
                      {selected ? (
                        <Badge tone="brand">obecna</Badge>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
                      {ROLE_DESCRIPTIONS[role]}
                      {blocked ? " Nadaje ją wyłącznie Founder." : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Oddanie sterów to osobna decyzja, nie „zmiana roli" — bo zmienia
              rolę DWÓM osobom naraz. Dlatego stoi pod listą, oddzielona. */}
          {viewerRole === "founder" && !isSelf && member.role !== "founder" ? (
            <div className="border-t border-white/[0.07] pt-4">
              <p className="text-[13px] font-medium text-white">
                Oddajesz prowadzenie?
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
                {member.fullName ?? "Ta osoba"} zostanie Founderem, a Ty
                Adminem. Stracisz możliwość usunięcia startupu i nadawania roli
                Foundera.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                disabled={busy}
                onClick={() => {
                  setRoleOpen(false);
                  setConfirmTransfer(true);
                }}
              >
                <Crown className="size-4" />
                Przekaż rolę Foundera
              </Button>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
              {error}
            </p>
          ) : null}
        </Modal>
      ) : null}

      {confirmTransfer ? (
        <Modal
          title="Przekazać rolę Foundera?"
          description={`${member.fullName ?? "Ta osoba"} przejmie prowadzenie teamu. Ty zostaniesz Adminem — nadal zarządzasz składem i etapami, ale nie usuniesz startupu ani nie nadasz nikomu roli Foundera.`}
          onClose={() => setConfirmTransfer(false)}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => setConfirmTransfer(false)}
                disabled={busy}
              >
                Anuluj
              </Button>
              <Button
                loading={busy}
                onClick={() =>
                  run(
                    () =>
                      transferFounder({
                        startupId,
                        toProfileId: member.profileId,
                      }),
                    () => setConfirmTransfer(false)
                  )
                }
              >
                <Crown className="size-4" />
                Przekazuję
              </Button>
            </>
          }
        >
          <p className="rounded-xl border border-white/10 bg-[var(--surface-2)] px-4 py-3 text-[13px] leading-relaxed text-[var(--text-muted)]">
            Tę zmianę da się odwrócić tylko wtedy, gdy nowy Founder odda Ci
            rolę z powrotem. Rób to tylko z osobą, z którą się na to umówiłeś.
          </p>

          {error ? (
            <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
              {error}
            </p>
          ) : null}
        </Modal>
      ) : null}

      {confirmRemove ? (
        <Modal
          title="Usunąć z teamu?"
          description={`${member.fullName ?? "Ta osoba"} straci dostęp do wszystkiego, co należy do tego teamu. To, co już wypełniła, zostaje.`}
          onClose={() => setConfirmRemove(false)}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => setConfirmRemove(false)}
                disabled={busy}
              >
                Anuluj
              </Button>
              <Button
                variant="danger"
                loading={busy}
                onClick={() =>
                  run(
                    () => removeMember({ startupId, profileId: member.profileId }),
                    () => setConfirmRemove(false)
                  )
                }
              >
                <X className="size-4" />
                Usuń z teamu
              </Button>
            </>
          }
        >
          {error ? (
            <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
              {error}
            </p>
          ) : null}
        </Modal>
      ) : null}
    </li>
  );
}
