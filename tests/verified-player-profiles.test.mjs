import test from 'node:test';
import assert from 'node:assert/strict';
import {applyVerifiedProfiles} from '../scripts/verified-player-profiles.mjs';
import {findMatches, mergeVerifiedPlayers} from '../scripts/refresh-players.mjs';
const now=new Date('2026-10-19T23:00:00Z');
const five=[
{name:'Ruan',sofaId:1927514,number:'43',position:'Zagueiros'},
{name:'Willean Lepo',sofaId:868076,position:'Volantes'},
{name:'Kayck',sofaId:2677500,position:'Zagueiros'},
{name:'Sandry',sofaId:973847,position:'Meias'},
{name:'Eliel',sofaId:1093109,position:'Meias'}
];
const more=Array.from({length:25},(_,i)=>({name:'Treino '+i,sofaId:100000+i,number:String(i+1),position:'Meias',birthdate:'1995-02-12'}));
test('Corrige perfil e separa atletas de base ou ex-jogadores com fonte',()=>{
const out=applyVerifiedProfiles({players:[...five,...more],sourceState:{}},now);
assert.equal(out.records.length,5);
const players=out.feed.players;
const by=n=>players.find(x=>x.name===n);
assert.equal(by('Ruan').heightCm,190);
assert.equal(by('Ruan').birthdate,'2006-10-21');
assert.equal(by('Willean Lepo').fullName,'Willean Bernardo Willemen');
assert.equal(by('Willean Lepo').number,undefined);
assert.equal(by('Kayck').birthdate,'2007-10-02');
assert.equal(by('Kayck').squadStatus,'academy');
assert.equal(by('Sandry').squadStatus,'departed');
assert.equal(by('Eliel').squadStatus,'departed');
assert.equal(by('Eliel').historicCriciumaAppearancesAllCompetitions,12);
assert.equal(by('Kayck').playerFieldSources.birthdate.locked,true);
});
test('Ruan e Willean conciliação ESPN explícita não pega outros nomes',()=>{
const base=applyVerifiedProfiles({players:[...five,...more],sourceState:{}},now).feed;
const outsiders=more.map((x,i)=>({id:String(i+100),displayName:x.name,jersey:x.number,dateOfBirth:'1995-02-12'}));
const entries=[
{id:'397652',displayName:'Ruan Rodrigues Carvalho',dateOfBirth:'2006-10-20T00:00Z',jersey:'80',height:75,weight:179,statistics:{splits:{categories:[{stats:[{name:'appearances',value:12}]}]}}},
{id:'251863',displayName:'Willean Lepu',dateOfBirth:'1997-01-16T00:00Z',jersey:'2',height:73,weight:175,statistics:{splits:{categories:[{stats:[{name:'appearances',value:31}]}]}}}
];
const matches=findMatches(base.players,[...outsiders,...entries]);
assert.equal(matches.byId.get(base.players[0])?.id,'397652');
assert.equal(matches.byId.get(base.players[1])?.id,'251863');
const source={team:{displayName:'Criciúma'},athletes:[...outsiders,...entries]};
const enriched=mergeVerifiedPlayers(base,source,now);
const p=enriched.feed.players;
assert.equal(p[0].birthdate,'2006-10-21');
assert.equal(p[0].number,'43');
assert.equal(p[0].seasonStats.appearances,12);
assert.equal(p[1].weightKg,78);
assert.equal(p[1].seasonStats.appearances,31);
assert.equal(enriched.audit.matched,27);
assert.ok(enriched.audit.crossSourceDisagreements.some(x=>x.name==='Ruan'&&x.field==='birthdate'));
});
