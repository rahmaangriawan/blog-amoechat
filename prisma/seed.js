/**
 * Seed script: buat akun Super Admin pertama.
 * Jalankan SATU KALI saja di server setelah migrate:
 *   node prisma/seed.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.CMS_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.CMS_ADMIN_PASSWORD;

  if (!email || !password || password.length < 12) {
    throw new Error("CMS_ADMIN_EMAIL dan CMS_ADMIN_PASSWORD (minimal 12 karakter) wajib diatur sebelum menjalankan seed.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✅ User "${email}" sudah ada, skip seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name: "Super Admin",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log(`✅ Super Admin berhasil dibuat: ${email}`);
  console.log(`   Role: SUPER_ADMIN`);
  console.log(`   Segera ganti password setelah login pertama!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed gagal:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
