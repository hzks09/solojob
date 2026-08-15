/**
 * Catégories/moods prédéfinies utilisées à la fois pour alimenter le pool de
 * vidéos (job planifié, plusieurs formulations par catégorie pour faire
 * grossir le pool dans le temps, voir cron/refresh-videos) et pour
 * l'onboarding utilisateur (choix des centres d'intérêt de départ).
 */
export interface MoodCategory {
  tag: string;
  label: string;
  searchQueries: string[];
}

export const MOOD_CATEGORIES: MoodCategory[] = [
  {
    tag: "musique",
    label: "Musique chill",
    searchQueries: ["musique chill lofi", "playlist chill relax", "musique ambiance travail", "chillout beats"],
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
  },
  {
    tag: "sport",
    label: "Sport",
    searchQueries: ["meilleurs moments sport", "highlights football", "moments incroyables sport", "sport extrême"],
  },
  {
    tag: "humour",
    label: "Humour",
    searchQueries: ["stand-up humour sketch", "humoriste extrait", "sketch comique", "meilleurs moments humour"],
  },
  {
    tag: "cuisine",
    label: "Cuisine",
    searchQueries: ["recette cuisine facile", "cuisine rapide astuce", "recette du monde", "pâtisserie facile"],
  },
  {
    tag: "voyage",
    label: "Voyage",
    searchQueries: ["voyage travel vlog", "destination insolite", "road trip découverte", "voyage aventure"],
  },
  {
    tag: "tech",
    label: "Technologie",
    searchQueries: ["actualité tech gadgets", "test smartphone", "intelligence artificielle explication", "tech review"],
  },
  {
    tag: "documentaire",
    label: "Documentaire",
    searchQueries: ["documentaire histoire", "documentaire nature", "documentaire société", "enquête documentaire"],
  },
];
