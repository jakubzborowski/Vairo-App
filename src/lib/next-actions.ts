import type { SupabaseClient } from "@supabase/supabase-js";
import { loadStageTree, type StageProgramEntry } from "@/lib/stage";
import { scoreProfile } from "@/lib/profile-completeness";
import { canEditStageData, canManageTeam } from "@/types/startup";
import type { StartupContext } from "@/types/startup";
import type { StageTree } from "@/types/stage";

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
};

export type Blocker = { title: string; why: string } | null;

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
  const canEdit = canEditStageData(active.role);
  const canManage = canManageTeam(active.role);

  const [
    { count: pendingApplications },
    { count: pendingContacts },
    { count: pendingInvites },
    { data: profileRow },
    { count: skillCount },
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
  ]);

  // Drzewo etapu ładujemy tylko wtedy, gdy etap ma treść — dla Preparation
  // i dalszych nie ma czego z niego wyciągnąć.
  const tree =
    current?.hasContent && current.startupStageId
      ? await loadStageTree(supabase, {
          startupStageId: current.startupStageId,
          activeCategories: active.categories,
          role: active.role,
        })
      : null;

  const actions: NextAction[] = [];

  // 1. Rzeczy, na które czeka drugi człowiek.
  if ((pendingInvites ?? 0) > 0) {
    actions.push({
      key: "invites",
      title:
        pendingInvites === 1
          ? "Odpowiedz na zaproszenie do teamu"
          : `Odpowiedz na ${pendingInvites} zaproszenia do teamu`,
      why: "Ktoś czeka na Twoją decyzję.",
      href: "/app/social/invites",
      tone: "brand",
    });
  }

  if ((pendingApplications ?? 0) > 0) {
    actions.push({
      key: "applications",
      title:
        pendingApplications === 1
          ? "Rozpatrz zgłoszenie do teamu"
          : `Rozpatrz ${pendingApplications} zgłoszenia do teamu`,
      why: "Dopóki nie odpowiesz, te osoby czekają.",
      href: "/app/team",
      tone: "brand",
    });
  }

  if ((pendingContacts ?? 0) > 0) {
    actions.push({
      key: "contacts",
      title:
        pendingContacts === 1
          ? "Ktoś chce się z Tobą skontaktować"
          : `${pendingContacts} osoby chcą się z Tobą skontaktować`,
      why: "Rozmowa otworzy się, gdy przyjmiesz kontakt.",
      href: "/app/social/invites",
      tone: "brand",
    });
  }

  // 2. Praca nad etapem — po jednym konkretnym podpunkcie, nie „wejdź w etap".
  if (tree && canEdit && tree.status !== "completed") {
    if (tree.canFinish) {
      actions.push({
        key: "finish-stage",
        title: `Domknij ${tree.title}`,
        why: "Wszystkie wymagane podpunkty są uzupełnione.",
        href: "/app/stage",
        tone: "brand",
      });
    } else {
      for (const item of findNextSubpoints(tree, MAX_STAGE_ACTIONS)) {
        actions.push({
          key: `subpoint-${item.subpoint.id}`,
          title: `Uzupełnij: ${item.subpoint.title}`,
          why: item.point.title,
          href: "/app/stage",
          tone: "neutral",
        });
      }
    }
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
  });

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
        title: "Przejrzyj, co zespół już ustalił",
        why: "Masz pełny wgląd w odpowiedzi z etapów.",
        href: "/app/stage",
        tone: "neutral",
      });
    }
    if (canManage) {
      actions.push({
        key: "find-people",
        title: "Znajdź kogoś do zespołu",
        why: "Dodanie otwartej roli sprawia, że team pojawia się wśród rekrutujących.",
        href: "/app/social/people",
        tone: "neutral",
      });
    }
  }

  return {
    actions: actions.slice(0, MAX_ACTIONS),
    blocker: findBlocker({ active, current, tree, canEdit }),
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
}): Blocker {
  const { active, current, tree, canEdit } = params;

  if (active.status === "paused") {
    return {
      title: "Startup jest wstrzymany",
      why: "Kolejny etap się nie otworzy, dopóki nie wznowisz prac w ustawieniach teamu.",
    };
  }

  if (active.status === "archived") {
    return {
      title: "Startup jest w archiwum",
      why: "Dane zostają dostępne do odczytu. Przywrócić go może Founder w ustawieniach teamu.",
    };
  }

  if (current && !current.hasContent) {
    return {
      title: `${current.title} jest w przygotowaniu`,
      why: "Etap jest już w programie, ale nie ma jeszcze wgranych pytań.",
    };
  }

  if (!canEdit && tree && tree.status !== "completed") {
    return {
      title: "Czekasz na Foundera albo Admina",
      why: "Jako Członek czytasz wszystko, ale odpowiedzi w etapach uzupełniają osoby z wyższą rolą.",
    };
  }

  return null;
}

/** Kilka pierwszych nieukończonych podpunktów, w kolejności programu. */
function findNextSubpoints(tree: StageTree, limit: number) {
  const found: { point: { title: string }; subpoint: { id: string; title: string } }[] =
    [];

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
