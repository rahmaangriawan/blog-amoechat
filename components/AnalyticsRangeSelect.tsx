"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const RANGES: Array<{ value: "7d" | "28d" | "90d"; label: string }> = [
  { value: "7d", label: "7 hari" },
  { value: "28d", label: "28 hari" },
  { value: "90d", label: "90 hari" },
];

export function AnalyticsRangeSelect({ currentRange }: { currentRange: "7d" | "28d" | "90d" }) {
  const pathname = usePathname();
  return (
    <div className="inline-flex rounded-full border border-[var(--line)] bg-white p-1 text-xs font-black">
      {RANGES.map((range) => {
        const active = currentRange === range.value;
        return (
          <Link
            key={range.value}
            href={`${pathname}?range=${range.value}`}
            className={[
              "inline-flex h-9 items-center rounded-full px-4 transition",
              active
                ? "bg-[var(--primary-strong)] !text-white"
                : "text-[var(--foreground)] hover:bg-[var(--primary-softer)] hover:text-[var(--primary)]",
            ].join(" ")}
          >
            {range.label}
          </Link>
        );
      })}
    </div>
  );
}
