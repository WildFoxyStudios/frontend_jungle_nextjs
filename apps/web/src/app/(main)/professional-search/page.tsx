"use client";

import { useState, useEffect, useCallback } from "react";
import { usersApi, searchApi } from "@jungle/api-client";
import type { User } from "@jungle/api-client";
import {
  Input,
  Button,
  Card,
  CardContent,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@jungle/ui";
import {
  Search,
  MapPin,
  Briefcase,
  GraduationCap,
  Filter,
  Linkedin,
  BadgeCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Marketing",
  "Design",
  "Sales",
  "Engineering",
  "Consulting",
  "Media",
];

const LOCATIONS = [
  "New York",
  "San Francisco",
  "London",
  "Berlin",
  "Paris",
  "Tokyo",
  "Singapore",
  "Remote",
];

type ProfessionalUser = User;

export default function ProfessionalSearchPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<ProfessionalUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [industry, setIndustry] = useState<string>("");
  const [location, setLocation] = useState<string>("");

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      // getSuggestions returns PublicUser[]; we upgrade by fetching full user on interaction.
      const res = await usersApi.getSuggestions();
      setUsers((Array.isArray(res) ? res : []) as unknown as ProfessionalUser[]);
    } catch {
      toast.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleSearch = async () => {
    if (!query.trim()) {
      loadSuggestions();
      return;
    }
    setLoading(true);
    try {
      const res = await searchApi.search(query, "users");
      setUsers((res.data ?? []) as ProfessionalUser[]);
    } catch {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (location && !user.location?.toLowerCase().includes(location.toLowerCase())) return false;
    if (industry) {
      const working = user.working?.toLowerCase() ?? "";
      const about = user.about?.toLowerCase() ?? "";
      if (!working.includes(industry.toLowerCase()) && !about.includes(industry.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Linkedin className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Professional Search</h1>
        </div>
        <p className="text-muted-foreground">
          Discover professionals, connect with industry experts, and grow your network.
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, title, or company..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filters:</span>
        </div>
        <Select value={industry || "all"} onValueChange={(v) => setIndustry(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {INDUSTRIES.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={location || "all"} onValueChange={(v) => setLocation(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {LOCATIONS.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(industry || location) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIndustry("");
              setLocation("");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-lg">
            <p className="text-muted-foreground">No professionals found matching your criteria.</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={resolveAvatarUrl(user.avatar)} />
                    <AvatarFallback className="text-lg">
                      {user.first_name?.[0] || user.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          href={`/profile/${user.username}`}
                          className="font-semibold hover:underline flex items-center gap-1"
                        >
                          {user.first_name} {user.last_name}
                          {user.is_verified && (
                            <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-500/10" />
                          )}
                        </Link>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0">
                        <UserPlus className="h-4 w-4 mr-1" /> Connect
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                      {user.working && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {user.working}
                        </span>
                      )}
                      {user.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {user.location}
                        </span>
                      )}
                      {user.open_to_work?.title && (
                        <Badge variant="secondary" className="text-xs">
                          Open to: {user.open_to_work.title}
                        </Badge>
                      )}
                    </div>

                    {user.school && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {user.school}
                      </div>
                    )}

                    {user.about && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {user.about}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
