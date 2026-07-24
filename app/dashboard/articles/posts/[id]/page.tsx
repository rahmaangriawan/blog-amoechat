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
    title: item ? `Edit Postingan: ${item.title}` : "Edit Postingan",
  };
}

export default async function EditPostPage({
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
  const categories = await (prisma as any).articleCategory.findMany({ orderBy: { name: "asc" } });
  const authors = await (prisma as any).user.findMany({
    where: { isAuthor: true, isActive: true },
    orderBy: [{ createdAt: "asc" }],
    select: { id: true, name: true, authorRole: true, authorAvatarUrl: true },
  });
  if (!item) notFound();

  return (
    <main className="p-5 md:p-8">
      <p className="text-sm font-bold text-[var(--brand)]">CMS</p>
      <h1 className="mb-6 text-3xl font-bold">Edit Postingan</h1>
      <ArticleForm item={item} type="POST" categories={categories} authors={authors} saved={query.saved === "1"} error={query.error} />
    </main>
  );
}
