import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-6 py-16 font-sans text-zinc-100">
      <p className="text-sm font-medium uppercase tracking-widest text-emerald-400/90">
        Gauntlet · CollabBoard
      </p>
      <h1 className="max-w-lg text-center text-4xl font-semibold tracking-tight text-white sm:text-5xl">
        Collaborative whiteboard
      </h1>
      <p className="max-w-md text-center text-lg leading-relaxed text-zinc-400">
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
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Open board
        </Link>
      </div>
      <p className="text-sm text-zinc-500">
        Next up: presence, cursors, and Konva (see BUILD_ROADMAP).
      </p>
    </main>
  );
}
