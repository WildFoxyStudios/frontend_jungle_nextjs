import type { AuthUser, AuthResponse } from "@jungle/api-client";
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
export declare const useAuthStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AuthState>, "setState" | "persist"> & {
    setState(partial: AuthState | Partial<AuthState> | ((state: AuthState) => AuthState | Partial<AuthState>), replace?: false | undefined): unknown;
    setState(state: AuthState | ((state: AuthState) => AuthState), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AuthState, {
            user: AuthUser | null;
            accessToken: string | null;
            refreshToken: string | null;
        }, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AuthState) => void) => () => void;
        onFinishHydration: (fn: (state: AuthState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AuthState, {
            user: AuthUser | null;
            accessToken: string | null;
            refreshToken: string | null;
        }, unknown>>;
    };
}>;
export {};
//# sourceMappingURL=use-auth.d.ts.map