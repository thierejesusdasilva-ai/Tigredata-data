import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import {validPoints,validateSnapshot,writeSnapshot} from '../scripts/manual-heatmaps.mjs';

const eventId='12345678';
const feed={players:[
 {name:'Marcelo Hermes',sofaId:783490,squadStatus:'first_team'},
 {name:'Otero',sofaId:845323,squadStatus:'first_team'},
 {name:'Sandry',sofaId:973847,squadStatus:'departed'}]};
const snapshot={eventId,matchDate:'2026-10-18',homeTeam:'São Bernardo',awayTeam:'Criciúma',finished:true,players:[
 {sofaId:'783490',name:'Marcelo Hermes',points:[{x:33,y:70},{x:57,y:55}]},
 {sofaId:'845323',name:'Otero',points:[{x:80,y:20}]}]};
test('aceita pontos somente com coordenadas reais no intervalo 0-100',()=>{
 assert.deepEqual(validPoints([{x:0,y:100},{x:12.345,y:18.928}]),[{x:0,y:100},{x:12.35,y:18.93}]);
 for(const x of [[],[{x:-1,y:20}],[{x:20,y:101}],[{x:null,y:21}],[{x:'',y:4}],[{x:Infinity,y:3}]])
 assert.throws(()=>validPoints(x));
});
test('rejeita origem falsa, id divergente, partida em andamento e atleta nao cadastrado',()=>{
 assert.throws(()=>validateSnapshot({...snapshot,eventId:'87654321'},feed,eventId),/ID_PARTIDA/);
 assert.throws(()=>validateSnapshot({...snapshot,awayTeam:'Palmeiras',homeTeam:'Flamengo'},feed,eventId),/CRICIUMA/);
 assert.throws(()=>validateSnapshot({...snapshot,finished:false},feed,eventId),/FINALIZADO/);
 assert.throws(()=>validateSnapshot({...snapshot,players:[{sofaId:973847,points:[{x:50,y:50}]}]},feed,eventId),/FORA_DO_ELENCO/);
 assert.throws(()=>validateSnapshot({...snapshot,players:[{sofaId:99,points:[{x:50,y:50}]}]},feed,eventId),/FORA_DO_ELENCO/);
});
test('guarda mapas por partida e atualiza indice de cada jogador sem duplicar',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'tigre-heat-'));
 try{
  const verified=validateSnapshot(snapshot,feed,eventId);
  const a=await writeSnapshot(verified,dir);
  assert.equal(a.players,2);
  assert.equal(a.points,3);
  await writeSnapshot(verified,dir);
  // Nova coleta do mesmo jogo pode conter menos atletas, sem referencias fantasmas.
  await writeSnapshot({...verified,players:verified.players.slice(0,1)},dir);
  const index=JSON.parse(await fs.readFile(path.join(dir,'heatmaps/index.json'),'utf8'));
  const archive=JSON.parse(await fs.readFile(path.join(dir,'heatmaps/events/'+eventId+'.json'),'utf8'));
  assert.equal(index.players['783490'].length,1);
  assert.equal(archive.players[0].points[1].x,57);
  assert.equal(archive.source,'Sofascore (mapa por partida)');
  assert.equal(index.events[eventId].players.length,1);
  assert.equal(index.players['845323'],undefined);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
