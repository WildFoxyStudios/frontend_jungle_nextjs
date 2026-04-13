"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@jungle/api-client";
import type { User } from "@jungle/api-client";

const AUTH_COOKIE = "Jungle_logged_in";
const ADMIN_COOKIE = "Jungle_is_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => {
        set({ user, isAuthenticated: true });
        if (user.is_admin) {
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
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      initialize: () => {
        const { accessToken } = get();
        if (accessToken) {
          api.setToken(accessToken);
        }
      },
    }),
    {
      name: "Jungle-auth",
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          api.setToken(state.accessToken);
          state.isAuthenticated = true;
          setCookie(AUTH_COOKIE, "1", COOKIE_MAX_AGE);
          if (state.user?.is_admin) {
            setCookie(ADMIN_COOKIE, "1", COOKIE_MAX_AGE);
          }
        } else {
          deleteCookie(AUTH_COOKIE);
          deleteCookie(ADMIN_COOKIE);
        }
      },
    },
  ),
);
