import type { ArtTalentLevel, Character, GameDate, Gym, MartialArtType } from './game';
import { getDaysInMonth } from '../utils/dateUtils';
import { MARTIAL_ARTS_META, WORLD_GYMS } from '../data/martialArtsData';
import { addTrainingGraduationXp } from '../utils/graduationHelper';
import {
  generateRandomArtTalents,
  getArtTalentMeta
} from '../utils/talentAndDifficultyHelper';
import { AVAILABLE_JOBS } from '../data/lifeEventsData';
import { resolveBrazilCapitalByCity } from '../utils/regionalGeographyHelper';

export type DayOfWeek = 
  | 'segunda' 
  | 'terca' 
  | 'quarta' 
  | 'quinta' 
  | 'sexta' 
  | 'sabado' 
  | 'domingo';

/**
 * Os 4 blocos diários de tempo estabelecidos na Etapa 2:
 * 1. Madrugada (00:00 - 06:00 aprox.)
 * 2. Manhã (06:00 - 12:00 aprox.)
 * 3. Tarde (12:00 - 18:00 aprox.)
 * 4. Noite (18:00 - 24:00 aprox.)
 */
export type DailyBlockType = 'madrugada' | 'manha' | 'tarde' | 'noite';

/** Capacidade fixa de pontos por bloco */
export const POINTS_PER_BLOCK = 3;

/** Capacidade diária total de pontos (4 blocos * 3 pontos) */
export const DAILY_POINTS_CAPACITY = 12;

/** Total de blocos na semana completa (7 dias * 4 blocos = 28 blocos) */
export const TOTAL_WEEKLY_BLOCKS = 28;

/** Categorias de atividades suportadas pelo sistema de agenda */
export type ActivityCategory = 
  | 'sono'
  | 'artes_marciais'
  | 'artes_marciais_estendida'
  | 'condicionamento'
  | 'escola'
  | 'trabalho'
  | 'estudos'
  | 'lazer'
  | 'compromisso_pessoal';

/** Situação de uma atividade na agenda */
export type ActivityStatus = 'agendada' | 'concluida' | 'falta' | 'cancelada';

/** Situação da matrícula em modalidade/dojô */
export type EnrollmentStatus = 'ativa' | 'trancada' | 'cancelada';

/**
 * Tabela de custos em pontos padrão por tipo de atividade conforme Etapa 3:
 * - Aula regular de arte marcial: 1 ponto
 * - Aula estendida ou dupla: 2 pontos
 * - Condicionamento físico: 1 ponto
 * - Escola: 3 pontos
 * - Trabalho: 3 pontos
 * - Estudos complementares: 1 ponto
 * - Lazer: 1 ponto
 * - Compromisso pessoal: 1 ponto
 * - Sono: configuração contínua por idade (1 pt por ponto alocado)
 */
export const DEFAULT_ACTIVITY_POINT_COSTS: Record<ActivityCategory, number> = {
  sono: 1,                     // Por ponto consecutivo reservado
  artes_marciais: 1,           // 1 ponto por aula regular
  artes_marciais_estendida: 2, // 2 pontos para treinos estendidos ou duplos
  condicionamento: 1,          // 1 ponto de preparação física
  escola: 3,                   // 3 pontos (bloco matutino completo para estudantes)
  trabalho: 3,                 // 3 pontos (turno padrão de trabalho)
  estudos: 1,                  // 1 ponto de estudo complementar
  lazer: 1,                    // 1 ponto de descanso/lazer
  compromisso_pessoal: 1       // 1 ponto de compromisso pessoal
};

/**
 * Configuração de requisitos de sono por faixa etária (pontos contínuos necessários).
 * Configurável e extensível para especificações futuras.
 */
export interface SleepRequirementsConfig {
  infantilPoints: number; // 4 pontos contínuos (madrugada 3 + noite 1) para crianças (< 14)
  juvenilPoints: number;  // 4 pontos contínuos (madrugada 3 + noite 1) para adolescentes (14-17)
  adultoPoints: number;   // 3 pontos contínuos (madrugada 3) para jovens e adultos (18-34)
  masterPoints: number;   // 3 pontos contínuos (madrugada 3) para veteranos (35+)
}

export const DEFAULT_SLEEP_CONFIG: SleepRequirementsConfig = {
  infantilPoints: 4,
  juvenilPoints: 4,
  adultoPoints: 3,
  masterPoints: 3
};

/** Retorna a necessidade de pontos de sono contínuo com base na idade */
export function getSleepPointsRequirement(age: number, config: SleepRequirementsConfig = DEFAULT_SLEEP_CONFIG): number {
  if (age < 14) return config.infantilPoints;
  if (age < 18) return config.juvenilPoints;
  if (age < 35) return config.adultoPoints;
  return config.masterPoints;
}

/**
 * Registro de atividade agendada em um dia e bloco específico.
 */
export interface ScheduledActivity {
  id: string;
  title: string;
  category: ActivityCategory;
  dayOfWeek: DayOfWeek;
  block: DailyBlockType;
  pointsCost: number; // 1 a 3 pontos dentro do bloco
  status: ActivityStatus;
  isProtected?: boolean; // Se verdadeiro, não pode ser cancelado silenciosamente
  notes?: string;
  relatedId?: string; // ID da aula, trabalho ou dojô relacionado
}

/**
 * Registro de matrícula recorrente em academia/dojô.
 * Preparado para alocação direta nos 4 blocos diários.
 */
export interface EnrolledClass {
  classId: string;
  art: MartialArtType;
  gymId: string;
  gymName: string;
  instructorName: string;
  title: string;
  dayOfWeek: DayOfWeek;
  block: DailyBlockType;
  pointsCost: number; // 1 a 3 pontos
  status: EnrollmentStatus;
  enrolledDate?: string;
  classType?: 'regular' | 'estendida';
  // Campos legados mantidos para compatibilidade com saves existentes
  shift?: 'manha' | 'tarde' | 'noite' | 'madrugada';
  startTime?: string;
  durationMinutes?: number;
  intensity?: 'leve' | 'moderada' | 'intensa';
}

/**
 * Metadados dos 4 blocos diários para renderização e cálculo cronológico.
 */
export interface DailyBlockMeta {
  id: DailyBlockType;
  order: number; // 0 = Madrugada, 1 = Manhã, 2 = Tarde, 3 = Noite
  label: string;
  icon: string;
  approximateTime: string;
  description: string;
}

export const DAILY_BLOCKS_META: DailyBlockMeta[] = [
  {
    id: 'madrugada',
    order: 0,
    label: 'Madrugada',
    icon: '🌙',
    approximateTime: '00:00 - 06:00',
    description: 'Recuperação fisiológica e sono profundo'
  },
  {
    id: 'manha',
    order: 1,
    label: 'Manhã',
    icon: '🌅',
    approximateTime: '06:00 - 12:00',
    description: 'Início de atividades, estudos matinais ou treinos'
  },
  {
    id: 'tarde',
    order: 2,
    label: 'Tarde',
    icon: '☀️',
    approximateTime: '12:00 - 18:00',
    description: 'Treinamento intensivo, condicionamento ou trabalho'
  },
  {
    id: 'noite',
    order: 3,
    label: 'Noite',
    icon: '🌆',
    approximateTime: '18:00 - 24:00',
    description: 'Aulas de graduação, convívio e início do repouso'
  }
];

export const DAYS_OF_WEEK_META: Array<{
  id: DayOfWeek;
  label: string;
  shortLabel: string;
  dayIndex: number; // 0 = segunda .. 6 = domingo
}> = [
  { id: 'segunda', label: 'Segunda-feira', shortLabel: 'SEG', dayIndex: 0 },
  { id: 'terca', label: 'Terça-feira', shortLabel: 'TER', dayIndex: 1 },
  { id: 'quarta', label: 'Quarta-feira', shortLabel: 'QUA', dayIndex: 2 },
  { id: 'quinta', label: 'Quinta-feira', shortLabel: 'QUI', dayIndex: 3 },
  { id: 'sexta', label: 'Sexta-feira', shortLabel: 'SEX', dayIndex: 4 },
  { id: 'sabado', label: 'Sábado', shortLabel: 'SÁB', dayIndex: 5 },
  { id: 'domingo', label: 'Domingo', shortLabel: 'DOM', dayIndex: 6 }
];

/**
 * Retorna o índice cronológico global do bloco na semana (0 a 27).
 * Permite ordenar e verificar adjacência temporal exata entre blocos e dias.
 */
export function getChronologicalBlockIndex(day: DayOfWeek, block: DailyBlockType): number {
  const dayMeta = DAYS_OF_WEEK_META.find((d) => d.id === day);
  const blockMeta = DAILY_BLOCKS_META.find((b) => b.id === block);
  const dayIndex = dayMeta ? dayMeta.dayIndex : 0;
  const blockOrder = blockMeta ? blockMeta.order : 0;
  return dayIndex * 4 + blockOrder;
}

/**
 * Informações de ocupação e capacidade de um bloco de 3 pontos.
 */
export interface BlockCapacityInfo {
  block: DailyBlockType;
  maxPoints: number; // Sempre 3
  usedPoints: number;
  availablePoints: number;
  activities: ScheduledActivity[];
  isFull: boolean;
  isOverCapacity: boolean;
}

/**
 * Calcula os pontos consumidos e disponíveis em um bloco diário de um dia específico.
 */
export function calculateBlockCapacity(
  day: DayOfWeek,
  block: DailyBlockType,
  activities: ScheduledActivity[]
): BlockCapacityInfo {
  const blockActivities = activities.filter(
    (a) => a.dayOfWeek === day && a.block === block && a.status !== 'cancelada'
  );

  const usedPoints = blockActivities.reduce((acc, curr) => acc + (curr.pointsCost || 1), 0);
  const availablePoints = Math.max(0, POINTS_PER_BLOCK - usedPoints);

  return {
    block,
    maxPoints: POINTS_PER_BLOCK,
    usedPoints,
    availablePoints,
    activities: blockActivities,
    isFull: availablePoints === 0,
    isOverCapacity: usedPoints > POINTS_PER_BLOCK
  };
}

/**
 * Valida se uma nova atividade pode ser inserida no bloco sem exceder os 3 pontos.
 */
export function validateBlockAvailability(
  day: DayOfWeek,
  block: DailyBlockType,
  costInPoints: number,
  activities: ScheduledActivity[]
): { canAdd: boolean; remainingAfter: number; reason?: string } {
  if (costInPoints <= 0) {
    return { canAdd: false, remainingAfter: 0, reason: 'O custo em pontos deve ser maior que zero.' };
  }
  if (costInPoints > POINTS_PER_BLOCK) {
    return {
      canAdd: false,
      remainingAfter: 0,
      reason: `A atividade requer ${costInPoints} pontos, excedendo a capacidade máxima do bloco (${POINTS_PER_BLOCK} pontos).`
    };
  }

  const capacity = calculateBlockCapacity(day, block, activities);
  if (capacity.usedPoints + costInPoints > POINTS_PER_BLOCK) {
    return {
      canAdd: false,
      remainingAfter: capacity.availablePoints,
      reason: `Capacidade insuficiente no bloco ${block}. Disponível: ${capacity.availablePoints} ponto(s), necessário: ${costInPoints} ponto(s).`
    };
  }

  return {
    canAdd: true,
    remainingAfter: capacity.availablePoints - costInPoints
  };
}

/**
 * Representação de um intervalo de sono identificado no cronograma.
 */
export interface SleepInterval {
  startDay: DayOfWeek;
  startBlock: DailyBlockType;
  endDay: DayOfWeek;
  endBlock: DailyBlockType;
  totalPoints: number;
  isContinuous: boolean;
  crossesDayBoundary: boolean;
  blocks: Array<{ day: DayOfWeek; block: DailyBlockType; pointsCost: number }>;
}

/**
 * Validação de Horários de Sono por Fase da Vida (Menores vs Adultos):
 * - Crianças e adolescentes (< 18 anos):
 *   Sono deve ocorrer preferencialmente durante noite e madrugada.
 *   Inversão livre do ciclo circadiano (dormir de dia e acordar de noite) é bloqueada,
 *   salvo autorização excepcional dos responsáveis (apoio familiar alto).
 * - Adultos (>= 18 anos):
 *   Total autonomia para escolher o horário de sono (inclusive diurno, para quem trabalha à noite).
 *   O jogo não penaliza automaticamente o adulto por dormir durante o dia.
 */
export function validateAgeAppropriateSleep(
  age: number,
  activities: ScheduledActivity[],
  familySupport: number = 85
): {
  isAgeAppropriate: boolean;
  reason?: string;
  isCircadianInverted: boolean;
  requiresParentalConsent: boolean;
  hasParentalConsent: boolean;
} {
  const isMinor = age < 18;

  // Busca atividades de sono cadastradas
  const sleepActivities = activities.filter(
    (a) => a.category === 'sono' && a.status !== 'cancelada'
  );

  if (sleepActivities.length === 0) {
    return {
      isAgeAppropriate: true,
      isCircadianInverted: false,
      requiresParentalConsent: false,
      hasParentalConsent: true
    };
  }

  // Verifica se o sono ocorre predominantemente em blocos diurnos (manhã / tarde)
  const diurnalPoints = sleepActivities
    .filter((a) => a.block === 'manha' || a.block === 'tarde')
    .reduce((acc, a) => acc + a.pointsCost, 0);

  const nocturnalPoints = sleepActivities
    .filter((a) => a.block === 'noite' || a.block === 'madrugada')
    .reduce((acc, a) => acc + a.pointsCost, 0);

  const isCircadianInverted = diurnalPoints > nocturnalPoints;

  // Adultos possuem autonomia total
  if (!isMinor) {
    return {
      isAgeAppropriate: true,
      isCircadianInverted,
      requiresParentalConsent: false,
      hasParentalConsent: true
    };
  }

  // Menores de 18 anos
  if (isCircadianInverted) {
    // Mudança excepcional depende de alto suporte familiar
    const hasParentalConsent = familySupport >= 90;
    if (!hasParentalConsent) {
      return {
        isAgeAppropriate: false,
        reason: 'Menores de 18 anos devem manter rotina circadiana com repouso preferencial à noite e madrugada, conciliada com o calendário escolar.',
        isCircadianInverted: true,
        requiresParentalConsent: true,
        hasParentalConsent: false
      };
    }
  }

  return {
    isAgeAppropriate: true,
    isCircadianInverted,
    requiresParentalConsent: false,
    hasParentalConsent: true
  };
}

/**
 * Validação da Continuidade Cronológica do Sono.
 * O sono deve ser contínuo e ininterrupto:
 * 1. Para avaliação de um dia (ciclo de 4 blocos):
 *    - Os blocos com sono devem formar um arco contíguo no ciclo 24h (madrugada 0 -> manha 1 -> tarde 2 -> noite 3 -> madrugada 0).
 *    - Ex: [noite, madrugada, manha] é contínuo (conecta-se através da meia-noite).
 *    - Ex: [madrugada, tarde] é fragmentado (separado por manhã e noite).
 * 2. Para avaliação entre dias (ciclo de 28 blocos semanais):
 *    - Reconhece a transição contínua entre dias consecutivos (ex: Segunda Noite -> Terça Madrugada).
 * 3. Rejeita se qualquer bloco ultrapassar os 3 pontos de capacidade.
 * 4. Rejeita sono interrompido por atividades intermediárias.
 */
export function validateSleepContinuity(
  dayOrActivities: DayOfWeek | ScheduledActivity[],
  activitiesArg?: ScheduledActivity[]
): {
  isContinuous: boolean;
  totalSleepPoints: number;
  sleepIntervalsCount: number;
  blocksWithSleep: Array<{ day: DayOfWeek; block: DailyBlockType; points: number }>;
  reason?: string;
} {
  // Suporte a chamada com 1 argumento (todas as atividades da semana) ou 2 argumentos (dia + atividades)
  let activities: ScheduledActivity[];
  let filterDay: DayOfWeek | null = null;

  if (Array.isArray(dayOrActivities)) {
    activities = dayOrActivities;
  } else {
    filterDay = dayOrActivities;
    activities = activitiesArg || [];
  }

  const activeSleep = activities.filter(
    (a) => a.category === 'sono' && a.status !== 'cancelada' && (filterDay ? a.dayOfWeek === filterDay : true)
  );

  const totalSleepPoints = activeSleep.reduce((acc, a) => acc + (a.pointsCost || 1), 0);
  if (activeSleep.length === 0) {
    return {
      isContinuous: true,
      totalSleepPoints: 0,
      sleepIntervalsCount: 0,
      blocksWithSleep: []
    };
  }

  // 1. Verifica se algum bloco individual ultrapassou a capacidade de 3 pontos
  const blockPointsMap = new Map<string, number>();
  for (const act of activeSleep) {
    const key = `${act.dayOfWeek}_${act.block}`;
    const curr = (blockPointsMap.get(key) || 0) + act.pointsCost;
    if (curr > POINTS_PER_BLOCK) {
      return {
        isContinuous: false,
        totalSleepPoints,
        sleepIntervalsCount: 1,
        blocksWithSleep: [],
        reason: `O sono no bloco ${act.block} de ${act.dayOfWeek} ultrapassa a capacidade máxima de ${POINTS_PER_BLOCK} pontos.`
      };
    }
    blockPointsMap.set(key, curr);
  }

  // 2. Mapeamento e ordenação dos blocos cronológicos
  const sleepSlots: Array<{
    slotIndex: number;
    day: DayOfWeek;
    block: DailyBlockType;
    points: number;
    orderInDay: number;
  }> = [];

  for (const [key, points] of blockPointsMap.entries()) {
    const [dayStr, blockStr] = key.split('_');
    const day = dayStr as DayOfWeek;
    const block = blockStr as DailyBlockType;
    const slotIndex = getChronologicalBlockIndex(day, block);
    const orderInDay = DAILY_BLOCKS_META.find((b) => b.id === block)?.order ?? 0;
    sleepSlots.push({ slotIndex, day, block, points, orderInDay });
  }

  sleepSlots.sort((a, b) => a.slotIndex - b.slotIndex);

  // 3. Verificação de continuidade cíclica
  // Caso A: Avaliação de um dia específico (filtro diário, N = 4 blocos: 0=madrugada, 1=manha, 2=tarde, 3=noite)
  if (filterDay) {
    const dayOrders = Array.from(new Set(sleepSlots.filter((s) => s.day === filterDay).map((s) => s.orderInDay))).sort(
      (a, b) => a - b
    );

    if (dayOrders.length > 1) {
      // Calcula os gaps cíclicos entre os blocos (N = 4)
      let cyclicGapsCount = 0;
      for (let i = 0; i < dayOrders.length; i++) {
        const nextOrder = i === dayOrders.length - 1 ? dayOrders[0] : dayOrders[i + 1];
        const gap = i === dayOrders.length - 1 ? (nextOrder - dayOrders[i] + 4) % 4 : nextOrder - dayOrders[i];
        if (gap > 1) {
          cyclicGapsCount += 1;
        }
      }

      const isContinuous = cyclicGapsCount <= 1;
      return {
        isContinuous,
        totalSleepPoints,
        sleepIntervalsCount: isContinuous ? 1 : cyclicGapsCount,
        blocksWithSleep: sleepSlots.map((s) => ({ day: s.day, block: s.block, points: s.points })),
        reason: isContinuous
          ? undefined
          : 'O sono deve ser contínuo e ininterrupto, não podendo ser distribuído em períodos isolados ao longo do dia.'
      };
    }

    return {
      isContinuous: true,
      totalSleepPoints,
      sleepIntervalsCount: 1,
      blocksWithSleep: sleepSlots.map((s) => ({ day: s.day, block: s.block, points: s.points }))
    };
  }

  // Caso B: Avaliação de conjunto de atividades (ciclo semanal, N = 28 blocos)
  const sortedSlotIndices = Array.from(new Set(sleepSlots.map((s) => s.slotIndex))).sort((a, b) => a - b);
  let weeklyGapsCount = 0;
  if (sortedSlotIndices.length > 1) {
    for (let i = 0; i < sortedSlotIndices.length; i++) {
      const nextSlot = i === sortedSlotIndices.length - 1 ? sortedSlotIndices[0] : sortedSlotIndices[i + 1];
      const gap =
        i === sortedSlotIndices.length - 1
          ? (nextSlot - sortedSlotIndices[i] + TOTAL_WEEKLY_BLOCKS) % TOTAL_WEEKLY_BLOCKS
          : nextSlot - sortedSlotIndices[i];
      if (gap > 1) {
        weeklyGapsCount += 1;
      }
    }
  }

  // 4. Verificação de atividades não-sono que fragmentem o sono dentro do mesmo bloco
  for (const s of sleepSlots) {
    const activitiesInBlock = activities.filter(
      (a) => a.dayOfWeek === s.day && a.block === s.block && a.status !== 'cancelada'
    );
    const nonSleep = activitiesInBlock.filter((a) => a.category !== 'sono');
    if (nonSleep.length > 1 && s.points < POINTS_PER_BLOCK) {
      return {
        isContinuous: false,
        totalSleepPoints,
        sleepIntervalsCount: 2,
        blocksWithSleep: sleepSlots.map((item) => ({ day: item.day, block: item.block, points: item.points })),
        reason: 'O repouso foi interrompido por múltiplas atividades no mesmo bloco diário.'
      };
    }
  }

  // O sono é contínuo se forma no máximo 1 arco conectado (ou seja, no máximo 1 gap > 1)
  const intervalsCount = sortedSlotIndices.length <= 1 ? sortedSlotIndices.length : Math.max(1, weeklyGapsCount);
  const isContinuous = sortedSlotIndices.length <= 1 || weeklyGapsCount <= 1;

  return {
    isContinuous,
    totalSleepPoints,
    sleepIntervalsCount: intervalsCount,
    blocksWithSleep: sleepSlots.map((s) => ({ day: s.day, block: s.block, points: s.points })),
    reason: isContinuous
      ? undefined
      : 'O sono foi fragmentado em períodos isolados. O sistema exige descanso contínuo e ininterrupto.'
  };
}

/**
 * Interface de Integração com Fadiga e Recuperação (Seção 5 da Etapa 2.1).
 * Não define fórmulas definitivas fechadas, mas fornece a interface tipada e modular
 * para conectar qualidade do sono, energia, recuperação de lesões e rendimento físico.
 */
export interface SleepQualityMetrics {
  totalSleepPoints: number;
  requiredSleepPoints: number;
  sleepDebtPoints: number; // required - total
  isContinuous: boolean;
  isAgeAppropriate: boolean;
  circadianPhase: 'natural_noturno' | 'diurno_adaptado' | 'invertido';
  sleepEfficiencyScore: number; // 0 a 100%
  recoveryImpact: {
    energyRecoveryMultiplier: number; // Multiplicador de recuperação (1.0 = normal, >1.0 = ótimo, <1.0 = déficit)
    mentalFocusModifier: number;      // Bônus/penalidade em foco mental
    injuryHealingBonusWeeks: number;  // Aceleração/atraso em cura de lesões
    physicalStaminaModifier: number;  // Multiplicador de gás/resistência
  };
  evaluationNotes: string[];
}

/**
 * Avalia as métricas de qualidade de sono e seus pontos de integração com fadiga/recuperação.
 */
export function evaluateSleepQuality(
  age: number,
  activities: ScheduledActivity[],
  dayOfWeek?: DayOfWeek,
  familySupport: number = 85
): SleepQualityMetrics {
  const requiredPoints = getSleepPointsRequirement(age);
  const continuity = validateSleepContinuity(dayOfWeek || 'segunda', activities);
  const ageRule = validateAgeAppropriateSleep(age, activities, familySupport);

  const totalPoints = continuity.totalSleepPoints;
  const sleepDebtPoints = Math.max(0, requiredPoints - totalPoints);

  // Eficiência base
  let efficiency = 100;
  const notes: string[] = [];

  if (!continuity.isContinuous) {
    efficiency -= 40;
    notes.push('Sono fragmentado: descanso não foi ininterrupto, reduzindo a restauração fisiológica.');
  }

  if (sleepDebtPoints > 0) {
    const penaltyPerPoint = 15;
    efficiency = Math.max(20, efficiency - sleepDebtPoints * penaltyPerPoint);
    notes.push(`Déficit de sono: faltam ${sleepDebtPoints} ponto(s) para a necessidade etária (${requiredPoints} pts).`);
  } else {
    notes.push(`Necessidade de sono plenamente atendida (${totalPoints}/${requiredPoints} pts).`);
  }

  if (!ageRule.isAgeAppropriate) {
    efficiency = Math.max(15, efficiency - 25);
    notes.push(ageRule.reason || 'Rotina circadiana incompatível com a faixa etária.');
  }

  let circadianPhase: 'natural_noturno' | 'diurno_adaptado' | 'invertido' = 'natural_noturno';
  if (ageRule.isCircadianInverted) {
    circadianPhase = age >= 18 ? 'diurno_adaptado' : 'invertido';
    if (age >= 18) {
      notes.push('Ciclo circadiano diurno adaptado para rotina de trabalho/treino adulto.');
    }
  }

  // Pontos de integração com fadiga e recuperação física
  const energyMultiplier = Math.round((efficiency / 100) * 10) / 10;
  const focusMod = efficiency >= 80 ? 5 : efficiency >= 50 ? 0 : -10;
  const staminaMod = efficiency >= 80 ? 1.0 : efficiency >= 50 ? 0.9 : 0.75;
  const injuryBonus = efficiency >= 90 ? 1 : efficiency < 40 ? -1 : 0;

  return {
    totalSleepPoints: totalPoints,
    requiredSleepPoints: requiredPoints,
    sleepDebtPoints,
    isContinuous: continuity.isContinuous,
    isAgeAppropriate: ageRule.isAgeAppropriate,
    circadianPhase,
    sleepEfficiencyScore: Math.min(100, Math.max(0, efficiency)),
    recoveryImpact: {
      energyRecoveryMultiplier: energyMultiplier,
      mentalFocusModifier: focusMod,
      injuryHealingBonusWeeks: injuryBonus,
      physicalStaminaModifier: staminaMod
    },
    evaluationNotes: notes
  };
}

// ============================================================================
// ETAPA 3 — SISTEMA DE ATIVIDADES, MATRÍCULAS RECORRENTES E FREQUÊNCIA
// ============================================================================

/**
 * Pré-requisitos para inscrição em uma turma de arte marcial.
 */
export interface GymClassTurmaPrerequisites {
  minRank?: number;       // Posição mínima de faixa/rank na modalidade
  minFightIq?: number;    // QI de luta mínimo exigido
  reputationReq?: number; // Reputação / honra mínima
  minAge?: number;        // Idade mínima para a turma
}

/**
 * Modelo de Turma Ofertada por uma Academia Oficial do Mundo.
 */
export interface GymClassTurma {
  id: string;
  gymId: string;
  gymName: string;
  art: MartialArtType;
  instructorName: string;
  title: string;
  description: string;
  daysOfWeek: DayOfWeek[];
  block: DailyBlockType;
  pointsCost: number; // 1 (regular) ou 2 (estendida/dupla)
  classType: 'regular' | 'estendida';
  status: 'aberta' | 'lotada' | 'em_andamento';
  prerequisites: GymClassTurmaPrerequisites;
}

/**
 * Registro de Sessão Individual de Aula (Agendada, Concluída, Falta, Cancelada).
 * Garante separação estrita entre Matrícula (recorrente) e Sessão (ocorrência pontual).
 * Sessões agendadas NUNCA concedem XP imediato ou retroativo.
 */
export interface ClassSessionRecord {
  id: string;
  enrollmentId: string; // ID da turma/matrícula de origem
  classId: string;
  gymId: string;
  gymName: string;
  art: MartialArtType;
  instructorName: string;
  title: string;
  date: GameDate;
  dayOfWeek: DayOfWeek;
  block: DailyBlockType;
  pointsCost: number; // 1 ou 2
  classType: 'regular' | 'estendida';
  status: ActivityStatus; // 'agendada' | 'concluida' | 'falta' | 'cancelada'
  xpEarned?: number;      // 0 enquanto agendada, preenchido apenas na conclusão
  energyCost?: number;    // Energia consumida na conclusão
  completedAt?: string;   // Data civil da conclusão
  notes?: string;
}

/**
 * Resumo do Histórico de Frequência do Atleta.
 */
export interface AttendanceHistorySummary {
  totalScheduled: number;
  totalCompleted: number;
  totalAbsences: number;
  totalCancelled: number;
  attendanceRate: number; // 0 a 100%
  totalXpEarned: number;
}

/**
 * Retorna o dia da semana correspondente a uma GameDate gregoriana.
 */
export function getDayOfWeekFromGameDate(date: GameDate): DayOfWeek {
  const d = new Date(date.year, date.month - 1, date.day);
  const jsDay = d.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  switch (jsDay) {
    case 1: return 'segunda';
    case 2: return 'terca';
    case 3: return 'quarta';
    case 4: return 'quinta';
    case 5: return 'sexta';
    case 6: return 'sabado';
    case 0: return 'domingo';
    default: return 'segunda';
  }
}

/**
 * Identifica se uma academia é especializada ou centro poliesportivo.
 * - Centro poliesportivo (ex: gym_bairro com 7 artes, gym_american_top_team com 5 artes): +30% XP
 * - Academia especializada (focada em modalidade específica): +50% XP
 */
export function isSpecializedGym(gym: { id: string; focusArts?: MartialArtType[] }): boolean {
  if (gym.id === 'gym_bairro' || gym.id === 'gym_american_top_team') {
    return false;
  }
  if (Array.isArray(gym.focusArts) && gym.focusArts.length >= 4) {
    return false;
  }
  return true;
}

/**
 * Retorna o multiplicador de XP da academia conforme a Seção 7 da Etapa 3.
 * - Academia especializada: +50% de XP (1.5x)
 * - Centro poliesportivo: +30% de XP (1.3x)
 * Não cumulativos entre academias na mesma sessão.
 */
export function getGymXpMultiplier(gym: { id: string; focusArts?: MartialArtType[] }): {
  multiplier: number;
  gymType: 'especializada' | 'poliesportiva';
  bonusLabel: string;
} {
  const specialized = isSpecializedGym(gym);
  if (specialized) {
    return {
      multiplier: 1.5,
      gymType: 'especializada',
      bonusLabel: '+50% XP (Academia Especializada)'
    };
  }
  return {
    multiplier: 1.3,
    gymType: 'poliesportiva',
    bonusLabel: '+30% XP (Centro Poliesportivo)'
  };
}

/**
 * Calcula o ganho de XP e gasto de energia de uma sessão ao ser concluída.
 * - Aula regular (1 ponto): base 20 XP, 10 de energia.
 * - Aula estendida (2 pontos): base 40 XP, 20 de energia.
 * Multiplicador aplicado conforme a academia da aula.
 */
export function calculateSessionTrainingXp(
  pointsCost: number,
  gym: { id: string; focusArts?: MartialArtType[] }
): { baseXp: number; multiplier: number; finalXp: number; energyCost: number; bonusLabel: string } {
  const baseXp = pointsCost * 20;
  const { multiplier, bonusLabel } = getGymXpMultiplier(gym);
  const finalXp = Math.round(baseXp * multiplier);
  const energyCost = pointsCost * 10;

  return {
    baseXp,
    multiplier,
    finalXp,
    energyCost,
    bonusLabel
  };
}

/**
 * Gera o resumo estatístico do histórico de frequência do atleta.
 */
export function getAttendanceSummary(sessions: ClassSessionRecord[] = []): AttendanceHistorySummary {
  const totalCompleted = sessions.filter((s) => s.status === 'concluida').length;
  const totalAbsences = sessions.filter((s) => s.status === 'falta').length;
  const totalCancelled = sessions.filter((s) => s.status === 'cancelada').length;
  const totalScheduled = sessions.filter((s) => s.status === 'agendada').length;
  const validSessions = totalCompleted + totalAbsences;
  const attendanceRate = validSessions > 0 ? Math.round((totalCompleted / validSessions) * 100) : 100;
  const totalXpEarned = sessions.reduce((acc, s) => acc + (s.xpEarned || 0), 0);

  return {
    totalScheduled,
    totalCompleted,
    totalAbsences,
    totalCancelled,
    attendanceRate,
    totalXpEarned
  };
}

/**
 * Constrói a lista completa de atividades ativas da semana para validação de conflitos e capacidade.
 * Inclui sono ininterrupto, escola, trabalho e matrículas ativas.
 */
export function getCharacterWeeklyActivities(character: Character): ScheduledActivity[] {
  const list: ScheduledActivity[] = [];

  const existingActivities = Array.isArray(character.scheduledActivities)
    ? character.scheduledActivities.filter((a) => a.status !== 'cancelada')
    : [];

  const hasCustomSleep = existingActivities.some((a) => a.category === 'sono');
  const hasCustomSchool = existingActivities.some(
    (a) => a.category === 'escola' || a.category === 'estudos'
  );
  const hasCustomJob = existingActivities.some((a) => a.category === 'trabalho');

  // Adiciona atividades customizadas já registradas
  list.push(...existingActivities);

  const sleepReq = getSleepPointsRequirement(character.age);
  const isMinor = character.age < 18;
  const sleepPattern = !isMinor && character.sleepPattern === 'diurno' ? 'diurno' : 'noturno';
  const activeEdu = character.education?.currentEnrollment;
  const schoolBlock: DailyBlockType =
    (activeEdu?.shift as DailyBlockType) || character.schoolShift || 'manha';
  const jobDef = AVAILABLE_JOBS.find((j) => j.id === character.job);
  const jobBlock: DailyBlockType =
    character.jobShift || (jobDef?.defaultShift as DailyBlockType) || 'tarde';

  DAYS_OF_WEEK_META.forEach((dayMeta) => {
    // 1. Sono se não customizado
    if (!hasCustomSleep) {
      if (sleepPattern === 'diurno') {
        // Adulto com autonomia de sono diurno contínuo: Manhã (3 pts) + Tarde (complemento se > 3)
        list.push({
          id: `sleep_manha_${dayMeta.id}`,
          title: 'Sono Diurno Adaptado (Manhã)',
          category: 'sono',
          dayOfWeek: dayMeta.id,
          block: 'manha',
          pointsCost: 3,
          status: 'agendada',
          isProtected: true,
          notes: 'Repouso diurno contínuo para adultos com rotina ou trabalho noturno'
        });

        const daySleepRemainder = Math.max(0, Math.min(3, sleepReq - 3));
        if (daySleepRemainder > 0) {
          list.push({
            id: `sleep_tarde_${dayMeta.id}`,
            title: `Sono Diurno Adaptado (${daySleepRemainder} pts)`,
            category: 'sono',
            dayOfWeek: dayMeta.id,
            block: 'tarde',
            pointsCost: daySleepRemainder,
            status: 'agendada',
            isProtected: true,
            notes: 'Complemento do repouso diurno ininterrupto'
          });
        }
      } else {
        // Sono Noturno padrão: Madrugada (3 pts) + Noite (complemento etário: 1 pt se < 18, 0 se >= 18)
        list.push({
          id: `sleep_madrugada_${dayMeta.id}`,
          title: 'Sono Noturno (Repouso Fisiológico)',
          category: 'sono',
          dayOfWeek: dayMeta.id,
          block: 'madrugada',
          pointsCost: 3,
          status: 'agendada',
          isProtected: true,
          notes: 'Sono contínuo para regeneração muscular e mental'
        });

        const nightSleepPoints = Math.max(0, Math.min(3, sleepReq - 3));
        if (nightSleepPoints > 0) {
          list.push({
            id: `sleep_noite_${dayMeta.id}`,
            title: `Sono Noturno (${nightSleepPoints} pt${nightSleepPoints > 1 ? 's' : ''})`,
            category: 'sono',
            dayOfWeek: dayMeta.id,
            block: 'noite',
            pointsCost: nightSleepPoints,
            status: 'agendada',
            isProtected: true,
            notes: 'Início do repouso contínuo antes da meia-noite'
          });
        }
      }
    }

    // 2. Educação / Formação Ativa (Fundamental, Médio, Técnico ou Superior) ou Escola Regular legada
    if (!hasCustomSchool) {
      if (activeEdu) {
        const isBasicSchool =
          activeEdu.level === 'fundamental' || activeEdu.level === 'medio';
        const eduDays = isBasicSchool
          ? ['segunda', 'terca', 'quarta', 'quinta', 'sexta']
          : ['segunda', 'quarta', 'sexta'];
        if (eduDays.includes(dayMeta.id)) {
          list.push({
            id: `edu_${dayMeta.id}`,
            title: activeEdu.courseTitle,
            category: isBasicSchool ? 'escola' : 'estudos',
            dayOfWeek: dayMeta.id,
            block: schoolBlock,
            pointsCost: isBasicSchool ? 3 : 2,
            status: 'agendada',
            isProtected: true,
            notes: `${activeEdu.institutionName} (${
              activeEdu.institutionType === 'publica' ? 'Pública' : 'Particular'
            })`
          });
        }
      } else if (!character.education && character.isStudying && isMinor) {
        if (['segunda', 'terca', 'quarta', 'quinta', 'sexta'].includes(dayMeta.id)) {
          list.push({
            id: `school_${dayMeta.id}`,
            title: `Ensino Regular & Formação Básica (${
              schoolBlock === 'manha' ? 'Matutino' : schoolBlock === 'tarde' ? 'Vespertino' : 'Noturno'
            })`,
            category: 'escola',
            dayOfWeek: dayMeta.id,
            block: schoolBlock,
            pointsCost: 3,
            status: 'agendada',
            isProtected: true,
            notes: 'Presença escolar obrigatória para formação do atleta menor'
          });
        }
      }
    }

    // 3. Trabalho se empregado e não customizado
    if (!hasCustomJob && character.job && character.job !== 'desempregado') {
      if (['segunda', 'terca', 'quarta', 'quinta', 'sexta'].includes(dayMeta.id)) {
        list.push({
          id: `job_${dayMeta.id}`,
          title: `Trabalho: ${jobDef?.title || character.job.replace('_', ' ').toUpperCase()}`,
          category: 'trabalho',
          dayOfWeek: dayMeta.id,
          block: jobBlock,
          pointsCost: 3,
          status: 'agendada',
          isProtected: true,
          notes: 'Jornada laboral protegida para sustento financeiro'
        });
      }
    }
  });

  // 4. Matrículas Ativas do Atleta
  if (Array.isArray(character.enrolledClasses)) {
    character.enrolledClasses.forEach((cls) => {
      if (cls.status === 'ativa') {
        list.push({
          id: `class_${cls.classId}_${cls.dayOfWeek}`,
          title: cls.title,
          category: (cls.pointsCost || 1) > 1 ? 'artes_marciais_estendida' : 'artes_marciais',
          dayOfWeek: cls.dayOfWeek,
          block: cls.block,
          pointsCost: cls.pointsCost || 1,
          status: 'agendada',
          relatedId: cls.classId,
          notes: `${cls.instructorName} • ${cls.gymName}`
        });
      }
    });
  }

  return list;
}

/**
 * Validação rigorosa de capacidade e conflitos de horários para matrícula em turma.
 * Verifica todos os dias da turma e impede cancelamentos silenciosos.
 */
export function validateEnrollment(
  character: Character,
  turma: GymClassTurma
): { isValid: boolean; reason?: string; conflictDay?: DayOfWeek; conflictBlock?: DailyBlockType } {
  // 1. Verifica se já está matriculado nesta turma
  const isAlreadyEnrolled = character.enrolledClasses?.some(
    (c) => c.classId === turma.id && c.status === 'ativa'
  );
  if (isAlreadyEnrolled) {
    return {
      isValid: false,
      reason: 'O atleta já possui matrícula ativa nesta turma.'
    };
  }

  // 2. Validação Geográfica e de Localização (Etapa 3.2 & Etapa 3 - 27 Capitais)
  const resolveEffectiveLoc = (g: Gym) => {
    if (g.id === 'gym_bairro') {
      const cap = resolveBrazilCapitalByCity(
        character.currentCity || character.homeCity,
        character.homeState || 'SP'
      );
      return { city: cap.capital, country: character.currentCountry || 'Brasil' };
    }
    if (g.country === 'Brasil') {
      const cap = resolveBrazilCapitalByCity(g.city, g.uf || 'SP');
      return { city: cap.capital, country: 'Brasil' };
    }
    return { city: g.city, country: g.country };
  };

  const currentGym = WORLD_GYMS.find((g) => g.id === (character.currentGymId || 'gym_bairro')) || WORLD_GYMS[0];
  const targetGym = WORLD_GYMS.find((g) => g.id === turma.gymId);

  if (targetGym && currentGym) {
    const curLoc = resolveEffectiveLoc(currentGym);
    const tgtLoc = resolveEffectiveLoc(targetGym);
    const isSameLocation =
      currentGym.id === targetGym.id ||
      (curLoc.city === tgtLoc.city && curLoc.country === tgtLoc.country);
    if (!isSameLocation) {
      return {
        isValid: false,
        reason: `Academia incompatível com sua localização atual. Você está sediado em ${curLoc.city} (${curLoc.country}) na ${currentGym.name}. Para frequentar presencialmente as aulas na ${targetGym.name} (${tgtLoc.city}), é necessário viajar e se transferir para este centro de treinamento.`
      };
    }
  }

  // Valida se a academia realmente oferece a modalidade desta turma
  if (
    targetGym &&
    Array.isArray(targetGym.focusArts) &&
    targetGym.focusArts.length > 0 &&
    !targetGym.focusArts.includes(turma.art)
  ) {
    return {
      isValid: false,
      reason: `A academia ${targetGym.name} não oferece ensino oficial da modalidade ${turma.art.toUpperCase()} em sua grade.`
    };
  }

  // Bloqueio de matrículas ativas simultâneas em locais geograficamente incompatíveis
  const activeClasses = (character.enrolledClasses || []).filter((c) => c.status === 'ativa');
  for (const existing of activeClasses) {
    if (existing.gymId !== turma.gymId) {
      const existingGym = WORLD_GYMS.find((g) => g.id === existing.gymId);
      if (existingGym && targetGym) {
        const exLoc = resolveEffectiveLoc(existingGym);
        const tgtLoc = resolveEffectiveLoc(targetGym);
        const areGymsInSameLocation = exLoc.city === tgtLoc.city && exLoc.country === tgtLoc.country;
        if (!areGymsInSameLocation) {
          return {
            isValid: false,
            reason: `Incompatibilidade geográfica: o atleta já possui matrícula ativa regular na ${existingGym.name} (${exLoc.city}). Não é permitido frequentar simultaneamente centros de treinamento em cidades/países distintos na mesma semana.`
          };
        }
      }
    }
  }

  // 3. Validação de Pré-requisitos
  if (turma.prerequisites.minRank !== undefined) {
    const currentRank = character.artGraduations?.[turma.art]?.rankIndex ?? 0;
    if (currentRank < turma.prerequisites.minRank) {
      return {
        isValid: false,
        reason: `Requer graduação mínima de nível ${turma.prerequisites.minRank} em ${turma.art} (atual: ${currentRank}).`
      };
    }
  }

  if (turma.prerequisites.minFightIq !== undefined) {
    const currentFightIq = character.attributes?.fightIq ?? 0;
    if (currentFightIq < turma.prerequisites.minFightIq) {
      return {
        isValid: false,
        reason: `Requer QI de luta mínimo de ${turma.prerequisites.minFightIq} (atual: ${currentFightIq}).`
      };
    }
  }

  if (turma.prerequisites.reputationReq !== undefined) {
    const currentHonor = character.honor ?? 0;
    if (currentHonor < turma.prerequisites.reputationReq) {
      return {
        isValid: false,
        reason: `Requer honra/reputação mínima de ${turma.prerequisites.reputationReq} (atual: ${currentHonor}).`
      };
    }
  }

  if (turma.prerequisites.minAge !== undefined) {
    if (character.age < turma.prerequisites.minAge) {
      return {
        isValid: false,
        reason: `Requer idade mínima de ${turma.prerequisites.minAge} anos (idade atual: ${character.age}).`
      };
    }
  }

  // 3. Validação de Capacidade e Conflitos em TODOS os dias da turma
  const weeklyActivities = getCharacterWeeklyActivities(character);

  for (const day of turma.daysOfWeek) {
    // Verifica se há sono reservado neste bloco no dia
    const sleepInBlock = weeklyActivities.find(
      (a) => a.dayOfWeek === day && a.block === turma.block && a.category === 'sono' && a.status !== 'cancelada'
    );
    if (sleepInBlock) {
      if (sleepInBlock.pointsCost + turma.pointsCost > POINTS_PER_BLOCK) {
        return {
          isValid: false,
          conflictDay: day,
          conflictBlock: turma.block,
          reason: `Conflito no bloco da ${turma.block} (${day}): este horário possui ${sleepInBlock.pointsCost} ponto(s) reservado(s) para o repouso fisiológico do atleta.`
        };
      }
    }

    // Verifica capacidade restante no bloco
    const blockCap = calculateBlockCapacity(day, turma.block, weeklyActivities);
    if (blockCap.usedPoints + turma.pointsCost > POINTS_PER_BLOCK) {
      const schoolAct = blockCap.activities.find((a) => a.category === 'escola');
      const studyAct = blockCap.activities.find((a) => a.category === 'estudos');
      const jobAct = blockCap.activities.find((a) => a.category === 'trabalho');
      const sleepAct = blockCap.activities.find((a) => a.category === 'sono');
      const existingClass = blockCap.activities.find(
        (a) => a.category === 'artes_marciais' || a.category === 'artes_marciais_estendida'
      );

      let conflictDetail = `Capacidade insuficiente (${blockCap.usedPoints}/${POINTS_PER_BLOCK} pontos ocupados, aula requer ${turma.pointsCost} pt(s)).`;
      if (schoolAct) {
        conflictDetail = `Conflito com o horário escolar obrigatório (${schoolAct.title}).`;
      } else if (studyAct) {
        conflictDetail = `Conflito com aula acadêmica matriculada (${studyAct.title}).`;
      } else if (jobAct) {
        conflictDetail = `Conflito com a jornada de trabalho protegida (${jobAct.title}).`;
      } else if (sleepAct) {
        conflictDetail = `Conflito com o período de repouso fisiológico (${sleepAct.title}).`;
      } else if (existingClass) {
        conflictDetail = `Conflito com outra aula já matriculada (${existingClass.title}) que ocupa ${existingClass.pointsCost} ponto(s).`;
      }

      return {
        isValid: false,
        conflictDay: day,
        conflictBlock: turma.block,
        reason: `Capacidade excedida na ${day} (${turma.block}): ${conflictDetail}`
      };
    }
  }

  return { isValid: true };
}

/**
 * Gera as sessões individuais agendadas para o mês corrente da data do personagem.
 * Não gera sessões retroativas no passado do mês civil.
 */
export function generateSessionsForEnrolledTurma(
  character: Character,
  turma: GymClassTurma
): ClassSessionRecord[] {
  const sessions: ClassSessionRecord[] = [];
  const currentMonth = character.currentDate.month;
  const currentYear = character.currentDate.year;
  const currentDay = character.currentDate.day;
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);

  for (let day = currentDay; day <= daysInMonth; day++) {
    const dayOfWeek = getDayOfWeekFromGameDate({ day, month: currentMonth, year: currentYear });
    if (turma.daysOfWeek.includes(dayOfWeek)) {
      sessions.push({
        id: `sess_${turma.id}_${currentYear}_${currentMonth}_${day}_${turma.block}`,
        enrollmentId: turma.id,
        classId: turma.id,
        gymId: turma.gymId,
        gymName: turma.gymName,
        art: turma.art,
        instructorName: turma.instructorName,
        title: turma.title,
        date: { day, month: currentMonth, year: currentYear },
        dayOfWeek,
        block: turma.block,
        pointsCost: turma.pointsCost,
        classType: turma.classType,
        status: 'agendada',
        xpEarned: 0 // Zero XP até ser concluída
      });
    }
  }

  return sessions;
}

/**
 * Gera sessões agendadas para todas as turmas ativas no início de um novo mês.
 */
export function generateMonthlySessionsForEnrolledClasses(character: Character): ClassSessionRecord[] {
  const sessions: ClassSessionRecord[] = [];
  const currentMonth = character.currentDate.month;
  const currentYear = character.currentDate.year;
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);

  const activeEnrolled = (character.enrolledClasses || []).filter((c) => c.status === 'ativa');
  // Agrupa matrículas por classId
  const uniqueClassesMap = new Map<string, EnrolledClass[]>();
  for (const item of activeEnrolled) {
    if (!uniqueClassesMap.has(item.classId)) {
      uniqueClassesMap.set(item.classId, []);
    }
    uniqueClassesMap.get(item.classId)!.push(item);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = getDayOfWeekFromGameDate({ day, month: currentMonth, year: currentYear });

    uniqueClassesMap.forEach((classes, classId) => {
      const classForDay = classes.find((c) => c.dayOfWeek === dayOfWeek);
      if (classForDay) {
        sessions.push({
          id: `sess_${classId}_${currentYear}_${currentMonth}_${day}_${classForDay.block}`,
          enrollmentId: classId,
          classId: classId,
          gymId: classForDay.gymId,
          gymName: classForDay.gymName,
          art: classForDay.art,
          instructorName: classForDay.instructorName,
          title: classForDay.title,
          date: { day, month: currentMonth, year: currentYear },
          dayOfWeek,
          block: classForDay.block,
          pointsCost: classForDay.pointsCost || 1,
          classType: classForDay.classType || (classForDay.pointsCost > 1 ? 'estendida' : 'regular'),
          status: 'agendada',
          xpEarned: 0
        });
      }
    });
  }

  return sessions;
}

/**
 * Efetiva a matrícula do atleta em uma turma.
 * Aloca a atividade nos dias da semana e gera sessões agendadas (0 XP) para o mês.
 */
export function enrollCharacterInTurma(
  character: Character,
  turma: GymClassTurma
): {
  updatedChar: Character;
  success: boolean;
  message: string;
  sessionsCreated: number;
  discoveredTalent?: {
    art: MartialArtType;
    level: ArtTalentLevel;
    label: string;
    stars: number;
    xpBonusPercent: number;
    attrBonusPercent: number;
  };
} {
  const validation = validateEnrollment(character, turma);
  if (!validation.isValid) {
    return {
      updatedChar: character,
      success: false,
      message: validation.reason || 'Matrícula não pôde ser confirmada devido a conflitos de agenda.',
      sessionsCreated: 0
    };
  }

  const updated: Character = JSON.parse(JSON.stringify(character));
  if (!Array.isArray(updated.enrolledClasses)) updated.enrolledClasses = [];
  if (!Array.isArray(updated.classSessions)) updated.classSessions = [];
  if (!updated.artTalents) updated.artTalents = generateRandomArtTalents();
  if (!updated.discoveredArtTalents) updated.discoveredArtTalents = {};

  const wasAlreadyDiscovered = Boolean(updated.discoveredArtTalents[turma.art]);
  updated.discoveredArtTalents[turma.art] = true;
  const talentLevel = updated.artTalents[turma.art] || 'comum';
  const talentMeta = getArtTalentMeta(talentLevel);

  const enrolledDateStr = `${character.currentDate.day}/${character.currentDate.month}/${character.currentDate.year}`;

  // Cria registro de matrícula para cada dia de aula da turma
  for (const day of turma.daysOfWeek) {
    updated.enrolledClasses.push({
      classId: turma.id,
      art: turma.art,
      gymId: turma.gymId,
      gymName: turma.gymName,
      instructorName: turma.instructorName,
      title: turma.title,
      dayOfWeek: day,
      block: turma.block,
      pointsCost: turma.pointsCost,
      status: 'ativa',
      enrolledDate: enrolledDateStr,
      classType: turma.classType
    });
  }

  // Gera sessões agendadas futuras no mês corrente
  const newSessions = generateSessionsForEnrolledTurma(character, turma);
  updated.classSessions.push(...newSessions);

  const artDisplayName = MARTIAL_ARTS_META[turma.art]?.name || turma.art;
  const talentNotice = !wasAlreadyDiscovered
    ? ` ✨ Talento Descoberto em ${artDisplayName}: ${talentMeta.shortLabel} (${
        talentMeta.xpBonusPercent > 0 ? `+${talentMeta.xpBonusPercent}% XP de evolução` : 'evolução padrão'
      })!`
    : '';

  return {
    updatedChar: updated,
    success: true,
    message: `Matrícula confirmada na turma "${turma.title}"! ${newSessions.length} sessões agendadas para este mês.${talentNotice}`,
    sessionsCreated: newSessions.length,
    discoveredTalent: !wasAlreadyDiscovered
      ? {
          art: turma.art,
          level: talentLevel,
          label: talentMeta.label,
          stars: talentMeta.stars,
          xpBonusPercent: talentMeta.xpBonusPercent,
          attrBonusPercent: talentMeta.attrBonusPercent
        }
      : undefined
  };
}

/**
 * Cancela a matrícula do atleta em uma turma.
 * Interrompe a geração de sessões futuras, mas preserva estritamente o histórico de sessões já realizadas (presenças e faltas).
 */
export function cancelEnrollment(
  character: Character,
  enrollmentId: string
): { updatedChar: Character; success: boolean; message: string } {
  const updated: Character = JSON.parse(JSON.stringify(character));

  if (!Array.isArray(updated.enrolledClasses)) updated.enrolledClasses = [];
  if (!Array.isArray(updated.classSessions)) updated.classSessions = [];

  let foundEnrollment = false;
  updated.enrolledClasses = updated.enrolledClasses.map((c) => {
    if (c.classId === enrollmentId) {
      foundEnrollment = true;
      return { ...c, status: 'cancelada' };
    }
    return c;
  });

  if (!foundEnrollment) {
    return {
      updatedChar: character,
      success: false,
      message: 'Matrícula não encontrada.'
    };
  }

  // Cancela apenas sessões futuras agendadas. Sessões concluídas e faltas são PRESERVADAS intactas!
  updated.classSessions = updated.classSessions.map((s) => {
    if (s.enrollmentId === enrollmentId && s.status === 'agendada') {
      return { ...s, status: 'cancelada' };
    }
    return s;
  });

  return {
    updatedChar: updated,
    success: true,
    message: 'Matrícula cancelada com sucesso. Os pontos foram liberados na agenda semanal e o histórico anterior foi preservado.'
  };
}

/**
 * Registra a presença e conclusão de uma sessão de aula.
 * Concede XP na arte marcial com o bônus da academia e consome energia proporcional.
 */
export function completeSessionAttendance(
  character: Character,
  sessionId: string,
  gymLookup?: (gymId: string) => any
): { updatedChar: Character; success: boolean; message: string; xpEarned?: number } {
  const updated: Character = JSON.parse(JSON.stringify(character));
  if (!Array.isArray(updated.classSessions)) {
    return { updatedChar: character, success: false, message: 'Nenhuma sessão registrada.' };
  }

  const sessionIndex = updated.classSessions.findIndex((s) => s.id === sessionId);
  if (sessionIndex === -1) {
    return { updatedChar: character, success: false, message: 'Sessão de treino não encontrada.' };
  }

  const session = updated.classSessions[sessionIndex];
  if (session.status !== 'agendada') {
    return {
      updatedChar: character,
      success: false,
      message: `Esta sessão já possui o status "${session.status}".`
    };
  }

  // Identifica a academia para bônus de XP
  const gym = gymLookup ? gymLookup(session.gymId) : { id: session.gymId };
  const { finalXp, energyCost, bonusLabel } = calculateSessionTrainingXp(session.pointsCost, gym);

  if (updated.energy < energyCost) {
    return {
      updatedChar: character,
      success: false,
      message: `Energia insuficiente para treinar (${updated.energy}/${energyCost} necessária). Descanse antes de ir ao dojô.`
    };
  }

  // Deduz energia
  updated.energy = Math.max(0, updated.energy - energyCost);

  // Concede XP na arte marcial com teto seguro e atualização imediata de graus (BJJ)
  if (!updated.artGraduations) {
    return { updatedChar: character, success: false, message: 'Graduações do atleta corrompidas.' };
  }

  let actualXpEarned = finalXp;
  if (updated.artGraduations[session.art]) {
    const xpRes = addTrainingGraduationXp(updated, session.art, finalXp, 1.0);
    Object.assign(updated, xpRes.updatedChar);
    actualXpEarned = xpRes.xpAdded;
  }

  // Atualiza a sessão
  const completedSession: ClassSessionRecord = {
    ...session,
    status: 'concluida',
    xpEarned: actualXpEarned,
    energyCost,
    completedAt: `${updated.currentDate.day}/${updated.currentDate.month}/${updated.currentDate.year}`
  };

  updated.classSessions[sessionIndex] = completedSession;

  return {
    updatedChar: updated,
    success: true,
    message: `Presença confirmada! Treino concluído com sucesso: +${actualXpEarned} XP em ${session.art.toUpperCase()} (${bonusLabel}). -${energyCost} energia.`,
    xpEarned: actualXpEarned
  };
}

/**
 * Registra a falta do atleta em uma sessão de treino agendada.
 * Preserva o registro para histórico de disciplina e assiduidade.
 */
export function markSessionAbsence(
  character: Character,
  sessionId: string
): { updatedChar: Character; success: boolean; message: string } {
  const updated: Character = JSON.parse(JSON.stringify(character));
  if (!Array.isArray(updated.classSessions)) {
    return { updatedChar: character, success: false, message: 'Nenhuma sessão registrada.' };
  }

  const sessionIndex = updated.classSessions.findIndex((s) => s.id === sessionId);
  if (sessionIndex === -1) {
    return { updatedChar: character, success: false, message: 'Sessão de treino não encontrada.' };
  }

  const session = updated.classSessions[sessionIndex];
  if (session.status !== 'agendada') {
    return {
      updatedChar: character,
      success: false,
      message: `Esta sessão já possui o status "${session.status}".`
    };
  }

  updated.classSessions[sessionIndex] = {
    ...session,
    status: 'falta',
    xpEarned: 0,
    energyCost: 0
  };

  return {
    updatedChar: updated,
    success: true,
    message: 'Falta registrada no histórico de frequência da turma.'
  };
}
