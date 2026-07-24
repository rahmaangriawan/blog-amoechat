"use client";

import dynamic from "next/dynamic";

export const LazyRichTextEditor = dynamic(
  () => import("@/components/RichTextEditor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[300px] rounded-b-xl border border-t-0 border-[var(--line)] bg-white p-4 text-sm text-[var(--muted)]">
        Memuat editor...
      </div>
    ),
  },
);
