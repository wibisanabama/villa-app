'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../../lib/api';
import styles from './subscription.module.css';

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  max_villas: number;
  description: string;
  is_popular: boolean;
  features: string[];
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [villaCount, setVillaCount] = useState(0);
  const [maxVillas, setMaxVillas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [plansRes, myRes] = await Promise.all([
          fetchWithAuth('/subscriptions'),
          fetchWithAuth('/subscriptions/me')
        ]);
        setPlans(plansRes);
        setCurrentSub(myRes.subscription);
        setVillaCount(myRes.villa_count);
        setMaxVillas(myRes.max_villas);
      } catch (err) {
        console.error('Failed to load subscription data', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUpgrade = async (slug: string) => {
    if (upgrading) return;
    const plan = plans.find(p => p.slug === slug);
    if (!plan) return;

    const confirm = window.confirm(
      plan.price > 0
        ? `Upgrade ke paket ${plan.name} dengan harga Rp ${plan.price.toLocaleString('id-ID')}/bulan?`
        : `Beralih ke paket ${plan.name} (Gratis)?`
    );
    if (!confirm) return;

    setUpgrading(slug);
    try {
      const res = await fetchWithAuth('/payments/subscription', {
        method: 'POST',
        body: JSON.stringify({ plan_slug: slug })
      });

      if (res.payment_link) {
        // Arahkan ke Mayar Payment
        window.location.href = res.payment_link;
        return;
      }

      // Jika plan gratis (tidak butuh bayar)
      const myRes = await fetchWithAuth('/subscriptions/me');
      setCurrentSub(myRes.subscription);
      setVillaCount(myRes.villa_count);
      setMaxVillas(myRes.max_villas);
      alert(`Berhasil beralih ke paket ${plan.name}!`);
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Memuat data paket langganan...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Current plan banner */}
      <div className={styles.currentPlan}>
        <div>
          <h2 className={styles.currentTitle}>Paket Anda Saat Ini</h2>
          <div className={styles.currentInfo}>
            <span className={styles.planName}>{currentSub?.name || 'Starter'}</span>
            <span className={styles.dot}>·</span>
            <span className={styles.villaUsage}>
              {villaCount} / {maxVillas === -1 ? '∞' : maxVillas} villa digunakan
            </span>
          </div>
        </div>
        {/* Progress bar */}
        {maxVillas !== -1 && (
          <div className={styles.progressWrapper}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.min((villaCount / maxVillas) * 100, 100)}%` }}
              />
            </div>
            <span className={styles.progressText}>{Math.round((villaCount / maxVillas) * 100)}% terpakai</span>
          </div>
        )}
      </div>

      {/* Plans grid */}
      <div className={styles.plansGrid}>
        {plans.map(plan => {
          const isCurrent = currentSub?.slug === plan.slug;
          const features: string[] = Array.isArray(plan.features) ? plan.features : [];

          return (
            <div
              key={plan.id}
              className={`${styles.planCard} ${plan.is_popular ? styles.popularCard : ''} ${isCurrent ? styles.activeCard : ''}`}
            >
              {plan.is_popular && <div className={styles.popularBadge}>Paling Populer</div>}
              {isCurrent && <div className={styles.currentBadge}>Paket Aktif</div>}

              <h3 className={styles.planTitle}>{plan.name}</h3>
              <p className={styles.planDesc}>{plan.description}</p>

              <div className={styles.priceSection}>
                {plan.price === 0 ? (
                  <span className={styles.priceFree}>Gratis</span>
                ) : (
                  <>
                    <span className={styles.priceAmount}>Rp {plan.price.toLocaleString('id-ID')}</span>
                    <span className={styles.pricePeriod}>/bulan</span>
                  </>
                )}
              </div>

              <div className={styles.villaLimit}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span>{plan.max_villas === -1 ? 'Villa Unlimited' : `Maks ${plan.max_villas} villa`}</span>
              </div>

              <ul className={styles.featureList}>
                {features.map((f, i) => (
                  <li key={i} className={styles.featureItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`${styles.planBtn} ${isCurrent ? styles.planBtnCurrent : plan.is_popular ? styles.planBtnPopular : styles.planBtnDefault}`}
                disabled={isCurrent || upgrading !== null}
                onClick={() => handleUpgrade(plan.slug)}
              >
                {upgrading === plan.slug
                  ? 'Memproses...'
                  : isCurrent
                    ? 'Paket Aktif'
                    : plan.price === 0
                      ? 'Pilih Gratis'
                      : 'Upgrade Sekarang'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
