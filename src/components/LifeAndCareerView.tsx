import React, { useState } from 'react';
import { Character, EducationLevel, EducationShift, InstitutionType, JobType } from '../types/game';
import { AVAILABLE_JOBS, DIET_OPTIONS, LEISURE_ACTIVITIES } from '../data/lifeEventsData';
import {
  EDUCATION_FIELD_META,
  EDUCATION_INSTITUTIONS,
  EDUCATION_LEVEL_META
} from '../data/educationData';
import {
  canEnrollInCourse,
  calculateEducationTuition,
  dropEducationEnrollment,
  enrollInEducationCourse,
  getEducationRequirementLabel,
  hasExactCourseDegree,
  selectCharacterJob,
  takeEntranceExamPrep,
  validateJobEligibility
} from '../utils/educationHelper';
import { MARTIAL_ARTS_META } from '../data/martialArtsData';
import { SocialLifePanel } from './SocialLifePanel';
import { calculateLivingExpenses, evaluateMonthlySponsorship } from '../utils/characterHelper';
import { calculateGymMonthlyExpenses } from '../utils/recoveryHelper';
import {
  calculateMonthlyEquipmentCost,
  calculateRegionalDietCost,
  calculateRegionalEducationFee,
  calculateRegionalJobMonthlyPay,
  calculateRegionalLeisureCost,
  resolveActiveEconomicContext
} from '../utils/regionalEconomyHelper';
import { getEligibleHeirs, inheritLegacyCharacter } from '../utils/dynastyHelper';
import { getDifficultyForWealthTier, getDifficultyProfile } from '../utils/talentAndDifficultyHelper';
import { sounds } from '../utils/audio';
import { 
  GraduationCap, 
  Briefcase, 
  Apple, 
  Smile, 
  Users, 
  Check,
  Heart,
  Crown,
  Handshake,
  BookOpen,
  Building2,
  Lock,
  Award,
  Clock
} from 'lucide-react';

interface Props {
  character: Character;
  onUpdateCharacter: (updated: Character) => void;
}

export const LifeAndCareerView: React.FC<Props> = ({
  character,
  onUpdateCharacter
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'social_familia' | 'rotina'>('social_familia');
  const [eduLevelFilter, setEduLevelFilter] = useState<'todos' | EducationLevel>('todos');
  const [eduTypeFilter, setEduTypeFilter] = useState<'todas' | InstitutionType>('todas');
  const [selectedEduShift, setSelectedEduShift] = useState<EducationShift>('noite');
  const [jobTierFilter, setJobTierFilter] = useState<'todos' | 'base' | 'tecnico' | 'superior'>('todos');

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleStudy = () => {
    const res = takeEntranceExamPrep(character);
    if (!res.success) {
      showFeedback(res.message);
      return;
    }
    sounds.playWhoosh();
    showFeedback(res.message);
    onUpdateCharacter(res.updatedChar);
  };

  const handleEnrollEducation = (institutionId: string, courseId: string) => {
    const res = enrollInEducationCourse(character, institutionId, courseId, selectedEduShift);
    if (res.success) {
      sounds.playGraduation();
      onUpdateCharacter(res.updatedChar);
    } else {
      sounds.playWhoosh();
    }
    showFeedback(res.message);
  };

  const handleDropEducation = () => {
    const res = dropEducationEnrollment(character);
    if (res.success) {
      sounds.playPunch(false);
      onUpdateCharacter(res.updatedChar);
    }
    showFeedback(res.message);
  };

  const handleChangeJob = (jobId: JobType) => {
    const res = selectCharacterJob(character, jobId);
    if (!res.success) {
      sounds.playWhoosh();
      showFeedback(`⚠️ ${res.message}`);
      return;
    }
    sounds.playPunch(false);
    showFeedback(res.message);
    onUpdateCharacter(res.updatedChar);
  };

  const handleChangeDiet = (dietId: typeof character.dietPlan) => {
    const updated = JSON.parse(JSON.stringify(character)) as Character;
    updated.dietPlan = dietId;
    sounds.playPunch(false);
    showFeedback(`🥗 Plano nutricional atualizado para: ${DIET_OPTIONS.find(d => d.id === dietId)?.name}!`);
    onUpdateCharacter(updated);
  };

  const handleLeisure = (activity: typeof LEISURE_ACTIVITIES[0]) => {
    const regionalCost = calculateRegionalLeisureCost(character, activity.cost);
    if (character.money < regionalCost) {
      showFeedback(`⚠️ Dinheiro insuficiente para este lazer (R$ ${regionalCost.toLocaleString('pt-BR')}).`);
      return;
    }
    if (character.energy < activity.energyCost) {
      showFeedback('⚠️ Pouca energia para sair agora.');
      return;
    }

    const updated = JSON.parse(JSON.stringify(character)) as Character;
    updated.money -= regionalCost;
    updated.energy -= activity.energyCost;
    updated.mentalHealth = Math.min(100, updated.mentalHealth + activity.mentalHealthGain);
    updated.stress = Math.max(0, updated.stress - activity.stressReduction);
    if (activity.familyBonus) {
      updated.familySupport = Math.min(100, updated.familySupport + activity.familyBonus);
    }
    if (activity.fightIqGain) {
      updated.attributes.fightIq += activity.fightIqGain;
    }

    sounds.playCheer();
    showFeedback(`✨ ${activity.name} aproveitado! Mente renovada (+${activity.mentalHealthGain} Foco) e estresse reduzido.`);
    onUpdateCharacter(updated);
  };

  const activeEnrollment = character.education?.currentEnrollment;
  const completedDegrees = character.education?.completedDegrees || [];
  const effectiveEntranceGrade = Math.max(
    character.schoolGrade ?? 0,
    character.education?.entranceExamScore ?? 0,
    activeEnrollment?.currentGrade ?? 0
  );

  const filteredInstitutions = EDUCATION_INSTITUTIONS.filter((inst) => {
    if (eduLevelFilter !== 'todos' && inst.level !== eduLevelFilter) return false;
    if (eduTypeFilter !== 'todas' && inst.type !== eduTypeFilter) return false;
    return true;
  });

  const filteredJobs = AVAILABLE_JOBS.filter((j) => {
    if (jobTierFilter === 'base') {
      return !j.requiredEducationLevel || j.requiredEducationLevel === 'fundamental' || j.requiredEducationLevel === 'medio';
    }
    if (jobTierFilter === 'tecnico') {
      return j.requiredEducationLevel === 'tecnico';
    }
    if (jobTierFilter === 'superior') {
      return j.requiredEducationLevel === 'superior';
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase tracking-widest text-purple-400 font-bold">Rotina Além do Tatame</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">Vida Pessoal, Educação & Carreiras</h1>
          <p className="text-xs md:text-sm text-neutral-400 mt-1 max-w-2xl">
            Curse ensino Fundamental, Médio, Técnico ou Superior em instituições públicas e particulares para desbloquear profissões de alto salário enquanto busca o topo nos tatames.
          </p>
        </div>

        {/* Meters status */}
        <div className="w-full md:w-auto grid grid-cols-3 gap-3 bg-neutral-950 p-3.5 sm:p-4 rounded-xl border border-neutral-800 text-center shrink-0 tabular-nums">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Família</span>
            <span className="text-lg font-black text-pink-400">{character.familySupport}%</span>
          </div>
          <div className="border-l border-neutral-800 pl-3">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Mental</span>
            <span className="text-lg font-black text-purple-400">{character.mentalHealth}%</span>
          </div>
          <div className="border-l border-neutral-800 pl-3">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Estresse</span>
            <span className="text-lg font-black text-red-400">{character.stress}%</span>
          </div>
        </div>
      </div>

      {/* Sub-navigation Switch */}
      <div className="grid grid-cols-2 sm:flex gap-1.5 bg-neutral-900 p-1.5 rounded-xl border border-neutral-800 w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setSubTab('social_familia')}
          className={`min-h-[42px] px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            subTab === 'social_familia'
              ? 'bg-amber-500 text-neutral-950 font-black'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Heart className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Família & Social</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('rotina')}
          className={`min-h-[42px] px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            subTab === 'rotina'
              ? 'bg-amber-500 text-neutral-950 font-black'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Ensino & Carreira</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-center text-sm font-bold text-amber-300 animate-fadeIn">
          {feedback}
        </div>
      )}

      {subTab === 'social_familia' ? (
        <SocialLifePanel
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onNotify={showFeedback}
        />
      ) : (
        <>
      {/* 1. Instituições de Ensino Públicas & Particulares + Formações */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">
                Sistema Educacional • Rede Pública & Particular
              </span>
              <h2 className="text-lg font-black text-white">Instituições de Ensino & Formações</h2>
              <p className="text-xs text-neutral-400">
                Nota / Vestibular atual:{' '}
                <strong className={effectiveEntranceGrade >= 7.5 ? 'text-emerald-400' : effectiveEntranceGrade >= 6 ? 'text-amber-400' : 'text-red-400'}>
                  {effectiveEntranceGrade.toFixed(1)} / 10
                </strong>
                {character.age < 18 && ' · Média < 6.0 pode impedir exames de graduação marcial!'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStudy}
            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-neutral-700 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            Estudar / Simulado (-15 Energia)
          </button>
        </div>

        {/* Matrícula Ativa + Diplomas Concluídos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Curso Atual */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-black tracking-wider text-cyan-400">
                Matrícula Acadêmica Atual
              </span>
              {activeEnrollment && (
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${EDUCATION_LEVEL_META[activeEnrollment.level].badgeClass}`}>
                  {activeEnrollment.institutionType === 'publica' ? '🏛️ Pública' : '🏫 Particular'} · {EDUCATION_LEVEL_META[activeEnrollment.level].shortLabel}
                </span>
              )}
            </div>

            {activeEnrollment ? (
              <>
                {(() => {
                  const tuitionInfo = calculateEducationTuition(character, activeEnrollment);
                  return (
                    <div>
                      <div className="text-sm font-black text-white">{activeEnrollment.courseTitle}</div>
                      <div className="text-xs text-neutral-400">
                        {activeEnrollment.institutionName} · Turno:{' '}
                        <strong className="text-amber-400 capitalize">{activeEnrollment.shift}</strong> ·{' '}
                        {tuitionInfo.monthlyFee === 0
                          ? 'Gratuita (R$ 0/mês)'
                          : `R$ ${tuitionInfo.monthlyFee.toLocaleString('pt-BR')}/mês`}
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Progresso do Curso</span>
                    <span className="font-bold text-white">
                      {activeEnrollment.monthsCompleted} / {activeEnrollment.durationMonths} meses (Média {activeEnrollment.currentGrade.toFixed(1)})
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((activeEnrollment.monthsCompleted / activeEnrollment.durationMonths) * 100))}%`
                      }}
                    />
                  </div>
                </div>

                {character.age >= 18 && (
                  <button
                    type="button"
                    onClick={handleDropEducation}
                    className="text-[11px] text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                  >
                    Trancar / Encerrar Matrícula Atual
                  </button>
                )}
              </>
            ) : (
              <div className="text-xs text-neutral-400 py-2">
                Nenhuma formação em andamento. Escolha abaixo uma instituição pública gratuita ou particular para iniciar um curso técnico ou graduação superior!
              </div>
            )}
          </div>

          {/* Diplomas Concluídos */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-black tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Diplomas & Formações Concluídas ({completedDegrees.length})
              </span>
            </div>

            {completedDegrees.length === 0 ? (
              <div className="text-xs text-neutral-500 py-2">
                Nenhum diploma conquistado ainda. Conclua seus estudos para liberar carreiras qualificadas.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {completedDegrees.map((deg) => (
                  <div
                    key={deg.id}
                    className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-[11px]"
                  >
                    <div className="font-bold text-white flex items-center gap-1">
                      <span>{EDUCATION_FIELD_META[deg.field]?.icon || '🎓'}</span>
                      <span>{deg.courseTitle}</span>
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {deg.institutionName} ({deg.institutionType === 'publica' ? 'Pública' : 'Particular'}) · Média {deg.finalGrade.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filtros de Instituições & Seleção de Turno */}
        <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-neutral-500">Nível:</span>
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'fundamental', label: 'Fundamental' },
                { id: 'medio', label: 'Médio' },
                { id: 'tecnico', label: 'Técnico' },
                { id: 'superior', label: 'Superior' }
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setEduLevelFilter(opt.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  eduLevelFilter === opt.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-500">Rede:</span>
            {(
              [
                { id: 'todas', label: 'Todas' },
                { id: 'publica', label: 'Pública (Grátis)' },
                { id: 'particular', label: 'Particular' }
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setEduTypeFilter(opt.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  eduTypeFilter === opt.id
                    ? 'bg-emerald-500 text-neutral-950'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] uppercase font-bold text-neutral-500">Turno desejado:</span>
            {(['manha', 'tarde', 'noite'] as const).map((shift) => (
              <button
                key={shift}
                type="button"
                onClick={() => setSelectedEduShift(shift)}
                className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-colors cursor-pointer ${
                  selectedEduShift === shift
                    ? 'bg-amber-500 text-neutral-950'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {shift}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Instituições e Cursos */}
        <div className="space-y-4">
          {filteredInstitutions.map((inst) => (
            <div key={inst.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Building2 className={`w-4 h-4 ${inst.type === 'publica' ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <h3 className="text-sm font-black text-white">{inst.name}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        inst.type === 'publica'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {inst.badge}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${EDUCATION_LEVEL_META[inst.level].badgeClass}`}>
                      {EDUCATION_LEVEL_META[inst.level].label}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">{inst.description}</p>
                </div>
                <span className="text-[10px] font-bold text-cyan-300 shrink-0">{inst.prestigeLabel}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {inst.courses.map((course) => {
                  const alreadyGraduated = hasExactCourseDegree(character, course.level, course.field);
                  const isCurrent = activeEnrollment?.courseId === course.id;
                  const preferredShift = course.allowedShifts.includes(selectedEduShift)
                    ? selectedEduShift
                    : course.allowedShifts[0];
                  const eligibility = canEnrollInCourse(character, inst.id, course.id, preferredShift);

                  return (
                    <div
                      key={course.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                        alreadyGraduated
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : isCurrent
                          ? 'bg-blue-950/25 border-blue-500/50'
                          : 'bg-neutral-900/70 border-neutral-800'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-white leading-snug">
                            {EDUCATION_FIELD_META[course.field]?.icon} {course.title}
                          </span>
                          {alreadyGraduated && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">{course.desc}</p>
                        <div className="text-[10px] text-cyan-300 font-medium">{course.graduationBonusDesc}</div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-neutral-800/80 space-y-2">
                        <div className="flex flex-wrap justify-between gap-1 text-[10px]">
                          {(() => {
                            const regionalCourseFee = calculateRegionalEducationFee(
                              character,
                              course.monthlyFee,
                              inst.type
                            );
                            return (
                              <span className={regionalCourseFee === 0 ? 'text-emerald-400 font-black' : 'text-amber-400 font-bold'}>
                                {regionalCourseFee === 0
                                  ? 'Gratuito (R$ 0/mês)'
                                  : `R$ ${regionalCourseFee.toLocaleString('pt-BR')}/mês`}
                              </span>
                            );
                          })()}
                          <span className="text-neutral-400">
                            {course.durationMonths}m · {course.pointsPerSession} pts ({course.daysPattern === 'seg_sex' ? 'Seg–Sex' : 'Seg/Qua/Sex'})
                          </span>
                        </div>
                        <div className="flex flex-wrap justify-between gap-1 text-[10px] text-neutral-500">
                          <span>Turnos: {course.allowedShifts.join('/')}</span>
                          {course.minEntranceGrade > 0 && (
                            <span>Nota mín: {course.minEntranceGrade.toFixed(1)}</span>
                          )}
                        </div>

                        {alreadyGraduated ? (
                          <div className="py-1.5 text-center text-[11px] font-bold text-emerald-400 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                            Formação Concluída
                          </div>
                        ) : isCurrent ? (
                          <div className="py-1.5 text-center text-[11px] font-bold text-blue-300 bg-blue-500/15 rounded-lg border border-blue-500/30">
                            Cursando ({activeEnrollment.shift})
                          </div>
                        ) : (
                          <>
                            {!eligibility.canEnroll && (
                              <div className="text-[10px] text-red-400 leading-snug flex items-start gap-1">
                                <Lock className="w-3 h-3 shrink-0 mt-0.5" />
                                <span>{eligibility.reason}</span>
                              </div>
                            )}
                            <button
                              type="button"
                              disabled={!eligibility.canEnroll}
                              onClick={() => handleEnrollEducation(inst.id, course.id)}
                              className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                                eligibility.canEnroll
                                  ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                                  : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                              }`}
                            >
                              {eligibility.canEnroll
                                ? activeEnrollment
                                  ? `Transferir (${preferredShift})`
                                  : `Matricular (${preferredShift})`
                                : 'Indisponível'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Dieta & Plano de Nutrição / Corte de Peso */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <Apple className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm uppercase tracking-wider font-bold text-white">
            Nutrição & Gestão de Peso (Balança: {character.weight.toFixed(1)} kg)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {DIET_OPTIONS.map((d) => {
            const isSelected = character.dietPlan === d.id;
            const regionalDietCost = calculateRegionalDietCost(character, d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => handleChangeDiet(d.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-500/10'
                    : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-white">{d.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{d.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-800/80 flex justify-between text-[11px]">
                  <span className="text-neutral-500">
                    Custo: {regionalDietCost === 0 ? 'Grátis' : `R$ ${regionalDietCost.toLocaleString('pt-BR')}/mês`}
                  </span>
                  <span className={d.weightTrend > 0 ? 'text-amber-400 font-bold' : d.weightTrend < 0 ? 'text-cyan-400 font-bold' : 'text-neutral-400'}>
                    {d.weightTrend > 0 ? `+${d.weightTrend}kg/sem` : d.weightTrend < 0 ? `${d.weightTrend}kg/sem` : 'Estável'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Lazer & Saúde Mental */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <Smile className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm uppercase tracking-wider font-bold text-white">
            Lazer, Recuperação & Descompressão Mental
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {LEISURE_ACTIVITIES.map((act) => {
            const regionalLeisureCost = calculateRegionalLeisureCost(character, act.cost);
            return (
              <div key={act.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xs text-white">{act.name}</h3>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{act.desc}</p>
                </div>

                <div className="mt-4 pt-2 border-t border-neutral-800/80">
                  <div className="flex justify-between text-[10px] text-neutral-400 mb-2">
                    <span className="text-purple-400 font-semibold">+{act.mentalHealthGain} Foco</span>
                    <span>Custo: {regionalLeisureCost === 0 ? 'Grátis' : `R$ ${regionalLeisureCost.toLocaleString('pt-BR')}`}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLeisure(act)}
                    className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Fazer Atividade
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Profissões & Carreiras Dependentes de Formação */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-amber-400" />
            <div>
              <h2 className="text-sm uppercase tracking-wider font-bold text-white">
                Profissões, Carreiras & Exigências de Formação
              </h2>
              <p className="text-[11px] text-neutral-400">
                Conclua cursos nos níveis Fundamental, Médio, Técnico ou Superior para assumir cargos mais bem remunerados.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs">
            {(
              [
                { id: 'todos', label: 'Todas' },
                { id: 'base', label: 'Bicos / Fundamental / Médio' },
                { id: 'tecnico', label: 'Nível Técnico' },
                { id: 'superior', label: 'Nível Superior' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setJobTierFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  jobTierFilter === tab.id
                    ? 'bg-amber-500 text-neutral-950'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredJobs.map((j) => {
            const isCurrent = character.job === j.id;
            const check = validateJobEligibility(character, j.id);
            const canDo = check.eligible;
            const eduLabel = getEducationRequirementLabel(
              j.requiredEducationLevel,
              j.requiredEducationField
            );

            return (
              <div
                key={j.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/10'
                    : canDo
                    ? 'border-neutral-800 bg-neutral-950'
                    : 'border-neutral-800/70 bg-neutral-950/60 opacity-85'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-xs text-white leading-snug">{j.title}</span>
                    {isCurrent && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {j.requiredEducationLevel ? (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${EDUCATION_LEVEL_META[j.requiredEducationLevel].badgeClass}`}>
                        🎓 {eduLabel}
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-neutral-900 text-neutral-400 border border-neutral-800">
                        Sem exigência escolar
                      </span>
                    )}
                    {j.defaultShift && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-neutral-900 text-neutral-400 border border-neutral-800 capitalize">
                        Turno: {j.defaultShift}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-relaxed">{j.desc}</p>
                </div>

                <div className="mt-4 pt-2 border-t border-neutral-800/80 space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-emerald-400 font-bold">
                      {j.id === 'desempregado'
                        ? 'R$ 0/mês'
                        : `R$ ${calculateRegionalJobMonthlyPay(character, j).toLocaleString('pt-BR')}/mês`}
                    </span>
                    <span className="text-neutral-500">Mín. {j.minAge}a</span>
                  </div>

                  {!canDo && check.missingRequirements.length > 0 && (
                    <div className="text-[10px] text-red-400 leading-snug">
                      🔒 {check.missingRequirements[0]}
                    </div>
                  )}

                  {isCurrent ? (
                    <div className="py-1.5 text-center text-xs font-bold text-amber-400 bg-neutral-900 rounded-lg border border-neutral-800">
                      Ocupação Atual
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!canDo}
                      onClick={() => handleChangeJob(j.id)}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                        canDo
                          ? 'bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer'
                          : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                      }`}
                    >
                      {canDo ? 'Assumir Profissão' : 'Formação / Req. Pendente'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Panorama Econômico Regional, Custo de Vida Detalhado & Patrocínios */}
      {(() => {
        const ecoCtx = resolveActiveEconomicContext(character);
        const sponsor = evaluateMonthlySponsorship(character);
        const living = calculateLivingExpenses(character);
        const gymExp = calculateGymMonthlyExpenses(character);
        const equipExp = calculateMonthlyEquipmentCost(character);
        const eduExpense =
          activeEnrollment ? calculateEducationTuition(character, activeEnrollment).athletePays : 0;
        const dietExpense = calculateRegionalDietCost(character, character.dietPlan);

        const activeJobDef = AVAILABLE_JOBS.find((j) => j.id === character.job);
        const salaryIncome =
          activeJobDef && activeJobDef.id !== 'desempregado'
            ? calculateRegionalJobMonthlyPay(character, activeJobDef)
            : 0;
        const famDiff = character.familyWealthTier
          ? getDifficultyProfile(getDifficultyForWealthTier(character.familyWealthTier))
          : getDifficultyProfile(character.difficulty);
        const allowanceIncome =
          character.age < 18 && character.familySupport >= 45 ? famDiff.monthlyAllowanceUnder18 : 0;
        const estimatedIncome = salaryIncome + sponsor.monthlyPay + allowanceIncome;
        const estimatedOutflow =
          living.monthlyCost + gymExp.totalAthleteCost + equipExp.athletePays + eduExpense + dietExpense;
        const netEstimated = estimatedIncome - estimatedOutflow;

        return (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-black text-amber-400 block">
                  Economia Regional • {ecoCtx.localityLabel}
                </span>
                <h2 className="text-base font-black text-white">
                  Custo de Vida Detalhado, Orçamento Mensal & Mercado Local
                </h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">{ecoCtx.sport.economicIdentity}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 font-bold">
                  Custo Local: <strong className="text-amber-400">{ecoCtx.costTierLabel} ({ecoCtx.economy.costOfLivingIndex.toFixed(2)}x)</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 font-bold">
                  Salários: <strong className="text-emerald-400">{ecoCtx.economy.salaryMultiplier.toFixed(2)}x</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 font-bold">
                  Patrocínios: <strong className="text-cyan-400">{ecoCtx.sport.sponsorshipMarketIndex.toFixed(2)}x</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Patrocínios */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
                  <Handshake className="w-4 h-4" />
                  Patrocínios & Mercado Esportivo
                </div>
                <div className="text-sm font-black text-white">
                  {sponsor.name || 'Sem patrocinador ativo'}
                </div>
                <div className="text-xs text-neutral-400">
                  {sponsor.monthlyPay > 0
                    ? `${sponsor.tierLabel} · +R$ ${sponsor.monthlyPay.toLocaleString('pt-BR')}/mês automáticos`
                    : 'Conquiste vitórias/títulos em lutas (e 40+ Fama, 16+ anos) para atrair apoio local e contratos!'}
                </div>
                <div className="text-[10px] text-neutral-500 pt-1">
                  Desenv. esportivo: {ecoCtx.sport.sportDevelopmentIndex}/100 · {ecoCtx.sport.jobOpportunityLabel}
                </div>
              </div>

              {/* Economia Doméstica & Despesas Familiares */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-400">
                    <Briefcase className="w-4 h-4" />
                    Custo de Vida Doméstico
                  </span>
                  <span className="text-sm font-black text-white tabular-nums">
                    {living.monthlyCost > 0
                      ? `R$ ${living.monthlyCost.toLocaleString('pt-BR')}/mês`
                      : 'Isento (< 18a)'}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400">{living.contextLabel}</div>
                {living.monthlyCost > 0 && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1.5 border-t border-neutral-800/80 text-[10px] text-neutral-300">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Moradia:</span>
                      <span className="font-bold">R$ {living.breakdown.housing}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Alimentação:</span>
                      <span className="font-bold">R$ {living.breakdown.food}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Transporte:</span>
                      <span className="font-bold">R$ {living.breakdown.transport}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Saúde:</span>
                      <span className="font-bold">R$ {living.breakdown.health}</span>
                    </div>
                    {living.breakdown.family > 0 && (
                      <div className="col-span-2 flex justify-between text-pink-300">
                        <span>Despesas Familiares ({living.dependentsCount} dep.):</span>
                        <span className="font-bold">R$ {living.breakdown.family}</span>
                      </div>
                    )}
                    {living.foodNote && character.dietPlan !== 'caseira' && (
                      <div className="col-span-2 text-[9px] text-emerald-400/90 pt-0.5">
                        ✓ {living.foodNote}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Fluxo Mensal Estimado & Família */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-400">
                  <Heart className="w-4 h-4" />
                  Balanço Mensal & Família
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Renda fixa estimada:</span>
                    <span className="font-bold text-emerald-400">+R$ {estimatedIncome.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Despesas totais (casa/dojo/ensino):</span>
                    <span className="font-bold text-red-400">-R$ {estimatedOutflow.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-neutral-800/80 text-xs">
                    <span className="text-neutral-300 font-bold">Saldo mensal previsto:</span>
                    <span className={`font-black ${netEstimated >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {netEstimated >= 0 ? '+' : ''}R$ {netEstimated.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-neutral-500 pt-1">
                  {famDiff.familyWealthLabel} · Equip.: {equipExp.athletePays > 0 ? `R$ ${equipExp.athletePays}/mês` : 'Isento'}
                  {character.age < 18 && famDiff.monthlyAllowanceUnder18 > 0
                    ? ` · Mesada +R$ ${famDiff.monthlyAllowanceUnder18}`
                    : ''}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 6. Aposentadoria & Modo Dinastia (50+ anos) */}
      {character.age >= 50 && (() => {
        const heirs = getEligibleHeirs(character);
        return (
          <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/20 border border-amber-500/40 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-sm uppercase tracking-wider font-black text-white">
                    Aposentadoria & Sucessão da Dinastia (Geração {character.dynastyGeneration || 1})
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Passe o legado para um filho(a) ou discípulo da sua academia (60% do patrimônio, fama inicial e academia preservados).
                  </p>
                </div>
              </div>
            </div>

            {heirs.length === 0 ? (
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-400">
                Nenhum herdeiro elegível ainda (tenha filhos com 8+ anos ou alunos na sua academia com 14+ anos).
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {heirs.map((heir) => (
                  <div
                    key={heir.id}
                    className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white truncate">
                        {heir.avatar} {heir.name} ({heir.age}a)
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate">
                        {heir.relationLabel} · {MARTIAL_ARTS_META[heir.art]?.name} ({heir.beltLabel})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const res = inheritLegacyCharacter(character, heir.id, heir.source);
                        if (res.success && res.heirChar) {
                          sounds.playGraduation();
                          onUpdateCharacter(res.heirChar);
                          showFeedback(`👑 Legado transferido para ${res.heirChar.name} (Geração ${res.heirChar.dynastyGeneration})!`);
                        } else {
                          showFeedback(res.message);
                        }
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-[11px] rounded-lg cursor-pointer shrink-0"
                    >
                      Passar Legado
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
        </>
      )}
    </div>
  );
};
