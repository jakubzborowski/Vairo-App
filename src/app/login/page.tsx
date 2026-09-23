import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Zaloguj się — Vairo",
  description: "Zaloguj się do Vairo magic linkiem, Google lub Apple.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <AuthShell>
      <AuthForm mode="login" initialErrorCode={error} />
    </AuthShell>
  );
}
