import type { Metadata } from "next";
import { getSessionRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createUser } from "@/lib/actions";
import { UserForm } from "@/components/UserForm";

export const metadata: Metadata = { title: "Tambah User Baru" };

async function handleCreate(formData: FormData): Promise<void> {
  "use server";
  await createUser(formData);
  redirect("/dashboard/users?saved=1");
}

export default async function NewUserPage() {
  const role = await getSessionRole();
  if (role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <main className="p-5 md:p-8">
      <p className="text-sm font-bold text-[var(--brand)]">CMS</p>
      <h1 className="mb-6 text-3xl font-bold">Tambah User Baru</h1>
      <UserForm action={handleCreate} />
    </main>
  );
}
