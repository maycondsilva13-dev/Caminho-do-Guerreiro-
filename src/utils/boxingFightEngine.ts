/**
 * CAMINHO DO GUERREIRO: DO TATAME AO OCTÓGONO
 * Módulo Especializado de Boxe (Pugilismo) — Motor Determinístico de Combate & Regras 10-Point Must
 */

import {
  BoxingCombatAthlete,
  BoxingCycleRecord,
  BoxingDeclaredAction,
  BoxingDistance,
  BoxingHitVisualType,
  BoxingJudgeCard,
  BoxingMatchState,
  BoxingParticipant,
  BoxingRng,
  BoxingRoundScore,
  BoxingRulesMode,
  BoxingStateId,
  BoxingTechnique
} from '../types/boxingCombat';
import { BOXING_TECHNIQUES_CATALOG } from '../data/boxingCatalogData';

export function createBoxingRng(seed: number): { next: BoxingRng } {
  let state = seed >>> 0;
  return {
    next: () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  };
}

export interface CreateBoxingMatchParams {
  matchId?: string;
  matchType: 'sparring' | 'competicao';
  rulesMode: BoxingRulesMode;
  totalRounds: number;
  roundDurationSeconds: number;
  boxerA: BoxingCombatAthlete;
  boxerB: BoxingCombatAthlete;
  rngSeed?: number;
}

export function createInitialBoxingMatchState(
  params: CreateBoxingMatchParams
): BoxingMatchState {
  const seed = params.rngSeed ?? Math.floor(Date.now() % 1000000) + 177;
  return {
    matchId: params.matchId || `box_${seed}`,
    matchType: params.matchType,
    rulesMode: params.rulesMode,
    totalRounds: Math.max(1, params.totalRounds),
    roundDurationSeconds: Math.max(60, params.roundDurationSeconds),
    currentRound: 1,
    roundTimeElapsedSeconds: 0,
    totalTimeElapsedSeconds: 0,
    currentDistance: 'longa',
    currentStateId: 'neutro_longa',
    ropeTrappedBoxer: null,
    clinchConsecutiveCycles: 0,
    boxerA: JSON.parse(JSON.stringify(params.boxerA)),
    boxerB: JSON.parse(JSON.stringify(params.boxerB)),
    roundScores: [],
    currentRoundCleanA: 0,
    currentRoundCleanB: 0,
    currentRoundPowerA: 0,
    currentRoundPowerB: 0,
    currentRoundDominanceA: 0,
    currentRoundDominanceB: 0,
    isMatchOver: false,
    winner: null,
    winMethod: null,
    rngSeed: seed,
    history: []
  };
}

export function resolveStateIdFromDistance(
  distance: BoxingDistance,
  ropeTrappedBoxer: BoxingParticipant | null
): BoxingStateId {
  if (distance === 'cordas') {
    return ropeTrappedBoxer === 'boxer_a' ? 'azul_nas_cordas' : 'vermelho_nas_cordas';
  }
  if (distance === 'clinch') return 'clinch_boxe';
  if (distance === 'curta') return 'infight_curta';
  if (distance === 'media') return 'troca_media';
  return 'neutro_longa';
}

export function validateBoxingAction(
  state: BoxingMatchState,
  action: BoxingDeclaredAction
): { isValid: boolean; reason?: string } {
  if (state.isMatchOver) {
    return { isValid: false, reason: 'O combate já foi encerrado.' };
  }
  const boxer = action.boxerId === 'boxer_a' ? state.boxerA : state.boxerB;
  if (action.techniqueId === null) {
    return { isValid: true };
  }

  const tech = BOXING_TECHNIQUES_CATALOG[action.techniqueId];
  if (!tech) {
    return { isValid: false, reason: 'Técnica de boxe não encontrada.' };
  }

  if (!tech.allowedDistances.includes(state.currentDistance)) {
    return {
      isValid: false,
      reason: `${tech.displayName} não pode ser usada na distância "${state.currentDistance}".`
    };
  }

  if (boxer.energy < tech.staminaCost) {
    return {
      isValid: false,
      reason: `Fôlego insuficiente (${Math.round(boxer.energy)}/${tech.staminaCost}). Use Guarda Fechada ou Clinch.`
    };
  }

  return { isValid: true };
}

function getTechniqueVisualType(tech: BoxingTechnique | null): BoxingHitVisualType {
  if (!tech) return 'blocked';
  if (tech.objective === 'clinch') return 'clinch';
  if (tech.objective === 'corte_ringue' || tech.objective === 'recuperacao') return 'footwork';
  if (tech.objective === 'defesa_guarda') return 'blocked';
  if (tech.objective === 'esquiva_contra') return 'counter';
  if (tech.objective === 'golpe_corpo') return 'body';
  if (tech.objective === 'combinacao') return 'combo';
  if (tech.id.includes('upper')) return 'uppercut';
  if (tech.id.includes('cruzado') || tech.id.includes('hook') || tech.id.includes('overhand')) return 'hook';
  if (tech.id.includes('direto')) return 'cross';
  return 'jab';
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function computeAttackExchange(
  attacker: BoxingCombatAthlete,
  defender: BoxingCombatAthlete,
  attTech: BoxingTechnique | null,
  defTech: BoxingTechnique | null,
  state: BoxingMatchState,
  rng: BoxingRng
): {
  landed: boolean;
  wasBlocked: boolean;
  wasDodged: boolean;
  isCounter: boolean;
  chinDmg: number;
  bodyDmg: number;
  guardDmg: number;
  stunApplied: number;
  visualType: BoxingHitVisualType;
  dominancePoints: number;
  isPowerHit: boolean;
} {
  if (!attTech || attTech.basePower + attTech.bodyDamage <= 0) {
    return {
      landed: false,
      wasBlocked: false,
      wasDodged: false,
      isCounter: false,
      chinDmg: 0,
      bodyDmg: 0,
      guardDmg: 0,
      stunApplied: 0,
      visualType: getTechniqueVisualType(attTech),
      dominancePoints: attTech?.pointWeight || 0,
      isPowerHit: false
    };
  }

  attacker.stats.punchesThrown += attTech.objective === 'combinacao' ? 3 : 1;

  // Fator de desgaste (sem gás ou muito abalado reduz precisão e potência)
  const fatigueFactor = attacker.energy < 20 ? 0.72 : attacker.energy < 40 ? 0.86 : 1;
  const groggyPenalty = attacker.isGroggy ? -0.18 : 0;
  const targetOnRopesBonus =
    state.currentDistance === 'cordas' && state.ropeTrappedBoxer === defender.id ? 0.14 : 0;
  const defenderGroggyBonus = defender.isGroggy ? 0.2 : 0;

  // Esquiva/contra compatível
  const defCountersAtt = Boolean(
    defTech?.counterBonusAgainst && defTech.counterBonusAgainst.includes(attTech.objective)
  );
  const attCountersDef = Boolean(
    attTech.counterBonusAgainst && defTech && attTech.counterBonusAgainst.includes(defTech.objective)
  );

  // Chance de acerto base
  const speedEdge = (attacker.attributes.punchSpeed - defender.attributes.defense) * 0.0045;
  const techEdge = (attacker.attributes.technique - defender.attributes.footwork) * 0.003;
  let hitChance =
    0.66 +
    attTech.accuracyMod +
    speedEdge +
    techEdge +
    groggyPenalty +
    targetOnRopesBonus +
    defenderGroggyBonus;

  if (attCountersDef) hitChance += 0.18;
  if (defCountersAtt) hitChance -= 0.34;
  if (defTech?.objective === 'esquiva_contra') {
    hitChance -= 0.14 + (defender.attributes.defense - 50) * 0.002;
  }

  hitChance = clamp(hitChance, 0.15, 0.94);
  const roll = rng();

  // Esquiva limpa!
  if (roll > hitChance) {
    defender.stats.dodges += 1;
    return {
      landed: false,
      wasBlocked: false,
      wasDodged: true,
      isCounter: false,
      chinDmg: 0,
      bodyDmg: 0,
      guardDmg: 0,
      stunApplied: 0,
      visualType: 'dodged',
      dominancePoints: 0.15,
      isPowerHit: false
    };
  }

  // Cálculo de bloqueio pela guarda
  const hasActiveGuard =
    defTech === null || defTech.objective === 'defesa_guarda' || defTech.objective === 'recuperacao';
  const passiveGuardRatio = defender.guardHealth / 100;
  const blockChance = hasActiveGuard
    ? clamp(0.45 + passiveGuardRatio * 0.35 + (defender.attributes.defense - 50) * 0.003, 0.25, 0.86)
    : clamp(passiveGuardRatio * 0.28, 0.05, 0.35);

  const isCounterHit = Boolean(attTech.allowsCounterStrike && attCountersDef);
  const blockRoll = rng();
  const wasBlocked = !isCounterHit && !attTech.counterBonusAgainst?.includes('defesa_guarda') && blockRoll < blockChance;

  const powerMult = (0.78 + attacker.attributes.punchPower * 0.0065) * fatigueFactor;
  const durabilityMit = 1 - Math.min(0.28, (defender.attributes.durability - 50) * 0.0035);
  const rulesChinMult = state.rulesMode === 'profissional' ? 1.16 : 0.88; // Amador usa capacete!
  const counterMult = isCounterHit ? 1.42 : 1.0;
  const ropeMult = state.currentDistance === 'cordas' && state.ropeTrappedBoxer === defender.id ? 1.15 : 1.0;

  let rawChin = attTech.basePower * powerMult * durabilityMit * rulesChinMult * counterMult * ropeMult;
  let rawBody = attTech.bodyDamage * powerMult * durabilityMit * counterMult;
  let rawGuard = attTech.guardDamage * powerMult;

  if (wasBlocked) {
    const mitigation = defTech?.defensiveMitigation ?? 0.65;
    rawChin *= 1 - mitigation;
    rawBody *= 1 - mitigation * 0.6;
    rawGuard *= 1.15;
  } else {
    attacker.stats.punchesLanded += attTech.objective === 'combinacao' ? 2 : 1;
    if (attTech.basePower >= 16 || attTech.stunPower >= 18) {
      attacker.stats.powerLanded += 1;
    }
    if (attTech.bodyDamage >= 10) {
      attacker.stats.bodyLanded += 1;
    }
    if (isCounterHit) {
      attacker.stats.countersLanded += 1;
    }
  }

  const chinDmg = Math.round(rawChin * 10) / 10;
  const bodyDmg = Math.round(rawBody * 10) / 10;
  const guardDmg = Math.round(rawGuard * 10) / 10;
  const stunApplied = wasBlocked ? attTech.stunPower * 0.2 : attTech.stunPower * counterMult * rulesChinMult;

  return {
    landed: !wasBlocked,
    wasBlocked,
    wasDodged: false,
    isCounter: isCounterHit,
    chinDmg,
    bodyDmg,
    guardDmg,
    stunApplied,
    visualType: isCounterHit ? 'counter' : wasBlocked ? 'blocked' : getTechniqueVisualType(attTech),
    dominancePoints: wasBlocked ? attTech.pointWeight * 0.25 : attTech.pointWeight * (isCounterHit ? 1.35 : 1),
    isPowerHit: !wasBlocked && (attTech.basePower >= 16 || isCounterHit)
  };
}

function evaluateKnockdownOrStoppage(
  defender: BoxingCombatAthlete,
  incomingChinDmg: number,
  stunApplied: number,
  rulesMode: BoxingRulesMode,
  rng: BoxingRng
): {
  knockdown: boolean;
  ko: boolean;
  tko: boolean;
  count: number;
  note?: string;
} {
  if (defender.chinHealth <= 0) {
    // Checar contagem do árbitro (1 a 10)
    const getUpBonus =
      (defender.attributes.durability - 50) * 0.004 +
      (defender.attributes.mentalFocus - 50) * 0.004 -
      defender.totalKnockdowns * 0.16;
    const surviveChance = clamp(
      (rulesMode === 'amador' ? 0.72 : 0.62) + getUpBonus - Math.max(0, Math.abs(defender.chinHealth) * 0.03),
      0.08,
      0.88
    );

    defender.knockdownsThisRound += 1;
    defender.totalKnockdowns += 1;

    // Regra oficial dos 3 Knockdowns no mesmo round!
    if (defender.knockdownsThisRound >= 3 || defender.totalKnockdowns >= 4) {
      return {
        knockdown: true,
        ko: false,
        tko: true,
        count: 10,
        note: 'Árbitro aplica a Regra dos 3 Knockdowns e encerra o combate por TKO!'
      };
    }

    if (rng() > surviveChance) {
      return {
        knockdown: true,
        ko: true,
        tko: false,
        count: 10,
        note: 'Contagem chega a 10! NOCAUTE fulminante na lona!'
      };
    }

    const count = Math.min(9, Math.max(5, Math.round(5 + rng() * 4)));
    // Sobrevive à contagem com recuperação parcial de adrenalina
    defender.chinHealth = clamp(18 + defender.attributes.durability * 0.12, 16, 30);
    defender.guardHealth = Math.max(defender.guardHealth, 45);
    defender.isGroggy = true;
    return {
      knockdown: true,
      ko: false,
      tko: false,
      count,
      note: `Cai na lona! Abre contagem do árbitro e levanta no ${count}!`
    };
  }

  // Flash knockdown ou parada por excesso de castigo
  const flashKdThreshold = defender.isGroggy ? 24 : 34;
  if (
    defender.chinHealth < flashKdThreshold &&
    incomingChinDmg >= 13 &&
    stunApplied >= 18
  ) {
    const kdProb = clamp((stunApplied - 12) * 0.016 + (defender.isGroggy ? 0.25 : 0), 0.1, 0.55);
    if (rng() < kdProb) {
      defender.knockdownsThisRound += 1;
      defender.totalKnockdowns += 1;
      if (defender.knockdownsThisRound >= 3 || defender.totalKnockdowns >= 4) {
        return {
          knockdown: true,
          ko: false,
          tko: true,
          count: 10,
          note: 'Terceira queda no assalto! Árbitro interrompe por TKO técnico!'
        };
      }
      const count = Math.min(8, Math.max(4, Math.round(4 + rng() * 4)));
      defender.chinHealth = Math.max(14, defender.chinHealth);
      defender.isGroggy = true;
      return {
        knockdown: true,
        ko: false,
        tko: false,
        count,
        note: `Flash Knockdown! Toca a lona e se reergue na contagem ${count}!`
      };
    }
  }

  // Chance de corte no profissional
  if (rulesMode === 'profissional' && incomingChinDmg >= 17 && rng() < 0.16) {
    defender.cutLevel = Math.min(3, defender.cutLevel + 1);
    if (defender.cutLevel >= 3 && defender.chinHealth < 25 && rng() < 0.45) {
      return {
        knockdown: false,
        ko: false,
        tko: true,
        count: 0,
        note: 'Médico do ringue recomenda interrupção por corte severo no supercílio (TKO)!'
      };
    }
  }

  if (stunApplied >= 21 && defender.chinHealth < 45) {
    defender.isGroggy = true;
  }

  return { knockdown: false, ko: false, tko: false, count: 0 };
}

function finalizeRoundScore(state: BoxingMatchState): BoxingRoundScore {
  const kdA = state.boxerA.knockdownsThisRound; // KDs sofridos por A
  const kdB = state.boxerB.knockdownsThisRound; // KDs sofridos por B
  const domA = state.currentRoundDominanceA + kdB * 4.5;
  const domB = state.currentRoundDominanceB + kdA * 4.5;

  let pointsA = 10;
  let pointsB = 10;
  let note = 'Round equilibrado.';

  if (Math.abs(domA - domB) < 0.45 && kdA === kdB) {
    pointsA = 10;
    pointsB = 10;
    note = 'Round empatado (10-10) na leitura técnica.';
  } else if (domA > domB) {
    pointsA = 10;
    const margin = domA - domB;
    const baseLoser = kdB >= 2 ? 7 : kdB === 1 || margin > 7.5 ? 8 : 9;
    pointsB = clamp(baseLoser - kdB + (kdB > 0 ? 1 : 0), 7, 9);
    if (kdB >= 2) pointsB = 7;
    else if (kdB === 1) pointsB = 8;
    else pointsB = margin > 7.5 ? 8 : 9;
    note = kdB > 0 ? `Domínio azul com ${kdB} knockdown(s) (${pointsA}-${pointsB}).` : `Azul vence o assalto (${pointsA}-${pointsB}).`;
  } else {
    pointsB = 10;
    const margin = domB - domA;
    if (kdA >= 2) pointsA = 7;
    else if (kdA === 1) pointsA = 8;
    else pointsA = margin > 7.5 ? 8 : 9;
    note = kdA > 0 ? `Domínio vermelho com ${kdA} knockdown(s) (${pointsA}-${pointsB}).` : `Vermelho vence o assalto (${pointsA}-${pointsB}).`;
  }

  return {
    roundNumber: state.currentRound,
    pointsA,
    pointsB,
    knockdownsA: kdA,
    knockdownsB: kdB,
    cleanHitsA: state.currentRoundCleanA,
    cleanHitsB: state.currentRoundCleanB,
    powerHitsA: state.currentRoundPowerA,
    powerHitsB: state.currentRoundPowerB,
    dominanceScoreA: Math.round(domA * 10) / 10,
    dominanceScoreB: Math.round(domB * 10) / 10,
    note
  };
}

function buildFinalJudgeDecision(
  state: BoxingMatchState,
  rng: BoxingRng
): {
  winner: BoxingParticipant | 'draw';
  winMethod: BoxingMatchState['winMethod'];
  judgeCards: BoxingJudgeCard[];
  summary: string;
} {
  const baseA = state.roundScores.reduce((acc, r) => acc + r.pointsA, 0);
  const baseB = state.roundScores.reduce((acc, r) => acc + r.pointsB, 0);
  const diff = baseA - baseB;

  const judgeNames = ['Juiz 1 (Ringue)', 'Juiz 2 (Lateral)', 'Juiz 3 (Mesa)'];
  const judgeCards: BoxingJudgeCard[] = judgeNames.map((judgeName, idx) => {
    // Em lutas muito apertadas (diff <= 2), 1 dos juízes pode divergir deterministicamente
    let adjA = baseA;
    let adjB = baseB;
    if (idx === 1 && Math.abs(diff) <= 2 && rng() < 0.45) {
      if (diff >= 0) {
        adjA -= 1;
        adjB += 1;
      } else {
        adjB -= 1;
        adjA += 1;
      }
    } else if (idx === 2 && Math.abs(diff) === 0 && rng() < 0.5) {
      if (state.boxerA.stats.powerLanded >= state.boxerB.stats.powerLanded) {
        adjA += 1;
      } else {
        adjB += 1;
      }
    }
    const w: BoxingParticipant | 'draw' = adjA > adjB ? 'boxer_a' : adjB > adjA ? 'boxer_b' : 'draw';
    return { judgeName, totalA: adjA, totalB: adjB, winner: w };
  });

  const votesA = judgeCards.filter((c) => c.winner === 'boxer_a').length;
  const votesB = judgeCards.filter((c) => c.winner === 'boxer_b').length;
  const votesDraw = judgeCards.filter((c) => c.winner === 'draw').length;

  let winner: BoxingParticipant | 'draw' = 'draw';
  let winMethod: BoxingMatchState['winMethod'] = 'Empate';

  if (votesA >= 2) {
    winner = 'boxer_a';
    winMethod =
      votesA === 3
        ? 'Pontos (Decisão Unânime)'
        : votesDraw > 0
        ? 'Pontos (Decisão Majoritária)'
        : 'Pontos (Decisão Dividida)';
  } else if (votesB >= 2) {
    winner = 'boxer_b';
    winMethod =
      votesB === 3
        ? 'Pontos (Decisão Unânime)'
        : votesDraw > 0
        ? 'Pontos (Decisão Majoritária)'
        : 'Pontos (Decisão Dividida)';
  } else if (votesA === 1 && votesB === 0) {
    winner = 'boxer_a';
    winMethod = 'Pontos (Decisão Majoritária)';
  } else if (votesB === 1 && votesA === 0) {
    winner = 'boxer_b';
    winMethod = 'Pontos (Decisão Majoritária)';
  } else {
    winner = 'draw';
    winMethod = 'Empate';
  }

  const cardsText = judgeCards.map((c) => `${c.totalA}-${c.totalB}`).join(' / ');
  return {
    winner,
    winMethod,
    judgeCards,
    summary: `Papeletas oficiais: ${cardsText} (${winMethod}).`
  };
}

export function executeBoxingCombatCycle(
  prevState: BoxingMatchState,
  actionA: BoxingDeclaredAction,
  actionB: BoxingDeclaredAction
): BoxingMatchState {
  if (prevState.isMatchOver) return prevState;

  const state: BoxingMatchState = JSON.parse(JSON.stringify(prevState));
  const cycleNumber = state.history.length + 1;
  const { next: rng } = createBoxingRng(state.rngSeed + cycleNumber * 7919);

  const techA = actionA.techniqueId ? BOXING_TECHNIQUES_CATALOG[actionA.techniqueId] || null : null;
  const techB = actionB.techniqueId ? BOXING_TECHNIQUES_CATALOG[actionB.techniqueId] || null : null;

  const nameA = techA ? techA.displayName : 'Guarda Alta & Recuperar Fôlego';
  const nameB = techB ? techB.displayName : 'Guarda Alta & Recuperar Fôlego';

  const distanceBefore = state.currentDistance;
  const stateBefore = state.currentStateId;

  // 1. Gasto ou recuperação de fôlego & guarda
  const applyActionCost = (boxer: BoxingCombatAthlete, tech: BoxingTechnique | null) => {
    if (!tech) {
      boxer.energy = clamp(boxer.energy + 11, 0, 100);
      boxer.guardHealth = clamp(boxer.guardHealth + 18, 0, 100);
      boxer.chinHealth = clamp(boxer.chinHealth + 2.5, 0, 100);
    } else if (tech.objective === 'defesa_guarda') {
      boxer.energy = clamp(boxer.energy + 8, 0, 100);
      boxer.guardHealth = clamp(boxer.guardHealth + 22, 0, 100);
      boxer.chinHealth = clamp(boxer.chinHealth + 2, 0, 100);
    } else if (tech.objective === 'clinch') {
      boxer.energy = clamp(boxer.energy + 4 - tech.staminaCost * 0.4, 0, 100);
      boxer.chinHealth = clamp(boxer.chinHealth + 3, 0, 100);
    } else {
      const staminaEfficiency = clamp(1 - (boxer.attributes.stamina - 50) * 0.004, 0.75, 1.15);
      boxer.energy = clamp(boxer.energy - tech.staminaCost * staminaEfficiency, 0, 100);
      boxer.accumulatedFatigue = clamp(boxer.accumulatedFatigue + tech.staminaCost * 0.18, 0, 100);
    }
  };

  applyActionCost(state.boxerA, techA);
  applyActionCost(state.boxerB, techB);

  // Limpa estado groggy anterior se defendeu/clinchou com sucesso
  const wasGroggyA = state.boxerA.isGroggy;
  const wasGroggyB = state.boxerB.isGroggy;
  state.boxerA.isGroggy = false;
  state.boxerB.isGroggy = false;

  // 2. Resolução simultânea da troca de golpes
  const resAonB = computeAttackExchange(state.boxerA, state.boxerB, techA, techB, state, rng);
  const resBonA = computeAttackExchange(state.boxerB, state.boxerA, techB, techA, state, rng);

  // Aplicar danos em B
  state.boxerB.chinHealth = clamp(state.boxerB.chinHealth - resAonB.chinDmg, -20, 100);
  state.boxerB.bodyHealth = clamp(state.boxerB.bodyHealth - resAonB.bodyDmg, 0, 100);
  state.boxerB.guardHealth = clamp(state.boxerB.guardHealth - resAonB.guardDmg, 0, 100);
  if (resAonB.bodyDmg > 0) {
    state.boxerB.energy = clamp(state.boxerB.energy - resAonB.bodyDmg * 0.5, 0, 100);
  }

  // Aplicar danos em A
  state.boxerA.chinHealth = clamp(state.boxerA.chinHealth - resBonA.chinDmg, -20, 100);
  state.boxerA.bodyHealth = clamp(state.boxerA.bodyHealth - resBonA.bodyDmg, 0, 100);
  state.boxerA.guardHealth = clamp(state.boxerA.guardHealth - resBonA.guardDmg, 0, 100);
  if (resBonA.bodyDmg > 0) {
    state.boxerA.energy = clamp(state.boxerA.energy - resBonA.bodyDmg * 0.5, 0, 100);
  }

  // Acúmulo de pontos do round (10-Point Must)
  if (resAonB.landed) {
    state.currentRoundCleanA += 1;
    if (resAonB.isPowerHit) state.currentRoundPowerA += 1;
  }
  if (resBonA.landed) {
    state.currentRoundCleanB += 1;
    if (resBonA.isPowerHit) state.currentRoundPowerB += 1;
  }
  state.currentRoundDominanceA += resAonB.dominancePoints;
  state.currentRoundDominanceB += resBonA.dominancePoints;

  // 3. Avaliação de Knockdown / KO / TKO
  const stopB = evaluateKnockdownOrStoppage(
    state.boxerB,
    resAonB.chinDmg,
    resAonB.stunApplied,
    state.rulesMode,
    rng
  );
  const stopA =
    !stopB.ko && !stopB.tko
      ? evaluateKnockdownOrStoppage(
          state.boxerA,
          resBonA.chinDmg,
          resBonA.stunApplied,
          state.rulesMode,
          rng
        )
      : { knockdown: false, ko: false, tko: false, count: 0 };

  // 4. Atualização de distância & cordas
  let nextDistance: BoxingDistance = distanceBefore;
  let nextRopeBoxer = state.ropeTrappedBoxer;
  let refBreakMsg = '';

  if (stopA.knockdown || stopB.knockdown) {
    // Após knockdown árbitro reposiciona no centro em distância média/longa
    nextDistance = 'longa';
    nextRopeBoxer = null;
    state.clinchConsecutiveCycles = 0;
  } else if (
    techA?.objective === 'clinch' ||
    techB?.objective === 'clinch'
  ) {
    if (state.currentDistance === 'clinch' && state.clinchConsecutiveCycles >= 1) {
      nextDistance = 'media';
      nextRopeBoxer = null;
      state.clinchConsecutiveCycles = 0;
      refBreakMsg = ' Árbitro ordena "Break!" e separa o clinch para o centro.';
    } else {
      nextDistance = 'clinch';
      state.clinchConsecutiveCycles += 1;
    }
  } else {
    state.clinchConsecutiveCycles = 0;

    // Checar saída das cordas ou empurrão para as cordas
    const aEscapesRopes =
      distanceBefore === 'cordas' &&
      state.ropeTrappedBoxer === 'boxer_a' &&
      (techA?.ropeEscapeBonus || techA?.objective === 'recuperacao' || resAonB.isCounter) &&
      rng() < 0.72 + (state.boxerA.attributes.footwork - 50) * 0.004;

    const bEscapesRopes =
      distanceBefore === 'cordas' &&
      state.ropeTrappedBoxer === 'boxer_b' &&
      (techB?.ropeEscapeBonus || techB?.objective === 'recuperacao' || resBonA.isCounter) &&
      rng() < 0.72 + (state.boxerB.attributes.footwork - 50) * 0.004;

    if (aEscapesRopes || bEscapesRopes) {
      nextDistance = 'media';
      nextRopeBoxer = null;
    } else if (techA?.pushesToRopes && (resAonB.landed || techA.objective === 'corte_ringue') && !resBonA.isCounter) {
      nextDistance = 'cordas';
      nextRopeBoxer = 'boxer_b';
    } else if (techB?.pushesToRopes && (resBonA.landed || techB.objective === 'corte_ringue') && !resAonB.isCounter) {
      nextDistance = 'cordas';
      nextRopeBoxer = 'boxer_a';
    } else if (techA?.nextDistanceOnSuccess && (resAonB.landed || techA.objective === 'corte_ringue' || techA.objective === 'recuperacao')) {
      nextDistance = techA.nextDistanceOnSuccess;
      if (nextDistance !== 'cordas') nextRopeBoxer = null;
    } else if (techB?.nextDistanceOnSuccess && (resBonA.landed || techB.objective === 'corte_ringue' || techB.objective === 'recuperacao')) {
      nextDistance = techB.nextDistanceOnSuccess;
      if (nextDistance !== 'cordas') nextRopeBoxer = null;
    }
  }

  state.currentDistance = nextDistance;
  state.ropeTrappedBoxer = nextRopeBoxer;
  state.currentStateId = resolveStateIdFromDistance(nextDistance, nextRopeBoxer);

  // 5. Avanço do relógio do round
  const cycleSeconds = Math.max(techA?.durationSeconds || 7, techB?.durationSeconds || 7);
  state.roundTimeElapsedSeconds = Math.min(
    state.roundDurationSeconds,
    state.roundTimeElapsedSeconds + cycleSeconds
  );
  state.totalTimeElapsedSeconds += cycleSeconds;

  // 6. Narração detalhada e realista do ciclo
  const parts: string[] = [];
  if (stopB.ko) {
    parts.push(`💥 NOCAUTE! ${state.boxerA.name} conecta ${nameA} limpo no queixo de ${state.boxerB.name}! ${stopB.note}`);
  } else if (stopB.tko) {
    parts.push(`🛑 TKO! ${state.boxerA.name} força a interrupção do árbitro com ${nameA}! ${stopB.note}`);
  } else if (stopA.ko) {
    parts.push(`💥 NOCAUTE! ${state.boxerB.name} acerta ${nameB} em cheio! ${stopA.note}`);
  } else if (stopA.tko) {
    parts.push(`🛑 TKO! ${state.boxerB.name} vence por interrupção! ${stopA.note}`);
  } else {
    if (resAonB.isCounter) {
      parts.push(`⚡ CONTRA-GOLPE DE ${state.boxerA.name.toUpperCase()}! Esquivou com precisão e respondeu com ${nameA} (-${Math.round(resAonB.chinDmg)} Queixo).`);
    } else if (resAonB.landed) {
      parts.push(`🥊 ${state.boxerA.name} encaixa ${nameA}${resAonB.bodyDmg >= 10 ? ' no corpo' : ''}${resAonB.isPowerHit ? ' com impacto pesado' : ''}!`);
    } else if (resAonB.wasBlocked) {
      parts.push(`🛡️ ${state.boxerA.name} tenta ${nameA}, mas encontra a guarda fechada de ${state.boxerB.name}.`);
    } else if (resAonB.wasDodged) {
      parts.push(`💨 ${state.boxerB.name} faz o pêndulo e escapa limpo de ${nameA}!`);
    } else {
      parts.push(`🛡️ ${state.boxerA.name}: ${nameA}.`);
    }

    if (resBonA.isCounter) {
      parts.push(`⚡ ${state.boxerB.name} responde no contragolpe com ${nameB} (-${Math.round(resBonA.chinDmg)} Queixo)!`);
    } else if (resBonA.landed) {
      parts.push(`🔥 ${state.boxerB.name} conecta ${nameB}${resBonA.bodyDmg >= 10 ? ' castigando o abdômen' : ''}!`);
    } else if (resBonA.wasBlocked) {
      parts.push(`Guarda de ${state.boxerA.name} absorve ${nameB}.`);
    } else if (resBonA.wasDodged) {
      parts.push(`${state.boxerA.name} esquiva de ${nameB}!`);
    }

    if (stopB.knockdown) parts.push(`🔥 KNOCKDOWN SOBRE ${state.boxerB.name.toUpperCase()}! ${stopB.note}`);
    if (stopA.knockdown) parts.push(`⚠️ KNOCKDOWN SOFRIDO POR ${state.boxerA.name.toUpperCase()}! ${stopA.note}`);
    if (wasGroggyA && !stopA.knockdown) parts.push(`${state.boxerA.name} recuperou a lucidez após balançar.`);
    if (wasGroggyB && !stopB.knockdown) parts.push(`${state.boxerB.name} tenta estabilizar as pernas.`);
    if (refBreakMsg) parts.push(refBreakMsg.trim());
  }

  let highlightTag: string | undefined;
  if (stopB.ko || stopA.ko) highlightTag = 'NOCAUTE (KO)';
  else if (stopB.tko || stopA.tko) highlightTag = 'NOCAUTE TÉCNICO (TKO)';
  else if (stopB.knockdown || stopA.knockdown) highlightTag = 'KNOCKDOWN!';
  else if (resAonB.isCounter || resBonA.isCounter) highlightTag = 'CONTRA-GOLPE!';
  else if (nextDistance === 'cordas') highlightTag = 'PRESSÃO NAS CORDAS';

  // 7. Checar encerramento imediato por KO/TKO ou Fim de Round
  let roundJustEnded = false;
  let betweenRoundSummary: string | undefined;

  if (stopB.ko || stopB.tko) {
    state.isMatchOver = true;
    state.winner = 'boxer_a';
    state.winMethod = stopB.ko ? 'KO' : 'TKO';
    state.finishDetails = `${state.boxerA.name} venceu no Round ${state.currentRound} (${state.roundTimeElapsedSeconds}s) via ${state.winMethod}.`;
  } else if (stopA.ko || stopA.tko) {
    state.isMatchOver = true;
    state.winner = 'boxer_b';
    state.winMethod = stopA.ko ? 'KO' : 'TKO';
    state.finishDetails = `${state.boxerB.name} venceu no Round ${state.currentRound} (${state.roundTimeElapsedSeconds}s) via ${state.winMethod}.`;
  } else if (state.roundTimeElapsedSeconds >= state.roundDurationSeconds) {
    // Finalizar o round atual
    roundJustEnded = true;
    const roundScore = finalizeRoundScore(state);
    state.roundScores.push(roundScore);
    betweenRoundSummary = `Fim do Round ${state.currentRound}/${state.totalRounds}: ${roundScore.note}`;
    parts.push(`🔔 GONGO! ${betweenRoundSummary}`);

    if (state.currentRound >= state.totalRounds) {
      // Fim de todos os rounds: 10-Point Must Decision!
      const decision = buildFinalJudgeDecision(state, rng);
      state.isMatchOver = true;
      state.winner = decision.winner;
      state.winMethod = decision.winMethod;
      state.judgeCards = decision.judgeCards;
      state.finishDetails = decision.summary;
      parts.push(`🏛️ ${decision.summary}`);
    } else {
      // Intervalo de 1 minuto no córner -> próximo round!
      state.currentRound += 1;
      state.roundTimeElapsedSeconds = 0;
      state.currentRoundCleanA = 0;
      state.currentRoundCleanB = 0;
      state.currentRoundPowerA = 0;
      state.currentRoundPowerB = 0;
      state.currentRoundDominanceA = 0;
      state.currentRoundDominanceB = 0;
      state.currentDistance = 'longa';
      state.ropeTrappedBoxer = null;
      state.currentStateId = 'neutro_longa';
      state.clinchConsecutiveCycles = 0;

      const recoverCorner = (b: BoxingCombatAthlete) => {
        const bodyMod = 0.55 + (b.bodyHealth / 100) * 0.45;
        b.energy = clamp(b.energy + 18 * bodyMod, 0, 100);
        b.guardHealth = clamp(b.guardHealth + 32, 0, 100);
        b.chinHealth = clamp(b.chinHealth + 7, 0, 100);
        b.knockdownsThisRound = 0;
        b.isGroggy = false;
      };
      recoverCorner(state.boxerA);
      recoverCorner(state.boxerB);
    }
  }

  const record: BoxingCycleRecord = {
    cycleNumber,
    roundNumber: roundJustEnded && !state.isMatchOver ? state.currentRound - 1 : state.currentRound,
    roundTimeElapsed: roundJustEnded ? state.roundDurationSeconds : state.roundTimeElapsedSeconds,
    roundTimeRemaining: roundJustEnded
      ? 0
      : Math.max(0, state.roundDurationSeconds - state.roundTimeElapsedSeconds),
    distanceBefore,
    distanceAfter: state.currentDistance,
    stateBefore,
    stateAfter: state.currentStateId,
    actionA,
    actionB,
    techniqueNameA: nameA,
    techniqueNameB: nameB,
    narration: parts.join(' '),
    highlightTag,
    hitTypeA: stopB.knockdown ? 'knockdown' : resAonB.visualType,
    hitTypeB: stopA.knockdown ? 'knockdown' : resBonA.visualType,
    damageToA: Math.round((resBonA.chinDmg + resBonA.bodyDmg * 0.4) * 10) / 10,
    damageToB: Math.round((resAonB.chinDmg + resAonB.bodyDmg * 0.4) * 10) / 10,
    isKnockdownOnA: stopA.knockdown,
    isKnockdownOnB: stopB.knockdown,
    refereeCount: stopB.knockdown ? stopB.count : stopA.knockdown ? stopA.count : undefined,
    isCounterByA: resAonB.isCounter,
    isCounterByB: resBonA.isCounter,
    roundJustEnded,
    betweenRoundSummary
  };

  state.history.push(record);
  return state;
}
