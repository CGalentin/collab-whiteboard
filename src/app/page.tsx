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
        Real-time sync, Firebase auth, and an AI board agent are next on the build
        roadmap. If you see this page on Vercel, your deploy is working.
      </p>
      <p className="text-sm text-zinc-500">
        Next up: PR 03 — Firebase client + Firestore rules.
      </p>
    </main>
  );
}
