import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  deleteGoogleServiceAccount,
  saveGoogleIntegration,
  savePublicContactSettings,
  testGa4Connection,
  testSheetsConnection,
} from "@/lib/actions";
import { requireSuperAdminPage } from "@/lib/auth";
import { authorSettingKeys, defaultAuthor } from "@/lib/authors";
import { defaultPublicContact, publicContactKeys } from "@/lib/public-contact";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { ServiceAccountUpload } from "@/components/ServiceAccountUpload";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pengaturan Integrasi" };

const expectedKeys = ["GOOGLE_SITE_VERIFICATION", "GOOGLE_ANALYTICS_MEASUREMENT_ID", "GOOGLE_GA4_PROPERTY_ID", "GOOGLE_SEARCH_CONSOLE_SITE_URL", "GOOGLE_SERVICE_ACCOUNT_JSON", "GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_FILE_NAME", "GOOGLE_SERVICE_ACCOUNT_UPDATED_AT", "INTERNSHIP_SPREADSHEET_ID", "INTERNSHIP_SHEET_NAME", ...publicContactKeys, ...authorSettingKeys];

export default async function ApiSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    contact?: string;
    ga4?: string;
    sheets?: string;
    message?: string;
    credential?: string;
  }>;
}) {
  await requireSuperAdminPage();
  const params = await searchParams;
  const rows = await (prisma as any).apiSetting.findMany({
    where: { key: { in: expectedKeys } },
    orderBy: [{ category: "asc" }, { key: "asc" }],
  });
  const settings = Object.fromEntries(rows.map((row: { key: string; value: string | null }) => [row.key, row.value || ""]));
  const hasCredential = Boolean(settings.GOOGLE_SERVICE_ACCOUNT_JSON);
  const ga4Ready = Boolean(settings.GOOGLE_GA4_PROPERTY_ID && hasCredential);
  const sheetsReady = Boolean(settings.INTERNSHIP_SPREADSHEET_ID && settings.INTERNSHIP_SHEET_NAME && hasCredential);
  const credentialUpdatedAt = settings.GOOGLE_SERVICE_ACCOUNT_UPDATED_AT
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(settings.GOOGLE_SERVICE_ACCOUNT_UPDATED_AT))
    : "";

  return (
    <main className="p-5 md:p-8">
      <div><p className="text-sm font-bold text-[var(--brand)]">CMS</p><h1 className="text-3xl font-black">Pengaturan integrasi</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Kelola analytics, Google Sheets program magang, dan kontak publik Amoechat.</p></div>
      {params.saved === "1" || params.contact === "1" ? <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">Pengaturan berhasil disimpan.</div> : null}
      {params.credential === "deleted" ? <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">Service Account berhasil dihapus.</div> : null}
      {params.ga4 === "ok" || params.sheets === "ok" ? <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">Tes koneksi berhasil.</div> : null}
      {params.ga4 === "error" || params.sheets === "error" ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">Tes koneksi gagal: {params.message || "Periksa konfigurasi dan izin Google."}</div> : null}

      <form action={saveGoogleIntegration} className="panel mt-6 grid gap-5 p-5">
        <div><p className="text-sm font-bold text-[var(--brand)]">Google</p><h2 className="mt-1 text-2xl font-black">Analytics, Search Console, dan Sheets</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Service Account dipakai untuk laporan analytics dan sinkronisasi pendaftaran magang.</p></div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Site verification<input name="GOOGLE_SITE_VERIFICATION" defaultValue={settings.GOOGLE_SITE_VERIFICATION} placeholder="Token verifikasi Google" /></label>
          <label className="grid gap-2 text-sm font-semibold">GA4 Measurement ID<input name="GOOGLE_ANALYTICS_MEASUREMENT_ID" defaultValue={settings.GOOGLE_ANALYTICS_MEASUREMENT_ID} placeholder="G-XXXXXXXXXX" /></label>
          <label className="grid gap-2 text-sm font-semibold">GA4 Property ID<input name="GOOGLE_GA4_PROPERTY_ID" defaultValue={settings.GOOGLE_GA4_PROPERTY_ID} placeholder="123456789" /></label>
          <label className="grid gap-2 text-sm font-semibold">Search Console Site URL<input name="GOOGLE_SEARCH_CONSOLE_SITE_URL" defaultValue={settings.GOOGLE_SEARCH_CONSOLE_SITE_URL} placeholder="https://blog.amoechat.com/" /></label>
          <label className="grid gap-2 text-sm font-semibold">Spreadsheet ID Magang<input name="INTERNSHIP_SPREADSHEET_ID" defaultValue={settings.INTERNSHIP_SPREADSHEET_ID} placeholder="1AbCDeFg..." /></label>
          <label className="grid gap-2 text-sm font-semibold">Nama sheet Magang<input name="INTERNSHIP_SHEET_NAME" defaultValue={settings.INTERNSHIP_SHEET_NAME || "Pendaftaran Magang"} /></label>
          <ServiceAccountUpload
            connectedEmail={settings.GOOGLE_SERVICE_ACCOUNT_EMAIL}
            storedFileName={settings.GOOGLE_SERVICE_ACCOUNT_FILE_NAME}
            updatedAt={credentialUpdatedAt}
          />
        </div>
        <div className="grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--background)] p-4 text-sm md:grid-cols-2">
          <p><strong>Site verification:</strong> {settings.GOOGLE_SITE_VERIFICATION ? "Terpasang" : "Belum diisi"}</p>
          <p><strong>Analytics tag:</strong> {settings.GOOGLE_ANALYTICS_MEASUREMENT_ID ? "Terpasang" : "Belum diisi"}</p>
          <p><strong>GA4 reporting:</strong> {ga4Ready ? "Siap dites" : "Belum lengkap"}</p>
          <p><strong>Google Sheets:</strong> {sheetsReady ? "Siap dites" : "Belum lengkap"}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-3"><button type="submit" className="button">Simpan Google</button></div>
      </form>

      <section className="panel mt-4 flex flex-wrap items-center gap-3 p-5">
        <form action={testGa4Connection}><button className="button secondary" disabled={!ga4Ready}>Tes GA4 (read-only)</button></form>
        <form action={testSheetsConnection}><button className="button secondary" disabled={!sheetsReady}>Tes Sheets (read-only)</button></form>
        {settings.GOOGLE_SEARCH_CONSOLE_SITE_URL ? <a className="button secondary" href={settings.GOOGLE_SEARCH_CONSOLE_SITE_URL} target="_blank" rel="noreferrer">Buka Search Console</a> : null}
        {hasCredential ? (
          <form action={deleteGoogleServiceAccount}>
            <ConfirmSubmitButton
              className="button secondary !text-red-700"
              message="Hapus Service Account Google? Analytics dashboard dan sinkronisasi Sheets akan berhenti sampai credential baru diunggah."
            >
              Hapus Service Account
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </section>

      <form action={savePublicContactSettings} className="panel mt-6 grid gap-5 p-5">
        <div><p className="text-sm font-bold text-[var(--brand)]">Kontak Publik</p><h2 className="mt-1 text-2xl font-black">Sales, dukungan, dan author</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Nomor WhatsApp dipakai untuk CTA konsultasi dan Enterprise di halaman publik.</p></div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Nomor WhatsApp sales<input name="PUBLIC_WHATSAPP_NUMBER" defaultValue={settings.PUBLIC_WHATSAPP_NUMBER || defaultPublicContact.whatsappNumber} /></label>
          <label className="grid gap-2 text-sm font-semibold">Tampilan nomor sales<input name="PUBLIC_WHATSAPP_DISPLAY" defaultValue={settings.PUBLIC_WHATSAPP_DISPLAY || defaultPublicContact.whatsappDisplay} /></label>
          <label className="grid gap-2 text-sm font-semibold">Nomor WhatsApp partnership<input name="PUBLIC_PARTNERSHIP_WHATSAPP_NUMBER" defaultValue={settings.PUBLIC_PARTNERSHIP_WHATSAPP_NUMBER || defaultPublicContact.partnershipWhatsappNumber} /></label>
          <label className="grid gap-2 text-sm font-semibold">Tampilan nomor partnership<input name="PUBLIC_PARTNERSHIP_WHATSAPP_DISPLAY" defaultValue={settings.PUBLIC_PARTNERSHIP_WHATSAPP_DISPLAY || defaultPublicContact.partnershipWhatsappDisplay} /></label>
          <label className="grid gap-2 text-sm font-semibold">Call center<input name="PUBLIC_CALL_CENTER" defaultValue={settings.PUBLIC_CALL_CENTER || defaultPublicContact.callCenter} /></label>
          <label className="grid gap-2 text-sm font-semibold">Email support<input name="PUBLIC_EMAIL" type="email" defaultValue={settings.PUBLIC_EMAIL || defaultPublicContact.email} /></label>
          <label className="grid gap-2 text-sm font-semibold">Nama author<input name="PUBLIC_AUTHOR_NAME" defaultValue={settings.PUBLIC_AUTHOR_NAME || defaultAuthor.name} /></label>
          <label className="grid gap-2 text-sm font-semibold">Peran author<input name="PUBLIC_AUTHOR_ROLE" defaultValue={settings.PUBLIC_AUTHOR_ROLE || defaultAuthor.role} /></label>
          <label className="grid gap-2 text-sm font-semibold">URL avatar<input name="PUBLIC_AUTHOR_AVATAR_URL" defaultValue={settings.PUBLIC_AUTHOR_AVATAR_URL || defaultAuthor.avatarUrl} /></label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">Bio author<textarea name="PUBLIC_AUTHOR_BIO" defaultValue={settings.PUBLIC_AUTHOR_BIO || defaultAuthor.bio} rows={3} /></label>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <a href="/" target="_blank" rel="noreferrer" className="button secondary">Preview homepage</a>
          <a href="/author" target="_blank" rel="noreferrer" className="button secondary">Preview author</a>
          <button type="submit" className="button">Simpan kontak</button>
        </div>
      </form>
    </main>
  );
}
