"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@jungle/api-client";
import type { AuthUser, AuthResponse } from "@jungle/api-client";

const AUTH_COOKIE = "Jungle_logged_in";
const ADMIN_COOKIE = "Jungle_is_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  handleAuthResponse: (res: AuthResponse) => void;
  setUser: (user: AuthUser) => void;
  setToken: (token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      handleAuthResponse: (res: AuthResponse) => {
        api.setToken(res.access_token);
        api.setRefreshToken(res.refresh_token);
        setCookie(AUTH_COOKIE, "1", COOKIE_MAX_AGE);
        if (res.user?.is_admin) {
          setCookie(ADMIN_COOKIE, "1", COOKIE_MAX_AGE);
        }
        set({
          user: res.user,
          accessToken: res.access_token,
          refreshToken: res.refresh_token,
          isAuthenticated: true,
        });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true });
        if (user?.is_admin) {
          setCookie(ADMIN_COOKIE, "1", COOKIE_MAX_AGE);
        }
      },

      setToken: (token) => {
        api.setToken(token);
        setCookie(AUTH_COOKIE, "1", COOKIE_MAX_AGE);
        set({ accessToken: token, isAuthenticated: true });
      },

      logout: () => {
        api.clearToken();
        deleteCookie(AUTH_COOKIE);
        deleteCookie(ADMIN_COOKIE);
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      initialize: () => {
        const { accessToken, refreshToken } = get();
        if (accessToken) {
          api.setToken(accessToken);
        }
        if (refreshToken) {
          api.setRefreshToken(refreshToken);
        }

        api.setOnAuthFailure(() => {
          const state = get();
          if (!state.isAuthenticated) return;
          state.logout();
          if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
            window.location.href = "/login";
          }
        });

        api.setOnTokenRefreshed((newAccessToken, newRefreshToken) => {
          setCookie(AUTH_COOKIE, "1", COOKIE_MAX_AGE);
          set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          });
        });
      },
    }),
    {
      name: "Jungle-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          api.setToken(state.accessToken);
          if (state.refreshToken) {
            api.setRefreshToken(state.refreshToken);
          }
          state.isAuthenticated = true;
          setCookie(AUTH_COOKIE, "1", COOKIE_MAX_AGE);
          if (state.user?.is_admin) {
            setCookie(ADMIN_COOKIE, "1", COOKIE_MAX_AGE);
          }

          api.setOnAuthFailure(() => {
            const s = useAuthStore.getState();
            if (!s.isAuthenticated) return;
            s.logout();
            if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
              window.location.href = "/login";
            }
          });

          api.setOnTokenRefreshed((newAccessToken, newRefreshToken) => {
            setCookie(AUTH_COOKIE, "1", COOKIE_MAX_AGE);
            useAuthStore.setState({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            });
          });
        } else {
          deleteCookie(AUTH_COOKIE);
          deleteCookie(ADMIN_COOKIE);
        }
      },
    },
  ),
);
