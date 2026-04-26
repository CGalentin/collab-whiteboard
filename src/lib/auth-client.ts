import type { User } from "firebase/auth";

const PASSWORD_PROVIDER = "password";

/**
 * True if the user can log in with email+password and must complete verification.
 * Google and other IdPs are treated as pre-verified for app access.
 */
export function userNeedsEmailVerification(u: User): boolean {
  if (u.emailVerified) return false;
  return u.providerData.some((p) => p.providerId === PASSWORD_PROVIDER);
}

/** Base for Firebase email action links (must match Firebase Console → Auth → Settings → authorized domains). */
export function getAuthActionContinueUrl(pathWithQuery: string): string {
  if (typeof window === "undefined") {
    return pathWithQuery.startsWith("http") ? pathWithQuery : `http://localhost:3000${pathWithQuery}`;
  }
  const { origin } = window.location;
  if (pathWithQuery.startsWith("http")) return pathWithQuery;
  if (!pathWithQuery.startsWith("/")) {
    return `${origin}/${pathWithQuery}`;
  }
  return `${origin}${pathWithQuery}`;
}

export function getAuthErrorMessage(
  code: string,
  hint?: "google-only" | null,
): string {
  if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
    if (hint === "google-only") {
      return "This email is linked to Google sign-in. Use “Continue with Google” instead, or set a password using Forgot password (if you enabled it for this address).";
    }
    return "We couldn’t sign you in. Check the email, password, and that Caps Lock is off. If you registered with Google, use Continue with Google.";
  }
  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already registered. Sign in instead, or use Continue with Google.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
      return "Use at least 6 characters for your password.";
    case "auth/user-not-found":
      return "No account for that email. Check spelling or create an account.";
    case "auth/invalid-credential":
      return "We couldn’t sign you in. Check the email, password, and that Caps Lock is off.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return "Email and password sign-in is disabled in Firebase. Enable it in the Firebase console (Auth → Sign-in method → Email/Password).";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed before finishing.";
    case "auth/popup-blocked":
      return "Popup was blocked. Allow popups for this site or try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact support.";
    default:
      return "Something went wrong. Try again.";
  }
}
