/**
 * Axxion portal session tokens. Separate cookie and payload from the workshop
 * app, so signing in to one never signs you in to the other. No Next.js
 * imports: proxy.ts uses this too.
 */
import { SignJWT, jwtVerify } from "jose";
import { secretKey } from "@/lib/session-token";

export const AXX_COOKIE = "axx_session";
export const AXX_MAX_AGE_SECONDS = 60 * 60 * 12; // one working day

export type AxRole = "handler" | "surveyor" | "head" | "workshop" | "admin";
export type AxSession = { sub: string; role: AxRole };

const ROLES: AxRole[] = ["handler", "surveyor", "head", "workshop", "admin"];

export async function signAxToken(payload: AxSession) {
  return new SignJWT({ role: payload.role, app: "axxion" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${AXX_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyAxToken(token: string): Promise<AxSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const { sub, role, app } = payload as { sub?: string; role?: unknown; app?: unknown };
    if (!sub || app !== "axxion" || !ROLES.includes(role as AxRole)) return null;
    return { sub, role: role as AxRole };
  } catch {
    return null;
  }
}
