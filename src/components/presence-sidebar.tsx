"use client";

import type { User } from "firebase/auth";
import {
  usePresenceOnlineList,
  usePresencePublisher,
} from "@/hooks/use-board-presence";
import { PRESENCE_ONLINE_THRESHOLD_MS } from "@/lib/presence";

export function PresenceSidebar({
  user,
  boardId,
}: {
  user: User;
  boardId: string;
}) {
  usePresencePublisher(user, boardId);
  const online = usePresenceOnlineList(boardId, user.uid);

  return (
    <aside
      className="flex max-h-48 flex-col rounded-xl border border-zinc-200 bg-white/80 sm:max-h-none lg:max-h-[min(70vh,560px)] lg:w-56 dark:border-zinc-800 dark:bg-zinc-900/50"
      aria-label="Who is online"
    >
      <div className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
          Online
        </h2>
        <p className="text-[11px] text-zinc-600 dark:text-zinc-600">
          Active if seen in the last {PRESENCE_ONLINE_THRESHOLD_MS / 1000}s
        </p>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto p-2 text-sm">
        {online.length === 0 ? (
          <li className="px-2 py-3 text-center text-xs text-zinc-500 dark:text-zinc-500">
            No one online yet — waiting for presence sync, or open this board in
            another session to test.
          </li>
        ) : (
          online.map((row) => {
            const isSelf = row.uid === user.uid;
            return (
              <li key={row.uid}>
                <div
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                    isSelf
                      ? "bg-emerald-100 ring-1 ring-emerald-300/80 dark:bg-emerald-950/40 dark:ring-emerald-800/50"
                      : ""
                  }`}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                    aria-hidden
                  />
                  <span
                    className={`min-w-0 truncate ${
                      isSelf
                        ? "font-medium text-emerald-900 dark:text-emerald-100"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {row.displayName}
                    {isSelf ? " (you)" : ""}
                  </span>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
