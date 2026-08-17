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

/**
 * Identifiant de la catégorie "Music" chez YouTube. Le site ne diffuse pas de
 * contenu musical : ce filtre est appliqué à l'entrée du pool (job planifié et
 * suggestions utilisateur), car une vidéo musicale peut remonter dans les
 * résultats d'une recherche non musicale.
 */
export const YOUTUBE_MUSIC_CATEGORY_ID = "10";

// Volontairement sans catégorie musique — choix éditorial du site, à ne pas
// réintroduire sans validation explicite.
export const MOOD_CATEGORIES: MoodCategory[] = [
  {
    tag: "science",
    label: "Vulgarisation science",
    searchQueries: [
      "vulgarisation scientifique",
      "physique quantique expliquée",
      "espace astronomie découverte",
      "science étonnante expérience",
      "documentaire scientifique français",
      "comment ça marche science",
      "mathématiques expliquées simplement",
      "cerveau neurosciences explication",
      "chimie expérience spectaculaire",
      "biologie évolution explication",
      "conférence scientifique grand public",
      "énigme scientifique résolue",
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
    searchQueries: [
      "meilleurs moments sport",
      "highlights football",
      "moments incroyables sport",
      "sport extrême",
      "résumé match football",
      "basket NBA highlights",
      "MMA combat résumé",
      "athlétisme record du monde",
      "rugby meilleures actions",
      "tennis point incroyable",
      "cyclisme étape résumé",
      "musculation conseils entraînement",
    ],
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
    searchQueries: [
      "stand-up humour sketch",
      "humoriste extrait",
      "sketch comique",
      "meilleurs moments humour",
      "one man show extrait",
      "parodie drôle française",
      "caméra cachée drôle",
      "improvisation comique",
      "best of humour français",
      "sketch culte français",
      "humoriste spectacle extrait",
      "compilation moments drôles",
    ],
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
    searchQueries: [
      "recette cuisine facile",
      "cuisine rapide astuce",
      "recette du monde",
      "pâtisserie facile",
      "recette healthy équilibrée",
      "cuisine italienne authentique",
      "street food découverte",
      "recette végétarienne facile",
      "technique de chef cuisine",
      "dessert gourmand recette",
      "cuisine asiatique recette",
      "batch cooking semaine",
    ],
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
    searchQueries: [
      "carnet de voyage",
      "destination insolite",
      "road trip découverte",
      "voyage aventure",
      "documentaire voyage pays",
      "vlog voyage japon",
      "randonnée montagne paysage",
      "voyage islande norvège",
      "découverte ville europe",
      "trek aventure nature",
      "voyage asie découverte",
      "plus beaux paysages du monde",
    ],
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
    searchQueries: [
      "actualité tech gadgets",
      "test smartphone",
      "intelligence artificielle explication",
      "avis high-tech",
      "test ordinateur portable",
      "tutoriel informatique débutant",
      "histoire de l'informatique",
      "programmation expliquée",
      "cybersécurité explication",
      "innovation technologique futur",
      "analyse jeu vidéo",
      "test matériel high-tech",
    ],
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
    searchQueries: [
      "documentaire histoire",
      "documentaire nature",
      "documentaire société",
      "enquête documentaire",
      "documentaire animalier",
      "documentaire seconde guerre mondiale",
      "documentaire égypte antique",
      "reportage société française",
      "documentaire océan",
      "documentaire espace univers",
      "histoire de france documentaire",
      "documentaire archéologie",
    ],
    subCategories: [
      { tag: "histoire", label: "Histoire", matchKeywords: ["histoire", "history"] },
      { tag: "nature-doc", label: "Nature/animaux", matchKeywords: ["nature", "animaux", "wildlife"] },
      { tag: "societe", label: "Société", matchKeywords: ["societe", "société", "social"] },
      { tag: "crime", label: "Crime/enquête", matchKeywords: ["crime", "enquete", "enquête", "true crime", "affaire"] },
    ],
  },
];
