"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Cancel01Icon,
  DashboardSquare01Icon,
  Home01Icon,
  Logout01Icon,
  Image01Icon,
  Settings01Icon,
  File01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  BubbleChatDoneIcon,
  UserMultipleIcon,
  StudentCardIcon,
  Note01Icon,
  Notification01Icon,
  ChartAverageIcon,
} from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import type { CmsRole } from "@/lib/auth";

const menuSections: Array<{
  label: string;
  items: Array<{
    label: string;
    href?: string;
    icon: typeof Home01Icon;
    exact?: boolean;
    roles: string[];
    subItems?: Array<{ label: string; href: string }>;
  }>;
}> = [
  {
    label: "Utama",
    items: [
      { label: "Ringkasan", href: "/dashboard", icon: DashboardSquare01Icon, exact: true, roles: ["SUPER_ADMIN", "MEMBER"] },
      { label: "Analytic", href: "/dashboard/analytics", icon: ChartAverageIcon, roles: ["SUPER_ADMIN", "MEMBER"] },
    ],
  },
  {
    label: "Konten & Media",
    items: [
      {
        label: "Artikel",
        icon: File01Icon,
        roles: ["SUPER_ADMIN"],
        subItems: [
          { label: "Postingan", href: "/dashboard/articles/posts" },
          { label: "Kategori", href: "/dashboard/articles/categories" },
          { label: "Halaman", href: "/dashboard/articles/pages" },
        ],
      },
      { label: "Media", href: "/dashboard/media", icon: Image01Icon, roles: ["SUPER_ADMIN"] },
      { label: "Komentar", href: "/dashboard/comments", icon: BubbleChatDoneIcon, roles: ["SUPER_ADMIN"] },
    ],
  },
  {
    label: "Program",
    items: [
      { label: "Pendaftaran Magang", href: "/dashboard/internship-applications", icon: StudentCardIcon, roles: ["SUPER_ADMIN"] },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      {
        label: "Pengaturan",
        icon: Settings01Icon,
        roles: ["SUPER_ADMIN"],
        subItems: [
          { label: "SEO Global", href: "/dashboard/settings/seo" },
          { label: "Kelola API", href: "/dashboard/settings/api" },
        ],
      },
      { label: "Users", href: "/dashboard/users", icon: UserMultipleIcon, roles: ["SUPER_ADMIN"] },
      { label: "Notifikasi", href: "/dashboard/notifications", icon: Notification01Icon, roles: ["SUPER_ADMIN"] },
      { label: "Changelog", href: "/dashboard/changelog", icon: Note01Icon, roles: ["SUPER_ADMIN"] },
    ],
  },
];

function isActivePath(pathname: string, href: string | undefined, exact?: boolean) {
  if (!href) return false;
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({
  item,
  active,
  onClick,
}: {
  item: { label: string; href?: string; icon: typeof Home01Icon; subItems?: { label: string; href: string }[]; exact?: boolean };
  active: boolean;
  onClick?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();

  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isSubActive = hasSubItems && item.subItems!.some((sub) => isActivePath(pathname, sub.href));
  const isExpanded = expanded || Boolean(isSubActive);

  if (hasSubItems) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((value) => (isSubActive && value ? false : !value))}
          className={[
            "group inline-flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-bold transition",
            active || isSubActive
              ? "bg-[var(--primary-strong)] !text-white"
              : "text-[var(--foreground)] hover:bg-[var(--primary-softer)] hover:text-[var(--primary)]",
          ].join(" ")}
        >
          <HugeIcon
            icon={item.icon}
            size={18}
            className={active || isSubActive ? "!text-white" : "text-[var(--muted)] transition group-hover:text-[var(--primary)]"}
            aria-hidden
          />
          <span className={active || isSubActive ? "!text-sm !font-bold !text-white" : "!text-sm !font-bold text-inherit"}>{item.label}</span>
          <HugeIcon
            icon={expanded ? ArrowUp01Icon : ArrowDown01Icon}
              size={14}
              className="ml-auto shrink-0"
              aria-hidden
            />
        </button>
        {isExpanded && item.subItems && (
          <nav className="ml-4 mt-1 grid gap-1" aria-label={`${item.label} submenu`}>
            {item.subItems.map((sub) => {
              const subActive = isActivePath(pathname, sub.href);
              return (
                <a
                  key={sub.href}
                  href={sub.href}
                  onClick={onClick}
                  aria-current={subActive ? "page" : undefined}
                  className={[
                    "group inline-flex h-10 items-center gap-3 rounded-xl px-4 text-sm font-bold transition",
                    subActive
                      ? "bg-[var(--primary-strong)] !text-white"
                      : "text-[var(--foreground)] hover:bg-[var(--primary-softer)] hover:text-[var(--primary)]",
                  ].join(" ")}
                >
                  <span className={subActive ? "!text-white" : "text-inherit"}>{sub.label}</span>
                </a>
              );
            })}
          </nav>
        )}
      </div>
    );
  }

  return (
    <a
      href={item.href || "#"}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "group inline-flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-bold transition",
        active
          ? "bg-[var(--primary-strong)] !text-white"
          : "text-[var(--foreground)] hover:bg-[var(--primary-softer)] hover:text-[var(--primary)]",
      ].join(" ")}
    >
      <HugeIcon
        icon={item.icon}
        size={18}
        className={active ? "!text-white" : "text-[var(--muted)] transition group-hover:text-[var(--primary)]"}
        aria-hidden
      />
      <span className={active ? "!text-white" : "text-inherit"}>{item.label}</span>
    </a>
  );
}

export function DashboardNav({ role }: { role: CmsRole }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Listen for toggle event from DashboardHeader hamburger
  useEffect(() => {
    function handleToggle() {
      setMobileOpen((value) => !value);
    }
    window.addEventListener("dashboard:toggle-sidebar", handleToggle);
    return () => window.removeEventListener("dashboard:toggle-sidebar", handleToggle);
  }, []);

  const filteredSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);

  function renderSection(section: (typeof filteredSections)[number], isMobile: boolean) {
    return (
      <div key={section.label}>
        <div className="px-2 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--muted)]">{section.label}</div>
        <nav className="mt-2 grid gap-1.5" aria-label={`${section.label} navigation`}>
          {section.items.map((item) => {
            const active = item.href ? isActivePath(pathname, item.href, item.exact) : false;
            return (
              <NavItem
                key={item.label}
                item={item}
                active={active}
                onClick={isMobile ? () => setMobileOpen(false) : undefined}
              />
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <>
      <aside className="sticky top-0 hidden h-screen border-r border-[var(--line)] bg-white md:flex md:flex-col">
        <div className="border-b border-[var(--line)] p-5">
          <a href="/dashboard" className="flex min-w-0 items-center gap-3" aria-label="AMOECHAT CMS Dashboard">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--primary-softer)]">
              <Image src="/images/favicon-amoechat.png" alt="" width={30} height={30} className="h-7 w-7 object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-black leading-tight text-[var(--foreground)]">Amoechat Panel</span>
              <span className="block truncate text-xs font-semibold text-[var(--muted)]">Dashboard Marketing</span>
            </span>
          </a>
        </div>

        <div className="sidebar-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto p-5">
          <div>
            <div className="px-2 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--muted)]">Situs</div>
            <nav className="mt-2 grid gap-1.5" aria-label="Situs navigation">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--primary-softer)] hover:text-[var(--primary)]"
              >
                <HugeIcon icon={Home01Icon} size={18} className="text-[var(--muted)] transition group-hover:text-[var(--primary)]" aria-hidden />
                <span>Public</span>
              </a>
            </nav>
          </div>

          {filteredSections.map((section) => renderSection(section, false))}

          <div className="flex-1" />

          <form action="/api/logout" method="post">
            <button
              className="group inline-flex h-11 w-full items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:bg-[var(--primary-softer)] hover:text-[var(--primary)]"
              type="submit"
            >
              <HugeIcon icon={Logout01Icon} size={18} className="text-[var(--muted)] transition group-hover:text-[var(--primary)]" aria-hidden />
              Logout
            </button>
          </form>
        </div>
      </aside>

      <div
        className={[
          "fixed inset-0 z-50 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className={[
            "absolute inset-0 bg-black/35 transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          aria-label="Tutup menu dashboard"
        />
        <div
          className={[
            "absolute left-0 top-0 flex h-full w-[min(84vw,320px)] flex-col border-r border-[var(--line)] bg-white shadow-[18px_0_42px_rgba(8,8,8,0.14)] transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-5">
            <a href="/dashboard" onClick={() => setMobileOpen(false)} className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--primary-softer)]">
                <Image src="/images/favicon-amoechat.png" alt="" width={30} height={30} className="h-7 w-7 object-contain" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-black leading-tight text-[var(--foreground)]">Amoechat Panel</span>
                <span className="block truncate text-xs font-semibold text-[var(--muted)]">Dashboard Marketing</span>
              </span>
            </a>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--line)] text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
              aria-label="Tutup menu dashboard"
            >
              <HugeIcon icon={Cancel01Icon} size={19} aria-hidden />
            </button>
          </div>

          <div className="sidebar-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto p-5">
            <div>
              <div className="px-2 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--muted)]">Situs</div>
              <nav className="mt-2 grid gap-1.5" aria-label="Mobile Situs navigation">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="group inline-flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--primary-softer)] hover:text-[var(--primary)]"
                >
                  <HugeIcon icon={Home01Icon} size={18} className="text-[var(--muted)] transition group-hover:text-[var(--primary)]" aria-hidden />
                  <span>Public</span>
                </a>
              </nav>
            </div>

            {filteredSections.map((section) => renderSection(section, true))}

            <div className="flex-1" />

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--primary-softer)] p-4">
              <p className="text-sm font-black text-[var(--foreground)]">Mode admin</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Kelola konten dan program Amoechat dari satu panel.</p>
            </div>

            <form action="/api/logout" method="post">
              <button
                className="group inline-flex h-11 w-full items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:bg-[var(--primary-softer)] hover:text-[var(--primary)]"
                type="submit"
              >
                <HugeIcon icon={Logout01Icon} size={18} className="text-[var(--muted)] transition group-hover:text-[var(--primary)]" aria-hidden />
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
