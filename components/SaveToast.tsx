"use client";

import { useEffect, useState } from "react";

export function SaveToast({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
    if (!show) return;

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed right-5 top-5 z-[70] rounded-xl border border-[#6fd18b] bg-[#16a34a] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_40px_rgba(22,163,74,0.24)]">
      Perubahan paket berhasil disimpan.
    </div>
  );
}
