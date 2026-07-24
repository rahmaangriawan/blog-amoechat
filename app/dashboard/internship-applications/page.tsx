import type { Metadata } from "next";
import Link from "next/link";
import { Download04Icon, InformationCircleIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { InternshipApplicationsTable } from "@/components/InternshipApplicationsTable";
import { requireSuperAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pendaftaran Magang",
};

export default async function InternshipApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireSuperAdminPage();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { fullName: { contains: q } },
            { email: { contains: q } },
            { phoneNumber: { contains: q } },
            { institutionName: { contains: q } },
            { major: { contains: q } },
            { interestField: { contains: q } },
            { status: { contains: q } },
          ],
        }
      : {}),
  };

  const [totalCount, applications] = await Promise.all([
    (prisma as any).internshipApplication.count(),
    (prisma as any).internshipApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
  ]);

  const applicationItems = applications.map((item: any) => ({
    id: item.id,
    fullName: item.fullName,
    email: item.email,
    phoneNumber: item.phoneNumber,
    institutionName: item.institutionName,
    major: item.major,
    educationLevel: item.educationLevel,
    internshipType: item.internshipType,
    interestField: item.interestField,
    startPeriod: item.startPeriod,
    duration: item.duration,
    portfolioUrl: item.portfolioUrl,
    message: item.message,
    status: item.status,
    sheetSyncedAt: item.sheetSyncedAt ? item.sheetSyncedAt.toISOString() : null,
    sheetSyncError: item.sheetSyncError,
    createdAt: item.createdAt.toISOString(),
  }));

  const exportHref = `/dashboard/internship-applications/export${q || status ? `?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}) }).toString()}` : ""}`;

  return (
    <main className="p-5 md:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold text-[var(--brand)]">Program</p>
          <h1 className="text-3xl font-bold">Pendaftaran Magang</h1>
          <p className="mt-2 text-[var(--muted)]">
            Menampilkan {applications.length} dari {totalCount} pendaftar{q ? ` untuk "${q}"` : ""}.
          </p>
        </div>

        <div className="grid gap-3 lg:min-w-[640px] lg:grid-cols-[1fr_auto]">
          <form className="grid gap-2 sm:grid-cols-[1fr_170px_auto]">
            <div className="relative">
              <HugeIcon icon={Search01Icon} size={20} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
              <input type="search" name="q" defaultValue={q} placeholder="Cari nama, WA, email, sekolah, bidang" className="!h-12 !rounded-xl !pl-12" />
            </div>
            <select name="status" defaultValue={status} className="!h-12 !rounded-xl">
              <option value="">Semua status</option>
              <option value="PENDING">Pending</option>
              <option value="REVIEWED">Direview</option>
              <option value="CONTACTED">Dihubungi</option>
              <option value="ACCEPTED">Diterima</option>
              <option value="REJECTED">Ditolak</option>
            </select>
            <button type="submit" className="inline-flex h-12 items-center justify-center rounded-xl bg-[var(--primary-strong)] px-5 text-sm font-bold text-white transition hover:bg-[#04652c]">
              Cari
            </button>
          </form>
          <Link href={exportHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white px-5 text-sm font-black transition hover:border-[var(--primary)] hover:text-[var(--primary)]">
            <HugeIcon icon={Download04Icon} size={18} aria-hidden />
            Export CSV
          </Link>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
        <HugeIcon icon={InformationCircleIcon} size={17} className="mt-0.5 shrink-0" aria-hidden />
        <div>
          Data utama tersimpan di database. Google Sheets hanya salinan otomatis; jika sync gagal, gunakan tombol Retry Sync di detail pendaftar.
        </div>
      </div>

      {applications.length === 0 ? (
        <section className="panel mt-8 p-12 text-center">
          <p className="text-lg font-bold text-[var(--foreground)]">Data tidak ditemukan</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Coba gunakan kata kunci atau filter status lain.</p>
        </section>
      ) : (
        <InternshipApplicationsTable applications={applicationItems} />
      )}
    </main>
  );
}
