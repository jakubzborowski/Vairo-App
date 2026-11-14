"use client";

import { useEffect } from "react";
import { identifyUser } from "@/lib/analytics";

/** Przypisuje zdarzenia do konta po wejściu do /app. Tylko id — bez e-maila i imienia. */
export function PosthogIdentify({ userId }: { userId: string }) {
  useEffect(() => {
    identifyUser(userId);
  }, [userId]);
  return null;
}
