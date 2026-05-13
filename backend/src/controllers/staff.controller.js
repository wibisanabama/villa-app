import { supabase, supabaseAdmin } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mendapatkan daftar staff dari villa milik owner
 */
export const getMyStaff = async (req, res) => {
  try {
    const ownerId = req.user.id;
    
    // Ambil staff yang terhubung dengan villa milik owner ini
    const { data, error } = await supabaseAdmin
      .from('villa_staff')
      .select(`
        id,
        created_at,
        villas!inner (id, name, owner_id),
        user_profiles (id, full_name, email, phone_number, role)
      `)
      .eq('villas.owner_id', ownerId);

    if (error) throw error;
    
    // Filter data yang null (karena inner join logic di supabase JS agak tricky, kita filter di sini)
    const validStaff = data.filter(s => s.villas !== null);
    res.json(validStaff);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data staff', error: error.message });
  }
};

/**
 * Mendapatkan daftar undangan yang belum diterima
 */
export const getInvitations = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('staff_invitations')
      .select('*, villas(name)')
      .eq('created_by', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil daftar undangan', error: error.message });
  }
};

/**
 * Membuat undangan baru
 */
export const inviteStaff = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { email, villa_id } = req.body;

    if (!email || !villa_id) {
      return res.status(400).json({ message: 'Email dan ID Villa wajib diisi' });
    }

    // Pastikan villa ini adalah milik owner
    const { data: villa } = await supabaseAdmin.from('villas').select('id').eq('id', villa_id).eq('owner_id', ownerId).single();
    if (!villa) {
      return res.status(403).json({ message: 'Villa tidak ditemukan atau bukan milik Anda' });
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3); // Valid 3 hari

    const { data, error } = await supabaseAdmin
      .from('staff_invitations')
      .insert([
        {
          villa_id,
          email,
          token,
          expires_at: expiresAt.toISOString(),
          created_by: ownerId,
          status: 'PENDING'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // TODO: Kirim email beneran (menggunakan nodemailer/resend)
    // Untuk saat ini, kita kembalikan tokennya supaya bisa dites di UI
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite?token=${token}`;
    
    res.status(201).json({ message: 'Undangan berhasil dibuat', invitation: data, inviteLink });
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat undangan', error: error.message });
  }
};

/**
 * Membatalkan undangan
 */
export const revokeInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    const { error } = await supabaseAdmin
      .from('staff_invitations')
      .update({ status: 'REVOKED' })
      .eq('id', id)
      .eq('created_by', ownerId);

    if (error) throw error;
    res.json({ message: 'Undangan dibatalkan' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal membatalkan undangan', error: error.message });
  }
};

/**
 * Menghapus staff dari villa
 */
export const removeStaff = async (req, res) => {
  try {
    const { id } = req.params; // id dari tabel villa_staff
    const ownerId = req.user.id;

    // Verifikasi kepemilikan
    const { data: staffData } = await supabaseAdmin
      .from('villa_staff')
      .select('villas(owner_id), user_id')
      .eq('id', id)
      .single();

    if (!staffData || staffData.villas.owner_id !== ownerId) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses' });
    }

    const { error } = await supabaseAdmin.from('villa_staff').delete().eq('id', id);
    if (error) throw error;

    // Opsional: cek apakah staff ini masih punya assignment lain. Jika tidak, set role kembali ke GUEST.
    const { data: otherAssignments } = await supabaseAdmin.from('villa_staff').select('id').eq('user_id', staffData.user_id);
    if (!otherAssignments || otherAssignments.length === 0) {
      await supabaseAdmin.from('user_profiles').update({ role: 'GUEST' }).eq('id', staffData.user_id);
    }

    res.json({ message: 'Staff berhasil dihapus dari villa' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus staff', error: error.message });
  }
};

/**
 * Publik: Accept invitation by Staff
 */
export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.body;
    // req.user di sini adalah user (calon staff) yang sedang login
    const staffId = req.user.id;
    const staffEmail = req.user.email;

    // Cari undangan yang valid
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('staff_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'PENDING')
      .single();

    if (inviteError || !invite) {
      return res.status(404).json({ message: 'Undangan tidak valid atau sudah kadaluarsa' });
    }

    if (new Date(invite.expires_at) < new Date()) {
      await supabaseAdmin.from('staff_invitations').update({ status: 'EXPIRED' }).eq('id', invite.id);
      return res.status(400).json({ message: 'Undangan sudah kadaluarsa' });
    }

    // Meskipun ada email yg tertera, di skenario aslinya kita bisa memperbolehkan user login dgn email apapun.
    // Tapi untuk keamanan, baiknya crosscheck email, atau asalkan login sudah cukup. Kita skip email check agar fleksibel, 
    // atau jika Anda strict: if (invite.email !== staffEmail) ...

    // Update profil role jadi STAFF
    await supabaseAdmin.from('user_profiles').update({ role: 'STAFF' }).eq('id', staffId);

    // Masukkan ke mapping table
    const { error: mappingError } = await supabaseAdmin
      .from('villa_staff')
      .insert([{ villa_id: invite.villa_id, user_id: staffId }]);
      
    if (mappingError && mappingError.code !== '23505') { // abaikan jika sudah pernah ada (unique violation)
      throw mappingError;
    }

    // Ubah status undangan
    await supabaseAdmin.from('staff_invitations').update({ status: 'ACCEPTED' }).eq('id', invite.id);

    res.json({ message: 'Berhasil bergabung sebagai Staff' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menerima undangan', error: error.message });
  }
};
