import { Character, MartialArtType, BeltGraduation, FighterAttributes, GameDate, GameDifficulty } from '../types/game';
import { MARTIAL_ARTS_META, ALL_MOVES, WORLD_GYMS } from '../data/martialArtsData';
import { INITIAL_RIVALS, INITIAL_TOURNAMENTS } from '../data/tournamentsData';
import { 
  calculateAge, 
  calculateCareerStartDate, 
  advanceDateByMonth, 
  MONTH_NAMES, 
  isBirthdayThisMonth,
  isLeapYear
} from './dateUtils';
import { generateMonthlySessionsForEnrolledClasses } from '../types/agenda';
import { 
  auditAndNormalizeCharacterGraduations, 
  checkMmaTierProgression, 
  validateGraduationRequirements,
  checkAgeTransitions,
  processAutonomousNpcGraduations
} from './graduationHelper';
import { 
  calculateGymMonthlyExpenses, 
  calculateMonthlyRecovery 
} from './recoveryHelper';
import { getOrInitializePlayerBjjRepertoire, compactPlayerBjjRepertoire } from './bjjRepertoireHelper';
import { getAgeCategoryFromAge, getStarterRivals, normalizeMartialArt, WORLD_FIGHTERS } from '../data/worldFightersData';
import { createInitialSocialContacts, processMonthlySocialWorld } from './socialLifeHelper';
import { computeBjjStripesFromProgress, formatBjjBeltWithDegree } from './bjjDegreeHelper';
import { processMonthlyPlayerAcademy } from './playerAcademyHelper';
import {
  canFamilyAffordBirthday,
  collectMonthlyFamilyBirthdays,
  MonthlyAbsenceEvent,
  resolveMonthlyTrainingAttendance,
  rollMonthlyIllnesses
} from './monthlyAttendanceHelper';
import {
  generateRandomArtTalents,
  getDifficultyForWealthTier,
  getDifficultyProfile
} from './talentAndDifficultyHelper';
import { AVAILABLE_JOBS } from '../data/lifeEventsData';
import {
  createInitialEducationState,
  migrateEducationState,
  processMonthlyEducation
} from './educationHelper';
import { getRealAthleteAge, resolveTournamentIsGi } from './tournamentTimeline';
import { resolveBrazilCapitalByCity } from './regionalGeographyHelper';
import {
  calculateMonthlyEquipmentCost,
  calculateRegionalDietCost,
  calculateRegionalJobMonthlyPay,
  calculateRegionalLivingExpenses,
  calculateRegionalSponsorship,
  LivingExpensesResult,
  RegionalSponsorshipResult
} from './regionalEconomyHelper';

export function createInitialGraduations(primaryArt: MartialArtType): Record<MartialArtType, BeltGraduation> {
  const arts: MartialArtType[] = ['boxe', 'jiujitsu', 'muaythai', 'karate', 'judo', 'capoeira', 'lutalivre', 'mma'];
  const res: Partial<Record<MartialArtType, BeltGraduation>> = {};

  arts.forEach((art) => {
    const meta = MARTIAL_ARTS_META[art];
    const initialRank = meta.ranks[0];
    res[art] = {
      rankIndex: 0,
      name: initialRank.name,
      color: initialRank.color,
      textColor: initialRank.textColor,
      stripes: 0,
      xp: art === primaryArt ? 30 : 0,
      xpNeeded: initialRank.xpNeeded,
      masteryTitle:
        art === 'jiujitsu'
          ? formatBjjBeltWithDegree(0, initialRank.name, 0)
          : initialRank.name,
      stageNumber: initialRank.stageNumber,
      categoryName: initialRank.categoryName,
      evaluationCriteria: initialRank.evaluationCriteria,
      estimatedTime: initialRank.estimatedTime,
      gradientStyle: initialRank.gradientStyle,
      monthsInRank: 0
    };
  });

  return res as Record<MartialArtType, BeltGraduation>;
}

export function createNewCharacter(
  name: string,
  nickname: string,
  birthDate: GameDate,
  startAge: 8 | 13 | 21,
  primaryArt: MartialArtType,
  avatar: string,
  homeState: string = 'SP',
  homeCity: string = 'São Paulo',
  gender: 'M' | 'F' = 'M',
  difficulty: GameDifficulty = 'normal'
): Character {
  const diffProfile = getDifficultyProfile(difficulty);
  // Base attributes scaled realistically by starting age
  const baseAttr: FighterAttributes = {
    strength: startAge === 8 ? 10 : startAge === 13 ? 16 : 24,
    speed: startAge === 8 ? 12 : startAge === 13 ? 18 : 22,
    stamina: startAge === 8 ? 14 : startAge === 13 ? 20 : 24,
    durability: startAge === 8 ? 10 : startAge === 13 ? 15 : 22,
    flexibility: startAge === 8 ? 20 : startAge === 13 ? 16 : 14,
    fightIq: startAge === 8 ? 8 : startAge === 13 ? 14 : 18,
    technique: startAge === 8 ? 10 : startAge === 13 ? 16 : 20,
    mentalFocus: startAge === 8 ? 12 : startAge === 13 ? 16 : 20
  };

  // Bonus attributes according to primary martial art
  if (primaryArt === 'boxe') {
    baseAttr.speed += 4;
    baseAttr.strength += 3;
  } else if (primaryArt === 'jiujitsu') {
    baseAttr.technique += 5;
    baseAttr.flexibility += 4;
  } else if (primaryArt === 'muaythai') {
    baseAttr.durability += 4;
    baseAttr.strength += 4;
  } else if (primaryArt === 'karate') {
    baseAttr.speed += 5;
    baseAttr.technique += 4;
  } else if (primaryArt === 'judo') {
    baseAttr.strength += 4;
    baseAttr.fightIq += 4;
  } else if (primaryArt === 'capoeira') {
    baseAttr.flexibility += 6;
    baseAttr.speed += 4;
  } else if (primaryArt === 'lutalivre') {
    baseAttr.strength += 5;
    baseAttr.stamina += 5;
  }

  const initialMoves = ALL_MOVES.filter((m) => m.art === primaryArt || m.minBeltIndex === 0).slice(0, 4);

  const startWeight = startAge === 8 ? 32 : startAge === 13 ? 54 : 70;

  // Calculate career start date from birth date and start age
  const careerStartDate = calculateCareerStartDate(birthDate, startAge);
  const calculatedAge = calculateAge(birthDate, careerStartDate);

  const newChar: Character = {
    name: name.trim() || 'Guerreiro da Silva',
    nickname: nickname.trim() || 'Predador',
    avatar: avatar || '🥋',
    gender,
    maritalStatus: 'solteiro',
    isAlive: true,
    birthDate: { ...birthDate },
    careerStartDate: { ...careerStartDate },
    currentDate: { ...careerStartDate },
    careerMonthsElapsed: 0,
    homeState,
    homeCity,
    age: calculatedAge,
    startAge,
    currentWeek: 1,
    currentMonth: careerStartDate.month,
    currentYear: careerStartDate.year,
    primaryArt,
    weight: startWeight,
    targetWeight: startWeight <= 52 ? 52 : startWeight <= 66 ? 66 : 70,
    weightClass: startWeight <= 52 ? 'Palha (até 52kg)' : startWeight <= 66 ? 'Pena (até 66kg)' : 'Leve (até 70kg)',
    money: diffProfile.startingMoneyByAge[startAge],
    energy: 100,
    mentalHealth: 90,
    stress: 10,
    honor: 50,
    fame: 10,
    hype: 5,
    currentGymId: 'gym_bairro',
    job: 'desempregado',
    schoolGrade: startAge < 18 ? 8.5 : 8.0,
    isStudying: startAge < 18,
    schoolShift: 'manha',
    education: createInitialEducationState(startAge, diffProfile.id, careerStartDate),
    dietPlan: 'caseira',
    injuries: [],
    accumulatedFatigue: 0,
    recoveryRate: 100,
    currentCity: homeCity,
    currentCountry: 'Brasil',
    attributes: baseAttr,
    artGraduations: createInitialGraduations(primaryArt),
    moves: initialMoves,
    bjjTechniqueRepertoire: getOrInitializePlayerBjjRepertoire(),
    record: {
      wins: 0,
      losses: 0,
      draws: 0,
      kos: 0,
      submissions: 0,
      pointsWins: 0,
      mmaWins: 0,
      mmaLosses: 0
    },
    trophies: [],
    tournamentHistory: [],
    enrolledClasses: [],
    scheduledActivities: [],
    classSessions: [],
    rivals: getStarterRivals(),
    npcWorldState: {},
    socialContacts: [],
    difficulty: diffProfile.id,
    familyWealthTier: diffProfile.familyWealthTier,
    artTalents: generateRandomArtTalents(),
    discoveredArtTalents: {},
    ownedEquipmentIds: [],
    equippedEquipment: {},
    familySupport: diffProfile.initialFamilySupport,
    socialFeed: [
      {
        id: 'post_welcome',
        author: 'Mestre Tião',
        handle: '@mestre_tiao_dojo',
        text: `Bem-vindo ao tatame em ${homeCity} (${homeState}), novato! O caminho é árduo, mas a disciplina forja o ouro. Nos vemos às 6h da manhã. 🥋👊`,
        time: 'Hoje',
        likes: 12,
        verified: true
      },
      {
        id: 'post_federacao',
        author: `Federação de ${homeState} de Lutas`,
        handle: `@federacao_${homeState.toLowerCase()}`,
        text: `Temporada de ${careerStartDate.year} aberta em ${homeCity}! Preparem suas inscrições para os estaduais e opens municipais! 🏆`,
        time: 'Ontem',
        likes: 145,
        verified: true
      }
    ]
  };

  newChar.socialContacts = createInitialSocialContacts(newChar);
  return newChar;
}

/**
 * Avança o tempo do jogo mês a mês de forma centralizada e realista.
 * - Atualiza a data civil (dia, mês e ano).
 * - Incrementa meses de carreira decorridos.
 * - Calcula a idade do personagem estritamente a partir da data de nascimento (sem aumentar na virada de ano).
 * - Processa efeitos mensais (salários, dietas, mensalidade de academia, notas da escola, recuperação).
 */
export function advanceMonth(char: Character): {
  updatedChar: Character;
  monthLog: string[];
  promotedArt?: MartialArtType;
  birthdayCelebrated?: boolean;
} {
  let updated = JSON.parse(JSON.stringify(char)) as Character;
  const logs: string[] = [];
  let promotedArt: MartialArtType | undefined;
  let birthdayCelebrated = false;

  // 1. Save outgoing month date and advance Calendar by 1 month
  const outgoingDate = { ...updated.currentDate };
  const previousAge = updated.age;
  const previousYear = updated.currentYear;
  const nextDate = advanceDateByMonth(updated.currentDate);
  updated.currentDate = nextDate;
  updated.currentMonth = nextDate.month;
  updated.currentYear = nextDate.year;
  updated.careerMonthsElapsed += 1;

  // Check Year Turn (Dezembro -> Janeiro)
  if (updated.currentDate.year > previousYear) {
    logs.push(`🎆 Virada de Ano Civil! Bem-vindo a ${updated.currentDate.year}! Uma nova temporada esportiva se inicia no calendário oficial.`);
  }

  // 2. Age calculation: strictly based on birthDate and currentDate!
  const newAge = calculateAge(updated.birthDate, updated.currentDate);
  const agedUpThisTransition = newAge > previousAge;
  if (agedUpThisTransition) {
    updated.age = newAge;

    // Natural physical growth if young (<= 18 years old)
    if (newAge <= 18) {
      const growthWeight = newAge <= 13 ? 3.0 : 2.0;
      updated.weight = Math.min(90, Math.round((updated.weight + growthWeight) * 10) / 10);
      logs.push(`📈 Seu corpo cresceu (+${growthWeight} kg) com o avanço da idade. Fique atento à sua categoria de peso na balança!`);
    }
  }

  // 3. Monthly Education & Schooling Simulation (Fundamental, Médio, Técnico e Superior)
  const eduRes = processMonthlyEducation(updated);
  updated = eduRes.updatedChar;
  if (eduRes.logs.length > 0) {
    logs.push(...eduRes.logs);
  }

  // 4. Monthly Economy: Income & Gym Costs & Diet Expenses
  const activeJobDef = AVAILABLE_JOBS.find((j) => j.id === updated.job);
  const monthlyIncome =
    activeJobDef && activeJobDef.id !== 'desempregado'
      ? calculateRegionalJobMonthlyPay(updated, activeJobDef)
      : 0;

  if (monthlyIncome > 0 && activeJobDef) {
    updated.money += monthlyIncome;
    logs.push(`💵 Salário do mês recebido: +R$ ${monthlyIncome.toLocaleString('pt-BR')} (${activeJobDef.title}).`);
    if (activeJobDef.recoveryBonus && activeJobDef.recoveryBonus > 0) {
      updated.accumulatedFatigue = Math.max(
        0,
        (updated.accumulatedFatigue || 0) - Math.round(activeJobDef.recoveryBonus * 0.5)
      );
    }
  }

  // 4.0b Mesada familiar conforme poder aquisitivo da família (menores de 18 anos)
  if (updated.age < 18) {
    const famTier = updated.familyWealthTier || getDifficultyProfile(updated.difficulty).familyWealthTier;
    const allowance = famTier === 'milionario' ? 450 : famTier === 'abastado' ? 150 : 0;
    if (allowance > 0 && updated.familySupport >= 45) {
      updated.money += allowance;
      logs.push(
        `💳 Mesada da Família (${famTier === 'milionario' ? 'Família Milionária' : 'Família Abastada'}): +R$ ${allowance.toLocaleString('pt-BR')}.`
      );
    }
  }

  // 4.1 Patrocínios Dinâmicos por Fama, Resultados & Mercado Local (a partir dos 16 anos)
  const sponsor = evaluateMonthlySponsorship(updated);
  if (sponsor.name && sponsor.monthlyPay > 0) {
    if (updated.activeSponsorName !== sponsor.name) {
      logs.push(
        `🤝 Novo Contrato de Patrocínio! ${sponsor.name} assinou com você (+R$ ${sponsor.monthlyPay.toLocaleString('pt-BR')}/mês · ${sponsor.localityLabel}).`
      );
    } else {
      logs.push(
        `🤝 Patrocínio Mensal (${sponsor.name}): +R$ ${sponsor.monthlyPay.toLocaleString('pt-BR')}.`
      );
    }
    updated.activeSponsorName = sponsor.name;
    updated.activeSponsorMonthlyPay = sponsor.monthlyPay;
    updated.money += sponsor.monthlyPay;
  } else {
    updated.activeSponsorName = undefined;
    updated.activeSponsorMonthlyPay = 0;
  }

  // 4.1b Despesas de Vida Adulta Regionalizadas (moradia, alimentação, transporte, saúde e dependentes)
  const living = calculateLivingExpenses(updated);
  if (living.monthlyCost > 0) {
    const { housing, food, transport, health, family } = living.breakdown;
    const itemSummary = `Moradia R$ ${housing} · Alim. R$ ${food} · Transp. R$ ${transport} · Saúde R$ ${health}${
      family > 0 ? ` · Família R$ ${family}` : ''
    }`;
    if (updated.money >= living.monthlyCost) {
      updated.money -= living.monthlyCost;
      logs.push(
        `🏠 Custo de Vida (${living.contextLabel}): -R$ ${living.monthlyCost.toLocaleString('pt-BR')} (${itemSummary}).`
      );
    } else {
      const paid = updated.money;
      updated.money = 0;
      updated.stress = Math.min(100, updated.stress + 4);
      logs.push(
        paid > 0
          ? `🏠 Contas da Casa (${living.localityLabel}): pagou R$ ${paid.toLocaleString('pt-BR')} de R$ ${living.monthlyCost.toLocaleString('pt-BR')}, orçamento no limite este mês.`
          : `💸 Orçamento Zerado (${living.localityLabel}): você não teve saldo para arcar com moradia e contas deste mês.`
      );
    }
  }

  // 4.2 Mensalidades das Academias (Etapa 3.2 - Fase 2)
  // Cobrança única por academia distinta (weeklyCost * 4), sem duplicar por múltiplas turmas
  const gymExpenses = calculateGymMonthlyExpenses(updated);
  if (gymExpenses.uniqueGymCount > 0) {
    gymExpenses.gyms.forEach((gymExp) => {
      if (gymExp.paidByFamily) {
        logs.push(`🏛️ Suporte Familiar: Seus responsáveis cobriram a mensalidade de R$ ${gymExp.familyAmount.toLocaleString('pt-BR')} na ${gymExp.gymName}${gymExp.classesCount > 1 ? ` (${gymExp.classesCount} turmas ativas no mesmo centro esportivo)` : ''}.`);
      } else if (gymExp.athleteAmount > 0) {
        if (updated.money >= gymExp.athleteAmount) {
          updated.money -= gymExp.athleteAmount;
          logs.push(`🏛️ Mensalidade da academia (${gymExp.gymName}): -R$ ${gymExp.athleteAmount.toLocaleString('pt-BR')}${gymExp.classesCount > 1 ? ` (${gymExp.classesCount} turmas inclusas no mesmo plano)` : ''}.`);
        } else {
          logs.push(`⚠️ Saldo insuficiente para pagar a mensalidade da ${gymExp.gymName} (-R$ ${gymExp.athleteAmount.toLocaleString('pt-BR')})!`);
          updated.stress = Math.min(100, updated.stress + 10);
        }
      }
    });
  }

  // 4.2b Manutenção Mensal de Equipamentos & Material de Treino
  const equipExpenses = calculateMonthlyEquipmentCost(updated);
  if (equipExpenses.athletePays > 0) {
    if (updated.money >= equipExpenses.athletePays) {
      updated.money -= equipExpenses.athletePays;
      logs.push(
        `🥋 Manutenção de Equipamentos (${equipExpenses.reasonLabel}): -R$ ${equipExpenses.athletePays.toLocaleString('pt-BR')}.`
      );
    }
  }

  // Diet monthly effects (regionalized food index)
  if (updated.dietPlan === 'bulking') {
    const cost = calculateRegionalDietCost(updated, 'bulking');
    updated.money = Math.max(0, updated.money - cost);
    updated.weight = Math.round((updated.weight + 1.2) * 10) / 10;
    logs.push(`🥩 Dieta Hipercalórica do mês: +1.2 kg na balança (-R$ ${cost.toLocaleString('pt-BR')}).`);
  } else if (updated.dietPlan === 'corte_severo') {
    const cost = calculateRegionalDietCost(updated, 'corte_severo');
    updated.money = Math.max(0, updated.money - cost);
    updated.weight = Math.max(45, Math.round((updated.weight - 2.5) * 10) / 10);
    updated.attributes.durability = Math.max(10, updated.attributes.durability - 0.5);
    logs.push(`🔥 Corte Severo de Peso: -2.5 kg eliminados na balança (-R$ ${cost.toLocaleString('pt-BR')}).`);
  } else if (updated.dietPlan === 'atletica') {
    const cost = calculateRegionalDietCost(updated, 'atletica');
    updated.money = Math.max(0, updated.money - cost);
    updated.attributes.stamina = Math.min(100, updated.attributes.stamina + 1.0);
    logs.push(`🥗 Dieta Atlética de Alto Rendimento: +1.0 Resistência física (-R$ ${cost.toLocaleString('pt-BR')}).`);
  }

  // 5. Healing injuries over the month (4 weeks equivalent)
  if (updated.injuries.length > 0) {
    updated.injuries = updated.injuries
      .map((inj) => ({ ...inj, weeksRemaining: inj.weeksRemaining - 4 }))
      .filter((inj) => {
        if (inj.weeksRemaining <= 0) {
          logs.push(`🩹 Recuperação Médica: Lesão curada com sucesso (${inj.name})! Liberado para lutar!`);
          return false;
        }
        return true;
      });
  }

  // 6. Vida social autônoma no mês: casamentos, batizados, nascimentos, início em artes marciais e saúde
  const socialRes = processMonthlySocialWorld(updated, Math.random, outgoingDate);
  updated = socialRes.updatedChar;
  if (socialRes.logs.length > 0) {
    logs.push(...socialRes.logs);
  }

  // 6.1 Aniversário do próprio PJ se caiu exatamente no dia 1º do mês que se inicia
  const isOwnBirthdayInOutgoingMonth = updated.birthDate.month === outgoingDate.month;
  if (agedUpThisTransition && !isOwnBirthdayInOutgoingMonth && updated.birthDate.month === nextDate.month) {
    const afford = canFamilyAffordBirthday(
      updated,
      updated.age >= 18 || updated.maritalStatus === 'casado'
    );
    if (afford.canAfford) {
      if (afford.playerCost > 0) {
        updated.money = Math.max(0, updated.money - afford.playerCost);
      }
      updated.mentalHealth = Math.min(100, updated.mentalHealth + 4);
      updated.stress = Math.max(0, updated.stress - 4);
      updated.ownBirthdayCelebratedYear = nextDate.year;
      birthdayCelebrated = true;
      logs.push(
        `🎂 FELIZ ANIVERSÁRIO! Você completou ${updated.age} anos de idade no dia 01 de ${MONTH_NAMES[updated.birthDate.month - 1]}!${afford.playerCost > 0 ? ` (-R$ ${afford.playerCost})` : ''}`
      );
    } else {
      updated.ownBirthdayCelebratedYear = -nextDate.year;
      birthdayCelebrated = false;
      logs.push(
        `💸 Você completou ${updated.age} anos no dia 01 de ${MONTH_NAMES[updated.birthDate.month - 1]}, mas a família está sem dinheiro para comemorar.`
      );
    }
  }

  // 6.2 Aniversários da família (condicionados a dinheiro), doenças raras e comparecimento automático nos treinos do mês
  const monthAbsenceEvents: MonthlyAbsenceEvent[] = [...(socialRes.familyEvents || [])];

  // Se o PJ celebrou o próprio aniversário no dia 1º deste mês que encerrou, bloqueia apenas esse dia no mês
  if (
    updated.birthDate.day === 1 &&
    updated.birthDate.month === outgoingDate.month &&
    updated.ownBirthdayCelebratedYear === outgoingDate.year
  ) {
    monthAbsenceEvents.push({
      startDay: 1,
      endDay: 1,
      reasonType: 'aniversario_familia',
      title: `Seu aniversário (${updated.age} anos)`,
      notes: 'Falta justificada: Comemoração do seu aniversário em família'
    });
  }

  const birthdayRes = collectMonthlyFamilyBirthdays(updated, outgoingDate, {
    skipOwnBirthday:
      updated.ownBirthdayCelebratedYear === outgoingDate.year ||
      updated.ownBirthdayCelebratedYear === -outgoingDate.year
  });
  monthAbsenceEvents.push(...birthdayRes.events);

  if (agedUpThisTransition && isOwnBirthdayInOutgoingMonth) {
    if (birthdayRes.ownBirthdayCelebrated) {
      birthdayCelebrated = true;
      const isBornFeb29 = updated.birthDate.month === 2 && updated.birthDate.day === 29;
      const celebrationDay = isBornFeb29 && !isLeapYear(outgoingDate.year) ? 28 : updated.birthDate.day;
      logs.push(
        `🎂 FELIZ ANIVERSÁRIO! Você completou ${newAge} anos de idade no dia ${celebrationDay} de ${MONTH_NAMES[updated.birthDate.month - 1]}!`
      );
    }
  }
  if (birthdayRes.logs.length > 0) {
    logs.push(...birthdayRes.logs);
  }

  const illnessRes = rollMonthlyIllnesses(updated, outgoingDate);
  monthAbsenceEvents.push(...illnessRes.events);
  if (illnessRes.logs.length > 0) {
    logs.push(...illnessRes.logs);
  }

  const attendanceRes = resolveMonthlyTrainingAttendance(updated, outgoingDate, monthAbsenceEvents);
  updated = attendanceRes.updatedChar;
  if (attendanceRes.logs.length > 0) {
    logs.push(...attendanceRes.logs);
  }

  // 7. Monthly Physiological Recovery (Etapa 3.2 - Fase 4)
  // Calcula regeneração real considerando os treinos concluídos no mês que encerrou
  const recoveryResult = calculateMonthlyRecovery(updated, outgoingDate.month, outgoingDate.year);
  updated.energy = recoveryResult.newEnergy;
  updated.accumulatedFatigue = recoveryResult.newFatigue;
  updated.recoveryRate = recoveryResult.recoveryRate;
  logs.push(...recoveryResult.recoveryNotes);

  // Alívio natural de estresse condicionado à fadiga
  if (updated.accumulatedFatigue < 40) {
    updated.stress = Math.max(0, updated.stress - 15);
  } else {
    updated.stress = Math.min(100, updated.stress + Math.round((updated.accumulatedFatigue - 40) * 0.25));
  }

  // 8. Progressão temporal de graduação e carência (já inclui o XP dos treinos do mês!)
  if (updated.artGraduations) {
    Object.values(updated.artGraduations).forEach((grad) => {
      grad.monthsInRank = (grad.monthsInRank || 0) + 1;
    });

    const bjjGrad = updated.artGraduations.jiujitsu;
    if (bjjGrad) {
      const bjjMeta = MARTIAL_ARTS_META.jiujitsu;
      const nextRankDef = bjjMeta.ranks[bjjGrad.rankIndex + 1];
      const computedStripes = computeBjjStripesFromProgress(
        bjjGrad.rankIndex,
        bjjGrad.xp,
        bjjGrad.xpNeeded,
        bjjGrad.monthsInRank || 0,
        nextRankDef?.minMonthsInRank
      );
      if (computedStripes > (bjjGrad.stripes || 0)) {
        bjjGrad.stripes = computedStripes;
        bjjGrad.masteryTitle = formatBjjBeltWithDegree(bjjGrad.rankIndex, bjjGrad.name, computedStripes);
        logs.push(`🥋 Novo Grau no Jiu-Jitsu! Você recebeu o ${computedStripes}º Grau em "${bjjGrad.name}"!`);
      } else {
        bjjGrad.masteryTitle = formatBjjBeltWithDegree(bjjGrad.rankIndex, bjjGrad.name, bjjGrad.stripes || 0);
      }
    }
  }

  // 8.1 Transição oficial aos 16 anos (CBJJ e Capoeira Muzenza)
  if (updated.age >= 16) {
    const ageTransRes = checkAgeTransitions(updated);
    updated = ageTransRes.updatedChar;
    if (ageTransRes.logs.length > 0) {
      logs.push(...ageTransRes.logs);
    }
  }

  const artMeta = MARTIAL_ARTS_META[updated.primaryArt];
  if (updated.primaryArt === 'mma') {
    const mmaCheck = checkMmaTierProgression(updated);
    if (mmaCheck.promoted) {
      promotedArt = 'mma';
      if (mmaCheck.log) logs.push(mmaCheck.log);
    }
  } else {
    const eligibility = validateGraduationRequirements(updated, updated.primaryArt);
    if (eligibility.canAdvance) {
      if (updated.age < 18) {
        logs.push(`🥋 Cerimônia Oficial Próxima! O mestre comunicou sua família: você atingiu os requisitos oficiais para prestar exame de graduação em ${artMeta.name} perante a ${artMeta.federation.split('&')[0]}! Visite o tatame para realizar a cerimônia com a bênção dos seus responsáveis.`);
      } else {
        logs.push(`🥋 Requisitos Regulamentares Cumpridos! Você já está apto para prestar o exame oficial de graduação em ${artMeta.name} perante a ${artMeta.federation.split('&')[0]}! Visite o tatame para realizar a cerimônia com seu Mestre.`);
      }
    }
  }

  // 8.2 Evolução autônoma global: treinos, combates, graduações e transferências de academia dos NPCs
  const npcGradRes = processAutonomousNpcGraduations(updated);
  updated = npcGradRes.updatedChar;
  if (npcGradRes.logs.length > 0) {
    logs.push(...npcGradRes.logs);
  }

  // 8.3 Gestão mensal da Academia Própria do Professor (alunos NPCs, receita líquida, evolução técnica)
  const academyRes = processMonthlyPlayerAcademy(updated);
  updated = academyRes.updatedChar;
  if (academyRes.logs.length > 0) {
    logs.push(...academyRes.logs);
  }

  // 9. Gera novas sessões agendadas para o novo mês civil para turmas ativas
  if (Array.isArray(updated.enrolledClasses) && updated.enrolledClasses.some((c) => c.status === 'ativa')) {
    const newMonthSessions = generateMonthlySessionsForEnrolledClasses(updated);
    if (!Array.isArray(updated.classSessions)) {
      updated.classSessions = [];
    }
    const existingIds = new Set(updated.classSessions.map((s) => s.id));
    for (const sess of newMonthSessions) {
      if (!existingIds.has(sess.id)) {
        updated.classSessions.push(sess);
      }
    }
  }

  // 10. Higiene de memória e persistência: remove sessões expiradas/canceladas antigas e limita históricos longos
  if (Array.isArray(updated.classSessions) && updated.classSessions.length > 250) {
    const curYear = updated.currentDate.year;
    const curMonth = updated.currentDate.month;
    const filtered = updated.classSessions.filter((s) => {
      const isCurrentMonth = s.date?.year === curYear && s.date?.month === curMonth;
      if (isCurrentMonth) return true;
      return s.status === 'concluida' || s.status === 'falta';
    });
    updated.classSessions = filtered.slice(-250);
  }

  if (Array.isArray(updated.socialFeed) && updated.socialFeed.length > 60) {
    updated.socialFeed = updated.socialFeed.slice(0, 60);
  }

  return { updatedChar: updated, monthLog: logs, promotedArt, birthdayCelebrated };
}

// Wrapper backward-compatible for existing components if any
export function advanceWeek(char: Character) {
  const res = advanceMonth(char);
  return {
    updatedChar: res.updatedChar,
    weekLog: res.monthLog,
    promotedArt: res.promotedArt
  };
}

export function evaluateMonthlySponsorship(char: Character): RegionalSponsorshipResult {
  return calculateRegionalSponsorship(char);
}

export function calculateLivingExpenses(char: Character): LivingExpensesResult {
  return calculateRegionalLivingExpenses(char);
}

const STORAGE_KEY = 'CAMINHO_DO_GUERREIRO_DATA_V3';
const LEGACY_STORAGE_KEY = 'CAMINHO_DO_GUERREIRO_DATA_V2';

export function migrateCharacterData(char: any): Character {
  // If character was saved in an older version lacking dates
  if (!char.birthDate || !char.currentDate || !char.careerStartDate) {
    const currentYear = char.currentYear || 2026;
    const currentMonth = char.currentMonth || 1;
    const startAge = char.startAge || char.age || 8;
    const birthYear = currentYear - (char.age || startAge);

    char.birthDate = {
      day: 15,
      month: 10,
      year: birthYear
    };

    char.careerStartDate = calculateCareerStartDate(char.birthDate, startAge);

    char.currentDate = {
      day: 15,
      month: currentMonth,
      year: currentYear
    };

    const months = (currentYear - char.careerStartDate.year) * 12 + (currentMonth - char.careerStartDate.month);
    char.careerMonthsElapsed = Math.max(0, months);
  }

  const homeCap = resolveBrazilCapitalByCity(char.homeCity, char.homeState || 'SP');
  char.homeState = homeCap.uf;
  char.homeCity = homeCap.capital;

  // Ensure age is strictly computed
  char.age = calculateAge(char.birthDate, char.currentDate);

  // Deduplicação e validação segura de troféus (impede duplicidade por torneio e ano)
  if (Array.isArray(char.trophies)) {
    const seenTrophies = new Set<string>();
    char.trophies = char.trophies.filter((tr: any) => {
      const key = `${tr.tournamentName}_${tr.year || 2026}`;
      if (seenTrophies.has(key)) return false;
      seenTrophies.add(key);
      return true;
    });
  } else {
    char.trophies = [];
  }

  // Migração segura do histórico de campeonatos para saves legados
  if (!char.tournamentHistory || !Array.isArray(char.tournamentHistory) || char.tournamentHistory.length === 0) {
    char.tournamentHistory = [];
    if (char.trophies.length > 0) {
      char.trophies.forEach((tr: any) => {
        const matchTourn = INITIAL_TOURNAMENTS.find((t) => t.name === tr.tournamentName);
        if (matchTourn) {
          char.tournamentHistory.push({
            tournamentId: matchTourn.id,
            year: tr.year || char.currentYear || 2026,
            month: matchTourn.monthScheduled || 1,
            registered: true,
            weighInPassed: true,
            completed: true,
            result: 'vitoria',
            trophyEarned: tr.tournamentName
          });
        }
      });
    }
  }

  // Deduplicação estrita e inicialização segura dos novos campos do circuito em saves legados V2/V3
  if (Array.isArray(char.tournamentHistory)) {
    const historyMap = new Map<string, any>();
    for (const rawEntry of char.tournamentHistory) {
      const matchTourn = INITIAL_TOURNAMENTS.find((t) => t.id === rawEntry.tournamentId);
      const entry = { ...rawEntry };

      // Inicialização segura para saves antigos sem isGi, ledger de matchIds ou rewardsClaimed
      if (entry.isGi === undefined && matchTourn) {
        entry.isGi = resolveTournamentIsGi(matchTourn, entry);
      }
      if (!entry.weightClass && matchTourn) {
        entry.weightClass = matchTourn.weightClass;
      }
      if (!entry.ageCategory) {
        entry.ageCategory = getAgeCategoryFromAge(getRealAthleteAge(char));
      }
      if (entry.categoryHomologated === undefined) {
        entry.categoryHomologated = Boolean(entry.weighInPassed);
      }
      if (!Array.isArray(entry.homologatedMatchIds)) {
        const fromHistory = Array.isArray(entry.matchHistory)
          ? entry.matchHistory.map((m: any) => m.matchId).filter(Boolean)
          : [];
        const fromBracket = Array.isArray(entry.bracket?.matches)
          ? entry.bracket.matches
              .filter((m: any) => m.status === 'concluida' && (m.fighterAId === 'player' || m.fighterBId === 'player'))
              .map((m: any) => m.matchId)
              .filter(Boolean)
          : [];
        entry.homologatedMatchIds = Array.from(new Set([...fromHistory, ...fromBracket]));
      }
      if (entry.rewardsClaimed === undefined) {
        entry.rewardsClaimed = Boolean(entry.completed && entry.result === 'vitoria');
      }
      if (entry.hostCity && (!entry.hostCountry || entry.hostCountry === 'Brasil')) {
        entry.hostCity = resolveBrazilCapitalByCity(entry.hostCity, char.homeState || 'SP').capital;
      }
      if (entry.bracket) {
        if (!entry.bracket.bracketId) {
          entry.bracket.bracketId = `${entry.tournamentId}_${entry.year}_${entry.bracket.ageCategory || entry.ageCategory}_${entry.bracket.weightClass || entry.weightClass || ''}`;
        }
        if (entry.bracket.isGi === undefined && matchTourn) {
          entry.bracket.isGi = resolveTournamentIsGi(matchTourn, entry);
        }
        if (Array.isArray(entry.bracket.participants)) {
          entry.bracket.participants.forEach((p: any) => {
            if (p?.city && (!p.country || p.country === 'Brasil')) {
              const cap = resolveBrazilCapitalByCity(p.city, p.uf || char.homeState || 'SP');
              p.city = cap.capital;
              p.uf = cap.uf;
            }
          });
        }
      }
      if (entry.activeMatchSession) {
        if (
          entry.completed ||
          entry.homologatedMatchIds.includes(entry.activeMatchSession.matchId)
        ) {
          entry.activeMatchSession = undefined;
        } else if (entry.activeMatchSession.isGi === undefined && matchTourn) {
          entry.activeMatchSession.isGi = resolveTournamentIsGi(matchTourn, entry);
        }
      }
      if (entry.activeBoxingMatchSession) {
        if (
          entry.completed ||
          entry.homologatedMatchIds.includes(entry.activeBoxingMatchSession.matchId)
        ) {
          entry.activeBoxingMatchSession = undefined;
        }
      }

      const key = `${entry.tournamentId}_${entry.year}`;
      const existing = historyMap.get(key);
      if (!existing) {
        historyMap.set(key, entry);
      } else {
        // Se já existe, preserva o registro com combate completo ou pesagem aprovada
        if (!existing.completed && entry.completed) {
          historyMap.set(key, entry);
        } else if (!existing.weighInPassed && entry.weighInPassed) {
          historyMap.set(key, entry);
        }
      }
    }
    char.tournamentHistory = Array.from(historyMap.values());
  } else {
    char.tournamentHistory = [];
  }

  // Valida currentGymId para evitar referências órfãs
  const validWorldGymIds = new Set(WORLD_GYMS.map((g) => g.id));
  if (
    !char.currentGymId ||
    (!validWorldGymIds.has(char.currentGymId) && char.playerAcademy?.id !== char.currentGymId)
  ) {
    char.currentGymId = 'gym_bairro';
  }

  // Garante inicialização da agenda semanal (aulas matriculadas e atividades agendadas)
  if (!Array.isArray(char.enrolledClasses)) {
    char.enrolledClasses = [];
  } else {
    // Compatibilidade com saves antigos que usavam 'shift' e sincronia de nomes oficiais das academias
    char.enrolledClasses = char.enrolledClasses.map((cls: any) => {
      let block = cls.block;
      if (!block) {
        if (cls.shift === 'manha') block = 'manha';
        else if (cls.shift === 'noite') block = 'noite';
        else if (cls.shift === 'madrugada') block = 'madrugada';
        else block = 'tarde';
      }
      const canonicalGym = WORLD_GYMS.find((g) => g.id === cls.gymId);
      return {
        ...cls,
        gymName: canonicalGym?.name || cls.gymName,
        block,
        pointsCost: cls.pointsCost || 1,
        status: cls.status || 'ativa'
      };
    });
  }

  if (!Array.isArray(char.scheduledActivities)) {
    char.scheduledActivities = [];
  }

  // Compatibilidade com saves antigos: inicializa classSessions e sincroniza nome canônico da academia
  if (!Array.isArray(char.classSessions)) {
    char.classSessions = [];
  } else {
    char.classSessions = char.classSessions.map((sess: any) => {
      const canonicalGym = WORLD_GYMS.find((g) => g.id === sess.gymId);
      if (canonicalGym && sess.gymName !== canonicalGym.name) {
        return { ...sess, gymName: canonicalGym.name };
      }
      return sess;
    });
  }

  // Migração retrocompatível: Wrestling -> Luta Livre Esportiva (LLE)
  if (char.primaryArt === 'wrestling') {
    char.primaryArt = 'lutalivre';
  }

  if (char.artGraduations) {
    if (char.artGraduations.wrestling && !char.artGraduations.lutalivre) {
      const oldWrestling = char.artGraduations.wrestling;
      char.artGraduations.lutalivre = {
        ...oldWrestling,
        art: 'lutalivre' as any,
        name: oldWrestling.name ? oldWrestling.name.replace(/Wrestling|Wrestler/gi, 'LLE') : 'Luta Livre Esportiva',
        belt: oldWrestling.belt || 'Faixa Branca',
        unlockedMoves: Array.isArray(oldWrestling.unlockedMoves)
          ? oldWrestling.unlockedMoves.map((m: string) => m.replace(/^wrestling_/, 'lutalivre_').replace('double_leg', 'baiana'))
          : ['lutalivre_baiana']
      };
      delete char.artGraduations.wrestling;
    } else if (!char.artGraduations.lutalivre) {
      const initialLLE = createInitialGraduations('lutalivre').lutalivre;
      char.artGraduations.lutalivre = initialLLE;
    }
  }

  if (Array.isArray(char.enrolledClasses)) {
    char.enrolledClasses.forEach((cls: any) => {
      if (cls.art === 'wrestling') cls.art = 'lutalivre';
      if (cls.classId === 'turma_bairro_wrestling') cls.classId = 'turma_bairro_lle_estendido';
    });
  }

  if (Array.isArray(char.classSessions)) {
    char.classSessions.forEach((sess: any) => {
      if (sess.art === 'wrestling') sess.art = 'lutalivre';
      if (sess.classId === 'turma_bairro_wrestling') sess.classId = 'turma_bairro_lle_estendido';
    });
  }

  if (char.accumulatedFatigue === undefined) char.accumulatedFatigue = 0;
  if (char.recoveryRate === undefined) char.recoveryRate = 100;
  if (!char.currentCountry) char.currentCountry = 'Brasil';
  if (char.currentCountry === 'Brasil') {
    char.currentCity = resolveBrazilCapitalByCity(
      char.currentCity || char.homeCity,
      char.homeState || 'SP'
    ).capital;
  } else if (!char.currentCity) {
    char.currentCity = char.homeCity || 'São Paulo';
  }

  // Reidrata metadados estáticos das graduações caso tenham sido compactados em salvamento
  if (char.artGraduations && typeof char.artGraduations === 'object') {
    const arts: MartialArtType[] = ['boxe', 'jiujitsu', 'muaythai', 'karate', 'judo', 'capoeira', 'lutalivre', 'mma'];
    for (const art of arts) {
      const grad = char.artGraduations[art];
      const meta = MARTIAL_ARTS_META[art];
      if (!grad || !meta) continue;
      const rankDef = meta.ranks[grad.rankIndex] || meta.ranks[0];
      if (rankDef) {
        if (!grad.color) grad.color = rankDef.color;
        if (!grad.textColor) grad.textColor = rankDef.textColor;
        if (!grad.gradientStyle && rankDef.gradientStyle) grad.gradientStyle = rankDef.gradientStyle;
        if (!grad.stageNumber && rankDef.stageNumber) grad.stageNumber = rankDef.stageNumber;
        if (!grad.categoryName && rankDef.categoryName) grad.categoryName = rankDef.categoryName;
        if (!grad.evaluationCriteria && rankDef.evaluationCriteria) grad.evaluationCriteria = rankDef.evaluationCriteria;
        if (!grad.estimatedTime && rankDef.estimatedTime) grad.estimatedTime = rankDef.estimatedTime;
        if (!grad.xpNeeded) grad.xpNeeded = rankDef.xpNeeded;
      }
    }
  }

  // Garante rivais iniciais em todas as 8 artes sem sobrescrever rivais já evoluídos do save
  if (!Array.isArray(char.rivals)) {
    char.rivals = getStarterRivals();
  } else {
    const worldById = new Map(WORLD_FIGHTERS.map((w) => [w.id, w]));
    const existingIds = new Set<string>();
    char.rivals = char.rivals.map((r: any) => {
      existingIds.add(r.id);
      const base = worldById.get(r.id);
      const safeArt = normalizeMartialArt(r.art, base?.art || 'lutalivre');
      const effGymId = r.gymId || base?.gymId || 'gym_bairro';
      const canonicalGym = WORLD_GYMS.find((g) => g.id === effGymId);
      return {
        ...(base || {}),
        ...r,
        art: safeArt,
        belt: r.art === 'wrestling' ? (base?.belt || 'Faixa Branca de LLE') : (r.belt || base?.belt || 'Iniciante'),
        ageCategory: r.ageCategory || getAgeCategoryFromAge(r.age || 20),
        rankIndex: r.rankIndex !== undefined ? r.rankIndex : base?.rankIndex ?? 0,
        gender: r.gender || base?.gender || 'M',
        wealthTier: r.wealthTier || base?.wealthTier || 'classe_media',
        sponsorName: r.sponsorName || base?.sponsorName,
        gymId: effGymId,
        gymName: canonicalGym?.name || r.gymName || base?.gymName,
        city:
          (r.country || base?.country || 'Brasil') === 'Brasil'
            ? resolveBrazilCapitalByCity(r.city || base?.city, char.homeState || 'SP').capital
            : r.city || base?.city,
        country: r.country || base?.country,
        fightingStyle: r.fightingStyle || base?.fightingStyle
      };
    });
    for (const starter of getStarterRivals()) {
      if (!existingIds.has(starter.id)) {
        char.rivals.push(starter);
      }
    }
  }

  if (!char.npcWorldState || typeof char.npcWorldState !== 'object') {
    char.npcWorldState = {};
  } else {
    for (const delta of Object.values(char.npcWorldState) as any[]) {
      if (delta && delta.c && (!delta.co || delta.co === 'Brasil')) {
        delta.c = resolveBrazilCapitalByCity(delta.c, 'SP').capital;
      }
    }
  }
  if (!char.gender) char.gender = 'M';
  if (!char.maritalStatus) char.maritalStatus = 'solteiro';
  if (char.isAlive === undefined) char.isAlive = true;
  if (!Array.isArray(char.socialContacts) || char.socialContacts.length === 0) {
    char.socialContacts = createInitialSocialContacts(char);
  } else {
    char.socialContacts = char.socialContacts.map((sc: any) => {
      if (sc?.city && (!sc.country || sc.country === 'Brasil')) {
        return {
          ...sc,
          city: resolveBrazilCapitalByCity(sc.city, char.homeState || 'SP').capital
        };
      }
      return sc;
    });
  }

  if (char.playerAcademy && char.playerAcademy.country === 'Brasil') {
    char.playerAcademy.city = resolveBrazilCapitalByCity(
      char.playerAcademy.city,
      char.homeState || 'SP'
    ).capital;
  }

  if (!char.trainingCampIntensity) char.trainingCampIntensity = 'tecnico';
  if (char.dynastyGeneration === undefined) char.dynastyGeneration = 1;
  if (!Array.isArray(char.coachedTournaments)) char.coachedTournaments = [];

  if (!char.difficulty) {
    char.difficulty = char.familyWealthTier ? getDifficultyForWealthTier(char.familyWealthTier) : 'normal';
  }
  if (!char.familyWealthTier) {
    char.familyWealthTier = getDifficultyProfile(char.difficulty).familyWealthTier;
  }
  if (!char.artTalents || typeof char.artTalents !== 'object') {
    char.artTalents = generateRandomArtTalents();
  }
  if (!char.discoveredArtTalents || typeof char.discoveredArtTalents !== 'object') {
    char.discoveredArtTalents = {};
  }
  if (Array.isArray(char.enrolledClasses)) {
    for (const cls of char.enrolledClasses) {
      if (cls.status === 'ativa' && cls.art) {
        char.discoveredArtTalents[cls.art] = true;
      }
    }
  }

  // Garante estado educacional compatível em saves antigos
  char.education = migrateEducationState(char);

  // Retrocompatibilidade e integridade: reidrata e garante repertório BJJ individualizado sem inventar dados
  char.bjjTechniqueRepertoire = getOrInitializePlayerBjjRepertoire(char);

  if (!Array.isArray(char.recentFightLogs)) {
    char.recentFightLogs = [];
  }

  if (!Array.isArray(char.ownedEquipmentIds)) {
    char.ownedEquipmentIds = [];
  }
  if (!char.equippedEquipment || typeof char.equippedEquipment !== 'object') {
    char.equippedEquipment = {};
  }

  const normalized = auditAndNormalizeCharacterGraduations(char);
  return normalized as Character;
}

export function buildCompactCharacterForStorage(char: Character, aggressive: boolean): any {
  const snapshot: any = {
    ...char,
    bjjTechniqueRepertoire: compactPlayerBjjRepertoire(char),
    socialFeed: Array.isArray(char.socialFeed)
      ? char.socialFeed.slice(0, aggressive ? 15 : 60)
      : []
  };

  // Compacta sessões antigas mantendo o mês atual e o histórico recente útil
  if (Array.isArray(char.classSessions)) {
    const curYear = char.currentDate?.year;
    const curMonth = char.currentDate?.month;
    const pruned = char.classSessions.filter((s) => {
      const isCurrent = s.date?.year === curYear && s.date?.month === curMonth;
      if (isCurrent) return true;
      return s.status === 'concluida' || s.status === 'falta';
    });
    snapshot.classSessions = pruned.slice(aggressive ? -30 : -200);
  }

  if (Array.isArray(char.graduationHistory)) {
    snapshot.graduationHistory = char.graduationHistory.slice(0, aggressive ? 30 : 80);
  }

  if (Array.isArray(char.recentFightLogs)) {
    snapshot.recentFightLogs = char.recentFightLogs
      .slice(0, aggressive ? 5 : 15)
      .map((log: any) => ({
        ...log,
        entries: Array.isArray(log.entries) ? log.entries.slice(aggressive ? -20 : -60) : []
      }));
  }

  if (aggressive && char.artGraduations) {
    const compactGrads: Record<string, any> = {};
    for (const [art, grad] of Object.entries(char.artGraduations)) {
      if (!grad) continue;
      const { evaluationCriteria, estimatedTime, categoryName, gradientStyle, ...coreGrad } = grad as any;
      compactGrads[art] = coreGrad;
    }
    snapshot.artGraduations = compactGrads;
  }

  if (aggressive && Array.isArray(char.tournamentHistory)) {
    snapshot.tournamentHistory = char.tournamentHistory.map((entry) => {
      // Torneios ainda em aberto preservam integralmente a chave e a sessão ativa para retomada
      if (!entry.completed) return entry;
      if (!entry.bracket) return entry;
      return {
        ...entry,
        activeMatchSession: undefined,
        activeBoxingMatchSession: undefined,
        bracket: {
          ...entry.bracket,
          participants: entry.bracket.participants.map(({ attributes, ...rest }) => ({
            ...rest,
            attributes: {
              strength: attributes.strength,
              speed: attributes.speed,
              stamina: attributes.stamina,
              durability: attributes.durability,
              flexibility: attributes.flexibility,
              fightIq: attributes.fightIq,
              technique: attributes.technique,
              mentalFocus: attributes.mentalFocus
            }
          }))
        }
      };
    });
  }

  if (aggressive && char.npcWorldState) {
    const compactNpcState: Record<string, any> = {};
    for (const [id, d] of Object.entries(char.npcWorldState)) {
      if (!d) continue;
      const { gn, c, co, tr, ...core } = d;
      if (Object.keys(core).length > 0) {
        compactNpcState[id] = core;
      }
    }
    snapshot.npcWorldState = compactNpcState;
  }

  if (aggressive && Array.isArray(char.socialContacts)) {
    snapshot.socialContacts = char.socialContacts.map((sc) => ({
      ...sc,
      recentLifeEvents: Array.isArray(sc.recentLifeEvents) ? sc.recentLifeEvents.slice(0, 2) : []
    }));
  }

  if (aggressive && char.playerAcademy) {
    snapshot.playerAcademy = {
      ...char.playerAcademy,
      students: char.playerAcademy.students.map((s) => ({
        ...s,
        recentNotes: Array.isArray(s.recentNotes) ? s.recentNotes.slice(0, 1) : [],
        graduationHistory: Array.isArray(s.graduationHistory) ? s.graduationHistory.slice(0, 3) : []
      }))
    };
  }

  return snapshot;
}

export function saveGame(char: Character): void {
  const normalPayload = JSON.stringify(buildCompactCharacterForStorage(char, false));

  try {
    // Libera espaço de versões legadas caso ainda existam no localStorage
    if (localStorage.getItem(LEGACY_STORAGE_KEY) !== null) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    localStorage.setItem(STORAGE_KEY, normalPayload);
    return;
  } catch {
    // Em alguns navegadores a sobrescrita falha se o espaço livre for menor que o novo item;
    // tenta remover a chave atual e antigos dados antes de compactar agressivamente.
  }

  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, normalPayload);
    return;
  } catch {
    // Segue para compactação agressiva
  }

  const aggressivePayload = JSON.stringify(buildCompactCharacterForStorage(char, true));

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, aggressivePayload);
    return;
  } catch {
    // Último recurso: persistência na sessão para evitar perda imediata e evitar QuotaExceededError fatal
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, aggressivePayload);
    console.warn('localStorage quota exceeded; character state saved to sessionStorage fallback.');
  } catch (sessionErr) {
    console.warn('Storage quota exhausted; unable to persist character state.', sessionErr);
  }
}

export function loadGame(): Character | null {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      try {
        raw = sessionStorage.getItem(STORAGE_KEY);
      } catch {
        // ignore sessionStorage errors
      }
    }
    if (!raw) {
      // Check legacy storage key
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return migrateCharacterData(parsed);
  } catch (e) {
    console.error('Failed to load character', e);
    return null;
  }
}

export function clearGameSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear save', e);
  }
}
