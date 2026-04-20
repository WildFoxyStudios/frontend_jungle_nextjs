"use client";

import { use, useState } from "react";
import { eventsApi, searchApi } from "@jungle/api-client";
import { Button, Input, Card, CardContent, Avatar, AvatarImage, AvatarFallback } from "@jungle/ui";
import { toast } from "sonner";
import { resolveAvatarUrl } from "@/lib/avatar";
import { Search, UserPlus, Loader2 } from "lucide-react";
import type { PublicUser } from "@jungle/api-client";

interface Props { params: Promise<{ id: string }> }

export default function EventInvited({ params }: Props) {
  const { id } = use(params);
  const eventId = Number(id);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState<number | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await searchApi.searchAll(query);
      const users = Array.isArray(res?.users) ? res.users : [];
      setResults(users.slice(0, 5) as PublicUser[]);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async (userId: number) => {
    setInviting(userId);
    try {
      await eventsApi.inviteUsers(eventId, [userId]);
      toast.success("Invitation sent");
      setResults((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to invite");
    } finally {
      setInviting(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Invite Users</h2>
      
      <div className="flex gap-2">
        <Input
          placeholder="Search by username or name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={searching || !query.trim()}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={16} />}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={resolveAvatarUrl(user.avatar)} />
                    <AvatarFallback>{user.first_name?.[0]}{user.last_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.first_name} {user.last_name}</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleInvite(user.id)}
                  disabled={inviting === user.id}
                >
                  {inviting === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus size={16} />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {query && !searching && results.length === 0 && (
        <p className="text-muted-foreground text-center py-4">No users found</p>
      )}
    </div>
  );
}
