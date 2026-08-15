import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasCompletedOnboarding } from "@/lib/actions/onboarding";
import { getNextVideoAction } from "@/lib/actions/discovery";
import { PLANS } from "@/lib/constants";
import { VideoSwiper } from "@/components/discovery/video-swiper";

export default async function DashboardPage() {
  const current = await getCurrentUser();
  if (!current) return null;

  const onboarded = await hasCompletedOnboarding();
  if (!onboarded) redirect("/onboarding");

  const initialResult = await getNextVideoAction();
  const advancedFiltersAllowed = PLANS[current.profile?.plan ?? "free"].advancedFilters;

  return (
    <div className="mx-auto max-w-md">
      <VideoSwiper initialResult={initialResult} advancedFiltersAllowed={advancedFiltersAllowed} />
    </div>
  );
}
