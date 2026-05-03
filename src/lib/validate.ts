// Server-side input validation helpers

const ALLOWED_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BASE64_CHARS = 7_000_000; // ~5 MB decoded

export function validateImage(imageBase64: unknown, mediaType: unknown): string {
  if (typeof mediaType !== 'string' || !ALLOWED_MEDIA_TYPES.has(mediaType)) {
    return 'Nepodporovaný formát obrázka (povolené: JPEG, PNG, WebP, GIF)';
  }
  if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
    return 'Chýba obrázok';
  }
  const data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  if (data.length > MAX_BASE64_CHARS) {
    return 'Obrázok je príliš veľký (max 5 MB)';
  }
  return '';
}

export function validateText(value: unknown, field: string, maxLen = 200): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return `Chýba ${field}`;
  }
  if (value.length > maxLen) {
    return `${field} je príliš dlhé (max ${maxLen} znakov)`;
  }
  return '';
}

export function validateCoords(lat: unknown, lng: unknown): string {
  if (lat === undefined && lng === undefined) return ''; // optional
  const la = Number(lat);
  const lo = Number(lng);
  if (!isFinite(la) || la < -90 || la > 90) return 'Neplatná zemepisná šírka (−90 až 90)';
  if (!isFinite(lo) || lo < -180 || lo > 180) return 'Neplatná zemepisná dĺžka (−180 až 180)';
  return '';
}

export function validatePeople(value: unknown): string {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 100) {
    return 'Počet osôb musí byť medzi 1 a 100';
  }
  return '';
}

export function sanitizeText(value: string): string {
  return value.trim().slice(0, 2000);
}

/** Strip internal error details — never send raw Error.message to client */
export function clientError(msg: string): { error: string } {
  return { error: msg };
}
