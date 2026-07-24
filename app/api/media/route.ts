import { NextResponse } from "next/server";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import { isCmsAuthenticated, getSessionRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isTrustedMutationRequest } from "@/lib/request-security";

const optimizedWidth = 1280;
const optimizedThresholdBytes = 1.5 * 1024 * 1024;

type MediaVariant = {
  width: number;
  url: string;
};

function sanitizeFileName(fileName: string, extension: string) {
  const parsed = path.parse(fileName);
  const baseName =
    parsed.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "media";
  return `${baseName}-${Date.now()}.${extension}`;
}

const detectedImageTypes = {
  jpeg: { extension: "jpg", mimeType: "image/jpeg" },
  png: { extension: "png", mimeType: "image/png" },
  webp: { extension: "webp", mimeType: "image/webp" },
  gif: { extension: "gif", mimeType: "image/gif" },
  avif: { extension: "avif", mimeType: "image/avif" },
} as const;

async function inspectImage(buffer: Buffer) {
  try {
    const { default: sharp } = await import("sharp");
    const metadata = await sharp(buffer, { animated: true, limitInputPixels: 40_000_000 }).metadata();
    const detected = metadata.format ? detectedImageTypes[metadata.format as keyof typeof detectedImageTypes] : null;
    if (!detected || !metadata.width || !metadata.height) return null;
    return { ...detected, width: metadata.width, height: metadata.height };
  } catch {
    return null;
  }
}

function publicImagePathToAbsolute(filePath: string) {
  if (!filePath.startsWith("/images/")) return null;
  const requestedPath = path.normalize(path.join(process.cwd(), "public", filePath.replace(/^\//, "")));
  const allowedDir = path.join(process.cwd(), "public", "images");
  return requestedPath.startsWith(allowedDir + path.sep) ? requestedPath : null;
}

function withImageResponseFields<T extends { filePath: string }>(item: T, variants: MediaVariant[]) {
  const optimizedSrc = variants.at(-1)?.url;
  return {
    ...item,
    variants,
    optimizedSrc,
    srcSet: variants.map((variant) => `${variant.url} ${variant.width}w`).join(", "),
  };
}

async function createOptimizedVariants(buffer: Buffer, fileName: string, mimeType: string): Promise<MediaVariant[]> {
  if (mimeType === "image/gif" || mimeType === "image/avif") return [];

  const { default: sharp } = await import("sharp");
  const optimizedDir = path.join(process.cwd(), "public", "images", "optimized");
  await mkdir(optimizedDir, { recursive: true });

  const image = sharp(buffer).rotate();
  const metadata = await image.metadata();
  const originalWidth = metadata.width ?? optimizedWidth;
  if (buffer.length < optimizedThresholdBytes && originalWidth <= optimizedWidth) return [];

  const baseName = path.parse(fileName).name;
  const outputName = `${baseName}-${optimizedWidth}.webp`;
  await image
    .resize({ width: optimizedWidth, withoutEnlargement: true })
    .webp({ quality: 74, effort: 2 })
    .toFile(path.join(optimizedDir, outputName));

  return [{ width: Math.min(originalWidth, optimizedWidth), url: `/images/optimized/${outputName}` }];
}

export async function GET(request: Request) {
  const limitBucket = rateLimit({
    key: `media:get:${getClientIp(request)}`,
    limit: 180,
    windowMs: 10 * 60 * 1000,
  });
  if (!limitBucket.allowed) {
    return NextResponse.json({ message: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });
  }

  if (!(await isCmsAuthenticated()) || (await getSessionRole()) !== "SUPER_ADMIN") {
    return NextResponse.json({ items: [], total: 0 }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 24));
  const skip = (page - 1) * limit;

  const where = { mimeType: { startsWith: "image/" } };

  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      select: {
        id: true,
        title: true,
        alt: true,
        filePath: true,
        isPublished: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.media.count({ where }),
  ]);

  const itemsWithVariants = items.map((item) => withImageResponseFields(item, []));

  return NextResponse.json({ items: itemsWithVariants, total, page, limit });
}

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const limitBucket = rateLimit({
    key: `media:post:${getClientIp(request)}`,
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!limitBucket.allowed) {
    return NextResponse.json({ message: "Terlalu banyak upload. Coba lagi nanti." }, { status: 429 });
  }

  if ((await getSessionRole()) !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("image");
  const title = String(formData.get("title") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ message: "Pilih gambar terlebih dahulu." }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ message: "Ukuran gambar maksimal 5MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const inspected = await inspectImage(buffer);
  if (!inspected) {
    return NextResponse.json({ message: "Isi file bukan gambar JPG, PNG, WEBP, GIF, atau AVIF yang valid." }, { status: 400 });
  }
  const uploadDir = path.join(process.cwd(), "public", "images");
  await mkdir(uploadDir, { recursive: true });

  const fileName = sanitizeFileName(file.name, inspected.extension);
  await writeFile(path.join(uploadDir, fileName), buffer);
  const variants = await createOptimizedVariants(buffer, fileName, inspected.mimeType);

  const item = await prisma.media.create({
    data: {
      title: title || path.parse(file.name).name,
      alt: alt || undefined,
      fileName,
      originalName: file.name,
      filePath: `/images/${fileName}`,
      mimeType: inspected.mimeType,
      fileSize: file.size,
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      alt: true,
      filePath: true,
      isPublished: true,
    },
  });

  return NextResponse.json({ item: withImageResponseFields(item, variants) });
}

export async function DELETE(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const limitBucket = rateLimit({
    key: `media:delete:${getClientIp(request)}`,
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!limitBucket.allowed) {
    return NextResponse.json({ message: "Terlalu banyak permintaan hapus. Coba lagi nanti." }, { status: 429 });
  }

  if (!(await isCmsAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Hanya SUPER_ADMIN yang boleh hapus media
  const role = await getSessionRole();
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ message: "Media ID diperlukan." }, { status: 400 });

  const existing = await prisma.media.findUnique({ where: { id }, select: { filePath: true } });
  const item = await prisma.media.delete({
    where: { id },
    select: { id: true },
  });

  if (existing?.filePath?.startsWith("/images/")) {
    // Validasi path traversal: pastikan path benar-benar di dalam public/images
    const requestedPath = publicImagePathToAbsolute(existing.filePath);
    if (requestedPath) {
      await rm(requestedPath, { force: true });
    }
    const optimizedPath = publicImagePathToAbsolute(`/images/optimized/${path.parse(existing.filePath).name}-${optimizedWidth}.webp`);
    if (optimizedPath) await rm(optimizedPath, { force: true });
  }

  return NextResponse.json({ item });
}
