"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export default function BankReceiptsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "bank-receipts"],
    queryFn: () => adminApi.getBankReceipts(),
  });

  return (
    <AdminPageShell title="Bank Receipts">
      <ModerationQueue
        items={(data?.data ?? []) as { id: number; title?: string; created_at?: string }[]}
        isLoading={isLoading}
        onApprove={(id) => adminApi.approveBankReceipt(id)}
        onReject={(id) => adminApi.rejectBankReceipt(id)}
        onRefetch={refetch}
      />
    </AdminPageShell>
  );
}
