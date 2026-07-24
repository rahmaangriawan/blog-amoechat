"use client";

import { useState } from "react";
import { resolveSeoTokens } from "@/lib/seo-tokens";

type PreviewMode = "mobile" | "desktop";

function GooglePreview({
  title,
  description,
  url,
  mode,
}: {
  title: string;
  description: string;
  url: string;
  mode: PreviewMode;
}) {
  const displayTitle = title.trim() || "Belum ada judul";
  const displayDesc = description.trim() || "Belum ada deskripsi. Google akan mencoba menemukan bagian relevan dari halaman untuk ditampilkan di hasil pencarian.";

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--muted)]">Google preview</span>
      </div>
      <div
        className={[
          "rounded-lg border border-[var(--line)] bg-white p-4 transition-all",
          mode === "mobile" ? "max-w-[360px]" : "max-w-[600px]",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width={28} height={28}>
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917" />
              <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.9 11.9 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <span className="truncate">{url}</span>
            </div>
            <h3
              className="mt-0.5 text-xl leading-tight text-[#1a0dab] hover:underline cursor-pointer"
              style={{ WebkitLineClamp: mode === "mobile" ? 2 : 1, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}
            >
              {displayTitle}
            </h3>
            <p
              className="mt-1 text-sm leading-relaxed text-[#4d5156]"
              style={{ WebkitLineClamp: mode === "mobile" ? 4 : 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}
            >
              {displayDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function charBar(length: number, minGood: number, maxGood: number, maxWarn: number) {
  const pct = Math.min(100, (length / maxWarn) * 100);
  let color = "bg-red-500";
  if (length >= minGood && length <= maxGood) color = "bg-green-500";
  else if (length > 0) color = "bg-amber-500";
  return { pct, color };
}

function statusText(length: number, minGood: number, maxGood: number, maxWarn: number) {
  if (length === 0) return "Belum diisi";
  if (length < minGood) return "Terlalu pendek";
  if (length > maxWarn) return "Terlalu panjang";
  if (length >= minGood && length <= maxGood) return "Optimal";
  return "Hampir pas";
}

function textFromHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(html: string) {
  const text = textFromHtml(html);
  if (!text) return 0;
  return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

function getHeadingLevels(html: string) {
  return Array.from(html.matchAll(/<h([1-6])\b[^>]*>/gi)).map((match) => Number(match[1]));
}

function hasGoodHeadingHierarchy(html: string) {
  const levels = getHeadingLevels(html);
  if (levels.length === 0) return false;

  let previous = 1;
  for (const level of levels) {
    if (level - previous > 1) return false;
    previous = level;
  }

  return levels.includes(2) || levels.includes(1);
}

function scoreItem(ok: boolean, points: number) {
  return ok ? points : 0;
}

function SeoChecklistItem({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-2">
      <span
        className={[
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-black text-white",
          ok ? "bg-green-500" : "bg-amber-500",
        ].join(" ")}
        aria-hidden
      >
        {ok ? "OK" : "!"}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold text-[var(--foreground)]">{label}</span>
        <span className="block text-[11px] font-normal text-[var(--muted)]">{detail}</span>
      </span>
    </li>
  );
}

export function SeoFields({
  defaultTitle,
  defaultDescription,
  previewUrl,
  enableCurrentYearToken = false,
  contentHtml = "",
  featuredImage,
}: {
  defaultTitle?: string | null;
  defaultDescription?: string | null;
  previewUrl?: string | null;
  enableCurrentYearToken?: boolean;
  contentHtml?: string | null;
  featuredImage?: string | null;
}) {
  const [title, setTitle] = useState(defaultTitle ?? "");
  const [desc, setDesc] = useState(defaultDescription ?? "");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("mobile");

  const TITLE_MIN = 30;
  const TITLE_GOOD_MAX = 60;
  const TITLE_MAX = 70;
  const DESC_MIN = 100;
  const DESC_GOOD_MAX = 160;
  const DESC_MAX = 170;

  const previewTitle = enableCurrentYearToken ? resolveSeoTokens(title) : title;
  const titleLength = previewTitle.length;
  const titleBar = charBar(titleLength, TITLE_MIN, TITLE_GOOD_MAX, TITLE_MAX);
  const descBar = charBar(desc.length, DESC_MIN, DESC_GOOD_MAX, DESC_MAX);

  const content = contentHtml ?? "";
  const wordCount = countWords(content);
  const headingLevels = getHeadingLevels(content);
  const hasTable = /<table\b/i.test(content);
  const hasImage = Boolean(featuredImage) || /<img\b/i.test(content);
  const titleOk = titleLength >= TITLE_MIN && titleLength <= TITLE_GOOD_MAX;
  const descOk = desc.length >= DESC_MIN && desc.length <= DESC_GOOD_MAX;
  const wordsOk = wordCount >= 400;
  const headingOk = hasGoodHeadingHierarchy(content);
  const tableOk = hasTable;
  const imageOk = hasImage;

  const overallScore =
    scoreItem(titleOk, 20) +
    scoreItem(descOk, 20) +
    scoreItem(wordsOk, 20) +
    scoreItem(headingOk, 15) +
    scoreItem(imageOk, 15) +
    scoreItem(tableOk, 10);

  let overallColor = "bg-red-500";
  if (overallScore >= 85) overallColor = "bg-green-500";
  else if (overallScore >= 60) overallColor = "bg-amber-500";

  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">SEO / Meta Tag</p>
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <span>Skor SEO</span>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full ${overallColor} transition-all`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
          <span className="font-bold text-[var(--foreground)]">{overallScore}/100</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          <span className="flex items-center justify-between">
            Meta Title
            <span className="text-[11px] text-[var(--muted)]">{titleLength}/{TITLE_MAX}</span>
          </span>
          <input
            name="metaTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Kosongkan untuk pakai nama paket (ideal ${TITLE_MIN}-${TITLE_GOOD_MAX} karakter)`}
          />
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full ${titleBar.color} transition-all`}
                style={{ width: `${titleBar.pct}%` }}
              />
            </div>
            <span className="text-[11px] text-[var(--muted)]">
              {statusText(titleLength, TITLE_MIN, TITLE_GOOD_MAX, TITLE_MAX)}
            </span>
          </div>
          <span className="text-xs font-normal text-[var(--muted)]">
            Judul yang muncul di hasil pencarian Google.
            {enableCurrentYearToken ? " Gunakan %currentyear% untuk menampilkan tahun berjalan." : ""}
          </span>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          <span className="flex items-center justify-between">
            Meta Description
            <span className="text-[11px] text-[var(--muted)]">{desc.length}/{DESC_MAX}</span>
          </span>
          <textarea
            name="metaDescription"
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder={`Ringkasan singkat untuk mesin pencari (ideal ${DESC_MIN}-${DESC_GOOD_MAX} karakter)`}
            className="min-h-[80px] resize-y"
          />
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full ${descBar.color} transition-all`}
                style={{ width: `${descBar.pct}%` }}
              />
            </div>
            <span className="text-[11px] text-[var(--muted)]">
              {statusText(desc.length, DESC_MIN, DESC_GOOD_MAX, DESC_MAX)}
            </span>
          </div>
          <span className="text-xs font-normal text-[var(--muted)]">
            Deskripsi singkat untuk hasil pencarian.
          </span>
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--background)] p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-[var(--foreground)]">Checklist skor konten</p>
          <span className="text-[11px] font-semibold text-[var(--muted)]">{wordCount} kata</span>
        </div>
        <ul className="grid gap-2 md:grid-cols-2">
          <SeoChecklistItem ok={titleOk} label="Title SEO" detail={`Ideal ${TITLE_MIN}-${TITLE_GOOD_MAX} karakter. Saat ini ${titleLength}.`} />
          <SeoChecklistItem ok={descOk} label="Meta description" detail={`Ideal ${DESC_MIN}-${DESC_GOOD_MAX} karakter. Saat ini ${desc.length}.`} />
          <SeoChecklistItem ok={wordsOk} label="Jumlah kata" detail="Minimal 400 kata pada konten artikel." />
          <SeoChecklistItem ok={headingOk} label="Hierarki heading" detail={headingLevels.length ? `Heading terdeteksi: ${headingLevels.map((level) => `H${level}`).join(", ")}.` : "Tambahkan H2/H3 yang runtut."} />
          <SeoChecklistItem ok={imageOk} label="Gambar" detail={hasImage ? "Ada gambar unggulan atau gambar di konten." : "Tambahkan gambar unggulan atau gambar di artikel."} />
          <SeoChecklistItem ok={tableOk} label="Tabel" detail={hasTable ? "Ada tabel di konten." : "Tambahkan tabel jika artikel berisi data/perbandingan."} />
        </ul>
      </div>

      {/* Google Preview */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-xs font-semibold text-[var(--muted)]">Google preview</span>
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setPreviewMode("mobile")}
            className={[
              "rounded px-2 py-1 text-xs font-medium transition",
              previewMode === "mobile"
                ? "bg-white text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]",
            ].join(" ")}
          >
            Mobile
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode("desktop")}
            className={[
              "rounded px-2 py-1 text-xs font-medium transition",
              previewMode === "desktop"
                ? "bg-white text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]",
            ].join(" ")}
          >
            Desktop
          </button>
        </div>
      </div>
      <GooglePreview
        title={previewTitle || "Belum ada judul"}
        description={desc}
        url={previewUrl || "example.com/judul-artikel"}
        mode={previewMode}
      />
    </div>
  );
}
