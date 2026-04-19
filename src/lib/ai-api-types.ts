/**
 * JSON contract for `POST /api/ai` (PR 19).
 * Client sends Firebase ID token: `Authorization: Bearer <idToken>`.
 */

export type AiApiErrorBody = {
  ok: false;
  error: {
    code:
      | "UNAUTHORIZED"
      | "BAD_REQUEST"
      | "FORBIDDEN"
      | "CONFIG"
      | "GEMINI_ERROR"
      | "INTERNAL";
    message: string;
    details?: unknown;
  };
};

export type AiToolCallPayload = {
  name: string;
  args: Record<string, unknown>;
};

export type AiApiSuccessBody = {
  ok: true;
  data: {
    model: string;
    /** Model text (may be empty if the model only returned tool calls). */
    replyText: string | null;
    /** Tool invocations from the model; the client executes them (PR 20). */
    toolCalls: AiToolCallPayload[];
    boardId: string;
    uid: string;
  };
};

export type AiApiResponseBody = AiApiErrorBody | AiApiSuccessBody;
