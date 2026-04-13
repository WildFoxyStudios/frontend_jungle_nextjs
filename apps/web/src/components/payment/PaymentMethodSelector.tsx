"use client";

import { useState } from "react";
import { Button, Card, CardContent } from "@jungle/ui";
import { CreditCard, Building2, Wallet, type LucideIcon } from "lucide-react";

export type PaymentMethod = "stripe" | "paypal" | "bank_transfer" | "wallet";

interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  description: string;
  Icon: LucideIcon;
}

const METHODS: PaymentMethodOption[] = [
  { id: "stripe", label: "Credit / Debit Card", description: "Visa, Mastercard, AMEX", Icon: CreditCard },
  { id: "paypal", label: "PayPal", description: "Pay with your PayPal account", Icon: Wallet },
  { id: "bank_transfer", label: "Bank Transfer", description: "Manual bank transfer", Icon: Building2 },
  { id: "wallet", label: "Wallet Balance", description: "Use your Jungle wallet", Icon: Wallet },
];

interface PaymentMethodSelectorProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  availableMethods?: PaymentMethod[];
  walletBalance?: number;
  currency?: string;
}

export function PaymentMethodSelector({
  selected,
  onSelect,
  availableMethods,
  walletBalance,
  currency = "USD",
}: PaymentMethodSelectorProps) {
  const methods = availableMethods
    ? METHODS.filter((m) => availableMethods.includes(m.id))
    : METHODS;

  return (
    <div className="grid gap-3">
      {methods.map(({ id, label, description, Icon }) => (
        <Card
          key={id}
          className={`cursor-pointer transition-colors ${
            selected === id ? "ring-2 ring-primary" : "hover:bg-muted/50"
          }`}
          onClick={() => onSelect(id)}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-muted p-2">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">
                {id === "wallet" && walletBalance !== undefined
                  ? `Balance: ${currency} ${walletBalance.toFixed(2)}`
                  : description}
              </p>
            </div>
            <div
              className={`h-5 w-5 rounded-full border-2 ${
                selected === id ? "border-primary bg-primary" : "border-muted-foreground/30"
              }`}
            >
              {selected === id && (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
