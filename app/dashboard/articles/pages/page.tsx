import Link from "next/link";
import type { Metadata } from "next";
import { Add01Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { DeleteConfirmButton } from "@/components/DeleteConfirmButton";
import { prisma } from "@/lib/prisma";
import { deleteArticle } from "@/lib/actions";
import { requireSuperAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Halaman",
};

function formatDate(date?: Date | string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
}

export default async function PagesPage() {
  await requireSuperAdminPage();
  const pages = await (prisma as any).article.findMany({
    where: { type: "PAGE" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="p-5 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[var(--brand)]">CMS</p>
          <h1 className="text-3xl font-bold">Halaman</h1>
        </div>
        <Link className="button" href="/dashboard/articles/pages/new">
          <HugeIcon icon={Add01Icon} size={16} aria-hidden />
          Tambah
        </Link>
      </div>

      <section className="mt-6 panel overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead className="bg-[#eef3f7]">
            <tr>
              <th className="p-3">Judul</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Tanggal</th>
              <th className="p-3">Status</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {pages.map((item: any) => (
              <tr key={item.id}>
                <td className="p-3 font-semibold">{item.title}</td>
                <td className="p-3">{item.slug}</td>
                <td className="p-3">{formatDate(item.publishedAt)}</td>
                <td className="p-3">{item.isPublished ? "Published" : "Draft"}</td>
                <td className="flex gap-2 p-3">
                  <Link className="button secondary" href={`/dashboard/articles/pages/${item.id}`} aria-label={`Edit ${item.title}`}>
                    <HugeIcon icon={Edit02Icon} size={16} aria-hidden />
                  </Link>
                  <DeleteConfirmButton
                    action={deleteArticle}
                    id={item.id}
                    extraFields={{ type: "PAGE" }}
                    title="Hapus halaman ini?"
                    description={`Halaman "${item.title}" akan dihapus permanen dan tidak bisa dikembalikan.`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
