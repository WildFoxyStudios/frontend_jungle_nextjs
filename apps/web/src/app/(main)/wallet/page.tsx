"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { paymentsApi } from "@jungle/api-client";
import type { Wallet, Transaction } from "@jungle/api-client";
import { useTranslations } from "next-intl";
import {
 Card, CardContent, CardHeader, CardTitle,
 Button, Input, Label, Badge, Skeleton, Separator,
 Tabs, TabsContent, TabsList, TabsTrigger,
 CardDescription, GatewaySelect,
 Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@jungle/ui";
import { BankReceiptDialog } from "@/components/payment/BankReceiptDialog";
import {
 Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft,
 History, DollarSign, Send, CreditCard, Clock, Gift
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

function toNumber(value: unknown, fallback = 0): number {
 const n = typeof value === "number" ? value : Number(value);
 return Number.isFinite(n) ? n : fallback;
}

function formatMoney(value: unknown): string {
 return `$${toNumber(value).toFixed(2)}`;
}

function safeFormat(dateStr: string): string {
 const d = new Date(dateStr);
 return Number.isNaN(d.getTime()) ? '' : format(d, 'MMM d, yyyy · HH:mm');
}

export default function WalletPage() {
 const [wallet, setWallet] = useState<Wallet | null>(null);
 const [transactions, setTransactions] = useState<Transaction[]>([]);
 const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("overview");
 const [topUpAmount, setTopUpAmount] = useState("");
 const [topUpGateway, setTopUpGateway] = useState<string>("stripe");
 const [showBankReceipt, setShowBankReceipt] = useState(false);
 const [withdrawAmount, setWithdrawAmount] = useState("");
 const [withdrawAccount, setWithdrawAccount] = useState("");
 const t = useTranslations("payments");
 const walletBalance = toNumber(wallet?.balance);

 useEffect(() => {
 const loadData = async () => {
 try {
 const [wRes, tRes] = await Promise.all([
 paymentsApi.getWallet(),
 paymentsApi.getTransactions(),
 ]);
 setWallet(wRes);
 setTransactions(tRes.data);
 } catch {
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

 if (topUpGateway === "bank_transfer") {
 setShowBankReceipt(true);
 return;
 }

 try {
 const res = await paymentsApi.addFunds(amount, topUpGateway, window.location.href, window.location.href);
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
 if (!withdrawAccount.trim()) return toast.error("PayPal email is required");
 try {
 await paymentsApi.requestWithdrawal({
 amount,
 method: "paypal",
 account_details: withdrawAccount.trim(),
 });
 toast.success(t("withdrawalSuccess"));
 setWithdrawAmount("");
 setWithdrawAccount("");
 } catch {
 toast.error(t("withdrawalFailed"));
 }
 };

 return (
 <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:py-8">
 <div className="flex flex-col gap-4 md:flex-row md:gap-6">
 {/* Balance Card */}
 <Card className="relative flex-1 overflow-hidden bg-primary text-primary-foreground">
 <div className="pointer-events-none absolute right-0 top-0 p-8 opacity-10">
 <WalletIcon className="h-32 w-32 rotate-12" />
 </div>
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary-foreground/85">
 <WalletIcon className="h-4 w-4" /> {t("balance")}
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="text-4xl font-bold md:text-5xl">
 {loading ? <Skeleton className="h-12 w-32 bg-white/20" /> : formatMoney(walletBalance)}
 </div>
 <div className="flex gap-2">
 <Badge className="border bg-background text-foreground">
 {t("nonWithdrawable", { amount: formatMoney(walletBalance) })}
 </Badge>
 </div>
 </CardContent>
 </Card>

 {/* Quick Actions */}
 <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 md:w-80">
 <Card
 className="flex cursor-pointer flex-col items-center justify-center gap-2 p-4 transition-colors hover:bg-muted/50"
 onClick={() => setActiveTab("replenish")}
 >
 <div className="flex h-10 w-10 items-center justify-center border bg-info/20 text-info">
 <ArrowDownLeft className="h-5 w-5" />
 </div>
 <span className="text-xs font-semibold text-foreground">
 {t("topUp")}
 </span>
 </Card>
 <TransferFundsDialog onTransferred={() => window.location.reload()} />
 </div>
 </div>

 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
 <TabsList className="grid w-full max-w-lg grid-cols-4">
 <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
 <TabsTrigger id="replenish-tab" value="replenish">{t("replenish")}</TabsTrigger>
 <TabsTrigger id="withdraw-tab" value="withdraw">{t("withdraw")}</TabsTrigger>
 <TabsTrigger value="history">{t("history")}</TabsTrigger>
 </TabsList>

 <TabsContent value="overview" className="pt-4">
 <WalletOverview wallet={wallet} loading={loading} transactions={transactions} onNavigateTab={setActiveTab} />
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
 <div className="flex items-center gap-3 border bg-yellow-100 p-4 text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-300">
 <Clock className="h-5 w-5" />
 <p className="text-[13px] font-medium">
 {t("minWithdrawal")}
 </p>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="w-method">{t("method")}</Label>
 <Input disabled value="PayPal" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="w-account">PayPal Email</Label>
 <Input
 id="w-account"
 type="email"
 placeholder="you@example.com"
 value={withdrawAccount}
 onChange={(e) => setWithdrawAccount(e.target.value)}
 />
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
 <Button
 onClick={handleWithdraw}
 variant="outline"
 className="w-full md:w-auto"
 disabled={!withdrawAccount.trim() || !withdrawAmount}
 >
 {t("requestPayout")}
 </Button>
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
 <div className="space-y-2">
 {transactions.map((t_item) => (
 <div
 key={t_item.id}
 className="group flex items-center justify-between p-3 transition-colors hover:bg-muted/50"
 >
 <div className="flex items-center gap-3">
 <div
 className={`flex h-10 w-10 items-center justify-center border ${
 t_item.type === "topup"
 ? "bg-info/20 text-info"
 : "bg-destructive/15 text-destructive"
 }`}
 >
 {t_item.type === "topup" ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
 </div>
 <div>
 <p className="text-sm font-semibold capitalize">{t_item.type.replace("_", " ")}</p>
 <p className="text-[13px] font-medium text-muted-foreground">
 {safeFormat(t_item.created_at)}
 </p>
 </div>
 </div>
 <div className="text-right">
 <p className={`text-sm font-semibold ${t_item.type === "topup" ? "text-info" : "text-foreground"}`}>
 {t_item.type === "topup" ? "+" : "-"}{formatMoney(t_item.amount).replace("$", "")}
 </p>
 <p className="text-[13px] font-medium text-muted-foreground">
 {t("via", { gateway: t_item.gateway || t("balance_label") })}
 </p>
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>

 <BankReceiptDialog 
 open={showBankReceipt} 
 onOpenChange={setShowBankReceipt} 
 amount={parseFloat(topUpAmount) || 0} 
 />
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
 } catch {
 toast.error(t("transferError"));
 } finally {
 setLoading(false);
 }
 };

 return (
 <Dialog open={open} onOpenChange={setOpen}>
 <DialogTrigger asChild>
 <Card className="flex cursor-pointer flex-col items-center justify-center gap-2 p-4 transition-colors hover:bg-muted/50">
 <div className="flex h-10 w-10 items-center justify-center border bg-success/20 text-success">
 <Send className="h-5 w-5" />
 </div>
 <span className="text-xs font-semibold text-foreground">
 {t("send")}
 </span>
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
 <Button onClick={handleTransfer} disabled={loading} className="h-12 w-full">
 {loading ? t("sending") : t("transferFunds")}
 </Button>
 </DialogContent>
 </Dialog>
 );
}

function WalletOverview({
 wallet,
 loading,
 transactions,
 onNavigateTab,
}: {
 wallet: Wallet | null;
 loading: boolean;
 transactions: Transaction[];
 onNavigateTab: (tab: string) => void;
}) {
 const t = useTranslations("payments");
 if (loading) {
 return (
 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
 {[1, 2, 3].map((i) => (
 <Skeleton key={i} className="h-32" />
 ))}
 </div>
 );
 }
 
 const totalEarned = transactions
 .filter((tx) => tx.status === "completed" && tx.type === "topup")
 .reduce((sum, tx) => sum + toNumber(tx.amount), 0);
 const stats = [
 { label: t("balance"), value: formatMoney(wallet?.balance), icon: WalletIcon },
 { label: "Pending Withdrawals", value: formatMoney(wallet?.pending_balance), icon: Clock },
 { label: "Total Earned", value: formatMoney(totalEarned), icon: DollarSign },
 ];
 
 return (
 <div className="space-y-6">
 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
 {stats.map((stat) => (
 <Card key={stat.label}>
 <CardContent className="p-6">
 <div className="flex items-center gap-4">
 <div className="border bg-primary/15 p-3 text-primary">
 <stat.icon className="h-6 w-6" />
 </div>
 <div>
 <p className="text-[13px] font-medium text-muted-foreground">
 {stat.label}
 </p>
 <p className="text-2xl font-semibold">{stat.value}</p>
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
 <Button
 variant="outline"
 className="h-auto py-4 flex flex-col gap-2"
 onClick={() => onNavigateTab("replenish")}
 >
 <ArrowDownLeft className="h-5 w-5" />
 <span>{t("topUp")}</span>
 </Button>
 <TransferFundsDialog onTransferred={() => window.location.reload()} />
 <Button
 variant="outline"
 className="h-auto py-4 flex flex-col gap-2"
 onClick={() => onNavigateTab("withdraw")}
 >
 <ArrowUpRight className="h-5 w-5" />
 <span>{t("withdraw")}</span>
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
