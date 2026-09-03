import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { villaInputSchema } from "@vilara/contracts";
import { currentProfile, requireAuth } from "../auth.js";
import { supabaseAdmin } from "../db.js";
import { ApiError, asyncHandler, ok, parse, slugify } from "../http.js";
import { assertVillaOwner, getOwnerPlan } from "../services.js";

const router = Router();
const searchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  check_in: z.string().date().optional(), check_out: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(48).default(12),
});

router.get("/", asyncHandler(async (request, response) => {
  const query = parse(searchSchema, request.query);
  if ((query.check_in && !query.check_out) || (!query.check_in && query.check_out) || (query.check_in && query.check_out && query.check_in >= query.check_out)) {
    throw new ApiError(422, "INVALID_DATES", "Isi tanggal check-in dan check-out yang valid.");
  }
  let databaseQuery = supabaseAdmin.from("villas").select("*", { count: "exact" }).eq("is_active", true).order("created_at", { ascending: false });
  if (query.q) databaseQuery = databaseQuery.or(`name.ilike.%${query.q.replace(/[%_,]/g, "")}%,location.ilike.%${query.q.replace(/[%_,]/g, "")}%`);
  const { data: candidates, error } = await databaseQuery;
  if (error) throw error;
  let villas = candidates ?? [];
  if (query.check_in && query.check_out && villas.length) {
    const { data: conflicts } = await supabaseAdmin.from("bookings").select("villa_id")
      .in("villa_id", villas.map((villa) => villa.id))
      .in("status", ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN"])
      .lt("check_in_date", query.check_out).gt("check_out_date", query.check_in);
    const unavailable = new Set((conflicts ?? []).map((booking) => booking.villa_id));
    villas = villas.filter((villa) => !unavailable.has(villa.id));
  }
  const total = villas.length;
  const page = query.page ?? 1;
  const limit = query.limit ?? 12;
  const start = (page - 1) * limit;
  return ok(response, villas.slice(start, start + limit), 200, { page, limit, total });
}));

router.get("/mine", requireAuth, asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const { data, error } = await supabaseAdmin.from("villas").select("*").eq("owner_id", profile.id).order("created_at", { ascending: false });
  if (error) throw error;
  return ok(response, data);
}));

router.get("/:id", asyncHandler(async (request, response) => {
  const { data, error } = await supabaseAdmin.from("villas").select("*").eq("id", request.params.id).eq("is_active", true).maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "VILLA_NOT_FOUND", "Villa tidak ditemukan.");
  return ok(response, data);
}));

router.post("/", requireAuth, asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const input = parse(villaInputSchema, request.body);
  const subscription = await getOwnerPlan(profile.id);
  const planValue = subscription.subscription_plans as unknown;
  const plan = planValue as { villa_limit: number | null };
  const { count } = await supabaseAdmin.from("villas").select("id", { count: "exact", head: true }).eq("owner_id", profile.id).eq("is_active", true);
  if (plan.villa_limit !== null && (count ?? 0) >= plan.villa_limit) throw new ApiError(403, "VILLA_LIMIT_REACHED", "Batas villa paket Anda telah tercapai.");
  const baseSlug = slugify(input.name);
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
  const { data, error } = await supabaseAdmin.from("villas").insert({ ...input, owner_id: profile.id, slug }).select("*").single();
  if (error) throw error;
  return ok(response, data, 201);
}));

router.patch("/:id", requireAuth, asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  await assertVillaOwner(profile.id, String(request.params.id));
  const input = parse(villaInputSchema.partial(), request.body);
  const { data, error } = await supabaseAdmin.from("villas").update(input).eq("id", request.params.id).select("*").single();
  if (error) throw error;
  return ok(response, data);
}));

router.delete("/:id", requireAuth, asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  await assertVillaOwner(profile.id, String(request.params.id));
  const { count } = await supabaseAdmin.from("bookings").select("id", { count: "exact", head: true }).eq("villa_id", request.params.id);
  if ((count ?? 0) > 0) {
    await supabaseAdmin.from("villas").update({ is_active: false }).eq("id", request.params.id);
    return ok(response, { archived: true });
  }
  await supabaseAdmin.from("villas").delete().eq("id", request.params.id);
  return response.status(204).send();
}));

const upload = multer({
  storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_request, file, callback) => callback(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)),
});
router.post("/:id/images", requireAuth, upload.array("images", 8), asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const villa = await assertVillaOwner(profile.id, String(request.params.id));
  const files = (request.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) throw new ApiError(422, "INVALID_IMAGE", "Pilih minimal satu gambar JPG, PNG, atau WebP.");
  const urls: string[] = [];
  for (const file of files) {
    const extension = file.mimetype.split("/")[1]?.replace("jpeg", "jpg") ?? "webp";
    const path = `${villa.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabaseAdmin.storage.from("villa-images").upload(path, file.buffer, { contentType: file.mimetype });
    if (error) throw error;
    urls.push(supabaseAdmin.storage.from("villa-images").getPublicUrl(path).data.publicUrl);
  }
  const images = [...((villa.images as string[] | null) ?? []), ...urls].slice(0, 12);
  await supabaseAdmin.from("villas").update({ images }).eq("id", villa.id);
  return ok(response, { images }, 201);
}));

router.put("/:id/images/order", requireAuth, asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const villa = await assertVillaOwner(profile.id, String(request.params.id));
  const images = parse(z.array(z.string().url()).max(12), request.body.images);
  const existing = new Set((villa.images as string[] | null) ?? []);
  if (images.some((image) => !existing.has(image))) throw new ApiError(422, "INVALID_IMAGE_ORDER", "Urutan gambar tidak valid.");
  await supabaseAdmin.from("villas").update({ images }).eq("id", villa.id);
  return ok(response, { images });
}));

export default router;
