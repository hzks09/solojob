/**
 * Catégories/moods prédéfinies utilisées à la fois pour alimenter le pool de
 * vidéos (job planifié, une recherche `search.list` par catégorie) et pour
 * l'onboarding utilisateur (choix des centres d'intérêt de départ).
 */
export interface MoodCategory {
  tag: string;
  label: string;
  searchQuery: string;
}

export const MOOD_CATEGORIES: MoodCategory[] = [
  { tag: "musique", label: "Musique chill", searchQuery: "musique chill lofi" },
  { tag: "science", label: "Vulgarisation science", searchQuery: "vulgarisation scientifique" },
  { tag: "sport", label: "Sport", searchQuery: "meilleurs moments sport" },
  { tag: "humour", label: "Humour", searchQuery: "stand-up humour sketch" },
  { tag: "cuisine", label: "Cuisine", searchQuery: "recette cuisine facile" },
  { tag: "voyage", label: "Voyage", searchQuery: "voyage travel vlog" },
  { tag: "tech", label: "Technologie", searchQuery: "actualité tech gadgets" },
  { tag: "documentaire", label: "Documentaire", searchQuery: "documentaire histoire" },
];
