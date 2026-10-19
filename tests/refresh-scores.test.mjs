import test from 'node:test';
import assert from 'node:assert/strict';
import {parseEvent,mergeFeed} from '../scripts/refresh-scores.mjs';

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
