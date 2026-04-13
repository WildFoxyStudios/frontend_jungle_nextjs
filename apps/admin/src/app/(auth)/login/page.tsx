"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@jungle/api-client";
import { api } from "@jungle/api-client";
import { Button, Card, CardContent, Input, Label } from "@jungle/ui";
import { toast } from "sonner";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await authApi.login({ identifier: email, password });
      if (!res.user.is_admin) {
        toast.error("You are not authorized to access the admin panel");
        return;
      }
      api.setToken(res.access_token);
      document.cookie = `Jungle_logged_in=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      document.cookie = `Jungle_is_admin=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Jungle Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your admin account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
