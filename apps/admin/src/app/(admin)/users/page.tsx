"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import type { AdminUserRow } from "@jungle/api-client";
import type { ColumnDef } from "@tanstack/react-table";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  Badge, Button, Card, CardContent, Input, Label, ConfirmDialog,
} from "@jungle/ui";
import { DataTable } from "@/components/data-table/DataTable";
import { toast } from "sonner";
import Link from "next/link";
import { ChevronDown, Filter, X } from "lucide-react";

/**
 * Plan §3.22 AP-A3 — admin user list with the same filters the PHP admin
 * exposes (IP, phone, country, gender, date range) and the admin-only
 * columns (country id, signup IP, signup source).
 */

const columns: ColumnDef<AdminUserRow>[] = [
  { accessorKey: "id", header: "ID", size: 60 },
  {
    accessorKey: "username",
    header: "User",
    cell: ({ row }) => (
      <Link
        href={`/users/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.first_name} {row.original.last_name}
        <span className="text-muted-foreground ml-1 text-xs">
          @{row.original.username}
        </span>
      </Link>
    ),
  },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "phone_number",
    header: "Phone",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {(getValue() as string | null) ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "gender",
    header: "Gender",
    cell: ({ getValue }) => (getValue() as string | null) ?? "—",
  },
  {
    accessorKey: "country_id",
    header: "Country",
    cell: ({ getValue }) => {
      const v = getValue() as number | null;
      return v == null ? "—" : <span className="font-mono">{v}</span>;
    },
  },
  {
    accessorKey: "signup_ip",
    header: "Signup IP",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {(getValue() as string | null) ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "is_verified",
    header: "Verified",
    cell: ({ getValue }) => (
      <Badge variant={getValue() ? "default" : "secondary"}>
        {getValue() ? "Yes" : "No"}
      </Badge>
    ),
  },
  {
    accessorKey: "is_pro",
    header: "Pro",
    cell: ({ getValue }) => (
      <Badge variant={(getValue() as number) > 0 ? "default" : "secondary"}>
        {(getValue() as number) > 0 ? "Pro" : "Free"}
      </Badge>
    ),
  },
  {
    accessorKey: "is_banned",
    header: "Status",
    cell: ({ getValue }) => (
      <Badge variant={getValue() ? "destructive" : "default"}>
        {getValue() ? "Banned" : "Active"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/users/${row.original.id}`}>View</Link>
      </Button>
    ),
  },
];

const STATUS_FILTERS = [
  { label: "All",      value: "all" },
  { label: "Active",   value: "active" },
  { label: "Banned",   value: "banned" },
  { label: "Verified", value: "verified" },
  { label: "Pro",      value: "pro" },
  { label: "Admin",    value: "admin" },
  { label: "Pending",  value: "pending" },
];

interface FilterState {
  ip: string;
  phone: string;
  gender: string;
  country: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: FilterState = {
  ip: "", phone: "", gender: "", country: "", dateFrom: "", dateTo: "",
};

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = useMemo(
    () => (Object.values(filters) as string[]).filter((v) => v.trim() !== "").length,
    [filters],
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "users", page, search, status, filters],
    queryFn: () =>
      adminApi.listUsersFiltered({
        page,
        per_page: 20,
        q: search || undefined,
        status: status !== "all" ? status : undefined,
        ip: filters.ip || undefined,
        phone: filters.phone || undefined,
        gender: filters.gender || undefined,
        country: filters.country || undefined,
        date_from: filters.dateFrom
          ? new Date(filters.dateFrom).toISOString()
          : undefined,
        date_to: filters.dateTo
          ? new Date(`${filters.dateTo}T23:59:59`).toISOString()
          : undefined,
      }),
  });

  const users = data?.data ?? [];
  const total = data?.meta.total ?? 0;

  const applyFilters = () => {
    setFilters(draftFilters);
    setPage(1);
  };

  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  type BulkActionId =
    | "ban"
    | "unban"
    | "verify"
    | "make_pro"
    | "remove_pro"
    | "make_admin"
    | "remove_admin"
    | "delete";

  const [pendingBulk, setPendingBulk] = useState<{
    action: BulkActionId;
    label: string;
    ids: number[];
    destructive: boolean;
  } | null>(null);

  const runBulk = async (action: BulkActionId, ids: number[]) => {
    try {
      const res = await adminApi.bulkUserAction({ ids, action });
      const affected = res?.data?.affected ?? ids.length;
      toast.success(`${action.replace(/_/g, " ")}: ${affected} users updated`);
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bulk action failed";
      toast.error(msg);
    }
  };

  const promptBulk = (
    action: BulkActionId,
    label: string,
    destructive: boolean,
  ) => async (ids: number[]): Promise<void> => {
    if (destructive || ids.length > 10) {
      setPendingBulk({ action, label, ids, destructive });
      return;
    }
    await runBulk(action, ids);
  };

  const bulkActions = [
    { label: "Ban", variant: "destructive" as const, onAction: promptBulk("ban", "Ban", true) },
    { label: "Unban", onAction: promptBulk("unban", "Unban", false) },
    { label: "Verify", onAction: promptBulk("verify", "Verify", false) },
    { label: "Make Pro", onAction: promptBulk("make_pro", "Make Pro", false) },
    { label: "Remove Pro", onAction: promptBulk("remove_pro", "Remove Pro", false) },
    { label: "Make Admin", onAction: promptBulk("make_admin", "Make Admin", true) },
    { label: "Remove Admin", onAction: promptBulk("remove_admin", "Remove Admin", true) },
    { label: "Delete", variant: "destructive" as const, onAction: promptBulk("delete", "Delete", true) },
  ];

  return (
    <AdminPageShell title="Users" description="Manage all platform users"><div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Users</h1>
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={status === opt.value ? "default" : "outline"}
              onClick={() => { setStatus(opt.value); setPage(1); }}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
          >
            <Filter className="h-3.5 w-3.5" />
            Advanced filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                filtersOpen ? "rotate-180" : ""
              }`}
            />
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
        {filtersOpen && (
          <Card className="mt-2">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="f-ip">Signup IP</Label>
                  <Input
                    id="f-ip"
                    placeholder="e.g. 203.0.113.42"
                    value={draftFilters.ip}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, ip: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f-phone">Phone</Label>
                  <Input
                    id="f-phone"
                    placeholder="partial match, e.g. +1202"
                    value={draftFilters.phone}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f-gender">Gender</Label>
                  <Input
                    id="f-gender"
                    placeholder="male / female / other"
                    value={draftFilters.gender}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, gender: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f-country">Country ID</Label>
                  <Input
                    id="f-country"
                    type="number"
                    placeholder="country_id"
                    value={draftFilters.country}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, country: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f-from">Registered from</Label>
                  <Input
                    id="f-from"
                    type="date"
                    value={draftFilters.dateFrom}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f-to">Registered until</Label>
                  <Input
                    id="f-to"
                    type="date"
                    value={draftFilters.dateTo}
                    onChange={(e) => setDraftFilters((p) => ({ ...p, dateTo: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDraftFilters(filters)}
                >
                  Reset
                </Button>
                <Button size="sm" onClick={applyFilters}>
                  Apply filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <DataTable
        data={users}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search users…"
        onSearch={(q) => { setSearch(q); setPage(1); }}
        bulkActions={bulkActions}
        pagination={{ page, total, perPage: 20, onPageChange: setPage }}
      />

      <ConfirmDialog
        open={pendingBulk !== null}
        onOpenChange={(o) => { if (!o) setPendingBulk(null); }}
        title={pendingBulk ? `${pendingBulk.label} ${pendingBulk.ids.length} users?` : ""}
        description={
          pendingBulk?.destructive
            ? "This action affects multiple accounts. Confirm to proceed."
            : `This will apply "${pendingBulk?.label}" to all selected users.`
        }
        confirmText={pendingBulk?.label ?? "Confirm"}
        variant={pendingBulk?.destructive ? "destructive" : "default"}
        onConfirm={async () => {
          if (pendingBulk) {
            await runBulk(pendingBulk.action, pendingBulk.ids);
            setPendingBulk(null);
          }
        }}
      />
    </div></AdminPageShell>
  );
}
