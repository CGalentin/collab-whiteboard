"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendEmailVerification, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { getAuthActionContinueUrl } from "@/lib/auth-client";
import { useSignOut } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";

type VerifyEmailGateProps = {
  user: User;
  continuePath: string;
};

const RESEND_COOLDOWN_S = 45;

/**
 * Shown to email/password users until `user.emailVerified` (after they open the link in the email).
 */
export function VerifyEmailGate({ user, continuePath }: VerifyEmailGateProps) {
  const router = useRouter();
  const signOut = useSignOut();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = useCallback(async () => {
    if (cooldown > 0) return;
    setError(null);
    setMessage(null);
    const auth = getFirebaseAuth();
    if (!auth.currentUser) return;
    try {
      const continueUrl = getAuthActionContinueUrl(
        `/login?from=${encodeURIComponent(continuePath)}&emailSent=1`,
      );
      await sendEmailVerification(auth.currentUser, {
        url: continueUrl,
        handleCodeInApp: true,
      });
      setMessage("We sent another verification link. Check your spam folder too.");
      setCooldown(RESEND_COOLDOWN_S);
    } catch (e: unknown) {
      const code =
        e && typeof e === "object" && "code" in e
          ? String((e as { code: string }).code)
          : "";
      if (code === "auth/too-many-requests") {
        setError("Too many emails sent. Try again in an hour or use a different sign-in method.");
      } else {
        setError("Could not send the email. Try again.");
      }
    }
  }, [cooldown, continuePath]);

  const recheck = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      const auth = getFirebaseAuth();
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        setMessage("Your email is verified. Loading…");
        router.replace(continuePath);
        return;
      }
      setError("We don’t see a verified address yet. Open the link in the message we sent, then tap “I’ve verified” again.");
    } catch {
      setError("Could not refresh. Check your network and try again.");
    } finally {
      setRefreshing(false);
    }
  }, [continuePath, router]);

  const email = user.email ?? "your address";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-12 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h1 className="text-lg font-semibold">Confirm your email</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          We sent a verification link to <span className="font-medium text-zinc-800 dark:text-zinc-200">{email}</span>.
          Open that message and tap the link, then return here and click “I’ve verified.”
        </p>
        {message ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-300" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void recheck()}
            disabled={refreshing}
            className="min-h-11 flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {refreshing ? "Checking…" : "I’ve verified — continue"}
          </button>
          <button
            type="button"
            onClick={() => void resend()}
            disabled={cooldown > 0}
            className="min-h-11 flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
          </button>
        </div>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-500">
          <button
            type="button"
            onClick={() => void signOut()}
            className="text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            Sign out
          </button>{" "}
          and use a different account, or use Google from the sign-in page.
        </p>
      </div>
    </div>
  );
}
