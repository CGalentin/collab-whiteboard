"use client";

import type { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ensureOwnedBoard } from "@/lib/boards-client";
import { parseAiResponse } from "@/lib/ai-parse-api-response";
import { executeAiToolCallsClient } from "@/lib/ai-execute-tools-client";

const EMPTY_BOARD_PREFIX =
  "The board is empty. Create a clear starter template on the canvas. " +
  "Place objects roughly between x=40 and y=40 up to about x=900, y=650 so the layout is visible. " +
  "Use createStickyNote and createRectShape as needed for sections and labels—issue multiple tool calls in this response to build the full layout.";

const DASHBOARD_MAX_TOOL_CALLS = 28;

const QUICK_CHIPS: { label: string; prompt: string }[] = [
  {
    label: "Sprint",
    prompt:
      "A sprint planning board: columns To do, In progress, Done with title stickies and 2 example cards per column.",
  },
  {
    label: "Retro",
    prompt:
      "A retrospective: three areas Went well, To improve, Next actions, with clear headers and a few example stickies in each area.",
  },
  {
    label: "SWOT",
    prompt:
      "A SWOT analysis: four areas Strengths, Weaknesses, Opportunities, Threats with a header sticky in each and space for notes.",
  },
  {
    label: "Journey map",
    prompt:
      "A simple customer journey map: stages Discover, Consider, Buy, Onboard, Retain in a row as headers with one example sticky under each stage.",
  },
];

type DashboardAiTemplateSectionProps = {
  user: User;
};

/**
 * PR 33: “Generate template” on the dashboard — new board, `/api/ai` on empty context, then client tool execution.
 */
export function DashboardAiTemplateSection({ user }: DashboardAiTemplateSectionProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [lastExecution, setLastExecution] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const userPart = prompt.trim();
    if (!userPart || loading) return;

    setLoading(true);
    setError(null);
    setLastReply(null);
    setLastExecution(null);

    const boardId = crypto.randomUUID();
    const fullPrompt = `${EMPTY_BOARD_PREFIX}\n\nUser request:\n${userPart}`;

    try {
      await ensureOwnedBoard(user, boardId);

      const idToken = await user.getIdToken(true);
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          boardId,
          maxToolCalls: DASHBOARD_MAX_TOOL_CALLS,
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
        replyParts.push(`[${toolCalls.length} tool call(s) applied]`);
      }
      setLastReply(
        replyParts.length > 0 ? replyParts.join("\n\n") : "(No text reply)",
      );

      if (toolCalls.length === 0) {
        setError(
          "The model did not return any create actions. A new board was still created—open it from the list, or try again with a more specific request.",
        );
        setPrompt("");
        return;
      }

      const results = await executeAiToolCallsClient(boardId, user, toolCalls);
      setLastExecution(
        results
          .map((r) => `${r.name}: ${r.ok ? "ok" : r.message ?? "failed"}`)
          .join(" · "),
      );

      setPrompt("");
      router.push(`/board/${boardId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"
      aria-label="AI template from dashboard"
      aria-busy={loading}
    >
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Generate a board with AI
        </h2>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Creates a <span className="font-medium">new</span> board and runs the assistant on an{" "}
          <span className="font-medium">empty</span> canvas. Needs{" "}
          <span className="font-mono">GEMINI_API_KEY</span> (same as the in-board AI panel).
        </p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3 p-4">
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Quick start</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              disabled={loading}
              onClick={() => {
                setPrompt(chip.prompt);
                setError(null);
              }}
              className="min-h-11 min-w-0 touch-manipulation rounded-full border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {chip.label}
            </button>
          ))}
        </div>
        <label htmlFor="dashboard-ai-template-prompt" className="text-xs text-zinc-600 dark:text-zinc-400">
          Describe the template
        </label>
        <textarea
          id="dashboard-ai-template-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A product roadmap with Q1–Q4 columns and a few example stickies"
          rows={4}
          disabled={loading}
          className="min-h-[6rem] w-full resize-y rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600"
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          aria-busy={loading}
          className="min-h-11 w-full touch-manipulation rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? "Creating board…" : "Generate and open board"}
        </button>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
          At most {DASHBOARD_MAX_TOOL_CALLS} create/move actions are applied per run (server cap).
        </p>
      </form>

      <div className="min-h-[5rem] space-y-2 border-t border-zinc-200 bg-zinc-50/80 px-4 py-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
        {!error && !lastReply && !lastExecution && !loading ? (
          <p className="text-zinc-500 dark:text-zinc-500">
            Results appear here briefly before you jump to the new board.
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
            <p className="font-medium text-zinc-600 dark:text-zinc-400">Tools on board</p>
            <p className="mt-0.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
              {lastExecution}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
