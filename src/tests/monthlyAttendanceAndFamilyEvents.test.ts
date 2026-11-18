import assert from 'node:assert/strict';
import { advanceMonth, createNewCharacter } from '../utils/characterHelper';
import { enrollCharacterInTurma } from '../types/agenda';
import { AVAILABLE_TURMAS } from '../data/gymClassesData';
import {
  canFamilyAffordBirthday,
  collectMonthlyFamilyBirthdays,
  resolveMonthlyTrainingAttendance,
  rollMonthlyIllnesses
} from '../utils/monthlyAttendanceHelper';
import {
  addWorldFighterToSocialCircle,
  haveChildWithSpouse,
  interactWithSocialContact,
  marrySocialContact,
  processMonthlySocialWorld,
  startDatingContact
} from '../utils/socialLifeHelper';
import { WORLD_FIGHTERS } from '../data/worldFightersData';

console.log('🧪 Executando testes: Comparecimento Automático, Doenças Raras, Eventos em Família & Orçamento...');

const bjjTurma = AVAILABLE_TURMAS.find((t) => t.id === 'turma_bairro_jj_iniciante')!;
assert.ok(bjjTurma, 'Turma BJJ iniciante deve existir');

// ---------------------------------------------------------------------------
// 1. Comparecimento automático a todos os treinos matriculados do mês + Grau BJJ
// ---------------------------------------------------------------------------
{
  let player = createNewCharacter(
    'Gabriel Mendes',
    'Gabi',
    { day: 15, month: 8, year: 2003 },
    21,
    'jiujitsu',
    '🥋',
    'SP',
    'São Paulo',
    'M'
  );
  player.currentDate = { day: 1, month: 1, year: 2026 };
  player.currentMonth = 1;
  player.currentYear = 2026;
  player.money = 1000;
  // Move todos os aniversários da família para julho/setembro para não interferir nos meses 1..4
  for (const c of player.socialContacts || []) {
    c.birthDate = { day: 10, month: 9, year: c.birthDate.year };
  }

  const enr = enrollCharacterInTurma(player, bjjTurma);
  assert.equal(enr.success, true, 'Matrícula BJJ 3x/semana deve ser confirmada');
  player = enr.updatedChar;
  const janScheduled = (player.classSessions || []).filter(
    (s) => s.date.month === 1 && s.status === 'agendada'
  ).length;
  assert.ok(janScheduled >= 12, `Janeiro deve ter >= 12 sessões agendadas (atual: ${janScheduled})`);

  // Simula 4 meses apenas avançando mês (com Math.random fixado alto para não sortear doenças aleatórias neste bloco)
  const origRandom = Math.random;
  Math.random = () => 0.99;
  try {
    for (let m = 0; m < 4; m++) {
      const prevXp = player.artGraduations.jiujitsu.xp;
      const res = advanceMonth(player);
      player = res.updatedChar;
      assert.ok(
        player.artGraduations.jiujitsu.xp > prevXp,
        `Mês ${m + 1}: comparecimento automático deve conceder XP de treino`
      );
    }
  } finally {
    Math.random = origRandom;
  }

  const concluded = (player.classSessions || []).filter((s) => s.status === 'concluida').length;
  const leftoverAgendadaPast = (player.classSessions || []).filter(
    (s) => s.date.month < 5 && s.status === 'agendada'
  ).length;
  assert.ok(concluded >= 48, `4 meses de 3x/semana devem gerar >= 48 presenças automáticas (atual: ${concluded})`);
  assert.equal(leftoverAgendadaPast, 0, 'Nenhuma sessão de meses passados deve permanecer agendada');
  assert.ok(
    player.artGraduations.jiujitsu.stripes >= 1,
    `Com presença automática 3x/semana por 4 meses, deve conquistar ao menos o 1º Grau (atual: ${player.artGraduations.jiujitsu.stripes})`
  );
}

// ---------------------------------------------------------------------------
// 2. Aniversário na família com dinheiro vs SEM dinheiro ("família sem dinheiro não comemora aniversário de ninguém")
// ---------------------------------------------------------------------------
{
  // 2A. Com dinheiro: aniversário em dia de treino gera falta justificada no dia exato
  let pRich = createNewCharacter(
    'Bruno Lima',
    'Brunão',
    { day: 10, month: 10, year: 2003 },
    21,
    'jiujitsu',
    '🥋'
  );
  pRich.currentDate = { day: 1, month: 3, year: 2026 };
  pRich.currentMonth = 3;
  pRich.currentYear = 2026;
  pRich.money = 1200;
  for (const c of pRich.socialContacts || []) {
    c.birthDate = { day: 20, month: 11, year: c.birthDate.year };
  }

  const enr = enrollCharacterInTurma(pRich, bjjTurma);
  pRich = enr.updatedChar;
  const marchSessions = (pRich.classSessions || []).filter(
    (s) => s.date.month === 3 && s.status === 'agendada'
  );
  const firstTrainingDay = marchSessions[0].date.day;

  // Define aniversário da mãe exatamente no primeiro dia de treino de Março
  const mother = pRich.socialContacts!.find((c) => c.relationType === 'mae')!;
  mother.birthDate = { day: firstTrainingDay, month: 3, year: mother.birthDate.year };

  const bdayRich = collectMonthlyFamilyBirthdays(pRich, { day: 1, month: 3, year: 2026 });
  assert.equal(bdayRich.events.length, 1, 'Família com dinheiro deve celebrar o aniversário da mãe');
  const resolvedRich = resolveMonthlyTrainingAttendance(pRich, { day: 1, month: 3, year: 2026 }, bdayRich.events);
  assert.equal(resolvedRich.missedCount, 1, 'PJ deve faltar exatamente 1 treino no dia do aniversário da mãe');
  assert.equal(
    resolvedRich.attendedCount,
    marchSessions.length - 1,
    'PJ deve comparecer a todos os outros treinos do mês'
  );
  const missedSess = resolvedRich.updatedChar.classSessions!.find(
    (s) => s.date.month === 3 && s.date.day === firstTrainingDay
  )!;
  assert.equal(missedSess.status, 'falta');
  assert.ok(missedSess.notes?.includes('Aniversário'), `Nota da falta deve explicar aniversário (${missedSess.notes})`);

  // 2B. Família SEM dinheiro: NÃO comemora aniversário de ninguém (nem da mãe, nem do PJ!) e NÃO falta ao treino
  let pBroke = createNewCharacter(
    'Carlos Duarte',
    'Carlão',
    { day: firstTrainingDay, month: 3, year: 2003 },
    21,
    'jiujitsu',
    '🥋'
  );
  pBroke.currentDate = { day: 1, month: 3, year: 2026 };
  pBroke.currentMonth = 3;
  pBroke.currentYear = 2026;
  pBroke.money = 0; // Sem dinheiro!
  pBroke.job = 'desempregado';
  for (const c of pBroke.socialContacts || []) {
    c.wealthTier = 'humilde';
    c.birthDate = { day: firstTrainingDay, month: 3, year: c.birthDate.year };
  }
  pBroke = enrollCharacterInTurma(pBroke, bjjTurma).updatedChar;

  assert.equal(canFamilyAffordBirthday(pBroke, true).canAfford, false, 'Sem dinheiro não pode custear festa própria');
  assert.equal(canFamilyAffordBirthday(pBroke, false).canAfford, false, 'Sem dinheiro não pode custear festa de parente');

  const origRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const advBroke = advanceMonth(pBroke);
    assert.equal(advBroke.birthdayCelebrated, false, 'Aniversário próprio sem dinheiro NÃO deve ser comemorado');
    assert.ok(
      !advBroke.monthLog.some((l) => l.includes('🎂 FELIZ ANIVERSÁRIO')),
      'Não deve exibir log de festa de aniversário sem dinheiro'
    );
    assert.ok(
      advBroke.monthLog.some((l) => l.includes('sem dinheiro')),
      'Deve informar que não houve comemoração por falta de dinheiro'
    );
    const marchMissed = (advBroke.updatedChar.classSessions || []).filter(
      (s) => s.date.month === 3 && s.status === 'falta'
    ).length;
    const marchAttended = (advBroke.updatedChar.classSessions || []).filter(
      (s) => s.date.month === 3 && s.status === 'concluida'
    ).length;
    assert.equal(marchMissed, 0, 'Sem comemoração, PJ não falta aos treinos');
    assert.equal(marchAttended, marchSessions.length, 'PJ comparece a 100% dos treinos do mês');
  } finally {
    Math.random = origRandom;
  }
}

// ---------------------------------------------------------------------------
// 3. Doenças próprias e familiares: baixa probabilidade e ausência nos dias afetados
// ---------------------------------------------------------------------------
{
  const base = createNewCharacter('Thiago Rocha', 'Tigre', { day: 5, month: 6, year: 2003 }, 21, 'jiujitsu', '🥋');
  let seed = 123456;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  let pjSickMonths = 0;
  let famSickMonths = 0;
  const trials = 1000;
  for (let i = 0; i < trials; i++) {
    const sample = JSON.parse(JSON.stringify(base));
    const r = rollMonthlyIllnesses(sample, { day: 1, month: 4, year: 2026 }, rng);
    if (r.events.some((e) => e.reasonType === 'pj_doente')) pjSickMonths += 1;
    if (r.events.some((e) => e.reasonType === 'familia_doente')) famSickMonths += 1;
  }
  const pjRate = pjSickMonths / trials;
  const famRate = famSickMonths / trials;
  assert.ok(pjRate > 0.01 && pjRate < 0.07, `Chance mensal de PJ adoecer deve ser baixa (~3%), obtido ${(pjRate * 100).toFixed(1)}%`);
  assert.ok(famRate > 0.01 && famRate < 0.08, `Chance mensal de família adoecer deve ser baixa (~3.5%), obtido ${(famRate * 100).toFixed(1)}%`);
}

// ---------------------------------------------------------------------------
// 4. Casamentos e Batizados in-game na família coincidem com dia de treino -> PJ vai ao evento
// ---------------------------------------------------------------------------
{
  let char = createNewCharacter('Rafael Alves', 'Rafa', { day: 20, month: 10, year: 2003 }, 21, 'jiujitsu', '🥋');
  char.currentDate = { day: 1, month: 5, year: 2026 };
  char.currentMonth = 5;
  char.currentYear = 2026;
  char.money = 5000;

  // Prepara irmão com parceiro para casamento in-game
  const sibling = char.socialContacts!.find((c) => c.relationType === 'irmao')!;
  sibling.age = 24;
  sibling.birthDate = { day: 20, month: 12, year: 2002 };
  sibling.partnerName = 'Camila Ribeiro';
  sibling.partnerMarried = false;

  // Seed determinístico que força o casamento familiar no mês (segundo rng < 0.04)
  let calls = 0;
  const forceWeddingRng = () => {
    calls += 1;
    // Chamadas iniciais de saúde/rotina/casamento: retorna valor baixo na janela do casamento
    return 0.02;
  };
  const socialWed = processMonthlySocialWorld(char, forceWeddingRng, { day: 1, month: 5, year: 2026 });
  assert.ok(
    socialWed.familyEvents.some((e) => e.reasonType === 'casamento_familia'),
    'Irmão com parceira deve gerar evento real in-game de casamento na família'
  );

  // Testa também casamento próprio do PJ no dia exato de uma sessão agendada + batizado do filho nascido in-game
  char = enrollCharacterInTurma(char, bjjTurma).updatedChar;
  const firstTrain = (char.classSessions || []).find((s) => s.date.month === 5 && s.status === 'agendada')!;
  char.currentDate = { ...firstTrain.date };

  const f = WORLD_FIGHTERS.find((w) => w.gender === 'F' && w.age >= 20)!;
  char = addWorldFighterToSocialCircle(char, f.id).updatedChar;
  const partnerId = `wf_${f.id}`;
  for (let i = 0; i < 4; i++) {
    char.energy = 100;
    char = interactWithSocialContact(char, partnerId, 'sair').updatedChar;
  }
  char = startDatingContact(char, partnerId).updatedChar;
  char = interactWithSocialContact(char, partnerId, 'presentear').updatedChar;
  char = interactWithSocialContact(char, partnerId, 'presentear').updatedChar;
  char = marrySocialContact(char, partnerId, 'festa').updatedChar;

  const sessionOnWeddingDay = (char.classSessions || []).find((s) => s.id === firstTrain.id)!;
  assert.equal(sessionOnWeddingDay.status, 'falta', 'No dia do próprio casamento, PJ falta ao treino');
  assert.ok(sessionOnWeddingDay.notes?.includes('casamento'), 'Nota registra casamento próprio');

  // Nascimento do filho marca batizado pendente in-game e celebra batizado nos meses seguintes
  const babyRes = haveChildWithSpouse(char, 'Lucas Alves');
  assert.equal(babyRes.success, true);
  assert.equal(babyRes.child?.pendingBaptism, true, 'Recém-nascido deve agendar batizado in-game');
  char = babyRes.updatedChar;

  let baptizedEventDetected = false;
  for (let m = 0; m < 9; m++) {
    const sw = processMonthlySocialWorld(char, () => 0.1, { day: 1, month: ((5 + m) % 12) + 1, year: 2026 });
    char = sw.updatedChar;
    if (sw.familyEvents.some((e) => e.reasonType === 'batizado_familia')) {
      baptizedEventDetected = true;
      break;
    }
  }
  assert.equal(baptizedEventDetected, true, 'Batizado do filho deve acontecer em game nos meses seguintes');
}

console.log('✅ Todos os testes de comparecimento automático, doenças raras, eventos em família e orçamento passaram com sucesso!');
