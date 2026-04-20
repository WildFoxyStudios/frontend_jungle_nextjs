"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import type { User } from "@jungle/api-client";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge, Button } from "@jungle/ui";
import { DataTable } from "@/components/data-table/DataTable";
import { toast } from "sonner";
import Link from "next/link";

const columns: ColumnDef<User>[] = [
  { accessorKey: "id", header: "ID", size: 60 },
  {
    accessorKey: "username",
    header: "User",
    cell: ({ row }) => (
      <Link href={`/users/${row.original.id}`} className="font-medium hover:underline">
        {row.original.first_name} {row.original.last_name}
        <span className="text-muted-foreground ml-1 text-xs">@{row.original.username}</span>
      </Link>
    ),
  },
  { accessorKey: "email", header: "Email" },
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
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/users/${row.original.id}`}>View</Link>
        </Button>
      </div>
    ),
  },
];

const FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Banned", value: "banned" },
  { label: "Verified", value: "verified" },
  { label: "Pro", value: "pro" },
  { label: "Admin", value: "admin" },
];

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "users", page, search, filter],
    queryFn: () =>
      adminApi.getUsers({
        page,
        q: search || undefined,
        per_page: 20,
        status: filter !== "all" ? filter : undefined,
      }),
  });

  const users = data?.data ?? [];
  const total = data?.meta.total ?? 0;

  const bulkActions = [
    {
      label: "Ban",
      variant: "destructive" as const,
      onAction: async (ids: number[]) => {
        await Promise.all(ids.map((id) => adminApi.banUser(id)));
        toast.success(`Banned ${ids.length} users`);
        refetch();
      },
    },
    {
      label: "Unban",
      onAction: async (ids: number[]) => {
        await Promise.all(ids.map((id) => adminApi.unbanUser(id)));
        toast.success(`Unbanned ${ids.length} users`);
        refetch();
      },
    },
    {
      label: "Verify",
      onAction: async (ids: number[]) => {
        await Promise.all(ids.map((id) => adminApi.verifyUser(id)));
        toast.success(`Verified ${ids.length} users`);
        refetch();
      },
    },
    {
      label: "Make Pro",
      onAction: async (ids: number[]) => {
        await Promise.all(ids.map((id) => adminApi.makeUserPro(id)));
        toast.success(`Made ${ids.length} users Pro`);
        refetch();
      },
    },
    {
      label: "Delete",
      variant: "destructive" as const,
      onAction: async (ids: number[]) => {
        await Promise.all(ids.map((id) => adminApi.deleteUser(id)));
        toast.success(`Deleted ${ids.length} users`);
        refetch();
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex gap-1 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={filter === opt.value ? "default" : "outline"}
              onClick={() => { setFilter(opt.value); setPage(1); }}
            >
              {opt.label}
            </Button>
          ))}
        </div>
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
    </div>
  );
}
