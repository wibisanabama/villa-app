'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../../lib/api';
import styles from './staff.module.css';

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [villas, setVillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    email: '',
    villa_id: ''
  });

  const loadData = async () => {
    try {
      const [staffRes, invRes, villasRes] = await Promise.all([
        fetchWithAuth('/staff'),
        fetchWithAuth('/staff/invitations'),
        fetchWithAuth('/villas/owner/me')
      ]);
      setStaffList(staffRes);
      setInvitations(invRes);
      setVillas(villasRes);
    } catch (error: any) {
      console.error('Failed to load staff data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/staff/invite', {
        method: 'POST',
        body: JSON.stringify(inviteForm)
      });
      setIsInviteModalOpen(false);
      setInviteForm({ email: '', villa_id: '' });
      loadData();
      alert('Undangan berhasil dikirim!');
    } catch (error: any) {
      alert(`Gagal mengundang: ${error.message}`);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Batalkan undangan ini?')) return;
    try {
      await fetchWithAuth(`/staff/invitations/${id}`, { method: 'DELETE' });
      loadData();
    } catch (error: any) {
      alert(`Gagal membatalkan: ${error.message}`);
    }
  };

  const handleRemoveStaff = async (id: string) => {
    if (!confirm('Hapus staf ini dari villa?')) return;
    try {
      await fetchWithAuth(`/staff/${id}`, { method: 'DELETE' });
      loadData();
    } catch (error: any) {
      alert(`Gagal menghapus staf: ${error.message}`);
    }
  };

  if (loading) return <div>Memuat data staf...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Manajemen Staf</h1>
        <button className="btn btn-primary" onClick={() => setIsInviteModalOpen(true)}>
          + Undang Staf
        </button>
      </div>

      <div className={styles.section}>
        <h2>Staf Aktif</h2>
        {staffList.length === 0 ? (
          <p className={styles.empty}>Belum ada staf yang terdaftar.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Villa</th>
                  <th>Tanggal Bergabung</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((s) => (
                  <tr key={s.id}>
                    <td>{s.user_profiles?.full_name || '-'}</td>
                    <td>{s.user_profiles?.email || '-'}</td>
                    <td>{s.villas?.name}</td>
                    <td>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleRemoveStaff(s.id)}>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2>Undangan Tertunda</h2>
        {invitations.length === 0 ? (
          <p className={styles.empty}>Tidak ada undangan tertunda.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email Tujuan</th>
                  <th>Villa</th>
                  <th>Status</th>
                  <th>Link Undangan (Untuk Testing)</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.email}</td>
                    <td>{inv.villas?.name}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[inv.status.toLowerCase()]}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      {inv.status === 'PENDING' && (
                         <input 
                            type="text" 
                            readOnly 
                            value={`${window.location.origin}/invite?token=${inv.token}`} 
                            className={styles.copyInput}
                            onClick={(e) => {
                              (e.target as HTMLInputElement).select();
                              document.execCommand('copy');
                              alert('Link dicopy!');
                            }}
                          />
                      )}
                    </td>
                    <td>
                      {inv.status === 'PENDING' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleRevoke(inv.id)}>Batalkan</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isInviteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Kirim Undangan Staf</h2>
            <form onSubmit={handleInvite} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Email Calon Staf</label>
                <input 
                  type="email" 
                  required 
                  className="input"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                  placeholder="email@example.com"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Pilih Villa</label>
                <select 
                  required 
                  className="input"
                  value={inviteForm.villa_id}
                  onChange={(e) => setInviteForm({...inviteForm, villa_id: e.target.value})}
                >
                  <option value="">Pilih Villa...</option>
                  {villas.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsInviteModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Kirim Undangan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
