import { supabaseAdmin } from "./db.js";
import { ApiError } from "./http.js";

export async function getOwnerPlan(ownerId: string) {
  const { data } = await supabaseAdmin.from("account_subscriptions")
    .select("id,status,starts_at,expires_at,grace_ends_at,subscription_plans(*)")
    .eq("user_id", ownerId).in("status", ["ACTIVE", "GRACE"]).maybeSingle();
  if (data) return data;
  const { data: starter } = await supabaseAdmin.from("subscription_plans").select("id").eq("slug", "starter").single();
  const { data: created, error } = await supabaseAdmin.from("account_subscriptions")
    .insert({ user_id: ownerId, plan_id: starter?.id, status: "ACTIVE" })
    .select("id,status,starts_at,expires_at,grace_ends_at,subscription_plans(*)").single();
  if (error) throw error;
  return created;
}

export async function assertVillaOwner(userId: string, villaId: string) {
  const { data } = await supabaseAdmin.from("villas").select("*").eq("id", villaId).eq("owner_id", userId).maybeSingle();
  if (!data) throw new ApiError(403, "VILLA_FORBIDDEN", "Anda bukan pemilik villa ini.");
  return data;
}

export async function assertVillaAccess(userId: string, villaId: string) {
  const { data: owned } = await supabaseAdmin.from("villas").select("id,owner_id").eq("id", villaId).eq("owner_id", userId).maybeSingle();
  if (owned) return { role: "OWNER" as const, villa: owned };
  const { data: membership } = await supabaseAdmin.from("villa_memberships")
    .select("id,villa_id,villas(owner_id)").eq("villa_id", villaId).eq("user_id", userId).maybeSingle();
  if (!membership) throw new ApiError(403, "VILLA_FORBIDDEN", "Anda tidak memiliki akses ke villa ini.");
  return { role: "STAFF" as const, villa: membership };
}

export async function activateSubscription(userId: string, planId: string, transactionId?: string) {
  const { data: current } = await supabaseAdmin.from("account_subscriptions")
    .select("id,plan_id,expires_at").eq("user_id", userId).in("status", ["ACTIVE", "GRACE"]).maybeSingle();
  const now = new Date();
  const samePlanFuture = current?.plan_id === planId && current.expires_at && new Date(current.expires_at) > now;
  const startsAt = samePlanFuture ? new Date(current.expires_at) : now;
  const expiresAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  const graceEndsAt = new Date(expiresAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (current) await supabaseAdmin.from("account_subscriptions").update({ status: "CANCELLED" }).eq("id", current.id);
  const { data, error } = await supabaseAdmin.from("account_subscriptions").insert({
    user_id: userId, plan_id: planId, status: "ACTIVE", starts_at: now.toISOString(),
    expires_at: expiresAt.toISOString(), grace_ends_at: graceEndsAt.toISOString(),
  }).select("*").single();
  if (error) throw error;
  if (transactionId) await supabaseAdmin.from("audit_logs").insert({
    actor_id: userId, action: "SUBSCRIPTION_ACTIVATED", entity_type: "subscription",
    entity_id: data.id, metadata: { transaction_id: transactionId },
  });
  return data;
}

export async function runMaintenance() {
  const { data: summary, error } = await supabaseAdmin.rpc("reconcile_vilara");
  if (error) throw error;
  const { data: starter } = await supabaseAdmin.from("subscription_plans").select("id,villa_limit").eq("slug", "starter").single();
  const { data: expired } = await supabaseAdmin.from("account_subscriptions").select("user_id")
    .eq("status", "EXPIRED").lte("updated_at", new Date().toISOString());
  let downgraded = 0;
  for (const item of expired ?? []) {
    const { data: active } = await supabaseAdmin.from("account_subscriptions").select("id")
      .eq("user_id", item.user_id).in("status", ["ACTIVE", "GRACE"]).maybeSingle();
    if (active || !starter) continue;
    await supabaseAdmin.from("account_subscriptions").insert({ user_id: item.user_id, plan_id: starter.id, status: "ACTIVE" });
    const { data: villas } = await supabaseAdmin.from("villas").select("id").eq("owner_id", item.user_id)
      .eq("is_active", true).order("created_at", { ascending: true });
    const overflow = (villas ?? []).slice(starter.villa_limit ?? 1);
    if (overflow.length) await supabaseAdmin.from("villas").update({ is_active: false }).in("id", overflow.map((villa) => villa.id));
    downgraded += 1;
  }
  return { summary, downgraded };
}

