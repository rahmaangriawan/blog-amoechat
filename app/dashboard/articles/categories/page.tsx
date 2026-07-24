import Link from "next/link";
import type { Metadata } from "next";
import { Add01Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { DeleteConfirmButton } from "@/components/DeleteConfirmButton";
import { prisma } from "@/lib/prisma";
import { deleteArticleCategory } from "@/lib/actions";
import { requireSuperAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kategori Artikel",
};

export default async function CategoriesPage() {
  await requireSuperAdminPage();
  const categories = await (prisma as any).articleCategory.findMany({
    include: { _count: { select: { articles: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <main className="p-5 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[var(--brand)]">CMS</p>
          <h1 className="text-3xl font-bold">Kategori</h1>
        </div>
        <Link className="button" href="/dashboard/articles/categories/new">
          <HugeIcon icon={Add01Icon} size={16} aria-hidden />
          Tambah
        </Link>
      </div>

      <section className="mt-6 panel overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead className="bg-[#eef3f7]">
            <tr>
              <th className="p-3">Nama</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Postingan</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {categories.map((item: any) => (
              <tr key={item.id}>
                <td className="p-3 font-semibold">{item.name}</td>
                <td className="p-3">{item.slug}</td>
                <td className="p-3">{item._count.articles}</td>
                <td className="flex gap-2 p-3">
                  <Link className="button secondary" href={`/dashboard/articles/categories/${item.id}`} aria-label={`Edit ${item.name}`}>
                    <HugeIcon icon={Edit02Icon} size={16} aria-hidden />
                  </Link>
                  <DeleteConfirmButton
                    action={deleteArticleCategory}
                    id={item.id}
                    title="Hapus kategori ini?"
                    description={`Kategori "${item.name}" akan dihapus. Postingan yang terhubung tidak akan ikut terhapus.`}
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
