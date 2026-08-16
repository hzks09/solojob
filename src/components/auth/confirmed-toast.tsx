"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/** Affiche un toast de bienvenue une seule fois, juste après confirmation d'e-mail (voir /auth/callback). */
export function ConfirmedToast({ show }: { show: boolean }) {
  useEffect(() => {
    if (!show) return;
    toast.success("Ton compte est confirmé, bienvenue sur Loupick !");
    document.cookie = "just_confirmed=; path=/; max-age=0";
  }, [show]);

  return null;
}
