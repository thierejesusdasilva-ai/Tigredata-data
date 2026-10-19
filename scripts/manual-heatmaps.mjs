#!/usr/bin/env node
// Importador MANUAL de mapas REAIS. Nunca é agendado; nunca inventa coordenadas.
// O arquivo de entrada opcional deve ter sido obtido por meio autorizado.
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const ROOT='https://api.sofascore.com/api/v1';
const source='Sofascore (mapa por partida)';
const isCriciuma=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes('criciuma');
const safeId=v=>/^[0-9]{5,18}$/.test(String(v||''));
const fail=s=>{throw new Error(s)};
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const day=t=>{const s=String(t||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:null};

export function validPoints(points){
 if(!Array.isArray(points)||points.length<1||points.length>4000)fail('COORDENADAS_AUSENTES_OU_EXCESSIVAS');
 return points.map((p,i)=>{
  if(p==null||typeof p!=='object'||p.x===null||p.y===null||p.x===undefined||p.y===undefined||p.x===''||p.y==='')fail('PONTO_INVALIDO_'+i);
  const x=Number(p.x),y=Number(p.y);
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>100||y>100)fail('PONTO_FORA_DO_CAMPO_'+i);
  return {x:Math.round(x*100)/100,y:Math.round(y*100)/100};
 });
}

export function validateSnapshot(raw, feed, eventId){
 if(!safeId(eventId)||!raw||String(raw.eventId)!==String(eventId))fail('ID_PARTIDA_DIVERGENTE');
 if(!isCriciuma(raw.homeTeam)&&!isCriciuma(raw.awayTeam))fail('PARTIDA_NAO_E_DO_CRICIUMA');
 const date=day(raw.matchDate);
 if(!date||date<'2020-01-01'||date>new Date(Date.now()+86400000).toISOString().slice(0,10))fail('DATA_PARTIDA_INVALIDA');
 if(raw.finished!==true)fail('JOGO_AINDA_NAO_FINALIZADO');
 if(!Array.isArray(raw.players)||!raw.players.length)fail('SEM_MAPAS');
 const ids=new Map((feed?.players||[]).filter(p=>safeId(p.sofaId)&&p.squadStatus!=='departed').map(p=>[String(p.sofaId),p]));
 const unique=new Set(),results=[];
 for(const p of raw.players){
   const id=String(p.sofaId||p.playerId||'');
   if(!safeId(id)||unique.has(id)||!ids.has(id))fail('JOGADOR_FORA_DO_ELENCO_OU_DUPLICADO_'+id);
   const known=ids.get(id);
   if(p.name&&norm(p.name)!==norm(known.name)&&!norm(p.name).includes(norm(known.name))&&!norm(known.fullName||'').includes(norm(p.name)))fail('NOME_DO_JOGADOR_DIVERGENTE_'+id);
   unique.add(id);
   results.push({sofaId:id,name:known.name,points:validPoints(p.points||p.heatmap)});
 }
 return {
  schemaVersion:1,eventId:String(eventId),matchDate:date,
  homeTeam:String(raw.homeTeam).trim(),awayTeam:String(raw.awayTeam).trim(),
  finished:true,source,sourceUrl:'https://www.sofascore.com/football',
  players:results
 };
}

const getJson=async url=>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
   const r=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json','User-Agent':'TigreData/55 data integrity checker'}});
   if([401,403,429].includes(r.status))fail('SOFASCORE_BLOQUEOU_ACESSO_HTTP_'+r.status+' - utilize fonte autorizada e arquivo manual');
   if(!r.ok)fail('SOFASCORE_HTTP_'+r.status);
   return await r.json();
 }finally{clearTimeout(timer)}
};
const playersFrom=lineup=>{
 let a=[];
 for(const side of ['home','away'])for(const x of lineup?.[side]?.players||[]){
  if(x?.player?.id)a.push({side,sofaId:String(x.player.id),name:x.player.name});
 }
 return a;
};

async function retrieveSofascore(eventId,feed){
 const info=(await getJson(ROOT+'/event/'+eventId)).event;
 if(!info?.id||String(info.id)!==String(eventId))fail('PARTIDA_NAO_ENCONTRADA');
 const finished=info?.status?.type==='finished'||info?.status?.code===100;
 if(!finished)fail('JOGO_AINDA_NAO_FINALIZADO');
 const home=info.homeTeam?.name,away=info.awayTeam?.name;
 const side=isCriciuma(home)?'home':isCriciuma(away)?'away':null;
 if(!side)fail('PARTIDA_NAO_E_DO_CRICIUMA');
 const matchDate=new Date(Number(info.startTimestamp)*1000).toISOString().slice(0,10);
 const lineup=await getJson(ROOT+'/event/'+eventId+'/lineups');
 const known=new Set((feed.players||[]).filter(p=>p.squadStatus!=='departed'&&safeId(p.sofaId)).map(p=>String(p.sofaId)));
 const players=playersFrom(lineup).filter(p=>p.side===side&&known.has(p.sofaId));
 if(!players.length)fail('ESCALACAO_NAO_CORRESPONDE_AOS_JOGADORES_CADASTRADOS');
 const captured=[];
 for(const p of players){
  try{
   const json=await getJson(ROOT+'/event/'+eventId+'/player/'+p.sofaId+'/heatmap');
   if(Array.isArray(json.heatmap)&&json.heatmap.length)captured.push({sofaId:p.sofaId,name:p.name,points:json.heatmap});
  }catch(e){
   if(/BLOQUEOU_ACESSO/.test(String(e.message)))throw e;
   console.warn('Mapa indisponível: '+p.name+' ('+String(e.message)+')');
  }
 }
 if(!captured.length)fail('NENHUM_MAPA_DISPONIVEL_NO_SOFASCORE');
 return {eventId,matchDate,homeTeam:home,awayTeam:away,finished:true,players:captured};
}

export async function writeSnapshot(record, root='.'){
 const dir=path.join(root,'heatmaps'),eventsDir=path.join(dir,'events');
 await fs.mkdir(eventsDir,{recursive:true});
 const file=path.join(eventsDir,record.eventId+'.json');
 const indexFile=path.join(dir,'index.json');
 let index;
 try{index=JSON.parse(await fs.readFile(indexFile,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;index={schemaVersion:1,events:{},players:{}}}
 if(index.schemaVersion!==1||typeof index.events!=='object'||typeof index.players!=='object')fail('INDICE_INVALIDO');
 const oldEvent=index.events[record.eventId];
 if(oldEvent&&oldEvent.matchDate!==record.matchDate)fail('CONFLITO_DE_DATA_DA_PARTIDA');
 const now=new Date().toISOString();
 const archive={...record,importedAt:now};
 // Garante que o índice só aponte para mapas publicados e validados.
 await fs.writeFile(file,JSON.stringify(archive,null,2)+'\n');
 index.events[record.eventId]={eventId:record.eventId,matchDate:record.matchDate,homeTeam:record.homeTeam,awayTeam:record.awayTeam,players:record.players.map(p=>p.sofaId),file:'heatmaps/events/'+record.eventId+'.json',source,updatedAt:now};
 for(const p of record.players){
  const list=(index.players[p.sofaId]||[]).filter(x=>x.eventId!==record.eventId);
  list.push({eventId:record.eventId,matchDate:record.matchDate,file:'heatmaps/events/'+record.eventId+'.json',updatedAt:now});
  list.sort((a,b)=>b.matchDate.localeCompare(a.matchDate));
  index.players[p.sofaId]=list;
 }
 index.updatedAt=now;
 await fs.writeFile(indexFile,JSON.stringify(index,null,2)+'\n');
 return {players:record.players.length,points:record.players.reduce((n,p)=>n+p.points.length,0),file};
}

async function main(){
 const eventId=String(process.env.EVENT_ID||process.argv[2]||'');
 if(!safeId(eventId))fail('INFORME_EVENT_ID_SOFASCORE_NUMERICO');
 const feed=JSON.parse(await fs.readFile('latest.json','utf8'));
 const infile='heatmaps/inbox/'+eventId+'.json';
 let raw,origin;
 try{raw=JSON.parse(await fs.readFile(infile,'utf8'));origin='arquivo autorizado'}
 catch(e){if(e.code!=='ENOENT')throw e;origin='Sofascore';raw=await retrieveSofascore(eventId,feed)}
 const verified=validateSnapshot(raw,feed,eventId);
 const result=await writeSnapshot(verified);
 console.log(JSON.stringify({status:'OK',eventId,origin,players:result.players,points:result.points,archive:result.file}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 main().catch(e=>{console.error('IMPORTACAO_CANCELADA: '+e.message);process.exitCode=1});
}
