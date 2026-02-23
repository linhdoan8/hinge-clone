export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function notFound(message = "Resource not found"): AppError {
  return new AppError(message, 404, "NOT_FOUND");
}

export function badRequest(
  message = "Bad request",
  details?: Record<string, string[]>
): AppError {
  return new AppError(message, 400, "BAD_REQUEST", details);
}

export function unauthorized(message = "Unauthorized"): AppError {
  return new AppError(message, 401, "UNAUTHORIZED");
}

export function forbidden(message = "Forbidden"): AppError {
  return new AppError(message, 403, "FORBIDDEN");
}

export function conflict(message = "Conflict"): AppError {
  return new AppError(message, 409, "CONFLICT");
}

export function tooManyRequests(message = "Too many requests"): AppError {
  return new AppError(message, 429, "TOO_MANY_REQUESTS");
}

export function internal(message = "Internal server error"): AppError {
  return new AppError(message, 500, "INTERNAL_ERROR");
}
