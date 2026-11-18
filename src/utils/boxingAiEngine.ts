/**
 * CAMINHO DO GUERREIRO: DO TATAME AO OCTÓGONO
 * Módulo Especializado de Boxe (Pugilismo) — Motor de Inteligência Artificial Tática
 */

import {
  BoxingAiDecisionResult,
  BoxingAiProfile,
  BoxingAiStyle,
  BoxingCombatAthlete,
  BoxingCycleRecord,
  BoxingDeclaredAction,
  BoxingMatchState,
  BoxingParticipant,
  BoxingPersonality,
  BoxingRng,
  BoxingTacticalMemory,
  BoxingTechnique
} from '../types/boxingCombat';
import { BOXING_TECHNIQUE_LIST, BOXING_TECHNIQUES_CATALOG } from '../data/boxingCatalogData';
import { createBoxingRng, validateBoxingAction } from './boxingFightEngine';

export function createInitialBoxingMemory(): BoxingTacticalMemory {
  return {
    cyclesObserved: 0,
    ownHistory: {},
    opponentHighAttacks: 0,
    opponentBodyAttacks: 0,
    opponentDefenses: 0,
    recentOpponentTechniques: []
  };
}

export function createBoxingAiProfile(
  style: BoxingAiStyle,
  personality: BoxingPersonality
): BoxingAiProfile {
  return { style, personality };
}

export function updateBoxingMemoryFromCycle(
  prev: BoxingTacticalMemory,
  cycle: BoxingCycleRecord,
  aiParticipantId: BoxingParticipant
): BoxingTacticalMemory {
  const isA = aiParticipantId === 'boxer_a';
  const ownAct = isA ? cycle.actionA : cycle.actionB;
  const oppAct = isA ? cycle.actionB : cycle.actionA;
  const dealtDamage = isA ? cycle.damageToB : cycle.damageToA;

  const ownHistory = { ...prev.ownHistory };
  if (ownAct.techniqueId) {
    const cur = ownHistory[ownAct.techniqueId] || { attempts: 0, landed: 0, lastCycle: 0 };
    ownHistory[ownAct.techniqueId] = {
      attempts: cur.attempts + 1,
      landed: dealtDamage >= 4 ? cur.landed + 1 : cur.landed,
      lastCycle: cycle.cycleNumber
    };
  }

  let oppHigh = prev.opponentHighAttacks;
  let oppBody = prev.opponentBodyAttacks;
  let oppDef = prev.opponentDefenses;
  const recentOpp = [...prev.recentOpponentTechniques];

  if (oppAct.techniqueId) {
    const t = BOXING_TECHNIQUES_CATALOG[oppAct.techniqueId];
    if (t) {
      if (t.objective === 'golpe_reto' || t.objective === 'golpe_poder_alto' || t.objective === 'combinacao') {
        oppHigh += 1;
      } else if (t.objective === 'golpe_corpo') {
        oppBody += 1;
      } else if (t.objective === 'defesa_guarda' || t.objective === 'esquiva_contra') {
        oppDef += 1;
      }
      recentOpp.push(t.id);
      if (recentOpp.length > 5) recentOpp.shift();
    }
  }

  return {
    cyclesObserved: prev.cyclesObserved + 1,
    ownHistory,
    opponentHighAttacks: oppHigh,
    opponentBodyAttacks: oppBody,
    opponentDefenses: oppDef,
    recentOpponentTechniques: recentOpp
  };
}

function evaluateTechniqueScore(
  tech: BoxingTechnique,
  aiBoxer: BoxingCombatAthlete,
  oppBoxer: BoxingCombatAthlete,
  state: BoxingMatchState,
  profile: BoxingAiProfile,
  memory: BoxingTacticalMemory,
  rng: BoxingRng
): number {
  let score = 40;

  // 1. Alinhamento com atributos
  for (const attr of tech.relevantAttributes) {
    const val = (aiBoxer.attributes as unknown as Record<string, number>)[attr] || 50;
    score += (val - 50) * 0.28;
  }

  // 2. Situação de emergência (groggy ou queixo crítico ou preso nas cordas)
  const isTrappedOnRopes =
    state.currentDistance === 'cordas' && state.ropeTrappedBoxer === aiBoxer.id;
  const oppTrappedOnRopes =
    state.currentDistance === 'cordas' && state.ropeTrappedBoxer === oppBoxer.id;

  if (aiBoxer.isGroggy || aiBoxer.chinHealth < 25) {
    if (tech.objective === 'defesa_guarda' || tech.objective === 'clinch' || tech.objective === 'recuperacao') {
      score += 95;
    } else if (tech.staminaCost >= 18) {
      score -= 45;
    }
  }

  if (isTrappedOnRopes) {
    if (tech.ropeEscapeBonus || tech.objective === 'recuperacao' || tech.objective === 'esquiva_contra') {
      score += 65;
    }
  }

  if (oppTrappedOnRopes || oppBoxer.isGroggy || oppBoxer.chinHealth < 30) {
    if (tech.objective === 'combinacao' || tech.objective === 'golpe_poder_alto') {
      score += 60;
    }
  }

  // 3. Estilo de Boxe
  switch (profile.style) {
    case 'boxer_tecnico':
      if (tech.objective === 'golpe_reto' || tech.id === 'box_combo_um_dois' || tech.id === 'box_step_back_jab') {
        score += 48;
      }
      if (tech.objective === 'esquiva_contra') score += 28;
      if (tech.staminaCost >= 22) score -= 18;
      break;

    case 'slugger_pegador':
      if (tech.objective === 'golpe_poder_alto' || tech.id === 'box_combo_chuva_cordas' || tech.id === 'box_combo_1_2_3') {
        score += 56;
      }
      if (tech.objective === 'clinch' || tech.objective === 'recuperacao') score -= 24;
      break;

    case 'swarmer_pressao':
      if (tech.pushesToRopes || tech.id === 'box_fechar_distancia' || tech.objective === 'golpe_corpo' || tech.objective === 'combinacao') {
        score += 52;
      }
      if (tech.id === 'box_step_back_jab') score -= 30;
      break;

    case 'counter_puncher':
      if (tech.objective === 'esquiva_contra' || tech.id === 'box_check_hook' || tech.id === 'box_upper_encontro') {
        score += 58;
      }
      if (tech.accuracyMod < 0) score -= 25;
      break;

    case 'inside_fighter':
      if (tech.allowedDistances.includes('curta') && (tech.objective === 'golpe_corpo' || tech.id.includes('upper') || tech.id === 'box_fechar_distancia')) {
        score += 54;
      }
      break;

    case 'completo':
      if (tech.objective === 'combinacao' || tech.objective === 'golpe_reto' || tech.objective === 'esquiva_contra') {
        score += 24;
      }
      break;
  }

  // 4. Personalidade & Contexto de Placar nos Rounds
  const isA = aiBoxer.id === 'boxer_a';
  const totalPtsAi = state.roundScores.reduce((acc, r) => acc + (isA ? r.pointsA : r.pointsB), 0);
  const totalPtsOpp = state.roundScores.reduce((acc, r) => acc + (isA ? r.pointsB : r.pointsA), 0);
  const trailingOnCards = totalPtsOpp > totalPtsAi;
  const leadingOnCards = totalPtsAi > totalPtsOpp;
  const finalRound = state.currentRound === state.totalRounds;

  if (trailingOnCards && (finalRound || state.currentRound >= state.totalRounds - 1)) {
    if (tech.objective === 'golpe_poder_alto' || tech.objective === 'combinacao') {
      score += 42;
    }
  } else if (leadingOnCards && finalRound) {
    if (tech.objective === 'golpe_reto' || tech.objective === 'esquiva_contra' || tech.objective === 'defesa_guarda') {
      score += 28;
    }
  }

  switch (profile.personality) {
    case 'agressivo':
      if (tech.basePower >= 15 || tech.objective === 'combinacao') score += 22;
      break;
    case 'paciente':
      if (tech.staminaCost <= 13 && tech.accuracyMod >= 0.04) score += 24;
      break;
    case 'estrategico':
      if (memory.opponentHighAttacks >= 3 && tech.objective === 'esquiva_contra') score += 30;
      if (memory.opponentDefenses >= 2 && tech.id === 'box_combo_finta_alto') score += 32;
      break;
    case 'impulsivo':
      score += (rng() - 0.5) * 32;
      break;
    case 'confiante':
      if ((memory.ownHistory[tech.id]?.landed || 0) > 0) score += 22;
      break;
    case 'cauteloso':
      if (tech.defensiveMitigation && tech.defensiveMitigation >= 0.5) score += 26;
      if (tech.accuracyMod < 0) score -= 24;
      break;
  }

  // 5. Anti-repetição e gestão de gás
  const ownHist = memory.ownHistory[tech.id];
  if (ownHist && memory.cyclesObserved - ownHist.lastCycle <= 1) {
    score -= 22;
  }

  if (aiBoxer.energy < 35 && tech.staminaCost > 14) {
    score -= (tech.staminaCost - 10) * 3.1;
  }

  return score;
}

export function chooseBoxingAiAction(
  state: BoxingMatchState,
  aiBoxer: BoxingCombatAthlete,
  oppBoxer: BoxingCombatAthlete,
  profile: BoxingAiProfile,
  memory: BoxingTacticalMemory,
  rng?: BoxingRng
): BoxingAiDecisionResult {
  const deterministicRng =
    rng || createBoxingRng(state.rngSeed + state.history.length * 131 + 19).next;

  const validTechs = BOXING_TECHNIQUE_LIST.filter((tech) => {
    const check = validateBoxingAction(state, {
      boxerId: aiBoxer.id,
      techniqueId: tech.id
    });
    return check.isValid;
  });

  if (validTechs.length === 0 || (aiBoxer.energy <= 8 && !aiBoxer.isGroggy)) {
    const fallback: BoxingDeclaredAction = {
      boxerId: aiBoxer.id,
      techniqueId: null,
      intent: 'Fechar guarda dupla e recuperar fôlego'
    };
    return {
      action: fallback,
      chosenTechnique: null,
      reasoning: 'Gás baixo: fechando guarda alta para recuperar oxigênio.',
      updatedMemory: memory
    };
  }

  const scored = validTechs
    .map((tech) => ({
      tech,
      score:
        evaluateTechniqueScore(tech, aiBoxer, oppBoxer, state, profile, memory, deterministicRng) +
        (deterministicRng() - 0.5) * 4
    }))
    .sort((a, b) => b.score - a.score);

  const pick = scored[0].tech;
  return {
    action: {
      boxerId: aiBoxer.id,
      techniqueId: pick.id,
      intent: `${profile.style}: ${pick.displayName}`
    },
    chosenTechnique: pick,
    reasoning: `${pick.displayName} selecionada pelo perfil ${profile.style}/${profile.personality}.`,
    updatedMemory: memory
  };
}
