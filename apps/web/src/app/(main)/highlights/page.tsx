"use client";

import { useEffect, useState } from "react";
import { storiesApi } from "@jungle/api-client";
import type { Story, StoryHighlight } from "@jungle/api-client";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Skeleton,
} from "@jungle/ui";
import { Plus, Bookmark, Check } from "lucide-react";
import { toast } from "sonner";

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newHighlightName, setNewHighlightName] = useState("");
  const [selectedStories, setSelectedStories] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hRes, sRes] = await Promise.all([
        storiesApi.getMyHighlights(),
        storiesApi.getMyStories(),
      ]);
      setHighlights(hRes?.data ?? []);
      setMyStories(sRes ?? []);
    } catch {
      toast.error("Failed to load highlights");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHighlight = async () => {
    if (!newHighlightName.trim() || selectedStories.length === 0) {
      toast.error("Please provide a name and select at least one story");
      return;
    }
    try {
      await storiesApi.createHighlight({
        title: newHighlightName,
        story_media_ids: selectedStories,
      });
      toast.success("Highlight created");
      setIsCreating(false);
      setNewHighlightName("");
      setSelectedStories([]);
      loadData();
    } catch {
      toast.error("Failed to create highlight");
    }
  };

  const toggleStorySelection = (storyId: number) => {
    setSelectedStories((prev) =>
      prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Story Highlights</h1>
          <p className="text-muted-foreground">Save your favorite stories to your profile</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Highlight
        </Button>
      </div>

      {/* Highlights Grid */}
      {highlights.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-xl">
          <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No highlights yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create highlights to showcase your best stories on your profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {highlights.map((highlight) => (
            <Card key={highlight.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <div className="aspect-square bg-muted relative">
                {highlight.cover_url ? (
                  <img
                    src={highlight.cover_url}
                    alt={highlight.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Bookmark className="h-8 w-8 text-primary/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="font-semibold text-white text-sm">{highlight.title}</p>
                  <p className="text-white/70 text-xs">{highlight.item_count} stories</p>
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

            <div>
              <label className="text-sm font-medium">Select Stories ({selectedStories.length} selected)</label>
              {myStories.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No active stories available.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {myStories.map((story) => {
                    const isSelected = selectedStories.includes(story.id);
                    const mediaType = story.media?.type ?? "image";
                    const mediaUrl = story.media?.url ?? "";
                    return (
                      <button
                        key={story.id}
                        onClick={() => toggleStorySelection(story.id)}
                        className={`relative aspect-[9/16] rounded-lg overflow-hidden ${
                          isSelected ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        {mediaType === "video" ? (
                          <video src={mediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img
                            src={mediaUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
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
              <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleCreateHighlight}
                disabled={!newHighlightName.trim() || selectedStories.length === 0}
                className="flex-1"
              >
                Create Highlight
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
