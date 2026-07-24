"use client";

import { useEffect, useState } from "react";
import { Cancel01Icon, ArrowLeft02Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";

const PHOTOS = Array.from({ length: 35 }, (_, i) => ({
  src: `/images/Galeri-Kegiatan-${i + 1}.webp`,
  alt: `Kegiatan magang Amoechat ${i + 1}`,
}));

const INITIAL_COUNT = 8;

export function MagangGallery() {
  const [showAll, setShowAll] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const visible = showAll ? PHOTOS : PHOTOS.slice(0, INITIAL_COUNT);

  // Keyboard navigation
  useEffect(() => {
    if (lightbox === null) return;
    const maxIndex = visible.length - 1;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowRight") setLightbox((prev) => prev !== null ? (prev + 1 > maxIndex ? 0 : prev + 1) : null);
      if (event.key === "ArrowLeft") setLightbox((prev) => prev !== null ? (prev - 1 < 0 ? maxIndex : prev - 1) : null);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [lightbox, visible.length]);

  // Lock scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightbox !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  return (
    <>
      {/* Grid 2 kolom mobile, 4 kolom desktop, rasio 16/9 */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {visible.map((photo, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightbox(i)}
            className="group relative block w-full overflow-hidden rounded-xl bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            aria-label={`Lihat ${photo.alt}`}
          >
            <div className="aspect-video w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.alt}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90"
                loading="lazy"
              />
            </div>
            <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/0 transition duration-200 group-hover:bg-black/20">
              <span className="scale-75 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[var(--foreground)] opacity-0 transition duration-200 group-hover:scale-100 group-hover:opacity-100">
                Lihat
              </span>
            </span>
          </button>
        ))}
      </div>

      {!showAll && PHOTOS.length > INITIAL_COUNT && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex h-10 items-center rounded-full border border-[var(--line)] bg-white px-6 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            Lihat semua {PHOTOS.length} foto
          </button>
        </div>
      )}

      {/* Lightbox — full screen, di atas header */}
      {lightbox !== null ? (
        <div
          className="fixed inset-0 z-[999999999] flex items-center justify-center bg-black p-0"
          role="dialog"
          aria-modal="true"
          aria-label="Galeri foto"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30"
            aria-label="Tutup"
          >
            <HugeIcon icon={Cancel01Icon} size={22} aria-hidden />
          </button>

          {/* Prev */}
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); setLightbox(lightbox - 1 < 0 ? visible.length - 1 : lightbox - 1); }}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30"
            aria-label="Foto sebelumnya"
          >
            <HugeIcon icon={ArrowLeft02Icon} size={20} aria-hidden />
          </button>

          {/* Image — full screen */}
          <div
            className="flex h-full w-full items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={visible[lightbox].src}
              alt={visible[lightbox].alt}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Counter */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
            {lightbox + 1} / {visible.length}
          </p>

          {/* Next */}
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); setLightbox((lightbox + 1) % visible.length); }}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30"
            aria-label="Foto berikutnya"
          >
            <HugeIcon icon={ArrowRight02Icon} size={20} aria-hidden />
          </button>
        </div>
      ) : null}
    </>
  );
}
