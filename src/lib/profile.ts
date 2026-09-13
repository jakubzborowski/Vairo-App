import type { SupabaseClient } from "@supabase/supabase-js";
import {
  onboardingPathForStep,
  type OnboardingStep,
  type Profile,
} from "@/types/profile";

type ProfileGateRow = Pick<
  Profile,
  "onboarding_step" | "onboarding_completed_at"
>;

/**
 * Ensures a profiles row exists for the signed-in user.
 * Prefers security-definer RPC so RLS cannot block bootstrap inserts.
 */
export async function ensureOwnProfile(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null }
) {
  const { error: rpcError } = await supabase.rpc("ensure_own_profile");

  if (!rpcError) return;

  // Fallback if RPC not deployed yet — requires profiles_insert_own policy.
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      onboarding_step: "name",
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (error) {
    console.error("[ensureOwnProfile]", rpcError.message, error.message);
  }
}

export async function getProfileGate(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileGateRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_step, onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[getProfileGate]", error.message);
    return null;
  }

  return data as ProfileGateRow | null;
}

export function resolvePostAuthPath(
  profile: ProfileGateRow | null,
  preferredNext = "/app"
) {
  if (profile?.onboarding_completed_at) {
    return preferredNext.startsWith("/onboarding") ? "/app" : preferredNext;
  }

  return onboardingPathForStep(
    (profile?.onboarding_step as OnboardingStep | undefined) ?? "name"
  );
}
