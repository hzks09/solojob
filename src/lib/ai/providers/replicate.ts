import type { AIImageProvider, GenerationJob, GenerationRequest, GenerationResult } from "../provider";
import { buildPrompt } from "../prompt";

const REPLICATE_API = "https://api.replicate.com/v1/predictions";

/**
 * Fournisseur Replicate — PAYANT à l'usage (facturé par Replicate dès qu'une
 * génération est lancée). N'est utilisé que si AI_PROVIDER=replicate dans
 * .env.local. Nécessite REPLICATE_API_TOKEN + REPLICATE_MODEL_VERSION
 * (version d'un modèle image-to-image adapté à l'architecture d'intérieur,
 * ex. un modèle ControlNet/SDXL "interior design").
 */
export class ReplicateProvider implements AIImageProvider {
  readonly name = "replicate" as const;

  private get token() {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) throw new Error("REPLICATE_API_TOKEN manquant");
    return token;
  }

  private get modelVersion() {
    const version = process.env.REPLICATE_MODEL_VERSION;
    if (!version) throw new Error("REPLICATE_MODEL_VERSION manquant");
    return version;
  }

  async startGeneration(req: GenerationRequest): Promise<GenerationJob> {
    const prompt = buildPrompt(req);

    const res = await fetch(REPLICATE_API, {
      method: "POST",
      headers: {
        Authorization: `Token ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: this.modelVersion,
        input: {
          image: req.imageUrl,
          prompt,
          // Un modèle image-to-image type ControlNet accepte généralement
          // ce paramètre pour doser fidélité structure vs. liberté créative.
          prompt_strength: req.transformationLevel === "leger" ? 0.35 : req.transformationLevel === "complet" ? 0.8 : 0.55,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Replicate startGeneration a échoué (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { id: string };
    return { providerJobId: data.id };
  }

  async checkStatus(providerJobId: string): Promise<GenerationResult> {
    const res = await fetch(`${REPLICATE_API}/${providerJobId}`, {
      headers: { Authorization: `Token ${this.token}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Replicate checkStatus a échoué (${res.status}): ${body}`);
    }

    const data = (await res.json()) as {
      status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
      output?: string | string[];
      error?: string;
    };

    if (data.status === "succeeded") {
      const output = Array.isArray(data.output) ? data.output.at(-1) : data.output;
      return { status: "completed", resultImageUrl: output };
    }
    if (data.status === "failed" || data.status === "canceled") {
      return { status: "failed", errorMessage: data.error ?? "Génération échouée" };
    }
    return { status: "processing" };
  }
}
