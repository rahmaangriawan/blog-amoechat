import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const seo = await (prisma as any).seoGlobal.findFirst({
    orderBy: { updatedAt: "desc" },
    select: {
      headerLogo: true,
      footerLogo: true,
      favicon: true,
      appleTouchIcon: true,
      ogDefaultImage: true,
    },
  }).catch(() => null);

  return NextResponse.json(
    { seo },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
      },
    }
  );
}
