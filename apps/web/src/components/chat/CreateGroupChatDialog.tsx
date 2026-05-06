"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { messagesApi, usersApi, mediaApi } from "@jungle/api-client";
import type { PublicUser, Conversation } from "@jungle/api-client";
import {
 Avatar,
 AvatarFallback,
 AvatarImage,
 Badge,
 Button,
 Checkbox,
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 Input,
 ScrollArea,
} from "@jungle/ui";
import { useAuthStore } from "@jungle/hooks";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import {
 ArrowLeft,
 ArrowRight,
 Camera,
 Check,
 Loader2,
 Search,
 Users,
 X,
} from "lucide-react";

interface CreateGroupChatDialogProps {
 open: boolean;
 onClose: () => void;
 /** Called once the group is created successfully. Typically navigates to `/messages/{id}`. */
 onCreated?: (conversation: Conversation) => void;
}

type Step = "members" | "details";

/**
 * Wizard dialog to create a group chat.
 *
 * Step 1: Pick members from the people the current user follows.
 * Step 2: Name the group + optional avatar upload.
 *
 * Plan §3.1 — C7.
 */
export function CreateGroupChatDialog({ open, onClose, onCreated }: CreateGroupChatDialogProps) {
 const { user } = useAuthStore();
 const [step, setStep] = useState<Step>("members");
 const [followList, setFollowList] = useState<PublicUser[]>([]);
 const [loading, setLoading] = useState(false);
 const [selected, setSelected] = useState<Map<number, PublicUser>>(new Map());
 const [query, setQuery] = useState("");
 const [groupName, setGroupName] = useState("");
 const [avatarFile, setAvatarFile] = useState<File | null>(null);
 const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
 const [submitting, setSubmitting] = useState(false);
 const avatarInputRef = useRef<HTMLInputElement>(null);

 // Load contacts each time the dialog opens.
 useEffect(() => {
 if (!open || !user?.username) return;
 setStep("members");
 setSelected(new Map());
 setQuery("");
 setGroupName("");
 setAvatarFile(null);
 setAvatarPreview(null);
 setLoading(true);
 usersApi
 .getFollowing(user.username)
 .then((r) => setFollowList(Array.isArray(r?.data) ? r.data : []))
 .catch(() => toast.error("Failed to load contacts"))
 .finally(() => setLoading(false));
 }, [open, user?.username]);

 // Release the object URL when the component unmounts / avatar changes.
 useEffect(() => {
 return () => {
 if (avatarPreview) URL.revokeObjectURL(avatarPreview);
 };
 }, [avatarPreview]);

 const filteredContacts = useMemo(() => {
 const q = query.trim().toLowerCase();
 if (!q) return followList;
 return followList.filter((u) =>
 `${u.first_name} ${u.last_name} ${u.username}`.toLowerCase().includes(q),
 );
 }, [followList, query]);

 const toggle = (u: PublicUser) => {
 setSelected((prev) => {
 const next = new Map(prev);
 if (next.has(u.id)) {
 next.delete(u.id);
 } else {
 next.set(u.id, u);
 }
 return next;
 });
 };

 const removeSelected = (id: number) => {
 setSelected((prev) => {
 const next = new Map(prev);
 next.delete(id);
 return next;
 });
 };

 const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 if (!file.type.startsWith("image/")) {
 toast.error("Please choose an image file");
 return;
 }
 if (file.size > 5 * 1024 * 1024) {
 toast.error("Image must be under 5 MB");
 return;
 }
 // Revoke previous preview if any.
 if (avatarPreview) URL.revokeObjectURL(avatarPreview);
 setAvatarFile(file);
 setAvatarPreview(URL.createObjectURL(file));
 e.target.value = "";
 };

 const handleNext = () => {
 if (selected.size < 2) {
 toast.error("Select at least 2 people to create a group");
 return;
 }
 setStep("details");
 };

 const handleCreate = async () => {
 const trimmed = groupName.trim();
 if (trimmed.length < 2) {
 toast.error("Group name must be at least 2 characters");
 return;
 }
 if (trimmed.length > 100) {
 toast.error("Group name must be under 100 characters");
 return;
 }

 setSubmitting(true);
 try {
 // Upload avatar first (if any). The backend accepts a URL string.
 let avatarUrl: string | undefined;
 if (avatarFile) {
 const fd = new FormData();
 fd.append("file", avatarFile);
 const uploaded = await mediaApi.uploadMedia(fd);
 avatarUrl = uploaded.url;
 }

 const memberIds = Array.from(selected.keys());
 const created = await messagesApi.createGroupConversation({
 name: trimmed,
 member_ids: memberIds,
 avatar: avatarUrl,
 });

 toast.success(`Group "${trimmed}" created`);
 onCreated?.(created);
 onClose();
 } catch {
 toast.error("Failed to create group");
 } finally {
 setSubmitting(false);
 }
 };

 const selectedArr = Array.from(selected.values());

 return (
 <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
 <DialogContent className="max-w-md">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <Users className="h-4 w-4" />
 {step === "members" ? "New group chat" : "Name the group"}
 </DialogTitle>
 <DialogDescription className="text-xs">
 {step === "members"
 ? "Select at least 2 people from your contacts."
 : `${selected.size} ${selected.size === 1 ? "person" : "people"} added`}
 </DialogDescription>
 </DialogHeader>

 {step === "members" ? (
 <>
 <div className="relative">
 <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
 <Input
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="Search contacts…"
 className="h-8 pl-8 text-sm"
 />
 </div>

 {/* Selected chips */}
 {selectedArr.length > 0 && (
 <div className="flex flex-wrap gap-1 border-b pb-2">
 {selectedArr.map((u) => (
 <Badge key={u.id} variant="secondary" className="gap-1 pr-1">
 {u.first_name} {u.last_name}
 <button
 onClick={() => removeSelected(u.id)}
 className="ml-0.5 rounded-full p-0.5 hover:bg-background"
 aria-label="Remove"
 >
 <X className="h-3 w-3" />
 </button>
 </Badge>
 ))}
 </div>
 )}

 <ScrollArea className="h-64 -mx-6 px-6">
 {loading ? (
 <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
 <Loader2 className="h-4 w-4 animate-spin" /> Loading contacts…
 </div>
 ) : filteredContacts.length === 0 ? (
 <p className="py-8 text-center text-sm text-muted-foreground">
 {query ? "No matches" : "You don't follow anyone yet"}
 </p>
 ) : (
 <ul className="space-y-1">
 {filteredContacts.map((u) => {
 const checked = selected.has(u.id);
 return (
 <li key={u.id}>
 <label
 htmlFor={`member-${u.id}`}
 className={`flex cursor-pointer items-center gap-3 border-2 border-transparent px-2 py-1.5 transition-colors ${
 checked
 ? "border-border bg-secondary/60"
 : "hover:border-foreground hover:bg-secondary/60"
 }`}
 >
 <Checkbox
 id={`member-${u.id}`}
 checked={checked}
 onCheckedChange={() => toggle(u)}
 />
 <Avatar className="h-8 w-8 shrink-0">
 <AvatarImage src={resolveAvatarUrl(u.avatar)} />
 <AvatarFallback>{u.first_name[0]?.toUpperCase() ?? "?"}</AvatarFallback>
 </Avatar>
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-medium">
 {u.first_name} {u.last_name}
 </p>
 <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
 </div>
 </label>
 </li>
 );
 })}
 </ul>
 )}
 </ScrollArea>

 <DialogFooter className="sm:justify-between gap-2">
 <Button variant="ghost" size="sm" onClick={onClose}>
 Cancel
 </Button>
 <Button size="sm" onClick={handleNext} disabled={selected.size < 2}>
 Next
 <ArrowRight className="ml-1 h-3.5 w-3.5" />
 </Button>
 </DialogFooter>
 </>
 ) : (
 <>
 <div className="flex flex-col items-center gap-2 pt-2">
 <button
 type="button"
 onClick={() => avatarInputRef.current?.click()}
 className="relative h-20 w-20 overflow-hidden rounded-full bg-muted/50 transition-colors hover:bg-secondary/70"
 aria-label="Choose group avatar"
 >
 {avatarPreview ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img src={avatarPreview} alt="Group avatar preview" className="h-full w-full object-cover" />
 ) : (
 <span className="flex h-full w-full items-center justify-center">
 <Camera className="h-6 w-6 text-muted-foreground" />
 </span>
 )}
 </button>
 <input
 ref={avatarInputRef}
 type="file"
 accept="image/*"
 className="hidden"
 onChange={handleAvatarPick}
 />
 <p className="text-xs text-muted-foreground">Tap to choose an image (optional)</p>
 </div>

 <div className="space-y-1">
 <label htmlFor="group-name" className="text-xs font-medium">
 Group name
 </label>
 <Input
 id="group-name"
 value={groupName}
 onChange={(e) => setGroupName(e.target.value)}
 placeholder="e.g. Weekend soccer"
 maxLength={100}
 autoFocus
 className="h-9 text-sm"
 />
 <p className="text-[10px] text-muted-foreground">{groupName.length} / 100</p>
 </div>

 {/* Recap of selected members */}
 <div className="border-t pt-2">
 <p className="mb-1 text-xs font-medium text-muted-foreground">Members</p>
 <div className="flex flex-wrap gap-1">
 {selectedArr.slice(0, 8).map((u) => (
 <Badge key={u.id} variant="outline" className="text-[10px]">
 {u.first_name}
 </Badge>
 ))}
 {selectedArr.length > 8 && (
 <Badge variant="outline" className="text-[10px]">
 +{selectedArr.length - 8}
 </Badge>
 )}
 </div>
 </div>

 <DialogFooter className="sm:justify-between gap-2">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => setStep("members")}
 disabled={submitting}
 >
 <ArrowLeft className="mr-1 h-3.5 w-3.5" />
 Back
 </Button>
 <Button size="sm" onClick={handleCreate} disabled={submitting || groupName.trim().length < 2}>
 {submitting ? (
 <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
 ) : (
 <Check className="mr-1 h-3.5 w-3.5" />
 )}
 Create group
 </Button>
 </DialogFooter>
 </>
 )}
 </DialogContent>
 </Dialog>
 );
}
