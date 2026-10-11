"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Potwierdzenia akcji w prawym dolnym rogu.
 *
 * Do tej pory zapis kończył się tak, że po prostu nic się nie działo — dane
 * szły do bazy, strona się odświeżała i człowiek musiał sam się domyślić, czy
 * zadziałało. **Brak potwierdzenia nie jest neutralny: czyta się jak
 * niepewność.** Przy pierwszym kontakcie z aplikacją, w której zostawia się
 * swoje dane i wysyła wiadomości do obcych, to jest dokładnie ta rzecz, która
 * buduje albo podkopuje zaufanie.
 *
 * Trzy decyzje, które o tym przesądzają:
 *
 *   • **Prawy dolny róg.** Nie zasłania nagłówka ani akcji głównej, a jest
 *     w polu widzenia peryferyjnego. Góra ekranu należy do treści.
 *   • **Sukces znika sam po 4 s, błąd NIE.** Potwierdzenie przeczytane raz
 *     przestaje być potrzebne; komunikat o błędzie trzeba zdążyć przeczytać
 *     i czasem przepisać, więc czeka na zamknięcie.
 *   • **`aria-live="polite"`.** Czytnik ekranu ogłasza treść, ale nie
 *     przerywa tego, co użytkownik właśnie robi.
 */

export type ToastTone = "success" | "error" | "info";

type Toast = {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
};

type ToastContextValue = {
  toast: (input: { tone?: ToastTone; title: string; description?: string }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/** Domyślny czas życia. Błąd dostaje `null` — zostaje do zamknięcia. */
const LIFETIME: Record<ToastTone, number | null> = {
  success: 4000,
  info: 5000,
  error: null,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    ({ tone = "success", title, description }) => {
      const id = nextId.current++;
      setToasts((current) => {
        // Trzy naraz to maksimum. Kolejka dziesięciu powiadomień zasłania
        // ekran i przestaje być potwierdzeniem, a staje się przeszkodą.
        const next = [...current, { id, tone, title, description }];
        return next.slice(-3);
      });
    },
    []
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[360px]"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} toast={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const life = LIFETIME[toast.tone];
    if (life === null) return;
    const id = window.setTimeout(onDismiss, life);
    return () => window.clearTimeout(id);
  }, [toast.tone, onDismiss]);

  const Icon =
    toast.tone === "success" ? Check : toast.tone === "error" ? AlertTriangle : Info;

  const accent =
    toast.tone === "success"
      ? "text-[var(--success)]"
      : toast.tone === "error"
        ? "text-[var(--danger)]"
        : "text-[var(--vairo)]";

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={cn(
        "toast-in pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-white/10",
        "bg-[var(--surface-2)] px-4 py-3 lift-3 backdrop-blur"
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", accent)} strokeWidth={2.5} />

      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium text-white">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--text-subtle)]">
            {toast.description}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Zamknij"
        className="-mr-1 -mt-1 rounded-md p-1 text-[var(--text-faint)] transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

/**
 * Dostęp do toastów.
 *
 * Poza `ToastProvider` zwraca funkcję, która nic nie robi, zamiast rzucać
 * wyjątkiem. Powód: komponenty akcji (przyciski zaproszeń, formularze) są
 * używane też w miejscach renderowanych bez powłoki aplikacji — brak
 * potwierdzenia jest tam akceptowalny, wywrócenie strony nie.
 */
export function useToast(): ToastContextValue {
  return useContext(ToastContext) ?? { toast: () => {} };
}
