"use client";

import { useState } from "react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";

/**
 * Inline info icon with tooltip shown on hover/focus.
 * Uses native title attribute as a fallback for touch devices + accessibility.
 */
export function InfoTooltip({
  content,
  size = 14,
  className,
}: {
  content: string;
  size?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className={["relative inline-flex", className].filter(Boolean).join(" ")}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={content}
        title={content}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-sky-500 transition hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        onClick={() => setOpen((value) => !value)}
      >
        <HugeIcon icon={InformationCircleIcon} size={size} aria-hidden />
      </button>
      {open ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-[220px] -translate-x-1/2 whitespace-normal rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium leading-snug text-white shadow-lg"
        >
          {content}
          <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-gray-900" aria-hidden />
        </span>
      ) : null}
    </span>
  );
}
