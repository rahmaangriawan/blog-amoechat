"use client";

import type { Media } from "@prisma/client";
import { useEffect, useState } from "react";
import { Cancel01Icon, Image01Icon, SaveIcon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { saveMedia } from "@/lib/actions";

type ToastState = {
  visible: boolean;
  message: string;
};

export function MediaForm({ item }: { item?: Media | null }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: "" });

  useEffect(() => {
    if (!toast.visible) return;

    const timeout = setTimeout(() => setToast({ visible: false, message: "" }), 2600);
    return () => clearTimeout(timeout);
  }, [toast.visible]);

  return (
    <>
      {toast.visible ? (
        <div className="fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-bold text-white shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
          {toast.message}
        </div>
      ) : null}

      <form
        action={async (formData) => {
          setIsSubmitting(true);
          try {
            await saveMedia(formData);
            setToast({
              visible: true,
              message: item ? "Media berhasil diperbarui." : "Media berhasil diupload.",
            });
          } finally {
            setIsSubmitting(false);
          }
        }}
        className="panel grid gap-4 p-5"
      >
        {item ? <input type="hidden" name="id" value={item.id} /> : null}
        {item ? <input type="hidden" name="currentFilePath" value={item.filePath} /> : null}

        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <label className="grid gap-2 text-sm font-semibold">
            Judul media
            <input name="title" defaultValue={item?.title} required />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Alt text
            <input name="alt" defaultValue={item?.alt ?? ""} placeholder="Opsional" />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-semibold">
          Upload gambar
          <input name="image" type="file" accept="image/*" required={!item} />
          <span className="text-xs font-medium text-[var(--muted)]">
            Format yang didukung: JPG, PNG, WEBP, GIF, AVIF. Nama file disimpan dari nama asli yang disanitasi.
          </span>
        </label>

        {item ? (
          <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--primary-softer)] p-4 md:grid-cols-[140px_1fr] md:items-start">
            <img src={item.filePath} alt={item.alt || item.title} className="h-32 w-full rounded-xl object-contain bg-white" />
            <div className="grid gap-1 text-sm">
              <p className="font-black text-[var(--foreground)]">{item.originalName}</p>
              <p className="text-[var(--muted)]">{item.filePath}</p>
              <p className="text-[var(--muted)]">{Math.round(item.fileSize / 1024)} KB</p>
            </div>
          </div>
        ) : null}

        <label className="inline-flex w-fit items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold">
          <input className="!h-4 !w-4 accent-[var(--primary)]" type="checkbox" name="isPublished" defaultChecked={item?.isPublished ?? true} />
          <span>Publish media</span>
        </label>

        <button className="button w-fit disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={isSubmitting}>
          <HugeIcon icon={isSubmitting ? Cancel01Icon : item ? SaveIcon : Image01Icon} size={16} aria-hidden />
          {isSubmitting ? "Menyimpan..." : item ? "Perbarui" : "Upload"}
        </button>
      </form>
    </>
  );
}
