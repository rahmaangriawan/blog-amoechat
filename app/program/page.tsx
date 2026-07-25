import Image from "next/image";
import Link from "next/link";
import { ArrowRight02Icon, CodeIcon, Megaphone01Icon, StudentCardIcon, UserMultipleIcon, WhatsappIcon, WorkflowSquare10Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { MagangGallery } from "@/components/MagangGallery";
import { buildStaticPageMetadata } from "@/lib/metadata";
import { buildWhatsAppHref, getPublicContactSettings } from "@/lib/public-contact";

export const revalidate = 3600;
export const metadata = buildStaticPageMetadata({
  title: "Program Magang",
  description: "Program magang Amoechat untuk belajar langsung tentang produk SaaS, WhatsApp automation, API, content, sales, dan customer success.",
  canonical: "/program",
});

const fields = [
  { icon: CodeIcon, title: "Product & API", description: "Belajar alur produk SaaS, dokumentasi API, integrasi webhook, dan quality assurance." },
  { icon: WorkflowSquare10Icon, title: "Automation", description: "Menyusun workflow, chatbot, template, dan skenario komunikasi bisnis yang terukur." },
  { icon: Megaphone01Icon, title: "Content & Growth", description: "Membuat konten edukasi, riset pasar, campaign, SEO, dan materi pemasaran B2B." },
  { icon: UserMultipleIcon, title: "Sales & Customer Success", description: "Memahami kebutuhan pelanggan, demo produk, onboarding, dan dukungan pengguna." },
];

const steps = ["Kirim pendaftaran dan portofolio", "Tim meninjau bidang minat dan ketersediaan", "Kandidat terpilih mengikuti sesi perkenalan", "Mulai proyek dengan target dan mentor yang jelas"];

export default async function ProgramPage() {
  const contact = await getPublicContactSettings();
  const whatsappHref = buildWhatsAppHref(contact.partnershipWhatsappNumber, "Halo Amoechat, saya ingin berdiskusi tentang kerja sama program magang.");
  return (
    <main>
      <section className="overflow-hidden bg-[var(--primary-softer)]">
        <div className="container">
          <div className="grid items-end gap-8 pb-12 pt-10 md:grid-cols-[1fr_0.65fr] md:py-20">
            <div className="pb-4">
              <p className="text-sm font-black text-[var(--primary-strong)]">Program Magang Amoechat</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">Belajar membangun produk WhatsApp untuk bisnis</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">Program untuk siswa SMK, mahasiswa, dan talenta awal yang ingin memahami cara tim SaaS mengembangkan produk, automation, content, sales, dan customer success.</p>
              <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
                <Link href="/program/daftar" className="button w-full whitespace-nowrap">Daftar magang<HugeIcon icon={ArrowRight02Icon} size={18} aria-hidden /></Link>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[var(--primary-strong)] bg-white px-5 font-black !text-[var(--primary-strong)] transition-colors duration-300 hover:bg-[var(--primary-softer)]"><HugeIcon icon={WhatsappIcon} size={19} aria-hidden />Diskusi kerja sama</a>
              </div>
            </div>
            <Image src="/images/hero-program-magang-optimized.webp" alt="Program magang Amoechat" width={896} height={758} priority sizes="(min-width: 768px) 40vw, 100vw" className="mx-auto h-auto w-full max-w-md object-contain" />
          </div>
        </div>
      </section>
      <section className="py-16 md:py-24"><div className="container"><div className="max-w-2xl"><p className="text-sm font-black text-[var(--primary-strong)]">Bidang pembelajaran</p><h2 className="mt-3 text-3xl font-black md:text-5xl">Kontribusi pada pekerjaan yang benar-benar dipakai</h2><p className="mt-4 leading-8 text-[var(--muted)]">Peserta bekerja bersama tim Amoechat dengan briefing, target, review, dan dokumentasi yang jelas.</p></div><div className="mt-10 grid gap-5 md:grid-cols-2">{fields.map((field) => <article key={field.title} className="rounded-2xl border border-[var(--line)] p-7"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--primary-softer)] text-[var(--primary-strong)]"><HugeIcon icon={field.icon} size={23} aria-hidden /></span><h3 className="mt-6 text-2xl font-black">{field.title}</h3><p className="mt-3 leading-7 text-[var(--muted)]">{field.description}</p></article>)}</div></div></section>
      <section className="bg-[#071b11] py-16 text-white md:py-24"><div className="container grid gap-10 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-sm font-black text-[#78f0a5]">Yang akan Anda dapatkan</p><h2 className="mt-4 text-3xl font-black md:text-5xl">Pengalaman kerja yang terstruktur</h2><p className="mt-5 leading-8 text-white/70">Bukan sekadar observasi. Peserta belajar melalui proyek, feedback, dan evaluasi berkala.</p></div><div className="grid gap-4 sm:grid-cols-2">{["Mentor dan target belajar", "Portofolio proyek", "Pengalaman kolaborasi", "Sertifikat program"].map((item) => <div key={item} className="rounded-2xl border border-white/15 p-5"><HugeIcon icon={StudentCardIcon} size={20} className="text-[#78f0a5]" aria-hidden /><p className="mt-4 font-black">{item}</p></div>)}</div></div></section>
      <section className="py-16 md:py-24"><div className="container"><div className="mx-auto max-w-3xl text-center"><p className="text-sm font-black text-[var(--primary-strong)]">Alur seleksi</p><h2 className="mt-3 text-3xl font-black md:text-5xl">Empat langkah untuk mulai</h2><p className="mt-5 leading-8 text-[var(--muted)]">Proses singkat dan transparan untuk mengenal minat, kesiapan, serta tujuan belajar setiap kandidat.</p></div><ol className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">{steps.map((step,index) => <li key={step} className="grid min-h-36 grid-cols-[56px_1fr] items-start gap-5 rounded-2xl border border-[var(--line)] bg-white p-6"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--primary-strong)] text-xl font-black text-white">{index+1}</span><div><p className="text-sm font-black text-[var(--primary-strong)]">Langkah {index+1}</p><p className="mt-2 text-lg font-black leading-7">{step}</p></div></li>)}</ol></div></section>
      <section className="bg-[var(--primary-softer)] py-16 md:py-24"><div className="container"><div className="text-center"><h2 className="text-3xl font-black md:text-5xl">Kegiatan peserta Amoechat</h2><p className="mt-4 text-[var(--muted)]">Dokumentasi pembelajaran, kolaborasi, dan presentasi proyek.</p></div><div className="mt-10"><MagangGallery /></div></div></section>
      <section className="bg-[var(--primary-softer)] py-12 md:py-20">
        <div className="container">
          <div className="grid gap-8 rounded-2xl bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-strong)_100%)] p-6 text-white sm:p-8 md:grid-cols-[1fr_auto] md:items-end md:p-12">
            <div>
              <p className="text-sm font-black text-white/75">Siap belajar bersama kami?</p>
              <h2 className="mt-3 text-3xl font-black md:text-5xl">Mulai perjalanan Anda di Amoechat</h2>
              <p className="mt-4 max-w-2xl leading-7 text-white/80">Ceritakan bidang yang ingin dipelajari dan proyek yang pernah Anda kerjakan.</p>
            </div>
            <Link
              href="/program/daftar"
              className="button w-full !border !border-white/40 !bg-white/10 !text-white hover:!bg-white/15 md:w-auto"
            >
              Daftar sekarang<HugeIcon icon={ArrowRight02Icon} size={18} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
