const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { config } = require("dotenv");

const projectRoot = path.resolve(__dirname, "..");
config({ path: path.join(projectRoot, ".env"), quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL tidak ditemukan di .env");
}

const databaseUrl = new URL(process.env.DATABASE_URL);
if (databaseUrl.protocol !== "mysql:") {
  throw new Error("DATABASE_URL harus menggunakan protokol mysql://");
}

const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\//, ""));
if (!databaseName) {
  throw new Error("Nama database tidak ditemukan di DATABASE_URL");
}

const mysqldump =
  process.env.MYSQLDUMP_PATH ||
  "D:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysqldump.exe";
const outputPath = path.join(projectRoot, "amoechat-cloudpanel-full.sql");
const output = fs.openSync(outputPath, "w");

const result = spawnSync(
  mysqldump,
  [
    `--host=${databaseUrl.hostname}`,
    `--port=${databaseUrl.port || "3306"}`,
    `--user=${decodeURIComponent(databaseUrl.username)}`,
    "--single-transaction",
    "--quick",
    "--routines",
    "--triggers",
    "--events",
    "--hex-blob",
    "--default-character-set=utf8mb4",
    "--set-gtid-purged=OFF",
    "--no-tablespaces",
    "--skip-add-locks",
    "--skip-extended-insert",
    "--complete-insert",
    "--column-statistics=0",
    databaseName,
  ],
  {
    cwd: projectRoot,
    env: {
      ...process.env,
      MYSQL_PWD: decodeURIComponent(databaseUrl.password),
    },
    stdio: ["ignore", output, "pipe"],
    encoding: "utf8",
  },
);

fs.closeSync(output);

if (result.status !== 0) {
  fs.rmSync(outputPath, { force: true });
  throw new Error(result.stderr?.trim() || `mysqldump gagal dengan status ${result.status}`);
}

// MySQL Windows memakai lower_case_table_names=1. Pulihkan nama tabel Prisma
// sebelum dump di-import ke MySQL Linux yang case-sensitive.
const prismaTableNames = [
  "ApiSetting",
  "Article",
  "ArticleCategory",
  "Comment",
  "Document",
  "Media",
  "Redirect",
  "InternshipApplication",
  "SeoGlobal",
  "User",
  "Notification",
  "WhatsAppTemplate",
  "WhatsAppLog",
];

let dump = fs.readFileSync(outputPath, "utf8");
for (const tableName of prismaTableNames) {
  dump = dump.replaceAll(`\`${tableName.toLowerCase()}\``, `\`${tableName}\``);
}
fs.writeFileSync(outputPath, dump, "utf8");

const tableCount = (dump.match(/^CREATE TABLE /gm) || []).length;
const rowCount = (dump.match(/^INSERT INTO /gm) || []).length;

if (tableCount === 0 || rowCount === 0) {
  fs.rmSync(outputPath, { force: true });
  throw new Error(`Dump tidak lengkap: ${tableCount} tabel dan ${rowCount} row`);
}

const sizeMb = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
console.log(`Dump siap: ${path.basename(outputPath)}`);
console.log(`Isi: ${tableCount} tabel, ${rowCount} row, ${sizeMb} MB`);
