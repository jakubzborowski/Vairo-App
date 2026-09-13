/**
 * DB shapes for mandatory onboarding:
 * name → idea → tags → done (no skip)
 * + social profile: skills, avatar, weekly focus, teams
 */

export type OnboardingStep = "name" | "idea" | "tags" | "done";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  idea_description: string | null;
  avatar_url: string | null;
  headline: string | null;
  weekly_focus: string | null;
  onboarding_step: OnboardingStep;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  slug: string;
  label: string;
  is_suggested: boolean;
  created_by: string | null;
  created_at: string;
};

export type Skill = {
  id: string;
  slug: string;
  label: string;
  is_suggested: boolean;
  created_by: string | null;
  created_at: string;
};

export type ProfileTag = {
  profile_id: string;
  tag_id: string;
  created_at: string;
};

export type ProfileSkill = {
  profile_id: string;
  skill_id: string;
  created_at: string;
};

export type Team = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type TeamMember = {
  team_id: string;
  profile_id: string;
  role: "owner" | "member";
  created_at: string;
};

export type ProfileOnboardingStatus = {
  id: string;
  email: string | null;
  full_name: string | null;
  idea_description: string | null;
  onboarding_step: OnboardingStep;
  onboarding_completed_at: string | null;
  is_complete: boolean;
  tag_count: number;
};

export function isOnboardingComplete(
  profile: Pick<Profile, "onboarding_completed_at"> | null | undefined
) {
  return Boolean(profile?.onboarding_completed_at);
}

/** Next route for an incomplete profile (no skip). */
export function onboardingPathForStep(step: OnboardingStep | null | undefined) {
  switch (step) {
    case "idea":
      return "/onboarding/idea";
    case "tags":
      return "/onboarding/tags";
    case "done":
      return "/app";
    case "name":
    default:
      return "/onboarding/name";
  }
}
