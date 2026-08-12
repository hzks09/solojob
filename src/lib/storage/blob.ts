import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 Mo

export class InvalidImageError extends Error {}

/**
 * Upload une photo utilisateur vers Vercel Blob (tier gratuit en dev : quelques
 * Go inclus). Valide le type MIME et la taille avant tout upload pour éviter
 * les abus de stockage.
 */
export async function uploadRoomImage(file: File, userId: string): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new InvalidImageError("Format d'image non supporté (jpeg, png, webp uniquement)");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new InvalidImageError("Image trop volumineuse (15 Mo maximum)");
  }

  const ext = file.type.split("/")[1];
  const pathname = `rooms/${userId}/${nanoid(12)}.${ext}`;

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return blob.url;
}
