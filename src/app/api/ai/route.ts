import { NextResponse, type NextRequest } from "next/server";
import type { AiApiErrorBody, AiApiSuccessBody } from "@/lib/ai-api-types";
import { DEMO_BOARD_ID } from "@/lib/board";
import { runBoardGemini } from "@/lib/run-board-gemini";
import { verifyFirebaseIdToken } from "@/lib/verify-firebase-id-token";

export const runtime = "nodejs";

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
  const prompt =
    typeof rec.prompt === "string" ? rec.prompt.trim() : "";
  const boardIdRaw =
    typeof rec.boardId === "string" && rec.boardId.trim()
      ? rec.boardId.trim()
      : DEMO_BOARD_ID;

  const boardContextRaw =
    typeof rec.boardContext === "string" ? rec.boardContext : undefined;
  const boardContext =
    boardContextRaw !== undefined
      ? boardContextRaw.slice(0, 28_000)
      : undefined;

  if (!prompt) {
    return jsonError("BAD_REQUEST", "Field `prompt` (non-empty string) is required.", 400);
  }

  if (boardIdRaw !== DEMO_BOARD_ID) {
    return jsonError(
      "FORBIDDEN",
      `Only the shared demo board "${DEMO_BOARD_ID}" is allowed for this MVP.`,
      403,
    );
  }

  try {
    const { model, replyText, toolCalls } = await runBoardGemini({
      prompt,
      boardId: boardIdRaw,
      uid,
      boardContext,
    });

    const payload: AiApiSuccessBody = {
      ok: true,
      data: {
        model,
        replyText,
        toolCalls,
        boardId: boardIdRaw,
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
        boardId: "optional — defaults to demo board id",
        boardContext: "optional — compact object list from buildBoardContextForAi()",
      },
    },
  });
}
