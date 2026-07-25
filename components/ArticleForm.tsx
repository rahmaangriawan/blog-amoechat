"use client";

import { useState, useRef } from "react";
import { SaveIcon, Upload01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { RadialSpinner } from "@/components/RadialSpinner";
import { LazyRichTextEditor as RichTextEditor } from "@/components/LazyRichTextEditor";
import { SaveToast } from "@/components/SaveToast";
import { SeoFields } from "@/components/SeoFields";
import { DatePicker } from "@/components/DatePicker";
import { saveArticle } from "@/lib/actions";

type Category = {
  id: string;
  name: string;
};

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  publishedAt: Date | string | null;
  featuredImage: string | null;
  type: string;
  categoryId: string | null;
  authorId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
};

type AuthorOption = {
  id: string;
  name: string;
  authorRole: string | null;
  authorAvatarUrl: string | null;
};

type MediaItem = {
  id: string;
  title: string;
  alt: string | null;
  filePath: string;
  isPublished: boolean;
};

export function ArticleForm({
  item,
  categories,
  authors,
  type,
  saved = false,
  error,
}: {
  item?: Article | null;
  categories?: Category[];
  authors?: AuthorOption[];
  type: "POST" | "PAGE";
  saved?: boolean;
  error?: string;
}) {
  const isPage = type === "PAGE";
  const [articleTitle, setArticleTitle] = useState(item?.title ?? "");
  const [articleSlug, setArticleSlug] = useState(item?.slug ?? "");
  const [excerpt, setExcerpt] = useState(item?.excerpt ?? "");
  const [selectedAuthorId, setSelectedAuthorId] = useState(item?.authorId ?? authors?.[0]?.id ?? "");
  const previewUrl = articleSlug
    ? isPage
      ? `/${articleSlug}`
      : `/blog/${articleSlug}`
    : null;

  // Featured image state
  const [featuredImage, setFeaturedImage] = useState<string | null>(item?.featuredImage ?? null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(item?.featuredImage ?? null);
  const [contentHtml, setContentHtml] = useState(item?.content ?? "");
  const [mediaOpen, setMediaOpen] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaQuery, setMediaQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(formData: FormData) {
    await saveArticle(formData);
  }

  // Media picker functions
  async function openMediaPicker() {
    setMediaOpen(true);
    if (media.length > 0 || mediaLoading) return;

    setMediaLoading(true);
    try {
      const response = await fetch("/api/media", { cache: "no-store" });
      if (!response.ok) throw new Error("Gagal memuat media.");
      const data = (await response.json()) as { items?: MediaItem[] };
      setMedia(data.items ?? []);
    } finally {
      setMediaLoading(false);
    }
  }

  function closeMediaPicker() {
    setMediaOpen(false);
    setMediaQuery("");
  }

  function selectMedia(item: MediaItem) {
    setFeaturedImage(item.filePath);
    setFeaturedImagePreview(item.filePath);
    closeMediaPicker();
  }

  // Drag and drop handlers
  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileUpload(file);
    }
  }

  function handleFileUpload(file: File) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
    }
    setFeaturedImagePreview(URL.createObjectURL(file));
    // Clear server path so server knows to use the uploaded file
    setFeaturedImage(null);
  }

  return (
    <>
      <SaveToast show={saved} />
      <form action={handleSubmit}>
        {item ? <input type="hidden" name="id" value={item.id} /> : null}
        <input type="hidden" name="type" value={type} />
        {featuredImage ? <input type="hidden" name="currentFeaturedImage" value={featuredImage} /> : null}
        {error === "duplicate-slug" ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            Slug sudah dipakai konten lain. Ganti slug, lalu simpan ulang.
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div className="space-y-4">
            <div className="panel grid gap-4 p-5">
              <label className="grid gap-2 text-sm font-semibold">
                Judul
                <input name="title" value={articleTitle} onChange={(event) => setArticleTitle(event.target.value)} required />
              </label>
              <div className="grid gap-2 text-sm font-semibold">
                <span className="flex items-center justify-between">
                  Slug
                  {previewUrl ? (
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[var(--primary)] hover:underline">
                      Lihat ↗
                    </a>
                  ) : null}
                </span>
                <input name="slug" value={articleSlug} onChange={(event) => setArticleSlug(event.target.value)} placeholder="otomatis jika kosong" />
              </div>
              <label className="grid gap-2 text-sm font-semibold">
                Ringkasan
                <textarea name="excerpt" rows={3} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} />
              </label>
              <div className="grid gap-2 text-sm font-semibold">
                <span>Konten</span>
                <RichTextEditor name="content" defaultValue={item?.content ?? ""} onChange={setContentHtml} />
              </div>
            </div>

            <SeoFields
              defaultTitle={item?.metaTitle}
              defaultDescription={item?.metaDescription}
              fallbackTitle={articleTitle}
              fallbackDescription={excerpt}
              previewUrl={previewUrl ?? undefined}
              enableCurrentYearToken={!isPage}
              contentHtml={contentHtml}
              featuredImage={featuredImagePreview}
              featuredImageAlt={articleTitle}
              slug={articleSlug}
              excerpt={excerpt}
              requireAuthor={!isPage}
              authorComplete={
                isPage ||
                Boolean(
                  (authors ?? []).find(
                    (author) => author.id === selectedAuthorId && author.name.trim() && author.authorRole?.trim(),
                  ),
                )
              }
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Publish Settings */}
            <div className="panel p-5">
              <h3 className="mb-4 text-sm font-bold">Pengaturan</h3>
              <div className="space-y-4">
                <label className="grid gap-2 text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    Visibilitas
                  </span>
                  <div className="flex gap-3">
                    <label className="inline-flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold transition hover:border-[var(--primary)]">
                      <input className="!h-4 !w-4 accent-[var(--primary)]" type="radio" name="isPublished" value="true" defaultChecked={item?.isPublished ?? false} />
                      <span>Publish</span>
                    </label>
                    <label className="inline-flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold transition hover:border-[var(--primary)]">
                      <input className="!h-4 !w-4 accent-[var(--primary)]" type="radio" name="isPublished" value="false" defaultChecked={!item?.isPublished} />
                      <span>Draf</span>
                    </label>
                  </div>
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  Tanggal & Jam
                  <DatePicker name="publishedAt" value={item?.publishedAt} showTime />
                </label>

                {!isPage ? (
                  <label className="grid gap-2 text-sm font-semibold">
                    Kategori
                    <select name="categoryId" defaultValue={item?.categoryId ?? ""}>
                      <option value="">Tanpa kategori</option>
                      {(categories ?? []).map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {!isPage ? (
                  <label className="grid gap-2 text-sm font-semibold">
                    Penulis
                    {authors && authors.length > 0 ? (
                      <select name="authorId" value={selectedAuthorId} onChange={(event) => setSelectedAuthorId(event.target.value)}>
                        {authors.map((author) => (
                          <option key={author.id} value={author.id}>
                            {author.name}
                            {author.authorRole ? ` · ${author.authorRole}` : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
                        Belum ada author publik aktif. Tambahkan author di menu User agar postingan bisa dipasangkan ke penulis tertentu.
                      </div>
                    )}
                  </label>
                ) : null}

                {/* Featured Image with Drag & Drop */}
                <div className="grid gap-2 text-sm font-semibold">
                  <span>Gambar Unggulan</span>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => openMediaPicker()}
                    className={[
                      "relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-[var(--line)] bg-[var(--primary-softer)] transition",
                      dragOver ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "",
                      featuredImagePreview ? "border-solid" : "",
                    ].join(" ")}
                  >
                    {featuredImagePreview ? (
                      <img
                        src={featuredImagePreview}
                        alt="Featured"
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-[var(--muted)]">
                        <HugeIcon icon={Upload01Icon} size={32} />
                        <span className="text-xs font-medium">
                          Drag & drop atau klik untuk upload
                        </span>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="featuredImage"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button className="button w-full" type="submit">
              <HugeIcon icon={SaveIcon} size={16} aria-hidden />
              Simpan Perubahan
            </button>
          </div>
        </div>

        {/* Media Picker Modal */}
        {mediaOpen ? (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeMediaPicker();
              }
            }}
          >
            <div className="panel max-h-[82vh] w-full max-w-3xl overflow-hidden bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] p-4">
                <div>
                  <p className="text-sm font-bold text-[var(--brand)]">Media</p>
                  <h2 className="text-xl font-bold">Pilih Gambar Unggulan</h2>
                </div>
                <button
                  type="button"
                  onClick={closeMediaPicker}
                  className="relative z-10 rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-bold transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  Tutup
                </button>
              </div>

              <div className="grid gap-4 border-b border-[var(--line)] p-4 md:grid-cols-[1fr_260px]">
                <label className="relative block">
                  <HugeIcon icon={Search01Icon} size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    value={mediaQuery}
                    onChange={(event) => setMediaQuery(event.target.value)}
                    placeholder="Cari media..."
                    className="!pl-11"
                  />
                </label>
              </div>

              <div className="custom-scrollbar max-h-[60vh] overflow-y-auto p-4">
                {mediaLoading ? (
                  <div className="flex items-center justify-center gap-3 rounded-xl border border-[var(--line)] p-6 text-sm text-[var(--muted)]">
                    <RadialSpinner size={20} className="text-[var(--primary)]" />
                    <span>Memuat media...</span>
                  </div>
                ) : media.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {media
                      .filter((item) => {
                        const keyword = mediaQuery.trim().toLowerCase();
                        if (!keyword) return true;
                        return [item.title, item.alt, item.filePath].some((value) => value?.toLowerCase().includes(keyword));
                      })
                      .map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectMedia(item)}
                          className="group overflow-hidden rounded-xl border border-[var(--line)] bg-white text-left transition hover:border-[var(--primary)]"
                        >
                          <img src={item.filePath} alt={item.alt || item.title} className="h-32 w-full bg-[var(--primary-softer)] object-cover" />
                          <span className="block p-3">
                            <span className="block truncate text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)]">{item.title}</span>
                            <span className="mt-1 block truncate text-xs font-normal text-[var(--muted)]">{item.filePath}</span>
                          </span>
                        </button>
                      ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-[var(--line)] p-5 text-sm text-[var(--muted)]">Belum ada gambar yang cocok.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </>
  );
}
