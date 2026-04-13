"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Button, Checkbox, Input,
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger,
} from "@jungle/ui";
import { Columns, Download } from "lucide-react";

function exportToCsv<T>(data: T[], columns: ColumnDef<T>[]) {
  const headers = columns
    .filter((c): c is ColumnDef<T> & { accessorKey: string } => "accessorKey" in c)
    .map((c) => c.accessorKey);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = (row as Record<string, unknown>)[h];
      const str = String(val ?? "");
      return str.includes(",") ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(","),
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `export-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface BulkAction {
  label: string;
  variant?: "default" | "destructive";
  onAction: (ids: number[]) => Promise<void>;
}

interface DataTableProps<T extends { id: number | string }> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  bulkActions?: BulkAction[];
  pagination?: {
    page: number;
    total: number;
    perPage: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  isLoading,
  searchPlaceholder = "Search…",
  onSearch,
  bulkActions,
  pagination,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [searchQuery, setSearchQuery] = useState("");

  const selectionColumn: ColumnDef<T> = {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
      />
    ),
    size: 40,
  };

  const table = useReactTable({
    data,
    columns: bulkActions ? [selectionColumn, ...columns] : columns,
    state: { sorting, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => String(row.id),
    enableRowSelection: !!bulkActions,
  });

  const selectedIds = Object.keys(rowSelection)
    .filter((k) => rowSelection[k])
    .map(Number);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        {onSearch && (
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearch}
            className="max-w-sm"
          />
        )}
        <div className="flex items-center gap-2">
          {bulkActions && selectedIds.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
              {bulkActions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant ?? "default"}
                  size="sm"
                  onClick={() => action.onAction(selectedIds)}
                >
                  {action.label}
                </Button>
              ))}
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => exportToCsv(data, columns)}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-1" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns().filter((c) => c.getCanHide()).map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {Math.min((pagination.page - 1) * pagination.perPage + 1, pagination.total)}–
            {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page * pagination.perPage >= pagination.total}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
