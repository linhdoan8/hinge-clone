import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { unauthorized } from "../utils/errors.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw unauthorized("Missing or invalid authorization header");
    }

    const token = authHeader.substring(7);
    if (!token) {
      throw unauthorized("Missing token");
    }

    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    next();
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      next(error);
    } else {
      next(unauthorized("Invalid or expired token"));
    }
  }
}
