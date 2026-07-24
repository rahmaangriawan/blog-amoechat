import type { Metadata } from "next";
import { MediaForm } from "@/components/MediaForm";
import { requireSuperAdminPage } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Tambah Media",
};

export default async function NewMediaPage() {
  await requireSuperAdminPage();
  return (
    <main className="p-5 md:p-8">
      <p className="text-sm font-bold text-[var(--brand)]">CMS</p>
      <h1 className="mb-6 text-3xl font-bold">Tambah Media</h1>
      <MediaForm />
    </main>
  );
}
