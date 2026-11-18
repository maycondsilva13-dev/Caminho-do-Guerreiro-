/**
 * TESTES FUNCIONAIS — ETAPA 4: CAMPEONATOS RESPEITANDO A GEOGRAFIA E DESLOCAMENTOS
 *
 * Cobre:
 * 1. Todos os 19 torneios oficiais resolvem para uma das 27 capitais brasileiras (sem interior) ou sedes internacionais reais
 * 2. Campeonatos municipais e estaduais acompanham a capital/UF atual do atleta no Brasil (custo R$ 0)
 * 3. Campeonatos municipais, estaduais e regionais bloqueiam inscrição se o atleta residir no exterior
 * 4. Campeonato estadual vinculado a UF específica bloqueia atleta de outro estado
 * 5. Circuito regional (Jogos de Capoeira da Bahia) sedia em Salvador (BA) com viagem R$ 0 para BA e custo proporcional para outras capitais
 * 6. Campeonatos nacionais aceitam atletas de qualquer um dos 26 estados + DF, calculando distância e despesa reais de viagem
 * 7. Inscrição cobra taxa + deslocamento e bloqueia quando saldo cobre apenas a taxa mas não o deslocamento
 * 8. Regra protetiva para viagem interestadual/internacional de menor com apoio familiar insuficiente (< 40)
 * 9. Chaveamentos gerados respeitam a geografia do torneio (locais/estaduais na UF, nacionais nas 27 capitais, mundiais globais)
 * 10. Convites MMA Pro principais (entryFee === 0) têm passagem custeada pelo evento e migração preserva hostCity legada
 */

import { INITIAL_TOURNAMENTS } from '../data/tournamentsData';
import { Tournament } from '../types/game';
import { createNewCharacter, migrateCharacterData } from '../utils/characterHelper';
import { isStrictPlayableCapital } from '../utils/regionalGeographyHelper';
import {
  evaluateTournamentGeographyAndTravel,
  resolveTournamentHostLocation
} from '../utils/tournamentGeographyHelper';
import { validateTournamentEligibility } from '../utils/tournamentTimeline';
import {
  advanceCharacterToTournamentDate,
  performTournamentWeighIn,
  registerCharacterInTournament
} from '../utils/tournamentFlow';
import { buildTournamentBracket } from '../utils/tournamentBracket';

let passedTests = 0;
const totalTests = 10;

function assert(condition: boolean, testNum: number, name: string, details?: string) {
  if (condition) {
    passedTests++;
    console.log(`[PASS] Teste ${testNum}: ${name}`);
  } else {
    console.error(`[FAIL] Teste ${testNum}: ${name}`);
    if (details) console.error(`       Detalhes: ${details}`);
    process.exit(1);
  }
}

console.log('================================================================');
console.log('TESTES — ETAPA 4: GEOGRAFIA DOS CAMPEONATOS & VIAGENS');
console.log('================================================================\n');

const baseChar = createNewCharacter(
  'Rafael Nordestino',
  'Cangaceiro',
  { day: 10, month: 3, year: 2003 },
  21,
  'jiujitsu',
  '🥋',
  'CE',
  'Fortaleza'
);
baseChar.weight = 68;
baseChar.money = 8000;
baseChar.artGraduations.jiujitsu.rankIndex = 5;
baseChar.artGraduations.capoeira.rankIndex = 3;
baseChar.artGraduations.boxe.rankIndex = 3;
baseChar.artGraduations.karate.rankIndex = 3;
baseChar.artGraduations.mma.rankIndex = 2;

// -------------------------------------------------------------------------
// TESTE 1: Todos os 19 torneios resolvem apenas para 27 capitais ou exterior
// -------------------------------------------------------------------------
{
  const invalidBrazilHosts = INITIAL_TOURNAMENTS.filter((t) => {
    const host = resolveTournamentHostLocation(t, baseChar);
    if (host.isBrazil) {
      return !isStrictPlayableCapital(host.hostCity) || !host.hostUf;
    }
    return !host.hostCity || !host.hostCountry;
  });

  assert(
    INITIAL_TOURNAMENTS.length === 19 && invalidBrazilHosts.length === 0,
    1,
    'Todos os 19 torneios resolvem estritamente para as 27 capitais brasileiras ou polos internacionais reais',
    `inválidos=${invalidBrazilHosts.map((t) => t.id).join(',')}`
  );
}

// -------------------------------------------------------------------------
// TESTE 2: Municipais e estaduais acompanham a capital/UF atual do atleta
// -------------------------------------------------------------------------
{
  const openMun = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_copa_interna_bjj')!;
  const estKarate = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_karate_wkf_estadual')!;

  const geoMunCe = evaluateTournamentGeographyAndTravel(baseChar, openMun);
  const geoEstCe = evaluateTournamentGeographyAndTravel(baseChar, estKarate);

  const rioChar = { ...baseChar, homeState: 'RJ', homeCity: 'Rio de Janeiro', currentCity: 'Rio de Janeiro' };
  const geoEstRj = evaluateTournamentGeographyAndTravel(rioChar, estKarate);

  assert(
    geoMunCe.host.hostCity === 'Fortaleza' &&
      geoMunCe.host.hostUf === 'CE' &&
      geoMunCe.effectiveTravelCost === 0 &&
      geoEstCe.host.hostCity === 'Fortaleza' &&
      geoEstCe.host.hostUf === 'CE' &&
      geoEstRj.host.hostCity === 'Rio de Janeiro' &&
      geoEstRj.host.hostUf === 'RJ' &&
      geoEstRj.territoriallyEligible === true,
    2,
    'Torneios municipais e estaduais dinâmicos se vinculam à capital/UF atual do atleta sem criar clones artificiais'
  );
}

// -------------------------------------------------------------------------
// TESTE 3: Residência no exterior bloqueia torneios municipais/estaduais/regionais
// -------------------------------------------------------------------------
{
  const openMun = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_copa_interna_bjj')!;
  const estJudo = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_copa_judo_kodomo')!;
  const regBahia = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_jogos_capoeira_bahia')!;

  const abroadChar = {
    ...baseChar,
    currentCountry: 'Japão',
    currentCity: 'Tóquio'
  };

  const munRes = validateTournamentEligibility(abroadChar, openMun);
  const estRes = validateTournamentEligibility(abroadChar, estJudo);
  const regRes = validateTournamentEligibility(abroadChar, regBahia);

  assert(
    munRes.geography.territoriallyEligible === false &&
      estRes.geography.territoriallyEligible === false &&
      regRes.geography.territoriallyEligible === false,
    3,
    'Atleta residindo no exterior é impedido de disputar circuitos municipais, estaduais e regionais do Brasil'
  );
}

// -------------------------------------------------------------------------
// TESTE 4: Campeonato estadual com UF fixa bloqueia atleta de outro estado
// -------------------------------------------------------------------------
{
  const openMun = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_karate_wkf_estadual')!;
  const fixedPrState: Tournament = {
    ...openMun,
    id: 'test_estadual_pr_fixo',
    dynamicLocalHost: false,
    hostUf: 'PR',
    hostCity: 'Curitiba',
    hostCountry: 'Brasil'
  };

  const ceAttempt = validateTournamentEligibility(baseChar, fixedPrState); // Atleta no CE
  const prChar = { ...baseChar, homeState: 'PR', homeCity: 'Curitiba', currentCity: 'Curitiba' };
  const prAttempt = validateTournamentEligibility(prChar, fixedPrState);

  assert(
    ceAttempt.geography.territoriallyEligible === false &&
      ceAttempt.reasons.some((r) => r.includes('PR')) &&
      prAttempt.geography.territoriallyEligible === true,
    4,
    'Estadual vinculado a UF específica (PR) bloqueia atleta domiciliado em outro estado (CE) e libera residente'
  );
}

// -------------------------------------------------------------------------
// TESTE 5: Circuito regional da Bahia ancora em Salvador (BA) com custo coerente
// -------------------------------------------------------------------------
{
  const regBahia = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_jogos_capoeira_bahia')!;
  const baChar = { ...baseChar, homeState: 'BA', homeCity: 'Salvador', currentCity: 'Salvador' };

  const geoBa = evaluateTournamentGeographyAndTravel(baChar, regBahia);
  const geoCe = evaluateTournamentGeographyAndTravel(baseChar, regBahia);

  assert(
    geoBa.host.hostCity === 'Salvador' &&
      geoBa.host.hostUf === 'BA' &&
      geoBa.effectiveTravelCost === 0 &&
      geoCe.territoriallyEligible === true &&
      geoCe.effectiveTravelCost > 0 &&
      geoCe.travelLogistics.distanceKm > 900,
    5,
    'Jogos Oficiais da Bahia ancoram em Salvador (BA): viagem R$ 0 para baianos e custo aéreo proporcional para outros estados'
  );
}

// -------------------------------------------------------------------------
// TESTE 6: Nacionais permitem atletas de diferentes estados com custo proporcional
// -------------------------------------------------------------------------
{
  const brIbjjf = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_brasileiro_ibjjf')!; // Sede: São Paulo (SP)

  const spChar = { ...baseChar, homeState: 'SP', homeCity: 'São Paulo', currentCity: 'São Paulo' };
  const prChar = { ...baseChar, homeState: 'PR', homeCity: 'Curitiba', currentCity: 'Curitiba' };
  const amChar = { ...baseChar, homeState: 'AM', homeCity: 'Manaus', currentCity: 'Manaus' };

  const geoSp = evaluateTournamentGeographyAndTravel(spChar, brIbjjf);
  const geoPr = evaluateTournamentGeographyAndTravel(prChar, brIbjjf);
  const geoAm = evaluateTournamentGeographyAndTravel(amChar, brIbjjf);

  assert(
    geoSp.territoriallyEligible &&
      geoPr.territoriallyEligible &&
      geoAm.territoriallyEligible &&
      geoSp.effectiveTravelCost === 0 &&
      geoPr.effectiveTravelCost > 0 &&
      geoPr.effectiveTravelCost < geoAm.effectiveTravelCost &&
      geoPr.travelLogistics.distanceKm < geoAm.travelLogistics.distanceKm,
    6,
    'Brasileiro CBJJ (São Paulo) aceita atletas de SP, PR e AM com custos crescentes conforme distância real'
  );
}

// -------------------------------------------------------------------------
// TESTE 7: Inscrição cobra taxa + viagem e aplica fadiga leve no deslocamento
// -------------------------------------------------------------------------
{
  const brIbjjf = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_brasileiro_ibjjf')!; // SP, taxa R$ 180
  const m = brIbjjf.monthScheduled!;
  const geoAm = evaluateTournamentGeographyAndTravel(
    { ...baseChar, homeState: 'AM', homeCity: 'Manaus', currentCity: 'Manaus' },
    brIbjjf
  );

  // Tem dinheiro para a taxa (180), mas não para taxa + passagem de Manaus -> SP
  const poorAm = createNewCharacter('Caboclo', 'Ribeirinho', { day: 5, month: 2, year: 2003 }, 21, 'jiujitsu', '🥋', 'AM', 'Manaus');
  poorAm.weight = 68;
  poorAm.artGraduations.jiujitsu.rankIndex = 5;
  poorAm.currentDate = { day: 5, month: m, year: poorAm.currentYear };
  poorAm.money = brIbjjf.entryFee + 50; // Insuficiente para viagem

  const blocked = registerCharacterInTournament(poorAm, brIbjjf);

  // Agora com saldo completo para inscrição + viagem
  poorAm.money = geoAm.totalRegistrationCost + 100;
  const regOk = registerCharacterInTournament(poorAm, brIbjjf);
  let c = regOk.updatedChar;
  const spent = geoAm.totalRegistrationCost + 100 - c.money;

  c = advanceCharacterToTournamentDate(c, brIbjjf, 'weigh_in').updatedChar;
  c = performTournamentWeighIn(c, brIbjjf).updatedChar;
  c = advanceCharacterToTournamentDate(c, brIbjjf, 'fight').updatedChar;

  assert(
    blocked.success === false &&
      blocked.message.includes('Deslocamento') &&
      regOk.success === true &&
      Math.abs(spent - geoAm.totalRegistrationCost) < 0.01 &&
      regOk.entry?.hostCity === 'São Paulo' &&
      regOk.entry?.travelCostPaid === geoAm.effectiveTravelCost &&
      (c.accumulatedFatigue || 0) > 0,
    7,
    'Inscrição deduz taxa + viagem real, registra sede e aplica desgaste proporcional na viagem para a luta'
  );
}

// -------------------------------------------------------------------------
// TESTE 8: Menor com baixo apoio familiar é bloqueado em viagem longa/exterior
// -------------------------------------------------------------------------
{
  const longBeach = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_mundial_ibjjf_longbeach')!;
  const minor = createNewCharacter('Enzo', 'Júnior', { day: 1, month: 1, year: 2012 }, 13, 'jiujitsu', '🥋', 'SP', 'São Paulo');
  minor.weight = 68;
  minor.artGraduations.jiujitsu.rankIndex = 5;
  minor.money = 10000;
  minor.familySupport = 25; // Apoio familiar baixo

  const blockedMinor = validateTournamentEligibility(minor, longBeach);
  minor.familySupport = 80; // Apoio familiar saudável autoriza
  const allowedMinor = validateTournamentEligibility(minor, longBeach);

  assert(
    blockedMinor.geography.territoriallyEligible === false &&
      allowedMinor.geography.territoriallyEligible === true,
    8,
    'Menor de idade sem apoio familiar (<40) tem viagem internacional bloqueada até obter respaldo familiar'
  );
}

// -------------------------------------------------------------------------
// TESTE 9: Chaveamentos respeitam geografia do torneio sem cidades fictícias
// -------------------------------------------------------------------------
{
  const estKarate = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_karate_wkf_estadual')!;
  const brCapoeira = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_brasileiro_cbc_capoeira')!;
  const tokyoWkf = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_mundial_wkf_tokyo')!;

  const localBracket = buildTournamentBracket(estKarate, baseChar, 2026);
  const natBracket = buildTournamentBracket(brCapoeira, baseChar, 2026);
  const worldBracket = buildTournamentBracket(tokyoWkf, baseChar, 2026);

  const allLocalAreBrazil = localBracket.participants.every((p) => (p.country || 'Brasil') === 'Brasil');
  const allNatOppsValidCapitals = natBracket.participants
    .filter((p) => (p.country || 'Brasil') === 'Brasil')
    .every((p) => isStrictPlayableCapital(p.city));
  const worldHasForeign = worldBracket.participants.some((p) => (p.country || 'Brasil') !== 'Brasil');

  assert(
    allLocalAreBrazil && allNatOppsValidCapitals && worldHasForeign,
    9,
    'Chaves refletem abrangência territorial: estaduais no Brasil, nacionais em 27 capitais e mundiais com estrangeiros'
  );
}

// -------------------------------------------------------------------------
// TESTE 10: MMA Pro título tem passagem custeada + migração de save preserva capitais
// -------------------------------------------------------------------------
{
  const jungle = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_jungle_fight_cinturao')!;
  const geoJungle = evaluateTournamentGeographyAndTravel(baseChar, jungle);

  const legacyChar: any = JSON.parse(JSON.stringify(baseChar));
  legacyChar.tournamentHistory = [
    {
      tournamentId: 'tourn_brasileiro_ibjjf',
      year: 2025,
      month: 4,
      registered: true,
      weighInPassed: true,
      completed: true,
      hostCity: 'São Paulo - SP',
      hostCountry: 'Brasil'
    }
  ];
  const migrated = migrateCharacterData(legacyChar);

  assert(
    geoJungle.host.hostCity === 'Manaus' &&
      geoJungle.host.hostUf === 'AM' &&
      geoJungle.travelCoveredByPromotion === true &&
      geoJungle.effectiveTravelCost === 0 &&
      migrated.tournamentHistory![0].hostCity === 'São Paulo',
    10,
    'Jungle Fight (Manaus/AM) custeia passagem em disputa de título e migração normaliza hostCity legada'
  );
}

console.log('\n================================================================');
console.log(`RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS COM SUCESSO!`);
console.log('================================================================\n');
