/**
 * CAMINHO DO GUERREIRO: DO TATAME AO OCTÓGONO
 * Módulo Especializado de Jiu-Jitsu Brasileiro (BJJ) — Fase 4: Interface Especializada de Combate
 *
 * Integra a arena isométrica em pixel art aos motores consolidados nas Fases 1, 2, 3A, 3B e 3C.
 * Apresenta placar oficial CBJJ/IBJJF, cronômetro, seletor tático de técnicas por posição,
 * resolução simultânea em tempo real contra a IA autônoma e painel de configuração da luta (Gi/No-Gi).
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Clock, 
  Shield, 
  Zap, 
  Sparkles, 
  Settings2, 
  RotateCcw, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft,
  Flame,
  Swords,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';

import {
  BjjMatchState,
  BjjCombatAthlete,
  BjjDeclaredAction
} from '../../types/bjjCombatEngine';
import {
  BjjCombatStyle,
  BjjPersonality,
  BjjAiProfile,
  BjjTacticalMemory
} from '../../types/bjjAi';
import { BjjPositionId, BjjTechnique, BjjTechniqueCategory } from '../../types/bjjCombat';
import { BJJ_POSITIONS_CATALOG } from '../../data/bjjPositionsData';
import { BJJ_TECHNIQUES_CATALOG } from '../../data/bjjTechniquesCatalog';
import {
  createInitialBjjMatchState,
  executeBjjCombatCycle,
  validateDeclaredAction
} from '../../utils/bjjFightEngine';
import {
  createBjjAiProfile,
  createInitialTacticalMemory,
  updateTacticalMemoryFromCycle,
  chooseBjjAiAction
} from '../../utils/bjjAiEngine';

import { BjjIsometricCanvas } from './BjjIsometricCanvas';
import { BjjBeltVisual } from '../BjjBeltVisual';
import { Character, FighterAttributes } from '../../types/game';
import { calculateAge } from '../../utils/dateUtils';
import { resolveBjjCombatBeltRank } from '../../data/worldFightersData';
import { getDisplayBeltForGrad } from '../../utils/bjjDegreeHelper';
import { 
  getOrInitializePlayerBjjRepertoire, 
  generateOpponentBjjRepertoire,
  evolveRepertoireFromFight
} from '../../utils/bjjRepertoireHelper';
import { getEffectiveAttributes } from '../../utils/equipmentShopHelper';

function extractBeltVisualMeta(beltRankIndex: number, beltName: string): { metaRankIndex: number; stripes: number } {
  const lower = (beltName || '').toLowerCase();
  let metaRankIndex = 0;
  if (lower.includes('vermelha')) metaRankIndex = 11;
  else if (lower.includes('coral')) metaRankIndex = 9;
  else if (lower.includes('preta') || lower.includes('black')) metaRankIndex = 8;
  else if (lower.includes('marrom') || lower.includes('brown')) metaRankIndex = 7;
  else if (lower.includes('roxa') || lower.includes('purple')) metaRankIndex = 6;
  else if (lower.includes('azul') || lower.includes('blue')) metaRankIndex = 5;
  else if (lower.includes('verde') || lower.includes('green')) metaRankIndex = 4;
  else if (lower.includes('laranja') || lower.includes('orange')) metaRankIndex = 3;
  else if (lower.includes('amarela') || lower.includes('yellow')) metaRankIndex = 2;
  else if (lower.includes('cinza') || lower.includes('gray')) metaRankIndex = 1;
  else if (lower.includes('branca') || lower.includes('white')) metaRankIndex = 0;
  else metaRankIndex = beltRankIndex === 0 ? 0 : Math.min(8, beltRankIndex + 4);

  const match = beltName?.match(/(\d+)\s*º\s*Grau/i);
  const stripes = match ? Number(match[1]) : 0;
  return { metaRankIndex, stripes };
}

interface BjjCombatArenaViewProps {
  character?: Character;
  matchType?: 'sparring' | 'competicao';
  matchId?: string;
  tournamentContext?: BjjMatchState['tournamentContext'];
  opponentData?: Partial<BjjCombatAthlete>;
  initialDuration?: number;
  initialIsGi?: boolean;
  initialAiStyle?: BjjCombatStyle;
  initialMatchState?: BjjMatchState;
  onExit?: () => void;
  onMatchStateChange?: (state: BjjMatchState) => void;
  onFightComplete?: (winner: 'player' | 'opponent' | 'draw', state: BjjMatchState) => void;
  onUpdateCharacterRepertoire?: (updatedRepertoire: Record<string, any>, techXpGained: number) => void;
}

export const BjjCombatArenaView: React.FC<BjjCombatArenaViewProps> = ({
  character,
  matchType = 'sparring',
  matchId,
  tournamentContext,
  opponentData,
  initialDuration,
  initialIsGi,
  initialAiStyle,
  initialMatchState,
  onExit,
  onMatchStateChange,
  onFightComplete,
  onUpdateCharacterRepertoire
}) => {
  // Idade real calculada do personagem
  const realAge = character?.birthDate && character?.currentDate
    ? calculateAge(character.birthDate, character.currentDate)
    : (character?.age || 20);

  // Categoria etária oficial baseada na idade real
  const defaultAgeCategory: 'infantil' | 'juvenil' | 'adulto' | 'master' = 
    realAge < 16 ? 'infantil' : realAge < 18 ? 'juvenil' : realAge < 30 ? 'adulto' : 'master';

  const effectiveDuration = initialDuration ?? 360;
  const effectiveIsGi = initialIsGi ?? true;

  const canRestoreInitialState = Boolean(
    initialMatchState &&
      initialMatchState.matchType === matchType &&
      (!matchId || !initialMatchState.matchId || initialMatchState.matchId === matchId) &&
      initialMatchState.isGi === effectiveIsGi &&
      initialMatchState.athleteA &&
      initialMatchState.athleteB &&
      initialMatchState.score
  );

  // 1. Configurações da Luta (em competição oficial, Gi/No-Gi vem vinculado ao campeonato e não pode ser alterado)
  const [isGi, setIsGi] = useState<boolean>(
    matchType === 'competicao' ? effectiveIsGi : (canRestoreInitialState ? initialMatchState!.isGi : effectiveIsGi)
  );
  const [matchDuration, setMatchDuration] = useState<number>(
    canRestoreInitialState ? initialMatchState!.matchDurationSeconds : effectiveDuration
  );
  const [ageCategory, setAgeCategory] = useState<'infantil' | 'juvenil' | 'adulto' | 'master'>(
    canRestoreInitialState ? initialMatchState!.ageCategory : defaultAgeCategory
  );
  const [aiStyle, setAiStyle] = useState<BjjCombatStyle>(initialAiStyle || 'guardeiro');
  const [aiPersonality, setAiPersonality] = useState<BjjPersonality>('estrategico');
  const [configModalOpen, setConfigModalOpen] = useState<boolean>(false);

  // 2. Estado Central da Luta e IA
  const [matchState, setMatchState] = useState<BjjMatchState>(() =>
    canRestoreInitialState
      ? (JSON.parse(JSON.stringify(initialMatchState)) as BjjMatchState)
      : initDefaultMatch(
          character,
          effectiveDuration,
          effectiveIsGi,
          defaultAgeCategory,
          matchType,
          opponentData,
          matchId,
          tournamentContext
        )
  );
  const [aiProfile, setAiProfile] = useState<BjjAiProfile>(() => createBjjAiProfile(initialAiStyle || 'guardeiro', 'estrategico'));
  const [tacticalMemory, setTacticalMemory] = useState<BjjTacticalMemory>(() => createInitialTacticalMemory(15));

  // 3. Controles do Jogador
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('todos');
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const hasFinishedRef = useRef<boolean>(
    canRestoreInitialState ? initialMatchState!.status !== 'em_andamento' : false
  );

  // Inicializa combate com os dados reais do personagem ou sparring padrão
  function initDefaultMatch(
    char?: Character,
    durationSec: number = effectiveDuration,
    giMode: boolean = effectiveIsGi,
    targetAgeCategory: 'infantil' | 'juvenil' | 'adulto' | 'master' = defaultAgeCategory,
    combatType: 'sparring' | 'competicao' = matchType,
    customOpponent?: Partial<BjjCombatAthlete>,
    mId?: string,
    tournCtx?: BjjMatchState['tournamentContext']
  ): BjjMatchState {
    const playerAttributes: FighterAttributes = char
      ? getEffectiveAttributes(char)
      : {
          strength: 70, speed: 70, stamina: 70, durability: 65,
          flexibility: 70, fightIq: 72, technique: 75, mentalFocus: 70
        };

    // 1. REPERTÓRIO REAL DO JOGADOR: apenas técnicas efetivamente aprendidas
    const playerRepertoire = getOrInitializePlayerBjjRepertoire(char);

    const playerBeltName = getDisplayBeltForGrad('jiujitsu', char?.artGraduations?.jiujitsu) || 'Faixa Branca (Iniciação) · Sem Grau';
    const playerBeltIdx = resolveBjjCombatBeltRank(char?.artGraduations?.jiujitsu?.rankIndex, playerBeltName);

    const oppBeltName = customOpponent?.beltName ?? playerBeltName;
    const oppBeltIdx = resolveBjjCombatBeltRank(customOpponent?.beltRankIndex ?? playerBeltIdx, oppBeltName);

    // 2. REPERTÓRIO REAL DO ADVERSÁRIO: coerente com sua graduação e formato da luta
    const opponentRepertoire = customOpponent?.repertoire && Object.keys(customOpponent.repertoire).length > 0
      ? customOpponent.repertoire
      : generateOpponentBjjRepertoire(oppBeltIdx, giMode);

    return createInitialBjjMatchState(
      {
        name: char?.name || 'Você',
        nickname: char?.nickname || 'Tubarão',
        isPlayer: true,
        avatar: char?.avatar || '🥋',
        beltRankIndex: playerBeltIdx,
        beltName: playerBeltName,
        weight: char?.weight || 77,
        age: realAge,
        attributes: playerAttributes,
        repertoire: playerRepertoire
      },
      {
        name: customOpponent?.name || 'Rodrigo "Cavalo" Nogueira',
        nickname: customOpponent?.nickname || 'Cavalo',
        isPlayer: false,
        avatar: customOpponent?.avatar || '🦁',
        beltRankIndex: oppBeltIdx,
        beltName: oppBeltName,
        weight: customOpponent?.weight || 77,
        age: customOpponent?.age || (targetAgeCategory === 'master' ? 35 : targetAgeCategory === 'juvenil' ? 17 : 24),
        attributes: customOpponent?.attributes || {
          strength: 72, speed: 68, stamina: 75, durability: 70,
          flexibility: 68, fightIq: 74, technique: 74, mentalFocus: 72
        },
        repertoire: opponentRepertoire
      },
      'stand_neutral',
      durationSec,
      Date.now(),
      giMode,
      targetAgeCategory,
      combatType,
      mId || matchId,
      tournCtx || tournamentContext
    );
  }

  // Reinicia o combate com as configurações atuais (em competição, bloqueia alteração de Gi/No-Gi)
  const handleResetMatch = (
    newDuration: number = matchDuration,
    newGi: boolean = isGi,
    newAgeCategory: 'infantil' | 'juvenil' | 'adulto' | 'master' = ageCategory
  ) => {
    const lockedGi = matchType === 'competicao' ? effectiveIsGi : newGi;
    sounds.playBell();
    hasFinishedRef.current = false;
    const freshMatch = initDefaultMatch(
      character,
      newDuration,
      lockedGi,
      newAgeCategory,
      matchType,
      opponentData,
      matchId,
      tournamentContext
    );
    setMatchState(freshMatch);
    setTacticalMemory(createInitialTacticalMemory(15));
    setSelectedTechniqueId(null);
    setLastFeedback(null);
    if (matchType === 'competicao' && onMatchStateChange) {
      onMatchStateChange(freshMatch);
    }
  };

  // Efeito de conclusão segura da luta: dispara UMA ÚNICA VEZ
  useEffect(() => {
    if (matchState.status !== 'em_andamento' && !hasFinishedRef.current) {
      hasFinishedRef.current = true;

      // Evolução técnica a partir dos ciclos da luta (retornos decrescentes)
      if (character && onUpdateCharacterRepertoire) {
        const { updatedRepertoire, totalTechXpEarned } = evolveRepertoireFromFight(
          matchState.athleteA.repertoire,
          matchState.history,
          'athlete_a'
        );
        onUpdateCharacterRepertoire(updatedRepertoire, totalTechXpEarned);
      }

      if (matchState.winner === 'athlete_a') {
        sounds.playCheer();
        try {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch (e) {
          // Confetti fallback
        }
        if (onFightComplete) onFightComplete('player', matchState);
      } else if (matchState.winner === 'athlete_b') {
        sounds.playPunch(true);
        if (onFightComplete) onFightComplete('opponent', matchState);
      } else if (matchState.winner === 'draw') {
        sounds.playWhistle();
        if (onFightComplete) onFightComplete('draw', matchState);
      }
    }
  }, [matchState.status, matchState.winner]);

  // Executa uma rodada simultânea de combate (Jogador vs IA)
  const handleExecuteCycle = () => {
    if (matchState.status !== 'em_andamento' || isRolling) return;

    setIsRolling(true);
    sounds.playWhoosh();

    const currentActionId = selectedTechniqueId;

    // Processamento visual com transição perceptível (~400ms)
    setTimeout(() => {
      // 1. Ação do Jogador
      const playerAction: BjjDeclaredAction = {
        athleteId: 'athlete_a',
        techniqueId: currentActionId
      };

      // 2. Ação autônoma da IA pelo motor consolidado da Fase 3B
      const aiDecision = chooseBjjAiAction(
        matchState,
        matchState.athleteB,
        matchState.athleteA,
        aiProfile,
        tacticalMemory
      );
      const aiAction = aiDecision.action;

      // 3. Resolução Simultânea pelo motor da Fase 3A/3C
      const nextState = executeBjjCombatCycle(matchState, playerAction, aiAction);

      // 4. Atualização da Memória Tática da IA
      const lastRecord = nextState.history[nextState.history.length - 1];
      if (lastRecord) {
        const updatedMem = updateTacticalMemoryFromCycle(tacticalMemory, lastRecord, 'athlete_b');
        setTacticalMemory(updatedMem);

        // Feedback sonoro
        if (lastRecord.interactionType === 'ataque_vs_defesa') {
          sounds.playPunch(false);
        } else if (lastRecord.dominantOutcome?.potentialPoints && lastRecord.dominantOutcome.potentialPoints > 0) {
          sounds.playBell();
        }

        setLastFeedback(lastRecord.decidingFactor);
      }

      setMatchState(nextState);
      if (matchType === 'competicao' && onMatchStateChange && nextState.status === 'em_andamento') {
        onMatchStateChange(nextState);
      }
      setSelectedTechniqueId(null);
      setIsRolling(false);
    }, 380);
  };

  // Posição atual e papel
  const currentPos = BJJ_POSITIONS_CATALOG[matchState.currentPositionId] || BJJ_POSITIONS_CATALOG.stand_neutral;
  const isPlayerTop = matchState.athleteTop === 'athlete_a';
  const isPlayerBottom = matchState.athleteBottom === 'athlete_a';
  const isStanding = currentPos.category === 'em_pe';

  let playerRoleText = 'Em Pé (Disputa Neutra)';
  if (isPlayerTop) playerRoleText = 'Por Cima (Passador / Dominante)';
  else if (isPlayerBottom) playerRoleText = 'Por Baixo (Guardeiro / Defensor)';

  // Lista de técnicas válidas para a posição e papel do jogador (válidas ordenadas primeiro!)
  const validatedPlayerTechniques = Object.values(BJJ_TECHNIQUES_CATALOG)
    .filter((tech) => {
      // Filtro por categoria
      if (activeCategoryFilter !== 'todos') {
        if (activeCategoryFilter === 'quedas' && tech.objective !== 'queda') return false;
        if (activeCategoryFilter === 'raspagens' && tech.objective !== 'raspagem') return false;
        if (activeCategoryFilter === 'passagens' && tech.objective !== 'passagem') return false;
        if (activeCategoryFilter === 'finalizacoes' && !tech.isSubmission) return false;
        if (activeCategoryFilter === 'defesas' && tech.objective !== 'defesa' && tech.objective !== 'fuga') return false;
        if (activeCategoryFilter === 'controles' && tech.objective !== 'estabilizacao') return false;
      }

      // Filtro Gi vs No-Gi
      if (!isGi && !tech.legality.noGiAllowed) return false;

      return true;
    })
    .map((tech) => ({
      tech,
      validation: validateDeclaredAction(matchState, {
        athleteId: 'athlete_a',
        techniqueId: tech.id
      })
    }))
    .sort((a, b) => {
      if (a.validation.isValid !== b.validation.isValid) {
        return a.validation.isValid ? -1 : 1;
      }
      // Dentro das válidas, prioriza fugas/defesas quando sob controle ou ameaça, ou técnicas com pontos/finalização
      const isPlayerControlled = matchState.controlledAthlete === 'athlete_a' || matchState.activeSubmissionThreat?.defender === 'athlete_a';
      if (a.validation.isValid && isPlayerControlled) {
        const aIsEsc = a.tech.objective === 'fuga' || a.tech.objective === 'defesa' ? 1 : 0;
        const bIsEsc = b.tech.objective === 'fuga' || b.tech.objective === 'defesa' ? 1 : 0;
        if (aIsEsc !== bIsEsc) return bIsEsc - aIsEsc;
      }
      return b.tech.competitiveConsequences.pointsOnStabilization - a.tech.competitiveConsequences.pointsOnStabilization;
    });

  const availableValidCount = validatedPlayerTechniques.filter((item) => item.validation.isValid).length;

  // Tempo restante
  const timeRemaining = Math.max(0, matchState.matchDurationSeconds - matchState.matchTimeElapsedSeconds);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const lastLog = matchState.history[matchState.history.length - 1];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 text-neutral-100 font-sans">
      {/* Banner de Torneio Oficial se em Modo Competição */}
      {tournamentContext && (
        <div className="bg-gradient-to-r from-amber-950/60 via-neutral-900 to-amber-950/60 border-2 border-amber-500/50 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-500 text-neutral-950 rounded-xl font-black text-xl shadow-md">
              🏆
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500 text-neutral-950">
                  {tournamentContext.stageName.toUpperCase()}
                </span>
                <span className="text-xs font-bold text-amber-300">
                  {tournamentContext.organization}
                </span>
                <span className="text-neutral-500">•</span>
                <span className="text-xs text-neutral-300">
                  {tournamentContext.weightDivisionLabel
                    ? tournamentContext.weightDivisionLabel
                    : tournamentContext.targetWeight === null
                    ? `${tournamentContext.weightClass} (Sem limite)`
                    : `${tournamentContext.weightClass} (Até ${tournamentContext.targetWeight} kg)`}
                  {tournamentContext.ageDivisionLabel ? ` • ${tournamentContext.ageDivisionLabel}` : ''}
                  {tournamentContext.rankDivisionLabel ? ` • ${tournamentContext.rankDivisionLabel}` : ''}
                </span>
              </div>
              <h2 className="text-base md:text-lg font-black text-white mt-0.5">
                {tournamentContext.tournamentName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Premiação Ouro</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                R$ {tournamentContext.rewardMoney.toLocaleString('pt-BR')}
              </span>
            </div>
            {tournamentContext.trophyName && (
              <div className="hidden sm:block pl-3 border-l border-neutral-800">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Troféu em Jogo</span>
                <span className="text-xs font-bold text-amber-300">
                  {tournamentContext.trophyName}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. Barra Superior de Controle e Configuração */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          {onExit && (
            <button
              onClick={() => {
                if (matchType === 'competicao' && onMatchStateChange && matchState.status === 'em_andamento') {
                  onMatchStateChange(matchState);
                }
                onExit();
              }}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title={matchType === 'competicao' ? 'Salvar progresso do confronto e retornar ao Circuito de Campeonatos' : 'Voltar ao dojô'}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase font-bold text-amber-400 tracking-wider">
                Arena de Jiu-Jitsu Especializada
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-[11px] text-neutral-300 font-semibold">
                {isGi ? 'Com Quimono (Gi)' : 'Sem Quimono (No-Gi)'}
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-[11px] text-neutral-300 font-semibold uppercase">
                {ageCategory}
              </span>
              <span className="text-neutral-500">•</span>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                matchType === 'competicao'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              }`}>
                {matchType === 'competicao' ? '🏆 Competição Oficial' : '🥋 Sparring / Treino Livre'}
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
              <span>{matchType === 'competicao' ? 'Combate Oficial CBJJ / IBJJF' : 'Rola Técnico no Tatame'}</span>
              {matchState.status !== 'em_andamento' && (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {matchState.status === 'finalizada' ? 'FINALIZADA (TAPOUT)' : 'TEMPO ESGOTADO'}
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Botões de Ação da Arena */}
        {matchType !== 'competicao' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleResetMatch(matchDuration, isGi)}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded-xl text-neutral-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Rola</span>
            </button>
            <button
              type="button"
              onClick={() => setConfigModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Regras & Oponente</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Regras e Chave Oficiais Homologadas
            </span>
          </div>
        )}
      </div>

      {/* 2. Placar Oficial Estilo CBJJ / IBJJF */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        {/* Atleta A (Córner Azul / Jogador) */}
        {(() => {
          const beltMetaA = extractBeltVisualMeta(matchState.athleteA.beltRankIndex, matchState.athleteA.beltName);
          return (
            <div className="md:col-span-4 bg-neutral-900 border-2 border-blue-600/40 rounded-2xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-blue-400">
                  Córner Azul (Você)
                </span>
                <span className="text-xs font-mono font-bold text-neutral-400 tabular-nums">
                  {matchState.athleteA.weight} kg
                </span>
              </div>

              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-3xl p-2 bg-neutral-950 rounded-xl border border-neutral-800">
                  {matchState.athleteA.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-black text-white truncate">{matchState.athleteA.name}</h2>
                  <div className="text-xs text-neutral-400 truncate">
                    <span className="text-amber-400 font-semibold">"{matchState.athleteA.nickname}"</span> • {matchState.athleteA.beltName}
                  </div>
                  <div className="mt-1.5">
                    <BjjBeltVisual rankIndex={beltMetaA.metaRankIndex} stripes={beltMetaA.stripes} compact />
                  </div>
                </div>
              </div>

              {/* Barras de Energia e Fadiga */}
              <div className="space-y-2 mt-1">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Zap className="w-3.5 h-3.5" /> Energia / Gás
                    </span>
                    <span className="text-neutral-300 font-mono tabular-nums">{matchState.athleteA.energy}%</span>
                  </div>
                  <div className="h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className="h-full bg-cyan-400 transition-all rounded-full"
                      style={{ width: `${Math.max(0, matchState.athleteA.energy)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1 text-rose-400">
                      <Flame className="w-3.5 h-3.5" /> Fadiga Acumulada
                    </span>
                    <span className="text-neutral-300 font-mono tabular-nums">{matchState.athleteA.accumulatedFatigue}%</span>
                  </div>
                  <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className="h-full bg-rose-500 transition-all rounded-full"
                      style={{ width: `${Math.min(100, matchState.athleteA.accumulatedFatigue)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Placar Central com Cronômetro e Pontuações */}
        <div className="md:col-span-4 bg-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-xl flex flex-col items-center justify-between text-center">
          {/* Cronômetro Oficial */}
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
              Tempo de Combate
            </span>
            <div className="text-3xl font-mono font-black text-white flex items-center justify-center gap-1.5 mt-0.5 tabular-nums">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Display de Pontos Oficiais */}
          <div className="grid grid-cols-2 gap-4 w-full py-2 border-y border-neutral-800/80 my-2">
            <div>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">Azul</span>
              <span className="text-3xl font-mono font-black text-amber-400 tabular-nums">
                {matchState.score.pointsA}
              </span>
              <div className="flex justify-center gap-2 text-[10px] text-neutral-400 mt-1 font-mono tabular-nums">
                <span>V: <strong className="text-neutral-200">{matchState.score.advantagesA}</strong></span>
                <span>P: <strong className="text-neutral-200">{matchState.score.penaltiesA}</strong></span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-white font-bold uppercase tracking-wider block">Branco</span>
              <span className="text-3xl font-mono font-black text-amber-400 tabular-nums">
                {matchState.score.pointsB}
              </span>
              <div className="flex justify-center gap-2 text-[10px] text-neutral-400 mt-1 font-mono tabular-nums">
                <span>V: <strong className="text-neutral-200">{matchState.score.advantagesB}</strong></span>
                <span>P: <strong className="text-neutral-200">{matchState.score.penaltiesB}</strong></span>
              </div>
            </div>
          </div>

          {/* Status Posicional em Texto */}
          <div className="text-xs text-neutral-400">
            Papel Atual: <span className="text-amber-300 font-semibold">{playerRoleText}</span>
          </div>
        </div>

        {/* Atleta B (Córner Branco / Adversário IA) */}
        {(() => {
          const beltMetaB = extractBeltVisualMeta(matchState.athleteB.beltRankIndex, matchState.athleteB.beltName);
          return (
            <div className="md:col-span-4 bg-neutral-900 border-2 border-neutral-600/40 rounded-2xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-300">
                  Córner Branco ({aiStyle.toUpperCase()})
                </span>
                <span className="text-xs font-mono font-bold text-neutral-400 tabular-nums">
                  {matchState.athleteB.weight} kg
                </span>
              </div>

              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-3xl p-2 bg-neutral-950 rounded-xl border border-neutral-800">
                  {matchState.athleteB.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-black text-white truncate">{matchState.athleteB.name}</h2>
                  <div className="text-xs text-neutral-400 truncate">
                    <span className="text-amber-400 font-semibold">"{matchState.athleteB.nickname}"</span> • {matchState.athleteB.beltName}
                  </div>
                  <div className="mt-1.5">
                    <BjjBeltVisual rankIndex={beltMetaB.metaRankIndex} stripes={beltMetaB.stripes} compact />
                  </div>
                </div>
              </div>

              {/* Barras de Energia e Fadiga */}
              <div className="space-y-2 mt-1">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Zap className="w-3.5 h-3.5" /> Energia / Gás
                    </span>
                    <span className="text-neutral-300 font-mono tabular-nums">{matchState.athleteB.energy}%</span>
                  </div>
                  <div className="h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className="h-full bg-cyan-400 transition-all rounded-full"
                      style={{ width: `${Math.max(0, matchState.athleteB.energy)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1 text-rose-400">
                      <Flame className="w-3.5 h-3.5" /> Fadiga Acumulada
                    </span>
                    <span className="text-neutral-300 font-mono tabular-nums">{matchState.athleteB.accumulatedFatigue}%</span>
                  </div>
                  <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className="h-full bg-rose-500 transition-all rounded-full"
                      style={{ width: `${Math.min(100, matchState.athleteB.accumulatedFatigue)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 3. Tatame Isométrico Ilustrado */}
      <BjjIsometricCanvas
        state={matchState}
        isGi={isGi}
        isRolling={isRolling}
        lastFeedbackText={lastFeedback}
      />

      {/* 4. Painel de Homologação de Resultado se Concluído */}
      {matchState.status !== 'em_andamento' && (
        <div className={`p-6 rounded-3xl border-2 shadow-2xl space-y-4 animate-scaleIn ${
          matchState.winner === 'athlete_a'
            ? 'bg-gradient-to-br from-emerald-950/80 via-neutral-900 to-neutral-900 border-emerald-500/60'
            : matchState.winner === 'athlete_b'
            ? 'bg-gradient-to-br from-rose-950/80 via-neutral-900 to-neutral-900 border-rose-500/60'
            : 'bg-neutral-900 border-neutral-700'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl p-2 bg-neutral-950 rounded-2xl border border-neutral-800">
                {matchState.winner === 'athlete_a' ? '🥇' : matchState.winner === 'athlete_b' ? '🥋' : '⚖️'}
              </span>
              <div>
                <span className="text-xs uppercase font-black tracking-widest text-amber-400">
                  {matchType === 'competicao' ? 'Resultado Oficial da Arbitragem CBJJ / IBJJF' : 'Fim do Rola Técnico'}
                </span>
                <h3 className="text-2xl font-black text-white">
                  {matchState.winner === 'athlete_a'
                    ? 'VITÓRIA DE ' + matchState.athleteA.name.toUpperCase() + '!'
                    : matchState.winner === 'athlete_b'
                    ? 'VITÓRIA DE ' + matchState.athleteB.name.toUpperCase()
                    : 'EMPATE NO TEMPO REGULAMENTAR'}
                </h3>
                <div className="text-xs text-neutral-300 mt-0.5">
                  Decisão: <strong className="text-amber-300 font-bold">{matchState.winMethod || (matchState.status === 'finalizada' ? 'Finalização' : 'Pontos')}</strong>
                </div>
              </div>
            </div>

            <div className="bg-neutral-950/90 border border-neutral-800 p-3 rounded-2xl text-right">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">Placar Final</span>
              <span className="text-xl font-mono font-black text-amber-400">
                {matchState.score.pointsA} x {matchState.score.pointsB}
              </span>
              <span className="text-[10px] text-neutral-400 block font-mono">
                ({matchState.score.advantagesA}v/{matchState.score.penaltiesA}p vs {matchState.score.advantagesB}v/{matchState.score.penaltiesB}p)
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/50 p-3 rounded-xl border border-neutral-800/80">
            {matchState.winner === 'athlete_a'
              ? 'Excelente desempenho técnico no tatame! Controle posicional e aplicação precisa de fundamentos sob as regras oficiais.'
              : matchState.winner === 'athlete_b'
              ? 'Confronto acirrado de alto nível. Experiência e aprendizado absorvidos para a evolução do seu repertório.'
              : 'Empate técnico no tempo regulamentar.'}
          </p>

          <button
            type="button"
            onClick={() => {
              if (onExit) onExit();
            }}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-sm uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            <span>
              {matchType === 'competicao'
                ? matchState.winner === 'athlete_a'
                  ? tournamentContext?.stageName === 'Grande Final'
                    ? 'Subir ao Pódio & Receber Troféu de Campeão 🏆'
                    : 'Homologar Vitória & Avançar de Fase na Chave ➔'
                  : 'Homologar Resultado & Retornar ao Circuito'
                : 'Concluir Treino & Retornar ao Dojô'}
            </span>
          </button>
        </div>
      )}

      {/* 5. Painel Tático e Seletor de Técnicas do Jogador */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Swords className="w-4 h-4 text-amber-400" />
              <span>Selecione sua Ação para este Ciclo de Combate</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5 flex flex-wrap items-center gap-2">
              <span>
                Posição: <strong className="text-white">{currentPos.name}</strong> • Papel: <strong className="text-amber-300">{playerRoleText}</strong>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                availableValidCount > 0
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
              }`}>
                {availableValidCount > 0
                  ? `${availableValidCount} ${availableValidCount === 1 ? 'técnica disponível' : 'técnicas disponíveis'}`
                  : 'Use Recuperar Fôlego para retomar gás'}
              </span>
            </p>
          </div>

          {/* Botão de Confirmação da Ação / Rolar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSelectedTechniqueId(null)}
              className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                selectedTechniqueId === null
                  ? matchState.athleteA.energy <= 20
                    ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 font-bold'
                    : 'bg-neutral-800 border-amber-500/60 text-amber-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              Recuperar Fôlego & Base (+Gás)
            </button>

            <button
              type="button"
              disabled={matchState.status !== 'em_andamento' || isRolling}
              onClick={handleExecuteCycle}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRolling ? 'Rolando...' : 'Executar Ação Simultânea'}</span>
            </button>
          </div>
        </div>

        {/* Filtros de Categorias Técnicas */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
          {[
            { id: 'todos', label: 'Todas' },
            { id: 'quedas', label: 'Quedas' },
            { id: 'raspagens', label: 'Raspagens' },
            { id: 'passagens', label: 'Passagens' },
            { id: 'controles', label: 'Controles' },
            { id: 'finalizacoes', label: 'Finalizações' },
            { id: 'defesas', label: 'Defesas & Fugas' }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeCategoryFilter === cat.id
                  ? 'bg-neutral-800 text-white font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grade de Cartões de Técnicas Disponíveis (Válidas primeiro) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
          {validatedPlayerTechniques.map(({ tech, validation }) => {
            const isSelected = selectedTechniqueId === tech.id;
            const isValid = validation.isValid;

            return (
              <button
                key={tech.id}
                type="button"
                disabled={!isValid || matchState.status !== 'em_andamento'}
                onClick={() => setSelectedTechniqueId(tech.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  !isValid
                    ? 'opacity-40 bg-neutral-950 border-neutral-900 cursor-not-allowed'
                    : isSelected
                    ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10 cursor-pointer ring-1 ring-amber-500'
                    : 'bg-neutral-950 hover:bg-neutral-850 border-neutral-800 hover:border-neutral-700 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                    <span className="uppercase font-mono font-bold text-neutral-500">
                      {tech.objective.toUpperCase()}
                    </span>
                    <span className="font-mono text-cyan-400">-{tech.staminaCost} Gás</span>
                  </div>
                  <h4 className={`text-xs font-bold leading-tight ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                    {tech.displayName}
                  </h4>
                </div>

                <div className="mt-2 pt-2 border-t border-neutral-800/60 text-[11px] flex items-center justify-between text-neutral-400">
                  <span>Duração: ~{tech.estimatedDurationSeconds}s</span>
                  {tech.competitiveConsequences.pointsOnStabilization > 0 ? (
                    <span className="text-amber-400 font-bold font-mono">
                      +{tech.competitiveConsequences.pointsOnStabilization} pts
                    </span>
                  ) : tech.isSubmission ? (
                    <span className="text-rose-400 font-bold">FINALIZA</span>
                  ) : (
                    <span>Controle</span>
                  )}
                </div>

                {!isValid && validation.reason && (
                  <div className="mt-1 text-[10px] text-rose-400/80 italic line-clamp-1">
                    {validation.reason}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Histórico e Comentários do Árbitro / Tatame */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-400 border-b border-neutral-800 pb-2">
          <span>Comentários Técnicos da Arbitragem</span>
          <span>Ciclos Concluídos: {matchState.history.length}</span>
        </div>

        {matchState.history.length === 0 ? (
          <div className="text-xs text-neutral-500 italic py-3 text-center">
            A luta acabou de começar! Declare sua primeira ação para engajar a disputa no tatame.
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {matchState.history.slice().reverse().map((rec) => (
              <div
                key={rec.cycleNumber}
                className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-xl text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-amber-400">
                    Ciclo #{rec.cycleNumber} ({rec.durationSeconds}s) • {rec.interactionType.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className="text-neutral-500 font-mono">
                    {Math.floor(rec.matchTimeSeconds / 60)}:{(rec.matchTimeSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="text-neutral-200 leading-relaxed font-medium">
                  {rec.technicalNarration}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-3 pt-1 border-t border-neutral-800/40">
                  <span>Você: {rec.actionA.techniqueId ? BJJ_TECHNIQUES_CATALOG[rec.actionA.techniqueId]?.displayName : 'Postura'}</span>
                  <span>Rival: {rec.actionB.techniqueId ? BJJ_TECHNIQUES_CATALOG[rec.actionB.techniqueId]?.displayName : 'Postura'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Modal de Configuração de Luta (Exclusivo para Sparring Livre; bloqueado em competição oficial) */}
      {configModalOpen && matchType !== 'competicao' && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Configurar Combate de Jiu-Jitsu</h3>
              </div>
              <button
                type="button"
                onClick={() => setConfigModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Formato: Gi vs No-Gi */}
              <div>
                <label className="font-bold text-neutral-300 block mb-1.5">Vestimenta / Modalidade</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGi(true)}
                    className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer ${
                      isGi
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    🥋 Com Quimono (Gi)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGi(false)}
                    className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer ${
                      !isGi
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    🤼 Sem Quimono (No-Gi)
                  </button>
                </div>
              </div>

              {/* Categoria Etária Oficial */}
              <div>
                <label className="font-bold text-neutral-300 block mb-1.5">
                  Categoria Etária (Idade Real: {realAge} anos)
                </label>
                <div className="grid grid-cols-3 gap-1.5 font-bold text-center">
                  {(['juvenil', 'adulto', 'master'] as const).map((cat) => {
                    const isEligible = 
                      (cat === 'juvenil' && realAge >= 14 && realAge <= 17) ||
                      (cat === 'adulto' && realAge >= 18) ||
                      (cat === 'master' && realAge >= 30);
                    return (
                      <button
                        key={cat}
                        type="button"
                        disabled={!isEligible}
                        onClick={() => setAgeCategory(cat)}
                        className={`py-2 rounded-xl border uppercase tracking-wider text-[10px] transition-all cursor-pointer ${
                          ageCategory === cat
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : isEligible
                            ? 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                            : 'bg-neutral-950/40 border-neutral-900 text-neutral-600 cursor-not-allowed opacity-50'
                        }`}
                        title={!isEligible ? `Incompatível com a idade real do personagem (${realAge} anos)` : ''}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
                {realAge < 18 && ageCategory !== 'juvenil' && (
                  <p className="text-[10px] text-amber-400/80 mt-1 italic">
                    ⚠️ Atletas menores de 18 anos disputam categorias Juvenil conforme o regulamento CBJJ.
                  </p>
                )}
              </div>

              {/* Estilo da IA Adversária */}
              <div>
                <label className="font-bold text-neutral-300 block mb-1.5">Estilo Comportamental do Adversário</label>
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  {(['guardeiro', 'passador', 'quedador', 'finalizador', 'defensivo', 'completo'] as BjjCombatStyle[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setAiStyle(st);
                        setAiProfile(createBjjAiProfile(st, aiPersonality));
                      }}
                      className={`py-1.5 px-2 rounded-lg border text-center font-bold uppercase cursor-pointer ${
                        aiStyle === st
                          ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personalidade da IA Adversária */}
              <div>
                <label className="font-bold text-neutral-300 block mb-1.5">Personalidade do Adversário</label>
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  {(['agressivo', 'paciente', 'estrategico', 'impulsivo', 'confiante', 'cauteloso'] as BjjPersonality[]).map((pe) => (
                    <button
                      key={pe}
                      type="button"
                      onClick={() => {
                        setAiPersonality(pe);
                        setAiProfile(createBjjAiProfile(aiStyle, pe));
                      }}
                      className={`py-1.5 px-2 rounded-lg border text-center font-bold uppercase cursor-pointer ${
                        aiPersonality === pe
                          ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      {pe}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                handleResetMatch(matchDuration, isGi, ageCategory);
                setConfigModalOpen(false);
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Aplicar e Iniciar Novo Combate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
