"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose, Textarea } from "@jungle/ui";
import { api } from "@jungle/api-client";
import { toast } from "sonner";
import { MessageSquarePlus, Loader2 } from "lucide-react";

interface Appeal {
 id: number;
 subject: string;
 content: string;
 status: "pending" | "approved" | "rejected";
 created_at: string;
 updated_at?: string;
 moderator_note?: string;
}

export default function SupportInboxPage() {
 const [appeals, setAppeals] = useState<Appeal[]>([]);
 const [loading, setLoading] = useState(true);
 const [newSubject, setNewSubject] = useState("");
 const [newContent, setNewContent] = useState("");
 const [submitting, setSubmitting] = useState(false);
 const [dialogOpen, setDialogOpen] = useState(false);

 useEffect(() => {
 loadAppeals();
 }, []);

 async function loadAppeals() {
 try {
 setLoading(true);
 const result = await api.get<unknown>("/v1/moderation/appeals");
 const list = Array.isArray(result)
 ? (result as Appeal[])
 : Array.isArray((result as Record<string, unknown>)?.data)
 ? (result as Record<string, unknown>).data as Appeal[]
 : [];
 setAppeals(list);
 } catch {
 setAppeals([]);
 } finally {
 setLoading(false);
 }
 }

 async function handleCreateAppeal() {
 if (!newSubject.trim() || !newContent.trim()) {
 toast.error("Please fill in both subject and description");
 return;
 }
 setSubmitting(true);
 try {
 const result = await api.post<Appeal>("/v1/moderation/appeals", {
 subject: newSubject.trim(),
 content: newContent.trim(),
 });
 const appeal = result && typeof result === "object" && "id" in result
 ? result as Appeal
 : (result as Record<string, unknown>)?.data as Appeal;
 setAppeals((prev) => [appeal, ...prev]);
 setNewSubject("");
 setNewContent("");
 setDialogOpen(false);
 toast.success("Appeal submitted successfully");
 } catch {
 toast.error("Failed to submit appeal");
 } finally {
 setSubmitting(false);
 }
 }

 const statusVariant = (status: string): "success" | "warning" | "destructive" | "default" => {
 switch (status) {
 case "approved": return "success";
 case "rejected": return "destructive";
 case "pending": return "warning";
 default: return "default";
 }
 };

 if (loading) {
 return (
 <div className="max-w-2xl mx-auto space-y-6 p-4">
 <div className="animate-pulse space-y-4">
 <div className="h-8 w-48 bg-muted rounded" />
 <div className="h-4 w-96 bg-muted rounded" />
 <div className="h-32 bg-muted rounded" />
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-2xl mx-auto space-y-6 p-4">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold">Support Inbox</h1>
 <p className="text-muted-foreground">View moderation decisions, appeals, and account notices.</p>
 </div>
 <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
 <DialogTrigger asChild>
 <Button size="sm">
 <MessageSquarePlus className="h-4 w-4 mr-1" /> Create Appeal
 </Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Submit an Appeal</DialogTitle>
 <DialogDescription>
 If you believe a moderation decision was made in error, describe your case below.
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4">
 <div>
 <label className="text-sm font-medium mb-1 block">Subject</label>
 <input
 className="flex h-10 w-full rounded-sm border bg-input px-3 py-2 text-sm"
 placeholder="e.g. Post removal appeal"
 value={newSubject}
 onChange={(e) => setNewSubject(e.target.value)}
 />
 </div>
 <div>
 <label className="text-sm font-medium mb-1 block">Description</label>
 <Textarea
 placeholder="Explain why you believe this should be reconsidered..."
 value={newContent}
 onChange={(e) => setNewContent(e.target.value)}
 rows={5}
 />
 </div>
 <div className="flex justify-end gap-2">
 <DialogClose asChild>
 <Button variant="outline">Cancel</Button>
 </DialogClose>
 <Button onClick={handleCreateAppeal} disabled={submitting}>
 {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
 Submit Appeal
 </Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 </div>

 <Card>
 <CardHeader>
 <CardTitle>Your Appeals</CardTitle>
 <CardDescription>Track the status of your moderation appeals.</CardDescription>
 </CardHeader>
 <CardContent>
 {appeals.length === 0 ? (
 <div className="text-center py-8 text-muted-foreground">
 <p>No appeals yet.</p>
 <p className="text-sm mt-1">If you have moderated content, click &ldquo;Create Appeal&rdquo; to submit a request for review.</p>
 </div>
 ) : (
 <div className="space-y-3">
 {appeals.map((appeal) => (
 <div key={appeal.id} className="p-4 rounded-lg">
 <div className="flex items-start justify-between mb-2">
 <div>
 <h3 className="font-semibold">{appeal.subject}</h3>
 <p className="text-xs text-muted-foreground">
 {new Date(appeal.created_at).toLocaleDateString(undefined, {
 year: "numeric", month: "long", day: "numeric",
 })}
 </p>
 </div>
 <Badge variant={statusVariant(appeal.status)}>
 {appeal.status.charAt(0).toUpperCase() + appeal.status.slice(1)}
 </Badge>
 </div>
 <p className="text-sm text-muted-foreground">{appeal.content}</p>
 {appeal.moderator_note && (
 <div className="mt-2 p-3 rounded bg-muted text-sm">
 <span className="font-medium">Moderator note: </span>
 {appeal.moderator_note}
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 );
}
