import { Character, CombatState, GameDate, SavedFightLogEntry } from '../types/game';
import { BjjMatchState } from '../types/bjjCombatEngine';
import { BJJ_TECHNIQUES_CATALOG } from '../data/bjjTechniquesCatalog';
import { BoxingMatchState } from '../types/boxingCombat';
import { BOXING_TECHNIQUES_CATALOG } from '../data/boxingCatalogData';

function formatMatchClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function buildBjjSavedFightLog(
  state: BjjMatchState,
  date: GameDate,
  options?: {
    id?: string;
    winner?: 'player' | 'opponent' | 'draw';
    tournamentName?: string;
    stageName?: string;
    methodOverride?: string;
  }
): SavedFightLogEntry {
  const effectiveWinner: 'player' | 'opponent' | 'draw' =
    options?.winner ??
    (state.winner === 'athlete_a' ? 'player' : state.winner === 'athlete_b' ? 'opponent' : 'draw');

  const method =
    options?.methodOverride ||
    state.winMethod ||
    (state.status === 'finalizada' ? 'Finalização' : 'Pontos');

  const scoreSummary = `${state.score.pointsA}x${state.score.pointsB} (${state.score.advantagesA}v/${state.score.penaltiesA}p vs ${state.score.advantagesB}v/${state.score.penaltiesB}p)`;

  const maxEntries = 60;
  const rawHistory = Array.isArray(state.history) ? state.history : [];
  const slicedHistory = rawHistory.length > maxEntries ? rawHistory.slice(-maxEntries) : rawHistory;

  const entries = slicedHistory.map((rec) => {
    const playerTechName = rec.actionA?.techniqueId
      ? BJJ_TECHNIQUES_CATALOG[rec.actionA.techniqueId]?.displayName || rec.actionA.techniqueId
      : 'Recuperar Fôlego & Base';
    const oppTechName = rec.actionB?.techniqueId
      ? BJJ_TECHNIQUES_CATALOG[rec.actionB.techniqueId]?.displayName || rec.actionB.techniqueId
      : 'Base & Postura';

    const ptsParts: string[] = [];
    if (rec.pointsAwardedA > 0) ptsParts.push(`Você +${rec.pointsAwardedA} pts`);
    if (rec.pointsAwardedB > 0) ptsParts.push(`Rival +${rec.pointsAwardedB} pts`);
    if (rec.advantageAwardedA) ptsParts.push('Você +1 Vant.');
    if (rec.advantageAwardedB) ptsParts.push('Rival +1 Vant.');

    return {
      step: rec.cycleNumber,
      timeLabel: formatMatchClock(rec.matchTimeSeconds),
      playerAction: playerTechName,
      opponentAction: oppTechName,
      narration: rec.technicalNarration,
      factor: rec.decidingFactor,
      pointsInfo: ptsParts.length > 0 ? ptsParts.join(' • ') : undefined
    };
  });

  const fallbackId = `bjj_${state.matchId || state.rngSeed}_${state.matchTimeElapsedSeconds}_${rawHistory.length}`;

  return {
    id: options?.id || fallbackId,
    arena: 'bjj',
    matchType: state.matchType || 'sparring',
    art: 'jiujitsu',
    isGi: state.isGi !== false,
    tournamentName: options?.tournamentName || state.tournamentContext?.tournamentName,
    stageName: options?.stageName || state.tournamentContext?.stageName,
    date: { ...date },
    opponentName: state.athleteB.name,
    opponentNickname: state.athleteB.nickname || undefined,
    winner: effectiveWinner,
    method,
    scoreSummary,
    durationSeconds: state.matchTimeElapsedSeconds,
    totalCyclesOrRounds: rawHistory.length,
    entries
  };
}

export function buildTraditionalSavedFightLog(
  finalState: CombatState,
  date: GameDate,
  options?: {
    id?: string;
    winner?: 'player' | 'opponent' | 'draw';
    stageName?: string;
    methodOverride?: string;
  }
): SavedFightLogEntry {
  const effectiveWinner: 'player' | 'opponent' | 'draw' =
    options?.winner ?? (finalState.winner === 'player' ? 'player' : finalState.winner === 'draw' ? 'draw' : 'opponent');

  const method = options?.methodOverride || finalState.winMethod || 'Pontos';
  const scoreSummary = `${finalState.player.points} x ${finalState.opponent.points}`;

  const rawLogs = Array.isArray(finalState.log) ? finalState.log : [];
  const maxEntries = 60;
  const sliced = rawLogs.length > maxEntries ? rawLogs.slice(-maxEntries) : rawLogs;

  const entries = sliced.map((entry, idx) => ({
    step: rawLogs.length - sliced.length + idx + 1,
    timeLabel: entry.type.toUpperCase(),
    narration: entry.text
  }));

  const fallbackId = `trad_${finalState.tournament.id}_${options?.stageName || finalState.stageName}_${date.year}_${date.month}_${rawLogs.length}`;

  return {
    id: options?.id || fallbackId,
    arena: 'tradicional',
    matchType: 'competicao',
    art: finalState.tournament.art,
    tournamentName: finalState.tournament.name,
    stageName: options?.stageName || finalState.stageName,
    date: { ...date },
    opponentName: finalState.opponent.name,
    opponentNickname: finalState.opponent.nickname || undefined,
    winner: effectiveWinner,
    method,
    scoreSummary,
    totalCyclesOrRounds: finalState.round,
    entries
  };
}

export function buildBoxingSavedFightLog(
  state: BoxingMatchState,
  date: GameDate,
  options?: {
    id?: string;
    winner?: 'player' | 'opponent' | 'draw';
    tournamentName?: string;
    stageName?: string;
    methodOverride?: string;
  }
): SavedFightLogEntry {
  const effectiveWinner: 'player' | 'opponent' | 'draw' =
    options?.winner ??
    (state.winner === 'boxer_a' ? 'player' : state.winner === 'boxer_b' ? 'opponent' : 'draw');

  const method = options?.methodOverride || state.winMethod || 'Pontos (Decisão Unânime)';

  const ptsA = state.roundScores.reduce((acc, r) => acc + r.pointsA, 0);
  const ptsB = state.roundScores.reduce((acc, r) => acc + r.pointsB, 0);
  const scoreSummary =
    state.judgeCards && state.judgeCards.length > 0
      ? state.judgeCards.map((c) => `${c.totalA}-${c.totalB}`).join(' / ')
      : state.roundScores.length > 0
      ? `${ptsA}-${ptsB} (${state.boxerA.stats.punchesLanded}x${state.boxerB.stats.punchesLanded} golpes)`
      : `${state.boxerA.stats.punchesLanded}x${state.boxerB.stats.punchesLanded} golpes`;

  const maxEntries = 60;
  const rawHistory = Array.isArray(state.history) ? state.history : [];
  const sliced = rawHistory.length > maxEntries ? rawHistory.slice(-maxEntries) : rawHistory;

  const entries = sliced.map((rec) => {
    const pName = rec.actionA?.techniqueId
      ? BOXING_TECHNIQUES_CATALOG[rec.actionA.techniqueId]?.displayName || rec.techniqueNameA
      : 'Guarda Alta & Recuperar Fôlego';
    const oName = rec.actionB?.techniqueId
      ? BOXING_TECHNIQUES_CATALOG[rec.actionB.techniqueId]?.displayName || rec.techniqueNameB
      : 'Guarda Alta & Recuperar Fôlego';

    const infoParts: string[] = [];
    if (rec.isKnockdownOnB) infoParts.push(`KD sobre Rival (${rec.refereeCount})`);
    if (rec.isKnockdownOnA) infoParts.push(`KD sofrido (${rec.refereeCount})`);
    if (rec.isCounterByA) infoParts.push('Contra-golpe seu!');
    if (rec.isCounterByB) infoParts.push('Contra-golpe rival');
    if (rec.damageToB > 0) infoParts.push(`Dano Rival -${Math.round(rec.damageToB)}`);

    return {
      step: rec.cycleNumber,
      timeLabel: `R${rec.roundNumber} ${formatMatchClock(rec.roundTimeElapsed)}`,
      playerAction: pName,
      opponentAction: oName,
      narration: rec.narration,
      factor: rec.betweenRoundSummary || rec.highlightTag,
      pointsInfo: infoParts.length > 0 ? infoParts.join(' • ') : undefined
    };
  });

  const fallbackId = `box_${state.matchId || state.rngSeed}_${state.totalTimeElapsedSeconds}_${rawHistory.length}`;

  return {
    id: options?.id || fallbackId,
    arena: 'boxe',
    matchType: state.matchType || 'sparring',
    art: 'boxe',
    tournamentName: options?.tournamentName,
    stageName: options?.stageName,
    date: { ...date },
    opponentName: state.boxerB.name,
    opponentNickname: state.boxerB.nickname || undefined,
    winner: effectiveWinner,
    method,
    scoreSummary,
    durationSeconds: state.totalTimeElapsedSeconds,
    totalCyclesOrRounds: state.roundScores.length || state.currentRound,
    entries
  };
}

export function appendSavedFightLog(
  char: Character,
  entry: SavedFightLogEntry,
  maxLogs: number = 15
): Character {
  const existing = Array.isArray(char.recentFightLogs) ? char.recentFightLogs : [];
  if (existing.some((item) => item.id === entry.id)) {
    return char;
  }
  const boundedEntry: SavedFightLogEntry = {
    ...entry,
    entries: Array.isArray(entry.entries) ? entry.entries.slice(-60) : []
  };
  return {
    ...char,
    recentFightLogs: [boundedEntry, ...existing].slice(0, maxLogs)
  };
}
