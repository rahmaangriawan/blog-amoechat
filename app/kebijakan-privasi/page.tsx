import { LegalPage } from "@/components/LegalPage";
import { buildStaticPageMetadata } from "@/lib/metadata";

export const metadata = buildStaticPageMetadata({
  title: "Kebijakan Privasi",
  description: "Kebijakan privasi Amoechat untuk akun, kontak, pesan, channel, dan penggunaan platform WhatsApp bisnis.",
  canonical: "/kebijakan-privasi",
});

const sections = [
  { title: "Informasi yang kami proses", content: "Amoechat dapat memproses informasi akun, profil bisnis, anggota tim, konfigurasi channel, kontak pelanggan, isi pesan, template, event webhook, metadata pengiriman, serta data penggunaan platform." },
  { title: "Tujuan penggunaan", content: "Data digunakan untuk menyediakan inbox, kampanye, automation, widget, API, dukungan pelanggan, keamanan akun, pencegahan penyalahgunaan, dan peningkatan layanan." },
  { title: "Koneksi pihak ketiga", content: "Jika Anda memakai Meta Cloud API, sebagian data diproses melalui layanan Meta. Koneksi QR menggunakan mekanisme Linked Devices dan bukan layanan resmi Meta atau WhatsApp. Integrasi tambahan dapat tunduk pada kebijakan penyedia masing-masing." },
  { title: "Tanggung jawab pengguna", content: "Pengguna wajib memiliki dasar yang sah untuk memproses data kontak dan mengirim pesan. Pengguna juga wajib menjaga kredensial, membatasi akses tim, serta mematuhi kebijakan WhatsApp, Meta, dan peraturan perlindungan data yang berlaku." },
  { title: "Keamanan dan penyimpanan", content: "Kami menerapkan kontrol akses dan langkah teknis yang wajar untuk melindungi data. Tidak ada sistem yang sepenuhnya bebas risiko. Lama penyimpanan mengikuti kebutuhan layanan, kewajiban hukum, dan pengaturan akun." },
  { title: "Hak pengguna", content: "Anda dapat meminta akses, koreksi, ekspor, atau penghapusan data sesuai ketentuan yang berlaku dengan menghubungi support@amoechat.com." },
  { title: "Perubahan kebijakan", content: "Kebijakan ini dapat diperbarui untuk menyesuaikan fitur, regulasi, dan praktik keamanan. Versi terbaru selalu tersedia pada halaman ini." },
];

export default function PrivacyPage() {
  return <LegalPage title="Kebijakan Privasi" description="Penjelasan tentang data yang kami proses, alasan penggunaannya, serta pilihan dan hak Anda sebagai pengguna Amoechat." updatedAt="22 Juli 2026" sections={sections} />;
}
