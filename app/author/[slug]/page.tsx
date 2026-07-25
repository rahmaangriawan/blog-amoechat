import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthorBySlug, getPublicAuthors } from "@/lib/authors";
import { buildPageMetadata } from "@/lib/metadata";
import { safeJsonLd } from "@/lib/safe-json-ld";

export const revalidate = 300;

export async function generateStaticParams() {
  const authors = await getPublicAuthors();
  return authors.map((author) => ({ slug: author.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return {};

  return buildPageMetadata({
    title: author.name,
    description: author.bio,
    canonical: `/author/${author.slug}`,
    ogType: "profile",
    featuredImage: author.avatarUrl,
    imageAlt: author.name,
  });
}

function stripHtml(value?: string | null) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(date?: Date | string | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date));
}

export default async function AuthorDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  let posts: any[] = [];
  try {
    const postWhere = author.id
      ? { type: "POST", isPublished: true, authorId: author.id }
      : { type: "POST", isPublished: true };
    posts = await (prisma as any).article.findMany({
      where: postWhere,
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
        author: { select: { name: true } },
      },
    });
  } catch (error) {
    console.warn(`[Author ${slug}] Using fallback empty posts due to DB error:`, error);
  }

  const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "https://blog.amoechat.com").replace(/\/$/, "");
  const authorUrl = `${siteOrigin}/author/${author.slug}`;
  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `Profil ${author.name}`,
    url: authorUrl,
    ...(author.updatedAt ? { dateModified: author.updatedAt.toISOString() } : {}),
    mainEntity: {
      "@type": "Person",
      "@id": `${authorUrl}#person`,
      name: author.name,
      url: authorUrl,
      jobTitle: author.role,
      description: author.bio,
      ...(author.avatarUrl ? { image: author.avatarUrl } : {}),
      worksFor: {
        "@type": "Organization",
        "@id": `${siteOrigin}/#organization`,
        name: "Amoechat",
        url: siteOrigin,
      },
    },
  };

  return (
    <>
      <main className="container py-12 section-mobile-padding">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(profileJsonLd) }} />

        <section className="rounded-[24px] border border-[var(--line)] bg-white p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            {author.avatarUrl ? (
              <img
                src={author.avatarUrl}
                alt={author.name}
                width={80}
                height={80}
                className="h-20 w-20 shrink-0 rounded-full object-cover"
                decoding="async"
              />
            ) : (
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[var(--primary-strong)] text-3xl font-black text-white">
                {author.initials}
              </div>
            )}
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--primary)]">Author</p>
              <h1 className="mt-2 text-4xl font-black leading-tight">{author.name}</h1>
              <p className="mt-1 font-bold text-[var(--primary)]">{author.role}</p>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">{author.bio}</p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Artikel dari {author.name}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{posts.length} artikel dipublikasikan.</p>
            </div>
            <Link href="/blog" className="font-bold text-[var(--primary)]">
              Lihat semua blog
            </Link>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                    <h3 className="mt-3 text-xl font-black leading-snug transition group-hover:text-[var(--primary)]">{post.title}</h3>
                    {excerpt ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--muted)]">{excerpt}</p> : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
