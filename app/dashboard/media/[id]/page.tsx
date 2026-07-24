import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MediaForm } from "@/components/MediaForm";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await prisma.media.findUnique({ where: { id }, select: { title: true } });

  return {
    title: item ? `Edit Media: ${item.title}` : "Edit Media",
  };
}

export default async function EditMediaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdminPage();
  const { id } = await params;
  const item = await prisma.media.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <main className="p-5 md:p-8">
      <p className="text-sm font-bold text-[var(--brand)]">CMS</p>
      <h1 className="mb-6 text-3xl font-bold">Edit Media</h1>
      <MediaForm item={item} />
    </main>
  );
}
