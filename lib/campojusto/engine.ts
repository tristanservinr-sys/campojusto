export type Crop = {id:string;owner:string;product:string;variety:string;total:number;available:number;cost:number;min:number;start:string;end:string;active:boolean};
export type Offer = {id:string;owner:string;name:string;city:string;product:string;variety:string;quantity:number;price:number;start:string;end:string;expires:string;partial:boolean;active:boolean;out:number|null;back:number|null;contact:string;address:string};
export type Logistics={radius:number;consumption:number;fuel:number;capacity:number;origin:string};
export type Band={product:string;min:number;max:number};
export type Evaluation={offer:Offer;quantity:number;gross:number;fuel:number;net:number;effective:number;assigned:number;result:number;trips:number;distance:number|null;returnEstimated:boolean;date:string;category:string;reason:string};
export function evaluate(c:Crop,offers:Offer[],l:Logistics,bands:Band[],users:{id:string;active:boolean}[],today:string):Evaluation[]{
 const active=(id:string)=>users.some(u=>u.id===id&&u.active);
 return offers.map(o=>{
 const q=o.partial?Math.min(c.available,o.quantity):o.quantity;
 const b=bands.find(b=>b.product===c.product);
 let reason='';
 if(!active(c.owner)||!active(o.owner)||!c.active||!o.active||o.expires<today||c.end<today||o.end<today)reason='Cuenta o publicación inactiva o vencida';
 else if(c.product!==o.product||(o.variety&&o.variety!==c.variety))reason='Producto o variedad incompatible';
 else if(!b||o.price<b.min||o.price>b.max)reason='Precio fuera de la banda experimental';
 else if(o.price<c.min)reason='Precio inferior al mínimo del productor';
 else if(q<=0||(!o.partial&&c.available<o.quantity))reason='Cantidad insuficiente para entrega completa';
 const date=[c.start,o.start,today].sort().at(-1)!;
 if(!reason&&date>[c.end,o.end].sort()[0])reason='Fechas de entrega incompatibles';
 const base={offer:o,quantity:q,gross:0,fuel:0,net:0,effective:0,assigned:0,result:0,trips:0,distance:null,returnEstimated:false,date,category:'excluded',reason};
 if(reason)return base;
 // Routing is reached only after every commercial filter succeeds.
 if(o.out===null)return {...base,category:'pending',reason:'Ruta pendiente de verificación; no participa en el ranking'};
 const trips=Math.ceil(q/l.capacity),fuel=trips*(o.out+(o.back??o.out))*l.consumption*l.fuel,gross=o.price*q,net=gross-fuel,assigned=c.cost/c.total*q,result=net-assigned;
 return {...base,trips,fuel,gross,net,effective:net/q,assigned,result,distance:o.out,returnEstimated:o.back===null,category:result<0?'loss':o.out>l.radius?'outside':'eligible',reason:result<0?'No recupera el costo medio de producción asignado':o.out>l.radius?'Fuera de tu cobertura; requiere tu autorización':''};
 });
}
export function topThree(rows:Evaluation[]){return rows.filter(r=>r.category==='eligible').sort((a,b)=>b.net-a.net||a.offer.id.localeCompare(b.offer.id)).slice(0,3)}
