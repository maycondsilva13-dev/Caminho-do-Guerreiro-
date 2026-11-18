import { Character, GameDate, SocialContact } from '../types/game';
import { calculateSessionTrainingXp } from '../types/agenda';
import { WORLD_GYMS } from '../data/martialArtsData';
import { getDaysInMonth, isLeapYear } from './dateUtils';
import { addTrainingGraduationXp } from './graduationHelper';
import { getRelationLabel } from './socialLifeHelper';
import { getActiveArtTalentBonus } from './talentAndDifficultyHelper';

export type MonthlyAbsenceReasonType =
  | 'pj_doente'
  | 'familia_doente'
  | 'aniversario_familia'
  | 'casamento_familia'
  | 'batizado_familia';

export interface MonthlyAbsenceEvent {
  startDay: number;
  endDay: number;
  reasonType: MonthlyAbsenceReasonType;
  title: string;
  notes: string;
  contactId?: string;
}

export interface BirthdayAffordabilityResult {
  canAfford: boolean;
  playerCost: number;
  payerLabel: string;
}

const FAMILY_RELATION_TYPES = new Set(['pai', 'mae', 'irmao', 'filho', 'conjuge']);

const REASON_PRIORITY: Record<MonthlyAbsenceReasonType, number> = {
  pj_doente: 5,
  familia_doente: 4,
  casamento_familia: 3,
  batizado_familia: 2,
  aniversario_familia: 1
};

const PJ_ILLNESSES = [
  { name: 'Gripe forte', minDays: 2, maxDays: 3 },
  { name: 'Virose estomacal', minDays: 2, maxDays: 2 },
  { name: 'Febre e resfriado', minDays: 2, maxDays: 3 },
  { name: 'Infecção de garganta', minDays: 2, maxDays: 3 }
];

const FAMILY_ILLNESSES = [
  'gripe forte',
  'febre alta',
  'virose',
  'indisposição que exigiu acompanhamento médico'
];

export function isFamilyContact(contact: SocialContact): boolean {
  return (
    contact.isAlive &&
    (FAMILY_RELATION_TYPES.has(contact.relationType) || contact.relationshipStage === 'casado')
  );
}

/**
 * Regra financeira de comemoração de aniversário:
 * Família sem dinheiro não comemora aniversário de ninguém.
 */
export function canFamilyAffordBirthday(
  char: Character,
  targetIsOwnHousehold: boolean
): BirthdayAffordabilityResult {
  const PARTY_COST = 120;
  const RELATIVE_CONTRIBUTION = 80;

  const contacts = Array.isArray(char.socialContacts) ? char.socialContacts : [];
  const livingParents = contacts.filter(
    (c) => c.isAlive && (c.relationType === 'pai' || c.relationType === 'mae')
  );
  const livingSpouse = contacts.find(
    (c) =>
      c.isAlive &&
      (c.id === char.spouseId || c.relationType === 'conjuge' || c.relationshipStage === 'casado')
  );

  const hasWealthySpouse = Boolean(
    livingSpouse && (livingSpouse.wealthTier === 'abastado' || livingSpouse.wealthTier === 'milionario')
  );
  const hasWealthyParent = livingParents.some(
    (p) => p.wealthTier === 'abastado' || p.wealthTier === 'milionario'
  );
  const hasMiddleClassParent = livingParents.some((p) => p.wealthTier === 'classe_media');

  if (targetIsOwnHousehold) {
    if (char.money >= PARTY_COST) {
      return { canAfford: true, playerCost: PARTY_COST, payerLabel: 'Orçamento da casa' };
    }
    if (hasWealthySpouse) {
      return { canAfford: true, playerCost: 0, payerLabel: 'Cônjuge' };
    }
    if (char.age < 18 && (hasWealthyParent || (hasMiddleClassParent && char.money > 0))) {
      return { canAfford: true, playerCost: 0, payerLabel: 'Pais' };
    }
    return { canAfford: false, playerCost: 0, payerLabel: 'Sem recursos' };
  }

  // Aniversário de pai, mãe, irmão ou PJ menor de idade
  if (char.age < 18) {
    if (hasWealthyParent) {
      return { canAfford: true, playerCost: 0, payerLabel: 'Pais' };
    }
    if (hasMiddleClassParent && char.money > 0) {
      return { canAfford: true, playerCost: 0, payerLabel: 'Família' };
    }
    if (char.money >= PARTY_COST) {
      return { canAfford: true, playerCost: RELATIVE_CONTRIBUTION, payerLabel: 'Economias próprias' };
    }
    return { canAfford: false, playerCost: 0, payerLabel: 'Sem recursos' };
  }

  // PJ adulto (>= 18)
  if (char.money >= RELATIVE_CONTRIBUTION) {
    return { canAfford: true, playerCost: RELATIVE_CONTRIBUTION, payerLabel: 'Família & PJ' };
  }
  if (hasWealthyParent || hasWealthySpouse) {
    return { canAfford: true, playerCost: 0, payerLabel: 'Família' };
  }
  return { canAfford: false, playerCost: 0, payerLabel: 'Sem recursos' };
}

/**
 * Avalia ocorrências raras (baixa probabilidade) de doença do PJ ou de um familiar no mês.
 */
export function rollMonthlyIllnesses(
  char: Character,
  outgoingDate: GameDate,
  rng: () => number = Math.random
): { events: MonthlyAbsenceEvent[]; logs: string[] } {
  const events: MonthlyAbsenceEvent[] = [];
  const logs: string[] = [];
  const daysInMonth = getDaysInMonth(outgoingDate.month, outgoingDate.year);

  // 1. Chance baixa de o próprio PJ adoecer (~3% ao mês, ajustada levemente por fadiga/dieta/idade/camp)
  let pjSickChance = 0.03;
  if ((char.accumulatedFatigue || 0) >= 65) pjSickChance += 0.015;
  if (char.dietPlan === 'atletica') pjSickChance -= 0.008;
  if (char.age >= 60) pjSickChance += 0.01;
  if (char.trainingCampIntensity === 'leve') pjSickChance -= 0.01;
  else if (char.trainingCampIntensity === 'intenso') pjSickChance += 0.015;
  pjSickChance = Math.max(0.01, Math.min(0.07, pjSickChance));

  if (rng() < pjSickChance) {
    const picked = PJ_ILLNESSES[Math.floor(rng() * PJ_ILLNESSES.length)];
    const duration =
      picked.minDays + Math.floor(rng() * (picked.maxDays - picked.minDays + 1));
    const maxStart = Math.max(1, daysInMonth - duration + 1);
    const startDay = 1 + Math.floor(rng() * maxStart);
    const endDay = Math.min(daysInMonth, startDay + duration - 1);

    events.push({
      startDay,
      endDay,
      reasonType: 'pj_doente',
      title: picked.name,
      notes: `Falta médica: Você adoeceu (${picked.name})`
    });

    logs.push(
      `🤒 Saúde: Entre os dias ${startDay} e ${endDay}/${String(outgoingDate.month).padStart(2, '0')} você adoeceu (${picked.name}) e precisou de repouso médico.`
    );
  }

  // 2. Chance baixa de alguém da família adoecer (~3.5% ao mês no núcleo familiar)
  const livingFamily = (char.socialContacts || []).filter(isFamilyContact);
  if (livingFamily.length > 0) {
    const hasFragile = livingFamily.some((c) => c.age >= 65 || c.health < 55);
    const famSickChance = hasFragile ? 0.052 : 0.035;

    if (rng() < famSickChance) {
      // Dá leve prioridade a familiares mais velhos ou com saúde mais baixa
      const weightedPool: SocialContact[] = [];
      for (const m of livingFamily) {
        weightedPool.push(m);
        if (m.age >= 65 || m.health < 60) weightedPool.push(m);
      }
      const member = weightedPool[Math.floor(rng() * weightedPool.length)];
      const duration = 1 + Math.floor(rng() * 3); // 1 a 3 dias
      const maxStart = Math.max(1, daysInMonth - duration + 1);
      const startDay = 1 + Math.floor(rng() * maxStart);
      const endDay = Math.min(daysInMonth, startDay + duration - 1);
      const illnessDesc = FAMILY_ILLNESSES[Math.floor(rng() * FAMILY_ILLNESSES.length)];

      member.health = Math.max(15, member.health - 6);
      member.affinity = Math.min(100, member.affinity + 3);
      const monthStr = `${String(outgoingDate.month).padStart(2, '0')}/${outgoingDate.year}`;
      member.recentLifeEvents = [
        `Teve ${illnessDesc} em ${monthStr} e recebeu apoio de ${char.name}.`,
        ...(member.recentLifeEvents || [])
      ].slice(0, 4);

      const rel = getRelationLabel(member);
      events.push({
        startDay,
        endDay,
        reasonType: 'familia_doente',
        title: `${member.name} adoeceu`,
        notes: `Falta familiar: Cuidando de ${member.name} (${rel}) que adoeceu`,
        contactId: member.id
      });

      logs.push(
        `🩺 Família: ${member.name} (${rel}) teve ${illnessDesc} (dias ${startDay}${endDay > startDay ? `–${endDay}` : ''}/${String(outgoingDate.month).padStart(2, '0')}) e você ficou ao lado para ajudar.`
      );
    }
  }

  return { events, logs };
}

/**
 * Avalia todos os aniversários da família (e do PJ quando aplicável) no mês que se encerra.
 * Regra obrigatória: família sem dinheiro não comemora aniversário de ninguém.
 */
export function collectMonthlyFamilyBirthdays(
  char: Character,
  outgoingDate: GameDate,
  options: { skipOwnBirthday?: boolean } = {}
): {
  events: MonthlyAbsenceEvent[];
  logs: string[];
  ownBirthdayCelebrated: boolean;
} {
  const events: MonthlyAbsenceEvent[] = [];
  const logs: string[] = [];
  let ownBirthdayCelebrated = false;

  const daysInMonth = getDaysInMonth(outgoingDate.month, outgoingDate.year);
  const livingFamily = (char.socialContacts || []).filter(isFamilyContact);

  // 1. Aniversários reais dos familiares vivos neste mês
  for (const member of livingFamily) {
    if (!member.birthDate || member.birthDate.month !== outgoingDate.month) continue;

    const isBornFeb29 = member.birthDate.month === 2 && member.birthDate.day === 29;
    const celebDay =
      isBornFeb29 && !isLeapYear(outgoingDate.year)
        ? 28
        : Math.min(daysInMonth, Math.max(1, member.birthDate.day));

    const isOwnHousehold =
      member.relationType === 'conjuge' ||
      member.relationshipStage === 'casado' ||
      member.relationType === 'filho';

    const afford = canFamilyAffordBirthday(char, isOwnHousehold);
    const rel = getRelationLabel(member);

    if (afford.canAfford) {
      if (afford.playerCost > 0) {
        char.money = Math.max(0, char.money - afford.playerCost);
      }
      member.affinity = Math.min(100, member.affinity + 3);
      char.mentalHealth = Math.min(100, char.mentalHealth + 2);
      char.stress = Math.max(0, char.stress - 2);

      events.push({
        startDay: celebDay,
        endDay: celebDay,
        reasonType: 'aniversario_familia',
        title: `Aniversário de ${member.name}`,
        notes: `Falta justificada: Aniversário de ${member.name} (${rel}) em família`,
        contactId: member.id
      });

      logs.push(
        `🎂 Aniversário na Família: Dia ${String(celebDay).padStart(2, '0')}/${String(outgoingDate.month).padStart(2, '0')} celebraram o aniversário de ${member.name} (${rel})${afford.playerCost > 0 ? ` (-R$ ${afford.playerCost})` : ''}.`
      );
    } else {
      logs.push(
        `💸 Sem Comemoração: A família está sem dinheiro no momento, então o aniversário de ${member.name} (${rel}) em ${String(celebDay).padStart(2, '0')}/${String(outgoingDate.month).padStart(2, '0')} passou sem festa.`
      );
    }
  }

  // 2. Aniversário do próprio PJ no mês que se encerra (quando cai nesse mês e não foi tratado na virada do dia 1)
  if (
    !options.skipOwnBirthday &&
    char.birthDate &&
    char.birthDate.month === outgoingDate.month &&
    char.ownBirthdayCelebratedYear !== outgoingDate.year
  ) {
    const isBornFeb29 = char.birthDate.month === 2 && char.birthDate.day === 29;
    const ownDay =
      isBornFeb29 && !isLeapYear(outgoingDate.year)
        ? 28
        : Math.min(daysInMonth, Math.max(1, char.birthDate.day));

    // Evita comemorar retrospectivamente se o personagem começou a carreira já depois do dia do aniversário no mês inicial
    const isInitialPartialMonth =
      char.careerStartDate &&
      outgoingDate.year === char.careerStartDate.year &&
      outgoingDate.month === char.careerStartDate.month &&
      char.careerStartDate.day > ownDay;

    if (!isInitialPartialMonth) {
      const afford = canFamilyAffordBirthday(
        char,
        char.age >= 18 || char.maritalStatus === 'casado'
      );
      char.ownBirthdayCelebratedYear = outgoingDate.year;

      if (afford.canAfford) {
        if (afford.playerCost > 0) {
          char.money = Math.max(0, char.money - afford.playerCost);
        }
        char.mentalHealth = Math.min(100, char.mentalHealth + 4);
        char.stress = Math.max(0, char.stress - 4);
        ownBirthdayCelebrated = true;

        events.push({
          startDay: ownDay,
          endDay: ownDay,
          reasonType: 'aniversario_familia',
          title: `Seu aniversário (${char.age} anos)`,
          notes: `Falta justificada: Comemoração do seu aniversário em família`
        });
      } else {
        ownBirthdayCelebrated = false;
        logs.push(
          `💸 Aniversário sem festa: Você completou ${char.age} anos no dia ${String(ownDay).padStart(2, '0')}/${String(outgoingDate.month).padStart(2, '0')}, mas a família está sem dinheiro para comemorar.`
        );
      }
    }
  }

  return { events, logs, ownBirthdayCelebrated };
}

/**
 * Resolve automaticamente todas as sessões de treino agendadas do mês que se encerra:
 * - O PJ comparece a TODOS os treinos matriculados e ganha o XP respectivo;
 * - Exceto nos dias em que adoeceu, alguém da família adoeceu, ou houve
 *   aniversário/casamento/batizado na família coincidindo com o dia de treino.
 */
export function resolveMonthlyTrainingAttendance(
  char: Character,
  outgoingDate: GameDate,
  absenceEvents: MonthlyAbsenceEvent[]
): {
  updatedChar: Character;
  attendedCount: number;
  missedCount: number;
  totalXpEarned: number;
  logs: string[];
} {
  let updated = char;
  const logs: string[] = [];

  if (!Array.isArray(updated.classSessions) || updated.classSessions.length === 0) {
    return {
      updatedChar: updated,
      attendedCount: 0,
      missedCount: 0,
      totalXpEarned: 0,
      logs
    };
  }

  // Índices de sessões ainda 'agendada' pertencentes ao mês que está fechando (ou anteriores pendentes)
  const pendingIndices: number[] = [];
  updated.classSessions.forEach((s, idx) => {
    if (s.status !== 'agendada') return;
    const isClosingOrPast =
      s.date.year < outgoingDate.year ||
      (s.date.year === outgoingDate.year && s.date.month <= outgoingDate.month);
    if (isClosingOrPast) {
      pendingIndices.push(idx);
    }
  });

  // Ordena cronologicamente para aplicação fiel de XP e evolução de faixas/graus
  pendingIndices.sort((a, b) => {
    const sa = updated.classSessions![a].date;
    const sb = updated.classSessions![b].date;
    if (sa.year !== sb.year) return sa.year - sb.year;
    if (sa.month !== sb.month) return sa.month - sb.month;
    return sa.day - sb.day;
  });

  let attendedCount = 0;
  let missedCount = 0;
  let totalXpEarned = 0;
  const missedNotesSummary = new Map<string, { reasonType: MonthlyAbsenceReasonType; days: number[] }>();

  for (const idx of pendingIndices) {
    const session = updated.classSessions![idx];

    // Verifica se alguma exceção do mês coincida com o dia desta sessão
    let matchedEvent: MonthlyAbsenceEvent | undefined;
    if (session.date.month === outgoingDate.month && session.date.year === outgoingDate.year) {
      for (const ev of absenceEvents) {
        if (session.date.day >= ev.startDay && session.date.day <= ev.endDay) {
          if (
            !matchedEvent ||
            REASON_PRIORITY[ev.reasonType] > REASON_PRIORITY[matchedEvent.reasonType]
          ) {
            matchedEvent = ev;
          }
        }
      }
    }

    if (matchedEvent) {
      updated.classSessions![idx] = {
        ...session,
        status: 'falta',
        xpEarned: 0,
        energyCost: 0,
        notes: matchedEvent.notes
      };
      missedCount += 1;

      const existing = missedNotesSummary.get(matchedEvent.notes);
      if (existing) {
        if (!existing.days.includes(session.date.day)) existing.days.push(session.date.day);
      } else {
        missedNotesSummary.set(matchedEvent.notes, {
          reasonType: matchedEvent.reasonType,
          days: [session.date.day]
        });
      }
      continue;
    }

    // PJ comparece ao treino matriculado (respeitando periodização / camp de luta)
    const campIntensity = updated.trainingCampIntensity || 'tecnico';
    const campXpMultiplier = campIntensity === 'leve' ? 0.85 : campIntensity === 'intenso' ? 1.25 : 1.0;

    const gym = WORLD_GYMS.find((g) => g.id === session.gymId) || { id: session.gymId };
    const { finalXp, energyCost } = calculateSessionTrainingXp(session.pointsCost, gym);
    const campAdjustedXp = Math.max(1, Math.round(finalXp * campXpMultiplier));

    let actualXp = campAdjustedXp;
    if (updated.artGraduations && updated.artGraduations[session.art]) {
      const xpRes = addTrainingGraduationXp(updated, session.art, campAdjustedXp, 1.0);
      updated = xpRes.updatedChar;
      actualXp = xpRes.xpAdded;
    }

    updated.classSessions![idx] = {
      ...session,
      status: 'concluida',
      xpEarned: actualXp,
      energyCost,
      completedAt: `${session.date.day}/${session.date.month}/${session.date.year}`,
      notes: session.notes || 'Presença automática mensal'
    };

    attendedCount += 1;
    totalXpEarned += actualXp;
  }

  const totalProcessed = attendedCount + missedCount;
  if (totalProcessed > 0) {
    const campIntensity = updated.trainingCampIntensity || 'tecnico';
    const primaryTalent = getActiveArtTalentBonus(updated, updated.primaryArt);
    const tAttrMult = primaryTalent.attrMultiplier;
    let campPolishNote = '';
    if (attendedCount > 0 && updated.attributes) {
      const clampAttr = (v: number) => Math.min(99, Math.round(v * 10) / 10);
      if (campIntensity === 'leve') {
        updated.attributes.fightIq = clampAttr(updated.attributes.fightIq + 0.3 * tAttrMult);
        updated.attributes.mentalFocus = clampAttr(updated.attributes.mentalFocus + 0.2 * tAttrMult);
        campPolishNote = ' [Camp Leve: +QI, +Foco]';
      } else if (campIntensity === 'intenso') {
        updated.attributes.stamina = clampAttr(updated.attributes.stamina + 0.5 * tAttrMult);
        updated.attributes.strength = clampAttr(updated.attributes.strength + 0.4 * tAttrMult);
        updated.attributes.technique = clampAttr(updated.attributes.technique + 0.2 * tAttrMult);
        campPolishNote = ' [Camp Intenso: +Gás, +Força, +Técnica]';
      } else {
        updated.attributes.technique = clampAttr(updated.attributes.technique + 0.4 * tAttrMult);
        updated.attributes.fightIq = clampAttr(updated.attributes.fightIq + 0.2 * tAttrMult);
        campPolishNote = ' [Camp Técnico: +Técnica, +QI]';
      }
      if (primaryTalent.discovered && primaryTalent.meta && primaryTalent.meta.attrBonusPercent > 0) {
        campPolishNote += ` [Talento ${primaryTalent.meta.shortLabel}: +${primaryTalent.meta.xpBonusPercent}% XP]`;
      }
    }

    logs.push(
      `🏋️ Frequência Mensal: Você compareceu a ${attendedCount}/${totalProcessed} treino(s) matriculado(s) no mês (+${totalXpEarned} XP).${campPolishNote}`
    );

    missedNotesSummary.forEach((info, noteText) => {
      const daysFmt = info.days
        .sort((a, b) => a - b)
        .map((d) => `${String(d).padStart(2, '0')}/${String(outgoingDate.month).padStart(2, '0')}`)
        .join(', ');

      if (info.reasonType === 'pj_doente' || info.reasonType === 'familia_doente') {
        logs.push(`🤒 Ausência Justificada (${daysFmt}): ${noteText}.`);
      } else {
        logs.push(`🎉 Evento em Família (${daysFmt}): ${noteText} — você priorizou a família e faltou ao treino.`);
      }
    });
  }

  return {
    updatedChar: updated,
    attendedCount,
    missedCount,
    totalXpEarned,
    logs
  };
}
