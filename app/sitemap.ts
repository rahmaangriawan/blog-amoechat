import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getPublicAuthors } from "@/lib/authors";
import { pricingPlans } from "@/lib/amoechat-content";
import { getSeoGlobalSettings } from "@/lib/seo-settings";

const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "https://blog.amoechat.com").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const authors = await getPublicAuthors();
  let seo: { includeBlogSitemap?: boolean; includePagesSitemap?: boolean } | null = null;
  let posts: Array<{ slug: string; updatedAt: Date }> = [];
  let pages: Array<{ slug: string; updatedAt: Date }> = [];

  try {
    seo = await getSeoGlobalSettings();
    [posts, pages] = await Promise.all([
      seo?.includeBlogSitemap === false ? Promise.resolve([]) : (prisma as any).article.findMany({ where: { type: "POST", isPublished: true }, select: { slug: true, updatedAt: true }, take: 1000 }),
      seo?.includePagesSitemap === false ? Promise.resolve([]) : (prisma as any).article.findMany({ where: { type: "PAGE", isPublished: true }, select: { slug: true, updatedAt: true }, take: 1000 }),
    ]);
  } catch {
    console.warn("Sitemap memakai route statis karena database tidak tersedia.");
  }

  const staticPaths = ["", "/fitur", "/paket", "/cara-kerja", "/tentang", "/faq", "/bantuan", "/blog", "/author", "/program", "/program/daftar", "/syarat-ketentuan", "/kebijakan-privasi"];
  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((path) => ({ url: `${siteOrigin}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "daily" : "weekly", priority: path === "" ? 1 : 0.7 }));

  return [
    ...staticRoutes,
    ...pricingPlans.map((plan) => ({ url: `${siteOrigin}/paket/${plan.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 })),
    ...posts.map((item) => ({ url: `${siteOrigin}/blog/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.75 })),
    ...pages.map((item) => ({ url: `${siteOrigin}/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...authors.map((author) => ({ url: `${siteOrigin}/author/${author.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.55 })),
  ];
}
