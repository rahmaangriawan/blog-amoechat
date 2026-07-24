"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight02Icon,
  Briefcase01Icon,
  Building01Icon,
  CheckmarkCircle01Icon,
  Link01Icon,
  Mail01Icon,
  SmartPhone01Icon,
  StudentCardIcon,
  UserIcon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";

const educationLevels = [
  { value: "SMK", label: "SMK" },
  { value: "D3", label: "D3" },
  { value: "D4", label: "D4" },
  { value: "S1", label: "S1" },
  { value: "UMUM", label: "Umum" },
];

const internshipTypes = [
  { value: "ONSITE", label: "Onsite" },
  { value: "REMOTE", label: "Remote / Online" },
  { value: "HYBRID", label: "Hybrid" },
];

const interestFields = [
  "Product & API",
  "Automation & Workflow",
  "Content & SEO",
  "Digital Marketing",
  "Sales B2B",
  "Customer Success",
  "Design & Multimedia",
];

export function InternshipApplicationForm({ whatsappHref }: { whatsappHref: string }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("submitting");
    setMessage("");

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch("/api/internship/apply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setStatus("error");
      setMessage(result.error || "Pendaftaran belum bisa dikirim. Coba lagi nanti.");
      return;
    }

    form.reset();
    setStatus("success");
    setMessage("Pendaftaran magang berhasil dikirim. Tim kami akan meninjau data kamu dan menghubungi lewat WhatsApp.");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-7 rounded-[24px] border border-[var(--line)] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-7">
      <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
        <Field label="Nama Lengkap" icon={UserIcon}>
          <input name="fullName" required placeholder="Masukkan nama lengkap" />
        </Field>
        <Field label="Nomor WhatsApp" icon={SmartPhone01Icon}>
          <input name="phoneNumber" required inputMode="tel" placeholder="08xxxxxxxxxx" />
        </Field>
        <Field label="Email Aktif" icon={Mail01Icon}>
          <input name="email" required type="email" placeholder="nama@email.com" />
        </Field>
        <Field label="Sekolah / Kampus" icon={Building01Icon}>
          <input name="institutionName" required placeholder="Nama sekolah atau kampus" />
        </Field>
        <Field label="Jurusan" icon={StudentCardIcon}>
          <input name="major" placeholder="RPL, Multimedia, Manajemen, dll." />
        </Field>
        <Field label="Jenjang" icon={StudentCardIcon}>
          <select name="educationLevel" required defaultValue="">
            <option value="" disabled>Pilih jenjang</option>
            {educationLevels.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Tipe Magang" icon={Briefcase01Icon}>
          <select name="internshipType" required defaultValue="">
            <option value="" disabled>Pilih tipe magang</option>
            {internshipTypes.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Bidang Minat" icon={Briefcase01Icon}>
          <select name="interestField" required defaultValue="">
            <option value="" disabled>Pilih bidang minat</option>
            {interestFields.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Periode Mulai" icon={ArrowRight02Icon}>
          <input name="startPeriod" placeholder="Contoh: Juli 2026" />
        </Field>
        <Field label="Durasi" icon={ArrowRight02Icon}>
          <input name="duration" placeholder="Contoh: 3 bulan / 6 bulan" />
        </Field>
      </div>

      <Field label="Link Portfolio / CV" icon={Link01Icon}>
        <input name="portfolioUrl" type="url" placeholder="https://..." />
      </Field>

      <label className="grid gap-3 text-sm font-bold">
        Pesan Tambahan
        <textarea name="message" rows={4} placeholder="Ceritakan singkat tujuan magang atau pengalaman kamu." className="resize-y" />
      </label>

      {message ? (
        <div className={[
          "flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold",
          status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700",
        ].join(" ")}>
          <HugeIcon icon={CheckmarkCircle01Icon} size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>{message}</span>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary-strong)] px-7 text-sm font-black !text-white transition hover:bg-[#04652c] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "Mengirim..." : "Kirim Pendaftaran"}
        </button>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-[var(--primary)] px-6 text-sm font-black !text-[var(--primary)] transition hover:bg-[var(--primary-softer)]"
        >
          <HugeIcon icon={WhatsappIcon} size={18} aria-hidden />
          Tanya via WhatsApp
        </a>
      </div>
    </form>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: typeof UserIcon;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-3 text-sm font-bold">
      {label}
      <span className="relative block">
        <HugeIcon icon={icon} size={17} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
        <span className="block [&>input]:!pl-11 [&>select]:!pl-11">{children}</span>
      </span>
    </label>
  );
}
