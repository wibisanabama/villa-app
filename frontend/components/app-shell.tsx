"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LogoutButton, ThemeToggle } from "./client-ui";

const ownerLinks = [
  ["/dashboard", "Ringkasan"], ["/dashboard/villas", "Villa"], ["/dashboard/bookings", "Pemesanan"],
  ["/dashboard/staff", "Staf"], ["/dashboard/subscription", "Langganan"], ["/dashboard/profile", "Profil"],
];
const staffLinks = [["/staff", "Operasional"]];
const adminLinks = [["/admin", "Ikhtisar"], ["/admin/users", "Pengguna"], ["/admin/villas", "Villa"], ["/admin/bookings", "Booking"], ["/admin/transactions", "Transaksi"], ["/admin/plans", "Paket"]];

export function AppShell({ mode, children }: { mode: "owner" | "staff" | "admin"; children: ReactNode }) {
  const pathname = usePathname();
  const links = mode === "owner" ? ownerLinks : mode === "staff" ? staffLinks : adminLinks;
  return <div className="app-layout"><aside className="sidebar"><Link className="brand" href="/search">Vilara</Link><span className="eyebrow">{mode === "owner" ? "Studio Pemilik" : mode === "staff" ? "Operasional" : "Administrasi"}</span><nav className="sidebar-nav">{links.map(([href, label]) => <Link key={href} className={pathname === href ? "active" : ""} href={href}>{label}</Link>)}</nav><div className="sidebar-foot stack"><ThemeToggle /><LogoutButton /></div></aside><div className="app-main"><header className="app-topbar"><span className="eyebrow">{new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</span><Link href="/search">Lihat situs publik</Link></header><main className="app-content">{children}</main></div></div>;
}

