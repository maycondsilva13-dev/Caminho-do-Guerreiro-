import React, { useState } from 'react';
import { Character, MartialArtType, SavedFightLogEntry } from '../types/game';
import { MARTIAL_ARTS_META } from '../data/martialArtsData';
import { sounds } from '../utils/audio';
import { formatGameDate, formatCareerDuration } from '../utils/dateUtils';
import { getDisplayBeltForGrad } from '../utils/bjjDegreeHelper';
import { getActiveArtTalentBonus, getDifficultyProfile } from '../utils/talentAndDifficultyHelper';
import { getPlayerLocationSummary } from '../utils/regionalEconomyHelper';
import { getEffectiveAttributes, getEquipmentSummary } from '../utils/equipmentShopHelper';
import { EQUIPMENT_SLOT_META } from '../data/equipmentShopData';
import { BjjBeltVisual } from './BjjBeltVisual';
import { 
  UserCheck, 
  Award, 
  Flame, 
  Shield, 
  Sparkles, 
  TrendingUp, 
  Trophy, 
  Check, 
  Swords, 
  Zap, 
  Heart, 
  Brain,
  Info,
  BookOpen,
  X,
  MapPin,
  Calendar,
  FileText,
  Clock,
  ShoppingBag
} from 'lucide-react';

interface Props {
  character: Character;
  onUpdateCharacter: (updated: Character) => void;
  onOpenShop?: () => void;
}

export const FighterSheetView: React.FC<Props> = ({
  character,
  onUpdateCharacter,
  onOpenShop
}) => {
  const [viewingCbcModal, setViewingCbcModal] = useState(false);
  const [viewingBjjModal, setViewingBjjModal] = useState(false);
  const [viewingMtModal, setViewingMtModal] = useState(false);
  const [viewingBoxeModal, setViewingBoxeModal] = useState(false);
  const [viewingKarateModal, setViewingKarateModal] = useState(false);
  const [viewingArtDetails, setViewingArtDetails] = useState<MartialArtType | null>(null);
  const [viewingFightLog, setViewingFightLog] = useState<SavedFightLogEntry | null>(null);
  const allArts: MartialArtType[] = ['boxe', 'jiujitsu', 'muaythai', 'karate', 'judo', 'capoeira', 'lutalivre', 'mma'];

  const handleChangePrimaryArt = (art: MartialArtType) => {
    if (character.primaryArt === art) return;
    const updated = JSON.parse(JSON.stringify(character)) as Character;
    updated.primaryArt = art;
    sounds.playGraduation();
    onUpdateCharacter(updated);
  };

  const equipSummary = getEquipmentSummary(character);
  const effectiveAttrs = getEffectiveAttributes(character);

  const attrList = [
    { key: 'strength' as const, label: 'Força & Potência', icon: '💥', val: character.attributes.strength, bonus: equipSummary.bonuses.strength, eff: effectiveAttrs.strength, color: 'from-orange-500 to-red-500' },
    { key: 'speed' as const, label: 'Velocidade & Explosão', icon: '⚡', val: character.attributes.speed, bonus: equipSummary.bonuses.speed, eff: effectiveAttrs.speed, color: 'from-amber-400 to-yellow-500' },
    { key: 'stamina' as const, label: 'Gás & Vigor Aeróbico', icon: '🫁', val: character.attributes.stamina, bonus: equipSummary.bonuses.stamina, eff: effectiveAttrs.stamina, color: 'from-cyan-400 to-blue-500' },
    { key: 'durability' as const, label: 'Queixo & Absorção', icon: '🛡️', val: character.attributes.durability, bonus: equipSummary.bonuses.durability, eff: effectiveAttrs.durability, color: 'from-rose-500 to-red-600' },
    { key: 'flexibility' as const, label: 'Flexibilidade & Alcance', icon: '🤸', val: character.attributes.flexibility, bonus: equipSummary.bonuses.flexibility, eff: effectiveAttrs.flexibility, color: 'from-emerald-400 to-teal-500' },
    { key: 'fightIq' as const, label: 'QI de Luta & Leitura', icon: '🧠', val: character.attributes.fightIq, bonus: equipSummary.bonuses.fightIq, eff: effectiveAttrs.fightIq, color: 'from-purple-400 to-indigo-500' },
    { key: 'technique' as const, label: 'Técnica & Alavanca', icon: '🎯', val: character.attributes.technique, bonus: equipSummary.bonuses.technique, eff: effectiveAttrs.technique, color: 'from-sky-400 to-blue-600' },
    { key: 'mentalFocus' as const, label: 'Foco Mental & Calma', icon: '🧘', val: character.attributes.mentalFocus, bonus: equipSummary.bonuses.mentalFocus, eff: effectiveAttrs.mentalFocus, color: 'from-pink-400 to-rose-500' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Fighter Profile Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-neutral-800 border-2 border-amber-500/40 flex items-center justify-center text-2xl sm:text-3xl shadow-inner shrink-0">
            {character.avatar}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white">{character.name}</h1>
              <span className="text-amber-400 font-bold text-base sm:text-lg">"{character.nickname}"</span>
              {(() => {
                const locSummary = getPlayerLocationSummary(character);
                return (
                  <span className="text-xs bg-amber-500/10 text-amber-300 font-medium px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{locSummary.currentLabel}</span>
                    {locSummary.hasRelocated && (
                      <span className="text-[10px] text-neutral-400">(Origem: {locSummary.originLabel})</span>
                    )}
                  </span>
                );
              })()}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-1.5">
              <span className="text-white font-semibold">{character.age} anos</span>
              <span>•</span>
              {character.birthDate && (
                <>
                  <span className="flex items-center gap-1 text-neutral-300">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    Nascido em {formatGameDate(character.birthDate, 'short')}
                  </span>
                  <span>•</span>
                </>
              )}
              <span>{character.weight.toFixed(1)} kg ({character.weightClass})</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">R$ {character.money.toLocaleString('pt-BR')}</span>
            </div>
            <div className="text-[11px] text-amber-400/90 font-medium mt-1 flex flex-wrap items-center gap-2">
              <span>🏆 {formatCareerDuration(character.careerMonthsElapsed || 0)}</span>
              {(() => {
                const diff = getDifficultyProfile(character.difficulty);
                return (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diff.badgeClass}`}>
                    {diff.label}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Fight Record Summary */}
        <div className="w-full md:w-auto grid grid-cols-4 gap-2 sm:gap-4 bg-neutral-950 p-3 sm:p-4 rounded-xl border border-neutral-800 text-center tabular-nums">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">Vitórias</span>
            <span className="text-lg sm:text-xl font-black text-emerald-400">{character.record.wins}</span>
          </div>
          <div className="border-l border-neutral-800 pl-2 sm:pl-4">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">Derrotas</span>
            <span className="text-lg sm:text-xl font-black text-red-400">{character.record.losses}</span>
          </div>
          <div className="border-l border-neutral-800 pl-2 sm:pl-4">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">KOs</span>
            <span className="text-lg sm:text-xl font-black text-amber-400">{character.record.kos}</span>
          </div>
          <div className="border-l border-neutral-800 pl-2 sm:pl-4">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block truncate">Finaliz.</span>
            <span className="text-lg sm:text-xl font-black text-purple-400">{character.record.submissions}</span>
          </div>
        </div>
      </div>

      {/* Condição Fisiológica & Recuperação Física (Etapa 3.2 - Fase 4, 6) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
              <Zap className="w-4 h-4" />
            </span>
            <h2 className="text-sm uppercase tracking-wider font-bold text-white">
              Condição Fisiológica, Fadiga & Recuperação
            </h2>
          </div>
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <span>Sede Atual: <strong className="text-amber-400">{character.currentCity || character.homeCity || 'São Paulo'} ({character.currentCountry || 'Brasil'})</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Energia Imediata */}
          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-neutral-400 font-semibold flex items-center gap-1">
                ⚡ Energia Imediata
              </span>
              <span className="font-black text-cyan-400">{character.energy}/100</span>
            </div>
            <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, character.energy)}%` }}
              />
            </div>
            <span className="text-[10px] text-neutral-500 block mt-1">Disponibilidade para treinos diários e combates</span>
          </div>

          {/* Fadiga Acumulada */}
          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-neutral-400 font-semibold flex items-center gap-1">
                🛌 Fadiga Crônica Residual
              </span>
              <span className={`font-black ${
                (character.accumulatedFatigue || 0) > 40 ? 'text-red-400' : (character.accumulatedFatigue || 0) > 20 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {character.accumulatedFatigue || 0}/100
              </span>
            </div>
            <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
              <div 
                className={`h-full bg-gradient-to-r rounded-full transition-all ${
                  (character.accumulatedFatigue || 0) > 40 ? 'from-amber-500 to-red-500' : 'from-emerald-500 to-amber-500'
                }`}
                style={{ width: `${Math.min(100, character.accumulatedFatigue || 0)}%` }}
              />
            </div>
            <span className="text-[10px] text-neutral-500 block mt-1">Influenciada por sono, frequência de aulas e dieta</span>
          </div>

          {/* Taxa de Recuperação */}
          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-neutral-400 font-semibold flex items-center gap-1">
                🩺 Taxa de Regeneração Mensal
              </span>
              <span className="font-black text-emerald-400">{character.recoveryRate || 100}%</span>
            </div>
            <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, character.recoveryRate || 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-neutral-500 block mt-1">Capacidade de restauração na passagem de mês</span>
          </div>
        </div>

        {/* Alerta de Lesões Ativas se existirem */}
        {character.injuries && character.injuries.length > 0 && (
          <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl space-y-1">
            <div className="text-xs font-bold text-red-300 flex items-center gap-1.5">
              <span>⚠️ Lesões Ativas do Atleta ({character.injuries.length}):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              {character.injuries.map((inj) => (
                <div key={inj.id} className="p-2 bg-neutral-950 rounded-lg border border-red-900/50 flex justify-between items-center">
                  <span className="font-bold text-white">{inj.name}</span>
                  <span className="text-[10px] text-red-400 font-bold px-1.5 py-0.5 rounded bg-red-950 border border-red-800">
                    {inj.severity} • {inj.weeksRemaining} sem. restantes
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attributes Grid */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm uppercase tracking-wider font-bold text-neutral-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" /> Atributos Físicos & Táticos do Lutador
          </h2>
          <div className="flex items-center gap-3 text-xs">
            {equipSummary.totalStatBonusPoints > 0 && (
              <span className="text-emerald-400 font-semibold tabular-nums">
                +{equipSummary.totalStatBonusPoints} pts via equipamentos
                {equipSummary.injuryReductionPct > 0 ? ` · -${equipSummary.injuryReductionPct}% risco lesão` : ''}
                {equipSummary.trainingXpBonusPct > 0 ? ` · +${equipSummary.trainingXpBonusPct}% XP treino` : ''}
              </span>
            )}
            {onOpenShop && (
              <button
                type="button"
                onClick={onOpenShop}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{equipSummary.equippedCount > 0 ? 'Gerenciar Kit' : 'Ir à Loja'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {attrList.map((a) => (
            <div key={a.key} className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
              <div className="flex justify-between items-center mb-1.5 gap-2">
                <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5 truncate">
                  <span>{a.icon}</span> {a.label}
                </span>
                <span className="text-sm font-black text-white tabular-nums shrink-0">
                  {a.eff.toFixed(1)}
                  {a.bonus > 0 && (
                    <span className="text-[11px] font-bold text-emerald-400 ml-1">(+{a.bonus})</span>
                  )}
                </span>
              </div>
              <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div 
                  className={`h-full bg-gradient-to-r ${a.color} rounded-full transition-all`}
                  style={{ width: `${Math.min(100, (a.eff / 80) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {equipSummary.equippedCount > 0 && (
          <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-400">
            <span className="text-neutral-500 font-semibold uppercase text-[10px] tracking-wider">Kit em uso:</span>
            {Object.entries(equipSummary.equippedItems).map(([slot, eq]) =>
              eq ? (
                <span key={slot} className="text-neutral-200 font-medium">
                  <span className="text-neutral-500">{EQUIPMENT_SLOT_META[eq.slot]?.shortLabel}:</span>{' '}
                  {eq.name}
                </span>
              ) : null
            )}
          </div>
        )}
      </div>

      {/* Martial Arts Belts & Graduation Evolution Matrix */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col items-start justify-between gap-3 mb-4">
          <div className="flex flex-col justify-between w-full gap-3">
            <div>
              <h2 className="text-sm uppercase tracking-wider font-bold text-neutral-400 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" /> Sistema de Graduações & Faixas (7 Artes + MMA)
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Você pode praticar e subir de faixa em qualquer uma das artes marciais. Selecione a principal para focar seu treino diário.
              </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap scrollbar-none w-full">
              <button
                type="button"
                onClick={() => {
                  sounds.playPunch(false);
                  setViewingKarateModal(true);
                }}
                className="min-h-[40px] px-3 py-1.5 bg-gradient-to-r from-red-700 via-rose-600 to-red-800 hover:from-red-600 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>⛩️</span>
                <span>Karatê (CBK / WKF)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPunch(false);
                  setViewingBoxeModal(true);
                }}
                className="min-h-[40px] px-3 py-1.5 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>🥊</span>
                <span>Boxe (CBBoxe / WBC)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPunch(false);
                  setViewingMtModal(true);
                }}
                className="min-h-[40px] px-3 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>🇹🇭</span>
                <span>Muay Thai (WMC / CBMT)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPunch(false);
                  setViewingBjjModal(true);
                }}
                className="min-h-[40px] px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>🥋</span>
                <span>CBJJ / IBJJF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPunch(false);
                  setViewingCbcModal(true);
                }}
                className="min-h-[40px] px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>🇧🇷</span>
                <span>CBC (Capoeira)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allArts.map((art) => {
            const meta = MARTIAL_ARTS_META[art];
            const grad = character.artGraduations[art];
            const isPrimary = character.primaryArt === art;

            return (
              <div 
                key={art} 
                className={`bg-neutral-950 p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isPrimary ? 'border-amber-500 shadow-md shadow-amber-500/10' : 'border-neutral-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-white">{meta.name.split(' ')[0]}</span>
                    {isPrimary ? (
                      <span className="text-[10px] bg-amber-500 text-neutral-950 font-black px-2 py-0.5 rounded-full uppercase">
                        Principal
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleChangePrimaryArt(art)}
                        className="text-[10px] text-neutral-400 hover:text-amber-400 underline cursor-pointer"
                      >
                        Tornar Principal
                      </button>
                    )}
                  </div>

                  {/* Belt Ribbon / Octagon Tier Visual */}
                  <div 
                    className="p-2.5 rounded-lg border border-white/20 text-center font-bold text-xs shadow-xs mb-2"
                    style={{ background: grad.gradientStyle || grad.color, color: grad.textColor }}
                  >
                    {art === 'mma' ? '🥊' : art === 'capoeira' ? '🪢' : '🥋'} {getDisplayBeltForGrad(art, grad)}
                  </div>
                  {art === 'jiujitsu' && (
                    <div className="mb-2">
                      <BjjBeltVisual rankIndex={grad.rankIndex} stripes={grad.stripes} />
                    </div>
                  )}

                  {grad.categoryName && (
                    <div className="text-[10px] text-amber-400 font-semibold mb-1 flex justify-between">
                      <span>{art === 'mma' ? 'Divisão:' : 'Cat:'} {grad.categoryName}</span>
                      {grad.stageNumber && <span>{grad.stageNumber}º Estágio</span>}
                    </div>
                  )}

                  <div className="text-[11px] text-neutral-400 flex justify-between">
                    <span>{art === 'mma' ? 'Cartel & XP:' : 'XP da Graduação:'}</span>
                    <span className="font-bold text-neutral-200">
                      {art === 'mma' 
                        ? `${character.record?.mmaWins || 0}V - ${character.record?.mmaLosses || 0}D`
                        : `${Math.min(grad.xp, grad.xpNeeded)} / ${grad.xpNeeded}`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden mt-1 border border-neutral-800">
                    <div 
                      className={`h-full rounded-full ${art === 'mma' ? 'bg-cyan-400' : 'bg-amber-400'}`}
                      style={{ width: `${Math.min(100, (grad.xp / grad.xpNeeded) * 100)}%` }}
                    />
                  </div>
                  {(() => {
                    const artTalent = getActiveArtTalentBonus(character, art);
                    return (
                      <div className="mt-2">
                        {artTalent.discovered && artTalent.meta ? (
                          <div className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center justify-between ${artTalent.meta.badgeClass}`}>
                            <span>{artTalent.meta.shortLabel}</span>
                            <span>
                              {artTalent.meta.xpBonusPercent > 0
                                ? `+${artTalent.meta.xpBonusPercent}% Evolução`
                                : 'Padrão'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-neutral-800 bg-neutral-900/70 text-neutral-400">
                            🔒 Talento Oculto (matricule-se p/ revelar)
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-900 text-[10px] text-neutral-500 space-y-2">
                  <div className="truncate">
                    {art === 'mma' ? 'Regulação: Comissões Atléticas' : `Federação: ${meta.federation.split('&')[0]}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPunch(false);
                      setViewingArtDetails(art);
                    }}
                    className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-[10px] font-bold border border-neutral-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3 text-amber-400" />
                    Tabela Oficial da Federação
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Graduation & Belt Ceremony History */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Award className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm uppercase tracking-wider font-bold text-white">
                Histórico Oficial de Graduações & Batizados ({character.graduationHistory?.length || 0})
              </h2>
              <p className="text-xs text-neutral-400">
                Registro imutável de todas as promoções de faixa, corda e níveis técnicos reconhecidos pelas federações.
              </p>
            </div>
          </div>
        </div>

        {character.graduationHistory && character.graduationHistory.length > 0 ? (
          <div className="space-y-3">
            {character.graduationHistory.map((record) => {
              const artMeta = MARTIAL_ARTS_META[record.art];
              const artIcon = record.art === 'capoeira' ? '🪢' : record.art === 'boxe' ? '🥊' : record.art === 'mma' ? '🏆' : '🥋';
              return (
                <div key={record.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{artIcon}</span>
                      <span className="font-bold text-white text-sm">{artMeta?.name || record.art}</span>
                      <span className="text-xs text-neutral-500">•</span>
                      <span className="text-xs text-neutral-400">{formatGameDate(record.date, 'short')}</span>
                      {record.paidByFamily && (
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          Patrocinado pela Família
                        </span>
                      )}
                      {record.ceremonyCost && record.ceremonyCost > 0 && !record.paidByFamily && (
                        <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full font-bold">
                          Taxa: R$ {record.ceremonyCost}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-neutral-400">{record.previousRank}</span>
                      <span className="text-amber-400 font-bold">→</span>
                      <span className="text-amber-300 font-bold">{record.newRank}</span>
                    </div>
                    {record.notes && (
                      <p className="text-[11px] text-neutral-400 italic">"{record.notes}"</p>
                    )}
                  </div>
                  <div className="text-left md:text-right text-xs text-neutral-400 shrink-0">
                    <span className="block text-[10px] uppercase font-bold text-neutral-500">Mestre Outorgante</span>
                    <span className="font-semibold text-neutral-200">{record.masterName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-xl text-center space-y-2">
            <span className="text-3xl block">🥋</span>
            <h3 className="text-sm font-bold text-white">Nenhum exame de graduação realizado até o momento</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Continue treinando e desenvolvendo sua técnica no tatame. Quando cumprir os requisitos oficiais de carência temporal, idade e XP, seu mestre marcará sua cerimônia oficial de graduação!
            </p>
          </div>
        )}
      </div>

      {/* Recent Fight Logs History */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm uppercase tracking-wider font-bold text-white">
                Histórico de Lutas & Logs Recentes ({character.recentFightLogs?.length || 0})
              </h2>
              <p className="text-xs text-neutral-400">
                Relatório ciclo a ciclo dos seus combates oficiais e sparrings recentes para análise técnica.
              </p>
            </div>
          </div>
        </div>

        {character.recentFightLogs && character.recentFightLogs.length > 0 ? (
          <div className="space-y-2.5">
            {character.recentFightLogs.map((log, idx) => {
              const artMeta = MARTIAL_ARTS_META[log.art];
              const resultBadgeClass =
                log.winner === 'player'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : log.winner === 'opponent'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700';
              const resultLabel =
                log.winner === 'player' ? 'VITÓRIA' : log.winner === 'opponent' ? 'DERROTA' : 'EMPATE';

              return (
                <div
                  key={log.id}
                  className="p-3.5 sm:p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${resultBadgeClass}`}>
                        {resultLabel}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Última Luta
                        </span>
                      )}
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                        {log.arena === 'bjj'
                          ? log.isGi === false
                            ? 'BJJ No-Gi'
                            : 'BJJ Gi'
                          : log.arena === 'boxe'
                          ? 'Boxe (Ringue)'
                          : artMeta?.name?.split(' ')[0] || log.art}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-900 text-cyan-300 border border-neutral-800">
                        {log.matchType === 'competicao' ? 'Competição' : 'Sparring'}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {formatGameDate(log.date, 'short')}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-white truncate">
                      vs {log.opponentName}
                      {log.opponentNickname ? <span className="text-amber-400 font-semibold"> "{log.opponentNickname}"</span> : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
                      {log.tournamentName && (
                        <span className="text-amber-300 font-medium">
                          {log.tournamentName}{log.stageName ? ` • ${log.stageName}` : ''}
                        </span>
                      )}
                      <span>
                        Método: <strong className="text-neutral-200">{log.method}</strong>
                      </span>
                      <span>
                        Placar: <strong className="text-amber-400 font-mono">{log.scoreSummary}</strong>
                      </span>
                      <span>
                        Registros: <strong className="text-neutral-300">{log.entries.length}</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewingFightLog(log)}
                    className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ver Log Completo</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-xl text-center space-y-1.5">
            <span className="text-2xl block">📋</span>
            <h3 className="text-sm font-bold text-white">Nenhuma luta registrada ainda</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Conclua um rola na Arena BJJ ou uma luta oficial em campeonatos para salvar automaticamente o relatório completo aqui.
            </p>
          </div>
        )}
      </div>

      {/* Move Arsenal Catalog */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm uppercase tracking-wider font-bold text-neutral-400 mb-4 flex items-center gap-2">
          <Swords className="w-4 h-4 text-amber-400" /> Arsenal de Golpes Desbloqueados ({character.moves.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {character.moves.map((m) => (
            <div key={m.id} className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-xs text-white">{m.name}</span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                  {m.category}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">{m.description}</p>
              <div className="mt-2 pt-2 border-t border-neutral-900 flex justify-between text-[10px]">
                <span className="text-red-400 font-semibold">Dano: {m.damage}</span>
                <span className="text-cyan-400 font-semibold">Gás: {m.staminaCost}</span>
                <span className="text-neutral-400">{m.accuracy}% precisão</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Fight Log Modal */}
      {viewingFightLog && (
        <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-neutral-900 border-2 border-cyan-500/60 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-neutral-800 pb-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    viewingFightLog.winner === 'player'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : viewingFightLog.winner === 'opponent'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}>
                    {viewingFightLog.winner === 'player' ? 'VITÓRIA' : viewingFightLog.winner === 'opponent' ? 'DERROTA' : 'EMPATE'}
                  </span>
                  <span className="text-xs font-bold text-cyan-300">
                    {viewingFightLog.arena === 'bjj'
                      ? viewingFightLog.isGi === false ? 'Arena BJJ (No-Gi)' : 'Arena BJJ (Gi)'
                      : viewingFightLog.arena === 'boxe'
                      ? 'Arena de Boxe (10-Point Must)'
                      : `Arena ${MARTIAL_ARTS_META[viewingFightLog.art]?.name || viewingFightLog.art}`}
                  </span>
                  <span className="text-xs text-neutral-400">• {formatGameDate(viewingFightLog.date, 'short')}</span>
                </div>
                <h3 className="text-lg font-black text-white mt-1 truncate">
                  {character.name} vs {viewingFightLog.opponentName}
                </h3>
                <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-2 mt-0.5">
                  {viewingFightLog.tournamentName && (
                    <span className="text-amber-300 font-semibold">
                      {viewingFightLog.tournamentName}{viewingFightLog.stageName ? ` (${viewingFightLog.stageName})` : ''}
                    </span>
                  )}
                  <span>Decisão: <strong className="text-white">{viewingFightLog.method}</strong></span>
                  <span>Placar: <strong className="text-amber-400 font-mono">{viewingFightLog.scoreSummary}</strong></span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingFightLog(null)}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
              {viewingFightLog.entries.length === 0 ? (
                <div className="text-xs text-neutral-500 text-center py-6">
                  Nenhum ciclo registrado neste combate.
                </div>
              ) : (
                viewingFightLog.entries.map((entry) => (
                  <div
                    key={`${viewingFightLog.id}_${entry.step}`}
                    className="p-3 bg-neutral-950 border border-neutral-800/90 rounded-xl text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-mono font-bold text-amber-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {viewingFightLog.arena === 'bjj'
                          ? `Ciclo #${entry.step}`
                          : viewingFightLog.arena === 'boxe'
                          ? `Troca #${entry.step}`
                          : `Evento #${entry.step}`}{' '}
                        • {entry.timeLabel}
                      </span>
                      {entry.pointsInfo && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {entry.pointsInfo}
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-200 leading-relaxed">{entry.narration}</p>
                    {(entry.playerAction || entry.opponentAction || entry.factor) && (
                      <div className="pt-1.5 border-t border-neutral-800/60 text-[10px] text-neutral-400 space-y-0.5 font-mono">
                        {(entry.playerAction || entry.opponentAction) && (
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                            {entry.playerAction && <span>Você: <strong className="text-blue-300">{entry.playerAction}</strong></span>}
                            {entry.opponentAction && <span>Rival: <strong className="text-neutral-200">{entry.opponentAction}</strong></span>}
                          </div>
                        )}
                        {entry.factor && <div className="text-neutral-500 italic">{entry.factor}</div>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* CBC Capoeira Official System Modal */}
      {viewingCbcModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border-2 border-emerald-500/80 rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 text-3xl">
                  🇧🇷
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                      Regulamento Unificado Nacional
                    </span>
                    <span className="text-[10px] bg-neutral-800 text-amber-400 px-2 py-0.5 rounded-full border border-neutral-700 font-bold">
                      CBC
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white">
                    Sistema Oficial da Confederação Brasileira de Capoeira (CBC)
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
                    Criado para unificar o esporte, este sistema adota rigorosamente a ordem geométrica e as cores da bandeira brasileira.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingCbcModal(false)}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table of Categories and Cordas */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-2">
                <Award className="w-4 h-4" /> Quadro de Estágios & Cores da Corda (9º ao 20º Estágio)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Iniciante */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Categoria: Iniciante</span>
                    <span className="text-[10px] bg-neutral-800 text-amber-400 px-2 py-0.5 rounded-full">9º Estágio</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-amber-800/40 bg-[#ede5ce] text-[#451a03] font-black text-center text-xs shadow-xs">
                    🪢 Sem Corda / Corda Crua
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    <strong className="text-neutral-200">Tempo estimado:</strong> 6 meses a 1 ano (Batizado)
                  </div>
                  <p className="text-[11px] text-neutral-300 italic">
                    "Aprender a gingar, fazer as esquivas básicas (cocorinha e negativa), golpes simples (bênção, meia-lua de frente) e compreender o ritmo da roda."
                  </p>
                </div>

                {/* 2. Alunos */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Categoria: Alunos</span>
                    <span className="text-[10px] bg-neutral-800 text-emerald-400 px-2 py-0.5 rounded-full">10º ao 12º Estágio</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 rounded-lg bg-[#15803d] text-white font-bold text-center text-[11px]">
                      10º Verde
                    </div>
                    <div className="flex-1 p-2 rounded-lg bg-[#eab308] text-black font-bold text-center text-[11px]">
                      11º Amarelo
                    </div>
                    <div className="flex-1 p-2 rounded-lg bg-[#1d4ed8] text-white font-bold text-center text-[11px]">
                      12º Azul
                    </div>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    <strong className="text-neutral-200">Tempo estimado:</strong> 1 a 2 anos por corda
                  </div>
                  <p className="text-[11px] text-neutral-300 italic">
                    "Assiduidade, golpes rodados, rasteiras, floreios básicos, pandeiro, atabaque e cantar os coros."
                  </p>
                </div>

                {/* 3. Transformação */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Categoria: Transformação</span>
                    <span className="text-[10px] bg-neutral-800 text-cyan-400 px-2 py-0.5 rounded-full">13º ao 15º Estágio</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="p-2 rounded-lg text-black font-bold text-center text-[11px]" style={{ background: 'linear-gradient(90deg, #15803d 50%, #eab308 50%)' }}>
                      13º Verde e Amarelo
                    </div>
                    <div className="p-2 rounded-lg text-white font-bold text-center text-[11px]" style={{ background: 'linear-gradient(90deg, #15803d 50%, #1d4ed8 50%)' }}>
                      14º Verde e Azul
                    </div>
                    <div className="p-2 rounded-lg text-black font-bold text-center text-[11px]" style={{ background: 'linear-gradient(90deg, #eab308 50%, #1d4ed8 50%)' }}>
                      15º Amarelo e Azul (Aluno Graduado / Monitor)
                    </div>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    <strong className="text-neutral-200">Tempo estimado:</strong> 3 a 5 anos de treino total
                  </div>
                  <p className="text-[11px] text-neutral-300 italic">
                    "Ajuda o professor, maturidade de jogo, domínio do berimbau (São Bento Grande e Angola) e história da capoeira."
                  </p>
                </div>

                {/* 4. Docentes (Formados) */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Categoria: Docentes (Formados)</span>
                    <span className="text-[10px] bg-neutral-800 text-purple-400 px-2 py-0.5 rounded-full">16º ao 19º Estágio</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="p-2 rounded-lg text-white font-bold text-center text-[10px]" style={{ background: 'linear-gradient(90deg, #15803d 33%, #eab308 33% 66%, #1d4ed8 66%)' }}>
                      16º V., Am. e Azul (Instrutor)
                    </div>
                    <div className="p-2 rounded-lg text-black font-bold text-center text-[10px]" style={{ background: 'linear-gradient(90deg, #15803d 50%, #ffffff 50%)' }}>
                      17º Verde e Branco (Professor)
                    </div>
                    <div className="p-2 rounded-lg text-black font-bold text-center text-[10px]" style={{ background: 'linear-gradient(90deg, #eab308 50%, #ffffff 50%)' }}>
                      18º Amarelo e Branco (Contramestre)
                    </div>
                    <div className="p-2 rounded-lg text-black font-bold text-center text-[10px]" style={{ background: 'linear-gradient(90deg, #1d4ed8 50%, #ffffff 50%)' }}>
                      19º Azul e Branco (Mestrando)
                    </div>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    <strong className="text-neutral-200">Tempo estimado:</strong> 3 a 6+ anos por estágio
                  </div>
                  <p className="text-[11px] text-neutral-300 italic">
                    "Desenvolvimento de turmas próprias, trabalho prestado à comunidade, liderança e fidelidade institucional."
                  </p>
                </div>

                {/* 5. Mestre */}
                <div className="p-4 bg-neutral-950 border-2 border-amber-500 rounded-2xl space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Categoria: Mestre</span>
                    <span className="text-[10px] bg-amber-500 text-neutral-950 font-black px-2 py-0.5 rounded-full">20º Estágio</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white text-black font-black text-center text-sm shadow-md border-2 border-neutral-300">
                    🪢 Corda Branca (Mestre de Capoeira)
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    <strong className="text-white">Tempo estimado:</strong> Mínimo de 15 a 20 anos de dedicação ininterrupta
                  </div>
                  <p className="text-xs text-neutral-300 italic">
                    "A consagração máxima da arte marcial. Honra vitalícia outorgada pela Confederação Brasileira de Capoeira para quem dedicou uma vida à preservação e expansão da arte."
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Moves Categories Breakdown */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-2">
                <Swords className="w-4 h-4" /> Classificação Técnica Oficial dos Golpes da Capoeira
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-emerald-400 block">1. Movimento de Base & Esquivas:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    <strong>Ginga, Cocorinha, Negativa, Esquiva Lateral, Queda de Quatro.</strong> Prioriza a evasão fluida em vez do bloqueio direto com os braços.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-amber-400 block">2. Golpes de Linha (Diretos):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    <strong>Bênção, Martelo, Ponteira, Meia-Lua de Frente.</strong> Ataques retos que avançam com força frontal ou vertical contra o peito ou abdômen.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-rose-400 block">3. Golpes Rodados (Circulares):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    <strong>Meia-Lua de Compasso, Armada, Queixada, Enformado / Chapa Giratória.</strong> Utilizam a força centrífuga do giro do corpo com máxima potência.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-blue-400 block">4. Membros Superiores (Trauma):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    <strong>Galopante, Godeme, Meio-Quilo, Asfixiante.</strong> Mãos e antebraços para o combate a curta distância e quebra de guarda.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-purple-400 block">5. Desequilíbrios & Rasteiras:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    <strong>Rasteira, Vingativa, Tesoura de Chão, Cruzeiro, Arrastão.</strong> Derrubar o oponente no momento exato com destreza e malícia na roda.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-cyan-400 block">6. Floreios (Acrobacias):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    <strong>Aú, Bananeira, Macaco.</strong> Demonstração estética de agilidade que nega o corpo e cadencia o jogo com olhos fixos no adversário.
                  </p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingCbcModal(false)}
                className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
              >
                Fechar Regulamento CBC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CBJJ / IBJJF Jiu-Jitsu Official System Modal */}
      {viewingBjjModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border-2 border-blue-500/80 rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30 text-3xl">
                  🥋
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">
                      Sistema Geral de Graduação Oficial
                    </span>
                    <span className="text-[10px] bg-neutral-800 text-amber-400 px-2 py-0.5 rounded-full border border-neutral-700 font-bold">
                      CBJJ / IBJJF
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white">
                    Confederação Brasileira de Jiu-Jitsu & International BJJ Federation
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
                    Padronização oficial de faixas, idades mínimas, tempos de permanência, sistema de pontuação e restrições de golpes da Arte Suave.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingBjjModal(false)}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quadro de Faixas, Idades e Tempos Mínimos */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-2">
                <Award className="w-4 h-4" /> Quadro de Faixas, Idades Mínimas & Tempos de Permanência
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Branca */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Iniciante</span>
                    <span className="text-[10px] bg-neutral-800 text-white px-2 py-0.5 rounded-full font-bold">Qualquer Idade</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-neutral-300 bg-white text-neutral-900 font-black text-center text-xs shadow-xs">
                    🥋 Faixa Branca (Iniciação · Graus individuais de 1º ao 4º)
                  </div>
                  <div className="text-[11px] text-neutral-400 space-y-0.5">
                    <div><strong className="text-neutral-200">Tempo Mínimo:</strong> Sem tempo mínimo fixo (média 1 a 2 anos)</div>
                    <div><strong className="text-cyan-400">Tempo de Luta:</strong> 5 minutos no adulto</div>
                  </div>
                  <p className="text-[11px] text-neutral-300 italic">
                    Porta de entrada para todos os praticantes. Foco em sobrevivência, fuga de quadril e postura.
                  </p>
                </div>

                {/* 2. Infantil/Juvenil */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Infantojuvenil</span>
                    <span className="text-[10px] bg-neutral-800 text-emerald-400 px-2 py-0.5 rounded-full font-bold">4 a 15 anos</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-neutral-400 via-yellow-500 to-green-600 text-neutral-950 font-black text-center text-xs shadow-xs">
                    🥋 Cinza → Amarela → Laranja → Verde
                  </div>
                  <div className="text-[11px] text-neutral-400 space-y-0.5">
                    <div><strong className="text-neutral-200">Estrutura:</strong> Subfaixas com listras branca, pura e preta</div>
                    <div><strong className="text-cyan-400">Restrição:</strong> Sem torções perigosas</div>
                  </div>
                  <p className="text-[11px] text-neutral-300 italic">
                    Desenvolvimento lúdico e técnico sem queimar etapas precocemente.
                  </p>
                </div>

                {/* 3. Azul */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Graduado</span>
                    <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full font-bold">Mín. 16 anos</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-600 text-white font-black text-center text-xs shadow-xs">
                    🥋 Faixa Azul (Graduado · Graus individuais até 4º Grau)
                  </div>
                  <div className="text-[11px] text-neutral-400 space-y-0.5">
                    <div><strong className="text-neutral-200">Tempo Mínimo:</strong> 2 anos na faixa</div>
                    <div><strong className="text-cyan-400">Tempo de Luta:</strong> 6 minutos no adulto</div>
                  </div>
                  <p className="text-[11px] text-neutral-300 italic">
                    Fundamentos consolidados, liberação de mão de vaca e domínio de raspagens.
                  </p>
                </div>

                {/* 4. Roxa */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Técnico Avançado</span>
                    <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-bold">Mín. 16 anos</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-700 text-white font-black text-center text-xs shadow-xs">
                    🥋 Faixa Roxa (Técnico · Graus individuais até 4º Grau)
                  </div>
                  <div className="text-[11px] text-neutral-400 space-y-0.5">
                    <div><strong className="text-neutral-200">Tempo Mínimo:</strong> 1 ano e meio (18 meses)</div>
                    <div><strong className="text-cyan-400">Tempo de Luta:</strong> 7 minutos no adulto</div>
                  </div>
                  <p className="text-[11px] text-neutral-300 italic">
                    Desenvolvimento do jogo pessoal e domínio de guardas modernas (De La Riva, Berimbolo).
                  </p>
                </div>

                {/* 5. Marrom */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Antessala da Preta</span>
                    <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full font-bold">Mín. 18 anos</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#713f12] text-white font-black text-center text-xs shadow-xs">
                    🥋 Faixa Marrom (Avançado · Graus individuais até 4º Grau)
                  </div>
                  <div className="text-[11px] text-neutral-400 space-y-0.5">
                    <div><strong className="text-neutral-200">Tempo Mínimo:</strong> 1 ano na faixa</div>
                    <div><strong className="text-cyan-400">Tempo de Luta:</strong> 8 minutos no adulto</div>
                  </div>
                  <p className="text-[11px] text-neutral-300 italic">
                    Pressão extrema; liberação de kneebar, toe hold e compressões de panturrilha/bíceps.
                  </p>
                </div>

                {/* 6. Preta */}
                <div className="p-4 bg-neutral-950 border-2 border-red-500 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Black Belt / Professor</span>
                    <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded-full font-bold">Mín. 19 anos</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black text-red-500 font-black text-center text-xs shadow-xs border border-red-600/40">
                    🥋 Faixa Preta (Professor · Grau individual até 6º Grau)
                  </div>
                  <div className="text-[11px] text-neutral-400 space-y-0.5">
                    <div><strong className="text-neutral-200">Tempo Mínimo:</strong> 3 anos por grau (1º, 2º e 3º Grau)</div>
                    <div><strong className="text-cyan-400">Tempo de Luta:</strong> 10 minutos oficial</div>
                  </div>
                  <p className="text-[11px] text-neutral-300 italic">
                    Maestria técnica, sabedoria no tatame e autoridade de ensino.
                  </p>
                </div>

                {/* 7. Mestre Coral e Vermelha */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2 lg:col-span-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Graus Superiores (Mestres e Grandes Mestres)</span>
                    <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full">Honra Vitalícia</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl text-white font-bold text-center text-xs" style={{ background: 'linear-gradient(90deg, #dc2626 50%, #000000 50%)' }}>
                      🥋 Vermelha e Preta (Coral 7º Grau - Mín. 50 anos)
                    </div>
                    <div className="p-2.5 rounded-xl text-black font-bold text-center text-xs" style={{ background: 'linear-gradient(90deg, #dc2626 50%, #ffffff 50%)' }}>
                      🥋 Vermelha e Branca (Coral 8º Grau - Mín. 57 anos)
                    </div>
                    <div className="p-2.5 rounded-xl bg-red-600 text-white font-black text-center text-xs">
                      🥋 Faixa Vermelha (9º Grau - Grão-Mestre / Mín. 67 anos)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Regras Oficiais de Pontuação da CBJJ / IBJJF */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Sistema Oficial de Pontuação da CBJJ / IBJJF (Estabilização de 3 Segundos)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <span className="text-2xl font-black text-amber-400 block mb-0.5">4 PONTOS</span>
                  <span className="font-bold text-white block">Montada Completa</span>
                  <span className="text-[10px] text-neutral-400">ou Pegada de Costas (Ganchos)</span>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <span className="text-2xl font-black text-emerald-400 block mb-0.5">3 PONTOS</span>
                  <span className="font-bold text-white block">Passagem de Guarda</span>
                  <span className="text-[10px] text-neutral-400">Estabilizada no 100kg / lateral</span>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <span className="text-2xl font-black text-blue-400 block mb-0.5">2 PONTOS</span>
                  <span className="font-bold text-white block">Queda / Takedown</span>
                  <span className="text-[10px] text-neutral-400">Raspagem ou Joelho na Barriga</span>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <span className="text-2xl font-black text-purple-400 block mb-0.5">VANTAGEM</span>
                  <span className="font-bold text-white block">Quase-Ponto / Quase-Finalização</span>
                  <span className="text-[10px] text-neutral-400">Critério de desempate oficial</span>
                </div>
              </div>
            </div>

            {/* Restrições e Legalidade de Golpes por Faixa */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Legalidade de Golpes e Restrições Oficiais da IBJJF
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-neutral-200 block">Faixa Branca (Adulto):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Permitida apenas a <strong>Chave de Pé Reta (Botinha)</strong> sem torção de joelho. Proibidas chaves de calcanhar, chaves de joelho, mão de vaca, torções de coluna/pescoço e saltar fechando a guarda.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-blue-400 block">Faixas Azul e Roxa:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Liberada a <strong>Mão de Vaca (Chave de Pulso / Wristlock)</strong> e triângulos de todas as posições. Continuam proibidos kneebars, toe holds e chaves de calcanhar no quimono.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-amber-400 block">Faixas Marrom e Preta:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Liberadas <strong>Chave de Joelho Reta (Kneebar)</strong>, <strong>Toe Hold</strong>, <strong>Estúpido de Panturrilha (Calf Slicer)</strong> e compressões de bíceps. No-Gi profissional permite Heel Hook.
                  </p>
                </div>
              </div>
            </div>

            {/* As 6 Categorias Técnicas do BJJ */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-2">
                <Swords className="w-4 h-4" /> Os 6 Pilares Técnicos do Currículo Oficial de Jiu-Jitsu
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-blue-400 block">1. Quedas & Puxadas:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Osoto Gari, Baiana (Double Leg), Puxada para Guarda Fechada, Harai Goshi. Início e controle de pegadas.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-emerald-400 block">2. Passagens de Guarda:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Toreando, Emborcada (Stack Pass), Knee Slice / Cut, Over-Under. Neutralização das pernas do guardeiro (+3 pts).
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-purple-400 block">3. Raspagens & Inversões:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Tesourinha, Pêndulo/Flor, Meia-Guarda com Esgrima, De La Riva e Berimbolo. Sair de baixo e subir (+2 pts).
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-amber-400 block">4. Controles Dominantes:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    100 Quilos (Side Control), Joelho na Barriga (+2 pts), Montada (+4 pts), Pegada de Costas com Ganchos (+4 pts).
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-rose-400 block">5. Estrangulamentos:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Mata-Leão, Triângulo, Cruzado de Gola, Arco e Flecha, Guilhotina, Ezequiel. Compressão carotídea sem força bruta.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-cyan-400 block">6. Chaves Articulares:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Armlock Reto, Kimura, Americana, Omoplata, Mão de Vaca, Chave de Pé Reta (Botinha), Kneebar.
                  </p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingBjjModal(false)}
                className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
              >
                Fechar Regulamento CBJJ / IBJJF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OFICIAL MUAY THAI (WMC, IFMA & CBMT) */}
      {viewingMtModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 via-amber-600 to-blue-700 flex items-center justify-center text-2xl shadow-lg border border-red-400/40">
                  🇹🇭
                </div>
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    Regulamento Oficial de Muay Thai (WMC / IFMA & CBMT)
                  </h2>
                  <p className="text-xs text-neutral-400">
                    A Arte das 8 Armas da Tailândia: Mat (Socos), Sok (Cotoveladas), Kao (Joelhadas), Te & Teep (Chutes), Plum (Clinch) e Wai Kru Ram Muay
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingMtModal(false)}
                className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Introduction Banner */}
            <div className="p-4 bg-gradient-to-r from-red-950/40 via-neutral-900 to-blue-950/40 rounded-xl border border-red-800/40 flex items-start gap-3">
              <Info className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-300 leading-relaxed space-y-1">
                <span className="font-bold text-white block">
                  A Origem Sagrada & A Padronização dos Prajieds e Khans
                </span>
                <p>
                  Tradicionalmente nos lendários estádios de Bangkok (<em>Lumpinee</em> e <em>Rajadamnern</em>), os lutadores tailandeses eram ranqueados estritamente pelo número de combates, vitórias por nocaute e cinturões.
                  Para unificar o ensino pedagógico mundial e no Brasil, a <strong>Confederação Brasileira de Muay Thai (CBMT)</strong>, a <strong>WMC (World Muaythai Council)</strong> e a <strong>IFMA</strong> oficializaram a graduação por <strong>Prajieds</strong> (braçadeiras de bíceps) divididas em <strong>15 Khans</strong>, culminando na consagração do <strong>Mongkhon</strong> sagrado e nos títulos de <strong>Kru</strong> (Professor), <strong>Arjan</strong> (Mestre) e <strong>Bramajarn</strong> (Grão Mestre).
                </p>
              </div>
            </div>

            {/* Tabela dos 15 Khans / Prajieds */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-bold tracking-wider text-red-400 flex items-center gap-2">
                <Award className="w-4 h-4" /> Sistema Geral de Graduação (15 Khans & Prajieds da CBMT / WMC)
              </h3>

              <div className="overflow-x-auto rounded-xl border border-neutral-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="py-2.5 px-3">Khan / Estágio</th>
                      <th className="py-2.5 px-3">Cordão / Prajied</th>
                      <th className="py-2.5 px-3">Categoria</th>
                      <th className="py-2.5 px-3">Tempo Mínimo</th>
                      <th className="py-2.5 px-3">Critérios de Avaliação & Conteúdo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-medium">
                    {MARTIAL_ARTS_META.muaythai.ranks.map((r, idx) => (
                      <tr key={idx} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="py-2 px-3 font-bold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] flex items-center justify-center text-neutral-400 font-mono">
                            {idx + 1}
                          </span>
                          <span>{r.name}</span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-3 rounded-full border border-neutral-700 shadow-sm"
                              style={{
                                background: r.gradientStyle || r.color
                              }}
                            />
                            <span className="text-[11px] text-neutral-300">
                              {r.gradientStyle ? 'Bicolor / Trançado' : 'Sólido'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-neutral-300">
                          <span className="px-2 py-0.5 bg-neutral-800 rounded-md text-[10px] font-bold text-red-300">
                            {r.categoryName || 'Geral'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-neutral-400 font-mono text-[11px]">
                          {r.estimatedTime || 'N/A'}
                        </td>
                        <td className="py-2 px-3 text-neutral-300 text-[11px] leading-relaxed max-w-md">
                          {r.evaluationCriteria || 'Sem critérios especificados.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* A Filosofia dos 5 Rounds nos Estádios de Bangkok */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-2">
                <Flame className="w-4 h-4" /> A Filosofia dos 5 Rounds Tradicionais (Lumpinee & Rajadamnern)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-400">Rounds 1 & 2:</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-mono">Estudo & Ritmo</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Combate técnico de estudo de distância. Uso de jabs, teeps leves e chutes baixos para testar reflexos. As apostas tradicionais no estádio se aquecem. A música Sarama toca em andamento moderado.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-400">Rounds 3 & 4:</span>
                    <span className="text-[10px] text-amber-400 uppercase font-mono font-bold">O Clímax da Luta</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Onde a luta é decidida! A Sarama acelera com intensidade máxima. Os lutadores entram em guerra total com joelhadas no plexo, chutes com a canela nas costelas, cotoveladas cortantes e clinch feroz.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">Round 5:</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-mono">Controle & Honra</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    O lutador em vantagem foca em controlar o centro do ringue com equilíbrio impecável (<em>Muay Form</em>) e teeps de parada. O adversário atrás precisa buscar o nocaute absoluto com cotovelos e joelhos saltados.
                  </p>
                </div>
              </div>
            </div>

            {/* Regras de Arbitragem & Pontuação Tailandesa */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs uppercase font-bold tracking-wider text-rose-400 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Critérios Oficiais de Pontuação da Arbitragem de Bangkok (WMC)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-white block">Hierarquia do Impacto:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Golpes limpos de <strong>tíbia</strong> nas costelas e <strong>joelhadas</strong> no tronco pontuam mais do que socos. Socos só contam ponto alto se desequilibrarem visivelmente o oponente ou causarem knockdown.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-amber-400 block">Dumping & Arremessos (+3 pts):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Jogar o oponente com as costas no chão no clinch através de torção de tronco ou varrida em chute pego (sem usar quadril de judô) causa enorme impressão nos juízes e na plateia.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-emerald-400 block">Equilíbrio (Muay Form):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Ser atingido e permanecer ereto sem cambalear nem fazer careta demonstra superioridade marcial. Se ambos trocarem chutes, quem demonstrar maior firmeza de base ganha o ponto.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-red-400 block">Cortes & TKO Médico:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    As cotoveladas afiadas (Sok) cortam a pele com facilidade. Se o corte verter sangue nos olhos ou for considerado perigoso pelo médico do ringue, a luta é encerrada imediatamente por TKO.
                  </p>
                </div>
              </div>
            </div>

            {/* As 6 Categorias Técnicas Tradicionais do Muay Thai */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-2">
                <Swords className="w-4 h-4" /> As 8 Armas & Os 6 Pilares Técnicos do Currículo Tradicional
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-red-400 block">1. Socos (Mat - 2 Armas):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Mat Trong (Jab/Direto), Mat Wiang San (Gancho no Fígado), Mat Wiang Yao (Cruzado Longo), Mat Soei (Uppercut), Mat Klap (Soco Rodado), Kradot Chok (Superman Punch).
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-amber-400 block">2. Cotoveladas (Sok - 2 Armas):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Sok Ti (Cotovelada Cortante Descendente), Sok Tat (Horizontal), Sok Ngad (Ascendente no Queixo), Sok Pung (Estocada de Lança), Sok Klap (Rodada Giratória), Sok Kot (Machado).
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-emerald-400 block">3. Joelhadas (Kao - 2 Armas):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Kao Trong (Joelhada Reta no Plexo), Kao Chiang (Diagonal nas Costelas), Kao Kong (Curvada no Clinch), Kao Katai (Joelhada na Coxa), Kao Loi (Joelhada Voadora Saltada).
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-blue-400 block">4. Chutes & Teep (Te - 2 Armas):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Teep Trong (Chute Frontal de Parada), Te Kha (Low Kick Devastador de Tíbia), Te Chiang (Chute Circular Médio na Costela), Te Kankro (High Kick no Pescoço), Te Klap Lang (Rodado).
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-purple-400 block">5. Clinch & Projeções (Plum Chap Kho):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Plum Chap Kho (Trava Dupla na Nuca), Dumping de Giro (Arremesso Legal na Lona), Catch & Sweep (Segurada de Chute e Varrida de Apoio). Domínio absoluto de curta distância.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-yellow-400 block">6. Tradições Sagradas & Defesas:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Blok Kha (Bloqueio de Canela a 45º), Lean Back (Esquiva de Tronco), <strong>Wai Kru Ram Muay</strong> (Dança Cerimonial com o <strong>Mongkhon</strong> ao som da orquestra Sarama).
                  </p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingMtModal(false)}
                className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
              >
                Fechar Regulamento Muay Thai (WMC / CBMT)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OFICIAL BOXE (CBBOXE, WORLD BOXING & WBC / WBA / IBF / WBO) */}
      {viewingBoxeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-800 flex items-center justify-center text-2xl shadow-lg border border-amber-400/40">
                  🥊
                </div>
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    Regulamento Oficial da Nobre Arte: Boxe (CBBoxe & WBC / WBA / IBF / WBO)
                  </h2>
                  <p className="text-xs text-neutral-400">
                    A Nobre Arte do Pugilismo: Escola de Boxe, Tradição Olímpica, 10-Point Must System, Defesa Philly Shell e as 4 Grandes Coroas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingBoxeModal(false)}
                className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Introduction Banner */}
            <div className="p-4 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-yellow-950/40 rounded-xl border border-amber-800/40 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-300 leading-relaxed space-y-1">
                <span className="font-bold text-white block">
                  A Nobre Arte: Da Escola Amadora ao Cinturão Linear Indiscutível
                </span>
                <p>
                  No Brasil, o boxe olímpico é regulado pela <strong>Confederação Brasileira de Boxe (CBBoxe)</strong>, celeiro de campeões mundiais e medalhistas olímpicos. No âmbito profissional internacional, o esporte é consagrado pelas quatro grandes entidades mundiais (<strong>WBC</strong>, <strong>WBA</strong>, <strong>IBF</strong> e <strong>WBO</strong>), além do cobiçado cinturão linear da revista <em>The Ring</em>. As lutas são julgadas pelo rigoroso <strong>10-Point Must System</strong>, onde cada milésimo de segundo e cada centímetro de esquiva definem uma lenda.
                </p>
              </div>
            </div>

            {/* Tabela dos 12 Estágios de Carreira Pugilística */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-2">
                <Award className="w-4 h-4" /> Progressão Oficial de Carreira (12 Estágios - Amador à Lenda Mundial)
              </h3>

              <div className="overflow-x-auto rounded-xl border border-neutral-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="py-2.5 px-3">Estágio</th>
                      <th className="py-2.5 px-3">Luvas / Nível</th>
                      <th className="py-2.5 px-3">Categoria</th>
                      <th className="py-2.5 px-3">Tempo Médio</th>
                      <th className="py-2.5 px-3">Critérios de Avaliação & Conteúdo Técnico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-medium">
                    {MARTIAL_ARTS_META.boxe.ranks.map((r, idx) => (
                      <tr key={idx} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="py-2 px-3 font-bold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] flex items-center justify-center text-neutral-400 font-mono">
                            {idx + 1}
                          </span>
                          <span>{r.name}</span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-3 rounded-full border border-neutral-700 shadow-sm"
                              style={{
                                background: r.gradientStyle || r.color
                              }}
                            />
                            <span className="text-[11px] text-neutral-300">
                              {r.gradientStyle ? 'Gradiente de Honra' : 'Sólido'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-neutral-300">
                          <span className="px-2 py-0.5 bg-neutral-800 rounded-md text-[10px] font-bold text-amber-300">
                            {r.categoryName || 'Geral'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-neutral-400 font-mono text-[11px]">
                          {r.estimatedTime || 'N/A'}
                        </td>
                        <td className="py-2 px-3 text-neutral-300 text-[11px] leading-relaxed max-w-md">
                          {r.evaluationCriteria || 'Sem critérios especificados.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* O Sistema 10-Point Must & Critérios de Pontuação */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-2">
                <Shield className="w-4 h-4" /> O Sistema de Pontuação 10-Point Must & Critérios Oficiais dos Juízes
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">Round 10-9:</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-mono">Padrão Competitivo</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    O vencedor do round recebe obrigatoriamente <strong>10 pontos</strong>. O adversário derrotado no assalto recebe <strong>9 pontos</strong>. Concedido ao pugilista que conectou mais golpes limpos e controlou o ringue.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">Round 10-8:</span>
                    <span className="text-[10px] text-amber-400 uppercase font-mono font-bold">Knockdown / Domínio</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Se um pugilista sofre um <strong>knockdown</strong> (toca a lona com qualquer parte do corpo além dos pés devido a um golpe), o round torna-se automaticamente 10-8. Também pode ser concedido por superioridade física esmagadora.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-400">Round 10-7 & TKO:</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-mono">Múltiplos KDs</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Dois knockdowns no mesmo round geram um 10-7. Se um lutador for à lona 3 vezes no mesmo round, aplica-se a <strong>Regra dos 3 Knockdowns</strong>, encerrando o combate imediatamente por TKO para preservar o atleta.
                  </p>
                </div>
              </div>
            </div>

            {/* As 4 Grandes Coroas Mundiais & O Cinturão Linear */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs uppercase font-bold tracking-wider text-yellow-400 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> As 4 Grandes Entidades Mundiais & O Trono Indiscutível (Undisputed)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-emerald-400 block">WBC (World Boxing Council):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    O cobiçado cinturão Verde e Ouro. O título mais prestigiado da história, ostentado por lendas como Muhammad Ali, Mike Tyson e Floyd Mayweather.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-amber-400 block">WBA (World Boxing Association):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    A mais antiga organização do boxe mundial (fundada em 1921 como NBA). Coroa o "Super Champion" da divisão nos maiores palcos globais.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-red-400 block">IBF (International Boxing Federation):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Famosa por sua rigorosa pesagem matinal de segundo dia (limite de recuperação de 10 libras) e defesas obrigatórias inflexíveis.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-blue-400 block">WBO & The Ring Magazine:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    A WBO completa o quarteto unificado. O cinturão da revista <em>The Ring</em> é entregue exclusivamente ao campeão linear que venceu o número 1 da divisão.
                  </p>
                </div>
              </div>
            </div>

            {/* Os 6 Pilares Técnicos do Boxe */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-2">
                <Swords className="w-4 h-4" /> Os 6 Pilares Técnicos do Boxe Profissional & Olímpico
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-blue-400 block">1. Socos Fundamentais & Retos:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Lead Jab (Fita Métrica), Power Jab de Parada, Cross de Direita Tradicional, Combinação Um-Dois e Jab Baixo no Plexo/Estômago.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-red-400 block">2. Ganchos & Fígado (Hooks):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Left Hook no Queixo, Gancho no Fígado (Demolidor Liver Shot), Overhand de Direita por Cima da Guarda, Check Hook e Cruzado Duplo.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-amber-400 block">3. Uppercuts & Golpes Ascendentes:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Rear Uppercut de Direita furando a guarda, Lead Uppercut Curto de Esquerda e o clássico Bolo Punch em moinho para distrair a visão.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-emerald-400 block">4. Esquivas & Ciência Defensiva:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Pêndulo (Bob and Weave em U), Slip de Cabeça, Pull Back (Mayweather Fade), Philly Shell / Shoulder Roll e High Guard Duplo.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-purple-400 block">5. Footwork & Ring Generalship:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Passo Pivô a 90 Graus no ângulo cego, Corte de Ringue encurralando nas cordas e Saída Lateral em V com contragolpe imediato.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-yellow-400 block">6. Infighting & Contragolpes:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Infighting pesado cabeça no peito, Clinch tático de descanso nas cordas e o Direto de Encontro Fatal (velocidade somada para KO).
                  </p>
                </div>
              </div>
            </div>

            {/* Faltas Estritas & Golpes Ilegais */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs uppercase font-bold tracking-wider text-red-400 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Faltas Estritas e Infrações no Boxe
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-white block">Golpe Baixo (Low Blow):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Abaixo da linha da cintura/coquilha. O atleta atingido tem direito a até 5 minutos para recuperação e o infrator perde 1 ponto.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-white block">Golpe na Nuca (Rabbit Punch):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Golpear a parte posterior da cabeça ou coluna cervical. Infração gravíssima que acarreta desqualificação imediata.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-white block">Uso da Cabeça (Headbutt):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Cabeçadas intencionais para abrir cortes no supercílio do oponente geram perda de 2 pontos ou desqualificação do infrator.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-white block">Bater no Break:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Desferir socos após o árbitro intervir com o comando de "Break!" ou segurar o braço do oponente com uma mão enquanto bate com a outra.
                  </p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingBoxeModal(false)}
                className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
              >
                Fechar Regulamento Boxe (CBBoxe / WBC)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OFICIAL KARATÊ (CBK & WKF) */}
      {viewingKarateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-neutral-900 flex items-center justify-center text-2xl shadow-lg border border-red-400/40">
                  ⛩️
                </div>
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    Regulamento Oficial de Karatê Olímpico (CBK & WKF)
                  </h2>
                  <p className="text-xs text-neutral-400">
                    O Caminho das Mãos Vazias (Karate-Do): Tradição dos 4 Estilos Maiores, Sistema Kyu e Dan, Pontuação Olímpica (Ippon, Waza-Ari, Yuko) e a Filosofia do Budo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingKarateModal(false)}
                className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Introduction Banner */}
            <div className="p-4 bg-gradient-to-r from-red-950/40 via-neutral-900 to-rose-950/40 rounded-xl border border-red-800/40 flex items-start gap-3">
              <Info className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-300 leading-relaxed space-y-1">
                <span className="font-bold text-white block">
                  A Arte Marcial do Imperador: Do Tatame Tradicional ao Pódio Olímpico
                </span>
                <p>
                  No Brasil, o karatê oficial é regido pela <strong>Confederação Brasileira de Karatê (CBK)</strong>, única entidade reconhecida pelo Comitê Olímpico do Brasil (COB) e pela <strong>World Karate Federation (WKF)</strong>. O esporte une a herança milenar de Okinawa (estilos <em>Shotokan</em>, <em>Goju-Ryu</em>, <em>Shito-Ryu</em> e <em>Wado-Ryu</em>) à mais refinada velocidade atlética, onde a vitória é decidida pelo domínio do <strong>Kime</strong> (foco muscular e controle de impacto), <strong>Zanshin</strong> (alerta sereno contínuo) e a pontuação por Ippon (+3), Waza-Ari (+2) e Yuko (+1).
                </p>
              </div>
            </div>

            {/* Tabela dos 12 Estágios de Graduação (Kyu e Dan) */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-bold tracking-wider text-rose-400 flex items-center gap-2">
                <Award className="w-4 h-4" /> Sistema Geral de Graduação (7º Kyu ao 5º Dan Shihan da CBK / WKF)
              </h3>

              <div className="overflow-x-auto rounded-xl border border-neutral-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="py-2.5 px-3">Graduação</th>
                      <th className="py-2.5 px-3">Faixa / Obi</th>
                      <th className="py-2.5 px-3">Categoria</th>
                      <th className="py-2.5 px-3">Tempo Mínimo</th>
                      <th className="py-2.5 px-3">Critérios de Avaliação & Katas Exigidos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-medium">
                    {MARTIAL_ARTS_META.karate.ranks.map((r, idx) => (
                      <tr key={idx} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="py-2 px-3 font-bold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] flex items-center justify-center text-neutral-400 font-mono">
                            {idx + 1}
                          </span>
                          <span>{r.name}</span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-3 rounded-full border border-neutral-700 shadow-sm"
                              style={{
                                background: r.gradientStyle || r.color
                              }}
                            />
                            <span className="text-[11px] text-neutral-300">
                              {r.gradientStyle ? 'Faixa Especial / Dan' : 'Sólida'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-neutral-300">
                          <span className="px-2 py-0.5 bg-neutral-800 rounded-md text-[10px] font-bold text-rose-300">
                            {r.categoryName || 'Geral'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-neutral-400 font-mono text-[11px]">
                          {r.estimatedTime || 'N/A'}
                        </td>
                        <td className="py-2 px-3 text-neutral-300 text-[11px] leading-relaxed max-w-md">
                          {r.evaluationCriteria || 'Sem critérios especificados.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* O Sistema de Pontuação Olímpica WKF (Ippon, Waza-Ari, Yuko) */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Sistema Oficial de Pontuação Olímpica de Kumite (WKF)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">IPPON (+3 Pontos):</span>
                    <span className="text-[10px] text-amber-500 uppercase font-mono font-bold">Pontuação Máxima</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Concedido para: <strong>1)</strong> Chutes altos na cabeça (<em>Jodan Geri</em>, como <em>Jodan Mawashi-Geri</em> e <em>Ura-Mawashi-Geri</em>); ou <strong>2)</strong> Qualquer golpe pontuável desferido com precisão sobre o adversário que foi derrubado ao solo através de varredura (<em>Ashi-Barai</em>).
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-400">WAZA-ARI (+2 Pontos):</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-mono">Chute no Tronco</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Concedido para chutes médios no corpo/tronco (<em>Chudan Geri</em>, como o clássico <em>Mae-Geri</em> perfurando com o Koshi ou <em>Mawashi-Geri</em> na costela com o peito do pé). Exige impacto controlado e Zanshin imediato.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">YUKO (+1 Ponto):</span>
                    <span className="text-[10px] text-neutral-500 uppercase font-mono">Soco Reto Pontual</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Concedido para qualquer soco reto (<em>Tsuki</em>) na área de pontuação (face, cabeça, pescoço ou abdômen/peito), como o relâmpago <em>Kizami-Zuki</em> ou o explosivo <em>Gyaku-Zuki</em> de contragolpe.
                  </p>
                </div>
              </div>
            </div>

            {/* Os 6 Critérios Técnicos para Validação de Ponto & Regra dos 8 Pontos */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs uppercase font-bold tracking-wider text-rose-400 flex items-center gap-2">
                <Check className="w-4 h-4" /> Os 6 Critérios Obrigatórios para Validação de Ponto (Regra WKF)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-white block">1. Boa Forma (Good Form):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    A técnica deve ter biomecânica limpa, trajetória correta e base firme (Zenkutsu-Dachi, Kiba-Dachi) sem perda de equilíbrio.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-white block">2. Atitude Esportiva:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Postura marcial de respeito absoluto (Reigi) e nobreza, sem gestos de deboche ou agressividade descontrolada.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-white block">3. Aplicação Vigorosa (Kime):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Velocidade máxima na arrancada com contração muscular terminal instantânea no ponto de impacto focal.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-white block">4. Zanshin (Alerta Contínuo):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Após desferir o golpe, o karateca deve manter o olhar fixo no rival e guarda levantada, sem virar as costas para comemorar.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-white block">5. Timing Apropriado:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Conectar o golpe no milissegundo exato em que o oponente avança ou abre brecha de guarda (De-ai / Sen no Sen).
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-amber-400 block">6. Distância Correta & Regra dos 8 Pts:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Toque de pele leve no rosto (Skin Touch) sem ferimento. Se um atleta abrir <strong>8 pontos de diferença</strong> (ex: 8-0), vence por <strong>Superioridade Técnica</strong>!
                  </p>
                </div>
              </div>
            </div>

            {/* Os 4 Estilos Tradicionais Maiores da WKF */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs uppercase font-bold tracking-wider text-yellow-400 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Os 4 Estilos Tradicionais Maiores Reconhecidos pela WKF
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-red-400 block">Shotokan (Gichin Funakoshi):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    O estilo mais praticado no mundo. Bases baixas e compridas, trajetórias retas, força linear e explosão penetrante de Kime.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-emerald-400 block">Goju-Ryu (Chojun Miyagi):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Harmonia da rigidez (Go) com a suavidade (Ju). Respiração profunda Ibuki, defesas circulares, bases curtas e combate próximo.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-blue-400 block">Shito-Ryu (Kenwa Mabuni):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    O estilo com o maior acervo de katas (mais de 60). Combina a força de Shuri-te com a fluidez de Naha-te e esquivas Tenshin.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-amber-400 block">Wado-Ryu (Hironori Otsuka):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Caminho da Paz e Harmonia. Fusão do Karatê de Okinawa com o Shindo Yoshin-Ryu Jujutsu: esquivas fluidas, torções e contragolpes sem absorver impacto.
                  </p>
                </div>
              </div>
            </div>

            {/* Os 6 Pilares Técnicos do Karatê */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs uppercase font-bold tracking-wider text-rose-400 flex items-center gap-2">
                <Swords className="w-4 h-4" /> Os 6 Pilares Técnicos do Karate-Do
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-red-400 block">1. Socos Lineares (Tsuki-Waza):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Kizami-Zuki (Adiantado veloz), Gyaku-Zuki Reverso com Kime, Oi-Zuki Avançando a Passada, Ura-Zuki Curto e Mawashi-Zuki Circular.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-amber-400 block">2. Chutes Altos & Rotatórios (Geri-Waza):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Mae-Geri Frontal, Mawashi-Geri no Tronco, Jodan Mawashi na Cabeça (Ippon +3), Ura-Mawashi-Geri Gancho Invertido e Ushiro-Geri de Calcanhar.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-blue-400 block">3. Mão Aberta & Contusão (Uchi-Waza):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Shuto-Uchi (Faca da Mão), Haito-Uchi (Bordo Interno), Uraken-Uchi em Chicotada, Teisho-Uchi (Palma no Queixo) e Empi-Uchi de Cotovelo.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-emerald-400 block">4. Defesas & Bloqueios (Uke-Waza):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Age-Uke (Defesa Alta), Gedan-Barai (Varredura Baixa), Soto-Uke (Médio de Fora) e Shuto-Uke em Base Kokutsu-Dachi amortecendo o impacto.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-purple-400 block">5. Varreduras & Projeções (Ashi-Barai):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Ashi-Barai no Tornozelo, Ashi-Barai com Gyaku-Zuki no Solo (Ippon Supremo WKF), Osoto-Gari de Karatê e De-Ashi-Harai de Antecipação.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-yellow-400 block">6. Filosofia do Budo, Kime & Zanshin:</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    O cultivo da mente inabalável (Mushin), etiqueta de respeito ao tatame (Reigi), foco terminal e alerta sereno contínuo (Zanshin).
                  </p>
                </div>
              </div>
            </div>

            {/* Faltas & Penalidades WKF */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <h3 className="text-xs uppercase font-bold tracking-wider text-red-400 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Categorias de Faltas & Penalidades WKF
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-white block">Categoria 1 (Contato Excessivo):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Golpes com força excessiva na garganta ou rosto, ataques nas pernas, olhos ou articulações desprotegidas.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-white block">Categoria 2 (Comportamento & Fuga):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Sair da área do tatame de 8x8 metros (<em>Jogai</em>), evitar combate, agarrar excessivo sem atacar ou simulação de lesão.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="font-bold text-red-400 block">Mubobi & Hansoku (Desqualificação):</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Colocar-se em risco voluntário sem guardar a própria defesa (<em>Mubobi</em>). O acúmulo de 4 advertências resulta em desqualificação imediata (<em>Hansoku</em>).
                  </p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingKarateModal(false)}
                className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
              >
                Fechar Regulamento Karatê (CBK / WKF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Official Martial Art Federation System Modal */}
      {viewingArtDetails && (
        <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border-2 border-amber-500 rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 text-3xl">
                  {viewingArtDetails === 'capoeira' ? '🪢' : viewingArtDetails === 'boxe' ? '🥊' : viewingArtDetails === 'mma' ? '🏆' : '🥋'}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                      Documento Oficial de Graduação • Versão 1.0
                    </span>
                    <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full border border-neutral-700 font-bold">
                      {MARTIAL_ARTS_META[viewingArtDetails].federation.split('&')[0]}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white">
                    {MARTIAL_ARTS_META[viewingArtDetails].name} — {MARTIAL_ARTS_META[viewingArtDetails].federation}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                    {MARTIAL_ARTS_META[viewingArtDetails].description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingArtDetails(null)}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quadro Completo de Graduações */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-2">
                <Award className="w-4 h-4" /> Quadro Geral de Graduações & Requisitos ({MARTIAL_ARTS_META[viewingArtDetails].ranks.length} Níveis)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MARTIAL_ARTS_META[viewingArtDetails].ranks.map((r, idx) => (
                  <div key={idx} className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          {r.categoryName || `Nível ${idx + 1}`} {r.stageNumber ? `• ${r.stageNumber}º Estágio` : ''}
                        </span>
                        {r.minAge && (
                          <span className="text-[10px] bg-neutral-800 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-neutral-700">
                            Idade mín: {r.minAge} anos
                          </span>
                        )}
                      </div>

                      <div 
                        className="p-2.5 rounded-xl border border-white/20 text-center font-black text-xs shadow-xs mb-2"
                        style={{ background: r.gradientStyle || r.color, color: r.textColor }}
                      >
                        {viewingArtDetails === 'capoeira' ? '🪢' : viewingArtDetails === 'boxe' ? '🥊' : viewingArtDetails === 'mma' ? '🏆' : '🥋'} {r.name}
                      </div>

                      <div className="text-[11px] text-neutral-400 space-y-0.5">
                        {r.estimatedTime && (
                          <div><strong className="text-neutral-200">Tempo / Carência:</strong> {r.estimatedTime}</div>
                        )}
                        {r.minMonthsInRank !== undefined && r.minMonthsInRank > 0 && (
                          <div><strong className="text-cyan-400">Carência Mínima Obrigatória:</strong> {r.minMonthsInRank} meses</div>
                        )}
                        <div><strong className="text-amber-400">XP de Treino Base:</strong> {r.xpNeeded} XP</div>
                      </div>

                      {r.evaluationCriteria && (
                        <p className="text-[11px] text-neutral-300 italic pt-1.5 leading-relaxed">
                          "{r.evaluationCriteria}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingArtDetails(null)}
                className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
              >
                Fechar Tabela Oficial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
