"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { Villa } from "@vilara/contracts";
import { api } from "@/lib/api";
import { Empty, ErrorNotice } from "./client-ui";

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
export function SearchExperience({ initialVillas }: { initialVillas: Villa[] }) {
  const [villas, setVillas] = useState(initialVillas); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget); const query = new URLSearchParams();
    for (const key of ["q", "check_in", "check_out"]) { const value = form.get(key); if (typeof value === "string" && value) query.set(key, value); }
    try { setVillas(await api<Villa[]>(`/villas?${query}`)); } catch (caught) { setError(caught instanceof Error ? caught.message : "Pencarian gagal."); } finally { setBusy(false); }
  }
  return <><form className="search-bar" onSubmit={search}><div className="field"><label htmlFor="q">Lokasi atau nama villa</label><input className="input" id="q" name="q" placeholder="Ubud, Canggu, Seminyak…" /></div><div className="field"><label htmlFor="check_in">Check-in</label><input className="input" id="check_in" name="check_in" type="date" min={new Date().toISOString().slice(0,10)} /></div><div className="field"><label htmlFor="check_out">Check-out</label><input className="input" id="check_out" name="check_out" type="date" min={new Date().toISOString().slice(0,10)} /></div><button className="button primary" disabled={busy}>{busy ? "Mencari…" : "Cari villa"}</button></form>{error && <ErrorNotice message={error} />}<div className="spread" style={{marginBlock:"1.5rem"}}><h2>{villas.length} villa tersedia</h2><span className="muted">Harga per malam</span></div>{villas.length ? <div className="grid">{villas.map((villa) => <article className="villa-card" key={villa.id}>{villa.images[0] ? <Image className="villa-image" src={villa.images[0]} alt={villa.name} width={720} height={540} unoptimized /> : <div className="image-placeholder">Belum ada foto</div>}<div><span className="eyebrow">{villa.location}</span><h2>{villa.name}</h2></div><p className="muted">{villa.description || "Ruang tenang untuk perjalanan Anda."}</p><div className="spread"><div><span className="price">{rupiah.format(villa.price_per_night)}</span><span className="muted"> / malam</span></div><Link className="button" href={`/search/${villa.id}`}>Lihat villa</Link></div></article>)}</div> : <Empty>Tidak ada villa untuk kriteria tersebut. Coba tanggal atau lokasi lain.</Empty>}</>;
}

