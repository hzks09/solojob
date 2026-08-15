import { getCurrentUser } from "@/lib/auth/current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";

export default async function SettingsPage() {
  const current = await getCurrentUser();
  if (!current) return null;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-black tracking-tight">Réglages</h1>

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
