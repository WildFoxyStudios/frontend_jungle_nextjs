import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@jungle/ui";

export const metadata: Metadata = {
 title: "Subprocessors — Jungle",
 description: "List of third-party subprocessors used by Jungle.",
};

const SUBPROCESSORS = [
 { name: "Neon", purpose: "PostgreSQL database hosting", country: "Germany (Frankfurt)" },
 { name: "Upstash", purpose: "Redis cache and session storage", country: "Global" },
 { name: "Cloudflare", purpose: "CDN, media storage (R2), DDoS protection, Turnstile CAPTCHA", country: "Global" },
 { name: "Brevo", purpose: "Transactional email delivery (SMTP)", country: "France" },
 { name: "Stripe", purpose: "Payment processing", country: "United States" },
 { name: "OpenAI", purpose: "Content moderation and AI features", country: "United States" },
 { name: "Sentry", purpose: "Error monitoring and crash reporting", country: "United States" },
 { name: "Axiom", purpose: "Log aggregation and observability", country: "United States" },
];

export default function SubprocessorsPage() {
 return (
 <div className="max-w-3xl mx-auto py-12 px-4 prose dark:prose-invert">
 <h1>Subprocessors</h1>
 <p>Last updated: April 2026</p>

 <p>
 Jungle uses the following third-party subprocessors to provide our services.
 All subprocessors are contractually bound to handle data in compliance with our Data Processing Agreement.
 </p>

 <div className="grid gap-4 not-prose">
 {SUBPROCESSORS.map((sp) => (
 <Card key={sp.name} variant="flat">
 <CardContent className="p-4">
 <h3 className="font-semibold">{sp.name}</h3>
 <p className="text-sm text-muted-foreground">{sp.purpose}</p>
 <p className="text-xs text-muted-foreground mt-1">Data location: {sp.country}</p>
 </CardContent>
 </Card>
 ))}
 </div>

 <h2>Updates</h2>
 <p>
 We will update this page if we add or change any subprocessors.
 Subscribe to this page or check back regularly.
 </p>
 </div>
 );
}
