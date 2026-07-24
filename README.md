# Amoechat Public Site dan CMS

Website pemasaran B2B untuk Amoechat, platform WhatsApp yang mendukung Meta Cloud API Official dan koneksi QR unofficial. Repo ini juga memuat blog, media, komentar, SEO, author, notifikasi CMS, dan program magang.

## Stack

- Next.js 16, React 19, dan TypeScript
- MySQL melalui Prisma
- pnpm 11.9.0
- Hugeicons dan Tailwind CSS

## Menjalankan lokal

```powershell
pnpm install --frozen-lockfile
pnpm exec prisma migrate deploy
pnpm exec prisma generate
pnpm dev
```

Buka `http://localhost:3000`. Database lokal default bernama `amoechat` dan diatur melalui `DATABASE_URL` pada `.env`.

## Pemeriksaan sebelum rilis

```powershell
pnpm lint
pnpm build
pnpm exec prisma migrate status
```

Signup produk selalu menuju `https://amoechat.com/signup`. Kontak sales dan dukungan dikelola dari dashboard CMS.
