import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: LucideIcon;
}

export function StatsCard({ title, value, change, icon: Icon }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-border-subtle shadow-sm p-4 bg-card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold uppercase tracking-wide text-muted-foreground text-xs">{title}</p>
          <p className="text-3xl font-extrabold tracking-tight mt-1">{value}</p>
          {change && (
            <p className={`text-xs font-bold uppercase tracking-wide mt-1 ${change.startsWith("+") ? "text-success" : "text-destructive"}`}>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="rounded-lg bg-primary-subtle p-3 shrink-0">
            <Icon className="h-6 w-6 text-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
