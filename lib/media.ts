import { readdir, stat } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function isImageFile(fileName: string) {
  return IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function titleFromFileName(fileName: string) {
  const baseName = path.parse(fileName).name;
  return baseName
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase()) || fileName;
}

async function getImageMetadata(publicPath: string) {
  const absolutePath = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
  const fileStat = await stat(absolutePath);
  const fileName = path.basename(publicPath);
  const extension = path.extname(fileName).toLowerCase();
  const mimeType =
    extension === ".jpg" || extension === ".jpeg"
      ? "image/jpeg"
      : extension === ".png"
        ? "image/png"
        : extension === ".gif"
          ? "image/gif"
          : extension === ".avif"
            ? "image/avif"
            : "image/webp";

  return {
    title: titleFromFileName(fileName),
    alt: titleFromFileName(fileName),
    fileName,
    originalName: fileName,
    filePath: publicPath,
    mimeType,
    fileSize: fileStat.size,
  };
}

export async function syncMediaFromPublicImages() {
  try {
    const imagesDir = path.join(process.cwd(), "public", "images");
    const entries = await readdir(imagesDir, { withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile() && isImageFile(entry.name));

    const existingMedia = await prisma.media.findMany({ select: { filePath: true } });
    const knownPaths = new Set(existingMedia.map((item) => item.filePath));

    const missing = [] as Awaited<ReturnType<typeof getImageMetadata>>[];
    for (const file of files) {
      const publicPath = `/images/${file.name}`;
      if (knownPaths.has(publicPath)) continue;
      try {
        missing.push(await getImageMetadata(publicPath));
      } catch {
        // skip file yang tidak bisa dibaca
      }
    }

    if (missing.length > 0) {
      await prisma.media.createMany({ data: missing, skipDuplicates: true });
    }
  } catch (error) {
    // Folder tidak ada atau DB tidak tersedia — halaman tetap bisa dibuka
    console.warn("syncMediaFromPublicImages skipped:", error instanceof Error ? error.message : error);
  }
}