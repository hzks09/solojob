import { Card, CardContent } from "@/components/ui/card";
import { SavedVideoCard } from "@/components/discovery/saved-video-card";
import { FavoriteChannelCard } from "@/components/discovery/favorite-channel-card";
import { listSavedVideosAction } from "@/lib/actions/saved-videos";
import { listFavoriteChannelsAction } from "@/lib/actions/channels";

export default async function ListePage() {
  const [rows, favoriteChannels] = await Promise.all([listSavedVideosAction(), listFavoriteChannelsAction()]);

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

      <h2 className="mt-10 font-display text-lg font-black tracking-tight">Chaînes favorites</h2>
      <p className="mt-1 text-sm text-muted">
        {favoriteChannels.length} chaîne(s) — mises en avant dans tes prochaines découvertes
      </p>

      {favoriteChannels.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="pt-6 text-center text-sm text-muted">
            Aucune chaîne favorite pour l&apos;instant — clique sur l&apos;étoile à côté du nom d&apos;une chaîne
            pendant que tu découvres des vidéos.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4 space-y-3">
          {favoriteChannels.map((channel) => (
            <FavoriteChannelCard key={channel.channelId} channel={channel} />
          ))}
        </div>
      )}
    </div>
  );
}
