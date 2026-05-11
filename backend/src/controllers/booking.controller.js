import { supabase } from '../config/supabase.js';

/**
 * Utilitas untuk mengecek ketersediaan tanggal
 */
const checkDateAvailability = async (villaId, checkInDate, checkOutDate) => {
  // Cek apakah ada booking yang statusnya tidak CANCELLED dan 
  // tanggal check-in/check-out-nya beririsan dengan permintaan baru
  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('villa_id', villaId)
    .neq('status', 'CANCELLED')
    .or(`and(check_in_date.lte.${checkOutDate},check_out_date.gte.${checkInDate})`);

  if (error) {
    throw error;
  }

  // Jika data.length > 0, artinya ada tanggal yang beririsan (tidak tersedia)
  return data.length === 0;
};

/**
 * API: Cek ketersediaan villa pada tanggal tertentu (Publik)
 */
export const checkAvailability = async (req, res) => {
  try {
    const { villaId, checkIn, checkOut } = req.query;

    if (!villaId || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'villaId, checkIn, dan checkOut harus diisi' });
    }

    // Validasi basic tanggal
    if (new Date(checkIn) >= new Date(checkOut)) {
      return res.status(400).json({ message: 'Tanggal check-out harus lebih besar dari check-in' });
    }

    const isAvailable = await checkDateAvailability(villaId, checkIn, checkOut);

    res.json({ available: isAvailable });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengecek ketersediaan', error: error.message });
  }
};

/**
 * API: Membuat Booking baru (Publik / Guest Terautentikasi)
 */
export const createBooking = async (req, res) => {
  try {
    const { 
      villa_id, 
      check_in_date, 
      check_out_date, 
      guest_name, 
      guest_email, 
      guest_phone 
    } = req.body;

    // Ambil guest_id jika user sedang login, jika tidak biarkan null
    const guestId = req.user?.id || null;

    // 1. Cek ketersediaan sekali lagi sebelum insert
    const isAvailable = await checkDateAvailability(villa_id, check_in_date, check_out_date);
    if (!isAvailable) {
      return res.status(400).json({ message: 'Tanggal tersebut sudah dibooking. Silakan pilih tanggal lain.' });
    }

    // 2. Ambil harga per malam dari villa
    const { data: villa, error: villaError } = await supabase
      .from('villas')
      .select('price_per_night')
      .eq('id', villa_id)
      .single();

    if (villaError || !villa) {
      return res.status(404).json({ message: 'Villa tidak ditemukan' });
    }

    // 3. Kalkulasi total harga
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const timeDifference = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDifference / (1000 * 3600 * 24));
    
    if (nights <= 0) {
       return res.status(400).json({ message: 'Durasi menginap tidak valid' });
    }
    
    const totalPrice = nights * villa.price_per_night;

    // 4. Insert ke tabel bookings
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert([
        {
          villa_id,
          guest_id: guestId,
          guest_name,
          guest_email,
          guest_phone,
          check_in_date,
          check_out_date,
          total_price: totalPrice,
          status: 'PENDING'
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json({ message: 'Booking berhasil dibuat', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal membuat booking', error: error.message });
  }
};

/**
 * API: Mendapatkan daftar booking untuk suatu villa (Khusus Owner)
 */
export const getVillaBookings = async (req, res) => {
  try {
    const { villaId } = req.params;
    const ownerId = req.user.id;

    // Verifikasi kepemilikan villa
    const { data: villa, error: villaError } = await supabase
      .from('villas')
      .select('owner_id')
      .eq('id', villaId)
      .single();

    if (villaError || !villa) {
      return res.status(404).json({ message: 'Villa tidak ditemukan' });
    }

    if (villa.owner_id !== ownerId) {
       return res.status(403).json({ message: 'Forbidden: Anda bukan pemilik villa ini' });
    }

    // Ambil daftar booking
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('villa_id', villaId)
      .order('created_at', { ascending: false });

    if (bookingsError) throw bookingsError;

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data booking', error: error.message });
  }
};

/**
 * API: Mendapatkan daftar booking milik tamu yang sedang login
 */
export const getMyBookings = async (req, res) => {
  try {
    const guestId = req.user.id;

    const { data, error } = await supabase
      .from('bookings')
      .select('*, villas(name, location, images)')
      .eq('guest_id', guestId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data pesanan Anda', error: error.message });
  }
};

/**
 * API: Update status booking (Owner mengonfirmasi/membatalkan)
 */
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // e.g., 'CONFIRMED', 'CANCELLED', 'COMPLETED'
    const userId = req.user.id;
    const userRole = req.user.role;

    // Cek booking ada atau tidak
    const { data: booking, error: getError } = await supabase
      .from('bookings')
      .select('*, villas(owner_id)')
      .eq('id', id)
      .single();

    if (getError || !booking) {
      return res.status(404).json({ message: 'Booking tidak ditemukan' });
    }

    // Validasi Otorisasi: Owner hanya bisa update booking vilanya, Tamu hanya bisa cancel miliknya
    if (userRole === 'OWNER') {
        if (booking.villas.owner_id !== userId) {
             return res.status(403).json({ message: 'Forbidden' });
        }
    } else if (userRole === 'GUEST' || !userRole) {
        // Guest hanya boleh membatalkan pesanan (bukan mengonfirmasi)
        if (booking.guest_id !== userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        if (status !== 'CANCELLED') {
            return res.status(400).json({ message: 'Tamu hanya diizinkan membatalkan pesanan' });
        }
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ message: `Status booking berhasil diupdate menjadi ${status}`, booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengupdate status booking', error: error.message });
  }
};
