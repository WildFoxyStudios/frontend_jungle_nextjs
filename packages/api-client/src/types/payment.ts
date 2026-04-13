import type { PublicUser } from "./user";

export type PaymentGateway =
  | "stripe"
  | "paypal"
  | "paystack"
  | "coinbase"
  | "flutterwave"
  | "razorpay"
  | "iyzipay"
  | "cashfree"
  | "yoomoney"
  | "aamarpay"
  | "fortumo"
  | "2checkout"
  | "coinpayments"
  | "bank_transfer"
  | "braintree"
  | "payfast"
  | "paysera"
  | "securionpay"
  | "ngenius"
  | "paypro_bitcoin";

export interface Transaction {
  id: number;
  user: PublicUser;
  type: "deposit" | "withdrawal" | "purchase" | "subscription" | "transfer" | "refund";
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  status: "pending" | "completed" | "failed" | "refunded";
  reference: string;
  description: string;
  created_at: string;
}

export interface Wallet {
  balance: number;
  currency: string;
  pending_balance: number;
}

export interface ProPlan {
  id: number;
  name: string;
  price: number;
  currency: string;
  duration_days: number;
  features: string[];
  is_popular: boolean;
}

export interface CreatorTier {
  id: number;
  creator: PublicUser;
  name: string;
  description: string;
  price: number;
  currency: string;
  benefits: string[];
  subscriber_count: number;
}

export interface WithdrawalRequest {
  id: number;
  user: PublicUser;
  amount: number;
  currency: string;
  method: string;
  account_details: string;
  status: "pending" | "approved" | "rejected";
  note?: string;
  created_at: string;
}

export interface UserAd {
  id: number;
  name: string;
  headline: string;
  description: string;
  image: string;
  url: string;
  audience: string;
  placement: string;
  budget: number;
  bid_type: "cpc" | "cpm";
  status: "active" | "paused" | "cancelled" | "pending";
  daily_budget: number;
  total_budget: number;
  impressions: number;
  clicks: number;
  ctr: number;
  spent: number;
  currency: string;
  created_at: string;
}
