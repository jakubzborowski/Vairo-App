import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatAge, loadNotifications } from "@/lib/notifications";
import { MarkReadButton } from "@/components/app/mark-read-button";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export const metadata = { title: "Powiadomienia — Vairo" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/register?next=/app/notifications");

  const { notifications, error } = await loadNotifications(supabase, user.id);
  const unread = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
            Powiadomienia
          </h1>
          <p className="mt-1 text-[14px] text-[var(--text-subtle)]">
            {unread > 0
              ? `${unread} ${unread === 1 ? "nowe zdarzenie" : "nowych zdarzeń"}.`
              : "Wszystko przeczytane."}
          </p>
        </div>
        <MarkReadButton unreadCount={unread} />
      </header>

      {error ? (
        <p className="mt-5 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/8 px-4 py-3 text-[13px] text-[var(--warning)]">
          {error}
        </p>
      ) : null}

      {!error && notifications.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Bell}
            title="Nic się jeszcze nie stało"
            description="Pojawią się tutaj kontakty, wiadomości, zgłoszenia do teamu i odpowiedzi na Twoje prośby. Każde prowadzi prosto do właściwego miejsca."
            action={
              <Button href="/app/social/discover" variant="secondary">
                Zacznij od Odkrywaj
              </Button>
            }
          />
        </div>
      ) : null}

      {notifications.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-2">
          {notifications.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-start gap-3.5 rounded-2xl border px-4 py-3.5 transition-colors",
                  item.isRead
                    ? "border-white/[0.07] bg-[var(--surface)] hover:border-white/15"
                    : "border-[var(--vairo)]/30 bg-[var(--vairo)]/6"
                )}
              >
                <Avatar
                  src={item.actorAvatarUrl}
                  name={item.actorName}
                  size="sm"
                  className="mt-0.5"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p
                      className={cn(
                        "min-w-0 text-[14px]",
                        item.isRead
                          ? "text-[var(--text-muted)]"
                          : "font-medium text-white"
                      )}
                    >
                      {item.title}
                    </p>
                    <span className="tabular shrink-0 text-[11.5px] text-[var(--text-faint)]">
                      {formatAge(item.createdAt)}
                    </span>
                  </div>

                  {item.preview ? (
                    <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[var(--text-subtle)]">
                      {item.preview}
                    </p>
                  ) : null}
                </div>

                {!item.isRead ? (
                  <span
                    className="mt-2 size-2 shrink-0 rounded-full bg-[var(--vairo)]"
                    aria-label="Nieprzeczytane"
                  />
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-6 text-[12px] text-[var(--text-faint)]">
        Powiadomienia nie przychodzą mailem. Kolejne wiadomości w tej samej
        rozmowie podmieniają jeden wpis, zamiast zapychać listę.
      </p>
    </div>
  );
}
