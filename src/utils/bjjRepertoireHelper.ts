/**
 * CAMINHO DO GUERREIRO: DO TATAME AO OCTÓGONO
 * Módulo de Integração Técnica do Jiu-Jitsu Brasileiro (Fase 4.1)
 *
 * Gerencia a inicialização, persistência e evolução individual do repertório técnico
 * de BJJ (proficiência, domínio 1 a 5 estrelas, execuções e XP técnico individual),
 * assegurando estrita separação entre XP técnico e XP de graduação.
 */

import { Character } from '../types/game';
import { BjjAthleteTechniqueProficiency, BjjBeltRankIndex, BjjTechniqueId } from '../types/bjjCombat';
import { BJJ_TECHNIQUES_CATALOG } from '../data/bjjTechniquesCatalog';
import { BjjCombatCycleRecord } from '../types/bjjCombatEngine';
import { resolveBjjCombatBeltRank } from '../data/worldFightersData';

/**
 * Cria ou sincroniza o repertório inicial individual de um personagem.
 * - Faixa Branca (rank 0): técnicas fundamentais (minBeltRank = 0).
 * - Se graduado superior, desbloqueia até sua faixa correspondente.
 * - Inicializa proficiência básica com domínio 1 e 0 XP se recém-aprendida.
 */
export function getOrInitializePlayerBjjRepertoire(
  char?: Character
): Record<BjjTechniqueId, BjjAthleteTechniqueProficiency> {
  const existing = char?.bjjTechniqueRepertoire ? { ...char.bjjTechniqueRepertoire } : {};

  const bjjGrad = char?.artGraduations?.jiujitsu;
  const beltRank: BjjBeltRankIndex = resolveBjjCombatBeltRank(bjjGrad?.rankIndex, bjjGrad?.name);

  // Se já possui repertório com técnicas, sincroniza com possíveis novas técnicas da graduação
  for (const [id, tech] of Object.entries(BJJ_TECHNIQUES_CATALOG)) {
    const techBeltReq = tech.legality?.minBeltRank ?? 0;
    
    // Se o atleta possui graduação suficiente e ainda não tem o registro
    if (existing[id]) {
      continue;
    }

    // Regra de aprendizado: técnicas fundamentais (faixa branca) já vêm como conhecidas nível 1 para praticantes de BJJ
    // Técnicas de faixas superiores só vêm desbloqueadas se o atleta já atingiu ou superou a faixa necessária
    if (beltRank >= techBeltReq) {
      existing[id] = {
        techniqueId: id,
        isKnown: true,
        masteryLevel: 1,
        experiencePoints: 0,
        executionsCount: 0,
        successCount: 0
      };
    } else {
      // Técnica ainda não aprendida
      existing[id] = {
        techniqueId: id,
        isKnown: false,
        masteryLevel: 0,
        experiencePoints: 0,
        executionsCount: 0,
        successCount: 0
      };
    }
  }

  return existing;
}

/**
 * Compacta o repertório BJJ para persistência, removendo entradas idênticas ao padrão
 * gerado automaticamente pela faixa atual (que são reidratadas por getOrInitializePlayerBjjRepertoire).
 */
export function compactPlayerBjjRepertoire(
  char?: Character
): Record<BjjTechniqueId, BjjAthleteTechniqueProficiency> {
  if (!char?.bjjTechniqueRepertoire) return {};

  const bjjGrad = char.artGraduations?.jiujitsu;
  const beltRank: BjjBeltRankIndex = resolveBjjCombatBeltRank(bjjGrad?.rankIndex, bjjGrad?.name);

  const compacted: Record<BjjTechniqueId, BjjAthleteTechniqueProficiency> = {};

  for (const [id, prof] of Object.entries(char.bjjTechniqueRepertoire)) {
    if (!prof) continue;
    const tech = BJJ_TECHNIQUES_CATALOG[id];
    const techBeltReq = tech?.legality?.minBeltRank ?? 0;
    const defaultKnown = beltRank >= techBeltReq;
    const defaultMastery = defaultKnown ? 1 : 0;

    const isDefaultState =
      prof.isKnown === defaultKnown &&
      prof.masteryLevel === defaultMastery &&
      (prof.experiencePoints || 0) === 0 &&
      (prof.executionsCount || 0) === 0 &&
      (prof.successCount || 0) === 0;

    if (!isDefaultState) {
      compacted[id] = prof;
    }
  }

  return compacted;
}

/**
 * Gera um repertório coerente para um adversário NPC com base em sua faixa e estilo.
 */
export function generateOpponentBjjRepertoire(
  oppBeltRank: BjjBeltRankIndex,
  isGi: boolean
): Record<BjjTechniqueId, BjjAthleteTechniqueProficiency> {
  const repertoire: Record<BjjTechniqueId, BjjAthleteTechniqueProficiency> = {};

  for (const [id, tech] of Object.entries(BJJ_TECHNIQUES_CATALOG)) {
    const techBeltReq = tech.legality?.minBeltRank ?? 0;

    // Se o adversário não tem a faixa mínima requerida, ele não conhece a técnica
    if (oppBeltRank < techBeltReq) {
      continue;
    }

    // Validação Gi vs No-Gi
    if (isGi && !tech.legality.giAllowed) continue;
    if (!isGi && !tech.legality.noGiAllowed) continue;
    if (isGi && tech.legality.illegalUnderCbjjRules) continue;

    // Domínio varia de acordo com a faixa do adversário (1 a 4)
    const baseMastery = Math.min(5, Math.max(1, 1 + oppBeltRank));

    repertoire[id] = {
      techniqueId: id,
      isKnown: true,
      masteryLevel: baseMastery,
      experiencePoints: baseMastery * 60,
      executionsCount: 5 + oppBeltRank * 4,
      successCount: 3 + oppBeltRank * 2
    };
  }

  return repertoire;
}

/**
 * Evolui o repertório técnico individual do atleta a partir do histórico de ciclos de combate.
 * Respeita retornos decrescentes, qualidade da execução e distingue XP técnico de XP de graduação.
 */
export function evolveRepertoireFromFight(
  repertoire: Record<BjjTechniqueId, BjjAthleteTechniqueProficiency>,
  history: BjjCombatCycleRecord[],
  athleteId: 'athlete_a' | 'athlete_b'
): { updatedRepertoire: Record<BjjTechniqueId, BjjAthleteTechniqueProficiency>; totalTechXpEarned: number } {
  const updated = { ...repertoire };
  let totalTechXpEarned = 0;

  for (const cycle of history) {
    const action = athleteId === 'athlete_a' ? cycle.actionA : cycle.actionB;
    const isValid = athleteId === 'athlete_a' ? cycle.actionAValid : cycle.actionBValid;

    if (!action || !action.techniqueId || !isValid) continue;

    const techId = action.techniqueId;
    const currentProf = updated[techId] ? { ...updated[techId] } : {
      techniqueId: techId,
      isKnown: true,
      masteryLevel: 1,
      experiencePoints: 0,
      executionsCount: 0,
      successCount: 0
    };

    currentProf.executionsCount += 1;

    // Determina sucesso
    const isSuccess = cycle.dominantOutcome?.outcomeType === 'sucesso_pleno';
    const isPartial = cycle.dominantOutcome?.outcomeType === 'sucesso_parcial';

    if (isSuccess) {
      currentProf.successCount += 1;
    }

    // Cálculo de XP técnico com retornos decrescentes
    // Níveis mais altos requerem mais experiência e ganham menos proporcionalmente por repetição simples
    let xpGain = isSuccess ? 15 : isPartial ? 8 : 4;
    
    // Retorno decrescente para repetições na mesma luta (> 3 execuções)
    if (currentProf.executionsCount > 5) {
      xpGain = Math.max(1, Math.round(xpGain * 0.7));
    }

    currentProf.experiencePoints += xpGain;
    totalTechXpEarned += xpGain;

    // Avaliação de promoção de maestria (1 a 5 estrelas)
    // Nível 1 -> 2: 50 XP
    // Nível 2 -> 3: 150 XP
    // Nível 3 -> 4: 300 XP
    // Nível 4 -> 5: 600 XP
    if (currentProf.masteryLevel === 1 && currentProf.experiencePoints >= 50) {
      currentProf.masteryLevel = 2;
    } else if (currentProf.masteryLevel === 2 && currentProf.experiencePoints >= 150) {
      currentProf.masteryLevel = 3;
    } else if (currentProf.masteryLevel === 3 && currentProf.experiencePoints >= 300) {
      currentProf.masteryLevel = 4;
    } else if (currentProf.masteryLevel === 4 && currentProf.experiencePoints >= 600) {
      currentProf.masteryLevel = 5;
    }

    updated[techId] = currentProf;
  }

  return { updatedRepertoire: updated, totalTechXpEarned };
}
