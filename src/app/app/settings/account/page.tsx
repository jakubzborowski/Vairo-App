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
import { MAX_STARTUPS, ROLE_LABELS } from "@/types/startup";

export const metadata = { title: "Ustawienia konta — Vairo" };
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
  const name = profile?.full_name?.trim() || user.email?.split("@")[0] || "Ty";
  const since = profile?.created_at
    ? new Date(profile.created_at as string).toLocaleDateString("pl-PL", { month: "long", year: "numeric" })
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
            Ustawienia
          </h1>
          <p className="mt-0.5 text-[14.5px] text-[var(--text-muted)]">
            {name}
            {since ? ` · w Vairo od ${since}` : ""}
            {firstTeam ? `, ${ROLE_LABELS[firstTeam.role]} w ${firstTeam.name}` : ""}.
          </p>
        </div>
      </header>

      <section className="mt-7">
        <SectionLabel>Logowanie</SectionLabel>
        <div className="mt-2 overflow-hidden rounded-[22px] bg-[var(--surface)] lift-1">
          <CredentialsRows email={user.email ?? ""} />
        </div>
      </section>

      <section className="mt-6">
        <SectionLabel
          action={
            <span className="inline-flex items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
              {startups.length} z {MAX_STARTUPS} miejsc
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
          Teamy
        </SectionLabel>
        <div className="mt-2 overflow-hidden rounded-[22px] bg-[var(--surface)] lift-1 divide-y divide-white/[0.05]">
          {startups.map((startup) => (
            <TeamRowLink
              key={startup.id}
              id={startup.id}
              name={startup.name}
              logoUrl={startup.logoUrl}
              detail={[
                ROLE_LABELS[startup.role],
                startup.stage ? `etap ${startup.stage.title}` : null,
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
                ? "Załóż startup albo dołącz do teamu przez Odkrywaj"
                : "Dołącz do kolejnego teamu przez Odkrywaj"}
            </Link>
          ) : (
            <p className="px-5 py-4 text-[13px] text-[var(--text-subtle)]">
              To maksimum na konto. Żeby dołączyć gdzie indziej, najpierw wyjdź z jednego teamu.
            </p>
          )}
        </div>
      </section>

      {/* Usunięcie konta to jeden spokojny wiersz. Cała powaga przechodzi do
          okna potwierdzenia, które wylicza skutki dla Twoich teamów. */}
      <section className="mt-6 flex flex-wrap items-center gap-4 rounded-[22px] border-[1.5px] border-dashed border-white/10 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-medium text-white">Usuń konto</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text-muted)]">
            Kasuje profil, rozmowy i członkostwa. Przed usunięciem pokażemy, co stanie się
            z Twoimi teamami.
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
          Wyloguj się
        </Button>
      </form>
    </div>
  );
}
