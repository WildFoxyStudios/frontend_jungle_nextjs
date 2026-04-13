"use client";

import {
  CreditCard, Wallet, Coins, Smartphone, Landmark,
  Zap, Lock, Brain, CircleDollarSign, type LucideIcon,
} from "lucide-react";

const GATEWAYS: { id: string; name: string; icon: LucideIcon }[] = [
  { id: "stripe", name: "Stripe", icon: CreditCard },
  { id: "paypal", name: "PayPal", icon: Wallet },
  { id: "paystack", name: "Paystack", icon: CircleDollarSign },
  { id: "coinbase", name: "Coinbase", icon: Coins },
  { id: "flutterwave", name: "Flutterwave", icon: CircleDollarSign },
  { id: "razorpay", name: "Razorpay", icon: Wallet },
  { id: "iyzipay", name: "Iyzipay", icon: CreditCard },
  { id: "cashfree", name: "CashFree", icon: Wallet },
  { id: "yoomoney", name: "YooMoney", icon: Wallet },
  { id: "aamarpay", name: "Aamarpay", icon: CreditCard },
  { id: "fortumo", name: "Fortumo", icon: Smartphone },
  { id: "2checkout", name: "2Checkout", icon: CreditCard },
  { id: "coinpayments", name: "CoinPayments", icon: Coins },
  { id: "bank_transfer", name: "Bank Transfer", icon: Landmark },
  { id: "braintree", name: "Braintree", icon: CreditCard },
  { id: "payfast", name: "PayFast", icon: Zap },
  { id: "paysera", name: "Paysera", icon: Wallet },
  { id: "securionpay", name: "SecurionPay", icon: Lock },
  { id: "ngenius", name: "NGenius", icon: Brain },
  { id: "paypro_bitcoin", name: "PayPro Bitcoin", icon: Coins },
];

interface PaymentGatewaySelectorProps {
  selected?: string;
  onSelect: (gatewayId: string) => void;
}

export function PaymentGatewaySelector({ selected, onSelect }: PaymentGatewaySelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {GATEWAYS.map((gw) => {
        const Icon = gw.icon;
        return (
          <button
            key={gw.id}
            onClick={() => onSelect(gw.id)}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
              selected === gw.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <Icon className="h-6 w-6" />
            <span className="text-xs font-medium text-center">{gw.name}</span>
          </button>
        );
      })}
    </div>
  );
}
