export const SIGNUP_URL = "https://amoechat.com/signup";

export type PricingPlan = {
  slug: "free" | "professional" | "enterprise";
  name: string;
  label: string;
  description: string;
  priceIdr: number;
  period: string;
  popular?: boolean;
  features: string[];
  addOns: string[];
};

export const pricingPlans: PricingPlan[] = [
  {
    slug: "free",
    name: "Free",
    label: "Mulai tanpa biaya",
    description: "Satu channel Official atau QR dengan fitur inti untuk mencoba alur kerja Amoechat.",
    priceIdr: 0,
    period: "30 hari",
    features: [
      "300 kontak",
      "1 channel Official",
      "500 pesan per bulan",
      "3 kampanye broadcast",
      "2 workflow otomatis",
      "Inbox tim dan widget chat",
      "Akses API",
    ],
    addOns: ["1 channel QR", "Telegram Official", "Telegram Unofficial", "Instagram", "Messenger"],
  },
  {
    slug: "professional",
    name: "Professional",
    label: "Untuk tim yang berkembang",
    description: "Kapasitas lebih besar untuk operasional sales, marketing, dan customer support.",
    priceIdr: 50000,
    period: "30 hari",
    popular: true,
    features: [
      "5.000 kontak",
      "50 channel Official",
      "Pesan unlimited",
      "Tanpa watermark",
      "50 kampanye broadcast",
      "10 workflow otomatis",
      "Chatbot, widget, dan akses API",
    ],
    addOns: ["Channel QR unlimited", "10 bot Telegram", "5 akun Telegram MTProto", "Instagram", "Messenger"],
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    label: "Untuk operasi volume tinggi",
    description: "Channel, pesan, kampanye, dan workflow tanpa batas untuk organisasi berskala besar.",
    priceIdr: 99000,
    period: "30 hari",
    features: [
      "Kontak unlimited",
      "Channel Official unlimited",
      "Pesan unlimited",
      "Tanpa watermark",
      "Kampanye dan workflow unlimited",
      "Chatbot dan widget chat",
      "Akses API penuh",
    ],
    addOns: ["Channel QR unlimited", "Telegram unlimited", "Instagram", "Messenger", "Dukungan kebutuhan khusus"],
  },
];

export const platformFeatures = [
  { title: "Inbox tim", description: "Kelola percakapan bersama, assignment, dan konteks pelanggan dari satu tempat." },
  { title: "Broadcast kampanye", description: "Kirim pesan tersegmentasi dengan template dan pantau status pengirimannya." },
  { title: "Workflow otomatis", description: "Picu respons, follow-up, dan handoff berdasarkan event bisnis Anda." },
  { title: "Template pesan", description: "Gunakan template Meta untuk Official dan copy reusable untuk operasi yang konsisten." },
  { title: "Widget website", description: "Tangkap pengunjung website dan arahkan percakapan langsung ke tim WhatsApp." },
  { title: "API dan webhook", description: "Hubungkan Amoechat ke CRM, toko, aplikasi internal, dan alur kerja kustom." },
];

export const testimonials = [
  {
    quote: "Amoechat mengubah cara kami melayani pelanggan. Pemulihan keranjang naik tajam dan chat terasa lebih personal.",
    name: "Sari Wulandari",
    role: "Direktur E-commerce, Fashion Forward",
  },
  {
    quote: "Otomatisasi sangat membantu. Kami nurture prospek tanpa kerja manual dan konversi terus naik.",
    name: "Budi Santoso",
    role: "Manajer Pemasaran, TechStart ID",
  },
  {
    quote: "Tim cepat beradaptasi. Inbox Official dan QR dalam satu tempat membuat support jauh lebih rapi.",
    name: "Maya Putri",
    role: "Customer Success Lead, HealthCare Plus",
  },
  {
    quote: "Dari satu nomor sampai multi-channel, setupnya jelas. Tim sales kami langsung produktif.",
    name: "Andi Pratama",
    role: "Pendiri, LokalMart",
  },
];

export const faqItems = [
  {
    question: "Apakah saya perlu WhatsApp Business API sendiri?",
    answer: "Untuk jalur Official, Anda menghubungkan akun Meta Cloud API milik bisnis. Untuk mulai lebih cepat, Anda juga dapat menghubungkan nomor melalui QR Linked Devices.",
  },
  {
    question: "Apa bedanya Official dan QR?",
    answer: "Official memakai Meta Cloud API untuk template dan pengiriman resmi. QR menghubungkan nomor melalui Linked Devices untuk inbox yang cepat disiapkan. Keduanya dapat dikelola dari workspace yang sama.",
  },
  {
    question: "Apakah ada biaya setup?",
    answer: "Tidak ada biaya setup untuk paket standar. Anda dapat membuat akun, menambahkan channel, lalu memilih paket sesuai kebutuhan tim.",
  },
  {
    question: "Bisakah saya mengganti paket kapan saja?",
    answer: "Bisa. Upgrade dapat dilakukan ketika jumlah channel, kontak, kampanye, atau anggota tim bertambah.",
  },
  {
    question: "Apakah paket Free benar-benar gratis?",
    answer: "Ya. Paket Free tersedia selama 30 hari dengan 1 channel, 300 kontak, dan 500 pesan per bulan sesuai batas fitur yang tercantum.",
  },
  {
    question: "Bagaimana Amoechat menjaga keamanan data?",
    answer: "Amoechat menerapkan akses berbasis peran dan pengelolaan channel terpusat. Pengguna tetap wajib menjaga kredensial serta mematuhi kebijakan WhatsApp dan Meta.",
  },
];

export function formatPlanPrice(price: number) {
  if (price === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price);
}

export function getPricingPlan(slug: string) {
  return pricingPlans.find((plan) => plan.slug === slug);
}
