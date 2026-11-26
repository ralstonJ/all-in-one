/**
 * Stateless signed session tokens (HS256 JWT via jose). This module has no
 * Next.js imports so it can be used from proxy.ts as well as server code.
 */
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "aio_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  /** account id */
  sub: string;
  username: string;
  role: "admin" | "user";
};

export function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set (see .env.example)");
  }
  return new TextEncoder().encode("dev-only-insecure-session-secret");
}

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT({ username: payload.username, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });
    const { sub, username, role } = payload as {
      sub?: string;
      username?: unknown;
      role?: unknown;
    };
    if (!sub || typeof username !== "string") return null;
    if (role !== "admin" && role !== "user") return null;
    return { sub, username, role };
  } catch {
    return null;
  }
}
