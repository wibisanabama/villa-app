import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LoginButton, ThemeToggle } from "./client-ui";

export async function SiteHeader() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  return <header className="site-header"><div className="shell site-header-inner"><Link className="brand" href="/search">Vilara</Link><nav className="nav" aria-label="Navigasi utama"><Link href="/search">Koleksi Villa</Link>{user ? <Link className="button" href="/profile">Akun Saya</Link> : <LoginButton /> }<ThemeToggle /></nav></div></header>;
}

