"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { updateReportStatus } from "@/lib/actions/admin";
import type { Generation, Report, ReportStatus } from "@/lib/db/schema";

const STATUS_OPTIONS: ReportStatus[] = ["pending", "reviewed", "dismissed", "actioned"];

export function ReportsTable({ rows }: { rows: { report: Report; generation: Generation }[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto rounded-2xl border border-card-border">
      <table className="w-full text-sm">
        <thead className="bg-card text-left text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3">Contenu</th>
            <th className="px-4 py-3">Motif</th>
            <th className="px-4 py-3">Statut</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ report, generation }) => (
            <tr key={report.id} className="border-t border-card-border">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={generation.resultImageUrl ?? generation.originalImageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  <span className="capitalize">{generation.style}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-muted">{report.reason}</td>
              <td className="px-4 py-3">
                <select
                  disabled={isPending}
                  defaultValue={report.status}
                  className="rounded-lg border border-card-border bg-card px-2 py-1 text-xs"
                  onChange={(e) =>
                    startTransition(async () => {
                      await updateReportStatus(report.id, e.target.value as ReportStatus);
                      toast.success("Statut mis à jour");
                    })
                  }
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center">
                <Badge variant="outline">Aucun signalement</Badge>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
