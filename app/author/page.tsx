import type { Metadata } from "next";
import Link from "next/link";
import { getPublicAuthors } from "@/lib/authors";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Author",
    description: "Daftar penulis Amoechat yang membahas WhatsApp marketing, automation, customer engagement, dan API.",
    canonical: "/author",
    ogType: "website",
  });
}

export default async function AuthorIndexPage() {
  const authors = await getPublicAuthors();

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Daftar Penulis Amoechat",
    "description": "Profil penulis yang menyusun panduan WhatsApp marketing, automation, customer engagement, dan integrasi API.",
    "url": "https://blog.amoechat.com/author",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": authors.map((author, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Person",
          "name": author.name,
          "jobTitle": author.role,
          "url": `https://blog.amoechat.com/author/${author.slug}`
        }
      }))
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="container py-12 section-mobile-padding">
        <header className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--primary)]">Author</p>
          <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">Penulis Amoechat</h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">
            Temui tim editorial yang menyusun insight WhatsApp marketing, automation, customer engagement, dan integrasi API.
          </p>
        </header>

        <section className="mt-10 grid gap-5 md:grid-cols-2">
          {authors.map((author) => (
            <Link
              key={author.slug}
              href={`/author/${author.slug}`}
              className="group rounded-2xl border border-[var(--line)] bg-white p-6 transition hover:border-[var(--primary)]"
            >
              <div className="flex gap-4">
                {author.avatarUrl ? (
                  <img src={author.avatarUrl} alt={author.name} className="h-16 w-16 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[var(--primary-strong)] text-2xl font-black text-white">
                    {author.initials}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-black transition group-hover:text-[var(--primary)]">{author.name}</h2>
                  <p className="mt-1 text-sm font-bold text-[var(--primary)]">{author.role}</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{author.bio}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}
