import Link from 'next/link';
import styles from './page.module.css';

export default function VillasPage() {
  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Manajemen Properti</h1>
        <button className="btn btn-primary">+ Tambah Villa</button>
      </div>
      
      <div className={`card ${styles.tableContainer}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Properti</th>
              <th>Harga / Malam</th>
              <th>Kapasitas</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className={styles.villaName}>Villa Serenity Bali</div>
                <div className={styles.villaLocation}>Ubud, Bali</div>
              </td>
              <td>Rp 2.500.000</td>
              <td>4 Orang</td>
              <td><span className={`${styles.statusBadge} ${styles.statusActive}`}>Aktif</span></td>
              <td className={styles.actionCell}>
                <button className={styles.actionBtn}>Edit</button>
                <button className={styles.actionBtn}>Hapus</button>
              </td>
            </tr>
            <tr>
              <td>
                <div className={styles.villaName}>Sunset View Lombok</div>
                <div className={styles.villaLocation}>Kuta, Lombok</div>
              </td>
              <td>Rp 1.800.000</td>
              <td>2 Orang</td>
              <td><span className={`${styles.statusBadge} ${styles.statusActive}`}>Aktif</span></td>
              <td className={styles.actionCell}>
                <button className={styles.actionBtn}>Edit</button>
                <button className={styles.actionBtn}>Hapus</button>
              </td>
            </tr>
            <tr>
              <td>
                <div className={styles.villaName}>Mountain Retreat Bromo</div>
                <div className={styles.villaLocation}>Probolinggo, Jatim</div>
              </td>
              <td>Rp 1.200.000</td>
              <td>6 Orang</td>
              <td><span className={`${styles.statusBadge} ${styles.statusDraft}`}>Draft</span></td>
              <td className={styles.actionCell}>
                <button className={styles.actionBtn}>Edit</button>
                <button className={styles.actionBtn}>Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
