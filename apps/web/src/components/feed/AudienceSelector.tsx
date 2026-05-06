"use client";

import { Globe, Users, Star, Lock, List } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Button } from "@jungle/ui";
import { useState } from "react";

type Audience = "public" | "friends" | "close_friends" | "only_me" | "custom";

interface AudienceSelectorProps {
 value: Audience;
 onChange: (audience: Audience, listId?: number) => void;
 disabled?: boolean;
}

const AUDIENCE_OPTIONS: Array<{ value: Audience; label: string; description: string; icon: typeof Globe }> = [
 { value: "public", label: "Public", description: "Anyone on Jungle", icon: Globe },
 { value: "friends", label: "Friends", description: "Your friends only", icon: Users },
 { value: "close_friends", label: "Close Friends", description: "Close friends list", icon: Star },
 { value: "only_me", label: "Only Me", description: "Only you", icon: Lock },
 { value: "custom", label: "Custom", description: "Choose a list", icon: List },
];

export function AudienceSelector({ value, onChange, disabled }: AudienceSelectorProps) {
 const [selected, setSelected] = useState<Audience>(value);
 const current = AUDIENCE_OPTIONS.find((o) => o.value === selected) || AUDIENCE_OPTIONS[0];
 const Icon = current.icon;

 return (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="soft-primary" size="sm" disabled={disabled} className="gap-1.5">
 <Icon className="h-3.5 w-3.5" />
 <span className="hidden sm:inline">{current.label}</span>
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className="w-56">
 {AUDIENCE_OPTIONS.map((opt) => {
 const OptIcon = opt.icon;
 return (
 <DropdownMenuItem
 key={opt.value}
 onClick={() => {
 setSelected(opt.value);
 onChange(opt.value);
 }}
 className="flex items-start gap-2 py-2"
 >
 <OptIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
 <div>
 <div className="font-medium text-sm">{opt.label}</div>
 <div className="text-xs text-muted-foreground">{opt.description}</div>
 </div>
 </DropdownMenuItem>
 );
 })}
 </DropdownMenuContent>
 </DropdownMenu>
 );
}
