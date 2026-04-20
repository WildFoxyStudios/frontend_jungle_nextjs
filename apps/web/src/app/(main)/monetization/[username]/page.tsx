"use client";

import { use, useEffect, useState } from "react";
import { paymentsApi, usersApi } from "@jungle/api-client";
import type { CreatorTier } from "@jungle/api-client";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@jungle/ui";
import { Check } from "lucide-react";
import { toast } from "sonner";

interface Props { params: Promise<{ username: string }> }

export default function MonetizationPage({ params }: Props) {
  const { username } = use(params);
  const [tiers, setTiers] = useState<CreatorTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<number | null>(null);

  useEffect(() => {
    usersApi.getUser(username)
      .then((user) => paymentsApi.getCreatorTiers(user.id))
      .then(setTiers)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load creator tiers"))
      .finally(() => setLoading(false));
  }, [username]);

  const handleSubscribe = async (tier: CreatorTier) => {
    setSubscribing(tier.id);
    try {
      const res = await paymentsApi.subscribeToCreator(tier.creator.id);
      if (res.redirect_url) {
        window.location.href = res.redirect_url;
      } else {
        toast.success(`Subscribed to ${tier.name}!`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to subscribe");
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support @{username}</h1>
        <p className="text-muted-foreground text-sm mt-1">Choose a membership tier to support this creator.</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : tiers.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">This creator hasn&apos;t set up membership tiers yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tiers.map((tier) => (
            <Card key={tier.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{tier.name}</CardTitle>
                  <Badge variant="secondary">{tier.currency} {tier.price}/mo</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">{tier.description}</p>
                {tier.benefits.length > 0 && (
                  <ul className="space-y-1.5 text-sm">
                    {tier.benefits.map((b, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />{b}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-muted-foreground mt-auto">{tier.subscriber_count} subscriber{tier.subscriber_count !== 1 ? "s" : ""}</p>
                <Button
                  className="w-full mt-2"
                  onClick={() => handleSubscribe(tier)}
                  disabled={subscribing === tier.id}
                >
                  {subscribing === tier.id ? "Processing…" : `Subscribe · ${tier.currency} ${tier.price}/mo`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
