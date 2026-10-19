import test from 'node:test';
import assert from 'node:assert/strict';
import {flattenedRoster,findMatches,mergeVerifiedPlayers} from '../scripts/refresh-players.mjs';
const t=new Date('2026-10-19T20:00:00Z');
const players=Array.from({length:20},(_,i)=>({
  name:'Atleta '+String(i+1),fullName:'Atleta '+String(i+1),number:String(i+1),
  birthdate:'1995-01-01',weightKg:null,heightCm:null,position:i===0?'Goleiros':'Zagueiros',
  seasonStats:{xG:0.7,updatedAt:'2026-09-30'}
}));
const athletes=players.map((p,i)=>({
 id:String(100+i),displayName:p.name,fullName:p.fullName,jersey:p.number,
 dateOfBirth:p.birthdate+'T00:00Z',height:i===0?74:70,weight:i===0?183:160,
 citizenship:'Brazil',position:{name:'Goalkeeper'},
 statistics:{splits:{categories:[{stats:[
  {name:'appearances',value:25},{name:'totalGoals',value:2},{name:'goalAssists',value:3},
  {name:'yellowCards',value:1},{name:'redCards',value:0},
  {name:'totalShots',value:4},{name:'shotsOnTarget',value:2},
  {name:'saves',value:55},{name:'goalsConceded',value:15}
 ]}]}}
}));
const fixture={team:{displayName:'Criciúma'},athletes:[{position:'F',items:athletes}]};
test('identifica elenco agrupado e preenche medidas reais convertidas de inch/lbs',()=>{
 const base={players,sourceState:{}};
 const r=mergeVerifiedPlayers(base,fixture,t);
 assert.equal(r.audit.matched,20);
 assert.equal(r.feed.players[0].heightCm,188);
 assert.equal(r.feed.players[0].weightKg,83);
 assert.equal(r.feed.players[0].seasonStats.appearances,25);
 assert.equal(r.feed.players[0].seasonStats.assists,3);
 assert.equal(r.feed.players[0].seasonStats.saves,55);
 assert.equal(r.feed.players[1].seasonStats.saves,undefined);
 assert.equal(r.feed.players[0].seasonStats.xG,0.7);
 assert.equal(r.feed.players[0].seasonStats.advancedStatsCheckedAt,'2026-09-30');
 assert.ok(r.feed.players[0].seasonStats.metricSources.appearances.url.includes('9971'));
 assert.equal(r.feed.players[0].playerFieldSources.weightKg.source,'ESPN Série B 2026');
});
test('nao mistura atletas com aniversarios conflitantes',()=>{
 const source=structuredClone(fixture);
 source.athletes[0].items[0].dateOfBirth='2001-05-02T00:00Z';
 const r=mergeVerifiedPlayers({players,sourceState:{}},source,t);
 assert.equal(r.audit.matched,19);
 assert.equal(r.feed.players[0].espnId,undefined);
 assert.equal(r.feed.players[0].seasonStats.appearances,undefined);
 assert.equal(r.audit.unmatchedCount,1);
});
test('nao aceita elenco estranho ou incompleto',()=>{
 assert.throws(()=>mergeVerifiedPlayers({players,sourceState:{}},{team:{displayName:'Outro'},athletes},t),/incorreta/);
 assert.throws(()=>mergeVerifiedPlayers({players,sourceState:{}},{team:{displayName:'Criciúma'},athletes:athletes.slice(0,2)},t),/ausente/);
});
test('nao cria distancia ou velocidade sem dados medidos',()=>{
 const r=mergeVerifiedPlayers({players,sourceState:{}},fixture,t);
 assert.equal(r.feed.players[0].physical?.distanceKm,undefined);
 assert.equal(r.audit.physicalMatchMetrics,'indisponiveis no feed de elenco ESPN');
});
