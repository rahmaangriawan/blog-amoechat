import type { Metadata } from "next";
import Link from "next/link";
import { Image01Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { MediaCard } from "@/components/MediaCard";
import { MediaDropZone } from "@/components/MediaDropZone";
import { MediaUploadModal } from "@/components/MediaUploadModal";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kelola Media",
};

const PER_PAGE = 24;

export default async function DashboardMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireSuperAdminPage();

  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page) || 1);
  const skip = (currentPage - 1) * PER_PAGE;

  const [media, total] = await Promise.all([
    prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: PER_PAGE,
    }),
    prisma.media.count(),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <MediaDropZone>
      <main className="p-5 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[var(--brand)]">Panel</p>
            <h1 className="text-3xl font-bold">Media</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Kelola gambar yang diupload ke server. ({total} file)
            </p>
          </div>
          <MediaUploadModal />
        </div>

        {media.length === 0 && currentPage === 1 ? (
          <section className="panel mt-6 p-10 text-center">
            <HugeIcon icon={Image01Icon} size={28} className="mx-auto text-[var(--primary)]" aria-hidden />
            <p className="mt-3 text-lg font-bold text-[var(--foreground)]">Belum ada media</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Upload gambar pertama untuk mulai mengelola asset server.</p>
          </section>
        ) : (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
              {media.map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </section>

            {totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
                {currentPage > 1 ? (
                  <Link
                    href={`/dashboard/media?page=${currentPage - 1}`}
                    className="inline-flex h-10 items-center rounded-lg border border-[var(--line)] bg-white px-4 text-sm font-bold transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    ← Sebelumnya
                  </Link>
                ) : (
                  <span className="inline-flex h-10 cursor-not-allowed items-center rounded-lg border border-[var(--line)] bg-slate-50 px-4 text-sm font-bold text-slate-400">
                    ← Sebelumnya
                  </span>
                )}

                <span className="text-sm font-bold text-[var(--muted)]">
                  Halaman {currentPage} dari {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link
                    href={`/dashboard/media?page=${currentPage + 1}`}
                    className="inline-flex h-10 items-center rounded-lg border border-[var(--line)] bg-white px-4 text-sm font-bold transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    Selanjutnya →
                  </Link>
                ) : (
                  <span className="inline-flex h-10 cursor-not-allowed items-center rounded-lg border border-[var(--line)] bg-slate-50 px-4 text-sm font-bold text-slate-400">
                    Selanjutnya →
                  </span>
                )}
              </nav>
            )}
          </>
        )}
      </main>
    </MediaDropZone>
  );
}
