import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  PUBLIC_SETTINGS_CACHE_TAG,
  PUBLIC_SETTINGS_REVALIDATE_SECONDS,
} from "@/lib/public-settings-cache";

export const publicContactKeys = [
  "PUBLIC_WHATSAPP_NUMBER",
  "PUBLIC_WHATSAPP_DISPLAY",
  "PUBLIC_PARTNERSHIP_WHATSAPP_NUMBER",
  "PUBLIC_PARTNERSHIP_WHATSAPP_DISPLAY",
  "PUBLIC_CALL_CENTER",
  "PUBLIC_EMAIL",
] as const;

export type PublicContactSettings = {
  whatsappNumber: string;
  whatsappDisplay: string;
  partnershipWhatsappNumber: string;
  partnershipWhatsappDisplay: string;
  callCenter: string;
  email: string;
};

export const defaultPublicContact: PublicContactSettings = {
  whatsappNumber: "6281112345678",
  whatsappDisplay: "0811 1234 5678",
  partnershipWhatsappNumber: "6281234567890",
  partnershipWhatsappDisplay: "0812 3456 7890",
  callCenter: "147",
  email: "support@amoechat.com",
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeWhatsAppNumber(value: string) {
  const digits = digitsOnly(value);
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return digits;
}

export function buildWhatsAppHref(number: string, text?: string) {
  const normalized = normalizeWhatsAppNumber(number);
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${normalized}${query}`;
}

export function buildTelHref(number: string) {
  const clean = number.trim();
  return `tel:${clean.replace(/[^\d+]/g, "")}`;
}

export function buildMailHref(email: string) {
  return `mailto:${email.trim()}`;
}

export const getPublicContactSettings = unstable_cache(
  async (): Promise<PublicContactSettings> => {
    try {
      const rows = await (prisma as any).apiSetting.findMany({
        where: { key: { in: [...publicContactKeys] } },
        select: { key: true, value: true },
      });
      const settings = Object.fromEntries(rows.map((row: { key: string; value: string }) => [row.key, row.value || ""]));

      const whatsappNumber = normalizeWhatsAppNumber(settings.PUBLIC_WHATSAPP_NUMBER || defaultPublicContact.whatsappNumber);
      const partnershipWhatsappNumber = normalizeWhatsAppNumber(
        settings.PUBLIC_PARTNERSHIP_WHATSAPP_NUMBER || settings.PUBLIC_WHATSAPP_NUMBER || defaultPublicContact.partnershipWhatsappNumber,
      );

      return {
        whatsappNumber,
        whatsappDisplay: settings.PUBLIC_WHATSAPP_DISPLAY || defaultPublicContact.whatsappDisplay,
        partnershipWhatsappNumber,
        partnershipWhatsappDisplay:
          settings.PUBLIC_PARTNERSHIP_WHATSAPP_DISPLAY || settings.PUBLIC_WHATSAPP_DISPLAY || defaultPublicContact.partnershipWhatsappDisplay,
        callCenter: settings.PUBLIC_CALL_CENTER || defaultPublicContact.callCenter,
        email: settings.PUBLIC_EMAIL || defaultPublicContact.email,
      };
    } catch {
      return defaultPublicContact;
    }
  },
  ["public-contact-settings"],
  { revalidate: PUBLIC_SETTINGS_REVALIDATE_SECONDS, tags: [PUBLIC_SETTINGS_CACHE_TAG] },
);
