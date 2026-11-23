import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Plus } from "lucide-react";
import { signOut } from "@/app/app/actions";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getUserStartups } from "@/lib/startup";
import { DeleteAccountButton } from "@/components/app/delete-account-button";
import { SettingsTabs } from "@/components/app/settings-tabs";
import { TeamRowLink } from "@/components/app/team-row-link";
import { CredentialsRows } from "@/components/app/credentials-change";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/module-header";
import { MAX_STARTUPS } from "@/types/startup";
import { LanguageSwitcher } from "@/components/app/language-switcher";
import { getLocale, getT } from "@/i18n/server";
import { formatDate } from "@/i18n/format";

export async function generateMetadata() {
  const t = await getT("settings");
  return { title: t("account.metaTitle") };
}
export const dynamic = "force-dynamic";

/**
 * Ustawienia konta.
 *
 * Świadomie krótkie: co wiemy o koncie, gdzie zmienić profil i jedna strefa
 * nieodwracalna na końcu. Zmiana e-maila i hasła idzie przez Supabase Auth
 * i jest osobnym zakresem — nie udajemy, że są tutaj.
 */
export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const t = await getT("settings");
  const tl = await getT("labels");
  const locale = await getLocale();

  if (!user) redirect("/register?next=/app/settings/account");

  const startups = await getUserStartups(supabase, user.id);

  // Startupy, w których user jest jedynym Founderem, znikają razem z kontem.
  // Trzeba mu to powiedzieć PRZED, nie po.
  const founderOf = startups.filter((startup) => startup.role === "founder");
  const soleFounderOf: string[] = [];

  if (founderOf.length > 0) {
    const { data: founderRows } = await supabase
      .from("startup_members")
      .select("startup_id, profile_id")
      .in(
        "startup_id",
        founderOf.map((startup) => startup.id)
      )
      .eq("role", "founder");

    for (const startup of founderOf) {
      const founders = (founderRows ?? []).filter(
        (row) => row.startup_id === startup.id
      );
      if (founders.length <= 1) soleFounderOf.push(startup.name);
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle();
  const name = profile?.full_name?.trim() || user.email?.split("@")[0] || t("account.you");
  const since = profile?.created_at
    ? formatDate(locale, profile.created_at as string, { month: "long", year: "numeric" })
    : null;
  const firstTeam = startups[0];
  const seatsLeft = MAX_STARTUPS - startups.length;

  return (
    <div className="page">
      <SettingsTabs active="account" />

      {/* Nagłówek mówi zdaniem, kim jesteś w Vairo. Na tym ekranie nie ma
          akcji głównej, więc nie ma też pomarańczu. */}
      <header className="flex items-center gap-4">
        <Avatar src={profile?.avatar_url ?? null} name={name} size="lg" />
        <div className="min-w-0">
          <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
            {t("account.title")}
          </h1>
          <p className="mt-0.5 text-[14.5px] text-[var(--text-muted)]">
            {name}
            {since ? t("account.since", { since }) : ""}
            {firstTeam
              ? t("account.roleIn", { role: tl(`role.${firstTeam.role}`), team: firstTeam.name })
              : ""}
            .
          </p>
        </div>
      </header>

      <section className="mt-7">
        <SectionLabel>{t("account.login")}</SectionLabel>
        <div className="mt-2 overflow-hidden rounded-[22px] bg-[var(--surface)] lift-1">
          <CredentialsRows email={user.email ?? ""} />
        </div>
      </section>

      <section className="mt-6">
        <SectionLabel
          action={
            <span className="inline-flex items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
              {t("account.seats", { used: startups.length, max: MAX_STARTUPS })}
              <span className="inline-flex gap-[3px]" aria-hidden="true">
                {Array.from({ length: MAX_STARTUPS }, (_, index) => (
                  <span
                    key={index}
                    className={
                      "h-[5px] w-4 rounded-full " +
                      (index < startups.length ? "bg-[var(--text-muted)]" : "bg-white/10")
                    }
                  />
                ))}
              </span>
            </span>
          }
        >
          {t("account.teams")}
        </SectionLabel>
        <div className="mt-2 overflow-hidden rounded-[22px] bg-[var(--surface)] lift-1 divide-y divide-white/[0.05]">
          {startups.map((startup) => (
            <TeamRowLink
              key={startup.id}
              id={startup.id}
              name={startup.name}
              logoUrl={startup.logoUrl}
              detail={[
                tl(`role.${startup.role}`),
                startup.stage ? t("account.stage", { stage: startup.stage.title }) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
          {seatsLeft > 0 ? (
            <Link
              href={startups.length === 0 ? "/app/startups/new" : "/app/social/teams"}
              className="flex min-h-16 items-center gap-3.5 px-5 py-3.5 text-[14px] text-[var(--text-muted)] transition-colors hover:text-white"
            >
              <span className="inline-flex size-9 items-center justify-center rounded-lg border-[1.5px] border-dashed border-white/20">
                <Plus className="size-4" />
              </span>
              {startups.length === 0
                ? t("account.createOrJoin")
                : t("account.joinAnother")}
            </Link>
          ) : (
            <p className="px-5 py-4 text-[13px] text-[var(--text-subtle)]">
              {t("account.atLimit")}
            </p>
          )}
        </div>
      </section>

      <section className="mt-6">
        <SectionLabel>{t("language.title")}</SectionLabel>
        <p className="mt-1 px-1 text-[13px] text-[var(--text-muted)]">{t("language.description")}</p>
        <div className="mt-2 overflow-hidden rounded-[22px] bg-[var(--surface)] lift-1">
          <LanguageSwitcher />
        </div>
      </section>

      {/* Usunięcie konta to jeden spokojny wiersz. Cała powaga przechodzi do
          okna potwierdzenia, które wylicza skutki dla Twoich teamów. */}
      <section className="mt-6 flex flex-wrap items-center gap-4 rounded-[22px] border-[1.5px] border-dashed border-white/10 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-medium text-white">{t("account.delete.title")}</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text-muted)]">
            {t("account.delete.body")}
          </p>
        </div>
        <DeleteAccountButton
          email={user.email ?? ""}
          soleFounderOf={soleFounderOf}
          teamCount={startups.length}
        />
      </section>

      {/* Na telefonie menu osoby jest daleko — wylogowanie stoi też tutaj. */}
      <form action={signOut} className="mt-6 lg:hidden">
        <Button type="submit" variant="secondary" block size="lg">
          <LogOut className="size-4" />
          {t("account.signOut")}
        </Button>
      </form>
    </div>
  );
}
