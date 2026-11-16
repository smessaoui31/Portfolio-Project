import { readdir } from "node:fs/promises";
import path from "node:path";

/** Product images available in public/images, as site paths. */
export async function listPublicImages(): Promise<string[]> {
  const root = path.join(process.cwd(), "public", "images");
  try {
    const entries = await readdir(root, { recursive: true, withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && /\.(jpe?g|png|webp|avif)$/i.test(e.name))
      .map((e) => `/images/${path.relative(root, path.join(e.parentPath, e.name)).split(path.sep).join("/")}`)
      .sort();
  } catch {
    return [];
  }
}
