import { getCurrentUser } from "@/lib/auth/current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { LogoUploader } from "@/components/settings/logo-uploader";
import { PaypalLinkCard } from "@/components/settings/paypal-link-card";

export default async function SettingsPage() {
  const current = await getCurrentUser();
  if (!current) return null;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-black tracking-tight">Réglages</h1>

      <Card>
        <CardHeader>
          <CardTitle>Paiements en ligne</CardTitle>
        </CardHeader>
        <CardContent>
          <PaypalLinkCard initialUsername={current.profile?.paypalMeUsername ?? null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo (affiché sur tes factures PDF)</CardTitle>
        </CardHeader>
        <CardContent>
          <LogoUploader userId={current.authUser.id} currentLogoUrl={current.profile?.logoUrl ?? null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={current.profile} />
        </CardContent>
      </Card>
    </div>
  );
}
