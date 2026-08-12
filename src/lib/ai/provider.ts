/**
 * Interface commune à tous les fournisseurs de génération d'image IA.
 * Permet de changer de fournisseur (Replicate, fal.ai, OpenAI...) en ne
 * touchant qu'à `src/lib/ai/index.ts` et en ajoutant un fichier dans
 * `src/lib/ai/providers/`. Le reste de l'app ne dépend jamais d'un SDK
 * spécifique à un fournisseur.
 */

export interface GenerationRequest {
  /** URL publique (Vercel Blob) de la photo originale de la pièce. */
  imageUrl: string;
  style: string;
  roomType: string;
  budgetMode: string;
  dominantColors: string[];
  furnitureType?: string;
  materials?: string;
  ambiance?: string;
  transformationLevel: string;
  /** Mode "Designer IA" — description libre en langage naturel. */
  customPrompt?: string;
  quality: "standard" | "hd" | "ultra_hd";
}

export interface GenerationJob {
  providerJobId: string;
}

export type GenerationJobStatus = "processing" | "completed" | "failed";

export interface GenerationResult {
  status: GenerationJobStatus;
  resultImageUrl?: string;
  errorMessage?: string;
}

export type AiProviderName = "replicate" | "fal" | "openai" | "gemini" | "mock";

export interface AIImageProvider {
  readonly name: AiProviderName;
  startGeneration(req: GenerationRequest): Promise<GenerationJob>;
  checkStatus(providerJobId: string): Promise<GenerationResult>;
}
