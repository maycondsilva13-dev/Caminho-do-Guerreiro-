import {
  CapitalEconomicProfile,
  CapitalSportProfile,
  Character,
  Gym,
  InstitutionType,
  MartialArtType
} from '../types/game';
import { getStateByUf } from '../data/brazilLocations';
import { DIET_OPTIONS, JobDefinition } from '../data/lifeEventsData';
import { MARTIAL_ARTS_META, WORLD_GYMS } from '../data/martialArtsData';
import { resolveBrazilCapitalByCity } from './regionalGeographyHelper';

export interface ActiveEconomicContext {
  localityLabel: string;
  city: string;
  uf?: string;
  country: string;
  isBrazil: boolean;
  costTierLabel: 'Baixo' | 'Moderado' | 'Alto' | 'Muito Alto';
  economy: CapitalEconomicProfile;
  sport: CapitalSportProfile;
}

export interface LivingExpensesItemized {
  housing: number;
  food: number;
  transport: number;
  health: number;
  family: number;
}

export interface LivingExpensesResult {
  monthlyCost: number;
  contextLabel: string;
  localityLabel: string;
  dependentsCount: number;
  housingModeLabel: string;
  costTierLabel: 'Baixo' | 'Moderado' | 'Alto' | 'Muito Alto';
  foodNote?: string;
  transportNote?: string;
  healthNote?: string;
  familyNote?: string;
  breakdown: LivingExpensesItemized;
}

export interface GraduationCostResult {
  totalCost: number;
  examFee: number;
  equipmentFee: number;
  isDanOrMaster: boolean;
  socialDiscountApplied: boolean;
  familyCanPay: boolean;
  athletePays: number;
  equipmentLabel: string;
}

export interface MonthlyEquipmentExpenseResult {
  monthlyCost: number;
  athletePays: number;
  familyPays: number;
  paidByFamily: boolean;
  reasonLabel: string;
}

export interface RegionalSponsorshipResult {
  name?: string;
  monthlyPay: number;
  tierLabel: string;
  tierLevel?: 'nenhum' | 'apoio_local' | 'profissional' | 'alto_nivel';
  marketIndex: number;
  sportDevIndex?: number;
  meritSummary?: string;
  localityLabel: string;
}

interface InternationalEconomicPreset {
  economy: CapitalEconomicProfile;
  sport: CapitalSportProfile;
}

const INTERNATIONAL_ECONOMIC_PRESETS: Array<{
  match: string[];
  preset: InternationalEconomicPreset;
}> = [
  {
    match: ['estados unidos', 'eua', 'usa', 'reino unido', 'inglaterra', 'frança', 'franca'],
    preset: {
      economy: {
        costOfLivingIndex: 1.72,
        housingBase: 890,
        foodBase: 430,
        transportBase: 240,
        healthBase: 250,
        educationMultiplier: 1.55,
        salaryMultiplier: 1.62,
        gymTuitionMultiplier: 1.45
      },
      sport: {
        sportDevelopmentIndex: 97,
        infrastructureLevel: 'metropole_olimpica',
        sponsorshipMarketIndex: 1.65,
        gymVarietyTier: 'polo_nacional',
        dominantArts: ['mma', 'jiujitsu', 'boxe'],
        economicIdentity: 'Mercado esportivo internacional de altíssimo custo e maior volume mundial de patrocínios.',
        jobOpportunityLabel: 'Ligas mundiais, preparação atlética e grandes corporações'
      }
    }
  },
  {
    match: ['japão', 'japao', 'itália', 'italia', 'espanha'],
    preset: {
      economy: {
        costOfLivingIndex: 1.52,
        housingBase: 790,
        foodBase: 390,
        transportBase: 220,
        healthBase: 190,
        educationMultiplier: 1.38,
        salaryMultiplier: 1.44,
        gymTuitionMultiplier: 1.32
      },
      sport: {
        sportDevelopmentIndex: 95,
        infrastructureLevel: 'metropole_olimpica',
        sponsorshipMarketIndex: 1.45,
        gymVarietyTier: 'polo_nacional',
        dominantArts: ['judo', 'karate', 'mma'],
        economicIdentity: 'Potência tradicional de artes marciais com infraestrutura olímpica e moeda valorizada.',
        jobOpportunityLabel: 'Dojôs tradicionais, tecnologia e comissões técnicas'
      }
    }
  },
  {
    match: ['tailândia', 'tailandia', 'rússia', 'russia', 'méxico', 'mexico', 'geórgia', 'georgia', 'ucrânia', 'ucrania'],
    preset: {
      economy: {
        costOfLivingIndex: 1.12,
        housingBase: 510,
        foodBase: 280,
        transportBase: 135,
        healthBase: 125,
        educationMultiplier: 1.05,
        salaryMultiplier: 1.10,
        gymTuitionMultiplier: 1.08
      },
      sport: {
        sportDevelopmentIndex: 90,
        infrastructureLevel: 'avancada',
        sponsorshipMarketIndex: 1.18,
        gymVarietyTier: 'polo_nacional',
        dominantArts: ['muaythai', 'lutalivre', 'mma'],
        economicIdentity: 'Hub internacional de camps intensivos de luta com custo de estadia acessível fora do Brasil.',
        jobOpportunityLabel: 'Camps internacionais, sparring profissional e ensino técnico'
      }
    }
  }
];

const DEFAULT_INTERNATIONAL_PRESET: InternationalEconomicPreset = {
  economy: {
    costOfLivingIndex: 1.35,
    housingBase: 690,
    foodBase: 350,
    transportBase: 185,
    healthBase: 170,
    educationMultiplier: 1.25,
    salaryMultiplier: 1.28,
    gymTuitionMultiplier: 1.22
  },
  sport: {
    sportDevelopmentIndex: 86,
    infrastructureLevel: 'avancada',
    sponsorshipMarketIndex: 1.30,
    gymVarietyTier: 'polo_nacional',
    dominantArts: ['mma', 'jiujitsu', 'boxe'],
    economicIdentity: 'Polo internacional de intercâmbio esportivo com economia dolarizada/euro.',
    jobOpportunityLabel: 'Mercado internacional e preparação esportiva'
  }
};

function getCostTierLabel(idx: number): 'Baixo' | 'Moderado' | 'Alto' | 'Muito Alto' {
  if (idx >= 1.22) return 'Muito Alto';
  if (idx >= 1.04) return 'Alto';
  if (idx >= 0.9) return 'Moderado';
  return 'Baixo';
}

/**
 * Resolve o contexto econômico e esportivo ativo da localidade atual do personagem
 * (uma das 27 capitais brasileiras ou um polo internacional).
 */
export function resolveActiveEconomicContext(
  char: Pick<Character, 'currentCountry' | 'currentCity' | 'homeCity' | 'homeState'>
): ActiveEconomicContext {
  const country = (char.currentCountry || 'Brasil').trim() || 'Brasil';
  const isBrazil = country.toLowerCase() === 'brasil' || country.toLowerCase() === 'brazil';

  if (isBrazil) {
    const cityRef = char.currentCity || char.homeCity;
    const cap = cityRef
      ? resolveBrazilCapitalByCity(cityRef, char.homeState || 'SP')
      : getStateByUf(char.homeState || 'SP');
    return {
      localityLabel: `${cap.capital} (${cap.uf})`,
      city: cap.capital,
      uf: cap.uf,
      country: 'Brasil',
      isBrazil: true,
      costTierLabel: getCostTierLabel(cap.economy.costOfLivingIndex),
      economy: cap.economy,
      sport: cap.sport
    };
  }

  const lowerCountry = country.toLowerCase();
  const matched = INTERNATIONAL_ECONOMIC_PRESETS.find((entry) =>
    entry.match.some((alias) => lowerCountry.includes(alias))
  );
  const preset = matched ? matched.preset : DEFAULT_INTERNATIONAL_PRESET;
  const cityLabel = char.currentCity || country;

  return {
    localityLabel: `${cityLabel}, ${country}`,
    city: cityLabel,
    country,
    isBrazil: false,
    costTierLabel: getCostTierLabel(preset.economy.costOfLivingIndex),
    economy: preset.economy,
    sport: preset.sport
  };
}

export interface PlayerLocationSummary {
  currentLabel: string;
  currentShort: string;
  originLabel: string;
  hasRelocated: boolean;
  isBrazil: boolean;
  currentUf?: string;
  currentCity: string;
  currentCountry: string;
}

/**
 * Resume de forma consistente a localidade atual vs. cidade/estado de origem para exibição na UI.
 */
export function getPlayerLocationSummary(
  char: Pick<Character, 'currentCountry' | 'currentCity' | 'homeCity' | 'homeState'>
): PlayerLocationSummary {
  const ctx = resolveActiveEconomicContext(char);
  const originCap = getStateByUf(char.homeState || 'SP');
  const originLabel = `${char.homeCity || originCap.capital} - ${originCap.uf}`;
  const currentLabel = ctx.isBrazil && ctx.uf
    ? `${ctx.city} - ${ctx.uf}`
    : `${ctx.city}, ${ctx.country}`;
  const hasRelocated =
    !ctx.isBrazil ||
    ctx.city !== (char.homeCity || originCap.capital) ||
    ctx.uf !== originCap.uf;

  return {
    currentLabel,
    currentShort: ctx.localityLabel,
    originLabel,
    hasRelocated,
    isBrazil: ctx.isBrazil,
    currentUf: ctx.uf,
    currentCity: ctx.city,
    currentCountry: ctx.country
  };
}

export interface RegionalAcademyEconomics {
  localityLabel: string;
  costTierLabel: 'Baixo' | 'Moderado' | 'Alto' | 'Muito Alto';
  scaleFactor: number;
  foundCost: number;
  rentLevel1: number;
  rentLevel2: number;
  rentLevel3: number;
  upgradeToLevel2Cost: number;
  upgradeToLevel3Cost: number;
  seminarCost: number;
  suggestedMonthlyFee: number;
}

/**
 * Calcula custos imobiliários e operacionais regionalizados da Academia Própria do Professor
 * usando São Paulo (housingBase = 680) como referência 1.0x.
 */
export function getRegionalAcademyEconomics(
  char: Pick<Character, 'currentCountry' | 'currentCity' | 'homeCity' | 'homeState'>
): RegionalAcademyEconomics {
  const ctx = resolveActiveEconomicContext(char);
  const scaleFactor = Math.round((ctx.economy.housingBase / 680) * 100) / 100;
  const colScale = ctx.economy.costOfLivingIndex / 1.32;

  return {
    localityLabel: ctx.localityLabel,
    costTierLabel: ctx.costTierLabel,
    scaleFactor,
    foundCost: Math.max(1100, Math.round(2500 * scaleFactor)),
    rentLevel1: Math.max(200, Math.round(450 * scaleFactor)),
    rentLevel2: Math.max(380, Math.round(850 * scaleFactor)),
    rentLevel3: Math.max(650, Math.round(1450 * scaleFactor)),
    upgradeToLevel2Cost: Math.max(2000, Math.round(4500 * scaleFactor)),
    upgradeToLevel3Cost: Math.max(4000, Math.round(9000 * scaleFactor)),
    seminarCost: Math.max(140, Math.round(250 * colScale)),
    suggestedMonthlyFee: Math.max(80, Math.round(180 * ctx.economy.gymTuitionMultiplier))
  };
}

/**
 * Calcula o custo de vida mensal regionalizado e discriminado por rubrica:
 * - Moradia (solo, com pais, cônjuge/noivado, situação familiar)
 * - Alimentação (básica vs. complemento de plano nutricional sem bitributação)
 * - Transporte urbano (rotina de trabalho/estudo/treino, sem duplicar viagens intermunicipais)
 * - Saúde (básica, fisioterapia por gravidade de lesão, carga de treino e corte de peso)
 * - Despesas Familiares (estritamente filhos menores vivos dependentes + contexto doméstico)
 */
export function calculateRegionalLivingExpenses(char: Character): LivingExpensesResult {
  const ctx = resolveActiveEconomicContext(char);
  const contacts = char.socialContacts || [];
  const livingDependentChildren = contacts.filter(
    (c) => c.isAlive && c.relationType === 'filho' && c.age < 18
  );
  const livingDependents = livingDependentChildren.length;

  if (char.isAlive === false || char.age < 18) {
    return {
      monthlyCost: 0,
      contextLabel: `Dependente da família (< 18 anos) · ${ctx.localityLabel}`,
      localityLabel: ctx.localityLabel,
      dependentsCount: livingDependents,
      housingModeLabel: 'Dependente dos pais',
      costTierLabel: ctx.costTierLabel,
      breakdown: {
        housing: 0,
        food: 0,
        transport: 0,
        health: 0,
        family: 0
      }
    };
  }

  const colIndex = ctx.economy.costOfLivingIndex;
  const parentContacts = contacts.filter((c) => c.relationType === 'pai' || c.relationType === 'mae');
  const allParentsDeceased =
    parentContacts.length > 0 && parentContacts.every((p) => p.isAlive === false);

  const spouseContact = char.spouseId
    ? contacts.find((c) => c.id === char.spouseId)
    : contacts.find((c) => c.relationType === 'conjuge' && c.isAlive);
  const hasLivingSpouse = Boolean(
    char.maritalStatus === 'casado' && (!spouseContact || spouseContact.isAlive)
  );
  const isEngagedSharing = Boolean(
    char.maritalStatus === 'noivo' &&
      spouseContact &&
      spouseContact.isAlive &&
      ctx.isBrazil
  );

  const isEnrolledStudent = Boolean(char.isStudying || char.education?.currentEnrollment);
  const livesWithParents =
    !hasLivingSpouse &&
    !isEngagedSharing &&
    !allParentsDeceased &&
    ctx.isBrazil &&
    char.familySupport >= 70 &&
    (char.age < 22 || (char.age <= 24 && isEnrolledStudent));

  const famTier = char.familyWealthTier || 'classe_media';

  // 1. Moradia
  let housing = ctx.economy.housingBase;
  let housingModeLabel = ctx.isBrazil
    ? char.maritalStatus === 'viuvo'
      ? 'Moradia individual (viúvo)'
      : 'Aluguel & moradia solo'
    : 'Aluguel & estadia no exterior';

  if (hasLivingSpouse) {
    const spouseShareFactor =
      spouseContact?.wealthTier === 'milionario' || spouseContact?.wealthTier === 'abastado'
        ? 0.48
        : spouseContact?.wealthTier === 'humilde'
        ? 0.62
        : 0.56;
    housing = Math.round(ctx.economy.housingBase * spouseShareFactor);
    housingModeLabel = ctx.isBrazil ? 'Lar dividido com cônjuge' : 'Moradia compartilhada no exterior';
  } else if (isEngagedSharing) {
    housing = Math.round(ctx.economy.housingBase * 0.72);
    housingModeLabel = 'Moradia compartilhada (noivado)';
  } else if (livesWithParents) {
    const parentHousingFactor =
      famTier === 'milionario'
        ? 0.18
        : famTier === 'abastado'
        ? 0.26
        : famTier === 'humilde'
        ? 0.42
        : 0.35;
    housing = Math.round(ctx.economy.housingBase * parentHousingFactor);
    housingModeLabel = 'Ajuda nas contas com os pais';
  }

  // 2. Alimentação básica regional (evitando bitributação com dietPlan cobrado à parte)
  let baseFood = ctx.economy.foodBase;
  if (livesWithParents) {
    baseFood = Math.round(ctx.economy.foodBase * 0.45);
  } else if (char.dietPlan === 'caseira' && char.familySupport >= 65 && ctx.isBrazil) {
    baseFood = Math.round(ctx.economy.foodBase * 0.85);
  }

  let food = baseFood;
  let foodNote = 'Alimentação doméstica básica';
  if (char.dietPlan === 'bulking' || char.dietPlan === 'atletica') {
    // O plano nutricional esportivo já é cobrado via calculateRegionalDietCost;
    // mantém apenas itens domésticos básicos fora da dieta esportiva para não cobrar duas vezes.
    food = Math.round(baseFood * 0.45);
    foodNote = 'Itens básicos domésticos (dieta esportiva cobrada à parte)';
  } else if (char.dietPlan === 'corte_severo') {
    food = Math.round(baseFood * 0.35);
    foodNote = 'Restrição calórica básica (protocolo de corte cobrado à parte)';
  } else if (livesWithParents) {
    foodNote = 'Alimentação compartilhada na casa dos pais';
  }

  // 3. Transporte urbano regional (rotina local de trabalho, treino e estudos — sem duplicar viagens intermunicipais)
  let urbanMobilityFactor = livesWithParents ? 0.72 : 1.0;
  const hasUrbanJob = Boolean(
    char.job && char.job !== 'desempregado' && char.job !== 'atleta_patrocinado'
  );
  if (hasUrbanJob) {
    urbanMobilityFactor += 0.12;
  } else {
    urbanMobilityFactor -= 0.14;
  }

  const activeClassesCount = (char.enrolledClasses || []).filter((c) => c.status === 'ativa').length;
  const trainsAtOwnOrLocalGym = Boolean(
    (char.playerAcademy && char.currentGymId === char.playerAcademy.id) ||
      char.currentGymId === 'gym_bairro'
  );
  if (activeClassesCount > 0) {
    urbanMobilityFactor += trainsAtOwnOrLocalGym ? 0.03 : 0.08;
  }
  if (isEnrolledStudent) {
    urbanMobilityFactor += 0.06;
  }

  const transport = Math.max(
    Math.round(ctx.economy.transportBase * 0.5),
    Math.round(ctx.economy.transportBase * urbanMobilityFactor)
  );
  const transportNote = `Deslocamento urbano (${hasUrbanJob ? 'trabalho + ' : ''}${
    activeClassesCount > 0 ? 'treinos locais' : 'rotina diária'
  })`;

  // 4. Saúde básica + fisioterapia proporcional à gravidade da lesão + recuperação de treino/corte
  let baseHealth = livesWithParents
    ? Math.round(ctx.economy.healthBase * 0.5)
    : hasLivingSpouse
    ? Math.round(ctx.economy.healthBase * 0.85)
    : ctx.economy.healthBase;

  const injuryMedicalCare = (char.injuries || []).reduce((sum, inj) => {
    const sevBase = inj.severity === 'grave' ? 130 : inj.severity === 'moderada' ? 75 : 40;
    return sum + Math.round(sevBase * colIndex);
  }, 0);

  const highTrainingDemand =
    char.trainingCampIntensity === 'intenso' ||
    (char.accumulatedFatigue || 0) >= 65 ||
    activeClassesCount >= 3;
  let trainingHealthCare = highTrainingDemand ? Math.round(24 * colIndex) : 0;
  const weightCutCare =
    char.dietPlan === 'corte_severo' ? Math.round(28 * colIndex) : 0;

  const hasHealthProfessionDiscount =
    char.job === 'medico_esporte' ||
    char.job === 'fisioterapeuta_esportivo' ||
    char.job === 'nutricionista_esportivo' ||
    char.job === 'tec_enfermagem';
  if (hasHealthProfessionDiscount) {
    baseHealth = Math.round(baseHealth * 0.85);
    trainingHealthCare = Math.round(trainingHealthCare * 0.85);
  }

  const health = baseHealth + injuryMedicalCare + trainingHealthCare + weightCutCare;
  const healthNote =
    injuryMedicalCare > 0
      ? 'Saúde básica + fisioterapia e reabilitação de lesões'
      : weightCutCare > 0
      ? 'Saúde básica + monitoramento médico de corte de peso'
      : trainingHealthCare > 0
      ? 'Saúde básica + suporte preventivo de treino intenso'
      : 'Plano de saúde / farmácia básica';

  // 5. Despesas familiares (estritamente filhos menores vivos sob responsabilidade do personagem)
  let family = 0;
  let familyNote = 'Sem dependentes menores sob sua responsabilidade';
  if (livingDependents > 0) {
    const rawChildrenCost = livingDependentChildren.reduce((sum, child) => {
      const ageBase = child.age <= 5 ? 155 : child.age <= 12 ? 140 : 130;
      return sum + Math.round(ageBase * colIndex);
    }, 0);
    const householdShareFactor = hasLivingSpouse ? 0.88 : 1.0;
    const economicContextFactor =
      (famTier === 'milionario' || famTier === 'abastado') && char.familySupport >= 75
        ? 0.90
        : famTier === 'humilde'
        ? 0.90
        : 1.0;
    family = Math.max(
      livingDependents * 80,
      Math.round(rawChildrenCost * householdShareFactor * economicContextFactor)
    );
    familyNote = `${livingDependents} filho(a)(s) menor(es) dependente(s)${
      hasLivingSpouse ? ' (criação compartilhada)' : ''
    }`;
  }

  const monthlyCost = housing + food + transport + health + family;
  const dependentsSuffix =
    livingDependents > 0
      ? ` · ${livingDependents} dependente(s)`
      : injuryMedicalCare > 0
      ? ' · +Fisioterapia/Lesão'
      : '';

  return {
    monthlyCost,
    contextLabel: `${housingModeLabel} · ${ctx.localityLabel}${dependentsSuffix}`,
    localityLabel: ctx.localityLabel,
    dependentsCount: livingDependents,
    housingModeLabel,
    costTierLabel: ctx.costTierLabel,
    foodNote,
    transportNote,
    healthNote,
    familyNote,
    breakdown: {
      housing,
      food,
      transport,
      health,
      family
    }
  };
}

/**
 * Calcula salário mensal regionalizado de uma profissão conforme capital/país ativo.
 */
export function calculateRegionalJobMonthlyPay(
  char: Pick<Character, 'currentCountry' | 'currentCity' | 'homeCity' | 'homeState'>,
  job?: Pick<JobDefinition, 'id' | 'weeklyPay'>
): number {
  if (!job || job.id === 'desempregado' || job.weeklyPay <= 0) {
    return 0;
  }
  const ctx = resolveActiveEconomicContext(char);
  return Math.round(job.weeklyPay * 4 * ctx.economy.salaryMultiplier);
}

/**
 * Calcula mensalidade regionalizada de um curso particular (ensino público permanece sempre gratuito).
 */
export function calculateRegionalEducationFee(
  char: Pick<Character, 'currentCountry' | 'currentCity' | 'homeCity' | 'homeState'>,
  baseMonthlyFee: number,
  institutionType: InstitutionType
): number {
  if (institutionType === 'publica' || baseMonthlyFee <= 0) {
    return 0;
  }
  const ctx = resolveActiveEconomicContext(char);
  return Math.round(baseMonthlyFee * ctx.economy.educationMultiplier);
}

/**
 * Calcula o custo mensal regionalizado do plano nutricional selecionado.
 */
export function calculateRegionalDietCost(
  char: Pick<Character, 'currentCountry' | 'currentCity' | 'homeCity' | 'homeState'>,
  dietId: Character['dietPlan']
): number {
  const opt = DIET_OPTIONS.find((d) => d.id === dietId);
  if (!opt || opt.cost <= 0) return 0;
  const ctx = resolveActiveEconomicContext(char);
  const foodIndex = ctx.economy.foodBase / 275;
  return Math.max(15, Math.round(opt.cost * foodIndex));
}

/**
 * Calcula o custo regionalizado de uma atividade de lazer.
 */
export function calculateRegionalLeisureCost(
  char: Pick<Character, 'currentCountry' | 'currentCity' | 'homeCity' | 'homeState'>,
  baseCost: number
): number {
  if (baseCost <= 0) return 0;
  const ctx = resolveActiveEconomicContext(char);
  return Math.max(5, Math.round(baseCost * ctx.economy.costOfLivingIndex));
}

/**
 * Calcula o patrocínio mensal considerando:
 * - Desenvolvimento esportivo da localidade (sportDevelopmentIndex)
 * - Tamanho do mercado comercial local (sponsorshipMarketIndex)
 * - Reputação/fama do atleta (fame)
 * - Resultados reais em lutas (wins, losses, mmaWins)
 * - Títulos conquistados e nível competitivo (municipal/estadual vs regional/nacional vs internacional/mundial/MMA pro)
 *
 * Sem vitórias ou títulos reais, nenhuma capital gera contrato esportivo automático.
 */
export function calculateRegionalSponsorship(char: Character): RegionalSponsorshipResult {
  const ctx = resolveActiveEconomicContext(char);
  const marketIndex = ctx.sport.sponsorshipMarketIndex;
  const sportDevIndex = ctx.sport.sportDevelopmentIndex;
  const regionalFactor = marketIndex * (0.85 + (sportDevIndex / 100) * 0.22);

  if (char.isAlive === false || char.age < 16) {
    return {
      monthlyPay: 0,
      tierLabel: 'Sem contrato (mín. 16 anos)',
      tierLevel: 'nenhum',
      marketIndex,
      sportDevIndex,
      meritSummary: 'Idade mínima regulamentar para contratos esportivos não atingida.',
      localityLabel: ctx.localityLabel
    };
  }

  const wins = char.record?.wins || 0;
  const losses = char.record?.losses || 0;
  const mmaWins = char.record?.mmaWins || 0;
  const trophies = char.trophies || [];
  const fame = char.fame || 0;

  // Sem mérito esportivo real (nenhuma vitória nem título): morar em capital rica não cria patrocínio artificial
  if (wins === 0 && trophies.length === 0) {
    return {
      monthlyPay: 0,
      tierLabel: 'Sem mérito esportivo ativo',
      tierLevel: 'nenhum',
      marketIndex,
      sportDevIndex,
      meritSummary: 'Requer vitórias oficiais ou títulos em competições para atrair patrocinadores.',
      localityLabel: ctx.localityLabel
    };
  }

  const totalFights = wins + losses + (char.record?.draws || 0);
  const winRate = totalFights > 0 ? wins / totalFights : 0;

  const hasIntlOrProTrophy = trophies.some((t) =>
    ['internacional', 'mundial', 'mma_pro'].includes(String(t.tier).toLowerCase())
  );
  const hasNationalOrRegionalTrophy = trophies.some((t) =>
    ['nacional', 'regional'].includes(String(t.tier).toLowerCase())
  );
  const hasStateOrLocalTrophy = trophies.some((t) =>
    ['estadual', 'municipal'].includes(String(t.tier).toLowerCase())
  );

  // Participações competitivas em ligas nacionais/internacionais/pro também agregam visibilidade
  const highScopeHistoryCount = (char.tournamentHistory || []).filter(
    (h) => h.completed && (h.matchesWon || 0) > 0
  ).length;

  const winRateFactor = 0.90 + Math.min(0.22, winRate * 0.22);
  const competitionBonus =
    (hasIntlOrProTrophy ? 0.28 : hasNationalOrRegionalTrophy ? 0.16 : hasStateOrLocalTrophy ? 0.06 : 0) +
    Math.min(0.12, trophies.length * 0.025) +
    Math.min(0.06, highScopeHistoryCount * 0.015);
  const fameFactor = 0.94 + Math.min(0.18, fame / 3500);

  // Tier 3 — Patrocínio de Alto Nível (Nacional / Internacional / MMA Pro)
  const qualifiesAltoNivel =
    char.age >= 18 &&
    wins >= 14 &&
    fame >= 320 &&
    (hasIntlOrProTrophy ||
      hasNationalOrRegionalTrophy ||
      mmaWins >= 4 ||
      (trophies.length >= 4 && wins >= 18));

  if (qualifiesAltoNivel) {
    const basePay = 2250;
    const monthlyPay = Math.round(
      basePay * regionalFactor * winRateFactor * (1 + competitionBonus) * fameFactor
    );
    return {
      name: 'Apex Combat Global Gear',
      monthlyPay,
      tierLabel: `Patrocínio de Alto Nível (${ctx.localityLabel})`,
      tierLevel: 'alto_nivel',
      marketIndex,
      sportDevIndex,
      meritSummary: `${wins}V-${losses}D · ${trophies.length} título(s) · circuito elite`,
      localityLabel: ctx.localityLabel
    };
  }

  // Tier 2 — Patrocínio Profissional (Regional / Nacional / Consistência Competitiva)
  const qualifiesProfissional =
    wins >= 6 &&
    fame >= 120 &&
    (hasIntlOrProTrophy ||
      hasNationalOrRegionalTrophy ||
      trophies.length >= 2 ||
      mmaWins >= 2 ||
      wins >= 10);

  if (qualifiesProfissional) {
    const basePay = 880;
    const monthlyPay = Math.round(
      basePay * regionalFactor * winRateFactor * (1 + competitionBonus * 0.75) * fameFactor
    );
    return {
      name: 'Kombat Pro Nutrition',
      monthlyPay,
      tierLabel: `Patrocínio Profissional (${ctx.localityLabel})`,
      tierLevel: 'profissional',
      marketIndex,
      sportDevIndex,
      meritSummary: `${wins}V-${losses}D · ${trophies.length} título(s) · circuito competitivo`,
      localityLabel: ctx.localityLabel
    };
  }

  // Tier 1 — Apoio Local (Início de carreira competitiva, estaduais e municipais)
  const qualifiesApoioLocal =
    (wins >= 2 || trophies.length >= 1) &&
    (fame >= 40 || wins >= 3 || trophies.length >= 1);

  if (qualifiesApoioLocal) {
    const basePay = 320;
    const localMeritFactor = 0.95 + Math.min(0.20, wins * 0.03 + trophies.length * 0.05);
    const monthlyPay = Math.round(basePay * regionalFactor * localMeritFactor);
    return {
      name: 'Tatame Roots Kimonos & Luvas',
      monthlyPay,
      tierLabel: `Apoio Local (${ctx.localityLabel})`,
      tierLevel: 'apoio_local',
      marketIndex,
      sportDevIndex,
      meritSummary: `${wins}V-${losses}D · ${trophies.length} título(s) · base regional`,
      localityLabel: ctx.localityLabel
    };
  }

  return {
    monthlyPay: 0,
    tierLabel: 'Sem patrocinador ativo',
    tierLevel: 'nenhum',
    marketIndex,
    sportDevIndex,
    meritSummary: 'Construa mais vitórias, títulos e reputação esportiva para fechar contrato.',
    localityLabel: ctx.localityLabel
  };
}

/**
 * Calcula taxa cerimonial de exame de graduação + custo do novo equipamento oficial
 * (faixa, corda, quimono ou bandagem) conforme a economia regional e o centro de treinamento.
 */
export function calculateGraduationCeremonyCost(
  char: Character,
  art: MartialArtType,
  nextRank?: { stageNumber?: number; minAge?: number },
  currentGym?: Gym
): GraduationCostResult {
  const ctx = resolveActiveEconomicContext(char);
  const resolvedGym =
    currentGym || WORLD_GYMS.find((g) => g.id === char.currentGymId);

  const isDanOrMaster = Boolean(
    (nextRank?.stageNumber && nextRank.stageNumber >= 8) ||
      (nextRank?.minAge && nextRank.minAge >= 19)
  );

  let examFee = Math.round((isDanOrMaster ? 185 : 95) * ctx.economy.gymTuitionMultiplier);

  const baseEquip =
    art === 'jiujitsu' || art === 'judo' || art === 'karate'
      ? isDanOrMaster
        ? 70
        : 40
      : art === 'capoeira'
      ? isDanOrMaster
        ? 55
        : 30
      : isDanOrMaster
      ? 50
      : 28;

  let equipmentFee = Math.round(baseEquip * ctx.economy.costOfLivingIndex);
  let socialDiscountApplied = false;

  if (resolvedGym?.qualityTier === 'social') {
    socialDiscountApplied = true;
    examFee = Math.round(examFee * 0.6);
    equipmentFee = 0;
  }

  const totalCost = examFee + equipmentFee;
  const familyCanPay = char.age < 18 && char.familySupport >= 50;
  const athletePays = familyCanPay ? 0 : totalCost;

  const equipmentLabel =
    art === 'jiujitsu' || art === 'judo' || art === 'karate'
      ? 'Nova Faixa Oficial & Bordado'
      : art === 'capoeira'
      ? 'Nova Corda & Abadá Oficial'
      : 'Bandagens, Luvas & Material Oficial';

  return {
    totalCost,
    examFee,
    equipmentFee,
    isDanOrMaster,
    socialDiscountApplied,
    familyCanPay,
    athletePays,
    equipmentLabel
  };
}

/**
 * Calcula manutenção mensal de equipamentos de treino (bandagens, quimono/lavanderia, protetor)
 * conforme arte marcial, qualidade da academia e índice de custo de vida local.
 */
export function calculateMonthlyEquipmentCost(char: Character): MonthlyEquipmentExpenseResult {
  const currentGym = WORLD_GYMS.find((g) => g.id === char.currentGymId);
  const hasActiveClasses = (char.enrolledClasses || []).some((c) => c.status === 'ativa');
  const isOwnAcademy = Boolean(char.playerAcademy && char.currentGymId === char.playerAcademy.id);

  if (currentGym?.qualityTier === 'social' || (!hasActiveClasses && !currentGym && !isOwnAcademy)) {
    return {
      monthlyCost: 0,
      athletePays: 0,
      familyPays: 0,
      paidByFamily: false,
      reasonLabel:
        currentGym?.qualityTier === 'social'
          ? 'Material subsidiado pelo Projeto Social'
          : 'Sem custo ativo de equipamentos'
    };
  }

  // Sem turmas ativas e na academia gratuita de bairro: não gera cobrança automática
  if (!hasActiveClasses && (!currentGym || currentGym.weeklyCost === 0) && !isOwnAcademy) {
    return {
      monthlyCost: 0,
      athletePays: 0,
      familyPays: 0,
      paidByFamily: false,
      reasonLabel: 'Treino avulso sem custo fixo de equipamento'
    };
  }

  const ctx = resolveActiveEconomicContext(char);
  const art: MartialArtType = char.primaryArt || 'jiujitsu';
  const baseGear =
    art === 'jiujitsu' || art === 'judo' || art === 'karate'
      ? 42
      : art === 'boxe' || art === 'muaythai' || art === 'mma'
      ? 36
      : 28;

  const monthlyCost = Math.round(baseGear * ctx.economy.costOfLivingIndex);
  const familyCovers =
    char.age < 18 &&
    char.familySupport >= 50 &&
    char.familyWealthTier !== 'humilde';

  return {
    monthlyCost,
    athletePays: familyCovers ? 0 : monthlyCost,
    familyPays: familyCovers ? monthlyCost : 0,
    paidByFamily: familyCovers,
    reasonLabel: `${MARTIAL_ARTS_META[art]?.name.split(' ')[0] || 'Tatame'} · ${ctx.localityLabel}`
  };
}
