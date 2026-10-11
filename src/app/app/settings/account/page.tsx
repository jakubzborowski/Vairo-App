import { redirect } from "next/navigation";
import { Mail, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserStartups } from "@/lib/startup";
import { DeleteAccountButton } from "@/components/app/delete-account-button";
import { SettingsTabs } from "@/components/app/settings-tabs";
import { Card, CardBody } from "@/components/ui/card";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  return (
    <div className="page">
      <SettingsTabs active="account" />

      <header>
        <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white">
          Ustawienia konta
        </h1>
        <p className="mt-1 text-[14px] text-[var(--text-subtle)]">
          Dane logowania i przynależność do teamów.
        </p>
      </header>

      <Card className="mt-6">
        <CardBody className="pt-5">
          <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
            <Mail className="size-3.5" />
            Logowanie
          </p>
          <p className="mt-2 text-[15px] text-white">{user.email}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
            Zmiana adresu i hasła odbywa się przez e-mail od Vairo — ten ekran
            jeszcze tego nie obsługuje.
          </p>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody className="pt-5">
          <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
            <Users className="size-3.5" />
            Teamy
          </p>
          {startups.length === 0 ? (
            <p className="mt-2 text-[13.5px] text-[var(--text-subtle)]">
              Nie należysz jeszcze do żadnego teamu.
            </p>
          ) : (
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {startups.map((startup) => (
                <li
                  key={startup.id}
                  className="flex items-center justify-between gap-3 text-[13.5px]"
                >
                  <span className="min-w-0 truncate text-white">
                    {startup.name}
                  </span>
                  <span className="shrink-0 text-[12.5px] text-[var(--text-subtle)]">
                    {ROLE_LABELS[startup.role]}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[12.5px] text-[var(--text-faint)]">
            Jesteś w {startups.length} z {MAX_STARTUPS} teamów.
          </p>
        </CardBody>
      </Card>

      <Card className="mt-4 border-[var(--danger)]/25">
        <CardBody className="pt-5">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--danger)]">
            Nieodwracalne
          </p>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-[var(--text-muted)]">
            Usunięcie konta kasuje profil, rozmowy, zaczepki i członkostwa.
            Startupy, w których jesteś jedynym Founderem, znikają razem
            z kontem — pozostałe zostają z resztą Founderów.
          </p>
          <div className="mt-4">
            <DeleteAccountButton
              email={user.email ?? ""}
              soleFounderOf={soleFounderOf}
              teamCount={startups.length}
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
