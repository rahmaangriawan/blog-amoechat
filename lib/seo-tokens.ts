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
