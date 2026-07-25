import Link from "next/link";
import { faqItems, SIGNUP_URL } from "@/lib/amoechat-content";
import { buildStaticPageMetadata } from "@/lib/metadata";
import { safeJsonLd } from "@/lib/safe-json-ld";

export const metadata = buildStaticPageMetadata({
  title: "FAQ",
  description: "Jawaban tentang WhatsApp Official, QR, paket, keamanan, upgrade, dan setup Amoechat.",
  canonical: "/faq",
});

export default function FaqPage() {
  const schema={"@context":"https://schema.org","@type":"FAQPage",mainEntity:faqItems.map(item=>({"@type":"Question",name:item.question,acceptedAnswer:{"@type":"Answer",text:item.answer}}))};
  return <main className="py-16 md:py-24"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(schema)}}/><div className="container grid gap-12 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="text-sm font-black text-[var(--primary-strong)]">FAQ</p><h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Jawaban sebelum Anda mulai</h1><p className="mt-5 leading-8 text-[var(--muted)]">Pelajari channel, paket, dan keamanan Amoechat.</p><Link href={SIGNUP_URL} target="_blank" rel="noopener noreferrer" className="button mt-8">Mulai gratis</Link></div><div className="grid gap-3">{faqItems.map(item=><details key={item.question} className="rounded-xl border border-[var(--line)] bg-white p-5"><summary className="cursor-pointer list-none font-black">{item.question}</summary><p className="mt-4 leading-7 text-[var(--muted)]">{item.answer}</p></details>)}</div></div></main>;
}
