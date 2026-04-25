"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";

function authErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already registered. Sign in instead.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed before finishing.";
    case "auth/popup-blocked":
      return "Popup was blocked. Allow popups for this site or try again.";
    default:
      return "Something went wrong. Try again.";
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRaw = searchParams.get("from");
  const from =
    fromRaw && fromRaw.startsWith("/") && !fromRaw.startsWith("//")
      ? fromRaw
      : "/dashboard";

  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(from);
    }
  }, [loading, user, router, from]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const auth = getFirebaseAuth();
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      router.replace(from);
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      setError(authErrorMessage(code));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    const auth = getFirebaseAuth();
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.replace(from);
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      setError(authErrorMessage(code));
    } finally {
      setBusy(false);
    }
  }

  if (loading || user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-500 dark:text-zinc-500">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Use your account to open your boards.
        </p>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600"
            placeholder="••••••••"
          />
        </div>

        {error ? (
          <p
            className="text-sm text-red-400"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : "Sign in with email"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-500">
        {mode === "signin" ? (
          <>
            No account?{" "}
            <button
              type="button"
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
            >
              Sign in
            </button>
          </>
        )}
      </p>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide">
          <span className="bg-zinc-50 px-2 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-600">
            or
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={handleGoogle}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-sm">
        <Link
          href="/"
          className="text-zinc-600 underline-offset-4 hover:text-zinc-800 hover:underline dark:text-zinc-500 dark:hover:text-zinc-400"
        >
          Back to home
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-zinc-500 dark:text-zinc-500">Loading…</p>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
