import assert from 'node:assert/strict';
import { MARTIAL_ARTS_META } from '../data/martialArtsData';
import { getMergedWorldFighters, WORLD_FIGHTERS } from '../data/worldFightersData';
import { INITIAL_TOURNAMENTS } from '../data/tournamentsData';
import {
  computeBjjStripesFromProgress,
  formatBjjBeltWithDegree,
  getBjjMaxStripes,
  getDisplayBeltForGrad
} from '../utils/bjjDegreeHelper';
import {
  advanceMonth,
  buildCompactCharacterForStorage,
  createNewCharacter
} from '../utils/characterHelper';
import { addTrainingGraduationXp, promoteGraduation } from '../utils/graduationHelper';
import { computeWorldRankings } from '../utils/rankingHelper';
import { buildTournamentBracket } from '../utils/tournamentBracket';
import { completeSessionAttendance } from '../types/agenda';
import {
  enrollSocialContactInAcademy,
  evaluateStudentGraduationReadiness,
  foundPlayerAcademy,
  getProfessorEligibility,
  getRegionalAcademyEconomics,
  interactWithAcademyStudent,
  processMonthlyPlayerAcademy,
  promoteStudentByProfessor,
  recruitAcademyStudent
} from '../utils/playerAcademyHelper';

console.log('🧪 Executando suite de testes: Graus Individuais do BJJ & Academia do Professor...');

// 1. Verificar que não há sufixos agrupados no catálogo BJJ ou lutadores do mundo
for (const rank of MARTIAL_ARTS_META.jiujitsu.ranks) {
  assert.ok(!rank.name.includes('0 a 4 Graus'), `Faixa não deve agrupar 0 a 4 Graus: ${rank.name}`);
  assert.ok(!rank.name.includes('1º ao 6º Grau'), `Faixa não deve agrupar 1º ao 6º Grau: ${rank.name}`);
}

const bjjWorld = WORLD_FIGHTERS.filter((f) => f.art === 'jiujitsu');
assert.ok(bjjWorld.length >= 10, 'Deve haver múltiplos atletas de BJJ no mundo');
for (const f of bjjWorld) {
  assert.ok(!f.belt.includes('0 a 4 Graus') && !f.belt.includes('1º ao 6º Grau'), `Atleta ${f.name} com grau agrupado: ${f.belt}`);
  assert.ok(typeof f.stripes === 'number', `Atleta ${f.name} deve possuir stripes numérico`);
  if ((f.rankIndex ?? 0) <= 8) {
    assert.ok(
      f.belt.includes('Sem Grau') || /\d+º Grau/.test(f.belt),
      `Atleta ${f.name} deve exibir seu grau exato na faixa: ${f.belt}`
    );
  }
}

assert.equal(getBjjMaxStripes(0), 4);
assert.equal(getBjjMaxStripes(8), 6);
assert.equal(getBjjMaxStripes(9), 0);
assert.equal(formatBjjBeltWithDegree(5, 'Faixa Azul (Graduado Adulto)', 0), 'Faixa Azul (Graduado Adulto) · Sem Grau');
assert.equal(formatBjjBeltWithDegree(5, 'Faixa Azul (Graduado Adulto)', 3), 'Faixa Azul (Graduado Adulto) · 3º Grau');
assert.equal(formatBjjBeltWithDegree(8, 'Faixa Preta (Professor / Black Belt)', 4), 'Faixa Preta (Professor / Black Belt) · 4º Grau');
assert.equal(computeBjjStripesFromProgress(5, 800, 1000, 18, 24), 3);
assert.equal(computeBjjStripesFromProgress(8, 0, 3400, 108), 3);

// 2. Evolução de graus do PJ no BJJ e exibição em rankings e chaves
let player = createNewCharacter(
  'Lucas Moura',
  'Moura',
  { day: 10, month: 3, year: 2003 },
  21,
  'jiujitsu',
  '🥋',
  'RJ',
  'Rio de Janeiro',
  'M'
);
assert.equal(getDisplayBeltForGrad('jiujitsu', player.artGraduations.jiujitsu), 'Faixa Branca (Iniciação) · Sem Grau');

// Simulação realista: treinando 3x/semana (~13 treinos/mês × 25 XP = ~325 XP/mês)
// Mês 1 (~325 XP): ainda Sem Grau (não pula graus em poucas semanas)
for (let i = 0; i < 13; i++) {
  player = addTrainingGraduationXp(player, 'jiujitsu', 25, 1.0).updatedChar;
}
player.artGraduations.jiujitsu.monthsInRank = 1;
assert.equal(
  computeBjjStripesFromProgress(
    0,
    player.artGraduations.jiujitsu.xp,
    player.artGraduations.jiujitsu.xpNeeded,
    1,
    24
  ),
  0,
  'Com apenas 1 mês (3x/semana) o aluno ainda deve estar Sem Grau'
);

// Mês 3..4 (~1.100 XP): aluno pega 1º Grau entre 3 e 4 meses
for (let m = 2; m <= 4; m++) {
  for (let i = 0; i < 13; i++) {
    player = addTrainingGraduationXp(player, 'jiujitsu', 25, 1.0).updatedChar;
  }
  player = advanceMonth(player).updatedChar;
}
assert.equal(player.artGraduations.jiujitsu.stripes, 1, 'Treinando 3x/semana deve pegar 1º Grau entre 3 e 4 meses');
assert.ok(/\d+º Grau/.test(getDisplayBeltForGrad('jiujitsu', player.artGraduations.jiujitsu)));

// Mês 7: aluno pega 2º Grau (~3-4 meses depois do 1º)
for (let m = 5; m <= 7; m++) {
  for (let i = 0; i < 13; i++) {
    player = addTrainingGraduationXp(player, 'jiujitsu', 25, 1.0).updatedChar;
  }
  player = advanceMonth(player).updatedChar;
}
assert.equal(player.artGraduations.jiujitsu.stripes, 2, 'Treinando 3x/semana deve pegar 2º Grau por volta do 6º-7º mês');

// Mês 10: aluno pega 3º Grau (~3-4 meses depois do 2º)
for (let m = 8; m <= 10; m++) {
  for (let i = 0; i < 13; i++) {
    player = addTrainingGraduationXp(player, 'jiujitsu', 25, 1.0).updatedChar;
  }
  player = advanceMonth(player).updatedChar;
}
assert.equal(player.artGraduations.jiujitsu.stripes, 3, 'Treinando 3x/semana deve pegar 3º Grau por volta do 9º-11º mês');

// Mês 13: aluno pega 4º Grau (~3-4 meses depois do 3º)
for (let m = 11; m <= 13; m++) {
  for (let i = 0; i < 13; i++) {
    player = addTrainingGraduationXp(player, 'jiujitsu', 25, 1.0).updatedChar;
  }
  player = advanceMonth(player).updatedChar;
}
assert.equal(player.artGraduations.jiujitsu.stripes, 4, 'Treinando 3x/semana deve completar o 4º Grau entre 12 e 15 meses');

// Verifica que completeSessionAttendance da Agenda Semanal também aplica o XP via addTrainingGraduationXp
player.energy = 100;
player.classSessions = [
  {
    id: 'test_sess_bjj_1',
    enrollmentId: 't1',
    classId: 't1',
    gymId: 'gym_bairro',
    gymName: 'Academia Local',
    art: 'jiujitsu',
    instructorName: 'Mestre Tião',
    title: 'Jiu-Jitsu Técnico',
    date: { ...player.currentDate },
    dayOfWeek: 'segunda',
    block: 'noite',
    pointsCost: 1,
    classType: 'regular',
    status: 'agendada',
    xpEarned: 0
  }
];
const attRes = completeSessionAttendance(player, 'test_sess_bjj_1');
assert.equal(attRes.success, true);
assert.ok(attRes.updatedChar.artGraduations.jiujitsu.xp <= attRes.updatedChar.artGraduations.jiujitsu.xpNeeded);

const bjjRanking = computeWorldRankings(player, { mode: 'art', art: 'jiujitsu' });
assert.ok(bjjRanking.entries.some((e) => e.isPlayer && /\d+º Grau/.test(e.belt)), 'Ranking BJJ deve exibir grau exato do atleta');

const bjjTourn = INITIAL_TOURNAMENTS.find((t) => t.art === 'jiujitsu')!;
const bracket = buildTournamentBracket(bjjTourn, player, player.currentYear);
for (const p of bracket.participants) {
  assert.ok(!p.belt.includes('0 a 4 Graus') && !p.belt.includes('1º ao 6º Grau'), `Chave não pode ter faixa agrupada: ${p.belt}`);
}

// 3. Elegibilidade de Professor e fundação da própria academia
const blockedElig = getProfessorEligibility(player, 'jiujitsu');
assert.equal(blockedElig.eligible, false, 'Faixa Branca não deve poder abrir academia como Professor');

// Simular evolução até Faixa Preta de BJJ (rankIndex 8)
player.age = 28;
player.birthDate.year = player.currentYear - 28;
player.attributes.technique = 70;
player.attributes.fightIq = 65;
player.artGraduations.jiujitsu.rankIndex = 7; // Marrom
player.artGraduations.jiujitsu.name = MARTIAL_ARTS_META.jiujitsu.ranks[7].name;
player.artGraduations.jiujitsu.xp = MARTIAL_ARTS_META.jiujitsu.ranks[7].xpNeeded;
player.artGraduations.jiujitsu.xpNeeded = MARTIAL_ARTS_META.jiujitsu.ranks[7].xpNeeded;
player.artGraduations.jiujitsu.monthsInRank = 36;
player.artGraduations.jiujitsu.stripes = 4;

const promoBlack = promoteGraduation(player, 'jiujitsu', { masterName: 'Mestre Carlos' });
assert.equal(promoBlack.success, true, 'Promoção para Faixa Preta deve ocorrer');
player = promoBlack.updatedChar;
assert.equal(player.artGraduations.jiujitsu.rankIndex, 8);
assert.equal(player.artGraduations.jiujitsu.stripes, 0, 'Ao subir de faixa, graus zeram para a nova faixa');
assert.equal(getDisplayBeltForGrad('jiujitsu', player.artGraduations.jiujitsu), 'Faixa Preta (Professor / Black Belt) · Sem Grau');

const blackElig = getProfessorEligibility(player, 'jiujitsu');
assert.equal(blackElig.eligible, true, 'Faixa Preta 19+ deve ser elegível a fundar academia de BJJ');

player.money = 5000;
const expectedRjFoundCost = getRegionalAcademyEconomics(player).foundCost;
const foundRes = foundPlayerAcademy(
  player,
  {
    name: 'Moura Jiu-Jitsu Team',
    art: 'jiujitsu',
    monthlyFeePerStudent: 200,
    setAsHomeGym: true
  },
  () => 0.35
);
assert.equal(foundRes.success, true, 'Fundação da academia deve ter sucesso');
player = foundRes.updatedChar;
assert.equal(player.money, 5000 - expectedRjFoundCost);
assert.ok(player.playerAcademy);
assert.equal(player.playerAcademy!.students.length, 3);
assert.equal(player.currentGymId, player.playerAcademy!.id);

// 4. Recrutamento, Matrícula Social, Interação e Graduação à Escolha do Professor
const recruitRes = recruitAcademyStudent(player, () => 0.5);
assert.equal(recruitRes.success, true);
player = recruitRes.updatedChar;
assert.equal(player.playerAcademy!.students.length, 4);

const eligibleContact = player.socialContacts!.find((c) => c.isAlive && c.age >= 7)!;
const enrollRes = enrollSocialContactInAcademy(player, eligibleContact.id);
assert.equal(enrollRes.success, true, 'Contato social elegível deve poder ser matriculado');
player = enrollRes.updatedChar;
const socialStu = player.playerAcademy!.students.find((s) => s.linkedContactId === eligibleContact.id)!;
assert.ok(socialStu, 'Aluno vinculado ao contato social deve constar na academia');

// Interação pedagógica com turma e aluno específico
const classRes = interactWithAcademyStudent(player, 'dar_aula_turma');
assert.equal(classRes.success, true);
player = classRes.updatedChar;

const privRes = interactWithAcademyStudent(player, 'aula_particular', socialStu.id);
assert.equal(privRes.success, true);
player = privRes.updatedChar;

// Sistema de graduação à escolha do professor: conceder grau e promover faixa
const updatedSocialStu = player.playerAcademy!.students.find((s) => s.id === socialStu.id)!;
const rankBefore = updatedSocialStu.rankIndex;
const stripesBefore = updatedSocialStu.stripes;

const stripeRes = promoteStudentByProfessor(player, socialStu.id, 'award_stripe', 'Evolução na guarda');
assert.equal(stripeRes.success, true);
player = stripeRes.updatedChar;
const afterStripeStu = player.playerAcademy!.students.find((s) => s.id === socialStu.id)!;
assert.equal(afterStripeStu.stripes, stripesBefore + 1);
assert.ok(afterStripeStu.belt.includes(`${stripesBefore + 1}º Grau`));

// Verificar sincronização com o contato social
const syncedContact = player.socialContacts!.find((c) => c.id === eligibleContact.id)!;
assert.equal(syncedContact.martialArtStripes, afterStripeStu.stripes);
assert.equal(syncedContact.martialArtBelt, afterStripeStu.belt);

// Promoção de faixa escolhida pelo Professor
const beltRes = promoteStudentByProfessor(player, socialStu.id, 'promote_belt', 'Mérito técnico');
assert.equal(beltRes.success, true);
player = beltRes.updatedChar;
const afterBeltStu = player.playerAcademy!.students.find((s) => s.id === socialStu.id)!;
assert.equal(afterBeltStu.rankIndex, rankBefore + 1);
assert.equal(afterBeltStu.stripes, 0);

// Avaliar prontidão e simular 1 mês da academia (via processMonthlyPlayerAcademy & advanceMonth)
const moneyBeforeMonth = player.money;
const monthRes = processMonthlyPlayerAcademy(player, () => 0.99);
player = monthRes.updatedChar;
assert.ok(player.playerAcademy!.lastMonthRevenue! > 0, 'Academia deve gerar receita de mensalidades');
assert.ok(player.money > moneyBeforeMonth, 'Lucro líquido com 5 alunos deve aumentar saldo do professor');

const readinessCheck = evaluateStudentGraduationReadiness(player.playerAcademy!.students[0]);
assert.ok(['Pronto (Recomendado)', 'Em Evolução', 'Graduado Máximo'].includes(readinessCheck.statusLabel));

const fullMonth = advanceMonth(player);
player = fullMonth.updatedChar;
assert.ok(fullMonth.monthLog.some((l) => l.includes('Moura Jiu-Jitsu Team')), 'Passagem de mês deve reportar balanço da academia do jogador');

const mergedWorld = getMergedWorldFighters(player);
assert.ok(mergedWorld.length >= WORLD_FIGHTERS.length);

const compact = buildCompactCharacterForStorage(player, true);
assert.ok(compact.playerAcademy);
assert.ok(JSON.stringify(compact).length < 500000);

console.log('✅ Todos os testes de Graus Individuais do BJJ e Academia do Professor passaram com sucesso!');
