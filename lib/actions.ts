"use server";

import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clearCmsSession, getSession, getSessionRole, isCmsRole, setCmsSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/format";
import { defaultAuthor } from "@/lib/authors";
import { defaultPublicContact, normalizeWhatsAppNumber } from "@/lib/public-contact";
import { syncInternshipApplicationToSheet } from "@/lib/internship-sheets";
import { PUBLIC_SETTINGS_CACHE_TAG, SEO_GLOBAL_CACHE_TAG } from "@/lib/public-settings-cache";
import { clearRedirectCache } from "@/lib/redirect-cache";
import { clearApiSettingsCache } from "@/lib/api-settings";
import { runGA4Report } from "@/lib/ga4";
import { testInternshipSheetConnection } from "@/lib/internship-sheets";
import sanitizeHtml from "sanitize-html";
import type { Metadata } from "sharp";
import { encryptSecret } from "@/lib/secret-storage";
import { publicImagePathToAbsolute } from "@/lib/media-path";

export async function saveGoogleIntegration(formData: FormData) {
  await requireSuperAdmin();
  const siteVerification = String(formData.get("GOOGLE_SITE_VERIFICATION") ?? "").trim();
  const measurementId = String(formData.get("GOOGLE_ANALYTICS_MEASUREMENT_ID") ?? "").trim();
  const propertyId = String(formData.get("GOOGLE_GA4_PROPERTY_ID") ?? "").trim();
  const searchConsoleSiteUrl = String(formData.get("GOOGLE_SEARCH_CONSOLE_SITE_URL") ?? "").trim();
  const internshipSpreadsheetId = String(formData.get("INTERNSHIP_SPREADSHEET_ID") ?? "").trim();
  const internshipSheetName = String(formData.get("INTERNSHIP_SHEET_NAME") ?? "").trim() || "Pendaftaran Magang";
  const serviceAccountFile = formData.get("GOOGLE_SERVICE_ACCOUNT_JSON_FILE");

  if (measurementId && !/^G-[A-Z0-9]+$/i.test(measurementId)) {
    throw new Error("GA4 Measurement ID harus berformat G-XXXXXXXXXX.");
  }
  if (propertyId && !/^\d+$/.test(propertyId)) {
    throw new Error("GA4 Property ID harus berupa angka.");
  }
  if (searchConsoleSiteUrl && !/^https?:\/\//i.test(searchConsoleSiteUrl)) {
    throw new Error("Search Console Site URL harus berupa URL HTTP(S).");
  }

  const settings = [
    {
      key: "GOOGLE_SITE_VERIFICATION",
      value: siteVerification,
      category: "Google",
      isSecret: false,
    },
    {
      key: "GOOGLE_ANALYTICS_MEASUREMENT_ID",
      value: measurementId,
      category: "Google",
      isSecret: false,
    },
    {
      key: "GOOGLE_GA4_PROPERTY_ID",
      value: propertyId,
      category: "Google",
      isSecret: false,
    },
    {
      key: "GOOGLE_SEARCH_CONSOLE_SITE_URL",
      value: searchConsoleSiteUrl,
      category: "Google",
      isSecret: false,
    },
    {
      key: "INTERNSHIP_SPREADSHEET_ID",
      value: internshipSpreadsheetId,
      category: "Google",
      isSecret: false,
    },
    {
      key: "INTERNSHIP_SHEET_NAME",
      value: internshipSheetName,
      category: "Google",
      isSecret: false,
    },
  ];

  for (const setting of settings) {
    await (prisma as any).apiSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, category: setting.category, isSecret: setting.isSecret },
      create: setting,
    });
  }

  if (serviceAccountFile instanceof File && serviceAccountFile.size > 0) {
    if (serviceAccountFile.size > 256 * 1024) {
      throw new Error("File Service Account maksimal 256KB.");
    }
    if (serviceAccountFile.type && !["application/json", "text/plain"].includes(serviceAccountFile.type)) {
      throw new Error("File Service Account harus berformat JSON.");
    }

    const jsonText = await serviceAccountFile.text();
    let parsed: { client_email?: string; private_key?: string; type?: string; project_id?: string };

    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error("File Service Account JSON tidak valid.");
    }

    if (parsed.type !== "service_account" || !parsed.client_email || !parsed.private_key) {
      throw new Error("File JSON bukan Service Account Google yang valid.");
    }

    await (prisma as any).apiSetting.upsert({
      where: { key: "GOOGLE_SERVICE_ACCOUNT_JSON" },
      update: { value: encryptSecret(JSON.stringify(parsed)), category: "Google", isSecret: true },
      create: {
        key: "GOOGLE_SERVICE_ACCOUNT_JSON",
        value: encryptSecret(JSON.stringify(parsed)),
        category: "Google",
        isSecret: true,
      },
    });

    await (prisma as any).apiSetting.upsert({
      where: { key: "GOOGLE_SERVICE_ACCOUNT_EMAIL" },
      update: { value: parsed.client_email, category: "Google", isSecret: false },
      create: {
        key: "GOOGLE_SERVICE_ACCOUNT_EMAIL",
        value: parsed.client_email,
        category: "Google",
        isSecret: false,
      },
    });

    const credentialMetadata = [
      {
        key: "GOOGLE_SERVICE_ACCOUNT_FILE_NAME",
        value: serviceAccountFile.name || "service-account.json",
      },
      {
        key: "GOOGLE_SERVICE_ACCOUNT_UPDATED_AT",
        value: new Date().toISOString(),
      },
    ];
    for (const setting of credentialMetadata) {
      await (prisma as any).apiSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value, category: "Google", isSecret: false },
        create: { ...setting, category: "Google", isSecret: false },
      });
    }
  }

  clearApiSettingsCache();
  updateTag(PUBLIC_SETTINGS_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/program/daftar");
  revalidatePath("/dashboard/settings/api");
  redirect("/dashboard/settings/api?saved=1");
}

function safeConnectionMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Koneksi gagal.";
  if (/belum|wajib|tidak valid/i.test(message)) return message.slice(0, 180);
  return "Google menolak koneksi. Periksa ID, akses property, nama sheet, dan izin Service Account.";
}

export async function testGa4Connection() {
  await requireSuperAdmin();
  let outcome = "ok";
  let message = "";
  try {
    await runGA4Report({
      metrics: [{ name: "activeUsers" }],
      dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
      limit: 1,
    });
  } catch (error) {
    outcome = "error";
    message = safeConnectionMessage(error);
  }
  redirect(`/dashboard/settings/api?ga4=${outcome}${message ? `&message=${encodeURIComponent(message)}` : ""}`);
}

export async function testSheetsConnection() {
  await requireSuperAdmin();
  let outcome = "ok";
  let message = "";
  try {
    await testInternshipSheetConnection();
  } catch (error) {
    outcome = "error";
    message = safeConnectionMessage(error);
  }
  redirect(`/dashboard/settings/api?sheets=${outcome}${message ? `&message=${encodeURIComponent(message)}` : ""}`);
}

export async function deleteGoogleServiceAccount() {
  await requireSuperAdmin();
  await (prisma as any).apiSetting.deleteMany({
    where: { key: { in: ["GOOGLE_SERVICE_ACCOUNT_JSON", "GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_FILE_NAME", "GOOGLE_SERVICE_ACCOUNT_UPDATED_AT"] } },
  });
  clearApiSettingsCache();
  updateTag(PUBLIC_SETTINGS_CACHE_TAG);
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard/settings/api");
  redirect("/dashboard/settings/api?credential=deleted");
}

const mediaSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  alt: z.string().optional(),
  isPublished: z.boolean().default(true),
  currentFilePath: z.string().optional(),
});

const cmsRoleSchema = z.enum(["SUPER_ADMIN", "ADMIN", "MARKETING", "MEMBER"]);

const articleCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  publishedAt: z.string().optional(),
  type: z.enum(["POST", "PAGE"]),
  categoryId: z.string().optional(),
  authorId: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isPublished: z.coerce.boolean().default(false),
  currentFeaturedImage: z.string().optional(),
});

const seoGlobalSchema = z.object({
  id: z.string().optional(),
  siteTitle: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  canonicalUrl: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().optional(),
  headerLogo: z.string().optional(),
  footerLogo: z.string().optional(),
  favicon: z.string().optional(),
  appleTouchIcon: z.string().optional(),
  ogDefaultImage: z.string().optional(),
  allowIndexing: z.boolean().default(true),
  disallowPaths: z.string().optional(),
  includeBlogSitemap: z.boolean().default(true),
  includePagesSitemap: z.boolean().default(true),
});

const redirectSchema = z.object({
  id: z.string().optional(),
  sourceUrl: z.string().min(1),
  targetUrl: z.string().min(1),
  type: z.coerce.number().refine((value) => value === 301 || value === 302, "Status code harus 301 atau 302."),
  isActive: z.boolean().default(true),
});

async function revalidateArticlePublicPaths(articleId: string) {
  const article = await (prisma as any).article.findUnique({
    where: { id: articleId },
    select: { slug: true, type: true },
  });

  if (!article) return;

  if (article.type === "POST") {
    revalidatePath("/blog");
    revalidatePath(`/blog/${article.slug}`);
  } else {
    revalidatePath(`/${article.slug}`);
  }
}

function checkboxValue(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function optionalText(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value || undefined;
}

function sanitizeRichHtml(value?: string) {
  if (!value) return undefined;

  const sanitized = sanitizeHtml(value, {
    allowedTags: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "blockquote", "code", "pre",
      "h2", "h3", "h4", "h5", "ul", "ol", "li", "a", "img", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td", "hr", "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      span: ["class"],
      code: ["class"],
      pre: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
      img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }, true),
    },
  });

  return sanitized.trim() || undefined;
}

function normalizePathOrUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("URL wajib diisi.");

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const url = new URL(trimmed);
    return `${url.pathname}${url.search}${url.hash}` || "/";
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function assertValidRedirectUrl(value: string, fieldName: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    new URL(value);
    return;
  }

  if (!value.startsWith("/")) {
    throw new Error(`${fieldName} harus diawali / atau berupa URL absolut.`);
  }
}

function normalizeOptionalSeoUrl(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      return new URL(trimmed).toString();
    } catch {
      return undefined;
    }
  }

  if (trimmed.startsWith("/")) return trimmed;

  if (trimmed.includes(".")) {
    try {
      return new URL(`https://${trimmed}`).toString();
    } catch {
      return undefined;
    }
  }

  return `/${trimmed.replace(/^\/+/, "")}`;
}

function sanitizeFileName(fileName: string, extension: string) {
  const parsed = path.parse(fileName);
  const baseName = parsed.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "media";
  return `${baseName}-${randomUUID()}.${extension}`;
}

const detectedImageTypes = {
  jpeg: { extension: "jpg", mimeType: "image/jpeg" },
  png: { extension: "png", mimeType: "image/png" },
  webp: { extension: "webp", mimeType: "image/webp" },
  gif: { extension: "gif", mimeType: "image/gif" },
  avif: { extension: "avif", mimeType: "image/avif" },
} as const;

async function persistMediaFile(file: File) {
  if (file.size > 5 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 5MB.");

  const buffer = Buffer.from(await file.arrayBuffer());
  let metadata: Metadata;
  try {
    const { default: sharp } = await import("sharp");
    metadata = await sharp(buffer, { animated: true, limitInputPixels: 40_000_000 }).metadata();
  } catch {
    throw new Error("Isi file bukan gambar yang valid.");
  }
  const detected = metadata.format ? detectedImageTypes[metadata.format as keyof typeof detectedImageTypes] : null;
  if (!detected || !metadata.width || !metadata.height) {
    throw new Error("Format gambar harus JPG, PNG, WEBP, GIF, atau AVIF.");
  }
  const uploadDir = path.join(process.cwd(), "public", "images");
  await mkdir(uploadDir, { recursive: true });

  const fileName = sanitizeFileName(file.name, detected.extension);
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  return {
    fileName,
    filePath: `/images/${fileName}`,
    originalName: file.name,
    mimeType: detected.mimeType,
    fileSize: file.size,
  };
}

async function removeFileIfExists(publicPath?: string | null) {
  const absolutePath = publicImagePathToAbsolute(publicPath);
  if (!absolutePath) return;
  await rm(absolutePath, { force: true });
}

export async function loginCms(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");
  const remember = formData.get("remember") === "on";
  const turnstileResponse = formData.get("cf-turnstile-response");

  // Rate limit per email (mencegah brute force untuk akun spesifik)
  const limitByEmail = rateLimit({
    key: `login:email:${email || "unknown"}`,
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });

  if (!limitByEmail.allowed) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  // Rate limit per IP (mencegah scan email/credential stuffing)
  try {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
      || headersList.get("x-real-ip")
      || "unknown";
    const limitByIp = rateLimit({
      key: `login:ip:${ip}`,
      limit: 30,
      windowMs: 15 * 60 * 1000,
    });
    if (!limitByIp.allowed) {
      redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
    }
  } catch {
    // Headers tidak available di test, skip
  }

  if (process.env.TURNSTILE_SECRET_KEY) {
    if (!turnstileResponse) {
      redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
    }
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${turnstileResponse}`,
    });
    const verifyJson = await verifyRes.json();
    if (!verifyJson.success) {
      redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
    }
  }

  let user: { email: string; passwordHash: string; role: string; isActive: boolean } | null = null;
  try {
    user = await (prisma as any).user.findUnique({
      where: { email },
      select: { email: true, passwordHash: true, role: true, isActive: true },
    });
  } catch {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  // Anti timing attack: kalau user tidak ada, tetap jalankan bcrypt compare dummy
  // supaya waktu eksekusi sama dengan kasus user ada tapi password salah
  const DUMMY_HASH = "$2b$12$" + "a".repeat(53);
  if (!user || !user.isActive) {
    await bcrypt.compare(password, DUMMY_HASH).catch(() => false);
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  if (!isCmsRole(user.role)) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  await setCmsSession(user.email, user.role, remember, user.passwordHash);
  redirect(next.startsWith("/dashboard") ? next : "/dashboard");
}

export async function logoutCms() {
  await clearCmsSession();
  redirect("/login");
}

// ─── User Management (SUPER_ADMIN only) ───────────────────────────────────────

async function requireSuperAdmin() {
  const role = await getSessionRole();
  if (role !== "SUPER_ADMIN") throw new Error("Unauthorized");
}

async function buildUniqueAuthorSlug(name: string, currentUserId?: string) {
  const base = slugify(name) || "author";
  let candidate = base;
  let counter = 2;

  while (true) {
    const existing = await (prisma as any).user.findFirst({
      where: {
        authorSlug: candidate,
        ...(currentUserId ? { NOT: { id: currentUserId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) return candidate;
    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

export async function createUser(formData: FormData) {
  await requireSuperAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = cmsRoleSchema.safeParse(String(formData.get("role") ?? "MEMBER"));
  const isAuthor = formData.get("isAuthor") === "true" || formData.get("isAuthor") === "on";
  const authorRole = String(formData.get("authorRole") ?? "").trim();
  const authorBio = String(formData.get("authorBio") ?? "").trim();
  const authorAvatarUrl = String(formData.get("authorAvatarUrl") ?? "").trim();

  if (!name || !email || password.length < 8 || !role.success) {
    return { error: "Data tidak valid. Password minimal 8 karakter." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const authorSlug = isAuthor ? await buildUniqueAuthorSlug(name) : null;
  try {
    await (prisma as any).user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role.data,
        isAuthor,
        authorSlug,
        authorRole: authorRole || defaultAuthor.role,
        authorBio: authorBio || defaultAuthor.bio,
        authorAvatarUrl,
      },
    });
  } catch {
    return { error: "Email sudah terdaftar." };
  }
  revalidatePath("/dashboard/users");
  if (authorSlug) {
    revalidatePath("/author");
    revalidatePath(`/author/${authorSlug}`);
  }
  return { success: true };
}

export async function updateUser(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = cmsRoleSchema.safeParse(String(formData.get("role") ?? "MEMBER"));
  const isActive = formData.get("isActive") === "true";
  const isAuthor = formData.get("isAuthor") === "true" || formData.get("isAuthor") === "on";
  const authorRole = String(formData.get("authorRole") ?? "").trim();
  const authorBio = String(formData.get("authorBio") ?? "").trim();
  const authorAvatarUrl = String(formData.get("authorAvatarUrl") ?? "").trim();

  if (!id || !name || !email || !role.success) return { error: "Data tidak valid." };

  const current = await (prisma as any).user.findUnique({
    where: { id },
    select: { authorSlug: true },
  });

  const data: Record<string, unknown> = {
    name,
    email,
    role: role.data,
    isActive,
    isAuthor,
    authorSlug: current?.authorSlug || (isAuthor ? await buildUniqueAuthorSlug(name, id) : null),
    authorRole: authorRole || defaultAuthor.role,
    authorBio: authorBio || defaultAuthor.bio,
    authorAvatarUrl,
  };
  if (password && password.length >= 8) {
    data.passwordHash = await bcrypt.hash(password, 12);
  }

  try {
    await (prisma as any).user.update({ where: { id }, data });
  } catch {
    return { error: "Gagal memperbarui user." };
  }
  revalidatePath("/dashboard/users");
  if (current?.authorSlug || current?.isAuthor || isAuthor) {
    const authorSlug = data.authorSlug as string | null | undefined;
    if (authorSlug) {
      revalidatePath("/author");
      revalidatePath(`/author/${authorSlug}`);
    }
    const authoredPosts = await (prisma as any).article.findMany({
      where: { authorId: id, type: "POST" },
      select: { slug: true },
    });
    revalidatePath("/");
    revalidatePath("/blog");
    for (const post of authoredPosts) {
      revalidatePath(`/blog/${post.slug}`);
    }
  }
  return { success: true };
}

export async function deleteUser(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  const session = await getSession();
  const sessionEmail = session !== false ? session.email : null;
  const current = await (prisma as any).user.findUnique({ where: { id }, select: { email: true, name: true, authorSlug: true, isAuthor: true } });
  if (current?.email && current.email === sessionEmail) {
    return { error: "Tidak bisa menghapus akun yang sedang login." };
  }
  const authoredPosts = current?.isAuthor
    ? await (prisma as any).article.findMany({
        where: { authorId: id, type: "POST" },
        select: { slug: true },
      })
    : [];
  await (prisma as any).user.delete({ where: { id } });
  revalidatePath("/dashboard/users");
  if (current?.isAuthor) {
    revalidatePath("/author");
    revalidatePath(`/author/${current.authorSlug || slugify(current.name)}`);
    revalidatePath("/");
    revalidatePath("/blog");
    for (const post of authoredPosts) {
      revalidatePath(`/blog/${post.slug}`);
    }
  }
  return { success: true };
}

export async function saveMedia(formData: FormData) {
  await requireSuperAdmin();
  const file = formData.get("image");
  const parsed = mediaSchema.parse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    alt: formData.get("alt") || undefined,
    isPublished: checkboxValue(formData, "isPublished"),
    currentFilePath: formData.get("currentFilePath") || undefined,
  });

  if (!(file instanceof File) || file.size === 0) {
    if (!parsed.id) {
      throw new Error("Pilih gambar terlebih dahulu.");
    }

    await prisma.media.update({
      where: { id: parsed.id },
      data: {
        title: parsed.title,
        alt: parsed.alt,
        isPublished: parsed.isPublished,
      },
    });

    revalidatePath("/dashboard/media");
    revalidatePath("/dashboard");
    return;
  }

  const uploaded = await persistMediaFile(file);

  if (parsed.id) {
    const existing = await prisma.media.findUnique({
      where: { id: parsed.id },
      select: { filePath: true },
    });
    await prisma.media.update({
      where: { id: parsed.id },
      data: {
        title: parsed.title,
        alt: parsed.alt,
        fileName: uploaded.fileName,
        originalName: uploaded.originalName,
        filePath: uploaded.filePath,
        mimeType: uploaded.mimeType,
        fileSize: uploaded.fileSize,
        isPublished: parsed.isPublished,
      },
    });
    await removeFileIfExists(existing?.filePath);
  } else {
    await prisma.media.create({
      data: {
        title: parsed.title,
        alt: parsed.alt,
        fileName: uploaded.fileName,
        originalName: uploaded.originalName,
        filePath: uploaded.filePath,
        mimeType: uploaded.mimeType,
        fileSize: uploaded.fileSize,
        isPublished: parsed.isPublished,
      },
    });
  }

  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard");
}

export async function deleteMedia(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id"));
  const item = await prisma.media.findUnique({ where: { id } });
  if (!item) return;

  await prisma.media.delete({ where: { id } });
  await removeFileIfExists(item.filePath);

  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard");
}

export async function updateInternshipApplicationStatus(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowedStatuses = ["PENDING", "REVIEWED", "CONTACTED", "ACCEPTED", "REJECTED"];

  if (!id || !allowedStatuses.includes(status)) {
    return { error: "Status pendaftaran magang tidak valid." };
  }

  await (prisma as any).internshipApplication.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/internship-applications");
  return { success: true, status };
}

export async function retryInternshipSheetSync(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Data pendaftaran magang tidak valid." };

  const item = await (prisma as any).internshipApplication.findUnique({ where: { id } });
  if (!item) return { error: "Pendaftaran magang tidak ditemukan." };

  try {
    const result = await syncInternshipApplicationToSheet(item);
    if (!result.ok) {
      await (prisma as any).internshipApplication.update({
        where: { id },
        data: { sheetSyncError: result.reason || "Google Sheets belum dikonfigurasi." },
      });
      return { error: result.reason || "Google Sheets belum dikonfigurasi." };
    }

    await (prisma as any).internshipApplication.update({
      where: { id },
      data: { sheetSyncedAt: new Date(), sheetSyncError: null },
    });
    revalidatePath("/dashboard/internship-applications");
    return { success: true };
  } catch (error: any) {
    const message = error?.message || "Gagal sync ke Google Sheets.";
    await (prisma as any).internshipApplication.update({
      where: { id },
      data: { sheetSyncError: message },
    });
    return { error: message };
  }
}

export async function saveSeoGlobal(formData: FormData) {
  await requireSuperAdmin();
  const data = seoGlobalSchema.parse({
    id: formData.get("id") || undefined,
    siteTitle: optionalText(formData, "siteTitle"),
    metaTitle: optionalText(formData, "metaTitle"),
    metaDescription: optionalText(formData, "metaDescription"),
    metaKeywords: optionalText(formData, "metaKeywords"),
    canonicalUrl: optionalText(formData, "canonicalUrl"),
    ogTitle: optionalText(formData, "ogTitle"),
    ogDescription: optionalText(formData, "ogDescription"),
    ogImage: optionalText(formData, "ogImage"),
    twitterTitle: optionalText(formData, "twitterTitle"),
    twitterDescription: optionalText(formData, "twitterDescription"),
    twitterImage: optionalText(formData, "twitterImage"),
    headerLogo: optionalText(formData, "headerLogo"),
    footerLogo: optionalText(formData, "footerLogo"),
    favicon: optionalText(formData, "favicon"),
    appleTouchIcon: optionalText(formData, "appleTouchIcon"),
    ogDefaultImage: optionalText(formData, "ogDefaultImage"),
    allowIndexing: checkboxValue(formData, "allowIndexing"),
    disallowPaths: optionalText(formData, "disallowPaths"),
    includeBlogSitemap: checkboxValue(formData, "includeBlogSitemap"),
    includePagesSitemap: checkboxValue(formData, "includePagesSitemap"),
  });

  const { id, ...fields } = data;
  fields.canonicalUrl = normalizeOptionalSeoUrl(fields.canonicalUrl);
  fields.ogImage = normalizeOptionalSeoUrl(fields.ogImage);
  fields.twitterImage = normalizeOptionalSeoUrl(fields.twitterImage);
  fields.headerLogo = normalizeOptionalSeoUrl(fields.headerLogo);
  fields.footerLogo = normalizeOptionalSeoUrl(fields.footerLogo);
  fields.favicon = normalizeOptionalSeoUrl(fields.favicon);
  fields.appleTouchIcon = normalizeOptionalSeoUrl(fields.appleTouchIcon);
  fields.ogDefaultImage = normalizeOptionalSeoUrl(fields.ogDefaultImage);

  const existing = id
    ? await (prisma as any).seoGlobal.update({ where: { id }, data: fields })
    : await (prisma as any).seoGlobal.create({ data: fields });

  updateTag(SEO_GLOBAL_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/robots.txt");
  revalidatePath("/sitemap.xml");
  revalidatePath("/dashboard/settings/seo");
  redirect(`/dashboard/settings/seo?tab=homepage&saved=1&id=${existing.id}`);
}

async function saveSeoFields(id: string | undefined, fields: Record<string, unknown>) {
  if (id) {
    return (prisma as any).seoGlobal.update({ where: { id }, data: fields });
  }

  const latest = await (prisma as any).seoGlobal.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (latest) {
    return (prisma as any).seoGlobal.update({ where: { id: latest.id }, data: fields });
  }
  return (prisma as any).seoGlobal.create({ data: fields });
}

function nullableText(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

function normalizeNullableSeoUrl(formData: FormData, name: string) {
  return normalizeOptionalSeoUrl(nullableText(formData, name) || undefined) || null;
}

function revalidateSeoPublicRoutes() {
  updateTag(SEO_GLOBAL_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/robots.txt");
  revalidatePath("/sitemap.xml");
  revalidatePath("/dashboard/settings/seo");
}

export async function saveSeoHomepage(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id") || "") || undefined;
  const saved = await saveSeoFields(id, {
    siteTitle: nullableText(formData, "siteTitle"),
    metaTitle: nullableText(formData, "metaTitle"),
    metaDescription: nullableText(formData, "metaDescription"),
    metaKeywords: nullableText(formData, "metaKeywords"),
    canonicalUrl: normalizeNullableSeoUrl(formData, "canonicalUrl"),
    ogTitle: nullableText(formData, "ogTitle"),
    ogDescription: nullableText(formData, "ogDescription"),
    ogImage: normalizeNullableSeoUrl(formData, "ogImage"),
    twitterTitle: nullableText(formData, "twitterTitle"),
    twitterDescription: nullableText(formData, "twitterDescription"),
    twitterImage: normalizeNullableSeoUrl(formData, "twitterImage"),
    allowIndexing: checkboxValue(formData, "allowIndexing"),
    disallowPaths: nullableText(formData, "disallowPaths"),
    includeBlogSitemap: checkboxValue(formData, "includeBlogSitemap"),
    includePagesSitemap: checkboxValue(formData, "includePagesSitemap"),
  });
  revalidateSeoPublicRoutes();
  redirect(`/dashboard/settings/seo?tab=homepage&saved=1&id=${saved.id}`);
}

export async function saveSeoBranding(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id") || "") || undefined;
  const saved = await saveSeoFields(id, {
    headerLogo: normalizeNullableSeoUrl(formData, "headerLogo"),
    footerLogo: normalizeNullableSeoUrl(formData, "footerLogo"),
    favicon: normalizeNullableSeoUrl(formData, "favicon"),
    appleTouchIcon: normalizeNullableSeoUrl(formData, "appleTouchIcon"),
    ogDefaultImage: normalizeNullableSeoUrl(formData, "ogDefaultImage"),
  });
  revalidateSeoPublicRoutes();
  redirect(`/dashboard/settings/seo?tab=branding&saved=1&id=${saved.id}`);
}

export async function saveRedirect(formData: FormData) {
  await requireSuperAdmin();
  const data = redirectSchema.parse({
    id: formData.get("id") || undefined,
    sourceUrl: String(formData.get("sourceUrl") ?? ""),
    targetUrl: String(formData.get("targetUrl") ?? ""),
    type: formData.get("type"),
    isActive: checkboxValue(formData, "isActive"),
  });

  const sourceUrl = normalizePathOrUrl(data.sourceUrl);
  const targetUrl = data.targetUrl.trim();

  assertValidRedirectUrl(sourceUrl, "URL lama");
  assertValidRedirectUrl(targetUrl, "URL baru");

  if (sourceUrl === targetUrl || normalizePathOrUrl(targetUrl) === sourceUrl) {
    throw new Error("Redirect loop terdeteksi. URL lama dan URL baru tidak boleh sama.");
  }

  const duplicate = await (prisma as any).redirect.findUnique({ where: { sourceUrl } });
  if (duplicate && duplicate.id !== data.id) {
    throw new Error("URL lama sudah dipakai redirect lain.");
  }

  const loopTarget = targetUrl.startsWith("/") ? await (prisma as any).redirect.findUnique({ where: { sourceUrl: targetUrl } }) : null;
  if (loopTarget?.targetUrl === sourceUrl) {
    throw new Error("Redirect loop dua arah terdeteksi.");
  }

  if (data.id) {
    await (prisma as any).redirect.update({
      where: { id: data.id },
      data: { sourceUrl, targetUrl, type: data.type, isActive: data.isActive },
    });
  } else {
    await (prisma as any).redirect.create({
      data: { sourceUrl, targetUrl, type: data.type, isActive: data.isActive },
    });
  }

  clearRedirectCache();
  revalidatePath("/dashboard/settings/seo");
  redirect("/dashboard/settings/seo?tab=redirects&saved=1");
}

export async function toggleRedirect(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id"));
  const isActive = String(formData.get("isActive")) === "true";
  await (prisma as any).redirect.update({ where: { id }, data: { isActive } });
  clearRedirectCache();
  revalidatePath("/dashboard/settings/seo");
}

export async function deleteRedirect(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id"));
  await (prisma as any).redirect.delete({ where: { id } });
  clearRedirectCache();
  revalidatePath("/dashboard/settings/seo");
}

export async function saveArticleCategory(formData: FormData) {
  await requireSuperAdmin();
  const data = articleCategorySchema.parse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    metaTitle: formData.get("metaTitle") || undefined,
    metaDescription: formData.get("metaDescription") || undefined,
  });
  const slug = slugify(data.slug || data.name);

  const savedCategory = data.id
    ? await (prisma as any).articleCategory.update({ where: { id: data.id }, data: { ...data, slug } })
    : await (prisma as any).articleCategory.create({ data: { ...data, slug } });

  revalidatePath("/dashboard/articles/categories");
  redirect(`/dashboard/articles/categories/${savedCategory.id}?saved=1`);
}

export async function deleteArticleCategory(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id"));
  await (prisma as any).articleCategory.delete({ where: { id } });
  revalidatePath("/dashboard/articles/categories");
}

export async function saveArticle(formData: FormData) {
  const listPath = formData.get("type") === "PAGE" ? "/dashboard/articles/pages" : "/dashboard/articles/posts";
  const newPath = `${listPath}/new`;

  try {
    await requireSuperAdmin();
  } catch {
    redirect("/dashboard");
  }

  const isPublishedValue = formData.get("isPublished");
  const isPublished = isPublishedValue === "true";
  let data;
  try {
    data = articleSchema.parse({
      id: formData.get("id") || undefined,
      title: formData.get("title"),
      slug: formData.get("slug") || undefined,
      excerpt: formData.get("excerpt") || undefined,
      content: formData.get("content") || undefined,
      publishedAt: formData.get("publishedAt") || undefined,
      type: formData.get("type"),
      categoryId: formData.get("categoryId") || undefined,
      authorId: formData.get("authorId") || undefined,
      metaTitle: formData.get("metaTitle") || undefined,
      metaDescription: formData.get("metaDescription") || undefined,
      isPublished,
      currentFeaturedImage: formData.get("currentFeaturedImage") || undefined,
    });
  } catch (err) {
    console.error("[saveArticle] validation failed:", err);
    redirect(newPath);
  }

  try {
    const slug = slugify(data.slug || data.title);
    const duplicateSlug = await (prisma as any).article.findUnique({ where: { slug }, select: { id: true } });
    if (duplicateSlug && duplicateSlug.id !== data.id) {
      redirect(data.id ? `${listPath}/${data.id}?error=duplicate-slug` : `${newPath}?error=duplicate-slug`);
    }
    let publishedAt: Date | undefined;

    if (data.publishedAt) {
      try {
        publishedAt = new Date(data.publishedAt);
        if (isNaN(publishedAt.getTime())) {
          publishedAt = undefined;
        }
      } catch {
        publishedAt = undefined;
      }
    }

    if (!publishedAt && data.isPublished) {
      const jakartaOffset = 7 * 60 * 60 * 1000;
      const utcTime = new Date().getTime();
      publishedAt = new Date(utcTime + jakartaOffset);
    }

    const existingArticle = data.id
      ? await (prisma as any).article.findUnique({
          where: { id: data.id },
          select: { authorId: true, featuredImage: true },
        })
      : null;

    const selectedAuthorId = String(data.authorId || "").trim();
    let authorId: string | null = null;
    if (data.type === "POST") {
      if (selectedAuthorId) {
        const selectedAuthor = await (prisma as any).user.findFirst({
          where: {
            id: selectedAuthorId,
            isAuthor: true,
            isActive: true,
          },
          select: { id: true },
        });
        if (!selectedAuthor) {
          return { error: "Author tidak valid." };
        }
        authorId = selectedAuthor.id;
      } else if (existingArticle?.authorId) {
        authorId = existingArticle.authorId;
      } else {
        const fallbackAuthor = await (prisma as any).user.findFirst({
          where: {
            isAuthor: true,
            isActive: true,
          },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
        authorId = fallbackAuthor?.id || null;
      }
    } else if (existingArticle?.authorId) {
      authorId = existingArticle.authorId;
    }

    const file = formData.get("featuredImage");
    let featuredImage: string | undefined = existingArticle?.featuredImage || undefined;

    if (file instanceof File && file.size > 0) {
      const uploaded = await persistMediaFile(file);
      featuredImage = uploaded.filePath;

      const altText = uploaded.fileName
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ")
        .replace(/\d+/g, "")
        .replace(/\s+/g, " ")
        .trim();

      await (prisma as any).media.create({
        data: {
          title: altText,
          alt: altText,
          fileName: uploaded.fileName,
          originalName: uploaded.originalName,
          filePath: uploaded.filePath,
          mimeType: uploaded.mimeType,
          fileSize: uploaded.fileSize,
          isPublished: true,
        },
      });

      if (existingArticle?.featuredImage) {
        await removeFileIfExists(existingArticle.featuredImage);
      }
    }

    const { id, currentFeaturedImage, publishedAt: _pa, categoryId, authorId: _unusedAuthorId, ...articleFields } = data;

    const articleData = {
      ...articleFields,
      excerpt: sanitizeRichHtml(articleFields.excerpt),
      content: sanitizeRichHtml(articleFields.content),
      slug,
      publishedAt,
      featuredImage,
      ...(authorId ? { author: { connect: { id: authorId } } } : id && existingArticle?.authorId ? { author: { disconnect: true } } : {}),
      ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
    };

    const savedArticle = id
      ? await (prisma as any).article.update({ where: { id }, data: articleData })
      : await (prisma as any).article.create({ data: articleData });

    revalidatePath(listPath);
    revalidatePath(`${listPath}/${savedArticle.id}`);
    revalidatePath("/");
    if (savedArticle.type === "POST") {
      revalidatePath("/blog");
      revalidatePath(`/blog/${savedArticle.slug}`);
      revalidatePath("/author");

      const authorIds = new Set<string>();
      if (existingArticle?.authorId) authorIds.add(existingArticle.authorId);
      if (savedArticle.authorId) authorIds.add(savedArticle.authorId);

      for (const authorIdValue of authorIds) {
        const author = await (prisma as any).user.findUnique({
          where: { id: authorIdValue },
          select: { authorSlug: true, name: true },
        });
        const authorPath = author?.authorSlug || slugify(author?.name || "");
        if (authorPath) {
          revalidatePath(`/author/${authorPath}`);
        }
      }
    } else {
      revalidatePath(`/${savedArticle.slug}`);
    }

    redirect(`${listPath}/${savedArticle.id}?saved=1`);
  } catch (err) {
    if ((err as any)?.digest?.startsWith?.("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("[saveArticle] unexpected error:", err);
    const fallbackId = data?.id || "new";
    redirect(`${listPath}/${fallbackId}?error=unknown`);
  }
}

export async function deleteArticle(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id"));
  const type = String(formData.get("type") || "POST");
  const current = await (prisma as any).article.findUnique({
    where: { id },
    select: { slug: true, authorId: true },
  });
  const deleted = await (prisma as any).article.delete({ where: { id } });
  revalidatePath(type === "PAGE" ? "/dashboard/articles/pages" : "/dashboard/articles/posts");
  if (type === "POST") {
    revalidatePath("/blog");
    revalidatePath(`/blog/${deleted.slug}`);
    revalidatePath("/");
    revalidatePath("/author");
    if (current?.authorId) {
      const author = await (prisma as any).user.findUnique({
        where: { id: current.authorId },
        select: { authorSlug: true, name: true },
      });
      const authorPath = author?.authorSlug || slugify(author?.name || "");
      if (authorPath) {
        revalidatePath(`/author/${authorPath}`);
      }
    }
  } else {
    revalidatePath(`/${deleted.slug}`);
  }
}

export async function approveComment(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id"));
  const comment = await (prisma as any).comment.update({
    where: { id },
    data: { isApproved: true, status: "APPROVED" },
    select: { articleId: true },
  });

  revalidatePath("/dashboard/comments");
  await revalidateArticlePublicPaths(comment.articleId);
}

export async function rejectComment(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id"));
  const comment = await (prisma as any).comment.update({
    where: { id },
    data: { isApproved: false, status: "REJECTED" },
    select: { articleId: true },
  });

  revalidatePath("/dashboard/comments");
  await revalidateArticlePublicPaths(comment.articleId);
}

export async function deleteComment(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id"));
  const comment = await (prisma as any).comment.delete({
    where: { id },
    select: { articleId: true },
  });

  revalidatePath("/dashboard/comments");
  await revalidateArticlePublicPaths(comment.articleId);
}

export async function savePublicContactSettings(formData: FormData) {
  await requireSuperAdmin();
  const whatsappNumber = normalizeWhatsAppNumber(String(formData.get("PUBLIC_WHATSAPP_NUMBER") ?? "").trim());
  const whatsappDisplay = String(formData.get("PUBLIC_WHATSAPP_DISPLAY") ?? "").trim();
  const partnershipWhatsappNumber = normalizeWhatsAppNumber(String(formData.get("PUBLIC_PARTNERSHIP_WHATSAPP_NUMBER") ?? "").trim());
  const partnershipWhatsappDisplay = String(formData.get("PUBLIC_PARTNERSHIP_WHATSAPP_DISPLAY") ?? "").trim();
  const callCenter = String(formData.get("PUBLIC_CALL_CENTER") ?? "").trim();
  const email = String(formData.get("PUBLIC_EMAIL") ?? "").trim().toLowerCase();
  const authorName = String(formData.get("PUBLIC_AUTHOR_NAME") ?? "").trim();
  const authorRole = String(formData.get("PUBLIC_AUTHOR_ROLE") ?? "").trim();
  const authorBio = String(formData.get("PUBLIC_AUTHOR_BIO") ?? "").trim();
  const authorAvatarUrl = String(formData.get("PUBLIC_AUTHOR_AVATAR_URL") ?? "").trim();
  if (email && !z.string().email().safeParse(email).success) {
    throw new Error("Email support tidak valid.");
  }
  if (authorAvatarUrl && !authorAvatarUrl.startsWith("/") && !/^https?:\/\//i.test(authorAvatarUrl)) {
    throw new Error("URL avatar harus berupa path lokal atau URL HTTP(S).");
  }

  const settings = [
    { key: "PUBLIC_WHATSAPP_NUMBER", value: whatsappNumber || defaultPublicContact.whatsappNumber, category: "Kontak Publik", isSecret: false },
    { key: "PUBLIC_WHATSAPP_DISPLAY", value: whatsappDisplay || defaultPublicContact.whatsappDisplay, category: "Kontak Publik", isSecret: false },
    {
      key: "PUBLIC_PARTNERSHIP_WHATSAPP_NUMBER",
      value: partnershipWhatsappNumber || whatsappNumber || defaultPublicContact.partnershipWhatsappNumber,
      category: "Kontak Publik",
      isSecret: false,
    },
    {
      key: "PUBLIC_PARTNERSHIP_WHATSAPP_DISPLAY",
      value: partnershipWhatsappDisplay || whatsappDisplay || defaultPublicContact.partnershipWhatsappDisplay,
      category: "Kontak Publik",
      isSecret: false,
    },
    { key: "PUBLIC_CALL_CENTER", value: callCenter || defaultPublicContact.callCenter, category: "Kontak Publik", isSecret: false },
    { key: "PUBLIC_EMAIL", value: email || defaultPublicContact.email, category: "Kontak Publik", isSecret: false },
    { key: "PUBLIC_AUTHOR_NAME", value: authorName || defaultAuthor.name, category: "Kontak Publik", isSecret: false },
    { key: "PUBLIC_AUTHOR_ROLE", value: authorRole || defaultAuthor.role, category: "Kontak Publik", isSecret: false },
    { key: "PUBLIC_AUTHOR_BIO", value: authorBio || defaultAuthor.bio, category: "Kontak Publik", isSecret: false },
    { key: "PUBLIC_AUTHOR_AVATAR_URL", value: authorAvatarUrl, category: "Kontak Publik", isSecret: false },
  ];

  for (const setting of settings) {
    await (prisma as any).apiSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, category: setting.category, isSecret: setting.isSecret },
      create: setting,
    });
  }

  clearApiSettingsCache();
  updateTag(PUBLIC_SETTINGS_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/bantuan");
  revalidatePath("/program");
  revalidatePath("/kebijakan-privasi");
  revalidatePath("/blog");
  revalidatePath("/author");
  revalidatePath("/sitemap.xml");
  revalidatePath("/dashboard/settings/api");
  redirect("/dashboard/settings/api?contact=1");
}

export async function markNotificationsSeen() {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };
  if ((await getSessionRole()) !== "SUPER_ADMIN") return { error: "Forbidden" };

  const { markAllNotificationsSeen } = await import("@/lib/notifications");
  await markAllNotificationsSeen(session.email);
  return { success: true };
}
