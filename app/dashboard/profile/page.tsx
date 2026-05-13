'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { fetchWithAuth } from '../../../lib/api';

export default function OwnerProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.replace('/search'); return; }
        setUser(session.user);

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
          setFullName(profile.full_name || profile.email?.split('@')[0] || '');
          setPhoneNumber(profile.phone_number || '');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/search');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await fetchWithAuth('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ full_name: fullName, phone_number: phoneNumber })
      });

      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        await fetchWithAuth('/auth/me/avatar', { method: 'POST', body: formData });
      }

      setSuccess('Profil berhasil diperbarui!');
      setIsEditing(false);

      const { data: profile } = await supabase
        .from('user_profiles').select('*').eq('id', user.id).single();
      if (profile) setUserProfile(profile);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Memuat profil...</div>;
  }

  if (!user) return null;

  const displayAvatar = userProfile?.avatar_url;
  const initial = (userProfile?.full_name || userProfile?.email || user?.email || 'O').charAt(0).toUpperCase();

  return (
    <div style={{ maxWidth: '800px' }}>
      {success && (
        <div style={{ padding: '1rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'center' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        {/* Cover Header */}
        <div style={{ height: '120px', background: 'linear-gradient(135deg, var(--primary), #6366f1)' }}></div>

        <div style={{ padding: '0 2rem 2rem 2rem', position: 'relative' }}>
          {/* Avatar */}
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '2.5rem',
            color: 'var(--primary)', border: '4px solid var(--surface)',
            marginTop: '-50px', marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-sm)', overflow: 'hidden', position: 'relative'
          }}>
            {displayAvatar ? (
              <img src={displayAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : initial}
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} style={{ marginBottom: '2.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Foto Profil Baru (Opsional)</label>
                <input type="file" accept="image/*" className="input" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} style={{ padding: '0.4rem' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Nama Lengkap / Username</label>
                <input type="text" required className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Nomor Telepon (Opsional)</label>
                <input type="tel" className="input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="08123456789" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => { setIsEditing(false); setAvatarFile(null); }} disabled={saving}>
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--foreground)' }}>
                    {userProfile?.full_name || userProfile?.email?.split('@')[0] || user?.email?.split('@')[0]}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{userProfile?.email || user.email}</p>
                </div>
                <button onClick={() => setIsEditing(true)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                  Edit Profil
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Role Akun</p>
                  <p style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                    {userProfile?.role === 'SUPER_ADMIN' ? 'Super Admin' : userProfile?.role === 'OWNER' ? 'Pemilik Properti (Owner)' : userProfile?.role === 'STAFF' ? 'Staf Pengelola' : 'Pengguna Biasa (Guest)'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Nomor Telepon</p>
                  <p style={{ fontWeight: 600, color: 'var(--foreground)' }}>{userProfile?.phone_number || '-'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Menu Utama</h3>

            {/* Dashboard quick access */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', backgroundColor: '#e0e7ff', borderRadius: 'var(--radius-md)', border: '1px solid #c7d2fe' }}>
              <div>
                <h4 style={{ fontWeight: 600, color: '#3730a3', marginBottom: '0.25rem' }}>Manajemen Properti</h4>
                <p style={{ fontSize: '0.875rem', color: '#4f46e5' }}>Kelola villa, pesanan, dan analitik di halaman lain.</p>
              </div>
              <a href="/dashboard" className="btn btn-primary" style={{ whiteSpace: 'nowrap', textDecoration: 'none' }}>
                Buka Dashboard
              </a>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ width: '100%', borderColor: '#f87171', color: '#b91c1c', marginTop: '1rem' }}
            >
              Keluar (Logout)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
