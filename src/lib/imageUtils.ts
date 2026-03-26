/**
 * Convert an image File to WebP format using Canvas API.
 * Falls back to original file if conversion fails.
 * @param file - Original image file
 * @param quality - WebP quality (0-1), default 0.82
 * @returns Converted WebP File
 */
export async function convertToWebP(file: File, quality = 0.82): Promise<File> {
  // Skip if already webp or if it's an SVG
  if (file.type === "image/webp" || file.type === "image/svg+xml") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const blob = await canvas.convertToBlob({ type: "image/webp", quality });
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } catch {
    // OffscreenCanvas not supported — fallback to regular canvas
    try {
      return await convertToWebPFallback(file, quality);
    } catch {
      return file;
    }
  }
}

function convertToWebPFallback(file: File, quality: number): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); resolve(file); return; }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve(new File([blob], `${baseName}.webp`, { type: "image/webp" }));
        },
        "image/webp",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

/**
 * Get WebP file path from original path
 */
export function toWebPPath(path: string): string {
  return path.replace(/\.[^.]+$/, ".webp");
}
