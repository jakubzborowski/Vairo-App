const people = [
  {
    name: "Kuba K.",
    role: "Full-stack Developer",
    tags: ["React", "Node.js", "TypeScript"],
    color: "linear-gradient(135deg,#f9a870,#e8551a)",
  },
  {
    name: "Maria L.",
    role: "UI / UX Designer",
    tags: ["Figma", "UI/UX", "Branding"],
    color: "linear-gradient(135deg,#8ea6f9,#4a5fd0)",
  },
  {
    name: "Paweł W.",
    role: "Growth Marketer",
    tags: ["Growth", "SEO", "Analytics"],
    color: "linear-gradient(135deg,#9ee0b8,#3d9e69)",
  },
];

export function TeamMockup() {
  return (
    <div className="rounded-xl border border-white/8 bg-[#101115] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <p className="text-[13px] font-semibold text-white">Znajdź członków zespołu</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {people.map((person) => (
          <div
            key={person.name}
            className="rounded-lg border border-white/8 bg-[#16171c] p-3"
          >
            <div className="flex items-center gap-2">
              <div
                className="size-8 shrink-0 rounded-full"
                style={{ background: person.color }}
              />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-white">
                  {person.name}
                </p>
                <p className="truncate text-[8px] text-white/45">{person.role}</p>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {person.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/8 px-1.5 py-0.5 text-[7.5px] text-white/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          className="rounded-full bg-white/8 px-3 py-1.5 text-[9px] font-medium text-white/75 transition hover:bg-white/15"
        >
          Zobacz wszystkich
        </button>
      </div>
    </div>
  );
}
