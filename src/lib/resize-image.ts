/**
 * Prépare une photo de couverture : paysage uniquement, recadrée en 1280 × 720 px (16:9), JPEG.
 * Une photo carrée ou en portrait est refusée (CoverNotLandscapeError) plutôt que déformée ou bordée.
 */

export const COVER_W = 1280;
export const COVER_H = 720;
export const COVER_ASPECT = `${COVER_W}/${COVER_H}`;
// Largeur / hauteur minimale. 1.25 = 5:4 : en dessous, l'image est trop carrée pour une couverture.
import { MIN_COVER_RATIO } from "./image-size";
export const COVER_HINT_FR = `Format recommandé : 1280 × 720 px (16:9) · paysage uniquement · JPEG, PNG ou WebP · max 3 Mo`;
export const COVER_HINT_EN = `Recommended: 1280 × 720 px (16:9) · landscape only · JPEG, PNG or WebP · max 3 MB`;

export class CoverNotLandscapeError extends Error {
  constructor() {
    super("cover-not-landscape");
    this.name = "CoverNotLandscapeError";
  }
}

export function isLandscape(width: number, height: number): boolean {
  return height > 0 && width / height >= MIN_COVER_RATIO;
}

export async function resizeCover(file: File): Promise<File> {
  const mime = "image/jpeg";
  const quality = 0.88;

  const bitmap = await createImageBitmap(file);
  const { width: sw, height: sh } = bitmap;

  if (!isLandscape(sw, sh)) {
    bitmap.close();
    throw new CoverNotLandscapeError();
  }

  const canvas = document.createElement("canvas");
  canvas.width = COVER_W;
  canvas.height = COVER_H;
  const ctx = canvas.getContext("2d")!;

  // Remplit le cadre 16:9 : on agrandit puis on recadre au centre (pas de bandes).
  const scale = Math.max(COVER_W / sw, COVER_H / sh);
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
