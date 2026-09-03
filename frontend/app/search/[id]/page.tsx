import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import type { Villa } from "@vilara/contracts";
import { publicApi } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { BookingForm } from "@/components/booking-form";

export const dynamic = "force-dynamic";
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{try{const villa=await publicApi<Villa>(`/villas/${(await params).id}`);return{title:villa.name,description:villa.description??`Villa di ${villa.location}`}}catch{return{title:"Villa"}}}
export default async function VillaPage({params}:{params:Promise<{id:string}>}){let villa:Villa;try{villa=await publicApi<Villa>(`/villas/${(await params).id}`)}catch{notFound()}return <><SiteHeader/><main className="shell page"><div className="page-heading"><span className="eyebrow">{villa.location}</span><h1>{villa.name}</h1><p className="muted">{villa.description}</p></div><div className="grid" style={{gridTemplateColumns:"2fr 1fr",alignItems:"start"}}><section className="stack">{villa.images.length?villa.images.map((image,index)=><Image key={image} className="villa-image" src={image} alt={`${villa.name}, foto ${index+1}`} width={1100} height={760} unoptimized/>):<div className="image-placeholder">Foto akan segera hadir</div>}<div className="panel"><h2>Yang tersedia</h2><div className="cluster" style={{marginTop:".8rem"}}>{villa.facilities.map((facility)=><span className="badge" key={facility}>{facility}</span>)}</div><p className="muted" style={{marginTop:"1rem"}}>Kapasitas hingga {villa.capacity} tamu.</p></div></section><BookingForm villa={villa}/></div></main></>}
