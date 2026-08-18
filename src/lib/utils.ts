import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate une durée en secondes en "m:ss" (ou "h:mm:ss" au-delà d'une heure).
 *
 * Une entrée négative, non entière ou non finie est ramenée à une valeur
 * affichable plutôt que de lever : cette fonction est appelée en plein rendu de
 * carte, et une donnée YouTube inattendue ne doit pas casser l'écran. Sans
 * cette normalisation, `-5` produisait "-1:-5" et `90.7` produisait "1:30.7".
 */
export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
