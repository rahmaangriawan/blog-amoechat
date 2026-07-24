import "server-only";

import path from "node:path";

const publicImagesDirectory = path.resolve(process.cwd(), "public", "images");

export function publicImagePathToAbsolute(publicPath?: string | null) {
  if (!publicPath || !publicPath.startsWith("/images/")) return null;

  const relativePath = publicPath.slice("/images/".length);
  if (!relativePath || path.isAbsolute(relativePath)) return null;

  const absolutePath = path.resolve(publicImagesDirectory, relativePath);
  return absolutePath.startsWith(`${publicImagesDirectory}${path.sep}`) ? absolutePath : null;
}
