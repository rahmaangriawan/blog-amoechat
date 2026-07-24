import { NextResponse } from "next/server";

const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "https://blog.amoechat.com").replace(/\/$/, "");

const llms = `# Amoechat

Amoechat adalah platform WhatsApp untuk bisnis yang mendukung koneksi Official melalui Meta Cloud API dan koneksi QR melalui Linked Devices. Koneksi QR bersifat unofficial dan bukan produk resmi Meta atau WhatsApp.

## Kemampuan utama

- Inbox tim untuk sales dan customer support
- Broadcast dan campaign WhatsApp
- Workflow automation dan chatbot
- Pengelolaan template pesan
- Widget chat untuk website
- Webhook dan API untuk developer

## Halaman publik

- [Beranda](${siteOrigin}/)
- [Fitur](${siteOrigin}/fitur)
- [Harga](${siteOrigin}/paket)
- [Cara Kerja](${siteOrigin}/cara-kerja)
- [Tentang Amoechat](${siteOrigin}/tentang)
- [Blog](${siteOrigin}/blog)
- [Bantuan](${siteOrigin}/bantuan)
- [FAQ](${siteOrigin}/faq)
- [Program Magang](${siteOrigin}/program)
- [Syarat dan Ketentuan](${siteOrigin}/syarat-ketentuan)
- [Kebijakan Privasi](${siteOrigin}/kebijakan-privasi)

## Catatan

Official berarti koneksi melalui Meta Cloud API, bukan klaim bahwa Amoechat adalah Meta Business Partner. Unofficial berarti koneksi QR atau Linked Devices yang bukan produk resmi Meta atau WhatsApp. Signup tersedia di https://amoechat.com/signup.
`;

export async function GET() {
  return new NextResponse(llms, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
