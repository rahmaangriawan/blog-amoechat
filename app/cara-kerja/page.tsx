import type { Metadata } from "next";
import Link from "next/link";
import { SIGNUP_URL } from "@/lib/amoechat-content";

export const metadata: Metadata = { title: "Cara Kerja Amoechat", description: "Hubungkan WhatsApp Official Meta Cloud API atau QR dan mulai mengelola inbox tim dalam tiga langkah.", alternates: { canonical: "/cara-kerja" } };

const steps = [
  ["Buat workspace", "Daftar gratis, lengkapi profil bisnis, dan undang anggota tim yang akan menangani percakapan."],
  ["Hubungkan channel", "Pilih Meta Cloud API untuk jalur Official atau scan QR Linked Devices untuk mulai lebih cepat."],
  ["Atur inbox dan automation", "Buat assignment, template, broadcast, workflow, widget, atau integrasi API sesuai alur bisnis."],
];

export default function HowItWorksPage() {
  return <main><section className="bg-[var(--primary-softer)] py-16 md:py-24"><div className="container max-w-4xl"><p className="text-sm font-black text-[var(--primary-strong)]">Mulai cepat</p><h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Aktifkan operasi WhatsApp dalam tiga langkah</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">Tidak perlu berpindah-pindah aplikasi. Hubungkan channel, undang tim, lalu kelola semua percakapan dari satu workspace.</p></div></section><section className="py-16 md:py-24"><div className="container grid gap-10 lg:grid-cols-3">{steps.map(([title,description],index)=><article key={title} className="border-t-2 border-[var(--primary)] pt-6"><span className="text-sm font-black text-[var(--primary-strong)]">Langkah {index+1}</span><h2 className="mt-4 text-2xl font-black">{title}</h2><p className="mt-4 leading-8 text-[var(--muted)]">{description}</p></article>)}</div></section><section className="pb-20"><div className="container grid gap-8 rounded-2xl bg-[#071b11] p-8 text-white md:grid-cols-2 md:p-12"><div><h2 className="text-3xl font-black">Pilih jalur yang tepat</h2><p className="mt-4 leading-8 text-white/70">Official cocok untuk template dan operasi melalui Meta Cloud API. QR cocok untuk menghubungkan nomor melalui Linked Devices dengan cepat.</p></div><div className="flex items-end md:justify-end"><Link href={SIGNUP_URL} target="_blank" rel="noopener noreferrer" className="button whitespace-nowrap">Mulai gratis</Link></div></div></section></main>;
}
