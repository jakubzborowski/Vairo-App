"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/types/social";

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
  const pathname = usePathname();
  const openId = pathname.split("/app/social/messages/")[1]?.split("/")[0] ?? null;
  const isThread = Boolean(openId);

  return (
    <div className="page-wide">
      <div className="grid gap-5 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:items-start">
        <aside className={cn("min-w-0", isThread && "hidden md:block")}>
          <h1 className="mb-3 font-heading text-[1.35rem] font-semibold tracking-tight text-white">
            Wiadomości
          </h1>

          {error ? (
            <p className="rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/8 px-3.5 py-3 text-[13px] text-[var(--warning)]">
              {error}
            </p>
          ) : null}

          {!error && conversations.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-[13px] leading-relaxed text-[var(--text-subtle)]">
              Rozmowa powstaje, gdy ktoś przyjmie Twoją zaczepkę.
            </p>
          ) : null}

          {conversations.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {conversations.map((conversation) => {
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
                            {conversation.otherName ?? "Bez imienia"}
                          </span>
                          <span className="tabular shrink-0 text-[11px] text-[var(--text-faint)]">
                            {formatWhen(conversation.lastMessageAt)}
                          </span>
                        </span>

                        <span
                          className={cn(
                            "mt-0.5 block truncate text-[12.5px]",
                            conversation.unreadCount > 0
                              ? "font-medium text-white"
                              : "text-[var(--text-subtle)]"
                          )}
                        >
                          {conversation.contextStartupName ? (
                            <Building2 className="mr-1 inline size-3 align-[-1px] text-[var(--vairo)]" />
                          ) : null}
                          {conversation.lastFromMe ? "Ty: " : ""}
                          {conversation.lastBody ?? "Brak wiadomości"}
                        </span>
                      </span>

                      {conversation.unreadCount > 0 ? (
                        <span className="tabular inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--vairo)] text-[11px] font-semibold text-white">
                          {conversation.unreadCount > 9 ? "9" : conversation.unreadCount}
                        </span>
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
                Rozmowa otwiera się, gdy ktoś przyjmie Twoją zaczepkę albo Ty
                przyjmiesz cudzą.
              </p>
              <Link
                href="/app/social/discover"
                className="mt-4 inline-flex h-10 items-center rounded-xl bg-[var(--vairo-strong)] px-4 text-[13.5px] font-medium text-white transition-opacity hover:opacity-90"
              >
                Znajdź kogoś w Odkrywaj
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
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-white/[0.07] bg-[var(--surface)]/50 px-6 py-12 text-center">
      <p className="inline-flex items-center gap-2 text-[14px] text-[var(--text-subtle)]">
        <MessageSquare className="size-4" strokeWidth={1.5} />
        Wybierz rozmowę z listy
      </p>
    </div>
  );
}

/** „14:32" dla dzisiaj, „wczoraj", potem data — bez bibliotek. */
function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "wczoraj";

  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}
