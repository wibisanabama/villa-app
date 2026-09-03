import { Router } from "express";
import { bookingTransitionSchema, cancellationInputSchema, cancellationReviewSchema, checkoutSchema } from "@vilara/contracts";
import { currentProfile, requireAuth } from "../auth.js";
import { env } from "../config.js";
import { supabaseAdmin } from "../db.js";
import { ApiError, asyncHandler, ok, parse } from "../http.js";
import { createInvoice } from "../mayar.js";
import { assertVillaAccess, assertVillaOwner } from "../services.js";
import { canTransitionBooking } from "../state.js";

const router = Router();
router.use(requireAuth);

router.post("/checkout", asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const input = parse(checkoutSchema, request.body);
  const { data: villa } = await supabaseAdmin.from("villas").select("id,name").eq("id", input.villa_id).eq("is_active", true).maybeSingle();
  if (!villa) throw new ApiError(404, "VILLA_NOT_FOUND", "Villa tidak ditemukan.");
  const { data: booking, error: holdError } = await supabaseAdmin.rpc("create_booking_hold", {
    p_villa_id: input.villa_id, p_guest_id: profile.id, p_guest_name: input.guest_name,
    p_guest_email: profile.email, p_guest_phone: input.guest_phone,
    p_check_in: input.check_in_date, p_check_out: input.check_out_date,
  });
  if (holdError) {
    const code = holdError.message.includes("DATES_UNAVAILABLE") ? "DATES_UNAVAILABLE" : "BOOKING_FAILED";
    throw new ApiError(code === "DATES_UNAVAILABLE" ? 409 : 422, code, code === "DATES_UNAVAILABLE" ? "Tanggal tersebut baru saja dipesan." : "Booking tidak dapat dibuat.");
  }
  const hold = booking as { id: string; total_price: number; hold_expires_at: string };
  try {
    const invoice = await createInvoice({
      name: input.guest_name, email: profile.email, mobile: input.guest_phone,
      description: `${villa.name}, ${input.check_in_date}–${input.check_out_date}`,
      amount: Number(hold.total_price), redirectUrl: `${env.FRONTEND_URL}/payment/status?booking=${hold.id}`,
      expiresAt: new Date(hold.hold_expires_at), reference: hold.id, kind: "BOOKING",
    });
    const { data: transaction, error } = await supabaseAdmin.from("transactions").insert({
      kind: "BOOKING", user_id: profile.id, booking_id: hold.id, amount: hold.total_price,
      mayar_invoice_id: invoice.id, mayar_transaction_id: invoice.transactionId, payment_url: invoice.link,
      status: "UNPAID", expires_at: hold.hold_expires_at,
    }).select("*").single();
    if (error) throw error;
    return ok(response, { booking: hold, transaction, payment_url: invoice.link }, 201);
  } catch (error) {
    await supabaseAdmin.from("bookings").update({ status: "EXPIRED" }).eq("id", hold.id);
    throw error;
  }
}));

router.get("/mine", asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const { data, error } = await supabaseAdmin.from("bookings")
    .select("*,villas(name,location,images),booking_cancellations(*)")
    .eq("guest_id", profile.id).order("created_at", { ascending: false });
  if (error) throw error;
  return ok(response, data);
}));

router.get("/villa/:villaId", asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  await assertVillaAccess(profile.id, String(request.params.villaId));
  const { data, error } = await supabaseAdmin.from("bookings")
    .select("*,booking_cancellations(*)").eq("villa_id", request.params.villaId)
    .order("check_in_date", { ascending: true });
  if (error) throw error;
  return ok(response, data);
}));

router.patch("/:id/status", asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const input = parse(bookingTransitionSchema, request.body);
  const { data: booking } = await supabaseAdmin.from("bookings").select("*,villas(owner_id)").eq("id", request.params.id).maybeSingle();
  if (!booking) throw new ApiError(404, "BOOKING_NOT_FOUND", "Booking tidak ditemukan.");
  const access = await assertVillaAccess(profile.id, booking.villa_id);
  if (!canTransitionBooking(access.role, booking.status, input.status)) throw new ApiError(409, "INVALID_TRANSITION", "Perubahan status booking tidak diizinkan.");
  const { data, error } = await supabaseAdmin.from("bookings").update({ status: input.status }).eq("id", booking.id).select("*").single();
  if (error) throw error;
  return ok(response, data);
}));

router.post("/:id/cancellation", asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const input = parse(cancellationInputSchema, request.body);
  const { data: booking } = await supabaseAdmin.from("bookings").select("*").eq("id", request.params.id).eq("guest_id", profile.id).maybeSingle();
  if (!booking) throw new ApiError(404, "BOOKING_NOT_FOUND", "Booking tidak ditemukan.");
  if (booking.status === "PENDING_PAYMENT") {
    await supabaseAdmin.from("bookings").update({ status: "CANCELLED" }).eq("id", booking.id);
    return ok(response, { status: "CANCELLED" }, 201);
  }
  if (booking.status !== "CONFIRMED") throw new ApiError(409, "CANCELLATION_NOT_ALLOWED", "Booking ini tidak dapat dibatalkan.");
  const { data, error } = await supabaseAdmin.from("booking_cancellations").insert({ booking_id: booking.id, requested_by: profile.id, reason: input.reason }).select("*").single();
  if (error) throw error;
  await supabaseAdmin.from("bookings").update({ status: "CANCELLATION_REQUESTED" }).eq("id", booking.id);
  return ok(response, data, 201);
}));

router.patch("/:id/cancellation", asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const input = parse(cancellationReviewSchema, request.body);
  const { data: booking } = await supabaseAdmin.from("bookings").select("id,villa_id").eq("id", request.params.id).maybeSingle();
  if (!booking) throw new ApiError(404, "BOOKING_NOT_FOUND", "Booking tidak ditemukan.");
  await assertVillaOwner(profile.id, booking.villa_id);
  if (input.decision === "REFUNDED" && !input.refund_reference) throw new ApiError(422, "REFUND_REFERENCE_REQUIRED", "Referensi refund wajib diisi.");
  const { data: cancellation } = await supabaseAdmin.from("booking_cancellations").select("*").eq("booking_id", booking.id).in("status", ["REQUESTED", "APPROVED"]).maybeSingle();
  if (!cancellation) throw new ApiError(404, "CANCELLATION_NOT_FOUND", "Permintaan pembatalan tidak ditemukan.");
  const { data, error } = await supabaseAdmin.from("booking_cancellations").update({
    status: input.decision, reviewed_by: profile.id, review_note: input.note, refund_reference: input.refund_reference,
  }).eq("id", cancellation.id).select("*").single();
  if (error) throw error;
  await supabaseAdmin.from("bookings").update({ status: input.decision === "REJECTED" ? "CONFIRMED" : "CANCELLED" }).eq("id", booking.id);
  return ok(response, data);
}));

export default router;
