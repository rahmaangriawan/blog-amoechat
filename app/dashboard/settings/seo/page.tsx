import type { Metadata } from "next";
import { SeoGlobalManager } from "@/components/SeoGlobalManager";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SEO Global",
};

function parsePositiveInt(value: string | string[] | undefined, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function SeoSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireSuperAdminPage();
  const params = await searchParams;
  const activeTab = ["redirects", "homepage", "branding"].includes(String(params.tab || "")) ? String(params.tab) : "homepage";
  const search = String(params.q || "").trim();
  const page = parsePositiveInt(params.page, 1);
  const take = 10;
  const skip = (page - 1) * take;

  const redirectWhere = search
    ? {
        OR: [
          { sourceUrl: { contains: search } },
          { targetUrl: { contains: search } },
        ],
      }
    : undefined;

  const [seo, redirects, totalRedirects] = await Promise.all([
    (prisma as any).seoGlobal.findFirst({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        siteTitle: true,
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
        canonicalUrl: true,
        ogTitle: true,
        ogDescription: true,
        ogImage: true,
        twitterTitle: true,
        twitterDescription: true,
        twitterImage: true,
        headerLogo: true,
        footerLogo: true,
        favicon: true,
        appleTouchIcon: true,
        ogDefaultImage: true,
        allowIndexing: true,
        disallowPaths: true,
        includeBlogSitemap: true,
        includePagesSitemap: true,
      },
    }),
    (prisma as any).redirect.findMany({
      where: redirectWhere,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        sourceUrl: true,
        targetUrl: true,
        type: true,
        isActive: true,
      },
    }),
    (prisma as any).redirect.count({ where: redirectWhere }),
  ]);

  return (
    <SeoGlobalManager
      seo={seo}
      redirects={redirects}
      activeTab={activeTab}
      search={search}
      page={page}
      totalPages={Math.max(1, Math.ceil(totalRedirects / take))}
      totalRedirects={totalRedirects}
      saved={params.saved === "1"}
    />
  );
}
