"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm, type SettingsField } from "@/components/admin/SettingsForm";
import { Card, CardContent, Tabs, TabsContent, TabsList, TabsTrigger } from "@jungle/ui";

/**
 * Canonical definition of every payment gateway exposed by the backend (see
 * `backend/crates/payment-service/src/gateway/mod.rs::create_gateway`). Each
 * gateway's `fields` are the config keys admins must fill so the provider can
 * be activated. Keep the key names aligned with the env vars documented in
 * `backend/.env.example`.
 */
interface GatewayTab {
  id: string;
  label: string;
  short: string;
  description: string;
  docsUrl?: string;
  fields: SettingsField[];
}

const ENABLED_FIELD = (prefix: string): SettingsField => ({
  key: `${prefix}_enabled`,
  label: "Enable this gateway",
  type: "boolean",
});

const SANDBOX_FIELD = (prefix: string, label = "Sandbox / test mode"): SettingsField => ({
  key: `${prefix}_sandbox`,
  label,
  type: "boolean",
});

const GATEWAYS: GatewayTab[] = [
  {
    id: "stripe",
    label: "Stripe",
    short: "Stripe",
    description:
      "Global card processor. Configure the publishable + secret key pair and, in production, the webhook signing secret.",
    docsUrl: "https://dashboard.stripe.com/apikeys",
    fields: [
      ENABLED_FIELD("stripe"),
      { key: "stripe_key", label: "Publishable key", type: "text", placeholder: "pk_live_…" },
      { key: "stripe_secret", label: "Secret key", type: "password", placeholder: "sk_live_…" },
      { key: "stripe_webhook_secret", label: "Webhook signing secret", type: "password", placeholder: "whsec_…" },
    ],
  },
  {
    id: "paypal",
    label: "PayPal",
    short: "PayPal",
    description: "REST API (OAuth2). Toggle sandbox off for production.",
    docsUrl: "https://developer.paypal.com/dashboard/applications/",
    fields: [
      ENABLED_FIELD("paypal"),
      { key: "paypal_client_id", label: "Client ID", type: "text" },
      { key: "paypal_secret", label: "Secret", type: "password" },
      SANDBOX_FIELD("paypal"),
    ],
  },
  {
    id: "paystack",
    label: "PayStack",
    short: "PayStack",
    description: "Nigeria/Ghana/Kenya/South Africa card acquirer.",
    docsUrl: "https://dashboard.paystack.com/#/settings/developer",
    fields: [
      ENABLED_FIELD("paystack"),
      { key: "paystack_public_key", label: "Public key", type: "text", placeholder: "pk_…" },
      { key: "paystack_secret_key", label: "Secret key", type: "password", placeholder: "sk_…" },
    ],
  },
  {
    id: "flutterwave",
    label: "Flutterwave",
    short: "Flutterwave",
    description: "Pan-African payments — cards, mobile money, bank transfers.",
    docsUrl: "https://dashboard.flutterwave.com/dashboard/settings/apis",
    fields: [
      ENABLED_FIELD("flutterwave"),
      { key: "flutterwave_public_key", label: "Public key", type: "text" },
      { key: "flutterwave_secret_key", label: "Secret key", type: "password" },
    ],
  },
  {
    id: "razorpay",
    label: "Razorpay",
    short: "Razorpay",
    description: "India — cards, UPI, netbanking, wallets.",
    docsUrl: "https://dashboard.razorpay.com/app/keys",
    fields: [
      ENABLED_FIELD("razorpay"),
      { key: "razorpay_key_id", label: "Key ID", type: "text" },
      { key: "razorpay_key_secret", label: "Key secret", type: "password" },
    ],
  },
  {
    id: "coinbase",
    label: "Coinbase Commerce",
    short: "Coinbase",
    description: "Crypto — BTC, ETH, USDC, LTC, BCH, DOGE.",
    docsUrl: "https://commerce.coinbase.com/settings",
    fields: [
      ENABLED_FIELD("coinbase"),
      { key: "coinbase_commerce_api_key", label: "API key", type: "password" },
    ],
  },
  {
    id: "braintree",
    label: "Braintree",
    short: "Braintree",
    description: "PayPal-owned card acquirer (also handles ACH and Apple Pay).",
    docsUrl: "https://www.braintreegateway.com/login",
    fields: [
      ENABLED_FIELD("braintree"),
      { key: "braintree_merchant_id", label: "Merchant ID", type: "text" },
      { key: "braintree_public_key", label: "Public key", type: "text" },
      { key: "braintree_private_key", label: "Private key", type: "password" },
      SANDBOX_FIELD("braintree"),
    ],
  },
  {
    id: "authorize_net",
    label: "Authorize.Net",
    short: "Authorize.Net",
    description:
      "US card processor. Uses Accept Hosted payment page and HMAC-SHA512 webhooks.",
    docsUrl: "https://sandbox.authorize.net/",
    fields: [
      ENABLED_FIELD("authorize_net"),
      { key: "authorize_net_login_id", label: "API Login ID", type: "text" },
      { key: "authorize_net_transaction_key", label: "Transaction key", type: "password" },
      {
        key: "authorize_net_webhook_signature_key",
        label: "Webhook signature key",
        type: "password",
      },
      SANDBOX_FIELD("authorize_net"),
    ],
  },
  {
    id: "iyzipay",
    label: "iyzipay",
    short: "iyzipay",
    description: "Turkey — card acquiring, installments.",
    docsUrl: "https://sandbox-merchant.iyzipay.com/",
    fields: [
      ENABLED_FIELD("iyzipay"),
      { key: "iyzipay_api_key", label: "API key", type: "password" },
      { key: "iyzipay_secret_key", label: "Secret key", type: "password" },
      SANDBOX_FIELD("iyzipay"),
    ],
  },
  {
    id: "cashfree",
    label: "Cashfree",
    short: "Cashfree",
    description: "India — cards, UPI, wallets, EMI, netbanking.",
    docsUrl: "https://merchant.cashfree.com/",
    fields: [
      ENABLED_FIELD("cashfree"),
      { key: "cashfree_app_id", label: "App ID", type: "text" },
      { key: "cashfree_secret_key", label: "Secret key", type: "password" },
      SANDBOX_FIELD("cashfree"),
    ],
  },
  {
    id: "yoomoney",
    label: "YooMoney",
    short: "YooMoney",
    description: "Russia (ex-YandexMoney / YooKassa) — card + wallet.",
    docsUrl: "https://yookassa.ru/my",
    fields: [
      ENABLED_FIELD("yoomoney"),
      { key: "yoomoney_shop_id", label: "Shop ID", type: "text" },
      { key: "yoomoney_secret_key", label: "Secret key", type: "password" },
    ],
  },
  {
    id: "aamarpay",
    label: "aamarPay",
    short: "aamarPay",
    description: "Bangladesh — cards, bKash, Nagad, Rocket.",
    docsUrl: "https://aamarpay.com/",
    fields: [
      ENABLED_FIELD("aamarpay"),
      { key: "aamarpay_store_id", label: "Store ID", type: "text" },
      { key: "aamarpay_signature_key", label: "Signature key", type: "password" },
      SANDBOX_FIELD("aamarpay"),
    ],
  },
  {
    id: "2checkout",
    label: "2Checkout",
    short: "2CO",
    description: "Global card processor (Verifone).",
    docsUrl: "https://secure.2checkout.com/cpanel/login.php",
    fields: [
      ENABLED_FIELD("twocheckout"),
      { key: "twocheckout_merchant_code", label: "Merchant code", type: "text" },
      { key: "twocheckout_secret_key", label: "Secret key", type: "password" },
      SANDBOX_FIELD("twocheckout"),
    ],
  },
  {
    id: "coinpayments",
    label: "CoinPayments",
    short: "CoinPayments",
    description: "Crypto — 2,000+ coins including BTC, ETH, LTC, XMR, DOGE.",
    docsUrl: "https://www.coinpayments.net/apikeys",
    fields: [
      ENABLED_FIELD("coinpayments"),
      { key: "coinpayments_merchant_id", label: "Merchant ID", type: "text" },
      { key: "coinpayments_public_key", label: "Public key", type: "text" },
      { key: "coinpayments_private_key", label: "Private key", type: "password" },
      { key: "coinpayments_ipn_secret", label: "IPN secret", type: "password" },
    ],
  },
  {
    id: "payfast",
    label: "PayFast",
    short: "PayFast",
    description: "South Africa — cards, Instant EFT, Mobicred, SCode.",
    docsUrl: "https://www.payfast.co.za/",
    fields: [
      ENABLED_FIELD("payfast"),
      { key: "payfast_merchant_id", label: "Merchant ID", type: "text" },
      { key: "payfast_merchant_key", label: "Merchant key", type: "text" },
      { key: "payfast_passphrase", label: "Passphrase", type: "password" },
      SANDBOX_FIELD("payfast"),
    ],
  },
  {
    id: "paysera",
    label: "Paysera",
    short: "Paysera",
    description: "Baltics / EU — cards, bank transfers, Paysera wallet.",
    docsUrl: "https://www.paysera.com/",
    fields: [
      ENABLED_FIELD("paysera"),
      { key: "paysera_project_id", label: "Project ID", type: "text" },
      { key: "paysera_sign_password", label: "Sign password", type: "password" },
      SANDBOX_FIELD("paysera", "Test mode"),
    ],
  },
  {
    id: "securionpay",
    label: "SecurionPay",
    short: "SecurionPay",
    description: "European card acquirer.",
    docsUrl: "https://securionpay.com/",
    fields: [
      ENABLED_FIELD("securionpay"),
      { key: "securionpay_secret_key", label: "Secret key", type: "password" },
    ],
  },
  {
    id: "ngenius",
    label: "N-Genius",
    short: "N-Genius",
    description: "MENA — Network International's card gateway (UAE).",
    docsUrl: "https://portal.ngenius-payments.com/",
    fields: [
      ENABLED_FIELD("ngenius"),
      { key: "ngenius_api_key", label: "API key", type: "password" },
      { key: "ngenius_outlet_ref", label: "Outlet reference", type: "text" },
      SANDBOX_FIELD("ngenius"),
    ],
  },
  {
    id: "fortumo",
    label: "Fortumo",
    short: "Fortumo",
    description: "Carrier billing — direct phone-bill charges across 100+ markets.",
    docsUrl: "https://fortumo.com/",
    fields: [
      ENABLED_FIELD("fortumo"),
      { key: "fortumo_service_id", label: "Service ID", type: "text" },
      { key: "fortumo_secret", label: "Secret", type: "password" },
    ],
  },
  {
    id: "paypro",
    label: "PayPro Bitcoin",
    short: "PayPro",
    description: "Bitcoin / crypto invoicing (PayPro.global).",
    docsUrl: "https://paypro.global/",
    fields: [
      ENABLED_FIELD("paypro"),
      { key: "paypro_api_key", label: "API key", type: "password" },
    ],
  },
  {
    id: "bank_transfer",
    label: "Bank Transfer",
    short: "Bank",
    description:
      "Manual offline payments — users upload a receipt that admins approve in 'Payments → Bank receipts'.",
    fields: [
      ENABLED_FIELD("bank_transfer"),
      {
        key: "bank_transfer_details",
        label: "Bank details / instructions (shown to users)",
        type: "textarea",
        placeholder: "Account holder: Company Inc.\nBank: Example Bank\nAccount: 0000-0000-0000\nIBAN: GB00EXAM00000000000000",
      },
    ],
  },
];

const GLOBAL_FIELDS: SettingsField[] = [
  { key: "wallet_enabled", label: "Enable in-app wallet", type: "boolean" },
  { key: "payment_currency", label: "Default currency (ISO 4217)", type: "text", placeholder: "USD" },
  { key: "withdrawal_min_amount", label: "Minimum withdrawal amount", type: "number", placeholder: "10" },
  { key: "withdrawal_fee", label: "Withdrawal fee (%)", type: "number", placeholder: "2.5" },
  { key: "pro_refund_window_days", label: "Pro-refund window (days)", type: "number", placeholder: "7" },
  { key: "order_refund_window_days", label: "Order-refund window (days)", type: "number", placeholder: "14" },
];

export default function PaymentSettingsPage() {
  const { data } = useQuery({
    queryKey: ["admin", "config", "payments"],
    queryFn: () => adminApi.getConfigCategory("payments"),
  });

  const initial = data ?? {};

  return (
    <AdminPageShell
      title="Payment settings"
      description="Configure the ~20 payment gateways the backend supports. Each gateway writes to the same `payments` config category; disabled gateways are ignored at runtime."
    >
      <div className="space-y-6">
        <SettingsForm
          title="Global payment options"
          fields={GLOBAL_FIELDS}
          initialValues={initial}
          onSave={(v) => adminApi.updateConfigCategory("payments", v)}
        />

        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue={GATEWAYS[0]?.id ?? "stripe"} className="w-full">
              <div className="overflow-x-auto -mx-6 px-6 pb-3">
                <TabsList className="inline-flex w-max">
                  {GATEWAYS.map((g) => {
                    const enabled = Boolean(initial[`${g.id === "2checkout" ? "twocheckout" : g.id}_enabled`]);
                    return (
                      <TabsTrigger key={g.id} value={g.id} className="whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          {g.short}
                          {enabled && <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-label="enabled" />}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              {GATEWAYS.map((g) => (
                <TabsContent key={g.id} value={g.id} className="mt-4 space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{g.description}</p>
                    {g.docsUrl && (
                      <a
                        href={g.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Provider dashboard →
                      </a>
                    )}
                  </div>
                  <SettingsForm
                    title={`${g.label} credentials`}
                    fields={g.fields}
                    initialValues={initial}
                    onSave={(v) => adminApi.updateConfigCategory("payments", v)}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
}
