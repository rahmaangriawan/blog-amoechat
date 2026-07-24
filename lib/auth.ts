import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { acceptedAuthCookieNames, authCookieName } from "@/lib/auth-cookie";

const cookieName = authCookieName();
const defaultSessionMaxAgeSeconds = 60 * 60 * 8;
const rememberedSessionMaxAgeSeconds = 60 * 60 * 24 * 7;

export type CmsRole = "SUPER_ADMIN" | "ADMIN" | "MARKETING" | "MEMBER";
const cmsRoles: readonly CmsRole[] = ["SUPER_ADMIN", "ADMIN", "MARKETING", "MEMBER"];

export function isCmsRole(value: unknown): value is CmsRole {
  return typeof value === "string" && cmsRoles.includes(value as CmsRole);
}

interface SessionPayload {
  email: string;
  role: CmsRole;
  iat: number;
  exp?: number;
  passwordVersion?: string;
}

function secret() {
  const value = process.env.CMS_SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!value || value === "development-secret" || value.length < 32)) {
    throw new Error("CMS_SESSION_SECRET must be at least 32 characters in production.");
  }
  return value ?? "development-secret";
}

function passwordVersion(passwordHash: string) {
  return createHmac("sha256", secret()).update(`password:${passwordHash}`).digest("base64url");
}

export function signSession(
  email: string,
  role: CmsRole,
  maxAgeSeconds = defaultSessionMaxAgeSeconds,
  passwordHash?: string,
) {
  const issuedAt = Date.now();
  const payload = Buffer.from(
    JSON.stringify({
      email,
      role,
      iat: issuedAt,
      exp: issuedAt + maxAgeSeconds * 1000,
      ...(passwordHash ? { passwordVersion: passwordVersion(passwordHash) } : {}),
    }),
    "utf8",
  ).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySession(token?: string): false | SessionPayload {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
    if (
      typeof parsed.email !== "string"
      || !parsed.email
      || !isCmsRole(parsed.role)
      || typeof parsed.iat !== "number"
      || (parsed.exp !== undefined && typeof parsed.exp !== "number")
      || (parsed.passwordVersion !== undefined && typeof parsed.passwordVersion !== "string")
    ) return false;
    const expiresAt = typeof parsed.exp === "number" ? parsed.exp : parsed.iat + defaultSessionMaxAgeSeconds * 1000;
    if (Date.now() >= expiresAt) return false;
    return parsed;
  } catch {
    return false;
  }
}

export async function getSession(): Promise<false | SessionPayload> {
  const cookieStore = await cookies();
  for (const name of acceptedAuthCookieNames()) {
    const session = verifySession(cookieStore.get(name)?.value);
    if (session) return session;
  }
  return false;
}

export async function isCmsAuthenticated() {
  return (await getSessionRole()) !== null;
}

export async function getSessionRole(): Promise<CmsRole | null> {
  const session = await getSession();
  if (!session) return null;

  try {
    const user = await (prisma as any).user.findUnique({
      where: { email: session.email },
      select: { role: true, isActive: true, passwordHash: true },
    });
    if (!user?.isActive || !isCmsRole(user.role)) {
      return null;
    }
    if (session.passwordVersion && session.passwordVersion !== passwordVersion(user.passwordHash)) return null;
    return user.role as CmsRole;
  } catch {
    return null;
  }
}

export async function setCmsSession(email: string, role: CmsRole, remember = false, passwordHash?: string) {
  const maxAge = remember ? rememberedSessionMaxAgeSeconds : defaultSessionMaxAgeSeconds;
  const cookieStore = await cookies();
  cookieStore.set(cookieName, signSession(email, role, maxAge, passwordHash), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
    priority: "high",
  });
}

export async function clearCmsSession() {
  const cookieStore = await cookies();
  for (const name of acceptedAuthCookieNames()) {
    cookieStore.delete(name);
  }
}

/**
 * Page guard: kalau role bukan SUPER_ADMIN, lempar ke /dashboard.
 * Dipakai di halaman yang hanya boleh diakses admin penuh.
 */
export async function requireSuperAdminPage() {
  const role = await getSessionRole();
  if (role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }
}

export { cookieName };
