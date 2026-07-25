import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BlogPostActions } from "@/components/BlogPostActions";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/format";
import { buildPageMetadata } from "@/lib/metadata";
import { getPublicAuthor, toPublicAuthor } from "@/lib/authors";
import { resolveSeoTokens } from "@/lib/seo-tokens";
import { safeJsonLd } from "@/lib/safe-json-ld";

export const revalidate = 300;

const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "https://blog.amoechat.com").replace(/\/$/, "");
const publisherName = "Amoechat";
const publisherLogo = `${siteOrigin}/images/logo-footer.webp`;

function stripHtml(value?: string | null) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function toAbsoluteUrl(path?: string | null) {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteOrigin}${path.startsWith("/") ? path : `/${path}`}`;
}

function formatDisplayDate(date?: Date | string | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function AuthorAvatar({ author, size = "sm" }: { author: { name: string; initials: string; avatarUrl?: string }; size?: "sm" | "lg" }) {
  const className =
    size === "lg"
      ? "h-14 w-14 text-xl"
      : "h-10 w-10 text-sm";

  if (author.avatarUrl) {
    return (
      <img
        src={author.avatarUrl}
        alt={author.name}
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div className={`grid ${className} shrink-0 place-items-center rounded-full bg-[var(--primary-softer)] font-black text-[var(--primary)]`}>
      {author.initials}
    </div>
  );
}

function withHeadingAnchors(html?: string | null) {
  const used = new Map<string, number>();
  const toc: { id: string; text: string; level: number }[] = [];
  const content = html || "";
  const processed = content.replace(/<h([2-3])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, inner) => {
    const text = stripHtml(inner);
    if (!text) return match;

    const existingId = String(attrs).match(/\sid=["']([^"']+)["']/i)?.[1];
    const baseId = existingId || slugify(text) || "bagian-artikel";
    const count = used.get(baseId) || 0;
    used.set(baseId, count + 1);
    const id = count > 0 ? `${baseId}-${count + 1}` : baseId;

    toc.push({ id, text, level: Number(level) });
    if (existingId) return match;
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });

  return { html: processed, toc };
}

function extractFaqs(html: string) {
  const faqs: { question: string; answer: string }[] = [];
  const pattern = /<h[2-3][^>]*>([\s\S]*?)<\/h[2-3]>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;

  for (const match of html.matchAll(pattern)) {
    const question = stripHtml(match[1]);
    const answer = stripHtml(match[2]);
    if (question.endsWith("?") && answer.length > 20) {
      faqs.push({ question, answer });
    }
  }

  return faqs.slice(0, 8);
}

export async function generateStaticParams() {
  try {
    const posts = await (prisma as any).article.findMany({
      where: { isPublished: true, type: "POST" },
      select: { slug: true },
      take: 500,
    });
    return posts.map((item: any) => ({ slug: item.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = await getPublicAuthor();

  try {
    const item = await (prisma as any).article.findUnique({
      where: { slug },
      select: {
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        featuredImage: true,
        metaTitle: true,
        metaDescription: true,
        publishedAt: true,
        updatedAt: true,
        category: { select: { name: true } },
        author: {
          select: {
            id: true,
            name: true,
            authorSlug: true,
            authorRole: true,
            authorBio: true,
            authorAvatarUrl: true,
          },
        },
      },
    });

    if (!item) return {};

    const description = item.metaDescription || stripHtml(item.excerpt || item.content).slice(0, 160) || item.title;
    const title = resolveSeoTokens(item.metaTitle || item.title);
    const author = item.author ? toPublicAuthor(item.author) : await getPublicAuthor();

    return buildPageMetadata({
      title,
      description,
      canonical: `/blog/${item.slug}`,
      featuredImage: item.featuredImage,
      contentHtml: item.content,
      ogType: "article",
      publishedTime: item.publishedAt,
      modifiedTime: item.updatedAt,
      author: author.name,
      section: item.category?.name,
      imageAlt: item.title,
    });
  } catch {
    return {};
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let item = null;

  try {
    item = await (prisma as any).article.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        featuredImage: true,
        isPublished: true,
        categoryId: true,
        author: {
          select: {
            id: true,
            name: true,
            authorSlug: true,
            authorRole: true,
            authorBio: true,
            authorAvatarUrl: true,
          },
        },
        category: { select: { name: true, slug: true } },
        comments: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, name: true, body: true, createdAt: true },
        },
      },
    });
  } catch {
    notFound();
  }

  if (!item || !item.isPublished) notFound();
  const author = item.author ? toPublicAuthor(item.author) : await getPublicAuthor();

  const categoryRelatedPosts = item.categoryId
    ? await (prisma as any).article.findMany({
        where: {
          type: "POST",
          isPublished: true,
          categoryId: item.categoryId,
          NOT: { id: item.id },
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 3,
        select: {
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          publishedAt: true,
        },
      })
    : [];

  const relatedPosts =
    categoryRelatedPosts.length > 0
      ? categoryRelatedPosts
      : await (prisma as any).article.findMany({
          where: {
            type: "POST",
            isPublished: true,
            NOT: { id: item.id },
          },
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
          take: 3,
          select: {
            title: true,
            slug: true,
            excerpt: true,
            featuredImage: true,
            publishedAt: true,
          },
        });

  const publishedDate = formatDisplayDate(item.publishedAt || item.createdAt);
  const updatedDate = formatDisplayDate(item.updatedAt);
  const { html: articleContent, toc } = withHeadingAnchors(item.content);
  const faqs = extractFaqs(articleContent);
  const absoluteUrl = `${siteOrigin}/blog/${item.slug}`;
  const imageUrl = toAbsoluteUrl(item.featuredImage);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl,
    },
    headline: item.title,
    description: item.excerpt ? stripHtml(item.excerpt) : stripHtml(item.content).slice(0, 160),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    datePublished: new Date(item.publishedAt || item.createdAt).toISOString(),
    dateModified: new Date(item.updatedAt || item.publishedAt || item.createdAt).toISOString(),
    author: {
      "@type": "Person",
      "@id": `${siteOrigin}/author/${author.slug}#person`,
      name: author.name,
      url: `${siteOrigin}/author/${author.slug}`,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${siteOrigin}/#organization`,
      name: publisherName,
      url: siteOrigin,
      logo: {
        "@type": "ImageObject",
        url: publisherLogo,
      },
    },
    articleSection: item.category?.name,
    inLanguage: "id-ID",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: siteOrigin },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${siteOrigin}/blog` },
      { "@type": "ListItem", position: 3, name: item.category?.name || item.title, item: absoluteUrl },
    ],
  };

  const faqJsonLd =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <main className="container py-10 section-mobile-padding">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
        {faqJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} /> : null}

        <nav className="mb-6 flex items-center gap-2 text-sm text-[var(--muted)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[var(--primary)]">
            Beranda
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[var(--primary)]">
            Blog
          </Link>
          {item.category ? (
            <>
              <span>/</span>
              <span>{item.category.name}</span>
            </>
          ) : null}
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="min-w-0">
            <header className="bg-white">
              {item.category ? (
                <span className="inline-block rounded-full bg-[var(--primary-softer)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
                  {item.category.name}
                </span>
              ) : null}
              <h1 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">{item.title}</h1>
              <div className="mt-5 flex flex-col gap-3 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <AuthorAvatar author={author} />
                  <div>
                    <Link href={`/author/${author.slug}`} className="font-bold text-[var(--foreground)] transition hover:text-[var(--primary)]">
                      {author.name}
                    </Link>
                    <p>{author.role}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[13px] sm:justify-end">
                  {publishedDate ? <span className="w-fit rounded-full bg-[var(--primary-softer)] px-3 py-1 font-semibold">Terbit {publishedDate}</span> : null}
                  {updatedDate ? <span className="w-fit rounded-full bg-[var(--primary-softer)] px-3 py-1 font-semibold">Update {updatedDate}</span> : null}
                </div>
              </div>
            </header>

            {item.featuredImage ? (
              <div className="mt-6 aspect-video overflow-hidden rounded-2xl bg-[var(--primary-softer)]">
                <img src={item.featuredImage} alt={item.title} className="h-full w-full object-cover" />
              </div>
            ) : null}

            {item.excerpt ? <p className="mt-6 text-lg leading-relaxed text-[var(--muted)]">{item.excerpt}</p> : null}

            {toc.length > 1 ? (
              <details className="group mt-8 rounded-2xl border border-[var(--line)] bg-white p-5" open>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                  <span>Daftar Isi</span>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--primary-softer)] text-sm font-black text-[var(--primary)] transition group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <nav className="mt-4" aria-label="Daftar isi artikel">
                  <ol className="grid gap-2 text-sm">
                    {toc.map((entry) => (
                      <li key={entry.id} className={entry.level === 3 ? "pl-4" : ""}>
                        <a className="font-semibold text-[var(--muted)] transition hover:text-[var(--primary)]" href={`#${entry.id}`}>
                          {entry.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </details>
            ) : null}

            {articleContent ? <div className="prose mt-8" dangerouslySetInnerHTML={{ __html: articleContent }} /> : null}

            <section className="mt-8 rounded-2xl bg-[var(--primary-softer)] p-5">
              <div className="flex gap-4">
                <AuthorAvatar author={author} size="lg" />
                <div>
                  <Link href={`/author/${author.slug}`} className="font-bold transition hover:text-[var(--primary)]">
                    {author.name}
                  </Link>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                    {author.bio}
                  </p>
                </div>
              </div>
            </section>

            <BlogPostActions articleId={item.id} title={item.title} url={absoluteUrl} />

            <section className="mt-8 rounded-2xl bg-[var(--primary-softer)] p-5">
              <h2 className="text-lg font-bold">Komentar disetujui</h2>
              <div className="mt-4 grid gap-4">
                {item.comments.length > 0 ? (
                  item.comments.map((comment: any) => (
                    <div key={comment.id} className="rounded-xl bg-[var(--primary-softer)] p-4">
                      <p className="font-bold">{comment.name}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(comment.createdAt))}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed">{comment.body}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--muted)]">Belum ada komentar yang disetujui.</p>
                )}
              </div>
            </section>
          </article>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
              <h2 className="text-lg font-bold">Artikel Terkait</h2>
              <div className="mt-4 grid gap-4">
                {relatedPosts.length > 0 ? (
                  relatedPosts.map((post: any) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className="group flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-2.5 transition hover:border-[var(--primary)] hover:text-[var(--primary)] active:translate-y-px"
                    >
                      {post.featuredImage ? (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          width={80}
                          height={80}
                          className="h-20 w-20 shrink-0 rounded-lg object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="h-20 w-20 shrink-0 rounded-lg bg-[var(--line)]" aria-hidden />
                      )}
                      <div className="min-w-0">
                        <p className="line-clamp-3 text-sm font-bold leading-snug group-hover:text-[var(--primary)]">{post.title}</p>
                        {post.publishedAt ? (
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(post.publishedAt))}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-[var(--muted)]">Artikel terkait akan muncul setelah ada postingan lain yang dipublikasikan.</p>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl bg-white">
              <div className="flex h-[360px] flex-col justify-between bg-gradient-to-b from-[var(--primary)] to-[var(--primary-strong)] p-6 text-white">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] opacity-80">Mulai dengan Amoechat</p>
                  <h2 className="mt-4 text-3xl font-black leading-tight">Ubah Percakapan Menjadi Pertumbuhan</h2>
                  <p className="mt-3 text-sm leading-relaxed opacity-85">Temukan paket terbaik sesuai kebutuhan rumah atau bisnis kamu.</p>
                </div>
                <Link
                  href="/paket"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-center text-sm font-black !text-[var(--primary)] transition hover:bg-white/90"
                >
                  Lihat Paket
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
