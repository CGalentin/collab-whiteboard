"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { User } from "firebase/auth";
import { deleteField, doc, serverTimestamp, setDoc } from "firebase/firestore";
import Konva from "konva";
import { useTheme } from "next-themes";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import {
  Arrow,
  Circle,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";
import { BoardInlineTextEditor } from "@/components/board-inline-text-editor";
import { BoardObjectShape } from "@/components/board-object-shapes";
import { CommentPinShape } from "@/components/comment-pin-shape";
import { ConnectorShape } from "@/components/connector-shape";
import { FrameShape } from "@/components/frame-shape";
import { StickyNoteShape } from "@/components/sticky-note-shape";
import { TextObjectShape } from "@/components/text-object-shape";
import { LinkHotspotShape } from "@/components/link-hotspot-shape";
import type { BoardObjectWrites } from "@/hooks/use-board-object-writes";
import type { RemoteCursor } from "@/hooks/use-board-cursors";
import { useLocalCursorWriter } from "@/hooks/use-board-cursors";
import type { BoardLineConnectorStyle } from "@/lib/board-line-connector";
import { lineConnectorWorldPoints } from "@/lib/board-line-connector";
import {
  aabbIntersect,
  boardObjectWorldAabb,
  normalizeMarqueeRect,
} from "@/lib/board-geometry";
import {
  boardObjectDragPosition,
  boardObjectPositionPatch,
  dragDeltaFromNode,
} from "@/lib/board-group-drag";
import { snapCoordToGrid } from "@/lib/board-grid";
import {
  computeEraserBrushChanges,
  type EraserBrushChange,
} from "@/lib/board-eraser-geometry";
import {
  closeLassoRing,
  objectIdsInLassoPolygon,
} from "@/lib/board-lasso-geometry";
import {
  isShapeLayerObject,
  type BoardObject,
  type BoardObjectSticky,
  type BoardObjectRect,
  type BoardObjectConnector,
  type BoardObjectText,
  type BoardObjectComment,
  type BoardObjectLink,
} from "@/lib/board-object";
import {
  displayPathData,
  documentPathData,
  storedDataPathData,
} from "@/lib/board-flowchart-paths";
import {
  defaultStarRadii,
  getPolygonLinePointsFlat,
  plusStrokeThickness,
} from "@/lib/board-polygon-kinds";
import { getFirebaseDb } from "@/lib/firebase";

const MIN_SCALE = 0.15;
const MAX_SCALE = 4;
const ZOOM_STEP = 1.08;
const MARQUEE_DRAG_PX = 4;

/** Dashed path in world space while placing a line (second point). */
export type LinePreviewSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  lineStyle?: BoardLineConnectorStyle;
};

type BoardStageProps = {
  user: User;
  boardId: string;
  remoteCursors: RemoteCursor[];
  objects: BoardObject[];
  writes: BoardObjectWrites;
  selectedObjectIds: string[];
  onSelectObject: (
    objectId: string,
    shiftKey: boolean,
    nativeEvent?: globalThis.MouseEvent,
  ) => void;
  onClearSelection: () => void;
  onMarqueeSelect: (objectIds: string[]) => void;
  linePreviewSegment?: LinePreviewSegment | null;
  onLineStageBackgroundDown?: (world: { x: number; y: number }) => void;
  onLineStagePointerMoveWorld?: (world: { x: number; y: number }) => void;
  /** PR 16: client substring search on sticky + text — dim non-matches, amber ring on matches */
  textSearchActive?: boolean;
  textSearchMatchIds?: ReadonlySet<string>;
  /** PR 28: left-rail pen / highlighter. */
  railDrawMode?: "none" | "pen" | "highlighter";
  /** Brush eraser: drag to remove intersecting freehand / line strokes. */
  eraserBrushActive?: boolean;
  eraserBrushRadius?: number;
  onEraserBrushApply?: (change: EraserBrushChange) => void;
  /** Pen freehand stroke (defaults to near-black). */
  railPenStrokeColor?: string;
  /** Highlighter stroke — use board color strip (defaults to yellow). */
  railHighlighterStrokeColor?: string;
  /** PR 29: freehand closed polygon → `onMarqueeSelect`. */
  lassoActive?: boolean;
  /** PR 29: click empty canvas to drop a comment pin. */
  commentPlaceActive?: boolean;
  /** After a comment pin is created from the rail tool (for selection UX). */
  onCommentPlaced?: (objectId: string) => void;
  /** PR 30: click empty board to drop a link hotspot. */
  linkPlaceActive?: boolean;
  onLinkPlaced?: (objectId: string) => void;
  onHistoryCheckpoint?: () => void;
  /** Left-rail / mobile tools: pan the viewport with a hand (blocks object interaction while active). */
  handToolActive?: boolean;
  /** After pen/highlighter stroke or lasso completes — parent returns to Select. */
  onRailActionComplete?: () => void;
  penStrokeWidth?: number;
  highlighterStrokeWidth?: number;
  snapToGridEnabled?: boolean;
};

function pointerToWorld(
  stage: KonvaStage,
  scale: number,
  stagePos: { x: number; y: number },
): { x: number; y: number } | null {
  const p = stage.getPointerPosition();
  if (!p) return null;
  return {
    x: (p.x - stagePos.x) / scale,
    y: (p.y - stagePos.y) / scale,
  };
}

function commitTransformNode(
  node: Konva.Node,
  o: BoardObject,
  queueObjectPatch: BoardObjectWrites["queueObjectPatch"],
) {
  const id = node.id();
  if (!id) return;

  if (o.type === "rect") {
    const r = node as Konva.Rect;
    const sx = r.scaleX();
    const sy = r.scaleY();
    r.scaleX(1);
    r.scaleY(1);
    const nw = Math.max(8, r.width() * sx);
    const nh = Math.max(8, r.height() * sy);
    r.width(nw);
    r.height(nh);
    queueObjectPatch(id, {
      x: r.x(),
      y: r.y(),
      width: nw,
      height: nh,
      rotation: r.rotation(),
    });
    return;
  }

  if (o.type === "circle") {
    const c = node as Konva.Circle;
    const sx = c.scaleX();
    const sy = c.scaleY();
    const baseR = c.radius();
    const nrx = Math.max(4, baseR * Math.abs(sx));
    const nry = Math.max(4, baseR * Math.abs(sy));
    c.scaleX(1);
    c.scaleY(1);
    if (Math.abs(nrx - nry) < 0.75) {
      const nr = (nrx + nry) / 2;
      c.radius(nr);
      queueObjectPatch(id, {
        x: c.x(),
        y: c.y(),
        radius: nr,
        rotation: c.rotation(),
      });
    } else {
      queueObjectPatch(id, {
        type: "ellipse",
        x: c.x(),
        y: c.y(),
        radiusX: nrx,
        radiusY: nry,
        radius: deleteField(),
        rotation: c.rotation(),
      });
    }
    return;
  }

  if (o.type === "ellipse") {
    const e = node as Konva.Ellipse;
    const sx = e.scaleX();
    const sy = e.scaleY();
    const nrx = Math.max(4, e.radiusX() * Math.abs(sx));
    const nry = Math.max(4, e.radiusY() * Math.abs(sy));
    e.scaleX(1);
    e.scaleY(1);
    e.radiusX(nrx);
    e.radiusY(nry);
    queueObjectPatch(id, {
      x: e.x(),
      y: e.y(),
      radiusX: nrx,
      radiusY: nry,
      rotation: e.rotation(),
    });
    return;
  }

  if (o.type === "polygon") {
    const g = node as Konva.Group;
    const sx = g.scaleX();
    const sy = g.scaleY();
    const w = Math.max(8, o.width * sx);
    const h = Math.max(8, o.height * sy);
    g.scaleX(1);
    g.scaleY(1);
    if (o.kind === "plus") {
      const t = plusStrokeThickness(w, h);
      const cx = w / 2;
      const cy = h / 2;
      const v = g.findOne<Konva.Rect>(`#${o.id}-plus-v`);
      const hbar = g.findOne<Konva.Rect>(`#${o.id}-plus-h`);
      if (v) {
        v.x(cx - t / 2);
        v.y(0);
        v.width(t);
        v.height(h);
      }
      if (hbar) {
        hbar.x(0);
        hbar.y(cy - t / 2);
        hbar.width(w);
        hbar.height(t);
      }
    } else if (o.kind === "roundRect") {
      const r = g.findOne<Konva.Rect>("Rect");
      if (r) {
        r.width(w);
        r.height(h);
        r.cornerRadius(Math.min(w, h) * 0.15);
      }
    } else if (o.kind === "star") {
      const s = g.findOne<Konva.Star>("Star");
      if (s) {
        const { outer, inner, cx, cy } = defaultStarRadii(w, h);
        s.x(cx);
        s.y(cy);
        s.outerRadius(outer);
        s.innerRadius(inner);
      }
    } else if (o.kind === "database") {
      const top = g.findOne<Konva.Ellipse>(".db-top");
      const body = g.findOne<Konva.Rect>(".db-body");
      const bot = g.findOne<Konva.Ellipse>(".db-bot");
      if (top) {
        top.x(w / 2);
        top.y(h * 0.12);
        top.radiusX(Math.max(4, w * 0.42));
        top.radiusY(Math.max(3, h * 0.09));
      }
      if (body) {
        body.x(w * 0.08);
        body.y(h * 0.12);
        body.width(w * 0.84);
        body.height(h * 0.63);
      }
      if (bot) {
        bot.x(w / 2);
        bot.y(h * 0.88);
        bot.radiusX(Math.max(4, w * 0.42));
        bot.radiusY(Math.max(3, h * 0.09));
      }
    } else if (o.kind === "document") {
      const p = g.findOne<Konva.Path>(".doc-path");
      if (p) p.data(documentPathData(w, h));
    } else if (o.kind === "multiDocument") {
      const dw = Math.max(12, w - 10);
      const dh = Math.max(12, h - 10);
      const back = g.findOne<Konva.Path>(".md-back");
      const mid = g.findOne<Konva.Path>(".md-mid");
      const front = g.findOne<Konva.Path>(".md-front");
      if (back) {
        back.x(-2);
        back.y(-2);
        back.data(documentPathData(dw, dh));
      }
      if (mid) {
        mid.x(2);
        mid.y(2);
        mid.data(documentPathData(dw, dh));
      }
      if (front) front.data(documentPathData(w, h));
    } else if (o.kind === "predefinedProcess") {
      const r = g.findOne<Konva.Rect>(".pp-rect");
      const bl = g.findOne<Konva.Line>(".pp-bar-l");
      const br = g.findOne<Konva.Line>(".pp-bar-r");
      if (r) {
        r.width(w);
        r.height(h);
      }
      if (bl) bl.points([w * 0.12, h * 0.1, w * 0.12, h * 0.9]);
      if (br) br.points([w * 0.88, h * 0.1, w * 0.88, h * 0.9]);
    } else if (o.kind === "storedData") {
      const p = g.findOne<Konva.Path>(".sd-path");
      if (p) p.data(storedDataPathData(w, h));
    } else if (o.kind === "internalStorage") {
      const r = g.findOne<Konva.Rect>(".is-rect");
      const l1 = g.findOne<Konva.Line>(".is-l");
      const l2 = g.findOne<Konva.Line>(".is-t");
      if (r) {
        r.width(w);
        r.height(h);
      }
      if (l1) l1.points([w * 0.14, h * 0.12, w * 0.14, h * 0.88]);
      if (l2) l2.points([w * 0.14, h * 0.12, w * 0.55, h * 0.12]);
    } else if (o.kind === "display") {
      const p = g.findOne<Konva.Path>(".disp-path");
      if (p) p.data(displayPathData(w, h));
    } else if (o.kind === "terminal") {
      const r = g.findOne<Konva.Rect>(".term-rect");
      if (r) {
        r.width(w);
        r.height(h);
        r.cornerRadius(Math.min(h / 2, w / 2));
      }
    } else if (o.kind === "offPageConnector") {
      const c = g.findOne<Konva.Circle>(".opc-circle");
      const sw = o.strokeWidth + 1;
      if (c) {
        c.x(w / 2);
        c.y(h / 2);
        c.radius(Math.max(4, Math.min(w, h) / 2 - sw));
      }
    } else if (o.kind === "or") {
      const c = g.findOne<Konva.Circle>(".or-circle");
      const lh = g.findOne<Konva.Line>(".or-h");
      const lv = g.findOne<Konva.Line>(".or-v");
      const sw = o.strokeWidth + 1;
      const rad = Math.max(4, Math.min(w, h) / 2 - sw * 1.5);
      const inner = Math.max(2, rad * 0.45);
      if (c) {
        c.x(w / 2);
        c.y(h / 2);
        c.radius(rad);
      }
      if (lh) lh.points([w / 2 - inner, h / 2, w / 2 + inner, h / 2]);
      if (lv) lv.points([w / 2, h / 2 - inner, w / 2, h / 2 + inner]);
    } else {
      const line = g.findOne<Konva.Line>("Line");
      if (line) {
        line.points(getPolygonLinePointsFlat(o.kind, w, h));
      }
    }
    queueObjectPatch(id, {
      x: g.x(),
      y: g.y(),
      width: w,
      height: h,
      rotation: g.rotation(),
    });
    return;
  }

  if (o.type === "sticky" || o.type === "frame" || o.type === "text" || o.type === "link") {
    const g = node as Konva.Group;
    const sx = g.scaleX();
    const sy = g.scaleY();
    const rect = g.findOne<Konva.Rect>("Rect");
    if (!rect) return;
    const minBox =
      o.type === "text" ? 24 : o.type === "link" ? 48 : 40;
    const nw = Math.max(minBox, rect.width() * sx);
    const nh = Math.max(minBox, rect.height() * sy);
    g.scaleX(1);
    g.scaleY(1);
    rect.width(nw);
    rect.height(nh);
    queueObjectPatch(id, {
      x: g.x(),
      y: g.y(),
      width: nw,
      height: nh,
      rotation: g.rotation(),
    });
  }
}

function applyOptimisticPatch(
  o: BoardObject,
  patch: Record<string, unknown>,
): BoardObject {
  if (o.type === "freehand" && Array.isArray(patch.points)) {
    return { ...o, points: patch.points as number[] };
  }
  if (o.type === "line") {
    return {
      ...o,
      x1: typeof patch.x1 === "number" ? patch.x1 : o.x1,
      y1: typeof patch.y1 === "number" ? patch.y1 : o.y1,
      x2: typeof patch.x2 === "number" ? patch.x2 : o.x2,
      y2: typeof patch.y2 === "number" ? patch.y2 : o.y2,
    };
  }
  if (typeof patch.x === "number" && typeof patch.y === "number") {
    if (
      o.type === "rect" ||
      o.type === "sticky" ||
      o.type === "frame" ||
      o.type === "text" ||
      o.type === "link" ||
      o.type === "polygon" ||
      o.type === "circle" ||
      o.type === "ellipse" ||
      o.type === "comment"
    ) {
      return { ...o, x: patch.x, y: patch.y };
    }
  }
  return o;
}

function optimisticPatchMatches(
  o: BoardObject,
  patch: Record<string, unknown>,
): boolean {
  if (o.type === "freehand" && Array.isArray(patch.points)) {
    const pts = patch.points as number[];
    return (
      o.points.length === pts.length &&
      o.points.every((v, i) => v === pts[i])
    );
  }
  if (o.type === "line") {
    return (
      (patch.x1 === undefined || o.x1 === patch.x1) &&
      (patch.y1 === undefined || o.y1 === patch.y1) &&
      (patch.x2 === undefined || o.x2 === patch.x2) &&
      (patch.y2 === undefined || o.y2 === patch.y2)
    );
  }
  if (typeof patch.x === "number" && typeof patch.y === "number") {
    if ("x" in o && "y" in o) {
      return o.x === patch.x && o.y === patch.y;
    }
  }
  return false;
}

/**
 * Konva stage filling its container: wheel zoom toward cursor, pan with Space+drag or middle mouse.
 */
export function BoardStage({
  user,
  boardId,
  remoteCursors,
  objects,
  writes,
  selectedObjectIds,
  onSelectObject,
  onClearSelection,
  onMarqueeSelect,
  linePreviewSegment = null,
  onLineStageBackgroundDown,
  onLineStagePointerMoveWorld,
  textSearchActive = false,
  textSearchMatchIds,
  railDrawMode = "none",
  railPenStrokeColor = "#18181b",
  railHighlighterStrokeColor = "#fef08a",
  lassoActive = false,
  commentPlaceActive = false,
  onCommentPlaced,
  linkPlaceActive = false,
  onLinkPlaced,
  onHistoryCheckpoint,
  handToolActive = false,
  onRailActionComplete,
  penStrokeWidth = 3,
  highlighterStrokeWidth = 16,
  snapToGridEnabled = false,
  eraserBrushActive = false,
  eraserBrushRadius = 20,
  onEraserBrushApply,
}: BoardStageProps) {
  const searchOn = textSearchActive;
  const searchHits = textSearchMatchIds ?? new Set<string>();

  const textSearchVisualFor = (id: string) => {
    if (!searchOn) return "inactive";
    return searchHits.has(id) ? "match" : "dim";
  };
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const stageRef = useRef<KonvaStage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const transformTargets = useRef<Map<string, Konva.Node>>(new Map());
  const optimisticPatchesRef = useRef<Map<string, Record<string, unknown>>>(
    new Map(),
  );
  const [optimisticTick, setOptimisticTick] = useState(0);
  const pendingDragNodeResetRef = useRef<Konva.Node | null>(null);

  const displayObjects = useMemo(() => {
    const opt = optimisticPatchesRef.current;
    if (opt.size === 0) return objects;
    return objects.map((o) => {
      const patch = opt.get(o.id);
      return patch ? applyOptimisticPatch(o, patch) : o;
    });
  }, [objects, optimisticTick]);

  useEffect(() => {
    const opt = optimisticPatchesRef.current;
    let cleared = false;
    for (const [id, patch] of [...opt.entries()]) {
      const o = objects.find((x) => x.id === id);
      if (o && optimisticPatchMatches(o, patch)) {
        opt.delete(id);
        cleared = true;
      }
    }
    if (cleared) setOptimisticTick((t) => t + 1);
  }, [objects]);

  useLayoutEffect(() => {
    const node = pendingDragNodeResetRef.current;
    if (!node) return;
    node.position({ x: 0, y: 0 });
    pendingDragNodeResetRef.current = null;
  }, [optimisticTick]);

  type OverlayEdit = {
    kind: "sticky" | "rect" | "text" | "comment";
    id: string;
  };
  const [overlayEdit, setOverlayEdit] = useState<OverlayEdit | null>(null);
  const [overlayDraft, setOverlayDraft] = useState("");
  const overlayDraftRef = useRef(overlayDraft);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const scaleRef = useRef(scale);
  const stagePosRef = useRef(stagePos);
  const activePointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{
    d0: number;
    s0: number;
    worldPt: { x: number; y: number };
  } | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [isPanningUi, setIsPanningUi] = useState(false);
  const [marqueeWorld, setMarqueeWorld] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  type DrawingDraft = {
    mode: "pen" | "highlighter";
    points: number[];
    stroke: string;
  };
  const [drawingDraft, setDrawingDraft] = useState<DrawingDraft | null>(null);
  const [lassoDraftPoints, setLassoDraftPoints] = useState<number[] | null>(
    null,
  );
  const [eraserDraftPoints, setEraserDraftPoints] = useState<number[] | null>(
    null,
  );

  const spaceDown = useRef(false);
  const panning = useRef(false);
  const lastPtr = useRef({ x: 0, y: 0 });
  const marqueeSession = useRef<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  const cleanupDrawingListeners = useRef<(() => void) | null>(null);
  const cleanupLassoListeners = useRef<(() => void) | null>(null);

  const setWrapRef = useCallback((el: HTMLDivElement | null) => {
    wrapRef.current = el;
    setContainerEl(el);
  }, []);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  useEffect(() => {
    stagePosRef.current = stagePos;
  }, [stagePos]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({
        w: Math.max(0, Math.floor(r.width)),
        h: Math.max(0, Math.floor(r.height)),
      });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setSize({
      w: Math.max(0, Math.floor(r.width)),
      h: Math.max(0, Math.floor(r.height)),
    });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceDown.current = true;
        setSpaceHeld(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceDown.current = false;
        setSpaceHeld(false);
        panning.current = false;
        setIsPanningUi(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage || size.w < 1 || size.h < 1) return null;
      const rect = stage.container().getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      return {
        x: (px - stagePos.x) / scale,
        y: (py - stagePos.y) / scale,
      };
    },
    [size.w, size.h, stagePos.x, stagePos.y, scale],
  );

  const clientToWorld = useCallback(
    (e: globalThis.PointerEvent) => {
      return screenToWorld(e.clientX, e.clientY);
    },
    [screenToWorld],
  );

  /** Center of pinch in stage-local (Konva) coordinates for world anchor math. */
  const clientToStageLocal = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage || size.w < 1) return null;
      const rect = stage.container().getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    [size.w],
  );

  useLocalCursorWriter(boardId, user, containerEl, clientToWorld);

  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage || size.w < 1) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const oldScale = scale;
      const zoomOut = e.evt.deltaY > 0;
      const nextRaw = zoomOut ? oldScale / ZOOM_STEP : oldScale * ZOOM_STEP;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextRaw));

      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };

      setScale(newScale);
      setStagePos({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [scale, stagePos.x, stagePos.y, size.w],
  );

  const initPinchIfTwoFingers = useCallback(() => {
    const m = activePointers.current;
    if (m.size < 2) {
      pinchRef.current = null;
      return;
    }
    const [a, b] = [...m.values()].slice(0, 2) as [
      { x: number; y: number },
      { x: number; y: number },
    ];
    const d0 = Math.hypot(b.x - a.x, b.y - a.y);
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    if (d0 < 0.1) {
      pinchRef.current = null;
      return;
    }
    const cLoc = clientToStageLocal(cx, cy);
    if (!cLoc) {
      pinchRef.current = null;
      return;
    }
    const s0 = scaleRef.current;
    const sp = stagePosRef.current;
    pinchRef.current = {
      d0,
      s0,
      worldPt: {
        x: (cLoc.x - sp.x) / s0,
        y: (cLoc.y - sp.y) / s0,
      },
    };
    panning.current = false;
    setIsPanningUi(false);
  }, [clientToStageLocal]);

  const onPointerDownCapture = (evt: ReactPointerEvent<HTMLDivElement>) => {
    const e = evt.nativeEvent;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.current.size === 2) {
      initPinchIfTwoFingers();
    } else {
      pinchRef.current = null;
    }

    if (handToolActive) {
      e.preventDefault();
      e.stopPropagation();
      if (e.button === 0) {
        if (activePointers.current.size === 1) {
          panning.current = true;
          setIsPanningUi(true);
          lastPtr.current = { x: e.clientX, y: e.clientY };
        }
      }
      return;
    }

    if (e.button === 1) {
      e.preventDefault();
      panning.current = true;
      setIsPanningUi(true);
      lastPtr.current = { x: e.clientX, y: e.clientY };
    } else if (e.button === 0 && spaceDown.current) {
      e.preventDefault();
      panning.current = true;
      setIsPanningUi(true);
      lastPtr.current = { x: e.clientX, y: e.clientY };
    }
  };

  const onPointerMoveWrap = (evt: ReactPointerEvent<HTMLDivElement>) => {
    const e = evt.nativeEvent;
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (activePointers.current.size >= 2 && pinchRef.current) {
      e.preventDefault();
      const p = pinchRef.current;
      const [a, b] = [...activePointers.current.values()].slice(0, 2) as [
        { x: number; y: number },
        { x: number; y: number },
      ];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      if (d < 0.1) return;
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const cLoc = clientToStageLocal(cx, cy);
      if (!cLoc) return;
      const newS = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, p.s0 * (d / p.d0)),
      );
      setScale(newS);
      setStagePos({
        x: cLoc.x - p.worldPt.x * newS,
        y: cLoc.y - p.worldPt.y * newS,
      });
      return;
    }
    if (!panning.current) return;
    const dx = e.clientX - lastPtr.current.x;
    const dy = e.clientY - lastPtr.current.y;
    lastPtr.current = { x: e.clientX, y: e.clientY };
    setStagePos((p) => ({ x: p.x + dx, y: p.y + dy }));
  };

  const endPan = () => {
    panning.current = false;
    setIsPanningUi(false);
  };

  const onPointerUpWrap = (evt: ReactPointerEvent<HTMLDivElement>) => {
    const e = evt.nativeEvent;
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size < 2) pinchRef.current = null;
    endPan();
  };

  const cursorClass =
    handToolActive || spaceHeld || isPanningUi
      ? "cursor-grab active:cursor-grabbing"
      : eraserBrushActive
        ? "cursor-cell"
        : "cursor-crosshair";

  const ready = size.w >= 2 && size.h >= 2;
  const interactionLocked = handToolActive;

  const openStickyEditor = useCallback(
    (id: string) => {
      const o = objects.find(
        (x): x is BoardObjectSticky => x.id === id && x.type === "sticky",
      );
      if (o) {
        setOverlayEdit({ kind: "sticky", id });
        setOverlayDraft(o.text);
        onSelectObject(id, false);
      }
    },
    [objects, onSelectObject],
  );

  const openRectEditor = useCallback(
    (id: string) => {
      const o = objects.find(
        (x): x is BoardObjectRect => x.id === id && x.type === "rect",
      );
      if (o) {
        setOverlayEdit({ kind: "rect", id });
        setOverlayDraft(o.text ?? "");
        onSelectObject(id, false);
      }
    },
    [objects, onSelectObject],
  );

  const openTextObjectEditor = useCallback(
    (id: string) => {
      const o = objects.find(
        (x): x is BoardObjectText => x.id === id && x.type === "text",
      );
      if (o) {
        setOverlayEdit({ kind: "text", id });
        setOverlayDraft(o.text);
        onSelectObject(id, false);
      }
    },
    [objects, onSelectObject],
  );

  const openCommentEditor = useCallback(
    (id: string) => {
      const o = objects.find(
        (x): x is BoardObjectComment => x.id === id && x.type === "comment",
      );
      if (o) {
        setOverlayEdit({ kind: "comment", id });
        setOverlayDraft(o.body);
        onSelectObject(id, false);
      }
    },
    [objects, onSelectObject],
  );

  const overlayTarget =
    overlayEdit === null
      ? null
      : (objects.find((o) => o.id === overlayEdit.id) ?? null);

  const overlayBox =
    overlayTarget?.type === "sticky" || overlayTarget?.type === "rect"
      ? {
          id: overlayTarget.id,
          x: overlayTarget.x,
          y: overlayTarget.y,
          width: overlayTarget.width,
          height: overlayTarget.height,
          fill: overlayTarget.fill,
        }
      : overlayTarget?.type === "text"
        ? {
            id: overlayTarget.id,
            x: overlayTarget.x,
            y: overlayTarget.y,
            width: overlayTarget.width,
            height: overlayTarget.height,
            // Editor background is handled in `BoardInlineTextEditor` for variant `text`
            // (`fill` on text objects is Konva text color, not box fill).
            fill: "rgba(255,255,255,0.96)",
          }
        : overlayTarget?.type === "comment"
          ? {
              id: overlayTarget.id,
              x: overlayTarget.x + 18,
              y: overlayTarget.y - 52,
              width: 240,
              height: 140,
              fill: "rgba(255,255,255,0.96)",
            }
          : null;

  useEffect(() => {
    overlayDraftRef.current = overlayDraft;
  }, [overlayDraft]);

  const registerTransformTarget = useCallback(
    (id: string, node: Konva.Node | null) => {
      if (node) transformTargets.current.set(id, node);
      else transformTargets.current.delete(id);
    },
    [],
  );

  const handleTransformEnd = useCallback(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    const nodes = [...tr.nodes()];
    for (const node of nodes) {
      const id = node.id();
      if (!id) continue;
      const o = objects.find((x) => x.id === id);
      if (
        !o ||
        o.type === "line" ||
        o.type === "freehand" ||
        o.type === "comment" ||
        o.type === "connector"
      )
        continue;
      commitTransformNode(node, o, writes.queueObjectPatch);
    }
    tr.getLayer()?.batchDraw();
  }, [objects, writes.queueObjectPatch]);

  const groupDragOriginsRef = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );

  const beginGroupDrag = useCallback(
    (draggedId: string) => {
      const opt = optimisticPatchesRef.current;
      let cleared = false;
      const idsToTrack =
        selectedObjectIds.length >= 2 &&
        selectedObjectIds.includes(draggedId)
          ? selectedObjectIds
          : [draggedId];
      for (const id of idsToTrack) {
        if (opt.delete(id)) cleared = true;
      }
      if (cleared) setOptimisticTick((t) => t + 1);

      if (
        selectedObjectIds.length < 2 ||
        !selectedObjectIds.includes(draggedId)
      ) {
        const o = objects.find((x) => x.id === draggedId);
        const pos = o ? boardObjectDragPosition(o) : null;
        groupDragOriginsRef.current = pos
          ? new Map([[draggedId, pos]])
          : new Map();
        return;
      }
      const m = new Map<string, { x: number; y: number }>();
      for (const id of selectedObjectIds) {
        const o = objects.find((x) => x.id === id);
        if (!o) continue;
        const pos = boardObjectDragPosition(o);
        if (pos) m.set(id, pos);
      }
      groupDragOriginsRef.current = m;
    },
    [objects, selectedObjectIds],
  );

  const snapPos = useCallback(
    (x: number, y: number) =>
      snapToGridEnabled
        ? { x: snapCoordToGrid(x), y: snapCoordToGrid(y) }
        : { x, y },
    [snapToGridEnabled],
  );

  const buildPositionPatches = useCallback(
  (
    draggedId: string,
    dx: number,
    dy: number,
    origins: Map<string, { x: number; y: number }>,
  ): Array<{ id: string; patch: Record<string, unknown> }> => {
    const o = objects.find((x) => x.id === draggedId);
    if (!o) return [];
    const origin = origins.get(draggedId);
    const patches: Array<{ id: string; patch: Record<string, unknown> }> = [];

    if (!origin || origins.size < 2) {
      const base = boardObjectDragPosition(o) ?? { x: 0, y: 0 };
      const patch = boardObjectPositionPatch(o, base, dx, dy);
      if (patch) patches.push({ id: draggedId, patch });
      return patches;
    }

    for (const [id, start] of origins) {
      const obj = objects.find((x) => x.id === id);
      if (!obj) continue;
      const patch = boardObjectPositionPatch(obj, start, dx, dy);
      if (patch) patches.push({ id, patch });
    }
    return patches;
  },
  [objects],
);

  const usesOffsetDrag = (o: BoardObject) =>
    o.type === "line" || o.type === "freehand";

  const updateGroupDragPreview = useCallback(
    (draggedId: string, node: Konva.Node) => {
      const origins = groupDragOriginsRef.current;
      if (origins.size < 2) return;
      const origin = origins.get(draggedId);
      const o = objects.find((x) => x.id === draggedId);
      if (!origin || !o) return;

      let { dx, dy } = dragDeltaFromNode(o, node, origin);
      if (!usesOffsetDrag(o) && snapToGridEnabled) {
        const snapped = snapPos(origin.x + dx, origin.y + dy);
        dx = snapped.x - origin.x;
        dy = snapped.y - origin.y;
      }

      const opt = optimisticPatchesRef.current;
      let changed = false;
      for (const { id, patch } of buildPositionPatches(
        draggedId,
        dx,
        dy,
        origins,
      )) {
        // Dragged shape already moves via Konva; only preview siblings.
        if (!usesOffsetDrag(o) && id === draggedId) continue;
        opt.set(id, patch);
        changed = true;
      }
      if (changed) setOptimisticTick((t) => t + 1);
    },
    [objects, snapToGridEnabled, snapPos, buildPositionPatches],
  );

  const commitDragFromNode = useCallback(
    (draggedId: string, node: Konva.Node) => {
      const origins = groupDragOriginsRef.current;
      const origin = origins.get(draggedId);
      const groupOrigins = origins.size >= 2 ? new Map(origins) : null;
      groupDragOriginsRef.current = new Map();

      const o = objects.find((x) => x.id === draggedId);
      if (!o) {
        if (node.x() !== 0 || node.y() !== 0) node.position({ x: 0, y: 0 });
        return;
      }

      const offsetDrag = usesOffsetDrag(o);
      const dragOrigin =
        origin ?? boardObjectDragPosition(o) ?? { x: 0, y: 0 };
      let { dx, dy } = dragDeltaFromNode(o, node, dragOrigin);
      if (dx === 0 && dy === 0) {
        optimisticPatchesRef.current.delete(draggedId);
        if (offsetDrag) node.position({ x: 0, y: 0 });
        return;
      }

      if (!offsetDrag && snapToGridEnabled) {
        const snapped = snapPos(dragOrigin.x + dx, dragOrigin.y + dy);
        dx = snapped.x - dragOrigin.x;
        dy = snapped.y - dragOrigin.y;
      }

      const patchOrigins =
        groupOrigins ?? new Map([[draggedId, dragOrigin]]);
      const patches = buildPositionPatches(
        draggedId,
        dx,
        dy,
        patchOrigins,
      );

      let draggedPatch: Record<string, unknown> | undefined;
      for (const { id, patch } of patches) {
        optimisticPatchesRef.current.set(id, patch);
        void writes.flushObjectPatchNow(id, patch);
        if (id === draggedId) draggedPatch = patch;
      }

      if (patches.length === 0) return;

      if (offsetDrag) {
        pendingDragNodeResetRef.current = node;
      } else if (
        typeof draggedPatch?.x === "number" &&
        typeof draggedPatch?.y === "number"
      ) {
        node.position({
          x: draggedPatch.x,
          y: draggedPatch.y,
        });
      }
      setOptimisticTick((t) => t + 1);
    },
    [objects, writes, snapToGridEnabled, snapPos, buildPositionPatches],
  );

  const dragNodeForObject = useCallback((node: Konva.Node, objectId: string) => {
    const stage = node.getStage();
    if (!stage) return node;
    return stage.findOne(`#${objectId}`) ?? node;
  }, []);

  const objectDragHandlers = useCallback(
    (objectId: string) => ({
      onDragStart: () => beginGroupDrag(objectId),
      onDragMove: (ev: KonvaEventObject<Event>) => {
        ev.cancelBubble = true;
        const root = dragNodeForObject(ev.target, objectId);
        updateGroupDragPreview(objectId, root);
      },
      onDragEnd: (ev: KonvaEventObject<Event>) => {
        ev.cancelBubble = true;
        const root = dragNodeForObject(ev.target, objectId);
        commitDragFromNode(objectId, root);
      },
    }),
    [
      beginGroupDrag,
      updateGroupDragPreview,
      commitDragFromNode,
      dragNodeForObject,
    ],
  );

  const transformerAttachKey = useMemo(() => {
    return selectedObjectIds
      .filter((id) => {
        const o = objects.find((x) => x.id === id);
        return (
          o &&
          o.type !== "line" &&
          o.type !== "freehand" &&
          o.type !== "comment" &&
          o.type !== "connector"
        );
      })
      .join("|");
  }, [selectedObjectIds, objects]);

  useLayoutEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    const ids = transformerAttachKey
      ? transformerAttachKey.split("|")
      : [];
    const nodes = ids
      .map((id) => transformTargets.current.get(id))
      .filter(Boolean) as Konva.Node[];
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [transformerAttachKey]);

  const cleanupMarqueeListeners = useRef<(() => void) | null>(null);

  const handleStageMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (handToolActive) return;
      const st = e.target.getStage();
      if (!st || e.target !== st) return;

      if (onLineStageBackgroundDown) {
        const w = pointerToWorld(st, scale, stagePos);
        if (w) {
          setOverlayEdit(null);
          onLineStageBackgroundDown(w);
        }
        return;
      }

      if (eraserBrushActive) {
        if (spaceDown.current || e.evt.button !== 0) return;
        const wErase = pointerToWorld(st, scale, stagePos);
        if (!wErase) return;

        cleanupMarqueeListeners.current?.();
        cleanupMarqueeListeners.current = null;
        cleanupDrawingListeners.current?.();
        cleanupDrawingListeners.current = null;
        cleanupLassoListeners.current?.();
        cleanupLassoListeners.current = null;
        setOverlayEdit(null);

        let pts: number[] = [wErase.x, wErase.y];
        let historyMarked = false;
        let lastEraserFlushLen = 0;
        const pointerId =
          "pointerId" in e.evt ? e.evt.pointerId : 1;
        setEraserDraftPoints([...pts]);

        const flushHits = () => {
          if (pts.length < lastEraserFlushLen + 2) return;
          const overlap = lastEraserFlushLen > 0 ? lastEraserFlushLen - 2 : 0;
          const delta = pts.slice(overlap);
          lastEraserFlushLen = pts.length;
          const change = computeEraserBrushChanges(
            objects,
            delta,
            eraserBrushRadius,
          );
          if (
            change.deleteIds.length === 0 &&
            change.updates.length === 0 &&
            change.creates.length === 0
          ) {
            return;
          }
          if (!historyMarked) {
            historyMarked = true;
            onHistoryCheckpoint?.();
          }
          onEraserBrushApply?.(change);
        };
        flushHits();

        const onPointerMove = (pe: PointerEvent) => {
          if (pe.pointerId !== pointerId) return;
          const ww = screenToWorld(pe.clientX, pe.clientY);
          if (!ww) return;
          const lx = pts[pts.length - 2]!;
          const ly = pts[pts.length - 1]!;
          if (Math.hypot(ww.x - lx, ww.y - ly) >= 2) {
            pts = pts.concat([ww.x, ww.y]);
            setEraserDraftPoints([...pts]);
            flushHits();
          }
        };

        const onPointerUp = (pe: PointerEvent) => {
          if (pe.pointerId !== pointerId) return;
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerup", onPointerUp);
          window.removeEventListener("pointercancel", onPointerUp);
          cleanupDrawingListeners.current = null;
          setEraserDraftPoints(null);
        };

        cleanupDrawingListeners.current = () => {
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerup", onPointerUp);
          window.removeEventListener("pointercancel", onPointerUp);
        };

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);
        return;
      }

      if (railDrawMode === "pen" || railDrawMode === "highlighter") {
        if (spaceDown.current || e.evt.button !== 0) return;
        const wDraw = pointerToWorld(st, scale, stagePos);
        if (!wDraw) return;

        cleanupMarqueeListeners.current?.();
        cleanupMarqueeListeners.current = null;
        cleanupDrawingListeners.current?.();
        cleanupDrawingListeners.current = null;

        const mode = railDrawMode;
        const strokeForStroke =
          mode === "pen" ? railPenStrokeColor : railHighlighterStrokeColor;
        let pts: number[] = [wDraw.x, wDraw.y];
        setOverlayEdit(null);
        setDrawingDraft({
          mode,
          points: [...pts],
          stroke: strokeForStroke,
        });

        const onDrawMove = (me: MouseEvent) => {
          const ww = screenToWorld(me.clientX, me.clientY);
          if (!ww) return;
          const lx = pts[pts.length - 2]!;
          const ly = pts[pts.length - 1]!;
          if (Math.hypot(ww.x - lx, ww.y - ly) >= 2) {
            pts = pts.concat([ww.x, ww.y]);
            setDrawingDraft((prev) =>
              prev ? { ...prev, points: pts } : null,
            );
          }
        };

        const onDrawUp = () => {
          window.removeEventListener("mousemove", onDrawMove);
          window.removeEventListener("mouseup", onDrawUp);
          cleanupDrawingListeners.current = null;
          setDrawingDraft(null);
          const committed = pts;
          onRailActionComplete?.();
          if (committed.length < 4) {
            return;
          }

          void (async () => {
            try {
              onHistoryCheckpoint?.();
              await user.getIdToken();
              const db = getFirebaseDb();
              const id = crypto.randomUUID();
              const stroke = strokeForStroke;
              const strokeWidth =
                mode === "pen" ? penStrokeWidth : highlighterStrokeWidth;
              const opacity = mode === "pen" ? 1 : 0.45;
              await setDoc(doc(db, "boards", boardId, "objects", id), {
                type: "freehand",
                points: committed,
                stroke,
                strokeWidth,
                opacity,
                zIndex: Date.now(),
                updatedAt: serverTimestamp(),
              });
            } catch (err) {
              console.error("[objects] freehand commit failed", err);
            }
          })();
        };

        cleanupDrawingListeners.current = () => {
          window.removeEventListener("mousemove", onDrawMove);
          window.removeEventListener("mouseup", onDrawUp);
        };

        window.addEventListener("mousemove", onDrawMove);
        window.addEventListener("mouseup", onDrawUp);
        return;
      }

      if (lassoActive) {
        if (spaceDown.current || e.evt.button !== 0) return;
        const wL = pointerToWorld(st, scale, stagePos);
        if (!wL) return;

        cleanupMarqueeListeners.current?.();
        cleanupMarqueeListeners.current = null;
        cleanupDrawingListeners.current?.();
        cleanupDrawingListeners.current = null;
        cleanupLassoListeners.current?.();
        cleanupLassoListeners.current = null;

        let pts: number[] = [wL.x, wL.y];
        setOverlayEdit(null);
        setLassoDraftPoints([...pts]);

        const onLassoMove = (me: MouseEvent) => {
          const ww = screenToWorld(me.clientX, me.clientY);
          if (!ww) return;
          const lx = pts[pts.length - 2]!;
          const ly = pts[pts.length - 1]!;
          if (Math.hypot(ww.x - lx, ww.y - ly) >= 3) {
            pts = pts.concat([ww.x, ww.y]);
            setLassoDraftPoints([...pts]);
          }
        };

        const onLassoUp = () => {
          window.removeEventListener("mousemove", onLassoMove);
          window.removeEventListener("mouseup", onLassoUp);
          cleanupLassoListeners.current = null;
          setLassoDraftPoints(null);
          const ring = closeLassoRing(pts);
          if (ring.length < 6) {
            onRailActionComplete?.();
            return;
          }
          const hits = objectIdsInLassoPolygon(objects, ring, (id) =>
            objects.find((x) => x.id === id),
          );
          onMarqueeSelect(hits);
          onRailActionComplete?.();
        };

        cleanupLassoListeners.current = () => {
          window.removeEventListener("mousemove", onLassoMove);
          window.removeEventListener("mouseup", onLassoUp);
        };

        window.addEventListener("mousemove", onLassoMove);
        window.addEventListener("mouseup", onLassoUp);
        return;
      }

      if (commentPlaceActive) {
        if (spaceDown.current || e.evt.button !== 0) return;
        const wp = pointerToWorld(st, scale, stagePos);
        if (!wp) return;

        cleanupMarqueeListeners.current?.();
        cleanupMarqueeListeners.current = null;
        cleanupDrawingListeners.current?.();
        cleanupDrawingListeners.current = null;
        cleanupLassoListeners.current?.();
        cleanupLassoListeners.current = null;
        setOverlayEdit(null);

        const newId = crypto.randomUUID();
        onRailActionComplete?.();
        void (async () => {
          try {
            onHistoryCheckpoint?.();
            await user.getIdToken();
            const db = getFirebaseDb();
            await setDoc(doc(db, "boards", boardId, "objects", newId), {
              type: "comment",
              x: wp.x,
              y: wp.y,
              body: "",
              zIndex: Date.now(),
              updatedAt: serverTimestamp(),
            });
            onCommentPlaced?.(newId);
          } catch (err) {
            console.error("[objects] add comment failed", err);
          }
        })();
        return;
      }

      if (linkPlaceActive) {
        if (spaceDown.current || e.evt.button !== 0) return;
        const wLink = pointerToWorld(st, scale, stagePos);
        if (!wLink) return;

        cleanupMarqueeListeners.current?.();
        cleanupMarqueeListeners.current = null;
        cleanupDrawingListeners.current?.();
        cleanupDrawingListeners.current = null;
        cleanupLassoListeners.current?.();
        cleanupLassoListeners.current = null;
        setOverlayEdit(null);

        const newId = crypto.randomUUID();
        const lw = 160;
        const lh = 44;
        onRailActionComplete?.();
        void (async () => {
          try {
            onHistoryCheckpoint?.();
            await user.getIdToken();
            const db = getFirebaseDb();
            await setDoc(doc(db, "boards", boardId, "objects", newId), {
              type: "link",
              x: wLink.x - lw / 2,
              y: wLink.y - lh / 2,
              width: lw,
              height: lh,
              rotation: 0,
              href: "https://example.com",
              label: "Link",
              zIndex: Date.now(),
              updatedAt: serverTimestamp(),
            });
            onLinkPlaced?.(newId);
          } catch (err) {
            console.error("[objects] add link failed", err);
          }
        })();
        return;
      }

      if (spaceDown.current || e.evt.button !== 0) return;

      const w = pointerToWorld(st, scale, stagePos);
      if (!w) return;

      cleanupMarqueeListeners.current?.();
      cleanupMarqueeListeners.current = null;

      const start = { x1: w.x, y1: w.y, x2: w.x, y2: w.y };
      marqueeSession.current = start;
      setMarqueeWorld(start);
      setOverlayEdit(null);

      const onMove = (me: MouseEvent) => {
        const ww = screenToWorld(me.clientX, me.clientY);
        if (!ww || !marqueeSession.current) return;
        const next = {
          ...marqueeSession.current,
          x2: ww.x,
          y2: ww.y,
        };
        marqueeSession.current = next;
        setMarqueeWorld(next);
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        cleanupMarqueeListeners.current = null;

        const m = marqueeSession.current;
        marqueeSession.current = null;
        setMarqueeWorld(null);
        if (!m) return;

        const norm = normalizeMarqueeRect(m.x1, m.y1, m.x2, m.y2);
        const dragged =
          norm.width > MARQUEE_DRAG_PX || norm.height > MARQUEE_DRAG_PX;
        if (dragged) {
          const resolve = (id: string) => objects.find((x) => x.id === id);
          const hits = objects
            .filter((o) =>
              aabbIntersect(norm, boardObjectWorldAabb(o, resolve)),
            )
            .map((o) => o.id);
          onMarqueeSelect(hits);
        } else {
          onClearSelection();
        }
      };

      cleanupMarqueeListeners.current = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [
      handToolActive,
      eraserBrushActive,
      eraserBrushRadius,
      onEraserBrushApply,
      onLineStageBackgroundDown,
      onClearSelection,
      onMarqueeSelect,
      objects,
      scale,
      stagePos,
      screenToWorld,
      railDrawMode,
      railPenStrokeColor,
      railHighlighterStrokeColor,
      lassoActive,
      commentPlaceActive,
      onCommentPlaced,
      linkPlaceActive,
      onLinkPlaced,
      onHistoryCheckpoint,
      onRailActionComplete,
      penStrokeWidth,
      highlighterStrokeWidth,
      user,
      boardId,
    ],
  );

  useEffect(() => {
    return () => {
      cleanupMarqueeListeners.current?.();
      cleanupDrawingListeners.current?.();
      cleanupLassoListeners.current?.();
    };
  }, []);

  const handleStageMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (!onLineStagePointerMoveWorld) return;
      const st = e.target.getStage();
      if (!st) return;
      const w = pointerToWorld(st, scale, stagePos);
      if (w) onLineStagePointerMoveWorld(w);
    },
    [onLineStagePointerMoveWorld, scale, stagePos],
  );

  return (
    <div
      ref={setWrapRef}
      className={`absolute inset-0 min-h-0 touch-none ${cursorClass}`}
      onPointerDownCapture={onPointerDownCapture}
      onPointerMove={onPointerMoveWrap}
      onPointerUp={onPointerUpWrap}
      onPointerCancel={onPointerUpWrap}
      onPointerLeave={onPointerUpWrap}
      role="presentation"
    >
      {ready ? (
        <Stage
          ref={stageRef}
          width={size.w}
          height={size.h}
          scaleX={scale}
          scaleY={scale}
          x={stagePos.x}
          y={stagePos.y}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          style={{ touchAction: "none" }}
        >
          <Layer name="objects">
            {displayObjects
              .filter((o) => o.type !== "connector")
              .map((o) => {
                if (isShapeLayerObject(o)) {
                  return (
                    <BoardObjectShape
                      key={o.id}
                      object={o}
                      isSelected={selectedObjectIds.includes(o.id)}
                      interactionLocked={interactionLocked}
                      innerRef={
                        o.type === "freehand" || o.type === "line"
                          ? () => {}
                          : (n) => registerTransformTarget(o.id, n)
                      }
                      onObjectTap={(ev) =>
                        onSelectObject(o.id, ev.evt.shiftKey, ev.evt)
                      }
                      onRequestEdit={() => {
                        if (o.type === "rect") {
                          openRectEditor(o.id);
                          return;
                        }
                        onSelectObject(o.id, false);
                      }}
                      {...objectDragHandlers(o.id)}
                    />
                  );
                }
                if (o.type === "sticky") {
                  return (
                    <StickyNoteShape
                      key={o.id}
                      object={o}
                      isSelected={selectedObjectIds.includes(o.id)}
                      interactionLocked={interactionLocked}
                      textSearchVisual={textSearchVisualFor(o.id)}
                      innerRef={(n) => registerTransformTarget(o.id, n)}
                      onObjectTap={(ev) =>
                        onSelectObject(o.id, ev.evt.shiftKey, ev.evt)
                      }
                      onRequestEdit={() => openStickyEditor(o.id)}
                      {...objectDragHandlers(o.id)}
                    />
                  );
                }
                if (o.type === "frame") {
                  return (
                    <FrameShape
                      key={o.id}
                      object={o}
                      isSelected={selectedObjectIds.includes(o.id)}
                      interactionLocked={interactionLocked}
                      innerRef={(n) => registerTransformTarget(o.id, n)}
                      onObjectTap={(ev) =>
                        onSelectObject(o.id, ev.evt.shiftKey, ev.evt)
                      }
                      {...objectDragHandlers(o.id)}
                    />
                  );
                }
                if (o.type === "text") {
                  return (
                    <TextObjectShape
                      key={o.id}
                      object={o}
                      isSelected={selectedObjectIds.includes(o.id)}
                      interactionLocked={interactionLocked}
                      textSearchVisual={textSearchVisualFor(o.id)}
                      innerRef={(n) => registerTransformTarget(o.id, n)}
                      onObjectTap={(ev) =>
                        onSelectObject(o.id, ev.evt.shiftKey, ev.evt)
                      }
                      onRequestEdit={() => openTextObjectEditor(o.id)}
                      {...objectDragHandlers(o.id)}
                    />
                  );
                }
                if (o.type === "link") {
                  const l = o as BoardObjectLink;
                  return (
                    <LinkHotspotShape
                      key={l.id}
                      object={l}
                      isSelected={selectedObjectIds.includes(l.id)}
                      interactionLocked={interactionLocked}
                      innerRef={(n) => registerTransformTarget(l.id, n)}
                      onObjectTap={(ev) =>
                        onSelectObject(l.id, ev.evt.shiftKey, ev.evt)
                      }
                      {...objectDragHandlers(l.id)}
                    />
                  );
                }
                if (o.type === "comment") {
                  return (
                    <CommentPinShape
                      key={o.id}
                      object={o}
                      isSelected={selectedObjectIds.includes(o.id)}
                      interactionLocked={interactionLocked}
                      innerRef={() => {}}
                      onObjectTap={(ev) =>
                        onSelectObject(o.id, ev.evt.shiftKey, ev.evt)
                      }
                      onRequestEdit={() => openCommentEditor(o.id)}
                      {...objectDragHandlers(o.id)}
                    />
                  );
                }
                return null;
              })}
            {drawingDraft ? (
              <Line
                points={drawingDraft.points}
                stroke={drawingDraft.stroke}
                strokeWidth={
                  drawingDraft.mode === "pen"
                    ? penStrokeWidth
                    : highlighterStrokeWidth
                }
                opacity={drawingDraft.mode === "highlighter" ? 0.45 : 1}
                lineCap="round"
                lineJoin="round"
                perfectDrawEnabled={false}
                listening={false}
              />
            ) : null}
            {eraserDraftPoints && eraserDraftPoints.length >= 2 ? (
              <Line
                points={eraserDraftPoints}
                stroke="rgba(244, 63, 94, 0.55)"
                strokeWidth={eraserBrushRadius * 2}
                lineCap="round"
                lineJoin="round"
                perfectDrawEnabled={false}
                listening={false}
              />
            ) : null}
            {lassoDraftPoints && lassoDraftPoints.length >= 4 ? (
              <Line
                points={lassoDraftPoints}
                stroke="#38bdf8"
                strokeWidth={2}
                dash={[6, 4]}
                lineCap="round"
                lineJoin="round"
                closed={false}
                listening={false}
              />
            ) : null}
            {linePreviewSegment ? (
              linePreviewSegment.lineStyle ? (
                <Arrow
                  points={lineConnectorWorldPoints(
                    linePreviewSegment.x1,
                    linePreviewSegment.y1,
                    linePreviewSegment.x2,
                    linePreviewSegment.y2,
                    linePreviewSegment.lineStyle,
                  )}
                  stroke={linePreviewSegment.stroke}
                  strokeWidth={2}
                  fill={linePreviewSegment.stroke}
                  dash={[8, 6]}
                  lineCap="round"
                  lineJoin="round"
                  pointerLength={12}
                  pointerWidth={12}
                  pointerAtBeginning={
                    linePreviewSegment.lineStyle === "arrowBoth" ||
                    linePreviewSegment.lineStyle === "orthogonalBoth"
                  }
                  pointerAtEnding
                  listening={false}
                />
              ) : (
                <Line
                  points={[
                    linePreviewSegment.x1,
                    linePreviewSegment.y1,
                    linePreviewSegment.x2,
                    linePreviewSegment.y2,
                  ]}
                  stroke={linePreviewSegment.stroke}
                  strokeWidth={2}
                  dash={[8, 6]}
                  lineCap="round"
                  listening={false}
                />
              )
            ) : null}
          </Layer>
          <Layer name="connectors">
            {objects
              .filter((o): o is BoardObjectConnector => o.type === "connector")
              .map((c) => (
                <ConnectorShape
                  key={c.id}
                  object={c}
                  objects={objects}
                  isSelected={selectedObjectIds.includes(c.id)}
                  innerRef={(n) => registerTransformTarget(c.id, n)}
                  onObjectTap={(ev) =>
                    onSelectObject(c.id, ev.evt.shiftKey, ev.evt)
                  }
                />
              ))}
          </Layer>
          <Layer name="selection-ui">
            {marqueeWorld ? (
              <Rect
                {...normalizeMarqueeRect(
                  marqueeWorld.x1,
                  marqueeWorld.y1,
                  marqueeWorld.x2,
                  marqueeWorld.y2,
                )}
                fill="rgba(56, 189, 248, 0.12)"
                stroke="#38bdf8"
                strokeWidth={1}
                listening={false}
              />
            ) : null}
            <Transformer
              ref={transformerRef}
              rotateEnabled
              rotationSnaps={[0, 90, 180, 270]}
              rotationSnapTolerance={6}
              anchorStroke="#34d399"
              borderStroke="#34d399"
              borderDash={[4, 4]}
              padding={6}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 8 || newBox.height < 8) return oldBox;
                return newBox;
              }}
              onTransformEnd={handleTransformEnd}
            />
          </Layer>
          <Layer listening={false}>
            {remoteCursors.map((c) => (
              <RemoteCursorShape key={c.uid} cursor={c} />
            ))}
          </Layer>
        </Stage>
      ) : null}
      {overlayEdit && overlayBox ? (
        <BoardInlineTextEditor
          open
          box={overlayBox}
          draft={overlayDraft}
          variant={
            overlayEdit.kind === "sticky" || overlayEdit.kind === "rect"
              ? "sticky"
              : overlayEdit.kind === "comment"
                ? "comment"
                : "text"
          }
          onDraftChange={(v) => {
            setOverlayDraft(v);
            if (overlayEdit.kind === "comment") {
              writes.queueObjectPatch(overlayEdit.id, { body: v });
            } else {
              writes.queueText(overlayEdit.id, v);
            }
          }}
          onClose={() => setOverlayEdit(null)}
          flushOnClose={() => {
            if (overlayEdit.kind === "comment") {
              void writes.flushCommentBodyNow(
                overlayEdit.id,
                overlayDraftRef.current,
              );
            } else {
              void writes.flushTextNow(
                overlayEdit.id,
                overlayDraftRef.current,
              );
            }
          }}
          stageContainer={
            // Konva `container()` is only read when the text editor is open; Stage is mounted.
            stageRef.current?.container() ?? null
          }
          scale={scale}
          stagePos={stagePos}
        />
      ) : null}
    </div>
  );
}

function RemoteCursorShape({ cursor }: { cursor: RemoteCursor }) {
  const { resolvedTheme } = useTheme();
  const light = resolvedTheme === "light";
  const pad = 6;
  const label =
    cursor.name.length > 24 ? `${cursor.name.slice(0, 22)}…` : cursor.name;
  return (
    <>
      <Circle
        x={cursor.x}
        y={cursor.y}
        radius={5}
        fill={light ? "#0284c7" : "#38bdf8"}
        stroke={light ? "#f4f4f5" : "#09090b"}
        strokeWidth={2}
        listening={false}
      />
      <Text
        x={cursor.x + pad}
        y={cursor.y - 18}
        text={label}
        fontSize={11}
        fontFamily="system-ui, sans-serif"
        fill={light ? "#0f172a" : "#e0f2fe"}
        padding={4}
        listening={false}
        shadowColor={light ? "rgba(255,255,255,0.9)" : "black"}
        shadowBlur={4}
        shadowOpacity={light ? 0.5 : 0.6}
      />
    </>
  );
}
