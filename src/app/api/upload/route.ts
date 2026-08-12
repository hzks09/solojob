import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { uploadRoomImage, InvalidImageError } from "@/lib/storage/blob";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { success } = rateLimit(`upload:${session.user.id}`, 20, 60_000);
  if (!success) {
    return NextResponse.json({ error: "Trop de requêtes, réessaie dans une minute" }, { status: 429 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  try {
    const url = await uploadRoomImage(file, session.user.id);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof InvalidImageError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Échec de l'upload" }, { status: 500 });
  }
}
