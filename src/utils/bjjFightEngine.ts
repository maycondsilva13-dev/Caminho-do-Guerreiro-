/**
 * CAMINHO DO GUERREIRO: DO TATAME AO OCTÓGONO
 * Módulo Especializado de Jiu-Jitsu Brasileiro (BJJ) — Fase 3A: Motor de Resolução Simultânea
 *
 * Implementa o ciclo central de combate simultâneo, validação bilateral de ações,
 * cálculo determinístico de potência técnica/física, seleção de desfechos múltiplos,
 * gerenciamento de energia, fadiga, tempo e integridade das regras da CBJJ/IBJJF.
 */

import {
  BjjPosition,
  BjjPositionId,
  BjjTechnique,
  BjjTechniqueId,
  BjjTechniqueOutcome,
  BjjParticipant,
  AthleteRole,
  BjjStabilityLevel,
  BjjGripType
} from '../types/bjjCombat';
import {
  BjjMatchState,
  BjjCombatAthlete,
  BjjDeclaredAction,
  BjjInteractionType,
  BjjCombatCycleRecord,
  BjjSubmissionThreat,
  BjjRng
} from '../types/bjjCombatEngine';
import { BJJ_POSITIONS_CATALOG } from '../data/bjjPositionsData';
import { BJJ_TECHNIQUES_CATALOG } from '../data/bjjTechniquesCatalog';
import { FighterAttributes } from '../types/game';

// =========================================================================
// 1. GERADOR PSEUDO-ALEATÓRIO DETERMINÍSTICO (PRNG)
// =========================================================================

/**
 * Cria um gerador de números pseudo-aleatórios determinístico (Mulberry32).
 * Garante que a mesma semente gere exatamente a mesma sequência de resultados.
 */
export function createSeedableRng(seed: number): { next: BjjRng; getSeed: () => number } {
  let s = seed >>> 0;
  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, getSeed: () => s };
}

// =========================================================================
// 2. INICIALIZAÇÃO DO ESTADO CENTRAL DE COMBATE
// =========================================================================

/**
 * Cria o estado inicial do combate a partir de dois atletas e uma posição de início.
 */
export function createInitialBjjMatchState(
  athleteAInput: Partial<BjjCombatAthlete> & { name: string; attributes: FighterAttributes },
  athleteBInput: Partial<BjjCombatAthlete> & { name: string; attributes: FighterAttributes },
  initialPositionId: BjjPositionId = 'stand_neutral',
  matchDurationSeconds: number = 360,
  rngSeed: number = 12345,
  isGi: boolean = true,
  ageCategory: 'infantil' | 'juvenil' | 'adulto' | 'master' = 'adulto',
  matchType: 'sparring' | 'competicao' = 'sparring',
  matchId?: string,
  tournamentContext?: BjjMatchState['tournamentContext']
): BjjMatchState {
  const athleteA: BjjCombatAthlete = {
    id: 'athlete_a',
    name: athleteAInput.name,
    nickname: athleteAInput.nickname || '',
    isPlayer: athleteAInput.isPlayer ?? true,
    avatar: athleteAInput.avatar || '🥋',
    beltRankIndex: athleteAInput.beltRankIndex ?? 0,
    beltName: athleteAInput.beltName || 'Faixa Branca',
    weight: athleteAInput.weight || 70,
    age: athleteAInput.age,
    attributes: { ...athleteAInput.attributes },
    energy: athleteAInput.energy ?? 100,
    maxEnergy: 100,
    accumulatedFatigue: athleteAInput.accumulatedFatigue ?? 0,
    repertoire: { ...athleteAInput.repertoire }
  };

  const athleteB: BjjCombatAthlete = {
    id: 'athlete_b',
    name: athleteBInput.name,
    nickname: athleteBInput.nickname || '',
    isPlayer: athleteBInput.isPlayer ?? false,
    avatar: athleteBInput.avatar || '🥋',
    beltRankIndex: athleteBInput.beltRankIndex ?? 0,
    beltName: athleteBInput.beltName || 'Faixa Branca',
    weight: athleteBInput.weight || 70,
    age: athleteBInput.age,
    attributes: { ...athleteBInput.attributes },
    energy: athleteBInput.energy ?? 100,
    maxEnergy: 100,
    accumulatedFatigue: athleteBInput.accumulatedFatigue ?? 0,
    repertoire: { ...athleteBInput.repertoire }
  };

  const initialPosition = BJJ_POSITIONS_CATALOG[initialPositionId] || BJJ_POSITIONS_CATALOG.stand_neutral;

  return {
    athleteA,
    athleteB,
    currentPositionId: initialPosition.id,
    athleteTop: initialPosition.athleteTop,
    athleteBottom: initialPosition.athleteBottom,
    controllingAthlete: initialPosition.controllingAthlete,
    controlledAthlete: initialPosition.controlledAthlete,
    activeGrips: initialPosition.primaryGrips,
    stability: initialPosition.stability,
    positionDurationSeconds: 0,
    isPointsStabilized: false,
    score: {
      pointsA: 0,
      pointsB: 0,
      advantagesA: 0,
      advantagesB: 0,
      penaltiesA: 0,
      penaltiesB: 0
    },
    matchTimeElapsedSeconds: 0,
    matchDurationSeconds,
    isGi,
    ageCategory,
    matchType,
    matchId,
    tournamentContext,
    status: 'em_andamento',
    winner: null,
    winMethod: null,
    activeSubmissionThreat: null,
    history: [],
    rngSeed
  };
}

// =========================================================================
// 3. VALIDAÇÃO INDIVIDUAL DE AÇÃO DECLARADA
// =========================================================================

export interface ActionValidationResult {
  isValid: boolean;
  reason?: string;
  technique?: BjjTechnique;
}

/**
 * Valida se uma ação pode ser executada por um atleta na situação atual do combate.
 */
export function validateDeclaredAction(
  state: BjjMatchState,
  action: BjjDeclaredAction
): ActionValidationResult {
  // Ação nula/espera é sempre válida
  if (!action.techniqueId) {
    return { isValid: true };
  }

  const athlete = action.athleteId === 'athlete_a' ? state.athleteA : state.athleteB;
  const technique = BJJ_TECHNIQUES_CATALOG[action.techniqueId];

  // 1. Existência no catálogo
  if (!technique) {
    return { isValid: false, reason: `Técnica "${action.techniqueId}" não existe no catálogo.` };
  }

  // 2. Conhecimento e repertório
  const proficiency = athlete.repertoire[technique.id];
  if (!proficiency || !proficiency.isKnown) {
    return {
      isValid: false,
      reason: `${athlete.name} não aprendeu a técnica "${technique.displayName}".`,
      technique
    };
  }

  // 3. Domínio mínimo exigido
  if (proficiency.masteryLevel < technique.minMasteryLevel) {
    return {
      isValid: false,
      reason: `Domínio insuficiente (${proficiency.masteryLevel} < ${technique.minMasteryLevel}) para "${technique.displayName}".`,
      technique
    };
  }

  // 4. Posição inicial permitida
  if (!technique.initialPositions.includes(state.currentPositionId)) {
    return {
      isValid: false,
      reason: `Técnica "${technique.displayName}" requer uma das posições permitidas, mas a luta está em "${state.currentPositionId}".`,
      technique
    };
  }

  // 5. Papel do atleta na posição de combate
  const currentPos = BJJ_POSITIONS_CATALOG[state.currentPositionId];
  const isTop = state.athleteTop === athlete.id;
  const isBottom = state.athleteBottom === athlete.id;
  const isControlling = state.controllingAthlete === athlete.id;
  const isControlled = state.controlledAthlete === athlete.id;
  const isStanding = currentPos?.category === 'em_pe';
  const isNeutralSymmetric =
    state.athleteTop === 'none' &&
    state.athleteBottom === 'none' &&
    state.controllingAthlete === 'none' &&
    state.controlledAthlete === 'none';

  let roleCompatible = false;
  switch (technique.executorRole) {
    case 'qualquer':
      roleCompatible = true;
      break;
    case 'em_pe':
      roleCompatible = isStanding;
      break;
    case 'por_cima':
      roleCompatible = isTop || isControlling || (!isStanding && isNeutralSymmetric);
      break;
    case 'por_baixo':
      roleCompatible = isBottom || isControlled || (!isStanding && isNeutralSymmetric);
      break;
    case 'controlador':
      roleCompatible = isControlling || isTop || (!isStanding && isNeutralSymmetric);
      break;
    case 'defensor':
      roleCompatible =
        isControlled ||
        isBottom ||
        isNeutralSymmetric ||
        state.activeSubmissionThreat?.defender === athlete.id;
      break;
  }

  if (!roleCompatible) {
    return {
      isValid: false,
      reason: `Papel incompatível: "${technique.displayName}" exige papel "${technique.executorRole}", mas ${athlete.name} não está nesta condição.`,
      technique
    };
  }

  // 6. Energia mínima para tentar a técnica
  if (athlete.energy <= 0) {
    return {
      isValid: false,
      reason: `${athlete.name} está totalmente sem energia/gás para executar "${technique.displayName}".`,
      technique
    };
  }

  // 7. Legalidade regulamentar por faixa
  if (technique.legality && athlete.beltRankIndex < technique.legality.minBeltRank) {
    return {
      isValid: false,
      reason: `Técnica ilegal para a graduação ${athlete.beltName} (requer no mínimo ${technique.legality.minBeltName}).`,
      technique
    };
  }

  // 8. Legalidade Gi vs No-Gi
  const isGiMatch = state.isGi !== false; // Padrão é com quimono se não especificado
  if (technique.legality) {
    if (isGiMatch && !technique.legality.giAllowed) {
      return {
        isValid: false,
        reason: `Técnica proibida em combates com quimono (Gi). ${technique.legality.legalNotes || 'Permitida apenas em No-Gi.'}`,
        technique
      };
    }
    if (!isGiMatch && !technique.legality.noGiAllowed) {
      return {
        isValid: false,
        reason: `Técnica exclusiva de quimono (requer pegadas na vestimenta/lapela). Proibida no No-Gi.`,
        technique
      };
    }

    // 9. Restrição estrita sob regras oficiais da CBJJ de quimono
    if (isGiMatch && technique.legality.illegalUnderCbjjRules) {
      return {
        isValid: false,
        reason: `Técnica estritamente proibida sob as regras da CBJJ/IBJJF no quimono (desqualificação imediata).`,
        technique
      };
    }

    // 10. Validação de idade mínima do catálogo (ex: chave de joelho reta, toe hold, calf slicer minAge: 18)
    if (technique.legality.minAge !== undefined) {
      const athleteAge = athlete.age ?? (state.ageCategory === 'juvenil' || state.ageCategory === 'infantil' ? 16 : 20);
      if (athleteAge < technique.legality.minAge || state.ageCategory === 'infantil' || state.ageCategory === 'juvenil') {
        return {
          isValid: false,
          reason: `Técnica restrita por idade: requer no mínimo ${technique.legality.minAge} anos (categoria Adulto/Master). Atleta com ${athleteAge} anos.`,
          technique
        };
      }
    }
  }

  return { isValid: true, technique };
}

// =========================================================================
// 4. CLASSIFICAÇÃO DE INTERAÇÃO SIMULTÂNEA
// =========================================================================

/**
 * Classifica a natureza da interação entre as duas ações declaradas.
 */
export function classifyBjjInteraction(
  valA: ActionValidationResult,
  valB: ActionValidationResult
): BjjInteractionType {
  // Se uma ou ambas forem inválidas
  if (!valA.isValid || !valB.isValid) {
    return 'acao_invalida';
  }

  const techA = valA.technique;
  const techB = valB.technique;

  // Ambas em espera/ajuste neutro
  if (!techA && !techB) {
    return 'acoes_compativeis';
  }

  // Se apenas uma ação foi declarada e a outra é nula
  if (!techA || !techB) {
    return 'acoes_compativeis';
  }

  // Ação contra defesa direta
  const aDefendsB = techA.category === 'defesas' && (techA.threatenedTechniqueIds?.includes(techB.id) || techB.possibleDefenses?.includes(techA.id));
  const bDefendsA = techB.category === 'defesas' && (techB.threatenedTechniqueIds?.includes(techA.id) || techA.possibleDefenses?.includes(techB.id));

  if (aDefendsB || bDefendsA) {
    return 'ataque_vs_defesa';
  }

  // Ataque contra ataque (ambos buscam queda, raspagem, passagem ou finalização)
  const isAttackA = ['queda', 'raspagem', 'passagem', 'finalizacao'].includes(techA.objective);
  const isAttackB = ['queda', 'raspagem', 'passagem', 'finalizacao'].includes(techB.objective);

  if (isAttackA && isAttackB) {
    return 'ataque_vs_ataque';
  }

  // Disputa posicional (controle vs fuga ou passagem vs retenção)
  if (
    (techA.objective === 'passagem' && techB.objective === 'defesa') ||
    (techB.objective === 'passagem' && techA.objective === 'defesa') ||
    (techA.objective === 'estabilizacao' && techB.objective === 'fuga') ||
    (techB.objective === 'estabilizacao' && techA.objective === 'fuga')
  ) {
    return 'disputa_posicional';
  }

  // Caso complexo ou compatível
  if (techA.category === techB.category && techA.objective === 'estabilizacao' && techB.objective === 'estabilizacao') {
    return 'acoes_compativeis';
  }

  return 'disputa_complexa';
}

// =========================================================================
// 5. CÁLCULO TÉCNICO E FÍSICO DE POTÊNCIA DE EXECUÇÃO
// =========================================================================

/**
 * Calcula a potência efetiva de execução de uma técnica considerando atributos,
 * domínio, energia atual, fadiga acumulada e vantagem posicional.
 */
export function calculateExecutionPower(
  athlete: BjjCombatAthlete,
  technique: BjjTechnique,
  state: BjjMatchState,
  rng: BjjRng
): { power: number; factorSummary: string } {
  const attrs = athlete.attributes;
  const prof = athlete.repertoire[technique.id] || { masteryLevel: 1, experiencePoints: 0 };

  // Peso ponderado de atributos fundamentais da técnica
  let attrScore = attrs.technique * 0.40 + attrs.fightIq * 0.25;
  if (technique.relevantAttributes.includes('strength')) attrScore += attrs.strength * 0.15;
  if (technique.relevantAttributes.includes('speed')) attrScore += attrs.speed * 0.15;
  if (technique.relevantAttributes.includes('flexibility')) attrScore += attrs.flexibility * 0.10;
  if (technique.relevantAttributes.includes('stamina')) attrScore += attrs.stamina * 0.10;

  // Bônus de maestria técnica (1 a 5 estrelas: +0% a +48%)
  const masteryMultiplier = 1 + (prof.masteryLevel - 1) * 0.12;

  // Eficiência de energia (0.5 a 1.0)
  const energyFactor = 0.5 + 0.5 * (Math.max(0, athlete.energy) / 100);

  // Penalidade de fadiga acumulada (0% a 25% de redução)
  const fatiguePenalty = Math.max(0.75, 1 - (athlete.accumulatedFatigue * 0.0025));

  // Vantagem posicional do atleta na posição atual
  const currentPos = BJJ_POSITIONS_CATALOG[state.currentPositionId];
  let positionBonus = 1.0;
  if (currentPos && currentPos.advantage === athlete.id) {
    positionBonus = 1.15;
  } else if (currentPos && currentPos.advantage !== 'neutral' && currentPos.advantage !== 'contested' && currentPos.advantage !== athlete.id) {
    positionBonus = 0.90;
  }

  // Variação estocástica controlada via PRNG (+/- 7%)
  const jitter = 0.93 + rng() * 0.14;

  const totalPower = attrScore * masteryMultiplier * energyFactor * fatiguePenalty * positionBonus * jitter;

  return {
    power: Math.round(totalPower * 10) / 10,
    factorSummary: `Base: ${Math.round(attrScore)} | Maestria: x${masteryMultiplier.toFixed(2)} | Gás: ${Math.round(athlete.energy)}% | Fadiga: ${Math.round(athlete.accumulatedFatigue)}%`
  };
}

// =========================================================================
// 6. MOTOR PRINCIPAL: RESOLUÇÃO DE UM CICLO SIMULTÂNEO
// =========================================================================

/**
 * Executa um ciclo completo de resolução simultânea entre as duas ações.
 */
export function executeBjjCombatCycle(
  state: BjjMatchState,
  actionA: BjjDeclaredAction,
  actionB: BjjDeclaredAction
): BjjMatchState {
  // Clona o estado de forma pura para não gerar mutação externa
  const next = JSON.parse(JSON.stringify(state)) as BjjMatchState;

  // Se a luta já encerrou, retorna o estado inalterado
  if (next.status !== 'em_andamento') {
    return next;
  }

  const { next: rng, getSeed } = createSeedableRng(next.rngSeed);

  // 1. Validação individual bilateral
  const valA = validateDeclaredAction(next, actionA);
  const valB = validateDeclaredAction(next, actionB);

  // 2. Classificação de interação simultânea
  const interaction = classifyBjjInteraction(valA, valB);

  let dominantOutcome: BjjTechniqueOutcome | null = null;
  let winningTechniqueId: string | undefined;
  let decidingFactor = '';
  let technicalNarration = '';
  let pointsA = 0;
  let pointsB = 0;
  let advA = false;
  let advB = false;
  let cycleDuration = 5;
  let winningAthleteId: BjjParticipant | 'none' = 'none';

  // =======================================================================
  // CASO A: UMA OU AMBAS AS AÇÕES SÃO INVÁLIDAS
  // =======================================================================
  if (!valA.isValid || !valB.isValid) {
    if (!valA.isValid && !valB.isValid) {
      decidingFactor = 'Ambas as ações declaradas foram inválidas.';
      technicalNarration = `Disputa travada no tatame. Ação de ${next.athleteA.name} inválida (${valA.reason}) e ação de ${next.athleteB.name} inválida (${valB.reason}). Os atletas mantêm a postura.`;
      cycleDuration = 3;
    } else if (!valA.isValid && valB.isValid && valB.technique) {
      // B tem ação válida contra A inválido
      winningAthleteId = 'athlete_b';
      winningTechniqueId = valB.technique.id;
      dominantOutcome = valB.technique.outcomes[0];
      decidingFactor = `${next.athleteA.name} tentou ação inválida (${valA.reason}), cedendo a iniciativa a ${next.athleteB.name}.`;
      technicalNarration = `${next.athleteA.name} falhou em executar a técnica por falta de pré-requisitos. ${next.athleteB.name} aproveitou a hesitação e aplicou ${valB.technique.displayName}!`;
      cycleDuration = valB.technique.estimatedDurationSeconds;
    } else if (valA.isValid && valA.technique && !valB.isValid) {
      // A tem ação válida contra B inválido
      winningAthleteId = 'athlete_a';
      winningTechniqueId = valA.technique.id;
      dominantOutcome = valA.technique.outcomes[0];
      decidingFactor = `${next.athleteB.name} tentou ação inválida (${valB.reason}), cedendo a iniciativa a ${next.athleteA.name}.`;
      technicalNarration = `${next.athleteB.name} hesitou com técnica inválida. ${next.athleteA.name} aproveitou o vacilo e conectou ${valA.technique.displayName}!`;
      cycleDuration = valA.technique.estimatedDurationSeconds;
    }
  }

  // =======================================================================
  // CASO B: AÇÕES COMPATÍVEIS OU ESPERA
  // =======================================================================
  else if (interaction === 'acoes_compativeis') {
    if (!valA.technique && !valB.technique) {
      decidingFactor = 'Ambos os atletas aguardando momento tático ideal.';
      technicalNarration = `Os dois atletas medem distância, controlam a respiração e ajustam pegadas sob estudo mútuo.`;
      cycleDuration = 4;
    } else if (valA.technique && !valB.technique) {
      winningAthleteId = 'athlete_a';
      winningTechniqueId = valA.technique.id;
      dominantOutcome = valA.technique.outcomes[0];
      decidingFactor = `${next.athleteA.name} teve iniciativa isolada de ${valA.technique.displayName}.`;
      technicalNarration = `${next.athleteA.name} trabalhou tecnicamente com ${valA.technique.displayName} enquanto ${next.athleteB.name} apenas manteve a contenção e o fôlego.`;
      cycleDuration = valA.technique.estimatedDurationSeconds;
    } else if (!valA.technique && valB.technique) {
      winningAthleteId = 'athlete_b';
      winningTechniqueId = valB.technique.id;
      dominantOutcome = valB.technique.outcomes[0];
      decidingFactor = `${next.athleteB.name} teve iniciativa isolada de ${valB.technique.displayName}.`;
      technicalNarration = `${next.athleteB.name} impôs ${valB.technique.displayName} enquanto ${next.athleteA.name} manteve a base e recuperou fôlego.`;
      cycleDuration = valB.technique.estimatedDurationSeconds;
    }
  }

  // =======================================================================
  // CASO C: ATAQUE VS DEFESA OU CONTRA-ATAQUE
  // =======================================================================
  else if (interaction === 'ataque_vs_defesa' || interaction === 'contra_ataque') {
    const isAttackerA = valB.technique?.category === 'defesas';
    const attacker = isAttackerA ? next.athleteA : next.athleteB;
    const defender = isAttackerA ? next.athleteB : next.athleteA;
    const attackTech = isAttackerA ? valA.technique! : valB.technique!;
    const defenseTech = isAttackerA ? valB.technique! : valA.technique!;

    const pAttack = calculateExecutionPower(attacker, attackTech, next, rng);
    const pDefense = calculateExecutionPower(defender, defenseTech, next, rng);

    // Bônus de antecipação quando o atleta declara a defesa específica catalogada para a técnica adversária
    const isSpecificDefense =
      defenseTech.threatenedTechniqueIds?.includes(attackTech.id) ||
      attackTech.possibleDefenses?.includes(defenseTech.id);
    const defenseBonusMultiplier = isSpecificDefense ? 1.25 : 1.0;
    const effectiveDefensePower = pDefense.power * defenseBonusMultiplier;

    cycleDuration = Math.max(attackTech.estimatedDurationSeconds, defenseTech.estimatedDurationSeconds);

    // Se o defensor superar o atacante (ou ficar próximo com margem de segurança)
    if (effectiveDefensePower >= pAttack.power * 0.90) {
      // Defesa bem-sucedida!
      winningAthleteId = defender.id;
      winningTechniqueId = defenseTech.id;
      dominantOutcome = defenseTech.outcomes[0] || attackTech.outcomes.find((o) => o.outcomeType === 'defesa') || attackTech.outcomes[1];
      decidingFactor = `Defesa bem-sucedida de ${defender.name} (${pDefense.factorSummary}${isSpecificDefense ? ' [Defesa Específica +25%]' : ''}) superou o ataque (${pAttack.power} vs ${effectiveDefensePower.toFixed(1)}).`;
      technicalNarration = `${attacker.name} disparou ${attackTech.displayName}, mas ${defender.name} antecipou com precisão cirúrgica aplicando ${defenseTech.displayName} e neutralizou a investida!`;

      // Se havia ameaça de finalização ativa e foi defendida, anula a ameaça
      if (next.activeSubmissionThreat && next.activeSubmissionThreat.defender === defender.id) {
        next.activeSubmissionThreat = null;
        technicalNarration += ` ${defender.name} desvencilhou a finalização com maestria!`;
      }
    } else {
      // Atacante rompe a defesa
      winningAthleteId = attacker.id;
      winningTechniqueId = attackTech.id;
      dominantOutcome = attackTech.outcomes[0];
      decidingFactor = `Ataque contundente de ${attacker.name} (${pAttack.factorSummary}) quebrou a defesa (${pAttack.power} vs ${effectiveDefensePower.toFixed(1)}).`;
      technicalNarration = `${attacker.name} impôs pressão máxima com ${attackTech.displayName}, rompendo o bloqueio de ${defender.name} e concluindo o golpe!`;
    }
  }

  // =======================================================================
  // CASO D: ATAQUE VS ATAQUE OU DISPUTA POSICIONAL / COMPLEXA
  // =======================================================================
  else {
    const techA = valA.technique!;
    const techB = valB.technique!;

    const pA = calculateExecutionPower(next.athleteA, techA, next, rng);
    const pB = calculateExecutionPower(next.athleteB, techB, next, rng);

    cycleDuration = Math.round((techA.estimatedDurationSeconds + techB.estimatedDurationSeconds) / 2);

    const diff = pA.power - pB.power;

    if (Math.abs(diff) <= 3) {
      // Empate ou choque de forças: scramble ou disputa
      const scrambleOutcome = techA.outcomes.find((o) => o.outcomeType === 'disputa') || techB.outcomes.find((o) => o.outcomeType === 'disputa');
      dominantOutcome = scrambleOutcome || {
        outcomeType: 'disputa',
        resultingPositionId: 'trans_scramble',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 15,
        staminaCostOpponent: 15,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Choque equilibrado de forças que resulta em scramble aberto no solo.'
      };
      winningAthleteId = 'none';
      decidingFactor = `Equilíbrio tático estrito (${pA.power} vs ${pB.power}).`;
      technicalNarration = `Choque simultâneo! ${next.athleteA.name} tentou ${techA.displayName} ao mesmo tempo em que ${next.athleteB.name} disparou ${techB.displayName}. A força mútua resultou em scramble no tatame!`;
    } else if (diff > 0) {
      // Atleta A venceu a disputa
      winningAthleteId = 'athlete_a';
      winningTechniqueId = techA.id;
      dominantOutcome = diff > 15 ? techA.outcomes[0] : (techA.outcomes.find((o) => o.outcomeType === 'sucesso_parcial') || techA.outcomes[0]);
      decidingFactor = `Superioridade técnica de ${next.athleteA.name} (${pA.power} vs ${pB.power} de B).`;
      technicalNarration = `Em duelo aberto, ${next.athleteA.name} levou a melhor com ${techA.displayName}, superando a tentativa de ${techB.displayName} de ${next.athleteB.name}!`;
    } else {
      // Atleta B venceu a disputa
      winningAthleteId = 'athlete_b';
      winningTechniqueId = techB.id;
      dominantOutcome = Math.abs(diff) > 15 ? techB.outcomes[0] : (techB.outcomes.find((o) => o.outcomeType === 'sucesso_parcial') || techB.outcomes[0]);
      decidingFactor = `Superioridade técnica de ${next.athleteB.name} (${pB.power} vs ${pA.power} de A).`;
      technicalNarration = `Em duelo aberto, ${next.athleteB.name} superou o adversário com ${techB.displayName}, neutralizando a tentativa de ${next.athleteA.name}!`;
    }
  }

  // =======================================================================
  // 7. APLICAÇÃO BILATERAL DO RESULTADO NO ESTADO
  // =======================================================================

  const posBefore = next.currentPositionId;
  const keepCurrentOnDominantRetention = winningTechniqueId === 'bjj_tech_ctrl_dominant_retention';

  if (dominantOutcome) {
    // 1. Atualizar posição bilateral
    const targetPosId = keepCurrentOnDominantRetention ? posBefore : dominantOutcome.resultingPositionId;
    const nextPos = BJJ_POSITIONS_CATALOG[targetPosId];
    if (nextPos) {
      next.currentPositionId = nextPos.id;
      next.stability = nextPos.stability;
      next.activeGrips = keepCurrentOnDominantRetention
        ? (next.activeGrips || nextPos.primaryGrips)
        : (dominantOutcome.gripsAfter || nextPos.primaryGrips);
    }

    // 2. Atualizar quem está por cima e por baixo
    const executorId = winningAthleteId === 'athlete_b' ? 'athlete_b' : 'athlete_a';
    const opponentId = executorId === 'athlete_a' ? 'athlete_b' : 'athlete_a';

    if (dominantOutcome.topAthleteAfter === 'executor') {
      next.athleteTop = executorId;
      next.athleteBottom = opponentId;
    } else if (dominantOutcome.topAthleteAfter === 'opponent') {
      next.athleteTop = opponentId;
      next.athleteBottom = executorId;
    } else if (dominantOutcome.topAthleteAfter === 'none') {
      next.athleteTop = 'none';
      next.athleteBottom = 'none';
    }

    // 3. Atualizar controle posicional
    if (nextPos) {
      if (next.athleteTop !== 'none') {
        next.controllingAthlete = next.athleteTop;
        next.controlledAthlete = next.athleteBottom;
      } else {
        next.controllingAthlete = 'none';
        next.controlledAthlete = 'none';
      }
    }

    // 4. Consequências de pontuação e vantagens
    if (dominantOutcome.potentialPoints > 0) {
      if (winningAthleteId === 'athlete_a') {
        pointsA = dominantOutcome.potentialPoints;
        next.score.pointsA += pointsA;
      } else if (winningAthleteId === 'athlete_b') {
        pointsB = dominantOutcome.potentialPoints;
        next.score.pointsB += pointsB;
      }
    }

    if (dominantOutcome.potentialAdvantage) {
      if (winningAthleteId === 'athlete_a') {
        advA = true;
        next.score.advantagesA += 1;
      } else if (winningAthleteId === 'athlete_b') {
        advB = true;
        next.score.advantagesB += 1;
      }
    }

    // 5. Finalizações
    if (dominantOutcome.isSubmission) {
      const danger = dominantOutcome.submissionDangerLevel ?? 4;
      const hadExistingThreat = next.activeSubmissionThreat &&
        next.activeSubmissionThreat.attacker === (winningAthleteId === 'athlete_b' ? 'athlete_b' : 'athlete_a') &&
        next.activeSubmissionThreat.dangerLevel >= 3;

      const defenderExhaustedOrInvalid =
        (winningAthleteId === 'athlete_a' ? (!valB.isValid || next.athleteB.energy <= 5) : (!valA.isValid || next.athleteA.energy <= 5));

      const opponentDidNotDefend =
        winningAthleteId === 'athlete_a' ? (!valB.technique || valB.technique.category !== 'defesas') : (!valA.technique || valA.technique.category !== 'defesas');

      if (hadExistingThreat || defenderExhaustedOrInvalid || (danger >= 5 && opponentDidNotDefend && dominantOutcome.outcomeType === 'sucesso_pleno')) {
        // Finalização concluída! Fim de luta imediato!
        next.status = 'finalizada';
        next.winner = winningAthleteId === 'athlete_b' ? 'athlete_b' : 'athlete_a';
        next.winMethod = 'Finalização';
        next.activeSubmissionThreat = null;
        technicalNarration += ` 💥 BATEU! FIM DE LUTA POR FINALIZAÇÃO!`;
      } else {
        // Ameaça de finalização engatilhada/ajustada (Estágio de alavanca ativa)
        next.activeSubmissionThreat = {
          attacker: winningAthleteId === 'athlete_b' ? 'athlete_b' : 'athlete_a',
          defender: winningAthleteId === 'athlete_b' ? 'athlete_a' : 'athlete_b',
          techniqueId: (valA.technique?.isSubmission ? valA.technique.id : valB.technique?.id) || 'bjj_sub_armlock_straight',
          dangerLevel: danger,
          cyclesInThreat: (next.activeSubmissionThreat?.cyclesInThreat ?? 0) + 1
        };
        technicalNarration += ` ⚠️ ALERTA DE FINALIZAÇÃO: A chave está perigosamente ajustada! Defensor sob pressão crítica!`;
      }
    }

    // Se o defensor da ameaça foi o vencedor do desfecho (reversão, fuga ou raspagem), a ameaça é anulada
    if (next.activeSubmissionThreat && winningAthleteId === next.activeSubmissionThreat.defender) {
      next.activeSubmissionThreat = null;
    }
  }

  // 8. Drenagem / Recuperação de energia e fadiga com limites seguros (sem energia negativa ou paralisia eterna em 0)
  const computeRestRecovery = (athlete: BjjCombatAthlete, oppPressure: number): number => {
    const baseRec = 11 + Math.round(((athlete.attributes?.stamina ?? 60) - 50) * 0.08);
    const clampedBase = Math.max(8, Math.min(18, baseRec));
    const pressureTax = Math.round(oppPressure * 0.35);
    return Math.max(5, clampedBase - pressureTax);
  };

  let drainA = valA.technique ? valA.technique.staminaCost : 0;
  let drainB = valB.technique ? valB.technique.staminaCost : 0;

  if (dominantOutcome) {
    if (winningAthleteId === 'athlete_a') {
      if (valA.technique) drainA = dominantOutcome.staminaCostExecutor;
      if (valB.technique) drainB = dominantOutcome.staminaCostOpponent;
    } else if (winningAthleteId === 'athlete_b') {
      if (valB.technique) drainB = dominantOutcome.staminaCostExecutor;
      if (valA.technique) drainA = dominantOutcome.staminaCostOpponent;
    }
  }

  if (!valA.technique) {
    const oppPressure = winningAthleteId === 'athlete_b' && dominantOutcome ? dominantOutcome.staminaCostOpponent : 0;
    drainA = -computeRestRecovery(next.athleteA, oppPressure);
  }
  if (!valB.technique) {
    const oppPressure = winningAthleteId === 'athlete_a' && dominantOutcome ? dominantOutcome.staminaCostOpponent : 0;
    drainB = -computeRestRecovery(next.athleteB, oppPressure);
  }

  next.athleteA.energy = Math.max(0, Math.min(100, next.athleteA.energy - drainA));
  next.athleteB.energy = Math.max(0, Math.min(100, next.athleteB.energy - drainB));

  if (drainA > 0) {
    next.athleteA.accumulatedFatigue = Math.min(100, next.athleteA.accumulatedFatigue + Math.round(drainA * 0.15));
  }
  if (drainB > 0) {
    next.athleteB.accumulatedFatigue = Math.min(100, next.athleteB.accumulatedFatigue + Math.round(drainB * 0.15));
  }

  // 9. Atualização do relógio de combate
  const cycleNumber = next.history.length + 1;
  const timeBefore = next.matchTimeElapsedSeconds;
  next.matchTimeElapsedSeconds = Math.min(next.matchDurationSeconds, next.matchTimeElapsedSeconds + cycleDuration);

  // Se a posição manteve a mesma, acumula tempo de estabilização
  if (next.currentPositionId === posBefore) {
    next.positionDurationSeconds += cycleDuration;
    if (next.positionDurationSeconds >= 3) {
      next.isPointsStabilized = true;
    }
  } else {
    next.positionDurationSeconds = 0;
    next.isPointsStabilized = false;
  }

  // 10. Verificação de encerramento por tempo
  if (next.matchTimeElapsedSeconds >= next.matchDurationSeconds && next.status === 'em_andamento') {
    next.status = 'tempo_esgotado';
    if (next.score.pointsA > next.score.pointsB) {
      next.winner = 'athlete_a';
      next.winMethod = 'Pontos';
    } else if (next.score.pointsB > next.score.pointsA) {
      next.winner = 'athlete_b';
      next.winMethod = 'Pontos';
    } else if (next.score.advantagesA > next.score.advantagesB) {
      next.winner = 'athlete_a';
      next.winMethod = 'Vantagens';
    } else if (next.score.advantagesB > next.score.advantagesA) {
      next.winner = 'athlete_b';
      next.winMethod = 'Vantagens';
    } else {
      next.winner = 'draw';
      next.winMethod = 'Decisão do Árbitro';
    }
  }

  // 11. Registro no histórico detalhado
  const cycleRecord: BjjCombatCycleRecord = {
    cycleNumber,
    matchTimeSeconds: timeBefore,
    durationSeconds: cycleDuration,
    positionBefore: posBefore,
    positionAfter: next.currentPositionId,
    actionA,
    actionB,
    actionAValid: valA.isValid,
    actionBValid: valB.isValid,
    invalidationReasonA: valA.reason,
    invalidationReasonB: valB.reason,
    interactionType: interaction,
    dominantOutcome,
    decidingFactor,
    staminaDeltaA: -drainA,
    staminaDeltaB: -drainB,
    pointsAwardedA: pointsA,
    pointsAwardedB: pointsB,
    advantageAwardedA: advA,
    advantageAwardedB: advB,
    technicalNarration
  };

  next.history.push(cycleRecord);
  next.rngSeed = getSeed();

  return next;
}
