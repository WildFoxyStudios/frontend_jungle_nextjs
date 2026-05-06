"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "./select";
import { cn } from "../lib/utils";
/**
 * Canonical list of every payment gateway supported by the backend
 * (`backend/crates/payment-service/src/gateway/mod.rs`).
 *
 * Keep this list in sync with `create_gateway()` in that file.
 */
export const PAYMENT_GATEWAYS = [
    { id: "stripe", name: "Stripe", kind: "card", icon: "💳" },
    { id: "paypal", name: "PayPal", kind: "wallet", icon: "🅿️" },
    { id: "paystack", name: "PayStack", kind: "card", icon: "💳" },
    { id: "flutterwave", name: "Flutterwave", kind: "card", icon: "🌍" },
    { id: "razorpay", name: "Razorpay", kind: "card", icon: "🇮🇳" },
    { id: "coinbase", name: "Coinbase Commerce", kind: "crypto", icon: "₿" },
    { id: "braintree", name: "Braintree", kind: "card", icon: "💳" },
    { id: "bank_transfer", name: "Bank Transfer", kind: "bank", icon: "🏦" },
    { id: "authorize_net", name: "Authorize.Net", kind: "card", icon: "💳" },
    { id: "iyzipay", name: "iyzipay", kind: "card", icon: "🇹🇷" },
    { id: "cashfree", name: "Cashfree", kind: "card", icon: "🇮🇳" },
    { id: "yoomoney", name: "YooMoney", kind: "wallet", icon: "🇷🇺" },
    { id: "aamarpay", name: "aamarPay", kind: "card", icon: "🇧🇩" },
    { id: "2checkout", name: "2Checkout", kind: "card", icon: "💳" },
    { id: "coinpayments", name: "CoinPayments", kind: "crypto", icon: "₿" },
    { id: "payfast", name: "PayFast", kind: "card", icon: "🇿🇦" },
    { id: "paysera", name: "Paysera", kind: "wallet", icon: "🇱🇹" },
    { id: "securionpay", name: "SecurionPay", kind: "card", icon: "💳" },
    { id: "ngenius", name: "N-Genius", kind: "card", icon: "🇦🇪" },
    { id: "fortumo", name: "Fortumo", kind: "carrier", icon: "📱" },
    { id: "paypro", name: "PayPro Bitcoin", kind: "crypto", icon: "₿" },
];
/**
 * Unified payment-gateway picker — replaces every hard-coded `"stripe"` in
 * the web app (wallet top-up, go-pro subscribe, checkout, funding donate,
 * creator subscribe).
 *
 * The list is canonical; optional `allow` / `kind` props narrow it. If the
 * admin has disabled a gateway backend-side the attempt will fail with a
 * provider error — surface that with a toast.
 */
export function GatewaySelect({ value, onValueChange, allow, kind, disabled, placeholder = "Choose payment method\u2026", className, }) {
    const kinds = React.useMemo(() => {
        if (!kind)
            return null;
        return new Set(Array.isArray(kind) ? kind : [kind]);
    }, [kind]);
    const gateways = React.useMemo(() => {
        return PAYMENT_GATEWAYS.filter((g) => {
            if (allow && !allow.includes(g.id))
                return false;
            if (kinds && !kinds.has(g.kind))
                return false;
            return true;
        });
    }, [allow, kinds]);
    // With `exactOptionalPropertyTypes: true`, Radix's Select rejects explicit
    // `undefined` for `value`/`disabled`; spread only the defined ones.
    const selectProps = {
        onValueChange,
        ...(value !== undefined ? { value } : {}),
        ...(disabled !== undefined ? { disabled } : {}),
    };
    return (_jsxs(Select, { ...selectProps, children: [_jsx(SelectTrigger, { className: cn("w-full", className), children: _jsx(SelectValue, { placeholder: placeholder }) }), _jsx(SelectContent, { children: gateways.map((g) => (_jsx(SelectItem, { value: g.id, children: _jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx("span", { "aria-hidden": true, className: "text-base leading-none", children: g.icon }), _jsx("span", { children: g.name })] }) }, g.id))) })] }));
}
//# sourceMappingURL=gateway-select.js.map