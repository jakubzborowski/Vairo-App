import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Compass, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadConversations } from "@/lib/messages";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export const metadata = { title: "Wiadomości — Vairo" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/register?next=/app/social/messages");

  const { conversations, error } = await loadConversations(supabase, user.id);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header>
        <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
          Wiadomości
        </h1>
        <p className="mt-1 text-[14px] text-[var(--text-subtle)]">
          Rozmowy z osobami, które przyjęły kontakt.
        </p>
      </header>

      {error ? (
        <p className="mt-5 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/8 px-4 py-3 text-[13px] text-[var(--warning)]">
          {error}
        </p>
      ) : null}

      {!error && conversations.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={MessageSquare}
            title="Nie masz jeszcze żadnej rozmowy"
            description="Rozmowa powstaje, gdy ktoś przyjmie Twoją zaczepkę albo Ty przyjmiesz cudzą. Zacznij od Odkrywaj."
            action={
              <>
                <Button href="/app/social/discover?tab=people" variant="secondary">
                  <Compass className="size-4" />
                  Znajdź ludzi
                </Button>
                <Button href="/app/social/invites" variant="ghost">
                  Zobacz zaproszenia
                </Button>
              </>
            }
          />
        </div>
      ) : null}

      {conversations.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-2">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link
                href={`/app/social/messages/${conversation.id}`}
                className={cn(
                  "flex items-start gap-3.5 rounded-2xl border px-4 py-3.5 transition-colors",
                  conversation.unreadCount > 0
                    ? "border-[var(--vairo)]/30 bg-[var(--vairo)]/6"
                    : "border-white/[0.07] bg-[var(--surface)] hover:border-white/15"
                )}
              >
                <Avatar
                  src={conversation.otherAvatarUrl}
                  name={conversation.otherName}
                  size="md"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[14.5px] font-medium text-white">
                      {conversation.otherName ?? "Bez imienia"}
                    </p>
                    <span className="tabular shrink-0 text-[11.5px] text-[var(--text-faint)]">
                      {formatWhen(conversation.lastMessageAt)}
                    </span>
                  </div>

                  {conversation.contextStartupName ? (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] text-[var(--vairo)]">
                      <Building2 className="size-3" />
                      w sprawie {conversation.contextStartupName}
                    </p>
                  ) : null}

                  <p
                    className={cn(
                      "mt-1 truncate text-[13px]",
                      conversation.unreadCount > 0
                        ? "text-white"
                        : "text-[var(--text-subtle)]"
                    )}
                  >
                    {conversation.lastFromMe ? "Ty: " : ""}
                    {conversation.lastBody ?? "Brak wiadomości"}
                  </p>
                </div>

                {conversation.unreadCount > 0 ? (
                  <span className="tabular mt-0.5 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--vairo)] px-1.5 text-[11px] font-semibold text-white">
                    {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** „14:32" dla dzisiaj, „wczoraj", potem data — bez bibliotek. */
function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "wczoraj";

  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}
