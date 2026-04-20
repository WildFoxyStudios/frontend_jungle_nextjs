"use client";

import { use, useEffect, useState } from "react";
import { eventsApi } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { Users, Star, TrendingUp } from "lucide-react";

interface Props { params: Promise<{ id: string }> }

interface EventStats {
  going: number;
  interested: number;
  totalResponses: number;
}

export default function EventAnalytics({ params }: Props) {
  const { id } = use(params);
  const eventId = Number(id);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [goingRes, interestedRes] = await Promise.all([
          eventsApi.getGoing(eventId),
          eventsApi.getInterested(eventId),
        ]);
        
        const going = Array.isArray(goingRes?.data) ? goingRes.data.length : 0;
        const interested = Array.isArray(interestedRes?.data) ? interestedRes.data.length : 0;
        
        setStats({
          going,
          interested,
          totalResponses: going + interested,
        });
      } catch {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, [eventId]);

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!stats) return <p className="text-muted-foreground">No analytics available.</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Event Analytics</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users size={16} /> Going
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.going}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star size={16} /> Interested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.interested}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp size={16} /> Total Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalResponses}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
