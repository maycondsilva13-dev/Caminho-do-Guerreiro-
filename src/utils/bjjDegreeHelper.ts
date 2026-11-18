import { BeltGraduation } from '../types/game';

/**
 * Retorna a quantidade máxima de graus individuais da faixa de Jiu-Jitsu Brasileiro (CBJJ/IBJJF).
 * - Branca, Cinza, Amarela, Laranja, Verde, Azul, Roxa e Marrom (índices 0..7): 0 a 4 graus.
 * - Faixa Preta (índice 8): 0 (recém-formado) até 6º Grau.
 * - Faixas Coral (7º e 8º) e Vermelha (9º e 10º) (índices 9..12): grau único próprio da faixa.
 */
export function getBjjMaxStripes(rankIndex: number): number {
  if (rankIndex >= 9) return 0;
  if (rankIndex === 8) return 6;
  return 4;
}

/**
 * Remove sufixos antigos de faixa agrupados ("0 a 4 Graus", "1º ao 6º Grau")
 * preservando apenas o nome limpo da faixa base.
 */
export function stripLegacyBjjRangeSuffix(beltName: string): string {
  return (beltName || 'Faixa Branca')
    .replace(/\s*\(\s*Iniciação\s*\/\s*0 a 4 Graus\s*\)/gi, ' (Iniciação)')
    .replace(/\s*\(\s*Graduado Adulto\s*-\s*0 a 4 Graus\s*\)/gi, ' (Graduado Adulto)')
    .replace(/\s*\(\s*Técnico Avançado\s*-\s*0 a 4 Graus\s*\)/gi, ' (Técnico Avançado)')
    .replace(/\s*\(\s*Antessala da Faixa Preta\s*-\s*0 a 4 Graus\s*\)/gi, ' (Antessala da Faixa Preta)')
    .replace(/\s*\(\s*Professor\s*\/\s*Black Belt\s*-\s*1º ao 6º Grau\s*\)/gi, ' (Professor / Black Belt)')
    .replace(/\s*[-/]\s*0 a 4 Graus/gi, '')
    .replace(/\s*[-/]\s*1º ao 6º Grau/gi, '')
    .replace(/\s*\(\s*0 a 4 Graus\s*\)/gi, '')
    .replace(/\s*\(\s*1º ao 6º Grau\s*\)/gi, '')
    .replace(/\s*·\s*(Sem Grau|\d+º Grau)/gi, '')
    .trim();
}

/**
 * Formata o nome oficial da faixa de BJJ exibindo em qual grau exato o atleta está.
 * Ex: "Faixa Azul (Graduado Adulto) · 2º Grau" ou "Faixa Preta (Professor / Black Belt) · 3º Grau".
 */
export function formatBjjBeltWithDegree(
  rankIndex: number,
  baseBeltName: string,
  stripes: number = 0
): string {
  if (rankIndex >= 9) {
    return baseBeltName;
  }

  const clean = stripLegacyBjjRangeSuffix(baseBeltName);
  const max = getBjjMaxStripes(rankIndex);
  const safeStripes = Math.max(0, Math.min(max, Math.floor(stripes || 0)));

  if (safeStripes === 0) {
    return `${clean} · Sem Grau`;
  }
  return `${clean} · ${safeStripes}º Grau`;
}

/**
 * Calcula o grau esperado na faixa de BJJ conforme XP acumulado e meses de permanência na faixa.
 */
export function computeBjjStripesFromProgress(
  rankIndex: number,
  xp: number,
  xpNeeded: number,
  monthsInRank: number,
  minMonthsInRank?: number
): number {
  if (rankIndex >= 9) return 0;

  if (rankIndex === 8) {
    // Regra CBJJ/IBJJF na Faixa Preta: 1º, 2º e 3º grau a cada 3 anos (36 meses);
    // 4º, 5º e 6º grau a cada 5 anos (60 meses).
    if (monthsInRank >= 288) return 6;
    if (monthsInRank >= 228) return 5;
    if (monthsInRank >= 168) return 4;
    if (monthsInRank >= 108) return 3;
    if (monthsInRank >= 72) return 2;
    if (monthsInRank >= 36) return 1;
    return 0;
  }

  const xpRatio = xpNeeded > 0 ? Math.min(1, Math.max(0, xp / xpNeeded)) : 0;
  const defaultTargetMonths =
    rankIndex === 0 ? 14 : rankIndex <= 4 ? 10 : rankIndex === 5 ? 16 : rankIndex === 6 ? 16 : 14;
  const targetMonths = Math.max(
    defaultTargetMonths,
    minMonthsInRank && minMonthsInRank > 0 ? minMonthsInRank : defaultTargetMonths
  );
  const monthRatio = Math.min(1, Math.max(0, monthsInRank / targetMonths));
  const combined = xpRatio * 0.72 + monthRatio * 0.28;

  if (combined >= 0.88) return 4;
  if (combined >= 0.68) return 3;
  if (combined >= 0.45) return 2;
  if (combined >= 0.22) return 1;
  return 0;
}

/**
 * Deriva o grau inicial realista para um atleta NPC do catálogo mundial de BJJ.
 */
export function deriveInitialBjjNpcStripes(
  rankIndex: number,
  age: number,
  wins: number,
  reputation: number,
  monthsInRank?: number
): number {
  if (rankIndex >= 9) return 0;

  if (rankIndex === 8) {
    if (monthsInRank && monthsInRank >= 36) {
      return computeBjjStripesFromProgress(8, 0, 3400, monthsInRank);
    }
    const yearsSince19 = Math.max(0, age - 19);
    const est = Math.floor((yearsSince19 * 0.45 + wins * 0.06 + reputation * 0.004) / 2);
    return Math.max(1, Math.min(6, est));
  }

  if (monthsInRank && monthsInRank > 0) {
    return computeBjjStripesFromProgress(rankIndex, Math.min(1, monthsInRank / 16) * 100, 100, monthsInRank, 12);
  }

  const score = (wins % 5) + Math.floor(reputation / 65) + (rankIndex === 7 ? 1 : 0);
  return Math.max(0, Math.min(4, score % 5));
}

/**
 * Retorna o texto completo da graduação do jogador considerando graus do BJJ.
 */
export function getDisplayBeltForGrad(art: string, grad?: Partial<BeltGraduation> | null): string {
  if (!grad) return 'Iniciante';
  if (art === 'jiujitsu') {
    return formatBjjBeltWithDegree(grad.rankIndex ?? 0, grad.name || 'Faixa Branca', grad.stripes ?? 0);
  }
  return grad.masteryTitle || grad.name || 'Iniciante';
}

/**
 * Cores da faixa e da ponteira no Jiu-Jitsu para renderização visual dos graus.
 */
export function getBjjBeltRibbonColors(rankIndex: number): {
  beltBg: string;
  tipBg: string;
  stripeColor: string;
  textColor: string;
} {
  if (rankIndex === 0) return { beltBg: '#f8fafc', tipBg: '#0f172a', stripeColor: '#ffffff', textColor: '#0f172a' };
  if (rankIndex === 1) return { beltBg: '#94a3b8', tipBg: '#0f172a', stripeColor: '#ffffff', textColor: '#0f172a' };
  if (rankIndex === 2) return { beltBg: '#facc15', tipBg: '#0f172a', stripeColor: '#ffffff', textColor: '#0f172a' };
  if (rankIndex === 3) return { beltBg: '#f97316', tipBg: '#0f172a', stripeColor: '#ffffff', textColor: '#ffffff' };
  if (rankIndex === 4) return { beltBg: '#15803d', tipBg: '#0f172a', stripeColor: '#ffffff', textColor: '#ffffff' };
  if (rankIndex === 5) return { beltBg: '#2563eb', tipBg: '#0f172a', stripeColor: '#ffffff', textColor: '#ffffff' };
  if (rankIndex === 6) return { beltBg: '#9333ea', tipBg: '#0f172a', stripeColor: '#ffffff', textColor: '#ffffff' };
  if (rankIndex === 7) return { beltBg: '#713f12', tipBg: '#0f172a', stripeColor: '#ffffff', textColor: '#ffffff' };
  if (rankIndex === 8) return { beltBg: '#09090b', tipBg: '#dc2626', stripeColor: '#ffffff', textColor: '#ffffff' };
  if (rankIndex === 9) return { beltBg: 'linear-gradient(90deg, #dc2626 50%, #09090b 50%)', tipBg: '#ffffff', stripeColor: '#09090b', textColor: '#ffffff' };
  if (rankIndex === 10) return { beltBg: 'linear-gradient(90deg, #dc2626 50%, #ffffff 50%)', tipBg: '#dc2626', stripeColor: '#ffffff', textColor: '#0f172a' };
  return { beltBg: '#dc2626', tipBg: '#facc15', stripeColor: '#ffffff', textColor: '#ffffff' };
}
