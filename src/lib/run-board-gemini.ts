import {
  BlockReason,
  FinishReason,
  FunctionCallingMode,
  GoogleGenerativeAI,
  type Content,
  type FunctionCallPart,
  type Part,
  type ToolConfig,
} from "@google/generative-ai";
import type { AiToolCallPayload } from "@/lib/ai-api-types";
import { boardAgentTools } from "@/lib/ai-board-tools";
import { buildBoardSystemInstruction } from "@/lib/ai-board-system-prompt";

/**
 * Preferred model; override with `GEMINI_MODEL` in `.env.local`.
 * Google may 404 on unversioned aliases depending on key/region — we retry
 * {@link MODEL_CANDIDATES} until one works.
 */
const DEFAULT_MODEL = "gemini-2.5-flash";

/** Ordered fallbacks when the API returns 404 for a model id (name changes by API version). */
const MODEL_CANDIDATES = [
  DEFAULT_MODEL,
  "gemini-2.0-flash-001",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-lite-001",
] as const;

function getModelCandidates(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const chain = [preferred, ...MODEL_CANDIDATES];
  const seen = new Set<string>();
  return chain.filter((m) => {
    if (seen.has(m)) return false;
    seen.add(m);
    return true;
  });
}

function isModelNotFoundError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("404") ||
    msg.includes("Not Found") ||
    msg.includes("is not found") ||
    msg.includes("not supported for generateContent")
  );
}

function isQuotaError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("429") ||
    msg.includes("Too Many Requests") ||
    msg.includes("quota") ||
    msg.includes("Quota exceeded")
  );
}

function collectToolCalls(parts: Part[] | undefined): AiToolCallPayload[] {
  const out: AiToolCallPayload[] = [];
  if (!parts) return out;
  for (const part of parts) {
    const fc = (part as FunctionCallPart).functionCall;
    if (fc?.name) {
      const args =
        fc.args && typeof fc.args === "object" && !Array.isArray(fc.args)
          ? (fc.args as Record<string, unknown>)
          : {};
      out.push({ name: fc.name, args });
    }
  }
  return out;
}

type RunBoardGeminiInput = {
  prompt: string;
  boardId: string;
  uid: string;
  /** Optional compact object list from the client (`buildBoardContextForAi`). */
  boardContext?: string;
};

/**
 * Calls Gemini with board tools. Firestore execution is done on the client (PR 20).
 */
export async function runBoardGemini(
  input: RunBoardGeminiInput,
): Promise<{
  model: string;
  replyText: string | null;
  toolCalls: AiToolCallPayload[];
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const toolConfig: ToolConfig = {
    functionCallingConfig: { mode: FunctionCallingMode.AUTO },
  };

  const systemInstruction = buildBoardSystemInstruction({
    uid: input.uid,
    boardId: input.boardId,
  });

  const userMessage =
    input.boardContext?.trim().length ?
      `${input.prompt}

---
Current board objects (one JSON object per line; ids are stable for moveObject):
${input.boardContext.trim()}`
      : input.prompt;

  const contents: Content[] = [
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];

  const candidates = getModelCandidates();
  let result: Awaited<
    ReturnType<
      ReturnType<GoogleGenerativeAI["getGenerativeModel"]>["generateContent"]
    >
  > | null = null;
  let usedModel: string | null = null;

  for (const modelName of candidates) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      tools: [boardAgentTools],
      toolConfig,
      systemInstruction,
    });
    try {
      result = await model.generateContent({ contents });
      usedModel = modelName;
      break;
    } catch (e) {
      if (isModelNotFoundError(e)) {
        continue;
      }
      if (isQuotaError(e)) {
        throw new Error(
          `Gemini quota or rate limit for "${modelName}". Wait ~30–60s and retry, or try another model in GEMINI_MODEL. Billing / limits: https://ai.google.dev/gemini-api/docs/rate-limits`,
        );
      }
      throw e;
    }
  }

  if (!result || !usedModel) {
    throw new Error(
      `No Gemini model id worked (each returned 404). Tried: ${candidates.join(", ")}. In Google AI Studio, confirm an API key from the same project as billing, then set GEMINI_MODEL to a name from https://ai.google.dev/gemini-api/docs/models/gemini`,
    );
  }

  const response = result.response;

  const pf = response.promptFeedback;
  if (
    pf?.blockReason &&
    pf.blockReason !== BlockReason.BLOCKED_REASON_UNSPECIFIED
  ) {
    throw new Error(
      `Prompt was blocked (${pf.blockReason}). Try shorter or different wording.`,
    );
  }

  const respCandidates = response.candidates;
  if (!respCandidates?.length) {
    throw new Error(
      "No response from Gemini (empty candidates). Check GEMINI_MODEL, API key, or whether the prompt was blocked.",
    );
  }

  const first = respCandidates[0];
  if (
    first.finishReason === FinishReason.SAFETY ||
    first.finishReason === FinishReason.PROHIBITED_CONTENT
  ) {
    throw new Error(
      `Model stopped for safety (${first.finishReason}). Try a different prompt.`,
    );
  }

  let replyText: string | null = null;
  try {
    replyText = response.text();
  } catch {
    replyText = null;
  }

  const parts = first.content?.parts;
  const toolCalls = collectToolCalls(parts);

  if (!replyText?.trim() && toolCalls.length === 0) {
    throw new Error(
      "Model returned no text and no tool calls. Try again or set GEMINI_MODEL to another id from the Gemini models doc.",
    );
  }

  return { model: usedModel, replyText, toolCalls };
}
