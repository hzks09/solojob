import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShareButtons } from "@/components/gallery/share-buttons";
import { ReportButton } from "@/components/gallery/report-button";
import { getGenerationDetail } from "@/lib/actions/generations";
import { db } from "@/lib/db";
import { gallery } from "@/lib/db/schema";
import { OBJECT_CATEGORIES } from "@/lib/constants";

export default async function GalleryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getGenerationDetail(id);
  if (!detail || !detail.generation.isPublic) notFound();

  const { generation, objects } = detail;
  const [galleryEntry] = await db.select().from(gallery).where(eq(gallery.generationId, id)).limit(1);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const pageUrl = `${appUrl}/gallery/${id}`;

  const totalCost = objects.reduce((sum, o) => sum + Number(o.estimatedPrice ?? 0), 0);

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/gallery" className="text-sm text-muted">
            ← Retour à la galerie
          </Link>
          <Link
            href={`/studio?style=${generation.style}`}
            className={buttonVariants({ size: "sm" })}
          >
            Recréer ce design
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl font-semibold capitalize tracking-tight">{generation.style}</h1>
          <Badge variant="outline">{galleryEntry?.votesCount ?? 0} votes</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted">Avant</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={generation.originalImageUrl} alt="Avant" className="w-full rounded-2xl" />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted">Après</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={generation.resultImageUrl ?? generation.originalImageUrl} alt="Après" className="w-full rounded-2xl" />
          </div>
        </div>

        <div className="mt-6">
          <ShareButtons url={pageUrl} title={`Design ${generation.style} sur RoomAI`} imageUrl={generation.resultImageUrl ?? generation.originalImageUrl} />
        </div>

        {objects.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Shopping intelligent</h2>
              <Badge>Coût estimé total : {totalCost}€</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {objects.map((obj) => (
                <Card key={obj.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{obj.name}</p>
                      <Badge variant="accent">
                        {OBJECT_CATEGORIES.find((c) => c.value === obj.category)?.label ?? obj.category}
                      </Badge>
                    </div>
                    <p className="mt-1 text-lg font-semibold">{obj.estimatedPrice}€</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {obj.buyUrl && (
                        <a href={obj.buyUrl} target="_blank" rel="noopener noreferrer" className="text-brand underline">
                          Acheter
                        </a>
                      )}
                      {obj.cheaperAlternativeUrl && (
                        <a href={obj.cheaperAlternativeUrl} target="_blank" rel="noopener noreferrer" className="text-muted underline">
                          Alternative moins chère ({obj.cheaperAlternativePrice}€)
                        </a>
                      )}
                      {obj.premiumAlternativeUrl && (
                        <a href={obj.premiumAlternativeUrl} target="_blank" rel="noopener noreferrer" className="text-muted underline">
                          Alternative haut de gamme ({obj.premiumAlternativePrice}€)
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8">
          <ReportButton generationId={generation.id} />
        </div>
      </main>
    </div>
  );
}
