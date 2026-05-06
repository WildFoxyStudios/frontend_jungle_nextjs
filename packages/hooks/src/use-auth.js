"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@jungle/api-client";
const AUTH_COOKIE = "Jungle_logged_in";
const ADMIN_COOKIE = "Jungle_is_admin";
const ADMIN_TOKEN_COOKIE = "Jungle_admin_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
/** Full admin or site moderator — admin Next app + `Jungle_is_admin` cookie. */
function canAccessAdminPanelStaff(u) {
    return Boolean(u?.is_admin || u?.is_moderator);
}
function setCookie(name, value, maxAge) {
    if (typeof document === "undefined")
        return;
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
function deleteCookie(name) {
    if (typeof document === "undefined")
        return;
    document.cookie = `${name}=; path=/; max-age=0`;
}
function readCookie(name) {
    if (typeof document === "undefined")
        return null;
    const target = `${name}=`;
    const parts = document.cookie.split(";");
    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.startsWith(target))
            return trimmed.slice(target.length);
    }
    return null;
}
/**
 * Look for a persisted auth snapshot in `localStorage`. Used as a "did this
 * browser have a session?" probe when the in-memory zustand state hasn't been
 * rehydrated yet (e.g. on the very first paint after a hard reload), so the
 * auth-failure handler can still kick in and redirect to `/login` instead of
 * leaving the user stranded.
 */
function hasPersistedSession() {
    if (typeof window === "undefined")
        return false;
    try {
        const raw = window.localStorage.getItem("Jungle-auth");
        if (!raw)
            return false;
        const parsed = JSON.parse(raw);
        return typeof parsed.state?.accessToken === "string"
            && parsed.state.accessToken.length > 0;
    }
    catch {
        return false;
    }
}
export const useAuthStore = create()(persist((set, get) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    handleAuthResponse: (res) => {
        api.setToken(res.access_token);
        api.setRefreshToken(res.refresh_token);
        setCookie(AUTH_COOKIE, "1", COOKIE_MAX_AGE);
        if (canAccessAdminPanelStaff(res.user)) {
            setCookie(ADMIN_COOKIE, "1", COOKIE_MAX_AGE);
            setCookie(ADMIN_TOKEN_COOKIE, encodeURIComponent(res.access_token), COOKIE_MAX_AGE);
        }
        else {
            deleteCookie(ADMIN_COOKIE);
            deleteCookie(ADMIN_TOKEN_COOKIE);
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
        if (canAccessAdminPanelStaff(user)) {
            setCookie(ADMIN_COOKIE, "1", COOKIE_MAX_AGE);
            const token = get().accessToken;
            if (token) {
                setCookie(ADMIN_TOKEN_COOKIE, encodeURIComponent(token), COOKIE_MAX_AGE);
            }
        }
        else {
            deleteCookie(ADMIN_COOKIE);
            deleteCookie(ADMIN_TOKEN_COOKIE);
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
        deleteCookie(ADMIN_TOKEN_COOKIE);
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
            // Trust any signal that the user was previously authenticated:
            // the in-memory store (post-rehydration), the persisted snapshot
            // (pre-rehydration), or the `Jungle_logged_in` cookie. Without this
            // an auth failure that fires before zustand rehydrates would leave
            // the user stranded on a 401-spamming page with no redirect.
            const hadSession = state.isAuthenticated || hasPersistedSession() || readCookie(AUTH_COOKIE) === "1";
            if (!hadSession)
                return;
            state.logout();
            if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
                window.location.href = "/login";
            }
        });
        api.setOnTokenRefreshed((newAccessToken, newRefreshToken) => {
            setCookie(AUTH_COOKIE, "1", COOKIE_MAX_AGE);
            if (canAccessAdminPanelStaff(get().user)) {
                setCookie(ADMIN_TOKEN_COOKIE, encodeURIComponent(newAccessToken), COOKIE_MAX_AGE);
            }
            set({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            });
        });
    },
}), {
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
            if (canAccessAdminPanelStaff(state.user)) {
                setCookie(ADMIN_COOKIE, "1", COOKIE_MAX_AGE);
                setCookie(ADMIN_TOKEN_COOKIE, encodeURIComponent(state.accessToken), COOKIE_MAX_AGE);
            }
            else {
                deleteCookie(ADMIN_COOKIE);
                deleteCookie(ADMIN_TOKEN_COOKIE);
            }
            api.setOnAuthFailure(() => {
                const s = useAuthStore.getState();
                const hadSession = s.isAuthenticated || hasPersistedSession() || readCookie(AUTH_COOKIE) === "1";
                if (!hadSession)
                    return;
                s.logout();
                if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
                    window.location.href = "/login";
                }
            });
            api.setOnTokenRefreshed((newAccessToken, newRefreshToken) => {
                setCookie(AUTH_COOKIE, "1", COOKIE_MAX_AGE);
                if (canAccessAdminPanelStaff(useAuthStore.getState().user)) {
                    setCookie(ADMIN_TOKEN_COOKIE, encodeURIComponent(newAccessToken), COOKIE_MAX_AGE);
                }
                useAuthStore.setState({
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                });
            });
        }
        else {
            deleteCookie(AUTH_COOKIE);
            deleteCookie(ADMIN_COOKIE);
            deleteCookie(ADMIN_TOKEN_COOKIE);
        }
    },
}));
//# sourceMappingURL=use-auth.js.map