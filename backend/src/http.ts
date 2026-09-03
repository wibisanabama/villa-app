import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export const asyncHandler = (handler: (request: Request, response: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (request, response, next) => { void handler(request, response, next).catch(next); };

export function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    throw new ApiError(422, "VALIDATION_ERROR", "Data yang dikirim belum valid.", fieldErrors);
  }
  return result.data;
}

export function ok<T>(response: Response, data: T, status = 200, meta?: Record<string, unknown>) {
  return response.status(status).json(meta ? { data, meta } : { data });
}

export function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

