import type { Metadata } from "next";
import { ArticleCategoryForm } from "@/components/ArticleCategoryForm";
import { requireSuperAdminPage } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Tambah Kategori",
};

export default async function NewCategoryPage() {
  await requireSuperAdminPage();
  return (
    <main className="p-5 md:p-8">
      <p className="text-sm font-bold text-[var(--brand)]">CMS</p>
      <h1 className="mb-6 text-3xl font-bold">Tambah Kategori</h1>
      <ArticleCategoryForm />
    </main>
  );
}
