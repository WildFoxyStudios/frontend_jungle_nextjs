"use client";

import { useEffect, useState } from "react";
import { paymentsApi } from "@jungle/api-client";
import type { Wallet } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Button } from "@jungle/ui";
import Link from "next/link";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default function PaymentMethodsPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentsApi.getWallet()
      .then(setWallet)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      {/* Wallet Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5" /> Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-3xl font-bold">
            {wallet?.currency ?? "USD"} {wallet?.balance?.toFixed(2) ?? "0.00"}
          </div>
          {wallet?.pending_balance !== undefined && wallet.pending_balance > 0 && (
            <p className="text-sm text-muted-foreground">
              Pending: {wallet.currency} {wallet.pending_balance.toFixed(2)}
            </p>
          )}
          <div className="flex gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/wallet">
                <ArrowDownLeft className="h-4 w-4 mr-1" /> Add Funds
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/withdrawal">
                <ArrowUpRight className="h-4 w-4 mr-1" /> Withdraw
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History Link */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Transaction History</p>
            <p className="text-xs text-muted-foreground">View all your past transactions</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/settings/transactions">View All</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Pro Subscription Link */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Pro Membership</p>
            <p className="text-xs text-muted-foreground">Upgrade to unlock premium features</p>
          </div>
          <Button asChild size="sm">
            <Link href="/go-pro">Go Pro</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
