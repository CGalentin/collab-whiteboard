"use client";

import type { ReactNode } from "react";
import type { PolygonKind } from "@/lib/board-polygon-kinds";

const sw = 1.65;

type IconProps = { className?: string };

function SvgFrame({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Straight segment with arrow at end. */
export function ShapeMenuIconConnectorArrow({ className }: IconProps) {
  return (
    <SvgFrame className={className}>
      <path d="M5 12h14M16 8l4 4-4 4" />
    </SvgFrame>
  );
}

/** Straight segment with arrows at both ends. */
export function ShapeMenuIconConnectorArrowBoth({ className }: IconProps) {
  return (
    <SvgFrame className={className}>
      <path d="M8 12h8M8 12l-2.5-2M8 12l-2.5 2M16 12l2.5-2M16 12l2.5 2" />
    </SvgFrame>
  );
}

/** Orthogonal (Z-style) connector. */
export function ShapeMenuIconConnectorOrthogonal({ className }: IconProps) {
  return (
    <SvgFrame className={className}>
      <path d="M5 8h7v7h7M4 7l1.5 1M4 9l1.5-1M19 15l1.5 1M19 17l1.5-1" />
    </SvgFrame>
  );
}

/** Curved connector bulging upward with arrow at end. */
export function ShapeMenuIconConnectorArcUp({ className }: IconProps) {
  return (
    <SvgFrame className={className}>
      <path d="M5 16Q12 5 19 10M17 6l3 1-1 3" />
    </SvgFrame>
  );
}

/** Curved connector bulging downward with arrow at end. */
export function ShapeMenuIconConnectorArcDown({ className }: IconProps) {
  return (
    <SvgFrame className={className}>
      <path d="M5 8Q12 19 19 14M17 18l3-1-1-3" />
    </SvgFrame>
  );
}

export function ShapeMenuIconRectangle({ className }: IconProps) {
  return (
    <SvgFrame className={className}>
      <rect x="5" y="6" width="14" height="12" rx="1" />
    </SvgFrame>
  );
}

export function ShapeMenuIconEllipse({ className }: IconProps) {
  return (
    <SvgFrame className={className}>
      <ellipse cx="12" cy="12" rx="7" ry="5" />
    </SvgFrame>
  );
}

export function ShapeMenuPolygonIcon({ kind, className }: { kind: PolygonKind; className?: string }) {
  switch (kind) {
    case "triangle":
      return (
        <SvgFrame className={className}>
          <path d="M12 5L5 19h14L12 5z" />
        </SvgFrame>
      );
    case "triangleDown":
      return (
        <SvgFrame className={className}>
          <path d="M5 5h14L12 19 5 5z" />
        </SvgFrame>
      );
    case "diamond":
      return (
        <SvgFrame className={className}>
          <path d="M12 4l8 8-8 8-8-8 8-8z" />
        </SvgFrame>
      );
    case "pentagon":
      return (
        <SvgFrame className={className}>
          <path d="M12 3.5l6.8 4.9-2.6 8.1H7.8L5.2 8.4 12 3.5z" />
        </SvgFrame>
      );
    case "hexagon":
      return (
        <SvgFrame className={className}>
          <path d="M8 4.5h8l3 5-3 5H8l-3-5 3-5z" />
        </SvgFrame>
      );
    case "trapezoid":
      return (
        <SvgFrame className={className}>
          <path d="M7 5h10l3 14H4l3-14z" />
        </SvgFrame>
      );
    case "parallelogram":
      return (
        <SvgFrame className={className}>
          <path d="M7 5h12l-3 14H4l3-14z" />
        </SvgFrame>
      );
    case "roundRect":
      return (
        <SvgFrame className={className}>
          <rect x="5" y="6" width="14" height="12" rx="3" />
        </SvgFrame>
      );
    case "star":
      return (
        <SvgFrame className={className}>
          <path d="M12 3l2.2 6.7H21l-5.5 4 2.1 6.5L12 16.2 6.4 20.2l2.1-6.5L3 9.7h6.8L12 3z" />
        </SvgFrame>
      );
    case "plus":
      return (
        <SvgFrame className={className}>
          <path d="M12 5v14M5 12h14" />
        </SvgFrame>
      );
    case "decision":
      return (
        <SvgFrame className={className}>
          <path d="M12 4l8 8-8 8-8-8 8-8z" />
        </SvgFrame>
      );
    case "merge":
      return (
        <SvgFrame className={className}>
          <path d="M5 5h14L12 19 5 5z" />
        </SvgFrame>
      );
    case "database":
      return (
        <SvgFrame className={className}>
          <ellipse cx="12" cy="6.5" rx="7" ry="2.2" />
          <path d="M5 8.5h14v8H5z" />
          <ellipse cx="12" cy="18.5" rx="7" ry="2.2" />
        </SvgFrame>
      );
    case "document":
      return (
        <SvgFrame className={className}>
          <path d="M5 5h14v9c-2 1.5-4 1-5.5 0.5S5 16 5 14V5z" />
        </SvgFrame>
      );
    case "multiDocument":
      return (
        <SvgFrame className={className}>
          <path d="M6 6h11v8l-1.5 1H6V6z" opacity="0.45" />
          <path d="M7 5h11v8l-1.5 1H7V5z" opacity="0.65" />
          <path d="M8 4h11v8l-1.5 1H8V4z" />
        </SvgFrame>
      );
    case "process":
      return (
        <SvgFrame className={className}>
          <rect x="5" y="6" width="14" height="12" rx="0.5" />
        </SvgFrame>
      );
    case "predefinedProcess":
      return (
        <SvgFrame className={className}>
          <rect x="5" y="6" width="14" height="12" rx="0.5" />
          <path d="M8 7.5V18M16 7.5V18" />
        </SvgFrame>
      );
    case "storedData":
      return (
        <SvgFrame className={className}>
          <path d="M7 6.5h10c2 2.5 2 8.5 0 11H7C5 15 5 9 7 6.5z" />
        </SvgFrame>
      );
    case "internalStorage":
      return (
        <SvgFrame className={className}>
          <rect x="5" y="6" width="14" height="12" rx="0.5" />
          <path d="M8 8v9M8 8h5" />
        </SvgFrame>
      );
    case "display":
      return (
        <SvgFrame className={className}>
          <path d="M5 12l5.5-7h6a6 6 0 010 14h-6L5 12z" />
        </SvgFrame>
      );
    case "terminal":
      return (
        <SvgFrame className={className}>
          <rect x="5" y="8" width="14" height="8" rx="4" />
        </SvgFrame>
      );
    case "manualOperation":
      return (
        <SvgFrame className={className}>
          <path d="M6 5h12l-2 14H8L6 5z" />
        </SvgFrame>
      );
    case "preparation":
      return (
        <SvgFrame className={className}>
          <path d="M5 12l3.5-7h7l3.5 7-3.5 7h-7L5 12z" />
        </SvgFrame>
      );
    case "offPageConnector":
      return (
        <SvgFrame className={className}>
          <circle cx="12" cy="12" r="6" />
        </SvgFrame>
      );
    case "manualInput":
      return (
        <SvgFrame className={className}>
          <path d="M6 7.5L18 5v14H6V7.5z" />
        </SvgFrame>
      );
    case "or":
      return (
        <SvgFrame className={className}>
          <circle cx="12" cy="12" r="6.5" />
          <path d="M12 8.5v7M8.5 12h7" />
        </SvgFrame>
      );
    default: {
      const _e: never = kind;
      return _e;
    }
  }
}
