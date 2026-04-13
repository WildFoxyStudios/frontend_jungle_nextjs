"use client";

import { useState, useEffect } from "react";
import { notificationsApi } from "@jungle/api-client";
import type { Announcement } from "@jungle/api-client";
import { Button } from "@jungle/ui";
import { X } from "lucide-react";

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    notificationsApi.getAnnouncements()
      .then((data) => setAnnouncements(data))
      .catch(() => {});
  }, []);

  const visible = announcements.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-1">
      {visible.map((a) => (
        <div
          key={a.id}
          className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 text-sm"
        >
          <span className="flex-1">{a.content}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setDismissed((prev) => new Set([...prev, a.id]))}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
