type LegalSection = { title: string; content: string };

export function LegalPage({ title, description, updatedAt, sections }: { title: string; description: string; updatedAt: string; sections: LegalSection[] }) {
  return (
    <main className="bg-[#fbfdfc] pb-20">
      <section className="border-b border-[var(--line)] bg-[linear-gradient(135deg,var(--primary-softer),white)] py-14 md:py-20">
        <div className="container">
          <p className="text-sm font-black text-[var(--primary-strong)]">Dokumen legal Amoechat</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.04em] md:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">{description}</p>
          <p className="mt-6 inline-flex rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold text-[var(--primary-strong)]">Terakhir diperbarui: {updatedAt}</p>
        </div>
      </section>

      <div className="container grid gap-10 py-12 lg:grid-cols-[280px_1fr] lg:py-16">
        <aside className="self-start rounded-2xl border border-[var(--line)] bg-white p-6 lg:sticky lg:top-24">
          <p className="font-black">Daftar isi</p>
          <nav className="mt-5 grid gap-3 text-sm text-[var(--muted)]" aria-label={`Daftar isi ${title}`}>
            {sections.map((section, index) => <a key={section.title} href={`#bagian-${index + 1}`} className="flex gap-3 leading-6 transition-colors hover:text-[var(--primary-strong)]"><span className="font-black text-[var(--primary-strong)]">{String(index + 1).padStart(2, "0")}</span><span>{section.title}</span></a>)}
          </nav>
        </aside>

        <article className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white px-6 md:px-10">
          {sections.map((section, index) => (
            <section key={section.title} id={`bagian-${index + 1}`} className="scroll-mt-28 border-b border-[var(--line)] py-8 last:border-b-0 md:py-10">
              <div className="grid gap-4 md:grid-cols-[52px_1fr] md:gap-6">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--primary-softer)] text-sm font-black text-[var(--primary-strong)]">{String(index + 1).padStart(2, "0")}</span>
                <div><h2 className="text-2xl font-black tracking-tight md:text-3xl">{section.title}</h2><p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">{section.content}</p></div>
              </div>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
