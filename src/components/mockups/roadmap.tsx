const stages = [
  { step: "Etap 1", label: "Problem" },
  { step: "Etap 2", label: "Walidacja" },
  { step: "Etap 3", label: "MVP", active: true },
  { step: "Etap 4", label: "Testy" },
  { step: "Etap 5", label: "Skalowanie" },
];

const tasks = [
  { title: "Zbuduj prototyp", progress: 74, deadline: "14.06.2026", owner: "Ty" },
  { title: "Testy z użytkownikami", progress: 38, deadline: "21.06.2026", owner: "Kuba" },
  { title: "Iteracja produktu", progress: 12, deadline: "30.06.2026", owner: "Ty" },
];

export function RoadmapMockup() {
  return (
    <div className="rounded-xl border border-white/8 bg-[#101115] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <p className="text-[13px] font-semibold text-white">Roadmapa projektu</p>

      <div className="mt-3 flex items-center gap-1">
        {stages.map((stage, i) => (
          <div key={stage.step} className="flex flex-1 items-center gap-1">
            <div
              className={`flex-1 rounded-lg border px-2 py-1.5 ${
                stage.active
                  ? "border-vairo bg-vairo/10"
                  : "border-white/8 bg-[#16171c]"
              }`}
            >
              <p
                className={`text-[7.5px] ${
                  stage.active ? "text-vairo/80" : "text-white/35"
                }`}
              >
                {stage.step}
              </p>
              <p
                className={`text-[9px] font-semibold ${
                  stage.active ? "text-vairo" : "text-white/70"
                }`}
              >
                {stage.label}
              </p>
            </div>
            {i < stages.length - 1 && (
              <span className="hidden text-[9px] text-white/25 sm:inline" aria-hidden>
                ›
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-white/8 bg-[#16171c] p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-medium text-white/55">Zadania</p>
          <p className="text-[8px] text-white/35">Deadline</p>
        </div>
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div key={task.title} className="grid grid-cols-[1fr_auto] items-center gap-3">
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-vairo" />
                  <span className="text-[9px] text-white/80">{task.title}</span>
                  <span className="ml-auto text-[8px] text-white/40">
                    {task.progress}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-vairo"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
              <div className="w-14 text-right">
                <p className="text-[8px] text-white/50">{task.deadline}</p>
                <p className="text-[7.5px] text-white/30">{task.owner}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
