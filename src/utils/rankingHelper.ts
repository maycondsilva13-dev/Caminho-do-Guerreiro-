import {
  AgeCategory,
  Character,
  FighterAttributes,
  MartialArtType,
  RivalNPC,
  WealthTier,
  WeightClass
} from '../types/game';
import { MARTIAL_ARTS_META, WORLD_GYMS } from '../data/martialArtsData';
import {
  getAgeCategoryFromAge,
  getMergedWorldFighters,
  getWeightClassFromWeight
} from '../data/worldFightersData';
import { formatBjjBeltWithDegree } from './bjjDegreeHelper';

export interface RankingScoreInput {
  art: MartialArtType;
  rankIndex: number;
  wins: number;
  losses: number;
  draws?: number;
  kos: number;
  subs: number;
  reputation: number;
  attributes: FighterAttributes;
  trophiesCount?: number;
}

export interface RankedFighterEntry {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  isPlayer: boolean;
  gender: 'M' | 'F';
  age: number;
  ageCategory: AgeCategory;
  art: MartialArtType;
  rankIndex: number;
  belt: string;
  weight: number;
  weightClass: WeightClass;
  gymId: string;
  gymName: string;
  city: string;
  country: string;
  wealthTier: WealthTier;
  sponsorName?: string;
  fightingStyle?: string;
  lastGymTransferNote?: string;
  reputation: number;
  record: {
    wins: number;
    losses: number;
    draws: number;
    kos: number;
    subs: number;
  };
  attributes: FighterAttributes;
  avgAttr: number;
  score: number;
  p4pRank: number;
  filteredRank: number;
  sourceRival?: RivalNPC;
}

export interface RankingFilters {
  mode?: 'p4p' | 'art';
  art?: 'todas' | MartialArtType;
  ageCategory?: 'todas' | AgeCategory;
  weightClass?: 'todas' | WeightClass;
  gender?: 'todas' | 'M' | 'F';
  gymId?: 'todas' | string;
  wealthTier?: 'todas' | WealthTier;
  searchQuery?: string;
}

export interface WorldRankingsResult {
  entries: RankedFighterEntry[];
  allRankedCount: number;
  playerEntry: RankedFighterEntry;
  playerArtRank: number;
  playerWeightRank: number;
  nextRivalAbove?: RankedFighterEntry;
}

export function getAverageAttributes(attr: FighterAttributes): number {
  const sum =
    (attr.strength || 0) +
    (attr.speed || 0) +
    (attr.stamina || 0) +
    (attr.durability || 0) +
    (attr.flexibility || 0) +
    (attr.fightIq || 0) +
    (attr.technique || 0) +
    (attr.mentalFocus || 0);
  return Math.round((sum / 8) * 10) / 10;
}

export function calculateFighterRankingScore(input: RankingScoreInput): number {
  const meta = MARTIAL_ARTS_META[input.art];
  const maxRankIdx = Math.max(1, (meta?.ranks?.length || 1) - 1);
  const normalizedRankScore = Math.round((Math.min(input.rankIndex, maxRankIdx) / maxRankIdx) * 220);
  const avgAttr = getAverageAttributes(input.attributes);

  const recordScore =
    (input.wins || 0) * 24 -
    (input.losses || 0) * 11 +
    (input.draws || 0) * 4 +
    ((input.kos || 0) + (input.subs || 0)) * 13;

  const repScore = Math.round((input.reputation || 0) * 1.75);
  const attrScore = Math.round(avgAttr * 4.5);
  const trophyBonus = (input.trophiesCount || 0) * 45;

  return Math.max(0, recordScore + repScore + normalizedRankScore + attrScore + trophyBonus);
}

export function getPlayerWealthTier(money: number): WealthTier {
  if (money >= 50000) return 'milionario';
  if (money >= 8000) return 'abastado';
  if (money >= 1500) return 'classe_media';
  return 'humilde';
}

export function computeWorldRankings(
  character: Character,
  filters: RankingFilters = {}
): WorldRankingsResult {
  const worldFighters = getMergedWorldFighters(character);
  const activeArtForPlayer: MartialArtType =
    filters.mode === 'art' && filters.art && filters.art !== 'todas'
      ? filters.art
      : character.primaryArt;

  const playerGrad = character.artGraduations?.[activeArtForPlayer] || character.artGraduations?.[character.primaryArt];
  const playerGym = WORLD_GYMS.find((g) => g.id === character.currentGymId);
  const resolvedGymName =
    character.playerAcademy && character.currentGymId === character.playerAcademy.id
      ? character.playerAcademy.name
      : playerGym?.name || 'Academia Local';
  const rawPlayerBelt = playerGrad?.name || MARTIAL_ARTS_META[activeArtForPlayer]?.ranks?.[0]?.name || 'Iniciante';
  const formattedPlayerBelt =
    activeArtForPlayer === 'jiujitsu'
      ? formatBjjBeltWithDegree(playerGrad?.rankIndex ?? 0, rawPlayerBelt, playerGrad?.stripes ?? 0)
      : rawPlayerBelt;

  const playerBaseEntry: Omit<RankedFighterEntry, 'p4pRank' | 'filteredRank'> = {
    id: 'player',
    name: character.name,
    nickname: character.nickname,
    avatar: character.avatar,
    isPlayer: true,
    gender: character.gender || 'M',
    age: character.age,
    ageCategory: getAgeCategoryFromAge(character.age),
    art: activeArtForPlayer,
    rankIndex: playerGrad?.rankIndex ?? 0,
    belt: formattedPlayerBelt,
    weight: character.weight,
    weightClass: character.weightClass || getWeightClassFromWeight(character.weight),
    gymId: character.currentGymId || 'gym_bairro',
    gymName: resolvedGymName,
    city: character.currentCity || character.homeCity || 'São Paulo',
    country: character.currentCountry || 'Brasil',
    wealthTier: getPlayerWealthTier(character.money),
    sponsorName: character.job === 'atleta_patrocinado' ? 'Patrocínio Profissional' : undefined,
    fightingStyle: 'completo',
    reputation: character.fame || 0,
    record: {
      wins: character.record?.wins || 0,
      losses: character.record?.losses || 0,
      draws: character.record?.draws || 0,
      kos: character.record?.kos || 0,
      subs: character.record?.submissions || 0
    },
    attributes: { ...character.attributes },
    avgAttr: getAverageAttributes(character.attributes),
    score: calculateFighterRankingScore({
      art: activeArtForPlayer,
      rankIndex: playerGrad?.rankIndex ?? 0,
      wins: character.record?.wins || 0,
      losses: character.record?.losses || 0,
      draws: character.record?.draws || 0,
      kos: character.record?.kos || 0,
      subs: character.record?.submissions || 0,
      reputation: character.fame || 0,
      attributes: character.attributes,
      trophiesCount: character.trophies?.length || 0
    })
  };

  const npcEntries: Array<Omit<RankedFighterEntry, 'p4pRank' | 'filteredRank'>> = worldFighters.map((npc) => {
    const gym = WORLD_GYMS.find((g) => g.id === npc.gymId);
    const rankIdx = npc.rankIndex ?? 0;
    const avgAttr = getAverageAttributes(npc.attributes);
    return {
      id: npc.id,
      name: npc.name,
      nickname: npc.nickname,
      avatar: npc.avatar,
      isPlayer: false,
      gender: npc.gender || 'M',
      age: npc.age,
      ageCategory: npc.ageCategory || getAgeCategoryFromAge(npc.age),
      art: npc.art,
      rankIndex: rankIdx,
      belt: npc.belt,
      weight: npc.weight,
      weightClass: npc.weightClass || getWeightClassFromWeight(npc.weight),
      gymId: npc.gymId || 'gym_bairro',
      gymName: npc.gymName || gym?.name || 'Academia Local',
      city: npc.city || gym?.city || 'Brasil',
      country: npc.country || gym?.country || 'Brasil',
      wealthTier: npc.wealthTier || 'classe_media',
      sponsorName: npc.sponsorName,
      fightingStyle: npc.fightingStyle,
      lastGymTransferNote: npc.lastGymTransferNote,
      reputation: npc.reputation || 0,
      record: {
        wins: npc.record?.wins || 0,
        losses: npc.record?.losses || 0,
        draws: npc.record?.draws || 0,
        kos: npc.record?.kos || 0,
        subs: npc.record?.subs || 0
      },
      attributes: { ...npc.attributes },
      avgAttr,
      score: calculateFighterRankingScore({
        art: npc.art,
        rankIndex: rankIdx,
        wins: npc.record?.wins || 0,
        losses: npc.record?.losses || 0,
        draws: npc.record?.draws || 0,
        kos: npc.record?.kos || 0,
        subs: npc.record?.subs || 0,
        reputation: npc.reputation || 0,
        attributes: npc.attributes
      }),
      sourceRival: npc
    };
  });

  const combined = [playerBaseEntry, ...npcEntries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.record.wins !== a.record.wins) return b.record.wins - a.record.wins;
    if (b.reputation !== a.reputation) return b.reputation - a.reputation;
    return b.avgAttr - a.avgAttr;
  });

  const rankedAll: RankedFighterEntry[] = combined.map((entry, idx) => ({
    ...entry,
    p4pRank: idx + 1,
    filteredRank: idx + 1
  }));

  const playerEntry = rankedAll.find((e) => e.isPlayer)!;
  const sameArt = rankedAll.filter((e) => e.art === playerEntry.art);
  const playerArtRank = Math.max(1, sameArt.findIndex((e) => e.isPlayer) + 1);
  const sameWeight = rankedAll.filter((e) => e.weightClass === playerEntry.weightClass);
  const playerWeightRank = Math.max(1, sameWeight.findIndex((e) => e.isPlayer) + 1);

  const q = (filters.searchQuery || '').trim().toLowerCase();

  const filteredRaw = rankedAll.filter((e) => {
    if (filters.art && filters.art !== 'todas' && e.art !== filters.art) return false;
    if (filters.ageCategory && filters.ageCategory !== 'todas' && e.ageCategory !== filters.ageCategory) return false;
    if (filters.weightClass && filters.weightClass !== 'todas' && e.weightClass !== filters.weightClass) return false;
    if (filters.gender && filters.gender !== 'todas' && !e.isPlayer && e.gender !== filters.gender) return false;
    if (filters.gender && filters.gender !== 'todas' && e.isPlayer && e.gender !== filters.gender) return false;
    if (filters.gymId && filters.gymId !== 'todas' && e.gymId !== filters.gymId) return false;
    if (filters.wealthTier && filters.wealthTier !== 'todas' && e.wealthTier !== filters.wealthTier) return false;
    if (q) {
      const hay = `${e.name} ${e.nickname} ${e.belt} ${e.gymName} ${e.country} ${e.city} ${e.sponsorName || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const entries = filteredRaw.map((e, idx) => ({
    ...e,
    filteredRank: idx + 1
  }));

  const playerFilteredIdx = entries.findIndex((e) => e.isPlayer);
  const nextRivalAbove =
    playerFilteredIdx > 0
      ? entries[playerFilteredIdx - 1]
      : playerEntry.p4pRank > 1
      ? rankedAll[playerEntry.p4pRank - 2]
      : undefined;

  return {
    entries,
    allRankedCount: rankedAll.length,
    playerEntry,
    playerArtRank,
    playerWeightRank,
    nextRivalAbove
  };
}
