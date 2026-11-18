import { Character, MartialArtType, NpcWorldDelta, RivalNPC } from '../types/game';
import { MARTIAL_ARTS_META, WORLD_GYMS } from '../data/martialArtsData';
import {
  WORLD_FIGHTERS,
  getAgeCategoryFromAge,
  getWealthTierInfo,
  normalizeMartialArt
} from '../data/worldFightersData';
import {
  computeBjjStripesFromProgress,
  formatBjjBeltWithDegree,
  stripLegacyBjjRangeSuffix
} from './bjjDegreeHelper';
import { getActiveArtTalentBonus } from './talentAndDifficultyHelper';

export interface RequirementCheck {
  label: string;
  current: string | number;
  required: string | number;
  met: boolean;
}

export interface GraduationEligibility {
  canAdvance: boolean;
  isMaxRank: boolean;
  isMma: boolean;
  currentRank: {
    name: string;
    rankIndex: number;
    xp: number;
    xpNeeded: number;
    monthsInRank: number;
  };
  nextRank?: {
    name: string;
    color?: string;
    textColor?: string;
    gradientStyle?: string;
    categoryName?: string;
    stageNumber?: number;
    estimatedTime?: string;
    minAge?: number;
    minMonthsInRank?: number;
    minTechnique?: number;
    minFightIq?: number;
    minMmaWins?: number;
    evaluationCriteria?: string;
  };
  requirements: RequirementCheck[];
  reason?: string;
}

export interface MasterAttendanceEvaluation {
  attended: number;
  justifiedAbsences: number;
  unjustifiedAbsences: number;
  effectiveRate: number;
}

export function isJustifiedAbsenceNote(notes?: string): boolean {
  if (!notes) return false;
  return (
    notes.startsWith('Falta justificada:') ||
    notes.startsWith('Falta médica:') ||
    notes.startsWith('Falta familiar:')
  );
}

/**
 * Avalia a assiduidade real do atleta para o exame do Mestre:
 * faltas justificadas por doença ou evento/doença familiar não penalizam a disciplina do aluno.
 */
export function getEffectiveMasterAttendance(
  sessions: Array<{ status: string; notes?: string }> = []
): MasterAttendanceEvaluation {
  let attended = 0;
  let justifiedAbsences = 0;
  let unjustifiedAbsences = 0;

  for (const s of sessions) {
    if (s.status === 'concluida') {
      attended += 1;
    } else if (s.status === 'falta') {
      if (isJustifiedAbsenceNote(s.notes)) {
        justifiedAbsences += 1;
      } else {
        unjustifiedAbsences += 1;
      }
    }
  }

  const validCount = attended + unjustifiedAbsences;
  const effectiveRate = validCount === 0 ? 100 : Math.round((attended / validCount) * 100);

  return {
    attended,
    justifiedAbsences,
    unjustifiedAbsences,
    effectiveRate
  };
}

/**
 * Validação rigorosa dos requisitos oficiais de graduação da modalidade e federação.
 * Impede promoções antecipadas, respeita carência temporal, idade e atributos mínimos.
 */
export function validateGraduationRequirements(
  character: Character,
  art: MartialArtType
): GraduationEligibility {
  const meta = MARTIAL_ARTS_META[art];
  const currentGrad = character.artGraduations?.[art] || {
    rankIndex: 0,
    name: meta.ranks[0].name,
    xp: 0,
    xpNeeded: meta.ranks[0].xpNeeded,
    monthsInRank: 0
  };

  const currentRankIndex = currentGrad.rankIndex;
  const isMaxRank = currentRankIndex >= meta.ranks.length - 1;
  const isMma = art === 'mma';
  const monthsInRank = currentGrad.monthsInRank ?? 0;

  if (isMaxRank) {
    return {
      canAdvance: false,
      isMaxRank: true,
      isMma,
      currentRank: {
        name: currentGrad.name,
        rankIndex: currentRankIndex,
        xp: currentGrad.xp,
        xpNeeded: currentGrad.xpNeeded,
        monthsInRank
      },
      requirements: [],
      reason: isMma 
        ? 'Você alcançou o ápice absoluto do esporte: Campeão Mundial Peso por Peso do Octógono!'
        : `Você alcançou a graduação máxima oficial de ${meta.name} reconhecida pela ${meta.federation}.`
    };
  }

  const nextRank = meta.ranks[currentRankIndex + 1];
  const requirements: RequirementCheck[] = [];

  // 1. XP de Faixa / Prática acumulada
  const xpMet = currentGrad.xp >= currentGrad.xpNeeded;
  requirements.push({
    label: isMma ? 'Experiência Acumulada no Octógono' : 'XP de Treino & Fundamentos',
    current: currentGrad.xp,
    required: currentGrad.xpNeeded,
    met: xpMet
  });

  // 2. Idade Mínima Regulamentar
  if (nextRank.minAge !== undefined) {
    const ageMet = character.age >= nextRank.minAge;
    requirements.push({
      label: 'Idade Mínima Regulamentar da Federação',
      current: `${character.age} anos`,
      required: `${nextRank.minAge} anos`,
      met: ageMet
    });
  }

  // 3. Tempo Mínimo de Permanência na Faixa Atual (Carência)
  if (nextRank.minMonthsInRank !== undefined) {
    const monthsMet = monthsInRank >= nextRank.minMonthsInRank;
    requirements.push({
      label: 'Tempo Mínimo de Permanência (Carência)',
      current: `${monthsInRank} meses`,
      required: `${nextRank.minMonthsInRank} meses`,
      met: monthsMet
    });
  }

  // 4. Refino Técnico Mínimo
  if (nextRank.minTechnique !== undefined) {
    const techMet = (character.attributes?.technique || 0) >= nextRank.minTechnique;
    requirements.push({
      label: 'Nível de Refino Técnico Requerido',
      current: (character.attributes?.technique || 0).toFixed(0),
      required: nextRank.minTechnique,
      met: techMet
    });
  }

  // 5. QI de Luta e Leitura Tática Mínima
  if (nextRank.minFightIq !== undefined) {
    const iqMet = (character.attributes?.fightIq || 0) >= nextRank.minFightIq;
    requirements.push({
      label: 'QI de Luta e Maturidade Tática',
      current: (character.attributes?.fightIq || 0).toFixed(0),
      required: nextRank.minFightIq,
      met: iqMet
    });
  }

  // 6. Requisito Exclusivo do MMA: Vitórias e Cartel Oficial no Octógono
  if (isMma && nextRank.minMmaWins !== undefined) {
    const mmaWins = character.record?.mmaWins || 0;
    const winsMet = mmaWins >= nextRank.minMmaWins;
    requirements.push({
      label: 'Vitórias Oficiais no Octógono (Cartel de MMA)',
      current: `${mmaWins} vitórias`,
      required: `${nextRank.minMmaWins} vitórias`,
      met: winsMet
    });
  }

  // 7. Avaliação Disciplinar do Mestre (frequência efetiva sem punir faltas justificadas e nota escolar se < 18 anos)
  if (!isMma) {
    const masterAtt = getEffectiveMasterAttendance(character.classSessions || []);
    const validTotal = masterAtt.attended + masterAtt.unjustifiedAbsences;
    if (validTotal >= 5) {
      requirements.push({
        label: 'Disciplina & Frequência no Dojô (Avaliação do Mestre)',
        current: `${masterAtt.effectiveRate}%`,
        required: '70%',
        met: masterAtt.effectiveRate >= 70
      });
    }

    if (character.age < 18) {
      const grade = character.schoolGrade ?? 7.0;
      requirements.push({
        label: 'Boletim Escolar Mínimo (Regra do Mestre)',
        current: `${grade.toFixed(1)}/10`,
        required: '6.0/10',
        met: grade >= 6.0
      });
    }
  }

  const allMet = requirements.every((r) => r.met);

  let reason: string | undefined;
  if (!allMet) {
    const unmet = requirements.filter((r) => !r.met);
    reason = `Requisitos pendentes: ${unmet.map((u) => `${u.label} (${u.current}/${u.required})`).join('; ')}.`;
  }

  return {
    canAdvance: allMet,
    isMaxRank: false,
    isMma,
    currentRank: {
      name: currentGrad.name,
      rankIndex: currentRankIndex,
      xp: currentGrad.xp,
      xpNeeded: currentGrad.xpNeeded,
      monthsInRank
    },
    nextRank: {
      name: nextRank.name,
      color: nextRank.color,
      textColor: nextRank.textColor,
      gradientStyle: nextRank.gradientStyle,
      categoryName: nextRank.categoryName,
      stageNumber: nextRank.stageNumber,
      estimatedTime: nextRank.estimatedTime,
      minAge: nextRank.minAge,
      minMonthsInRank: nextRank.minMonthsInRank,
      minTechnique: nextRank.minTechnique,
      minFightIq: nextRank.minFightIq,
      minMmaWins: nextRank.minMmaWins,
      evaluationCriteria: nextRank.evaluationCriteria
    },
    requirements,
    reason
  };
}

/**
 * Concede XP de graduação com proteção de teto (cap) e prevenção de XP excedente infinito.
 * Quando o atleta atinge o limite do rank atual e ainda não cumpriu os requisitos (idade, carência, etc.),
 * o XP é mantido exatamente no teto (currentGrad.xpNeeded), impedindo anomalias como 4.325/3.600 XP.
 * Para MMA, não adiciona XP de faixa; o desenvolvimento é focado em atributos e cartel competitivo.
 */
export function addTrainingGraduationXp(
  character: Character,
  art: MartialArtType,
  baseXp: number,
  gymMultiplier: number = 1.0
): { updatedChar: Character; xpAdded: number; wasCapped: boolean } {
  const updated = JSON.parse(JSON.stringify(character)) as Character;

  // No MMA, o treinamento em academia desenvolve atributos e técnicas, não 'faixa'.
  if (art === 'mma') {
    const mmaGrad = updated.artGraduations?.mma;
    if (mmaGrad) {
      // Mantém dentro do teto seguro se já estiver acima
      if (mmaGrad.xp > mmaGrad.xpNeeded) {
        mmaGrad.xp = mmaGrad.xpNeeded;
      }
    }
    return { updatedChar: updated, xpAdded: 0, wasCapped: false };
  }

  if (!updated.artGraduations || !updated.artGraduations[art]) {
    return { updatedChar: updated, xpAdded: 0, wasCapped: false };
  }

  const grad = updated.artGraduations[art];
  const meta = MARTIAL_ARTS_META[art];
  const isMaxRank = grad.rankIndex >= meta.ranks.length - 1;

  if (isMaxRank) {
    grad.xp = grad.xpNeeded;
    return { updatedChar: updated, xpAdded: 0, wasCapped: true };
  }

  // O bônus da academia afeta atributos e aprendizado técnico, enquanto a progressão
  // de graduação federativa tradicional é moderada (máximo 1.25x para evitar desvirtuamento das faixas).
  const normalizedMultiplier = Math.min(1.25, Math.max(1.0, 1.0 + (gymMultiplier - 1.0) * 0.25));
  const talentBonus = getActiveArtTalentBonus(updated, art);
  const calculatedXp = Math.round(baseXp * normalizedMultiplier * talentBonus.xpMultiplier);

  const prevXp = grad.xp;
  // Limita o acúmulo no teto da graduação até que o exame seja realizado
  const newXp = Math.min(grad.xpNeeded, prevXp + calculatedXp);
  const actualAdded = newXp - prevXp;
  const wasCapped = newXp >= grad.xpNeeded;

  grad.xp = newXp;

  if (art === 'jiujitsu') {
    const nextRankDef = meta.ranks[grad.rankIndex + 1];
    const computedStripes = computeBjjStripesFromProgress(
      grad.rankIndex,
      grad.xp,
      grad.xpNeeded,
      grad.monthsInRank ?? 0,
      nextRankDef?.minMonthsInRank
    );
    grad.stripes = Math.max(grad.stripes || 0, computedStripes);
    grad.masteryTitle = formatBjjBeltWithDegree(grad.rankIndex, grad.name, grad.stripes);
  }

  return { updatedChar: updated, xpAdded: actualAdded, wasCapped };
}

/**
 * Promove o atleta para a próxima graduação com transferência de XP excedente (rollover)
 * e registro oficial imutável no histórico de graduações.
 * Reseta o contador de meses na graduação atual e aplica os metadados oficiais do novo rank.
 */
export function promoteGraduation(
  character: Character,
  art: MartialArtType,
  options?: {
    ceremonyCost?: number;
    paidByFamily?: boolean;
    masterName?: string;
  }
): { updatedChar: Character; success: boolean; message: string; newRankName?: string } {
  const validation = validateGraduationRequirements(character, art);
  if (!validation.canAdvance || !validation.nextRank) {
    return {
      updatedChar: character,
      success: false,
      message: validation.reason || 'Requisitos não cumpridos para promoção.'
    };
  }

  const updated = JSON.parse(JSON.stringify(character)) as Character;
  const meta = MARTIAL_ARTS_META[art];
  const currentGrad = updated.artGraduations[art];
  const nextRank = meta.ranks[currentGrad.rankIndex + 1];
  const oldRankName = currentGrad.name;

  // Cálculo de XP excedente (rollover) seguro
  const surplusXp = Math.max(0, currentGrad.xp - currentGrad.xpNeeded);
  // O rollover transfere o excesso com teto de 35% do próximo rank para não pular faixas
  const carriedOverXp = Math.min(surplusXp, Math.round(nextRank.xpNeeded * 0.35));

  currentGrad.rankIndex += 1;
  currentGrad.name = nextRank.name;
  currentGrad.color = nextRank.color;
  currentGrad.textColor = nextRank.textColor;
  currentGrad.gradientStyle = nextRank.gradientStyle;
  currentGrad.stageNumber = nextRank.stageNumber;
  currentGrad.categoryName = nextRank.categoryName;
  currentGrad.evaluationCriteria = nextRank.evaluationCriteria;
  currentGrad.estimatedTime = nextRank.estimatedTime;
  currentGrad.xp = carriedOverXp;
  currentGrad.xpNeeded = nextRank.xpNeeded;
  currentGrad.stripes = 0;
  currentGrad.masteryTitle =
    art === 'jiujitsu'
      ? formatBjjBeltWithDegree(currentGrad.rankIndex, nextRank.name, 0)
      : nextRank.name;
  currentGrad.monthsInRank = 0; // Reinicia a contagem de carência na nova graduação

  // Registro imutável no histórico oficial de graduações do atleta
  if (!updated.graduationHistory) {
    updated.graduationHistory = [];
  }

  const historyRecord = {
    id: `grad_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date: { ...updated.currentDate },
    art,
    previousRank: oldRankName,
    newRank: nextRank.name,
    masterName: options?.masterName || 'Mestre da Academia',
    ceremonyCost: options?.ceremonyCost ?? 0,
    paidByFamily: options?.paidByFamily ?? false,
    notes: nextRank.evaluationCriteria
  };

  updated.graduationHistory.unshift(historyRecord);

  // Limpa aviso prévio de cerimônia se coincidir com esta arte
  if (updated.pendingCeremonyNotice && updated.pendingCeremonyNotice.art === art) {
    delete updated.pendingCeremonyNotice;
  }

  const message = art === 'mma'
    ? `🏆 Ascensão no Octógono! Você foi promovido a "${nextRank.name}" pelos seus resultados no MMA!`
    : `🥋 Exame Aprovado! Você foi promovido a "${nextRank.name}" em ${meta.name} perante a ${meta.federation}!`;

  return {
    updatedChar: updated,
    success: true,
    message,
    newRankName: nextRank.name
  };
}

/**
 * Transição oficial aos 16 anos (CBJJ e Capoeira Muzenza).
 * Converte graduações da infância para faixas adultas correspondentes sem perda de tempo ou XP.
 */
export function checkAgeTransitions(character: Character): { updatedChar: Character; logs: string[] } {
  const updated = JSON.parse(JSON.stringify(character)) as Character;
  const logs: string[] = [];

  if (updated.age < 16) {
    return { updatedChar: updated, logs };
  }

  // 1. Jiu-Jitsu Brasileiro: Transição aos 16 anos (CBJJ / IBJJF)
  const bjjGrad = updated.artGraduations?.jiujitsu;
  if (bjjGrad) {
    // Se o atleta está em uma faixa infantil (Cinza = index 1, Amarela = 2, Laranja = 3, Verde = 4)
    if (bjjGrad.rankIndex >= 1 && bjjGrad.rankIndex <= 4) {
      const bjjMeta = MARTIAL_ARTS_META.jiujitsu;
      const oldName = bjjGrad.name;

      // Verde (index 4) com refino técnico elevado (>= 38) pode transicionar para Roxa (index 6), caso contrário Azul (index 5)
      let targetIndex = 5; // Faixa Azul
      if (bjjGrad.rankIndex === 4 && (updated.attributes?.technique || 0) >= 38) {
        targetIndex = 6; // Faixa Roxa
      }

      const adultRank = bjjMeta.ranks[targetIndex];
      bjjGrad.rankIndex = targetIndex;
      bjjGrad.name = adultRank.name;
      bjjGrad.color = adultRank.color;
      bjjGrad.textColor = adultRank.textColor;
      bjjGrad.categoryName = adultRank.categoryName;
      bjjGrad.evaluationCriteria = adultRank.evaluationCriteria;
      bjjGrad.estimatedTime = adultRank.estimatedTime;
      bjjGrad.xpNeeded = adultRank.xpNeeded;
      bjjGrad.xp = Math.min(bjjGrad.xp, adultRank.xpNeeded);
      bjjGrad.stripes = 0;
      bjjGrad.masteryTitle = formatBjjBeltWithDegree(targetIndex, adultRank.name, 0);
      bjjGrad.monthsInRank = 0;

      if (!updated.graduationHistory) updated.graduationHistory = [];
      updated.graduationHistory.unshift({
        id: `trans_bjj_16_${Date.now()}`,
        date: { ...updated.currentDate },
        art: 'jiujitsu',
        previousRank: oldName,
        newRank: adultRank.name,
        masterName: 'Conselho de Faixas CBJJ',
        ceremonyCost: 0,
        paidByFamily: true,
        notes: `Transição oficial regulamentar de faixa infantil para adulta aos 16 anos conforme regras da CBJJ/IBJJF.`
      });

      logs.push(`🥋 Transição CBJJ/IBJJF (16 Anos): Sua graduação juvenil (${oldName}) foi oficialmente convertida para ${adultRank.name}! Bem-vindo à divisão adulta.`);
    }
  }

  // 2. Capoeira Grupo Muzenza: Transição das 17 cordas infantis para cordas adultas aos 16 anos
  const capGrad = updated.artGraduations?.capoeira;
  if (capGrad) {
    // Cordas infantis Muzenza vão de index 0 a 16 (stageNumber 1 a 17)
    if (capGrad.rankIndex >= 0 && capGrad.rankIndex <= 16) {
      const capMeta = MARTIAL_ARTS_META.capoeira;
      const oldName = capGrad.name;

      // Mapeamento proporcional para os 22 estágios adultos (iniciando em index 17 = Corda Cinza)
      let targetIndex = 17; // Corda Cinza adulto
      if (capGrad.rankIndex >= 14) {
        targetIndex = 23; // Corda Verde adulto (estágio 24)
      } else if (capGrad.rankIndex >= 10) {
        targetIndex = 21; // Corda Laranja adulto (estágio 22)
      } else if (capGrad.rankIndex >= 6) {
        targetIndex = 19; // Corda Amarelo adulto (estágio 20)
      } else if (capGrad.rankIndex >= 3) {
        targetIndex = 18; // Corda Cinza-Amarelo adulto (estágio 19)
      }

      const adultRank = capMeta.ranks[targetIndex];
      capGrad.rankIndex = targetIndex;
      capGrad.name = adultRank.name;
      capGrad.color = adultRank.color;
      capGrad.textColor = adultRank.textColor;
      capGrad.gradientStyle = adultRank.gradientStyle;
      capGrad.stageNumber = adultRank.stageNumber;
      capGrad.categoryName = adultRank.categoryName;
      capGrad.evaluationCriteria = adultRank.evaluationCriteria;
      capGrad.estimatedTime = adultRank.estimatedTime;
      capGrad.xpNeeded = adultRank.xpNeeded;
      capGrad.xp = Math.min(capGrad.xp, adultRank.xpNeeded);
      capGrad.monthsInRank = 0;

      if (!updated.graduationHistory) updated.graduationHistory = [];
      updated.graduationHistory.unshift({
        id: `trans_cap_16_${Date.now()}`,
        date: { ...updated.currentDate },
        art: 'capoeira',
        previousRank: oldName,
        newRank: adultRank.name,
        masterName: 'Mestre do Grupo Muzenza',
        ceremonyCost: 0,
        paidByFamily: true,
        notes: `Transição oficial de corda infantil para estágio adulto no Grupo Muzenza de Capoeira aos 16 anos.`
      });

      logs.push(`🪢 Transição Grupo Muzenza (16 Anos): Seu batizado de infância (${oldName}) foi consagrado na roda adulta como ${adultRank.name}!`);
    }
  }

  return { updatedChar: updated, logs };
}

/**
 * Evolução, lutas independentes, graduação federativa e transferências autônomas
 * de academias para todos os NPCs do mundo (independente das ações do jogador).
 * Persiste deltas enxutos em `character.npcWorldState` e sincroniza `character.rivals`.
 */
export function processAutonomousNpcGraduations(
  character: Character,
  rng: () => number = Math.random
): { updatedChar: Character; logs: string[] } {
  const updated = JSON.parse(JSON.stringify(character)) as Character;
  const logs: string[] = [];

  if (!Array.isArray(updated.rivals)) {
    updated.rivals = [];
  }
  if (!updated.npcWorldState || typeof updated.npcWorldState !== 'object') {
    updated.npcWorldState = {};
  }
  if (!Array.isArray(updated.socialFeed)) {
    updated.socialFeed = [];
  }

  const elapsedYears = Math.floor((updated.careerMonthsElapsed || 0) / 12);
  const dateMonth = updated.currentDate?.month ?? updated.currentMonth ?? 1;
  const dateYear = updated.currentDate?.year ?? updated.currentYear ?? 2026;
  const dateLabel = `${String(dateMonth).padStart(2, '0')}/${dateYear}`;

  const rivalIndexById = new Map<string, number>();
  updated.rivals.forEach((r, idx) => {
    rivalIndexById.set(r.id, idx);
  });

  const promotionLogs: string[] = [];
  const transferLogs: string[] = [];
  let extraPromotions = 0;
  let extraTransfers = 0;

  const isGrapplingArt = (art: MartialArtType) =>
    art === 'jiujitsu' || art === 'judo' || art === 'lutalivre';

  const evolveOneNpc = (params: {
    id: string;
    name: string;
    avatar: string;
    art: MartialArtType;
    age: number;
    baseRankIndex: number;
    baseBelt: string;
    baseStripes: number;
    baseGymId: string;
    baseGymName?: string;
    baseCity?: string;
    baseCountry?: string;
    baseMonthsInRank: number;
    baseXp: number;
    baseWins: number;
    baseLosses: number;
    baseKos: number;
    baseSubs: number;
    baseRep: number;
    wealthTier?: RivalNPC['wealthTier'];
    tech: number;
    iq: number;
    avgAttr: number;
    statBoost: number;
    isNotable: boolean;
    prevTransferNote?: string;
    prevTransferCount: number;
    rivalRef?: RivalNPC;
    baseSeed?: typeof WORLD_FIGHTERS[number];
  }) => {
    const meta = MARTIAL_ARTS_META[params.art];
    if (!meta) return;

    let rankIndex = params.baseRankIndex;
    let belt = params.baseBelt;
    let stripes = params.baseStripes;
    let gymId = params.baseGymId || 'gym_bairro';
    let gymName = params.baseGymName;
    let city = params.baseCity;
    let country = params.baseCountry;
    let monthsInRank = params.baseMonthsInRank + 1;
    let xp = params.baseXp;
    let wins = params.baseWins;
    let losses = params.baseLosses;
    let kos = params.baseKos;
    let subs = params.baseSubs;
    let rep = params.baseRep;
    let statBoost = params.statBoost;
    let tech = params.tech;
    let iq = params.iq;
    let avgAttr = params.avgAttr;
    let transferNote = params.prevTransferNote;
    let transferCount = params.prevTransferCount;

    const currentGym = WORLD_GYMS.find((g) => g.id === gymId) || WORLD_GYMS[0];
    const wealthInfo = getWealthTierInfo(params.wealthTier);
    const isWealthy = params.wealthTier === 'milionario' || params.wealthTier === 'abastado';
    const gymFocusBonus = currentGym.focusArts.includes(params.art) ? 1.15 : 0.92;

    // 1. Treino mensal autônomo (XP de graduação + evolução gradual de atributos)
    const artXpScale = params.art === 'jiujitsu' ? 3.2 : 1.0;
    const monthlyXpGain = Math.round(
      (52 + rng() * 44) * currentGym.learningSpeedMultiplier * wealthInfo.trainingBonus * gymFocusBonus * artXpScale
    );
    xp += monthlyXpGain;

    const maxStatCap = params.age < 14 ? 42 : params.age < 18 ? 64 : 94;
    const attrGrowChance = Math.min(0.65, 0.28 * currentGym.learningSpeedMultiplier * wealthInfo.trainingBonus);
    if (avgAttr < maxStatCap && rng() < attrGrowChance) {
      statBoost += 1;
      tech = Math.min(99, tech + 1);
      if (rng() < 0.7) iq = Math.min(99, iq + 1);
      avgAttr = Math.min(99, avgAttr + 1);
      if (params.rivalRef) {
        const a = params.rivalRef.attributes;
        a.technique = Math.min(99, a.technique + 1);
        a.stamina = Math.min(99, a.stamina + 1);
        if (rng() < 0.65) a.fightIq = Math.min(99, a.fightIq + 1);
        if (rng() < 0.5) a.strength = Math.min(99, a.strength + 1);
        if (rng() < 0.5) a.speed = Math.min(99, a.speed + 1);
      }
    }

    // 2. Combates independentes no circuito mundial (mesmo sem interação do PJ)
    if (params.age >= 9) {
      const fightChance = isWealthy ? 0.27 : 0.21;
      if (rng() < fightChance) {
        const winProb = Math.max(
          0.32,
          Math.min(0.84, 0.5 + (tech + iq - 50) * 0.004 + (currentGym.learningSpeedMultiplier - 1) * 0.08)
        );
        if (rng() < winProb) {
          wins += 1;
          rep += currentGym.learningSpeedMultiplier >= 1.5 ? 11 : 7;
          xp += 45;
          if (params.art === 'mma') {
            if (rng() < 0.4) kos += 1;
            else if (rng() < 0.75) subs += 1;
          } else if (isGrapplingArt(params.art)) {
            if (rng() < 0.52) subs += 1;
          } else {
            if (rng() < 0.42) kos += 1;
          }
        } else {
          losses += 1;
          rep = Math.max(5, rep - 3);
          xp += 22;
        }
      }
    }

    // 3. Transição etária oficial aos 16 anos (CBJJ e Capoeira Muzenza)
    if (params.age >= 16) {
      if (params.art === 'jiujitsu' && rankIndex >= 1 && rankIndex <= 4) {
        const targetIdx = rankIndex === 4 && tech >= 38 ? 6 : 5;
        const adultRank = meta.ranks[targetIdx];
        if (adultRank) {
          rankIndex = targetIdx;
          belt = adultRank.name;
          monthsInRank = 0;
          xp = Math.min(xp, adultRank.xpNeeded);
          rep += 15;
        }
      } else if (params.art === 'capoeira' && rankIndex <= 16) {
        const targetIdx =
          rankIndex >= 14 ? 23 : rankIndex >= 10 ? 21 : rankIndex >= 6 ? 19 : rankIndex >= 3 ? 18 : 17;
        const adultRank = meta.ranks[targetIdx];
        if (adultRank) {
          rankIndex = targetIdx;
          belt = adultRank.name;
          monthsInRank = 0;
          xp = Math.min(xp, adultRank.xpNeeded);
          rep += 15;
        }
      }
    }

    // 4. Exame e Graduação Federativa Autônoma
    if (rankIndex < meta.ranks.length - 1) {
      const nextRank = meta.ranks[rankIndex + 1];
      const ageMet = nextRank.minAge !== undefined ? params.age >= nextRank.minAge : true;
      const monthsMet =
        nextRank.minMonthsInRank !== undefined ? monthsInRank >= nextRank.minMonthsInRank : monthsInRank >= 4;
      const techMet = nextRank.minTechnique !== undefined ? tech >= nextRank.minTechnique : true;
      const iqMet = nextRank.minFightIq !== undefined ? iq >= nextRank.minFightIq : true;
      const winsMet =
        params.art === 'mma' && nextRank.minMmaWins !== undefined ? wins >= nextRank.minMmaWins : true;
      const xpMet = xp >= nextRank.xpNeeded;

      if (ageMet && monthsMet && techMet && iqMet && winsMet && xpMet) {
        const examChance = params.art === 'mma' ? 0.85 : 0.45;
        if (rng() < examChance) {
          rankIndex += 1;
          stripes = 0;
          belt =
            params.art === 'jiujitsu'
              ? formatBjjBeltWithDegree(rankIndex, nextRank.name, 0)
              : nextRank.name;
          monthsInRank = 0;
          xp = Math.max(0, Math.min(xp - nextRank.xpNeeded, Math.round((nextRank.xpNeeded || 500) * 0.25)));
          statBoost += 1;
          tech = Math.min(99, tech + 2);
          iq = Math.min(99, iq + 1);
          rep += 18;
          if (params.rivalRef) {
            params.rivalRef.attributes.technique = Math.min(99, params.rivalRef.attributes.technique + 2);
            params.rivalRef.attributes.fightIq = Math.min(99, params.rivalRef.attributes.fightIq + 1);
          }

          if (params.isNotable || rep >= 180) {
            if (promotionLogs.length < 4) {
              promotionLogs.push(
                `🥋 Graduação no Circuito: ${params.name} foi promovido(a) a "${belt}" em ${meta.name}!`
              );
            } else {
              extraPromotions += 1;
            }
          }
        }
      }
    }

    // 4.1 Atualiza graus (stripes) do BJJ por evolução na faixa
    if (params.art === 'jiujitsu') {
      const curRankDef = meta.ranks[rankIndex] || meta.ranks[0];
      const nextRankDef = meta.ranks[rankIndex + 1];
      const computed = computeBjjStripesFromProgress(
        rankIndex,
        xp,
        curRankDef?.xpNeeded || 1000,
        monthsInRank,
        nextRankDef?.minMonthsInRank
      );
      stripes = Math.max(stripes, computed);
      belt = formatBjjBeltWithDegree(rankIndex, curRankDef?.name || belt, stripes);
    }

    // 5. Transferência autônoma de academia (WORLD_GYMS)
    const eligibleGyms = WORLD_GYMS.filter((g) => {
      if (g.id === gymId || g.id === 'gym_bairro') return false;
      if (!g.focusArts.includes(params.art)) return false;
      if (rankIndex < g.minRank) return false;
      if (iq < g.minFightIq) return false;
      const effectiveRepReq = Math.round(g.reputationReq * (isWealthy ? 0.7 : 1));
      if (rep < effectiveRepReq) return false;
      if (g.country !== 'Brasil' && params.age < 16 && !isWealthy) return false;
      return true;
    });

    if (eligibleGyms.length > 0 && transferCount < 5) {
      const upgradeGyms = eligibleGyms.filter(
        (g) => g.learningSpeedMultiplier > currentGym.learningSpeedMultiplier
      );
      const lateralElite =
        currentGym.learningSpeedMultiplier >= 1.55
          ? eligibleGyms.filter((g) => g.learningSpeedMultiplier >= 1.55)
          : [];

      let chosenGym = undefined as typeof WORLD_GYMS[number] | undefined;
      const upgradeChance = isWealthy ? 0.22 : 0.13;

      if (upgradeGyms.length > 0 && rng() < upgradeChance) {
        upgradeGyms.sort((a, b) => b.learningSpeedMultiplier - a.learningSpeedMultiplier);
        const topPool = upgradeGyms.slice(0, 2);
        chosenGym = topPool[Math.floor(rng() * topPool.length)];
      } else if (lateralElite.length > 0 && params.age >= 18 && rep >= 160 && rng() < 0.035) {
        chosenGym = lateralElite[Math.floor(rng() * lateralElite.length)];
      }

      if (chosenGym) {
        const previousGymName = currentGym.name;
        gymId = chosenGym.id;
        gymName = chosenGym.name;
        city = chosenGym.city;
        country = chosenGym.country;
        transferCount += 1;
        transferNote = `Transferiu-se para ${chosenGym.name} (${dateLabel})`;

        if (params.isNotable || rep >= 130) {
          if (transferLogs.length < 3) {
            transferLogs.push(
              `✈️ Transferência no Circuito: ${params.name} deixou ${previousGymName} para treinar na ${chosenGym.name} (${chosenGym.city}, ${chosenGym.country})!`
            );
          } else {
            extraTransfers += 1;
          }

          if (updated.socialFeed.length < 60 && rng() < 0.6) {
            updated.socialFeed.unshift({
              id: `transfer_${params.id}_${dateYear}_${dateMonth}`,
              author: 'Mercado da Luta News',
              handle: '@mercadodaluta_oficial',
              text: `✈️ Mudança de Camp! ${params.avatar} ${params.name} assinou com a ${chosenGym.name} (${chosenGym.city}, ${chosenGym.country}) para elevar seu nível em ${meta.name}.`,
              time: dateLabel,
              likes: Math.round(rep * 0.9 + 25),
              verified: true
            });
          }
        }
      }
    }

    // Sincroniza no rivalRef se existir em updated.rivals
    if (params.rivalRef) {
      params.rivalRef.age = params.age;
      params.rivalRef.ageCategory = getAgeCategoryFromAge(params.age);
      params.rivalRef.rankIndex = rankIndex;
      params.rivalRef.belt = belt;
      params.rivalRef.stripes = stripes;
      params.rivalRef.gymId = gymId;
      params.rivalRef.gymName = gymName;
      params.rivalRef.city = city;
      params.rivalRef.country = country;
      params.rivalRef.monthsInRank = monthsInRank;
      params.rivalRef.npcXp = xp;
      params.rivalRef.reputation = rep;
      params.rivalRef.lastGymTransferNote = transferNote;
      params.rivalRef.gymTransferCount = transferCount;
      params.rivalRef.record = {
        ...params.rivalRef.record,
        wins,
        losses,
        kos,
        subs
      };
    }

    // Persiste delta compacto em npcWorldState para NPCs de WORLD_FIGHTERS
    if (params.baseSeed) {
      const bs = params.baseSeed;
      const delta: NpcWorldDelta = {};
      if (rankIndex !== (bs.rankIndex ?? 0)) delta.rk = rankIndex;
      if (belt !== bs.belt) delta.b = belt;
      if (stripes !== (bs.stripes ?? 0)) delta.sp = stripes;
      if (gymId !== bs.gymId) delta.g = gymId;
      if (gymName && gymName !== bs.gymName) delta.gn = gymName;
      if (city && city !== bs.city) delta.c = city;
      if (country && country !== bs.country) delta.co = country;
      if (monthsInRank !== (bs.monthsInRank ?? 0)) delta.mi = monthsInRank;
      if (xp > 0) delta.xp = xp;
      if (wins !== bs.record.wins) delta.w = wins;
      if (losses !== bs.record.losses) delta.l = losses;
      if (kos !== bs.record.kos) delta.kos = kos;
      if (subs !== bs.record.subs) delta.subs = subs;
      if (rep !== bs.reputation) delta.rep = rep;
      if (statBoost > 0) delta.st = statBoost;
      if (transferNote) delta.tr = transferNote;
      if (transferCount > 0) delta.tc = transferCount;

      if (Object.keys(delta).length > 0) {
        updated.npcWorldState![params.id] = delta;
      }
    }
  };

  // A. Evolui todos os atletas catalogados em WORLD_FIGHTERS
  for (const wf of WORLD_FIGHTERS) {
    const rivalIdx = rivalIndexById.get(wf.id);
    const rival = rivalIdx !== undefined ? updated.rivals[rivalIdx] : undefined;
    const prevDelta = updated.npcWorldState[wf.id];
    const art = normalizeMartialArt(rival?.art ?? wf.art, wf.art);
    const age = wf.age + elapsedYears;
    const statBoost = prevDelta?.st ?? 0;

    const baseAttrs = rival?.attributes || wf.attributes;
    const tech = Math.min(99, baseAttrs.technique + (rival ? 0 : statBoost));
    const iq = Math.min(99, baseAttrs.fightIq + (rival ? 0 : statBoost));
    const avgAttr = Math.round(
      (baseAttrs.strength +
        baseAttrs.speed +
        baseAttrs.stamina +
        baseAttrs.durability +
        baseAttrs.technique +
        baseAttrs.fightIq) /
        6 +
        (rival ? 0 : statBoost)
    );

    evolveOneNpc({
      id: wf.id,
      name: rival?.name || wf.name,
      avatar: rival?.avatar || wf.avatar,
      art,
      age,
      baseRankIndex: rival?.rankIndex ?? prevDelta?.rk ?? wf.rankIndex ?? 0,
      baseBelt: rival?.belt ?? prevDelta?.b ?? wf.belt,
      baseStripes: rival?.stripes ?? prevDelta?.sp ?? wf.stripes ?? 0,
      baseGymId: rival?.gymId ?? prevDelta?.g ?? wf.gymId ?? 'gym_bairro',
      baseGymName: rival?.gymName ?? prevDelta?.gn ?? wf.gymName,
      baseCity: rival?.city ?? prevDelta?.c ?? wf.city,
      baseCountry: rival?.country ?? prevDelta?.co ?? wf.country,
      baseMonthsInRank: rival?.monthsInRank ?? prevDelta?.mi ?? wf.monthsInRank ?? 0,
      baseXp: rival?.npcXp ?? prevDelta?.xp ?? wf.npcXp ?? 0,
      baseWins: rival?.record?.wins ?? prevDelta?.w ?? wf.record.wins,
      baseLosses: rival?.record?.losses ?? prevDelta?.l ?? wf.record.losses,
      baseKos: rival?.record?.kos ?? prevDelta?.kos ?? wf.record.kos,
      baseSubs: rival?.record?.subs ?? prevDelta?.subs ?? wf.record.subs,
      baseRep: rival?.reputation ?? prevDelta?.rep ?? wf.reputation,
      wealthTier: rival?.wealthTier ?? wf.wealthTier,
      tech,
      iq,
      avgAttr,
      statBoost,
      isNotable: Boolean(wf.isStarterRival || rival),
      prevTransferNote: rival?.lastGymTransferNote ?? prevDelta?.tr ?? wf.lastGymTransferNote,
      prevTransferCount: rival?.gymTransferCount ?? prevDelta?.tc ?? wf.gymTransferCount ?? 0,
      rivalRef: rival,
      baseSeed: wf
    });
  }

  // B. Evolui eventuais rivais customizados fora do catálogo WORLD_FIGHTERS
  const worldIds = new Set(WORLD_FIGHTERS.map((w) => w.id));
  for (const rival of updated.rivals) {
    if (worldIds.has(rival.id)) continue;
    const safeArt = normalizeMartialArt(rival.art, 'lutalivre');
    rival.art = safeArt;
    const avgAttr = Math.round(
      (rival.attributes.strength +
        rival.attributes.speed +
        rival.attributes.stamina +
        rival.attributes.durability +
        rival.attributes.technique +
        rival.attributes.fightIq) /
        6
    );
    evolveOneNpc({
      id: rival.id,
      name: rival.name,
      avatar: rival.avatar,
      art: safeArt,
      age: rival.age,
      baseRankIndex: rival.rankIndex ?? 0,
      baseBelt: rival.belt,
      baseStripes: rival.stripes ?? 0,
      baseGymId: rival.gymId || 'gym_bairro',
      baseGymName: rival.gymName,
      baseCity: rival.city,
      baseCountry: rival.country,
      baseMonthsInRank: rival.monthsInRank ?? 0,
      baseXp: rival.npcXp ?? 0,
      baseWins: rival.record.wins,
      baseLosses: rival.record.losses,
      baseKos: rival.record.kos,
      baseSubs: rival.record.subs,
      baseRep: rival.reputation,
      wealthTier: rival.wealthTier,
      tech: rival.attributes.technique,
      iq: rival.attributes.fightIq,
      avgAttr,
      statBoost: 0,
      isNotable: true,
      prevTransferNote: rival.lastGymTransferNote,
      prevTransferCount: rival.gymTransferCount ?? 0,
      rivalRef: rival
    });
  }

  logs.push(...promotionLogs);
  if (extraPromotions > 0) {
    logs.push(`🥋 Circuito Mundial: Outros ${extraPromotions} atletas também avançaram de graduação neste mês.`);
  }
  logs.push(...transferLogs);
  if (extraTransfers > 0) {
    logs.push(`✈️ Mercado de Academias: Mais ${extraTransfers} atletas trocaram de equipe pelo mundo.`);
  }

  return { updatedChar: updated, logs };
}

/**
 * Verifica e processa a ascensão competitiva de tiers no MMA baseada em cartel de vitórias e idade.
 * Sem exame de faixa ou botões de tatame.
 */
export function checkMmaTierProgression(
  character: Character
): { updatedChar: Character; promoted: boolean; newTierName?: string; log?: string } {
  const validation = validateGraduationRequirements(character, 'mma');
  if (!validation.canAdvance || !validation.nextRank) {
    return { updatedChar: character, promoted: false };
  }

  const result = promoteGraduation(character, 'mma');
  if (result.success) {
    return {
      updatedChar: result.updatedChar,
      promoted: true,
      newTierName: result.newRankName,
      log: result.message
    };
  }

  return { updatedChar: character, promoted: false };
}

/**
 * Normaliza e audita graduações de um personagem (para criação ou migração de saves).
 * Garante que personagens de 19 anos não tenham faixas incompatíveis com a idade (ex: Coral 50 anos ou Vermelha 67 anos),
 * limitando a graduação ao teto legal máximo da idade atual do atleta.
 */
export function auditAndNormalizeCharacterGraduations(character: Character): Character {
  const updated = JSON.parse(JSON.stringify(character)) as Character;
  if (!updated.artGraduations) return updated;

  const arts: MartialArtType[] = ['boxe', 'jiujitsu', 'muaythai', 'karate', 'judo', 'capoeira', 'lutalivre', 'mma'];

  arts.forEach((art) => {
    const grad = updated.artGraduations[art];
    if (!grad) return;
    const meta = MARTIAL_ARTS_META[art];

    // 1. Inicializa monthsInRank se ausente
    if (grad.monthsInRank === undefined) {
      grad.monthsInRank = Math.max(0, updated.careerMonthsElapsed || 0);
    }

    // 2. Se o atleta é adulto (>= 16), assegura que BJJ ou Capoeira com cordas infantis realizem transição
    if (updated.age >= 16) {
      if (art === 'jiujitsu' && grad.rankIndex >= 1 && grad.rankIndex <= 4) {
        grad.rankIndex = 5; // Faixa Azul
        const adultRank = meta.ranks[5];
        grad.name = adultRank.name;
        grad.color = adultRank.color;
        grad.textColor = adultRank.textColor;
        grad.categoryName = adultRank.categoryName;
        grad.evaluationCriteria = adultRank.evaluationCriteria;
        grad.estimatedTime = adultRank.estimatedTime;
        grad.xpNeeded = adultRank.xpNeeded;
        grad.xp = Math.min(grad.xp, adultRank.xpNeeded);
      }
      if (art === 'capoeira' && grad.rankIndex <= 16) {
        grad.rankIndex = 17; // Corda Cinza adulto
        const adultRank = meta.ranks[17];
        grad.name = adultRank.name;
        grad.color = adultRank.color;
        grad.textColor = adultRank.textColor;
        grad.gradientStyle = adultRank.gradientStyle;
        grad.stageNumber = adultRank.stageNumber;
        grad.categoryName = adultRank.categoryName;
        grad.evaluationCriteria = adultRank.evaluationCriteria;
        grad.estimatedTime = adultRank.estimatedTime;
        grad.xpNeeded = adultRank.xpNeeded;
        grad.xp = Math.min(grad.xp, adultRank.xpNeeded);
      }
    }

    // 3. Verifica se o rank atual viola a idade mínima estrita da federação
    let maxAllowedRankIndex = meta.ranks.length - 1;
    for (let i = 0; i < meta.ranks.length; i++) {
      const r = meta.ranks[i];
      if (r.minAge !== undefined && updated.age < r.minAge) {
        maxAllowedRankIndex = Math.max(0, i - 1);
        break;
      }
    }

    // Se o personagem possui um rank acima do permitido biologicamente e regulamentarmente:
    if (grad.rankIndex > maxAllowedRankIndex) {
      const validRank = meta.ranks[maxAllowedRankIndex];
      grad.rankIndex = maxAllowedRankIndex;
      grad.name = validRank.name;
      grad.color = validRank.color;
      grad.textColor = validRank.textColor;
      grad.gradientStyle = validRank.gradientStyle;
      grad.stageNumber = validRank.stageNumber;
      grad.categoryName = validRank.categoryName;
      grad.evaluationCriteria = validRank.evaluationCriteria;
      grad.estimatedTime = validRank.estimatedTime;
      grad.xpNeeded = validRank.xpNeeded;
      grad.xp = Math.min(grad.xp, validRank.xpNeeded);
    }

    // 4. Limita XP ao teto se estiver descontrolado acima de xpNeeded
    if (grad.xp > grad.xpNeeded) {
      grad.xp = grad.xpNeeded;
    }

    // 5. Normaliza graus (stripes), nome limpo e meta de XP calibrada no Jiu-Jitsu
    if (art === 'jiujitsu') {
      const rankDef = meta.ranks[grad.rankIndex] || meta.ranks[0];
      grad.name = stripLegacyBjjRangeSuffix(rankDef?.name || grad.name);
      if (rankDef && grad.xpNeeded !== rankDef.xpNeeded) {
        const prevRatio = grad.xpNeeded > 0 ? Math.min(1, Math.max(0, grad.xp / grad.xpNeeded)) : 0;
        grad.xpNeeded = rankDef.xpNeeded;
        grad.xp = Math.round(prevRatio * rankDef.xpNeeded);
      }
      const nextRankDef = meta.ranks[grad.rankIndex + 1];
      const computedStripes = computeBjjStripesFromProgress(
        grad.rankIndex,
        grad.xp,
        grad.xpNeeded,
        grad.monthsInRank ?? 0,
        nextRankDef?.minMonthsInRank
      );
      grad.stripes = Math.max(grad.stripes || 0, computedStripes);
      grad.masteryTitle = formatBjjBeltWithDegree(grad.rankIndex, grad.name, grad.stripes);
    }
  });

  return updated;
}

