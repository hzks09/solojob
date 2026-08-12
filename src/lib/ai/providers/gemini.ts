import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import type { AIImageProvider, GenerationJob, GenerationRequest, GenerationResult } from "../provider";
import { buildPrompt } from "../prompt";

const GEMINI_MODEL = "gemini-2.5-flash-image";
const GEMINI_API = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Fournisseur Google Gemini ("Nano Banana") — GRATUIT dans les limites du
 * tier gratuit de Google AI Studio (quota de requêtes/minute et/jour, voir
 * https://ai.google.dev/gemini-api/docs/rate-limits). Génération synchrone :
 * tout le travail se fait dans `startGeneration`, `checkStatus` ne fait que
 * relire le résultat déjà obtenu (encodé dans le "providerJobId").
 */
export class GeminiProvider implements AIImageProvider {
  readonly name = "gemini" as const;

  private get apiKey() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY manquant");
    return key;
  }

  async startGeneration(req: GenerationRequest): Promise<GenerationJob> {
    const prompt = buildPrompt(req);

    const imageRes = await fetch(req.imageUrl);
    if (!imageRes.ok) throw new Error("Impossible de récupérer la photo originale");
    const imageBuffer = await imageRes.arrayBuffer();
    const mimeType = imageRes.headers.get("content-type") ?? "image/jpeg";
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    const res = await fetch(GEMINI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64Image } }],
          },
        ],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini a échoué (${res.status}): ${body}`);
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
    };

    const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part?.inlineData?.data) {
      throw new Error("Gemini n'a renvoyé aucune image (contenu probablement filtré)");
    }

    const outputBuffer = Buffer.from(part.inlineData.data, "base64");
    const ext = part.inlineData.mimeType?.split("/")[1] ?? "png";
    const blob = await put(`generations/${nanoid(12)}.${ext}`, outputBuffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: part.inlineData.mimeType ?? "image/png",
    });

    // Le résultat est déjà prêt : on l'encode directement dans le job id.
    return { providerJobId: `gemini_done:${blob.url}` };
  }

  async checkStatus(providerJobId: string): Promise<GenerationResult> {
    if (providerJobId.startsWith("gemini_done:")) {
      return { status: "completed", resultImageUrl: providerJobId.slice("gemini_done:".length) };
    }
    return { status: "failed", errorMessage: "Job Gemini invalide" };
  }
}
