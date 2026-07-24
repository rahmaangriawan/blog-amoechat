"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { markNotificationsSeen } from "@/lib/actions";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  createdAt: string;
};

function formatRelative(value: string) {
  const now = Date.now();
  const then = new Date(value).getTime();
  const diff = now - then;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "baru saja";
  if (diff < hour) return `${Math.floor(diff / minute)} menit lalu`;
  if (diff < day) return `${Math.floor(diff / hour)} jam lalu`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(value));
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  async function fetchData() {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/notifications?limit=10", { cache: "no-store" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErrorMessage(data?.error ?? "Gagal memuat notifikasi.");
        return;
      }
      const data = await response.json();
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      setErrorMessage("Gagal memuat notifikasi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleMarkSeen() {
    startTransition(async () => {
      try {
        await markNotificationsSeen();
        setUnread(0);
      } catch {
        setErrorMessage("Gagal memperbarui status notifikasi.");
      }
    });
  }

  function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) fetchData();
    if (next && unread > 0) handleMarkSeen();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notifikasi"
        aria-expanded={open}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--line)] bg-white text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
      >
        <HugeIcon icon={Notification01Icon} size={20} aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--primary-strong)] px-1 text-[10px] font-black !text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed left-1/2 top-[72px] z-50 w-[calc(100vw-2rem)] max-w-[380px] -translate-x-1/2 overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_20px_50px_rgba(8,8,8,0.14)] sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-[min(380px,92vw)] sm:max-w-none sm:translate-x-0">
          <div className="flex items-center justify-between border-b border-[var(--line)] p-4">
            <div>
              <p className="text-sm font-black text-[var(--foreground)]">Notifikasi</p>
              <p className="text-xs text-[var(--muted)]">{unread > 0 ? `${unread} belum dibaca` : "Semua sudah dibaca"}</p>
            </div>
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-black text-[var(--primary)] hover:underline"
            >
              Lihat semua
            </Link>
          </div>

          <div className="custom-scrollbar max-h-[60vh] overflow-y-auto">
            {errorMessage ? (
              <div className="grid gap-3 p-5 text-center">
                <p className="text-sm font-bold text-[var(--foreground)]">{errorMessage}</p>
                <button
                  type="button"
                  onClick={fetchData}
                  className="mx-auto rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-xs font-black text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  Coba lagi
                </button>
              </div>
            ) : loading && items.length === 0 ? (
              <p className="p-5 text-center text-sm text-[var(--muted)]">Memuat...</p>
            ) : items.length === 0 ? (
              <p className="p-8 text-center text-sm text-[var(--muted)]">Belum ada notifikasi.</p>
            ) : (
              <ul className="divide-y divide-[var(--line)]">
                {items.map((item) => {
                  const content = (
                    <div className="grid gap-1 p-4 transition hover:bg-[var(--primary-softer)]">
                      <p className="text-sm font-black text-[var(--foreground)]">{item.title}</p>
                      <p className="text-xs leading-5 text-[var(--muted)]">{item.message}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                        {formatRelative(item.createdAt)}
                      </p>
                    </div>
                  );
                  return (
                    <li key={item.id}>
                      {item.link ? (
                        <Link href={item.link} onClick={() => setOpen(false)}>
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {unread > 0 ? (
            <div className="border-t border-[var(--line)] p-3">
              <button
                type="button"
                onClick={handleMarkSeen}
                disabled={isPending}
                className="w-full rounded-xl border border-[var(--line)] bg-white py-2 text-xs font-black text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-60"
              >
                Tandai semua sudah dibaca
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
