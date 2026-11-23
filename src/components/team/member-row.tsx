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
import type { StartupRole } from "@/types/startup";
import { useT } from "@/i18n/client";
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
  /** Otwarta praca tej osoby (wytyczne, sekcja 7). `null` = bez trackera. */
  work?: { goals: number; tasks: number } | null;
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
  work = null,
}: Props) {
  const t = useT("team");
  const tl = useT("labels");
  const tc = useT("common");
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
              {member.fullName ?? t("member.noName")}
            </Link>
            {isSelf ? <Badge>{t("member.you")}</Badge> : null}
          </p>

          {/* Stanowisko: edycja w miejscu, bez osobnego ekranu. */}
          {editingTitle ? (
            <div className="mt-2 max-w-sm">
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={48}
                placeholder={t("member.jobPlaceholder")}
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
                  {tc("actions.save")}
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
                  {tc("actions.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 text-[13px] text-[var(--text-subtle)]">
              {member.jobTitle ?? (
                <span className="italic text-[var(--text-subtle)]">
                  {t("member.noJobTitle")}
                </span>
              )}
            </p>
          )}

          {member.headline ? (
            <p className="mt-1 text-[12.5px] text-[var(--text-subtle)]">
              {member.headline}
            </p>
          ) : null}
          {member.email ? (
            <p className="mt-0.5 text-[12px] text-[var(--text-subtle)]">
              {member.email}
            </p>
          ) : null}
          {work ? (
            <p className="mt-1.5 text-[12.5px] text-[var(--text-muted)]">
              {work.goals === 0 && work.tasks === 0
                ? t("member.noWork")
                : t("member.work", { goals: work.goals, tasks: work.tasks })}
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
                ? t("member.lastFounder")
                : tl(`roleDescription.${member.role}`)
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 text-[12.5px] text-[var(--text-muted)]"
          >
            <Icon className="size-3.5" />
            {tl(`role.${member.role}`)}
          </span>

          {canEditTitle || canChangeRole || canRemove ? (
            <Menu label={t("member.manage", { name: member.fullName ?? t("member.person") })}>
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
                      {t("member.changeTitle")}
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
                      {t("member.changeRole")}
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
                        {t("member.remove")}
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
          title={t("member.rolesTitle", { name: member.fullName ?? t("member.aMember") })}
          description={t("member.rolesBody")}
          onClose={() => setRoleOpen(false)}
          footer={
            <Button variant="ghost" onClick={() => setRoleOpen(false)} disabled={busy}>
              {tc("actions.close")}
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
                      {tl(`role.${role}`)}
                      {selected ? (
                        <Badge tone="brand">{t("member.current")}</Badge>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
                      {tl(`roleDescription.${role}`)}
                      {blocked ? ` ${t("member.founderOnly")}` : ""}
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
                {t("member.handOver")}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
                {t("member.handOverBody", { name: member.fullName ?? t("member.thisPerson") })}
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
                {t("member.transfer")}
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
          title={t("member.transferTitle")}
          description={t("member.transferBody", { name: member.fullName ?? t("member.thisPerson") })}
          onClose={() => setConfirmTransfer(false)}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => setConfirmTransfer(false)}
                disabled={busy}
              >
                {tc("actions.cancel")}
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
                {t("member.transferConfirm")}
              </Button>
            </>
          }
        >
          <p className="rounded-xl border border-white/10 bg-[var(--surface-2)] px-4 py-3 text-[13px] leading-relaxed text-[var(--text-muted)]">
            {t("member.transferNote")}
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
          title={t("member.removeTitle")}
          description={t("member.removeBody", { name: member.fullName ?? t("member.thisPerson") })}
          onClose={() => setConfirmRemove(false)}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => setConfirmRemove(false)}
                disabled={busy}
              >
                {tc("actions.cancel")}
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
                {t("member.remove")}
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
