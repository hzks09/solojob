"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adjustUserCredits, updateUserPlan, updateUserRole } from "@/lib/actions/admin";
import type { PlanTier, User, UserRole } from "@/lib/db/schema";

const PLAN_OPTIONS: PlanTier[] = ["free", "pro", "premium"];
const ROLE_OPTIONS: UserRole[] = ["user", "admin"];

export function UsersTable({ users }: { users: User[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto rounded-2xl border border-card-border">
      <table className="w-full text-sm">
        <thead className="bg-card text-left text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3">Utilisateur</th>
            <th className="px-4 py-3">Rôle</th>
            <th className="px-4 py-3">Forfait</th>
            <th className="px-4 py-3">Crédits</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-card-border">
              <td className="px-4 py-3">
                <p className="font-medium">{u.name ?? "—"}</p>
                <p className="text-xs text-muted">{u.email}</p>
              </td>
              <td className="px-4 py-3">
                <select
                  disabled={isPending}
                  defaultValue={u.role}
                  className="rounded-lg border border-card-border bg-card px-2 py-1 text-xs"
                  onChange={(e) =>
                    startTransition(async () => {
                      await updateUserRole(u.id, e.target.value as UserRole);
                      toast.success("Rôle mis à jour");
                    })
                  }
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <select
                  disabled={isPending}
                  defaultValue={u.plan}
                  className="rounded-lg border border-card-border bg-card px-2 py-1 text-xs"
                  onChange={(e) =>
                    startTransition(async () => {
                      await updateUserPlan(u.id, e.target.value as PlanTier);
                      toast.success("Forfait mis à jour");
                    })
                  }
                >
                  {PLAN_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline">{u.creditsRemaining}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await adjustUserCredits(u.id, 10);
                        toast.success("+10 crédits");
                      })
                    }
                  >
                    +10 crédits
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
