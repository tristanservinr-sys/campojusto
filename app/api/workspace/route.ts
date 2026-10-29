import { NextRequest, NextResponse } from 'next/server';
import { env } from 'cloudflare:workers';
import { eq,and } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { workspaces } from '@/db/schema';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { seed, type State } from '@/lib/campojusto/seed';
import { evaluate, topThree } from '@/lib/campojusto/engine';
import { explain } from '@/lib/campojusto/integrations';
export const dynamic='force-dynamic';
const positive=z.coerce.number().finite().positive();const nonnegative=z.coerce.number().finite().nonnegative();
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v)));
const cropSchema=z.object({product:z.string().min(1),variety:z.string().max(80),total:positive,available:positive,cost:nonnegative,min:positive,start:date,end:date}).refine(v=>v.available<=v.total,{message:'La cantidad disponible no puede superar la producción total'}).refine(v=>v.end>=v.start,{message:'Revisa el intervalo de entrega'});
const offerSchema=z.object({name:z.string().min(2),city:z.string().min(2),product:z.string().min(1),variety:z.string(),quantity:positive,price:positive,start:date,end:date,expires:date,partial:z.boolean(),contact:z.string().min(3),address:z.string().min(3)}).refine(v=>v.end>=v.start&&v.expires>=new Date().toISOString().slice(0,10),{message:'Revisa las fechas y el vencimiento'});
async function context(req:NextRequest){
 const user=await getChatGPTUser();
 if(!user&&!import.meta.env.DEV)throw new Error('AUTH');
 const demo=req.nextUrl.searchParams.get('mode')!=='live';
 const id=(user?.userId??'local-preview')+(demo?':demo':':live');const db=getDb();
 let row=(await db.select().from(workspaces).where(eq(workspaces.id,id)))[0];
 if(!row){const data=seed(demo);await db.insert(workspaces).values({id,data:JSON.stringify(data),updatedAt:new Date().toISOString()}).onConflictDoNothing();row=(await db.select().from(workspaces).where(eq(workspaces.id,id)))[0];}
 return {db,id,demo,state:JSON.parse(row.data) as State,revision:row.updatedAt,user};
}
function response(state:State,demo:boolean,revision:string){
 const today=new Date().toISOString().slice(0,10);const crops=state.crops.filter(c=>state.role==='admin'||c.owner==='p1');
 const results=Object.fromEntries(crops.map(c=>{const rows=evaluate(c,state.offers,state.logistics,state.bands,state.users,today);return [c.id,{rows:rows.map(r=>({...r,offer:{...r.offer,contact:state.role==='admin'||state.interests.some(i=>i.cropId===c.id&&i.offerId===r.offer.id)?r.offer.contact:'',address:state.role==='admin'||state.interests.some(i=>i.cropId===c.id&&i.offerId===r.offer.id)?r.offer.address:''}})),top:topThree(rows).map(r=>r.offer.id),explanation:explain(topThree(rows),c.available,rows.filter(r=>r.category==='outside').sort((a,b)=>b.net-a.net))}]}));
 const offers=state.offers.map(o=>({...o,contact:state.role==='admin'||state.role==='buyer'&&o.owner==='b0'?o.contact:'',address:state.role==='admin'||state.role==='buyer'&&o.owner==='b0'?o.address:''}));
 return {state:{...state,crops,offers},results,demo,revision,services:{maps:'Pendiente de configurar',ai:'Explicación determinista de respaldo',supabase:'Pendiente de configurar',storage:'D1 persistente',auth:'Acceso privado de Sites'}};
}
export async function GET(req:NextRequest){try{const c=await context(req);return NextResponse.json(response(c.state,c.demo,c.revision),{headers:{'Cache-Control':'no-store'}})}catch(e){return NextResponse.json({error:e instanceof Error&&e.message==='AUTH'?'Inicia sesión para continuar':'No se pudo cargar la información'},{status:e instanceof Error&&e.message==='AUTH'?401:500})}}
export async function POST(req:NextRequest){try{
 if(req.headers.get('origin')&&req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Origen no permitido'},{status:403});
 const c=await context(req);const {action,payload,revision}=z.object({action:z.string(),payload:z.record(z.any()).default({}),revision:z.string()}).parse(await req.json());let s=c.state;
 if(revision!==c.revision)return NextResponse.json({error:'Los datos cambiaron. Actualiza la página.'},{status:409});
 if(!['role','reset'].includes(action)&&s.role!=='admin'&&!s.users.some(u=>u.id===(s.role==='buyer'?'b0':'p1')&&u.active))throw new Error('FORBIDDEN');
 const admin=()=>{if(s.role!=='admin')throw new Error('FORBIDDEN')};const role=(r:string)=>{if(s.role!==r)throw new Error('FORBIDDEN')};
 if(action==='role'){if(!c.demo)throw new Error('FORBIDDEN');s.role=z.enum(['producer','buyer','admin']).parse(payload.role)}
 else if(action==='register'){if(s.registered)throw new Error('FORBIDDEN');s.role=z.enum(['producer','buyer']).parse(payload.role);s.registered=true;s.profile=z.object({name:z.string().min(2),contact:z.string().min(3),city:z.string().min(2),address:z.string().min(3)}).parse(payload.profile)}
 else if(action==='profile'){s.profile=z.object({name:z.string().min(2),contact:z.string().min(3),city:z.string().min(2),address:z.string().min(3)}).parse(payload);}
 else if(action==='logistics'){role('producer');s.logistics=z.object({radius:positive,consumption:positive.max(5),fuel:positive,capacity:positive,origin:z.string().min(3)}).parse(payload)}
 else if(action==='crop'){role('producer');const d=cropSchema.parse(payload);if(!s.bands.some(b=>b.product===d.product))throw new Error('Producto fuera del catálogo');const existing=s.crops.find(v=>v.id===payload.id);if(existing&&existing.owner!=='p1')throw new Error('FORBIDDEN');if(existing)Object.assign(existing,d);else s.crops.push({...d,id:crypto.randomUUID(),owner:'p1',active:true});s.readNotifications=false;}
 else if(action==='offer'){role('buyer');const d=offerSchema.parse(payload);if(!s.bands.some(b=>b.product===d.product))throw new Error('Producto fuera del catálogo');const existing=s.offers.find(v=>v.id===payload.id);if(existing&&existing.owner!=='b0')throw new Error('FORBIDDEN');if(existing)Object.assign(existing,d);else s.offers.push({...d,id:crypto.randomUUID(),owner:'b0',active:true,out:null,back:null});s.readNotifications=false;}
 else if(action==='toggleCrop'){role('producer');const crop=s.crops.find(c=>c.id===payload.id&&c.owner==='p1');if(!crop)throw new Error('FORBIDDEN');crop.active=!crop.active;}
 else if(action==='toggleOffer'){const o=s.offers.find(o=>o.id===payload.id);if(!o||s.role!=='admin'&&(s.role!=='buyer'||o.owner!=='b0'))throw new Error('FORBIDDEN');o.active=!o.active;}
 else if(action==='interest'){role('producer');const crop=s.crops.find(v=>v.id===payload.cropId&&v.owner==='p1');if(!crop)throw new Error('FORBIDDEN');const r=evaluate(crop,s.offers,s.logistics,s.bands,s.users,new Date().toISOString().slice(0,10)).find(r=>r.offer.id===payload.offerId);if(!r||r.category!=='eligible'&&r.category!=='outside')throw new Error('Esta operación no admite contacto');if(r.category==='outside'&&payload.confirmOutside!==true)throw new Error('Debes reconocer la entrega fuera de cobertura');if(!s.interests.some(i=>i.cropId===crop.id&&i.offerId===r.offer.id))s.interests.push({id:crypto.randomUUID(),cropId:crop.id,offerId:r.offer.id,date:new Date().toISOString()});}
 else if(action==='user'){admin();const u=s.users.find(u=>u.id===payload.id);if(!u)throw new Error('Usuario inexistente');u.active=!u.active;}
 else if(action==='band'){admin();const b=z.object({product:z.string().min(2),min:positive,max:positive}).refine(v=>v.max>=v.min,{message:'El máximo debe ser mayor o igual al mínimo'}).parse(payload);const old=s.bands.find(v=>v.product===b.product);if(old)Object.assign(old,b);else s.bands.push(b);}
 else if(action==='notifications')s.readNotifications=true;
 else if(action==='reset'){if(!c.demo)throw new Error('FORBIDDEN');s=seed(true)}
 else throw new Error('Acción desconocida');
 const updatedAt=new Date().toISOString();const updated=await c.db.update(workspaces).set({data:JSON.stringify(s),updatedAt}).where(and(eq(workspaces.id,c.id),eq(workspaces.updatedAt,c.revision))).returning({id:workspaces.id});if(!updated.length)return NextResponse.json({error:'Otra operación actualizó los datos. Recarga la página.'},{status:409});
 return NextResponse.json(response(s,c.demo,updatedAt));
 }catch(e){const msg=e instanceof Error?e.message:'';return NextResponse.json({error:msg==='FORBIDDEN'?'No tienes permiso para realizar esta acción':msg==='AUTH'?'Inicia sesión para continuar':e instanceof z.ZodError?e.issues[0]?.message:msg||'No se pudo guardar'},{status:msg==='AUTH'?401:msg==='FORBIDDEN'?403:400})}}
