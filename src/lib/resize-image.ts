/**
 * Resize + convert an image to JPEG (or WebP) via canvas before upload.
 * Returns a new File at exactly TARGET_W × TARGET_H pixels, letterboxed if
 * the original aspect ratio doesn't match.
 */

export const COVER_W = 1280;
export const COVER_H = 720;
export const COVER_ASPECT = `${COVER_W}/${COVER_H}`;
export const COVER_HINT_FR = `Format recommandé : 1280 × 720 px (16:9) · JPEG, PNG ou WebP · max 3 Mo`;
export const COVER_HINT_EN = `Recommended: 1280 × 720 px (16:9) · JPEG, PNG or WebP · max 3 MB`;

export async function resizeCover(file: File): Promise<File> {
  const mime = "image/jpeg";
  const quality = 0.88;

  const bitmap = await createImageBitmap(file);
  const { width: sw, height: sh } = bitmap;

  const canvas = document.createElement("canvas");
  canvas.width = COVER_W;
  canvas.height = COVER_H;
  const ctx = canvas.getContext("2d")!;

  // Fill with a dark background for letterboxing
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, COVER_W, COVER_H);

  // Contain (letterbox) the image
  const scale = Math.min(COVER_W / sw, COVER_H / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = (COVER_W - dw) / 2;
  const dy = (COVER_H - dh) / 2;
  ctx.drawImage(bitmap, dx, dy, dw, dh);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas.toBlob failed"))), mime, quality)
  );

  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: mime });
}
