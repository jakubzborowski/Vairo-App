import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Flag,
  ListTodo,
  Mail,
  MailCheck,
  MessageSquare,
  OctagonAlert,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { formatAge, loadNotifications, type NotificationKind } from "@/lib/notifications";
import { loadJoinRequests } from "@/lib/social";
import { loadContactSignals } from "@/lib/messages";
import { getUserStartups } from "@/lib/startup";
import { MarkReadButton } from "@/components/app/mark-read-button";
import { InboxRow } from "@/components/social/inbox-row";
import { cn } from "@/lib/utils";
import { getLocale, getT } from "@/i18n/server";
import { canManageTeam } from "@/types/startup";

export async function generateMetadata() {
  const t = await getT("notifications");
  return { title: t("page.metaTitle") };
}
export const dynamic = "force-dynamic";

const KIND_ICON: Record<NotificationKind, LucideIcon> = {
  contact_received: UserPlus,
  contact_accepted: UserPlus,
  message_received: MessageSquare,
  join_application: Users,
  join_invite: Mail,
  join_accepted: MailCheck,
  join_declined: MailCheck,
  invite_accepted: UserPlus,
  invite_declined: MailCheck,
  goal_assigned: Flag,
  task_assigned: ListTodo,
  goal_blocked: OctagonAlert,
  goal_due: CalendarDays,
  invite_link_joined: UserPlus,
};

const EMPTY_KINDS = [
  [UserPlus, "page.emptyKind.contact"],
  [MessageSquare, "page.emptyKind.message"],
  [Users, "page.emptyKind.application"],
  [MailCheck, "page.emptyKind.reply"],
] as const satisfies readonly (readonly [LucideIcon, string])[];

function dayGroup(iso: string): "page.today" | "page.yesterday" | "page.earlier" {
  const date = new Date(iso);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const time = date.getTime();
  if (time >= startOfToday) return "page.today";
  if (time >= startOfToday - 86_400_000) return "page.yesterday";
  return "page.earlier";
}

/**
 * Powiadomienia — najpierw decyzje, potem reszta.
 *
 * Dawniej jedna lista, w której zgłoszenie do teamu wyglądało tak samo jak
 * „ktoś dodał Cię do kontaktów". Teraz to, co czeka na Twoją decyzję, stoi
 * na górze w jednej ciepłej karcie z przyciskami; pozostałe zdarzenia idą
 * pod nią, pogrupowane na dziś, wczoraj i wcześniej. Każdy wiersz ma ikonę
 * rodzaju i prowadzi prosto do miejsca, którego dotyczy.
 */
export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tylko?: string }>;
}) {
  const { tylko } = await searchParams;
  const onlyUnread = tylko === "nowe";
  const supabase = await createClient();
  const user = await getCurrentUser();
  const t = await getT("notifications");
  const tc = await getT("common");
  const locale = await getLocale();

  if (!user) redirect("/register?next=/app/notifications");

  const startups = await getUserStartups(supabase, user.id);
  const manageableIds = startups.filter((startup) => canManageTeam(startup.role)).map((startup) => startup.id);

  const [{ notifications, error }, { requests }, { signals }] = await Promise.all([
    loadNotifications(supabase, user.id, t),
    loadJoinRequests(supabase, user.id, manageableIds, "pending"),
    loadContactSignals(supabase, user.id),
  ]);

  const decisions = [
    ...requests.filter((item) => item.canRespond),
    ...signals.filter((item) => item.canRespond),
  ];
  const unread = notifications.filter((item) => !item.isRead).length;
  const shown = onlyUnread ? notifications.filter((item) => !item.isRead) : notifications;

  const groups = new Map<ReturnType<typeof dayGroup>, typeof shown>();
  for (const item of shown) {
    const key = dayGroup(item.createdAt);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  const subtitle =
    unread === 0 && decisions.length === 0
      ? t("page.allRead")
      : [
          unread > 0 ? t("page.unreadCount", { count: unread }) : null,
          decisions.length > 0 ? t("page.decisionsCount", { count: decisions.length }) : null,
        ]
          .filter(Boolean)
          .join(". ") + ".";

  return (
    <div className="page">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
            {t("page.title")}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--text-muted)]">{subtitle}</p>
        </div>
        <MarkReadButton unreadCount={unread} />
      </header>

      {error ? (
        <p className="mt-5 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/8 px-4 py-3 text-[13px] text-[var(--warning)]">
          {error}
        </p>
      ) : null}

      {decisions.length > 0 ? (
        <section className="edge-accent mt-6 overflow-hidden rounded-[22px] border border-[var(--vairo)]/25 bg-[var(--vairo)]/[0.05] lift-2">
          <p className="px-5 pt-4 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--text-subtle)]">
            {t("page.awaitingDecision")}
          </p>
          <ul className="mt-1 divide-y divide-white/[0.06]">
            {decisions.slice(0, 3).map((item, index) =>
              "direction" in item ? (
                <InboxRow key={item.id} kind="request" request={item} quiet={index > 0} />
              ) : (
                <InboxRow key={item.id} kind="signal" signal={item} quiet={index > 0} />
              )
            )}
          </ul>
          {decisions.length > 3 ? (
            <Link
              href="/app/social/invites"
              className="block border-t border-white/[0.06] px-5 py-3 text-[13px] text-[var(--text-muted)] hover:text-white"
            >
              {t("page.moreInInvites", { count: decisions.length - 3 })}
            </Link>
          ) : null}
        </section>
      ) : null}

      {/* Promień podświetlenia = promień ramki minus odstęp (jak w pozostałych
          przełącznikach). Przy 9 px w ramce ~20 px podświetlenie wyglądało
          na kwadratowe w owalnej ramce. */}
      {notifications.length > 0 ? (
        <nav aria-label={t("page.filter")} className="mt-6 inline-flex rounded-xl border border-white/10 bg-[var(--surface)] p-1">
          {[
            [false, t("page.all"), "/app/notifications"],
            [true, t("page.unread"), "/app/notifications?tylko=nowe"],
          ].map(([value, label, href]) => (
            <Link
              key={String(label)}
              href={href as string}
              aria-current={onlyUnread === value ? "page" : undefined}
              className={cn(
                "inline-flex h-11 items-center gap-1.5 rounded-lg px-3.5 text-[13.5px] transition-colors sm:h-8",
                onlyUnread === value ? "bg-[var(--surface-3)] font-medium text-white lift-1" : "text-[var(--text-muted)] hover:text-white"
              )}
            >
              {label as string}
              {value && unread > 0 ? <span className="tabular text-[12px]">{unread}</span> : null}
            </Link>
          ))}
        </nav>
      ) : null}

      {!error && notifications.length === 0 ? (
        <section className="mt-6 flex flex-col items-center rounded-[25px] border-[1.5px] border-dashed border-white/10 px-6 py-10 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-[18px] bg-[var(--surface-2)] text-[var(--text-muted)]">
            <Bell className="size-6" strokeWidth={1.75} />
          </span>
          <p className="mt-4 font-heading text-[20px] font-semibold text-white">{t("page.emptyTitle")}</p>
          <p className="mt-1.5 text-[14.5px] text-[var(--text-muted)]">
            {t("page.emptyBody")}
          </p>
          <ul className="mt-6 grid grid-cols-1 w-full max-w-[520px] gap-2.5 text-left sm:grid-cols-2">
            {EMPTY_KINDS.map(([Icon, text]) => (
              <li key={text} className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] px-3.5 py-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-[var(--surface-2)] text-[var(--text-muted)]">
                  <Icon className="size-4" />
                </span>
                <span className="text-[13.5px] text-[var(--text-muted)]">{t(text)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {notifications.length > 0 && shown.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-white/10 px-4 py-4 text-[13.5px] text-[var(--text-subtle)]">
          {t("page.allRead")}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-6">
        {[...groups.entries()].map(([name, items]) => (
          <section key={name}>
            <h2 className="px-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--text-subtle)]">
              {t(name)}
            </h2>
            {/* Wiersze mają własne zaokrąglenie (22 − 4 px odstępu), żeby
                podświetlenie po najechaniu szło za kształtem karty, a nie
                było prostokątem przyciętym przez jej narożniki. */}
            <ul className="mt-2 flex flex-col overflow-hidden rounded-[22px] bg-[var(--surface)] p-1 lift-1">
              {items.map((item) => {
                const Icon = KIND_ICON[item.kind] ?? Bell;
                return (
                  <li key={item.id}>
                    <Link
                      // Przez trasę pośrednią: przełącza team zdarzenia i oznacza je
                      // jako przeczytane, zanim otworzy cel czy zadanie.
                      href={`/app/notifications/open?id=${item.id}`}
                      prefetch={false}
                      className="flex min-h-16 items-center gap-3 rounded-[18px] py-2.5 pl-2 pr-3 transition-colors hover:bg-white/[0.04] sm:pr-[14px]"
                    >
                      <span
                        aria-label={item.isRead ? undefined : t("page.unread")}
                        className={cn("size-[7px] shrink-0 rounded-full", item.isRead ? "bg-transparent" : "bg-white")}
                      />
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[var(--surface-2)]">
                        <Icon className={cn("size-[18px]", item.isRead ? "text-[var(--text-muted)]" : "text-white")} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-[14.5px] leading-snug",
                            item.isRead ? "text-[var(--text-muted)]" : "font-medium text-white"
                          )}
                        >
                          {item.title}
                        </span>
                        {item.preview ? (
                          <span className="mt-0.5 block truncate text-[13px] text-[var(--text-muted)]">
                            {item.preview}
                          </span>
                        ) : null}
                        <span className="mt-0.5 block text-[12.5px] text-[var(--text-subtle)] sm:hidden">
                          {formatAge(tc, locale, item.createdAt)}
                        </span>
                      </span>
                      <span className="tabular hidden shrink-0 text-[12.5px] text-[var(--text-muted)] sm:block">
                        {formatAge(tc, locale, item.createdAt)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
