import type { SupabaseClient } from "@supabase/supabase-js";
import { loadStageTree, type StageProgramEntry } from "@/lib/stage";
import { loadOpenWork } from "@/lib/goals";
import { scoreProfile } from "@/lib/profile-completeness";
import { canEditStageData, canManageTeam } from "@/types/startup";
import type { StartupContext } from "@/types/startup";
import type { StageTree } from "@/types/stage";
import { getLocale, getT } from "@/i18n/server";
import type { Locale } from "@/i18n/config";
import { formatDate } from "@/i18n/format";
import type { MessageKey } from "@/i18n/messages";
import type { Translate } from "@/i18n/translator";

/**
 * „Co teraz" na dashboardzie.
 *
 * Guidelines wymagają, żeby dashboard odpowiadał na pięć pytań; bez tej listy
 * odpowiadał na dwa. Dla kogoś, kto pierwszy raz widzi taką aplikację, to jest
 * najważniejszy element całego ekranu — jedyne miejsce, które mówi wprost
 * „zrób to teraz", zamiast pokazywać liczniki i zostawiać z pytaniem „no i co".
 *
 * Zasady, których się tu trzymamy:
 *   • każda pozycja ma POWÓD, nie tylko polecenie,
 *   • każda prowadzi do konkretnego miejsca, nie do „modułu",
 *   • najpierw rzeczy, na które czeka drugi człowiek — te nie mogą leżeć,
 *   • maksymalnie pięć pozycji; dłuższa lista przestaje być listą zadań.
 */

export type NextAction = {
  key: string;
  title: string;
  why: string;
  href: string;
  tone: "brand" | "warning" | "neutral";
  /** Dla kogo i do kiedy — „Ty · do 24 paź", „Founder i Admin". */
  meta?: string;
};

type T = Translate<MessageKey<"dashboard">>;

function dueMeta(t: T, locale: Locale, dueDate: string | null | undefined) {
  if (!dueDate) return t("next.dueNone");
  const date = new Date(`${dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = formatDate(locale, date, { day: "numeric", month: "short" });
  return date < today ? t("next.dueOverdue", { date: day }) : t("next.dueBy", { date: day });
}

export type Blocker = { title: string; why: string; href?: string } | null;

const MAX_ACTIONS = 5;
const MAX_STAGE_ACTIONS = 3;

export async function loadNextActions(
  supabase: SupabaseClient,
  params: {
    userId: string;
    active: StartupContext;
    program: StageProgramEntry[];
    current: StageProgramEntry | null;
  }
): Promise<{ actions: NextAction[]; blocker: Blocker; tree: StageTree | null }> {
  const { userId, active, current } = params;
  const t = await getT("dashboard");
  const ts = await getT("social");
  const locale = await getLocale();
  const canEdit = canEditStageData(active.role);
  const canManage = canManageTeam(active.role);

  // Wszystko naraz: liczniki, drzewo etapu i otwarta praca nie zależą od
  // siebie, a każda fala to osobna podróż do bazy.
  const [
    { count: pendingApplications },
    { count: pendingContacts },
    { count: pendingInvites },
    { data: profileRow },
    { count: skillCount },
    tree,
    openWork,
  ] = await Promise.all([
    canManage
      ? supabase
          .from("startup_join_requests")
          .select("id", { count: "exact", head: true })
          .eq("startup_id", active.id)
          .eq("status", "pending")
          .eq("direction", "application")
      : Promise.resolve({ count: 0 }),
    supabase
      .from("contact_signals")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("status", "pending"),
    supabase
      .from("startup_join_requests")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", userId)
      .eq("direction", "invite")
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("full_name, avatar_url, headline, weekly_focus, looking_for")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("profile_skills")
      .select("skill_id", { count: "exact", head: true })
      .eq("profile_id", userId),
    // Drzewo etapu ładujemy tylko wtedy, gdy etap ma treść — dla Preparation
    // i dalszych nie ma czego z niego wyciągnąć.
    current?.hasContent && current.startupStageId
      ? loadStageTree(supabase, {
          startupStageId: current.startupStageId,
          activeCategories: active.categories,
          role: active.role,
        })
      : Promise.resolve(null),
    loadOpenWork(supabase, active.id, userId),
  ]);

  const actions: NextAction[] = [];

  // 1. Rzeczy, na które czeka drugi człowiek.
  if ((pendingInvites ?? 0) > 0) {
    actions.push({
      key: "invites",
      title: t("next.invites", { count: pendingInvites ?? 0 }),
      why: t("next.invitesWhy"),
      href: "/app/social/invites",
      meta: t("next.waitingMeta"),
      tone: "brand",
    });
  }

  if ((pendingApplications ?? 0) > 0) {
    actions.push({
      key: "applications",
      title: t("next.applications", { count: pendingApplications ?? 0 }),
      why: t("next.applicationsWhy"),
      href: "/app/team",
      meta: t("next.waitingMeta"),
      tone: "brand",
    });
  }

  if ((pendingContacts ?? 0) > 0) {
    actions.push({
      key: "contacts",
      title: t("next.contacts", { count: pendingContacts ?? 0 }),
      why: t("next.contactsWhy"),
      href: "/app/social/invites",
      meta: t("next.waitingMeta"),
      tone: "brand",
    });
  }

  // 2. Praca nad etapem — po jednym konkretnym podpunkcie, nie „wejdź w etap".
  if (tree && canEdit && tree.status !== "completed") {
    if (tree.canFinish) {
      actions.push({
        key: "finish-stage",
        title: t("next.finishStage", { stage: tree.title }),
        why: t("next.finishStageWhy"),
        href: "/app/stage",
        tone: "brand",
      });
    } else {
      for (const item of findNextSubpoints(tree, MAX_STAGE_ACTIONS)) {
        actions.push({
          key: `subpoint-${item.subpoint.id}`,
          title: t("next.fill", { title: item.subpoint.title }),
          why: item.point.title,
          href: "/app/stage",
          tone: "neutral",
          meta: t("next.managersMeta"),
        });
      }
    }
  }

  const shownGoalIds = new Set<string>();
  // Wytyczne 10.6: gdy konkretne zadanie jest już następnym działaniem, nie
  // dokładamy drugiej pozycji z celem nadrzędnym opisującej tę samą pracę.
  const goalsWithMyTask = new Set(openWork.tasks.map((task) => task.goalId));
  for (const goal of openWork.goals) {
    if (actions.length >= MAX_ACTIONS) break;
    if (goalsWithMyTask.has(goal.id)) continue;
    shownGoalIds.add(goal.id);
    const why =
      goal.status === "awaiting_proof"
        ? t("next.goalAwaitingProof")
        : goal.status === "blocked"
          ? t("next.goalBlocked")
          : t("next.goalNearest");
    actions.push({
      key: `goal-${goal.id}`,
      title: goal.title,
      why,
      href: `/app/goals/${goal.id}`,
      tone: goal.status === "blocked" ? "warning" : "neutral",
      meta: dueMeta(t, locale, goal.dueDate),
    });
  }

  for (const task of openWork.tasks) {
    if (actions.length >= MAX_ACTIONS) break;
    if (shownGoalIds.has(task.goalId)) continue;
    actions.push({
      key: `task-${task.id}`,
      title: task.title,
      why: t("next.taskWhy"),
      href: `/app/tasks?task=${task.id}`,
      tone: "neutral",
      meta: dueMeta(t, locale, task.dueDate),
    });
  }

  // 3. Profil publiczny. Dla kogoś bez teamu to jest jego jedyne narzędzie,
  //    więc przy pustym profilu wchodzi wysoko.
  const completeness = scoreProfile({
    full_name: (profileRow as { full_name?: string | null } | null)?.full_name,
    avatar_url: (profileRow as { avatar_url?: string | null } | null)?.avatar_url,
    headline: (profileRow as { headline?: string | null } | null)?.headline,
    weekly_focus: (profileRow as { weekly_focus?: string | null } | null)
      ?.weekly_focus,
    looking_for: (profileRow as { looking_for?: string | null } | null)
      ?.looking_for,
    skillCount: skillCount ?? 0,
  }, ts);

  if (!completeness.isReady && completeness.topMissing) {
    actions.push({
      key: "profile",
      title: completeness.topMissing.label,
      why: completeness.topMissing.why,
      href: "/app/social/start",
      tone: "warning",
    });
  }

  // 4. Gdy nie ma nic pilnego, mówimy wprost, co warto zrobić — a nie
  //    zostawiamy pustego miejsca.
  if (actions.length === 0) {
    if (!canEdit) {
      actions.push({
        key: "read-stage",
        title: t("next.readStage"),
        why: t("next.readStageWhy"),
        href: "/app/stage",
        tone: "neutral",
      });
    }
    if (canManage) {
      actions.push({
        key: "find-people",
        title: t("next.findPeople"),
        why: t("next.findPeopleWhy"),
        href: "/app/social/people",
        tone: "neutral",
      });
    }
  }

  return {
    actions: actions.slice(0, MAX_ACTIONS),
    blocker: findBlocker({ active, current, tree, canEdit, t }),
    tree,
  };
}

/**
 * Przeszkody wykrywamy WYŁĄCZNIE z danych, które naprawdę mamy.
 *
 * Pełny model blockerów (zgłaszanych ręcznie i wynikających z zależności)
 * przychodzi razem z Execution Stage. Do tego czasu lepiej nie pokazywać nic,
 * niż wymyślać przeszkodę — komunikat „coś Cię blokuje" bez konkretu jest
 * gorszy od jego braku.
 */
function findBlocker(params: {
  active: StartupContext;
  current: StageProgramEntry | null;
  tree: StageTree | null;
  canEdit: boolean;
  t: T;
}): Blocker {
  const { active, current, tree, canEdit, t } = params;

  if (active.status === "paused") {
    return {
      title: t("blocker.paused"),
      why: t("blocker.pausedWhy"),
    };
  }

  if (active.status === "archived") {
    return {
      title: t("blocker.archived"),
      why: t("blocker.archivedWhy"),
    };
  }

  if (current && !current.hasContent) {
    return {
      title: t("blocker.preparing", { stage: current.title }),
      why: t("blocker.preparingWhy"),
    };
  }

  if (!canEdit && tree && tree.status !== "completed") {
    return {
      title: t("blocker.waitingManagers"),
      why: t("blocker.waitingManagersWhy"),
    };
  }

  return null;
}

/** Kilka pierwszych nieukończonych podpunktów, w kolejności programu. */
export function findNextSubpoints(tree: StageTree, limit: number) {
  const found: {
    point: { title: string; done: number; total: number };
    subpoint: { id: string; title: string };
  }[] = [];

  for (const category of tree.categories) {
    for (const point of category.points) {
      for (const subpoint of point.subpoints) {
        if (subpoint.isComplete || subpoint.isOptional) continue;
        found.push({ point, subpoint });
        if (found.length >= limit) return found;
      }
    }
  }

  return found;
}
