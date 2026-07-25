import type { Metadata } from "next";
import { BlogArchive } from "@/components/BlogArchive";
import { getBlogArchivePage } from "@/lib/blog-archive";
import { buildPageMetadata } from "@/lib/metadata";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Blog WhatsApp Marketing dan Automation",
    description: "Insight praktis tentang WhatsApp marketing, automation, customer engagement, template, webhook, dan integrasi API.",
    canonical: "/blog",
    ogType: "website",
  });
}

export default async function BlogPage() {
  try {
    return <BlogArchive archive={await getBlogArchivePage(1)} />;
  } catch (error) {
    console.warn("Public blog page uses fallback empty data because the database is unavailable.", error);
    return <BlogArchive archive={{ posts: [], page: 1, totalPages: 1, totalPosts: 0 }} />;
  }
}
