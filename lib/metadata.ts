import type { Metadata } from "next";
import { resolveOgImage } from "@/lib/og-image";
import { normalizeSeoTitle } from "@/lib/seo-tokens";

export function withSiteTitle(title: string | null | undefined, siteTitle: string | null | undefined) {
  return normalizeSeoTitle(title, siteTitle?.trim() || "Amoechat");
}

export type OgMetaInput = {
  title: string;
  description: string;
  canonical?: string;
  featuredImage?: string | null;
  contentHtml?: string | null;
  ogType?: "website" | "article" | "profile";
  publishedTime?: string | Date | null;
  modifiedTime?: string | Date | null;
  author?: string;
  section?: string;
  imageAlt?: string;
};

export function buildStaticPageMetadata(input: {
  title: string;
  description: string;
  canonical: string;
  image?: string;
}): Metadata {
  const title = withSiteTitle(input.title, "Amoechat");
  const image = input.image || "/images/logo-amoechat.png";

  return {
    title,
    description: input.description,
    alternates: { canonical: input.canonical },
    openGraph: {
      title,
      description: input.description,
      type: "website",
      url: input.canonical,
      siteName: "Amoechat",
      images: [{ url: image, alt: title, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: input.description,
      images: [image],
    },
  };
}

export async function buildPageMetadata(input: OgMetaInput): Promise<Metadata> {
  const title = withSiteTitle(input.title, "Amoechat");
  const image = await resolveOgImage({
    featuredImage: input.featuredImage,
    contentHtml: input.contentHtml,
  });

  const ogType = input.ogType ?? "website";
  const imageAlt = input.imageAlt ?? title;
  const openGraph: Metadata["openGraph"] = {
    title,
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
    if (input.publishedTime) articleOg.publishedTime = new Date(input.publishedTime).toISOString();
    if (input.modifiedTime) articleOg.modifiedTime = new Date(input.modifiedTime).toISOString();
    if (input.author) articleOg.authors = [input.author];
    if (input.section) articleOg.section = input.section;
  }

  return {
    title,
    description: input.description,
    alternates: input.canonical ? { canonical: input.canonical } : undefined,
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description: input.description,
      images: [image],
    },
  };
}
