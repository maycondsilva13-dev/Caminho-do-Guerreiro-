/**
 * CAMINHO DO GUERREIRO: DO TATAME AO OCTÓGONO
 * Renderizador Visual 2D HD Isométrico Especializado para Arena de Boxe (Pugilismo)
 */

import React, { useEffect, useRef } from 'react';
import { BoxingCycleRecord, BoxingHitVisualType, BoxingMatchState } from '../../types/boxingCombat';

interface BoxingIsometricCanvasProps {
  matchState: BoxingMatchState;
}

interface Vec2 {
  x: number;
  y: number;
}

interface BoxerRig {
  cx: number;
  cy: number;
  hipOffsetY: number;
  torsoLean: number;
  shoulderWidth: number;
  bobOffset: number;
  leadArmExt: number;
  rearArmExt: number;
  punchAngle: number;
  punchTargetY: number; // -1 head, 0 chest, +1 body
  guardTightness: number; // 0..1
  slipOffset: number; // -1..+1
  knockdownFactor: number; // 0..1
  victoryRaise: number; // 0..1
  stepBounce: number;
}

interface FloatingPopup {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
  age: number;
  duration: number;
}

interface ImpactParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  age: number;
  duration: number;
}

const LOGICAL_WIDTH = 960;
const LOGICAL_HEIGHT = 520;

// Vértices do ringue isométrico elevado
const RING = {
  top: { x: 480, y: 158 },
  right: { x: 836, y: 298 },
  bottom: { x: 480, y: 446 },
  left: { x: 124, y: 298 },
  center: { x: 480, y: 302 }
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

function shadeColor(hex: string, percent: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function drawUnifiedLimb(
  ctx: CanvasRenderingContext2D,
  p0: Vec2,
  p1: Vec2,
  p2: Vec2,
  wUpper: number,
  wLower: number,
  fill: string,
  outline: string,
  highlight?: string
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Contorno externo
  ctx.strokeStyle = outline;
  ctx.lineWidth = wUpper + 3.5;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.stroke();

  ctx.lineWidth = wLower + 3.5;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  // Preenchimento anatômico contínuo
  ctx.strokeStyle = fill;
  ctx.lineWidth = wUpper;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.stroke();

  ctx.lineWidth = wLower;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  if (highlight) {
    ctx.strokeStyle = highlight;
    ctx.lineWidth = Math.max(1.5, wUpper * 0.28);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y - 1.5);
    ctx.lineTo(p1.x, p1.y - 1.5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawArenaEnvironment(
  ctx: CanvasRenderingContext2D,
  isComp: boolean,
  timeMs: number,
  lastCycle: BoxingCycleRecord | undefined
) {
  // Fundo principal
  const bgGrad = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
  if (isComp) {
    bgGrad.addColorStop(0, '#050814');
    bgGrad.addColorStop(0.5, '#0b1024');
    bgGrad.addColorStop(1, '#121526');
  } else {
    bgGrad.addColorStop(0, '#13161f');
    bgGrad.addColorStop(0.55, '#191b24');
    bgGrad.addColorStop(1, '#1f1916');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  if (isComp) {
    // Treliça superior e refletores de arena de boxe
    ctx.fillStyle = '#090c18';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, 32);

    const beamX = [200, 480, 760];
    beamX.forEach((bx, i) => {
      const sway = Math.sin(timeMs * 0.001 + i) * 18;
      const beamGrad = ctx.createRadialGradient(bx, 18, 6, 480 + sway, 290, 320);
      beamGrad.addColorStop(0, 'rgba(255, 245, 210, 0.22)');
      beamGrad.addColorStop(0.55, 'rgba(180, 210, 255, 0.06)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(bx - 16, 18);
      ctx.lineTo(bx + 16, 18);
      ctx.lineTo(480 + sway + 170, 380);
      ctx.lineTo(480 + sway - 170, 380);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(bx, 22, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Platéia em arquibancada ao fundo
    for (let row = 0; row < 3; row++) {
      const yBase = 104 + row * 18;
      const alpha = 0.25 + row * 0.14;
      ctx.fillStyle = `rgba(15, 23, 42, ${alpha})`;
      ctx.fillRect(0, yBase, LOGICAL_WIDTH, 22);
      for (let sx = 18; sx < LOGICAL_WIDTH; sx += 22) {
        const bounce = Math.sin(timeMs * 0.004 + sx * 0.3 + row) * 1.4;
        ctx.fillStyle = row === 2 ? '#1e293b' : '#111827';
        ctx.beginPath();
        ctx.arc(sx, yBase + 6 + bounce, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(sx - 6, yBase + 11 + bounce, 12, 10);
      }
    }

    // Flashes fotográficos ao redor do ringue (intensificados em knockdown/contra)
    const flashBoost = lastCycle?.highlightTag ? 3 : 1;
    for (let f = 0; f < flashBoost; f++) {
      const phase = Math.floor(timeMs / 280 + f * 31) * 97;
      if (phase % 7 === 0) {
        const fx = ((phase * 73) % 860) + 50;
        const fy = ((phase * 41) % 60) + 95;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(fx, fy, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // Academia de Boxe (Sparring): parede de tijolos escuros, banner & sacos de pancada
    ctx.fillStyle = '#1b1d26';
    ctx.fillRect(0, 22, LOGICAL_WIDTH, 130);
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let y = 30; y < 150; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(LOGICAL_WIDTH, y);
      ctx.stroke();
    }

    // Banner central da academia
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.fillRect(320, 42, 320, 44);
    ctx.strokeRect(320, 42, 320, 44);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CLUBE DA NOBRE ARTE • RINGUE OFICIAL', 480, 69);

    // Sacos de pancada pendurados nas laterais
    [95, 165, 795, 865].forEach((bx, idx) => {
      const swing = Math.sin(timeMs * 0.002 + idx * 1.4) * 2.5;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, 12);
      ctx.lineTo(bx + swing, 44);
      ctx.stroke();

      const bagGrad = ctx.createLinearGradient(bx - 13, 44, bx + 13, 44);
      bagGrad.addColorStop(0, idx % 2 === 0 ? '#7f1d1d' : '#1e293b');
      bagGrad.addColorStop(0.5, idx % 2 === 0 ? '#b91c1c' : '#334155');
      bagGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bagGrad;
      ctx.beginPath();
      ctx.roundRect(bx + swing - 13, 44, 26, 68, 7);
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }
}

function drawRingPlatformAndBackRopes(
  ctx: CanvasRenderingContext2D,
  isComp: boolean
) {
  // Base / saia do ringue elevado
  const skirtDepth = 38;
  ctx.save();

  // Saia esquerda
  ctx.fillStyle = isComp ? '#0f172a' : '#1c1917';
  ctx.beginPath();
  ctx.moveTo(RING.left.x, RING.left.y);
  ctx.lineTo(RING.bottom.x, RING.bottom.y);
  ctx.lineTo(RING.bottom.x, RING.bottom.y + skirtDepth);
  ctx.lineTo(RING.left.x, RING.left.y + skirtDepth);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Saia direita
  ctx.fillStyle = isComp ? '#172554' : '#292524';
  ctx.beginPath();
  ctx.moveTo(RING.bottom.x, RING.bottom.y);
  ctx.lineTo(RING.right.x, RING.right.y);
  ctx.lineTo(RING.right.x, RING.right.y + skirtDepth);
  ctx.lineTo(RING.bottom.x, RING.bottom.y + skirtDepth);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Texto na saia do ringue
  ctx.fillStyle = isComp ? 'rgba(251, 191, 36, 0.7)' : 'rgba(255,255,255,0.28)';
  ctx.font = '800 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(302, 392);
  ctx.rotate(Math.atan2(RING.bottom.y - RING.left.y, RING.bottom.x - RING.left.x));
  ctx.fillText(isComp ? 'CAMPEONATO OFICIAL • 10-POINT MUST' : 'SPARRING TÉCNICO • PUGILISMO', 0, 0);
  ctx.restore();

  // Lona do ringue isométrico
  const matGrad = ctx.createRadialGradient(RING.center.x, RING.center.y, 40, RING.center.x, RING.center.y, 380);
  if (isComp) {
    matGrad.addColorStop(0, '#2563eb');
    matGrad.addColorStop(0.7, '#1d4ed8');
    matGrad.addColorStop(1, '#1e3a8a');
  } else {
    matGrad.addColorStop(0, '#3b5275');
    matGrad.addColorStop(0.8, '#293952');
    matGrad.addColorStop(1, '#1e293b');
  }

  ctx.fillStyle = matGrad;
  ctx.beginPath();
  ctx.moveTo(RING.top.x, RING.top.y);
  ctx.lineTo(RING.right.x, RING.right.y);
  ctx.lineTo(RING.bottom.x, RING.bottom.y);
  ctx.lineTo(RING.left.x, RING.left.y);
  ctx.closePath();
  ctx.fill();

  // Borda branca interna do ringue (apron margin)
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Círculo central da lona
  ctx.save();
  ctx.translate(RING.center.x, RING.center.y);
  ctx.scale(1, 0.44);
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 74, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  ctx.fill();
  ctx.restore();

  // Postes e cordas traseiras (Left->Top e Top->Right) desenhadas ATRÁS dos lutadores
  const postHeight = 76;
  const drawPost = (pt: Vec2, padColor: string) => {
    ctx.fillStyle = '#334155';
    ctx.fillRect(pt.x - 4, pt.y - postHeight, 8, postHeight);
    // Almofada do corner
    ctx.fillStyle = padColor;
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pt.x - 8, pt.y - postHeight + 8, 16, postHeight - 14, 5);
    ctx.fill();
    ctx.stroke();
  };

  drawPost(RING.top, '#f8fafc'); // Neutro superior
  drawPost(RING.left, '#2563eb'); // Córner Azul (Jogador)
  drawPost(RING.right, '#dc2626'); // Córner Vermelho (Oponente)

  const ropeHeights = [22, 42, 62];
  ropeHeights.forEach((h, idx) => {
    const color = idx === 0 ? '#ef4444' : idx === 1 ? '#f8fafc' : '#3b82f6';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(RING.left.x, RING.left.y - h);
    ctx.lineTo(RING.top.x, RING.top.y - h);
    ctx.lineTo(RING.right.x, RING.right.y - h);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(RING.left.x, RING.left.y - h);
    ctx.lineTo(RING.top.x, RING.top.y - h);
    ctx.lineTo(RING.right.x, RING.right.y - h);
    ctx.stroke();
  });

  ctx.restore();
}

function drawFrontRingRopes(ctx: CanvasRenderingContext2D) {
  ctx.save();
  const postHeight = 76;
  const ropeHeights = [22, 42, 62];

  // Cordas frontais (Left->Bottom e Bottom->Right) com leve transparência para nunca esconder os pés/tronco
  ctx.globalAlpha = 0.72;
  ropeHeights.forEach((h, idx) => {
    const color = idx === 0 ? '#ef4444' : idx === 1 ? '#f8fafc' : '#3b82f6';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(RING.left.x, RING.left.y - h);
    ctx.lineTo(RING.bottom.x, RING.bottom.y - h);
    ctx.lineTo(RING.right.x, RING.right.y - h);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(RING.left.x, RING.left.y - h);
    ctx.lineTo(RING.bottom.x, RING.bottom.y - h);
    ctx.lineTo(RING.right.x, RING.right.y - h);
    ctx.stroke();
  });

  ctx.globalAlpha = 1;
  // Poste neutro inferior
  ctx.fillStyle = '#334155';
  ctx.fillRect(RING.bottom.x - 4, RING.bottom.y - postHeight, 8, postHeight);
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(RING.bottom.x - 8, RING.bottom.y - postHeight + 8, 16, postHeight - 14, 5);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawReferee(
  ctx: CanvasRenderingContext2D,
  isCounting: boolean,
  countNum: number | undefined,
  winner: 'boxer_a' | 'boxer_b' | 'draw' | null
) {
  ctx.save();
  const rx = winner ? 480 : 480;
  const ry = winner ? 245 : 238;

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.beginPath();
  ctx.ellipse(rx, ry + 52, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const skin = '#eab68d';
  const shirt = '#93c5fd';
  const pants = '#111827';
  const outline = '#09090b';

  // Pernas calça social preta
  drawUnifiedLimb(ctx, { x: rx - 7, y: ry + 20 }, { x: rx - 9, y: ry + 36 }, { x: rx - 10, y: ry + 50 }, 8, 7, pants, outline);
  drawUnifiedLimb(ctx, { x: rx + 7, y: ry + 20 }, { x: rx + 9, y: ry + 36 }, { x: rx + 10, y: ry + 50 }, 8, 7, pants, outline);

  // Tronco camisa azul-claro do árbitro + gravata borboleta
  ctx.fillStyle = shirt;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(rx - 12, ry - 4, 24, 26, 6);
  ctx.fill();
  ctx.stroke();

  // Gravata borboleta preta
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.moveTo(rx - 5, ry - 2);
  ctx.lineTo(rx + 5, ry + 2);
  ctx.lineTo(rx + 5, ry - 2);
  ctx.lineTo(rx - 5, ry + 2);
  ctx.closePath();
  ctx.fill();

  // Braços (gesto de contagem ou mão erguida)
  if (isCounting) {
    drawUnifiedLimb(ctx, { x: rx + 11, y: ry }, { x: rx + 20, y: ry - 12 }, { x: rx + 26, y: ry - 24 }, 6, 5, shirt, outline);
    drawUnifiedLimb(ctx, { x: rx - 11, y: ry }, { x: rx - 18, y: ry + 6 }, { x: rx - 14, y: ry + 14 }, 6, 5, shirt, outline);
  } else {
    drawUnifiedLimb(ctx, { x: rx - 11, y: ry }, { x: rx - 16, y: ry + 10 }, { x: rx - 12, y: ry + 18 }, 6, 5, shirt, outline);
    drawUnifiedLimb(ctx, { x: rx + 11, y: ry }, { x: rx + 16, y: ry + 10 }, { x: rx + 12, y: ry + 18 }, 6, 5, shirt, outline);
  }

  // Cabeça
  ctx.fillStyle = skin;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(rx, ry - 14, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (isCounting && countNum) {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
    ctx.strokeStyle = '#fef2f2';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(rx - 44, ry - 48, 88, 22, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`CONTAGEM: ${countNum}!`, rx, ry - 33);
  }
  ctx.restore();
}

function drawBoxer(
  ctx: CanvasRenderingContext2D,
  rig: BoxerRig,
  facing: 1 | -1,
  skinColor: string,
  trunksColor: string,
  gloveColor: string,
  headgearColor: string | undefined,
  isGroggy: boolean,
  fatigueRatio: number
) {
  ctx.save();
  const outline = '#09090b';
  const trunksDark = shadeColor(trunksColor, -32);
  const gloveDark = shadeColor(gloveColor, -35);

  // Sombra aterrada na lona
  ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
  ctx.beginPath();
  const shadowRx = rig.knockdownFactor > 0.3 ? 38 : 24;
  ctx.ellipse(rig.cx, rig.cy + 58, shadowRx, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  if (rig.knockdownFactor > 0.45) {
    // Pose caída na lona (knockdown / nocaute)
    const dir = facing;
    const fy = rig.cy + 44;
    ctx.translate(rig.cx, fy);
    ctx.fillStyle = trunksColor;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-24 * dir, -8, 22, 14, 5);
    ctx.fill();
    ctx.stroke();

    // Pernas dobradas na lona
    drawUnifiedLimb(
      ctx,
      { x: -16 * dir, y: 0 },
      { x: -34 * dir, y: 4 },
      { x: -44 * dir, y: 12 },
      10,
      8,
      skinColor,
      outline
    );
    // Tronco caído
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.roundRect(-6, -12, 26, 15, 6);
    ctx.fill();
    ctx.stroke();

    // Cabeça na lona + luva
    ctx.beginPath();
    ctx.arc(24 * dir, -8, 10.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (headgearColor) {
      ctx.strokeStyle = headgearColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(24 * dir, -8, 10.5, Math.PI * 0.85, Math.PI * 2.15);
      ctx.stroke();
    }

    ctx.fillStyle = gloveColor;
    ctx.beginPath();
    ctx.arc(10 * dir, 6, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
    return;
  }

  const x = rig.cx + rig.slipOffset * 12;
  const y = rig.cy + rig.bobOffset + rig.hipOffsetY;
  const leanX = rig.torsoLean * facing * 14;

  const hipCenter = { x, y: y + 18 };
  const shoulderCenter = { x: x + leanX, y: y - 16 };

  // Perna traseira
  const backFoot = { x: x - facing * (17 + rig.stepBounce * 2), y: rig.cy + 54 };
  const backKnee = { x: (hipCenter.x + backFoot.x) * 0.5 - facing * 4, y: (hipCenter.y + backFoot.y) * 0.5 - 2 };
  drawUnifiedLimb(ctx, hipCenter, backKnee, backFoot, 11.5, 9, skinColor, outline);

  // Perna dianteira
  const frontFoot = { x: x + facing * (17 + rig.stepBounce * 2), y: rig.cy + 58 };
  const frontKnee = { x: (hipCenter.x + frontFoot.x) * 0.5 + facing * 6, y: (hipCenter.y + frontFoot.y) * 0.5 - 2 };
  drawUnifiedLimb(ctx, hipCenter, frontKnee, frontFoot, 12, 9.5, skinColor, outline);

  // Botas de boxe
  [backFoot, frontFoot].forEach((ft) => {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(ft.x - 6, ft.y - 7, 13, 10, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = trunksColor;
    ctx.fillRect(ft.x - 4, ft.y - 6, 8, 2.5);
  });

  // Calção de boxe com cós largo
  ctx.fillStyle = trunksColor;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(hipCenter.x - 14, hipCenter.y - 6, 28, 21, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(hipCenter.x - 13, hipCenter.y - 6, 26, 4.5);
  ctx.fillStyle = trunksDark;
  ctx.fillRect(hipCenter.x - 12, hipCenter.y + 8, 24, 5);

  // Tronco atlético contínuo
  ctx.fillStyle = skinColor;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(shoulderCenter.x - 14, shoulderCenter.y);
  ctx.lineTo(shoulderCenter.x + 14, shoulderCenter.y);
  ctx.lineTo(hipCenter.x + 11, hipCenter.y - 4);
  ctx.lineTo(hipCenter.x - 11, hipCenter.y - 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sombra muscular do peitoral/abdômen
  ctx.strokeStyle = shadeColor(skinColor, -24);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(shoulderCenter.x - 8, shoulderCenter.y + 11);
  ctx.lineTo(shoulderCenter.x + 8, shoulderCenter.y + 11);
  ctx.stroke();

  // Braço traseiro (direto/gancho de trás ou guarda alta)
  const backShoulder = { x: shoulderCenter.x - facing * 10, y: shoulderCenter.y + 4 };
  const rearReach = rig.rearArmExt * 46;
  const rearHand =
    rig.victoryRaise > 0.3
      ? { x: backShoulder.x + facing * 6, y: backShoulder.y - 42 * rig.victoryRaise }
      : {
          x: shoulderCenter.x + facing * (12 + rearReach),
          y: shoulderCenter.y - 10 + rig.punchTargetY * 14 - rig.guardTightness * 4
        };
  const rearElbow = {
    x: (backShoulder.x + rearHand.x) * 0.5 - facing * 4,
    y: (backShoulder.y + rearHand.y) * 0.5 + 10
  };
  drawUnifiedLimb(ctx, backShoulder, rearElbow, rearHand, 9.5, 8.5, skinColor, outline);

  // Cabeça + Capacete Amador (se aplicável)
  const headCenter = {
    x: shoulderCenter.x + facing * 3,
    y: shoulderCenter.y - 14
  };
  ctx.fillStyle = skinColor;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(headCenter.x, headCenter.y, 11.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cabelo / Capacete olímpico
  if (headgearColor) {
    ctx.fillStyle = headgearColor;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(headCenter.x, headCenter.y - 1, 13, Math.PI * 0.88, Math.PI * 2.12);
    ctx.lineTo(headCenter.x + 11, headCenter.y + 6);
    ctx.lineTo(headCenter.x - 11, headCenter.y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Visor frontal livre para o rosto
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.roundRect(headCenter.x + facing * 2 - 5, headCenter.y - 4, 11, 12, 3);
    ctx.fill();
  } else {
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(headCenter.x - facing * 1, headCenter.y - 3.5, 11, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fill();
  }

  // Indicador visual de queixo abalado (estrelinhas sutis) ou fadiga
  if (isGroggy) {
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦ ✦', headCenter.x, headCenter.y - 18);
  } else if (fatigueRatio > 0.65) {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.beginPath();
    ctx.arc(headCenter.x - facing * 6, headCenter.y - 4, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Braço dianteiro (jab / gancho / guarda)
  const frontShoulder = { x: shoulderCenter.x + facing * 9, y: shoulderCenter.y + 5 };
  const leadReach = rig.leadArmExt * 48;
  const leadHand = {
    x: shoulderCenter.x + facing * (17 + leadReach),
    y: shoulderCenter.y - 8 + rig.punchTargetY * 14 - rig.guardTightness * 4
  };
  const leadElbow = {
    x: (frontShoulder.x + leadHand.x) * 0.5 - facing * 2,
    y: (frontShoulder.y + leadHand.y) * 0.5 + 11
  };
  drawUnifiedLimb(ctx, frontShoulder, leadElbow, leadHand, 10, 8.5, skinColor, outline);

  // Luvas de Boxe (traseira e dianteira)
  const drawGlove = (pos: Vec2) => {
    ctx.fillStyle = gloveColor;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 9.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Punho da luva + brilho
    ctx.fillStyle = gloveDark;
    ctx.beginPath();
    ctx.arc(pos.x - facing * 4, pos.y + 2, 4.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.arc(pos.x + facing * 2, pos.y - 3, 2.8, 0, Math.PI * 2);
    ctx.fill();
  };

  drawGlove(rearHand);
  drawGlove(leadHand);

  ctx.restore();
}

export const BoxingIsometricCanvas: React.FC<BoxingIsometricCanvasProps> = ({
  matchState
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<BoxingMatchState>(matchState);
  stateRef.current = matchState;

  const animRef = useRef<{
    rigA: BoxerRig;
    rigB: BoxerRig;
    lastCycleSeen: number;
    actionBurst: number; // 0..1 decai após novo ciclo
    popups: FloatingPopup[];
    particles: ImpactParticle[];
    popupSeq: number;
  }>({
    rigA: {
      cx: 412,
      cy: 295,
      hipOffsetY: 0,
      torsoLean: 0.15,
      shoulderWidth: 28,
      bobOffset: 0,
      leadArmExt: 0,
      rearArmExt: 0,
      punchAngle: 0,
      punchTargetY: -0.2,
      guardTightness: 0.5,
      slipOffset: 0,
      knockdownFactor: 0,
      victoryRaise: 0,
      stepBounce: 0
    },
    rigB: {
      cx: 548,
      cy: 295,
      hipOffsetY: 0,
      torsoLean: 0.15,
      shoulderWidth: 28,
      bobOffset: 0,
      leadArmExt: 0,
      rearArmExt: 0,
      punchAngle: 0,
      punchTargetY: -0.2,
      guardTightness: 0.5,
      slipOffset: 0,
      knockdownFactor: 0,
      victoryRaise: 0,
      stepBounce: 0
    },
    lastCycleSeen: matchState.history.length,
    actionBurst: 0,
    popups: [],
    particles: [],
    popupSeq: 1
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    const spawnBurstEffects = (cycle: BoxingCycleRecord) => {
      const store = animRef.current;
      store.actionBurst = 1.0;

      const pushPopup = (text: string, color: string, x: number, y: number) => {
        store.popups.push({
          id: store.popupSeq++,
          text,
          color,
          x,
          y,
          age: 0,
          duration: 1.4
        });
      };

      const spawnSparks = (x: number, y: number, color: string, count: number) => {
        for (let i = 0; i < count; i++) {
          const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
          const spd = 40 + Math.random() * 75;
          store.particles.push({
            x,
            y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 20,
            color,
            size: 2.2 + Math.random() * 2.5,
            age: 0,
            duration: 0.45
          });
        }
      };

      if (cycle.isKnockdownOnB) {
        pushPopup(`KNOCKDOWN! (${cycle.refereeCount || 10})`, '#f59e0b', store.rigB.cx, store.rigB.cy - 45);
        spawnSparks(store.rigB.cx, store.rigB.cy - 10, '#fbbf24', 14);
      } else if (cycle.isKnockdownOnA) {
        pushPopup(`KNOCKDOWN! (${cycle.refereeCount || 10})`, '#ef4444', store.rigA.cx, store.rigA.cy - 45);
        spawnSparks(store.rigA.cx, store.rigA.cy - 10, '#f87171', 14);
      } else {
        if (cycle.isCounterByA) {
          pushPopup('CONTRA-GOLPE!', '#22d3ee', store.rigB.cx, store.rigB.cy - 36);
          spawnSparks(store.rigB.cx - 8, store.rigB.cy - 12, '#38bdf8', 10);
        } else if (cycle.damageToB >= 8) {
          pushPopup(`-${Math.round(cycle.damageToB)}`, '#60a5fa', store.rigB.cx, store.rigB.cy - 32);
          spawnSparks(store.rigB.cx - 8, store.rigB.cy - 12, '#e2e8f0', 7);
        }

        if (cycle.isCounterByB) {
          pushPopup('CONTRA-GOLPE!', '#fb7185', store.rigA.cx, store.rigA.cy - 36);
          spawnSparks(store.rigA.cx + 8, store.rigA.cy - 12, '#fb7185', 10);
        } else if (cycle.damageToA >= 8) {
          pushPopup(`-${Math.round(cycle.damageToA)}`, '#f87171', store.rigA.cx, store.rigA.cy - 32);
          spawnSparks(store.rigA.cx + 8, store.rigA.cy - 12, '#fca5a5', 7);
        }

        if (cycle.roundJustEnded) {
          pushPopup(`FIM DO ROUND ${cycle.roundNumber}`, '#fbbf24', 480, 175);
        }
      }
    };

    const computeTargets = (
      ms: BoxingMatchState,
      timeMs: number,
      burst: number,
      lastCycle: BoxingCycleRecord | undefined
    ): { tA: BoxerRig; tB: BoxerRig } => {
      const idleA = Math.sin(timeMs * 0.0055) * 2.2;
      const idleB = Math.sin(timeMs * 0.0055 + 1.4) * 2.2;

      // Posição horizontal conforme distância atual
      let centerA = 398;
      let centerB = 562;
      let baseY = 294;

      if (ms.currentDistance === 'media') {
        centerA = 430;
        centerB = 530;
      } else if (ms.currentDistance === 'curta') {
        centerA = 446;
        centerB = 514;
      } else if (ms.currentDistance === 'clinch') {
        centerA = 460;
        centerB = 500;
      } else if (ms.currentDistance === 'cordas') {
        if (ms.ropeTrappedBoxer === 'boxer_a') {
          centerA = 232;
          centerB = 296;
          baseY = 296;
        } else {
          centerA = 664;
          centerB = 728;
          baseY = 296;
        }
      }

      const mapPunchAnim = (
        hitType: BoxingHitVisualType | undefined,
        isBurst: boolean
      ): Partial<BoxerRig> => {
        if (!isBurst || !hitType) {
          return {
            leadArmExt: 0.05,
            rearArmExt: 0,
            punchTargetY: -0.2,
            guardTightness: 0.55,
            slipOffset: 0,
            torsoLean: 0.15,
            hipOffsetY: 0
          };
        }
        switch (hitType) {
          case 'jab':
            return { leadArmExt: 1.0, rearArmExt: 0.05, punchTargetY: -0.35, torsoLean: 0.35 };
          case 'cross':
          case 'counter':
            return { leadArmExt: 0.15, rearArmExt: 1.05, punchTargetY: -0.35, torsoLean: 0.55 };
          case 'hook':
          case 'combo':
            return { leadArmExt: 0.85, rearArmExt: 0.78, punchTargetY: -0.28, torsoLean: 0.45 };
          case 'uppercut':
            return { leadArmExt: 0.2, rearArmExt: 0.82, punchTargetY: -0.65, hipOffsetY: 6, torsoLean: 0.3 };
          case 'body':
            return { leadArmExt: 0.78, rearArmExt: 0.4, punchTargetY: 0.85, hipOffsetY: 9, torsoLean: 0.45 };
          case 'blocked':
            return { leadArmExt: -0.1, rearArmExt: -0.1, guardTightness: 1.0, torsoLean: -0.1 };
          case 'dodged':
            return { slipOffset: -1.1, hipOffsetY: 8, guardTightness: 0.4 };
          case 'clinch':
            return { leadArmExt: 0.45, rearArmExt: 0.45, torsoLean: 0.25 };
          default:
            return { leadArmExt: 0.15, rearArmExt: 0.1 };
        }
      };

      const isActiveBurst = burst > 0.22;
      const animA = mapPunchAnim(lastCycle?.hitTypeA, isActiveBurst);
      const animB = mapPunchAnim(lastCycle?.hitTypeB, isActiveBurst);

      const kdA =
        (ms.isMatchOver && ms.winner === 'boxer_b' && (ms.winMethod === 'KO' || ms.winMethod === 'TKO')) ||
        (isActiveBurst && Boolean(lastCycle?.isKnockdownOnA))
          ? 1
          : 0;
      const kdB =
        (ms.isMatchOver && ms.winner === 'boxer_a' && (ms.winMethod === 'KO' || ms.winMethod === 'TKO')) ||
        (isActiveBurst && Boolean(lastCycle?.isKnockdownOnB))
          ? 1
          : 0;

      return {
        tA: {
          cx: centerA,
          cy: baseY,
          hipOffsetY: animA.hipOffsetY ?? 0,
          torsoLean: animA.torsoLean ?? 0.18,
          shoulderWidth: 28,
          bobOffset: idleA,
          leadArmExt: animA.leadArmExt ?? 0.08,
          rearArmExt: animA.rearArmExt ?? 0,
          punchAngle: 0,
          punchTargetY: animA.punchTargetY ?? -0.25,
          guardTightness: animA.guardTightness ?? 0.6,
          slipOffset: animA.slipOffset ?? 0,
          knockdownFactor: kdA,
          victoryRaise: ms.isMatchOver && ms.winner === 'boxer_a' ? 1 : 0,
          stepBounce: Math.sin(timeMs * 0.008)
        },
        tB: {
          cx: centerB,
          cy: baseY,
          hipOffsetY: animB.hipOffsetY ?? 0,
          torsoLean: animB.torsoLean ?? 0.18,
          shoulderWidth: 28,
          bobOffset: idleB,
          leadArmExt: animB.leadArmExt ?? 0.08,
          rearArmExt: animB.rearArmExt ?? 0,
          punchAngle: 0,
          punchTargetY: animB.punchTargetY ?? -0.25,
          guardTightness: animB.guardTightness ?? 0.6,
          slipOffset: animB.slipOffset ?? 0,
          knockdownFactor: kdB,
          victoryRaise: ms.isMatchOver && ms.winner === 'boxer_b' ? 1 : 0,
          stepBounce: Math.cos(timeMs * 0.008)
        }
      };
    };

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const ms = stateRef.current;
      const store = animRef.current;

      if (ms.history.length > store.lastCycleSeen) {
        const latest = ms.history[ms.history.length - 1];
        if (latest) spawnBurstEffects(latest);
        store.lastCycleSeen = ms.history.length;
      } else if (ms.history.length < store.lastCycleSeen) {
        store.lastCycleSeen = ms.history.length;
        store.popups = [];
        store.particles = [];
        store.actionBurst = 0;
      }

      store.actionBurst = Math.max(0, store.actionBurst - dt * 1.15);

      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      const targetW = Math.round(LOGICAL_WIDTH * dpr);
      const targetH = Math.round(LOGICAL_HEIGHT * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const lastCycle = ms.history[ms.history.length - 1];
      const isComp = ms.matchType === 'competicao';

      drawArenaEnvironment(ctx, isComp, now, lastCycle);
      drawRingPlatformAndBackRopes(ctx, isComp);

      const { tA, tB } = computeTargets(ms, now, store.actionBurst, lastCycle);
      const smooth = 1 - Math.exp(-12 * dt);

      const blendRig = (cur: BoxerRig, tgt: BoxerRig) => {
        cur.cx = lerp(cur.cx, tgt.cx, smooth);
        cur.cy = lerp(cur.cy, tgt.cy, smooth);
        cur.hipOffsetY = lerp(cur.hipOffsetY, tgt.hipOffsetY, smooth);
        cur.torsoLean = lerp(cur.torsoLean, tgt.torsoLean, smooth);
        cur.bobOffset = tgt.bobOffset;
        cur.leadArmExt = lerp(cur.leadArmExt, tgt.leadArmExt, smooth);
        cur.rearArmExt = lerp(cur.rearArmExt, tgt.rearArmExt, smooth);
        cur.punchTargetY = lerp(cur.punchTargetY, tgt.punchTargetY, smooth);
        cur.guardTightness = lerp(cur.guardTightness, tgt.guardTightness, smooth);
        cur.slipOffset = lerp(cur.slipOffset, tgt.slipOffset, smooth);
        cur.knockdownFactor = lerp(cur.knockdownFactor, tgt.knockdownFactor, smooth * 0.8);
        cur.victoryRaise = lerp(cur.victoryRaise, tgt.victoryRaise, smooth * 0.6);
        cur.stepBounce = tgt.stepBounce;
      };

      blendRig(store.rigA, tA);
      blendRig(store.rigB, tB);

      const isCounting =
        store.actionBurst > 0.15 &&
        Boolean(lastCycle?.isKnockdownOnA || lastCycle?.isKnockdownOnB) &&
        !ms.isMatchOver;
      drawReferee(ctx, isCounting, lastCycle?.refereeCount, ms.winner);

      const headgearA = ms.rulesMode === 'amador' ? ms.boxerA.headgearColor || '#2563eb' : undefined;
      const headgearB = ms.rulesMode === 'amador' ? ms.boxerB.headgearColor || '#dc2626' : undefined;

      drawBoxer(
        ctx,
        store.rigA,
        1,
        '#dfab85',
        ms.boxerA.trunksColor,
        ms.boxerA.gloveColor,
        headgearA,
        ms.boxerA.isGroggy,
        1 - ms.boxerA.energy / 100
      );

      drawBoxer(
        ctx,
        store.rigB,
        -1,
        '#c98b63',
        ms.boxerB.trunksColor,
        ms.boxerB.gloveColor,
        headgearB,
        ms.boxerB.isGroggy,
        1 - ms.boxerB.energy / 100
      );

      drawFrontRingRopes(ctx);

      // Partículas de impacto/suor
      store.particles = store.particles.filter((p) => {
        p.age += dt;
        if (p.age >= p.duration) return false;
        const alpha = 1 - p.age / p.duration;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 190 * dt;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      });

      // Popups flutuantes
      store.popups = store.popups.filter((pop) => {
        pop.age += dt;
        if (pop.age >= pop.duration) return false;
        const t = pop.age / pop.duration;
        ctx.save();
        ctx.globalAlpha = 1 - t * t;
        ctx.font = '900 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#09090b';
        ctx.fillText(pop.text, pop.x + 1.5, pop.y - t * 30 + 1.5);
        ctx.fillStyle = pop.color;
        ctx.fillText(pop.text, pop.x, pop.y - t * 30);
        ctx.restore();
        return true;
      });

      // Etiqueta superior sutil de distância e regras
      ctx.save();
      ctx.fillStyle = 'rgba(9, 9, 11, 0.72)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(14, 14, 240, 28, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.font = '800 11px sans-serif';
      ctx.textAlign = 'left';
      const distLabel =
        ms.currentDistance === 'longa'
          ? 'LONG RANGE • CENTRO DO RINGUE'
          : ms.currentDistance === 'media'
          ? 'MID RANGE • ZONA DE TROCA'
          : ms.currentDistance === 'curta'
          ? 'INFIGHT • CURTA DISTÂNCIA'
          : ms.currentDistance === 'clinch'
          ? 'CLINCH • CORPO A CORPO'
          : ms.ropeTrappedBoxer === 'boxer_a'
          ? 'CÓRNER AZUL NAS CORDAS!'
          : 'OPONENTE NAS CORDAS!';
      ctx.fillText(distLabel, 24, 32);
      ctx.restore();

      ctx.restore();
      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
      <canvas
        ref={canvasRef}
        className="w-full h-auto block aspect-[960/520]"
        aria-label="Ringue Isométrico 2D de Boxe"
      />
    </div>
  );
};
