"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usersApi, searchApi, notificationsApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import { useAuthStore, useOnlineUsers } from "@jungle/hooks";
import {
  Avatar, AvatarFallback, AvatarImage, Button, Card, CardContent, CardHeader, CardTitle, Badge, Skeleton,
} from "@jungle/ui";
import { UserPlus, Check, TrendingUp, Hash, X, Circle, CloudSun, Droplets, Wind, BarChart2, Cake, Activity } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function RightSidebar() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <aside className="hidden lg:flex flex-col w-80 shrink-0 p-4 gap-4 h-screen sticky top-0 overflow-y-auto">
      <ProfileCompletionWidget />
      <BirthdaysWidget />
      <SuggestionsWidget />
      <OnlineFriendsWidget />
      <ActivityWidget />
      <TrendingWidget />
      <FollowRequestsWidget />
      <WeatherWidget />
      <FooterLinks />
    </aside>
  );
}

function SuggestionsWidget() {
  const [suggestions, setSuggestions] = useState<PublicUser[]>([]);
  const [followed, setFollowed] = useState<Set<number>>(new Set());
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.getSuggestions()
      .then((data) => setSuggestions(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const t = useTranslations("right_sidebar");

  const handleFollow = async (userId: number) => {
    try {
      await usersApi.follow(userId);
      setFollowed((prev) => new Set([...prev, userId]));
    } catch {
      toast.error(t("toasts.followFailed"));
    }
  };

  const visible = suggestions.filter((u) => !dismissed.has(u.id));

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">{t("suggestions")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (visible.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <UserPlus className="h-4 w-4" /> {t("suggestions")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visible.map((u) => (
          <div key={u.id} className="flex items-center gap-2">
            <Link href={`/profile/${u.username}`}>
              <Avatar className="h-9 w-9">
                <AvatarImage src={resolveAvatarUrl(u.avatar)} />
                <AvatarFallback>{u.first_name?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${u.username}`} className="text-sm font-medium truncate block hover:underline">
                {u.first_name} {u.last_name}
              </Link>
              <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
            </div>
            {followed.has(u.id) ? (
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
                <Check className="h-3.5 w-3.5 text-green-500" />
              </Button>
            ) : (
              <div className="flex gap-0.5">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleFollow(u.id)}>
                  <UserPlus className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDismissed((p) => new Set([...p, u.id]))}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
        <Link href="/explore" className="text-xs text-primary hover:underline block pt-1">
          {t("seeAll")}
        </Link>
      </CardContent>
    </Card>
  );
}

function OnlineFriendsWidget() {
  const { user } = useAuthStore();
  const onlineUsers = useOnlineUsers();
  const [friends, setFriends] = useState<PublicUser[]>([]);

  useEffect(() => {
    if (!user) return;
    usersApi.getFollowing(user.username)
      .then((r) => setFriends(Array.isArray(r?.data) ? r.data : []))
      .catch(() => { });
  }, [user]);

  const t = useTranslations("right_sidebar");
  const onlineFriends = friends.filter((f) => onlineUsers.has(f.id));

  if (onlineFriends.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Circle className="h-3 w-3 fill-green-500 text-green-500" /> {t("onlineFriends")}
          <Badge variant="secondary" className="ml-auto text-[10px]">{onlineFriends.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {onlineFriends.slice(0, 8).map((f) => (
          <Link
            key={f.id}
            href={`/messages?user=${f.username}`}
            className="flex items-center gap-2 py-1 px-2 -mx-2 rounded hover:bg-muted/50"
          >
            <div className="relative">
              <Avatar className="h-7 w-7">
                <AvatarImage src={resolveAvatarUrl(f.avatar)} />
                <AvatarFallback className="text-xs">{f.first_name?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-background" />
            </div>
            <span className="text-sm truncate">{f.first_name} {f.last_name}</span>
          </Link>
        ))}
        {onlineFriends.length > 8 && (
          <p className="text-xs text-muted-foreground pl-2">{t("moreOnline", { count: onlineFriends.length - 8 })}</p>
        )}
      </CardContent>
    </Card>
  );
}

function TrendingWidget() {
  const [hashtags, setHashtags] = useState<{ tag: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    searchApi.getTrendingHashtags()
      .then((data) => setHashtags(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const t = useTranslations("right_sidebar");

  if (loading) return null;
  if (hashtags.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4" /> {t("trending")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {hashtags.map((h) => (
          <Link key={h.tag} href={`/hashtag/${h.tag}`} className="flex items-center justify-between py-1 hover:bg-muted/50 px-2 rounded -mx-2">
            <span className="text-sm font-medium flex items-center gap-1">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              {h.tag}
            </span>
            <span className="text-xs text-muted-foreground">{t("postsCount", { count: h.count })}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function FollowRequestsWidget() {
  const [requests, setRequests] = useState<PublicUser[]>([]);
  const [handled, setHandled] = useState<Set<number>>(new Set());

  const t = useTranslations("right_sidebar");

  useEffect(() => {
    usersApi.getFollowRequests()
      .then((r) => setRequests(Array.isArray(r?.data) ? r.data.slice(0, 3) : []))
      .catch(() => { });
  }, []);

  const pending = requests.filter((u) => !handled.has(u.id));
  if (pending.length === 0) return null;

  const handle = async (id: number, accept: boolean) => {
    try {
      if (accept) await usersApi.acceptFollowRequest(id);
      else await usersApi.rejectFollowRequest(id);
      setHandled((prev) => new Set([...prev, id]));
    } catch {
      toast.error(t("toasts.actionFailed"));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{t("followRequests")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pending.map((u) => (
          <div key={u.id} className="flex items-center gap-2">
            <Link href={`/profile/${u.username}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={resolveAvatarUrl(u.avatar)} />
                <AvatarFallback>{u.first_name?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
            </Link>
            <p className="flex-1 text-sm font-medium truncate">{u.first_name} {u.last_name}</p>
            <div className="flex gap-1">
              <Button size="sm" className="h-6 text-xs px-2" onClick={() => handle(u.id, true)}>{t("accept")}</Button>
              <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => handle(u.id, false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WeatherWidget() {
  const t = useTranslations("right_sidebar");
  const [weather, setWeather] = useState<{
    temperature: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    city: string;
  } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
          );
          const data = await res.json();
          const current = data.current;
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`
          );
          const geoData = await geoRes.json();
          const city = geoData.address?.city ?? geoData.address?.town ?? geoData.address?.state ?? t("weather.cityFallback");
          setWeather({
            temperature: Math.round(current.temperature_2m),
            humidity: current.relative_humidity_2m,
            windSpeed: Math.round(current.wind_speed_10m),
            weatherCode: current.weather_code,
            city,
          });
        } catch { /* silent */ }
      },
      () => { /* geolocation denied — don't show widget */ },
      { timeout: 5000 }
    );
  }, [t]);

  if (!weather) return null;

  const weatherDesc = (code: number) => {
    if (code === 0) return t("weather.clear");
    if (code <= 3) return t("weather.partlyCloudy");
    if (code <= 48) return t("weather.foggy");
    if (code <= 57) return t("weather.drizzle");
    if (code <= 67) return t("weather.rain");
    if (code <= 77) return t("weather.snow");
    if (code <= 82) return t("weather.showers");
    if (code <= 86) return t("weather.snowShowers");
    if (code <= 99) return t("weather.thunderstorm");
    return t("weather.unknown");
  };

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <CloudSun className="h-8 w-8 text-yellow-500 shrink-0" />
          <div>
            <p className="text-lg font-bold leading-none">{weather.temperature}°C</p>
            <p className="text-xs text-muted-foreground">{weatherDesc(weather.weatherCode)} · {weather.city}</p>
          </div>
        </div>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Droplets className="h-3 w-3" /> {weather.humidity}%</span>
          <span className="flex items-center gap-1"><Wind className="h-3 w-3" /> {weather.windSpeed} km/h</span>
        </div>
      </CardContent>
    </Card>
  );
}

function BirthdaysWidget() {
  const [birthdays, setBirthdays] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Standard WoWonder endpoint for birthdays
    usersApi.getSuggestions() // Fallback to suggestions if no birthday endpoint, but mapping for UI
      .then((data) => setBirthdays(Array.isArray(data) ? data.slice(0, 2) : []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const t = useTranslations("right_sidebar");

  if (loading || birthdays.length === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-pink-500/5 to-transparent border-pink-500/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5 text-pink-600 dark:text-pink-400">
          <Cake className="h-4 w-4" /> {t("birthdays")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {birthdays.map((u) => (
          <div key={u.id} className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-pink-500/20">
              <AvatarImage src={resolveAvatarUrl(u.avatar)} />
              <AvatarFallback>B</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{u.first_name} {u.last_name}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{t("today")}</p>
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full p-0">
              <Cake className="h-4 w-4 text-pink-500" />
            </Button>
          </div>
        ))}
        <p className="text-[10px] text-center text-muted-foreground pt-1 italic">{t("sendWishes")}</p>
      </CardContent>
    </Card>
  );
}

function ActivityWidget() {
  const [activities, setActivities] = useState<{ id: number; user: PublicUser; type: string; time: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Pull the latest notifications as the "recent activity" stream.
        const list = (await notificationsApi.getNotifications()) as unknown;
        const data =
          list && typeof list === "object" && "data" in list
            ? (list as { data: unknown }).data
            : list;
        if (!Array.isArray(data) || cancelled) return;
        const items = data
          .slice(0, 5)
          .map((n, idx) => {
            const row = n as Record<string, unknown>;
            const actor = (row.actor ?? row.from_user) as PublicUser | undefined;
            if (!actor) return null;
            return {
              id: typeof row.id === "number" ? row.id : idx,
              user: actor,
              type: typeof row.message === "string" ? row.message : String(row.type ?? ""),
              time: typeof row.created_at === "string" ? row.created_at : "",
            };
          })
          .filter((x): x is { id: number; user: PublicUser; type: string; time: string } => x !== null);
        setActivities(items);
      } catch {
        setActivities([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const t = useTranslations("right_sidebar");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-primary" /> {t("recentActivity")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((act) => (
          <div key={act.id} className="flex gap-3 relative group">
            <Avatar className="h-8 w-8 z-10">
              <AvatarImage src={resolveAvatarUrl(act.user.avatar)} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="space-y-0.5 min-w-0 flex-1">
              <p className="text-xs">
                <span className="font-bold">{act.user.first_name}</span> {
                  act.type.includes('liked') ? t("types.likedPost") : 
                  act.type.includes('joined') ? t("types.joinedGroup", { group: act.type.split('"')[1] || "group" }) : 
                  act.type
                }
              </p>
              <p className="text-[10px] text-muted-foreground">{act.time} {t("ago")}</p>
            </div>
            <div className="absolute left-4 top-8 bottom-[-16px] w-[1px] bg-muted group-last:hidden" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ProfileCompletionWidget() {
  const { user } = useAuthStore();
  const t = useTranslations("right_sidebar");
  if (!user) return null;

  const steps = [
    { key: "avatar", label: t("steps.avatar"), done: !!user.avatar, href: "/settings/profile" },
    { key: "name", label: t("steps.name"), done: !!(user.first_name && user.last_name), href: "/settings/profile" },
    { key: "bio", label: t("steps.bio"), done: !!(user as { about?: string }).about, href: "/settings/profile" },
    { key: "location", label: t("steps.location"), done: !!(user as { country?: string }).country, href: "/settings" },
    { key: "social", label: t("steps.social"), done: !!(user as { facebook?: string }).facebook || !!(user as { twitter?: string }).twitter, href: "/settings/social-links" },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  if (pct === 100) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <BarChart2 className="h-4 w-4" /> {t("profileCompletion")}
          <Badge variant="secondary" className="ml-auto text-[10px]">{pct}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="w-full bg-muted rounded-full h-1.5">
          <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="space-y-1">
          {steps.filter((s) => !s.done).slice(0, 3).map((s) => (
            <Link key={s.key} href={s.href} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
              {s.label}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FooterLinks() {
  return (
    <div className="text-xs text-muted-foreground space-x-2 px-2 mt-auto">
      <Link href="/terms" className="hover:underline">Terms</Link>
      <span>·</span>
      <Link href="/privacy" className="hover:underline">Privacy</Link>
      <span>·</span>
      <Link href="/about" className="hover:underline">About</Link>
      <span>·</span>
      <Link href="/contact" className="hover:underline">Contact</Link>
      <p className="mt-1">© {new Date().getFullYear()} Jungle</p>
    </div>
  );
}
