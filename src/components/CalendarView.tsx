import React, { useState, useMemo } from 'react';
import { Character, Tournament } from '../types/game';
import { INITIAL_TOURNAMENTS } from '../data/tournamentsData';
import { WORLD_GYMS } from '../data/martialArtsData';
import { AVAILABLE_JOBS } from '../data/lifeEventsData';
import {
  getRealAthleteAge,
  getTournamentScheduleDates,
  getTournamentTimelineInfo,
  resolveTournamentIsGi
} from '../utils/tournamentTimeline';
import { evaluateTournamentGeographyAndTravel } from '../utils/tournamentGeographyHelper';
import { calculateLivingExpenses } from '../utils/characterHelper';
import {
  calculateRegionalJobMonthlyPay,
  getPlayerLocationSummary
} from '../utils/regionalEconomyHelper';
import { 
  formatGameDate, 
  formatCareerDuration, 
  getDaysInMonth, 
  getFirstDayOfWeek, 
  getPreviousMonthYear, 
  getNextMonthYear,
  isLeapYear,
  MONTH_NAMES,
  MONTH_ABBR
} from '../utils/dateUtils';
import { sounds } from '../utils/audio';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  FastForward, 
  Trophy, 
  Cake, 
  Flame, 
  Coins, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Info,
  Building,
  Dumbbell
} from 'lucide-react';

interface Props {
  character: Character;
  onAdvanceMonth: () => void;
  onSelectTournament?: (tournament: Tournament) => void;
}

export interface DayEvent {
  id: string;
  type: 'today' | 'birthday' | 'career_start' | 'tournament' | 'salary' | 'gym_fee' | 'living_cost' | 'routine';
  title: string;
  category: string;
  badgeColor: string;
  icon: string;
  description: string;
  tournamentData?: Tournament;
}

export const CalendarView: React.FC<Props> = ({
  character,
  onAdvanceMonth,
  onSelectTournament
}) => {
  // Independent visual consultation state (never mutates character.currentDate)
  const [viewMonth, setViewMonth] = useState<number>(character.currentDate.month);
  const [viewYear, setViewYear] = useState<number>(character.currentDate.year);
  const [selectedDay, setSelectedDay] = useState<number>(character.currentDate.day);

  // Synchronize view when game month advances if player was looking at current month
  const isCurrentlyViewingGameMonth = 
    viewMonth === character.currentDate.month && viewYear === character.currentDate.year;

  const handlePrevMonth = () => {
    sounds.playWhoosh();
    const prev = getPreviousMonthYear(viewMonth, viewYear);
    setViewMonth(prev.month);
    setViewYear(prev.year);
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    sounds.playWhoosh();
    const next = getNextMonthYear(viewMonth, viewYear);
    setViewMonth(next.month);
    setViewYear(next.year);
    setSelectedDay(1);
  };

  const handleResetToCurrent = () => {
    sounds.playPunch(false);
    setViewMonth(character.currentDate.month);
    setViewYear(character.currentDate.year);
    setSelectedDay(character.currentDate.day);
  };

  const handleAdvanceMonthClick = () => {
    sounds.playWhistle();
    onAdvanceMonth();
  };

  // Calculations for the calendar grid
  const daysInMonth = useMemo(() => getDaysInMonth(viewMonth, viewYear), [viewMonth, viewYear]);
  const firstDayOfWeek = useMemo(() => getFirstDayOfWeek(viewMonth, viewYear), [viewMonth, viewYear]);

  // Current gym and job for monthly financial events
  const currentGym = useMemo(() => {
    return WORLD_GYMS.find((g) => g.id === character.currentGymId);
  }, [character.currentGymId]);

  const currentJob = useMemo(() => {
    return AVAILABLE_JOBS.find((j) => j.id === character.job);
  }, [character.job]);

  // Generate mapping of day -> events for the currently viewed month and year
  const eventsByDay = useMemo(() => {
    const map = new Map<number, DayEvent[]>();

    const addEvent = (day: number, evt: DayEvent) => {
      const existing = map.get(day) || [];
      existing.push(evt);
      map.set(day, existing);
    };

    const realAge = getRealAthleteAge(character);
    // 1. Current Game Date (Hoje)
    if (viewYear === character.currentDate.year && viewMonth === character.currentDate.month) {
      addEvent(character.currentDate.day, {
        id: 'event_today',
        type: 'today',
        title: 'Dia Atual do Jogo',
        category: 'Momento Atual',
        badgeColor: 'bg-amber-500 text-neutral-950 font-black',
        icon: '📍',
        description: `Você está atualmente neste dia. Idade: ${realAge} anos. Peso na balança: ${character.weight.toFixed(1)} kg.`
      });
    }

    // 2. Birthday (Aniversário do Atleta)
    const isBornFeb29 = character.birthDate.month === 2 && character.birthDate.day === 29;
    const celebrationDay = (isBornFeb29 && !isLeapYear(viewYear)) ? 28 : character.birthDate.day;

    if (viewMonth === character.birthDate.month && celebrationDay <= daysInMonth) {
      const birthdayAge = viewYear - character.birthDate.year;
      addEvent(celebrationDay, {
        id: 'event_birthday',
        type: 'birthday',
        title: `Aniversário de ${character.name}`,
        category: 'Vida Pessoal',
        badgeColor: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
        icon: '🎂',
        description: isBornFeb29 && !isLeapYear(viewYear)
          ? `O atleta celebra ${birthdayAge > 0 ? `${birthdayAge} anos de vida` : 'seu nascimento'} em 28 de fevereiro (nascido em 29/02 em ano não bissexto).`
          : `O atleta celebra ${birthdayAge > 0 ? `${birthdayAge} anos de vida` : 'seu nascimento'} neste dia do calendário civil.`
      });
    }

    // 3. Career Debut (Marco de Início de Carreira)
    if (
      viewYear === character.careerStartDate.year &&
      viewMonth === character.careerStartDate.month &&
      character.careerStartDate.day <= daysInMonth
    ) {
      addEvent(character.careerStartDate.day, {
        id: 'event_career_start',
        type: 'career_start',
        title: 'Estreia & Início da Carreira Marcial',
        category: 'Carreira',
        badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
        icon: '🥋',
        description: `Primeiro dia oficial de treinamento no tatame com idade inicial de ${character.startAge} anos em ${character.homeCity} - ${character.homeState}.`
      });
    }

    // 4. Financial Events (Salário dia 5, Mensalidade dia 10, Custo de Vida Regional dia 15)
    if (currentJob && currentJob.id !== 'desempregado' && 5 <= daysInMonth) {
      const regionalMonthlySalary = calculateRegionalJobMonthlyPay(character, currentJob);
      addEvent(5, {
        id: 'event_salary',
        type: 'salary',
        title: `Pagamento Salarial: ${currentJob.title}`,
        category: 'Finanças',
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        icon: '💵',
        description: `Recebimento mensal regionalizado de R$ ${regionalMonthlySalary.toLocaleString('pt-BR')} em ${character.currentCity || character.homeCity} para sustento do atleta.`
      });
    }

    if (currentGym && currentGym.weeklyCost > 0 && 10 <= daysInMonth) {
      addEvent(10, {
        id: 'event_gym_fee',
        type: 'gym_fee',
        title: `Mensalidade da Academia: ${currentGym.name}`,
        category: 'Custos do Dojo',
        badgeColor: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
        icon: '🏛️',
        description: `Custo mensal do centro de treinamento: R$ ${(currentGym.weeklyCost * 4).toLocaleString('pt-BR')}.`
      });
    }

    const livingExpenses = calculateLivingExpenses(character);
    if (livingExpenses.monthlyCost > 0 && 15 <= daysInMonth) {
      const { breakdown } = livingExpenses;
      addEvent(15, {
        id: 'event_living_cost',
        type: 'living_cost',
        title: `Custo de Vida: ${livingExpenses.localityLabel}`,
        category: `Despesas (${livingExpenses.costTierLabel})`,
        badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
        icon: '🏠',
        description: `Total mensal R$ ${livingExpenses.monthlyCost.toLocaleString('pt-BR')} (${livingExpenses.housingModeLabel}) — Moradia R$ ${breakdown.housing}, Alim. R$ ${breakdown.food}, Transp. R$ ${breakdown.transport}, Saúde R$ ${breakdown.health}${breakdown.family > 0 ? `, Família R$ ${breakdown.family}` : ''}.`
      });
    }

    // 5. Tournaments of the month (exibe exclusivamente no mês agendado)
    INITIAL_TOURNAMENTS.forEach((t) => {
      const dates = getTournamentScheduleDates(t, viewYear);
      if (dates.month !== viewMonth) {
        return;
      }

      const timeline = getTournamentTimelineInfo(t, character.currentDate, character, viewYear);
      const geo = evaluateTournamentGeographyAndTravel(character, t);
      const travelSummary = geo.travelLogistics.isSameCapital
        ? 'Sede local (R$ 0 viagem)'
        : geo.travelCoveredByPromotion
        ? `Sede: ${geo.host.displayLabel} · Passagem custeada`
        : `Sede: ${geo.host.displayLabel} · Viagem R$ ${geo.effectiveTravelCost.toLocaleString('pt-BR')} (${geo.travelLogistics.distanceKm.toLocaleString('pt-BR')} km)`;

      // Evento A: Prazo limite de inscrição
      if (dates.deadlineDate.day <= daysInMonth) {
        addEvent(dates.deadlineDate.day, {
          id: `event_tourn_deadline_${t.id}`,
          type: 'routine',
          title: `Prazo Final de Inscrição: ${t.name}`,
          category: `Inscrições (${t.organization})`,
          badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
          icon: '📋',
          description: `Último dia para homologar a inscrição na categoria ${t.weightClass}. Taxa: ${t.entryFee === 0 ? 'Gratuito' : `R$ ${t.entryFee}`}. ${travelSummary}.`
        });
      }

      // Evento B: Pesagem Oficial
      if (dates.weighInDate.day <= daysInMonth) {
        addEvent(dates.weighInDate.day, {
          id: `event_tourn_weighin_${t.id}`,
          type: 'routine',
          title: `Pesagem Oficial: ${t.name}`,
          category: `Pesagem (${t.organization})`,
          badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
          icon: '⚖️',
          description: `Pesagem obrigatória em ${geo.host.displayLabel}. Limite: ${t.targetWeight} kg. Atletas fora do peso são desclassificados.`
        });
      }

      // Evento C: Disputa Oficial dos Combates
      if (dates.scheduledDate.day <= daysInMonth) {
        const modalityTag =
          t.art === 'jiujitsu' || t.rulesType === 'bjj_points'
            ? ` (${resolveTournamentIsGi(t, timeline.historyEntry) ? 'Gi' : 'No-Gi'})`
            : '';
        addEvent(dates.scheduledDate.day, {
          id: `event_tourn_${t.id}`,
          type: 'tournament',
          title: t.name,
          category: `Torneio Oficial (${t.organization})`,
          badgeColor: timeline.badgeColor,
          icon: '🏆',
          description: `[${timeline.statusLabel}] Disputa em ${t.art.toUpperCase()}${modalityTag} • ${travelSummary}. Limite: ${t.targetWeight} kg (${t.weightClass}). Premiação: R$ ${t.rewardMoney.toLocaleString('pt-BR')}.`,
          tournamentData: t
        });
      }
    });

    return map;
  }, [
    viewMonth,
    viewYear,
    daysInMonth,
    character.currentDate,
    character.birthDate,
    character.careerStartDate,
    character.name,
    character.age,
    character.startAge,
    character.weight,
    character.homeCity,
    character.homeState,
    character.currentCity,
    character.currentCountry,
    character.maritalStatus,
    character.familySupport,
    character.dietPlan,
    character.injuries,
    character.socialContacts,
    character.isAlive,
    currentGym,
    currentJob
  ]);

  // Selected day's events
  const selectedDayEvents = eventsByDay.get(selectedDay) || [];

  const dayOfWeekNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header / Hero Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
              Gestão Temporal & Calendário Oficial
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
            Linha do Tempo & Calendário da Carreira
          </h1>
          <p className="text-xs md:text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Consulte meses anteriores ou futuros livremente para planejar competições e marcos da sua carreira. 
            O tempo de jogo só avança quando você aciona expressamente o botão de avanço mensal.
          </p>
        </div>

        {/* Quick Identity Box */}
        <div className="w-full md:w-auto flex flex-wrap gap-3 bg-neutral-950 p-3.5 sm:p-4 rounded-2xl border border-neutral-800 shrink-0 text-xs">
          <div className="pr-3 border-r border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Data Efetiva</span>
            <span className="font-extrabold text-amber-400 text-sm">
              {formatGameDate(character.currentDate, 'short')}
            </span>
            <span className="text-[10px] text-neutral-400 block">{getRealAthleteAge(character)} anos</span>
          </div>
          <div className="pl-2">
            {(() => {
              const locSummary = getPlayerLocationSummary(character);
              return (
                <>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                    {locSummary.hasRelocated ? 'Residência Atual' : 'Localidade & Origem'}
                  </span>
                  <span className="font-bold text-white flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    {locSummary.currentLabel}
                  </span>
                  {locSummary.hasRelocated && (
                    <span className="text-[10px] text-neutral-400 block">
                      Origem: {locSummary.originLabel}
                    </span>
                  )}
                  <span className="text-[10px] text-emerald-400 font-semibold block">
                    {formatCareerDuration(character.careerMonthsElapsed)}
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 2. Top Summary Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-neutral-800 rounded-xl text-xl">📍</div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase font-bold block">Data Atual do Jogo</span>
            <span className="font-black text-white text-sm block">
              {formatGameDate(character.currentDate, 'full')}
            </span>
            <span className="text-[10px] text-amber-400">Idade real: {getRealAthleteAge(character)} anos</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-pink-500/10 text-pink-400 rounded-xl text-xl border border-pink-500/20">🎂</div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase font-bold block">Data de Nascimento</span>
            <span className="font-black text-white text-sm block">
              {formatGameDate(character.birthDate, 'short')}
            </span>
            <span className="text-[10px] text-pink-300">Aniversário em {MONTH_NAMES[character.birthDate.month - 1]}</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl text-xl border border-cyan-500/20">🥋</div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase font-bold block">Início da Carreira</span>
            <span className="font-black text-white text-sm block">
              {formatGameDate(character.careerStartDate, 'short')}
            </span>
            <span className="text-[10px] text-cyan-300">Estreou aos {character.startAge} anos</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-xl border border-emerald-500/20">⏱️</div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase font-bold block">Tempo de Carreira</span>
            <span className="font-black text-emerald-400 text-sm block">
              {character.careerMonthsElapsed} {character.careerMonthsElapsed === 1 ? 'mês' : 'meses'}
            </span>
            <span className="text-[10px] text-neutral-400 truncate block">
              Ano {Math.floor(character.careerMonthsElapsed / 12) + 1} de Carreira
            </span>
          </div>
        </div>
      </div>

      {/* 3. Monthly Navigation Bar & Time Advance Action */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Navigation Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="min-h-[44px] px-3.5 py-2.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Consultar mês anterior (apenas visualização)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Mês Anterior</span>
          </button>

          {/* Current Month & Year Header */}
          <div className="text-center px-2 sm:px-4">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-base sm:text-lg md:text-xl font-black text-white">
                {MONTH_NAMES[viewMonth - 1]} de {viewYear}
              </h2>
            </div>
            <div>
              {isCurrentlyViewingGameMonth ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Mês Atual do Jogo
                </span>
              ) : viewYear < character.currentDate.year || (viewYear === character.currentDate.year && viewMonth < character.currentDate.month) ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
                  Histórico Passado (Consulta)
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
                  Temporada Futura (Consulta)
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="min-h-[44px] px-3.5 py-2.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Consultar próximo mês (apenas visualização)"
          >
            <span className="hidden sm:inline">Próximo Mês</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls: Reset to Game Date & Advance Month Button */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto justify-end">
          {!isCurrentlyViewingGameMonth && (
            <button
              type="button"
              onClick={handleResetToCurrent}
              className="min-h-[44px] flex-1 sm:flex-none px-3.5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Voltar a visualização para a data atual do jogo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Voltar ao Atual</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAdvanceMonthClick}
            className="min-h-[44px] flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            title="Avança 1 mês no jogo, processando salários, despesas e idade"
          >
            <FastForward className="w-4 h-4" />
            <span>Avançar Mês no Jogo</span>
          </button>
        </div>
      </div>

      {/* 4. Calendar Grid & Details View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Calendar Grid (2 Cols) */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1 px-1">
            <span className="font-bold text-neutral-300">
              Grade do Calendário — {MONTH_NAMES[viewMonth - 1]} / {viewYear}
            </span>
            <span className="text-[11px] text-neutral-500">
              Clique em qualquer dia para ver os compromissos
            </span>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs uppercase tracking-wider text-neutral-400 border-b border-neutral-800 pb-2">
            {dayOfWeekNames.map((dName, idx) => (
              <div 
                key={dName} 
                className={idx === 0 || idx === 6 ? 'text-amber-500/80 font-bold' : 'text-neutral-400'}
              >
                {dName}
              </div>
            ))}
          </div>

          {/* Calendar Days Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Leading blanks */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div
                key={`blank_${i}`}
                className="h-14 sm:h-24 rounded-xl sm:rounded-2xl bg-neutral-950/30 border border-neutral-850/40 opacity-30 pointer-events-none"
              />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = 
                viewYear === character.currentDate.year &&
                viewMonth === character.currentDate.month &&
                day === character.currentDate.day;

              const isSelected = selectedDay === day;
              const dayEvents = eventsByDay.get(day) || [];

              const hasTournament = dayEvents.some((e) => e.type === 'tournament');
              const hasBirthday = dayEvents.some((e) => e.type === 'birthday');
              const hasCareerStart = dayEvents.some((e) => e.type === 'career_start');
              const hasFinance = dayEvents.some(
                (e) => e.type === 'salary' || e.type === 'gym_fee' || e.type === 'living_cost'
              );

              return (
                <button
                  key={`day_${day}`}
                  type="button"
                  onClick={() => {
                    setSelectedDay(day);
                    sounds.playPunch(false);
                  }}
                  className={`h-14 sm:h-24 p-1 sm:p-2 rounded-xl sm:rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group ${
                    isToday
                      ? 'border-amber-400 bg-amber-500/10 shadow-md shadow-amber-500/10 ring-2 ring-amber-400/40'
                      : isSelected
                      ? 'border-neutral-500 bg-neutral-800 shadow-md'
                      : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 hover:bg-neutral-850'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span 
                      className={`text-[11px] sm:text-xs font-black rounded-md sm:rounded-lg px-1 sm:px-1.5 py-0.5 tabular-nums ${
                        isToday
                          ? 'bg-amber-400 text-neutral-950 font-black'
                          : isSelected
                          ? 'text-white font-black bg-neutral-700'
                          : 'text-neutral-300'
                      }`}
                    >
                      {day.toString().padStart(2, '0')}
                    </span>

                    {/* Small badges */}
                    <div className="hidden sm:flex gap-0.5 flex-wrap justify-end">
                      {hasBirthday && <span title="Aniversário" className="text-xs">🎂</span>}
                      {hasCareerStart && <span title="Início de Carreira" className="text-xs">🥋</span>}
                      {hasTournament && <span title="Torneio Oficial" className="text-xs">🏆</span>}
                      {hasFinance && <span title="Finanças / Mensalidade" className="text-xs">💵</span>}
                    </div>
                  </div>

                  {/* Mobile compact event dots */}
                  {dayEvents.length > 0 && (
                    <div className="flex sm:hidden items-center gap-0.5 flex-wrap">
                      {dayEvents.slice(0, 3).map((evt) => (
                        <span key={evt.id} className="text-[10px] leading-none">
                          {evt.icon}
                        </span>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[8px] text-amber-400 font-bold">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Desktop event summary text on cell */}
                  <div className="hidden sm:block w-full truncate text-[10px]">
                    {dayEvents.length > 0 ? (
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map((evt) => (
                          <div 
                            key={evt.id} 
                            className={`truncate rounded px-1 py-0.2 text-[9px] font-semibold ${evt.badgeColor}`}
                          >
                            {evt.icon} {evt.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[8px] text-neutral-400 font-bold block">
                            +{dayEvents.length - 2} mais
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-neutral-700 group-hover:text-neutral-500 text-[10px] block">
                        Treino regular
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Selected Day Details Panel (1 Col) */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl text-lg">
                🗓️
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
                  Compromissos do Dia Selecionado
                </span>
                <h3 className="text-base font-black text-white">
                  Dia {selectedDay.toString().padStart(2, '0')} de {MONTH_NAMES[viewMonth - 1]} de {viewYear}
                </h3>
              </div>
            </div>

            {/* List of events on this day */}
            <div className="mt-4 space-y-3">
              {selectedDayEvents.length === 0 ? (
                <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 text-center space-y-2">
                  <Dumbbell className="w-8 h-8 text-neutral-600 mx-auto" />
                  <div className="text-xs font-bold text-neutral-300">
                    Dia de Treino & Rotina do Tatame
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Nenhum torneio ou compromisso especial agendado para esta data. O lutador cumpre sua rotina técnica, preparação física e descanso.
                  </p>
                </div>
              ) : (
                selectedDayEvents.map((evt) => (
                  <div 
                    key={evt.id}
                    className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>{evt.icon}</span>
                        <span>{evt.title}</span>
                      </span>
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${evt.badgeColor}`}>
                        {evt.category}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {evt.description}
                    </p>

                    {evt.tournamentData && onSelectTournament && (
                      <div className="pt-2 border-t border-neutral-850 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onSelectTournament(evt.tournamentData!)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
                        >
                          Ver Pesagem & Regras
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Educational Note about time progression */}
          <div className="p-3.5 bg-neutral-950/70 border border-neutral-800/80 rounded-2xl text-[11px] text-neutral-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-neutral-200">Regra de Calendário:</strong> Navegar entre meses é apenas uma consulta visual para planejar sua carreira. Para que o lutador viva o próximo mês e receba seus rendimentos, clique em <span className="text-amber-400 font-bold">"Avançar Mês no Jogo"</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
