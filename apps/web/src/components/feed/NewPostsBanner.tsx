"use client";

import { Button } from "@jungle/ui";

interface NewPostsBannerProps {
  onRefresh: () => void;
}

export function NewPostsBanner({ onRefresh }: NewPostsBannerProps) {
  return (
    <div className="sticky top-14 z-40 flex justify-center py-2">
      <Button
        size="sm"
        onClick={onRefresh}
        className="shadow-lg rounded-full px-4"
      >
        ↑ New posts available
      </Button>
    </div>
  );
}
