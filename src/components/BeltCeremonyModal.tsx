import React, { useEffect, useState } from 'react';
import { Character, MartialArtType } from '../types/game';
import { MARTIAL_ARTS_META, WORLD_GYMS } from '../data/martialArtsData';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Award, Flame, Sparkles, Check, Clock, HeartHandshake, AlertCircle } from 'lucide-react';
import { validateGraduationRequirements } from '../utils/graduationHelper';
import { calculateGraduationCeremonyCost } from '../utils/regionalEconomyHelper';

interface Props {
  character: Character;
  art: MartialArtType;
  onClose: () => void;
  onPromoteConfirm: (options?: { ceremonyCost?: number; paidByFamily?: boolean; masterName?: string }) => void;
}

export const BeltCeremonyModal: React.FC<Props> = ({
  character,
  art,
  onClose,
  onPromoteConfirm
}) => {
  const meta = MARTIAL_ARTS_META[art];
  const currentGrad = character.artGraduations[art];
  const eligibility = validateGraduationRequirements(character, art);
  const nextRank = eligibility.nextRank || meta.ranks[Math.min(meta.ranks.length - 1, currentGrad.rankIndex + 1)];

  const currentGym = WORLD_GYMS.find((g) => g.id === character.currentGymId);
  const costBreakdown = calculateGraduationCeremonyCost(character, art, nextRank, currentGym);
  const ceremonyCost = costBreakdown.totalCost;

  const isMinor = character.age < 18;
  const familyCanPay = costBreakdown.familyCanPay;
  const athleteCanPay = character.money >= ceremonyCost;
  const canAfford = familyCanPay || athleteCanPay;

  const masterName =
    character.playerAcademy && character.currentGymId === character.playerAcademy.id
      ? `Conselho / Prof. ${character.name}`
      : currentGym
      ? currentGym.masterName
      : 'Mestre do Dojo';

  useEffect(() => {
    if (eligibility.canAdvance) {
      sounds.playGraduation();
      try {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 }
        });
      } catch (e) {
        // Confetti fallback
      }
    }
  }, [eligibility.canAdvance]);

  const handleConfirm = () => {
    onPromoteConfirm({
      ceremonyCost: familyCanPay ? 0 : ceremonyCost,
      paidByFamily: familyCanPay,
      masterName
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border-2 border-amber-500 rounded-3xl max-w-lg w-full p-6 md:p-8 text-center space-y-5 shadow-2xl relative animate-scaleIn max-h-[92vh] overflow-y-auto scrollbar-thin">
        {/* Glow & Icon */}
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-4xl shadow-xl mx-auto">
            {art === 'capoeira' ? '🪢' : art === 'boxe' ? '🥊' : '🥋'}
          </div>
          <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-spin" />
        </div>

        {eligibility.canAdvance ? (
          <>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Cerimônia Oficial de Batizado & Graduação
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase mt-1">
                Exame de Graduação Aprovado!
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Outorga oficial da banca examinadora da {meta.federation.split('&')[0]}
              </p>
            </div>

            {/* New Belt Display */}
            <div className="p-5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="uppercase tracking-wider font-semibold">Nova Graduação:</span>
                {nextRank.categoryName && (
                  <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-amber-400 font-bold border border-neutral-700">
                    {nextRank.categoryName} {nextRank.stageNumber ? `• ${nextRank.stageNumber}º Estágio` : ''}
                  </span>
                )}
              </div>

              <div 
                className="p-3.5 rounded-xl border border-white/20 text-center font-black text-base md:text-lg shadow-lg tracking-wide"
                style={{ 
                  background: nextRank.gradientStyle || nextRank.color, 
                  color: nextRank.textColor 
                }}
              >
                {art === 'capoeira' ? '🪢' : art === 'boxe' ? '🥊' : '🥋'} {nextRank.name}
              </div>

              {nextRank.estimatedTime && (
                <div className="text-[11px] text-amber-400/90 font-semibold bg-neutral-900/80 p-2 rounded-lg border border-neutral-800">
                  ⏱️ Tempo Estimado Nesta Fase: {nextRank.estimatedTime}
                </div>
              )}

              {nextRank.evaluationCriteria && (
                <div className="text-left text-xs text-neutral-300 bg-neutral-900 p-3 rounded-xl border border-neutral-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    📋 Avaliação do Mestre ({masterName}):
                  </span>
                  <p className="text-[11px] text-neutral-300 leading-relaxed italic">
                    "{nextRank.evaluationCriteria}"
                  </p>
                </div>
              )}

              {/* Custos da Cerimônia & Suporte Familiar */}
              <div className="bg-neutral-900/90 p-3.5 rounded-xl border border-neutral-800 text-left space-y-2">
                <div className="flex justify-between items-center text-[11px] text-neutral-400">
                  <span>Exame & Certificado Federativo:</span>
                  <span className="font-semibold text-neutral-200">R$ {costBreakdown.examFee.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-neutral-400">
                  <span>{costBreakdown.equipmentLabel}:</span>
                  <span className="font-semibold text-neutral-200">
                    {costBreakdown.equipmentFee === 0 ? 'Incluso (Projeto Social)' : `R$ ${costBreakdown.equipmentFee.toLocaleString('pt-BR')}`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-neutral-800">
                  <span className="text-neutral-300 font-semibold">
                    Total da Cerimônia {costBreakdown.socialDiscountApplied ? '(Subsídio Social)' : ''}:
                  </span>
                  <span className="font-bold text-amber-400">R$ {ceremonyCost.toLocaleString('pt-BR')}</span>
                </div>

                {isMinor ? (
                  familyCanPay ? (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
                      <HeartHandshake className="w-4 h-4 shrink-0" />
                      <span>Seus responsáveis aprovaram a graduação com orgulho e cobriram os custos da cerimônia!</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-300 flex items-start gap-1.5 bg-amber-950/40 p-2 rounded-lg border border-amber-800/40">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        <span>Apoio familiar baixo ({character.familySupport}%). Seus pais não cobriram a taxa; você precisará pagar com suas economias (Saldo: R$ {character.money.toLocaleString('pt-BR')}).</span>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-[11px] text-neutral-400 flex justify-between items-center">
                    <span>Seu saldo atual:</span>
                    <span className={athleteCanPay ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      R$ {character.money.toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={!canAfford}
                onClick={handleConfirm}
                className={`w-full py-4 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 ${
                  canAfford
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-amber-500/25 cursor-pointer'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                }`}
              >
                <Check className="w-5 h-5" />
                {familyCanPay
                  ? 'Receber a Nova Graduação com a Família'
                  : canAfford
                  ? `Pagar R$ ${ceremonyCost} & Receber Graduação`
                  : 'Saldo Insuficiente para a Taxa'}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                Adiar Cerimônia (Manter XP & Treinos Preservados)
              </button>

              <p className="text-[10px] text-neutral-500 leading-tight">
                * Conforme o regulamento, adiar a cerimônia por falta de verba nunca apaga nem reinicia o seu progresso técnico.
              </p>
            </div>
          </>
        ) : (
          <>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
                Avaliação Regimental & Requisitos
              </span>
              <h2 className="text-2xl font-black text-white uppercase mt-1">
                Exame Pendente de Requisitos
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Diretrizes oficiais da {meta.federation}
              </p>
            </div>

            <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 text-left space-y-2">
              <span className="text-xs font-bold text-neutral-300 block">
                Requisitos necessários para promoção:
              </span>
              <div className="space-y-1.5 text-xs">
                {eligibility.requirements.map((req, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-neutral-900">
                    <span className={req.met ? 'text-neutral-400' : 'text-amber-300 font-semibold'}>{req.label}:</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      req.met ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                    }`}>
                      {req.current} / {req.required} {req.met ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Voltar aos Treinos
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

