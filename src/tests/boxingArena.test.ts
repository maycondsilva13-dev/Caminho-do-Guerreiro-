/**
 * CAMINHO DO GUERREIRO: DO TATAME AO OCTÓGONO
 * Bateria Automatizada de Testes — Arena Especializada de Boxe (Pugilismo)
 */

import {
  BOXING_STATES_CATALOG,
  BOXING_TECHNIQUE_LIST,
  BOXING_TECHNIQUES_CATALOG
} from '../data/boxingCatalogData';
import { BoxingCombatAthlete, BoxingDistance } from '../types/boxingCombat';
import {
  createInitialBoxingMatchState,
  executeBoxingCombatCycle,
  validateBoxingAction
} from '../utils/boxingFightEngine';
import {
  chooseBoxingAiAction,
  createBoxingAiProfile,
  createInitialBoxingMemory,
  updateBoxingMemoryFromCycle
} from '../utils/boxingAiEngine';
import { INITIAL_TOURNAMENTS } from '../data/tournamentsData';
import { createNewCharacter } from '../utils/characterHelper';
import {
  advanceCharacterToTournamentDate,
  homologateBoxingTournamentMatchResult,
  performTournamentWeighIn,
  persistInProgressBoxingMatchState,
  prepareBoxingTournamentMatchSession,
  registerCharacterInTournament
} from '../utils/tournamentFlow';
import { appendSavedFightLog, buildBoxingSavedFightLog } from '../utils/fightLogHelper';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function makeTestBoxer(
  id: 'boxer_a' | 'boxer_b',
  name: string,
  power = 65,
  durability = 60,
  defense = 60
): BoxingCombatAthlete {
  return {
    id,
    name,
    nickname: 'Teste',
    avatar: '🥊',
    isPlayer: id === 'boxer_a',
    weightKg: 66,
    heightCm: 175,
    stance: 'orthodox',
    gloveColor: id === 'boxer_a' ? '#2563eb' : '#dc2626',
    trunksColor: id === 'boxer_a' ? '#1d4ed8' : '#b91c1c',
    headgearColor: id === 'boxer_a' ? '#1d4ed8' : '#dc2626',
    rankTitle: 'Competidor Estadual',
    beltIndex: 4,
    attributes: {
      punchPower: power,
      punchSpeed: 64,
      defense,
      footwork: 62,
      stamina: 65,
      durability,
      technique: 64,
      mentalFocus: 64
    },
    chinHealth: 100,
    maxChinHealth: 100,
    bodyHealth: 100,
    maxBodyHealth: 100,
    guardHealth: 100,
    energy: 100,
    accumulatedFatigue: 0,
    cutLevel: 0,
    knockdownsThisRound: 0,
    totalKnockdowns: 0,
    isGroggy: false,
    stats: {
      punchesThrown: 0,
      punchesLanded: 0,
      powerLanded: 0,
      bodyLanded: 0,
      countersLanded: 0,
      dodges: 0
    }
  };
}

console.log('\n🥊 INICIANDO TESTES DA ARENA DE BOXE...\n');

// 1. Integridade do catálogo de estados e técnicas
assert(
  Object.keys(BOXING_STATES_CATALOG).length === 6,
  'Catálogo possui todos os 6 estados táticos de ringue'
);
assert(
  BOXING_TECHNIQUE_LIST.length >= 25,
  `Catálogo possui técnicas variadas (${BOXING_TECHNIQUE_LIST.length})`
);
const distances: BoxingDistance[] = ['longa', 'media', 'curta', 'clinch', 'cordas'];
for (const d of distances) {
  const count = BOXING_TECHNIQUE_LIST.filter((t) => t.allowedDistances.includes(d)).length;
  assert(count >= 2, `Distância "${d}" tem opções válidas (${count} técnicas)`);
}

// 2. Determinismo absoluto com mesma semente
const s1 = createInitialBoxingMatchState({
  matchType: 'sparring',
  rulesMode: 'profissional',
  totalRounds: 3,
  roundDurationSeconds: 90,
  boxerA: makeTestBoxer('boxer_a', 'Carlos'),
  boxerB: makeTestBoxer('boxer_b', 'Rival'),
  rngSeed: 424242
});
const s2 = createInitialBoxingMatchState({
  matchType: 'sparring',
  rulesMode: 'profissional',
  totalRounds: 3,
  roundDurationSeconds: 90,
  boxerA: makeTestBoxer('boxer_a', 'Carlos'),
  boxerB: makeTestBoxer('boxer_b', 'Rival'),
  rngSeed: 424242
});

const r1 = executeBoxingCombatCycle(
  executeBoxingCombatCycle(s1, { boxerId: 'boxer_a', techniqueId: 'box_combo_um_dois' }, { boxerId: 'boxer_b', techniqueId: 'box_jab_medidor' }),
  { boxerId: 'boxer_a', techniqueId: 'box_cruzado_queixo' },
  { boxerId: 'boxer_b', techniqueId: 'box_direto_encontro' }
);
const r2 = executeBoxingCombatCycle(
  executeBoxingCombatCycle(s2, { boxerId: 'boxer_a', techniqueId: 'box_combo_um_dois' }, { boxerId: 'boxer_b', techniqueId: 'box_jab_medidor' }),
  { boxerId: 'boxer_a', techniqueId: 'box_cruzado_queixo' },
  { boxerId: 'boxer_b', techniqueId: 'box_direto_encontro' }
);

assert(
  r1.boxerA.chinHealth === r2.boxerA.chinHealth &&
    r1.boxerB.chinHealth === r2.boxerB.chinHealth &&
    r1.currentRoundDominanceA === r2.currentRoundDominanceA,
  'Motor determinístico produz resultados idênticos com mesma seed'
);

// 3. Guarda Alta & Recuperação de Fôlego sempre válida e regenera energia/guarda
let tiredState = createInitialBoxingMatchState({
  matchType: 'sparring',
  rulesMode: 'amador',
  totalRounds: 3,
  roundDurationSeconds: 90,
  boxerA: { ...makeTestBoxer('boxer_a', 'Cansado'), energy: 3, guardHealth: 30 },
  boxerB: makeTestBoxer('boxer_b', 'Rival'),
  rngSeed: 99
});
assert(
  validateBoxingAction(tiredState, { boxerId: 'boxer_a', techniqueId: null }).isValid,
  'Ação null (Guarda Alta & Recuperar Fôlego) é sempre válida mesmo com 3% de gás'
);
assert(
  !validateBoxingAction(tiredState, { boxerId: 'boxer_a', techniqueId: 'box_combo_um_dois' }).isValid,
  'Bloqueia técnica quando fôlego é insuficiente'
);
tiredState = executeBoxingCombatCycle(
  tiredState,
  { boxerId: 'boxer_a', techniqueId: null },
  { boxerId: 'boxer_b', techniqueId: 'box_jab_medidor' }
);
assert(tiredState.boxerA.energy > 3 && tiredState.boxerA.guardHealth > 30, 'Recuperar fôlego regenera energia e guarda');

// 4. Quebra automática do Clinch pelo árbitro (nunca prende o jogador)
let clinchState = createInitialBoxingMatchState({
  matchType: 'sparring',
  rulesMode: 'profissional',
  totalRounds: 3,
  roundDurationSeconds: 180,
  boxerA: makeTestBoxer('boxer_a', 'A'),
  boxerB: makeTestBoxer('boxer_b', 'B'),
  rngSeed: 777
});
clinchState.currentDistance = 'media';
clinchState = executeBoxingCombatCycle(
  clinchState,
  { boxerId: 'boxer_a', techniqueId: 'box_amarrar_clinch' },
  { boxerId: 'boxer_b', techniqueId: 'box_amarrar_clinch' }
);
assert(clinchState.currentDistance === 'clinch', 'Primeiro clinch trava distância em clinch');
clinchState = executeBoxingCombatCycle(
  clinchState,
  { boxerId: 'boxer_a', techniqueId: 'box_amarrar_clinch' },
  { boxerId: 'boxer_b', techniqueId: 'box_amarrar_clinch' }
);
assert(
  clinchState.currentDistance === 'media',
  'Segundo ciclo consecutivo no clinch aciona separação automática do árbitro ("Break!")'
);

// 5. Simulação completa de luta 3 rounds até decisão dos 3 juízes (10-Point Must)
let fullBout = createInitialBoxingMatchState({
  matchType: 'competicao',
  rulesMode: 'amador',
  totalRounds: 3,
  roundDurationSeconds: 60,
  boxerA: makeTestBoxer('boxer_a', 'Boxeador Técnico', 68, 88, 82),
  boxerB: makeTestBoxer('boxer_b', 'Oponente Sólido', 52, 88, 55),
  rngSeed: 12345
});
let memA = createInitialBoxingMemory();
let memB = createInitialBoxingMemory();
const profA = createBoxingAiProfile('boxer_tecnico', 'estrategico');
const profB = createBoxingAiProfile('completo', 'paciente');
let safety = 0;
while (!fullBout.isMatchOver && safety < 80) {
  const decA = chooseBoxingAiAction(fullBout, fullBout.boxerA, fullBout.boxerB, profA, memA);
  const decB = chooseBoxingAiAction(fullBout, fullBout.boxerB, fullBout.boxerA, profB, memB);
  fullBout = executeBoxingCombatCycle(fullBout, decA.action, decB.action);
  const last = fullBout.history[fullBout.history.length - 1];
  memA = updateBoxingMemoryFromCycle(memA, last, 'boxer_a');
  memB = updateBoxingMemoryFromCycle(memB, last, 'boxer_b');
  safety++;
}
assert(fullBout.isMatchOver, `Luta de 3 rounds encerrou normalmente em ${safety} trocas`);
assert(
  fullBout.winMethod !== null && (fullBout.roundScores.length === 3 || fullBout.winMethod === 'KO' || fullBout.winMethod === 'TKO'),
  `Método de vitória homologado: ${fullBout.winMethod} (${fullBout.roundScores.length} rounds pontuados)`
);

// 6. KO / TKO quando um pegador massivo acerta queixo frágil no Profissional
let koBout = createInitialBoxingMatchState({
  matchType: 'competicao',
  rulesMode: 'profissional',
  totalRounds: 6,
  roundDurationSeconds: 180,
  boxerA: makeTestBoxer('boxer_a', 'Pegador Letal', 99, 90, 85),
  boxerB: { ...makeTestBoxer('boxer_b', 'Queixo Frágil', 45, 25, 30), chinHealth: 28, guardHealth: 10 },
  rngSeed: 5551
});
koBout.currentDistance = 'curta';
let koLoop = 0;
while (!koBout.isMatchOver && koLoop < 25) {
  koBout = executeBoxingCombatCycle(
    koBout,
    { boxerId: 'boxer_a', techniqueId: 'box_combo_chuva_cordas' },
    { boxerId: 'boxer_b', techniqueId: 'box_jab_medidor' }
  );
  koLoop++;
}
assert(
  koBout.isMatchOver && koBout.winner === 'boxer_a' && (koBout.winMethod === 'KO' || koBout.winMethod === 'TKO'),
  `Pegador finaliza rival frágil por ${koBout.winMethod} em ${koLoop} trocas`
);

// 7. Integração Completa com Torneio de Boxe (Inscrição -> Pesagem -> Chave -> Persistência Mid-Match -> Homologação Idempotente -> Fight Log)
const boxingTournament = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_copa_bairro_boxe')!;
assert(Boolean(boxingTournament) && boxingTournament.rulesType === 'boxing_10must', 'Torneio Copa Luvas da Baixada localizado');

let char = createNewCharacter(
  'Heitor',
  'Mão de Pedra',
  { day: 10, month: 3, year: 2005 },
  21,
  'boxe',
  '🥊',
  'SP',
  'São Paulo',
  'M'
);
char.weight = 65;
char.targetWeight = 66;
char.weightClass = 'Pena (até 66kg)';
char.money = 1000;
char.currentDate = { day: 5, month: 1, year: char.currentDate.year };
char.currentMonth = 1;
char.currentYear = char.currentDate.year;

const reg = registerCharacterInTournament(char, boxingTournament);
assert(reg.success, `Inscrição no torneio de boxe aprovada: ${reg.message}`);
char = reg.updatedChar;

const advWeigh = advanceCharacterToTournamentDate(char, boxingTournament, 'weigh_in');
assert(advWeigh.success, `Avanço para pesagem do boxe: ${advWeigh.message}`);
char = advWeigh.updatedChar;

const weigh = performTournamentWeighIn(char, boxingTournament);
assert(weigh.passed, `Pesagem oficial do boxe aprovada: ${weigh.message}`);
char = weigh.updatedChar;

const advFight = advanceCharacterToTournamentDate(char, boxingTournament, 'fight');
assert(advFight.success, `Avanço para dia da luta de boxe: ${advFight.message}`);
char = advFight.updatedChar;

const prep = prepareBoxingTournamentMatchSession(char, boxingTournament);
assert(prep.success && Boolean(prep.session) && Boolean(prep.opponentAthlete), `Sessão da Arena de Boxe preparada: ${prep.message}`);
char = prep.updatedChar;

// Simula luta em andamento e persistência para retomada
let liveMatch = createInitialBoxingMatchState({
  matchId: prep.session!.matchId,
  matchType: 'competicao',
  rulesMode: prep.rulesMode || 'amador',
  totalRounds: prep.totalRounds || 3,
  roundDurationSeconds: prep.roundDurationSeconds || 90,
  boxerA: makeTestBoxer('boxer_a', char.name, 85, 85, 80),
  boxerB: prep.opponentAthlete!,
  rngSeed: 8888
});
liveMatch = executeBoxingCombatCycle(
  liveMatch,
  { boxerId: 'boxer_a', techniqueId: 'box_combo_um_dois' },
  { boxerId: 'boxer_b', techniqueId: 'box_jab_medidor' }
);
char = persistInProgressBoxingMatchState(char, boxingTournament.id, prep.session!.year, liveMatch);

const resumed = prepareBoxingTournamentMatchSession(char, boxingTournament);
assert(
  resumed.success && resumed.resumedFromInProgress === true && resumed.initialMatchState?.history.length === 1,
  'Retomada segura de luta de boxe em andamento preserva histórico exato de trocas'
);

// Conclui semifinal e homologa 2x para testar idempotência
liveMatch.isMatchOver = true;
liveMatch.winner = 'boxer_a';
liveMatch.winMethod = 'KO';
liveMatch.finishDetails = 'Nocaute no 1º round!';

const homo1 = homologateBoxingTournamentMatchResult(char, {
  tournament: boxingTournament,
  year: prep.session!.year,
  stage: prep.session!.stage,
  stageName: prep.session!.stageName,
  matchId: prep.session!.matchId,
  opponentSlot: prep.session!.opponentSlot,
  winner: 'player',
  state: liveMatch
});
assert(!homo1.alreadyHomologated && homo1.updatedChar.record.wins === 1 && homo1.updatedChar.record.kos === 1, 'Homologação de vitória no boxe credita 1 vitória e 1 KO');

const homo2 = homologateBoxingTournamentMatchResult(homo1.updatedChar, {
  tournament: boxingTournament,
  year: prep.session!.year,
  stage: prep.session!.stage,
  stageName: prep.session!.stageName,
  matchId: prep.session!.matchId,
  opponentSlot: prep.session!.opponentSlot,
  winner: 'player',
  state: liveMatch
});
assert(
  homo2.alreadyHomologated && homo2.updatedChar.record.wins === 1,
  'Barreira idempotente impede duplicação de vitória/KO no boxe'
);

// Fight Log persistence
const loggedChar = appendSavedFightLog(
  homo1.updatedChar,
  buildBoxingSavedFightLog(liveMatch, homo1.updatedChar.currentDate, {
    id: `box_${prep.session!.matchId}_${prep.session!.year}`,
    tournamentName: boxingTournament.name,
    stageName: prep.session!.stageName
  })
);
assert(
  loggedChar.recentFightLogs?.length === 1 && loggedChar.recentFightLogs[0].arena === 'boxe',
  'buildBoxingSavedFightLog grava log oficial com arena === "boxe"'
);

console.log(`\n📊 RESULTADO FINAL BOXE: ${passed} passaram / ${failed} falharam.\n`);
if (failed > 0) {
  process.exit(1);
}
