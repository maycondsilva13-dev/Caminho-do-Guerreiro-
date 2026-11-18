/**
 * TESTES FUNCIONAIS DE INTEGRAÇÃO — FASE 5.1
 * Correção e Consolidação do Circuito de Campeonatos de Jiu-Jitsu
 *
 * Cobre 20 cenários reais exercitando diretamente as funções de domínio:
 * 1. Idade real (nascimento + data atual + ano bissexto) na elegibilidade (sem confiar em character.age)
 * 2. Bloqueio de inscrição por faixa/graduação incompatível
 * 3. Bloqueio de inscrição e pesagem por peso real fora da categoria (sem mutação artificial)
 * 4. Bloqueio de inscrição por indisponibilidade médica/física na data do evento
 * 5. Cronologia: bloqueio de inscrição antes da abertura ou após prazo limite
 * 6. Cronologia: bloqueio de pesagem antes da data programada e após encerramento
 * 7. Cronologia: bloqueio de combate antes da data oficial e após expiração + avanço de marco seguro
 * 8. Configuração persistente Gi: arena e resultado vinculados com isGi: true
 * 9. Configuração persistente No-Gi: arena sem quimono, validação de golpes Gi bloqueados no motor e resultado isGi: false
 * 10. Padrão documentado para torneio legado sem campo isGi e bloqueio de troca em competição oficial
 * 11. Correção de empate em resolvePlayerBracketMatch (vantagens pró-jogador avançam o jogador)
 * 12. Desempate em torneio sem critério cadastrado (regra interna explícita) e empate sem desempate (applyTiebreaker: false)
 * 13. Confrontos IA vs IA em empates aplicam e registram critério de desempate
 * 14. Proteção persistente contra duplicidade por matchId (cartel, finanças, fama, troféu e cartel do NPC)
 * 15. Integridade anti-duplicidade após compactação, serialização e recarregamento de save
 * 16. Persistência e retomada de combate em andamento após sair/salvar/recarregar
 * 17. Fallback controlado quando matchState salvo está corrompido (preserva adversário e matchId sem resultado fictício)
 * 18. Integridade da chave (4 e 8 atletas), não re-sorteio de participantes e bloqueio de avanço prematuro
 * 19. Migração segura de saves antigos V2/V3 com inicialização dos novos campos
 * 20. Isolamento completo de Sparring Livre e preservação do motor legado (fightEngine.ts)
 */

import { Character, Tournament } from '../types/game';
import { INITIAL_TOURNAMENTS } from '../data/tournamentsData';
import {
  buildCompactCharacterForStorage,
  createNewCharacter,
  migrateCharacterData
} from '../utils/characterHelper';
import { calculateAge } from '../utils/dateUtils';
import {
  getRealAthleteAge,
  getTournamentTimelineInfo,
  resolveTournamentIsGi,
  validateTournamentEligibility
} from '../utils/tournamentTimeline';
import {
  advanceCharacterToTournamentDate,
  getActiveBjjTournamentSession,
  homologateBjjTournamentMatchResult,
  performTournamentWeighIn,
  persistInProgressBjjMatchState,
  prepareBjjTournamentMatchSession,
  registerCharacterInTournament
} from '../utils/tournamentFlow';
import {
  ensureTournamentBracket,
  resolvePlayerBracketMatch,
  simulateAiBracketMatch
} from '../utils/tournamentBracket';
import {
  createInitialBjjMatchState,
  executeBjjCombatCycle,
  validateDeclaredAction
} from '../utils/bjjFightEngine';
import { chooseBjjAiAction, createBjjAiProfile, createInitialTacticalMemory } from '../utils/bjjAiEngine';
import { generateOpponentBjjRepertoire, getOrInitializePlayerBjjRepertoire } from '../utils/bjjRepertoireHelper';
import { createInitialCombatState } from '../utils/fightEngine';

console.log('================================================================');
console.log('TESTES FUNCIONAIS — FASE 5.1: CIRCUITO DE CAMPEONATOS BJJ');
console.log('================================================================\n');

let passedTests = 0;
const totalTests = 20;

function assert(condition: boolean, testNum: number, testName: string, details?: string) {
  if (condition) {
    passedTests++;
    console.log(`[PASS] Teste ${testNum}: ${testName}`);
  } else {
    console.error(`[FAIL] Teste ${testNum}: ${testName}`);
    if (details) console.error(`       Detalhes: ${details}`);
    process.exit(1);
  }
}

const bjjGi4 = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_copa_interna_bjj')!;
const bjjGi8 = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_brasileiro_ibjjf')!;
const bjjNoGi4 = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_brasileiro_nogi_cbjj')!;

function createBaseBjjCharacter(overrides?: {
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number;
  startAge?: 8 | 13 | 21;
  rankIndex?: number;
  weight?: number;
  money?: number;
}): Character {
  const birthDate = {
    day: overrides?.birthDay ?? 15,
    month: overrides?.birthMonth ?? 1,
    year: overrides?.birthYear ?? 2004
  };
  const startAge: 8 | 13 | 21 = overrides?.startAge ?? 21;
  const char = createNewCharacter(
    'Lucas Guerreiro',
    'Tubarão',
    birthDate,
    startAge,
    'jiujitsu',
    '🥋',
    'SP',
    'São Paulo'
  );
  char.weight = overrides?.weight ?? 68;
  char.targetWeight = 70;
  char.weightClass = 'Leve (até 70kg)';
  char.money = overrides?.money ?? 1500;
  if (overrides?.rankIndex !== undefined) {
    char.artGraduations.jiujitsu.rankIndex = overrides.rankIndex;
    char.artGraduations.jiujitsu.name =
      overrides.rankIndex >= 5 ? 'Faixa Azul (Graduado Adulto)' : 'Faixa Branca (Iniciação)';
  }
  return char;
}

// -------------------------------------------------------------------------
// TESTE 1: Idade real (nascimento + data atual + ano bissexto) na elegibilidade
// -------------------------------------------------------------------------
{
  // Nascido em 29/02/2008 (ano bissexto). Em 27/02/2026 ainda tem 17 anos; em 28/02/2026 (não bissexto) faz 18!
  const leapChar = createBaseBjjCharacter({ birthDay: 29, birthMonth: 2, birthYear: 2008, startAge: 13 });
  leapChar.currentDate = { day: 27, month: 2, year: 2026 };
  leapChar.currentMonth = 2;
  leapChar.currentYear = 2026;
  // Simula campo character.age desatualizado propositalmente para provar que não é confiado
  leapChar.age = 25;

  const ageFeb27 = getRealAthleteAge(leapChar);
  const adultoOnlyTourn: Tournament = {
    ...bjjGi4,
    id: 'test_adulto_only',
    allowedAgeCategories: ['adulto'],
    minAge: 18
  };
  const blockedOnFeb27 = validateTournamentEligibility(leapChar, adultoOnlyTourn, 2026);

  leapChar.currentDate = { day: 28, month: 2, year: 2026 };
  const ageFeb28 = calculateAge(leapChar.birthDate, leapChar.currentDate);
  const allowedOnFeb28 = validateTournamentEligibility(leapChar, adultoOnlyTourn, 2026);

  assert(
    ageFeb27 === 17 &&
      blockedOnFeb27.eligible === false &&
      blockedOnFeb27.realAge === 17 &&
      ageFeb28 === 18 &&
      allowedOnFeb28.eligible === true,
    1,
    'Idade real calculada por nascimento + data (bissexto 29/02 -> 28/02) ignora character.age desatualizado',
    `age27=${ageFeb27}, elig27=${blockedOnFeb27.eligible}, age28=${ageFeb28}, elig28=${allowedOnFeb28.eligible}`
  );
}

// -------------------------------------------------------------------------
// TESTE 2: Bloqueio de inscrição por graduação incompatível
// -------------------------------------------------------------------------
{
  const whiteBeltChar = createBaseBjjCharacter({ rankIndex: 0 });
  const brMonth = bjjGi8.monthScheduled!;
  whiteBeltChar.currentDate = { day: 5, month: brMonth, year: whiteBeltChar.currentYear };
  whiteBeltChar.currentMonth = brMonth;

  const regAttempt = registerCharacterInTournament(whiteBeltChar, bjjGi8); // exige minRankIndex: 1
  assert(
    regAttempt.success === false &&
      regAttempt.message.toLowerCase().includes('graduação insuficiente') &&
      (regAttempt.updatedChar.tournamentHistory || []).length === 0,
    2,
    'Bloqueia inscrição quando a graduação atual de BJJ é inferior à exigida pelo campeonato'
  );
}

// -------------------------------------------------------------------------
// TESTE 3: Bloqueio por peso real fora da categoria (sem mutação artificial)
// -------------------------------------------------------------------------
{
  const heavyChar = createBaseBjjCharacter({ weight: 78.5 });
  const month = bjjGi4.monthScheduled!;
  heavyChar.currentDate = { day: 5, month, year: heavyChar.currentYear };
  heavyChar.currentMonth = month;

  const regBlocked = registerCharacterInTournament(heavyChar, bjjGi4); // Leve até 70kg (+0.6 tolerância)

  // Testa também peso abaixo do piso da categoria (ex: 55kg numa categoria Leve 64.1..70kg)
  const lightChar = createBaseBjjCharacter({ weight: 55.0 });
  lightChar.currentDate = { day: 5, month, year: lightChar.currentYear };
  lightChar.currentMonth = month;
  const regTooLight = registerCharacterInTournament(lightChar, bjjGi4);

  assert(
    regBlocked.success === false &&
      regBlocked.updatedChar.weight === 78.5 &&
      regTooLight.success === false &&
      regTooLight.updatedChar.weight === 55.0,
    3,
    'Bloqueia inscrição por peso acima do teto ou abaixo do piso sem alterar artificialmente character.weight'
  );
}

// -------------------------------------------------------------------------
// TESTE 4: Bloqueio por indisponibilidade na data do evento (lesão grave / energia)
// -------------------------------------------------------------------------
{
  const injuredChar = createBaseBjjCharacter({ weight: 68 });
  const month = bjjGi4.monthScheduled!;
  injuredChar.currentDate = { day: 5, month, year: injuredChar.currentYear };
  injuredChar.currentMonth = month;
  injuredChar.injuries = [{ id: 'inj_1', name: 'Luxação no Ombro', severity: 'grave', weeksRemaining: 4 }];

  const elig = validateTournamentEligibility(injuredChar, bjjGi4);
  const regBlocked = registerCharacterInTournament(injuredChar, bjjGi4);

  assert(
    elig.eligible === false &&
      elig.availableOnDate === false &&
      regBlocked.success === false &&
      regBlocked.message.toLowerCase().includes('lesão grave'),
    4,
    'Bloqueia inscrição e participação quando atleta está indisponível por lesão grave'
  );
}

// -------------------------------------------------------------------------
// TESTE 5: Cronologia — bloqueio de inscrição antes da abertura ou após prazo limite
// -------------------------------------------------------------------------
{
  const char = createBaseBjjCharacter();
  const customOpenTourn: Tournament = {
    ...bjjGi4,
    id: 'test_window',
    registrationOpenDay: 5,
    registrationDeadlineDay: 15,
    weighInDay: 20,
    dayScheduled: 21
  };
  const m = customOpenTourn.monthScheduled!;

  // Dia 3 (antes de dia 5): bloqueado
  char.currentDate = { day: 3, month: m, year: char.currentYear };
  const beforeOpen = registerCharacterInTournament(char, customOpenTourn);

  // Dia 17 (após prazo 15): bloqueado
  char.currentDate = { day: 17, month: m, year: char.currentYear };
  const afterDeadline = registerCharacterInTournament(char, customOpenTourn);

  // Dia 10 (dentro da janela): permitido
  char.currentDate = { day: 10, month: m, year: char.currentYear };
  const insideWindow = registerCharacterInTournament(char, customOpenTourn);

  assert(
    beforeOpen.success === false &&
      afterDeadline.success === false &&
      insideWindow.success === true,
    5,
    'Cronologia bloqueia inscrição antes da abertura e após o prazo limite, liberando apenas na janela oficial'
  );
}

// -------------------------------------------------------------------------
// TESTE 6: Cronologia — bloqueio de pesagem antecipada e após o prazo
// -------------------------------------------------------------------------
{
  const char = createBaseBjjCharacter();
  const m = bjjGi4.monthScheduled!;
  char.currentDate = { day: 10, month: m, year: char.currentYear };
  char.currentMonth = m;

  const reg = registerCharacterInTournament(char, bjjGi4);
  let activeChar = reg.updatedChar;

  // Tenta pesar no dia 10 (pesagem é dia 20) -> bloqueado!
  const earlyWeighIn = performTournamentWeighIn(activeChar, bjjGi4);

  // Tenta pesar no dia 21 (passou do dia 20) -> bloqueado e encerrada!
  const lateChar: Character = {
    ...activeChar,
    currentDate: { day: 21, month: m, year: activeChar.currentYear }
  };
  const lateWeighIn = performTournamentWeighIn(lateChar, bjjGi4);
  const lateTimeline = getTournamentTimelineInfo(bjjGi4, lateChar.currentDate, lateChar);

  // Avança corretamente ao dia 20 e pesa -> aprovado!
  const adv = advanceCharacterToTournamentDate(activeChar, bjjGi4, 'weigh_in');
  activeChar = adv.updatedChar;
  const okWeighIn = performTournamentWeighIn(activeChar, bjjGi4);

  assert(
    earlyWeighIn.success === false &&
      lateWeighIn.success === false &&
      lateTimeline.status === 'encerrada' &&
      adv.success === true &&
      okWeighIn.success === true &&
      okWeighIn.entry?.weighInPassed === true &&
      okWeighIn.entry?.categoryHomologated === true,
    6,
    'Pesagem oficial bloqueada antes da data programada e após encerramento; homologada exclusivamente no dia certo'
  );
}

// -------------------------------------------------------------------------
// TESTE 7: Cronologia — bloqueio de combate antes da data oficial e após expiração
// -------------------------------------------------------------------------
{
  const char = createBaseBjjCharacter();
  const m = bjjGi4.monthScheduled!;
  char.currentDate = { day: 10, month: m, year: char.currentYear };
  char.currentMonth = m;

  let c = registerCharacterInTournament(char, bjjGi4).updatedChar;
  c = advanceCharacterToTournamentDate(c, bjjGi4, 'weigh_in').updatedChar;
  c = performTournamentWeighIn(c, bjjGi4).updatedChar;

  // No dia 20 (pesagem), luta ainda é dia 21 -> bloqueado!
  const earlyFight = prepareBjjTournamentMatchSession(c, bjjGi4);

  // No dia 22 (após dia 21) -> expirado e bloqueado!
  const expiredChar: Character = { ...c, currentDate: { day: 22, month: m, year: c.currentYear } };
  const expiredFight = prepareBjjTournamentMatchSession(expiredChar, bjjGi4);
  const expiredTl = getTournamentTimelineInfo(bjjGi4, expiredChar.currentDate, expiredChar);

  // Avança ao dia 21 (dia oficial) -> liberado!
  const dateBeforeTimeline = { ...c.currentDate };
  getTournamentTimelineInfo(bjjGi4, c.currentDate, c); // Consulta nunca altera a data do jogo
  const unchangedByView = c.currentDate.day === dateBeforeTimeline.day && c.currentDate.month === dateBeforeTimeline.month;

  c = advanceCharacterToTournamentDate(c, bjjGi4, 'fight').updatedChar;
  const readyFight = prepareBjjTournamentMatchSession(c, bjjGi4);

  assert(
    earlyFight.success === false &&
      expiredFight.success === false &&
      expiredTl.status === 'encerrada' &&
      unchangedByView &&
      readyFight.success === true,
    7,
    'Combate bloqueado antes da data oficial e após expiração; consulta não altera data do jogo'
  );
}

// -------------------------------------------------------------------------
// TESTE 8: Configuração persistente Gi (isGi: true)
// -------------------------------------------------------------------------
{
  const char = createBaseBjjCharacter();
  const m = bjjGi4.monthScheduled!;
  char.currentDate = { day: 10, month: m, year: char.currentYear };
  let c = registerCharacterInTournament(char, bjjGi4).updatedChar;
  c = advanceCharacterToTournamentDate(c, bjjGi4, 'weigh_in').updatedChar;
  c = performTournamentWeighIn(c, bjjGi4).updatedChar;
  c = advanceCharacterToTournamentDate(c, bjjGi4, 'fight').updatedChar;

  const prep = prepareBjjTournamentMatchSession(c, bjjGi4);
  const arenaState = createInitialBjjMatchState(
    { name: c.name, attributes: c.attributes, repertoire: getOrInitializePlayerBjjRepertoire(c) },
    prep.opponentAthlete!,
    'stand_neutral',
    bjjGi4.roundDurationSeconds,
    111,
    prep.session!.isGi,
    prep.session!.ageCategory,
    'competicao',
    prep.session!.matchId
  );

  // Técnica válida em torneio Gi
  const collarDrag = validateDeclaredAction(arenaState, { athleteId: 'athlete_a', techniqueId: 'bjj_tech_pull_guard' });

  arenaState.status = 'tempo_esgotado';
  arenaState.winner = 'athlete_a';
  arenaState.winMethod = 'Pontos';
  arenaState.score = { pointsA: 4, pointsB: 0, advantagesA: 1, advantagesB: 0, penaltiesA: 0, penaltiesB: 0 };

  const hom = homologateBjjTournamentMatchResult(prep.updatedChar, {
    tournament: bjjGi4,
    year: prep.session!.year,
    stage: prep.session!.stage,
    stageName: prep.session!.stageName,
    matchId: prep.session!.matchId,
    opponentSlot: prep.session!.opponentSlot,
    winner: 'player',
    state: arenaState
  });

  const savedEntry = hom.updatedChar.tournamentHistory!.find((h) => h.tournamentId === bjjGi4.id)!;
  assert(
    prep.session!.isGi === true &&
      arenaState.isGi === true &&
      collarDrag.isValid === true &&
      savedEntry.isGi === true &&
      savedEntry.matchHistory![0].isGi === true,
    8,
    'Torneio cadastrado com Gi (isGi: true) injeta Gi na arena, libera técnicas de quimono e grava isGi: true no resultado',
    `isGi=${prep.session!.isGi}, collarDrag=${collarDrag.isValid} (${collarDrag.reason})`
  );
}

// -------------------------------------------------------------------------
// TESTE 9: Configuração persistente No-Gi (isGi: false) sem fallback para true
// -------------------------------------------------------------------------
{
  const char = createBaseBjjCharacter({ rankIndex: 5, weight: 68 });
  const m = bjjNoGi4.monthScheduled!;
  char.currentDate = { day: 10, month: m, year: char.currentYear };
  let c = registerCharacterInTournament(char, bjjNoGi4).updatedChar;
  c = advanceCharacterToTournamentDate(c, bjjNoGi4, 'weigh_in').updatedChar;
  c = performTournamentWeighIn(c, bjjNoGi4).updatedChar;
  c = advanceCharacterToTournamentDate(c, bjjNoGi4, 'fight').updatedChar;

  const prep = prepareBjjTournamentMatchSession(c, bjjNoGi4);
  const arenaState = createInitialBjjMatchState(
    { name: c.name, attributes: c.attributes, repertoire: getOrInitializePlayerBjjRepertoire(c) },
    prep.opponentAthlete!,
    'top_mount',
    bjjNoGi4.roundDurationSeconds,
    222,
    prep.session!.isGi,
    prep.session!.ageCategory,
    'competicao',
    prep.session!.matchId
  );
  // Seta posição/controle coerente para testar técnica exclusiva de Gi (gola cruzada) vs permitida em No-Gi
  arenaState.athleteTop = 'athlete_a';
  arenaState.athleteBottom = 'athlete_b';
  arenaState.controllingAthlete = 'athlete_a';
  arenaState.controlledAthlete = 'athlete_b';

  const giOnlyMove = validateDeclaredAction(arenaState, { athleteId: 'athlete_a', techniqueId: 'bjj_sub_cross_collar' });
  const noGiLegalMove = validateDeclaredAction(arenaState, { athleteId: 'athlete_a', techniqueId: 'bjj_sub_ezequiel' });

  arenaState.status = 'finalizada';
  arenaState.winner = 'athlete_a';
  arenaState.winMethod = 'Finalização';

  const hom = homologateBjjTournamentMatchResult(prep.updatedChar, {
    tournament: bjjNoGi4,
    year: prep.session!.year,
    stage: prep.session!.stage,
    stageName: prep.session!.stageName,
    matchId: prep.session!.matchId,
    opponentSlot: prep.session!.opponentSlot,
    winner: 'player',
    state: arenaState
  });

  const savedEntry = hom.updatedChar.tournamentHistory!.find((h) => h.tournamentId === bjjNoGi4.id)!;

  assert(
    bjjNoGi4.isGi === false &&
      prep.session!.isGi === false &&
      arenaState.isGi === false &&
      giOnlyMove.isValid === false &&
      noGiLegalMove.isValid === true &&
      savedEntry.isGi === false &&
      savedEntry.matchHistory![0].isGi === false,
    9,
    'Torneio No-Gi abre arena em Sem Quimono, bloqueia golpe exclusivo de quimono no motor e grava isGi: false',
    `sessionGi=${prep.session!.isGi}, giOnly=${giOnlyMove.isValid} (${giOnlyMove.reason}), noGi=${noGiLegalMove.isValid}`
  );
}

// -------------------------------------------------------------------------
// TESTE 10: Padrão documentado de Gi/No-Gi para torneios legados sem isGi explícito
// -------------------------------------------------------------------------
{
  const legacyBjjWithoutField: Tournament = { ...bjjGi4 };
  delete (legacyBjjWithoutField as any).isGi;

  const legacyLutaLivreWithoutField: Tournament = {
    ...bjjNoGi4,
    id: 'legacy_lle',
    art: 'lutalivre',
    rulesType: 'lutalivre_sub'
  };
  delete (legacyLutaLivreWithoutField as any).isGi;

  const bjjDefault = resolveTournamentIsGi(legacyBjjWithoutField);
  const lleDefault = resolveTournamentIsGi(legacyLutaLivreWithoutField);
  // Se entry já possui isGi persistido no histórico, prevalece sobre o objeto de torneio
  const entryOverrideFalse = resolveTournamentIsGi(bjjGi4, { isGi: false });

  assert(
    bjjDefault === true && lleDefault === false && entryOverrideFalse === false,
    10,
    'Padrão compatível resolve Gi para torneio BJJ legado sem campo e No-Gi para Luta Livre/MMA, respeitando entry.isGi'
  );
}

// -------------------------------------------------------------------------
// TESTE 11: Correção do bug de empate em resolvePlayerBracketMatch (vantagens pró-jogador)
// -------------------------------------------------------------------------
{
  const char = createBaseBjjCharacter();
  const { entry } = ensureTournamentBracket(char, bjjGi4, 2026);
  const bracket = entry.bracket!;

  // Empate 2x2 no placar, porém jogador possui 2 vantagens x 0 do adversário -> jogador DEVE vencer o desempate!
  const res = resolvePlayerBracketMatch(
    bracket,
    bjjGi4,
    'semifinal',
    'draw',
    'Empate no Tempo Regulamentar',
    '2x2 (2v x 0v)',
    {
      score: {
        pointsA: 2,
        pointsB: 2,
        advantagesA: 2,
        advantagesB: 0,
        penaltiesA: 0,
        penaltiesB: 0
      }
    }
  );

  const playerSf = res.updatedBracket.matches.find((m) => m.stage === 'semifinal' && m.matchNumber === 1)!;
  const finalMatch = res.updatedBracket.matches.find((m) => m.stage === 'final')!;

  assert(
    res.effectiveOutcome === 'player' &&
      res.tiebreakApplied === true &&
      playerSf.winnerId === 'player' &&
      res.nextStage === 'final' &&
      (finalMatch.fighterAId === 'player' || finalMatch.fighterBId === 'player'),
    11,
    'Empate com vantagens pró-jogador avança o jogador na chave (bug antigo que dava vitória ao adversário corrigido)',
    `effective=${res.effectiveOutcome}, winnerId=${playerSf.winnerId}, nextStage=${res.nextStage}`
  );
}

// -------------------------------------------------------------------------
// TESTE 12: Torneio sem critério cadastrado usa regra interna (não oficial) + empate sem desempate
// -------------------------------------------------------------------------
{
  const char = createBaseBjjCharacter();
  const tournNoCriterion: Tournament = { ...bjjGi4 };
  delete (tournNoCriterion as any).tiebreakRule;
  delete (tournNoCriterion as any).tiebreakRuleDescription;

  const { entry } = ensureTournamentBracket(char, tournNoCriterion, 2026);

  // 12A: Empate sem critério no torneio usa regra interna identificada (jamais rotulada como regra oficial)
  const resInternal = resolvePlayerBracketMatch(
    entry.bracket!,
    tournNoCriterion,
    'semifinal',
    'draw',
    'Empate',
    '0x0'
  );
  const sfInternal = resInternal.updatedBracket.matches.find((m) => m.stage === 'semifinal' && m.matchNumber === 1)!;

  // 12B: Quando applyTiebreaker: false, empate não registra vencedor nem avança ninguém
  const resNoTiebreak = resolvePlayerBracketMatch(
    entry.bracket!,
    tournNoCriterion,
    'semifinal',
    'draw',
    'Empate',
    '0x0',
    { applyTiebreaker: false }
  );
  const sfNoTb = resNoTiebreak.updatedBracket.matches.find((m) => m.stage === 'semifinal' && m.matchNumber === 1)!;
  const finalNoTb = resNoTiebreak.updatedBracket.matches.find((m) => m.stage === 'final')!;

  assert(
    resInternal.tiebreakApplied === true &&
      Boolean(sfInternal.tiebreakCriterion?.includes('Regra interna do jogo')) &&
      resNoTiebreak.effectiveOutcome === 'draw' &&
      resNoTiebreak.tiebreakApplied === false &&
      sfNoTb.winnerId === null &&
      sfNoTb.loserId === null &&
      resNoTiebreak.nextStage === undefined &&
      finalNoTb.status === 'pendente',
    12,
    'Torneio sem critério aplica regra interna identificada e applyTiebreaker: false não elege vencedor nem avança'
  );
}

// -------------------------------------------------------------------------
// TESTE 13: Confrontos IA vs IA em empates aplicam e registram desempate
// -------------------------------------------------------------------------
{
  const char = createBaseBjjCharacter();
  const { entry } = ensureTournamentBracket(char, bjjGi4, 2026);
  const bracket = entry.bracket!;

  // Força atributos idênticos entre os dois NPCs para testar determinismo e registro
  const sf2 = bracket.matches.find((m) => m.stage === 'semifinal' && m.matchNumber === 2)!;
  const fA = bracket.participants.find((p) => p.id === sf2.fighterAId)!;
  const fB = bracket.participants.find((p) => p.id === sf2.fighterBId)!;
  fB.attributes = { ...fA.attributes };
  fB.rankIndex = fA.rankIndex;

  // Encontra um matchId determinístico onde a margem simulada cai no empate técnico (< 0.8) ou desempate
  let tieObserved = false;
  for (let k = 0; k < 40; k++) {
    const sim = simulateAiBracketMatch(
      { ...sf2, matchId: `ai_tie_probe_${k}` },
      bracket.participants,
      bjjGi4
    );
    if (sim.tiebreakApplied && sim.tiebreakCriterion && sim.resultType === 'desempate' && sim.winnerId) {
      tieObserved = true;
      break;
    }
  }

  assert(
    tieObserved,
    13,
    'Confrontos IA vs IA em empates aplicam critério de desempate e registram tiebreakApplied/tiebreakCriterion na chave'
  );
}

// -------------------------------------------------------------------------
// TESTE 14: Proteção persistente contra duplicidade (cartel, dinheiro, fama, troféu e NPC)
// -------------------------------------------------------------------------
{
  const char = createBaseBjjCharacter({ money: 1000 });
  const m = bjjGi4.monthScheduled!;
  char.currentDate = { day: 10, month: m, year: char.currentYear };
  let c = registerCharacterInTournament(char, bjjGi4).updatedChar;
  c = advanceCharacterToTournamentDate(c, bjjGi4, 'weigh_in').updatedChar;
  c = performTournamentWeighIn(c, bjjGi4).updatedChar;
  c = advanceCharacterToTournamentDate(c, bjjGi4, 'fight').updatedChar;

  // Semifinal
  const prepSf = prepareBjjTournamentMatchSession(c, bjjGi4);
  c = prepSf.updatedChar;
  const stateSf = createInitialBjjMatchState(
    { name: c.name, attributes: c.attributes, repertoire: getOrInitializePlayerBjjRepertoire(c) },
    prepSf.opponentAthlete!,
    'stand_neutral',
    bjjGi4.roundDurationSeconds,
    10,
    true,
    'adulto',
    'competicao',
    prepSf.session!.matchId
  );
  stateSf.status = 'finalizada';
  stateSf.winner = 'athlete_a';
  stateSf.winMethod = 'Finalização';

  const homSf1 = homologateBjjTournamentMatchResult(c, {
    tournament: bjjGi4,
    year: prepSf.session!.year,
    stage: 'semifinal',
    stageName: 'Semifinal',
    matchId: prepSf.session!.matchId,
    opponentSlot: prepSf.session!.opponentSlot,
    winner: 'player',
    state: stateSf
  });
  c = homSf1.updatedChar;

  // Tenta homologar a mesma Semifinal novamente!
  const homSfDup = homologateBjjTournamentMatchResult(c, {
    tournament: bjjGi4,
    year: prepSf.session!.year,
    stage: 'semifinal',
    stageName: 'Semifinal',
    matchId: prepSf.session!.matchId,
    opponentSlot: prepSf.session!.opponentSlot,
    winner: 'player',
    state: stateSf
  });
  c = homSfDup.updatedChar;

  // Grande Final
  const prepFin = prepareBjjTournamentMatchSession(c, bjjGi4);
  c = prepFin.updatedChar;
  const stateFin = createInitialBjjMatchState(
    { name: c.name, attributes: c.attributes, repertoire: getOrInitializePlayerBjjRepertoire(c) },
    prepFin.opponentAthlete!,
    'stand_neutral',
    bjjGi4.roundDurationSeconds,
    20,
    true,
    'adulto',
    'competicao',
    prepFin.session!.matchId
  );
  stateFin.status = 'tempo_esgotado';
  stateFin.winner = 'athlete_a';
  stateFin.winMethod = 'Pontos';
  stateFin.score = { pointsA: 6, pointsB: 2, advantagesA: 1, advantagesB: 0, penaltiesA: 0, penaltiesB: 0 };

  const homFin1 = homologateBjjTournamentMatchResult(c, {
    tournament: bjjGi4,
    year: prepFin.session!.year,
    stage: 'final',
    stageName: 'Grande Final',
    matchId: prepFin.session!.matchId,
    opponentSlot: prepFin.session!.opponentSlot,
    winner: 'player',
    state: stateFin
  });
  c = homFin1.updatedChar;

  const snapshotMoneyAfterChamp = c.money;
  const snapshotFameAfterChamp = c.fame;
  const snapshotWinsAfterChamp = c.record.wins;
  const snapshotTrophies = c.trophies.length;
  const npcAfterFirst = c.rivals.find((r) => r.id === prepFin.session!.opponentSlot.id)?.record.losses;

  // Chamada duplicada na Grande Final
  const homFinDup = homologateBjjTournamentMatchResult(c, {
    tournament: bjjGi4,
    year: prepFin.session!.year,
    stage: 'final',
    stageName: 'Grande Final',
    matchId: prepFin.session!.matchId,
    opponentSlot: prepFin.session!.opponentSlot,
    winner: 'player',
    state: stateFin
  });

  const npcAfterDup = homFinDup.updatedChar.rivals.find((r) => r.id === prepFin.session!.opponentSlot.id)?.record.losses;

  assert(
    homSf1.alreadyHomologated === false &&
      homSfDup.alreadyHomologated === true &&
      homFin1.alreadyHomologated === false &&
      homFinDup.alreadyHomologated === true &&
      homFinDup.updatedChar.record.wins === snapshotWinsAfterChamp &&
      snapshotWinsAfterChamp === 2 &&
      homFinDup.updatedChar.money === snapshotMoneyAfterChamp &&
      homFinDup.updatedChar.fame === snapshotFameAfterChamp &&
      homFinDup.updatedChar.trophies.length === snapshotTrophies &&
      snapshotTrophies === 1 &&
      npcAfterDup === npcAfterFirst,
    14,
    'Barreira persistente por matchId bloqueia duplicidade em cartel, dinheiro, fama, troféu e cartel do NPC'
  );
}

// -------------------------------------------------------------------------
// TESTE 15: Proteção anti-duplicidade mantém integridade após salvar e recarregar
// -------------------------------------------------------------------------
{
  const char = createBaseBjjCharacter();
  const m = bjjGi4.monthScheduled!;
  char.currentDate = { day: 10, month: m, year: char.currentYear };
  let c = registerCharacterInTournament(char, bjjGi4).updatedChar;
  c = advanceCharacterToTournamentDate(c, bjjGi4, 'weigh_in').updatedChar;
  c = performTournamentWeighIn(c, bjjGi4).updatedChar;
  c = advanceCharacterToTournamentDate(c, bjjGi4, 'fight').updatedChar;

  const prep = prepareBjjTournamentMatchSession(c, bjjGi4);
  c = prep.updatedChar;
  const st = createInitialBjjMatchState(
    { name: c.name, attributes: c.attributes, repertoire: getOrInitializePlayerBjjRepertoire(c) },
    prep.opponentAthlete!,
    'stand_neutral',
    bjjGi4.roundDurationSeconds,
    30,
    true,
    'adulto',
    'competicao',
    prep.session!.matchId
  );
  st.status = 'finalizada';
  st.winner = 'athlete_a';
  st.winMethod = 'Finalização';

  c = homologateBjjTournamentMatchResult(c, {
    tournament: bjjGi4,
    year: prep.session!.year,
    stage: 'semifinal',
    stageName: 'Semifinal',
    matchId: prep.session!.matchId,
    opponentSlot: prep.session!.opponentSlot,
    winner: 'player',
    state: st
  }).updatedChar;

  // Simula salvamento JSON (com compactação) + recarregamento com migrateCharacterData
  const serialized = JSON.stringify(buildCompactCharacterForStorage(c, true));
  const reloaded = migrateCharacterData(JSON.parse(serialized));

  const dupAfterReload = homologateBjjTournamentMatchResult(reloaded, {
    tournament: bjjGi4,
    year: prep.session!.year,
    stage: 'semifinal',
    stageName: 'Semifinal',
    matchId: prep.session!.matchId,
    opponentSlot: prep.session!.opponentSlot,
    winner: 'player',
    state: st
  });

  assert(
    dupAfterReload.alreadyHomologated === true &&
      dupAfterReload.updatedChar.record.wins === 1 &&
      dupAfterReload.updatedChar.tournamentHistory![0].matchHistory!.length === 1,
    15,
    'Proteção anti-duplicidade continua ativa após compactação JSON e recarregamento de save'
  );
}

// -------------------------------------------------------------------------
// TESTE 16: Persistência e retomada de combate em andamento após sair/recarregar
// -------------------------------------------------------------------------
{
  const char = createBaseBjjCharacter({ rankIndex: 5 });
  const m = bjjNoGi4.monthScheduled!;
  char.currentDate = { day: 10, month: m, year: char.currentYear };
  let c = registerCharacterInTournament(char, bjjNoGi4).updatedChar;
  c = advanceCharacterToTournamentDate(c, bjjNoGi4, 'weigh_in').updatedChar;
  c = performTournamentWeighIn(c, bjjNoGi4).updatedChar;
  c = advanceCharacterToTournamentDate(c, bjjNoGi4, 'fight').updatedChar;

  const prep1 = prepareBjjTournamentMatchSession(c, bjjNoGi4);
  c = prep1.updatedChar;
  const originalOppId = prep1.session!.opponentId;
  const originalMatchId = prep1.session!.matchId;

  let liveState = createInitialBjjMatchState(
    { name: c.name, attributes: c.attributes, repertoire: getOrInitializePlayerBjjRepertoire(c) },
    prep1.opponentAthlete!,
    'stand_neutral',
    bjjNoGi4.roundDurationSeconds,
    777,
    prep1.session!.isGi,
    prep1.session!.ageCategory,
    'competicao',
    originalMatchId
  );

  // Executa 2 ciclos reais com motor e IA
  const aiProfile = createBjjAiProfile(prep1.aiStyle || 'completo', 'estrategico');
  const mem = createInitialTacticalMemory(10);
  for (let i = 0; i < 2; i++) {
    const aiDec = chooseBjjAiAction(liveState, liveState.athleteB, liveState.athleteA, aiProfile, mem);
    liveState = executeBjjCombatCycle(liveState, { athleteId: 'athlete_a', techniqueId: null }, aiDec.action);
  }
  liveState.score.pointsA = 3; // Marca placar distinto para confirmar restauração

  // Persiste estado em andamento, compacta, salva e recarrega
  c = persistInProgressBjjMatchState(c, bjjNoGi4.id, prep1.session!.year, liveState);
  const reloaded = migrateCharacterData(JSON.parse(JSON.stringify(buildCompactCharacterForStorage(c, true))));

  const activeSession = getActiveBjjTournamentSession(reloaded, INITIAL_TOURNAMENTS);
  const resumed = prepareBjjTournamentMatchSession(reloaded, bjjNoGi4);

  assert(
    Boolean(activeSession) &&
      activeSession!.session.status === 'em_andamento' &&
      resumed.success === true &&
      resumed.resumedFromInProgress === true &&
      resumed.session!.matchId === originalMatchId &&
      resumed.session!.opponentId === originalOppId &&
      resumed.session!.isGi === false &&
      resumed.initialMatchState!.score.pointsA === 3 &&
      resumed.initialMatchState!.history.length === 2,
    16,
    'Combate em andamento é salvo na chave, sobrevive a compactação/recarga e retoma exatamente placar, ciclos, oponente e No-Gi'
  );
}

// -------------------------------------------------------------------------
// TESTE 17: Fallback controlado quando matchState em andamento está corrompido
// -------------------------------------------------------------------------
{
  const char = createBaseBjjCharacter();
  const m = bjjGi4.monthScheduled!;
  char.currentDate = { day: 10, month: m, year: char.currentYear };
  let c = registerCharacterInTournament(char, bjjGi4).updatedChar;
  c = advanceCharacterToTournamentDate(c, bjjGi4, 'weigh_in').updatedChar;
  c = performTournamentWeighIn(c, bjjGi4).updatedChar;
  c = advanceCharacterToTournamentDate(c, bjjGi4, 'fight').updatedChar;

  const prep1 = prepareBjjTournamentMatchSession(c, bjjGi4);
  c = prep1.updatedChar;
  const expectedOppId = prep1.session!.opponentId;
  const expectedMatchId = prep1.session!.matchId;

  // Simula save corrompido: sessão em andamento porém matchState com matchId adulterado / score ausente
  const entry = c.tournamentHistory!.find((h) => h.tournamentId === bjjGi4.id)!;
  entry.activeMatchSession!.status = 'em_andamento';
  entry.activeMatchSession!.matchState = { matchId: 'corrupted_other_id' } as any;

  const recovered = prepareBjjTournamentMatchSession(c, bjjGi4);
  assert(
    recovered.success === true &&
      recovered.controlledResetApplied === true &&
      recovered.resumedFromInProgress === false &&
      recovered.initialMatchState === undefined &&
      recovered.session!.status === 'pendente' &&
      recovered.session!.matchId === expectedMatchId &&
      recovered.session!.opponentId === expectedOppId &&
      c.record.wins === 0 &&
      c.record.losses === 0,
    17,
    'Fallback controlado para matchState corrompido reinicia combate pendente contra o mesmo adversário sem fabricar resultado'
  );
}

// -------------------------------------------------------------------------
// TESTE 18: Integridade da chave (4 e 8 atletas), sem re-sorteio nem avanço prematuro
// -------------------------------------------------------------------------
{
  const char = createBaseBjjCharacter({ rankIndex: 5 });
  const m = bjjGi8.monthScheduled!;
  char.currentDate = { day: 10, month: m, year: char.currentYear };
  let c = registerCharacterInTournament(char, bjjGi8).updatedChar;

  const participantsAfterReg = c.tournamentHistory![0].bracket!.participants.map((p) => p.id);

  // Avança para pesagem e realiza pesagem -> chave NÃO pode ser re-sorteada
  c = advanceCharacterToTournamentDate(c, bjjGi8, 'weigh_in').updatedChar;
  c = performTournamentWeighIn(c, bjjGi8).updatedChar;
  c = ensureTournamentBracket(c, bjjGi8, c.currentYear).updatedChar;
  const participantsAfterWeighIn = c.tournamentHistory![0].bracket!.participants.map((p) => p.id);

  // Tenta preparar sessão pulando fase artificialmente para 'final' sem concluir 'quartas'/'semifinal'
  c = advanceCharacterToTournamentDate(c, bjjGi8, 'fight').updatedChar;
  c.tournamentHistory![0].currentStage = 'final';
  const blockedSkip = prepareBjjTournamentMatchSession(c, bjjGi8);

  const uniqueIds = new Set(participantsAfterWeighIn);
  assert(
    participantsAfterReg.length === 8 &&
      uniqueIds.size === 8 &&
      JSON.stringify(participantsAfterReg) === JSON.stringify(participantsAfterWeighIn) &&
      blockedSkip.success === false &&
      blockedSkip.message.includes('Semifinais'),
    18,
    'Chave de 8 atletas preserva exatamente os mesmos participantes e bloqueia salto prematuro para fase posterior'
  );
}

// -------------------------------------------------------------------------
// TESTE 19: Migração segura de saves antigos V2/V3 inicializando novos campos
// -------------------------------------------------------------------------
{
  const base = createBaseBjjCharacter();
  const legacyV2: any = JSON.parse(JSON.stringify(base));
  legacyV2.tournamentHistory = [
    {
      tournamentId: bjjGi4.id,
      year: 2025,
      month: 2,
      registered: true,
      weighInPassed: true,
      completed: true,
      result: 'vitoria',
      trophyEarned: bjjGi4.trophyName,
      currentStage: 'final',
      matchesWon: 2,
      matchHistory: [
        {
          matchId: `${bjjGi4.id}_sf1`,
          stage: 'Semifinal',
          opponentName: 'Rival Antigo',
          winner: 'player',
          method: 'Finalização',
          scoreSummary: '4x0'
        }
      ],
      bracket: {
        tournamentId: bjjGi4.id,
        year: 2025,
        bracketSize: 4,
        ageCategory: 'adulto',
        weightClass: 'Leve (até 70kg)',
        participants: [],
        matches: [
          {
            matchId: `${bjjGi4.id}_final`,
            stage: 'final',
            matchNumber: 1,
            fighterAId: 'player',
            fighterBId: 'opp_1',
            winnerId: 'player',
            status: 'concluida'
          }
        ]
      }
    }
  ];

  const migrated = migrateCharacterData(legacyV2);
  const migratedEntry = migrated.tournamentHistory![0];

  assert(
    migratedEntry.isGi === true &&
      migratedEntry.categoryHomologated === true &&
      migratedEntry.rewardsClaimed === true &&
      migratedEntry.homologatedMatchIds!.includes(`${bjjGi4.id}_sf1`) &&
      migratedEntry.homologatedMatchIds!.includes(`${bjjGi4.id}_final`) &&
      migratedEntry.bracket!.isGi === true &&
      Boolean(migratedEntry.bracket!.bracketId),
    19,
    'Migração de save antigo V2/V3 inicializa isGi, homologatedMatchIds, rewardsClaimed e bracketId com segurança'
  );
}

// -------------------------------------------------------------------------
// TESTE 20: Isolamento completo de Sparring Livre e preservação do motor legado
// -------------------------------------------------------------------------
{
  const char = createBaseBjjCharacter();
  const initialWins = char.record.wins;
  const initialMoney = char.money;

  const sparring = createInitialBjjMatchState(
    { name: char.name, attributes: char.attributes, repertoire: getOrInitializePlayerBjjRepertoire(char) },
    { name: 'Parceiro de Treino', attributes: char.attributes, repertoire: generateOpponentBjjRepertoire(0, false) },
    'stand_neutral',
    300,
    999,
    false,
    'adulto',
    'sparring'
  );

  const boxingTourn = INITIAL_TOURNAMENTS.find((t) => t.art === 'boxe')!;
  const legacyBoxing = createInitialCombatState(
    boxingTourn,
    {
      name: char.name,
      nickname: char.nickname,
      isPlayer: true,
      avatar: char.avatar,
      art: 'boxe',
      rankName: 'Amador',
      weight: char.weight,
      hp: 120,
      maxHp: 120,
      stamina: 110,
      maxStamina: 110,
      guard: 100,
      attributes: char.attributes,
      points: 0,
      penalties: 0,
      advantages: 0,
      roundsWon: 0,
      knockdowns: 0,
      cuts: 0
    },
    {
      name: 'Viktor Petrov',
      nickname: 'Trovão',
      isPlayer: false,
      avatar: '🥊',
      art: 'boxe',
      rankName: 'Amador',
      weight: 66,
      hp: 115,
      maxHp: 115,
      stamina: 105,
      maxStamina: 105,
      guard: 100,
      attributes: char.attributes,
      points: 0,
      penalties: 0,
      advantages: 0,
      roundsWon: 0,
      knockdowns: 0,
      cuts: 0
    },
    'Semifinal'
  );

  assert(
    sparring.matchType === 'sparring' &&
      sparring.isGi === false &&
      sparring.tournamentContext === undefined &&
      char.record.wins === initialWins &&
      char.money === initialMoney &&
      legacyBoxing.isActive === true &&
      legacyBoxing.tournament.rulesType === 'boxing_10must',
    20,
    'Sparring Livre permanece totalmente isolado da chave/cartel e motor legado (fightEngine.ts) permanece íntegro'
  );
}

console.log('\n================================================================');
console.log(`RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS COM SUCESSO!`);
console.log('================================================================\n');
