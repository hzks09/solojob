import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { VoteButton } from "@/components/gallery/vote-button";
import { listGallery } from "@/lib/actions/gallery";

// Galerie communautaire en temps réel (votes) — jamais mise en cache statique.
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const entries = await listGallery("votes");

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-block h-6 w-6 rounded-md bg-brand" />
            RoomAI
          </Link>
          <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
            Créer mon design
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Galerie publique</h1>
        <p className="mt-1 text-sm text-muted">Les plus belles transformations de la communauté</p>

        {entries.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted">
            Aucun design public pour l&apos;instant. Sois le premier à publier le tien !
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {entries.map(({ gallery, generation }) => (
              <Link key={gallery.id} href={`/gallery/${generation.id}`} className="group relative block overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generation.resultImageUrl ?? generation.originalImageUrl}
                  alt={generation.style}
                  className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent p-3">
                  <span className="text-sm font-medium capitalize text-white">{generation.style}</span>
                  <VoteButton generationId={generation.id} initialVotes={gallery.votesCount} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
