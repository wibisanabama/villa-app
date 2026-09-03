import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "./db.js";
import { env } from "./config.js";
import { ApiError } from "./http.js";

export async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  try {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new ApiError(401, "UNAUTHENTICATED", "Silakan masuk terlebih dahulu.");
    const { data, error } = await supabaseAdmin.auth.getUser(header.slice(7));
    if (error || !data.user) throw new ApiError(401, "INVALID_SESSION", "Sesi tidak valid atau telah berakhir.");

    const email = (data.user.email ?? "").toLowerCase();
    const desiredRole = env.superAdminEmails.has(email) ? "SUPER_ADMIN" : undefined;
    let { data: profile } = await supabaseAdmin.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
    if (!profile) {
      const { data: created, error: createError } = await supabaseAdmin.from("profiles").upsert({
        id: data.user.id,
        email,
        full_name: data.user.user_metadata.full_name ?? email.split("@")[0],
        system_role: desiredRole ?? "USER",
      }).select("*").single();
      if (createError) throw createError;
      profile = created;
    } else if (desiredRole && profile.system_role !== desiredRole) {
      const { data: updated } = await supabaseAdmin.from("profiles").update({ system_role: desiredRole }).eq("id", data.user.id).select("*").single();
      profile = updated ?? profile;
    }
    if (profile.is_suspended) throw new ApiError(403, "ACCOUNT_SUSPENDED", "Akun ini sedang dinonaktifkan.");
    request.authUser = data.user;
    request.profile = profile;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(request: Request, _response: Response, next: NextFunction) {
  if (request.profile?.system_role !== "SUPER_ADMIN") return next(new ApiError(403, "FORBIDDEN", "Akses super-admin diperlukan."));
  next();
}

export function currentProfile(request: Request) {
  if (!request.profile) throw new ApiError(401, "UNAUTHENTICATED", "Silakan masuk terlebih dahulu.");
  return request.profile;
}

