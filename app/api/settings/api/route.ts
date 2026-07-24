import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { PUBLIC_SETTINGS_CACHE_TAG } from "@/lib/public-settings-cache";
import { clearApiSettingsCache } from "@/lib/api-settings";
import { isTrustedMutationRequest } from "@/lib/request-security";

// Whitelist key yang diizinkan untuk di-upsert via API ini
const ALLOWED_KEYS = new Set([
  // Google
  "GOOGLE_SITE_VERIFICATION", "GOOGLE_ANALYTICS_MEASUREMENT_ID",
  "GOOGLE_GA4_PROPERTY_ID", "GOOGLE_SEARCH_CONSOLE_SITE_URL",
  "INTERNSHIP_SPREADSHEET_ID", "INTERNSHIP_SHEET_NAME",
  // Public contact and author
  "PUBLIC_WHATSAPP_NUMBER", "PUBLIC_WHATSAPP_DISPLAY",
  "PUBLIC_PARTNERSHIP_WHATSAPP_NUMBER", "PUBLIC_PARTNERSHIP_WHATSAPP_DISPLAY",
  "PUBLIC_CALL_CENTER", "PUBLIC_EMAIL",
  "PUBLIC_AUTHOR_NAME", "PUBLIC_AUTHOR_ROLE", "PUBLIC_AUTHOR_BIO", "PUBLIC_AUTHOR_AVATAR_URL",
]);

const MAX_VALUE_LENGTH = 16_000;

export async function POST(request: NextRequest) {
  try {
    if (!isTrustedMutationRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const limitBucket = rateLimit({
      key: `settings-api:${getClientIp(request)}`,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!limitBucket.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await (prisma as any).user.findUnique({
      where: { email: session.email },
      select: { role: true, isActive: true },
    });

    if (!user?.isActive || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const entries = Array.from(formData.entries());

    for (const [key, value] of entries) {
      // Hanya proses key yang ada di whitelist
      if (!ALLOWED_KEYS.has(key)) {
        continue;
      }

      const stringValue = String(value);
      if (stringValue.length > MAX_VALUE_LENGTH) {
        return NextResponse.json(
          { error: `Nilai untuk ${key} terlalu panjang (max ${MAX_VALUE_LENGTH} karakter).` },
          { status: 400 }
        );
      }

      if (key === "GOOGLE_ANALYTICS_MEASUREMENT_ID" && stringValue && !/^G-[A-Z0-9]+$/i.test(stringValue)) {
        return NextResponse.json({ error: "GA4 Measurement ID tidak valid." }, { status: 400 });
      }
      if (key === "GOOGLE_GA4_PROPERTY_ID" && stringValue && !/^\d+$/.test(stringValue)) {
        return NextResponse.json({ error: "GA4 Property ID harus berupa angka." }, { status: 400 });
      }
      if (key === "GOOGLE_SEARCH_CONSOLE_SITE_URL" && stringValue && !/^https?:\/\//i.test(stringValue)) {
        return NextResponse.json({ error: "Search Console Site URL tidak valid." }, { status: 400 });
      }
      if (key === "PUBLIC_EMAIL" && stringValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
        return NextResponse.json({ error: "Email publik tidak valid." }, { status: 400 });
      }
      if (key === "PUBLIC_AUTHOR_AVATAR_URL" && stringValue && !stringValue.startsWith("/") && !/^https?:\/\//i.test(stringValue)) {
        return NextResponse.json({ error: "URL avatar tidak valid." }, { status: 400 });
      }
      await (prisma as any).apiSetting.upsert({
        where: { key },
        update: { value: stringValue },
        create: {
          key,
          value: stringValue,
          category: key.startsWith("GOOGLE_") || key.startsWith("INTERNSHIP_") ? "Google" : "Kontak Publik",
          isSecret: key.includes("SECRET") || key.includes("PASSWORD") || key.includes("KEY"),
        },
      });
    }

    clearApiSettingsCache();
    revalidateTag(PUBLIC_SETTINGS_CACHE_TAG, { expire: 0 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving API settings:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
