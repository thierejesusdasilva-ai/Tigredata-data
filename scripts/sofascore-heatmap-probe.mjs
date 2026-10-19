// Verificacao de acesso publico; sem proxy/contorno de bloqueios.
const host='https://api.sofascore.com/api/v1';
const players=[{id:783490,name:'Marcelo Hermes'},{id:845323,name:'Otero'},{id:329107,name:'Cesar Martins'},{id:868076,name:'Willean Lepo'}];
async function get(path){
 const ctrl=new AbortController(), timer=setTimeout(()=>ctrl.abort(),8500);
 try{
  const r=await fetch(host+path,{signal:ctrl.signal,headers:{Accept:'application/json','User-Agent':'TigreData/54 (public football data checker)'}});
  if(!r.ok)return {ok:false,status:r.status};
  const j=await r.json();return {ok:true,status:r.status,data:j};
 }catch(e){return {ok:false,status:'network-error',detail:e?.message?.slice(0,110)}}
 finally{clearTimeout(timer)}
}
for(const p of players){
 const events=await get('/player/'+p.id+'/events/last/0');
 const names=events.data?.events||[];
 console.log(JSON.stringify({player:p.name,endpoint:'events/last',status:events.status,eventCount:names.length,examples:names.slice(0,3).map(x=>({id:x.id,date:x.startTimestamp,home:x.homeTeam?.name,away:x.awayTeam?.name}))}));
 if(!events.ok)continue;
 const crici=names.filter(e=>/crici[uú]ma/i.test((e.homeTeam?.name||'')+' '+(e.awayTeam?.name||''))).slice(0,2);
 for(const e of crici){
  const h=await get('/event/'+e.id+'/player/'+p.id+'/heatmap');
  const points=h.data?.heatmap;
  const valid=Array.isArray(points)?points.filter(q=>Number.isFinite(Number(q.x))&&Number.isFinite(Number(q.y))&&q.x>=0&&q.x<=100&&q.y>=0&&q.y<=100):[];
  console.log(JSON.stringify({player:p.name,matchId:e.id,heatmapStatus:h.status,pointCount:valid.length,firstPoints:valid.slice(0,3)}));
 }
}
