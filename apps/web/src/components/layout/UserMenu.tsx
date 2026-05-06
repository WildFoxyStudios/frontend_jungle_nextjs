"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@jungle/hooks";
import { useTranslations } from "next-intl";
import {
 DropdownMenu, DropdownMenuContent, DropdownMenuItem,
 DropdownMenuSeparator, DropdownMenuTrigger,
 Avatar, AvatarFallback, AvatarImage, Button,
} from "@jungle/ui";
import { resolveAvatarUrl } from "@/lib/avatar";
import { getAdminPanelUrl, userCanAccessAdminPanel } from "@/lib/admin-panel";
import { Keyboard, Star, Hand, Shield } from "lucide-react";
import { KeyboardShortcutsDialog } from "@/components/shared/KeyboardShortcutsDialog";

export function UserMenu() {
 const router = useRouter();
 const { user, logout } = useAuthStore();
 const [shortcutsOpen, setShortcutsOpen] = useState(false);
 const t = useTranslations("nav");
 const te = useTranslations("nav_extra");
 const tk = useTranslations("keyboardShortcuts");
 const adminPanelUrl = getAdminPanelUrl();

 const handleLogout = () => {
 logout();
 router.push("/login");
 };

 if (!user) return null;

 return (
 <>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 size="sm"
 aria-label={t("profile")}
 className="h-10 gap-1.5 overflow-hidden px-1 hover:bg-secondary/60 lg:gap-2 lg:px-2.5 rounded-md"
 >
 <Avatar className="h-8 w-8 border-0 shadow-none">
 <AvatarImage src={resolveAvatarUrl(user.avatar)} alt={user.username} />
 <AvatarFallback>{user.first_name?.[0]}</AvatarFallback>
 </Avatar>
 <span className="hidden max-w-[9rem] truncate text-left text-[13px] font-medium lg:inline">
 {user.first_name || user.username}
 </span>
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent
 align="end"
 sideOffset={8}
 className="w-[min(calc(100vw-1rem),16rem)]"
 >
 <DropdownMenuItem asChild>
 <Link href={`/profile/${user.username}`}>{t("profile")}</Link>
 </DropdownMenuItem>
 <DropdownMenuItem asChild>
 <Link href="/settings">{t("settings")}</Link>
 </DropdownMenuItem>
 <DropdownMenuItem asChild>
 <Link href="/go-pro" className="gap-2">
 <Star className="h-4 w-4" /> {te("goPro")}
 </Link>
 </DropdownMenuItem>
 <DropdownMenuItem asChild>
 <Link href="/pokes" className="gap-2">
 <Hand className="h-4 w-4" /> {te("pokes")}
 </Link>
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setShortcutsOpen(true)} className="gap-2">
 <Keyboard className="h-4 w-4" /> {tk("dialogTitle")}
 </DropdownMenuItem>
 {userCanAccessAdminPanel(user) && (
 <>
 <DropdownMenuSeparator />
 <DropdownMenuItem asChild>
 <a
 href={adminPanelUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="gap-2"
 >
 <Shield className="h-4 w-4" /> {te("adminPanel")}
 </a>
 </DropdownMenuItem>
 </>
 )}
 <DropdownMenuSeparator />
 <DropdownMenuItem
 onClick={handleLogout}
 className="bg-destructive text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground"
 >
 {te("logout")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 <KeyboardShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
 </>
 );
}
