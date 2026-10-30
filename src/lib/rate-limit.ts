/**
 * Prosty limit zapytań w pamięci (okno przesuwne).
 *
 * Uczciwie o ograniczeniach: Vercel uruchamia kilka instancji funkcji, a każda
 * ma własną pamięć — limit działa na instancję, nie globalnie, i zeruje się
 * przy zimnym starcie. Na nasz cel (żeby jedna osoba nie wyczerpała darmowego
 * limitu Groq, klikając w kółko) to wystarcza, bo endpoint i tak wymaga
 * zalogowania. Twardy limit globalny to Upstash/Vercel KV albo tabela
 * w Supabase — do dołożenia, jeśli kiedyś będzie potrzebny.
 */
const hits = new Map<string, number[]>();

export function takeToken(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  // Sprzątanie, żeby mapa nie rosła bez końca na długo żyjącej instancji.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }
  return true;
}
