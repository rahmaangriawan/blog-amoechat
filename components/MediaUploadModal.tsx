"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Cancel01Icon, CheckmarkCircle02Icon, CloudUploadIcon, Image01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { RadialSpinner } from "@/components/RadialSpinner";

export function MediaUploadModal() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function resetFormState() {
    setSelectedFileName("");
    setProgress(0);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    formRef.current?.reset();
  }

  function closeModal() {
    if (isSubmitting) return; // jangan tutup saat upload
    setOpen(false);
    setIsDragging(false);
    resetFormState();
  }

  function openModal() {
    resetFormState();
    setOpen(true);
  }

  function handleFile(file: File | null | undefined) {
    if (!file) return;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    if (inputRef.current) {
      inputRef.current.files = dataTransfer.files;
    }
    if (titleRef.current && !titleRef.current.value.trim()) {
      titleRef.current.value = file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
    setSelectedFileName(file.name);
    setError("");
    window.requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("image");
    if (!(file instanceof File) || file.size === 0) {
      setError("Pilih gambar terlebih dahulu.");
      return;
    }
    if (!String(fd.get("title") || "").trim()) {
      setError("Judul media wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setProgress(0);
    setError("");

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/media", true);

    xhr.upload.addEventListener("progress", (ev) => {
      if (ev.lengthComputable) {
        const pct = Math.round((ev.loaded / ev.total) * 100);
        setProgress(pct);
      }
    });

    xhr.addEventListener("load", () => {
      setIsSubmitting(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100);
        setSuccess(true);
        window.setTimeout(() => {
          setOpen(false);
          setIsDragging(false);
          setSuccess(false);
          resetFormState();
          router.refresh();
        }, 300);
      } else {
        let message = "Upload gagal.";
        try {
          const body = JSON.parse(xhr.responseText);
          message = body?.error || body?.message || message;
        } catch {
          // ignore
        }
        setError(message);
      }
    });

    xhr.addEventListener("error", () => {
      setIsSubmitting(false);
      setError("Koneksi terputus saat upload.");
    });

    xhr.addEventListener("abort", () => {
      setIsSubmitting(false);
      setError("Upload dibatalkan.");
    });

    xhr.send(fd);
  }

  return (
    <>
      <button className="button h-9 px-3 text-xs" type="button" onClick={openModal}>
        <HugeIcon icon={PlusSignIcon} size={14} aria-hidden />
        Tambah Media
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={closeModal} role="dialog" aria-modal="true">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Loading overlay */}
            {isSubmitting || success ? (
              <div className="absolute inset-0 z-10 grid place-items-center rounded-3xl bg-white/95 backdrop-blur-sm">
                <div className="grid w-full max-w-xs place-items-center gap-3 px-6 text-center">
                  {success ? (
                    <HugeIcon icon={CheckmarkCircle02Icon} size={48} className="text-[var(--primary)]" aria-hidden />
                  ) : (
                    <RadialSpinner size={44} className="text-[var(--primary)]" />
                  )}
                  <p className="text-sm font-black text-[var(--foreground)]">
                    {success ? "Upload berhasil!" : "Mengupload gambar..."}
                  </p>
                  {!success && (
                    <>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--line)]">
                        <div
                          className="h-full bg-[var(--primary)] transition-all"
                          style={{ width: `${progress}%` }}
                          aria-hidden
                        />
                      </div>
                      <p className="text-xs font-semibold text-[var(--muted)]">
                        {progress < 100 ? `${progress}% • ` : ""}Jangan tutup halaman ini.
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[var(--brand)]">Upload media</p>
                <h2 className="text-2xl font-black text-[var(--foreground)]">Tambah Gambar</h2>
              </div>
              <button type="button" onClick={closeModal} disabled={isSubmitting} className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] text-[var(--foreground)] transition hover:bg-[var(--primary-softer)] disabled:opacity-50">
                <HugeIcon icon={Cancel01Icon} size={16} aria-hidden />
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <div
                className={[
                  "grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed p-6 text-center transition",
                  isDragging ? "border-[var(--primary)] bg-[var(--primary-softer)]" : "border-[var(--line)] bg-white hover:border-[var(--primary)] hover:bg-[var(--primary-softer)]",
                ].join(" ")}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  handleFile(event.dataTransfer.files?.[0]);
                }}
                onClick={() => !isSubmitting && inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  name="image"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleFile(event.target.files?.[0])}
                  disabled={isSubmitting}
                />
                <HugeIcon icon={CloudUploadIcon} size={28} className="text-[var(--primary)]" aria-hidden />
                <p className="mt-3 text-base font-black text-[var(--foreground)]">Drag & drop gambar ke sini</p>
                <p className="mt-1 text-sm text-[var(--muted)]">atau klik area ini untuk pilih file</p>
                {selectedFileName ? <p className="mt-3 text-sm font-semibold text-[var(--primary)]">{selectedFileName}</p> : null}
              </div>

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              ) : null}

              <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
                <label className="grid gap-2 text-sm font-semibold">
                  Judul media
                  <input ref={titleRef} name="title" placeholder="Judul gambar" required disabled={isSubmitting} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Alt text
                  <input name="alt" placeholder="Opsional" disabled={isSubmitting} />
                </label>
              </div>

              <label className="inline-flex w-fit items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold">
                <input className="!h-4 !w-4 accent-[var(--primary)]" type="checkbox" name="isPublished" defaultChecked disabled={isSubmitting} />
                <span>Publish media</span>
              </label>

              <button className="button h-10 w-full justify-center px-4 text-sm disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={isSubmitting}>
                <HugeIcon icon={Image01Icon} size={15} aria-hidden />
                {isSubmitting ? `Mengupload... ${progress}%` : "Simpan Media"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
