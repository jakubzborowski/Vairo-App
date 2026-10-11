import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ChatMessage,
  ContactSignal,
  ContactStatus,
  ConversationSummary,
} from "@/types/social";

/**
 * Odczyt kontaktów i rozmów.
 *
 * Kolejność pętli: ktoś wysyła zaczepkę → druga strona ją przyjmuje albo
 * odrzuca → po przyjęciu powstaje rozmowa. Dopóki nie ma odpowiedzi, wątek
 * nie istnieje — dzięki temu skrzynka nie zapełnia się monologami.
 */

// `contact_signals` ma dwa klucze obce do `profiles`, więc embed trzeba
// wskazać nazwą ograniczenia — inaczej PostgREST zwraca błąd.
const SIGNAL_COLUMNS =
  "id, sender_id, recipient_id, status, message, created_at, context_startup_id, " +
  "sender:profiles!contact_signals_sender_id_fkey(full_name, avatar_url, headline), " +
  "recipient:profiles!contact_signals_recipient_id_fkey(full_name, avatar_url, headline), " +
  "startups(name, logo_url, public_tagline)";

type SignalRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: ContactStatus;
  message: string | null;
  created_at: string;
  context_startup_id: string | null;
  sender: { full_name: string | null; avatar_url: string | null; headline: string | null } | null;
  recipient: { full_name: string | null; avatar_url: string | null; headline: string | null } | null;
  startups: {
    name: string;
    logo_url: string | null;
    public_tagline: string | null;
  } | null;
};

type PartnerCard = {
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
};

/**
 * Wizytówki osób z drugiej strony rozmowy.
 *
 * Polityka RLS na `profiles` wpuszcza do pełnego wiersza wyłącznie siebie,
 * kolegów z teamu i kandydatów do własnego teamu — bo w tym wierszu jest
 * e-mail. Cała warstwa Social działa POZA teamem, więc przy rozmowie z kimś
 * poznanym w Odkrywaj embed `profiles(...)` zwracał NULL i czat pokazywał
 * „Bez imienia" mimo że obie osoby miały uzupełnione profile.
 *
 * Widok `contact_profiles` (migracja 019) wystawia cztery kolumny i tylko tym,
 * z którymi łączy Cię zaczepka albo rozmowa. Braku migracji nie traktujemy
 * jak błędu: wtedy zostaje to, co dał embed, czyli dotychczasowe zachowanie.
 */
async function loadPartnerCards(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Map<string, PartnerCard>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase
    .from("contact_profiles")
    .select("id, full_name, avatar_url, headline")
    .in("id", unique);

  if (error) return new Map();

  return new Map(
    ((data ?? []) as unknown as ({ id: string } & PartnerCard)[]).map((row) => [
      row.id,
      { full_name: row.full_name, avatar_url: row.avatar_url, headline: row.headline },
    ])
  );
}

export async function loadContactSignals(
  supabase: SupabaseClient,
  userId: string
): Promise<{ signals: ContactSignal[]; error: string | null }> {
  const { data, error } = await supabase
    .from("contact_signals")
    .select(SIGNAL_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return { signals: [], error: describeMissing(error.message) };

  const rows = data as unknown as SignalRow[];
  const cards = await loadPartnerCards(
    supabase,
    rows.map((row) => (row.recipient_id === userId ? row.sender_id : row.recipient_id))
  );

  const signals = rows.map((row) => {
    const incoming = row.recipient_id === userId;
    const otherId = incoming ? row.sender_id : row.recipient_id;
    const other = (incoming ? row.sender : row.recipient) ?? cards.get(otherId) ?? null;

    return {
      id: row.id,
      senderId: row.sender_id,
      recipientId: row.recipient_id,
      status: row.status,
      message: row.message,
      createdAt: row.created_at,
      contextStartupId: row.context_startup_id,
      contextStartupName: row.startups?.name ?? null,
      contextStartupLogoUrl: row.startups?.logo_url ?? null,
      contextStartupTagline: row.startups?.public_tagline ?? null,
      otherId,
      otherName: other?.full_name ?? null,
      otherAvatarUrl: other?.avatar_url ?? null,
      otherHeadline: other?.headline ?? null,
      canRespond: row.status === "pending" && incoming,
      canWithdraw: row.status === "pending" && !incoming,
    } satisfies ContactSignal;
  });

  return { signals, error: null };
}

export async function loadConversations(
  supabase: SupabaseClient,
  userId: string
): Promise<{ conversations: ConversationSummary[]; error: string | null }> {
  const { data: overview, error } = await supabase
    .from("conversation_overview")
    .select(
      "conversation_id, last_message_at, unread_count, last_body, last_sender_id, " +
        "context_startup_id"
    )
    .eq("profile_id", userId)
    .order("last_message_at", { ascending: false })
    .limit(100);

  if (error) return { conversations: [], error: describeMissing(error.message) };

  type OverviewRow = {
    conversation_id: string;
    last_message_at: string;
    unread_count: number;
    last_body: string | null;
    last_sender_id: string | null;
    context_startup_id: string | null;
  };

  const rows = (overview ?? []) as unknown as OverviewRow[];
  if (rows.length === 0) return { conversations: [], error: null };

  const ids = rows.map((row) => row.conversation_id);

  const contextIds = [
    ...new Set(rows.map((row) => row.context_startup_id).filter(Boolean) as string[]),
  ];

  const [{ data: others }, startupsResult] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("conversation_id, profile_id, profiles(full_name, avatar_url)")
      .in("conversation_id", ids)
      .neq("profile_id", userId),
    contextIds.length > 0
      ? supabase.from("startups").select("id, name").in("id", contextIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const startups = startupsResult.data;

  type OtherRow = {
    conversation_id: string;
    profile_id: string;
    profiles: { full_name: string | null; avatar_url: string | null } | null;
  };

  const otherByConversation = new Map<string, OtherRow>();
  for (const row of (others ?? []) as unknown as OtherRow[]) {
    otherByConversation.set(row.conversation_id, row);
  }

  // Rozmówca spoza teamu nie przechodzi przez RLS na `profiles`, więc embed
  // wyżej zwraca dla niego NULL. Wizytówkę dobieramy z `contact_profiles`.
  const cards = await loadPartnerCards(
    supabase,
    [...otherByConversation.values()].map((row) => row.profile_id)
  );

  const startupNames = new Map<string, string>();
  for (const row of startups ?? []) {
    startupNames.set(row.id as string, row.name as string);
  }

  const conversations = rows.map((row) => {
    const other = otherByConversation.get(row.conversation_id);
    const card = other ? (other.profiles ?? cards.get(other.profile_id) ?? null) : null;

    return {
      id: row.conversation_id,
      otherId: other?.profile_id ?? "",
      otherName: card?.full_name ?? null,
      otherAvatarUrl: card?.avatar_url ?? null,
      contextStartupName: row.context_startup_id
        ? (startupNames.get(row.context_startup_id) ?? null)
        : null,
      lastBody: row.last_body,
      lastFromMe: row.last_sender_id === userId,
      lastMessageAt: row.last_message_at,
      unreadCount: Number(row.unread_count ?? 0),
    } satisfies ConversationSummary;
  });

  return { conversations, error: null };
}

export async function loadConversation(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string
) {
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, context_startup_id, startups(name)")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) return null;

  const [{ data: participants }, { data: messageRows }] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("profile_id, profiles(full_name, avatar_url, headline)")
      .eq("conversation_id", conversationId),
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(500),
  ]);

  type ParticipantRow = {
    profile_id: string;
    profiles: {
      full_name: string | null;
      avatar_url: string | null;
      headline: string | null;
    } | null;
  };

  const other = ((participants ?? []) as unknown as ParticipantRow[]).find(
    (row) => row.profile_id !== userId
  );

  const card =
    other?.profiles ??
    (other ? ((await loadPartnerCards(supabase, [other.profile_id])).get(other.profile_id) ?? null) : null);

  const messages: ChatMessage[] = (messageRows ?? []).map((row) => ({
    id: row.id as string,
    senderId: row.sender_id as string,
    body: row.body as string,
    createdAt: row.created_at as string,
  }));

  return {
    id: conversationId,
    contextStartupName:
      (conversation.startups as unknown as { name: string } | null)?.name ?? null,
    other: {
      id: other?.profile_id ?? "",
      name: card?.full_name ?? null,
      avatarUrl: card?.avatar_url ?? null,
      headline: card?.headline ?? null,
    },
    messages,
  };
}

/**
 * Z kim user już rozmawia: profileId → conversationId.
 *
 * Odkrywaj używa tego, żeby przy osobie, z którą wątek już istnieje, pokazać
 * „Otwórz rozmowę" zamiast formularza nowej zaczepki.
 */
export async function loadConversationPartners(
  supabase: SupabaseClient,
  userId: string
): Promise<Record<string, string>> {
  const { data: mine } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("profile_id", userId)
    .limit(300);

  const ids = (mine ?? []).map((row) => row.conversation_id as string);
  if (ids.length === 0) return {};

  const { data: others } = await supabase
    .from("conversation_participants")
    .select("conversation_id, profile_id")
    .in("conversation_id", ids)
    .neq("profile_id", userId);

  const map: Record<string, string> = {};
  for (const row of others ?? []) {
    map[row.profile_id as string] = row.conversation_id as string;
  }
  return map;
}

/** Licznik przy „Wiadomości" w nawigacji. */
export async function countUnreadMessages(
  supabase: SupabaseClient,
  userId: string
) {
  const { data } = await supabase
    .from("conversation_overview")
    .select("unread_count")
    .eq("profile_id", userId)
    .gt("unread_count", 0)
    .limit(200);

  const rows = (data ?? []) as unknown as { unread_count: number }[];
  return rows.reduce((sum, row) => sum + Number(row.unread_count ?? 0), 0);
}

/** Licznik przy „Kontakty" — zaczepki czekające na odpowiedź usera. */
export async function countPendingSignals(
  supabase: SupabaseClient,
  userId: string
) {
  const { count } = await supabase
    .from("contact_signals")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("status", "pending");

  return count ?? 0;
}

function describeMissing(message: string) {
  if (
    message.includes("contact_signals") ||
    message.includes("conversation_overview") ||
    message.includes("conversations")
  ) {
    return "Brakuje migracji 012 — odpal ją w Supabase → SQL Editor, a kontakt i wiadomości zaczną działać.";
  }
  return message;
}
