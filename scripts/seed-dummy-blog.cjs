const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const articles = [
  {
    title: "Panduan Memilih WhatsApp Official atau QR untuk Bisnis",
    slug: "panduan-memilih-whatsapp-official-atau-qr-untuk-bisnis",
    excerpt: "Kenali perbedaan Meta Cloud API dan koneksi QR agar bisnis Anda memilih jalur WhatsApp yang sesuai dengan kebutuhan operasional.",
    featuredImage: "/images/hero-amoechat-workspace.webp",
    daysAgo: 2,
    content: `
      <p>Setiap bisnis memiliki kebutuhan WhatsApp yang berbeda. Ada tim yang membutuhkan kepatuhan dan skala melalui Meta Cloud API, sementara bisnis lain ingin mulai cepat menggunakan koneksi QR.</p>
      <h2>Kapan memilih WhatsApp Official?</h2>
      <p>WhatsApp Official melalui Meta Cloud API cocok untuk bisnis yang mengutamakan template terverifikasi, status pengiriman, kualitas akun, dan integrasi yang stabil.</p>
      <h2>Kapan memilih koneksi QR?</h2>
      <p>Koneksi QR cocok untuk tim yang ingin menghubungkan nomor melalui Linked Devices dan mulai mengelola percakapan dari inbox bersama dengan proses yang singkat.</p>
      <h2>Gunakan keduanya dalam satu workspace</h2>
      <p>Amoechat memungkinkan tim mengelola channel Official dan QR dari satu tempat. Assignment, konteks pelanggan, workflow, dan laporan tetap tersusun rapi.</p>
    `,
  },
  {
    title: "5 Cara Membuat Tim Customer Support Lebih Responsif",
    slug: "cara-membuat-tim-customer-support-lebih-responsif",
    excerpt: "Terapkan inbox bersama, assignment, template, dan workflow agar pelanggan memperoleh jawaban lebih cepat tanpa membebani tim.",
    featuredImage: "/images/amoechat-setup-steps.webp",
    daysAgo: 5,
    content: `
      <p>Kecepatan respons bukan hanya tentang membalas pesan secepat mungkin. Tim juga membutuhkan konteks, pembagian tanggung jawab, dan proses yang konsisten.</p>
      <h2>Gunakan inbox bersama</h2>
      <p>Satukan percakapan dalam satu workspace agar anggota tim dapat melihat status chat dan menghindari balasan ganda.</p>
      <h2>Tentukan pemilik percakapan</h2>
      <p>Gunakan assignment untuk memastikan setiap pelanggan memiliki anggota tim yang bertanggung jawab hingga masalah selesai.</p>
      <h2>Siapkan template dan workflow</h2>
      <p>Template membantu tim menjaga kualitas jawaban. Workflow dapat menangani respons awal, follow-up, dan handoff secara otomatis.</p>
      <h2>Pantau lalu perbaiki</h2>
      <p>Evaluasi pola pertanyaan pelanggan dan perbarui alur kerja secara berkala agar pelayanan terus meningkat.</p>
    `,
  },
  {
    title: "Praktik Aman Mengelola Akses WhatsApp untuk Tim",
    slug: "praktik-aman-mengelola-akses-whatsapp-untuk-tim",
    excerpt: "Pelajari cara mengatur hak akses, kepemilikan channel, dan kebijakan broadcast agar operasi WhatsApp bisnis tetap terkendali.",
    featuredImage: "/images/amoechat-security-v2.webp",
    daysAgo: 8,
    content: `
      <p>Ketika banyak anggota tim menangani WhatsApp bisnis, akses yang tidak terkontrol dapat meningkatkan risiko kesalahan dan penyalahgunaan akun.</p>
      <h2>Berikan akses sesuai peran</h2>
      <p>Setiap anggota tim sebaiknya hanya memperoleh akses yang diperlukan untuk menjalankan tanggung jawabnya.</p>
      <h2>Kelola channel secara terpusat</h2>
      <p>Hindari membagikan kredensial atau perangkat tanpa kontrol. Gunakan workspace terpusat untuk mengelola kepemilikan channel dan aktivitas tim.</p>
      <h2>Patuhi persetujuan pelanggan</h2>
      <p>Kirim broadcast hanya kepada pelanggan yang telah memberikan persetujuan dan selalu ikuti kebijakan WhatsApp serta Meta.</p>
      <h2>Tinjau akses secara berkala</h2>
      <p>Nonaktifkan akses yang tidak lagi diperlukan dan pastikan setiap perubahan anggota tim segera tercermin dalam pengaturan workspace.</p>
    `,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(`disabled-${Date.now()}-${Math.random()}`, 12);
  const author = await prisma.user.upsert({
    where: { email: "editorial@amoechat.com" },
    update: {
      name: "Rama Angriawan",
      role: "EDITOR",
      isActive: false,
      isAuthor: true,
      authorSlug: "rama-angriawan",
      authorRole: "Tim Editorial",
      authorBio: "Tim editorial Amoechat membagikan panduan praktis tentang WhatsApp marketing, customer support, automation, dan API.",
    },
    create: {
      name: "Rama Angriawan",
      email: "editorial@amoechat.com",
      passwordHash,
      role: "EDITOR",
      isActive: false,
      isAuthor: true,
      authorSlug: "rama-angriawan",
      authorRole: "Tim Editorial",
      authorBio: "Tim editorial Amoechat membagikan panduan praktis tentang WhatsApp marketing, customer support, automation, dan API.",
    },
  });

  const category = await prisma.articleCategory.upsert({
    where: { slug: "panduan-whatsapp" },
    update: {
      name: "Panduan WhatsApp",
      description: "Panduan WhatsApp marketing, customer support, automation, dan keamanan untuk bisnis.",
    },
    create: {
      name: "Panduan WhatsApp",
      slug: "panduan-whatsapp",
      description: "Panduan WhatsApp marketing, customer support, automation, dan keamanan untuk bisnis.",
    },
  });

  const now = Date.now();
  for (const article of articles) {
    const publishedAt = new Date(now - article.daysAgo * 24 * 60 * 60 * 1000);
    const data = {
      title: article.title,
      excerpt: article.excerpt,
      content: article.content.trim(),
      type: "POST",
      metaTitle: article.title,
      metaDescription: article.excerpt,
      isPublished: true,
      publishedAt,
      featuredImage: article.featuredImage,
      categoryId: category.id,
      authorId: author.id,
    };

    await prisma.article.upsert({
      where: { slug: article.slug },
      update: data,
      create: { ...data, slug: article.slug },
    });
  }

  const created = await prisma.article.findMany({
    where: { slug: { in: articles.map((article) => article.slug) } },
    orderBy: { publishedAt: "desc" },
    select: { title: true, slug: true, isPublished: true, category: { select: { name: true } }, author: { select: { name: true } } },
  });

  console.log(JSON.stringify(created, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
