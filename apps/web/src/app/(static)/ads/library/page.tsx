"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Button, Badge, Avatar, AvatarImage, AvatarFallback } from "@jungle/ui";
import { api } from "@jungle/api-client";
import { toast } from "sonner";
import { Loader2, Search, Megaphone, ExternalLink } from "lucide-react";

interface AdItem {
 id: number;
 name: string;
 headline: string;
 description: string;
 url: string;
 image: string;
 sponsor: string;
 sponsor_avatar?: string;
 status: string;
 impressions: number;
 clicks: number;
 budget: number;
 spent: number;
 created_at: string;
}

export default function AdLibraryPage() {
 const [ads, setAds] = useState<AdItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [apiExists, setApiExists] = useState<boolean | null>(null);
 const [searchQuery, setSearchQuery] = useState("");

 useEffect(() => {
 loadAds();
 }, []);

 async function loadAds() {
 try {
 setLoading(true);
 const result = await api.get<unknown>("/v1/ads/library");
 const data = result && typeof result === "object" && "data" in (result as Record<string, unknown>)
 ? (result as Record<string, unknown>).data
 : result;
 if (Array.isArray(data)) {
 setAds(data as AdItem[]);
 setApiExists(true);
 } else {
 setAds([]);
 setApiExists(true);
 }
 } catch (e) {
 setApiExists(false);
 setAds([]);
 } finally {
 setLoading(false);
 }
 }

 const filtered = ads.filter((ad) => {
 if (!searchQuery.trim()) return true;
 const q = searchQuery.toLowerCase();
 return (
 ad.name?.toLowerCase().includes(q) ||
 ad.sponsor?.toLowerCase().includes(q) ||
 ad.headline?.toLowerCase().includes(q) ||
 ad.description?.toLowerCase().includes(q)
 );
 });

 if (loading) {
 return (
 <div className="max-w-4xl mx-auto space-y-6 p-4">
 <div className="animate-pulse space-y-4">
 <div className="h-8 w-48 bg-muted rounded" />
 <div className="h-4 w-96 bg-muted rounded" />
 <div className="h-10 bg-muted rounded" />
 <div className="h-48 bg-muted rounded" />
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-4xl mx-auto space-y-6 p-4">
 <h1 className="text-2xl font-bold">Ad Library</h1>
 <p className="text-muted-foreground">Browse all active advertisements on Jungle. Transparency is core to our platform.</p>

 <div className="flex gap-3">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 placeholder="Search advertisers..."
 className="pl-9"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 <Button variant="outline" onClick={() => setSearchQuery("")}>
 Clear
 </Button>
 </div>

 <Card>
 <CardHeader>
 <CardTitle>Active Ads</CardTitle>
 <CardDescription>Advertisements currently running on Jungle.</CardDescription>
 </CardHeader>
 <CardContent>
 {apiExists === false ? (
 <div className="text-center py-8 text-muted-foreground">
 <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-50" />
 <p>Ad Library shows all active advertisements running on Jungle.</p>
 <p className="text-sm mt-1">No ads are currently running.</p>
 </div>
 ) : filtered.length === 0 ? (
 <div className="text-center py-8 text-muted-foreground">
 <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-50" />
 <p>{searchQuery ? "No ads match your search." : "No active ads to display."}</p>
 <p className="text-sm mt-1">
 {searchQuery
 ? "Try a different search term."
 : "This library will show all active advertisements once campaigns are launched."}
 </p>
 </div>
 ) : (
 <div className="space-y-4">
 {filtered.map((ad) => (
 <div key={ad.id} className="flex gap-4 p-4 rounded-lg transition-shadow">
 {ad.image && (
 <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
 <Image src={ad.image} alt={ad.headline || ad.name} fill unoptimized className="object-cover" />
 </div>
 )}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 {ad.sponsor_avatar && (
 <Avatar className="h-5 w-5">
 <AvatarImage src={ad.sponsor_avatar} alt={ad.sponsor} />
 <AvatarFallback>{ad.sponsor?.charAt(0) ?? "A"}</AvatarFallback>
 </Avatar>
 )}
 <span className="text-xs font-medium text-muted-foreground">{ad.sponsor}</span>
 <Badge variant="soft-success" className="text-[10px]">Active</Badge>
 </div>
 <h3 className="font-semibold text-sm leading-tight">{ad.headline || ad.name}</h3>
 {ad.description && (
 <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ad.description}</p>
 )}
 {ad.url && (
 <a
 href={ad.url}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
 >
 Learn more <ExternalLink className="h-3 w-3" />
 </a>
 )}
 </div>
 <div className="shrink-0 text-right text-xs text-muted-foreground">
 <div>{ad.impressions?.toLocaleString() ?? 0} impressions</div>
 <div>{ad.clicks?.toLocaleString() ?? 0} clicks</div>
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 );
}
