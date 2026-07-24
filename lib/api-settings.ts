import "server-only";

import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secret-storage";

type CacheEntry = {
  value: Record<string, string>;
  expiresAt: number;
};

const settingsCache = new Map<string, CacheEntry>();

export function clearApiSettingsCache() {
  settingsCache.clear();
}

export async function getApiSettings(keys: readonly string[], ttlMs = 300_000): Promise<Record<string, string>> {
  const normalizedKeys = [...new Set(keys)].sort();
  const cacheKey = normalizedKeys.join("|");
  const cached = settingsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const rows = (await (prisma as any).apiSetting.findMany({
      where: { key: { in: normalizedKeys } },
      select: { key: true, value: true },
    })) as Array<{ key: string; value: string | null }>;

    const value = Object.fromEntries(rows.map((row) => [
      row.key,
      row.key === "GOOGLE_SERVICE_ACCOUNT_JSON" && row.value
        ? decryptSecret(row.value)
        : row.value || "",
    ]));
    settingsCache.set(cacheKey, { value, expiresAt: Date.now() + ttlMs });
    return value;
  } catch {
    return {};
  }
}
