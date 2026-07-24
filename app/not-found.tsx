import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <main className="container section-mobile-padding flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-8xl font-black text-[var(--primary)]">404</p>
        <h1 className="mt-4 text-2xl font-bold">Halaman Tidak Ditemukan</h1>
        <p className="mt-2 max-w-md text-[var(--muted)]">
          Maaf, halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/"
            className="rounded-full bg-[var(--primary-strong)] px-6 py-2.5 text-sm font-bold !text-white transition hover:bg-[#04652c]"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/paket"
            className="rounded-full border border-[var(--line)] px-6 py-2.5 text-sm font-bold transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            Lihat Paket
          </Link>
        </div>
      </main>
    </>
  );
}
