import { Card, CardContent } from "@/components/ui/card";
import { SavedVideoCard } from "@/components/discovery/saved-video-card";
import { listSavedVideosAction } from "@/lib/actions/saved-videos";

export default async function ListePage() {
  const rows = await listSavedVideosAction();

  return (
    <div>
      <h1 className="font-display text-2xl font-black tracking-tight">Ma liste</h1>
      <p className="mt-1 text-sm text-muted">{rows.length} vidéo(s) à regarder</p>

      {rows.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="pt-6 text-center text-sm text-muted">
            Rien ici pour l&apos;instant — swipe &laquo;&nbsp;Garder&nbsp;&raquo; sur une vidéo pour l&apos;ajouter.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map(({ video }) => (
            <SavedVideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
