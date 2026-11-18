/**
 * CAMINHO DO GUERREIRO: DO TATAME AO OCTÓGONO
 * Módulo Especializado de Boxe (Pugilismo) — Tipos Oficiais de Combate & Motor
 */

export type BoxingParticipant = 'boxer_a' | 'boxer_b';

export type BoxingDistance = 'longa' | 'media' | 'curta' | 'clinch' | 'cordas';

export type BoxingStateId =
  | 'neutro_longa'
  | 'troca_media'
  | 'infight_curta'
  | 'clinch_boxe'
  | 'azul_nas_cordas'
  | 'vermelho_nas_cordas';

export type BoxingTechniqueCategory =
  | 'jabs_diretos'
  | 'cruzados_ganchos'
  | 'uppers_corpo'
  | 'combinacoes'
  | 'defesas_esquivas'
  | 'movimentacao';

export type BoxingTechniqueObjective =
  | 'golpe_reto'
  | 'golpe_poder_alto'
  | 'golpe_corpo'
  | 'combinacao'
  | 'defesa_guarda'
  | 'esquiva_contra'
  | 'clinch'
  | 'corte_ringue'
  | 'recuperacao';

export type BoxingStance = 'orthodox' | 'southpaw';

export type BoxingRulesMode = 'amador' | 'profissional';

export type BoxingAiStyle =
  | 'boxer_tecnico'
  | 'slugger_pegador'
  | 'swarmer_pressao'
  | 'counter_puncher'
  | 'inside_fighter'
  | 'completo';

export type BoxingPersonality =
  | 'agressivo'
  | 'paciente'
  | 'estrategico'
  | 'impulsivo'
  | 'confiante'
  | 'cauteloso';

export interface BoxingStateMeta {
  id: BoxingStateId;
  distance: BoxingDistance;
  displayName: string;
  shortDesc: string;
  tacticalNote: string;
}

export interface BoxingTechnique {
  id: string;
  displayName: string;
  shortDesc: string;
  category: BoxingTechniqueCategory;
  objective: BoxingTechniqueObjective;
  allowedDistances: BoxingDistance[];
  /** Dano base no queixo/cabeça */
  basePower: number;
  /** Dano no corpo (drena energia e reduz recuperação) */
  bodyDamage: number;
  /** Pressão sobre a guarda fechada */
  guardDamage: number;
  /** Potencial de atordoamento / knockdown */
  stunPower: number;
  /** Modificador de precisão (-0.15 a +0.25) */
  accuracyMod: number;
  /** Peso de pontuação para os juízes (10-Point Must) */
  pointWeight: number;
  /** Custo de fôlego (gás) */
  staminaCost: number;
  /** Duração tática da troca no relógio do round (segundos) */
  durationSeconds: number;
  /** Objetivos ofensivos que esta técnica contra-ataca ou neutraliza com bônus */
  counterBonusAgainst?: BoxingTechniqueObjective[];
  /** Fração do dano recebido mitigada (0 a 0.85) */
  defensiveMitigation?: number;
  /** Se verdadeiro, dispara contragolpe ao neutralizar ataque compatível */
  allowsCounterStrike?: boolean;
  /** Distância resultante ao ter sucesso ofensivo ou de movimentação */
  nextDistanceOnSuccess?: BoxingDistance;
  /** Bônus especial para sair das cordas quando pressionado */
  ropeEscapeBonus?: boolean;
  /** Se tenta empurrar o oponente para as cordas */
  pushesToRopes?: boolean;
  relevantAttributes: string[];
}

export interface BoxingFighterAttributes {
  punchPower: number;
  punchSpeed: number;
  defense: number;
  footwork: number;
  stamina: number;
  durability: number;
  technique: number;
  mentalFocus: number;
}

export interface BoxingFighterStats {
  punchesThrown: number;
  punchesLanded: number;
  powerLanded: number;
  bodyLanded: number;
  countersLanded: number;
  dodges: number;
}

export interface BoxingCombatAthlete {
  id: BoxingParticipant;
  name: string;
  nickname: string;
  avatar: string;
  isPlayer: boolean;
  weightKg: number;
  heightCm: number;
  stance: BoxingStance;
  gloveColor: string;
  trunksColor: string;
  headgearColor?: string;
  rankTitle: string;
  beltIndex: number;
  attributes: BoxingFighterAttributes;
  /** Saúde do queixo / absorção craniana (0 a 100) */
  chinHealth: number;
  maxChinHealth: number;
  /** Resistência corporal / costelas / fígado (0 a 100) */
  bodyHealth: number;
  maxBodyHealth: number;
  /** Integridade da guarda (0 a 100) */
  guardHealth: number;
  /** Fôlego / Gás no combate (0 a 100) */
  energy: number;
  /** Fadiga acumulada ao longo dos rounds (0 a 100) */
  accumulatedFatigue: number;
  /** Nível de corte/inchaço facial (0 = limpo, 3 = risco médico de TKO) */
  cutLevel: number;
  knockdownsThisRound: number;
  totalKnockdowns: number;
  isGroggy: boolean;
  stats: BoxingFighterStats;
}

export interface BoxingRoundScore {
  roundNumber: number;
  pointsA: number;
  pointsB: number;
  knockdownsA: number;
  knockdownsB: number;
  cleanHitsA: number;
  cleanHitsB: number;
  powerHitsA: number;
  powerHitsB: number;
  dominanceScoreA: number;
  dominanceScoreB: number;
  note: string;
}

export interface BoxingDeclaredAction {
  boxerId: BoxingParticipant;
  techniqueId: string | null;
  intent?: string;
}

export type BoxingHitVisualType =
  | 'none'
  | 'jab'
  | 'cross'
  | 'hook'
  | 'uppercut'
  | 'body'
  | 'combo'
  | 'blocked'
  | 'dodged'
  | 'counter'
  | 'clinch'
  | 'footwork'
  | 'knockdown';

export interface BoxingCycleRecord {
  cycleNumber: number;
  roundNumber: number;
  roundTimeElapsed: number;
  roundTimeRemaining: number;
  distanceBefore: BoxingDistance;
  distanceAfter: BoxingDistance;
  stateBefore: BoxingStateId;
  stateAfter: BoxingStateId;
  actionA: BoxingDeclaredAction;
  actionB: BoxingDeclaredAction;
  techniqueNameA: string;
  techniqueNameB: string;
  narration: string;
  highlightTag?: string;
  hitTypeA: BoxingHitVisualType;
  hitTypeB: BoxingHitVisualType;
  damageToA: number;
  damageToB: number;
  isKnockdownOnA?: boolean;
  isKnockdownOnB?: boolean;
  refereeCount?: number;
  isCounterByA?: boolean;
  isCounterByB?: boolean;
  roundJustEnded?: boolean;
  betweenRoundSummary?: string;
}

export type BoxingWinMethod =
  | 'KO'
  | 'TKO'
  | 'Pontos (Decisão Unânime)'
  | 'Pontos (Decisão Dividida)'
  | 'Pontos (Decisão Majoritária)'
  | 'Empate';

export interface BoxingJudgeCard {
  judgeName: string;
  totalA: number;
  totalB: number;
  winner: BoxingParticipant | 'draw';
}

export interface BoxingMatchState {
  matchId: string;
  matchType: 'sparring' | 'competicao';
  rulesMode: BoxingRulesMode;
  totalRounds: number;
  roundDurationSeconds: number;
  currentRound: number;
  roundTimeElapsedSeconds: number;
  totalTimeElapsedSeconds: number;
  currentDistance: BoxingDistance;
  currentStateId: BoxingStateId;
  ropeTrappedBoxer: BoxingParticipant | null;
  clinchConsecutiveCycles: number;
  boxerA: BoxingCombatAthlete;
  boxerB: BoxingCombatAthlete;
  roundScores: BoxingRoundScore[];
  currentRoundCleanA: number;
  currentRoundCleanB: number;
  currentRoundPowerA: number;
  currentRoundPowerB: number;
  currentRoundDominanceA: number;
  currentRoundDominanceB: number;
  isMatchOver: boolean;
  winner: BoxingParticipant | 'draw' | null;
  winMethod: BoxingWinMethod | null;
  finishDetails?: string;
  judgeCards?: BoxingJudgeCard[];
  rngSeed: number;
  history: BoxingCycleRecord[];
}

export interface BoxingAiProfile {
  style: BoxingAiStyle;
  personality: BoxingPersonality;
}

export interface BoxingTacticalMemory {
  cyclesObserved: number;
  ownHistory: Record<
    string,
    {
      attempts: number;
      landed: number;
      lastCycle: number;
    }
  >;
  opponentHighAttacks: number;
  opponentBodyAttacks: number;
  opponentDefenses: number;
  recentOpponentTechniques: string[];
}

export interface BoxingAiDecisionResult {
  action: BoxingDeclaredAction;
  chosenTechnique: BoxingTechnique | null;
  reasoning: string;
  updatedMemory: BoxingTacticalMemory;
}

export interface BoxingRng {
  (): number;
}
