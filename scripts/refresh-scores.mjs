#!/usr/bin/env node
// Atualizacao do feed consumido pelo Tigre Data. Sem IA para inventar resultados.
// Fonte publica complementar: ESPN Série B 2026 (schema nao oficial; pode mudar).
// Em erro da fonte, nao altera latest.json; Actions registra falha.
import fs from 'node:fs/promises';

export const SCOREBOARD='https://site.api.espn.com/apis/site/v2/sports/soccer/bra.2/scoreboard';
export const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export const isTigre=name=>norm(name).includes('criciuma');
const numeric=v=>{
  const n=Number(typeof v==='object'&&v!==null?(v.value??v.displayValue):v);
  return v===null||v===undefined||v===''||!Number.isFinite(n)?null:n;
};
const isoDate=day=>new Date(day).toISOString().slice(0,10).replace(/-/g,'');
const plusDays=(date,days)=>new Date(date.getTime()+days*86400000);

export function parseEvent(e,now=new Date()){
  const c=e?.competitions?.[0]; if(!c||!e?.id)return null;
  const home=c.competitors?.find(x=>x.homeAway==='home');
  const away=c.competitors?.find(x=>x.homeAway==='away');
  const hn=home?.team?.displayName||home?.team?.name;
  const an=away?.team?.displayName||away?.team?.name;
  if(!hn||!an||!isTigre(hn)&&!isTigre(an)||isTigre(hn)&&isTigre(an))return null;
  const time=new Date(e.date||c.date||'');
  if(!Number.isFinite(time.getTime())||time.getUTCFullYear()!==2026)return null;
  const st=e.status?.type||c.status?.type||{};
  const finished=st.completed===true||st.name==='STATUS_FINAL'||st.state==='post';
  const live=!finished&&(st.state==='in'||st.name==='STATUS_IN_PROGRESS');
  const hs=numeric(home.score),as=numeric(away.score);
  if(finished&&(hs===null||as===null||hs<0||as<0||hs>40||as>40))return null;
  // Calendario do futebol brasileiro em BRT, nao no dia UTC.
  const pt=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(time);
  const field=k=>pt.find(x=>x.type===k)?.value;
  const localDate=field('year')+'-'+field('month')+'-'+field('day');
  const localTime=field('hour')+':'+field('minute');
  // Nao escrever placar parcial de jogo como resultado final.
  return {
    id:'espn-'+String(e.id),
    leagueName:'Brasileirão Série B 2026',
    matchRound:numeric(e.week?.number??c.week?.number),
    matchDate:localDate,
    matchTime:localTime,
    kickoffUtc:time.toISOString(),
    homeTeamName:hn,
    awayTeamName:an,
    matchStatus:finished?'FINISHED':live?'LIVE':'SCHEDULED',
    homeTeamFtScore:finished?hs:null,
    awayTeamFtScore:finished?as:null,
    matchStadium:c.venue?.fullName||null,
    dataSource:'ESPN',
    source:'ESPN Série B (complementar)',
    sourceUrl:'https://www.espn.com.br/futebol/resultados?liga=bra.2',
    apiBacked:true,
    verifiedAt:now.toISOString()
  };
}

const dateOf=m=>String(m?.matchDate||(m?.kickoffUtc||'').slice(0,10)||'');
const teamsOf=m=>[m?.homeTeamName||m?.home,m?.awayTeamName||m?.away].map(norm);
export const sameFixture=(a,b)=>{
  const aTeams=teamsOf(a),bTeams=teamsOf(b);
  return !!dateOf(a)&&dateOf(a)===dateOf(b)&&aTeams.every((x,i)=>!!x&&x===bTeams[i]);
};
const fixtureTime=m=>new Date(m.kickoffUtc||m.matchDate+'T00:00:00Z').getTime();
const ready=source=>source?.sourceState?.espn?.status==='OK';

export function mergeFeed(feed,events,now=new Date()){
  if(!feed||!Array.isArray(feed.results)||!Array.isArray(feed.upcoming))throw new Error('JSON base invalido: results/upcoming ausentes');
  const parsed=events.map(e=>parseEvent(e,now)).filter(Boolean);
  if(!parsed.length)throw new Error('ESPN nao retornou partidas validas do Criciuma na janela; preservado ultimo feed');
  const cutoff=plusDays(now,-2).getTime();
  const results=[...feed.results];
  const upcoming=feed.upcoming.filter(f=>{const t=fixtureTime(f);return !Number.isFinite(t)||t>=cutoff});
  const conflicts=[];
  for(const m of parsed){
    // Preserva dados complementares (escudos, eventos) do registro existente.
    let previous=results.findIndex(x=>sameFixture(x,m));
    const uidx=upcoming.findIndex(x=>sameFixture(x,m));
    const old=previous>=0?results[previous]:uidx>=0?upcoming[uidx]:null;
    if(old&&old.matchStatus==='FINISHED'&&m.matchStatus==='FINISHED'){
      const oldH=numeric(old.homeTeamFtScore),oldA=numeric(old.awayTeamFtScore);
      if(oldH!==null&&oldA!==null&&(oldH!==m.homeTeamFtScore||oldA!==m.awayTeamFtScore)){
        conflicts.push({date:m.matchDate,home:m.homeTeamName,away:m.awayTeamName});
        continue; // conflito requer revisao, nunca sobrescreve um resultado ja publicado.
      }
    }
    if(uidx>=0)upcoming.splice(uidx,1);
    if(m.matchStatus==='FINISHED'){
      if(previous>=0)results[previous]={...old,...m,id:old?.id||m.id};
      else results.push({...old,...m,id:old?.id||m.id});
    }else{
      // Partidas atuais/futuras devem aparecer em 'proximas'.
      // Nao remove nem rebaixa resultados ja confirmados.
      if(previous>=0&&String(results[previous].matchStatus).toUpperCase()==='FINISHED')continue;
      if(previous>=0)results.splice(previous,1);
      upcoming.push({...old,...m,id:old?.id||m.id});
    }
  }
  results.sort((a,b)=>fixtureTime(b)-fixtureTime(a));
  upcoming.sort((a,b)=>fixtureTime(a)-fixtureTime(b));
  return {
    ...feed,results,upcoming,
    sourceState:{
      ...feed.sourceState,
      espn:{status:'OK',checkedAt:now.toISOString(),fixtures:parsed.length,conflicts,source:SCOREBOARD},
      // Nao declarar a classificacao ou elenco atualizados sem uma fonte especifica.
      standingsFresh:false,teamFormsFresh:false
    }
  };
}

async function getEvents(now){
  // ESPN limita as janelas aceitas; consultar dias individuais, nunca um mes inteiro.
  // Periodo de ~duas semanas cobre o ultimo e o proximo compromisso do clube.
  const offsets=[0,-1,1,-2,2,-3,3,-4,4,-5,5,-6,6,-7,7];
  const events=new Map();
  let okDays=0;
  const errors=[];
  for(const shift of offsets){
    const date=isoDate(plusDays(now,shift));
    const url=SCOREBOARD+'?dates='+date+'&limit=100';
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),12000);
    try{
      const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'TigreDataUpdater/1.0'},signal:controller.signal});
      if(!r.ok){
        errors.push(date+':HTTP '+r.status);
        if([401,403,429].includes(r.status))throw new Error('Fonte ESPN bloqueou consultas: HTTP '+r.status);
        continue;
      }
      const data=await r.json();
      if(!Array.isArray(data?.events)){errors.push(date+': formato invalido');continue}
      okDays++;
      for(const e of data.events)if(e?.id)events.set(String(e.id),e);
    }catch(e){
      errors.push(date+': '+String(e.message||e));
      if(/bloqueou consultas/.test(e.message||''))throw e;
    }finally{clearTimeout(timeout)}
  }
  if(!okDays)throw new Error('ESPN nao respondeu dias validos: '+errors.slice(0,5).join('; '));
  return [...events.values()];
}

async function main(){
  const now=new Date();
  const base=JSON.parse(await fs.readFile('latest.json','utf8'));
  const events=await getEvents(now);
  const next=mergeFeed(base,events,now);
  const count=next.sourceState.espn.fixtures;
  const conflicts=next.sourceState.espn.conflicts;
  // Erros de fonte nao podem atualizar marcadores de frescor ou rebaixar dados antigos.
  if(conflicts.length)console.warn('Conflitos de placar preservados para revisao: '+JSON.stringify(conflicts));
  console.log('Fonte respondendo; '+count+' jogo(s) do Criciuma verificados.');
  const oldBase={...base,sourceState:{...base.sourceState}};
  // Grava no maximo uma vez a cada 6h sem mudancas em partidas, evitando commits de ruido.
  const oldCheck=new Date(base.sourceState?.espn?.checkedAt||0).getTime();
  const changed=JSON.stringify({...next,sourceState:oldBase.sourceState})!==JSON.stringify(oldBase);
  if(!changed&&now.getTime()-oldCheck<6*3600000){console.log('Sem partidas novas ou alteradas.');return}
  next.checkedAt=now.toISOString();
  await fs.writeFile('latest.json',JSON.stringify(next,null,2)+'\n');
  console.log('Feed Tigre Data atualizado com verificacao e origem.');
}

if(import.meta.url===new URL('file://'+process.argv[1]).href){
  main().catch(e=>{console.error('Falha real na atualizacao: '+e.message);process.exitCode=1;});
}
