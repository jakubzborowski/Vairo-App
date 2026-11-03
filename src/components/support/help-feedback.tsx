"use client";

import { useToast } from "@/components/ui/toast";
import { FeedbackForm } from "./feedback-form";
import type { SupportKind } from "@/types/support";

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
  const { toast } = useToast();
  return (
    <FeedbackForm
      from={from}
      initialKind={initialKind}
      errorCode={errorCode}
      onSent={(reference) =>
        toast({
          title: "Zgłoszenie wysłane",
          description: `Numer ${reference}. Odpowiedź przyjdzie mailem.`,
        })
      }
    />
  );
}
