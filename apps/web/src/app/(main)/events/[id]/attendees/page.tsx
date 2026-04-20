"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { eventsApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import { Button, Avatar, AvatarFallback, AvatarImage, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from "@jungle/ui";
import { ArrowLeft, Users } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";

interface Props { params: Promise<{ id: string }> }

export default function EventAttendeesPage({ params }: Props) {
  const { id } = use(params);
  const eventId = Number(id);
  const [going, setGoing] = useState<PublicUser[]>([]);
  const [interested, setInterested] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      eventsApi.getGoing(eventId)
        .then((r) => setGoing(r.data as PublicUser[]))
        .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load attendees")),
      eventsApi.getInterested(eventId)
        .then((r) => setInterested(r.data as PublicUser[]))
        .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load interested")),
    ]).finally(() => setLoading(false));
  }, [eventId]);

  const UserList = ({ users }: { users: PublicUser[] }) => (
    loading ? (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    ) : users.length === 0 ? (
      <div className="py-10 text-center text-muted-foreground flex flex-col items-center gap-2">
        <Users className="h-8 w-8" />
        <p>No one yet</p>
      </div>
    ) : (
      <div className="divide-y">
        {users.map((u) => (
          <Link
            key={u.id}
            href={`/profile/${u.username}`}
            className="flex items-center gap-3 py-3 px-1 hover:bg-muted/50 rounded-lg transition-colors"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={resolveAvatarUrl(u.avatar)} />
              <AvatarFallback>{u.first_name?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{u.first_name} {u.last_name}</p>
              <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
            </div>
          </Link>
        ))}
      </div>
    )
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/events/${id}`}><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Attendees</h1>
      </div>

      <Tabs defaultValue="going">
        <TabsList className="w-full">
          <TabsTrigger value="going" className="flex-1">
            Going <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">{going.length}</span>
          </TabsTrigger>
          <TabsTrigger value="interested" className="flex-1">
            Interested <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">{interested.length}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="going" className="mt-4">
          <UserList users={going} />
        </TabsContent>
        <TabsContent value="interested" className="mt-4">
          <UserList users={interested} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
