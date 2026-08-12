import type { AIImageProvider, AiProviderName } from "./provider";
import { MockProvider } from "./providers/mock";
import { ReplicateProvider } from "./providers/replicate";

export * from "./provider";

let cached: AIImageProvider | null = null;

/**
 * Sélectionne le fournisseur IA actif via la variable d'env AI_PROVIDER.
 * Par défaut "mock" (gratuit) tant que aucun fournisseur payant n'est configuré.
 */
export function getAIProvider(): AIImageProvider {
  if (cached) return cached;

  const name = (process.env.AI_PROVIDER ?? "mock") as AiProviderName;

  switch (name) {
    case "replicate":
      cached = new ReplicateProvider();
      break;
    case "mock":
      cached = new MockProvider();
      break;
    case "fal":
    case "openai":
      throw new Error(`Fournisseur IA "${name}" pas encore implémenté — ajouter src/lib/ai/providers/${name}.ts`);
    default:
      cached = new MockProvider();
  }

  return cached;
}
