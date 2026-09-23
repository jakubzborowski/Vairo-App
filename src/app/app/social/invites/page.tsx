import { redirect } from "next/navigation";
import { Compass, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserStartups } from "@/lib/startup";
import { loadJoinRequests } from "@/lib/social";
import { loadContactSignals, loadConversationPartners } from "@/lib/messages";
import { ContactCard } from "@/components/social/contact-card";
import { RequestCard } from "@/components/social/request-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { canManageTeam } from "@/types/startup";

export const metadata = { title: "Zaproszenia — Vairo" };
export const dynamic = "force-dynamic";

/**
 * Jedna skrzynka na wszystko, co czeka na decyzję użytkownika.
 *
 * Wcześniej to były dwa osobne ekrany z dwoma licznikami: „Kontakty"
 * (zaczepki od ludzi) i „Zaproszenia" (członkostwo w teamie). Dla kogoś, kto
 * pierwszy raz widzi tę aplikację, obie nazwy znaczyły to samo — „ktoś czegoś
 * ode mnie chce". Rozdział został w treści kart, nie w nawigacji.
 */
export default async function InvitesPage() {
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

  const waitingRequests = requests.filter((item) => item.canRespond);
  const waitingSignals = signals.filter((item) => item.canRespond);

  const sentRequests = requests.filter(
    (item) => item.status === "pending" && item.canWithdraw
  );
  const sentSignals = signals.filter((item) => item.canWithdraw);

  const connected = signals.filter((item) => item.status === "accepted");

  const history = [
    ...requests.filter((item) => item.status !== "pending"),
    ...signals.filter(
      (item) => item.status === "declined" || item.status === "withdrawn"
    ),
  ];

  const waitingCount = waitingRequests.length + waitingSignals.length;
  const isEmpty = requests.length === 0 && signals.length === 0;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header>
        <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
          Zaproszenia
        </h1>
        <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-[var(--text-subtle)]">
          Wszystko, co czeka na Twoją odpowiedź: ludzie, którzy chcą się odezwać,
          i sprawy związane z członkostwem w teamach.
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
            description="Pojawią się tutaj zaczepki od innych osób i sprawy Twoich teamów. Nie musisz czekać — pierwszy krok możesz zrobić sam."
            action={
              <Button href="/app/social/discover" variant="secondary">
                <Compass className="size-4" />
                Odkrywaj
              </Button>
            }
          />
        </div>
      ) : null}

      {waitingCount > 0 ? (
        <Section
          title={`Czeka na Twoją decyzję (${waitingCount})`}
          description="Dopóki nie odpowiesz, druga strona czeka."
        >
          {waitingSignals.map((signal) => (
            <ContactCard key={signal.id} signal={signal} />
          ))}
          {waitingRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </Section>
      ) : null}

      {connected.length > 0 ? (
        <Section
          title="Nawiązane kontakty"
          description="Możesz wrócić do każdej z tych rozmów."
        >
          {connected.map((signal) => (
            <ContactCard
              key={signal.id}
              signal={signal}
              conversationId={conversationByProfile[signal.otherId] ?? null}
            />
          ))}
        </Section>
      ) : null}

      {sentSignals.length + sentRequests.length > 0 ? (
        <Section
          title="Wysłane"
          description="Czekają na odpowiedź. Możesz je wycofać."
        >
          {sentSignals.map((signal) => (
            <ContactCard key={signal.id} signal={signal} />
          ))}
          {sentRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </Section>
      ) : null}

      {history.length > 0 ? (
        <Section title="Historia" description="Sprawy, które już się zakończyły.">
          {history.map((item) =>
            "direction" in item ? (
              <RequestCard key={item.id} request={item} />
            ) : (
              <ContactCard key={item.id} signal={item} />
            )
          )}
        </Section>
      ) : null}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-[15px] font-semibold text-white">{title}</h2>
      <p className="mt-0.5 text-[13px] text-[var(--text-subtle)]">{description}</p>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}
