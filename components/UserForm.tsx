"use client";

import { useActionState } from "react";

type UserFormProps = {
  item?: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    isAuthor?: boolean;
    authorRole?: string | null;
    authorBio?: string | null;
    authorAvatarUrl?: string | null;
  };
  action: (formData: FormData) => Promise<void>;
  saved?: boolean;
};

export function UserForm({ item, action, saved }: UserFormProps) {
  const isEdit = !!item;

  return (
    <div className="max-w-xl">
      {saved && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          ✓ User berhasil disimpan.
        </div>
      )}

      <form action={action} className="grid gap-5">
        {item && <input type="hidden" name="id" value={item.id} />}

        <label className="grid gap-2 text-sm font-bold">
          Nama Lengkap
          <input name="name" defaultValue={item?.name} placeholder="contoh: Budi Santoso" required />
        </label>

        <label className="grid gap-2 text-sm font-bold">
          Email
          <input name="email" type="email" defaultValue={item?.email} placeholder="budi@amoechat.com" required />
        </label>

        <label className="grid gap-2 text-sm font-bold">
          {isEdit ? "Password Baru (kosongkan jika tidak diubah)" : "Password (min. 8 karakter)"}
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            {...(!isEdit && { required: true })}
          />
        </label>

        <label className="grid gap-2 text-sm font-bold">
          Role
          <select name="role" defaultValue={item?.role ?? "MEMBER"}>
            <option value="MEMBER">Member: Akses terbatas</option>
            <option value="MARKETING">Marketing: Operasional konten</option>
            <option value="ADMIN">Admin: Operasional CMS</option>
            <option value="SUPER_ADMIN">Super Admin: Akses penuh</option>
          </select>
        </label>

        {isEdit && (
          <label className="grid gap-2 text-sm font-bold">
            Status Akun
            <select name="isActive" defaultValue={String(item?.isActive ?? true)}>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </label>
        )}

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--primary-softer)] p-4">
          <label className="flex items-center gap-3 text-sm font-bold">
            <input
              type="checkbox"
              name="isAuthor"
              value="true"
              defaultChecked={item?.isAuthor ?? false}
              className="!h-4 !w-4 accent-[var(--primary)]"
            />
            Tandai sebagai author publik
          </label>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            Jika aktif, akun ini akan muncul di halaman author publik dan bisa dipilih sebagai penulis artikel.
          </p>

          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm font-bold">
              Role author publik
              <input
                name="authorRole"
                defaultValue={item?.authorRole ?? "Penulis Amoechat"}
                placeholder="Penulis Amoechat"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold">
              URL avatar author
              <input
                name="authorAvatarUrl"
                defaultValue={item?.authorAvatarUrl ?? ""}
                placeholder="/images/author-riska.webp atau https://..."
              />
              <span className="text-xs font-normal leading-5 text-[var(--muted)]">
                Kosongkan jika ingin avatar otomatis memakai inisial nama.
              </span>
            </label>

            <label className="grid gap-2 text-sm font-bold">
              Bio author
              <textarea
                name="authorBio"
                rows={4}
                defaultValue={item?.authorBio ?? "Penulis Amoechat yang membahas WhatsApp marketing, automation, customer engagement, dan integrasi API untuk bisnis."}
                placeholder="Bio singkat penulis"
              />
            </label>
          </div>
        </div>

        <div className="mt-2 flex gap-3">
          <button type="submit" className="button">
            {isEdit ? "Simpan Perubahan" : "Buat User"}
          </button>
          <a href="/dashboard/users" className="button secondary">
            Batal
          </a>
        </div>
      </form>
    </div>
  );
}
