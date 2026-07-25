import Image from "next/image";
import Link from "next/link";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import type { PublicContactSettings } from "@/lib/public-contact";
import { buildMailHref, buildWhatsAppHref } from "@/lib/public-contact";
import { SIGNUP_URL } from "@/lib/amoechat-content";

const productLinks = [
  ["Fitur", "/fitur"], ["Harga", "/paket"], ["Cara Kerja", "/cara-kerja"], ["FAQ", "/faq"],
];
const companyLinks = [
  ["Tentang", "/tentang"], ["Blog", "/blog"], ["Program Magang", "/program"], ["Penulis", "/author"],
];
const supportLinks = [
  ["Pusat Bantuan", "/bantuan"], ["Syarat dan Ketentuan", "/syarat-ketentuan"], ["Kebijakan Privasi", "/kebijakan-privasi"],
];

export function Footer({ initialLogo, contact }: { initialLogo?: string; contact: PublicContactSettings }) {
  const footerLogo = initialLogo || "/images/logo-amoechat-footer.webp";
  const salesHref = buildWhatsAppHref(contact.whatsappNumber, "Halo Amoechat, saya ingin konsultasi solusi WhatsApp untuk bisnis.");
  return (
    <footer className="bg-[#071b11] py-14 text-white md:py-20">
      <div className="container grid gap-10 pb-14 sm:gap-12 md:pb-16 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.8fr]">
        <div><Image src={footerLogo} alt="Amoechat" width={2075} height={561} sizes="180px" className="h-auto w-[180px]"/><p className="mt-6 max-w-sm leading-7 text-white/70">Platform WhatsApp Official Meta Cloud API dan koneksi QR untuk inbox tim, kampanye, automation, template, widget, serta API.</p><div className="mt-7 flex flex-wrap gap-3"><Link href={SIGNUP_URL} target="_blank" rel="noopener noreferrer" className="button whitespace-nowrap">Mulai gratis</Link><Link href={salesHref} target="_blank" rel="noopener noreferrer" className="button whitespace-nowrap !border-white/25 !bg-white/10 !text-white">Hubungi sales</Link></div></div>
        <FooterColumn title="Produk" links={productLinks}/><FooterColumn title="Perusahaan" links={companyLinks}/><div><FooterColumn title="Dukungan" links={supportLinks}/><div className="mt-8 grid gap-3 text-sm leading-6 text-white/70"><Link href={buildMailHref(contact.email)} className="w-fit hover:text-white">{contact.email}</Link><p>{contact.whatsappDisplay}</p></div></div>
      </div>
      <div className="container flex flex-col gap-5 border-t border-white/15 pt-8 text-sm leading-6 text-white/60 md:flex-row md:items-center md:justify-between md:gap-8 md:pt-[30px]"><p className="shrink-0">© 2026 Amoechat. Seluruh hak dilindungi.</p><p className="max-w-3xl text-xs leading-6 md:text-right">WhatsApp dan Meta adalah merek dagang pemiliknya masing-masing. Koneksi QR bukan layanan resmi Meta atau WhatsApp.</p></div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return <div><p className="font-black">{title}</p><div className="mt-5 grid gap-3 text-sm text-white/70">{links.map(([label,href])=><Link key={href} href={href} className="group flex items-center transition-colors duration-300 hover:text-white"><span className="grid w-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:w-5 group-hover:opacity-100"><HugeIcon icon={ArrowRight02Icon} size={15} strokeWidth={2} aria-hidden /></span><span className="transition-transform duration-300 group-hover:translate-x-1">{label}</span></Link>)}</div></div>;
}
