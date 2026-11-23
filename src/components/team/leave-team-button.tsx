"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, LogOut } from "lucide-react";
import { leaveTeam } from "@/app/app/team/actions";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { Modal } from "@/components/ui/modal";
import { MAX_STARTUPS } from "@/types/startup";
import { useT } from "@/i18n/client";

/**
 * Wyjście z teamu. Zawsze dostępne — bycie w czyimś startupie nie może być
 * pułapką. Ostatniego Foundera zatrzyma trigger w bazie i powie dlaczego.
 */
export function LeaveTeamButton({
  startupId,
  teamName,
  asMenu = false,
  canManage = false,
}: {
  startupId: string;
  teamName: string;
  /**
   * Menu ⋮ w nagłówku teamu: „Profil publiczny" (dla Foundera i Admina)
   * i „Opuść team" na końcu, oddzielone kreską. Okno potwierdzenia żyje
   * tutaj, nie w menu — inaczej zniknęłoby razem z nim.
   */
  asMenu?: boolean;
  canManage?: boolean;
}) {
  const t = useT("team");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const confirm = () => {
    setError(null);
    startBusy(async () => {
      const result = await leaveTeam(startupId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push("/app");
      router.refresh();
    });
  };

  return (
    <>
      {asMenu ? (
        <Menu label={t("leave.menu")}>
          {(close) => (
            <>
              {canManage ? (
                <MenuItem
                  icon={Globe}
                  onClick={() => {
                    close();
                    router.push("/app/team/profile");
                  }}
                >
                  {t("leave.publicProfile")}
                </MenuItem>
              ) : null}
              {canManage ? <MenuSeparator /> : null}
              <MenuItem
                icon={LogOut}
                tone="danger"
                onClick={() => {
                  close();
                  setOpen(true);
                }}
              >
                {t("leave.button")}
              </MenuItem>
            </>
          )}
        </Menu>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          <LogOut className="size-4" />
          {t("leave.button")}
        </Button>
      )}

      {open ? (
        <Modal
          title={t("leave.title", { name: teamName })}
          description={t("leave.body")}
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
                {t("leave.stay")}
              </Button>
              <Button variant="danger" loading={busy} onClick={confirm}>
                <LogOut className="size-4" />
                {t("leave.confirm")}
              </Button>
            </>
          }
        >
          {error ? (
            <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-[13px] text-[var(--danger)]">
              {error}
            </p>
          ) : (
            <p className="text-[13px] text-[var(--text-subtle)]">
              {t("leave.freesSeat", { max: MAX_STARTUPS })}
            </p>
          )}
        </Modal>
      ) : null}
    </>
  );
}
