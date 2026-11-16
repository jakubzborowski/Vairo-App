import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/supabase/config";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Aplikacja żyje na app.vairo-network.com, a strona główna Vairo jest osobnym
 * projektem na vairo-network.com. Tutaj nie ma już czego pokazywać — wejście
 * na `/` prowadzi prosto do logowania. Zalogowanego proxy przerzuca z
 * `/login` dalej (do `/app` albo do onboardingu), więc nikt nie utyka.
 *
 * `?code=` zostaje obsłużony jak wcześniej: Supabase potrafi odesłać link
 * z maila na Site URL zamiast na `/auth/callback`.
 */
export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : null;

  if (code) {
    const next = safeNextPath(
      typeof params.next === "string" ? params.next : null,
      "/app"
    );
    redirect(
      `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
    );
  }

  redirect("/login");
}
