import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/i18n/config";
import { formatDate } from "@/i18n/format";
import type { MessageKey } from "@/i18n/messages";
import type { Translate } from "@/i18n/translator";
import { loadPartnerCards } from "@/lib/contact-cards";

/**
 * Powiadomienia — minimum z guidelines 10.7.
 *
 * Treść składamy TUTAJ, nie w bazie. Baza trzyma `kind`, `actor_id` i `href`,
 * więc zmiana brzmienia jest zmianą jednej linijki w kodzie, a nie migracją,
 * a zmiana imienia nadawcy nie zostawia w skrzynce starej wersji.
 */

export const NOTIFICATION_KINDS = [
  "contact_received",
  "contact_accepted",
  "message_received",
  "join_application",
  "join_invite",
  "join_accepted",
  "join_declined",
  // Odpowiedź na zaproszenie wysłane przez zespół (migracja 054). Odbiorcą
  // jest zapraszający, więc zdanie mówi o osobie zaproszonej.
  "invite_accepted",
  "invite_declined",
  "goal_assigned",
  "task_assigned",
  "goal_blocked",
  "goal_due",
  "invite_link_joined",
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  href: string;
  preview: string | null;
  createdAt: string;
  isRead: boolean;
  actorName: string | null;
  actorAvatarUrl: string | null;
  startupName: string | null;
  /** Gotowe zdanie do pokazania — jedno źródło brzmienia. */
  title: string;
};

type Row = {
  id: string;
  kind: NotificationKind;
  href: string;
  preview: string | null;
  read_at: string | null;
  created_at: string;
  actor_id: string | null;
  startup_id: string | null;
  profiles: {
    full_name: string | null;
    public_name: string | null;
    avatar_url: string | null;
  } | null;
  startups: { name: string } | null;
};

/**
 * Zdarzenia z warstwy Social. Ich sprawca to ktoś poznany w Odkrywaj, więc
 * podpisujemy go nazwą z karty. Przy celach i zadaniach sprawca jest
 * z teamu — tam obowiązuje imię i nazwisko z konta, jak w składzie teamu.
 */
const SOCIAL_KINDS = new Set<NotificationKind>([
  "contact_received",
  "contact_accepted",
  "message_received",
  "join_application",
  "join_invite",
  "invite_declined",
]);

export async function loadNotifications(
  supabase: SupabaseClient,
  userId: string,
  t: Translate<MessageKey<"notifications">>
): Promise<{ notifications: AppNotification[]; error: string | null }> {
  const { data, error } = await supabase
    .from("notifications")
    // Dwa klucze obce do `profiles` (odbiorca i sprawca), więc embed trzeba
    // wskazać nazwą ograniczenia — inaczej PostgREST odmawia.
    .select(
      "id, kind, href, preview, read_at, created_at, actor_id, startup_id, " +
        "profiles!notifications_actor_id_fkey(full_name, public_name, avatar_url), " +
        "startups(name)"
    )
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    if (error.message.includes("public_name")) {
      return {
        notifications: [],
        error: t("errors.migration033"),
      };
    }
    if (error.message.includes("notifications")) {
      return {
        notifications: [],
        error: t("errors.migration013"),
      };
    }
    return { notifications: [], error: error.message };
  }

  const rows = data as unknown as Row[];

  // Sprawca zdarzenia z Social to zwykle ktoś spoza zespołu, a polityka RLS
  // na `profiles` takich osób nie wpuszcza — embed zwracał NULL i powiadomienie
  // brzmiało „Nowa wiadomość od Ktoś". Wizytówka z `contact_profiles`
  // (migracja 019) niesie nazwę publiczną każdemu, z kim łączy nas zaczepka
  // albo rozmowa — tak samo jak w skrzynce i na czacie.
  const cards = await loadPartnerCards(
    supabase,
    rows
      .filter((row) => SOCIAL_KINDS.has(row.kind) && row.actor_id)
      .map((row) => row.actor_id as string)
  );

  // Zaproszenie do zespołu: odbiorca nie jest jeszcze jego członkiem, więc
  // RLS nie oddaje mu ani nazwy zespołu, ani zapraszającego. Te dwie nazwy
  // daje funkcja z migracji 054 — tylko dla próśb, które go dotyczą.
  const invites = rows.filter((row) => row.kind === "join_invite");
  const parties = new Map<string, { startup: string | null; inviter: string | null }>();
  if (invites.some((row) => !row.startups?.name || !row.profiles)) {
    const { data: partyRows, error: partyError } = await supabase.rpc("my_join_request_parties");
    if (!partyError) {
      for (const party of (partyRows ?? []) as {
        startup_id: string;
        startup_name: string | null;
        inviter_id: string | null;
        inviter_name: string | null;
      }[]) {
        if (!party.inviter_id) continue;
        parties.set(`${party.startup_id}:${party.inviter_id}`, {
          startup: party.startup_name,
          inviter: party.inviter_name?.trim() || null,
        });
      }
    }
  }

  const notifications = rows.map((row) => {
    const card = row.actor_id && SOCIAL_KINDS.has(row.kind) ? cards.get(row.actor_id) : undefined;
    const party =
      row.kind === "join_invite" ? parties.get(`${row.startup_id}:${row.actor_id}`) : undefined;
    const actorName =
      card?.full_name?.trim() ||
      (SOCIAL_KINDS.has(row.kind) ? row.profiles?.public_name?.trim() : null) ||
      row.profiles?.full_name ||
      party?.inviter ||
      null;
    const startupName = row.startups?.name ?? party?.startup ?? null;

    return {
      id: row.id,
      kind: row.kind,
      href: row.href,
      preview: row.preview,
      createdAt: row.created_at,
      isRead: row.read_at !== null,
      actorName,
      actorAvatarUrl: card?.avatar_url ?? row.profiles?.avatar_url ?? null,
      startupName,
      title: describe(t, row.kind, actorName, startupName),
    } satisfies AppNotification;
  });

  return { notifications, error: null };
}

export async function countUnreadNotifications(
  supabase: SupabaseClient,
  userId: string
) {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", userId)
    .is("read_at", null);

  return count ?? 0;
}

/**
 * Jedno zdanie, z którego widać, co się stało i kto to zrobił.
 * Bez „Nowe zdarzenie w systemie" — takie powiadomienie nic nie znaczy.
 *
 * Brzmienie siedzi w słowniku `notifications` (`describe.<kind>`), więc
 * każdy czyta powiadomienie w swoim języku — baza trzyma tylko `kind`.
 */
function describe(
  t: Translate<MessageKey<"notifications">>,
  kind: NotificationKind,
  actor: string | null,
  startup: string | null
) {
  const values = {
    who: actor ?? t("describe.someone"),
    team: startup ?? t("describe.theTeam"),
  };
  return (NOTIFICATION_KINDS as readonly string[]).includes(kind)
    ? t(`describe.${kind}`, values)
    : t("describe.default");
}

/** „5 min", „2 godz.", „wczoraj", potem data — w języku interfejsu. */
export function formatAge(t: Translate<MessageKey<"common">>, locale: Locale, iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return t("age.now");
  if (minutes < 60) return t("age.minutes", { count: minutes });

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("age.hours", { count: hours });
  if (hours < 48) return t("age.yesterday");

  return formatDate(locale, date, { day: "numeric", month: "short" });
}
