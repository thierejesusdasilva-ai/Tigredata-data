// Probe read only: inspect live provider schemas for Criciuma players.
// Does not change player data and never prints tokens.
const urls={
 espnRoster:"https://site.api.espn.com/apis/site/v2/sports/soccer/bra.2/teams/9971/roster?season=2026",
 espnTeam:"https://site.api.espn.com/apis/site/v2/sports/soccer/bra.2/teams/9971",
 espnStats:"https://site.api.espn.com/apis/site/v2/sports/soccer/bra.2/teams/9971/statistics?season=2026",
 fotmobTeam:"https://www.fotmob.com/api/teams?id=7729&ccode3=BRA_M&season=2026",
 fotmobPlayer:"https://www.fotmob.com/api/playerData?id=604563",
 espnAthlete:"https://sports.core.api.espn.com/v2/sports/soccer/leagues/bra.2/athletes/1"
};
const fetchData=async(name,url)=>{
 try{
 const c=new AbortController();const stop=setTimeout(()=>c.abort(),11000);
 let r;try{r=await fetch(url,{headers:{Accept:"application/json", "User-Agent":"TigreDataUpdater/1.0"},signal:c.signal})}finally{clearTimeout(stop)}
 if(!r.ok)return {name,status:r.status};
 const obj=await r.json();
 let athletes=obj.athletes||obj.items||obj.squad||[];
 if(!Array.isArray(athletes))athletes=[];
 athletes=athletes.flatMap(a=>Array.isArray(a.items)?a.items:[a]);
 const keys=o=>o&&typeof o==="object"?Object.keys(o):[];
 if(name==='espnRoster'){
   const sample=athletes.find(a=>a.displayName==='Marcelo Hermes')||athletes[0];
   const stats=sample?.statistics||{};
   console.log('ROSTER_STAT_SHAPE',JSON.stringify({name:sample?.displayName,allPlayerKeys:Object.keys(sample||{}),statKeys:Object.keys(stats),metricNames:(stats.splits?.categories||[]).flatMap(x=>(x.stats||[]).map(s=>s.name)),samples:athletes.filter(x=>['Marcelo Hermes','Airton','Fellipe Mateus'].includes(x.displayName)).map(x=>({name:x.displayName,height:x.height,weight:x.weight,dob:x.dateOfBirth,birthPlace:x.birthPlace,stats:(x.statistics?.splits?.categories||[]).flatMap(c=>(c.stats||[]).map(s=>[s.name,s.value]))})),splitsType:typeof stats.splits,splitKeys:Object.keys(stats.splits||{}),splitSample:JSON.stringify(stats.splits||{}).slice(0,2300)},null,2));
 }
 if(name==='espnStats'){
   console.log('TEAM_STAT_SHAPE',JSON.stringify({resultsCount:obj.results?.length,resultsSample:JSON.stringify(obj.results||[]).slice(0,2500)},null,2));
 }
 const playerFields=athletes.slice(0,1).map(x=>Object.fromEntries(Object.entries(x).filter(([k,v])=>/name|date|birth|weight|height|position|jersey|age|foot|citizenship|national|id|statistics|stats|team/i.test(k)).map(([k,v])=>[k, typeof v==="object"?(Array.isArray(v)?v.slice(0,1):Object.fromEntries(Object.entries(v).slice(0,5))):v])));
 return {name,status:r.status,keys:keys(obj),team:obj.team?.displayName||obj.team?.name,players:athletes.length,athletes:athletes.slice(0,40).map(x=>({id:x.id,name:x.displayName||x.fullName||x.name,jersey:x.jersey})),playerFields,sampleKeys:keys(obj.stats||obj.statistics),statsKeys:keys(obj.statistics||{}),squadKeys:keys(obj.squad||{})};
 }catch(e){return {name,error:String(e?.message||e).slice(0,200)}}
};
const out=await Promise.all(Object.entries(urls).map(([name,url])=>fetchData(name,url)));
console.log(JSON.stringify(out,null,2));
