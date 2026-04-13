"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { paymentsApi } from "@jungle/api-client";
import type { Wallet } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@jungle/ui";
import { PaymentGatewaySelector } from "@/components/payments/PaymentGatewaySelector";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Send } from "lucide-react";

const addFundsSchema = z.object({
  amount: z.coerce.number().min(1, "Minimum $1"),
  gateway: z.string().min(1, "Select a payment method"),
});

const transferSchema = z.object({
  user_id: z.coerce.number().min(1, "User ID is required"),
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
});

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [gateway, setGateway] = useState("");

  const addForm = useForm<z.infer<typeof addFundsSchema>>({
    resolver: zodResolver(addFundsSchema),
  });

  const transferForm = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
  });

  useEffect(() => {
    paymentsApi.getWallet()
      .then(setWallet)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAddFunds = async (data: z.infer<typeof addFundsSchema>) => {
    try {
      const res = await paymentsApi.addFunds(data.amount, data.gateway);
      if (res.redirect_url) {
        window.location.href = res.redirect_url;
      } else {
        setWallet((w) => w ? { ...w, balance: w.balance + data.amount } : w);
        toast.success("Funds added successfully");
        setAddOpen(false);
        addForm.reset();
      }
    } catch {
      toast.error("Failed to add funds");
    }
  };

  const handleTransfer = async (data: z.infer<typeof transferSchema>) => {
    try {
      await paymentsApi.transferFunds(data.user_id, data.amount);
      setWallet((w) => w ? { ...w, balance: w.balance - data.amount } : w);
      toast.success("Transfer successful");
      setTransferOpen(false);
      transferForm.reset();
    } catch {
      toast.error("Failed to transfer funds");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">Wallet</h1>

      {loading ? <Skeleton className="h-40 w-full" /> : (
        <Card>
          <CardHeader><CardTitle>Balance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-4xl font-bold">{wallet?.currency ?? "USD"} {Number(wallet?.balance ?? 0).toFixed(2)}</p>
              {wallet?.pending_balance !== undefined && wallet.pending_balance > 0 && (
                <p className="text-sm text-muted-foreground mt-1">Pending: {wallet.currency} {Number(wallet.pending_balance).toFixed(2)}</p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setAddOpen(true)}>
                <ArrowDownLeft className="h-4 w-4 mr-2" /> Add Funds
              </Button>
              <Button variant="outline" onClick={() => setTransferOpen(true)}>
                <Send className="h-4 w-4 mr-2" /> Transfer
              </Button>
              <Button variant="outline" asChild>
                <Link href="/withdrawal">
                  <ArrowUpRight className="h-4 w-4 mr-2" /> Withdraw
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Add Funds Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Funds</DialogTitle></DialogHeader>
          <form onSubmit={addForm.handleSubmit(handleAddFunds)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Amount ({wallet?.currency ?? "USD"})</Label>
              <Input type="number" step="0.01" {...addForm.register("amount")} placeholder="0.00" />
              {addForm.formState.errors.amount && <p className="text-xs text-destructive">{addForm.formState.errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <PaymentGatewaySelector selected={gateway} onSelect={(g) => { setGateway(g); addForm.setValue("gateway", g); }} />
              {addForm.formState.errors.gateway && <p className="text-xs text-destructive">{addForm.formState.errors.gateway.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addForm.formState.isSubmitting}>
                {addForm.formState.isSubmitting ? "Processing…" : "Add Funds"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Transfer Funds</DialogTitle></DialogHeader>
          <form onSubmit={transferForm.handleSubmit(handleTransfer)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Recipient User ID</Label>
              <Input type="number" {...transferForm.register("user_id")} placeholder="Enter user ID" />
              {transferForm.formState.errors.user_id && <p className="text-xs text-destructive">{transferForm.formState.errors.user_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Amount ({wallet?.currency ?? "USD"})</Label>
              <Input type="number" step="0.01" {...transferForm.register("amount")} placeholder="0.00" />
              {transferForm.formState.errors.amount && <p className="text-xs text-destructive">{transferForm.formState.errors.amount.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={transferForm.formState.isSubmitting}>
                {transferForm.formState.isSubmitting ? "Transferring…" : "Transfer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
