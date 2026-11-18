import assert from 'node:assert/strict';
import { BRAZIL_CAPITALS_COUNT, BRAZIL_STATES, getStateByUf } from '../data/brazilLocations';
import { AVAILABLE_TURMAS } from '../data/gymClassesData';
import { AVAILABLE_JOBS } from '../data/lifeEventsData';
import { WORLD_GYMS } from '../data/martialArtsData';
import { enrollCharacterInTurma } from '../types/agenda';
import { BrazilUF } from '../types/game';
import {
  advanceMonth,
  calculateLivingExpenses,
  createNewCharacter,
  evaluateMonthlySponsorship,
  migrateCharacterData
} from '../utils/characterHelper';
import {
  calculateEducationTuition,
  enrollInEducationCourse,
  selectCharacterJob
} from '../utils/educationHelper';
import {
  calculateGraduationCeremonyCost,
  calculateMonthlyEquipmentCost,
  calculateRegionalDietCost,
  calculateRegionalEducationFee,
  calculateRegionalJobMonthlyPay,
  calculateRegionalLeisureCost,
  calculateRegionalLivingExpenses,
  calculateRegionalSponsorship,
  getPlayerLocationSummary,
  getRegionalAcademyEconomics,
  resolveActiveEconomicContext
} from '../utils/regionalEconomyHelper';
import { calculateGymMonthlyExpenses, relocatePlayerToCapital } from '../utils/recoveryHelper';
import { foundPlayerAcademy, upgradePlayerAcademy } from '../utils/playerAcademyHelper';

console.log('🧪 Executando bateria completa de Economia Regional & Equilíbrio das 27 Capitais...');

const mkAdult = (uf: BrazilUF, city?: string) => {
  const cap = getStateByUf(uf);
  const c = createNewCharacter(
    `Atleta ${uf}`,
    uf,
    { day: 10, month: 5, year: 2001 },
    21,
    'jiujitsu',
    '🥋',
    uf,
    city || cap.capital,
    'M',
    'normal'
  );
  c.age = 24;
  c.currentDate = { day: 1, month: 1, year: 2026 };
  c.currentMonth = 1;
  c.currentYear = 2026;
  c.money = 10000;
  return c;
};

// ===========================================================================
// 1 & 2. TODAS AS 27 LOCALIDADES POSSUEM PERFIS VÁLIDOS, COMPLETOS E DISTINTOS
// ===========================================================================
{
  assert.equal(BRAZIL_STATES.length, BRAZIL_CAPITALS_COUNT);
  assert.equal(BRAZIL_STATES.length, 27);

  const uniqueEconomySignatures = new Set<string>();

  for (const state of BRAZIL_STATES) {
    assert.ok(state.uf && state.capital && state.name && state.region);
    assert.ok(state.economy.costOfLivingIndex > 0.7 && state.economy.costOfLivingIndex < 1.5);
    assert.ok(state.economy.housingBase > 300);
    assert.ok(state.economy.foodBase > 200);
    assert.ok(state.economy.transportBase > 80);
    assert.ok(state.economy.healthBase > 80);
    assert.ok(state.economy.salaryMultiplier > 0.7);
    assert.ok(state.economy.educationMultiplier > 0.7);
    assert.ok(state.economy.gymTuitionMultiplier > 0.7);
    assert.ok(state.sport.sportDevelopmentIndex >= 50 && state.sport.sportDevelopmentIndex <= 100);
    assert.ok(state.sport.sponsorshipMarketIndex >= 0.7);
    assert.ok(state.sport.economicIdentity.length > 20);

    const signature = [
      state.economy.costOfLivingIndex,
      state.economy.housingBase,
      state.economy.foodBase,
      state.economy.transportBase,
      state.economy.healthBase,
      state.economy.salaryMultiplier,
      state.economy.educationMultiplier,
      state.economy.gymTuitionMultiplier
    ].join('|');
    assert.equal(
      uniqueEconomySignatures.has(signature),
      false,
      `Capital ${state.capital} (${state.uf}) não deve possuir perfil econômico duplicado`
    );
    uniqueEconomySignatures.add(signature);

    const c = mkAdult(state.uf, state.capital);
    const ctx = resolveActiveEconomicContext(c);
    assert.equal(ctx.isBrazil, true);
    assert.equal(ctx.city, state.capital);
    assert.equal(ctx.uf, state.uf);

    const living = calculateRegionalLivingExpenses(c);
    assert.ok(living.monthlyCost > 0, `${state.capital} deve ter custo de vida positivo`);
    assert.equal(
      living.breakdown.housing +
        living.breakdown.food +
        living.breakdown.transport +
        living.breakdown.health +
        living.breakdown.family,
      living.monthlyCost,
      `Soma das rubricas de ${state.capital} deve bater exatamente com o total`
    );
  }

  assert.equal(uniqueEconomySignatures.size, 27, 'Todas as 27 capitais devem ter perfis econômicos distintos');
  console.log('✅ 1-2. Todas as 27 capitais possuem perfis válidos, completos e sem duplicações');
}

// ===========================================================================
// 3. DIFERENÇAS REGIONAIS REAIS & COMPARATIVOS ENTRE FAIXAS ECONÔMICAS
// ===========================================================================
{
  const sp = mkAdult('SP'); // Muito Alto
  const df = mkAdult('DF'); // Muito Alto (capital federal)
  const rj = mkAdult('RJ'); // Muito Alto
  const sc = mkAdult('SC'); // Alto
  const pr = mkAdult('PR'); // Alto
  const bh = mkAdult('MG'); // Alto
  const ba = mkAdult('BA'); // Moderado/Alto regional
  const go = mkAdult('GO'); // Moderado
  const pa = mkAdult('PA'); // Moderado Norte
  const ro = mkAdult('RO'); // Baixo/Moderado Norte
  const se = mkAdult('SE'); // Baixo/Moderado Nordeste
  const pi = mkAdult('PI'); // Baixo

  assert.ok(calculateLivingExpenses(sp).monthlyCost > calculateLivingExpenses(rj).monthlyCost);
  assert.ok(calculateLivingExpenses(rj).monthlyCost > calculateLivingExpenses(df).monthlyCost);
  assert.ok(calculateLivingExpenses(df).monthlyCost > calculateLivingExpenses(sc).monthlyCost);
  assert.ok(calculateLivingExpenses(sc).monthlyCost > calculateLivingExpenses(bh).monthlyCost);
  assert.ok(calculateLivingExpenses(bh).monthlyCost > calculateLivingExpenses(ba).monthlyCost);
  assert.ok(calculateLivingExpenses(ba).monthlyCost > calculateLivingExpenses(go).monthlyCost);
  assert.ok(calculateLivingExpenses(go).monthlyCost > calculateLivingExpenses(pa).monthlyCost);
  assert.ok(calculateLivingExpenses(pa).monthlyCost > calculateLivingExpenses(pi).monthlyCost);
  assert.notEqual(
    calculateLivingExpenses(ro).monthlyCost,
    calculateLivingExpenses(se).monthlyCost,
    'Porto Velho (RO) e Aracaju (SE) devem produzir despesas distintas'
  );
  assert.notEqual(
    calculateLivingExpenses(df).monthlyCost,
    calculateLivingExpenses(rj).monthlyCost,
    'Brasília (DF) e Rio de Janeiro (RJ) devem produzir despesas distintas'
  );

  // Salários comparativos entre faixas econômicas e sustentabilidade de carreiras
  const assistJob = AVAILABLE_JOBS.find((j) => j.id === 'assistente_comercial')!;
  const tecJob = AVAILABLE_JOBS.find((j) => j.id === 'tec_ti')!;
  const superiorJob = AVAILABLE_JOBS.find((j) => j.id === 'engenheiro_software')!;

  const paySpAssist = calculateRegionalJobMonthlyPay(sp, assistJob);
  const payDfAssist = calculateRegionalJobMonthlyPay(df, assistJob);
  const payPrAssist = calculateRegionalJobMonthlyPay(pr, assistJob);
  const payGoAssist = calculateRegionalJobMonthlyPay(go, assistJob);
  const payPiAssist = calculateRegionalJobMonthlyPay(pi, assistJob);

  assert.ok(paySpAssist > payDfAssist && payDfAssist > payPrAssist && payPrAssist > payGoAssist && payGoAssist > payPiAssist);
  assert.ok(
    calculateRegionalJobMonthlyPay(sp, superiorJob) > calculateRegionalJobMonthlyPay(sp, tecJob) &&
      calculateRegionalJobMonthlyPay(sp, tecJob) > paySpAssist,
    'Qualificação profissional deve gerar progressão real de renda'
  );

  // Sustentabilidade: Ensino Médio formal (assistente) permite morar sozinho e sobreviver com margem tanto em SP quanto em PI
  sp.job = assistJob.id;
  pi.job = assistJob.id;
  const spSoloMargin = paySpAssist - calculateLivingExpenses(sp).monthlyCost;
  const piSoloMargin = payPiAssist - calculateLivingExpenses(pi).monthlyCost;
  assert.ok(spSoloMargin > 400, `Assistente em SP deve ter superávit básico sustentável (atual: ${spSoloMargin})`);
  assert.ok(piSoloMargin > 400, `Assistente em PI deve ter superávit básico sustentável (atual: ${piSoloMargin})`);

  console.log('✅ 3 & 8. Comparativos multi-faixa entre capitais e sustentabilidade salarial validados');
}

// ===========================================================================
// 4, 5, 6 & 7. MORADIA, ALIMENTAÇÃO (SEM BITRIBUTAÇÃO), TRANSPORTE, SAÚDE & DEPENDENTES
// ===========================================================================
{
  const minor = createNewCharacter('Menor SP', 'Jr', { day: 1, month: 6, year: 2012 }, 13, 'boxe', '🥊', 'SP', 'São Paulo', 'M', 'normal');
  assert.equal(calculateLivingExpenses(minor).monthlyCost, 0, 'Menor de 18 anos é isento de custo de vida adulto');

  // Moradia: solo > noivo compartilhado > casado > com os pais
  const soloRj = mkAdult('RJ');
  soloRj.age = 25;

  const engagedRj = mkAdult('RJ');
  engagedRj.age = 25;
  engagedRj.maritalStatus = 'noivo';
  engagedRj.socialContacts = engagedRj.socialContacts || [];
  engagedRj.socialContacts.push({
    id: 'fiance_1',
    name: 'Marina Costa',
    avatar: '👩',
    gender: 'F',
    relationType: 'namorado',
    personality: 'leal',
    birthDate: { day: 10, month: 2, year: 2001 },
    age: 25,
    isAlive: true,
    health: 95,
    wealthTier: 'classe_media',
    occupation: 'Designer',
    dailyRoutine: 'Trabalho',
    city: 'Rio de Janeiro',
    affinity: 85,
    romanceLevel: 80,
    respect: 80,
    relationshipStage: 'noivo'
  });
  engagedRj.spouseId = 'fiance_1';

  const marriedRj = mkAdult('RJ');
  marriedRj.age = 25;
  marriedRj.maritalStatus = 'casado';

  const widowerRj = mkAdult('RJ');
  widowerRj.age = 25;
  widowerRj.maritalStatus = 'viuvo';

  const youngWithParents = mkAdult('RJ');
  youngWithParents.age = 20;
  youngWithParents.familySupport = 85;

  const studentWithParents = mkAdult('RJ');
  studentWithParents.age = 23;
  studentWithParents.isStudying = true;
  studentWithParents.familySupport = 80;

  assert.ok(calculateLivingExpenses(engagedRj).breakdown.housing < calculateLivingExpenses(soloRj).breakdown.housing);
  assert.ok(calculateLivingExpenses(marriedRj).breakdown.housing < calculateLivingExpenses(engagedRj).breakdown.housing);
  assert.ok(calculateLivingExpenses(youngWithParents).breakdown.housing < calculateLivingExpenses(marriedRj).breakdown.housing);
  assert.ok(calculateLivingExpenses(studentWithParents).breakdown.housing < calculateLivingExpenses(soloRj).breakdown.housing);
  assert.equal(
    calculateLivingExpenses(widowerRj).breakdown.housing,
    calculateLivingExpenses(soloRj).breakdown.housing,
    'Viúvo não divide aluguel com cônjuge falecido'
  );

  // Pais falecidos: jovem <22 NÃO recebe desconto de "morar com os pais"
  const orphanYoung = mkAdult('RJ');
  orphanYoung.age = 20;
  orphanYoung.familySupport = 85;
  orphanYoung.socialContacts = (orphanYoung.socialContacts || []).map((c) =>
    c.relationType === 'pai' || c.relationType === 'mae' ? { ...c, isAlive: false } : c
  );
  assert.equal(
    calculateLivingExpenses(orphanYoung).breakdown.housing,
    calculateLivingExpenses(soloRj).breakdown.housing,
    'Sem pais vivos não há desconto de moradia com os pais'
  );

  // Alimentação: plano nutricional pago NÃO é cobrado duas vezes no breakdown.food + dietCost
  const foodCaseira = mkAdult('SP');
  foodCaseira.dietPlan = 'caseira';
  const foodAtletica = mkAdult('SP');
  foodAtletica.dietPlan = 'atletica';
  const foodCorte = mkAdult('SP');
  foodCorte.dietPlan = 'corte_severo';

  const basicFoodCaseira = calculateLivingExpenses(foodCaseira).breakdown.food;
  const basicFoodAtletica = calculateLivingExpenses(foodAtletica).breakdown.food;
  const extraDietAtletica = calculateRegionalDietCost(foodAtletica, 'atletica');
  const combinedAtleticaFood = basicFoodAtletica + extraDietAtletica;

  assert.ok(
    basicFoodAtletica < basicFoodCaseira,
    'Com dieta atlética paga à parte, rubrica básica de alimentação deve cair para evitar bitributação'
  );
  assert.ok(
    combinedAtleticaFood > basicFoodCaseira && combinedAtleticaFood < basicFoodCaseira + extraDietAtletica,
    `Custo total alimentar com dieta atlética (${combinedAtleticaFood}) deve superar dieta caseira (${basicFoodCaseira}) sem duplicar a cesta inteira`
  );
  assert.ok(
    calculateLivingExpenses(foodCorte).breakdown.food < basicFoodCaseira,
    'Corte severo reduz alimentação regular básica'
  );

  // Transporte urbano acompanha rotina (trabalho/treino/estudo) e NÃO inclui custo de viagem intermunicipal
  const spUnemployed = mkAdult('SP');
  spUnemployed.age = 25;
  spUnemployed.job = 'desempregado';
  spUnemployed.isStudying = false;
  const spWorker = mkAdult('SP');
  spWorker.age = 25;
  spWorker.job = 'assistente_comercial';
  const spWorkerStudentGym = enrollCharacterInTurma(
    { ...spWorker, isStudying: true },
    AVAILABLE_TURMAS.find((t) => t.id === 'turma_bairro_jj_iniciante')!
  ).updatedChar;

  const tUnemployed = calculateLivingExpenses(spUnemployed).breakdown.transport;
  const tWorker = calculateLivingExpenses(spWorker).breakdown.transport;
  const tFullRoutine = calculateLivingExpenses(spWorkerStudentGym).breakdown.transport;
  assert.ok(tFullRoutine > tWorker && tWorker > tUnemployed, 'Transporte urbano reflete rotina diária sem duplicação');

  // Saúde acompanha gravidade da lesão, camp intenso e corte severo
  const healthySp = mkAdult('SP');
  const mildInjSp = mkAdult('SP');
  mildInjSp.injuries = [{ id: 'i1', name: 'Contusão Leve', severity: 'leve', weeksRemaining: 2 }];
  const graveInjSp = mkAdult('SP');
  graveInjSp.injuries = [{ id: 'i2', name: 'Lesão Ligamentar Grave', severity: 'grave', weeksRemaining: 8 }];
  graveInjSp.dietPlan = 'corte_severo';

  const hBase = calculateLivingExpenses(healthySp).breakdown.health;
  const hMild = calculateLivingExpenses(mildInjSp).breakdown.health;
  const hGrave = calculateLivingExpenses(graveInjSp).breakdown.health;
  assert.ok(hGrave > hMild && hMild > hBase, 'Saúde deve escalar proporcionalmente à gravidade da lesão e corte de peso');

  // Dependentes: irmãos (mesmo menores), filhos >= 18 ou filhos falecidos NÃO geram cobrança familiar
  const nonDepChar = mkAdult('SP');
  nonDepChar.socialContacts = [
    ...(nonDepChar.socialContacts || []).map((c) =>
      c.relationType === 'irmao' ? { ...c, age: 12, isAlive: true } : c
    ),
    {
      id: 'adult_child',
      name: 'Filho Maior',
      avatar: '🧑',
      gender: 'M',
      relationType: 'filho',
      personality: 'leal',
      birthDate: { day: 1, month: 1, year: 2005 },
      age: 21,
      isAlive: true,
      health: 95,
      wealthTier: 'classe_media',
      occupation: 'Analista',
      dailyRoutine: 'Trabalho',
      city: 'São Paulo',
      affinity: 80,
      romanceLevel: 0,
      respect: 80,
      relationshipStage: 'familia'
    },
    {
      id: 'deceased_child',
      name: 'Filho Falecido',
      avatar: '🕊️',
      gender: 'M',
      relationType: 'filho',
      personality: 'leal',
      birthDate: { day: 1, month: 1, year: 2018 },
      age: 7,
      isAlive: false,
      health: 0,
      wealthTier: 'classe_media',
      occupation: '-',
      dailyRoutine: '-',
      city: 'São Paulo',
      affinity: 80,
      romanceLevel: 0,
      respect: 80,
      relationshipStage: 'familia'
    }
  ];
  const nonDepLiving = calculateLivingExpenses(nonDepChar);
  assert.equal(nonDepLiving.dependentsCount, 0, 'Irmão menor, filho >=18 e contato falecido não contam como dependentes');
  assert.equal(nonDepLiving.breakdown.family, 0, 'Não pode cobrar despesas familiares de quem não é dependente efetivo');

  // Filho menor vivo conta como dependente e gera despesa coerente (maior em SP que em PI)
  const addMinorChild = (char: ReturnType<typeof mkAdult>, age: number) => {
    char.socialContacts = char.socialContacts || [];
    char.socialContacts.push({
      id: `kid_${age}`,
      name: 'Lucas Jr',
      avatar: '🧒',
      gender: 'M',
      relationType: 'filho',
      personality: 'leal',
      birthDate: { day: 12, month: 6, year: 2026 - age },
      age,
      isAlive: true,
      health: 100,
      wealthTier: 'classe_media',
      occupation: 'Estudante',
      dailyRoutine: 'Escola',
      city: char.homeCity,
      affinity: 95,
      romanceLevel: 0,
      respect: 90,
      relationshipStage: 'familia'
    });
    return char;
  };
  const spParent = addMinorChild(mkAdult('SP'), 4);
  const piParent = addMinorChild(mkAdult('PI'), 4);
  const spParentRes = calculateLivingExpenses(spParent);
  const piParentRes = calculateLivingExpenses(piParent);
  assert.equal(spParentRes.dependentsCount, 1);
  assert.ok(spParentRes.breakdown.family > piParentRes.breakdown.family && piParentRes.breakdown.family > 0);

  console.log('✅ 4, 5, 6 & 7. Moradia, alimentação sem bitributação, transporte urbano, saúde e dependentes validados');
}

// ===========================================================================
// 9 & 10. EDUCAÇÃO PÚBLICA GRATUITA VS PARTICULAR REGIONALIZADA
// ===========================================================================
{
  for (const st of BRAZIL_STATES) {
    const c = mkAdult(st.uf);
    assert.equal(calculateRegionalEducationFee(c, 0, 'publica'), 0, `Ensino público deve ser gratuito em ${st.capital}`);
    assert.equal(calculateRegionalEducationFee(c, 980, 'publica'), 0, `Instituição pública nunca cobra em ${st.capital}`);
  }

  const sp = mkAdult('SP');
  const df = mkAdult('DF');
  const pi = mkAdult('PI');

  const feeSp = calculateRegionalEducationFee(sp, 420, 'particular');
  const feeDf = calculateRegionalEducationFee(df, 420, 'particular');
  const feePi = calculateRegionalEducationFee(pi, 420, 'particular');
  assert.ok(feeSp > feeDf && feeDf > 420 && feePi < 420 && feeSp > feePi);

  const enrSp = enrollInEducationCourse(sp, 'inst_priv_tecnico', 'tec_priv_ti', 'noite');
  assert.equal(enrSp.success, true);
  const enrolledChar = enrSp.updatedChar;
  const tuitionInSp = calculateEducationTuition(enrolledChar, enrolledChar.education!.currentEnrollment!).monthlyFee;

  enrolledChar.currentCity = 'Teresina';
  enrolledChar.homeState = 'PI';
  const tuitionInPi = calculateEducationTuition(enrolledChar, enrolledChar.education!.currentEnrollment!).monthlyFee;
  assert.ok(tuitionInSp > tuitionInPi, 'Mudança de capital atualiza dinamicamente o cálculo de mensalidade particular');

  console.log('✅ 9 & 10. Educação pública gratuita e ensino particular regionalizado validados');
}

// ===========================================================================
// 11 & 12. MENSALIDADES, EQUIPAMENTOS & CUSTOS DE GRADUAÇÃO INTEGRADOS
// ===========================================================================
{
  const socialGym = WORLD_GYMS.find((g) => g.qualityTier === 'social' && g.city === 'São Paulo')!;
  const paidGymSp = WORLD_GYMS.find((g) => g.qualityTier !== 'social' && g.city === 'São Paulo' && g.weeklyCost > 0)!;
  const paidGymPi = WORLD_GYMS.find((g) => g.qualityTier !== 'social' && g.city === 'Teresina' && g.weeklyCost > 0)!;

  const spStudent = mkAdult('SP');
  spStudent.currentGymId = paidGymSp.id;
  const piStudent = mkAdult('PI');
  piStudent.currentGymId = paidGymPi.id;

  // Múltiplas turmas na mesma academia NÃO duplicam mensalidade
  const bjjTurma = AVAILABLE_TURMAS.find((t) => t.id === 'turma_bairro_jj_iniciante')!;
  const boxeTurma = AVAILABLE_TURMAS.find((t) => t.id === 'turma_bairro_boxe_matinal')!;
  const gymBairro = WORLD_GYMS.find((g) => g.id === 'gym_bairro')!;
  const multiTurmaChar = enrollCharacterInTurma(
    enrollCharacterInTurma(mkAdult('SP'), bjjTurma).updatedChar,
    boxeTurma
  ).updatedChar;
  const gymExpOnce = calculateGymMonthlyExpenses(multiTurmaChar);
  assert.equal(gymExpOnce.uniqueGymCount, 1);
  assert.ok(gymExpOnce.activeClassesCount >= 2);
  assert.equal(gymExpOnce.totalAthleteCost, gymBairro.weeklyCost * 4);

  const paidTurmaSp = AVAILABLE_TURMAS.find((t) => t.gymId === paidGymSp.id);
  const spEnrolledPaid = paidTurmaSp
    ? enrollCharacterInTurma(spStudent, paidTurmaSp).updatedChar
    : spStudent;

  const gradCostSp = calculateGraduationCeremonyCost(spStudent, 'jiujitsu', { stageNumber: 3 }, paidGymSp);
  const gradCostPi = calculateGraduationCeremonyCost(piStudent, 'jiujitsu', { stageNumber: 3 }, paidGymPi);
  const gradSocial = calculateGraduationCeremonyCost(spStudent, 'jiujitsu', { stageNumber: 3 }, socialGym);

  assert.ok(gradCostSp.totalCost > gradCostPi.totalCost, 'Cerimônia de graduação em SP > PI');
  assert.equal(gradSocial.socialDiscountApplied, true);
  assert.equal(gradSocial.equipmentFee, 0);
  assert.ok(gradSocial.totalCost < gradCostSp.totalCost);

  const equipSp = calculateMonthlyEquipmentCost(spEnrolledPaid);
  assert.ok(equipSp.athletePays > 0);
  spStudent.currentGymId = socialGym.id;
  assert.equal(calculateMonthlyEquipmentCost(spStudent).monthlyCost, 0);

  console.log('✅ 11 & 12. Mensalidades de academias, equipamentos e cerimônias de graduação validados');
}

// ===========================================================================
// 13 & 14. PATROCÍNIOS (MÉRITO + MERCADO + DESENV. ESPORTIVO) & DIETA / LAZER
// ===========================================================================
{
  // Fama alta SEM vitórias e SEM títulos NÃO gera patrocínio mesmo morando em SP ou EUA
  const fameOnlySp = mkAdult('SP');
  fameOnlySp.fame = 600;
  fameOnlySp.record.wins = 0;
  fameOnlySp.trophies = [];
  const fameOnlyRes = calculateRegionalSponsorship(fameOnlySp);
  assert.equal(fameOnlyRes.monthlyPay, 0, 'Morar em SP e ter fama sem vitórias/títulos NÃO gera patrocínio');
  assert.equal(fameOnlyRes.tierLevel, 'nenhum');

  // Nível 1: Apoio Local (início competitivo)
  const localSp = mkAdult('SP');
  localSp.fame = 60;
  localSp.record.wins = 3;
  localSp.trophies = [{ id: 't_loc', tournamentName: 'Open Paulista', year: 2025, art: 'jiujitsu', tier: 'municipal' }];
  const sLocalSp = calculateRegionalSponsorship(localSp);
  assert.equal(sLocalSp.tierLevel, 'apoio_local');
  assert.ok(sLocalSp.monthlyPay > 0);

  // Nível 2: Patrocínio Profissional (Belo Horizonte vs Goiânia vs Teresina)
  const makeProFighter = (uf: BrazilUF) => {
    const f = mkAdult(uf);
    f.fame = 220;
    f.record.wins = 9;
    f.record.losses = 1;
    f.trophies = [
      { id: 't1', tournamentName: 'Estadual', year: 2025, art: 'jiujitsu', tier: 'estadual' },
      { id: 't2', tournamentName: 'Regional', year: 2025, art: 'jiujitsu', tier: 'regional' }
    ];
    return f;
  };
  const sProSp = evaluateMonthlySponsorship(makeProFighter('SP'));
  const sProBh = evaluateMonthlySponsorship(makeProFighter('MG'));
  const sProPi = evaluateMonthlySponsorship(makeProFighter('PI'));
  assert.equal(sProSp.tierLevel, 'profissional');
  assert.ok(sProSp.monthlyPay > sProBh.monthlyPay && sProBh.monthlyPay > sProPi.monthlyPay);

  // Nível 3: Patrocínio de Alto Nível (exige títulos nacional/internacional/MMA pro + histórico sólido)
  const eliteSp = mkAdult('SP');
  eliteSp.fame = 450;
  eliteSp.record.wins = 18;
  eliteSp.record.losses = 1;
  eliteSp.trophies = [
    { id: 'e1', tournamentName: 'Brasileiro CBJJ', year: 2025, art: 'jiujitsu', tier: 'nacional' },
    { id: 'e2', tournamentName: 'Mundial IBJJF', year: 2025, art: 'jiujitsu', tier: 'mundial' }
  ];
  const sEliteSp = calculateRegionalSponsorship(eliteSp);
  assert.equal(sEliteSp.tierLevel, 'alto_nivel');
  assert.ok(sEliteSp.monthlyPay > sProSp.monthlyPay * 2);

  // Dieta e lazer regionalizados
  const sp = mkAdult('SP');
  const pi = mkAdult('PI');
  assert.ok(calculateRegionalDietCost(sp, 'atletica') > calculateRegionalDietCost(pi, 'atletica'));
  assert.ok(calculateRegionalDietCost(sp, 'corte_severo') > 0);
  assert.ok(calculateRegionalLeisureCost(sp, 60) > calculateRegionalLeisureCost(pi, 60));

  console.log('✅ 13 & 14. Patrocínios por mérito/nível competitivo/mercado e dieta/lazer regionalizados validados');
}

// ===========================================================================
// 15, 16 & 17. ADVANCE MONTH SEM DUPLICAÇÃO, MUDANÇA DE CAPITAL & SAVES V2/V3
// ===========================================================================
{
  let fighter = mkAdult('MG');
  fighter.fame = 220;
  fighter.record.wins = 8;
  fighter.trophies = [
    { id: 'm1', tournamentName: 'Mineiro', year: 2025, art: 'jiujitsu', tier: 'estadual' },
    { id: 'm2', tournamentName: 'Sudeste', year: 2025, art: 'jiujitsu', tier: 'regional' }
  ];
  fighter.dietPlan = 'atletica';
  fighter.socialContacts = (fighter.socialContacts || []).map((sc) => ({
    ...sc,
    birthDate: sc.birthDate ? { ...sc.birthDate, month: 6 } : sc.birthDate
  }));
  fighter = selectCharacterJob(fighter, 'assistente_comercial').updatedChar;
  const bjjTurma = AVAILABLE_TURMAS.find((t) => t.id === 'turma_bairro_jj_iniciante')!;
  fighter = enrollCharacterInTurma(fighter, bjjTurma).updatedChar;

  const jobDef = AVAILABLE_JOBS.find((j) => j.id === 'assistente_comercial')!;
  const expectedSalary = calculateRegionalJobMonthlyPay(fighter, jobDef);
  const expectedSponsor = evaluateMonthlySponsorship(fighter).monthlyPay;
  const expectedLiving = calculateLivingExpenses(fighter).monthlyCost;
  const expectedGym = calculateGymMonthlyExpenses(fighter).totalAthleteCost;
  const expectedEquip = calculateMonthlyEquipmentCost(fighter).athletePays;
  const expectedDiet = calculateRegionalDietCost(fighter, 'atletica');

  const initialMoney = fighter.money;
  const origRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const res = advanceMonth(fighter);
    const expectedDelta =
      expectedSalary + expectedSponsor - expectedLiving - expectedGym - expectedEquip - expectedDiet;
    assert.equal(
      res.updatedChar.money,
      initialMoney + expectedDelta,
      'advanceMonth deve contabilizar receitas e despesas exatamente uma única vez'
    );
    assert.ok(res.monthLog.some((l) => l.includes('Belo Horizonte (MG)')));
    assert.ok(res.monthLog.some((l) => l.includes('Dieta Atlética')));
  } finally {
    Math.random = origRandom;
  }

  // Mudança direta de capital (SP -> Teresina/PI) atualiza todos os índices imediatamente
  const spAthlete = mkAdult('SP');
  spAthlete.job = 'assistente_comercial';
  spAthlete.fame = 220;
  spAthlete.record.wins = 8;
  spAthlete.trophies = [
    { id: 's1', tournamentName: 'Paulista', year: 2025, art: 'jiujitsu', tier: 'estadual' },
    { id: 's2', tournamentName: 'Sul-Brasileiro', year: 2025, art: 'jiujitsu', tier: 'regional' }
  ];

  const relocRes = relocatePlayerToCapital(spAthlete, 'PI');
  assert.equal(relocRes.success, true);
  assert.ok(relocRes.travelCost > 0, 'Mudança interestadual cobra passagem pelo sistema de viagens');
  const moved = relocRes.updatedChar;
  assert.equal(getPlayerLocationSummary(moved).currentLabel, 'Teresina - PI');
  assert.ok(calculateLivingExpenses(moved).monthlyCost < calculateLivingExpenses(spAthlete).monthlyCost);
  assert.ok(calculateRegionalJobMonthlyPay(moved, jobDef) < calculateRegionalJobMonthlyPay(spAthlete, jobDef));
  assert.ok(evaluateMonthlySponsorship(moved).monthlyPay < evaluateMonthlySponsorship(spAthlete).monthlyPay);

  // Economia no exterior
  const usa = mkAdult('GO');
  usa.currentCountry = 'Estados Unidos';
  usa.currentCity = 'Miami';
  usa.fame = 220;
  usa.record.wins = 8;
  usa.trophies = [
    { id: 'u1', tournamentName: 'Pan', year: 2025, art: 'jiujitsu', tier: 'internacional' }
  ];
  assert.ok(calculateLivingExpenses(usa).monthlyCost > calculateLivingExpenses(spAthlete).monthlyCost);
  assert.ok(calculateRegionalSponsorship(usa).monthlyPay > evaluateMonthlySponsorship(moved).monthlyPay);

  // Saves V2/V3 legados com cidade do interior e sem campos modernos migram corretamente
  const legacyV2Save: any = {
    name: 'Lutador V2',
    nickname: 'Raiz',
    avatar: '🥋',
    birthDate: { day: 5, month: 4, year: 2000 },
    careerStartDate: { day: 1, month: 1, year: 2021 },
    currentDate: { day: 1, month: 1, year: 2026 },
    careerMonthsElapsed: 60,
    homeState: 'BA',
    homeCity: 'Feira de Santana',
    currentCity: 'Feira de Santana',
    currentCountry: 'Brasil',
    age: 25,
    startAge: 21,
    currentMonth: 1,
    currentYear: 2026,
    primaryArt: 'capoeira',
    weight: 72,
    targetWeight: 70,
    weightClass: 'Leve (até 70kg)',
    money: 1500,
    energy: 90,
    mentalHealth: 85,
    stress: 10,
    honor: 60,
    fame: 80,
    hype: 20,
    currentGymId: 'gym_bairro',
    job: 'assistente_comercial',
    schoolGrade: 8,
    isStudying: false,
    dietPlan: 'caseira',
    injuries: [],
    attributes: {
      strength: 30, speed: 30, stamina: 30, durability: 30,
      flexibility: 30, fightIq: 30, technique: 30, mentalFocus: 30
    },
    artGraduations: spAthlete.artGraduations,
    moves: spAthlete.moves,
    record: { wins: 4, losses: 1, draws: 0, kos: 1, submissions: 1, pointsWins: 2, mmaWins: 0, mmaLosses: 0 },
    trophies: [],
    rivals: [],
    familySupport: 70,
    socialFeed: []
  };
  const migrated = migrateCharacterData(legacyV2Save);
  assert.equal(migrated.homeCity, 'Salvador');
  assert.equal(migrated.currentCity, 'Salvador');
  assert.equal(resolveActiveEconomicContext(migrated).localityLabel, 'Salvador (BA)');
  assert.ok(calculateLivingExpenses(migrated).monthlyCost > 0);
  const migAdv = advanceMonth(migrated);
  assert.ok(Number.isFinite(migAdv.updatedChar.money), 'Save V2/V3 migrado avança mês sem erros');

  // Academia do professor regionalizada preservada
  const spProf = mkAdult('SP');
  spProf.money = 12000;
  spProf.artGraduations.jiujitsu.rankIndex = 8;
  const piProf = mkAdult('PI');
  piProf.money = 12000;
  piProf.artGraduations.jiujitsu.rankIndex = 8;
  assert.equal(getRegionalAcademyEconomics(spProf).foundCost, 2500);
  const piFounded = foundPlayerAcademy(piProf, { name: 'CT Piauí', art: 'jiujitsu' });
  assert.equal(piFounded.success, true);
  assert.equal(upgradePlayerAcademy(piFounded.updatedChar).success, true);

  console.log('✅ 15, 16 & 17. advanceMonth exato, mudança de capital e compatibilidade de saves V2/V3 validados');
}

console.log('🎉 TODOS OS 17 REQUISITOS DE ECONOMIA REGIONAL & CUSTO DE VIDA PASSARAM!');
