"use client";

import { useToast } from "@/components/ui/toast";
import { FeedbackForm } from "./feedback-form";
import type { SupportKind } from "@/types/support";

import { useT } from "@/i18n/client";
/** Formularz na stronie Pomocy — z potwierdzeniem w toaście, jak każda akcja w /app. */
export function HelpFeedback({
  from,
  initialKind,
  errorCode,
}: {
  from: string | null;
  initialKind: SupportKind | null;
  errorCode?: string | null;
}) {
  const t = useT("help");
  const { toast } = useToast();
  return (
    <FeedbackForm
      from={from}
      initialKind={initialKind}
      errorCode={errorCode}
      onSent={(reference) =>
        toast({
          title: t("helpFeedback.zgloszenieWyslane"),
          description: t("helpFeedback.numerReferenceOdpowiedzPrzyjdzie", { reference }),
        })
      }
    />
  );
}
