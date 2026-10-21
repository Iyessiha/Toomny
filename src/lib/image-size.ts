/**
 * Lecture des dimensions d'une image à partir de ses octets, sans la décoder.
 * Sert à refuser côté serveur une couverture qui n'est pas en paysage : le contrôle
 * du navigateur peut être contourné.
 */

/** Ratio minimal largeur / hauteur d'une couverture (paysage). */
export const MIN_COVER_RATIO = 1.25;

export type ImageSize = { width: number; height: number };

function readPng(b: Uint8Array): ImageSize | null {
  if (b.length < 24) return null;
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function readJpeg(b: Uint8Array): ImageSize | null {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    // Marqueurs de début de cadre (SOF), hors DHT, JPG et DAC.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] };
    }
    // Marqueurs sans longueur.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const length = (b[i + 2] << 8) | b[i + 3];
    i += 2 + length;
  }
  return null;
}

function readWebp(b: Uint8Array): ImageSize | null {
  if (b.length < 30) return null;
  const chunk = String.fromCharCode(b[12], b[13], b[14], b[15]);
  if (chunk === "VP8 ") {
    return { width: ((b[26] | (b[27] << 8)) & 0x3fff), height: ((b[28] | (b[29] << 8)) & 0x3fff) };
  }
  if (chunk === "VP8L") {
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") {
    const width = (b[24] | (b[25] << 8) | (b[26] << 16)) + 1;
    const height = (b[27] | (b[28] << 8) | (b[29] << 16)) + 1;
    return { width, height };
  }
  return null;
}

/** Dimensions de l'image, ou null si le format n'est pas reconnu. */
export function readImageSize(bytes: Uint8Array): ImageSize | null {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return readPng(bytes);
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return readJpeg(bytes);
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57) return readWebp(bytes);
  return null;
}

/** Vrai si l'image est nettement plus large que haute. Faux si les dimensions sont illisibles. */
export function isLandscapeBytes(bytes: Uint8Array): boolean {
  const size = readImageSize(bytes);
  return !!size && size.height > 0 && size.width / size.height >= MIN_COVER_RATIO;
}
