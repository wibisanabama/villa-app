"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ThemeToggle() {
  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("vilara-theme", next);
  }
  return <button className="button ghost" type="button" onClick={toggle} aria-label="Ganti tema warna">Tema</button>;
}

export function LoginButton({ next = "/profile" }: { next?: string }) {
  const [busy, setBusy] = useState(false);
  async function login() {
    setBusy(true);
    await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
    setBusy(false);
  }
  return <button className="button primary" type="button" onClick={login} disabled={busy}>{busy ? "Menghubungkan…" : "Masuk dengan Google"}</button>;
}

export function LogoutButton() {
  const router = useRouter();
  async function logout() { await createClient().auth.signOut(); router.replace("/search"); router.refresh(); }
  return <button className="button ghost" onClick={logout}>Keluar</button>;
}

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="spread"><h2 id="dialog-title">{title}</h2><button className="button ghost" onClick={onClose} aria-label="Tutup dialog">Tutup</button></div><hr className="rule" style={{ marginBlock: "1rem" }} />{children}</section></div>;
}

export function StatusBadge({ status }: { status: string }) {
  const danger = ["CANCELLED", "EXPIRED", "FAILED", "REVIEW", "PAYMENT_REVIEW"].includes(status);
  const success = ["PAID", "CONFIRMED", "CHECKED_IN", "COMPLETED", "ACTIVE", "ACCEPTED"].includes(status);
  return <span className={`badge ${danger ? "danger" : success ? "success" : "warning"}`}>{status.replaceAll("_", " ")}</span>;
}

export function ErrorNotice({ message }: { message: string }) { return <div className="notice error" role="alert">{message}</div>; }
export function Empty({ children }: { children: ReactNode }) { return <div className="empty">{children}</div>; }
