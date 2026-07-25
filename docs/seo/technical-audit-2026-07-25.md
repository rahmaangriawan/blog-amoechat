# Audit dan Optimalisasi SEO Teknis Amoechat

Tanggal audit: 25 Juli 2026  
Target produksi: `https://blog.amoechat.com`  
Build lokal: Next.js 16.2.11, production build, `http://127.0.0.1:3011`  
Bahasa/pasar: Indonesia

## Ringkasan hasil

- Baseline production berisi 20 URL sitemap. Seluruhnya merespons 200, tetapi `/program/daftar` masih indexable, memakai canonical `/program`, dan ikut sitemap.
- Title author production adalah `Rama Angriawan | Amoechat | Amoechat`.
- Sitemap production memberi `lastmod` pada seluruh 20 URL, termasuk route statis.
- Setelah perbaikan, sitemap lokal berisi 19 URL indexable: 12 route statis, 3 detail paket, 3 artikel, dan 1 author.
- Crawler lokal memeriksa 26 URL: 19 indexable, 1 `noindex,follow`, dan 6 redirect permanen. Tidak ada kegagalan acceptance pada 19 URL indexable.
- Semua URL indexable lokal berstatus 200, mempunyai canonical sendiri, title dan canonical unik, description, tepat satu H1, Open Graph, Twitter Card, internal link, dan tidak mempunyai redirect chain.
- Seluruh JSON-LD yang ditemukan dapat diparse. Artikel memakai `BlogPosting`; author memakai `ProfilePage` dengan `Person` sebagai `mainEntity`.
- Lint dan production build berhasil. Tidak ada perubahan schema/data database, commit, push, atau deploy.

## Metode dan cakupan

Inventori dibuat dari route filesystem, sitemap, route legacy, konfigurasi redirect Next.js, artikel/author lokal, dan tabel redirect. Tabel redirect lokal kosong. Database lokal mempunyai tiga artikel publik dan satu author publik; tidak ada record `PAGE`.

Crawler `scripts/seo-audit.mjs` mencatat status, redirect chain, canonical, robots, title, description, H1, OG/Twitter, JSON-LD, gambar/alt, internal link, serta keanggotaan sitemap. Baseline production diperiksa read-only sebelum perbaikan lokal.

Template yang diperiksa:

1. Homepage.
2. Landing: fitur, harga, cara kerja, tentang, FAQ, bantuan.
3. Tiga detail paket.
4. Blog index dan tiga artikel.
5. Author index dan satu profil author.
6. Program, pendaftaran, dan legal.
7. Redirect legacy dan redirect paket berbahasa Inggris.

## Baseline production

| Temuan | Bukti sebelum perbaikan | Dampak |
| --- | --- | --- |
| Suffix title author ganda | `Rama Angriawan | Amoechat | Amoechat` | Snippet tidak rapi dan title template tidak konsisten. |
| Pendaftaran magang indexable | HTTP 200, tanpa `noindex`, canonical ke `/program`, masuk sitemap | URL konversi bersaing dengan landing program dan canonical tidak self-referencing. |
| Sitemap statis memakai `lastmod` | 20 dari 20 entri mempunyai `lastmod`, termasuk `/fitur` | Waktu modifikasi tidak merepresentasikan perubahan konten statis. |
| Structured data author belum berupa halaman profil | Tipe terdeteksi hanya `Person` dan `Organization` | Hubungan halaman profil dengan entitas penulis kurang eksplisit. |
| Artikel masih memakai tipe umum | Source awal memakai `Article` | Bisa dibuat lebih spesifik sebagai `BlogPosting`. |
| Pagination crawlable belum tersedia | Blog menampilkan seluruh inventori pada satu route | Artikel lama akan makin dalam ketika inventori tumbuh. |
| Skor SEO editor mewajibkan tabel | Tabel memberi 10 poin | Artikel yang tidak membutuhkan tabel dinilai tidak adil. |

Production representative URLs tetap berstatus 200 dan memiliki description, satu H1, OG/Twitter, serta JSON-LD yang dapat diparse. Audit tidak memakai Google Search Console.

## Perbaikan yang diterapkan

### Metadata dan indexability

- Normalisasi title menghapus suffix situs berulang sebelum template root diterapkan.
- Seluruh landing indexable memperoleh canonical, title/description spesifik, OG, dan Twitter metadata yang konsisten.
- Metadata author sekarang menghasilkan `Rama Angriawan | Amoechat`.
- `/program/daftar` sekarang `noindex,follow`, self-canonical, dan dikeluarkan dari sitemap.
- Canonical homepage dinormalisasi menjadi URL absolut terhadap origin situs.

### Sitemap dan pagination

- Sitemap hanya memuat route canonical 200 yang boleh diindeks.
- Route statis tidak lagi diberi `lastmod` sintetis.
- Artikel dan author memakai waktu perubahan data yang tersedia.
- CMS `PAGE` tidak dimasukkan karena belum ada public renderer dan tidak ada record lokal.
- Pagination `/blog/page/[page]` memakai 12 artikel per halaman, canonical/title unik, serta link HTML previous/next.
- `/blog/page/1` redirect permanen ke `/blog`.
- Pagination memakai cache 5 menit. Tidak ada polling, worker, atau query publik tanpa cache.

### Structured data

- Artikel memakai `BlogPosting`, author URL/`@id`, publisher Organization `@id`, tanggal, gambar, dan breadcrumb.
- Profil author memakai `ProfilePage` dengan `Person` sebagai `mainEntity`.
- FAQ schema tetap hanya berasal dari FAQ yang terlihat pada halaman.
- `AggregateRating` 4,9/10.000 dipertahankan tanpa perluasan. URL bukti publik masih menjadi blocker sebelum schema rating diubah atau diperluas.

### Dashboard SEO

- Skor artikel tidak lagi mewajibkan tabel.
- Penilaian sekarang mencakup resolved title, description, slug, excerpt, jumlah kata, H2/H3, gambar beserta alt, internal link, dan kelengkapan author.
- Preview menampilkan title akhir sesudah token `%currentyear%` dan suffix situs.

## Hasil crawler sesudah perbaikan

| Pemeriksaan | Hasil |
| --- | --- |
| URL diperiksa | 26 |
| URL indexable | 19 |
| URL `noindex,follow` | 1 |
| Redirect permanen | 6 |
| Kegagalan pada URL indexable | 0 |
| Duplicate title | 0 |
| Duplicate canonical | 0 |
| JSON-LD parse error | 0 |
| Gambar tanpa alt | 0 |
| Sitemap stabil pada dua request | Ya |
| `lastmod` route statis | Tidak ada |
| `/program/daftar` di sitemap | Tidak |

Canonical lokal menunjuk `http://localhost:3000` karena `NEXT_PUBLIC_SITE_URL` lokal. Path canonical seluruh URL indexable tetap cocok dengan path yang diuji. Pada deployment production, origin akan mengikuti `https://blog.amoechat.com`.

## Core Web Vitals regression guard

Pengukuran memakai Chrome headless, viewport mobile 390×844, simulasi jaringan 4G, CPU slowdown 4×, dan median tiga cold navigation. Ini smoke test lab, bukan pengganti field data CrUX/Search Console.

| Template | LCP median | CLS median | FCP median | TTFB median | Status |
| --- | ---: | ---: | ---: | ---: | --- |
| Homepage | 1.140 ms | 0 | 1.140 ms | 14 ms | LCP/CLS lulus |
| Blog index | 1.184 ms | 0 | 1.184 ms | 106 ms | LCP/CLS lulus |
| Artikel | 1.036 ms | 0 | 1.036 ms | 13 ms | LCP/CLS lulus |
| Author | 1.012 ms | 0 | 1.012 ms | 18 ms | LCP/CLS lulus |

Satu dari tiga run artikel mencatat CLS 0,348; median tetap 0. Outlier ini perlu dipantau setelah deploy karena kemungkinan berhubungan dengan gambar/font/cache dingin. INP tidak dinilai lulus/gagal: interaksi sintetis tidak menghasilkan event timing yang memenuhi syarat, sehingga field INP harus divalidasi melalui CrUX/Search Console setelah traffic tersedia.

Target lanjutan tetap LCP ≤2,5 detik, INP ≤200 ms, dan CLS ≤0,1 sesuai [pedoman Core Web Vitals Google](https://developers.google.com/search/docs/appearance/core-web-vitals).

## Coverage gap dan blocker

1. Hanya ada tiga artikel, sehingga `/blog/page/2` benar menghasilkan 404. `/blog/page/1` sudah teruji redirect permanen ke `/blog`; rendering page 2+ baru bisa diuji tanpa manipulasi data setelah artikel ke-13 tersedia.
2. Tidak ada record CMS `PAGE` lokal dan belum ada public renderer untuk tipe tersebut. Karena itu halaman CMS tidak dimasukkan ke sitemap.
3. Category hub tidak dibuat karena inventori tiap kategori belum memenuhi minimal tiga artikel berkualitas.
4. Aggregate rating dipertahankan, tetapi URL bukti publik belum dicatat.
5. Rich Results Test dan Search Console belum dijalankan. Validasi saat ini mencakup parse JSON-LD dan konsistensi dengan konten terlihat.
6. Perubahan belum dideploy. Baseline production masih menampilkan perilaku lama sampai pengguna melakukan deploy sendiri.

## Acceptance dan smoke test sesudah deploy

Setelah pengguna melakukan deploy:

1. Crawl ulang seluruh URL di `docs/seo/url-matrix.csv`.
2. Pastikan `/program/daftar` mengirim `noindex, follow`, self-canonical, dan tidak ada di sitemap.
3. Pastikan title author hanya `Rama Angriawan | Amoechat`.
4. Bandingkan dua respons sitemap; route statis tidak boleh mempunyai `lastmod`.
5. Uji representative `BlogPosting`, `ProfilePage`, FAQ, dan breadcrumb di Rich Results Test.
6. Pantau CrUX/Search Console untuk LCP, INP, CLS, coverage, query, CTR, dan ranking.

Referensi: [ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page), [Article author markup](https://developers.google.com/search/docs/appearance/structured-data/article), [panduan sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), dan [structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).
