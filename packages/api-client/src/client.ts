import {
  ApiError,
  AuthError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "./errors";

type RefreshCallback = (token: string) => void;

export class ApiClient {
  private accessToken: string | null = null;
  private isRefreshing = false;
  private refreshQueue: Array<RefreshCallback> = [];
  private baseUrl: string;

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl;
  }

  setToken(token: string): void {
    this.accessToken = token;
  }

  clearToken(): void {
    this.accessToken = null;
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

    if (response.status === 401) {
      const refreshed = await this.handleRefresh();
      if (!refreshed) throw new AuthError();

      // Retry with new token
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

      if (response.status === 401) throw new AuthError();
    }

    return this.handleResponse<T>(response);
  }

  private async handleRefresh(): Promise<boolean> {
    if (this.isRefreshing) {
      return new Promise<boolean>((resolve) => {
        this.refreshQueue.push((token) => {
          this.accessToken = token;
          resolve(true);
        });
      });
    }

    this.isRefreshing = true;
    try {
      const res = await fetch(`${this.baseUrl}/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        this.isRefreshing = false;
        this.refreshQueue = [];
        return false;
      }

      const data = (await res.json()) as { access_token: string };
      this.accessToken = data.access_token;
      this.refreshQueue.forEach((cb) => cb(data.access_token));
      this.refreshQueue = [];
      this.isRefreshing = false;
      return true;
    } catch {
      this.isRefreshing = false;
      this.refreshQueue = [];
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
