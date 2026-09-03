import { Router } from "express";
import { subscriptionCheckoutSchema } from "@vilara/contracts";
import { currentProfile, requireAuth } from "../auth.js";
import { supabaseAdmin } from "../db.js";
import { ApiError, asyncHandler, ok, parse } from "../http.js";
import { createInvoice } from "../mayar.js";
import { activateSubscription, getOwnerPlan } from "../services.js";
import { env } from "../config.js";

const router = Router();

router.get("/plans", asyncHandler(async (_request, response) => {
  const { data, error } = await supabaseAdmin.from("subscription_plans").select("*").eq("is_active", true).order("price");
  if (error) throw error;
  return ok(response, data);
}));

router.get("/me", requireAuth, asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const subscription = await getOwnerPlan(profile.id);
  const [{ count: villaCount }, { count: staffCount }] = await Promise.all([
    supabaseAdmin.from("villas").select("id", { count: "exact", head: true }).eq("owner_id", profile.id).eq("is_active", true),
    supabaseAdmin.from("villa_memberships").select("id,villas!inner(owner_id)", { count: "exact", head: true }).eq("villas.owner_id", profile.id),
  ]);
  return ok(response, { subscription, usage: { villas: villaCount ?? 0, staff: staffCount ?? 0 } });
}));

router.post("/checkout", requireAuth, asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const input = parse(subscriptionCheckoutSchema, request.body);
  const { data: plan } = await supabaseAdmin.from("subscription_plans").select("*").eq("slug", input.plan_slug).eq("is_active", true).maybeSingle();
  if (!plan) throw new ApiError(404, "PLAN_NOT_FOUND", "Paket tidak ditemukan.");
  if (plan.price === 0) {
    const subscription = await activateSubscription(profile.id, plan.id);
    return ok(response, { payment_required: false, subscription });
  }
  if (!profile.phone_number) throw new ApiError(422, "PHONE_REQUIRED", "Lengkapi nomor telepon sebelum memilih paket berbayar.");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const reference = crypto.randomUUID();
  const invoice = await createInvoice({
    name: profile.full_name ?? profile.email, email: profile.email, mobile: profile.phone_number,
    description: `Langganan Vilara ${plan.name} selama 30 hari`, amount: Number(plan.price),
    redirectUrl: `${env.FRONTEND_URL}/payment/status?transaction=${reference}`,
    expiresAt, reference, kind: "SUBSCRIPTION",
  });
  const { data: transaction, error } = await supabaseAdmin.from("transactions").insert({
    id: reference, kind: "SUBSCRIPTION", user_id: profile.id, plan_id: plan.id, amount: plan.price,
    mayar_invoice_id: invoice.id, mayar_transaction_id: invoice.transactionId,
    payment_url: invoice.link, status: "UNPAID", expires_at: expiresAt.toISOString(),
  }).select("*").single();
  if (error) throw error;
  return ok(response, { payment_required: true, payment_url: invoice.link, transaction }, 201);
}));

export default router;

