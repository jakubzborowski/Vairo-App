import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Users,
  Sparkles,
  MessageSquare,
  BarChart3,
  Settings,
} from "lucide-react";

const sidebar = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Projects", icon: FolderKanban },
  { label: "Tasks", icon: ListChecks },
  { label: "Team", icon: Users },
  { label: "Opportunities", icon: Sparkles },
  { label: "Messages", icon: MessageSquare },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

const stats = [
  { label: "Aktywne projekty", value: "2" },
  { label: "Taski w progresie", value: "7" },
  { label: "Team members", value: "5" },
  { label: "Opportunities", value: "12" },
];

const recentTasks = [
  { label: "Zdefiniuj problem", status: "Done" },
  { label: "Rewizja konkurencji", status: "Done" },
  { label: "Pierwsze wywiady z użytkownikami", status: "Jutro" },
];

const avatarColors = [
  "linear-gradient(135deg,#f9a870,#e8551a)",
  "linear-gradient(135deg,#8ea6f9,#4a5fd0)",
  "linear-gradient(135deg,#9ee0b8,#3d9e69)",
  "linear-gradient(135deg,#f9d78e,#d09a2e)",
  "linear-gradient(135deg,#e79ef9,#a43dbb)",
];

export function HeroDashboardMockup() {
  return (
    <div className="overflow-hidden rounded-xl border border-vairo/30 bg-[#101115] shadow-[0_40px_90px_rgba(0,0,0,0.65),0_0_36px_rgba(238,95,28,0.4),0_0_110px_rgba(238,95,28,0.22),inset_0_0_20px_rgba(238,95,28,0.06)]">
      <div className="flex">
        <aside className="hidden w-[118px] shrink-0 flex-col gap-0.5 border-r border-white/6 bg-[#0b0c0f] px-2 py-3 sm:flex">
          {sidebar.map(({ label, icon: Icon, active }) => (
            <div
              key={label}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 ${
                active ? "bg-vairo/15 text-vairo" : "text-white/45"
              }`}
            >
              <Icon className="size-3" strokeWidth={1.75} />
              <span className="text-[9px] font-medium">{label}</span>
            </div>
          ))}
        </aside>

        <div className="flex-1 p-3">
          <div className="mb-2.5">
            <p className="text-[13px] font-semibold text-white">
              Cześć, Stanisław{" "}
              <span aria-hidden className="align-middle">
                👋
              </span>
            </p>
            <p className="text-[9px] text-white/40">
              Masz 3 rzeczy do zrobienia dzisiaj
            </p>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-white/6 bg-[#16171c] px-2 py-2"
              >
                <p className="text-[7.5px] leading-tight text-white/40">{s.label}</p>
                <p className="mt-1 text-sm font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-1.5 grid grid-cols-[1.15fr_1fr] gap-1.5">
            <div className="rounded-lg border border-white/6 bg-[#16171c] p-2.5">
              <p className="text-[9px] font-semibold text-white">Project progress</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[9px] text-white/70">Vairo App</span>
                <span className="text-[9px] font-semibold text-white">72%</span>
              </div>
              <div className="mt-1 h-[5px] rounded-full bg-white/10">
                <div className="h-full w-[72%] rounded-full bg-vairo" />
              </div>
              <p className="mt-1.5 text-[7.5px] text-white/35">
                MVP Development · Stage 2/3
              </p>
            </div>

            <div className="rounded-lg border border-white/6 bg-[#16171c] p-2.5">
              <p className="text-[9px] font-semibold text-white">Recent tasks</p>
              <ul className="mt-1.5 space-y-1.5">
                {recentTasks.map((t) => (
                  <li key={t.label} className="flex items-center justify-between gap-1">
                    <span className="flex items-center gap-1 truncate text-[8px] text-white/65">
                      <span className="size-1 shrink-0 rounded-full bg-vairo" />
                      {t.label}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-px text-[6.5px] font-medium ${
                        t.status === "Done"
                          ? "bg-white/10 text-white/60"
                          : "bg-vairo/20 text-vairo"
                      }`}
                    >
                      {t.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-1.5 grid grid-cols-[1.15fr_1fr] gap-1.5">
            <div className="rounded-lg border border-white/6 bg-[#16171c] p-2.5">
              <p className="text-[9px] font-semibold text-white">Team</p>
              <div className="mt-2 flex items-center">
                <div className="flex -space-x-1.5">
                  {avatarColors.map((bg, i) => (
                    <div
                      key={i}
                      className="size-6 rounded-full border-2 border-[#16171c]"
                      style={{ background: bg }}
                    />
                  ))}
                </div>
                <span className="ml-2 text-[8px] text-white/45">+2</span>
              </div>
            </div>

            <div className="rounded-lg border border-white/6 bg-[#16171c] p-2.5">
              <p className="text-[9px] font-semibold text-white">Opportunities</p>
              <ul className="mt-1.5 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-vairo/20 text-[7px] font-bold text-vairo">
                    S
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[8px] font-medium text-white/85">
                      Startup Academy
                    </p>
                    <p className="truncate text-[6.5px] text-white/35">
                      Program akceleracyjny
                    </p>
                  </div>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-[7px] font-bold text-white/70">
                    I
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[8px] font-medium text-white/85">
                      Inkubator UŚ
                    </p>
                    <p className="truncate text-[6.5px] text-white/35">
                      Nabór do 15.07.2026
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
