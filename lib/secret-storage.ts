import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const prefix = "enc:v1:";

function encryptionKey() {
  const source = process.env.SETTINGS_ENCRYPTION_KEY || process.env.CMS_SESSION_SECRET;
  if (!source || (process.env.NODE_ENV === "production" && source.length < 32)) {
    throw new Error("SETTINGS_ENCRYPTION_KEY or CMS_SESSION_SECRET must be at least 32 characters.");
  }
  return createHash("sha256").update(`amoechat-settings:${source}`).digest();
}

export function encryptSecret(value: string) {
  if (!value || value.startsWith(prefix)) return value;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${prefix}${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(value: string) {
  if (!value.startsWith(prefix)) return value;
  const [ivValue, tagValue, encryptedValue] = value.slice(prefix.length).split(".");
  if (!ivValue || !tagValue || !encryptedValue) throw new Error("Encrypted setting is malformed.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
