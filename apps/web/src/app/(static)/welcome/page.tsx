import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@jungle/ui";
import { api } from "@jungle/api-client";
import type { PublicConfig } from "@jungle/api-client";
import { 
 Users, MessageCircle, Image, Video, Calendar, 
 ShoppingBag, Newspaper, Heart, Globe, Shield, Zap, Gift
} from "lucide-react";

async function getPublicConfig(): Promise<PublicConfig | null> {
 try {
 return await api.get<PublicConfig>("/v1/config/public");
 } catch {
 return null;
 }
}

const features = [
 { icon: Users, title: "Connect", desc: "Find and connect with friends, family, and like-minded people" },
 { icon: MessageCircle, title: "Chat", desc: "Real-time messaging with voice, video, and group conversations" },
 { icon: Image, title: "Share Photos", desc: "Upload and share your moments with the community" },
 { icon: Video, title: "Watch & Stream", desc: "Watch videos and stream live to your audience" },
 { icon: Calendar, title: "Events", desc: "Create and join events, meetups, and gatherings" },
 { icon: ShoppingBag, title: "Marketplace", desc: "Buy and sell items in the community marketplace" },
 { icon: Newspaper, title: "Blogs", desc: "Write and read articles from community members" },
 { icon: Heart, title: "Dating", desc: "Find your match with our integrated dating features" },
];

const stats = [
 { value: "10M+", label: "Active Users" },
 { value: "50M+", label: "Posts Shared" },
 { value: "100+", label: "Countries" },
 { value: "24/7", label: "Support" },
];

const SESSION_COOKIE = "Jungle_logged_in";

export default async function WelcomePage() {
 const cookieStore = await cookies();
 if (cookieStore.has(SESSION_COOKIE) || cookieStore.get("access_token")) {
 redirect("/feed");
 }

 const config = await getPublicConfig();
 const siteName = config?.site_name ?? "Jungle";
 const siteDesc = config?.site_description ?? "Connect with friends and the world around you.";

 return (
 <div className="min-h-svh">
 {/* Hero Section */}
 <section className="relative overflow-hidden px-4 py-20 lg:py-32">
 <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-secondary/15" />
 <div className="relative mx-auto max-w-6xl space-y-8 text-center">
 <div className="mb-4 inline-flex items-center gap-2 border bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
 <Zap size={16} />
 <span>The next generation social network</span>
 </div>

 <h1 className="text-4xl font-bold sm:text-5xl lg:text-7xl">
 Welcome to <span className="text-primary">{siteName}</span>
 </h1>

 <p className="mx-auto max-w-2xl text-xl leading-relaxed text-muted-foreground">
 {siteDesc} Join millions of people sharing their stories, connecting with friends,
 and discovering new opportunities.
 </p>

 <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
 <Button size="lg" className="h-12 px-8 text-lg" asChild>
 <Link href="/register">Create Free Account</Link>
 </Button>
 <Button size="lg" variant="outline" className="h-12 px-8 text-lg" asChild>
 <Link href="/login">Sign In</Link>
 </Button>
 </div>

 <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-[13px] font-medium text-muted-foreground">
 <span className="flex items-center gap-2"><Shield size={16} /> Secure</span>
 <span className="flex items-center gap-2"><Globe size={16} /> Global</span>
 <span className="flex items-center gap-2"><Gift size={16} /> Free Forever</span>
 </div>
 </div>
 </section>

 {/* Stats Section */}
 <section className="border-y bg-secondary/40 px-4 py-12">
 <div className="mx-auto max-w-6xl">
 <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
 {stats.map((stat) => (
 <div
 key={stat.label}
 className="p-5 text-center"
 >
 <p className="text-3xl font-bold text-primary sm:text-4xl">
 {stat.value}
 </p>
 <p className="mt-1 text-[13px] font-medium text-muted-foreground">
 {stat.label}
 </p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Features Grid */}
 <section className="px-4 py-20">
 <div className="mx-auto max-w-6xl">
 <div className="mb-16 text-center">
 <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
 Everything You Need
 </h2>
 <p className="mx-auto max-w-xl text-muted-foreground">
 A complete social platform with all the features you love, plus powerful tools
 for creators, businesses, and communities.
 </p>
 </div>

 <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
 {features.map((feature) => (
 <div
 key={feature.title}
 className="group p-6 transition-transform hover:bg-muted/50 hover:shadow-md"
 >
 <div className="mb-4 flex h-12 w-12 items-center justify-center border bg-primary/15 text-primary transition-colors group-hover:bg-primary/30">
 <feature.icon className="h-6 w-6" />
 </div>
 <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
 <p className="text-sm text-muted-foreground">{feature.desc}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* CTA Section */}
 <section className="border-y bg-primary px-4 py-20 text-primary-foreground">
 <div className="mx-auto max-w-4xl space-y-6 text-center">
 <h2 className="text-3xl font-bold sm:text-4xl">
 Ready to Get Started?
 </h2>
 <p className="mx-auto max-w-2xl text-lg text-primary-foreground/85">
 Join {siteName} today and become part of a growing community of people
 sharing their stories and connecting with the world.
 </p>
 <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
 <Button size="lg" variant="secondary" className="h-12 px-8" asChild>
 <Link href="/register">Create Free Account</Link>
 </Button>
 <Button
 size="lg"
 variant="outline"
 className="h-12 border border-background bg-transparent px-8 text-background hover:bg-background hover:text-foreground"
 asChild
 >
 <Link href="/login">Already a Member? Sign In</Link>
 </Button>
 </div>
 </div>
 </section>

 {/* Footer */}
 <footer className="border-t bg-card px-4 py-8">
 <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
 <p className="text-[13px] font-medium text-muted-foreground">
 © {new Date().getFullYear()} {siteName}. All rights reserved.
 </p>
 <div className="flex gap-6 text-[13px] font-medium">
 <Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link>
 <Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link>
 <Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
 </div>
 </div>
 </footer>
 </div>
 );
}
