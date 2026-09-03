"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import type { Villa } from "@vilara/contracts";
import { api } from "@/lib/api";
import { Dialog, Empty, ErrorNotice, StatusBadge } from "@/components/client-ui";
import { useApiResource } from "@/components/use-api-resource";

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default function VillasPage() {
  const { data, error, loading, reload } = useApiResource<Villa[]>("/villas/mine");
  const [editing, setEditing] = useState<Villa | "new" | null>(null);
  const [pendingArchive, setPendingArchive] = useState<Villa | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"), location: form.get("location"), description: form.get("description"),
      price_per_night: Number(form.get("price_per_night")), capacity: Number(form.get("capacity")),
      facilities: String(form.get("facilities") || "").split(",").map((value) => value.trim()).filter(Boolean),
    };
    try {
      const villa = editing === "new"
        ? await api<Villa>("/villas", { method: "POST", body: JSON.stringify(payload) })
        : await api<Villa>(`/villas/${editing?.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      const images = form.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
      if (images.length) {
        const body = new FormData(); images.forEach((image) => body.append("images", image));
        await api(`/villas/${villa.id}/images`, { method: "POST", body });
      }
      setEditing(null); reload();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Villa tidak dapat disimpan.");
    } finally { setBusy(false); }
  }

  async function archive() {
    if (!pendingArchive) return;
    setBusy(true);
    try { await api(`/villas/${pendingArchive.id}`, { method: "DELETE" }); setPendingArchive(null); reload(); }
    catch (caught) { setMessage(caught instanceof Error ? caught.message : "Villa tidak dapat diarsipkan."); }
    finally { setBusy(false); }
  }

  return <div className="stack" style={{ gap: "2rem" }}>
    <div className="spread">
      <div className="page-heading" style={{ margin: 0 }}><span className="eyebrow">Portofolio</span><h1>Villa Anda</h1><p className="muted">Setiap detail yang diterbitkan akan terlihat di koleksi publik.</p></div>
      <button className="button primary" onClick={() => setEditing("new")}>Tambah villa</button>
    </div>
    {message && <ErrorNotice message={message} />}{error && <ErrorNotice message={error} />}
    {loading ? <div className="skeleton" /> : data?.length ? <div className="table-wrap"><table>
      <thead><tr><th>Villa</th><th>Lokasi</th><th>Harga</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>{data.map((villa) => <tr key={villa.id}>
        <td><div className="cluster">{villa.images[0] && <Image src={villa.images[0]} alt="" width={72} height={54} unoptimized />}<strong>{villa.name}</strong></div></td>
        <td>{villa.location}</td><td>{rupiah.format(villa.price_per_night)}</td><td><StatusBadge status={villa.is_active ? "ACTIVE" : "INACTIVE"} /></td>
        <td><div className="cluster"><button className="button" onClick={() => setEditing(villa)}>Edit</button><button className="button danger" onClick={() => setPendingArchive(villa)}>Arsipkan</button></div></td>
      </tr>)}</tbody>
    </table></div> : <Empty>Belum ada villa. Tambahkan properti pertama Anda.</Empty>}

    {editing && <Dialog title={editing === "new" ? "Villa baru" : "Sunting villa"} onClose={() => setEditing(null)}><form className="form-grid" onSubmit={save}>
      <div className="field"><label htmlFor="name">Nama villa</label><input className="input" id="name" name="name" defaultValue={editing === "new" ? "" : editing.name} required /></div>
      <div className="field"><label htmlFor="location">Lokasi</label><input className="input" id="location" name="location" defaultValue={editing === "new" ? "" : editing.location} required /></div>
      <div className="field"><label htmlFor="price_per_night">Harga per malam</label><input className="input" id="price_per_night" name="price_per_night" type="number" min="1" defaultValue={editing === "new" ? "" : editing.price_per_night} required /></div>
      <div className="field"><label htmlFor="capacity">Kapasitas</label><input className="input" id="capacity" name="capacity" type="number" min="1" defaultValue={editing === "new" ? 2 : editing.capacity} required /></div>
      <div className="field wide"><label htmlFor="description">Deskripsi</label><textarea className="input" id="description" name="description" defaultValue={editing === "new" ? "" : editing.description ?? ""} /></div>
      <div className="field wide"><label htmlFor="facilities">Fasilitas, pisahkan dengan koma</label><input className="input" id="facilities" name="facilities" defaultValue={editing === "new" ? "" : editing.facilities.join(", ")} /></div>
      <div className="field wide"><label htmlFor="images">Foto JPG, PNG, atau WebP</label><input className="input" id="images" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple /></div>
      {message && <div className="wide"><ErrorNotice message={message} /></div>}
      <div className="form-actions"><button className="button" type="button" onClick={() => setEditing(null)}>Batal</button><button className="button primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan villa"}</button></div>
    </form></Dialog>}

    {pendingArchive && <Dialog title="Arsipkan villa?" onClose={() => setPendingArchive(null)}>
      <p>Villa <strong>{pendingArchive.name}</strong> akan disembunyikan dari katalog tanpa menghapus datanya.</p>
      <div className="form-actions"><button className="button" onClick={() => setPendingArchive(null)}>Batal</button><button className="button danger" disabled={busy} onClick={archive}>{busy ? "Mengarsipkan…" : "Arsipkan villa"}</button></div>
    </Dialog>}
  </div>;
}
