"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@jungle/ui";
import { StoryRing } from "@/components/stories/StoryRing";
import { StoryCreator } from "@/components/stories/StoryCreator";

export default function StoriesPage() {
  const [showCreator, setShowCreator] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stories</h1>
        <Button onClick={() => setShowCreator(!showCreator)}>+ Add story</Button>
      </div>
      {showCreator && (
        <Card>
          <CardHeader><CardTitle>Create Story</CardTitle></CardHeader>
          <CardContent><StoryCreator onSuccess={() => setShowCreator(false)} /></CardContent>
        </Card>
      )}
      <StoryRing />
    </div>
  );
}
