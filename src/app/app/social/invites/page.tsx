import Link from "next/link";
import { redirect } from "next/navigation";
import { Compass, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserStartups } from "@/lib/startup";
import { loadJoinRequests } from "@/lib/social";
import { loadContactSignals, loadConversationPartners } from "@/lib/messages";
import { InboxRow } from "@/components/social/inbox-row";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { canManageTeam } from "@/types/startup";
import type { ContactSignal, JoinRequest } from "@/types/social";

export const metadata = { title: "Zaproszenia — Vairo" };
export const dynamic = "force-dynamic";

type Tab = "waiting" | "sent" | "closed";

/**
 * Jedna skrzynka na wszystko, co czeka na decyzję — w układzie listy zgłoszeń,
 * a nie stosu kart.
 *
 * Wcześniej ten ekran miał cztery sekcje, każda z nagłówkiem i zdaniem
 * wyjaśniającym, a w środku karty po 150 px. Cztery sprawy dawały ekran, przez
 * który trzeba było przewijać, żeby się dowiedzieć, że są cztery. Skrzynka ma
 * odpowiadać na jedno pytanie — **ile rzeczy czeka na mój ruch** — i musi to
 * robić w pierwszej sekundzie.
 *
 * Stąd układ, który każdy zna z listy zgłoszeń na GitHubie: zakładki z licznikiem
 * u góry, pod nimi jeden kontener z wierszami. Podział na „czeka / wysłane /
 * zakończone" siedzi w zakładkach, nie w czterech nagłówkach jeden pod drugim —
 * bo w danym momencie interesuje tylko jeden z tych trzech stanów.
 */
export default async function InvitesPage({
  searchParams,
}: {
  searchParams: Promise<{ stan?: string }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/register?next=/app/social/invites");

  const startups = await getUserStartups(supabase, user.id);
  const manageableIds = startups
    .filter((startup) => canManageTeam(startup.role))
    .map((startup) => startup.id);

  const [
    { requests, error: requestsError },
    { signals, error: signalsError },
    conversationByProfile,
  ] = await Promise.all([
    loadJoinRequests(supabase, user.id, manageableIds, "all"),
    loadContactSignals(supabase, user.id),
    loadConversationPartners(supabase, user.id),
  ]);

  const error = requestsError ?? signalsError;

  const waiting = [
    ...signals.filter((item) => item.canRespond),
    ...requests.filter((item) => item.canRespond),
  ];
  const sent = [
    ...signals.filter((item) => item.canWithdraw),
    ...requests.filter((item) => item.status === "pending" && item.canWithdraw),
  ];
  const closed = [
    ...signals.filter((item) => item.status === "accepted" || item.status === "declined" || item.status === "withdrawn"),
    ...requests.filter((item) => item.status !== "pending"),
  ].filter((item) => !waiting.includes(item) && !sent.includes(item));

  // Domyślnie otwieramy zakładkę, w której coś jest — wejście na pustą listę
  // wygląda jak awaria, nawet gdy obok świeci licznik.
  const requested = (["waiting", "sent", "closed"] as const).find(
    (value) => value === params.stan
  );
  const tab: Tab =
    requested ?? (waiting.length > 0 ? "waiting" : sent.length > 0 ? "sent" : "closed");

  const rows = tab === "waiting" ? waiting : tab === "sent" ? sent : closed;
  const isEmpty = requests.length === 0 && signals.length === 0;

  return (
    <div className="page">
      <header>
        <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
          Zaproszenia
        </h1>
        <p className="mt-1 text-[14px] text-[var(--text-subtle)]">
          Zaczepki od ludzi i sprawy członkostwa w teamach.
        </p>
      </header>

      {error ? (
        <p className="mt-5 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/8 px-4 py-3 text-[13px] text-[var(--warning)]">
          {error}
        </p>
      ) : null}

      {!error && isEmpty ? (
        <div className="mt-6">
          <EmptyState
            icon={Inbox}
            title="Tu jeszcze pusto"
            description="Pojawią się tutaj zaczepki od innych osób i sprawy Twoich teamów. Pierwszy krok możesz zrobić sam."
            action={
              <Button href="/app/social/discover" variant="secondary">
                <Compass className="size-4" />
                Odkrywaj
              </Button>
            }
          />
        </div>
      ) : null}

      {!isEmpty ? (
        <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.07] bg-[var(--surface)]">
          <nav className="flex items-center gap-1 border-b border-white/[0.07] px-2 py-2">
            {/* Na telefonie „Czeka na Ciebie" łamało się na dwie linijki
                i rozpychało cały pasek zakładek. Druga część etykiety znika
                poniżej `sm` — „Czeka" niesie to samo. */}
            <TabLink href="/app/social/invites?stan=waiting" active={tab === "waiting"}>
              Czeka<span className="hidden sm:inline">&nbsp;na Ciebie</span>
              <Count value={waiting.length} highlight />
            </TabLink>
            <TabLink href="/app/social/invites?stan=sent" active={tab === "sent"}>
              Wysłane
              <Count value={sent.length} />
            </TabLink>
            <TabLink href="/app/social/invites?stan=closed" active={tab === "closed"}>
              Zakończone
              <Count value={closed.length} />
            </TabLink>
          </nav>

          {rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-[var(--text-subtle)]">
              {tab === "waiting"
                ? "Nic nie czeka na Twoją odpowiedź."
                : tab === "sent"
                  ? "Nie masz otwartych zgłoszeń ani zaproszeń."
                  : "Nic się jeszcze nie zakończyło."}
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {rows.map((item) =>
                isRequest(item) ? (
                  <InboxRow key={item.id} kind="request" request={item} />
                ) : (
                  <InboxRow
                    key={item.id}
                    kind="signal"
                    signal={item}
                    conversationId={conversationByProfile[item.otherId] ?? null}
                  />
                )
              )}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** `direction` mają tylko prośby o dołączenie — to wystarczy, żeby je odróżnić. */
function isRequest(item: JoinRequest | ContactSignal): item is JoinRequest {
  return "direction" in item;
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
        active
          ? "bg-white/[0.07] text-white"
          : "text-[var(--text-subtle)] hover:text-white"
      )}
    >
      {children}
    </Link>
  );
}

function Count({ value, highlight }: { value: number; highlight?: boolean }) {
  if (value === 0) return null;
  return (
    <span
      className={cn(
        "tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
        highlight
          ? "bg-[var(--vairo)] text-white"
          : "bg-white/10 text-[var(--text-muted)]"
      )}
    >
      {value}
    </span>
  );
}
