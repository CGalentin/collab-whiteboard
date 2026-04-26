import type { User } from "firebase/auth";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

/** Firestore batch limit; stay under. */
const BATCH_CHUNK = 400;

export type BoardTemplateId = "blank" | "kanban" | "swot" | "retro";

export type BoardTemplateCatalogEntry = {
  id: BoardTemplateId;
  title: string;
  description: string;
};

export const BOARD_TEMPLATE_CATALOG: BoardTemplateCatalogEntry[] = [
  {
    id: "blank",
    title: "Blank",
    description: "One starter sticky — build your own layout.",
  },
  {
    id: "kanban",
    title: "Kanban",
    description: "Backlog, To do, Doing, Done — headers plus card slots.",
  },
  {
    id: "swot",
    title: "SWOT",
    description: "Strengths, Weaknesses, Opportunities, Threats.",
  },
  {
    id: "retro",
    title: "Retro",
    description: "Went well · To improve · Actions — with note slots.",
  },
];

type NewBoardDoc = { id: string; data: Record<string, unknown> };

const DEFAULT_STICKY = {
  width: 220,
  height: 160,
  strokeWidth: 1,
} as const;

function sticky(
  x: number,
  y: number,
  text: string,
  fill: string,
  stroke: string,
  zIndex: number,
  width: number = DEFAULT_STICKY.width,
  height: number = DEFAULT_STICKY.height,
): NewBoardDoc {
  return {
    id: crypto.randomUUID(),
    data: {
      type: "sticky",
      x,
      y,
      width,
      height,
      rotation: 0,
      fill,
      stroke,
      strokeWidth: DEFAULT_STICKY.strokeWidth,
      text,
      zIndex,
    },
  };
}

/** Deterministic new object docs for `boards/{boardId}/objects/{id}` (no Gemini). */
export function buildTemplateDocuments(templateId: BoardTemplateId): NewBoardDoc[] {
  const base = Date.now();
  let i = 0;
  const z = () => base + (i++);

  switch (templateId) {
    case "blank":
      return [sticky(180, 160, "Start here — double-click to edit", "#fef08a", "#854d0e", z())];

    case "swot":
      return [
        sticky(80, 80, "Strengths", "#bbf7d0", "#166534", z(), 260, 140),
        sticky(420, 80, "Weaknesses", "#fecaca", "#991b1b", z(), 260, 140),
        sticky(80, 300, "Opportunities", "#bfdbfe", "#1e40af", z(), 260, 140),
        sticky(420, 300, "Threats", "#fde68a", "#854d0e", z(), 260, 140),
      ];

    case "retro": {
      const colW = 240;
      const gap = 36;
      const x0 = 64;
      const yHeader = 72;
      const yCard = 240;
      const headers: NewBoardDoc[] = [
        sticky(x0, yHeader, "Went well", "#bbf7d0", "#166534", z(), colW, 120),
        sticky(x0 + colW + gap, yHeader, "To improve", "#fecaca", "#991b1b", z(), colW, 120),
        sticky(x0 + 2 * (colW + gap), yHeader, "Actions", "#bfdbfe", "#1e40af", z(), colW, 120),
      ];
      const cards: NewBoardDoc[] = [];
      for (let c = 0; c < 3; c += 1) {
        const cx = x0 + c * (colW + gap);
        cards.push(
          sticky(cx, yCard, "Note", "#fef08a", "#854d0e", z(), colW, 140),
          sticky(cx, yCard + 160, "Note", "#fef9c3", "#854d0e", z(), colW, 140),
        );
      }
      return [...headers, ...cards];
    }

    case "kanban": {
      const colW = 200;
      const gap = 24;
      const x0 = 48;
      const yHeader = 64;
      const yCard = 220;
      const labels = ["Backlog", "To do", "Doing", "Done"] as const;
      const fills = ["#e4e4e7", "#fef08a", "#bfdbfe", "#bbf7d0"] as const;
      const strokes = ["#3f3f46", "#854d0e", "#1e40af", "#166534"] as const;
      const headers = labels.map((label, c) =>
        sticky(x0 + c * (colW + gap), yHeader, label, fills[c]!, strokes[c]!, z(), colW, 100),
      );
      const cards: NewBoardDoc[] = [];
      for (let c = 0; c < 4; c += 1) {
        const cx = x0 + c * (colW + gap);
        cards.push(
          sticky(cx, yCard, "Card", "#fafafa", "#52525b", z(), colW, 130),
          sticky(cx, yCard + 150, "Card", "#fafafa", "#52525b", z(), colW, 130),
        );
      }
      return [...headers, ...cards];
    }
  }
}

/**
 * Batch-writes template objects under `boards/{boardId}/objects/*`.
 * Caller should snapshot board state for undo before calling (see board-canvas).
 */
export async function applyTemplate(
  user: User,
  boardId: string,
  templateId: BoardTemplateId,
): Promise<void> {
  const docs = buildTemplateDocuments(templateId);
  if (docs.length === 0) return;

  await user.getIdToken();
  const db = getFirebaseDb();

  for (let offset = 0; offset < docs.length; offset += BATCH_CHUNK) {
    const chunk = docs.slice(offset, offset + BATCH_CHUNK);
    const batch = writeBatch(db);
    for (const { id, data } of chunk) {
      batch.set(doc(db, "boards", boardId, "objects", id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
}
