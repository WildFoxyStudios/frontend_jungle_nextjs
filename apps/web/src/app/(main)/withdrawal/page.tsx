"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { paymentsApi } from "@jungle/api-client";
import type { Wallet, WithdrawalRequest } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Skeleton, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@jungle/ui";
import { toast } from "sonner";

const withdrawalSchema = z.object({
  amount: z.coerce.number().min(1, "Minimum withdrawal is $1"),
  method: z.string().min(1, "Select a method"),
  account_details: z.string().min(5, "Account details are required"),
});

type WithdrawalForm = z.infer<typeof withdrawalSchema>;

const METHODS = ["paypal", "bank_transfer", "paystack", "flutterwave", "razorpay"];

export default function WithdrawalPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<WithdrawalForm>({
    resolver: zodResolver(withdrawalSchema),
  });

  const method = watch("method");

  useEffect(() => {
    Promise.all([
      paymentsApi.getWallet(),
      paymentsApi.getWithdrawals(),
    ]).then(([w, wr]) => {
      setWallet(w);
      setWithdrawals(wr.data as WithdrawalRequest[]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data: WithdrawalForm) => {
    try {
      const req = await paymentsApi.requestWithdrawal(data);
      setWithdrawals((prev) => [req, ...prev]);
      reset();
      toast.success("Withdrawal request submitted");
    } catch {
      toast.error("Failed to submit withdrawal request");
    }
  };

  if (loading) return <Skeleton className="h-64 w-full max-w-2xl mx-auto mt-4" />;

  const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "secondary", approved: "default", rejected: "destructive",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
      <h1 className="text-2xl font-bold">Withdrawal</h1>

      {/* Balance */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Available Balance</p>
          <p className="text-3xl font-bold">{wallet?.currency ?? "USD"} {wallet?.balance?.toFixed(2) ?? "0.00"}</p>
        </CardContent>
      </Card>

      {/* Request Form */}
      <Card>
        <CardHeader><CardTitle>Request Withdrawal</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Amount ({wallet?.currency ?? "USD"})</Label>
              <Input type="number" step="0.01" {...register("amount")} placeholder="0.00" />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Withdrawal Method</Label>
              <Select onValueChange={(v) => setValue("method", v)}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.method && <p className="text-xs text-destructive">{errors.method.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Account Details</Label>
              <Input
                {...register("account_details")}
                placeholder={method === "paypal" ? "PayPal email" : method === "bank_transfer" ? "IBAN / Account number" : "Account details"}
              />
              {errors.account_details && <p className="text-xs text-destructive">{errors.account_details.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Submitting…" : "Request Withdrawal"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History */}
      {withdrawals.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Withdrawal History</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{w.currency} {w.amount} via {w.method}</p>
                  <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={STATUS_VARIANT[w.status] ?? "secondary"} className="capitalize">{w.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
