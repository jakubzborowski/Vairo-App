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
  revalidatePath("/app/social/people");
  revalidatePath("/app/social/teams");
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
        "Nie odbierzesz sobie roli Foundera z tego miejsca. Użyj „Przekaż rolę Foundera” przy osobie, której chcesz ją oddać.",
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

  // Ciasteczko aktywnego teamu wskazywało na team, którego user już nie ma.
  // `resolveActiveStartup()` cofa się wtedy do pierwszego z listy, więc nic
  // się nie psuło — ale przy wyjściu z OSTATNIEGO teamu zostawał wskaźnik
  // donikąd. Usunięcie startupu czyściło je od początku; wyjście nie.
  await clearActiveStartupIfMatches(startupId);

  revalidateTeam();
  return { error: null };
}

/**
 * Przekazanie roli Foundera.
 *
 * Bez tej akcji „oddanie sterów" wymagało dwóch kroków w dwóch różnych
 * miejscach: najpierw awansuj kogoś na Foundera, potem zdegraduj siebie.
 * Drugiego kroku nikt nie odgadywał, więc w teamie zostawało dwóch Founderów
 * albo człowiek utykał na komunikacie „najpierw przekaż rolę".
 *
 * Kolejność jest istotna: najpierw awans, potem degradacja. Odwrotnie trigger
 * `protect_last_founder` słusznie by nas zablokował, bo przez chwilę nie
 * byłoby ani jednego Foundera.
 */
export async function transferFounder(input: {
  startupId: string;
  toProfileId: string;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  if (input.toProfileId === user.id) {
    return { error: "Już masz tę rolę." };
  }

  const myRole = await getStartupRole(supabase, input.startupId, user.id);
  if (myRole !== "founder") {
    return { error: "Rolę Foundera przekazuje wyłącznie Founder." };
  }

  const target = await getStartupRole(supabase, input.startupId, input.toProfileId);
  if (!target) return { error: "Ta osoba nie należy do teamu." };

  const { error: promoteError } = await supabase
    .from("startup_members")
    .update({ role: "founder" })
    .eq("startup_id", input.startupId)
    .eq("profile_id", input.toProfileId);

  if (promoteError) return { error: translate(promoteError.message) };

  const { error: demoteError } = await supabase
    .from("startup_members")
    .update({ role: "admin" })
    .eq("startup_id", input.startupId)
    .eq("profile_id", user.id);

  // Gdyby drugi krok padł, zostaje team z dwoma Founderami. To stan bezpieczny
  // i odwracalny — mówimy o nim wprost, zamiast udawać, że nic się nie stało.
  if (demoteError) {
    return {
      error:
        "Rola Foundera została nadana, ale nie udało się zmienić Twojej. " +
        "Teraz team ma dwóch Founderów — zmień swoją rolę ręcznie na liście.",
    };
  }

  revalidateTeam();
  return { error: null };
}

// ---------------------------------------------------------------------------
// Otwarte role
// ---------------------------------------------------------------------------

type RoleInput = {
  startupId: string;
  title: string;
  description?: string;
  weeklyHours?: number | null;
  /**
   * Umiejętności, o które ta rola pyta. To jedyne pole roli, które da się
   * porównać maszynowo — i dzięki niemu karta w Odkrywaj potrafi powiedzieć
   * „masz to w profilu” zamiast samej nazwy stanowiska.
   */
  skillIds?: string[];
};

/** Walidacja wspólna dla dodawania i edycji — jedna reguła, jedno miejsce. */
function checkRole(input: RoleInput) {
  const title = input.title.trim();
  if (title.length < 2 || title.length > 80) {
    return { error: "Nazwa roli: 2–80 znaków.", value: null };
  }

  const description = input.description?.trim();
  if (description && description.length > 600) {
    return { error: "Opis roli: maksymalnie 600 znaków.", value: null };
  }

  const hours = input.weeklyHours ?? null;
  if (hours !== null && (!Number.isInteger(hours) || hours < 1 || hours > 80)) {
    return { error: "Godziny tygodniowo: liczba od 1 do 80.", value: null };
  }

  const skillIds = [...new Set(input.skillIds ?? [])].slice(0, 12);

  return {
    error: null,
    value: { title, description: description || null, hours, skillIds },
  };
}

/**
 * Podpięcie umiejętności do roli.
 *
 * Kasujemy komplet i wstawiamy od nowa, zamiast liczyć różnicę. Przy liście
 * kilkunastu pozycji to jedno zapytanie więcej, a w zamian nie ma stanu
 * pośredniego, w którym część powiązań już zniknęła, a nowe jeszcze nie
 * weszły.
 */
async function replaceRoleSkills(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  roleId: string,
  skillIds: string[]
) {
  await supabase.from("startup_open_role_skills").delete().eq("role_id", roleId);
  if (skillIds.length === 0) return null;

  const { error } = await supabase
    .from("startup_open_role_skills")
    .insert(skillIds.map((skillId) => ({ role_id: roleId, skill_id: skillId })));

  return error ? translate(error.message) : null;
}

export async function createOpenRole(input: RoleInput): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { error: denied } = await guardManage(supabase, input.startupId, user.id);
  if (denied) return { error: denied };

  const checked = checkRole(input);
  if (checked.error || !checked.value) return { error: checked.error };
  const { title, description, hours, skillIds } = checked.value;

  const { data, error } = await supabase
    .from("startup_open_roles")
    .insert({
      startup_id: input.startupId,
      title,
      description,
      weekly_hours: hours,
    })
    .select("id")
    .single();

  if (error) return { error: translate(error.message) };

  const skillError = await replaceRoleSkills(supabase, data.id as string, skillIds);
  if (skillError) return { error: skillError };

  revalidateTeam();
  return { error: null };
}

/**
 * Edycja istniejącej roli.
 *
 * Bez tego jedyną drogą do poprawienia literówki albo dopisania umiejętności
 * było skasowanie roli i wpisanie jej od nowa — czyli utrata powiązania ze
 * zgłoszeniami, które na tę rolę przyszły.
 */
export async function updateOpenRole(
  input: RoleInput & { roleId: string }
): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { error: denied } = await guardManage(supabase, input.startupId, user.id);
  if (denied) return { error: denied };

  const checked = checkRole(input);
  if (checked.error || !checked.value) return { error: checked.error };
  const { title, description, hours, skillIds } = checked.value;

  const { error } = await supabase
    .from("startup_open_roles")
    .update({ title, description, weekly_hours: hours })
    .eq("id", input.roleId)
    .eq("startup_id", input.startupId);

  if (error) return { error: translate(error.message) };

  const skillError = await replaceRoleSkills(supabase, input.roleId, skillIds);
  if (skillError) return { error: skillError };

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
  showStagePublicly: boolean;
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

  const patch = {
    public_tagline: tagline || null,
    public_description: description || null,
    location: location || null,
    website_url: websiteUrl || null,
    is_discoverable: input.isDiscoverable,
  };

  let { error } = await supabase
    .from("startups")
    .update({ ...patch, show_stage_publicly: input.showStagePublicly })
    .eq("id", input.startupId);

  // Bez migracji 016 kolumny jeszcze nie ma. Zapis reszty profilu ma się wtedy
  // udać — inaczej jedna nieodpalona migracja blokuje edycję wszystkiego.
  if (error?.message?.includes("show_stage_publicly")) {
    ({ error } = await supabase
      .from("startups")
      .update(patch)
      .eq("id", input.startupId));
  }

  if (error) return { error: translate(error.message) };

  revalidateTeam();
  revalidatePath("/app/team/profile");
  return { error: null };
}

/**
 * Same przełączniki widoczności — bez tekstów profilu.
 *
 * Wcześniej „Team widoczny w Odkrywaj" był częścią formularza i wchodził
 * w życie dopiero po kliknięciu „Zapisz" na dole. Przełącznik, który nie
 * przełącza, to najgorszy rodzaj fake UI: wygląda dokładnie jak działający.
 * Zapis idzie więc od razu, a `Zapisz" zostaje przy polach tekstowych, gdzie
 * ma sens — tam człowiek pisze i chce móc się rozmyślić.
 */
export async function setTeamVisibility(input: {
  startupId: string;
  isDiscoverable: boolean;
  showStagePublicly: boolean;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { error: denied } = await guardManage(supabase, input.startupId, user.id);
  if (denied) return { error: denied };

  let { error } = await supabase
    .from("startups")
    .update({
      is_discoverable: input.isDiscoverable,
      show_stage_publicly: input.showStagePublicly,
    })
    .eq("id", input.startupId);

  // Bez migracji 016 kolumny jeszcze nie ma — sama widoczność ma się wtedy
  // zapisać. Jedna nieodpalona migracja nie może blokować drugiej sprawy.
  if (error?.message?.includes("show_stage_publicly")) {
    ({ error } = await supabase
      .from("startups")
      .update({ is_discoverable: input.isDiscoverable })
      .eq("id", input.startupId));
  }

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
