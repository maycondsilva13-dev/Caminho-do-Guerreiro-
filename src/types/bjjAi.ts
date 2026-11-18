/**
 * CAMINHO DO GUERREIRO: DO TATAME AO OCTÓGONO
 * Módulo Especializado de Jiu-Jitsu Brasileiro (BJJ) — Fase 3B: Tipos da Inteligência Artificial
 *
 * Define modelos para perfis comportamentais (7 estilos de luta e 6 personalidades),
 * memória tática de combate com capacidade limitada e contratos de decisão da IA.
 */

import {
  BjjTechnique,
  BjjTechniqueId,
  BjjTechniqueCategory,
  BjjTechniqueObjective
} from './bjjCombat';
import {
  BjjMatchState,
  BjjCombatAthlete,
  BjjDeclaredAction,
  BjjCombatCycleRecord
} from './bjjCombatEngine';

/**
 * 7 Estilos comportamentais de luta do Jiu-Jitsu.
 */
export type BjjCombatStyle =
  | 'guardeiro'     // Prioriza puxada de guarda, raspagens, ataques da guarda e finalizações por baixo
  | 'passador'      // Prioriza pressão, controle por cima e passagem de guarda
  | 'quedador'      // Procura quedas, domínio da luta em pé e entradas de projeção
  | 'finalizador'   // Procura oportunidades de submissão e trabalha para construir posições de finalização
  | 'defensivo'     // Prioriza retenção, defesa de ataques, escapes e recuperação de posições seguras
  | 'pressionador'  // Busca manter iniciativa, desgastar o adversário e avançar posições com pressão constante
  | 'completo';     // Combina estratégias de luta em pé, guarda, passagem, controle e finalização

/**
 * 6 Perfis de personalidade do atleta.
 */
export type BjjPersonality =
  | 'agressivo'     // Aceita mais riscos e procura ataques diretos
  | 'paciente'      // Prefere oportunidades com maior probabilidade de sucesso e menor risco
  | 'estrategico'   // Adapta decisões ao placar, tempo e comportamento do adversário
  | 'impulsivo'     // Varia mais as escolhas e pode assumir riscos desnecessários
  | 'confiante'     // Tende a repetir estratégias que já produziram bons resultados
  | 'cauteloso';    // Evita riscos elevados, especialmente quando está vencendo

/**
 * Perfil comportamental completo da IA de um atleta.
 */
export interface BjjAiProfile {
  /** Estilo de luta primário */
  style: BjjCombatStyle;

  /** Personalidade emocional e estratégica */
  personality: BjjPersonality;

  /** Nível de propensão ao risco (0.0 a 1.0, opcional, padrão derivado da personalidade) */
  customRiskTolerance?: number;

  /** Categorias técnicas com bônus de preferência individual */
  preferredCategories?: BjjTechniqueCategory[];

  /** Objetivos táticos preferenciais */
  preferredObjectives?: BjjTechniqueObjective[];
}

/**
 * Registro de uso de uma técnica específica na memória tática.
 */
export interface BjjTechniqueUsageRecord {
  attempts: number;
  successes: number;
  defendedByOpponent: number;
  lastAttemptCycle: number;
  pointsEarned: number;
}

/**
 * Padrões observados nas ações já resolvidas do oponente (sem conhecer ações futuras).
 */
export interface BjjOpponentObservedPatterns {
  takedownsAttempted: number;
  guardPullsAttempted: number;
  submissionsAttempted: number;
  passesAttempted: number;
  sweepsAttempted: number;
  /** IDs das últimas técnicas resolvidas do oponente (tamanho limitado) */
  recentResolvedTechniques: BjjTechniqueId[];
}

/**
 * Memória tática de combate simples, consolidada e com capacidade estritamente limitada.
 */
export interface BjjTacticalMemory {
  /** Histórico por técnica tentada pela própria IA */
  ownTechniquesHistory: Record<BjjTechniqueId, BjjTechniqueUsageRecord>;

  /** Padrões observados do oponente em ciclos anteriores já concluídos */
  opponentPatterns: BjjOpponentObservedPatterns;

  /** Contagem total de ciclos observados e consolidados */
  cyclesObserved: number;

  /** Limite máximo de técnicas distintas rastreadas em detalhes */
  maxTrackedTechniques: number;
}

/**
 * Avaliação e decomposição de pontuação de uma técnica candidata analisada pela IA.
 */
export interface BjjCandidateActionScore {
  techniqueId: BjjTechniqueId;
  techniqueName: string;
  category: BjjTechniqueCategory;
  objective: BjjTechniqueObjective;
  baseScore: number;
  styleBonus: number;
  personalityBonus: number;
  tacticalContextBonus: number;
  threatBonus: number;
  memoryBonus: number;
  fatigueStaminaPenalty: number;
  totalScore: number;
  tacticalRationale: string;
}

/**
 * Resultado completo da tomada de decisão da IA.
 */
export interface BjjAiDecisionResult {
  /** Ação declarada no formato oficial da Fase 3A */
  action: BjjDeclaredAction;

  /** Objeto da técnica escolhida, ou null se optou por postura segura/recuperação */
  chosenTechnique: BjjTechnique | null;

  /** Intenção tática resumida */
  intent: string;

  /** Racional analítico detalhado da decisão tomada */
  reasoning: string;

  /** Lista com as melhores técnicas candidatas avaliadas */
  topEvaluatedCandidates: BjjCandidateActionScore[];

  /** Memória tática atualizada para o próximo ciclo */
  updatedMemory: BjjTacticalMemory;
}
