"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { pagesApi, usersApi } from "@jungle/api-client";
import type { NearbyPage, PublicUser } from "@jungle/api-client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@jungle/ui";
import { Briefcase, MapPin, ShoppingBag, Users } from "lucide-react";
import { toast } from "sonner";

type Coords = { lat: number; lng: number };

export default function NearbyPage() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"people" | "business" | "shops">("people");

  const [users, setUsers] = useState<PublicUser[]>([]);
  const [business, setBusiness] = useState<NearbyPage[]>([]);
  const [shops, setShops] = useState<NearbyPage[]>([]);

  const [loadingPeople, setLoadingPeople] = useState(false);
  const [loadingBusiness, setLoadingBusiness] = useState(false);
  const [loadingShops, setLoadingShops] = useState(false);

  const loadPeople = useCallback(async (c: Coords) => {
    setLoadingPeople(true);
    try {
      await usersApi.updateLocation(c.lat, c.lng);
      setUsers(await usersApi.getNearbyUsers(c.lat, c.lng, 50));
    } catch {
      toast.error("Failed to load nearby users");
    } finally {
      setLoadingPeople(false);
    }
  }, []);

  const loadBusiness = useCallback(async (c: Coords) => {
    setLoadingBusiness(true);
    try {
      setBusiness(
        await pagesApi.getNearbyPages({
          lat: c.lat,
          lng: c.lng,
          category: "business",
          radius_km: 50,
          limit: 50,
        })
      );
    } catch {
      toast.error("Failed to load nearby businesses");
    } finally {
      setLoadingBusiness(false);
    }
  }, []);

  const loadShops = useCallback(async (c: Coords) => {
    setLoadingShops(true);
    try {
      setShops(
        await pagesApi.getNearbyPages({
          lat: c.lat,
          lng: c.lng,
          category: "shops",
          radius_km: 50,
          limit: 50,
        })
      );
    } catch {
      toast.error("Failed to load nearby shops");
    } finally {
      setLoadingShops(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setError(null);
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        void loadPeople(c);
      },
      () => setError("Location access denied. Please allow location access in your browser settings."),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [loadPeople]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const onTabChange = (value: string) => {
    const next = value as typeof tab;
    setTab(next);
    if (!coords) return;
    if (next === "people" && users.length === 0) void loadPeople(coords);
    if (next === "business" && business.length === 0) void loadBusiness(coords);
    if (next === "shops" && shops.length === 0) void loadShops(coords);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Nearby</h1>
      </div>

      {error && (
        <div className="text-center py-8 space-y-3">
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={requestLocation}>Allow location &amp; try again</Button>
        </div>
      )}

      {!error && (
        <Tabs value={tab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="people" className="gap-2">
              <Users className="h-4 w-4" /> People
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-2">
              <Briefcase className="h-4 w-4" /> Business
            </TabsTrigger>
            <TabsTrigger value="shops" className="gap-2">
              <ShoppingBag className="h-4 w-4" /> Shops
            </TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="space-y-2 mt-4">
            {loadingPeople ? (
              <SkeletonList />
            ) : users.length === 0 ? (
              <EmptyState message="No users nearby. Share your location to discover more people." />
            ) : (
              users.map((u) => (
                <Link
                  key={u.id}
                  href={"/profile/" + u.username}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback>{u.first_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {u.first_name} {u.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </div>
                  {u.distance_km !== undefined && (
                    <div className="text-xs text-muted-foreground shrink-0 tabular-nums">
                      {u.distance_km.toFixed(1)} km
                    </div>
                  )}
                  {u.is_online && (
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500 shrink-0 ml-2" />
                  )}
                </Link>
              ))
            )}
          </TabsContent>

          <TabsContent value="business" className="space-y-2 mt-4">
            {loadingBusiness ? (
              <SkeletonList />
            ) : business.length === 0 ? (
              <EmptyState message="No businesses nearby right now." />
            ) : (
              business.map((p) => <PageRow key={p.id} page={p} />)
            )}
          </TabsContent>

          <TabsContent value="shops" className="space-y-2 mt-4">
            {loadingShops ? (
              <SkeletonList />
            ) : shops.length === 0 ? (
              <EmptyState message="No shops nearby right now." />
            ) : (
              shops.map((p) => <PageRow key={p.id} page={p} />)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function PageRow({ page }: { page: NearbyPage }) {
  return (
    <Link
      href={"/pages/" + page.page_name}
      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={page.avatar} />
        <AvatarFallback>{page.page_title.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{page.page_title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {page.address || "Unknown address"}
        </p>
      </div>
      <div className="text-xs text-muted-foreground shrink-0 tabular-nums">
        {page.distance_km.toFixed(1)} km
      </div>
    </Link>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground text-sm">
        {message}
      </CardContent>
    </Card>
  );
}