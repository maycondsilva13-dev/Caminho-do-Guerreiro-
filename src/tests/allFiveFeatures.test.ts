import assert from 'node:assert/strict';
import {
  advanceMonth,
  calculateLivingExpenses,
  createNewCharacter,
  evaluateMonthlySponsorship
} from '../utils/characterHelper';
import { getEligibleHeirs, inheritLegacyCharacter } from '../utils/dynastyHelper';
import {
  coachParticipantInTournament,
  getCoachableTournamentParticipants,
  getTournamentFamilySupport
} from '../utils/tournamentFamilySupportHelper';
import { INITIAL_TOURNAMENTS } from '../data/tournamentsData';
import { helpFamilyFinancially } from '../utils/socialLifeHelper';
import { canFamilyAffordBirthday, resolveMonthlyTrainingAttendance } from '../utils/monthlyAttendanceHelper';
import { enrollCharacterInTurma } from '../types/agenda';
import { AVAILABLE_TURMAS } from '../data/gymClassesData';
import { calculateMonthlyRecovery } from '../utils/recoveryHelper';
import {
  getEffectiveMasterAttendance,
  validateGraduationRequirements
} from '../utils/graduationHelper';
import {
  foundPlayerAcademy,
  holdAcademySeminarAndGraduation
} from '../utils/playerAcademyHelper';

console.log('🧪 Executando testes das 5 novas funcionalidades integradas...');

const bjjTurma = AVAILABLE_TURMAS.find((t) => t.id === 'turma_bairro_jj_iniciante')!;
const bjjTournament = INITIAL_TOURNAMENTS.find((t) => t.art === 'jiujitsu')!;

// ===========================================================================
// 1. MODO DINASTIA / LEGADO FAMILIAR
// ===========================================================================
{
  let founder = createNewCharacter(
    'Henrique Silva',
    'Mestre Henrique',
    { day: 10, month: 4, year: 1974 },
    21,
    'jiujitsu',
    '🥋',
    'SP',
    'São Paulo',
    'M'
  );
  founder.age = 52;
  founder.money = 10000;
  founder.fame = 400;
  founder.artGraduations.jiujitsu.rankIndex = 8; // Faixa Preta para fundar academia
  founder.artGraduations.jiujitsu.name = 'Faixa Preta';

  const foundRes = foundPlayerAcademy(founder, {
    name: 'CT Dinastia Silva',
    art: 'jiujitsu',
    philosophy: 'Legado eterno',
    monthlyFeePerStudent: 200
  });
  assert.equal(foundRes.success, true, 'Fundador deve conseguir abrir academia');
  founder = foundRes.updatedChar;

  // Adiciona um filho com 14 anos praticante de BJJ
  founder.socialContacts = founder.socialContacts || [];
  founder.socialContacts.push({
    id: 'child_heir_1',
    name: 'Lucas Silva',
    avatar: '👦',
    gender: 'M',
    relationType: 'filho',
    personality: 'disciplinado',
    birthDate: { day: 5, month: 5, year: 2012 },
    age: 14,
    isAlive: true,
    health: 98,
    wealthTier: 'abastado',
    occupation: 'Estudante & Lutador Juvenil',
    dailyRoutine: 'Escola e Jiu-Jitsu',
    city: 'São Paulo',
    affinity: 95,
    romanceLevel: 0,
    respect: 90,
    relationshipStage: 'familia',
    martialArt: 'jiujitsu',
    martialArtRankIndex: 2,
    martialArtStripes: 2,
    martialArtBelt: 'Faixa Amarela · 2º Grau',
    martialArtMonths: 14
  });

  const heirs = getEligibleHeirs(founder);
  assert.ok(heirs.some((h) => h.id === 'child_heir_1' && h.source === 'child'), 'Filho >= 8 anos deve ser herdeiro elegível');
  assert.ok(heirs.some((h) => h.source === 'student'), 'Aluno >= 14 anos da academia também deve ser elegível');

  const moneyBefore = founder.money;
  const legacyRes = inheritLegacyCharacter(founder, 'child_heir_1', 'child');
  assert.equal(legacyRes.success, true, 'Sucessão deve ter sucesso');
  const heirChar = legacyRes.heirChar!;

  assert.equal(heirChar.name, 'Lucas Silva');
  assert.equal(heirChar.dynastyGeneration, 2);
  assert.equal(heirChar.legacyPredecessorName, 'Henrique Silva');
  assert.equal(heirChar.isAlive, true);
  assert.equal(heirChar.money, Math.round(moneyBefore * 0.6), 'Herdeiro deve receber 60% do patrimônio');
  assert.equal(heirChar.fame, Math.min(400, Math.round(400 * 0.25)), 'Herdeiro deve herdar 25% da fama');
  assert.ok(heirChar.playerAcademy, 'Academia da família deve ser herdada na dinastia');
  assert.equal(heirChar.artGraduations.jiujitsu.rankIndex, 2, 'Graduação do herdeiro deve ser preservada');
  assert.ok(
    (heirChar.socialContacts || []).some((c) => c.name === 'Henrique Silva' && !c.isAlive),
    'Predecessor deve constar no memorial da família'
  );
  console.log('✅ 1. Modo Dinastia / Legado Familiar validado');
}

// ===========================================================================
// 2. CONEXÃO FAMÍLIA/ALUNOS ↔ TORNEIOS (TORCIDA, RIVALIDADE & CORNERING)
// ===========================================================================
{
  const player = createNewCharacter(
    'Rafael Costa',
    'Fael',
    { day: 12, month: 3, year: 2002 },
    21,
    'jiujitsu',
    '🥋',
    'RJ',
    'Rio de Janeiro',
    'M'
  );
  player.age = 24;
  player.energy = 80;
  player.money = 8000;
  player.artGraduations.jiujitsu.rankIndex = 8;

  // Filho praticante de BJJ + Inimigo declarado
  player.socialContacts = player.socialContacts || [];
  player.socialContacts.push(
    {
      id: 'son_bjj',
      name: 'Enzo Costa',
      avatar: '👦',
      gender: 'M',
      relationType: 'filho',
      personality: 'ambicioso',
      birthDate: { day: 1, month: 2, year: 2012 },
      age: 14,
      isAlive: true,
      health: 95,
      wealthTier: 'classe_media',
      occupation: 'Estudante',
      dailyRoutine: 'Treinos BJJ',
      city: 'Rio de Janeiro',
      affinity: 90,
      romanceLevel: 0,
      respect: 80,
      relationshipStage: 'familia',
      martialArt: 'jiujitsu',
      martialArtRankIndex: 1,
      martialArtBelt: 'Faixa Cinza'
    },
    {
      id: 'enemy_1',
      name: 'Marcos Traira',
      avatar: '😠',
      gender: 'M',
      relationType: 'inimigo',
      personality: 'explosivo',
      birthDate: { day: 5, month: 5, year: 2001 },
      age: 25,
      isAlive: true,
      health: 95,
      wealthTier: 'classe_media',
      occupation: 'Lutador',
      dailyRoutine: 'Treinos',
      city: 'Rio de Janeiro',
      affinity: -60,
      romanceLevel: 0,
      respect: 10,
      relationshipStage: 'inimigo',
      martialArt: 'jiujitsu',
      linkedWorldFighterId: 'npc_enemy_1'
    }
  );

  const support = getTournamentFamilySupport(player, bjjTournament, 'npc_enemy_1', 'Marcos Traira');
  assert.ok(support.supportersCount > 0, 'Familiares próximos devem estar na plateia');
  assert.ok(support.focusBonus > 0, 'Torcida deve gerar bônus de foco mental');
  assert.equal(support.isPersonalRivalry, true, 'Deve detectar clássico contra inimigo do círculo social');

  const coachables = getCoachableTournamentParticipants(player, bjjTournament);
  assert.ok(coachables.some((p) => p.id === 'son_bjj'), 'Filho praticante de BJJ deve poder ser orientado no corner');

  const coachRes = coachParticipantInTournament(
    player,
    bjjTournament,
    'son_bjj',
    'family',
    'busca_finalizacao',
    () => 0.1 // força vitória com medalha
  );
  assert.equal(coachRes.won, true, 'Com rng baixo, orientado deve vencer no corner');
  assert.equal(coachRes.updatedChar.energy, 70, 'Corner consome 10 de energia');

  // Impede corner duplicado no mesmo torneio/ano
  const dupCoach = coachParticipantInTournament(
    coachRes.updatedChar,
    bjjTournament,
    'son_bjj',
    'family',
    'busca_finalizacao'
  );
  assert.equal(dupCoach.updatedChar, coachRes.updatedChar, 'Não pode atuar no corner 2x no mesmo torneio/ano');
  console.log('✅ 2. Torcida da Família, Rivalidade Pessoal & Cornering validados');
}

// ===========================================================================
// 3. ECONOMIA FAMILIAR, AJUDA À FAMÍLIA, CUSTO DE VIDA & PATROCÍNIOS
// ===========================================================================
{
  const youth = createNewCharacter(
    'Pedrinho',
    'Pequeno',
    { day: 10, month: 6, year: 2012 },
    13,
    'boxe',
    '🥊',
    'SP',
    'São Paulo',
    'M'
  );
  youth.age = 14;
  youth.money = 0;
  // Deixa pais humildes sem recursos -> sem festa
  for (const sc of youth.socialContacts || []) {
    if (sc.relationType === 'pai' || sc.relationType === 'mae') {
      sc.wealthTier = 'humilde';
    }
  }
  assert.equal(
    canFamilyAffordBirthday(youth, false).canAfford,
    false,
    'Família humilde e sem dinheiro não pode comemorar aniversário'
  );
  assert.equal(calculateLivingExpenses(youth).monthlyCost, 0, 'Menor de idade não paga aluguel');

  // Jovem ganha bolsa/prêmio e ajuda a família
  youth.money = 500;
  const helpRes = helpFamilyFinancially(youth, 300);
  assert.equal(helpRes.success, true);
  assert.equal(helpRes.updatedChar.money, 200);
  assert.equal(
    canFamilyAffordBirthday(helpRes.updatedChar, false).canAfford,
    true,
    'Ajuda financeira eleva pais de humilde para classe média e permite comemorações'
  );

  // Adulto custo de vida & patrocínio dinâmico no advanceMonth
  const adult = createNewCharacter(
    'Diego Andrade',
    'Flash',
    { day: 10, month: 9, year: 2002 },
    21,
    'muaythai',
    '🥊',
    'SP',
    'São Paulo',
    'M'
  );
  adult.age = 24;
  adult.currentDate = { day: 1, month: 1, year: 2026 };
  adult.currentMonth = 1;
  adult.currentYear = 2026;
  adult.money = 1000;
  adult.fame = 220;
  adult.record.wins = 8;
  adult.trophies = [
    { id: 't1', tournamentName: 'Estadual SP', year: 2025, art: 'muaythai', tier: 'estadual' },
    { id: 't2', tournamentName: 'Copa Sudeste', year: 2025, art: 'muaythai', tier: 'regional' }
  ];

  // Evita aniversário aleatório de familiar no mês 1 para conferir delta exato
  adult.socialContacts = (adult.socialContacts || []).map((sc) => ({
    ...sc,
    birthDate: sc.birthDate ? { ...sc.birthDate, month: 6 } : sc.birthDate
  }));

  const sponsorCheck = evaluateMonthlySponsorship(adult);
  const livingCheck = calculateLivingExpenses(adult);
  const expectedGymCost = (adult.currentGymId === 'gym_bairro' ? 120 : 0);
  const expectedEquipCost = Math.round(36 * 1.32); // muaythai em SP (1.32)
  assert.equal(sponsorCheck.name, 'Kombat Pro Nutrition');
  assert.ok(sponsorCheck.monthlyPay > 1200, 'Vitórias, títulos e fama em SP devem qualificar Patrocínio Profissional');
  assert.ok(livingCheck.monthlyCost > 1200, 'Adulto solteiro em SP paga custo de vida regional discriminado');
  assert.equal(
    livingCheck.breakdown.housing +
      livingCheck.breakdown.food +
      livingCheck.breakdown.transport +
      livingCheck.breakdown.health +
      livingCheck.breakdown.family,
    livingCheck.monthlyCost,
    'Soma das rubricas de custo de vida deve igualar o total mensal'
  );

  const origRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const adv = advanceMonth(adult);
    assert.equal(adv.updatedChar.activeSponsorName, 'Kombat Pro Nutrition');
    assert.equal(adv.updatedChar.activeSponsorMonthlyPay, sponsorCheck.monthlyPay);
    assert.equal(
      adv.updatedChar.money,
      1000 + sponsorCheck.monthlyPay - livingCheck.monthlyCost - expectedGymCost - expectedEquipCost,
      'Saldo líquido após despesas de SP deve refletir patrocínio menos custo de vida, academia e equipamentos exatos'
    );
    assert.ok(
      adv.monthLog.some((l) => l.includes('Patrocínio')),
      'Log mensal deve registrar recebimento do patrocínio'
    );
    assert.ok(
      adv.monthLog.some((l) => l.includes('Custo de Vida')),
      'Log mensal deve registrar despesas de vida adulta'
    );
    assert.ok(
      adv.monthLog.some((l) => l.includes('Manutenção de Equipamentos')),
      'Log mensal deve registrar manutenção de equipamentos'
    );
  } finally {
    Math.random = origRandom;
  }
  console.log('✅ 3. Economia Familiar, Ajuda Financeira & Patrocínios Dinâmicos validados');
}

// ===========================================================================
// 4. CAMP DE LUTA & PERIODIZAÇÃO PARA CAMPEONATOS
// ===========================================================================
{
  const mkPlayer = (intensity: 'leve' | 'tecnico' | 'intenso') => {
    const p = createNewCharacter(
      'Camp Test',
      'Tester',
      { day: 5, month: 10, year: 2003 },
      21,
      'jiujitsu',
      '🥋',
      'SP',
      'São Paulo',
      'M'
    );
    p.age = 22;
    p.currentDate = { day: 1, month: 2, year: 2026 };
    p.currentMonth = 2;
    p.currentYear = 2026;
    p.trainingCampIntensity = intensity;
    const enr = enrollCharacterInTurma(p, bjjTurma);
    assert.equal(enr.success, true);
    return enr.updatedChar;
  };

  const pLeve = mkPlayer('leve');
  const pIntenso = mkPlayer('intenso');

  const resLeve = resolveMonthlyTrainingAttendance(pLeve, { day: 1, month: 2, year: 2026 }, []);
  const resIntenso = resolveMonthlyTrainingAttendance(pIntenso, { day: 1, month: 2, year: 2026 }, []);

  assert.ok(
    resIntenso.totalXpEarned > resLeve.totalXpEarned,
    `Camp intenso (${resIntenso.totalXpEarned} XP) deve gerar mais XP que Camp leve (${resLeve.totalXpEarned} XP)`
  );

  const recLeve = calculateMonthlyRecovery(resLeve.updatedChar, 2, 2026);
  const recIntenso = calculateMonthlyRecovery(resIntenso.updatedChar, 2, 2026);
  assert.ok(
    recIntenso.newFatigue > recLeve.newFatigue,
    `Camp intenso (${recIntenso.newFatigue} fadiga) deve cansar mais que Camp leve (${recLeve.newFatigue} fadiga)`
  );
  assert.ok(
    recLeve.newEnergy >= recIntenso.newEnergy,
    'Camp leve deve recuperar melhor a energia mensal'
  );
  console.log('✅ 4. Camp de Luta & Periodização validado');
}

// ===========================================================================
// 5. AVALIAÇÃO DO MESTRE (FALTAS JUSTIFICADAS X INJUSTIFICADAS + NOTA) & SEMINÁRIO COLETIVO
// ===========================================================================
{
  const student = createNewCharacter(
    'Jovem Disciplinado',
    'JD',
    { day: 10, month: 5, year: 2010 },
    13,
    'boxe',
    '🥊',
    'SP',
    'São Paulo',
    'M'
  );
  student.age = 16;
  student.artGraduations.boxe.xp = 9999;
  student.artGraduations.boxe.monthsInRank = 24;
  student.attributes.technique = 50;
  student.attributes.fightIq = 50;
  student.schoolGrade = 8.0;

  // 5 presenças + 5 faltas JUSTIFICADAS (doença/família) -> 100% efetivo -> APROVADO
  student.classSessions = [
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `ok_${i}`,
      enrollmentId: 'enr_1',
      classId: 't1',
      title: 'Boxe',
      art: 'boxe' as const,
      gymId: 'gym_bairro',
      gymName: 'Dojo',
      instructorName: 'Mestre Carlos',
      classType: 'regular' as const,
      date: { day: i + 1, month: 1, year: 2026 },
      dayOfWeek: 'segunda' as const,
      block: 'tarde' as const,
      pointsCost: 1,
      status: 'concluida' as const
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `just_${i}`,
      enrollmentId: 'enr_1',
      classId: 't1',
      title: 'Boxe',
      art: 'boxe' as const,
      gymId: 'gym_bairro',
      gymName: 'Dojo',
      instructorName: 'Mestre Carlos',
      classType: 'regular' as const,
      date: { day: i + 10, month: 1, year: 2026 },
      dayOfWeek: 'quarta' as const,
      block: 'tarde' as const,
      pointsCost: 1,
      status: 'falta' as const,
      notes: i % 2 === 0 ? 'Falta médica: Gripe' : 'Falta justificada: Aniversário de mãe em família'
    }))
  ];

  const evalJust = getEffectiveMasterAttendance(student.classSessions);
  assert.equal(evalJust.effectiveRate, 100, 'Faltas justificadas não devem reduzir frequência efetiva do Mestre');
  assert.equal(validateGraduationRequirements(student, 'boxe').canAdvance, true, 'Aluno com faltas justificadas e nota boa deve poder graduar');

  // Se nota escolar cair < 6.0, Mestre barra menor de 18
  student.schoolGrade = 4.5;
  assert.equal(
    validateGraduationRequirements(student, 'boxe').canAdvance,
    false,
    'Menor de 18 com média < 6.0 deve ser barrado na avaliação do Mestre'
  );
  student.schoolGrade = 7.5;

  // Faltas INJUSTIFICADAS reduzindo taxa efetiva abaixo de 70% devem barrar graduação
  for (let i = 0; i < 4; i++) {
    student.classSessions!.push({
      id: `bad_${i}`,
      enrollmentId: 'enr_1',
      classId: 't1',
      title: 'Boxe',
      art: 'boxe' as const,
      gymId: 'gym_bairro',
      gymName: 'Dojo',
      instructorName: 'Mestre Carlos',
      classType: 'regular' as const,
      date: { day: i + 20, month: 1, year: 2026 },
      dayOfWeek: 'sexta' as const,
      block: 'tarde' as const,
      pointsCost: 1,
      status: 'falta' as const,
      notes: 'Falta manual registrada'
    });
  }
  const evalUnjust = getEffectiveMasterAttendance(student.classSessions);
  assert.equal(evalUnjust.effectiveRate, 56); // 5 / 9 = 55.5 -> 56%
  assert.equal(
    validateGraduationRequirements(student, 'boxe').canAdvance,
    false,
    'Faltas injustificadas (< 70%) devem barrar graduação'
  );

  // Seminário & Exame Coletivo na Academia do Professor
  let prof = createNewCharacter(
    'Sensei Mauro',
    'Mauro',
    { day: 1, month: 1, year: 1995 },
    21,
    'jiujitsu',
    '🥋',
    'SP',
    'São Paulo',
    'M'
  );
  prof.age = 31;
  prof.money = 5000;
  prof.energy = 80;
  prof.careerMonthsElapsed = 12;
  prof.artGraduations.jiujitsu.rankIndex = 8;

  const acRes = foundPlayerAcademy(prof, {
    name: 'Tatame Central',
    art: 'jiujitsu',
    philosophy: 'Respeito e precisão'
  });
  assert.equal(acRes.success, true);
  prof = acRes.updatedChar;
  // Prepara 1 aluno para promoção imediata no seminário
  prof.playerAcademy!.students[0].xp = prof.playerAcademy!.students[0].xpNeeded;
  prof.playerAcademy!.students[0].stripes = 4;

  const semRes = holdAcademySeminarAndGraduation(prof);
  assert.equal(semRes.success, true, 'Seminário coletivo deve ser concluído com sucesso');
  assert.ok(semRes.promotedCount >= 1, 'Aluno pronto deve ser graduado automaticamente no Seminário Coletivo');
  assert.equal(semRes.updatedChar.money, prof.money - 250);

  // Cooldown de 6 meses impede seminário imediato
  const semDup = holdAcademySeminarAndGraduation(semRes.updatedChar);
  assert.equal(semDup.success, false, 'Cooldown de 6 meses deve bloquear seminário consecutivo');

  console.log('✅ 5. Avaliação do Mestre & Seminário Coletivo na Academia validados');
}

console.log('🎉 TODOS OS 5 NOVOS SISTEMAS PASSARAM 100%!');
