"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { updateLogoUrlAction } from "@/lib/actions/profile";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 Mo — limite du bucket "logos"
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export function LogoUploader({ userId, currentLogoUrl }: { userId: string; currentLogoUrl: string | null }) {
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Format non supporté (PNG, JPEG, WEBP ou SVG)");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("Image trop volumineuse (2 Mo max)");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.type.split("/")[1];
    const path = `${userId}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage.from("logos").upload(path, file, {
      upsert: true,
      cacheControl: "3600",
    });

    if (uploadError) {
      setUploading(false);
      toast.error(`Échec de l'upload : ${uploadError.message}`);
      return;
    }

    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    const result = await updateLogoUrlAction(`${data.publicUrl}?v=${Date.now()}`);
    setUploading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setLogoUrl(`${data.publicUrl}?v=${Date.now()}`);
    toast.success("Logo mis à jour");
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-card-border bg-card">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs text-muted">Aucun</span>
        )}
      </div>
      <div>
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? "Envoi..." : "Changer le logo"}
        </Button>
        <p className="mt-1 text-xs text-muted">PNG, JPEG, WEBP ou SVG — 2 Mo max</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
