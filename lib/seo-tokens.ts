const CURRENT_YEAR_TOKEN = /%currentyear%/g;

export function getJakartaCurrentYear(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(now);
}

export function resolveSeoTokens(value?: string | null, now?: Date) {
  if (!value) return "";
  return value.replace(CURRENT_YEAR_TOKEN, getJakartaCurrentYear(now));
}

export function normalizeSeoTitle(value?: string | null, siteTitle = "Amoechat") {
  const cleanTitle = value?.trim();
  const cleanSiteTitle = siteTitle.trim() || "Amoechat";
  if (!cleanTitle) return cleanSiteTitle;

  const escapedSiteTitle = cleanSiteTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const suffixPattern = new RegExp(`(?:\\s*[|\\-]\\s*${escapedSiteTitle})+$`, "i");
  return cleanTitle.replace(suffixPattern, "").trim() || cleanSiteTitle;
}

export function resolveDocumentTitle(value?: string | null, siteTitle = "Amoechat", now?: Date) {
  const cleanSiteTitle = siteTitle.trim() || "Amoechat";
  const normalized = normalizeSeoTitle(resolveSeoTokens(value, now), cleanSiteTitle);
  return normalized.toLowerCase() === cleanSiteTitle.toLowerCase()
    ? cleanSiteTitle
    : `${normalized} | ${cleanSiteTitle}`;
}
