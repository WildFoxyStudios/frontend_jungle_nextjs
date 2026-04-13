import { api } from "./client";
import type { User } from "./types/index";

export interface LoginPayload {
  identifier: string;
  password: string;
  two_factor_code?: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
  requires_2fa?: boolean;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  invite_code?: string;
}

export const authApi = {
  login: (data: LoginPayload) => api.post<LoginResponse>("/v1/auth/login", data),
  register: (data: RegisterPayload) => api.post<LoginResponse>("/v1/auth/register", data),
  logout: () => api.post<void>("/v1/auth/logout"),
  refresh: () => api.post<{ access_token: string }>("/v1/auth/refresh"),
  forgotPassword: (email: string) => api.post<void>("/v1/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.post<void>("/v1/auth/reset-password", { token, password }),
  verifyEmail: (code: string) => api.post<void>("/v1/auth/verify-email", { code }),
  verifyPhone: (code: string) => api.post<void>("/v1/auth/verify-phone", { code }),
  resendVerification: (type: "email" | "phone") =>
    api.post<void>("/v1/auth/resend-code", { type }),
  enable2FA: () => api.post<{ qr_code: string; secret: string }>("/v1/auth/2fa/enable"),
  disable2FA: (code: string) => api.post<void>("/v1/auth/2fa/disable", { code }),
  verify2FA: (code: string) => api.post<{ access_token: string }>("/v1/auth/2fa/verify", { code }),
  getBackupCodes: () => api.get<{ codes: string[] }>("/v1/auth/2fa/backup-codes"),
  socialLogin: (provider: string, code: string) =>
    api.post<LoginResponse>(`/v1/auth/social/${provider}`, { code }),
  getSessions: () => api.get<import("./types/index").UserSession[]>("/v1/auth/sessions"),
  revokeSession: (id: string) => api.delete<void>(`/v1/auth/sessions/${id}`),
  changePassword: (current_password: string, new_password: string) =>
    api.put<void>("/v1/auth/password", { current_password, new_password }),
};
