"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { BoardLineConnectorStyle } from "@/lib/board-line-connector";
import {
  POLYGON_KINDS,
  type PolygonKind,
  type PolygonKindSection,
} from "@/lib/board-polygon-kinds";
import {
  ShapeMenuIconConnectorArcDown,
  ShapeMenuIconConnectorArcUp,
  ShapeMenuIconConnectorArrow,
  ShapeMenuIconConnectorArrowBoth,
  ShapeMenuIconConnectorOrthogonal,
  ShapeMenuIconEllipse,
  ShapeMenuIconRectangle,
  ShapeMenuPolygonIcon,
} from "@/components/board-shapes-menu-icons";

type BoardShapesMenuProps = {
  open: boolean;
  onClose: () => void;
  busy: boolean;
  onPickRect: () => void;
  onPickCircle: () => void;
  onPickPolygon: (kind: PolygonKind) => void;
  /** Start two-point connector tool with the given style (clears drawing rail modes in parent). */
  onPickLineConnector: (style: BoardLineConnectorStyle) => void;
  placement?: "below" | "right";
};

const CONNECTION_ITEMS: {
  style: BoardLineConnectorStyle;
  title: string;
  Icon: (props: { className?: string }) => ReactNode;
}[] = [
  {
    style: "arrow",
    title:
      "Straight arrow — click twice on the board for start and end points",
    Icon: ShapeMenuIconConnectorArrow,
  },
  {
    style: "arrowBoth",
    title:
      "Bidirectional arrow — click twice on the board for start and end points",
    Icon: ShapeMenuIconConnectorArrowBoth,
  },
  {
    style: "orthogonalBoth",
    title:
      "Orthogonal connector — click twice; path uses a horizontal midpoint elbow with arrows at both ends",
    Icon: ShapeMenuIconConnectorOrthogonal,
  },
  {
    style: "arcUp",
    title:
      "Curved connector (arc upward) — click twice on the board for start and end points",
    Icon: ShapeMenuIconConnectorArcUp,
  },
  {
    style: "arcDown",
    title:
      "Curved connector (arc downward) — click twice on the board for start and end points",
    Icon: ShapeMenuIconConnectorArcDown,
  },
];

const sectionLabel: Record<PolygonKindSection, string> = {
  basic: "Basic",
  flowchart: "Flowchart",
};

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="mb-2 border-b border-zinc-100 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-700 dark:text-zinc-500">
      {children}
    </p>
  );
}

function IconShapeButton({
  title,
  busy,
  onClick,
  children,
}: {
  title: string;
  busy: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      <span className="pointer-events-none flex h-7 w-7 items-center justify-center text-zinc-700 dark:text-zinc-200">
        {children}
      </span>
    </button>
  );
}

/**
 * Shapes popover: connections (arrow / elbow / arc connectors), basic geometry, flowchart presets — icon grid + hover titles.
 */
export function BoardShapesMenu({
  open,
  onClose,
  busy,
  onPickRect,
  onPickCircle,
  onPickPolygon,
  onPickLineConnector,
  placement = "below",
}: BoardShapesMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const t = setTimeout(
      () => document.addEventListener("mousedown", onDoc),
      0,
    );
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const positionClass =
    placement === "right"
      ? "left-full top-0 z-[60] ml-1.5 mt-0 w-[min(20rem,calc(100vw-4rem))]"
      : "left-0 top-full z-[60] mt-1.5 w-[min(20rem,calc(100vw-1.5rem))]";

  const basicKinds = POLYGON_KINDS.filter((p) => p.section === "basic");
  const flowKinds = POLYGON_KINDS.filter((p) => p.section === "flowchart");

  return (
    <div
      ref={ref}
      className={`absolute ${positionClass} max-h-[min(70vh,28rem)] overflow-y-auto rounded-xl border border-zinc-200 bg-white/98 p-3 text-left shadow-lg dark:border-zinc-600 dark:bg-zinc-900/98`}
      role="dialog"
      aria-label="Choose a shape"
    >
      <SectionTitle>Connections</SectionTitle>
      <div className="mb-4 grid grid-cols-3 gap-1.5">
        {CONNECTION_ITEMS.map(({ style, title, Icon }) => (
          <IconShapeButton
            key={style}
            title={title}
            busy={busy}
            onClick={() => onPickLineConnector(style)}
          >
            <Icon className="h-6 w-6" />
          </IconShapeButton>
        ))}
      </div>

      <SectionTitle>{sectionLabel.basic}</SectionTitle>
      <div className="mb-4 grid grid-cols-3 gap-1.5">
        <IconShapeButton title="Rectangle" busy={busy} onClick={() => onPickRect()}>
          <ShapeMenuIconRectangle className="h-6 w-6" />
        </IconShapeButton>
        <IconShapeButton
          title="Circle / ellipse — starts round; use corner handles to stretch into an ellipse"
          busy={busy}
          onClick={() => onPickCircle()}
        >
          <ShapeMenuIconEllipse className="h-6 w-6" />
        </IconShapeButton>
        {basicKinds.map((item) => (
          <IconShapeButton
            key={item.kind}
            title={item.label}
            busy={busy}
            onClick={() => onPickPolygon(item.kind)}
          >
            <ShapeMenuPolygonIcon kind={item.kind} className="h-6 w-6" />
          </IconShapeButton>
        ))}
      </div>

      <SectionTitle>{sectionLabel.flowchart}</SectionTitle>
      <div className="grid grid-cols-3 gap-1.5">
        {flowKinds.map((item) => (
          <IconShapeButton
            key={item.kind}
            title={item.label}
            busy={busy}
            onClick={() => onPickPolygon(item.kind)}
          >
            <ShapeMenuPolygonIcon kind={item.kind} className="h-6 w-6" />
          </IconShapeButton>
        ))}
      </div>
    </div>
  );
}
