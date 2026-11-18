/**
 * CAMINHO DO GUERREIRO: DO TATAME AO OCTÓGONO
 * Módulo Especializado de Boxe (Pugilismo) — Arena Principal de Combate 2D Isométrica
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Flame,
  Info,
  RotateCcw,
  Settings2,
  Shield,
  Sliders,
  Swords,
  Trophy,
  X,
  Zap
} from 'lucide-react';
import { Character } from '../../types/game';
import {
  BoxingAiProfile,
  BoxingAiStyle,
  BoxingCombatAthlete,
  BoxingMatchState,
  BoxingPersonality,
  BoxingRulesMode,
  BoxingTechnique,
  BoxingTechniqueCategory
} from '../../types/boxingCombat';
import {
  BOXING_AI_STYLE_META,
  BOXING_CATEGORY_LABELS,
  BOXING_PERSONALITY_META,
  BOXING_STATES_CATALOG,
  BOXING_TECHNIQUE_LIST,
  BOXING_TECHNIQUES_CATALOG
} from '../../data/boxingCatalogData';
import { MARTIAL_ARTS_META } from '../../data/martialArtsData';
import { WORLD_FIGHTERS } from '../../data/worldFightersData';
import { getEffectiveAttributes } from '../../utils/equipmentShopHelper';
import {
  createInitialBoxingMatchState,
  executeBoxingCombatCycle,
  validateBoxingAction
} from '../../utils/boxingFightEngine';
import {
  chooseBoxingAiAction,
  createBoxingAiProfile,
  createInitialBoxingMemory,
  updateBoxingMemoryFromCycle
} from '../../utils/boxingAiEngine';
import { sounds } from '../../utils/audio';
import { BoxingIsometricCanvas } from './BoxingIsometricCanvas';

export interface BoxingTournamentContext {
  tournamentId: string;
  tournamentName: string;
  organization: string;
  stageName: 'Quartas de Final' | 'Semifinal' | 'Grande Final';
  weightClass: string;
  weightDivisionLabel?: string;
  ageDivisionLabel?: string;
  genderDivision?: 'M' | 'F';
  rankDivisionLabel?: string;
  targetWeight?: number | null;
  rewardMoney: number;
  rewardReputation: number;
  rewardHype: number;
  trophyName: string;
}

interface BoxingCombatArenaViewProps {
  character: Character;
  matchType?: 'sparring' | 'competicao';
  matchId?: string;
  tournamentContext?: BoxingTournamentContext;
  opponentData?: BoxingCombatAthlete;
  initialRulesMode?: BoxingRulesMode;
  initialTotalRounds?: number;
  initialRoundDurationSeconds?: number;
  initialAiStyle?: BoxingAiStyle;
  initialMatchState?: BoxingMatchState;
  onMatchStateChange?: (state: BoxingMatchState) => void;
  onExit: () => void;
  onFightComplete?: (winner: 'player' | 'opponent' | 'draw', finalState: BoxingMatchState) => void;
}

function buildPlayerBoxer(character: Character): BoxingCombatAthlete {
  const eff = getEffectiveAttributes(character);
  const rankIdx = character.artGraduations.boxe?.rankIndex ?? 0;
  const rankTitle =
    character.artGraduations.boxe?.name ||
    MARTIAL_ARTS_META.boxe.ranks[rankIdx]?.name ||
    'Iniciante no Pugilismo';

  return {
    id: 'boxer_a',
    name: character.name,
    nickname: character.nickname,
    avatar: character.avatar,
    isPlayer: true,
    weightKg: character.weight,
    heightCm: 174,
    stance: 'orthodox',
    gloveColor: '#2563eb',
    trunksColor: '#1d4ed8',
    headgearColor: '#1d4ed8',
    rankTitle,
    beltIndex: rankIdx,
    attributes: {
      punchPower: Math.round((eff.punchPower + eff.strength * 0.3) * 0.82),
      punchSpeed: Math.round((eff.punchSpeed + eff.agility * 0.35) * 0.82),
      defense: Math.round((eff.defense + eff.reflexes * 0.3) * 0.82),
      footwork: Math.round((eff.agility + eff.reflexes) * 0.52),
      stamina: Math.round(eff.stamina),
      durability: Math.round(eff.durability),
      technique: Math.round(eff.technique),
      mentalFocus: Math.round(eff.mentalFocus)
    },
    chinHealth: 100,
    maxChinHealth: 100,
    bodyHealth: 100,
    maxBodyHealth: 100,
    guardHealth: 100,
    energy: Math.max(55, Math.min(100, character.energy)),
    accumulatedFatigue: Math.min(50, character.accumulatedFatigue || 0),
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

function buildSparringOpponent(
  character: Character,
  difficultyOffset: number = 0
): BoxingCombatAthlete {
  const boxingRivals = WORLD_FIGHTERS.filter((f) => f.primaryArt === 'boxe');
  const pool = boxingRivals.length > 0 ? boxingRivals : WORLD_FIGHTERS;
  const idx = Math.abs(character.careerMonthsElapsed + difficultyOffset) % pool.length;
  const pick = pool[idx];

  const playerBase = Math.max(35, character.attributes.punchPower || 45);
  const scale = Math.max(0.75, Math.min(1.25, (playerBase + difficultyOffset * 6) / Math.max(40, pick.attributes.punchPower || 55)));

  return {
    id: 'boxer_b',
    name: pick.name,
    nickname: pick.nickname,
    avatar: pick.avatar,
    isPlayer: false,
    weightKg: character.weight,
    heightCm: 176,
    stance: idx % 3 === 0 ? 'southpaw' : 'orthodox',
    gloveColor: '#dc2626',
    trunksColor: '#b91c1c',
    headgearColor: '#dc2626',
    rankTitle: pick.belt,
    beltIndex: Math.min(11, Math.max(0, character.artGraduations.boxe?.rankIndex ?? 1)),
    attributes: {
      punchPower: Math.round((pick.attributes.punchPower || 55) * scale),
      punchSpeed: Math.round((pick.attributes.punchSpeed || 55) * scale),
      defense: Math.round((pick.attributes.defense || 52) * scale),
      footwork: Math.round((pick.attributes.agility || 52) * scale),
      stamina: Math.round((pick.attributes.stamina || 58) * scale),
      durability: Math.round((pick.attributes.durability || 55) * scale),
      technique: Math.round((pick.attributes.technique || 54) * scale),
      mentalFocus: Math.round((pick.attributes.mentalFocus || 55) * scale)
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

function formatRoundClock(elapsed: number, total: number): string {
  const rem = Math.max(0, total - elapsed);
  const mins = Math.floor(rem / 60);
  const secs = Math.floor(rem % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const BoxingCombatArenaView: React.FC<BoxingCombatArenaViewProps> = ({
  character,
  matchType = 'sparring',
  matchId,
  tournamentContext,
  opponentData,
  initialRulesMode = matchType === 'competicao' ? 'profissional' : 'amador',
  initialTotalRounds = matchType === 'competicao' ? 3 : 3,
  initialRoundDurationSeconds = 90,
  initialAiStyle = 'completo',
  initialMatchState,
  onMatchStateChange,
  onExit,
  onFightComplete
}) => {
  const [rulesMode, setRulesMode] = useState<BoxingRulesMode>(
    initialMatchState?.rulesMode ?? initialRulesMode
  );
  const [totalRounds, setTotalRounds] = useState<number>(
    initialMatchState?.totalRounds ?? initialTotalRounds
  );
  const [roundDuration, setRoundDuration] = useState<number>(
    initialMatchState?.roundDurationSeconds ?? initialRoundDurationSeconds
  );
  const [aiStyle, setAiStyle] = useState<BoxingAiStyle>(initialAiStyle);
  const [aiPersonality, setAiPersonality] = useState<BoxingPersonality>('estrategico');
  const [difficultyOffset, setDifficultyOffset] = useState<number>(0);

  const [matchState, setMatchState] = useState<BoxingMatchState>(() => {
    if (initialMatchState) return initialMatchState;
    return createInitialBoxingMatchState({
      matchId,
      matchType,
      rulesMode: initialRulesMode,
      totalRounds: initialTotalRounds,
      roundDurationSeconds: initialRoundDurationSeconds,
      boxerA: buildPlayerBoxer(character),
      boxerB: opponentData ? JSON.parse(JSON.stringify(opponentData)) : buildSparringOpponent(character, 0)
    });
  });

  const [aiMemory, setAiMemory] = useState(() => createInitialBoxingMemory());
  const [selectedCategory, setSelectedCategory] = useState<BoxingTechniqueCategory | 'todos'>('todos');
  const [selectedTechId, setSelectedTechId] = useState<string | null>('box_jab_medidor');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [homologated, setHomologated] = useState<boolean>(false);

  const aiProfile: BoxingAiProfile = useMemo(
    () => createBoxingAiProfile(aiStyle, aiPersonality),
    [aiStyle, aiPersonality]
  );

  // Toca o gongo ao iniciar pela primeira vez
  const bellPlayedRef = useRef(false);
  useEffect(() => {
    if (!bellPlayedRef.current) {
      bellPlayedRef.current = true;
      sounds.playBell();
    }
  }, []);

  // Notifica App.tsx para persistência mid-match em torneios
  useEffect(() => {
    onMatchStateChange?.(matchState);
  }, [matchState, onMatchStateChange]);

  const handleRestartSparring = (
    nextRules = rulesMode,
    nextRounds = totalRounds,
    nextDur = roundDuration,
    nextDiff = difficultyOffset
  ) => {
    const fresh = createInitialBoxingMatchState({
      matchType: 'sparring',
      rulesMode: nextRules,
      totalRounds: nextRounds,
      roundDurationSeconds: nextDur,
      boxerA: buildPlayerBoxer(character),
      boxerB: buildSparringOpponent(character, nextDiff)
    });
    setMatchState(fresh);
    setAiMemory(createInitialBoxingMemory());
    setSelectedTechId('box_jab_medidor');
    setHomologated(false);
    sounds.playBell();
  };

  const validPlayerTechniques = useMemo(() => {
    return BOXING_TECHNIQUE_LIST.filter((tech) => {
      if (selectedCategory !== 'todos' && tech.category !== selectedCategory) return false;
      return tech.allowedDistances.includes(matchState.currentDistance);
    });
  }, [selectedCategory, matchState.currentDistance]);

  // Se a técnica selecionada deixou de ser válida na nova distância, seleciona uma válida automaticamente ou guarda
  useEffect(() => {
    if (selectedTechId === null) return;
    const check = validateBoxingAction(matchState, {
      boxerId: 'boxer_a',
      techniqueId: selectedTechId
    });
    if (!check.isValid) {
      const firstValid = BOXING_TECHNIQUE_LIST.find(
        (t) => validateBoxingAction(matchState, { boxerId: 'boxer_a', techniqueId: t.id }).isValid
      );
      setSelectedTechId(firstValid ? firstValid.id : null);
    }
  }, [matchState, selectedTechId]);

  const handleExecuteCycle = (overrideTechId?: string | null) => {
    if (matchState.isMatchOver) return;
    const techToUse = overrideTechId !== undefined ? overrideTechId : selectedTechId;

    const validation = validateBoxingAction(matchState, {
      boxerId: 'boxer_a',
      techniqueId: techToUse
    });
    if (!validation.isValid) return;

    const aiDecision = chooseBoxingAiAction(
      matchState,
      matchState.boxerB,
      matchState.boxerA,
      aiProfile,
      aiMemory
    );

    const nextState = executeBoxingCombatCycle(
      matchState,
      { boxerId: 'boxer_a', techniqueId: techToUse },
      aiDecision.action
    );

    const lastCycle = nextState.history[nextState.history.length - 1];
    if (lastCycle) {
      setAiMemory((prev) => updateBoxingMemoryFromCycle(prev, lastCycle, 'boxer_b'));

      // Feedback sonoro realista
      if (nextState.isMatchOver || lastCycle.roundJustEnded) {
        sounds.playBell();
        if (nextState.isMatchOver && nextState.winner === 'boxer_a') {
          setTimeout(() => sounds.playCheer(), 260);
        }
      } else if (lastCycle.isKnockdownOnA || lastCycle.isKnockdownOnB) {
        sounds.playPunch(true);
      } else if (lastCycle.damageToB >= 14 || lastCycle.damageToA >= 14 || lastCycle.isCounterByA || lastCycle.isCounterByB) {
        sounds.playPunch(true);
      } else if (lastCycle.damageToB > 0 || lastCycle.damageToA > 0) {
        sounds.playPunch(false);
      } else {
        sounds.playWhoosh();
      }
    }

    setMatchState(nextState);
  };

  const handleHomologateResult = () => {
    if (!matchState.isMatchOver || homologated) return;
    setHomologated(true);
    const mappedWinner: 'player' | 'opponent' | 'draw' =
      matchState.winner === 'boxer_a'
        ? 'player'
        : matchState.winner === 'boxer_b'
        ? 'opponent'
        : 'draw';
    onFightComplete?.(mappedWinner, matchState);
    if (matchType === 'competicao') {
      onExit();
    }
  };

  const currentStateMeta =
    BOXING_STATES_CATALOG[matchState.currentStateId] || BOXING_STATES_CATALOG.neutro_longa;

  const totalRoundPtsA = matchState.roundScores.reduce((acc, r) => acc + r.pointsA, 0);
  const totalRoundPtsB = matchState.roundScores.reduce((acc, r) => acc + r.pointsB, 0);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 px-3 py-4 sm:px-6 max-w-6xl mx-auto space-y-4">
      {/* Banner de Competição Oficial */}
      {matchType === 'competicao' && tournamentContext && (
        <div className="bg-gradient-to-r from-amber-950/60 via-neutral-900 to-blue-950/50 border border-amber-500/40 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0">
              🥊
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider font-black text-amber-400">
                {tournamentContext.organization} • {tournamentContext.stageName}
              </div>
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                {tournamentContext.tournamentName}
              </h1>
              <div className="text-xs text-neutral-300 mt-0.5 flex flex-wrap items-center gap-2">
                <span>{tournamentContext.weightDivisionLabel || tournamentContext.weightClass}</span>
                {tournamentContext.ageDivisionLabel && (
                  <span>• {tournamentContext.ageDivisionLabel}</span>
                )}
                <span>• Prêmio Ouro: R$ {tournamentContext.rewardMoney.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] uppercase font-bold text-neutral-400 block">Troféu em Disputa</span>
            <span className="text-xs font-black text-amber-300">{tournamentContext.trophyName}</span>
          </div>
        </div>
      )}

      {/* Barra Superior de Navegação & Regras */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onExit}
            className="min-h-[40px] px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl border border-neutral-700 transition-colors cursor-pointer"
          >
            {matchType === 'competicao' ? '← Salvar & Sair do Ringue' : '← Voltar ao Dojo'}
          </button>
          <div>
            <div className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-1.5">
              <span>🥊 Arena Especializada de Boxe</span>
              <span className="text-[11px] font-bold text-amber-400">
                ({matchState.rulesMode === 'amador' ? 'Olímpico c/ Capacete' : 'Profissional 10-Point Must'})
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              {matchType === 'competicao'
                ? 'Combate Oficial Homologado'
                : `Sparring de Ringue • IA: ${BOXING_AI_STYLE_META[aiStyle].label}`}
            </div>
          </div>
        </div>

        {matchType === 'sparring' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="min-h-[40px] px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-xs rounded-xl border border-neutral-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Regras & Oponente</span>
            </button>
            <button
              type="button"
              onClick={() => handleRestartSparring()}
              className="min-h-[40px] px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/35 text-blue-300 font-bold text-xs rounded-xl border border-blue-500/40 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nova Luta</span>
            </button>
          </div>
        )}
      </div>

      {/* Placar Oficial de 3 Colunas (Córner Azul | Round Clock & 10-Point Must | Córner Vermelho) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 tabular-nums">
        {/* Córner Azul (Jogador) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-blue-950/50 to-neutral-900 border border-blue-500/40 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                Córner Azul • Você ({matchState.boxerA.stance === 'orthodox' ? 'Destro' : 'Canhoto'})
              </div>
              <div className="text-sm font-black text-white truncate">
                {matchState.boxerA.avatar} {matchState.boxerA.name}
                {matchState.boxerA.nickname ? ` "${matchState.boxerA.nickname}"` : ''}
              </div>
              <div className="text-[11px] text-neutral-400 truncate">
                {matchState.boxerA.rankTitle} • {matchState.boxerA.weightKg.toFixed(1)}kg
              </div>
            </div>
            {matchState.boxerA.totalKnockdowns > 0 && (
              <span className="text-[11px] font-black text-red-400 bg-red-950/60 border border-red-500/40 px-2 py-1 rounded-lg shrink-0">
                {matchState.boxerA.totalKnockdowns} KD
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div>
              <div className="flex justify-between font-bold">
                <span className="text-emerald-400">Queixo / Absorção</span>
                <span>{Math.max(0, Math.round(matchState.boxerA.chinHealth))}%</span>
              </div>
              <div className="h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className={`h-full transition-all ${
                    matchState.boxerA.chinHealth > 55
                      ? 'bg-emerald-500'
                      : matchState.boxerA.chinHealth > 25
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, matchState.boxerA.chinHealth))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-neutral-300">
                  <span>Guarda</span>
                  <span>{Math.round(matchState.boxerA.guardHealth)}%</span>
                </div>
                <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, matchState.boxerA.guardHealth))}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-neutral-300">
                  <span>Corpo</span>
                  <span>{Math.round(matchState.boxerA.bodyHealth)}%</span>
                </div>
                <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, matchState.boxerA.bodyHealth))}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-neutral-300">
                  <span>Gás</span>
                  <span>{Math.round(matchState.boxerA.energy)}%</span>
                </div>
                <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, matchState.boxerA.energy))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Centro: Round Clock & Papeleta 10-Point Must */}
        <div className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 block">
                Round Atual
              </span>
              <span className="text-xl font-black text-white">
                ROUND {matchState.currentRound}{' '}
                <span className="text-xs font-bold text-neutral-400">/ {matchState.totalRounds}</span>
              </span>
            </div>

            <div className="text-center px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Relógio</span>
              <span className="text-lg font-mono font-black text-amber-400">
                {formatRoundClock(matchState.roundTimeElapsedSeconds, matchState.roundDurationSeconds)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Papeleta Parcial</span>
              <span className="text-lg font-black text-white">
                <span className="text-blue-400">{totalRoundPtsA}</span>
                <span className="text-neutral-500 mx-1">-</span>
                <span className="text-red-400">{totalRoundPtsB}</span>
              </span>
            </div>
          </div>

          {/* Rounds concluídos + Golpes do round atual */}
          <div className="mt-2 pt-2 border-t border-neutral-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-neutral-300">
              <span>
                Golpes no R{matchState.currentRound}:{' '}
                <strong className="text-blue-400">{matchState.currentRoundCleanA}</strong> x{' '}
                <strong className="text-red-400">{matchState.currentRoundCleanB}</strong>
              </span>
              <span className="text-neutral-400">
                Poder: <strong className="text-amber-300">{matchState.currentRoundPowerA}</strong> x{' '}
                <strong className="text-amber-300">{matchState.currentRoundPowerB}</strong>
              </span>
            </div>

            {matchState.roundScores.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {matchState.roundScores.map((rs) => (
                  <span
                    key={rs.roundNumber}
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-200"
                    title={rs.note}
                  >
                    R{rs.roundNumber}:{' '}
                    <span className={rs.pointsA > rs.pointsB ? 'text-blue-400' : rs.pointsB > rs.pointsA ? 'text-red-400' : 'text-amber-300'}>
                      {rs.pointsA}-{rs.pointsB}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Córner Vermelho (Oponente IA) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-red-950/45 to-neutral-900 border border-red-500/40 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-wider text-red-400">
                Córner Vermelho • {BOXING_AI_STYLE_META[aiStyle].label}
              </div>
              <div className="text-sm font-black text-white truncate">
                {matchState.boxerB.avatar} {matchState.boxerB.name}
                {matchState.boxerB.nickname ? ` "${matchState.boxerB.nickname}"` : ''}
              </div>
              <div className="text-[11px] text-neutral-400 truncate">
                {matchState.boxerB.rankTitle} • {matchState.boxerB.weightKg.toFixed(1)}kg
              </div>
            </div>
            {matchState.boxerB.totalKnockdowns > 0 && (
              <span className="text-[11px] font-black text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-1 rounded-lg shrink-0">
                {matchState.boxerB.totalKnockdowns} KD
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div>
              <div className="flex justify-between font-bold">
                <span className="text-rose-400">Queixo / Absorção</span>
                <span>{Math.max(0, Math.round(matchState.boxerB.chinHealth))}%</span>
              </div>
              <div className="h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className={`h-full transition-all ${
                    matchState.boxerB.chinHealth > 55
                      ? 'bg-rose-500'
                      : matchState.boxerB.chinHealth > 25
                      ? 'bg-amber-500'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, matchState.boxerB.chinHealth))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-neutral-300">
                  <span>Guarda</span>
                  <span>{Math.round(matchState.boxerB.guardHealth)}%</span>
                </div>
                <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-400 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, matchState.boxerB.guardHealth))}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-neutral-300">
                  <span>Corpo</span>
                  <span>{Math.round(matchState.boxerB.bodyHealth)}%</span>
                </div>
                <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, matchState.boxerB.bodyHealth))}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-neutral-300">
                  <span>Gás</span>
                  <span>{Math.round(matchState.boxerB.energy)}%</span>
                </div>
                <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, matchState.boxerB.energy))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ringue Isométrico 2D HD */}
      <BoxingIsometricCanvas matchState={matchState} />

      {/* Leitura Tática da Distância Atual */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          <span className="font-black text-amber-400 uppercase mr-2">
            {currentStateMeta.displayName}:
          </span>
          <span className="text-neutral-300">{currentStateMeta.shortDesc}</span>
        </div>
        <span className="text-[11px] text-cyan-300 font-medium shrink-0">
          💡 {currentStateMeta.tacticalNote}
        </span>
      </div>

      {/* Painel de Resultado Oficial (quando o combate termina) */}
      {matchState.isMatchOver ? (
        <div
          className={`rounded-2xl border-2 p-5 space-y-4 ${
            matchState.winner === 'boxer_a'
              ? 'bg-emerald-950/35 border-emerald-500/60'
              : matchState.winner === 'boxer_b'
              ? 'bg-rose-950/35 border-rose-500/60'
              : 'bg-neutral-900 border-amber-500/50'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-amber-400">
                Veredito Oficial do Ringue • {matchState.winMethod}
              </div>
              <h2 className="text-2xl font-black text-white mt-0.5">
                {matchState.winner === 'boxer_a'
                  ? `🏆 VITÓRIA DE ${matchState.boxerA.name.toUpperCase()}!`
                  : matchState.winner === 'boxer_b'
                  ? `Derrota para ${matchState.boxerB.name}`
                  : 'Empate Oficial dos Juízes'}
              </h2>
              <p className="text-xs text-neutral-300 mt-1">{matchState.finishDetails}</p>
            </div>

            {!homologated ? (
              <button
                type="button"
                onClick={handleHomologateResult}
                className="min-h-[44px] px-5 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {matchType === 'competicao'
                    ? 'Homologar & Avançar na Chave'
                    : 'Registrar Treino no Histórico'}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Registrado!
                </span>
                {matchType === 'sparring' && (
                  <button
                    type="button"
                    onClick={() => handleRestartSparring()}
                    className="min-h-[40px] px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Revanche / Nova Luta
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Papeletas dos 3 Juízes (se decisão por pontos) */}
          {matchState.judgeCards && matchState.judgeCards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 tabular-nums">
              {matchState.judgeCards.map((card) => (
                <div
                  key={card.judgeName}
                  className="bg-neutral-950/90 border border-neutral-800 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-neutral-300">{card.judgeName}</span>
                  <span className="font-mono font-black text-white">
                    <span className="text-blue-400">{card.totalA}</span> -{' '}
                    <span className="text-red-400">{card.totalB}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Estatísticas Comparativas de Golpes */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 tabular-nums">
            <div>
              <span className="text-neutral-400 block text-[10px]">Golpes Limpos</span>
              <strong className="text-white">
                {matchState.boxerA.stats.punchesLanded} / {matchState.boxerA.stats.punchesThrown}
              </strong>
              <span className="text-neutral-500 text-[10px] block">
                Rival: {matchState.boxerB.stats.punchesLanded}/{matchState.boxerB.stats.punchesThrown}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px]">Golpes de Poder</span>
              <strong className="text-amber-400">{matchState.boxerA.stats.powerLanded}</strong>
              <span className="text-neutral-500 text-[10px] block">
                Rival: {matchState.boxerB.stats.powerLanded}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px]">Ataques no Corpo</span>
              <strong className="text-orange-400">{matchState.boxerA.stats.bodyLanded}</strong>
              <span className="text-neutral-500 text-[10px] block">
                Rival: {matchState.boxerB.stats.bodyLanded}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px]">Contra-Golpes</span>
              <strong className="text-cyan-400">{matchState.boxerA.stats.countersLanded}</strong>
              <span className="text-neutral-500 text-[10px] block">
                Rival: {matchState.boxerB.stats.countersLanded}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px]">Esquivas Limpas</span>
              <strong className="text-emerald-400">{matchState.boxerA.stats.dodges}</strong>
              <span className="text-neutral-500 text-[10px] block">
                Rival: {matchState.boxerB.stats.dodges}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Painel Tático de Ação Simultânea */
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs uppercase font-black tracking-wider text-amber-400 flex items-center gap-1.5">
                <Swords className="w-4 h-4" /> Comando Tático do Round {matchState.currentRound}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Ação selecionada:{' '}
                <strong className="text-white">
                  {selectedTechId
                    ? BOXING_TECHNIQUES_CATALOG[selectedTechId]?.displayName
                    : 'Guarda Alta & Recuperar Fôlego'}
                </strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleExecuteCycle(null)}
                className="min-h-[42px] px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 font-bold text-xs rounded-xl border border-cyan-500/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>Guarda & Recuperar (+Gás/+Guarda)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExecuteCycle()}
                className="min-h-[42px] px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Executar Troca Simultânea</span>
              </button>
            </div>
          </div>

          {/* Filtros de Categoria */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('todos')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                selectedCategory === 'todos'
                  ? 'bg-amber-500 text-neutral-950 font-black'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              Todas ({BOXING_TECHNIQUE_LIST.filter((t) => t.allowedDistances.includes(matchState.currentDistance)).length})
            </button>
            {(Object.keys(BOXING_CATEGORY_LABELS) as BoxingTechniqueCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-neutral-950 font-black'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {BOXING_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Cards de Técnicas Válidas na Distância Atual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {validPlayerTechniques.map((tech: BoxingTechnique) => {
              const hasEnergy = matchState.boxerA.energy >= tech.staminaCost;
              const isSelected = selectedTechId === tech.id;
              return (
                <button
                  key={tech.id}
                  type="button"
                  disabled={!hasEnergy}
                  onClick={() => setSelectedTechId(tech.id)}
                  onDoubleClick={() => hasEnergy && handleExecuteCycle(tech.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    !hasEnergy
                      ? 'bg-neutral-950/40 border-neutral-800/50 opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10 cursor-pointer'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-600 cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-white leading-snug">
                        {tech.displayName}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-cyan-300 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 shrink-0">
                        -{tech.staminaCost} Gás
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                      {tech.shortDesc}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-1 text-[10px] tabular-nums">
                    <div className="flex items-center gap-2 font-semibold">
                      {tech.basePower > 0 && <span className="text-rose-400">Queixo: {tech.basePower}</span>}
                      {tech.bodyDamage > 0 && <span className="text-orange-400">Corpo: {tech.bodyDamage}</span>}
                      {tech.allowsCounterStrike && (
                        <span className="text-cyan-300 font-bold">⚡ Contragolpe</span>
                      )}
                      {tech.ropeEscapeBonus && (
                        <span className="text-emerald-300 font-bold">↺ Sai das Cordas</span>
                      )}
                    </div>
                    <span className="text-neutral-500">{tech.durationSeconds}s</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Log de Arbitragem do Ringue */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase font-black tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" /> Registro Cronológico do Ringue ({matchState.history.length} trocas)
          </h3>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {matchState.history.length === 0 ? (
            <div className="text-xs text-neutral-500 text-center py-4">
              Soa o gongo inicial! Selecione seu primeiro jab, combinação ou esquiva acima.
            </div>
          ) : (
            [...matchState.history].reverse().map((cycle) => (
              <div
                key={cycle.cycleNumber}
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  cycle.isKnockdownOnA || cycle.isKnockdownOnB
                    ? 'bg-amber-950/35 border-amber-500/50'
                    : cycle.isCounterByA || cycle.isCounterByB
                    ? 'bg-cyan-950/25 border-cyan-500/40'
                    : 'bg-neutral-950 border-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                  <span className="text-amber-400 font-bold">
                    R{cycle.roundNumber} • {formatRoundClock(cycle.roundTimeElapsed, matchState.roundDurationSeconds)} (Troca #{cycle.cycleNumber})
                  </span>
                  {cycle.highlightTag && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {cycle.highlightTag}
                    </span>
                  )}
                </div>
                <p className="text-neutral-200 leading-relaxed">{cycle.narration}</p>
                <div className="text-[10px] text-neutral-400 flex flex-wrap gap-x-4 pt-1 border-t border-neutral-800/70">
                  <span>
                    Você: <strong className="text-blue-300">{cycle.techniqueNameA}</strong>
                  </span>
                  <span>
                    Rival: <strong className="text-rose-300">{cycle.techniqueNameB}</strong>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Configuração do Sparring (Regras, Rounds, Estilo da IA) */}
      {showConfigModal && matchType === 'sparring' && (
        <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-amber-400" /> Configurar Sparring de Boxe
              </h3>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 font-bold block mb-1">Regulamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRulesMode('amador')}
                    className={`p-2.5 rounded-xl border font-bold cursor-pointer ${
                      rulesMode === 'amador'
                        ? 'bg-blue-500/20 border-blue-400 text-blue-200'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    Olímpico / Amador (c/ Capacete)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRulesMode('profissional')}
                    className={`p-2.5 rounded-xl border font-bold cursor-pointer ${
                      rulesMode === 'profissional'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    Profissional (Sem Capacete)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 font-bold block mb-1">Quantidade de Rounds</label>
                  <select
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2 text-white font-bold"
                  >
                    <option value={3}>3 Rounds (Amador)</option>
                    <option value={4}>4 Rounds (Preliminar Pro)</option>
                    <option value={6}>6 Rounds (Nacional)</option>
                    <option value={10}>10 Rounds (Evento Principal)</option>
                    <option value={12}>12 Rounds (Cinturão Mundial)</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 font-bold block mb-1">Tempo por Round</label>
                  <select
                    value={roundDuration}
                    onChange={(e) => setRoundDuration(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2 text-white font-bold"
                  >
                    <option value={60}>1:00 (Rápido)</option>
                    <option value={90}>1:30 (Dinâmico)</option>
                    <option value={120}>2:00 (Olímpico)</option>
                    <option value={180}>3:00 (Profissional)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 font-bold block mb-1">Estilo do Oponente</label>
                  <select
                    value={aiStyle}
                    onChange={(e) => setAiStyle(e.target.value as BoxingAiStyle)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2 text-white font-bold"
                  >
                    {(Object.keys(BOXING_AI_STYLE_META) as BoxingAiStyle[]).map((st) => (
                      <option key={st} value={st}>
                        {BOXING_AI_STYLE_META[st].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 font-bold block mb-1">Personalidade</label>
                  <select
                    value={aiPersonality}
                    onChange={(e) => setAiPersonality(e.target.value as BoxingPersonality)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2 text-white font-bold"
                  >
                    {(Object.keys(BOXING_PERSONALITY_META) as BoxingPersonality[]).map((p) => (
                      <option key={p} value={p}>
                        {BOXING_PERSONALITY_META[p].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-neutral-400 font-bold block mb-1">
                  Nível do Sparring ({difficultyOffset === 0 ? 'Equilibrado' : difficultyOffset > 0 ? `+${difficultyOffset} Difícil` : `${difficultyOffset} Leve`})
                </label>
                <input
                  type="range"
                  min={-2}
                  max={3}
                  value={difficultyOffset}
                  onChange={(e) => setDifficultyOffset(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRestartSparring(rulesMode, totalRounds, roundDuration, difficultyOffset);
                  setShowConfigModal(false);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase rounded-xl cursor-pointer"
              >
                Aplicar & Iniciar Sparring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
