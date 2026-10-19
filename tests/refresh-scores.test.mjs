import test from 'node:test';
import assert from 'node:assert/strict';
import {parseEvent,mergeFeed,applyVerifiedStandings} from '../scripts/refresh-scores.mjs';

const now=new Date('2026-10-19T18:00:00Z');
const event=(id,dt='2026-10-18T23:30:00Z',status='post',scoreH='2',scoreA='1')=>({
 id,date:dt,
 status:{type:{completed:status==='post',state:status,name:status==='post'?'STATUS_FINAL':'STATUS_SCHEDULED'}},
 competitions:[{competitors:[
 {homeAway:'home',team:{displayName:'Criciúma'},score:scoreH},
 {homeAway:'away',team:{displayName:'Avaí'},score:scoreA}
 ]}]
});

test('converte horarios BRT corretamente e so aprova placar final valido',()=>{
 const x=parseEvent(event('501','2026-10-20T00:30:00Z'),now);
 assert.equal(x.matchDate,'2026-10-19');
 assert.equal(x.matchTime,'21:30');
 assert.equal(x.matchStatus,'FINISHED');
 assert.equal(x.homeTeamFtScore,2);
 assert.equal(parseEvent(event('502','2026-10-19T12:00:00Z','pre'),now).homeTeamFtScore,null);
 assert.equal(parseEvent(event('503','2026-10-18T23:30:00Z','post',null,'1'),now),null);
});

test('atualiza jogo marcado, conserva id e passa partida finalizada aos resultados',()=>{
 const old={results:[],upcoming:[{id:'old1',homeTeamName:'Criciúma',awayTeamName:'Avaí',matchDate:'2026-10-18',kickoffUtc:'2026-10-18T23:30:00Z',matchStatus:'SCHEDULED'}],sourceState:{}};
 const x=mergeFeed(old,[event('501')],now);
 assert.equal(x.results.length,1);
 assert.equal(x.results[0].id,'old1');
 assert.equal(x.results[0].homeTeamFtScore,2);
 assert.equal(x.upcoming.length,0);
 assert.equal(x.sourceState.espn.status,'OK');
});

test('nao sobrescreve resultado conflitante de fonte ja registrada',()=>{
 const old={results:[{id:'prev',homeTeamName:'Criciúma',awayTeamName:'Avaí',matchDate:'2026-10-18',kickoffUtc:'2026-10-18T23:30:00Z',matchStatus:'FINISHED',homeTeamFtScore:1,awayTeamFtScore:0}],upcoming:[],sourceState:{}};
 const x=mergeFeed(old,[event('501')],now);
 assert.equal(x.results[0].homeTeamFtScore,1);
 assert.equal(x.sourceState.espn.conflicts.length,1);
});

test('impede atualizar feed por ausencia de jogos verificaveis',()=>{
 assert.throws(()=>mergeFeed({results:[],upcoming:[],sourceState:{}},[],now),/partidas validas/);
});


test('atualiza tabela inteira com 20 times e nomes equivalentes, sem inventar informacoes',()=>{
 const oldTeams=['Vila Nova FC','Novorizontino','Juventude','Fortaleza','Criciuma','Atletico GO','CRB','Sport Recife','Goias','Operario-PR','Cuiaba','Sao Bernardo','Botafogo SP','Athletic Club','Ceara','Nautico','Avai','Londrina','America MG','Ponte Preta'];
 const names=['Vila Nova','Novorizontino','Juventude','Fortaleza','Criciúma','Atlético Goianiense','CRB','Sport','Goiás','Operário PR','Cuiabá','São Bernardo','Botafogo-SP','Athletic','Ceará','Náutico','Avaí','Londrina','América Mineiro','Ponte Preta'];
 const data={season:{year:2026},children:[{standings:{entries:names.map((displayName,i)=>({team:{displayName},stats:[
 {name:'rank',value:i+1},{name:'gamesPlayed',value:1},{name:'wins',value:1},{name:'ties',value:0},{name:'losses',value:0},
 {name:'pointsFor',value:2},{name:'pointsAgainst',value:1},{name:'points',value:3}
 ]}))}}]};
 const feed={standings:oldTeams.map(teamName=>({teamName,overallLeaguePTS:'0'})),sourceState:{}};
 const updated=applyVerifiedStandings(feed,data,now);
 assert.equal(updated.standings.length,20);
 assert.equal(updated.standings.find(x=>x.teamName==='Criciuma').overallLeaguePosition,'5');
 assert.equal(updated.standings.find(x=>x.teamName==='Criciuma').overallLeaguePTS,'3');
 assert.equal(updated.sourceState.standingsFresh,true);
 assert.throws(()=>applyVerifiedStandings(feed,{...data,children:[]},now),/incompleta/);
});
