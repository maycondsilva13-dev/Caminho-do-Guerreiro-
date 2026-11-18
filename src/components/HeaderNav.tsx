import React, { useState, useEffect } from 'react';
import { Character } from '../types/game';
import { MARTIAL_ARTS_META } from '../data/martialArtsData';
import { formatGameDate, formatCareerDuration } from '../utils/dateUtils';
import { sounds } from '../utils/audio';
import { getDisplayBeltForGrad } from '../utils/bjjDegreeHelper';
import { BjjBeltVisual } from './BjjBeltVisual';
import {
  Dumbbell,
  Trophy,
  UserCheck,
  Globe2,
  Home,
  Share2,
  Volume2,
  VolumeX,
  FastForward,
  Coins,
  Scale,
  Brain,
  Zap,
  MapPin,
  Calendar,
  CalendarDays,
  Medal,
  ChevronRight,
  ShoppingBag
} from 'lucide-react';
import { INITIAL_TOURNAMENTS } from '../data/tournamentsData';
import { getTournamentTimelineInfo } from '../utils/tournamentTimeline';
import { getPlayerLocationSummary } from '../utils/regionalEconomyHelper';

export type ActiveTab =
  | 'ficha'
  | 'treino'
  | 'agenda'
  | 'loja'
  | 'campeonatos'
  | 'calendario'
  | 'rankings'
  | 'vida'
  | 'academias'
  | 'social';

export type MenuGroupId = 'lutador' | 'competicoes' | 'mundo';

export interface SubMenuItem {
  id: ActiveTab;
  label: string;
  mobileLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface MenuGroup {
  id: MenuGroupId;
  label: string;
  mobileLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  tabs: SubMenuItem[];
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'lutador',
    label: 'Lutador & Treino',
    mobileLabel: 'Lutador',
    icon: UserCheck,
    tabs: [
      { id: 'ficha', label: 'Lutador & Graduações', mobileLabel: 'Lutador', icon: UserCheck },
      { id: 'treino', label: 'Dojo & Treinos', mobileLabel: 'Treinos', icon: Dumbbell },
      { id: 'agenda', label: 'Agenda Semanal', mobileLabel: 'Agenda', icon: Calendar },
      { id: 'loja', label: 'Loja & Equipamentos', mobileLabel: 'Loja', icon: ShoppingBag }
    ]
  },
  {
    id: 'competicoes',
    label: 'Competições',
    mobileLabel: 'Competições',
    icon: Trophy,
    tabs: [
      { id: 'campeonatos', label: 'Campeonatos & Lutas', mobileLabel: 'Torneios', icon: Trophy },
      { id: 'calendario', label: 'Calendário Civil', mobileLabel: 'Calendário', icon: CalendarDays },
      { id: 'rankings', label: 'Rankings P4P', mobileLabel: 'Rankings', icon: Medal }
    ]
  },
  {
    id: 'mundo',
    label: 'Carreira & Mundo',
    mobileLabel: 'Mundo',
    icon: Globe2,
    tabs: [
      { id: 'vida', label: 'Vida, Ensino & Família', mobileLabel: 'Carreira', icon: Home },
      { id: 'academias', label: 'Academias & Capitais', mobileLabel: 'Academias', icon: Globe2 },
      { id: 'social', label: 'FighterNet & Rivais', mobileLabel: 'Social', icon: Share2 }
    ]
  }
];

export function getGroupForTab(tab: ActiveTab): MenuGroup {
  return MENU_GROUPS.find((g) => g.tabs.some((t) => t.id === tab)) || MENU_GROUPS[0];
}

interface Props {
  character: Character;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onAdvanceMonth: () => void;
  onAdvanceWeek?: () => void;
  onOpenBjjArena?: () => void;
  onOpenBoxingArena?: () => void;
}

export const HeaderNav: React.FC<Props> = ({
  character,
  activeTab,
  setActiveTab,
  onAdvanceMonth,
  onAdvanceWeek,
  onOpenBjjArena,
  onOpenBoxingArena
}) => {
  const [audioEnabled, setAudioEnabled] = useState(sounds.enabled);
  const [lastTabByGroup, setLastTabByGroup] = useState<Record<MenuGroupId, ActiveTab>>({
    lutador: 'ficha',
    competicoes: 'campeonatos',
    mundo: 'vida'
  });

  const activeGroup = getGroupForTab(activeTab);

  useEffect(() => {
    setLastTabByGroup((prev) => {
      if (prev[activeGroup.id] === activeTab) return prev;
      return { ...prev, [activeGroup.id]: activeTab };
    });
  }, [activeTab, activeGroup.id]);

  const toggleAudio = () => {
    sounds.enabled = !audioEnabled;
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) sounds.playPunch(false);
  };

  const primaryGrad = character.artGraduations[character.primaryArt];
  const artMeta = MARTIAL_ARTS_META[character.primaryArt];
  const locSummary = getPlayerLocationSummary(character);

  const hasReadyFight = INITIAL_TOURNAMENTS.some((t) => {
    const info = getTournamentTimelineInfo(t, character.currentDate, character);
    return info.canFight;
  });

  const handleAdvance = () => {
    sounds.playWhistle();
    if (onAdvanceMonth) {
      onAdvanceMonth();
    } else if (onAdvanceWeek) {
      onAdvanceWeek();
    }
  };

  const handleSelectGroup = (group: MenuGroup) => {
    sounds.playPunch(false);
    if (activeGroup.id === group.id) {
      // Se já estiver no grupo mas em um submenu secundário, volta para o submenu principal do grupo
      const primaryId = group.tabs[0].id;
      if (activeTab !== primaryId) {
        setActiveTab(primaryId);
      }
      return;
    }
    const targetTab = lastTabByGroup[group.id] || group.tabs[0].id;
    setActiveTab(targetTab);
  };

  const handleSelectSubTab = (tabId: ActiveTab) => {
    sounds.playPunch(false);
    setActiveTab(tabId);
  };

  const beltLabel = getDisplayBeltForGrad(character.primaryArt, primaryGrad);
  const shortDate = character.currentDate
    ? formatGameDate(character.currentDate, 'short')
    : `M${character.currentMonth}/${character.currentYear}`;

  return (
    <>
      {/* STICKY HEADER (Compact 54px on Mobile, Full Grouped Nav on Desktop) */}
      <header className="bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 sticky top-0 z-40 shadow-xl">
        {/* MOBILE COMPACT TOP BAR (< md) — Respects <=15% sticky surface budget */}
        <div className="md:hidden px-3 h-[54px] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleSelectSubTab('ficha')}
            className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-lg shrink-0 shadow-inner">
              {character.avatar}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-xs truncate">{character.name}</span>
                <span className="text-[10px] text-neutral-400 font-semibold shrink-0 tabular-nums">
                  {character.age}a
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                <span
                  className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-extrabold border border-white/15 truncate max-w-[120px]"
                  style={{
                    background: primaryGrad.gradientStyle || primaryGrad.color,
                    color: primaryGrad.textColor
                  }}
                >
                  {beltLabel}
                </span>
                <span className="text-[10px] text-emerald-400 font-extrabold tabular-nums shrink-0">
                  R$ {character.money.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleAudio}
              className="w-10 h-10 bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 rounded-xl border border-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
              aria-label={audioEnabled ? 'Mutar Sons' : 'Ativar Sons'}
            >
              {audioEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-neutral-500" />
              )}
            </button>

            <button
              type="button"
              onClick={handleAdvance}
              className="h-10 px-3 bg-gradient-to-r from-amber-500 to-amber-600 active:scale-[0.98] text-neutral-950 font-black text-[11px] uppercase tracking-wide rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Mês</span>
            </button>
          </div>
        </div>

        {/* DESKTOP TOP VITAL BAR (>= md) */}
        <div className="hidden md:flex max-w-7xl mx-auto px-4 py-2.5 flex-wrap items-center justify-between gap-3 text-xs border-b border-neutral-800/80">
          {/* Fighter Quick Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl shadow-inner shrink-0">
              {character.avatar}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-white text-sm">{character.name}</span>
                <span className="text-amber-400 font-semibold text-xs">"{character.nickname}"</span>
                <span className="text-[10px] bg-neutral-800 text-neutral-300 font-bold px-2 py-0.5 rounded-full border border-neutral-700 tabular-nums">
                  {character.age} anos ({character.age < 14 ? 'Infantil' : character.age < 18 ? 'Juvenil' : 'Adulto'})
                </span>
                <span
                  title={
                    locSummary.hasRelocated
                      ? `Residência atual: ${locSummary.currentLabel} | Origem: ${locSummary.originLabel}`
                      : `Localidade: ${locSummary.currentLabel}`
                  }
                  className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1 font-medium"
                >
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>{locSummary.currentLabel}</span>
                  {locSummary.hasRelocated && (
                    <span className="text-[9px] text-neutral-400">(Origem: {locSummary.originLabel})</span>
                  )}
                </span>
              </div>

              {/* Belt presentation */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {character.primaryArt === 'jiujitsu' ? (
                  <BjjBeltVisual
                    compact
                    rankIndex={primaryGrad.rankIndex}
                    stripes={primaryGrad.stripes}
                  />
                ) : null}
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border border-white/20 shadow-xs"
                  style={{ background: primaryGrad.gradientStyle || primaryGrad.color, color: primaryGrad.textColor }}
                >
                  {character.primaryArt === 'capoeira' ? '🪢' : '🥋'} {beltLabel}
                </span>
                <span className="text-neutral-400 text-[11px] font-medium">
                  {artMeta.name}
                </span>
              </div>
            </div>
          </div>

          {/* Calendar, Career Time, Finances & Health Meters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSelectSubTab('calendario')}
              className={`px-3 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                activeTab === 'calendario'
                  ? 'bg-amber-500/20 border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'bg-neutral-950/90 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
              }`}
              title="Abrir tela de Gestão do Calendário"
            >
              <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] uppercase font-bold">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>Calendário Civil</span>
              </div>
              <div className="font-extrabold text-amber-400 text-xs mt-0.5 tabular-nums">
                {character.currentDate ? formatGameDate(character.currentDate, 'full') : `Mês ${character.currentMonth} / ${character.currentYear}`}
              </div>
              <div className="text-[10px] text-neutral-400 font-medium">
                {formatCareerDuration(character.careerMonthsElapsed || 0)}
              </div>
            </button>

            <div className="flex items-center gap-1.5 bg-neutral-950/80 px-3 py-1.5 rounded-xl border border-neutral-800 tabular-nums">
              <Coins className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-bold block">Finanças</span>
                <span className="font-extrabold text-emerald-400 text-xs">R$ {character.money.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-neutral-950/80 px-3 py-1.5 rounded-xl border border-neutral-800 tabular-nums">
              <Scale className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-bold block">Balança</span>
                <span className="font-bold text-neutral-200 text-xs">{character.weight.toFixed(1)} kg</span>
                <span className="text-[9px] text-neutral-400 block truncate max-w-[90px]">{character.weightClass.split(' ')[0]}</span>
              </div>
            </div>

            <div className="w-24 bg-neutral-950/80 p-1.5 rounded-xl border border-neutral-800 tabular-nums">
              <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                <span className="flex items-center gap-1 text-cyan-400"><Zap className="w-3 h-3" /> Energia</span>
                <span className="text-neutral-300">{character.energy}%</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all rounded-full ${
                    character.energy > 50 ? 'bg-cyan-400' : character.energy > 20 ? 'bg-amber-400' : 'bg-red-500'
                  }`}
                  style={{ width: `${character.energy}%` }}
                />
              </div>
            </div>

            <div className="w-24 bg-neutral-950/80 p-1.5 rounded-xl border border-neutral-800 tabular-nums">
              <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                <span className="flex items-center gap-1 text-purple-400"><Brain className="w-3 h-3" /> Foco</span>
                <span className="text-neutral-300">{character.mentalHealth}%</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all rounded-full"
                  style={{ width: `${character.mentalHealth}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenBjjArena && (
                <button
                  type="button"
                  onClick={onOpenBjjArena}
                  className="px-2.5 py-2 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 border border-cyan-500/40 text-cyan-300 font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-cyan-900/20 cursor-pointer whitespace-nowrap"
                  title="Abrir Tatame Isométrico Especializado de Jiu-Jitsu"
                >
                  <span className="text-amber-400">🥋</span>
                  <span>Tatame BJJ</span>
                </button>
              )}

              {onOpenBoxingArena && (
                <button
                  type="button"
                  onClick={onOpenBoxingArena}
                  className="px-2.5 py-2 bg-gradient-to-r from-red-600/30 to-amber-600/30 hover:from-red-600/50 hover:to-amber-600/50 border border-amber-500/40 text-amber-300 font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-900/20 cursor-pointer whitespace-nowrap"
                  title="Abrir Ringue Isométrico Especializado de Boxe"
                >
                  <span>🥊</span>
                  <span>Ringue Boxe</span>
                </button>
              )}

              <button
                type="button"
                onClick={toggleAudio}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl border border-neutral-700 transition-colors cursor-pointer"
                title={audioEnabled ? 'Mutar Sons' : 'Ativar Sons'}
              >
                {audioEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
              </button>

              <button
                type="button"
                onClick={handleAdvance}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <FastForward className="w-4 h-4" />
                <span>Avançar Mês</span>
              </button>
            </div>
          </div>
        </div>

        {/* DESKTOP GROUPED NAVIGATION + SUBMENU (>= md) */}
        <div className="hidden md:block">
          {/* Primary Menu Groups */}
          <nav className="max-w-7xl mx-auto px-4 pt-2 pb-1.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {MENU_GROUPS.map((group, idx) => {
                const GroupIcon = group.icon;
                const isGroupActive = activeGroup.id === group.id;
                const showFightIndicator = group.id === 'competicoes' && hasReadyFight;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleSelectGroup(group)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                      isGroupActive
                        ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/15'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80 border border-transparent hover:border-neutral-700/60'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-black w-4 h-4 rounded-md flex items-center justify-center ${
                        isGroupActive ? 'bg-neutral-950/20 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <GroupIcon className={`w-4 h-4 ${isGroupActive ? 'text-neutral-950' : 'text-amber-400/80'}`} />
                    <span>{group.label}</span>
                    {showFightIndicator && (
                      <span
                        className={`w-2 h-2 rounded-full ${isGroupActive ? 'bg-neutral-950' : 'bg-emerald-400'}`}
                        title="Luta Oficial Pronta na Chave!"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 whitespace-nowrap">
              <span>{activeGroup.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
              <span className="text-amber-400 font-semibold">
                {activeGroup.tabs.find((t) => t.id === activeTab)?.label}
              </span>
            </div>
          </nav>

          {/* Contextual Submenu Bar */}
          <div className="bg-neutral-950/75 border-t border-neutral-800/80">
            <nav className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {activeGroup.tabs.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = activeTab === sub.id;
                const showFightIndicator = sub.id === 'campeonatos' && hasReadyFight;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSelectSubTab(sub.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isSubActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                        : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60 border border-transparent'
                    }`}
                  >
                    <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? 'text-amber-400' : 'text-neutral-500'}`} />
                    <span>{sub.label}</span>
                    {showFightIndicator && (
                      <span
                        className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        title="Luta Oficial Pronta na Chave!"
                      >
                        Luta Pronta
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* MOBILE NON-STICKY VITALS STRIP + CONTEXTUAL SUBMENU (< md) */}
      <div className="md:hidden bg-neutral-900/60 border-b border-neutral-800/80 px-3 py-2.5 space-y-2.5">
        {/* Compact Status Row (scrolls naturally, preserving viewport space) */}
        <div className="grid grid-cols-2 gap-2 text-[11px] tabular-nums">
          <button
            type="button"
            onClick={() => handleSelectSubTab('calendario')}
            className={`min-h-[44px] px-2.5 py-1.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
              activeTab === 'calendario'
                ? 'bg-amber-500/15 border-amber-500/40'
                : 'bg-neutral-950/90 border-neutral-800'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-neutral-400">
                <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{shortDate}</span>
              </div>
              <div className="text-[11px] font-bold text-white truncate">
                {locSummary.currentLabel}
              </div>
            </div>
            <span className="text-[10px] font-semibold text-neutral-400 shrink-0">
              {character.weight.toFixed(1)}kg
            </span>
          </button>

          <div className="min-h-[44px] px-2.5 py-1.5 rounded-xl bg-neutral-950/90 border border-neutral-800 flex flex-col justify-center gap-1">
            <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-cyan-400">
                <Zap className="w-3 h-3" /> {character.energy}%
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <Brain className="w-3 h-3" /> {character.mentalHealth}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    character.energy > 50 ? 'bg-cyan-400' : character.energy > 20 ? 'bg-amber-400' : 'bg-red-500'
                  }`}
                  style={{ width: `${character.energy}%` }}
                />
              </div>
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${character.mentalHealth}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submenu Bar for Current Group */}
        <div className="flex items-center gap-1.5">
          <div className={`flex-1 grid ${activeGroup.tabs.length >= 4 ? 'grid-cols-4' : 'grid-cols-3'} gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800`}>
            {activeGroup.tabs.map((sub) => {
              const SubIcon = sub.icon;
              const isSubActive = activeTab === sub.id;
              const showFightIndicator = sub.id === 'campeonatos' && hasReadyFight;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSelectSubTab(sub.id)}
                  className={`min-h-[40px] px-1.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer relative ${
                    isSubActive
                      ? 'bg-amber-500 text-neutral-950 font-black shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-neutral-950' : 'text-neutral-500'}`} />
                  <span className="truncate">{sub.mobileLabel}</span>
                  {showFightIndicator && (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${isSubActive ? 'bg-neutral-950' : 'bg-emerald-400'}`}
                      aria-label="Luta pronta"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {onOpenBjjArena && (
            <button
              type="button"
              onClick={onOpenBjjArena}
              className="min-h-[44px] px-2.5 bg-cyan-600/25 border border-cyan-500/40 text-cyan-300 font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-1 shrink-0 cursor-pointer"
              title="Abrir Tatame BJJ"
              aria-label="Abrir Tatame BJJ"
            >
              <span>🥋</span>
              <span>BJJ</span>
            </button>
          )}

          {onOpenBoxingArena && (
            <button
              type="button"
              onClick={onOpenBoxingArena}
              className="min-h-[44px] px-2.5 bg-amber-600/25 border border-amber-500/40 text-amber-300 font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-1 shrink-0 cursor-pointer"
              title="Abrir Ringue de Boxe"
              aria-label="Abrir Ringue de Boxe"
            >
              <span>🥊</span>
              <span>Boxe</span>
            </button>
          )}
        </div>
      </div>

      {/* MOBILE FIXED BOTTOM TAB BAR (Thumb-Zone Anchor for 3 Menu Groups) */}
      <nav
        aria-label="Menu principal mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 pb-safe shadow-[0_-6px_24px_rgba(0,0,0,0.45)]"
      >
        <div className="grid grid-cols-3 h-[58px] items-center">
          {MENU_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            const isGroupActive = activeGroup.id === group.id;
            const showFightIndicator = group.id === 'competicoes' && hasReadyFight;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => handleSelectGroup(group)}
                className={`h-full min-h-[44px] flex flex-col items-center justify-center gap-0.5 relative cursor-pointer transition-colors ${
                  isGroupActive ? 'text-amber-400' : 'text-neutral-400 active:text-neutral-200'
                }`}
              >
                {isGroupActive && (
                  <span className="absolute top-0 w-10 h-0.5 rounded-full bg-amber-400" />
                )}
                <div className="relative">
                  <GroupIcon className={`w-5 h-5 ${isGroupActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                  {showFightIndicator && (
                    <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-neutral-900" />
                  )}
                </div>
                <span className={`text-[11px] tracking-tight ${isGroupActive ? 'font-black text-amber-400' : 'font-semibold'}`}>
                  {group.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
