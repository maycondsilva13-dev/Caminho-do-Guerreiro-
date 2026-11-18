import React, { useMemo, useState } from 'react';
import { AcademyStudent, Character, MartialArtType } from '../types/game';
import { MARTIAL_ARTS_META } from '../data/martialArtsData';
import {
  ACADEMY_SEMINAR_COOLDOWN_MONTHS,
  dismissAcademyStudent,
  enrollSocialContactInAcademy,
  evaluateStudentGraduationReadiness,
  foundPlayerAcademy,
  getEligibleProfessorArts,
  getRegionalAcademyEconomics,
  holdAcademySeminarAndGraduation,
  interactWithAcademyStudent,
  promoteStudentByProfessor,
  recruitAcademyStudent,
  updatePlayerAcademySettings,
  upgradePlayerAcademy
} from '../utils/playerAcademyHelper';
import { getRelationLabel } from '../utils/socialLifeHelper';
import { BjjBeltVisual } from './BjjBeltVisual';
import { sounds } from '../utils/audio';
import {
  Award,
  Building2,
  Check,
  Coins,
  Dumbbell,
  MessageSquare,
  Plus,
  Settings,
  Sparkles,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users
} from 'lucide-react';

interface Props {
  character: Character;
  onUpdateCharacter: (updated: Character) => void;
  onNotify: (msg: string) => void;
}

const TALENT_LABEL: Record<AcademyStudent['talent'], string> = {
  dedicado: 'Dedicado',
  prodigio: 'Prodígio',
  recreativo: 'Recreativo',
  competidor: 'Competidor'
};

export const PlayerAcademyPanel: React.FC<Props> = ({
  character,
  onUpdateCharacter,
  onNotify
}) => {
  const eligibilities = useMemo(() => getEligibleProfessorArts(character), [character]);
  const eligibleArts = useMemo(() => eligibilities.filter((e) => e.eligible), [eligibilities]);

  const [selectedArt, setSelectedArt] = useState<MartialArtType>(
    () => eligibleArts[0]?.art || character.primaryArt || 'jiujitsu'
  );
  const [academyNameInput, setAcademyNameInput] = useState(
    () => `CT ${character.nickname || character.name.split(' ')[0]}`
  );
  const [philosophyInput, setPhilosophyInput] = useState(
    'Técnica afiada, disciplina no tatame e formação de caráter.'
  );
  const founderEcon = useMemo(() => getRegionalAcademyEconomics(character), [character]);
  const [monthlyFeeInput, setMonthlyFeeInput] = useState(() => founderEcon.suggestedMonthlyFee);

  const [editingSettings, setEditingSettings] = useState(false);
  const [editName, setEditName] = useState(character.playerAcademy?.name || '');
  const [editFee, setEditFee] = useState(
    character.playerAcademy?.monthlyFeePerStudent || founderEcon.suggestedMonthlyFee
  );
  const [editPhilosophy, setEditPhilosophy] = useState(character.playerAcademy?.philosophy || '');

  const [showSocialPicker, setShowSocialPicker] = useState(false);
  const [gradNoteByStudent, setGradNoteByStudent] = useState<Record<string, string>>({});

  const acad = character.playerAcademy;
  const academyEcon = useMemo(
    () =>
      acad
        ? getRegionalAcademyEconomics({
            currentCity: acad.city,
            currentCountry: acad.country,
            homeCity: acad.city,
            homeState: character.homeState
          })
        : founderEcon,
    [acad, character.homeState, founderEcon]
  );

  const enrollableContacts = useMemo(() => {
    if (!acad) return [];
    const enrolledIds = new Set(acad.students.map((s) => s.linkedContactId).filter(Boolean));
    return (character.socialContacts || []).filter(
      (c) =>
        c.isAlive &&
        c.age >= 7 &&
        c.relationshipStage !== 'inimigo' &&
        !enrolledIds.has(c.id)
    );
  }, [acad, character.socialContacts]);

  const handleFoundAcademy = () => {
    const res = foundPlayerAcademy(character, {
      name: academyNameInput,
      art: selectedArt,
      philosophy: philosophyInput,
      monthlyFeePerStudent: monthlyFeeInput,
      setAsHomeGym: true
    });
    if (res.success) {
      sounds.playGraduation();
      onUpdateCharacter(res.updatedChar);
      setEditName(res.updatedChar.playerAcademy?.name || '');
      setEditFee(res.updatedChar.playerAcademy?.monthlyFeePerStudent || 180);
      setEditPhilosophy(res.updatedChar.playerAcademy?.philosophy || '');
    }
    onNotify(res.message);
  };

  const handleRecruit = () => {
    const res = recruitAcademyStudent(character);
    if (res.success) {
      sounds.playWhoosh();
      onUpdateCharacter(res.updatedChar);
    }
    onNotify(res.message);
  };

  const handleEnrollContact = (contactId: string) => {
    const res = enrollSocialContactInAcademy(character, contactId);
    if (res.success) {
      sounds.playGraduation();
      onUpdateCharacter(res.updatedChar);
      setShowSocialPicker(false);
    }
    onNotify(res.message);
  };

  const handleInteract = (
    action: 'dar_aula_turma' | 'aula_particular' | 'sparring_professor' | 'motivar',
    studentId?: string
  ) => {
    const res = interactWithAcademyStudent(character, action, studentId);
    if (res.success) {
      sounds.playPunch(action === 'sparring_professor');
      onUpdateCharacter(res.updatedChar);
    }
    onNotify(res.message);
  };

  const handleProfessorDecision = (
    studentId: string,
    decision: 'award_stripe' | 'promote_belt' | 'hold'
  ) => {
    const note = gradNoteByStudent[studentId];
    const res = promoteStudentByProfessor(character, studentId, decision, note);
    if (res.success) {
      if (decision !== 'hold') sounds.playGraduation();
      else sounds.playWhoosh();
      onUpdateCharacter(res.updatedChar);
      if (note) {
        setGradNoteByStudent((prev) => ({ ...prev, [studentId]: '' }));
      }
    }
    onNotify(res.message);
  };

  const handleDismiss = (studentId: string) => {
    const res = dismissAcademyStudent(character, studentId);
    if (res.success) {
      onUpdateCharacter(res.updatedChar);
    }
    onNotify(res.message);
  };

  const handleUpgrade = () => {
    const res = upgradePlayerAcademy(character);
    if (res.success) {
      sounds.playGraduation();
      onUpdateCharacter(res.updatedChar);
    }
    onNotify(res.message);
  };

  const handleSaveSettings = () => {
    const res = updatePlayerAcademySettings(character, {
      name: editName,
      monthlyFeePerStudent: editFee,
      philosophy: editPhilosophy
    });
    if (res.success) {
      setEditingSettings(false);
      onUpdateCharacter(res.updatedChar);
    }
    onNotify(res.message);
  };

  const handleSetAsHomeGym = () => {
    if (!acad || character.currentGymId === acad.id) return;
    const updated = JSON.parse(JSON.stringify(character)) as Character;
    updated.currentGymId = acad.id;
    updated.currentCity = acad.city;
    updated.currentCountry = acad.country;
    sounds.playWhoosh();
    onUpdateCharacter(updated);
    onNotify(`🏛️ Você definiu "${acad.name}" como sua sede principal de treinos (sem mensalidade!).`);
  };

  const handleHoldSeminar = () => {
    const res = holdAcademySeminarAndGraduation(character);
    if (res.success) {
      sounds.playGraduation();
      onUpdateCharacter(res.updatedChar);
    }
    onNotify(res.message);
  };

  // Estado 1: Jogador ainda não fundou academia
  if (!acad) {
    return (
      <div className="space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                Fundar Sua Própria Academia (Modo Professor)
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
                Ao alcançar o grau de Professor / Faixa Preta / Kru em qualquer arte marcial (e 18+ anos), você pode abrir sua própria escola dessa arte, recrutar alunos NPCs, matricular familiares e decidir pessoalmente os graus e faixas dos seus pupilos.
              </p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-right shrink-0 tabular-nums">
              <span className="text-[11px] text-neutral-500 block">
                Investimento em {founderEcon.localityLabel} ({founderEcon.costTierLabel})
              </span>
              <span className="text-base font-black text-amber-400">
                R$ {founderEcon.foundCost.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          {eligibleArts.length === 0 ? (
            <div className="space-y-3">
              <div className="p-4 bg-amber-950/25 border border-amber-800/40 rounded-xl text-xs text-amber-200">
                Você ainda não atingiu a graduação de Professor e maioridade civil (18+ anos) em nenhuma modalidade. Veja os requisitos em cada arte:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {eligibilities.map((el) => (
                  <div
                    key={el.art}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-1.5 text-xs"
                  >
                    <div className="font-bold text-white">{el.artName}</div>
                    <div className="text-neutral-400 truncate">Atual: {el.currentRankName}</div>
                    <div className="text-amber-400 font-semibold">Exige: {el.requiredTitle}</div>
                    <div className="text-[11px] text-neutral-500">
                      {el.ageMet ? 'Idade OK (18+)' : `Idade atual ${character.age}/18`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Arte Marcial da Academia (Você é Professor habilitado):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {eligibleArts.map((el) => {
                      const active = selectedArt === el.art;
                      return (
                        <button
                          key={el.art}
                          type="button"
                          onClick={() => setSelectedArt(el.art)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            active
                              ? 'bg-amber-500/15 border-amber-500 text-white'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                          }`}
                        >
                          <div className="font-black text-sm">{el.artName}</div>
                          <div className="text-[11px] text-amber-400 truncate mt-0.5">
                            {el.currentRankName}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-1">
                      Nome da Sua Academia
                    </label>
                    <input
                      type="text"
                      value={academyNameInput}
                      onChange={(e) => setAcademyNameInput(e.target.value)}
                      maxLength={48}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-1">
                      Mensalidade por Aluno (R$)
                    </label>
                    <input
                      type="number"
                      min={80}
                      max={600}
                      value={monthlyFeeInput}
                      onChange={(e) => setMonthlyFeeInput(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white tabular-nums focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">
                    Filosofia & Lema do Dojo
                  </label>
                  <input
                    type="text"
                    value={philosophyInput}
                    onChange={(e) => setPhilosophyInput(e.target.value)}
                    maxLength={100}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="font-black text-white text-sm">Resumo da Abertura</div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Sede:</span>
                    <span className="text-neutral-200 font-semibold">
                      {founderEcon.localityLabel}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Aluguel Mensal Regional:</span>
                    <span className="text-neutral-200 font-semibold tabular-nums">
                      R$ {founderEcon.rentLevel1.toLocaleString('pt-BR')}/mês
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Mensalidade Sugerida:</span>
                    <span className="text-cyan-300 font-semibold tabular-nums">
                      R$ {founderEcon.suggestedMonthlyFee.toLocaleString('pt-BR')}/aluno
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Turma Inicial:</span>
                    <span className="text-emerald-400 font-semibold">3 alunos matriculados</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Capacidade Nível 1:</span>
                    <span className="text-neutral-200 font-semibold tabular-nums">8 alunos</span>
                  </div>
                  <div className="flex justify-between text-neutral-400 pt-2 border-t border-neutral-800">
                    <span>Seu Saldo:</span>
                    <span
                      className={`font-black tabular-nums ${
                        character.money >= founderEcon.foundCost ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      R$ {character.money.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={character.money < founderEcon.foundCost}
                  onClick={handleFoundAcademy}
                  className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    character.money >= founderEcon.foundCost
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Fundar Academia (R$ {founderEcon.foundCost.toLocaleString('pt-BR')})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Estado 2: Academia já fundada — Painel completo de Professor & Alunos
  const artMeta = MARTIAL_ARTS_META[acad.art];
  const isHomeGym = character.currentGymId === acad.id;
  const upgradeCost =
    acad.level === 1 ? academyEcon.upgradeToLevel2Cost : academyEcon.upgradeToLevel3Cost;
  const estimatedGross = acad.students.length * acad.monthlyFeePerStudent;

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Academia do Professor */}
      <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
              <span className="text-amber-400 font-black uppercase tracking-wider">
                Sua Academia · Nível {acad.level}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-neutral-200 font-semibold">{artMeta.name}</span>
              <span aria-hidden="true">·</span>
              <span>
                {acad.city}, {acad.country}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">{acad.name}</h2>
            <p className="text-xs text-neutral-400 italic">
              "{acad.philosophy}" — Prof. {character.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isHomeGym ? (
              <span className="px-3 py-2 bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Sua Sede de Treinos
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSetAsHomeGym}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-xs font-bold rounded-xl border border-neutral-700 cursor-pointer"
              >
                Treinar na Minha Academia
              </button>
            )}

            <button
              type="button"
              onClick={() => setEditingSettings((v) => !v)}
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-xl border border-neutral-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              Configurar
            </button>

            {acad.level < 3 && (
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={character.money < upgradeCost}
                className={`px-3.5 py-2 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer ${
                  character.money >= upgradeCost
                    ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Expandir Tatame (R$ {upgradeCost.toLocaleString('pt-BR')})
              </button>
            )}
          </div>
        </div>

        {/* Métricas Financeiras & Acadêmicas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
            <span className="text-neutral-500 block">Alunos Matriculados</span>
            <span className="text-lg font-black text-white">
              {acad.students.length} / {acad.maxCapacity}
            </span>
          </div>
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
            <span className="text-neutral-500 block">Mensalidade / Receita Est.</span>
            <span className="text-lg font-black text-emerald-400">
              R$ {acad.monthlyFeePerStudent} · R$ {estimatedGross.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
            <span className="text-neutral-500 block">Aluguel / Lucro Últ. Mês</span>
            <span
              className={`text-lg font-black ${
                (acad.lastMonthProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              R$ {acad.monthlyRentCost} ·{' '}
              {acad.lastMonthProfit !== undefined
                ? `${acad.lastMonthProfit >= 0 ? '+' : ''}R$ ${acad.lastMonthProfit.toLocaleString('pt-BR')}`
                : 'Aguardando mês'}
            </span>
          </div>
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
            <span className="text-neutral-500 block">Reputação da Escola</span>
            <span className="text-lg font-black text-amber-400">{acad.reputation} pts</span>
          </div>
        </div>

        {/* Edição inline de configurações */}
        {editingSettings && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-400 block mb-1">Nome</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                Mensalidade (R$ 60–700)
              </label>
              <input
                type="number"
                min={60}
                max={700}
                value={editFee}
                onChange={(e) => setEditFee(Number(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white tabular-nums"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-400 block mb-1">Filosofia</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editPhilosophy}
                  onChange={(e) => setEditPhilosophy(e.target.value)}
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs rounded-lg cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ações Coletivas do Professor */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => handleInteract('dar_aula_turma')}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Dumbbell className="w-4 h-4" />
            Ministrar Aula Coletiva (18⚡)
          </button>

          <button
            type="button"
            onClick={handleRecruit}
            disabled={acad.students.length >= acad.maxCapacity}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer border ${
              acad.students.length < acad.maxCapacity
                ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700'
                : 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed'
            }`}
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            Recrutar Novo Aluno
          </button>

          <button
            type="button"
            onClick={() => setShowSocialPicker((v) => !v)}
            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl border border-neutral-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            Matricular Amigo / Familiar ({enrollableContacts.length})
          </button>

          {(() => {
            const monthsSince =
              acad.lastSeminarCareerMonth !== undefined
                ? (character.careerMonthsElapsed || 0) - acad.lastSeminarCareerMonth
                : ACADEMY_SEMINAR_COOLDOWN_MONTHS;
            const cooldownRem = Math.max(0, ACADEMY_SEMINAR_COOLDOWN_MONTHS - monthsSince);
            return (
              <button
                type="button"
                onClick={handleHoldSeminar}
                className={`px-4 py-2.5 font-bold text-xs rounded-xl border flex items-center gap-1.5 cursor-pointer ${
                  cooldownRem === 0
                    ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                }`}
              >
                <Award className="w-4 h-4 text-emerald-400" />
                {cooldownRem > 0
                  ? `Seminário Coletivo (${cooldownRem}m p/ liberar)`
                  : `Seminário & Exame Coletivo (R$ ${academyEcon.seminarCost} · 20⚡)`}
              </button>
            );
          })()}
        </div>

        {/* Picker para matricular contatos do círculo social */}
        {showSocialPicker && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-neutral-300">
              Escolha um familiar ou amigo (7+ anos) para treinar {artMeta.name} na sua academia:
            </div>
            {enrollableContacts.length === 0 ? (
              <div className="text-xs text-neutral-500">
                Nenhum contato elegível disponível no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {enrollableContacts.map((c) => (
                  <div
                    key={c.id}
                    className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">
                        {c.avatar} {c.name}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {getRelationLabel(c)} · {c.age} anos
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEnrollContact(c.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg cursor-pointer shrink-0"
                    >
                      Matricular
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lista de Alunos NPCs com Interação & Graduação à Escolha do Professor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Turma & Graduações à Escolha do Professor ({acad.students.length})
          </h3>
          <span className="text-xs text-neutral-400">
            Nenhum aluno sobe de grau ou faixa sem a sua decisão como Professor.
          </span>
        </div>

        {acad.students.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-sm text-neutral-400">
            Sua academia está sem alunos no momento. Recrute novos talentos ou matricule familiares!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {acad.students.map((stu) => {
              const readiness = evaluateStudentGraduationReadiness(stu);
              return (
                <div
                  key={stu.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    {/* Identificação & Status de Prontidão */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-neutral-800 flex items-center justify-center text-2xl shrink-0">
                          {stu.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-white text-base truncate">
                            {stu.name}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400 tabular-nums">
                            <span>{stu.age} anos</span>
                            <span aria-hidden="true">·</span>
                            <span>{TALENT_LABEL[stu.talent]}</span>
                            <span aria-hidden="true">·</span>
                            <span>{stu.monthsInRank}m na faixa</span>
                            {stu.linkedContactId && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-cyan-400 font-semibold">Círculo Social</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold shrink-0 ${
                          readiness.statusLabel === 'Pronto (Recomendado)'
                            ? 'text-emerald-400'
                            : readiness.statusLabel === 'Graduado Máximo'
                            ? 'text-amber-400'
                            : 'text-neutral-400'
                        }`}
                      >
                        {readiness.statusLabel}
                      </span>
                    </div>

                    {/* Graduação Atual & Visual de Graus */}
                    <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400 font-semibold">Graduação Atual</span>
                        <span className="text-amber-300 font-bold">{stu.belt}</span>
                      </div>

                      {stu.art === 'jiujitsu' && (
                        <BjjBeltVisual
                          rankIndex={stu.rankIndex}
                          stripes={stu.stripes}
                          label={stu.belt}
                        />
                      )}

                      <div className="flex justify-between items-center text-[11px] text-neutral-400 tabular-nums pt-0.5">
                        <span>
                          XP Técnico: <strong className="text-neutral-200">{stu.xp} / {stu.xpNeeded}</strong> ({readiness.xpPct}%)
                        </span>
                        <span>
                          Téc. <strong className="text-white">{stu.technique.toFixed(1)}</strong> · Freq.{' '}
                          <strong className="text-white">{stu.attendance}%</strong> · Leald.{' '}
                          <strong className="text-emerald-400">{stu.loyalty}%</strong>
                        </span>
                      </div>

                      <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${readiness.xpPct}%` }}
                        />
                      </div>

                      {stu.lastInteractionNote && (
                        <div className="text-[11px] text-neutral-400 italic">
                          "{stu.lastInteractionNote}"
                        </div>
                      )}
                      {readiness.nextBeltAgeNote && (
                        <div className="text-[11px] text-amber-400">
                          {readiness.nextBeltAgeNote}
                        </div>
                      )}
                    </div>

                    {/* Interação Individual com o Aluno */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleInteract('aula_particular', stu.id)}
                        className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Particular (10⚡)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInteract('sparring_professor', stu.id)}
                        className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Dumbbell className="w-3 h-3 text-cyan-400" />
                        Sparring (12⚡)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInteract('motivar', stu.id)}
                        className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-400" />
                        Motivar (5⚡)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismiss(stu.id)}
                        className="px-2.5 py-1.5 bg-neutral-950 hover:bg-red-950/60 text-neutral-500 hover:text-red-300 border border-neutral-800 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer ml-auto"
                        title="Encerrar matrícula deste aluno"
                      >
                        <UserMinus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Decisão Docente de Graduação */}
                  <div className="pt-3 border-t border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="font-bold uppercase tracking-wider text-amber-400">
                        Decisão de Graduação do Professor
                      </span>
                      {stu.graduationHistory && stu.graduationHistory.length > 0 && (
                        <span>{stu.graduationHistory.length} graduação(ões)</span>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Observação opcional da outorga..."
                      value={gradNoteByStudent[stu.id] || ''}
                      onChange={(e) =>
                        setGradNoteByStudent((prev) => ({ ...prev, [stu.id]: e.target.value }))
                      }
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                    />

                    <div className="flex flex-wrap gap-2">
                      {readiness.canAwardStripe && (
                        <button
                          type="button"
                          onClick={() => handleProfessorDecision(stu.id, 'award_stripe')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer ${
                            readiness.recommendedDecision === 'award_stripe'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-emerald-300 border border-emerald-800/50'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Dar {stu.stripes + 1}º Grau
                        </button>
                      )}

                      {readiness.canPromoteBelt && readiness.nextRankName && (
                        <button
                          type="button"
                          onClick={() => handleProfessorDecision(stu.id, 'promote_belt')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer ${
                            readiness.recommendedDecision === 'promote_belt'
                              ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-700/50'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          Promover: {readiness.nextRankName.split('(')[0].trim()}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleProfessorDecision(stu.id, 'hold')}
                        className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Segurar na Faixa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
