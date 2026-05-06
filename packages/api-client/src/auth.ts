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

/**
 * Returned when the backend's unusual-login heuristic blocks the sign-in:
 * the client must ask the user for the email code and POST it back to
 * `/v1/auth/verify-unusual-login` along with the opaque `challenge_token`.
 */
export interface UnusualLoginChallenge {
  requires_unusual_login_verification: true;
  challenge_token: string;
  email_masked: string;
}

export type LoginResult = AuthResponse | TwoFactorRequired | UnusualLoginChallenge;

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  gender?: string;
  phone_number?: string;
  invite_code?: string;
}

/** Custom field row exposed by `GET /v1/auth/register-config`. */
export interface CustomRegisterField {
  id: number;
  name: string;
  description: string;
  field_type: "text" | "textarea" | "select" | "number" | "date" | "boolean";
  required: boolean;
  /** JSON array for `select` fields; unused for others. */
  options: unknown;
  placement: "register" | "profile" | "both";
  sort_order: number;
}

export interface RegisterConfig {
  registration_mode: "open" | "invite_only" | "approval_required" | "closed";
  require_email_verification: boolean;
  require_phone_verification: boolean;
  invite_required: boolean;
  custom_fields: CustomRegisterField[];
  genders: { id: number; name: string }[];
}

export interface RegisterResponse extends AuthResponse {
  needs_phone_verification: boolean;
  needs_email_verification: boolean;
  inviter_id: number | null;
}

function isAuthResponse(data: LoginResult): data is AuthResponse {
  return "access_token" in data;
}

function isUnusualLoginChallenge(
  data: LoginResult,
): data is UnusualLoginChallenge {
  return "requires_unusual_login_verification" in data;
}

export const authApi = {
  login: async (data: LoginPayload): Promise<LoginResult> => {
    const res = await api.post<LoginResult>("/v1/auth/login", data);
    return res;
  },

  register: (data: RegisterPayload) =>
    api.post<RegisterResponse>("/v1/auth/register", data),

  /**
   * Pre-register bundle: registration mode, verification requirements,
   * custom profile fields and gender options. Safe to call without auth.
   */
  getRegisterConfig: () =>
    api.get<RegisterConfig>("/v1/auth/register-config"),

  /**
   * Completes the unusual-login challenge flow. On success the backend
   * returns the same `AuthResponse` shape a vanilla login would.
   */
  verifyUnusualLogin: (challenge_token: string, code: string) =>
    api.post<AuthResponse>("/v1/auth/verify-unusual-login", {
      challenge_token,
      code,
    }),

  logout: () => api.post<void>("/v1/auth/logout"),

  refresh: () =>
    api.post<{ access_token: string; expires_in: number }>("/v1/auth/refresh"),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>("/v1/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>("/v1/auth/reset-password", { token, password }),

  /**
   * Confirm an email verification code. The backend matches the code
   * against the `email_code` column, so both the code AND the target
   * email are required to find the right row.
   */
  verifyEmail: (email: string, code: string) =>
    api.post<{ verified: boolean }>("/v1/auth/verify-email", { email, code }),

  /**
   * One-shot email activation — the whole link-based flow.
   * The backend locates the user purely via the unique `email_code`
   * column, so there is no need to supply an email address.
   */
  activateByCode: (code: string) =>
    api.post<{ verified: boolean; message: string }>(
      "/v1/auth/verify-email-by-code",
      { code },
    ),

  /**
   * Confirm an SMS verification code. Codes are stored in Redis keyed by
   * the full `phone_number` string.
   */
  verifyPhone: (phone: string, code: string) =>
    api.post<{ verified: boolean }>("/v1/auth/verify-phone", { phone, code }),

  /**
   * Request a fresh verification code. The backend accepts either
   * `email` or `phone` (or both) and decides which channel to use.
   */
  resendVerification: (target: { email?: string; phone?: string }) =>
    api.post<{ message: string }>("/v1/auth/resend-code", target),

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
  isUnusualLoginChallenge,
};
