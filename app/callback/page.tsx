'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

import { fetchWithAuth } from '../../lib/api';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.replace('/login');
        return;
      }

      // Check if there's a pending staff invite
      const inviteToken = localStorage.getItem('inviteToken');
      if (inviteToken) {
        try {
          await fetchWithAuth('/staff/accept', {
            method: 'POST',
            body: JSON.stringify({ token: inviteToken })
          });
          localStorage.removeItem('inviteToken');
          router.replace('/staff');
          return; // Stop execution here since we already routed
        } catch (error) {
          console.error('Failed to accept invitation:', error);
          localStorage.removeItem('inviteToken');
          alert('Gagal menerima undangan: Token tidak valid atau kadaluarsa.');
        }
      }

      // Check role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role === 'OWNER' || profile?.role === 'SUPER_ADMIN') {
        router.replace('/dashboard');
      } else if (profile?.role === 'STAFF') {
        router.replace('/staff');
      } else {
        router.replace('/search'); // default to search page
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
      <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(0,0,0,0.1)', borderLeftColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p>Mengatur sesi Anda...</p>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
