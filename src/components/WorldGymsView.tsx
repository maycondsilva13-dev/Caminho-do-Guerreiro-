import React, { useMemo, useState } from 'react';
import { BrazilUF, Character, Gym, RivalNPC } from '../types/game';
import { MARTIAL_ARTS_META, WORLD_GYMS } from '../data/martialArtsData';
import { BRAZIL_STATES } from '../data/brazilLocations';
import {
  getFightingStyleLabel,
  getMergedWorldFighters,
  getWealthTierInfo
} from '../data/worldFightersData';
import { sounds } from '../utils/audio';
import {
  relocatePlayerToCapital,
  resolveEffectiveGymLocation,
  validateTravelAuthorization
} from '../utils/recoveryHelper';
import {
  estimateTravelLogistics,
  resolveBrazilCapitalByCity,
  resolveBrazilCapitalByUf
} from '../utils/regionalGeographyHelper';
import {
  getPlayerLocationSummary,
  resolveActiveEconomicContext
} from '../utils/regionalEconomyHelper';
import {
  getCompetitiveScholarshipDiscount,
  getGymRivalries
} from '../utils/regionalGymsHelper';
import {
  Globe2,
  MapPin,
  Plane,
  Check,
  UserCheck,
  AlertTriangle,
  Users,
  ArrowRightLeft,
  Building2,
  Search,
  ShieldCheck,
  Home
} from 'lucide-react';
import { PlayerAcademyPanel } from './PlayerAcademyPanel';
import { getEligibleProfessorArts } from '../utils/playerAcademyHelper';

interface Props {
  character: Character;
  onUpdateCharacter: (updated: Character) => void;
}

const QUALITY_TIER_META: Record<
  NonNullable<Gym['qualityTier']> | 'default',
  { label: string; className: string }
> = {
  social: {
    label: 'Projeto Social (Grátis)',
    className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
  },
  convencional: {
    label: 'Academia Convencional',
    className: 'bg-teal-500/15 text-teal-300 border-teal-500/40'
  },
  bairro: {
    label: 'Raiz Comunitária',
    className: 'bg-neutral-800 text-neutral-300 border-neutral-700'
  },
  competitiva: {
    label: 'Centro Competitivo',
    className: 'bg-sky-500/15 text-sky-300 border-sky-500/40'
  },
  elite: {
    label: 'Alto Rendimento',
    className: 'bg-amber-500/15 text-amber-300 border-amber-500/40'
  },
  mundial: {
    label: 'Polo Mundial',
    className: 'bg-purple-500/15 text-purple-300 border-purple-500/40'
  },
  default: {
    label: 'Academia Oficial',
    className: 'bg-neutral-800 text-neutral-300 border-neutral-700'
  }
};

const INFRA_LEVEL_LABELS: Record<NonNullable<Gym['infrastructureLevel']>, string> = {
  basica: 'Estrutura Comunitária',
  convencional: 'Estrutura Convencional',
  avancada: 'Estrutura Avançada',
  alto_rendimento: 'Alto Rendimento',
  olimpica: 'Complexo Olímpico/Mundial'
};

export const WorldGymsView: React.FC<Props> = ({
  character,
  onUpdateCharacter
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [expandedGymId, setExpandedGymId] = useState<string | null>(null);
  const [gymViewMode, setGymViewMode] = useState<'mundo' | 'minha_academia'>('mundo');

  const isCurrentlyInBrazil = (character.currentCountry || 'Brasil') === 'Brasil';
  const playerCapital = useMemo(
    () => resolveBrazilCapitalByCity(character.currentCity || character.homeCity, character.homeState || 'SP'),
    [character.currentCity, character.homeCity, character.homeState]
  );

  const [regionScope, setRegionScope] = useState<'minha_capital' | 'brasil' | 'exterior' | 'todas'>(
    isCurrentlyInBrazil ? 'minha_capital' : 'exterior'
  );
  const [selectedUfFilter, setSelectedUfFilter] = useState<'todas' | BrazilUF>('todas');
  const [selectedTierFilter, setSelectedTierFilter] = useState<'todos' | NonNullable<Gym['qualityTier']>>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRelocationPanel, setShowRelocationPanel] = useState(false);
  const [relocateTargetUf, setRelocateTargetUf] = useState<BrazilUF>(() =>
    playerCapital.uf === 'SP' ? 'RJ' : 'SP'
  );
  const locSummary = useMemo(() => getPlayerLocationSummary(character), [character]);
  const activeEco = useMemo(() => resolveActiveEconomicContext(character), [character]);

  const hasEligibleProfArt = useMemo(
    () => getEligibleProfessorArts(character).some((e) => e.eligible),
    [character]
  );

  const currentGymObj = useMemo(
    () => WORLD_GYMS.find((g) => g.id === character.currentGymId) || WORLD_GYMS[0],
    [character.currentGymId]
  );

  const currentGymName =
    character.playerAcademy && character.currentGymId === character.playerAcademy.id
      ? character.playerAcademy.name
      : currentGymObj.name;

  const currentGymCity = useMemo(() => {
    if (character.playerAcademy && character.currentGymId === character.playerAcademy.id) {
      return `${character.playerAcademy.city}, ${character.playerAcademy.country}`;
    }
    const loc = resolveEffectiveGymLocation(currentGymObj, character);
    return loc.uf ? `${loc.city} (${loc.uf}), ${loc.country}` : `${loc.city}, ${loc.country}`;
  }, [character, currentGymObj]);

  const worldFighters = useMemo(() => getMergedWorldFighters(character), [character]);

  const athletesByGym = useMemo(() => {
    const map = new Map<string, RivalNPC[]>();
    for (const gym of WORLD_GYMS) {
      map.set(gym.id, []);
    }
    for (const fighter of worldFighters) {
      const targetGymId = fighter.gymId && map.has(fighter.gymId) ? fighter.gymId : 'gym_bairro';
      map.get(targetGymId)!.push(fighter);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
    }
    return map;
  }, [worldFighters]);

  const filteredGyms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return WORLD_GYMS.filter((gym) => {
      const loc = resolveEffectiveGymLocation(gym, character);

      if (regionScope === 'minha_capital') {
        if (isCurrentlyInBrazil) {
          if (loc.country !== 'Brasil' || loc.city !== playerCapital.capital) return false;
        } else {
          if (loc.country !== character.currentCountry) return false;
        }
      } else if (regionScope === 'brasil') {
        if (loc.country !== 'Brasil' || gym.id === 'gym_bairro') return false;
        if (selectedUfFilter !== 'todas' && loc.uf !== selectedUfFilter) return false;
      } else if (regionScope === 'exterior') {
        if (loc.country === 'Brasil') return false;
      }

      if (selectedTierFilter !== 'todos' && gym.qualityTier !== selectedTierFilter) {
        return false;
      }

      if (q) {
        const instNames = (gym.instructors || []).map((i) => i.name).join(' ');
        const hay = `${gym.name} ${gym.teamName || ''} ${loc.city} ${loc.uf || ''} ${gym.country} ${gym.masterName} ${instNames} ${gym.focusArts.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [character, isCurrentlyInBrazil, playerCapital.capital, regionScope, selectedUfFilter, selectedTierFilter, searchQuery]);

  const recentTransfers = useMemo(
    () =>
      worldFighters
        .filter((f) => Boolean(f.lastGymTransferNote))
        .sort((a, b) => (b.reputation || 0) - (a.reputation || 0))
        .slice(0, 6),
    [worldFighters]
  );

  const handleEnrollGym = (gym: Gym) => {
    if (character.currentGymId === gym.id) return;

    const auth = validateTravelAuthorization(character, gym);
    if (!auth.canTravel) {
      setFeedback(`⚠️ ${auth.reason}`);
      setTimeout(() => setFeedback(null), 4500);
      return;
    }

    const destLoc = resolveEffectiveGymLocation(gym, character);
    const updated = JSON.parse(JSON.stringify(character)) as Character;
    updated.money -= auth.travelCost;
    updated.currentGymId = gym.id;
    updated.currentCity = destLoc.city;
    updated.currentCountry = destLoc.country;

    // Trancar turmas presenciais da academia anterior apenas se houver mudança geográfica de cidade/país
    let classesFrozen = 0;
    if (!auth.logistics.isSameCapital && Array.isArray(updated.enrolledClasses)) {
      updated.enrolledClasses.forEach((c) => {
        if (c.status === 'ativa' && c.gymId !== gym.id) {
          c.status = 'trancada';
          classesFrozen += 1;
        }
      });
    }

    sounds.playGraduation();
    const frozenMsg = classesFrozen > 0 ? ` (${classesFrozen} turma(s) presencial(is) da cidade anterior foram trancadas).` : '';
    const moveMsg = auth.logistics.isSameCapital
      ? `🥋 Matrícula transferida dentro de ${destLoc.city}${destLoc.uf ? ` (${destLoc.uf})` : ''} para a ${gym.name} sem custo de passagem!`
      : `✈️ Viagem e transferência concluídas! Você agora reside em ${destLoc.city}${destLoc.uf ? ` (${destLoc.uf})` : ''}, ${destLoc.country} e treina na ${gym.name}!${frozenMsg}`;
    setFeedback(moveMsg);
    setTimeout(() => setFeedback(null), 5000);

    onUpdateCharacter(updated);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Globe2 className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
              27 Capitais do Brasil & Centros Mundiais
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">Academias & Equipes do Circuito</h1>
          <p className="text-xs md:text-sm text-neutral-400 mt-1 max-w-2xl">
            Cada uma das 27 capitais possui projeto social comunitário gratuito e centros competitivos com equipes e mestres locais, além dos grandes polos mundiais no exterior.
          </p>
        </div>

        <div className="w-full md:w-auto bg-neutral-950 p-3.5 sm:p-4 rounded-xl border border-neutral-800 text-left md:text-right shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">Seu Local Atual</span>
          <span className="text-base font-black text-amber-400 block truncate">
            {currentGymName}
          </span>
          <span className="text-xs text-neutral-400 block mt-0.5">
            {currentGymCity}
          </span>
        </div>
      </div>

      {/* Mode Switcher: Academias Mundiais vs Minha Academia (Professor) & Mudança de Capital */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="grid grid-cols-2 sm:flex gap-1.5 bg-neutral-900 p-1.5 rounded-xl border border-neutral-800 w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setGymViewMode('mundo')}
            className={`min-h-[42px] px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              gymViewMode === 'mundo'
                ? 'bg-amber-500 text-neutral-950 font-black'
                : 'text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            <Globe2 className="w-4 h-4 shrink-0" />
            <span className="truncate">Rede ({WORLD_GYMS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setGymViewMode('minha_academia')}
            className={`min-h-[42px] px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              gymViewMode === 'minha_academia'
                ? 'bg-amber-500 text-neutral-950 font-black'
                : 'text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {character.playerAcademy
                ? `Minha Academia (${character.playerAcademy.students.length})`
                : hasEligibleProfArt
                ? 'Abrir Academia'
                : 'Minha Academia'}
            </span>
          </button>
        </div>

        {gymViewMode === 'mundo' && (
          <button
            type="button"
            onClick={() => setShowRelocationPanel((v) => !v)}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              showRelocationPanel
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-800'
            }`}
          >
            <Home className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{showRelocationPanel ? 'Ocultar Mudança de Capital' : 'Mudar de Capital (27 Capitais)'}</span>
          </button>
        )}
      </div>

      {gymViewMode === 'mundo' && showRelocationPanel && (() => {
        const destState = resolveBrazilCapitalByUf(relocateTargetUf);
        const samePlace = isCurrentlyInBrazil && playerCapital.uf === destState.uf;
        const previewLogistics = estimateTravelLogistics(
          {
            country: character.currentCountry || 'Brasil',
            uf: isCurrentlyInBrazil ? playerCapital.uf : undefined,
            city: isCurrentlyInBrazil ? playerCapital.capital : character.currentCity || character.homeCity
          },
          {
            country: 'Brasil',
            uf: destState.uf,
            city: destState.capital
          }
        );

        const handleRelocateCapital = () => {
          const res = relocatePlayerToCapital(character, relocateTargetUf);
          setFeedback(res.message);
          setTimeout(() => setFeedback(null), 5000);
          if (res.success) {
            sounds.playGraduation();
            setRegionScope('minha_capital');
            onUpdateCharacter(res.updatedChar);
          } else {
            sounds.playWhoosh();
          }
        };

        return (
          <div className="bg-neutral-900 border border-sky-500/40 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-black text-sky-400 block">
                  Mobilidade Regional · 26 Capitais Estaduais + Brasília (DF)
                </span>
                <h2 className="text-base font-black text-white">
                  Mudança Direta de Residência & Domicílio Esportivo
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Mude sua residência para qualquer capital brasileira para atualizar custo de vida, salários, mercado de patrocínios e campeonatos estaduais/locais.
                </p>
              </div>
              <div className="text-right text-xs shrink-0">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Residência Atual</span>
                <span className="text-amber-400 font-black">{locSummary.currentLabel}</span>
                {locSummary.hasRelocated && (
                  <span className="text-[10px] text-neutral-400 block">Origem: {locSummary.originLabel}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-300 block">
                  Escolher Capital de Destino:
                </label>
                <select
                  value={relocateTargetUf}
                  onChange={(e) => setRelocateTargetUf(e.target.value as BrazilUF)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-sky-500"
                >
                  {BRAZIL_STATES.map((st) => (
                    <option key={st.uf} value={st.uf}>
                      {st.capital} ({st.uf}) — {st.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  {destState.sport.economicIdentity}
                </p>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 grid grid-cols-3 gap-2 text-center text-[11px] tabular-nums">
                <div>
                  <span className="text-neutral-500 block text-[10px]">Custo de Vida</span>
                  <span className="text-neutral-400 text-[10px] block">
                    {activeEco.economy.costOfLivingIndex.toFixed(2)}x →{' '}
                  </span>
                  <strong className={destState.economy.costOfLivingIndex > activeEco.economy.costOfLivingIndex ? 'text-amber-400' : 'text-emerald-400'}>
                    {destState.economy.costOfLivingIndex.toFixed(2)}x
                  </strong>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">Salários</span>
                  <span className="text-neutral-400 text-[10px] block">
                    {activeEco.economy.salaryMultiplier.toFixed(2)}x →{' '}
                  </span>
                  <strong className="text-emerald-400">
                    {destState.economy.salaryMultiplier.toFixed(2)}x
                  </strong>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">Patrocínios</span>
                  <span className="text-neutral-400 text-[10px] block">
                    {activeEco.sport.sponsorshipMarketIndex.toFixed(2)}x →{' '}
                  </span>
                  <strong className="text-cyan-400">
                    {destState.sport.sponsorshipMarketIndex.toFixed(2)}x
                  </strong>
                </div>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Deslocamento:</span>
                  <span className="text-white font-bold">
                    {samePlace
                      ? 'Mesma capital'
                      : `${previewLogistics.distanceKm.toLocaleString('pt-BR')} km (${previewLogistics.transportMode})`}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Passagem & Mudança:</span>
                  <span className="text-amber-400 font-black tabular-nums">
                    {samePlace ? 'R$ 0' : `R$ ${previewLogistics.estimatedCost.toLocaleString('pt-BR')}`}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={samePlace}
                  onClick={handleRelocateCapital}
                  className={`w-full py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    samePlace
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      : 'bg-sky-500 hover:bg-sky-400 text-neutral-950'
                  }`}
                >
                  {samePlace
                    ? 'Você já mora aqui'
                    : `Mudar para ${destState.capital} (${destState.uf})`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {feedback && (
        <div className="p-4 bg-amber-500/20 border border-amber-500/40 rounded-xl text-center text-sm font-bold text-amber-300 animate-fadeIn">
          {feedback}
        </div>
      )}

      {gymViewMode === 'minha_academia' ? (
        <PlayerAcademyPanel
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onNotify={(msg) => {
            setFeedback(msg);
            setTimeout(() => setFeedback(null), 5000);
          }}
        />
      ) : (
        <>
          {/* Recent Gym Transfers Ticker */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <ArrowRightLeft className="w-4 h-4" />
                Movimentações Recentes de Academias no Circuito
              </div>
              <span className="text-[11px] text-neutral-400">
                {worldFighters.length} atletas vinculados às {WORLD_GYMS.length} academias do circuito
              </span>
            </div>

            {recentTransfers.length === 0 ? (
              <p className="text-xs text-neutral-500">
                Nenhuma transferência registrada neste início de temporada. Conforme os meses avançarem, atletas evoluem, conquistam fama e mudam para centros especializados.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {recentTransfers.map((athlete) => (
                  <div
                    key={athlete.id}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs flex items-center gap-2"
                  >
                    <span className="text-lg shrink-0">{athlete.avatar}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">
                        {athlete.name} {athlete.gender === 'F' ? '♀' : '♂'}
                      </div>
                      <div className="text-[10px] text-emerald-400 truncate">
                        {athlete.lastGymTransferNote}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Regional Filter Bar */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setRegionScope('minha_capital')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  regionScope === 'minha_capital'
                    ? 'bg-amber-500 text-neutral-950 font-black'
                    : 'bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-neutral-700'
                }`}
              >
                📍 Minha Capital ({isCurrentlyInBrazil ? `${playerCapital.capital}/${playerCapital.uf}` : character.currentCity})
              </button>
              <button
                type="button"
                onClick={() => setRegionScope('brasil')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  regionScope === 'brasil'
                    ? 'bg-amber-500 text-neutral-950 font-black'
                    : 'bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-neutral-700'
                }`}
              >
                🇧🇷 Brasil (27 Capitais)
              </button>
              <button
                type="button"
                onClick={() => setRegionScope('exterior')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  regionScope === 'exterior'
                    ? 'bg-amber-500 text-neutral-950 font-black'
                    : 'bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-neutral-700'
                }`}
              >
                🌍 Exterior
              </button>
              <button
                type="button"
                onClick={() => setRegionScope('todas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  regionScope === 'todas'
                    ? 'bg-amber-500 text-neutral-950 font-black'
                    : 'bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-neutral-700'
                }`}
              >
                Todas ({WORLD_GYMS.length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {regionScope === 'brasil' && (
                <select
                  value={selectedUfFilter}
                  onChange={(e) => setSelectedUfFilter(e.target.value as 'todas' | BrazilUF)}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="todas">Todas as 27 Capitais</option>
                  {BRAZIL_STATES.map((st) => (
                    <option key={st.uf} value={st.uf}>
                      {st.capital} ({st.uf}) — {st.name}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={selectedTierFilter}
                onChange={(e) => setSelectedTierFilter(e.target.value as 'todos' | NonNullable<Gym['qualityTier']>)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="todos">Todos os Perfis</option>
                <option value="social">Projeto Social (Grátis)</option>
                <option value="convencional">Academia Convencional</option>
                <option value="competitiva">Centro Competitivo</option>
                <option value="elite">Alto Rendimento</option>
                <option value="mundial">Polo Mundial</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar academia, mestre, arte..."
                  className="bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Gyms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGyms.map((gym) => {
              const isCurrent = character.currentGymId === gym.id;
              const auth = validateTravelAuthorization(character, gym);
              const meetsReputation = character.fame >= gym.reputationReq;
              const canAffordTravel = character.money >= auth.travelCost;
              const loc = resolveEffectiveGymLocation(gym, character);
              const tierInfo = QUALITY_TIER_META[gym.qualityTier || 'default'];
              const enrolledAthletes = athletesByGym.get(gym.id) || [];
              const isExpanded = expandedGymId === gym.id;
              const visibleAthletes = isExpanded ? enrolledAthletes : enrolledAthletes.slice(0, 4);

              return (
                <div
                  key={gym.id}
                  className={`bg-neutral-900 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'border-amber-500 bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/20 shadow-lg shadow-amber-500/10'
                      : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    {/* Header Flag & Location */}
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{gym.flag}</span>
                        <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          {loc.city}{loc.uf ? ` (${loc.uf})` : ''}, {loc.country}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tierInfo.className}`}>
                          {tierInfo.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-amber-500 text-neutral-950 font-black px-2.5 py-0.5 rounded-full uppercase">
                            Academia Atual
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-black text-white text-lg leading-tight">{gym.name}</h3>
                    {gym.teamName && (
                      <div className="text-[11px] font-bold text-amber-300/90 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          Equipe: {gym.teamName}
                        </span>
                        {gym.foundedYear && (
                          <span className="text-[10px] text-neutral-500 font-normal">• Fundada em {gym.foundedYear}</span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">{gym.history || gym.description}</p>

                    {/* Modalidades Ofertadas */}
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {gym.focusArts.map((art) => (
                        <span
                          key={art}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            art === character.primaryArt
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-neutral-950 text-neutral-300 border-neutral-800'
                          }`}
                        >
                          {MARTIAL_ARTS_META[art]?.name.split(' ')[0] || art.toUpperCase()}
                        </span>
                      ))}
                      {gym.infrastructureLevel && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                          {INFRA_LEVEL_LABELS[gym.infrastructureLevel]}
                          {gym.studentCapacity ? ` • Cap. ${gym.studentCapacity}` : ''}
                        </span>
                      )}
                    </div>

                    {/* Master Quote */}
                    <div className="mt-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 text-xs text-neutral-300 italic">
                      "{gym.masterPhilosophy}" — <span className="text-amber-400 font-semibold">{gym.masterName}</span>
                    </div>

                    {/* Corpo Técnico & Professores */}
                    {gym.instructors && gym.instructors.length > 0 && (
                      <div className="mt-2.5 bg-neutral-950/70 border border-neutral-800/80 rounded-xl p-2.5 space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                          Corpo Técnico ({gym.instructors.length})
                        </div>
                        {gym.instructors.slice(0, 3).map((inst) => (
                          <div key={inst.id} className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-neutral-200 font-semibold truncate">
                              {inst.name}{' '}
                              <span className="text-neutral-500 font-normal">
                                ({MARTIAL_ARTS_META[inst.specialtyArt]?.name.split(' ')[0] || inst.specialtyArt})
                              </span>
                            </span>
                            <span className="text-[10px] text-amber-400 font-bold shrink-0">
                              Téc. {inst.technicalQuality}/100
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Benefits & Multipliers */}
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex justify-between items-center bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
                        <span className="text-neutral-400">Curva de Aprendizado:</span>
                        <span className="font-black text-amber-400 text-sm">
                          {gym.learningSpeedMultiplier}x (+{((gym.learningSpeedMultiplier - 1) * 100).toFixed(0)}%)
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
                        <span className="text-neutral-400">Benefício Único:</span>
                        <span className="font-bold text-emerald-400 text-[11px] truncate max-w-[240px]">
                          {gym.specialPerk}
                        </span>
                      </div>

                      {gym.facilities && gym.facilities.length > 0 && (
                        <div className="bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 text-[11px] text-neutral-300">
                          <span className="text-neutral-500 font-semibold">Estrutura: </span>
                          {gym.facilities.slice(0, 3).join(' · ')}
                        </div>
                      )}

                      {(() => {
                        const scholarshipEval = getCompetitiveScholarshipDiscount(character, gym);
                        const baseMonthly = gym.weeklyCost * 4;
                        const discountedMonthly = scholarshipEval.eligible
                          ? Math.round(baseMonthly * (1 - scholarshipEval.discountRate))
                          : baseMonthly;
                        return (
                          <div className="flex justify-between items-center bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 gap-2">
                            <span className="text-neutral-400">Mensalidade do Centro:</span>
                            <span className={`font-bold text-xs text-right ${gym.weeklyCost === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {gym.weeklyCost === 0 ? (
                                'Gratuita (Projeto Social)'
                              ) : scholarshipEval.eligible ? (
                                <>
                                  <span className="line-through text-neutral-500 mr-1">R$ {baseMonthly.toLocaleString('pt-BR')}</span>
                                  <span className="text-emerald-400">R$ {discountedMonthly.toLocaleString('pt-BR')}/mês</span>
                                </>
                              ) : (
                                <>
                                  R$ {baseMonthly.toLocaleString('pt-BR')}/mês{' '}
                                  <span className="text-[10px] text-neutral-400 font-normal">(R$ {gym.weeklyCost}/sem)</span>
                                </>
                              )}
                            </span>
                          </div>
                        );
                      })()}

                      {(gym.teamTitlesNote || gym.rivalryNote) && (() => {
                        const rivalries = getGymRivalries(gym);
                        return (
                          <div className="bg-neutral-950/70 px-3 py-2 rounded-lg border border-neutral-800/80 text-[10px] space-y-1 text-neutral-400">
                            {gym.teamTitlesNote && (
                              <div>🏆 <span className="text-neutral-200">{gym.teamTitlesNote}</span></div>
                            )}
                            {gym.scholarshipSupport && (
                              <div>🎓 <span className="text-emerald-300/90">{gym.scholarshipSupport}</span></div>
                            )}
                            {gym.rivalryNote && (
                              <div>
                                ⚔️ <span className="text-rose-300/90">{gym.rivalryNote}</span>
                                {rivalries.rivalGyms.length > 0 && (
                                  <span className="text-neutral-500"> ({rivalries.rivalGyms.map((rg) => rg.name).join(' · ')})</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {(() => {
                        const gymEco = resolveActiveEconomicContext({
                          currentCity: loc.city,
                          currentCountry: loc.country,
                          homeCity: loc.city,
                          homeState: loc.uf || character.homeState
                        });
                        return (
                          <div className="flex justify-between items-center bg-neutral-950/70 px-3 py-1.5 rounded-lg border border-neutral-800/80 text-[11px]">
                            <span className="text-neutral-400">Custo de Vida Local:</span>
                            <span className="font-bold text-neutral-200">
                              {gymEco.costTierLabel} ({gymEco.economy.costOfLivingIndex.toFixed(2)}x) · Patrocínio{' '}
                              <span className="text-cyan-400">{gymEco.sport.sponsorshipMarketIndex.toFixed(2)}x</span>
                            </span>
                          </div>
                        );
                      })()}

                      <div className="flex justify-between items-center text-[11px] text-neutral-400 pt-1">
                        <span>
                          Deslocamento:{' '}
                          <strong className="text-white">
                            {auth.travelCost === 0 ? 'Grátis (Local)' : `R$ ${auth.travelCost.toLocaleString('pt-BR')}`}
                          </strong>
                        </span>
                        <span>
                          Reputação Mínima:{' '}
                          <strong className={meetsReputation ? 'text-emerald-400' : 'text-red-400'}>
                            {gym.reputationReq} Fama
                          </strong>
                        </span>
                      </div>

                      {!isCurrent && (
                        <div className="text-[10px] text-neutral-400 bg-neutral-950/70 border border-neutral-800/80 rounded-lg px-2.5 py-1.5">
                          {auth.logistics.summaryLabel}
                        </div>
                      )}

                      {character.age < 18 && gym.country !== 'Brasil' && (
                        <div className="p-2 bg-amber-950/30 border border-amber-800/40 rounded-lg text-[10px] text-amber-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          <span>Exige 16+ anos e autorização dos pais (Apoio Familiar &gt;= 70%, atual: {character.familySupport}%).</span>
                        </div>
                      )}

                      {character.age < 18 && gym.country === 'Brasil' && !auth.logistics.isSameCapital && (
                        <div className="p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-[10px] text-neutral-400 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          <span>Viagem interestadual requer Apoio Familiar &gt;= 50% (atual: {character.familySupport}%).</span>
                        </div>
                      )}

                      {/* Athletes Affiliated with This Gym */}
                      <div className="mt-3 pt-3 border-t border-neutral-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-amber-400" />
                            Atletas na Academia ({enrolledAthletes.length})
                          </span>
                          {enrolledAthletes.length > 4 && (
                            <button
                              type="button"
                              onClick={() => setExpandedGymId(isExpanded ? null : gym.id)}
                              className="text-[10px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
                            >
                              {isExpanded ? 'Mostrar menos' : `Ver todos (${enrolledAthletes.length})`}
                            </button>
                          )}
                        </div>

                        {enrolledAthletes.length === 0 ? (
                          <div className="text-[11px] text-neutral-500 italic">Nenhum atleta do circuito vinculado no momento.</div>
                        ) : (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {visibleAthletes.map((ath) => {
                              const styleInfo = getFightingStyleLabel(ath.fightingStyle);
                              const wealthInfo = getWealthTierInfo(ath.wealthTier);
                              const artName = MARTIAL_ARTS_META[ath.art]?.name.split(' ')[0] || ath.art;
                              return (
                                <div
                                  key={ath.id}
                                  className="bg-neutral-950 border border-neutral-800/90 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2 text-[11px]"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-base shrink-0">{ath.avatar}</span>
                                    <div className="min-w-0">
                                      <div className="font-bold text-neutral-200 truncate flex items-center gap-1">
                                        <span className="truncate">{ath.name}</span>
                                        <span className={ath.gender === 'F' ? 'text-pink-400' : 'text-sky-400'}>
                                          {ath.gender === 'F' ? '♀' : '♂'}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-neutral-400 truncate">
                                        {artName} • {ath.belt} • {styleInfo.label}
                                      </div>
                                      {ath.lastGymTransferNote && (
                                        <div className="text-[9px] text-emerald-400 truncate">
                                          ✈️ {ath.lastGymTransferNote}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0 space-y-0.5">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border block ${wealthInfo.badgeClass}`}>
                                      {wealthInfo.shortLabel}
                                    </span>
                                    <span className="text-[10px] text-neutral-400 block">
                                      {ath.record.wins}V-{ath.record.losses}D
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-5 pt-3 border-t border-neutral-800/80">
                    {isCurrent ? (
                      <div className="w-full py-2.5 bg-neutral-800 text-neutral-400 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        Você já está treinando neste centro
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleEnrollGym(gym)}
                        disabled={!auth.canTravel}
                        title={auth.reason}
                        className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          auth.canTravel && meetsReputation && canAffordTravel
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                            : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        }`}
                      >
                        <Plane className="w-4 h-4" />
                        {auth.logistics.isSameCapital
                          ? 'Transferir para Esta Academia (Grátis)'
                          : `Viajar e Matricular-se (R$ ${auth.travelCost.toLocaleString('pt-BR')})`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
