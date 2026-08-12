import type { AIImageProvider, GenerationJob, GenerationRequest, GenerationResult } from "../provider";

/**
 * Fournisseur factice — 100% gratuit, aucun appel réseau externe payant.
 * Renvoie la photo originale comme "résultat" après un court délai simulé,
 * ce qui permet de développer et tester tout le flux (upload → génération →
 * historique → shopping → galerie) sans dépenser un centime. C'est le
 * fournisseur par défaut (`AI_PROVIDER=mock` dans .env.example).
 */
export class MockProvider implements AIImageProvider {
  readonly name = "mock" as const;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async startGeneration(req: GenerationRequest): Promise<GenerationJob> {
    return { providerJobId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
  }

  async checkStatus(providerJobId: string): Promise<GenerationResult> {
    // Le job encode son timestamp de création : "complété" après ~2 secondes.
    const createdAt = Number(providerJobId.split("_")[1] ?? 0);
    const elapsed = Date.now() - createdAt;

    if (elapsed < 2000) {
      return { status: "processing" };
    }

    return {
      status: "completed",
      // En mock, on renvoie une image de substitution neutre (pas de vraie transformation IA).
      resultImageUrl: "/mock/generated-placeholder.svg",
    };
  }
}
