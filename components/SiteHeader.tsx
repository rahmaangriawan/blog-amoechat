import Image from "next/image";
import Link from "next/link";
import { SIGNUP_URL } from "@/lib/amoechat-content";
import { MobileSiteNav } from "@/components/MobileSiteNav";

const navItems = [
  { label: "Beranda", href: "/" },
  { label: "Fitur", href: "/fitur" },
  { label: "Harga", href: "/paket" },
  { label: "Cara Kerja", href: "/cara-kerja" },
  { label: "Blog", href: "/blog" },
];

export function SiteHeader({ initialLogo }: { initialLogo?: string }) {
  const headerLogo = initialLogo || "/images/logo-amoechat.webp";

  return (
    <header className="sticky top-0 z-[9999] border-b border-[var(--line)] bg-white/95 backdrop-blur">
      <div className="container flex min-h-[76px] items-center justify-between gap-4">
        <Link href="/" aria-label="Amoechat Beranda" className="shrink-0 transition hover:opacity-80">
          <Image src={headerLogo} alt="Amoechat" width={170} height={44} priority sizes="170px" className="h-10 w-auto object-contain" />
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-bold min-[1060px]:flex">
          {navItems.map((item) => <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-full px-3 py-2 transition hover:bg-[var(--primary-softer)] hover:text-[var(--primary-strong)]">{item.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-3 min-[1060px]:flex">
          <Link href={SIGNUP_URL} target="_blank" rel="noopener noreferrer" className="button whitespace-nowrap">Mulai Gratis</Link>
        </div>
        <MobileSiteNav items={navItems} />
      </div>
    </header>
  );
}
