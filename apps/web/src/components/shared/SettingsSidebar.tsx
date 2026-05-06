"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export interface SettingsNavItem {
 href: string;
 label: string;
 icon?: LucideIcon;
}

interface SettingsSidebarProps {
 items: SettingsNavItem[];
 title?: string;
}

export function SettingsSidebar({ items, title }: SettingsSidebarProps) {
 const pathname = usePathname();

 return (
 <aside className="w-56 shrink-0">
 {title && (
 <p className="text-[13px] font-semibold text-muted-foreground px-3 py-2">
 {title}
 </p>
 )}
 <nav className="space-y-0.5">
 {items.map(({ href, label, icon: Icon }) => {
 const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
 return (
 <Link
 key={href}
 href={href}
 className={`flex items-center gap-2.5 border px-3 py-2 text-sm transition-all ${
 isActive
 ? "border bg-primary/10 font-medium text-primary"
 : "border-transparent text-foreground hover:border-foreground hover:bg-card"
 }`}
 >
 {Icon && <Icon className="h-4 w-4 shrink-0" />}
 <span>{label}</span>
 </Link>
 );
 })}
 </nav>
 </aside>
 );
}
