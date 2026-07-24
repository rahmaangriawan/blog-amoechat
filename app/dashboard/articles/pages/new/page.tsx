import type { Metadata } from "next";
import { ArticleForm } from "@/components/ArticleForm";
import { requireSuperAdminPage } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Tambah Halaman",
};

export default async function NewPagePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireSuperAdminPage();
  const query = await searchParams;
  return (
    <main className="p-5 md:p-8">
      <p className="text-sm font-bold text-[var(--brand)]">CMS</p>
      <h1 className="mb-6 text-3xl font-bold">Tambah Halaman</h1>
      <ArticleForm type="PAGE" error={query.error} />
    </main>
  );
}
