// Correções confirmadas em fontes públicas do clube e perfis esportivos.
// Identificação por sofaId previamente presente no feed, não apenas nome.
export const VERIFIED_PLAYERS=[
  {
    sofaId:'1927514',name:'Ruan',
    fields:{
      fullName:'Ruan Rodrigues Carvalho',birthdate:'2006-10-21',
      heightCm:190,weightKg:75,number:'43',country:'Brasil',preferredFoot:'Direito',
      espnId:'397652',squadStatus:'first_team'
    },
    sources:{
      fullName:'https://www.criciuma.com.br/m/elenco-profissional/ruan-rodrigues-carvalho',
      birthdate:'https://www.criciuma.com.br/m/elenco-profissional/ruan-rodrigues-carvalho',
      heightCm:'https://www.criciuma.com.br/m/elenco-profissional/ruan-rodrigues-carvalho',
      weightKg:'https://www.criciuma.com.br/m/elenco-profissional/ruan-rodrigues-carvalho',
      number:'https://www.criciuma.com.br/m/elenco-profissional/ruan-rodrigues-carvalho',
      country:'https://www.sofascore.com/pt/football/player/ruan-rodrigues-carvalho/1927514',
      preferredFoot:'https://www.sofascore.com/pt/football/player/ruan-rodrigues-carvalho/1927514',
      espnId:'https://site.api.espn.com/apis/site/v2/sports/soccer/bra.2/teams/9971/roster?season=2026',
      squadStatus:'https://www.criciuma.com.br/m/elenco-profissional/ruan-rodrigues-carvalho'
    },
    note:'O clube informa 21/10/2006; Sofascore informa 20/10/2006. Prevalece a ficha oficial; divergência não elimina associação estatística confirmada por nome completo e ESPN ID.'
  },
  {
    sofaId:'868076',name:'Willean Lepo',
    fields:{
      fullName:'Willean Bernardo Willemen',birthdate:'1997-01-16',
      heightCm:182,weightKg:78,preferredFoot:'Direito',
      country:'Brasil',espnId:'251863',squadStatus:'first_team'
    },
    sources:{
      fullName:'https://www.criciuma.com.br/m/elenco-profissional/willean-bernardo-willemen',
      birthdate:'https://www.criciuma.com.br/m/elenco-profissional/willean-bernardo-willemen',
      heightCm:'https://www.criciuma.com.br/m/elenco-profissional/willean-bernardo-willemen',
      weightKg:'https://www.criciuma.com.br/m/elenco-profissional/willean-bernardo-willemen',
      preferredFoot:'https://www.sofascore.com/pt/football/player/willean-lepo/868076',
      country:'https://www.sofascore.com/pt/football/player/willean-lepo/868076',
      espnId:'https://site.api.espn.com/apis/site/v2/sports/soccer/bra.2/teams/9971/roster?season=2026',
      squadStatus:'https://www.criciuma.com.br/m/elenco-profissional/willean-bernardo-willemen'
    },
    note:'ESPN escreve Willean Lepu; clube escreve Willean Lepo. Sem camisa confirmada pelo clube: usar identificador ESPN e atualizar camisa somente pelo dado da fonte.'
  },
  {
    sofaId:'2677500',name:'Kayck',
    fields:{
      fullName:'Kayck Gomes Carvalho',birthdate:'2007-10-02',
      country:'Brasil',position:'Laterais',squadStatus:'academy',
      squadCategory:'Sub-20'
    },
    sources:{
      fullName:'https://www.criciuma.com.br/m/noticias/roberto-volpato-define-a-pre-lista-para-a-copa-sp',
      birthdate:'https://fcf-sc.s3.sa-east-1.amazonaws.com/wp-content/uploads/2025/04/30180147/EDITAL.pdf',
      country:'https://www.sofascore.com/pt/football/player/kayck/2677500',
      position:'https://www.criciuma.com.br/m/noticias/roberto-volpato-define-a-pre-lista-para-a-copa-sp',
      squadStatus:'https://www.criciuma.com.br/m/noticias/tigre-e-tetracampeao-catarinense-sub-20',
      squadCategory:'https://www.criciuma.com.br/m/noticias/tigre-e-tetracampeao-catarinense-sub-20'
    },
    note:'CBF lista Kayck Gomes Carvalho na Série B e Sub-20; o clube o identifica como lateral-direito do Sub-20 em 2026. Data de nascimento 02/10/2007 no edital FCF, diferente de algumas bases; não inventar participações.'
  },
  {
    sofaId:'973847',name:'Sandry',
    fields:{
      squadStatus:'departed',destinationAtDeparture:'Santos',
      departureConfirmedAt:'2026-09-09',
      historicCriciumaAppearancesAllCompetitions:11,
      historicCriciumaAssistsAllCompetitions:1
    },
    sources:{
      squadStatus:'https://ge.globo.com/sc/futebol/noticia/2026/09/09/criciuma-confirma-retorno-do-meia-sandry-ao-santos.ghtml',
      destinationAtDeparture:'https://ge.globo.com/sc/futebol/noticia/2026/09/09/criciuma-confirma-retorno-do-meia-sandry-ao-santos.ghtml',
      departureConfirmedAt:'https://ge.globo.com/sc/futebol/noticia/2026/09/09/criciuma-confirma-retorno-do-meia-sandry-ao-santos.ghtml',
      historicCriciumaAppearancesAllCompetitions:'https://ge.globo.com/sc/futebol/noticia/2026/09/09/criciuma-confirma-retorno-do-meia-sandry-ao-santos.ghtml',
      historicCriciumaAssistsAllCompetitions:'https://ge.globo.com/sc/futebol/noticia/2026/09/09/criciuma-confirma-retorno-do-meia-sandry-ao-santos.ghtml'
    },
    note:'11 jogos e 1 assistência pelo clube, não estatísticas da Série B. Histórico preservado.'
  },
  {
    sofaId:'1093109',name:'Eliel',
    fields:{
      fullName:'Eliel Felisbino Costa',birthdate:'2003-03-24',country:'Brasil',
      birthPlace:'Orleans (SC)',heightCm:170,weightKg:75,preferredFoot:'Direito',
      squadStatus:'departed',destinationAtDeparture:'Hercílio Luz',
      departureConfirmedAt:'2026-09-03',
      historicCriciumaAppearancesAllCompetitions:12
    },
    sources:{
      fullName:'https://www.zerozero.pt/jogador/eliel-costa/838973?edicao_id=210278',
      birthdate:'https://www.zerozero.pt/jogador/eliel-costa/838973?edicao_id=210278',
      country:'https://www.zerozero.pt/jogador/eliel-costa/838973?edicao_id=210278',
      birthPlace:'https://www.zerozero.pt/jogador/eliel-costa/838973?edicao_id=210278',
      heightCm:'https://www.zerozero.pt/jogador/eliel-costa/838973?edicao_id=210278',
      weightKg:'https://www.zerozero.pt/jogador/eliel-costa/838973?edicao_id=210278',
      preferredFoot:'https://www.zerozero.pt/jogador/eliel-costa/838973?edicao_id=210278',
      squadStatus:'https://criciuma.com.br/noticias/o-clube/comunicado-oficial-161',
      destinationAtDeparture:'https://criciuma.com.br/noticias/o-clube/comunicado-oficial-161',
      departureConfirmedAt:'https://criciuma.com.br/noticias/o-clube/comunicado-oficial-161',
      historicCriciumaAppearancesAllCompetitions:'https://criciuma.com.br/noticias/o-clube/comunicado-oficial-161'
    },
    note:'12 partidas pelo profissional do Criciúma no histórico geral; não aplicar como participações na Série B 2026. Perfil Sofascore legado pode usar outro ID: não remapear automaticamente.'
  }
];

export function applyVerifiedProfiles(feed, checkedAt=new Date()){
 if(!Array.isArray(feed?.players))throw new Error('Feed sem lista de atletas');
 const updates=new Map(VERIFIED_PLAYERS.map(x=>[x.sofaId,x]));
 const seen=new Set(),records=[];
 const players=feed.players.map(p=>{
  const spec=updates.get(String(p.sofaId||''));
  if(!spec||p.name!==spec.name)return p;
  seen.add(spec.sofaId);
  const patched={...p}, fieldSources={...(p.playerFieldSources||{})};
  const stamp=checkedAt.toISOString();
  for(const [field,value] of Object.entries(spec.fields)){
   // Usar prioritariamente a fonte publicada pelo clube, sem sobrescrever com medidas ESPN divergentes.
   patched[field]=value;
   fieldSources[field]={source:spec.sources[field],checkedAt:stamp,verifiedDate:'2026-10-19',locked:true};
  }
  patched.playerFieldSources=fieldSources;
  patched.profileVerificationNote=spec.note;
  records.push({name:p.name,sofaId:spec.sofaId,fields:Object.keys(spec.fields),squadStatus:patched.squadStatus,verificationNote:spec.note});
  return patched;
 });
 if(seen.size!==VERIFIED_PLAYERS.length)throw new Error('Perfil verificado nao encontrado ou apelido divergente: '+VERIFIED_PLAYERS.filter(x=>!seen.has(x.sofaId)).map(x=>x.name).join(', '));
 return {feed:{...feed,players,sourceState:{...(feed.sourceState||{}),verifiedProfiles:{checkedAt:checkedAt.toISOString(),records}}},records};
}
