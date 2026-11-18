import { BRAZIL_STATES } from '../data/brazilLocations';
import { WORLD_GYMS } from '../data/martialArtsData';
import { BrazilUF, Character, Gym, GymInstructor, MartialArtType } from '../types/game';
import { getRegionalGymIdsByUf } from '../data/regionalGymsCatalog';

export interface GymTrainingEffectivenessResult {
  offersArt: boolean;
  effectivenessMultiplier: number; // Multiplicador discreto (0.90 a 1.12) por metodologia e infraestrutura
  matchedInstructors: GymInstructor[];
  leadInstructor?: GymInstructor;
  summaryLabel: string;
}

export interface GymScholarshipEvaluation {
  eligible: boolean;
  discountRate: number; // 0 a 0.30
  label?: string;
}

export interface CapitalGymsOverview {
  uf: BrazilUF;
  capital: string;
  stateName: string;
  gyms: Gym[];
  artsOffered: MartialArtType[];
  hasEliteCenter: boolean;
  totalInstructors: number;
  rivalryNotes: string[];
}

/**
 * Verifica formalmente se a academia oferece treinamento e turmas da modalidade.
 * A academia de bairro do jogador atua como base poliesportiva inicial (7 artes).
 */
export function doesGymTeachArt(gym: Pick<Gym, 'id' | 'focusArts'>, art: MartialArtType): boolean {
  if (!gym || !Array.isArray(gym.focusArts) || gym.focusArts.length === 0) {
    return gym?.id === 'gym_bairro';
  }
  return gym.focusArts.includes(art);
}

/**
 * Retorna os instrutores/professores da academia compatíveis com a modalidade (ou especialidade secundária).
 */
export function getGymInstructorsForArt(
  gym: Pick<Gym, 'masterName' | 'instructors' | 'focusArts'>,
  art: MartialArtType
): GymInstructor[] {
  const list = gym.instructors || [];
  const directMatches = list.filter(
    (inst) => inst.specialtyArt === art || inst.secondaryArt === art
  );
  if (directMatches.length > 0) {
    return [...directMatches].sort((a, b) => b.technicalQuality - a.technicalQuality);
  }
  return [...list].sort((a, b) => b.technicalQuality - a.technicalQuality);
}

/**
 * Avalia o impacto real da qualidade do professor e infraestrutura na evolução técnica,
 * mantendo o multiplicador contido (0.90x a 1.12x) para evitar saltos artificiais.
 */
export function getGymTrainingEffectiveness(
  gym: Pick<Gym, 'id' | 'focusArts' | 'instructors' | 'masterName' | 'infrastructureLevel' | 'qualityTier'>,
  art: MartialArtType
): GymTrainingEffectivenessResult {
  const offersArt = doesGymTeachArt(gym, art);
  const instructors = getGymInstructorsForArt(gym, art);
  const directSpecialist = (gym.instructors || []).find(
    (inst) => inst.specialtyArt === art || inst.secondaryArt === art
  );
  const leadInstructor = directSpecialist || instructors[0];

  if (!offersArt) {
    return {
      offersArt: false,
      effectivenessMultiplier: 0.9,
      matchedInstructors: instructors,
      leadInstructor,
      summaryLabel: `${art.toUpperCase()} fora da grade oficial (treino autônomo · 0.90x)`
    };
  }

  const baseDevRate = leadInstructor?.athleteDevelopmentRate ?? 1.0;
  const infraAdj =
    gym.infrastructureLevel === 'olimpica'
      ? 0.02
      : gym.infrastructureLevel === 'alto_rendimento'
      ? 0.01
      : 0;
  const rawMult = baseDevRate + infraAdj;
  // Limite estrito de segurança: nenhum professor concede bônus exagerado
  const effectivenessMultiplier = Math.round(Math.max(0.95, Math.min(1.12, rawMult)) * 100) / 100;

  return {
    offersArt: true,
    effectivenessMultiplier,
    matchedInstructors: instructors,
    leadInstructor,
    summaryLabel: leadInstructor
      ? `${leadInstructor.name} (${leadInstructor.technicalQuality}/100 · ${effectivenessMultiplier.toFixed(2)}x)`
      : `Treino orientado (${effectivenessMultiplier.toFixed(2)}x)`
  };
}

/**
 * Avalia desconto de bolsa esportiva em academias competitivas/de elite mediante mérito real.
 * Não reduz o custo de projetos sociais (já R$ 0) nem concede bolsa sem histórico comprovado.
 */
export function getCompetitiveScholarshipDiscount(
  character: Pick<Character, 'trophies' | 'fame'>,
  gym?: Pick<Gym, 'qualityTier' | 'weeklyCost' | 'scholarshipSupport'>
): GymScholarshipEvaluation {
  if (!gym || (gym.weeklyCost || 0) <= 0) {
    return { eligible: false, discountRate: 0 };
  }

  const trophiesCount = character.trophies?.length || 0;
  const fame = character.fame || 0;

  if (gym.qualityTier === 'elite' && trophiesCount >= 3 && fame >= 250) {
    return {
      eligible: true,
      discountRate: 0.3,
      label: 'Bolsa Atleta Alto Rendimento (-30% mensalidade)'
    };
  }

  if (gym.qualityTier === 'competitiva' && trophiesCount >= 2 && fame >= 120) {
    return {
      eligible: true,
      discountRate: 0.25,
      label: 'Bolsa de Mérito Competitivo (-25% mensalidade)'
    };
  }

  return { eligible: false, discountRate: 0 };
}

/**
 * Resolve as academias rivais locais e interestaduais vinculadas a uma academia.
 */
export function getGymRivalries(gym: Pick<Gym, 'id' | 'rivalryGymIds' | 'rivalryNote'>): {
  rivalGyms: Gym[];
  rivalryNote?: string;
} {
  const ids = gym.rivalryGymIds || [];
  const rivalGyms = ids
    .map((id) => WORLD_GYMS.find((g) => g.id === id))
    .filter((g): g is Gym => Boolean(g));
  return {
    rivalGyms,
    rivalryNote: gym.rivalryNote
  };
}

/**
 * Retorna a visão estruturada da rede de academias em cada uma das 27 capitais brasileiras.
 */
export function getGymsOverviewByCapital(): CapitalGymsOverview[] {
  return BRAZIL_STATES.map((st) => {
    const ids = getRegionalGymIdsByUf(st.uf);
    const orderedIds = [ids.socialId, ids.convId, ids.compId, ids.eliteId].filter(
      (id): id is string => Boolean(id)
    );
    const gyms = orderedIds
      .map((id) => WORLD_GYMS.find((g) => g.id === id))
      .filter((g): g is Gym => Boolean(g));

    const artsSet = new Set<MartialArtType>();
    const rivalryNotes: string[] = [];
    let totalInstructors = 0;

    gyms.forEach((g) => {
      g.focusArts.forEach((a) => artsSet.add(a));
      totalInstructors += g.instructors?.length || 1;
      if (g.rivalryNote && !rivalryNotes.includes(g.rivalryNote)) {
        rivalryNotes.push(g.rivalryNote);
      }
    });

    return {
      uf: st.uf,
      capital: st.capital,
      stateName: st.name,
      gyms,
      artsOffered: Array.from(artsSet),
      hasEliteCenter: gyms.some((g) => g.qualityTier === 'elite'),
      totalInstructors,
      rivalryNotes
    };
  });
}
