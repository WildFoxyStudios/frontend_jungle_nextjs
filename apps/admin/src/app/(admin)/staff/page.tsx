"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@jungle/ui";
import { adminApi } from "@jungle/api-client";
import type { AdminUserRow } from "@jungle/api-client";
import Link from "next/link";
import { Shield, UserCog } from "lucide-react";

export default function StaffPage() {
  const [staff, setStaff] = useState<AdminUserRow[]>([]);
  const [rolePresets, setRolePresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presetsAvailable, setPresetsAvailable] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const usersResult = await adminApi.listUsersFiltered({
        status: "admin",
        per_page: 100,
      });
      setStaff(usersResult?.data ?? []);

      // Fetch role presets from config if the category exists
      try {
        const roleConfig = (await adminApi.getConfigCategory(
          "roles"
        )) as Record<string, unknown>;
        if (roleConfig?.presets && Array.isArray(roleConfig.presets)) {
          setRolePresets(roleConfig.presets as any[]);
          setPresetsAvailable(true);
        }
      } catch {
        // Role presets config category is not configured on the backend
      }
    } catch (e: any) {
      setError(e.message || "Failed to load staff data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-destructive">Error: {error}</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Staff Directory</h1>
        <Button size="sm" asChild>
          <Link href="/users/roles">
            <UserCog className="mr-2 h-4 w-4" /> Manage Role Presets
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Shield className="mx-auto h-12 w-12 mb-3 opacity-20" />
              <p>
                No staff members assigned. Go to Users → Permissions to assign
                roles.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {user.first_name} {user.last_name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          @{user.username}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="soft-primary">Admin</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/users/${user.id}/permissions`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.last_seen
                        ? new Date(user.last_seen).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/users/${user.id}`}>Edit</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Presets</CardTitle>
        </CardHeader>
        <CardContent>
          {!presetsAvailable ? (
            <p className="text-center text-muted-foreground py-4">
              No role presets configured. Use the Manage Role Presets button
              above to create and manage role presets.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rolePresets.map((role: any) => (
                <Card key={role.name || role.id} variant="flat" className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="soft-primary" className="capitalize">
                      {role.label || role.name?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {role.description || "System preset"}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
