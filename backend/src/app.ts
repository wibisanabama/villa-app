import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { ZodError } from "zod";
import { env } from "./config.js";
import { ApiError, asyncHandler, ok } from "./http.js";
import { requireAuth } from "./auth.js";
import { runMaintenance } from "./services.js";
import meRoutes from "./routes/me.js";
import villaRoutes from "./routes/villas.js";
import bookingRoutes from "./routes/bookings.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import paymentRoutes from "./routes/payments.js";
import staffRoutes from "./routes/staff.js";
import adminRoutes from "./routes/admin.js";

export const app = express();
app.set("trust proxy", 1);
app.use(pinoHttp({ redact: ["req.headers.authorization", "req.body.token", "req.body.access_token"] }));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.allowedOrigins.includes(origin)) return callback(null, true);
    callback(new ApiError(403, "ORIGIN_NOT_ALLOWED", "Origin tidak diizinkan."));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: env.NODE_ENV === "test" ? 10_000 : 120, standardHeaders: "draft-8", legacyHeaders: false }));

app.get("/api/health", (_request, response) => ok(response, { status: "ok", service: "vilara-api" }));
app.use("/api/v1/me", meRoutes);
app.use("/api/v1/villas", villaRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/staff", staffRoutes);
app.use("/api/v1/admin", adminRoutes);
app.post("/api/internal/maintenance", requireAuth, asyncHandler(async (request, response) => {
  if (request.headers["x-cron-secret"] !== env.INTERNAL_CRON_SECRET) throw new ApiError(403, "FORBIDDEN", "Cron secret tidak valid.");
  return ok(response, await runMaintenance());
}));

app.use((_request, _response, next) => next(new ApiError(404, "NOT_FOUND", "Endpoint tidak ditemukan.")));

const errorHandler: ErrorRequestHandler = (error: unknown, request, response, _next) => {
  request.log.error({ err: error }, "request failed");
  const apiError = error instanceof ApiError ? error : undefined;
  const status = apiError?.status ?? (error instanceof ZodError ? 422 : 500);
  const details = apiError?.details;
  response.status(status).json({
    error: {
      code: apiError?.code ?? "INTERNAL_ERROR",
      message: apiError?.message ?? "Terjadi kesalahan pada server.",
      ...(details && typeof details === "object" ? { fieldErrors: details } : {}),
      requestId: request.id,
    },
  });
};
app.use(errorHandler);
