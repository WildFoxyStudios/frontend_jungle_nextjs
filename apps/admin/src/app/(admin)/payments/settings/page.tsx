"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "stripe_enabled", label: "Enable Stripe", type: "boolean" as const },
  { key: "stripe_key", label: "Stripe Publishable Key", type: "text" as const },
  { key: "stripe_secret", label: "Stripe Secret Key", type: "password" as const },
  { key: "stripe_webhook_secret", label: "Stripe Webhook Secret", type: "password" as const },
  { key: "paypal_enabled", label: "Enable PayPal", type: "boolean" as const },
  { key: "paypal_client_id", label: "PayPal Client ID", type: "text" as const },
  { key: "paypal_secret", label: "PayPal Secret", type: "password" as const },
  { key: "paypal_mode", label: "PayPal Mode", type: "select" as const, options: ["sandbox", "live"] },
  { key: "paystack_enabled", label: "Enable Paystack", type: "boolean" as const },
  { key: "paystack_public_key", label: "Paystack Public Key", type: "text" as const },
  { key: "paystack_secret_key", label: "Paystack Secret Key", type: "password" as const },
  { key: "coinbase_enabled", label: "Enable Coinbase Commerce", type: "boolean" as const },
  { key: "coinbase_api_key", label: "Coinbase API Key", type: "password" as const },
  { key: "flutterwave_enabled", label: "Enable Flutterwave", type: "boolean" as const },
  { key: "flutterwave_public_key", label: "Flutterwave Public Key", type: "text" as const },
  { key: "flutterwave_secret_key", label: "Flutterwave Secret Key", type: "password" as const },
  { key: "razorpay_enabled", label: "Enable Razorpay", type: "boolean" as const },
  { key: "razorpay_key_id", label: "Razorpay Key ID", type: "text" as const },
  { key: "razorpay_key_secret", label: "Razorpay Key Secret", type: "password" as const },
  { key: "bank_transfer_enabled", label: "Enable Bank Transfer", type: "boolean" as const },
  { key: "bank_transfer_details", label: "Bank Transfer Instructions", type: "textarea" as const },
  { key: "wallet_enabled", label: "Enable Wallet System", type: "boolean" as const },
  { key: "withdrawal_min_amount", label: "Minimum Withdrawal Amount", type: "number" as const },
  { key: "withdrawal_fee", label: "Withdrawal Fee (%)", type: "number" as const },
  { key: "payment_currency", label: "Default Currency", type: "text" as const, placeholder: "USD" },
];

export default function PaymentSettingsPage() {
  const { data } = useQuery({
    queryKey: ["admin", "config", "payments"],
    queryFn: () => adminApi.getConfigCategory("payments"),
  });

  return (
    <AdminPageShell title="Payment Settings">
      <SettingsForm
        title="Payment Gateway Configuration"
        fields={FIELDS}
        initialValues={data ?? {}}
        onSave={(v) => adminApi.updateConfigCategory("payments", v)}
      />
    </AdminPageShell>
  );
}
