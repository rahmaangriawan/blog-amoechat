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

export function isTrustedMutationRequest(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;

  const requestOrigin = new URL(request.url).origin;
  return origin === requestOrigin || origin === configuredOrigin();
}
