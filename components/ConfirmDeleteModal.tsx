"use client";

import { useEffect } from "react";
import { AlertCircleIcon, Cancel01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";

type ConfirmDeleteModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  pending?: boolean;
};

export function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  title = "Hapus item ini?",
  description = "Tindakan ini tidak dapat dibatalkan.",
  confirmLabel = "Ya, Hapus",
  pending = false,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, pending, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(8,8,8,0.22)]">
        {/* Header merah */}
        <div className="flex items-center gap-3 bg-red-50 px-5 py-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
            <HugeIcon icon={AlertCircleIcon} size={20} aria-hidden />
          </span>
          <h2 className="flex-1 text-base font-black text-red-700">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-red-200 text-red-500 transition hover:bg-red-100 disabled:opacity-50"
            aria-label="Tutup"
          >
            <HugeIcon icon={Cancel01Icon} size={16} aria-hidden />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <p className="text-sm leading-6 text-[var(--muted)]">{description}</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--line)] text-sm font-black text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-black !text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <HugeIcon icon={Delete02Icon} size={15} aria-hidden />
              {pending ? "Menghapus..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
