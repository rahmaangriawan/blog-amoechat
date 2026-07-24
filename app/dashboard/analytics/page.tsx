import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ChartAverageIcon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { AnalyticsRangeSelect } from "@/components/AnalyticsRangeSelect";
import { AnalyticsTrafficChart } from "@/components/AnalyticsTrafficChart";
import { isGA4Configured, runGA4Report, type GA4RunReportRow } from "@/lib/ga4";
import { getSessionRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytic",
};

type AnalyticsRange = "7d" | "28d" | "90d";

const RANGE_DAYS: Record<AnalyticsRange, number> = { "7d": 7, "28d": 28, "90d": 90 };

function resolveRange(value: string | undefined): AnalyticsRange {
  if (value === "28d" || value === "90d") return value;
  return "7d";
}

function formatNumber(value: string | number): string {
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(num);
}

function formatDuration(seconds: string | number): string {
  const num = typeof seconds === "number" ? seconds : Number.parseFloat(seconds);
  if (!Number.isFinite(num) || num <= 0) return "0 dtk";
  const minutes = Math.floor(num / 60);
  const remainder = Math.round(num % 60);
  if (minutes <= 0) return `${remainder} dtk`;
  return `${minutes}m ${remainder}d`;
}

function formatPercent(value: string | number): string {
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0%";
  return `${(num * 100).toFixed(1)}%`;
}

function formatDateLabel(value: string): string {
  if (!value || value.length !== 8) return value;
  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);
  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

async function loadAnalyticsPayload(range: AnalyticsRange) {
  const days = RANGE_DAYS[range];
  const configured = await isGA4Configured();
  const rangePayload = { startDate: `${days}daysAgo`, endDate: "today" };

  let summaryRows: GA4RunReportRow[] | undefined;
  let dailyRows: GA4RunReportRow[] | undefined;
  let topPagesRows: GA4RunReportRow[] | undefined;
  let sourceRows: GA4RunReportRow[] | undefined;
  let deviceRows: GA4RunReportRow[] | undefined;
  let fetchError: string | null = null;

  if (configured) {
    const publicPathFilter = {
      notExpression: {
        filter: {
          fieldName: "pagePath",
          stringFilter: {
            matchType: "FULL_REGEXP" as const,
            value: "^/(dashboard|login)(/.*)?$",
          },
        },
      },
    };

    try {
      const [summary, daily, topPages, sources, devices] = await Promise.all([
        runGA4Report({
          metrics: [
            { name: "activeUsers" },
            { name: "newUsers" },
            { name: "sessions" },
            { name: "screenPageViews" },
            { name: "averageSessionDuration" },
            { name: "engagementRate" },
          ],
          dateRanges: [rangePayload],
          dimensionFilter: publicPathFilter,
        }),
        runGA4Report({
          dimensions: [{ name: "date" }],
          metrics: [{ name: "activeUsers" }, { name: "sessions" }],
          dateRanges: [rangePayload],
          orderBys: [{ dimension: { dimensionName: "date" } }],
          limit: 90,
          dimensionFilter: publicPathFilter,
        }),
        runGA4Report({
          dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
          metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
          dateRanges: [rangePayload],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 10,
          dimensionFilter: publicPathFilter,
        }),
        runGA4Report({
          dimensions: [{ name: "sessionSourceMedium" }],
          metrics: [{ name: "sessions" }, { name: "activeUsers" }],
          dateRanges: [rangePayload],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: 8,
          dimensionFilter: publicPathFilter,
        }),
        runGA4Report({
          dimensions: [{ name: "deviceCategory" }],
          metrics: [{ name: "sessions" }, { name: "activeUsers" }],
          dateRanges: [rangePayload],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          dimensionFilter: publicPathFilter,
        }),
      ]);

      summaryRows = summary.rows;
      dailyRows = daily.rows;
      topPagesRows = topPages.rows;
      sourceRows = sources.rows;
      deviceRows = devices.rows;
    } catch (error) {
      fetchError = error instanceof Error ? error.message : "Gagal memuat data GA4.";
    }
  }

  return { configured, summaryRows, dailyRows, topPagesRows, sourceRows, deviceRows, fetchError };
}

const getCachedAnalyticsPayload = unstable_cache(loadAnalyticsPayload, ["dashboard-ga4-analytics"], { revalidate: 600 });

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  // Auth is enforced by layout; any authenticated user can see this page
  const role = await getSessionRole();
  if (!role) return null;

  const params = await searchParams;
  const range = resolveRange(params.range);
  const days = RANGE_DAYS[range];
  const { configured, summaryRows, dailyRows, topPagesRows, sourceRows, deviceRows, fetchError } = await getCachedAnalyticsPayload(range);

  const summaryMetrics = summaryRows?.[0]?.metricValues ?? [];
  const [activeUsers, newUsers, sessions, pageViews, avgSessionDuration, engagementRate] = summaryMetrics;

  const trendData = (dailyRows ?? []).map((row) => ({
    label: formatDateLabel(row.dimensionValues[0]?.value ?? ""),
    users: Number.parseFloat(row.metricValues[0]?.value ?? "0") || 0,
    sessions: Number.parseFloat(row.metricValues[1]?.value ?? "0") || 0,
  }));

  const totalTrendUsers = trendData.reduce((acc, row) => acc + row.users, 0);

  return (
    <main className="p-5 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold text-[var(--brand)]">Dashboard</p>
          <h1 className="text-3xl font-bold">Analytic</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Statistik trafik situs dari Google Analytics 4. Data diperbarui hampir real-time setiap kali halaman dibuka.
          </p>
        </div>
        <AnalyticsRangeSelect currentRange={range} />
      </div>

      {!configured ? (
        <section className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <HugeIcon icon={InformationCircleIcon} size={18} className="mt-0.5 shrink-0" aria-hidden />
          <div>
            <p className="font-black">Google Analytics belum terhubung</p>
            <p className="mt-1 leading-5">
              Admin perlu mengisi <strong>GA4 Property ID</strong> dan upload <strong>Service Account JSON</strong> di halaman{" "}
              {role === "SUPER_ADMIN" ? (
                <Link href="/dashboard/settings/api?tab=google" className="underline font-black">Kelola API</Link>
              ) : (
                <span className="font-black">Kelola API</span>
              )}
              . Pastikan email service account ditambahkan sebagai Viewer di GA4 Admin → Property Access Management.
            </p>
          </div>
        </section>
      ) : null}

      {fetchError ? (
        <section className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <HugeIcon icon={InformationCircleIcon} size={18} className="mt-0.5 shrink-0" aria-hidden />
          <div>
            <p className="font-black">Gagal memuat data GA4</p>
            <p className="mt-1 leading-5 break-words">{fetchError}</p>
          </div>
        </section>
      ) : null}

      {configured && !fetchError ? (
        <>
          <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Pengguna aktif" value={formatNumber(activeUsers?.value ?? "0")} />
            <StatCard label="Pengguna baru" value={formatNumber(newUsers?.value ?? "0")} />
            <StatCard label="Sesi" value={formatNumber(sessions?.value ?? "0")} />
            <StatCard label="Tayangan halaman" value={formatNumber(pageViews?.value ?? "0")} />
            <StatCard label="Durasi rata-rata" value={formatDuration(avgSessionDuration?.value ?? "0")} />
            <StatCard label="Engagement rate" value={formatPercent(engagementRate?.value ?? "0")} />
          </section>

          <section className="mt-6 panel p-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Tren pengunjung</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Pengguna aktif & sesi selama {days} hari terakhir.
                </p>
              </div>
              <div className="rounded-full bg-[var(--primary-soft)] px-4 py-2 text-sm font-black text-[var(--primary)]">
                {formatNumber(totalTrendUsers)} total pengguna
              </div>
            </div>
            <AnalyticsTrafficChart data={trendData} />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <TableCard
              title="Halaman terlaris"
              headers={["Halaman", "Tayangan", "Pengguna"]}
              rows={(topPagesRows ?? []).map((row) => [
                <div key="page" className="min-w-0">
                  <span className="block truncate font-black text-[var(--foreground)]">
                    {row.dimensionValues[1]?.value || "(tanpa judul)"}
                  </span>
                  <span className="block truncate text-xs text-[var(--muted)]">{row.dimensionValues[0]?.value}</span>
                </div>,
                formatNumber(row.metricValues[0]?.value ?? "0"),
                formatNumber(row.metricValues[1]?.value ?? "0"),
              ])}
            />
            <TableCard
              title="Sumber trafik"
              headers={["Source / Medium", "Sesi", "Pengguna"]}
              rows={(sourceRows ?? []).map((row) => [
                <span key="src" className="font-black text-[var(--foreground)]">{row.dimensionValues[0]?.value || "(direct)"}</span>,
                formatNumber(row.metricValues[0]?.value ?? "0"),
                formatNumber(row.metricValues[1]?.value ?? "0"),
              ])}
            />
          </section>

          <section className="mt-6 panel p-5">
            <h2 className="text-xl font-bold">Perangkat pengunjung</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {(deviceRows ?? []).slice(0, 3).map((row) => (
                <div key={row.dimensionValues[0]?.value} className="rounded-xl border border-[var(--line)] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                    {row.dimensionValues[0]?.value ?? "-"}
                  </p>
                  <p className="mt-2 text-2xl font-black text-[var(--foreground)]">
                    {formatNumber(row.metricValues[0]?.value ?? "0")}
                  </p>
                  <p className="text-xs text-[var(--muted)]">sesi</p>
                </div>
              ))}
              {!deviceRows || deviceRows.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Belum ada data perangkat.</p>
              ) : null}
            </div>
          </section>
        </>
      ) : null}

      {configured && !fetchError && !summaryRows ? (
        <section className="mt-6 panel p-10 text-center">
          <HugeIcon icon={ChartAverageIcon} size={28} className="mx-auto text-[var(--primary)]" aria-hidden />
          <p className="mt-3 text-lg font-bold text-[var(--foreground)]">Belum ada data trafik</p>
          <p className="mt-1 text-sm text-[var(--muted)]">GA4 belum menerima event untuk rentang ini.</p>
        </section>
      ) : null}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function TableCard({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-[var(--line)] p-5">
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="p-6 text-sm text-[var(--muted)]">Belum ada data.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--primary-softer)] text-left text-xs font-black uppercase tracking-wide text-[var(--muted)]">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-5 py-3 font-black">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-5 py-3 align-top">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
