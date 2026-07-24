import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Syarat dan Ketentuan", description: "Ketentuan penggunaan platform Amoechat untuk WhatsApp Official Meta Cloud API dan koneksi QR.", alternates: { canonical: "/syarat-ketentuan" } };

const sections = [
  { title: "Penggunaan layanan", content: "Amoechat menyediakan inbox tim, kampanye, automation, template, widget, API, dan fitur terkait untuk membantu bisnis mengelola komunikasi digital." },
  { title: "Channel Official", content: "Koneksi Official menggunakan Meta Cloud API milik bisnis pengguna. Pengguna bertanggung jawab atas akun Meta, persetujuan template, kualitas nomor, biaya dari Meta, dan kepatuhan terhadap kebijakan platform." },
  { title: "Koneksi QR", content: "Koneksi QR menggunakan Linked Devices dan bukan layanan resmi Meta atau WhatsApp. Stabilitas serta ketersediaannya dapat dipengaruhi perubahan pada platform pihak ketiga. Amoechat tidak menjamin channel QR selalu tersedia tanpa gangguan." },
  { title: "Pesan dan broadcast", content: "Pengguna dilarang mengirim spam, penipuan, konten ilegal, atau pesan tanpa dasar persetujuan yang memadai. Pelanggaran dapat menyebabkan pembatasan atau penghentian akun." },
  { title: "Akun dan keamanan", content: "Pengguna bertanggung jawab atas kerahasiaan kredensial, hak akses anggota tim, keamanan webhook, serta aktivitas yang dilakukan melalui workspace." },
  { title: "Paket dan pembayaran", content: "Batas channel, kontak, pesan, kampanye, workflow, dan add-on mengikuti paket aktif. Harga dapat diperbarui dengan pemberitahuan yang wajar. Pajak dan biaya pihak ketiga dapat berlaku." },
  { title: "Penghentian layanan", content: "Pengguna dapat berhenti menggunakan layanan sesuai periode paket. Amoechat dapat membatasi akun yang melanggar ketentuan, membahayakan sistem, atau menimbulkan risiko bagi pengguna lain." },
  { title: "Batas tanggung jawab", content: "Amoechat tidak bertanggung jawab atas pemblokiran nomor, perubahan kebijakan pihak ketiga, kehilangan peluang bisnis, atau gangguan di luar kendali yang wajar." },
];

export default function TermsPage() {
  return <LegalPage title="Syarat dan Ketentuan" description="Ketentuan yang mengatur penggunaan akun, channel, pesan, paket, dan fitur Amoechat." updatedAt="22 Juli 2026" sections={sections} />;
}
