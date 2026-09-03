import { Router } from "express";
import { currentProfile, requireAuth } from "../auth.js";
import { supabaseAdmin } from "../db.js";
import { asyncHandler, ok } from "../http.js";

const router = Router();
router.use(requireAuth);
router.get("/summary", asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const { data: villas } = await supabaseAdmin.from("villas").select("id,name").eq("owner_id", profile.id);
  const ids = (villas ?? []).map((villa) => villa.id);
  if (!ids.length) return ok(response, { villas: 0, bookings: 0, confirmed: 0, revenue: 0, occupancy: 0, recent: [] });
  const { data: bookings } = await supabaseAdmin.from("bookings").select("*,villas(name)").in("villa_id", ids).order("created_at", { ascending: false });
  const paidStatuses = new Set(["CONFIRMED", "CHECKED_IN", "COMPLETED"]);
  const confirmed = (bookings ?? []).filter((booking) => paidStatuses.has(booking.status));
  const revenue = confirmed.reduce((sum, booking) => sum + Number(booking.total_price), 0);
  const occupiedNights = confirmed.reduce((sum, booking) => sum + Math.max(0, (new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / 86400000), 0);
  const occupancy = Math.min(100, Math.round(occupiedNights / (ids.length * 30) * 100));
  return ok(response, { villas: ids.length, bookings: bookings?.length ?? 0, confirmed: confirmed.length, revenue, occupancy, recent: (bookings ?? []).slice(0, 8) });
}));
export default router;

