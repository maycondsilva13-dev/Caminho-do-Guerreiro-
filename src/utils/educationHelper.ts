import {
  ActiveEducationEnrollment,
  Character,
  CharacterEducationState,
  CompletedEducation,
  EducationField,
  EducationLevel,
  EducationShift,
  GameDate,
  GameDifficulty,
  JobType
} from '../types/game';
import {
  EDUCATION_FIELD_META,
  EDUCATION_LEVEL_META,
  findEducationCourse
} from '../data/educationData';
import { AVAILABLE_JOBS, JobDefinition } from '../data/lifeEventsData';
import {
  calculateBlockCapacity,
  DailyBlockType,
  DayOfWeek,
  getCharacterWeeklyActivities,
  POINTS_PER_BLOCK
} from '../types/agenda';
import { getDifficultyProfile } from './talentAndDifficultyHelper';
import {
  calculateRegionalEducationFee,
  calculateRegionalJobMonthlyPay
} from './regionalEconomyHelper';

export function createInitialEducationState(
  startAge: number,
  difficulty: GameDifficulty = 'normal',
  startDate: GameDate = { day: 1, month: 1, year: 2026 }
): CharacterEducationState {
  const diff = getDifficultyProfile(difficulty);
  const preferPrivate =
    diff.familyWealthTier === 'abastado' || diff.familyWealthTier === 'milionario';

  if (startAge < 18) {
    const instId = preferPrivate ? 'inst_priv_fundamental' : 'inst_pub_fundamental';
    const courseId = preferPrivate ? 'curso_priv_fundamental' : 'curso_pub_fundamental';
    const found = findEducationCourse(instId, courseId)!;

    return {
      currentEnrollment: {
        institutionId: found.institution.id,
        institutionName: found.institution.name,
        institutionType: found.institution.type,
        courseId: found.course.id,
        courseTitle: found.course.title,
        level: found.course.level,
        field: found.course.field,
        shift: 'manha',
        monthsCompleted: startAge === 13 ? 6 : 0,
        durationMonths: found.course.durationMonths,
        monthlyFee: found.course.monthlyFee,
        currentGrade: 8.5,
        startedDate: { ...startDate }
      },
      completedDegrees: [],
      entranceExamScore: 8.5
    };
  }

  // Adulto (ex: 21 anos): inicia com Fundamental e Ensino Médio já concluídos
  const fundFound = findEducationCourse(
    preferPrivate ? 'inst_priv_fundamental' : 'inst_pub_fundamental',
    preferPrivate ? 'curso_priv_fundamental' : 'curso_pub_fundamental'
  )!;
  const medFound = findEducationCourse(
    preferPrivate ? 'inst_priv_medio' : 'inst_pub_medio',
    preferPrivate ? 'curso_priv_medio' : 'curso_pub_medio'
  )!;

  return {
    currentEnrollment: undefined,
    completedDegrees: [
      {
        id: 'deg_init_fundamental',
        institutionId: fundFound.institution.id,
        institutionName: fundFound.institution.name,
        institutionType: fundFound.institution.type,
        courseId: fundFound.course.id,
        courseTitle: fundFound.course.title,
        level: 'fundamental',
        field: 'geral',
        finalGrade: 8.0,
        completedDate: { day: 15, month: 12, year: startDate.year - 7 }
      },
      {
        id: 'deg_init_medio',
        institutionId: medFound.institution.id,
        institutionName: medFound.institution.name,
        institutionType: medFound.institution.type,
        courseId: medFound.course.id,
        courseTitle: medFound.course.title,
        level: 'medio',
        field: 'geral',
        finalGrade: 8.0,
        completedDate: { day: 15, month: 12, year: startDate.year - 3 }
      }
    ],
    entranceExamScore: 8.0
  };
}

export function migrateEducationState(char: Character): CharacterEducationState {
  if (char.education && Array.isArray(char.education.completedDegrees)) {
    return {
      currentEnrollment: char.education.currentEnrollment,
      completedDegrees: char.education.completedDegrees,
      entranceExamScore:
        typeof char.education.entranceExamScore === 'number'
          ? char.education.entranceExamScore
          : char.schoolGrade || 7.5
    };
  }
  const initial = createInitialEducationState(
    char.age,
    char.difficulty || 'normal',
    char.careerStartDate || char.currentDate
  );
  if (char.age < 18 && initial.currentEnrollment) {
    initial.currentEnrollment.currentGrade = char.schoolGrade ?? 8.5;
    initial.currentEnrollment.shift = char.schoolShift || 'manha';
    if (!char.isStudying) {
      initial.currentEnrollment = undefined;
    }
  }
  initial.entranceExamScore = char.schoolGrade ?? initial.entranceExamScore;
  return initial;
}

export function hasCompletedEducation(
  char: Character,
  level: EducationLevel,
  field?: EducationField
): boolean {
  const completed = char.education?.completedDegrees || [];
  if (level === 'fundamental') {
    return completed.some(
      (d) => d.level === 'fundamental' || d.level === 'medio' || d.level === 'tecnico' || d.level === 'superior'
    );
  }
  if (level === 'medio') {
    return completed.some((d) => d.level === 'medio' || d.level === 'superior');
  }
  if (level === 'tecnico') {
    return completed.some(
      (d) =>
        (d.level === 'tecnico' || d.level === 'superior') &&
        (!field || field === 'geral' || d.field === field)
    );
  }
  return completed.some(
    (d) => d.level === 'superior' && (!field || field === 'geral' || d.field === field)
  );
}

export function hasExactCourseDegree(
  char: Character,
  level: EducationLevel,
  field: EducationField
): boolean {
  const completed = char.education?.completedDegrees || [];
  return completed.some((d) => d.level === level && d.field === field);
}

export function getEducationRequirementLabel(
  level?: EducationLevel,
  field?: EducationField
): string {
  if (!level) return 'Sem exigência escolar';
  const lvlLabel = EDUCATION_LEVEL_META[level]?.label || level;
  if (!field || field === 'geral') {
    return `${lvlLabel} Completo`;
  }
  const fldLabel = EDUCATION_FIELD_META[field]?.label || field;
  return `${lvlLabel}: ${fldLabel}`;
}

export function getCourseWeeklyDaysAndPoints(
  level: EducationLevel,
  daysPattern?: 'seg_sex' | 'seg_qua_sex'
): { days: DayOfWeek[]; pointsPerSession: number } {
  if (daysPattern === 'seg_sex' || level === 'fundamental' || level === 'medio') {
    return {
      days: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
      pointsPerSession: 3
    };
  }
  return {
    days: ['segunda', 'quarta', 'sexta'],
    pointsPerSession: 2
  };
}

export function validateEducationScheduleConflict(
  char: Character,
  level: EducationLevel,
  shift: EducationShift,
  daysPattern: 'seg_sex' | 'seg_qua_sex'
): { valid: boolean; reason?: string } {
  // Simula atividades sem a matrícula educacional atual (caso esteja trocando de curso/instituição)
  const charWithoutCurrentEdu: Character = {
    ...char,
    isStudying: false,
    education: char.education
      ? { ...char.education, currentEnrollment: undefined }
      : undefined
  };

  const activities = getCharacterWeeklyActivities(charWithoutCurrentEdu);
  const { days, pointsPerSession } = getCourseWeeklyDaysAndPoints(level, daysPattern);

  for (const day of days) {
    const cap = calculateBlockCapacity(day, shift as DailyBlockType, activities);
    if (cap.usedPoints + pointsPerSession > POINTS_PER_BLOCK) {
      const conflictAct = cap.activities[0];
      return {
        valid: false,
        reason: `Conflito de agenda na ${day} (${shift}): bloco possui ${cap.usedPoints}/${POINTS_PER_BLOCK} pts ocupados${
          conflictAct ? ` (${conflictAct.title})` : ''
        } e o curso requer ${pointsPerSession} pts. Escolha outro turno ou ajuste sua rotina.`
      };
    }
  }

  return { valid: true };
}

export function canEnrollInCourse(
  char: Character,
  institutionId: string,
  courseId: string,
  preferredShift?: EducationShift
): { canEnroll: boolean; reason?: string; selectedShift: EducationShift } {
  const found = findEducationCourse(institutionId, courseId);
  if (!found) {
    return { canEnroll: false, reason: 'Curso ou instituição não encontrada.', selectedShift: 'manha' };
  }

  const { institution, course } = found;
  const shift: EducationShift =
    preferredShift && course.allowedShifts.includes(preferredShift)
      ? preferredShift
      : course.allowedShifts[0];

  const current = char.education?.currentEnrollment;
  if (current && current.courseId === course.id && current.shift === shift) {
    return { canEnroll: false, reason: 'Você já está matriculado neste curso e turno.', selectedShift: shift };
  }

  if (hasExactCourseDegree(char, course.level, course.field)) {
    return {
      canEnroll: false,
      reason: `Você já possui formação concluída em ${course.title}.`,
      selectedShift: shift
    };
  }

  if (char.age < course.minAge) {
    return {
      canEnroll: false,
      reason: `Idade mínima exigida: ${course.minAge} anos (atual: ${char.age}).`,
      selectedShift: shift
    };
  }

  if (course.prerequisiteLevel && !hasCompletedEducation(char, course.prerequisiteLevel)) {
    const reqLabel = EDUCATION_LEVEL_META[course.prerequisiteLevel].label;
    return {
      canEnroll: false,
      reason: `Pré-requisito obrigatório: concluir o ${reqLabel}.`,
      selectedShift: shift
    };
  }

  const entranceGrade = Math.max(
    char.schoolGrade ?? 0,
    char.education?.entranceExamScore ?? 0,
    current?.currentGrade ?? 0
  );
  if (course.minEntranceGrade > 0 && entranceGrade < course.minEntranceGrade) {
    return {
      canEnroll: false,
      reason: `Nota de seleção / vestibular insuficiente (${entranceGrade.toFixed(1)}/${course.minEntranceGrade.toFixed(1)}). Estude para elevar sua nota!`,
      selectedShift: shift
    };
  }

  const scheduleCheck = validateEducationScheduleConflict(
    char,
    course.level,
    shift,
    course.daysPattern
  );
  if (!scheduleCheck.valid) {
    return {
      canEnroll: false,
      reason: scheduleCheck.reason,
      selectedShift: shift
    };
  }

  return { canEnroll: true, selectedShift: shift };
}

export function enrollInEducationCourse(
  char: Character,
  institutionId: string,
  courseId: string,
  preferredShift?: EducationShift
): { updatedChar: Character; success: boolean; message: string } {
  const check = canEnrollInCourse(char, institutionId, courseId, preferredShift);
  if (!check.canEnroll) {
    return {
      updatedChar: char,
      success: false,
      message: check.reason || 'Não foi possível realizar a matrícula.'
    };
  }

  const found = findEducationCourse(institutionId, courseId)!;
  const { institution, course } = found;
  const updated = JSON.parse(JSON.stringify(char)) as Character;
  if (!updated.education) {
    updated.education = migrateEducationState(updated);
  }

  const previous = updated.education.currentEnrollment;
  const preserveMonths =
    previous && previous.level === course.level && previous.field === course.field
      ? previous.monthsCompleted
      : 0;

  const regionalFee = calculateRegionalEducationFee(updated, course.monthlyFee, institution.type);

  updated.education.currentEnrollment = {
    institutionId: institution.id,
    institutionName: institution.name,
    institutionType: institution.type,
    courseId: course.id,
    courseTitle: course.title,
    level: course.level,
    field: course.field,
    shift: check.selectedShift,
    monthsCompleted: preserveMonths,
    durationMonths: course.durationMonths,
    monthlyFee: regionalFee,
    currentGrade: Math.max(6.5, updated.schoolGrade || 7.5),
    startedDate: { ...updated.currentDate }
  };

  updated.isStudying = true;
  updated.schoolShift = check.selectedShift;
  updated.schoolGrade = updated.education.currentEnrollment.currentGrade;

  return {
    updatedChar: updated,
    success: true,
    message: `🎓 Matrícula confirmada em "${course.title}" (${institution.shortName}, ${
      institution.type === 'publica' ? 'Pública Gratuita' : `Particular R$ ${regionalFee.toLocaleString('pt-BR')}/mês`
    }) no turno da ${check.selectedShift}!`
  };
}

export function dropEducationEnrollment(char: Character): {
  updatedChar: Character;
  success: boolean;
  message: string;
} {
  if (!char.education?.currentEnrollment) {
    return { updatedChar: char, success: false, message: 'Você não possui matrícula acadêmica ativa.' };
  }
  if (char.age < 18) {
    return {
      updatedChar: char,
      success: false,
      message:
        'Menores de 18 anos devem permanecer matriculados no ensino regular. Você pode transferir entre instituição Pública ou Particular.'
    };
  }

  const updated = JSON.parse(JSON.stringify(char)) as Character;
  const title = updated.education!.currentEnrollment!.courseTitle;
  updated.education!.currentEnrollment = undefined;
  updated.isStudying = false;
  return {
    updatedChar: updated,
    success: true,
    message: `Matrícula trancada/encerrada em "${title}". Os horários foram liberados na agenda semanal.`
  };
}

export function takeEntranceExamPrep(char: Character): {
  updatedChar: Character;
  success: boolean;
  message: string;
} {
  if (char.energy < 15) {
    return {
      updatedChar: char,
      success: false,
      message: '⚠️ Energia insuficiente (-15 necessária) para estudar hoje.'
    };
  }

  const updated = JSON.parse(JSON.stringify(char)) as Character;
  if (!updated.education) {
    updated.education = migrateEducationState(updated);
  }

  updated.energy = Math.max(0, updated.energy - 15);
  const nextGrade = Math.min(10, Math.round(((updated.schoolGrade || 7.0) + 0.6) * 10) / 10);
  updated.schoolGrade = nextGrade;
  updated.education.entranceExamScore = Math.min(
    10,
    Math.round((Math.max(updated.education.entranceExamScore || 0, nextGrade - 0.6) + 0.6) * 10) / 10
  );

  if (updated.education.currentEnrollment) {
    updated.education.currentEnrollment.currentGrade = Math.min(
      10,
      Math.round((updated.education.currentEnrollment.currentGrade + 0.6) * 10) / 10
    );
  }

  if (updated.age < 18) {
    updated.familySupport = Math.min(100, updated.familySupport + 5);
  }

  return {
    updatedChar: updated,
    success: true,
    message: `📚 Estudo & Simulado concluído! Média / Nota de Vestibular subiu para ${Math.max(
      updated.schoolGrade,
      updated.education.entranceExamScore
    ).toFixed(1)}/10.`
  };
}

export function calculateEducationTuition(
  char: Character,
  enrollment: ActiveEducationEnrollment
): {
  monthlyFee: number;
  athletePays: number;
  familyCovers: number;
  paidByFamily: boolean;
} {
  const catalogFound = findEducationCourse(enrollment.institutionId, enrollment.courseId);
  const baseCatalogFee = catalogFound?.course.monthlyFee ?? enrollment.monthlyFee ?? 0;
  const fee = calculateRegionalEducationFee(char, baseCatalogFee, enrollment.institutionType);
  if (fee <= 0) {
    return { monthlyFee: 0, athletePays: 0, familyCovers: 0, paidByFamily: false };
  }

  if (char.age < 18) {
    const famTier =
      char.familyWealthTier || getDifficultyProfile(char.difficulty).familyWealthTier;
    if ((famTier === 'milionario' || famTier === 'abastado') && char.familySupport >= 45) {
      return { monthlyFee: fee, athletePays: 0, familyCovers: fee, paidByFamily: true };
    }
    if (famTier === 'classe_media' && char.familySupport >= 65) {
      const covered = Math.round(fee * 0.5);
      return {
        monthlyFee: fee,
        athletePays: fee - covered,
        familyCovers: covered,
        paidByFamily: false
      };
    }
  }

  return { monthlyFee: fee, athletePays: fee, familyCovers: 0, paidByFamily: false };
}

export function processMonthlyEducation(char: Character): {
  updatedChar: Character;
  logs: string[];
  graduatedDegree?: CompletedEducation;
} {
  const updated = JSON.parse(JSON.stringify(char)) as Character;
  if (!updated.education) {
    updated.education = migrateEducationState(updated);
  }

  const logs: string[] = [];
  const enrollment = updated.education.currentEnrollment;

  if (!enrollment) {
    // Menor sem matrícula perde nota e gera preocupação familiar
    if (updated.age < 18 && !updated.isStudying) {
      updated.schoolGrade = Math.max(1, Math.round((updated.schoolGrade - 0.5) * 10) / 10);
      if (updated.schoolGrade < 6.0) {
        updated.stress = Math.min(100, updated.stress + 12);
        logs.push(
          `⚠️ Boletim Mensal: Média vermelha (${updated.schoolGrade.toFixed(1)}). Seus pais estão preocupados com os treinos!`
        );
      }
    }
    return { updatedChar: updated, logs };
  }

  const found = findEducationCourse(enrollment.institutionId, enrollment.courseId);
  const course = found?.course;

  // 1. Mensalidade (se particular)
  const tuition = calculateEducationTuition(updated, enrollment);
  if (tuition.monthlyFee > 0) {
    if (tuition.paidByFamily) {
      logs.push(
        `🏫 Mensalidade Escolar (${enrollment.institutionName}): Pais custearam integralmente R$ ${tuition.familyCovers.toLocaleString('pt-BR')}.`
      );
    } else if (tuition.athletePays > 0) {
      if (updated.money >= tuition.athletePays) {
        updated.money -= tuition.athletePays;
        logs.push(
          `🏫 Mensalidade Acadêmica (${enrollment.courseTitle}): -R$ ${tuition.athletePays.toLocaleString('pt-BR')}${
            tuition.familyCovers > 0 ? ` (Família ajudou com R$ ${tuition.familyCovers})` : ''
          }.`
        );
      } else {
        updated.stress = Math.min(100, updated.stress + 8);
        logs.push(
          `⚠️ Mensalidade atrasada em ${enrollment.institutionName} (R$ ${tuition.athletePays.toLocaleString('pt-BR')}). Considere trabalhar ou transferir para uma instituição pública gratuita!`
        );
        // Progride mais devagar se inadimplente em particular, sem bloquear permanentemente
        enrollment.currentGrade = Math.max(5.0, Math.round((enrollment.currentGrade - 0.2) * 10) / 10);
        updated.schoolGrade = enrollment.currentGrade;
        return { updatedChar: updated, logs };
      }
    }
  }

  // 2. Progresso de meses e nota acadêmica
  const gradeGain = course?.gradeBonusPerMonth ?? 0.25;
  enrollment.monthsCompleted += 1;
  enrollment.currentGrade = Math.min(10, Math.round((enrollment.currentGrade + gradeGain) * 10) / 10);
  updated.schoolGrade = enrollment.currentGrade;
  updated.education.entranceExamScore = Math.max(
    updated.education.entranceExamScore || 0,
    enrollment.currentGrade
  );

  const minGradAge = course?.minGraduationAge ?? course?.minAge ?? 0;
  const readyByDuration = enrollment.monthsCompleted >= enrollment.durationMonths;
  const readyByAge = updated.age >= minGradAge;
  const readyByGrade = enrollment.currentGrade >= 6.0;

  if (readyByDuration && readyByAge && readyByGrade) {
    const diploma: CompletedEducation = {
      id: `deg_${enrollment.courseId}_${updated.currentYear}_${updated.currentMonth}`,
      institutionId: enrollment.institutionId,
      institutionName: enrollment.institutionName,
      institutionType: enrollment.institutionType,
      courseId: enrollment.courseId,
      courseTitle: enrollment.courseTitle,
      level: enrollment.level,
      field: enrollment.field,
      finalGrade: enrollment.currentGrade,
      completedDate: { ...updated.currentDate }
    };

    updated.education.completedDegrees.push(diploma);
    updated.education.currentEnrollment = undefined;
    updated.isStudying = false;

    // Bônus acadêmicos de formatura
    if (enrollment.level === 'fundamental' && enrollment.institutionType === 'particular') {
      updated.attributes.mentalFocus = Math.min(99, updated.attributes.mentalFocus + 2);
    } else if (enrollment.level === 'medio') {
      updated.attributes.fightIq = Math.min(99, updated.attributes.fightIq + (enrollment.institutionType === 'particular' ? 3 : 2));
    } else if (enrollment.level === 'tecnico') {
      updated.attributes.fightIq = Math.min(99, updated.attributes.fightIq + 2);
      if (enrollment.field === 'educacao_fisica') {
        updated.attributes.stamina = Math.min(99, updated.attributes.stamina + 2);
      }
    } else if (enrollment.level === 'superior') {
      updated.attributes.mentalFocus = Math.min(99, updated.attributes.mentalFocus + 3);
      updated.attributes.fightIq = Math.min(99, updated.attributes.fightIq + 3);
      updated.honor = Math.min(100, updated.honor + 10);
      if (enrollment.field === 'educacao_fisica') {
        updated.attributes.technique = Math.min(99, updated.attributes.technique + 2);
        updated.attributes.stamina = Math.min(99, updated.attributes.stamina + 2);
      } else if (enrollment.field === 'fisioterapia') {
        updated.attributes.durability = Math.min(99, updated.attributes.durability + 3);
      } else if (enrollment.field === 'nutricao') {
        updated.attributes.stamina = Math.min(99, updated.attributes.stamina + 3);
      }
    }

    logs.push(
      `🎓 FORMAÇÃO CONCLUÍDA! Você se formou em "${diploma.courseTitle}" (${diploma.institutionName}, média ${diploma.finalGrade.toFixed(1)})! Novas profissões foram desbloqueadas!`
    );

    // Transição natural de menor (< 18) que acaba o Fundamental -> inicia Ensino Médio automaticamente na rede correspondente
    if (updated.age < 18 && diploma.level === 'fundamental') {
      const nextIsPriv =
        diploma.institutionType === 'particular' &&
        (updated.familyWealthTier === 'abastado' || updated.familyWealthTier === 'milionario');
      const nextInstId = nextIsPriv ? 'inst_priv_medio' : 'inst_pub_medio';
      const nextCourseId = nextIsPriv ? 'curso_priv_medio' : 'curso_pub_medio';
      const nextFound = findEducationCourse(nextInstId, nextCourseId);
      if (nextFound) {
        updated.education.currentEnrollment = {
          institutionId: nextFound.institution.id,
          institutionName: nextFound.institution.name,
          institutionType: nextFound.institution.type,
          courseId: nextFound.course.id,
          courseTitle: nextFound.course.title,
          level: 'medio',
          field: 'geral',
          shift: enrollment.shift === 'noite' ? 'manha' : enrollment.shift,
          monthsCompleted: 0,
          durationMonths: nextFound.course.durationMonths,
          monthlyFee: nextFound.course.monthlyFee,
          currentGrade: Math.max(7.5, enrollment.currentGrade - 0.5),
          startedDate: { ...updated.currentDate }
        };
        updated.isStudying = true;
        logs.push(
          `📘 Matrícula automática no Ensino Médio: ${nextFound.institution.shortName} (${nextFound.institution.type === 'publica' ? 'Pública' : 'Particular'}). Você pode alterar sua instituição a qualquer momento!`
        );
      }
    }

    return { updatedChar: updated, logs, graduatedDegree: diploma };
  }

  logs.push(
    `📚 Estudos (${enrollment.courseTitle}): ${Math.min(enrollment.monthsCompleted, enrollment.durationMonths)}/${enrollment.durationMonths} meses · Média ${enrollment.currentGrade.toFixed(1)}/10.`
  );
  return { updatedChar: updated, logs };
}

export function validateJobEligibility(
  char: Character,
  jobId: JobType
): {
  eligible: boolean;
  job?: JobDefinition;
  missingRequirements: string[];
  reason?: string;
} {
  const job = AVAILABLE_JOBS.find((j) => j.id === jobId);
  if (!job) {
    return {
      eligible: false,
      missingRequirements: ['Profissão não encontrada'],
      reason: 'Profissão não encontrada.'
    };
  }

  const missing: string[] = [];

  if (char.age < job.minAge) {
    missing.push(`Idade mínima ${job.minAge} anos (atual: ${char.age})`);
  }

  if (job.requiredEducationLevel) {
    if (!hasCompletedEducation(char, job.requiredEducationLevel, job.requiredEducationField)) {
      missing.push(
        `Formação: ${getEducationRequirementLabel(
          job.requiredEducationLevel,
          job.requiredEducationField
        )}`
      );
    }
  }

  if (job.minRank !== undefined) {
    const primaryRank = char.artGraduations?.[char.primaryArt]?.rankIndex ?? 0;
    const maxRank = Math.max(
      primaryRank,
      ...Object.values(char.artGraduations || {}).map((g) => g?.rankIndex ?? 0)
    );
    if (maxRank < job.minRank) {
      missing.push(`Graduação mínima nível ${job.minRank} em uma arte marcial`);
    }
  }

  if (job.minStrength !== undefined && (char.attributes?.strength ?? 0) < job.minStrength) {
    missing.push(`Força física mínima ${job.minStrength} (atual: ${Math.round(char.attributes?.strength ?? 0)})`);
  }

  if (job.minFame !== undefined && (char.fame ?? 0) < job.minFame) {
    missing.push(`Fama mínima ${job.minFame} (atual: ${Math.round(char.fame ?? 0)})`);
  }

  return {
    eligible: missing.length === 0,
    job,
    missingRequirements: missing,
    reason: missing.length > 0 ? `Requisitos pendentes: ${missing.join(' • ')}` : undefined
  };
}

export function selectCharacterJob(
  char: Character,
  jobId: JobType
): { updatedChar: Character; success: boolean; message: string } {
  const check = validateJobEligibility(char, jobId);
  if (!check.eligible || !check.job) {
    return {
      updatedChar: char,
      success: false,
      message: check.reason || 'Requisitos não atendidos para esta profissão.'
    };
  }

  const updated = JSON.parse(JSON.stringify(char)) as Character;
  updated.job = jobId;
  if (check.job.defaultShift) {
    updated.jobShift = check.job.defaultShift;
  }

  const regionalMonthlyPay = calculateRegionalJobMonthlyPay(updated, check.job);

  return {
    updatedChar: updated,
    success: true,
    message:
      jobId === 'desempregado'
        ? '💼 Você optou por dedicação exclusiva (sem vínculo empregatício).'
        : `💼 Contratado como ${check.job.title} (R$ ${regionalMonthlyPay.toLocaleString('pt-BR')}/mês)!`
  };
}
