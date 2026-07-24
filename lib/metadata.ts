import type { Metadata } from "next";
import { resolveOgImage } from "@/lib/og-image";

export function withSiteTitle(title: string | null | undefined, siteTitle: string | null | undefined) {
  const cleanTitle = title?.trim();
  const cleanSiteTitle = siteTitle?.trim() || "Amoechat";

  if (!cleanTitle) return cleanSiteTitle;

  // Jangan append site title di sini — layout template sudah handle via `%s | SiteTitle`
  // Cukup return title bersih tanpa duplikasi
  if (cleanTitle === cleanSiteTitle) return cleanTitle;
  if (cleanTitle.endsWith(`| ${cleanSiteTitle}`)) return cleanTitle.replace(` | ${cleanSiteTitle}`, "");
  if (cleanTitle.endsWith(`- ${cleanSiteTitle}`)) return cleanTitle.replace(` - ${cleanSiteTitle}`, "");

  return cleanTitle;
}

export type OgMetaInput = {
  title: string;
  description: string;
  canonical?: string;
  /** Eksplisit featured image, kalau tidak ada akan fallback ke content HTML → SeoGlobal default → static */
  featuredImage?: string | null;
  /** HTML content buat di-scan untuk <img> pertama */
  contentHtml?: string | null;
  /** "website" | "article" | "profile" */
  ogType?: "website" | "article" | "profile";
  /** Untuk article / blog */
  publishedTime?: string | Date | null;
  modifiedTime?: string | Date | null;
  author?: string;
  section?: string;
  imageAlt?: string;
};

/**
 * Bangun metadata openGraph + twitter lengkap dengan fallback image yang cerdas.
 */
export async function buildPageMetadata(input: OgMetaInput): Promise<Metadata> {
  const image = await resolveOgImage({
    featuredImage: input.featuredImage,
    contentHtml: input.contentHtml,
  });

  const ogType = input.ogType ?? "website";
  const imageAlt = input.imageAlt ?? input.title;

  const openGraph: Metadata["openGraph"] = {
    title: input.title,
    description: input.description,
    type: ogType,
    url: input.canonical,
    siteName: "Amoechat",
    images: [{ url: image, alt: imageAlt, width: 1200, height: 630 }],
  };

  if (ogType === "article") {
    const articleOg = openGraph as unknown as {
      publishedTime?: string;
      modifiedTime?: string;
      authors?: string[];
      section?: string;
    };
    if (input.publishedTime) {
      articleOg.publishedTime = new Date(input.publishedTime).toISOString();
    }
    if (input.modifiedTime) {
      articleOg.modifiedTime = new Date(input.modifiedTime).toISOString();
    }
    if (input.author) {
      articleOg.authors = [input.author];
    }
    if (input.section) {
      articleOg.section = input.section;
    }
  }

  return {
    title: input.title,
    description: input.description,
    alternates: input.canonical ? { canonical: input.canonical } : undefined,
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}
