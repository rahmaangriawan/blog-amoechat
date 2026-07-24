import { getSeoGlobalSettings } from "@/lib/seo-settings";

const DEFAULT_SITE_URL = "https://blog.amoechat.com";
const DEFAULT_OG_IMAGE = "/images/logo-amoechat.png";

export function getSiteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
}

/**
 * Convert relative path to absolute URL.
 */
export function toAbsoluteUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  const trimmed = path.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${getSiteOrigin()}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

/**
 * Extract first <img src> from HTML content.
 */
export function extractFirstImageFromHtml(html?: string | null): string | undefined {
  if (!html) return undefined;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1];
}

/**
 * Get default OG image from SeoGlobal (ogDefaultImage → ogImage) with short cache.
 * Returns undefined if DB unavailable.
 */
async function getGlobalDefaultOgImage(): Promise<string | undefined> {
  const seo = await getSeoGlobalSettings();
  return toAbsoluteUrl(seo?.ogDefaultImage || seo?.ogImage);
}

/**
 * Resolve the best OG image for a content page.
 *
 * Priority:
 *   1. Explicit featured image passed by the page
 *   2. First <img> in the HTML body (for blog/article content)
 *   3. Global SeoGlobal default (ogDefaultImage or ogImage)
 *   4. Static fallback (DEFAULT_OG_IMAGE)
 */
export async function resolveOgImage(options: {
  featuredImage?: string | null;
  contentHtml?: string | null;
}): Promise<string> {
  const featured = toAbsoluteUrl(options.featuredImage);
  if (featured) return featured;

  const firstInContent = toAbsoluteUrl(extractFirstImageFromHtml(options.contentHtml));
  if (firstInContent) return firstInContent;

  const globalDefault = await getGlobalDefaultOgImage();
  if (globalDefault) return globalDefault;

  return `${getSiteOrigin()}${DEFAULT_OG_IMAGE}`;
}

/**
 * Synchronous fallback — tanpa DB lookup. Dipakai di page yang sudah ada data image.
 */
export function resolveOgImageSync(options: {
  featuredImage?: string | null;
  contentHtml?: string | null;
}): string {
  const featured = toAbsoluteUrl(options.featuredImage);
  if (featured) return featured;

  const firstInContent = toAbsoluteUrl(extractFirstImageFromHtml(options.contentHtml));
  if (firstInContent) return firstInContent;

  return `${getSiteOrigin()}${DEFAULT_OG_IMAGE}`;
}
