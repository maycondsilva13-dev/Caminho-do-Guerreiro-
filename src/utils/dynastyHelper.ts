import { AcademyStudent, Character, MartialArtType, SocialContact } from '../types/game';
import { MARTIAL_ARTS_META } from '../data/martialArtsData';
import { createInitialGraduations } from './characterHelper';
import { formatBjjBeltWithDegree } from './bjjDegreeHelper';
import { getOrInitializePlayerBjjRepertoire } from './bjjRepertoireHelper';
import { generateRandomArtTalents } from './talentAndDifficultyHelper';

export interface DynastyHeirOption {
  id: string;
  source: 'child' | 'student';
  name: string;
  avatar: string;
  gender: 'M' | 'F';
  age: number;
  art: MartialArtType;
  rankIndex: number;
  stripes: number;
  beltLabel: string;
  relationLabel: string;
  canInheritAcademy: boolean;
}

/**
 * Lista todos os herdeiros elegíveis (filhos vivos >= 8 anos ou alunos da academia >= 14 anos)
 * para assumir o legado e continuar a dinastia.
 */
export function getEligibleHeirs(char: Character): DynastyHeirOption[] {
  const options: DynastyHeirOption[] = [];
  const contacts = Array.isArray(char.socialContacts) ? char.socialContacts : [];

  // 1. Filhos vivos do PJ (>= 8 anos)
  for (const c of contacts) {
    if (c.isAlive && c.relationType === 'filho' && c.age >= 8) {
      const art: MartialArtType = c.martialArt || char.primaryArt || 'jiujitsu';
      const meta = MARTIAL_ARTS_META[art];
      const rankIdx = Math.max(0, Math.min(meta.ranks.length - 1, c.martialArtRankIndex ?? 0));
      const stripes = c.martialArtStripes ?? 0;
      const baseBelt = meta.ranks[rankIdx]?.name || meta.ranks[0].name;
      const beltLabel =
        art === 'jiujitsu' ? formatBjjBeltWithDegree(rankIdx, baseBelt, stripes) : baseBelt;

      options.push({
        id: c.id,
        source: 'child',
        name: c.name,
        avatar: c.avatar || (c.gender === 'F' ? '👩' : '👨'),
        gender: c.gender,
        age: c.age,
        art,
        rankIndex: rankIdx,
        stripes,
        beltLabel,
        relationLabel: c.gender === 'F' ? 'Filha Herdeira' : 'Filho Herdeiro',
        canInheritAcademy: Boolean(char.playerAcademy)
      });
    }
  }

  // 2. Pupilos da Academia do Professor (>= 14 anos) que não já estejam listados como filhos
  if (char.playerAcademy && Array.isArray(char.playerAcademy.students)) {
    const childIds = new Set(options.map((o) => o.id));
    for (const s of char.playerAcademy.students) {
      if (s.linkedContactId && childIds.has(s.linkedContactId)) continue;
      if (s.age < 14) continue;

      const art = s.art || char.playerAcademy.art;
      const meta = MARTIAL_ARTS_META[art];
      const rankIdx = Math.max(0, Math.min(meta.ranks.length - 1, s.rankIndex));
      const baseBelt = meta.ranks[rankIdx]?.name || meta.ranks[0].name;
      const beltLabel =
        art === 'jiujitsu' ? formatBjjBeltWithDegree(rankIdx, baseBelt, s.stripes || 0) : baseBelt;

      options.push({
        id: s.id,
        source: 'student',
        name: s.name,
        avatar: s.avatar || '🥋',
        gender: s.gender,
        age: s.age,
        art,
        rankIndex: rankIdx,
        stripes: s.stripes || 0,
        beltLabel,
        relationLabel: 'Pupilo Sucessor da Academia',
        canInheritAcademy: true
      });
    }
  }

  return options;
}

/**
 * Cria a próxima geração da dinastia a partir de um filho ou pupilo escolhido,
 * preservando patrimônio parcial, história familiar, contatos sobreviventes e academia.
 */
export function inheritLegacyCharacter(
  parentChar: Character,
  heirId: string,
  heirSource: 'child' | 'student'
): { success: boolean; heirChar?: Character; message: string } {
  const options = getEligibleHeirs(parentChar);
  const chosen = options.find((o) => o.id === heirId && o.source === heirSource);

  if (!chosen) {
    return { success: false, message: 'Herdeiro selecionado não está disponível para assumir o legado.' };
  }

  const refDate = { ...(parentChar.currentDate || { day: 1, month: 1, year: parentChar.currentYear || 2026 }) };
  let birthDate = { day: 15, month: 5, year: refDate.year - chosen.age };
  let startSkillBoost = 0;

  let chosenChild: SocialContact | undefined;
  let chosenStudent: AcademyStudent | undefined;

  if (heirSource === 'child') {
    chosenChild = (parentChar.socialContacts || []).find((c) => c.id === heirId);
    if (chosenChild) {
      birthDate = { ...chosenChild.birthDate };
      startSkillBoost = Math.min(18, Math.round((chosenChild.martialArtRankIndex || 0) * 3));
    }
  } else if (parentChar.playerAcademy) {
    chosenStudent = parentChar.playerAcademy.students.find((s) => s.id === heirId);
    if (chosenStudent) {
      startSkillBoost = Math.min(24, Math.round(chosenStudent.technique * 0.25));
    }
  }

  const primaryArt = chosen.art;
  const artGraduations = createInitialGraduations(primaryArt);
  const meta = MARTIAL_ARTS_META[primaryArt];
  const rankIdx = chosen.rankIndex;
  const rankDef = meta.ranks[rankIdx] || meta.ranks[0];

  artGraduations[primaryArt] = {
    rankIndex: rankIdx,
    name: rankDef.name,
    color: rankDef.color,
    textColor: rankDef.textColor,
    stripes: chosen.stripes,
    xp: chosenStudent ? chosenStudent.xp : rankIdx > 0 ? Math.round(rankDef.xpNeeded * 0.2) : 45,
    xpNeeded: rankDef.xpNeeded,
    masteryTitle:
      primaryArt === 'jiujitsu'
        ? formatBjjBeltWithDegree(rankIdx, rankDef.name, chosen.stripes)
        : rankDef.name,
    stageNumber: rankDef.stageNumber,
    categoryName: rankDef.categoryName,
    evaluationCriteria: rankDef.evaluationCriteria,
    estimatedTime: rankDef.estimatedTime,
    gradientStyle: rankDef.gradientStyle,
    monthsInRank: chosenStudent ? chosenStudent.monthsInRank : chosenChild?.martialArtMonths || 0
  };

  const ageFactor = chosen.age < 14 ? 14 : chosen.age < 18 ? 19 : 25;
  const heirAttrs = {
    strength: ageFactor + Math.round(startSkillBoost * 0.5),
    speed: ageFactor + Math.round(startSkillBoost * 0.5),
    stamina: ageFactor + Math.round(startSkillBoost * 0.5),
    durability: ageFactor + Math.round(startSkillBoost * 0.4),
    flexibility: ageFactor + Math.round(startSkillBoost * 0.4),
    fightIq: ageFactor + Math.round(startSkillBoost * 0.8) + Math.min(8, Math.round(parentChar.attributes.fightIq * 0.12)),
    technique: ageFactor + startSkillBoost + Math.min(8, Math.round(parentChar.attributes.technique * 0.12)),
    mentalFocus: ageFactor + 4
  };

  const inheritedMoney = Math.max(150, Math.round((parentChar.money || 0) * 0.6));
  const inheritedFame = Math.min(400, Math.round((parentChar.fame || 0) * 0.25));
  const generation = (parentChar.dynastyGeneration || 1) + 1;
  const firstName = chosen.name.split(' ')[0];
  const nickname =
    heirSource === 'child'
      ? `${firstName} Jr.`
      : `${firstName} Herdeiro`;

  // Monta rede social do herdeiro preservando a família existente
  const newContacts: SocialContact[] = [];
  if (heirSource === 'child') {
    for (const c of parentChar.socialContacts || []) {
      if (c.id === chosen.id) continue;
      const cloned: SocialContact = JSON.parse(JSON.stringify(c));
      if (cloned.relationType === 'filho') {
        cloned.relationType = 'irmao';
        cloned.relationshipStage = 'familia';
      } else if (cloned.relationType === 'conjuge' || cloned.id === parentChar.spouseId) {
        cloned.relationType = parentChar.gender === 'F' ? 'pai' : 'mae';
        cloned.relationshipStage = 'familia';
      }
      if (cloned.relationType === 'pai' || cloned.relationType === 'mae' || cloned.relationType === 'irmao') {
        newContacts.push(cloned);
      }
    }
    // Registra o PJ anterior no memorial familiar
    newContacts.push({
      id: `predecessor_${Date.now()}`,
      name: parentChar.name,
      avatar: parentChar.avatar || '🥋',
      gender: parentChar.gender || 'M',
      relationType: parentChar.gender === 'F' ? 'mae' : 'pai',
      personality: 'disciplinado',
      birthDate: { ...parentChar.birthDate },
      age: parentChar.age,
      isAlive: false,
      deathDate: parentChar.deathDate ? { ...parentChar.deathDate } : { ...refDate },
      deathCause: parentChar.deathCause || 'Encerrou seu ciclo deixando a linhagem marcial',
      health: 0,
      wealthTier: inheritedMoney >= 50000 ? 'milionario' : inheritedMoney >= 8000 ? 'abastado' : 'classe_media',
      occupation: 'Lenda do Tatame',
      dailyRoutine: 'Legado imortal na história da família',
      city: parentChar.currentCity || parentChar.homeCity,
      affinity: 95,
      romanceLevel: 0,
      respect: 100,
      relationshipStage: 'familia',
      martialArt: parentChar.primaryArt,
      martialArtRankIndex: parentChar.artGraduations[parentChar.primaryArt]?.rankIndex ?? 0,
      martialArtBelt: parentChar.artGraduations[parentChar.primaryArt]?.masteryTitle,
      recentLifeEvents: [`Deixou seu legado para a ${generation}ª geração (${chosen.name}).`]
    });
  } else {
    // Pupilo sucessor mantém referência ao mestre no memorial
    newContacts.push({
      id: `master_mentor_${Date.now()}`,
      name: parentChar.name,
      avatar: parentChar.avatar || '🥋',
      gender: parentChar.gender || 'M',
      relationType: 'amigo',
      personality: 'disciplinado',
      birthDate: { ...parentChar.birthDate },
      age: parentChar.age,
      isAlive: false,
      deathDate: parentChar.deathDate ? { ...parentChar.deathDate } : { ...refDate },
      deathCause: parentChar.deathCause || 'Mestre fundador que confiou a academia ao seu sucessor',
      health: 0,
      wealthTier: 'classe_media',
      occupation: 'Mestre Fundador',
      dailyRoutine: 'Memória eterna no dojô',
      city: parentChar.currentCity || parentChar.homeCity,
      affinity: 95,
      romanceLevel: 0,
      respect: 100,
      relationshipStage: 'melhor_amigo',
      martialArt: parentChar.primaryArt,
      martialArtRankIndex: parentChar.artGraduations[parentChar.primaryArt]?.rankIndex ?? 0,
      martialArtBelt: parentChar.artGraduations[parentChar.primaryArt]?.masteryTitle,
      recentLifeEvents: [`Passou o bastão da linhagem marcial para ${chosen.name}.`]
    });
  }

  // Herda academia própria se existir
  let inheritedAcademy = parentChar.playerAcademy
    ? JSON.parse(JSON.stringify(parentChar.playerAcademy))
    : undefined;
  if (inheritedAcademy && heirSource === 'student') {
    inheritedAcademy.students = inheritedAcademy.students.filter((s: AcademyStudent) => s.id !== heirId);
  }

  const startWeight = chosen.age < 13 ? 42 : chosen.age < 18 ? 60 : 72;
  const heirChar: Character = {
    name: chosen.name,
    nickname,
    avatar: chosen.avatar,
    gender: chosen.gender,
    maritalStatus: 'solteiro',
    isAlive: true,
    birthDate,
    careerStartDate: { ...refDate },
    currentDate: { ...refDate },
    careerMonthsElapsed: 0,
    homeState: parentChar.homeState || 'SP',
    homeCity: parentChar.homeCity || 'São Paulo',
    age: chosen.age,
    startAge: chosen.age < 13 ? 8 : chosen.age < 18 ? 13 : 21,
    currentWeek: 1,
    currentMonth: refDate.month,
    currentYear: refDate.year,
    primaryArt,
    weight: startWeight,
    targetWeight: startWeight <= 52 ? 52 : startWeight <= 66 ? 66 : 70,
    weightClass: startWeight <= 52 ? 'Palha (até 52kg)' : startWeight <= 66 ? 'Pena (até 66kg)' : 'Leve (até 70kg)',
    money: inheritedMoney,
    energy: 100,
    mentalHealth: 90,
    stress: 10,
    honor: Math.max(55, Math.round((parentChar.honor || 50) * 0.75)),
    fame: inheritedFame,
    hype: 15,
    currentGymId: inheritedAcademy ? inheritedAcademy.id : parentChar.currentGymId || 'gym_bairro',
    job: chosen.age >= 18 ? 'instrutor_artes' : 'desempregado',
    schoolGrade: chosen.age < 18 ? 8.5 : 10,
    isStudying: chosen.age < 18,
    dietPlan: 'caseira',
    injuries: [],
    accumulatedFatigue: 0,
    recoveryRate: 100,
    currentCity: parentChar.currentCity || parentChar.homeCity,
    currentCountry: parentChar.currentCountry || 'Brasil',
    attributes: heirAttrs,
    artGraduations,
    moves: parentChar.moves.slice(0, 4),
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
    rivals: JSON.parse(JSON.stringify(parentChar.rivals || [])),
    npcWorldState: parentChar.npcWorldState ? JSON.parse(JSON.stringify(parentChar.npcWorldState)) : {},
    socialContacts: newContacts,
    playerAcademy: inheritedAcademy,
    difficulty: parentChar.difficulty || 'normal',
    familyWealthTier:
      inheritedMoney >= 50000
        ? 'milionario'
        : inheritedMoney >= 8000
        ? 'abastado'
        : parentChar.familyWealthTier || 'classe_media',
    artTalents: generateRandomArtTalents(),
    discoveredArtTalents: {},
    familySupport: 90,
    dynastyGeneration: generation,
    legacyPredecessorName: parentChar.name,
    legacySummary: `Geração ${generation} · Herança de ${parentChar.name} (${parentChar.record.wins}V-${parentChar.record.losses}D, ${parentChar.trophies.length} títulos)`,
    socialFeed: [
      {
        id: `dynasty_${Date.now()}`,
        author: 'Portal Combate & Linhagem',
        handle: '@combate_linhagem',
        text: `🔥 A ${generation}ª geração começou! ${chosen.name} assumiu o legado de ${parentChar.name} ("${parentChar.nickname}") para defender o nome da família nos tatames!`,
        time: 'Agora',
        likes: 120 + inheritedFame,
        verified: true
      }
    ]
  };

  heirChar.bjjTechniqueRepertoire = getOrInitializePlayerBjjRepertoire(heirChar);

  return {
    success: true,
    heirChar,
    message: `🏛️ Legado assumido! Você agora joga como ${heirChar.name} (${generation}ª Geração).`
  };
}
