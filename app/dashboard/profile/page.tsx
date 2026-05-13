'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import styles from './profile.module.css';

export default function OwnerProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone_number: '' });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/search'); return; }
      setUser(session.user);

      const { data: p } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (p) {
        setProfile(p);
        setEditForm({ full_name: p.full_name || '', phone_number: p.phone_number || '' });
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('user_profiles')
      .update({ full_name: editForm.full_name, phone_number: editForm.phone_number })
      .eq('id', user.id);

    setSaving(false);
    if (!error) {
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
      setSuccessMsg('Profil berhasil diperbarui!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/search');
  };

  if (loading) return <div className={styles.loading}>Memuat profil...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Profil Saya</h1>

      {successMsg && (
        <div className={styles.successAlert}>{successMsg}</div>
      )}

      {/* Avatar & Info Card */}
      <div className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarLg}>
            {user?.email?.[0].toUpperCase() || 'O'}
          </div>
          <div>
            <div className={styles.displayName}>{profile?.full_name || user?.email}</div>
            <div className={styles.displayEmail}>{user?.email}</div>
            <span className={styles.roleBadge}>{profile?.role || 'OWNER'}</span>
          </div>
        </div>
      </div>

      {/* Info Details */}
      <div className={styles.detailCard}>
        <div className={styles.detailHeader}>
          <h2 className={styles.sectionTitle}>Informasi Akun</h2>
          {!isEditing && (
            <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
              Edit Profil
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className={styles.form}>
            <div className={styles.formRow}>
              <label className="label">Nama Lengkap</label>
              <input
                type="text"
                className="input"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="Nama lengkap Anda"
              />
            </div>
            <div className={styles.formRow}>
              <label className="label">Nomor Telepon</label>
              <input
                type="text"
                className="input"
                value={editForm.phone_number}
                onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                placeholder="e.g. 08123456789"
              />
            </div>
            <div className={styles.formActions}>
              <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Nama Lengkap</span>
              <span className={styles.infoValue}>{profile?.full_name || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>{user?.email}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Nomor Telepon</span>
              <span className={styles.infoValue}>{profile?.phone_number || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Role</span>
              <span className={styles.infoValue}>{profile?.role}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Bergabung Sejak</span>
              <span className={styles.infoValue}>
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Logout Section */}
      <div className={styles.dangerCard}>
        <div>
          <h3 className={styles.dangerTitle}>Keluar dari Akun</h3>
          <p className={styles.dangerDesc}>Anda akan keluar dari sesi ini dan diarahkan ke halaman utama.</p>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Keluar (Logout)
        </button>
      </div>
    </div>
  );
}
