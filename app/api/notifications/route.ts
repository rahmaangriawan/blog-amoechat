import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, getSessionRole } from "@/lib/auth";
import { getUnreadCountForEmail } from "@/lib/notifications";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((await getSessionRole()) !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limitBucket = rateLimit({
      key: `notifications:${session.email}:${getClientIp(req)}`,
      limit: 240,
      windowMs: 10 * 60 * 1000,
    });
    if (!limitBucket.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const requestedLimit = Number(searchParams.get("limit") ?? 10);
    const limit = Math.min(50, Math.max(1, Number.isFinite(requestedLimit) ? requestedLimit : 10));

    const [items, unread] = await Promise.all([
      (prisma as any).notification.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          link: true,
          createdAt: true,
        },
      }),
      getUnreadCountForEmail(session.email),
    ]);

    return NextResponse.json({ items, unread });
  } catch (error) {
    console.error("Failed to load notifications:", error);
    return NextResponse.json({ error: "Gagal memuat notifikasi." }, { status: 500 });
  }
}
