import { Router } from "express";
import { z } from "zod";
import { currentProfile, requireAuth } from "../auth.js";
import { supabaseAdmin } from "../db.js";
import { ApiError, asyncHandler, ok, parse } from "../http.js";
import { getInvoice } from "../mayar.js";
import { activateSubscription } from "../services.js";
import { hasInvoiceBeenPaid } from "../state.js";

const router = Router();

router.get("/booking/:bookingId", requireAuth, asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const { data } = await supabaseAdmin.from("transactions").select("*,bookings!inner(id,status,guest_id,check_in_date,check_out_date,villas(name,location))").eq("booking_id", request.params.bookingId).eq("bookings.guest_id", profile.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!data) throw new ApiError(404, "TRANSACTION_NOT_FOUND", "Transaksi tidak ditemukan.");
  return ok(response, data);
}));

router.get("/:id", requireAuth, asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const { data } = await supabaseAdmin.from("transactions")
    .select("*,bookings(id,status,check_in_date,check_out_date,villas(name,location)),subscription_plans(name,slug)")
    .eq("id", request.params.id).eq("user_id", profile.id).maybeSingle();
  if (!data) throw new ApiError(404, "TRANSACTION_NOT_FOUND", "Transaksi tidak ditemukan.");
  return ok(response, data);
}));

const webhookSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.string().optional(), transactionId: z.string().optional(), productId: z.string().optional(), amount: z.number().optional(),
  }).passthrough(),
}).passthrough();

router.post("/webhooks/mayar", asyncHandler(async (request, response) => {
  const payload = parse(webhookSchema, request.body);
  if (payload.event !== "payment.received" && payload.event !== "payment.settled") return ok(response, { received: true });
  const reference = payload.data.productId ?? payload.data.transactionId ?? payload.data.id;
  if (!reference) return ok(response, { received: true });
  const { data: transaction } = await supabaseAdmin.from("transactions").select("*")
    .or(`mayar_invoice_id.eq.${reference},mayar_transaction_id.eq.${reference}`).maybeSingle();
  if (!transaction || transaction.status === "PAID") return ok(response, { received: true });
  if (!transaction.mayar_invoice_id) throw new ApiError(422, "MISSING_INVOICE_REFERENCE", "Referensi invoice tidak ditemukan.");
  const verified = await getInvoice(transaction.mayar_invoice_id);
  const paid = hasInvoiceBeenPaid(verified.status);
  const amountMatches = Number(verified.amount) === Number(transaction.amount);
  if (!paid || !amountMatches) {
    await supabaseAdmin.from("transactions").update({ status: "REVIEW", provider_payload: payload }).eq("id", transaction.id);
    if (transaction.booking_id) await supabaseAdmin.from("bookings").update({ status: "PAYMENT_REVIEW" }).eq("id", transaction.booking_id);
    return ok(response, { received: true, review: true });
  }
  await supabaseAdmin.from("transactions").update({ status: "PAID", paid_at: new Date().toISOString(), provider_payload: payload }).eq("id", transaction.id);
  if (transaction.kind === "BOOKING" && transaction.booking_id) {
    const { data: booking } = await supabaseAdmin.from("bookings").select("status,hold_expires_at").eq("id", transaction.booking_id).single();
    const holdValid = booking?.status === "PENDING_PAYMENT" && booking.hold_expires_at && new Date(booking.hold_expires_at) >= new Date();
    await supabaseAdmin.from("bookings").update({ status: holdValid ? "CONFIRMED" : "PAYMENT_REVIEW" }).eq("id", transaction.booking_id);
  } else if (transaction.kind === "SUBSCRIPTION" && transaction.plan_id) {
    await activateSubscription(transaction.user_id, transaction.plan_id, transaction.id);
  }
  return ok(response, { received: true });
}));

export default router;
