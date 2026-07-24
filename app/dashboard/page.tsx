import Link from "next/link";
import type { Metadata } from "next";
import { BubbleChatDoneIcon, File01Icon, Image01Icon, StudentCardIcon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Ringkasan CMS" };

const cards = [
  { label: "Artikel", href: "/dashboard/articles/posts", icon: File01Icon, key: "articles" },
  { label: "Media", href: "/dashboard/media", icon: Image01Icon, key: "media" },
  { label: "Komentar", href: "/dashboard/comments", icon: BubbleChatDoneIcon, key: "comments" },
  { label: "Pendaftar Magang", href: "/dashboard/internship-applications", icon: StudentCardIcon, key: "internships" },
] as const;

export default async function DashboardPage() {
  const [articles, media, comments, internships, latestArticles] = await Promise.all([
    prisma.article.count({ where: { type: "POST" } }),
    prisma.media.count(),
    prisma.comment.count(),
    prisma.internshipApplication.count(),
    prisma.article.findMany({ where: { type: "POST" }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, title: true, slug: true, isPublished: true, updatedAt: true } }),
  ]);
  const counts = { articles, media, comments, internships };

  return (
    <main className="p-5 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold text-[var(--brand)]">Dashboard</p><h1 className="mt-1 text-3xl font-black">Ringkasan CMS Amoechat</h1><p className="mt-2 text-sm text-[var(--muted)]">Kelola konten, media, komunitas, dan program magang dari satu panel.</p></div>
        <Link className="button" href="/dashboard/articles/posts">Kelola artikel</Link>
      </div>
      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => <Link key={card.key} href={card.href} className="rounded-xl border border-[var(--line)] bg-white p-5 transition hover:border-[var(--primary)]"><div className="flex items-start justify-between"><p className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">{card.label}</p><span className="rounded-lg bg-[var(--primary-softer)] p-2 text-[var(--primary-strong)]"><HugeIcon icon={card.icon} size={18} aria-hidden /></span></div><p className="mt-7 text-3xl font-black">{counts[card.key]}</p></Link>)}
      </section>
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">Artikel terbaru</h2><Link href="/dashboard/articles/posts" className="text-sm font-bold text-[var(--primary-strong)] hover:underline">Lihat semua</Link></div>
        <div className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)] bg-white">
          {latestArticles.length ? latestArticles.map((article) => <Link key={article.id} href={`/dashboard/articles/posts?edit=${article.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-[var(--primary-softer)]"><div><p className="font-bold">{article.title}</p><p className="mt-1 text-xs text-[var(--muted)]">/{article.slug} · {article.updatedAt.toLocaleDateString("id-ID")}</p></div><span className="text-xs font-bold text-[var(--primary-strong)]">{article.isPublished ? "Terbit" : "Draf"}</span></Link>) : <p className="p-6 text-sm text-[var(--muted)]">Belum ada artikel. Mulai dengan membuat konten pertama Amoechat.</p>}
        </div>
      </section>
    </main>
  );
}
