"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { Copy, Link2, RefreshCw, UserPlus, XCircle } from "lucide-react";
import { createInviteLink, revokeInviteLinks } from "@/app/app/team/invite-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { InviteLink } from "@/lib/invites";
import { useLocale, useT } from "@/i18n/client";
import { LOCALE_TAGS } from "@/i18n/config";

const subscribeNoop = () => () => {};
const readOrigin = () => window.location.origin;

/**
 * Zaproszenie znajomych linkiem — uwaga z redesignu: Vairo ma od początku
 * zachęcać do budowania w kilka osób. Do tej pory dało się zaprosić tylko
 * kogoś, kto już ma konto i jest widoczny w Social.
 */
export function InviteLinkCard({
  startupId,
  initial,
}: {
  startupId: string;
  initial: InviteLink | null;
}) {
  const t = useT("team");
  const tl = useT("labels");
  const locale = useLocale();
  const [link, setLink] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  // Adres strony znamy dopiero w przeglądarce; na serwerze pole jest puste.
  const origin = useSyncExternalStore(subscribeNoop, readOrigin, () => "");
  const url = link ? `${origin}/join/${link.token}` : "";

  const create = () =>
    startTransition(async () => {
      const result = await createInviteLink(startupId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setLink(result.link);
      toast({ title: t("link.readyTitle"), description: t("link.readyBody") });
    });

  const revoke = () =>
    startTransition(async () => {
      const result = await revokeInviteLinks(startupId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setLink(null);
      toast({ title: t("link.revokedTitle"), description: t("link.revokedBody") });
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t("link.copiedTitle"), description: t("link.copiedBody") });
    } catch {
      setError(t("link.copyFailed"));
    }
  };

  return (
    <section
      id="zaproszenie"
      className="mt-5 scroll-mt-24 rounded-[22px] bg-[var(--surface)] px-5 py-4 lift-1"
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-white">
          <UserPlus className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-medium text-white">{t("link.title")}</h2>
          <p className="mt-0.5 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
            {t("link.body", { role: tl("role.member") })}
          </p>
        </div>
      </div>

      {link ? (
        <div className="mt-4 flex flex-col gap-2.5">
          <div className="flex flex-wrap gap-2">
            <Input
              readOnly
              value={url}
              aria-label={t("link.aria")}
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 flex-1 font-mono text-[12.5px]"
            />
            <Button onClick={copy} disabled={!origin}>
              <Copy className="size-4" />
              {t("link.copy")}
            </Button>
          </div>
          <p className="text-[12.5px] text-[var(--text-subtle)]">
            {t("link.validUntil", {
              date: new Date(link.expiresAt).toLocaleDateString(LOCALE_TAGS[locale], {
                day: "numeric",
                month: "long",
              }),
              used: link.useCount,
              max: link.maxUses,
            })}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={create} disabled={pending}>
              <RefreshCw className="size-3.5" />
              {t("link.new")}
            </Button>
            <Button variant="ghost" size="sm" onClick={revoke} disabled={pending}>
              <XCircle className="size-3.5" />
              {t("link.revoke")}
            </Button>
            <span className="self-center text-[12px] text-[var(--text-subtle)]">
              {t("link.newRevokes")}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <Button onClick={create} disabled={pending}>
            <Link2 className="size-4" />
            {pending ? t("link.creating") : t("link.create")}
          </Button>
        </div>
      )}

      {error ? (
        <p className="mt-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger-text)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
