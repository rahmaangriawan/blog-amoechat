import type { MetadataRoute } from "next";
import { getSeoGlobalSettings } from "@/lib/seo-settings";

const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "https://blog.amoechat.com").replace(/\/$/, "");

export default async function robots(): Promise<MetadataRoute.Robots> {
  let seo: { disallowPaths?: string | null; allowIndexing?: boolean } | null = null;
  try {
    seo = await getSeoGlobalSettings();
  } catch {
    // DB tidak tersedia saat build — pakai default
  }

  const customDisallow = String(seo?.disallowPaths || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const sensitiveDisallow = ["/dashboard", "/login", "/api"];
  const disallow = customDisallow.length > 0
    ? Array.from(new Set([...customDisallow, ...sensitiveDisallow]))
    : sensitiveDisallow;

  return {
    rules: [
      {
        userAgent: "*",
        allow: seo?.allowIndexing === false ? undefined : "/",
        disallow: seo?.allowIndexing === false ? "/" : disallow,
      },
    ],
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
