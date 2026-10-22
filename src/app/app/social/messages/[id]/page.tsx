import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { loadConversation } from "@/lib/messages";
import { MessageThread } from "@/components/social/message-thread";
import { Avatar } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export const metadata = { title: "Rozmowa — Vairo" };

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) redirect(`/register?next=/app/social/messages/${id}`);

  // RLS nie wpuści nikogo poza uczestnikami, więc brak wiersza znaczy
  // „nie Twoja rozmowa" — i to jest po prostu 404.
  const conversation = await loadConversation(supabase, id, user.id);
  if (!conversation) notFound();

  const otherName = conversation.other.name?.trim().split(/\s+/)[0] ?? "tej osoby";

  return (
    <div className="w-full">
      {/* Powrót do listy tylko na telefonie — na szerokim ekranie lista stoi
          po lewej i link do niej byłby linkiem do tego, co widać. */}
      <Link
        href="/app/social/messages"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-[var(--text-subtle)] transition-colors hover:text-white md:hidden"
      >
        <ArrowLeft className="size-4" />
        Wszystkie rozmowy
      </Link>

      <header className="mb-4 flex items-start gap-3.5 rounded-2xl border border-white/[0.07] bg-[var(--surface)] px-4 py-3.5">
        <Avatar
          src={conversation.other.avatarUrl}
          name={conversation.other.name}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/app/social/people/${conversation.other.id}`}
            className="font-heading text-[19px] font-semibold text-white underline-offset-2 hover:underline"
          >
            {conversation.other.name ?? "Bez imienia"}
          </Link>
          {conversation.other.headline ? (
            <p className="mt-0.5 text-[13px] text-[var(--text-subtle)]">
              {conversation.other.headline}
            </p>
          ) : null}
          {/* Skąd ta rozmowa — rozmowa powstaje dopiero po przyjęciu zaczepki,
              więc pierwsza wiadomość to dzień, w którym się zaczęła. */}
          {conversation.messages[0] ? (
            <p className="mt-0.5 text-[12.5px] text-[var(--text-subtle)]">
              Rozmowa od{" "}
              {new Date(conversation.messages[0].createdAt).toLocaleDateString("pl-PL", {
                day: "numeric",
                month: "long",
              })}
            </p>
          ) : null}
          {conversation.contextStartupName ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] text-[var(--text-muted)]">
              <Building2 className="size-3.5" />
              Rozmowa w sprawie {conversation.contextStartupName}
            </p>
          ) : null}
        </div>
        <Link
          href={`/app/social/people/${conversation.other.id}`}
          className="hidden h-9 shrink-0 items-center rounded-xl bg-[var(--surface-2)] px-3 text-[13px] text-[var(--text-muted)] transition-colors hover:text-white sm:inline-flex"
        >
          Zobacz profil
        </Link>
      </header>

      <MessageThread
        conversationId={conversation.id}
        viewerId={user.id}
        messages={conversation.messages}
        otherName={otherName}
        otherFullName={conversation.other.name}
        otherAvatarUrl={conversation.other.avatarUrl}
      />
    </div>
  );
}
