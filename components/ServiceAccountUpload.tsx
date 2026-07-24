"use client";

import { useRef, useState } from "react";
import { CheckmarkCircle02Icon, FileCodeIcon, Upload04Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";

type ServiceAccountUploadProps = {
  connectedEmail?: string;
  storedFileName?: string;
  updatedAt?: string;
};

export function ServiceAccountUpload({
  connectedEmail,
  storedFileName,
  updatedAt,
}: ServiceAccountUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <div className="md:col-span-2">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[var(--foreground)]">Service Account JSON</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            File disimpan terenkripsi di database. Isi credential tidak pernah ditampilkan kembali.
          </p>
        </div>
        {connectedEmail ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-softer)] px-3 py-1 text-xs font-bold text-[var(--primary-strong)]">
            <HugeIcon icon={CheckmarkCircle02Icon} size={14} aria-hidden />
            Terhubung
          </span>
        ) : null}
      </div>

      <input
        ref={inputRef}
        name="GOOGLE_SERVICE_ACCOUNT_JSON_FILE"
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group flex w-full items-center gap-4 rounded-xl border border-dashed border-[var(--line)] bg-white p-4 text-left transition hover:border-[var(--primary)] hover:bg-[var(--primary-softer)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 active:scale-[0.995]"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--primary-softer)] text-[var(--primary-strong)]">
          <HugeIcon icon={selectedFile ? FileCodeIcon : Upload04Icon} size={21} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-[var(--foreground)]">
            {selectedFile?.name || storedFileName || "Pilih file Service Account"}
          </span>
          <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
            {selectedFile
              ? `${Math.max(1, Math.ceil(selectedFile.size / 1024))} KB · siap disimpan`
              : storedFileName
                ? "Credential tersimpan. Pilih file baru hanya untuk menggantinya."
                : "Klik untuk memilih file JSON dari Google Cloud."}
          </span>
        </span>
        <span className="shrink-0 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs font-bold text-[var(--primary-strong)] transition group-hover:border-[var(--primary)]">
          {storedFileName ? "Ganti file" : "Pilih file"}
        </span>
      </button>

      <div className="mt-3 grid gap-2 rounded-xl bg-[var(--background)] p-3 text-xs sm:grid-cols-2">
        <p className="min-w-0 text-[var(--muted)]">
          Akun: <strong className="break-all text-[var(--foreground)]">{connectedEmail || "Belum terhubung"}</strong>
        </p>
        <p className="text-[var(--muted)] sm:text-right">
          Diperbarui: <strong className="text-[var(--foreground)]">{updatedAt || "Belum pernah"}</strong>
        </p>
      </div>
    </div>
  );
}
