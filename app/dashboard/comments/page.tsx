import Link from "next/link";
import type { Metadata } from "next";
import { CheckmarkCircle02Icon, CancelCircleIcon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { DeleteConfirmButton } from "@/components/DeleteConfirmButton";
import { prisma } from "@/lib/prisma";
import { approveComment, deleteComment, rejectComment } from "@/lib/actions";
import { requireSuperAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Komentar",
};

const statusTabs = [
  { label: "Semua", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Disetujui", value: "APPROVED" },
  { label: "Ditolak", value: "REJECTED" },
];

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function statusLabel(status?: string, isApproved?: boolean) {
  if (status === "APPROVED" || isApproved) return "Disetujui";
  if (status === "REJECTED") return "Ditolak";
  return "Pending";
}

function statusClass(status?: string, isApproved?: boolean) {
  if (status === "APPROVED" || isApproved) return "bg-[#dcfce7] text-[#15803d]";
  if (status === "REJECTED") return "bg-[#fee2e2] text-[#b91c1c]";
  return "bg-[var(--primary-softer)] text-[var(--primary)]";
}

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireSuperAdminPage();
  const query = await searchParams;
  const selectedStatus = ["PENDING", "APPROVED", "REJECTED"].includes(query.status ?? "") ? query.status : "ALL";

  const comments = await (prisma as any).comment.findMany({
    where: selectedStatus === "ALL" ? undefined : { status: selectedStatus },
    include: {
      article: {
        select: {
          title: true,
          slug: true,
          type: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const counts = await Promise.all(
    statusTabs.map(async (tab) => ({
      ...tab,
      count:
        tab.value === "ALL"
          ? await (prisma as any).comment.count()
          : await (prisma as any).comment.count({ where: { status: tab.value } }),
    })),
  );

  return (
    <main className="p-5 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[var(--brand)]">CMS</p>
          <h1 className="text-3xl font-bold">Komentar</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Moderasi komentar artikel sebelum tampil di halaman public.</p>
        </div>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filter komentar">
        {counts.map((tab) => {
          const active = selectedStatus === tab.value;
          const href = tab.value === "ALL" ? "/dashboard/comments" : `/dashboard/comments?status=${tab.value}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={[
                "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition",
                active
                  ? "border-[var(--primary-strong)] bg-[var(--primary-strong)] !text-white"
                  : "border-[var(--line)] bg-white text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
              ].join(" ")}
            >
              {tab.label}
              <span className={active ? "!text-white/85" : "text-[var(--muted)]"}>{tab.count}</span>
            </Link>
          );
        })}
      </nav>

      <section className="mt-6 grid gap-4">
        {comments.length > 0 ? (
          comments.map((comment: any) => (
            <article key={comment.id} className="panel overflow-hidden">
              <div className="grid gap-4 p-5 lg:grid-cols-[220px_minmax(0,1fr)_220px]">
                <div>
                  <p className="font-bold text-[var(--foreground)]">{comment.name}</p>
                  <a className="mt-1 block break-all text-xs text-[var(--muted)] hover:text-[var(--primary)]" href={`mailto:${comment.email}`}>
                    {comment.email}
                  </a>
                  <p className="mt-3 text-xs text-[var(--muted)]">{formatDate(comment.createdAt)}</p>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={["rounded-full px-3 py-1 text-xs font-black", statusClass(comment.status, comment.isApproved)].join(" ")}>
                      {statusLabel(comment.status, comment.isApproved)}
                    </span>
                    {comment.article ? (
                      <Link
                        href={comment.article.type === "POST" ? `/blog/${comment.article.slug}` : `/${comment.article.slug}`}
                        target="_blank"
                        className="truncate text-sm font-bold text-[var(--primary)] hover:underline"
                      >
                        {comment.article.title}
                      </Link>
                    ) : null}
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--foreground)]">{comment.body}</p>
                </div>

                <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                  {comment.status !== "APPROVED" || !comment.isApproved ? (
                    <form action={approveComment}>
                      <input type="hidden" name="id" value={comment.id} />
                      <button className="button !min-h-10 !px-3 text-xs" type="submit">
                        <HugeIcon icon={CheckmarkCircle02Icon} size={15} aria-hidden />
                        Setujui
                      </button>
                    </form>
                  ) : null}
                  {comment.status !== "REJECTED" ? (
                    <form action={rejectComment}>
                      <input type="hidden" name="id" value={comment.id} />
                      <button className="button secondary !min-h-10 !px-3 text-xs" type="submit">
                        <HugeIcon icon={CancelCircleIcon} size={15} aria-hidden />
                        Tolak
                      </button>
                    </form>
                  ) : null}
                  <DeleteConfirmButton
                    action={deleteComment}
                    id={comment.id}
                    title="Hapus komentar ini?"
                    description={`Komentar dari "${comment.name}" akan dihapus permanen.`}
                    variant="text"
                    label="Hapus"
                    className="button danger !min-h-10 !px-3 text-xs"
                  />
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="panel p-8 text-center">
            <p className="text-lg font-bold">Belum ada komentar</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Komentar baru dari artikel akan muncul di sini.</p>
          </div>
        )}
      </section>
    </main>
  );
}
