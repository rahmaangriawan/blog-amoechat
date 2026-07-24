"use client";

import { useTransition, useState } from "react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";

type DeleteConfirmButtonProps = {
  /** Server action yang menerima FormData dengan field "id" (dan opsional "type") */
  action: (formData: FormData) => Promise<unknown>;
  id: string;
  /** Extra hidden fields selain id */
  extraFields?: Record<string, string>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  /** Tampilan tombol: "icon" = hanya ikon, "text" = ikon + teks */
  variant?: "icon" | "text";
  label?: string;
  className?: string;
};

export function DeleteConfirmButton({
  action,
  id,
  extraFields,
  title = "Hapus item ini?",
  description = "Tindakan ini tidak dapat dibatalkan.",
  confirmLabel = "Ya, Hapus",
  variant = "icon",
  label = "Hapus",
  className,
}: DeleteConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    const fd = new FormData();
    fd.set("id", id);
    if (extraFields) {
      Object.entries(extraFields).forEach(([key, value]) => fd.set(key, value));
    }
    startTransition(async () => {
      await action(fd);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "button danger"}
        aria-label={label}
      >
        <HugeIcon icon={Delete02Icon} size={16} aria-hidden />
        {variant === "text" ? <span>{label}</span> : null}
      </button>

      <ConfirmDeleteModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        pending={pending}
      />
    </>
  );
}
