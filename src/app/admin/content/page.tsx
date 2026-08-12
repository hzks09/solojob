import { ContentGrid } from "@/components/admin/content-grid";
import { listAllGenerations } from "@/lib/actions/admin";

export default async function AdminContentPage() {
  const generations = await listAllGenerations();
  return <ContentGrid generations={generations} />;
}
