import React, { useState } from 'react';
import { Character, MartialArtType, Move } from '../types/game';
import { MARTIAL_ARTS_META, ALL_MOVES, WORLD_GYMS } from '../data/martialArtsData';
import { sounds } from '../utils/audio';
import { 
  Dumbbell, 
  Award, 
  Flame, 
  ShieldCheck, 
  Sparkles, 
  BookOpen, 
  Zap, 
  Target, 
  AlertCircle,
  CheckCircle2,
  Lock,
  Swords
} from 'lucide-react';

import { 
  validateGraduationRequirements, 
  addTrainingGraduationXp 
} from '../utils/graduationHelper';
import { checkSparringInjuryRisk, resolveEffectiveGymLocation } from '../utils/recoveryHelper';
import { getDisplayBeltForGrad } from '../utils/bjjDegreeHelper';
import { getActiveArtTalentBonus } from '../utils/talentAndDifficultyHelper';
import { getCompetitiveScholarshipDiscount, getGymTrainingEffectiveness } from '../utils/regionalGymsHelper';
import { getEquipmentSummary } from '../utils/equipmentShopHelper';
import { BjjBeltVisual } from './BjjBeltVisual';

interface Props {
  character: Character;
  onUpdateCharacter: (updated: Character) => void;
  onOpenBeltCeremony: (art: MartialArtType) => void;
  onOpenBjjArena?: () => void;
  onOpenBoxingArena?: () => void;
}

export const DojoTrainingView: React.FC<Props> = ({
  character,
  onUpdateCharacter,
  onOpenBeltCeremony,
  onOpenBjjArena,
  onOpenBoxingArena
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const isOwnAcademy = Boolean(character.playerAcademy && character.currentGymId === character.playerAcademy.id);
  const currentGym = isOwnAcademy && character.playerAcademy
    ? {
        ...WORLD_GYMS[0],
        id: character.playerAcademy.id,
        name: character.playerAcademy.name,
        city: character.playerAcademy.city,
        country: character.playerAcademy.country,
        flag: '🏛️',
        masterName: `Prof. ${character.name}`,
        masterPhilosophy: character.playerAcademy.philosophy,
        learningSpeedMultiplier: 1.15 + character.playerAcademy.level * 0.1,
        specialPerk: `Sede Própria (Nível ${character.playerAcademy.level} · Sem Mensalidade)`
      }
    : WORLD_GYMS.find((g) => g.id === character.currentGymId) || WORLD_GYMS[0];
  const currentGymLoc = resolveEffectiveGymLocation(currentGym, character);
  const primaryGrad = character.artGraduations[character.primaryArt];
  const artMeta = MARTIAL_ARTS_META[character.primaryArt];
  const isMma = character.primaryArt === 'mma';

  const eligibility = validateGraduationRequirements(character, character.primaryArt);
  const activeTalent = getActiveArtTalentBonus(character, character.primaryArt);
  const gymEffectiveness = getGymTrainingEffectiveness(currentGym, character.primaryArt);
  const scholarshipEval = getCompetitiveScholarshipDiscount(character, currentGym);
  const equipSummary = getEquipmentSummary(character);
  const equipXpMult = 1 + equipSummary.trainingXpBonusPct / 100;
  const combinedGymMultiplier =
    Math.round((currentGym.learningSpeedMultiplier || 1.0) * gymEffectiveness.effectivenessMultiplier * 100) / 100;

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleTrain = (type: 'tecnica' | 'sparring' | 'fisico' | 'mobilidade' | 'tatica') => {
    if (character.energy < 20) {
      showFeedback('⚠️ Você está exausto demais para treinar agora! Descanse ou alimente-se.');
      return;
    }

    const mult = combinedGymMultiplier;
    const xpMult = Math.round(mult * equipXpMult * 100) / 100;
    const tAttrMult = activeTalent.attrMultiplier;

    if (type === 'tecnica') {
      const { updatedChar, xpAdded, wasCapped } = addTrainingGraduationXp(character, character.primaryArt, 20, xpMult);
      updatedChar.energy -= 20;
      const techGain = Math.round(1.2 * mult * tAttrMult * 10) / 10;
      updatedChar.attributes.technique += techGain;
      sounds.playPunch(false);
      const talentSuffix = activeTalent.discovered && activeTalent.meta && activeTalent.meta.xpBonusPercent > 0 ? ` [Talento ${activeTalent.meta.shortLabel}]` : '';
      if (isMma) {
        showFeedback(`🥊 Treino técnico afiado no octógono! +${techGain.toFixed(1)} Técnica!${talentSuffix}`);
      } else if (wasCapped) {
        showFeedback(`🥋 Treino técnico afiado! +${techGain.toFixed(1)} Técnica! (XP no teto da graduação atual).`);
      } else {
        showFeedback(`🥋 Treino técnico afiado! +${xpAdded} XP de Faixa e +${techGain.toFixed(1)} Técnica!${talentSuffix}`);
      }
      onUpdateCharacter(updatedChar);
    } else if (type === 'sparring') {
      const { updatedChar, xpAdded, wasCapped } = addTrainingGraduationXp(character, character.primaryArt, 25, xpMult);
      updatedChar.energy -= 35;
      updatedChar.accumulatedFatigue = Math.min(100, (updatedChar.accumulatedFatigue || 0) + 4);
      updatedChar.attributes.fightIq += Math.round(1.5 * mult * tAttrMult * 10) / 10;
      updatedChar.attributes.stamina += Math.round(1.0 * mult * tAttrMult * 10) / 10;
      updatedChar.attributes.durability += Math.round(0.8 * mult * tAttrMult * 10) / 10;

      // Avaliação de risco de lesão no sparring (Etapa 3.2 - Fase 5)
      const injuryCheck = checkSparringInjuryRisk(character, currentGym);
      if (injuryCheck.hadInjury && injuryCheck.injury) {
        if (!Array.isArray(updatedChar.injuries)) updatedChar.injuries = [];
        updatedChar.injuries.push(injuryCheck.injury);
        sounds.playPunch(true);
        showFeedback(injuryCheck.injuryMessage || `⚠️ Lesão no sparring! ${injuryCheck.injury.name}`);
      } else {
        sounds.playPunch(true);
        if (isMma) {
          showFeedback(`🥊 Sparring intenso no octógono! +QI de Luta, +Stamina e +Queixo para lutas profissionais!`);
        } else if (wasCapped) {
          showFeedback(`🥊 Sparring intenso no tatame! +QI de Luta e +Resistência! (XP no teto da graduação atual).`);
        } else {
          showFeedback(`🥊 Sparring intenso no tatame! +${xpAdded} XP, +QI de Luta e +Resistência!`);
        }
      }
      onUpdateCharacter(updatedChar);
    } else if (type === 'fisico') {
      const updated = JSON.parse(JSON.stringify(character)) as Character;
      updated.energy -= 30;
      const strGain = Math.round(1.6 * mult * tAttrMult * 10) / 10;
      updated.attributes.strength += strGain;
      updated.attributes.durability += Math.round(1.0 * mult * tAttrMult * 10) / 10;
      sounds.playPunch(true);
      showFeedback(`🏋️ Musculação e potência! +${strGain.toFixed(1)} Força e explosão muscular!`);
      onUpdateCharacter(updated);
    } else if (type === 'mobilidade') {
      const updated = JSON.parse(JSON.stringify(character)) as Character;
      updated.energy -= 15;
      updated.attributes.flexibility += Math.round(2.0 * mult * tAttrMult * 10) / 10;
      updated.mentalHealth = Math.min(100, updated.mentalHealth + 10);
      updated.stress = Math.max(0, updated.stress - 15);
      sounds.playWhoosh();
      showFeedback(`🧘 Alongamento & Mobilidade completados! +Flexibilidade e mente renovada.`);
      onUpdateCharacter(updated);
    } else if (type === 'tatica') {
      const updated = JSON.parse(JSON.stringify(character)) as Character;
      updated.energy -= 15;
      updated.attributes.fightIq += Math.round(1.8 * mult * tAttrMult * 10) / 10;
      updated.attributes.mentalFocus += Math.round(1.5 * mult * tAttrMult * 10) / 10;
      showFeedback(`📖 Estudo tático de vídeos! +QI de Luta e Leitura de Combate.`);
      onUpdateCharacter(updated);
    }
  };

  const handleUnlockMove = (move: Move) => {
    if (character.moves.some((m) => m.id === move.id)) return;
    const updated = JSON.parse(JSON.stringify(character)) as Character;
    move.isUnlocked = true;
    updated.moves.push(move);
    sounds.playGraduation();
    showFeedback(`✨ Novo Golpe Desbloqueado: ${move.name}! Pronto para usar nos combates!`);
    onUpdateCharacter(updated);
  };

  // Find unlockable moves for current primary art or global
  const availableToUnlock = ALL_MOVES.filter((m) => {
    const alreadyHas = character.moves.some((my) => my.id === m.id);
    if (alreadyHas) return false;
    const isArtMatch = m.art === character.primaryArt || m.art === 'mma';
    const isBeltMet = primaryGrad.rankIndex >= m.minBeltIndex;
    return isArtMatch && isBeltMet;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Dojo Banner & Master Greeting */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xl">{currentGym.flag}</span>
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">{currentGym.name}</span>
              <span className="text-[11px] text-neutral-400">
                • {currentGymLoc.city}{currentGymLoc.uf ? ` (${currentGymLoc.uf})` : `, ${currentGymLoc.country}`}
              </span>
              {currentGym.teamName && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-amber-300 border border-neutral-700 font-bold">
                  {currentGym.teamName}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">Centro de Treinamento & Tatame</h1>
            <p className="text-xs md:text-sm text-neutral-400 mt-1 max-w-2xl italic">
              "{currentGym.masterPhilosophy}" — <span className="text-neutral-300 font-semibold">{currentGym.masterName}</span>
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                gymEffectiveness.offersArt
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}>
                {gymEffectiveness.summaryLabel}
              </span>
              {scholarshipEval.eligible && scholarshipEval.label && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-cyan-500/15 text-cyan-300 border-cyan-500/30">
                  🎓 {scholarshipEval.label}
                </span>
              )}
            </div>
          </div>

          <div className="w-full md:w-auto shrink-0 bg-neutral-950 p-3.5 sm:p-4 rounded-xl border border-neutral-800 text-left md:text-right">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">Aceleração Efetiva de Aprendizado</span>
            <span className="text-xl font-black text-amber-400">+{Math.round((combinedGymMultiplier - 1) * 100)}%</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">{currentGym.specialPerk}</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-center text-sm font-bold text-amber-300 animate-fadeIn">
          {feedback}
        </div>
      )}

      {/* Belt Progression & Career Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md border border-white/20 shrink-0"
              style={{ background: primaryGrad.gradientStyle || primaryGrad.color, color: primaryGrad.textColor }}
            >
              {isMma ? '🥊' : character.primaryArt === 'capoeira' ? '🪢' : '🥋'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold">
                  {isMma ? 'Divisão & Nível no Octógono' : 'Graduação Atual'}
                </span>
                <span className="text-[10px] bg-neutral-800 text-amber-400 px-2 py-0.5 rounded-full border border-neutral-700 font-bold">
                  {artMeta.name}
                </span>
                {primaryGrad.categoryName && (
                  <span className="text-[10px] bg-neutral-800 text-emerald-400 px-2 py-0.5 rounded-full border border-neutral-700 font-bold">
                    {primaryGrad.categoryName}
                  </span>
                )}
                {isMma && (
                  <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-800 font-bold">
                    Cartel: {character.record?.mmaWins || 0}V - {character.record?.mmaLosses || 0}D
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-white">
                {getDisplayBeltForGrad(character.primaryArt, primaryGrad)}
              </h2>
              {character.primaryArt === 'jiujitsu' && (
                <div className="my-1.5 max-w-xs">
                  <BjjBeltVisual
                    rankIndex={primaryGrad.rankIndex}
                    stripes={primaryGrad.stripes}
                    label={getDisplayBeltForGrad('jiujitsu', primaryGrad)}
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-2 text-xs text-neutral-400 mt-0.5">
                <span>
                  Progresso: <strong className="text-amber-400">{Math.min(primaryGrad.xp, primaryGrad.xpNeeded)}</strong> / {primaryGrad.xpNeeded} XP
                </span>
                {primaryGrad.estimatedTime && (
                  <span>• Tempo Estimado: <strong className="text-neutral-300">{primaryGrad.estimatedTime}</strong></span>
                )}
                {primaryGrad.monthsInRank !== undefined && !isMma && (
                  <span>• Permanência na Faixa: <strong className="text-neutral-300">{primaryGrad.monthsInRank} meses</strong></span>
                )}
              </div>
              <div className="mt-2">
                {activeTalent.discovered && activeTalent.meta ? (
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${activeTalent.meta.badgeClass}`}>
                    <Sparkles className="w-3 h-3" />
                    Talento em {artMeta.name.split(' ')[0]}: {activeTalent.meta.shortLabel}
                    {activeTalent.meta.xpBonusPercent > 0
                      ? ` (+${activeTalent.meta.xpBonusPercent}% XP · +${activeTalent.meta.attrBonusPercent}% Atributos)`
                      : ' (Evolução padrão)'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-neutral-800 bg-neutral-950 text-neutral-400">
                    <Lock className="w-3 h-3 text-amber-400" />
                    Talento Oculto nesta arte — matricule-se em uma turma na Agenda Semanal para descobrir!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action / Status Area */}
          <div className="w-full lg:w-auto text-left lg:text-right shrink-0">
            {isMma ? (
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs space-y-1">
                <div className="font-bold text-amber-400 flex items-center gap-1.5 lg:justify-end">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Trajetória Profissional no Octógono</span>
                </div>
                <p className="text-[11px] text-neutral-400 max-w-md">
                  A promoção no MMA é conquistada vencendo lutas oficiais e torneios sancionados, sem exame de faixa tradicional.
                </p>
                {eligibility.nextRank && (
                  <div className="text-[10px] text-neutral-300 pt-1 border-t border-neutral-800/80">
                    Próxima Divisão: <strong className="text-white">{eligibility.nextRank.name}</strong> • Requer {eligibility.nextRank.minMmaWins || 0} vitórias e idade mín. {eligibility.nextRank.minAge || 18} anos.
                  </div>
                )}
              </div>
            ) : eligibility.canAdvance ? (
              <button
                type="button"
                onClick={() => onOpenBeltCeremony(character.primaryArt)}
                className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/30 animate-pulse flex items-center justify-center gap-2 cursor-pointer"
              >
                <Award className="w-5 h-5 text-neutral-950" />
                Prestar Exame de Faixa com o Mestre!
              </button>
            ) : primaryGrad.xp >= primaryGrad.xpNeeded ? (
              <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-xl text-left max-w-md">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>XP Concluído! Requisitos Regulamentares Pendentes:</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  {eligibility.requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2">
                      <span className={req.met ? 'text-neutral-400' : 'text-amber-200 font-semibold'}>
                        {req.label}:
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        req.met ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                      }`}>
                        {req.current} / {req.required} {req.met ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-right">
                <span className="text-[11px] text-neutral-500 block">
                  Faltam {Math.max(0, primaryGrad.xpNeeded - primaryGrad.xp)} XP para o exame
                </span>
                <div className="w-full lg:w-44 h-2 bg-neutral-950 rounded-full overflow-hidden mt-1 border border-neutral-800">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                    style={{ width: `${Math.min(100, (primaryGrad.xp / primaryGrad.xpNeeded) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Specialized 2D Isometric Combat Arenas (BJJ & Boxe) */}
      {(onOpenBjjArena || onOpenBoxingArena) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {onOpenBjjArena && (
            <div className="bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-neutral-900 border border-cyan-500/30 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-cyan-950/20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                  🥋
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/90 px-2 py-0.5 rounded border border-cyan-800">
                      Tatame Isométrico Especializado
                    </span>
                    <span className="text-[10px] text-neutral-400">CBJJ / IBJJF</span>
                  </div>
                  <h3 className="text-base font-black text-white mt-1">Tatame de Jiu-Jitsu Brasileiro</h3>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    47 posições, 80 técnicas de raspagem, passagem e finalização com IA tática.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenBjjArena}
                className="w-full sm:w-auto px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-all"
              >
                <Swords className="w-4 h-4 text-neutral-950" />
                Tatame BJJ
              </button>
            </div>
          )}

          {onOpenBoxingArena && (
            <div className="bg-gradient-to-r from-red-950/40 via-amber-950/25 to-neutral-900 border border-amber-500/35 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-amber-950/20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                  🥊
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-800">
                      Ringue Isométrico Especializado
                    </span>
                    <span className="text-[10px] text-neutral-400">CBBoxe / 10-Point Must</span>
                  </div>
                  <h3 className="text-base font-black text-white mt-1">Arena de Boxe (Nobre Arte)</h3>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Combinações, slips e contragolpes, cortes nas cordas, knockdowns e 3 juízes oficiais.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenBoxingArena}
                className="w-full sm:w-auto px-4 py-3 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-all"
              >
                <Swords className="w-4 h-4 text-neutral-950" />
                Ringue Boxe
              </button>
            </div>
          )}
        </div>
      )}

      {/* Training Regimens Grid */}
      <div>
        <h2 className="text-sm uppercase tracking-wider font-bold text-neutral-400 mb-3 flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-amber-400" /> Rotinas de Treino da Semana
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Técnica */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-all">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl">🥋</span>
                <span className="text-[10px] text-cyan-400 font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                  -20 Energia
                </span>
              </div>
              <h3 className="font-bold text-white text-sm">Treino Técnico & Repetição</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Repetições exaustivas de posições, entradas de golpes e ajustes finos de alavanca.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80">
              <div className="text-[11px] text-neutral-300 font-semibold mb-2">
                ⚡ +Técnica & +XP de Faixa
              </div>
              <button
                type="button"
                onClick={() => handleTrain('tecnica')}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Treinar Técnica
              </button>
            </div>
          </div>

          {/* 2. Sparring */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-all">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl">🥊</span>
                <span className="text-[10px] text-red-400 font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                  -35 Energia
                </span>
              </div>
              <h3 className="font-bold text-white text-sm">Sparring de Combate Real</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Rola solto e trocação forte com parceiros de treino para testar o tempo de reação e queixo.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80">
              <div className="text-[11px] text-neutral-300 font-semibold mb-1">
                ⚡ +QI de Luta, +Stamina & +XP
              </div>
              <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-2">
                <span>Risco de Lesão:</span>
                <span className={`font-bold px-1.5 py-0.5 rounded border ${
                  checkSparringInjuryRisk(character, currentGym, 1.0).riskPercentage > 15
                    ? 'text-red-400 bg-red-950/60 border-red-800'
                    : checkSparringInjuryRisk(character, currentGym, 1.0).riskPercentage > 8
                    ? 'text-amber-400 bg-amber-950/60 border-amber-800'
                    : 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                }`}>
                  {checkSparringInjuryRisk(character, currentGym, 1.0).riskPercentage}% {character.energy < 40 ? '⚠️ Alta Fadiga' : 'Controlado'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTrain('sparring')}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Fazer Sparring
              </button>
            </div>
          </div>

          {/* 3. Físico */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-all">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl">🏋️</span>
                <span className="text-[10px] text-amber-400 font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                  -30 Energia
                </span>
              </div>
              <h3 className="font-bold text-white text-sm">Preparação Física & Força</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Levantamento de peso, tiros na ladeira e calistenia para explodir nas pegadas e golpes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80">
              <div className="text-[11px] text-neutral-300 font-semibold mb-2">
                ⚡ +Força & +Durabilidade
              </div>
              <button
                type="button"
                onClick={() => handleTrain('fisico')}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Puxar Ferro
              </button>
            </div>
          </div>

          {/* 4. Mobilidade */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-all">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl">🧘</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                  -15 Energia
                </span>
              </div>
              <h3 className="font-bold text-white text-sm">Mobilidade, Ioga & Alongamento</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Previne lesões articulares, amplia o alcance dos chutes e recupera a serenidade mental.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80">
              <div className="text-[11px] text-neutral-300 font-semibold mb-2">
                ⚡ +Flexibilidade & -Estresse
              </div>
              <button
                type="button"
                onClick={() => handleTrain('mobilidade')}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Alongar
              </button>
            </div>
          </div>

          {/* 5. Tática */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-all">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl">📖</span>
                <span className="text-[10px] text-purple-400 font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                  -15 Energia
                </span>
              </div>
              <h3 className="font-bold text-white text-sm">Estudo de Fitas & Tática</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Análise de lutas históricas do Pride, UFC e Mundiais para afiar o timing e armadilhas.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80">
              <div className="text-[11px] text-neutral-300 font-semibold mb-2">
                ⚡ +QI de Luta & +Foco
              </div>
              <button
                type="button"
                onClick={() => handleTrain('tatica')}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Estudar Lutas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Unlock New Moves Section */}
      {availableToUnlock.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Técnicas Prontas para Lapidação (Desbloqueáveis pela sua Graduação)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableToUnlock.map((m) => (
              <div key={m.id} className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{m.name}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      {m.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">{m.description}</p>
                  <div className="flex gap-2 text-[10px] text-neutral-300 mt-1">
                    <span className="text-red-400">Dano: {m.damage}</span>
                    <span className="text-cyan-400">Gás: {m.staminaCost}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleUnlockMove(m)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-lg shrink-0 transition-colors cursor-pointer"
                >
                  Aprender
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
