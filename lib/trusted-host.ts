const localHostnames = new Set(["localhost", "127.0.0.1", "::1"]);
const productionHostname = "blog.amoechat.com";

function configuredHostnames() {
  const values = [process.env.NEXT_PUBLIC_SITE_URL, ...(process.env.TRUSTED_HOSTS || "").split(",")];
  const hostnames = new Set([productionHostname]);

  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    try {
      hostnames.add(new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`).hostname.toLowerCase());
    } catch {
      // Invalid optional entries are ignored; productionHostname remains available.
    }
  }

  return hostnames;
}

export function isTrustedRequestHost(request: Request) {
  if (process.env.NODE_ENV !== "production") return true;

  const rawHost = request.headers.get("host");
  if (!rawHost) return false;

  try {
    const hostname = new URL(`http://${rawHost}`).hostname.toLowerCase();
    return localHostnames.has(hostname) || configuredHostnames().has(hostname);
  } catch {
    return false;
  }
}
