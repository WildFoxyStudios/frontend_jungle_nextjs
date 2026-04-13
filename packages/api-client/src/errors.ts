export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, string[]>,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class AuthError extends ApiError {
  constructor(message = "Unauthorized") {
    super("UNAUTHORIZED", message, undefined, 401);
    this.name = "AuthError";
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details: Record<string, string[]>) {
    super("VALIDATION_ERROR", message, details, 422);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super("NOT_FOUND", message, undefined, 404);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends ApiError {
  constructor(public readonly retryAfter: number) {
    super("RATE_LIMIT", "Too many requests", undefined, 429);
    this.name = "RateLimitError";
  }
}

export class NetworkError extends ApiError {
  constructor(message = "Network error") {
    super("NETWORK_ERROR", message);
    this.name = "NetworkError";
  }
}
