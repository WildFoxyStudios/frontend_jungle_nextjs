"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge } from "@jungle/ui";
import { api, usersApi } from "@jungle/api-client";
import { toast } from "sonner";
import { Loader2, Download, Eye, ArrowLeft } from "lucide-react";

interface CategoryData {
 name: string;
 description: string;
 apiKey: string;
}

const CATEGORIES: CategoryData[] = [
 { name: "Posts", description: "Posts you've created and shared", apiKey: "posts" },
 { name: "Messages", description: "Your conversation history", apiKey: "messages" },
 { name: "Photos and Videos", description: "Media you've uploaded", apiKey: "media" },
 { name: "Friends and Followers", description: "Your connections", apiKey: "friends" },
 { name: "Comments and Reactions", description: "Your engagement activity", apiKey: "comments" },
 { name: "Profile Information", description: "Your bio, work, education", apiKey: "profile" },
 { name: "Login and Security", description: "Login history and devices", apiKey: "login" },
];

const ENDPOINT_MAP: Record<string, string> = {
 posts: "/v1/users/me/posts",
 messages: "/v1/users/me/messages",
 media: "/v1/users/me/media",
 friends: "/v1/users/me/friends",
 comments: "/v1/users/me/comments",
 profile: "/v1/users/me",
 login: "/v1/users/me/sessions",
};


function renderValue(value: unknown) {
  if (value === null || value === undefined) return React.createElement("span", { className: "italic text-muted-foreground" }, "—");
  if (typeof value === "boolean") return React.createElement(Badge, { variant: "outline" }, value ? "true" : "false");
  if (typeof value === "number") return React.createElement("span", { className: "font-mono text-xs" }, value.toLocaleString());
  if (typeof value === "string") {
    if (value.length > 300) return React.createElement("span", { className: "text-xs" }, value.slice(0, 300) + "…");
    return React.createElement("span", null, value);
  }
  if (Array.isArray(value) && value.length === 0) return React.createElement("span", { className: "italic text-muted-foreground" }, "empty");
  if (Array.isArray(value)) {
    return React.createElement("details", { className: "text-xs" },
      React.createElement("summary", { className: "cursor-pointer text-muted-foreground hover:text-foreground" }, value.length + " items"),
      React.createElement("pre", { className: "mt-1 whitespace-pre-wrap break-words max-h-24 overflow-y-auto bg-muted/50 p-2" }, JSON.stringify(value, null, 2))
    );
  }
  if (typeof value === "object") {
    const objEntries = Object.entries(value);
    if (objEntries.length === 0) return React.createElement("span", { className: "italic text-muted-foreground" }, "empty object");
    return React.createElement("details", { className: "text-xs" },
      React.createElement("summary", { className: "cursor-pointer text-muted-foreground hover:text-foreground" }, "Object (" + objEntries.length + " keys)"),
      React.createElement("pre", { className: "mt-1 whitespace-pre-wrap break-words max-h-24 overflow-y-auto bg-muted/50 p-2" }, JSON.stringify(value, null, 2))
    );
  }
  return React.createElement("span", null, String(value));
}

function DataItemCard({ item, index }: { item: unknown; index: number }) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return React.createElement("div", { className: "p-3 rounded-lg border text-sm" }, renderValue(item));
  }
  const entries = Object.entries(item);
  return React.createElement("div", { className: "p-3 rounded-lg border text-sm space-y-1" },
    React.createElement("dl", { className: "space-y-1.5" },
      entries.slice(0, 30).map(function([key, value]) {
        return React.createElement("div", { key: key, className: "flex gap-2 items-baseline" },
          React.createElement("dt", { className: "font-medium text-xs text-muted-foreground shrink-0 min-w-[100px] max-w-[140px] truncate" }, key.replace(/_/g, " ")),
          React.createElement("dd", { className: "break-words min-w-0 text-xs" }, renderValue(value))
        );
      })
    ),
    entries.length > 30 ? React.createElement("p", { className: "text-xs text-muted-foreground pt-1" }, "+ " + (entries.length - 30) + " more fields...") : null
  );
}

function CategoryViewDialog({ category, open, onOpenChange }: { category: CategoryData | null; open: boolean; onOpenChange: (open: boolean) => void }) {
 const [data, setData] = useState<unknown>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const loadData = useCallback(async () => {
 if (!category) return;
 try {
 setLoading(true);
 setError(null);
 const endpoint = ENDPOINT_MAP[category.apiKey];
 if (category.apiKey === "profile") {
 const me = await usersApi.getMe();
 setData(me);
 } else {
 const result = await api.get<unknown>(endpoint);
 const unwrapped = result && typeof result === "object" && "data" in (result as Record<string, unknown>)
 ? (result as Record<string, unknown>).data
 : result;
 setData(unwrapped);
 }
 } catch (e) {
 setError("Failed to load data. The endpoint may not be available yet.");
 setData(null);
 } finally {
 setLoading(false);
 }
 }, [category]);

 const handleClose = () => {
 onOpenChange(false);
 setData(null);
 setError(null);
 };

 if (!category) return null;

 return (
 <Dialog open={open} onOpenChange={(open) => { if (!open) handleClose(); }}>
 <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>{category.name}</DialogTitle>
 <DialogDescription>{category.description}</DialogDescription>
 </DialogHeader>
 <div className="mt-2">
 {loading ? (
 <div className="flex items-center justify-center py-12">
 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
 </div>
 ) : error ? (
 <div className="text-center py-8 text-muted-foreground">
 <p>{error}</p>
 <Button variant="outline" size="sm" className="mt-3" onClick={loadData}>
 Retry
 </Button>
 </div>
 ) : data === null ? (
 <div className="text-center py-8">
 <p className="text-muted-foreground mb-4">Click below to load your {category.name.toLowerCase()} data.</p>
 <Button onClick={loadData}>
 <Eye className="h-4 w-4 mr-1" /> Load Data
 </Button>
 </div>
 ) : (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <Badge variant="soft-primary">
 {Array.isArray(data) ? `${data.length} items` : "Loaded"}
 </Badge>
 <Button variant="outline" size="sm" onClick={() => setData(null)}>
 <ArrowLeft className="h-4 w-4 mr-1" /> Back
 </Button>
 </div>
 {Array.isArray(data) && data.length > 0 ? (
 <div className="space-y-2">
 {data.slice(0, 50).map((item, i) =>
 React.createElement(DataItemCard, { key: (item && typeof item === "object" && "id" in item) ? String(item.id) : String(i), item, index: i })
 )}
 {data.length > 50 && (
 <p className="text-xs text-muted-foreground text-center">
 Showing 50 of {data.length} items
 </p>
 )}
 </div>
 ) : Array.isArray(data) && data.length === 0 ? (
 <div className="text-center py-8 text-muted-foreground">
 <p>No data available in this category.</p>
 </div>
 ) : (
 React.createElement(DataItemCard, { item: data, index: 0 })
 )}
 </div>
 )}
 </div>
 </DialogContent>
 </Dialog>
 );
}

export default function YourInformationPage() {
 const [activeCategory, setActiveCategory] = useState<CategoryData | null>(null);
 const [dialogOpen, setDialogOpen] = useState(false);
 const [downloading, setDownloading] = useState(false);

 function openCategory(cat: CategoryData) {
 setActiveCategory(cat);
 setDialogOpen(true);
 }

 async function handleDownload() {
 setDownloading(true);
 try {
 const res = await usersApi.downloadMyInfo([
 "my_information", "posts", "pages", "groups",
 "followers", "following", "friends", "messages",
 "comments", "media", "sessions",
 ]);
 const payload = res && typeof res === "object" && "data" in (res as Record<string, unknown>)
 ? (res as Record<string, unknown>).data
 : res;
 const dataStr = JSON.stringify(payload ?? res, null, 2);
 const dataBlob = new Blob([dataStr], { type: "application/json" });
 const url = URL.createObjectURL(dataBlob);
 const link = document.createElement("a");
 link.href = url;
 link.download = `jungle-data-export-${new Date().toISOString().split("T")[0]}.json`;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 URL.revokeObjectURL(url);
 toast.success("Data export downloaded successfully");
 } catch {
 toast.error("Failed to download data");
 } finally {
 setDownloading(false);
 }
 }

 return (
 <div className="max-w-2xl mx-auto space-y-6 p-4">
 <h1 className="text-2xl font-bold">Access Your Information</h1>
 <p className="text-muted-foreground">View and download your data on Jungle. Select a category to see your information.</p>

 <div className="space-y-3">
 {CATEGORIES.map((cat) => (
 <Card key={cat.apiKey} variant="flat" className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openCategory(cat)}>
 <CardContent className="flex items-center justify-between p-4">
 <div>
 <h3 className="font-semibold">{cat.name}</h3>
 <p className="text-sm text-muted-foreground">{cat.description}</p>
 </div>
 <Button variant="outline" size="sm">
 <Eye className="h-4 w-4 mr-1" /> View
 </Button>
 </CardContent>
 </Card>
 ))}
 </div>

 <CategoryViewDialog
 category={activeCategory}
 open={dialogOpen}
 onOpenChange={setDialogOpen}
 />

 <Card>
 <CardHeader>
 <CardTitle>Download Your Information</CardTitle>
 <CardDescription>Request a complete copy of your data as a JSON file.</CardDescription>
 </CardHeader>
 <CardContent>
 <Button onClick={handleDownload} disabled={downloading}>
 {downloading ? (
 <Loader2 className="h-4 w-4 animate-spin mr-1" />
 ) : (
 <Download className="h-4 w-4 mr-1" />
 )}
 Request Download
 </Button>
 </CardContent>
 </Card>
 </div>
 );
}
