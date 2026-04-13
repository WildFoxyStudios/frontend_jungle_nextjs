"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { paymentsApi } from "@jungle/api-client";
import { PaymentGatewaySelector } from "@/components/payments/PaymentGatewaySelector";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@jungle/ui";
import { toast } from "sonner";

interface Props { params: Promise<{ orderId: string }> }

export default function CheckoutPage({ params }: Props) {
  const { orderId } = use(params);
  const router = useRouter();
  const [gateway, setGateway] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = async () => {
    if (!gateway) return;
    setIsProcessing(true);
    try {
      const res = await paymentsApi.addFunds(0, gateway);
      if (res.redirect_url) {
        window.location.href = res.redirect_url;
      } else {
        toast.success("Payment completed!");
        router.push("/orders/" + orderId);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <Card>
        <CardHeader><CardTitle>Checkout — Order #{orderId}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium">Select payment method:</p>
          <PaymentGatewaySelector selected={gateway} onSelect={setGateway} />
          <Button
            className="w-full"
            disabled={!gateway || isProcessing}
            onClick={handlePay}
          >
            {isProcessing ? "Processing…" : "Pay now"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
