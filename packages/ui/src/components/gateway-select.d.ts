/**
 * Canonical list of every payment gateway supported by the backend
 * (`backend/crates/payment-service/src/gateway/mod.rs`).
 *
 * Keep this list in sync with `create_gateway()` in that file.
 */
export declare const PAYMENT_GATEWAYS: readonly [{
    readonly id: "stripe";
    readonly name: "Stripe";
    readonly kind: "card";
    readonly icon: "💳";
}, {
    readonly id: "paypal";
    readonly name: "PayPal";
    readonly kind: "wallet";
    readonly icon: "🅿️";
}, {
    readonly id: "paystack";
    readonly name: "PayStack";
    readonly kind: "card";
    readonly icon: "💳";
}, {
    readonly id: "flutterwave";
    readonly name: "Flutterwave";
    readonly kind: "card";
    readonly icon: "🌍";
}, {
    readonly id: "razorpay";
    readonly name: "Razorpay";
    readonly kind: "card";
    readonly icon: "🇮🇳";
}, {
    readonly id: "coinbase";
    readonly name: "Coinbase Commerce";
    readonly kind: "crypto";
    readonly icon: "₿";
}, {
    readonly id: "braintree";
    readonly name: "Braintree";
    readonly kind: "card";
    readonly icon: "💳";
}, {
    readonly id: "bank_transfer";
    readonly name: "Bank Transfer";
    readonly kind: "bank";
    readonly icon: "🏦";
}, {
    readonly id: "authorize_net";
    readonly name: "Authorize.Net";
    readonly kind: "card";
    readonly icon: "💳";
}, {
    readonly id: "iyzipay";
    readonly name: "iyzipay";
    readonly kind: "card";
    readonly icon: "🇹🇷";
}, {
    readonly id: "cashfree";
    readonly name: "Cashfree";
    readonly kind: "card";
    readonly icon: "🇮🇳";
}, {
    readonly id: "yoomoney";
    readonly name: "YooMoney";
    readonly kind: "wallet";
    readonly icon: "🇷🇺";
}, {
    readonly id: "aamarpay";
    readonly name: "aamarPay";
    readonly kind: "card";
    readonly icon: "🇧🇩";
}, {
    readonly id: "2checkout";
    readonly name: "2Checkout";
    readonly kind: "card";
    readonly icon: "💳";
}, {
    readonly id: "coinpayments";
    readonly name: "CoinPayments";
    readonly kind: "crypto";
    readonly icon: "₿";
}, {
    readonly id: "payfast";
    readonly name: "PayFast";
    readonly kind: "card";
    readonly icon: "🇿🇦";
}, {
    readonly id: "paysera";
    readonly name: "Paysera";
    readonly kind: "wallet";
    readonly icon: "🇱🇹";
}, {
    readonly id: "securionpay";
    readonly name: "SecurionPay";
    readonly kind: "card";
    readonly icon: "💳";
}, {
    readonly id: "ngenius";
    readonly name: "N-Genius";
    readonly kind: "card";
    readonly icon: "🇦🇪";
}, {
    readonly id: "fortumo";
    readonly name: "Fortumo";
    readonly kind: "carrier";
    readonly icon: "📱";
}, {
    readonly id: "paypro";
    readonly name: "PayPro Bitcoin";
    readonly kind: "crypto";
    readonly icon: "₿";
}];
export type PaymentGatewayId = (typeof PAYMENT_GATEWAYS)[number]["id"];
export type PaymentGatewayKind = "card" | "wallet" | "bank" | "crypto" | "carrier";
export interface GatewaySelectProps {
    /** Currently selected gateway id. */
    value?: string;
    /** Called with the chosen gateway id. */
    onValueChange: (value: string) => void;
    /**
     * Subset of gateway ids to allow. When provided, only these appear in the
     * dropdown. Useful when admin config has disabled some providers.
     */
    allow?: readonly string[];
    /** Filter by gateway kind (card / wallet / bank / crypto / carrier). */
    kind?: PaymentGatewayKind | PaymentGatewayKind[];
    /** Disable interaction. */
    disabled?: boolean;
    /** Custom trigger placeholder. */
    placeholder?: string;
    className?: string;
}
/**
 * Unified payment-gateway picker — replaces every hard-coded `"stripe"` in
 * the web app (wallet top-up, go-pro subscribe, checkout, funding donate,
 * creator subscribe).
 *
 * The list is canonical; optional `allow` / `kind` props narrow it. If the
 * admin has disabled a gateway backend-side the attempt will fail with a
 * provider error — surface that with a toast.
 */
export declare function GatewaySelect({ value, onValueChange, allow, kind, disabled, placeholder, className, }: GatewaySelectProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=gateway-select.d.ts.map