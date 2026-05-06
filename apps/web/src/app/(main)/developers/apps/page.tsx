"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { contentApi } from "@jungle/api-client";
import type { OAuthApp } from "@jungle/api-client";
import { Button, Card, CardContent, Skeleton, Badge } from "@jungle/ui";
import { toast } from "sonner";
import { Code, Globe, Shield, ExternalLink, Plus, Box } from "lucide-react";

export default function DeveloperAppsPage() {
 const [apps, setApps] = useState<OAuthApp[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 contentApi.getDeveloperApps()
 .then(setApps)
 .catch(() => toast.error("Failed to load apps"))
 .finally(() => setLoading(false));
 }, []);

 return (
 <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
 <div className="flex items-center justify-between">
 <div className="space-y-1">
 <h1 className="text-3xl font-bold flex items-center gap-3">
 <Box className="h-8 w-8 text-primary" /> Developer Apps
 </h1>
 <p className="text-muted-foreground">Manage your OAuth2 applications and API integrations.</p>
 </div>
 <Button asChild className="gap-2">
 <Link href="/developers/apps/create">
 <Plus className="h-4 w-4" /> Create App
 </Link>
 </Button>
 </div>

 {loading ? (
 <div className="grid gap-4">
 {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
 </div>
 ) : (
 <div className="grid gap-4">
 {apps.map((app) => (
 <Card
 key={app.id}
 className="group overflow-hidden border-l-4 border-l-primary transition hover:bg-muted/50"
 >
 <CardContent className="p-6">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="flex items-start gap-4 flex-1">
 <div className="flex h-12 w-12 items-center justify-center bg-muted/40 text-primary transition-colors group-hover:bg-primary/10">
 <Code className="h-6 w-6" />
 </div>
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <p className="font-semibold text-lg">{app.name}</p>
 <Badge variant="outline" className="text-[10px] h-4 bg-green-50 text-green-700 border-green-200">Active</Badge>
 </div>
 <p className="text-sm text-muted-foreground line-clamp-1">{app.description || "No description provided."}</p>
 <div className="flex items-center gap-4 pt-1">
 <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
 <Shield className="h-3 w-3" /> Client ID:{" "}
 <span className="border bg-muted px-1 font-mono text-foreground">
 {app.client_id}
 </span>
 </div>
 {app.website && (
 <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
 <Globe className="h-3 w-3" /> {app.website}
 </div>
 )}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <Button variant="ghost" size="sm" asChild className="gap-2">
 <Link href={`/developers/apps/${app.id}`}>
 Manage <ExternalLink className="h-3.5 w-3.5" />
 </Link>
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 {apps.length === 0 && (
 <div className="border border-dashed bg-card py-20 text-center">
 <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
 <p className="text-muted-foreground italic font-medium">No applications found. Create your first one to get started.</p>
 </div>
 )}
 </div>
 )}
 </div>

 );
}
