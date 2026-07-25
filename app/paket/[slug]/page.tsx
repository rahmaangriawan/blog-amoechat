import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPlanPrice, getPricingPlan, pricingPlans, SIGNUP_URL } from "@/lib/amoechat-content";
import { buildStaticPageMetadata } from "@/lib/metadata";
import { buildWhatsAppHref, getPublicContactSettings } from "@/lib/public-contact";

export function generateStaticParams() { return pricingPlans.map((plan) => ({ slug: plan.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const plan = getPricingPlan((await params).slug);
  if (!plan) return { title: "Paket tidak ditemukan" };
  return buildStaticPageMetadata({
    title: `Paket ${plan.name}`,
    description: plan.description,
    canonical: `/paket/${plan.slug}`,
  });
}

export default async function PricingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const plan = getPricingPlan((await params).slug);
  if (!plan) notFound();
  const contact = await getPublicContactSettings();
  const ctaHref = plan.slug === "enterprise" ? buildWhatsAppHref(contact.whatsappNumber, "Halo Amoechat, saya ingin konsultasi paket Enterprise.") : SIGNUP_URL;
  const ctaLabel = plan.slug === "enterprise" ? "Hubungi sales" : `Mulai dengan ${plan.name}`;
  return (
    <main className="py-16 md:py-24"><div className="container max-w-5xl"><Link href="/paket" className="text-sm font-black text-[var(--primary-strong)]">Kembali ke semua paket</Link><div className="mt-8 grid gap-10 rounded-2xl border border-[var(--line)] p-7 md:grid-cols-[0.8fr_1.2fr] md:p-12"><div><p className="text-sm font-bold text-[var(--muted)]">{plan.label}</p><h1 className="mt-3 text-4xl font-black">{plan.name}</h1><p className="mt-5 leading-8 text-[var(--muted)]">{plan.description}</p><p className="mt-8 text-4xl font-black">{formatPlanPrice(plan.priceIdr)}</p><p className="mt-1 text-sm text-[var(--muted)]">Untuk {plan.period}</p><Link href={ctaHref} target="_blank" rel="noopener noreferrer" className="button mt-8 w-full">{ctaLabel}</Link></div><div className="grid gap-8 sm:grid-cols-2"><div><h2 className="text-lg font-black">Fitur termasuk</h2><ul className="mt-5 grid gap-3 text-sm">{plan.features.map((feature) => <li key={feature} className="flex gap-3"><span className="font-black text-[var(--primary-strong)]">✓</span>{feature}</li>)}</ul></div><div><h2 className="text-lg font-black">Channel dan add-on</h2><ul className="mt-5 grid gap-3 text-sm">{plan.addOns.map((item) => <li key={item} className="flex gap-3"><span className="font-black text-[var(--primary-strong)]">✓</span>{item}</li>)}</ul></div></div></div></div></main>
  );
}
