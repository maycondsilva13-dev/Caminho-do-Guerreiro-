import React, { useMemo, useState } from 'react';
import { Character, MartialArtType, SocialContact } from '../types/game';
import { MARTIAL_ARTS_META } from '../data/martialArtsData';
import { WORLD_FIGHTERS } from '../data/worldFightersData';
import {
  addWorldFighterToSocialCircle,
  breakupOrDivorceContact,
  generateNewSocialContact,
  getPersonalityInfo,
  getRelationLabel,
  haveChildWithSpouse,
  helpFamilyFinancially,
  influenceContactToStartArt,
  interactWithSocialContact,
  marrySocialContact,
  startDatingContact
} from '../utils/socialLifeHelper';
import { enrollSocialContactInAcademy } from '../utils/playerAcademyHelper';
import { BjjBeltVisual } from './BjjBeltVisual';
import { sounds } from '../utils/audio';
import {
  Heart,
  Users,
  Baby,
  Swords,
  UserPlus,
  Coffee,
  Gift,
  MessageCircle,
  Sparkles,
  BookOpen,
  Search
} from 'lucide-react';

interface Props {
  character: Character;
  onUpdateCharacter: (updated: Character) => void;
  onNotify: (msg: string) => void;
}

type ContactFilter = 'todos' | 'familia' | 'romance' | 'amigos' | 'inimigos' | 'memorial';

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

export const SocialLifePanel: React.FC<Props> = ({
  character,
  onUpdateCharacter,
  onNotify
}) => {
  const [filter, setFilter] = useState<ContactFilter>('todos');
  const [inviteArtTargetId, setInviteArtTargetId] = useState<string | null>(null);
  const [selectedArtToInfluence, setSelectedArtToInfluence] = useState<MartialArtType>(
    character.primaryArt || 'jiujitsu'
  );
  const [childNameInput, setChildNameInput] = useState('');
  const [showWorldPicker, setShowWorldPicker] = useState(false);
  const [worldSearch, setWorldSearch] = useState('');

  const contacts = useMemo(() => character.socialContacts || [], [character.socialContacts]);

  const counts = useMemo(() => {
    const alive = contacts.filter((c) => c.isAlive);
    return {
      todos: alive.length,
      familia: alive.filter((c) => ['pai', 'mae', 'irmao', 'filho', 'conjuge'].includes(c.relationType)).length,
      romance: alive.filter(
        (c) =>
          c.relationshipStage === 'namorando' ||
          c.relationshipStage === 'noivo' ||
          c.relationshipStage === 'casado' ||
          (c.romanceLevel > 0 && !['pai', 'mae', 'irmao', 'filho'].includes(c.relationType))
      ).length,
      amigos: alive.filter(
        (c) =>
          c.relationType === 'amigo' ||
          c.relationType === 'conhecido' ||
          c.relationshipStage === 'amigo' ||
          c.relationshipStage === 'melhor_amigo'
      ).length,
      inimigos: alive.filter((c) => c.relationType === 'inimigo' || c.relationshipStage === 'inimigo').length,
      memorial: contacts.filter((c) => !c.isAlive).length
    };
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    if (filter === 'memorial') return contacts.filter((c) => !c.isAlive);
    const alive = contacts.filter((c) => c.isAlive);
    if (filter === 'familia') {
      return alive.filter((c) => ['pai', 'mae', 'irmao', 'filho', 'conjuge'].includes(c.relationType));
    }
    if (filter === 'romance') {
      return alive.filter(
        (c) =>
          c.relationshipStage === 'namorando' ||
          c.relationshipStage === 'noivo' ||
          c.relationshipStage === 'casado' ||
          (c.romanceLevel > 0 && !['pai', 'mae', 'irmao', 'filho'].includes(c.relationType))
      );
    }
    if (filter === 'amigos') {
      return alive.filter(
        (c) =>
          c.relationType === 'amigo' ||
          c.relationType === 'conhecido' ||
          c.relationshipStage === 'amigo' ||
          c.relationshipStage === 'melhor_amigo'
      );
    }
    if (filter === 'inimigos') {
      return alive.filter((c) => c.relationType === 'inimigo' || c.relationshipStage === 'inimigo');
    }
    return alive;
  }, [contacts, filter]);

  const spouse = useMemo(
    () => contacts.find((c) => c.id === character.spouseId && c.isAlive),
    [contacts, character.spouseId]
  );

  const worldCandidates = useMemo(() => {
    const linked = new Set(contacts.map((c) => c.linkedWorldFighterId).filter(Boolean));
    const q = worldSearch.trim().toLowerCase();
    return WORLD_FIGHTERS.filter((w) => !linked.has(w.id))
      .filter((w) => {
        if (!q) return true;
        return `${w.name} ${w.city || ''} ${w.country || ''} ${MARTIAL_ARTS_META[w.art]?.name || ''}`
          .toLowerCase()
          .includes(q);
      })
      .slice(0, 12);
  }, [contacts, worldSearch]);

  const handleMeetSomeone = (place: 'bairro' | 'academia' | 'evento') => {
    if (character.energy < 8) {
      onNotify('⚠️ Pouca energia para sair e conhecer novas pessoas agora.');
      return;
    }
    const res = generateNewSocialContact(character, place);
    res.updatedChar.energy = Math.max(0, res.updatedChar.energy - 8);
    sounds.playWhoosh();
    onUpdateCharacter(res.updatedChar);
    onNotify(res.message);
  };

  const handleAddWorldFighter = (fighterId: string) => {
    const res = addWorldFighterToSocialCircle(character, fighterId);
    if (res.success) {
      sounds.playWhoosh();
      onUpdateCharacter(res.updatedChar);
    }
    onNotify(res.message);
  };

  const handleInteract = (
    contactId: string,
    action: 'conversar' | 'sair' | 'presentear' | 'provocar' | 'reconciliar'
  ) => {
    const res = interactWithSocialContact(character, contactId, action);
    if (res.success) {
      sounds.playPunch(action === 'provocar');
      onUpdateCharacter(res.updatedChar);
    }
    onNotify(res.message);
  };

  const handleDate = (contactId: string) => {
    const res = startDatingContact(character, contactId);
    if (res.success) {
      sounds.playCheer();
      onUpdateCharacter(res.updatedChar);
    }
    onNotify(res.message);
  };

  const handleMarry = (contactId: string, type: 'cartorio' | 'festa') => {
    const res = marrySocialContact(character, contactId, type);
    if (res.success) {
      sounds.playGraduation();
      onUpdateCharacter(res.updatedChar);
    }
    onNotify(res.message);
  };

  const handleBreakup = (contactId: string) => {
    const res = breakupOrDivorceContact(character, contactId);
    if (res.success) {
      sounds.playPunch(false);
      onUpdateCharacter(res.updatedChar);
    }
    onNotify(res.message);
  };

  const handleHaveChild = () => {
    const res = haveChildWithSpouse(character, childNameInput);
    if (res.success) {
      sounds.playGraduation();
      setChildNameInput('');
      onUpdateCharacter(res.updatedChar);
    }
    onNotify(res.message);
  };

  const handleInfluenceArt = (contactId: string) => {
    const res = influenceContactToStartArt(character, contactId, selectedArtToInfluence);
    if (res.accepted) {
      sounds.playGraduation();
    } else {
      sounds.playWhoosh();
    }
    onUpdateCharacter(res.updatedChar);
    setInviteArtTargetId(null);
    onNotify(res.message);
  };

  const maritalLabel =
    character.maritalStatus === 'casado' && spouse
      ? `Casado(a) com ${spouse.name}`
      : character.maritalStatus === 'namorando' && spouse
      ? `Namorando ${spouse.name}`
      : character.maritalStatus === 'viuvo'
      ? 'Viúvo(a)'
      : 'Solteiro(a)';

  return (
    <div className="space-y-5">
      {/* Summary & Meet New People Controls */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" /> Rede Pessoal, Laços & Gerações
            </div>
            <h2 className="text-lg font-black text-white">{maritalLabel}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 tabular-nums">
              <span>{counts.familia} Familiares</span>
              <span aria-hidden="true">·</span>
              <span>{counts.amigos} Amigos/Conhecidos</span>
              <span aria-hidden="true">·</span>
              <span>{counts.inimigos} Inimigos</span>
              <span aria-hidden="true">·</span>
              <span>{counts.memorial} no Memorial</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleMeetSomeone('bairro')}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl border border-neutral-700 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-400" />
              Socializar no Bairro (-8 En)
            </button>
            <button
              type="button"
              onClick={() => handleMeetSomeone('academia')}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl border border-neutral-700 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Conhecer na Academia (-8 En)
            </button>
            <button
              type="button"
              onClick={() => handleMeetSomeone('evento')}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl border border-neutral-700 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5 text-pink-400" />
              Evento Social (-8 En)
            </button>
            <button
              type="button"
              onClick={() => setShowWorldPicker(!showWorldPicker)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                showWorldPicker
                  ? 'bg-amber-500 text-neutral-950 border-amber-400'
                  : 'bg-neutral-950 hover:bg-neutral-800 text-amber-300 border-amber-500/40'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Conectar Lutador do Circuito
            </button>
            {counts.familia > 0 && (
              <button
                type="button"
                onClick={() => {
                  const res = helpFamilyFinancially(character, 300);
                  if (res.success) {
                    sounds.playCheer();
                    onUpdateCharacter(res.updatedChar);
                  }
                  onNotify(res.message);
                }}
                className="px-3.5 py-2 bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-700/50 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                💝 Ajudar Família (R$ 300)
              </button>
            )}
          </div>
        </div>

        {/* Picker to connect world fighters */}
        {showWorldPicker && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-neutral-300">
                Aproxime-se de atletas do circuito mundial para amizade, romance ou casamento:
              </span>
              <input
                type="text"
                value={worldSearch}
                onChange={(e) => setWorldSearch(e.target.value)}
                placeholder="Buscar atleta, arte ou cidade..."
                className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-52 overflow-y-auto">
              {worldCandidates.map((wf) => (
                <button
                  key={wf.id}
                  type="button"
                  onClick={() => handleAddWorldFighter(wf.id)}
                  className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-left flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {wf.avatar} {wf.name} ({wf.gender === 'F' ? '♀' : '♂'}, {wf.age}a)
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {MARTIAL_ARTS_META[wf.art].name} · {wf.city || 'Brasil'}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-400 shrink-0">+ Conectar</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Family Expansion Bar when Married */}
        {character.maritalStatus === 'casado' && spouse && (
          <div className="bg-neutral-950 border border-pink-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{spouse.avatar}</span>
              <div>
                <div className="text-xs font-bold text-pink-300">
                  Lar & Família com {spouse.name}
                </div>
                <p className="text-xs text-neutral-400">
                  Vocês estão casados e podem ter filhos. As crianças crescem a cada ano e aos 7 anos já podem iniciar uma arte marcial!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={childNameInput}
                onChange={(e) => setChildNameInput(e.target.value)}
                placeholder="Nome do filho(a) (opcional)"
                className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white w-44 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
              <button
                type="button"
                onClick={handleHaveChild}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Baby className="w-4 h-4" />
                Ter Filho
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-neutral-900 p-1.5 rounded-xl border border-neutral-800">
        {(
          [
            { id: 'todos', label: `Todos Vivos (${counts.todos})` },
            { id: 'familia', label: `Família & Filhos (${counts.familia})` },
            { id: 'romance', label: `Romance & Cônjuge (${counts.romance})` },
            { id: 'amigos', label: `Amigos (${counts.amigos})` },
            { id: 'inimigos', label: `Inimigos (${counts.inimigos})` },
            { id: 'memorial', label: `Memorial (${counts.memorial})` }
          ] as Array<{ id: ContactFilter; label: string }>
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              filter === tab.id
                ? 'bg-amber-500 text-neutral-950'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contacts Grid */}
      {filteredContacts.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-sm text-neutral-400">
          {filter === 'memorial'
            ? 'Nenhum familiar ou amigo no memorial até o momento.'
            : 'Nenhuma pessoa encontrada nesta categoria.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredContacts.map((contact: SocialContact) => {
            const pMeta = getPersonalityInfo(contact.personality);
            const relLabel = getRelationLabel(contact);
            const isCloseFamily = ['pai', 'mae', 'irmao', 'filho'].includes(contact.relationType);
            const isMarriedToPlayer = contact.relationshipStage === 'casado' && character.spouseId === contact.id;
            const isDatingPlayer = contact.relationshipStage === 'namorando' && character.spouseId === contact.id;
            const canDate =
              contact.isAlive &&
              !isCloseFamily &&
              !isDatingPlayer &&
              !isMarriedToPlayer &&
              character.maritalStatus !== 'casado' &&
              character.maritalStatus !== 'namorando' &&
              character.age >= 15 &&
              contact.age >= 15 &&
              contact.affinity >= 45;
            const canMarry =
              contact.isAlive &&
              isDatingPlayer &&
              character.age >= 18 &&
              contact.age >= 18 &&
              contact.affinity >= 65 &&
              contact.romanceLevel >= 55;
            const canInfluenceArt =
              contact.isAlive &&
              !contact.martialArt &&
              contact.age >= 7 &&
              contact.relationshipStage !== 'inimigo';

            const artMeta = contact.martialArt ? MARTIAL_ARTS_META[contact.martialArt] : null;

            return (
              <div
                key={contact.id}
                className={`bg-neutral-900 border rounded-2xl p-5 flex flex-col justify-between gap-4 ${
                  !contact.isAlive
                    ? 'border-neutral-800 opacity-85'
                    : isMarriedToPlayer || isDatingPlayer
                    ? 'border-pink-500/40'
                    : contact.relationshipStage === 'inimigo'
                    ? 'border-red-900/60'
                    : 'border-neutral-800'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Title & Clean Inline Metadata */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-neutral-800 flex items-center justify-center text-2xl shrink-0">
                        {contact.avatar}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-white text-base truncate">
                          {contact.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400 tabular-nums">
                          <span className="font-bold text-amber-400">{relLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span>{contact.age} anos</span>
                          <span aria-hidden="true">·</span>
                          <span>{contact.gender === 'F' ? 'Feminino' : 'Masculino'}</span>
                          <span aria-hidden="true">·</span>
                          <span>{pMeta.label}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-bold tabular-nums text-neutral-300 shrink-0">
                      {contact.isAlive ? `Saúde ${contact.health}%` : 'Falecido(a)'}
                    </span>
                  </div>

                  {/* Independent Life & Routine */}
                  <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3 space-y-1.5 text-xs">
                    <div className="text-neutral-200 font-semibold">
                      Rotina: {contact.occupation}
                    </div>
                    <div className="text-neutral-400">{contact.dailyRoutine}</div>
                    {contact.partnerName && (
                      <div className="text-pink-300">
                        Vida pessoal: Em relacionamento com {contact.partnerName}
                        {contact.childrenCount ? ` · ${contact.childrenCount} filho(s)` : ''}
                      </div>
                    )}
                    {artMeta ? (
                      <div className="text-emerald-300 font-semibold pt-1 space-y-1.5">
                        <div>
                          Arte Marcial: {artMeta.name} ({contact.martialArtBelt || artMeta.ranks[0].name})
                          {contact.martialArtInfluencerName
                            ? ` · ${
                                contact.martialArtSource === 'pj'
                                  ? 'Influenciado(a) por você'
                                  : `Influência: ${contact.martialArtInfluencerName}`
                              }`
                            : ''}
                        </div>
                        {contact.martialArt === 'jiujitsu' && (
                          <BjjBeltVisual
                            compact
                            rankIndex={contact.martialArtRankIndex ?? 0}
                            stripes={contact.martialArtStripes ?? 0}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="text-neutral-500 pt-1">
                        Ainda não pratica nenhuma arte marcial
                      </div>
                    )}
                  </div>

                  {/* Relationship Numeric Meters */}
                  {contact.isAlive ? (
                    <div className="grid grid-cols-3 gap-2 text-xs tabular-nums">
                      <div className="bg-neutral-950 border border-neutral-800/80 rounded-lg px-2.5 py-1.5">
                        <span className="text-neutral-500 block">Afinidade</span>
                        <span
                          className={`font-bold ${
                            contact.affinity >= 50
                              ? 'text-emerald-400'
                              : contact.affinity < 0
                              ? 'text-red-400'
                              : 'text-neutral-200'
                          }`}
                        >
                          {contact.affinity}/100
                        </span>
                      </div>
                      <div className="bg-neutral-950 border border-neutral-800/80 rounded-lg px-2.5 py-1.5">
                        <span className="text-neutral-500 block">Respeito</span>
                        <span className="font-bold text-amber-300">{contact.respect}/100</span>
                      </div>
                      <div className="bg-neutral-950 border border-neutral-800/80 rounded-lg px-2.5 py-1.5">
                        <span className="text-neutral-500 block">
                          {isCloseFamily ? 'Cidade' : 'Romance'}
                        </span>
                        <span className="font-bold text-pink-300 truncate block">
                          {isCloseFamily ? contact.city : `${contact.romanceLevel}/100`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-400">
                      <div>
                        Partiu em{' '}
                        {contact.deathDate
                          ? `${String(contact.deathDate.month).padStart(2, '0')}/${contact.deathDate.year}`
                          : 'data registrada'}{' '}
                        aos {contact.age} anos
                      </div>
                      {contact.deathCause && <div className="text-neutral-500 mt-0.5">{contact.deathCause}</div>}
                    </div>
                  )}

                  {/* Recent Life Events */}
                  {contact.recentLifeEvents && contact.recentLifeEvents.length > 0 && (
                    <div className="text-xs text-neutral-400 space-y-1">
                      <div className="font-semibold text-neutral-300 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-neutral-500" /> Acontecimentos recentes
                      </div>
                      {contact.recentLifeEvents.slice(0, 2).map((ev, i) => (
                        <div key={i} className="text-neutral-400 pl-2">
                          • {ev}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {contact.isAlive && (
                  <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleInteract(contact.id, 'conversar')}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
                        Conversar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInteract(contact.id, 'sair')}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Coffee className="w-3.5 h-3.5 text-amber-400" />
                        Sair (R$ 35)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInteract(contact.id, 'presentear')}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Gift className="w-3.5 h-3.5 text-pink-400" />
                        Presente (R$ 80)
                      </button>

                      {contact.relationshipStage === 'inimigo' || contact.affinity < 0 ? (
                        <button
                          type="button"
                          onClick={() => handleInteract(contact.id, 'reconciliar')}
                          className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Reconciliar
                        </button>
                      ) : (
                        !isCloseFamily && (
                          <button
                            type="button"
                            onClick={() => handleInteract(contact.id, 'provocar')}
                            className="px-3 py-1.5 bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Swords className="w-3.5 h-3.5" />
                            Discutir
                          </button>
                        )
                      )}
                    </div>

                    {/* Romance / Marriage / Art Influence Row */}
                    <div className="flex flex-wrap gap-1.5">
                      {canInfluenceArt && (
                        <button
                          type="button"
                          onClick={() =>
                            setInviteArtTargetId(inviteArtTargetId === contact.id ? null : contact.id)
                          }
                          className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Influenciar Arte Marcial
                        </button>
                      )}

                      {character.playerAcademy &&
                        contact.isAlive &&
                        contact.age >= 7 &&
                        contact.relationshipStage !== 'inimigo' &&
                        !character.playerAcademy.students.some((s) => s.linkedContactId === contact.id) && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = enrollSocialContactInAcademy(character, contact.id);
                              if (res.success) {
                                sounds.playGraduation();
                                onUpdateCharacter(res.updatedChar);
                              }
                              onNotify(res.message);
                            }}
                            className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Matricular na Minha Academia
                          </button>
                        )}

                      {canDate && (
                        <button
                          type="button"
                          onClick={() => handleDate(contact.id)}
                          className="px-3 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Pedir em Namoro
                        </button>
                      )}

                      {canMarry && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleMarry(contact.id, 'cartorio')}
                            className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Casar no Cartório (R$ 350)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarry(contact.id, 'festa')}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Casamento c/ Festa (R$ 1.800)
                          </button>
                        </>
                      )}

                      {(isDatingPlayer || isMarriedToPlayer) && (
                        <button
                          type="button"
                          onClick={() => handleBreakup(contact.id)}
                          className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 border border-neutral-700 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          {isMarriedToPlayer ? 'Divorciar' : 'Terminar'}
                        </button>
                      )}
                    </div>

                    {/* Martial Art Invitation Picker */}
                    {inviteArtTargetId === contact.id && canInfluenceArt && (
                      <div className="bg-neutral-950 border border-amber-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <select
                          value={selectedArtToInfluence}
                          onChange={(e) => setSelectedArtToInfluence(e.target.value as MartialArtType)}
                          className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          {ALL_ARTS.map((art) => (
                            <option key={art} value={art}>
                              {MARTIAL_ARTS_META[art].name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleInfluenceArt(contact.id)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg cursor-pointer whitespace-nowrap"
                        >
                          Convidar para Treinar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
