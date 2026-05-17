"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { User } from "firebase/auth";
import {
  collection,
  deleteField,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import {
  buildPasteOperations,
  encodeClipboardPayload,
  PASTE_OFFSET,
  tryDecodeClipboardPayload,
} from "@/lib/board-clipboard";
import { cloneBoardObjectFields } from "@/lib/clone-board-object";
import { BoardCanvasTemplatesModalPortal } from "@/components/board-templates-modal";
import { BoardStage } from "@/components/board-stage";
import { useBoardToolOptional } from "@/context/board-tool-context";
import { useBoardObjectWrites } from "@/hooks/use-board-object-writes";
import { useBoardObjects } from "@/hooks/use-board-objects";
import { useRemoteCursors } from "@/hooks/use-board-cursors";
import { getFirebaseDb } from "@/lib/firebase";
import type { BoardObject } from "@/lib/board-object";
import { boardFirestorePath } from "@/lib/board";
import {
  matchSwatchIndex,
  paletteChoiceFromStrokeColor,
  paletteChoiceToStyle,
  type BoardPaletteChoice,
} from "@/lib/board-color-swatches";
import type { EraserBrushChange } from "@/lib/board-eraser-geometry";
import { getTextSearchMatchIds } from "@/lib/board-search";
import {
  boardObjectSupportsUserHref,
  getBoardObjectHref,
} from "@/lib/board-object";
import { normalizeBoardHref, openBoardHrefInNewTab } from "@/lib/board-href";
import {
  BOARD_FONT_FAMILIES,
  boardFontFamilyFromId,
  boardFontFamilyIdFromValue,
  DEFAULT_BOARD_FONT_FAMILY,
} from "@/lib/board-font-presets";
import { boardObjectWorldAabb, pointInsideAxisRect } from "@/lib/board-geometry";
import { BoardPaletteStrip } from "@/components/board-palette-strip";
import { BoardShapesMenu } from "@/components/board-shapes-menu";
import { BoardToolGlyph } from "@/components/board-tool-glyphs";
import { BoardToolRail } from "@/components/board-tool-rail";
import { BoardCanvasRailMid } from "@/components/board-canvas-rail-mid";
import type { BoardObjectWrites } from "@/hooks/use-board-object-writes";
import type { BoardLineConnectorStyle } from "@/lib/board-line-connector";
import type { PolygonKind } from "@/lib/board-polygon-kinds";

type LineToolState =
  | { kind: "off" }
  | { kind: "awaiting_first"; lineStyle?: BoardLineConnectorStyle }
  | {
      kind: "awaiting_second";
      lineStyle?: BoardLineConnectorStyle;
      x1: number;
      y1: number;
      px: number;
      py: number;
    };

type BoardCanvasProps = {
  user: User;
  boardId: string;
  children?: ReactNode;
  /** Scroll to / focus the board AI panel (wired from the board page). */
  onRequestAiAssistant?: () => void;
};

const HISTORY_LIMIT = 80;

function snapshotFields(o: BoardObject): Record<string, unknown> {
  return cloneBoardObjectFields(o, 0, 0, o.zIndex, new Map());
}

/**
 * Shared board: CSS grid underlay + Konva stage (objects, cursors, pan/zoom).
 */
export function BoardCanvas({
  user,
  boardId,
  children,
  onRequestAiAssistant,
}: BoardCanvasProps) {
  const boardTool = useBoardToolOptional();
  const activeRailTool = boardTool?.activeTool ?? null;
  const undoRequestToken = boardTool?.undoRequestToken ?? 0;
  const redoRequestToken = boardTool?.redoRequestToken ?? 0;

  const remoteCursors = useRemoteCursors(boardId, user.uid);
  const objects = useBoardObjects(boardId);
  const baseWrites = useBoardObjectWrites(boardId, user);

  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const selectedIdsRef = useRef(selectedObjectIds);
  useEffect(() => {
    selectedIdsRef.current = selectedObjectIds;
  }, [selectedObjectIds]);
  const objectsRef = useRef<BoardObject[]>(objects);
  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);
  const [undoStack, setUndoStack] = useState<BoardObject[][]>([]);
  const [redoStack, setRedoStack] = useState<BoardObject[][]>([]);
  const undoStackRef = useRef<BoardObject[][]>(undoStack);
  const redoStackRef = useRef<BoardObject[][]>(redoStack);
  const pendingHistorySnapshotRef = useRef<BoardObject[] | null>(null);
  const applyingHistoryRef = useRef(false);
  const lastHandledUndoTokenRef = useRef(0);
  const lastHandledRedoTokenRef = useRef(0);
  useEffect(() => {
    undoStackRef.current = undoStack;
    boardTool?.setHistoryCanUndo(undoStack.length > 0);
  }, [undoStack, boardTool]);
  useEffect(() => {
    redoStackRef.current = redoStack;
    boardTool?.setHistoryCanRedo(redoStack.length > 0);
  }, [redoStack, boardTool]);
  /** Default yellow — readable new stickies; palette UI lists clear → black first. */
  const [boardPaletteChoice, setBoardPaletteChoice] =
    useState<BoardPaletteChoice>({ kind: "swatch", index: 3 });
  const [boardHelpOpen, setBoardHelpOpen] = useState(false);

  const [shapesMenuOpen, setShapesMenuOpen] = useState(false);
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const toolbarColorRef = useRef<HTMLDivElement>(null);
  const toolbarShapesRef = useRef<HTMLDivElement>(null);

  const [shapeAddBusy, setShapeAddBusy] = useState<
    null | "rect" | "ellipse" | PolygonKind
  >(null);
  const [addingSticky, setAddingSticky] = useState(false);
  const [clearingBoard, setClearingBoard] = useState(false);
  const [addingTextObj, setAddingTextObj] = useState(false);
  const [deletingSelection, setDeletingSelection] = useState(false);
  const [duplicatingSelection, setDuplicatingSelection] = useState(false);
  const [linkingConnector, setLinkingConnector] = useState(false);
  const [pasting, setPasting] = useState(false);
  const internalClipboardRef = useRef<string | null>(null);
  const [lineState, setLineState] = useState<LineToolState>({ kind: "off" });
  const lineStateRef = useRef<LineToolState>({ kind: "off" });
  const lineToolActive = lineState.kind !== "off";
  const shapePaletteRef = useRef(paletteChoiceToStyle({ kind: "swatch", index: 3 }));
  const [boardSearchQuery, setBoardSearchQuery] = useState("");
  const boardSearchQueryRef = useRef("");
  useEffect(() => {
    boardSearchQueryRef.current = boardSearchQuery;
  }, [boardSearchQuery]);

  const boardSearchTrim = boardSearchQuery.trim();
  const textSearchActive = boardSearchTrim.length > 0;
  const textSearchMatchIds = useMemo(
    () => getTextSearchMatchIds(objects, boardSearchTrim),
    [objects, boardSearchTrim],
  );

  const shapeStyle = useMemo(
    () => paletteChoiceToStyle(boardPaletteChoice),
    [boardPaletteChoice],
  );

  useEffect(() => {
    shapePaletteRef.current = shapeStyle;
  }, [shapeStyle]);

  const linkSelection = useMemo(() => {
    if (selectedObjectIds.length !== 1) return undefined;
    const o = objects.find((x) => x.id === selectedObjectIds[0]);
    if (!o || o.type === "comment" || !boardObjectSupportsUserHref(o))
      return undefined;
    return o;
  }, [objects, selectedObjectIds]);

  const [linkPanelOpen, setLinkPanelOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const [snapToGridEnabled, setSnapToGridEnabled] = useState(false);
  const [penStrokeWidth, setPenStrokeWidth] = useState(3);
  const [highlighterStrokeWidth, setHighlighterStrokeWidth] = useState(16);
  const [eraserMode, setEraserMode] = useState<"tap" | "brush">("brush");
  const [eraserBrushRadius, setEraserBrushRadius] = useState(20);
  useEffect(() => {
    if (!linkSelection) {
      setLinkDraft("");
      setLinkPanelOpen(false);
      return;
    }
    setLinkDraft(getBoardObjectHref(linkSelection) ?? "");
    setLinkPanelOpen(Boolean(getBoardObjectHref(linkSelection)));
  }, [linkSelection]);

  const selectedColorTarget = useMemo(() => {
    if (selectedObjectIds.length === 0) return undefined;
    const recolorable = selectedObjectIds
      .map((id) => objects.find((x) => x.id === id))
      .filter((o): o is BoardObject => {
        if (!o) return false;
        return (
          o.type === "sticky" ||
          o.type === "rect" ||
          o.type === "circle" ||
          o.type === "ellipse" ||
          o.type === "polygon" ||
          o.type === "frame" ||
          o.type === "line" ||
          o.type === "freehand" ||
          o.type === "text"
        );
      });
    if (recolorable.length === 0) return undefined;
    return recolorable.length === 1 ? recolorable[0] : recolorable;
  }, [objects, selectedObjectIds]);

  const selectedTypography = useMemo(() => {
    if (selectedObjectIds.length !== 1) return undefined;
    const o = objects.find((x) => x.id === selectedObjectIds[0]);
    if (o?.type === "text" || o?.type === "sticky") return o;
    return undefined;
  }, [objects, selectedObjectIds]);

  /** Palette strip value when editing selection (or draw tools). */
  const stickyStripChoice = useMemo((): BoardPaletteChoice => {
    const target = selectedColorTarget;
    if (!target) return boardPaletteChoice;
    const sample = Array.isArray(target) ? target[0] : target;
    if (!sample) return boardPaletteChoice;
    if (sample.type === "line" || sample.type === "freehand") {
      return paletteChoiceFromStrokeColor(sample.stroke);
    }
    const fill =
      "fill" in sample
        ? sample.fill
        : "stroke" in sample
          ? sample.stroke
          : "#fef08a";
    const stroke =
      "stroke" in sample && typeof sample.stroke === "string"
        ? sample.stroke
        : "#18181b";
    const idx = matchSwatchIndex(fill, stroke);
    if (idx !== null) return { kind: "swatch", index: idx };
    return { kind: "custom", fill, stroke };
  }, [selectedColorTarget, boardPaletteChoice]);

  const colorChipStyle = useMemo(() => {
    if (activeRailTool === "pen" || lineToolActive) {
      return { backgroundColor: shapeStyle.stroke };
    }
    if (activeRailTool === "highlighter") {
      return { backgroundColor: shapeStyle.fill };
    }
    if (selectedColorTarget) {
      const sample = Array.isArray(selectedColorTarget)
        ? selectedColorTarget[0]
        : selectedColorTarget;
      if (sample?.type === "line" || sample?.type === "freehand") {
        return { backgroundColor: sample.stroke };
      }
    }
    return { backgroundColor: shapeStyle.fill };
  }, [
    activeRailTool,
    lineToolActive,
    shapeStyle,
    selectedColorTarget,
  ]);

  const colorDropdownLabel = useMemo(() => {
    if (activeRailTool === "pen") return "Pen color";
    if (activeRailTool === "highlighter") return "Highlighter color";
    if (lineToolActive) return "Line color";
    if (selectedColorTarget) {
      return Array.isArray(selectedColorTarget)
        ? `Selection color (${selectedColorTarget.length})`
        : "Selection color";
    }
    return "New objects color";
  }, [activeRailTool, lineToolActive, selectedColorTarget]);

  useEffect(() => {
    if (!colorDropdownOpen && !shapesMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        colorDropdownOpen &&
        toolbarColorRef.current &&
        !toolbarColorRef.current.contains(t)
      ) {
        setColorDropdownOpen(false);
      }
      if (
        shapesMenuOpen &&
        toolbarShapesRef.current &&
        !toolbarShapesRef.current.contains(t)
      ) {
        setShapesMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setColorDropdownOpen(false);
        setShapesMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [colorDropdownOpen, shapesMenuOpen]);

  useEffect(() => {
    setSelectedObjectIds((prev) =>
      prev.filter((id) => objects.some((o) => o.id === id)),
    );
  }, [objects]);

  const captureHistoryCheckpoint = useCallback(() => {
    if (applyingHistoryRef.current) return;
    if (pendingHistorySnapshotRef.current) return;
    pendingHistorySnapshotRef.current = objectsRef.current.map((o) => ({ ...o }));
  }, []);

  const writes: BoardObjectWrites = useMemo(
    () => ({
      ...baseWrites,
      queueObjectPatch: (objectId, patch) => {
        captureHistoryCheckpoint();
        baseWrites.queueObjectPatch(objectId, patch);
      },
      queuePosition: (objectId, x, y) => {
        captureHistoryCheckpoint();
        baseWrites.queuePosition(objectId, x, y);
      },
      queueText: (objectId, text) => {
        captureHistoryCheckpoint();
        baseWrites.queueText(objectId, text);
      },
      flushTextNow: async (objectId, text) => {
        captureHistoryCheckpoint();
        await baseWrites.flushTextNow(objectId, text);
      },
      flushCommentBodyNow: async (objectId, body) => {
        captureHistoryCheckpoint();
        await baseWrites.flushCommentBodyNow(objectId, body);
      },
      flushObjectPatchNow: async (objectId, patch) => {
        captureHistoryCheckpoint();
        await baseWrites.flushObjectPatchNow(objectId, patch);
      },
      setStickyColors: async (objectId, fill, stroke) => {
        captureHistoryCheckpoint();
        await baseWrites.setStickyColors(objectId, fill, stroke);
      },
      setFillStrokeColors: async (objectId, fill, stroke) => {
        captureHistoryCheckpoint();
        await baseWrites.setFillStrokeColors(objectId, fill, stroke);
      },
      setStrokeColor: async (objectId, stroke) => {
        captureHistoryCheckpoint();
        await baseWrites.setStrokeColor(objectId, stroke);
      },
    }),
    [baseWrites, captureHistoryCheckpoint],
  );

  const recolorBoardObject = useCallback(
    (o: BoardObject, fill: string, stroke: string) => {
      if (o.type === "line" || o.type === "freehand") {
        void writes.setStrokeColor(o.id, stroke);
        return;
      }
      if (o.type === "text") {
        void writes.setFillStrokeColors(o.id, fill, stroke);
        return;
      }
      if (
        o.type === "sticky" ||
        o.type === "rect" ||
        o.type === "circle" ||
        o.type === "ellipse" ||
        o.type === "polygon" ||
        o.type === "frame"
      ) {
        void writes.setFillStrokeColors(o.id, fill, stroke);
      }
    },
    [writes],
  );

  /** Apply palette to draw tools and/or the current selection. */
  const applyPaletteChoice = useCallback(
    (next: BoardPaletteChoice) => {
      setBoardPaletteChoice(next);
      const { fill, stroke } = paletteChoiceToStyle(next);
      const ids = selectedIdsRef.current;
      for (const id of ids) {
        const o = objectsRef.current.find((x) => x.id === id);
        if (!o) continue;
        recolorBoardObject(o, fill, stroke);
      }
    },
    [recolorBoardObject],
  );

  useEffect(() => {
    if (applyingHistoryRef.current) return;
    const snap = pendingHistorySnapshotRef.current;
    if (!snap) return;
    let changed = snap.length !== objects.length;
    if (!changed) {
      const cur = objects;
      for (let i = 0; i < cur.length; i += 1) {
        const a = cur[i];
        const b = snap[i];
        if (!a || !b || a.id !== b.id || JSON.stringify(a) !== JSON.stringify(b)) {
          changed = true;
          break;
        }
      }
    }
    pendingHistorySnapshotRef.current = null;
    if (!changed) return;
    setUndoStack((prev) => [...prev, snap].slice(-HISTORY_LIMIT));
    setRedoStack([]);
  }, [objects]);

  const applySnapshot = useCallback(
    async (target: BoardObject[]) => {
      await user.getIdToken();
      const db = getFirebaseDb();
      const current = objectsRef.current;
      const curMap = new Map(current.map((o) => [o.id, o] as const));
      const targetMap = new Map(target.map((o) => [o.id, o] as const));
      const BATCH_SIZE = 300;

      const toDelete = current
        .filter((o) => !targetMap.has(o.id))
        .map((o) => doc(db, "boards", boardId, "objects", o.id));
      for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
        const chunk = toDelete.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((r) => batch.delete(r));
        await batch.commit();
      }

      const upserts = target.filter((t) => {
        const c = curMap.get(t.id);
        if (!c) return true;
        return JSON.stringify(snapshotFields(c)) !== JSON.stringify(snapshotFields(t));
      });
      for (let i = 0; i < upserts.length; i += BATCH_SIZE) {
        const chunk = upserts.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((o) =>
          batch.set(doc(db, "boards", boardId, "objects", o.id), {
            ...snapshotFields(o),
            updatedAt: serverTimestamp(),
          }),
        );
        await batch.commit();
      }
    },
    [boardId, user],
  );

  const undoHistory = useCallback(async () => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return;
    const target = stack[stack.length - 1]!;
    const current = objectsRef.current.map((o) => ({ ...o }));
    applyingHistoryRef.current = true;
    try {
      await applySnapshot(target);
      setUndoStack((prev) => prev.slice(0, -1));
      setRedoStack((prev) => [...prev, current].slice(-HISTORY_LIMIT));
      setSelectedObjectIds([]);
    } finally {
      applyingHistoryRef.current = false;
    }
  }, [applySnapshot]);

  const redoHistory = useCallback(async () => {
    const stack = redoStackRef.current;
    if (stack.length === 0) return;
    const target = stack[stack.length - 1]!;
    const current = objectsRef.current.map((o) => ({ ...o }));
    applyingHistoryRef.current = true;
    try {
      await applySnapshot(target);
      setRedoStack((prev) => prev.slice(0, -1));
      setUndoStack((prev) => [...prev, current].slice(-HISTORY_LIMIT));
      setSelectedObjectIds([]);
    } finally {
      applyingHistoryRef.current = false;
    }
  }, [applySnapshot]);

  useEffect(() => {
    if (!boardTool) return;
    if (undoRequestToken <= 0) return;
    if (undoRequestToken === lastHandledUndoTokenRef.current) return;
    lastHandledUndoTokenRef.current = undoRequestToken;
    void undoHistory();
  }, [undoRequestToken, undoHistory, boardTool]);

  useEffect(() => {
    if (!boardTool) return;
    if (redoRequestToken <= 0) return;
    if (redoRequestToken === lastHandledRedoTokenRef.current) return;
    lastHandledRedoTokenRef.current = redoRequestToken;
    void redoHistory();
  }, [redoRequestToken, redoHistory, boardTool]);

  const cancelLineTool = useCallback(() => {
    lineStateRef.current = { kind: "off" };
    setLineState({ kind: "off" });
  }, []);

  /** Exit pen/highlighter/lasso/etc. so the canvas is in pointer–select mode. */
  const releaseRailToolForEditing = useCallback(() => {
    boardTool?.setNotice(null);
    boardTool?.setActiveTool(null);
  }, [boardTool]);

  const openColorDropdown = useCallback(() => {
    if (
      activeRailTool !== "pen" &&
      activeRailTool !== "highlighter" &&
      !lineToolActive
    ) {
      releaseRailToolForEditing();
    }
    setColorDropdownOpen((o) => !o);
    setShapesMenuOpen(false);
  }, [
    activeRailTool,
    lineToolActive,
    releaseRailToolForEditing,
  ]);

  const deleteObjectIdsQuiet = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      try {
        await user.getIdToken();
        const db = getFirebaseDb();
        const BATCH_SIZE = 500;
        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
          const chunk = ids.slice(i, i + BATCH_SIZE);
          const batch = writeBatch(db);
          chunk.forEach((id) =>
            batch.delete(doc(db, "boards", boardId, "objects", id)),
          );
          await batch.commit();
        }
      } catch (e) {
        console.error("[objects] quiet delete failed", e);
      }
    },
    [boardId, user],
  );

  useEffect(() => {
    if (
      activeRailTool === "pen" ||
      activeRailTool === "highlighter" ||
      activeRailTool === "eraser" ||
      activeRailTool === "lasso" ||
      activeRailTool === "comments" ||
      activeRailTool === "hyperlinks"
    ) {
      cancelLineTool();
    }
  }, [activeRailTool, cancelLineTool]);

  const onSelectObject = useCallback(
    (
      objectId: string,
      shiftKey: boolean,
      nativeEvent?: globalThis.MouseEvent,
    ) => {
      if (nativeEvent && (nativeEvent.metaKey || nativeEvent.ctrlKey)) {
        const o = objects.find((x) => x.id === objectId);
        const href = o ? getBoardObjectHref(o) : undefined;
        if (href) {
          openBoardHrefInNewTab(href);
          return;
        }
      }
      if (activeRailTool === "eraser" && eraserMode === "tap") {
        void deleteObjectIdsQuiet([objectId]);
        return;
      }
      if (activeRailTool === "eraser") {
        return;
      }
      if (shiftKey) {
        setSelectedObjectIds((prev) =>
          prev.includes(objectId)
            ? prev.filter((id) => id !== objectId)
            : [...prev, objectId],
        );
      } else {
        setSelectedObjectIds([objectId]);
      }
    },
    [activeRailTool, eraserMode, objects, deleteObjectIdsQuiet],
  );

  const onEraserBrushApply = useCallback(
    async (change: EraserBrushChange) => {
      if (
        change.deleteIds.length === 0 &&
        change.updates.length === 0 &&
        change.creates.length === 0
      ) {
        return;
      }
      try {
        await user.getIdToken();
        const db = getFirebaseDb();
        for (const { id, patch } of change.updates) {
          await writes.flushObjectPatchNow(id, patch);
        }
        for (const create of change.creates) {
          const id = crypto.randomUUID();
          await setDoc(doc(db, "boards", boardId, "objects", id), {
            ...create.fields,
            zIndex: Date.now(),
            updatedAt: serverTimestamp(),
          });
        }
        await deleteObjectIdsQuiet(change.deleteIds);
      } catch (e) {
        console.error("[objects] eraser brush apply failed", e);
      }
    },
    [boardId, user, writes, deleteObjectIdsQuiet],
  );

  const onClearSelection = useCallback(() => {
    setSelectedObjectIds([]);
  }, []);

  const onMarqueeSelect = useCallback((ids: string[]) => {
    setSelectedObjectIds(ids);
  }, []);

  const toggleLineTool = useCallback(() => {
    const turningOn = lineStateRef.current.kind === "off";
    if (turningOn) {
      boardTool?.setNotice(null);
      boardTool?.setActiveTool(null);
    }
    setLineState((prev) => {
      const next: LineToolState =
        prev.kind === "off"
          ? { kind: "awaiting_first" }
          : { kind: "off" };
      lineStateRef.current = next;
      return next;
    });
  }, [boardTool]);

  /** Shapes menu: two-click connector with optional arrow / elbow / arc style. */
  const startConnectorLineToolFromShapesMenu = useCallback(
    (lineStyle: BoardLineConnectorStyle) => {
      setShapesMenuOpen(false);
      setColorDropdownOpen(false);
      boardTool?.setNotice(null);
      boardTool?.setActiveTool(null);
      setLineState(() => {
        const next: LineToolState = { kind: "awaiting_first", lineStyle };
        lineStateRef.current = next;
        return next;
      });
    },
    [boardTool],
  );

  const deleteSelection = useCallback(async () => {
    if (selectedObjectIds.length === 0) return;
    const ok = window.confirm(
      `Delete ${selectedObjectIds.length} selected object(s)?`,
    );
    if (!ok) return;
    captureHistoryCheckpoint();

    setDeletingSelection(true);
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      const refs = selectedObjectIds.map((id) =>
        doc(db, "boards", boardId, "objects", id),
      );
      const BATCH_SIZE = 500;
      for (let i = 0; i < refs.length; i += BATCH_SIZE) {
        const chunk = refs.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((r) => batch.delete(r));
        await batch.commit();
      }
      setSelectedObjectIds([]);
      cancelLineTool();
    } catch (e) {
      console.error("[objects] delete selection failed", e);
    } finally {
      setDeletingSelection(false);
    }
  }, [boardId, user, selectedObjectIds, cancelLineTool, captureHistoryCheckpoint]);

  const duplicateSelection = useCallback(async () => {
    if (selectedObjectIds.length === 0) return;

    const expandedIds = new Set(selectedObjectIds);
    for (const id of selectedObjectIds) {
      const frame = objects.find((o) => o.id === id && o.type === "frame");
      if (!frame || frame.type !== "frame") continue;
      for (const other of objects) {
        if (
          other.id === frame.id ||
          other.type === "frame" ||
          other.type === "connector"
        ) {
          continue;
        }
        const box = boardObjectWorldAabb(other);
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        if (
          pointInsideAxisRect(cx, cy, frame.x, frame.y, frame.width, frame.height)
        ) {
          expandedIds.add(other.id);
        }
      }
    }

    const idsToDuplicate = [...expandedIds];
    const selected = idsToDuplicate
      .map((id) => objects.find((o) => o.id === id))
      .filter((o): o is BoardObject => o !== undefined);
    if (selected.length === 0) return;
    captureHistoryCheckpoint();

    const idRemap = new Map(
      selected.map((o) => [o.id, crypto.randomUUID()] as const),
    );
    const DUP = 24;

    setDuplicatingSelection(true);
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      const baseZ = Date.now();
      let zi = 0;
      const nonConn = selected.filter((o) => o.type !== "connector");
      const conns = selected.filter((o) => o.type === "connector");

      for (const o of nonConn) {
        const newId = idRemap.get(o.id)!;
        const payload = cloneBoardObjectFields(
          o,
          DUP,
          DUP,
          baseZ + zi,
          idRemap,
        );
        zi += 1;
        await setDoc(doc(db, "boards", boardId, "objects", newId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      }
      for (const o of conns) {
        const newId = idRemap.get(o.id)!;
        const payload = cloneBoardObjectFields(o, 0, 0, baseZ + zi, idRemap);
        zi += 1;
        await setDoc(doc(db, "boards", boardId, "objects", newId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      }

      setSelectedObjectIds(
        idsToDuplicate
          .map((id) => idRemap.get(id))
          .filter((id): id is string => Boolean(id)),
      );
    } catch (e) {
      console.error("[objects] duplicate failed", e);
    } finally {
      setDuplicatingSelection(false);
    }
  }, [boardId, user, selectedObjectIds, objects, captureHistoryCheckpoint]);

  const copySelection = useCallback(async () => {
    const selected = selectedObjectIds
      .map((id) => objects.find((o) => o.id === id))
      .filter((o): o is BoardObject => o !== undefined);
    if (selected.length === 0) return;

    const encoded = encodeClipboardPayload(selected);
    internalClipboardRef.current = encoded;
    try {
      await navigator.clipboard.writeText(encoded);
    } catch (e) {
      console.warn("[objects] clipboard write failed; kept internal buffer", e);
    }
  }, [selectedObjectIds, objects]);

  const pasteFromClipboard = useCallback(async () => {
    setPasting(true);
    try {
      let text = "";
      try {
        text = await navigator.clipboard.readText();
      } catch {
        text = "";
      }
      let payload = tryDecodeClipboardPayload(text);
      if (!payload && internalClipboardRef.current) {
        payload = tryDecodeClipboardPayload(internalClipboardRef.current);
      }
      if (!payload || payload.items.length === 0) return;

      const ops = buildPasteOperations(payload, PASTE_OFFSET, PASTE_OFFSET);
      if (ops.length === 0) return;
      captureHistoryCheckpoint();

      await user.getIdToken();
      const db = getFirebaseDb();
      for (const { id, data } of ops) {
        await setDoc(doc(db, "boards", boardId, "objects", id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
      }
      setSelectedObjectIds(ops.map((o) => o.id));
      cancelLineTool();
    } catch (e) {
      console.error("[objects] paste failed", e);
    } finally {
      setPasting(false);
    }
  }, [boardId, user, cancelLineTool, captureHistoryCheckpoint]);

  const addTextObject = useCallback(async () => {
    releaseRailToolForEditing();
    cancelLineTool();
    captureHistoryCheckpoint();
    setAddingTextObj(true);
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      const id = crypto.randomUUID();
      await setDoc(doc(db, "boards", boardId, "objects", id), {
        type: "text",
        x: 100 + Math.random() * 40,
        y: 100 + Math.random() * 40,
        width: 280,
        height: 100,
        rotation: 0,
        text: "Double-click to edit",
        fontSize: 18,
        fontFamily: DEFAULT_BOARD_FONT_FAMILY,
        fill: "#18181b",
        zIndex: Date.now(),
        updatedAt: serverTimestamp(),
      });
      setSelectedObjectIds([id]);
    } catch (e) {
      console.error("[objects] add text failed", e);
    } finally {
      setAddingTextObj(false);
    }
  }, [boardId, user, cancelLineTool, captureHistoryCheckpoint, releaseRailToolForEditing]);

  const connectTwoSelected = useCallback(async () => {
    if (selectedObjectIds.length !== 2) return;
    const [a, b] = selectedObjectIds;
    if (!a || !b || a === b) return;
    captureHistoryCheckpoint();

    setLinkingConnector(true);
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      const id = crypto.randomUUID();
      const { fill: connectorColor } = shapePaletteRef.current;
      await setDoc(doc(db, "boards", boardId, "objects", id), {
        type: "connector",
        fromId: a,
        toId: b,
        stroke: connectorColor,
        strokeWidth: 2,
        zIndex: Date.now(),
        updatedAt: serverTimestamp(),
      });
      cancelLineTool();
      setSelectedObjectIds([id]);
      releaseRailToolForEditing();
      boardTool?.setNotice(
        "Connector added — arrow points from the first object you selected to the second.",
      );
    } catch (e) {
      console.error("[objects] connect failed", e);
      boardTool?.setNotice("Could not connect — select exactly two shapes and try again.");
    } finally {
      setLinkingConnector(false);
    }
  }, [
    boardId,
    user,
    selectedObjectIds,
    cancelLineTool,
    captureHistoryCheckpoint,
    releaseRailToolForEditing,
    boardTool,
  ]);

  const rotateSelection90 = useCallback(() => {
    if (selectedObjectIds.length === 0) return;
    captureHistoryCheckpoint();
    for (const id of selectedObjectIds) {
      const o = objects.find((x) => x.id === id);
      if (
        !o ||
        o.type === "line" ||
        o.type === "freehand" ||
        o.type === "comment" ||
        o.type === "connector"
      ) {
        continue;
      }
      const next = ((o.rotation ?? 0) + 90) % 360;
      writes.queueObjectPatch(id, { rotation: next });
    }
  }, [selectedObjectIds, objects, writes, captureHistoryCheckpoint]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        if (boardSearchQueryRef.current.trim().length > 0) {
          setBoardSearchQuery("");
          return;
        }
        cancelLineTool();
        setSelectedObjectIds([]);
        return;
      }
      if (e.code !== "Delete" && e.code !== "Backspace") return;
      const t = e.target as HTMLElement;
      if (
        t.closest("textarea") ||
        t.closest("input") ||
        t.isContentEditable
      ) {
        return;
      }
      if (selectedIdsRef.current.length === 0) return;
      e.preventDefault();
      void deleteSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelLineTool, deleteSelection]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const t = e.target as HTMLElement;
      if (
        t.closest("textarea") ||
        t.closest("input") ||
        t.isContentEditable
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "c") {
        if (selectedIdsRef.current.length === 0) return;
        e.preventDefault();
        void copySelection();
        return;
      }
      if (key === "v") {
        e.preventDefault();
        void pasteFromClipboard();
        return;
      }
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          void redoHistory();
        } else {
          void undoHistory();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copySelection, pasteFromClipboard, undoHistory, redoHistory]);

  const finishLineDoc = useCallback(
    async (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      lineStyle?: BoardLineConnectorStyle,
    ) => {
      captureHistoryCheckpoint();
      try {
        await user.getIdToken();
        const db = getFirebaseDb();
        const id = crypto.randomUUID();
        const { stroke: lineColor } = shapePaletteRef.current;
        await setDoc(doc(db, "boards", boardId, "objects", id), {
          type: "line",
          x1,
          y1,
          x2,
          y2,
          stroke: lineColor,
          strokeWidth: 2,
          zIndex: Date.now(),
          ...(lineStyle ? { lineStyle } : {}),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("[objects] add line failed", e);
      }
    },
    [boardId, user, captureHistoryCheckpoint],
  );

  const onLineStageBackgroundDown = useCallback(
    (w: { x: number; y: number }) => {
      const s = lineStateRef.current;
      if (s.kind === "off") return;
      if (s.kind === "awaiting_first") {
        const next: LineToolState = {
          kind: "awaiting_second",
          lineStyle: s.lineStyle,
          x1: w.x,
          y1: w.y,
          px: w.x,
          py: w.y,
        };
        lineStateRef.current = next;
        setLineState(next);
        return;
      }
      const dx = w.x - s.x1;
      const dy = w.y - s.y1;
      if (dx * dx + dy * dy < 4) return;
      lineStateRef.current = { kind: "off" };
      setLineState({ kind: "off" });
      void finishLineDoc(s.x1, s.y1, w.x, w.y, s.lineStyle);
    },
    [finishLineDoc],
  );

  const onLineStagePointerMoveWorld = useCallback((w: { x: number; y: number }) => {
    const s = lineStateRef.current;
    if (s.kind !== "awaiting_second") return;
    const next: LineToolState = { ...s, px: w.x, py: w.y };
    lineStateRef.current = next;
    setLineState(next);
  }, []);

  const addRectangle = useCallback(async () => {
    releaseRailToolForEditing();
    cancelLineTool();
    captureHistoryCheckpoint();
    setShapeAddBusy("rect");
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      const id = crypto.randomUUID();
      const { fill, stroke } = shapePaletteRef.current;
      await setDoc(doc(db, "boards", boardId, "objects", id), {
        type: "rect",
        x: 40 + Math.random() * 80,
        y: 40 + Math.random() * 80,
        width: 180,
        height: 112,
        rotation: 0,
        fill,
        stroke,
        strokeWidth: 2,
        text: "",
        zIndex: Date.now(),
        updatedAt: serverTimestamp(),
      });
      setSelectedObjectIds([id]);
    } catch (e) {
      console.error("[objects] add rect failed", e);
    } finally {
      setShapeAddBusy(null);
    }
  }, [boardId, user, cancelLineTool, captureHistoryCheckpoint, releaseRailToolForEditing]);

  const addEllipse = useCallback(async () => {
    releaseRailToolForEditing();
    cancelLineTool();
    captureHistoryCheckpoint();
    setShapeAddBusy("ellipse");
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      const id = crypto.randomUUID();
      const { fill, stroke } = shapePaletteRef.current;
      const r = 56;
      await setDoc(doc(db, "boards", boardId, "objects", id), {
        type: "ellipse",
        x: 80 + Math.random() * 80,
        y: 80 + Math.random() * 80,
        radiusX: r,
        radiusY: r,
        rotation: 0,
        fill,
        stroke,
        strokeWidth: 2,
        zIndex: Date.now(),
        updatedAt: serverTimestamp(),
      });
      setSelectedObjectIds([id]);
    } catch (e) {
      console.error("[objects] add ellipse failed", e);
    } finally {
      setShapeAddBusy(null);
    }
  }, [boardId, user, cancelLineTool, captureHistoryCheckpoint, releaseRailToolForEditing]);

  const addPolygon = useCallback(
    async (kind: PolygonKind) => {
      releaseRailToolForEditing();
      cancelLineTool();
      captureHistoryCheckpoint();
      setShapeAddBusy(kind);
      try {
        await user.getIdToken();
        const db = getFirebaseDb();
        const id = crypto.randomUUID();
        const { fill, stroke } = shapePaletteRef.current;
        await setDoc(doc(db, "boards", boardId, "objects", id), {
          type: "polygon",
          kind,
          x: 40 + Math.random() * 70,
          y: 40 + Math.random() * 70,
          width: 200,
          height: 120,
          rotation: 0,
          fill,
          stroke,
          strokeWidth: 2,
          zIndex: Date.now(),
          updatedAt: serverTimestamp(),
        });
        setSelectedObjectIds([id]);
        setShapesMenuOpen(false);
      } catch (e) {
        console.error("[objects] add polygon failed", e);
      } finally {
        setShapeAddBusy(null);
      }
    },
    [boardId, user, cancelLineTool, captureHistoryCheckpoint, releaseRailToolForEditing],
  );

  const addSticky = useCallback(async () => {
    releaseRailToolForEditing();
    cancelLineTool();
    captureHistoryCheckpoint();
    setAddingSticky(true);
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      const id = crypto.randomUUID();
      const { fill, stroke } = shapePaletteRef.current;
      await setDoc(doc(db, "boards", boardId, "objects", id), {
        type: "sticky",
        x: 120 + Math.random() * 80,
        y: 120 + Math.random() * 80,
        width: 220,
        height: 160,
        rotation: 0,
        fill,
        stroke,
        strokeWidth: 1,
        text: "Double-click to edit",
        zIndex: Date.now(),
        updatedAt: serverTimestamp(),
      });
      setSelectedObjectIds([id]);
    } catch (e) {
      console.error("[objects] add sticky failed", e);
    } finally {
      setAddingSticky(false);
    }
  }, [boardId, user, cancelLineTool, captureHistoryCheckpoint, releaseRailToolForEditing]);

  const clearBoardObjects = useCallback(async () => {
    if (objects.length === 0) return;
    const ok = window.confirm(
      `Delete all ${objects.length} object(s) on this board? This cannot be undone. (Cursors and presence are not cleared.)`,
    );
    if (!ok) return;
    captureHistoryCheckpoint();

    setClearingBoard(true);
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      const snap = await getDocs(
        collection(db, "boards", boardId, "objects"),
      );
      const refs = snap.docs.map((d) => d.ref);
      const BATCH_SIZE = 500;
      for (let i = 0; i < refs.length; i += BATCH_SIZE) {
        const chunk = refs.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((r) => batch.delete(r));
        await batch.commit();
      }
      setSelectedObjectIds([]);
      cancelLineTool();
    } catch (e) {
      console.error("[objects] clear board failed", e);
    } finally {
      setClearingBoard(false);
    }
  }, [boardId, user, objects.length, cancelLineTool, captureHistoryCheckpoint]);

  const linePreviewSegment =
    lineState.kind === "awaiting_second"
      ? {
          x1: lineState.x1,
          y1: lineState.y1,
          x2: lineState.px,
          y2: lineState.py,
          stroke: shapeStyle.stroke,
          lineStyle: lineState.lineStyle,
        }
      : null;

  const railDrawMode = useMemo(() => {
    if (activeRailTool === "pen") return "pen" as const;
    if (activeRailTool === "highlighter") return "highlighter" as const;
    return "none" as const;
  }, [activeRailTool]);

  const eraserBrushActive =
    activeRailTool === "eraser" && eraserMode === "brush";

  const lassoActive = activeRailTool === "lasso";
  const commentPlaceActive = activeRailTool === "comments";
  const linkPlaceActive = activeRailTool === "hyperlinks";
  const handToolActive = activeRailTool === "hand";

  const applySelectionLink = useCallback(() => {
    if (!linkSelection) return;
    const n = normalizeBoardHref(linkDraft);
    if (!n) {
      boardTool?.setNotice("Enter a valid http(s) URL (e.g. example.com).");
      return;
    }
    boardTool?.setNotice(null);
    let label: string;
    try {
      label = new URL(n).hostname || "Link";
    } catch {
      label = "Link";
    }
    if (linkSelection.type === "link") {
      writes.queueObjectPatch(linkSelection.id, { href: n, label });
    } else {
      writes.queueObjectPatch(linkSelection.id, { href: n });
    }
  }, [linkSelection, linkDraft, writes, boardTool]);

  const clearSelectionLink = useCallback(() => {
    if (!linkSelection) return;
    if (linkSelection.type === "link") {
      boardTool?.setNotice("Delete a link hotspot with Delete, or change its URL.");
      return;
    }
    boardTool?.setNotice(null);
    writes.queueObjectPatch(linkSelection.id, { href: deleteField() });
  }, [linkSelection, writes, boardTool]);

  useEffect(() => {
    if (!boardHelpOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setBoardHelpOpen(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [boardHelpOpen]);

  const midRailSlot = useMemo(
    () => (
      <BoardCanvasRailMid
        onAddText={() => void addTextObject()}
        addingTextObj={addingTextObj}
        onToggleLine={() => toggleLineTool()}
        lineToolActive={lineToolActive}
        onConnect={() => void connectTwoSelected()}
        linkingConnector={linkingConnector}
        canConnect={selectedObjectIds.length === 2}
        onDuplicate={() => void duplicateSelection()}
        duplicatingSelection={duplicatingSelection}
        canActOnSelection={selectedObjectIds.length > 0}
      />
    ),
    [
      addingTextObj,
      lineToolActive,
      linkingConnector,
      selectedObjectIds.length,
      duplicatingSelection,
      addTextObject,
      toggleLineTool,
      connectTwoSelected,
      duplicateSelection,
    ],
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:gap-4">
      <BoardToolRail midRailSlot={midRailSlot} />
      <div
        className="relative flex min-h-[min(50vh,420px)] min-w-0 flex-1 flex-col overflow-visible rounded-xl border border-zinc-200 bg-white/80 shadow-inner touch-none dark:border-zinc-800 dark:bg-zinc-900/40 lg:min-h-[min(70vh,560px)]"
        aria-label="Board canvas — wheel zoom, optional Hand tool, Space or middle-drag pan, pointer broadcasts cursor"
      >
      <div className="board-canvas-grid pointer-events-none absolute inset-0 z-0 opacity-45 dark:opacity-[0.35]" />

      <div className="absolute left-3 top-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2 pointer-events-auto">
        <div className="flex min-w-[9rem] max-w-[14rem] flex-1 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white/95 px-2 py-1 shadow dark:border-zinc-700 dark:bg-zinc-900/95 sm:min-w-[12rem] sm:max-w-[18rem]">
          <label htmlFor="board-text-search" className="sr-only">
            Search sticky notes and text boxes
          </label>
          <span className="text-zinc-400 dark:text-zinc-500" aria-hidden>
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </span>
          <input
            id="board-text-search"
            type="search"
            value={boardSearchQuery}
            onChange={(e) => setBoardSearchQuery(e.target.value)}
            placeholder="Search stickies & text…"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-0.5 text-xs text-zinc-900 placeholder:text-zinc-500 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          {textSearchActive ? (
            <span className="shrink-0 tabular-nums text-[11px] text-zinc-500 dark:text-zinc-400">
              {textSearchMatchIds.size} match
              {textSearchMatchIds.size === 1 ? "" : "es"}
            </span>
          ) : null}
        </div>
        {onRequestAiAssistant ? (
          <button
            type="button"
            onClick={() => onRequestAiAssistant()}
            className="shrink-0 rounded-lg border border-violet-500/90 bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white shadow hover:bg-violet-500 dark:border-violet-800/90 dark:bg-violet-900 dark:hover:bg-violet-800"
            aria-label="Open AI assistant for this board"
            title="AI assistant"
          >
            AI
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setBoardHelpOpen(true)}
          className="shrink-0 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          aria-label="Board help and shortcuts"
          title="Board help"
        >
          Help
        </button>
        <div ref={toolbarColorRef} className="relative shrink-0">
          <button
            type="button"
            onClick={openColorDropdown}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow dark:bg-zinc-900 ${
              colorDropdownOpen
                ? "border-emerald-500 ring-2 ring-emerald-500/30 dark:border-emerald-500"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            }`}
            aria-expanded={colorDropdownOpen}
            aria-haspopup="listbox"
            title={colorDropdownLabel}
          >
            <span
              className="h-4 w-4 shrink-0 rounded border border-zinc-300 dark:border-zinc-600"
              style={colorChipStyle}
            />
            <span>Color</span>
            <svg
              className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {colorDropdownOpen ? (
            <div className="absolute left-0 top-[calc(100%+0.35rem)] z-[60] w-[min(17.5rem,calc(100vw-2rem))] touch-manipulation rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-600 dark:bg-zinc-900 lg:z-[35]">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {colorDropdownLabel}
              </p>
              <BoardPaletteStrip
                choice={
                  selectedColorTarget &&
                  activeRailTool !== "pen" &&
                  activeRailTool !== "highlighter" &&
                  !lineToolActive
                    ? stickyStripChoice
                    : boardPaletteChoice
                }
                onChoiceChange={applyPaletteChoice}
                className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-1.5 dark:border-zinc-700 dark:bg-zinc-950/60"
                aria-label="Color palette"
              />
            </div>
          ) : null}
        </div>
        <div ref={toolbarShapesRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              releaseRailToolForEditing();
              setShapesMenuOpen((o) => !o);
              setColorDropdownOpen(false);
            }}
            disabled={shapeAddBusy !== null}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow disabled:opacity-50 dark:bg-zinc-900 ${
              shapesMenuOpen
                ? "border-emerald-500 ring-2 ring-emerald-500/30 dark:border-emerald-500"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            }`}
            aria-expanded={shapesMenuOpen}
            aria-haspopup="dialog"
            title="Shapes — connectors, rectangle, ellipse, polygons"
          >
            <BoardToolGlyph id="shapes" className="h-4 w-4 shrink-0" />
            <span>Shapes</span>
            <svg
              className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <BoardShapesMenu
            open={shapesMenuOpen}
            onClose={() => setShapesMenuOpen(false)}
            busy={shapeAddBusy !== null}
            onPickLineConnector={startConnectorLineToolFromShapesMenu}
            onPickRect={() => {
              setShapesMenuOpen(false);
              void addRectangle();
            }}
            onPickCircle={() => {
              setShapesMenuOpen(false);
              void addEllipse();
            }}
            onPickPolygon={(k) => {
              setShapesMenuOpen(false);
              void addPolygon(k);
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setColorDropdownOpen(false);
            setShapesMenuOpen(false);
            void addSticky();
          }}
          disabled={addingSticky}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          title="Add sticky note"
          aria-label="Add sticky note"
        >
          <BoardToolGlyph id="sticky-add" className="h-4 w-4 shrink-0" />
          <span>Sticky</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setColorDropdownOpen(false);
            setShapesMenuOpen(false);
            if (!boardTool) return;
            boardTool.setNotice(null);
            boardTool.setActiveTool(
              activeRailTool === "comments" ? null : "comments",
            );
          }}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow dark:bg-zinc-900 ${
            activeRailTool === "comments"
              ? "border-emerald-500 ring-2 ring-emerald-500/30 text-zinc-900 dark:border-emerald-500 dark:text-zinc-100"
              : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          }`}
          title="Place comment pins on the board (click again to stop)"
          aria-label="Comments — place pins on the board"
          aria-pressed={activeRailTool === "comments"}
        >
          <BoardToolGlyph id="comments" className="h-4 w-4 shrink-0" />
          <span>Comments</span>
        </button>
        {linkSelection ? (
          <div className="flex min-w-0 max-w-full flex-1 flex-wrap items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50/95 px-2 py-1.5 text-xs shadow dark:border-sky-900/50 dark:bg-sky-950/40">
            <button
              type="button"
              onClick={() => setLinkPanelOpen((o) => !o)}
              className="shrink-0 font-medium text-sky-800 dark:text-sky-200"
              aria-expanded={linkPanelOpen}
            >
              Link {linkPanelOpen ? "▾" : "▸"}
            </button>
            {!linkPanelOpen && linkDraft ? (
              <span className="max-w-[10rem] truncate font-mono text-[10px] text-zinc-600 dark:text-sky-200/80">
                {linkDraft}
              </span>
            ) : null}
            {linkPanelOpen ? (
              <>
            <input
              id="board-link-url"
              type="url"
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              placeholder="https://…"
              autoComplete="off"
              className="min-w-[8rem] flex-1 rounded border border-sky-200/80 bg-white px-1.5 py-0.5 font-mono text-[11px] text-zinc-900 focus:outline focus:outline-1 focus:outline-sky-500 dark:border-sky-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <span className="sr-only" aria-hidden>
              Cmd or Ctrl click the object on the board to open the link
            </span>
            <button
              type="button"
              onClick={() => void applySelectionLink()}
              className="shrink-0 rounded border border-sky-600 bg-sky-600 px-2 py-0.5 font-medium text-white hover:bg-sky-500 dark:border-sky-800 dark:hover:bg-sky-700"
            >
              Apply
            </button>
            {linkSelection.type !== "link" ? (
              <button
                type="button"
                onClick={() => void clearSelectionLink()}
                className="shrink-0 rounded border border-zinc-300 bg-white px-2 py-0.5 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                title="Remove link from this object"
              >
                Clear
              </button>
            ) : null}
              </>
            ) : null}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setSnapToGridEnabled((v) => !v)}
          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow ${
            snapToGridEnabled
              ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
          }`}
          title="Snap objects to 24px grid when moving"
        >
          Snap
        </button>
        <button
          type="button"
          onClick={rotateSelection90}
          disabled={selectedObjectIds.length === 0}
          className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
          title="Rotate selection 90°"
        >
          Rotate 90°
        </button>
        {(activeRailTool === "pen" || activeRailTool === "highlighter") && (
          <div className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-1 py-0.5 text-[10px] dark:border-zinc-600 dark:bg-zinc-900">
            <span className="px-1 text-zinc-500">Size</span>
            {[2, 4, 8].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() =>
                  activeRailTool === "pen"
                    ? setPenStrokeWidth(w === 2 ? 2 : w === 4 ? 4 : 8)
                    : setHighlighterStrokeWidth(w === 2 ? 10 : w === 4 ? 16 : 24)
                }
                className="rounded px-1.5 py-0.5 font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300"
              >
                {w === 2 ? "S" : w === 4 ? "M" : "L"}
              </button>
            ))}
          </div>
        )}
        {activeRailTool === "eraser" && (
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-300 bg-white px-1 py-0.5 text-[10px] dark:border-zinc-600 dark:bg-zinc-900">
            <span className="px-1 text-zinc-500">Eraser</span>
            <button
              type="button"
              onClick={() => setEraserMode("tap")}
              className={`rounded px-1.5 py-0.5 font-medium ${
                eraserMode === "tap"
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300"
              }`}
              title="Tap an object to delete it"
            >
              Tap
            </button>
            <button
              type="button"
              onClick={() => setEraserMode("brush")}
              className={`rounded px-1.5 py-0.5 font-medium ${
                eraserMode === "brush"
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300"
              }`}
              title="Drag to erase pen, highlighter, and line strokes"
            >
              Brush
            </button>
            {eraserMode === "brush" ? (
              <>
                <span className="px-0.5 text-zinc-400">|</span>
                <span className="px-1 text-zinc-500">Size</span>
                {([12, 20, 32] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setEraserBrushRadius(r)}
                    className={`rounded px-1.5 py-0.5 font-medium ${
                      eraserBrushRadius === r
                        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300"
                    }`}
                  >
                    {r === 12 ? "S" : r === 20 ? "M" : "L"}
                  </button>
                ))}
              </>
            ) : null}
          </div>
        )}
        {selectedTypography ? (
          <>
            <select
              aria-label="Font size"
              value={
                selectedTypography.type === "text"
                  ? selectedTypography.fontSize
                  : (selectedTypography.fontSize ?? 14)
              }
              onChange={(e) =>
                writes.queueObjectPatch(selectedTypography.id, {
                  fontSize: Number(e.target.value),
                })
              }
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-900"
            >
              {[12, 14, 18, 24, 32].map((n) => (
                <option key={n} value={n}>
                  {n}px
                </option>
              ))}
            </select>
            <select
              aria-label="Font family"
              value={boardFontFamilyIdFromValue(
                selectedTypography.fontFamily ?? DEFAULT_BOARD_FONT_FAMILY,
              )}
              onChange={(e) =>
                writes.queueObjectPatch(selectedTypography.id, {
                  fontFamily: boardFontFamilyFromId(e.target.value),
                })
              }
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-900"
            >
              {BOARD_FONT_FAMILIES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => void copySelection()}
          disabled={selectedObjectIds.length === 0}
          title="Copy selection (Ctrl/Cmd+C). Also stored in-app if the browser blocks clipboard."
          className="rounded-lg border border-slate-400/90 bg-slate-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-slate-500 disabled:opacity-40 dark:border-slate-700/90 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-800/90"
        >
          Copy
        </button>
        <button
          type="button"
          onClick={() => void pasteFromClipboard()}
          disabled={pasting}
          title="Paste (Ctrl/Cmd+V). Uses system clipboard or last in-app copy."
          className="rounded-lg border border-slate-400/80 bg-slate-500 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-slate-400 disabled:opacity-40 dark:border-slate-600/90 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-700/90"
        >
          {pasting ? "Pasting…" : "Paste"}
        </button>
        <button
          type="button"
          onClick={() => void deleteSelection()}
          disabled={deletingSelection || selectedObjectIds.length === 0}
          className="rounded-lg border border-orange-600/90 bg-orange-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-orange-500 disabled:opacity-40 dark:border-orange-900/80 dark:bg-orange-950/90 dark:text-orange-100 dark:hover:bg-orange-900/90"
        >
          {deletingSelection ? "Deleting…" : "Delete"}
        </button>
        <button
          type="button"
          onClick={() => void clearBoardObjects()}
          disabled={clearingBoard || objects.length === 0}
          title="Removes every doc under boards/…/objects. Does not clear cursors or presence."
          className="rounded-lg border border-red-600/90 bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-red-500 disabled:opacity-40 dark:border-red-900/80 dark:bg-red-950/90 dark:text-red-100 dark:hover:bg-red-900/90"
        >
          {clearingBoard ? "Clearing…" : "Clear board"}
        </button>
        {lineToolActive ? (
          <p className="w-full text-[11px] text-zinc-600 dark:text-zinc-400 sm:w-auto">
            {lineState.kind === "awaiting_first"
              ? lineState.lineStyle
                ? "Click the board for the connector start."
                : "Click the board for the line start."
              : "Click again for the end point. Esc cancels."}
          </p>
        ) : null}
      </div>

      <div className="relative z-[1] min-h-0 w-full min-w-0 flex-1 overflow-hidden">
        <BoardStage
          user={user}
          boardId={boardId}
          remoteCursors={remoteCursors}
          objects={objects}
          writes={writes}
          selectedObjectIds={selectedObjectIds}
          onSelectObject={onSelectObject}
          onClearSelection={onClearSelection}
          onMarqueeSelect={onMarqueeSelect}
          linePreviewSegment={linePreviewSegment}
          onLineStageBackgroundDown={
            lineToolActive ? onLineStageBackgroundDown : undefined
          }
          onLineStagePointerMoveWorld={
            lineState.kind === "awaiting_second"
              ? onLineStagePointerMoveWorld
              : undefined
          }
          textSearchActive={textSearchActive}
          textSearchMatchIds={textSearchMatchIds}
          railDrawMode={railDrawMode}
          railPenStrokeColor={shapeStyle.stroke}
          railHighlighterStrokeColor={shapeStyle.fill}
          penStrokeWidth={penStrokeWidth}
          highlighterStrokeWidth={highlighterStrokeWidth}
          snapToGridEnabled={snapToGridEnabled}
          lassoActive={lassoActive}
          commentPlaceActive={commentPlaceActive}
          onCommentPlaced={(id) => {
            setSelectedObjectIds([id]);
            releaseRailToolForEditing();
          }}
          linkPlaceActive={linkPlaceActive}
          onLinkPlaced={(id) => {
            setSelectedObjectIds([id]);
            releaseRailToolForEditing();
          }}
          onHistoryCheckpoint={captureHistoryCheckpoint}
          handToolActive={handToolActive}
          onRailActionComplete={releaseRailToolForEditing}
          eraserBrushActive={eraserBrushActive}
          eraserBrushRadius={eraserBrushRadius}
          onEraserBrushApply={onEraserBrushApply}
        />
      </div>

      {children ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center p-8">
          {children}
        </div>
      ) : null}

      {boardHelpOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[95] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-[1px]"
              role="presentation"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setBoardHelpOpen(false);
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="board-help-title"
                className="max-h-[min(85vh,560px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2
                    id="board-help-title"
                    className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                  >
                    Board help
                  </h2>
                  <button
                    type="button"
                    onClick={() => setBoardHelpOpen(false)}
                    className="shrink-0 rounded-lg border border-zinc-300 px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Close
                  </button>
                </div>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <strong className="text-zinc-800 dark:text-zinc-200">Canvas:</strong> wheel to zoom
                  toward the cursor; <strong className="text-zinc-900 dark:text-zinc-100">Hand (pan)</strong> on
                  the left tool bar (or bottom bar on a phone) lets you drag the board with a hand cursor; Space
                  or middle-mouse drag to pan; your pointer is shared as a remote cursor for collaborators.
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                  <li>
                    <strong className="text-zinc-900 dark:text-zinc-100">AI assistant</strong> for this board
                    lives in the side panel (right on large screens, above the canvas on phones). Use{" "}
                    <strong className="text-zinc-900 dark:text-zinc-100">Hide</strong> on that panel to collapse
                    it; when collapsed, use the narrow <strong className="text-zinc-900 dark:text-zinc-100">AI · People</strong> strip or the toolbar{" "}
                    <strong className="text-zinc-900 dark:text-zinc-100">AI</strong> button to open it again and focus the prompt.
                  </li>
                  <li>
                    <strong className="text-zinc-900 dark:text-zinc-100">Search</strong> (toolbar) filters
                    stickies and text boxes on the canvas (client-side).{" "}
                    <strong className="text-zinc-900 dark:text-zinc-100">Color</strong> and{" "}
                    <strong className="text-zinc-900 dark:text-zinc-100">Shapes</strong> are dropdowns on the
                    board toolbar (between Help and Copy).
                  </li>
                  <li>
                    <strong className="text-zinc-900 dark:text-zinc-100">Text</strong> boxes open for edit on
                    double-click. <strong className="text-zinc-900 dark:text-zinc-100">Frame</strong> objects (e.g.
                    from templates) draw behind newer objects.
                  </li>
                  <li>
                    <strong className="text-zinc-900 dark:text-zinc-100">Connect</strong> with exactly two
                    objects selected (Shift+click). <strong className="text-zinc-900 dark:text-zinc-100">Links:</strong>{" "}
                    set a URL in the toolbar when one link-capable object is selected; open with Cmd/Ctrl+click on the
                    board.
                  </li>
                  <li>
                    <strong className="text-zinc-900 dark:text-zinc-100">Copy / Paste</strong> (
                    <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1 font-mono text-xs dark:border-zinc-600 dark:bg-zinc-800">
                      Ctrl/Cmd+C
                    </kbd>{" "}
                    ·{" "}
                    <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1 font-mono text-xs dark:border-zinc-600 dark:bg-zinc-800">
                      V
                    </kbd>{" "}
                    when focus is not in an input). <strong className="text-zinc-900 dark:text-zinc-100">Duplicate</strong>,{" "}
                    <strong className="text-zinc-900 dark:text-zinc-100">Delete</strong>, and{" "}
                    <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1 font-mono text-xs dark:border-zinc-600 dark:bg-zinc-800">
                      Del
                    </kbd>{" "}
                    / Backspace when not typing.
                  </li>
                  <li>
                    <strong className="text-zinc-900 dark:text-zinc-100">Marquee</strong> and the transformer
                    work with stickies, shapes, and other objects as usual. <strong className="text-zinc-900 dark:text-zinc-100">Sticky</strong>{" "}
                    and <strong className="text-zinc-900 dark:text-zinc-100">Comments</strong> are on the top toolbar; drawing, lasso, and
                    hyperlinks stay on the <strong className="text-zinc-900 dark:text-zinc-100">left tool rail</strong>
                    ; templates open from <strong className="text-zinc-900 dark:text-zinc-100">Templates</strong>.
                  </li>
                  <li>
                    <strong className="text-zinc-900 dark:text-zinc-100">Undo / Redo</strong> in the rail and{" "}
                    <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1 font-mono text-xs dark:border-zinc-600 dark:bg-zinc-800">
                      Ctrl/Cmd+Z
                    </kbd>{" "}
                    /{" "}
                    <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1 font-mono text-xs dark:border-zinc-600 dark:bg-zinc-800">
                      Ctrl/Cmd+Shift+Z
                    </kbd>{" "}
                    on the board (when not typing in an input).
                  </li>
                </ul>
                <p className="mt-4 break-all font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                  Objects path: {boardFirestorePath(boardId)}/objects
                </p>
                <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-500">
                  Press Esc to close this dialog.
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}

      <BoardCanvasTemplatesModalPortal
        user={user}
        boardId={boardId}
        onBeforeApply={captureHistoryCheckpoint}
      />
      </div>
    </div>
  );
}
