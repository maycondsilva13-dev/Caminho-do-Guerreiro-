import {
  ActiveBjjTournamentMatchSession,
  ActiveBoxingTournamentMatchSession,
  BracketFighterSlot,
  Character,
  CharacterTournamentEntry,
  OfficialGiColor,
  RivalNPC,
  Tournament,
  TournamentDivisionSelection
} from '../types/game';
import { BjjCombatAthlete, BjjMatchState } from '../types/bjjCombatEngine';
import { BjjCombatStyle } from '../types/bjjAi';
import { BoxingAiStyle, BoxingCombatAthlete, BoxingMatchState, BoxingRulesMode } from '../types/boxingCombat';
import {
  resolveBjjCombatBeltRank,
  upsertRivalInCharacter,
  WORLD_FIGHTERS
} from '../data/worldFightersData';
import { calculateAge, MONTH_NAMES } from './dateUtils';
import { generateOpponentBjjRepertoire } from './bjjRepertoireHelper';
import {
  ensureTournamentBracket,
  getPlayerCurrentBracketMatch,
  resolvePlayerBracketMatch
} from './tournamentBracket';
import {
  getRealAthleteAge,
  getTournamentScheduleDates,
  getTournamentTimelineInfo,
  getTournamentYear,
  resolveTournamentIsGi,
  validateTournamentEligibility
} from './tournamentTimeline';
import { evaluateTournamentGeographyAndTravel } from './tournamentGeographyHelper';

export function resolveAiStyleFromSlot(oppSlot: BracketFighterSlot): BjjCombatStyle {
  const validStyles: BjjCombatStyle[] = [
    'guardeiro',
    'passador',
    'quedador',
    'finalizador',
    'defensivo',
    'pressionador',
    'completo'
  ];
  let rawStyle = oppSlot.fightingStyle || '';
  if (rawStyle === 'quedas') rawStyle = 'quedador';
  if (rawStyle === 'equilibrado') rawStyle = 'completo';
  return validStyles.includes(rawStyle as BjjCombatStyle)
    ? (rawStyle as BjjCombatStyle)
    : 'completo';
}

/**
 * Avança o dia atual dentro do mesmo mês e ano do calendário civil até a data oficial
 * da pesagem ou da disputa do campeonato, recalculando a idade real (aniversário/ano bissexto).
 * Nunca retrocede datas nem altera outros meses.
 */
export function advanceCharacterToTournamentDate(
  character: Character,
  tournament: Tournament,
  milestone: 'weigh_in' | 'fight',
  targetYear?: number
): { success: boolean; message: string; updatedChar: Character } {
  const year = getTournamentYear(tournament, character.currentDate, targetYear);
  const dates = getTournamentScheduleDates(tournament, year);
  const targetDate = milestone === 'weigh_in' ? dates.weighInDate : dates.scheduledDate;

  if (character.currentDate.year !== targetDate.year || character.currentDate.month !== targetDate.month) {
    return {
      success: false,
      message: `O evento ocorre em ${MONTH_NAMES[targetDate.month - 1]} de ${targetDate.year}. Use o avanço mensal para chegar ao mês oficial.`,
      updatedChar: character
    };
  }

  if (character.currentDate.day > targetDate.day) {
    return {
      success: false,
      message: `A data programada (dia ${targetDate.day}) já foi ultrapassada no calendário atual.`,
      updatedChar: character
    };
  }

  const timeline = getTournamentTimelineInfo(tournament, character.currentDate, character, targetYear);
  if (milestone === 'weigh_in' && !timeline.historyEntry?.registered) {
    return {
      success: false,
      message: 'É necessário confirmar a inscrição antes de avançar para a pesagem.',
      updatedChar: character
    };
  }
  if (milestone === 'fight' && !timeline.historyEntry?.weighInPassed) {
    return {
      success: false,
      message: 'A pesagem oficial precisa estar homologada antes do dia da competição.',
      updatedChar: character
    };
  }

  const geo = evaluateTournamentGeographyAndTravel(character, tournament);
  const updated = JSON.parse(JSON.stringify(character)) as Character;
  updated.currentDate = { ...targetDate };
  updated.currentMonth = targetDate.month;
  updated.currentYear = targetDate.year;
  updated.age = calculateAge(updated.birthDate, updated.currentDate);

  if (milestone === 'fight' && !geo.travelLogistics.isSameCapital && geo.travelLogistics.fatigueImpact > 0) {
    const travelFatigue = Math.min(12, Math.round(geo.travelLogistics.fatigueImpact * 0.5));
    updated.accumulatedFatigue = Math.min(100, (updated.accumulatedFatigue || 0) + travelFatigue);
    if (updated.energy > 30) {
      updated.energy = Math.max(30, updated.energy - Math.round(travelFatigue * 0.6));
    }
  }

  const travelNote = !geo.travelLogistics.isSameCapital
    ? ` Sede: ${geo.host.displayLabel} (${geo.travelLogistics.distanceKm.toLocaleString('pt-BR')} km).`
    : ` Sede local: ${geo.host.displayLabel}.`;

  return {
    success: true,
    message:
      milestone === 'weigh_in'
        ? `Calendário avançado para o dia oficial da pesagem (${targetDate.day}/${targetDate.month}/${targetDate.year}).${travelNote}`
        : `Calendário avançado para o dia oficial do campeonato (${targetDate.day}/${targetDate.month}/${targetDate.year}).${travelNote}`,
    updatedChar: updated
  };
}

function buildSelectionFromEntry(entry?: CharacterTournamentEntry): TournamentDivisionSelection | undefined {
  if (!entry) return undefined;
  if (
    entry.weightDivisionId ||
    entry.weightDivisionLabel ||
    entry.giColor ||
    entry.genderDivision ||
    entry.ageDivisionId
  ) {
    return {
      weightDivisionId: entry.weightDivisionId,
      weightClassLabel: entry.weightDivisionLabel,
      minWeightKg: entry.weightMinKg,
      maxWeightKg: entry.weightMaxKg,
      ageDivisionId: entry.ageDivisionId,
      ageDivisionLabel: entry.ageDivisionLabel,
      rankDivisionId: entry.rankDivisionId,
      rankDivisionLabel: entry.rankDivisionLabel,
      gender: entry.genderDivision,
      giColor: entry.giColor as OfficialGiColor | undefined
    };
  }
  return undefined;
}

/**
 * Realiza a inscrição oficial em um campeonato validando cronologia, idade real,
 * graduação, peso real, modalidade Gi/No-Gi, categoria selecionada, disponibilidade e taxa de inscrição.
 */
export function registerCharacterInTournament(
  character: Character,
  tournament: Tournament,
  targetYear?: number,
  selection?: TournamentDivisionSelection
): {
  success: boolean;
  message: string;
  updatedChar: Character;
  entry?: CharacterTournamentEntry;
} {
  const timeline = getTournamentTimelineInfo(tournament, character.currentDate, character, targetYear);
  if (!timeline.canRegister) {
    return {
      success: false,
      message: timeline.statusDescription,
      updatedChar: character
    };
  }

  const eligibility = validateTournamentEligibility(
    character,
    tournament,
    timeline.tournamentYear,
    selection
  );
  if (!eligibility.eligible) {
    return {
      success: false,
      message: eligibility.reasons.join(' '),
      updatedChar: character
    };
  }

  const { totalRegistrationCost, effectiveTravelCost, host, travelLogistics } = eligibility.geography;

  if (character.money < totalRegistrationCost) {
    const breakdown =
      effectiveTravelCost > 0
        ? `Inscrição R$ ${tournament.entryFee} + Deslocamento para ${host.displayLabel} R$ ${effectiveTravelCost} = R$ ${totalRegistrationCost}`
        : `a taxa de inscrição é R$ ${tournament.entryFee}`;
    return {
      success: false,
      message: `Saldo insuficiente: ${breakdown} e você possui R$ ${character.money.toFixed(0)}.`,
      updatedChar: character
    };
  }

  let updated = JSON.parse(JSON.stringify(character)) as Character;
  updated.age = eligibility.realAge;
  updated.money = Math.round((updated.money - totalRegistrationCost) * 100) / 100;

  const ensured = ensureTournamentBracket(updated, tournament, timeline.tournamentYear, selection);
  updated = ensured.updatedChar;
  const entry = ensured.entry;
  const div = eligibility.resolvedDivision;

  entry.registered = true;
  entry.weighInPassed = false;
  entry.categoryHomologated = false;
  entry.isGi = eligibility.isGi;
  entry.giColor = selection ? div.giColor : entry.giColor ?? div.giColor;
  entry.genderDivision = div.sex;
  entry.ageDivisionId = div.ageDivision.id;
  entry.ageDivisionLabel = div.ageDivision.label;
  entry.rankDivisionId = div.rankDivisionId;
  entry.rankDivisionLabel = div.rankDivisionLabel;
  entry.weightDivisionId = selection ? div.selectedWeight.id : entry.weightDivisionId ?? div.selectedWeight.id;
  entry.weightDivisionLabel = selection ? div.selectedWeight.label : entry.weightDivisionLabel ?? div.selectedWeight.label;
  entry.weightMinKg = selection ? div.selectedWeight.minWeight : entry.weightMinKg ?? div.selectedWeight.minWeight;
  entry.weightMaxKg = selection ? div.selectedWeight.maxWeight : entry.weightMaxKg ?? div.selectedWeight.maxWeight;
  entry.disqualifiedReason = undefined;
  entry.weightClass = tournament.weightClass;
  entry.ageCategory = eligibility.ageCategory;
  entry.hostCity = host.hostCity;
  entry.hostCountry = host.hostCountry;
  entry.travelCostPaid = effectiveTravelCost;
  entry.homologatedMatchIds = [];
  entry.rewardsClaimed = false;
  entry.completed = false;
  entry.currentStage = tournament.bracketSize === 8 ? 'quartas' : 'semifinal';
  entry.matchesWon = 0;
  entry.matchHistory = [];
  entry.activeMatchSession = undefined;

  const travelConfirmation =
    effectiveTravelCost > 0
      ? ` Deslocamento reservado até ${host.displayLabel} (${travelLogistics.distanceKm.toLocaleString('pt-BR')} km · R$ ${effectiveTravelCost}).`
      : ` Sede: ${host.displayLabel}.`;

  const divisionText = selection
    ? div.summaryLabel
    : `${eligibility.isGi ? 'Gi' : 'No-Gi'} · ${tournament.weightClass}`;

  return {
    success: true,
    message: `Inscrição confirmada no ${tournament.name} (${divisionText}).${travelConfirmation} Compareça à pesagem no dia ${timeline.weighInDate.day}/${timeline.weighInDate.month}.`,
    updatedChar: updated,
    entry
  };
}

/**
 * Executa a pesagem oficial na data programada e homologa a categoria,
 * revalidando idade real, graduação, peso real (+ quimono e tolerância zero na CBJJ) e disponibilidade.
 * Se confirmScaleAttempt = true e o atleta estourar o peso ou levar quimono irregular, sofre desclassificação imediata.
 */
export function performTournamentWeighIn(
  character: Character,
  tournament: Tournament,
  targetYear?: number,
  options?: { confirmScaleAttempt?: boolean }
): {
  success: boolean;
  disqualified?: boolean;
  message: string;
  updatedChar: Character;
  entry?: CharacterTournamentEntry;
} {
  const timeline = getTournamentTimelineInfo(tournament, character.currentDate, character, targetYear);
  if (!timeline.historyEntry?.registered) {
    return {
      success: false,
      message: 'Atleta não está inscrito neste campeonato.',
      updatedChar: character
    };
  }

  if (!timeline.canWeighIn) {
    return {
      success: false,
      message:
        character.currentDate.day < timeline.weighInDate.day
          ? `A pesagem oficial só ocorre na data programada (dia ${timeline.weighInDate.day}/${timeline.weighInDate.month}).`
          : timeline.statusDescription,
      updatedChar: character
    };
  }

  const entrySelection = buildSelectionFromEntry(timeline.historyEntry);
  const eligibility = validateTournamentEligibility(
    character,
    tournament,
    timeline.tournamentYear,
    entrySelection
  );

  if (!eligibility.eligible) {
    const wStatus = eligibility.weightValidation.status;
    const isScaleFailure =
      wStatus === 'acima_do_peso' || wStatus === 'abaixo_do_peso' || wStatus === 'quimono_irregular';

    if (options?.confirmScaleAttempt && isScaleFailure) {
      const updated = JSON.parse(JSON.stringify(character)) as Character;
      const entry = updated.tournamentHistory?.find(
        (h) => h.tournamentId === tournament.id && h.year === timeline.tournamentYear
      );
      if (entry) {
        entry.weighInPassed = false;
        entry.categoryHomologated = false;
        entry.completed = true;
        entry.result = 'derrota';
        entry.dateCompleted = { ...updated.currentDate };
        entry.disqualifiedReason = eligibility.weightValidation.message;
      }
      updated.stress = Math.min(100, (updated.stress || 0) + 6);
      updated.socialFeed.unshift({
        id: `dq_scale_${tournament.id}_${Date.now()}`,
        author: tournament.organization,
        handle: '@comissao_atletica',
        text: `⚖️ DESCLASSIFICAÇÃO NA BALANÇA: ${updated.name} não bateu a divisão ${entry?.weightDivisionLabel || tournament.weightClass} no ${tournament.name}. ${eligibility.weightValidation.message}`,
        time: 'Agora',
        likes: 25 + updated.fame,
        verified: true
      });
      return {
        success: false,
        disqualified: true,
        message: `Desclassificação oficial na balança: ${eligibility.weightValidation.message}`,
        updatedChar: updated,
        entry
      };
    }

    return {
      success: false,
      message: `Pesagem não homologada: ${eligibility.reasons.join(' ')}`,
      updatedChar: character
    };
  }

  const ensured = ensureTournamentBracket(character, tournament, timeline.tournamentYear, entrySelection);
  const updated = ensured.updatedChar;
  updated.age = eligibility.realAge;
  const entry = ensured.entry;
  const div = eligibility.resolvedDivision;

  entry.registered = true;
  entry.weighInPassed = true;
  entry.categoryHomologated = true;
  entry.isGi = resolveTournamentIsGi(tournament, entry);
  entry.giColor = entry.giColor ?? div.giColor;
  entry.genderDivision = entry.genderDivision ?? div.sex;
  entry.ageDivisionId = entry.ageDivisionId ?? div.ageDivision.id;
  entry.ageDivisionLabel = entry.ageDivisionLabel ?? div.ageDivision.label;
  entry.rankDivisionId = entry.rankDivisionId ?? div.rankDivisionId;
  entry.rankDivisionLabel = entry.rankDivisionLabel ?? div.rankDivisionLabel;
  entry.weightDivisionId = entry.weightDivisionId ?? div.selectedWeight.id;
  entry.weightDivisionLabel = entry.weightDivisionLabel ?? div.selectedWeight.label;
  entry.weightMinKg = entry.weightMinKg ?? div.selectedWeight.minWeight;
  entry.weightMaxKg = entry.weightMaxKg !== undefined ? entry.weightMaxKg : div.selectedWeight.maxWeight;
  entry.disqualifiedReason = undefined;
  entry.weightClass = tournament.weightClass;
  entry.ageCategory = eligibility.ageCategory;
  if (!entry.currentStage) {
    entry.currentStage = tournament.bracketSize === 8 ? 'quartas' : 'semifinal';
  }

  return {
    success: true,
    message: eligibility.weightValidation.message,
    updatedChar: updated,
    entry
  };
}

/**
 * Atualiza cartel e histórico do adversário NPC após combate oficial (tanto em character.rivals quanto em npcWorldState).
 */
export function updateOpponentRecordAfterFight(
  char: Character,
  oppSlot: BracketFighterSlot,
  playerOutcome: 'player' | 'opponent' | 'draw',
  winMethod: string
): Character {
  if (oppSlot.isPlayer) return char;

  const existingRival = char.rivals?.find((r) => r.id === oppSlot.id);
  const worldBase = WORLD_FIGHTERS.find((w) => w.id === oppSlot.id);
  const baseRecord = existingRival?.record || worldBase?.record || oppSlot.record;
  const updatedRecord = { ...baseRecord };

  if (playerOutcome === 'player') {
    updatedRecord.losses += 1;
  } else if (playerOutcome === 'opponent') {
    updatedRecord.wins += 1;
    if (winMethod.includes('KO') || winMethod.includes('Nocaute')) updatedRecord.kos += 1;
    if (winMethod.includes('Finalização')) updatedRecord.subs += 1;
  } else {
    updatedRecord.draws += 1;
  }

  const rivalPayload: RivalNPC = {
    ...(worldBase || {}),
    ...(existingRival || {}),
    id: oppSlot.id,
    name: oppSlot.name,
    nickname: oppSlot.nickname,
    avatar: oppSlot.avatar,
    age: oppSlot.age,
    ageCategory: oppSlot.ageCategory,
    art: oppSlot.art,
    rankIndex: oppSlot.rankIndex,
    belt: oppSlot.belt,
    weight: oppSlot.weight,
    weightClass: oppSlot.weightClass,
    gymName: oppSlot.gymName,
    country: oppSlot.country,
    fightingStyle: oppSlot.fightingStyle,
    attributes: existingRival?.attributes || oppSlot.attributes,
    record: updatedRecord,
    reputation: existingRival?.reputation ?? worldBase?.reputation ?? 40,
    personality: existingRival?.personality ?? worldBase?.personality ?? 'respeitoso',
    relationshipScore:
      existingRival?.relationshipScore ??
      (playerOutcome === 'opponent' ? -15 : 5),
    lastResult:
      playerOutcome === 'player'
        ? 'perdeu_jogador'
        : playerOutcome === 'opponent'
        ? 'venceu_jogador'
        : existingRival?.lastResult || 'nunca_lutaram',
    socialPost:
      playerOutcome === 'player'
        ? `Grande combate contra ${char.name}. Hoje não deu, mas nos veremos novamente na chave!`
        : playerOutcome === 'opponent'
        ? `Vitória oficial no torneio sobre ${char.name} (${winMethod}). Seguimos na disputa!`
        : existingRival?.socialPost
  };

  const withRival = upsertRivalInCharacter(char, rivalPayload);
  if (!withRival.npcWorldState) withRival.npcWorldState = {};
  const existingDelta = withRival.npcWorldState[oppSlot.id];
  if (worldBase || existingDelta) {
    withRival.npcWorldState[oppSlot.id] = {
      ...(existingDelta || {
        rk: oppSlot.rankIndex,
        sp: oppSlot.stripes ?? 0,
        b: oppSlot.belt
      }),
      w: updatedRecord.wins,
      l: updatedRecord.losses,
      kos: updatedRecord.kos,
      subs: updatedRecord.subs
    };
  }

  return withRival;
}

function isValidMatchStateForSession(
  state: BjjMatchState | undefined,
  expectedMatchId: string,
  expectedIsGi: boolean
): state is BjjMatchState {
  if (!state) return false;
  if (state.matchType !== 'competicao') return false;
  if (state.matchId && state.matchId !== expectedMatchId) return false;
  if (state.isGi !== expectedIsGi) return false;
  if (!state.athleteA || !state.athleteB || !state.score) return false;
  if (typeof state.matchTimeElapsedSeconds !== 'number') return false;
  if (!state.currentPositionId) return false;
  return true;
}

export interface PreparedBjjMatchSessionResult {
  success: boolean;
  message: string;
  updatedChar: Character;
  session?: ActiveBjjTournamentMatchSession;
  opponentAthlete?: BjjCombatAthlete;
  aiStyle?: BjjCombatStyle;
  initialMatchState?: BjjMatchState;
  matchDurationSeconds?: number;
  resumedFromInProgress?: boolean;
  controlledResetApplied?: boolean;
}

/**
 * Prepara ou retoma de forma persistente o confronto oficial na Arena BJJ:
 * - Valida cronologia (apenas no dia do torneio, com inscrição e pesagem homologadas)
 * - Revalida elegibilidade completa (idade real, graduação, peso real, Gi/No-Gi, disponibilidade)
 * - Verifica conclusão das fases anteriores antes de permitir o confronto atual
 * - Reaproveita sessão pendente/em andamento sem regenerar adversário ou criar resultados fictícios
 */
export function prepareBjjTournamentMatchSession(
  character: Character,
  tournament: Tournament,
  targetYear?: number
): PreparedBjjMatchSessionResult {
  const timeline = getTournamentTimelineInfo(tournament, character.currentDate, character, targetYear);
  if (!timeline.canFight) {
    return {
      success: false,
      message: timeline.statusDescription,
      updatedChar: character
    };
  }

  const entrySelection = buildSelectionFromEntry(timeline.historyEntry);
  const eligibility = validateTournamentEligibility(
    character,
    tournament,
    timeline.tournamentYear,
    entrySelection
  );
  if (!eligibility.eligible) {
    return {
      success: false,
      message: `Impedimento na comissão atlética: ${eligibility.reasons.join(' ')}`,
      updatedChar: character
    };
  }

  const ensured = ensureTournamentBracket(character, tournament, timeline.tournamentYear, entrySelection);
  const updated = ensured.updatedChar;
  updated.age = eligibility.realAge;
  const entry = ensured.entry;
  const bracket = ensured.bracket;

  // Garante integridade de fases anteriores na chave antes de iniciar o confronto
  if (entry.currentStage === 'semifinal' && bracket.bracketSize === 8) {
    const qfDone = bracket.matches
      .filter((m) => m.stage === 'quartas')
      .every((m) => m.status === 'concluida' && Boolean(m.winnerId));
    if (!qfDone) {
      return {
        success: false,
        message: 'As Quartas de Final ainda não foram homologadas antes da Semifinal.',
        updatedChar: character
      };
    }
  } else if (entry.currentStage === 'final') {
    const sfDone = bracket.matches
      .filter((m) => m.stage === 'semifinal')
      .every((m) => m.status === 'concluida' && Boolean(m.winnerId));
    if (!sfDone) {
      return {
        success: false,
        message: 'As Semifinais ainda não foram totalmente homologadas antes da Grande Final.',
        updatedChar: character
      };
    }
  }

  const scheduled = getPlayerCurrentBracketMatch(bracket);
  if (!scheduled) {
    return {
      success: false,
      message: 'Nenhum confronto pendente encontrado para o atleta nesta chave.',
      updatedChar: character
    };
  }

  const { match, opponent: oppSlot } = scheduled;
  if (entry.homologatedMatchIds?.includes(match.matchId) || match.status === 'concluida') {
    return {
      success: false,
      message: `O confronto ${match.matchId} já foi homologado na chave.`,
      updatedChar: character
    };
  }

  const isGi = resolveTournamentIsGi(tournament, entry);
  const currentStage = match.stage;
  const stageName: 'Quartas de Final' | 'Semifinal' | 'Grande Final' =
    currentStage === 'quartas' ? 'Quartas de Final' : currentStage === 'semifinal' ? 'Semifinal' : 'Grande Final';
  const bracketId = bracket.bracketId || `${tournament.id}_${timeline.tournamentYear}_${bracket.ageCategory}_${bracket.weightClass}`;

  let resumedFromInProgress = false;
  let controlledResetApplied = false;
  let initialMatchState: BjjMatchState | undefined;

  const existing = entry.activeMatchSession;
  if (
    existing &&
    existing.tournamentId === tournament.id &&
    existing.year === timeline.tournamentYear &&
    existing.matchId === match.matchId
  ) {
    if (existing.status === 'em_andamento') {
      if (isValidMatchStateForSession(existing.matchState, match.matchId, isGi)) {
        resumedFromInProgress = true;
        initialMatchState = JSON.parse(JSON.stringify(existing.matchState)) as BjjMatchState;
      } else {
        // Estado incompleto ou corrompido: exige reinício controlado mantendo o mesmo adversário e matchId
        controlledResetApplied = true;
        existing.status = 'pendente';
        existing.matchState = undefined;
      }
    }
    // Sempre preserva exatamente o adversário e modalidade homologados pela chave
    existing.opponentId = oppSlot.id;
    existing.opponentSlot = oppSlot;
    existing.isGi = isGi;
  } else {
    entry.activeMatchSession = {
      tournamentId: tournament.id,
      year: timeline.tournamentYear,
      category: tournament.weightClass,
      weightDivisionLabel: entry.weightDivisionLabel || eligibility.resolvedDivision.selectedWeight.label,
      weightMaxKg:
        entry.weightMaxKg !== undefined
          ? entry.weightMaxKg
          : eligibility.resolvedDivision.selectedWeight.maxWeight,
      ageCategory: bracket.ageCategory,
      ageDivisionLabel: entry.ageDivisionLabel || eligibility.resolvedDivision.ageDivision.label,
      genderDivision: entry.genderDivision || eligibility.resolvedDivision.sex,
      rankDivisionLabel: entry.rankDivisionLabel || eligibility.resolvedDivision.rankDivisionLabel,
      giColor: (entry.giColor as OfficialGiColor | undefined) || eligibility.resolvedDivision.giColor,
      bracketId,
      matchId: match.matchId,
      stage: currentStage,
      stageName,
      opponentId: oppSlot.id,
      opponentSlot: oppSlot,
      isGi,
      status: 'pendente',
      startedAtDate: { ...updated.currentDate }
    };
  }

  const session = entry.activeMatchSession!;
  const oppBeltRank = resolveBjjCombatBeltRank(oppSlot.rankIndex, oppSlot.belt);
  const opponentAthlete: BjjCombatAthlete = {
    id: 'athlete_b',
    name: oppSlot.name,
    nickname: oppSlot.nickname,
    isPlayer: false,
    avatar: oppSlot.avatar,
    beltRankIndex: oppBeltRank,
    beltName: oppSlot.belt,
    weight: oppSlot.weight,
    age: oppSlot.age,
    attributes: { ...oppSlot.attributes },
    repertoire: generateOpponentBjjRepertoire(oppBeltRank, isGi),
    energy: initialMatchState?.athleteB.energy ?? 100,
    maxEnergy: initialMatchState?.athleteB.maxEnergy ?? 100,
    accumulatedFatigue: initialMatchState?.athleteB.accumulatedFatigue ?? 0
  };

  return {
    success: true,
    message: resumedFromInProgress
      ? 'Combate em andamento recuperado com sucesso.'
      : controlledResetApplied
      ? 'Estado incompleto recuperado com segurança; confronto reiniciado contra o mesmo adversário da chave.'
      : 'Confronto oficial preparado na Arena BJJ.',
    updatedChar: updated,
    session,
    opponentAthlete,
    aiStyle: resolveAiStyleFromSlot(oppSlot),
    initialMatchState,
    matchDurationSeconds: eligibility.resolvedDivision.effectiveMatchDurationSeconds,
    resumedFromInProgress,
    controlledResetApplied
  };
}

/**
 * Persiste no personagem o estado em andamento de uma luta BJJ oficial para retomada após saída ou recarregamento.
 */
export function persistInProgressBjjMatchState(
  character: Character,
  tournamentId: string,
  year: number,
  matchState: BjjMatchState
): Character {
  const updated = JSON.parse(JSON.stringify(character)) as Character;
  if (!Array.isArray(updated.tournamentHistory)) return updated;

  const entry = updated.tournamentHistory.find(
    (h) => h.tournamentId === tournamentId && h.year === year
  );
  if (!entry || !entry.activeMatchSession) return updated;

  if (entry.activeMatchSession.matchId === (matchState.matchId || entry.activeMatchSession.matchId)) {
    entry.activeMatchSession.matchState = JSON.parse(JSON.stringify(matchState)) as BjjMatchState;
    entry.activeMatchSession.status = matchState.status === 'em_andamento' ? 'em_andamento' : 'concluida';
  }

  return updated;
}

/**
 * Retorna sessão ativa (pendente ou em andamento) do circuito BJJ se houver luta ainda não homologada.
 */
export function getActiveBjjTournamentSession(
  character: Character,
  tournamentsList: Tournament[]
): { entry: CharacterTournamentEntry; session: ActiveBjjTournamentMatchSession; tournament: Tournament } | null {
  if (!Array.isArray(character.tournamentHistory)) return null;

  for (const entry of character.tournamentHistory) {
    if (entry.completed) continue;
    const sess = entry.activeMatchSession;
    if (!sess) continue;
    if (sess.status !== 'em_andamento' && sess.status !== 'pendente') continue;
    if (entry.homologatedMatchIds?.includes(sess.matchId)) continue;

    const tournament = tournamentsList.find((t) => t.id === entry.tournamentId);
    if (!tournament) continue;

    return { entry, session: sess, tournament };
  }

  return null;
}

/**
 * Verifica de forma persistente se um matchId já foi homologado em um histórico de torneio.
 */
export function isTournamentMatchAlreadyHomologated(
  entry: CharacterTournamentEntry | undefined,
  matchId: string
): boolean {
  if (!entry) return false;
  if (entry.homologatedMatchIds?.includes(matchId)) return true;
  if (entry.matchHistory?.some((m) => m.matchId === matchId)) return true;
  const bracketMatch = entry.bracket?.matches.find((m) => m.matchId === matchId);
  if (bracketMatch?.status === 'concluida') return true;
  return false;
}

export interface HomologateBjjMatchParams {
  tournament: Tournament;
  year?: number;
  stage: 'quartas' | 'semifinal' | 'final';
  stageName: 'Quartas de Final' | 'Semifinal' | 'Grande Final';
  matchId: string;
  opponentSlot: BracketFighterSlot;
  winner: 'player' | 'opponent' | 'draw';
  state: BjjMatchState;
  applyTiebreaker?: boolean;
}

/**
 * Homologa o resultado de um confronto oficial de Jiu-Jitsu como uma operação única e idempotente.
 * Impede qualquer duplicação em cartel, histórico, chave, troféus, fama, premiação financeira ou cartel do NPC.
 */
export function homologateBjjTournamentMatchResult(
  character: Character,
  params: HomologateBjjMatchParams
): {
  updatedChar: Character;
  alreadyHomologated: boolean;
  effectiveOutcome: 'player' | 'opponent' | 'draw';
  tiebreakApplied: boolean;
  tiebreakCriterion?: string;
} {
  const { tournament, stage, stageName, matchId, opponentSlot, winner, state } = params;
  const targetYear = params.year ?? character.currentYear;

  let updated = JSON.parse(JSON.stringify(character)) as Character;
  const ensured = ensureTournamentBracket(updated, tournament, targetYear);
  updated = ensured.updatedChar;
  const entry = ensured.entry;

  if (!Array.isArray(entry.homologatedMatchIds)) entry.homologatedMatchIds = [];
  if (!Array.isArray(entry.matchHistory)) entry.matchHistory = [];

  // Barreira persistente de unicidade por matchId
  if (isTournamentMatchAlreadyHomologated(entry, matchId)) {
    return {
      updatedChar: character,
      alreadyHomologated: true,
      effectiveOutcome: winner,
      tiebreakApplied: false
    };
  }

  const effectiveIsGi = resolveTournamentIsGi(tournament, entry);
  const methodDesc = state.winMethod || (state.status === 'finalizada' ? 'Finalização' : 'Pontos');
  const scoreDesc = `${state.score.pointsA}x${state.score.pointsB} (${state.score.advantagesA}v x ${state.score.advantagesB}v)`;

  // Resolve a chave oficial e aplica desempates coerentes caso winner === 'draw'
  let aiFeedLine = '';
  let resolvedNextStage: 'semifinal' | 'final' | undefined;
  let effectiveOutcome: 'player' | 'opponent' | 'draw' = winner;
  let tiebreakApplied = false;
  let tiebreakCriterion: string | undefined;

  if (entry.bracket) {
    const resolved = resolvePlayerBracketMatch(
      entry.bracket,
      tournament,
      stage,
      winner,
      methodDesc,
      scoreDesc,
      {
        applyTiebreaker: params.applyTiebreaker,
        score: state.score,
        matchId
      }
    );
    entry.bracket = resolved.updatedBracket;
    resolvedNextStage = resolved.nextStage;
    effectiveOutcome = resolved.effectiveOutcome;
    tiebreakApplied = resolved.tiebreakApplied;
    tiebreakCriterion = resolved.tiebreakCriterion;

    if (resolved.simulatedAiResults.length > 0) {
      const summary = resolved.simulatedAiResults[0];
      aiFeedLine = ` Do outro lado da chave: ${summary.winnerName} venceu ${summary.loserName} (${summary.method}).`;
    }
  }

  // Marca o matchId como homologado antes de creditar estatísticas
  entry.homologatedMatchIds.push(matchId);
  entry.isGi = effectiveIsGi;
  entry.activeMatchSession = undefined;

  entry.matchHistory.push({
    matchId,
    stage: stageName,
    opponentName: opponentSlot.name,
    winner: effectiveOutcome,
    method: tiebreakApplied ? `${methodDesc} (Desempate)` : methodDesc,
    scoreSummary: scoreDesc,
    isGi: effectiveIsGi,
    tiebreakCriterion,
    resultType: tiebreakApplied ? 'desempate' : 'combate',
    recordedAt: { ...updated.currentDate }
  });

  // Atualiza cartel do NPC adversário uma única vez
  updated = updateOpponentRecordAfterFight(updated, opponentSlot, effectiveOutcome, methodDesc);
  const postEntry = updated.tournamentHistory!.find(
    (h) => h.tournamentId === tournament.id && h.year === targetYear
  )!;

  if (effectiveOutcome === 'player') {
    updated.record.wins += 1;
    if (state.winMethod === 'Finalização' || state.status === 'finalizada') {
      updated.record.submissions += 1;
    } else {
      updated.record.pointsWins += 1;
    }
    postEntry.matchesWon = (postEntry.matchesWon || 0) + 1;

    if (resolvedNextStage === 'semifinal' || (!resolvedNextStage && stage === 'quartas')) {
      postEntry.currentStage = 'semifinal';
      updated.fame = Math.min(1000, updated.fame + 10);
      updated.hype = Math.min(100, updated.hype + 5);

      updated.socialFeed.unshift({
        id: `news_${matchId}_${Date.now()}`,
        author: 'Tatame & Arte Suave Oficial',
        handle: '@tatame_oficial',
        text: `⚡ AVANÇOU! ${updated.name} "${updated.nickname}" venceu ${opponentSlot.name} nas Quartas de Final do ${tournament.name} (${effectiveIsGi ? 'Gi' : 'No-Gi'}) por ${methodDesc} (${scoreDesc}) e garantiu vaga na Semifinal!${aiFeedLine}`,
        time: 'Agora',
        likes: 90 + updated.fame * 2,
        verified: true
      });
    } else if (resolvedNextStage === 'final' || (!resolvedNextStage && stage === 'semifinal')) {
      postEntry.currentStage = 'final';
      updated.fame = Math.min(1000, updated.fame + 20);
      updated.hype = Math.min(100, updated.hype + 10);

      updated.socialFeed.unshift({
        id: `news_${matchId}_${Date.now()}`,
        author: 'Tatame & Arte Suave Oficial',
        handle: '@tatame_oficial',
        text: `🔥 FINALISTA! ${updated.name} "${updated.nickname}" superou ${opponentSlot.name} na Semifinal do ${tournament.name} (${effectiveIsGi ? 'Gi' : 'No-Gi'}) por ${methodDesc} e vai disputar a Grande Final!${aiFeedLine}`,
        time: 'Agora',
        likes: 150 + updated.fame * 2,
        verified: true
      });
    } else {
      // Grande Final -> Campeão!
      postEntry.completed = true;
      postEntry.result = 'vitoria';
      postEntry.trophyEarned = tournament.trophyName;
      postEntry.dateCompleted = { ...updated.currentDate };

      if (!postEntry.rewardsClaimed) {
        postEntry.rewardsClaimed = true;
        updated.money += tournament.rewardMoney;
        updated.fame = Math.min(1000, updated.fame + tournament.rewardReputation);
        updated.hype = Math.min(100, updated.hype + tournament.rewardHype);
        updated.honor = Math.min(100, updated.honor + 15);

        const alreadyHasTrophy = updated.trophies.some(
          (tr) =>
            (tr.tournamentId === tournament.id || tr.tournamentName === tournament.name) &&
            tr.year === targetYear
        );
        if (!alreadyHasTrophy) {
          updated.trophies.push({
            id: `trophy_${tournament.id}_${targetYear}`,
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            year: targetYear,
            art: tournament.art,
            tier: tournament.scope,
            isGi: effectiveIsGi
          });
        }
      }

      const divSummary = [
        postEntry.ageDivisionLabel,
        postEntry.rankDivisionLabel,
        postEntry.weightDivisionLabel || tournament.weightClass
      ]
        .filter(Boolean)
        .join(' · ');

      updated.socialFeed.unshift({
        id: `news_${matchId}_${Date.now()}`,
        author: 'Federação Oficial de Jiu-Jitsu',
        handle: '@cbjj_ibjjf_news',
        text: `🏆 CAMPEÃO OURO! ${updated.name} "${updated.nickname}" venceu ${opponentSlot.name} e sagrou-se campeão do ${tournament.name} (${effectiveIsGi ? 'Gi' : 'No-Gi'}) na divisão ${divSummary} por ${methodDesc}!`,
        time: 'Agora',
        likes: 250 + updated.fame * 2,
        verified: true
      });
    }
  } else if (effectiveOutcome === 'draw') {
    updated.record.draws += 1;
    postEntry.completed = true;
    postEntry.result = 'empate';
    postEntry.dateCompleted = { ...updated.currentDate };
  } else {
    updated.record.losses += 1;
    postEntry.completed = true;
    postEntry.result = 'derrota';
    postEntry.dateCompleted = { ...updated.currentDate };
    updated.stress = Math.min(100, updated.stress + 8);
    updated.mentalHealth = Math.max(10, updated.mentalHealth - 6);

    updated.socialFeed.unshift({
      id: `news_${matchId}_${Date.now()}`,
      author: 'Tatame & Arte Suave Oficial',
      handle: '@tatame_oficial',
      text: `${updated.name} foi superado por ${opponentSlot.name} (${scoreDesc}) no ${tournament.name} (${stageName} · ${effectiveIsGi ? 'Gi' : 'No-Gi'}). Experiência valiosa para a próxima temporada!`,
      time: 'Agora',
      likes: 45 + updated.fame,
      verified: false
    });
  }

  // Cansaço proporcional à duração do combate
  const staminaDrain = Math.min(40, Math.max(10, Math.round(state.matchTimeElapsedSeconds / 10)));
  updated.energy = Math.max(5, updated.energy - staminaDrain);
  updated.accumulatedFatigue = Math.min(100, (updated.accumulatedFatigue || 0) + 4);
  updated.age = getRealAthleteAge(updated);

  return {
    updatedChar: updated,
    alreadyHomologated: false,
    effectiveOutcome,
    tiebreakApplied,
    tiebreakCriterion
  };
}

// =========================================================================
// FLUXO OFICIAL DE TORNEIOS DE BOXE (ARENA ESPECIALIZADA DE PUGILISMO)
// =========================================================================

export function resolveBoxingAiStyleFromSlot(oppSlot: BracketFighterSlot): BoxingAiStyle {
  const raw = (oppSlot.fightingStyle || '').toLowerCase();
  if (raw.includes('slug') || raw.includes('pegador') || raw.includes('nocaut')) return 'slugger_pegador';
  if (raw.includes('press') || raw.includes('swarm')) return 'swarmer_pressao';
  if (raw.includes('counter') || raw.includes('contra')) return 'counter_puncher';
  if (raw.includes('inside') || raw.includes('infight') || raw.includes('curta')) return 'inside_fighter';
  if (raw.includes('tecn') || raw.includes('boxer')) return 'boxer_tecnico';
  return 'completo';
}

export interface PreparedBoxingMatchSessionResult {
  success: boolean;
  message: string;
  updatedChar: Character;
  session?: ActiveBoxingTournamentMatchSession;
  opponentAthlete?: BoxingCombatAthlete;
  aiStyle?: BoxingAiStyle;
  initialMatchState?: BoxingMatchState;
  rulesMode?: BoxingRulesMode;
  totalRounds?: number;
  roundDurationSeconds?: number;
  resumedFromInProgress?: boolean;
}

export function prepareBoxingTournamentMatchSession(
  character: Character,
  tournament: Tournament
): PreparedBoxingMatchSessionResult {
  const timeline = getTournamentTimelineInfo(tournament, character.currentDate, character);
  if (!timeline.canFight) {
    return {
      success: false,
      message: timeline.statusDescription,
      updatedChar: character
    };
  }

  const entrySelection = buildSelectionFromEntry(timeline.historyEntry);
  const eligibility = validateTournamentEligibility(
    character,
    tournament,
    timeline.tournamentYear,
    entrySelection
  );
  if (!eligibility.eligible) {
    return {
      success: false,
      message: `Impedimento na comissão atlética: ${eligibility.reasons.join(' ')}`,
      updatedChar: character
    };
  }

  const ensured = ensureTournamentBracket(character, tournament, timeline.tournamentYear, entrySelection);
  const updated = ensured.updatedChar;
  updated.age = eligibility.realAge;
  const entry = ensured.entry;
  const bracket = ensured.bracket;

  const scheduled = getPlayerCurrentBracketMatch(bracket);
  if (!scheduled) {
    return {
      success: false,
      message: 'Nenhum confronto pendente encontrado para o pugilista nesta chave.',
      updatedChar: character
    };
  }

  const { match, opponent: oppSlot } = scheduled;
  if (entry.homologatedMatchIds?.includes(match.matchId) || match.status === 'concluida') {
    return {
      success: false,
      message: `O confronto ${match.matchId} já foi homologado na chave.`,
      updatedChar: character
    };
  }

  const rulesMode: BoxingRulesMode =
    tournament.scope === 'municipal' || tournament.scope === 'estadual' || tournament.id.includes('golden_gloves')
      ? 'amador'
      : 'profissional';
  const totalRounds = Math.max(3, tournament.rounds || 3);
  const roundDurationSeconds = Math.max(60, tournament.roundDurationSeconds || 90);
  const currentStage = match.stage;
  const stageName: 'Quartas de Final' | 'Semifinal' | 'Grande Final' =
    currentStage === 'quartas' ? 'Quartas de Final' : currentStage === 'semifinal' ? 'Semifinal' : 'Grande Final';
  const bracketId =
    bracket.bracketId || `${tournament.id}_${timeline.tournamentYear}_${bracket.ageCategory}_${bracket.weightClass}`;

  let resumedFromInProgress = false;
  let initialMatchState: BoxingMatchState | undefined;

  const existing = entry.activeBoxingMatchSession;
  if (
    existing &&
    existing.tournamentId === tournament.id &&
    existing.year === timeline.tournamentYear &&
    existing.matchId === match.matchId &&
    existing.status === 'em_andamento' &&
    existing.matchState &&
    existing.matchState.matchId === match.matchId &&
    !existing.matchState.isMatchOver
  ) {
    resumedFromInProgress = true;
    initialMatchState = JSON.parse(JSON.stringify(existing.matchState)) as BoxingMatchState;
  } else {
    entry.activeBoxingMatchSession = {
      tournamentId: tournament.id,
      year: timeline.tournamentYear,
      category: tournament.weightClass,
      weightDivisionLabel: entry.weightDivisionLabel || eligibility.resolvedDivision.selectedWeight.label,
      weightMaxKg:
        entry.weightMaxKg !== undefined
          ? entry.weightMaxKg
          : eligibility.resolvedDivision.selectedWeight.maxWeight,
      ageCategory: bracket.ageCategory,
      ageDivisionLabel: entry.ageDivisionLabel || eligibility.resolvedDivision.ageDivision.label,
      genderDivision: entry.genderDivision || eligibility.resolvedDivision.sex,
      rankDivisionLabel: entry.rankDivisionLabel || eligibility.resolvedDivision.rankDivisionLabel,
      bracketId,
      matchId: match.matchId,
      stage: currentStage,
      stageName,
      opponentId: oppSlot.id,
      opponentSlot: oppSlot,
      rulesMode,
      totalRounds,
      roundDurationSeconds,
      status: 'pendente',
      startedAtDate: { ...updated.currentDate }
    };
  }

  const session = entry.activeBoxingMatchSession!;
  const opponentAthlete: BoxingCombatAthlete = {
    id: 'boxer_b',
    name: oppSlot.name,
    nickname: oppSlot.nickname,
    avatar: oppSlot.avatar,
    isPlayer: false,
    weightKg: oppSlot.weight,
    heightCm: 175,
    stance: oppSlot.rankIndex % 3 === 0 ? 'southpaw' : 'orthodox',
    gloveColor: '#dc2626',
    trunksColor: '#b91c1c',
    headgearColor: '#dc2626',
    rankTitle: oppSlot.belt,
    beltIndex: oppSlot.rankIndex,
    attributes: {
      punchPower: oppSlot.attributes.punchPower || 55,
      punchSpeed: oppSlot.attributes.punchSpeed || 55,
      defense: oppSlot.attributes.defense || 52,
      footwork: oppSlot.attributes.agility || 52,
      stamina: oppSlot.attributes.stamina || 55,
      durability: oppSlot.attributes.durability || 55,
      technique: oppSlot.attributes.technique || 54,
      mentalFocus: oppSlot.attributes.mentalFocus || 55
    },
    chinHealth: initialMatchState?.boxerB.chinHealth ?? 100,
    maxChinHealth: 100,
    bodyHealth: initialMatchState?.boxerB.bodyHealth ?? 100,
    maxBodyHealth: 100,
    guardHealth: initialMatchState?.boxerB.guardHealth ?? 100,
    energy: initialMatchState?.boxerB.energy ?? 100,
    accumulatedFatigue: initialMatchState?.boxerB.accumulatedFatigue ?? 0,
    cutLevel: initialMatchState?.boxerB.cutLevel ?? 0,
    knockdownsThisRound: initialMatchState?.boxerB.knockdownsThisRound ?? 0,
    totalKnockdowns: initialMatchState?.boxerB.totalKnockdowns ?? 0,
    isGroggy: initialMatchState?.boxerB.isGroggy ?? false,
    stats: initialMatchState?.boxerB.stats ?? {
      punchesThrown: 0,
      punchesLanded: 0,
      powerLanded: 0,
      bodyLanded: 0,
      countersLanded: 0,
      dodges: 0
    }
  };

  return {
    success: true,
    message: resumedFromInProgress
      ? 'Combate de boxe em andamento recuperado.'
      : 'Confronto oficial preparado na Arena de Boxe.',
    updatedChar: updated,
    session,
    opponentAthlete,
    aiStyle: resolveBoxingAiStyleFromSlot(oppSlot),
    initialMatchState,
    rulesMode,
    totalRounds,
    roundDurationSeconds,
    resumedFromInProgress
  };
}

export function persistInProgressBoxingMatchState(
  character: Character,
  tournamentId: string,
  year: number,
  matchState: BoxingMatchState
): Character {
  const updated = JSON.parse(JSON.stringify(character)) as Character;
  if (!Array.isArray(updated.tournamentHistory)) return updated;

  const entry = updated.tournamentHistory.find(
    (h) => h.tournamentId === tournamentId && h.year === year
  );
  if (!entry || !entry.activeBoxingMatchSession) return updated;

  if (entry.activeBoxingMatchSession.matchId === (matchState.matchId || entry.activeBoxingMatchSession.matchId)) {
    entry.activeBoxingMatchSession.matchState = JSON.parse(JSON.stringify(matchState)) as BoxingMatchState;
    entry.activeBoxingMatchSession.status = !matchState.isMatchOver ? 'em_andamento' : 'concluida';
  }

  return updated;
}

export interface HomologateBoxingMatchParams {
  tournament: Tournament;
  year?: number;
  stage: 'quartas' | 'semifinal' | 'final';
  stageName: 'Quartas de Final' | 'Semifinal' | 'Grande Final';
  matchId: string;
  opponentSlot: BracketFighterSlot;
  winner: 'player' | 'opponent' | 'draw';
  state: BoxingMatchState;
}

export function homologateBoxingTournamentMatchResult(
  character: Character,
  params: HomologateBoxingMatchParams
): {
  updatedChar: Character;
  alreadyHomologated: boolean;
  effectiveOutcome: 'player' | 'opponent' | 'draw';
} {
  const { tournament, stage, stageName, matchId, opponentSlot, winner, state } = params;
  const targetYear = params.year ?? character.currentYear;

  let updated = JSON.parse(JSON.stringify(character)) as Character;
  const ensured = ensureTournamentBracket(updated, tournament, targetYear);
  updated = ensured.updatedChar;
  const entry = ensured.entry;

  if (!Array.isArray(entry.homologatedMatchIds)) entry.homologatedMatchIds = [];
  if (!Array.isArray(entry.matchHistory)) entry.matchHistory = [];

  if (isTournamentMatchAlreadyHomologated(entry, matchId)) {
    return {
      updatedChar: character,
      alreadyHomologated: true,
      effectiveOutcome: winner
    };
  }

  const methodDesc = state.winMethod || 'Pontos (Decisão Unânime)';
  const ptsA = state.roundScores.reduce((acc, r) => acc + r.pointsA, 0);
  const ptsB = state.roundScores.reduce((acc, r) => acc + r.pointsB, 0);
  const scoreDesc =
    state.judgeCards && state.judgeCards.length > 0
      ? state.judgeCards.map((c) => `${c.totalA}-${c.totalB}`).join(' / ')
      : `${ptsA}-${ptsB}`;

  let aiFeedLine = '';
  let resolvedNextStage: 'semifinal' | 'final' | undefined;
  let effectiveOutcome: 'player' | 'opponent' | 'draw' = winner;

  if (entry.bracket) {
    const resolved = resolvePlayerBracketMatch(
      entry.bracket,
      tournament,
      stage,
      winner,
      methodDesc,
      scoreDesc,
      { matchId }
    );
    entry.bracket = resolved.updatedBracket;
    resolvedNextStage = resolved.nextStage;
    effectiveOutcome = resolved.effectiveOutcome;

    if (resolved.simulatedAiResults.length > 0) {
      const summary = resolved.simulatedAiResults[0];
      aiFeedLine = ` Na outra chave: ${summary.winnerName} superou ${summary.loserName} (${summary.method}).`;
    }
  }

  entry.homologatedMatchIds.push(matchId);
  entry.activeBoxingMatchSession = undefined;

  entry.matchHistory.push({
    matchId,
    stage: stageName,
    opponentName: opponentSlot.name,
    winner: effectiveOutcome,
    method: methodDesc,
    scoreSummary: scoreDesc,
    resultType: 'combate',
    recordedAt: { ...updated.currentDate }
  });

  updated = updateOpponentRecordAfterFight(updated, opponentSlot, effectiveOutcome, methodDesc);
  const postEntry = updated.tournamentHistory!.find(
    (h) => h.tournamentId === tournament.id && h.year === targetYear
  )!;

  if (effectiveOutcome === 'player') {
    updated.record.wins += 1;
    if (state.winMethod === 'KO' || state.winMethod === 'TKO') {
      updated.record.kos += 1;
    } else {
      updated.record.pointsWins += 1;
    }
    postEntry.matchesWon = (postEntry.matchesWon || 0) + 1;

    if (resolvedNextStage === 'semifinal' || (!resolvedNextStage && stage === 'quartas')) {
      postEntry.currentStage = 'semifinal';
      updated.fame = Math.min(1000, updated.fame + 10);
      updated.hype = Math.min(100, updated.hype + 6);

      updated.socialFeed.unshift({
        id: `news_${matchId}_${Date.now()}`,
        author: 'Canal Nobre Arte News',
        handle: '@boxe_oficial',
        text: `🥊 AVANÇOU! ${updated.name} "${updated.nickname}" derrotou ${opponentSlot.name} nas Quartas do ${tournament.name} via ${methodDesc} (${scoreDesc})!${aiFeedLine}`,
        time: 'Agora',
        likes: 95 + updated.fame * 2,
        verified: true
      });
    } else if (resolvedNextStage === 'final' || (!resolvedNextStage && stage === 'semifinal')) {
      postEntry.currentStage = 'final';
      updated.fame = Math.min(1000, updated.fame + 20);
      updated.hype = Math.min(100, updated.hype + 12);

      updated.socialFeed.unshift({
        id: `news_${matchId}_${Date.now()}`,
        author: 'Canal Nobre Arte News',
        handle: '@boxe_oficial',
        text: `🔥 NA FINAL! ${updated.name} "${updated.nickname}" venceu ${opponentSlot.name} via ${methodDesc} e está na Grande Final do ${tournament.name}!${aiFeedLine}`,
        time: 'Agora',
        likes: 165 + updated.fame * 2,
        verified: true
      });
    } else {
      postEntry.completed = true;
      postEntry.result = 'vitoria';
      postEntry.trophyEarned = tournament.trophyName;
      postEntry.dateCompleted = { ...updated.currentDate };

      if (!postEntry.rewardsClaimed) {
        postEntry.rewardsClaimed = true;
        updated.money += tournament.rewardMoney;
        updated.fame = Math.min(1000, updated.fame + tournament.rewardReputation);
        updated.hype = Math.min(100, updated.hype + tournament.rewardHype);
        updated.honor = Math.min(100, updated.honor + 15);

        const alreadyHasTrophy = updated.trophies.some(
          (tr) =>
            (tr.tournamentId === tournament.id || tr.tournamentName === tournament.name) &&
            tr.year === targetYear
        );
        if (!alreadyHasTrophy) {
          updated.trophies.push({
            id: `trophy_${tournament.id}_${targetYear}`,
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            year: targetYear,
            art: tournament.art,
            tier: tournament.scope
          });
        }
      }

      updated.socialFeed.unshift({
        id: `news_${matchId}_${Date.now()}`,
        author: 'Federação Internacional de Boxe',
        handle: '@nobre_arte_mundial',
        text: `🏆 CAMPEÃO! ${updated.name} "${updated.nickname}" venceu ${opponentSlot.name} na Grande Final do ${tournament.name} via ${methodDesc} e ergueu: ${tournament.trophyName}!`,
        time: 'Agora',
        likes: 280 + updated.fame * 2,
        verified: true
      });
    }
  } else if (effectiveOutcome === 'draw') {
    updated.record.draws += 1;
    postEntry.completed = true;
    postEntry.result = 'empate';
    postEntry.dateCompleted = { ...updated.currentDate };
  } else {
    updated.record.losses += 1;
    postEntry.completed = true;
    postEntry.result = 'derrota';
    postEntry.dateCompleted = { ...updated.currentDate };
    updated.stress = Math.min(100, updated.stress + 8);
    updated.mentalHealth = Math.max(10, updated.mentalHealth - 6);
  }

  const staminaDrain = Math.min(40, Math.max(12, Math.round(state.totalTimeElapsedSeconds / 12)));
  updated.energy = Math.max(5, updated.energy - staminaDrain);
  updated.accumulatedFatigue = Math.min(100, (updated.accumulatedFatigue || 0) + 5);
  updated.age = getRealAthleteAge(updated);

  return {
    updatedChar: updated,
    alreadyHomologated: false,
    effectiveOutcome
  };
}
