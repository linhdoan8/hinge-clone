import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { badRequest } from "../utils/errors.js";

/**
 * Zod validation middleware factory.
 * Validates req.body against the provided schema.
 * Returns 400 with structured errors if validation fails.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const path = issue.path.join(".") || "_root";
          if (!details[path]) {
            details[path] = [];
          }
          details[path].push(issue.message);
        }
        next(badRequest("Validation failed", details));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validates query parameters against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      (req as Request & { validatedQuery: unknown }).validatedQuery = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const path = issue.path.join(".") || "_root";
          if (!details[path]) {
            details[path] = [];
          }
          details[path].push(issue.message);
        }
        next(badRequest("Invalid query parameters", details));
      } else {
        next(error);
      }
    }
  };
}
