import "server-only";

function configuredOrigin() {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function publicOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  if (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(requestUrl.hostname)) {
    return requestUrl.origin;
  }
  return configuredOrigin() || "https://blog.amoechat.com";
}

type TrustedMutationOptions = {
  requireSource?: boolean;
};

function requestSourceOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin;

  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function isTrustedMutationRequest(request: Request, options: TrustedMutationOptions = {}) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  const sourceOrigin = requestSourceOrigin(request);
  if (!sourceOrigin) return !options.requireSource;

  const requestOrigin = new URL(request.url).origin;
  return sourceOrigin === requestOrigin || sourceOrigin === configuredOrigin();
}

export function isRequestBodyWithinLimit(request: Request, maxBytes: number) {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) return true;

  const parsed = Number(contentLength);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= maxBytes;
}
