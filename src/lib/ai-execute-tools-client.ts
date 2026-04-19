"use client";

import type { User } from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { AiToolCallPayload } from "@/lib/ai-api-types";
import { getFirebaseDb } from "@/lib/firebase";
import { parseBoardObject } from "@/lib/board-object";

export type AiToolExecutionResult = {
  name: string;
  ok: boolean;
  message?: string;
};

const DEFAULT_STICKY = {
  width: 220,
  height: 160,
  fill: "#fef08a",
  stroke: "#854d0e",
  strokeWidth: 1,
};

const DEFAULT_RECT = {
  fill: "#bfdbfe",
  stroke: "#1e40af",
  strokeWidth: 2,
};

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

/**
 * Applies AI tool calls using the signed-in user's Firestore access (same paths as the UI).
 */
export async function executeAiToolCallsClient(
  boardId: string,
  user: User,
  toolCalls: AiToolCallPayload[],
): Promise<AiToolExecutionResult[]> {
  await user.getIdToken();
  const db = getFirebaseDb();
  const results: AiToolExecutionResult[] = [];

  for (const call of toolCalls) {
    try {
      switch (call.name) {
        case "createStickyNote":
          await execCreateSticky(db, boardId, call.args);
          results.push({ name: call.name, ok: true });
          break;
        case "createRectShape":
          await execCreateRect(db, boardId, call.args);
          results.push({ name: call.name, ok: true });
          break;
        case "moveObject":
          await execMoveObject(db, boardId, call.args);
          results.push({ name: call.name, ok: true });
          break;
        default:
          results.push({
            name: call.name,
            ok: false,
            message: `Unknown tool: ${call.name}`,
          });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ name: call.name, ok: false, message: msg });
    }
  }

  return results;
}

function hexFill(v: unknown, fallback: string): string {
  if (typeof v !== "string") return fallback;
  const s = v.trim();
  return /^#[0-9A-Fa-f]{6}$/.test(s) ? s : fallback;
}

async function execCreateSticky(
  db: ReturnType<typeof getFirebaseDb>,
  boardId: string,
  args: Record<string, unknown>,
) {
  const text = str(args.text, "Note");
  const x = num(args.x) ?? 120 + Math.random() * 120;
  const y = num(args.y) ?? 120 + Math.random() * 120;
  const fill = hexFill(args.fill, DEFAULT_STICKY.fill);
  const id = crypto.randomUUID();
  await setDoc(doc(db, "boards", boardId, "objects", id), {
    type: "sticky",
    x,
    y,
    width: DEFAULT_STICKY.width,
    height: DEFAULT_STICKY.height,
    rotation: 0,
    fill,
    stroke: DEFAULT_STICKY.stroke,
    strokeWidth: DEFAULT_STICKY.strokeWidth,
    text,
    zIndex: Date.now(),
    updatedAt: serverTimestamp(),
  });
}

async function execCreateRect(
  db: ReturnType<typeof getFirebaseDb>,
  boardId: string,
  args: Record<string, unknown>,
) {
  const x = num(args.x);
  const y = num(args.y);
  const width = num(args.width);
  const height = num(args.height);
  if (x === null || y === null || width === null || height === null) {
    throw new Error("createRectShape requires numeric x, y, width, height");
  }
  if (width < 8 || height < 8) {
    throw new Error("width and height must be at least 8");
  }
  const id = crypto.randomUUID();
  await setDoc(doc(db, "boards", boardId, "objects", id), {
    type: "rect",
    x,
    y,
    width,
    height,
    rotation: 0,
    fill: DEFAULT_RECT.fill,
    stroke: DEFAULT_RECT.stroke,
    strokeWidth: DEFAULT_RECT.strokeWidth,
    zIndex: Date.now(),
    updatedAt: serverTimestamp(),
  });
}

async function execMoveObject(
  db: ReturnType<typeof getFirebaseDb>,
  boardId: string,
  args: Record<string, unknown>,
) {
  const objectId = str(args.objectId, "");
  const x = num(args.x);
  const y = num(args.y);
  if (!objectId) throw new Error("objectId is required");
  if (x === null || y === null) throw new Error("x and y must be numbers");

  const ref = doc(db, "boards", boardId, "objects", objectId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error(`No object with id ${objectId}`);

  const raw = snap.data() as Record<string, unknown>;
  const o = parseBoardObject(objectId, raw);
  if (!o) throw new Error("Could not parse object");

  if (
    o.type === "sticky" ||
    o.type === "rect" ||
    o.type === "frame" ||
    o.type === "text"
  ) {
    await updateDoc(ref, {
      x,
      y,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  if (o.type === "circle") {
    await updateDoc(ref, {
      x,
      y,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  if (o.type === "line") {
    const cx = (o.x1 + o.x2) / 2;
    const cy = (o.y1 + o.y2) / 2;
    const dx = x - cx;
    const dy = y - cy;
    await updateDoc(ref, {
      x1: o.x1 + dx,
      y1: o.y1 + dy,
      x2: o.x2 + dx,
      y2: o.y2 + dy,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  throw new Error(`moveObject is not supported for type "${o.type}"`);
}
