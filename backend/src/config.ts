import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),
  SUPER_ADMIN_EMAILS: z.string().default(""),
  MAYAR_API_KEY: z.string().default(""),
  MAYAR_API_URL: z.string().url().default("https://api.mayar.id/hl/v1"),
  INTERNAL_CRON_SECRET: z.string().min(24).default("development-only-cron-secret"),
});

const result = environmentSchema.safeParse(process.env);
if (!result.success) {
  throw new Error(`Konfigurasi backend tidak valid: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
}

export const env = {
  ...result.data,
  allowedOrigins: result.data.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
  superAdminEmails: new Set(result.data.SUPER_ADMIN_EMAILS.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean)),
};

