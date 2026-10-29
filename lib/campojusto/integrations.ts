// Server-only adapters. No keys are sent to the browser.
export async function googleRoute(origin:string,destination:string,key?:string){
 if(!key)return null;
 const response=await fetch('https://routes.googleapis.com/directions/v2:computeRoutes',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'routes.distanceMeters'},body:JSON.stringify({origin:{address:origin},destination:{address:destination},travelMode:'DRIVE'}),signal:AbortSignal.timeout(8000)});
 if(!response.ok)return null;const data=await response.json() as {routes?:{distanceMeters:number}[]};return data.routes?.[0]?.distanceMeters?data.routes[0].distanceMeters/1000:null;
}
export function explain(top:{offer:{name:string};quantity:number;net:number;fuel:number;result:number}[],available:number,outside:{offer:{name:string};net:number;quantity:number;fuel:number}[]=[]){
 const r=top[0];if(!r)return 'No hay compradores elegibles para esta cosecha. Revisa las fechas, el precio mínimo y la cobertura. Las operaciones con rutas desconocidas quedan pendientes.';
 const mx=(n:number)=>n.toLocaleString('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2});
 const alternatives=top.slice(1).map((v,i)=>`Alternativa ${i+2}: ${v.offer.name} permitiría vender ${v.quantity.toLocaleString('es-MX')} kg, con ${mx(v.net)} netos y ${mx(v.fuel)} de combustible.`).join(' ');
 const extra=outside[0]?`Fuera de cobertura, ${outside[0].offer.name} dejaría ${mx(outside[0].net)} netos. La distancia supera tu radio y requiere autorización expresa; no forma parte del top 3.`:'';
 return `${r.offer.name} ocupa el primer lugar porque ofrece el mayor ingreso neto comercial total entre las operaciones elegibles. Venderías ${r.quantity.toLocaleString('es-MX')} kg y quedarían ${(available-r.quantity).toLocaleString('es-MX')} kg disponibles. Después de ${mx(r.fuel)} de combustible, recibirías ${mx(r.net)} antes de otros gastos. El resultado después del costo de producción asignado sería ${mx(r.result)}. ${alternatives} ${extra} Cada alternativa es una operación independiente. Confirma calidad, báscula, fechas, domicilio, maniobras y forma de pago antes de acordar una venta.`;
}

// Optional language-model adapter. The demo deliberately uses explain() instead.
// Only precomputed, non-private figures should be passed; output must never feed ranking.
export async function interpretCalculatedResults(data:unknown,config:{url:string;key:string;model:string}){
 const r=await fetch(config.url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+config.key},body:JSON.stringify({model:config.model,messages:[{role:'system',content:'Explica en español de México exclusivamente las cifras proporcionadas. No calcules ni modifiques ranking, precios, distancias o restricciones. No confirmes ventas ni garantices rentabilidad. Si faltan datos indícalo.'},{role:'user',content:JSON.stringify(data)}]}),signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw new Error('Servicio de interpretación no disponible');const body=await r.json() as {choices?:{message?:{content?:string}}[]};const text=body.choices?.[0]?.message?.content;if(!text)throw new Error('Respuesta vacía del servicio');return text;
}
