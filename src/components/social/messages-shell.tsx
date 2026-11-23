"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/types/social";
import { useLocale, useT } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { formatDate } from "@/i18n/format";
import type { MessageKey } from "@/i18n/messages";
import type { Translate } from "@/i18n/translator";

/**
 * Skrzynka w układzie dwupanelowym: lista rozmów po lewej, wątek po prawej.
 *
 * Wcześniej były to dwa osobne ekrany — lista, klik, wątek, strzałka wstecz,
 * lista. Przy czacie to jest zły układ z prostego powodu: **rozmowa nie jest
 * dokumentem, tylko jedną z kilku równoległych**. Żeby sprawdzić, kto jeszcze
 * napisał, trzeba było wyjść z tego, co się właśnie czyta. Każdy komunikator,
 * do którego ludzie są przyzwyczajeni, trzyma listę na stałe po lewej i tylko
 * podmienia prawą stronę — i tego właśnie ktoś tu szuka odruchowo.
 *
 * Na telefonie dwa panele obok siebie nie mają sensu, więc wracamy do dwóch
 * ekranów: lista ALBO wątek, zależnie od adresu. Decyduje o tym `usePathname`,
 * bo layout w App Routerze nie dostaje informacji o tym, co renderuje pod
 * sobą — a bez tego na telefonie lista wisiałaby nad każdą rozmową.
 */
export function MessagesShell({
  conversations,
  error,
  children,
}: {
  conversations: ConversationSummary[];
  error: string | null;
  children: React.ReactNode;
}) {
  const t = useT("social");
  const locale = useLocale();
  const pathname = usePathname();
  const openId = pathname.split("/app/social/messages/")[1]?.split("/")[0] ?? null;
  const isThread = Boolean(openId);
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? conversations.filter((conversation) =>
        [conversation.otherName, conversation.contextStartupName, conversation.lastBody]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle))
      )
    : conversations;
  const unread = conversations.filter((conversation) => conversation.unreadCount > 0).length;

  return (
    <div className="page-wide">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:items-start">
        <aside className={cn("min-w-0", isThread && "hidden md:block")}>
          <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
            {t("messages.title")}
          </h1>
          <p className="mb-3 mt-1 text-[14px] text-[var(--text-muted)]">
            {unread > 0
              ? `${t("messages.unread", { count: unread })}.`
              : t("messages.allRead")}
          </p>
          {conversations.length > 3 ? (
            <label className="mb-3 flex h-10 items-center gap-2 rounded-xl border border-white/14 bg-[var(--bg)] px-3 text-[13.5px] text-[var(--text-muted)] focus-within:border-[var(--vairo)]/45">
              <Search className="size-4 shrink-0" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("messages.searchPerson")}
                aria-label={t("messages.searchAria")}
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-[var(--text-subtle)]"
              />
            </label>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/8 px-3.5 py-3 text-[13px] text-[var(--warning)]">
              {error}
            </p>
          ) : null}

          {!error && conversations.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-[13px] leading-relaxed text-[var(--text-subtle)]">
              {t("messages.emptyHint")}
            </p>
          ) : null}

          {conversations.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {shown.map((conversation) => {
                const active = conversation.id === openId;
                return (
                  <li key={conversation.id}>
                    <Link
                      href={`/app/social/messages/${conversation.id}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                        active
                          ? "bg-white/[0.08]"
                          : "hover:bg-white/[0.04]"
                      )}
                    >
                      <Avatar
                        src={conversation.otherAvatarUrl}
                        name={conversation.otherName}
                        size="md"
                      />

                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[14px] font-medium text-white">
                            {conversation.otherName ?? t("card.noName")}
                          </span>
                          <span className="tabular shrink-0 text-[11.5px] text-[var(--text-muted)]">
                            {formatWhen(conversation.lastMessageAt, t, locale)}
                          </span>
                        </span>

                        {conversation.contextStartupName ? (
                          <span className="mt-0.5 block truncate text-[12px] text-[var(--text-muted)]">
                            {conversation.contextStartupName}
                          </span>
                        ) : null}
                        <span
                          className={cn(
                            "mt-0.5 block truncate text-[12.5px]",
                            conversation.unreadCount > 0
                              ? "font-medium text-white"
                              : "text-[var(--text-subtle)]"
                          )}
                        >
                          {conversation.lastFromMe ? t("messages.you") : ""}
                          {conversation.lastBody ?? t("messages.noMessages")}
                        </span>
                      </span>

                      {/* Biała kropka zamiast pomarańczowego licznika —
                          pomarańcz na tym ekranie należy do „Wyślij". */}
                      {conversation.unreadCount > 0 ? (
                        <span
                          className="size-2 shrink-0 rounded-full bg-white"
                          aria-label={`Nieprzeczytane: ${conversation.unreadCount}`}
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </aside>

        <section className={cn("min-w-0", !isThread && "hidden md:block")}>
          {/* Pusta skrzynka ma jedno wyjście i ono stoi tutaj, a nie w liście
              po lewej — prawy panel to miejsce, w którym i tak się patrzy. */}
          {conversations.length === 0 && !isThread ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-[var(--surface)]/50 px-6 py-12 text-center">
              <MessageSquare
                className="size-7 text-[var(--text-faint)]"
                strokeWidth={1.5}
              />
              <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-[var(--text-muted)]">
                {t("messages.emptyBody")}
              </p>
              <Link
                href="/app/social/discover"
                className="mt-4 inline-flex h-10 items-center rounded-xl bg-[var(--vairo-strong)] px-4 text-[13.5px] font-medium text-white transition-opacity hover:opacity-90"
              >
                {t("messages.findSomeone")}
              </Link>
            </div>
          ) : (
            children
          )}
        </section>
      </div>
    </div>
  );
}

/** Prawy panel, kiedy rozmowy są, ale żadnej jeszcze nie otwarto. */
export function NoConversationSelected() {
  const t = useT("social");
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-white/[0.07] bg-[var(--surface)]/50 px-6 py-12 text-center">
      <p className="inline-flex items-center gap-2 text-[14px] text-[var(--text-subtle)]">
        <MessageSquare className="size-4" strokeWidth={1.5} />
        {t("messages.pick")}
      </p>
    </div>
  );
}

/** „14:32" dla dzisiaj, „wczoraj", potem data — bez bibliotek. */
function formatWhen(iso: string, t: Translate<MessageKey<"social">>, locale: Locale) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return formatDate(locale, date, { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return t("age.yesterday");

  return formatDate(locale, date, { day: "numeric", month: "short" });
}
