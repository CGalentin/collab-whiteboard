import type { AiApiResponseBody } from "@/lib/ai-api-types";

/**
 * Body text from `POST /api/ai` → JSON. Used by board panel and dashboard template flow.
 */
export async function parseAiResponse(res: Response): Promise<AiApiResponseBody> {
  const text = await res.text();
  try {
    return JSON.parse(text) as AiApiResponseBody;
  } catch {
    throw new Error(
      `Server did not return JSON (HTTP ${res.status}). ${text.slice(0, 200)}`,
    );
  }
}
