"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@jungle/ui";
import { api } from "@jungle/api-client";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Users } from "lucide-react";

interface FriendList {
 id: number;
 name: string;
 type: "close_friends" | "restricted" | "custom";
 member_count: number;
 created_at?: string;
}

export default function FriendListsPage() {
 const [lists, setLists] = useState<FriendList[]>([]);
 const [loading, setLoading] = useState(true);
 const [newListName, setNewListName] = useState("");
 const [creating, setCreating] = useState(false);
 const [dialogOpen, setDialogOpen] = useState(false);
 const [deletingId, setDeletingId] = useState<number | null>(null);

 useEffect(() => {
 loadLists();
 }, []);

 async function loadLists() {
 try {
 setLoading(true);
 const result = await api.get<unknown>("/v1/friends/lists");
 const data = result && typeof result === "object" && "data" in (result as Record<string, unknown>)
 ? (result as Record<string, unknown>).data
 : result;
 setLists(Array.isArray(data) ? data as FriendList[] : []);
 } catch {
 setLists([]);
 // If endpoint not available, silently show empty
 } finally {
 setLoading(false);
 }
 }

 async function handleCreateList() {
 const name = newListName.trim();
 if (!name) {
 toast.error("Please enter a list name");
 return;
 }
 setCreating(true);
 try {
 const result = await api.post<unknown>("/v1/friends/lists", { name });
 const newList = result && typeof result === "object" && "id" in (result as Record<string, unknown>)
 ? result as FriendList
 : (result as Record<string, unknown>)?.data as FriendList;
 setLists((prev) => [...prev, { ...newList, type: "custom", member_count: 0 }]);
 setNewListName("");
 setDialogOpen(false);
 toast.success(`List "${name}" created`);
 } catch {
 toast.error("Failed to create list");
 } finally {
 setCreating(false);
 }
 }

 async function handleDeleteList(id: number) {
 setDeletingId(id);
 try {
 await api.delete(`/v1/friends/lists/${id}`);
 setLists((prev) => prev.filter((l) => l.id !== id));
 toast.success("List deleted");
 } catch {
 toast.error("Failed to delete list");
 } finally {
 setDeletingId(null);
 }
 }

 function canDelete(list: FriendList): boolean {
 return list.type === "custom";
 }

 function listTypeBadge(type: FriendList["type"]): string {
 switch (type) {
 case "close_friends": return "Default";
 case "restricted": return "Default";
 default: return "Custom";
 }
 }

 function listTypeVariant(type: FriendList["type"]): "soft-primary" | "soft-warning" | "secondary" {
 switch (type) {
 case "close_friends": return "soft-primary";
 case "restricted": return "soft-warning";
 default: return "secondary";
 }
 }

 if (loading) {
 return (
 <div className="max-w-2xl mx-auto space-y-6 p-4">
 <div className="animate-pulse space-y-4">
 <div className="h-8 w-48 bg-muted rounded" />
 <div className="h-4 w-96 bg-muted rounded" />
 <div className="h-24 bg-muted rounded" />
 <div className="h-24 bg-muted rounded" />
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-2xl mx-auto space-y-6 p-4">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold">Friend Lists</h1>
 <p className="text-muted-foreground">Organize your friends into lists to control who sees your posts.</p>
 </div>
 <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
 <DialogTrigger asChild>
 <Button size="sm">
 <Plus className="h-4 w-4 mr-1" /> Create List
 </Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Create New List</DialogTitle>
 <DialogDescription>Give your friend list a name to get started.</DialogDescription>
 </DialogHeader>
 <div className="space-y-4">
 <div>
 <label className="text-sm font-medium mb-1 block">List Name</label>
 <Input
 placeholder="e.g. College Friends"
 value={newListName}
 onChange={(e) => setNewListName(e.target.value)}
 onKeyDown={(e) => { if (e.key === "Enter") handleCreateList(); }}
 />
 </div>
 <div className="flex justify-end gap-2">
 <DialogClose asChild>
 <Button variant="outline">Cancel</Button>
 </DialogClose>
 <Button onClick={handleCreateList} disabled={creating || !newListName.trim()}>
 {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
 Create
 </Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 </div>

 <Card>
 <CardHeader>
 <CardTitle>Your Lists</CardTitle>
 </CardHeader>
 <CardContent>
 {lists.length === 0 ? (
 <div className="text-center py-8 text-muted-foreground">
 <Users className="h-8 w-8 mx-auto mb-3 opacity-50" />
 <p>No friend lists yet.</p>
 <p className="text-sm mt-1">Create a list to organize your friends.</p>
 </div>
 ) : (
 <div className="space-y-2">
 {lists.map((list) => (
 <div
 key={list.id}
 className="flex items-center justify-between p-3 rounded-lg bg-surface-sunken"
 >
 <div className="flex items-center gap-2 min-w-0">
 <span className="font-medium truncate">{list.name}</span>
 <Badge variant={listTypeVariant(list.type)} className="text-xs shrink-0">
 {listTypeBadge(list.type)}
 </Badge>
 </div>
 <div className="flex items-center gap-3 shrink-0 ml-2">
 <span className="text-sm text-muted-foreground whitespace-nowrap">
 {list.member_count} {list.member_count === 1 ? "friend" : "friends"}
 </span>
 {canDelete(list) && (
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8 text-muted-foreground hover:text-destructive"
 onClick={() => handleDeleteList(list.id)}
 disabled={deletingId === list.id}
 >
 {deletingId === list.id ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 <Trash2 className="h-4 w-4" />
 )}
 </Button>
 )}
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
