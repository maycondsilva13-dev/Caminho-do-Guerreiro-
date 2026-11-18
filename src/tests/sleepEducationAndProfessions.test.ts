import assert from 'node:assert/strict';
import { advanceMonth, createNewCharacter } from '../utils/characterHelper';
import {
  calculateBlockCapacity,
  evaluateSleepQuality,
  getCharacterWeeklyActivities,
  getSleepPointsRequirement,
  validateEnrollment,
  validateSleepContinuity
} from '../types/agenda';
import { AVAILABLE_TURMAS } from '../data/gymClassesData';
import { EDUCATION_INSTITUTIONS } from '../data/educationData';
import { AVAILABLE_JOBS } from '../data/lifeEventsData';
import {
  canEnrollInCourse,
  dropEducationEnrollment,
  enrollInEducationCourse,
  selectCharacterJob,
  takeEntranceExamPrep,
  validateJobEligibility
} from '../utils/educationHelper';
import { calculateRegionalJobMonthlyPay } from '../utils/regionalEconomyHelper';

console.log('🧪 Executando testes: Sono 4/3 pts, Instituições Públicas/Particulares & Profissões...');

// ===========================================================================
// 1. AJUSTE DO SONO CONTÍNUO (4 PTS CRIANÇA/ADOLESCENTE, 3 PTS JOVEM/ADULTO)
// ===========================================================================
{
  assert.equal(getSleepPointsRequirement(8), 4, 'Criança (8a) deve exigir 4 pontos de sono');
  assert.equal(getSleepPointsRequirement(13), 4, 'Pré-adolescente (13a) deve exigir 4 pontos de sono');
  assert.equal(getSleepPointsRequirement(16), 4, 'Adolescente (16a) deve exigir 4 pontos de sono');
  assert.equal(getSleepPointsRequirement(21), 3, 'Jovem adulto (21a) deve exigir 3 pontos de sono');
  assert.equal(getSleepPointsRequirement(38), 3, 'Adulto/Master (38a) deve exigir 3 pontos de sono');

  // Criança/adolescente: 3 madrugada + 1 noite -> 2 pts livres à noite!
  const teen = createNewCharacter('Pedro Jovem', 'PJ', { day: 10, month: 4, year: 2010 }, 13, 'jiujitsu', '🥋');
  const teenActs = getCharacterWeeklyActivities(teen);
  const teenNightCap = calculateBlockCapacity('sexta', 'noite', teenActs);
  assert.equal(teenNightCap.usedPoints, 1, 'Menor (<18) deve ocupar apenas 1 pt no bloco da noite com sono');
  assert.equal(teenNightCap.availablePoints, 2, 'Menor (<18) deve ter 2 pts livres à noite na agenda');
  const teenSleepEval = evaluateSleepQuality(teen.age, teenActs, 'segunda', teen.familySupport);
  assert.equal(teenSleepEval.isContinuous, true);
  assert.equal(teenSleepEval.sleepDebtPoints, 0);
  assert.equal(teenSleepEval.sleepEfficiencyScore, 100);

  // Adolescente agora consegue se matricular em aula estendida de 2 pts à noite (ex: Sexta Noite LLE 2 pts)
  const lleExtended = AVAILABLE_TURMAS.find((t) => t.id === 'turma_bairro_lle_estendido')!;
  teen.attributes.fightIq = 10;
  const enrTeenExt = validateEnrollment(teen, lleExtended);
  assert.equal(enrTeenExt.isValid, true, 'Com sono de 4 pts, adolescente pode fazer aula estendida de 2 pts à noite');

  // Jovem/Adulto: 3 madrugada + 0 noite -> Todos os 3 pts da noite livres!
  const adult = createNewCharacter('Marcos Silva', 'MS', { day: 10, month: 4, year: 2003 }, 21, 'jiujitsu', '🥋');
  const adultActs = getCharacterWeeklyActivities(adult);
  const adultMadrugadaCap = calculateBlockCapacity('segunda', 'madrugada', adultActs);
  const adultNightCap = calculateBlockCapacity('segunda', 'noite', adultActs);
  assert.equal(adultMadrugadaCap.usedPoints, 3, 'Adulto dorme 3 pts contínuos na madrugada');
  assert.equal(adultNightCap.usedPoints, 0, 'Adulto deve ter 0 pts de sono na noite');
  assert.equal(adultNightCap.availablePoints, 3, 'Adulto deve ter todos os 3 pts livres no bloco da noite');
  const adultContinuity = validateSleepContinuity('segunda', adultActs);
  assert.equal(adultContinuity.isContinuous, true);
  assert.equal(adultContinuity.totalSleepPoints, 3);
  const adultSleepEval = evaluateSleepQuality(adult.age, adultActs, 'segunda', adult.familySupport);
  assert.equal(adultSleepEval.sleepDebtPoints, 0);
  assert.equal(adultSleepEval.sleepEfficiencyScore, 100);
}

// ===========================================================================
// 2. INSTITUIÇÕES DE ENSINO PÚBLICAS E PARTICULARES (4 NÍVEIS + VÁRIAS ÁREAS)
// ===========================================================================
{
  const levels = ['fundamental', 'medio', 'tecnico', 'superior'] as const;
  for (const lvl of levels) {
    assert.ok(
      EDUCATION_INSTITUTIONS.some((i) => i.level === lvl && i.type === 'publica'),
      `Deve existir instituição pública para o nível ${lvl}`
    );
    assert.ok(
      EDUCATION_INSTITUTIONS.some((i) => i.level === lvl && i.type === 'particular'),
      `Deve existir instituição particular para o nível ${lvl}`
    );
  }

  const techCourses = EDUCATION_INSTITUTIONS.filter((i) => i.level === 'tecnico').flatMap((i) => i.courses);
  const techFields = new Set(techCourses.map((c) => c.field));
  assert.ok(techFields.size >= 5, `Ensino Técnico deve cobrir várias áreas (atual: ${techFields.size})`);

  const supCourses = EDUCATION_INSTITUTIONS.filter((i) => i.level === 'superior').flatMap((i) => i.courses);
  const supFields = new Set(supCourses.map((c) => c.field));
  assert.ok(supFields.size >= 7, `Ensino Superior deve cobrir várias áreas (atual: ${supFields.size})`);

  // Menor em dificuldade difícil (família humilde) inicia na rede pública; pode transferir para particular (pagando)
  const minor = createNewCharacter(
    'Lucas Alves',
    'Luquinha',
    { day: 5, month: 6, year: 2013 },
    13,
    'boxe',
    '🥊',
    'SP',
    'São Paulo',
    'M',
    'dificil'
  );
  assert.equal(minor.education?.currentEnrollment?.level, 'fundamental');
  assert.equal(minor.education?.currentEnrollment?.institutionType, 'publica');
  assert.equal(minor.education?.currentEnrollment?.monthlyFee, 0);

  // Bloqueio: menor sem Fundamental completo não pode ingressar no Ensino Médio
  const tryMedioEarly = canEnrollInCourse(minor, 'inst_pub_medio', 'curso_pub_medio', 'manha');
  assert.equal(tryMedioEarly.canEnroll, false, 'Sem Fundamental completo não deve ingressar no Ensino Médio');

  // Adulto (21 anos) começa com Fundamental + Médio concluídos, mas sem Técnico/Superior
  let adult = createNewCharacter(
    'Rafael Costa',
    'Rafa',
    { day: 15, month: 2, year: 2005 },
    21,
    'jiujitsu',
    '🥋',
    'SP',
    'São Paulo',
    'M',
    'normal'
  );
  adult.currentDate = { day: 1, month: 1, year: 2026 };
  adult.currentMonth = 1;
  adult.currentYear = 2026;
  assert.equal(adult.education?.completedDegrees.some((d) => d.level === 'fundamental'), true);
  assert.equal(adult.education?.completedDegrees.some((d) => d.level === 'medio'), true);

  // Nota inicial 8.0 permite entrar na ETEC (min 6.5) e USP Direito (min 7.5), mas bloqueia USP Medicina (min 8.5)!
  const tryMedEarly = canEnrollInCourse(adult, 'inst_pub_superior', 'sup_pub_medicina', 'manha');
  assert.equal(tryMedEarly.canEnroll, false, 'Medicina Pública exige nota >= 8.5');

  // Estudar/simulado eleva nota para >= 8.5 e libera Medicina Pública
  adult.energy = 100;
  adult = takeEntranceExamPrep(adult).updatedChar;
  const tryMedAfterPrep = canEnrollInCourse(adult, 'inst_pub_superior', 'sup_pub_medicina', 'manha');
  assert.equal(tryMedAfterPrep.canEnroll, true, 'Após estudar, nota >= 8.5 deve liberar Medicina Pública');

  // Matricula adulto em Técnico em TI Público à NOITE (2 pts Seg/Qua/Sex) e ainda mantém trabalho à tarde + BJJ à noite (1 pt)!
  const workAssist = selectCharacterJob(adult, 'assistente_comercial');
  assert.equal(workAssist.success, true, 'Ensino Médio completo deve liberar Assistente Comercial');
  adult = workAssist.updatedChar;

  const enrTech = enrollInEducationCourse(adult, 'inst_pub_tecnico', 'tec_pub_ti', 'noite');
  assert.equal(enrTech.success, true, 'Adulto trabalhador deve poder cursar Técnico em TI Público à noite');
  adult = enrTech.updatedChar;

  // Verifica que com sono adulto = 3 pts (madrugada), Bloco Noite tem: 2 pts Técnico TI + 1 pt BJJ livre!
  const actsWithTech = getCharacterWeeklyActivities(adult);
  const monNightWithTech = calculateBlockCapacity('segunda', 'noite', actsWithTech);
  assert.equal(monNightWithTech.usedPoints, 2, 'Técnico em TI à noite ocupa 2 de 3 pts na segunda');
  assert.equal(monNightWithTech.availablePoints, 1, 'Ainda sobra 1 pt na segunda à noite para treinar arte marcial!');

  const bjjTurma = AVAILABLE_TURMAS.find((t) => t.id === 'turma_bairro_jj_iniciante')!;
  const bjjVal = validateEnrollment(adult, bjjTurma);
  assert.equal(
    bjjVal.isValid,
    true,
    'Graças ao sono adulto de 3 pts, dá para trabalhar de tarde, fazer Técnico à noite (2 pts) e BJJ (1 pt) na mesma noite!'
  );
}

// ===========================================================================
// 3. PROGRESSÃO MENSAL DE FORMAÇÃO -> DIPLOMA -> LIBERAÇÃO DE PROFISSÕES
// ===========================================================================
{
  let worker = createNewCharacter(
    'Camila Rocha',
    'Mila',
    { day: 12, month: 8, year: 2003 },
    21,
    'muaythai',
    '🥊',
    'RJ',
    'Rio de Janeiro',
    'F',
    'normal'
  );
  worker.currentDate = { day: 1, month: 1, year: 2026 };
  worker.currentMonth = 1;
  worker.currentYear = 2026;
  worker.money = 20000;

  // Sem Técnico nem Superior: profissões técnicas/superiores devem estar bloqueadas
  assert.equal(validateJobEligibility(worker, 'tec_ti').eligible, false, 'Sem Técnico em TI não assume Técnico de TI');
  assert.equal(
    validateJobEligibility(worker, 'fisioterapeuta_esportivo').eligible,
    false,
    'Sem Superior em Fisioterapia não assume Fisioterapeuta'
  );
  assert.equal(
    validateJobEligibility(worker, 'engenheiro_software').eligible,
    false,
    'Sem Superior em TI não assume Engenheiro de Software'
  );

  // Matricula em Técnico de TI Particular (8 meses, R$ 420/mês)
  const techEnr = enrollInEducationCourse(worker, 'inst_priv_tecnico', 'tec_priv_ti', 'noite');
  assert.equal(techEnr.success, true);
  worker = techEnr.updatedChar;
  const moneyBefore = worker.money;

  const origRandom = Math.random;
  Math.random = () => 0.99;
  try {
    for (let m = 0; m < 8; m++) {
      worker = advanceMonth(worker).updatedChar;
    }
  } finally {
    Math.random = origRandom;
  }

  // Deve ter pago 8x R$ 420 e se formado no Técnico em TI!
  assert.ok(
    worker.education?.completedDegrees.some((d) => d.level === 'tecnico' && d.field === 'ti_sistemas'),
    'Após 8 meses, deve receber diploma de Técnico em TI'
  );
  assert.equal(worker.education?.currentEnrollment, undefined, 'Matrícula concluída deve liberar a agenda');
  assert.ok(worker.money < moneyBefore, 'Mensalidades de instituição particular devem ser descontadas');

  // Agora Técnico em TI está liberado, mas Técnico em Enfermagem e Engenheiro de Software continuam bloqueados!
  assert.equal(validateJobEligibility(worker, 'tec_ti').eligible, true, 'Diploma Técnico em TI libera cargo de Técnico em TI');
  assert.equal(
    validateJobEligibility(worker, 'tec_enfermagem').eligible,
    false,
    'Diploma Técnico em TI NÃO libera Técnico de Enfermagem'
  );
  assert.equal(
    validateJobEligibility(worker, 'engenheiro_software').eligible,
    false,
    'Apenas Técnico em TI NÃO libera cargo Superior de Engenheiro de Software'
  );

  // Assume vaga de Técnico de TI e confirma recebimento do salário mensal regionalizado no RJ (R$ 840 * 4 * 1.22 = R$ 4.099)
  const hireTech = selectCharacterJob(worker, 'tec_ti');
  assert.equal(hireTech.success, true);
  worker = hireTech.updatedChar;
  assert.equal(worker.job, 'tec_ti');

  const tecTiJob = AVAILABLE_JOBS.find((j) => j.id === 'tec_ti')!;
  const expectedRjPay = calculateRegionalJobMonthlyPay(worker, tecTiJob);
  Math.random = () => 0.99;
  try {
    const payRes = advanceMonth(worker);
    assert.ok(
      payRes.monthLog.some((l) => l.includes(`+R$ ${expectedRjPay.toLocaleString('pt-BR')}`)),
      'Salário mensal regionalizado da nova profissão deve ser creditado corretamente no advanceMonth'
    );
    worker = payRes.updatedChar;
  } finally {
    Math.random = origRandom;
  }

  // Agora cursa Superior Público em Engenharia de Software (16 meses, R$ 0/mês)
  const supEnr = enrollInEducationCourse(worker, 'inst_pub_superior', 'sup_pub_ti', 'noite');
  assert.equal(supEnr.success, true);
  worker = supEnr.updatedChar;

  Math.random = () => 0.99;
  try {
    for (let m = 0; m < 16; m++) {
      worker = advanceMonth(worker).updatedChar;
    }
  } finally {
    Math.random = origRandom;
  }

  assert.equal(
    validateJobEligibility(worker, 'engenheiro_software').eligible,
    true,
    'Formação Superior em TI deve liberar Engenheiro de Software'
  );
  assert.equal(
    validateJobEligibility(worker, 'advogado').eligible,
    false,
    'Formação Superior em TI não deve liberar Direito/Advogado'
  );

  const hireEng = selectCharacterJob(worker, 'engenheiro_software');
  assert.equal(hireEng.success, true);
  assert.equal(hireEng.updatedChar.job, 'engenheiro_software');

  // Testa trancamento de matrícula adulta
  let dropper = enrollInEducationCourse(hireEng.updatedChar, 'inst_pub_superior', 'sup_pub_adm', 'manha').updatedChar;
  assert.ok(dropper.education?.currentEnrollment, 'Deve ter matrícula ativa antes de trancar');
  const dropRes = dropEducationEnrollment(dropper);
  assert.equal(dropRes.success, true);
  assert.equal(dropRes.updatedChar.education?.currentEnrollment, undefined);
}

console.log('✅ Todos os testes de Sono (4/3 pts), Instituições Públicas/Particulares e Profissões passaram!');
