import React, { useState, useMemo } from 'react';
import { Character, MartialArtType } from '../types/game';
import { 
  DayOfWeek, 
  DailyBlockType,
  DAILY_BLOCKS_META,
  DAYS_OF_WEEK_META, 
  POINTS_PER_BLOCK,
  DAILY_POINTS_CAPACITY,
  ScheduledActivity,
  EnrolledClass,
  ClassSessionRecord,
  GymClassTurma,
  calculateBlockCapacity,
  validateSleepContinuity,
  validateAgeAppropriateSleep,
  evaluateSleepQuality,
  getSleepPointsRequirement,
  getDayOfWeekFromGameDate,
  getAttendanceSummary,
  validateEnrollment,
  enrollCharacterInTurma,
  cancelEnrollment,
  completeSessionAttendance,
  markSessionAbsence,
  getGymXpMultiplier,
  calculateSessionTrainingXp,
  getCharacterWeeklyActivities
} from '../types/agenda';
import { calculateGymMonthlyExpenses, resolveEffectiveGymLocation } from '../utils/recoveryHelper';
import { getEffectiveMasterAttendance } from '../utils/graduationHelper';
import { getActiveArtTalentBonus } from '../utils/talentAndDifficultyHelper';
import { resolveBrazilCapitalByCity } from '../utils/regionalGeographyHelper';
import { WORLD_GYMS, MARTIAL_ARTS_META } from '../data/martialArtsData';
import { AVAILABLE_TURMAS } from '../data/gymClassesData';
import { MONTH_NAMES, getDaysInMonth } from '../utils/dateUtils';
import { sounds } from '../utils/audio';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Clock, 
  MapPin, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  GraduationCap,
  Briefcase,
  Dumbbell,
  BookOpen,
  Award,
  PlusCircle,
  XCircle,
  Check,
  UserCheck,
  UserX,
  Sparkles,
  ShieldAlert,
  Flame,
  Zap,
  Trash2
} from 'lucide-react';

interface Props {
  character: Character;
  onUpdateCharacter?: (char: Character) => void;
}

export const WeeklyScheduleView: React.FC<Props> = ({ character, onUpdateCharacter }) => {
  const daysInMonth = useMemo(() => {
    return getDaysInMonth(character.currentDate.month, character.currentDate.year);
  }, [character.currentDate.month, character.currentDate.year]);

  // Total real de semanas no mês civil (4 em fevereiro não bissexto, 5 nos demais)
  const totalWeeksInMonth = useMemo(() => {
    return Math.ceil(daysInMonth / 7);
  }, [daysInMonth]);

  // Semana atual do personagem no calendário oficial
  const currentWeekNumber = useMemo(() => {
    const day = character.currentDate?.day || 1;
    return Math.min(totalWeeksInMonth, Math.max(1, Math.ceil(day / 7)));
  }, [character.currentDate?.day, totalWeeksInMonth]);

  // Estado de navegação puramente visual (não avança tempo, não altera atributos nem XP)
  const [viewWeek, setViewWeek] = useState<number>(currentWeekNumber);
  const [selectedDayFilter, setSelectedDayFilter] = useState<DayOfWeek | 'todos'>('todos');

  // Modais interativos da Etapa 3
  const [showTurmasModal, setShowTurmasModal] = useState<boolean>(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState<boolean>(false);
  const [turmaScopeFilter, setTurmaScopeFilter] = useState<'local' | 'todas'>('local');
  const [selectedGymFilter, setSelectedGymFilter] = useState<string>('todas');
  const [selectedArtFilter, setSelectedArtFilter] = useState<string>('todas');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Informações da academia base do atleta
  const currentGym = useMemo(() => {
    return WORLD_GYMS.find((g) => g.id === character.currentGymId) || WORLD_GYMS[0];
  }, [character.currentGymId]);

  const currentGymLoc = useMemo(() => {
    return resolveEffectiveGymLocation(currentGym, character);
  }, [currentGym, character]);

  const playerCurrentCapital = useMemo(() => {
    return resolveBrazilCapitalByCity(character.currentCity || character.homeCity, character.homeState || 'SP');
  }, [character.currentCity, character.homeCity, character.homeState]);

  const localGyms = useMemo(() => {
    const curCountry = character.currentCountry || 'Brasil';
    const curCity = curCountry === 'Brasil' ? playerCurrentCapital.capital : character.currentCity;
    return WORLD_GYMS.filter((g) => {
      const loc = resolveEffectiveGymLocation(g, character);
      return loc.country === curCountry && loc.city === curCity;
    });
  }, [character, playerCurrentCapital.capital]);

  const selectableCatalogGyms = useMemo(() => {
    return turmaScopeFilter === 'local' ? localGyms : WORLD_GYMS;
  }, [turmaScopeFilter, localGyms]);

  // Faixa de dias do mês da semana visualizada (respeita 4 ou 5 semanas)
  const weekRange = useMemo(() => {
    const startDay = (viewWeek - 1) * 7 + 1;
    const endDay = Math.min(daysInMonth, viewWeek * 7);
    return { startDay, endDay, daysCount: endDay - startDay + 1 };
  }, [viewWeek, daysInMonth]);

  const isCurrentGameWeek = viewWeek === currentWeekNumber;

  const handlePrevWeek = () => {
    sounds.playWhoosh();
    setViewWeek((prev) => (prev > 1 ? prev - 1 : totalWeeksInMonth));
  };

  const handleNextWeek = () => {
    sounds.playWhoosh();
    setViewWeek((prev) => (prev < totalWeeksInMonth ? prev + 1 : 1));
  };

  const handleResetToCurrentWeek = () => {
    sounds.playPunch(false);
    setViewWeek(currentWeekNumber);
  };

  // Requisitos de sono contínuo para a idade atual do atleta
  const sleepRequirement = useMemo(() => {
    return getSleepPointsRequirement(character.age);
  }, [character.age]);

  // Montagem da rotina base oficial do personagem (sono 4/3 pts, ensino/faculdade, trabalho e matrículas reais)
  const allWeeklyActivities = useMemo(() => {
    return getCharacterWeeklyActivities(character);
  }, [character]);

  // Resumo de frequência das sessões
  const attendanceSummary = useMemo(() => {
    return getAttendanceSummary(character.classSessions || []);
  }, [character.classSessions]);

  const masterAttendance = useMemo(() => {
    return getEffectiveMasterAttendance(character.classSessions || []);
  }, [character.classSessions]);

  // Lista de matrículas ativas únicas
  const activeEnrollments = useMemo(() => {
    if (!Array.isArray(character.enrolledClasses)) return [];
    const map = new Map<string, EnrolledClass[]>();
    for (const c of character.enrolledClasses) {
      if (c.status === 'ativa') {
        if (!map.has(c.classId)) map.set(c.classId, []);
        map.get(c.classId)!.push(c);
      }
    }
    return Array.from(map.entries()).map(([classId, list]) => ({
      classId,
      first: list[0],
      days: list.map((l) => l.dayOfWeek),
      block: list[0].block,
      pointsCost: list[0].pointsCost,
      classType: list[0].classType || (list[0].pointsCost > 1 ? 'estendida' : 'regular'),
      gymName: list[0].gymName,
      instructorName: list[0].instructorName,
      title: list[0].title,
      art: list[0].art
    }));
  }, [character.enrolledClasses]);

  // Cálculo rigoroso de mensalidades de academias distintas (Etapa 3.2 - Fase 2)
  const gymExpenses = useMemo(() => {
    return calculateGymMonthlyExpenses(character);
  }, [character]);

  // Turmas filtradas para o catálogo
  const filteredTurmas = useMemo(() => {
    const allowedGymIds = new Set(selectableCatalogGyms.map((g) => g.id));
    return AVAILABLE_TURMAS.filter((t) => {
      if (!allowedGymIds.has(t.gymId)) return false;
      if (selectedGymFilter !== 'todas' && t.gymId !== selectedGymFilter) return false;
      if (selectedArtFilter !== 'todas' && t.art !== selectedArtFilter) return false;
      return true;
    });
  }, [selectableCatalogGyms, selectedGymFilter, selectedArtFilter]);

  // Avaliação do ciclo circadiano por fase da vida (menor vs adulto)
  const ageSleepRule = useMemo(() => {
    return validateAgeAppropriateSleep(character.age, allWeeklyActivities, character.familySupport);
  }, [character.age, allWeeklyActivities, character.familySupport]);

  // Métricas de qualidade do sono e integração com recuperação e fadiga
  const sleepQuality = useMemo(() => {
    return evaluateSleepQuality(character.age, allWeeklyActivities, undefined, character.familySupport);
  }, [character.age, allWeeklyActivities, character.familySupport]);

  // Handler: Efetivar Matrícula
  const handleEnrollTurma = (turma: GymClassTurma) => {
    if (!onUpdateCharacter) return;
    const res = enrollCharacterInTurma(character, turma);
    if (res.success) {
      if (res.discoveredTalent && res.discoveredTalent.stars >= 3) {
        sounds.playGraduation();
      } else {
        sounds.playPunch(true);
      }
      onUpdateCharacter(res.updatedChar);
      setActionFeedback({ type: 'success', message: res.message });
    } else {
      sounds.playWhoosh();
      setActionFeedback({ type: 'error', message: res.message });
    }
    setTimeout(() => setActionFeedback(null), res.discoveredTalent ? 8000 : 5000);
  };

  // Handler: Cancelar Matrícula
  const handleCancelEnrollment = (classId: string) => {
    if (!onUpdateCharacter) return;
    const res = cancelEnrollment(character, classId);
    if (res.success) {
      sounds.playPunch(false);
      onUpdateCharacter(res.updatedChar);
      setActionFeedback({ type: 'success', message: res.message });
    } else {
      setActionFeedback({ type: 'error', message: res.message });
    }
    setTimeout(() => setActionFeedback(null), 5000);
  };

  // Handler: Concluir Aula / Registrar Presença (apenas no dia real do jogo)
  const handleCompleteSession = (sessionId: string) => {
    if (!onUpdateCharacter) return;
    const res = completeSessionAttendance(character, sessionId, (id) => WORLD_GYMS.find((g) => g.id === id));
    if (res.success) {
      sounds.playPunch(true);
      onUpdateCharacter(res.updatedChar);
      setActionFeedback({ type: 'success', message: res.message });
    } else {
      sounds.playWhoosh();
      setActionFeedback({ type: 'error', message: res.message });
    }
    setTimeout(() => setActionFeedback(null), 5000);
  };

  // Handler: Registrar Falta
  const handleMarkAbsence = (sessionId: string) => {
    if (!onUpdateCharacter) return;
    const res = markSessionAbsence(character, sessionId);
    if (res.success) {
      sounds.playPunch(false);
      onUpdateCharacter(res.updatedChar);
      setActionFeedback({ type: 'error', message: res.message });
    }
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const getBlockIcon = (block: DailyBlockType) => {
    switch (block) {
      case 'madrugada':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      case 'manha':
        return <Sunrise className="w-4 h-4 text-amber-400" />;
      case 'tarde':
        return <Sun className="w-4 h-4 text-yellow-400" />;
      case 'noite':
        return <Sunset className="w-4 h-4 text-purple-400" />;
    }
  };

  const getActivityCategoryBadge = (category: string) => {
    switch (category) {
      case 'sono':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'escola':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'trabalho':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'artes_marciais':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'artes_marciais_estendida':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'condicionamento':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'estudos':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Feedback Toast */}
      {actionFeedback && (
        <div 
          className={`fixed bottom-20 left-3 right-3 sm:left-auto sm:bottom-auto sm:top-4 sm:right-4 z-50 p-3.5 sm:p-4 rounded-2xl border shadow-2xl flex items-center gap-3 sm:max-w-md animate-slideDown ${
            actionFeedback.type === 'success' 
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200' 
              : 'bg-red-950/95 border-red-500/50 text-red-200'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-xs font-bold leading-relaxed">{actionFeedback.message}</span>
        </div>
      )}

      {/* Header da Agenda Reestruturada */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
              Etapa 3 • Sistema de Matrículas, Aulas & Frequência
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 font-semibold">
              4 Blocos Diários • 3 Pts por Bloco (12 Pts/Dia)
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            Agenda Semanal & Rotina de Treinos
          </h1>
          <p className="text-xs md:text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Organize sua rotina entre aulas regulares (1 pt) e estendidas (2 pts) nas academias oficiais do mundo. Matrículas reservam pontos de forma recorrente; sessões agendadas não concedem XP antecipado. Presenças concluídas geram XP proporcional à modalidade e ao dojô.
          </p>

          {/* Botões de Ação da Etapa 3 */}
          <div className="flex items-center gap-2.5 mt-4 flex-wrap">
            <button
              type="button"
              onClick={() => setShowTurmasModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Catálogo de Turmas & Matrículas
            </button>

            <button
              type="button"
              onClick={() => setShowAttendanceModal(true)}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl border border-neutral-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Frequência & Matrículas Ativas ({activeEnrollments.length})
            </button>
          </div>
        </div>

        {/* Card de Contexto e Ciclo Circadiano do Atleta */}
        <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 shrink-0 w-full lg:w-auto space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> Dojô Principal
            </span>
            <span className="text-neutral-400 font-medium">
              {currentGymLoc.city}{currentGymLoc.uf ? ` - ${currentGymLoc.uf}` : ` (${currentGymLoc.country})`}
            </span>
          </div>

          <div className="text-base font-extrabold text-white flex items-center gap-2">
            <span>{currentGym.flag}</span>
            <span>{currentGym.name}</span>
          </div>

          {/* Badge Circadiano por Fase da Vida */}
          <div className="pt-1 border-t border-neutral-850 flex flex-wrap items-center justify-between gap-2 text-xs">
            {character.age < 18 ? (
              <span className="px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1">
                👶 Rotina Guiada (&lt; 18 anos)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-bold flex items-center gap-1">
                🧘 Autonomia Adulta
              </span>
            )}
            <span className="text-neutral-300 font-bold text-[11px]">
              Mestre: {masterAttendance.effectiveRate}% efetivo ({attendanceSummary.totalCompleted} presenças
              {masterAttendance.justifiedAbsences > 0 ? ` · ${masterAttendance.justifiedAbsences} justif.` : ''})
            </span>
          </div>

          {/* Integração de Fadiga e Recuperação (Etapa 3.2 - Fases 2, 4, 6) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[10px] text-center font-semibold">
            <div className="bg-neutral-900/80 p-1.5 rounded-lg border border-neutral-800 text-cyan-300">
              ⚡ {character.energy}/100 Energia
            </div>
            <div className="bg-neutral-900/80 p-1.5 rounded-lg border border-neutral-800 text-amber-300">
              🛌 {character.accumulatedFatigue || 0}/100 Fadiga
            </div>
            <div className="bg-neutral-900/80 p-1.5 rounded-lg border border-neutral-800 text-emerald-300">
              🩺 {character.recoveryRate || 100}% Recup.
            </div>
            <div className="bg-neutral-900/80 p-1.5 rounded-lg border border-neutral-800 text-purple-300">
              🏛️ R$ {gymExpenses.totalAthleteCost}/mês {gymExpenses.totalFamilyContribution > 0 ? `(Família: R$ ${gymExpenses.totalFamilyContribution})` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Periodização & Camp de Treino para Campeonatos */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/15 text-orange-400 rounded-xl border border-orange-500/30">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">Periodização & Camp de Treino</h2>
            <p className="text-[11px] text-neutral-400">
              Ajuste a intensidade mensal dos seus treinos de acordo com o calendário de campeonatos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
          {(
            [
              {
                id: 'leve',
                title: 'Camp Leve (Regenerativo)',
                desc: '0.85x XP · -8 fadiga · -risco doença · +QI/Foco'
              },
              {
                id: 'tecnico',
                title: 'Camp Técnico (Padrão)',
                desc: '1.0x XP · desgaste equilibrado · +Técnica/QI'
              },
              {
                id: 'intenso',
                title: 'Camp Intenso de Luta',
                desc: '1.25x XP · +12 fadiga · +Gás/Força/Técnica'
              }
            ] as const
          ).map((mode) => {
            const active = (character.trainingCampIntensity || 'tecnico') === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  if (!onUpdateCharacter) return;
                  sounds.playWhoosh();
                  onUpdateCharacter({ ...character, trainingCampIntensity: mode.id });
                  setActionFeedback({ type: 'success', message: `🔥 Periodização ajustada para: ${mode.title}` });
                  setTimeout(() => setActionFeedback(null), 3500);
                }}
                className={`px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className={`text-xs font-black ${active ? 'text-amber-400' : 'text-neutral-200'}`}>
                  {mode.title}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">{mode.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de Navegação Semanal (Suporta 4 ou 5 semanas) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Identificação da Semana */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-neutral-800 rounded-xl text-amber-400 border border-neutral-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-black text-white">
                Semana {viewWeek} de {totalWeeksInMonth}
              </span>
              <span className="text-xs text-neutral-400 font-semibold">
                (Dias {String(weekRange.startDay).padStart(2, '0')} a {String(weekRange.endDay).padStart(2, '0')} de {MONTH_NAMES[character.currentDate.month - 1]} de {character.currentDate.year})
              </span>
            </div>
            <div className="text-xs mt-0.5 flex items-center gap-2">
              {isCurrentGameWeek ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Semana Vigente da Carreira (Hoje: Dia {character.currentDate.day})
                </span>
              ) : (
                <span className="text-sky-400 font-semibold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Consulta Visual de Outra Semana (Não avança o tempo)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Controles de Navegação */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-neutral-700 cursor-pointer"
            title="Semana Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden md:inline">Semana Anterior</span>
          </button>

          {!isCurrentGameWeek && (
            <button
              type="button"
              onClick={handleResetToCurrentWeek}
              className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Voltar para Semana Vigente"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Semana Atual</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleNextWeek}
            className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-neutral-700 cursor-pointer"
            title="Próxima Semana"
          >
            <span className="hidden md:inline">Próxima Semana</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filtro Rápido de Dias da Semana */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setSelectedDayFilter('todos')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedDayFilter === 'todos'
              ? 'bg-amber-500 text-neutral-950 font-black'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          Semana Completa (7 Dias)
        </button>

        {DAYS_OF_WEEK_META.map((d) => {
          const isSelected = selectedDayFilter === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDayFilter(d.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-amber-500 text-neutral-950 font-black'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {d.shortLabel} • {d.label}
            </button>
          );
        })}
      </div>

      {/* Grade Semanal dos 7 Dias nos 4 Blocos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DAYS_OF_WEEK_META.filter((d) => selectedDayFilter === 'todos' || selectedDayFilter === d.id).map((dayMeta) => {
          const dayNumberInWeek = weekRange.startDay + dayMeta.dayIndex;
          const isCurrentRealDay = 
            character.currentDate.day === dayNumberInWeek &&
            character.currentDate.month === character.currentMonth &&
            character.currentDate.year === character.currentYear;

          // Validação de sono contínuo para o dia
          const sleepValidation = validateSleepContinuity(dayMeta.id, allWeeklyActivities);

          // Cálculo dos pontos totais consumidos no dia
          const dayTotalUsed = DAILY_BLOCKS_META.reduce((acc, blockMeta) => {
            const cap = calculateBlockCapacity(dayMeta.id, blockMeta.id, allWeeklyActivities);
            return acc + cap.usedPoints;
          }, 0);

          return (
            <div
              key={dayMeta.id}
              className={`bg-neutral-900 border rounded-3xl p-5 flex flex-col justify-between shadow-lg transition-all ${
                isCurrentRealDay
                  ? 'border-amber-500/60 bg-gradient-to-b from-neutral-900 via-neutral-900 to-amber-950/20 shadow-amber-500/10'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div>
                {/* Header do Dia */}
                <div className="border-b border-neutral-800 pb-3 mb-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black uppercase tracking-wider text-amber-400">
                        {dayMeta.label}
                      </h3>
                      {isCurrentRealDay && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500 text-neutral-950 animate-pulse">
                          Hoje
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400 font-medium mt-0.5">
                      {dayNumberInWeek <= daysInMonth
                        ? `Dia ${String(dayNumberInWeek).padStart(2, '0')} de ${MONTH_NAMES[character.currentDate.month - 1]}`
                        : 'Dia fora do mês corrente'}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-white">{dayTotalUsed}/{DAILY_POINTS_CAPACITY}</span>
                    <span className="text-[10px] text-neutral-500 block">pontos</span>
                  </div>
                </div>

                {/* Status do Sono Contínuo */}
                <div className="mb-4">
                  {sleepValidation.isContinuous ? (
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/25 rounded-xl flex items-center justify-between text-[11px] text-indigo-300">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Moon className="w-3.5 h-3.5 text-indigo-400" />
                        Sono Contínuo
                      </span>
                      <span className="font-extrabold">{sleepValidation.totalSleepPoints} pts</span>
                    </div>
                  ) : (
                    <div className="p-2 bg-amber-500/15 border border-amber-500/35 rounded-xl flex items-center gap-1.5 text-[11px] text-amber-300 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{sleepValidation.reason}</span>
                    </div>
                  )}
                </div>

                {/* Os 4 Blocos Diários (Madrugada, Manhã, Tarde, Noite) */}
                <div className="space-y-3">
                  {DAILY_BLOCKS_META.map((blockMeta) => {
                    const capacity = calculateBlockCapacity(dayMeta.id, blockMeta.id, allWeeklyActivities);
                    const isOver = capacity.isOverCapacity;

                    // Busca se há sessão agendada específica para este dia civil real
                    const sessionForThisSlot = (character.classSessions || []).find((s) => {
                      return (
                        s.date.day === dayNumberInWeek &&
                        s.date.month === character.currentDate.month &&
                        s.date.year === character.currentDate.year &&
                        s.block === blockMeta.id
                      );
                    });

                    return (
                      <div
                        key={blockMeta.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          isOver
                            ? 'bg-red-950/20 border-red-500/40'
                            : capacity.usedPoints === POINTS_PER_BLOCK
                            ? 'bg-neutral-950/80 border-neutral-800'
                            : 'bg-neutral-950/50 border-neutral-850'
                        }`}
                      >
                        {/* Header do Bloco */}
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className="flex items-center gap-1.5">
                            {getBlockIcon(blockMeta.id)}
                            <span className="font-extrabold text-neutral-200">{blockMeta.label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                                isOver
                                  ? 'bg-red-500/20 text-red-400'
                                  : capacity.availablePoints === 0
                                  ? 'bg-neutral-800 text-neutral-400'
                                  : 'bg-emerald-500/15 text-emerald-400'
                              }`}
                            >
                              {capacity.usedPoints}/{POINTS_PER_BLOCK} pts
                            </span>
                          </div>
                        </div>

                        {/* Atividades Agendadas no Bloco */}
                        <div className="space-y-1.5">
                          {capacity.activities.map((act) => (
                            <div
                              key={act.id}
                              className="p-2 bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col gap-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${getActivityCategoryBadge(
                                        act.category
                                      )}`}
                                    >
                                      {act.category === 'artes_marciais_estendida'
                                        ? 'Aula Estendida'
                                        : act.category.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs font-bold text-white">{act.title}</span>
                                  </div>
                                  {act.notes && (
                                    <div className="text-[10px] text-neutral-400 mt-0.5 truncate max-w-[200px]">
                                      {act.notes}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] font-black text-amber-400 shrink-0 bg-neutral-850 px-1.5 py-0.5 rounded border border-neutral-700">
                                  {act.pointsCost} pt{act.pointsCost > 1 ? 's' : ''}
                                </span>
                              </div>

                              {/* Status e Ações da Sessão da Aula de Luta */}
                              {sessionForThisSlot && (act.category === 'artes_marciais' || act.category === 'artes_marciais_estendida') && (
                                <div className="pt-1.5 border-t border-neutral-800 flex flex-col gap-1">
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-neutral-500 font-semibold">Sessão da Turma:</span>
                                    {sessionForThisSlot.status === 'concluida' ? (
                                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Presença (+{sessionForThisSlot.xpEarned || 0} XP)
                                      </span>
                                    ) : sessionForThisSlot.status === 'falta' ? (
                                      <span className="text-red-400 font-bold flex items-center gap-1">
                                        <XCircle className="w-3 h-3" /> Falta Registrada
                                      </span>
                                    ) : sessionForThisSlot.status === 'cancelada' ? (
                                      <span className="text-neutral-500 font-bold">Cancelada</span>
                                    ) : (
                                      <span className="text-amber-400 font-bold flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Agendada (0 XP)
                                      </span>
                                    )}
                                  </div>

                                  {/* Botões de Ação para Treino no DIA REAL DO JOGO */}
                                  {isCurrentRealDay && sessionForThisSlot.status === 'agendada' && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <button
                                        type="button"
                                        onClick={() => handleCompleteSession(sessionForThisSlot.id)}
                                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-emerald-950"
                                      >
                                        <Zap className="w-3 h-3" /> Treinar Aula
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMarkAbsence(sessionForThisSlot.id)}
                                        className="px-2 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                        title="Registrar Falta"
                                      >
                                        Falta
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Representação Visual dos Pontos Livres */}
                          {capacity.availablePoints > 0 && (
                            <div className="p-2 rounded-xl border border-dashed border-neutral-800/80 bg-neutral-950/30 flex items-center justify-between text-[11px] text-neutral-500">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                                {capacity.availablePoints} ponto(s) disponível(is)
                              </span>
                              <span className="text-[10px] text-neutral-600 font-medium">Livre</span>
                            </div>
                          )}

                          {/* Alerta de Conflito de Capacidade */}
                          {isOver && (
                            <div className="p-1.5 bg-red-500/15 border border-red-500/30 rounded-lg text-[10px] text-red-400 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>Excesso de capacidade: {capacity.usedPoints} de {POINTS_PER_BLOCK} pontos!</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rodapé do Dia */}
              <div className="mt-4 pt-3 border-t border-neutral-800/70 flex items-center justify-between text-[10px] text-neutral-500">
                <span>{currentGym.name.split('/')[0]}</span>
                <span className="font-semibold text-neutral-400">
                  {DAILY_POINTS_CAPACITY - dayTotalUsed} pts livres hoje
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Diretrizes da Etapa 3 */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 text-xs text-neutral-300 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-black uppercase tracking-wider text-xs">
          <Info className="w-4 h-4 shrink-0" />
          <span>Regras da Agenda Semanal & Frequência (Etapa 3)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1 text-neutral-400 leading-relaxed text-[11px]">
          <div>
            <strong className="text-neutral-200 block mb-0.5">Custos Fixos por Atividade:</strong>
            Sono: {sleepRequirement} pts ({character.age < 18 ? '3 madrugada + 1 noite' : '3 madrugada — noite livre!'}). Aula regular: 1 pt. Estendida: 2 pts. Fundamental/Médio: 3 pts (Seg–Sex). Técnico/Superior: 2 pts (Seg/Qua/Sex). Trabalho: 3 pts.
          </div>
          <div>
            <strong className="text-neutral-200 block mb-0.5">Matrícula Recorrente:</strong>
            A matrícula reserva os pontos necessários nos dias programados. Conflitos de horário ou excesso de capacidade bloqueiam a inscrição sem cancelamentos ocultos.
          </div>
          <div>
            <strong className="text-neutral-200 block mb-0.5">Comparecimento Automático & Exceções:</strong>
            Ao virar o mês, o atleta comparece a todos os treinos matriculados e recebe o XP (+50% especializada / +30% poliesportiva), salvo se adoecer, alguém da família adoecer ou houver aniversário, casamento ou batizado na família no dia da aula (família sem dinheiro não comemora aniversário).
          </div>
          <div>
            <strong className="text-neutral-200 block mb-0.5">Preservação do Histórico:</strong>
            O cancelamento da matrícula encerra sessões futuras mas preserva integralmente o histórico de presenças, faltas e XP conquistados no passado.
          </div>
        </div>
      </div>

      {/* MODAL 1: Catálogo de Turmas & Matrículas */}
      {showTurmasModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-scaleIn">
            {/* Header do Modal */}
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                  <GraduationCap className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-xl font-black text-white">Catálogo de Turmas & Matrículas</h3>
                  <p className="text-xs text-neutral-400">
                    Aulas oficiais ofertadas nas {WORLD_GYMS.length} academias do circuito (27 capitais & polos mundiais). Verifique dias, custos de pontos e bônus.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTurmasModal(false)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-all cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Filtros de Localidade, Academia e Modalidade */}
            <div className="p-4 bg-neutral-950/60 border-b border-neutral-800 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setTurmaScopeFilter('local');
                    setSelectedGymFilter('todas');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    turmaScopeFilter === 'local'
                      ? 'bg-amber-500 text-neutral-950'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  📍 Minha Cidade ({currentGymLoc.city})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTurmaScopeFilter('todas');
                    setSelectedGymFilter('todas');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    turmaScopeFilter === 'todas'
                      ? 'bg-amber-500 text-neutral-950'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  🌎 Circuito Global
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-bold uppercase text-[10px]">Academia:</span>
                <select
                  value={selectedGymFilter}
                  onChange={(e) => setSelectedGymFilter(e.target.value)}
                  className="bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-xl px-3 py-1.5 font-semibold text-xs focus:outline-hidden focus:border-amber-400"
                >
                  <option value="todas">
                    {turmaScopeFilter === 'local'
                      ? `Todas de ${currentGymLoc.city} (${localGyms.length})`
                      : `Todas as Academias (${WORLD_GYMS.length})`}
                  </option>
                  {selectableCatalogGyms.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.flag} {g.name}{g.uf ? ` (${g.city}/${g.uf})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-bold uppercase text-[10px]">Arte Marcial:</span>
                <select
                  value={selectedArtFilter}
                  onChange={(e) => setSelectedArtFilter(e.target.value)}
                  className="bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-xl px-3 py-1.5 font-semibold text-xs focus:outline-hidden focus:border-amber-400"
                >
                  <option value="todas">Todas as Modalidades</option>
                  {Object.entries(MARTIAL_ARTS_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.name}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-neutral-500 text-[11px] ml-auto">
                {filteredTurmas.length} turma(s) disponível(is)
              </span>
            </div>

            {/* Lista de Turmas */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {filteredTurmas.map((turma) => {
                const gymObj = WORLD_GYMS.find((g) => g.id === turma.gymId) || { id: turma.gymId };
                const { bonusLabel, gymType } = getGymXpMultiplier(gymObj);
                const { finalXp, energyCost } = calculateSessionTrainingXp(turma.pointsCost, gymObj);

                const isAlreadyEnrolled = character.enrolledClasses?.some(
                  (c) => c.classId === turma.id && c.status === 'ativa'
                );

                const validation = validateEnrollment(character, turma);
                const canEnroll = validation.isValid;

                return (
                  <div
                    key={turma.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isAlreadyEnrolled
                        ? 'bg-neutral-950/70 border-emerald-500/40'
                        : canEnroll
                        ? 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700'
                        : 'bg-neutral-950/20 border-red-950/50 opacity-90'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Detalhes da Turma */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            {MARTIAL_ARTS_META[turma.art]?.name || turma.art}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-neutral-800 text-neutral-300 border border-neutral-700">
                            {turma.classType === 'estendida' ? 'Aula Estendida (2 Pts)' : 'Aula Regular (1 Pt)'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              gymType === 'especializada'
                                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {bonusLabel}
                          </span>
                          {isAlreadyEnrolled && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Matriculado
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-black text-white">{turma.title}</h4>
                        <p className="text-xs text-neutral-400 leading-relaxed">{turma.description}</p>

                        <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1 flex-wrap">
                          <span>
                            🏛️ <strong className="text-neutral-200">{turma.gymName}</strong>
                          </span>
                          <span>
                            🥋 Mestre: <strong className="text-neutral-200">{turma.instructorName}</strong>
                          </span>
                          <span>
                            ⏰ Bloco:{' '}
                            <strong className="text-amber-400 capitalize">{turma.block}</strong>
                          </span>
                          <span>
                            📅 Dias:{' '}
                            <strong className="text-neutral-200">
                              {turma.daysOfWeek.map((d) => d.toUpperCase()).join(', ')}
                            </strong>
                          </span>
                        </div>

                        {/* Pré-requisitos & Rendimento */}
                        <div className="flex items-center gap-3 text-[11px] pt-1 text-neutral-400 flex-wrap">
                          {(() => {
                            const artTalent = getActiveArtTalentBonus(character, turma.art);
                            const boostedXp = Math.round(finalXp * artTalent.xpMultiplier);
                            return (
                              <>
                                <span className="text-emerald-400 font-semibold">
                                  ⚡ Rendimento: +{boostedXp} XP / aula (-{energyCost} energia)
                                </span>
                                {artTalent.discovered && artTalent.meta ? (
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${artTalent.meta.badgeClass}`}>
                                    {artTalent.meta.shortLabel}
                                    {artTalent.meta.xpBonusPercent > 0 ? ` (+${artTalent.meta.xpBonusPercent}% XP)` : ''}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-950/50 text-purple-300 border border-purple-700/40">
                                    🔒 Talento Oculto — descobre ao se matricular!
                                  </span>
                                )}
                              </>
                            );
                          })()}
                          {turma.prerequisites.minRank !== undefined && turma.prerequisites.minRank > 0 && (
                            <span className="text-neutral-500">
                              • Faixa Mínima: Nível {turma.prerequisites.minRank}
                            </span>
                          )}
                          {turma.prerequisites.minFightIq !== undefined && turma.prerequisites.minFightIq > 0 && (
                            <span className="text-neutral-500">
                              • QI de Luta Mínimo: {turma.prerequisites.minFightIq}
                            </span>
                          )}
                        </div>

                        {/* Mensagem de conflito se houver */}
                        {!canEnroll && !isAlreadyEnrolled && (
                          <div className="p-2 bg-red-500/10 border border-red-500/25 rounded-xl text-xs text-red-400 font-medium flex items-center gap-1.5 mt-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{validation.reason}</span>
                          </div>
                        )}
                      </div>

                      {/* Botão de Matrícula */}
                      <div className="shrink-0 flex items-center">
                        {isAlreadyEnrolled ? (
                          <button
                            type="button"
                            onClick={() => handleCancelEnrollment(turma.id)}
                            className="px-4 py-2.5 bg-neutral-850 hover:bg-red-950/80 text-neutral-300 hover:text-red-300 border border-neutral-700 hover:border-red-500/50 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" /> Cancelar Matrícula
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!canEnroll}
                            onClick={() => handleEnrollTurma(turma)}
                            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                              canEnroll
                                ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/20 cursor-pointer'
                                : 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed'
                            }`}
                          >
                            <PlusCircle className="w-4 h-4" />
                            Matricular-se ({turma.pointsCost} pt{turma.pointsCost > 1 ? 's' : ''})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Frequência & Matrículas Ativas */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-scaleIn">
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
                  <BookOpen className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-xl font-black text-white">Minhas Matrículas & Frequência</h3>
                  <p className="text-xs text-neutral-400">
                    Histórico consolidado de presença, faltas e XP acumulado nas sessões.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-all cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Estatísticas Gerais de Frequência */}
            <div className="p-6 bg-neutral-950/60 border-b border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
                <span className="text-xs text-neutral-400 block mb-1">Presenças Concluídas</span>
                <span className="text-xl font-black text-emerald-400">{attendanceSummary.totalCompleted}</span>
              </div>
              <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
                <span className="text-xs text-neutral-400 block mb-1">Faltas (Justif. / Injustif.)</span>
                <span className="text-xl font-black text-red-400">
                  {masterAttendance.justifiedAbsences} / {masterAttendance.unjustifiedAbsences}
                </span>
              </div>
              <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
                <span className="text-xs text-neutral-400 block mb-1">Avaliação do Mestre</span>
                <span className="text-xl font-black text-cyan-400">{masterAttendance.effectiveRate}%</span>
              </div>
              <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
                <span className="text-xs text-neutral-400 block mb-1">XP Ganho em Treinos</span>
                <span className="text-xl font-black text-amber-400">+{attendanceSummary.totalXpEarned}</span>
              </div>
            </div>

            {/* Conteúdo com Abas/Listas */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Matrículas Ativas */}
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  Matrículas Recorrentes Ativas ({activeEnrollments.length})
                </h4>

                {activeEnrollments.length === 0 ? (
                  <div className="p-6 bg-neutral-950 rounded-2xl border border-dashed border-neutral-800 text-center text-neutral-500">
                    Você ainda não se matriculou em nenhuma turma. Abra o Catálogo de Turmas para se inscrever!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeEnrollments.map((enr) => (
                      <div
                        key={enr.classId}
                        className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-extrabold text-white text-sm">{enr.title}</div>
                          <div className="text-neutral-400 text-xs mt-0.5">
                            {enr.gymName} • {enr.instructorName}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-neutral-500 flex-wrap">
                            <span className="px-2 py-0.5 bg-neutral-900 rounded text-amber-400 font-bold capitalize">
                              Bloco: {enr.block} ({enr.pointsCost} pt{enr.pointsCost > 1 ? 's' : ''})
                            </span>
                            <span>Dias: {enr.days.map((d) => d.toUpperCase()).join(', ')}</span>
                            {(() => {
                              const artTalent = getActiveArtTalentBonus(character, enr.art);
                              if (!artTalent.discovered || !artTalent.meta) return null;
                              return (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${artTalent.meta.badgeClass}`}>
                                  {artTalent.meta.shortLabel}
                                  {artTalent.meta.xpBonusPercent > 0 ? ` (+${artTalent.meta.xpBonusPercent}% XP)` : ''}
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCancelEnrollment(enr.classId)}
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-red-950/80 text-neutral-400 hover:text-red-300 border border-neutral-800 hover:border-red-500/40 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Centros de Treino & Mensalidades (Etapa 3.2 - Fase 2) */}
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Plano Mensal de Academias ({gymExpenses.uniqueGymCount})
                  </span>
                  <span className="text-emerald-400 font-extrabold text-xs">
                    Total Atleta: R$ {gymExpenses.totalAthleteCost.toLocaleString('pt-BR')}/mês
                  </span>
                </h4>

                <div className="space-y-2">
                  {gymExpenses.gyms.map((g) => (
                    <div
                      key={g.gymId}
                      className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-white text-xs">{g.gymName}</div>
                        <div className="text-[11px] text-neutral-400">
                          {g.classesCount > 0 ? `${g.classesCount} turma(s) inclusa(s) no mesmo plano mensal` : 'Academia base atual'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-amber-400 text-xs">
                          R$ {g.monthlyCost.toLocaleString('pt-BR')}/mês
                        </div>
                        <div className="text-[10px]">
                          {g.paidByFamily ? (
                            <span className="text-blue-400 font-bold">100% Coberto pelos Pais</span>
                          ) : g.familyAmount > 0 ? (
                            <span className="text-cyan-400">Atleta: R$ {g.athleteAmount} (Família: R$ {g.familyAmount})</span>
                          ) : (
                            <span className="text-neutral-400">Custeio do Atleta</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Histórico das Últimas Sessões */}
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Histórico de Sessões de Treino ({character.classSessions?.length || 0})
                </h4>

                {(!character.classSessions || character.classSessions.length === 0) ? (
                  <div className="p-4 bg-neutral-950 rounded-2xl border border-dashed border-neutral-800 text-center text-neutral-500">
                    Nenhuma sessão gerada ou concluída até o momento.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {character.classSessions.slice(-15).reverse().map((sess) => (
                      <div
                        key={sess.id}
                        className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-neutral-200">{sess.title}</div>
                          <div className="text-[11px] text-neutral-500">
                            {sess.date.day}/{sess.date.month}/{sess.date.year} ({sess.dayOfWeek}) • {sess.block} • {sess.gymName}
                          </div>
                          {sess.notes && (
                            <div className={`text-[10px] mt-0.5 ${sess.status === 'falta' ? 'text-amber-400 font-semibold' : 'text-neutral-500'}`}>
                              {sess.notes}
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          {sess.status === 'concluida' ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 text-[10px]">
                              +{sess.xpEarned || 0} XP
                            </span>
                          ) : sess.status === 'falta' ? (
                            <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-400 font-bold border border-red-500/30 text-[10px]">
                              Falta
                            </span>
                          ) : sess.status === 'cancelada' ? (
                            <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-500 font-bold text-[10px]">
                              Cancelada
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 text-[10px]">
                              Agendada (0 XP)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
