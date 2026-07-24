import "server-only";

import { prisma } from "@/lib/prisma";

export type ActiveRedirect = {
  sourceUrl: string;
  targetUrl: string;
  type: number;
};

const REDIRECT_CACHE_TTL_MS = 60_000;
let redirectCache: { expiresAt: number; values: Map<string, ActiveRedirect> } | null = null;

function pathnameOf(value: string) {
  try {
    return new URL(value, "https://redirect.local").pathname;
  } catch {
    return value.split(/[?#]/, 1)[0] || "/";
  }
}

export async function findActiveRedirect(pathname: string): Promise<ActiveRedirect | null> {
  if (!redirectCache || redirectCache.expiresAt <= Date.now()) {
    const rows = (await (prisma as any).redirect.findMany({
      where: { isActive: true },
      select: { sourceUrl: true, targetUrl: true, type: true },
    })) as ActiveRedirect[];

    redirectCache = {
      expiresAt: Date.now() + REDIRECT_CACHE_TTL_MS,
      values: new Map(rows.map((row) => [pathnameOf(row.sourceUrl), row])),
    };
  }

  return redirectCache.values.get(pathname) || null;
}

export function clearRedirectCache() {
  redirectCache = null;
}
