import type { Metadata } from "next";
import Image from "next/image";
import { BubbleChatDoneIcon, File01Icon, Image01Icon, StudentCardIcon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import Script from "next/script";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Login CMS", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const params = await searchParams;
  const next = params.next?.startsWith("/dashboard") ? params.next : "/dashboard";
  const metrics = [
    { label: "Artikel", value: "Konten", icon: File01Icon },
    { label: "Media", value: "Aset", icon: Image01Icon },
    { label: "Komentar", value: "Komunitas", icon: BubbleChatDoneIcon },
    { label: "Program", value: "Magang", icon: StudentCardIcon },
  ];

  return (
    <main data-app-shell="private" className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" data-cfasync="false" />
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--primary-softer)]"><Image src="/images/favicon-amoechat.png" alt="" width={30} height={30} className="h-8 w-8 object-contain" priority /></span><div><p className="text-sm font-black text-[var(--brand)]">Amoechat Panel</p><p className="text-xs font-semibold text-[var(--muted)]">CMS dan program</p></div></div>
          <h1 className="text-4xl font-black leading-tight text-[var(--foreground)]">Masuk ke dashboard</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Kelola blog, media, komentar, SEO, dan program magang Amoechat.</p>
          {params.error ? <p className="mt-5 rounded-xl border border-[#f1b8b1] bg-[#fff4f2] p-3 text-sm font-semibold text-[#9f2418]">Email atau password belum sesuai.</p> : null}
          <LoginForm next={next} siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
        </div>
      </section>
      <section className="relative hidden min-h-screen overflow-hidden bg-[linear-gradient(135deg,#08cb52_0%,#057a35_55%,#071b11_100%)] p-10 lg:block">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/20" />
        <div className="relative flex h-full items-center justify-center"><div className="w-full max-w-[680px]"><div className="rounded-[28px] border border-white/25 bg-white/15 p-5 shadow-2xl backdrop-blur-xl"><div className="rounded-[22px] bg-white p-6 shadow-xl"><div><p className="text-sm font-black text-[var(--primary-strong)]">CMS Amoechat</p><h2 className="mt-2 text-2xl font-black">Konten yang membantu bisnis bertumbuh</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Publikasikan insight WhatsApp marketing dan kelola program perusahaan dari panel yang ringkas.</p></div><div className="mt-6 grid grid-cols-2 gap-3">{metrics.map((item) => <div key={item.label} className="rounded-2xl border border-[var(--line)] bg-[var(--primary-softer)] p-4"><HugeIcon icon={item.icon} size={20} className="text-[var(--primary-strong)]" aria-hidden /><p className="mt-4 text-lg font-black">{item.value}</p><p className="mt-1 text-xs font-bold text-[var(--muted)]">{item.label}</p></div>)}</div></div></div><div className="mt-8 max-w-xl text-white"><p className="text-sm font-black uppercase tracking-[0.12em] text-white/70">Amoechat untuk bisnis</p><h2 className="mt-3 text-4xl font-black leading-tight">Satu pusat kendali untuk brand dan konten Amoechat.</h2></div></div></div>
      </section>
    </main>
  );
}
