"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Button, Card, CardContent, CardHeader, CardTitle, CardDescription, 
  Avatar, AvatarFallback, AvatarImage, Input, Label, Textarea,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@jungle/ui";
import { usersApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import { Camera, Check, ChevronRight, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resolveAvatarUrl } from "@/lib/avatar";

type StepKey = "avatar" | "info" | "follow";

export function OnboardingWizard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [enabledSteps, setEnabledSteps] = useState<StepKey[]>(["avatar", "info", "follow"]);
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep: StepKey | undefined = enabledSteps[stepIndex];

  // Step 1: Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Step 2: Info
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");

  // Step 3: Following
  const [suggestions, setSuggestions] = useState<PublicUser[]>([]);
  const [followedIds, setFollowedIds] = useState<number[]>([]);

  // Load public config to determine which steps are enabled
  useEffect(() => {
    fetch(`${process.env["NEXT_PUBLIC_API_URL"] ?? "/api"}/v1/config/public`)
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg: { start_up_avatar?: boolean; start_up_info?: boolean; start_up_follow?: boolean } | null) => {
        if (!cfg) return;
        const enabled: StepKey[] = [];
        if (cfg.start_up_avatar !== false) enabled.push("avatar");
        if (cfg.start_up_info !== false) enabled.push("info");
        if (cfg.start_up_follow !== false) enabled.push("follow");
        if (enabled.length > 0) setEnabledSteps(enabled);
      })
      .catch(() => { /* config fetch uses defaults on failure */ });
  }, []);

  // Load suggestions when the follow step becomes active
  useEffect(() => {
    if (currentStep === "follow") {
      usersApi.getSuggestions()
        .then((res) => {
          setSuggestions(Array.isArray(res) ? res : []);
        })
        .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load suggestions"));
    }
  }, [currentStep]);

  const goNext = () => {
    if (stepIndex + 1 >= enabledSteps.length) {
      finish();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const skipStep = async () => {
    if (!currentStep) return finish();
    try {
      await usersApi.onboardingSkip(currentStep);
    } catch {
      // Skip is best-effort; continue even if backend write fails
    }
    goNext();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Local preview
    setAvatarPreview(URL.createObjectURL(file));
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await usersApi.updateAvatar(formData);
      toast.success("Avatar updated!");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInfo = async () => {
    setLoading(true);
    try {
      await usersApi.updateMe({ about: bio, gender });
      goNext();
    } catch {
      toast.error("Failed to save info");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: number) => {
    try {
      await usersApi.follow(userId);
      setFollowedIds(prev => [...prev, userId]);
    } catch {
      toast.error("Failed to follow");
    }
  };

  const finish = () => {
    toast.success("All set! Welcome to Jungle.");
    router.push("/feed");
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl border-t-4 border-t-primary">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center gap-2 mb-4">
          {enabledSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-12 rounded-full transition-colors ${i <= stepIndex ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
        <CardTitle className="text-2xl font-bold">
          {currentStep === "avatar" && "Add a Profile Picture"}
          {currentStep === "info" && "Tell us about yourself"}
          {currentStep === "follow" && "Follow interesting people"}
        </CardTitle>
        <CardDescription>
          {currentStep === "avatar" && "Start by adding a face to your profile."}
          {currentStep === "info" && "Help people get to know you better."}
          {currentStep === "follow" && "Build your feed by following others."}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        
        {/* STEP: AVATAR */}
        {currentStep === "avatar" && (
          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-muted">
                <AvatarImage src={avatarPreview || ""} />
                <AvatarFallback className="text-4xl text-muted-foreground uppercase">
                  <Camera className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
              >
                <Camera className="h-8 w-8" />
              </label>
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarChange} 
                disabled={loading}
              />
            </div>
            <Button onClick={avatarPreview ? goNext : skipStep} className="w-full group">
              {avatarPreview ? "Looks good! Next" : "Skip for now"}
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}

        {/* STEP: BIO & INFO */}
        {currentStep === "info" && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="bio">About You</Label>
              <Textarea 
                id="bio" 
                placeholder="Write a couple of lines about yourself..." 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveInfo} className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Next Step
            </Button>
            <button
              onClick={skipStep}
              className="w-full text-center text-sm text-muted-foreground hover:underline"
            >
              Skip this step
            </button>
          </div>
        )}

        {/* STEP: FOLLOW */}
        {currentStep === "follow" && (
          <div className="space-y-4 py-2">
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {suggestions.length > 0 ? suggestions.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 border transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={resolveAvatarUrl(user.avatar)} />
                      <AvatarFallback>{user.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                  </div>
                  {followedIds.includes(user.id) ? (
                    <Button variant="outline" size="sm" className="bg-green-50 text-green-700 border-green-200" disabled>
                      <Check className="h-4 w-4 mr-1" /> Followed
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => handleFollow(user.id)}>
                      <UserPlus className="h-4 w-4 mr-1" /> Follow
                    </Button>
                  )}
                </div>
              )) : (
                <div className="text-center py-10 text-muted-foreground italic">
                  No suggestions available right now.
                </div>
              )}
            </div>
            <Button onClick={finish} className="w-full font-bold">
              Finish & Start Browsing
            </Button>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
