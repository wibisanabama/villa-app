import { supabase, supabaseAdmin } from '../config/supabase.js';

/**
 * API: Mendapatkan metrik dashboard (Total Pendapatan, Total Pesanan, Chart Bulanan)
 * Endpoint: GET /api/analytics
 */
export const getDashboardMetrics = async (req, res) => {
  try {
    const ownerId = req.user.id;
    // Gunakan supabaseAdmin jika tersedia untuk menghindari kendala RLS di sisi backend yang sudah terautentikasi
    const client = supabaseAdmin || supabase;

    // 1. Dapatkan daftar villa milik owner
    const { data: villas, error: villasError } = await client
      .from('villas')
      .select('id')
      .eq('owner_id', ownerId);

    if (villasError) throw villasError;

    if (!villas || villas.length === 0) {
      return res.json({
        totalRevenue: 0,
        totalBookings: 0,
        completedBookings: 0,
        recentBookings: [],
        monthlyData: []
      });
    }

    const villaIds = villas.map(v => v.id);

    // 2. Dapatkan semua bookings untuk villa-villa tersebut (hanya yang statusnya bukan CANCELLED)
    const { data: bookings, error: bookingsError } = await client
      .from('bookings')
      .select('check_in_date, total_price, status')
      .in('villa_id', villaIds)
      .neq('status', 'CANCELLED');

    if (bookingsError) throw bookingsError;

    // 3. Kalkulasi metrik
    let totalRevenue = 0;
    let completedBookings = 0;
    const totalBookings = bookings.length;

    // Format data bulanan untuk chart: { "Jan": { revenue: 0, bookings: 0 }, "Feb": ... }
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyStats = {};
    months.forEach(m => monthlyStats[m] = { revenue: 0, bookings: 0 });

    const currentYear = new Date().getFullYear();

    bookings.forEach(booking => {
      // Kita hitung revenue hanya untuk yang COMPLETED atau CONFIRMED
      if (booking.status === 'COMPLETED' || booking.status === 'CONFIRMED') {
        totalRevenue += Number(booking.total_price);
        if (booking.status === 'COMPLETED') completedBookings++;
      }

      // Hitung metrik bulanan untuk tahun berjalan
      const checkIn = new Date(booking.check_in_date);
      if (checkIn.getFullYear() === currentYear) {
        const monthName = months[checkIn.getMonth()];
        monthlyStats[monthName].bookings += 1;
        
        if (booking.status === 'COMPLETED' || booking.status === 'CONFIRMED') {
           monthlyStats[monthName].revenue += Number(booking.total_price);
        }
      }
    });

    // 4. Dapatkan 5 pemesanan terbaru
    const { data: recentBookings, error: recentError } = await client
      .from('bookings')
      .select('id, guest_name, check_in_date, total_price, status, villas(name)')
      .in('villa_id', villaIds)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    // Ubah format bulanan menjadi array agar mudah di-render di chart Frontend
    const monthlyData = months.map(month => ({
      name: month,
      revenue: monthlyStats[month].revenue,
      bookings: monthlyStats[month].bookings
    }));

    res.json({
      totalRevenue,
      totalBookings,
      completedBookings,
      recentBookings,
      monthlyData
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Gagal mengambil data analitik', error: error.message });
  }
};
