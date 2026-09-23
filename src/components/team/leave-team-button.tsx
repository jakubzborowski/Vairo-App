"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { leaveTeam } from "@/app/app/team/actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { MAX_STARTUPS } from "@/types/startup";

/**
 * Wyjście z teamu. Zawsze dostępne — bycie w czyimś startupie nie może być
 * pułapką. Ostatniego Foundera zatrzyma trigger w bazie i powie dlaczego.
 */
export function LeaveTeamButton({
  startupId,
  teamName,
}: {
  startupId: string;
  teamName: string;
}) {
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
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <LogOut className="size-4" />
        Opuść team
      </Button>

      {open ? (
        <Modal
          title={`Opuścić ${teamName}?`}
          description="Stracisz dostęp do etapów, dokumentów i wszystkiego, co należy do tego teamu. To, co już wypełniłeś, zostaje z zespołem."
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
                Zostaję
              </Button>
              <Button variant="danger" loading={busy} onClick={confirm}>
                <LogOut className="size-4" />
                Opuszczam team
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
              Zwolni się jedno z {MAX_STARTUPS} miejsc na Twoim koncie.
            </p>
          )}
        </Modal>
      ) : null}
    </>
  );
}
