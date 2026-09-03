import { createHash, randomBytes } from "node:crypto";
import { Router } from "express";
import { acceptInvitationSchema, invitationInputSchema } from "@vilara/contracts";
import { currentProfile, requireAuth } from "../auth.js";
import { env } from "../config.js";
import { supabaseAdmin } from "../db.js";
import { ApiError, asyncHandler, ok, parse } from "../http.js";
import { assertVillaOwner, getOwnerPlan } from "../services.js";

const router = Router();
router.use(requireAuth);
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

router.get("/", asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabaseAdmin.from("villa_memberships").select("*,profiles(id,email,full_name,avatar_url),villas!inner(id,name,owner_id)").eq("villas.owner_id", profile.id),
    supabaseAdmin.from("staff_invitations").select("*,villas!inner(id,name,owner_id)").eq("villas.owner_id", profile.id).order("created_at", { ascending: false }),
  ]);
  return ok(response, { members: members ?? [], invitations: invitations ?? [] });
}));

router.post("/invitations", asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const input = parse(invitationInputSchema, request.body);
  await assertVillaOwner(profile.id, input.villa_id);
  const subscription = await getOwnerPlan(profile.id);
  const plan = subscription.subscription_plans as unknown as { staff_limit: number | null };
  if (plan.staff_limit === 0) throw new ApiError(403, "STAFF_NOT_INCLUDED", "Paket Starter belum mencakup staf.");
  const { count } = await supabaseAdmin.from("villa_memberships").select("id,villas!inner(owner_id)", { count: "exact", head: true }).eq("villas.owner_id", profile.id);
  if (plan.staff_limit !== null && (count ?? 0) >= plan.staff_limit) throw new ApiError(403, "STAFF_LIMIT_REACHED", "Batas staf paket Anda telah tercapai.");
  const token = randomBytes(32).toString("base64url");
  const { data, error } = await supabaseAdmin.from("staff_invitations").insert({
    villa_id: input.villa_id, email: input.email.toLowerCase(), token_hash: tokenHash(token), created_by: profile.id,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }).select("id,email,status,expires_at,villa_id").single();
  if (error) throw error;
  return ok(response, { ...data, invitation_url: `${env.FRONTEND_URL}/invite?token=${encodeURIComponent(token)}` }, 201);
}));

router.delete("/invitations/:id", asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const { data: invitation } = await supabaseAdmin.from("staff_invitations").select("id,villa_id").eq("id", request.params.id).maybeSingle();
  if (!invitation) throw new ApiError(404, "INVITATION_NOT_FOUND", "Undangan tidak ditemukan.");
  await assertVillaOwner(profile.id, invitation.villa_id);
  await supabaseAdmin.from("staff_invitations").update({ status: "REVOKED" }).eq("id", invitation.id);
  return response.status(204).send();
}));

router.post("/invitations/accept", asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const input = parse(acceptInvitationSchema, request.body);
  const { data: invitation } = await supabaseAdmin.from("staff_invitations").select("*")
    .eq("token_hash", tokenHash(input.token)).eq("status", "PENDING").maybeSingle();
  if (!invitation || new Date(invitation.expires_at) < new Date()) throw new ApiError(410, "INVITATION_EXPIRED", "Undangan tidak valid atau telah berakhir.");
  if (invitation.email.toLowerCase() !== profile.email.toLowerCase()) throw new ApiError(403, "INVITATION_EMAIL_MISMATCH", "Masuklah dengan email yang menerima undangan.");
  const { data, error } = await supabaseAdmin.from("villa_memberships").upsert({ villa_id: invitation.villa_id, user_id: profile.id }, { onConflict: "villa_id,user_id" }).select("*").single();
  if (error) throw error;
  await supabaseAdmin.from("staff_invitations").update({ status: "ACCEPTED" }).eq("id", invitation.id);
  return ok(response, data, 201);
}));

router.delete("/:id", asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const { data: membership } = await supabaseAdmin.from("villa_memberships").select("id,villa_id").eq("id", request.params.id).maybeSingle();
  if (!membership) throw new ApiError(404, "MEMBERSHIP_NOT_FOUND", "Penugasan staf tidak ditemukan.");
  await assertVillaOwner(profile.id, membership.villa_id);
  await supabaseAdmin.from("villa_memberships").delete().eq("id", membership.id);
  return response.status(204).send();
}));

router.get("/assignments", asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const { data, error } = await supabaseAdmin.from("villa_memberships").select("*,villas(*)").eq("user_id", profile.id);
  if (error) throw error;
  return ok(response, data);
}));

export default router;

