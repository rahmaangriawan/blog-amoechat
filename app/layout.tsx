import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { prisma } from "@/lib/prisma";
import { getPublicContactSettings } from "@/lib/public-contact";
import {
  PUBLIC_SETTINGS_CACHE_TAG,
  PUBLIC_SETTINGS_REVALIDATE_SECONDS,
} from "@/lib/public-settings-cache";
import { getSeoGlobalSettings } from "@/lib/seo-settings";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined;
const googleSettingKeys = ["GOOGLE_SITE_VERIFICATION", "GOOGLE_ANALYTICS_MEASUREMENT_ID"];

const getGoogleSettings = unstable_cache(
  async () => {
    try {
      const settings = await (prisma as any).apiSetting.findMany({
        where: { key: { in: googleSettingKeys } },
        select: { key: true, value: true },
      });

      return Object.fromEntries(settings.map((setting: { key: string; value: string }) => [setting.key, setting.value || ""]));
    } catch {
      return {} as Record<string, string>;
    }
  },
  ["google-public-settings"],
  { revalidate: PUBLIC_SETTINGS_REVALIDATE_SECONDS, tags: [PUBLIC_SETTINGS_CACHE_TAG] },
);

export async function generateMetadata(): Promise<Metadata> {
  const [seo, googleSettings] = await Promise.all([getSeoGlobalSettings(), getGoogleSettings()]);
  const ogImage = seo?.ogDefaultImage || seo?.ogImage || "/images/logo-amoechat.png";
  const googleVerification = googleSettings.GOOGLE_SITE_VERIFICATION;

  const siteTitle = seo?.siteTitle || "Amoechat";

  return {
    metadataBase: siteUrl,
    title: {
      default: seo?.metaTitle || seo?.siteTitle || "Amoechat | WhatsApp API untuk Bisnis",
      template: `%s | ${siteTitle}`,
    },
    description: seo?.metaDescription || "Kelola WhatsApp bisnis melalui Meta Cloud API resmi atau koneksi QR, lengkap dengan inbox tim, broadcast, automation, webhook, dan API.",
    keywords: seo?.metaKeywords,
    manifest: "/site.webmanifest",
    icons: {
      icon: [
        { url: seo?.favicon || "/images/favicon-32.png", type: "image/png", sizes: "32x32" },
        { url: "/images/favicon-48.png", type: "image/png", sizes: "48x48" },
      ],
      shortcut: [{ url: seo?.favicon || "/images/favicon-32.png", type: "image/png", sizes: "32x32" }],
      apple: [{ url: seo?.appleTouchIcon || "/images/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
    },
    appleWebApp: {
      title: siteTitle,
    },
    openGraph: {
      title: seo?.ogTitle || seo?.metaTitle || "Amoechat | WhatsApp API untuk Bisnis",
      description: seo?.ogDescription || seo?.metaDescription || "Hubungkan WhatsApp Official atau QR, lalu jalankan percakapan, campaign, automation, dan integrasi dari satu platform.",
      type: "website",
      siteName: siteTitle,
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo?.twitterTitle || seo?.ogTitle || seo?.metaTitle || "Amoechat | WhatsApp API untuk Bisnis",
      description: seo?.twitterDescription || seo?.ogDescription || seo?.metaDescription || "Hubungkan WhatsApp Official atau QR, lalu jalankan percakapan, campaign, automation, dan integrasi dari satu platform.",
      images: [seo?.twitterImage || ogImage],
    },
    robots: seo?.allowIndexing === false ? { index: false, follow: false } : undefined,
    verification: googleVerification ? { google: googleVerification } : undefined,
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [googleSettings, seo, contact] = await Promise.all([getGoogleSettings(), getSeoGlobalSettings(), getPublicContactSettings()]);
  const measurementId = googleSettings.GOOGLE_ANALYTICS_MEASUREMENT_ID;

  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {measurementId ? <GoogleAnalytics measurementId={measurementId} /> : null}
        <div data-public-chrome="header">
          <SiteHeader initialLogo={seo?.headerLogo || undefined} />
        </div>
        {children}
        <div data-public-chrome="footer">
          <Footer initialLogo={seo?.footerLogo || undefined} contact={contact} />
        </div>
      </body>
    </html>
  );
}
