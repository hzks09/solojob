import { getCurrentUser } from "@/lib/auth/current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { LogoUploader } from "@/components/settings/logo-uploader";
import { StripeConnectCard } from "@/components/settings/stripe-connect-card";

export default async function SettingsPage() {
  const current = await getCurrentUser();
  if (!current) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Réglages</h1>

      <Card>
        <CardHeader>
          <CardTitle>Paiements en ligne</CardTitle>
        </CardHeader>
        <CardContent>
          <StripeConnectCard
            hasAccount={Boolean(current.profile?.stripeConnectAccountId)}
            chargesEnabled={current.profile?.stripeConnectChargesEnabled ?? false}
          />
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
