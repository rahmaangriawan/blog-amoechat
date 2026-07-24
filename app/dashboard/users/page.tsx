import type { Metadata } from "next";
import Link from "next/link";
import { getSessionRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteUser } from "@/lib/actions";
import { Add01Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { DeleteConfirmButton } from "@/components/DeleteConfirmButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Kelola User" };

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isAuthor: boolean;
  authorSlug: string | null;
  createdAt: Date;
};

async function handleDeleteUser(formData: FormData): Promise<void> {
  "use server";
  await deleteUser(formData);
}

export default async function UsersPage() {
  const role = await getSessionRole();
  if (role !== "SUPER_ADMIN") redirect("/dashboard");

  let users: User[] = [];
  try {
    users = await (prisma as any).user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, isActive: true, isAuthor: true, authorSlug: true, createdAt: true },
    });
  } catch {
    // Tabel belum ada — jalankan migrate deploy di server terlebih dahulu
  }

  return (
    <main className="p-5 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[var(--brand)]">CMS</p>
          <h1 className="text-3xl font-bold">Kelola User</h1>
        </div>
        <Link className="button" href="/dashboard/users/new">
          <HugeIcon icon={Add01Icon} size={16} aria-hidden />
          Tambah User
        </Link>
      </div>

      <section className="mt-6 panel overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="bg-[#eef3f7]">
            <tr>
              <th className="p-3">Nama</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Author</th>
              <th className="p-3">Status</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[var(--muted)]">
                  Belum ada user. Jalankan seed untuk membuat akun pertama.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id}>
                <td className="p-3 font-semibold">{user.name}</td>
                <td className="p-3 text-[var(--muted)]">{user.email}</td>
                <td className="p-3">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${
                    user.role === "SUPER_ADMIN"
                      ? "bg-[var(--primary-softer)] text-[var(--primary)]"
                      : "bg-[#eef3f7] text-[var(--muted)]"
                  }`}>
                    {user.role === "SUPER_ADMIN" ? "Super Admin" : "Member"}
                  </span>
                </td>
                <td className="p-3">
                  {user.isAuthor ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-700">
                      Publik
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#eef3f7] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[var(--muted)]">
                      Non-author
                    </span>
                  )}
                  {user.isAuthor && user.authorSlug ? (
                    <p className="mt-1 text-xs text-[var(--muted)]">{user.authorSlug}</p>
                  ) : null}
                </td>
                <td className="p-3">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${
                    user.isActive
                      ? "bg-green-50 text-green-700"
                      : "bg-[#eef3f7] text-[var(--muted)]"
                  }`}>
                    {user.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="flex gap-2 p-3">
                  <Link
                    className="button secondary"
                    href={`/dashboard/users/${user.id}`}
                    aria-label={`Edit ${user.name}`}
                  >
                    <HugeIcon icon={Edit02Icon} size={16} aria-hidden />
                  </Link>
                  <DeleteConfirmButton
                    action={deleteUser}
                    id={user.id}
                    title="Hapus user ini?"
                    description={`Akun "${user.name}" (${user.email}) akan dihapus permanen. Pastikan bukan akun yang sedang aktif.`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
