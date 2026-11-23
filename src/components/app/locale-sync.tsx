"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/i18n/actions";
import { useLocale } from "@/i18n/client";
import { isLocale } from "@/i18n/config";

/**
 * Język z profilu wygrywa z językiem przeglądarki.
 *
 * Ciasteczko na nowym urządzeniu pochodzi z `Accept-Language`, a człowiek
 * mógł wcześniej wybrać inny język w Ustawieniach — wtedy przełączamy raz
 * i odświeżamy. Profil bez języka (konto sprzed migracji 049 albo świeże)
 * dostaje bieżący, żeby powiadomienia i maile znały język odbiorcy.
 */
export function LocaleSync({ profileLocale }: { profileLocale: string | null | undefined }) {
  const current = useLocale();
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    if (isLocale(profileLocale)) {
      if (profileLocale !== current) {
        void setLocale(profileLocale).then(() => router.refresh());
      }
      return;
    }
    // `undefined` = kolumny nie ma (brak migracji 049) — nic nie zapisujemy.
    if (profileLocale === null) void setLocale(current);
  }, [profileLocale, current, router]);

  return null;
}
