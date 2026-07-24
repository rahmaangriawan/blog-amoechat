import Link from "next/link";
import type { Metadata } from "next";
import { Add01Icon, Edit02Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { DeleteConfirmButton } from "@/components/DeleteConfirmButton";
import { prisma } from "@/lib/prisma";
import { deleteArticle } from "@/lib/actions";
import { requireSuperAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Postingan",
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });

function formatDate(date?: Date | string | null) {
  if (!date) return "-";
  return dateFormatter.format(new Date(date));
}

function parsePositiveInt(value: string | string[] | undefined, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function firstString(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return (value ?? "").trim();
}

function buildHref(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) {
      qs.set(key, String(value));
    }
  });
  const suffix = qs.toString();
  return `/dashboard/articles/posts${suffix ? `?${suffix}` : ""}`;
}

type PostsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const SORT_OPTIONS = [
  { value: "newest", label: "Tanggal terbaru" },
  { value: "oldest", label: "Tanggal terlama" },
  { value: "title-asc", label: "Judul A-Z" },
  { value: "title-desc", label: "Judul Z-A" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Semua status" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

const ALLOWED_LIMITS = [10, 20, 50, 100];

export default async function PostsPage({ searchParams }: PostsPageProps) {
  await requireSuperAdminPage();
  const query = (await searchParams) ?? {};

  const search = firstString(query.q);
  const status = firstString(query.status);
  const sort = SORT_OPTIONS.some((option) => option.value === firstString(query.sort))
    ? firstString(query.sort)
    : "newest";
  const requestedLimit = parsePositiveInt(query.limit as string, 10);
  const limit = ALLOWED_LIMITS.includes(requestedLimit) ? requestedLimit : 10;

  const where: Record<string, unknown> = { type: "POST" };
  if (status === "published") where.isPublished = true;
  if (status === "draft") where.isPublished = false;
  if (search) {
    (where as any).OR = [
      { title: { contains: search } },
      { slug: { contains: search } },
      { excerpt: { contains: search } },
    ];
  }

  const orderBy: Record<string, "asc" | "desc"> =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "title-asc"
      ? { title: "asc" }
      : sort === "title-desc"
      ? { title: "desc" }
      : { createdAt: "desc" };

  const totalPosts = await (prisma as any).article.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalPosts / limit));
  const currentPage = Math.min(parsePositiveInt(query.page as string, 1), totalPages);
  const skip = (currentPage - 1) * limit;

  const posts = await (prisma as any).article.findMany({
    where,
    include: { category: true, author: { select: { name: true } } },
    orderBy,
    skip,
    take: limit,
  });

  const filterMeta = { q: search, status, sort } as const;
  const pageHrefBase = (page: number, overrideLimit?: number) =>
    buildHref({ ...filterMeta, limit: overrideLimit ?? limit, page });

  return (
    <main className="p-5 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[var(--brand)]">CMS</p>
          <h1 className="text-3xl font-bold">Postingan</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {totalPosts === 0
              ? search || status
                ? `Tidak ada postingan untuk filter ini.`
                : "Belum ada postingan."
              : `Menampilkan ${posts.length} dari ${totalPosts} postingan.`}
          </p>
        </div>
        <Link className="button" href="/dashboard/articles/posts/new">
          <HugeIcon icon={Add01Icon} size={16} aria-hidden />
          Tambah
        </Link>
      </div>

      <form method="GET" className="mt-6 grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-3 md:grid-cols-[1fr_180px_180px_auto] md:items-center">
        <input type="hidden" name="page" value="1" />
        <input type="hidden" name="limit" value={limit} />
        <div className="relative">
          <HugeIcon
            icon={Search01Icon}
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Cari judul, slug, excerpt"
            className="!h-11 !rounded-xl !pl-11"
          />
        </div>
        <select
          name="status"
          defaultValue={status}
          className="h-11 rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-semibold outline-none transition focus:border-[var(--primary)]"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={sort}
          className="h-11 rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-semibold outline-none transition focus:border-[var(--primary)]"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="submit" className="button h-11">
          Terapkan
        </button>
      </form>

      <section className="mt-6 panel overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-[#eef3f7]">
            <tr>
              <th className="p-3">Judul</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Author</th>
              <th className="p-3">Tanggal</th>
              <th className="p-3">Status</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-[var(--muted)]">
                  Tidak ada postingan yang cocok.
                </td>
              </tr>
            ) : null}
            {posts.map((item: any) => (
              <tr key={item.id}>
                <td className="p-3">
                  <Link
                    className="font-semibold text-[var(--foreground)] transition hover:text-[var(--primary)]"
                    href={`/dashboard/articles/posts/${item.id}`}
                  >
                    {item.title}
                  </Link>
                </td>
                <td className="p-3">{item.category?.name ?? "-"}</td>
                <td className="p-3">{item.author?.name ?? "-"}</td>
                <td className="p-3">{formatDate(item.publishedAt ?? item.createdAt)}</td>
                <td className="p-3">
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide",
                      item.isPublished
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600",
                    ].join(" ")}
                  >
                    {item.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="flex gap-2 p-3">
                  <Link className="button secondary" href={`/dashboard/articles/posts/${item.id}`} aria-label={`Edit ${item.title}`}>
                    <HugeIcon icon={Edit02Icon} size={16} aria-hidden />
                  </Link>
                  <DeleteConfirmButton
                    action={deleteArticle}
                    id={item.id}
                    extraFields={{ type: "POST" }}
                    title="Hapus postingan ini?"
                    description={`Postingan "${item.title}" akan dihapus permanen dan tidak bisa dikembalikan.`}
                    aria-label={`Hapus ${item.title}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {totalPages > 1 ? (
          <nav className="flex flex-wrap items-center gap-2" aria-label="Pagination postingan">
            <Link
              className={`grid h-9 w-9 place-items-center rounded-lg border text-sm font-bold transition ${
                currentPage === 1
                  ? "pointer-events-none border-[var(--line)] bg-white text-[var(--muted)] opacity-50"
                  : "border-[var(--line)] bg-white text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              }`}
              href={pageHrefBase(Math.max(1, currentPage - 1))}
              aria-label="Sebelumnya"
            >
              ‹
            </Link>
            <span className="text-sm font-semibold text-[var(--muted)]">
              Hal {currentPage} / {totalPages}
            </span>
            <Link
              className={`grid h-9 w-9 place-items-center rounded-lg border text-sm font-bold transition ${
                currentPage === totalPages
                  ? "pointer-events-none border-[var(--line)] bg-white text-[var(--muted)] opacity-50"
                  : "border-[var(--line)] bg-white text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              }`}
              href={pageHrefBase(Math.min(totalPages, currentPage + 1))}
              aria-label="Berikutnya"
            >
              ›
            </Link>
          </nav>
        ) : (
          <span aria-hidden />
        )}

        <div className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
          <span>Per halaman</span>
          <div className="inline-flex rounded-lg border border-[var(--line)] bg-white p-0.5">
            {ALLOWED_LIMITS.map((value) => {
              const active = value === limit;
              return (
                <Link
                  key={value}
                  href={pageHrefBase(1, value)}
                  className={[
                    "inline-flex h-8 min-w-10 items-center justify-center rounded-md px-2 text-xs font-bold transition",
                    active
                      ? "bg-[var(--primary-strong)] !text-white"
                      : "text-[var(--foreground)] hover:bg-[var(--primary-softer)] hover:text-[var(--primary)]",
                  ].join(" ")}
                >
                  {value}
                </Link>
              );
            })}
          </div>
        </div>
      </footer>
    </main>
  );
}
