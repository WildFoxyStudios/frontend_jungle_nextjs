"use client";

import { useEffect, useState } from "react";
import { usersApi, pagesApi, groupsApi } from "@jungle/api-client";
import type { PublicUser, Page, Group } from "@jungle/api-client";
import { 
 Skeleton, Tabs, TabsList, TabsTrigger,
 Avatar, AvatarImage, AvatarFallback, Badge, Card, CardContent
} from "@jungle/ui";
import { 
 Users, Flag, Users2, LayoutGrid, ChevronRight, 
 CheckCircle2, BadgeCheck, Star, Users as UsersIcon 
} from "lucide-react";
import Link from "next/link";
import { resolveAvatarUrl } from "@/lib/avatar";

type DirectoryTab = "peoples" | "pages" | "groups";
type DirectoryItem = PublicUser | Page | Group;

export default function DirectoryPage() {
 const [activeTab, setActiveTab] = useState<DirectoryTab>("peoples");
 const [items, setItems] = useState<DirectoryItem[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 setLoading(true);
 setItems([]);

 const loadData = async () => {
 try {
 if (activeTab === "peoples") {
 const res = await usersApi.getSuggestions();
 setItems(Array.isArray(res) ? res : []);
 } else if (activeTab === "pages") {
 const res = await pagesApi.getSuggested();
 setItems(res.data || []);
 } else if (activeTab === "groups") {
 const res = await groupsApi.getSuggested();
 setItems(res.data || []);
 }
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 loadData();
 }, [activeTab]);

 return (
 <div className="mx-auto max-w-4xl space-y-8 px-3 py-8 sm:px-4">
 {/* Breadcrumbs for SEO */}
 <nav className="flex items-center text-xs text-muted-foreground gap-2">
 <Link href="/feed" className="hover:text-primary">Home</Link>
 <ChevronRight className="h-3 w-3" />
 <span className="text-foreground font-medium">Directory / {activeTab}</span>
 </nav>

 {/* Header */}
 <div className="space-y-2">
 <h1 className="text-2xl font-bold sm:text-[28px] flex items-center gap-3">
 <LayoutGrid className="h-8 w-8 text-primary" /> Site Directory
 </h1>
 <p className="text-muted-foreground">Discover verified professionals, popular communities, and trending pages.</p>
 </div>

 <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DirectoryTab)}>
 <TabsList className="bg-secondary/40 p-1">
 <TabsTrigger value="peoples" className="gap-2">
 <Users className="h-4 w-4" /> Peoples
 </TabsTrigger>
 <TabsTrigger value="pages" className="gap-2">
 <Flag className="h-4 w-4" /> Pages
 </TabsTrigger>
 <TabsTrigger value="groups" className="gap-2">
 <Users2 className="h-4 w-4" /> Groups
 </TabsTrigger>
 </TabsList>

 <div className="mt-8">
 {loading ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
 {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32 w-full" />)}
 </div>
 ) : items.length === 0 ? (
 <div className="py-12 text-center">
 <p className="font-medium text-muted-foreground">No entries found in this category.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
 
 {/* PEOPLES RENDERER */}
 {activeTab === "peoples" && (items as PublicUser[]).map((user) => (
 <Link key={user.id} href={`/profile/${user.username}`}>
 <Card className="overflow-hidden group transition hover:bg-muted/50">
 <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
 <div className="relative">
 <Avatar className="h-20 w-20 border group-hover:scale-105 transition-transform">
 <AvatarImage src={resolveAvatarUrl(user.avatar)} />
 <AvatarFallback>{user.username[0]}</AvatarFallback>
 </Avatar>
 {user.is_verified && (
 <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
 <BadgeCheck className="h-5 w-5 text-blue-500 fill-blue-500/10" />
 </div>
 )}
 </div>
 <div className="min-w-0">
 <p className="font-semibold truncate text-sm">{user.first_name} {user.last_name}</p>
 <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
 </div>
 <div className="flex gap-2">
 {user.is_pro === 1 && <Badge variant="secondary" className="text-[10px] h-5">PRO</Badge>}
 <Badge variant="outline" className="text-[10px] h-5">Verified</Badge>
 </div>
 </CardContent>
 </Card>
 </Link>
 ))}

 {/* PAGES RENDERER */}
 {activeTab === "pages" && (items as Page[]).map((page) => (
 <Link key={page.id} href={`/pages/${page.id}`}>
 <Card className="group h-full transition hover:bg-muted/50">
 <CardContent className="p-4 flex flex-col h-full">
 <div className="flex items-center gap-3">
 <Avatar className="h-12 w-12">
 <AvatarImage src={resolveAvatarUrl(page.avatar)} />
 <AvatarFallback>{page.name[0]}</AvatarFallback>
 </Avatar>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-1">
 <p className="font-semibold truncate text-sm">{page.name}</p>
 {page.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />}
 </div>
 <p className="text-[10px] text-muted-foreground truncate capitalize">{page.category}</p>
 </div>
 </div>
 <div className="mt-auto pt-4 flex items-center justify-between text-[13px] font-medium text-muted-foreground">
 <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" /> {page.rating.toFixed(1)}</span>
 <span>{page.like_count} Likes</span>
 </div>
 </CardContent>
 </Card>
 </Link>
 ))}

 {/* GROUPS RENDERER */}
 {activeTab === "groups" && (items as Group[]).map((group) => (
 <Link key={group.id} href={`/groups/${group.id}`}>
 <Card className="group h-full transition hover:bg-muted/50">
 <CardContent className="p-4 flex flex-col h-full">
 <div className="flex items-center gap-3">
 <div className="h-12 w-12 flex items-center justify-center text-primary">
 <UsersIcon className="h-6 w-6" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-semibold truncate text-sm">{group.name}</p>
 <p className="text-[10px] text-muted-foreground truncate capitalize">{group.privacy} Group</p>
 </div>
 </div>
 <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{group.description}</p>
 <div className="mt-auto pt-4 text-[13px] font-medium text-muted-foreground">
 {group.member_count} Members
 </div>
 </CardContent>
 </Card>
 </Link>
 ))}

 </div>
 )}
 </div>
 </Tabs>
 </div>
 );
}
