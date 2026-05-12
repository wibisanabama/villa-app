import { supabase, supabaseAdmin } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mendapatkan daftar semua villa (Publik)
 */
export const getAllVillas = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('villas')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data villa', error: error.message });
  }
};

/**
 * Mendapatkan detail satu villa (Publik)
 */
export const getVillaById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('villas')
      .select('*, user_profiles(full_name, email, phone_number)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Villa tidak ditemukan' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil detail villa', error: error.message });
  }
};

/**
 * Mendapatkan daftar villa milik owner yang sedang login
 */
export const getMyVillas = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { data, error } = await supabase
      .from('villas')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data villa Anda', error: error.message });
  }
};

/**
 * Membuat villa baru (Khusus Owner/Super Admin)
 */
export const createVilla = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { name, description, location, price_per_night, capacity, facilities, is_active } = req.body;

    const { data, error } = await supabaseAdmin
      .from('villas')
      .insert([
        {
          owner_id: ownerId,
          name,
          description,
          location,
          price_per_night,
          capacity: capacity ? Number(capacity) : null,
          facilities: facilities ? (typeof facilities === 'string' ? JSON.parse(facilities) : facilities) : [],
          is_active: is_active ?? true,
          images: []
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Check if user is a GUEST and upgrade to OWNER
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', ownerId)
      .single();

    if (profile && profile.role === 'GUEST') {
      await supabaseAdmin
        .from('user_profiles')
        .update({ role: 'OWNER' })
        .eq('id', ownerId);
    }

    res.status(201).json({ message: 'Villa berhasil dibuat', villa: data });
  } catch (error) {
    console.error('Error creating villa:', error);
    res.status(500).json({ message: 'Gagal membuat villa', error: error.message });
  }
};

/**
 * Mengupdate data villa
 */
export const updateVilla = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;
    const updates = { ...req.body };

    // Pastikan fasilitas di-parse jika ada
    if (updates.facilities && typeof updates.facilities === 'string') {
      updates.facilities = JSON.parse(updates.facilities);
    }

    const { data, error } = await supabaseAdmin
      .from('villas')
      .update(updates)
      .eq('id', id)
      .eq('owner_id', ownerId) // RLS juga melindungi, tapi ini tambahan aman
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Villa berhasil diupdate', villa: data });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengupdate villa', error: error.message });
  }
};

/**
 * Menghapus villa
 */
export const deleteVilla = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    const { error } = await supabaseAdmin
      .from('villas')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId);

    if (error) throw error;
    res.json({ message: 'Villa berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus villa', error: error.message });
  }
};

/**
 * Upload gambar untuk villa
 */
export const uploadVillaImage = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diunggah' });
    }

    // 1. Verifikasi kepemilikan villa terlebih dahulu
    const { data: villa, error: villaError } = await supabase
      .from('villas')
      .select('images, owner_id')
      .eq('id', id)
      .single();

    if (villaError || !villa) {
      return res.status(404).json({ message: 'Villa tidak ditemukan' });
    }
    
    if (villa.owner_id !== ownerId) {
      return res.status(403).json({ message: 'Forbidden: Anda bukan pemilik villa ini' });
    }

    // 2. Upload file ke Supabase Storage (Pastikan Anda sudah membuat bucket 'villa-images')
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${id}/${uuidv4()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('villa-images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 3. Dapatkan Public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('villa-images')
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    // 4. Update tabel villas dengan URL gambar baru
    const currentImages = villa.images || [];
    const newImages = [...currentImages, imageUrl];

    const { error: updateError } = await supabaseAdmin
      .from('villas')
      .update({ images: newImages })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({ message: 'Gambar berhasil diunggah', imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengunggah gambar', error: error.message });
  }
};
