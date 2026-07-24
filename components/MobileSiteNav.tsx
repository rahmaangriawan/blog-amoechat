"use client";

import Link from "next/link";
import { useState } from "react";
import { SIGNUP_URL } from "@/lib/amoechat-content";

type NavItem = {
  label: string;
  href: string;
};

export function MobileSiteNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Tutup menu" : "Buka menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--line)] min-[1060px]:hidden"
      >
        <span className="grid gap-1.5">
          <span className={["h-0.5 w-5 bg-current transition", open ? "translate-y-2 rotate-45" : ""].join(" ")} />
          <span className={["h-0.5 w-5 bg-current transition", open ? "opacity-0" : ""].join(" ")} />
          <span className={["h-0.5 w-5 bg-current transition", open ? "-translate-y-2 -rotate-45" : ""].join(" ")} />
        </span>
      </button>
      {open ? (
        <div className="absolute inset-x-0 top-full border-b border-[var(--line)] bg-white shadow-[0_24px_60px_rgba(8,8,8,0.12)] min-[1060px]:hidden">
          <div className="container grid gap-2 py-5">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-bold hover:bg-[var(--primary-softer)]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={SIGNUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="button mt-2"
            >
              Mulai Gratis
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
