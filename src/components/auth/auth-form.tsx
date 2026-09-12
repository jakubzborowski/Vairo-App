"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { AppleIcon, GoogleIcon } from "@/components/auth/provider-icons";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage, safeNextPath } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

function getAuthRedirectTo() {
  const next = safeNextPath(
    new URLSearchParams(window.location.search).get("next"),
    "/app"
  );
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("next", next);
  return url.toString();
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [providerPending, setProviderPending] = useState<
    "google" | "apple" | null
  >(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (!error) return;
    setStatus("error");
    setErrorMessage(authErrorMessage(error));
  }, []);

  const isLogin = mode === "login";
  const title = isLogin ? "Zaloguj się do Vairo" : "Dołącz do Vairo";
  const subtitle = isLogin
    ? "Wejdź magic linkiem albo kontynuuj przez Google / Apple."
    : "Załóż konto magic linkiem albo przez Google / Apple.";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMessage("Podaj poprawny adres e-mail.");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: getAuthRedirectTo(),
        shouldCreateUser: !isLogin,
      },
    });

    if (error) {
      setErrorMessage(
        error.message === "Signups not allowed for otp"
          ? "Nie znaleziono konta z tym adresem. Zarejestruj się."
          : error.message
      );
      setStatus("error");
      return;
    }

    setStatus("sent");
  };

  const onProvider = async (provider: "google" | "apple") => {
    setProviderPending(provider);
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getAuthRedirectTo(),
        queryParams:
          provider === "google"
            ? { access_type: "online", prompt: "select_account" }
            : undefined,
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      const notConfigured =
        msg.includes("provider is not enabled") ||
        msg.includes("unsupported provider") ||
        msg.includes("validation_failed");
      setErrorMessage(
        notConfigured
          ? provider === "google"
            ? "Google nie jest jeszcze włączone w Supabase (Authentication → Providers)."
            : "Apple nie jest jeszcze włączone w Supabase (Authentication → Providers)."
          : error.message
      );
      setProviderPending(null);
    }
  };

  if (status === "sent") {
    return (
      <div className="text-center">
        <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white sm:text-[1.85rem]">
          Sprawdź skrzynkę
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-white/55">
          Wysłaliśmy magic link na{" "}
          <span className="text-white/90">{email.trim()}</span>. Kliknij go, żeby{" "}
          {isLogin ? "się zalogować" : "dokończyć rejestrację"}.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-8 text-[14px] font-medium text-white/70 transition hover:text-white"
        >
          Użyj innego adresu
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white sm:text-[1.85rem]">
        {title}
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-white/50">{subtitle}</p>

      {status === "error" && errorMessage && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {errorMessage}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-3" noValidate>
        <label className="block">
          <span className="sr-only">Adres e-mail</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            placeholder="Adres e-mail"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            className={cn(
              "h-11 w-full rounded-lg border bg-[#0c0d11] px-3.5 text-[14px] text-white outline-none transition placeholder:text-white/35",
              "focus:border-vairo/70 focus:ring-2 focus:ring-vairo/25",
              status === "error"
                ? "border-red-500/60"
                : "border-white/12 hover:border-white/20"
            )}
          />
        </label>

        <button
          type="submit"
          disabled={status === "sending"}
          className="btn-vairo inline-flex h-11 w-full items-center justify-center rounded-lg text-[14px] font-semibold text-white transition disabled:opacity-60"
        >
          {status === "sending" ? "Wysyłanie…" : "Wyślij magic link"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[12px] uppercase tracking-wider text-white/35">
          lub
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="space-y-2.5">
        <button
          type="button"
          onClick={() => onProvider("google")}
          disabled={providerPending !== null}
          className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-white/12 bg-transparent text-[14px] font-medium text-white transition hover:border-white/25 hover:bg-white/[0.04] disabled:opacity-60"
        >
          <GoogleIcon className="size-[18px]" />
          {providerPending === "google"
            ? "Łączenie…"
            : "Kontynuuj z Google"}
        </button>
        <button
          type="button"
          onClick={() => onProvider("apple")}
          disabled={providerPending !== null}
          className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-white/12 bg-transparent text-[14px] font-medium text-white transition hover:border-white/25 hover:bg-white/[0.04] disabled:opacity-60"
        >
          <AppleIcon className="size-[18px]" />
          {providerPending === "apple"
            ? "Łączenie…"
            : "Kontynuuj z Apple"}
        </button>
      </div>

      <p className="mt-8 text-center text-[13px] text-white/45">
        {isLogin ? (
          <>
            Nie masz konta?{" "}
            <Link
              href="/register"
              className="font-medium text-vairo-soft transition hover:text-vairo"
            >
              Zarejestruj się
            </Link>
          </>
        ) : (
          <>
            Masz już konto?{" "}
            <Link
              href="/login"
              className="font-medium text-vairo-soft transition hover:text-vairo"
            >
              Zaloguj się
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
