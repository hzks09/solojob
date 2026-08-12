import { db } from "@/lib/db";
import { detectedObjects, type ObjectCategory } from "@/lib/db/schema";

/**
 * Détection d'objets — implémentation "placeholder" gratuite.
 * Génère une liste plausible d'objets détectés + estimation de prix à partir
 * du type de pièce, sans appel à un vrai modèle de vision (donc 0€ de coût).
 * À remplacer par un vrai modèle de détection d'objets (ex. Google Vision,
 * un modèle de segmentation sur Replicate) en gardant la même signature.
 */
const CATALOG: Record<string, { category: ObjectCategory; name: string; price: number }[]> = {
  salon: [
    { category: "canape", name: "Canapé 3 places tissu", price: 649 },
    { category: "table", name: "Table basse bois massif", price: 189 },
    { category: "tapis", name: "Tapis berbère 200x300", price: 129 },
    { category: "lampe", name: "Lampadaire arc", price: 89 },
    { category: "meuble_tv", name: "Meuble TV suspendu", price: 219 },
    { category: "plantes", name: "Plante Monstera + pot", price: 39 },
  ],
  chambre: [
    { category: "lit", name: "Lit double avec tête de lit", price: 549 },
    { category: "lampe", name: "Lampe de chevet céramique", price: 45 },
    { category: "rideaux", name: "Rideaux occultants (paire)", price: 59 },
    { category: "tapis", name: "Tapis chambre moelleux", price: 79 },
    { category: "decoration", name: "Miroir mural rond", price: 69 },
  ],
  cuisine: [
    { category: "chaise", name: "Lot de 2 chaises hautes", price: 149 },
    { category: "table", name: "Table haute mange-debout", price: 199 },
    { category: "decoration", name: "Suspension luminaire cuisine", price: 79 },
    { category: "plantes", name: "Herbes aromatiques en pot", price: 25 },
  ],
  salle_de_bain: [
    { category: "decoration", name: "Miroir lumineux LED", price: 119 },
    { category: "rideaux", name: "Rideau de douche design", price: 29 },
    { category: "plantes", name: "Plante d'intérieur résistante humidité", price: 19 },
  ],
  bureau: [
    { category: "chaise", name: "Chaise de bureau ergonomique", price: 229 },
    { category: "table", name: "Bureau bois/métal", price: 279 },
    { category: "lampe", name: "Lampe de bureau articulée", price: 49 },
    { category: "decoration", name: "Étagère murale", price: 59 },
  ],
  jardin: [
    { category: "chaise", name: "Set de 2 fauteuils extérieur", price: 259 },
    { category: "table", name: "Table basse extérieure", price: 129 },
    { category: "plantes", name: "Pack de plantes extérieures", price: 49 },
    { category: "decoration", name: "Guirlande lumineuse extérieure", price: 25 },
  ],
};

function scalePriceForBudget(price: number, budgetMode: string): number {
  const factor = { moins_500: 0.6, moins_1000: 0.85, moins_3000: 1, illimite: 1.4 }[budgetMode] ?? 1;
  return Math.round(price * factor);
}

export async function detectAndSaveObjects(generationId: string, roomType: string, budgetMode: string) {
  const items = CATALOG[roomType] ?? CATALOG.salon;

  const rows = items.map((item) => {
    const price = scalePriceForBudget(item.price, budgetMode);
    return {
      generationId,
      category: item.category,
      name: item.name,
      estimatedPrice: String(price),
      buyUrl: `https://www.google.com/search?q=${encodeURIComponent(item.name)}`,
      cheaperAlternativeName: `${item.name} (version économique)`,
      cheaperAlternativePrice: String(Math.round(price * 0.55)),
      cheaperAlternativeUrl: `https://www.google.com/search?q=${encodeURIComponent(item.name + " pas cher")}`,
      premiumAlternativeName: `${item.name} (édition premium)`,
      premiumAlternativePrice: String(Math.round(price * 2.2)),
      premiumAlternativeUrl: `https://www.google.com/search?q=${encodeURIComponent(item.name + " haut de gamme")}`,
    };
  });

  if (rows.length > 0) {
    await db.insert(detectedObjects).values(rows);
  }

  return rows.reduce((sum, r) => sum + Number(r.estimatedPrice), 0);
}
