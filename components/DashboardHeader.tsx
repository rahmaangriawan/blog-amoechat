"use client";

import { useEffect, useRef, useState } from "react";
import { Logout01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { NotificationBell } from "@/components/NotificationBell";
import type { CmsRole } from "@/lib/auth";

function getInitials(input: string): string {
  const clean = input.trim();
  if (!clean) return "U";
  if (clean.includes("@")) {
    return clean.charAt(0).toUpperCase();
  }
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

export function DashboardHeader({
  role,
  name,
  email,
}: {
  role: CmsRole;
  name: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const initials = getInitials(name || email);

  function openSidebar() {
    window.dispatchEvent(new CustomEvent("dashboard:toggle-sidebar"));
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-[var(--line)] bg-white/95 px-4 backdrop-blur md:h-16 md:justify-end md:px-8">
      {/* Hamburger — mobile only, inside header */}
      <button
        type="button"
        onClick={openSidebar}
        className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--line)] text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] md:hidden"
        aria-label="Buka menu dashboard"
      >
        <HugeIcon icon={Menu01Icon} size={20} aria-hidden />
      </button>

      <div className="flex shrink-0 items-center gap-2">
        {role === "SUPER_ADMIN" ? <NotificationBell /> : null}

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-full bg-[var(--primary-strong)] text-sm font-black !text-white transition hover:bg-[#04652c] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
            aria-label="Menu akun"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            {initials}
          </button>

          {open ? (
            <div
              role="menu"
              className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_18px_42px_rgba(8,8,8,0.12)]"
            >
              <div className="flex items-center gap-3 border-b border-[var(--line)] p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--primary-strong)] text-xs font-black !text-white">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[var(--foreground)]">{name || email || "Pengguna"}</p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {role === "SUPER_ADMIN" ? "Super Admin" : role === "ADMIN" ? "Admin" : role === "MARKETING" ? "Marketing" : "Member"}
                  </p>
                </div>
              </div>
              <form action="/api/logout" method="post">
                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center gap-3 px-4 text-left text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--primary-softer)] hover:text-[var(--primary)]"
                >
                  <HugeIcon icon={Logout01Icon} size={16} aria-hidden />
                  Logout
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
