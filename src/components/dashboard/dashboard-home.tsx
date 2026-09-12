const stats = [
  { label: "Aktywne projekty", value: "2" },
  { label: "Taski w progresie", value: "7" },
  { label: "Członkowie zespołu", value: "5" },
  { label: "Możliwości", value: "12" },
];

const recentTasks = [
  { label: "Zdefiniuj problem", status: "Done" as const },
  { label: "Rewizja konkurencji", status: "Done" as const },
  { label: "Pierwsze wywiady z użytkownikami", status: "Jutro" as const },
  { label: "Szkic landing page", status: "W toku" as const },
];

const opportunities = [
  {
    title: "Startup Academy",
    meta: "Program akceleracyjny",
    action: "Aplikuj do 20.07",
    badge: "S",
    tone: "vairo" as const,
  },
  {
    title: "Inkubator UŚ",
    meta: "Nabór do 15.07.2026",
    action: "Szczegóły",
    badge: "I",
    tone: "muted" as const,
  },
  {
    title: "Google for Startups",
    meta: "Program akceleracyjny",
    action: "Aplikuj do 20.07",
    badge: "G",
    tone: "light" as const,
  },
];

const avatarColors = [
  "linear-gradient(135deg,#f9a870,#e8551a)",
  "linear-gradient(135deg,#8ea6f9,#4a5fd0)",
  "linear-gradient(135deg,#9ee0b8,#3d9e69)",
  "linear-gradient(135deg,#f9d78e,#d09a2e)",
  "linear-gradient(135deg,#e79ef9,#a43dbb)",
];

const team = [
  { name: "Ania K.", role: "Product" },
  { name: "Marek W.", role: "Engineering" },
  { name: "Ola P.", role: "Design" },
  { name: "Tomek R.", role: "Growth" },
];

type DashboardHomeProps = {
  displayName: string;
};

export function DashboardHome({ displayName }: DashboardHomeProps) {
  const firstName = displayName.split(" ")[0] || displayName;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="fade-up">
        <h1 className="font-heading text-[1.65rem] font-semibold tracking-tight text-white sm:text-[1.85rem]">
          Cześć, {firstName}
        </h1>
        <p className="mt-1 text-[14px] text-white/45">
          Masz 3 rzeczy do zrobienia dzisiaj
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="fade-up rounded-xl border border-white/[0.06] bg-[#16171c] px-4 py-4"
            style={{ animationDelay: `${80 + i * 40}ms` }}
          >
            <p className="text-[12px] text-white/40">{s.label}</p>
            <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <div
          className="fade-up rounded-xl border border-white/[0.06] bg-[#16171c] p-5"
          style={{ animationDelay: "220ms" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-white">
                Postęp projektu
              </p>
              <p className="mt-0.5 text-[12px] text-white/40">
                Vairo App · MVP Development
              </p>
            </div>
            <span className="rounded-md bg-vairo/15 px-2 py-1 text-[11px] font-medium text-vairo">
              Etap 2/3
            </span>
          </div>

          <div className="mt-5 flex items-end justify-between">
            <span className="text-[13px] text-white/70">Ogólny postęp</span>
            <span className="font-heading text-xl font-semibold text-white">
              72%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#e8551a] to-[#f97636]"
              style={{ width: "72%" }}
            />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { label: "Research", value: "100%" },
              { label: "MVP", value: "72%" },
              { label: "Launch", value: "12%" },
            ].map((stage) => (
              <div
                key={stage.label}
                className="rounded-lg border border-white/[0.05] bg-[#101115] px-3 py-2.5"
              >
                <p className="text-[11px] text-white/40">{stage.label}</p>
                <p className="mt-1 text-[13px] font-semibold text-white">
                  {stage.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="fade-up rounded-xl border border-white/[0.06] bg-[#16171c] p-5"
          style={{ animationDelay: "280ms" }}
        >
          <p className="text-[14px] font-semibold text-white">Ostatnie taski</p>
          <ul className="mt-4 space-y-3">
            {recentTasks.map((t) => (
              <li
                key={t.label}
                className="flex items-center justify-between gap-3"
              >
                <span className="flex min-w-0 items-center gap-2 text-[13px] text-white/70">
                  <span className="size-1.5 shrink-0 rounded-full bg-vairo" />
                  <span className="truncate">{t.label}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    t.status === "Done"
                      ? "bg-white/10 text-white/55"
                      : t.status === "W toku"
                        ? "bg-white/10 text-white/70"
                        : "bg-vairo/20 text-vairo"
                  }`}
                >
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn-vairo mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg text-[13px] font-semibold text-white"
          >
            Dodaj task
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1.15fr]">
        <div
          className="fade-up rounded-xl border border-white/[0.06] bg-[#16171c] p-5"
          style={{ animationDelay: "340ms" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold text-white">Zespół</p>
            <div className="flex -space-x-2">
              {avatarColors.map((bg, i) => (
                <div
                  key={i}
                  className="size-7 rounded-full border-2 border-[#16171c]"
                  style={{ background: bg }}
                />
              ))}
            </div>
          </div>
          <ul className="mt-4 space-y-2.5">
            {team.map((member, i) => (
              <li
                key={member.name}
                className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-[#101115] px-3 py-2.5"
              >
                <div
                  className="size-8 shrink-0 rounded-full"
                  style={{ background: avatarColors[i] }}
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-white">
                    {member.name}
                  </p>
                  <p className="text-[11px] text-white/40">{member.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="fade-up rounded-xl border border-white/[0.06] bg-[#16171c] p-5"
          style={{ animationDelay: "400ms" }}
        >
          <p className="text-[14px] font-semibold text-white">
            Możliwości dla Ciebie
          </p>
          <ul className="mt-4 space-y-2.5">
            {opportunities.map((item) => (
              <li
                key={item.title}
                className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-[#101115] px-3 py-3"
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                    item.tone === "vairo"
                      ? "bg-vairo/20 text-vairo"
                      : item.tone === "light"
                        ? "bg-white text-[#1a1a1a]"
                        : "bg-white/10 text-white/70"
                  }`}
                >
                  {item.badge}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-white">
                    {item.title}
                  </p>
                  <p className="truncate text-[11px] text-white/40">{item.meta}</p>
                </div>
                <span className="shrink-0 text-[11px] text-white/50">
                  {item.action}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
