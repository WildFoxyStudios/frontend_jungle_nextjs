"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usersApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import { Avatar, AvatarFallback, AvatarImage, Button, Card, CardContent, Skeleton } from "@jungle/ui";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

export default function NearbyPage() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNearby = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      await usersApi.updateMe({ location_lat: lat, location_lng: lng } as never);
      const suggestions = await usersApi.getSuggestions();
      setUsers(suggestions);
      setLocationGranted(true);
    } catch {
      toast.error("Failed to load nearby users");
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { void loadNearby(pos.coords.latitude, pos.coords.longitude); },
      () => setError("Location access denied. Please allow location access in your browser settings."),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  useEffect(() => { requestLocation(); }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">People Nearby</h1>
      </div>

      {error && (
        <div className="text-center py-8 space-y-3">
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={requestLocation}>Allow location & try again</Button>
        </div>
      )}

      {loading && (
        <div className="space-y-3">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      )}

      {!loading && locationGranted && (
        <div className="space-y-2">
          {users.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">No users nearby. Share your location to discover more people.</CardContent></Card>
          ) : users.map((u) => (
            <Link key={u.id} href={"/profile/" + u.username} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <Avatar className="h-12 w-12">
                <AvatarImage src={u.avatar} />
                <AvatarFallback>{u.first_name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{u.first_name} {u.last_name}</p>
                <p className="text-xs text-muted-foreground">@{u.username}</p>
              </div>
              {u.is_online && <div className="h-2.5 w-2.5 rounded-full bg-green-500 shrink-0" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}