import { Card, CardContent } from "@jungle/ui";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: LucideIcon;
}

export function StatsCard({ title, value, change, icon: Icon }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change && (
              <p className={`text-xs mt-1 ${change.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                {change}
              </p>
            )}
          </div>
          {Icon && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
