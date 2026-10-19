#!/usr/bin/env node
// Diagnostico: verifica esquema de classificacao ESPN sem modificar latest.json.
const url='https://site.api.espn.com/apis/v2/sports/soccer/bra.2/standings?season=2026';
const c=new AbortController();const timer=setTimeout(()=>c.abort(),18000);
try{
 const response=await fetch(url,{signal:c.signal,headers:{Accept:'application/json','User-Agent':'TigreDataUpdater/1.0'}});
 if(!response.ok)throw new Error('HTTP '+response.status);
 const data=await response.json();
 const entries=(data.children||[]).flatMap(g=>g?.standings?.entries||[]);
 const first=entries[0];
 console.log(JSON.stringify({season:data.season?.year,groups:data.children?.map(g=>g.name),count:entries.length,sample:entries.slice(0,4).map(e=>({team:e.team?.displayName,id:e.team?.id,stats:e.stats?.map(s=>({name:s.name,value:s.value})).slice(0,20)}))},null,2));
 if(entries.length<18||entries.length>25)throw new Error('Tabela incompleta: '+entries.length);
 if(!entries.some(e=>/crici[uú]ma/i.test(e.team?.displayName||'')))throw new Error('Criciuma nao identificado.');
}catch(e){console.error('Fonte de classificacao indisponivel: '+e.message);process.exitCode=1;}
finally{clearTimeout(timer)}
