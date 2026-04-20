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
import { Keyboard, Star, Hand } from "lucide-react";
import { KeyboardShortcutsDialog } from "@/components/shared/KeyboardShortcutsDialog";

export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const t = useTranslations("nav");
  const te = useTranslations("nav_extra");

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={resolveAvatarUrl(user.avatar)} alt={user.username} />
            <AvatarFallback>{user.first_name[0]}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={`/profile/${user.username}`}>{t("profile")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">{t("settings")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/wallet">{te("wallet")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/go-pro" className="gap-2"><Star className="h-4 w-4 text-yellow-500" /> {te("goPro")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/pokes" className="gap-2"><Hand className="h-4 w-4" /> {te("pokes")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setShortcutsOpen(true)} className="gap-2">
          <Keyboard className="h-4 w-4" /> {te("shortcuts")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
          {te("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <KeyboardShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  );
}
