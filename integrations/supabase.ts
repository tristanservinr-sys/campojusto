// Server-only HTTP adapter for a future Supabase deployment. Not enabled in this demo.
export class SupabaseAdapter {
 constructor(private url:string,private anonKey:string,private accessToken:string){}
 async user(){const r=await fetch(this.url+'/auth/v1/user',{headers:{apikey:this.anonKey,Authorization:'Bearer '+this.accessToken}});if(!r.ok)throw new Error('Sesión Supabase inválida');return r.json()}
 async read(table:'profiles'|'harvests'|'demands'|'interests'){const r=await fetch(this.url+'/rest/v1/'+table+'?select=*',{headers:{apikey:this.anonKey,Authorization:'Bearer '+this.accessToken}});if(!r.ok)throw new Error('No se pudo consultar Supabase');return r.json()}
 async insert(table:'harvests'|'demands'|'interests',record:unknown){const r=await fetch(this.url+'/rest/v1/'+table,{method:'POST',headers:{apikey:this.anonKey,Authorization:'Bearer '+this.accessToken,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(record)});if(!r.ok)throw new Error('No se pudo guardar en Supabase');return r.json()}
}
