"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { FeedbackForm } from "./feedback-form";

import { useT } from "@/i18n/client";
/**
 * Pomoc w onboardingu. Aplikacja (i strona Pomocy) otwiera się dopiero po
 * onboardingu, a utknąć da się właśnie tutaj — więc formularz przychodzi
 * w oknie, bez wychodzenia z kroku.
 */
export function OnboardingHelp() {
  const t = useT("help");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-[var(--text-subtle)] transition-colors hover:text-white"
      >
        <LifeBuoy className="size-4" strokeWidth={1.75} aria-hidden="true" />
        {t("onboardingHelp.pomoc")}
      </button>
      {open ? (
        <Modal
          title={t("onboardingHelp.pomocIOpinie")}
          description={t("onboardingHelp.cosNieDzialaAlbo")}
          onClose={() => setOpen(false)}
        >
          <FeedbackForm from={pathname} />
        </Modal>
      ) : null}
    </>
  );
}
