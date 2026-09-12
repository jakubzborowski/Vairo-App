const opportunities = [
  {
    title: "Google for Startups",
    meta: "Program akceleracyjny",
    action: "Aplikuj do 20.07",
    badge: "G",
    badgeStyle: { background: "#ffffff", color: "#1a1a1a" },
  },
  {
    title: "Inwestor: KPT Seed Fund",
    meta: "Szukają projektów na etapie MVP",
    action: "Aplikuj do 30.06",
    badge: "K",
    badgeStyle: { background: "#5b4bd0", color: "#ffffff" },
  },
  {
    title: "Demo Day Kraków",
    meta: "Wydarzenie networkingowe",
    action: "25.08.2026",
    badge: "D",
    badgeStyle: { background: "#1f6feb", color: "#ffffff" },
  },
];

export function OpportunitiesMockup() {
  return (
    <div className="rounded-xl border border-white/8 bg-[#101115] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <p className="text-[13px] font-semibold text-white">Możliwości dla Ciebie</p>

      <div className="mt-3 space-y-2">
        {opportunities.map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-2.5 rounded-lg border border-white/8 bg-[#16171c] px-3 py-2.5"
          >
            <div
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={item.badgeStyle}
            >
              {item.badge}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10.5px] font-medium text-white">
                {item.title}
              </p>
              <p className="truncate text-[8px] text-white/40">{item.meta}</p>
            </div>
            <p className="shrink-0 text-[8.5px] text-white/55">{item.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
