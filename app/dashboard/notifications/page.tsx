import type { Metadata } from "next";
import Link from "next/link";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifikasi",
};

const TYPE_BADGE: Record<string, string> = {
  INTERNSHIP_NEW: "bg-purple-100 text-purple-700",
};

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireSuperAdminPage();
  const params = await searchParams;
  const where = params.type ? { type: params.type } : {};

  const items = await (prisma as any).notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <main className="p-5 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[var(--brand)]">CMS</p>
          <h1 className="text-3xl font-bold">Notifikasi</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Riwayat aktivitas sistem untuk admin.</p>
        </div>
      </div>

      <form className="mt-6 grid gap-3 md:grid-cols-[200px_120px]">
        <select name="type" defaultValue={params.type ?? ""}>
          <option value="">Semua jenis</option>
          <option value="INTERNSHIP_NEW">Pendaftaran Magang</option>
        </select>
        <button type="submit" className="button">Filter</button>
      </form>

      <section className="mt-6 grid gap-3">
        {items.length === 0 ? (
          <p className="panel p-8 text-center text-sm text-[var(--muted)]">Belum ada notifikasi.</p>
        ) : null}

        {items.map((item: any) => {
          const badge = TYPE_BADGE[item.type] ?? "bg-gray-100 text-gray-700";
          const content = (
            <article className="panel flex items-start gap-3 p-4 transition hover:border-[var(--primary)]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--primary-softer)] text-[var(--primary)]">
                <HugeIcon icon={Notification01Icon} size={18} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-black text-[var(--foreground)]">{item.title}</p>
                  <span className={["rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide", badge].join(" ")}>
                    {item.type}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.message}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">{formatDateTime(item.createdAt)}</p>
              </div>
            </article>
          );
          return (
            <div key={item.id}>
              {item.link ? <Link href={item.link}>{content}</Link> : content}
            </div>
          );
        })}
      </section>
    </main>
  );
}
