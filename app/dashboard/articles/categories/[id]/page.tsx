import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCategoryForm } from "@/components/ArticleCategoryForm";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await (prisma as any).articleCategory.findUnique({ where: { id }, select: { name: true } });

  return {
    title: item ? `Edit Kategori: ${item.name}` : "Edit Kategori",
  };
}

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireSuperAdminPage();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const item = await (prisma as any).articleCategory.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <main className="p-5 md:p-8">
      <p className="text-sm font-bold text-[var(--brand)]">CMS</p>
      <h1 className="mb-6 text-3xl font-bold">Edit Kategori</h1>
      <ArticleCategoryForm item={item} saved={query.saved === "1"} />
    </main>
  );
}
