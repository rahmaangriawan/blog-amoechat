export const legacyAuthCookieName = "amoechat_cms_session";
export const hostAuthCookieName = "__Host-amoechat_cms_session";

export function authCookieName() {
  return process.env.NODE_ENV === "production" ? hostAuthCookieName : legacyAuthCookieName;
}

export function acceptedAuthCookieNames() {
  return process.env.NODE_ENV === "production"
    ? [hostAuthCookieName, legacyAuthCookieName]
    : [legacyAuthCookieName];
}
