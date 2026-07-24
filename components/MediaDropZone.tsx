"use client";

import { type ReactNode, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload01Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";

type UploadState = {
  active: boolean;
  uploading: boolean;
  message: string;
  error: string;
};

function imageFilesFromDrop(dataTransfer: DataTransfer) {
  return Array.from(dataTransfer.files).filter((file) => file.type.startsWith("image/"));
}

function titleFromFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

export function MediaDropZone({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dragDepth = useRef(0);
  const [state, setState] = useState<UploadState>({
    active: false,
    uploading: false,
    message: "",
    error: "",
  });

  function resetDrag() {
    dragDepth.current = 0;
    setState((value) => ({ ...value, active: false }));
  }

  async function uploadFiles(files: File[]) {
    setState({
      active: false,
      uploading: true,
      message: `Mengupload ${files.length} gambar...`,
      error: "",
    });

    let uploaded = 0;
    const errors: string[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("title", titleFromFileName(file.name));

      try {
        const response = await fetch("/api/media", {
          method: "POST",
          body: formData,
        });
        const body = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(body?.message || `Gagal upload ${file.name}.`);
        }

        uploaded += 1;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `Gagal upload ${file.name}.`);
      }
    }

    router.refresh();

    setState({
      active: false,
      uploading: false,
      message: uploaded > 0 ? `${uploaded} gambar berhasil diupload.` : "",
      error: errors[0] || "",
    });

    window.setTimeout(() => {
      setState((value) => ({ ...value, message: "", error: "" }));
    }, 3200);
  }

  return (
    <div
      className="relative min-h-screen"
      onDragEnter={(event) => {
        if (!Array.from(event.dataTransfer.types).includes("Files")) return;
        event.preventDefault();
        dragDepth.current += 1;
        setState((value) => ({ ...value, active: true, error: "" }));
      }}
      onDragOver={(event) => {
        if (!Array.from(event.dataTransfer.types).includes("Files")) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        if (!Array.from(event.dataTransfer.types).includes("Files")) return;
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) {
          setState((value) => ({ ...value, active: false }));
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        const files = imageFilesFromDrop(event.dataTransfer);
        resetDrag();

        if (files.length === 0) {
          setState((value) => ({ ...value, error: "File yang didrop harus berupa gambar." }));
          window.setTimeout(() => setState((value) => ({ ...value, error: "" })), 2800);
          return;
        }

        void uploadFiles(files);
      }}
    >
      {children}

      {state.active ? (
        <div className="pointer-events-none fixed inset-0 z-[9999] grid place-items-center bg-white/70 p-6 backdrop-blur-sm">
          <div className="grid w-full max-w-lg place-items-center rounded-[20px] border-2 border-dashed border-[var(--primary)] bg-white p-8 text-center shadow-[0_24px_70px_rgba(8,8,8,0.18)]">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--primary-softer)] text-[var(--primary)]">
              <HugeIcon icon={ImageUpload01Icon} size={26} aria-hidden />
            </span>
            <p className="mt-4 text-xl font-black text-[var(--foreground)]">Drop gambar untuk upload</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Lepaskan file di area ini. Bisa upload beberapa gambar sekaligus.</p>
          </div>
        </div>
      ) : null}

      {state.uploading || state.message || state.error ? (
        <div className="fixed left-1/2 top-5 z-[10000] w-[min(92vw,420px)] -translate-x-1/2">
          <div
            className={[
              "rounded-2xl px-4 py-3 text-sm font-bold shadow-[0_18px_50px_rgba(0,0,0,0.18)]",
              state.error ? "bg-red-600 text-white" : "bg-[var(--foreground)] text-white",
            ].join(" ")}
          >
            {state.error || state.message || "Mengupload gambar..."}
          </div>
        </div>
      ) : null}
    </div>
  );
}
