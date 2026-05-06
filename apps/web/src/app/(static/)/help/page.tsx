import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input } from "@jungle/ui";
import Link from "next/link";
import { Search } from "lucide-react";

export const metadata: Metadata = {
 title: "Help Center — Jungle",
 description: "Find answers and get support.",
};

const CATEGORIES = [
 { title: "Account Settings", description: "Manage your profile, privacy, and security.", slug: "account" },
 { title: "Privacy & Safety", description: "Control who sees your content and stay safe.", slug: "privacy" },
 { title: "Messaging", description: "Send messages, make calls, and manage conversations.", slug: "messaging" },
 { title: "Groups & Pages", description: "Create and manage communities.", slug: "groups" },
 { title: "Marketplace", description: "Buy and sell on Jungle.", slug: "marketplace" },
 { title: "Payments", description: "Wallet, subscriptions, and transactions.", slug: "payments" },
 { title: "Reporting", description: "Report content and appeal decisions.", slug: "reporting" },
];

export default function HelpCenterPage() {
 return (
 <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
 <div className="text-center space-y-4">
 <h1 className="text-3xl font-bold">Help Center</h1>
 <p className="text-muted-foreground text-lg max-w-xl mx-auto">
 Find answers, learn how to use Jungle, and get support when you need it.
 </p>
 <div className="relative max-w-md mx-auto">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input placeholder="Search help articles..." className="pl-10" />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {CATEGORIES.map((cat) => (
 <Link key={cat.slug} href={`/help/${cat.slug}`} className="no-underline">
 <Card variant="flat" interactive className="h-full">
 <CardHeader>
 <CardTitle className="text-lg">{cat.title}</CardTitle>
 <CardDescription>{cat.description}</CardDescription>
 </CardHeader>
 </Card>
 </Link>
 ))}
 </div>

 <div className="text-center pt-8 border-t border-border">
 <p className="text-sm text-muted-foreground">
 Can&apos;t find what you need?{" "}
 <Link href="/contact" className="text-primary hover:underline">Contact Support</Link>
 </p>
 </div>
 </div>
 );
}
