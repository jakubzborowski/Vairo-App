"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { markAllNotificationsRead } from "@/app/app/notifications/actions";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

/** „Przeczytane" dla całej skrzynki — jedno kliknięcie zamiast dwudziestu. */
export function MarkReadButton({ unreadCount }: { unreadCount: number }) {
  const t = useT("notifications");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  if (unreadCount === 0) return null;

  return (
    <div className="text-right">
      <Button
        variant="secondary"
        size="sm"
        loading={busy}
        onClick={() =>
          startBusy(async () => {
            const result = await markAllNotificationsRead();
            if (result.error) {
              setError(result.error);
              return;
            }
            router.refresh();
          })
        }
      >
        <CheckCheck className="size-4" />
        {t("page.markAllRead")}
      </Button>
      {error ? (
        <p className="mt-2 text-[12.5px] text-[var(--danger)]">{error}</p>
      ) : null}
    </div>
  );
}
