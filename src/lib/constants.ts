import type {
  BudgetMode,
  GenerationQuality,
  ObjectCategory,
  PlanTier,
  RoomType,
  TransformationLevel,
} from "@/lib/db/schema";

export const ROOM_TYPES: { value: RoomType; label: string; icon: string }[] = [
  { value: "salon", label: "Salon", icon: "sofa" },
  { value: "chambre", label: "Chambre", icon: "bed" },
  { value: "cuisine", label: "Cuisine", icon: "cooking-pot" },
  { value: "salle_de_bain", label: "Salle de bain", icon: "bath" },
  { value: "bureau", label: "Bureau", icon: "briefcase" },
  { value: "jardin", label: "Jardin", icon: "trees" },
];

export const DESIGN_STYLES = [
  { value: "minimaliste", label: "Minimaliste" },
  { value: "scandinave", label: "Scandinave" },
  { value: "moderne", label: "Moderne" },
  { value: "japonais", label: "Japonais" },
  { value: "industriel", label: "Industriel" },
  { value: "luxe", label: "Luxe" },
  { value: "vintage", label: "Vintage" },
  { value: "gaming", label: "Gaming" },
  { value: "cottage", label: "Cottage" },
  { value: "mediterraneen", label: "Méditerranéen" },
  { value: "futuriste", label: "Futuriste" },
] as const;

export type DesignStyle = (typeof DESIGN_STYLES)[number]["value"];

export const BUDGET_MODES: { value: BudgetMode; label: string; maxAmount: number | null }[] = [
  { value: "moins_500", label: "Moins de 500 €", maxAmount: 500 },
  { value: "moins_1000", label: "Moins de 1000 €", maxAmount: 1000 },
  { value: "moins_3000", label: "Moins de 3000 €", maxAmount: 3000 },
  { value: "illimite", label: "Illimité", maxAmount: null },
];

export const TRANSFORMATION_LEVELS: { value: TransformationLevel; label: string; description: string }[] = [
  { value: "leger", label: "Léger", description: "Retouches légères, structure et meubles conservés" },
  { value: "modere", label: "Modéré", description: "Nouvelle décoration, quelques meubles remplacés" },
  { value: "complet", label: "Complet", description: "Réaménagement complet dans le style choisi" },
];

export const OBJECT_CATEGORIES: { value: ObjectCategory; label: string }[] = [
  { value: "canape", label: "Canapé" },
  { value: "lit", label: "Lit" },
  { value: "chaise", label: "Chaise" },
  { value: "table", label: "Table" },
  { value: "tapis", label: "Tapis" },
  { value: "lampe", label: "Lampe" },
  { value: "meuble_tv", label: "Meuble TV" },
  { value: "decoration", label: "Décoration" },
  { value: "plantes", label: "Plantes" },
  { value: "rideaux", label: "Rideaux" },
];

/** Coût en crédits par niveau de qualité de génération. */
export const CREDIT_COST: Record<GenerationQuality, number> = {
  standard: 1,
  hd: 2,
  ultra_hd: 5,
};

export const CREDIT_REASON_BY_QUALITY: Record<GenerationQuality, "generation_standard" | "generation_hd" | "generation_ultra_hd"> = {
  standard: "generation_standard",
  hd: "generation_hd",
  ultra_hd: "generation_ultra_hd",
};

/**
 * Plafond mensuel "usage raisonnable" pour les forfaits marqués "illimité".
 * Protège la marge si le coût du fournisseur IA est facturé à la génération :
 * un forfait "illimité" sans plafond peut coûter plus cher que son prix si
 * un utilisateur génère massivement. Le client ne voit jamais ce chiffre en
 * usage normal — seulement s'il l'atteint (voir /api/generate).
 */
export const FAIR_USE_MONTHLY_CAP: Partial<Record<PlanTier, number>> = {
  pro: 250,
  premium: 180,
};

export interface PlanConfig {
  tier: PlanTier;
  name: string;
  priceMonthly: number;
  monthlyCredits: number | "illimite";
  maxQuality: GenerationQuality;
  watermark: boolean;
  designerAi: boolean;
  privateGallery: boolean;
  features: string[];
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    tier: "free",
    name: "Gratuit",
    priceMonthly: 0,
    monthlyCredits: 5,
    maxQuality: "standard",
    watermark: true,
    designerAi: false,
    privateGallery: false,
    features: ["5 générations", "Qualité standard", "Filigrane"],
  },
  pro: {
    tier: "pro",
    name: "Pro",
    priceMonthly: 14,
    monthlyCredits: "illimite",
    maxQuality: "hd",
    watermark: false,
    designerAi: false,
    privateGallery: false,
    features: [
      "Générations illimitées",
      "Qualité HD",
      "Téléchargement sans filigrane",
      "Accès à tous les styles",
    ],
  },
  premium: {
    tier: "premium",
    name: "Premium",
    priceMonthly: 29,
    monthlyCredits: "illimite",
    maxQuality: "ultra_hd",
    watermark: false,
    designerAi: true,
    privateGallery: true,
    features: [
      "Rendu Ultra HD",
      "Rendu rapide",
      "Designer IA",
      "Projets illimités",
      "Export 4K",
      "Galerie privée",
    ],
  },
};
