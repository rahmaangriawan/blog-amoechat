"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { Delete02Icon, Edit02Icon, Copy01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { deleteMedia } from "@/lib/actions";

export function MediaCard({
  item,
}: {
  item: {
    id: string;
    title: string;
    originalName: string;
    filePath: string;
    alt: string | null;
    isPublished: boolean;
  };
}) {
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  async function copyPath() {
    await navigator.clipboard.writeText(item.filePath);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  function handleDelete() {
    const fd = new FormData();
    fd.set("id", item.id);
    startTransition(async () => {
      await deleteMedia(fd);
      setConfirmOpen(false);
    });
  }

  return (
    <>
      <article className="panel overflow-hidden">
        <button
          type="button"
          onClick={copyPath}
          className="group relative block w-full cursor-pointer overflow-hidden bg-[var(--primary-softer)] text-left outline-none"
          aria-label={`Salin ${item.filePath}`}
          title="Klik untuk salin URL"
        >
          <img src={item.filePath} alt={item.alt || item.title} className="h-24 w-full object-cover transition duration-200 group-hover:scale-[1.02]" />
          <span className="pointer-events-none absolute inset-0 bg-black/0 transition duration-200 group-hover:bg-black/8 group-focus-visible:bg-black/8" />
          <span className="pointer-events-none absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/92 text-[var(--foreground)] opacity-0 shadow-md shadow-black/10 transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
            <HugeIcon icon={Copy01Icon} size={10} aria-hidden />
          </span>
          <span
            className={[
              "pointer-events-none absolute left-1/2 top-3 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/75 px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-white transition-all duration-200",
              copied ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1",
            ].join(" ")}
          >
            <HugeIcon icon={CheckmarkCircle01Icon} size={11} aria-hidden />
            Tersalin
          </span>
        </button>

        <div className="grid gap-2 p-2.5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="truncate text-xs font-bold text-[var(--foreground)]">{item.title}</h2>
              <span className="shrink-0 rounded-full bg-[var(--primary-softer)] px-1.5 py-0.5 text-[9px] font-black uppercase text-[var(--primary)]">
                {item.isPublished ? "Published" : "Draft"}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[10px] text-[var(--muted)]">{item.originalName}</p>
          </div>

          <div className="flex gap-1.5">
            <Link
              className="button secondary !min-h-0 !px-[10px] !py-[10px] cursor-pointer text-[12px]"
              href={`/dashboard/media/${item.id}`}
              aria-label={`Edit ${item.title}`}
            >
              <HugeIcon icon={Edit02Icon} size={11} aria-hidden />
            </Link>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="button danger !min-h-0 !px-[10px] !py-[10px] cursor-pointer text-[12px]"
              aria-label={`Hapus ${item.title}`}
            >
              <HugeIcon icon={Delete02Icon} size={11} aria-hidden />
            </button>
          </div>
        </div>
      </article>

      <ConfirmDeleteModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus media ini?"
        description={`File "${item.title}" (${item.originalName}) akan dihapus permanen dari server dan tidak bisa dikembalikan.`}
        pending={pending}
      />
    </>
  );
}
