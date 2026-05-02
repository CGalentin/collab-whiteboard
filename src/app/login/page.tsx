"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  verifyPasswordResetCode,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { getAuthErrorMessage, getAuthActionContinueUrl } from "@/lib/auth-client";
import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";

type FormMode = "signin" | "signup" | "forgot" | "resetConfirm";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRaw = searchParams.get("from");
  const from =
    fromRaw && fromRaw.startsWith("/") && !fromRaw.startsWith("//")
      ? fromRaw
      : "/dashboard";
  const notice = searchParams.get("notice");
  const emailSent = searchParams.get("emailSent");

  const oobParam = searchParams.get("oobCode");
  const modeParam = searchParams.get("mode");

  const { user, loading } = useAuth();
  const [formMode, setFormMode] = useState<FormMode>(() => {
    if (searchParams.get("mode") === "resetPassword" && searchParams.get("oobCode")) {
      return "resetConfirm";
    }
    if (searchParams.get("view") === "signup") {
      return "signup";
    }
    return "signin";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [authHint, setAuthHint] = useState<"google-only" | null>(null);
  const [resetForEmail, setResetForEmail] = useState<string | null>(null);
  const [verifyActionBusy, setVerifyActionBusy] = useState(
    () => modeParam === "verifyEmail" && Boolean(oobParam),
  );
  const didApplyLinkRef = useRef(false);

  useEffect(() => {
    if (notice === "verified") {
      setSuccess("Your email is confirmed. You can sign in now.");
    }
  }, [notice]);

  useEffect(() => {
    if (emailSent === "1") {
      setSuccess("Check your inbox to verify your address before using the app.");
    }
  }, [emailSent]);

  useEffect(() => {
    if (modeParam !== "verifyEmail" || !oobParam || didApplyLinkRef.current) {
      return;
    }
    didApplyLinkRef.current = true;
    (async () => {
      setVerifyActionBusy(true);
      setError(null);
      const auth = getFirebaseAuth();
      try {
        await checkActionCode(auth, oobParam);
        await applyActionCode(auth, oobParam);
        const u = auth.currentUser;
        if (u) {
          await u.reload();
        }
        if (u?.emailVerified) {
          router.replace(from);
          return;
        }
        setSuccess("Your email is verified. Sign in if you’re on another device, or go to the app if you’re already signed in here.");
        const u2 = new URL(window.location.href);
        u2.searchParams.delete("oobCode");
        u2.searchParams.delete("mode");
        u2.searchParams.delete("apiKey");
        u2.searchParams.delete("lang");
        window.history.replaceState(null, "", u2.toString());
        router.replace(`/login?from=${encodeURIComponent(from)}&notice=verified`);
      } catch (e: unknown) {
        const code =
          e && typeof e === "object" && "code" in e
            ? String((e as { code: string }).code)
            : "";
        if (code === "auth/invalid-action-code" || code === "auth/expired-action-code") {
          setError(
            "This link is invalid or has expired. Request a new email from the sign-in page, or resend from the app.",
          );
        } else {
          setError(getAuthErrorMessage(code));
        }
        didApplyLinkRef.current = false;
      } finally {
        setVerifyActionBusy(false);
      }
    })();
  }, [from, modeParam, oobParam, router]);

  useEffect(() => {
    if (formMode !== "resetConfirm" || !oobParam) return;
    const auth = getFirebaseAuth();
    void verifyPasswordResetCode(auth, oobParam)
      .then((addr) => setResetForEmail(addr))
      .catch((e: unknown) => {
        const code =
          e && typeof e === "object" && "code" in e
            ? String((e as { code: string }).code)
            : "";
        if (code === "auth/invalid-action-code" || code === "auth/expired-action-code") {
          setError("This reset link is invalid or has expired. Request a new one from the sign-in page.");
        } else {
          setError(getAuthErrorMessage(code));
        }
      });
  }, [formMode, oobParam]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    router.replace(from);
  }, [loading, user, from, router]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAuthHint(null);
    if (formMode === "forgot" && !success) {
      setSuccess(null);
    } else if (formMode !== "forgot") {
      setSuccess(null);
    }
    const trimmed = email.trim();

    if (formMode === "forgot") {
      if (!trimmed) {
        setError("Enter the email for your account.");
        return;
      }
      setBusy(true);
      try {
        const auth = getFirebaseAuth();
        const actionUrl = getAuthActionContinueUrl(
          `/login?from=${encodeURIComponent(from)}`,
        );
        await sendPasswordResetEmail(auth, trimmed, {
          url: actionUrl,
          handleCodeInApp: true,
        });
        setSuccess("If that email is registered, you’ll get a reset link. Check your inbox and spam folder.");
        setFormMode("signin");
      } catch (err: unknown) {
        const code =
          err && typeof err === "object" && "code" in err
            ? String((err as { code: string }).code)
            : "";
        setError(getAuthErrorMessage(code));
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    const auth = getFirebaseAuth();
    try {
      if (formMode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, trimmed, password);
        const verifyUrl = getAuthActionContinueUrl(
          `/login?from=${encodeURIComponent(from)}&emailSent=1`,
        );
        await sendEmailVerification(cred.user, {
          url: verifyUrl,
          handleCodeInApp: true,
        });
        router.replace(from);
        return;
      }
      if (formMode === "resetConfirm" && oobParam) {
        if (newPassword !== newPassword2) {
          setError("The two passwords do not match.");
          setBusy(false);
          return;
        }
        if (newPassword.length < 6) {
          setError("Use at least 6 characters for your new password.");
          setBusy(false);
          return;
        }
        await confirmPasswordReset(auth, oobParam, newPassword);
        setSuccess("Your password is updated. Sign in below.");
        setFormMode("signin");
        setNewPassword("");
        setNewPassword2("");
        setPassword("");
        const u = new URL(window.location.href);
        u.searchParams.delete("oobCode");
        u.searchParams.delete("mode");
        u.searchParams.delete("apiKey");
        u.searchParams.delete("lang");
        window.history.replaceState(null, "", u.toString());
        return;
      }
      if (formMode === "signin") {
        await signInWithEmailAndPassword(auth, trimmed, password);
        router.replace(from);
      }
    } catch (err: unknown) {
      const ecode =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      let hint: "google-only" | null = null;
      if (trimmed && (ecode === "auth/invalid-credential" || ecode === "auth/wrong-password")) {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, trimmed);
          if (methods.length > 0 && !methods.includes("password")) {
            hint = "google-only";
          }
        } catch {
          /* ignore */
        }
      }
      setAuthHint(hint);
      setError(getAuthErrorMessage(ecode, hint));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setAuthHint(null);
    setSuccess(null);
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
      setError(getAuthErrorMessage(code));
    } finally {
      setBusy(false);
    }
  }

  if (modeParam === "verifyEmail" && oobParam && verifyActionBusy) {
    return (
      <div className="mx-auto w-full max-w-sm">
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">Confirming your email…</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="mx-auto w-full max-w-sm text-center text-sm text-zinc-500">Opening the app…</div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-500 dark:text-zinc-500">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (formMode === "resetConfirm" && oobParam && modeParam === "resetPassword") {
    return (
      <div className="mx-auto w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Set a new password</h1>
          {resetForEmail ? (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">for {resetForEmail}</p>
          ) : null}
        </div>
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-300" role="status">
              {success}
            </p>
          ) : null}
          <div className="space-y-2">
            <label htmlFor="new-pass" className="block text-xs font-medium text-zinc-500">
              New password
            </label>
            <input
              id="new-pass"
              type="password"
              autoComplete="new-password"
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="new-pass2" className="block text-xs font-medium text-zinc-500">
              Confirm password
            </label>
            <input
              id="new-pass2"
              type="password"
              autoComplete="new-password"
              name="confirmNewPassword"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy ? "Please wait…" : "Update password"}
          </button>
        </form>
        <p className="text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setFormMode("signin");
              setError(null);
            }}
            className="text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Back to sign in
          </button>
        </p>
      </div>
    );
  }

  if (formMode === "forgot") {
    return (
      <div className="mx-auto w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Reset password</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">We’ll email a link to set a new password.</p>
        </div>
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="forgot-email" className="block text-xs font-medium text-zinc-500">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-600 dark:text-emerald-300">{success}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full min-h-11 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-600">
          <button
            type="button"
            onClick={() => {
              setFormMode("signin");
              setError(null);
            }}
            className="text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Back to sign in
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          {formMode === "signup" ? "Create account" : "Sign in"}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Use your account to open your boards.</p>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-4" autoComplete="on">
        <div className="space-y-2">
          <label
            htmlFor="sign-email"
            className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500"
          >
            Email
          </label>
          <input
            id="sign-email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-2">
            <label
              htmlFor="sign-password"
              className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500"
            >
              Password
            </label>
            {formMode === "signin" ? (
              <button
                type="button"
                className="shrink-0 text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                onClick={() => {
                  setFormMode("forgot");
                  setError(null);
                }}
              >
                Forgot password?
              </button>
            ) : null}
          </div>
          <input
            id="sign-password"
            name="password"
            type="password"
            autoComplete={formMode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            placeholder="••••••••"
          />
        </div>

        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        {authHint === "google-only" ? (
          <p className="text-sm text-amber-700 dark:text-amber-300" role="status">
            This email is only set up for Google. Use <strong>Continue with Google</strong> below, or go through{" "}
            <strong>Forgot password</strong> if you created the account with email and password and want a password
            on this address.
          </p>
        ) : null}
        {success ? <p className="text-sm text-emerald-600 dark:text-emerald-300">{success}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full min-h-11 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy
            ? "Please wait…"
            : formMode === "signup"
              ? "Create account"
              : "Sign in with email"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-500">
        {formMode === "signin" ? (
          <>
            No account?{" "}
            <button
              type="button"
              className="text-emerald-600 hover:underline dark:text-emerald-400"
              onClick={() => {
                setFormMode("signup");
                setError(null);
                setSuccess(null);
                setAuthHint(null);
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
              className="text-emerald-600 hover:underline dark:text-emerald-400"
              onClick={() => {
                setFormMode("signin");
                setError(null);
                setSuccess(null);
                setAuthHint(null);
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
          <span className="bg-zinc-50 px-2 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-600">or</span>
        </div>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => void handleGoogle()}
        className="flex w-full min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
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
        fallback={<p className="text-sm text-zinc-500">Loading…</p>}
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
