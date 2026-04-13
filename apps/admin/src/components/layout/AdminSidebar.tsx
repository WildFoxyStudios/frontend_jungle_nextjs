"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Users, CircleDot, Bot, Link2, Flag, Clock, CheckCircle2,
  Ban, AlertTriangle, FileText, PenLine, BookOpen, Clapperboard,
  MessageCircle, FileIcon, UsersRound, Calendar, ShoppingCart, Briefcase,
  Package, DollarSign, CreditCard, ClipboardList, ArrowDownToLine, Star,
  Landmark, RotateCcw, Handshake, Settings, Wrench, ShieldCheck, Palette,
  KeyRound, Mail, Smartphone, Image, Search, BrainCircuit, Radio, Video,
  Megaphone, Store, Globe, Bell, Languages, FolderOpen, Heart, Paintbrush,
  Smile, Gift, MailOpen, Users2, CircleDollarSign, ListChecks,
  HeartPulse, HardDrive, Newspaper, ScrollText, Key, KeySquare,
  SpeakerIcon, MonitorSmartphone, Code, MailPlus, type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: BarChart3 }],
  },
  {
    label: "Users",
    items: [
      { href: "/users", label: "All Users", icon: Users },
      { href: "/system/online-users", label: "Online Users", icon: CircleDot },
      { href: "/system/fake-users", label: "Fake Users", icon: Bot },
      { href: "/system/referrals", label: "Referrals", icon: Link2 },
    ],
  },
  {
    label: "Moderation",
    items: [
      { href: "/moderation/reports", label: "Reports", icon: Flag },
      { href: "/moderation/pending-posts", label: "Pending Posts", icon: Clock },
      { href: "/moderation/verifications", label: "Verifications", icon: CheckCircle2 },
      { href: "/moderation/banned-ips", label: "Banned IPs", icon: Ban },
      { href: "/moderation/user-reports", label: "User Reports", icon: AlertTriangle },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/content/posts", label: "Posts", icon: FileText },
      { href: "/content/blogs", label: "Blogs", icon: PenLine },
      { href: "/content/stories", label: "Stories", icon: BookOpen },
      { href: "/content/movies", label: "Movies", icon: Clapperboard },
      { href: "/content/forums", label: "Forums", icon: MessageCircle },
    ],
  },
  {
    label: "Communities",
    items: [
      { href: "/communities/pages", label: "Pages", icon: FileIcon },
      { href: "/communities/groups", label: "Groups", icon: UsersRound },
      { href: "/communities/events", label: "Events", icon: Calendar },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/commerce/products", label: "Products", icon: ShoppingCart },
      { href: "/commerce/jobs", label: "Jobs", icon: Briefcase },
      { href: "/commerce/orders", label: "Orders", icon: Package },
      { href: "/commerce/funding", label: "Funding", icon: DollarSign },
    ],
  },
  {
    label: "Payments",
    items: [
      { href: "/payments", label: "Overview", icon: CreditCard },
      { href: "/payments/transactions", label: "Transactions", icon: ClipboardList },
      { href: "/payments/withdrawals", label: "Withdrawals", icon: ArrowDownToLine },
      { href: "/payments/pro-members", label: "Pro Members", icon: Star },
      { href: "/payments/bank-receipts", label: "Bank Receipts", icon: Landmark },
      { href: "/payments/refunds", label: "Refunds", icon: RotateCcw },
      { href: "/payments/affiliates", label: "Affiliates", icon: Handshake },
      { href: "/payments/settings", label: "Gateways", icon: Settings },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/settings/general", label: "General", icon: Settings },
      { href: "/settings/features", label: "Features", icon: Wrench },
      { href: "/settings/auth", label: "Auth", icon: ShieldCheck },
      { href: "/settings/appearance", label: "Appearance", icon: Palette },
      { href: "/settings/social-login", label: "Social Login", icon: KeyRound },
      { href: "/settings/email", label: "Email", icon: Mail },
      { href: "/settings/sms", label: "SMS", icon: Smartphone },
      { href: "/settings/media", label: "Media", icon: Image },
      { href: "/settings/seo", label: "SEO", icon: Search },
      { href: "/settings/ai", label: "AI", icon: BrainCircuit },
      { href: "/settings/live", label: "Live", icon: Radio },
      { href: "/settings/video", label: "Video", icon: Video },
      { href: "/settings/ads", label: "Ads", icon: Megaphone },
      { href: "/settings/store", label: "Store", icon: Store },
      { href: "/settings/posts", label: "Posts", icon: FileText },
      { href: "/settings/website-mode", label: "Website Mode", icon: Globe },
      { href: "/settings/push-notifications", label: "Push Notifications", icon: Bell },
      { href: "/settings/pro-features", label: "Pro Features", icon: Star },
    ],
  },
  {
    label: "Localization",
    items: [
      { href: "/localization/languages", label: "Languages", icon: Languages },
    ],
  },
  {
    label: "Customization",
    items: [
      { href: "/customization/categories", label: "Categories", icon: FolderOpen },
      { href: "/customization/reactions", label: "Reactions", icon: Heart },
      { href: "/customization/colored-posts", label: "Colored Posts", icon: Paintbrush },
      { href: "/customization/stickers", label: "Stickers", icon: Smile },
      { href: "/customization/gifts", label: "Gifts", icon: Gift },
      { href: "/customization/email-templates", label: "Email Templates", icon: MailOpen },
      { href: "/customization/custom-pages", label: "Custom Pages", icon: FileIcon },
      { href: "/customization/genders", label: "Genders", icon: Users2 },
      { href: "/customization/currencies", label: "Currencies", icon: CircleDollarSign },
      { href: "/customization/profile-fields", label: "Profile Fields", icon: ListChecks },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/system/health", label: "Health", icon: HeartPulse },
      { href: "/system/backups", label: "Backups", icon: HardDrive },
      { href: "/system/newsletter", label: "Newsletter", icon: Newspaper },
      { href: "/system/announcements", label: "Announcements", icon: Megaphone },
      { href: "/system/mass-notifications", label: "Mass Notifications", icon: Bell },
      { href: "/system/activity-log", label: "Activity Log", icon: ScrollText },
      { href: "/system/oauth-apps", label: "OAuth Apps", icon: Key },
      { href: "/system/api-keys", label: "API Keys", icon: KeySquare },
      { href: "/system/user-ads", label: "User Ads", icon: SpeakerIcon },
      { href: "/system/site-ads", label: "Site Ads", icon: MonitorSmartphone },
      { href: "/system/custom-code", label: "Custom Code", icon: Code },
      { href: "/system/invitations", label: "Invitations", icon: MailPlus },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-background h-screen overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b">
        <Link href="/" className="text-lg font-bold text-primary">Jungle Admin</Link>
      </div>
      <nav className="p-2 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
