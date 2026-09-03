import { Router } from "express";
import multer from "multer";
import { profileInputSchema } from "@vilara/contracts";
import { currentProfile, requireAuth } from "../auth.js";
import { asyncHandler, ApiError, ok, parse } from "../http.js";
import { supabaseAdmin } from "../db.js";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const [{ count: owned }, { count: assigned }] = await Promise.all([
    supabaseAdmin.from("villas").select("id", { count: "exact", head: true }).eq("owner_id", profile.id),
    supabaseAdmin.from("villa_memberships").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
  ]);
  return ok(response, { ...profile, capabilities: { is_owner: (owned ?? 0) > 0, is_staff: (assigned ?? 0) > 0, is_admin: profile.system_role === "SUPER_ADMIN" } });
}));

router.patch("/", asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  const input = parse(profileInputSchema, request.body);
  const { data, error } = await supabaseAdmin.from("profiles").update(input).eq("id", profile.id).select("*").single();
  if (error) throw error;
  return ok(response, data);
}));

const upload = multer({
  storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => callback(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)),
});
router.post("/avatar", upload.single("avatar"), asyncHandler(async (request, response) => {
  const profile = currentProfile(request);
  if (!request.file) throw new ApiError(422, "INVALID_IMAGE", "Pilih gambar JPG, PNG, atau WebP maksimal 2 MB.");
  const extension = request.file.mimetype.split("/")[1]?.replace("jpeg", "jpg") ?? "webp";
  const path = `${profile.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabaseAdmin.storage.from("avatars").upload(path, request.file.buffer, { contentType: request.file.mimetype });
  if (error) throw error;
  const { data: url } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);
  await supabaseAdmin.from("profiles").update({ avatar_url: url.publicUrl }).eq("id", profile.id);
  return ok(response, { avatar_url: url.publicUrl }, 201);
}));

export default router;

