"use client";

import { useState } from "react";
import { toast } from "sonner";
import { paymentsApi, commerceApi } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@jungle/ui";
import { Loader2 } from "lucide-react";
import { PaymentMethodSelector, type PaymentMethod } from "./PaymentMethodSelector";

interface CheckoutFlowProps {
  amount: number;
  currency?: string;
  description: string;
  type: "pro" | "funds" | "subscribe" | "product" | "donate";
  targetId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CheckoutFlow({
  amount,
  currency = "USD",
  description,
  type,
  targetId,
  onSuccess,
  onCancel,
}: CheckoutFlowProps) {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!method) {
      toast.error("Please select a payment method");
      return;
    }

    setLoading(true);
    try {
      let redirectUrl: string | undefined;

      switch (type) {
        case "pro": {
          const res = await paymentsApi.subscribePro(targetId!, method);
          redirectUrl = res.redirect_url;
          break;
        }
        case "funds": {
          const res = await paymentsApi.addFunds(amount, method);
          redirectUrl = res.redirect_url;
          break;
        }
        case "subscribe": {
          const res = await paymentsApi.subscribeToCreator(targetId!);
          redirectUrl = res.redirect_url;
          break;
        }
        case "donate": {
          const res = await commerceApi.donateFunding(targetId!, amount, method);
          redirectUrl = res.redirect_url;
          break;
        }
        default: {
          const res = await paymentsApi.addFunds(amount, method);
          redirectUrl = res.redirect_url;
        }
      }

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        toast.success("Payment successful!");
        onSuccess?.();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">Complete Payment</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">Total</span>
          <span className="text-lg font-bold">
            {currency} {amount.toFixed(2)}
          </span>
        </div>

        <PaymentMethodSelector selected={method} onSelect={setMethod} />

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button className="flex-1" onClick={handlePay} disabled={!method || loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Pay {currency} {amount.toFixed(2)}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
