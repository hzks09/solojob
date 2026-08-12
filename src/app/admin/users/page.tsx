import { UsersTable } from "@/components/admin/users-table";
import { listUsers } from "@/lib/actions/admin";

export default async function AdminUsersPage() {
  const users = await listUsers();
  return <UsersTable users={users} />;
}
