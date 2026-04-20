"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  Card,
  CardContent,
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@jungle/ui";
import { CheckCircle2, XCircle } from "lucide-react";

export default function ChangelogPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "changelog"],
    queryFn: () => adminApi.getChangelog(),
  });

  const migrations = data?.migrations ?? [];

  return (
    <AdminPageShell
      title="Changelog"
      description="Database migrations history — what has been applied to this installation."
    >
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Backend version</p>
                <p className="font-mono text-lg font-semibold">
                  {data?.backend_version ?? "unknown"}
                </p>
              </div>
              <Badge variant="secondary">
                {migrations.length} migration{migrations.length === 1 ? "" : "s"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {migrations.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground text-sm">
                  No migrations recorded. The _sqlx_migrations table is empty or
                  does not exist yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Version</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[200px]">Installed</TableHead>
                      <TableHead className="w-[100px] text-right">Time</TableHead>
                      <TableHead className="w-[80px] text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {migrations.map((m) => (
                      <TableRow key={m.version}>
                        <TableCell className="font-mono text-xs">
                          {m.version}
                        </TableCell>
                        <TableCell className="font-medium">
                          {m.description}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(m.installed_on).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono">
                          {m.execution_time_ms}ms
                        </TableCell>
                        <TableCell className="text-center">
                          {m.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive inline" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminPageShell>
  );
}
