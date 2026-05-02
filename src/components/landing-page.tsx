"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { productPalette } from "@/lib/design-colors";

function BoardPreviewMock() {
  return (
    <div
      id="preview"
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-brand-teal/15 bg-white shadow-[0_24px_80px_-12px_rgba(18,140,126,0.22)] ring-1 ring-accent-lavender/25 dark:border-white/10 dark:bg-zinc-900 dark:ring-accent-violet/20 dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.45)]"
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50/80 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/50">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </span>
        <span className="ml-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">CollabBoard</span>
        <span className="ml-auto rounded-md bg-brand-teal/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-teal dark:bg-teal-400/15 dark:text-teal-300">
          Preview
        </span>
      </div>
      <div className="landing-preview-grid relative aspect-[16/10] w-full p-4 sm:p-6 md:aspect-[16/9]">
        <div className="absolute right-6 top-4 flex gap-1">
          <span className="h-6 w-6 rounded-full border-2 border-white bg-teal-400 shadow-sm dark:border-zinc-900" />
          <span className="h-6 w-6 rounded-full border-2 border-white bg-amber-300 shadow-sm dark:border-zinc-900" />
          <span className="h-6 w-6 rounded-full border-2 border-white bg-accent-violet/80 shadow-sm dark:border-zinc-900" />
        </div>
        <div
          className="absolute left-6 top-14 h-16 w-20 rounded-md shadow-md sm:h-20 sm:w-24"
          style={{
            background: `linear-gradient(135deg, ${productPalette.accentLavender} 0%, #d8c9e8 100%)`,
            boxShadow: "2px 4px 12px rgba(18,140,126,0.1)",
          }}
        />
        <div
          className="absolute left-[28%] top-1/3 h-14 w-20 rounded-md shadow-md sm:h-16 sm:w-24"
          style={{
            background: "linear-gradient(135deg, #bbf7d0 0%, #86efac 100%)",
          }}
        />
        <div
          className="absolute bottom-[18%] right-[12%] h-20 w-28 rounded-md shadow-md sm:h-24 sm:w-32"
          style={{
            background: "linear-gradient(135deg, #a5f3fc 0%, #67e8f9 100%)",
          }}
        />
        <div className="absolute bottom-[22%] left-[18%] flex h-10 items-center rounded-lg border-2 border-dashed border-brand-teal/35 px-2 text-[10px] font-medium text-brand-teal/85 dark:border-teal-400/40 dark:text-teal-300/90 sm:text-xs">
          Drop ideas here
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-emerald-50/90 via-accent-lavender/25 to-white font-sans text-zinc-900 dark:from-emerald-950 dark:via-accent-violet/[0.12] dark:to-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-brand-teal/10 bg-white/80 backdrop-blur-md dark:border-white/5 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-900 dark:text-white"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-teal text-sm font-bold text-white shadow-sm"
              aria-hidden
            >
              C
            </span>
            <span>CollabBoard</span>
          </Link>

          <nav
            className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex dark:text-zinc-400"
            aria-label="Sections"
          >
            <a
              href="#preview"
              className="transition hover:text-brand-teal dark:hover:text-teal-300"
            >
              Product
            </a>
            <span className="cursor-not-allowed text-zinc-400 dark:text-zinc-600" title="Coming later">
              Pricing
            </span>
            <span className="cursor-not-allowed text-zinc-400 dark:text-zinc-600" title="Coming later">
              Resources
            </span>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-700 underline-offset-4 transition hover:text-accent-violet hover:underline dark:text-zinc-300 dark:hover:text-accent-lavender"
            >
              Log in
            </Link>
            <Link
              href="/login?view=signup"
              className="rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-teal-hover focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2 dark:focus:ring-offset-zinc-950 sm:px-5"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-3xl px-4 pb-12 pt-14 text-center sm:px-6 sm:pb-16 sm:pt-20 md:pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-violet dark:text-accent-lavender">
            Realtime whiteboard
          </p>
          <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl md:text-6xl dark:text-white">
            Your team&apos;s ideas,{" "}
            <span className="bg-gradient-to-r from-brand-teal via-teal-500 to-accent-violet bg-clip-text text-transparent dark:from-teal-300 dark:via-teal-400 dark:to-accent-lavender">
              on one canvas
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Draw, stick notes, and invite collaborators — with optional AI help. Built for fast workshops and async
            alignment.
          </p>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login?view=signup"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-teal px-8 text-base font-semibold text-white shadow-md transition hover:bg-brand-teal-hover focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
            >
              Get started
              <span className="text-white/90" aria-hidden>
                →
              </span>
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-brand-teal/30 bg-white/80 px-8 text-base font-semibold text-brand-teal backdrop-blur-sm transition hover:border-accent-violet/40 hover:text-accent-violet dark:border-teal-500/40 dark:bg-zinc-900/80 dark:text-teal-200 dark:hover:border-accent-lavender/50 dark:hover:text-accent-lavender"
            >
              Log in
            </Link>
          </div>

          <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-500">
            Free account · Email or Google · Boards you own or share
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 sm:pb-28">
          <BoardPreviewMock />
          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-500">
            More marketing sections can land here later — for now, jump in from the{" "}
            <Link
              href="/login"
              className="font-medium text-brand-teal underline-offset-2 hover:text-accent-violet hover:underline dark:text-teal-400 dark:hover:text-accent-lavender"
            >
              sign-in page
            </Link>
            .
          </p>
        </section>
      </main>

      <footer className="border-t border-brand-teal/10 bg-white/60 py-8 text-center text-sm text-zinc-500 backdrop-blur-sm dark:border-white/5 dark:bg-zinc-950/60 dark:text-zinc-500">
        <p className="mx-auto max-w-2xl px-4">
          Palette:{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">{productPalette.brandTeal}</code>{" "}
          teal · <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">{productPalette.accentLavender}</code>{" "}
          lavender · <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">{productPalette.accentViolet}</code>{" "}
          violet — shared tokens in{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">src/lib/design-colors.ts</code> +{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">globals.css</code>
          {` · `}
          <span className="font-medium text-amber-700 dark:text-amber-400">Amber</span> for promos later.
        </p>
      </footer>
    </div>
  );
}
