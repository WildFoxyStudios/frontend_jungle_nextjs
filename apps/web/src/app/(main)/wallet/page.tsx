"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { paymentsApi } from "@jungle/api-client";
import type { Wallet, Transaction, WithdrawalRequest } from "@jungle/api-client";
import { useTranslations } from "next-intl";
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Label, Badge, Skeleton, Separator,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Avatar, AvatarFallback, AvatarImage,
  CardDescription, GatewaySelect,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@jungle/ui";
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft,
  History, DollarSign, Send, CreditCard, Landmark, Clock, Gift
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpGateway, setTopUpGateway] = useState<string>("stripe");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const t = useTranslations("payments");
  const tc = useTranslations("common");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [wRes, tRes] = await Promise.all([
          paymentsApi.getWallet(),
          paymentsApi.getTransactions(),
        ]);
        setWallet(wRes);
        setTransactions(tRes.data);
      } catch (err) {
        toast.error(t("errorLoading"));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [t]);

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) return toast.error(t("validAmount"));
    if (!topUpGateway) return toast.error(t("validAmount"));
    try {
      const res = await paymentsApi.addFunds(amount, topUpGateway);
      if (res.redirect_url) {
        window.location.href = res.redirect_url;
      } else {
        toast.success(t("replenish"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("topUpFailed"));
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return toast.error(t("validAmount"));
    try {
      await paymentsApi.requestWithdrawal({
        amount,
        method: "paypal",
        account_details: "User Email" // Simplified
      });
      toast.success(t("withdrawalSuccess"));
      setWithdrawAmount("");
    } catch (err) {
      toast.error(t("withdrawalFailed"));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Balance Card */}
        <Card className="flex-1 bg-primary text-primary-foreground overflow-hidden relative border-none">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <WalletIcon className="h-32 w-32 rotate-12" />
          </div>
          <CardHeader>
            <CardTitle className="text-primary-foreground/80 font-medium text-sm flex items-center gap-2">
              <WalletIcon className="h-4 w-4" /> {t("balance")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl md:text-5xl font-extrabold tracking-tight">
              {loading ? <Skeleton className="h-12 w-32 bg-white/20" /> : `$${wallet?.balance.toFixed(2) ?? "0.00"}`}
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-none">
                {t("nonWithdrawable", { amount: `$${wallet?.balance.toFixed(2) ?? "0.00"}` })}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 w-full md:w-80">
          <Card 
            className="flex flex-col items-center justify-center p-4 gap-2 hover:bg-muted/50 cursor-pointer transition-colors border-2 border-dashed"
            onClick={() => document.getElementById('replenish-tab')?.click()}
          >
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("topUp")}</span>
          </Card>
          <TransferFundsDialog onTransferred={() => window.location.reload()} />
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-lg bg-muted/30">
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger id="replenish-tab" value="replenish">{t("replenish")}</TabsTrigger>
          <TabsTrigger value="withdraw">{t("withdraw")}</TabsTrigger>
          <TabsTrigger value="history">{t("history")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <WalletOverview wallet={wallet} loading={loading} />
        </TabsContent>

        <TabsContent value="replenish" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("addFunds")}</CardTitle>
              <CardDescription>{t("addFundsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{t("amountLabel")}</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="max-w-[200px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Payment method</Label>
                <GatewaySelect
                  value={topUpGateway}
                  onValueChange={setTopUpGateway}
                />
                <p className="text-xs text-muted-foreground">
                  {t("supportedMethods")}
                </p>
              </div>
              <Separator />
              <Button onClick={handleTopUp} className="gap-2" disabled={!topUpAmount || !topUpGateway}>
                <CreditCard className="h-4 w-4" /> {t("continue")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdraw" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("requestWithdrawal")}</CardTitle>
              <CardDescription>{t("withdrawDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900/50 gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  {t("minWithdrawal")}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="w-method">{t("method")}</Label>
                  <Input disabled value="PayPal" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="w-amount">{t("amountLabel")}</Label>
                  <Input
                    id="w-amount"
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleWithdraw} variant="outline" className="w-full md:w-auto">{t("requestPayout")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-4 w-4" /> {t("transactionLog")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground italic">
                  {t("noTransactions")}
                </div>
              ) : (
                <div className="divide-y">
                  {transactions.map((t_item) => (
                    <div key={t_item.id} className="py-4 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${t_item.type === 'topup' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                          {t_item.type === 'topup' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold capitalize">{t_item.type.replace('_', ' ')}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-tight font-bold opacity-60">
                            {format(new Date(t_item.created_at), "MMM d, yyyy · HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${t_item.type === 'topup' ? 'text-blue-600' : 'text-foreground'}`}>
                          {t_item.type === 'topup' ? '+' : '-'}${t_item.amount.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-muted-foreground lowercase opacity-60">{t("via", { gateway: t_item.gateway || t("balance_label") })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TransferFundsDialog({ onTransferred }: { onTransferred: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        username: "",
        amount: "",
    });
    const t = useTranslations("payments");

    const handleTransfer = async () => {
        if (!form.username || !form.amount) return toast.error(t("fillAll"));
        setLoading(true);
        try {
            await paymentsApi.transferFunds({
                username: form.username,
                amount: parseFloat(form.amount)
            });
            toast.success(t("transferSuccess"));
            setOpen(false);
            onTransferred();
        } catch (err) {
            toast.error(t("transferError"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Card className="flex flex-col items-center justify-center p-4 gap-2 hover:bg-muted/50 cursor-pointer transition-colors border-2 border-dashed">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <Send className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("send")}</span>
                </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("sendMoney")}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">{t("recipientUsername")}</Label>
                        <Input 
                            id="username" 
                            placeholder="e.g. johndoe" 
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="t-amount">{t("amountLabel")}</Label>
                        <Input 
                            id="t-amount" 
                            type="number" 
                            placeholder="0.00" 
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        />
                    </div>
                </div>
                <Button onClick={handleTransfer} disabled={loading} className="w-full h-12 rounded-xl font-bold">
                    {loading ? t("sending") : t("transferFunds")}
                </Button>
            </DialogContent>
        </Dialog>
    );
}

function WalletOverview({ wallet, loading }: { wallet: Wallet | null; loading: boolean }) {
  const tc = useTranslations("common");
  
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }
  
  const stats = [
    { label: "Available Balance", value: `$${wallet?.balance.toFixed(2) ?? "0.00"}`, icon: WalletIcon },
    { label: "Pending Withdrawals", value: "$0.00", icon: Clock },
    { label: "Total Earned", value: "$0.00", icon: DollarSign },
  ];
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => document.getElementById('replenish-tab')?.click()}>
            <ArrowDownLeft className="h-5 w-5" />
            <span>Top Up</span>
          </Button>
          <TransferFundsDialog onTransferred={() => window.location.reload()} />
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => {}}>
            <ArrowUpRight className="h-5 w-5" />
            <span>Withdraw</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
            <Link href="/settings/affiliates">
              <Gift className="h-5 w-5" />
              <span>Affiliate</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
