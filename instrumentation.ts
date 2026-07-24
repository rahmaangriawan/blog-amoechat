/**
 * Next.js Instrumentation — dijalankan sekali saat server start.
 * Standalone build TIDAK auto-load .env, jadi kita load manual di sini
 * agar semua process.env.* tersedia untuk seluruh server code.
 */
export async function register() {
  // Hanya load dotenv di server (bukan edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { config } = await import("dotenv");
    const { resolve } = await import("path");

    // Load .env dari root folder app (cwd)
    config({ path: resolve(process.cwd(), ".env") });
  }
}
