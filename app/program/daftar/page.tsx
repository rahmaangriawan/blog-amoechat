import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft02Icon, CheckmarkCircle01Icon, StudentCardIcon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { InternshipApplicationForm } from "@/components/InternshipApplicationForm";
import { buildWhatsAppHref, getPublicContactSettings } from "@/lib/public-contact";

export const metadata: Metadata = {
  title: "Daftar Magang Online",
  description: "Form pendaftaran program magang Amoechat untuk siswa SMK, mahasiswa, dan talenta awal.",
  alternates: { canonical: "/program" },
  openGraph: {
    title: "Daftar Program Magang Amoechat",
    description: "Ajukan pendaftaran untuk belajar produk SaaS, automation, API, content, sales, atau customer success di Amoechat.",
    type: "website",
    url: "/program/daftar",
    siteName: "Amoechat",
  },
};

const whatsappText = "Halo Amoechat, saya ingin bertanya tentang program magang.";
const benefits = [
  "Data pendaftaran langsung masuk ke dashboard tim Amoechat.",
  "Tim dapat meninjau dan follow up sesuai bidang minat.",
  "Cocok untuk magang umum, remote/online, hybrid, maupun onsite.",
];

export default async function InternshipRegisterPage() {
  const contact = await getPublicContactSettings();
  const whatsappHref = buildWhatsAppHref(contact.partnershipWhatsappNumber, whatsappText);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-[linear-gradient(135deg,var(--primary-softer)_0%,#fff_100%)] pb-12 pt-[10px] md:pb-16 md:pt-[60px]">
        <div className="container section-mobile-padding">
          <Link href="/program" className="inline-flex items-center gap-2 text-sm font-black text-[var(--primary)] transition hover:text-[var(--primary-strong)]">
            <HugeIcon icon={ArrowLeft02Icon} size={17} aria-hidden />
            Kembali ke Program Magang
          </Link>
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[var(--primary)] shadow-sm">
                <HugeIcon icon={StudentCardIcon} size={18} aria-hidden />
                Pendaftaran Magang Online
              </span>
              <h1 className="mt-5 text-4xl font-black leading-tight text-[var(--foreground)] md:text-5xl">
                Daftar Program Magang Amoechat
              </h1>
              <p className="mt-5 text-lg leading-8 text-[var(--muted)]">
                Isi data awal kamu agar tim kami bisa meninjau bidang minat, periode, dan skema magang yang paling sesuai.
              </p>
              <div className="mt-8 grid gap-3">
                {benefits.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700 shadow-sm">
                    <HugeIcon icon={CheckmarkCircle01Icon} size={18} className="mt-0.5 shrink-0 text-[var(--primary)]" aria-hidden />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <InternshipApplicationForm whatsappHref={whatsappHref} />
          </div>
        </div>
      </section>
    </main>
  );
}
