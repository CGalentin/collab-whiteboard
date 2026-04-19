import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-6 py-16 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <p className="text-sm font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400/90">
        Gauntlet · CollabBoard
      </p>
      <h1 className="max-w-lg text-center text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
        Collaborative whiteboard
      </h1>
      <p className="max-w-md text-center text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        Sign in to open the shared demo board. Real-time canvas and the AI
        agent follow on the roadmap.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          Sign in
        </Link>
        <Link
          href="/board"
          className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
        >
          Open board
        </Link>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        Next up: presence, cursors, and Konva (see BUILD_ROADMAP).
      </p>
    </main>
  );
}
