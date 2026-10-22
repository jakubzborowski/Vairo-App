"use client";

import { useLayoutEffect, useRef } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Menu, MenuItem } from "@/components/ui/menu";
import { cn } from "@/lib/utils";
import type { RozpiskaEdge, RozpiskaNode } from "@/app/app/workflows/actions";

const NODE_W = 140;
const NODE_H = 40;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Bloczek jedzie na warstwie kompozytora. W trakcie ruchu nie czytamy układu
 * strony i nie wołamy setState — stąd poprzednie zacięcia.
 */
export function RozpiskaBoard({
  nodes,
  edges,
  onMove,
  onRename,
  onConnect,
  onRemoveEdge,
  onRemoveNode,
  className,
  children,
}: {
  className?: string;
  /** Narzędzia leżące na płótnie (dodaj bloczek, podpowiedź). */
  children?: React.ReactNode;
  nodes: RozpiskaNode[];
  edges: RozpiskaEdge[];
  onMove: (id: string, x: number, y: number) => void;
  onRename: (id: string, label: string) => void;
  onConnect: (fromId: string, toId: string) => void;
  onRemoveEdge: (edgeId: string) => void;
  onRemoveNode: (nodeId: string) => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, { x: number; y: number }>());
  const sizes = useRef(new Map<string, { w: number; h: number }>());
  const nodeEls = useRef(new Map<string, HTMLDivElement>());
  const lineEls = useRef(new Map<string, { wide: SVGLineElement | null; thin: SVGLineElement | null }>());
  const edgesRef = useRef(edges);
  const nodesRef = useRef(nodes);
  const previewRef = useRef<SVGLineElement>(null);
  const link = useRef<{ fromId: string; x: number; y: number; left: number; top: number } | null>(null);
  const hoverRef = useRef<string | null>(null);
  const drag = useRef<{ id: string } | null>(null);
  const frame = useRef(0);

  const paint = () => {
    frame.current = 0;
    for (const [id, pos] of positions.current) {
      const el = nodeEls.current.get(id);
      if (!el) continue;
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    }
    for (const edge of edgesRef.current) {
      const pair = lineEls.current.get(edge.id);
      const from = positions.current.get(edge.from);
      const to = positions.current.get(edge.to);
      if (!pair?.wide || !pair.thin || !from || !to) continue;
      const fromSize = sizes.current.get(edge.from);
      const toSize = sizes.current.get(edge.to);
      const x1 = String(from.x + (fromSize?.w ?? NODE_W) / 2);
      const y1 = String(from.y + (fromSize?.h ?? NODE_H) / 2);
      const x2 = String(to.x + (toSize?.w ?? NODE_W) / 2);
      const y2 = String(to.y + (toSize?.h ?? NODE_H) / 2);
      for (const line of [pair.wide, pair.thin]) {
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
      }
    }

    const preview = previewRef.current;
    const active = link.current;
    if (preview) {
      if (!active) {
        preview.setAttribute("visibility", "hidden");
      } else {
        const from = positions.current.get(active.fromId);
        const fromSize = sizes.current.get(active.fromId);
        preview.setAttribute("visibility", "visible");
        preview.setAttribute("x1", String((from?.x ?? 0) + (fromSize?.w ?? NODE_W)));
        preview.setAttribute("y1", String((from?.y ?? 0) + (fromSize?.h ?? NODE_H) / 2));
        preview.setAttribute("x2", String(active.x));
        preview.setAttribute("y2", String(active.y));
      }
    }

    const nextHover = active ? hitNode(active.x, active.y, active.fromId) : null;
    if (nextHover !== hoverRef.current) {
      const previous = hoverRef.current ? nodeEls.current.get(hoverRef.current) : null;
      if (previous) previous.style.boxShadow = "";
      const next = nextHover ? nodeEls.current.get(nextHover) : null;
      if (next) next.style.boxShadow = "0 0 0 1px var(--vairo)";
      hoverRef.current = nextHover;
    }
  };

  const hitNode = (x: number, y: number, ignore: string) => {
    let found: string | null = null;
    for (const node of nodesRef.current) {
      if (node.id === ignore) continue;
      const pos = positions.current.get(node.id);
      if (!pos) continue;
      const size = sizes.current.get(node.id);
      const width = size?.w ?? NODE_W;
      const height = size?.h ?? NODE_H;
      if (x >= pos.x && x <= pos.x + width && y >= pos.y && y <= pos.y + height) found = node.id;
    }
    return found;
  };

  const schedule = () => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(paint);
  };

  useLayoutEffect(() => {
    edgesRef.current = edges;
    nodesRef.current = nodes;
    if (!drag.current) {
      const live = new Set(nodes.map((node) => node.id));
      for (const id of positions.current.keys()) {
        if (!live.has(id)) positions.current.delete(id);
      }
      for (const node of nodes) positions.current.set(node.id, { x: node.x, y: node.y });
    }
    for (const node of nodes) {
      const el = nodeEls.current.get(node.id);
      if (!el) continue;
      sizes.current.set(node.id, { w: el.offsetWidth, h: el.offsetHeight });
    }
    paint();
  });

  const startConnect = (event: React.PointerEvent<HTMLButtonElement>, node: RozpiskaNode) => {
    if (event.button !== 0) return;
    const board = boardRef.current;
    if (!board) return;
    event.stopPropagation();
    event.preventDefault();

    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const rect = board.getBoundingClientRect();
    const left = rect.left + board.clientLeft;
    const top = rect.top + board.clientTop;
    link.current = {
      fromId: node.id,
      x: event.clientX - left,
      y: event.clientY - top,
      left,
      top,
    };
    schedule();

    const move = (ev: PointerEvent) => {
      if (!link.current) return;
      link.current = {
        ...link.current,
        x: ev.clientX - link.current.left,
        y: ev.clientY - link.current.top,
      };
      schedule();
    };
    const end = (ev: PointerEvent) => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", end);
      handle.removeEventListener("pointercancel", end);
      const current = link.current;
      link.current = null;
      if (!current) return;
      const target = hitNode(ev.clientX - current.left, ev.clientY - current.top, current.fromId);
      schedule();
      if (!target) return;
      if (edgesRef.current.some((edge) => edge.from === current.fromId && edge.to === target)) return;
      onConnect(current.fromId, target);
    };

    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  };

  const startDrag = (event: React.PointerEvent<HTMLDivElement>, node: RozpiskaNode) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-connect], [data-remove]")) return;
    if (target.closest("input") && document.activeElement === target) return;

    const el = event.currentTarget;
    const board = boardRef.current;
    event.preventDefault();
    el.setPointerCapture(event.pointerId);
    drag.current = { id: node.id };

    const origin = positions.current.get(node.id) ?? { x: node.x, y: node.y };
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    sizes.current.set(node.id, { w: width, h: height });
    const min = 8;
    const maxX = Math.max(min, (board?.clientWidth ?? width) - width);
    const maxY = Math.max(min, (board?.clientHeight ?? height) - height);
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && dx * dx + dy * dy < 9) return;
      if (!moved) el.querySelector("input")?.blur();
      moved = true;
      positions.current.set(node.id, {
        x: clamp(origin.x + dx, min, maxX),
        y: clamp(origin.y + dy, min, maxY),
      });
      schedule();
    };

    const end = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
      const pos = positions.current.get(node.id) ?? origin;
      drag.current = null;
      if (moved) onMove(node.id, pos.x, pos.y);
      else {
        const input = el.querySelector("input");
        input?.focus();
        input?.select();
      }
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  };

  return (
    <div
      ref={boardRef}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface)] topo",
        className
      )}
      style={{ contain: "layout paint" }}
    >
      {children}
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {edges.map((edge) => (
          <g
            key={edge.id}
            className="group pointer-events-auto cursor-pointer"
            onClick={() => onRemoveEdge(edge.id)}
          >
            <line
              ref={(element) => {
                const pair = lineEls.current.get(edge.id) ?? { wide: null, thin: null };
                pair.wide = element;
                if (!pair.wide && !pair.thin) lineEls.current.delete(edge.id);
                else lineEls.current.set(edge.id, pair);
              }}
              stroke="transparent"
              strokeWidth="14"
              style={{ pointerEvents: "stroke" }}
            >
              <title>Usuń strzałkę</title>
            </line>
            <line
              ref={(element) => {
                const pair = lineEls.current.get(edge.id) ?? { wide: null, thin: null };
                pair.thin = element;
                if (!pair.wide && !pair.thin) lineEls.current.delete(edge.id);
                else lineEls.current.set(edge.id, pair);
              }}
              className="pointer-events-none stroke-white/45 group-hover:stroke-[var(--vairo)]"
              strokeWidth="1.5"
              markerEnd="url(#rozpiska-arrow)"
            />
          </g>
        ))}
        <line
          ref={previewRef}
          visibility="hidden"
          className="pointer-events-none"
          stroke="var(--vairo)"
          strokeWidth="1.5"
          markerEnd="url(#rozpiska-arrow-live)"
        />
        <defs>
          <marker id="rozpiska-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6" fill="rgba(255,255,255,.55)" />
          </marker>
          <marker id="rozpiska-arrow-live" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6" fill="var(--vairo)" />
          </marker>
        </defs>
      </svg>
      {nodes.map((node) => (
        <div
          key={node.id}
          ref={(element) => {
            if (element) nodeEls.current.set(node.id, element);
            else nodeEls.current.delete(node.id);
          }}
          className="absolute top-0 left-0 w-[140px] cursor-grab touch-none rounded-xl border border-white/15 bg-[var(--surface-2)] py-2 pr-6 pl-6 shadow-[0_4px_14px_rgba(0,0,0,.35)] select-none will-change-transform"
          onPointerDown={(event) => startDrag(event, node)}
        >
          <input
            className="pointer-events-none w-full bg-transparent text-[13px] text-white outline-none focus:pointer-events-auto"
            value={node.label}
            aria-label="Nazwa bloczka"
            onChange={(event) => onRename(node.id, event.target.value)}
          />
          {/* Usuwanie jest w menu bloczka, nie jako „×" po lewej — krzyżyk tuż
              obok nazwy łapał przypadkowe kliknięcia przy przeciąganiu. */}
          <span
            data-remove
            className="absolute top-1/2 left-0.5 -translate-y-1/2"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <Menu
              label={`Akcje bloczka ${node.label || ""}`.trim()}
              align="left"
              triggerClassName="size-5 justify-center rounded-md text-[var(--text-subtle)] hover:bg-white/[0.08] hover:text-white"
              trigger={<MoreHorizontal className="size-3.5" />}
            >
              {(close) => (
                <MenuItem
                  icon={Trash2}
                  tone="danger"
                  onClick={() => {
                    close();
                    onRemoveNode(node.id);
                  }}
                >
                  Usuń bloczek
                </MenuItem>
              )}
            </Menu>
          </span>
          <button
            type="button"
            data-connect
            aria-label="Pociągnij strzałkę do innego bloczka"
            className="absolute top-1/2 right-0 flex size-6 -translate-y-1/2 cursor-crosshair items-center justify-center"
            onPointerDown={(event) => startConnect(event, node)}
          >
            <span className="size-2.5 rounded-full bg-white/55" />
          </button>
        </div>
      ))}
    </div>
  );
}
