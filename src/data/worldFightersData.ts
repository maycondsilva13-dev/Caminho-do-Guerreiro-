import {
  AgeCategory,
  Character,
  FighterAttributes,
  MartialArtType,
  RivalNPC,
  WealthTier,
  WeightClass
} from '../types/game';
import { MARTIAL_ARTS_META, WEIGHT_CLASSES, WORLD_GYMS } from './martialArtsData';
import { getRegionalGymIdsByUf } from './regionalGymsCatalog';
import { resolveBrazilCapitalByCity } from '../utils/regionalGeographyHelper';
import { BjjBeltRankIndex } from '../types/bjjCombat';
import { deriveInitialBjjNpcStripes, formatBjjBeltWithDegree } from '../utils/bjjDegreeHelper';

export function getAgeCategoryFromAge(age: number): AgeCategory {
  if (age < 14) return 'infantil';
  if (age < 18) return 'juvenil';
  if (age < 30) return 'adulto';
  return 'master';
}

export function getAgeCategoryLabel(cat: AgeCategory): string {
  switch (cat) {
    case 'infantil':
      return 'Infantil (até 13 anos)';
    case 'juvenil':
      return 'Juvenil (14 a 17 anos)';
    case 'adulto':
      return 'Adulto (18 a 29 anos)';
    case 'master':
      return 'Master (30+ anos)';
  }
}

export function getWeightClassFromWeight(weight: number): WeightClass {
  for (const wc of WEIGHT_CLASSES) {
    if (weight <= wc.maxWeight) {
      return wc.name;
    }
  }
  return 'Pesado (até 120kg)';
}

/**
 * Converte o índice de graduação completo do catálogo da CBJJ (0..12)
 * para o nível de faixa regulamentar do motor de combate BJJ (0=Branca..4=Preta).
 */
export function mapMetaBjjRankToCombatRank(metaRankIndex: number): BjjBeltRankIndex {
  if (metaRankIndex <= 2) return 0; // Branca, Cinza, Amarela
  if (metaRankIndex <= 5) return 1; // Laranja, Verde, Azul
  if (metaRankIndex === 6) return 2; // Roxa
  if (metaRankIndex === 7) return 3; // Marrom
  return 4; // Preta, Coral, Vermelha
}

export function resolveBjjCombatBeltRank(rankIndex?: number, beltName?: string): BjjBeltRankIndex {
  const lower = (beltName || '').toLowerCase();
  if (lower.includes('coral') || lower.includes('vermelha') || lower.includes('preta') || lower.includes('black')) return 4;
  if (lower.includes('marrom') || lower.includes('brown')) return 3;
  if (lower.includes('roxa') || lower.includes('purple')) return 2;
  if (lower.includes('azul') || lower.includes('blue')) return 1;
  if (lower.includes('verde') || lower.includes('laranja') || lower.includes('amarela') || lower.includes('cinza') || lower.includes('branca')) return 0;
  const idx = rankIndex ?? 0;
  if (idx >= 5) return mapMetaBjjRankToCombatRank(idx);
  return Math.min(4, Math.max(0, idx)) as BjjBeltRankIndex;
}

/**
 * Garante que o índice de graduação respeite a idade mínima da federação.
 */
export function clampRankIndexForAge(art: MartialArtType, desiredRankIndex: number, age: number): number {
  const ranks = MARTIAL_ARTS_META[art].ranks;
  const clamped = Math.max(0, Math.min(desiredRankIndex, ranks.length - 1));
  for (let i = clamped; i >= 0; i--) {
    const minAge = ranks[i].minAge;
    if (minAge === undefined || age >= minAge) {
      return i;
    }
  }
  return 0;
}

export function getFightingStyleLabel(style?: string): { label: string; colorClass: string } {
  const map: Record<string, { label: string; colorClass: string }> = {
    guardeiro: { label: 'Guardeiro Técnico', colorClass: 'text-cyan-300 bg-cyan-950/50 border-cyan-800/50' },
    passador: { label: 'Passador de Pressão', colorClass: 'text-orange-300 bg-orange-950/50 border-orange-800/50' },
    quedas: { label: 'Quedador / Wrestler', colorClass: 'text-amber-300 bg-amber-950/50 border-amber-800/50' },
    quedador: { label: 'Quedador / Projeções', colorClass: 'text-amber-300 bg-amber-950/50 border-amber-800/50' },
    finalizador: { label: 'Caçador de Finalizações', colorClass: 'text-rose-300 bg-rose-950/50 border-rose-800/50' },
    defensivo: { label: 'Retenção & Defesa', colorClass: 'text-sky-300 bg-sky-950/50 border-sky-800/50' },
    pressionador: { label: 'Ritmo & Pressão', colorClass: 'text-red-300 bg-red-950/50 border-red-800/50' },
    equilibrado: { label: 'Jogo Completo', colorClass: 'text-emerald-300 bg-emerald-950/50 border-emerald-800/50' },
    completo: { label: 'Jogo Completo', colorClass: 'text-emerald-300 bg-emerald-950/50 border-emerald-800/50' },
    outboxer: { label: 'Out-Boxer (Distância)', colorClass: 'text-sky-300 bg-sky-950/50 border-sky-800/50' },
    slugger: { label: 'Pegador / Nocauteador', colorClass: 'text-red-300 bg-red-950/50 border-red-800/50' },
    counter: { label: 'Contragolpeador Cirúrgico', colorClass: 'text-indigo-300 bg-indigo-950/50 border-indigo-800/50' },
    pressure: { label: 'Swarmer / Pressão Contínua', colorClass: 'text-orange-300 bg-orange-950/50 border-orange-800/50' },
    brawler: { label: 'Trocador Franco (Brawler)', colorClass: 'text-rose-300 bg-rose-950/50 border-rose-800/50' },
    boxer_puncher: { label: 'Boxer-Puncher Versátil', colorClass: 'text-amber-300 bg-amber-950/50 border-amber-800/50' },
    muay_femur: { label: 'Muay Femur (Técnico/Tático)', colorClass: 'text-purple-300 bg-purple-950/50 border-purple-800/50' },
    muay_khao: { label: 'Muay Khao (Clinch & Joelhos)', colorClass: 'text-amber-300 bg-amber-950/50 border-amber-800/50' },
    muay_mat: { label: 'Muay Mat (Punhos & Low Kicks)', colorClass: 'text-red-300 bg-red-950/50 border-red-800/50' },
    muay_sok: { label: 'Muay Sok (Cotovelos Letais)', colorClass: 'text-rose-300 bg-rose-950/50 border-rose-800/50' },
    kumite_speed: { label: 'Kumitê Veloz (Ma-ai)', colorClass: 'text-cyan-300 bg-cyan-950/50 border-cyan-800/50' },
    counter_kime: { label: 'Kime & Interceptação', colorClass: 'text-indigo-300 bg-indigo-950/50 border-indigo-800/50' },
    high_kick: { label: 'Chutes Altos / Ura-Mawashi', colorClass: 'text-violet-300 bg-violet-950/50 border-violet-800/50' },
    full_contact: { label: 'Full Contact Kyokushin', colorClass: 'text-red-300 bg-red-950/50 border-red-800/50' },
    uchi_mata: { label: 'Especialista Uchi-Mata', colorClass: 'text-amber-300 bg-amber-950/50 border-amber-800/50' },
    seoi_specialist: { label: 'Especialista Seoi-Nage', colorClass: 'text-sky-300 bg-sky-950/50 border-sky-800/50' },
    ashi_waza: { label: 'Ashi-Waza (Rasteiras de Judô)', colorClass: 'text-teal-300 bg-teal-950/50 border-teal-800/50' },
    ne_waza: { label: 'Ne-Waza (Solo & Imobilização)', colorClass: 'text-rose-300 bg-rose-950/50 border-rose-800/50' },
    ura_nage: { label: 'Projeções de Potência', colorClass: 'text-orange-300 bg-orange-950/50 border-orange-800/50' },
    harai_goshi: { label: 'Harai-Goshi & Controle de Gola', colorClass: 'text-emerald-300 bg-emerald-950/50 border-emerald-800/50' },
    mandingueiro: { label: 'Mandingueiro / Angola', colorClass: 'text-amber-300 bg-amber-950/50 border-amber-800/50' },
    regional_veloz: { label: 'Regional Veloz & Rasteira', colorClass: 'text-emerald-300 bg-emerald-950/50 border-emerald-800/50' },
    floreio_agressivo: { label: 'Floreio Acrobático Agressivo', colorClass: 'text-fuchsia-300 bg-fuchsia-950/50 border-fuchsia-800/50' },
    dagestan_pressure: { label: 'Pressão do Cáucaso (Wrestling/Solo)', colorClass: 'text-red-300 bg-red-950/50 border-red-800/50' },
    leglock_hunter: { label: 'Caçador de Chaves de Pé', colorClass: 'text-rose-300 bg-rose-950/50 border-rose-800/50' },
    no_gi_scramble: { label: 'Scramble Dinâmico No-Gi', colorClass: 'text-cyan-300 bg-cyan-950/50 border-cyan-800/50' },
    wrestler_lle: { label: 'Wrestler de Baiana & Suplê', colorClass: 'text-orange-300 bg-orange-950/50 border-orange-800/50' },
    striker_grappler: { label: 'Híbrido (Trocação + Solo)', colorClass: 'text-purple-300 bg-purple-950/50 border-purple-800/50' },
    grappler_striker: { label: 'Grappler Agressivo c/ Trocação', colorClass: 'text-emerald-300 bg-emerald-950/50 border-emerald-800/50' },
    well_rounded: { label: 'MMA Completo (5 Rounds)', colorClass: 'text-amber-300 bg-amber-950/50 border-amber-800/50' },
    striker: { label: 'Striker Puro de Nocaute', colorClass: 'text-red-300 bg-red-950/50 border-red-800/50' }
  };
  return (
    map[style || ''] || {
      label: style ? style.replace(/_/g, ' ') : 'Versátil',
      colorClass: 'text-neutral-300 bg-neutral-900 border-neutral-700'
    }
  );
}

export function getWealthTierInfo(tier?: WealthTier): {
  label: string;
  shortLabel: string;
  badgeClass: string;
  trainingBonus: number;
} {
  switch (tier) {
    case 'milionario':
      return {
        label: 'Milionário / Patrocínio Global',
        shortLabel: '💎 Milionário',
        badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
        trainingBonus: 1.35
      };
    case 'abastado':
      return {
        label: 'Abastado / Camp de Elite',
        shortLabel: '💰 Abastado',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
        trainingBonus: 1.2
      };
    case 'humilde':
      return {
        label: 'Origem Humilde / Raiz',
        shortLabel: '🔥 Raiz',
        badgeClass: 'bg-orange-950/40 text-orange-300 border-orange-800/40',
        trainingBonus: 1.0
      };
    case 'classe_media':
    default:
      return {
        label: 'Atleta Regular',
        shortLabel: '🏠 Regular',
        badgeClass: 'bg-neutral-950 text-neutral-400 border-neutral-800',
        trainingBonus: 1.08
      };
  }
}

export function resolveDefaultGymIdForSeed(
  art: MartialArtType,
  baseStat: number,
  explicitGymId?: string,
  wealthTier?: WealthTier,
  city?: string,
  country: string = 'Brasil'
): string {
  // Preserva academias explícitas reais (exceto o placeholder legado gym_bairro em atletas brasileiros)
  if (
    explicitGymId &&
    explicitGymId !== 'gym_bairro' &&
    WORLD_GYMS.some((g) => g.id === explicitGymId)
  ) {
    return explicitGymId;
  }

  const isHighTier = baseStat >= 34 || wealthTier === 'milionario' || wealthTier === 'abastado';

  if (country === 'Brasil') {
    const cap = resolveBrazilCapitalByCity(city, 'SP');
    const pool = getRegionalGymIdsByUf(cap.uf);

    if (art === 'jiujitsu' && baseStat >= 54 && wealthTier === 'milionario') {
      return 'gym_american_top_team';
    }
    if (art === 'capoeira' && (baseStat >= 34 || (cap.uf === 'BA' && baseStat >= 22))) {
      return 'gym_terreiro_salvador';
    }
    if (art === 'jiujitsu' && isHighTier && cap.uf === 'RJ') {
      return 'gym_gracie_rio';
    }
    if (baseStat <= 21 || (wealthTier === 'humilde' && baseStat < 28)) {
      return pool.socialId;
    }
    if (isHighTier && pool.eliteId) {
      return pool.eliteId;
    }
    return pool.compId;
  }

  if (!isHighTier && baseStat < 25) {
    return 'gym_bairro';
  }

  switch (art) {
    case 'jiujitsu':
      return isHighTier ? (baseStat >= 54 && wealthTier === 'milionario' ? 'gym_american_top_team' : 'gym_gracie_rio') : 'gym_bairro';
    case 'boxe':
      return isHighTier ? 'gym_wild_card_la' : 'gym_bairro';
    case 'muaythai':
      return isHighTier ? 'gym_tiger_phuket' : 'gym_bairro';
    case 'karate':
    case 'judo':
      return isHighTier ? 'gym_kodokan_tokyo' : 'gym_bairro';
    case 'capoeira':
      return isHighTier || baseStat >= 22 ? 'gym_terreiro_salvador' : 'gym_bairro';
    case 'lutalivre':
      return isHighTier ? (wealthTier === 'milionario' ? 'gym_american_top_team' : 'gym_dagestan_mountains') : 'gym_bairro';
    case 'mma':
      return baseStat >= 44 || wealthTier === 'milionario'
        ? 'gym_american_top_team'
        : baseStat >= 36
        ? 'gym_tiger_phuket'
        : 'gym_bairro';
    default:
      return 'gym_bairro';
  }
}

interface FighterSeedInput {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  age: number;
  gender?: 'M' | 'F';
  wealthTier?: WealthTier;
  sponsorName?: string;
  art: MartialArtType;
  rankIndex: number;
  weight: number;
  gymId?: string;
  gymName: string;
  city: string;
  country: string;
  fightingStyle: string;
  personality: RivalNPC['personality'];
  relationshipScore?: number;
  baseStat: number;
  bias?: Partial<FighterAttributes>;
  record: { wins: number; losses: number; draws: number; kos: number; subs: number };
  reputation: number;
  socialPost: string;
  isStarterRival?: boolean;
}

function buildWorldFighter(seed: FighterSeedInput): RivalNPC & { isStarterRival?: boolean } {
  const validRankIdx = clampRankIndexForAge(seed.art, seed.rankIndex, seed.age);
  const rankDef = MARTIAL_ARTS_META[seed.art].ranks[validRankIdx] || MARTIAL_ARTS_META[seed.art].ranks[0];
  const ageCategory = getAgeCategoryFromAge(seed.age);
  const weightClass = getWeightClassFromWeight(seed.weight);
  const wealthTier: WealthTier =
    seed.wealthTier || (seed.reputation >= 350 ? 'abastado' : seed.baseStat <= 22 ? 'humilde' : 'classe_media');
  const normalizedCountry = seed.country || 'Brasil';
  const normalizedCity =
    normalizedCountry === 'Brasil'
      ? resolveBrazilCapitalByCity(seed.city, 'SP').capital
      : seed.city;

  const resolvedGymId = resolveDefaultGymIdForSeed(
    seed.art,
    seed.baseStat,
    seed.gymId,
    wealthTier,
    normalizedCity,
    normalizedCountry
  );
  const officialGym = WORLD_GYMS.find((g) => g.id === resolvedGymId) || WORLD_GYMS[0];

  const b = seed.baseStat;
  const attributes: FighterAttributes = {
    strength: Math.max(8, Math.min(99, b + (seed.bias?.strength ?? 0))),
    speed: Math.max(8, Math.min(99, b + (seed.bias?.speed ?? 0))),
    stamina: Math.max(8, Math.min(99, b + (seed.bias?.stamina ?? 0))),
    durability: Math.max(8, Math.min(99, b + (seed.bias?.durability ?? 0))),
    flexibility: Math.max(8, Math.min(99, b + (seed.bias?.flexibility ?? 0))),
    fightIq: Math.max(8, Math.min(99, b + (seed.bias?.fightIq ?? 0))),
    technique: Math.max(8, Math.min(99, b + (seed.bias?.technique ?? 0))),
    mentalFocus: Math.max(8, Math.min(99, b + (seed.bias?.mentalFocus ?? 0)))
  };

  const initialMonthsInRank = seed.art === 'jiujitsu' && validRankIdx === 8 ? 36 + Math.max(0, seed.age - 22) * 12 : 3;
  const stripes =
    seed.art === 'jiujitsu'
      ? deriveInitialBjjNpcStripes(validRankIdx, seed.age, seed.record.wins, seed.reputation, initialMonthsInRank)
      : 0;
  const formattedBelt =
    seed.art === 'jiujitsu'
      ? formatBjjBeltWithDegree(validRankIdx, rankDef.name, stripes)
      : rankDef.name;

  return {
    id: seed.id,
    name: seed.name,
    nickname: seed.nickname,
    avatar: seed.avatar,
    age: seed.age,
    ageCategory,
    gender: seed.gender || 'M',
    wealthTier,
    sponsorName: seed.sponsorName,
    art: seed.art,
    rankIndex: validRankIdx,
    belt: formattedBelt,
    stripes,
    weight: seed.weight,
    weightClass,
    gymId: officialGym.id,
    gymName: officialGym.name,
    city: normalizedCity || officialGym.city,
    country: normalizedCountry || officialGym.country,
    fightingStyle: seed.fightingStyle,
    npcXp: 0,
    gymTransferCount: 0,
    attributes,
    record: { ...seed.record },
    reputation: seed.reputation,
    personality: seed.personality,
    relationshipScore: seed.relationshipScore ?? 0,
    lastResult: 'nunca_lutaram',
    socialPost: seed.socialPost,
    monthsInRank: initialMonthsInRank,
    isStarterRival: seed.isStarterRival
  };
}

const RAW_WORLD_FIGHTER_SEEDS: FighterSeedInput[] = [
  // =========================================================================
  // 1. JIU-JITSU BRASILEIRO (Infantil, Juvenil, Adulto, Master — Palha a Pesado)
  // =========================================================================
  {
    id: 'bjj_inf_matheus',
    name: 'Matheus "Formiguinha" Rocha',
    nickname: 'Formiguinha',
    avatar: '🐜',
    age: 9,
    art: 'jiujitsu',
    rankIndex: 2, // Amarela
    weight: 34,
    gymName: 'Projeto Social Tatame Vivo',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'guardeiro',
    personality: 'respeitoso',
    baseStat: 12,
    bias: { flexibility: 6, technique: 4, speed: 3 },
    record: { wins: 3, losses: 1, draws: 0, kos: 0, subs: 2 },
    reputation: 12,
    socialPost: 'Treino de sábado rendeu muito! Quero pegar minha ponta na faixa amarela logo!'
  },
  {
    id: 'bjj_inf_enzo',
    name: 'Enzo "Escorpião" Lima',
    nickname: 'Escorpião',
    avatar: '🦂',
    age: 11,
    art: 'jiujitsu',
    rankIndex: 3, // Laranja
    weight: 43,
    gymName: 'Academia Nova Geração BJJ',
    city: 'Curitiba',
    country: 'Brasil',
    fightingStyle: 'finalizador',
    personality: 'arrogante',
    baseStat: 15,
    bias: { technique: 5, speed: 4, stamina: 3 },
    record: { wins: 6, losses: 1, draws: 0, kos: 0, subs: 5 },
    reputation: 22,
    socialPost: 'Armlock voador no treino infantil hoje. Ninguém segura minha guarda aberta!'
  },
  {
    id: 'bjj_inf_davi',
    name: 'Davi "Gafanhoto" Mendes',
    nickname: 'Gafanhoto',
    avatar: '🦗',
    age: 13,
    art: 'jiujitsu',
    rankIndex: 4, // Verde
    weight: 51,
    gymName: 'Tatame Leste União',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'passador',
    personality: 'frio_calculista',
    baseStat: 18,
    bias: { stamina: 5, technique: 4, fightIq: 4 },
    record: { wins: 8, losses: 2, draws: 0, kos: 0, subs: 4 },
    reputation: 28,
    socialPost: 'Último ano no infantil antes do juvenil. Passagem toreando afiada!'
  },
  {
    id: 'rival_lucas',
    name: 'Lucas "Trovão" Silveira',
    nickname: 'Trovão',
    avatar: '🐶',
    age: 14,
    art: 'jiujitsu',
    rankIndex: 4, // Faixa Verde (Juvenil)
    weight: 68,
    gymName: 'Moema Arte Suave Clube',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'passador',
    personality: 'arrogante',
    relationshipScore: -30,
    baseStat: 21,
    bias: { strength: 2, stamina: 3, durability: 4, fightIq: -2 },
    record: { wins: 5, losses: 1, draws: 0, kos: 0, subs: 4 },
    reputation: 35,
    socialPost: 'Ouvi dizer que tem novato se achando fera na academia... quando pisar no meu tatame vai bater rapidinho! 🥋💀',
    isStarterRival: true
  },
  {
    id: 'bjj_juv_gabriel',
    name: 'Gabriel "Aranha" Costa',
    nickname: 'Aranha',
    avatar: '🕷️',
    age: 16,
    art: 'jiujitsu',
    rankIndex: 5, // Faixa Azul (16+)
    weight: 64,
    gymName: 'Academia Paulista Central BJJ',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'guardeiro',
    personality: 'respeitoso',
    baseStat: 24,
    bias: { flexibility: 6, technique: 5, fightIq: 3 },
    record: { wins: 9, losses: 2, draws: 0, kos: 0, subs: 7 },
    reputation: 48,
    socialPost: 'Estreando na faixa azul juvenil com foco total no triângulo e omoplata.'
  },
  {
    id: 'bjj_juv_rafael',
    name: 'Rafael "Trator" Nogueira',
    nickname: 'Trator',
    avatar: '🚜',
    age: 17,
    art: 'jiujitsu',
    rankIndex: 5, // Azul
    weight: 76,
    gymName: 'Templo Carioca da Arte Suave',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'quedas',
    personality: 'fanfarrao',
    baseStat: 26,
    bias: { strength: 6, durability: 4, stamina: 3 },
    record: { wins: 11, losses: 3, draws: 0, kos: 0, subs: 5 },
    reputation: 52,
    socialPost: 'Quedou, passou e amassou nos 100kg. É assim que se vence campeonato!'
  },
  {
    id: 'bjj_adu_caio_branca',
    name: 'Caio "Pedra" Azevedo',
    nickname: 'Pedra',
    avatar: '🪨',
    age: 22,
    art: 'jiujitsu',
    rankIndex: 0, // Branca Adulto
    weight: 69,
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'equilibrado',
    personality: 'respeitoso',
    baseStat: 23,
    bias: { strength: 3, durability: 4, technique: 1 },
    record: { wins: 2, losses: 1, draws: 0, kos: 0, subs: 1 },
    reputation: 20,
    socialPost: 'Primeiro Open Municipal na faixa branca peso leve. Coração na ponta do kimono!'
  },
  {
    id: 'bjj_adu_pedro_azul',
    name: 'Pedro "Anaconda" Moraes',
    nickname: 'Anaconda',
    avatar: '🐍',
    age: 23,
    art: 'jiujitsu',
    rankIndex: 5, // Faixa Azul
    weight: 70,
    gymId: 'gym_gracie_rio',
    gymName: 'Templo Carioca da Arte Suave',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'finalizador',
    personality: 'frio_calculista',
    baseStat: 30,
    bias: { technique: 6, flexibility: 4, fightIq: 4 },
    record: { wins: 14, losses: 3, draws: 0, kos: 0, subs: 11 },
    reputation: 78,
    socialPost: 'Peso Leve batido sem sofrimento. Amanhã é dia de estrangular na chave.'
  },
  {
    id: 'bjj_adu_igor_azul',
    name: 'Igor "Muralha" Cardoso',
    nickname: 'Muralha',
    avatar: '🧱',
    age: 25,
    art: 'jiujitsu',
    rankIndex: 5, // Faixa Azul
    weight: 68.5,
    gymName: 'Escola Paulistana de Guarda & Passagem',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'passador',
    personality: 'respeitoso',
    baseStat: 29,
    bias: { durability: 6, strength: 4, stamina: 4 },
    record: { wins: 11, losses: 4, draws: 1, kos: 0, subs: 4 },
    reputation: 66,
    socialPost: 'Ninguém raspa minha base. O segredo é pressão constante e zero pressa.'
  },
  {
    id: 'bjj_adu_thiago_roxa',
    name: 'Thiago "Berimbolo" Viana',
    nickname: 'Berimbolo',
    avatar: '🌀',
    age: 24,
    art: 'jiujitsu',
    rankIndex: 6, // Faixa Roxa
    weight: 65,
    gymName: 'Pacific Coast Jiu-Jitsu Lab',
    city: 'Costa Mesa',
    country: 'Estados Unidos',
    fightingStyle: 'guardeiro',
    personality: 'frio_calculista',
    baseStat: 38,
    bias: { flexibility: 10, technique: 8, speed: 6 },
    record: { wins: 22, losses: 3, draws: 0, kos: 0, subs: 15 },
    reputation: 135,
    socialPost: 'Guarda De La Riva invertida direto pras costas. 4 pontos na conta antes do adversário piscar.'
  },
  {
    id: 'bjj_adu_leandro_marrom',
    name: 'Leandro "Predador" Vasconcelos',
    nickname: 'Predador',
    avatar: '🐆',
    age: 26,
    art: 'jiujitsu',
    rankIndex: 7, // Faixa Marrom
    weight: 70,
    gymName: 'Paulistano Alto Rendimento BJJ',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'passador',
    personality: 'arrogante',
    baseStat: 46,
    bias: { strength: 7, technique: 8, stamina: 7, mentalFocus: 6 },
    record: { wins: 31, losses: 4, draws: 0, kos: 0, subs: 18 },
    reputation: 190,
    socialPost: 'Rumo ao Mundial na Faixa Marrom. Passagem de pressão que esmaga o gás em 2 minutos.',
    isStarterRival: true
  },
  {
    id: 'bjj_adu_marcus_preta',
    name: 'Marcus "Colosso" Almeida',
    nickname: 'Colosso',
    avatar: '🦍',
    age: 28,
    art: 'jiujitsu',
    rankIndex: 8, // Faixa Preta
    weight: 108,
    gymName: 'Baixada Santista Jiu-Jitsu Clube',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'quedas',
    personality: 'respeitoso',
    baseStat: 58,
    bias: { strength: 14, durability: 10, technique: 8, stamina: 6 },
    record: { wins: 48, losses: 5, draws: 0, kos: 0, subs: 31 },
    reputation: 340,
    socialPost: 'Categoria Pesado na Pirâmide de Long Beach. Respeito a todos os faixas-pretas da chave.'
  },
  {
    id: 'bjj_mas_rodrigo_preta',
    name: 'Rodrigo "Cavalo" Nogueira',
    nickname: 'Cavalo',
    avatar: '🦁',
    age: 34,
    art: 'jiujitsu',
    rankIndex: 8, // Faixa Preta Master
    weight: 70,
    gymId: 'gym_gracie_rio',
    gymName: 'Templo Carioca da Arte Suave',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'equilibrado',
    personality: 'respeitoso',
    baseStat: 52,
    bias: { fightIq: 10, technique: 10, mentalFocus: 9 },
    record: { wins: 42, losses: 8, draws: 1, kos: 0, subs: 26 },
    reputation: 260,
    socialPost: 'Na divisão Master, experiência e calma valem mais que explosão cega.'
  },
  {
    id: 'bjj_mas_helio_coral',
    name: 'Mestre Oswaldo "Sombra" Rezende',
    nickname: 'Sombra',
    avatar: '🦅',
    age: 52,
    art: 'jiujitsu',
    rankIndex: 9, // Faixa Coral (50+)
    weight: 82,
    gymName: 'Academia Tradicional Guanabara',
    city: 'Niterói',
    country: 'Brasil',
    fightingStyle: 'finalizador',
    personality: 'frio_calculista',
    baseStat: 55,
    bias: { technique: 16, fightIq: 18, mentalFocus: 15, speed: -8 },
    record: { wins: 64, losses: 7, draws: 2, kos: 0, subs: 51 },
    reputation: 410,
    socialPost: 'Trinta e dois anos de faixa preta antes de amarrar a coral. A alavanca nunca falha.'
  },

  // =========================================================================
  // 2. BOXE (Iniciante, Avançado, Instrutor, Professor — Mosca a Pesado)
  // =========================================================================
  {
    id: 'boxe_inf_cauã',
    name: 'Cauã "Relâmpago" Ferreira',
    nickname: 'Relâmpago',
    avatar: '⚡',
    age: 12,
    art: 'boxe',
    rankIndex: 0, // Iniciante
    weight: 48,
    gymName: 'Centro Olímpico de Pugilismo',
    city: 'Salvador',
    country: 'Brasil',
    fightingStyle: 'outboxer',
    personality: 'respeitoso',
    baseStat: 14,
    bias: { speed: 6, stamina: 4, fightIq: 2 },
    record: { wins: 4, losses: 1, draws: 0, kos: 1, subs: 0 },
    reputation: 18,
    socialPost: 'Jab e movimentação de pernas todos os dias antes da escola!'
  },
  {
    id: 'rival_renan',
    name: 'Renan "Fúria" Santos',
    nickname: 'Fúria',
    avatar: '🥊',
    age: 15,
    art: 'boxe',
    rankIndex: 1, // Aluno Avançado
    weight: 65,
    gymName: 'Nobre Arte Boxing Club',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'slugger',
    personality: 'fanfarrao',
    relationshipScore: -10,
    baseStat: 22,
    bias: { strength: 4, speed: 6, flexibility: -7 },
    record: { wins: 7, losses: 2, draws: 0, kos: 5, subs: 0 },
    reputation: 40,
    socialPost: 'Mais um nocaute no 1º round no treino de hoje. Minha mão direita não é de Deus!',
    isStarterRival: true
  },
  {
    id: 'boxe_juv_diego',
    name: 'Diego "Canhoto" Duarte',
    nickname: 'Canhoto',
    avatar: '🔥',
    age: 16,
    art: 'boxe',
    rankIndex: 1, // Avançado
    weight: 60,
    gymName: 'Arena Boxing Rio',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'counter',
    personality: 'frio_calculista',
    baseStat: 25,
    bias: { speed: 6, technique: 5, fightIq: 4 },
    record: { wins: 9, losses: 1, draws: 0, kos: 4, subs: 0 },
    reputation: 55,
    socialPost: 'Base southpaw com direto de esquerda no contragolpe. Quem pisca cai.'
  },
  {
    id: 'boxe_juv_lucas_m',
    name: 'Mateus "Trovão" Oliveira',
    nickname: 'Trovão',
    avatar: '🌩️',
    age: 17,
    art: 'boxe',
    rankIndex: 1, // Avançado
    weight: 65.5,
    gymName: 'CT Pugilismo Sul',
    city: 'Porto Alegre',
    country: 'Brasil',
    fightingStyle: 'brawler',
    personality: 'arrogante',
    baseStat: 26,
    bias: { strength: 6, durability: 5, speed: 2 },
    record: { wins: 8, losses: 2, draws: 1, kos: 6, subs: 0 },
    reputation: 58,
    socialPost: 'Na categoria Pena juvenil ninguém aguenta minha sequência de gancho no fígado.'
  },
  {
    id: 'boxe_adu_bruno',
    name: 'Bruno "Mão de Pedra" Batista',
    nickname: 'Mão de Pedra',
    avatar: '💣',
    age: 21,
    art: 'boxe',
    rankIndex: 0, // Iniciante Adulto
    weight: 66,
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    city: 'Santo André',
    country: 'Brasil',
    fightingStyle: 'slugger',
    personality: 'fanfarrao',
    baseStat: 25,
    bias: { strength: 6, durability: 4, speed: 2 },
    record: { wins: 5, losses: 1, draws: 0, kos: 4, subs: 0 },
    reputation: 38,
    socialPost: 'Copa Luvas da Baixada vai ser minha. O peso Pena tá avisado!'
  },
  {
    id: 'boxe_adu_hector',
    name: 'Héctor "El Rayo" Morales',
    nickname: 'El Rayo',
    avatar: '⚡',
    age: 23,
    art: 'boxe',
    rankIndex: 1, // Avançado
    weight: 65.5,
    gymName: 'Club Azteca Boxeo México',
    city: 'Cidade do México',
    country: 'México',
    fightingStyle: 'pressure',
    personality: 'respeitoso',
    baseStat: 34,
    bias: { stamina: 8, durability: 6, strength: 5 },
    record: { wins: 16, losses: 2, draws: 0, kos: 11, subs: 0 },
    reputation: 120,
    socialPost: 'Estilo mexicano: pressão constante na linha de cintura por 12 rounds.'
  },
  {
    id: 'boxe_adu_devon',
    name: 'Devon "Slick" Brooks',
    nickname: 'Slick',
    avatar: '🎩',
    age: 25,
    art: 'boxe',
    rankIndex: 2, // Instrutor
    weight: 66,
    gymId: 'gym_wild_card_la',
    gymName: 'Sunset Boulevard Boxing Club',
    city: 'Los Angeles',
    country: 'Estados Unidos',
    fightingStyle: 'counter',
    personality: 'arrogante',
    baseStat: 44,
    bias: { speed: 10, fightIq: 8, technique: 8 },
    record: { wins: 24, losses: 1, draws: 0, kos: 12, subs: 0 },
    reputation: 210,
    socialPost: 'Philly Shell e Pull Back no Madison Square Garden. Bateu no vento, tomou direto.',
    isStarterRival: true
  },
  {
    id: 'boxe_adu_viktor',
    name: 'Viktor "Martelo" Petrov',
    nickname: 'Martelo',
    avatar: '🔨',
    age: 27,
    art: 'boxe',
    rankIndex: 2, // Instrutor
    weight: 76,
    gymName: 'Kremlin Ring Boxing Moscow',
    city: 'Moscou',
    country: 'Rússia',
    fightingStyle: 'boxer_puncher',
    personality: 'frio_calculista',
    baseStat: 46,
    bias: { strength: 9, technique: 7, durability: 7 },
    record: { wins: 27, losses: 2, draws: 0, kos: 19, subs: 0 },
    reputation: 230,
    socialPost: 'Escola soviética de pêndulo e jab pesado. Precisão cirúrgica.'
  },
  {
    id: 'boxe_adu_anthony',
    name: 'Anthony "Gigante" Vance',
    nickname: 'Gigante',
    avatar: '🗿',
    age: 28,
    gender: 'M',
    wealthTier: 'milionario',
    sponsorName: 'Crown Boxing Promotions UK',
    art: 'boxe',
    rankIndex: 3, // Professor
    weight: 106,
    gymId: 'gym_wild_card_la',
    gymName: 'Sunset Boulevard Boxing Club',
    city: 'Londres',
    country: 'Reino Unido',
    fightingStyle: 'slugger',
    personality: 'respeitoso',
    baseStat: 54,
    bias: { strength: 15, durability: 10, stamina: 4 },
    record: { wins: 30, losses: 2, draws: 0, kos: 26, subs: 0 },
    reputation: 310,
    socialPost: 'Peso Pesado mundial: um uppercut limpo encerra qualquer estratégia.'
  },
  {
    id: 'boxe_mas_sergio',
    name: 'Sérgio "Maestro" Alencar',
    nickname: 'Maestro',
    avatar: '🎼',
    age: 35,
    art: 'boxe',
    rankIndex: 3, // Professor
    weight: 66,
    gymId: 'gym_wild_card_la',
    gymName: 'Sunset Boulevard Boxing Club',
    city: 'Hollywood',
    country: 'Estados Unidos',
    fightingStyle: 'counter',
    personality: 'frio_calculista',
    baseStat: 53,
    bias: { fightIq: 14, technique: 12, speed: 6 },
    record: { wins: 39, losses: 4, draws: 1, kos: 22, subs: 0 },
    reputation: 350,
    socialPost: 'Aos 35 anos, a leitura de distância vence a força bruta no MGM Grand.'
  },
  {
    id: 'boxe_adu_yuri',
    name: 'Yuri "Fênix" Nakamura',
    nickname: 'Fênix',
    avatar: '🐦‍🔥',
    age: 24,
    art: 'boxe',
    rankIndex: 2, // Instrutor
    weight: 56,
    gymName: 'Yokohama Wave Boxing Club',
    city: 'Yokohama',
    country: 'Japão',
    fightingStyle: 'boxer_puncher',
    personality: 'respeitoso',
    baseStat: 45,
    bias: { speed: 12, technique: 10, strength: 6 },
    record: { wins: 21, losses: 0, draws: 0, kos: 18, subs: 0 },
    reputation: 245,
    socialPost: 'Peso Mosca com poder de Peso Médio. Gancho no corpo em velocidade máxima.'
  },
  {
    id: 'boxe_mas_marcelo',
    name: 'Marcelo "Cascavel" Dias',
    nickname: 'Cascavel',
    avatar: '🐍',
    age: 33,
    art: 'boxe',
    rankIndex: 3, // Professor
    weight: 82,
    gymName: 'Boxing Club Bahia',
    city: 'Salvador',
    country: 'Brasil',
    fightingStyle: 'counter',
    personality: 'fanfarrao',
    baseStat: 49,
    bias: { durability: 10, fightIq: 9, strength: 7 },
    record: { wins: 33, losses: 6, draws: 0, kos: 20, subs: 0 },
    reputation: 265,
    socialPost: 'A Bahia sempre foi berço de campeões olímpicos e mundiais do pugilismo!'
  },

  // =========================================================================
  // 3. MUAY THAI (Khans 1..15 — Infantil, Juvenil, Adulto, Master)
  // =========================================================================
  {
    id: 'mt_inf_kauan',
    name: 'Kauan "Tigre Mirim" Souza',
    nickname: 'Tigre Mirim',
    avatar: '🐯',
    age: 11,
    art: 'muaythai',
    rankIndex: 3, // 4º Khan (minAge 10)
    weight: 42,
    gymName: 'Projeto Tatame das Araucárias',
    city: 'Curitiba',
    country: 'Brasil',
    fightingStyle: 'striker',
    personality: 'respeitoso',
    baseStat: 15,
    bias: { speed: 4, stamina: 4, durability: 3 },
    record: { wins: 4, losses: 1, draws: 0, kos: 1, subs: 0 },
    reputation: 20,
    socialPost: 'Treinando Teep e chute circular todo dia depois da aula!'
  },
  {
    id: 'mt_juv_gustavo',
    name: 'Gustavo "Canela de Aço" Pires',
    nickname: 'Canela de Aço',
    avatar: '🦵',
    age: 16,
    art: 'muaythai',
    rankIndex: 7, // 8º Khan (minAge 14)
    weight: 65,
    gymName: 'Clube Thai Paulistano',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'muay_khao',
    personality: 'arrogante',
    baseStat: 25,
    bias: { durability: 6, strength: 5, stamina: 4 },
    record: { wins: 10, losses: 2, draws: 0, kos: 5, subs: 0 },
    reputation: 58,
    socialPost: 'Low kick até o adversário perder a base no Desafio do Sudeste!',
    isStarterRival: true
  },
  {
    id: 'mt_juv_tongchai',
    name: 'Tongchai "Menino do Lumpinee" Sor',
    nickname: 'Menino do Lumpinee',
    avatar: '🥊',
    age: 17,
    art: 'muaythai',
    rankIndex: 9, // 10º Khan (minAge 16)
    weight: 57,
    gymName: 'Lumpinee Spirit Camp',
    city: 'Bangkok',
    country: 'Tailândia',
    fightingStyle: 'muay_femur',
    personality: 'respeitoso',
    baseStat: 31,
    bias: { technique: 8, speed: 6, stamina: 6 },
    record: { wins: 28, losses: 5, draws: 1, kos: 9, subs: 0 },
    reputation: 110,
    socialPost: 'Desde os 8 anos nos ringues de Bangkok. Wai Kru sagrado antes da guerra.'
  },
  {
    id: 'mt_adu_felipe',
    name: 'Felipe "Machete" Barros',
    nickname: 'Machete',
    avatar: '🔪',
    age: 22,
    art: 'muaythai',
    rankIndex: 8, // 9º Khan
    weight: 66,
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'muay_sok',
    personality: 'fanfarrao',
    baseStat: 28,
    bias: { strength: 5, durability: 5, stamina: 4 },
    record: { wins: 11, losses: 3, draws: 0, kos: 7, subs: 0 },
    reputation: 68,
    socialPost: 'Cotovelada cortante no clinch é o cartão de visitas do centro!'
  },
  {
    id: 'mt_adu_saenchai',
    name: 'Somrak "Lenda" Boonlert',
    nickname: 'Lenda',
    avatar: '👑',
    age: 26,
    art: 'muaythai',
    rankIndex: 11, // 12º Khan (Kru Yai - minAge 25)
    weight: 66,
    gymId: 'gym_tiger_phuket',
    gymName: 'Siam Thunder Muay Thai & MMA Camp',
    city: 'Phuket',
    country: 'Tailândia',
    fightingStyle: 'muay_femur',
    personality: 'respeitoso',
    baseStat: 49,
    bias: { speed: 10, fightIq: 10, technique: 10, flexibility: 8 },
    record: { wins: 82, losses: 9, draws: 2, kos: 24, subs: 0 },
    reputation: 320,
    socialPost: 'No Estádio Lumpinee você não luta só com força — você dança e lê a mente do oponente.',
    isStarterRival: true
  },
  {
    id: 'mt_adu_rodtang_j',
    name: 'Prachai "Tanque de Ferro" Sri',
    nickname: 'Tanque de Ferro',
    avatar: '🛡️',
    age: 24,
    art: 'muaythai',
    rankIndex: 10, // 11º Khan (Kru - minAge 18)
    weight: 61,
    gymName: 'Siam Warrior Muay Thai Camp',
    city: 'Nonthaburi',
    country: 'Tailândia',
    fightingStyle: 'muay_mat',
    personality: 'fanfarrao',
    baseStat: 45,
    bias: { durability: 14, strength: 10, stamina: 9 },
    record: { wins: 65, losses: 10, draws: 1, kos: 31, subs: 0 },
    reputation: 270,
    socialPost: 'Pode chutar meu queixo à vontade. Eu continuo andando para frente!'
  },
  {
    id: 'mt_adu_carlos',
    name: 'Carlos "Joelho Voador" Magalhães',
    nickname: 'Joelho Voador',
    avatar: '🦅',
    age: 25,
    art: 'muaythai',
    rankIndex: 10, // 11º Khan
    weight: 70,
    gymName: 'Templo Paranaense Chute & Octógono',
    city: 'Curitiba',
    country: 'Brasil',
    fightingStyle: 'muay_khao',
    personality: 'arrogante',
    baseStat: 40,
    bias: { strength: 7, stamina: 8, durability: 6 },
    record: { wins: 22, losses: 4, draws: 0, kos: 14, subs: 0 },
    reputation: 165,
    socialPost: 'Clinch na nuca e joelhada nas costelas até dobrar o oponente.'
  },
  {
    id: 'mt_adu_liam',
    name: 'Liam "Hitman" Callahan',
    nickname: 'Hitman',
    avatar: '🎯',
    age: 28,
    art: 'muaythai',
    rankIndex: 11, // 12º Khan
    weight: 66,
    gymName: 'Yorkshire Iron Muay Thai',
    city: 'Leeds',
    country: 'Reino Unido',
    fightingStyle: 'muay_mat',
    personality: 'frio_calculista',
    baseStat: 44,
    bias: { strength: 8, speed: 6, durability: 7 },
    record: { wins: 38, losses: 7, draws: 0, kos: 25, subs: 0 },
    reputation: 215,
    socialPost: 'Low kicks britânicos com peso de cruzado de boxe. Pronto pro Lumpinee.'
  },
  {
    id: 'mt_mas_kru_somchai',
    name: 'Kru Somchai "Trovão" Wong',
    nickname: 'Trovão',
    avatar: '🌩️',
    age: 37,
    art: 'muaythai',
    rankIndex: 12, // 13º Khan (Arjan - minAge 35)
    weight: 75,
    gymId: 'gym_tiger_phuket',
    gymName: 'Siam Thunder Muay Thai & MMA Camp',
    city: 'Phuket',
    country: 'Tailândia',
    fightingStyle: 'muay_sok',
    personality: 'respeitoso',
    baseStat: 54,
    bias: { technique: 12, fightIq: 12, durability: 10 },
    record: { wins: 112, losses: 14, draws: 3, kos: 48, subs: 0 },
    reputation: 380,
    socialPost: 'Treinando a nova geração nas colinas de Phuket e defendendo a honra dos veteranos.'
  },
  {
    id: 'mt_adu_alexandre',
    name: 'Alexandre "Canhão" Machado',
    nickname: 'Canhão',
    avatar: '💥',
    age: 27,
    art: 'muaythai',
    rankIndex: 10, // 11º Khan
    weight: 84,
    gymName: 'Inside Muay Thai',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'muay_mat',
    personality: 'frio_calculista',
    baseStat: 43,
    bias: { strength: 10, durability: 8, stamina: 5 },
    record: { wins: 24, losses: 3, draws: 0, kos: 18, subs: 0 },
    reputation: 185,
    socialPost: 'Peso Médio: cada chute alto carrega o peso de uma barra de ferro.'
  },
  {
    id: 'mt_mas_diego',
    name: 'Diego "Guardião" Siqueira',
    nickname: 'Guardião',
    avatar: '⛩️',
    age: 33,
    art: 'muaythai',
    rankIndex: 11, // 12º Khan
    weight: 66,
    gymName: 'Siam Brasil Camp',
    city: 'Florianópolis',
    country: 'Brasil',
    fightingStyle: 'muay_femur',
    personality: 'respeitoso',
    baseStat: 46,
    bias: { fightIq: 10, technique: 9, mentalFocus: 8 },
    record: { wins: 34, losses: 6, draws: 0, kos: 16, subs: 0 },
    reputation: 220,
    socialPost: 'Bloqueio de canela perfeito e timing de queda no clinch.'
  },
  {
    id: 'mt_adu_nattapong',
    name: 'Nattapong "Cobra" Chaiya',
    nickname: 'Cobra',
    avatar: '🐍',
    age: 21,
    art: 'muaythai',
    rankIndex: 9, // 10º Khan
    weight: 52,
    gymName: 'Petchyindee Academy',
    city: 'Bangkok',
    country: 'Tailândia',
    fightingStyle: 'muay_femur',
    personality: 'frio_calculista',
    baseStat: 36,
    bias: { speed: 10, flexibility: 7, stamina: 7 },
    record: { wins: 40, losses: 7, draws: 1, kos: 12, subs: 0 },
    reputation: 175,
    socialPost: 'Na categoria Palha a velocidade de Teep decide os cinco rounds.'
  },

  // =========================================================================
  // 4. KARATÊ SHOTOKAN / WKF (7º Kyu a 5º Dan — Infantil a Master)
  // =========================================================================
  {
    id: 'kar_inf_yuki',
    name: 'Yuki "Relâmpago" Sato',
    nickname: 'Relâmpago',
    avatar: '⚡',
    age: 11,
    art: 'karate',
    rankIndex: 3, // 4º Kyu Laranja
    weight: 39,
    gymName: 'Dojo Shotokan Liberdade',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'kumite_speed',
    personality: 'respeitoso',
    baseStat: 14,
    bias: { speed: 5, technique: 4, flexibility: 4 },
    record: { wins: 5, losses: 1, draws: 0, kos: 0, subs: 0 },
    reputation: 22,
    socialPost: 'Kihon perfeito e Kata Heian Yondan afiado para a copa infantil!'
  },
  {
    id: 'kar_juv_henrique',
    name: 'Henrique "Kime" Yamada',
    nickname: 'Kime',
    avatar: '🥋',
    age: 15,
    art: 'karate',
    rankIndex: 5, // 2º Kyu Roxa
    weight: 63,
    gymName: 'Seiwakai Karatê',
    city: 'Londrina',
    country: 'Brasil',
    fightingStyle: 'kumite_speed',
    personality: 'frio_calculista',
    baseStat: 23,
    bias: { speed: 6, technique: 5, fightIq: 4 },
    record: { wins: 11, losses: 2, draws: 0, kos: 2, subs: 0 },
    reputation: 54,
    socialPost: 'Kizami-Zuki de entrada marca Ippon antes do árbitro piscar.',
    isStarterRival: true
  },
  {
    id: 'kar_juv_lucas_k',
    name: 'Rodrigo "Mawashi" Farias',
    nickname: 'Mawashi',
    avatar: '🌪️',
    age: 17,
    art: 'karate',
    rankIndex: 7, // 1º Dan Shodan (minAge 16)
    weight: 66,
    gymName: 'Federação Paulista WKF',
    city: 'Campinas',
    country: 'Brasil',
    fightingStyle: 'high_kick',
    personality: 'arrogante',
    baseStat: 28,
    bias: { flexibility: 7, speed: 6, technique: 5 },
    record: { wins: 15, losses: 2, draws: 0, kos: 4, subs: 0 },
    reputation: 75,
    socialPost: 'Recém graduado 1º Dan! Ura-Mawashi-Geri na altura do rosto.'
  },
  {
    id: 'kar_adu_kenjiro',
    name: 'Kenjiro "Budokan" Hayashi',
    nickname: 'Budokan',
    avatar: '🏯',
    age: 24,
    art: 'karate',
    rankIndex: 9, // 3º Dan Sandan (minAge 24)
    weight: 66,
    gymId: 'gym_kodokan_tokyo',
    gymName: 'Instituto Budōkaku de Tóquio',
    city: 'Tóquio',
    country: 'Japão',
    fightingStyle: 'counter_kime',
    personality: 'respeitoso',
    baseStat: 48,
    bias: { technique: 12, speed: 10, fightIq: 9, mentalFocus: 8 },
    record: { wins: 36, losses: 3, draws: 0, kos: 9, subs: 0 },
    reputation: 290,
    socialPost: 'Zanshin absoluto no Nippon Budokan. Um único Gyaku-Zuki encerra o combate.',
    isStarterRival: true
  },
  {
    id: 'kar_adu_rafael_w',
    name: 'Rafael "Águia" Cavalcanti',
    nickname: 'Águia',
    avatar: '🦅',
    age: 22,
    art: 'karate',
    rankIndex: 7, // 1º Dan
    weight: 66,
    gymName: 'Seleção Recife Kumitê Clube',
    city: 'Recife',
    country: 'Brasil',
    fightingStyle: 'kumite_speed',
    personality: 'fanfarrao',
    baseStat: 35,
    bias: { speed: 8, flexibility: 6, stamina: 5 },
    record: { wins: 19, losses: 4, draws: 0, kos: 5, subs: 0 },
    reputation: 145,
    socialPost: 'Campeão Estadual de Kumite pronto para desafiar os japoneses no Mundial.'
  },
  {
    id: 'kar_adu_stanislav',
    name: 'Stanislav "Gelo" Horuna',
    nickname: 'Gelo',
    avatar: '❄️',
    age: 27,
    art: 'karate',
    rankIndex: 8, // 2º Dan
    weight: 75,
    gymName: 'Union Karate Lviv',
    city: 'Lviv',
    country: 'Ucrânia',
    fightingStyle: 'counter_kime',
    personality: 'frio_calculista',
    baseStat: 44,
    bias: { fightIq: 10, technique: 8, strength: 6 },
    record: { wins: 29, losses: 4, draws: 0, kos: 8, subs: 0 },
    reputation: 230,
    socialPost: 'Ashi-Barai preciso seguido de soco no solo (Ippon — 3 pontos!).'
  },
  {
    id: 'kar_adu_vinicius',
    name: 'Vinícius "Tigre Branco" Gomes',
    nickname: 'Tigre Branco',
    avatar: '🐅',
    age: 20,
    art: 'karate',
    rankIndex: 4, // 3º Kyu Verde
    weight: 65,
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'kumite_speed',
    personality: 'respeitoso',
    baseStat: 26,
    bias: { speed: 5, technique: 4, stamina: 4 },
    record: { wins: 6, losses: 2, draws: 0, kos: 1, subs: 0 },
    reputation: 42,
    socialPost: 'Treinando o equilíbrio do Yoko-Geri Kekomi para o Estadual WKF.'
  },
  {
    id: 'kar_adu_luigi',
    name: 'Luigi "Vesúvio" Busà',
    nickname: 'Vesúvio',
    avatar: '🌋',
    age: 26,
    art: 'karate',
    rankIndex: 9, // 3º Dan
    weight: 74,
    gymName: 'Centro Sportivo Roma',
    city: 'Roma',
    country: 'Itália',
    fightingStyle: 'kumite_speed',
    personality: 'arrogante',
    baseStat: 46,
    bias: { speed: 10, fightIq: 9, mentalFocus: 8 },
    record: { wins: 33, losses: 5, draws: 0, kos: 6, subs: 0 },
    reputation: 260,
    socialPost: 'Controle de Ma-ai milimétrico. Ninguém pontua contra minha guarda.'
  },
  {
    id: 'kar_mas_shihan_akira',
    name: 'Shihan Akira "Dragão" Morita',
    nickname: 'Dragão',
    avatar: '🐉',
    age: 41,
    art: 'karate',
    rankIndex: 11, // 5º Dan Shihan (minAge 34)
    weight: 66,
    gymId: 'gym_kodokan_tokyo',
    gymName: 'Instituto Budōkaku de Tóquio',
    city: 'Kyoto',
    country: 'Japão',
    fightingStyle: 'counter_kime',
    personality: 'respeitoso',
    baseStat: 56,
    bias: { technique: 16, fightIq: 16, mentalFocus: 14 },
    record: { wins: 58, losses: 4, draws: 2, kos: 19, subs: 0 },
    reputation: 420,
    socialPost: 'Karatê não é sobre bater primeiro, é sobre ser inabalável no espírito e no Kime.'
  },
  {
    id: 'kar_mas_claudio',
    name: 'Cláudio "Sensei" Nishimura',
    nickname: 'Sensei',
    avatar: '🎋',
    age: 35,
    art: 'karate',
    rankIndex: 10, // 4º Dan
    weight: 81,
    gymName: 'Dojô Harmonia Shotokan',
    city: 'Curitiba',
    country: 'Brasil',
    fightingStyle: 'counter_kime',
    personality: 'frio_calculista',
    baseStat: 49,
    bias: { technique: 12, strength: 8, fightIq: 10 },
    record: { wins: 35, losses: 6, draws: 0, kos: 12, subs: 0 },
    reputation: 270,
    socialPost: 'Categoria Médio Master: cada golpe tem o peso de vinte anos de kata.'
  },
  {
    id: 'kar_adu_diego_kyok',
    name: 'Fabrício "Quebra-Ossos" Teles',
    nickname: 'Quebra-Ossos',
    avatar: '🦴',
    age: 25,
    art: 'karate',
    rankIndex: 8, // 2º Dan
    weight: 91,
    gymName: 'Dojô Araucária Karatê Full',
    city: 'Florianópolis',
    country: 'Brasil',
    fightingStyle: 'full_contact',
    personality: 'arrogante',
    baseStat: 43,
    bias: { durability: 11, strength: 10, stamina: 7 },
    record: { wins: 22, losses: 3, draws: 0, kos: 15, subs: 0 },
    reputation: 195,
    socialPost: 'Peso Meio-Pesado: bloqueio firme e chute circular baixo que mina as pernas.'
  },
  {
    id: 'kar_inf_lara',
    name: 'Lara "Andorinha" Vasques',
    nickname: 'Andorinha',
    avatar: '🕊️',
    age: 13,
    gender: 'F',
    wealthTier: 'classe_media',
    art: 'karate',
    rankIndex: 4, // 3º Kyu Verde
    weight: 49,
    gymId: 'gym_bairro',
    gymName: 'Dojo Caminho Limpo',
    city: 'Belo Horizonte',
    country: 'Brasil',
    fightingStyle: 'kumite_speed',
    personality: 'respeitoso',
    baseStat: 17,
    bias: { speed: 6, flexibility: 6, technique: 4 },
    record: { wins: 7, losses: 1, draws: 0, kos: 0, subs: 0 },
    reputation: 32,
    socialPost: 'Medalha de ouro no Kata e Kumite sub-14! Vamos para o Brasileiro!'
  },

  // =========================================================================
  // 5. JUDÔ (Kodomo Kyu a 10º Dan — Infantil, Juvenil, Adulto, Master)
  // =========================================================================
  {
    id: 'jud_inf_pedro',
    name: 'Pedro "Ippon" Takahashi',
    nickname: 'Ippon',
    avatar: '🥋',
    age: 10,
    art: 'judo',
    rankIndex: 7, // 5º Kyu Amarela e Laranja (minAge 10)
    weight: 38,
    gymName: 'Projeto Estrela do Tatame Mirim',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'seoi_specialist',
    personality: 'respeitoso',
    baseStat: 14,
    bias: { technique: 5, speed: 4, fightIq: 3 },
    record: { wins: 5, losses: 1, draws: 0, kos: 0, subs: 1 },
    reputation: 24,
    socialPost: 'Meu Ippon-Seoi-Nage já derruba até os mais pesados da turma Kodomo!'
  },
  {
    id: 'jud_inf_arthur',
    name: 'Arthur "O-Goshi" Naves',
    nickname: 'O-Goshi',
    avatar: '🌊',
    age: 13,
    art: 'judo',
    rankIndex: 10, // 2º Kyu Roxa (minAge 13)
    weight: 54,
    gymName: 'Projeto Futuro Olímpico',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'ashi_waza',
    personality: 'fanfarrao',
    baseStat: 19,
    bias: { strength: 4, technique: 4, durability: 4 },
    record: { wins: 7, losses: 2, draws: 0, kos: 0, subs: 2 },
    reputation: 34,
    socialPost: 'De-Ashi-Harai na passagem do passo e Kesa-Gatame de 20 segundos!'
  },
  {
    id: 'rival_kaio',
    name: 'Kaio "Samurai" Tanaka',
    nickname: 'Samurai',
    avatar: '🥋',
    age: 16,
    art: 'judo',
    rankIndex: 12, // 1º Dan Preta Shodan (minAge 16)
    weight: 69,
    gymId: 'gym_kodokan_tokyo',
    gymName: 'Instituto Budōkaku de Tóquio',
    city: 'Tóquio',
    country: 'Japão',
    fightingStyle: 'uchi_mata',
    personality: 'respeitoso',
    relationshipScore: 15,
    baseStat: 26,
    bias: { technique: 4, fightIq: 3, mentalFocus: 5 },
    record: { wins: 9, losses: 1, draws: 0, kos: 0, subs: 3 },
    reputation: 60,
    socialPost: 'O verdadeiro guerreiro não busca vencer os outros, mas superar a si mesmo a cada treino.',
    isStarterRival: true
  },
  {
    id: 'jud_juv_diego',
    name: 'Diego "Kuzushi" Lima',
    nickname: 'Kuzushi',
    avatar: '⚖️',
    age: 15,
    art: 'judo',
    rankIndex: 11, // 1º Kyu Marrom (minAge 14)
    weight: 69,
    gymName: 'Clube Paulista de Tatame Olímpico',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'seoi_specialist',
    personality: 'frio_calculista',
    baseStat: 24,
    bias: { technique: 5, stamina: 4, strength: 3 },
    record: { wins: 8, losses: 2, draws: 0, kos: 0, subs: 2 },
    reputation: 49,
    socialPost: 'Preparando Nage-no-Kata para o exame de faixa preta aos 16 anos.'
  },
  {
    id: 'jud_adu_daniel',
    name: 'Daniel "Relâmpago Gaúcho" Bezerra',
    nickname: 'Relâmpago Gaúcho',
    avatar: '🌪️',
    age: 24,
    art: 'judo',
    rankIndex: 13, // 2º Dan (minAge 20)
    weight: 70,
    gymName: 'Clube Olímpico Gaúcho de Judô & Lutas',
    city: 'Porto Alegre',
    country: 'Brasil',
    fightingStyle: 'uchi_mata',
    personality: 'respeitoso',
    baseStat: 42,
    bias: { technique: 9, strength: 7, stamina: 7 },
    record: { wins: 29, losses: 5, draws: 0, kos: 0, subs: 9 },
    reputation: 215,
    socialPost: 'Rumo ao Grand Slam de Paris! Kumikata forte desde o primeiro segundo.'
  },
  {
    id: 'jud_adu_shohei',
    name: 'Shohei "Budōkaku" Ono',
    nickname: 'Budōkaku',
    avatar: '🏯',
    age: 27,
    art: 'judo',
    rankIndex: 14, // 3º Dan (minAge 25)
    weight: 70,
    gymId: 'gym_kodokan_tokyo',
    gymName: 'Instituto Budōkaku de Tóquio',
    city: 'Tenri',
    country: 'Japão',
    fightingStyle: 'uchi_mata',
    personality: 'frio_calculista',
    baseStat: 54,
    bias: { technique: 14, strength: 10, fightIq: 10, mentalFocus: 10 },
    record: { wins: 52, losses: 2, draws: 0, kos: 0, subs: 14 },
    reputation: 380,
    socialPost: 'Uchi-Mata clássico no centro do tatame de Paris. Sem defesa possível.',
    isStarterRival: true
  },
  {
    id: 'jud_adu_lasha',
    name: 'Lasha "Cáucaso" Bekauri',
    nickname: 'Cáucaso',
    avatar: '🏔️',
    age: 23,
    art: 'judo',
    rankIndex: 13, // 2º Dan
    weight: 89,
    gymName: 'Georgian Judo Club',
    city: 'Tbilisi',
    country: 'Geórgia',
    fightingStyle: 'ura_nage',
    personality: 'arrogante',
    baseStat: 48,
    bias: { strength: 12, durability: 9, stamina: 6 },
    record: { wins: 34, losses: 4, draws: 0, kos: 0, subs: 6 },
    reputation: 280,
    socialPost: 'Pegada nas costas e Ura-Nage! Ninguém da Europa fica de pé.'
  },
  {
    id: 'jud_adu_teddy',
    name: 'Teddy "Titã" Riner',
    nickname: 'Titã',
    avatar: '🗼',
    age: 29,
    art: 'judo',
    rankIndex: 14, // 3º Dan
    weight: 118,
    gymName: 'Lutetia Judo Club Paris',
    city: 'Paris',
    country: 'França',
    fightingStyle: 'harai_goshi',
    personality: 'fanfarrao',
    baseStat: 58,
    bias: { strength: 16, durability: 14, fightIq: 8 },
    record: { wins: 61, losses: 3, draws: 0, kos: 0, subs: 12 },
    reputation: 450,
    socialPost: 'Accor Arena em Paris é minha casa. Peso Pesado absoluto do Judô.'
  },
  {
    id: 'jud_adu_thiago_br',
    name: 'Thiago "Ippon" Camilo',
    nickname: 'Ippon',
    avatar: '🥇',
    age: 21,
    art: 'judo',
    rankIndex: 12, // 1º Dan
    weight: 70,
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'seoi_specialist',
    personality: 'respeitoso',
    baseStat: 29,
    bias: { technique: 5, stamina: 4, speed: 4 },
    record: { wins: 12, losses: 3, draws: 0, kos: 0, subs: 4 },
    reputation: 75,
    socialPost: 'Torneio Estadual de Judô chegando. Meta é vencer todas por Ippon!'
  },
  {
    id: 'jud_mas_kenji',
    name: 'Sensei Kenji "Mestre" Takahashi',
    nickname: 'Mestre',
    avatar: '⛩️',
    age: 45,
    art: 'judo',
    rankIndex: 17, // 6º Dan Coral (minAge 44)
    weight: 70,
    gymId: 'gym_kodokan_tokyo',
    gymName: 'Instituto Budōkaku de Tóquio',
    city: 'Tóquio',
    country: 'Japão',
    fightingStyle: 'ashi_waza',
    personality: 'respeitoso',
    baseStat: 56,
    bias: { technique: 18, fightIq: 16, mentalFocus: 15 },
    record: { wins: 74, losses: 6, draws: 1, kos: 0, subs: 28 },
    reputation: 430,
    socialPost: 'Seiryoku-Zenyo: máxima eficiência com o mínimo de esforço no tatame.'
  },
  {
    id: 'jud_adu_flavio',
    name: 'Flávio "Chave" Canto',
    nickname: 'Chave',
    avatar: '🔐',
    age: 26,
    art: 'judo',
    rankIndex: 13, // 2º Dan
    weight: 77,
    gymName: 'Instituto Reação Matriz',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'ne_waza',
    personality: 'frio_calculista',
    baseStat: 44,
    bias: { technique: 10, flexibility: 7, fightIq: 8 },
    record: { wins: 31, losses: 5, draws: 0, kos: 0, subs: 21 },
    reputation: 240,
    socialPost: 'Se cair no solo, o estrangulamento de lapela já está encaixado.'
  },
  {
    id: 'jud_inf_sofia',
    name: 'Sofia "Raio" Murakami',
    nickname: 'Raio',
    avatar: '🌟',
    age: 12,
    gender: 'F',
    wealthTier: 'abastado',
    sponsorName: 'Sakura Cultural Foundation',
    art: 'judo',
    rankIndex: 9, // 3º Kyu Verde (minAge 12)
    weight: 46,
    gymId: 'gym_kodokan_tokyo',
    gymName: 'Associação Cultural Nipo-Brasileira',
    city: 'Curitiba',
    country: 'Brasil',
    fightingStyle: 'ashi_waza',
    personality: 'respeitoso',
    baseStat: 17,
    bias: { speed: 5, technique: 5, flexibility: 4 },
    record: { wins: 6, losses: 1, draws: 0, kos: 0, subs: 2 },
    reputation: 30,
    socialPost: 'Campeã regional sub-13 com O-Soto-Gari e imobilização firme!'
  },

  // =========================================================================
  // 6. CAPOEIRA (Muzenza: 17 Cordas Infantis + 22 Adultas — Infantil a Master)
  // =========================================================================
  {
    id: 'cap_inf_joao',
    name: 'João "Saci" Conceição',
    nickname: 'Saci',
    avatar: '🎶',
    age: 10,
    art: 'capoeira',
    rankIndex: 5, // 6ª Corda Crua-Vermelha
    weight: 36,
    gymName: 'Grupo Muzenza Pelourinho Mirim',
    city: 'Salvador',
    country: 'Brasil',
    fightingStyle: 'mandingueiro',
    personality: 'fanfarrao',
    baseStat: 14,
    bias: { flexibility: 7, speed: 5, stamina: 3 },
    record: { wins: 4, losses: 1, draws: 0, kos: 0, subs: 0 },
    reputation: 20,
    socialPost: 'Na roda do Pelourinho ninguém me pega com rasteira! Só no aú!'
  },
  {
    id: 'cap_juv_marcos',
    name: 'Marcos "Gavião" Santana',
    nickname: 'Gavião',
    avatar: '🦅',
    age: 15,
    art: 'capoeira',
    rankIndex: 14, // 15ª Corda Laranja-Vermelha
    weight: 62,
    gymId: 'gym_terreiro_salvador',
    gymName: 'Terreiro da Malícia & Capoeira Angola',
    city: 'Salvador',
    country: 'Brasil',
    fightingStyle: 'regional_veloz',
    personality: 'respeitoso',
    baseStat: 24,
    bias: { flexibility: 8, speed: 6, stamina: 5 },
    record: { wins: 8, losses: 2, draws: 0, kos: 2, subs: 0 },
    reputation: 50,
    socialPost: 'Meia-lua de compasso com resposta imediata na roda juvenil!'
  },
  {
    id: 'cap_juv_breno',
    name: 'Breno "Ginga" Peixoto',
    nickname: 'Ginga',
    avatar: '🌀',
    age: 17,
    art: 'capoeira',
    rankIndex: 20, // Corda Amarelo-Laranja Adulto (16+)
    weight: 68,
    gymName: 'Muzenza Recife',
    city: 'Recife',
    country: 'Brasil',
    fightingStyle: 'floreio_agressivo',
    personality: 'arrogante',
    baseStat: 27,
    bias: { flexibility: 8, speed: 7, strength: 3 },
    record: { wins: 10, losses: 2, draws: 1, kos: 3, subs: 0 },
    reputation: 64,
    socialPost: 'Transição pro jogo adulto com armada e martelo sem dar descanso!'
  },
  {
    id: 'cap_adu_wendel',
    name: 'Wendel "Corisco" Bispo',
    nickname: 'Corisco',
    avatar: '⚡',
    age: 22,
    art: 'capoeira',
    rankIndex: 23, // Corda Verde
    weight: 70,
    gymId: 'gym_terreiro_salvador',
    gymName: 'Terreiro da Malícia & Capoeira Angola',
    city: 'Salvador',
    country: 'Brasil',
    fightingStyle: 'regional_veloz',
    personality: 'fanfarrao',
    baseStat: 34,
    bias: { flexibility: 10, speed: 9, stamina: 6 },
    record: { wins: 16, losses: 2, draws: 1, kos: 6, subs: 0 },
    reputation: 130,
    socialPost: 'Jogos da Bahia são sagrados. Berimbau gunga tocou, a ginga acende!',
    isStarterRival: true
  },
  {
    id: 'cap_adu_anderson',
    name: 'Anderson "Chita" Almeida',
    nickname: 'Chita',
    avatar: '🐆',
    age: 25,
    art: 'capoeira',
    rankIndex: 27, // Corda Azul Instrutor (minAge 20)
    weight: 69,
    gymName: 'Muzenza Curitiba Matriz',
    city: 'Curitiba',
    country: 'Brasil',
    fightingStyle: 'mandingueiro',
    personality: 'frio_calculista',
    baseStat: 42,
    bias: { flexibility: 12, speed: 10, fightIq: 8 },
    record: { wins: 24, losses: 3, draws: 0, kos: 9, subs: 0 },
    reputation: 195,
    socialPost: 'Jogo de dentro, tesoura de chão e vingativa na hora exata no Brasileiro CBC.'
  },
  {
    id: 'cap_adu_roberto',
    name: 'Roberto "Batuque" Ramos',
    nickname: 'Batuque',
    avatar: '🥁',
    age: 27,
    art: 'capoeira',
    rankIndex: 28, // Professor 1º Grau (minAge 22)
    weight: 77,
    gymName: 'Abadá Capoeira Rio',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'floreio_agressivo',
    personality: 'respeitoso',
    baseStat: 45,
    bias: { strength: 7, flexibility: 11, stamina: 9 },
    record: { wins: 28, losses: 4, draws: 1, kos: 11, subs: 0 },
    reputation: 230,
    socialPost: 'Capoeira é luta, arte e resistência. Respeito máximo na roda nacional.'
  },
  {
    id: 'cap_adu_tiago',
    name: 'Tiago "Besouro" Natividade',
    nickname: 'Besouro',
    avatar: '🪲',
    age: 21,
    art: 'capoeira',
    rankIndex: 18, // Cinza-Amarelo Adulto
    weight: 65,
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    city: 'Feira de Santana',
    country: 'Brasil',
    fightingStyle: 'mandingueiro',
    personality: 'respeitoso',
    baseStat: 27,
    bias: { flexibility: 7, speed: 5, stamina: 5 },
    record: { wins: 7, losses: 2, draws: 0, kos: 2, subs: 0 },
    reputation: 48,
    socialPost: 'Treinando esquiva negativa e rasteira de encontro pros Jogos da Bahia.'
  },
  {
    id: 'cap_mas_mestre_bimba',
    name: 'Mestre "Cobra Coral" da Lapa',
    nickname: 'Cobra Coral',
    avatar: '🪘',
    age: 44,
    art: 'capoeira',
    rankIndex: 34, // Mestre 1º Grau (minAge 42)
    weight: 70,
    gymId: 'gym_terreiro_salvador',
    gymName: 'Terreiro da Malícia & Capoeira Angola',
    city: 'Salvador',
    country: 'Brasil',
    fightingStyle: 'mandingueiro',
    personality: 'frio_calculista',
    baseStat: 54,
    bias: { flexibility: 14, fightIq: 16, mentalFocus: 14, technique: 12 },
    record: { wins: 52, losses: 3, draws: 4, kos: 16, subs: 0 },
    reputation: 390,
    socialPost: 'Quem entra na roda sem ouvir o berimbau cai na primeira rasteira de mandinga.'
  },
  {
    id: 'cap_mas_contramestre',
    name: 'Contramestre "Relíquia" Tavares',
    nickname: 'Relíquia',
    avatar: '🪕',
    age: 34,
    art: 'capoeira',
    rankIndex: 31, // Contramestre 1º Grau (minAge 32)
    weight: 76,
    gymName: 'Grupo Muzenza São Paulo',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'regional_veloz',
    personality: 'respeitoso',
    baseStat: 48,
    bias: { flexibility: 11, strength: 7, speed: 8 },
    record: { wins: 37, losses: 5, draws: 2, kos: 14, subs: 0 },
    reputation: 280,
    socialPost: 'A malícia da Regional Baiana continua viva no Campeonato Brasileiro.'
  },
  {
    id: 'cap_adu_luan',
    name: 'Luan "Tornado" Xavier',
    nickname: 'Tornado',
    avatar: '🌪️',
    age: 24,
    art: 'capoeira',
    rankIndex: 25, // Verde-Azul Formado
    weight: 57,
    gymName: 'Muzenza Fortaleza',
    city: 'Fortaleza',
    country: 'Brasil',
    fightingStyle: 'floreio_agressivo',
    personality: 'fanfarrao',
    baseStat: 37,
    bias: { speed: 11, flexibility: 11, stamina: 6 },
    record: { wins: 19, losses: 3, draws: 0, kos: 5, subs: 0 },
    reputation: 155,
    socialPost: 'Macaco, aú sem mãos e chapa giratória sem tocar o chão!'
  },
  {
    id: 'cap_inf_bia',
    name: 'Bia "Pimenta" Oliveira',
    nickname: 'Pimenta',
    avatar: '🌶️',
    age: 12,
    gender: 'F',
    wealthTier: 'humilde',
    art: 'capoeira',
    rankIndex: 9, // 10ª Corda Cinza-Vermelha
    weight: 44,
    gymId: 'gym_terreiro_salvador',
    gymName: 'Capoeira Arte Bahia',
    city: 'Salvador',
    country: 'Brasil',
    fightingStyle: 'mandingueiro',
    personality: 'respeitoso',
    baseStat: 16,
    bias: { flexibility: 7, speed: 5, stamina: 4 },
    record: { wins: 6, losses: 1, draws: 0, kos: 0, subs: 0 },
    reputation: 28,
    socialPost: 'Na roda infantil ninguém supera minha queixada e meu canto de ladainha!'
  },
  {
    id: 'cap_adu_yago',
    name: 'Yago "Onça" Ribeiro',
    nickname: 'Onça',
    avatar: '🐆',
    age: 26,
    art: 'capoeira',
    rankIndex: 26, // Monitor (minAge 18)
    weight: 83,
    gymName: 'Senzala Rio',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'regional_veloz',
    personality: 'arrogante',
    baseStat: 40,
    bias: { strength: 9, flexibility: 8, durability: 6 },
    record: { wins: 20, losses: 4, draws: 0, kos: 9, subs: 0 },
    reputation: 170,
    socialPost: 'Meia-lua de compasso peso Médio derruba até lutador de trocação!'
  },

  // =========================================================================
  // 7. LUTA LIVRE ESPORTIVA (LLE — CBLLE, Submission & Grappling No-Gi)
  // =========================================================================
  {
    id: 'lle_inf_lucas',
    name: 'Cauê "Enguia" Martins',
    nickname: 'Enguia',
    avatar: '🐍',
    age: 12,
    art: 'lutalivre',
    rankIndex: 3, // Cinza c/ Ponta Amarela
    weight: 47,
    gymName: 'Luta Livre Subúrbio Carioca',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'no_gi_scramble',
    personality: 'respeitoso',
    baseStat: 16,
    bias: { speed: 5, stamina: 5, technique: 4 },
    record: { wins: 5, losses: 1, draws: 0, kos: 0, subs: 4 },
    reputation: 24,
    socialPost: 'Sem kimono desde criança: baiana rápida e guilhotina no pescoço!'
  },
  {
    id: 'lle_juv_vitor',
    name: 'Vítor "Bate-Estaca" Andrade',
    nickname: 'Bate-Estaca',
    avatar: '🔨',
    age: 16,
    art: 'lutalivre',
    rankIndex: 8, // Azul LLE (minAge 16)
    weight: 74,
    gymName: 'RFT Rio',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'wrestler_lle',
    personality: 'arrogante',
    baseStat: 26,
    bias: { strength: 6, stamina: 5, durability: 4 },
    record: { wins: 9, losses: 2, draws: 0, kos: 1, subs: 6 },
    reputation: 56,
    socialPost: 'Baiana explosiva no juvenil até 77kg. Quem não tiver sprawl cai de costas!'
  },
  {
    id: 'rival_magomed',
    name: 'Magomed "O Urso" Aliyev',
    nickname: 'O Urso',
    avatar: '🐻',
    age: 19,
    art: 'lutalivre',
    rankIndex: 10, // Faixa Marrom de LLE (minAge 18)
    weight: 76,
    gymId: 'gym_dagestan_mountains',
    gymName: 'Caucasus Iron Peak Sambo & Grappling Base',
    city: 'Makhachkala',
    country: 'Rússia',
    fightingStyle: 'dagestan_pressure',
    personality: 'frio_calculista',
    relationshipScore: -50,
    baseStat: 35,
    bias: { strength: 3, stamina: 7, durability: 5, flexibility: -13 },
    record: { wins: 14, losses: 0, draws: 0, kos: 4, subs: 6 },
    reputation: 150,
    socialPost: 'O grappling sem quimono e a Luta Livre são imbatíveis. Ninguém para minha queda e pressão no solo.',
    isStarterRival: true
  },
  {
    id: 'lle_adu_rodrigo',
    name: 'Rodrigo "Tatu" Magalhães',
    nickname: 'Tatu',
    avatar: '🦡',
    age: 24,
    art: 'lutalivre',
    rankIndex: 11, // Preta LLE (minAge 19)
    weight: 77,
    gymName: 'Copacabana Luta Livre & Vale-Tudo',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'leglock_hunter',
    personality: 'fanfarrao',
    baseStat: 43,
    bias: { technique: 9, flexibility: 7, stamina: 7 },
    record: { wins: 25, losses: 4, draws: 0, kos: 0, subs: 20 },
    reputation: 205,
    socialPost: 'Chave de calcanhar e mata-leão na Copa Brasil de Luta Livre!'
  },
  {
    id: 'lle_adu_islam',
    name: 'Umar "Lobo do Cáucaso" Nurma',
    nickname: 'Lobo',
    avatar: '🐺',
    age: 25,
    art: 'lutalivre',
    rankIndex: 10, // Marrom LLE
    weight: 70,
    gymId: 'gym_dagestan_mountains',
    gymName: 'Caucasus Iron Peak Sambo & Grappling Base',
    city: 'Makhachkala',
    country: 'Rússia',
    fightingStyle: 'dagestan_pressure',
    personality: 'frio_calculista',
    baseStat: 45,
    bias: { stamina: 10, strength: 8, fightIq: 8 },
    record: { wins: 23, losses: 1, draws: 0, kos: 2, subs: 15 },
    reputation: 240,
    socialPost: 'Controle de punho, single leg e pressão infinita até o adversário desistir.'
  },
  {
    id: 'lle_adu_danilo',
    name: 'Danilo "Esgana-Galo" Costa',
    nickname: 'Esgana-Galo',
    avatar: '🐓',
    age: 22,
    art: 'lutalivre',
    rankIndex: 9, // Roxa LLE
    weight: 66,
    gymName: 'Copacabana Luta Livre & Vale-Tudo',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'no_gi_scramble',
    personality: 'respeitoso',
    baseStat: 34,
    bias: { speed: 7, stamina: 6, technique: 6 },
    record: { wins: 15, losses: 3, draws: 0, kos: 0, subs: 11 },
    reputation: 120,
    socialPost: 'Guilhotina e D\'Arce Choke em transição rápida sem dar espaço.'
  },
  {
    id: 'lle_adu_bruno_suplex',
    name: 'Bruno "Suplê" Fonseca',
    nickname: 'Suplê',
    avatar: '🏋️',
    age: 23,
    art: 'lutalivre',
    rankIndex: 8, // Azul LLE
    weight: 77,
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'wrestler_lle',
    personality: 'fanfarrao',
    baseStat: 31,
    bias: { strength: 7, durability: 6, stamina: 4 },
    record: { wins: 10, losses: 2, draws: 0, kos: 1, subs: 5 },
    reputation: 88,
    socialPost: 'Se entrar no meu clinch de cintura, vai voar de suplê na Copa Brasil de LLE!'
  },
  {
    id: 'lle_adu_gordon',
    name: 'Ethan "Leglock" Mercer',
    nickname: 'Leglock',
    avatar: '🦵',
    age: 27,
    art: 'lutalivre',
    rankIndex: 11, // Preta LLE
    weight: 84,
    gymName: 'Austin No-Gi Submission Lab',
    city: 'Austin',
    country: 'Estados Unidos',
    fightingStyle: 'leglock_hunter',
    personality: 'arrogante',
    baseStat: 50,
    bias: { technique: 13, fightIq: 11, flexibility: 8 },
    record: { wins: 34, losses: 3, draws: 0, kos: 0, subs: 29 },
    reputation: 315,
    socialPost: 'Ashi Garami e Heel Hook. Entregou o calcanhar, a luta acaba em 3 segundos.'
  },
  {
    id: 'lle_mas_cromado',
    name: 'Mestre Júlio "Cromado" Braga',
    nickname: 'Cromado',
    avatar: '🦾',
    age: 36,
    art: 'lutalivre',
    rankIndex: 12, // Mestre 1-5 Dan (minAge 25)
    weight: 77,
    gymName: 'Copacabana Luta Livre & Vale-Tudo',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'leglock_hunter',
    personality: 'respeitoso',
    baseStat: 51,
    bias: { technique: 12, fightIq: 11, strength: 8 },
    record: { wins: 45, losses: 7, draws: 1, kos: 3, subs: 34 },
    reputation: 340,
    socialPost: 'Luta Livre Esportiva é patrimônio brasileiro da luta agarrada sem pano.'
  },
  {
    id: 'lle_adu_igor_hw',
    name: 'Igor "Mamute" Kolesnikov',
    nickname: 'Mamute',
    avatar: '🦣',
    age: 28,
    art: 'lutalivre',
    rankIndex: 11, // Preta LLE
    weight: 105,
    gymName: 'Neva Grappling Academy',
    city: 'São Petersburgo',
    country: 'Rússia',
    fightingStyle: 'wrestler_lle',
    personality: 'frio_calculista',
    baseStat: 52,
    bias: { strength: 14, durability: 11, stamina: 6 },
    record: { wins: 29, losses: 3, draws: 0, kos: 5, subs: 16 },
    reputation: 295,
    socialPost: 'Peso Pesado sem kimono: pressão de ombro que tira todo o ar do oponente.'
  },
  {
    id: 'lle_juv_kaio_m',
    name: 'Kaio "Sombra" Meireles',
    nickname: 'Sombra',
    avatar: '🌑',
    age: 14,
    art: 'lutalivre',
    rankIndex: 6, // Laranja LLE
    weight: 60,
    gymName: 'Projeto Tatame da Lapa & Subúrbio',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'no_gi_scramble',
    personality: 'respeitoso',
    baseStat: 20,
    bias: { speed: 5, stamina: 5, technique: 4 },
    record: { wins: 7, losses: 1, draws: 0, kos: 0, subs: 5 },
    reputation: 38,
    socialPost: 'Treinando sprawl e pegada de costas sem parar para o campeonato estadual!'
  },
  {
    id: 'lle_adu_mateus_fly',
    name: 'Mateus "Vespa" Cunha',
    nickname: 'Vespa',
    avatar: '🐝',
    age: 23,
    art: 'lutalivre',
    rankIndex: 9, // Roxa LLE
    weight: 56,
    gymName: 'Curitiba Thai & Vale-Tudo Academy',
    city: 'Curitiba',
    country: 'Brasil',
    fightingStyle: 'no_gi_scramble',
    personality: 'fanfarrao',
    baseStat: 35,
    bias: { speed: 10, stamina: 7, flexibility: 6 },
    record: { wins: 16, losses: 3, draws: 0, kos: 0, subs: 12 },
    reputation: 135,
    socialPost: 'Peso Mosca no no-gi é guerra em alta velocidade do primeiro ao último segundo!'
  },

  // =========================================================================
  // 8. MMA — ARTES MARCIAIS MISTAS (Amador, Jungle Fight, LFA, Top 15, Campeão)
  // =========================================================================
  {
    id: 'mma_juv_lucas',
    name: 'Lucas "Híbrido" Ferraz',
    nickname: 'Híbrido',
    avatar: '⚔️',
    age: 17,
    art: 'mma',
    rankIndex: 0, // Estreante Amador (minAge 16)
    weight: 69,
    gymName: 'Clube Guanabara Octógono',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'striker_grappler',
    personality: 'respeitoso',
    baseStat: 28,
    bias: { stamina: 5, technique: 4, speed: 4 },
    record: { wins: 4, losses: 0, draws: 0, kos: 2, subs: 2 },
    reputation: 65,
    socialPost: 'Seletiva Nacional de MMA Amador chegando. Tudo pronto em pé e no chão!'
  },
  {
    id: 'mma_adu_caio_amador',
    name: 'Caio "Selva" Vasconcelos',
    nickname: 'Selva',
    avatar: '🐆',
    age: 20,
    art: 'mma',
    rankIndex: 0, // Estreante Amador
    weight: 70,
    gymName: 'Manaus Selva Combat Team',
    city: 'Manaus',
    country: 'Brasil',
    fightingStyle: 'brawler',
    personality: 'fanfarrao',
    baseStat: 34,
    bias: { strength: 6, durability: 6, stamina: 4 },
    record: { wins: 6, losses: 1, draws: 0, kos: 4, subs: 1 },
    reputation: 95,
    socialPost: 'Do Amazonas direto para o cage nacional! Ninguém aguenta minha pressão.'
  },
  {
    id: 'mma_adu_bruno_jungle',
    name: 'Bruno "Paredão" Queiroz',
    nickname: 'Paredão',
    avatar: '🧱',
    age: 23,
    art: 'mma',
    rankIndex: 1, // Circuito Regional Jungle Fight (minAge 18)
    weight: 70,
    gymName: 'Academia Paulista Central Octógono',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'striker',
    personality: 'arrogante',
    baseStat: 43,
    bias: { strength: 8, durability: 7, speed: 6 },
    record: { wins: 9, losses: 1, draws: 0, kos: 6, subs: 2 },
    reputation: 185,
    socialPost: 'Jungle Fight é guerra! Trocação franca e joelhada no clinche da grade.',
    isStarterRival: true
  },
  {
    id: 'mma_adu_alex_lfa',
    name: 'Alexandre "Mão de Pedra" Pereira',
    nickname: 'Mão de Pedra',
    avatar: '🗿',
    age: 26,
    art: 'mma',
    rankIndex: 2, // Prospecto Internacional
    weight: 84,
    gymName: 'Connecticut Iron Fist MMA',
    city: 'Danbury',
    country: 'Estados Unidos',
    fightingStyle: 'striker',
    personality: 'frio_calculista',
    baseStat: 52,
    bias: { strength: 14, durability: 8, fightIq: 8 },
    record: { wins: 13, losses: 2, draws: 0, kos: 11, subs: 0 },
    reputation: 310,
    socialPost: 'Cruzado de esquerda calibrado. Chama no octógono!'
  },
  {
    id: 'mma_adu_charles_top15',
    name: 'Carlos "Iluminado" Oliveira',
    nickname: 'Iluminado',
    avatar: '🦁',
    age: 27,
    art: 'mma',
    rankIndex: 3, // Top 15 Mundial
    weight: 70,
    gymId: 'gym_american_top_team',
    gymName: 'Apex Atlantic Octagon Facility',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'grappler_striker',
    personality: 'respeitoso',
    baseStat: 56,
    bias: { technique: 12, stamina: 9, durability: 8, fightIq: 10 },
    record: { wins: 24, losses: 4, draws: 0, kos: 8, subs: 14 },
    reputation: 420,
    socialPost: 'Do bairro simples pro Top 15 do mundo. O campeão tem nome e coração!',
    isStarterRival: true
  },
  {
    id: 'mma_adu_islam_champ',
    name: 'Khabir "Águia do Norte" Makha',
    nickname: 'Águia do Norte',
    avatar: '🦅',
    age: 28,
    art: 'mma',
    rankIndex: 4, // Desafiante #1 / Elite
    weight: 70,
    gymId: 'gym_dagestan_mountains',
    gymName: 'Caucasus Iron Peak Sambo & Grappling Base',
    city: 'Makhachkala',
    country: 'Rússia',
    fightingStyle: 'dagestan_pressure',
    personality: 'frio_calculista',
    baseStat: 60,
    bias: { strength: 11, stamina: 14, fightIq: 12, technique: 10 },
    record: { wins: 26, losses: 1, draws: 0, kos: 5, subs: 13 },
    reputation: 520,
    socialPost: 'Main Event PPV de 5 rounds. Eu controlo a distância, derrubo contra a grade e finalizo.'
  },
  {
    id: 'mma_adu_deiveson_fly',
    name: 'Deiveson "Deus da Guerra" Moura',
    nickname: 'Deus da Guerra',
    avatar: '⚔️',
    age: 26,
    art: 'mma',
    rankIndex: 3, // Top 15
    weight: 57,
    gymName: 'Belém Marajó Fight Team',
    city: 'Belém',
    country: 'Brasil',
    fightingStyle: 'brawler',
    personality: 'arrogante',
    baseStat: 49,
    bias: { strength: 10, speed: 10, durability: 8 },
    record: { wins: 19, losses: 3, draws: 0, kos: 10, subs: 6 },
    reputation: 310,
    socialPost: 'Peso Mosca com mão de Peso Pesado e guilhotina letal!'
  },
  {
    id: 'mma_adu_rafael_ww',
    name: 'Rafael "Fera" Montenegro',
    nickname: 'Fera',
    avatar: '🐺',
    age: 25,
    art: 'mma',
    rankIndex: 2, // Prospecto Internacional
    weight: 77,
    gymId: 'gym_american_top_team',
    gymName: 'Apex Atlantic Octagon Facility',
    city: 'Coconut Creek',
    country: 'Estados Unidos',
    fightingStyle: 'well_rounded',
    personality: 'respeitoso',
    baseStat: 48,
    bias: { stamina: 9, technique: 8, fightIq: 8 },
    record: { wins: 14, losses: 2, draws: 0, kos: 7, subs: 4 },
    reputation: 245,
    socialPost: 'Meio-Médio com trocação de Muay Thai e defesa de queda 100%.'
  },
  {
    id: 'mma_mas_glover',
    name: 'Glover "Rocha" Monteiro',
    nickname: 'Rocha',
    avatar: '🪨',
    age: 35,
    art: 'mma',
    rankIndex: 4, // Desafiante #1
    weight: 93,
    gymName: 'Belo Horizonte Mineiro Combat',
    city: 'Belo Horizonte',
    country: 'Brasil',
    fightingStyle: 'grappler_striker',
    personality: 'respeitoso',
    baseStat: 56,
    bias: { durability: 14, strength: 12, fightIq: 12 },
    record: { wins: 31, losses: 6, draws: 0, kos: 17, subs: 10 },
    reputation: 410,
    socialPost: 'Nunca é tarde para conquistar o cinturão mundial dos Meio-Pesados.'
  },
  {
    id: 'mma_adu_tom_hw',
    name: 'Tom "Relâmpago Inglês" Aspinall',
    nickname: 'Relâmpago',
    avatar: '⚡',
    age: 28,
    art: 'mma',
    rankIndex: 5, // Campeão Mundial Peso por Peso
    weight: 114,
    gymName: 'Merseyside Striker Club Liverpool',
    city: 'Manchester',
    country: 'Reino Unido',
    fightingStyle: 'well_rounded',
    personality: 'respeitoso',
    baseStat: 62,
    bias: { strength: 15, speed: 12, technique: 10 },
    record: { wins: 22, losses: 2, draws: 0, kos: 17, subs: 4 },
    reputation: 560,
    wealthTier: 'milionario',
    sponsorName: 'EuroFight PPV Global',
    socialPost: 'Peso Pesado se movimentando como Peso Leve. Pronto para defender o cinturão!'
  },

  // =========================================================================
  // 9. ATLETAS DO SEXO FEMININO & RIVAIS RICOS/PATROCINADOS (TODAS AS 8 ARTES)
  // =========================================================================
  {
    id: 'bjj_fem_helena_rica',
    name: 'Helena "Valquíria" Montblanc',
    nickname: 'Valquíria',
    avatar: '💎',
    age: 23,
    gender: 'F',
    wealthTier: 'milionario',
    sponsorName: 'Montblanc Holdings & Alpha Gi',
    art: 'jiujitsu',
    rankIndex: 6, // Roxa
    weight: 56,
    gymId: 'gym_gracie_rio',
    gymName: 'Templo Carioca da Arte Suave',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'guardeiro',
    personality: 'arrogante',
    relationshipScore: -20,
    baseStat: 42,
    bias: { flexibility: 11, technique: 10, fightIq: 8 },
    record: { wins: 26, losses: 2, draws: 0, kos: 0, subs: 19 },
    reputation: 245,
    socialPost: 'Trago preparador suíço particular e tatame climatizado pro Mundial. Ninguém passa minha guarda de lapela!',
    isStarterRival: true
  },
  {
    id: 'bjj_fem_bia_mesquita',
    name: 'Beatriz "Tempestade" Lemos',
    nickname: 'Tempestade',
    avatar: '🌩️',
    age: 26,
    gender: 'F',
    wealthTier: 'abastado',
    sponsorName: 'Kimonos Titan Pro',
    art: 'jiujitsu',
    rankIndex: 8, // Preta
    weight: 60,
    gymId: 'gym_gracie_rio',
    gymName: 'Templo Carioca da Arte Suave',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'finalizador',
    personality: 'respeitoso',
    baseStat: 51,
    bias: { technique: 13, stamina: 9, fightIq: 10 },
    record: { wins: 44, losses: 4, draws: 0, kos: 0, subs: 35 },
    reputation: 360,
    socialPost: 'Campeã peso e absoluto no Pan-Americano. Armlock das costas não tem escapatória.'
  },
  {
    id: 'bjj_fem_giovanna_juv',
    name: 'Giovanna "Sereia" Teles',
    nickname: 'Sereia',
    avatar: '🧜‍♀️',
    age: 16,
    gender: 'F',
    wealthTier: 'classe_media',
    art: 'jiujitsu',
    rankIndex: 5, // Azul juvenil
    weight: 55,
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'defensivo',
    personality: 'respeitoso',
    baseStat: 25,
    bias: { flexibility: 7, stamina: 5, technique: 5 },
    record: { wins: 10, losses: 2, draws: 0, kos: 0, subs: 6 },
    reputation: 58,
    socialPost: 'Recém-graduada à faixa azul aos 16 anos! Retenção de guarda intransponível.'
  },
  {
    id: 'bjj_mas_enzo_magnata',
    name: 'Enzo "Magnata" D\'Ávila',
    nickname: 'Magnata',
    avatar: '🥂',
    age: 27,
    gender: 'M',
    wealthTier: 'milionario',
    sponsorName: 'Grupo D\'Ávila Aviation',
    art: 'jiujitsu',
    rankIndex: 7, // Marrom
    weight: 83,
    gymId: 'gym_american_top_team',
    gymName: 'Apex Atlantic Octagon Facility',
    city: 'Coconut Creek',
    country: 'Estados Unidos',
    fightingStyle: 'pressionador',
    personality: 'fanfarrao',
    baseStat: 46,
    bias: { strength: 9, stamina: 9, technique: 8 },
    record: { wins: 29, losses: 3, draws: 0, kos: 0, subs: 18 },
    reputation: 295,
    socialPost: 'Jatinho pousou em Miami pro camp privado. Dinheiro não luta por você, mas compra os melhores sparrings do mundo!'
  },
  {
    id: 'boxe_fem_beatriz_leoa',
    name: 'Beatriz "Leoa Olímpica" Ferreira',
    nickname: 'Leoa Olímpica',
    avatar: '🦁',
    age: 26,
    gender: 'F',
    wealthTier: 'abastado',
    sponsorName: 'Banco Esportivo Nacional',
    art: 'boxe',
    rankIndex: 3, // Professora CBBoxe
    weight: 60,
    gymId: 'gym_wild_card_la',
    gymName: 'Sunset Boulevard Boxing Club',
    city: 'Salvador',
    country: 'Brasil',
    fightingStyle: 'pressure',
    personality: 'respeitoso',
    baseStat: 50,
    bias: { speed: 12, stamina: 12, technique: 10 },
    record: { wins: 36, losses: 2, draws: 0, kos: 18, subs: 0 },
    reputation: 340,
    socialPost: 'Volume implacável na curta distância e movimentação de cabeça incansável!',
    isStarterRival: true
  },
  {
    id: 'boxe_fem_camila_herdeira',
    name: 'Camila "Diamante" Rothschild',
    nickname: 'Diamante',
    avatar: '💍',
    age: 22,
    gender: 'F',
    wealthTier: 'milionario',
    sponsorName: 'Maison Rothschild Couture',
    art: 'boxe',
    rankIndex: 2, // Instrutor
    weight: 56,
    gymId: 'gym_wild_card_la',
    gymName: 'Sunset Boulevard Boxing Club',
    city: 'Los Angeles',
    country: 'Estados Unidos',
    fightingStyle: 'outboxer',
    personality: 'arrogante',
    baseStat: 41,
    bias: { speed: 11, fightIq: 8, technique: 7 },
    record: { wins: 18, losses: 1, draws: 0, kos: 9, subs: 0 },
    reputation: 265,
    socialPost: 'Treinando na Sunset Boulevard com equipe completa de biomédicos. Ninguém encosta no meu rosto!'
  },
  {
    id: 'boxe_fem_isabela_inf',
    name: 'Isabela "Faísca" Monteiro',
    nickname: 'Faísca',
    avatar: '✨',
    age: 13,
    gender: 'F',
    wealthTier: 'humilde',
    art: 'boxe',
    rankIndex: 1, // Avançado
    weight: 50,
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    city: 'São Paulo',
    country: 'Brasil',
    fightingStyle: 'counter',
    personality: 'respeitoso',
    baseStat: 17,
    bias: { speed: 6, fightIq: 4, technique: 4 },
    record: { wins: 7, losses: 1, draws: 0, kos: 1, subs: 0 },
    reputation: 34,
    socialPost: 'De luva emprestada no bairro pro pódio paulista de Boxe Infantil!'
  },
  {
    id: 'mt_fem_valentina_bala',
    name: 'Valentina "Bala de Prata" Volkov',
    nickname: 'Bala de Prata',
    avatar: '🎯',
    age: 27,
    gender: 'F',
    wealthTier: 'milionario',
    sponsorName: 'Vortex Luxury Athletics',
    art: 'muaythai',
    rankIndex: 4, // Prajead Preto
    weight: 57,
    gymId: 'gym_tiger_phuket',
    gymName: 'Siam Thunder Muay Thai & MMA Camp',
    city: 'Phuket',
    country: 'Tailândia',
    fightingStyle: 'muay_femur',
    personality: 'frio_calculista',
    baseStat: 55,
    bias: { technique: 14, speed: 11, fightIq: 12 },
    record: { wins: 49, losses: 3, draws: 0, kos: 22, subs: 0 },
    reputation: 410,
    socialPost: 'Precisão milimétrica no chute rodado e contragolpe de esquerda. Perfeição técnica em Phuket.',
    isStarterRival: true
  },
  {
    id: 'mt_fem_stamp_lanna',
    name: 'Nadia "Lótus de Ferro" Kaew',
    nickname: 'Lótus',
    avatar: '🪷',
    age: 24,
    gender: 'F',
    wealthTier: 'abastado',
    sponsorName: 'Bangkok Fight Gear',
    art: 'muaythai',
    rankIndex: 3, // Instrutor
    weight: 52,
    gymId: 'gym_tiger_phuket',
    gymName: 'Siam Thunder Muay Thai & MMA Camp',
    city: 'Pattaya',
    country: 'Tailândia',
    fightingStyle: 'muay_khao',
    personality: 'fanfarrao',
    baseStat: 45,
    bias: { stamina: 10, durability: 8, strength: 7 },
    record: { wins: 39, losses: 5, draws: 1, kos: 14, subs: 0 },
    reputation: 280,
    socialPost: 'Clinch de Muay Khao no Lumpinee! Joelhada no abdômen até derrubar!'
  },
  {
    id: 'mt_fem_jessica_juv',
    name: 'Jéssica "Navalha" Pires',
    nickname: 'Navalha',
    avatar: '🪒',
    age: 17,
    gender: 'F',
    wealthTier: 'classe_media',
    art: 'muaythai',
    rankIndex: 2, // Azul e Ponta
    weight: 56,
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    city: 'Curitiba',
    country: 'Brasil',
    fightingStyle: 'muay_sok',
    personality: 'arrogante',
    baseStat: 26,
    bias: { strength: 5, durability: 5, speed: 4 },
    record: { wins: 11, losses: 2, draws: 0, kos: 5, subs: 0 },
    reputation: 68,
    socialPost: 'Cotovelo afiado na curta distância no juvenil! Respeita a escola curitibana!'
  },
  {
    id: 'kar_fem_sandra',
    name: 'Sandra "Imperatriz" Sánchez',
    nickname: 'Imperatriz',
    avatar: '👸',
    age: 31,
    gender: 'F',
    wealthTier: 'abastado',
    sponsorName: 'Ibéria Sport Elite',
    art: 'karate',
    rankIndex: 10, // 4º Dan
    weight: 55,
    gymId: 'gym_kodokan_tokyo',
    gymName: 'Instituto Budōkaku de Tóquio',
    city: 'Madri',
    country: 'Espanha',
    fightingStyle: 'counter_kime',
    personality: 'respeitoso',
    baseStat: 53,
    bias: { technique: 14, speed: 12, mentalFocus: 11 },
    record: { wins: 54, losses: 3, draws: 0, kos: 12, subs: 0 },
    reputation: 390,
    socialPost: 'Kata e Kumite com potência pura na categoria Master & Mundial WKF.'
  },
  {
    id: 'kar_mas_lorenzo_rico',
    name: 'Lorenzo "Barão" Bellini',
    nickname: 'Barão',
    avatar: '🎩',
    age: 24,
    gender: 'M',
    wealthTier: 'milionario',
    sponsorName: 'Bellini Motors Milano',
    art: 'karate',
    rankIndex: 8, // 2º Dan
    weight: 76,
    gymId: 'gym_kodokan_tokyo',
    gymName: 'Instituto Budōkaku de Tóquio',
    city: 'Milão',
    country: 'Itália',
    fightingStyle: 'high_kick',
    personality: 'arrogante',
    baseStat: 43,
    bias: { speed: 10, flexibility: 10, fightIq: 7 },
    record: { wins: 25, losses: 3, draws: 0, kos: 11, subs: 0 },
    reputation: 250,
    socialPost: 'Financio o próprio circuito europeu. Meu Ura-Mawashi vale três pontos antes do adversário piscar.'
  },
  {
    id: 'jud_fem_rafaela',
    name: 'Rafaela "Ouro da Cidade" Silva',
    nickname: 'Ouro',
    avatar: '🏅',
    age: 26,
    gender: 'F',
    wealthTier: 'abastado',
    sponsorName: 'Energia Brasil Olímpica',
    art: 'judo',
    rankIndex: 14, // 3º Dan
    weight: 57,
    gymId: 'gym_gracie_rio',
    gymName: 'Templo Carioca da Arte Suave',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'seoi_specialist',
    personality: 'respeitoso',
    baseStat: 51,
    bias: { technique: 12, strength: 10, stamina: 9 },
    record: { wins: 47, losses: 5, draws: 0, kos: 0, subs: 16 },
    reputation: 375,
    socialPost: 'Da Cidade de Deus para o topo do ranking mundial de Judô! Ippon no primeiro minuto!'
  },
  {
    id: 'jud_fem_clarisse',
    name: 'Clarisse "Pantera" Moreau',
    nickname: 'Pantera',
    avatar: '🐆',
    age: 28,
    gender: 'F',
    wealthTier: 'milionario',
    sponsorName: 'Maison Paris Combat',
    art: 'judo',
    rankIndex: 14, // 3º Dan
    weight: 64,
    gymId: 'gym_kodokan_tokyo',
    gymName: 'Instituto Budōkaku de Tóquio',
    city: 'Paris',
    country: 'França',
    fightingStyle: 'harai_goshi',
    personality: 'frio_calculista',
    baseStat: 56,
    bias: { strength: 13, technique: 14, mentalFocus: 10 },
    record: { wins: 59, losses: 3, draws: 0, kos: 0, subs: 19 },
    reputation: 445,
    socialPost: 'Grand Slam de Paris e Tóquio no currículo. Pegada dominante desde o Hajime.'
  },
  {
    id: 'cap_fem_patricia_rica',
    name: 'Patrícia "Ginga de Ouro" Vasconcelos',
    nickname: 'Ginga de Ouro',
    avatar: '👑',
    age: 25,
    gender: 'F',
    wealthTier: 'milionario',
    sponsorName: 'Fundação Cultural Bahia & Ouro',
    art: 'capoeira',
    rankIndex: 27, // Instrutora
    weight: 60,
    gymId: 'gym_terreiro_salvador',
    gymName: 'Terreiro da Malícia & Capoeira Angola',
    city: 'Salvador',
    country: 'Brasil',
    fightingStyle: 'floreio_agressivo',
    personality: 'fanfarrao',
    baseStat: 43,
    bias: { flexibility: 13, speed: 10, stamina: 7 },
    record: { wins: 25, losses: 2, draws: 1, kos: 10, subs: 0 },
    reputation: 255,
    socialPost: 'Patrocinando nosso Terreiro na Bahia e voando com mortal de armada nos torneios internacionais!'
  },
  {
    id: 'cap_fem_juliana_mas',
    name: 'Contramestre Juliana "Iansã" Nobre',
    nickname: 'Iansã',
    avatar: '🌬️',
    age: 34,
    gender: 'F',
    wealthTier: 'classe_media',
    art: 'capoeira',
    rankIndex: 31, // Contramestre
    weight: 63,
    gymId: 'gym_terreiro_salvador',
    gymName: 'Terreiro da Malícia & Capoeira Angola',
    city: 'Salvador',
    country: 'Brasil',
    fightingStyle: 'mandingueiro',
    personality: 'respeitoso',
    baseStat: 49,
    bias: { flexibility: 12, fightIq: 11, technique: 10 },
    record: { wins: 38, losses: 4, draws: 2, kos: 13, subs: 0 },
    reputation: 290,
    socialPost: 'A força dos ventos na roda Master. Rasteira limpa com respeito à ancestralidade.'
  },
  {
    id: 'lle_fem_tainara',
    name: 'Tainara "Anaconda" Borges',
    nickname: 'Anaconda',
    avatar: '🐍',
    age: 24,
    gender: 'F',
    wealthTier: 'classe_media',
    art: 'lutalivre',
    rankIndex: 10, // Marrom LLE
    weight: 61,
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    fightingStyle: 'no_gi_scramble',
    personality: 'respeitoso',
    baseStat: 40,
    bias: { speed: 9, stamina: 8, technique: 8 },
    record: { wins: 21, losses: 3, draws: 0, kos: 0, subs: 17 },
    reputation: 185,
    socialPost: 'Sem pano é guerra pura! Transição de guilhotina para anaconda choke em segundos.'
  },
  {
    id: 'lle_fem_nadia_rica',
    name: 'Nadia "Oligarca" Khasanova',
    nickname: 'Oligarca',
    avatar: '❄️',
    age: 26,
    gender: 'F',
    wealthTier: 'milionario',
    sponsorName: 'Caspian Energy Sports',
    art: 'lutalivre',
    rankIndex: 11, // Preta LLE
    weight: 66,
    gymId: 'gym_dagestan_mountains',
    gymName: 'Caucasus Iron Peak Sambo & Grappling Base',
    city: 'Makhachkala',
    country: 'Rússia',
    fightingStyle: 'dagestan_pressure',
    personality: 'frio_calculista',
    baseStat: 52,
    bias: { strength: 11, stamina: 12, technique: 10 },
    record: { wins: 31, losses: 1, draws: 0, kos: 2, subs: 24 },
    reputation: 345,
    socialPost: 'Camp privado no Cáucaso o ano inteiro. Nenhuma atleta escapa da minha pressão de quadril.'
  },
  {
    id: 'mma_fem_amanda_leoa',
    name: 'Amanda "Leoa Suprema" Nogueira',
    nickname: 'Leoa Suprema',
    avatar: '👑',
    age: 29,
    gender: 'F',
    wealthTier: 'milionario',
    sponsorName: 'Apex Atlantic Champions Fund',
    art: 'mma',
    rankIndex: 5, // Campeã Mundial P4P
    weight: 61,
    gymId: 'gym_american_top_team',
    gymName: 'Apex Atlantic Octagon Facility',
    city: 'Coconut Creek',
    country: 'Estados Unidos',
    fightingStyle: 'striker_grappler',
    personality: 'respeitoso',
    baseStat: 61,
    bias: { strength: 13, speed: 12, technique: 12, durability: 10 },
    record: { wins: 25, losses: 3, draws: 0, kos: 15, subs: 5 },
    reputation: 580,
    socialPost: 'Dupla campeã mundial no octógono! Mãos pesadas em pé e jiu-jítsu afiado no chão!',
    isStarterRival: true
  },
  {
    id: 'mma_fem_weili',
    name: 'Mei "Fúria Carmesim" Zhang',
    nickname: 'Fúria Carmesim',
    avatar: '🐉',
    age: 27,
    gender: 'F',
    wealthTier: 'abastado',
    sponsorName: 'Dragon Warrior Media',
    art: 'mma',
    rankIndex: 4, // Desafiante #1
    weight: 52,
    gymId: 'gym_tiger_phuket',
    gymName: 'Siam Thunder Muay Thai & MMA Camp',
    city: 'Pequim',
    country: 'China',
    fightingStyle: 'well_rounded',
    personality: 'frio_calculista',
    baseStat: 56,
    bias: { speed: 12, stamina: 12, strength: 10, fightIq: 10 },
    record: { wins: 24, losses: 2, draws: 0, kos: 11, subs: 8 },
    reputation: 470,
    socialPost: 'Peso Palha com força de meio-médio. Ritmo insano pelos 25 minutos da disputa de título.'
  },
  {
    id: 'mma_fem_victoria_rica',
    name: 'Victoria "Socialite" Sterling',
    nickname: 'Socialite',
    avatar: '🥂',
    age: 24,
    gender: 'F',
    wealthTier: 'milionario',
    sponsorName: 'Sterling Media Empire',
    art: 'mma',
    rankIndex: 2, // Prospecto Internacional
    weight: 57,
    gymId: 'gym_american_top_team',
    gymName: 'Apex Atlantic Octagon Facility',
    city: 'Miami',
    country: 'Estados Unidos',
    fightingStyle: 'grappler_striker',
    personality: 'arrogante',
    baseStat: 45,
    bias: { technique: 9, speed: 8, fightIq: 8 },
    record: { wins: 12, losses: 1, draws: 0, kos: 3, subs: 7 },
    reputation: 315,
    socialPost: 'Luto por glória e audiência recorde de PPV. Meu camp custa mais que o prêmio inteiro do torneio.'
  },
  {
    id: 'mma_fem_laura_master',
    name: 'Laura "Muralha" Santana',
    nickname: 'Muralha',
    avatar: '🛡️',
    age: 34,
    gender: 'F',
    wealthTier: 'humilde',
    art: 'mma',
    rankIndex: 3, // Top 15
    weight: 66,
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    city: 'Belém',
    country: 'Brasil',
    fightingStyle: 'brawler',
    personality: 'respeitoso',
    baseStat: 51,
    bias: { durability: 14, strength: 10, stamina: 9 },
    record: { wins: 22, losses: 6, draws: 0, kos: 14, subs: 3 },
    reputation: 350,
    socialPost: 'De Belém para o mundo, treinando sem luxo e vencendo na base da raça!'
  },
  // =========================================================================
  // 9. REPRESENTATIVIDADE COMPLETA DAS DEMAIS 16 CAPITAIS BRASILEIRAS (ETAPA 3)
  // =========================================================================
  {
    id: 'bjj_ac_riobranco',
    name: 'Kauã "Seringueiro" Braga',
    nickname: 'Seringueiro',
    avatar: '🌿',
    age: 22,
    wealthTier: 'humilde',
    art: 'jiujitsu',
    rankIndex: 6, // Roxa
    weight: 70,
    gymId: 'gym_cap_ac_comp',
    gymName: 'CT Fronteira Kombat Rio Branco',
    city: 'Rio Branco',
    country: 'Brasil',
    fightingStyle: 'finalizador',
    personality: 'respeitoso',
    baseStat: 31,
    bias: { technique: 6, stamina: 5, mentalFocus: 4 },
    record: { wins: 12, losses: 3, draws: 0, kos: 0, subs: 9 },
    reputation: 78,
    socialPost: 'Do Acre para os grandes tatames do país! Defesa de meia-guarda ajustada para o nacional.'
  },
  {
    id: 'boxe_al_maceio',
    name: 'Jéssica "Maré Alta" Tenório',
    nickname: 'Maré Alta',
    avatar: '🌊',
    age: 23,
    gender: 'F',
    wealthTier: 'classe_media',
    art: 'boxe',
    rankIndex: 3,
    weight: 57,
    gymId: 'gym_cap_al_comp',
    gymName: 'Arena Maceió Fight & Boxe',
    city: 'Maceió',
    country: 'Brasil',
    fightingStyle: 'outboxer',
    personality: 'respeitoso',
    baseStat: 30,
    bias: { speed: 7, stamina: 5, fightIq: 4 },
    record: { wins: 11, losses: 2, draws: 0, kos: 4, subs: 0 },
    reputation: 84,
    socialPost: 'Treino de manopla forte aqui na orla de Maceió! Alagoas formando campeãs na nobre arte.'
  },
  {
    id: 'lle_ap_macapa',
    name: 'Darlan "Tucuju" Amaral',
    nickname: 'Tucuju',
    avatar: '🧭',
    age: 25,
    wealthTier: 'humilde',
    art: 'lutalivre',
    rankIndex: 4,
    weight: 77,
    gymId: 'gym_cap_ap_comp',
    gymName: 'Academia Macapá Submission & Boxe',
    city: 'Macapá',
    country: 'Brasil',
    fightingStyle: 'wrestler_lle',
    personality: 'respeitoso',
    baseStat: 29,
    bias: { strength: 6, durability: 5, stamina: 4 },
    record: { wins: 9, losses: 3, draws: 1, kos: 0, subs: 6 },
    reputation: 68,
    socialPost: 'No meio do mundo em Macapá, pressão constante e queda de cintura alta!'
  },
  {
    id: 'judo_df_brasilia',
    name: 'Henrique "Planalto" Yamamoto',
    nickname: 'Planalto',
    avatar: '🏛️',
    age: 24,
    wealthTier: 'abastado',
    sponsorName: 'Planalto Esportes Olímpicos',
    art: 'judo',
    rankIndex: 6,
    weight: 81,
    gymId: 'gym_cap_df_elite',
    gymName: 'Centro Olímpico Nacional do Planalto',
    city: 'Brasília',
    country: 'Brasil',
    fightingStyle: 'uchi_mata',
    personality: 'frio_calculista',
    baseStat: 38,
    bias: { technique: 8, strength: 6, fightIq: 7 },
    record: { wins: 22, losses: 4, draws: 0, kos: 0, subs: 4 },
    reputation: 165,
    socialPost: 'Treino da seleção no Centro Olímpico do Planalto. Foco no ouro nacional de Judô!'
  },
  {
    id: 'bjj_es_vitoria',
    name: 'Beatriz "Ilha Forte" Moraes',
    nickname: 'Ilha Forte',
    avatar: '🏝️',
    age: 21,
    gender: 'F',
    wealthTier: 'classe_media',
    art: 'jiujitsu',
    rankIndex: 5, // Azul
    weight: 58,
    gymId: 'gym_cap_es_comp',
    gymName: 'Vitória Combat & Arte Suave',
    city: 'Vitória',
    country: 'Brasil',
    fightingStyle: 'guardeiro',
    personality: 'respeitoso',
    baseStat: 28,
    bias: { flexibility: 7, technique: 6, mentalFocus: 4 },
    record: { wins: 10, losses: 2, draws: 0, kos: 0, subs: 7 },
    reputation: 74,
    socialPost: 'O Espírito Santo no mapa do Jiu-Jitsu! Guarda laço afiada para o próximo aberto.'
  },
  {
    id: 'mma_go_goiania',
    name: 'Thiago "Sertanejo" Peixoto',
    nickname: 'Sertanejo',
    avatar: '🤠',
    age: 26,
    wealthTier: 'classe_media',
    art: 'mma',
    rankIndex: 2,
    weight: 77,
    gymId: 'gym_cap_go_comp',
    gymName: 'Goiânia Octagon & Grappling',
    city: 'Goiânia',
    country: 'Brasil',
    fightingStyle: 'grappler_striker',
    personality: 'fanfarrao',
    baseStat: 35,
    bias: { strength: 6, durability: 6, stamina: 5 },
    record: { wins: 10, losses: 2, draws: 0, kos: 5, subs: 3 },
    reputation: 120,
    socialPost: 'Aqui em Goiânia o treino é bruto! Bora testar o queixo no octógono!'
  },
  {
    id: 'karate_ma_saoluis',
    name: 'Raimunda "Luar" Costa',
    nickname: 'Luar',
    avatar: '🌙',
    age: 19,
    gender: 'F',
    wealthTier: 'humilde',
    art: 'karate',
    rankIndex: 5,
    weight: 54,
    gymId: 'gym_cap_ma_comp',
    gymName: 'Academia Maranhense Karatê & Judô',
    city: 'São Luís',
    country: 'Brasil',
    fightingStyle: 'kumite_speed',
    personality: 'respeitoso',
    baseStat: 27,
    bias: { speed: 7, flexibility: 5, fightIq: 4 },
    record: { wins: 13, losses: 3, draws: 1, kos: 3, subs: 0 },
    reputation: 66,
    socialPost: 'Do projeto social no centro histórico de São Luís para o ranking nacional de kumitê!'
  },
  {
    id: 'bjj_mt_cuiaba',
    name: 'Mateus "Pantaneiro" Borges',
    nickname: 'Pantaneiro',
    avatar: '🐊',
    age: 28,
    wealthTier: 'classe_media',
    art: 'jiujitsu',
    rankIndex: 7, // Marrom
    weight: 94,
    gymId: 'gym_cap_mt_comp',
    gymName: 'Cuiabá Fight Club & BJJ',
    city: 'Cuiabá',
    country: 'Brasil',
    fightingStyle: 'passador',
    personality: 'respeitoso',
    baseStat: 36,
    bias: { strength: 8, durability: 6, technique: 5 },
    record: { wins: 19, losses: 5, draws: 0, kos: 0, subs: 12 },
    reputation: 112,
    socialPost: 'Calor de 40 graus em Cuiabá forjando gás de ferro na passagem de guarda!'
  },
  {
    id: 'judo_ms_campogrande',
    name: 'Camila "Fronteira" Tanaka',
    nickname: 'Fronteira',
    avatar: '🎯',
    age: 20,
    gender: 'F',
    wealthTier: 'classe_media',
    art: 'judo',
    rankIndex: 5,
    weight: 63,
    gymId: 'gym_cap_ms_comp',
    gymName: 'Campo Grande Grappling & WKF',
    city: 'Campo Grande',
    country: 'Brasil',
    fightingStyle: 'seoi_specialist',
    personality: 'frio_calculista',
    baseStat: 30,
    bias: { technique: 6, speed: 5, stamina: 4 },
    record: { wins: 14, losses: 3, draws: 0, kos: 0, subs: 5 },
    reputation: 88,
    socialPost: 'Tradição nipo-brasileira forte no tatame de Campo Grande. Mais uma etapa chegando!'
  },
  {
    id: 'karate_pb_joaopessoa',
    name: 'Luan "Sol Nascente" Wanderley',
    nickname: 'Sol Nascente',
    avatar: '☀️',
    age: 16,
    wealthTier: 'humilde',
    art: 'karate',
    rankIndex: 4,
    weight: 61,
    gymId: 'gym_cap_pb_social',
    gymName: 'Projeto Nascente Marcial (João Pessoa)',
    city: 'João Pessoa',
    country: 'Brasil',
    fightingStyle: 'counter_kime',
    personality: 'respeitoso',
    baseStat: 22,
    bias: { speed: 5, mentalFocus: 5, technique: 4 },
    record: { wins: 7, losses: 2, draws: 0, kos: 2, subs: 0 },
    reputation: 42,
    socialPost: 'Acordando às 5h para treinar kime antes da escola em João Pessoa!'
  },
  {
    id: 'judo_pi_teresina',
    name: 'Francisco "Chapada" Alencar',
    nickname: 'Chapada',
    avatar: '🥋',
    age: 31,
    wealthTier: 'classe_media',
    art: 'judo',
    rankIndex: 6,
    weight: 73,
    gymId: 'gym_cap_pi_comp',
    gymName: 'Teresina Judô & Karatê Clube',
    city: 'Teresina',
    country: 'Brasil',
    fightingStyle: 'ashi_waza',
    personality: 'respeitoso',
    baseStat: 34,
    bias: { technique: 6, fightIq: 6, durability: 4 },
    record: { wins: 20, losses: 6, draws: 0, kos: 0, subs: 6 },
    reputation: 96,
    socialPost: 'Piauí firme no circuito Master e Sênior de Judô! A base de rasteira não falha.'
  },
  {
    id: 'mma_rn_natal',
    name: 'Iago "Potiguar" Medeiros',
    nickname: 'Potiguar',
    avatar: '🦂',
    age: 25,
    wealthTier: 'abastado',
    sponsorName: 'Dunas Fight Nutrition',
    art: 'mma',
    rankIndex: 3,
    weight: 66,
    gymId: 'gym_cap_rn_comp',
    gymName: 'Natal Fúria Potiguar Combat',
    city: 'Natal',
    country: 'Brasil',
    fightingStyle: 'well_rounded',
    personality: 'arrogante',
    baseStat: 41,
    bias: { strength: 7, speed: 7, fightIq: 6 },
    record: { wins: 15, losses: 2, draws: 0, kos: 9, subs: 4 },
    reputation: 215,
    socialPost: 'Natal já é casa de campeões mundiais. Quem quiser cinturão no peso-pena vai ter que passar por mim!'
  },
  {
    id: 'muaythai_ro_portovelho',
    name: 'Vinícius "Madeira" Queiroz',
    nickname: 'Madeira',
    avatar: '🪵',
    age: 24,
    wealthTier: 'humilde',
    art: 'muaythai',
    rankIndex: 4,
    weight: 75,
    gymId: 'gym_cap_ro_comp',
    gymName: 'Porto Velho Cage & Boxe',
    city: 'Porto Velho',
    country: 'Brasil',
    fightingStyle: 'muay_khao',
    personality: 'respeitoso',
    baseStat: 28,
    bias: { durability: 7, strength: 5, stamina: 4 },
    record: { wins: 11, losses: 4, draws: 0, kos: 6, subs: 0 },
    reputation: 64,
    socialPost: 'Representando Rondônia no Muay Thai! Clinch e joelhada até o gongo final.'
  },
  {
    id: 'bjj_rr_boavista',
    name: 'Tayná "Lavrado" Macuxi',
    nickname: 'Lavrado',
    avatar: '🏹',
    age: 13,
    gender: 'F',
    wealthTier: 'humilde',
    art: 'jiujitsu',
    rankIndex: 3, // Laranja
    weight: 48,
    gymId: 'gym_cap_rr_social',
    gymName: 'Centro Social Monte Roraima Lutas (Boa Vista)',
    city: 'Boa Vista',
    country: 'Brasil',
    fightingStyle: 'guardeiro',
    personality: 'respeitoso',
    baseStat: 17,
    bias: { flexibility: 6, technique: 4, speed: 3 },
    record: { wins: 6, losses: 1, draws: 0, kos: 0, subs: 5 },
    reputation: 34,
    socialPost: 'Meu primeiro campeonato interestadual vindo aí! Boa Vista presente no tatame infantil.'
  },
  {
    id: 'capoeira_se_aracaju',
    name: 'Beto "Atalaia" Nascimento',
    nickname: 'Atalaia',
    avatar: '🪘',
    age: 23,
    wealthTier: 'classe_media',
    art: 'capoeira',
    rankIndex: 5,
    weight: 69,
    gymId: 'gym_cap_se_comp',
    gymName: 'Aracaju Karatê & Submission Club',
    city: 'Aracaju',
    country: 'Brasil',
    fightingStyle: 'regional_veloz',
    personality: 'fanfarrao',
    baseStat: 29,
    bias: { flexibility: 8, speed: 6, stamina: 4 },
    record: { wins: 12, losses: 3, draws: 2, kos: 5, subs: 0 },
    reputation: 79,
    socialPost: 'Da orla de Atalaia para os jogos abertos do Nordeste! Meia-lua de compasso na ponta do pé!'
  },
  {
    id: 'boxe_to_palmas',
    name: 'Gabriela "Cerrado" Nogueira',
    nickname: 'Cerrado',
    avatar: '🥊',
    age: 22,
    gender: 'F',
    wealthTier: 'classe_media',
    art: 'boxe',
    rankIndex: 3,
    weight: 60,
    gymId: 'gym_cap_to_comp',
    gymName: 'Palmas Fight & Karatê Center',
    city: 'Palmas',
    country: 'Brasil',
    fightingStyle: 'boxer_puncher',
    personality: 'respeitoso',
    baseStat: 28,
    bias: { speed: 6, strength: 5, stamina: 4 },
    record: { wins: 9, losses: 2, draws: 0, kos: 4, subs: 0 },
    reputation: 72,
    socialPost: 'Treino firme sob o sol de Palmas! Tocantins crescendo forte no boxe feminino.'
  }
];

export const WORLD_FIGHTERS: Array<RivalNPC & { isStarterRival?: boolean }> =
  RAW_WORLD_FIGHTER_SEEDS.map(buildWorldFighter);

/**
 * Retorna o conjunto inicial compacto de rivais gravado no personagem novo
 * ou mesclado em saves antigos (~13 rivais representativos incluindo atletas femininas e ricos),
 * mantendo o save em localStorage extremamente enxuto enquanto todos os 118+
 * atletas permanecem acessíveis em WORLD_FIGHTERS.
 */
export function getStarterRivals(): RivalNPC[] {
  return WORLD_FIGHTERS.filter((f) => f.isStarterRival).map(({ isStarterRival, ...rest }) => ({
    ...rest,
    attributes: { ...rest.attributes },
    record: { ...rest.record }
  }));
}

export function normalizeMartialArt(art: unknown, fallback: MartialArtType = 'lutalivre'): MartialArtType {
  if (art === 'wrestling') return 'lutalivre';
  if (typeof art === 'string' && Object.prototype.hasOwnProperty.call(MARTIAL_ARTS_META, art)) {
    return art as MartialArtType;
  }
  return fallback;
}

/**
 * Mescla o catálogo mundial estático (WORLD_FIGHTERS) com a evolução autônoma global
 * (character.npcWorldState) e os rivais dinâmicos persistidos (character.rivals).
 */
export function getMergedWorldFighters(character?: Character): RivalNPC[] {
  const byId = new Map<string, RivalNPC>();
  const elapsedYears = character ? Math.floor((character.careerMonthsElapsed || 0) / 12) : 0;
  const worldState = character?.npcWorldState || {};

  for (const wf of WORLD_FIGHTERS) {
    const { isStarterRival, ...clean } = wf;
    const delta = worldState[clean.id];
    const currentAge = clean.age + elapsedYears;
    const boost = delta?.st || 0;

    const attributes: FighterAttributes =
      boost > 0
        ? {
            strength: Math.min(99, clean.attributes.strength + boost),
            speed: Math.min(99, clean.attributes.speed + boost),
            stamina: Math.min(99, clean.attributes.stamina + boost),
            durability: Math.min(99, clean.attributes.durability + boost),
            flexibility: Math.min(99, clean.attributes.flexibility + Math.floor(boost * 0.7)),
            fightIq: Math.min(99, clean.attributes.fightIq + boost),
            technique: Math.min(99, clean.attributes.technique + boost),
            mentalFocus: Math.min(99, clean.attributes.mentalFocus + boost)
          }
        : { ...clean.attributes };

    const mergedRankIdx = delta?.rk !== undefined ? delta.rk : clean.rankIndex ?? 0;
    const rankDef = MARTIAL_ARTS_META[clean.art]?.ranks?.[mergedRankIdx];
    const mergedStripes = delta?.sp !== undefined ? delta.sp : clean.stripes ?? 0;
    const resolvedBaseBelt = delta?.b || rankDef?.name || clean.belt;
    const mergedBelt =
      clean.art === 'jiujitsu'
        ? formatBjjBeltWithDegree(mergedRankIdx, resolvedBaseBelt, mergedStripes)
        : resolvedBaseBelt;

    const resolvedCountry = delta?.co || clean.country;
    const rawCity = delta?.c || clean.city;
    const resolvedCity =
      resolvedCountry === 'Brasil' ? resolveBrazilCapitalByCity(rawCity, 'SP').capital : rawCity;

    const resolvedGymId = delta?.g || clean.gymId;
    const canonicalGymName = WORLD_GYMS.find((g) => g.id === resolvedGymId)?.name;

    byId.set(clean.id, {
      ...clean,
      age: currentAge,
      ageCategory: getAgeCategoryFromAge(currentAge),
      rankIndex: mergedRankIdx,
      belt: mergedBelt,
      stripes: mergedStripes,
      gymId: resolvedGymId,
      gymName: canonicalGymName || delta?.gn || clean.gymName,
      city: resolvedCity,
      country: resolvedCountry,
      monthsInRank: delta?.mi !== undefined ? delta.mi : clean.monthsInRank,
      npcXp: delta?.xp !== undefined ? delta.xp : clean.npcXp,
      reputation: delta?.rep !== undefined ? delta.rep : clean.reputation,
      lastGymTransferNote: delta?.tr || clean.lastGymTransferNote,
      gymTransferCount: delta?.tc !== undefined ? delta.tc : clean.gymTransferCount,
      attributes,
      record: {
        wins: delta?.w !== undefined ? delta.w : clean.record.wins,
        losses: delta?.l !== undefined ? delta.l : clean.record.losses,
        draws: clean.record.draws,
        kos: delta?.kos !== undefined ? delta.kos : clean.record.kos,
        subs: delta?.subs !== undefined ? delta.subs : clean.record.subs
      }
    });
  }

  if (character && Array.isArray(character.rivals)) {
    for (const r of character.rivals) {
      const base = byId.get(r.id);
      const safeArt = normalizeMartialArt(r.art, base?.art || 'lutalivre');
      if (base) {
        const effectiveAge = Math.max(base.age, r.age || base.age);
        const effRankIdx = r.rankIndex !== undefined ? r.rankIndex : base.rankIndex ?? 0;
        const effStripes = r.stripes !== undefined ? r.stripes : base.stripes ?? 0;
        const rawBelt = (r.art as string) === 'wrestling' ? base.belt : r.belt || base.belt;
        const effCountry = r.country || base.country;
        const effCityRaw = r.city || base.city;
        const effCity = effCountry === 'Brasil' ? resolveBrazilCapitalByCity(effCityRaw, 'SP').capital : effCityRaw;
        const effGymId = r.gymId || base.gymId;
        const effCanonicalGym = WORLD_GYMS.find((g) => g.id === effGymId)?.name;
        byId.set(r.id, {
          ...base,
          ...r,
          age: effectiveAge,
          art: safeArt,
          gender: r.gender || base.gender || 'M',
          wealthTier: r.wealthTier || base.wealthTier || 'classe_media',
          sponsorName: r.sponsorName || base.sponsorName,
          stripes: effStripes,
          belt: safeArt === 'jiujitsu' ? formatBjjBeltWithDegree(effRankIdx, rawBelt, effStripes) : rawBelt,
          ageCategory: r.ageCategory || getAgeCategoryFromAge(effectiveAge),
          rankIndex: effRankIdx,
          gymId: effGymId,
          gymName: effCanonicalGym || r.gymName || base.gymName,
          city: effCity,
          country: effCountry,
          fightingStyle: r.fightingStyle || base.fightingStyle,
          lastGymTransferNote: r.lastGymTransferNote || base.lastGymTransferNote,
          gymTransferCount: r.gymTransferCount ?? base.gymTransferCount
        });
      } else {
        const effRankIdx = r.rankIndex ?? 0;
        const effStripes = r.stripes ?? 0;
        const effCountry = r.country || 'Brasil';
        const effCity =
          effCountry === 'Brasil' && r.city
            ? resolveBrazilCapitalByCity(r.city, 'SP').capital
            : r.city;
        byId.set(r.id, {
          ...r,
          art: safeArt,
          gender: r.gender || 'M',
          wealthTier: r.wealthTier || 'classe_media',
          gymId: r.gymId || 'gym_bairro',
          city: effCity,
          country: effCountry,
          stripes: effStripes,
          belt: safeArt === 'jiujitsu' ? formatBjjBeltWithDegree(effRankIdx, r.belt, effStripes) : r.belt,
          ageCategory: r.ageCategory || getAgeCategoryFromAge(r.age)
        });
      }
    }
  }

  return Array.from(byId.values());
}

/**
 * Insere ou atualiza um lutador na lista character.rivals sem duplicações.
 */
export function upsertRivalInCharacter(character: Character, fighter: RivalNPC): Character {
  const updated = JSON.parse(JSON.stringify(character)) as Character;
  if (!Array.isArray(updated.rivals)) updated.rivals = [];

  const idx = updated.rivals.findIndex((r) => r.id === fighter.id);
  const { ...cleanFighter } = fighter as any;
  delete cleanFighter.isStarterRival;

  if (idx >= 0) {
    updated.rivals[idx] = {
      ...updated.rivals[idx],
      ...cleanFighter
    };
  } else {
    updated.rivals.push(cleanFighter);
  }

  return updated;
}
