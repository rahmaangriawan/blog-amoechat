"use client";

import { useState } from "react";
import { CheckmarkCircle01Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";

export function CopyCodeButton({ code, label = "Salin kode" }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback: no-op
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      title={copied ? "Tersalin" : label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line)] text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
    >
      <HugeIcon icon={copied ? CheckmarkCircle01Icon : Copy01Icon} size={13} aria-hidden />
    </button>
  );
}
