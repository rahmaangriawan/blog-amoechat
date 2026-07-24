"use client";

import { useState, type ReactNode } from "react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";

export function Accordion({
  title,
  children,
  defaultOpen = true,
  className,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={["rounded-2xl bg-[var(--primary-softer)]", className].filter(Boolean).join(" ")}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="text-lg font-black text-[var(--foreground)]">{title}</span>
        <HugeIcon
          icon={ArrowDown01Icon}
          size={18}
          className={[
            "shrink-0 text-[var(--foreground)] transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        />
      </button>
      <div
        className={[
          "grid transition-all duration-200 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5">{children}</div>
        </div>
      </div>
    </section>
  );
}
