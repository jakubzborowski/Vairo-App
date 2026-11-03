"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { FeedbackForm } from "./feedback-form";

/**
 * Pomoc w onboardingu. Aplikacja (i strona Pomocy) otwiera się dopiero po
 * onboardingu, a utknąć da się właśnie tutaj — więc formularz przychodzi
 * w oknie, bez wychodzenia z kroku.
 */
export function OnboardingHelp() {
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
        Pomoc
      </button>
      {open ? (
        <Modal
          title="Pomoc i opinie"
          description="Coś nie działa albo czegoś nie rozumiesz? Napisz — przeczyta to zespół Vairo."
          onClose={() => setOpen(false)}
        >
          <FeedbackForm from={pathname} />
        </Modal>
      ) : null}
    </>
  );
}
