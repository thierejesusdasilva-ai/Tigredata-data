#!/usr/bin/env node
// Enriquecimento conservador do elenco: identidades ESPN 2026 + estatisticas basicas.
// Mantem estatisticas avancadas de outras fontes com sua data original.
import {applyVerifiedProfiles} from './verified-player-profiles.mjs';

export const ROSTER_URL='https://site.api.espn.com/apis/site/v2/sports/soccer/bra.2/teams/9971/roster?season=2026';
export const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const num=v=>{if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0?n:null;};
const date=s=>{const x=String(s||'').slice(0,10);return /^\d{4}-\d\d-\d\d$/.test(x)?x:null;};
const val=v=>v!==null&&v!==undefined&&v!=='';
export const flattenedRoster=payload=>(Array.isArray(payload?.athletes)?payload.athletes:[]).flatMap(group=>Array.isArray(group?.items)?group.items:[group]).filter(p=>p&&p.id&&p.displayName);
const statsOf=athlete=>Object.fromEntries((athlete?.statistics?.splits?.categories||[]).flatMap(c=>c.stats||[]).filter(s=>s.name&&num(s.value)!==null).map(s=>[s.name,num(s.value)]));

function scoreName(local,a){
 const given=fold(a.displayName||a.fullName),short=fold(local.name),full=fold(local.fullName);
 // Identificadores conferidos com clube/CBF; as grafias ESPN diferem.
 const verifiedLinks={'1927514':{id:'397652',names:['ruan rodrigues carvalho']},'868076':{id:'251863',names:['willean lepu']}};
 const verified=verifiedLinks[String(local.sofaId||'')];
 if(verified && String(a.id)===verified.id && String(local.espnId||'')===verified.id && verified.names.includes(given))return 155;
 if(!given||!short)return -1;
 const dob=date(a.dateOfBirth),knownDob=date(local.birthdate);
 if(dob&&knownDob&&dob!==knownDob)return -1;
 const confirmedDate=!!dob&&!!knownDob&&dob===knownDob;
 const jersey=String(local.number||'').trim(),supplied=String(a.jersey||'').trim();
 const sameJersey=!!jersey&&!!supplied&&jersey===supplied;
 const exact=given===short||given===full;
 if(String(local.espnId||'')===String(a.id))return 150;
 if(exact)return sameJersey||confirmedDate?125:85;
 const part=(full||short).split(' ');
 const givenTerms=given.split(' ');
 const contains=givenTerms.every(t=>part.includes(t))||short.split(' ').every(t=>givenTerms.includes(t));
 const firstMatch=part[0]===givenTerms[0]||short.split(' ')[0]===givenTerms[0];
 const lastMatch=part.some(t=>t.length>4&&givenTerms.includes(t))||short.split(' ').some(t=>t.length>4&&givenTerms.includes(t));
 if(confirmedDate&&(firstMatch||lastMatch))return 110;
 if(contains&&sameJersey)return 105;
 if(lastMatch&&sameJersey)return 90;
 // Nao associar jogadores so por prenome quando falta data/camisa.
 return -1;
}
export function findMatches(existing,external){
 const byId=new Map(),problems=[];
 const used=new Set();
 for(const player of existing){
  const ranked=external.map(a=>({a,score:scoreName(player,a)})).filter(r=>r.score>=85).sort((a,b)=>b.score-a.score);
  if(!ranked.length){problems.push({name:player.name,reason:'sem correspondencia segura'});continue}
  if(ranked.length>1&&ranked[0].score===ranked[1].score){problems.push({name:player.name,reason:'ambiguidade entre atletas'});continue}
  const winner=ranked[0].a;
  if(used.has(String(winner.id))){problems.push({name:player.name,reason:'ESPN id repetido'});continue}
  used.add(String(winner.id));byId.set(player,winner);
 }
 return {byId,problems,unmatchedESPN:external.filter(x=>!used.has(String(x.id))).map(x=>({id:x.id,name:x.displayName,jersey:x.jersey??null}))};
}
const cleanText=s=>String(s||'').trim();
const country=s=>{if(!s)return null;return /^brazil$/i.test(s)?'Brasil':cleanText(s)};
export function mergeVerifiedPlayers(feed,source,now=new Date()){
 if(!Array.isArray(feed?.players)||feed.players.length<15)throw new Error('Base de elenco insuficiente.');
 const athletes=flattenedRoster(source);
 if(athletes.length<20||athletes.length>70||source?.team?.displayName!=='Criciúma')throw new Error('Elenco ESPN ausente ou equipe incorreta.');
 const {byId,problems,unmatchedESPN}=findMatches(feed.players,athletes);
 const crossSourceDisagreements=[];
 for(const [p,a] of byId){
   for(const [field,oldVal,newVal] of [
     ['birthdate',p.birthdate,date(a.dateOfBirth)],
     ['number',p.number,a.jersey],
     ['heightCm',p.heightCm,num(a.height)==null?null:Math.round(num(a.height)*2.54)],
     ['weightKg',p.weightKg,num(a.weight)==null?null:Math.round(num(a.weight)*0.45359237)]
   ]){
     if(p.playerFieldSources?.[field]?.locked&&val(oldVal)&&val(newVal)&&String(oldVal)!==String(newVal))
       crossSourceDisagreements.push({name:p.name,field,verifiedValue:String(oldVal),espnValue:String(newVal)});
   }
 }
 if(byId.size<18)throw new Error('Poucos atletas identificados com seguranca: '+byId.size);
 let statsCount=0,profileCount=0;
 const players=feed.players.map(p=>{
  const a=byId.get(p);if(!a)return p;
  const stats=statsOf(a),patch={...p,espnId:String(a.id)};
  const provenance={...(p.playerFieldSources||{})};
  const stamp=now.toISOString();
  const update=(key,value)=>{
    if(!val(value))return;
    if(provenance[key]?.locked===true)return;
    if(patch[key]!==value){patch[key]=value;profileCount++}
    provenance[key]={source:'ESPN Série B 2026',url:ROSTER_URL,checkedAt:stamp};
  };
  // Identidade: nunca sobrescrever data de nascimento conflitante ou nome completo ja confirmado.
  if(!val(p.fullName)&&val(a.fullName))update('fullName',cleanText(a.fullName));
  if(!val(p.birthdate))update('birthdate',date(a.dateOfBirth));
  if(!val(p.country))update('country',country(a.citizenship));
  if(!val(p.birthPlace)&&val(a.birthPlace?.city))update('birthPlace',cleanText(a.birthPlace.city));
  const cm=num(a.height);const kg=num(a.weight);
  // ESPN publica altura em polegadas e peso em libras: converter para metricos.
  if(cm!==null&&cm>=57&&cm<=88)update('heightCm',Math.round(cm*2.54));
  if(kg!==null&&kg>=90&&kg<=350)update('weightKg',Math.round(kg*0.45359237));
  if(!val(p.number)&&val(a.jersey))update('number',String(a.jersey));
  const season={...(p.seasonStats||{})};
  const maps={appearances:'appearances',totalGoals:'goals',goalAssists:'assists',
    yellowCards:'yellowCards',redCards:'redCards',totalShots:'totalShots',
    shotsOnTarget:'shotsOnTarget',foulsCommitted:'foulsCommitted',
    foulsSuffered:'foulsSuffered',offsides:'offsides',subIns:'subIns',
    saves:'saves',goalsConceded:'goalsConceded'};
  const sources={...(season.metricSources||{})};
  let updated=false;
  for(const [from,to] of Object.entries(maps)){
    if(!Object.hasOwn(stats,from))continue;
    if(['saves','goalsConceded'].includes(from)&&fold(p.position)!=='goleiros')continue;
    const n=stats[from];
    if(n===null||n>5000)continue;
    season[to]=n;
    sources[to]={source:'ESPN',checkedAt:stamp,url:ROSTER_URL};
    updated=true;
    statsCount++;
  }
  if(updated){
    season.competition='Brasileirão Série B 2026';
    season.season=2026;
    season.basicStatsCheckedAt=stamp;
    season.metricSources=sources;
    season.advancedStatsCheckedAt=p.seasonStats?.advancedStatsCheckedAt||p.seasonStats?.updatedAt||null;
    season.source='ESPN (básicas) + fontes anteriores (avançadas)';
    patch.seasonStats=season;
    patch.statsSource=season.source;
  }
  patch.playerFieldSources=provenance;
  patch.espnProfileCheckedAt=stamp;
  return patch;
 });
 const coverage={};
 for(const k of ['fullName','birthdate','country','heightCm','weightKg','preferredFoot','joinedCriciumaDate']){
   coverage[k]=players.filter(p=>val(p[k])).length;
 }
 const audit={source:'ESPN Série B',sourceUrl:ROSTER_URL,checkedAt:now.toISOString(),sourceAthletes:athletes.length,
    matched:byId.size,unmatchedCount:problems.length,unmatchedPlayers:problems,
    otherESPNPlayers:unmatchedESPN,crossSourceDisagreements,statsFieldsVerified:statsCount,profileValuesChanged:profileCount,coverage,
    physicalMatchMetrics:'indisponiveis no feed de elenco ESPN'};
 return {feed:{...feed,players,sourceState:{...(feed.sourceState||{}),playersESPN:audit}},audit};
}
export async function refreshPlayers(feed,now=new Date()){
 const c=new AbortController(),timeout=setTimeout(()=>c.abort(),15000);
 try{
  const response=await fetch(ROSTER_URL,{headers:{Accept:'application/json','User-Agent':'TigreDataUpdater/1.0'},signal:c.signal});
  if(!response.ok)throw new Error('ESPN atletas HTTP '+response.status);
  const json=await response.json();
  const curated=applyVerifiedProfiles(feed,now);
  return mergeVerifiedPlayers(curated.feed,json,now);
 }finally{clearTimeout(timeout)}
}
