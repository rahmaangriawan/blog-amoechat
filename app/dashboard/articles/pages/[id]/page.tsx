import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/ArticleForm";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await (prisma as any).article.findUnique({ where: { id }, select: { title: true } });

  return {
    title: item ? `Edit Halaman: ${item.title}` : "Edit Halaman",
  };
}

export default async function EditPagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireSuperAdminPage();
  const { id } = await params;
  const query = await searchParams;
  const item = await (prisma as any).article.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <main className="p-5 md:p-8">
      <p className="text-sm font-bold text-[var(--brand)]">CMS</p>
      <h1 className="mb-6 text-3xl font-bold">Edit Halaman</h1>
      <ArticleForm item={item} type="PAGE" saved={query.saved === "1"} error={query.error} />
    </main>
  );
}
