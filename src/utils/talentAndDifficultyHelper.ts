import {
  ArtTalentLevel,
  Character,
  GameDifficulty,
  MartialArtType,
  WealthTier
} from '../types/game';

export interface DifficultyProfile {
  id: GameDifficulty;
  label: string;
  shortLabel: string;
  familyWealthTier: WealthTier;
  familyWealthLabel: string;
  badgeClass: string;
  startingMoneyByAge: Record<8 | 13 | 21, number>;
  initialFamilySupport: number;
  monthlyAllowanceUnder18: number;
  description: string;
}

export const DIFFICULTY_PROFILES: Record<GameDifficulty, DifficultyProfile> = {
  facil: {
    id: 'facil',
    label: 'Fácil · Berço de Ouro',
    shortLabel: '💎 Fácil (Milionária)',
    familyWealthTier: 'milionario',
    familyWealthLabel: 'Família Milionária',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
    startingMoneyByAge: { 8: 600, 13: 1800, 21: 6000 },
    initialFamilySupport: 95,
    monthlyAllowanceUnder18: 450,
    description:
      'Família milionária. Mesada alta até os 18 anos, academias particulares ou internacionais custeadas na juventude e reserva financeira forte no início.'
  },
  moderado: {
    id: 'moderado',
    label: 'Moderado · Vida Confortável',
    shortLabel: '💰 Moderado (Abastada)',
    familyWealthTier: 'abastado',
    familyWealthLabel: 'Família Abastada',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    startingMoneyByAge: { 8: 250, 13: 700, 21: 2000 },
    initialFamilySupport: 90,
    monthlyAllowanceUnder18: 150,
    description:
      'Família abastada. Boa retaguarda financeira, mesada mensal na base e facilidade para custear exames, campeonatos e viagens.'
  },
  normal: {
    id: 'normal',
    label: 'Normal · Classe Média',
    shortLabel: '🏠 Normal (Classe Média)',
    familyWealthTier: 'classe_media',
    familyWealthLabel: 'Família Classe Média',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    startingMoneyByAge: { 8: 60, 13: 150, 21: 450 },
    initialFamilySupport: 85,
    monthlyAllowanceUnder18: 0,
    description:
      'Experiência padrão equilibrada. Pais garantem o básico e apoiam academias locais, mas conquistas maiores dependem de bolsas, bicos e prêmios.'
  },
  dificil: {
    id: 'dificil',
    label: 'Difícil · Origem Humilde',
    shortLabel: '🔥 Difícil (Humilde)',
    familyWealthTier: 'humilde',
    familyWealthLabel: 'Família Humilde',
    badgeClass: 'bg-orange-950/60 text-orange-300 border-orange-700/60',
    startingMoneyByAge: { 8: 15, 13: 40, 21: 120 },
    initialFamilySupport: 72,
    monthlyAllowanceUnder18: 0,
    description:
      'Desafio raiz. Família humilde sem sobras para mesadas, festas de aniversário ou mensalidades pagas; cada real vem do seu suor e ajuda mútua.'
  }
};

export function getDifficultyProfile(difficulty?: GameDifficulty): DifficultyProfile {
  if (difficulty && DIFFICULTY_PROFILES[difficulty]) {
    return DIFFICULTY_PROFILES[difficulty];
  }
  return DIFFICULTY_PROFILES.normal;
}

export function getDifficultyForWealthTier(tier?: WealthTier): GameDifficulty {
  if (tier === 'milionario') return 'facil';
  if (tier === 'abastado') return 'moderado';
  if (tier === 'humilde') return 'dificil';
  return 'normal';
}

export interface ArtTalentMeta {
  level: ArtTalentLevel;
  label: string;
  shortLabel: string;
  stars: number;
  xpMultiplier: number;
  xpBonusPercent: number;
  attrMultiplier: number;
  attrBonusPercent: number;
  badgeClass: string;
  description: string;
}

export const ART_TALENT_META: Record<ArtTalentLevel, ArtTalentMeta> = {
  comum: {
    level: 'comum',
    label: 'Talento Comum',
    shortLabel: '⭐ Comum',
    stars: 1,
    xpMultiplier: 1.0,
    xpBonusPercent: 0,
    attrMultiplier: 1.0,
    attrBonusPercent: 0,
    badgeClass: 'bg-neutral-800 text-neutral-300 border-neutral-700',
    description: 'Evolução padrão baseada exclusivamente em disciplina e constância nos treinos.'
  },
  apto: {
    level: 'apto',
    label: 'Boa Aptidão',
    shortLabel: '⭐⭐ Boa Aptidão',
    stars: 2,
    xpMultiplier: 1.12,
    xpBonusPercent: 12,
    attrMultiplier: 1.1,
    attrBonusPercent: 10,
    badgeClass: 'bg-sky-950/70 text-sky-300 border-sky-700/60',
    description: 'Assimila bem os fundamentos e progride mais rápido que a média da turma.'
  },
  talentoso: {
    level: 'talentoso',
    label: 'Talentoso',
    shortLabel: '⭐⭐⭐ Talentoso',
    stars: 3,
    xpMultiplier: 1.25,
    xpBonusPercent: 25,
    attrMultiplier: 1.2,
    attrBonusPercent: 20,
    badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
    description: 'Coordenação natural destacada; o mestre rapidamente nota sua curva acelerada.'
  },
  prodigio: {
    level: 'prodigio',
    label: 'Prodígio',
    shortLabel: '⭐⭐⭐⭐ Prodígio',
    stars: 4,
    xpMultiplier: 1.4,
    xpBonusPercent: 40,
    attrMultiplier: 1.35,
    attrBonusPercent: 35,
    badgeClass: 'bg-purple-950/70 text-purple-300 border-purple-600/60',
    description: 'Dom natural raro: absorve técnicas complexas com metade das repetições comuns.'
  },
  genio: {
    level: 'genio',
    label: 'Gênio da Arte',
    shortLabel: '👑 Gênio',
    stars: 5,
    xpMultiplier: 1.6,
    xpBonusPercent: 60,
    attrMultiplier: 1.5,
    attrBonusPercent: 50,
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    description: 'Fenômeno geracional! Evolução extraordinária de faixa e atributos nesta arte.'
  }
};

export const ALL_MARTIAL_ARTS: MartialArtType[] = [
  'boxe',
  'jiujitsu',
  'muaythai',
  'karate',
  'judo',
  'capoeira',
  'lutalivre',
  'mma'
];

export function rollSingleArtTalent(rng: () => number = Math.random): ArtTalentLevel {
  const r = rng();
  if (r < 0.32) return 'comum';
  if (r < 0.62) return 'apto';
  if (r < 0.84) return 'talentoso';
  if (r < 0.96) return 'prodigio';
  return 'genio';
}

export function generateRandomArtTalents(
  rng: () => number = Math.random
): Record<MartialArtType, ArtTalentLevel> {
  const talents: Partial<Record<MartialArtType, ArtTalentLevel>> = {};
  for (const art of ALL_MARTIAL_ARTS) {
    talents[art] = rollSingleArtTalent(rng);
  }
  return talents as Record<MartialArtType, ArtTalentLevel>;
}

export function getArtTalentMeta(level?: ArtTalentLevel): ArtTalentMeta {
  if (level && ART_TALENT_META[level]) {
    return ART_TALENT_META[level];
  }
  return ART_TALENT_META.comum;
}

export function isArtTalentDiscovered(char: Character, art: MartialArtType): boolean {
  return Boolean(char.discoveredArtTalents?.[art]);
}

export function getActiveArtTalentBonus(
  char: Character,
  art: MartialArtType
): {
  discovered: boolean;
  xpMultiplier: number;
  attrMultiplier: number;
  meta?: ArtTalentMeta;
} {
  if (!isArtTalentDiscovered(char, art)) {
    return {
      discovered: false,
      xpMultiplier: 1.0,
      attrMultiplier: 1.0
    };
  }
  const level = char.artTalents?.[art] || 'comum';
  const meta = getArtTalentMeta(level);
  return {
    discovered: true,
    xpMultiplier: meta.xpMultiplier,
    attrMultiplier: meta.attrMultiplier,
    meta
  };
}
