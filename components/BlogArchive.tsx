import Link from "next/link";
import type { BlogArchivePage } from "@/lib/blog-archive";

function stripHtml(value?: string | null) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(date?: Date | string | null) {
  return date ? dateFormatter.format(new Date(date)) : null;
}

function pageHref(page: number) {
  return page <= 1 ? "/blog" : `/blog/page/${page}`;
}

function visiblePageNumbers(currentPage: number, totalPages: number) {
  const values = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return [...values].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
}

export function BlogArchive({ archive }: { archive: BlogArchivePage }) {
  const { posts, page, totalPages } = archive;

  return (
    <main className="container py-12 section-mobile-padding">
      <header className="max-w-3xl">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--primary)]">Blog Amoechat</p>
        <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
          Strategi WhatsApp untuk bisnis yang ingin bertumbuh{page > 1 ? ` — Halaman ${page}` : ""}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">
          Pelajari campaign, automation, layanan pelanggan, template Meta, dan integrasi API melalui panduan yang praktis.
        </p>
      </header>

      <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Daftar artikel">
        {posts.map((post, index) => {
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
                  loading={page === 1 && index === 0 ? "eager" : "lazy"}
                  fetchPriority={page === 1 && index === 0 ? "high" : "auto"}
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

      {totalPages > 1 ? (
        <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Navigasi halaman blog">
          {page > 1 ? <Link href={pageHref(page - 1)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--line)] bg-white px-4 font-black">Sebelumnya</Link> : null}
          {visiblePageNumbers(page, totalPages).map((pageNumber, index, numbers) => (
            <span key={pageNumber} className="contents">
              {index > 0 && pageNumber - numbers[index - 1] > 1 ? <span className="px-1 text-[var(--muted)]">…</span> : null}
              <Link
                href={pageHref(pageNumber)}
                aria-current={pageNumber === page ? "page" : undefined}
                className={[
                  "grid h-11 min-w-11 place-items-center rounded-xl border px-3 font-black",
                  pageNumber === page
                    ? "border-[var(--primary-strong)] bg-[var(--primary-strong)] !text-white"
                    : "border-[var(--line)] bg-white",
                ].join(" ")}
              >
                {pageNumber}
              </Link>
            </span>
          ))}
          {page < totalPages ? <Link href={pageHref(page + 1)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--line)] bg-white px-4 font-black">Berikutnya</Link> : null}
        </nav>
      ) : null}
    </main>
  );
}
