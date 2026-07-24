import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  PUBLIC_SETTINGS_REVALIDATE_SECONDS,
  SEO_GLOBAL_CACHE_TAG,
} from "@/lib/public-settings-cache";

export type SeoGlobalSettings = {
  id: string;
  siteTitle: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  headerLogo: string | null;
  footerLogo: string | null;
  favicon: string | null;
  appleTouchIcon: string | null;
  ogDefaultImage: string | null;
  allowIndexing: boolean;
  disallowPaths: string | null;
  includeBlogSitemap: boolean;
  includePagesSitemap: boolean;
};

export const getSeoGlobalSettings = unstable_cache(
  async (): Promise<SeoGlobalSettings | null> =>
    (prisma as any).seoGlobal
      .findFirst({ orderBy: { updatedAt: "desc" } })
      .catch(() => null),
  ["seo-global-settings"],
  {
    revalidate: PUBLIC_SETTINGS_REVALIDATE_SECONDS,
    tags: [SEO_GLOBAL_CACHE_TAG],
  },
);
