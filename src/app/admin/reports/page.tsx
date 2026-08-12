import { ReportsTable } from "@/components/admin/reports-table";
import { listReports } from "@/lib/actions/admin";

export default async function AdminReportsPage() {
  const rows = await listReports();
  return <ReportsTable rows={rows} />;
}
