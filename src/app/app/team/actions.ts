"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStartupRole, teamManageError } from "@/lib/permissions";
import { clearActiveStartupIfMatches } from "@/lib/active-team";
import { translateDbError } from "@/lib/db-errors";
import {
  canTransferOwnership,
  isLastFounderError,
  type StartupRole,
  type StartupStatus,
} from "@/types/startup";

type Result = { error: string | null };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function revalidateTeam() {
  revalidatePath("/app/team");
  revalidatePath("/app");
  revalidatePath("/app/social/discover");
}

/** Wspólna bramka: kto zarządza tym teamem. */
async function guardManage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  startupId: string,
  userId: string
) {
  const role = await getStartupRole(supabase, startupId, userId);
  return { role, error: teamManageError(role) };
}

function translate(message: string) {
  if (isLastFounderError(message)) {
    return "To jedyny Founder tego teamu. Najpierw przekaż tę rolę komuś innemu.";
  }
  if (message.includes("startup_limit_reached")) {
    return "Ta osoba jest już w 3 teamach — to maksimum na konto.";
  }
  // Reszta idzie przez wspólny tłumacz, żeby nie wyciekł surowy błąd bazy.
  return translateDbError(message) ?? message;
}

// ---------------------------------------------------------------------------
// Skład teamu
// ---------------------------------------------------------------------------

/**
 * Zmiana roli, czyli zmiana uprawnień.
 *
 * Rolę Foundera nadaje wyłącznie Founder — Admin nie może awansować siebie
 * ani nikogo innego do poziomu, na którym da się usunąć cały startup.
 */
export async function updateMemberRole(input: {
  startupId: string;
  profileId: string;
  role: StartupRole;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { role: myRole, error: denied } = await guardManage(
    supabase,
    input.startupId,
    user.id
  );
  if (denied) return { error: denied };

  if (input.role === "founder" && !canTransferOwnership(myRole!)) {
    return { error: "Rolę Foundera może nadać tylko Founder." };
  }

  if (input.profileId === user.id && myRole === "founder" && input.role !== "founder") {
    return {
      error:
        "Nie odbierzesz sobie roli Foundera z tego miejsca. Najpierw nadaj ją komuś innemu.",
    };
  }

  const { error } = await supabase
    .from("startup_members")
    .update({ role: input.role })
    .eq("startup_id", input.startupId)
    .eq("profile_id", input.profileId);

  if (error) return { error: translate(error.message) };

  revalidateTeam();
  return { error: null };
}

/** Stanowisko to wizytówka, nie uprawnienie — każdy edytuje własne. */
export async function updateJobTitle(input: {
  startupId: string;
  profileId: string;
  jobTitle: string;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const myRole = await getStartupRole(supabase, input.startupId, user.id);
  if (!myRole) return { error: "Nie należysz do tego teamu." };

  const isSelf = input.profileId === user.id;
  if (!isSelf && teamManageError(myRole)) {
    return { error: "Cudze stanowisko zmieniają Founder i Admin." };
  }

  const jobTitle = input.jobTitle.trim();
  if (jobTitle && (jobTitle.length < 2 || jobTitle.length > 48)) {
    return { error: "Stanowisko: 2–48 znaków." };
  }

  const { error } = await supabase
    .from("startup_members")
    .update({ job_title: jobTitle || null })
    .eq("startup_id", input.startupId)
    .eq("profile_id", input.profileId);

  if (error) return { error: translate(error.message) };

  revalidateTeam();
  return { error: null };
}

export async function removeMember(input: {
  startupId: string;
  profileId: string;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { error: denied } = await guardManage(supabase, input.startupId, user.id);
  if (denied) return { error: denied };

  if (input.profileId === user.id) {
    return { error: "Żeby wyjść z teamu, użyj przycisku „Opuść team”." };
  }

  const { error } = await supabase
    .from("startup_members")
    .delete()
    .eq("startup_id", input.startupId)
    .eq("profile_id", input.profileId);

  if (error) return { error: translate(error.message) };

  revalidateTeam();
  return { error: null };
}

/**
 * Wyjście z teamu na własne życzenie. Trigger w bazie nie pozwoli wyjść
 * ostatniemu Founderowi — najpierw musi przekazać rolę.
 */
export async function leaveTeam(startupId: string): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { error } = await supabase
    .from("startup_members")
    .delete()
    .eq("startup_id", startupId)
    .eq("profile_id", user.id);

  if (error) return { error: translate(error.message) };

  revalidateTeam();
  return { error: null };
}

// ---------------------------------------------------------------------------
// Otwarte role
// ---------------------------------------------------------------------------

export async function createOpenRole(input: {
  startupId: string;
  title: string;
  description?: string;
  weeklyHours?: number | null;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { error: denied } = await guardManage(supabase, input.startupId, user.id);
  if (denied) return { error: denied };

  const title = input.title.trim();
  if (title.length < 2 || title.length > 80) {
    return { error: "Nazwa roli: 2–80 znaków." };
  }

  const description = input.description?.trim();
  if (description && description.length > 600) {
    return { error: "Opis roli: maksymalnie 600 znaków." };
  }

  const hours = input.weeklyHours ?? null;
  if (hours !== null && (!Number.isInteger(hours) || hours < 1 || hours > 80)) {
    return { error: "Godziny tygodniowo: liczba od 1 do 80." };
  }

  const { error } = await supabase.from("startup_open_roles").insert({
    startup_id: input.startupId,
    title,
    description: description || null,
    weekly_hours: hours,
  });

  if (error) return { error: translate(error.message) };

  revalidateTeam();
  return { error: null };
}

/**
 * Zamknięcie roli zamiast kasowania: zgłoszenia, które już przyszły na tę
 * rolę, nadal mają do czego się odwołać.
 */
export async function setOpenRoleState(input: {
  startupId: string;
  roleId: string;
  isOpen: boolean;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { error: denied } = await guardManage(supabase, input.startupId, user.id);
  if (denied) return { error: denied };

  const { error } = await supabase
    .from("startup_open_roles")
    .update({ is_open: input.isOpen })
    .eq("id", input.roleId)
    .eq("startup_id", input.startupId);

  if (error) return { error: translate(error.message) };

  revalidateTeam();
  return { error: null };
}

export async function deleteOpenRole(input: {
  startupId: string;
  roleId: string;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { error: denied } = await guardManage(supabase, input.startupId, user.id);
  if (denied) return { error: denied };

  const { error } = await supabase
    .from("startup_open_roles")
    .delete()
    .eq("id", input.roleId)
    .eq("startup_id", input.startupId);

  if (error) return { error: translate(error.message) };

  revalidateTeam();
  return { error: null };
}

// ---------------------------------------------------------------------------
// Publiczny profil teamu
// ---------------------------------------------------------------------------

/**
 * To, co widzą obcy. Świadomie NIE dotyka `idea_description` — pełny opis
 * pomysłu zostaje prywatny, a na zewnątrz idzie tylko to, co founder tutaj
 * napisał.
 */
export async function saveTeamProfile(input: {
  startupId: string;
  tagline: string;
  description: string;
  location: string;
  websiteUrl: string;
  isDiscoverable: boolean;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { error: denied } = await guardManage(supabase, input.startupId, user.id);
  if (denied) return { error: denied };

  const tagline = input.tagline.trim();
  if (tagline.length > 160) {
    return { error: "Jedno zdanie o teamie: maksymalnie 160 znaków." };
  }

  const description = input.description.trim();
  if (description.length > 1200) {
    return { error: "Opis: maksymalnie 1200 znaków." };
  }

  const location = input.location.trim();
  if (location.length > 80) return { error: "Lokalizacja: maksymalnie 80 znaków." };

  let websiteUrl = input.websiteUrl.trim();
  if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
    websiteUrl = `https://${websiteUrl}`;
  }
  if (websiteUrl && websiteUrl.length > 200) {
    return { error: "Adres strony: maksymalnie 200 znaków." };
  }

  const { error } = await supabase
    .from("startups")
    .update({
      public_tagline: tagline || null,
      public_description: description || null,
      location: location || null,
      website_url: websiteUrl || null,
      is_discoverable: input.isDiscoverable,
    })
    .eq("id", input.startupId);

  if (error) return { error: translate(error.message) };

  revalidateTeam();
  revalidatePath("/app/team/profile");
  return { error: null };
}

const LOGO_MAX_BYTES = 15 * 1024 * 1024;

export async function uploadTeamLogo(formData: FormData) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany.", logoUrl: null };

  const startupId = String(formData.get("startup_id") ?? "");
  if (!startupId) return { error: "Brak kontekstu teamu.", logoUrl: null };

  const { error: denied } = await guardManage(supabase, startupId, user.id);
  if (denied) return { error: denied, logoUrl: null };

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Wybierz plik.", logoUrl: null };
  }
  if (file.size > LOGO_MAX_BYTES) {
    return { error: "Logo może mieć maksymalnie 15 MB.", logoUrl: null };
  }

  const allowed: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const ext = allowed[file.type];
  if (!ext) return { error: "Dozwolone formaty: JPG, PNG, WebP.", logoUrl: null };

  const path = `${startupId}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("startup-logos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message, logoUrl: null };

  const { data } = supabase.storage.from("startup-logos").getPublicUrl(path);
  // Ścieżka jest stała, więc bez cache-bustera przeglądarka pokaże stare logo.
  const logoUrl = `${data.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase
    .from("startups")
    .update({ logo_url: logoUrl })
    .eq("id", startupId);

  if (error) return { error: error.message, logoUrl: null };

  revalidateTeam();
  revalidatePath("/app/team/profile");
  return { error: null, logoUrl };
}

/**
 * Pauza i archiwum ustawia decyzja kończąca etap, ale musi istnieć droga
 * powrotna — inaczej „Wstrzymaj" byłoby ślepą uliczką.
 */
export async function setStartupStatus(input: {
  startupId: string;
  status: StartupStatus;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { role, error: denied } = await guardManage(
    supabase,
    input.startupId,
    user.id
  );
  if (denied) return { error: denied };

  if (input.status === "archived" && !canTransferOwnership(role!)) {
    return { error: "Do archiwum może przenieść tylko Founder." };
  }

  const { error } = await supabase
    .from("startups")
    .update({ status: input.status })
    .eq("id", input.startupId);

  if (error) return { error: translate(error.message) };

  revalidateTeam();
  return { error: null };
}

/**
 * Usunięcie startupu — nieodwracalne.
 *
 * Wymaga przepisania nazwy, bo to jedyna operacja w aplikacji, po której nic
 * nie da się odzyskać: znikają odpowiedzi z etapów, dokumenty, zgłoszenia
 * i cały skład. Pauza i archiwum istnieją właśnie po to, żeby nikt nie musiał
 * tu trafiać przez pomyłkę.
 *
 * Ochrona ostatniego Foundera NIE dotyczy tej operacji (migracja 014):
 * kasowanie całego startupu to co innego niż odejście z niego.
 */
export async function deleteStartup(input: {
  startupId: string;
  confirmName: string;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const role = await getStartupRole(supabase, input.startupId, user.id);
  if (role !== "founder") {
    return { error: "Startup może usunąć wyłącznie Founder." };
  }

  const { data: startup } = await supabase
    .from("startups")
    .select("name")
    .eq("id", input.startupId)
    .maybeSingle();

  if (!startup) return { error: "Nie znaleziono startupu." };

  if (input.confirmName.trim() !== startup.name.trim()) {
    return { error: "Wpisana nazwa nie zgadza się z nazwą startupu." };
  }

  const { error } = await supabase
    .from("startups")
    .delete()
    .eq("id", input.startupId);

  if (error) return { error: translate(error.message) };

  await clearActiveStartupIfMatches(input.startupId);

  revalidateTeam();
  revalidatePath("/app/stage");
  return { error: null };
}
