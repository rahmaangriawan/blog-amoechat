"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

type BlogPostActionsProps = {
  articleId: string;
  title: string;
  url: string;
};

export function BlogPostActions({ articleId, title, url }: BlogPostActionsProps) {
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const iconStyle = { color: "#fff" };

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function submitComment(formData: FormData) {
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          name: formData.get("name"),
          email: formData.get("email"),
          body: formData.get("body"),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const issue = Array.isArray(data?.error) ? data.error[0]?.message : data?.error;
        setMessage(issue || "Komentar gagal dikirim. Periksa kembali data kamu.");
        return;
      }

      setMessage("Komentar terkirim dan menunggu persetujuan admin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[var(--primary-softer)] p-5">
        <h2 className="text-lg font-bold">Bagikan artikel</h2>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Bagikan ke Facebook"
            title="Facebook"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#1877F2] !text-white transition hover:bg-[#166fe5] [&_svg]:!text-white"
          >
            <Icon icon="ri:facebook-fill" width={18} height={18} style={iconStyle} />
          </a>
          <a
             href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
             target="_blank"
             rel="noopener noreferrer"
             aria-label="Bagikan ke X"
             title="X/Twitter"
             className="grid h-10 w-10 place-items-center rounded-full bg-black !text-white transition hover:bg-neutral-800 [&_svg]:!text-white"
           >
             <Icon icon="ri:twitter-x-fill" width={17} height={17} style={iconStyle} />
           </a>
           <a
             href={`https://api.whatsapp.com/send?text=${encodedTitle}+${encodedUrl}`}
             target="_blank"
             rel="noopener noreferrer"
             aria-label="Bagikan ke WhatsApp"
             title="WhatsApp"
             className="grid h-10 w-10 place-items-center rounded-full bg-[#25D366] !text-white transition hover:bg-[#1ebe57] [&_svg]:!text-white"
           >
             <Icon icon="ri:whatsapp-fill" width={18} height={18} style={iconStyle} />
           </a>
           <button
             type="button"
             onClick={copyLink}
             aria-label="Salin link"
             title={copied ? "Tersalin" : "Salin Link"}
             className="grid h-10 w-10 place-items-center rounded-full bg-neutral-600 !text-white transition hover:bg-neutral-700 [&_svg]:!text-white"
           >
             <Icon icon={copied ? "ri:check-line" : "ri:link"} width={18} height={18} style={iconStyle} />
           </button>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-[var(--primary-softer)] p-5">
        <h2 className="text-lg font-bold">Kolom komentar</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Komentar akan masuk ke dashboard untuk dimoderasi admin.</p>
        <form action={submitComment} className="mt-5 grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <input name="name" required placeholder="Nama" className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]" />
            <input name="email" required type="email" placeholder="Email" className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]" />
          </div>
          <textarea name="body" required rows={5} placeholder="Tulis komentar..." className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)]" />
          {message ? <p className="text-sm font-semibold text-[var(--primary)]">{message}</p> : null}
          <button disabled={submitting} className="w-fit rounded-full bg-[var(--primary-strong)] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#04652c] disabled:opacity-60">
            {submitting ? "Mengirim..." : "Kirim Komentar"}
          </button>
        </form>
      </section>
    </>
  );
}
