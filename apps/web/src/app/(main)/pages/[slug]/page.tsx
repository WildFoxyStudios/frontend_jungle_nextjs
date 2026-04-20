"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { pagesApi, searchApi } from "@jungle/api-client";
import type { Page, Post, PublicUser } from "@jungle/api-client";
import {
  Button, Avatar, AvatarFallback, AvatarImage, Skeleton, Badge,
  Tabs, TabsList, TabsTrigger, TabsContent, Card, CardContent, Separator, Input, Textarea,
} from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";
import { InviteFriendsDialog } from "@/components/shared/InviteFriendsDialog";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { ThumbsUp, Star, Globe, Settings, MapPin, Phone, Tag, Plus, Trash2, UserX, UserCheck, Search, Briefcase, BadgeCheck, UserPlus } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

export default function PageDetailPage({ params }: Props) {
  const { slug } = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likers, setLikers] = useState<PublicUser[]>([]);
  const [ratings, setRatings] = useState<unknown[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [offers, setOffers] = useState<{ id: number; title: string; description: string; discount: string; image?: string; expires_at?: string; created_at: string }[]>([]);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerForm, setOfferForm] = useState({ title: "", description: "", discount: "" });
  const [admins, setAdmins] = useState<PublicUser[]>([]);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminSearchResults, setAdminSearchResults] = useState<PublicUser[]>([]);
  const [searchingAdmins, setSearchingAdmins] = useState(false);
  const [services, setServices] = useState<{ id: number; title: string; description: string; price: string; image?: string }[]>([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState({ title: "", description: "", price: "" });
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    pagesApi.getPage(slug).then(setPage).catch(() => { });
  }, [slug]);

  useEffect(() => {
    if (!page) return;
    if (activeTab === "posts" && posts.length === 0) {
      pagesApi.getPagePosts(page.id)
        .then((r) => setPosts(Array.isArray(r?.data) ? r.data : []))
        .catch(() => { });
    }
    if (activeTab === "likes" && likers.length === 0) {
      pagesApi.getPageLikers(page.id)
        .then((r) => setLikers(Array.isArray(r?.data) ? r.data : []))
        .catch(() => { });
    }
    if (activeTab === "reviews" && ratings.length === 0) {
      pagesApi.getPageRatings(page.id)
        .then((r) => setRatings(Array.isArray(r) ? r : []))
        .catch(() => { });
    }
    if (activeTab === "offers" && offers.length === 0) {
      pagesApi.getPageOffers(page.id)
        .then((r) => setOffers(Array.isArray(r?.data) ? r.data : []))
        .catch(() => { });
    }
    if (activeTab === "admins") {
      pagesApi.getPageAdmins(page.id)
        .then((r) => setAdmins(Array.isArray(r) ? r : []))
        .catch(() => { });
    }
    if (activeTab === "services") {
      pagesApi.getPageServices(page.id)
        .then((r) => setServices(Array.isArray(r) ? r : []))
        .catch(() => { });
    }
  }, [page, activeTab]);

  const handleAdminSearch = async (q: string) => {
    setAdminSearch(q);
    if (q.trim().length < 2) { setAdminSearchResults([]); return; }
    setSearchingAdmins(true);
    try {
      const r = await searchApi.search(q, "users");
      setAdminSearchResults((r.data as PublicUser[]) ?? []);
    } catch { /* silent */ }
    finally { setSearchingAdmins(false); }
  };

  const handleAddAdmin = async (userId: number) => {
    if (!page) return;
    try {
      await pagesApi.addPageAdmin(page.id, userId);
      const user = adminSearchResults.find((u) => u.id === userId);
      if (user) setAdmins((prev) => [...prev, user]);
      setAdminSearch("");
      setAdminSearchResults([]);
      toast.success("Admin added");
    } catch { toast.error("Failed to add admin"); }
  };

  const handleRemoveAdmin = async (userId: number) => {
    if (!page) return;
    try {
      await pagesApi.removePageAdmin(page.id, userId);
      setAdmins((prev) => prev.filter((a) => a.id !== userId));
      toast.success("Admin removed");
    } catch { toast.error("Failed to remove admin"); }
  };

  const handleLike = async () => {
    if (!page) return;
    try {
      if (page.is_liked) {
        await pagesApi.unlikePage(page.id);
        setPage((p) => p ? { ...p, is_liked: false, like_count: p.like_count - 1 } : p);
      } else {
        await pagesApi.likePage(page.id);
        setPage((p) => p ? { ...p, is_liked: true, like_count: p.like_count + 1 } : p);
      }
    } catch { toast.error("Action failed"); }
  };

  const handleRate = async (star: number) => {
    if (!page) return;
    try {
      await pagesApi.ratePage(page.id, star, reviewComment);
      setMyRating(star);
      setReviewComment("");
      toast.success(`Rated ${star} stars`);
      // Refresh ratings
      pagesApi.getPageRatings(page.id).then((r: any) => setRatings(Array.isArray(r) ? r : []));
    } catch {
      toast.error("Failed to rate");
    }
  };

  const getCtaLabel = (type?: string) => {
    switch (type) {
      case "1": return "Read More";
      case "2": return "Shop Now";
      case "3": return "View Now";
      case "4": return "Visit Now";
      case "5": return "Book Now";
      case "6": return "Play Now";
      case "7": return "Listen Now";
      case "8": return "Donate";
      case "9": return "Apply Now";
      default: return null;
    }
  };

  if (!page) return <Skeleton className="h-64 w-full" />;

  const isAdmin = page.is_admin;
  const ctaLabel = getCtaLabel(page.call_action_type);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Cover */}
      {page.cover && (
        <div className="relative h-44 bg-muted rounded-b-lg overflow-hidden">
          <img src={page.cover} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarImage src={resolveAvatarUrl(page.avatar)} />
            <AvatarFallback className="text-xl">{page.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{page.name}</h1>
              {page.is_verified && <BadgeCheck className="h-5 w-5 text-blue-500 fill-blue-500/20 shrink-0" />}
            </div>
            {page.category && <p className="text-xs text-muted-foreground">{page.category}</p>}
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> {page.like_count} likes</span>
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-yellow-500" /> {page.rating.toFixed(1)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0 items-end">
            <div className="flex gap-2">
              <InviteFriendsDialog onInvite={async (ids) => {
                await pagesApi.inviteLike(page.id, ids);
              }}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" /> Invite
                </Button>
              </InviteFriendsDialog>
              {ctaLabel && page.call_action_type_url && (
                <Button size="sm" asChild className="bg-primary text-primary-foreground font-semibold shadow-md hover:scale-105 transition-transform">
                  <a href={page.call_action_type_url} target="_blank" rel="noopener noreferrer">{ctaLabel}</a>
                </Button>
              )}
              {isAdmin && (
                <Button variant="outline" size="sm" asChild className="gap-1.5">
                  <Link href={`/pages/${slug}/settings`}><Settings className="h-3.5 w-3.5" /> Manage</Link>
                </Button>
              )}
              <Button size="sm" variant={page.is_liked ? "outline" : "default"} onClick={handleLike} className="gap-1.5">
                <ThumbsUp className="h-3.5 w-3.5" />
                {page.is_liked ? "Unlike" : "Like"}
              </Button>
            </div>
          </div>
        </div>

        {page.description && <p className="text-sm">{page.description}</p>}

        {/* ... existing Tabs ... */}

        <TabsContent value="reviews" className="mt-4">
          <Card>
            <CardContent className="p-4 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Customer Reviews</h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-bold">{page.rating.toFixed(1)}</span>
                  <div className="flex text-yellow-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-4 w-4 ${s <= Math.round(page.rating) ? "fill-current" : ""}`} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">({page.rating_count} ratings)</span>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-5 space-y-4 border shadow-inner">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rate & Review</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRate(star)}
                      className={`transition-all hover:scale-110 active:scale-95 ${star <= myRating ? "text-yellow-500" : "text-muted-foreground"
                        }`}
                    >
                      <Star className={`h-8 w-8 ${star <= myRating ? "fill-current" : "group-hover:opacity-70"}`} />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Tell others what you think about this business..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="bg-background/80 text-sm h-24 resize-none"
                />
                {myRating > 0 && (
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => handleRate(myRating)}>
                      Update Review
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {ratings.length === 0 ? (
                <p className="text-sm text-center py-6 text-muted-foreground italic">No detailed reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {ratings.map((r: any, i: number) => (
                    <div key={i} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={resolveAvatarUrl(r.user?.avatar)} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{r.user?.first_name ?? 'Anonymous'}</p>
                          <span className="text-[10px] text-muted-foreground">{new Date(r.created_at || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <div className="flex text-yellow-500 h-3">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "fill-current" : ""}`} />
                          ))}
                        </div>
                        {r.comment && <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="mt-4 space-y-4">
          {isAdmin && (
            <Card>
              <CardContent className="p-4">
                {showServiceForm ? (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Add Service</h4>
                    <Input
                      placeholder="Service Title"
                      value={serviceForm.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServiceForm((f) => ({ ...f, title: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Description"
                      value={serviceForm.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setServiceForm((f) => ({ ...f, description: e.target.value }))}
                    />
                    <Input
                      placeholder="Price (e.g. $50/hr)"
                      value={serviceForm.price}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServiceForm((f) => ({ ...f, price: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={!serviceForm.title.trim()}
                        onClick={async () => {
                          try {
                            const result = await pagesApi.createPageService(page.id, serviceForm);
                            setServices((prev) => [{ ...serviceForm, id: result.id }, ...prev]);
                            setServiceForm({ title: "", description: "", price: "" });
                            setShowServiceForm(false);
                            toast.success("Service added!");
                          } catch { toast.error("Failed to add service"); }
                        }}
                      >
                        Add Service
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowServiceForm(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowServiceForm(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add Service
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {services.length === 0 && !showServiceForm ? (
            <div className="text-center py-12 bg-muted/10 rounded-xl border border-dashed">
              <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground text-sm">No services listed yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((svc) => (
                <Card key={svc.id} className="overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted relative">
                      {svc.image ? (
                        <img src={svc.image} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground/20">
                          <Briefcase className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary shadow-lg">{svc.price}</Badge>
                      </div>
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm">{svc.title}</p>
                        {isAdmin && (
                          <button
                            onClick={async () => {
                              try {
                                await pagesApi.deletePageService(page.id, svc.id);
                                setServices(prev => prev.filter(s => s.id !== svc.id));
                                toast.success("Service deleted");
                              } catch { toast.error("Failed to delete"); }
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{svc.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Offers tab */}
        <TabsContent value="offers" className="mt-4 space-y-4">
          {isAdmin && (
            <Card>
              <CardContent className="p-4">
                {showOfferForm ? (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Create Offer</h4>
                    <input
                      className="w-full border rounded px-3 py-1.5 text-sm bg-background"
                      placeholder="Offer title"
                      value={offerForm.title}
                      onChange={(e) => setOfferForm((f) => ({ ...f, title: e.target.value }))}
                    />
                    <textarea
                      className="w-full border rounded px-3 py-1.5 text-sm bg-background resize-none"
                      rows={2}
                      placeholder="Description"
                      value={offerForm.description}
                      onChange={(e) => setOfferForm((f) => ({ ...f, description: e.target.value }))}
                    />
                    <input
                      className="w-full border rounded px-3 py-1.5 text-sm bg-background"
                      placeholder="Discount (e.g. 20% off, Buy 1 Get 1)"
                      value={offerForm.discount}
                      onChange={(e) => setOfferForm((f) => ({ ...f, discount: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={!offerForm.title.trim() || !offerForm.discount.trim()}
                        onClick={async () => {
                          try {
                            const result = await pagesApi.createPageOffer(page.id, offerForm);
                            setOffers((prev) => [{ ...offerForm, id: result.id, created_at: new Date().toISOString() }, ...prev]);
                            setOfferForm({ title: "", description: "", discount: "" });
                            setShowOfferForm(false);
                            toast.success("Offer created!");
                          } catch { toast.error("Failed to create offer"); }
                        }}
                      >
                        Create
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowOfferForm(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowOfferForm(true)}>
                    <Plus className="h-3.5 w-3.5" /> Create Offer
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
          {offers.length === 0 && !showOfferForm ? (
            <p className="text-muted-foreground text-sm text-center py-8">No offers yet.</p>
          ) : (
            <div className="space-y-2">
              {offers.map((offer) => (
                <Card key={offer.id}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="bg-primary/10 text-primary rounded-lg p-2 shrink-0">
                      <Tag className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{offer.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{offer.description}</p>
                      <Badge variant="secondary" className="mt-1.5">{offer.discount}</Badge>
                      {offer.expires_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Expires: {new Date(offer.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={async () => {
                          try {
                            await pagesApi.deletePageOffer(page.id, offer.id);
                            setOffers((prev) => prev.filter((o) => o.id !== offer.id));
                            toast.success("Offer deleted");
                          } catch { toast.error("Failed to delete"); }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        {/* Admins tab — only visible to admins */}
        {isAdmin && (
          <TabsContent value="admins" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">Add Admin</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={adminSearch}
                    onChange={(e) => void handleAdminSearch(e.target.value)}
                    placeholder="Search users by name or username…"
                    className="pl-9"
                  />
                </div>
                {searchingAdmins && <p className="text-xs text-muted-foreground">Searching…</p>}
                {adminSearchResults.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {adminSearchResults.map((u) => {
                      const isAlready = admins.some((a) => a.id === u.id);
                      return (
                        <div key={u.id} className="flex items-center gap-3 px-3 py-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={resolveAvatarUrl(u.avatar)} />
                            <AvatarFallback>{u.first_name?.[0] ?? "?"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{u.first_name} {u.last_name}</p>
                            <p className="text-xs text-muted-foreground">@{u.username}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isAlready}
                            onClick={() => void handleAddAdmin(u.id)}
                            className="gap-1.5 shrink-0"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            {isAlready ? "Already admin" : "Add"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">Current Admins ({admins.length})</h3>
                <Separator />
                {admins.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No admins yet besides the owner.</p>
                ) : (
                  <div className="divide-y">
                    {admins.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 py-2">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={resolveAvatarUrl(a.avatar)} />
                          <AvatarFallback>{a.first_name?.[0] ?? "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{a.first_name} {a.last_name}</p>
                          <p className="text-xs text-muted-foreground">@{a.username}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive shrink-0 gap-1.5"
                          onClick={() => void handleRemoveAdmin(a.id)}
                        >
                          <UserX className="h-3.5 w-3.5" /> Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </div>
    </div>
  );
}
