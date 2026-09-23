import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadConversation } from "@/lib/messages";
import { MessageThread } from "@/components/social/message-thread";
import { Avatar } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/register?next=/app/social/messages/${id}`);

  // RLS nie wpuści nikogo poza uczestnikami, więc brak wiersza znaczy
  // „nie Twoja rozmowa" — i to jest po prostu 404.
  const conversation = await loadConversation(supabase, id, user.id);
  if (!conversation) notFound();

  const otherName = conversation.other.name?.trim().split(/\s+/)[0] ?? "tej osoby";

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/app/social/messages"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[var(--text-subtle)] transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Wszystkie rozmowy
      </Link>

      <header className="mb-4 flex items-start gap-3.5">
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
          {conversation.contextStartupName ? (
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-[var(--vairo)]/12 px-2 py-0.5 text-[12px] text-[var(--vairo)]">
              <Building2 className="size-3" />
              Rozmowa w sprawie {conversation.contextStartupName}
            </p>
          ) : null}
        </div>
      </header>

      <MessageThread
        conversationId={conversation.id}
        viewerId={user.id}
        messages={conversation.messages}
        otherName={otherName}
      />
    </div>
  );
}
