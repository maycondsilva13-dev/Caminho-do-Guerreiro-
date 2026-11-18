import React, { useMemo, useState } from 'react';
import { AgeCategory, Character, MartialArtType, RivalNPC, WealthTier, WeightClass } from '../types/game';
import { MARTIAL_ARTS_META, WEIGHT_CLASSES, WORLD_GYMS } from '../data/martialArtsData';
import {
  getAgeCategoryLabel,
  getFightingStyleLabel,
  getWealthTierInfo,
  upsertRivalInCharacter
} from '../data/worldFightersData';
import { computeWorldRankings, RankedFighterEntry } from '../utils/rankingHelper';
import { sounds } from '../utils/audio';
import {
  Medal,
  Trophy,
  Globe,
  Filter,
  Search,
  Sparkles,
  Building2,
  ArrowUpRight,
  Crown
} from 'lucide-react';

interface Props {
  character: Character;
  onUpdateCharacter: (updated: Character) => void;
}

const ALL_ARTS: MartialArtType[] = [
  'jiujitsu',
  'boxe',
  'muaythai',
  'karate',
  'judo',
  'capoeira',
  'lutalivre',
  'mma'
];

export const RankingsView: React.FC<Props> = ({ character, onUpdateCharacter }) => {
  const [mode, setMode] = useState<'p4p' | 'art'>('p4p');
  const [artFilter, setArtFilter] = useState<'todas' | MartialArtType>('todas');
  const [ageFilter, setAgeFilter] = useState<'todas' | AgeCategory>('todas');
  const [weightFilter, setWeightFilter] = useState<'todas' | WeightClass>('todas');
  const [genderFilter, setGenderFilter] = useState<'todas' | 'M' | 'F'>('todas');
  const [gymFilter, setGymFilter] = useState<'todas' | string>('todas');
  const [wealthFilter, setWealthFilter] = useState<'todas' | WealthTier>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleModeChange = (nextMode: 'p4p' | 'art') => {
    setMode(nextMode);
    if (nextMode === 'art' && artFilter === 'todas') {
      setArtFilter(character.primaryArt);
    } else if (nextMode === 'p4p') {
      setArtFilter('todas');
    }
  };

  const rankings = useMemo(
    () =>
      computeWorldRankings(character, {
        mode,
        art: artFilter,
        ageCategory: ageFilter,
        weightClass: weightFilter,
        gender: genderFilter,
        gymId: gymFilter,
        wealthTier: wealthFilter,
        searchQuery
      }),
    [character, mode, artFilter, ageFilter, weightFilter, genderFilter, gymFilter, wealthFilter, searchQuery]
  );

  const handleInteract = (entry: RankedFighterEntry, action: 'provocar' | 'sparring' | 'elogiar') => {
    if (entry.isPlayer || !entry.sourceRival) return;

    let updated = JSON.parse(JSON.stringify(character)) as Character;
    const clonedRival: RivalNPC = JSON.parse(JSON.stringify(entry.sourceRival));

    if (action === 'provocar') {
      clonedRival.relationshipScore = Math.max(-100, (clonedRival.relationshipScore ?? 0) - 25);
      updated.hype = Math.min(100, updated.hype + 12);
      updated.fame += 15;
      clonedRival.socialPost = `Está olhando para o ranking? Venha provar no tatame que merece dividir a chave comigo! 😤🔥`;
      sounds.playPunch(true);
      showFeedback(`🔥 Desafio lançado! Você provocou ${entry.name} (#${entry.p4pRank} P4P) e ganhou +12 de Hype!`);
    } else if (action === 'sparring') {
      if (updated.energy < 25) {
        showFeedback('⚠️ Energia insuficiente (mínimo 25%) para realizar sparring.');
        return;
      }
      updated.energy -= 25;
      clonedRival.relationshipScore = Math.min(100, (clonedRival.relationshipScore ?? 0) + 15);
      updated.attributes.fightIq = Math.round((updated.attributes.fightIq + 1.5) * 10) / 10;
      updated.honor = Math.min(100, updated.honor + 5);
      sounds.playPunch(false);
      showFeedback(`🥋 Sparring de alto nível com ${entry.name}! +1.5 QI de Luta e respeito mútuo.`);
    } else if (action === 'elogiar') {
      clonedRival.relationshipScore = Math.min(100, (clonedRival.relationshipScore ?? 0) + 20);
      updated.honor = Math.min(100, updated.honor + 10);
      sounds.playWhoosh();
      showFeedback(`🤝 Você reconheceu publicamente a trajetória de ${entry.name} (+10 Honra).`);
    }

    updated = upsertRivalInCharacter(updated, clonedRival);
    onUpdateCharacter(updated);
  };

  const resetFilters = () => {
    setMode('p4p');
    setArtFilter('todas');
    setAgeFilter('todas');
    setWeightFilter('todas');
    setGenderFilter('todas');
    setGymFilter('todas');
    setWealthFilter('todas');
    setSearchQuery('');
  };

  const { playerEntry, playerArtRank, playerWeightRank, allRankedCount, nextRivalAbove } = rankings;
  const pointsGap = nextRivalAbove ? Math.max(1, nextRivalAbove.score - playerEntry.score) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Medal className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
              Classificação Oficial das Federações & P4P
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
            Rankings Mundiais ({allRankedCount} Atletas)
          </h1>
          <p className="text-xs md:text-sm text-neutral-400 mt-1 max-w-2xl">
            Ranking dinâmico Pound-for-Pound e por modalidade. Todos os NPCs treinam, graduam, lutam e trocam de academia todos os meses de forma independente.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="w-full lg:w-auto grid grid-cols-2 lg:flex gap-2 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800 shrink-0">
          <button
            type="button"
            onClick={() => handleModeChange('p4p')}
            className={`min-h-[42px] px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'p4p' ? 'bg-amber-500 text-neutral-950 font-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>P4P Mundial</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('art')}
            className={`min-h-[42px] px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'art' ? 'bg-amber-500 text-neutral-950 font-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Por Arte Marcial</span>
          </button>
        </div>
      </div>

      {/* Player Standing Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-4">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Sua Posição P4P</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400">#{playerEntry.p4pRank}</span>
            <span className="text-xs text-neutral-400">de {allRankedCount}</span>
          </div>
          <span className="text-[11px] text-neutral-300 block mt-1 truncate">
            {playerEntry.score.toLocaleString('pt-BR')} pts de ranking
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">
            Posição em {MARTIAL_ARTS_META[playerEntry.art]?.name.split(' ')[0]}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-cyan-400">#{playerArtRank}</span>
            <span className="text-xs text-neutral-400">na modalidade</span>
          </div>
          <span className="text-[11px] text-neutral-300 block mt-1 truncate">{playerEntry.belt}</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Divisão de Peso</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-400">#{playerWeightRank}</span>
            <span className="text-xs text-neutral-400 truncate">{playerEntry.weightClass.split(' ')[0]}</span>
          </div>
          <span className="text-[11px] text-neutral-300 block mt-1">
            {playerEntry.record.wins}V - {playerEntry.record.losses}D ({playerEntry.avgAttr} méd.)
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Próximo Alvo Acima</span>
          {nextRivalAbove ? (
            <>
              <div className="text-sm font-black text-white mt-1 truncate flex items-center gap-1">
                <span>#{nextRivalAbove.filteredRank}</span>
                <span className="truncate">{nextRivalAbove.name}</span>
              </div>
              <span className="text-[11px] text-amber-300 flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Faltam {pointsGap} pts para ultrapassar
              </span>
            </>
          ) : (
            <div className="text-sm font-black text-amber-400 mt-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Líder Absoluto (#1)!
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-center text-sm font-bold text-amber-300">
          {feedback}
        </div>
      )}

      {/* Multi-Faceted Filter Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            Filtrar Classificação ({rankings.entries.length} exibidos)
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar nome, patrocinador, país..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <select
            value={artFilter}
            onChange={(e) => setArtFilter(e.target.value as 'todas' | MartialArtType)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="todas">Todas as Artes (8)</option>
            {ALL_ARTS.map((art) => (
              <option key={art} value={art}>
                {MARTIAL_ARTS_META[art].name}
              </option>
            ))}
          </select>

          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value as 'todas' | AgeCategory)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="todas">Todas as Faixas Etárias</option>
            <option value="infantil">{getAgeCategoryLabel('infantil')}</option>
            <option value="juvenil">{getAgeCategoryLabel('juvenil')}</option>
            <option value="adulto">{getAgeCategoryLabel('adulto')}</option>
            <option value="master">{getAgeCategoryLabel('master')}</option>
          </select>

          <select
            value={weightFilter}
            onChange={(e) => setWeightFilter(e.target.value as 'todas' | WeightClass)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="todas">Todas as Categorias de Peso</option>
            {WEIGHT_CLASSES.map((wc) => (
              <option key={wc.name} value={wc.name}>
                {wc.name}
              </option>
            ))}
          </select>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as 'todas' | 'M' | 'F')}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="todas">Sexo: Todos (Masculino & Feminino)</option>
            <option value="F">♀ Divisão Feminina</option>
            <option value="M">♂ Divisão Masculina</option>
          </select>

          <select
            value={gymFilter}
            onChange={(e) => setGymFilter(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="todas">Todas as Academias Mundiais</option>
            {WORLD_GYMS.map((gym) => (
              <option key={gym.id} value={gym.id}>
                {gym.flag} {gym.name}
              </option>
            ))}
          </select>

          <select
            value={wealthFilter}
            onChange={(e) => setWealthFilter(e.target.value as 'todas' | WealthTier)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="todas">Todos os Perfis Financeiros</option>
            <option value="milionario">💎 Milionário / Patrocínio Global</option>
            <option value="abastado">💰 Abastado / Camp de Elite</option>
            <option value="classe_media">🏠 Atleta Regular</option>
            <option value="humilde">🔥 Origem Humilde / Raiz</option>
          </select>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-[11px] text-neutral-400 flex items-center justify-between">
            <span>Critério:</span>
            <span className="text-amber-400 font-bold">Cartel + Graduação + Fama</span>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      {rankings.entries.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-sm text-neutral-400">
          Nenhum atleta encontrado com essa combinação de filtros.
        </div>
      ) : (
        <div className="space-y-2.5">
          {rankings.entries.map((entry) => {
            const artMeta = MARTIAL_ARTS_META[entry.art] || MARTIAL_ARTS_META.lutalivre;
            const rankColor = artMeta?.ranks?.[entry.rankIndex]?.color || '#f59e0b';
            const styleInfo = getFightingStyleLabel(entry.fightingStyle);
            const wealthInfo = getWealthTierInfo(entry.wealthTier);

            const medalBadge =
              entry.filteredRank === 1
                ? '🥇'
                : entry.filteredRank === 2
                ? '🥈'
                : entry.filteredRank === 3
                ? '🥉'
                : null;

            return (
              <div
                key={entry.id}
                className={`rounded-2xl p-4 border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  entry.isPlayer
                    ? 'bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 border-amber-500 shadow-lg shadow-amber-500/10'
                    : entry.filteredRank <= 3
                    ? 'bg-neutral-900 border-amber-500/30'
                    : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Left: Rank Position + Identity */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-14 shrink-0 text-center bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-1">
                    <div className="text-base font-black text-amber-400 leading-none">
                      {medalBadge ? `${medalBadge} ` : ''}#{entry.filteredRank}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-bold mt-1">
                      P4P #{entry.p4pRank}
                    </div>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl shrink-0">
                    {entry.avatar}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-white text-sm sm:text-base truncate">
                        {entry.name}
                      </span>
                      {entry.isPlayer && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950">
                          VOCÊ
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          entry.gender === 'F'
                            ? 'bg-pink-500/15 text-pink-300 border-pink-500/30'
                            : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        }`}
                      >
                        {entry.gender === 'F' ? '♀ Feminino' : '♂ Masculino'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${wealthInfo.badgeClass}`}>
                        {wealthInfo.shortLabel}
                      </span>
                    </div>

                    {/* Belt & Art & Weight */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="inline-flex items-center gap-1.5 font-bold text-neutral-200">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/25 inline-block"
                          style={{ backgroundColor: rankColor }}
                        />
                        {entry.belt}
                      </span>
                      <span className="text-neutral-500">•</span>
                      <span className="text-amber-300 font-semibold">{artMeta.name}</span>
                      <span className="text-neutral-500">•</span>
                      <span className="text-neutral-300">
                        {entry.age}a ({entry.ageCategory.toUpperCase()})
                      </span>
                      <span className="text-neutral-500">•</span>
                      <span className="text-emerald-300 font-medium">
                        {entry.weight.toFixed(1)} kg ({entry.weightClass.split(' ')[0]})
                      </span>
                    </div>

                    {/* Style + Gym + Sponsor + Transfer */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className={`px-2 py-0.5 rounded-md border font-semibold ${styleInfo.colorClass}`}>
                        {styleInfo.label}
                      </span>
                      <span className="text-neutral-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-amber-400" />
                        {entry.gymName} ({entry.city}, {entry.country})
                      </span>
                      {entry.sponsorName && (
                        <span className="text-cyan-300 font-semibold">
                          • Patrocínio: {entry.sponsorName}
                        </span>
                      )}
                    </div>

                    {entry.lastGymTransferNote && (
                      <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {entry.lastGymTransferNote}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Stats, Points & Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-2.5 shrink-0 border-t lg:border-t-0 border-neutral-800 pt-3 lg:pt-0">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-left lg:text-right">
                      <span className="text-[10px] uppercase text-neutral-500 font-bold block">Cartel</span>
                      <span className="font-black text-white">
                        {entry.record.wins}V - {entry.record.losses}D
                      </span>
                      <span className="text-[10px] text-neutral-400 block">
                        {entry.record.kos} KO • {entry.record.subs} SUB
                      </span>
                    </div>

                    <div className="text-left lg:text-right">
                      <span className="text-[10px] uppercase text-neutral-500 font-bold block">Poder / Fama</span>
                      <span className="font-bold text-neutral-200">Méd {entry.avgAttr}</span>
                      <span className="text-[10px] text-neutral-400 block">{entry.reputation} Fama</span>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-right">
                      <span className="text-[10px] uppercase text-neutral-500 font-bold block">Pontos</span>
                      <span className="text-sm font-black text-amber-400">
                        {entry.score.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {!entry.isPlayer && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleInteract(entry, 'provocar')}
                        className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900/60 text-red-300 font-bold text-[10px] rounded-lg border border-red-800/50 transition-colors cursor-pointer"
                      >
                        Provocar 🔥
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInteract(entry, 'sparring')}
                        className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-[10px] rounded-lg border border-neutral-700 transition-colors cursor-pointer"
                      >
                        Sparring 🥋
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInteract(entry, 'elogiar')}
                        className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 font-bold text-[10px] rounded-lg border border-emerald-800/50 transition-colors cursor-pointer"
                      >
                        Elogiar 🤝
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
