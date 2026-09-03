import type { Metadata } from "next";
import type { Villa } from "@vilara/contracts";
import { publicApi } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { SearchExperience } from "@/components/search-experience";

export const metadata: Metadata = { title: "Koleksi Villa" };
export const dynamic = "force-dynamic";

export default async function SearchPage() {
  let villas: Villa[] = [];
  try { villas = await publicApi<Villa[]>("/villas?limit=48"); } catch { /* Render an actionable empty state. */ }
  return <><SiteHeader /><main className="shell page"><div className="page-heading"><span className="eyebrow">Koleksi Vilara</span><h1>Tempat untuk tinggal dengan lebih pelan.</h1><p className="muted">Villa pilihan untuk hari-hari yang layak diingat. Cari lokasi dan tanggal perjalanan Anda.</p></div><SearchExperience initialVillas={villas} /></main></>;
}
