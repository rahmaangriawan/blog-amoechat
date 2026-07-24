import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { isCmsRole, setCmsSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { isRequestBodyWithinLimit, isTrustedMutationRequest, publicOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "/dashboard");
  return next.startsWith("/dashboard") ? next : "/dashboard";
}

function loginRedirect(request: NextRequest, next: string, error = false) {
  const url = new URL(error ? "/login" : next, publicOrigin(request));
  if (error) {
    url.searchParams.set("error", "1");
    url.searchParams.set("next", next);
  }
  return NextResponse.redirect(url);
}

async function verifyTurnstile(response: FormDataEntryValue | null) {
  if (!process.env.TURNSTILE_SECRET_KEY) return true;
  if (!response) return false;

  const verifyRes = await fetchWithTimeout("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: String(response),
    }),
  }, 8_000);
  const verifyJson = (await verifyRes.json()) as { success?: boolean };
  return Boolean(verifyJson.success);
}

export async function POST(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isRequestBodyWithinLimit(request, 32 * 1024)) {
    return NextResponse.json({ error: "Payload terlalu besar" }, { status: 413 });
  }
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  const remember = formData.get("remember") === "on";

  const limitByEmail = rateLimit({
    key: `login:email:${email || "unknown"}`,
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });
  if (!limitByEmail.allowed) return loginRedirect(request, next, true);

  const ip = getClientIp(request);
  const limitByIp = rateLimit({
    key: `login:ip:${ip}`,
    limit: 30,
    windowMs: 15 * 60 * 1000,
  });
  if (!limitByIp.allowed) return loginRedirect(request, next, true);

  if (!(await verifyTurnstile(formData.get("cf-turnstile-response")))) {
    return loginRedirect(request, next, true);
  }

  let user: { email: string; passwordHash: string; role: string; isActive: boolean } | null = null;
  try {
    user = await (prisma as any).user.findUnique({
      where: { email },
      select: { email: true, passwordHash: true, role: true, isActive: true },
    });
  } catch {
    return loginRedirect(request, next, true);
  }

  const dummyHash = "$2b$12$" + "a".repeat(53);
  if (!user || !user.isActive) {
    await bcrypt.compare(password, dummyHash).catch(() => false);
    return loginRedirect(request, next, true);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return loginRedirect(request, next, true);

  if (!isCmsRole(user.role)) return loginRedirect(request, next, true);

  await setCmsSession(user.email, user.role, remember, user.passwordHash);
  return loginRedirect(request, next);
}
