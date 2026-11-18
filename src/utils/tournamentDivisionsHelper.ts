import {
  Character,
  MartialArtType,
  OfficialGiColor,
  Tournament,
  TournamentDivisionSelection
} from '../types/game';
import {
  ART_AGE_DIVISIONS,
  BJJ_ADULT_MASTER_F_GI,
  BJJ_ADULT_MASTER_F_NOGI,
  BJJ_ADULT_MASTER_M_GI,
  BJJ_ADULT_MASTER_M_NOGI,
  BJJ_AGE_DIVISIONS,
  BJJ_JUVENIL_F_GI,
  BJJ_JUVENIL_F_NOGI,
  BJJ_JUVENIL_M_GI,
  BJJ_JUVENIL_M_NOGI,
  BJJ_KIDS_TABLES_GI,
  CAPOEIRA_F_ADULT,
  CAPOEIRA_M_ADULT,
  CBJJ_OFFICIAL_GI_WEIGHT_KG,
  DivisionWeightOption,
  GENERIC_YOUTH_WEIGHTS,
  JUDO_F_SENIOR,
  JUDO_M_SENIOR,
  KARATE_F_SENIOR,
  KARATE_M_SENIOR,
  SportAgeDivision,
  STRIKING_MMA_F_ADULT,
  STRIKING_MMA_M_ADULT
} from '../data/tournamentDivisionsData';
import { MARTIAL_ARTS_META } from '../data/martialArtsData';
import { calculateAge } from './dateUtils';

export interface ResolvedTournamentDivision {
  sex: 'M' | 'F';
  sexLabel: 'Masculino' | 'Feminino';
  competitionAge: number;
  ageCalculationNote: string;
  ageDivision: SportAgeDivision;
  rankDivisionId: string;
  rankDivisionLabel: string;
  weightOptions: DivisionWeightOption[];
  selectedWeight: DivisionWeightOption;
  recommendedWeight: DivisionWeightOption;
  isGi: boolean;
  giColor?: OfficialGiColor;
  giColorValid: boolean;
  giWeightKg: number;
  scaleWeightKg: number;
  toleranceKg: number;
  effectiveMatchDurationSeconds: number;
  summaryLabel: string;
}

export function isValidOfficialGiColor(color?: string): color is OfficialGiColor {
  return color === 'branco' || color === 'azul' || color === 'preto';
}

export function getGiColorLabel(color?: string): string {
  if (color === 'branco') return 'Branco';
  if (color === 'azul') return 'Azul';
  if (color === 'preto') return 'Preto';
  return 'Cor Não Oficial';
}

/**
 * Calcula a idade de inscrição no campeonato:
 * - CBJJ / Jiu-Jitsu: (Ano do campeonato - Ano de nascimento) conforme regra oficial IBJJF/CBJJ.
 * - Demais artes: idade civil atual calculada via data de nascimento.
 */
export function getCompetitionAge(
  character: Pick<Character, 'age' | 'birthDate' | 'currentDate'>,
  art: MartialArtType,
  tournamentYear: number
): number {
  if (art === 'jiujitsu' && character.birthDate?.year) {
    return Math.max(0, tournamentYear - character.birthDate.year);
  }
  if (character.birthDate && character.currentDate) {
    return calculateAge(character.birthDate, character.currentDate);
  }
  return Math.max(0, Number(character.age) || 0);
}

export function resolveSportAgeDivision(art: MartialArtType, age: number): SportAgeDivision {
  const table = art === 'jiujitsu' ? BJJ_AGE_DIVISIONS : ART_AGE_DIVISIONS[art];
  for (const div of table) {
    if (age >= div.minAge && (div.maxAge === null || age <= div.maxAge)) {
      return div;
    }
  }
  if (age < table[0].minAge) return table[0];
  return table[table.length - 1];
}

export function resolveArtRankDivision(
  art: MartialArtType,
  rankIndex: number,
  _competitionAge: number
): { rankDivisionId: string; rankDivisionLabel: string } {
  const ranks = MARTIAL_ARTS_META[art]?.ranks || [];
  const safeIdx = Math.max(0, Math.min(rankIndex, ranks.length - 1));
  const rawName = ranks[safeIdx]?.name || 'Iniciante';

  if (art === 'jiujitsu') {
    if (safeIdx >= 8) return { rankDivisionId: 'bjj_preta', rankDivisionLabel: 'Faixa Preta' };
    if (safeIdx === 7) return { rankDivisionId: 'bjj_marrom', rankDivisionLabel: 'Faixa Marrom' };
    if (safeIdx === 6) return { rankDivisionId: 'bjj_roxa', rankDivisionLabel: 'Faixa Roxa' };
    if (safeIdx === 5) return { rankDivisionId: 'bjj_azul', rankDivisionLabel: 'Faixa Azul' };
    if (safeIdx === 4) return { rankDivisionId: 'bjj_verde', rankDivisionLabel: 'Faixa Verde' };
    if (safeIdx === 3) return { rankDivisionId: 'bjj_laranja', rankDivisionLabel: 'Faixa Laranja' };
    if (safeIdx === 2) return { rankDivisionId: 'bjj_amarela', rankDivisionLabel: 'Faixa Amarela' };
    if (safeIdx === 1) return { rankDivisionId: 'bjj_cinza', rankDivisionLabel: 'Faixa Cinza' };
    return { rankDivisionId: 'bjj_branca', rankDivisionLabel: 'Faixa Branca' };
  }

  if (art === 'judo' || art === 'karate') {
    if (safeIdx >= 5) return { rankDivisionId: `${art}_dan`, rankDivisionLabel: 'Faixa Preta (Dan)' };
    if (safeIdx >= 3) return { rankDivisionId: `${art}_kyu_adv`, rankDivisionLabel: 'Faixas Graduadas (Kyu Sup.)' };
    return { rankDivisionId: `${art}_kyu_base`, rankDivisionLabel: 'Iniciantes (Kyu Base)' };
  }

  if (art === 'boxe' || art === 'muaythai') {
    if (safeIdx >= 3) return { rankDivisionId: `${art}_pro`, rankDivisionLabel: 'Classe A / Elite' };
    if (safeIdx >= 1) return { rankDivisionId: `${art}_adv`, rankDivisionLabel: 'Classe B / Avançado' };
    return { rankDivisionId: `${art}_est`, rankDivisionLabel: 'Estreante / Iniciante' };
  }

  if (art === 'capoeira') {
    if (safeIdx >= 6) return { rankDivisionId: 'cap_docente', rankDivisionLabel: 'Docentes / Mestres' };
    if (safeIdx >= 3) return { rankDivisionId: 'cap_graduado', rankDivisionLabel: 'Graduados' };
    return { rankDivisionId: 'cap_aluno', rankDivisionLabel: 'Alunos / Iniciação' };
  }

  if (art === 'lutalivre') {
    if (safeIdx >= 4) return { rankDivisionId: 'lle_avancado', rankDivisionLabel: 'Avançado (Roxa–Preta)' };
    if (safeIdx >= 2) return { rankDivisionId: 'lle_intermediario', rankDivisionLabel: 'Intermediário (Laranja–Azul)' };
    return { rankDivisionId: 'lle_iniciante', rankDivisionLabel: 'Iniciante (Branca–Amarela)' };
  }

  if (art === 'mma') {
    if (safeIdx >= 2) return { rankDivisionId: 'mma_pro', rankDivisionLabel: 'MMA Profissional' };
    return { rankDivisionId: 'mma_amador', rankDivisionLabel: `Estreante / ${rawName.split('(')[0].trim()}` };
  }

  return { rankDivisionId: `${art}_rank_${safeIdx}`, rankDivisionLabel: rawName };
}

export function getAvailableWeightDivisions(
  art: MartialArtType,
  ageDivisionId: string,
  gender: 'M' | 'F',
  isGi: boolean
): DivisionWeightOption[] {
  if (art === 'jiujitsu') {
    if (
      ageDivisionId === 'pre_mirim' ||
      ageDivisionId === 'mirim' ||
      ageDivisionId === 'infantil_a' ||
      ageDivisionId === 'infantil_b' ||
      ageDivisionId === 'infanto_juvenil_a' ||
      ageDivisionId === 'infanto_juvenil_b'
    ) {
      const base = BJJ_KIDS_TABLES_GI[ageDivisionId];
      if (isGi) return base;
      // No-Gi Kids ajusta -1.5 kg referente ao peso do quimono infantil
      let prev = 0;
      return base.map((w, i) => {
        const nextMax = w.maxWeight === null ? null : Math.round((w.maxWeight - 1.5) * 100) / 100;
        const minW = i === 0 ? 0 : Math.round((prev + 0.01) * 100) / 100;
        const label =
          nextMax === null
            ? `${w.name} (Sem limite · acima de ${prev.toFixed(2).replace('.', ',')} kg)`
            : `${w.name} (até ${nextMax.toFixed(2).replace('.', ',')} kg)`;
        const displayLimit =
          nextMax === null
            ? `Acima de ${prev.toFixed(2).replace('.', ',')} kg (Sem limite)`
            : `Até ${nextMax.toFixed(2).replace('.', ',')} kg`;
        if (nextMax !== null) prev = nextMax;
        return {
          ...w,
          id: `${w.id}_nogi`,
          minWeight: minW,
          maxWeight: nextMax,
          label,
          displayLimit
        };
      });
    }

    if (ageDivisionId === 'juvenil_1' || ageDivisionId === 'juvenil_2') {
      if (gender === 'F') return isGi ? BJJ_JUVENIL_F_GI : BJJ_JUVENIL_F_NOGI;
      return isGi ? BJJ_JUVENIL_M_GI : BJJ_JUVENIL_M_NOGI;
    }

    // Adulto e Master 1..6+
    if (gender === 'F') return isGi ? BJJ_ADULT_MASTER_F_GI : BJJ_ADULT_MASTER_F_NOGI;
    return isGi ? BJJ_ADULT_MASTER_M_GI : BJJ_ADULT_MASTER_M_NOGI;
  }

  if (art === 'lutalivre') {
    if (ageDivisionId === 'infantil') return GENERIC_YOUTH_WEIGHTS;
    if (ageDivisionId === 'juvenil') return gender === 'F' ? BJJ_JUVENIL_F_NOGI : BJJ_JUVENIL_M_NOGI;
    return gender === 'F' ? BJJ_ADULT_MASTER_F_NOGI : BJJ_ADULT_MASTER_M_NOGI;
  }

  if (art === 'judo') {
    if (ageDivisionId === 'sub_11' || ageDivisionId === 'sub_13' || ageDivisionId === 'sub_15') {
      return GENERIC_YOUTH_WEIGHTS;
    }
    return gender === 'F' ? JUDO_F_SENIOR : JUDO_M_SENIOR;
  }

  if (art === 'karate') {
    if (ageDivisionId === 'sub_12' || ageDivisionId === 'sub_14') {
      return GENERIC_YOUTH_WEIGHTS;
    }
    return gender === 'F' ? KARATE_F_SENIOR : KARATE_M_SENIOR;
  }

  if (art === 'capoeira') {
    if (ageDivisionId === 'mirim_infantil') return GENERIC_YOUTH_WEIGHTS;
    return gender === 'F' ? CAPOEIRA_F_ADULT : CAPOEIRA_M_ADULT;
  }

  // Boxe, Muay Thai, MMA
  if (ageDivisionId === 'infantil' || ageDivisionId === 'cadete' || ageDivisionId === 'kids') {
    return GENERIC_YOUTH_WEIGHTS;
  }
  return gender === 'F' ? STRIKING_MMA_F_ADULT : STRIKING_MMA_M_ADULT;
}

export function getRecommendedWeightDivision(
  options: DivisionWeightOption[],
  scaleWeightKg: number
): DivisionWeightOption {
  for (const opt of options) {
    if (opt.maxWeight === null || scaleWeightKg <= opt.maxWeight) {
      return opt;
    }
  }
  return options[options.length - 1];
}

export function getBjjOfficialMatchDuration(
  ageDivision: SportAgeDivision,
  rankIndex: number,
  fallbackSeconds: number
): number {
  if (ageDivision.id !== 'adulto') {
    return ageDivision.matchDurationSeconds ?? fallbackSeconds;
  }
  // Adulto CBJJ/IBJJF: Branca 5m (300s), Azul 6m (360s), Roxa 7m (420s), Marrom 8m (480s), Preta 10m (600s)
  if (rankIndex >= 8) return 600;
  if (rankIndex === 7) return 480;
  if (rankIndex === 6) return 420;
  if (rankIndex === 5) return 360;
  return 300;
}

export function resolveTournamentDivisionForCharacter(
  character: Character,
  tournament: Tournament,
  targetYear?: number,
  selection?: TournamentDivisionSelection
): ResolvedTournamentDivision {
  const year = targetYear ?? character.currentDate?.year ?? character.currentYear;
  const sex: 'M' | 'F' = selection?.gender ?? character.gender ?? 'M';
  const sexLabel: 'Masculino' | 'Feminino' = sex === 'F' ? 'Feminino' : 'Masculino';

  const isGi =
    tournament.art === 'jiujitsu'
      ? tournament.isGi !== undefined
        ? tournament.isGi
        : tournament.rulesType !== 'lutalivre_sub' && tournament.rulesType !== 'mma_unified'
      : tournament.art === 'judo';

  const competitionAge = getCompetitionAge(character, tournament.art, year);
  const ageDivision = resolveSportAgeDivision(tournament.art, competitionAge);

  const grad = character.artGraduations?.[tournament.art];
  const rankIndex = grad?.rankIndex ?? 0;
  const rankDiv = resolveArtRankDivision(tournament.art, rankIndex, competitionAge);

  const weightOptions = getAvailableWeightDivisions(tournament.art, ageDivision.id, sex, isGi);

  const giWeightKg = tournament.art === 'jiujitsu' && isGi ? CBJJ_OFFICIAL_GI_WEIGHT_KG : 0;
  const rawBodyWeight = typeof character.weight === 'number' && !isNaN(character.weight) ? character.weight : 0;
  const scaleWeightKg = Math.round((rawBodyWeight + giWeightKg) * 100) / 100;
  const toleranceKg =
    tournament.art === 'jiujitsu'
      ? 0
      : tournament.scope === 'mundial' || tournament.scope === 'mma_pro'
      ? 0
      : 0.5;

  const recommendedWeight = getRecommendedWeightDivision(weightOptions, scaleWeightKg);

  let selectedWeight: DivisionWeightOption = recommendedWeight;
  if (selection?.weightDivisionId) {
    const foundById = weightOptions.find((w) => w.id === selection.weightDivisionId);
    if (foundById) selectedWeight = foundById;
  } else if (selection?.weightClassLabel) {
    const foundByLabel = weightOptions.find(
      (w) => w.label === selection.weightClassLabel || w.name === selection.weightClassLabel
    );
    if (foundByLabel) {
      selectedWeight = foundByLabel;
    } else if (selection.minWeightKg !== undefined || selection.maxWeightKg !== undefined) {
      selectedWeight = {
        id: selection.weightDivisionId || 'custom_selected',
        name: selection.weightClassLabel,
        label: selection.weightClassLabel,
        minWeight: selection.minWeightKg ?? 0,
        maxWeight: selection.maxWeightKg ?? null,
        displayLimit:
          selection.maxWeightKg === null || selection.maxWeightKg === undefined
            ? 'Sem limite'
            : `Até ${selection.maxWeightKg.toFixed(2).replace('.', ',')} kg`
      };
    }
  }

  const requestedGiColor = selection?.giColor;
  const giColor: OfficialGiColor | undefined =
    tournament.art === 'jiujitsu' && isGi
      ? isValidOfficialGiColor(requestedGiColor)
        ? requestedGiColor
        : requestedGiColor
        ? undefined
        : 'branco'
      : undefined;
  const giColorValid =
    !(tournament.art === 'jiujitsu' && isGi) ||
    (requestedGiColor ? isValidOfficialGiColor(requestedGiColor) : true);

  const effectiveMatchDurationSeconds =
    tournament.art === 'jiujitsu'
      ? getBjjOfficialMatchDuration(ageDivision, rankIndex, tournament.roundDurationSeconds)
      : tournament.roundDurationSeconds;

  const ageCalculationNote =
    tournament.art === 'jiujitsu'
      ? `CBJJ/IBJJF (${year} − ${character.birthDate?.year ?? year - competitionAge} = ${competitionAge} anos)`
      : `Idade civil (${competitionAge} anos)`;

  const giBadge =
    tournament.art === 'jiujitsu'
      ? isGi
        ? ` • Gi (${getGiColorLabel(giColor)})`
        : ' • No-Gi'
      : '';

  return {
    sex,
    sexLabel,
    competitionAge,
    ageCalculationNote,
    ageDivision,
    rankDivisionId: rankDiv.rankDivisionId,
    rankDivisionLabel: rankDiv.rankDivisionLabel,
    weightOptions,
    selectedWeight,
    recommendedWeight,
    isGi,
    giColor,
    giColorValid,
    giWeightKg,
    scaleWeightKg,
    toleranceKg,
    effectiveMatchDurationSeconds,
    summaryLabel: `${ageDivision.shortLabel} • ${sexLabel} • ${rankDiv.rankDivisionLabel} • ${selectedWeight.label}${giBadge}`
  };
}
