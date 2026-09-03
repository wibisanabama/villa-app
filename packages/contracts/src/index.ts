import { z } from "zod";

export const idSchema = z.string().uuid();
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const bookingStatuses = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CHECKED_IN",
  "COMPLETED",
  "EXPIRED",
  "CANCELLATION_REQUESTED",
  "CANCELLED",
  "PAYMENT_REVIEW",
] as const;
export const bookingStatusSchema = z.enum(bookingStatuses);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const transactionStatuses = ["UNPAID", "PAID", "FAILED", "EXPIRED", "REVIEW"] as const;
export const transactionStatusSchema = z.enum(transactionStatuses);
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;

export const profileSchema = z.object({
  id: idSchema,
  email: z.string().email(),
  full_name: z.string().nullable(),
  phone_number: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  system_role: z.enum(["USER", "SUPER_ADMIN"]),
  is_suspended: z.boolean(),
});
export type Profile = z.infer<typeof profileSchema>;

export const villaSchema = z.object({
  id: idSchema,
  owner_id: idSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  location: z.string(),
  price_per_night: z.number().nonnegative(),
  capacity: z.number().int().positive(),
  facilities: z.array(z.string()),
  images: z.array(z.string().url()),
  is_active: z.boolean(),
  created_at: z.string(),
});
export type Villa = z.infer<typeof villaSchema>;

export const bookingSchema = z.object({
  id: idSchema,
  villa_id: idSchema,
  guest_id: idSchema,
  guest_name: z.string(),
  guest_email: z.string().email(),
  guest_phone: z.string().nullable(),
  check_in_date: dateSchema,
  check_out_date: dateSchema,
  total_price: z.number().nonnegative(),
  status: bookingStatusSchema,
  hold_expires_at: z.string().nullable(),
  created_at: z.string(),
  villas: z.object({ name: z.string(), location: z.string(), images: z.array(z.string()) }).optional(),
});
export type Booking = z.infer<typeof bookingSchema>;

export const planSchema = z.object({
  id: idSchema,
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().nonnegative(),
  villa_limit: z.number().int().positive().nullable(),
  staff_limit: z.number().int().nonnegative().nullable(),
  features: z.array(z.string()),
  is_popular: z.boolean(),
  is_active: z.boolean(),
});
export type SubscriptionPlan = z.infer<typeof planSchema>;

export const villaInputSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(3000).optional().default(""),
  location: z.string().trim().min(3).max(180),
  price_per_night: z.coerce.number().int().positive(),
  capacity: z.coerce.number().int().min(1).max(100),
  facilities: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
});

export const checkoutSchema = z.object({
  villa_id: idSchema,
  check_in_date: dateSchema,
  check_out_date: dateSchema,
  guest_name: z.string().trim().min(2).max(120),
  guest_phone: z.string().trim().min(8).max(25),
}).superRefine((value, context) => {
  if (value.check_in_date >= value.check_out_date) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["check_out_date"], message: "Tanggal check-out harus setelah check-in" });
  }
});

export const profileInputSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone_number: z.string().trim().min(8).max(25).nullable(),
});

export const bookingTransitionSchema = z.object({ status: bookingStatusSchema });
export const cancellationInputSchema = z.object({ reason: z.string().trim().min(10).max(1000) });
export const cancellationReviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "REFUNDED"]),
  note: z.string().trim().max(1000).optional(),
  refund_reference: z.string().trim().max(200).optional(),
});

export const invitationInputSchema = z.object({ villa_id: idSchema, email: z.string().email() });
export const acceptInvitationSchema = z.object({ token: z.string().min(32).max(256) });
export const subscriptionCheckoutSchema = z.object({ plan_slug: z.enum(["starter", "professional", "enterprise"]) });

export interface ApiSuccess<T> { data: T; meta?: Record<string, unknown> }
export interface ApiFailure { error: { code: string; message: string; fieldErrors?: Record<string, string[]>; requestId?: string } }

