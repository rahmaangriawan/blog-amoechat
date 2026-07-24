import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AddSquareIcon, AnalyticsUpIcon, ArrowRight02Icon, BubbleChatIcon, CheckmarkBadge01Icon, Clock01Icon, HierarchyIcon, Notification02Icon, Plant01Icon, QrCodeIcon, UserMultipleIcon, UserShield01Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import {
  formatPlanPrice,
  platformFeatures,
  pricingPlans,
  SIGNUP_URL,
} from "@/lib/amoechat-content";
import { prisma } from "@/lib/prisma";
import { getSeoGlobalSettings } from "@/lib/seo-settings";
import { safeJsonLd } from "@/lib/safe-json-ld";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoGlobalSettings();
  const title = seo?.metaTitle || seo?.siteTitle || "WhatsApp Official dan QR untuk Bisnis";
  const description =
    seo?.metaDescription ||
    "Kelola WhatsApp Official Meta Cloud API dan koneksi QR, inbox tim, broadcast, automation, template, widget, serta API dalam satu workspace Amoechat.";
  const ogImage = seo?.ogImage || seo?.ogDefaultImage || "/images/logo-amoechat.png";

  return {
    title: { absolute: title },
    description,
    keywords: seo?.metaKeywords || undefined,
    alternates: { canonical: seo?.canonicalUrl || "/" },
    openGraph: {
      title: seo?.ogTitle || title,
      description: seo?.ogDescription || description,
      type: "website",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo?.twitterTitle || seo?.ogTitle || title,
      description: seo?.twitterDescription || seo?.ogDescription || description,
      images: [seo?.twitterImage || ogImage],
    },
    robots: seo?.allowIndexing === false ? { index: false, follow: false } : undefined,
  };
}

const connectionOptions = [
  {
    title: "WhatsApp Official",
    description: "Meta Cloud API untuk template, status pengiriman, kualitas akun, dan broadcast yang mengikuti kebijakan platform.",
    icon: CheckmarkBadge01Icon,
    gradient: "bg-[linear-gradient(145deg,#078d3e_0%,#046c31_100%)]",
  },
  {
    title: "WhatsApp QR",
    description: "Hubungkan nomor melalui Linked Devices untuk mulai cepat. Koneksi ini bukan layanan resmi Meta atau WhatsApp.",
    icon: QrCodeIcon,
    gradient: "bg-[linear-gradient(145deg,#087665_0%,#045243_100%)]",
  },
  {
    title: "Inbox tim",
    description: "Atur assignment, konteks pelanggan, dan handoff agar setiap percakapan memiliki pemilik yang jelas.",
    icon: BubbleChatIcon,
    gradient: "bg-[linear-gradient(145deg,#4f8f2b_0%,#326c22_100%)]",
  },
];

const setupSteps = [
  { title: "Tambah channel", description: "Buat channel baru dari workspace Amoechat dalam hitungan detik.", icon: AddSquareIcon },
  { title: "Pilih Official atau QR", description: "Hubungkan Meta Cloud API atau scan QR dari perangkat Anda.", icon: QrCodeIcon },
  { title: "Kelola inbox tim", description: "Undang tim, atur assignment, dan mulai melayani pelanggan dari satu inbox terpusat.", icon: UserMultipleIcon },
];

const pricingIcons = {
  free: Plant01Icon,
  professional: UserMultipleIcon,
  enterprise: AnalyticsUpIcon,
};

const securityFeatures = [
  { title: "Akses tim", description: "Atur hak akses sesuai peran setiap anggota tim.", icon: UserShield01Icon },
  { title: "Kanal terpusat", description: "Kelola semua channel tanpa membagikan akses secara sembarangan.", icon: HierarchyIcon },
  { title: "Status real-time", description: "Pantau percakapan dan status pengiriman secara langsung.", icon: Clock01Icon },
  { title: "Kepatuhan pesan", description: "Pastikan broadcast mengikuti persetujuan pelanggan dan kebijakan platform.", icon: Notification02Icon },
];

async function getLatestArticles() {
  try {
    return await prisma.article.findMany({
      where: { type: "POST", isPublished: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
      select: {
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
      },
    });
  } catch (error) {
    console.warn("Homepage blog section uses an empty state because articles are unavailable.", error);
    return [];
  }
}

export default async function HomePage() {
  const latestArticles = await getLatestArticles();

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Amoechat",
    url: "https://blog.amoechat.com",
    logo: "https://blog.amoechat.com/images/logo-amoechat.png",
    description: "Platform WhatsApp untuk bisnis dengan koneksi Meta Cloud API dan QR.",
  };
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Amoechat",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "Inbox tim, broadcast, workflow, template, widget, webhook, dan API untuk operasi WhatsApp bisnis.",
    offers: pricingPlans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.priceIdr,
      priceCurrency: "IDR",
      url: `https://blog.amoechat.com/paket/${plan.slug}`,
    })),
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", bestRating: "5", ratingCount: "10000" },
  };

  return (
    <main className="overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(softwareSchema) }} />

      <section className="relative isolate flex min-h-[610px] items-center overflow-hidden bg-[#f9fdfb] md:min-h-[650px]">
        <div className="absolute inset-y-0 right-0 -z-20 w-full md:w-[74%]">
          <Image
            src="/images/hero-amoechat-workspace.webp"
            alt="Tim bisnis mengelola percakapan pelanggan melalui inbox Amoechat"
            fill
            priority
            sizes="(min-width: 768px) 74vw, 100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#f9fdfb_0%,rgba(249,253,251,0.99)_34%,rgba(249,253,251,0.9)_43%,rgba(249,253,251,0.28)_58%,rgba(249,253,251,0)_70%)] max-md:bg-[linear-gradient(90deg,rgba(249,253,251,0.98)_0%,rgba(249,253,251,0.9)_62%,rgba(249,253,251,0.68)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-white/80 to-transparent" />

        <div className="container w-full py-16 md:py-20">
          <div className="max-w-[700px]">
            <h1 className="text-[2.55rem] font-black leading-[1.04] tracking-[-0.04em] sm:text-5xl md:text-[3.45rem]">
              <span className="block lg:whitespace-nowrap">Satu Workspace untuk</span>
              <span className="block lg:whitespace-nowrap">Seluruh Operasi</span>
              <span className="block lg:whitespace-nowrap">WhatsApp Bisnis</span>
            </h1>
            <p className="mt-7 max-w-[590px] text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">Hubungkan Meta Cloud API atau scan QR. Tim membalas lebih cepat, chat tetap rapi, dan workflow berjalan otomatis.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={SIGNUP_URL} className="button whitespace-nowrap sm:min-w-[164px]" target="_blank" rel="noopener noreferrer">Mulai gratis</Link>
              <Link href="/cara-kerja" className="button secondary whitespace-nowrap sm:min-w-[188px]">Lihat cara kerja</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-black tracking-[-0.035em] md:text-5xl">Pilih jalur koneksi yang sesuai<br className="hidden md:block" /> dengan operasi Anda</h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">Gunakan Official, QR, atau keduanya. Inbox, kampanye, dan automation tetap dikelola dari tempat yang sama.</p>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {connectionOptions.map((option) => (
              <article key={option.title} className={`${option.gradient} relative min-h-[350px] overflow-hidden rounded-[24px] p-8 text-white shadow-[0_20px_50px_rgba(5,90,48,0.16)] md:p-9`}>
                <div className="flex items-center gap-5">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/18 backdrop-blur-sm">
                    <HugeIcon icon={option.icon} size={34} strokeWidth={2} aria-hidden />
                  </span>
                  <h3 className="text-2xl font-black">{option.title}</h3>
                </div>
                <div className="mt-7 h-px bg-white/25" />
                <p className="mt-7 text-lg leading-8 text-white/90">{option.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-white py-16 md:py-24">
        <div className="container grid gap-12 lg:grid-cols-[0.65fr_1.35fr]">
          <div>
            <h2 className="text-3xl font-black tracking-tight md:text-5xl">Semua Kebutuhan Anda</h2>
            <p className="mt-5 leading-8 text-[var(--muted)]">Dari percakapan pertama sampai integrasi sistem, Amoechat menjaga tim tetap responsif dan terukur.</p>
            <Link href="/fitur" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--primary)] px-5 font-black text-[var(--primary-strong)] transition hover:bg-[var(--primary-softer)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M0 0h24v24H0z" fill="none" />
                <path fill="currentColor" d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91c0-2.65-1.03-5.14-2.9-7.01m-7.01 15.24c-1.48 0-2.93-.4-4.2-1.15l-.3-.18l-3.12.82l.83-3.04l-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24c2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.02 4.54-3.68 8.23-8.22 8.23m4.52-6.16c-.25-.12-1.47-.72-1.69-.81c-.23-.08-.39-.12-.56.12c-.17.25-.64.81-.78.97c-.14.17-.29.19-.54.06c-.25-.12-1.05-.39-1.99-1.23c-.74-.66-1.23-1.47-1.38-1.72c-.14-.25-.02-.38.11-.51c.11-.11.25-.29.37-.43s.17-.25.25-.41c.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31c-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74c.59.26 1.05.41 1.41.52c.59.19 1.13.16 1.56.1c.48-.07 1.47-.6 1.67-1.18c.21-.58.21-1.07.14-1.18s-.22-.16-.47-.28" />
              </svg>
              Jelajahi Semua Fitur
            </Link>
          </div>
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {platformFeatures.map((feature) => (
              <div key={feature.title} className="border-t border-[var(--line)] pt-5">
                <h3 className="text-lg font-black">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fbfdfc] py-16 md:py-24">
        <div className="container grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="max-w-xl text-3xl font-black leading-[1.08] tracking-[-0.04em] md:text-5xl">Aktif Dalam<br />3 Langkah</h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--muted)]">Mulai gunakan Amoechat dengan cepat dan mudah. Hanya tiga langkah sederhana.</p>
            <Image src="/images/amoechat-setup-steps.webp" alt="Ilustrasi alur setup Amoechat" width={1450} height={1086} sizes="(min-width: 1024px) 44vw, 100vw" className="mt-6 h-auto w-full max-w-[620px] mix-blend-multiply" />
          </div>
          <div className="relative grid gap-6">
            {setupSteps.map((step, index) => (
              <article key={step.title} className="grid items-center gap-5 rounded-2xl border border-[var(--line)] bg-white p-6 sm:grid-cols-[92px_56px_1fr] md:p-7">
                <span className="grid h-[92px] w-[92px] place-items-center rounded-2xl bg-[var(--primary-softer)] text-[var(--primary-strong)]">
                  <HugeIcon icon={step.icon} size={44} strokeWidth={1.8} aria-hidden />
                </span>
                <span className="grid h-14 w-14 place-items-center rounded-full bg-[linear-gradient(145deg,#08cb52,#04983c)] text-xl font-black text-white">{index + 1}</span>
                <div><h3 className="text-xl font-black md:text-2xl">{step.title}</h3><p className="mt-2 leading-7 text-[var(--muted)]">{step.description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fbfdfc] py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-black tracking-[-0.04em] md:text-5xl">Paket Tim Anda</h2>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-sm font-bold text-[var(--primary-strong)]">
              {["Channel Tanpa Batas", "Pesan Unlimited", "Upgrade Paket Fleksibel"].map((item) => (
                <span key={item} className="rounded-full border border-[var(--line)] bg-[var(--primary-softer)] px-4 py-2">{item}</span>
              ))}
            </div>
          </div>
          <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <article key={plan.slug} className={["flex min-h-[390px] flex-col rounded-2xl border bg-white p-7", plan.popular ? "border-[var(--primary)]" : "border-[var(--line)]"].join(" ")}>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--primary-softer)] text-[var(--primary-strong)]">
                  <HugeIcon icon={pricingIcons[plan.slug]} size={25} strokeWidth={2} aria-hidden />
                </span>
                <p className="mt-5 text-sm text-[var(--muted)]">{plan.label}</p>
                <h3 className="mt-2 text-2xl font-black">{plan.name}</h3>
                <div className="my-5 h-px bg-[var(--line)]" />
                <p className="text-3xl font-black text-[var(--primary-strong)]">{formatPlanPrice(plan.priceIdr)}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">Untuk {plan.period}</p>
                <Link href={`/paket/${plan.slug}`} className={["group mt-auto inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border px-5 font-black transition-all duration-300", plan.popular ? "border-[var(--primary-strong)] bg-[var(--primary-strong)] !text-white hover:bg-[#04682d]" : "border-[var(--primary-strong)] text-[var(--primary-strong)] hover:bg-[var(--primary-softer)]"].join(" ")}>
                  Lihat detail
                  <HugeIcon icon={ArrowRight02Icon} size={20} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#02180e] py-16 text-white md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_45%,rgba(8,203,82,0.08),transparent_42%)]" aria-hidden="true" />
        <div className="container relative grid items-center gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:gap-16">
          <div>
            <h2 className="max-w-xl text-3xl font-black leading-[1.08] tracking-[-0.04em] md:text-5xl">Kanal Terkelola dan Akses Berbasis Peran</h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-white/70">Jaga operasi tetap terkendali dengan kepemilikan channel yang jelas, hak akses tim, dan praktik keamanan akun yang disiplin.</p>
            <Image src="/images/amoechat-security-v2.webp" alt="Ilustrasi perlindungan akses dan keamanan Amoechat" width={1250} height={1250} sizes="(min-width: 1024px) 38vw, 100vw" className="mx-auto mt-6 h-auto w-full max-w-[480px]" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {securityFeatures.map((feature) => (
              <article key={feature.title} className="min-h-[290px] rounded-3xl border border-white/15 bg-[linear-gradient(145deg,rgba(8,203,82,0.07),rgba(255,255,255,0.015))] p-7 md:p-8">
                <span className="grid h-24 w-24 place-items-center rounded-full border border-white/10 bg-white/5 text-[#45df7e]">
                  <HugeIcon icon={feature.icon} size={43} strokeWidth={1.7} aria-hidden />
                </span>
                <h3 className="mt-7 whitespace-nowrap text-xl font-black md:text-2xl">{feature.title}</h3>
                <div className="mt-5 h-0.5 w-12 bg-[#45df7e]" aria-hidden="true" />
                <p className="mt-5 min-h-14 text-base leading-7 text-white/65">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="container">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em] md:text-5xl">Artikel Terbaru</h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">Insight praktis untuk mengembangkan layanan pelanggan, campaign, dan automation WhatsApp.</p>
            </div>
            <Link href="/blog" className="group inline-flex items-center gap-2 font-black text-[var(--primary-strong)]">Lihat semua artikel<HugeIcon icon={ArrowRight02Icon} size={19} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden /></Link>
          </div>

          {latestArticles.length > 0 ? (
            <div className="mt-10 grid gap-x-8 gap-y-6 lg:grid-cols-3">
              {latestArticles.map((article) => {
                const shortExcerpt = article.excerpt ? `${article.excerpt.trim().split(/\s+/).slice(0, 8).join(" ")}…` : null;

                return (
                  <Link key={article.slug} href={`/blog/${article.slug}`} className="group grid min-w-0 grid-cols-[104px_1fr] gap-4 py-3 sm:grid-cols-[120px_1fr] lg:grid-cols-[96px_1fr] xl:grid-cols-[112px_1fr]">
                    <div className="aspect-square overflow-hidden rounded-xl bg-[var(--primary-softer)]">
                      {article.featuredImage ? <img src={article.featuredImage} alt={article.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" /> : null}
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <h3 className="line-clamp-2 text-base font-black leading-snug transition-colors duration-300 group-hover:text-[var(--primary-strong)] xl:text-lg">{article.title}</h3>
                      {shortExcerpt ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{shortExcerpt}</p> : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--primary-softer)] px-6 py-10 text-center">
              <p className="font-bold">Artikel terbaru Amoechat sedang disiapkan.</p>
              <Link href="/blog" className="mt-4 inline-flex font-black text-[var(--primary-strong)]">Kunjungi Blog Amoechat</Link>
            </div>
          )}
          </div>
      </section>
    </main>
  );
}
