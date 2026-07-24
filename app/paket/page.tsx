import type { Metadata } from "next";
import Link from "next/link";
import { formatPlanPrice, pricingPlans } from "@/lib/amoechat-content";
import { buildWhatsAppHref, getPublicContactSettings } from "@/lib/public-contact";

export const metadata: Metadata = {
  title: "Harga Amoechat",
  description: "Pilih paket Free, Professional, atau Enterprise untuk WhatsApp Official, QR, inbox tim, broadcast, automation, dan API.",
  alternates: { canonical: "/paket" },
};

export default async function PricingPage() {
  const contact = await getPublicContactSettings();
  const salesHref = buildWhatsAppHref(contact.whatsappNumber, "Halo Amoechat, saya ingin konsultasi paket Enterprise dan kebutuhan integrasi.");
  return (
    <main>
      <section className="bg-[var(--primary-softer)] py-16 text-center md:py-24"><div className="container"><p className="text-sm font-black text-[var(--primary-strong)]">Harga transparan</p><h1 className="mx-auto mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">Paket untuk setiap ukuran tim</h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">Mulai gratis, hubungkan Official atau QR, lalu upgrade saat volume pesan dan tim berkembang. Harga USD serta penagihan tahunan tersedia saat checkout.</p></div></section>
      <section className="py-16 md:py-24"><div className="container grid gap-6 lg:grid-cols-3">{pricingPlans.map((plan) => <article key={plan.slug} className={["relative flex flex-col rounded-2xl border bg-white p-7",plan.popular?"border-[var(--primary)] shadow-[0_20px_60px_rgba(8,203,82,0.12)]":"border-[var(--line)]"].join(" ")}>{plan.popular?<span className="absolute right-5 top-5 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-black text-[var(--primary-strong)]">Paling populer</span>:null}<p className="text-sm font-bold text-[var(--muted)]">{plan.label}</p><h2 className="mt-2 text-2xl font-black">{plan.name}</h2><p className="mt-4 min-h-14 text-sm leading-7 text-[var(--muted)]">{plan.description}</p><p className="mt-6 text-3xl font-black">{formatPlanPrice(plan.priceIdr)}</p><p className="text-sm text-[var(--muted)]">Untuk {plan.period}</p><ul className="mt-7 grid flex-1 gap-3 text-sm">{plan.features.map(feature=><li key={feature} className="flex gap-3"><span className="font-black text-[var(--primary-strong)]">✓</span><span>{feature}</span></li>)}</ul><Link href={`/paket/${plan.slug}`} className="button mt-8 w-full">Lihat detail</Link></article>)}</div></section>
      <section className="pb-20"><div className="container rounded-2xl bg-[#071b11] p-8 text-white md:p-12"><div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end"><div><h2 className="text-3xl font-black md:text-4xl">Butuh solusi khusus?</h2><p className="mt-4 max-w-xl text-white/70">Diskusikan channel, volume pesan, dukungan dedicated, dan kebutuhan integrasi perusahaan Anda.</p></div><Link href={salesHref} target="_blank" rel="noopener noreferrer" className="button whitespace-nowrap">Hubungi sales</Link></div></div></section>
    </main>
  );
}
