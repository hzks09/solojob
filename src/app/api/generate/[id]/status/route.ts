import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { generations, projects } from "@/lib/db/schema";
import { getAIProvider } from "@/lib/ai";
import { detectAndSaveObjects } from "@/lib/shopping/detect";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const [generation] = await db.select().from(generations).where(eq(generations.id, id)).limit(1);

  if (!generation || (generation.userId !== session.user.id && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Génération introuvable" }, { status: 404 });
  }

  if (generation.status !== "processing" || !generation.providerJobId) {
    return NextResponse.json({ status: generation.status, resultImageUrl: generation.resultImageUrl });
  }

  const provider = getAIProvider();
  const result = await provider.checkStatus(generation.providerJobId);

  if (result.status === "completed") {
    await db
      .update(generations)
      .set({ status: "completed", resultImageUrl: result.resultImageUrl })
      .where(eq(generations.id, id));

    const [project] = await db.select().from(projects).where(eq(projects.id, generation.projectId)).limit(1);
    if (project) {
      const totalCost = await detectAndSaveObjects(generation.id, project.roomType, generation.budgetMode);
      await db
        .update(generations)
        .set({ estimatedTotalCost: String(totalCost) })
        .where(eq(generations.id, id));
    }
  } else if (result.status === "failed") {
    await db
      .update(generations)
      .set({ status: "failed", errorMessage: result.errorMessage })
      .where(eq(generations.id, id));
  }

  return NextResponse.json({ status: result.status, resultImageUrl: result.resultImageUrl, errorMessage: result.errorMessage });
}
