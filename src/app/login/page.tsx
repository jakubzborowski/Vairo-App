import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("auth");
  return { title: t("login.metaTitle"), description: t("login.metaDescription") };
}

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
