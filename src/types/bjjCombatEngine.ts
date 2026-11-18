/**
 * CAMINHO DO GUERREIRO: DO TATAME AO OCTÓGONO
 * Módulo Especializado de Jiu-Jitsu Brasileiro (BJJ) — Fase 3A: Tipagem do Motor de Resolução Simultânea
 *
 * Define o modelo de estado central do combate, declaração de ações bilaterais,
 * classificação de interações, registros de histórico e controle de determinismo.
 */

import {
  AthleteRole,
  BjjParticipant,
  BjjPositionId,
  BjjStabilityLevel,
  BjjGripType,
  BjjTechniqueId,
  BjjTechniqueOutcome,
  BjjBeltRankIndex,
  BjjAthleteTechniqueProficiency
} from './bjjCombat';
import { FighterAttributes } from './game';

/**
 * Atleta instanciado no motor de combate com seu repertório técnico
 * e estado físico/fisiológico atual.
 */
export interface BjjCombatAthlete {
  /** Papel canônico no combate ('athlete_a' ou 'athlete_b') */
  id: BjjParticipant;

  /** Nome completo */
  name: string;

  /** Apelido de tatame */
  nickname: string;

  /** Se é o personagem controlado pelo jogador */
  isPlayer: boolean;

  /** Emoji ou avatar */
  avatar: string;

  /** Nível de faixa (0=Branca, 1=Azul, 2=Roxa, 3=Marrom, 4=Preta) */
  beltRankIndex: BjjBeltRankIndex;

  /** Nome oficial da faixa */
  beltName: string;

  /** Peso corporal em kg */
  weight: number;

  /** Idade cronológica real do atleta */
  age?: number;

  /** Atributos fundamentais do atleta */
  attributes: FighterAttributes;

  /** Energia imediata (0 a 100) */
  energy: number;

  /** Capacidade máxima de energia (padrão 100) */
  maxEnergy: number;

  /** Fadiga acumulada no combate (0 a 100) */
  accumulatedFatigue: number;

  /** Repertório técnico individual do atleta */
  repertoire: Record<BjjTechniqueId, BjjAthleteTechniqueProficiency>;
}

/**
 * Declaração de ação de um atleta para um ciclo de combate.
 */
export interface BjjDeclaredAction {
  /** Atleta que declarou a ação */
  athleteId: BjjParticipant;

  /** ID da técnica escolhida no catálogo da Fase 2 (ou null para espera/inatividade) */
  techniqueId: BjjTechniqueId | null;

  /** Intenção tática descritiva (opcional) */
  intent?: string;
}

/**
 * As 7 categorias formais de interação simultânea entre duas ações.
 */
export type BjjInteractionType =
  | 'acoes_compativeis'         // A. Ações compatíveis sem choque direto
  | 'ataque_vs_defesa'          // B. Ataque contra defesa específica
  | 'ataque_vs_ataque'          // C. Ambos atacam simultaneamente
  | 'disputa_posicional'        // D. Disputa por controle/passagem/retenção
  | 'contra_ataque'             // E. Defesa gerando oportunidade de contragolpe
  | 'acao_invalida'             // F. Uma ou ambas as ações são inválidas
  | 'disputa_complexa';         // G. Sobreposição complexa de intenções

/**
 * Ameaça ativa de finalização em andamento.
 */
export interface BjjSubmissionThreat {
  /** Atleta aplicando a chave ou estrangulamento */
  attacker: BjjParticipant;

  /** Atleta defendendo a finalização */
  defender: BjjParticipant;

  /** ID da técnica de finalização */
  techniqueId: BjjTechniqueId;

  /** Nível de perigo da alavanca (1 a 5) */
  dangerLevel: number;

  /** Quantidade de ciclos em que a ameaça permaneceu ativa */
  cyclesInThreat: number;
}

/**
 * Placar e controle de infrações da luta.
 */
export interface BjjMatchScore {
  pointsA: number;
  pointsB: number;
  advantagesA: number;
  advantagesB: number;
  penaltiesA: number;
  penaltiesB: number;
}

/**
 * Registro de histórico de um ciclo de combate resolvido.
 */
export interface BjjCombatCycleRecord {
  /** Número sequencial do ciclo */
  cycleNumber: number;

  /** Tempo de combate em segundos no início do ciclo */
  matchTimeSeconds: number;

  /** Duração em segundos que o ciclo consumiu */
  durationSeconds: number;

  /** Posição bilateral antes da resolução */
  positionBefore: BjjPositionId;

  /** Posição bilateral após a resolução */
  positionAfter: BjjPositionId;

  /** Ação declarada pelo Atleta A */
  actionA: BjjDeclaredAction;

  /** Ação declarada pelo Atleta B */
  actionB: BjjDeclaredAction;

  /** Se a ação de A foi validada */
  actionAValid: boolean;

  /** Se a ação de B foi validada */
  actionBValid: boolean;

  /** Motivo de eventual invalidação da ação A */
  invalidationReasonA?: string;

  /** Motivo de eventual invalidação da ação B */
  invalidationReasonB?: string;

  /** Classificação da interação entre as ações */
  interactionType: BjjInteractionType;

  /** Desfecho dominante que determinou o resultado */
  dominantOutcome: BjjTechniqueOutcome | null;

  /** Fator determinante da resolução (técnica, físico, posição, etc.) */
  decidingFactor: string;

  /** Variação de estamina do Atleta A */
  staminaDeltaA: number;

  /** Variação de estamina do Atleta B */
  staminaDeltaB: number;

  /** Pontos atribuídos ao Atleta A neste ciclo */
  pointsAwardedA: number;

  /** Pontos atribuídos ao Atleta B neste ciclo */
  pointsAwardedB: number;

  /** Se vantagem foi atribuída ao Atleta A */
  advantageAwardedA: boolean;

  /** Se vantagem foi atribuída ao Atleta B */
  advantageAwardedB: boolean;

  /** Narração técnica rica do que aconteceu no tatame */
  technicalNarration: string;
}

/**
 * Estado central e único da luta de Jiu-Jitsu.
 * Nenhuma alteração pode ser feita externamente sem passar pelo motor de resolução.
 */
export interface BjjMatchState {
  /** Dados completos do Atleta A */
  athleteA: BjjCombatAthlete;

  /** Dados completos do Atleta B */
  athleteB: BjjCombatAthlete;

  /** Posição bilateral atual (ID da Fase 1) */
  currentPositionId: BjjPositionId;

  /** Atleta que se encontra por cima ('athlete_a', 'athlete_b' ou 'none') */
  athleteTop: AthleteRole;

  /** Atleta que se encontra por baixo ('athlete_a', 'athlete_b' ou 'none') */
  athleteBottom: AthleteRole;

  /** Atleta exercendo o controle mecânico dominante */
  controllingAthlete: AthleteRole;

  /** Atleta sob controle/defendendo */
  controlledAthlete: AthleteRole;

  /** Pegadas ativas travadas no momento */
  activeGrips: BjjGripType;

  /** Nível de estabilidade e retenção da posição atual */
  stability: BjjStabilityLevel;

  /** Duração contínua em segundos que a posição atual está retida */
  positionDurationSeconds: number;

  /** Se a posição cumpriu os 3 segundos regulamentares da CBJJ para consolidação de pontos */
  isPointsStabilized: boolean;

  /** Placar oficial da luta */
  score: BjjMatchScore;

  /** Tempo decorrido de luta em segundos */
  matchTimeElapsedSeconds: number;

  /** Duração máxima oficial da luta em segundos (ex: 300s infantil, 360s azul, 600s preta) */
  matchDurationSeconds: number;

  /** Modo de combate: com quimono (true) ou sem quimono/No-Gi (false) */
  isGi: boolean;

  /** Categoria etária oficial da disputa */
  ageCategory: 'infantil' | 'juvenil' | 'adulto' | 'master';

  /** Tipo de combate: treino/sparring ou competição oficial */
  matchType?: 'sparring' | 'competicao';

  /** Identificador único do confronto oficial (ex: 'tourn_copa_interna_bjj_final_2026') */
  matchId?: string;

  /** Dados do campeonato oficial vinculado (quando matchType === 'competicao') */
  tournamentContext?: {
    tournamentId: string;
    tournamentName: string;
    organization: string;
    stageName: string; // ex: 'Semifinal', 'Final'
    weightClass: string;
    weightDivisionLabel?: string;
    ageDivisionLabel?: string;
    genderDivision?: 'M' | 'F';
    rankDivisionLabel?: string;
    giColor?: string;
    targetWeight: number | null;
    rewardMoney: number;
    rewardReputation: number;
    rewardHype: number;
    trophyName: string;
  };

  /** Situação atual do combate */
  status: 'em_andamento' | 'finalizada' | 'tempo_esgotado' | 'desqualificacao';

  /** Vencedor declarado da disputa */
  winner: 'athlete_a' | 'athlete_b' | 'draw' | null;

  /** Método oficial de encerramento */
  winMethod: 'Finalização' | 'Pontos' | 'Vantagens' | 'Desqualificação' | 'Decisão do Árbitro' | null;

  /** Ameaça de finalização em processo de ajuste */
  activeSubmissionThreat: BjjSubmissionThreat | null;

  /** Histórico completo e determinístico de todos os ciclos */
  history: BjjCombatCycleRecord[];

  /** Estado da semente de pseudo-aleatoriedade (PRNG) */
  rngSeed: number;
}

/**
 * Fonte determinística de números pseudo-aleatórios injetável para o motor.
 */
export type BjjRng = () => number;
