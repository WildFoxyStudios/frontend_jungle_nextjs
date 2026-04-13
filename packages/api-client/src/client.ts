import {
  ApiError,
  AuthError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "./errors";

type RefreshCallback = { resolve: (ok: boolean) => void };
type AuthFailureHandler = () => void;
type RefreshTokenUpdater = (accessToken: string, refreshToken: string) => void;

export class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;
  private authFailureFired = false;
  private baseUrl: string;
  private onAuthFailure: AuthFailureHandler | null = null;
  private onTokenRefreshed: RefreshTokenUpdater | null = null;

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl;
  }

  setToken(token: string): void {
    this.accessToken = token;
    this.authFailureFired = false;
  }

  setRefreshToken(token: string): void {
    this.refreshToken = token;
  }

  clearToken(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  setOnAuthFailure(handler: AuthFailureHandler): void {
    this.onAuthFailure = handler;
  }

  setOnTokenRefreshed(handler: RefreshTokenUpdater): void {
    this.onTokenRefreshed = handler;
  }

  private fireAuthFailure(): void {
    if (this.authFailureFired) return;
    this.authFailureFired = true;
    this.onAuthFailure?.();
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
    } catch {
      throw new NetworkError();
    }

    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.handleRefresh();
      if (!refreshed) {
        this.fireAuthFailure();
        throw new AuthError();
      }

      headers["Authorization"] = `Bearer ${this.accessToken!}`;
      try {
        response = await fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });
      } catch {
        throw new NetworkError();
      }

      if (response.status === 401) {
        this.fireAuthFailure();
        throw new AuthError();
      }
    } else if (response.status === 401) {
      this.fireAuthFailure();
      throw new AuthError();
    }

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? response.headers.get("retry-after") ?? 60);
      throw new RateLimitError(retryAfter);
    }

    return this.handleResponse<T>(response);
  }

  private async handleRefresh(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.doRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async doRefresh(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const res = await fetch(`${this.baseUrl}/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (!res.ok) return false;

      const raw = (await res.json()) as Record<string, unknown>;
      const data = (raw && typeof raw === "object" && "data" in raw ? raw.data : raw) as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.onTokenRefreshed?.(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) return undefined as T;

    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      if (!response.ok) throw new ApiError("PARSE_ERROR", text, undefined, response.status);
      return text as unknown as T;
    }

    if (!response.ok) {
      const err = data as { error?: { code?: string; message?: string; details?: Record<string, string[]> } };
      const code = err.error?.code ?? "UNKNOWN";
      const message = err.error?.message ?? "An error occurred";
      const details = err.error?.details;

      if (response.status === 404) throw new NotFoundError(message);
      if (response.status === 422) throw new ValidationError(message, details ?? {});
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? 60);
        throw new RateLimitError(retryAfter);
      }
      throw new ApiError(code, message, details, response.status);
    }

    const envelope = data as Record<string, unknown>;
    if (envelope && typeof envelope === "object" && "data" in envelope && Object.keys(envelope).length === 1) {
      return envelope.data as T;
    }
    return data as T;
  }

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = params
      ? `${path}?${new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)]),
          ),
        ).toString()}`
      : path;
    return this.request<T>(url, { method: "GET" });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    const opts: RequestInit = { method: "POST" };
    if (body !== undefined) opts.body = JSON.stringify(body);
    return this.request<T>(path, opts);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    const opts: RequestInit = { method: "PUT" };
    if (body !== undefined) opts.body = JSON.stringify(body);
    return this.request<T>(path, opts);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    const opts: RequestInit = { method: "PATCH" };
    if (body !== undefined) opts.body = JSON.stringify(body);
    return this.request<T>(path, opts);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }

  upload<T>(
    path: string,
    formData: FormData,
    onProgress?: (pct: number) => void,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", path.startsWith("http") ? path : `${this.baseUrl}${path}`);

      if (this.accessToken) {
        xhr.setRequestHeader("Authorization", `Bearer ${this.accessToken}`);
      }

      if (onProgress) {
        xhr.upload.addEventListener("progress", (e: ProgressEvent) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
      }

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText) as T);
          } catch {
            resolve(xhr.responseText as unknown as T);
          }
        } else {
          reject(new ApiError("UPLOAD_ERROR", xhr.statusText, undefined, xhr.status));
        }
      });

      xhr.addEventListener("error", () => reject(new NetworkError()));
      xhr.send(formData);
    });
  }
}

export const api = new ApiClient(
  typeof window !== "undefined"
    ? (process.env["NEXT_PUBLIC_API_URL"] ?? "/api")
    : (process.env["API_URL"] ?? "/api"),
);
