import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { BlogArchive } from "@/components/BlogArchive";
import { getBlogArchivePage } from "@/lib/blog-archive";
import { buildPageMetadata } from "@/lib/metadata";

export const revalidate = 300;
export const dynamic = "force-dynamic";

function parsePage(value: string) {
  return /^\d+$/.test(value) ? Number(value) : Number.NaN;
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const page = parsePage((await params).page);
  if (!Number.isInteger(page) || page < 2) return {};

  return buildPageMetadata({
    title: `Blog WhatsApp Marketing dan Automation — Halaman ${page}`,
    description: `Kumpulan artikel WhatsApp marketing, automation, customer engagement, template, webhook, dan integrasi API halaman ${page}.`,
    canonical: `/blog/page/${page}`,
    ogType: "website",
  });
}

export default async function PaginatedBlogPage({ params }: { params: Promise<{ page: string }> }) {
  const page = parsePage((await params).page);
  if (page === 1) permanentRedirect("/blog");
  if (!Number.isInteger(page) || page < 2) notFound();

  let archive;
  try {
    archive = await getBlogArchivePage(page);
  } catch {
    notFound();
  }

  if (page > archive.totalPages || archive.posts.length === 0) notFound();
  return <BlogArchive archive={archive} />;
}
