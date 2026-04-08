"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import {
  collection,
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
import { BoardStage } from "@/components/board-stage";
import { useBoardObjectWrites } from "@/hooks/use-board-object-writes";
import { useBoardObjects } from "@/hooks/use-board-objects";
import { useRemoteCursors } from "@/hooks/use-board-cursors";
import { getFirebaseDb } from "@/lib/firebase";
import type { BoardObject, BoardObjectSticky } from "@/lib/board-object";
import { DEMO_BOARD_FIRESTORE_PATH, DEMO_BOARD_ID } from "@/lib/board";

const STICKY_SWATCHES: { fill: string; stroke: string }[] = [
  { fill: "#fef08a", stroke: "#854d0e" },
  { fill: "#fecaca", stroke: "#991b1b" },
  { fill: "#bbf7d0", stroke: "#166534" },
  { fill: "#bfdbfe", stroke: "#1e40af" },
  { fill: "#e9d5ff", stroke: "#6b21a8" },
  { fill: "#f5f5f4", stroke: "#57534e" },
];

type LineToolState =
  | { kind: "off" }
  | { kind: "awaiting_first" }
  | {
      kind: "awaiting_second";
      x1: number;
      y1: number;
      px: number;
      py: number;
    };

type BoardCanvasProps = {
  user: User;
  children?: ReactNode;
};

/**
 * Shared board: CSS grid underlay + Konva stage (objects, cursors, pan/zoom).
 */
export function BoardCanvas({ user, children }: BoardCanvasProps) {
  const remoteCursors = useRemoteCursors(DEMO_BOARD_ID, user.uid);
  const objects = useBoardObjects(DEMO_BOARD_ID);
  const writes = useBoardObjectWrites(DEMO_BOARD_ID, user);

  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const selectedIdsRef = useRef(selectedObjectIds);
  useEffect(() => {
    selectedIdsRef.current = selectedObjectIds;
  }, [selectedObjectIds]);
  const [shapeSwatchIndex, setShapeSwatchIndex] = useState(0);
  const [addingShape, setAddingShape] = useState<"rect" | "circle" | null>(
    null,
  );
  const [addingSticky, setAddingSticky] = useState(false);
  const [clearingBoard, setClearingBoard] = useState(false);
  const [addingFrame, setAddingFrame] = useState(false);
  const [addingTextObj, setAddingTextObj] = useState(false);
  const [deletingSelection, setDeletingSelection] = useState(false);
  const [duplicatingSelection, setDuplicatingSelection] = useState(false);
  const [linkingConnector, setLinkingConnector] = useState(false);
  const [pasting, setPasting] = useState(false);
  const internalClipboardRef = useRef<string | null>(null);
  const [lineState, setLineState] = useState<LineToolState>({ kind: "off" });
  const lineStateRef = useRef<LineToolState>({ kind: "off" });
  const shapePaletteRef = useRef(STICKY_SWATCHES[0]);

  const shapeStyle = STICKY_SWATCHES[shapeSwatchIndex];

  useEffect(() => {
    shapePaletteRef.current = shapeStyle;
  }, [shapeStyle]);

  const selectedSticky =
    selectedObjectIds.length === 1
      ? objects.find(
          (o): o is BoardObjectSticky =>
            o.id === selectedObjectIds[0] && o.type === "sticky",
        )
      : undefined;

  useEffect(() => {
    setSelectedObjectIds((prev) =>
      prev.filter((id) => objects.some((o) => o.id === id)),
    );
  }, [objects]);

  const onSelectObject = useCallback((objectId: string, shiftKey: boolean) => {
    if (shiftKey) {
      setSelectedObjectIds((prev) =>
        prev.includes(objectId)
          ? prev.filter((id) => id !== objectId)
          : [...prev, objectId],
      );
    } else {
      setSelectedObjectIds([objectId]);
    }
  }, []);

  const onClearSelection = useCallback(() => {
    setSelectedObjectIds([]);
  }, []);

  const onMarqueeSelect = useCallback((ids: string[]) => {
    setSelectedObjectIds(ids);
  }, []);

  const cancelLineTool = useCallback(() => {
    lineStateRef.current = { kind: "off" };
    setLineState({ kind: "off" });
  }, []);

  const toggleLineTool = useCallback(() => {
    setLineState((prev) => {
      const next: LineToolState =
        prev.kind === "off"
          ? { kind: "awaiting_first" }
          : { kind: "off" };
      lineStateRef.current = next;
      return next;
    });
  }, []);

  const deleteSelection = useCallback(async () => {
    if (selectedObjectIds.length === 0) return;
    const ok = window.confirm(
      `Delete ${selectedObjectIds.length} selected object(s)?`,
    );
    if (!ok) return;

    setDeletingSelection(true);
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      const refs = selectedObjectIds.map((id) =>
        doc(db, "boards", DEMO_BOARD_ID, "objects", id),
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
  }, [user, selectedObjectIds, cancelLineTool]);

  const duplicateSelection = useCallback(async () => {
    if (selectedObjectIds.length === 0) return;
    const selected = selectedObjectIds
      .map((id) => objects.find((o) => o.id === id))
      .filter((o): o is BoardObject => o !== undefined);
    if (selected.length === 0) return;

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
        await setDoc(doc(db, "boards", DEMO_BOARD_ID, "objects", newId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      }
      for (const o of conns) {
        const newId = idRemap.get(o.id)!;
        const payload = cloneBoardObjectFields(o, 0, 0, baseZ + zi, idRemap);
        zi += 1;
        await setDoc(doc(db, "boards", DEMO_BOARD_ID, "objects", newId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      }

      setSelectedObjectIds(
        selectedObjectIds
          .map((id) => idRemap.get(id))
          .filter((id): id is string => Boolean(id)),
      );
    } catch (e) {
      console.error("[objects] duplicate failed", e);
    } finally {
      setDuplicatingSelection(false);
    }
  }, [user, selectedObjectIds, objects]);

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

      await user.getIdToken();
      const db = getFirebaseDb();
      for (const { id, data } of ops) {
        await setDoc(doc(db, "boards", DEMO_BOARD_ID, "objects", id), {
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
  }, [user, cancelLineTool]);

  const addFrame = useCallback(async () => {
    cancelLineTool();
    setAddingFrame(true);
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      const id = crypto.randomUUID();
      const minZ =
        objects.length === 0
          ? 0
          : Math.min(...objects.map((o) => o.zIndex));
      const { stroke } = shapePaletteRef.current;
      await setDoc(doc(db, "boards", DEMO_BOARD_ID, "objects", id), {
        type: "frame",
        x: 60 + Math.random() * 40,
        y: 60 + Math.random() * 40,
        width: 320,
        height: 200,
        rotation: 0,
        title: "Frame",
        fill: "rgba(63, 63, 70, 0.35)",
        stroke,
        strokeWidth: 2,
        zIndex: minZ - 1,
        updatedAt: serverTimestamp(),
      });
      setSelectedObjectIds([id]);
    } catch (e) {
      console.error("[objects] add frame failed", e);
    } finally {
      setAddingFrame(false);
    }
  }, [user, objects, cancelLineTool]);

  const addTextObject = useCallback(async () => {
    cancelLineTool();
    setAddingTextObj(true);
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      const id = crypto.randomUUID();
      await setDoc(doc(db, "boards", DEMO_BOARD_ID, "objects", id), {
        type: "text",
        x: 100 + Math.random() * 40,
        y: 100 + Math.random() * 40,
        width: 280,
        height: 100,
        rotation: 0,
        text: "Double-click to edit",
        fontSize: 18,
        fill: "#fafafa",
        zIndex: Date.now(),
        updatedAt: serverTimestamp(),
      });
      setSelectedObjectIds([id]);
    } catch (e) {
      console.error("[objects] add text failed", e);
    } finally {
      setAddingTextObj(false);
    }
  }, [user, cancelLineTool]);

  const connectTwoSelected = useCallback(async () => {
    if (selectedObjectIds.length !== 2) return;
    const [a, b] = selectedObjectIds;
    if (!a || !b || a === b) return;

    setLinkingConnector(true);
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      const id = crypto.randomUUID();
      const { stroke } = shapePaletteRef.current;
      await setDoc(doc(db, "boards", DEMO_BOARD_ID, "objects", id), {
        type: "connector",
        fromId: a,
        toId: b,
        stroke,
        strokeWidth: 2,
        zIndex: Date.now(),
        updatedAt: serverTimestamp(),
      });
      cancelLineTool();
      setSelectedObjectIds([id]);
    } catch (e) {
      console.error("[objects] connect failed", e);
    } finally {
      setLinkingConnector(false);
    }
  }, [user, selectedObjectIds, cancelLineTool]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copySelection, pasteFromClipboard]);

  const finishLineDoc = useCallback(
    async (x1: number, y1: number, x2: number, y2: number) => {
      try {
        await user.getIdToken();
        const db = getFirebaseDb();
        const id = crypto.randomUUID();
        const { stroke } = shapePaletteRef.current;
        await setDoc(doc(db, "boards", DEMO_BOARD_ID, "objects", id), {
          type: "line",
          x1,
          y1,
          x2,
          y2,
          stroke,
          strokeWidth: 2,
          zIndex: Date.now(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("[objects] add line failed", e);
      }
    },
    [user],
  );

  const onLineStageBackgroundDown = useCallback(
    (w: { x: number; y: number }) => {
      const s = lineStateRef.current;
      if (s.kind === "off") return;
      if (s.kind === "awaiting_first") {
        const next: LineToolState = {
          kind: "awaiting_second",
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
      void finishLineDoc(s.x1, s.y1, w.x, w.y);
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
    cancelLineTool();
    setAddingShape("rect");
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      const id = crypto.randomUUID();
      const { fill, stroke } = shapePaletteRef.current;
      await setDoc(doc(db, "boards", DEMO_BOARD_ID, "objects", id), {
        type: "rect",
        x: 40 + Math.random() * 80,
        y: 40 + Math.random() * 80,
        width: 180,
        height: 112,
        rotation: 0,
        fill,
        stroke,
        strokeWidth: 2,
        zIndex: Date.now(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[objects] add rect failed", e);
    } finally {
      setAddingShape(null);
    }
  }, [user, cancelLineTool]);

  const addCircle = useCallback(async () => {
    cancelLineTool();
    setAddingShape("circle");
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      const id = crypto.randomUUID();
      const { fill, stroke } = shapePaletteRef.current;
      await setDoc(doc(db, "boards", DEMO_BOARD_ID, "objects", id), {
        type: "circle",
        x: 80 + Math.random() * 80,
        y: 80 + Math.random() * 80,
        radius: 56,
        rotation: 0,
        fill,
        stroke,
        strokeWidth: 2,
        zIndex: Date.now(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[objects] add circle failed", e);
    } finally {
      setAddingShape(null);
    }
  }, [user, cancelLineTool]);

  const addSticky = useCallback(async () => {
    cancelLineTool();
    setAddingSticky(true);
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      const id = crypto.randomUUID();
      await setDoc(doc(db, "boards", DEMO_BOARD_ID, "objects", id), {
        type: "sticky",
        x: 120 + Math.random() * 80,
        y: 120 + Math.random() * 80,
        width: 220,
        height: 160,
        rotation: 0,
        fill: "#fef08a",
        stroke: "#854d0e",
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
  }, [user, cancelLineTool]);

  const clearBoardObjects = useCallback(async () => {
    if (objects.length === 0) return;
    const ok = window.confirm(
      `Delete all ${objects.length} object(s) on this board? This cannot be undone. (Cursors and presence are not cleared.)`,
    );
    if (!ok) return;

    setClearingBoard(true);
    try {
      await user.getIdToken();
      const db = getFirebaseDb();
      const snap = await getDocs(
        collection(db, "boards", DEMO_BOARD_ID, "objects"),
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
  }, [user, objects.length, cancelLineTool]);

  const lineToolActive = lineState.kind !== "off";
  const linePreviewSegment =
    lineState.kind === "awaiting_second"
      ? {
          x1: lineState.x1,
          y1: lineState.y1,
          x2: lineState.px,
          y2: lineState.py,
          stroke: shapeStyle.stroke,
        }
      : null;

  return (
    <div
      className="relative flex min-h-[min(50vh,420px)] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 shadow-inner touch-none lg:min-h-[min(70vh,560px)]"
      aria-label="Board canvas — wheel zoom, Space or middle-drag pan, pointer broadcasts cursor"
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(39 39 42) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(39 39 42) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="absolute left-3 top-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2 pointer-events-auto">
        <div
          className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900/95 p-1.5 shadow"
          role="group"
          aria-label="New shape colors"
        >
          {STICKY_SWATCHES.map((s, i) => (
            <button
              key={i}
              type="button"
              title={`Use for new shapes: ${s.fill}`}
              className={`h-7 w-7 rounded border border-zinc-600 shadow-sm ring-offset-2 hover:ring-2 hover:ring-sky-500/60 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                shapeSwatchIndex === i
                  ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-zinc-900"
                  : ""
              }`}
              style={{ backgroundColor: s.fill }}
              onClick={() => setShapeSwatchIndex(i)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => void addRectangle()}
          disabled={addingShape === "rect"}
          className="rounded-lg border border-emerald-800/80 bg-emerald-950/90 px-3 py-1.5 text-xs font-medium text-emerald-100 shadow hover:bg-emerald-900/90 disabled:opacity-50"
        >
          {addingShape === "rect" ? "Adding…" : "Rectangle"}
        </button>
        <button
          type="button"
          onClick={() => void addCircle()}
          disabled={addingShape === "circle"}
          className="rounded-lg border border-teal-800/80 bg-teal-950/90 px-3 py-1.5 text-xs font-medium text-teal-100 shadow hover:bg-teal-900/90 disabled:opacity-50"
        >
          {addingShape === "circle" ? "Adding…" : "Circle"}
        </button>
        <button
          type="button"
          onClick={toggleLineTool}
          title="Click twice on the canvas for start and end. Esc cancels."
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium shadow disabled:opacity-50 ${
            lineToolActive
              ? "border-sky-500 bg-sky-900/90 text-sky-100 ring-2 ring-sky-500/50"
              : "border-sky-800/80 bg-sky-950/90 text-sky-100 hover:bg-sky-900/90"
          }`}
        >
          Line
        </button>
        <button
          type="button"
          onClick={() => void addSticky()}
          disabled={addingSticky}
          className="rounded-lg border border-amber-800/80 bg-amber-950/90 px-3 py-1.5 text-xs font-medium text-amber-100 shadow hover:bg-amber-900/90 disabled:opacity-50"
        >
          {addingSticky ? "Adding…" : "Add sticky"}
        </button>
        <button
          type="button"
          onClick={() => void addFrame()}
          disabled={addingFrame}
          title="Frame uses a low z-index so newer objects draw on top."
          className="rounded-lg border border-zinc-600/90 bg-zinc-800/90 px-3 py-1.5 text-xs font-medium text-zinc-100 shadow hover:bg-zinc-700/90 disabled:opacity-50"
        >
          {addingFrame ? "Adding…" : "Frame"}
        </button>
        <button
          type="button"
          onClick={() => void addTextObject()}
          disabled={addingTextObj}
          className="rounded-lg border border-violet-800/80 bg-violet-950/90 px-3 py-1.5 text-xs font-medium text-violet-100 shadow hover:bg-violet-900/90 disabled:opacity-50"
        >
          {addingTextObj ? "Adding…" : "Text"}
        </button>
        <button
          type="button"
          onClick={() => void connectTwoSelected()}
          disabled={
            linkingConnector || selectedObjectIds.length !== 2
          }
          title="Select exactly two objects (Shift+click), then link."
          className="rounded-lg border border-cyan-800/80 bg-cyan-950/90 px-3 py-1.5 text-xs font-medium text-cyan-100 shadow hover:bg-cyan-900/90 disabled:opacity-40"
        >
          {linkingConnector ? "Linking…" : "Connect"}
        </button>
        <button
          type="button"
          onClick={() => void duplicateSelection()}
          disabled={duplicatingSelection || selectedObjectIds.length === 0}
          className="rounded-lg border border-lime-800/80 bg-lime-950/90 px-3 py-1.5 text-xs font-medium text-lime-100 shadow hover:bg-lime-900/90 disabled:opacity-40"
        >
          {duplicatingSelection ? "Duplicating…" : "Duplicate"}
        </button>
        <button
          type="button"
          onClick={() => void copySelection()}
          disabled={selectedObjectIds.length === 0}
          title="Copy selection (Ctrl/Cmd+C). Also stored in-app if the browser blocks clipboard."
          className="rounded-lg border border-slate-700/90 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-100 shadow hover:bg-slate-800/90 disabled:opacity-40"
        >
          Copy
        </button>
        <button
          type="button"
          onClick={() => void pasteFromClipboard()}
          disabled={pasting}
          title="Paste (Ctrl/Cmd+V). Uses system clipboard or last in-app copy."
          className="rounded-lg border border-slate-600/90 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-100 shadow hover:bg-slate-700/90 disabled:opacity-40"
        >
          {pasting ? "Pasting…" : "Paste"}
        </button>
        <button
          type="button"
          onClick={() => void deleteSelection()}
          disabled={deletingSelection || selectedObjectIds.length === 0}
          className="rounded-lg border border-orange-900/80 bg-orange-950/90 px-3 py-1.5 text-xs font-medium text-orange-100 shadow hover:bg-orange-900/90 disabled:opacity-40"
        >
          {deletingSelection ? "Deleting…" : "Delete"}
        </button>
        <button
          type="button"
          onClick={() => void clearBoardObjects()}
          disabled={clearingBoard || objects.length === 0}
          title="Removes every doc under boards/…/objects. Does not clear cursors or presence."
          className="rounded-lg border border-red-900/80 bg-red-950/90 px-3 py-1.5 text-xs font-medium text-red-100 shadow hover:bg-red-900/90 disabled:opacity-40"
        >
          {clearingBoard ? "Clearing…" : "Clear board"}
        </button>
        {lineToolActive ? (
          <p className="w-full text-[11px] text-zinc-400 sm:w-auto">
            {lineState.kind === "awaiting_first"
              ? "Click the board for the line start."
              : "Click again for the end point. Esc cancels."}
          </p>
        ) : null}
        {selectedSticky ? (
          <div
            className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900/95 p-1.5 shadow"
            role="group"
            aria-label="Sticky color"
          >
            {STICKY_SWATCHES.map((s, i) => (
              <button
                key={i}
                type="button"
                title={`${s.fill}`}
                className="h-7 w-7 rounded border border-zinc-600 shadow-sm ring-offset-2 hover:ring-2 hover:ring-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                style={{ backgroundColor: s.fill }}
                onClick={() =>
                  void writes.setStickyColors(
                    selectedSticky.id,
                    s.fill,
                    s.stroke,
                  )
                }
              />
            ))}
          </div>
        ) : null}
      </div>

      <BoardStage
        user={user}
        boardId={DEMO_BOARD_ID}
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
      />

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center p-8">
        {children ?? (
          <div className="max-w-sm text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-600">
              Konva stage
            </p>
            <p className="mt-2 text-lg font-medium text-zinc-300">
              Board objects (PR 10–15)
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              <strong className="text-zinc-400">Frame</strong> (sent back),{" "}
              <strong className="text-zinc-400">Text</strong> (double-click edit),{" "}
              <strong className="text-zinc-400">Connect</strong> with two selected.{" "}
              <strong className="text-zinc-400">Copy / Paste</strong>{" "}
              (<strong className="font-medium text-zinc-400">Ctrl/Cmd+C · V</strong> when
              not in an input), <strong className="text-zinc-400">Duplicate</strong>,{" "}
              <strong className="text-zinc-400">Delete</strong>;{" "}
              <strong className="text-zinc-400">Del</strong> key when not typing.{" "}
              <strong className="text-zinc-400">Marquee</strong>,{" "}
              <strong className="text-zinc-400">Transformer</strong>, stickies, shapes
              as before.{" "}
              <span className="font-mono text-zinc-400">
                {DEMO_BOARD_FIRESTORE_PATH}/objects
              </span>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
