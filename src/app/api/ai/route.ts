import { NextResponse, type NextRequest } from "next/server";
import type { AiApiErrorBody, AiApiSuccessBody } from "@/lib/ai-api-types";
import { assertBoardId } from "@/lib/board";
import { runBoardGemini } from "@/lib/run-board-gemini";
import { verifyFirebaseIdToken } from "@/lib/verify-firebase-id-token";

export const runtime = "nodejs";

function getFirestoreDocumentUrl(path: string): string {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set");
  }
  const escapedPath = path
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/");
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${escapedPath}`;
}

function readStringField(
  fields: Record<string, { stringValue?: string }> | undefined,
  key: string,
): string | null {
  if (!fields) return null;
  const value = fields[key];
  if (!value) return null;
  return typeof value.stringValue === "string" ? value.stringValue : null;
}

async function requesterCanUseAiOnBoard(
  idToken: string,
  uid: string,
  boardId: string,
): Promise<boolean> {
  const boardUrl = getFirestoreDocumentUrl(`boards/${boardId}`);
  const boardRes = await fetch(boardUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    cache: "no-store",
  });

  if (!boardRes.ok) {
    return false;
  }

  const boardJson = (await boardRes.json()) as {
    fields?: Record<string, { stringValue?: string }>;
  };
  const ownerUid = readStringField(boardJson.fields, "ownerUid");
  if (ownerUid === uid) {
    return true;
  }

  const memberUrl = getFirestoreDocumentUrl(
    `boards/${boardId}/members/${uid}`,
  );
  const memberRes = await fetch(memberUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    cache: "no-store",
  });
  if (!memberRes.ok) {
    return false;
  }
  const memberJson = (await memberRes.json()) as {
    fields?: Record<string, { stringValue?: string }>;
  };
  const role = readStringField(memberJson.fields, "role");
  return role === "editor";
}

function jsonError(
  code: AiApiErrorBody["error"]["code"],
  message: string,
  status: number,
  details?: unknown,
): NextResponse<AiApiErrorBody> {
  return NextResponse.json(
    { ok: false, error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status },
  );
}

/**
 * `POST /api/ai` — server-side Gemini (PR 19). Requires
 * `Authorization: Bearer <Firebase ID token>` and JSON `{ prompt, boardId? }`.
 * `GEMINI_API_KEY` must be set (never exposed to the client).
 */
export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return jsonError(
      "CONFIG",
      "Server is missing GEMINI_API_KEY. Add it to .env.local (see .env.example).",
      503,
    );
  }

  const auth = req.headers.get("authorization");
  const token =
    auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : null;
  if (!token) {
    return jsonError(
      "UNAUTHORIZED",
      'Missing Authorization header. Send: Authorization: Bearer <Firebase ID token from user.getIdToken()>.',
      401,
    );
  }

  let uid: string;
  try {
    const v = await verifyFirebaseIdToken(token);
    uid = v.uid;
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Invalid or expired Firebase ID token.";
    return jsonError("UNAUTHORIZED", message, 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("BAD_REQUEST", "Request body must be JSON.", 400);
  }

  if (!body || typeof body !== "object") {
    return jsonError("BAD_REQUEST", "Body must be an object.", 400);
  }

  const rec = body as Record<string, unknown>;
  const prompt = typeof rec.prompt === "string" ? rec.prompt.trim() : "";
  const boardIdRaw = typeof rec.boardId === "string" ? rec.boardId : "";

  const boardContextRaw =
    typeof rec.boardContext === "string" ? rec.boardContext : undefined;
  const boardContext =
    boardContextRaw !== undefined
      ? boardContextRaw.slice(0, 28_000)
      : undefined;

  let maxToolCalls: number | undefined;
  if (rec.maxToolCalls !== undefined) {
    const n =
      typeof rec.maxToolCalls === "number"
        ? rec.maxToolCalls
        : Number(rec.maxToolCalls);
    if (Number.isFinite(n)) {
      maxToolCalls = Math.min(64, Math.max(1, Math.floor(n)));
    }
  }

  if (!prompt) {
    return jsonError("BAD_REQUEST", "Field `prompt` (non-empty string) is required.", 400);
  }

  let boardId: string;
  try {
    boardId = assertBoardId(boardIdRaw);
  } catch (e) {
    return jsonError(
      "BAD_REQUEST",
      e instanceof Error ? e.message : "Invalid board id.",
      400,
    );
  }

  if (!(await requesterCanUseAiOnBoard(token, uid, boardId))) {
    return jsonError("FORBIDDEN", "You do not have access to this board.", 403);
  }

  try {
    const { model, replyText, toolCalls } = await runBoardGemini({
      prompt,
      boardId,
      uid,
      boardContext,
      maxToolCalls,
    });

    const payload: AiApiSuccessBody = {
      ok: true,
      data: {
        model,
        replyText,
        toolCalls,
        boardId,
        uid,
      },
    };
    return NextResponse.json(payload);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Gemini request failed.";
    return jsonError("GEMINI_ERROR", message, 502);
  }
}

/** Lightweight probe (no auth, no key required). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      route: "/api/ai",
      method: "POST",
      auth: "Authorization: Bearer <Firebase ID token>",
      body: {
        prompt: "string",
        boardId: "required — board owner or editor member may call AI (viewers cannot)",
        boardContext: "optional — compact object list from buildBoardContextForAi()",
        maxToolCalls: "optional 1–64; caps returned tool calls (dashboard template flow)",
      },
    },
  });
}
