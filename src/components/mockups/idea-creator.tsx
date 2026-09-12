import {
  Wallet,
  Brain,
  HeartPulse,
  GraduationCap,
  Store,
  Leaf,
} from "lucide-react";

const categories = [
  { label: "Fintech", icon: Wallet },
  { label: "AI / Machine Learning", icon: Brain, selected: true },
  { label: "Health", icon: HeartPulse },
  { label: "Education", icon: GraduationCap },
  { label: "Marketplace", icon: Store },
  { label: "Sustainability", icon: Leaf },
];

const signals = [
  "Szybka walidacja",
  "Duży rynek",
  "Rosnące zapotrzebowanie",
  "Niska konkurencja",
];

export function IdeaCreatorMockup() {
  return (
    <div className="rounded-xl border border-white/8 bg-[#101115] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <p className="text-[13px] font-semibold text-white">Kreator pomysłu</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-[10px] font-medium text-white/55">
            Wybierz obszar, który Cię interesuje
          </p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {categories.map(({ label, icon: Icon, selected }) => (
              <div
                key={label}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border px-1.5 py-2.5 text-center ${
                  selected
                    ? "border-vairo bg-vairo/10"
                    : "border-white/8 bg-[#16171c]"
                }`}
              >
                <Icon
                  className={`size-3.5 ${selected ? "text-vairo" : "text-white/45"}`}
                  strokeWidth={1.75}
                />
                <span
                  className={`text-[8px] leading-tight ${
                    selected ? "font-medium text-vairo" : "text-white/60"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/8 bg-[#16171c] p-3">
          <p className="text-[10px] font-medium text-white/55">Ocena potencjału</p>
          <div className="mt-2.5 flex items-center gap-2.5">
            <div className="relative size-12 shrink-0">
              <svg viewBox="0 0 36 36" className="size-12 -rotate-90">
                <circle cx="18" cy="18" r="14.5" fill="none" stroke="#26272d" strokeWidth="4" />
                <circle
                  cx="18"
                  cy="18"
                  r="14.5"
                  fill="none"
                  stroke="url(#scoreGrad)"
                  strokeWidth="4"
                  strokeDasharray="77.4 91.1"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#ee5f1c" />
                    <stop offset="0.7" stopColor="#f9c03f" />
                    <stop offset="1" stopColor="#4ade80" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-white">
                85
              </span>
            </div>
            <p className="text-[11px] font-semibold leading-tight text-white">
              Wysoki potencjał
            </p>
          </div>
          <ul className="mt-2.5 space-y-1">
            {signals.map((s) => (
              <li key={s} className="flex items-center gap-1.5 text-[8.5px] text-white/55">
                <span className="size-1 shrink-0 rounded-full bg-green-400" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
