"use client";

import type { User } from "firebase/auth";
import { useState } from "react";
import { parseAiResponse } from "@/lib/ai-parse-api-response";
import { executeAiToolCallsClient } from "@/lib/ai-execute-tools-client";
import { buildBoardContextForAi } from "@/lib/board-context-for-ai";
import { useBoardObjects } from "@/hooks/use-board-objects";

type AiBoardPanelProps = {
  user: User;
  boardId: string;
};

/**
 * Prompt → `POST /api/ai` (Gemini + tools) → client executes tool calls on Firestore (PR 20).
 */
export function AiBoardPanel({ user, boardId }: AiBoardPanelProps) {
  const objects = useBoardObjects(boardId);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [lastExecution, setLastExecution] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = prompt.trim();
    if (!p || loading) return;

    setLoading(true);
    setError(null);
    setLastReply(null);
    setLastExecution(null);

    try {
      const idToken = await user.getIdToken(true);
      const boardContext = buildBoardContextForAi(objects);

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          prompt: p,
          boardId,
          boardContext,
        }),
      });

      const json = await parseAiResponse(res);

      if (!res.ok || !json.ok) {
        const msg = json.ok === false ? json.error.message : `HTTP ${res.status}`;
        setError(msg);
        return;
      }

      const { replyText, toolCalls } = json.data;
      const replyParts: string[] = [];
      if (replyText?.trim()) replyParts.push(replyText.trim());
      if (toolCalls.length > 0) {
        replyParts.push(`[${toolCalls.length} tool call(s) from model]`);
      }
      setLastReply(
        replyParts.length > 0 ? replyParts.join("\n\n") : "(No text reply)",
      );

      if (toolCalls.length > 0) {
        const results = await executeAiToolCallsClient(
          boardId,
          user,
          toolCalls,
        );
        setLastExecution(
          results
            .map((r) => `${r.name}: ${r.ok ? "ok" : r.message ?? "failed"}`)
            .join(" · "),
        );
      } else {
        setLastExecution(null);
      }

      setPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="flex flex-col rounded-xl border border-zinc-200 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"
      aria-label="AI assistant"
      aria-busy={loading}
    >
      <div className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          AI assistant · this board
        </h2>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
          Needs <span className="font-mono">GEMINI_API_KEY</span> in{" "}
          <span className="font-mono">.env.local</span> — restart{" "}
          <span className="font-mono">npm run dev</span> after adding it.
        </p>
      </div>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="flex flex-col gap-2 p-3"
      >
        <label htmlFor="ai-prompt" className="sr-only">
          Ask the AI
        </label>
        <textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Add a sticky that says ‘Ship MVP’"
          rows={3}
          disabled={loading}
          className="min-h-[4.5rem] w-full resize-y rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600"
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          aria-busy={loading}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Send"}
        </button>
      </form>

      <div className="min-h-[6rem] space-y-2 border-t border-zinc-200 bg-zinc-50/80 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
        {!error && !lastReply && !lastExecution && !loading ? (
          <p className="text-zinc-500 dark:text-zinc-500">
            Replies and tool results appear here after you send.
          </p>
        ) : null}
        {loading ? (
          <p className="text-zinc-600 dark:text-zinc-400">Working…</p>
        ) : null}
        {error ? (
          <p className="text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        {lastReply ? (
          <div>
            <p className="font-medium text-zinc-600 dark:text-zinc-400">Reply</p>
            <p className="mt-0.5 whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
              {lastReply}
            </p>
          </div>
        ) : null}
        {lastExecution ? (
          <div>
            <p className="font-medium text-zinc-600 dark:text-zinc-400">
              Tools on board
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
              {lastExecution}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
