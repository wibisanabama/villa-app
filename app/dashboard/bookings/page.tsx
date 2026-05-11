import styles from './page.module.css';

export default function BookingsPage() {
  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Daftar Pemesanan</h1>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          <button className="btn btn-outline">List View</button>
          <button className="btn btn-primary">Calendar View</button>
        </div>
      </div>
      
      <div className={styles.filterBar}>
        <input type="text" className="input" placeholder="Cari nama tamu..." style={{maxWidth: '300px'}} />
        <select className="input" style={{maxWidth: '200px'}}>
          <option>Semua Properti</option>
          <option>Villa Serenity Bali</option>
          <option>Sunset View Lombok</option>
        </select>
        <select className="input" style={{maxWidth: '200px'}}>
          <option>Semua Status</option>
          <option>Confirmed</option>
          <option>Pending</option>
        </select>
      </div>
      
      <div className={styles.calendarPlaceholder}>
        <p>Interactive Calendar View will be rendered here.</p>
      </div>
      
    </div>
  );
}
