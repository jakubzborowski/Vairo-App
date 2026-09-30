import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Dołącz do Vairo",
  description: "Załóż konto Vairo magic linkiem, Google lub Apple.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <AuthShell>
      <AuthForm mode="register" initialErrorCode={error} />
    </AuthShell>
  );
}
