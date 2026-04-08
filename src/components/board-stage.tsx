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
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import { Circle, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import { BoardInlineTextEditor } from "@/components/board-inline-text-editor";
import { BoardObjectShape } from "@/components/board-object-shapes";
import { ConnectorShape } from "@/components/connector-shape";
import { FrameShape } from "@/components/frame-shape";
import { StickyNoteShape } from "@/components/sticky-note-shape";
import { TextObjectShape } from "@/components/text-object-shape";
import type { BoardObjectWrites } from "@/hooks/use-board-object-writes";
import type { RemoteCursor } from "@/hooks/use-board-cursors";
import { useLocalCursorWriter } from "@/hooks/use-board-cursors";
import {
  aabbIntersect,
  boardObjectWorldAabb,
  normalizeMarqueeRect,
} from "@/lib/board-geometry";
import {
  isShapeLayerObject,
  type BoardObject,
  type BoardObjectSticky,
  type BoardObjectConnector,
  type BoardObjectText,
} from "@/lib/board-object";

const MIN_SCALE = 0.15;
const MAX_SCALE = 4;
const ZOOM_STEP = 1.08;
const MARQUEE_DRAG_PX = 4;

/** Dashed segment in world space while placing a line (second point). */
export type LinePreviewSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
};

type BoardStageProps = {
  user: User;
  boardId: string;
  remoteCursors: RemoteCursor[];
  objects: BoardObject[];
  writes: BoardObjectWrites;
  selectedObjectIds: string[];
  onSelectObject: (objectId: string, shiftKey: boolean) => void;
  onClearSelection: () => void;
  onMarqueeSelect: (objectIds: string[]) => void;
  linePreviewSegment?: LinePreviewSegment | null;
  onLineStageBackgroundDown?: (world: { x: number; y: number }) => void;
  onLineStagePointerMoveWorld?: (world: { x: number; y: number }) => void;
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
    const factor = Math.max(Math.abs(sx), Math.abs(sy));
    const nr = Math.max(4, c.radius() * factor);
    c.scaleX(1);
    c.scaleY(1);
    c.radius(nr);
    queueObjectPatch(id, {
      x: c.x(),
      y: c.y(),
      radius: nr,
      rotation: c.rotation(),
    });
    return;
  }

  if (o.type === "sticky" || o.type === "frame" || o.type === "text") {
    const g = node as Konva.Group;
    const sx = g.scaleX();
    const sy = g.scaleY();
    const rect = g.findOne<Konva.Rect>("Rect");
    if (!rect) return;
    const minBox = o.type === "text" ? 24 : 40;
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
}: BoardStageProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const stageRef = useRef<KonvaStage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const transformTargets = useRef<Map<string, Konva.Node>>(new Map());

  type OverlayEdit = { kind: "sticky" | "text"; id: string };
  const [overlayEdit, setOverlayEdit] = useState<OverlayEdit | null>(null);
  const [overlayDraft, setOverlayDraft] = useState("");
  const overlayDraftRef = useRef(overlayDraft);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [isPanningUi, setIsPanningUi] = useState(false);
  const [marqueeWorld, setMarqueeWorld] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  const spaceDown = useRef(false);
  const panning = useRef(false);
  const lastPtr = useRef({ x: 0, y: 0 });
  const marqueeSession = useRef<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  const setWrapRef = useCallback((el: HTMLDivElement | null) => {
    wrapRef.current = el;
    setContainerEl(el);
  }, []);

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

  const startPanIfAllowed = (evt: ReactPointerEvent<HTMLDivElement>) => {
    const e = evt.nativeEvent;
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

  const cursorClass =
    spaceHeld || isPanningUi
      ? "cursor-grab active:cursor-grabbing"
      : "cursor-crosshair";

  const ready = size.w >= 2 && size.h >= 2;

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

  const overlayTarget =
    overlayEdit === null
      ? null
      : (objects.find((o) => o.id === overlayEdit.id) ?? null);

  const overlayBox =
    overlayTarget?.type === "sticky"
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
            fill: "#27272a",
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
      if (!o || o.type === "line" || o.type === "connector") continue;
      commitTransformNode(node, o, writes.queueObjectPatch);
    }
    tr.getLayer()?.batchDraw();
  }, [objects, writes.queueObjectPatch]);

  const transformerAttachKey = useMemo(() => {
    return selectedObjectIds
      .filter((id) => {
        const o = objects.find((x) => x.id === id);
        return o && o.type !== "line" && o.type !== "connector";
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
      onLineStageBackgroundDown,
      onClearSelection,
      onMarqueeSelect,
      objects,
      scale,
      stagePos,
      screenToWorld,
    ],
  );

  useEffect(() => {
    return () => {
      cleanupMarqueeListeners.current?.();
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
      onPointerDown={startPanIfAllowed}
      onPointerMove={onPointerMoveWrap}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onPointerLeave={endPan}
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
            {objects
              .filter((o) => o.type !== "connector")
              .map((o) => {
                if (isShapeLayerObject(o)) {
                  return (
                    <BoardObjectShape
                      key={o.id}
                      object={o}
                      isSelected={selectedObjectIds.includes(o.id)}
                      innerRef={(n) => registerTransformTarget(o.id, n)}
                      onPointerDown={(ev) =>
                        onSelectObject(o.id, ev.evt.shiftKey)
                      }
                      onDragEnd={(ev) => {
                        const t = ev.target;
                        if (o.type === "line") return;
                        writes.queueObjectPatch(o.id, {
                          x: t.x(),
                          y: t.y(),
                        });
                      }}
                    />
                  );
                }
                if (o.type === "sticky") {
                  return (
                    <StickyNoteShape
                      key={o.id}
                      object={o}
                      isSelected={selectedObjectIds.includes(o.id)}
                      innerRef={(n) => registerTransformTarget(o.id, n)}
                      onObjectTap={(ev) =>
                        onSelectObject(o.id, ev.evt.shiftKey)
                      }
                      onRequestEdit={() => openStickyEditor(o.id)}
                      onDragEnd={(x, y) => writes.queuePosition(o.id, x, y)}
                    />
                  );
                }
                if (o.type === "frame") {
                  return (
                    <FrameShape
                      key={o.id}
                      object={o}
                      isSelected={selectedObjectIds.includes(o.id)}
                      innerRef={(n) => registerTransformTarget(o.id, n)}
                      onObjectTap={(ev) =>
                        onSelectObject(o.id, ev.evt.shiftKey)
                      }
                      onDragEnd={(x, y) =>
                        writes.queueObjectPatch(o.id, { x, y })
                      }
                    />
                  );
                }
                if (o.type === "text") {
                  return (
                    <TextObjectShape
                      key={o.id}
                      object={o}
                      isSelected={selectedObjectIds.includes(o.id)}
                      innerRef={(n) => registerTransformTarget(o.id, n)}
                      onObjectTap={(ev) =>
                        onSelectObject(o.id, ev.evt.shiftKey)
                      }
                      onRequestEdit={() => openTextObjectEditor(o.id)}
                      onDragEnd={(x, y) =>
                        writes.queueObjectPatch(o.id, { x, y })
                      }
                    />
                  );
                }
                return null;
              })}
            {linePreviewSegment ? (
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
                    onSelectObject(c.id, ev.evt.shiftKey)
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
          variant={overlayEdit.kind === "sticky" ? "sticky" : "text"}
          onDraftChange={(v) => {
            setOverlayDraft(v);
            writes.queueText(overlayEdit.id, v);
          }}
          onClose={() => setOverlayEdit(null)}
          flushOnClose={() => {
            void writes.flushTextNow(
              overlayEdit.id,
              overlayDraftRef.current,
            );
          }}
          stageContainer={
            // Konva `container()` is only read when the text editor is open; Stage is mounted.
            // eslint-disable-next-line react-hooks/refs -- overlay needs DOM node; ref set after Stage paint
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
  const pad = 6;
  const label =
    cursor.name.length > 24 ? `${cursor.name.slice(0, 22)}…` : cursor.name;
  return (
    <>
      <Circle
        x={cursor.x}
        y={cursor.y}
        radius={5}
        fill="#38bdf8"
        stroke="#09090b"
        strokeWidth={2}
        listening={false}
      />
      <Text
        x={cursor.x + pad}
        y={cursor.y - 18}
        text={label}
        fontSize={11}
        fontFamily="system-ui, sans-serif"
        fill="#e0f2fe"
        padding={4}
        listening={false}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.6}
      />
    </>
  );
}
