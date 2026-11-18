import { BrazilUF, Character, Gym } from '../types/game';
import { WORLD_GYMS } from '../data/martialArtsData';
import { 
  getCharacterWeeklyActivities, 
  evaluateSleepQuality, 
  POINTS_PER_BLOCK, 
  DAILY_POINTS_CAPACITY 
} from '../types/agenda';
import {
  estimateTravelLogistics,
  resolveBrazilCapitalByCity,
  resolveBrazilCapitalByUf,
  TravelLogisticsEstimate
} from './regionalGeographyHelper';
import { getCompetitiveScholarshipDiscount } from './regionalGymsHelper';
import { getEquipmentSummary } from './equipmentShopHelper';

// ============================================================================
// ETAPA 3.2 — ECONOMIA DAS ACADEMIAS & MENSALIDADES
// ============================================================================

export interface GymExpenseItem {
  gymId: string;
  gymName: string;
  weeklyCost: number;
  monthlyCost: number; // weeklyCost * 4 (com eventual bolsa de mérito aplicada)
  paidByFamily: boolean;
  familyAmount: number;
  athleteAmount: number;
  classesCount: number;
  scholarshipLabel?: string;
}

export interface GymMonthlyExpensesResult {
  totalMonthlyExpense: number;       // Custo total das mensalidades de academias
  totalAthleteCost: number;          // Valor desembolsado pelo próprio atleta
  totalFamilyContribution: number;   // Valor coberto pelo suporte familiar
  gyms: GymExpenseItem[];            // Lista discriminada por academia única
  uniqueGymCount: number;            // Quantidade de academias distintas
  activeClassesCount: number;        // Total de turmas ativas
}

/**
 * Calcula a cobrança mensal de mensalidades de academias de forma rigorosa:
 * 1. Cada academia distinta possui seu custo mensal próprio (weeklyCost * 4).
 * 2. Múltiplas turmas na MESMA academia NÃO geram cobranças duplicadas de mensalidade.
 * 3. Matrículas canceladas NÃO geram cobrança futura.
 * 4. Atletas menores (< 18 anos) contam com apoio familiar conforme poder aquisitivo.
 */
export function calculateGymMonthlyExpenses(character: Character): GymMonthlyExpensesResult {
  const activeClasses = (character.enrolledClasses || []).filter((c) => c.status === 'ativa');
  
  // Conjunto de academias que o atleta frequenta:
  // - Academias onde possui turmas ativas
  // - E a academia base atual onde treina/reside (currentGymId)
  const distinctGymIds = new Set<string>();
  activeClasses.forEach((c) => distinctGymIds.add(c.gymId));
  if (character.currentGymId) {
    distinctGymIds.add(character.currentGymId);
  }

  const gymBreakdown: GymExpenseItem[] = [];
  let totalMonthlyExpense = 0;
  let totalAthleteCost = 0;
  let totalFamilyContribution = 0;

  distinctGymIds.forEach((gymId) => {
    const gym = WORLD_GYMS.find((g) => g.id === gymId);
    if (!gym) return;

    const weeklyCost = gym.weeklyCost || 0;
    const baseMonthlyCost = weeklyCost * 4;
    const scholarship = getCompetitiveScholarshipDiscount(character, gym);
    const monthlyCost = scholarship.eligible
      ? Math.round(baseMonthlyCost * (1 - scholarship.discountRate))
      : baseMonthlyCost;
    const classesInGym = activeClasses.filter((c) => c.gymId === gymId).length;

    let paidByFamily = false;
    let familyAmount = 0;
    let athleteAmount = monthlyCost;

    // Regra de atletas menores (< 18 anos) considerando o poder aquisitivo familiar
    if (character.age < 18) {
      const livingParents = (character.socialContacts || []).filter(
        (c) => c.isAlive && (c.relationType === 'pai' || c.relationType === 'mae')
      );
      const effectiveFamilyTier =
        livingParents.some((p) => p.wealthTier === 'milionario') || character.familyWealthTier === 'milionario'
          ? 'milionario'
          : livingParents.some((p) => p.wealthTier === 'abastado') || character.familyWealthTier === 'abastado'
          ? 'abastado'
          : livingParents.some((p) => p.wealthTier === 'classe_media') ||
            (livingParents.length === 0 && character.familyWealthTier !== 'humilde')
          ? 'classe_media'
          : 'humilde';

      const isLocalOrBaseGym = gym.country === 'Brasil' || gym.id === 'gym_bairro';
      if (effectiveFamilyTier === 'milionario') {
        if (character.familySupport >= 50) {
          paidByFamily = true;
          familyAmount = monthlyCost;
          athleteAmount = 0;
        }
      } else if (effectiveFamilyTier === 'humilde') {
        // Família humilde só consegue sustentar academias gratuitas (weeklyCost = 0)
        if (monthlyCost === 0) {
          paidByFamily = true;
          familyAmount = 0;
          athleteAmount = 0;
        }
      } else {
        if (isLocalOrBaseGym && character.familySupport >= 50) {
          paidByFamily = true;
          familyAmount = monthlyCost;
          athleteAmount = 0;
        } else if (!isLocalOrBaseGym && character.familySupport >= 70) {
          familyAmount = Math.round(monthlyCost * 0.6);
          athleteAmount = monthlyCost - familyAmount;
          paidByFamily = familyAmount > 0;
        }
      }
    }

    totalMonthlyExpense += monthlyCost;
    totalAthleteCost += athleteAmount;
    totalFamilyContribution += familyAmount;

    gymBreakdown.push({
      gymId: gym.id,
      gymName: gym.name,
      weeklyCost,
      monthlyCost,
      paidByFamily,
      familyAmount,
      athleteAmount,
      classesCount: classesInGym,
      ...(scholarship.eligible && scholarship.label ? { scholarshipLabel: scholarship.label } : {})
    });
  });

  return {
    totalMonthlyExpense,
    totalAthleteCost,
    totalFamilyContribution,
    gyms: gymBreakdown,
    uniqueGymCount: gymBreakdown.length,
    activeClassesCount: activeClasses.length
  };
}

// ============================================================================
// ETAPA 3.2 & ETAPA 3 — LOCALIZAÇÃO E DESLOCAMENTO NAS 27 CAPITAIS
// ============================================================================

export function resolveEffectiveGymLocation(
  gym: Gym,
  character?: Character
): { city: string; uf?: string; country: string } {
  if (gym.id === 'gym_bairro') {
    const cap = resolveBrazilCapitalByCity(
      character?.currentCity || character?.homeCity,
      character?.homeState || 'SP'
    );
    return {
      city: cap.capital,
      uf: cap.uf,
      country: character?.currentCountry || 'Brasil'
    };
  }

  if (gym.country === 'Brasil') {
    const cap = resolveBrazilCapitalByCity(gym.city, gym.uf || 'SP');
    return {
      city: cap.capital,
      uf: cap.uf,
      country: 'Brasil'
    };
  }

  return {
    city: gym.city,
    country: gym.country
  };
}

export function areGymsInSameLocation(
  gymA: Gym,
  gymB: Gym,
  character?: Character
): boolean {
  if (gymA.id === gymB.id) return true;
  const locA = resolveEffectiveGymLocation(gymA, character);
  const locB = resolveEffectiveGymLocation(gymB, character);
  return locA.city === locB.city && locA.country === locB.country;
}

export function getGymTravelLogistics(
  character: Character,
  targetGym: Gym
): TravelLogisticsEstimate {
  const originCountry = character.currentCountry || 'Brasil';
  const originCap =
    originCountry === 'Brasil'
      ? resolveBrazilCapitalByCity(character.currentCity || character.homeCity, character.homeState || 'SP')
      : undefined;

  const destLoc = resolveEffectiveGymLocation(targetGym, character);
  return estimateTravelLogistics(
    {
      country: originCountry,
      uf: originCap?.uf,
      city: originCap?.capital || character.currentCity || character.homeCity
    },
    {
      country: destLoc.country,
      uf: destLoc.uf,
      city: destLoc.city
    }
  );
}

/**
 * Valida a compatibilidade geográfica entre a localização atual do atleta e a academia da turma.
 * O atleta não pode frequentar turmas presenciais semanais em locais geograficamente incompatíveis
 * com sua base atual (currentGymId / currentCity) sem realizar uma viagem/mudança.
 */
export function validateLocationCompatibility(
  character: Character,
  targetGymId: string
): { isCompatible: boolean; reason?: string; currentGymName: string; targetGymName: string } {
  const isOwnAcademy = Boolean(character.playerAcademy && character.currentGymId === character.playerAcademy.id);
  const currentGym = isOwnAcademy && character.playerAcademy
    ? {
        ...WORLD_GYMS[0],
        id: character.playerAcademy.id,
        name: character.playerAcademy.name,
        city: character.playerAcademy.city,
        country: character.playerAcademy.country
      }
    : WORLD_GYMS.find((g) => g.id === (character.currentGymId || 'gym_bairro')) || WORLD_GYMS[0];
  const targetGym = WORLD_GYMS.find((g) => g.id === targetGymId);

  const currentGymName = currentGym?.name || 'Academia Local';
  const targetGymName = targetGym?.name || 'Academia de Destino';

  if (!targetGym) {
    return {
      isCompatible: false,
      reason: 'Academia não encontrada no catálogo oficial.',
      currentGymName,
      targetGymName
    };
  }

  if (areGymsInSameLocation(currentGym, targetGym, character)) {
    return { isCompatible: true, currentGymName, targetGymName };
  }

  const currentLoc = resolveEffectiveGymLocation(currentGym, character);
  const targetLoc = resolveEffectiveGymLocation(targetGym, character);

  // Geograficamente incompatível: requer viagem/mudança
  return {
    isCompatible: false,
    reason: `Incompatibilidade geográfica: o atleta está atualmente sediado em ${currentLoc.city} (${currentLoc.country}) na ${currentGym.name}. Para frequentar turmas regulares na ${targetGym.name} (${targetLoc.city}, ${targetLoc.country}), é necessário realizar viagem e transferência de residência esportiva.`,
    currentGymName,
    targetGymName
  };
}

/**
 * Validação de requisitos e autorização de viagem/transferência de academia.
 * Calcula o custo real de deslocamento conforme origem e destino e protege menores (< 18 anos).
 */
export function validateTravelAuthorization(
  character: Character,
  targetGym: Gym
): { canTravel: boolean; reason?: string; travelCost: number; logistics: TravelLogisticsEstimate } {
  const logistics = getGymTravelLogistics(character, targetGym);
  const effectiveTravelCost = logistics.isSameCapital ? 0 : logistics.estimatedCost;

  if (character.currentGymId === targetGym.id) {
    return {
      canTravel: false,
      reason: 'Você já reside e treina nesta academia.',
      travelCost: 0,
      logistics
    };
  }

  // 1. Recursos financeiros para passagem e estadia inicial
  if (character.money < effectiveTravelCost) {
    return {
      canTravel: false,
      reason: `Saldo insuficiente para a viagem e traslado (Custo: R$ ${effectiveTravelCost.toLocaleString('pt-BR')}, saldo atual: R$ ${character.money.toLocaleString('pt-BR')}).`,
      travelCost: effectiveTravelCost,
      logistics
    };
  }

  // 2. Fama e reputação mínima da academia
  if (character.fame < targetGym.reputationReq) {
    return {
      canTravel: false,
      reason: `Fama insuficiente para ser aceito no centro de excelência (${character.fame}/${targetGym.reputationReq} de Fama exigidos).`,
      travelCost: effectiveTravelCost,
      logistics
    };
  }

  // 3. Regras para menores de 18 anos (só exige autorização familiar se houver mudança de cidade/estado/país)
  if (character.age < 18 && !logistics.isSameCapital) {
    const isInternational = targetGym.country !== 'Brasil';

    if (isInternational) {
      if (character.age < 16) {
        return {
          canTravel: false,
          reason: 'Intercâmbio esportivo internacional desacompanhado exige idade mínima regulamentar de 16 anos completos.',
          travelCost: effectiveTravelCost,
          logistics
        };
      }

      if (character.familySupport < 70) {
        return {
          canTravel: false,
          reason: `Viagem internacional de atleta menor exige autorização expressa e suporte familiar consolidado (Apoio Familiar mínimo de 70%, atual: ${character.familySupport}%).`,
          travelCost: effectiveTravelCost,
          logistics
        };
      }
    } else {
      // Viagem interestadual dentro do Brasil
      if (character.familySupport < 50) {
        return {
          canTravel: false,
          reason: `Mudança de centro de treinamento para outro estado requer autorização dos responsáveis legais (Apoio Familiar mínimo de 50%, atual: ${character.familySupport}%).`,
          travelCost: effectiveTravelCost,
          logistics
        };
      }
    }
  }

  return { canTravel: true, travelCost: effectiveTravelCost, logistics };
}

/**
 * Muda diretamente a residência ativa do atleta para qualquer uma das 27 capitais brasileiras,
 * cobrando passagem real, validando apoio familiar para menores (<18) e trancando turmas presenciais
 * da cidade anterior.
 */
export function relocatePlayerToCapital(
  character: Character,
  targetUf: BrazilUF
): {
  updatedChar: Character;
  success: boolean;
  message: string;
  travelCost: number;
  logistics: TravelLogisticsEstimate;
} {
  const destCap = resolveBrazilCapitalByUf(targetUf);
  const originCountry = character.currentCountry || 'Brasil';
  const originCap =
    originCountry === 'Brasil'
      ? resolveBrazilCapitalByCity(character.currentCity || character.homeCity, character.homeState || 'SP')
      : undefined;

  const logistics = estimateTravelLogistics(
    {
      country: originCountry,
      uf: originCap?.uf,
      city: originCap?.capital || character.currentCity || character.homeCity
    },
    {
      country: 'Brasil',
      uf: destCap.uf,
      city: destCap.capital
    }
  );

  if (originCountry === 'Brasil' && originCap?.uf === destCap.uf) {
    return {
      updatedChar: character,
      success: false,
      message: `Você já reside em ${destCap.capital} (${destCap.uf}).`,
      travelCost: 0,
      logistics
    };
  }

  const travelCost = logistics.estimatedCost;
  if (character.money < travelCost) {
    return {
      updatedChar: character,
      success: false,
      message: `Saldo insuficiente para mudança até ${destCap.capital} (${destCap.uf}). Passagem e traslado: R$ ${travelCost.toLocaleString('pt-BR')}.`,
      travelCost,
      logistics
    };
  }

  if (character.age < 18) {
    const minSupport = originCountry !== 'Brasil' ? 70 : 50;
    if (character.familySupport < minSupport) {
      return {
        updatedChar: character,
        success: false,
        message: `Atleta menor de 18 anos precisa de Apoio Familiar >= ${minSupport}% para mudar de cidade (atual: ${character.familySupport}%).`,
        travelCost,
        logistics
      };
    }
  }

  const updated = JSON.parse(JSON.stringify(character)) as Character;
  updated.money -= travelCost;
  updated.currentCountry = 'Brasil';
  updated.currentCity = destCap.capital;

  // Vincula à academia própria se estiver retornando para a sede dela, ou à base comunitária local se mudou de cidade
  const currentGym = WORLD_GYMS.find((g) => g.id === updated.currentGymId);
  let targetGymId = updated.currentGymId || 'gym_bairro';
  if (updated.playerAcademy && updated.playerAcademy.city === destCap.capital && updated.playerAcademy.country === 'Brasil') {
    targetGymId = updated.playerAcademy.id;
  } else if (
    currentGym &&
    currentGym.id !== 'gym_bairro' &&
    (currentGym.country !== 'Brasil' || currentGym.city !== destCap.capital)
  ) {
    const destLocalGym = WORLD_GYMS.find(
      (g) => g.country === 'Brasil' && g.uf === destCap.uf && g.qualityTier === 'social'
    );
    targetGymId = destLocalGym?.id || 'gym_bairro';
  }
  updated.currentGymId = targetGymId;

  let classesFrozen = 0;
  if (Array.isArray(updated.enrolledClasses)) {
    updated.enrolledClasses.forEach((cls) => {
      if (cls.status === 'ativa' && cls.gymId !== targetGymId) {
        cls.status = 'trancada';
        classesFrozen += 1;
      }
    });
  }

  const frozenNote =
    classesFrozen > 0 ? ` (${classesFrozen} turma(s) da cidade anterior foram trancadas)` : '';

  return {
    updatedChar: updated,
    success: true,
    travelCost,
    logistics,
    message: `✈️ Mudança concluída para ${destCap.capital} (${destCap.uf}) por R$ ${travelCost.toLocaleString('pt-BR')}! Custo de vida e mercado econômico atualizados${frozenNote}.`
  };
}

// ============================================================================
// ETAPA 3.2 — FADIGA E RECUPERAÇÃO FÍSICA
// ============================================================================

export interface MonthlyRecoveryResult {
  newEnergy: number;            // 0 a 100
  newFatigue: number;           // 0 a 100 (fadiga acumulada)
  recoveryRate: number;         // 0 a 100% (eficiência fisiológica da recuperação)
  recoveryNotes: string[];      // Registro explicativo para os logs mensais
}

/**
 * Calcula a recuperação física mensal realista, eliminando o reset artificial de 100% de energia.
 * Integra:
 * - Fadiga acumulada prévia
 * - Carga de sessões executadas no mês
 * - Pontos de repouso disponíveis na semana
 * - Qualidade e continuidade do sono
 * - Dieta alimentar
 * - Lesões ativas
 * - Idade do atleta
 */
export function calculateMonthlyRecovery(
  character: Character,
  targetMonth?: number,
  targetYear?: number
): MonthlyRecoveryResult {
  const notes: string[] = [];
  const currentFatigue = character.accumulatedFatigue || 0;

  // 1. Carga de treinos realizados no mês civil que se encerra
  const refMonth = targetMonth ?? character.currentDate?.month;
  const refYear = targetYear ?? character.currentDate?.year;
  const completedSessions = (character.classSessions || []).filter((s) => {
    if (s.status !== 'concluida') return false;
    if (refMonth && refYear && s.date) {
      return s.date.month === refMonth && s.date.year === refYear;
    }
    return true;
  }).length;
  // Cada sessão realizada no mês adiciona fadiga proporcional
  const trainingFatigue = Math.round(completedSessions * 2.2);

  // 2. Pontos de repouso na semana (capacidade livre)
  const weeklyActivities = getCharacterWeeklyActivities(character);
  const totalOccupiedPoints = weeklyActivities.reduce((sum, a) => sum + (a.pointsCost || 1), 0);
  const totalWeeklyCapacity = 7 * DAILY_POINTS_CAPACITY; // 84 pontos
  const freePoints = Math.max(0, totalWeeklyCapacity - totalOccupiedPoints);

  // 3. Avaliação da qualidade e continuidade do sono
  const sleepMetrics = evaluateSleepQuality(character.age, weeklyActivities, 'segunda', character.familySupport);

  let sleepFatigueModifier = 0;
  if (!sleepMetrics.isContinuous) {
    sleepFatigueModifier += 20;
    notes.push('Sono fragmentado gerou acúmulo de fadiga crônica (+20 fadiga).');
  }
  if (sleepMetrics.sleepDebtPoints > 0) {
    const debtCost = sleepMetrics.sleepDebtPoints * 12;
    sleepFatigueModifier += debtCost;
    notes.push(`Déficit de sono (${sleepMetrics.sleepDebtPoints} pts) gerou fadiga residual (+${debtCost} fadiga).`);
  } else if (sleepMetrics.isContinuous) {
    sleepFatigueModifier -= 15;
    notes.push('Sono pleno e ininterrupto acelerou a restauração fisiológica (-15 fadiga).');
  }

  // 4. Influência da Dieta
  let dietFatigueModifier = 0;
  let dietRecoveryBonus = 0;
  if (character.dietPlan === 'atletica') {
    dietFatigueModifier -= 15;
    dietRecoveryBonus += 15;
    notes.push('Dieta Atlética de Alto Rendimento reduziu o desgaste muscular (-15 fadiga, +15% taxa de recuperação).');
  } else if (character.dietPlan === 'bulking') {
    dietFatigueModifier -= 8;
    dietRecoveryBonus += 5;
    notes.push('Dieta Hipercalórica acelerou a síntese proteica (-8 fadiga).');
  } else if (character.dietPlan === 'corte_severo') {
    dietFatigueModifier += 25;
    dietRecoveryBonus -= 20;
    notes.push('Corte Severo de Peso provocou estresse metabólico e desidratação (+25 fadiga, -20% recuperação).');
  } else {
    // Dieta caseira padrão
    dietFatigueModifier -= 5;
  }

  // 5. Impacto de Lesões Ativas
  const activeInjuries = character.injuries || [];
  let injuryFatigueModifier = 0;
  let injuryRecoveryPenalty = 0;
  if (activeInjuries.length > 0) {
    injuryFatigueModifier = activeInjuries.length * 10;
    injuryRecoveryPenalty = activeInjuries.length * 15;
    notes.push(`Corpo lidando com ${activeInjuries.length} lesão(ões) ativa(s): recuperação prejudicada (+${injuryFatigueModifier} fadiga, -${injuryRecoveryPenalty}% recuperação).`);
  }

  // 6. Efeito da Idade
  let ageModifier = 0;
  if (character.age <= 20) {
    ageModifier = -5; // Juventude com regeneração mais rápida
  } else if (character.age >= 35) {
    ageModifier = 10; // Corpo veterano exige maior tempo de recuperação
    notes.push('Organismo veterano: regeneração muscular naturalmente mais lenta (+10 fadiga).');
  }

  // 7. Dissipação natural de repouso e efeito do Camp de Periodização
  const restDissipation = Math.round((freePoints / 84) * 20);

  let campFatigueModifier = 0;
  let campRecoveryBonus = 0;
  if (character.trainingCampIntensity === 'leve') {
    campFatigueModifier = -8;
    campRecoveryBonus = 8;
    notes.push('Camp Leve (Regenerativo): poupou articulações (-8 fadiga, +8% recuperação).');
  } else if (character.trainingCampIntensity === 'intenso') {
    campFatigueModifier = 12;
    campRecoveryBonus = -6;
    notes.push('Camp Intenso de Luta: alta sobrecarga de treinos (+12 fadiga).');
  }

  // Cálculo da nova fadiga acumulada
  const netFatigueChange =
    trainingFatigue +
    sleepFatigueModifier +
    dietFatigueModifier +
    injuryFatigueModifier +
    ageModifier +
    campFatigueModifier -
    restDissipation;
  const newFatigue = Math.max(0, Math.min(100, Math.round(currentFatigue * 0.4 + netFatigueChange)));

  // Taxa de recuperação fisiológica (0 a 100%)
  const baseRecovery = Math.round(
    100 - newFatigue * 0.75 + dietRecoveryBonus + campRecoveryBonus - injuryRecoveryPenalty
  );
  const recoveryRate = Math.max(25, Math.min(100, baseRecovery));

  // Energia final resultante para o início do novo mês (30 a 100)
  // Se a fadiga for muito baixa (0 a 10) e rotina equilibrada -> 95 a 100 de energia!
  // Se houver fadiga crônica ou privação de sono -> energia reduzida (50 a 80)
  const calculatedEnergy = Math.round(recoveryRate);
  const newEnergy = Math.max(30, Math.min(100, calculatedEnergy));

  if (newFatigue > 40) {
    notes.push(`Fadiga crônica residual detectada (${newFatigue}/100). Energia restaurada apenas para ${newEnergy}%.`);
  } else {
    notes.push(`Rotina regenerativa equilibrada: energia restabelecida para ${newEnergy}% com taxa de recuperação de ${recoveryRate}%.`);
  }

  return {
    newEnergy,
    newFatigue,
    recoveryRate,
    recoveryNotes: notes
  };
}

// ============================================================================
// ETAPA 3.2 — RISCO DE LESÕES NO SPARRING
// ============================================================================

export interface SparringInjuryCheckResult {
  riskPercentage: number;
  hadInjury: boolean;
  injury?: {
    id: string;
    name: string;
    severity: 'leve' | 'moderada';
    weeksRemaining: number;
  };
  injuryMessage?: string;
  contributingFactors: string[];
}

const POSSIBLE_SPARRING_INJURIES: Array<{
  name: string;
  severity: 'leve' | 'moderada';
  weeksRemaining: number;
}> = [
  { name: 'Contusão no Septo Nasal', severity: 'leve', weeksRemaining: 2 },
  { name: 'Entorse Leve de Tornozelo', severity: 'leve', weeksRemaining: 2 },
  { name: 'Corte Aberto no Supercílio', severity: 'leve', weeksRemaining: 1 },
  { name: 'Fissura na Costela Flutuante', severity: 'moderada', weeksRemaining: 4 },
  { name: 'Distensão Muscular no Ombro', severity: 'moderada', weeksRemaining: 3 }
];

/**
 * Avalia o risco realista de lesão durante o sparring de combate real.
 * Fatores:
 * - Energia baixa (< 40) aumenta risco
 * - Fadiga acumulada (> 50) aumenta risco
 * - Durabilidade (queixo e resistência física) reduz o risco
 * - Presença de lesões ativas aumenta risco
 * - Supervisão de mestres em academias de ponta reduz o risco
 */
export function checkSparringInjuryRisk(
  character: Character,
  gym?: Gym,
  forceRoll?: number // Para fins de testes determinísticos
): SparringInjuryCheckResult {
  let baseRisk = 0.05; // 5% de risco base em sparring pesado
  const factors: string[] = ['Sparring de combate real'];

  // Baixa energia (< 40)
  if (character.energy < 40) {
    baseRisk += 0.08;
    factors.push('Baixa energia imediata (+8% risco)');
  }

  // Alta fadiga acumulada (> 50)
  const fatigue = character.accumulatedFatigue || 0;
  if (fatigue > 50) {
    baseRisk += 0.07;
    factors.push('Fadiga crônica muscular (+7% risco)');
  }

  // Durabilidade do atleta
  const durability = character.attributes?.durability || 20;
  if (durability >= 30) {
    baseRisk -= 0.04;
    factors.push('Excelente durabilidade corporal (-4% risco)');
  } else if (durability < 15) {
    baseRisk += 0.04;
    factors.push('Baixa resistência a impacto (+4% risco)');
  }

  // Lesões ativas já existentes
  if ((character.injuries || []).length > 0) {
    baseRisk += 0.06;
    factors.push('Corpo já lesionado (+6% risco)');
  }

  // Qualidade da supervisão e estrutura preventiva da academia
  if (
    gym &&
    (gym.id === 'gym_american_top_team' ||
      gym.id === 'gym_kodokan_tokyo' ||
      gym.id === 'gym_bairro' ||
      gym.qualityTier === 'convencional' ||
      gym.infrastructureLevel === 'olimpica' ||
      gym.infrastructureLevel === 'alto_rendimento')
  ) {
    baseRisk -= 0.02;
    factors.push(`Supervisão técnica & protocolo de segurança (${gym.masterName}) (-2% risco)`);
  }

  // Proteção ativa de equipamentos equipados (bucal, luvas, capacete, caneleira, coquilha)
  const equipSummary = getEquipmentSummary(character);
  if (equipSummary.injuryReductionPct > 0) {
    baseRisk = baseRisk * (1 - equipSummary.injuryReductionPct / 100);
    factors.push(`Proteção de equipamentos equipados (-${equipSummary.injuryReductionPct}% risco relativo)`);
  }

  // Limite seguro: 2% a 35%
  const finalRisk = Math.max(0.02, Math.min(0.35, baseRisk));
  const riskPercentage = Math.round(finalRisk * 100);

  // Rolagem de teste
  const roll = forceRoll !== undefined ? forceRoll : Math.random();
  const hadInjury = roll < finalRisk;

  if (hadInjury) {
    // Escolhe aleatoriamente uma lesão realista
    const injuryTemplate = POSSIBLE_SPARRING_INJURIES[Math.floor(Math.random() * POSSIBLE_SPARRING_INJURIES.length)];
    const injury = {
      id: `inj_sparring_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: injuryTemplate.name,
      severity: injuryTemplate.severity,
      weeksRemaining: injuryTemplate.weeksRemaining
    };

    return {
      riskPercentage,
      hadInjury: true,
      injury,
      injuryMessage: `⚠️ LESÃO NO SPARRING! Você sofreu uma ${injury.name} (${injury.severity}, ~${injury.weeksRemaining} sem. de recuperação). Reduza a intensidade dos treinos!`,
      contributingFactors: factors
    };
  }

  return {
    riskPercentage,
    hadInjury: false,
    contributingFactors: factors
  };
}
