import { NextResponse } from "next/server";
import { and, count, eq, gte } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { generations, projects, users } from "@/lib/db/schema";
import { consumeCredits } from "@/lib/db/credits";
import { createGenerationSchema } from "@/lib/validations/generation";
import { CREDIT_COST, CREDIT_REASON_BY_QUALITY, FAIR_USE_MONTHLY_CAP, PLANS } from "@/lib/constants";
import { getAIProvider } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";

const QUALITY_RANK = { standard: 0, hd: 1, ultra_hd: 2 } as const;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { success } = rateLimit(`generate:${session.user.id}`, 15, 60_000);
  if (!success) {
    return NextResponse.json({ error: "Trop de requêtes, réessaie dans une minute" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createGenerationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide" }, { status: 400 });
  }
  const input = parsed.data;

  const [project] = await db.select().from(projects).where(eq(projects.id, input.projectId)).limit(1);
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  const [dbUser] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!dbUser) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const planConfig = PLANS[dbUser.plan];
  if (QUALITY_RANK[input.quality] > QUALITY_RANK[planConfig.maxQuality]) {
    return NextResponse.json(
      { error: `Ton forfait "${planConfig.name}" ne permet pas la qualité "${input.quality}". Passe à un forfait supérieur.` },
      { status: 403 }
    );
  }

  if (input.customPrompt && !planConfig.designerAi) {
    return NextResponse.json(
      { error: 'Le mode "Designer IA" est réservé au forfait Premium.' },
      { status: 403 }
    );
  }

  const creditsNeeded = CREDIT_COST[input.quality];
  if (planConfig.monthlyCredits === "illimite") {
    // Pas de débit de crédits, mais plafond d'usage raisonnable pour protéger
    // la marge (le fournisseur IA payant est facturé à la génération).
    const cap = FAIR_USE_MONTHLY_CAP[dbUser.plan];
    if (cap) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [{ value: countThisMonth }] = await db
        .select({ value: count() })
        .from(generations)
        .where(and(eq(generations.userId, session.user.id), gte(generations.createdAt, startOfMonth)));

      if (countThisMonth >= cap) {
        return NextResponse.json(
          {
            error:
              "Tu as atteint la limite d'usage raisonnable de ton forfait pour ce mois-ci. Contacte le support si tu as un besoin spécifique.",
          },
          { status: 429 }
        );
      }
    }
  } else {
    const debited = await consumeCredits(
      session.user.id,
      creditsNeeded,
      CREDIT_REASON_BY_QUALITY[input.quality]
    );
    if (!debited) {
      return NextResponse.json({ error: "Crédits insuffisants" }, { status: 402 });
    }
  }

  const providerName = (process.env.AI_PROVIDER ?? "mock") as "mock" | "replicate" | "fal" | "openai";

  const [generation] = await db
    .insert(generations)
    .values({
      projectId: input.projectId,
      userId: session.user.id,
      originalImageUrl: input.imageUrl,
      style: input.style,
      budgetMode: input.budgetMode,
      dominantColors: input.dominantColors,
      furnitureType: input.furnitureType,
      materials: input.materials,
      ambiance: input.ambiance,
      transformationLevel: input.transformationLevel,
      customPrompt: input.customPrompt,
      quality: input.quality,
      creditsUsed: creditsNeeded,
      status: "processing",
      provider: providerName,
      watermarked: planConfig.watermark,
    })
    .returning();

  try {
    const provider = getAIProvider();
    const job = await provider.startGeneration({
      imageUrl: input.imageUrl,
      style: input.style,
      roomType: input.roomType,
      budgetMode: input.budgetMode,
      dominantColors: input.dominantColors,
      furnitureType: input.furnitureType,
      materials: input.materials,
      ambiance: input.ambiance,
      transformationLevel: input.transformationLevel,
      customPrompt: input.customPrompt,
      quality: input.quality,
    });

    await db
      .update(generations)
      .set({ providerJobId: job.providerJobId })
      .where(eq(generations.id, generation.id));

    return NextResponse.json({ generationId: generation.id, providerJobId: job.providerJobId });
  } catch (err) {
    await db
      .update(generations)
      .set({ status: "failed", errorMessage: err instanceof Error ? err.message : "Erreur inconnue" })
      .where(eq(generations.id, generation.id));

    return NextResponse.json({ error: "Le lancement de la génération a échoué" }, { status: 502 });
  }
}
