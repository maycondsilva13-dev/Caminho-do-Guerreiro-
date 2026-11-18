import React, { useState } from 'react';
import {
  Character,
  Tournament,
  MartialArtType,
  TournamentBracketState,
  BracketFighterSlot,
  OfficialGiColor,
  TournamentDivisionSelection,
  CharacterTournamentEntry
} from '../types/game';
import { INITIAL_TOURNAMENTS } from '../data/tournamentsData';
import { MARTIAL_ARTS_META } from '../data/martialArtsData';
import { MONTH_NAMES } from '../utils/dateUtils';
import { sounds } from '../utils/audio';
import { 
  Trophy, 
  Swords, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  Coins, 
  Calendar,
  ArrowRight,
  Users,
  X,
  GitBranch,
  MapPin,
  Plane,
  ShieldCheck
} from 'lucide-react';

import {
  getRealAthleteAge,
  getTournamentTimelineInfo,
  resolveTournamentIsGi,
  validateTournamentEligibility,
  validateWeighIn,
  WeighInValidationResult
} from '../utils/tournamentTimeline';
import {
  advanceCharacterToTournamentDate,
  getActiveBjjTournamentSession,
  performTournamentWeighIn,
  registerCharacterInTournament
} from '../utils/tournamentFlow';
import { buildTournamentBracket, getPlayerCurrentBracketMatch } from '../utils/tournamentBracket';
import { getAgeCategoryFromAge, getAgeCategoryLabel } from '../data/worldFightersData';
import {
  coachParticipantInTournament,
  CornerTactic,
  getCoachableTournamentParticipants,
  getTournamentFamilySupport
} from '../utils/tournamentFamilySupportHelper';
import {
  evaluateTournamentGeographyAndTravel,
  getTournamentScopeLabel
} from '../utils/tournamentGeographyHelper';
import { CBJJ_OFFICIAL_GI_COLORS, CBJJ_OFFICIAL_GI_WEIGHT_KG } from '../data/tournamentDivisionsData';
import {
  getGiColorLabel,
  resolveTournamentDivisionForCharacter
} from '../utils/tournamentDivisionsHelper';

function buildEntrySelection(entry?: CharacterTournamentEntry): TournamentDivisionSelection | undefined {
  if (!entry) return undefined;
  if (
    entry.weightDivisionId ||
    entry.weightDivisionLabel ||
    entry.giColor ||
    entry.genderDivision ||
    entry.ageDivisionId
  ) {
    return {
      weightDivisionId: entry.weightDivisionId,
      weightClassLabel: entry.weightDivisionLabel,
      minWeightKg: entry.weightMinKg,
      maxWeightKg: entry.weightMaxKg,
      ageDivisionId: entry.ageDivisionId,
      ageDivisionLabel: entry.ageDivisionLabel,
      rankDivisionId: entry.rankDivisionId,
      rankDivisionLabel: entry.rankDivisionLabel,
      gender: entry.genderDivision,
      giColor: entry.giColor as OfficialGiColor | undefined
    };
  }
  return undefined;
}

interface Props {
  character: Character;
  onStartTournament: (tournament: Tournament) => void;
  onUpdateCharacter: (updated: Character) => void;
}

export const CompetitionsView: React.FC<Props> = ({
  character,
  onStartTournament,
  onUpdateCharacter
}) => {
  const [selectedArtFilter, setSelectedArtFilter] = useState<string>('todos');
  const [selectedScopeFilter, setSelectedScopeFilter] = useState<
    'todos' | 'locais' | 'nacionais' | 'internacionais' | 'mma_pro'
  >('todos');
  const [activeModalTournament, setActiveModalTournament] = useState<Tournament | null>(null);
  const [registrationModalTournament, setRegistrationModalTournament] = useState<Tournament | null>(null);
  const [selectedWeightDivisionId, setSelectedWeightDivisionId] = useState<string>('');
  const [selectedGiColor, setSelectedGiColor] = useState<OfficialGiColor>('branco');
  const [bracketModalTournament, setBracketModalTournament] = useState<Tournament | null>(null);
  const [weighInPassed, setWeighInPassed] = useState<boolean | null>(null);
  const [weighInValidation, setWeighInValidation] = useState<WeighInValidationResult | null>(null);
  const [coachFeedback, setCoachFeedback] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const tournaments = INITIAL_TOURNAMENTS;
  const realAge = getRealAthleteAge(character);
  const playerAgeCat = getAgeCategoryFromAge(realAge);
  const activeResumableBjj = getActiveBjjTournamentSession(character, tournaments);

  const filteredTournaments = tournaments.filter((t) => {
    const matchesArt = selectedArtFilter === 'todos' || t.art === selectedArtFilter;
    if (!matchesArt) return false;
    if (selectedScopeFilter === 'todos') return true;
    if (selectedScopeFilter === 'locais') return t.scope === 'municipal' || t.scope === 'estadual';
    if (selectedScopeFilter === 'nacionais') return t.scope === 'regional' || t.scope === 'nacional';
    if (selectedScopeFilter === 'internacionais') return t.scope === 'internacional' || t.scope === 'mundial';
    return t.scope === 'mma_pro';
  });

  // 1A. Abre modal de seleção oficial de categoria (Idade, Graduação, Peso, Sexo & Quimono)
  const handleOpenRegistrationModal = (tournament: Tournament) => {
    const timeline = getTournamentTimelineInfo(tournament, character.currentDate, character);
    const resolved = resolveTournamentDivisionForCharacter(character, tournament, timeline.tournamentYear);
    setSelectedWeightDivisionId(resolved.recommendedWeight.id);
    setSelectedGiColor(resolved.giColor || 'branco');
    setRegistrationModalTournament(tournament);
    sounds.playWhoosh();
  };

  // 1B. Inscrição oficial no campeonato com divisão selecionada e validação completa
  const handleConfirmRegistration = (tournament: Tournament, selection?: TournamentDivisionSelection) => {
    const timeline = getTournamentTimelineInfo(tournament, character.currentDate, character);
    const res = registerCharacterInTournament(character, tournament, timeline.tournamentYear, selection);
    if (!res.success) {
      sounds.playPunch(false);
      setActionFeedback({ type: 'error', text: res.message });
      return;
    }

    sounds.playBell();
    setActionFeedback({ type: 'success', text: res.message });
    setRegistrationModalTournament(null);
    onUpdateCharacter(res.updatedChar);
  };

  // 2. Avanço controlado dentro do mesmo mês civil até a data oficial de pesagem ou luta
  const handleAdvanceMilestone = (tournament: Tournament, milestone: 'weigh_in' | 'fight', targetYear: number) => {
    const res = advanceCharacterToTournamentDate(character, tournament, milestone, targetYear);
    if (!res.success) {
      sounds.playPunch(false);
      setActionFeedback({ type: 'error', text: res.message });
      return;
    }

    sounds.playWhoosh();
    setActionFeedback({ type: 'success', text: res.message });
    onUpdateCharacter(res.updatedChar);
  };

  // 3. Abertura do modal de pesagem oficial com validação biométrica rigorosa na data programada
  const handleOpenWeighIn = (tournament: Tournament) => {
    const timeline = getTournamentTimelineInfo(tournament, character.currentDate, character);
    if (!timeline.canWeighIn) {
      sounds.playPunch(false);
      setActionFeedback({ type: 'error', text: timeline.statusDescription });
      return;
    }

    sounds.playBell();
    setActiveModalTournament(tournament);
    const entrySelection = buildEntrySelection(timeline.historyEntry);
    const validation = validateWeighIn(character, tournament, entrySelection);
    setWeighInValidation(validation);
    setWeighInPassed(validation.canPassWeighIn);
  };

  // 4. Confirmação da pesagem oficial (ou tentativa na balança com risco de desclassificação CBJJ)
  const handleConfirmWeighIn = (confirmScaleAttempt = false) => {
    if (!activeModalTournament) return;

    const res = performTournamentWeighIn(character, activeModalTournament, undefined, {
      confirmScaleAttempt
    });
    if (!res.success) {
      sounds.playPunch(false);
      setActionFeedback({ type: 'error', text: res.message });
      if (res.disqualified) {
        onUpdateCharacter(res.updatedChar);
        setActiveModalTournament(null);
      }
      return;
    }

    sounds.playWhistle();
    setActionFeedback({ type: 'success', text: res.message });
    onUpdateCharacter(res.updatedChar);
    setActiveModalTournament(null);
  };

  // 5. Início ou retomada do combate (apenas na data oficial, com pesagem homologada e elegibilidade válida)
  const handleStartFight = (tournament: Tournament) => {
    const timeline = getTournamentTimelineInfo(tournament, character.currentDate, character);
    if (!timeline.canFight) {
      sounds.playPunch(false);
      setActionFeedback({ type: 'error', text: timeline.statusDescription });
      return;
    }

    const entrySelection = buildEntrySelection(timeline.historyEntry);
    const eligibility = validateTournamentEligibility(
      character,
      tournament,
      timeline.tournamentYear,
      entrySelection
    );
    if (!eligibility.eligible) {
      sounds.playPunch(false);
      setActionFeedback({ type: 'error', text: `Impedimento na comissão atlética: ${eligibility.reasons.join(' ')}` });
      return;
    }

    sounds.playWhistle();
    setActionFeedback(null);
    onStartTournament(tournament);
  };

  const handleOpenBracketModal = (tournament: Tournament) => {
    sounds.playWhoosh();
    setBracketModalTournament(tournament);
  };

  const readyTournament = tournaments.find((t) => {
    const tl = getTournamentTimelineInfo(t, character.currentDate, character);
    return tl.canFight;
  });

  const readyTimeline = readyTournament
    ? getTournamentTimelineInfo(readyTournament, character.currentDate, character)
    : null;
  const readyScheduledMatch = readyTimeline?.historyEntry?.bracket
    ? getPlayerCurrentBracketMatch(readyTimeline.historyEntry.bracket)
    : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">Circuito Competitivo Oficial</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">Campeonatos, Opens & Octógono</h1>
          <p className="text-xs md:text-sm text-neutral-400 mt-1 max-w-2xl">
            Inscreva-se em torneios municipais, estaduais, nacionais e mundiais com chaves completas de 4 ou 8 atletas divididos por arte, graduação, idade e peso.
          </p>
        </div>

        {/* Current Weight, Division & Origin Card */}
        <div className="w-full md:w-auto bg-neutral-950 p-3.5 sm:p-4 rounded-xl border border-neutral-800 text-left md:text-right shrink-0 space-y-0.5 tabular-nums">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold flex items-center gap-1 md:justify-end">
            <Scale className="w-3.5 h-3.5 text-amber-400" /> Balança & Base
          </span>
          <span className="text-xl font-black text-white block">{character.weight.toFixed(1)} kg</span>
          <span className="text-xs text-amber-400 font-semibold block">{character.weightClass}</span>
          <span className="text-[10px] text-cyan-400 font-bold block">
            {realAge} anos • {getAgeCategoryLabel(playerAgeCat)}
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 md:justify-end pt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            {(character.currentCountry || 'Brasil') === 'Brasil'
              ? `${character.currentCity || character.homeCity || 'São Paulo'} (${character.homeState || 'SP'})`
              : `${character.currentCity || 'Exterior'} (${character.currentCountry})`}
          </span>
        </div>
      </div>

      {/* Feedback de Validação / Ações do Circuito */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 ${
            actionFeedback.type === 'error'
              ? 'bg-red-500/15 border-red-500/40 text-red-300'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          }`}
        >
          <span>{actionFeedback.text}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-neutral-400 hover:text-white cursor-pointer shrink-0"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Aviso de Combate BJJ em Andamento (Persistido entre telas e saves) */}
      {activeResumableBjj && activeResumableBjj.session.status === 'em_andamento' && (
        <div className="bg-amber-950/50 border-2 border-amber-500/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 block">
              Combate Oficial em Andamento ({activeResumableBjj.session.isGi ? 'Com Quimono / Gi' : 'Sem Quimono / No-Gi'})
            </span>
            <h3 className="text-sm md:text-base font-black text-white">
              {activeResumableBjj.tournament.name} — {activeResumableBjj.session.stageName} vs {activeResumableBjj.session.opponentSlot.name}
            </h3>
            <p className="text-xs text-neutral-300">
              Seu confronto foi preservado com placar e oponente oficiais. Retome do ponto exato em que parou.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleStartFight(activeResumableBjj.tournament)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase rounded-xl cursor-pointer shrink-0"
          >
            Retomar Combate Agora ➔
          </button>
        </div>
      )}

      {/* Notificação Interativa de Luta Oficial Liberada na Chave */}
      {readyTournament && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-neutral-900 to-emerald-950/80 border-2 border-emerald-500/70 rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-scaleIn">
          <div className="flex items-center gap-3.5">
            <span className="p-3 bg-emerald-500 text-neutral-950 rounded-2xl font-black text-2xl shadow-lg shadow-emerald-500/20 shrink-0">
              🥋
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500 text-neutral-950 tracking-wider">
                  Chamada Oficial da Federação
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {readyTournament.organization}
                </span>
              </div>
              <h3 className="text-base md:text-lg font-black text-white mt-0.5">
                Sua luta no {readyTournament.name} está pronta no tatame!
              </h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                {readyScheduledMatch ? (
                  <>
                    Próximo confronto ({readyScheduledMatch.match.stage === 'quartas' ? 'Quartas' : readyScheduledMatch.match.stage === 'final' ? 'Grande Final' : 'Semifinal'}):{' '}
                    <strong className="text-amber-300">
                      {readyScheduledMatch.opponent.avatar} {readyScheduledMatch.opponent.name}
                    </strong>{' '}
                    ({readyScheduledMatch.opponent.belt} • {readyScheduledMatch.opponent.age}a • {readyScheduledMatch.opponent.weight.toFixed(1)}kg • {readyScheduledMatch.opponent.record.wins}V-{readyScheduledMatch.opponent.record.losses}D).
                  </>
                ) : (
                  <>
                    Pesagem oficial homologada ({character.weight.toFixed(1)} kg na categoria {readyTournament.weightClass}). Chave com {readyTournament.bracketSize} lutadores aguardando.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Torcida da Família & Rivalidades na Plateia */}
          {(() => {
            const crowd = getTournamentFamilySupport(
              character,
              readyTournament,
              readyScheduledMatch?.opponent.id,
              readyScheduledMatch?.opponent.name
            );
            if (crowd.supportersCount === 0 && !crowd.isPersonalRivalry) return null;
            return (
              <div className="w-full sm:w-auto bg-neutral-950/90 border border-emerald-500/40 rounded-xl px-3.5 py-2.5 text-xs space-y-1">
                {crowd.supportersCount > 0 && (
                  <div className="font-bold text-pink-300">
                    📣 Torcida Presente (+{crowd.focusBonus.toFixed(1)} Foco Mental): {crowd.supporterNames.join(', ')}
                  </div>
                )}
                {crowd.isPersonalRivalry && (
                  <div className="font-black text-red-400">
                    {crowd.rivalryLabel || '🔥 Clássico Pessoal! Você enfrenta um desafeto declarado do seu círculo social!'}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => handleOpenBracketModal(readyTournament)}
              className="px-4 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <GitBranch className="w-4 h-4" />
              <span>Ver Chave ({readyTournament.bracketSize})</span>
            </button>
            <button
              type="button"
              onClick={() => handleStartFight(readyTournament)}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              <span>Subir no Tatame Agora ➔</span>
            </button>
          </div>
        </div>
      )}

      {coachFeedback && (
        <div className="p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-200 animate-fadeIn">
          {coachFeedback}
        </div>
      )}

      {/* Atuar no Corner de Familiares & Alunos nos Torneios do Mês */}
      {(() => {
        const currentMonthCoachables = tournaments
          .filter((t) => (t.monthScheduled ?? (((t.weekScheduled - 1) % 12) + 1)) === character.currentMonth)
          .flatMap((t) =>
            getCoachableTournamentParticipants(character, t).map((p) => ({ tournament: t, participant: p }))
          );

        if (currentMonthCoachables.length === 0) return null;

        const handleCoach = (t: Tournament, pId: string, src: 'family' | 'student', tactic: CornerTactic) => {
          const res = coachParticipantInTournament(character, t, pId, src, tactic);
          if (res.updatedChar !== character) {
            sounds.playGraduation();
            onUpdateCharacter(res.updatedChar);
          } else {
            sounds.playWhoosh();
          }
          setCoachFeedback(res.message);
          setTimeout(() => setCoachFeedback(null), 6000);
        };

        return (
          <div className="bg-neutral-900 border border-cyan-500/35 rounded-2xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-cyan-400 block">
                  Conexão Família & Academia ↔ Torneios
                </span>
                <h2 className="text-base font-black text-white">
                  Atuar no Corner da Equipe & Família neste Mês (-10⚡)
                </h2>
              </div>
              <span className="text-xs text-neutral-400">
                Oriente filhos, familiares ou alunos da sua academia na beira do tatame!
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {currentMonthCoachables.map(({ tournament, participant }) => (
                <div
                  key={`${tournament.id}_${participant.id}`}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate">
                      {participant.avatar} {participant.name} ({participant.roleLabel})
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {tournament.name} · {participant.beltLabel}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    {(
                      [
                        { id: 'pressao_ofensiva', label: 'Ofensiva' },
                        { id: 'busca_finalizacao', label: 'Finalizar' },
                        { id: 'defesa_pontos', label: 'Pontos' }
                      ] as const
                    ).map((tac) => (
                      <button
                        key={tac.id}
                        type="button"
                        onClick={() => handleCoach(tournament, participant.id, participant.source, tac.id)}
                        className="px-2.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-500 hover:text-neutral-950 text-cyan-300 border border-cyan-500/40 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        {tac.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Filter Tabs by Martial Art */}
      <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedArtFilter('todos')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedArtFilter === 'todos'
              ? 'bg-amber-500 text-neutral-950 font-black'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          Todos os Torneios
        </button>

        {(['boxe', 'jiujitsu', 'muaythai', 'karate', 'judo', 'capoeira', 'lutalivre', 'mma'] as MartialArtType[]).map((art) => {
          const meta = MARTIAL_ARTS_META[art];
          const isSelected = selectedArtFilter === art;
          return (
            <button
              key={art}
              type="button"
              onClick={() => setSelectedArtFilter(art)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-amber-500 text-neutral-950 font-black'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {meta.name.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Scope Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(
          [
            { id: 'todos', label: '🌐 Todas as Abrangências' },
            { id: 'locais', label: '📍 Municipais & Estaduais' },
            { id: 'nacionais', label: '🇧🇷 Regionais & Nacionais' },
            { id: 'internacionais', label: '✈️ Internacionais & Mundiais' },
            { id: 'mma_pro', label: '⚔️ MMA Profissional' }
          ] as const
        ).map((sc) => (
          <button
            key={sc.id}
            type="button"
            onClick={() => setSelectedScopeFilter(sc.id)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap border ${
              selectedScopeFilter === sc.id
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50'
                : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-800'
            }`}
          >
            {sc.label}
          </button>
        ))}
      </div>

      {/* Tournaments List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTournaments.map((t) => {
          const timeline = getTournamentTimelineInfo(t, character.currentDate, character);
          const entrySel = buildEntrySelection(timeline.historyEntry);
          const resolvedNatural = resolveTournamentDivisionForCharacter(
            character,
            t,
            timeline.tournamentYear,
            entrySel
          );
          const effectiveCardSelection: TournamentDivisionSelection = entrySel ?? {
            weightDivisionId: resolvedNatural.selectedWeight.id,
            weightClassLabel: resolvedNatural.selectedWeight.label,
            minWeightKg: resolvedNatural.selectedWeight.minWeight,
            maxWeightKg: resolvedNatural.selectedWeight.maxWeight,
            ageDivisionId: resolvedNatural.ageDivision.id,
            ageDivisionLabel: resolvedNatural.ageDivision.label,
            rankDivisionId: resolvedNatural.rankDivisionId,
            rankDivisionLabel: resolvedNatural.rankDivisionLabel,
            gender: resolvedNatural.sex,
            giColor: resolvedNatural.giColor
          };
          const eligibility = validateTournamentEligibility(
            character,
            t,
            timeline.tournamentYear,
            effectiveCardSelection
          );
          const geo = eligibility.geography;
          const canAfford = character.money >= geo.totalRegistrationCost;
          const isOverweight = !eligibility.weightValidation.canPassWeighIn;
          const isBjjOrGrappling = t.art === 'jiujitsu' || t.art === 'lutalivre' || t.rulesType === 'bjj_points';
          const effectiveIsGi = resolveTournamentIsGi(t, timeline.historyEntry);
          const isBjjGi = t.art === 'jiujitsu' && effectiveIsGi;
          const divisionInfo = eligibility.resolvedDivision;

          return (
            <div
              key={t.id}
              className={`bg-neutral-900 border rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all shadow-md ${
                timeline.isCompleted
                  ? 'border-purple-500/40 bg-gradient-to-br from-neutral-900 via-neutral-900 to-purple-950/20'
                  : timeline.canFight
                  ? 'border-emerald-500/50 bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950/20'
                  : timeline.canWeighIn
                  ? 'border-yellow-500/50 bg-neutral-900'
                  : t.scope === 'mma_pro'
                  ? 'border-red-500/40 bg-gradient-to-br from-neutral-900 via-neutral-900 to-red-950/20'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div>
                {/* Badge Header */}
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-neutral-800 text-amber-400 border border-neutral-700">
                      {t.scope.toUpperCase()}
                    </span>
                    {isBjjOrGrappling && (
                      <span
                        className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md border ${
                          effectiveIsGi
                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {effectiveIsGi ? '🥋 Gi' : '🤼 No-Gi'}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-neutral-400">
                    {t.organization}
                  </span>
                </div>

                <h3 className="font-black text-white text-base leading-snug">{t.name}</h3>

                {/* Timeline Status Badge */}
                <div className="mt-2.5 mb-3">
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${timeline.badgeColor}`}>
                    {timeline.statusLabel}
                  </span>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                    {timeline.statusDescription}
                  </p>
                </div>

                {/* Divisão Oficial do Atleta (Idade, Graduação, Peso, Sexo & Quimono) */}
                <div className="mb-3 p-2.5 rounded-xl bg-neutral-950/90 border border-neutral-800 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[10px] uppercase font-black tracking-wider text-amber-400">
                    <span>{timeline.historyEntry?.registered ? 'Divisão Inscrita' : 'Sua Divisão Oficial'}</span>
                    <span className="text-cyan-300">
                      {divisionInfo.sexLabel} • {divisionInfo.ageDivision.shortLabel}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-200 font-semibold flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-amber-300">{divisionInfo.rankDivisionLabel}</span>
                    <span className="text-neutral-600">•</span>
                    <span className={isOverweight ? 'text-red-400' : 'text-emerald-400'}>
                      {divisionInfo.selectedWeight.label}
                    </span>
                  </div>
                  {isBjjGi && (
                    <div className="text-[10px] text-blue-300 font-medium">
                      ⚖️ Pesagem c/ Quimono (+{CBJJ_OFFICIAL_GI_WEIGHT_KG.toFixed(2).replace('.', ',')} kg) • Tolerância ZERO • Gi {getGiColorLabel(divisionInfo.giColor)}
                    </div>
                  )}
                </div>

                <div className="mt-2 space-y-1.5 text-xs text-neutral-300">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-neutral-500">Sede Oficial:</span>
                    <span className="font-bold text-cyan-300 flex items-center gap-1 text-right">
                      {geo.host.isBrazil ? <MapPin className="w-3 h-3 shrink-0" /> : <Plane className="w-3 h-3 shrink-0" />}
                      {geo.host.displayLabel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-neutral-500">Deslocamento:</span>
                    <span
                      className={`font-semibold text-right ${
                        geo.travelLogistics.isSameCapital
                          ? 'text-emerald-400'
                          : geo.travelCoveredByPromotion
                          ? 'text-cyan-300'
                          : 'text-amber-300'
                      }`}
                    >
                      {geo.travelLogistics.isSameCapital
                        ? 'Local (R$ 0)'
                        : geo.travelCoveredByPromotion
                        ? `Custeado (${geo.travelLogistics.distanceKm.toLocaleString('pt-BR')} km)`
                        : `R$ ${geo.effectiveTravelCost.toLocaleString('pt-BR')} (${geo.travelLogistics.distanceKm.toLocaleString('pt-BR')} km)`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Mês / Data:</span>
                    <span className="font-bold text-amber-400">
                      Dia {timeline.scheduledDate.day}/{timeline.scheduledDate.month} ({MONTH_NAMES[timeline.scheduledDate.month - 1].slice(0, 3)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Pesagem Oficial:</span>
                    <span className="font-semibold text-neutral-300">
                      Dia {timeline.weighInDate.day}/{timeline.weighInDate.month}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Taxa de Inscrição:</span>
                    <span className="font-bold text-neutral-200">{t.entryFee === 0 ? 'GRÁTIS (CONVITE)' : `R$ ${t.entryFee}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Premiação Ouro:</span>
                    <span className="font-bold text-emerald-400">R$ {t.rewardMoney.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Chave / Tempo:</span>
                    <span className="font-bold text-amber-300 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {t.bracketSize} atletas •{' '}
                      {t.art === 'jiujitsu'
                        ? `${Math.round(divisionInfo.effectiveMatchDurationSeconds / 60)}m`
                        : `${t.rounds}x${Math.round(t.roundDurationSeconds / 60)}m`}
                    </span>
                  </div>
                </div>

                {/* Status da Chave para Atleta Inscrito e com Pesagem Homologada */}
                {timeline.historyEntry?.weighInPassed && !timeline.historyEntry?.completed && (
                  <div className="mt-3 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-neutral-400">Fase da Chave:</span>
                      <span className="text-amber-400 uppercase font-black">
                        {timeline.historyEntry.currentStage === 'quartas'
                          ? 'Quartas de Final'
                          : timeline.historyEntry.currentStage === 'final'
                          ? '🔥 Grande Final (Ouro em Jogo!)'
                          : 'Semifinal'}
                      </span>
                    </div>
                    {(() => {
                      const nextMatch = timeline.historyEntry?.bracket
                        ? getPlayerCurrentBracketMatch(timeline.historyEntry.bracket)
                        : null;
                      if (!nextMatch) return null;
                      return (
                        <div className="text-[11px] text-neutral-300 flex items-center justify-between pt-1 border-t border-neutral-800/70">
                          <span className="text-neutral-500">Próximo oponente:</span>
                          <span className="font-bold text-white truncate max-w-[165px]">
                            {nextMatch.opponent.avatar} {nextMatch.opponent.name}
                          </span>
                        </div>
                      );
                    })()}
                    {timeline.historyEntry.matchHistory && timeline.historyEntry.matchHistory.length > 0 && (
                      <div className="space-y-1 pt-1.5 border-t border-neutral-800/80">
                        {timeline.historyEntry.matchHistory.map((m, idx) => (
                          <div key={idx} className="text-[10px] text-emerald-400 flex items-center justify-between font-medium">
                            <span>✓ {m.stage}: venceu {m.opponentName}</span>
                            <span className="font-mono text-neutral-400">{m.method}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button: Strictly based on chronological pipeline */}
              <div className="mt-5 pt-3 border-t border-neutral-800/80 space-y-2">
                <button
                  type="button"
                  onClick={() => handleOpenBracketModal(t)}
                  className="w-full py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 bg-neutral-950 hover:bg-neutral-800 text-amber-300 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  {timeline.historyEntry?.bracket
                    ? `Ver Chave Oficial (${t.bracketSize} Atletas)`
                    : `Pré-visualizar Chave (${t.bracketSize} Atletas)`}
                </button>
                {timeline.isCompleted ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-neutral-800/80 text-purple-400 border border-purple-500/30 cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Torneio Concluído nesta Temporada
                  </button>
                ) : timeline.isPast ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-neutral-800/50 text-neutral-500 border border-neutral-800 cursor-not-allowed"
                  >
                    <Calendar className="w-4 h-4" />
                    Edição Encerrada na Linha do Tempo
                  </button>
                ) : timeline.isFuture ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-neutral-850 text-neutral-500 border border-neutral-800 cursor-not-allowed"
                  >
                    <Calendar className="w-4 h-4" />
                    Aguardando Mês Oficial ({MONTH_NAMES[timeline.scheduledDate.month - 1]})
                  </button>
                ) : timeline.canRegister ? (
                  <div className="space-y-1.5">
                    {!eligibility.eligible && (
                      <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 py-1.5 leading-snug">
                        {eligibility.reasons[0]}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={!eligibility.eligible || !canAfford}
                      onClick={() => handleOpenRegistrationModal(t)}
                      className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        !eligibility.eligible || !canAfford
                          ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20'
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                      {!eligibility.eligible
                        ? 'Inelegível para esta Categoria'
                        : !canAfford
                        ? `Saldo Insuficiente (R$ ${geo.totalRegistrationCost.toLocaleString('pt-BR')})`
                        : geo.totalRegistrationCost === 0
                        ? 'Escolher Categoria & Inscrever (Grátis)'
                        : geo.effectiveTravelCost > 0
                        ? `Escolher Categoria (R$ ${geo.totalRegistrationCost.toLocaleString('pt-BR')} c/ viagem)`
                        : `Escolher Categoria (R$ ${geo.totalRegistrationCost.toLocaleString('pt-BR')})`}
                    </button>
                  </div>
                ) : timeline.canAdvanceToWeighInDay ? (
                  <button
                    type="button"
                    onClick={() => handleAdvanceMilestone(t, 'weigh_in', timeline.tournamentYear)}
                    className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-blue-600/25 hover:bg-blue-500/35 text-blue-200 border border-blue-500/40 transition-all cursor-pointer"
                  >
                    <Scale className="w-4 h-4" />
                    Avançar para Pesagem (Dia {timeline.weighInDate.day}/{timeline.weighInDate.month})
                  </button>
                ) : timeline.canWeighIn ? (
                  <button
                    type="button"
                    onClick={() => handleOpenWeighIn(t)}
                    className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 shadow-md shadow-yellow-500/20 transition-all cursor-pointer"
                  >
                    <Scale className="w-4 h-4" />
                    Ir para a Pesagem Oficial (Obrigatória)
                  </button>
                ) : timeline.canAdvanceToFightDay ? (
                  <button
                    type="button"
                    onClick={() => handleAdvanceMilestone(t, 'fight', timeline.tournamentYear)}
                    className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-cyan-600/25 hover:bg-cyan-500/35 text-cyan-200 border border-cyan-500/40 transition-all cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    Avançar para Dia da Luta ({timeline.scheduledDate.day}/{timeline.scheduledDate.month})
                  </button>
                ) : timeline.canFight ? (
                  <button
                    type="button"
                    onClick={() => handleStartFight(t)}
                    className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
                  >
                    <Swords className="w-4 h-4" />
                    {timeline.status === 'em_disputa'
                      ? t.art === 'boxe' || t.rulesType === 'boxing_10must'
                        ? 'Retomar Luta no Ringue 🥊'
                        : 'Retomar Combate em Andamento 🥋'
                      : t.art === 'boxe' || t.rulesType === 'boxing_10must'
                      ? timeline.historyEntry?.currentStage === 'final'
                        ? 'Subir no Ringue: Grande Final 🏆'
                        : timeline.historyEntry?.currentStage === 'quartas'
                        ? 'Subir no Ringue: Quartas 🥊'
                        : 'Subir no Ringue: Semifinal 🥊'
                      : t.art === 'jiujitsu' || t.rulesType === 'bjj_points'
                      ? timeline.historyEntry?.currentStage === 'final'
                        ? 'Disputar a Grande Final 🏆'
                        : timeline.historyEntry?.currentStage === 'quartas'
                        ? 'Disputar Quartas de Final 🥋'
                        : 'Disputar Semifinal 🥋'
                      : 'Subir no Tatame / Octógono para a Luta'}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Escolha de Categoria Oficial, Peso & Quimono */}
      {registrationModalTournament && (() => {
        const t = registrationModalTournament;
        const timeline = getTournamentTimelineInfo(t, character.currentDate, character);
        const resolved = resolveTournamentDivisionForCharacter(
          character,
          t,
          timeline.tournamentYear,
          {
            weightDivisionId: selectedWeightDivisionId || undefined,
            giColor: selectedGiColor
          }
        );
        const isBjjGi = t.art === 'jiujitsu' && resolved.isGi;
        const geo = evaluateTournamentGeographyAndTravel(character, t);
        const currentSelection: TournamentDivisionSelection = {
          weightDivisionId: resolved.selectedWeight.id,
          weightClassLabel: resolved.selectedWeight.label,
          minWeightKg: resolved.selectedWeight.minWeight,
          maxWeightKg: resolved.selectedWeight.maxWeight,
          ageDivisionId: resolved.ageDivision.id,
          ageDivisionLabel: resolved.ageDivision.label,
          rankDivisionId: resolved.rankDivisionId,
          rankDivisionLabel: resolved.rankDivisionLabel,
          gender: resolved.sex,
          giColor: isBjjGi ? selectedGiColor : undefined
        };
        const selValidation = validateWeighIn(character, t, currentSelection);
        const canConfirm = selValidation.canPassWeighIn && character.money >= geo.totalRegistrationCost;

        return (
          <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-neutral-900 border-2 border-neutral-700 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative my-4 max-h-[92vh] overflow-y-auto space-y-4 animate-scaleIn">
              <div className="flex items-start justify-between gap-3 border-b border-neutral-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 block">
                    Inscrição Oficial • {t.organization}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white">{t.name}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {geo.host.displayLabel} • {resolved.isGi ? 'Com Quimono (Gi)' : 'Sem Quimono (No-Gi)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRegistrationModalTournament(null)}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer shrink-0"
                  aria-label="Fechar modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dados Enquadrados pelo Regulamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Sexo / Chave</span>
                  <span className="font-black text-white">{resolved.sexLabel}</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Divisão Etária</span>
                  <span className="font-black text-cyan-300">{resolved.ageDivision.label}</span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">{resolved.ageCalculationNote}</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Graduação / Classe</span>
                  <span className="font-black text-amber-300">{resolved.rankDivisionLabel}</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Peso na Balança</span>
                  <span className="font-black text-white">
                    {resolved.scaleWeightKg.toFixed(2).replace('.', ',')} kg
                  </span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    {isBjjGi
                      ? `Corpo ${character.weight.toFixed(2).replace('.', ',')} kg + ${CBJJ_OFFICIAL_GI_WEIGHT_KG.toFixed(2).replace('.', ',')} kg Quimono (Tolerância ZERO)`
                      : `Peso corporal (Tolerância ${resolved.toleranceKg.toFixed(1).replace('.', ',')} kg)`}
                  </span>
                </div>
              </div>

              {/* Seleção de Cor do Quimono (apenas BJJ Gi) */}
              {isBjjGi && (
                <div className="p-3.5 rounded-2xl bg-neutral-950 border border-blue-500/30 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Cor Oficial do Quimono (CBJJ/IBJJF)
                    </span>
                    <span className="text-[10px] text-neutral-400">Somente branco, azul ou preto</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {CBJJ_OFFICIAL_GI_COLORS.map((c) => {
                      const active = selectedGiColor === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedGiColor(c.id)}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                            active
                              ? 'bg-blue-500/20 border-blue-400 text-white shadow-sm'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full border border-neutral-600 ${
                              c.id === 'branco' ? 'bg-white' : c.id === 'azul' ? 'bg-blue-600' : 'bg-neutral-950'
                            }`}
                          />
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Padrão oficial de espessura do tecido e medidas da lapela. A aferição na balança é feita vestindo o quimono completo, sem tolerância de gramas.
                  </p>
                </div>
              )}

              {/* Seleção de Categoria de Peso */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Categorias de Peso ({resolved.ageDivision.shortLabel} • {resolved.sexLabel})
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Tempo oficial: {Math.round(resolved.effectiveMatchDurationSeconds / 60)} min
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {resolved.weightOptions.map((opt) => {
                    const isSelected = resolved.selectedWeight.id === opt.id;
                    const isRecommended = resolved.recommendedWeight.id === opt.id;
                    const maxCap = opt.maxWeight === null ? Infinity : opt.maxWeight + resolved.toleranceKg;
                    const overLimit = resolved.scaleWeightKg > maxCap;
                    const diffKg = opt.maxWeight !== null ? Math.round((resolved.scaleWeightKg - opt.maxWeight) * 100) / 100 : 0;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedWeightDivisionId(opt.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? overLimit
                              ? 'bg-red-500/15 border-red-400 text-white'
                              : 'bg-amber-500/20 border-amber-400 text-white'
                            : overLimit
                            ? 'bg-neutral-950/70 border-neutral-800/80 text-neutral-400 hover:border-red-500/40'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-200 hover:border-neutral-600'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black">{opt.name}</span>
                          {isRecommended && (
                            <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Sua Categoria
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">{opt.displayLimit}</div>
                        {overLimit && (
                          <div className="text-[10px] text-red-400 font-bold mt-0.5">
                            +{diffKg.toFixed(2).replace('.', ',')} kg acima do teto atual
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!selValidation.canPassWeighIn && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{selValidation.message} Escolha sua categoria recomendada ou uma acima (ou reduza peso corporal antes da inscrição).</span>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setRegistrationModalTournament(null)}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs uppercase rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!canConfirm}
                  onClick={() => handleConfirmRegistration(t, currentSelection)}
                  className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                    canConfirm
                      ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/20'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  Confirmar Inscrição {geo.totalRegistrationCost > 0 ? `(R$ ${geo.totalRegistrationCost.toLocaleString('pt-BR')})` : '(Grátis)'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Official Weigh-in Modal */}
      {activeModalTournament && (() => {
        const modalTimeline = getTournamentTimelineInfo(
          activeModalTournament,
          character.currentDate,
          character
        );
        const modalEntry = modalTimeline.historyEntry;
        const isBjjGi = activeModalTournament.art === 'jiujitsu' && resolveTournamentIsGi(activeModalTournament, modalEntry);

        return (
          <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="bg-neutral-900 border-2 border-neutral-700 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative animate-scaleIn max-h-[92vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <span className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 text-2xl">
                  ⚖️
                </span>
                <div>
                  <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">Comissão Atlética & Federação Oficial</span>
                  <h3 className="text-lg sm:text-xl font-black text-white">{activeModalTournament.name}</h3>
                  {modalEntry?.weightDivisionLabel && (
                    <span className="text-[11px] text-cyan-300 font-bold block">
                      {[modalEntry.genderDivision === 'F' ? 'Feminino' : 'Masculino', modalEntry.ageDivisionLabel, modalEntry.rankDivisionLabel, modalEntry.weightDivisionLabel].filter(Boolean).join(' • ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Weigh-in details */}
              <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2.5 mb-5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">Peso Corporal do Atleta:</span>
                  <span className="font-bold text-white">{character.weight.toFixed(2).replace('.', ',')} kg</span>
                </div>
                {isBjjGi && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-400">Quimono Oficial ({getGiColorLabel(weighInValidation?.giColor)}):</span>
                      <span className="font-bold text-blue-300">+{CBJJ_OFFICIAL_GI_WEIGHT_KG.toFixed(2).replace('.', ',')} kg</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-1.5 border-t border-neutral-800">
                      <span className="text-neutral-300 font-bold">Total Aferido na Balança:</span>
                      <span className="font-black text-lg text-white">
                        {(weighInValidation?.scaleWeightKg ?? character.weight).toFixed(2).replace('.', ',')} kg
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">Limite Máximo ({weighInValidation?.weightClass || activeModalTournament.weightClass}):</span>
                  <span className="font-black text-lg text-amber-400">
                    {weighInValidation?.targetWeight === null
                      ? 'Sem limite'
                      : `${(weighInValidation?.targetWeight ?? activeModalTournament.targetWeight).toFixed(2).replace('.', ',')} kg`}
                  </span>
                </div>
                {weighInValidation?.zeroTolerance && (
                  <div className="text-[11px] text-amber-300 font-bold text-right">
                    Tolerância oficial: ZERO (0,00 kg)
                  </div>
                )}

                {weighInValidation?.status === 'aprovado' ? (
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-start gap-2 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="block uppercase tracking-wider text-[11px] font-black">Pesagem Oficial Homologada</span>
                      <span>{weighInValidation.message}</span>
                    </div>
                  </div>
                ) : weighInValidation?.status === 'acima_do_peso' || weighInValidation?.status === 'quimono_irregular' ? (
                  <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl space-y-2 text-red-400 text-xs font-bold">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="block uppercase tracking-wider text-[11px] font-black">
                          {weighInValidation.status === 'quimono_irregular' ? 'Quimono Irregular na Inspeção' : 'Acima do Teto da Categoria'}
                        </span>
                        <span>{weighInValidation.message}</span>
                      </div>
                    </div>
                  </div>
                ) : weighInValidation?.status === 'abaixo_do_peso' ? (
                  <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-start gap-2 text-amber-300 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="block uppercase tracking-wider text-[11px] font-black">Inaptidão por Peso Excessivamente Baixo</span>
                      <span>{weighInValidation.message}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-neutral-800 border border-neutral-700 rounded-xl flex items-start gap-2 text-neutral-300 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-neutral-400" />
                    <div>
                      <span className="block uppercase tracking-wider text-[11px] font-black text-neutral-400">Dados Insuficientes</span>
                      <span>{weighInValidation?.message || 'Dados de peso incompletos. Não é possível homologar a pesagem automaticamente.'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rules explanation */}
              <div className="text-xs text-neutral-400 mb-5 space-y-1">
                <div className="font-bold text-neutral-200">Regulamento & Sede da Federação:</div>
                <p>• {activeModalTournament.organization}</p>
                {isBjjGi && (
                  <p>• CBJJ/IBJJF: balança afere com quimono oficial (branco, azul ou preto). Passou do teto mesmo por gramas, é desclassificação na hora.</p>
                )}
                <p>• Sede: {evaluateTournamentGeographyAndTravel(character, activeModalTournament).host.displayLabel}</p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModalTournament(null)}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
                >
                  {weighInPassed ? 'Cancelar' : 'Sair p/ Ajustar Peso'}
                </button>

                {weighInPassed ? (
                  <button
                    type="button"
                    onClick={() => handleConfirmWeighIn(false)}
                    className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-lg shadow-amber-500/25"
                  >
                    Aprovar Pesagem Oficial
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConfirmWeighIn(true)}
                    className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer bg-red-600/25 hover:bg-red-600/40 text-red-300 border border-red-500/50"
                  >
                    Subir na Balança (Assumir Desclassificação)
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      {/* Bracket Explorer Modal */}
      {bracketModalTournament && (() => {
        const modalTimeline = getTournamentTimelineInfo(
          bracketModalTournament,
          character.currentDate,
          character
        );
        const modalSelection = buildEntrySelection(modalTimeline.historyEntry);
        const bracketState: TournamentBracketState =
          modalTimeline.historyEntry?.bracket ||
          buildTournamentBracket(bracketModalTournament, character, modalTimeline.tournamentYear, modalSelection);

        const participantById = new Map<string, BracketFighterSlot>(
          bracketState.participants.map((p) => [p.id, p])
        );
        const stages: Array<{ key: 'quartas' | 'semifinal' | 'final'; label: string }> =
          bracketState.bracketSize === 8
            ? [
                { key: 'quartas', label: 'Quartas de Final' },
                { key: 'semifinal', label: 'Semifinais' },
                { key: 'final', label: 'Grande Final' }
              ]
            : [
                { key: 'semifinal', label: 'Semifinais' },
                { key: 'final', label: 'Grande Final' }
              ];

        const champion = bracketState.championId
          ? participantById.get(bracketState.championId)
          : undefined;
        const artMeta = MARTIAL_ARTS_META[bracketModalTournament.art];
        const modalGeo = evaluateTournamentGeographyAndTravel(character, bracketModalTournament);

        return (
          <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-neutral-900 border-2 border-neutral-700 rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl relative my-4 max-h-[92vh] overflow-y-auto space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                      {artMeta.name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                      📍 {modalGeo.host.displayLabel} ({getTournamentScopeLabel(bracketModalTournament.scope)})
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase">
                      {bracketState.genderDivision === 'F' ? 'Feminino' : 'Masculino'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-[10px] font-bold uppercase">
                      {bracketState.ageDivisionLabel || getAgeCategoryLabel(bracketState.ageCategory)}
                    </span>
                    {bracketState.rankDivisionLabel && (
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-200 border border-amber-500/30 text-[10px] font-bold">
                        {bracketState.rankDivisionLabel}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      {bracketState.weightDivisionLabel || bracketState.weightClass}
                    </span>
                    {(bracketModalTournament.art === 'jiujitsu' || bracketModalTournament.rulesType === 'bjj_points') && (
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-black uppercase">
                        {resolveTournamentIsGi(bracketModalTournament, modalTimeline.historyEntry) ? '🥋 Gi' : '🤼 No-Gi'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-amber-400 shrink-0" />
                    Chaveamento Oficial ({bracketState.bracketSize} Atletas) — {bracketModalTournament.name}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    {modalTimeline.historyEntry?.bracket
                      ? `Chave oficial registrada para a edição desta temporada · ${modalGeo.scopeDescription}`
                      : `Pré-visualização dos atletas elegíveis por arte marcial, sexo, faixa etária, graduação, peso e geografia · ${modalGeo.scopeDescription}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setBracketModalTournament(null)}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer shrink-0"
                  aria-label="Fechar chaveamento"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {champion && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-neutral-900 border border-amber-500/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{champion.avatar}</span>
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 block">
                        Campeão Oficial da Chave
                      </span>
                      <span className="text-base font-black text-white">
                        {champion.name} {champion.isPlayer ? '(Você!)' : ''}
                      </span>
                      <span className="text-xs text-neutral-400 block">
                        {champion.belt} • {champion.gymName || 'Independente'} ({champion.city ? `${champion.city}${champion.uf ? ` - ${champion.uf}` : `, ${champion.country || 'Brasil'}`}` : champion.country || 'Brasil'})
                      </span>
                    </div>
                  </div>
                  <Trophy className="w-7 h-7 text-amber-400 shrink-0" />
                </div>
              )}

              {/* Chaveamento por Fases */}
              <div className={`grid grid-cols-1 ${bracketState.bracketSize === 8 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-4`}>
                {stages.map((stage) => {
                  const stageMatches = bracketState.matches
                    .filter((m) => m.stage === stage.key)
                    .sort((a, b) => a.matchNumber - b.matchNumber);

                  return (
                    <div key={stage.key} className="space-y-3 bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4">
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                          {stage.label}
                        </h4>
                        <span className="text-[10px] text-neutral-500 font-bold">
                          {stageMatches.length} {stageMatches.length === 1 ? 'luta' : 'lutas'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {stageMatches.map((match) => {
                          const fighterA = match.fighterAId ? participantById.get(match.fighterAId) : undefined;
                          const fighterB = match.fighterBId ? participantById.get(match.fighterBId) : undefined;
                          const aWon = match.winnerId && fighterA && match.winnerId === fighterA.id;
                          const bWon = match.winnerId && fighterB && match.winnerId === fighterB.id;

                          return (
                            <div
                              key={match.matchId}
                              className={`rounded-xl border p-3 space-y-2 ${
                                match.status === 'concluida'
                                  ? 'bg-neutral-900/90 border-neutral-700'
                                  : match.status === 'pronta' && (fighterA?.isPlayer || fighterB?.isPlayer)
                                  ? 'bg-emerald-950/25 border-emerald-500/40'
                                  : 'bg-neutral-900/50 border-neutral-800'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] text-neutral-500 font-bold uppercase">
                                <span>Confronto #{match.matchNumber}</span>
                                <span
                                  className={
                                    match.status === 'concluida'
                                      ? 'text-emerald-400'
                                      : match.status === 'pronta'
                                      ? 'text-amber-400'
                                      : 'text-neutral-500'
                                  }
                                >
                                  {match.status === 'concluida'
                                    ? match.method || 'Concluída'
                                    : match.status === 'pronta'
                                    ? 'Aguardando Combate'
                                    : 'Vencedores Anteriores'}
                                </span>
                              </div>

                              {[fighterA, fighterB].map((slot, slotIdx) => {
                                const isWinner = slotIdx === 0 ? aWon : bWon;
                                const isEliminated = match.status === 'concluida' && !isWinner;
                                return (
                                  <div
                                    key={slotIdx}
                                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${
                                      !slot
                                        ? 'bg-neutral-950/50 border-neutral-800/70 text-neutral-500 italic'
                                        : isWinner
                                        ? 'bg-emerald-500/15 border-emerald-500/40 text-white font-bold'
                                        : isEliminated
                                        ? 'bg-neutral-950/60 border-neutral-800/70 text-neutral-500 line-through'
                                        : slot.isPlayer
                                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 font-bold'
                                        : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                                    }`}
                                  >
                                    {slot ? (
                                      <>
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="text-base shrink-0">{slot.avatar}</span>
                                          <div className="min-w-0">
                                            <div className="truncate flex items-center gap-1">
                                              <span className="truncate">{slot.name}</span>
                                              {slot.isPlayer && (
                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-neutral-950 font-black uppercase shrink-0">
                                                  Você
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[10px] text-neutral-400 truncate">
                                              {slot.belt} • {slot.age}a • {slot.weight.toFixed(1)}kg
                                            </div>
                                          </div>
                                        </div>
                                        <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                                          {slot.record.wins}V-{slot.record.losses}D
                                        </span>
                                      </>
                                    ) : (
                                      <span>A definir na chave</span>
                                    )}
                                  </div>
                                );
                              })}

                              {match.scoreSummary && (
                                <p className="text-[10px] text-neutral-400 leading-snug pt-1 border-t border-neutral-800/70">
                                  Placar / Detalhe: <span className="text-neutral-200 font-semibold">{match.scoreSummary}</span>
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Lista Completa dos Participantes da Chave */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Atletas Inscritos na Chave ({bracketState.participants.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {bracketState.participants.map((p) => (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border space-y-1.5 ${
                        p.isPlayer
                          ? 'bg-amber-500/10 border-amber-500/40'
                          : 'bg-neutral-950 border-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl p-1 bg-neutral-900 rounded-lg">{p.avatar}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate">
                            {p.name} {p.isPlayer ? '★' : ''}
                          </div>
                          <div className="text-[10px] text-amber-400 font-semibold truncate">{p.belt}</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-neutral-400 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Idade / Peso:</span>
                          <span className="text-neutral-200 font-bold">{p.age} anos • {p.weight.toFixed(1)} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cartel:</span>
                          <span className="text-neutral-200 font-bold">
                            {p.record.wins}V - {p.record.losses}D
                          </span>
                        </div>
                        <div className="truncate text-neutral-500">
                          {p.gymName || 'Academia Local'} • {p.city ? `${p.city}${p.uf ? `/${p.uf}` : p.country && p.country !== 'Brasil' ? ` (${p.country})` : ''}` : p.country || 'Brasil'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

