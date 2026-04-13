"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "marketplace_enabled", label: "Enable Marketplace", type: "boolean" as const },
  { key: "store_commission", label: "Platform Commission (%)", type: "number" as const },
  { key: "store_currency", label: "Default Currency", type: "text" as const, placeholder: "USD" },
  { key: "store_min_price", label: "Minimum Product Price", type: "number" as const },
  { key: "store_max_images", label: "Max Product Images", type: "number" as const },
  { key: "store_require_approval", label: "Require Product Approval", type: "boolean" as const },
  { key: "nearby_shop_system", label: "Enable Nearby Shops", type: "boolean" as const },
  { key: "nearby_business_system", label: "Enable Nearby Business", type: "boolean" as const },
  { key: "cart_enabled", label: "Enable Shopping Cart", type: "boolean" as const },
  { key: "refund_system", label: "Enable Refund System", type: "boolean" as const },
  { key: "refund_days", label: "Refund Window (days)", type: "number" as const },
];

export default function StoreSettingsPage() {
  const { data } = useQuery({ queryKey: ["admin", "config", "store"], queryFn: () => adminApi.getConfigCategory("store") });
  return (
    <AdminPageShell title="Store Settings">
      <SettingsForm title="Marketplace Configuration" fields={FIELDS} initialValues={data ?? {}} onSave={(v) => adminApi.updateConfigCategory("store", v)} />
    </AdminPageShell>
  );
}
