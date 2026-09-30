"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStartupRole } from "@/lib/permissions";
import { translateDbError } from "@/lib/db-errors";
import { canManageTeam } from "@/types/startup";
import {
  LOOKING_FOR,
  translateContactError,
  translateJoinError,
  type LookingFor,
} from "@/types/social";

type Result = { error: string | null };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function revalidateSocial() {
  revalidatePath("/app/social/invites");
  revalidatePath("/app/social/people");
  revalidatePath("/app/social/teams");
  revalidatePath("/app/team");
  revalidatePath("/app");
}

function revalidateContacts() {
  revalidatePath("/app/social/invites");
  revalidatePath("/app/social/messages");
  revalidatePath("/app/social/people");
  revalidatePath("/app/social/teams");
  revalidatePath("/app");
}

/**
 * Zgłoszenie do teamu (kierunek „application").
 *
 * Trigger w bazie odrzuci zgłoszenie, jeśli user jest już w tym teamie albo
 * osiągnął limit 3 członkostw — sprawdzamy to tam, a nie tutaj, bo między
 * sprawdzeniem w aplikacji a zapisem ktoś mógłby w tym czasie zaakceptować
 * inne zaproszenie.
 */
export async function applyToStartup(input: {
  startupId: string;
  openRoleId?: string | null;
  message?: string;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const message = input.message?.trim();
  if (message && message.length > 600) {
    return { error: "Wiadomość może mieć maksymalnie 600 znaków." };
  }

  const { error } = await supabase.from("startup_join_requests").insert({
    startup_id: input.startupId,
    profile_id: user.id,
    direction: "application",
    open_role_id: input.openRoleId || null,
    message: message || null,
    created_by: user.id,
  });

  if (error) return { error: translateJoinError(error.message) };

  revalidateSocial();
  return { error: null };
}

/**
 * Zaproszenie do teamu (kierunek „invite"). Zaprasza Founder albo Admin;
 * rolę Foundera nadaje się osobno, po dołączeniu.
 */
export async function inviteToStartup(input: {
  startupId: string;
  profileId: string;
  proposedRole?: "admin" | "member";
  jobTitle?: string;
  message?: string;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const role = await getStartupRole(supabase, input.startupId, user.id);
  if (!role || !canManageTeam(role)) {
    return { error: "Tylko Founder i Admin mogą zapraszać do teamu." };
  }

  const jobTitle = input.jobTitle?.trim();
  if (jobTitle && (jobTitle.length < 2 || jobTitle.length > 48)) {
    return { error: "Stanowisko: 2–48 znaków." };
  }

  const { error } = await supabase.from("startup_join_requests").insert({
    startup_id: input.startupId,
    profile_id: input.profileId,
    direction: "invite",
    proposed_role: input.proposedRole ?? "member",
    job_title: jobTitle || null,
    message: input.message?.trim() || null,
    created_by: user.id,
  });

  if (error) return { error: translateJoinError(error.message) };

  revalidateSocial();
  return { error: null };
}

/**
 * Akceptacja, odrzucenie albo wycofanie prośby.
 *
 * Cała logika „kto może" siedzi w funkcji `respond_join_request` w bazie —
 * tam też powstaje wpis w `startup_members`, w tej samej transakcji co zmiana
 * statusu. Dzięki temu nie ma stanu „zaakceptowane, ale nie dodane do teamu".
 */
export async function respondToJoinRequest(
  requestId: string,
  action: "accept" | "decline" | "withdraw",
  /**
   * Kierunek prośby — służy WYŁĄCZNIE do doboru brzmienia komunikatu o limicie
   * trzech teamów. Uprawnienia rozstrzyga funkcja w bazie, więc podanie tu
   * czegokolwiek nie zmienia tego, co wolno zrobić.
   */
  direction?: "application" | "invite"
): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { error } = await supabase.rpc("respond_join_request", {
    p_request_id: requestId,
    p_action: action,
  });

  if (error) {
    if (error.message.includes("respond_join_request")) {
      return {
        error: "Brakuje migracji 009 — odpal ją w Supabase → SQL Editor.",
      };
    }
    return {
      error: translateJoinError(
        error.message,
        direction === "application" ? "them" : "me"
      ),
    };
  }

  revalidateSocial();
  return { error: null };
}

/**
 * Część profilu, która istnieje wyłącznie dla warstwy Social.
 *
 * Trzymamy ją osobno od `saveProfile`, bo ten formularz jest w innym miejscu
 * (Mój profil publiczny) i ma inne pytania — „ile godzin tygodniowo" nie ma
 * sensu w ustawieniach konta.
 */
export async function saveSocialPreferences(input: {
  lookingFor: string | null;
  location: string;
  weeklyHours: number | null;
  isDiscoverable: boolean;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const lookingFor =
    input.lookingFor &&
    (LOOKING_FOR as readonly string[]).includes(input.lookingFor)
      ? (input.lookingFor as LookingFor)
      : null;

  const location = input.location.trim();
  if (location.length > 80) {
    return { error: "Lokalizacja: maksymalnie 80 znaków." };
  }

  const hours = input.weeklyHours;
  if (hours !== null && (!Number.isInteger(hours) || hours < 1 || hours > 80)) {
    return { error: "Godziny tygodniowo: liczba od 1 do 80." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      looking_for: lookingFor,
      location: location || null,
      weekly_hours: hours,
      is_discoverable: input.isDiscoverable,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/app/social/me");
  revalidatePath("/app/settings/profile");
  revalidateSocial();
  return { error: null };
}

/**
 * Zapis całego profilu publicznego z kreatora.
 *
 * Kreator zbiera dane przez kilka ekranów, ale zapisuje raz — dzięki temu
 * przerwanie w połowie nie zostawia w bazie połowicznego profilu, który już
 * pokazałby się obcym.
 */
export async function saveSocialProfile(input: {
  fullName: string;
  headline: string;
  lookingFor: string | null;
  location: string;
  weeklyHours: number | null;
  weeklyFocus: string;
  skillIds: string[];
  isDiscoverable: boolean;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const fullName = input.fullName.trim();
  if (fullName.length < 2 || fullName.length > 120) {
    return { error: "Imię i nazwisko: 2–120 znaków." };
  }

  const headline = input.headline.trim();
  if (headline.length > 120) {
    return { error: "Czym się zajmujesz: maksymalnie 120 znaków." };
  }

  const weeklyFocus = input.weeklyFocus.trim();
  if (weeklyFocus.length > 2000) {
    return { error: "Nad czym pracujesz: maksymalnie 2000 znaków." };
  }

  const location = input.location.trim();
  if (location.length > 80) return { error: "Lokalizacja: maksymalnie 80 znaków." };

  const hours = input.weeklyHours;
  if (hours !== null && (!Number.isInteger(hours) || hours < 1 || hours > 80)) {
    return { error: "Godziny tygodniowo: liczba od 1 do 80." };
  }

  const lookingFor =
    input.lookingFor &&
    (LOOKING_FOR as readonly string[]).includes(input.lookingFor)
      ? (input.lookingFor as LookingFor)
      : null;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      headline: headline || null,
      weekly_focus: weeklyFocus || null,
      looking_for: lookingFor,
      location: location || null,
      weekly_hours: hours,
      is_discoverable: input.isDiscoverable,
    })
    .eq("id", user.id);

  if (profileError) return { error: translateDbError(profileError.message) };

  // Umiejętności: podmiana całego zestawu. Przy kilkunastu pozycjach to
  // tańsze i prostsze niż wyliczanie różnicy.
  const unique = [...new Set(input.skillIds.filter(Boolean))];

  const { error: deleteError } = await supabase
    .from("profile_skills")
    .delete()
    .eq("profile_id", user.id);

  if (deleteError) return { error: translateDbError(deleteError.message) };

  if (unique.length > 0) {
    const { error: insertError } = await supabase
      .from("profile_skills")
      .insert(unique.map((skill_id) => ({ profile_id: user.id, skill_id })));
    if (insertError) return { error: translateDbError(insertError.message) };
  }

  revalidatePath("/app/social/me");
  revalidatePath("/app/settings/profile");
  revalidateSocial();
  return { error: null };
}

// ---------------------------------------------------------------------------
// Kontakt i rozmowa
// ---------------------------------------------------------------------------

/**
 * „Napisz do tej osoby".
 *
 * Jeżeli rozmowa już istnieje, nie wysyłamy drugiej zaczepki — dopisujemy
 * wiadomość do istniejącego wątku i zwracamy jego adres. Człowiek klikający
 * „Napisz" chce napisać, a nie dowiedzieć się, że „kontakt już nawiązany".
 *
 * `contextStartupId` to wymóg z guidelines: odbiorca musi widzieć, czy pisze
 * do niego osoba prywatnie, czy ktoś w imieniu konkretnego teamu.
 */
export async function startContact(input: {
  recipientId: string;
  message: string;
  contextStartupId?: string | null;
}): Promise<Result & { conversationId?: string | null }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  if (input.recipientId === user.id) {
    return { error: "Nie napiszesz sam do siebie." };
  }

  const message = input.message.trim();
  if (message.length < 1) return { error: "Napisz choć jedno zdanie." };
  if (message.length > 600) {
    return { error: "Wiadomość może mieć maksymalnie 600 znaków." };
  }

  // Rozmowa już trwa? Wtedy to jest zwykła wiadomość, nie nowy kontakt.
  const { data: existingId } = await supabase.rpc("conversation_with", {
    p_other: input.recipientId,
  });

  if (typeof existingId === "string" && existingId) {
    const { error } = await supabase.from("messages").insert({
      conversation_id: existingId,
      sender_id: user.id,
      body: message,
    });
    if (error) return { error: translateContactError(error.message) };

    revalidateContacts();
    return { error: null, conversationId: existingId };
  }

  const { error } = await supabase.from("contact_signals").insert({
    sender_id: user.id,
    recipient_id: input.recipientId,
    context_startup_id: input.contextStartupId || null,
    message,
  });

  if (error) return { error: translateContactError(error.message) };

  revalidateContacts();
  return { error: null, conversationId: null };
}

/** Przyjęcie zaczepki tworzy rozmowę; odrzucenie zamyka sprawę bez wątku. */
export async function respondToContact(
  signalId: string,
  action: "accept" | "decline" | "withdraw"
): Promise<Result & { conversationId?: string | null }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { data, error } = await supabase.rpc("respond_contact_signal", {
    p_signal_id: signalId,
    p_action: action,
  });

  if (error) return { error: translateContactError(error.message) };

  revalidateContacts();
  return {
    error: null,
    conversationId: typeof data === "string" ? data : null,
  };
}

export async function sendMessage(input: {
  conversationId: string;
  body: string;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const body = input.body.trim();
  if (body.length < 1) return { error: "Wiadomość nie może być pusta." };
  if (body.length > 4000) {
    return { error: "Wiadomość może mieć maksymalnie 4000 znaków." };
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: input.conversationId,
    sender_id: user.id,
    body,
  });

  if (error) return { error: translateContactError(error.message) };

  revalidatePath(`/app/social/messages/${input.conversationId}`);
  revalidateContacts();
  return { error: null };
}

/** Znacznik przeczytania — kasuje licznik nieprzeczytanych przy nawigacji. */
export async function markConversationRead(
  conversationId: string
): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const { error } = await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("profile_id", user.id);

  if (error) return { error: error.message };

  revalidateContacts();
  return { error: null };
}

// ---------------------------------------------------------------------------
// Pomijanie w Odkrywaj
// ---------------------------------------------------------------------------

/**
 * „Ta osoba mi nie pasuje" — zapisujemy decyzję, żeby nie wracała.
 *
 * Pominięcie jest prywatne: druga strona nigdy się o nim nie dowie (polityka
 * RLS w migracji 011 wpuszcza wyłącznie właściciela wiersza). Jest też
 * odwracalne — stąd `undoLastPass` i `clearPasses` poniżej.
 */
export async function passCandidate(input: {
  profileId?: string;
  startupId?: string;
}): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const hasPerson = Boolean(input.profileId);
  const hasTeam = Boolean(input.startupId);
  if (hasPerson === hasTeam) {
    return { error: "Podaj dokładnie jeden cel do pominięcia." };
  }

  // Zwykły INSERT, nie UPSERT — i to jest wymuszone przez kształt tabeli.
  //
  // `discovery_passes` ma dwa indeksy unikalne, oba CZĘŚCIOWE:
  //   (actor_id, target_profile_id) where target_profile_id is not null
  //   (actor_id, target_startup_id) where target_startup_id is not null
  //
  // Postgres nie przyjmie indeksu częściowego jako arbitra `ON CONFLICT`,
  // dopóki zapytanie nie powtórzy jego warunku (`... where target_profile_id
  // is not null`). PostgREST nie ma jak takiego predykatu wysłać — parametr
  // `onConflict` przyjmuje wyłącznie listę kolumn. Stąd błąd, który widział
  // user przy każdym pominięciu karty:
  // „there is no unique or exclusion constraint matching the ON CONFLICT
  // specification".
  //
  // Indeksy są częściowe słusznie: jeden wiersz opisuje ALBO osobę, ALBO
  // team, więc druga kolumna jest zawsze NULL-em, a NULL-e w Postgresie nie
  // kolidują ze sobą. Zamiast naginać schemat pod składnię klienta, robimy
  // zwykły INSERT i traktujemy duplikat jako sukces — bo nim jest: karta i tak
  // miała zniknąć z talii, a to, że była pominięta już wcześniej, niczego dla
  // użytkownika nie zmienia.
  const { error } = await supabase.from("discovery_passes").insert({
    actor_id: user.id,
    target_profile_id: input.profileId ?? null,
    target_startup_id: input.startupId ?? null,
  });

  if (error) {
    // 23505 = unique_violation. Ten sam cel pominięty drugi raz (np. dwa
    // kliknięcia pod rząd albo dwie otwarte karty) to nie jest błąd.
    const duplicate =
      error.code === "23505" || error.message.includes("duplicate key");

    if (!duplicate) {
      if (error.message.includes("discovery_passes")) {
        return {
          error: "Brakuje migracji 011 — odpal ją w Supabase → SQL Editor.",
        };
      }
      return { error: translateDbError(error.message) };
    }
  }

  revalidatePath("/app/social/people");
  revalidatePath("/app/social/teams");
  return { error: null };
}

/** Cofnięcie ostatniej decyzji — najczęstsza potrzeba po pomyłce w kliknięciu. */
export async function undoLastPass(kind: "person" | "team"): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const column = kind === "person" ? "target_profile_id" : "target_startup_id";

  const { data: last } = await supabase
    .from("discovery_passes")
    .select("id")
    .eq("actor_id", user.id)
    .not(column, "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!last) return { error: null };

  const { error } = await supabase
    .from("discovery_passes")
    .delete()
    .eq("id", last.id)
    .eq("actor_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/app/social/people");
  revalidatePath("/app/social/teams");
  return { error: null };
}

/** Wyczyszczenie całej listy pominiętych — „pokaż mi wszystko od nowa". */
export async function clearPasses(kind: "person" | "team"): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Musisz być zalogowany." };

  const column = kind === "person" ? "target_profile_id" : "target_startup_id";

  const { error } = await supabase
    .from("discovery_passes")
    .delete()
    .eq("actor_id", user.id)
    .not(column, "is", null);

  if (error) return { error: error.message };

  revalidatePath("/app/social/people");
  revalidatePath("/app/social/teams");
  return { error: null };
}
