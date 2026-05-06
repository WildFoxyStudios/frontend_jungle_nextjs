"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { storiesApi } from "@jungle/api-client";
import type { Story, StoryHighlight, StoryHighlightItem } from "@jungle/api-client";
import {
 Button,
 Card,
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 Input,
 Skeleton,
} from "@jungle/ui";
import {
 Plus, Bookmark, Check, Trash2, Eye, Pencil, Image as ImageIcon, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAdvancedMediaUpload } from "@/hooks/use-advanced-media-upload";

export default function HighlightsPage() {
 const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
 const [myStories, setMyStories] = useState<Story[]>([]);
 const [loading, setLoading] = useState(true);
 const [isCreating, setIsCreating] = useState(false);
 const [newHighlightName, setNewHighlightName] = useState("");
 const [selectedStories, setSelectedStories] = useState<number[]>([]);
 const [activeHighlight, setActiveHighlight] = useState<StoryHighlight | null>(null);
 const [highlightItems, setHighlightItems] = useState<StoryHighlightItem[]>([]);
 const [loadingDetail, setLoadingDetail] = useState(false);
 const [savingDetail, setSavingDetail] = useState(false);
 const [editingTitle, setEditingTitle] = useState("");
 const [selectedStoriesToAdd, setSelectedStoriesToAdd] = useState<number[]>([]);

 // Plan §3.3 S4 — cover uploader for the active highlight. We piggyback
 // on the regular media-upload hook so client-side compression + progress
 // bars match the rest of the app.
 const [creatingCoverFile, setCreatingCoverFile] = useState<File | null>(null);
 const [creatingCoverPreview, setCreatingCoverPreview] = useState<string | null>(null);
 const createCoverInputRef = useRef<HTMLInputElement>(null);
 const editCoverInputRef = useRef<HTMLInputElement>(null);
 const [uploadingCover, setUploadingCover] = useState(false);
 const coverUploader = useAdvancedMediaUpload();

 const loadData = useCallback(async () => {
 setLoading(true);
 try {
 const [hRes, sRes] = await Promise.all([
 storiesApi.getMyHighlights(),
 storiesApi.getMyStories(),
 ]);
 setHighlights(hRes.data ?? []);
 setMyStories(sRes ?? []);
 } catch {
 toast.error("Failed to load highlights");
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 void loadData();
 }, [loadData]);

 const loadHighlightDetail = useCallback(async (highlight: StoryHighlight) => {
 setActiveHighlight(highlight);
 setEditingTitle(highlight.title);
 setSelectedStoriesToAdd([]);
 setLoadingDetail(true);

 try {
 const detail = await storiesApi.getHighlight(highlight.id);
 setHighlightItems(detail.items ?? []);
 } catch {
 toast.error("Failed to load highlight");
 setActiveHighlight(null);
 setHighlightItems([]);
 } finally {
 setLoadingDetail(false);
 }
 }, []);

 /**
 * Plan §3.3 S4 — local preview for the cover uploader before the create
 * dialog submits. We don't hit the network here: the file is uploaded
 * in `handleCreateHighlight` so a cancelled dialog doesn't leak assets.
 */
 const handlePickCreateCover = (file: File | null) => {
 // Revoke the previous object URL to avoid leaks while previewing.
 if (creatingCoverPreview) URL.revokeObjectURL(creatingCoverPreview);
 if (!file) {
 setCreatingCoverFile(null);
 setCreatingCoverPreview(null);
 return;
 }
 setCreatingCoverFile(file);
 setCreatingCoverPreview(URL.createObjectURL(file));
 };

 const handleCreateHighlight = async () => {
 if (!newHighlightName.trim() || selectedStories.length === 0) {
 toast.error("Please provide a name and select at least one story");
 return;
 }
 try {
 // Upload the optional custom cover first so the highlight is created
 // with its final look in a single round-trip.
 let coverUrl: string | undefined;
 if (creatingCoverFile) {
 setUploadingCover(true);
 try {
 const media = await coverUploader.uploadProcessedMedia(creatingCoverFile, {
 imageOptions: { maxWidth: 720, maxSizeMB: 1 },
 });
 if (!media?.url) throw new Error("Cover upload failed");
 coverUrl = media.url;
 } finally {
 setUploadingCover(false);
 }
 }

 await storiesApi.createHighlight({
 title: newHighlightName,
 story_media_ids: selectedStories,
 ...(coverUrl ? { cover_url: coverUrl } : {}),
 });
 toast.success("Highlight created");
 setIsCreating(false);
 setNewHighlightName("");
 setSelectedStories([]);
 handlePickCreateCover(null);
 loadData();
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to create highlight");
 }
 };

 /**
 * Plan §3.3 S4 — upload + persist a new cover on the active highlight.
 * The old cover is replaced server-side when we PUT a new URL.
 */
 const handleUploadExistingCover = async (file: File) => {
 if (!activeHighlight) return;
 setUploadingCover(true);
 try {
 const media = await coverUploader.uploadProcessedMedia(file, {
 imageOptions: { maxWidth: 720, maxSizeMB: 1 },
 });
 if (!media?.url) throw new Error("Cover upload failed");

 const updated = await storiesApi.updateHighlight(activeHighlight.id, {
 cover_url: media.url,
 });
 setActiveHighlight(updated);
 setHighlights((prev) =>
 prev.map((h) => (h.id === updated.id ? updated : h)),
 );
 toast.success("Cover updated");
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to update cover");
 } finally {
 setUploadingCover(false);
 }
 };

 const toggleStorySelection = (storyId: number) => {
 setSelectedStories((prev) =>
 prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
 );
 };

 const toggleStoryAddition = (storyId: number) => {
 setSelectedStoriesToAdd((prev) =>
 prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
 );
 };

 const currentHighlightStoryIds = new Set(highlightItems.map((item) => item.story_media_id));
 const availableStoriesToAdd = myStories.filter((story) => !currentHighlightStoryIds.has(story.story_media_id));

 const handleRenameHighlight = async () => {
 if (!activeHighlight || !editingTitle.trim() || editingTitle.trim() === activeHighlight.title) {
 return;
 }

 setSavingDetail(true);
 try {
 const updated = await storiesApi.updateHighlight(activeHighlight.id, { title: editingTitle.trim() });
 setActiveHighlight(updated);
 setHighlights((prev) => prev.map((item) => (item.id === updated.id ? { ...item, title: updated.title } : item)));
 toast.success("Highlight updated");
 } catch {
 toast.error("Failed to update highlight");
 } finally {
 setSavingDetail(false);
 }
 };

 const handleDeleteHighlight = async () => {
 if (!activeHighlight) return;

 setSavingDetail(true);
 try {
 await storiesApi.deleteHighlight(activeHighlight.id);
 setHighlights((prev) => prev.filter((item) => item.id !== activeHighlight.id));
 setActiveHighlight(null);
 setHighlightItems([]);
 toast.success("Highlight deleted");
 } catch {
 toast.error("Failed to delete highlight");
 } finally {
 setSavingDetail(false);
 }
 };

 const handleAddStories = async () => {
 if (!activeHighlight || selectedStoriesToAdd.length === 0) return;

 setSavingDetail(true);
 try {
 await storiesApi.addStoriesToHighlight(activeHighlight.id, selectedStoriesToAdd);
 const detail = await storiesApi.getHighlight(activeHighlight.id);
 setHighlightItems(detail.items ?? []);
 setHighlights((prev) =>
 prev.map((item) =>
 item.id === activeHighlight.id
 ? { ...item, item_count: detail.items.length, updated_at: new Date().toISOString() }
 : item,
 ),
 );
 setSelectedStoriesToAdd([]);
 toast.success("Stories added to highlight");
 } catch {
 toast.error("Failed to add stories");
 } finally {
 setSavingDetail(false);
 }
 };

 const handleRemoveStory = async (storyMediaId: number) => {
 if (!activeHighlight) return;

 setSavingDetail(true);
 try {
 await storiesApi.removeStoryFromHighlight(activeHighlight.id, storyMediaId);
 const nextItems = highlightItems.filter((item) => item.story_media_id !== storyMediaId);
 setHighlightItems(nextItems);
 setHighlights((prev) =>
 prev.map((item) =>
 item.id === activeHighlight.id
 ? { ...item, item_count: Math.max(0, nextItems.length) }
 : item,
 ),
 );
 toast.success("Story removed from highlight");
 } catch {
 toast.error("Failed to remove story");
 } finally {
 setSavingDetail(false);
 }
 };

 if (loading) {
 return (
 <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
 <Skeleton className="h-8 w-48" />
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {Array.from({ length: 4 }).map((_, i) => (
 <Skeleton key={i} className="h-48 w-full" />
 ))}
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold sm:text-[28px]">Story Highlights</h1>
 <p className="text-muted-foreground">Save your favorite stories to your profile</p>
 </div>
 <Button onClick={() => setIsCreating(true)}>
 <Plus className="h-4 w-4 mr-1" /> New Highlight
 </Button>
 </div>

 {/* Highlights Grid */}
 {highlights.length === 0 ? (
 <div className="py-16 text-center">
 <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
 <p className="font-medium text-muted-foreground">No highlights yet.</p>
 <p className="text-sm text-muted-foreground mt-1">
 Create highlights to showcase your best stories on your profile.
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {highlights.map((highlight) => (
 <Card
 key={highlight.id}
 className="cursor-pointer overflow-hidden transition hover:bg-muted/50"
 onClick={() => void loadHighlightDetail(highlight)}
 >
 <div className="aspect-square bg-muted relative">
 {highlight.cover_url ? (
 <Image
 src={highlight.cover_url}
 alt={highlight.title}
 fill
 unoptimized
 className="object-cover"
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
 <Bookmark className="h-8 w-8 text-primary/50" />
 </div>
 )}
 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
 <div className="absolute bottom-0 left-0 right-0 p-3">
 <p className="font-semibold text-white text-sm">{highlight.title}</p>
 <p className="text-white/70 text-[13px] font-medium">{highlight.item_count} stories</p>
 </div>
 </div>
 </Card>
 ))}
 </div>
 )}

 {/* Create Highlight Dialog */}
 <Dialog open={isCreating} onOpenChange={setIsCreating}>
 <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>Create New Highlight</DialogTitle>
 </DialogHeader>
 <div className="space-y-4">
 <div>
 <label className="text-sm font-medium">Highlight Name</label>
 <Input
 value={newHighlightName}
 onChange={(e) => setNewHighlightName(e.target.value)}
 placeholder="e.g., Travel, Food, Memories"
 className="mt-1"
 />
 </div>

 {/* Plan §3.3 S4 — optional custom cover. */}
 <div>
 <label className="text-sm font-medium">Cover image (optional)</label>
 <div className="mt-1 flex items-center gap-3">
 <button
 type="button"
 onClick={() => createCoverInputRef.current?.click()}
 className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-dashed bg-secondary/40 hover:bg-secondary/60"
 >
 {creatingCoverPreview ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={creatingCoverPreview}
 alt=""
 className="absolute inset-0 h-full w-full object-cover"
 />
 ) : (
 <ImageIcon className="h-6 w-6 text-muted-foreground" />
 )}
 </button>
 <div className="flex flex-col gap-1 text-xs text-muted-foreground">
 <span>Square image recommended · JPG/PNG/WebP · up to 1 MB</span>
 {creatingCoverFile && (
 <button
 type="button"
 onClick={() => handlePickCreateCover(null)}
 className="text-destructive hover:underline self-start"
 >
 Remove cover
 </button>
 )}
 </div>
 <input
 ref={createCoverInputRef}
 type="file"
 accept="image/*"
 className="hidden"
 onChange={(e) =>
 handlePickCreateCover(e.target.files?.[0] ?? null)
 }
 />
 </div>
 </div>

 <div>
 <label className="text-sm font-medium">Select Stories ({selectedStories.length} selected)</label>
 {myStories.length === 0 ? (
 <p className="text-muted-foreground text-sm py-4">No active stories available.</p>
 ) : (
 <div className="grid grid-cols-3 gap-2 mt-2">
 {myStories.map((story) => {
 const isSelected = selectedStories.includes(story.story_media_id);
 const mediaType = story.media?.type ?? "image";
 const mediaUrl = story.media?.url ?? "";
 return (
 <button
 key={story.story_media_id}
 onClick={() => toggleStorySelection(story.story_media_id)}
 className={`relative aspect-[9/16] overflow-hidden border ${
 isSelected ? "ring-2 ring-primary" : ""
 }`}
 >
 {mediaType === "video" ? (
 <video src={mediaUrl} className="w-full h-full object-cover" />
 ) : (
 <Image
 src={mediaUrl}
 alt=""
 fill
 unoptimized
 className="object-cover"
 />
 )}
 {isSelected && (
 <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 border">
 <Check className="h-3 w-3" />
 </div>
 )}
 </button>
 );
 })}
 </div>
 )}
 </div>

 <div className="flex gap-2 pt-4">
 <Button
 variant="outline"
 onClick={() => {
 setIsCreating(false);
 handlePickCreateCover(null);
 }}
 className="flex-1"
 >
 Cancel
 </Button>
 <Button
 onClick={handleCreateHighlight}
 disabled={
 !newHighlightName.trim() ||
 selectedStories.length === 0 ||
 uploadingCover
 }
 className="flex-1 gap-2"
 >
 {uploadingCover && <Loader2 className="h-4 w-4 animate-spin" />}
 {uploadingCover ? "Uploading…" : "Create Highlight"}
 </Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>

 <Dialog
 open={Boolean(activeHighlight)}
 onOpenChange={(open) => {
 if (!open) {
 setActiveHighlight(null);
 setHighlightItems([]);
 setSelectedStoriesToAdd([]);
 }
 }}
 >
 <DialogContent className="max-w-5xl max-h-[88vh] overflow-y-auto">
 {activeHighlight && (
 <>
 <DialogHeader>
 <DialogTitle>{activeHighlight.title}</DialogTitle>
 <DialogDescription>
 Manage stories inside this highlight and keep the profile collection curated.
 </DialogDescription>
 </DialogHeader>

 {loadingDetail ? (
 <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
 {Array.from({ length: 4 }).map((_, index) => (
 <Skeleton key={index} className="aspect-[9/16] w-full" />
 ))}
 </div>
 ) : (
 <div className="space-y-6">
 <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 text-sm text-muted-foreground">
 <Eye className="h-4 w-4" />
 <span>{highlightItems.length} saved stories</span>
 </div>
 </div>

 {highlightItems.length === 0 ? (
 <div className="border border-dashed bg-card p-10 text-center text-[15px] font-semibold text-muted-foreground">
 This highlight is empty.
 </div>
 ) : (
 <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
 {highlightItems.map((item) => (
 <div key={item.item_id} className="group relative overflow-hidden border bg-muted">
 <div className="relative aspect-[9/16]">
 {item.media_type === "video" ? (
 <video src={item.media_url} className="h-full w-full object-cover" />
 ) : (
 <Image
 src={item.media_url}
 alt=""
 fill
 unoptimized
 className="object-cover"
 />
 )}
 <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
 <button
 type="button"
 onClick={() => void handleRemoveStory(item.story_media_id)}
 disabled={savingDetail}
 className="absolute right-2 top-2 rounded-full border border-white/70 bg-black/70 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 {item.description && (
 <p className="absolute bottom-3 left-3 right-3 line-clamp-3 text-xs text-white font-bold">
 {item.description}
 </p>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 <div className="space-y-4 bg-muted/40 p-4">
 <div className="space-y-2">
 <label className="text-sm font-medium">Highlight name</label>
 <div className="flex gap-2">
 <Input
 value={editingTitle}
 onChange={(e) => setEditingTitle(e.target.value)}
 placeholder="Highlight title"
 />
 <Button
 variant="outline"
 onClick={() => void handleRenameHighlight()}
 disabled={savingDetail || !editingTitle.trim() || editingTitle.trim() === activeHighlight.title}
 >
 <Pencil className="mr-1 h-4 w-4" />
 Save
 </Button>
 </div>
 </div>

 {/* Plan §3.3 S4 — replace the cover on an existing highlight. */}
 <div className="space-y-2">
 <label className="text-sm font-medium">Cover image</label>
 <div className="flex items-center gap-3">
 <div className="relative h-16 w-16 overflow-hidden rounded-full border bg-muted">
 {activeHighlight.cover_url ? (
 <Image
 src={activeHighlight.cover_url}
 alt={activeHighlight.title}
 fill
 unoptimized
 className="object-cover"
 />
 ) : (
 <div className="flex h-full w-full items-center justify-center">
 <ImageIcon className="h-5 w-5 text-muted-foreground" />
 </div>
 )}
 </div>
 <Button
 variant="outline"
 size="sm"
 className="gap-2"
 disabled={uploadingCover || savingDetail}
 onClick={() => editCoverInputRef.current?.click()}
 >
 {uploadingCover ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 <ImageIcon className="h-3.5 w-3.5" />
 )}
 {uploadingCover ? "Uploading…" : "Upload cover"}
 </Button>
 <input
 ref={editCoverInputRef}
 type="file"
 accept="image/*"
 className="hidden"
 onChange={(e) => {
 const f = e.target.files?.[0];
 if (f) void handleUploadExistingCover(f);
 // Reset so the same file can be picked again.
 if (e.target) e.target.value = "";
 }}
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-sm font-medium">
 Add stories ({selectedStoriesToAdd.length} selected)
 </label>
 {availableStoriesToAdd.length === 0 ? (
 <p className="text-sm text-muted-foreground">
 All active stories are already in this highlight.
 </p>
 ) : (
 <div className="grid grid-cols-3 gap-2">
 {availableStoriesToAdd.map((story) => {
 const isSelected = selectedStoriesToAdd.includes(story.story_media_id);
 return (
 <button
 key={story.story_media_id}
 type="button"
 onClick={() => toggleStoryAddition(story.story_media_id)}
 className={`relative aspect-[9/16] overflow-hidden border ${
 isSelected ? "ring-2 ring-primary" : ""
 }`}
 >
 {story.media.type === "video" ? (
 <video src={story.media.url} className="h-full w-full object-cover" />
 ) : (
 <Image
 src={story.media.url}
 alt=""
 fill
 unoptimized
 className="object-cover"
 />
 )}
 {isSelected && (
 <div className="absolute right-2 top-2 rounded-full border bg-primary p-1 text-white">
 <Check className="h-3 w-3" />
 </div>
 )}
 </button>
 );
 })}
 </div>
 )}
 </div>

 <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
 <Button
 onClick={() => void handleAddStories()}
 disabled={savingDetail || selectedStoriesToAdd.length === 0}
 className="w-full"
 >
 Add selected stories
 </Button>
 <Button
 variant="destructive"
 onClick={() => void handleDeleteHighlight()}
 disabled={savingDetail}
 className="w-full"
 >
 Delete highlight
 </Button>
 </DialogFooter>
 </div>
 </div>
 </div>
 )}
 </>
 )}
 </DialogContent>
 </Dialog>
 </div>
 );
}
