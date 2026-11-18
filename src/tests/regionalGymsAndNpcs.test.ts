/**
 * TESTES ETAPA 3:
 * Rede de Academias nas 27 Capitais, Professores, Equipes, Turmas,
 * Normalização Geográfica de Todos os NPCs & Migração de Saves V2/V3.
 */

import { BRAZIL_STATES } from '../data/brazilLocations';
import { WORLD_GYMS } from '../data/martialArtsData';
import { AVAILABLE_TURMAS } from '../data/gymClassesData';
import { REGIONAL_BRAZIL_GYMS, getRegionalGymIdsByUf } from '../data/regionalGymsCatalog';
import { WORLD_FIGHTERS, getMergedWorldFighters } from '../data/worldFightersData';
import {
  GymClassTurma,
  calculateSessionTrainingXp,
  getGymXpMultiplier,
  validateEnrollment
} from '../types/agenda';
import {
  createNewCharacter,
  migrateCharacterData
} from '../utils/characterHelper';
import {
  calculateGymMonthlyExpenses,
  checkSparringInjuryRisk,
  relocatePlayerToCapital,
  resolveEffectiveGymLocation,
  validateLocationCompatibility,
  validateTravelAuthorization
} from '../utils/recoveryHelper';
import { isStrictPlayableCapital } from '../utils/regionalGeographyHelper';
import {
  doesGymTeachArt,
  getCompetitiveScholarshipDiscount,
  getGymInstructorsForArt,
  getGymRivalries,
  getGymTrainingEffectiveness,
  getGymsOverviewByCapital
} from '../utils/regionalGymsHelper';
import { addTrainingGraduationXp } from '../utils/graduationHelper';

let passedTests = 0;
const totalTests = 14;

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
console.log('TESTES ETAPA 2/3: ACADEMIAS REGIONAIS, EQUIPES & NPCS (27 CAPITAIS)');
console.log('================================================================\n');

// -------------------------------------------------------------------------
// TESTE 1: Todas as 27 capitais têm academias social + competitiva com turmas e equipes próprias
// -------------------------------------------------------------------------
{
  const missingSocial: string[] = [];
  const missingComp: string[] = [];
  const missingTurmas: string[] = [];
  const invalidMetadata: string[] = [];

  for (const st of BRAZIL_STATES) {
    const ids = getRegionalGymIdsByUf(st.uf);
    const socialGym = WORLD_GYMS.find((g) => g.id === ids.socialId);
    const compGym = WORLD_GYMS.find((g) => g.id === ids.compId);

    if (!socialGym) missingSocial.push(st.uf);
    if (!compGym) missingComp.push(st.uf);

    if (socialGym) {
      if (
        socialGym.weeklyCost !== 0 ||
        socialGym.city !== st.capital ||
        socialGym.uf !== st.uf ||
        !socialGym.teamName ||
        !socialGym.masterName
      ) {
        invalidMetadata.push(`${socialGym.id}`);
      }
      if (!AVAILABLE_TURMAS.some((t) => t.gymId === socialGym.id)) {
        missingTurmas.push(socialGym.id);
      }
    }

    if (compGym) {
      if (
        compGym.weeklyCost <= 0 ||
        compGym.city !== st.capital ||
        compGym.uf !== st.uf ||
        !compGym.teamName ||
        !compGym.masterName
      ) {
        invalidMetadata.push(`${compGym.id}`);
      }
      if (!AVAILABLE_TURMAS.some((t) => t.gymId === compGym.id)) {
        missingTurmas.push(compGym.id);
      }
    }
  }

  const salvadorGym = WORLD_GYMS.find((g) => g.id === 'gym_terreiro_salvador');
  const legacySavedFixed = Boolean(salvadorGym && salvadorGym.city === 'Salvador' && salvadorGym.uf === 'BA');

  assert(
    REGIONAL_BRAZIL_GYMS.length >= 54 &&
      missingSocial.length === 0 &&
      missingComp.length === 0 &&
      missingTurmas.length === 0 &&
      invalidMetadata.length === 0 &&
      legacySavedFixed,
    1,
    `Todas as 27 capitais possuem academia social gratuita, centro competitivo, equipe, mestre e turmas (${REGIONAL_BRAZIL_GYMS.length} academias regionais)`,
    `missingSocial=${missingSocial.join(',')}, missingComp=${missingComp.join(',')}, missingTurmas=${missingTurmas.join(',')}, invalid=${invalidMetadata.join(',')}, salvadorFixed=${legacySavedFixed}`
  );
}

// -------------------------------------------------------------------------
// TESTE 2: Zero NPCs brasileiros fora das 27 capitais & 27/27 capitais representadas
// -------------------------------------------------------------------------
{
  const brFighters = WORLD_FIGHTERS.filter((f) => f.country === 'Brasil');
  const nonCapitals = brFighters.filter((f) => !isStrictPlayableCapital(f.city));
  const leftOnBairro = brFighters.filter((f) => f.gymId === 'gym_bairro');
  const gymIdSet = new Set(WORLD_GYMS.map((g) => g.id));
  const invalidGyms = WORLD_FIGHTERS.filter((f) => !f.gymId || !gymIdSet.has(f.gymId));

  const representedCapitals = new Set(brFighters.map((f) => f.city));
  const missingCapitals = BRAZIL_STATES.filter((s) => !representedCapitals.has(s.capital)).map((s) => s.capital);

  assert(
    brFighters.length > 0 &&
      nonCapitals.length === 0 &&
      leftOnBairro.length === 0 &&
      invalidGyms.length === 0 &&
      missingCapitals.length === 0,
    2,
    `Todos os ${brFighters.length} atletas brasileiros vivem nas 27 capitais (zero interior, 27/27 cobertas e 100% em academias regionais/mundiais)`,
    `nonCapitals=${nonCapitals.map((f) => `${f.id}:${f.city}`).join(',')}, bairro=${leftOnBairro.length}, missingCaps=${missingCapitals.join(',')}`
  );
}

// -------------------------------------------------------------------------
// TESTE 3: Custo regionalizado das mensalidades entre capitais de custos distintos
// -------------------------------------------------------------------------
{
  const spComp = WORLD_GYMS.find((g) => g.id === 'gym_cap_sp_comp');
  const piComp = WORLD_GYMS.find((g) => g.id === 'gym_cap_pi_comp');
  const spSocial = WORLD_GYMS.find((g) => g.id === 'gym_cap_sp_social');

  assert(
    Boolean(spComp && piComp && spSocial) &&
      spSocial!.weeklyCost === 0 &&
      spComp!.weeklyCost > piComp!.weeklyCost,
    3,
    `Mensalidades refletem diferença regional (Social SP R$ 0/sem | Comp PI R$ ${piComp?.weeklyCost}/sem vs Comp SP R$ ${spComp?.weeklyCost}/sem)`
  );
}

// -------------------------------------------------------------------------
// TESTE 4: Mesma capital permite matrícula/transferência gratuita (R$ 0), outra capital exige viagem
// -------------------------------------------------------------------------
{
  const char = createNewCharacter(
    'Marina',
    'Dragão',
    { day: 5, month: 5, year: 2009 }, // 16-17 anos (menor!)
    13,
    'muaythai',
    '🥊',
    'CE',
    'Fortaleza',
    'F',
    'dificil' // Apoio familiar baixo (humilde), mas mesma capital deve permitir!
  );
  char.familySupport = 35; // Abaixo de 50%, para testar que transferência na MESMA capital não bloqueia menor

  const ceSocialGym = WORLD_GYMS.find((g) => g.id === 'gym_cap_ce_social')!;
  const spCompGym = WORLD_GYMS.find((g) => g.id === 'gym_cap_sp_comp')!;
  const ceSocialTurma = AVAILABLE_TURMAS.find((t) => t.gymId === ceSocialGym.id)!;
  const spCompTurma = AVAILABLE_TURMAS.find((t) => t.gymId === spCompGym.id)!;

  const sameCapLoc = resolveEffectiveGymLocation(WORLD_GYMS[0], char);
  const compatLocal = validateLocationCompatibility(char, ceSocialGym.id);
  const compatRemote = validateLocationCompatibility(char, spCompGym.id);
  const authLocal = validateTravelAuthorization(char, ceSocialGym);
  const authRemote = validateTravelAuthorization(char, spCompGym);
  const enrollLocal = validateEnrollment(char, ceSocialTurma);
  const enrollRemote = validateEnrollment(char, spCompTurma);

  assert(
    sameCapLoc.city === 'Fortaleza' &&
      sameCapLoc.uf === 'CE' &&
      compatLocal.isCompatible === true &&
      compatRemote.isCompatible === false &&
      authLocal.canTravel === true &&
      authLocal.travelCost === 0 &&
      authLocal.logistics.isSameCapital === true &&
      authRemote.canTravel === false && // menor com apoio 35% não viaja para outro estado sem apoio
      authRemote.travelCost > 0 &&
      enrollLocal.isValid === true &&
      enrollRemote.isValid === false,
    4,
    'Troca e matrícula dentro da mesma capital (Fortaleza) custam R$ 0 e são válidas; outro estado exige viagem',
    `compatLocal=${compatLocal.isCompatible}, authLocal=${authLocal.canTravel}(R$${authLocal.travelCost}), authRemote=${authRemote.canTravel}(R$${authRemote.travelCost}), enrollLocal=${enrollLocal.isValid}(${enrollLocal.reason})`
  );
}

// -------------------------------------------------------------------------
// TESTE 5: Logística interestadual distinta entre capitais próximas vs distantes
// -------------------------------------------------------------------------
{
  const spPlayer = createNewCharacter(
    'Bruno',
    'Paulista',
    { day: 10, month: 2, year: 2002 },
    21,
    'jiujitsu',
    '🥋',
    'SP',
    'São Paulo'
  );
  spPlayer.fame = 100;
  spPlayer.money = 5000;

  const rjGym = WORLD_GYMS.find((g) => g.id === 'gym_cap_rj_comp')!;
  const maGym = WORLD_GYMS.find((g) => g.id === 'gym_cap_ma_comp')!;
  const authRj = validateTravelAuthorization(spPlayer, rjGym);
  const authMa = validateTravelAuthorization(spPlayer, maGym);

  assert(
    authRj.canTravel &&
      authMa.canTravel &&
      authMa.travelCost > authRj.travelCost &&
      authMa.logistics.distanceKm > authRj.logistics.distanceKm,
    5,
    `Custo de mudança escala por distância real (SP->RJ: R$ ${authRj.travelCost} / ${authRj.logistics.distanceKm}km vs SP->MA: R$ ${authMa.travelCost} / ${authMa.logistics.distanceKm}km)`
  );
}

// -------------------------------------------------------------------------
// TESTE 6: Migração de saves legados V2/V3 normaliza cidades do interior para as 27 capitais
// -------------------------------------------------------------------------
{
  const legacySave: any = createNewCharacter(
    'Carlos',
    'Veterano',
    { day: 1, month: 1, year: 2000 },
    21,
    'jiujitsu',
    '🥋',
    'SP',
    'São Paulo'
  );
  legacySave.homeState = 'BA';
  legacySave.homeCity = 'Salvador da Bahia';
  legacySave.currentCity = 'Feira de Santana';
  legacySave.rivals = [
    {
      ...WORLD_FIGHTERS[0],
      city: 'Campinas',
      country: 'Brasil'
    }
  ];
  legacySave.npcWorldState = {
    [WORLD_FIGHTERS[0].id]: { c: 'Niterói', co: 'Brasil' }
  };
  legacySave.socialContacts = [
    {
      id: 'c1',
      name: 'Amigo',
      relationType: 'amigo',
      city: 'Londrina',
      isAlive: true,
      age: 22,
      affinity: 60
    }
  ];

  const migrated = migrateCharacterData(legacySave);
  const merged = getMergedWorldFighters(migrated);
  const migratedNpc = merged.find((f) => f.id === WORLD_FIGHTERS[0].id);

  assert(
    migrated.homeCity === 'Salvador' &&
      migrated.homeState === 'BA' &&
      migrated.currentCity === 'Salvador' &&
      migrated.rivals[0].city === 'São Paulo' &&
      migrated.socialContacts?.[0]?.city === 'Curitiba' &&
      migratedNpc?.city === 'São Paulo',
    6,
    'Migração V2/V3 converte Salvador da Bahia/Feira de Santana->Salvador, Campinas->São Paulo, Londrina->Curitiba e limpa getMergedWorldFighters',
    `home=${migrated.homeCity}/${migrated.homeState}, cur=${migrated.currentCity}, rival=${migrated.rivals[0].city}, contact=${migrated.socialContacts?.[0]?.city}, merged=${migratedNpc?.city}`
  );
}

// -------------------------------------------------------------------------
// TESTE 7: 100% identidades fictícias originais (ZERO nomes reais de academias/equipes)
// -------------------------------------------------------------------------
{
  const forbiddenPatterns = [
    /gracie\s*barra/i,
    /gracie\s*humait/i,
    /\bh[eé]lio\b/i,
    /tiger\s*muay/i,
    /wild\s*card/i,
    /\bfreddie\b/i,
    /abdulmanap/i,
    /eagles\s*mma/i,
    /kodokan/i,
    /jigoro\s*kano/i,
    /mestre\s*bimba/i,
    /american\s*top\s*team/i,
    /conan\s*silveira/i,
    /chute\s*boxe/i,
    /\brudimar\b/i,
    /rafael\s*cordeiro/i,
    /checkmat/i,
    /\batos\b/i,
    /alliance/i,
    /ns\s*brotherhood/i,
    /nova\s*uni[aã]o/i,
    /team\s*kaobon/i,
    /romanza/i,
    /sor\s*sommai/i,
    /jitmuangnon/i,
    /\bsogipa\b/i,
    /pinheiros/i,
    /\bpsg\b/i,
    /sambo-70/i,
    /teixeira\s*mma/i
  ];

  const violations: string[] = [];
  const checkText = (ctx: string, value?: string) => {
    if (!value) return;
    for (const rx of forbiddenPatterns) {
      if (rx.test(value)) {
        violations.push(`${ctx}: "${value}" (${rx})`);
      }
    }
  };

  for (const gym of WORLD_GYMS) {
    checkText(`WORLD_GYMS[${gym.id}].name`, gym.name);
    checkText(`WORLD_GYMS[${gym.id}].teamName`, gym.teamName);
    checkText(`WORLD_GYMS[${gym.id}].masterName`, gym.masterName);
    checkText(`WORLD_GYMS[${gym.id}].history`, gym.history);
    gym.instructors?.forEach((inst) => checkText(`WORLD_GYMS[${gym.id}].instructor`, inst.name));
  }

  for (const t of AVAILABLE_TURMAS) {
    checkText(`TURMA[${t.id}].gymName`, t.gymName);
    checkText(`TURMA[${t.id}].instructorName`, t.instructorName);
  }

  for (const f of WORLD_FIGHTERS) {
    checkText(`FIGHTER[${f.id}].gymName`, f.gymName);
    checkText(`FIGHTER[${f.id}].sponsorName`, f.sponsorName);
    checkText(`FIGHTER[${f.id}].socialPost`, f.socialPost);
  }

  assert(
    violations.length === 0,
    7,
    `Zero nomes reais de academias, equipes ou mestres em ${WORLD_GYMS.length} academias, ${AVAILABLE_TURMAS.length} turmas e ${WORLD_FIGHTERS.length} atletas`,
    violations.slice(0, 5).join(' | ')
  );
}

// -------------------------------------------------------------------------
// TESTE 8: Estrutura de 27 capitais sem municípios do interior & elite apenas em polos nacionais
// -------------------------------------------------------------------------
{
  const overviews = getGymsOverviewByCapital();
  const eliteInNonPolo = overviews.filter((ov) => {
    const state = BRAZIL_STATES.find((s) => s.uf === ov.uf)!;
    return ov.hasEliteCenter && state.sport.gymVarietyTier !== 'polo_nacional';
  });
  const missingConvInDiversificada = overviews.filter((ov) => {
    const state = BRAZIL_STATES.find((s) => s.uf === ov.uf)!;
    return state.sport.gymVarietyTier !== 'essencial' && !ov.gyms.some((g) => g.qualityTier === 'convencional');
  });
  const duplicateNames = WORLD_GYMS.length !== new Set(WORLD_GYMS.map((g) => g.name)).size;

  assert(
    overviews.length === 27 &&
      eliteInNonPolo.length === 0 &&
      missingConvInDiversificada.length === 0 &&
      !duplicateNames,
    8,
    'Distribuição regional coerente nas 27 capitais: zero elite artificial em estados não-polo, zero nomes duplicados',
    `eliteInNonPolo=${eliteInNonPolo.map((o) => o.uf).join(',')}, missingConv=${missingConvInDiversificada.map((o) => o.uf).join(',')}, dup=${duplicateNames}`
  );
}

// -------------------------------------------------------------------------
// TESTE 9: Professores coerentes, bônus contido e bloqueio de modalidade não cadastrada
// -------------------------------------------------------------------------
{
  const brokenInstructors: string[] = [];
  const exaggeratedRates: string[] = [];

  for (const gym of WORLD_GYMS) {
    if (!gym.instructors || gym.instructors.length === 0) {
      brokenInstructors.push(`${gym.id}:no_instructors`);
      continue;
    }
    for (const art of gym.focusArts) {
      const hasMatch = gym.instructors.some(
        (i) => i.specialtyArt === art || i.secondaryArt === art
      );
      if (!hasMatch) {
        brokenInstructors.push(`${gym.id}:missing_${art}`);
      }
    }
    for (const inst of gym.instructors) {
      if (inst.athleteDevelopmentRate < 0.95 || inst.athleteDevelopmentRate > 1.15) {
        exaggeratedRates.push(`${gym.id}:${inst.name}=${inst.athleteDevelopmentRate}`);
      }
    }
  }

  const invalidTurmas = AVAILABLE_TURMAS.filter((t) => {
    const gym = WORLD_GYMS.find((g) => g.id === t.gymId);
    return !gym || !gym.focusArts.includes(t.art);
  });

  // Testa explicitamente bloqueio em validateEnrollment se turma for de arte não ofertada pela academia
  const char = createNewCharacter('Lucas', 'Teste', { day: 10, month: 4, year: 2003 }, 21, 'boxe', '🥊', 'PI', 'Teresina');
  char.currentGymId = 'gym_cap_pi_social'; // PI social oferece judo e boxe (não capoeira!)
  const fakeUnauthorizedTurma: GymClassTurma = {
    id: 'fake_capoeira_pi',
    gymId: 'gym_cap_pi_social',
    gymName: 'Projeto Poty de Lutas Amadoras',
    art: 'capoeira',
    instructorName: 'Instrutor Fictício',
    title: 'Capoeira não cadastrada',
    description: 'Teste',
    daysOfWeek: ['sabado'],
    block: 'manha',
    pointsCost: 1,
    classType: 'regular',
    status: 'aberta',
    prerequisites: {}
  };
  const blockedRes = validateEnrollment(char, fakeUnauthorizedTurma);
  const piSocialGym = WORLD_GYMS.find((g) => g.id === 'gym_cap_pi_social')!;
  const teachesBoxe = doesGymTeachArt(piSocialGym, 'boxe');
  const teachesCapoeira = doesGymTeachArt(piSocialGym, 'capoeira');

  assert(
    brokenInstructors.length === 0 &&
      exaggeratedRates.length === 0 &&
      invalidTurmas.length === 0 &&
      teachesBoxe === true &&
      teachesCapoeira === false &&
      blockedRes.isValid === false,
    9,
    '100% das academias possuem professores por modalidade (taxa contida 0.95–1.15) e bloqueiam ensino fora da grade',
    `broken=${brokenInstructors.slice(0, 4).join(',')}, exag=${exaggeratedRates.join(',')}, invalidTurmas=${invalidTurmas.length}, blocked=${blockedRes.isValid}`
  );
}

// -------------------------------------------------------------------------
// TESTE 10: Diferenciação real entre tiers (social/convencional/competitiva/elite) e especialização XP
// -------------------------------------------------------------------------
{
  const spSocial = WORLD_GYMS.find((g) => g.id === 'gym_cap_sp_social')!;
  const spConv = WORLD_GYMS.find((g) => g.id === 'gym_cap_sp_conv')!;
  const spComp = WORLD_GYMS.find((g) => g.id === 'gym_cap_sp_comp')!;
  const spElite = WORLD_GYMS.find((g) => g.id === 'gym_cap_sp_elite')!;
  const att = WORLD_GYMS.find((g) => g.id === 'gym_american_top_team')!;

  const xpSpec = calculateSessionTrainingXp(1, spConv); // <= 2 artes -> especializada 1.5x (30 XP)
  const xpPoly = calculateSessionTrainingXp(1, att);    // 5 artes -> poliesportiva 1.3x (26 XP)

  assert(
    spSocial.weeklyCost === 0 &&
      spConv.weeklyCost > 0 &&
      spConv.weeklyCost < spComp.weeklyCost &&
      spComp.weeklyCost < spElite.weeklyCost &&
      spSocial.learningSpeedMultiplier < spConv.learningSpeedMultiplier &&
      spConv.learningSpeedMultiplier < spComp.learningSpeedMultiplier &&
      spComp.learningSpeedMultiplier < spElite.learningSpeedMultiplier &&
      spConv.qualityTier === 'convencional' &&
      getGymXpMultiplier(spConv).multiplier === 1.5 &&
      xpSpec.finalXp === 30 &&
      xpPoly.finalXp === 26,
    10,
    'Diferenciação real de custos, infraestrutura e XP entre social, convencional, competitiva, elite e poliesportiva',
    `costs=${spSocial.weeklyCost}/${spConv.weeklyCost}/${spComp.weeklyCost}/${spElite.weeklyCost}, mults=${spSocial.learningSpeedMultiplier}/${spConv.learningSpeedMultiplier}/${spComp.learningSpeedMultiplier}/${spElite.learningSpeedMultiplier}`
  );
}

// -------------------------------------------------------------------------
// TESTE 11: Rivalidades locais e interestaduais + histórico de títulos
// -------------------------------------------------------------------------
{
  const rjElite = WORLD_GYMS.find((g) => g.id === 'gym_gracie_rio')!;
  const rjComp = WORLD_GYMS.find((g) => g.id === 'gym_cap_rj_comp')!;
  const rivalries = getGymRivalries(rjElite);
  const compRivalries = getGymRivalries(rjComp);

  assert(
    rivalries.rivalGyms.some((g) => g.id === rjComp.id) &&
      compRivalries.rivalGyms.length > 0 &&
      Boolean(rjElite.rivalryNote) &&
      (rjElite.teamTitlesCount || 0) > 0 &&
      Boolean(rjElite.history),
    11,
    'Rivalidades locais/interestaduais, história e títulos vinculados corretamente entre academias',
    `rjRivals=${rivalries.rivalGyms.map((g) => g.id).join(',')}`
  );
}

// -------------------------------------------------------------------------
// TESTE 12: Bolsas esportivas por mérito real reduzem mensalidade de academias competitivas/elite
// -------------------------------------------------------------------------
{
  const rookie = createNewCharacter('Pedro', 'Iniciante', { day: 3, month: 3, year: 2002 }, 21, 'jiujitsu', '🥋', 'SP', 'São Paulo');
  rookie.currentGymId = 'gym_cap_sp_comp';
  rookie.fame = 15;
  rookie.trophies = [];

  const champ = createNewCharacter('Pedro', 'Campeão', { day: 3, month: 3, year: 2002 }, 21, 'jiujitsu', '🥋', 'SP', 'São Paulo');
  champ.currentGymId = 'gym_cap_sp_comp';
  champ.fame = 180;
  champ.trophies = ['Estaduais A', 'Regional B'] as any;

  const rookieExp = calculateGymMonthlyExpenses(rookie);
  const champExp = calculateGymMonthlyExpenses(champ);
  const champSchol = getCompetitiveScholarshipDiscount(champ, WORLD_GYMS.find((g) => g.id === 'gym_cap_sp_comp'));

  assert(
    rookieExp.totalAthleteCost > 0 &&
      champSchol.eligible === true &&
      champExp.totalAthleteCost === Math.round(rookieExp.totalAthleteCost * 0.75) &&
      Boolean(champExp.gyms[0].scholarshipLabel),
    12,
    `Bolsa competitiva por mérito aplicada corretamente (Sem títulos: R$ ${rookieExp.totalAthleteCost}/mês vs Com mérito: R$ ${champExp.totalAthleteCost}/mês)`
  );
}

// -------------------------------------------------------------------------
// TESTE 13: Efetividade de treino por modalidade + redução segura de lesões em estrutura adequada
// -------------------------------------------------------------------------
{
  const spComp = WORLD_GYMS.find((g) => g.id === 'gym_cap_sp_comp')!;
  const spConv = WORLD_GYMS.find((g) => g.id === 'gym_cap_sp_conv')!;
  const matchedEff = getGymTrainingEffectiveness(spComp, spComp.focusArts[0]);
  const unmatchedEff = getGymTrainingEffectiveness(spConv, 'capoeira'); // spConv não ensina capoeira

  const char = createNewCharacter('Ana', 'Firme', { day: 8, month: 8, year: 2001 }, 21, 'jiujitsu', '🥋', 'SP', 'São Paulo');
  const riskConv = checkSparringInjuryRisk(char, spConv, 1.0).riskPercentage;
  const xpTest = addTrainingGraduationXp(char, 'jiujitsu', 20, matchedEff.effectivenessMultiplier);

  assert(
    matchedEff.offersArt === true &&
      matchedEff.effectivenessMultiplier >= 1.0 &&
      matchedEff.effectivenessMultiplier <= 1.12 &&
      unmatchedEff.offersArt === false &&
      unmatchedEff.effectivenessMultiplier === 0.9 &&
      riskConv >= 2 &&
      xpTest.xpAdded > 0 &&
      getGymInstructorsForArt(spComp, spComp.focusArts[0]).length > 0,
    13,
    `Treino orientado (${matchedEff.effectivenessMultiplier}x) vs fora da grade (${unmatchedEff.effectivenessMultiplier}x), risco seguro (${riskConv}%) e XP de graduação integrados`
  );
}

// -------------------------------------------------------------------------
// TESTE 14: Migração V2/V3 atualiza nomes legados de academias e preserva histórico ao trocar/mudar de capital
// -------------------------------------------------------------------------
{
  const v2Char: any = createNewCharacter('Renato', 'Raiz', { day: 12, month: 5, year: 2000 }, 21, 'jiujitsu', '🥋', 'RJ', 'Rio de Janeiro');
  v2Char.currentGymId = 'gym_gracie_rio';
  v2Char.money = 8000;
  v2Char.record.wins = 7;
  v2Char.artGraduations.jiujitsu.rankIndex = 5;
  v2Char.enrolledClasses = [
    {
      classId: 'turma_gracie_bjj_noite',
      art: 'jiujitsu',
      gymId: 'gym_gracie_rio',
      gymName: 'Templo da Arte Suave - Gracie Barra Raiz',
      instructorName: 'Grande Mestre',
      title: 'Jiu-Jitsu Clássico',
      dayOfWeek: 'terca',
      block: 'noite',
      pointsCost: 1,
      status: 'ativa'
    }
  ];
  v2Char.rivals = [
    {
      ...WORLD_FIGHTERS[0],
      gymId: 'gym_wild_card_la',
      gymName: 'Wild Card Boxing Club'
    }
  ];

  const migrated = migrateCharacterData(v2Char);
  const relocated = relocatePlayerToCapital(migrated, 'BA');

  const orphanChar: any = createNewCharacter('Orfao', 'Teste', { day: 1, month: 1, year: 2001 }, 21, 'boxe', '🥊', 'SP', 'São Paulo');
  orphanChar.currentGymId = 'gym_inexistente_legada';
  const migratedOrphan = migrateCharacterData(orphanChar);

  assert(
    migrated.enrolledClasses?.[0]?.gymName === 'Templo Carioca da Arte Suave' &&
      migrated.rivals[0].gymName === 'Sunset Boulevard Boxing Club' &&
      migratedOrphan.currentGymId === 'gym_bairro' &&
      relocated.success === true &&
      relocated.updatedChar.currentCity === 'Salvador' &&
      relocated.updatedChar.record.wins === 7 &&
      relocated.updatedChar.artGraduations.jiujitsu.rankIndex === 5 &&
      relocated.updatedChar.enrolledClasses?.[0]?.status === 'trancada',
    14,
    'Migração V2/V3 sincroniza nomes canônicos, corrige gymId órfão e preserva histórico/graduações após troca de capital'
  );
}

console.log('\n================================================================');
console.log(`RESULTADO FINAL ETAPA 2/3: ${passedTests}/${totalTests} TESTES APROVADOS COM SUCESSO!`);
console.log('================================================================\n');
