/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Character, MartialArtType, CombatState, FightFighter, Tournament, BracketFighterSlot } from './types/game';
import { loadGame, saveGame, advanceMonth, clearGameSave } from './utils/characterHelper';
import { formatGameDate, formatCareerDuration } from './utils/dateUtils';
import { createInitialCombatState } from './utils/fightEngine';
import { RANDOM_LIFE_EVENTS, LifeRandomEvent } from './data/lifeEventsData';
import { MARTIAL_ARTS_META } from './data/martialArtsData';
import { sounds } from './utils/audio';
import { promoteGraduation } from './utils/graduationHelper';
import { getEligibleHeirs, inheritLegacyCharacter } from './utils/dynastyHelper';
import { getTournamentFamilySupport } from './utils/tournamentFamilySupportHelper';

// Components
import { CharacterCreation } from './components/CharacterCreation';
import { HeaderNav, ActiveTab } from './components/HeaderNav';
import { DojoTrainingView } from './components/DojoTrainingView';
import { CombatArenaView } from './components/CombatArenaView';
import { BjjCombatArenaView } from './components/bjj/BjjCombatArenaView';
import { BoxingCombatArenaView } from './components/boxing/BoxingCombatArenaView';
import { CompetitionsView } from './components/CompetitionsView';
import { FighterSheetView } from './components/FighterSheetView';
import { WorldGymsView } from './components/WorldGymsView';
import { LifeAndCareerView } from './components/LifeAndCareerView';
import { SocialFeedView } from './components/SocialFeedView';
import { RankingsView } from './components/RankingsView';
import { CalendarView } from './components/CalendarView';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { EquipmentShopView } from './components/EquipmentShopView';
import { BeltCeremonyModal } from './components/BeltCeremonyModal';
import { getEffectiveAttributes } from './utils/equipmentShopHelper';
import { BjjCombatAthlete, BjjMatchState } from './types/bjjCombatEngine';
import { BjjCombatStyle } from './types/bjjAi';
import {
  BoxingAiStyle,
  BoxingCombatAthlete,
  BoxingMatchState,
  BoxingRulesMode
} from './types/boxingCombat';
import {
  ensureTournamentBracket,
  getPlayerCurrentBracketMatch,
  resolvePlayerBracketMatch
} from './utils/tournamentBracket';
import {
  homologateBjjTournamentMatchResult,
  homologateBoxingTournamentMatchResult,
  isTournamentMatchAlreadyHomologated,
  persistInProgressBjjMatchState,
  persistInProgressBoxingMatchState,
  prepareBjjTournamentMatchSession,
  prepareBoxingTournamentMatchSession,
  updateOpponentRecordAfterFight
} from './utils/tournamentFlow';
import { getTournamentTimelineInfo, validateTournamentEligibility } from './utils/tournamentTimeline';
import {
  appendSavedFightLog,
  buildBjjSavedFightLog,
  buildBoxingSavedFightLog,
  buildTraditionalSavedFightLog
} from './utils/fightLogHelper';

interface BjjTournamentMatchContext {
  tournament: Tournament;
  year: number;
  stageName: 'Quartas de Final' | 'Semifinal' | 'Grande Final';
  currentStage: 'quartas' | 'semifinal' | 'final';
  matchId: string;
  isGi: boolean;
  opponent: BjjCombatAthlete;
  opponentSlot: BracketFighterSlot;
  aiStyle?: BjjCombatStyle;
  initialMatchState?: BjjMatchState;
  durationSeconds?: number;
  weightDivisionLabel?: string;
  weightMaxKg?: number | null;
  ageDivisionLabel?: string;
  genderDivision?: 'M' | 'F';
  rankDivisionLabel?: string;
  giColor?: string;
}

interface LegacyTournamentMatchContext {
  stage: 'quartas' | 'semifinal' | 'final';
  stageName: 'Quartas de Final' | 'Semifinal' | 'Grande Final';
  matchId: string;
  opponentSlot: BracketFighterSlot;
}

interface BoxingTournamentMatchContext {
  tournament: Tournament;
  year: number;
  stageName: 'Quartas de Final' | 'Semifinal' | 'Grande Final';
  currentStage: 'quartas' | 'semifinal' | 'final';
  matchId: string;
  opponent: BoxingCombatAthlete;
  opponentSlot: BracketFighterSlot;
  aiStyle?: BoxingAiStyle;
  initialMatchState?: BoxingMatchState;
  rulesMode?: BoxingRulesMode;
  totalRounds?: number;
  roundDurationSeconds?: number;
  weightDivisionLabel?: string;
  weightMaxKg?: number | null;
  ageDivisionLabel?: string;
  genderDivision?: 'M' | 'F';
  rankDivisionLabel?: string;
}

export default function App() {
  const [character, setCharacter] = useState<Character | null>(() => loadGame());
  const [activeTab, setActiveTab] = useState<ActiveTab>('ficha');
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [ceremonyArt, setCeremonyArt] = useState<MartialArtType | null>(null);
  const [monthlyLogs, setMonthlyLogs] = useState<string[] | null>(null);
  const [birthdayCelebrated, setBirthdayCelebrated] = useState<boolean>(false);
  const [activeRandomEvent, setActiveRandomEvent] = useState<LifeRandomEvent | null>(null);
  const [isBjjArenaOpen, setIsBjjArenaOpen] = useState<boolean>(false);
  const [bjjTournamentMatch, setBjjTournamentMatch] = useState<BjjTournamentMatchContext | null>(null);
  const [isBoxingArenaOpen, setIsBoxingArenaOpen] = useState<boolean>(false);
  const [boxingTournamentMatch, setBoxingTournamentMatch] = useState<BoxingTournamentMatchContext | null>(null);
  const [legacyTournamentMatch, setLegacyTournamentMatch] = useState<LegacyTournamentMatchContext | null>(null);

  // Auto-save on state change
  useEffect(() => {
    if (character) {
      saveGame(character);
    }
  }, [character]);

  const handleCharacterCreated = (newChar: Character) => {
    setCharacter(newChar);
    saveGame(newChar);
  };

  const handleUpdateCharacter = (updated: Character) => {
    setCharacter(updated);
  };

  const handleAdvanceMonth = () => {
    if (!character || character.isAlive === false) return;
    const { updatedChar, monthLog, promotedArt, birthdayCelebrated: isBday } = advanceMonth(character);

    // Random life event chance (35% per month)
    if (Math.random() < 0.35) {
      const eligibleEvents = RANDOM_LIFE_EVENTS.filter((e) => {
        if (e.minAge && updatedChar.age < e.minAge) return false;
        if (e.maxAge && updatedChar.age > e.maxAge) return false;
        return true;
      });
      if (eligibleEvents.length > 0) {
        const picked = eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
        setActiveRandomEvent(picked);
      }
    }

    if (isBday) {
      sounds.playCheer();
      setBirthdayCelebrated(true);
    } else {
      setBirthdayCelebrated(false);
    }

    if (promotedArt) {
      setCeremonyArt(promotedArt);
    }

    setCharacter(updatedChar);
    setMonthlyLogs(monthLog);
  };

  const startBjjTournamentMatch = (tournament: Tournament) => {
    if (!character) return;

    const prep = prepareBjjTournamentMatchSession(character, tournament);
    if (!prep.success || !prep.session || !prep.opponentAthlete) {
      setActiveTab('campeonatos');
      return;
    }

    setCharacter(prep.updatedChar);
    setBjjTournamentMatch({
      tournament,
      year: prep.session.year,
      stageName: prep.session.stageName,
      currentStage: prep.session.stage,
      matchId: prep.session.matchId,
      isGi: prep.session.isGi,
      opponent: prep.opponentAthlete,
      opponentSlot: prep.session.opponentSlot,
      aiStyle: prep.aiStyle,
      initialMatchState: prep.initialMatchState,
      durationSeconds: prep.matchDurationSeconds,
      weightDivisionLabel: prep.session.weightDivisionLabel,
      weightMaxKg: prep.session.weightMaxKg,
      ageDivisionLabel: prep.session.ageDivisionLabel,
      genderDivision: prep.session.genderDivision,
      rankDivisionLabel: prep.session.rankDivisionLabel,
      giColor: prep.session.giColor
    });
    setIsBjjArenaOpen(true);
  };

  const startBoxingTournamentMatch = (tournament: Tournament) => {
    if (!character) return;

    const prep = prepareBoxingTournamentMatchSession(character, tournament);
    if (!prep.success || !prep.session || !prep.opponentAthlete) {
      setActiveTab('campeonatos');
      return;
    }

    setCharacter(prep.updatedChar);
    setBoxingTournamentMatch({
      tournament,
      year: prep.session.year,
      stageName: prep.session.stageName,
      currentStage: prep.session.stage,
      matchId: prep.session.matchId,
      opponent: prep.opponentAthlete,
      opponentSlot: prep.session.opponentSlot,
      aiStyle: prep.aiStyle,
      initialMatchState: prep.initialMatchState,
      rulesMode: prep.rulesMode,
      totalRounds: prep.totalRounds,
      roundDurationSeconds: prep.roundDurationSeconds,
      weightDivisionLabel: prep.session.weightDivisionLabel,
      weightMaxKg: prep.session.weightMaxKg,
      ageDivisionLabel: prep.session.ageDivisionLabel,
      genderDivision: prep.session.genderDivision,
      rankDivisionLabel: prep.session.rankDivisionLabel
    });
    setIsBoxingArenaOpen(true);
  };

  const handleStartTournament = (tournament: Tournament) => {
    if (!character) return;

    // Se for competição de Jiu-Jitsu ou regras de pontuação BJJ, abre a arena especializada BJJ
    if (tournament.art === 'jiujitsu' || tournament.rulesType === 'bjj_points') {
      startBjjTournamentMatch(tournament);
      return;
    }

    // Se for competição de Boxe ou regras 10-Point Must, abre a arena especializada de Boxe
    if (tournament.art === 'boxe' || tournament.rulesType === 'boxing_10must') {
      startBoxingTournamentMatch(tournament);
      return;
    }

    // Modalidades legadas (Boxe, Muay Thai, Karatê, Judô, Capoeira, Luta Livre, MMA)
    // Permanecem 100% no motor legado CombatArenaView, com validação cronológica e de elegibilidade
    const timeline = getTournamentTimelineInfo(tournament, character.currentDate, character);
    const savedEntry = timeline.historyEntry;
    const entrySelection =
      savedEntry && (savedEntry.weightDivisionId || savedEntry.weightDivisionLabel || savedEntry.genderDivision)
        ? {
            weightDivisionId: savedEntry.weightDivisionId,
            weightClassLabel: savedEntry.weightDivisionLabel,
            minWeightKg: savedEntry.weightMinKg,
            maxWeightKg: savedEntry.weightMaxKg,
            ageDivisionId: savedEntry.ageDivisionId,
            ageDivisionLabel: savedEntry.ageDivisionLabel,
            rankDivisionId: savedEntry.rankDivisionId,
            rankDivisionLabel: savedEntry.rankDivisionLabel,
            gender: savedEntry.genderDivision
          }
        : undefined;
    const eligibility = validateTournamentEligibility(
      character,
      tournament,
      timeline.tournamentYear,
      entrySelection
    );
    if (!timeline.canFight || !eligibility.eligible) {
      setActiveTab('campeonatos');
      return;
    }

    const { updatedChar, entry, bracket } = ensureTournamentBracket(
      character,
      tournament,
      timeline.tournamentYear,
      entrySelection
    );
    setCharacter(updatedChar);

    const scheduled = getPlayerCurrentBracketMatch(bracket);
    const currentStage: 'quartas' | 'semifinal' | 'final' =
      scheduled?.match.stage || entry.currentStage || (tournament.bracketSize === 8 ? 'quartas' : 'semifinal');
    const stageName: 'Quartas de Final' | 'Semifinal' | 'Grande Final' =
      currentStage === 'quartas' ? 'Quartas de Final' : currentStage === 'semifinal' ? 'Semifinal' : 'Grande Final';

    const oppSlot = scheduled?.opponent || bracket.participants[1];
    const crowdSupport = getTournamentFamilySupport(
      updatedChar,
      tournament,
      oppSlot.id,
      oppSlot.name
    );

    const effectivePlayerAttrs = getEffectiveAttributes(updatedChar);
    const playerFighter: FightFighter = {
      name: updatedChar.name,
      nickname: updatedChar.nickname,
      isPlayer: true,
      avatar: updatedChar.avatar,
      art: tournament.art,
      rankName: updatedChar.artGraduations[tournament.art].name,
      weight: updatedChar.weight,
      hp: 100 + Math.round(effectivePlayerAttrs.durability * 1.5),
      maxHp: 100 + Math.round(effectivePlayerAttrs.durability * 1.5),
      stamina: 100 + Math.round(effectivePlayerAttrs.stamina * 1.2),
      maxStamina: 100 + Math.round(effectivePlayerAttrs.stamina * 1.2),
      guard: 100,
      attributes: {
        ...effectivePlayerAttrs,
        mentalFocus: Math.min(99, effectivePlayerAttrs.mentalFocus + Math.round(crowdSupport.focusBonus))
      },
      points: 0,
      penalties: 0,
      advantages: 0,
      roundsWon: 0,
      knockdowns: 0,
      cuts: 0
    };

    const opponentFighter: FightFighter = {
      name: oppSlot.name,
      nickname: oppSlot.nickname,
      isPlayer: false,
      avatar: oppSlot.avatar,
      art: tournament.art,
      rankName: oppSlot.belt,
      weight: oppSlot.weight,
      hp: 95 + Math.round(oppSlot.attributes.durability * 1.4),
      maxHp: 95 + Math.round(oppSlot.attributes.durability * 1.4),
      stamina: 95 + Math.round(oppSlot.attributes.stamina * 1.1),
      maxStamina: 95 + Math.round(oppSlot.attributes.stamina * 1.1),
      guard: 100,
      attributes: { ...oppSlot.attributes },
      points: 0,
      penalties: 0,
      advantages: 0,
      roundsWon: 0,
      knockdowns: 0,
      cuts: 0
    };

    setLegacyTournamentMatch({
      stage: currentStage,
      stageName,
      matchId: scheduled?.match.matchId || `${tournament.id}_${currentStage}_${updatedChar.currentYear}`,
      opponentSlot: oppSlot
    });

    const initialCombat = createInitialCombatState(
      tournament,
      playerFighter,
      opponentFighter,
      stageName
    );

    setCombatState(initialCombat);
  };

  const handleFightComplete = (finalState: CombatState) => {
    if (!character) return;
    let updated = JSON.parse(JSON.stringify(character)) as Character;
    const isWin = finalState.winner === 'player';
    const isDraw = finalState.winner === 'draw';
    const outcome: 'player' | 'opponent' | 'draw' = isWin ? 'player' : isDraw ? 'draw' : 'opponent';
    const methodLabel = finalState.winMethod || 'Pontos';

    const currentT = finalState.tournament;
    const { updatedChar: withBracketChar } = ensureTournamentBracket(updated, currentT);
    updated = withBracketChar;

    const tournamentMonth = currentT.monthScheduled ?? (((currentT.weekScheduled - 1) % 12) + 1);
    const entry = updated.tournamentHistory!.find(
      (h) => h.tournamentId === currentT.id && h.year === updated.currentYear
    )!;

    const currentStage: 'quartas' | 'semifinal' | 'final' =
      legacyTournamentMatch?.stage || entry.currentStage || (currentT.bracketSize === 8 ? 'quartas' : 'semifinal');
    const stageName = legacyTournamentMatch?.stageName || finalState.stageName || 'Semifinal';
    const oppSlot = legacyTournamentMatch?.opponentSlot || entry.bracket!.participants[1];
    const matchId = legacyTournamentMatch?.matchId || `${currentT.id}_${currentStage}_${updated.currentYear}`;

    if (!entry.homologatedMatchIds) entry.homologatedMatchIds = [];
    if (!entry.matchHistory) entry.matchHistory = [];

    if (isTournamentMatchAlreadyHomologated(entry, matchId)) {
      setCombatState(null);
      setLegacyTournamentMatch(null);
      return;
    }

    const scoreDesc =
      finalState.judgeScores && finalState.judgeScores.length > 0
        ? `${finalState.player.points}x${finalState.opponent.points}`
        : `${finalState.player.points} pts x ${finalState.opponent.points} pts`;

    // Atualiza chaveamento e simula lutas paralelas IA vs IA
    let nextStage: 'semifinal' | 'final' | undefined;
    let aiFeedLine = '';
    let effectiveOutcome: 'player' | 'opponent' | 'draw' = outcome;
    let tiebreakApplied = false;
    let tiebreakCriterion: string | undefined;

    if (entry.bracket) {
      const resolved = resolvePlayerBracketMatch(
        entry.bracket,
        currentT,
        currentStage,
        outcome,
        methodLabel,
        scoreDesc,
        { matchId }
      );
      entry.bracket = resolved.updatedBracket;
      nextStage = resolved.nextStage;
      effectiveOutcome = resolved.effectiveOutcome;
      tiebreakApplied = resolved.tiebreakApplied;
      tiebreakCriterion = resolved.tiebreakCriterion;
      if (resolved.simulatedAiResults.length > 0) {
        const summary = resolved.simulatedAiResults[0];
        aiFeedLine = ` Na outra chave: ${summary.winnerName} venceu ${summary.loserName} (${summary.method}).`;
      }
    }

    entry.homologatedMatchIds.push(matchId);
    entry.matchHistory.push({
      matchId,
      stage: stageName,
      opponentName: finalState.opponent.name,
      winner: effectiveOutcome,
      method: tiebreakApplied ? `${methodLabel} (Desempate)` : methodLabel,
      scoreSummary: scoreDesc,
      tiebreakCriterion,
      resultType: tiebreakApplied ? 'desempate' : 'combate',
      recordedAt: { ...updated.currentDate }
    });

    // Atualiza cartel do NPC adversário
    updated = updateOpponentRecordAfterFight(updated, oppSlot, effectiveOutcome, methodLabel);
    const postEntry = updated.tournamentHistory!.find(
      (h) => h.tournamentId === currentT.id && h.year === updated.currentYear
    )!;

    if (effectiveOutcome === 'player') {
      updated.record.wins += 1;
      if (finalState.winMethod === 'KO' || finalState.winMethod === 'TKO') updated.record.kos += 1;
      if (finalState.winMethod === 'Finalização') updated.record.submissions += 1;
      if (finalState.winMethod === 'Pontos' || finalState.winMethod === 'Ippon') updated.record.pointsWins += 1;
      if (currentT.art === 'mma') updated.record.mmaWins += 1;
      postEntry.matchesWon = (postEntry.matchesWon || 0) + 1;

      if (nextStage) {
        postEntry.currentStage = nextStage;
        postEntry.completed = false;
        updated.fame = Math.min(1000, updated.fame + 12);
        updated.hype = Math.min(100, updated.hype + 6);

        updated.socialFeed.unshift({
          id: `news_${matchId}_${Date.now()}`,
          author: 'Canal Combate & Tatame News',
          handle: '@tatame_news_oficial',
          text: `⚡ AVANÇOU! ${updated.name} "${updated.nickname}" superou ${finalState.opponent.name} (${stageName}) no ${currentT.name} por ${methodLabel}!${aiFeedLine}`,
          time: 'Agora',
          likes: 110 + updated.fame * 2,
          verified: true
        });
      } else {
        // Campeão da Grande Final!
        postEntry.completed = true;
        postEntry.result = 'vitoria';
        postEntry.trophyEarned = currentT.trophyName;
        postEntry.dateCompleted = { ...updated.currentDate };

        if (!postEntry.rewardsClaimed) {
          postEntry.rewardsClaimed = true;
          updated.money += currentT.rewardMoney;
          updated.fame = Math.min(1000, updated.fame + currentT.rewardReputation);
          updated.hype = Math.min(100, updated.hype + currentT.rewardHype);
          updated.honor = Math.min(100, updated.honor + 15);

          const alreadyHasTrophyThisYear = updated.trophies.some(
            (tr) => (tr.tournamentId === currentT.id || tr.tournamentName === currentT.name) && tr.year === updated.currentYear
          );
          if (!alreadyHasTrophyThisYear) {
            updated.trophies.push({
              id: `trophy_${currentT.id}_${updated.currentYear}`,
              tournamentId: currentT.id,
              tournamentName: currentT.name,
              year: updated.currentYear,
              art: currentT.art,
              tier: currentT.scope
            });
          }
        }

        updated.socialFeed.unshift({
          id: `news_${matchId}_${Date.now()}`,
          author: 'Canal Combate & Tatame News',
          handle: '@tatame_news_oficial',
          text: `🔥 CAMPEÃO OURO! ${updated.name} "${updated.nickname}" venceu ${finalState.opponent.name} na Grande Final do ${currentT.name} por ${methodLabel}!`,
          time: 'Agora',
          likes: 220 + updated.fame * 2,
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
      if (currentT.art === 'mma') updated.record.mmaLosses += 1;
      updated.stress = Math.min(100, updated.stress + 10);
      updated.mentalHealth = Math.max(10, updated.mentalHealth - 10);
      postEntry.completed = true;
      postEntry.result = 'derrota';
      postEntry.dateCompleted = { ...updated.currentDate };
    }

    postEntry.month = tournamentMonth;
    postEntry.registered = true;
    postEntry.weighInPassed = true;

    updated = appendSavedFightLog(
      updated,
      buildTraditionalSavedFightLog(finalState, updated.currentDate, {
        id: `trad_${matchId}_${updated.currentYear}`,
        winner: effectiveOutcome,
        stageName,
        methodOverride: tiebreakApplied ? `${methodLabel} (Desempate)` : methodLabel
      })
    );

    setCharacter(updated);
    setCombatState(null);
    setLegacyTournamentMatch(null);
  };

  const handlePromoteConfirm = (options?: { ceremonyCost?: number; paidByFamily?: boolean; masterName?: string }) => {
    if (!character || !ceremonyArt) return;
    const { updatedChar, success } = promoteGraduation(character, ceremonyArt, options);
    if (success) {
      if (options?.ceremonyCost && !options.paidByFamily) {
        updatedChar.money = Math.max(0, updatedChar.money - options.ceremonyCost);
      }
      setCharacter(updatedChar);
    }
    setCeremonyArt(null);
  };

  // If no character, show character creation
  if (!character) {
    return <CharacterCreation onCharacterCreated={handleCharacterCreated} />;
  }

  // If specialized BJJ isometric arena is open
  if (isBjjArenaOpen) {
    return (
      <BjjCombatArenaView
        character={character}
        matchType={bjjTournamentMatch ? 'competicao' : 'sparring'}
        matchId={bjjTournamentMatch?.matchId}
        tournamentContext={
          bjjTournamentMatch
            ? {
                tournamentId: bjjTournamentMatch.tournament.id,
                tournamentName: bjjTournamentMatch.tournament.name,
                organization: bjjTournamentMatch.tournament.organization,
                stageName: bjjTournamentMatch.stageName,
                weightClass: bjjTournamentMatch.tournament.weightClass,
                weightDivisionLabel: bjjTournamentMatch.weightDivisionLabel,
                ageDivisionLabel: bjjTournamentMatch.ageDivisionLabel,
                genderDivision: bjjTournamentMatch.genderDivision,
                rankDivisionLabel: bjjTournamentMatch.rankDivisionLabel,
                giColor: bjjTournamentMatch.giColor,
                targetWeight:
                  bjjTournamentMatch.weightMaxKg !== undefined
                    ? bjjTournamentMatch.weightMaxKg
                    : bjjTournamentMatch.tournament.targetWeight,
                rewardMoney: bjjTournamentMatch.tournament.rewardMoney,
                rewardReputation: bjjTournamentMatch.tournament.rewardReputation,
                rewardHype: bjjTournamentMatch.tournament.rewardHype,
                trophyName: bjjTournamentMatch.tournament.trophyName
              }
            : undefined
        }
        opponentData={bjjTournamentMatch?.opponent}
        initialDuration={
          bjjTournamentMatch?.durationSeconds ?? bjjTournamentMatch?.tournament.roundDurationSeconds
        }
        initialIsGi={bjjTournamentMatch ? bjjTournamentMatch.isGi : undefined}
        initialAiStyle={bjjTournamentMatch?.aiStyle}
        initialMatchState={bjjTournamentMatch?.initialMatchState}
        onMatchStateChange={(nextMatchState) => {
          if (!bjjTournamentMatch) return;
          setCharacter((prev) =>
            prev
              ? persistInProgressBjjMatchState(
                  prev,
                  bjjTournamentMatch.tournament.id,
                  bjjTournamentMatch.year,
                  nextMatchState
                )
              : prev
          );
        }}
        onExit={() => {
          setIsBjjArenaOpen(false);
          setBjjTournamentMatch(null);
          setActiveTab('campeonatos');
        }}
        onUpdateCharacterRepertoire={(updatedRep) => {
          setCharacter((prev) => {
            if (!prev) return prev;
            const updated = JSON.parse(JSON.stringify(prev)) as Character;
            updated.bjjTechniqueRepertoire = updatedRep;
            return updated;
          });
        }}
        onFightComplete={(winner, state) => {
          setCharacter((prev) => {
            if (!prev) return prev;
            if (state.matchType === 'competicao' && bjjTournamentMatch) {
              const res = homologateBjjTournamentMatchResult(prev, {
                tournament: bjjTournamentMatch.tournament,
                year: bjjTournamentMatch.year,
                stage: bjjTournamentMatch.currentStage,
                stageName: bjjTournamentMatch.stageName,
                matchId: bjjTournamentMatch.matchId,
                opponentSlot: bjjTournamentMatch.opponentSlot,
                winner,
                state
              });
              if (res.alreadyHomologated) {
                return res.updatedChar;
              }
              return appendSavedFightLog(
                res.updatedChar,
                buildBjjSavedFightLog(state, res.updatedChar.currentDate, {
                  id: `bjj_${bjjTournamentMatch.matchId}_${bjjTournamentMatch.year}`,
                  winner: res.effectiveOutcome,
                  tournamentName: bjjTournamentMatch.tournament.name,
                  stageName: bjjTournamentMatch.stageName,
                  methodOverride: res.tiebreakApplied
                    ? `${state.winMethod || 'Pontos'} (Desempate)`
                    : undefined
                })
              );
            }

            // Sparring Livre: impacto apenas no humor, gás e fadiga (isolado da chave e cartel oficial)
            let updated = JSON.parse(JSON.stringify(prev)) as Character;
            if (winner === 'player') {
              updated.mentalHealth = Math.min(100, updated.mentalHealth + 4);
              updated.stress = Math.max(0, updated.stress - 5);
            } else if (winner === 'opponent') {
              updated.stress = Math.min(100, updated.stress + 3);
            }
            const staminaDrain = Math.min(40, Math.max(10, Math.round(state.matchTimeElapsedSeconds / 10)));
            updated.energy = Math.max(5, updated.energy - staminaDrain);
            updated.accumulatedFatigue = Math.min(100, (updated.accumulatedFatigue || 0) + 4);
            updated = appendSavedFightLog(
              updated,
              buildBjjSavedFightLog(state, updated.currentDate, { winner })
            );
            return updated;
          });
        }}
      />
    );
  }

  // If specialized Boxing isometric arena is open
  if (isBoxingArenaOpen) {
    return (
      <BoxingCombatArenaView
        character={character}
        matchType={boxingTournamentMatch ? 'competicao' : 'sparring'}
        matchId={boxingTournamentMatch?.matchId}
        tournamentContext={
          boxingTournamentMatch
            ? {
                tournamentId: boxingTournamentMatch.tournament.id,
                tournamentName: boxingTournamentMatch.tournament.name,
                organization: boxingTournamentMatch.tournament.organization,
                stageName: boxingTournamentMatch.stageName,
                weightClass: boxingTournamentMatch.tournament.weightClass,
                weightDivisionLabel: boxingTournamentMatch.weightDivisionLabel,
                ageDivisionLabel: boxingTournamentMatch.ageDivisionLabel,
                genderDivision: boxingTournamentMatch.genderDivision,
                rankDivisionLabel: boxingTournamentMatch.rankDivisionLabel,
                targetWeight:
                  boxingTournamentMatch.weightMaxKg !== undefined
                    ? boxingTournamentMatch.weightMaxKg
                    : boxingTournamentMatch.tournament.targetWeight,
                rewardMoney: boxingTournamentMatch.tournament.rewardMoney,
                rewardReputation: boxingTournamentMatch.tournament.rewardReputation,
                rewardHype: boxingTournamentMatch.tournament.rewardHype,
                trophyName: boxingTournamentMatch.tournament.trophyName
              }
            : undefined
        }
        opponentData={boxingTournamentMatch?.opponent}
        initialRulesMode={boxingTournamentMatch?.rulesMode}
        initialTotalRounds={boxingTournamentMatch?.totalRounds}
        initialRoundDurationSeconds={boxingTournamentMatch?.roundDurationSeconds}
        initialAiStyle={boxingTournamentMatch?.aiStyle}
        initialMatchState={boxingTournamentMatch?.initialMatchState}
        onMatchStateChange={(nextMatchState) => {
          if (!boxingTournamentMatch) return;
          setCharacter((prev) =>
            prev
              ? persistInProgressBoxingMatchState(
                  prev,
                  boxingTournamentMatch.tournament.id,
                  boxingTournamentMatch.year,
                  nextMatchState
                )
              : prev
          );
        }}
        onExit={() => {
          setIsBoxingArenaOpen(false);
          setBoxingTournamentMatch(null);
          setActiveTab('campeonatos');
        }}
        onFightComplete={(winner, state) => {
          setCharacter((prev) => {
            if (!prev) return prev;
            if (state.matchType === 'competicao' && boxingTournamentMatch) {
              const res = homologateBoxingTournamentMatchResult(prev, {
                tournament: boxingTournamentMatch.tournament,
                year: boxingTournamentMatch.year,
                stage: boxingTournamentMatch.currentStage,
                stageName: boxingTournamentMatch.stageName,
                matchId: boxingTournamentMatch.matchId,
                opponentSlot: boxingTournamentMatch.opponentSlot,
                winner,
                state
              });
              if (res.alreadyHomologated) return res.updatedChar;
              return appendSavedFightLog(
                res.updatedChar,
                buildBoxingSavedFightLog(state, res.updatedChar.currentDate, {
                  id: `box_${boxingTournamentMatch.matchId}_${boxingTournamentMatch.year}`,
                  winner: res.effectiveOutcome,
                  tournamentName: boxingTournamentMatch.tournament.name,
                  stageName: boxingTournamentMatch.stageName
                })
              );
            }

            // Sparring de Boxe: atualiza humor/gás/fadiga e registra histórico sem alterar cartel oficial
            let updated = JSON.parse(JSON.stringify(prev)) as Character;
            if (winner === 'player') {
              updated.mentalHealth = Math.min(100, updated.mentalHealth + 4);
              updated.stress = Math.max(0, updated.stress - 5);
            } else if (winner === 'opponent') {
              updated.stress = Math.min(100, updated.stress + 3);
            }
            const staminaDrain = Math.min(40, Math.max(10, Math.round(state.totalTimeElapsedSeconds / 12)));
            updated.energy = Math.max(5, updated.energy - staminaDrain);
            updated.accumulatedFatigue = Math.min(100, (updated.accumulatedFatigue || 0) + 4);
            updated = appendSavedFightLog(
              updated,
              buildBoxingSavedFightLog(state, updated.currentDate, { winner })
            );
            return updated;
          });
        }}
      />
    );
  }

  // If in combat, show combat arena
  if (combatState) {
    return (
      <CombatArenaView
        combatState={combatState}
        onFightComplete={handleFightComplete}
        playerMoves={character.moves}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      {/* Header & Status Bar */}
      <HeaderNav
        character={character}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAdvanceMonth={handleAdvanceMonth}
        onOpenBjjArena={() => setIsBjjArenaOpen(true)}
        onOpenBoxingArena={() => setIsBoxingArenaOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 py-4 sm:px-4 md:p-6 pb-24 md:pb-12">
        {activeTab === 'treino' && (
          <DojoTrainingView
            character={character}
            onUpdateCharacter={handleUpdateCharacter}
            onOpenBeltCeremony={(art) => setCeremonyArt(art)}
            onOpenBjjArena={() => setIsBjjArenaOpen(true)}
            onOpenBoxingArena={() => setIsBoxingArenaOpen(true)}
          />
        )}

        {activeTab === 'agenda' && (
          <WeeklyScheduleView
            character={character}
            onUpdateCharacter={handleUpdateCharacter}
          />
        )}

        {activeTab === 'campeonatos' && (
          <CompetitionsView
            character={character}
            onStartTournament={handleStartTournament}
            onUpdateCharacter={handleUpdateCharacter}
          />
        )}

        {activeTab === 'rankings' && (
          <RankingsView
            character={character}
            onUpdateCharacter={handleUpdateCharacter}
          />
        )}

        {activeTab === 'calendario' && (
          <CalendarView
            character={character}
            onAdvanceMonth={handleAdvanceMonth}
            onSelectTournament={(t) => {
              setActiveTab('campeonatos');
            }}
          />
        )}

        {activeTab === 'ficha' && (
          <FighterSheetView
            character={character}
            onUpdateCharacter={handleUpdateCharacter}
            onOpenShop={() => setActiveTab('loja')}
          />
        )}

        {activeTab === 'loja' && (
          <EquipmentShopView
            character={character}
            onUpdateCharacter={handleUpdateCharacter}
          />
        )}

        {activeTab === 'academias' && (
          <WorldGymsView
            character={character}
            onUpdateCharacter={handleUpdateCharacter}
          />
        )}

        {activeTab === 'vida' && (
          <LifeAndCareerView
            character={character}
            onUpdateCharacter={handleUpdateCharacter}
          />
        )}

        {activeTab === 'social' && (
          <SocialFeedView
            character={character}
            onUpdateCharacter={handleUpdateCharacter}
          />
        )}
      </main>

      {/* Belt Ceremony Celebration Modal */}
      {ceremonyArt && (
        <BeltCeremonyModal
          character={character}
          art={ceremonyArt}
          onClose={() => setCeremonyArt(null)}
          onPromoteConfirm={handlePromoteConfirm}
        />
      )}

      {/* Monthly Advance Summary Modal */}
      {monthlyLogs && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 animate-scaleIn max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{birthdayCelebrated ? '🎂' : '🗓️'}</span>
              <div>
                <h3 className="text-lg font-black text-white">
                  {birthdayCelebrated ? 'Mês de Aniversário & Transição' : 'Resumo da Transição Mensal'}
                </h3>
                <span className="text-xs text-amber-400 font-semibold block">
                  {formatGameDate(character.currentDate, 'full')} • {formatCareerDuration(character.careerMonthsElapsed)}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-neutral-300 bg-neutral-950 p-4 rounded-2xl border border-neutral-800 max-h-72 overflow-y-auto">
              {monthlyLogs.length === 0 ? (
                <div className="text-neutral-500 italic">Mês de dedicação, treinos constantes e disciplina diária.</div>
              ) : (
                monthlyLogs.map((log, idx) => (
                  <div 
                    key={idx} 
                    className={`leading-relaxed font-medium ${
                      log.includes('🎂') || log.includes('ANIVERSÁRIO') || log.includes('💍') || log.includes('🕊️') || log.includes('🎉')
                        ? 'text-pink-300 font-bold bg-pink-950/30 p-2 rounded-lg border border-pink-500/30'
                        : log.includes('🏋️')
                        ? 'text-cyan-300 font-bold bg-cyan-950/30 p-2 rounded-lg border border-cyan-500/30'
                        : log.includes('🤒') || log.includes('🩺')
                        ? 'text-amber-300 font-semibold bg-amber-950/20 p-2 rounded-lg border border-amber-500/30'
                        : log.includes('💸')
                        ? 'text-neutral-400 italic'
                        : log.includes('🥋') || log.includes('GRADUAÇÃO')
                        ? 'text-amber-300 font-bold bg-amber-950/30 p-2 rounded-lg border border-amber-500/30'
                        : log.includes('🎆')
                        ? 'text-purple-300 font-bold'
                        : log.includes('💵')
                        ? 'text-emerald-300'
                        : 'text-neutral-300'
                    }`}
                  >
                    • {log}
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setMonthlyLogs(null)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Continuar Jornada
            </button>
          </div>
        </div>
      )}

      {/* Random Life Event Modal */}
      {activeRandomEvent && (
        <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-neutral-900 border-2 border-amber-500/60 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 animate-scaleIn max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 text-2xl">
                ⚡
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Acontecimento da Vida</span>
                <h3 className="text-lg font-black text-white">{activeRandomEvent.title}</h3>
              </div>
            </div>

            <p className="text-xs md:text-sm text-neutral-300 leading-relaxed bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              {activeRandomEvent.description}
            </p>

            <div className="space-y-2.5">
              {activeRandomEvent.choices.map((choice, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const res = choice.apply(character);
                    sounds.playPunch(false);
                    setCharacter(res.updatedChar);
                    setActiveRandomEvent(null);
                  }}
                  className="w-full p-3.5 bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-400 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="font-bold text-xs text-white group-hover:text-amber-400">
                    {choice.text}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    {choice.effectDescription}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legacy Memorial Modal if Protagonist Completed Life Journey */}
      {character.isAlive === false && (() => {
        const eligibleHeirs = getEligibleHeirs(character);
        const nextGen = (character.dynastyGeneration || 1) + 1;

        return (
          <div className="fixed inset-0 z-50 bg-neutral-950/92 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-neutral-900 border border-amber-500/40 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-6">
              <div className="text-center space-y-2">
                <div className="text-4xl">🕯️</div>
                <h2 className="text-2xl font-black text-white">Memorial de Legado · Geração {character.dynastyGeneration || 1}</h2>
                <p className="text-xs text-amber-400 font-bold">
                  {character.name} "{character.nickname}" · {character.age} anos
                </p>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {character.deathCause || 'Encerrou sua trajetória deixando um legado inesquecível dentro e fora dos tatames.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-neutral-950 p-4 rounded-2xl border border-neutral-800 tabular-nums">
                <div>
                  <span className="text-neutral-500 block">Cartel Oficial</span>
                  <span className="font-black text-white">
                    {character.record.wins}V - {character.record.losses}D ({character.record.kos} KO · {character.record.submissions} SUB)
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Títulos & Fama</span>
                  <span className="font-black text-amber-400">
                    {character.trophies.length} Troféus · {character.fame} Fama
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Filhos</span>
                  <span className="font-bold text-pink-300">
                    {(character.socialContacts || []).filter((c) => c.relationType === 'filho').length} herdeiro(s)
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Patrimônio Final</span>
                  <span className="font-bold text-emerald-400">
                    R$ {character.money.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              {eligibleHeirs.length > 0 && (
                <div className="space-y-2.5 bg-neutral-950 border border-amber-500/30 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                      👑 Modo Dinastia · Continuar na {nextGen}ª Geração
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Herda 60% do patrimônio + academia da família
                    </span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {eligibleHeirs.map((heir) => (
                      <div
                        key={heir.id}
                        className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate">
                            {heir.avatar} {heir.name} ({heir.age}a)
                          </div>
                          <div className="text-[11px] text-neutral-400 truncate">
                            {heir.relationLabel} • {MARTIAL_ARTS_META[heir.art]?.name || heir.art} ({heir.beltLabel})
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const res = inheritLegacyCharacter(character, heir.id, heir.source);
                            if (res.success && res.heirChar) {
                              sounds.playGraduation();
                              setCharacter(res.heirChar);
                              setActiveTab('ficha');
                            }
                          }}
                          className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-[11px] uppercase rounded-lg cursor-pointer shrink-0"
                        >
                          Assumir Legado
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  clearGameSave();
                  setCharacter(null);
                }}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-black text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Iniciar Nova Linhagem do Zero
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
