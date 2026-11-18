/**
 * CAMINHO DO GUERREIRO: DO TATAME AO OCTÓGONO
 * Módulo Especializado de Jiu-Jitsu Brasileiro (BJJ) — Arena Isométrica 2D HD
 *
 * Renderiza ginásio/arena com iluminação volumétrica, tatame EVA 3D HiDPI,
 * árbitro oficial CBJJ, atletas com proporções atléticas naturais, anatomia contínua
 * sem linhas estruturais escuras e sombra de contato para nitidez na sobreposição.
 */

import React, { useRef, useEffect } from 'react';
import { BjjMatchState } from '../../types/bjjCombatEngine';
import { BjjParticipant } from '../../types/bjjCombat';
import { BJJ_POSITIONS_CATALOG } from '../../data/bjjPositionsData';
import { getBjjBeltRibbonColors, getBjjMaxStripes } from '../../utils/bjjDegreeHelper';

interface BjjIsometricCanvasProps {
  state: BjjMatchState;
  isGi: boolean;
  isRolling?: boolean;
  onMatClick?: () => void;
  lastFeedbackText?: string | null;
}

interface Pt {
  x: number;
  y: number;
}

interface FighterRig {
  hip: Pt;
  chest: Pt;
  neck: Pt;
  head: Pt;
  shoulderL: Pt;
  elbowL: Pt;
  handL: Pt;
  shoulderR: Pt;
  elbowR: Pt;
  handR: Pt;
  hipL: Pt;
  kneeL: Pt;
  footL: Pt;
  hipR: Pt;
  kneeR: Pt;
  footR: Pt;
  facing: 1 | -1;
  torsoWidth?: number;
  hipWidth?: number;
  zTorso: number;
  zHead: number;
  zArmL: number;
  zArmR: number;
  zLegL: number;
  zLegR: number;
  isSupine?: boolean;
}

interface PosePair {
  a: FighterRig;
  b: FighterRig;
  focalTarget?: Pt;
}

interface AthleteVisualProfile {
  id: BjjParticipant;
  isPlayer: boolean;
  giPrimary: string;
  giHighlight: string;
  giShade: string;
  giLapel: string;
  giContour: string;
  pantsPrimary: string;
  pantsShade: string;
  rashBase: string;
  rashShade: string;
  shortsColor: string;
  shortsAccent: string;
  skinBase: string;
  skinShade: string;
  skinContour: string;
  hairColor: string;
  hasBeard: boolean;
  beltBg: string;
  beltTipBg: string;
  beltStripeColor: string;
  stripes: number;
  maxStripes: number;
  rankColorAccent: string;
  fatigue: number;
}

interface RenderPiece {
  z: number;
  castOverlapShadow: boolean;
  draw: () => void;
}

interface ScorePopup {
  text: string;
  subtext: string;
  color: string;
  bornAt: number;
}

function parseBeltVisualFromAthlete(beltRankIndex: number, beltName: string) {
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
  else {
    metaRankIndex = beltRankIndex === 0 ? 0 : Math.min(8, beltRankIndex + 4);
  }

  const match = beltName?.match(/(\d+)\s*º\s*Grau/i);
  const stripes = match ? Number(match[1]) : 0;
  const colors = getBjjBeltRibbonColors(metaRankIndex);
  const maxStripes = getBjjMaxStripes(metaRankIndex);

  const accentMap: Record<number, string> = {
    0: '#e2e8f0',
    1: '#94a3b8',
    2: '#facc15',
    3: '#f97316',
    4: '#22c55e',
    5: '#3b82f6',
    6: '#a855f7',
    7: '#92400e',
    8: '#ef4444',
    9: '#ef4444',
    11: '#dc2626'
  };

  return {
    beltBg: colors.beltBg.includes('gradient') ? '#dc2626' : colors.beltBg,
    beltTipBg: colors.tipBg,
    beltStripeColor: colors.stripeColor,
    stripes: Math.max(0, Math.min(maxStripes, stripes)),
    maxStripes,
    rankColorAccent: accentMap[metaRankIndex] || '#3b82f6'
  };
}

function createAthleteProfile(
  id: BjjParticipant,
  beltRankIndex: number,
  beltName: string,
  fatigue: number,
  isPlayer: boolean
): AthleteVisualProfile {
  const belt = parseBeltVisualFromAthlete(beltRankIndex, beltName);
  if (id === 'athlete_a') {
    return {
      id,
      isPlayer,
      giPrimary: '#2563eb',
      giHighlight: '#60a5fa',
      giShade: '#1d4ed8',
      giLapel: '#1e3a8a',
      giContour: 'rgba(15, 23, 42, 0.55)',
      pantsPrimary: '#1d4ed8',
      pantsShade: '#1e3a8a',
      rashBase: '#172554',
      rashShade: '#0f172a',
      shortsColor: '#1e293b',
      shortsAccent: '#3b82f6',
      skinBase: '#f1c2a3',
      skinShade: '#d59672',
      skinContour: 'rgba(92, 50, 32, 0.42)',
      hairColor: '#1c1917',
      hasBeard: false,
      ...belt,
      fatigue
    };
  }
  return {
    id,
    isPlayer,
    giPrimary: '#f8fafc',
    giHighlight: '#ffffff',
    giShade: '#cbd5e1',
    giLapel: '#94a3b8',
    giContour: 'rgba(51, 65, 85, 0.58)',
    pantsPrimary: '#f1f5f9',
    pantsShade: '#cbd5e1',
    rashBase: '#27272a',
    rashShade: '#18181b',
    shortsColor: '#27272a',
    shortsAccent: '#e4e4e7',
    skinBase: '#e3a680',
    skinShade: '#bf7c56',
    skinContour: 'rgba(84, 44, 26, 0.44)',
    hairColor: '#3b2416',
    hasBeard: true,
    ...belt,
    fatigue
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPt(p1: Pt, p2: Pt, t: number): Pt {
  return { x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) };
}

function lerpRig(from: FighterRig, to: FighterRig, t: number): FighterRig {
  return {
    hip: lerpPt(from.hip, to.hip, t),
    chest: lerpPt(from.chest, to.chest, t),
    neck: lerpPt(from.neck, to.neck, t),
    head: lerpPt(from.head, to.head, t),
    shoulderL: lerpPt(from.shoulderL, to.shoulderL, t),
    elbowL: lerpPt(from.elbowL, to.elbowL, t),
    handL: lerpPt(from.handL, to.handL, t),
    shoulderR: lerpPt(from.shoulderR, to.shoulderR, t),
    elbowR: lerpPt(from.elbowR, to.elbowR, t),
    handR: lerpPt(from.handR, to.handR, t),
    hipL: lerpPt(from.hipL, to.hipL, t),
    kneeL: lerpPt(from.kneeL, to.kneeL, t),
    footL: lerpPt(from.footL, to.footL, t),
    hipR: lerpPt(from.hipR, to.hipR, t),
    kneeR: lerpPt(from.kneeR, to.kneeR, t),
    footR: lerpPt(from.footR, to.footR, t),
    facing: to.facing,
    torsoWidth: lerp(from.torsoWidth ?? 25, to.torsoWidth ?? 25, t),
    hipWidth: lerp(from.hipWidth ?? 19, to.hipWidth ?? 19, t),
    zTorso: to.zTorso,
    zHead: to.zHead,
    zArmL: to.zArmL,
    zArmR: to.zArmR,
    zLegL: to.zLegL,
    zLegR: to.zLegR,
    isSupine: to.isSupine
  };
}

function mirrorRigX(rig: FighterRig): FighterRig {
  const m = (p: Pt): Pt => ({ x: -p.x, y: p.y });
  return {
    ...rig,
    hip: m(rig.hip),
    chest: m(rig.chest),
    neck: m(rig.neck),
    head: m(rig.head),
    shoulderL: m(rig.shoulderL),
    elbowL: m(rig.elbowL),
    handL: m(rig.handL),
    shoulderR: m(rig.shoulderR),
    elbowR: m(rig.elbowR),
    handR: m(rig.handR),
    hipL: m(rig.hipL),
    kneeL: m(rig.kneeL),
    footL: m(rig.footL),
    hipR: m(rig.hipR),
    kneeR: m(rig.kneeR),
    footR: m(rig.footR),
    facing: (rig.facing * -1) as 1 | -1
  };
}

/**
 * Constrói a postura anatômica proporcional (~1:6.8 cabeça/corpo) para TODAS as 47 posições do catálogo BJJ.
 * Unidades do rig antes da escala (scale = 1.38):
 * - Tronco: ~32u | Coxa: ~21u | Canela: ~21u | Braço: ~15u | Antebraço: ~14u | Cabeça raio: ~7.6u
 */
function buildPoseForState(
  state: BjjMatchState,
  t: number,
  isRolling: boolean
): PosePair {
  const breath = Math.sin(t * 2.5) * 1.4;
  const scrambleJitter = isRolling ? Math.sin(t * 22) * 3.0 : 0;
  const posId = state.currentPositionId;

  // Encerramento com vitória declarada
  if (state.status === 'finalizada' && (state.winner === 'athlete_a' || state.winner === 'athlete_b')) {
    const winnerIsA = state.winner === 'athlete_a';
    const standWin: FighterRig = {
      hip: { x: -38, y: -42 + breath * 0.4 },
      chest: { x: -38, y: -73 + breath * 0.5 },
      neck: { x: -38, y: -82 + breath * 0.5 },
      head: { x: -38, y: -92 + breath * 0.5 },
      shoulderL: { x: -48, y: -72 + breath * 0.5 },
      elbowL: { x: -53, y: -92 },
      handL: { x: -49, y: -110 },
      shoulderR: { x: -28, y: -72 + breath * 0.5 },
      elbowR: { x: -22, y: -56 },
      handR: { x: -24, y: -42 },
      hipL: { x: -44, y: -40 },
      kneeL: { x: -48, y: -20 },
      footL: { x: -50, y: 2 },
      hipR: { x: -32, y: -40 },
      kneeR: { x: -28, y: -19 },
      footR: { x: -26, y: 4 },
      facing: 1,
      zTorso: 5,
      zHead: 6,
      zArmL: 7,
      zArmR: 4,
      zLegL: 4,
      zLegR: 5
    };
    const kneelLose: FighterRig = {
      hip: { x: 42, y: -24 + breath * 0.6 },
      chest: { x: 38, y: -52 + breath * 0.6 },
      neck: { x: 36, y: -60 + breath * 0.6 },
      head: { x: 32, y: -70 + breath * 0.6 },
      shoulderL: { x: 29, y: -50 },
      elbowL: { x: 24, y: -35 },
      handL: { x: 28, y: -24 },
      shoulderR: { x: 47, y: -50 },
      elbowR: { x: 42, y: -34 },
      handR: { x: 36, y: -24 },
      hipL: { x: 36, y: -22 },
      kneeL: { x: 30, y: -2 },
      footL: { x: 48, y: 4 },
      hipR: { x: 48, y: -22 },
      kneeR: { x: 42, y: 2 },
      footR: { x: 60, y: 6 },
      facing: -1,
      zTorso: 3,
      zHead: 4,
      zArmL: 5,
      zArmR: 2,
      zLegL: 2,
      zLegR: 3
    };
    return winnerIsA
      ? { a: standWin, b: kneelLose }
      : { a: mirrorRigX(kneelLose), b: mirrorRigX(standWin) };
  }

  // Base em pé atlética proporcional (altura ~102u)
  const makeStandingBase = (
    xCenter: number,
    lean: number,
    crouch: number,
    handReachX: number,
    handReachY: number,
    bOff: number
  ): FighterRig => ({
    hip: { x: xCenter, y: -42 + crouch + bOff * 0.3 },
    chest: { x: xCenter + lean, y: -72 + crouch + bOff },
    neck: { x: xCenter + lean * 1.15, y: -81 + crouch + bOff },
    head: { x: xCenter + lean * 1.3, y: -91 + crouch + bOff },
    shoulderL: { x: xCenter + lean - 9, y: -71 + crouch + bOff },
    elbowL: { x: xCenter + lean + handReachX * 0.42 - 5, y: -57 + crouch + handReachY * 0.4 },
    handL: { x: xCenter + lean + handReachX - 3, y: -64 + crouch + handReachY },
    shoulderR: { x: xCenter + lean + 10, y: -71 + crouch + bOff },
    elbowR: { x: xCenter + lean + handReachX * 0.55 + 5, y: -55 + crouch + handReachY * 0.5 },
    handR: { x: xCenter + lean + handReachX + 4, y: -68 + crouch + handReachY * 0.9 },
    hipL: { x: xCenter - 7, y: -40 + crouch },
    kneeL: { x: xCenter - 15, y: -19 + crouch * 0.4 },
    footL: { x: xCenter - 22, y: 2 },
    hipR: { x: xCenter + 7, y: -40 + crouch },
    kneeR: { x: xCenter + 16, y: -18 + crouch * 0.4 },
    footR: { x: xCenter + 14, y: 6 },
    facing: 1,
    zTorso: 5,
    zHead: 6,
    zArmL: 3,
    zArmR: 8,
    zLegL: 4,
    zLegR: 6
  });

  // =========================================================================
  // A. POSIÇÕES EM PÉ (9 posições)
  // =========================================================================
  if (posId.startsWith('stand_')) {
    const bCtrl = state.controllingAthlete === 'athlete_b';

    if (posId === 'stand_neutral') {
      const a = makeStandingBase(-46 + scrambleJitter * 0.35, 7, 3, 21, 0, breath);
      const b = mirrorRigX(makeStandingBase(-46 - scrambleJitter * 0.35, 7, 3, 21, 0, -breath));
      return { a, b };
    }

    if (posId === 'stand_grip_fight') {
      const a = makeStandingBase(-30 + scrambleJitter * 0.4, 11, 5, 32, -2, breath);
      const b = mirrorRigX(makeStandingBase(-30 - scrambleJitter * 0.4, 11, 5, 32, -2, -breath));
      return { a, b, focalTarget: { x: 0, y: -68 } };
    }

    if (posId === 'stand_collar_control' || posId === 'stand_sleeve_control') {
      const ctrl = makeStandingBase(-28, 9, 4, 36, -5, breath);
      const recv = mirrorRigX(makeStandingBase(-26, 14, 8, 22, 6, -breath));
      return bCtrl
        ? { a: mirrorRigX(recv), b: mirrorRigX(ctrl), focalTarget: { x: -8, y: -70 } }
        : { a: ctrl, b: recv, focalTarget: { x: 8, y: -70 } };
    }

    if (posId === 'stand_clinch' || posId === 'stand_body_lock') {
      const a = makeStandingBase(-16 + scrambleJitter * 0.3, 8, 5, 26, 6, breath);
      const b = mirrorRigX(makeStandingBase(-16 - scrambleJitter * 0.3, 8, 5, 26, 9, -breath));
      a.zArmR = 9;
      b.zArmL = 2;
      return { a, b, focalTarget: { x: 0, y: -62 } };
    }

    if (posId === 'stand_front_headlock') {
      const att = makeStandingBase(-28, 12, 8, 32, 10, breath);
      att.handR = { x: 12, y: -58 };
      att.elbowR = { x: 2, y: -66 };
      att.zArmR = 9;
      const def: FighterRig = {
        hip: { x: 38, y: -42 - breath * 0.3 },
        chest: { x: 14, y: -55 - breath * 0.4 },
        neck: { x: 5, y: -56 },
        head: { x: -3, y: -54 },
        shoulderL: { x: 14, y: -51 },
        elbowL: { x: 2, y: -40 },
        handL: { x: -6, y: -48 },
        shoulderR: { x: 16, y: -58 },
        elbowR: { x: 4, y: -46 },
        handR: { x: -6, y: -52 },
        hipL: { x: 34, y: -40 },
        kneeL: { x: 28, y: -19 },
        footL: { x: 24, y: 4 },
        hipR: { x: 44, y: -40 },
        kneeR: { x: 48, y: -18 },
        footR: { x: 50, y: 6 },
        facing: -1,
        zTorso: 5,
        zHead: 6,
        zArmL: 4,
        zArmR: 7,
        zLegL: 4,
        zLegR: 6
      };
      return bCtrl
        ? { a: mirrorRigX(def), b: mirrorRigX(att), focalTarget: { x: 3, y: -56 } }
        : { a: att, b: def, focalTarget: { x: -3, y: -56 } };
    }

    if (posId === 'stand_back_control') {
      const att: FighterRig = {
        hip: { x: -16, y: -42 + breath * 0.3 },
        chest: { x: -9, y: -72 + breath * 0.8 },
        neck: { x: -7, y: -81 + breath * 0.8 },
        head: { x: -6, y: -91 + breath * 0.8 },
        shoulderL: { x: -17, y: -71 },
        elbowL: { x: 1, y: -62 },
        handL: { x: 15, y: -64 },
        shoulderR: { x: -1, y: -70 },
        elbowR: { x: 14, y: -73 },
        handR: { x: 16, y: -63 },
        hipL: { x: -22, y: -40 },
        kneeL: { x: -26, y: -19 },
        footL: { x: -28, y: 4 },
        hipR: { x: -10, y: -40 },
        kneeR: { x: -8, y: -18 },
        footR: { x: -6, y: 6 },
        facing: 1,
        zTorso: 3,
        zHead: 4,
        zArmL: 2,
        zArmR: 9,
        zLegL: 2,
        zLegR: 4
      };
      const def: FighterRig = {
        hip: { x: 5, y: -43 - breath * 0.3 },
        chest: { x: 11, y: -73 - breath * 0.5 },
        neck: { x: 13, y: -82 - breath * 0.5 },
        head: { x: 15, y: -92 - breath * 0.5 },
        shoulderL: { x: 3, y: -72 },
        elbowL: { x: 14, y: -58 },
        handL: { x: 16, y: -64 },
        shoulderR: { x: 19, y: -71 },
        elbowR: { x: 25, y: -57 },
        handR: { x: 19, y: -62 },
        hipL: { x: -1, y: -41 },
        kneeL: { x: 1, y: -19 },
        footL: { x: 3, y: 5 },
        hipR: { x: 12, y: -41 },
        kneeR: { x: 16, y: -18 },
        footR: { x: 20, y: 7 },
        facing: 1,
        zTorso: 6,
        zHead: 7,
        zArmL: 5,
        zArmR: 8,
        zLegL: 5,
        zLegR: 7
      };
      return bCtrl
        ? { a: mirrorRigX(def), b: mirrorRigX(att), focalTarget: { x: -14, y: -65 } }
        : { a: att, b: def, focalTarget: { x: 14, y: -65 } };
    }

    // stand_takedown_threat -> Entrada de Double-Leg / Single-Leg + Sprawl
    const shooter: FighterRig = {
      hip: { x: -38, y: -26 + breath },
      chest: { x: -14, y: -40 + breath },
      neck: { x: -4, y: -44 },
      head: { x: 4, y: -50 },
      shoulderL: { x: -16, y: -38 },
      elbowL: { x: 2, y: -28 },
      handL: { x: 20, y: -30 },
      shoulderR: { x: -12, y: -43 },
      elbowR: { x: 6, y: -34 },
      handR: { x: 22, y: -32 },
      hipL: { x: -44, y: -24 },
      kneeL: { x: -26, y: -3 },
      footL: { x: -46, y: 4 },
      hipR: { x: -32, y: -24 },
      kneeR: { x: -16, y: -8 },
      footR: { x: -20, y: 8 },
      facing: 1,
      zTorso: 5,
      zHead: 6,
      zArmL: 4,
      zArmR: 9,
      zLegL: 3,
      zLegR: 6
    };
    const sprawler: FighterRig = {
      hip: { x: 36, y: -34 - breath * 0.4 },
      chest: { x: 16, y: -58 - breath * 0.4 },
      neck: { x: 10, y: -66 },
      head: { x: 4, y: -74 },
      shoulderL: { x: 12, y: -56 },
      elbowL: { x: 2, y: -45 },
      handL: { x: -6, y: -40 },
      shoulderR: { x: 22, y: -56 },
      elbowR: { x: 14, y: -43 },
      handR: { x: 4, y: -36 },
      hipL: { x: 32, y: -32 },
      kneeL: { x: 42, y: -12 },
      footL: { x: 58, y: 4 },
      hipR: { x: 42, y: -32 },
      kneeR: { x: 56, y: -14 },
      footR: { x: 72, y: 6 },
      facing: -1,
      zTorso: 6,
      zHead: 7,
      zArmL: 5,
      zArmR: 8,
      zLegL: 4,
      zLegR: 7
    };
    return bCtrl
      ? { a: mirrorRigX(sprawler), b: mirrorRigX(shooter), focalTarget: { x: -16, y: -30 } }
      : { a: shooter, b: sprawler, focalTarget: { x: 16, y: -30 } };
  }

  // =========================================================================
  // Papéis de Solo: Top vs Bottom
  // =========================================================================
  const topIsA = state.athleteTop === 'athlete_a';
  const topIsB = state.athleteTop === 'athlete_b';
  const bottomIsA = state.athleteBottom === 'athlete_a' || (!topIsA && topIsB);

  const assignTopBottom = (topRig: FighterRig, botRig: FighterRig, focal?: Pt): PosePair => {
    if (topIsA) return { a: topRig, b: botRig, focalTarget: focal };
    if (topIsB) return { a: botRig, b: topRig, focalTarget: focal };
    if (state.controllingAthlete === 'athlete_a') return { a: topRig, b: botRig, focalTarget: focal };
    if (state.controllingAthlete === 'athlete_b') return { a: botRig, b: topRig, focalTarget: focal };
    return { a: botRig, b: topRig, focalTarget: focal };
  };

  // =========================================================================
  // B. GUARDAS (16 posições)
  // =========================================================================
  if (posId === 'guard_closed') {
    const bottom: FighterRig = {
      hip: { x: -6, y: -8 },
      chest: { x: -38, y: -10 + breath * 0.3 },
      neck: { x: -48, y: -12 + breath * 0.3 },
      head: { x: -58, y: -16 + breath * 0.3 },
      shoulderL: { x: -38, y: -15 },
      elbowL: { x: -20, y: -28 },
      handL: { x: 2, y: -44 },
      shoulderR: { x: -34, y: -4 },
      elbowR: { x: -16, y: -15 },
      handR: { x: 6, y: -34 },
      hipL: { x: -4, y: -12 },
      kneeL: { x: 14, y: -29 },
      footL: { x: 34, y: -16 },
      hipR: { x: -2, y: -4 },
      kneeR: { x: 18, y: -8 },
      footR: { x: 36, y: -16 },
      facing: 1,
      isSupine: true,
      zTorso: 2,
      zHead: 3,
      zArmL: 3,
      zArmR: 8,
      zLegL: 9,
      zLegR: 1
    };
    const top: FighterRig = {
      hip: { x: 20, y: -20 + breath * 0.4 },
      chest: { x: 12, y: -49 + breath * 0.8 },
      neck: { x: 9, y: -58 + breath * 0.8 },
      head: { x: 6, y: -68 + breath * 0.8 },
      shoulderL: { x: 4, y: -47 },
      elbowL: { x: -4, y: -30 },
      handL: { x: -10, y: -14 },
      shoulderR: { x: 20, y: -47 },
      elbowR: { x: 10, y: -28 },
      handR: { x: -2, y: -12 },
      hipL: { x: 16, y: -18 },
      kneeL: { x: 22, y: 2 },
      footL: { x: 42, y: 4 },
      hipR: { x: 24, y: -16 },
      kneeR: { x: 32, y: 6 },
      footR: { x: 52, y: 8 },
      facing: -1,
      zTorso: 5,
      zHead: 6,
      zArmL: 4,
      zArmR: 10,
      zLegL: 4,
      zLegR: 6
    };
    return assignTopBottom(top, bottom, { x: 14, y: -24 });
  }

  if (posId === 'guard_butterfly' || posId === 'guard_seated') {
    const isSeated = posId === 'guard_seated';
    const bottom: FighterRig = {
      hip: { x: -30, y: -7 },
      chest: { x: -22, y: -38 + breath * 0.7 },
      neck: { x: -18, y: -47 + breath * 0.7 },
      head: { x: -14, y: -57 + breath * 0.7 },
      shoulderL: { x: -28, y: -36 },
      elbowL: { x: -10, y: -39 },
      handL: { x: 8, y: -44 },
      shoulderR: { x: -14, y: -36 },
      elbowR: { x: 4, y: -34 },
      handR: { x: 16, y: -40 },
      hipL: { x: -28, y: -5 },
      kneeL: { x: -10, y: -16 },
      footL: { x: 8, y: -4 },
      hipR: { x: -24, y: -3 },
      kneeR: { x: -4, y: -7 },
      footR: { x: 12, y: 2 },
      facing: 1,
      zTorso: 4,
      zHead: 5,
      zArmL: 3,
      zArmR: 8,
      zLegL: 3,
      zLegR: 7
    };
    if (isSeated) {
      return assignTopBottom(mirrorRigX(makeStandingBase(-30, 8, 6, 22, 6, -breath)), bottom);
    }
    const top: FighterRig = {
      hip: { x: 30, y: -20 + breath * 0.4 },
      chest: { x: 18, y: -48 + breath * 0.8 },
      neck: { x: 15, y: -57 + breath * 0.8 },
      head: { x: 12, y: -68 + breath * 0.8 },
      shoulderL: { x: 10, y: -46 },
      elbowL: { x: 0, y: -32 },
      handL: { x: -12, y: -22 },
      shoulderR: { x: 26, y: -46 },
      elbowR: { x: 12, y: -34 },
      handR: { x: -6, y: -36 },
      hipL: { x: 24, y: -18 },
      kneeL: { x: 18, y: 2 },
      footL: { x: 38, y: 4 },
      hipR: { x: 36, y: -18 },
      kneeR: { x: 30, y: 5 },
      footR: { x: 50, y: 7 },
      facing: -1,
      zTorso: 5,
      zHead: 6,
      zArmL: 4,
      zArmR: 9,
      zLegL: 4,
      zLegR: 6
    };
    return assignTopBottom(top, bottom);
  }

  if (posId === 'guard_spider' || posId === 'guard_lasso') {
    const bottom: FighterRig = {
      hip: { x: -16, y: -6 },
      chest: { x: -46, y: -10 + breath * 0.3 },
      neck: { x: -56, y: -13 },
      head: { x: -65, y: -19 },
      shoulderL: { x: -44, y: -14 },
      elbowL: { x: -28, y: -26 },
      handL: { x: -8, y: -38 },
      shoulderR: { x: -38, y: -6 },
      elbowR: { x: -20, y: -18 },
      handR: { x: -2, y: -30 },
      hipL: { x: -14, y: -10 },
      kneeL: { x: 0, y: -34 },
      footL: { x: 14, y: -42 },
      hipR: { x: -10, y: -4 },
      kneeR: { x: 6, y: -24 },
      footR: { x: 16, y: -32 },
      facing: 1,
      isSupine: true,
      zTorso: 2,
      zHead: 3,
      zArmL: 3,
      zArmR: 7,
      zLegL: 8,
      zLegR: 7
    };
    const top = mirrorRigX(makeStandingBase(-34, 12, 8, 28, 12, -breath));
    return assignTopBottom(top, bottom, { x: 6, y: -36 });
  }

  if (posId === 'guard_de_la_riva' || posId === 'guard_reverse_de_la_riva') {
    const bottom: FighterRig = {
      hip: { x: -12, y: -6 },
      chest: { x: -42, y: -8 + breath * 0.3 },
      neck: { x: -52, y: -10 },
      head: { x: -62, y: -15 },
      shoulderL: { x: -40, y: -12 },
      elbowL: { x: -22, y: -24 },
      handL: { x: 2, y: -38 },
      shoulderR: { x: -34, y: -4 },
      elbowR: { x: -14, y: -12 },
      handR: { x: 10, y: -10 },
      hipL: { x: -10, y: -10 },
      kneeL: { x: 8, y: -25 },
      footL: { x: 24, y: -32 },
      hipR: { x: -8, y: -4 },
      kneeR: { x: 16, y: -8 },
      footR: { x: 10, y: -17 },
      facing: 1,
      isSupine: true,
      zTorso: 2,
      zHead: 3,
      zArmL: 4,
      zArmR: 8,
      zLegL: 7,
      zLegR: 8
    };
    const top = mirrorRigX(makeStandingBase(-24, 10, 6, 24, 10, -breath));
    return assignTopBottom(top, bottom, { x: 12, y: -12 });
  }

  if (posId === 'guard_x' || posId === 'guard_single_leg_x') {
    const bottom: FighterRig = {
      hip: { x: -4, y: -5 },
      chest: { x: -34, y: -7 + breath * 0.3 },
      neck: { x: -44, y: -9 },
      head: { x: -54, y: -14 },
      shoulderL: { x: -32, y: -11 },
      elbowL: { x: -16, y: -19 },
      handL: { x: 4, y: -14 },
      shoulderR: { x: -28, y: -2 },
      elbowR: { x: -10, y: -8 },
      handR: { x: 10, y: -8 },
      hipL: { x: -2, y: -8 },
      kneeL: { x: 12, y: -28 },
      footL: { x: 24, y: -36 },
      hipR: { x: 0, y: -2 },
      kneeR: { x: 18, y: -19 },
      footR: { x: 26, y: -25 },
      facing: 1,
      isSupine: true,
      zTorso: 2,
      zHead: 3,
      zArmL: 4,
      zArmR: 8,
      zLegL: 8,
      zLegR: 7
    };
    const top = mirrorRigX(makeStandingBase(-14, 6, 4, 18, 12, -breath));
    return assignTopBottom(top, bottom, { x: 10, y: -18 });
  }

  if (posId === 'guard_fifty_fifty' || posId === 'trans_leg_entanglement') {
    const leftFighter: FighterRig = {
      hip: { x: -24, y: -6 },
      chest: { x: -44, y: -26 + breath * 0.4 },
      neck: { x: -49, y: -34 },
      head: { x: -54, y: -44 },
      shoulderL: { x: -50, y: -24 },
      elbowL: { x: -36, y: -16 },
      handL: { x: -14, y: -13 },
      shoulderR: { x: -38, y: -26 },
      elbowR: { x: -20, y: -19 },
      handR: { x: -2, y: -11 },
      hipL: { x: -22, y: -8 },
      kneeL: { x: 2, y: -18 },
      footL: { x: 18, y: -6 },
      hipR: { x: -20, y: -4 },
      kneeR: { x: 6, y: -4 },
      footR: { x: -2, y: 4 },
      facing: 1,
      zTorso: 4,
      zHead: 5,
      zArmL: 3,
      zArmR: 7,
      zLegL: 8,
      zLegR: 6
    };
    const rightFighter = mirrorRigX({ ...leftFighter, zLegL: 5, zLegR: 9 });
    return bottomIsA
      ? { a: leftFighter, b: rightFighter, focalTarget: { x: 0, y: -10 } }
      : { a: rightFighter, b: leftFighter, focalTarget: { x: 0, y: -10 } };
  }

  if (posId === 'guard_half' || posId === 'guard_deep_half' || posId === 'guard_knee_shield' || posId === 'guard_z') {
    const hasShield = posId === 'guard_knee_shield' || posId === 'guard_z';
    const isDeep = posId === 'guard_deep_half';
    const bottom: FighterRig = {
      hip: { x: isDeep ? 6 : -14, y: -6 },
      chest: { x: isDeep ? -10 : -44, y: -12 + breath * 0.3 },
      neck: { x: isDeep ? -14 : -54, y: -15 },
      head: { x: isDeep ? -18 : -63, y: -21 },
      shoulderL: { x: isDeep ? -12 : -42, y: -16 },
      elbowL: { x: isDeep ? 4 : -22, y: -26 },
      handL: { x: isDeep ? 18 : -4, y: -33 },
      shoulderR: { x: isDeep ? -6 : -38, y: -8 },
      elbowR: { x: isDeep ? 10 : -18, y: -12 },
      handR: { x: isDeep ? 22 : 2, y: -18 },
      hipL: { x: isDeep ? 6 : -10, y: -10 },
      kneeL: { x: hasShield ? 4 : 10, y: hasShield ? -29 : -16 },
      footL: { x: 26, y: -6 },
      hipR: { x: isDeep ? 8 : -8, y: -4 },
      kneeR: { x: 16, y: -2 },
      footR: { x: 30, y: 2 },
      facing: 1,
      zTorso: 2,
      zHead: 3,
      zArmL: 4,
      zArmR: 8,
      zLegL: 8,
      zLegR: 1
    };
    const top: FighterRig = {
      hip: { x: 24, y: -15 + breath * 0.4 },
      chest: { x: 4, y: -33 + breath * 0.7 },
      neck: { x: -4, y: -39 },
      head: { x: -12, y: -46 },
      shoulderL: { x: 0, y: -36 },
      elbowL: { x: -14, y: -28 },
      handL: { x: -26, y: -22 },
      shoulderR: { x: 8, y: -28 },
      elbowR: { x: -6, y: -20 },
      handR: { x: -20, y: -16 },
      hipL: { x: 22, y: -13 },
      kneeL: { x: 14, y: 2 },
      footL: { x: 30, y: 6 },
      hipR: { x: 28, y: -15 },
      kneeR: { x: 38, y: 4 },
      footR: { x: 56, y: 6 },
      facing: -1,
      zTorso: 5,
      zHead: 6,
      zArmL: 4,
      zArmR: 9,
      zLegL: 4,
      zLegR: 6
    };
    return assignTopBottom(top, bottom, { x: 16, y: -8 });
  }

  if (posId === 'guard_open' || posId === 'guard_supine') {
    const bottom: FighterRig = {
      hip: { x: -14, y: -6 },
      chest: { x: -44, y: -10 + breath * 0.3 },
      neck: { x: -54, y: -13 },
      head: { x: -64, y: -19 },
      shoulderL: { x: -42, y: -14 },
      elbowL: { x: -26, y: -26 },
      handL: { x: -10, y: -34 },
      shoulderR: { x: -36, y: -6 },
      elbowR: { x: -20, y: -16 },
      handR: { x: -4, y: -22 },
      hipL: { x: -12, y: -10 },
      kneeL: { x: 0, y: -28 },
      footL: { x: 12, y: -34 },
      hipR: { x: -8, y: -4 },
      kneeR: { x: 6, y: -17 },
      footR: { x: 16, y: -23 },
      facing: 1,
      isSupine: true,
      zTorso: 2,
      zHead: 3,
      zArmL: 4,
      zArmR: 7,
      zLegL: 8,
      zLegR: 7
    };
    const top = mirrorRigX(makeStandingBase(-32, 12, 8, 24, 10, -breath));
    return assignTopBottom(top, bottom);
  }

  // =========================================================================
  // C. PASSAGEM E CONTROLE POR CIMA (10 posições)
  // =========================================================================
  if (posId === 'top_passing_process' || posId === 'trans_guard_recovery') {
    const bottom: FighterRig = {
      hip: { x: -12, y: -6 },
      chest: { x: -42, y: -10 + breath * 0.3 },
      neck: { x: -52, y: -13 },
      head: { x: -62, y: -19 },
      shoulderL: { x: -40, y: -14 },
      elbowL: { x: -22, y: -24 },
      handL: { x: -4, y: -30 },
      shoulderR: { x: -34, y: -6 },
      elbowR: { x: -16, y: -14 },
      handR: { x: 0, y: -22 },
      hipL: { x: -10, y: -10 },
      kneeL: { x: 2, y: -25 },
      footL: { x: -6, y: -35 },
      hipR: { x: -6, y: -4 },
      kneeR: { x: 10, y: -10 },
      footR: { x: 20, y: -2 },
      facing: 1,
      isSupine: true,
      zTorso: 2,
      zHead: 3,
      zArmL: 4,
      zArmR: 7,
      zLegL: 6,
      zLegR: 5
    };
    const top: FighterRig = {
      hip: { x: 20 + scrambleJitter * 0.4, y: -26 + breath * 0.4 },
      chest: { x: 2 + scrambleJitter * 0.4, y: -46 + breath * 0.8 },
      neck: { x: -4, y: -54 + breath * 0.8 },
      head: { x: -12, y: -62 + breath * 0.8 },
      shoulderL: { x: -4, y: -45 },
      elbowL: { x: -14, y: -32 },
      handL: { x: -18, y: -18 },
      shoulderR: { x: 8, y: -43 },
      elbowR: { x: -2, y: -26 },
      handR: { x: -6, y: -12 },
      hipL: { x: 14, y: -24 },
      kneeL: { x: 0, y: -8 },
      footL: { x: 12, y: 4 },
      hipR: { x: 28, y: -24 },
      kneeR: { x: 36, y: -6 },
      footR: { x: 48, y: 6 },
      facing: -1,
      zTorso: 6,
      zHead: 7,
      zArmL: 5,
      zArmR: 9,
      zLegL: 7,
      zLegR: 6
    };
    return assignTopBottom(top, bottom, { x: 0, y: -14 });
  }

  if (posId === 'top_half_guard_control') {
    const bottom: FighterRig = {
      hip: { x: -6, y: -5 },
      chest: { x: -38, y: -7 + breath * 0.3 },
      neck: { x: -49, y: -8 },
      head: { x: -59, y: -11 },
      shoulderL: { x: -36, y: -12 },
      elbowL: { x: -22, y: -22 },
      handL: { x: -6, y: -26 },
      shoulderR: { x: -32, y: -2 },
      elbowR: { x: -18, y: 2 },
      handR: { x: -2, y: -6 },
      hipL: { x: -4, y: -8 },
      kneeL: { x: 14, y: -12 },
      footL: { x: 28, y: -2 },
      hipR: { x: -2, y: -2 },
      kneeR: { x: 18, y: 2 },
      footR: { x: 30, y: 4 },
      facing: 1,
      isSupine: true,
      zTorso: 2,
      zHead: 3,
      zArmL: 4,
      zArmR: 6,
      zLegL: 7,
      zLegR: 1
    };
    const top: FighterRig = {
      hip: { x: 20, y: -12 + breath * 0.3 },
      chest: { x: -14, y: -19 + breath * 0.4 },
      neck: { x: -26, y: -21 },
      head: { x: -36, y: -25 },
      shoulderL: { x: -18, y: -23 },
      elbowL: { x: -32, y: -21 },
      handL: { x: -46, y: -13 },
      shoulderR: { x: -10, y: -15 },
      elbowR: { x: -22, y: -6 },
      handR: { x: -36, y: -6 },
      hipL: { x: 18, y: -10 },
      kneeL: { x: 14, y: 2 },
      footL: { x: 32, y: 6 },
      hipR: { x: 26, y: -12 },
      kneeR: { x: 38, y: 4 },
      footR: { x: 56, y: 6 },
      facing: -1,
      zTorso: 6,
      zHead: 7,
      zArmL: 8,
      zArmR: 5,
      zLegL: 4,
      zLegR: 6
    };
    return assignTopBottom(top, bottom);
  }

  if (posId === 'top_side_control' || posId === 'def_side_control' || posId === 'escape_side_control') {
    const isEscaping = posId === 'escape_side_control';
    const bottom: FighterRig = {
      hip: { x: isEscaping ? 12 : 6, y: -5 },
      chest: { x: -28, y: -7 + breath * 0.3 },
      neck: { x: -39, y: -8 },
      head: { x: -50, y: -11 },
      shoulderL: { x: -26, y: -12 },
      elbowL: { x: -16, y: -22 },
      handL: { x: -4, y: -26 },
      shoulderR: { x: -22, y: -2 },
      elbowR: { x: -8, y: -10 },
      handR: { x: 4, y: -16 },
      hipL: { x: 6, y: -8 },
      kneeL: { x: 26, y: -14 },
      footL: { x: 42, y: 2 },
      hipR: { x: 10, y: -2 },
      kneeR: { x: 30, y: 0 },
      footR: { x: 48, y: 6 },
      facing: 1,
      isSupine: true,
      zTorso: 2,
      zHead: 3,
      zArmL: 7,
      zArmR: 8,
      zLegL: 3,
      zLegR: 2
    };
    const top: FighterRig = {
      hip: { x: -4, y: 10 + breath * 0.3 },
      chest: { x: -14, y: -18 + breath * 0.4 },
      neck: { x: -21, y: -24 },
      head: { x: -28, y: -30 },
      shoulderL: { x: -22, y: -20 },
      elbowL: { x: -36, y: -17 },
      handL: { x: -44, y: -9 },
      shoulderR: { x: -6, y: -15 },
      elbowR: { x: 6, y: -19 },
      handR: { x: -2, y: -25 },
      hipL: { x: -12, y: 10 },
      kneeL: { x: -20, y: 24 },
      footL: { x: -38, y: 26 },
      hipR: { x: 4, y: 10 },
      kneeR: { x: 12, y: 24 },
      footR: { x: -4, y: 28 },
      facing: -1,
      zTorso: 6,
      zHead: 7,
      zArmL: 8,
      zArmR: 5,
      zLegL: 6,
      zLegR: 7
    };
    return assignTopBottom(top, bottom);
  }

  if (posId === 'top_kesa_gatame') {
    const bottom: FighterRig = {
      hip: { x: 16, y: -5 },
      chest: { x: -20, y: -7 + breath * 0.3 },
      neck: { x: -32, y: -8 },
      head: { x: -43, y: -12 },
      shoulderL: { x: -20, y: -12 },
      elbowL: { x: -6, y: -20 },
      handL: { x: 6, y: -16 },
      shoulderR: { x: -18, y: -2 },
      elbowR: { x: -4, y: 4 },
      handR: { x: 10, y: 2 },
      hipL: { x: 16, y: -8 },
      kneeL: { x: 36, y: -8 },
      footL: { x: 54, y: 2 },
      hipR: { x: 18, y: -2 },
      kneeR: { x: 38, y: 2 },
      footR: { x: 58, y: 6 },
      facing: 1,
      isSupine: true,
      zTorso: 2,
      zHead: 3,
      zArmL: 4,
      zArmR: 7,
      zLegL: 3,
      zLegR: 2
    };
    const top: FighterRig = {
      hip: { x: -6, y: 6 },
      chest: { x: -24, y: -20 + breath * 0.5 },
      neck: { x: -30, y: -26 },
      head: { x: -36, y: -33 },
      shoulderL: { x: -32, y: -20 },
      elbowL: { x: -44, y: -15 },
      handL: { x: -36, y: -9 },
      shoulderR: { x: -14, y: -20 },
      elbowR: { x: -4, y: -12 },
      handR: { x: -16, y: -7 },
      hipL: { x: -10, y: 8 },
      kneeL: { x: -32, y: 12 },
      footL: { x: -50, y: 14 },
      hipR: { x: -2, y: 8 },
      kneeR: { x: 16, y: 16 },
      footR: { x: 32, y: 18 },
      facing: -1,
      zTorso: 6,
      zHead: 7,
      zArmL: 8,
      zArmR: 9,
      zLegL: 7,
      zLegR: 6
    };
    return assignTopBottom(top, bottom);
  }

  if (posId === 'top_north_south') {
    const bottom: FighterRig = {
      hip: { x: 20, y: -4 },
      chest: { x: -14, y: -6 + breath * 0.3 },
      neck: { x: -24, y: -8 },
      head: { x: -34, y: -12 },
      shoulderL: { x: -14, y: -11 },
      elbowL: { x: -4, y: -20 },
      handL: { x: 4, y: -22 },
      shoulderR: { x: -12, y: -2 },
      elbowR: { x: 2, y: -6 },
      handR: { x: 12, y: -10 },
      hipL: { x: 20, y: -8 },
      kneeL: { x: 36, y: -18 },
      footL: { x: 50, y: 0 },
      hipR: { x: 22, y: -2 },
      kneeR: { x: 40, y: -8 },
      footR: { x: 56, y: 6 },
      facing: 1,
      isSupine: true,
      zTorso: 2,
      zHead: 3,
      zArmL: 4,
      zArmR: 5,
      zLegL: 3,
      zLegR: 2
    };
    const top: FighterRig = {
      hip: { x: -48, y: -6 + breath * 0.3 },
      chest: { x: -16, y: -18 + breath * 0.4 },
      neck: { x: -6, y: -20 },
      head: { x: 4, y: -24 },
      shoulderL: { x: -14, y: -22 },
      elbowL: { x: -6, y: -15 },
      handL: { x: 4, y: -11 },
      shoulderR: { x: -18, y: -11 },
      elbowR: { x: -10, y: -4 },
      handR: { x: 0, y: -2 },
      hipL: { x: -48, y: -10 },
      kneeL: { x: -64, y: 2 },
      footL: { x: -78, y: 4 },
      hipR: { x: -44, y: -2 },
      kneeR: { x: -60, y: 8 },
      footR: { x: -74, y: 10 },
      facing: 1,
      zTorso: 6,
      zHead: 7,
      zArmL: 8,
      zArmR: 5,
      zLegL: 5,
      zLegR: 6
    };
    return assignTopBottom(top, bottom);
  }

  if (posId === 'top_knee_on_belly') {
    const bottom: FighterRig = {
      hip: { x: 14, y: -5 },
      chest: { x: -22, y: -7 + breath * 0.3 },
      neck: { x: -34, y: -8 },
      head: { x: -45, y: -12 },
      shoulderL: { x: -22, y: -12 },
      elbowL: { x: -10, y: -22 },
      handL: { x: -2, y: -28 },
      shoulderR: { x: -18, y: -2 },
      elbowR: { x: -4, y: -8 },
      handR: { x: 6, y: -14 },
      hipL: { x: 14, y: -8 },
      kneeL: { x: 32, y: -12 },
      footL: { x: 48, y: 2 },
      hipR: { x: 18, y: -2 },
      kneeR: { x: 38, y: -4 },
      footR: { x: 54, y: 6 },
      facing: 1,
      isSupine: true,
      zTorso: 2,
      zHead: 3,
      zArmL: 5,
      zArmR: 6,
      zLegL: 3,
      zLegR: 2
    };
    const top: FighterRig = {
      hip: { x: -4, y: -32 + breath * 0.4 },
      chest: { x: -8, y: -61 + breath * 0.8 },
      neck: { x: -10, y: -70 + breath * 0.8 },
      head: { x: -13, y: -80 + breath * 0.8 },
      shoulderL: { x: -16, y: -59 },
      elbowL: { x: -22, y: -38 },
      handL: { x: -24, y: -18 },
      shoulderR: { x: 2, y: -59 },
      elbowR: { x: 4, y: -36 },
      handR: { x: 4, y: -16 },
      hipL: { x: -10, y: -30 },
      kneeL: { x: -6, y: -12 },
      footL: { x: -20, y: 6 },
      hipR: { x: 4, y: -30 },
      kneeR: { x: 14, y: -10 },
      footR: { x: 24, y: 12 },
      facing: -1,
      zTorso: 6,
      zHead: 7,
      zArmL: 8,
      zArmR: 9,
      zLegL: 7,
      zLegR: 8
    };
    return assignTopBottom(top, bottom, { x: -6, y: -12 });
  }

  if (posId === 'top_mount' || posId === 'top_high_mount' || posId === 'def_mount' || posId === 'escape_mount') {
    const isHigh = posId === 'top_high_mount';
    const isEsc = posId === 'escape_mount';
    const lift = isEsc ? -8 : 0;
    const shiftX = isHigh ? -10 : 0;

    const bottom: FighterRig = {
      hip: { x: 12, y: -6 + lift },
      chest: { x: -24, y: -8 + lift * 0.4 + breath * 0.3 },
      neck: { x: -35, y: -9 },
      head: { x: -46, y: -12 },
      shoulderL: { x: -24, y: -13 + lift * 0.3 },
      elbowL: { x: -10, y: -20 + lift * 0.3 },
      handL: { x: -14, y: -24 + lift * 0.3 },
      shoulderR: { x: -20, y: -3 + lift * 0.3 },
      elbowR: { x: -4, y: -10 + lift * 0.3 },
      handR: { x: -10, y: -18 + lift * 0.3 },
      hipL: { x: 12, y: -8 + lift },
      kneeL: { x: 30, y: -16 },
      footL: { x: 44, y: 2 },
      hipR: { x: 16, y: -3 + lift },
      kneeR: { x: 36, y: -6 },
      footR: { x: 52, y: 6 },
      facing: 1,
      isSupine: true,
      zTorso: 2,
      zHead: 3,
      zArmL: 5,
      zArmR: 8,
      zLegL: 3,
      zLegR: 2
    };
    const top: FighterRig = {
      hip: { x: -2 + shiftX, y: -24 + lift + breath * 0.4 },
      chest: { x: -8 + shiftX, y: -54 + lift + breath * 0.8 },
      neck: { x: -12 + shiftX, y: -63 + lift + breath * 0.8 },
      head: { x: -15 + shiftX, y: -73 + lift + breath * 0.8 },
      shoulderL: { x: -16 + shiftX, y: -52 + lift },
      elbowL: { x: -26 + shiftX, y: -32 + lift },
      handL: { x: -30 + shiftX, y: -14 },
      shoulderR: { x: 2 + shiftX, y: -52 + lift },
      elbowR: { x: -6 + shiftX, y: -32 + lift },
      handR: { x: -16 + shiftX, y: -16 },
      hipL: { x: -8 + shiftX, y: -22 + lift },
      kneeL: { x: -10 + shiftX, y: 4 },
      footL: { x: 10 + shiftX, y: 6 },
      hipR: { x: 6 + shiftX, y: -22 + lift },
      kneeR: { x: 6 + shiftX, y: 10 },
      footR: { x: 26 + shiftX, y: 12 },
      facing: -1,
      zTorso: 6,
      zHead: 7,
      zArmL: 5,
      zArmR: 9,
      zLegL: 4,
      zLegR: 8
    };
    return assignTopBottom(top, bottom);
  }

  if (posId === 'top_back_control' || posId === 'def_back_control' || posId === 'escape_back_control') {
    const bottom: FighterRig = {
      hip: { x: 6, y: -8 + breath * 0.3 },
      chest: { x: 26, y: -28 + breath * 0.4 },
      neck: { x: 34, y: -36 + breath * 0.4 },
      head: { x: 42, y: -44 + breath * 0.4 },
      shoulderL: { x: 20, y: -30 },
      elbowL: { x: 28, y: -21 },
      handL: { x: 24, y: -32 },
      shoulderR: { x: 30, y: -24 },
      elbowR: { x: 36, y: -17 },
      handR: { x: 30, y: -29 },
      hipL: { x: 6, y: -10 },
      kneeL: { x: 26, y: -12 },
      footL: { x: 46, y: -2 },
      hipR: { x: 10, y: -4 },
      kneeR: { x: 32, y: -2 },
      footR: { x: 52, y: 6 },
      facing: 1,
      zTorso: 5,
      zHead: 6,
      zArmL: 6,
      zArmR: 8,
      zLegL: 5,
      zLegR: 6
    };
    const top: FighterRig = {
      hip: { x: -16, y: -8 + breath * 0.3 },
      chest: { x: 4, y: -30 + breath * 0.4 },
      neck: { x: 14, y: -38 + breath * 0.4 },
      head: { x: 22, y: -48 + breath * 0.4 },
      shoulderL: { x: 0, y: -34 },
      elbowL: { x: 18, y: -38 },
      handL: { x: 28, y: -31 },
      shoulderR: { x: 8, y: -24 },
      elbowR: { x: 22, y: -19 },
      handR: { x: 26, y: -27 },
      hipL: { x: -14, y: -12 },
      kneeL: { x: 6, y: -16 },
      footL: { x: 20, y: -6 },
      hipR: { x: -12, y: -4 },
      kneeR: { x: 10, y: -2 },
      footR: { x: 24, y: 4 },
      facing: 1,
      zTorso: 3,
      zHead: 4,
      zArmL: 9,
      zArmR: 4,
      zLegL: 8,
      zLegR: 3
    };
    return assignTopBottom(top, bottom, { x: 26, y: -30 });
  }

  if (posId === 'top_turtle_control' || posId === 'bottom_turtle') {
    const bottom: FighterRig = {
      hip: { x: 24, y: -18 + breath * 0.3 },
      chest: { x: -6, y: -20 + breath * 0.3 },
      neck: { x: -16, y: -18 },
      head: { x: -26, y: -15 },
      shoulderL: { x: -8, y: -20 },
      elbowL: { x: -10, y: -4 },
      handL: { x: -16, y: 2 },
      shoulderR: { x: -4, y: -16 },
      elbowR: { x: -4, y: 0 },
      handR: { x: -10, y: 6 },
      hipL: { x: 22, y: -18 },
      kneeL: { x: 12, y: 0 },
      footL: { x: 32, y: 2 },
      hipR: { x: 28, y: -16 },
      kneeR: { x: 20, y: 4 },
      footR: { x: 40, y: 6 },
      facing: -1,
      zTorso: 3,
      zHead: 4,
      zArmL: 2,
      zArmR: 5,
      zLegL: 2,
      zLegR: 4
    };
    const top: FighterRig = {
      hip: { x: 28, y: -36 + breath * 0.5 },
      chest: { x: 0, y: -42 + breath * 0.5 },
      neck: { x: -10, y: -45 },
      head: { x: -20, y: -50 },
      shoulderL: { x: -2, y: -44 },
      elbowL: { x: -12, y: -29 },
      handL: { x: -4, y: -18 },
      shoulderR: { x: 4, y: -37 },
      elbowR: { x: 12, y: -22 },
      handR: { x: 14, y: -14 },
      hipL: { x: 26, y: -34 },
      kneeL: { x: 16, y: -14 },
      footL: { x: 38, y: -2 },
      hipR: { x: 34, y: -32 },
      kneeR: { x: 34, y: 0 },
      footR: { x: 54, y: 6 },
      facing: -1,
      zTorso: 7,
      zHead: 8,
      zArmL: 6,
      zArmR: 9,
      zLegL: 6,
      zLegR: 8
    };
    return assignTopBottom(top, bottom);
  }

  // =========================================================================
  // D. FINALIZAÇÃO ENCAIXADA (def_submission)
  // =========================================================================
  if (posId === 'def_submission') {
    const subId = state.activeSubmissionThreat?.techniqueId || '';
    const isLegLock = subId.includes('foot') || subId.includes('ankle') || subId.includes('knee') || subId.includes('heel') || subId.includes('toe');
    const isArmbar = subId.includes('armlock') || subId.includes('armbar');
    const isTriangle = subId.includes('triangle');

    if (isLegLock) {
      const attacker: FighterRig = {
        hip: { x: -26, y: -6 },
        chest: { x: -50, y: -15 + breath * 0.3 },
        neck: { x: -58, y: -19 },
        head: { x: -66, y: -24 },
        shoulderL: { x: -48, y: -17 },
        elbowL: { x: -28, y: -24 },
        handL: { x: -6, y: -18 },
        shoulderR: { x: -42, y: -10 },
        elbowR: { x: -22, y: -15 },
        handR: { x: -4, y: -14 },
        hipL: { x: -24, y: -8 },
        kneeL: { x: 2, y: -19 },
        footL: { x: 18, y: -4 },
        hipR: { x: -22, y: -2 },
        kneeR: { x: 6, y: -4 },
        footR: { x: 0, y: 6 },
        facing: 1,
        isSupine: true,
        zTorso: 4,
        zHead: 5,
        zArmL: 7,
        zArmR: 9,
        zLegL: 8,
        zLegR: 3
      };
      const defender: FighterRig = {
        hip: { x: 28, y: -6 },
        chest: { x: 48, y: -18 + breath * 0.3 },
        neck: { x: 55, y: -24 },
        head: { x: 61, y: -31 },
        shoulderL: { x: 46, y: -20 },
        elbowL: { x: 30, y: -13 },
        handL: { x: 18, y: -15 },
        shoulderR: { x: 50, y: -14 },
        elbowR: { x: 34, y: -7 },
        handR: { x: 22, y: -11 },
        hipL: { x: 26, y: -8 },
        kneeL: { x: 10, y: -10 },
        footL: { x: -6, y: -16 },
        hipR: { x: 30, y: -2 },
        kneeR: { x: 46, y: 2 },
        footR: { x: 62, y: 6 },
        facing: -1,
        zTorso: 4,
        zHead: 5,
        zArmL: 4,
        zArmR: 7,
        zLegL: 6,
        zLegR: 5
      };
      return state.activeSubmissionThreat?.attacker === 'athlete_b'
        ? { a: defender, b: attacker, focalTarget: { x: -4, y: -16 } }
        : { a: attacker, b: defender, focalTarget: { x: -4, y: -16 } };
    }

    if (isArmbar || isTriangle) {
      const attacker: FighterRig = {
        hip: { x: -8, y: -6 },
        chest: { x: -36, y: -9 + breath * 0.3 },
        neck: { x: -46, y: -12 },
        head: { x: -56, y: -18 },
        shoulderL: { x: -34, y: -13 },
        elbowL: { x: -18, y: -22 },
        handL: { x: -2, y: -30 },
        shoulderR: { x: -30, y: -4 },
        elbowR: { x: -14, y: -15 },
        handR: { x: 2, y: -26 },
        hipL: { x: -6, y: -10 },
        kneeL: { x: 8, y: -34 },
        footL: { x: 24, y: -18 },
        hipR: { x: -4, y: -4 },
        kneeR: { x: 14, y: -18 },
        footR: { x: 28, y: -6 },
        facing: 1,
        isSupine: true,
        zTorso: 3,
        zHead: 4,
        zArmL: 8,
        zArmR: 9,
        zLegL: 9,
        zLegR: 2
      };
      const defender: FighterRig = {
        hip: { x: 28, y: -10 },
        chest: { x: 16, y: -32 + breath * 0.4 },
        neck: { x: 12, y: -39 },
        head: { x: 8, y: -47 },
        shoulderL: { x: 12, y: -30 },
        elbowL: { x: 4, y: -29 },
        handL: { x: -4, y: -30 },
        shoulderR: { x: 22, y: -29 },
        elbowR: { x: 12, y: -20 },
        handR: { x: 2, y: -24 },
        hipL: { x: 26, y: -8 },
        kneeL: { x: 34, y: 4 },
        footL: { x: 50, y: 6 },
        hipR: { x: 34, y: -8 },
        kneeR: { x: 44, y: 6 },
        footR: { x: 60, y: 8 },
        facing: -1,
        zTorso: 5,
        zHead: 6,
        zArmL: 7,
        zArmR: 8,
        zLegL: 4,
        zLegR: 6
      };
      return state.activeSubmissionThreat?.attacker === 'athlete_b'
        ? { a: defender, b: attacker, focalTarget: { x: -2, y: -28 } }
        : { a: attacker, b: defender, focalTarget: { x: -2, y: -28 } };
    }

    const attacker: FighterRig = {
      hip: { x: -10, y: -12 + breath * 0.3 },
      chest: { x: 4, y: -38 + breath * 0.5 },
      neck: { x: 10, y: -45 },
      head: { x: 16, y: -54 },
      shoulderL: { x: 0, y: -39 },
      elbowL: { x: 16, y: -38 },
      handL: { x: 28, y: -32 },
      shoulderR: { x: 10, y: -33 },
      elbowR: { x: 22, y: -26 },
      handR: { x: 30, y: -32 },
      hipL: { x: -12, y: -10 },
      kneeL: { x: -4, y: 4 },
      footL: { x: 14, y: 6 },
      hipR: { x: -2, y: -10 },
      kneeR: { x: 14, y: 2 },
      footR: { x: 30, y: 6 },
      facing: 1,
      zTorso: 6,
      zHead: 7,
      zArmL: 9,
      zArmR: 8,
      zLegL: 4,
      zLegR: 7
    };
    const defender: FighterRig = {
      hip: { x: 16, y: -8 },
      chest: { x: 26, y: -30 + breath * 0.3 },
      neck: { x: 30, y: -38 },
      head: { x: 34, y: -46 },
      shoulderL: { x: 22, y: -29 },
      elbowL: { x: 28, y: -20 },
      handL: { x: 28, y: -32 },
      shoulderR: { x: 30, y: -27 },
      elbowR: { x: 38, y: -18 },
      handR: { x: 32, y: -30 },
      hipL: { x: 16, y: -8 },
      kneeL: { x: 36, y: -6 },
      footL: { x: 52, y: 4 },
      hipR: { x: 20, y: -4 },
      kneeR: { x: 42, y: 2 },
      footR: { x: 58, y: 8 },
      facing: 1,
      zTorso: 4,
      zHead: 5,
      zArmL: 6,
      zArmR: 7,
      zLegL: 3,
      zLegR: 4
    };
    return state.activeSubmissionThreat?.attacker === 'athlete_b'
      ? { a: defender, b: attacker, focalTarget: { x: 28, y: -34 } }
      : { a: attacker, b: defender, focalTarget: { x: 28, y: -34 } };
  }

  // =========================================================================
  // E. SCRAMBLE & REVERSÃO
  // =========================================================================
  const topScramble: FighterRig = {
    hip: { x: -20 + scrambleJitter, y: -28 + breath * 0.6 },
    chest: { x: 4 + scrambleJitter, y: -38 + breath * 0.6 },
    neck: { x: 14, y: -42 },
    head: { x: 24, y: -47 },
    shoulderL: { x: 2, y: -38 },
    elbowL: { x: 8, y: -20 },
    handL: { x: 16, y: -13 },
    shoulderR: { x: 8, y: -34 },
    elbowR: { x: 22, y: -20 },
    handR: { x: 30, y: -15 },
    hipL: { x: -24, y: -26 },
    kneeL: { x: -16, y: -4 },
    footL: { x: -32, y: 4 },
    hipR: { x: -14, y: -26 },
    kneeR: { x: 2, y: -6 },
    footR: { x: -6, y: 6 },
    facing: 1,
    zTorso: 6,
    zHead: 7,
    zArmL: 5,
    zArmR: 8,
    zLegL: 4,
    zLegR: 7
  };
  const botScramble: FighterRig = {
    hip: { x: 26 - scrambleJitter, y: -12 },
    chest: { x: 2 - scrambleJitter, y: -15 + breath * 0.4 },
    neck: { x: -8, y: -17 },
    head: { x: -18, y: -21 },
    shoulderL: { x: 0, y: -15 },
    elbowL: { x: -8, y: -2 },
    handL: { x: -16, y: 4 },
    shoulderR: { x: 6, y: -11 },
    elbowR: { x: 14, y: 2 },
    handR: { x: 6, y: 6 },
    hipL: { x: 24, y: -12 },
    kneeL: { x: 34, y: 2 },
    footL: { x: 50, y: 4 },
    hipR: { x: 30, y: -10 },
    kneeR: { x: 42, y: 6 },
    footR: { x: 58, y: 8 },
    facing: -1,
    zTorso: 3,
    zHead: 4,
    zArmL: 2,
    zArmR: 5,
    zLegL: 3,
    zLegR: 4
  };
  return assignTopBottom(topScramble, botScramble, { x: 6, y: -20 });
}

// ===========================================================================
// PRIMITIVAS DE DESENHO CONTÍNUO (SEM LINHAS PRETAS NAS ARTICULAÇÕES)
// ===========================================================================

/**
 * Constrói uma curva suave de 2 segmentos (ombro->cotovelo->pulso ou quadril->joelho->tornozelo)
 * em forma de cápsula contínua e afilada, eliminando completamente linhas pretas internas nas juntas.
 */
function buildSmoothLimbPoints(p0: Pt, p1: Pt, p2: Pt, w0: number, w1: number, w2: number) {
  const steps = 8;
  const pts: { x: number; y: number; r: number }[] = [];

  // Curva quadrática suave passando próxima da articulação p1
  const qIn = lerpPt(p0, p1, 0.72);
  const qOut = lerpPt(p1, p2, 0.28);

  const sampleCurve = (u: number): Pt => {
    if (u < 0.28) {
      return lerpPt(p0, qIn, u / 0.28);
    } else if (u <= 0.72) {
      const k = (u - 0.28) / 0.44;
      const inv = 1 - k;
      return {
        x: inv * inv * qIn.x + 2 * inv * k * p1.x + k * k * qOut.x,
        y: inv * inv * qIn.y + 2 * inv * k * p1.y + k * k * qOut.y
      };
    } else {
      return lerpPt(qOut, p2, (u - 0.72) / 0.28);
    }
  };

  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const pt = sampleCurve(u);
    const w = u <= 0.5 ? lerp(w0, w1, u * 2) : lerp(w1, w2, (u - 0.5) * 2);
    pts.push({ x: pt.x, y: pt.y, r: w * 0.5 });
  }
  return pts;
}

function traceContinuousLimbPath(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number; r: number }[]
) {
  const leftSide: Pt[] = [];
  const rightSide: Pt[] = [];

  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.max(0.001, Math.hypot(dx, dy));
    const nx = -dy / len;
    const ny = dx / len;
    leftSide.push({ x: pts[i].x + nx * pts[i].r, y: pts[i].y + ny * pts[i].r });
    rightSide.push({ x: pts[i].x - nx * pts[i].r, y: pts[i].y - ny * pts[i].r });
  }

  const end = pts[pts.length - 1];
  const prevEnd = pts[pts.length - 2];
  const endAngle = Math.atan2(end.y - prevEnd.y, end.x - prevEnd.x);

  const start = pts[0];
  const nextStart = pts[1];
  const startAngle = Math.atan2(nextStart.y - start.y, nextStart.x - start.x);

  ctx.beginPath();
  ctx.moveTo(leftSide[0].x, leftSide[0].y);
  for (let i = 1; i < leftSide.length; i++) {
    ctx.lineTo(leftSide[i].x, leftSide[i].y);
  }
  ctx.arc(end.x, end.y, end.r, endAngle + Math.PI / 2, endAngle - Math.PI / 2, true);
  for (let i = rightSide.length - 1; i >= 0; i--) {
    ctx.lineTo(rightSide[i].x, rightSide[i].y);
  }
  ctx.arc(start.x, start.y, start.r, startAngle - Math.PI / 2, startAngle + Math.PI / 2, true);
  ctx.closePath();
}

function drawUnifiedLimb(
  ctx: CanvasRenderingContext2D,
  p0: Pt,
  p1: Pt,
  p2: Pt,
  w0: number,
  w1: number,
  w2: number,
  upperFill: string,
  lowerFill: string,
  shadeColor: string,
  contourColor: string,
  cuffColor?: string
) {
  const pts = buildSmoothLimbPoints(p0, p1, p2, w0, w1, w2);

  ctx.save();
  traceContinuousLimbPath(ctx, pts);

  // Preenchimento base (ou gradiente suave quando manga curta No-Gi transiciona para antebraço/perna)
  if (upperFill === lowerFill) {
    ctx.fillStyle = upperFill;
  } else {
    const grad = ctx.createLinearGradient(p0.x, p0.y, p2.x, p2.y);
    grad.addColorStop(0, upperFill);
    grad.addColorStop(0.45, upperFill);
    grad.addColorStop(0.49, lowerFill);
    grad.addColorStop(1, lowerFill);
    ctx.fillStyle = grad;
  }
  ctx.fill();

  // Sombra anatômica direcional interna (sem costuras pretas)
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.max(0.001, Math.hypot(dx, dy));
    const nx = -dy / len;
    const ny = dx / len;
    ctx.lineTo(pts[i].x - nx * (pts[i].r + 5), pts[i].y - ny * (pts[i].r + 5));
  }
  ctx.closePath();
  ctx.fillStyle = shadeColor;
  ctx.globalAlpha = 0.42;
  ctx.fill();

  // Detalhe discreto de punho / barra do quimono ou faixa do shorts
  if (cuffColor) {
    const end = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dx = end.x - prev.x;
    const dy = end.y - prev.y;
    const len = Math.max(0.001, Math.hypot(dx, dy));
    const nx = -dy / len;
    const ny = dx / len;
    const cx = lerp(prev.x, end.x, 0.55);
    const cy = lerp(prev.y, end.y, 0.55);
    ctx.strokeStyle = cuffColor;
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx + nx * (end.r + 2), cy + ny * (end.r + 2));
    ctx.lineTo(cx - nx * (end.r + 2), cy - ny * (end.r + 2));
    ctx.stroke();
  }
  ctx.restore();

  // Contorno externo sutil (harmonizado com a cor da peça, sem linhas pretas fortes)
  ctx.strokeStyle = contourColor;
  ctx.lineWidth = 1.15;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

function drawHandOrFoot(
  ctx: CanvasRenderingContext2D,
  pt: Pt,
  radius: number,
  skin: string,
  shade: string,
  contour: string,
  isFoot: boolean,
  facing: number
) {
  ctx.save();
  ctx.beginPath();
  if (isFoot) {
    ctx.ellipse(pt.x + facing * 2.2, pt.y, radius * 1.4, radius * 0.8, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
  }
  ctx.fillStyle = skin;
  ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.fillStyle = shade;
  ctx.globalAlpha = 0.48;
  ctx.beginPath();
  ctx.arc(pt.x + 1, pt.y + 1.8, radius * 1.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = contour;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawTorsoAndBelt(
  ctx: CanvasRenderingContext2D,
  rig: FighterRig,
  prof: AthleteVisualProfile,
  isGi: boolean
) {
  const dx = rig.chest.x - rig.hip.x;
  const dy = rig.chest.y - rig.hip.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len;
  const ny = dx / len;
  const ux = dx / len;
  const uy = dy / len;

  const wChest = (rig.torsoWidth ?? 25) * 0.56;
  const wHip = (rig.hipWidth ?? 19) * 0.54;

  const tl = { x: rig.chest.x + nx * wChest, y: rig.chest.y + ny * wChest };
  const tr = { x: rig.chest.x - nx * wChest, y: rig.chest.y - ny * wChest };
  const br = { x: rig.hip.x - nx * wHip, y: rig.hip.y - ny * wHip };
  const bl = { x: rig.hip.x + nx * wHip, y: rig.hip.y + ny * wHip };
  const skL = { x: bl.x + nx * 1.5 - ux * 6.5, y: bl.y + ny * 1.5 - uy * 6.5 };
  const skR = { x: br.x - nx * 1.5 - ux * 6.5, y: br.y - ny * 1.5 - uy * 6.5 };

  const torsoFill = isGi ? prof.giPrimary : prof.rashBase;
  const torsoShade = isGi ? prof.giShade : prof.rashShade;

  ctx.save();
  // Silhueta unificada de tronco + saia/cós (sem linha preta horizontal no meio da cintura!)
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.quadraticCurveTo(rig.chest.x + ux * 3, rig.chest.y + uy * 3, tr.x, tr.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(skR.x, skR.y);
  ctx.lineTo(skL.x, skL.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.closePath();

  ctx.fillStyle = torsoFill;
  ctx.fill();

  // Sombra cel-shaded e dobra de quimono / costura da rashguard
  ctx.save();
  ctx.clip();
  ctx.fillStyle = torsoShade;
  ctx.globalAlpha = 0.58;
  ctx.beginPath();
  ctx.moveTo(rig.chest.x + ux * 4, rig.chest.y + uy * 4);
  ctx.lineTo(tr.x + 3, tr.y);
  ctx.lineTo(skR.x + 3, skR.y);
  ctx.lineTo(rig.hip.x - ux * 7, rig.hip.y - uy * 7);
  ctx.closePath();
  ctx.fill();

  if (!isGi) {
    // Shorts sobre a parte inferior do quadril
    ctx.globalAlpha = 1;
    ctx.fillStyle = prof.shortsColor;
    ctx.beginPath();
    ctx.moveTo(bl.x - nx * 2, bl.y - ny * 2);
    ctx.lineTo(br.x + nx * 2, br.y + ny * 2);
    ctx.lineTo(skR.x + 3, skR.y + 3);
    ctx.lineTo(skL.x - 3, skL.y + 3);
    ctx.closePath();
    ctx.fill();
  }

  if (isGi) {
    // Lapela em V do Quimono em tom do próprio tecido (sem preto)
    const neckPt = lerpPt(rig.chest, rig.neck, 0.25);
    const lapelBottom = lerpPt(rig.hip, rig.chest, 0.22);
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = prof.giLapel;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(neckPt.x + nx * 5.5, neckPt.y + ny * 5.5);
    ctx.lineTo(lapelBottom.x + rig.facing * 2, lapelBottom.y);
    ctx.lineTo(neckPt.x - nx * 5.5, neckPt.y - ny * 5.5);
    ctx.stroke();

    ctx.strokeStyle = prof.giHighlight;
    ctx.lineWidth = 1.1;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
  } else {
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = prof.rankColorAccent;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y + 4);
    ctx.lineTo(rig.hip.x - nx * 2, rig.hip.y);
    ctx.stroke();
  }
  ctx.restore();

  // Contorno externo sutil do tronco
  ctx.strokeStyle = prof.giContour;
  ctx.lineWidth = 1.25;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Faixa de Jiu-Jitsu (Gi) ou Cós da Bermuda (No-Gi)
  const beltP1 = lerpPt(bl, tl, 0.12);
  const beltP2 = lerpPt(br, tr, 0.12);
  if (isGi) {
    ctx.strokeStyle = prof.giContour;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(beltP1.x, beltP1.y);
    ctx.lineTo(beltP2.x, beltP2.y);
    ctx.stroke();

    ctx.strokeStyle = prof.beltBg;
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(beltP1.x, beltP1.y);
    ctx.lineTo(beltP2.x, beltP2.y);
    ctx.stroke();

    // Ponteira da faixa e graus
    const knotPt = lerpPt(beltP1, beltP2, 0.5 + rig.facing * 0.14);
    const tailTip = { x: knotPt.x + rig.facing * 6.5, y: knotPt.y + 10 };

    ctx.strokeStyle = prof.giContour;
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(knotPt.x, knotPt.y);
    ctx.lineTo(tailTip.x, tailTip.y);
    ctx.stroke();

    ctx.strokeStyle = prof.beltBg;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(knotPt.x, knotPt.y);
    ctx.lineTo(tailTip.x, tailTip.y);
    ctx.stroke();

    const tipMid = lerpPt(knotPt, tailTip, 0.45);
    ctx.strokeStyle = prof.beltTipBg;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(tipMid.x, tipMid.y);
    ctx.lineTo(tailTip.x, tailTip.y);
    ctx.stroke();

    if (prof.stripes > 0) {
      for (let s = 0; s < Math.min(4, prof.stripes); s++) {
        const sp = lerpPt(tipMid, tailTip, 0.2 + s * 0.2);
        ctx.fillStyle = prof.beltStripeColor;
        ctx.fillRect(sp.x - 1.3, sp.y - 0.7, 2.6, 1.2);
      }
    }

    ctx.fillStyle = prof.beltBg;
    ctx.strokeStyle = prof.giContour;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(knotPt.x, knotPt.y, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.strokeStyle = prof.shortsAccent;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(beltP1.x, beltP1.y);
    ctx.lineTo(beltP2.x, beltP2.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawFighterHead(
  ctx: CanvasRenderingContext2D,
  rig: FighterRig,
  prof: AthleteVisualProfile,
  t: number,
  underSubDanger: boolean
) {
  const { x, y } = rig.head;
  const rx = 8.4;
  const ry = 9.8;

  ctx.save();
  // Pescoço curto e atlético conectado naturalmente aos ombros/trapézio
  const dxN = rig.head.x - rig.chest.x;
  const dyN = rig.head.y - rig.chest.y;
  const lenN = Math.max(1, Math.hypot(dxN, dyN));
  const nx = (-dyN / lenN) * 5.1;
  const ny = (dxN / lenN) * 5.1;

  ctx.fillStyle = prof.skinShade;
  ctx.beginPath();
  ctx.moveTo(rig.chest.x + nx * 1.15, rig.chest.y + ny * 1.15);
  ctx.lineTo(x + nx * 0.85, y + ny * 0.85);
  ctx.lineTo(x - nx * 0.85, y - ny * 0.85);
  ctx.lineTo(rig.chest.x - nx * 1.15, rig.chest.y - ny * 1.15);
  ctx.closePath();
  ctx.fill();

  // Cabeça oval anatômica
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = prof.skinBase;
  ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.fillStyle = prof.skinShade;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(x - rig.facing * 3.5, y + 2.5, ry * 0.95, 0, Math.PI * 2);
  ctx.fill();

  // Cabelo
  ctx.globalAlpha = 1;
  ctx.fillStyle = prof.hairColor;
  ctx.beginPath();
  ctx.arc(x - rig.facing * 1.2, y - 3.6, rx * 1.02, Math.PI * 0.88, Math.PI * 2.15);
  ctx.fill();

  if (prof.hasBeard) {
    ctx.fillStyle = prof.hairColor;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.arc(x + rig.facing * 1.2, y + 4.5, rx * 0.65, 0, Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // Contorno facial suave
  ctx.strokeStyle = prof.skinContour;
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Orelha
  ctx.fillStyle = prof.skinShade;
  ctx.beginPath();
  ctx.arc(x - rig.facing * 6.2, y + 1, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Olho e sobrancelha sutis
  const eyeX = x + rig.facing * 3.8;
  const eyeY = y - 0.5;
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, 1.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(eyeX - 2.2, eyeY - 2.6);
  ctx.lineTo(eyeX + 2.2, eyeY - (underSubDanger ? 1.2 : 2));
  ctx.stroke();

  if (prof.fatigue > 45 || underSubDanger) {
    const dropOffset = (t * 8) % 7;
    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.arc(x - rig.facing * 2, y - 5 + dropOffset, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function buildFighterRenderPieces(
  ctx: CanvasRenderingContext2D,
  rig: FighterRig,
  prof: AthleteVisualProfile,
  isGi: boolean,
  t: number,
  underSubDanger: boolean,
  isForegroundRole: boolean
): RenderPiece[] {
  const pieces: RenderPiece[] = [];

  const armUpper = isGi ? prof.giPrimary : prof.rankColorAccent;
  const armLower = isGi ? prof.giPrimary : prof.skinBase;
  const armShade = isGi ? prof.giShade : prof.skinShade;
  const armContour = isGi ? prof.giContour : prof.skinContour;
  const armCuff = isGi ? prof.giHighlight : prof.rashBase;

  const legUpper = isGi ? prof.pantsPrimary : prof.shortsColor;
  const legLower = isGi ? prof.pantsPrimary : prof.skinBase;
  const legShade = isGi ? prof.pantsShade : prof.skinShade;
  const legContour = isGi ? prof.giContour : prof.skinContour;
  const legCuff = isGi ? prof.giHighlight : prof.shortsAccent;

  const wrapWithOverlapShadow = (castShadow: boolean, drawFn: () => void) => {
    if (castShadow) {
      ctx.save();
      ctx.shadowColor = 'rgba(2, 6, 23, 0.45)';
      ctx.shadowBlur = 7;
      ctx.shadowOffsetX = 1.5;
      ctx.shadowOffsetY = 2.5;
      drawFn();
      ctx.restore();
    } else {
      drawFn();
    }
  };

  // Perna Esquerda contínua (quadril -> joelho -> tornozelo)
  pieces.push({
    z: rig.zLegL,
    castOverlapShadow: isForegroundRole || rig.zLegL >= 7,
    draw: () =>
      wrapWithOverlapShadow(isForegroundRole || rig.zLegL >= 7, () => {
        drawUnifiedLimb(ctx, rig.hipL, rig.kneeL, rig.footL, 14.5, 11.2, 8.2, legUpper, legLower, legShade, legContour, legCuff);
        drawHandOrFoot(ctx, rig.footL, 4.2, prof.skinBase, prof.skinShade, prof.skinContour, true, rig.facing);
      })
  });

  // Perna Direita contínua
  pieces.push({
    z: rig.zLegR,
    castOverlapShadow: isForegroundRole || rig.zLegR >= 7,
    draw: () =>
      wrapWithOverlapShadow(isForegroundRole || rig.zLegR >= 7, () => {
        drawUnifiedLimb(ctx, rig.hipR, rig.kneeR, rig.footR, 14.5, 11.2, 8.2, legUpper, legLower, legShade, legContour, legCuff);
        drawHandOrFoot(ctx, rig.footR, 4.2, prof.skinBase, prof.skinShade, prof.skinContour, true, rig.facing);
      })
  });

  // Tronco & Faixa
  pieces.push({
    z: rig.zTorso,
    castOverlapShadow: isForegroundRole,
    draw: () =>
      wrapWithOverlapShadow(isForegroundRole, () => {
        drawTorsoAndBelt(ctx, rig, prof, isGi);
      })
  });

  // Cabeça
  pieces.push({
    z: rig.zHead,
    castOverlapShadow: isForegroundRole,
    draw: () =>
      wrapWithOverlapShadow(isForegroundRole, () => {
        drawFighterHead(ctx, rig, prof, t, underSubDanger);
      })
  });

  // Braço Esquerdo contínuo (ombro -> cotovelo -> pulso)
  pieces.push({
    z: rig.zArmL,
    castOverlapShadow: isForegroundRole || rig.zArmL >= 7,
    draw: () =>
      wrapWithOverlapShadow(isForegroundRole || rig.zArmL >= 7, () => {
        drawUnifiedLimb(ctx, rig.shoulderL, rig.elbowL, rig.handL, 10.6, 8.6, 6.6, armUpper, armLower, armShade, armContour, armCuff);
        drawHandOrFoot(ctx, rig.handL, 3.6, prof.skinBase, prof.skinShade, prof.skinContour, false, rig.facing);
      })
  });

  // Braço Direito contínuo
  pieces.push({
    z: rig.zArmR,
    castOverlapShadow: isForegroundRole || rig.zArmR >= 7,
    draw: () =>
      wrapWithOverlapShadow(isForegroundRole || rig.zArmR >= 7, () => {
        drawUnifiedLimb(ctx, rig.shoulderR, rig.elbowR, rig.handR, 10.6, 8.6, 6.6, armUpper, armLower, armShade, armContour, armCuff);
        drawHandOrFoot(ctx, rig.handR, 3.6, prof.skinBase, prof.skinShade, prof.skinContour, false, rig.facing);
      })
  });

  return pieces;
}

// ===========================================================================
// COMPONENTE PRINCIPAL DO CANVAS DA ARENA BJJ
// ===========================================================================

export const BjjIsometricCanvas: React.FC<BjjIsometricCanvasProps> = ({
  state,
  isGi = true,
  isRolling = false,
  onMatClick,
  lastFeedbackText
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  const stateRef = useRef<BjjMatchState>(state);
  const isGiRef = useRef<boolean>(isGi);
  const isRollingRef = useRef<boolean>(isRolling);
  const feedbackRef = useRef<string | null | undefined>(lastFeedbackText);

  const smoothPoseRef = useRef<PosePair | null>(null);
  const lastCycleCountRef = useRef<number>(state.history.length);
  const impactWaveRef = useRef<{ bornAt: number; color: string } | null>(null);
  const scorePopupRef = useRef<ScorePopup | null>(null);

  useEffect(() => {
    stateRef.current = state;
    isGiRef.current = isGi;
    isRollingRef.current = isRolling;
    feedbackRef.current = lastFeedbackText;

    if (state.history.length > lastCycleCountRef.current) {
      lastCycleCountRef.current = state.history.length;
      const lastRec = state.history[state.history.length - 1];
      if (lastRec) {
        if (lastRec.pointsAwardedA > 0) {
          scorePopupRef.current = {
            text: `+${lastRec.pointsAwardedA} PTS`,
            subtext: `${state.athleteA.nickname || state.athleteA.name}`,
            color: '#60a5fa',
            bornAt: performance.now()
          };
          impactWaveRef.current = { bornAt: performance.now(), color: '#3b82f6' };
        } else if (lastRec.pointsAwardedB > 0) {
          scorePopupRef.current = {
            text: `+${lastRec.pointsAwardedB} PTS`,
            subtext: `${state.athleteB.nickname || state.athleteB.name}`,
            color: '#f8fafc',
            bornAt: performance.now()
          };
          impactWaveRef.current = { bornAt: performance.now(), color: '#eab308' };
        } else if (lastRec.advantageAwardedA || lastRec.advantageAwardedB) {
          scorePopupRef.current = {
            text: 'VANTAGEM',
            subtext: lastRec.advantageAwardedA ? 'Córner Azul' : 'Córner Branco',
            color: '#facc15',
            bornAt: performance.now()
          };
          impactWaveRef.current = { bornAt: performance.now(), color: '#facc15' };
        } else if (lastRec.positionBefore !== lastRec.positionAfter) {
          impactWaveRef.current = { bornAt: performance.now(), color: '#38bdf8' };
        }
      }
    } else if (state.history.length === 0) {
      lastCycleCountRef.current = 0;
      scorePopupRef.current = null;
      impactWaveRef.current = null;
    }
  }, [state, isGi, isRolling, lastFeedbackText]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const LOGICAL_W = 960;
    const LOGICAL_H = 520;
    const dpr = Math.min(2.5, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
    canvas.width = Math.round(LOGICAL_W * dpr);
    canvas.height = Math.round(LOGICAL_H * dpr);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const render = () => {
      timeRef.current += 0.035;
      const t = timeRef.current;
      const st = stateRef.current;
      const giMode = isGiRef.current;
      const rollingNow = isRollingRef.current;
      const nowMs = performance.now();

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const width = LOGICAL_W;
      const height = LOGICAL_H;
      const cx = width / 2;
      const cy = height / 2 + 52;
      const isComp = st.matchType === 'competicao';

      const toIso = (x: number, y: number, z: number = 0) => ({
        x: (x - y) * 33 + cx,
        y: (x + y) * 16.5 - z + cy
      });

      // =====================================================================
      // 1. CENÁRIO DO GINÁSIO / ARENA DE CAMPEONATO
      // =====================================================================
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (isComp) {
        bgGrad.addColorStop(0, '#05070c');
        bgGrad.addColorStop(0.55, '#0b101b');
        bgGrad.addColorStop(1, '#07090e');
      } else {
        bgGrad.addColorStop(0, '#0a0908');
        bgGrad.addColorStop(0.55, '#151210');
        bgGrad.addColorStop(1, '#09090b');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      if (isComp) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.fillRect(0, 55, width, 130);
        for (let row = 0; row < 4; row++) {
          const ry = 76 + row * 24;
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, ry);
          ctx.lineTo(width, ry);
          ctx.stroke();

          ctx.fillStyle = row % 2 === 0 ? '#111827' : '#0f172a';
          for (let sx = 12 + row * 9; sx < width; sx += 22) {
            ctx.beginPath();
            ctx.arc(sx, ry - 6, 5.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(sx - 6, ry - 1, 12, 10);
          }
        }

        if (Math.sin(t * 7.3) > 0.92) {
          const fx = ((Math.sin(t * 19.1) * 0.5 + 0.5) * 0.8 + 0.1) * width;
          const fy = 82 + ((Math.cos(t * 11.7) * 0.5 + 0.5) * 55);
          const flash = ctx.createRadialGradient(fx, fy, 1, fx, fy, 18);
          flash.addColorStop(0, 'rgba(255,255,255,0.95)');
          flash.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = flash;
          ctx.fillRect(fx - 20, fy - 20, 40, 40);
        }

        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, width, 34);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 34);
        ctx.lineTo(width, 34);
        ctx.stroke();

        [180, 360, 600, 780].forEach((lx) => {
          ctx.fillStyle = '#334155';
          ctx.fillRect(lx - 12, 22, 24, 14);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(lx - 8, 34, 16, 4);

          const beam = ctx.createLinearGradient(lx, 36, cx, cy);
          beam.addColorStop(0, 'rgba(254, 240, 138, 0.12)');
          beam.addColorStop(0.6, 'rgba(96, 165, 250, 0.05)');
          beam.addColorStop(1, 'rgba(96, 165, 250, 0)');
          ctx.fillStyle = beam;
          ctx.beginPath();
          ctx.moveTo(lx - 10, 36);
          ctx.lineTo(lx + 10, 36);
          ctx.lineTo(cx + 150, cy + 40);
          ctx.lineTo(cx - 150, cy + 40);
          ctx.closePath();
          ctx.fill();
        });
      } else {
        ctx.fillStyle = '#171412';
        ctx.fillRect(0, 26, width, 160);
        ctx.strokeStyle = 'rgba(120, 82, 48, 0.25)';
        ctx.lineWidth = 2;
        for (let wx = 16; wx < width; wx += 28) {
          ctx.beginPath();
          ctx.moveTo(wx, 32);
          ctx.lineTo(wx, 180);
          ctx.stroke();
        }
        ctx.fillStyle = '#1c1917';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;
        ctx.fillRect(cx - 76, 48, 152, 62);
        ctx.strokeRect(cx - 76, 48, 152, 62);
        ctx.fillStyle = '#d97706';
        ctx.font = '700 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ARTE SUAVE • TATAME', cx, 75);
        ctx.fillStyle = '#a8a29e';
        ctx.font = '600 9px monospace';
        ctx.fillText(giMode ? 'TREINO DE QUIMONO (GI)' : 'SUBMISSION GRAPPLING (NO-GI)', cx, 94);

        const warmGlow = ctx.createRadialGradient(cx, 120, 40, cx, cy, 380);
        warmGlow.addColorStop(0, 'rgba(251, 191, 36, 0.08)');
        warmGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = warmGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // =====================================================================
      // 2. TATAME 3D ISOMÉTRICO EVA
      // =====================================================================
      const gridSize = 6;
      const cNorth = toIso(-gridSize, -gridSize, 0);
      const cEast = toIso(gridSize + 1, -gridSize, 0);
      const cSouth = toIso(gridSize + 1, gridSize + 1, 0);
      const cWest = toIso(-gridSize, gridSize + 1, 0);

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.moveTo(cNorth.x, cNorth.y + 18);
      ctx.lineTo(cEast.x + 12, cEast.y + 20);
      ctx.lineTo(cSouth.x, cSouth.y + 26);
      ctx.lineTo(cWest.x - 12, cWest.y + 20);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      for (let y = -gridSize; y <= gridSize; y++) {
        for (let x = -gridSize; x <= gridSize; x++) {
          const p1 = toIso(x, y, 0);
          const p2 = toIso(x + 1, y, 0);
          const p3 = toIso(x + 1, y + 1, 0);
          const p4 = toIso(x, y + 1, 0);

          const maxDist = Math.max(Math.abs(x), Math.abs(y));
          const isAlt = (x + y) % 2 === 0;

          let tileFill: string;
          let tileBorder: string;
          if (maxDist === gridSize || maxDist === gridSize - 1) {
            tileFill = giMode ? (isAlt ? '#1d4ed8' : '#1e40af') : (isAlt ? '#0f172a' : '#1e293b');
            tileBorder = giMode ? '#1e3a8a' : '#090d16';
          } else if (maxDist === gridSize - 2) {
            tileFill = isAlt ? '#dc2626' : '#b91c1c';
            tileBorder = '#991b1b';
          } else {
            tileFill = giMode
              ? isAlt ? '#facc15' : '#eab308'
              : isAlt ? '#334155' : '#293548';
            tileBorder = giMode ? '#ca8a04' : '#1e293b';
          }

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.closePath();
          ctx.fillStyle = tileFill;
          ctx.fill();
          ctx.strokeStyle = tileBorder;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      }

      if (isComp) {
        const drawBackBanner = (pA: Pt, pB: Pt, label: string, bg: string, accent: string) => {
          const h = 24;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(pA.x, pA.y);
          ctx.lineTo(pB.x, pB.y);
          ctx.lineTo(pB.x, pB.y - h);
          ctx.lineTo(pA.x, pA.y - h);
          ctx.closePath();
          ctx.fillStyle = bg;
          ctx.fill();
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1.6;
          ctx.stroke();

          const midX = (pA.x + pB.x) / 2;
          const midY = (pA.y + pB.y) / 2 - h / 2 + 3;
          const angle = Math.atan2(pB.y - pA.y, pB.x - pA.x);
          ctx.translate(midX, midY);
          ctx.rotate(angle);
          ctx.fillStyle = '#f8fafc';
          ctx.font = '900 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(label, 0, 0);
          ctx.restore();
        };

        drawBackBanner(cWest, cNorth, st.tournamentContext?.organization?.toUpperCase() || 'CAMPEONATO OFICIAL CBJJ', '#0f172a', '#eab308');
        drawBackBanner(cNorth, cEast, giMode ? 'JIU-JITSU BRASILEIRO • GI' : 'NO-GI SUBMISSION ARENA', '#172554', '#3b82f6');
      }

      const centerIso = toIso(0.5, 0.5, 0);
      ctx.save();
      ctx.translate(centerIso.x, centerIso.y);
      ctx.scale(1, 0.5);

      ctx.strokeStyle = giMode ? 'rgba(15, 23, 42, 0.25)' : 'rgba(148, 163, 184, 0.22)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, 96, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = giMode ? 'rgba(255, 255, 255, 0.24)' : 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, 62, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const lineBlueA = toIso(-0.8, 0.1, 0);
      const lineBlueB = toIso(-0.8, 0.9, 0);
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lineBlueA.x, lineBlueA.y);
      ctx.lineTo(lineBlueB.x, lineBlueB.y);
      ctx.stroke();

      const lineWhiteA = toIso(1.8, 0.1, 0);
      const lineWhiteB = toIso(1.8, 0.9, 0);
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lineWhiteA.x, lineWhiteA.y);
      ctx.lineTo(lineWhiteB.x, lineWhiteB.y);
      ctx.stroke();

      const matSpot = ctx.createRadialGradient(centerIso.x, centerIso.y, 15, centerIso.x, centerIso.y, 260);
      matSpot.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
      matSpot.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = matSpot;
      ctx.beginPath();
      ctx.ellipse(centerIso.x, centerIso.y, 260, 130, 0, 0, Math.PI * 2);
      ctx.fill();

      const edgeDepth = 12;
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(cSouth.x, cSouth.y);
      ctx.lineTo(cEast.x, cEast.y);
      ctx.lineTo(cEast.x, cEast.y + edgeDepth);
      ctx.lineTo(cSouth.x, cSouth.y + edgeDepth);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(cSouth.x, cSouth.y);
      ctx.lineTo(cWest.x, cWest.y);
      ctx.lineTo(cWest.x, cWest.y + edgeDepth);
      ctx.lineTo(cSouth.x, cSouth.y + edgeDepth);
      ctx.closePath();
      ctx.fill();

      if (impactWaveRef.current) {
        const elapsed = (nowMs - impactWaveRef.current.bornAt) / 650;
        if (elapsed < 1) {
          ctx.save();
          ctx.translate(centerIso.x, centerIso.y);
          ctx.scale(1, 0.5);
          ctx.strokeStyle = impactWaveRef.current.color;
          ctx.globalAlpha = (1 - elapsed) * 0.65;
          ctx.lineWidth = 3.5 * (1 - elapsed) + 1;
          ctx.beginPath();
          ctx.arc(0, 0, 28 + elapsed * 128, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          impactWaveRef.current = null;
        }
      }

      // =====================================================================
      // 3. ÁRBITRO OFICIAL CBJJ (PROPORCIONAL & SEM LINHAS PRETAS NAS JUNTAS)
      // =====================================================================
      const refPos = toIso(-3.4, -3.1, 0);
      const lastRec = st.history[st.history.length - 1];
      const refSignalLeft = lastRec && (lastRec.pointsAwardedA > 0 || lastRec.advantageAwardedA || st.winner === 'athlete_a');
      const refSignalRight = lastRec && (lastRec.pointsAwardedB > 0 || lastRec.advantageAwardedB || st.winner === 'athlete_b');

      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(refPos.x, refPos.y + 2, 15, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      const refBreath = Math.sin(t * 2) * 0.9;
      const refRaiseL = refSignalLeft ? -28 : 0;
      const refRaiseR = refSignalRight ? -28 : 0;

      drawUnifiedLimb(ctx, { x: refPos.x - 4.5, y: refPos.y - 30 }, { x: refPos.x - 5.5, y: refPos.y - 14 }, { x: refPos.x - 6, y: refPos.y }, 7.5, 6.5, 5.5, '#1e293b', '#1e293b', '#0f172a', 'rgba(15, 23, 42, 0.45)');
      drawUnifiedLimb(ctx, { x: refPos.x + 4.5, y: refPos.y - 30 }, { x: refPos.x + 5.5, y: refPos.y - 14 }, { x: refPos.x + 6, y: refPos.y }, 7.5, 6.5, 5.5, '#1e293b', '#1e293b', '#0f172a', 'rgba(15, 23, 42, 0.45)');

      const refShirt = isComp ? '#111827' : '#f1f5f9';
      const refShirtShade = isComp ? '#090d16' : '#cbd5e1';
      drawUnifiedLimb(
        ctx,
        { x: refPos.x - 9, y: refPos.y - 52 + refBreath },
        { x: refPos.x - 13, y: refPos.y - 42 + refRaiseL * 0.5 },
        { x: refPos.x - 15, y: refPos.y - 32 + refRaiseL },
        6, 5, 4.4, refShirt, refShirt, refShirtShade, 'rgba(30, 41, 59, 0.4)', '#2563eb'
      );
      drawUnifiedLimb(
        ctx,
        { x: refPos.x + 9, y: refPos.y - 52 + refBreath },
        { x: refPos.x + 13, y: refPos.y - 42 + refRaiseR * 0.5 },
        { x: refPos.x + 15, y: refPos.y - 32 + refRaiseR },
        6, 5, 4.4, refShirt, refShirt, refShirtShade, 'rgba(30, 41, 59, 0.4)', '#eab308'
      );

      ctx.fillStyle = refShirt;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.roundRect(refPos.x - 9, refPos.y - 55 + refBreath, 18, 26, 4);
      ctx.fill();
      ctx.stroke();

      if (!isComp) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(refPos.x - 5, refPos.y - 54 + refBreath, 2.5, 24);
        ctx.fillRect(refPos.x + 2.5, refPos.y - 54 + refBreath, 2.5, 24);
      } else {
        ctx.fillStyle = '#eab308';
        ctx.fillRect(refPos.x - 1.5, refPos.y - 53 + refBreath, 3, 12);
      }

      ctx.fillStyle = '#e3a680';
      ctx.beginPath();
      ctx.ellipse(refPos.x, refPos.y - 63 + refBreath, 5.8, 6.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(refPos.x, refPos.y - 65 + refBreath, 5.8, Math.PI, Math.PI * 2);
      ctx.fill();

      if (refSignalLeft || refSignalRight) {
        const badgeTxt =
          st.status === 'finalizada'
            ? 'FIM!'
            : lastRec.pointsAwardedA || lastRec.pointsAwardedB
            ? `+${lastRec.pointsAwardedA || lastRec.pointsAwardedB} PTS`
            : 'VANTAGEM';
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = refSignalLeft ? '#3b82f6' : '#eab308';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(refPos.x - 28, refPos.y - 90, 56, 18, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.font = '800 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(badgeTxt, refPos.x, refPos.y - 78);
      }

      // =====================================================================
      // 4. LUTADORES COM PROPORÇÕES ATLÉTICAS & SOBREPOSIÇÃO NÍTIDA
      // =====================================================================
      const targetPair = buildPoseForState(st, t, rollingNow);
      if (!smoothPoseRef.current) {
        smoothPoseRef.current = targetPair;
      } else {
        smoothPoseRef.current = {
          a: lerpRig(smoothPoseRef.current.a, targetPair.a, 0.22),
          b: lerpRig(smoothPoseRef.current.b, targetPair.b, 0.22),
          focalTarget: targetPair.focalTarget
        };
      }

      const scale = 1.38;
      const mapRig = (r: FighterRig): FighterRig => {
        const m = (p: Pt): Pt => ({ x: centerIso.x + p.x * scale, y: centerIso.y - 5 + p.y * scale });
        const mappedChest = m(r.chest);
        const rawHead = m(r.head);
        const hdx = rawHead.x - mappedChest.x;
        const hdy = rawHead.y - mappedChest.y;
        const hlen = Math.hypot(hdx, hdy);
        const targetHeadDist = hlen > 0.1 ? Math.min(15.2, Math.max(12.2, hlen * 0.58)) : 14;
        const mappedHead = hlen > 0.1
          ? {
              x: mappedChest.x + (hdx / hlen) * targetHeadDist,
              y: mappedChest.y + (hdy / hlen) * targetHeadDist
            }
          : rawHead;
        const mappedNeck = lerpPt(mappedChest, mappedHead, 0.55);

        return {
          ...r,
          hip: m(r.hip),
          chest: mappedChest,
          neck: mappedNeck,
          head: mappedHead,
          shoulderL: m(r.shoulderL),
          elbowL: m(r.elbowL),
          handL: m(r.handL),
          shoulderR: m(r.shoulderR),
          elbowR: m(r.elbowR),
          handR: m(r.handR),
          hipL: m(r.hipL),
          kneeL: m(r.kneeL),
          footL: m(r.footL),
          hipR: m(r.hipR),
          kneeR: m(r.kneeR),
          footR: m(r.footR),
          torsoWidth: (r.torsoWidth ?? 25) * scale * 0.78,
          hipWidth: (r.hipWidth ?? 19) * scale * 0.78
        };
      };

      const rigA = mapRig(smoothPoseRef.current.a);
      const rigB = mapRig(smoothPoseRef.current.b);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      ctx.beginPath();
      ctx.ellipse(rigA.hip.x, centerIso.y + 4, 46, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rigB.hip.x, centerIso.y + 4, 46, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      const profA = createAthleteProfile(
        'athlete_a',
        st.athleteA.beltRankIndex,
        st.athleteA.beltName,
        st.athleteA.accumulatedFatigue,
        st.athleteA.isPlayer
      );
      const profB = createAthleteProfile(
        'athlete_b',
        st.athleteB.beltRankIndex,
        st.athleteB.beltName,
        st.athleteB.accumulatedFatigue,
        st.athleteB.isPlayer
      );

      const aInDanger = st.activeSubmissionThreat?.defender === 'athlete_a';
      const bInDanger = st.activeSubmissionThreat?.defender === 'athlete_b';

      const isAForeground = st.athleteTop === 'athlete_a' || (st.athleteTop === 'none' && st.controllingAthlete === 'athlete_a');
      const isBForeground = st.athleteTop === 'athlete_b' || (st.athleteTop === 'none' && st.controllingAthlete === 'athlete_b');

      const allPieces: RenderPiece[] = [
        ...buildFighterRenderPieces(ctx, rigA, profA, giMode, t, Boolean(aInDanger), isAForeground),
        ...buildFighterRenderPieces(ctx, rigB, profB, giMode, t, Boolean(bInDanger), isBForeground)
      ].sort((p1, p2) => p1.z - p2.z);

      for (const piece of allPieces) {
        piece.draw();
      }

      const drawNameTag = (rig: FighterRig, label: string, cornerColor: string) => {
        const tx = rig.head.x;
        const ty = Math.min(rig.head.y, rig.chest.y) - 22;
        ctx.save();
        ctx.font = '800 10px sans-serif';
        const w = Math.max(58, ctx.measureText(label).width + 16);
        ctx.fillStyle = 'rgba(9, 9, 11, 0.84)';
        ctx.strokeStyle = cornerColor;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(tx - w / 2, ty - 11, w, 17, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(label, tx, ty + 1);
        ctx.restore();
      };

      drawNameTag(rigA, st.athleteA.nickname || st.athleteA.name.split(' ')[0], '#3b82f6');
      drawNameTag(rigB, st.athleteB.nickname || st.athleteB.name.split(' ')[0], '#e2e8f0');

      // =====================================================================
      // 5. INDICADORES TÁTICOS
      // =====================================================================
      if (st.activeGrips !== 'nenhuma' && st.status === 'em_andamento') {
        const gripPt = smoothPoseRef.current.focalTarget
          ? {
              x: centerIso.x + smoothPoseRef.current.focalTarget.x * scale,
              y: centerIso.y - 5 + smoothPoseRef.current.focalTarget.y * scale
            }
          : { x: (rigA.handR.x + rigB.handL.x) / 2, y: (rigA.handR.y + rigB.handL.y) / 2 };

        ctx.save();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(rigA.handR.x, rigA.handR.y);
        ctx.lineTo(gripPt.x, gripPt.y);
        ctx.lineTo(rigB.handL.x, rigB.handL.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
        ctx.beginPath();
        ctx.arc(gripPt.x, gripPt.y, 3.2 + Math.sin(t * 6) * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (st.activeSubmissionThreat) {
        const threat = st.activeSubmissionThreat;
        const lockPt = smoothPoseRef.current.focalTarget
          ? {
              x: centerIso.x + smoothPoseRef.current.focalTarget.x * scale,
              y: centerIso.y - 5 + smoothPoseRef.current.focalTarget.y * scale
            }
          : { x: centerIso.x, y: centerIso.y - 34 };

        const pulse = Math.sin(t * 9) * 0.25 + 0.75;
        ctx.save();
        ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(lockPt.x, lockPt.y, 24 + Math.sin(t * 10) * 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(248, 113, 113, 0.35)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(lockPt.x, lockPt.y, 33, 0, (Math.min(5, threat.dangerLevel) / 5) * Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(127, 29, 29, 0.92)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(centerIso.x - 108, centerIso.y - 165, 216, 24, 7);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fecaca';
        ctx.font = '900 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`FINALIZACAO ENCAIXADA • NIVEL ${threat.dangerLevel}/5`, centerIso.x, centerIso.y - 149);
        ctx.restore();
      }

      if (st.currentPositionId !== 'stand_neutral' && st.status === 'em_andamento') {
        const barW = 148;
        const bx = centerIso.x - barW / 2;
        const by = centerIso.y + 52;

        ctx.save();
        if (!st.isPointsStabilized && st.positionDurationSeconds > 0) {
          const prog = Math.min(1, st.positionDurationSeconds / 3);
          ctx.fillStyle = 'rgba(9, 9, 11, 0.86)';
          ctx.strokeStyle = '#52525b';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(bx - 8, by - 16, barW + 16, 26, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#fde047';
          ctx.font = '700 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`ESTABILIZANDO CBJJ (${(3 - st.positionDurationSeconds).toFixed(1)}s)`, centerIso.x, by - 4);

          ctx.fillStyle = '#27272a';
          ctx.fillRect(bx, by, barW, 5);
          ctx.fillStyle = '#eab308';
          ctx.fillRect(bx, by, barW * prog, 5);
        } else if (st.isPointsStabilized) {
          ctx.fillStyle = 'rgba(6, 78, 59, 0.88)';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(bx, by - 10, barW, 18, 5);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#a7f3d0';
          ctx.font = '800 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('POSICAO ESTABILIZADA (CBJJ)', centerIso.x, by + 2);
        }
        ctx.restore();
      }

      if (scorePopupRef.current) {
        const age = (nowMs - scorePopupRef.current.bornAt) / 1700;
        if (age < 1) {
          const py = centerIso.y - 110 - age * 36;
          ctx.save();
          ctx.globalAlpha = age < 0.7 ? 1 : (1 - age) / 0.3;
          ctx.fillStyle = 'rgba(9, 9, 11, 0.9)';
          ctx.strokeStyle = scorePopupRef.current.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(centerIso.x - 68, py - 18, 136, 30, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = scorePopupRef.current.color;
          ctx.font = '900 13px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(scorePopupRef.current.text, centerIso.x, py - 2);

          ctx.fillStyle = '#e4e4e7';
          ctx.font = '700 9px sans-serif';
          ctx.fillText(scorePopupRef.current.subtext, centerIso.x, py + 9);
          ctx.restore();
        } else {
          scorePopupRef.current = null;
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const currentPos = BJJ_POSITIONS_CATALOG[state.currentPositionId] || BJJ_POSITIONS_CATALOG.stand_neutral;
  const stabilityLabels: Record<string, string> = {
    muito_baixa: 'Instável',
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
    muito_alta: 'Dominante'
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-neutral-900/95 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold uppercase text-[10px] tracking-wider">
            {currentPos.category.replace(/_/g, ' ')}
          </span>
          <span className="font-bold text-white tracking-tight text-sm">
            {currentPos.name}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-neutral-400">
            Pegadas:{' '}
            <strong className="text-amber-300 uppercase">
              {state.activeGrips.replace(/_/g, ' ')}
            </strong>
          </span>
          <span className="text-neutral-600">|</span>
          <span className="text-neutral-400">
            Retenção:{' '}
            <strong className="text-neutral-200 uppercase">
              {stabilityLabels[state.stability] || state.stability}
            </strong>
          </span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onClick={onMatClick}
        className="w-full h-auto max-h-[480px] aspect-[960/520] object-contain block bg-neutral-950 cursor-pointer"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-neutral-950 border-t border-neutral-800/80 text-[11px]">
        <span className="text-neutral-400 font-medium">
          Tatame Oficial {isGi ? 'CBJJ / IBJJF (Gi)' : 'ADCC / No-Gi'} • Área 8×8m
        </span>
        {lastFeedbackText ? (
          <span className="text-sky-300 font-semibold truncate max-w-xl">
            {lastFeedbackText}
          </span>
        ) : (
          <span className="text-neutral-500">
            Selecione uma técnica abaixo para iniciar o ciclo simultâneo
          </span>
        )}
      </div>
    </div>
  );
};
