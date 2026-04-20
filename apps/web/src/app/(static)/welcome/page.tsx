import Link from "next/link";
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

export default async function WelcomePage() {
  const config = await getPublicConfig();
  const siteName = config?.site_name ?? "Jungle";
  const siteDesc = config?.site_description ?? "Connect with friends and the world around you.";

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="relative max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Zap size={16} />
            <span>The next generation social network</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight">
            Welcome to <span className="text-primary">{siteName}</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {siteDesc} Join millions of people sharing their stories, connecting with friends, 
            and discovering new opportunities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="h-12 px-8 text-lg" asChild>
              <Link href="/register">Create Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Shield size={16} /> Secure</span>
            <span className="flex items-center gap-2"><Globe size={16} /> Global</span>
            <span className="flex items-center gap-2"><Gift size={16} /> Free Forever</span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 border-y bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete social platform with all the features you love, plus powerful tools 
              for creators, businesses, and communities.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div 
                key={feature.title} 
                className="group p-6 rounded-xl border bg-card hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to Get Started?</h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            Join {siteName} today and become part of a growing community of people 
            sharing their stories and connecting with the world.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" variant="secondary" className="h-12 px-8" asChild>
              <Link href="/register">Create Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 border-primary-foreground/20 hover:bg-primary-foreground/10" asChild>
              <Link href="/login">Already a Member? Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
