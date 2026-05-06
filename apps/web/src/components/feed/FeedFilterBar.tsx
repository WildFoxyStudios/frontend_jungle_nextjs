"use client";

import { cn } from "@jungle/ui";
import type { FeedPostType } from "@jungle/hooks";
import {
 FileText,
 Film,
 Image as ImageIcon,
 LayoutGrid,
 MapPin,
 Music,
 Paperclip,
 TrendingUp,
 Users2,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface FeedFilterBarProps {
 value: FeedPostType;
 onChange: (next: FeedPostType) => void;
 /** Set to `true` to hide the audience chips (e.g. on profile feeds). */
 hideAudience?: boolean;
 className?: string;
}

/**
 * Plan §3.12 FP1/FP2 — post-type + audience filter chips shown above the
 * composer on the main feed page. The backend uses a single `filter` query
 * param so audience and post-type are mutually exclusive from its PoV;
 * this UI keeps them on separate rows for clarity.
 */
export function FeedFilterBar({
 value,
 onChange,
 hideAudience,
 className,
}: FeedFilterBarProps) {
 const t = useTranslations("feed");

 const postTypes: { key: FeedPostType; icon: typeof LayoutGrid; label: string }[] =
 [
 { key: "all", icon: LayoutGrid, label: t("filterAll") },
 { key: "text", icon: FileText, label: t("filterText") },
 { key: "photos", icon: ImageIcon, label: t("filterPhotos") },
 { key: "videos", icon: Film, label: t("filterVideos") },
 { key: "music", icon: Music, label: t("filterMusic") },
 { key: "files", icon: Paperclip, label: t("filterFiles") },
 { key: "location", icon: MapPin, label: t("filterLocation") },
 ];

 const audiences: { key: FeedPostType; icon: typeof LayoutGrid; label: string }[] =
 [
 { key: "all", icon: LayoutGrid, label: t("audienceAll") },
 { key: "following", icon: Users2, label: t("audienceFollowing") },
 { key: "trending", icon: TrendingUp, label: t("audienceTrending") },
 ];

 return (
 <div
 className={cn(
 "flex flex-col gap-2 p-2 text-sm rounded-lg",
 className,
 )}
 role="group"
 aria-label={t("filterBar")}
 >
 <Row>
 {postTypes.map(({ key, icon: Icon, label }) => (
 <Chip
 key={key}
 active={value === key}
 onClick={() => onChange(key)}
 label={label}
 icon={<Icon className="h-4 w-4" aria-hidden="true" />}
 />
 ))}
 </Row>
 {!hideAudience && (
 <Row>
 {audiences.map(({ key, icon: Icon, label }) => (
 <Chip
 key={`a-${key}`}
 active={value === key}
 onClick={() => onChange(key)}
 label={label}
 icon={<Icon className="h-4 w-4" aria-hidden="true" />}
 />
 ))}
 </Row>
 )}
 </div>
 );
}

function Row({ children }: { children: React.ReactNode }) {
 return (
 <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
 {children}
 </div>
 );
}

function Chip({
 active,
 onClick,
 label,
 icon,
}: {
 active: boolean;
 onClick: () => void;
 label: string;
 icon: React.ReactNode;
}) {
 return (
 <button
 type="button"
 onClick={onClick}
 aria-pressed={active}
 className={cn(
 "inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-[13px] font-semibold transition-colors rounded-full",
 active
 ? "border-primary bg-primary text-primary-foreground"
 : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
 )}
 >
 {icon}
 <span>{label}</span>
 </button>
 );
}
