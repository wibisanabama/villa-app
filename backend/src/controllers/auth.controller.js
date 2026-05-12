import { supabase, supabaseAdmin } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

export const getProfile = async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        role,
        full_name,
        phone_number,
        avatar_url,
        email,
        created_at,
        subscriptions (
          id,
          name,
          features
        )
      `)
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return res.status(404).json({ message: 'User profile not found in database', error: error.message });
    }

    res.json({
      message: 'Profile retrieved successfully',
      user: {
        id: req.user.id,
        ...profile
      }
    });
  } catch (error) {
    console.error('Auth /me error:', error);
    res.status(500).json({ message: 'Error retrieving profile data' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { full_name, phone_number } = req.body;
    
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .update({ full_name, phone_number })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diunggah' });
    }

    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${userId}/${uuidv4()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const avatarUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    res.json({ message: 'Avatar berhasil diunggah', avatarUrl });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Gagal mengunggah avatar', error: error.message });
  }
};
