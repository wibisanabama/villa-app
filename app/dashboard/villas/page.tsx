'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../../lib/api';
import styles from './page.module.css';

export default function VillasPage() {
  const [villas, setVillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    price_per_night: '',
    capacity: '',
    description: ''
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFile2, setImageFile2] = useState<File | null>(null);
  const [imageFile3, setImageFile3] = useState<File | null>(null);

  const loadVillas = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('/villas/owner/me');
      setVillas(Array.isArray(response) ? response : (response.data || []));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data properti villa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVillas();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (villa: any) => {
    setIsEditMode(true);
    setEditingId(villa.id);
    setFormData({
      name: villa.name,
      location: villa.location,
      price_per_night: villa.price_per_night.toString(),
      capacity: villa.capacity !== undefined && villa.capacity !== null ? villa.capacity.toString() : '',
      description: villa.description || ''
    });
    setImageFile(null);
    setImageFile2(null);
    setImageFile3(null);
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      name: '',
      location: '',
      price_per_night: '',
      capacity: '',
      description: ''
    });
    setImageFile(null);
    setImageFile2(null);
    setImageFile3(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus villa ini?')) {
      try {
        await fetchWithAuth(`/villas/${id}`, { method: 'DELETE' });
        loadVillas();
      } catch (err: any) {
        alert(`Gagal menghapus villa: ${err.message}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const endpoint = isEditMode && editingId ? `/villas/${editingId}` : '/villas';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetchWithAuth(endpoint, {
        method,
        body: JSON.stringify({
          ...formData,
          price_per_night: Number(formData.price_per_night),
          capacity: Number(formData.capacity)
        })
      });

      const savedVillaId = isEditMode ? editingId : (response.villa ? response.villa.id : response.id); // Or response.data.id

      // Upload image if selected
      if ((imageFile || imageFile2 || imageFile3) && savedVillaId) {
        const imageFormData = new FormData();
        if (imageFile) imageFormData.append('images', imageFile);
        if (imageFile2) imageFormData.append('images', imageFile2);
        if (imageFile3) imageFormData.append('images', imageFile3);

        await fetchWithAuth(`/villas/${savedVillaId}/images`, {
          method: 'POST',
          body: imageFormData
        });
      }

      setIsModalOpen(false);
      loadVillas();
    } catch (err: any) {
      alert(`Gagal ${isEditMode ? 'mengedit' : 'menambah'} villa: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && villas.length === 0) {
    return <div>Memuat data properti...</div>;
  }

  if (error && villas.length === 0) {
    return <div className="alert error">{error}</div>;
  }

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.title}>Manajemen Properti</h2>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          + Tambah Villa Baru
        </button>
      </div>

      <div className={`card ${styles.tableContainer}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nama Properti</th>
              <th>Lokasi</th>
              <th>Harga / Malam</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {villas.length > 0 ? (
              villas.map(villa => (
                <tr key={villa.id}>
                  <td style={{fontWeight: 500}}>{villa.name}</td>
                  <td style={{color: 'var(--text-secondary)'}}>{villa.location}</td>
                  <td>Rp {villa.price_per_night?.toLocaleString('id-ID')}</td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeActive}`}>Aktif</span>
                  </td>
                  <td>
                    <button onClick={() => handleEditClick(villa)} className="btn btn-outline" style={{padding: '0.25rem 0.5rem', fontSize: '0.875rem', marginRight: '0.5rem'}}>Edit</button>
                    <button onClick={() => handleDelete(villa.id)} className="btn btn-outline" style={{padding: '0.25rem 0.5rem', fontSize: '0.875rem', color: '#e74c3c', borderColor: '#fadbd8'}}>Hapus</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)'}}>
                  Belum ada properti villa. Tambahkan villa pertama Anda!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{isEditMode ? 'Edit Villa' : 'Tambah Villa Baru'}</h3>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nama Properti</label>
                <input required type="text" name="name" className="input" value={formData.name} onChange={handleInputChange} placeholder="e.g. Villa Serenity" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Lokasi</label>
                <input required type="text" name="location" className="input" value={formData.location} onChange={handleInputChange} placeholder="e.g. Ubud, Bali" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Harga per Malam (Rp)</label>
                <input required type="number" name="price_per_night" className="input" value={formData.price_per_night} onChange={handleInputChange} placeholder="e.g. 2500000" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Kapasitas (Orang)</label>
                <input required type="number" name="capacity" className="input" value={formData.capacity} onChange={handleInputChange} placeholder="e.g. 4" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Gambar Villa (Utama)</label>
                <input type="file" accept="image/*" className="input" onChange={(e) => setImageFile(e.target.files?.[0] || null)} style={{ padding: '0.4rem' }} />
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>Upload gambar utama (maks 5MB).</small>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Gambar Villa Kedua (Opsional)</label>
                <input type="file" accept="image/*" className="input" onChange={(e) => setImageFile2(e.target.files?.[0] || null)} style={{ padding: '0.4rem' }} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Gambar Villa Ketiga (Opsional)</label>
                <input type="file" accept="image/*" className="input" onChange={(e) => setImageFile3(e.target.files?.[0] || null)} style={{ padding: '0.4rem' }} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Deskripsi Singkat</label>
                <textarea name="description" className="input" value={formData.description} onChange={handleInputChange} rows={3} placeholder="Ceritakan tentang properti Anda..." />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Simpan Properti')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
