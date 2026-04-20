import { api } from "./client";
import type { AuthUser, UserSession } from "./types/index";

export interface LoginPayload {
  identifier: string;
  password: string;
  two_factor_code?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
}

export interface TwoFactorRequired {
  requires_2fa: true;
  session_token: string;
}

export type LoginResult = AuthResponse | TwoFactorRequired;

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  invite_code?: string;
}

function isAuthResponse(data: LoginResult): data is AuthResponse {
  return "access_token" in data;
}

export const authApi = {
  login: async (data: LoginPayload): Promise<LoginResult> => {
    const res = await api.post<LoginResult>("/v1/auth/login", data);
    return res;
  },

  register: (data: RegisterPayload) =>
    api.post<AuthResponse>("/v1/auth/register", data),

  logout: () => api.post<void>("/v1/auth/logout"),

  refresh: () =>
    api.post<{ access_token: string; expires_in: number }>("/v1/auth/refresh"),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>("/v1/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>("/v1/auth/reset-password", { token, password }),

  verifyEmail: (code: string) =>
    api.post<{ message: string }>("/v1/auth/verify-email", { code }),

  verifyPhone: (code: string) =>
    api.post<{ message: string }>("/v1/auth/verify-phone", { code }),

  resendVerification: (type: "email" | "phone") =>
    api.post<{ message: string }>("/v1/auth/resend-code", { type }),

  enable2FA: () =>
    api.post<{ qr_code: string; secret: string }>("/v1/auth/2fa/enable"),

  disable2FA: (code: string) =>
    api.post<void>("/v1/auth/2fa/disable", { code }),

  verify2FA: (code: string) =>
    api.post<AuthResponse>("/v1/auth/2fa/verify", { code }),

  getBackupCodes: () =>
    api.get<{ codes: string[] }>("/v1/auth/2fa/backup-codes"),

  socialLogin: (provider: string, access_token: string) =>
    api.post<AuthResponse>("/v1/auth/social/login", { provider, access_token }),

  getSessions: () =>
    api.get<UserSession[]>("/v1/auth/sessions"),

  revokeSession: (id: string) =>
    api.delete<void>(`/v1/auth/sessions/${id}`),

  changePassword: (current_password: string, new_password: string) =>
    api.put<{ message: string }>("/v1/auth/password", { current_password, new_password }),

  /**
   * Set an initial password on an OAuth/social-login account that doesn't
   * have one yet. Matches the backend endpoint added alongside the nullable
   * `users.password_hash` migration. Use `changePassword` instead once a
   * password is already set.
   */
  setSocialPassword: (new_password: string) =>
    api.post<{ changed: boolean; message: string }>(
      "/v1/auth/social/set-password",
      { new_password },
    ),

  isAuthResponse,
};
