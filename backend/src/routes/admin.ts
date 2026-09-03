import { Router } from "express";
import { z } from "zod";
import { currentProfile, requireAdmin, requireAuth } from "../auth.js";
import { supabaseAdmin } from "../db.js";
import { ApiError, asyncHandler, ok, parse } from "../http.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/summary", asyncHandler(async (_request, response) => {
  const [users, villas, bookings, transactions, reviews] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("villas").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("bookings").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("transactions").select("amount", { count: "exact" }).eq("status", "PAID"),
    supabaseAdmin.from("transactions").select("id", { count: "exact", head: true }).eq("status", "REVIEW"),
  ]);
  const revenue = (transactions.data ?? []).reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  return ok(response, { users: users.count ?? 0, villas: villas.count ?? 0, bookings: bookings.count ?? 0, revenue, payment_reviews: reviews.count ?? 0 });
}));

router.get("/:resource", asyncHandler(async (request, response) => {
  const tableByResource = { users: "profiles", villas: "villas", bookings: "bookings", transactions: "transactions", plans: "subscription_plans", audits: "audit_logs" } as const;
  const resource = request.params.resource as keyof typeof tableByResource;
  const table = tableByResource[resource];
  if (!table) throw new ApiError(404, "RESOURCE_NOT_FOUND", "Resource admin tidak ditemukan.");
  const { data, error } = await supabaseAdmin.from(table).select("*").order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return ok(response, data);
}));

router.patch("/users/:id/suspension", asyncHandler(async (request, response) => {
  const actor = currentProfile(request);
  const input = parse(z.object({ suspended: z.boolean() }), request.body);
  if (actor.id === request.params.id && input.suspended) throw new ApiError(409, "CANNOT_SUSPEND_SELF", "Admin tidak dapat menonaktifkan akunnya sendiri.");
  const { data, error } = await supabaseAdmin.from("profiles").update({ is_suspended: input.suspended }).eq("id", request.params.id).select("*").single();
  if (error) throw error;
  await supabaseAdmin.from("audit_logs").insert({ actor_id: actor.id, action: input.suspended ? "USER_SUSPENDED" : "USER_RESTORED", entity_type: "profile", entity_id: request.params.id });
  return ok(response, data);
}));

router.patch("/villas/:id/activation", asyncHandler(async (request, response) => {
  const actor = currentProfile(request);
  const input = parse(z.object({ active: z.boolean() }), request.body);
  const { data, error } = await supabaseAdmin.from("villas").update({ is_active: input.active }).eq("id", request.params.id).select("*").single();
  if (error) throw error;
  await supabaseAdmin.from("audit_logs").insert({ actor_id: actor.id, action: input.active ? "VILLA_ACTIVATED" : "VILLA_DEACTIVATED", entity_type: "villa", entity_id: request.params.id });
  return ok(response, data);
}));

router.patch("/plans/:id", asyncHandler(async (request, response) => {
  const actor = currentProfile(request);
  const schema = z.object({
    name: z.string().min(2).max(80).optional(), description: z.string().max(500).optional(),
    price: z.number().int().nonnegative().optional(), villa_limit: z.number().int().positive().nullable().optional(),
    staff_limit: z.number().int().nonnegative().nullable().optional(), is_active: z.boolean().optional(),
  });
  const input = parse(schema, request.body);
  const { data, error } = await supabaseAdmin.from("subscription_plans").update(input).eq("id", request.params.id).select("*").single();
  if (error) throw error;
  await supabaseAdmin.from("audit_logs").insert({ actor_id: actor.id, action: "PLAN_UPDATED", entity_type: "subscription_plan", entity_id: request.params.id, metadata: input });
  return ok(response, data);
}));

export default router;

