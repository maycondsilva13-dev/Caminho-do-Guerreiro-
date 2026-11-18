/**
 * CAMINHO DO GUERREIRO: DO TATAME AO OCTÓGONO
 * Módulo Especializado de Jiu-Jitsu Brasileiro (BJJ) — Fase 3B: Motor de Inteligência Artificial
 *
 * Implementa a tomada de decisão autônoma dos adversários (NPCs) de Jiu-Jitsu.
 * Avalia o estado posicional, regras competitivas, repertório individual estrito,
 * atributos, 7 estilos de luta, 6 personalidades, gestão de energia, memória tática
 * e ameaças de finalização com determinismo absoluto (PRNG).
 */

import {
  BjjPosition,
  BjjPositionId,
  BjjTechnique,
  BjjTechniqueId,
  BjjTechniqueCategory,
  BjjTechniqueObjective,
  BjjParticipant
} from '../types/bjjCombat';
import {
  BjjMatchState,
  BjjCombatAthlete,
  BjjDeclaredAction,
  BjjCombatCycleRecord,
  BjjRng
} from '../types/bjjCombatEngine';
import {
  BjjCombatStyle,
  BjjPersonality,
  BjjAiProfile,
  BjjTacticalMemory,
  BjjCandidateActionScore,
  BjjAiDecisionResult
} from '../types/bjjAi';
import { BJJ_POSITIONS_CATALOG } from '../data/bjjPositionsData';
import { BJJ_TECHNIQUES_CATALOG } from '../data/bjjTechniquesCatalog';
import { validateDeclaredAction, createSeedableRng } from './bjjFightEngine';

// =========================================================================
// 1. GERENCIAMENTO DA MEMÓRIA TÁTICA (CAPACIDADE LIMITADA)
// =========================================================================

/**
 * Cria uma nova memória tática vazia com capacidade controlada.
 */
export function createInitialTacticalMemory(maxTrackedTechniques: number = 15): BjjTacticalMemory {
  return {
    ownTechniquesHistory: {},
    opponentPatterns: {
      takedownsAttempted: 0,
      guardPullsAttempted: 0,
      submissionsAttempted: 0,
      passesAttempted: 0,
      sweepsAttempted: 0,
      recentResolvedTechniques: []
    },
    cyclesObserved: 0,
    maxTrackedTechniques
  };
}

/**
 * Atualiza a memória tática a partir de um ciclo de combate já resolvido.
 * NUNCA antecipa ou inspeciona ações não declaradas.
 */
export function updateTacticalMemoryFromCycle(
  previousMemory: BjjTacticalMemory,
  cycleRecord: BjjCombatCycleRecord,
  aiParticipantId: BjjParticipant
): BjjTacticalMemory {
  const isA = aiParticipantId === 'athlete_a';
  const ownAction = isA ? cycleRecord.actionA : cycleRecord.actionB;
  const oppAction = isA ? cycleRecord.actionB : cycleRecord.actionA;
  const ownPoints = isA ? cycleRecord.pointsAwardedA : cycleRecord.pointsAwardedB;

  // Cópia profunda da memória anterior para manter pureza funcional
  const updatedOwnHistory = { ...previousMemory.ownTechniquesHistory };
  const oppPatterns = {
    ...previousMemory.opponentPatterns,
    recentResolvedTechniques: [...previousMemory.opponentPatterns.recentResolvedTechniques]
  };

  // 1. Atualizar histórico da técnica da própria IA
  if (ownAction.techniqueId) {
    const techId = ownAction.techniqueId;
    const existing = updatedOwnHistory[techId] || {
      attempts: 0,
      successes: 0,
      defendedByOpponent: 0,
      lastAttemptCycle: cycleRecord.cycleNumber,
      pointsEarned: 0
    };

    const isSuccess =
      cycleRecord.dominantOutcome?.outcomeType === 'sucesso_pleno' ||
      cycleRecord.dominantOutcome?.outcomeType === 'sucesso_parcial';

    const wasDefended =
      cycleRecord.dominantOutcome?.outcomeType === 'defesa' ||
      cycleRecord.interactionType === 'ataque_vs_defesa';

    updatedOwnHistory[techId] = {
      attempts: existing.attempts + 1,
      successes: isSuccess ? existing.successes + 1 : existing.successes,
      defendedByOpponent: wasDefended ? existing.defendedByOpponent + 1 : existing.defendedByOpponent,
      lastAttemptCycle: cycleRecord.cycleNumber,
      pointsEarned: existing.pointsEarned + ownPoints
    };

    // Controle de capacidade da memória
    const keys = Object.keys(updatedOwnHistory);
    if (keys.length > previousMemory.maxTrackedTechniques) {
      // Remover a técnica usada há mais tempo
      const oldestKey = keys.reduce((oldest, current) => {
        return updatedOwnHistory[current].lastAttemptCycle < updatedOwnHistory[oldest].lastAttemptCycle
          ? current
          : oldest;
      }, keys[0]);
      delete updatedOwnHistory[oldestKey];
    }
  }

  // 2. Atualizar padrões observados nas ações já concluídas do oponente
  if (oppAction.techniqueId) {
    const oppTech = BJJ_TECHNIQUES_CATALOG[oppAction.techniqueId];
    if (oppTech) {
      if (oppTech.objective === 'queda') oppPatterns.takedownsAttempted += 1;
      if (oppTech.id.includes('guard_pull') || oppTech.category === 'quedas_e_pe') oppPatterns.guardPullsAttempted += 1;
      if (oppTech.isSubmission || oppTech.objective === 'finalizacao') oppPatterns.submissionsAttempted += 1;
      if (oppTech.objective === 'passagem') oppPatterns.passesAttempted += 1;
      if (oppTech.objective === 'raspagem') oppPatterns.sweepsAttempted += 1;

      // Manter bounded array dos últimos movimentos (máx 5)
      oppPatterns.recentResolvedTechniques.push(oppTech.id);
      if (oppPatterns.recentResolvedTechniques.length > 5) {
        oppPatterns.recentResolvedTechniques.shift();
      }
    }
  }

  return {
    ownTechniquesHistory: updatedOwnHistory,
    opponentPatterns: oppPatterns,
    cyclesObserved: previousMemory.cyclesObserved + 1,
    maxTrackedTechniques: previousMemory.maxTrackedTechniques
  };
}

// =========================================================================
// 2. FABRICAÇÃO DE PERFIS COMPORTAMENTAIS
// =========================================================================

/**
 * Cria ou ajusta um perfil de IA com estilo e personalidade válidos.
 */
export function createBjjAiProfile(
  style: BjjCombatStyle,
  personality: BjjPersonality,
  overrides?: Partial<BjjAiProfile>
): BjjAiProfile {
  return {
    style,
    personality,
    preferredCategories: overrides?.preferredCategories,
    preferredObjectives: overrides?.preferredObjectives,
    customRiskTolerance: overrides?.customRiskTolerance
  };
}

// =========================================================================
// 3. AVALIAÇÃO HEURÍSTICA DE TÉCNICAS CANDIDATAS
// =========================================================================

/**
 * Avalia uma técnica candidata considerando todos os eixos táticos.
 */
function evaluateCandidateTechnique(
  technique: BjjTechnique,
  aiAthlete: BjjCombatAthlete,
  opponent: BjjCombatAthlete,
  state: BjjMatchState,
  profile: BjjAiProfile,
  memory: BjjTacticalMemory,
  currentPosition: BjjPosition,
  rng: BjjRng
): BjjCandidateActionScore {
  const proficiency = aiAthlete.repertoire[technique.id];
  const mastery = proficiency ? proficiency.masteryLevel : 1;

  // 1. PONTUAÇÃO BASE
  // Baseada no nível de domínio individual e alinhamento com atributos do atleta
  let baseScore = mastery * 12; // 12 a 60 pontos base

  for (const attr of technique.relevantAttributes) {
    const val = (aiAthlete.attributes as unknown as Record<string, number>)[attr] || 50;
    baseScore += (val - 50) * 0.15;
  }

  // 2. BÔNUS DE AMEAÇA DE FINALIZAÇÃO (MÁXIMA PRIORIDADE TÁTICA)
  let threatBonus = 0;
  if (state.activeSubmissionThreat) {
    const isDefender = state.activeSubmissionThreat.defender === aiAthlete.id;
    const isAttacker = state.activeSubmissionThreat.attacker === aiAthlete.id;

    if (isDefender) {
      // Se a IA está sob estrangulamento ou chave articular:
      if (
        technique.category === 'defesas' ||
        technique.objective === 'defesa' ||
        technique.objective === 'fuga'
      ) {
        threatBonus += 220; // Enorme incentivo para salvar a luta
        // Se a técnica foi desenhada exatamente para a técnica ameaçada:
        if (
          technique.threatenedTechniqueIds &&
          technique.threatenedTechniqueIds.includes(state.activeSubmissionThreat.techniqueId)
        ) {
          threatBonus += 150;
        }
      } else {
        // Tentar um ataque ofensivo enquanto está sendo finalizado é severamente penalizado
        threatBonus -= 250;
      }
    } else if (isAttacker) {
      // Se a IA está aplicando a finalização:
      if (technique.isSubmission || technique.objective === 'finalizacao') {
        threatBonus += 120; // Ajustar e pressionar o golpe
      } else if (technique.objective === 'estabilizacao') {
        threatBonus += 50; // Manter o domínio
      }
    }
  }

  const isStanding = currentPosition.category === 'em_pe';
  const isBottom = state.athleteBottom === aiAthlete.id || state.controlledAthlete === aiAthlete.id;
  const isTop = state.athleteTop === aiAthlete.id || state.controllingAthlete === aiAthlete.id;
  const isStaticHold =
    technique.id === 'bjj_tech_ctrl_side_stabilize' ||
    technique.id === 'bjj_tech_ctrl_dominant_retention' ||
    (technique.objective === 'estabilizacao' &&
      !technique.isSubmission &&
      technique.competitiveConsequences.pointsOnStabilization === 0 &&
      technique.outcomes.every((o) => o.resultingPositionId === currentPosition.id));

  const isDominantTopPos = [
    'top_half_guard_control',
    'top_side_control',
    'top_kesa_gatame',
    'top_north_south',
    'top_knee_on_belly',
    'top_mount',
    'top_high_mount',
    'top_back_control',
    'top_turtle_control',
    'def_side_control',
    'escape_side_control',
    'def_mount',
    'escape_mount',
    'def_back_control',
    'escape_back_control'
  ].includes(currentPosition.id);

  const isAdvancingControl =
    !isStaticHold &&
    (technique.competitiveConsequences.pointsOnStabilization >= 2 ||
      technique.objective === 'passagem' ||
      technique.objective === 'transicao' ||
      technique.outcomes.some(
        (o) =>
          o.resultingPositionId !== currentPosition.id &&
          ['top_knee_on_belly', 'top_mount', 'top_high_mount', 'top_back_control', 'top_north_south'].includes(o.resultingPositionId)
      ));

  // 3. BÔNUS DO ESTILO DE LUTA (7 ESTILOS)
  let styleBonus = 0;

  switch (profile.style) {
    case 'guardeiro':
      if (
        technique.id.includes('pull_guard') ||
        technique.id.includes('guard_pull') ||
        technique.displayName.toLowerCase().includes('puxada')
      ) {
        styleBonus += 65;
      }
      if (
        technique.objective === 'raspagem' ||
        technique.category === 'guarda_fechada' ||
        technique.category === 'guarda_aberta' ||
        technique.category === 'meia_guarda'
      ) {
        styleBonus += 50;
      }
      if (isBottom && (technique.isSubmission || technique.objective === 'finalizacao')) {
        styleBonus += 45;
      }
      if (isStanding && technique.objective === 'queda') {
        styleBonus -= 35; // Guardeiro prefere puxar ou esperar
      }
      break;

    case 'passador':
      if (technique.objective === 'passagem' || technique.category === 'passagem_guarda') {
        styleBonus += 65;
      }
      if (isTop && (technique.objective === 'estabilizacao' || technique.category === 'controle_posicional')) {
        styleBonus += 45;
      }
      if (technique.id.includes('pull_guard') || technique.id.includes('guard_pull')) {
        styleBonus -= 50; // Passador evita puxar para a guarda
      }
      break;

    case 'quedador':
      if (isStanding && (technique.objective === 'queda' || technique.category === 'quedas_e_pe')) {
        styleBonus += 75;
      }
      if (technique.id.includes('pull_guard') || technique.id.includes('guard_pull')) {
        styleBonus -= 60;
      }
      break;

    case 'finalizador':
      if (technique.isSubmission || technique.objective === 'finalizacao' || technique.category === 'finalizacoes') {
        styleBonus += 70;
      }
      if (technique.outcomes.some(o => o.resultingPositionId === 'top_mount' || o.resultingPositionId === 'top_back_control')) {
        styleBonus += 40; // Posicionamento para finalizar
      }
      break;

    case 'defensivo':
      if (
        technique.objective === 'defesa' ||
        technique.objective === 'fuga' ||
        technique.category === 'defesas' ||
        technique.category === 'fugas_e_recuperacoes'
      ) {
        styleBonus += 60;
      }
      if (technique.objective === 'estabilizacao') {
        styleBonus += 40;
      }
      if (technique.outcomes.some(o => o.outcomeType === 'falha_com_reversao')) {
        styleBonus -= 35; // Evita riscos
      }
      break;

    case 'pressionador':
      if (isTop) {
        styleBonus += 50;
      }
      if (
        technique.objective === 'passagem' ||
        technique.objective === 'queda' ||
        technique.objective === 'estabilizacao' ||
        technique.category === 'controle_posicional'
      ) {
        styleBonus += 45;
      }
      break;

    case 'completo':
      // Estilo equilibrado: escolhe o que for organicamente melhor para o cenário
      if (isStanding && technique.objective === 'queda') styleBonus += 25;
      if (isTop && technique.objective === 'passagem') styleBonus += 25;
      if (isBottom && technique.objective === 'raspagem') styleBonus += 25;
      if (technique.isSubmission) styleBonus += 25;
      break;
  }

  // Instinto natural de progressão e finalização quando está em posição dominante por cima (evita amarração infinita no 100kg/montada)
  if (isTop && isDominantTopPos) {
    if (technique.isSubmission || technique.objective === 'finalizacao') {
      styleBonus += 45;
    } else if (isAdvancingControl) {
      styleBonus += 42;
    }
  }

  // 4. BÔNUS DA PERSONALIDADE (6 PERSONALIDADES)
  let personalityBonus = 0;
  const hasReversalRisk = technique.outcomes.some(o => o.outcomeType === 'falha_com_reversao');

  switch (profile.personality) {
    case 'agressivo':
      if (technique.isSubmission || technique.objective === 'queda' || technique.objective === 'passagem') {
        personalityBonus += 30;
      }
      // Tolera risco de reversão sem hesitar
      if (hasReversalRisk) {
        personalityBonus += 5;
      }
      break;

    case 'paciente':
      // Prefere técnicas que domina com excelência e menor risco
      if (mastery >= 4) {
        personalityBonus += 35;
      }
      if (hasReversalRisk) {
        personalityBonus -= 30;
      }
      if (technique.staminaCost <= 15) {
        personalityBonus += 20;
      }
      break;

    case 'estrategico':
      // Analisa dinamicamente tempo, placar e comportamento
      {
        const isA = aiAthlete.id === 'athlete_a';
        const myPoints = isA ? state.score.pointsA : state.score.pointsB;
        const oppPoints = isA ? state.score.pointsB : state.score.pointsA;
        const myAdv = isA ? state.score.advantagesA : state.score.advantagesB;
        const oppAdv = isA ? state.score.advantagesB : state.score.advantagesA;
        const timeLeft = state.matchDurationSeconds - state.matchTimeElapsedSeconds;

        const isWinning = myPoints > oppPoints || (myPoints === oppPoints && myAdv > oppAdv);
        const isTrailing = oppPoints > myPoints || (myPoints === oppPoints && oppAdv > myAdv);

        if (isWinning && timeLeft < 120) {
          // Vencendo nos minutos finais: prefere progredir com segurança ou controlar; só amarra estaticamente nos últimos 25s
          if ((technique.objective === 'estabilizacao' && (!isStaticHold || timeLeft <= 25)) || technique.category === 'controle_posicional' && !isStaticHold) {
            personalityBonus += 40;
          }
          if (hasReversalRisk) {
            personalityBonus -= 45;
          }
        } else if (isTrailing) {
          // Perdendo: precisa virar a luta
          if (technique.competitiveConsequences.pointsOnStabilization >= 2) {
            personalityBonus += 40;
          }
          if (technique.isSubmission) {
            personalityBonus += 55;
          }
        }
      }
      break;

    case 'impulsivo':
      // Varia muito e assume riscos imprevisíveis
      personalityBonus += (rng() * 40) - 20; // Jitter de +-20 pts
      if (hasReversalRisk) {
        personalityBonus += 15;
      }
      break;

    case 'confiante':
      // Tende a repetir técnicas ofensivas/técnicas ativas que já produziram vitórias ou pontos (não amarração estática)
      {
        const mem = memory.ownTechniquesHistory[technique.id];
        if (!isStaticHold && mem && mem.successes > 0) {
          personalityBonus += 35 + (mem.successes * 5);
        }
      }
      break;

    case 'cauteloso':
      if (hasReversalRisk) {
        personalityBonus -= 50;
      }
      if (technique.objective === 'defesa' || (technique.objective === 'estabilizacao' && !isStaticHold)) {
        personalityBonus += 35;
      }
      break;
  }

  // 5. CONTEXTO TÁTICO GERAL (PLACAR E TEMPO)
  let tacticalContextBonus = 0;
  const isA = aiAthlete.id === 'athlete_a';
  const myPoints = isA ? state.score.pointsA : state.score.pointsB;
  const oppPoints = isA ? state.score.pointsB : state.score.pointsA;
  const timeLeft = state.matchDurationSeconds - state.matchTimeElapsedSeconds;

  if (myPoints > oppPoints && timeLeft <= 90) {
    // Vencendo na reta final do combate
    if (technique.objective === 'defesa' || (technique.objective === 'estabilizacao' && (!isStaticHold || timeLeft <= 25))) {
      tacticalContextBonus += 30;
    }
  } else if (oppPoints > myPoints) {
    // Atrás no placar: busca pontos urgentes ou finalização
    if (technique.isSubmission) {
      tacticalContextBonus += 45;
    }
    if (technique.competitiveConsequences.pointsOnStabilization >= 3) {
      tacticalContextBonus += 35;
    }
  }

  // Anti-amarração: evita que a IA fique parada em controle estático (ex: estabilizar 100kg indefinidamente)
  if (isStaticHold) {
    const holdMem = memory.ownTechniquesHistory[technique.id];
    const usedRecently = Boolean(holdMem && (memory.cyclesObserved - holdMem.lastAttemptCycle < 2));
    if (usedRecently) {
      tacticalContextBonus -= 80;
    } else if (state.isPointsStabilized && !(myPoints > oppPoints && timeLeft <= 25)) {
      tacticalContextBonus -= 45;
    }
  }

  // 6. MEMÓRIA TÁTICA (AVALIAÇÃO DE SUCESSOS E DEFESAS ANTERIORES)
  let memoryBonus = 0;
  const mem = memory.ownTechniquesHistory[technique.id];
  if (mem) {
    // Se a técnica já foi defendida reiteradamente pelo adversário:
    if (mem.defendedByOpponent >= 2) {
      memoryBonus -= 35;
    }
    // Se a técnica ativa já rendeu pontos ou sucesso nesta luta:
    if (!isStaticHold && mem.successes > 0) {
      memoryBonus += 20;
    }
  }

  // Se o adversário tenta muitas quedas e estamos em pé:
  if (
    isStanding &&
    memory.opponentPatterns.takedownsAttempted >= 2 &&
    (technique.category === 'defesas' || technique.displayName.toLowerCase().includes('sprawl'))
  ) {
    memoryBonus += 40;
  }

  // 7. PENALIDADE POR FADIGA E ENERGIA ESCASSA
  let fatigueStaminaPenalty = 0;
  if (aiAthlete.energy < 40) {
    // Atleta cansando: penaliza técnicas de alto custo de estamina
    const excessCost = Math.max(0, technique.staminaCost - 15);
    fatigueStaminaPenalty = excessCost * 2.8;

    if (aiAthlete.energy < 20 && technique.staminaCost > 20) {
      fatigueStaminaPenalty += 50; // Quase inviabiliza técnicas pesadas no esgotamento
    }
  }

  // Se a fadiga acumulada for alta (> 50):
  if (aiAthlete.accumulatedFatigue > 50) {
    fatigueStaminaPenalty += (aiAthlete.accumulatedFatigue - 50) * 0.5;
  }

  // Total consolidado
  const totalScore =
    baseScore +
    threatBonus +
    styleBonus +
    personalityBonus +
    tacticalContextBonus +
    memoryBonus -
    fatigueStaminaPenalty;

  const rationale = `Base: ${baseScore.toFixed(0)}, Estilo: ${styleBonus}, Pers: ${personalityBonus}, Ameaça: ${threatBonus}, Tático: ${tacticalContextBonus}, Memória: ${memoryBonus}, PenGás: -${fatigueStaminaPenalty.toFixed(0)}`;

  return {
    techniqueId: technique.id,
    techniqueName: technique.displayName,
    category: technique.category,
    objective: technique.objective,
    baseScore,
    styleBonus,
    personalityBonus,
    tacticalContextBonus,
    threatBonus,
    memoryBonus,
    fatigueStaminaPenalty,
    totalScore,
    tacticalRationale: rationale
  };
}

// =========================================================================
// 4. FUNÇÃO PRINCIPAL DE ESCOLHA DA AÇÃO DA IA
// =========================================================================

/**
 * Seleciona a melhor ação tática para o atleta NPC com base no estado do combate,
 * repertório individual estrito, perfil de combate e memória tática.
 *
 * Utiliza o gerador determinístico BjjRng para desempates ou variações comportamentais.
 * NUNCA executa técnicas diretamente nem modifica o estado do combate.
 */
export function chooseBjjAiAction(
  matchState: BjjMatchState,
  aiAthlete: BjjCombatAthlete,
  opponent: BjjCombatAthlete,
  aiProfile: BjjAiProfile,
  tacticalMemory: BjjTacticalMemory,
  rng?: BjjRng
): BjjAiDecisionResult {
  // Garantir gerador determinístico caso não seja injetado
  const deterministicRng = rng || createSeedableRng(matchState.rngSeed + matchState.history.length).next;

  const currentPos = BJJ_POSITIONS_CATALOG[matchState.currentPositionId] || BJJ_POSITIONS_CATALOG.stand_neutral;

  // 1. FILTRAR TÉCNICAS ESTRITAMENTE VÁLIDAS DO REPERTÓRIO INDIVIDUAL
  const candidateScores: BjjCandidateActionScore[] = [];
  const repertoire = aiAthlete.repertoire || {};

  for (const techId of Object.keys(repertoire)) {
    const proficiency = repertoire[techId];
    if (!proficiency || !proficiency.isKnown) continue;

    const technique = BJJ_TECHNIQUES_CATALOG[techId];
    if (!technique) continue;

    // Testar validação oficial com a regra do motor Fase 3A
    const testAction: BjjDeclaredAction = {
      athleteId: aiAthlete.id,
      techniqueId: technique.id
    };

    const validation = validateDeclaredAction(matchState, testAction);
    if (!validation.isValid) continue;

    // Avaliar a técnica candidata
    const score = evaluateCandidateTechnique(
      technique,
      aiAthlete,
      opponent,
      matchState,
      aiProfile,
      tacticalMemory,
      currentPos,
      deterministicRng
    );

    candidateScores.push(score);
  }

  // 2. GESTÃO INTELIGENTE DE FÔLEGO OU REPERTÓRIO ESGOTADO
  const underSubThreat = matchState.activeSubmissionThreat?.defender === aiAthlete.id;
  if (candidateScores.length === 0 || (aiAthlete.energy <= 8 && !underSubThreat)) {
    const fallbackAction: BjjDeclaredAction = {
      athleteId: aiAthlete.id,
      techniqueId: null,
      intent: 'Manter base, recompor postura e recuperar fôlego'
    };

    return {
      action: fallbackAction,
      chosenTechnique: null,
      intent: fallbackAction.intent || 'Manter postura e recuperar fôlego',
      reasoning:
        candidateScores.length === 0
          ? 'Nenhuma técnica do repertório individual é válida ou o atleta está sem energia; recuperando fôlego e postura.'
          : 'Gás crítico: recuperando fôlego com base segura antes de nova ofensiva.',
      topEvaluatedCandidates: candidateScores.slice(0, 3),
      updatedMemory: tacticalMemory
    };
  }

  // 3. ORDENAÇÃO DOS CANDIDATOS
  // Adiciona pequena variação pseudo-aleatória determinística para desempate
  candidateScores.sort((a, b) => {
    const jitterA = (deterministicRng() - 0.5) * 3;
    const jitterB = (deterministicRng() - 0.5) * 3;
    return (b.totalScore + jitterB) - (a.totalScore + jitterA);
  });

  const bestCandidate = candidateScores[0];
  const chosenTech = BJJ_TECHNIQUES_CATALOG[bestCandidate.techniqueId] || null;

  const chosenAction: BjjDeclaredAction = {
    athleteId: aiAthlete.id,
    techniqueId: bestCandidate.techniqueId,
    intent: `${aiProfile.style} (${aiProfile.personality}): ${bestCandidate.techniqueName}`
  };

  const reasoning = `Decisão tomada: "${bestCandidate.techniqueName}" (Score: ${bestCandidate.totalScore.toFixed(1)}). [${bestCandidate.tacticalRationale}]`;

  return {
    action: chosenAction,
    chosenTechnique: chosenTech,
    intent: chosenAction.intent || '',
    reasoning,
    topEvaluatedCandidates: candidateScores.slice(0, 5),
    updatedMemory: tacticalMemory
  };
}
