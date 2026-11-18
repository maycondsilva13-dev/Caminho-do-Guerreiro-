import {
  AgeCategory,
  BracketFighterSlot,
  Character,
  CharacterTournamentEntry,
  FighterAttributes,
  MartialArtType,
  OfficialGiColor,
  RivalNPC,
  Tournament,
  TournamentBracketMatch,
  TournamentBracketState,
  TournamentDivisionSelection,
  WeightClass
} from '../types/game';
import { BjjMatchScore } from '../types/bjjCombatEngine';
import { MARTIAL_ARTS_META, WEIGHT_CLASSES } from '../data/martialArtsData';
import {
  clampRankIndexForAge,
  getAgeCategoryFromAge,
  getMergedWorldFighters,
  getWeightClassFromWeight
} from '../data/worldFightersData';
import { formatBjjBeltWithDegree } from './bjjDegreeHelper';
import { getRealAthleteAge, resolveTournamentIsGi } from './tournamentTimeline';
import { BRAZIL_STATES, getStateByUf } from '../data/brazilLocations';
import { REGIONAL_BRAZIL_GYMS } from '../data/regionalGymsCatalog';
import { resolveBrazilCapitalByCity } from './regionalGeographyHelper';
import { resolveTournamentHostLocation, TournamentHostLocation } from './tournamentGeographyHelper';
import { CBJJ_OFFICIAL_GI_WEIGHT_KG, DivisionWeightOption, SportAgeDivision } from '../data/tournamentDivisionsData';
import {
  resolveArtRankDivision,
  ResolvedTournamentDivision,
  resolveTournamentDivisionForCharacter
} from './tournamentDivisionsHelper';

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES_BR = [
  'Arthur', 'Bernardo', 'Cauã', 'Danilo', 'Eduardo', 'Felipe', 'Gustavo', 'Heitor',
  'Igor', 'João', 'Kauê', 'Leandro', 'Murilo', 'Nicolas', 'Otávio', 'Paulo',
  'Rafael', 'Samuel', 'Thiago', 'Vinícius', 'Wesley', 'Yuri', 'Alexandre', 'Bruno'
];

const FIRST_NAMES_BR_F = [
  'Ana', 'Beatriz', 'Camila', 'Daniela', 'Eduarda', 'Fernanda', 'Gabriela', 'Helena',
  'Isabela', 'Juliana', 'Karina', 'Larissa', 'Mariana', 'Natália', 'Olívia', 'Patrícia',
  'Rafaela', 'Sofia', 'Thaís', 'Vitória', 'Yasmin', 'Amanda', 'Bruna', 'Letícia'
];

const LAST_NAMES_BR = [
  'Almeida', 'Barbosa', 'Cardoso', 'Duarte', 'Esteves', 'Ferreira', 'Gomes', 'Henrique',
  'Lacerda', 'Machado', 'Nogueira', 'Oliveira', 'Pereira', 'Queiroz', 'Ribeiro', 'Santana',
  'Tavares', 'Vasconcelos', 'Xavier', 'Moraes', 'Silveira', 'Monteiro', 'Borges', 'Couto'
];

const FIRST_NAMES_INTL = [
  'Kenji', 'Takeshi', 'Viktor', 'Dmitri', 'Liam', 'Connor', 'Héctor', 'Mateo',
  'Somchai', 'Nattapong', 'Jean-Luc', 'Marco', 'Giorgi', 'Khamzat', 'Yuki', 'Daisuke'
];

const FIRST_NAMES_INTL_F = [
  'Yumi', 'Sakura', 'Elena', 'Anastasia', 'Chloe', 'Hannah', 'Valeria', 'Lucía',
  'Nicha', 'Ploy', 'Camille', 'Giulia', 'Nino', 'Amina', 'Haruka', 'Mika'
];

const LAST_NAMES_INTL = [
  'Takahashi', 'Sato', 'Petrov', 'Volkov', 'Callahan', 'Brooks', 'Morales', 'Castillo',
  'Chaiya', 'Sor', 'Moreau', 'Rossi', 'Beridze', 'Aliyev', 'Hayashi', 'Watanabe'
];

const NICKNAMES_POOL = [
  'Tanque', 'Relâmpago', 'Escorpião', 'Anaconda', 'Trovão', 'Muralha', 'Gavião',
  'Predador', 'Fênix', 'Samurai', 'Sombra', 'Ciclone', 'Paredão', 'Trator',
  'Cascavel', 'Lobo', 'Dragão', 'Furacão', 'Titã', 'Navalha', 'Guerreiro', 'Jaguar'
];

const AVATARS_BY_ART: Record<MartialArtType, string[]> = {
  jiujitsu: ['🥋', '🐍', '🦁', '🕷️', '🦍', '🦅'],
  boxe: ['🥊', '⚡', '🔨', '💣', '🔥', '🎩'],
  muaythai: ['🥊', '🐯', '🦵', '🔪', '🛡️', '👑'],
  karate: ['🥋', '⚡', '🐉', '🌪️', '🎋', '🦅'],
  judo: ['🥋', '⚖️', '🌊', '🏯', '🏔️', '🥇'],
  capoeira: ['🪘', '⚡', '🌀', '🐆', '🥁', '🎶'],
  lutalivre: ['🦡', '🐺', '🐻', '🔨', '🐍', '🏋️'],
  mma: ['⚔️', '🦁', '🦅', '🗿', '🧱', '⚡']
};

const INTL_GYMS_BY_SCOPE: Partial<
  Record<Tournament['scope'], Array<{ gym: string; city: string; uf?: BrazilUF; country: string }>>
> = {
  internacional: [
    { gym: 'Sunset Boulevard Boxing Club', city: 'Los Angeles', country: 'Estados Unidos' },
    { gym: 'Paris Combat Club', city: 'Paris', country: 'França' },
    { gym: 'Tbilisi Olympic Grappling Club', city: 'Tbilisi', country: 'Geórgia' },
    { gym: 'Gimnasio Azteca Ciudad de México', city: 'Cidade do México', country: 'México' }
  ],
  mundial: [
    { gym: 'Instituto Budōkaku de Tóquio', city: 'Tóquio', country: 'Japão' },
    { gym: 'Siam Thunder Muay Thai & MMA Camp', city: 'Phuket', country: 'Tailândia' },
    { gym: 'Pacific Coast Jiu-Jitsu HQ', city: 'Costa Mesa', country: 'Estados Unidos' },
    { gym: 'Centro Olímpico Ibirapuera Combat', city: 'São Paulo', uf: 'SP', country: 'Brasil' }
  ],
  mma_pro: [
    { gym: 'Apex Atlantic Octagon Facility', city: 'Coconut Creek', country: 'Estados Unidos' },
    { gym: 'Caucasus Iron Peak Sambo Base', city: 'Makhachkala', country: 'Rússia' },
    { gym: 'Templo Paranaense Chute & Octógono', city: 'Curitiba', uf: 'PR', country: 'Brasil' },
    { gym: 'Manchester Iron Ring UK', city: 'Manchester', country: 'Reino Unido' }
  ]
};

type BrazilUF = import('../types/game').BrazilUF;

function pickRegionalChallengerGym(
  tournament: Tournament,
  host: TournamentHostLocation,
  rng: () => number
): { gym: string; city: string; uf?: BrazilUF; country: string } {
  const isBrazilScope =
    tournament.scope === 'municipal' ||
    tournament.scope === 'estadual' ||
    tournament.scope === 'regional' ||
    tournament.scope === 'nacional' ||
    (tournament.scope === 'mma_pro' && host.isBrazil);

  if (isBrazilScope) {
    let pool = REGIONAL_BRAZIL_GYMS;
    if ((tournament.scope === 'municipal' || tournament.scope === 'estadual') && host.hostUf) {
      const sameState = REGIONAL_BRAZIL_GYMS.filter((g) => g.uf === host.hostUf);
      if (sameState.length > 0) pool = sameState;
    } else if (tournament.scope === 'regional' && host.hostRegion) {
      const sameRegion = REGIONAL_BRAZIL_GYMS.filter((g) => {
        const st = g.uf ? getStateByUf(g.uf) : undefined;
        return st?.region === host.hostRegion;
      });
      if (sameRegion.length > 0) pool = sameRegion;
    }

    if (pool.length > 0) {
      const picked = pool[Math.floor(rng() * pool.length)];
      const cap = resolveBrazilCapitalByCity(picked.city, picked.uf || host.hostUf || 'SP');
      return {
        gym: picked.name,
        city: cap.capital,
        uf: cap.uf,
        country: 'Brasil'
      };
    }

    const fallbackCap = BRAZIL_STATES[Math.floor(rng() * BRAZIL_STATES.length)];
    return {
      gym: `Academia ${fallbackCap.capital} Combat`,
      city: fallbackCap.capital,
      uf: fallbackCap.uf,
      country: 'Brasil'
    };
  }

  const intlPool = INTL_GYMS_BY_SCOPE[tournament.scope] || INTL_GYMS_BY_SCOPE.internacional!;
  return intlPool[Math.floor(rng() * intlPool.length)];
}

const STYLES_BY_ART: Record<MartialArtType, string[]> = {
  jiujitsu: ['guardeiro', 'passador', 'quedas', 'finalizador', 'equilibrado'],
  boxe: ['outboxer', 'slugger', 'counter', 'boxer_puncher'],
  muaythai: ['muay_femur', 'muay_khao', 'muay_mat', 'muay_sok'],
  karate: ['kumite_speed', 'counter_kime', 'high_kick'],
  judo: ['uchi_mata', 'seoi_specialist', 'ashi_waza', 'ne_waza'],
  capoeira: ['mandingueiro', 'regional_veloz', 'floreio_agressivo'],
  lutalivre: ['wrestler_lle', 'leglock_hunter', 'no_gi_scramble', 'dagestan_pressure'],
  mma: ['well_rounded', 'striker', 'grappler_striker', 'dagestan_pressure']
};

function getScopeBaseStat(scope: Tournament['scope'], ageCategory: AgeCategory): number {
  let scopeBase = 24;
  switch (scope) {
    case 'municipal':
      scopeBase = 21;
      break;
    case 'estadual':
    case 'regional':
      scopeBase = 27;
      break;
    case 'nacional':
      scopeBase = 34;
      break;
    case 'internacional':
      scopeBase = 42;
      break;
    case 'mundial':
      scopeBase = 49;
      break;
    case 'mma_pro':
      scopeBase = 45;
      break;
  }

  if (ageCategory === 'infantil') return Math.max(12, Math.round(scopeBase * 0.62));
  if (ageCategory === 'juvenil') return Math.max(18, Math.round(scopeBase * 0.8));
  if (ageCategory === 'master') return Math.round(scopeBase * 1.04);
  return scopeBase;
}

function getRealisticAgeForDivision(
  ageCategory: AgeCategory,
  ageDivision: SportAgeDivision | undefined,
  rng: () => number
): number {
  if (ageDivision) {
    const minA = Math.max(4, ageDivision.minAge);
    const maxA = ageDivision.maxAge !== null ? ageDivision.maxAge : minA + 5;
    const span = Math.max(0, maxA - minA);
    return minA + Math.floor(rng() * (span + 1));
  }
  switch (ageCategory) {
    case 'infantil':
      return 9 + Math.floor(rng() * 5); // 9..13
    case 'juvenil':
      return 14 + Math.floor(rng() * 4); // 14..17
    case 'adulto':
      return 19 + Math.floor(rng() * 10); // 19..28
    case 'master':
      return 31 + Math.floor(rng() * 10); // 31..40
  }
}

function getTargetWeightForDivision(
  tournament: Tournament,
  selectedWeight: DivisionWeightOption | undefined,
  isBjjGi: boolean,
  rng: () => number
): number {
  if (selectedWeight) {
    const giDeduction = isBjjGi ? CBJJ_OFFICIAL_GI_WEIGHT_KG : 0;
    const maxScale = selectedWeight.maxWeight ?? Math.max(selectedWeight.minWeight + 12, 108);
    const minBody = Math.max(12, selectedWeight.minWeight - giDeduction);
    const maxBody = Math.max(minBody + 0.5, maxScale - giDeduction - 0.15);
    const raw = minBody + rng() * Math.min(4.2, maxBody - minBody);
    return Math.round(raw * 10) / 10;
  }
  const wc = WEIGHT_CLASSES.find((w) => w.name === tournament.weightClass);
  if (!wc) return tournament.targetWeight;
  const span = Math.max(1, wc.maxWeight - wc.minWeight);
  const w = wc.minWeight + rng() * Math.min(span, 4.5);
  return Math.round(Math.min(tournament.targetWeight, w) * 10) / 10;
}

function rivalToBracketSlot(
  rival: RivalNPC,
  tournament: Tournament,
  targetAgeCategory: AgeCategory
): BracketFighterSlot {
  const ageCat = rival.ageCategory || getAgeCategoryFromAge(rival.age);
  const rankIdx =
    rival.rankIndex !== undefined
      ? rival.rankIndex
      : Math.max(
          0,
          (MARTIAL_ARTS_META[rival.art]?.ranks || []).findIndex(
            (r) => r.name.toLowerCase() === (rival.belt || '').toLowerCase()
          )
        );

  const rivalCountry = rival.country || 'Brasil';
  const resolvedCap =
    rivalCountry === 'Brasil' ? resolveBrazilCapitalByCity(rival.city, 'SP') : undefined;

  return {
    id: rival.id,
    name: rival.name,
    nickname: rival.nickname,
    avatar: rival.avatar,
    isPlayer: false,
    age: rival.age,
    ageCategory: ageCat || targetAgeCategory,
    art: rival.art,
    rankIndex: rankIdx,
    belt: rival.belt,
    weight: rival.weight,
    weightClass: rival.weightClass || getWeightClassFromWeight(rival.weight),
    gymId: rival.gymId,
    gymName: rival.gymName,
    uf: resolvedCap?.uf,
    city: resolvedCap ? resolvedCap.capital : rival.city,
    country: rivalCountry,
    gender: rival.gender || 'M',
    wealthTier: rival.wealthTier || 'classe_media',
    fightingStyle: rival.fightingStyle,
    attributes: { ...rival.attributes },
    record: { ...rival.record }
  };
}

function generateSeededBracketChallenger(
  tournament: Tournament,
  host: TournamentHostLocation,
  ageCategory: AgeCategory,
  division: ResolvedTournamentDivision,
  playerRankIndex: number,
  slotIndex: number,
  year: number,
  usedNames: Set<string>
): BracketFighterSlot {
  const seed = hashString(
    `${tournament.id}_${host.hostCity}_${year}_${division.sex}_${division.ageDivision.id}_${division.rankDivisionId}_${division.selectedWeight.id}_${slotIndex}`
  );
  const rng = mulberry32(seed);

  const isInternational =
    tournament.scope === 'internacional' ||
    tournament.scope === 'mundial' ||
    (tournament.scope === 'mma_pro' && !host.isBrazil);

  const targetGender: 'M' | 'F' = division.sex;
  let fullName = '';
  let nickname = '';

  for (let attempt = 0; attempt < 20; attempt++) {
    const useIntl = isInternational && rng() > 0.35;
    const fNames = useIntl
      ? targetGender === 'F' ? FIRST_NAMES_INTL_F : FIRST_NAMES_INTL
      : targetGender === 'F' ? FIRST_NAMES_BR_F : FIRST_NAMES_BR;
    const lNames = useIntl ? LAST_NAMES_INTL : LAST_NAMES_BR;
    const first = fNames[Math.floor(rng() * fNames.length)];
    const last = lNames[Math.floor(rng() * lNames.length)];
    nickname = NICKNAMES_POOL[Math.floor(rng() * NICKNAMES_POOL.length)];
    fullName = `${first} "${nickname}" ${last}`;
    if (!usedNames.has(fullName)) break;
  }
  usedNames.add(fullName);

  const age = getRealisticAgeForDivision(ageCategory, division.ageDivision, rng);
  const isBjjGi = tournament.art === 'jiujitsu' && division.isGi;
  const weight = getTargetWeightForDivision(tournament, division.selectedWeight, isBjjGi, rng);
  const weightClass = getWeightClassFromWeight(weight);

  const meta = MARTIAL_ARTS_META[tournament.art];
  // No Jiu-Jitsu CBJJ/IBJJF a chave é estritamente da mesma faixa do atleta!
  const desiredRank =
    tournament.art === 'jiujitsu'
      ? Math.max(tournament.minRankIndex, playerRankIndex)
      : Math.max(
          tournament.minRankIndex,
          Math.min(meta.ranks.length - 1, playerRankIndex + (slotIndex % 2 === 0 ? 0 : 1))
        );
  const rankIndex = clampRankIndexForAge(tournament.art, desiredRank, age);
  const rawBelt = meta.ranks[rankIndex]?.name || meta.ranks[0].name;
  const genStripes = tournament.art === 'jiujitsu' ? Math.floor(rng() * (rankIndex >= 9 ? 1 : 5)) : 0;
  const belt = tournament.art === 'jiujitsu' ? formatBjjBeltWithDegree(rankIndex, rawBelt, genStripes) : rawBelt;

  const baseStat = getScopeBaseStat(tournament.scope, ageCategory) + (slotIndex % 3) * 2;
  const jitter = () => Math.floor(rng() * 5) - 2;

  const attributes: FighterAttributes = {
    strength: Math.max(10, baseStat + jitter()),
    speed: Math.max(10, baseStat + jitter()),
    stamina: Math.max(10, baseStat + 1 + jitter()),
    durability: Math.max(10, baseStat + jitter()),
    flexibility: Math.max(10, baseStat - 1 + jitter()),
    fightIq: Math.max(10, baseStat + jitter()),
    technique: Math.max(10, baseStat + 1 + jitter()),
    mentalFocus: Math.max(10, baseStat + jitter())
  };

  const gymInfo = pickRegionalChallengerGym(tournament, host, rng);
  const avatars = AVATARS_BY_ART[tournament.art] || ['🥋'];
  const avatar = avatars[Math.floor(rng() * avatars.length)];
  const styles = STYLES_BY_ART[tournament.art] || ['equilibrado'];
  const fightingStyle = styles[Math.floor(rng() * styles.length)];

  const wins = Math.max(1, Math.round((baseStat - 10) * 0.45 + rng() * 5));
  const losses = Math.floor(rng() * Math.max(2, Math.round(wins * 0.35)));
  const isGrappling =
    tournament.art === 'jiujitsu' || tournament.art === 'judo' || tournament.art === 'lutalivre';

  const giPalette: OfficialGiColor[] = ['branco', 'azul', 'preto'];
  const oppGiColor = isBjjGi ? giPalette[Math.floor(rng() * giPalette.length)] : undefined;

  return {
    id: `gen_${tournament.id}_${year}_${division.sex}_${slotIndex}_${seed % 10000}`,
    name: fullName,
    nickname,
    avatar,
    isPlayer: false,
    age,
    ageCategory,
    ageDivisionLabel: division.ageDivision.shortLabel,
    art: tournament.art,
    rankIndex,
    belt,
    stripes: genStripes,
    weight,
    weightClass,
    gymName: gymInfo.gym,
    uf: gymInfo.uf,
    city: gymInfo.city,
    country: gymInfo.country,
    gender: targetGender,
    giColor: oppGiColor,
    wealthTier: isInternational && rng() < 0.35 ? 'abastado' : 'classe_media',
    fightingStyle,
    attributes,
    record: {
      wins,
      losses,
      draws: 0,
      kos: isGrappling ? 0 : Math.floor(wins * 0.45),
      subs: isGrappling ? Math.floor(wins * 0.6) : 0
    }
  };
}

/**
 * Constrói uma chave completa (4 ou 8 lutadores) para um torneio oficial,
 * filtrando NPCs do mundo por arte marcial, graduação, categoria etária e categoria de peso,
 * completando vagas restantes com desafiantes gerados deterministicamente na divisão exata.
 */
export function buildTournamentBracket(
  tournament: Tournament,
  character: Character,
  year: number,
  selection?: TournamentDivisionSelection
): TournamentBracketState {
  const realPlayerAge = getRealAthleteAge(character);
  const division = resolveTournamentDivisionForCharacter(character, tournament, year, selection);
  const playerAgeCategory = division.ageDivision.broadCategory || getAgeCategoryFromAge(realPlayerAge);
  const effectiveBracketAgeCat: AgeCategory =
    tournament.scope === 'mma_pro' && playerAgeCategory === 'infantil'
      ? 'adulto'
      : playerAgeCategory;

  const playerGrad = character.artGraduations?.[tournament.art];
  const playerRankIndex = playerGrad?.rankIndex ?? 0;
  const rawPlayerBelt = playerGrad?.name || MARTIAL_ARTS_META[tournament.art].ranks[0].name;
  const playerStripes = playerGrad?.stripes ?? 0;
  const playerBelt =
    tournament.art === 'jiujitsu'
      ? formatBjjBeltWithDegree(playerRankIndex, rawPlayerBelt, playerStripes)
      : rawPlayerBelt;

  const host = resolveTournamentHostLocation(tournament, character);
  const playerIsBrazil = (character.currentCountry || 'Brasil') === 'Brasil';
  const playerCap = playerIsBrazil
    ? resolveBrazilCapitalByCity(character.currentCity || character.homeCity, character.homeState || 'SP')
    : undefined;

  const playerSlot: BracketFighterSlot = {
    id: 'player',
    name: character.name,
    nickname: character.nickname,
    avatar: character.avatar,
    isPlayer: true,
    age: division.competitionAge || realPlayerAge,
    ageCategory: playerAgeCategory,
    ageDivisionLabel: division.ageDivision.shortLabel,
    art: tournament.art,
    rankIndex: playerRankIndex,
    belt: playerBelt,
    stripes: playerStripes,
    weight: character.weight,
    weightClass: character.weightClass,
    gymId: character.currentGymId,
    gymName:
      character.playerAcademy && character.currentGymId === character.playerAcademy.id
        ? character.playerAcademy.name
        : 'Sua Academia',
    uf: playerCap?.uf,
    city: playerCap ? playerCap.capital : character.currentCity || character.homeCity,
    country: character.currentCountry || 'Brasil',
    gender: division.sex,
    giColor: division.giColor,
    wealthTier: character.money >= 50000 ? 'milionario' : character.money >= 8000 ? 'abastado' : 'classe_media',
    fightingStyle: 'jogador',
    attributes: { ...character.attributes },
    record: {
      wins: character.record.wins,
      losses: character.record.losses,
      draws: character.record.draws,
      kos: character.record.kos,
      subs: character.record.submissions
    }
  };

  const neededOpponents = tournament.bracketSize - 1;
  const worldPool = getMergedWorldFighters(character);
  const selWeight = division.selectedWeight;

  // Pontua candidatos por aderência estrita a sexo, arte, divisão etária, faixa/graduação, peso e geografia
  const scoredCandidates = worldPool
    .filter((f) => {
      // Sexo estritamente separado em chaves oficiais
      if ((f.gender || 'M') !== division.sex) return false;

      const fCountry = f.country || 'Brasil';
      if (
        (tournament.scope === 'municipal' ||
          tournament.scope === 'estadual' ||
          tournament.scope === 'regional' ||
          tournament.scope === 'nacional') &&
        fCountry !== 'Brasil'
      ) {
        return false;
      }
      if (f.art === tournament.art) return true;
      // MMA Pro aceita crossover de atletas adultos de outras artes apenas como reserva
      if (tournament.art === 'mma' && (f.ageCategory || getAgeCategoryFromAge(f.age)) === 'adulto') {
        return true;
      }
      return false;
    })
    .map((f) => {
      const fAgeCat = f.ageCategory || getAgeCategoryFromAge(f.age);
      const fRankIdx =
        f.rankIndex !== undefined
          ? f.rankIndex
          : Math.max(
              0,
              (MARTIAL_ARTS_META[f.art]?.ranks || []).findIndex(
                (r) => r.name.toLowerCase() === (f.belt || '').toLowerCase()
              )
            );
      const fRankDiv = resolveArtRankDivision(f.art, fRankIdx, f.age);
      const fScaleWeight = tournament.art === 'jiujitsu' && division.isGi ? f.weight + CBJJ_OFFICIAL_GI_WEIGHT_KG : f.weight;
      const inWeightMin = selWeight.minWeight <= 0 || fScaleWeight >= selWeight.minWeight - 1.5;
      const inWeightMax = selWeight.maxWeight === null || fScaleWeight <= selWeight.maxWeight + 0.5;

      let score = 0;
      if (f.art === tournament.art) score += 100;

      // Divisão etária exata (CBJJ e demais artes)
      const inExactAgeDiv =
        f.age >= division.ageDivision.minAge &&
        (division.ageDivision.maxAge === null || f.age <= division.ageDivision.maxAge);
      if (inExactAgeDiv) score += 90;
      else if (fAgeCat === effectiveBracketAgeCat) score += 50;
      else if (effectiveBracketAgeCat === 'master' && fAgeCat === 'adulto') score += 10;
      else score -= 120;

      // Peso compatível com a divisão
      if (inWeightMin && inWeightMax) score += 70;
      else {
        const refMax = selWeight.maxWeight ?? selWeight.minWeight + 12;
        const dist = Math.abs(fScaleWeight - refMax);
        score -= Math.min(80, Math.round(dist * 4));
      }

      // Graduação / Faixa
      if (fRankDiv.rankDivisionId === division.rankDivisionId) {
        score += 75;
      } else if (tournament.art === 'jiujitsu') {
        score -= 120; // CBJJ nunca mistura faixas distintas na mesma chave
      } else if (fRankIdx >= tournament.minRankIndex) {
        score += 20 - Math.abs(fRankIdx - playerRankIndex) * 5;
      } else {
        score -= 40;
      }

      // Coerência geográfica por abrangência do torneio
      const fCountry = f.country || 'Brasil';
      if (fCountry === 'Brasil') {
        const fCap = resolveBrazilCapitalByCity(f.city, 'SP');
        if (tournament.scope === 'municipal' || tournament.scope === 'estadual') {
          if (fCap.uf === host.hostUf) score += 45;
          else if (host.hostRegion && fCap.region === host.hostRegion) score += 18;
        } else if (tournament.scope === 'regional') {
          if (fCap.uf === host.hostUf) score += 40;
          else if (host.hostRegion && fCap.region === host.hostRegion) score += 25;
          else score += 5;
        } else if (tournament.scope === 'nacional' || (tournament.scope === 'mma_pro' && host.isBrazil)) {
          score += fCap.uf === host.hostUf ? 32 : 22;
        } else {
          score += 10;
        }
      } else {
        if (tournament.scope === 'internacional' || tournament.scope === 'mundial' || (tournament.scope === 'mma_pro' && !host.isBrazil)) {
          score += fCountry === host.hostCountry ? 35 : 22;
        } else {
          score -= 80;
        }
      }

      return { fighter: f, score, fAgeCat, fRankDiv, inExactAgeDiv };
    })
    .filter((item) => {
      if (tournament.art === 'jiujitsu') {
        return item.inExactAgeDiv && item.fRankDiv.rankDivisionId === division.rankDivisionId;
      }
      // Nunca misturar infantil com adulto/master em chave oficial
      if (effectiveBracketAgeCat === 'infantil') return item.fAgeCat === 'infantil';
      if (effectiveBracketAgeCat === 'juvenil') return item.fAgeCat === 'juvenil';
      return item.fAgeCat === 'adulto' || item.fAgeCat === 'master';
    })
    .filter((item) => item.score >= 150)
    .sort((a, b) => b.score - a.score);

  const selectedOpponents: BracketFighterSlot[] = [];
  const usedIds = new Set<string>(['player']);
  const usedNames = new Set<string>([character.name]);

  for (const cand of scoredCandidates) {
    if (selectedOpponents.length >= neededOpponents) break;
    if (usedIds.has(cand.fighter.id) || usedNames.has(cand.fighter.name)) continue;
    const slot = rivalToBracketSlot(cand.fighter, tournament, effectiveBracketAgeCat);
    slot.ageDivisionLabel = division.ageDivision.shortLabel;
    selectedOpponents.push(slot);
    usedIds.add(slot.id);
    usedNames.add(slot.name);
  }

  // Completa vagas restantes com desafiantes gerados deterministicamente para sexo, idade, faixa e peso exatos
  let genIdx = 1;
  while (selectedOpponents.length < neededOpponents) {
    const gen = generateSeededBracketChallenger(
      tournament,
      host,
      effectiveBracketAgeCat,
      division,
      playerRankIndex,
      genIdx,
      year,
      usedNames
    );
    selectedOpponents.push(gen);
    usedIds.add(gen.id);
    genIdx += 1;
  }

  // Ordena adversários por força crescente para que a Final traga os mais fortes
  selectedOpponents.sort((a, b) => {
    const powA = a.attributes.technique + a.attributes.strength + a.attributes.fightIq;
    const powB = b.attributes.technique + b.attributes.strength + b.attributes.fightIq;
    return powA - powB;
  });

  const participants: BracketFighterSlot[] = [playerSlot, ...selectedOpponents];
  const matches: TournamentBracketMatch[] = [];

  if (tournament.bracketSize === 4) {
    // 2 Semifinais + 1 Final
    // Coloca o adversário mais perigoso do outro lado da chave (P2 vs P3) para potencial Final épica
    matches.push(
      {
        matchId: `${tournament.id}_${year}_sf1`,
        stage: 'semifinal',
        matchNumber: 1,
        fighterAId: participants[0].id, // Jogador
        fighterBId: participants[1].id,
        winnerId: null,
        status: 'pronta'
      },
      {
        matchId: `${tournament.id}_${year}_sf2`,
        stage: 'semifinal',
        matchNumber: 2,
        fighterAId: participants[2].id,
        fighterBId: participants[3].id,
        winnerId: null,
        status: 'pronta'
      },
      {
        matchId: `${tournament.id}_${year}_final`,
        stage: 'final',
        matchNumber: 1,
        fighterAId: null,
        fighterBId: null,
        winnerId: null,
        status: 'pendente'
      }
    );
  } else {
    // 4 Quartas + 2 Semifinais + 1 Final
    matches.push(
      {
        matchId: `${tournament.id}_${year}_qf1`,
        stage: 'quartas',
        matchNumber: 1,
        fighterAId: participants[0].id, // Jogador
        fighterBId: participants[1].id,
        winnerId: null,
        status: 'pronta'
      },
      {
        matchId: `${tournament.id}_${year}_qf2`,
        stage: 'quartas',
        matchNumber: 2,
        fighterAId: participants[2].id,
        fighterBId: participants[3].id,
        winnerId: null,
        status: 'pronta'
      },
      {
        matchId: `${tournament.id}_${year}_qf3`,
        stage: 'quartas',
        matchNumber: 3,
        fighterAId: participants[4].id,
        fighterBId: participants[5].id,
        winnerId: null,
        status: 'pronta'
      },
      {
        matchId: `${tournament.id}_${year}_qf4`,
        stage: 'quartas',
        matchNumber: 4,
        fighterAId: participants[6].id,
        fighterBId: participants[7].id,
        winnerId: null,
        status: 'pronta'
      },
      {
        matchId: `${tournament.id}_${year}_sf1`,
        stage: 'semifinal',
        matchNumber: 1,
        fighterAId: null,
        fighterBId: null,
        winnerId: null,
        status: 'pendente'
      },
      {
        matchId: `${tournament.id}_${year}_sf2`,
        stage: 'semifinal',
        matchNumber: 2,
        fighterAId: null,
        fighterBId: null,
        winnerId: null,
        status: 'pendente'
      },
      {
        matchId: `${tournament.id}_${year}_final`,
        stage: 'final',
        matchNumber: 1,
        fighterAId: null,
        fighterBId: null,
        winnerId: null,
        status: 'pendente'
      }
    );
  }

  const bracketIsGi = resolveTournamentIsGi(tournament);
  return {
    bracketId: `${tournament.id}_${year}_${division.sex}_${division.ageDivision.id}_${division.rankDivisionId}_${division.selectedWeight.id}`,
    tournamentId: tournament.id,
    year,
    bracketSize: tournament.bracketSize,
    ageCategory: effectiveBracketAgeCat,
    ageDivisionId: division.ageDivision.id,
    ageDivisionLabel: division.ageDivision.label,
    genderDivision: division.sex,
    rankDivisionId: division.rankDivisionId,
    rankDivisionLabel: division.rankDivisionLabel,
    weightClass: tournament.weightClass,
    weightDivisionId: division.selectedWeight.id,
    weightDivisionLabel: division.selectedWeight.label,
    weightMaxKg: division.selectedWeight.maxWeight,
    isGi: bracketIsGi,
    participants,
    matches,
    championId: null
  };
}

/**
 * Garante que a entrada do torneio no histórico do personagem possua chaveamento válido (4 ou 8 atletas).
 * Preserva integralmente os participantes e resultados quando a chave já existir (nunca re-sorteia).
 */
export function ensureTournamentBracket(
  character: Character,
  tournament: Tournament,
  targetYear?: number,
  selection?: TournamentDivisionSelection
): { updatedChar: Character; entry: CharacterTournamentEntry; bracket: TournamentBracketState } {
  const updated = JSON.parse(JSON.stringify(character)) as Character;
  if (!updated.tournamentHistory) updated.tournamentHistory = [];

  const year = targetYear ?? updated.currentYear;
  const tMonth = tournament.monthScheduled ?? (((tournament.weekScheduled - 1) % 12) + 1);
  let entry = updated.tournamentHistory.find(
    (h) => h.tournamentId === tournament.id && h.year === year
  );

  const initialStage: 'quartas' | 'semifinal' = tournament.bracketSize === 8 ? 'quartas' : 'semifinal';
  const effectiveIsGi = resolveTournamentIsGi(tournament, entry);
  const divisionFromEntry: TournamentDivisionSelection | undefined = selection ?? (
    entry?.weightDivisionId
      ? {
          weightDivisionId: entry.weightDivisionId,
          weightClassLabel: entry.weightDivisionLabel,
          minWeightKg: entry.weightMinKg,
          maxWeightKg: entry.weightMaxKg,
          ageDivisionId: entry.ageDivisionId,
          ageDivisionLabel: entry.ageDivisionLabel,
          rankDivisionId: entry.rankDivisionId,
          rankDivisionLabel: entry.rankDivisionLabel,
          gender: entry.genderDivision,
          giColor: entry.giColor
        }
      : undefined
  );
  const resolvedDivision = resolveTournamentDivisionForCharacter(updated, tournament, year, divisionFromEntry);

  if (!entry) {
    entry = {
      tournamentId: tournament.id,
      year,
      month: tMonth,
      registered: true,
      weighInPassed: false,
      isGi: effectiveIsGi,
      giColor: resolvedDivision.giColor,
      genderDivision: resolvedDivision.sex,
      ageDivisionId: resolvedDivision.ageDivision.id,
      ageDivisionLabel: resolvedDivision.ageDivision.label,
      rankDivisionId: resolvedDivision.rankDivisionId,
      rankDivisionLabel: resolvedDivision.rankDivisionLabel,
      weightDivisionId: resolvedDivision.selectedWeight.id,
      weightDivisionLabel: resolvedDivision.selectedWeight.label,
      weightMinKg: resolvedDivision.selectedWeight.minWeight,
      weightMaxKg: resolvedDivision.selectedWeight.maxWeight,
      weightClass: tournament.weightClass,
      ageCategory: getAgeCategoryFromAge(getRealAthleteAge(updated)),
      homologatedMatchIds: [],
      rewardsClaimed: false,
      completed: false,
      currentStage: initialStage,
      matchesWon: 0,
      matchHistory: []
    };
    updated.tournamentHistory.push(entry);
  } else {
    if (entry.isGi === undefined) entry.isGi = effectiveIsGi;
    if (!entry.weightClass) entry.weightClass = tournament.weightClass;
    if (!entry.ageCategory) entry.ageCategory = getAgeCategoryFromAge(getRealAthleteAge(updated));
    if (!entry.genderDivision) entry.genderDivision = resolvedDivision.sex;
    if (!entry.ageDivisionId) entry.ageDivisionId = resolvedDivision.ageDivision.id;
    if (!entry.ageDivisionLabel) entry.ageDivisionLabel = resolvedDivision.ageDivision.label;
    if (!entry.rankDivisionId) entry.rankDivisionId = resolvedDivision.rankDivisionId;
    if (!entry.rankDivisionLabel) entry.rankDivisionLabel = resolvedDivision.rankDivisionLabel;
    if (!entry.weightDivisionId) {
      entry.weightDivisionId = resolvedDivision.selectedWeight.id;
      entry.weightDivisionLabel = resolvedDivision.selectedWeight.label;
      entry.weightMinKg = resolvedDivision.selectedWeight.minWeight;
      entry.weightMaxKg = resolvedDivision.selectedWeight.maxWeight;
    }
    if (!Array.isArray(entry.homologatedMatchIds)) entry.homologatedMatchIds = [];
  }

  if (!entry.bracket || entry.bracket.participants.length < tournament.bracketSize) {
    entry.bracket = buildTournamentBracket(tournament, updated, year, divisionFromEntry);
  } else {
    if (!entry.bracket.bracketId) {
      entry.bracket.bracketId = `${tournament.id}_${year}_${entry.bracket.ageCategory}_${entry.bracket.weightClass}`;
    }
    if (entry.bracket.isGi === undefined) {
      entry.bracket.isGi = effectiveIsGi;
    }
    if (!entry.bracket.ageDivisionLabel) entry.bracket.ageDivisionLabel = entry.ageDivisionLabel;
    if (!entry.bracket.weightDivisionLabel) entry.bracket.weightDivisionLabel = entry.weightDivisionLabel;
    if (!entry.bracket.rankDivisionLabel) entry.bracket.rankDivisionLabel = entry.rankDivisionLabel;
    if (!entry.bracket.genderDivision) entry.bracket.genderDivision = entry.genderDivision;
  }

  return { updatedChar: updated, entry, bracket: entry.bracket };
}

/**
 * Retorna a luta atual do jogador pronta na chave com os dados completos do adversário.
 */
export function getPlayerCurrentBracketMatch(
  bracket: TournamentBracketState
): { match: TournamentBracketMatch; opponent: BracketFighterSlot } | null {
  const readyMatch = bracket.matches.find(
    (m) =>
      m.status === 'pronta' &&
      (m.fighterAId === 'player' || m.fighterBId === 'player')
  );
  if (!readyMatch) return null;

  const oppId = readyMatch.fighterAId === 'player' ? readyMatch.fighterBId : readyMatch.fighterAId;
  if (!oppId) return null;

  const opponent = bracket.participants.find((p) => p.id === oppId);
  if (!opponent) return null;

  return { match: readyMatch, opponent };
}

function fighterCombatRating(f: BracketFighterSlot): number {
  const a = f.attributes;
  return (
    a.technique * 1.25 +
    a.fightIq * 1.15 +
    a.strength * 1.0 +
    a.stamina * 1.05 +
    a.speed * 0.95 +
    a.durability * 0.9 +
    a.mentalFocus * 0.8 +
    f.rankIndex * 3.5
  );
}

export interface BracketTiebreakResolution {
  winnerId: string;
  loserId: string;
  criterionLabel: string;
  isOfficialRule: boolean;
}

/**
 * Resolve empates em chaves eliminatórias de forma simétrica e transparente:
 * 1. Se o torneio possui critério oficial de vantagens/penalidades e há placar detalhado, compara vantagens e depois menos punições.
 * 2. Se o torneio prevê decisão de árbitros ou se vantagens/punições permanecerem empatadas, aplica o critério do evento quando cadastrado.
 * 3. Caso o evento não possua critério cadastrado ou permaneça empatado, aplica regra interna explícita do jogo
 *    (nunca rotulada como regra oficial da federação e jamais escolhendo automaticamente o adversário).
 */
export function resolveBracketTiebreaker(
  fighterA: BracketFighterSlot,
  fighterB: BracketFighterSlot,
  tournament: Tournament,
  scoreContext?: BjjMatchScore
): BracketTiebreakResolution {
  const hasExplicitOfficialRule =
    tournament.tiebreakRule === 'vantagens_penalidades' ||
    tournament.tiebreakRule === 'decisao_arbitro';

  // 1. Critério de Vantagens & Penalidades (quando aplicável ao regulamento e placar disponível)
  if (
    scoreContext &&
    (tournament.tiebreakRule === 'vantagens_penalidades' || (!tournament.tiebreakRule && tournament.rulesType === 'bjj_points'))
  ) {
    if (scoreContext.advantagesA !== scoreContext.advantagesB) {
      const aWins = scoreContext.advantagesA > scoreContext.advantagesB;
      return {
        winnerId: aWins ? fighterA.id : fighterB.id,
        loserId: aWins ? fighterB.id : fighterA.id,
        criterionLabel:
          tournament.tiebreakRule === 'vantagens_penalidades'
            ? `Critério do regulamento (${tournament.organization}): maior número de vantagens (${scoreContext.advantagesA}v x ${scoreContext.advantagesB}v)`
            : `Regra interna do jogo: desempate por vantagens acumuladas (${scoreContext.advantagesA}v x ${scoreContext.advantagesB}v)`,
        isOfficialRule: tournament.tiebreakRule === 'vantagens_penalidades'
      };
    }

    if (scoreContext.penaltiesA !== scoreContext.penaltiesB) {
      const aWins = scoreContext.penaltiesA < scoreContext.penaltiesB;
      return {
        winnerId: aWins ? fighterA.id : fighterB.id,
        loserId: aWins ? fighterB.id : fighterA.id,
        criterionLabel:
          tournament.tiebreakRule === 'vantagens_penalidades'
            ? `Critério do regulamento (${tournament.organization}): menor número de penalidades (${scoreContext.penaltiesA}p x ${scoreContext.penaltiesB}p)`
            : `Regra interna do jogo: desempate por menos penalidades (${scoreContext.penaltiesA}p x ${scoreContext.penaltiesB}p)`,
        isOfficialRule: tournament.tiebreakRule === 'vantagens_penalidades'
      };
    }
  }

  // 2. Decisão de arbitragem / índice técnico comparativo simétrico (sem viés contra o jogador)
  const techIndexA =
    fighterA.attributes.technique * 1.25 +
    fighterA.attributes.fightIq * 1.15 +
    fighterA.attributes.stamina * 0.9 +
    fighterA.rankIndex * 2;
  const techIndexB =
    fighterB.attributes.technique * 1.25 +
    fighterB.attributes.fightIq * 1.15 +
    fighterB.attributes.stamina * 0.9 +
    fighterB.rankIndex * 2;

  if (Math.abs(techIndexA - techIndexB) > 0.05) {
    const aWins = techIndexA > techIndexB;
    return {
      winnerId: aWins ? fighterA.id : fighterB.id,
      loserId: aWins ? fighterB.id : fighterA.id,
      criterionLabel:
        tournament.tiebreakRule === 'decisao_arbitro'
          ? `Critério do regulamento (${tournament.organization}): decisão dos árbitros por domínio técnico e iniciativa`
          : hasExplicitOfficialRule
          ? `Regra interna do jogo (desempate complementar após igualdade em vantagens/punições): maior índice técnico-tático e resistência`
          : `Regra interna do jogo (torneio sem critério oficial cadastrado): desempate eliminatório por índice técnico-tático`,
      isOfficialRule: tournament.tiebreakRule === 'decisao_arbitro'
    };
  }

  // 3. Desempate final determinístico simétrico por peso ou hash dos IDs (nunca favorece automaticamente 'opponent')
  if (Math.abs(fighterA.weight - fighterB.weight) > 0.05) {
    const aWins = fighterA.weight < fighterB.weight; // Atleta mais leve leva vantagem em empate absoluto
    return {
      winnerId: aWins ? fighterA.id : fighterB.id,
      loserId: aWins ? fighterB.id : fighterA.id,
      criterionLabel:
        'Regra interna do jogo (não oficial): desempate eliminatório por menor peso aferido em igualdade técnica absoluta',
      isOfficialRule: false
    };
  }

  const hashA = hashString(`${tournament.id}_${fighterA.id}_${fighterA.name}`);
  const hashB = hashString(`${tournament.id}_${fighterB.id}_${fighterB.name}`);
  const aWins = hashA >= hashB;
  return {
    winnerId: aWins ? fighterA.id : fighterB.id,
    loserId: aWins ? fighterB.id : fighterA.id,
    criterionLabel:
      'Regra interna do jogo (não oficial): desempate eliminatório por sorteio técnico simétrico em igualdade absoluta',
    isOfficialRule: false
  };
}

/**
 * Simula um confronto IA vs IA dentro da chave oficial de acordo com o regulamento da arte.
 * Em caso de igualdade no tempo regulamentar, aplica e registra o critério de desempate.
 */
export function simulateAiBracketMatch(
  match: TournamentBracketMatch,
  participants: BracketFighterSlot[],
  tournament: Tournament
): TournamentBracketMatch {
  if (match.status === 'concluida' && match.winnerId) return match;
  if (!match.fighterAId || !match.fighterBId) return match;

  const fA = participants.find((p) => p.id === match.fighterAId);
  const fB = participants.find((p) => p.id === match.fighterBId);
  if (!fA || !fB) return match;

  const rng = mulberry32(hashString(`${match.matchId}_${fA.id}_${fB.id}`));
  const scoreA = fighterCombatRating(fA) + (rng() - 0.5) * 28;
  const scoreB = fighterCombatRating(fB) + (rng() - 0.5) * 28;
  const margin = Math.abs(scoreA - scoreB);

  // Igualdade no placar regulamentar -> aciona critério de desempate completo
  if (margin < 0.8) {
    const simulatedScore: BjjMatchScore = {
      pointsA: 2,
      pointsB: 2,
      advantagesA: rng() > 0.5 ? 1 : 0,
      advantagesB: rng() > 0.5 ? 1 : 0,
      penaltiesA: 0,
      penaltiesB: 0
    };
    const tb = resolveBracketTiebreaker(fA, fB, tournament, simulatedScore);
    return {
      ...match,
      winnerId: tb.winnerId,
      loserId: tb.loserId,
      method: 'Empate / Desempate Eliminatório',
      scoreSummary: `2x2 (${simulatedScore.advantagesA}v x ${simulatedScore.advantagesB}v) — ${tb.criterionLabel}`,
      tiebreakApplied: true,
      tiebreakCriterion: tb.criterionLabel,
      resultType: 'desempate',
      status: 'concluida'
    };
  }

  const winner = scoreA > scoreB ? fA : fB;
  const loser = winner.id === fA.id ? fB : fA;

  let method = 'Pontos';
  let scoreSummary = 'Decisão Unânime';
  let tiebreakApplied = false;
  let tiebreakCriterion: string | undefined;
  let resultType: TournamentBracketMatch['resultType'] = 'combate';

  switch (tournament.art) {
    case 'jiujitsu': {
      if (margin > 14 || rng() < 0.42) {
        const subs = ['Armlock', 'Mata-Leão', 'Triângulo', 'Estrangulamento Cruzado', 'Kimura'];
        method = `Finalização (${subs[Math.floor(rng() * subs.length)]})`;
        scoreSummary = `${2 + Math.floor(rng() * 5)}x0`;
      } else if (margin < 3) {
        const advW = 1 + Math.floor(rng() * 2);
        const simulatedTieScore: BjjMatchScore = {
          pointsA: 2,
          pointsB: 2,
          advantagesA: winner.id === fA.id ? advW : 0,
          advantagesB: winner.id === fB.id ? advW : 0,
          penaltiesA: 0,
          penaltiesB: 0
        };
        const tb = resolveBracketTiebreaker(fA, fB, tournament, simulatedTieScore);
        method = 'Vantagem (Desempate)';
        scoreSummary = `2x2 (${simulatedTieScore.advantagesA}v x ${simulatedTieScore.advantagesB}v) — ${tb.criterionLabel}`;
        tiebreakApplied = true;
        tiebreakCriterion = tb.criterionLabel;
        resultType = 'desempate';
      } else {
        const ptsW = 4 + Math.floor(rng() * 6);
        const ptsL = Math.max(0, ptsW - 2 - Math.floor(rng() * 4));
        method = 'Pontos';
        scoreSummary = `${ptsW}x${ptsL}`;
      }
      break;
    }
    case 'judo': {
      if (margin > 10 || rng() < 0.55) {
        const throws = ['Uchi-Mata', 'Ippon-Seoi-Nage', 'O-Soto-Gari', 'Harai-Goshi', 'Juji-Gatame'];
        method = `Ippon (${throws[Math.floor(rng() * throws.length)]})`;
        scoreSummary = 'Ippon (10-0)';
      } else {
        method = 'Waza-ari';
        scoreSummary = '1 Waza-ari x 0';
      }
      break;
    }
    case 'boxe':
    case 'muaythai': {
      if (margin > 15 || rng() < 0.38) {
        method = rng() < 0.5 ? 'Nocaute (KO)' : 'Nocaute Técnico (TKO)';
        scoreSummary = `Round ${1 + Math.floor(rng() * Math.max(1, tournament.rounds))}`;
      } else {
        method = 'Decisão Unânime';
        scoreSummary = '30-27';
      }
      break;
    }
    case 'karate': {
      if (margin > 12 || rng() < 0.35) {
        method = 'Ippon (Mawashi-Geri)';
        scoreSummary = '8x2';
      } else {
        method = 'Pontos WKF';
        const ptsW = 3 + Math.floor(rng() * 4);
        const ptsL = Math.max(0, ptsW - 1 - Math.floor(rng() * 2));
        scoreSummary = `${ptsW}x${ptsL}`;
      }
      break;
    }
    case 'capoeira': {
      method = rng() < 0.35 ? 'Rasteira & Domínio de Roda' : 'Pontos / Mandinga';
      scoreSummary = `${18 + Math.floor(rng() * 8)} x ${12 + Math.floor(rng() * 6)}`;
      break;
    }
    case 'lutalivre': {
      if (margin > 12 || rng() < 0.52) {
        const subs = ['Guilhotina', 'Chave de Calcanhar', 'Mata-Leão', 'Katagatame'];
        method = `Finalização (${subs[Math.floor(rng() * subs.length)]})`;
        scoreSummary = 'Submissão';
      } else {
        method = 'Pontos LLE';
        scoreSummary = `${6 + Math.floor(rng() * 4)}x${Math.floor(rng() * 4)}`;
      }
      break;
    }
    case 'mma': {
      const roll = rng();
      if (roll < 0.38) {
        method = 'TKO (Ground and Pound)';
        scoreSummary = `Round ${1 + Math.floor(rng() * Math.max(1, tournament.rounds))}`;
      } else if (roll < 0.68) {
        method = 'Finalização';
        scoreSummary = `Round ${1 + Math.floor(rng() * Math.max(1, tournament.rounds))}`;
      } else {
        method = 'Decisão Unânime';
        scoreSummary = '29-28';
      }
      break;
    }
  }

  return {
    ...match,
    winnerId: winner.id,
    loserId: loser.id,
    method,
    scoreSummary,
    tiebreakApplied,
    tiebreakCriterion,
    resultType,
    status: 'concluida'
  };
}

function cloneBracket(b: TournamentBracketState): TournamentBracketState {
  return JSON.parse(JSON.stringify(b)) as TournamentBracketState;
}

export interface ResolvePlayerBracketMatchOptions {
  /** Por padrão true em chaves eliminatórias; se false, empate permanece sem vencedor nem avanço */
  applyTiebreaker?: boolean;
  /** Placar completo da luta para aplicar vantagens/penalidades no desempate */
  score?: BjjMatchScore;
  /** ID explícito do confronto para garantir correspondência única */
  matchId?: string;
}

/**
 * Atualiza a chave oficial após o combate do jogador:
 * - Registra o resultado do jogador na fase atual
 * - Trata empates conforme o critério do evento ou regra interna documentada (sem jamais favorecer o oponente por omissão)
 * - Simula todas as lutas paralelas da chave contrária
 * - Avança os vencedores para a próxima fase ('semifinal' ou 'final') apenas quando confrontos anteriores estão concluídos
 * - Caso o jogador tenha perdido/sido eliminado no desempate, simula o restante da chave para definir o campeão oficial
 */
export function resolvePlayerBracketMatch(
  bracket: TournamentBracketState,
  tournament: Tournament,
  stage: 'quartas' | 'semifinal' | 'final',
  playerOutcome: 'player' | 'opponent' | 'draw',
  method: string,
  scoreSummary: string,
  options?: ResolvePlayerBracketMatchOptions
): {
  updatedBracket: TournamentBracketState;
  simulatedAiResults: Array<{ stage: string; winnerName: string; loserName: string; method: string }>;
  nextStage?: 'semifinal' | 'final';
  effectiveOutcome: 'player' | 'opponent' | 'draw';
  tiebreakApplied: boolean;
  tiebreakCriterion?: string;
} {
  const next = cloneBracket(bracket);
  const simulatedAiResults: Array<{ stage: string; winnerName: string; loserName: string; method: string }> = [];

  const getFighterName = (id: string | null | undefined) =>
    next.participants.find((p) => p.id === id)?.name || 'Lutador';

  // 1. Localiza e resolve a luta do jogador na fase atual
  const playerMatchIdx = next.matches.findIndex(
    (m) =>
      (options?.matchId && m.matchId === options.matchId) ||
      (m.stage === stage && (m.fighterAId === 'player' || m.fighterBId === 'player'))
  );

  let effectiveOutcome: 'player' | 'opponent' | 'draw' = playerOutcome;
  let tiebreakApplied = false;
  let tiebreakCriterion: string | undefined;

  if (playerMatchIdx >= 0) {
    const pm = next.matches[playerMatchIdx];
    const oppId = pm.fighterAId === 'player' ? pm.fighterBId : pm.fighterAId;

    if (playerOutcome === 'draw') {
      const shouldApplyTiebreaker = options?.applyTiebreaker !== false;
      const playerSlot = next.participants.find((p) => p.id === 'player');
      const oppSlot = oppId ? next.participants.find((p) => p.id === oppId) : undefined;

      if (shouldApplyTiebreaker && playerSlot && oppSlot) {
        const tb = resolveBracketTiebreaker(playerSlot, oppSlot, tournament, options?.score);
        tiebreakApplied = true;
        tiebreakCriterion = tb.criterionLabel;
        effectiveOutcome = tb.winnerId === 'player' ? 'player' : 'opponent';

        next.matches[playerMatchIdx] = {
          ...pm,
          winnerId: tb.winnerId,
          loserId: tb.loserId,
          method: `${method} — Desempate`,
          scoreSummary: `${scoreSummary} (${tb.criterionLabel})`,
          tiebreakApplied: true,
          tiebreakCriterion: tb.criterionLabel,
          resultType: 'desempate',
          status: 'concluida'
        };
      } else {
        // Empate explícito sem desempate: nenhum atleta é declarado vencedor ou promovido
        effectiveOutcome = 'draw';
        tiebreakApplied = false;
        tiebreakCriterion = 'Empate no tempo regulamentar (sem critério de desempate aplicado)';

        next.matches[playerMatchIdx] = {
          ...pm,
          winnerId: null,
          loserId: null,
          method: `${method} (Empate)`,
          scoreSummary,
          tiebreakApplied: false,
          tiebreakCriterion,
          resultType: 'combate',
          status: 'concluida'
        };
      }
    } else {
      const winnerId = playerOutcome === 'player' ? 'player' : oppId;
      const loserId = playerOutcome === 'player' ? oppId : 'player';

      next.matches[playerMatchIdx] = {
        ...pm,
        winnerId: winnerId || null,
        loserId: loserId || null,
        method,
        scoreSummary,
        tiebreakApplied: false,
        resultType: 'combate',
        status: 'concluida'
      };
    }
  }

  // 2. Simula todas as outras lutas pendentes/prontas desta mesma fase
  for (let i = 0; i < next.matches.length; i++) {
    const m = next.matches[i];
    if (m.stage === stage && m.status !== 'concluida' && m.fighterAId && m.fighterBId) {
      const resolved = simulateAiBracketMatch(m, next.participants, tournament);
      next.matches[i] = resolved;
      if (resolved.winnerId && resolved.loserId) {
        simulatedAiResults.push({
          stage:
            stage === 'quartas' ? 'Quartas de Final' : stage === 'semifinal' ? 'Semifinal' : 'Grande Final',
          winnerName: getFighterName(resolved.winnerId),
          loserName: getFighterName(resolved.loserId),
          method: resolved.method || 'Pontos'
        });
      }
    }
  }

  // 3. Propaga vencedores para a fase seguinte APENAS quando confrontos de origem estiverem concluídos e com vencedores válidos
  const propagateRound = (fromStage: 'quartas' | 'semifinal', toStage: 'semifinal' | 'final') => {
    const fromMatches = next.matches
      .filter((m) => m.stage === fromStage)
      .sort((a, b) => a.matchNumber - b.matchNumber);
    const toMatches = next.matches
      .filter((m) => m.stage === toStage)
      .sort((a, b) => a.matchNumber - b.matchNumber);

    for (let i = 0; i < toMatches.length; i++) {
      const mA = fromMatches[i * 2];
      const mB = fromMatches[i * 2 + 1];
      const targetIdx = next.matches.findIndex((m) => m.matchId === toMatches[i].matchId);
      if (targetIdx >= 0 && next.matches[targetIdx].status !== 'concluida') {
        const aDone = mA?.status === 'concluida' && Boolean(mA.winnerId);
        const bDone = mB?.status === 'concluida' && Boolean(mB.winnerId);
        const fAId = aDone ? mA!.winnerId : null;
        const fBId = bDone ? mB!.winnerId : null;
        next.matches[targetIdx] = {
          ...next.matches[targetIdx],
          fighterAId: fAId,
          fighterBId: fBId,
          status: fAId && fBId ? 'pronta' : 'pendente'
        };
      }
    }
  };

  if (stage === 'quartas') {
    propagateRound('quartas', 'semifinal');
  } else if (stage === 'semifinal') {
    propagateRound('semifinal', 'final');
  } else if (stage === 'final') {
    const finalMatch = next.matches.find((m) => m.stage === 'final');
    next.championId = finalMatch?.winnerId || null;
  }

  // 4. Se o jogador foi eliminado (derrota direta ou no desempate), conclui as rodadas restantes entre os classificados
  if (effectiveOutcome === 'opponent' && stage !== 'final') {
    if (stage === 'quartas') {
      for (let i = 0; i < next.matches.length; i++) {
        if (
          next.matches[i].stage === 'semifinal' &&
          next.matches[i].status !== 'concluida' &&
          next.matches[i].fighterAId &&
          next.matches[i].fighterBId
        ) {
          const resolved = simulateAiBracketMatch(next.matches[i], next.participants, tournament);
          next.matches[i] = resolved;
        }
      }
      propagateRound('semifinal', 'final');
    }
    for (let i = 0; i < next.matches.length; i++) {
      if (
        next.matches[i].stage === 'final' &&
        next.matches[i].status !== 'concluida' &&
        next.matches[i].fighterAId &&
        next.matches[i].fighterBId
      ) {
        const resolved = simulateAiBracketMatch(next.matches[i], next.participants, tournament);
        next.matches[i] = resolved;
        next.championId = resolved.winnerId || null;
      }
    }
    return {
      updatedBracket: next,
      simulatedAiResults,
      effectiveOutcome,
      tiebreakApplied,
      tiebreakCriterion
    };
  }

  // 5. Se o jogador venceu quartas ou semifinal (diretamente ou por desempate), avança para a próxima fase
  let nextStage: 'semifinal' | 'final' | undefined;
  if (effectiveOutcome === 'player') {
    if (stage === 'quartas') nextStage = 'semifinal';
    else if (stage === 'semifinal') nextStage = 'final';
  }

  return {
    updatedBracket: next,
    simulatedAiResults,
    nextStage,
    effectiveOutcome,
    tiebreakApplied,
    tiebreakCriterion
  };
}
