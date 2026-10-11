/** Tylko powrót na ekran etapu. Odrzuca obce adresy i otwarte przekierowania. */
export function safeStageReturn(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/app/stage") || value.startsWith("//")) {
    return null;
  }
  if (value.includes("\\") || value.includes("://")) return null;

  try {
    const url = new URL(value, "http://localhost");
    if (url.pathname !== "/app/stage") return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function withStageReturn(href: string, returnTo: string): string {
  const [path, query] = href.split("?");
  const params = new URLSearchParams(query ?? "");
  params.set("back", returnTo);
  return `${path}?${params.toString()}`;
}
