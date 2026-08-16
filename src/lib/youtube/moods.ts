/**
 * Catégories/moods prédéfinies utilisées à la fois pour alimenter le pool de
 * vidéos (job planifié, plusieurs formulations par catégorie pour faire
 * grossir le pool dans le temps, voir cron/refresh-videos) et pour
 * l'onboarding utilisateur (choix des centres d'intérêt de départ).
 *
 * Chaque mood a des sous-catégories plus précises (`subCategories`) —
 * détectées dans le titre/les tags YouTube d'une vidéo lors de l'ingestion
 * (aucun appel API supplémentaire, simple correspondance de mots-clés), et
 * proposées comme filtre affiné sur l'écran de découverte.
 */
export interface SubCategory {
  /** Identifiant stable stocké sur les vidéos et dans userTagWeights. */
  tag: string;
  label: string;
  /** Mots-clés cherchés (insensible à la casse) dans le titre/tags YouTube. */
  matchKeywords: string[];
}

export interface MoodCategory {
  tag: string;
  label: string;
  searchQueries: string[];
  subCategories: SubCategory[];
}

export const MOOD_CATEGORIES: MoodCategory[] = [
  {
    tag: "musique",
    label: "Musique chill",
    searchQueries: ["musique chill lofi", "playlist chill relax", "musique ambiance travail", "chillout beats"],
    subCategories: [
      { tag: "lofi", label: "Lofi", matchKeywords: ["lofi", "lo-fi", "lo fi"] },
      { tag: "rap", label: "Rap", matchKeywords: ["rap", "hip hop", "hip-hop"] },
      { tag: "rock", label: "Rock", matchKeywords: ["rock", "metal"] },
      { tag: "electro", label: "Électro", matchKeywords: ["electro", "edm", "techno", "house music"] },
      { tag: "classique", label: "Classique", matchKeywords: ["classique", "classical", "orchestre", "piano"] },
    ],
  },
  {
    tag: "science",
    label: "Vulgarisation science",
    searchQueries: [
      "vulgarisation scientifique",
      "physique quantique expliquée",
      "espace astronomie découverte",
      "science étonnante expérience",
    ],
    subCategories: [
      { tag: "physique", label: "Physique", matchKeywords: ["physique", "physics"] },
      { tag: "biologie", label: "Biologie", matchKeywords: ["biologie", "biology"] },
      { tag: "espace", label: "Espace", matchKeywords: ["espace", "astronomie", "nasa", "space"] },
      { tag: "chimie", label: "Chimie", matchKeywords: ["chimie", "chemistry"] },
    ],
  },
  {
    tag: "sport",
    label: "Sport",
    searchQueries: ["meilleurs moments sport", "highlights football", "moments incroyables sport", "sport extrême"],
    subCategories: [
      { tag: "foot", label: "Foot", matchKeywords: ["football", "foot ", "soccer"] },
      { tag: "basket", label: "Basket", matchKeywords: ["basket", "nba"] },
      { tag: "arts-martiaux", label: "Arts martiaux", matchKeywords: ["mma", "boxe", "karate", "judo", "arts martiaux"] },
      { tag: "fitness", label: "Fitness", matchKeywords: ["fitness", "musculation", "workout"] },
    ],
  },
  {
    tag: "humour",
    label: "Humour",
    searchQueries: ["stand-up humour sketch", "humoriste extrait", "sketch comique", "meilleurs moments humour"],
    subCategories: [
      { tag: "sketch", label: "Sketch", matchKeywords: ["sketch"] },
      { tag: "standup", label: "Stand-up", matchKeywords: ["stand-up", "stand up"] },
      { tag: "parodie", label: "Parodie", matchKeywords: ["parodie", "parody"] },
      { tag: "blague", label: "Blague/prank", matchKeywords: ["blague", "prank"] },
    ],
  },
  {
    tag: "cuisine",
    label: "Cuisine",
    searchQueries: ["recette cuisine facile", "cuisine rapide astuce", "recette du monde", "pâtisserie facile"],
    subCategories: [
      { tag: "patisserie", label: "Pâtisserie", matchKeywords: ["patisserie", "pâtisserie", "dessert", "gateau"] },
      { tag: "recette-rapide", label: "Recette rapide", matchKeywords: ["recette rapide", "cuisine rapide", "quick recipe"] },
      { tag: "cuisine-monde", label: "Cuisine du monde", matchKeywords: ["cuisine italienne", "cuisine asiatique", "cuisine du monde", "street food"] },
      { tag: "healthy", label: "Healthy", matchKeywords: ["healthy", "sain", "diet"] },
    ],
  },
  {
    tag: "voyage",
    label: "Voyage",
    searchQueries: ["carnet de voyage", "destination insolite", "road trip découverte", "voyage aventure"],
    subCategories: [
      { tag: "roadtrip", label: "Road trip", matchKeywords: ["road trip", "roadtrip"] },
      { tag: "nature", label: "Nature", matchKeywords: ["nature", "randonnee", "randonnée", "hiking"] },
      { tag: "culture", label: "Culture", matchKeywords: ["culture", "monument", "musee", "musée"] },
      { tag: "plage", label: "Plage/île", matchKeywords: ["plage", "beach", "ile", "île", "island"] },
    ],
  },
  {
    tag: "tech",
    label: "Technologie",
    searchQueries: ["actualité tech gadgets", "test smartphone", "intelligence artificielle explication", "avis high-tech"],
    subCategories: [
      { tag: "ia", label: "Intelligence artificielle", matchKeywords: ["intelligence artificielle", "chatgpt", " ia "] },
      { tag: "gaming", label: "Gaming", matchKeywords: ["gaming", "jeu video", "jeu vidéo", "gameplay"] },
      { tag: "smartphone", label: "Smartphone", matchKeywords: ["smartphone", "iphone", "android"] },
      { tag: "gadgets", label: "Gadgets", matchKeywords: ["gadget", "unboxing"] },
    ],
  },
  {
    tag: "documentaire",
    label: "Documentaire",
    searchQueries: ["documentaire histoire", "documentaire nature", "documentaire société", "enquête documentaire"],
    subCategories: [
      { tag: "histoire", label: "Histoire", matchKeywords: ["histoire", "history"] },
      { tag: "nature-doc", label: "Nature/animaux", matchKeywords: ["nature", "animaux", "wildlife"] },
      { tag: "societe", label: "Société", matchKeywords: ["societe", "société", "social"] },
      { tag: "crime", label: "Crime/enquête", matchKeywords: ["crime", "enquete", "enquête", "true crime", "affaire"] },
    ],
  },
];
