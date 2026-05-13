import { supabaseAdmin, supabase } from '../config/supabase.js';

const client = supabaseAdmin || supabase;

/**
 * GET /api/subscriptions
 * Mendapatkan semua paket langganan (Publik)
 */
export const getAllPlans = async (req, res) => {
  try {
    const { data, error } = await client
      .from('subscriptions')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data paket', error: error.message });
  }
};

/**
 * GET /api/subscriptions/me
 * Mendapatkan paket langganan owner yang sedang login
 */
export const getMySubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile, error: profileError } = await client
      .from('user_profiles')
      .select('subscription_id, subscriptions(id, name, slug, price, max_villas, features, description)')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Count current villas
    const { count, error: countError } = await client
      .from('villas')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId);

    if (countError) throw countError;

    const subscription = profile?.subscriptions || null;
    const maxVillas = subscription?.max_villas ?? 1;

    res.json({
      subscription,
      villa_count: count || 0,
      max_villas: maxVillas,
      can_add_villa: maxVillas === -1 || (count || 0) < maxVillas
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data langganan', error: error.message });
  }
};

/**
 * POST /api/subscriptions/upgrade
 * Upgrade paket langganan (untuk saat ini langsung switch tanpa payment gateway)
 */
export const upgradePlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan_slug } = req.body;

    if (!plan_slug) {
      return res.status(400).json({ message: 'plan_slug wajib diisi' });
    }

    // Get target plan
    const { data: plan, error: planError } = await client
      .from('subscriptions')
      .select('*')
      .eq('slug', plan_slug)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ message: 'Paket tidak ditemukan' });
    }

    // Update user's subscription
    const { error: updateError } = await client
      .from('user_profiles')
      .update({ subscription_id: plan.id })
      .eq('id', userId);

    if (updateError) throw updateError;

    res.json({
      message: `Berhasil beralih ke paket ${plan.name}`,
      subscription: plan
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengubah paket', error: error.message });
  }
};
