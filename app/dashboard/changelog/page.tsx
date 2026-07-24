import type { Metadata } from "next";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { CHANGELOG_TYPE_META, getChangelog } from "@/lib/changelog";
import { requireSuperAdminPage } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Changelog",
};

function formatEntryDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function ChangelogPage() {
  await requireSuperAdminPage();
  const entries = getChangelog();

  return (
    <main className="overflow-x-hidden p-4 md:p-8">
      <div>
        <p className="text-sm font-bold text-[var(--brand)]">CMS</p>
        <h1 className="text-3xl font-bold">Changelog</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Riwayat pembaruan aplikasi Amoechat Panel. Halaman ini hanya dapat diakses dari dashboard admin.
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center text-sm text-[var(--muted)]">
          Belum ada entry changelog.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {entries.map((entry, entryIndex) => (
            <article
              key={`${entry.date}-${entry.version ?? entryIndex}`}
              className="panel grid min-w-0 gap-5 overflow-hidden p-4 sm:p-5 md:grid-cols-[200px_1fr] md:gap-8 md:p-6"
            >
              <aside className="min-w-0 md:border-r md:border-[var(--line)] md:pr-6">
                <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--primary-softer)] px-3 py-1.5 text-xs font-black text-[var(--primary)]">
                  <HugeIcon icon={Calendar03Icon} size={13} aria-hidden />
                  <span className="truncate">{formatEntryDate(entry.date)}</span>
                </div>
                {entry.version ? (
                  <p className="mt-3 font-mono text-sm font-black text-[var(--muted)]">v{entry.version}</p>
                ) : null}
              </aside>

              <div className="min-w-0">
                <h2 className="break-words text-lg font-black leading-tight text-[var(--foreground)] sm:text-xl">{entry.title}</h2>
                {entry.description ? (
                  <p className="mt-2 break-words text-sm leading-6 text-[var(--muted)]">{entry.description}</p>
                ) : null}

                <ul className="mt-5 grid gap-3">
                  {entry.items.map((item, index) => {
                    const meta = CHANGELOG_TYPE_META[item.type];
                    return (
                      <li
                        key={`${entry.date}-${entry.version ?? entryIndex}-${index}`}
                        className="flex min-w-0 flex-col gap-2 rounded-xl border border-[var(--line)] bg-white p-3 sm:flex-row sm:items-start sm:gap-4"
                      >
                        <span
                          className={[
                            "inline-flex w-fit shrink-0 rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
                            meta.badgeClass,
                          ].join(" ")}
                        >
                          {meta.label}
                        </span>
                        <p className="min-w-0 break-words text-sm leading-6 text-[var(--foreground)]">{item.text}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
