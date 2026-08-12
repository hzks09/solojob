"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * Instagram et TikTok n'offrent pas d'intent web de partage direct — on passe
 * par l'API Web Share native (ouvre la feuille de partage du téléphone, qui
 * inclut Instagram/TikTok s'ils sont installés). Facebook et Pinterest ont
 * des intents URL dédiés, utilisés en fallback desktop.
 */
export function ShareButtons({ url, title, imageUrl }: { url: string; title: string; imageUrl: string }) {
  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // annulé par l'utilisateur — rien à faire
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Lien copié dans le presse-papiers");
  }

  const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(title)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={nativeShare}>
        <Share2 className="h-3.5 w-3.5" /> Partager (Instagram / TikTok)
      </Button>
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Facebook
      </a>
      <a
        href={pinterestUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Pinterest
      </a>
    </div>
  );
}
