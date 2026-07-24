import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";
import { updateUser } from "@/lib/actions";
import { UserForm } from "@/components/UserForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  let name = "Edit User";
  try {
    const user = await (prisma as any).user.findUnique({ where: { id }, select: { name: true } });
    if (user?.name) name = `Edit: ${user.name}`;
  } catch { /* empty */ }
  return { title: name };
}

export default async function EditUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const role = await getSessionRole();
  if (role !== "SUPER_ADMIN") redirect("/dashboard");

  const { id } = await params;
  const query = await searchParams;

  let user = null;
  try {
    user = await (prisma as any).user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isAuthor: true,
        authorRole: true,
        authorBio: true,
        authorAvatarUrl: true,
      },
    });
  } catch { /* empty */ }

  if (!user) notFound();

  async function handleUpdate(formData: FormData): Promise<void> {
    "use server";
    await updateUser(formData);
    redirect(`/dashboard/users/${id}?saved=1`);
  }

  return (
    <main className="p-5 md:p-8">
      <p className="text-sm font-bold text-[var(--brand)]">CMS</p>
      <h1 className="mb-6 text-3xl font-bold">Edit User</h1>
      <UserForm item={user} action={handleUpdate} saved={query.saved === "1"} />
    </main>
  );
}
