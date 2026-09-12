import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export const metadata = {
  title: "Dashboard — Vairo",
};

export const dynamic = "force-dynamic";

function resolveDisplayName(
  email: string | undefined,
  metadata: Record<string, unknown> | undefined
) {
  const fullName =
    (typeof metadata?.full_name === "string" && metadata.full_name) ||
    (typeof metadata?.name === "string" && metadata.name) ||
    "";
  if (fullName.trim()) return fullName.trim();
  const local = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (local) {
    return local
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  return "Founder";
}

export default async function AppPage() {
  const supabase = await createClient();

  // Prefer JWT claims (cheap, local JWKS verify). Proxy already gated the route.
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    redirect("/login?next=/app");
  }

  const claims = claimsData.claims as Record<string, unknown>;
  const claimsEmail =
    typeof claims.email === "string" ? claims.email : undefined;
  const claimsMeta =
    claims.user_metadata && typeof claims.user_metadata === "object"
      ? (claims.user_metadata as Record<string, unknown>)
      : undefined;

  let email = claimsEmail ?? "";
  let metadata = claimsMeta;

  // Only hit Auth API when claims lack display fields.
  const needsUserFetch =
    !email ||
    !(
      (typeof metadata?.full_name === "string" && metadata.full_name) ||
      (typeof metadata?.name === "string" && metadata.name)
    );

  if (needsUserFetch) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?next=/app");
    }

    email = user.email ?? email;
    metadata = user.user_metadata as Record<string, unknown> | undefined;
  }

  const displayName = resolveDisplayName(email, metadata);

  return (
    <AppShell email={email} displayName={displayName}>
      <DashboardHome displayName={displayName} />
    </AppShell>
  );
}
