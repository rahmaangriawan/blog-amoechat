import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getPublicAuthors } from "@/lib/authors";
import { pricingPlans } from "@/lib/amoechat-content";
import { BLOG_PAGE_SIZE } from "@/lib/blog-archive";
import { getSeoGlobalSettings } from "@/lib/seo-settings";

const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "https://blog.amoechat.com").replace(/\/$/, "");
const staticPaths = [
  "",
  "/fitur",
  "/paket",
  "/cara-kerja",
  "/tentang",
  "/faq",
  "/bantuan",
  "/blog",
  "/author",
  "/program",
  "/syarat-ketentuan",
  "/kebijakan-privasi",
] as const;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const authors = await getPublicAuthors();
  let seo: { includeBlogSitemap?: boolean } | null = null;
  let posts: Array<{ slug: string; updatedAt: Date }> = [];

  try {
    seo = await getSeoGlobalSettings();
    posts =
      seo?.includeBlogSitemap === false
        ? []
        : await (prisma as any).article.findMany({
            where: { type: "POST", isPublished: true },
            select: { slug: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: 1000,
          });
  } catch {
    console.warn("Sitemap memakai route statis karena database tidak tersedia.");
  }

  const entries = new Map<string, MetadataRoute.Sitemap[number]>();
  const add = (entry: MetadataRoute.Sitemap[number]) => {
    if (!entries.has(entry.url)) entries.set(entry.url, entry);
  };

  for (const routePath of staticPaths) {
    add({
      url: `${siteOrigin}${routePath}`,
      changeFrequency: routePath === "" || routePath === "/blog" ? "weekly" : "monthly",
      priority: routePath === "" ? 1 : routePath === "/blog" ? 0.85 : 0.7,
    });
  }

  for (const plan of pricingPlans) {
    add({
      url: `${siteOrigin}/paket/${plan.slug}`,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  for (const item of posts) {
    add({
      url: `${siteOrigin}/blog/${item.slug}`,
      lastModified: item.updatedAt,
      changeFrequency: "weekly",
      priority: 0.75,
    });
  }

  for (let page = 2; page <= Math.ceil(posts.length / BLOG_PAGE_SIZE); page += 1) {
    add({
      url: `${siteOrigin}/blog/page/${page}`,
      lastModified: posts[(page - 1) * BLOG_PAGE_SIZE]?.updatedAt,
      changeFrequency: "weekly",
      priority: 0.65,
    });
  }

  for (const author of authors) {
    add({
      url: `${siteOrigin}/author/${author.slug}`,
      ...(author.updatedAt ? { lastModified: author.updatedAt } : {}),
      changeFrequency: "monthly",
      priority: 0.55,
    });
  }

  return [...entries.values()];
}
