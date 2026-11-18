import {
  Character,
  GameDate,
  MartialArtType,
  RivalNPC,
  SocialContact,
  SocialPersonality,
  SocialRelationType,
  WealthTier
} from '../types/game';
import { MARTIAL_ARTS_META, WORLD_GYMS } from '../data/martialArtsData';
import { calculateAge, getDaysInMonth } from './dateUtils';
import { getAgeCategoryFromAge, getWeightClassFromWeight, WORLD_FIGHTERS } from '../data/worldFightersData';
import { computeBjjStripesFromProgress, formatBjjBeltWithDegree } from './bjjDegreeHelper';
import { getDifficultyProfile } from './talentAndDifficultyHelper';

export interface PersonalityMeta {
  id: SocialPersonality;
  label: string;
  desc: string;
  preferredArts: MartialArtType[];
  martialAcceptanceBonus: number;
}

export const PERSONALITIES_META: Record<SocialPersonality, PersonalityMeta> = {
  leal: {
    id: 'leal',
    label: 'Leal & Protetor',
    desc: 'Valoriza laços profundos e defende quem ama nos momentos difíceis.',
    preferredArts: ['jiujitsu', 'judo', 'boxe'],
    martialAcceptanceBonus: 0.18
  },
  ambicioso: {
    id: 'ambicioso',
    label: 'Ambicioso & Competitivo',
    desc: 'Sempre busca crescimento financeiro, status e desafios maiores.',
    preferredArts: ['mma', 'boxe', 'muaythai'],
    martialAcceptanceBonus: 0.22
  },
  tranquilo: {
    id: 'tranquilo',
    label: 'Tranquilo & Zen',
    desc: 'Equilibrado, evita conflitos desnecessários e busca paz na rotina.',
    preferredArts: ['judo', 'karate', 'capoeira'],
    martialAcceptanceBonus: 0.08
  },
  explosivo: {
    id: 'explosivo',
    label: 'Esquentado & Impulsivo',
    desc: 'Reage rápido a provocações, mas tem energia intensa no dia a dia.',
    preferredArts: ['muaythai', 'boxe', 'lutalivre'],
    martialAcceptanceBonus: 0.2
  },
  frio: {
    id: 'frio',
    label: 'Frio & Calculista',
    desc: 'Analítico e reservado; confia em poucos, mas cumpre o que promete.',
    preferredArts: ['karate', 'jiujitsu', 'lutalivre'],
    martialAcceptanceBonus: 0.12
  },
  carismatico: {
    id: 'carismatico',
    label: 'Carismático & Sociável',
    desc: 'Faz amizades em qualquer lugar e traz leveza para o círculo social.',
    preferredArts: ['capoeira', 'jiujitsu', 'muaythai'],
    martialAcceptanceBonus: 0.15
  },
  disciplinado: {
    id: 'disciplinado',
    label: 'Disciplinado & Metódico',
    desc: 'Seguidor rígido de horários, treinos, estudos e evolução constante.',
    preferredArts: ['karate', 'judo', 'mma'],
    martialAcceptanceBonus: 0.25
  }
};

const ALL_PERSONALITIES: SocialPersonality[] = [
  'leal',
  'ambicioso',
  'tranquilo',
  'explosivo',
  'frio',
  'carismatico',
  'disciplinado'
];

const MALE_NAMES = [
  'Lucas', 'Mateus', 'Rafael', 'Pedro', 'Gabriel', 'Bruno', 'Felipe', 'Gustavo',
  'Thiago', 'Leonardo', 'Rodrigo', 'Eduardo', 'Henrique', 'Danilo', 'Caio', 'André',
  'Marcelo', 'Daniel', 'Vinícius', 'Igor', 'Samuel', 'Heitor', 'Murilo', 'Arthur'
];

const FEMALE_NAMES = [
  'Mariana', 'Camila', 'Juliana', 'Larissa', 'Beatriz', 'Fernanda', 'Amanda', 'Carolina',
  'Patrícia', 'Letícia', 'Gabriela', 'Rafaela', 'Natália', 'Vanessa', 'Isabela', 'Helena',
  'Bruna', 'Sofia', 'Bianca', 'Cláudia', 'Priscila', 'Laura', 'Lívia', 'Renata'
];

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida',
  'Nascimento', 'Lima', 'Araújo', 'Fernandes', 'Carvalho', 'Gomes', 'Martins', 'Rocha',
  'Ribeiro', 'Alves', 'Monteiro', 'Mendes', 'Barros', 'Freitas', 'Barbosa', 'Cardoso'
];

const ADULT_JOBS = [
  { job: 'Técnico de Manutenção', routine: 'Oficina pela manhã e tarde · Lazer à noite' },
  { job: 'Enfermeiro(a) Hospitalar', routine: 'Plantões alternados · Descanso e família' },
  { job: 'Professor(a) Escolar', routine: 'Aulas de manhã · Correção e leitura à tarde' },
  { job: 'Comerciante Local', routine: 'Balcão comercial em horário integral' },
  { job: 'Motorista de Aplicativo', routine: 'Corridas na cidade · Horários flexíveis' },
  { job: 'Designer & Social Media', routine: 'Home office criativo · Eventos culturais' },
  { job: 'Analista Administrativo', routine: 'Escritório comercial 8h–17h' },
  { job: 'Educador(a) Físico(a)', routine: 'Avaliações físicas e corrida no parque' },
  { job: 'Chef / Cozinheiro(a)', routine: 'Cozinha movimentada · Folgas às segundas' },
  { job: 'Empresário(a) de Eventos', routine: 'Reuniões externas e networking noturno' }
];

const NPC_INFLUENCERS = [
  'Mestre Tião do Tatame',
  'um colega da faculdade',
  'um amigo antigo de infância',
  'o instrutor da academia vizinha',
  'um primo praticante de artes marciais'
];

function pick<T>(arr: T[], rng: () => number = Math.random): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function getPersonalityInfo(p: SocialPersonality): PersonalityMeta {
  return PERSONALITIES_META[p] || PERSONALITIES_META.leal;
}

export function getRelationLabel(contact: SocialContact): string {
  const isF = contact.gender === 'F';
  if (contact.relationType === 'pai') return 'Pai';
  if (contact.relationType === 'mae') return 'Mãe';
  if (contact.relationType === 'irmao') return isF ? 'Irmã' : 'Irmão';
  if (contact.relationType === 'filho') return isF ? 'Filha' : 'Filho';
  if (contact.relationshipStage === 'casado' || contact.relationType === 'conjuge') {
    return isF ? 'Esposa' : 'Marido';
  }
  if (contact.relationshipStage === 'noivo') return isF ? 'Noiva' : 'Noivo';
  if (contact.relationshipStage === 'namorando' || contact.relationType === 'namorado') {
    return isF ? 'Namorada' : 'Namorado';
  }
  if (contact.relationshipStage === 'inimigo' || contact.relationType === 'inimigo') {
    return isF ? 'Inimiga' : 'Inimigo';
  }
  if (contact.relationshipStage === 'melhor_amigo') return isF ? 'Melhor Amiga' : 'Melhor Amigo';
  if (contact.relationshipStage === 'amigo' || contact.relationType === 'amigo') {
    return isF ? 'Amiga' : 'Amigo';
  }
  return isF ? 'Conhecida' : 'Conhecido';
}

export function deriveOccupationAndRoutineForAge(
  age: number,
  currentOccupation?: string,
  martialArt?: MartialArtType | null,
  rng: () => number = Math.random
): { occupation: string; dailyRoutine: string } {
  const artSuffix = martialArt ? ` · Treina ${MARTIAL_ARTS_META[martialArt].name.split(' ')[0]}` : '';

  if (age <= 3) {
    return {
      occupation: 'Bebê em casa',
      dailyRoutine: 'Cuidados da família, sonecas e primeiras descobertas'
    };
  }
  if (age <= 5) {
    return {
      occupation: 'Educação Infantil (Creche)',
      dailyRoutine: `Brincadeiras e escola pela manhã${artSuffix}`
    };
  }
  if (age <= 13) {
    return {
      occupation: 'Estudante (Ensino Fundamental)',
      dailyRoutine: `Escola pela manhã · Tarefas e brincadeiras à tarde${artSuffix}`
    };
  }
  if (age <= 17) {
    return {
      occupation: 'Estudante (Ensino Médio)',
      dailyRoutine: `Colégio pela manhã · Estudos e amigos à tarde${artSuffix}`
    };
  }
  if (age >= 65) {
    return {
      occupation: 'Aposentado(a)',
      dailyRoutine: `Caminhadas matinais, casa e convívio familiar${artSuffix}`
    };
  }

  // Adulto (18..64): mantém profissão adulta existente se já tiver uma válida
  const isChildOrRetired =
    !currentOccupation ||
    currentOccupation.includes('Bebê') ||
    currentOccupation.includes('Creche') ||
    currentOccupation.includes('Estudante') ||
    currentOccupation.includes('Aposentado');

  if (!isChildOrRetired) {
    const found = ADULT_JOBS.find((j) => j.job === currentOccupation);
    const baseRoutine = found ? found.routine : 'Trabalho diário e compromissos pessoais';
    return {
      occupation: currentOccupation!,
      dailyRoutine: `${baseRoutine}${artSuffix}`
    };
  }

  if (age <= 22 && rng() < 0.55) {
    return {
      occupation: 'Universitário(a) & Estagiário(a)',
      dailyRoutine: `Estágio de manhã · Faculdade à noite${artSuffix}`
    };
  }

  const picked = pick(ADULT_JOBS, rng);
  return {
    occupation: picked.job,
    dailyRoutine: `${picked.routine}${artSuffix}`
  };
}

function makeBirthDateForAge(refDate: GameDate, targetAge: number, rng: () => number): GameDate {
  return {
    day: 1 + Math.floor(rng() * 28),
    month: 1 + Math.floor(rng() * 12),
    year: refDate.year - targetAge
  };
}

function extractFamilySurname(playerName: string): string {
  const parts = playerName.trim().split(/\s+/);
  if (parts.length > 1) return parts[parts.length - 1];
  return 'Souza';
}

/**
 * Cria o núcleo social e familiar inicial de um personagem novo ou migrado de save antigo.
 */
export function createInitialSocialContacts(char: Character, rng: () => number = Math.random): SocialContact[] {
  const refDate = char.currentDate || { day: 15, month: 1, year: char.currentYear || 2026 };
  const city = char.homeCity || 'São Paulo';
  const surname = extractFamilySurname(char.name || 'Guerreiro');
  const familyWealth: WealthTier =
    char.familyWealthTier || getDifficultyProfile(char.difficulty).familyWealthTier;

  const fatherAge = char.age + 26 + Math.floor(rng() * 6);
  const motherAge = char.age + 24 + Math.floor(rng() * 6);
  const siblingIsOlder = rng() < 0.45;
  const siblingAge = Math.max(4, char.age + (siblingIsOlder ? 2 : -2));
  const siblingGender: 'M' | 'F' = rng() < 0.5 ? 'F' : 'M';
  const siblingFirst = siblingGender === 'F' ? pick(FEMALE_NAMES, rng) : pick(MALE_NAMES, rng);

  const friend1Gender: 'M' | 'F' = rng() < 0.5 ? 'M' : 'F';
  const friend1First = friend1Gender === 'F' ? pick(FEMALE_NAMES, rng) : pick(MALE_NAMES, rng);
  const friend1Age = Math.max(7, char.age + Math.floor(rng() * 3) - 1);

  const friend2Gender: 'M' | 'F' = char.gender === 'F' ? 'M' : 'F';
  const friend2First = friend2Gender === 'F' ? pick(FEMALE_NAMES, rng) : pick(MALE_NAMES, rng);
  const friend2Age = Math.max(8, char.age + Math.floor(rng() * 3) - 1);

  const enemyFirst = pick(MALE_NAMES, rng);
  const enemyAge = Math.max(8, char.age + 1);

  const fatherJob = deriveOccupationAndRoutineForAge(fatherAge, undefined, null, rng);
  const motherJob = deriveOccupationAndRoutineForAge(motherAge, undefined, null, rng);
  const siblingJob = deriveOccupationAndRoutineForAge(siblingAge, undefined, null, rng);
  const friend1Job = deriveOccupationAndRoutineForAge(friend1Age, undefined, null, rng);
  const friend2Job = deriveOccupationAndRoutineForAge(friend2Age, undefined, null, rng);
  const enemyArt: MartialArtType = 'boxe';
  const enemyJob = deriveOccupationAndRoutineForAge(enemyAge, undefined, enemyArt, rng);

  const contacts: SocialContact[] = [
    {
      id: 'fam_pai',
      name: `${pick(MALE_NAMES, rng)} ${surname}`,
      avatar: '👨',
      gender: 'M',
      relationType: 'pai',
      personality: pick(['leal', 'disciplinado', 'tranquilo'], rng),
      birthDate: makeBirthDateForAge(refDate, fatherAge, rng),
      age: fatherAge,
      isAlive: true,
      health: 88,
      wealthTier: familyWealth,
      occupation: fatherJob.occupation,
      dailyRoutine: fatherJob.dailyRoutine,
      city,
      affinity: 78,
      romanceLevel: 0,
      respect: 82,
      relationshipStage: 'familia',
      martialArt: null,
      recentLifeEvents: ['Torce pelo seu sucesso desde o primeiro dia no tatame.']
    },
    {
      id: 'fam_mae',
      name: `${pick(FEMALE_NAMES, rng)} ${surname}`,
      avatar: '👩',
      gender: 'F',
      relationType: 'mae',
      personality: pick(['leal', 'carismatico', 'tranquilo'], rng),
      birthDate: makeBirthDateForAge(refDate, motherAge, rng),
      age: motherAge,
      isAlive: true,
      health: 90,
      wealthTier: familyWealth,
      occupation: motherJob.occupation,
      dailyRoutine: motherJob.dailyRoutine,
      city,
      affinity: 84,
      romanceLevel: 0,
      respect: 85,
      relationshipStage: 'familia',
      martialArt: null,
      recentLifeEvents: ['Prepara sua comida caseira e cobra boas notas e descanso.']
    },
    {
      id: 'fam_irmao',
      name: `${siblingFirst} ${surname}`,
      avatar: siblingGender === 'F' ? '👧' : '🧑',
      gender: siblingGender,
      relationType: 'irmao',
      personality: pick(ALL_PERSONALITIES, rng),
      birthDate: makeBirthDateForAge(refDate, siblingAge, rng),
      age: siblingAge,
      isAlive: true,
      health: 96,
      wealthTier: familyWealth,
      occupation: siblingJob.occupation,
      dailyRoutine: siblingJob.dailyRoutine,
      city,
      affinity: 68,
      romanceLevel: 0,
      respect: 60,
      relationshipStage: 'familia',
      martialArt: null,
      recentLifeEvents: ['Divide o dia a dia em casa e observa seu esforço nas lutas.']
    },
    {
      id: 'soc_amigo_1',
      name: `${friend1First} ${pick(LAST_NAMES, rng)}`,
      avatar: friend1Gender === 'F' ? '🙋‍♀️' : '🙋‍♂️',
      gender: friend1Gender,
      relationType: 'amigo',
      personality: pick(['carismatico', 'leal', 'tranquilo'], rng),
      birthDate: makeBirthDateForAge(refDate, friend1Age, rng),
      age: friend1Age,
      isAlive: true,
      health: 95,
      wealthTier: 'classe_media',
      occupation: friend1Job.occupation,
      dailyRoutine: friend1Job.dailyRoutine,
      city,
      affinity: 62,
      romanceLevel: 0,
      respect: 55,
      relationshipStage: 'amigo',
      martialArt: null,
      recentLifeEvents: ['Amigo(a) próximo(a) do bairro que sempre te acompanha nos rolês.']
    },
    {
      id: 'soc_amigo_2',
      name: `${friend2First} ${pick(LAST_NAMES, rng)}`,
      avatar: friend2Gender === 'F' ? '👩‍🎨' : '🧑‍💻',
      gender: friend2Gender,
      relationType: 'amigo',
      personality: pick(['ambicioso', 'carismatico', 'disciplinado'], rng),
      birthDate: makeBirthDateForAge(refDate, friend2Age, rng),
      age: friend2Age,
      isAlive: true,
      health: 96,
      wealthTier: rng() < 0.3 ? 'abastado' : 'classe_media',
      occupation: friend2Job.occupation,
      dailyRoutine: friend2Job.dailyRoutine,
      city,
      affinity: 52,
      romanceLevel: char.age >= 15 ? 25 : 0,
      respect: 52,
      relationshipStage: 'amigo',
      martialArt: null,
      recentLifeEvents: ['Adora conversar sobre música, carreira e projetos de futuro.']
    },
    {
      id: 'soc_inimigo_1',
      name: `${enemyFirst} ${pick(LAST_NAMES, rng)}`,
      avatar: '😠',
      gender: 'M',
      relationType: 'inimigo',
      personality: 'explosivo',
      birthDate: makeBirthDateForAge(refDate, enemyAge, rng),
      age: enemyAge,
      isAlive: true,
      health: 94,
      wealthTier: 'classe_media',
      occupation: enemyJob.occupation,
      dailyRoutine: enemyJob.dailyRoutine,
      city,
      affinity: -55,
      romanceLevel: 0,
      respect: 20,
      relationshipStage: 'inimigo',
      martialArt: enemyArt,
      martialArtRankIndex: 0,
      martialArtBelt: MARTIAL_ARTS_META[enemyArt].ranks[0].name,
      martialArtMonths: 3,
      martialArtSource: 'propria',
      martialArtInfluencerName: 'Academia rival do centro',
      recentLifeEvents: ['Sempre provoca você na saída da escola/academia.']
    }
  ];

  return contacts;
}

/**
 * Sincroniza um SocialContact praticante de arte marcial para `character.rivals` (se elegível >= 9 anos),
 * permitindo vê-lo no circuito FighterNet, rankings e torneios!
 */
export function syncSocialFighterToWorldRivals(char: Character, contact: SocialContact): Character {
  if (!contact.martialArt || contact.age < 9 || !contact.isAlive) return char;
  const updated = JSON.parse(JSON.stringify(char)) as Character;
  if (!Array.isArray(updated.rivals)) updated.rivals = [];

  const rivalId = contact.linkedWorldFighterId || `social_fighter_${contact.id}`;
  const art = contact.martialArt;
  const meta = MARTIAL_ARTS_META[art];
  const rankIdx = Math.min(contact.martialArtRankIndex ?? 0, meta.ranks.length - 1);
  const stripes = contact.martialArtStripes ?? 0;
  const baseRankName = contact.martialArtBelt || meta.ranks[rankIdx]?.name || meta.ranks[0].name;
  const belt = art === 'jiujitsu' ? formatBjjBeltWithDegree(rankIdx, baseRankName, stripes) : baseRankName;
  const existingIdx = updated.rivals.findIndex((r) => r.id === rivalId);

  const weight = contact.age < 13 ? 42 : contact.age < 17 ? 59 : contact.gender === 'F' ? 60 : 72;
  const gymId =
    contact.martialArtSource === 'pj'
      ? updated.currentGymId || 'gym_bairro'
      : 'gym_bairro';
  const gymObj = WORLD_GYMS.find((g) => g.id === gymId) || WORLD_GYMS[0];

  const mappedPersonality: RivalNPC['personality'] =
    contact.personality === 'explosivo'
      ? 'arrogante'
      : contact.personality === 'frio'
      ? 'frio_calculista'
      : contact.personality === 'carismatico' || contact.personality === 'ambicioso'
      ? 'fanfarrao'
      : 'respeitoso';

  const baseStat = Math.min(58, 16 + Math.floor(contact.age * 0.7) + rankIdx * 4);

  if (existingIdx >= 0) {
    updated.rivals[existingIdx] = {
      ...updated.rivals[existingIdx],
      age: contact.age,
      ageCategory: getAgeCategoryFromAge(contact.age),
      art,
      rankIndex: rankIdx,
      belt,
      stripes,
      gender: contact.gender,
      wealthTier: contact.wealthTier,
      relationshipScore: contact.affinity,
      monthsInRank: contact.martialArtMonths ?? 0
    };
  } else {
    const newRival: RivalNPC = {
      id: rivalId,
      name: contact.name,
      nickname: contact.name.split(' ')[0],
      avatar: contact.avatar,
      age: contact.age,
      ageCategory: getAgeCategoryFromAge(contact.age),
      art,
      rankIndex: rankIdx,
      belt,
      stripes,
      weight,
      weightClass: getWeightClassFromWeight(weight),
      gymId: gymObj.id,
      gymName: gymObj.name,
      city: contact.city,
      country: 'Brasil',
      fightingStyle: PERSONALITIES_META[contact.personality]?.preferredArts[0] === art ? 'equilibrado' : 'completo',
      gender: contact.gender,
      wealthTier: contact.wealthTier,
      attributes: {
        strength: baseStat,
        speed: baseStat + 2,
        stamina: baseStat + 1,
        durability: baseStat,
        flexibility: baseStat + 1,
        fightIq: baseStat,
        technique: baseStat + 2,
        mentalFocus: baseStat + 1
      },
      record: { wins: 0, losses: 0, draws: 0, kos: 0, subs: 0 },
      reputation: 15,
      personality: mappedPersonality,
      relationshipScore: contact.affinity,
      monthsInRank: contact.martialArtMonths ?? 0,
      socialPost: `Iniciei no ${meta.name}${contact.martialArtInfluencerName ? ` por influência de ${contact.martialArtInfluencerName}` : ''}! 🥋`
    };
    updated.rivals.push(newRival);
  }

  return updated;
}

/**
 * Gera um novo conhecido / potencial amigo ou romance quando o jogador sai para socializar.
 */
export function generateNewSocialContact(
  char: Character,
  place: 'bairro' | 'academia' | 'evento' | 'trabalho',
  rng: () => number = Math.random
): { updatedChar: Character; contact: SocialContact; message: string } {
  const updated = JSON.parse(JSON.stringify(char)) as Character;
  if (!Array.isArray(updated.socialContacts)) {
    updated.socialContacts = createInitialSocialContacts(updated, rng);
  }

  const gender: 'M' | 'F' =
    place === 'evento' || place === 'bairro'
      ? rng() < 0.65
        ? updated.gender === 'F'
          ? 'M'
          : 'F'
        : updated.gender || 'M'
      : rng() < 0.5
      ? 'F'
      : 'M';

  const first = gender === 'F' ? pick(FEMALE_NAMES, rng) : pick(MALE_NAMES, rng);
  const last = pick(LAST_NAMES, rng);
  const name = `${first} ${last}`;
  const ageOffset = Math.floor(rng() * 7) - 3;
  const targetAge = Math.max(8, updated.age + ageOffset);
  const personality = pick(ALL_PERSONALITIES, rng);
  const wealthTier: WealthTier =
    place === 'evento' && rng() < 0.45
      ? rng() < 0.35
        ? 'milionario'
        : 'abastado'
      : rng() < 0.2
      ? 'abastado'
      : 'classe_media';

  const startsWithArt = place === 'academia' || rng() < 0.18;
  const art: MartialArtType | null = startsWithArt
    ? pick(PERSONALITIES_META[personality].preferredArts, rng)
    : null;

  const jobInfo = deriveOccupationAndRoutineForAge(targetAge, undefined, art, rng);
  const refDate = updated.currentDate || { day: 15, month: 1, year: updated.currentYear || 2026 };

  const contact: SocialContact = {
    id: `soc_${Date.now()}_${Math.floor(rng() * 10000)}`,
    name,
    avatar: gender === 'F' ? pick(['👩', '🙋‍♀️', '👩‍🎓', '👩‍💼'], rng) : pick(['👨', '🙋‍♂️', '🧑‍🎓', '👨‍💼'], rng),
    gender,
    relationType: 'conhecido',
    personality,
    birthDate: makeBirthDateForAge(refDate, targetAge, rng),
    age: targetAge,
    isAlive: true,
    health: 95,
    wealthTier,
    occupation: jobInfo.occupation,
    dailyRoutine: jobInfo.dailyRoutine,
    city: updated.currentCity || updated.homeCity || 'São Paulo',
    affinity: 28 + Math.floor(rng() * 18),
    romanceLevel: updated.age >= 15 && targetAge >= 15 ? 12 + Math.floor(rng() * 15) : 0,
    respect: 30,
    relationshipStage: 'conhecido',
    martialArt: art,
    martialArtRankIndex: art ? 0 : undefined,
    martialArtBelt: art ? MARTIAL_ARTS_META[art].ranks[0].name : undefined,
    martialArtMonths: art ? 2 : undefined,
    martialArtSource: art ? 'propria' : undefined,
    recentLifeEvents: [
      `Conheceu você em ${
        place === 'academia'
          ? 'um treino na academia'
          : place === 'evento'
          ? 'um evento social da cidade'
          : place === 'trabalho'
          ? 'um compromisso de trabalho/estudo'
          : 'um encontro casual no bairro'
      }.`
    ]
  };

  updated.socialContacts.push(contact);
  const finalChar = art ? syncSocialFighterToWorldRivals(updated, contact) : updated;

  return {
    updatedChar: finalChar,
    contact,
    message: `🤝 Você conheceu ${contact.name} (${contact.age} anos, ${jobInfo.occupation} · ${PERSONALITIES_META[personality].label})!`
  };
}

/**
 * Vincula um lutador existente do catálogo mundial (`WORLD_FIGHTERS`) ao círculo social do PJ
 * (ex: para fazer amizade próxima, namorar ou casar com uma atleta/lutador do circuito).
 */
export function addWorldFighterToSocialCircle(
  char: Character,
  fighterId: string
): { updatedChar: Character; message: string; success: boolean } {
  const updated = JSON.parse(JSON.stringify(char)) as Character;
  if (!Array.isArray(updated.socialContacts)) {
    updated.socialContacts = createInitialSocialContacts(updated);
  }

  const existing = updated.socialContacts.find(
    (c) => c.linkedWorldFighterId === fighterId || c.id === `wf_${fighterId}`
  );
  if (existing) {
    return {
      updatedChar: char,
      success: false,
      message: `${existing.name} já faz parte do seu círculo social!`
    };
  }

  const wf = WORLD_FIGHTERS.find((f) => f.id === fighterId);
  if (!wf) {
    return { updatedChar: char, success: false, message: 'Atleta não encontrado.' };
  }

  const refDate = updated.currentDate || { day: 15, month: 1, year: updated.currentYear || 2026 };
  const personalityMap: Record<RivalNPC['personality'], SocialPersonality> = {
    arrogante: 'ambicioso',
    respeitoso: 'leal',
    fanfarrao: 'carismatico',
    frio_calculista: 'frio'
  };

  const contact: SocialContact = {
    id: `wf_${wf.id}`,
    linkedWorldFighterId: wf.id,
    name: wf.name,
    avatar: wf.avatar,
    gender: wf.gender || 'M',
    relationType: 'conhecido',
    personality: personalityMap[wf.personality] || 'ambicioso',
    birthDate: makeBirthDateForAge(refDate, wf.age, Math.random),
    age: wf.age,
    isAlive: true,
    health: 96,
    wealthTier: wf.wealthTier || 'classe_media',
    occupation: `Atleta de ${MARTIAL_ARTS_META[wf.art].name}`,
    dailyRoutine: `Treinos na ${wf.gymName || 'academia'} · Competições do circuito`,
    city: wf.city || 'Brasil',
    affinity: Math.max(15, Math.min(80, 35 + Math.round((wf.relationshipScore || 0) * 0.4))),
    romanceLevel: updated.age >= 15 && wf.age >= 15 ? 15 : 0,
    respect: 60,
    relationshipStage: 'conhecido',
    martialArt: wf.art,
    martialArtRankIndex: wf.rankIndex ?? 0,
    martialArtBelt: wf.belt,
    martialArtMonths: wf.monthsInRank ?? 6,
    martialArtSource: 'propria',
    recentLifeEvents: [`Aproximaram-se após intercâmbios e bastidores do circuito.`]
  };

  updated.socialContacts.push(contact);
  return {
    updatedChar: updated,
    success: true,
    message: `🌟 ${wf.name} foi adicionado(a) aos seus contatos pessoais! Agora vocês podem construir amizade ou romance.`
  };
}

/**
 * Interação direta com um contato vivo (conversar, sair, presentear, provocar, reconciliar).
 */
export function interactWithSocialContact(
  char: Character,
  contactId: string,
  action: 'conversar' | 'sair' | 'presentear' | 'provocar' | 'reconciliar'
): { updatedChar: Character; message: string; success: boolean } {
  const updated = JSON.parse(JSON.stringify(char)) as Character;
  if (!Array.isArray(updated.socialContacts)) {
    return { updatedChar: char, success: false, message: 'Contato não encontrado.' };
  }

  const idx = updated.socialContacts.findIndex((c) => c.id === contactId);
  if (idx < 0) return { updatedChar: char, success: false, message: 'Contato não encontrado.' };

  const contact = updated.socialContacts[idx];
  if (!contact.isAlive) {
    return { updatedChar: char, success: false, message: `${contact.name} já faleceu.` };
  }

  const isFamily =
    contact.relationType === 'pai' ||
    contact.relationType === 'mae' ||
    contact.relationType === 'irmao' ||
    contact.relationType === 'filho';
  const isRomantic =
    contact.relationshipStage === 'namorando' ||
    contact.relationshipStage === 'noivo' ||
    contact.relationshipStage === 'casado';

  if (action === 'conversar') {
    if (updated.energy < 5) {
      return { updatedChar: char, success: false, message: 'Energia insuficiente para conversar agora.' };
    }
    updated.energy -= 5;
    contact.affinity = Math.min(100, contact.affinity + 9);
    contact.respect = Math.min(100, contact.respect + 4);
    if (!isFamily && updated.age >= 15 && contact.age >= 15) {
      contact.romanceLevel = Math.min(100, contact.romanceLevel + (isRomantic ? 8 : 4));
    }
    if (contact.affinity >= 40 && contact.relationshipStage === 'conhecido') {
      contact.relationshipStage = 'amigo';
      contact.relationType = 'amigo';
    } else if (contact.affinity >= 80 && contact.relationshipStage === 'amigo') {
      contact.relationshipStage = 'melhor_amigo';
    }
    if (isFamily) {
      updated.familySupport = Math.min(100, updated.familySupport + 3);
    }
    updated.mentalHealth = Math.min(100, updated.mentalHealth + 3);
    return {
      updatedChar: updated,
      success: true,
      message: `💬 Boa conversa com ${contact.name}! Afinidade subiu para ${contact.affinity}.`
    };
  }

  if (action === 'sair') {
    if (updated.energy < 12) {
      return { updatedChar: char, success: false, message: 'Você precisa de pelo menos 12 de energia para sair.' };
    }
    if (updated.money < 35) {
      return { updatedChar: char, success: false, message: 'Você precisa de R$ 35 para esse passeio.' };
    }
    updated.energy -= 12;
    updated.money -= 35;
    contact.affinity = Math.min(100, contact.affinity + 14);
    if (!isFamily && updated.age >= 15 && contact.age >= 15) {
      contact.romanceLevel = Math.min(100, contact.romanceLevel + (isRomantic ? 14 : 9));
    }
    if (contact.affinity >= 40 && contact.relationshipStage === 'conhecido') {
      contact.relationshipStage = 'amigo';
      contact.relationType = 'amigo';
    } else if (contact.affinity >= 82 && contact.relationshipStage === 'amigo') {
      contact.relationshipStage = 'melhor_amigo';
    }
    if (isFamily) updated.familySupport = Math.min(100, updated.familySupport + 6);
    updated.mentalHealth = Math.min(100, updated.mentalHealth + 8);
    updated.stress = Math.max(0, updated.stress - 8);
    return {
      updatedChar: updated,
      success: true,
      message: `☕ Momento excelente com ${contact.name}! (-R$ 35, +8 Foco, -8 Estresse)`
    };
  }

  if (action === 'presentear') {
    const cost = 80;
    if (updated.money < cost) {
      return { updatedChar: char, success: false, message: `Presentear custa R$ ${cost}.` };
    }
    updated.money -= cost;
    contact.affinity = Math.min(100, contact.affinity + 18);
    contact.respect = Math.min(100, contact.respect + 6);
    if (!isFamily && updated.age >= 15 && contact.age >= 15) {
      contact.romanceLevel = Math.min(100, contact.romanceLevel + 15);
    }
    if (isFamily) updated.familySupport = Math.min(100, updated.familySupport + 8);
    return {
      updatedChar: updated,
      success: true,
      message: `🎁 ${contact.name} adorou o presente! (+18 Afinidade)`
    };
  }

  if (action === 'provocar') {
    contact.affinity = Math.max(-100, contact.affinity - 28);
    contact.romanceLevel = Math.max(0, contact.romanceLevel - 25);
    if (contact.affinity <= -25 && !isFamily) {
      contact.relationshipStage = 'inimigo';
      contact.relationType = 'inimigo';
      if (updated.spouseId === contact.id) {
        updated.spouseId = undefined;
        updated.maritalStatus = 'solteiro';
      }
    }
    updated.stress = Math.min(100, updated.stress + 6);
    contact.recentLifeEvents = [
      `Discussão séria com ${updated.name} deixou o clima pesado.`,
      ...(contact.recentLifeEvents || [])
    ].slice(0, 4);
    return {
      updatedChar: updated,
      success: true,
      message: `🔥 Discussão acalorada com ${contact.name}! A relação piorou muito.`
    };
  }

  // Reconciliar
  if (updated.energy < 10) {
    return { updatedChar: char, success: false, message: 'Sem energia suficiente para dialogar agora.' };
  }
  updated.energy -= 10;
  contact.affinity = Math.min(100, contact.affinity + 18);
  updated.honor = Math.min(100, updated.honor + 4);
  if (contact.relationshipStage === 'inimigo' && contact.affinity >= 10) {
    contact.relationshipStage = 'conhecido';
    contact.relationType = 'conhecido';
  }
  return {
    updatedChar: updated,
    success: true,
    message: `🕊️ Você estendeu a mão para ${contact.name}. (+18 Afinidade, +4 Honra)`
  };
}

/**
 * Pedido de namoro com validações de idade, vínculo e afinidade.
 */
export function startDatingContact(
  char: Character,
  contactId: string
): { updatedChar: Character; message: string; success: boolean } {
  const updated = JSON.parse(JSON.stringify(char)) as Character;
  if (updated.age < 15) {
    return { updatedChar: char, success: false, message: 'Você precisa ter pelo menos 15 anos para iniciar um namoro.' };
  }
  if (updated.maritalStatus === 'casado' || updated.maritalStatus === 'namorando' || updated.maritalStatus === 'noivo') {
    return {
      updatedChar: char,
      success: false,
      message: 'Você já está em um relacionamento sério no momento.'
    };
  }

  const contact = (updated.socialContacts || []).find((c) => c.id === contactId);
  if (!contact || !contact.isAlive) {
    return { updatedChar: char, success: false, message: 'Pessoa indisponível.' };
  }
  if (contact.age < 15) {
    return { updatedChar: char, success: false, message: 'Idade incompatível para relacionamento romântico.' };
  }
  if (['pai', 'mae', 'irmao', 'filho'].includes(contact.relationType)) {
    return { updatedChar: char, success: false, message: 'Não é possível namorar familiares próximos.' };
  }
  if (contact.affinity < 45) {
    return {
      updatedChar: char,
      success: false,
      message: `Construa mais amizade primeiro (Afinidade atual: ${contact.affinity}, necessária: 45+).`
    };
  }

  contact.relationshipStage = 'namorando';
  contact.relationType = 'namorado';
  contact.romanceLevel = Math.max(contact.romanceLevel, 45);
  contact.recentLifeEvents = [
    `Começou a namorar com ${updated.name}!`,
    ...(contact.recentLifeEvents || [])
  ].slice(0, 4);

  updated.maritalStatus = 'namorando';
  updated.spouseId = contact.id;
  updated.mentalHealth = Math.min(100, updated.mentalHealth + 10);

  return {
    updatedChar: updated,
    success: true,
    message: `❤️ Agora você e ${contact.name} estão namorando!`
  };
}

/**
 * Casamento oficial com celebração e atualização do estado civil e feed social.
 */
export function marrySocialContact(
  char: Character,
  contactId: string,
  ceremonyType: 'cartorio' | 'festa' = 'cartorio'
): { updatedChar: Character; message: string; success: boolean } {
  const updated = JSON.parse(JSON.stringify(char)) as Character;
  if (updated.age < 18) {
    return { updatedChar: char, success: false, message: 'É necessário ter 18+ anos para se casar.' };
  }
  if (updated.maritalStatus === 'casado') {
    return { updatedChar: char, success: false, message: 'Você já é casado(a).' };
  }

  const contact = (updated.socialContacts || []).find((c) => c.id === contactId);
  if (!contact || !contact.isAlive) {
    return { updatedChar: char, success: false, message: 'Parceiro(a) não encontrado(a).' };
  }
  if (contact.age < 18) {
    return { updatedChar: char, success: false, message: `${contact.name} ainda não atingiu a maioridade (18 anos).` };
  }
  if (contact.relationshipStage !== 'namorando' && contact.relationshipStage !== 'noivo') {
    return { updatedChar: char, success: false, message: 'É preciso estar namorando primeiro para se casar.' };
  }
  if (contact.affinity < 65 || contact.romanceLevel < 55) {
    return {
      updatedChar: char,
      success: false,
      message: `Fortaleça o vínculo antes do casamento (Afinidade >= 65 e Romance >= 55).`
    };
  }

  const cost = ceremonyType === 'festa' ? 1800 : 350;
  if (updated.money < cost) {
    return {
      updatedChar: char,
      success: false,
      message: `Saldo insuficiente para o casamento (${ceremonyType === 'festa' ? 'R$ 1.800' : 'R$ 350 no cartório'}).`
    };
  }

  updated.money -= cost;
  updated.maritalStatus = 'casado';
  updated.spouseId = contact.id;
  updated.mentalHealth = Math.min(100, updated.mentalHealth + 20);
  updated.stress = Math.max(0, updated.stress - 15);
  updated.familySupport = Math.min(100, updated.familySupport + 12);

  contact.relationshipStage = 'casado';
  contact.relationType = 'conjuge';
  contact.affinity = Math.min(100, contact.affinity + 15);
  contact.romanceLevel = Math.min(100, contact.romanceLevel + 20);
  contact.recentLifeEvents = [
    `Casou-se com ${updated.name} (${updated.currentDate?.year || updated.currentYear})!`,
    ...(contact.recentLifeEvents || [])
  ].slice(0, 4);

  if (!Array.isArray(updated.socialFeed)) updated.socialFeed = [];
  updated.socialFeed.unshift({
    id: `wedding_${Date.now()}`,
    author: `${updated.name} "${updated.nickname}"`,
    handle: `@${updated.nickname.toLowerCase().replace(/\s+/g, '_')}_fighter`,
    text: `💍 Dia inesquecível! Oficializei meu casamento com ${contact.name}! Obrigado à família, amigos e equipe do tatame por celebrarem conosco.`,
    time: `${String(updated.currentMonth).padStart(2, '0')}/${updated.currentYear}`,
    likes: Math.round(updated.fame * 2 + 45),
    verified: updated.fame > 80
  });

  if (Array.isArray(updated.classSessions) && updated.currentDate) {
    updated.classSessions = updated.classSessions.map((sess) => {
      if (
        sess.status === 'agendada' &&
        sess.date?.day === updated.currentDate.day &&
        sess.date?.month === updated.currentDate.month &&
        sess.date?.year === updated.currentDate.year
      ) {
        return {
          ...sess,
          status: 'falta',
          xpEarned: 0,
          energyCost: 0,
          notes: `Falta justificada: Dia do seu casamento com ${contact.name}`
        };
      }
      return sess;
    });
  }

  return {
    updatedChar: updated,
    success: true,
    message: `💍 Parabéns! Você e ${contact.name} se casaram oficialmente!`
  };
}

/**
 * Término de namoro ou divórcio.
 */
export function breakupOrDivorceContact(
  char: Character,
  contactId: string
): { updatedChar: Character; message: string; success: boolean } {
  const updated = JSON.parse(JSON.stringify(char)) as Character;
  const contact = (updated.socialContacts || []).find((c) => c.id === contactId);
  if (!contact) return { updatedChar: char, success: false, message: 'Contato não encontrado.' };

  const wasMarried = contact.relationshipStage === 'casado';
  contact.relationshipStage = 'conhecido';
  contact.relationType = 'conhecido';
  contact.affinity = Math.max(-50, contact.affinity - 30);
  contact.romanceLevel = 0;
  contact.recentLifeEvents = [
    wasMarried ? `Divorciou-se de ${updated.name}.` : `Terminou o namoro com ${updated.name}.`,
    ...(contact.recentLifeEvents || [])
  ].slice(0, 4);

  if (updated.spouseId === contact.id) {
    updated.spouseId = undefined;
    updated.maritalStatus = 'solteiro';
  }
  updated.mentalHealth = Math.max(10, updated.mentalHealth - 12);
  updated.stress = Math.min(100, updated.stress + 15);

  return {
    updatedChar: updated,
    success: true,
    message: wasMarried
      ? `💔 Divórcio concluído com ${contact.name}.`
      : `💔 Relacionamento com ${contact.name} encerrado.`
  };
}

/**
 * Ter ou adotar filho após o casamento.
 */
export function haveChildWithSpouse(
  char: Character,
  customChildName?: string,
  rng: () => number = Math.random
): { updatedChar: Character; child?: SocialContact; message: string; success: boolean } {
  const updated = JSON.parse(JSON.stringify(char)) as Character;
  if (updated.maritalStatus !== 'casado' || !updated.spouseId) {
    return {
      updatedChar: char,
      success: false,
      message: 'Você precisa estar casado(a) para ter um filho no núcleo familiar.'
    };
  }

  const contacts = updated.socialContacts || [];
  const spouse = contacts.find((c) => c.id === updated.spouseId && c.isAlive);
  if (!spouse) {
    return { updatedChar: char, success: false, message: 'Cônjuge não encontrado.' };
  }

  const existingChildren = contacts.filter((c) => c.relationType === 'filho');
  if (existingChildren.length >= 6) {
    return { updatedChar: char, success: false, message: 'Família já está completa com 6 filhos!' };
  }

  const gender: 'M' | 'F' = rng() < 0.5 ? 'F' : 'M';
  const surname = extractFamilySurname(updated.name);
  const firstName =
    customChildName && customChildName.trim().length > 1
      ? customChildName.trim()
      : `${gender === 'F' ? pick(FEMALE_NAMES, rng) : pick(MALE_NAMES, rng)} ${surname}`;

  const personality = pick(ALL_PERSONALITIES, rng);
  const birthDate: GameDate = { ...(updated.currentDate || { day: 15, month: 1, year: updated.currentYear }) };
  const jobInfo = deriveOccupationAndRoutineForAge(0, undefined, null, rng);

  const child: SocialContact = {
    id: `child_${Date.now()}_${Math.floor(rng() * 10000)}`,
    name: firstName,
    avatar: gender === 'F' ? '👧' : '👦',
    gender,
    relationType: 'filho',
    personality,
    birthDate,
    age: 0,
    isAlive: true,
    health: 100,
    wealthTier: updated.money >= 50000 ? 'milionario' : updated.money >= 8000 ? 'abastado' : 'classe_media',
    occupation: jobInfo.occupation,
    dailyRoutine: jobInfo.dailyRoutine,
    city: updated.currentCity || updated.homeCity || 'São Paulo',
    affinity: 90,
    romanceLevel: 0,
    respect: 75,
    relationshipStage: 'familia',
    martialArt: null,
    pendingBaptism: true,
    pendingBaptismMonths: 0,
    recentLifeEvents: [`Nasceu em ${String(birthDate.month).padStart(2, '0')}/${birthDate.year}! Bem-vindo(a) ao mundo!`]
  };

  contacts.push(child);
  updated.socialContacts = contacts;
  updated.mentalHealth = Math.min(100, updated.mentalHealth + 18);
  updated.familySupport = Math.min(100, updated.familySupport + 10);

  if (!Array.isArray(updated.socialFeed)) updated.socialFeed = [];
  updated.socialFeed.unshift({
    id: `birth_${Date.now()}`,
    author: `${updated.name} "${updated.nickname}"`,
    handle: `@${updated.nickname.toLowerCase().replace(/\s+/g, '_')}_fighter`,
    text: `👶 Nasceu ${child.name}! Meu maior troféu fora dos tatames chegou hoje ao mundo. Vamos construir um grande futuro! ❤️`,
    time: `${String(birthDate.month).padStart(2, '0')}/${birthDate.year}`,
    likes: Math.round(updated.fame * 2.2 + 60),
    verified: updated.fame > 80
  });

  return {
    updatedChar: updated,
    child,
    success: true,
    message: `👶 Parabéns! Nasceu ${child.name}! A partir dos 7 anos você poderá incentivá-lo(a) nas artes marciais.`
  };
}

/**
 * Permite ao PJ influenciar um amigo, irmão, cônjuge ou filho a iniciar em uma arte marcial!
 */
export function influenceContactToStartArt(
  char: Character,
  contactId: string,
  art: MartialArtType,
  rng: () => number = Math.random
): { updatedChar: Character; accepted: boolean; message: string } {
  let updated = JSON.parse(JSON.stringify(char)) as Character;
  const contact = (updated.socialContacts || []).find((c) => c.id === contactId);

  if (!contact || !contact.isAlive) {
    return { updatedChar: char, accepted: false, message: 'Contato indisponível.' };
  }
  if (contact.age < 7) {
    return {
      updatedChar: char,
      accepted: false,
      message: `${contact.name} tem apenas ${contact.age} anos. Idade mínima recomendada para iniciar é 7 anos.`
    };
  }
  if (contact.martialArt) {
    return {
      updatedChar: char,
      accepted: false,
      message: `${contact.name} já pratica ${MARTIAL_ARTS_META[contact.martialArt].name}!`
    };
  }
  if (contact.relationshipStage === 'inimigo' || contact.affinity < 10) {
    return {
      updatedChar: char,
      accepted: false,
      message: `${contact.name} recusou o convite devido à baixa afinidade entre vocês.`
    };
  }

  const pMeta = getPersonalityInfo(contact.personality);
  const artBonus = pMeta.preferredArts.includes(art) ? 0.2 : 0;
  const isChildOrSibling = contact.relationType === 'filho' || contact.relationType === 'irmao';
  const minRequiredAffinity = isChildOrSibling ? 15 : 30;

  if (contact.affinity < minRequiredAffinity) {
    return {
      updatedChar: char,
      accepted: false,
      message: `Fortaleça a relação antes de convidar (afinidade ${contact.affinity}/${minRequiredAffinity}).`
    };
  }

  const acceptChance = Math.min(
    0.98,
    0.45 + (contact.affinity / 160) + pMeta.martialAcceptanceBonus + artBonus + (isChildOrSibling ? 0.2 : 0)
  );

  if (rng() > acceptChance) {
    contact.recentLifeEvents = [
      `Agradeceu o convite de ${updated.name} para ${MARTIAL_ARTS_META[art].name}, mas preferiu esperar.`,
      ...(contact.recentLifeEvents || [])
    ].slice(0, 4);
    return {
      updatedChar: updated,
      accepted: false,
      message: `🤔 ${contact.name} ainda está em dúvida sobre começar ${MARTIAL_ARTS_META[art].name}. Tente novamente após fortalecer o vínculo!`
    };
  }

  const meta = MARTIAL_ARTS_META[art];
  contact.martialArt = art;
  contact.martialArtRankIndex = 0;
  contact.martialArtStripes = 0;
  contact.martialArtBelt =
    art === 'jiujitsu' ? formatBjjBeltWithDegree(0, meta.ranks[0].name, 0) : meta.ranks[0].name;
  contact.martialArtMonths = 0;
  contact.martialArtSource = 'pj';
  contact.martialArtInfluencerName = updated.name;
  const updatedRoutine = deriveOccupationAndRoutineForAge(contact.age, contact.occupation, art, rng);
  contact.dailyRoutine = updatedRoutine.dailyRoutine;
  contact.affinity = Math.min(100, contact.affinity + 8);
  contact.respect = Math.min(100, contact.respect + 10);
  contact.recentLifeEvents = [
    `Iniciou no ${meta.name} (${meta.ranks[0].name}) por sua influência!`,
    ...(contact.recentLifeEvents || [])
  ].slice(0, 4);

  updated = syncSocialFighterToWorldRivals(updated, contact);

  return {
    updatedChar: updated,
    accepted: true,
    message: `🥋 Incrível! Por sua influência, ${contact.name} vestiu o uniforme e iniciou no ${meta.name}!`
  };
}

/**
 * Simulação mensal independente da vida social de todos os contatos:
 * - Envelhecimento por data de nascimento
 * - Mudança independente de escola, profissão, carreira e aposentadoria
 * - Namoros/casamentos/filhos independentes dos amigos e irmãos com outros NPCs
 * - Início autônomo em arte marcial por influência de outro NPC
 * - Evolução de graduação dos contatos que praticam arte marcial
 * - Saúde, envelhecimento avançado e falecimento (NPCs e PJ em idade extrema)
 */
export interface SocialWorldFamilyEvent {
  startDay: number;
  endDay: number;
  reasonType: 'casamento_familia' | 'batizado_familia';
  title: string;
  notes: string;
  contactId?: string;
}

export function processMonthlySocialWorld(
  char: Character,
  rng: () => number = Math.random,
  eventDateRef?: GameDate
): { updatedChar: Character; logs: string[]; familyEvents: SocialWorldFamilyEvent[] } {
  let updated = JSON.parse(JSON.stringify(char)) as Character;
  const logs: string[] = [];
  const familyEvents: SocialWorldFamilyEvent[] = [];

  if (!Array.isArray(updated.socialContacts)) {
    updated.socialContacts = createInitialSocialContacts(updated, rng);
  }
  if (!updated.maritalStatus) updated.maritalStatus = 'solteiro';
  if (updated.isAlive === undefined) updated.isAlive = true;

  const refDate = updated.currentDate || { day: 15, month: updated.currentMonth, year: updated.currentYear };
  const evDate = eventDateRef || refDate;
  const evDaysInMonth = getDaysInMonth(evDate.month, evDate.year);
  const dateLabel = `${String(refDate.month).padStart(2, '0')}/${refDate.year}`;
  const evDateLabel = `${String(evDate.month).padStart(2, '0')}/${evDate.year}`;
  const allArts: MartialArtType[] = ['boxe', 'jiujitsu', 'muaythai', 'karate', 'judo', 'capoeira', 'lutalivre', 'mma'];

  // Bônus mensal saudável por relacionamento feliz
  if (updated.maritalStatus === 'casado' && updated.spouseId) {
    const spouse = updated.socialContacts.find((c) => c.id === updated.spouseId && c.isAlive);
    if (spouse && spouse.affinity >= 60) {
      updated.mentalHealth = Math.min(100, updated.mentalHealth + 2);
      updated.stress = Math.max(0, updated.stress - 2);
    }
  }

  for (const contact of updated.socialContacts) {
    if (!contact.isAlive) continue;

    // 1. Idade real calculada
    const prevAge = contact.age;
    contact.age = Math.max(0, calculateAge(contact.birthDate, refDate));
    const justAged = contact.age > prevAge;

    if (justAged && contact.relationType === 'filho') {
      contact.avatar =
        contact.age >= 18
          ? contact.gender === 'F'
            ? '👩'
            : '👨'
          : contact.gender === 'F'
          ? '👧'
          : '👦';
    }

    // 2. Evolução de rotina/carreira independente
    if (justAged && (contact.age === 4 || contact.age === 6 || contact.age === 14 || contact.age === 18 || contact.age === 65)) {
      const nextJob = deriveOccupationAndRoutineForAge(contact.age, undefined, contact.martialArt, rng);
      contact.occupation = nextJob.occupation;
      contact.dailyRoutine = nextJob.dailyRoutine;
      const milestone =
        contact.age === 18
          ? `Completou 18 anos e iniciou nova fase (${contact.occupation}).`
          : contact.age === 65
          ? `Aposentou-se aos 65 anos após uma longa trajetória.`
          : `Nova etapa escolar aos ${contact.age} anos (${contact.occupation}).`;
      contact.recentLifeEvents = [milestone, ...(contact.recentLifeEvents || [])].slice(0, 4);
      if (contact.relationType === 'filho' || contact.relationType === 'irmao') {
        logs.push(`📅 Vida Social: ${contact.name} (${getRelationLabel(contact)}) ${milestone.toLowerCase()}`);
      }
    } else if (contact.age >= 23 && contact.age < 64 && rng() < 0.015) {
      // Mudança autônoma de emprego na rotina do NPC
      const newJob = pick(ADULT_JOBS, rng);
      if (newJob.job !== contact.occupation) {
        contact.occupation = newJob.job;
        const artSuffix = contact.martialArt ? ` · Treina ${MARTIAL_ARTS_META[contact.martialArt].name.split(' ')[0]}` : '';
        contact.dailyRoutine = `${newJob.routine}${artSuffix}`;
        contact.recentLifeEvents = [
          `Mudou de emprego para ${newJob.job} (${dateLabel}).`,
          ...(contact.recentLifeEvents || [])
        ].slice(0, 4);
      }
    }

    // 3. Vida afetiva/familiar independente entre NPCs (amigos, irmãos, filhos adultos)
    const isPlayerPartner = updated.spouseId === contact.id;
    const canHaveIndependentRomance =
      !isPlayerPartner &&
      contact.relationType !== 'pai' &&
      contact.relationType !== 'mae' &&
      contact.age >= 19 &&
      contact.age <= 50;

    const isFamilyMember =
      contact.relationType === 'pai' ||
      contact.relationType === 'mae' ||
      contact.relationType === 'irmao' ||
      contact.relationType === 'filho' ||
      contact.relationType === 'conjuge' ||
      contact.relationshipStage === 'casado';

    if (canHaveIndependentRomance && !contact.partnerName && rng() < 0.018) {
      const partnerGender: 'M' | 'F' = contact.gender === 'F' ? 'M' : 'F';
      const pName = `${partnerGender === 'F' ? pick(FEMALE_NAMES, rng) : pick(MALE_NAMES, rng)} ${pick(LAST_NAMES, rng)}`;
      contact.partnerName = pName;
      contact.partnerMarried = false;
      contact.recentLifeEvents = [
        `Começou um relacionamento sério com ${pName} (${dateLabel}).`,
        ...(contact.recentLifeEvents || [])
      ].slice(0, 4);
      logs.push(`💞 Vida Independente: ${contact.name} (${getRelationLabel(contact)}) iniciou um relacionamento com ${pName}!`);
    } else if (canHaveIndependentRomance && contact.partnerName && !contact.partnerMarried && rng() < 0.04) {
      contact.partnerMarried = true;
      const weddingDay = 1 + Math.floor(rng() * evDaysInMonth);
      contact.recentLifeEvents = [
        `Casou-se com ${contact.partnerName} (${evDateLabel})!`,
        ...(contact.recentLifeEvents || [])
      ].slice(0, 4);
      if (isFamilyMember) {
        const rel = getRelationLabel(contact);
        contact.affinity = Math.min(100, contact.affinity + 4);
        updated.familySupport = Math.min(100, updated.familySupport + 2);
        updated.mentalHealth = Math.min(100, updated.mentalHealth + 3);
        familyEvents.push({
          startDay: weddingDay,
          endDay: weddingDay,
          reasonType: 'casamento_familia',
          title: `Casamento de ${contact.name}`,
          notes: `Falta justificada: Casamento na família (${contact.name} e ${contact.partnerName})`,
          contactId: contact.id
        });
        logs.push(
          `💍 Casamento na Família: Dia ${String(weddingDay).padStart(2, '0')}/${String(evDate.month).padStart(2, '0')}, ${contact.name} (${rel}) se casou com ${contact.partnerName}!`
        );
      } else {
        logs.push(`💍 Vida Independente: ${contact.name} se casou com ${contact.partnerName}!`);
      }
    } else if (canHaveIndependentRomance && contact.partnerName && (contact.childrenCount || 0) < 2 && rng() < 0.012) {
      contact.childrenCount = (contact.childrenCount || 0) + 1;
      const babyGender: 'M' | 'F' = rng() < 0.5 ? 'F' : 'M';
      const babyFirstName = babyGender === 'F' ? pick(FEMALE_NAMES, rng) : pick(MALE_NAMES, rng);
      if (isFamilyMember) {
        contact.pendingBaptism = true;
        contact.pendingBaptismMonths = 0;
        contact.pendingBaptismChildName = babyFirstName;
      }
      contact.recentLifeEvents = [
        `Teve filho(a) (${babyFirstName}) com ${contact.partnerName} (${dateLabel})!`,
        ...(contact.recentLifeEvents || [])
      ].slice(0, 4);
      logs.push(`🍼 Família em Expansão: ${contact.name} e ${contact.partnerName} tiveram um filho (${babyFirstName})!`);
    }

    // 3.1 Batizado na família para recém-nascido aguardando cerimônia
    if (isFamilyMember && contact.pendingBaptism) {
      contact.pendingBaptismMonths = (contact.pendingBaptismMonths || 0) + 1;
      if (contact.pendingBaptismMonths >= 2) {
        const baptismChance = contact.pendingBaptismMonths >= 8 ? 1.0 : 0.35;
        if (rng() < baptismChance) {
          contact.pendingBaptism = false;
          const baptismDay = 1 + Math.floor(rng() * evDaysInMonth);
          const babyLabel =
            contact.relationType === 'filho'
              ? contact.name
              : contact.pendingBaptismChildName || `bebê de ${contact.name}`;
          contact.affinity = Math.min(100, contact.affinity + 4);
          updated.familySupport = Math.min(100, updated.familySupport + 2);
          updated.mentalHealth = Math.min(100, updated.mentalHealth + 2);
          contact.recentLifeEvents = [
            `Batizado de ${babyLabel} celebrado em família (${evDateLabel}).`,
            ...(contact.recentLifeEvents || [])
          ].slice(0, 4);
          familyEvents.push({
            startDay: baptismDay,
            endDay: baptismDay,
            reasonType: 'batizado_familia',
            title: `Batizado de ${babyLabel}`,
            notes: `Falta justificada: Batizado na família (${babyLabel})`,
            contactId: contact.id
          });
          logs.push(
            `🕊️ Batizado na Família: Dia ${String(baptismDay).padStart(2, '0')}/${String(evDate.month).padStart(2, '0')} aconteceu o batizado de ${babyLabel}!`
          );
        }
      }
    }

    // 4. Início autônomo em uma Arte Marcial por influência de outro NPC!
    if (!contact.martialArt && contact.age >= 7 && contact.age <= 42) {
      const initChance = contact.age <= 24 ? 0.032 : 0.014;
      if (rng() < initChance) {
        const pMeta = getPersonalityInfo(contact.personality);
        const chosenArt =
          rng() < 0.72 ? pick(pMeta.preferredArts, rng) : pick(allArts, rng);
        const worldInfluencer =
          rng() < 0.45
            ? pick(WORLD_FIGHTERS.filter((w) => w.art === chosenArt), rng)?.name
            : undefined;
        const influencerName = worldInfluencer || pick(NPC_INFLUENCERS, rng);

        const artMeta = MARTIAL_ARTS_META[chosenArt];
        contact.martialArt = chosenArt;
        contact.martialArtRankIndex = 0;
        contact.martialArtStripes = 0;
        contact.martialArtBelt =
          chosenArt === 'jiujitsu'
            ? formatBjjBeltWithDegree(0, artMeta.ranks[0].name, 0)
            : artMeta.ranks[0].name;
        contact.martialArtMonths = 0;
        contact.martialArtSource = 'npc';
        contact.martialArtInfluencerName = influencerName;
        const nextR = deriveOccupationAndRoutineForAge(contact.age, contact.occupation, chosenArt, rng);
        contact.dailyRoutine = nextR.dailyRoutine;
        contact.recentLifeEvents = [
          `Iniciou no ${artMeta.name} influenciado(a) por ${influencerName} (${dateLabel}).`,
          ...(contact.recentLifeEvents || [])
        ].slice(0, 4);

        logs.push(
          `🥋 Novo Praticante: ${contact.name} (${getRelationLabel(contact)}) começou a treinar ${artMeta.name} por influência de ${influencerName}!`
        );
      }
    }

    // 5. Progressão marcial mensal dos contatos que praticam artes marciais
    if (contact.martialArt) {
      contact.martialArtMonths = (contact.martialArtMonths || 0) + 1;
      const meta = MARTIAL_ARTS_META[contact.martialArt];
      if (meta) {
        let curRank = contact.martialArtRankIndex ?? 0;
        let curStripes = contact.martialArtStripes ?? 0;

        // Transições aos 16 anos (BJJ e Capoeira)
        if (contact.age >= 16) {
          if (contact.martialArt === 'jiujitsu' && curRank >= 1 && curRank <= 4) {
            curRank = 5;
            curStripes = 0;
          } else if (contact.martialArt === 'capoeira' && curRank <= 16) {
            curRank = 17;
          }
        }

        if (curRank < meta.ranks.length - 1) {
          const nextRank = meta.ranks[curRank + 1];
          const ageOk = nextRank.minAge !== undefined ? contact.age >= nextRank.minAge : true;
          const monthsOk =
            nextRank.minMonthsInRank !== undefined
              ? contact.martialArtMonths >= nextRank.minMonthsInRank
              : contact.martialArtMonths >= 6;
          if (ageOk && monthsOk && rng() < 0.35) {
            curRank += 1;
            curStripes = 0;
            contact.martialArtMonths = 0;
            const promotedLabel =
              contact.martialArt === 'jiujitsu'
                ? formatBjjBeltWithDegree(curRank, nextRank.name, 0)
                : nextRank.name;
            contact.recentLifeEvents = [
              `Graduou-se para ${promotedLabel} em ${meta.name} (${dateLabel})!`,
              ...(contact.recentLifeEvents || [])
            ].slice(0, 4);
            logs.push(`🥋 Evolução Social: ${contact.name} conquistou "${promotedLabel}" em ${meta.name}!`);
          }
        }

        if (contact.martialArt === 'jiujitsu') {
          const curRankDef = meta.ranks[curRank] || meta.ranks[0];
          const nextRankDef = meta.ranks[curRank + 1];
          const estXp = Math.min(curRankDef.xpNeeded, (contact.martialArtMonths || 0) * 310);
          const computedStripes = computeBjjStripesFromProgress(
            curRank,
            estXp,
            curRankDef.xpNeeded,
            contact.martialArtMonths || 0,
            nextRankDef?.minMonthsInRank
          );
          curStripes = Math.max(curStripes, computedStripes);
        }

        contact.martialArtRankIndex = curRank;
        contact.martialArtStripes = curStripes;
        const baseName = meta.ranks[curRank]?.name || contact.martialArtBelt || '';
        contact.martialArtBelt =
          contact.martialArt === 'jiujitsu'
            ? formatBjjBeltWithDegree(curRank, baseName, curStripes)
            : baseName;
      }
    }

    // 6. Saúde, Envelhecimento e Mortalidade Realista dos NPCs
    if (contact.age >= 60) {
      const healthDrift = contact.age >= 78 ? -1.4 : -0.5;
      contact.health = Math.max(5, Math.min(100, Math.round(contact.health + healthDrift + (rng() * 1.4 - 0.5))));
    } else {
      contact.health = Math.max(40, Math.min(100, Math.round(contact.health + (rng() * 2 - 0.8))));
    }

    let deathChance = 0;
    if (contact.age >= 95) deathChance = 0.12;
    else if (contact.age >= 85) deathChance = 0.045;
    else if (contact.age >= 75) deathChance = 0.015;
    else if (contact.age >= 65) deathChance = 0.0045;
    else if (contact.age >= 50) deathChance = 0.001;
    else if (contact.age >= 18) deathChance = 0.0002;

    if (contact.health <= 10) deathChance += 0.06;

    if (deathChance > 0 && rng() < deathChance) {
      contact.isAlive = false;
      contact.deathDate = { ...refDate };
      contact.deathCause =
        contact.age >= 72
          ? 'Causas naturais em paz ao lado da família'
          : contact.age >= 50
          ? 'Complicações graves de saúde'
          : 'Acidente inesperado';
      contact.recentLifeEvents = [
        `Faleceu em ${dateLabel} aos ${contact.age} anos (${contact.deathCause}).`,
        ...(contact.recentLifeEvents || [])
      ].slice(0, 4);

      if (updated.spouseId === contact.id) {
        updated.maritalStatus = 'viuvo';
        updated.spouseId = undefined;
      }

      const isClose =
        contact.relationType === 'pai' ||
        contact.relationType === 'mae' ||
        contact.relationType === 'irmao' ||
        contact.relationType === 'filho' ||
        isPlayerPartner ||
        contact.relationshipStage === 'melhor_amigo';

      if (isClose) {
        updated.mentalHealth = Math.max(5, updated.mentalHealth - 22);
        updated.stress = Math.min(100, updated.stress + 25);
        logs.push(
          `🕯️ Luto Profundo: ${contact.name} (${getRelationLabel(contact)}, ${contact.age} anos) faleceu — ${contact.deathCause}.`
        );
      } else {
        logs.push(`🕯️ Despedida: ${contact.name} (${contact.age} anos) faleceu (${contact.deathCause}).`);
      }
    }
  }

  // Sincroniza contatos praticantes de artes marciais com o circuito após concluir todas as atualizações
  for (const contact of updated.socialContacts) {
    if (contact.isAlive && contact.martialArt && contact.age >= 9) {
      updated = syncSocialFighterToWorldRivals(updated, contact);
    }
  }

  // 7. Ciclo de vida em idade avançada do próprio PJ (a partir dos 75 anos)
  if (updated.age >= 75 && updated.isAlive !== false) {
    const pjDeathChance =
      updated.age >= 95 ? 0.12 : updated.age >= 85 ? 0.035 : 0.008;
    if (rng() < pjDeathChance) {
      updated.isAlive = false;
      updated.deathDate = { ...refDate };
      updated.deathCause = 'Partiu serenamente em idade avançada deixando um legado imortal nos tatames.';
      logs.push(`🕯️ Fim da Jornada: Aos ${updated.age} anos, ${updated.name} encerrou seu ciclo na terra deixando história eterna.`);
    }
  }

  return { updatedChar: updated, logs, familyEvents };
}

/**
 * Permite que o PJ envie ajuda financeira à família (pais/casa),
 * fortalecendo laços e podendo tirar uma família humilde da restrição severa.
 */
export function helpFamilyFinancially(
  char: Character,
  amount: number = 300
): { updatedChar: Character; success: boolean; message: string } {
  const safeAmount = Math.round(amount);
  if (safeAmount <= 0) {
    return { updatedChar: char, success: false, message: 'Informe um valor válido para ajudar a família.' };
  }
  if (char.money < safeAmount) {
    return {
      updatedChar: char,
      success: false,
      message: `Saldo insuficiente para enviar R$ ${safeAmount.toLocaleString('pt-BR')} à família.`
    };
  }

  const updated = JSON.parse(JSON.stringify(char)) as Character;
  if (!Array.isArray(updated.socialContacts)) {
    return { updatedChar: char, success: false, message: 'Sem familiares cadastrados para receber apoio.' };
  }

  const livingFamily = updated.socialContacts.filter(
    (c) =>
      c.isAlive &&
      (c.relationType === 'pai' ||
        c.relationType === 'mae' ||
        c.relationType === 'irmao' ||
        c.relationType === 'filho' ||
        c.relationType === 'conjuge' ||
        c.relationshipStage === 'casado')
  );

  if (livingFamily.length === 0) {
    return {
      updatedChar: char,
      success: false,
      message: 'Não há familiares vivos no momento para receber auxílio financeiro.'
    };
  }

  updated.money -= safeAmount;
  updated.familySupport = Math.min(100, (updated.familySupport || 0) + 8);
  updated.honor = Math.min(100, (updated.honor || 0) + 2);
  updated.mentalHealth = Math.min(100, (updated.mentalHealth || 0) + 4);

  let upliftedCount = 0;
  const dateLabel = updated.currentDate
    ? `${String(updated.currentDate.month).padStart(2, '0')}/${updated.currentDate.year}`
    : String(updated.currentYear);

  for (const member of livingFamily) {
    member.affinity = Math.min(100, member.affinity + 8);
    member.respect = Math.min(100, member.respect + 6);
    member.health = Math.min(100, member.health + 4);

    if (
      (member.relationType === 'pai' || member.relationType === 'mae') &&
      member.wealthTier === 'humilde' &&
      safeAmount >= 250
    ) {
      member.wealthTier = 'classe_media';
      upliftedCount += 1;
    }

    member.recentLifeEvents = [
      `Recebeu apoio financeiro de R$ ${safeAmount.toLocaleString('pt-BR')} enviado por ${updated.name} (${dateLabel}).`,
      ...(member.recentLifeEvents || [])
    ].slice(0, 4);
  }

  if (upliftedCount > 0 && updated.familyWealthTier === 'humilde') {
    updated.familyWealthTier = 'classe_media';
  }

  const upliftMsg =
    upliftedCount > 0
      ? ' O lar dos seus pais subiu para Classe Média e voltou a respirar financeiramente!'
      : '';

  return {
    updatedChar: updated,
    success: true,
    message: `💝 Você enviou R$ ${safeAmount.toLocaleString('pt-BR')} para ajudar sua família (+8 Apoio Familiar, +2 Honra).${upliftMsg}`
  };
}

