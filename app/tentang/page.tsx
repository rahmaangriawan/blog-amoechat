import type { Metadata } from "next";
import Link from "next/link";
import { SIGNUP_URL } from "@/lib/amoechat-content";

export const metadata: Metadata = {
  title: "Tentang Amoechat",
  description: "Kisah, misi, nilai, dan perjalanan Amoechat dalam membuat pemasaran WhatsApp lebih mudah diakses bisnis.",
  alternates: { canonical: "/tentang" },
};

const values = [
  ["Pelanggan pertama", "Setiap keputusan dimulai dari kebutuhan pelanggan. Keberhasilan mereka adalah ukuran keberhasilan kami."],
  ["Inovasi", "Kami terus menyederhanakan teknologi messaging agar tim dapat bekerja lebih cepat dan terukur."],
  ["Kepercayaan dan keamanan", "Privasi, kontrol akses, dan pengelolaan data menjadi bagian penting dari setiap pengembangan."],
  ["Dukungan 24/7", "Tim dukungan siap membantu dari proses setup sampai operasi harian."],
];

const milestones = [["2023", "Perusahaan didirikan"], ["2024", "10K+ pengguna aktif"], ["2025", "Pengakuan industri"]];

export default function AboutPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[#fbfdfc] py-16 md:py-24">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[var(--primary-soft)] blur-3xl" aria-hidden="true" />
        <div className="container relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-black text-[var(--primary-strong)]">Tentang Amoechat</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.05] tracking-[-0.04em] md:text-6xl">Merevolusi pemasaran WhatsApp untuk bisnis</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">Kami memberdayakan bisnis dengan automation WhatsApp yang kuat, mudah digunakan, dan terukur untuk mendorong keterlibatan, penjualan, serta loyalitas.</p>
          </div>
          <div className="rounded-3xl border border-[var(--line)] bg-white p-8 md:p-10">
            <p className="text-sm font-black text-[var(--primary-strong)]">Misi kami</p>
            <h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">Membuat pemasaran WhatsApp dapat diakses semua bisnis</h2>
            <p className="mt-5 leading-8 text-[var(--muted)]">Setiap bisnis, berapa pun ukurannya, berhak mendapat alat pemasaran yang canggih tanpa harga rumit atau proses setup yang membingungkan.</p>
          </div>
        </div>
      </section>

      <section className="bg-[#071b11] py-14 text-white md:py-16">
        <div className="container grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
          {[["10K+", "Bisnis aktif"], ["5M+", "Pesan terkirim"], ["98%", "Kepuasan pelanggan"], ["300%", "ROI rata-rata"]].map(([value, label]) => <div key={label}><p className="text-4xl font-black text-[#45df7e]">{value}</p><p className="mt-2 text-sm text-white/65">{label}</p></div>)}
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <div><p className="text-sm font-black text-[var(--primary-strong)]">Kisah kami</p><h2 className="mt-4 text-3xl font-black leading-tight md:text-5xl">Dibangun oleh pemasar, untuk pemasar</h2></div>
          <div className="space-y-5 text-lg leading-8 text-[var(--muted)]"><p>Amoechat lahir dari rasa frustrasi terhadap alat pemasaran WhatsApp yang terlalu mahal, terlalu rumit, atau tidak memiliki fitur penting.</p><p>Kami mulai membangun Amoechat pada 2023 dengan visi menciptakan platform yang canggih, mudah digunakan, dan terjangkau. Saat ini, lebih dari 10.000 bisnis menggunakan Amoechat di lebih dari 50 negara.</p><p>Tim kami menggabungkan keahlian automation marketing, pengembangan perangkat lunak, dan customer success untuk terus menghadirkan nilai.</p></div>
        </div>
      </section>

      <section className="bg-[#f8faf9] py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center"><h2 className="text-3xl font-black md:text-5xl">Perjalanan kami</h2><p className="mt-4 text-[var(--muted)]">Tumbuh bersama bisnis yang mempercayakan komunikasi pelanggannya kepada Amoechat.</p></div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">{milestones.map(([year, label]) => <article key={year} className="rounded-2xl border border-[var(--line)] bg-white p-7"><p className="text-4xl font-black text-[var(--primary-strong)]">{year}</p><div className="mt-5 h-px bg-[var(--line)]" /><p className="mt-5 font-black">{label}</p></article>)}</div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container"><div className="max-w-2xl"><p className="text-sm font-black text-[var(--primary-strong)]">Nilai Amoechat</p><h2 className="mt-4 text-3xl font-black md:text-5xl">Apa yang mendorong kami setiap hari</h2></div><div className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">{values.map(([title, description], index) => <article key={title} className="grid grid-cols-[44px_1fr] gap-5 border-t border-[var(--line)] pt-6"><span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--primary-softer)] font-black text-[var(--primary-strong)]">{index + 1}</span><div><h3 className="text-xl font-black">{title}</h3><p className="mt-3 leading-7 text-[var(--muted)]">{description}</p></div></article>)}</div></div>
      </section>

      <section className="pb-20"><div className="container"><div className="rounded-3xl bg-[var(--primary-strong)] p-8 text-white md:flex md:items-end md:justify-between md:gap-10 md:p-12"><div><h2 className="max-w-3xl text-3xl font-black md:text-5xl">Siap mengubah pemasaran WhatsApp Anda?</h2><p className="mt-5 max-w-xl leading-8 text-white/75">Bergabung dengan ribuan bisnis yang sudah berkembang bersama Amoechat.</p></div><Link href={SIGNUP_URL} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-xl bg-white px-6 font-black !text-[var(--primary-strong)] md:mt-0">Mulai uji coba gratis</Link></div></div></section>
    </main>
  );
}
