import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  JoinDirection,
  JoinRequest,
  JoinStatus,
  PublicProfile,
  PublicStartup,
} from "@/types/social";
import type { StartupRole } from "@/types/startup";

/**
 * Odczyt warstwy Social.
 *
 * Wszystko, co dotyczy obcych osób i obcych teamów, idzie przez widoki
 * `public_profiles` i `public_startups` (migracja 009). To jedyne miejsce,
 * w którym dane wychodzą poza team — dzięki temu nie ma ryzyka, że gdzieś
 * pojawi się `select *` na `profiles` i wyciekną e-maile albo prywatny opis
 * pomysłu.
 */

const PROFILE_COLUMNS =
  "id, full_name, avatar_url, headline, weekly_focus, weekly_focus_updated_at, " +
  "location, looking_for, weekly_hours, onboarding_path, created_at, " +
  "team_count, skills, skill_slugs";

const STARTUP_COLUMNS =
  "id, name, logo_url, public_tagline, public_description, location, website_url, " +
  "created_at, member_count, stage_label, categories, tags, open_roles, members, " +
  "category_keys, tag_slugs, open_role_count";

export type PeopleFilters = {
  q?: string;
  skillSlug?: string;
  lookingFor?: string;
  /** Pokazuj tylko osoby, które mają jeszcze miejsce na kolejny team. */
  withRoom?: boolean;
};

export type TeamFilters = {
  q?: string;
  category?: string;
  tagSlug?: string;
  /** Tylko teamy, które mają otwarte role. */
  hiringOnly?: boolean;
};

export async function discoverPeople(
  supabase: SupabaseClient,
  filters: PeopleFilters,
  excludeIds: string[] = []
): Promise<{ people: PublicProfile[]; error: string | null }> {
  let query = supabase
    .from("public_profiles")
    .select(PROFILE_COLUMNS)
    .order("weekly_focus_updated_at", { ascending: false, nullsFirst: false })
    .limit(60);

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }
  if (filters.q) {
    const term = `%${escapeLike(filters.q)}%`;
    query = query.or(
      `full_name.ilike.${term},headline.ilike.${term},weekly_focus.ilike.${term}`
    );
  }
  if (filters.skillSlug) {
    query = query.overlaps("skill_slugs", [filters.skillSlug]);
  }
  if (filters.lookingFor) {
    query = query.eq("looking_for", filters.lookingFor);
  }
  if (filters.withRoom) {
    query = query.lt("team_count", 3);
  }

  const { data, error } = await query;
  if (error) return { people: [], error: describeMissing(error.message) };
  return { people: (data ?? []) as unknown as PublicProfile[], error: null };
}

export async function discoverTeams(
  supabase: SupabaseClient,
  filters: TeamFilters,
  excludeIds: string[] = []
): Promise<{ teams: PublicStartup[]; error: string | null }> {
  let query = supabase
    .from("public_startups")
    .select(STARTUP_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(60);

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }
  if (filters.q) {
    const term = `%${escapeLike(filters.q)}%`;
    query = query.or(
      `name.ilike.${term},public_tagline.ilike.${term},public_description.ilike.${term}`
    );
  }
  if (filters.category) {
    query = query.overlaps("category_keys", [filters.category]);
  }
  if (filters.tagSlug) {
    query = query.overlaps("tag_slugs", [filters.tagSlug]);
  }
  if (filters.hiringOnly) {
    query = query.gt("open_role_count", 0);
  }

  const { data, error } = await query;
  if (error) return { teams: [], error: describeMissing(error.message) };
  return { teams: (data ?? []) as unknown as PublicStartup[], error: null };
}

export async function getPublicProfile(
  supabase: SupabaseClient,
  profileId: string
): Promise<PublicProfile | null> {
  const { data } = await supabase
    .from("public_profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", profileId)
    .maybeSingle();

  return (data as unknown as PublicProfile) ?? null;
}

export async function getPublicStartup(
  supabase: SupabaseClient,
  startupId: string
): Promise<PublicStartup | null> {
  const { data } = await supabase
    .from("public_startups")
    .select(STARTUP_COLUMNS)
    .eq("id", startupId)
    .maybeSingle();

  return (data as unknown as PublicStartup) ?? null;
}

export type TeamMember = {
  profileId: string;
  role: StartupRole;
  jobTitle: string | null;
  joinedAt: string;
  fullName: string | null;
  avatarUrl: string | null;
  headline: string | null;
  email: string | null;
  skills: string[];
};

/**
 * Skład teamu. Pełne dane (w tym e-mail) — RLS wpuszcza tu tylko osoby
 * z tego samego startupu.
 */
export async function getTeamMembers(
  supabase: SupabaseClient,
  startupId: string
): Promise<TeamMember[]> {
  const { data: rows, error } = await supabase
    .from("startup_members")
    .select(
      "profile_id, role, job_title, joined_at, " +
        "profiles(full_name, avatar_url, headline, email)"
    )
    .eq("startup_id", startupId)
    .order("joined_at", { ascending: true });

  if (error || !rows) return [];

  type Row = {
    profile_id: string;
    role: StartupRole;
    job_title: string | null;
    joined_at: string;
    profiles: {
      full_name: string | null;
      avatar_url: string | null;
      headline: string | null;
      email: string | null;
    } | null;
  };

  const list = rows as unknown as Row[];
  const ids = list.map((row) => row.profile_id);
  const skillsByProfile = new Map<string, string[]>();

  if (ids.length > 0) {
    const { data: skillRows } = await supabase
      .from("profile_skills")
      .select("profile_id, skills(label)")
      .in("profile_id", ids);

    type SkillRow = { profile_id: string; skills: { label: string } | null };
    for (const row of (skillRows ?? []) as unknown as SkillRow[]) {
      if (!row.skills) continue;
      const list = skillsByProfile.get(row.profile_id) ?? [];
      list.push(row.skills.label);
      skillsByProfile.set(row.profile_id, list);
    }
  }

  return list.map((row) => ({
    profileId: row.profile_id,
    role: row.role,
    jobTitle: row.job_title,
    joinedAt: row.joined_at,
    fullName: row.profiles?.full_name ?? null,
    avatarUrl: row.profiles?.avatar_url ?? null,
    headline: row.profiles?.headline ?? null,
    email: row.profiles?.email ?? null,
    skills: (skillsByProfile.get(row.profile_id) ?? []).sort(),
  }));
}

export type OpenRole = {
  id: string;
  title: string;
  description: string | null;
  weeklyHours: number | null;
  isOpen: boolean;
  createdAt: string;
};

export async function getOpenRoles(
  supabase: SupabaseClient,
  startupId: string
): Promise<OpenRole[]> {
  const { data } = await supabase
    .from("startup_open_roles")
    .select("id, title, description, weekly_hours, is_open, created_at")
    .eq("startup_id", startupId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    weeklyHours: row.weekly_hours as number | null,
    isOpen: row.is_open as boolean,
    createdAt: row.created_at as string,
  }));
}

type RequestRow = {
  id: string;
  startup_id: string;
  profile_id: string;
  direction: JoinDirection;
  status: JoinStatus;
  message: string | null;
  job_title: string | null;
  proposed_role: "admin" | "member";
  created_at: string;
  created_by: string;
  startups: { name: string; logo_url: string | null } | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  } | null;
  startup_open_roles: { title: string } | null;
};

/**
 * `startup_join_requests` ma trzy klucze obce do `profiles` (profile_id,
 * created_by, responded_by), wiec sam `profiles(...)` jest dla PostgREST
 * niejednoznaczny i konczy sie bledem. Wskazujemy relacje po nazwie
 * ograniczenia — chodzi o osobe, ktorej prosba dotyczy.
 */
const REQUEST_COLUMNS =
  "id, startup_id, profile_id, direction, status, message, job_title, " +
  "proposed_role, created_at, created_by, " +
  "startups(name, logo_url), " +
  "profiles!startup_join_requests_profile_id_fkey(full_name, avatar_url, headline), " +
  "startup_open_roles(title)";

/**
 * Prośby widziane oczami jednego usera.
 *
 * `manageableStartupIds` to teamy, w których user jest Founderem albo Adminem —
 * tylko w nich może odpowiadać na zgłoszenia. Bez tego zwykły członek
 * widziałby przyciski „Przyjmij" prowadzące do błędu.
 */
export async function loadJoinRequests(
  supabase: SupabaseClient,
  userId: string,
  manageableStartupIds: string[],
  status: JoinStatus | "all" = "pending"
): Promise<{ requests: JoinRequest[]; error: string | null }> {
  let query = supabase
    .from("startup_join_requests")
    .select(REQUEST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return { requests: [], error: describeMissing(error.message) };

  const manageable = new Set(manageableStartupIds);

  const requests = (data as unknown as RequestRow[]).map((row) => {
    const isManager = manageable.has(row.startup_id);
    const isPending = row.status === "pending";

    return {
      id: row.id,
      startupId: row.startup_id,
      startupName: row.startups?.name ?? "Team",
      startupLogoUrl: row.startups?.logo_url ?? null,
      profileId: row.profile_id,
      profileName: row.profiles?.full_name ?? null,
      profileAvatarUrl: row.profiles?.avatar_url ?? null,
      profileHeadline: row.profiles?.headline ?? null,
      direction: row.direction,
      status: row.status,
      message: row.message,
      jobTitle: row.job_title,
      proposedRole: row.proposed_role,
      openRoleTitle: row.startup_open_roles?.title ?? null,
      createdAt: row.created_at,
      createdBy: row.created_by,
      // Odpowiada zawsze druga strona rozmowy — dokładnie tak jak
      // `respond_join_request()` w bazie.
      canRespond:
        isPending &&
        (row.direction === "application"
          ? isManager
          : row.profile_id === userId),
      canWithdraw: isPending && row.created_by === userId,
    } satisfies JoinRequest;
  });

  return { requests, error: null };
}

/**
 * Osoby i teamy, ktore user juz pominal w Odkrywaj.
 *
 * Discover pokazuje jedna karte na ekran, wiec raz pominieta osoba nie moze
 * wrocic przy nastepnym wejsciu — inaczej przegladanie nie ma konca.
 * Decyzja jest prywatna i odwracalna (migracja 011).
 */
export async function loadPassedIds(
  supabase: SupabaseClient,
  userId: string
): Promise<{ people: string[]; teams: string[] }> {
  const { data, error } = await supabase
    .from("discovery_passes")
    .select("target_profile_id, target_startup_id")
    .eq("actor_id", userId)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error || !data) return { people: [], teams: [] };

  return {
    people: data
      .map((row) => row.target_profile_id as string | null)
      .filter(Boolean) as string[],
    teams: data
      .map((row) => row.target_startup_id as string | null)
      .filter(Boolean) as string[],
  };
}

/** Czy user ma już otwartą rozmowę z tym teamem (żeby nie dublować prośby). */
export async function findPendingRequest(
  supabase: SupabaseClient,
  startupId: string,
  profileId: string
) {
  const { data } = await supabase
    .from("startup_join_requests")
    .select("id, direction, status")
    .eq("startup_id", startupId)
    .eq("profile_id", profileId)
    .eq("status", "pending")
    .maybeSingle();

  return data ?? null;
}

/**
 * Dwa problemy w jednym miejscu:
 *   • `%` i `_` to znaki wieloznaczne LIKE — bez neutralizacji wpisanie `%`
 *     zwracałoby wszystkich,
 *   • przecinki i nawiasy są separatorami składni `or()` w PostgREST, więc
 *     wpisane w wyszukiwarkę rozsypałyby całe zapytanie.
 */
function escapeLike(input: string) {
  return input
    .trim()
    .replace(/[,()]/g, " ")
    .replace(/[%_\\]/g, (match) => `\\${match}`)
    .slice(0, 80);
}

function describeMissing(message: string) {
  if (
    message.includes("public_profiles") ||
    message.includes("public_startups") ||
    message.includes("startup_join_requests")
  ) {
    return "Brakuje migracji 009 — odpal ją w Supabase → SQL Editor, a Social zacznie działać.";
  }
  return message;
}
