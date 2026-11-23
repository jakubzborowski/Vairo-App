"use client";

import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OPEN_TOUR_EVENT } from "@/components/app/welcome-tour";

import { useT } from "@/i18n/client";
/** Ponowne otwarcie samouczka z poziomu strony Pomocy. */
export function OpenTourButton() {
  const t = useT("help");
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => window.dispatchEvent(new Event(OPEN_TOUR_EVENT))}
    >
      <GraduationCap className="size-3.5" />
      {t("openTourButton.pokazSamouczek")}
    </Button>
  );
}
