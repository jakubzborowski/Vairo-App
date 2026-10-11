import type { SupabaseClient } from "@supabase/supabase-js";

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
  "goal_assigned",
  "task_assigned",
  "goal_blocked",
  "goal_due",
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
  profiles: { full_name: string | null; avatar_url: string | null } | null;
  startups: { name: string } | null;
};

export async function loadNotifications(
  supabase: SupabaseClient,
  userId: string
): Promise<{ notifications: AppNotification[]; error: string | null }> {
  const { data, error } = await supabase
    .from("notifications")
    // Dwa klucze obce do `profiles` (odbiorca i sprawca), więc embed trzeba
    // wskazać nazwą ograniczenia — inaczej PostgREST odmawia.
    .select(
      "id, kind, href, preview, read_at, created_at, actor_id, startup_id, " +
        "profiles!notifications_actor_id_fkey(full_name, avatar_url), " +
        "startups(name)"
    )
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    if (error.message.includes("notifications")) {
      return {
        notifications: [],
        error:
          "Brakuje migracji 013 — odpal ją w Supabase → SQL Editor, a powiadomienia zaczną działać.",
      };
    }
    return { notifications: [], error: error.message };
  }

  const notifications = (data as unknown as Row[]).map((row) => {
    const actorName = row.profiles?.full_name ?? null;
    const startupName = row.startups?.name ?? null;

    return {
      id: row.id,
      kind: row.kind,
      href: row.href,
      preview: row.preview,
      createdAt: row.created_at,
      isRead: row.read_at !== null,
      actorName,
      actorAvatarUrl: row.profiles?.avatar_url ?? null,
      startupName,
      title: describe(row.kind, actorName, startupName),
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
 */
function describe(
  kind: NotificationKind,
  actor: string | null,
  startup: string | null
) {
  const who = actor ?? "Ktoś";
  const team = startup ?? "teamu";

  switch (kind) {
    case "contact_received":
      return `${who} chce się z Tobą skontaktować`;
    case "contact_accepted":
      return `Kontakt z ${who} nawiązany — możecie rozmawiać`;
    case "message_received":
      return `Nowa wiadomość od ${who}`;
    case "join_application":
      return `${who} chce dołączyć do ${team}`;
    case "join_invite":
      return `${who} zaprasza Cię do ${team}`;
    case "join_accepted":
      return `Jesteś w ${team}`;
    case "join_declined":
      return `Zgłoszenie do ${team} zostało odrzucone`;
    case "goal_assigned":
      return `${who} przypisał Ci cel w ${team}`;
    case "task_assigned":
      return `${who} przypisał Ci zadanie w ${team}`;
    case "goal_blocked":
      return `Przeszkoda przy celu w ${team}`;
    case "goal_due":
      return `Zbliża się termin celu w ${team}`;
    default:
      return "Nowe zdarzenie";
  }
}

/** „5 min", „2 godz.", „wczoraj", potem data. */
export function formatAge(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "teraz";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} godz.`;
  if (hours < 48) return "wczoraj";

  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}
