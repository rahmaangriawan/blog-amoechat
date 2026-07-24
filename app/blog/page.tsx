import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
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

function stripHtml(value?: string | null) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" });

function formatDate(date?: Date | string | null) {
  if (!date) return null;
  return dateFormatter.format(new Date(date));
}

const getCachedBlogPosts = unstable_cache(
  async () =>
    (prisma as any).article.findMany({
      where: { type: "POST", isPublished: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 24,
      select: {
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        featuredImage: true,
        publishedAt: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    }),
  ["public-blog-posts"],
  { revalidate: 300 },
);

export default async function BlogPage() {
  let posts: any[] = [];

  try {
    posts = await getCachedBlogPosts();
  } catch (error) {
    console.warn("Public blog page uses fallback empty data because the database is unavailable.", error);
  }

  return (
    <>
      <main className="container py-12 section-mobile-padding">
        <header className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--primary)]">Blog Amoechat</p>
          <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">Strategi WhatsApp untuk bisnis yang ingin bertumbuh</h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">
            Pelajari campaign, automation, layanan pelanggan, template Meta, dan integrasi API melalui panduan yang praktis.
          </p>
        </header>

        <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post: any, index: number) => {
            const excerpt = post.excerpt || stripHtml(post.content).slice(0, 150);
            const date = formatDate(post.publishedAt || post.createdAt);

            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-2xl border border-[var(--line)] bg-white transition hover:border-[var(--primary)]"
              >
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    width={640}
                    height={360}
                    className="aspect-video w-full object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    decoding="async"
                  />
                ) : (
                  <div className="aspect-video w-full bg-[var(--primary-softer)]" />
                )}
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--muted)]">
                    {post.category ? <span className="rounded-full bg-[var(--primary-softer)] px-3 py-1 text-[var(--primary)]">{post.category.name}</span> : null}
                    {date ? <span>{date}</span> : null}
                  </div>
                  <h2 className="mt-3 text-xl font-black leading-snug transition group-hover:text-[var(--primary)]">{post.title}</h2>
                  {excerpt ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--muted)]">{excerpt}</p> : null}
                </div>
              </Link>
            );
          })}
        </section>

        {posts.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-[var(--line)] bg-white p-8 text-center">
            <p className="font-bold">Belum ada artikel. Insight terbaru Amoechat akan segera hadir.</p>
          </div>
        ) : null}
      </main>
    </>
  );
}
