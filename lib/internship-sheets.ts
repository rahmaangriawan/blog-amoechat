import "server-only";

import { createSign } from "node:crypto";
import { getApiSettings } from "@/lib/api-settings";
import { fetchWithTimeout } from "@/lib/fetch-timeout";

const spreadsheetSettingKeys = [
  "GOOGLE_SERVICE_ACCOUNT_JSON",
  "INTERNSHIP_SPREADSHEET_ID",
  "INTERNSHIP_SHEET_NAME",
];

type InternshipSheetItem = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  institutionName: string;
  major: string | null;
  educationLevel: string;
  internshipType: string;
  interestField: string;
  startPeriod: string | null;
  duration: string | null;
  portfolioUrl: string | null;
  message: string | null;
  status: string;
  createdAt: Date;
};

type ServiceAccount = {
  client_email?: string;
  private_key?: string;
  token_uri?: string;
};

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwt(serviceAccount: ServiceAccount) {
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("Google service account belum lengkap.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: serviceAccount.token_uri || "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(serviceAccount.private_key);
  return `${unsigned}.${base64Url(signature)}`;
}

async function getSettings() {
  return getApiSettings(spreadsheetSettingKeys, 300_000);
}

async function getAccessToken(serviceAccountJson: string) {
  const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
  const assertion = signJwt(serviceAccount);
  const response = await fetchWithTimeout(serviceAccount.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  }, 10_000);

  const payload = (await response.json()) as { access_token?: string; error_description?: string; error?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Gagal mengambil Google access token.");
  }

  return payload.access_token;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

function toRow(item: InternshipSheetItem) {
  return [
    item.id,
    formatDate(item.createdAt),
    item.fullName,
    `'${item.phoneNumber}`,
    item.email,
    item.institutionName,
    item.major || "",
    item.educationLevel,
    item.internshipType,
    item.interestField,
    item.startPeriod || "",
    item.duration || "",
    item.portfolioUrl || "",
    item.message || "",
    item.status,
  ];
}

export async function syncInternshipApplicationToSheet(item: InternshipSheetItem) {
  const settings = await getSettings();
  const spreadsheetId = settings.INTERNSHIP_SPREADSHEET_ID?.trim();
  const serviceAccountJson = settings.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  const sheetName = settings.INTERNSHIP_SHEET_NAME?.trim() || "Pendaftaran Magang";

  if (!spreadsheetId || !serviceAccountJson) {
    return { ok: false, skipped: true, reason: "Google Sheets belum dikonfigurasi." };
  }

  const accessToken = await getAccessToken(serviceAccountJson);
  const range = encodeURIComponent(`'${sheetName}'!A:O`);
  const response = await fetchWithTimeout(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ values: [toRow(item)] }),
    },
    12_000,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Gagal sync ke Google Sheets.");
  }

  return { ok: true, skipped: false };
}

export async function testInternshipSheetConnection() {
  const settings = await getSettings();
  const spreadsheetId = settings.INTERNSHIP_SPREADSHEET_ID?.trim();
  const serviceAccountJson = settings.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  const sheetName = settings.INTERNSHIP_SHEET_NAME?.trim() || "Pendaftaran Magang";
  if (!spreadsheetId || !serviceAccountJson) {
    throw new Error("Spreadsheet ID dan Service Account wajib dikonfigurasi.");
  }

  const accessToken = await getAccessToken(serviceAccountJson);
  const range = encodeURIComponent(`'${sheetName}'!A1:O1`);
  const response = await fetchWithTimeout(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
    12_000,
  );
  if (!response.ok) {
    throw new Error(`Google Sheets menolak akses (${response.status}).`);
  }
  return { ok: true };
}
