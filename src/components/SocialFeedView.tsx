import React, { useMemo, useState } from 'react';
import { AgeCategory, Character, MartialArtType, RivalNPC, WealthTier, WeightClass } from '../types/game';
import { MARTIAL_ARTS_META, WEIGHT_CLASSES, WORLD_GYMS } from '../data/martialArtsData';
import {
  getAgeCategoryFromAge,
  getAgeCategoryLabel,
  getFightingStyleLabel,
  getMergedWorldFighters,
  getWealthTierInfo,
  getWeightClassFromWeight,
  upsertRivalInCharacter
} from '../data/worldFightersData';
import { sounds } from '../utils/audio';
import {
  Share2,
  MessageSquare,
  Heart,
  Send,
  Swords,
  Search,
  Globe,
  Filter,
  Users
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

export const SocialFeedView: React.FC<Props> = ({
  character,
  onUpdateCharacter
}) => {
  const [newPostText, setNewPostText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filtros do Diretório Mundial de Lutadores
  const [viewMode, setViewMode] = useState<'mundo' | 'rivais'>('mundo');
  const [artFilter, setArtFilter] = useState<'todas' | MartialArtType>('todas');
  const [ageFilter, setAgeFilter] = useState<'todas' | AgeCategory>('todas');
  const [weightFilter, setWeightFilter] = useState<'todas' | WeightClass>('todas');
  const [genderFilter, setGenderFilter] = useState<'todas' | 'M' | 'F'>('todas');
  const [wealthFilter, setWealthFilter] = useState<'todas' | WealthTier>('todas');
  const [gymFilter, setGymFilter] = useState<'todas' | string>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3200);
  };

  const allWorldFighters = useMemo(
    () => getMergedWorldFighters(character),
    [character]
  );

  const trackedRivalIds = useMemo(
    () => new Set((character.rivals || []).map((r) => r.id)),
    [character.rivals]
  );

  const filteredFighters = useMemo(() => {
    const baseList =
      viewMode === 'rivais'
        ? allWorldFighters.filter((f) => trackedRivalIds.has(f.id))
        : allWorldFighters;

    const q = searchQuery.trim().toLowerCase();

    return baseList.filter((f) => {
      if (artFilter !== 'todas' && f.art !== artFilter) return false;
      const fAgeCat = f.ageCategory || getAgeCategoryFromAge(f.age);
      if (ageFilter !== 'todas' && fAgeCat !== ageFilter) return false;
      const fWeightClass = f.weightClass || getWeightClassFromWeight(f.weight);
      if (weightFilter !== 'todas' && fWeightClass !== weightFilter) return false;
      if (genderFilter !== 'todas' && (f.gender || 'M') !== genderFilter) return false;
      if (wealthFilter !== 'todas' && (f.wealthTier || 'classe_media') !== wealthFilter) return false;
      if (gymFilter !== 'todas' && (f.gymId || 'gym_bairro') !== gymFilter) return false;
      if (q) {
        const artName = MARTIAL_ARTS_META[f.art]?.name || f.art;
        const hay = `${f.name} ${f.nickname} ${f.belt} ${f.gymName || ''} ${f.country || ''} ${f.city || ''} ${f.sponsorName || ''} ${artName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    allWorldFighters,
    viewMode,
    trackedRivalIds,
    artFilter,
    ageFilter,
    weightFilter,
    genderFilter,
    wealthFilter,
    gymFilter,
    searchQuery
  ]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const updated = JSON.parse(JSON.stringify(character)) as Character;
    const newPost = {
      id: `post_${Date.now()}`,
      author: `${character.name} "${character.nickname}"`,
      handle: `@${character.nickname.toLowerCase().replace(/\s+/g, '_')}_fighter`,
      text: newPostText.trim(),
      time: 'Agora mesmo',
      likes: Math.floor(character.fame * 1.5 + Math.random() * 20 + 5),
      verified: character.fame > 100
    };

    updated.socialFeed.unshift(newPost);
    updated.hype = Math.min(100, updated.hype + 5);
    updated.fame += 10;
    setNewPostText('');
    sounds.playPunch(false);
    showFeedback('📱 Publicado no FighterGram! Ganhou +5 de Hype e novos seguidores!');
    onUpdateCharacter(updated);
  };

  const handleInteractRival = (rival: RivalNPC, action: 'provocar' | 'sparring' | 'elogiar') => {
    let updated = JSON.parse(JSON.stringify(character)) as Character;
    const clonedRival: RivalNPC = JSON.parse(JSON.stringify(rival));

    if (action === 'provocar') {
      clonedRival.relationshipScore = Math.max(-100, (clonedRival.relationshipScore ?? 0) - 25);
      updated.hype = Math.min(100, updated.hype + 12);
      updated.fame += 15;
      clonedRival.socialPost = `Quem é esse comédia me marcando? Vou te apagar no primeiro round que a gente cruzar! 😤🔥`;
      sounds.playPunch(true);
      showFeedback(`🔥 Clima quente! Você provocou ${rival.name}! A rivalidade explodiu na internet (+Hype)!`);
    } else if (action === 'sparring') {
      if (updated.energy < 25) {
        showFeedback('⚠️ Você está sem energia para um treino extra com esse atleta.');
        return;
      }
      updated.energy -= 25;
      clonedRival.relationshipScore = Math.min(100, (clonedRival.relationshipScore ?? 0) + 15);
      updated.attributes.fightIq = Math.round((updated.attributes.fightIq + 1.5) * 10) / 10;
      updated.honor = Math.min(100, updated.honor + 5);
      sounds.playPunch(false);
      showFeedback(`🤝 Sparring técnico produtivo com ${rival.name}! Vocês trocaram experiências e o respeito mútuo cresceu.`);
    } else if (action === 'elogiar') {
      clonedRival.relationshipScore = Math.min(100, (clonedRival.relationshipScore ?? 0) + 20);
      updated.honor = Math.min(100, updated.honor + 10);
      sounds.playWhoosh();
      showFeedback(`🥋 Postura exemplar de artista marcial! Você demonstrou respeito ao caminho de ${rival.name}.`);
    }

    updated = upsertRivalInCharacter(updated, clonedRival);
    onUpdateCharacter(updated);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-pink-500/20 text-pink-400 rounded-lg border border-pink-500/30">
              <Share2 className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase tracking-widest text-pink-400 font-bold">Comunidade, Circuito Mundial & Mídia</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">FighterNet & Circuito Mundial ({allWorldFighters.length} Atletas)</h1>
          <p className="text-xs md:text-sm text-neutral-400 mt-1 max-w-2xl">
            Explore os competidores ativos do mundo divididos por arte marcial, graduação, categoria etária e peso. Interaja com qualquer atleta para construir alianças ou rivalidades.
          </p>
        </div>

        <div className="w-full md:w-auto grid grid-cols-3 gap-3 bg-neutral-950 p-3.5 sm:p-4 rounded-xl border border-neutral-800 text-center shrink-0 tabular-nums">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Fama</span>
            <span className="text-lg sm:text-xl font-black text-white">{character.fame.toLocaleString('pt-BR')}</span>
          </div>
          <div className="border-l border-neutral-800 pl-3">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Hype</span>
            <span className="text-lg sm:text-xl font-black text-amber-400">{character.hype}%</span>
          </div>
          <div className="border-l border-neutral-800 pl-3">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Honra</span>
            <span className="text-lg sm:text-xl font-black text-emerald-400">{character.honor}%</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-center text-sm font-bold text-amber-300 animate-fadeIn">
          {feedback}
        </div>
      )}

      {/* Main Split: World Fighters Directory (7 cols) vs Social Feed (5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Circuito Mundial & Rivais */}
        <div className="xl:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm uppercase tracking-wider font-bold text-neutral-300 flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              Atletas do Circuito ({filteredFighters.length} de {viewMode === 'rivais' ? trackedRivalIds.size : allWorldFighters.length})
            </h2>

            <div className="w-full sm:w-auto grid grid-cols-2 sm:flex gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setViewMode('mundo')}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  viewMode === 'mundo'
                    ? 'bg-amber-500 text-neutral-950 font-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Circuito ({allWorldFighters.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('rivais')}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  viewMode === 'rivais'
                    ? 'bg-amber-500 text-neutral-950 font-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Swords className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Rivais ({trackedRivalIds.size})</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              Filtros por Modalidade, Faixa Etária e Categoria de Peso
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nome, academia, país..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Art Filter */}
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

              {/* Age Category Filter */}
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value as 'todas' | AgeCategory)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="todas">Todas as Idades</option>
                <option value="infantil">{getAgeCategoryLabel('infantil')}</option>
                <option value="juvenil">{getAgeCategoryLabel('juvenil')}</option>
                <option value="adulto">{getAgeCategoryLabel('adulto')}</option>
                <option value="master">{getAgeCategoryLabel('master')}</option>
              </select>

              {/* Weight Filter */}
              <select
                value={weightFilter}
                onChange={(e) => setWeightFilter(e.target.value as 'todas' | WeightClass)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="todas">Todos os Pesos</option>
                {WEIGHT_CLASSES.map((wc) => (
                  <option key={wc.name} value={wc.name}>
                    {wc.name}
                  </option>
                ))}
              </select>

              {/* Gender Filter */}
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as 'todas' | 'M' | 'F')}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="todas">Sexo: Todos</option>
                <option value="F">♀ Feminino</option>
                <option value="M">♂ Masculino</option>
              </select>

              {/* Wealth Filter */}
              <select
                value={wealthFilter}
                onChange={(e) => setWealthFilter(e.target.value as 'todas' | WealthTier)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="todas">Perfil Financeiro: Todos</option>
                <option value="milionario">💎 Milionário</option>
                <option value="abastado">💰 Abastado</option>
                <option value="classe_media">🏠 Regular</option>
                <option value="humilde">🔥 Raiz / Humilde</option>
              </select>

              {/* Gym Filter */}
              <select
                value={gymFilter}
                onChange={(e) => setGymFilter(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 sm:col-span-2"
              >
                <option value="todas">Todas as Academias ({WORLD_GYMS.length})</option>
                {WORLD_GYMS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.flag} {g.name} ({g.uf ? `${g.city}/${g.uf}` : g.country})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fighters Grid */}
          {filteredFighters.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-sm text-neutral-400">
              Nenhum atleta encontrado com os filtros selecionados. Limpe algum filtro para ver outros competidores.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[820px] overflow-y-auto pr-1">
              {filteredFighters.map((rival) => {
                const relScore = rival.relationshipScore ?? 0;
                const relStatus =
                  relScore < -30 ? 'Inimigo Jurado' :
                  relScore < 0 ? 'Rival Provocador' :
                  relScore > 40 ? 'Parceiro de Treino' : 'Atleta do Circuito';

                const relColor =
                  relScore < -30 ? 'text-red-400 border-red-900/50' :
                  relScore < 0 ? 'text-amber-400 border-amber-900/50' :
                  relScore > 40 ? 'text-emerald-400 border-emerald-900/50' :
                  'text-neutral-400 border-neutral-800';

                const artMeta = MARTIAL_ARTS_META[rival.art] || MARTIAL_ARTS_META.lutalivre;
                const rankColor =
                  rival.rankIndex !== undefined && artMeta?.ranks?.[rival.rankIndex]
                    ? artMeta.ranks[rival.rankIndex].color
                    : '#f59e0b';
                const ageCat = rival.ageCategory || getAgeCategoryFromAge(rival.age);
                const wClass = rival.weightClass || getWeightClassFromWeight(rival.weight);
                const styleInfo = getFightingStyleLabel(rival.fightingStyle);
                const wealthInfo = getWealthTierInfo(rival.wealthTier);

                return (
                  <div key={rival.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl p-1.5 bg-neutral-800 rounded-xl shrink-0">{rival.avatar}</span>
                          <div className="min-w-0">
                            <h3 className="font-black text-white text-sm truncate flex items-center gap-1.5">
                              <span className="truncate">{rival.name}</span>
                              <span className={rival.gender === 'F' ? 'text-pink-400 text-xs shrink-0' : 'text-sky-400 text-xs shrink-0'}>
                                {rival.gender === 'F' ? '♀' : '♂'}
                              </span>
                            </h3>
                            <div className="flex items-center gap-1.5 text-[11px] text-neutral-300 font-semibold truncate">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block shrink-0 border border-white/20"
                                style={{ backgroundColor: rankColor }}
                              />
                              <span className="truncate">{rival.belt}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-neutral-950 border shrink-0 ${relColor}`}>
                          {relStatus}
                        </span>
                      </div>

                      {/* Badges: Arte, Idade, Peso, Estilo, Perfil Financeiro */}
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25">
                          {artMeta.name.split(' ')[0]}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-neutral-950 text-neutral-300 border border-neutral-800">
                          {rival.age}a ({ageCat.toUpperCase()})
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-neutral-950 text-emerald-300 border border-neutral-800">
                          {rival.weight.toFixed(1)} kg • {wClass.split(' ')[0]}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md border ${styleInfo.colorClass}`}>
                          {styleInfo.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md border ${wealthInfo.badgeClass}`}>
                          {wealthInfo.shortLabel}
                        </span>
                      </div>

                      {(rival.gymName || rival.country) && (
                        <div className="text-[11px] text-neutral-400 truncate">
                          🏟️ {rival.gymName || 'Academia Independente'} • {rival.city ? `${rival.city}, ` : ''}{rival.country || 'Brasil'}
                          {rival.sponsorName ? <span className="text-cyan-300"> • 🏆 {rival.sponsorName}</span> : null}
                        </div>
                      )}

                      {rival.lastGymTransferNote && (
                        <div className="text-[10px] text-emerald-400 font-semibold truncate">
                          ✈️ {rival.lastGymTransferNote}
                        </div>
                      )}

                      {rival.socialPost && (
                        <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800/80 text-xs text-neutral-300 italic line-clamp-2">
                          "{rival.socialPost}"
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between text-[11px] text-neutral-400 border-t border-neutral-800 pt-2">
                        <span>
                          Cartel: <strong className="text-white">{rival.record.wins}V - {rival.record.losses}D</strong>
                          {rival.record.subs > 0 ? ` (${rival.record.subs} SUB)` : rival.record.kos > 0 ? ` (${rival.record.kos} KO)` : ''}
                        </span>
                        <span>Téc: {rival.attributes.technique} | QI: {rival.attributes.fightIq}</span>
                      </div>

                      {/* Actions with Rival */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleInteractRival(rival, 'provocar')}
                          className="py-1 px-2 bg-red-950/60 hover:bg-red-900/60 text-red-300 font-bold text-[10px] rounded-lg border border-red-800/50 transition-colors cursor-pointer"
                        >
                          Provocar 🔥
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInteractRival(rival, 'sparring')}
                          className="py-1 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-[10px] rounded-lg border border-neutral-700 transition-colors cursor-pointer"
                        >
                          Sparring 🥋
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInteractRival(rival, 'elogiar')}
                          className="py-1 px-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 font-bold text-[10px] rounded-lg border border-emerald-800/50 transition-colors cursor-pointer"
                        >
                          Elogiar 🤝
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: FighterGram Post & Timeline */}
        <div className="xl:col-span-4 space-y-4">
          <h2 className="text-sm uppercase tracking-wider font-bold text-neutral-400 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-pink-400" /> Feed da Comunidade & Mídia
          </h2>

          {/* New Post Creator */}
          <form onSubmit={handleCreatePost} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex gap-2.5 items-center">
              <span className="text-2xl p-1.5 bg-neutral-800 rounded-xl shrink-0">{character.avatar}</span>
              <input
                type="text"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="Escreva para mídia e torcida..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500 min-w-0"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                Postar
              </button>
            </div>
          </form>

          {/* Timeline Feed */}
          <div className="space-y-3 max-h-[780px] overflow-y-auto pr-1">
            {character.socialFeed.map((post) => (
              <div key={post.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-white text-xs truncate">{post.author}</span>
                    <span className="text-neutral-500 text-[11px] truncate">{post.handle}</span>
                    {post.verified && (
                      <span className="text-blue-400 text-xs shrink-0" title="Verificado">✓</span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-500 shrink-0">{post.time}</span>
                </div>

                <p className="text-xs text-neutral-200 leading-relaxed">{post.text}</p>

                <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1 text-pink-400">
                    <Heart className="w-3.5 h-3.5 fill-pink-400" /> {post.likes} curtidas
                  </span>
                  <span className="text-neutral-500">Mídia Oficial de Lutas</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

