import "server-only";

import { createSign } from "crypto";
import { getApiSettings } from "@/lib/api-settings";
import { fetchWithTimeout } from "@/lib/fetch-timeout";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type GoogleApiSetting = {
  GOOGLE_GA4_PROPERTY_ID?: string;
  GOOGLE_SERVICE_ACCOUNT_JSON?: string;
};

export type GA4RunReportRow = {
  dimensionValues: Array<{ value: string }>;
  metricValues: Array<{ value: string }>;
};

export type GA4RunReportResponse = {
  rows?: GA4RunReportRow[];
  totals?: GA4RunReportRow[];
};

const TOKEN_CACHE: { token?: string; expiresAt?: number } = {};

async function getGoogleSettings(): Promise<GoogleApiSetting> {
  const settings = await getApiSettings(["GOOGLE_GA4_PROPERTY_ID", "GOOGLE_SERVICE_ACCOUNT_JSON"], 300_000);
  return {
    GOOGLE_GA4_PROPERTY_ID: settings.GOOGLE_GA4_PROPERTY_ID,
    GOOGLE_SERVICE_ACCOUNT_JSON: settings.GOOGLE_SERVICE_ACCOUNT_JSON,
  };
}

function base64url(input: Buffer | string) {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function fetchAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  if (TOKEN_CACHE.token && TOKEN_CACHE.expiresAt && TOKEN_CACHE.expiresAt > Date.now() + 30_000) {
    return TOKEN_CACHE.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const tokenUri = serviceAccount.token_uri || "https://oauth2.googleapis.com/token";
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: tokenUri,
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign("RSA-SHA256");
  signer.update(signatureInput);
  signer.end();
  const signature = base64url(signer.sign(serviceAccount.private_key));
  const assertion = `${signatureInput}.${signature}`;

  const response = await fetchWithTimeout(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
    cache: "no-store",
  }, 10_000);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gagal ambil access token Google: ${response.status} ${text.slice(0, 200)}`);
  }

  const body = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!body.access_token) {
    throw new Error("Response access token tidak valid.");
  }

  TOKEN_CACHE.token = body.access_token;
  TOKEN_CACHE.expiresAt = Date.now() + (body.expires_in ?? 3600) * 1000;
  return body.access_token;
}

export type GA4Dimension = { name: string };
export type GA4Metric = { name: string };
export type GA4DateRange = { startDate: string; endDate: string; name?: string };

export type GA4FilterExpression = {
  filter?: {
    fieldName: string;
    stringFilter?: { matchType: "EXACT" | "BEGINS_WITH" | "ENDS_WITH" | "CONTAINS" | "FULL_REGEXP" | "PARTIAL_REGEXP"; value: string };
    inListFilter?: { values: string[] };
  };
  andGroup?: { expressions: GA4FilterExpression[] };
  orGroup?: { expressions: GA4FilterExpression[] };
  notExpression?: GA4FilterExpression;
};

export type GA4RunReportInput = {
  dimensions?: GA4Dimension[];
  metrics: GA4Metric[];
  dateRanges: GA4DateRange[];
  orderBys?: Array<{ metric?: { metricName: string }; dimension?: { dimensionName: string }; desc?: boolean }>;
  limit?: number;
  dimensionFilter?: GA4FilterExpression;
};

export async function runGA4Report(input: GA4RunReportInput): Promise<GA4RunReportResponse> {
  const settings = await getGoogleSettings();
  if (!settings.GOOGLE_GA4_PROPERTY_ID) {
    throw new Error("GA4 Property ID belum dikonfigurasi. Isi di Kelola API.");
  }
  if (!settings.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error("Service Account Google belum di-upload. Upload di Kelola API.");
  }

  let serviceAccount: ServiceAccount;
  try {
    serviceAccount = JSON.parse(settings.GOOGLE_SERVICE_ACCOUNT_JSON) as ServiceAccount;
  } catch {
    throw new Error("Service Account JSON tidak valid.");
  }

  const accessToken = await fetchAccessToken(serviceAccount);
  const response = await fetchWithTimeout(
    `https://analyticsdata.googleapis.com/v1beta/properties/${settings.GOOGLE_GA4_PROPERTY_ID}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      cache: "no-store",
    },
    12_000,
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GA4 Data API error ${response.status}: ${text.slice(0, 300)}`);
  }

  return (await response.json()) as GA4RunReportResponse;
}

/**
 * Cek apakah integrasi GA4 siap dipakai (property + service account).
 */
export async function isGA4Configured(): Promise<boolean> {
  const settings = await getGoogleSettings();
  return Boolean(settings.GOOGLE_GA4_PROPERTY_ID && settings.GOOGLE_SERVICE_ACCOUNT_JSON);
}
