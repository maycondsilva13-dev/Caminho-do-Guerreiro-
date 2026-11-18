import { Character, Tournament } from '../types/game';
import { MARTIAL_ARTS_META } from '../data/martialArtsData';
import { getRelationLabel } from './socialLifeHelper';

export type CornerTactic = 'pressao_ofensiva' | 'defesa_pontos' | 'busca_finalizacao';

export interface TournamentFamilySupportInfo {
  supportersCount: number;
  supporterNames: string[];
  focusBonus: number;
  isPersonalRivalry: boolean;
  rivalryLabel?: string;
  summaryText: string;
}

export interface CoachableParticipant {
  id: string;
  source: 'family' | 'student';
  name: string;
  avatar: string;
  roleLabel: string;
  art: Tournament['art'];
  beltLabel: string;
  powerRating: number;
}

/**
 * Avalia torcida da família na plateia e eventual rivalidade pessoal contra o oponente.
 */
export function getTournamentFamilySupport(
  char: Character,
  _tournament: Tournament,
  opponentId?: string,
  opponentName?: string
): TournamentFamilySupportInfo {
  const contacts = Array.isArray(char.socialContacts) ? char.socialContacts : [];

  const supporters = contacts.filter(
    (c) =>
      c.isAlive &&
      c.affinity >= 60 &&
      (c.relationType === 'conjuge' ||
        c.relationshipStage === 'casado' ||
        c.relationType === 'pai' ||
        c.relationType === 'mae' ||
        c.relationType === 'irmao' ||
        c.relationType === 'filho' ||
        c.relationshipStage === 'melhor_amigo')
  );

  const supporterNames = supporters.slice(0, 3).map((s) => `${s.name.split(' ')[0]} (${getRelationLabel(s)})`);
  const focusBonus = Math.min(6, supporters.length * 1.5);

  const personalEnemy = contacts.find(
    (c) =>
      c.isAlive &&
      (c.relationshipStage === 'inimigo' || c.relationType === 'inimigo' || c.affinity <= -25) &&
      ((opponentId && (c.id === opponentId || `social_fighter_${c.id}` === opponentId || c.linkedWorldFighterId === opponentId)) ||
        (opponentName && c.name.toLowerCase() === opponentName.toLowerCase()))
  );

  const isPersonalRivalry = Boolean(personalEnemy);
  const rivalryLabel = personalEnemy
    ? `🔥 Rivalidade Pessoal contra ${personalEnemy.name}!`
    : undefined;

  const summaryText =
    supporters.length > 0
      ? `🏟️ Na Plateia: ${supporterNames.join(', ')}${supporters.length > 3 ? ` e +${supporters.length - 3}` : ''} (+${focusBonus.toFixed(1)} Foco Mental).`
      : 'Sem torcida familiar próxima neste evento.';

  return {
    supportersCount: supporters.length,
    supporterNames,
    focusBonus,
    isPersonalRivalry,
    rivalryLabel,
    summaryText
  };
}

/**
 * Lista familiares e alunos da academia do professor que praticam a arte do torneio
 * e podem receber corner do PJ nesta edição.
 */
export function getCoachableTournamentParticipants(
  char: Character,
  tournament: Tournament
): CoachableParticipant[] {
  const list: CoachableParticipant[] = [];
  const seenContactIds = new Set<string>();

  // 1. Alunos da própria academia do professor
  if (char.playerAcademy && char.playerAcademy.art === tournament.art) {
    for (const s of char.playerAcademy.students) {
      if (s.age < 8) continue;
      if (s.linkedContactId) seenContactIds.add(s.linkedContactId);
      const powerRating = Math.round(
        s.technique * 0.7 + s.rankIndex * 7 + (s.talent === 'competidor' || s.talent === 'prodigio' ? 6 : 0)
      );
      list.push({
        id: s.id,
        source: 'student',
        name: s.name,
        avatar: s.avatar,
        roleLabel: s.linkedContactId ? 'Familiar & Aluno da Academia' : 'Aluno da Sua Academia',
        art: s.art,
        beltLabel: s.belt,
        powerRating
      });
    }
  }

  // 2. Familiares e melhores amigos praticantes da arte do torneio
  for (const c of char.socialContacts || []) {
    if (!c.isAlive || c.age < 8 || seenContactIds.has(c.id)) continue;
    if (c.martialArt !== tournament.art) continue;
    const isClose =
      ['pai', 'mae', 'irmao', 'filho', 'conjuge'].includes(c.relationType) ||
      c.relationshipStage === 'casado' ||
      c.relationshipStage === 'melhor_amigo';
    if (!isClose) continue;

    const meta = MARTIAL_ARTS_META[tournament.art];
    const rankIdx = c.martialArtRankIndex ?? 0;
    const beltLabel = c.martialArtBelt || meta.ranks[rankIdx]?.name || 'Iniciante';
    const powerRating = Math.round(35 + rankIdx * 9 + (c.martialArtStripes || 0) * 2);

    list.push({
      id: c.id,
      source: 'family',
      name: c.name,
      avatar: c.avatar,
      roleLabel: getRelationLabel(c),
      art: tournament.art,
      beltLabel,
      powerRating
    });
  }

  return list;
}

/**
 * Executa a atuação do PJ como técnico no corner de um familiar ou aluno em um torneio.
 */
export function coachParticipantInTournament(
  char: Character,
  tournament: Tournament,
  participantId: string,
  source: 'family' | 'student',
  tactic: CornerTactic,
  rng: () => number = Math.random
): { updatedChar: Character; won: boolean; message: string } {
  const coachKey = `${tournament.id}_${char.currentYear}`;
  if ((char.coachedTournaments || []).includes(coachKey)) {
    return {
      updatedChar: char,
      won: false,
      message: 'Você já atuou como corner nesta edição do campeonato.'
    };
  }

  if (char.energy < 10) {
    return {
      updatedChar: char,
      won: false,
      message: 'Energia insuficiente (requer 10 energia) para acompanhar a equipe no corner.'
    };
  }

  const participants = getCoachableTournamentParticipants(char, tournament);
  const target = participants.find((p) => p.id === participantId && p.source === source);
  if (!target) {
    return {
      updatedChar: char,
      won: false,
      message: 'Atleta não elegível para corner neste campeonato.'
    };
  }

  const updated = JSON.parse(JSON.stringify(char)) as Character;
  updated.energy = Math.max(0, updated.energy - 10);
  if (!Array.isArray(updated.coachedTournaments)) updated.coachedTournaments = [];
  updated.coachedTournaments.push(coachKey);

  // Cálculo de vitória com base no rating do pupilo/familiar + QI de Luta do PJ no corner
  const cornerBonus = Math.min(18, Math.round((updated.attributes?.fightIq || 20) * 0.22));
  const tacticMod = tactic === 'busca_finalizacao' ? 3 : tactic === 'pressao_ofensiva' ? 4 : 5;
  const winProb = Math.max(0.32, Math.min(0.88, 0.42 + (target.powerRating + cornerBonus + tacticMod - 50) * 0.008));
  const won = rng() < winProb;

  const tacticLabel =
    tactic === 'pressao_ofensiva'
      ? 'Pressão Ofensiva'
      : tactic === 'busca_finalizacao'
      ? 'Busca por Finalização'
      : 'Estratégia por Pontos';

  if (source === 'student' && updated.playerAcademy) {
    const stu = updated.playerAcademy.students.find((s) => s.id === participantId);
    if (stu) {
      stu.xp = Math.min(stu.xpNeeded, stu.xp + (won ? 55 : 25));
      stu.technique = Math.min(99, Math.round((stu.technique + (won ? 1.4 : 0.6)) * 10) / 10);
      stu.loyalty = Math.min(100, stu.loyalty + (won ? 6 : 3));
      stu.lastInteractionNote = won
        ? `Venceu no ${tournament.name} com seu corner (${tacticLabel})!`
        : `Lutou duro no ${tournament.name} sob sua orientação.`;
      stu.recentNotes = [stu.lastInteractionNote, ...(stu.recentNotes || [])].slice(0, 4);
    }
    updated.playerAcademy.reputation = Math.min(1000, updated.playerAcademy.reputation + (won ? 3 : 1));
  }

  const linkedContactId =
    source === 'family'
      ? participantId
      : updated.playerAcademy?.students.find((s) => s.id === participantId)?.linkedContactId;

  if (linkedContactId) {
    const contact = (updated.socialContacts || []).find((c) => c.id === linkedContactId);
    if (contact) {
      contact.affinity = Math.min(100, contact.affinity + (won ? 6 : 3));
      contact.respect = Math.min(100, contact.respect + (won ? 6 : 3));
      contact.recentLifeEvents = [
        won
          ? `Venceu luta no ${tournament.name} com ${updated.name} no corner!`
          : `Competiu no ${tournament.name} com apoio de ${updated.name} no corner.`,
        ...(contact.recentLifeEvents || [])
      ].slice(0, 4);
    }
  }

  updated.honor = Math.min(100, updated.honor + 2);
  updated.fame = Math.min(1000, updated.fame + (won ? 8 : 3));

  if (!Array.isArray(updated.socialFeed)) updated.socialFeed = [];
  updated.socialFeed.unshift({
    id: `corner_${Date.now()}`,
    author: `${updated.name} (Corner Técnico)`,
    handle: `@${updated.nickname.toLowerCase().replace(/\s+/g, '_')}_coach`,
    text: won
      ? `🏆 Vitória no ${tournament.name}! Atuei no corner de ${target.name} (${tacticLabel}) e trouxemos a vitória pra casa!`
      : `🥋 Orgulho no ${tournament.name}: estive no corner de ${target.name} (${tacticLabel}). Evolução constante no tatame!`,
    time: `${String(updated.currentMonth).padStart(2, '0')}/${updated.currentYear}`,
    likes: 40 + updated.fame,
    verified: updated.fame > 80
  });

  const message = won
    ? `🏆 Vitória no Corner! Sob sua instrução (${tacticLabel}), ${target.name} venceu no ${tournament.name}! (+Fama, +Honra)`
    : `🥋 Grande experiência! ${target.name} lutou com garra sob seu corner (${tacticLabel}) e ganhou evolução técnica.`;

  return { updatedChar: updated, won, message };
}
