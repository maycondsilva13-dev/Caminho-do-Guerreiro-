import {
  AcademyStudent,
  Character,
  MartialArtType,
  PlayerAcademy,
  SocialContact,
  SocialPersonality
} from '../types/game';
import { MARTIAL_ARTS_META } from '../data/martialArtsData';
import {
  formatBjjBeltWithDegree,
  getBjjMaxStripes
} from './bjjDegreeHelper';
import {
  deriveOccupationAndRoutineForAge,
  syncSocialFighterToWorldRivals
} from './socialLifeHelper';
import { getRegionalAcademyEconomics } from './regionalEconomyHelper';

export const FOUND_ACADEMY_COST = 2500;
export const FOUND_ACADEMY_MIN_AGE = 18;
export { getRegionalAcademyEconomics };

/**
 * Índice mínimo de graduação por arte marcial que qualifica o jogador como Professor / Instrutor-Chefe
 * autorizado a fundar e gerenciar sua própria academia.
 */
export const PROFESSOR_MIN_RANK_BY_ART: Record<
  MartialArtType,
  { minRankIndex: number; titleLabel: string }
> = {
  boxe: { minRankIndex: 3, titleLabel: 'Professor de Boxe (CBBoxe)' },
  jiujitsu: { minRankIndex: 8, titleLabel: 'Faixa Preta / Professor de BJJ' },
  muaythai: { minRankIndex: 10, titleLabel: 'Kru / Prajied Preto e Vermelho' },
  karate: { minRankIndex: 7, titleLabel: 'Sensei 1º Dan (Faixa Preta Shodan)' },
  capoeira: { minRankIndex: 28, titleLabel: 'Professor (Corda Vermelho-Roxo)' },
  judo: { minRankIndex: 12, titleLabel: 'Sensei 1º Dan (Faixa Preta Shodan)' },
  lutalivre: { minRankIndex: 11, titleLabel: 'Professor (Faixa Preta de LLE)' },
  mma: { minRankIndex: 3, titleLabel: 'Head Coach / Veterano de Liga Mundial' }
};

export interface ProfessorEligibility {
  art: MartialArtType;
  artName: string;
  eligible: boolean;
  rankMet: boolean;
  ageMet: boolean;
  currentRankIndex: number;
  requiredRankIndex: number;
  requiredTitle: string;
  currentRankName: string;
  reason?: string;
}

const STUDENT_FIRST_M = [
  'Lucas', 'Enzo', 'Gabriel', 'Matheus', 'Rafael', 'Pedro', 'Kauã', 'Davi',
  'Bruno', 'Thiago', 'Cauã', 'Felipe', 'Gustavo', 'Murilo', 'Vinícius', 'Henrique'
];
const STUDENT_FIRST_F = [
  'Sofia', 'Larissa', 'Beatriz', 'Helena', 'Camila', 'Valentina', 'Julia', 'Mariana',
  'Letícia', 'Amanda', 'Isabela', 'Laura', 'Lívia', 'Giovanna', 'Bianca', 'Yasmin'
];
const STUDENT_LAST = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Lima', 'Almeida',
  'Ferreira', 'Rodrigues', 'Rocha', 'Carvalho', 'Ribeiro', 'Martins', 'Araújo', 'Mendes'
];

const PERSONALITIES: SocialPersonality[] = [
  'dedicado' as any, // fallback avoided below
  'leal',
  'ambicioso',
  'tranquilo',
  'explosivo',
  'frio',
  'carismatico',
  'disciplinado'
].filter((p): p is SocialPersonality => p !== ('dedicado' as any));

const TALENTS: AcademyStudent['talent'][] = [
  'dedicado',
  'prodigio',
  'recreativo',
  'competidor'
];

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function getProfessorEligibility(
  char: Character,
  art: MartialArtType
): ProfessorEligibility {
  const meta = MARTIAL_ARTS_META[art];
  const req = PROFESSOR_MIN_RANK_BY_ART[art];
  const grad = char.artGraduations?.[art];
  const currentRankIndex = grad?.rankIndex ?? 0;
  const currentRankName = grad?.name || meta.ranks[0].name;
  const rankMet = currentRankIndex >= req.minRankIndex;
  const ageMet = (char.age || 0) >= FOUND_ACADEMY_MIN_AGE;
  const eligible = rankMet && ageMet;

  let reason: string | undefined;
  if (!rankMet && !ageMet) {
    reason = `Exige ${req.titleLabel} e idade mínima de ${FOUND_ACADEMY_MIN_AGE} anos.`;
  } else if (!rankMet) {
    reason = `Exige atingir pelo menos "${req.titleLabel}" em ${meta.name}.`;
  } else if (!ageMet) {
    reason = `Exige maioridade civil (${FOUND_ACADEMY_MIN_AGE}+ anos) para abrir CNPJ e academia.`;
  }

  return {
    art,
    artName: meta.name,
    eligible,
    rankMet,
    ageMet,
    currentRankIndex,
    requiredRankIndex: req.minRankIndex,
    requiredTitle: req.titleLabel,
    currentRankName,
    reason
  };
}

export function getEligibleProfessorArts(char: Character): ProfessorEligibility[] {
  const arts: MartialArtType[] = [
    'jiujitsu',
    'boxe',
    'muaythai',
    'karate',
    'judo',
    'capoeira',
    'lutalivre',
    'mma'
  ];
  return arts.map((art) => getProfessorEligibility(char, art));
}

function getStudentStartRankForArt(art: MartialArtType, age: number): number {
  if (art === 'capoeira' && age >= 16) return 17;
  return 0;
}

function createNpcStudent(
  art: MartialArtType,
  rng: () => number = Math.random,
  forcedAge?: number
): AcademyStudent {
  const gender: 'M' | 'F' = rng() < 0.44 ? 'F' : 'M';
  const first = gender === 'F' ? pick(STUDENT_FIRST_F, rng) : pick(STUDENT_FIRST_M, rng);
  const last = pick(STUDENT_LAST, rng);
  const age = forcedAge ?? 11 + Math.floor(rng() * 21); // 11..31 anos
  const rankIndex = getStudentStartRankForArt(art, age);
  const meta = MARTIAL_ARTS_META[art];
  const rankDef = meta.ranks[rankIndex] || meta.ranks[0];
  const talent = pick(TALENTS, rng);
  const personality = pick(PERSONALITIES, rng);
  const stripes = 0;
  const belt =
    art === 'jiujitsu'
      ? formatBjjBeltWithDegree(rankIndex, rankDef.name, stripes)
      : rankDef.name;

  const baseTechnique =
    talent === 'prodigio'
      ? 24 + Math.floor(rng() * 10)
      : talent === 'competidor'
      ? 20 + Math.floor(rng() * 8)
      : 14 + Math.floor(rng() * 8);

  const avatarPool =
    age < 16
      ? gender === 'F'
        ? ['👧', '🧒', '🥋']
        : ['👦', '🧒', '🥋']
      : gender === 'F'
      ? ['👩‍🎓', '👩', '🥋', '🥊']
      : ['👨‍🎓', '👨', '🥋', '🥊'];

  return {
    id: `stu_${Date.now()}_${Math.floor(rng() * 100000)}`,
    name: `${first} ${last}`,
    avatar: pick(avatarPool, rng),
    gender,
    age,
    art,
    rankIndex,
    belt,
    stripes,
    xp: Math.floor(rng() * Math.min(80, Math.round(rankDef.xpNeeded * 0.35))),
    xpNeeded: rankDef.xpNeeded,
    monthsTrained: Math.floor(rng() * 3),
    monthsInRank: Math.floor(rng() * 3),
    attendance: talent === 'dedicado' || talent === 'competidor' ? 84 : 72,
    loyalty: 72 + Math.floor(rng() * 16),
    technique: baseTechnique,
    personality,
    talent,
    recentNotes: [`Matriculou-se para aprender ${meta.name} sob sua tutela.`],
    graduationHistory: []
  };
}

/**
 * Permite ao jogador que atingiu nível de Professor fundar sua própria academia daquela arte marcial.
 */
export function foundPlayerAcademy(
  char: Character,
  options: {
    name: string;
    art: MartialArtType;
    philosophy?: string;
    monthlyFeePerStudent?: number;
    setAsHomeGym?: boolean;
  },
  rng: () => number = Math.random
): { updatedChar: Character; success: boolean; message: string } {
  if (char.playerAcademy) {
    return {
      updatedChar: char,
      success: false,
      message: `Você já dirige a academia "${char.playerAcademy.name}".`
    };
  }

  const elig = getProfessorEligibility(char, options.art);
  if (!elig.eligible) {
    return {
      updatedChar: char,
      success: false,
      message: elig.reason || 'Você ainda não possui graduação de Professor nesta arte.'
    };
  }

  const econ = getRegionalAcademyEconomics(char);
  if (char.money < econ.foundCost) {
    return {
      updatedChar: char,
      success: false,
      message: `Saldo insuficiente. Fundar sua própria academia em ${econ.localityLabel} custa R$ ${econ.foundCost.toLocaleString('pt-BR')}.`
    };
  }

  const cleanName =
    options.name.trim() ||
    `Academia ${char.nickname || char.name.split(' ')[0]} ${MARTIAL_ARTS_META[options.art].name.split(' ')[0]}`;
  const philosophy =
    options.philosophy?.trim() ||
    'Disciplina no tatame, respeito ao próximo e formação completa de atletas.';
  const monthlyFee = Math.max(80, Math.min(600, Math.round(options.monthlyFeePerStudent || econ.suggestedMonthlyFee)));

  const updated = JSON.parse(JSON.stringify(char)) as Character;
  updated.money -= econ.foundCost;

  const initialStudents: AcademyStudent[] = [
    createNpcStudent(options.art, rng, 14),
    createNpcStudent(options.art, rng, 20),
    createNpcStudent(options.art, rng, 25)
  ];

  const academyId = `player_academy_${Date.now()}`;
  const academy: PlayerAcademy = {
    id: academyId,
    name: cleanName,
    art: options.art,
    city: updated.currentCity || updated.homeCity || 'São Paulo',
    country: updated.currentCountry || 'Brasil',
    foundedDate: { ...updated.currentDate },
    monthlyFeePerStudent: monthlyFee,
    monthlyRentCost: econ.rentLevel1,
    reputation: Math.max(20, Math.round((updated.fame || 10) * 0.4) + 15),
    level: 1,
    maxCapacity: 8,
    philosophy,
    students: initialStudents,
    lastMonthRevenue: 0,
    lastMonthProfit: 0
  };

  updated.playerAcademy = academy;
  if (options.setAsHomeGym !== false) {
    updated.currentGymId = academyId;
  }

  if (!Array.isArray(updated.socialFeed)) updated.socialFeed = [];
  updated.socialFeed.unshift({
    id: `post_academy_${Date.now()}`,
    author: updated.name,
    handle: `@${(updated.nickname || 'professor').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    text: `🏛️ Novo capítulo! Inaugurei oficialmente a "${cleanName}" especializada em ${MARTIAL_ARTS_META[options.art].name} em ${academy.city}! Matrículas abertas para novos alunos! 🥋`,
    time: 'Agora',
    likes: 34,
    verified: true
  });

  return {
    updatedChar: updated,
    success: true,
    message: `🏛️ Parabéns, Professor(a)! A academia "${cleanName}" (${MARTIAL_ARTS_META[options.art].name}) foi fundada com ${initialStudents.length} alunos iniciais!`
  };
}

/**
 * Recruta um novo aluno NPC para a academia do jogador.
 */
export function recruitAcademyStudent(
  char: Character,
  rng: () => number = Math.random
): { updatedChar: Character; student?: AcademyStudent; success: boolean; message: string } {
  if (!char.playerAcademy) {
    return { updatedChar: char, success: false, message: 'Você ainda não possui uma academia.' };
  }
  const acad = char.playerAcademy;
  if (acad.students.length >= acad.maxCapacity) {
    return {
      updatedChar: char,
      success: false,
      message: `Capacidade máxima atingida (${acad.maxCapacity} alunos). Amplie o tatame para receber mais alunos.`
    };
  }

  const updated = JSON.parse(JSON.stringify(char)) as Character;
  const student = createNpcStudent(acad.art, rng);
  updated.playerAcademy!.students.push(student);

  return {
    updatedChar: updated,
    student,
    success: true,
    message: `🥋 Novo aluno matriculado: ${student.name} (${student.age} anos, perfil ${student.talent}) iniciou em ${MARTIAL_ARTS_META[acad.art].name}!`
  };
}

/**
 * Matricula um familiar, amigo ou cônjuge do círculo social na academia própria do jogador.
 */
export function enrollSocialContactInAcademy(
  char: Character,
  contactId: string
): { updatedChar: Character; success: boolean; message: string } {
  if (!char.playerAcademy) {
    return { updatedChar: char, success: false, message: 'Você ainda não possui uma academia.' };
  }
  const acad = char.playerAcademy;
  if (acad.students.length >= acad.maxCapacity) {
    return {
      updatedChar: char,
      success: false,
      message: `Academia lotada (${acad.maxCapacity}/${acad.maxCapacity}). Amplie o espaço primeiro.`
    };
  }

  const contact = (char.socialContacts || []).find((c) => c.id === contactId);
  if (!contact || !contact.isAlive) {
    return { updatedChar: char, success: false, message: 'Contato social não encontrado.' };
  }
  if (contact.age < 7) {
    return {
      updatedChar: char,
      success: false,
      message: `${contact.name} ainda tem ${contact.age} anos; idade mínima de matrícula é 7 anos.`
    };
  }
  if (acad.students.some((s) => s.linkedContactId === contact.id)) {
    return {
      updatedChar: char,
      success: false,
      message: `${contact.name} já é aluno(a) ativo(a) da sua academia.`
    };
  }

  let updated = JSON.parse(JSON.stringify(char)) as Character;
  const targetContact = updated.socialContacts!.find((c) => c.id === contactId)!;
  const meta = MARTIAL_ARTS_META[acad.art];

  let startRank = getStudentStartRankForArt(acad.art, targetContact.age);
  let startStripes = 0;
  if (targetContact.martialArt === acad.art && targetContact.martialArtRankIndex !== undefined) {
    startRank = Math.min(meta.ranks.length - 1, targetContact.martialArtRankIndex);
    startStripes = targetContact.martialArtStripes ?? 0;
  }

  const rankDef = meta.ranks[startRank] || meta.ranks[0];
  const belt =
    acad.art === 'jiujitsu'
      ? formatBjjBeltWithDegree(startRank, rankDef.name, startStripes)
      : rankDef.name;

  targetContact.martialArt = acad.art;
  targetContact.martialArtRankIndex = startRank;
  targetContact.martialArtStripes = startStripes;
  targetContact.martialArtBelt = belt;
  targetContact.martialArtMonths = targetContact.martialArtMonths || 0;
  targetContact.martialArtSource = 'pj';
  targetContact.martialArtInfluencerName = updated.name;
  targetContact.affinity = Math.min(100, targetContact.affinity + 8);
  targetContact.respect = Math.min(100, targetContact.respect + 10);
  const nextR = deriveOccupationAndRoutineForAge(targetContact.age, targetContact.occupation, acad.art);
  targetContact.dailyRoutine = nextR.dailyRoutine;
  targetContact.recentLifeEvents = [
    `Matriculou-se na ${acad.name} para treinar ${meta.name} com você.`,
    ...(targetContact.recentLifeEvents || [])
  ].slice(0, 4);

  const student: AcademyStudent = {
    id: `stu_soc_${targetContact.id}`,
    name: targetContact.name,
    avatar: targetContact.avatar,
    gender: targetContact.gender,
    age: targetContact.age,
    art: acad.art,
    rankIndex: startRank,
    belt,
    stripes: startStripes,
    xp: 20,
    xpNeeded: rankDef.xpNeeded,
    monthsTrained: targetContact.martialArtMonths || 0,
    monthsInRank: targetContact.martialArtMonths || 0,
    attendance: 86,
    loyalty: Math.min(100, Math.max(65, targetContact.affinity + 20)),
    technique: 18 + startRank * 4,
    personality: targetContact.personality,
    talent: 'dedicado',
    linkedContactId: targetContact.id,
    recentNotes: [`Entrou para sua academia (${acad.name}).`],
    graduationHistory: []
  };

  updated.playerAcademy!.students.push(student);
  if (targetContact.age >= 9) {
    updated = syncSocialFighterToWorldRivals(updated, targetContact);
  }

  return {
    updatedChar: updated,
    success: true,
    message: `🎓 ${targetContact.name} agora treina ${meta.name} como aluno(a) oficial da "${acad.name}"!`
  };
}

export function dismissAcademyStudent(
  char: Character,
  studentId: string
): { updatedChar: Character; success: boolean; message: string } {
  if (!char.playerAcademy) {
    return { updatedChar: char, success: false, message: 'Você não possui uma academia.' };
  }
  const idx = char.playerAcademy.students.findIndex((s) => s.id === studentId);
  if (idx < 0) {
    return { updatedChar: char, success: false, message: 'Aluno não encontrado.' };
  }
  const updated = JSON.parse(JSON.stringify(char)) as Character;
  const [removed] = updated.playerAcademy!.students.splice(idx, 1);
  return {
    updatedChar: updated,
    success: true,
    message: `Matrícula de ${removed.name} encerrada na academia.`
  };
}

export type AcademyInteractionType =
  | 'dar_aula_turma'
  | 'aula_particular'
  | 'sparring_professor'
  | 'motivar';

/**
 * Interação do Professor com a turma inteira ou com um aluno específico.
 * Nota: O sistema de graus e faixas NÃO promove automaticamente — o professor avalia e escolhe quando graduar.
 */
export function interactWithAcademyStudent(
  char: Character,
  action: AcademyInteractionType,
  studentId?: string
): { updatedChar: Character; success: boolean; message: string } {
  if (!char.playerAcademy) {
    return { updatedChar: char, success: false, message: 'Você ainda não fundou sua academia.' };
  }
  if (char.playerAcademy.students.length === 0) {
    return { updatedChar: char, success: false, message: 'Recrute ao menos um aluno antes de ministrar aulas.' };
  }

  const energyCosts: Record<AcademyInteractionType, number> = {
    dar_aula_turma: 18,
    aula_particular: 10,
    sparring_professor: 12,
    motivar: 5
  };
  const cost = energyCosts[action];
  if (char.energy < cost) {
    return {
      updatedChar: char,
      success: false,
      message: `Energia insuficiente (${char.energy}/${cost}) para ministrar esta atividade.`
    };
  }

  const updated = JSON.parse(JSON.stringify(char)) as Character;
  const acad = updated.playerAcademy!;
  updated.energy = Math.max(0, updated.energy - cost);

  if (action === 'dar_aula_turma') {
    acad.students.forEach((stu) => {
      const talentMult =
        stu.talent === 'prodigio' ? 1.35 : stu.talent === 'competidor' ? 1.2 : stu.talent === 'dedicado' ? 1.1 : 0.9;
      const gainXp = Math.round(35 * talentMult);
      stu.xp = Math.min(stu.xpNeeded * 2, stu.xp + gainXp);
      stu.technique = Math.min(99, Math.round((stu.technique + 1.2 * talentMult) * 10) / 10);
      stu.loyalty = Math.min(100, stu.loyalty + 3);
      stu.attendance = Math.min(100, stu.attendance + 2);
      stu.lastInteractionNote = `Aula coletiva com Prof. ${updated.nickname || updated.name.split(' ')[0]} (+${gainXp} XP).`;
    });
    acad.reputation = Math.min(1000, acad.reputation + 2);
    updated.attributes.technique = Math.min(99, Math.round((updated.attributes.technique + 0.3) * 10) / 10);
    updated.attributes.fightIq = Math.min(99, Math.round((updated.attributes.fightIq + 0.3) * 10) / 10);

    return {
      updatedChar: updated,
      success: true,
      message: `🥋 Aula coletiva ministrada para ${acad.students.length} aluno(s)! Turma evoluiu tecnicamente (+XP, +Lealdade e +2 Reputação da academia).`
    };
  }

  const target = acad.students.find((s) => s.id === studentId);
  if (!target) {
    return { updatedChar: char, success: false, message: 'Selecione um aluno válido.' };
  }

  if (action === 'aula_particular') {
    const gainXp = target.talent === 'prodigio' ? 65 : 50;
    target.xp = Math.min(target.xpNeeded * 2, target.xp + gainXp);
    target.technique = Math.min(99, Math.round((target.technique + 2.4) * 10) / 10);
    target.loyalty = Math.min(100, target.loyalty + 7);
    const note = `Aula particular focada em detalhes técnicos (+${gainXp} XP, +2.4 Técnica).`;
    target.lastInteractionNote = note;
    target.recentNotes = [note, ...(target.recentNotes || [])].slice(0, 4);
    acad.reputation = Math.min(1000, acad.reputation + 1);

    return {
      updatedChar: updated,
      success: true,
      message: `🎯 Aula particular com ${target.name} concluída! (+${gainXp} XP, +2.4 Técnica, +7 Lealdade).`
    };
  }

  if (action === 'sparring_professor') {
    const gainXp = 55;
    target.xp = Math.min(target.xpNeeded * 2, target.xp + gainXp);
    target.technique = Math.min(99, Math.round((target.technique + 1.8) * 10) / 10);
    target.loyalty = Math.min(100, target.loyalty + 6);
    target.attendance = Math.min(100, target.attendance + 4);
    const note = `Sparring corrigido no tatame com você (+${gainXp} XP).`;
    target.lastInteractionNote = note;
    target.recentNotes = [note, ...(target.recentNotes || [])].slice(0, 4);

    updated.attributes.fightIq = Math.min(99, Math.round((updated.attributes.fightIq + 0.4) * 10) / 10);
    updated.attributes.technique = Math.min(99, Math.round((updated.attributes.technique + 0.4) * 10) / 10);

    return {
      updatedChar: updated,
      success: true,
      message: `🤼 Rola/Sparring pedagógico com ${target.name}! Aluno evoluiu (+${gainXp} XP) e você ganhou +0.4 QI/Técnica.`
    };
  }

  // motivar
  target.loyalty = Math.min(100, target.loyalty + 10);
  target.attendance = Math.min(100, target.attendance + 8);
  const note = `Conversa motivacional de vestiário (+10 Lealdade, +8 Frequência).`;
  target.lastInteractionNote = note;
  target.recentNotes = [note, ...(target.recentNotes || [])].slice(0, 4);

  if (target.linkedContactId && Array.isArray(updated.socialContacts)) {
    const sc = updated.socialContacts.find((c) => c.id === target.linkedContactId);
    if (sc) {
      sc.affinity = Math.min(100, sc.affinity + 5);
      sc.respect = Math.min(100, sc.respect + 5);
    }
  }

  return {
    updatedChar: updated,
    success: true,
    message: `💬 Você conversou e motivou ${target.name} (+10 Lealdade, +8 Frequência).`
  };
}

export interface StudentGraduationReadiness {
  xpPct: number;
  isMaxRank: boolean;
  canAwardStripe: boolean;
  canPromoteBelt: boolean;
  recommendedDecision: 'award_stripe' | 'promote_belt' | 'hold';
  statusLabel: 'Pronto (Recomendado)' | 'Em Evolução' | 'Graduado Máximo';
  nextRankName?: string;
  nextBeltAgeNote?: string;
}

/**
 * Avalia o estágio técnico do aluno para orientar o Professor — mas a decisão final é sempre do Professor.
 */
export function evaluateStudentGraduationReadiness(
  student: AcademyStudent
): StudentGraduationReadiness {
  const meta = MARTIAL_ARTS_META[student.art];
  const isMaxRank = student.rankIndex >= meta.ranks.length - 1;
  const xpPct = student.xpNeeded > 0 ? Math.min(100, Math.round((student.xp / student.xpNeeded) * 100)) : 100;

  const maxStripes = student.art === 'jiujitsu' ? getBjjMaxStripes(student.rankIndex) : 0;
  const canAwardStripe = student.art === 'jiujitsu' && student.stripes < maxStripes;

  const nextRank = !isMaxRank ? meta.ranks[student.rankIndex + 1] : undefined;
  const ageOk = nextRank?.minAge !== undefined ? student.age >= nextRank.minAge : true;
  const canPromoteBelt = !isMaxRank && ageOk;

  let nextBeltAgeNote: string | undefined;
  if (nextRank && !ageOk) {
    nextBeltAgeNote = `Próxima faixa (${nextRank.name}) exige idade mín. ${nextRank.minAge} anos (atual: ${student.age}a).`;
  }

  let recommendedDecision: 'award_stripe' | 'promote_belt' | 'hold' = 'hold';
  let statusLabel: StudentGraduationReadiness['statusLabel'] = 'Em Evolução';

  if (isMaxRank && !canAwardStripe) {
    statusLabel = 'Graduado Máximo';
  } else if (canPromoteBelt && student.xp >= student.xpNeeded && (!canAwardStripe || student.stripes >= maxStripes)) {
    recommendedDecision = 'promote_belt';
    statusLabel = 'Pronto (Recomendado)';
  } else if (canAwardStripe && student.xp >= Math.round(student.xpNeeded * ((student.stripes + 1) / (maxStripes + 1)))) {
    recommendedDecision = 'award_stripe';
    statusLabel = 'Pronto (Recomendado)';
  }

  return {
    xpPct,
    isMaxRank,
    canAwardStripe,
    canPromoteBelt,
    recommendedDecision,
    statusLabel,
    nextRankName: nextRank?.name,
    nextBeltAgeNote
  };
}

/**
 * Sistema de graduação À ESCOLHA DO PROFESSOR:
 * O jogador decide se concede +1 Grau (BJJ), promove o aluno para a próxima faixa/nível
 * (mesmo antes do XP cheio se julgar merecido, respeitando idade regulamentar), ou segura na faixa.
 */
export function promoteStudentByProfessor(
  char: Character,
  studentId: string,
  decision: 'award_stripe' | 'promote_belt' | 'hold',
  customNote?: string
): { updatedChar: Character; success: boolean; message: string } {
  if (!char.playerAcademy) {
    return { updatedChar: char, success: false, message: 'Você ainda não possui uma academia.' };
  }

  let updated = JSON.parse(JSON.stringify(char)) as Character;
  const acad = updated.playerAcademy!;
  const student = acad.students.find((s) => s.id === studentId);
  if (!student) {
    return { updatedChar: char, success: false, message: 'Aluno não encontrado.' };
  }

  const meta = MARTIAL_ARTS_META[student.art];
  const currentRankDef = meta.ranks[student.rankIndex] || meta.ranks[0];
  const dateCopy = { ...updated.currentDate };

  if (decision === 'hold') {
    const note = customNote?.trim() || 'Professor optou por consolidar mais a base antes da próxima graduação.';
    student.lastInteractionNote = note;
    student.recentNotes = [note, ...(student.recentNotes || [])].slice(0, 4);
    return {
      updatedChar: updated,
      success: true,
      message: `📋 Avaliação registrada para ${student.name}: mantido em "${student.belt}" para amadurecer técnica.`
    };
  }

  if (decision === 'award_stripe') {
    if (student.art !== 'jiujitsu') {
      return {
        updatedChar: char,
        success: false,
        message: 'Concessão de graus individuais aplica-se apenas ao sistema CBJJ/IBJJF (Jiu-Jitsu).'
      };
    }
    const maxStripes = getBjjMaxStripes(student.rankIndex);
    if (student.stripes >= maxStripes) {
      return {
        updatedChar: char,
        success: false,
        message: `${student.name} já está no grau máximo desta faixa (${maxStripes}º Grau). Você pode promovê-lo(a) de faixa!`
      };
    }

    const oldLabel = student.belt;
    student.stripes += 1;
    student.belt = formatBjjBeltWithDegree(student.rankIndex, currentRankDef.name, student.stripes);
    student.loyalty = Math.min(100, student.loyalty + 8);
    const note = customNote?.trim() || `Outorga de ${student.stripes}º Grau à escolha do Professor.`;
    student.lastInteractionNote = note;
    student.recentNotes = [note, ...(student.recentNotes || [])].slice(0, 4);
    student.graduationHistory = [
      { date: dateCopy, from: oldLabel, to: student.belt, note },
      ...(student.graduationHistory || [])
    ].slice(0, 10);
    acad.reputation = Math.min(1000, acad.reputation + 3);

    updated = syncAcademyStudentToContactsAndRivals(updated, student);

    return {
      updatedChar: updated,
      success: true,
      message: `🥋 Grau concedido! ${student.name} recebeu o ${student.stripes}º Grau em sua faixa (${student.belt})!`
    };
  }

  // promote_belt
  if (student.rankIndex >= meta.ranks.length - 1) {
    return {
      updatedChar: char,
      success: false,
      message: `${student.name} já atingiu a graduação máxima de ${meta.name}.`
    };
  }

  const nextRank = meta.ranks[student.rankIndex + 1];
  if (nextRank.minAge !== undefined && student.age < nextRank.minAge) {
    return {
      updatedChar: char,
      success: false,
      message: `Regulamento federativo impede "${nextRank.name}" para ${student.age} anos (mínimo: ${nextRank.minAge} anos).`
    };
  }

  const wasEarly = student.xp < student.xpNeeded;
  const oldLabel = student.belt;
  student.rankIndex += 1;
  student.stripes = 0;
  student.xp = 0;
  student.xpNeeded = nextRank.xpNeeded;
  student.monthsInRank = 0;
  student.belt =
    student.art === 'jiujitsu'
      ? formatBjjBeltWithDegree(student.rankIndex, nextRank.name, 0)
      : nextRank.name;
  student.loyalty = Math.min(100, student.loyalty + 14);
  student.technique = Math.min(99, Math.round((student.technique + 2.5) * 10) / 10);

  const note =
    customNote?.trim() ||
    (wasEarly
      ? 'Promoção antecipada por mérito técnico à escolha do Professor.'
      : 'Cerimônia oficial de troca de faixa conduzida pelo Professor.');
  student.lastInteractionNote = note;
  student.recentNotes = [note, ...(student.recentNotes || [])].slice(0, 4);
  student.graduationHistory = [
    { date: dateCopy, from: oldLabel, to: student.belt, note },
    ...(student.graduationHistory || [])
  ].slice(0, 10);

  acad.reputation = Math.min(1000, acad.reputation + 6);
  updated.honor = Math.min(100, updated.honor + 2);

  updated = syncAcademyStudentToContactsAndRivals(updated, student);

  return {
    updatedChar: updated,
    success: true,
    message: `🏆 Cerimônia na ${acad.name}! Você promoveu ${student.name} para "${student.belt}"!`
  };
}

function syncAcademyStudentToContactsAndRivals(
  char: Character,
  student: AcademyStudent
): Character {
  let updated = char;
  if (student.linkedContactId && Array.isArray(updated.socialContacts)) {
    const sc = updated.socialContacts.find((c) => c.id === student.linkedContactId);
    if (sc) {
      sc.martialArt = student.art;
      sc.martialArtRankIndex = student.rankIndex;
      sc.martialArtStripes = student.stripes;
      sc.martialArtBelt = student.belt;
      sc.martialArtMonths = student.monthsInRank;
      sc.respect = Math.min(100, sc.respect + 8);
      sc.affinity = Math.min(100, sc.affinity + 6);
      sc.recentLifeEvents = [
        `Recebeu graduação (${student.belt}) das mãos do(a) Prof. ${updated.name}.`,
        ...(sc.recentLifeEvents || [])
      ].slice(0, 4);
      if (sc.age >= 9 && sc.isAlive) {
        updated = syncSocialFighterToWorldRivals(updated, sc);
      }
    }
  }
  return updated;
}

export function upgradePlayerAcademy(char: Character): {
  updatedChar: Character;
  success: boolean;
  message: string;
} {
  if (!char.playerAcademy) {
    return { updatedChar: char, success: false, message: 'Você não possui uma academia.' };
  }
  const acad = char.playerAcademy;
  if (acad.level >= 3) {
    return { updatedChar: char, success: false, message: 'Sua academia já está no nível máximo (Nível 3).' };
  }

  const econ = getRegionalAcademyEconomics({
    currentCity: acad.city,
    currentCountry: acad.country,
    homeCity: acad.city,
    homeState: char.homeState
  });
  const upgradeCost = acad.level === 1 ? econ.upgradeToLevel2Cost : econ.upgradeToLevel3Cost;
  if (char.money < upgradeCost) {
    return {
      updatedChar: char,
      success: false,
      message: `Expansão em ${econ.localityLabel} custa R$ ${upgradeCost.toLocaleString('pt-BR')} (saldo atual: R$ ${char.money.toLocaleString('pt-BR')}).`
    };
  }

  const updated = JSON.parse(JSON.stringify(char)) as Character;
  updated.money -= upgradeCost;
  const uAcad = updated.playerAcademy!;
  uAcad.level = (uAcad.level + 1) as 2 | 3;
  uAcad.maxCapacity = uAcad.level === 2 ? 15 : 25;
  uAcad.monthlyRentCost = uAcad.level === 2 ? econ.rentLevel2 : econ.rentLevel3;
  uAcad.reputation = Math.min(1000, uAcad.reputation + 20);

  return {
    updatedChar: updated,
    success: true,
    message: `🏗️ Academia expandida para o Nível ${uAcad.level}! Nova capacidade: até ${uAcad.maxCapacity} alunos.`
  };
}

export function updatePlayerAcademySettings(
  char: Character,
  settings: {
    name?: string;
    philosophy?: string;
    monthlyFeePerStudent?: number;
  }
): { updatedChar: Character; success: boolean; message: string } {
  if (!char.playerAcademy) {
    return { updatedChar: char, success: false, message: 'Você não possui uma academia.' };
  }
  const updated = JSON.parse(JSON.stringify(char)) as Character;
  const acad = updated.playerAcademy!;
  if (settings.name !== undefined && settings.name.trim()) {
    acad.name = settings.name.trim();
  }
  if (settings.philosophy !== undefined && settings.philosophy.trim()) {
    acad.philosophy = settings.philosophy.trim();
  }
  if (settings.monthlyFeePerStudent !== undefined && !Number.isNaN(settings.monthlyFeePerStudent)) {
    acad.monthlyFeePerStudent = Math.max(60, Math.min(700, Math.round(settings.monthlyFeePerStudent)));
  }
  return {
    updatedChar: updated,
    success: true,
    message: `⚙️ Configurações da "${acad.name}" atualizadas (Mensalidade: R$ ${acad.monthlyFeePerStudent}).`
  };
}

/**
 * Simulação mensal autônoma da academia do Professor:
 * - Evolui XP/técnica e idade dos alunos;
 * - Calcula mensalidades recebidas e aluguel;
 * - Mantém as promoções e graus sob decisão exclusiva do Professor!
 */
export function processMonthlyPlayerAcademy(
  char: Character,
  rng: () => number = Math.random
): { updatedChar: Character; logs: string[] } {
  if (!char.playerAcademy) return { updatedChar: char, logs: [] };

  let updated = JSON.parse(JSON.stringify(char)) as Character;
  const acad = updated.playerAcademy!;
  const logs: string[] = [];
  const meta = MARTIAL_ARTS_META[acad.art];

  let totalRevenue = 0;

  for (const stu of acad.students) {
    stu.monthsTrained += 1;
    stu.monthsInRank += 1;

    // Sincroniza idade se vinculado a contato social, ou envelhece no aniversário anual da fundação
    if (stu.linkedContactId && Array.isArray(updated.socialContacts)) {
      const sc = updated.socialContacts.find((c) => c.id === stu.linkedContactId);
      if (sc) {
        stu.age = sc.age;
      }
    } else if (updated.currentDate.month === acad.foundedDate.month) {
      stu.age += 1;
    }

    // Transição aos 16 anos para faixa adulta em BJJ / Capoeira (regulamento etário)
    if (stu.age >= 16) {
      if (stu.art === 'jiujitsu' && stu.rankIndex >= 1 && stu.rankIndex <= 4) {
        const adultAzul = meta.ranks[5];
        const prev = stu.belt;
        stu.rankIndex = 5;
        stu.stripes = 0;
        stu.xp = 0;
        stu.xpNeeded = adultAzul.xpNeeded;
        stu.monthsInRank = 0;
        stu.belt = formatBjjBeltWithDegree(5, adultAzul.name, 0);
        stu.recentNotes = [
          `Completou 16 anos e migrou para ${stu.belt} (${prev}).`,
          ...(stu.recentNotes || [])
        ].slice(0, 4);
      } else if (stu.art === 'capoeira' && stu.rankIndex <= 16) {
        const adultCinza = meta.ranks[17];
        stu.rankIndex = 17;
        stu.belt = adultCinza.name;
        stu.xpNeeded = adultCinza.xpNeeded;
      }
    }

    const talentGain =
      stu.talent === 'prodigio'
        ? 62
        : stu.talent === 'competidor'
        ? 52
        : stu.talent === 'dedicado'
        ? 44
        : 28;
    const artScale = stu.art === 'jiujitsu' ? 6.2 : 1.0;
    const attendanceFactor = 0.7 + (stu.attendance / 100) * 0.4;
    const xpGain = Math.round(talentGain * attendanceFactor * artScale);

    stu.xp = Math.min(stu.xpNeeded * 2, stu.xp + xpGain);
    stu.technique = Math.min(99, Math.round((stu.technique + 0.55 * attendanceFactor) * 10) / 10);

    // Mensalidade (familiares próximos pagam taxa simbólica ou normal, alunos normais pagam integral)
    const payFactor = stu.attendance >= 40 ? 1 : 0.5;
    totalRevenue += Math.round(acad.monthlyFeePerStudent * payFactor);
  }

  // Oportunidade orgânica de matrícula por reputação da academia
  if (acad.students.length < acad.maxCapacity && rng() < Math.min(0.45, 0.12 + acad.reputation / 600)) {
    const walkIn = createNpcStudent(acad.art, rng);
    acad.students.push(walkIn);
    logs.push(`🎓 Nova matrícula espontânea na ${acad.name}: ${walkIn.name} (${walkIn.age} anos) procurou sua academia!`);
  }

  const netProfit = totalRevenue - acad.monthlyRentCost;
  acad.lastMonthRevenue = totalRevenue;
  acad.lastMonthProfit = netProfit;
  updated.money += netProfit;

  logs.push(
    `🏛️ Balanço da ${acad.name}: ${acad.students.length} aluno(s) • Receita R$ ${totalRevenue.toLocaleString('pt-BR')} − Aluguel R$ ${acad.monthlyRentCost.toLocaleString('pt-BR')} = ${netProfit >= 0 ? '+' : ''}R$ ${netProfit.toLocaleString('pt-BR')}.`
  );

  const readyCount = acad.students.filter(
    (s) => evaluateStudentGraduationReadiness(s).recommendedDecision !== 'hold'
  ).length;
  if (readyCount > 0) {
    logs.push(
      `🥋 Avaliação Docente (${acad.name}): ${readyCount} aluno(s) pronto(s) para receber grau ou troca de faixa à sua escolha!`
    );
  }

  return { updatedChar: updated, logs };
}

export const ACADEMY_SEMINAR_COST = 250;
export const ACADEMY_SEMINAR_COOLDOWN_MONTHS = 6;

/**
 * Realiza um Seminário Técnico & Exame Coletivo de Faixas/Graus na Academia do Professor.
 * Requer 6 meses de intervalo entre seminários, R$ 250 de estrutura e 20 de energia.
 * Concede XP, técnica e lealdade a todos os alunos e executa as graduações prontas da turma.
 */
export function holdAcademySeminarAndGraduation(char: Character): {
  updatedChar: Character;
  success: boolean;
  message: string;
  promotedCount: number;
  stripedCount: number;
} {
  if (!char.playerAcademy) {
    return {
      updatedChar: char,
      success: false,
      message: 'Você ainda não fundou sua própria academia.',
      promotedCount: 0,
      stripedCount: 0
    };
  }

  const acad = char.playerAcademy;
  if (acad.students.length === 0) {
    return {
      updatedChar: char,
      success: false,
      message: 'Matricule pelo menos um aluno antes de organizar um seminário.',
      promotedCount: 0,
      stripedCount: 0
    };
  }

  if (acad.lastSeminarCareerMonth !== undefined) {
    const monthsSince = (char.careerMonthsElapsed || 0) - acad.lastSeminarCareerMonth;
    if (monthsSince < ACADEMY_SEMINAR_COOLDOWN_MONTHS) {
      const remaining = ACADEMY_SEMINAR_COOLDOWN_MONTHS - monthsSince;
      return {
        updatedChar: char,
        success: false,
        message: `Aguarde ${remaining} mês(es) para realizar o próximo Seminário & Exame Coletivo (intervalo de ${ACADEMY_SEMINAR_COOLDOWN_MONTHS} meses).`,
        promotedCount: 0,
        stripedCount: 0
      };
    }
  }

  const econ = getRegionalAcademyEconomics({
    currentCity: acad.city,
    currentCountry: acad.country,
    homeCity: acad.city,
    homeState: char.homeState
  });
  const seminarCost = econ.seminarCost;

  if (char.money < seminarCost) {
    return {
      updatedChar: char,
      success: false,
      message: `Saldo insuficiente para organizar o seminário em ${econ.localityLabel} (custo: R$ ${seminarCost}).`,
      promotedCount: 0,
      stripedCount: 0
    };
  }

  if (char.energy < 20) {
    return {
      updatedChar: char,
      success: false,
      message: `Energia insuficiente (${char.energy}/20) para conduzir o seminário coletivo.`,
      promotedCount: 0,
      stripedCount: 0
    };
  }

  let updated = JSON.parse(JSON.stringify(char)) as Character;
  const uAcad = updated.playerAcademy!;
  const meta = MARTIAL_ARTS_META[uAcad.art];
  const dateCopy = { ...updated.currentDate };

  updated.money -= seminarCost;
  updated.energy = Math.max(0, updated.energy - 20);
  uAcad.lastSeminarCareerMonth = updated.careerMonthsElapsed || 0;

  let promotedCount = 0;
  let stripedCount = 0;

  for (const stu of uAcad.students) {
    const seminarXp = Math.round(45 * (stu.art === 'jiujitsu' ? 6.2 : 1.0));
    stu.xp = Math.min(stu.xpNeeded * 2, stu.xp + seminarXp);
    stu.technique = Math.min(99, Math.round((stu.technique + 1.2) * 10) / 10);
    stu.loyalty = Math.min(100, stu.loyalty + 6);
    stu.attendance = Math.min(100, stu.attendance + 5);

    const readiness = evaluateStudentGraduationReadiness(stu);
    if (readiness.recommendedDecision === 'promote_belt' && stu.rankIndex < meta.ranks.length - 1) {
      const nextRank = meta.ranks[stu.rankIndex + 1];
      if (!nextRank.minAge || stu.age >= nextRank.minAge) {
        const oldLabel = stu.belt;
        stu.rankIndex += 1;
        stu.stripes = 0;
        stu.xp = 0;
        stu.xpNeeded = nextRank.xpNeeded;
        stu.monthsInRank = 0;
        stu.belt =
          stu.art === 'jiujitsu'
            ? formatBjjBeltWithDegree(stu.rankIndex, nextRank.name, 0)
            : nextRank.name;
        const note = 'Graduado(a) no Seminário & Exame Coletivo da Academia.';
        stu.lastInteractionNote = note;
        stu.recentNotes = [note, ...(stu.recentNotes || [])].slice(0, 4);
        stu.graduationHistory = [
          { date: dateCopy, from: oldLabel, to: stu.belt, note },
          ...(stu.graduationHistory || [])
        ].slice(0, 10);
        promotedCount += 1;
        updated = syncAcademyStudentToContactsAndRivals(updated, stu);
        continue;
      }
    }

    if (readiness.recommendedDecision === 'award_stripe' && stu.art === 'jiujitsu') {
      const maxStripes = getBjjMaxStripes(stu.rankIndex);
      if (stu.stripes < maxStripes) {
        const curRankDef = meta.ranks[stu.rankIndex] || meta.ranks[0];
        const oldLabel = stu.belt;
        stu.stripes += 1;
        stu.belt = formatBjjBeltWithDegree(stu.rankIndex, curRankDef.name, stu.stripes);
        const note = `Recebeu ${stu.stripes}º Grau no Seminário Coletivo.`;
        stu.lastInteractionNote = note;
        stu.recentNotes = [note, ...(stu.recentNotes || [])].slice(0, 4);
        stu.graduationHistory = [
          { date: dateCopy, from: oldLabel, to: stu.belt, note },
          ...(stu.graduationHistory || [])
        ].slice(0, 10);
        stripedCount += 1;
        updated = syncAcademyStudentToContactsAndRivals(updated, stu);
        continue;
      }
    }

    const note = `Participou do Seminário Coletivo (+${seminarXp} XP, +1.2 Técnica).`;
    stu.lastInteractionNote = note;
    stu.recentNotes = [note, ...(stu.recentNotes || [])].slice(0, 4);
  }

  uAcad.reputation = Math.min(1000, uAcad.reputation + 8 + promotedCount * 2);
  updated.honor = Math.min(100, updated.honor + 4);
  updated.fame = Math.min(1000, updated.fame + 3);

  if (!Array.isArray(updated.socialFeed)) updated.socialFeed = [];
  updated.socialFeed.unshift({
    id: `seminar_${Date.now()}`,
    author: `${uAcad.name}`,
    handle: `@${uAcad.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    text: `🥋 Seminário & Exame Coletivo concluído com casa cheia! ${uAcad.students.length} atletas avaliados, ${promotedCount} nova(s) faixa(s) e ${stripedCount} grau(s) entregues sob comando de Prof. ${updated.name}.`,
    time: `${String(updated.currentMonth).padStart(2, '0')}/${updated.currentYear}`,
    likes: 35 + uAcad.reputation,
    verified: uAcad.reputation >= 100
  });

  return {
    updatedChar: updated,
    success: true,
    promotedCount,
    stripedCount,
    message: `🎓 Seminário Coletivo realizado na ${uAcad.name}! ${uAcad.students.length} alunos evoluíram (+${promotedCount} faixa(s), +${stripedCount} grau(s), +${8 + promotedCount * 2} Reputação).`
  };
}

