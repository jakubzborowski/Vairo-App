import type { RozpiskaEdge, RozpiskaNode } from "@/app/app/workflows/actions";

const NODE_W = 140;
const NODE_H = 40;

/**
 * Miniatura planu — mówi „to jest plan z bloczków", zanim cokolwiek się
 * przeczyta. Skaluje cały rysunek do kafelka, zachowując proporcje.
 */
export function WorkflowThumb({
  nodes,
  edges,
}: {
  nodes: RozpiskaNode[];
  edges: RozpiskaEdge[];
}) {
  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-[var(--text-subtle)]">
        Puste płótno
      </div>
    );
  }
  const minX = Math.min(...nodes.map((node) => node.x));
  const minY = Math.min(...nodes.map((node) => node.y));
  const maxX = Math.max(...nodes.map((node) => node.x + NODE_W));
  const maxY = Math.max(...nodes.map((node) => node.y + NODE_H));
  const pad = 24;
  const box = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  const center = (id: string) => {
    const node = nodes.find((item) => item.id === id);
    return node ? { x: node.x + NODE_W / 2, y: node.y + NODE_H / 2 } : null;
  };

  return (
    <svg viewBox={box} preserveAspectRatio="xMidYMid meet" className="h-full w-full" aria-hidden="true">
      {edges.map((edge) => {
        const from = center(edge.from);
        const to = center(edge.to);
        if (!from || !to) return null;
        return (
          <line
            key={edge.id}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="rgba(255,255,255,.28)"
            strokeWidth={4}
          />
        );
      })}
      {nodes.map((node) => (
        <rect
          key={node.id}
          x={node.x}
          y={node.y}
          width={NODE_W}
          height={NODE_H}
          rx={12}
          fill="var(--surface-3)"
          stroke="rgba(255,255,255,.22)"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}
