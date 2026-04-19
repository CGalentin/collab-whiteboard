import jwt from "jsonwebtoken";

/**
 * Firebase Auth ID tokens must be verified with the **securetoken** service account
 * x509 keys (not `oauth2/v1/certs`). See:
 * https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
 */
const SECURETOKEN_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

type CertsCache = { certs: Record<string, string>; expiresAt: number };
let certsCache: CertsCache | null = null;

async function getSecureTokenCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (certsCache && now < certsCache.expiresAt) {
    return certsCache.certs;
  }

  const res = await fetch(SECURETOKEN_CERTS_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load Firebase signing keys (${res.status})`);
  }

  const maxAge = res.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1];
  const ttlMs = maxAge ? Number(maxAge) * 1000 : 3_600_000;

  const certs = (await res.json()) as Record<string, string>;
  certsCache = {
    certs,
    expiresAt: now + Math.min(ttlMs, 3_600_000),
  };
  return certs;
}

function audienceMatches(
  aud: jwt.JwtPayload["aud"],
  projectId: string,
): boolean {
  if (aud === projectId) return true;
  if (Array.isArray(aud)) return aud.includes(projectId);
  return false;
}

/**
 * Verifies a Firebase Auth **ID token** from the client (`user.getIdToken()`).
 * No Firebase Admin service account required.
 */
export async function verifyFirebaseIdToken(
  idToken: string,
): Promise<{ uid: string; email?: string }> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set");
  }

  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded || typeof decoded === "string" || !decoded.header.kid) {
    throw new Error("Malformed ID token");
  }

  let certs = await getSecureTokenCerts();
  let pem = certs[decoded.header.kid];
  if (!pem) {
    certsCache = null;
    certs = await getSecureTokenCerts();
    pem = certs[decoded.header.kid];
  }
  if (!pem) {
    throw new Error(
      "Unknown signing key — ID token may be invalid or from another project",
    );
  }

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(idToken, pem, {
      algorithms: ["RS256"],
    }) as jwt.JwtPayload;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid token";
    throw new Error(
      msg.includes("expired") ? "Firebase ID token expired — sign out and sign in again" : msg,
    );
  }

  const expectedIss = `https://securetoken.google.com/${projectId}`;
  if (payload.iss !== expectedIss) {
    throw new Error(
      `Token issuer mismatch — expected Firebase project "${projectId}" (check NEXT_PUBLIC_FIREBASE_PROJECT_ID)`,
    );
  }

  if (!audienceMatches(payload.aud, projectId)) {
    throw new Error(
      `Token audience mismatch — set NEXT_PUBLIC_FIREBASE_PROJECT_ID to your Firebase project id (got aud=${String(payload.aud)})`,
    );
  }

  if (!payload.sub) {
    throw new Error("Invalid token payload (missing sub)");
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
  };
}
