export type ChangelogType = "feature" | "fix" | "improvement" | "security" | "breaking";

export type ChangelogEntry = {
  date: string;
  version?: string;
  title: string;
  description?: string;
  items: Array<{ type: ChangelogType; text: string }>;
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-07-22",
    version: "2.0.0",
    title: "Amoechat menjadi platform WhatsApp untuk bisnis",
    description: "Website publik, pricing, SEO, dan program perusahaan diselaraskan dengan produk Amoechat.",
    items: [
      { type: "breaking", text: "Alur layanan lama dihentikan dan data pricing dipusatkan sebagai konfigurasi statis bertipe." },
      { type: "feature", text: "Homepage baru menjelaskan Meta Cloud API Official, koneksi QR unofficial, inbox tim, broadcast, automation, template, widget, webhook, dan API." },
      { type: "feature", text: "Halaman Fitur, Harga, Cara Kerja, Tentang, FAQ, Bantuan, legal, dan Program Magang mendapat narasi baru." },
      { type: "improvement", text: "Dashboard difokuskan pada blog, media, komentar, SEO, author, notifikasi CMS, dan program magang." },
      { type: "security", text: "Ketentuan penggunaan menjelaskan kewajiban persetujuan penerima, keamanan akun, serta kepatuhan pada kebijakan WhatsApp dan Meta." },
    ],
  },
  {
    date: "2026-07-21",
    version: "1.9.0",
    title: "Pembaruan identitas visual Amoechat",
    items: [
      { type: "improvement", text: "Warna brand utama diperbarui ke hijau Amoechat dengan kontras tombol dan fokus yang lebih jelas." },
      { type: "improvement", text: "Logo, favicon, metadata, manifest, dan tampilan dashboard memakai identitas Amoechat yang konsisten." },
    ],
  },
];

export function getChangelog(): ChangelogEntry[] {
  return [...CHANGELOG].sort((a, b) => b.date.localeCompare(a.date) || (b.version ?? "").localeCompare(a.version ?? ""));
}

export const CHANGELOG_TYPE_META: Record<ChangelogType, { label: string; badgeClass: string }> = {
  feature: { label: "Fitur Baru", badgeClass: "bg-emerald-100 text-emerald-700" },
  improvement: { label: "Peningkatan", badgeClass: "bg-sky-100 text-sky-700" },
  fix: { label: "Perbaikan", badgeClass: "bg-amber-100 text-amber-700" },
  security: { label: "Keamanan", badgeClass: "bg-red-100 text-red-700" },
  breaking: { label: "Perubahan Penting", badgeClass: "bg-purple-100 text-purple-700" },
};
