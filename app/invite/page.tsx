'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Simpan token ke localStorage supaya bisa diproses setelah login (jika butuh login)
      localStorage.setItem('inviteToken', token);
      
      // Cek apakah user sudah login
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // Jika sudah login, lempar ke callback agar tokennya langsung dieksekusi
          router.replace('/callback');
        } else {
          setLoading(false);
        }
      });
    } else {
      router.replace('/');
    }
  }, [token, router]);

  if (loading) return <div>Memeriksa undangan...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f9fafb' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Anda Diundang Menjadi Staf!</h1>
        <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
          Untuk menerima undangan ini, Anda harus login atau mendaftar terlebih dahulu.
        </p>
        <button 
          onClick={() => router.push('/search')} 
          style={{ background: '#4f46e5', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
        >
          Masuk / Daftar
        </button>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div>Memuat...</div>}>
      <InviteContent />
    </Suspense>
  );
}
