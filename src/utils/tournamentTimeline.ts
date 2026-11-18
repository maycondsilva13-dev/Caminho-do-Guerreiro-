import {
  AgeCategory,
  Tournament,
  Character,
  GameDate,
  CharacterTournamentEntry,
  TournamentTemporalStatus,
  TournamentDivisionSelection,
  WeightClass
} from '../types/game';
import { MARTIAL_ARTS_META, WEIGHT_CLASSES } from '../data/martialArtsData';
import { getAgeCategoryFromAge } from '../data/worldFightersData';
import { calculateAge, MONTH_NAMES } from './dateUtils';
import {
  evaluateTournamentGeographyAndTravel,
  TournamentGeographyEvaluation
} from './tournamentGeographyHelper';
import { CBJJ_OFFICIAL_GI_WEIGHT_KG } from '../data/tournamentDivisionsData';
import {
  getGiColorLabel,
  isValidOfficialGiColor,
  ResolvedTournamentDivision,
  resolveTournamentDivisionForCharacter
} from './tournamentDivisionsHelper';

/**
 * Compara duas GameDates cronologicamente.
 * Retorna negativo se d1 < d2, 0 se iguais, positivo se d1 > d2.
 */
export function compareGameDates(d1: GameDate, d2: GameDate): number {
  if (d1.year !== d2.year) return d1.year - d2.year;
  if (d1.month !== d2.month) return d1.month - d2.month;
  return d1.day - d2.day;
}

/**
 * Calcula a idade real do atleta usando exclusivamente a data de nascimento e a data atual do jogo,
 * respeitando aniversário e ano bissexto (nunca confiando cegamente em character.age).
 */
export function getRealAthleteAge(character: Pick<Character, 'age' | 'birthDate' | 'currentDate'>): number {
  if (character?.birthDate && character?.currentDate) {
    return calculateAge(character.birthDate, character.currentDate);
  }
  return Math.max(0, Number(character?.age) || 0);
}

/**
 * Resolve a modalidade persistente (Gi vs No-Gi) de um torneio.
 * Ordem de prioridade:
 * 1. Configuração registrada na inscrição/chave da edição (entry.isGi)
 * 2. Configuração explícita no cadastro do campeonato (tournament.isGi)
 * 3. Padrão documentado para torneios/saves legados sem o campo isGi:
 *    - Luta Livre ('lutalivre_sub') e MMA ('mma_unified'): false (Sem Quimono)
 *    - Jiu-Jitsu ('bjj_points' / 'jiujitsu'): true (Com Quimono / Gi, compatível com os torneios CBJJ/IBJJF originais)
 */
export function resolveTournamentIsGi(
  tournament: Tournament,
  entry?: Pick<CharacterTournamentEntry, 'isGi'>
): boolean {
  if (typeof entry?.isGi === 'boolean') {
    return entry.isGi;
  }
  if (typeof tournament?.isGi === 'boolean') {
    return tournament.isGi;
  }
  if (tournament?.rulesType === 'lutalivre_sub' || tournament?.rulesType === 'mma_unified') {
    return false;
  }
  return true;
}

/**
 * Determina o ano oficial de realização do torneio:
 * 1. targetYear explícito (se fornecido na consulta/visualização)
 * 2. yearScheduled do torneio se for ano de calendário válido (>= 1900)
 * 3. Ano corrente do jogo por padrão
 */
export function getTournamentYear(
  tournament: Tournament,
  currentDate: GameDate,
  targetYear?: number
): number {
  if (typeof targetYear === 'number') {
    return targetYear;
  }
  if (tournament.yearScheduled && tournament.yearScheduled >= 1900) {
    return tournament.yearScheduled;
  }
  return currentDate.year;
}

/**
 * Retorna as datas cronológicas do campeonato para um ano específico:
 * - Abertura das inscrições (dia 01 do mês programado por padrão ou registrationOpenDay)
 * - Prazo limite de inscrição (registrationDeadlineDay ou fightDay - 3)
 * - Data da pesagem oficial (weighInDay ou fightDay - 1)
 * - Data oficial da disputa dos combates (dayScheduled ou 7/14/21/28 conforme semana)
 */
export function getTournamentScheduleDates(
  tournament: Tournament,
  year: number
): {
  registrationOpenDate: GameDate;
  scheduledDate: GameDate;
  weighInDate: GameDate;
  deadlineDate: GameDate;
  month: number;
} {
  const month = tournament.monthScheduled ?? (((tournament.weekScheduled - 1) % 12) + 1);

  let defaultFightDay = 7;
  if (tournament.weekScheduled === 2) defaultFightDay = 14;
  if (tournament.weekScheduled === 3) defaultFightDay = 21;
  if (tournament.weekScheduled === 4) defaultFightDay = 28;

  const fightDay = tournament.dayScheduled ?? defaultFightDay;
  const weighInDay = tournament.weighInDay ?? Math.max(1, fightDay - 1);
  const deadlineDay = tournament.registrationDeadlineDay ?? Math.max(1, Math.min(weighInDay - 1, fightDay - 3));
  const openDay = Math.max(1, Math.min(deadlineDay, tournament.registrationOpenDay ?? 1));

  return {
    month,
    registrationOpenDate: { day: openDay, month, year },
    deadlineDate: { day: deadlineDay, month, year },
    weighInDate: { day: weighInDay, month, year },
    scheduledDate: { day: fightDay, month, year }
  };
}

export interface WeighInValidationResult {
  canPassWeighIn: boolean;
  status: 'aprovado' | 'acima_do_peso' | 'abaixo_do_peso' | 'quimono_irregular' | 'dados_insuficientes';
  message: string;
  athleteWeight: number;
  giWeightKg: number;
  scaleWeightKg: number;
  targetWeight: number | null;
  tolerance: number;
  weightClass?: string;
  differenceKg: number;
  giColor?: string;
  giColorValid: boolean;
  zeroTolerance: boolean;
}

/**
 * Validação rigorosa e transparente da pesagem oficial:
 * - No Jiu-Jitsu (CBJJ/IBJJF) com quimono: pesa o atleta vestindo o quimono (+1,80 kg),
 *   com tolerância ZERO (0,00 kg) e cor permitida estritamente Branco, Azul ou Preto.
 * - Sem seleção explícita de divisão, valida contra os parâmetros padrão do torneio.
 */
export function validateWeighIn(
  character: Character,
  tournament: Tournament,
  selection?: TournamentDivisionSelection
): WeighInValidationResult {
  const athleteWeight = character?.weight;
  const isGi = resolveTournamentIsGi(tournament);
  const isBjj = tournament.art === 'jiujitsu';
  const giWeightKg = isBjj && isGi ? CBJJ_OFFICIAL_GI_WEIGHT_KG : 0;
  const zeroTolerance = isBjj || tournament.scope === 'mundial' || tournament.scope === 'mma_pro';

  const hasExplicitDivision =
    selection !== undefined &&
    (selection.weightDivisionId !== undefined ||
      selection.maxWeightKg !== undefined ||
      selection.weightClassLabel !== undefined);

  const fallbackTarget = tournament?.targetWeight;

  if (
    typeof athleteWeight !== 'number' ||
    isNaN(athleteWeight) ||
    athleteWeight <= 0 ||
    (!hasExplicitDivision && (typeof fallbackTarget !== 'number' || isNaN(fallbackTarget) || fallbackTarget <= 0))
  ) {
    return {
      canPassWeighIn: false,
      status: 'dados_insuficientes',
      message: 'Impossível determinar a elegibilidade: dados biométricos de peso incompletos ou inválidos.',
      athleteWeight: athleteWeight || 0,
      giWeightKg,
      scaleWeightKg: athleteWeight || 0,
      targetWeight: fallbackTarget || 0,
      tolerance: 0,
      differenceKg: 0,
      giColorValid: true,
      zeroTolerance
    };
  }

  // Validação de cor oficial do quimono na CBJJ/IBJJF (Branco, Azul ou Preto)
  const requestedGiColor = selection?.giColor;
  if (isBjj && isGi && requestedGiColor && !isValidOfficialGiColor(requestedGiColor)) {
    return {
      canPassWeighIn: false,
      status: 'quimono_irregular',
      message: `Quimono irregular (${requestedGiColor}): a CBJJ/IBJJF permite apenas quimono branco, azul ou preto dentro das medidas oficiais.`,
      athleteWeight,
      giWeightKg,
      scaleWeightKg: Math.round((athleteWeight + giWeightKg) * 100) / 100,
      targetWeight: hasExplicitDivision ? (selection?.maxWeightKg ?? null) : fallbackTarget,
      tolerance: 0,
      weightClass: selection?.weightClassLabel || tournament.weightClass,
      differenceKg: 0,
      giColor: requestedGiColor,
      giColorValid: false,
      zeroTolerance: true
    };
  }

  const giColor = isBjj && isGi ? (requestedGiColor || 'branco') : undefined;
  const scaleWeightKg = Math.round((athleteWeight + giWeightKg) * 100) / 100;

  let targetWeight: number | null;
  let minWeight: number;
  let divisionLabel: string;
  let tolerance: number;

  if (hasExplicitDivision) {
    targetWeight = selection?.maxWeightKg === undefined ? fallbackTarget : selection.maxWeightKg;
    minWeight = selection?.minWeightKg ?? 0;
    divisionLabel = selection?.weightClassLabel || tournament.weightClass;
    tolerance = isBjj ? 0 : zeroTolerance ? 0 : 0.5;
  } else {
    targetWeight = fallbackTarget;
    const weightClassDef = WEIGHT_CLASSES.find((w) => w.name === tournament.weightClass);
    minWeight = weightClassDef?.minWeight ?? 0;
    divisionLabel = tournament.weightClass;
    tolerance = isBjj ? 0 : 0.6;
  }

  const maxAllowed = targetWeight !== null ? Math.round((targetWeight + tolerance) * 100) / 100 : null;
  const differenceKg = targetWeight !== null ? Math.round((scaleWeightKg - targetWeight) * 100) / 100 : 0;

  if (maxAllowed !== null && scaleWeightKg > maxAllowed) {
    const scaleDetail = isBjj && isGi
      ? `${athleteWeight.toFixed(2).replace('.', ',')} kg + ${giWeightKg.toFixed(2).replace('.', ',')} kg (quimono ${getGiColorLabel(giColor).toLowerCase()}) = ${scaleWeightKg.toFixed(2).replace('.', ',')} kg`
      : `${scaleWeightKg.toFixed(2).replace('.', ',')} kg`;
    const toleranceNote = isBjj
      ? 'Tolerância ZERO na CBJJ/IBJJF — passou do limite é desclassificação imediata.'
      : `Limite máximo com tolerância: ${maxAllowed.toFixed(2).replace('.', ',')} kg.`;

    return {
      canPassWeighIn: false,
      status: 'acima_do_peso',
      message: `Peso acima do teto da categoria ${divisionLabel}: balança aferiu ${scaleDetail} (+${differenceKg.toFixed(2).replace('.', ',')} kg acima de ${targetWeight!.toFixed(2).replace('.', ',')} kg). ${toleranceNote}`,
      athleteWeight,
      giWeightKg,
      scaleWeightKg,
      targetWeight,
      tolerance,
      weightClass: divisionLabel,
      differenceKg,
      giColor,
      giColorValid: true,
      zeroTolerance
    };
  }

  if (minWeight > 0 && scaleWeightKg < minWeight) {
    return {
      canPassWeighIn: false,
      status: 'abaixo_do_peso',
      message: `Fora dos parâmetros da categoria ${divisionLabel}: peso na balança (${scaleWeightKg.toFixed(2).replace('.', ',')} kg) está abaixo do piso da divisão (${minWeight.toFixed(2).replace('.', ',')} kg).`,
      athleteWeight,
      giWeightKg,
      scaleWeightKg,
      targetWeight,
      tolerance,
      weightClass: divisionLabel,
      differenceKg,
      giColor,
      giColorValid: true,
      zeroTolerance
    };
  }

  const weightSummary = isBjj && isGi
    ? `${athleteWeight.toFixed(2).replace('.', ',')} kg + ${giWeightKg.toFixed(2).replace('.', ',')} kg quimono ${getGiColorLabel(giColor).toLowerCase()} = ${scaleWeightKg.toFixed(2).replace('.', ',')} kg`
    : `${scaleWeightKg.toFixed(2).replace('.', ',')} kg`;
  const limitSummary = targetWeight === null
    ? 'Sem limite máximo'
    : `teto ${targetWeight.toFixed(2).replace('.', ',')} kg${tolerance > 0 ? ` + ${tolerance.toFixed(1)} kg` : ' (tolerância zero)'}`;

  return {
    canPassWeighIn: true,
    status: 'aprovado',
    message: `Pesagem oficial homologada! Balança aferiu ${weightSummary} na categoria ${divisionLabel} (${limitSummary}).`,
    athleteWeight,
    giWeightKg,
    scaleWeightKg,
    targetWeight,
    tolerance,
    weightClass: divisionLabel,
    differenceKg,
    giColor,
    giColorValid: true,
    zeroTolerance
  };
}

export interface TournamentEligibilityResult {
  eligible: boolean;
  reasons: string[];
  realAge: number;
  ageCategory: AgeCategory;
  rankIndex: number;
  requiredMinRankIndex: number;
  weightValidation: WeighInValidationResult;
  isGi: boolean;
  availableOnDate: boolean;
  geography: TournamentGeographyEvaluation;
  resolvedDivision: ResolvedTournamentDivision;
}

/**
 * Validação simultânea e completa de elegibilidade para inscrição, pesagem, formação de chave e início do combate:
 * - Idade real calculada via data de nascimento + data atual do jogo (sem confiar em character.age desatualizado)
 * - Categoria etária e restrições de idade do campeonato
 * - Graduação atual na arte do torneio (e limite mínimo/máximo do campeonato)
 * - Peso real vs tabela oficial de categorias (WEIGHT_CLASSES) sem alteração artificial
 * - Modalidade Gi / No-Gi compatível
 * - Disponibilidade física e de calendário do atleta na data do evento
 */
export function validateTournamentEligibility(
  character: Character,
  tournament: Tournament,
  targetYear?: number,
  selection?: TournamentDivisionSelection
): TournamentEligibilityResult {
  const reasons: string[] = [];
  const tournamentYear = getTournamentYear(tournament, character.currentDate, targetYear);
  const realAge = getRealAthleteAge(character);
  const ageCategory = getAgeCategoryFromAge(realAge);
  const isGi = resolveTournamentIsGi(tournament);
  const resolvedDivision = resolveTournamentDivisionForCharacter(character, tournament, tournamentYear, selection);

  // 1. Idade real & categoria etária
  // Regra padrão documentada: idade mínima absoluta de 4 anos (CBJJ Branca minAge) e >= 18 para MMA Pro
  const minRequiredAge = tournament.minAge ?? (tournament.scope === 'mma_pro' ? 18 : 4);
  const ageForMinCheck = tournament.art === 'jiujitsu' && !tournament.minAge && !tournament.allowedAgeCategories
    ? Math.max(realAge, resolvedDivision.competitionAge)
    : realAge;
  if (ageForMinCheck < minRequiredAge) {
    reasons.push(
      `Idade incompatível: atleta possui ${ageForMinCheck} anos (mínimo exigido para esta competição: ${minRequiredAge} anos).`
    );
  }
  if (tournament.maxAge !== undefined && realAge > tournament.maxAge) {
    reasons.push(
      `Idade real acima do limite: atleta possui ${realAge} anos (máximo permitido: ${tournament.maxAge} anos).`
    );
  }
  if (tournament.allowedAgeCategories && tournament.allowedAgeCategories.length > 0) {
    if (!tournament.allowedAgeCategories.includes(ageCategory)) {
      reasons.push(
        `Categoria etária incompatível: atleta é '${ageCategory}' (${realAge} anos), mas o torneio exige [${tournament.allowedAgeCategories.join(', ')}].`
      );
    }
  } else if (tournament.scope === 'mma_pro' && ageCategory !== 'adulto' && ageCategory !== 'master') {
    reasons.push(
      `Categoria etária incompatível: competições MMA Pro exigem categoria adulto ou master (18+ anos; atleta tem ${realAge} anos).`
    );
  }

  // 2. Graduação atual na arte do torneio
  const artMeta = MARTIAL_ARTS_META[tournament.art];
  const grad = character.artGraduations?.[tournament.art];
  const rankIndex = grad?.rankIndex ?? 0;

  if (!grad) {
    reasons.push(`Atleta não possui registro de graduação em ${artMeta?.name || tournament.art}.`);
  } else {
    if (rankIndex < tournament.minRankIndex) {
      const reqRankName = artMeta?.ranks[tournament.minRankIndex]?.name || `Faixa ${tournament.minRankIndex + 1}`;
      reasons.push(
        `Graduação insuficiente: exige no mínimo ${reqRankName} (atual: ${grad.name}).`
      );
    }
    if (tournament.maxRankIndex !== undefined && rankIndex > tournament.maxRankIndex) {
      const maxRankName = artMeta?.ranks[tournament.maxRankIndex]?.name || `Faixa ${tournament.maxRankIndex + 1}`;
      reasons.push(
        `Graduação acima do teto da categoria: máximo permitido ${maxRankName} (atual: ${grad.name}).`
      );
    }
    // Verifica coerência mínima de idade da faixa cadastrada quando aplicável
    const rankDef = artMeta?.ranks[rankIndex];
    const ageForRankCheck = tournament.art === 'jiujitsu' ? Math.max(realAge, resolvedDivision.competitionAge) : realAge;
    if (rankDef?.minAge !== undefined && ageForRankCheck < rankDef.minAge) {
      reasons.push(
        `Inconsistência regulatória: graduação atual (${grad.name}) exige idade mínima de ${rankDef.minAge} anos (idade: ${ageForRankCheck}).`
      );
    }
  }

  // 3. Peso real (+ quimono no BJJ Gi) vs categoria selecionada ou padrão
  const weightValidation = validateWeighIn(character, tournament, selection);
  if (!weightValidation.canPassWeighIn) {
    reasons.push(weightValidation.message);
  }

  // 4. Disponibilidade na data do evento
  let availableOnDate = true;

  if (character.isAlive === false) {
    availableOnDate = false;
    reasons.push('Atleta inativo no memorial de carreira.');
  }

  const graveInjury = (character.injuries || []).find(
    (inj) => inj.severity === 'grave' && inj.weeksRemaining > 0
  );
  if (graveInjury) {
    availableOnDate = false;
    reasons.push(
      `Indisponibilidade médica: lesão grave ativa (${graveInjury.name}, ${graveInjury.weeksRemaining} sem. restantes).`
    );
  }

  if (typeof character.energy === 'number' && character.energy <= 0) {
    availableOnDate = false;
    reasons.push('Atleta sem condição física mínima (energia zerada) para competir.');
  }

  const dates = getTournamentScheduleDates(tournament, tournamentYear);
  const conflictOtherTournament = (character.tournamentHistory || []).find(
    (h) =>
      h.tournamentId !== tournament.id &&
      h.year === tournamentYear &&
      h.month === dates.month &&
      ((h.activeMatchSession && h.activeMatchSession.status === 'em_andamento') ||
        (h.activeBoxingMatchSession && h.activeBoxingMatchSession.status === 'em_andamento'))
  );
  if (conflictOtherTournament) {
    availableOnDate = false;
    reasons.push(
      `Indisponibilidade na data: combate em andamento simultâneo em outro campeonato (${conflictOtherTournament.tournamentId}).`
    );
  }

  // 5. Geografia, abrangência territorial e autorização de viagem
  const geography = evaluateTournamentGeographyAndTravel(character, tournament);
  if (!geography.territoriallyEligible) {
    reasons.push(...geography.reasons);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    realAge,
    ageCategory,
    rankIndex,
    requiredMinRankIndex: tournament.minRankIndex,
    weightValidation,
    isGi,
    availableOnDate,
    geography,
    resolvedDivision
  };
}

export interface TournamentTimelineInfo {
  status: TournamentTemporalStatus;
  statusLabel: string;
  statusDescription: string;
  badgeColor: string;
  canRegister: boolean;
  canWeighIn: boolean;
  canFight: boolean;
  canAdvanceToWeighInDay: boolean;
  canAdvanceToFightDay: boolean;
  isCompleted: boolean;
  isPast: boolean;
  isFuture: boolean;
  isCurrentMonth: boolean;
  tournamentYear: number;
  historyEntry?: CharacterTournamentEntry;
  registrationOpenDate: GameDate;
  scheduledDate: GameDate;
  weighInDate: GameDate;
  deadlineDate: GameDate;
}

/**
 * Avalia o estado temporal exato de um campeonato na linha do tempo do jogo.
 * Fluxo cronológico obrigatório:
 * 1. Abertura das inscrições -> 2. Inscrição -> 3. Encerramento das inscrições ->
 * 4. Pesagem na data programada -> 5. Homologação da categoria ->
 * 6. Realização do campeonato na data oficial -> 7. Encerramento e classificação.
 */
export function getTournamentTimelineInfo(
  tournament: Tournament,
  currentDate: GameDate,
  character: Character,
  targetYear?: number
): TournamentTimelineInfo {
  const tournamentYear = getTournamentYear(tournament, currentDate, targetYear);
  const dates = getTournamentScheduleDates(tournament, tournamentYear);
  const tMonth = dates.month;

  const historyEntry = character.tournamentHistory?.find(
    (h) => h.tournamentId === tournament.id && h.year === tournamentYear
  );

  const baseDates = {
    registrationOpenDate: dates.registrationOpenDate,
    scheduledDate: dates.scheduledDate,
    weighInDate: dates.weighInDate,
    deadlineDate: dates.deadlineDate
  };

  // 1. Já concluído nesta temporada
  if (historyEntry?.completed) {
    const resultText = historyEntry.disqualifiedReason
      ? `Desclassificado na Balança ⚖️`
      : historyEntry.result === 'vitoria'
      ? 'Campeão Ouro 🥇'
      : historyEntry.result === 'empate'
      ? 'Empate ⚖️'
      : 'Participação / Derrota 🥋';

    return {
      status: 'concluida',
      statusLabel: historyEntry.disqualifiedReason ? 'Desclassificado na Pesagem' : 'Concluído nesta Temporada',
      statusDescription: historyEntry.disqualifiedReason
        ? `${historyEntry.disqualifiedReason} Nova participação liberada apenas na próxima edição.`
        : `Você já disputou este torneio em ${MONTH_NAMES[tMonth - 1]} de ${tournamentYear} (${resultText}). Nova edição apenas no próximo ano civil.`,
      badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      canRegister: false,
      canWeighIn: false,
      canFight: false,
      canAdvanceToWeighInDay: false,
      canAdvanceToFightDay: false,
      isCompleted: true,
      isPast: false,
      isFuture: false,
      isCurrentMonth: currentDate.year === tournamentYear && currentDate.month === tMonth,
      tournamentYear,
      historyEntry,
      ...baseDates
    };
  }

  // 2. Ano futuro relativo à data atual do jogo
  if (currentDate.year < tournamentYear) {
    return {
      status: 'futura',
      statusLabel: `Programado para ${MONTH_NAMES[tMonth - 1]} de ${tournamentYear}`,
      statusDescription: `Edição futura agendada para ${MONTH_NAMES[tMonth - 1]} de ${tournamentYear}. As inscrições oficiais abrirão no dia ${dates.registrationOpenDate.day}/${tMonth}.`,
      badgeColor: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
      canRegister: false,
      canWeighIn: false,
      canFight: false,
      canAdvanceToWeighInDay: false,
      canAdvanceToFightDay: false,
      isCompleted: false,
      isPast: false,
      isFuture: true,
      isCurrentMonth: false,
      tournamentYear,
      historyEntry,
      ...baseDates
    };
  }

  // 3. Ano passado relativo à data atual do jogo
  if (currentDate.year > tournamentYear) {
    return {
      status: 'encerrada',
      statusLabel: `Edição de ${tournamentYear} Encerrada`,
      statusDescription: `A temporada de ${tournamentYear} já foi concluída no calendário civil. Acompanhe o calendário para a edição vigente.`,
      badgeColor: 'bg-neutral-800 text-neutral-400 border border-neutral-700',
      canRegister: false,
      canWeighIn: false,
      canFight: false,
      canAdvanceToWeighInDay: false,
      canAdvanceToFightDay: false,
      isCompleted: false,
      isPast: true,
      isFuture: false,
      isCurrentMonth: false,
      tournamentYear,
      historyEntry,
      ...baseDates
    };
  }

  // 4. Mesmo ano civil corrente (currentDate.year === tournamentYear)
  // 4A. Mês futuro
  if (currentDate.month < tMonth) {
    return {
      status: 'futura',
      statusLabel: `Programado para ${MONTH_NAMES[tMonth - 1]}`,
      statusDescription: `Evento esportivo agendado para ${MONTH_NAMES[tMonth - 1]} de ${tournamentYear}. Inscrições abrem em ${dates.registrationOpenDate.day}/${tMonth}.`,
      badgeColor: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
      canRegister: false,
      canWeighIn: false,
      canFight: false,
      canAdvanceToWeighInDay: false,
      canAdvanceToFightDay: false,
      isCompleted: false,
      isPast: false,
      isFuture: true,
      isCurrentMonth: false,
      tournamentYear,
      historyEntry,
      ...baseDates
    };
  }

  // 4B. Mês passado (edição deste ano já expirou)
  if (currentDate.month > tMonth) {
    return {
      status: 'encerrada',
      statusLabel: `Edição de ${MONTH_NAMES[tMonth - 1]} Encerrada`,
      statusDescription: `O prazo desta competição expirou no calendário de ${tournamentYear}. Acompanhe o calendário para a próxima temporada esportiva.`,
      badgeColor: 'bg-neutral-800 text-neutral-400 border border-neutral-700',
      canRegister: false,
      canWeighIn: false,
      canFight: false,
      canAdvanceToWeighInDay: false,
      canAdvanceToFightDay: false,
      isCompleted: false,
      isPast: true,
      isFuture: false,
      isCurrentMonth: false,
      tournamentYear,
      historyEntry,
      ...baseDates
    };
  }

  // 4C. Mês atual do jogo (currentDate.year === tournamentYear && currentDate.month === tMonth)
  const isCurrentMonth = true;

  // Se o dia da disputa já passou neste mês e o campeonato não foi concluído -> expirado
  if (currentDate.day > dates.scheduledDate.day) {
    return {
      status: 'encerrada',
      statusLabel: 'Data do Evento Expirada',
      statusDescription: `A disputa oficial deste campeonato ocorreu no dia ${dates.scheduledDate.day} de ${MONTH_NAMES[tMonth - 1]} e foi encerrada nesta temporada.`,
      badgeColor: 'bg-neutral-800 text-neutral-400 border border-neutral-700',
      canRegister: false,
      canWeighIn: false,
      canFight: false,
      canAdvanceToWeighInDay: false,
      canAdvanceToFightDay: false,
      isCompleted: false,
      isPast: true,
      isFuture: false,
      isCurrentMonth,
      tournamentYear,
      historyEntry,
      ...baseDates
    };
  }

  // Subcaso 4C-1: Atleta inscrito com pesagem homologada
  if (historyEntry?.registered && historyEntry.weighInPassed) {
    // Antes do dia oficial da luta: combate ainda não liberado
    if (currentDate.day < dates.scheduledDate.day) {
      return {
        status: 'pesagem_aprovada',
        statusLabel: `Pesagem Aprovada • Luta Dia ${dates.scheduledDate.day}`,
        statusDescription: `Peso aferido e categoria homologada! O campeonato oficial ocorre no dia ${dates.scheduledDate.day} de ${MONTH_NAMES[tMonth - 1]}.`,
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
        canRegister: false,
        canWeighIn: false,
        canFight: false,
        canAdvanceToWeighInDay: false,
        canAdvanceToFightDay: true,
        isCompleted: false,
        isPast: false,
        isFuture: false,
        isCurrentMonth,
        tournamentYear,
        historyEntry,
        ...baseDates
      };
    }

    // No dia exato do campeonato (currentDate.day === dates.scheduledDate.day)
    const isInProgress =
      historyEntry.activeMatchSession?.status === 'em_andamento' ||
      historyEntry.activeBoxingMatchSession?.status === 'em_andamento';
    return {
      status: isInProgress ? 'em_disputa' : 'pesagem_aprovada',
      statusLabel: isInProgress
        ? tournament.art === 'boxe' || tournament.rulesType === 'boxing_10must'
          ? 'Luta em Andamento • Retomar Ringue'
          : 'Combate em Andamento • Retomar Tatame'
        : 'Dia da Competição • Liberado para Lutar',
      statusDescription: isInProgress
        ? `Você possui um confronto em andamento nesta chave. Retome o combate sem perder sua pontuação.`
        : `Pesagem homologada e categoria oficializada! Suba ao tatame hoje (${dates.scheduledDate.day}/${tMonth}).`,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
      canRegister: false,
      canWeighIn: false,
      canFight: true,
      canAdvanceToWeighInDay: false,
      canAdvanceToFightDay: false,
      isCompleted: false,
      isPast: false,
      isFuture: false,
      isCurrentMonth,
      tournamentYear,
      historyEntry,
      ...baseDates
    };
  }

  // Subcaso 4C-2: Atleta inscrito, pesagem ainda pendente
  if (historyEntry?.registered && !historyEntry.weighInPassed) {
    // Antes da data programada da pesagem: não pode pesar antecipadamente
    if (currentDate.day < dates.weighInDate.day) {
      return {
        status: 'inscrito',
        statusLabel: `Inscrito • Pesagem Dia ${dates.weighInDate.day}`,
        statusDescription: `Inscrição confirmada! A pesagem oficial abrirá somente na data programada (dia ${dates.weighInDate.day} de ${MONTH_NAMES[tMonth - 1]}).`,
        badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
        canRegister: false,
        canWeighIn: false,
        canFight: false,
        canAdvanceToWeighInDay: true,
        canAdvanceToFightDay: false,
        isCompleted: false,
        isPast: false,
        isFuture: false,
        isCurrentMonth,
        tournamentYear,
        historyEntry,
        ...baseDates
      };
    }

    // Na data exata da pesagem: liberado para pesagem
    if (currentDate.day === dates.weighInDate.day) {
      const limitLabel =
        historyEntry.weightMaxKg === null
          ? 'Sem limite máximo'
          : `até ${(historyEntry.weightMaxKg ?? tournament.targetWeight).toFixed(2).replace('.', ',')} kg`;
      const giNote =
        tournament.art === 'jiujitsu' && resolveTournamentIsGi(tournament, historyEntry)
          ? ' vestindo o quimono (tolerância zero)'
          : '';
      return {
        status: 'inscrito',
        statusLabel: 'Pesagem Oficial Hoje • Obrigatória',
        statusDescription: `Compareça à balança hoje (dia ${dates.weighInDate.day}) para bater ${limitLabel}${giNote} e homologar sua categoria.`,
        badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
        canRegister: false,
        canWeighIn: true,
        canFight: false,
        canAdvanceToWeighInDay: false,
        canAdvanceToFightDay: false,
        isCompleted: false,
        isPast: false,
        isFuture: false,
        isCurrentMonth,
        tournamentYear,
        historyEntry,
        ...baseDates
      };
    }

    // Passou do prazo da pesagem (currentDate.day > dates.weighInDate.day) sem homologar
    return {
      status: 'encerrada',
      statusLabel: 'Prazo de Pesagem Encerrado',
      statusDescription: `A pesagem oficial ocorreu no dia ${dates.weighInDate.day} de ${MONTH_NAMES[tMonth - 1]}. Sem homologação na balança, o atleta fica impedido de competir.`,
      badgeColor: 'bg-red-500/15 text-red-400 border border-red-500/30',
      canRegister: false,
      canWeighIn: false,
      canFight: false,
      canAdvanceToWeighInDay: false,
      canAdvanceToFightDay: false,
      isCompleted: false,
      isPast: true,
      isFuture: false,
      isCurrentMonth,
      tournamentYear,
      historyEntry,
      ...baseDates
    };
  }

  // Subcaso 4C-3: Não inscrito ainda
  if (currentDate.day < dates.registrationOpenDate.day) {
    return {
      status: 'futura',
      statusLabel: `Inscrições Abrem Dia ${dates.registrationOpenDate.day}`,
      statusDescription: `As inscrições oficiais desta competição abrem apenas no dia ${dates.registrationOpenDate.day} de ${MONTH_NAMES[tMonth - 1]}.`,
      badgeColor: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
      canRegister: false,
      canWeighIn: false,
      canFight: false,
      canAdvanceToWeighInDay: false,
      canAdvanceToFightDay: false,
      isCompleted: false,
      isPast: false,
      isFuture: true,
      isCurrentMonth,
      tournamentYear,
      historyEntry,
      ...baseDates
    };
  }

  if (currentDate.day > dates.deadlineDate.day) {
    return {
      status: 'encerrada',
      statusLabel: 'Inscrições Encerradas',
      statusDescription: `O prazo de homologação de inscrições encerrou-se no dia ${dates.deadlineDate.day} de ${MONTH_NAMES[tMonth - 1]}. Não é mais possível ingressar nesta edição.`,
      badgeColor: 'bg-neutral-800 text-neutral-400 border border-neutral-700',
      canRegister: false,
      canWeighIn: false,
      canFight: false,
      canAdvanceToWeighInDay: false,
      canAdvanceToFightDay: false,
      isCompleted: false,
      isPast: true,
      isFuture: false,
      isCurrentMonth,
      tournamentYear,
      historyEntry,
      ...baseDates
    };
  }

  // Subcaso 4C-4: Inscrições abertas dentro do prazo
  return {
    status: 'inscricoes_abertas',
    statusLabel: 'Inscrições Abertas',
    statusDescription: `Inscrições oficiais abertas de ${dates.registrationOpenDate.day}/${tMonth} até ${dates.deadlineDate.day}/${tMonth}! Taxa: ${
      tournament.entryFee === 0 ? 'GRÁTIS (CONVITE)' : `R$ ${tournament.entryFee}`
    }.`,
    badgeColor: 'bg-amber-500/25 text-amber-300 border border-amber-500/50 animate-pulse',
    canRegister: true,
    canWeighIn: false,
    canFight: false,
    canAdvanceToWeighInDay: false,
    canAdvanceToFightDay: false,
    isCompleted: false,
    isPast: false,
    isFuture: false,
    isCurrentMonth,
    tournamentYear,
    historyEntry,
    ...baseDates
  };
}

