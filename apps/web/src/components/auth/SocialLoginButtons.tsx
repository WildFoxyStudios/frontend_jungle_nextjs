"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { Button } from "@jungle/ui";
import { toast } from "sonner";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
    FB?: {
      init: (config: object) => void;
      login: (
        callback: (response: { authResponse?: { accessToken: string } }) => void,
        options: object
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? "";

const ADDITIONAL_PROVIDERS = [
  { 
    id: "twitter", 
    name: "Twitter/X", 
    color: "#1DA1F2",
    icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> 
  },
  { 
    id: "linkedin", 
    name: "LinkedIn", 
    color: "#0A66C2",
    icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  },
  { 
    id: "instagram", 
    name: "Instagram", 
    color: "#E4405F",
    icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.355 2.618 6.778 6.98 6.978 1.28.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  },
  { 
    id: "apple", 
    name: "Apple", 
    color: "#000000",
    icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.82a3.69 3.69 0 00-1.297 3.713c1.35.104 2.734-.69 3.584-1.703z"/></svg>
  },
];

interface SocialLoginButtonsProps {
  onSuccess?: () => void;
}

export function SocialLoginButtons({ onSuccess }: SocialLoginButtonsProps) {
  const [showMore, setShowMore] = useState(false);
  const router = useRouter();
  const { handleAuthResponse } = useAuthStore();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleSocialAuth = async (provider: string, token: string) => {
    try {
      const res = await authApi.socialLogin(provider, token);
      handleAuthResponse(res);
      toast.success(`Signed in with ${provider}`);
      onSuccess?.();
      router.push("/feed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${provider} sign in failed`);
    }
  };

  // Load Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const scriptId = "google-gsi";
    if (document.getElementById(scriptId)) {
      initGoogle();
      return;
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
  }, []);

  function initGoogle() {
    if (!window.google || !googleBtnRef.current || !GOOGLE_CLIENT_ID) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        void handleSocialAuth("google", response.credential);
      },
    });
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline",
      size: "large",
      width: "100%",
      text: "continue_with",
    });
  }

  // Load Facebook SDK
  useEffect(() => {
    if (!FACEBOOK_APP_ID) return;
    const scriptId = "facebook-sdk";
    if (document.getElementById(scriptId)) return;
    window.fbAsyncInit = function () {
      window.FB?.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v19.0",
      });
    };
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  const handleFacebookLogin = () => {
    if (!window.FB) { toast.error("Facebook SDK not loaded"); return; }
    window.FB.login(
      (response) => {
        if (response.authResponse?.accessToken) {
          void handleSocialAuth("facebook", response.authResponse.accessToken);
        } else {
          toast.error("Facebook login cancelled");
        }
      },
      { scope: "email,public_profile" }
    );
  };

  if (!GOOGLE_CLIENT_ID && !FACEBOOK_APP_ID) return null;

  return (
    <div className="space-y-3">
      {GOOGLE_CLIENT_ID && (
        <div ref={googleBtnRef} className="w-full flex justify-center" />
      )}
      {FACEBOOK_APP_ID && (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 font-normal"
          onClick={handleFacebookLogin}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#1877F2]">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Continue with Facebook
        </Button>
      )}

      {showMore && (
        <div className="grid grid-cols-1 gap-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {ADDITIONAL_PROVIDERS.map((p) => (
            <Button
              key={p.id}
              type="button"
              variant="outline"
              className="w-full gap-2 font-normal justify-start px-4 h-11"
              style={{ borderLeft: `3px solid ${p.color}` }}
              onClick={() => {
                toast.info(`Redirecting to ${p.name}...`);
                // Generic redirect to server-handled social auth callback
                window.location.href = `/api/auth/social/${p.id}`;
              }}
            >
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
              Sign in with {p.name}
            </Button>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full text-xs text-muted-foreground gap-1"
        onClick={() => setShowMore(!showMore)}
      >
        {showMore ? (
          <>
            <ChevronUp className="h-3 w-3" /> Show less
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" /> More social options
          </>
        )}
      </Button>
    </div>
  );
}
