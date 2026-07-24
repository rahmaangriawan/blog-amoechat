"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ArrowDown01Icon,
  Briefcase01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Link01Icon,
  Mail01Icon,
  RefreshIcon,
  SmartPhone01Icon,
  StudentCardIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { retryInternshipSheetSync, updateInternshipApplicationStatus } from "@/lib/actions";

const statusOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "REVIEWED", label: "Direview" },
  { value: "CONTACTED", label: "Dihubungi" },
  { value: "ACCEPTED", label: "Diterima" },
  { value: "REJECTED", label: "Ditolak" },
];

export type InternshipApplicationListItem = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  institutionName: string;
  major: string | null;
  educationLevel: string;
  internshipType: string;
  interestField: string;
  startPeriod: string | null;
  duration: string | null;
  portfolioUrl: string | null;
  message: string | null;
  status: string;
  sheetSyncedAt: string | null;
  sheetSyncError: string | null;
  createdAt: string;
};

export function InternshipApplicationsTable({ applications }: { applications: InternshipApplicationListItem[] }) {
  const [items, setItems] = useState(applications);
  const [selected, setSelected] = useState<InternshipApplicationListItem | null>(null);

  useEffect(() => setItems(applications), [applications]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
    }

    if (selected) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selected]);

  return (
    <>
      <section className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
        <div className="hidden grid-cols-[1.1fr_1fr_0.9fr_1fr_0.9fr_110px] gap-4 border-b border-[var(--line)] bg-[var(--primary-softer)] px-5 py-3 text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)] lg:grid">
          <span>Nama</span>
          <span>Sekolah/Kampus</span>
          <span>WhatsApp</span>
          <span>Bidang</span>
          <span>Tanggal</span>
          <span className="text-right">Sheets</span>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {items.map((item) => (
            <ApplicationRow key={item.id} item={item} onOpen={() => setSelected(item)} />
          ))}
        </div>
      </section>

      {selected ? (
        <ApplicationDetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(status) => {
            setSelected((current) => (current ? { ...current, status } : current));
            setItems((current) => current.map((item) => (item.id === selected.id ? { ...item, status } : item)));
          }}
          onSheetSync={() => {
            const syncedAt = new Date().toISOString();
            setSelected((current) => (current ? { ...current, sheetSyncedAt: syncedAt, sheetSyncError: null } : current));
            setItems((current) => current.map((item) => (item.id === selected.id ? { ...item, sheetSyncedAt: syncedAt, sheetSyncError: null } : item)));
          }}
        />
      ) : null}
    </>
  );
}

function ApplicationRow({ item, onOpen }: { item: InternshipApplicationListItem; onOpen: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="grid cursor-pointer gap-3 px-4 py-4 transition hover:bg-[var(--primary-softer)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)] lg:grid-cols-[1.1fr_1fr_0.9fr_1fr_0.9fr_110px] lg:items-center lg:gap-4 lg:px-5"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
          <HugeIcon icon={StudentCardIcon} size={20} aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-black text-[var(--foreground)]">{item.fullName}</p>
            <span className={["rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider", getStatusBadgeClass(item.status)].join(" ")}>
              {getStatusLabel(item.status)}
            </span>
          </div>
          <p className="mt-1 truncate text-xs font-semibold text-[var(--muted)]">{item.email}</p>
        </div>
      </div>
      <TableCell label="Sekolah/Kampus">{item.institutionName}</TableCell>
      <TableCell label="WhatsApp">{item.phoneNumber}</TableCell>
      <TableCell label="Bidang">{item.interestField}</TableCell>
      <TableCell label="Tanggal">{formatDateTime(item.createdAt)}</TableCell>
      <div className="flex justify-start lg:justify-end">
        <span className={["rounded-full px-3 py-1 text-xs font-black", item.sheetSyncedAt ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"].join(" ")}>
          {item.sheetSyncedAt ? "Tersync" : "Pending"}
        </span>
      </div>
    </div>
  );
}

function ApplicationDetailModal({
  item,
  onClose,
  onStatusChange,
  onSheetSync,
}: {
  item: InternshipApplicationListItem;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onSheetSync: () => void;
}) {
  const [status, setStatus] = useState(item.status);
  const [message, setMessage] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSyncPending, startSyncTransition] = useTransition();

  function saveStatus() {
    setMessage("");
    const formData = new FormData();
    formData.set("id", item.id);
    formData.set("status", status);
    startTransition(async () => {
      const result = await updateInternshipApplicationStatus(formData);
      if (result?.success) {
        onStatusChange(status);
        setMessage("Status berhasil diperbarui.");
      } else {
        setMessage(result?.error || "Gagal memperbarui status.");
      }
    });
  }

  function retrySync() {
    setSyncMessage("");
    const formData = new FormData();
    formData.set("id", item.id);
    startSyncTransition(async () => {
      const result = await retryInternshipSheetSync(formData);
      if (result?.success) {
        onSheetSync();
        setSyncMessage("Data berhasil dikirim ke Google Sheets.");
      } else {
        setSyncMessage(result?.error || "Gagal sync ke Google Sheets.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="panel max-h-[88vh] w-full max-w-4xl overflow-hidden bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] p-5">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--primary)]">Detail Pendaftaran Magang</p>
            <h2 className="mt-1 text-3xl font-black">{item.fullName}</h2>
            <p className="mt-1 text-sm font-semibold text-[var(--muted)]">{formatDateTime(item.createdAt)}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--line)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]" aria-label="Tutup detail">
            <HugeIcon icon={Cancel01Icon} size={20} aria-hidden />
          </button>
        </div>

        <div className="custom-scrollbar max-h-[calc(88vh-110px)] overflow-y-auto p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <DetailCard icon={SmartPhone01Icon} label="WhatsApp" value={item.phoneNumber} />
            <DetailCard icon={Mail01Icon} label="Email" value={item.email} />
            <DetailCard icon={StudentCardIcon} label="Sekolah / Kampus" value={item.institutionName} />
            <DetailCard icon={StudentCardIcon} label="Jurusan" value={item.major || "-"} />
            <DetailCard icon={Briefcase01Icon} label="Jenjang" value={item.educationLevel} />
            <DetailCard icon={Briefcase01Icon} label="Tipe Magang" value={getInternshipTypeLabel(item.internshipType)} />
            <DetailCard icon={Briefcase01Icon} label="Bidang Minat" value={item.interestField} />
            <DetailCard icon={ArrowDown01Icon} label="Periode & Durasi" value={[item.startPeriod, item.duration].filter(Boolean).join(" - ") || "-"} />
          </div>

          {item.portfolioUrl ? (
            <a href={item.portfolioUrl} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--line)] p-4 text-sm font-black text-[var(--primary)] transition hover:border-[var(--primary)]">
              <HugeIcon icon={Link01Icon} size={18} aria-hidden />
              Buka Portfolio / CV
            </a>
          ) : null}

          {item.message ? (
            <section className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">Pesan</p>
              <p className="mt-2 text-sm leading-relaxed">{item.message}</p>
            </section>
          ) : null}

          <section className="mt-5 grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--primary-softer)] p-4 md:grid-cols-2">
            <div>
              <label className="grid gap-2 text-sm font-black">
                Status
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={saveStatus} disabled={isPending} className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--primary-strong)] px-5 text-sm font-black text-white transition hover:bg-[#04652c] disabled:opacity-60">
                {isPending ? "Menyimpan..." : "Simpan Status"}
              </button>
              {message ? <p className="mt-2 text-xs font-bold text-[var(--muted)]">{message}</p> : null}
            </div>
            <div className="rounded-xl bg-white p-4">
              <p className="text-sm font-black">Google Sheets</p>
              <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                {item.sheetSyncedAt ? `Tersync ${formatDateTime(item.sheetSyncedAt)}` : item.sheetSyncError || "Belum tersync atau spreadsheet belum dikonfigurasi."}
              </p>
              <button type="button" onClick={retrySync} disabled={isSyncPending} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] text-sm font-black transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-60">
                <HugeIcon icon={RefreshIcon} size={17} aria-hidden />
                {isSyncPending ? "Sync..." : "Retry Sync"}
              </button>
              {syncMessage ? <p className="mt-2 text-xs font-bold text-[var(--muted)]">{syncMessage}</p> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ icon, label, value }: { icon: typeof UserIcon; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-[var(--line)] bg-white p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--primary-softer)] text-[var(--primary)]">
        <HugeIcon icon={icon} size={19} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.1em] text-[var(--muted)]">{label}</p>
        <p className="mt-1 break-words text-sm font-black">{value}</p>
      </div>
    </div>
  );
}

function TableCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[var(--muted)] lg:hidden">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold text-[var(--foreground)] lg:mt-0">{children}</p>
    </div>
  );
}

function getStatusLabel(value: string) {
  return statusOptions.find((option) => option.value === value)?.label || value;
}

function getStatusBadgeClass(value: string) {
  if (value === "ACCEPTED") return "bg-emerald-50 text-emerald-700";
  if (value === "REJECTED") return "bg-red-50 text-red-700";
  if (value === "CONTACTED") return "bg-sky-50 text-sky-700";
  if (value === "REVIEWED") return "bg-amber-50 text-amber-700";
  return "bg-[var(--primary-softer)] text-[var(--primary)]";
}

function getInternshipTypeLabel(value: string) {
  if (value === "ONSITE") return "Onsite";
  if (value === "REMOTE") return "Remote / Online";
  if (value === "HYBRID") return "Hybrid";
  return value;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
