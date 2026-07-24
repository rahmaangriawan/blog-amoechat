import type { Metadata } from "next";
import { ArticleForm } from "@/components/ArticleForm";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tambah Postingan",
};

export default async function NewPostPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireSuperAdminPage();
  const query = await searchParams;
  const categories = await (prisma as any).articleCategory.findMany({ orderBy: { name: "asc" } });
  const authors = await (prisma as any).user.findMany({
    where: { isAuthor: true, isActive: true },
    orderBy: [{ createdAt: "asc" }],
    select: { id: true, name: true, authorRole: true, authorAvatarUrl: true },
  });

  return (
    <main className="p-5 md:p-8">
      <p className="text-sm font-bold text-[var(--brand)]">CMS</p>
      <h1 className="mb-6 text-3xl font-bold">Tambah Postingan</h1>
      <ArticleForm type="POST" categories={categories} authors={authors} error={query.error} />
    </main>
  );
}
