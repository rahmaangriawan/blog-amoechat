import type { Metadata } from "next";
import Link from "next/link";
import { platformFeatures, SIGNUP_URL } from "@/lib/amoechat-content";

export const metadata: Metadata = {
  title: "Fitur Platform WhatsApp Bisnis",
  description: "Inbox tim, broadcast, workflow, template, widget website, webhook, dan API untuk WhatsApp Official serta koneksi QR.",
  alternates: { canonical: "/fitur" },
};

export default function FeaturesPage() {
  return (
    <main>
      <section className="bg-[var(--primary-softer)] py-16 md:py-24">
        <div className="container max-w-4xl">
          <p className="text-sm font-black text-[var(--primary-strong)]">Platform Amoechat</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Operasi WhatsApp yang rapi dari percakapan sampai integrasi</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">Satukan Official Meta Cloud API dan koneksi QR dengan alat yang dibutuhkan tim marketing, sales, support, serta developer.</p>
          <Link href={SIGNUP_URL} target="_blank" rel="noopener noreferrer" className="button mt-8">Mulai gratis</Link>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container grid gap-x-12 gap-y-14 md:grid-cols-2">
          {platformFeatures.map((feature, index) => (
            <article key={feature.title} className="border-t border-[var(--line)] pt-6">
              <p className="text-sm font-black text-[var(--primary-strong)]">{String(index + 1).padStart(2, "0")}</p>
              <h2 className="mt-4 text-2xl font-black">{feature.title}</h2>
              <p className="mt-4 max-w-xl leading-8 text-[var(--muted)]">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#071b11] py-16 text-white md:py-24">
        <div className="container grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black md:text-5xl">Official untuk kebutuhan yang mengikuti jalur Meta</h2>
            <p className="mt-5 leading-8 text-white/70">Hubungkan Meta Cloud API untuk template resmi, webhook, status pengiriman, dan operasi dengan volume yang terus tumbuh.</p>
          </div>
          <div>
            <h2 className="text-3xl font-black md:text-5xl">QR untuk setup yang lebih cepat</h2>
            <p className="mt-5 leading-8 text-white/70">Scan QR melalui Linked Devices dan mulai menggunakan inbox tim. Jalur QR bukan layanan resmi Meta atau WhatsApp dan tetap mengikuti ketentuan platform.</p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container rounded-2xl border border-[var(--line)] bg-white p-8 md:p-12">
          <h2 className="max-w-3xl text-3xl font-black md:text-5xl">Bangun alur kustom melalui API dan webhook</h2>
          <p className="mt-5 max-w-2xl leading-8 text-[var(--muted)]">Kirim pesan secara programatik, teruskan event ke sistem Anda, dan hubungkan Amoechat dengan CRM, toko, atau aplikasi internal.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href={SIGNUP_URL} target="_blank" rel="noopener noreferrer" className="button">Buat akun gratis</Link><Link href="/bantuan" className="button secondary">Bicara dengan tim</Link></div>
        </div>
      </section>
    </main>
  );
}
