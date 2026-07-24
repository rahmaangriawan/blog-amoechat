"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Delete02Icon,
  Image01Icon,
  Link01Icon,
  PencilEdit02Icon,
  Search01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { deleteRedirect, saveRedirect, saveSeoBranding, saveSeoHomepage, toggleRedirect } from "@/lib/actions";

type SeoGlobal = {
  id: string;
  siteTitle: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  headerLogo: string | null;
  footerLogo: string | null;
  favicon: string | null;
  appleTouchIcon: string | null;
  ogDefaultImage: string | null;
  allowIndexing: boolean;
  disallowPaths: string | null;
  includeBlogSitemap: boolean;
  includePagesSitemap: boolean;
};

type RedirectItem = {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  type: number;
  isActive: boolean;
};

type MediaItem = {
  id: string;
  title: string;
  alt: string | null;
  filePath: string;
  isPublished: boolean;
};

type SeoGlobalManagerProps = {
  seo: SeoGlobal | null;
  redirects: RedirectItem[];
  activeTab: string;
  search: string;
  page: number;
  totalPages: number;
  totalRedirects: number;
  saved: boolean;
};

const tabs = [
  { label: "Homepage SEO", value: "homepage" },
  { label: "Logo Branding", value: "branding" },
  { label: "Redirect", value: "redirects" },
];

function FieldCounter({ value, max }: { value: string; max: number }) {
  const length = value.length;
  const tone = length > max ? "text-red-600" : length > max * 0.85 ? "text-[var(--primary)]" : "text-[var(--muted)]";
  return <span className={`text-xs font-bold ${tone}`}>{length}/{max}</span>;
}

function SeoSignal({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span className={["inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black", ok ? "bg-[#dcfce7] text-[#15803d]" : "bg-[var(--primary-softer)] text-[var(--primary)]"].join(" ")}>
      <HugeIcon icon={CheckmarkCircle02Icon} size={13} aria-hidden />
      {children}
    </span>
  );
}

function MediaField({
  label,
  name,
  value,
  onPick,
}: {
  label: string;
  name: string;
  value: string;
  onPick: (name: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold">{label}</label>
      <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-3 md:grid-cols-[96px_1fr_auto] md:items-center">
        <div className="grid h-20 place-items-center overflow-hidden rounded-xl bg-[var(--primary-softer)]">
          {value ? <img src={value} alt="" className="h-full w-full object-contain" /> : <HugeIcon icon={Image01Icon} size={24} className="text-[var(--primary)]" aria-hidden />}
        </div>
        <div className="min-w-0">
          <input name={name} value={value} readOnly placeholder="/images/..." className="font-normal" />
          <p className="mt-1 truncate text-xs text-[var(--muted)]">{value || "Belum ada gambar dipilih"}</p>
        </div>
        <button type="button" onClick={() => onPick(name)} className="button secondary h-11">
          <HugeIcon icon={Image01Icon} size={15} aria-hidden />
          Pilih
        </button>
      </div>
    </div>
  );
}

function MediaPicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  async function loadMedia() {
    setLoading(true);
    try {
      const response = await fetch("/api/media", { cache: "no-store" });
      const data = await response.json();
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }

  async function upload(file: File | null | undefined) {
    if (!file) return;
    const formData = new FormData();
    formData.set("image", file);
    formData.set("title", file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    const response = await fetch("/api/media", { method: "POST", body: formData });
    if (!response.ok) return;
    const data = await response.json();
    setItems((current) => [data.item, ...current]);
    setPreview(data.item);
  }

  async function deleteItem(item: MediaItem) {
    await fetch(`/api/media?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
    setItems((current) => current.filter((media) => media.id !== item.id));
    if (preview?.id === item.id) setPreview(null);
  }

  async function copyUrl(path: string) {
    await navigator.clipboard.writeText(path);
  }

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    if (!keyword) return items;
    return items.filter((item) => `${item.title} ${item.alt || ""} ${item.filePath}`.toLowerCase().includes(keyword));
  }, [items, search]);

  useEffect(() => {
    if (open) void loadMedia();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="flex h-[min(86vh,760px)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.25)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] p-5">
          <div>
            <p className="text-sm font-black text-[var(--primary)]">Media Library</p>
            <h2 className="text-2xl font-black">Pilih gambar</h2>
          </div>
          <button type="button" onClick={onClose} className="button secondary h-10 px-4">
            <HugeIcon icon={Cancel01Icon} size={15} aria-hidden />
            Tutup
          </button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_320px]">
          <div className="min-h-0 overflow-y-auto p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <label className="relative block">
                <HugeIcon icon={Search01Icon} size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari media..." className="pl-11 font-normal" />
              </label>
              <button type="button" onClick={() => inputRef.current?.click()} className="button">
                <HugeIcon icon={Upload01Icon} size={16} aria-hidden />
                Upload
              </button>
            </div>

            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />

            <div
              className={["mt-5 rounded-2xl border-2 border-dashed p-5 text-center transition", dragging ? "border-[var(--primary)] bg-[var(--primary-softer)]" : "border-[var(--line)]"].join(" ")}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                void upload(event.dataTransfer.files?.[0]);
              }}
            >
              <p className="text-sm font-bold text-[var(--muted)]">Drag & drop gambar ke area ini, atau gunakan tombol Upload.</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-2xl bg-[var(--primary-softer)]" />)
                : filtered.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPreview(item)}
                      onDoubleClick={() => {
                        onSelect(item.filePath);
                        onClose();
                      }}
                      className={["overflow-hidden rounded-2xl border bg-white text-left transition hover:border-[var(--primary)]", preview?.id === item.id ? "border-[var(--primary)] ring-2 ring-[var(--primary-soft)]" : "border-[var(--line)]"].join(" ")}
                    >
                      <img src={item.filePath} alt={item.alt || item.title} className="aspect-video w-full object-cover" />
                      <div className="p-3">
                        <p className="truncate text-sm font-black">{item.title}</p>
                        <p className="mt-1 truncate text-xs text-[var(--muted)]">{item.filePath}</p>
                      </div>
                    </button>
                  ))}
            </div>
          </div>

          <aside className="border-t border-[var(--line)] bg-[var(--primary-softer)] p-5 lg:border-l lg:border-t-0">
            {preview ? (
              <div className="grid gap-4">
                <img src={preview.filePath} alt={preview.alt || preview.title} className="max-h-56 w-full rounded-2xl bg-white object-contain" />
                <div>
                  <p className="font-black">{preview.title}</p>
                  <p className="mt-1 break-all text-xs text-[var(--muted)]">{preview.filePath}</p>
                </div>
                <button type="button" onClick={() => copyUrl(preview.filePath)} className="button secondary w-full">
                  <HugeIcon icon={Copy01Icon} size={15} aria-hidden />
                  Copy URL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(preview.filePath);
                    onClose();
                  }}
                  className="button w-full"
                >
                  Gunakan gambar
                </button>
                <button type="button" onClick={() => setConfirmDeleteOpen(true)} className="button danger w-full">
                  <HugeIcon icon={Delete02Icon} size={15} aria-hidden />
                  Hapus media
                </button>
              </div>
            ) : (
              <div className="grid h-full place-items-center text-center text-sm text-[var(--muted)]">
                Pilih gambar untuk melihat preview.
              </div>
            )}
          </aside>
        </div>
      </div>

      <ConfirmDeleteModal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={async () => {
          if (preview) {
            await deleteItem(preview);
            setConfirmDeleteOpen(false);
          }
        }}
        title="Hapus media ini?"
        description={preview ? `File "${preview.title}" akan dihapus permanen dari server.` : ""}
      />
    </div>
  );
}

export function SeoGlobalManager({
  seo,
  redirects,
  activeTab,
  search,
  page,
  totalPages,
  totalRedirects,
  saved,
}: SeoGlobalManagerProps) {
  const [tab, setTab] = useState(activeTab);
  const [pickerField, setPickerField] = useState<string | null>(null);
  const [mediaValues, setMediaValues] = useState<Record<string, string>>({
    ogImage: seo?.ogImage || "",
    twitterImage: seo?.twitterImage || "",
    headerLogo: seo?.headerLogo || "",
    footerLogo: seo?.footerLogo || "",
    favicon: seo?.favicon || "",
    appleTouchIcon: seo?.appleTouchIcon || "",
    ogDefaultImage: seo?.ogDefaultImage || "",
  });
  const [siteTitle, setSiteTitle] = useState(seo?.siteTitle || "");
  const [metaTitle, setMetaTitle] = useState(seo?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(seo?.metaDescription || "");
  const [editingRedirect, setEditingRedirect] = useState<RedirectItem | null>(null);

  const googleTitle = metaTitle || siteTitle || "Amoechat | WhatsApp API untuk Bisnis";
  const googleDescription = metaDescription || "Kelola WhatsApp Official atau QR, inbox tim, broadcast, automation, webhook, dan API dalam satu platform.";
  const currentUrl = "https://blog.amoechat.com/";

  function selectMedia(path: string) {
    if (!pickerField) return;
    setMediaValues((current) => ({ ...current, [pickerField]: path }));
  }

  return (
    <main className="p-5 md:p-8">
      {saved ? (
        <div className="fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-2xl bg-[#16a34a] px-4 py-3 text-sm font-bold text-white shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          Perubahan SEO berhasil disimpan.
        </div>
      ) : null}

      <MediaPicker open={Boolean(pickerField)} onClose={() => setPickerField(null)} onSelect={selectMedia} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[var(--brand)]">Pengaturan</p>
          <h1 className="text-3xl font-bold">SEO Global</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Kelola redirect, SEO homepage, branding, robots, dan sitemap dari satu panel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SeoSignal ok={metaTitle.length > 0 && metaTitle.length <= 60}>Title SEO</SeoSignal>
          <SeoSignal ok={metaDescription.length >= 80 && metaDescription.length <= 160}>Description</SeoSignal>
          <SeoSignal ok={Boolean(mediaValues.ogImage || mediaValues.ogDefaultImage)}>OG Image</SeoSignal>
        </div>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Tab SEO Global">
        {tabs.map((item) => (
          <Link
            key={item.value}
            href={`/dashboard/settings/seo?tab=${item.value}`}
            onClick={() => setTab(item.value)}
            className={[
              "inline-flex h-11 items-center rounded-xl border px-4 text-sm font-black transition",
              tab === item.value ? "border-[var(--primary-strong)] bg-[var(--primary-strong)] !text-white" : "border-[var(--line)] bg-white text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
            ].join(" ")}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "redirects" ? (
        <section className="mt-6 grid gap-5">
          <form key={editingRedirect?.id || "new"} action={saveRedirect} className="panel grid gap-4 p-5">
            {editingRedirect ? <input type="hidden" name="id" value={editingRedirect.id} /> : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{editingRedirect ? "Edit redirect" : "Tambah redirect"}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">Gunakan path relatif seperti /halaman-lama atau URL absolut.</p>
              </div>
              {editingRedirect ? (
                <button type="button" onClick={() => setEditingRedirect(null)} className="button secondary h-10">
                  Batal edit
                </button>
              ) : null}
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_130px_120px_auto] lg:items-end">
              <label className="grid gap-2 text-sm font-bold">
                URL lama
                <input name="sourceUrl" defaultValue={editingRedirect?.sourceUrl || ""} placeholder="/halaman-lama" required className="font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                URL baru
                <input name="targetUrl" defaultValue={editingRedirect?.targetUrl || ""} placeholder="/blog/panduan-whatsapp-api" required className="font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Status
                <select name="type" defaultValue={editingRedirect?.type || 301} className="h-12 rounded-xl border border-[var(--line)] px-3 font-normal">
                  <option value="301">301</option>
                  <option value="302">302</option>
                </select>
              </label>
              <label className="inline-flex h-12 items-center gap-3 rounded-xl border border-[var(--line)] px-3 text-sm font-bold">
                <input type="checkbox" name="isActive" defaultChecked={editingRedirect?.isActive ?? true} className="!h-4 !w-4 accent-[var(--primary)]" />
                Active
              </label>
              <button className="button h-12" type="submit">
                Simpan
              </button>
            </div>
          </form>

          <section className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] p-5">
              <div>
                <h2 className="text-xl font-black">Redirect Manager</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{totalRedirects} redirect tersimpan</p>
              </div>
              <form method="GET" className="flex gap-2">
                <input type="hidden" name="tab" value="redirects" />
                <label className="relative">
                  <HugeIcon icon={Search01Icon} size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
                  <input name="q" defaultValue={search} placeholder="Search redirect..." className="h-11 pl-11 font-normal" />
                </label>
                <button className="button secondary h-11" type="submit">Cari</button>
              </form>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-[#f5f7f9]">
                  <tr>
                    <th className="p-4">URL Lama</th>
                    <th className="p-4">URL Baru</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Active</th>
                    <th className="p-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {redirects.map((item) => (
                    <tr key={item.id}>
                      <td className="p-4 font-bold">{item.sourceUrl}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-2">
                          <HugeIcon icon={Link01Icon} size={14} className="text-[var(--primary)]" aria-hidden />
                          {item.targetUrl}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="rounded-full bg-[var(--primary-softer)] px-3 py-1 text-xs font-black text-[var(--primary)]">{item.type}</span>
                      </td>
                      <td className="p-4">
                        <form action={toggleRedirect}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="isActive" value={String(!item.isActive)} />
                          <button type="submit" className={["relative h-7 w-12 rounded-full transition", item.isActive ? "bg-[var(--primary)]" : "bg-gray-300"].join(" ")} aria-label="Toggle redirect">
                            <span className={["absolute top-1 h-5 w-5 rounded-full bg-white transition", item.isActive ? "left-6" : "left-1"].join(" ")} />
                          </button>
                        </form>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setEditingRedirect(item)} className="button secondary !min-h-10 !px-3">
                            <HugeIcon icon={PencilEdit02Icon} size={14} aria-hidden />
                            Edit
                          </button>
                          <DeleteRedirectButton id={item.id} sourceUrl={item.sourceUrl} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] p-4">
                <p className="text-sm text-[var(--muted)]">Halaman {page} dari {totalPages}</p>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
                    <Link key={item} href={`/dashboard/settings/seo?tab=redirects&page=${item}&q=${encodeURIComponent(search)}`} className={["grid h-9 min-w-9 place-items-center rounded-xl border px-3 text-sm font-black", item === page ? "border-[var(--primary-strong)] bg-[var(--primary-strong)] !text-white" : "border-[var(--line)]"].join(" ")}>
                      {item}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </section>
      ) : null}

      {tab === "homepage" ? (
        <form action={saveSeoHomepage} className="mt-6 grid gap-5">
          {seo ? <input type="hidden" name="id" value={seo.id} /> : null}
          <section className="panel grid gap-5 p-5">
            <h2 className="text-xl font-black">Homepage SEO</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold lg:col-span-2">
                Site Title Global
                <input
                  name="siteTitle"
                  value={siteTitle}
                  onChange={(event) => setSiteTitle(event.target.value)}
                  placeholder="Amoechat | WhatsApp API untuk Bisnis"
                  className="font-normal"
                />
                <span className="text-xs font-normal text-[var(--muted)]">Dipakai sebagai nama situs global dan fallback title kalau meta title kosong.</span>
              </label>
              <label className="grid gap-2 text-sm font-bold">
                <span className="flex items-center justify-between">Meta Title <FieldCounter value={metaTitle} max={60} /></span>
                <input name="metaTitle" value={metaTitle} onChange={(event) => setMetaTitle(event.target.value)} maxLength={80} className="font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Meta Keywords
                <input name="metaKeywords" defaultValue={seo?.metaKeywords || ""} placeholder="whatsapp api, whatsapp marketing, automation" className="font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-bold lg:col-span-2">
                <span className="flex items-center justify-between">Meta Description <FieldCounter value={metaDescription} max={160} /></span>
                <textarea name="metaDescription" value={metaDescription} onChange={(event) => setMetaDescription(event.target.value)} rows={3} maxLength={220} className="font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-bold lg:col-span-2">
                Canonical URL
                <input name="canonicalUrl" defaultValue={seo?.canonicalUrl || ""} placeholder="/" className="font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Open Graph Title
                <input name="ogTitle" defaultValue={seo?.ogTitle || ""} className="font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Twitter Title
                <input name="twitterTitle" defaultValue={seo?.twitterTitle || ""} className="font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Open Graph Description
                <textarea name="ogDescription" defaultValue={seo?.ogDescription || ""} rows={3} className="font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Twitter Description
                <textarea name="twitterDescription" defaultValue={seo?.twitterDescription || ""} rows={3} className="font-normal" />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Open Graph Image URL
                <input
                  name="ogImage"
                  value={mediaValues.ogImage}
                  onChange={(event) => setMediaValues((current) => ({ ...current, ogImage: event.target.value }))}
                  placeholder="/images/default-og.webp"
                  className="font-normal"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Twitter Image URL
                <input
                  name="twitterImage"
                  value={mediaValues.twitterImage}
                  onChange={(event) => setMediaValues((current) => ({ ...current, twitterImage: event.target.value }))}
                  placeholder="/images/default-twitter.webp"
                  className="font-normal"
                />
              </label>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="panel p-5">
              <h2 className="text-xl font-black">Google SERP Preview</h2>
              <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-4">
                <p className="text-sm text-[#188038]">{currentUrl}</p>
                <p className="mt-1 text-xl text-[#1a0dab]">{googleTitle}</p>
                <p className="mt-1 text-sm leading-6 text-[#4d5156]">{googleDescription}</p>
              </div>
            </div>
            <div className="panel p-5">
              <h2 className="text-xl font-black">Social Media Preview</h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
                {mediaValues.ogImage || mediaValues.ogDefaultImage ? <img src={mediaValues.ogImage || mediaValues.ogDefaultImage} alt="" className="aspect-[1.91/1] w-full object-cover" /> : <div className="aspect-[1.91/1] bg-[var(--primary-softer)]" />}
                <div className="p-4">
                  <p className="text-xs uppercase text-[var(--muted)]">blog.amoechat.com</p>
                  <p className="mt-1 font-black">{googleTitle}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{googleDescription}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="panel grid gap-4 p-5">
            <h2 className="text-xl font-black">Robots & Sitemap</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="inline-flex items-center gap-3 rounded-xl border border-[var(--line)] p-4 text-sm font-bold">
                <input type="checkbox" name="allowIndexing" defaultChecked={seo?.allowIndexing ?? true} className="!h-4 !w-4 accent-[var(--primary)]" />
                Allow indexing
              </label>
              <label className="inline-flex items-center gap-3 rounded-xl border border-[var(--line)] p-4 text-sm font-bold">
                <input type="checkbox" name="includeBlogSitemap" defaultChecked={seo?.includeBlogSitemap ?? true} className="!h-4 !w-4 accent-[var(--primary)]" />
                Include blog di sitemap
              </label>
              <label className="inline-flex items-center gap-3 rounded-xl border border-[var(--line)] p-4 text-sm font-bold">
                <input type="checkbox" name="includePagesSitemap" defaultChecked={seo?.includePagesSitemap ?? true} className="!h-4 !w-4 accent-[var(--primary)]" />
                Include pages di sitemap
              </label>
            </div>
            <label className="grid gap-2 text-sm font-bold">
              Disallow path
              <textarea name="disallowPaths" defaultValue={seo?.disallowPaths || "/dashboard\n/login\n/api"} rows={4} className="font-normal" />
              <span className="text-xs font-normal text-[var(--muted)]">Satu path per baris.</span>
            </label>
          </section>

          <button className="button w-fit" type="submit">Simpan SEO Homepage</button>
        </form>
      ) : null}

      {tab === "branding" ? (
        <form action={saveSeoBranding} className="mt-6 grid gap-5">
          {seo ? <input type="hidden" name="id" value={seo.id} /> : null}
          <section className="panel grid gap-5 p-5">
            <h2 className="text-xl font-black">Global Logo & Favicon Settings</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              <MediaField label="Logo Header" name="headerLogo" value={mediaValues.headerLogo} onPick={setPickerField} />
              <MediaField label="Logo Footer" name="footerLogo" value={mediaValues.footerLogo} onPick={setPickerField} />
              <MediaField label="Favicon Website" name="favicon" value={mediaValues.favicon} onPick={setPickerField} />
              <MediaField label="Apple Touch Icon" name="appleTouchIcon" value={mediaValues.appleTouchIcon} onPick={setPickerField} />
              <MediaField label="Open Graph Default Image" name="ogDefaultImage" value={mediaValues.ogDefaultImage} onPick={setPickerField} />
            </div>
          </section>
          <button className="button w-fit" type="submit">Simpan Branding</button>
        </form>
      ) : null}
    </main>
  );
}


function DeleteRedirectButton({ id, sourceUrl }: { id: string; sourceUrl: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await deleteRedirect(fd);
      setOpen(false);
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="button danger !min-h-10 !px-3">
        <HugeIcon icon={Delete02Icon} size={14} aria-hidden />
        Hapus
      </button>
      <ConfirmDeleteModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Hapus redirect ini?"
        description={`Redirect dari "${sourceUrl}" akan dihapus permanen.`}
        pending={pending}
      />
    </>
  );
}
