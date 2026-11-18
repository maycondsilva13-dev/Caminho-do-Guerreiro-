import React, { useState, useMemo } from 'react';
import { MartialArtType, GameDate, GameDifficulty } from '../types/game';
import { MARTIAL_ARTS_META } from '../data/martialArtsData';
import { BRAZIL_STATES, getStateByUf } from '../data/brazilLocations';
import { getCapitalProfileSummary } from '../utils/regionalGeographyHelper';
import { createNewCharacter } from '../utils/characterHelper';
import { DIFFICULTY_PROFILES } from '../utils/talentAndDifficultyHelper';
import { 
  isValidDate, 
  isLeapYear, 
  getDaysInMonth, 
  calculateCareerStartDate, 
  calculateAge, 
  formatGameDate,
  MONTH_NAMES 
} from '../utils/dateUtils';
import { sounds } from '../utils/audio';
import { 
  Shield, 
  Sparkles, 
  Award, 
  Flame, 
  User, 
  Swords, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2,
  Clock
} from 'lucide-react';

interface Props {
  onCharacterCreated: (char: ReturnType<typeof createNewCharacter>) => void;
}

export const CharacterCreation: React.FC<Props> = ({ onCharacterCreated }) => {
  const [name, setName] = useState('Gabriel Souza');
  const [nickname, setNickname] = useState('Predador');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [startAge, setStartAge] = useState<8 | 13 | 21>(8);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('normal');
  const [selectedArt, setSelectedArt] = useState<MartialArtType>('jiujitsu');
  const [avatar, setAvatar] = useState('🥋');
  const [selectedUf, setSelectedUf] = useState('SP');

  // Birth Date state (Default: 15/10/1989 -> Start career: 15/10/1997 at 8 years old)
  const [birthDay, setBirthDay] = useState<number>(15);
  const [birthMonth, setBirthMonth] = useState<number>(10);
  const [birthYear, setBirthYear] = useState<number>(1989);

  const avatarOptions = ['🥋', '🥊', '🤼', '🐅', '🦅', '🦁', '⚡', '🔥', '🥷'];

  // Current selected state info & regional economic/sport profile
  const currentState = useMemo(() => getStateByUf(selectedUf), [selectedUf]);
  const capitalProfile = useMemo(() => getCapitalProfileSummary(selectedUf), [selectedUf]);

  // Validation logic
  const daysInSelectedMonth = useMemo(() => {
    return getDaysInMonth(birthMonth, birthYear);
  }, [birthMonth, birthYear]);

  const dateValidation = useMemo(() => {
    if (!birthDay || !birthMonth || !birthYear) {
      return { isValid: false, message: 'Informe dia, mês e ano de nascimento completos.' };
    }
    if (birthYear < 1940 || birthYear > 2026) {
      return { isValid: false, message: 'O ano de nascimento deve estar entre 1940 e 2026.' };
    }
    if (birthMonth < 1 || birthMonth > 12) {
      return { isValid: false, message: 'O mês deve estar entre 1 e 12.' };
    }
    if (birthDay < 1 || birthDay > daysInSelectedMonth) {
      if (birthMonth === 2 && birthDay === 29 && !isLeapYear(birthYear)) {
        return { 
          isValid: false, 
          message: `O ano de ${birthYear} NÃO é bissexto! Fevereiro teve apenas 28 dias.` 
        };
      }
      return { 
        isValid: false, 
        message: `${MONTH_NAMES[birthMonth - 1]} de ${birthYear} possui no máximo ${daysInSelectedMonth} dias.` 
      };
    }
    return { isValid: true, message: 'Data de nascimento válida!' };
  }, [birthDay, birthMonth, birthYear, daysInSelectedMonth]);

  // Calculated Career Start Date
  const birthDateObj: GameDate = useMemo(() => ({
    day: birthDay,
    month: birthMonth,
    year: birthYear
  }), [birthDay, birthMonth, birthYear]);

  const careerStartDateObj: GameDate = useMemo(() => {
    return calculateCareerStartDate(birthDateObj, startAge);
  }, [birthDateObj, startAge]);

  const previewAge = useMemo(() => {
    return calculateAge(birthDateObj, careerStartDateObj);
  }, [birthDateObj, careerStartDateObj]);

  const handleStart = () => {
    if (!dateValidation.isValid) return;

    sounds.playGraduation();
    const char = createNewCharacter(
      name,
      nickname,
      birthDateObj,
      startAge,
      selectedArt,
      avatar,
      currentState.uf,
      currentState.capital,
      gender,
      difficulty
    );
    onCharacterCreated(char);
  };

  const currentMeta = MARTIAL_ARTS_META[selectedArt];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-3 sm:p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-red-950 via-neutral-900 to-amber-950 p-4 sm:p-6 md:p-8 border-b border-neutral-800 relative">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Swords className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <span className="text-[11px] sm:text-xs uppercase tracking-widest text-amber-400 font-bold">Simulador de Carreira Marcial & Vida</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-white uppercase">
            Caminho do Guerreiro
          </h1>
          <p className="text-neutral-400 text-xs md:text-sm mt-2 max-w-2xl leading-relaxed">
            Forje a história de um lutador brasileiro desde as primeiras graduações infantis até os maiores palcos do MMA mundial. Defina sua origem, data de nascimento e o momento de entrada no dojo.
          </p>
        </div>

        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
          {/* 1. Nome, Apelido e Avatar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-2">
                Nome do Lutador
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Gabriel Souza"
                className="w-full bg-neutral-800/80 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-2">
                Apelido no Tatame
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ex: Fenômeno / Pitbull"
                className="w-full bg-neutral-800/80 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-2">
                Símbolo / Avatar
              </label>
              <div className="flex gap-2 overflow-x-auto py-1">
                {avatarOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setAvatar(opt);
                      sounds.playPunch(false);
                    }}
                    className={`w-11 h-11 text-xl flex items-center justify-center rounded-xl border transition-all ${
                      avatar === opt
                        ? 'border-amber-400 bg-amber-500/20 scale-105 shadow-md shadow-amber-500/10'
                        : 'border-neutral-800 bg-neutral-800/50 hover:border-neutral-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setGender('M')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    gender === 'M'
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                      : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:text-white'
                  }`}
                >
                  ♂ Masculino
                </button>
                <button
                  type="button"
                  onClick={() => setGender('F')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    gender === 'F'
                      ? 'bg-pink-500/20 border-pink-400 text-pink-300'
                      : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:text-white'
                  }`}
                >
                  ♀ Feminino
                </button>
              </div>
            </div>
          </div>

          {/* 2. Estado de Origem / Base no Brasil (27 Unidades Federativas) */}
          <div className="bg-neutral-950/60 p-5 rounded-2xl border border-neutral-800 space-y-3">
            <label className="block text-xs uppercase tracking-wider font-bold text-amber-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" /> Estado de Origem & Base no Brasil (27 Federações)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-1">
                <select
                  value={selectedUf}
                  onChange={(e) => {
                    setSelectedUf(e.target.value);
                    sounds.playPunch(false);
                  }}
                  className="w-full bg-neutral-850 border border-neutral-700 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                >
                  {BRAZIL_STATES.map((s) => (
                    <option key={s.uf} value={s.uf}>
                      {s.name} ({s.uf}) - {s.capital}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2.5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{currentState.flagEmoji}</span>
                  <div className="text-xs flex-1">
                    <div className="text-white font-bold flex flex-wrap items-center gap-2">
                      <span>{currentState.capital} — {currentState.name} ({currentState.region})</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                        Índice Esportivo {currentState.sport.sportDevelopmentIndex}/100
                      </span>
                    </div>
                    <p className="text-neutral-400 mt-1 leading-relaxed">
                      {currentState.martialHeritage}
                    </p>
                    <p className="text-neutral-500 mt-1 text-[11px] leading-relaxed">
                      {currentState.sport.economicIdentity}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-800/80 text-[11px]">
                  <div className="bg-neutral-950/70 px-2.5 py-1.5 rounded-lg border border-neutral-800/80">
                    <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Custo de Vida</span>
                    <span className="text-white font-bold">
                      {capitalProfile.costTierLabel} ({currentState.economy.costOfLivingIndex.toFixed(2)}x)
                    </span>
                  </div>
                  <div className="bg-neutral-950/70 px-2.5 py-1.5 rounded-lg border border-neutral-800/80">
                    <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Mercado & Patrocínio</span>
                    <span className="text-emerald-400 font-bold">{capitalProfile.sponsorshipLabel}</span>
                  </div>
                  <div className="bg-neutral-950/70 px-2.5 py-1.5 rounded-lg border border-neutral-800/80">
                    <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Infraestrutura</span>
                    <span className="text-sky-300 font-bold truncate block">{capitalProfile.infrastructureLabel.split('&')[0].trim()}</span>
                  </div>
                  <div className="bg-neutral-950/70 px-2.5 py-1.5 rounded-lg border border-neutral-800/80">
                    <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Artes Fortes</span>
                    <span className="text-amber-300 font-bold truncate block">
                      {currentState.sport.dominantArts.map((a) => MARTIAL_ARTS_META[a].name.split(' ')[0]).join(' • ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Data de Nascimento Completa (Dia, Mês, Ano) */}
          <div className="bg-neutral-950/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider font-bold text-amber-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" /> Data de Nascimento Completa
              </label>
              {isLeapYear(birthYear) && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  ✨ Ano Bissexto ({birthYear})
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Dia */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1 font-semibold">
                  Dia
                </label>
                <select
                  value={birthDay}
                  onChange={(e) => setBirthDay(Number(e.target.value))}
                  className="w-full bg-neutral-850 border border-neutral-700 rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Dia {d.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mês */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1 font-semibold">
                  Mês
                </label>
                <select
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(Number(e.target.value))}
                  className="w-full bg-neutral-850 border border-neutral-700 rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                >
                  {MONTH_NAMES.map((mName, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {(idx + 1).toString().padStart(2, '0')} - {mName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ano */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1 font-semibold">
                  Ano de Nascimento
                </label>
                <input
                  type="number"
                  min="1940"
                  max="2026"
                  value={birthYear}
                  onChange={(e) => setBirthYear(Number(e.target.value))}
                  className="w-full bg-neutral-850 border border-neutral-700 rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
            </div>

            {/* Mensagem de validação de data */}
            {!dateValidation.isValid ? (
              <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-400 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {dateValidation.message}
              </div>
            ) : (
              <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Nascimento confirmado em: <strong className="text-white">{formatGameDate(birthDateObj, 'full')}</strong>
              </div>
            )}
          </div>

          {/* 4. Idade Inicial da Carreira (8, 13 ou 21 anos) */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" /> Idade Inicial Escolhida
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  age: 8 as const,
                  title: 'Criança (8 anos)',
                  badge: 'Mirim / Base Escolar',
                  desc: 'Inicie ainda menino no primário. Mesada curta, deveres de casa, máxima elasticidade e anos para se tornar uma lenda viva do tatame.'
                },
                {
                  age: 13 as const,
                  title: 'Juvenil (13 anos)',
                  badge: 'Competidor Adolescente',
                  desc: 'Ensino fundamental, primeiros opens regionais e estaduais, bicos no bairro e rivalidades escolares em alta.'
                },
                {
                  age: 21 as const,
                  title: 'Adulto (21 anos)',
                  badge: 'Maioridade & Pro',
                  desc: 'Físico desenvolvido e maduro, busca imediata por trabalho ou patrocínio para custear academias e foco rápido na transição para o MMA.'
                }
              ].map((opt) => (
                <button
                  key={opt.age}
                  type="button"
                  onClick={() => {
                    setStartAge(opt.age);
                    sounds.playPunch(false);
                  }}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                    startAge === opt.age
                      ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                      : 'border-neutral-800 bg-neutral-850 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white text-base">{opt.title}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-amber-400 border border-neutral-700">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 4.5 Dificuldade do Jogo & Poder Aquisitivo da Família */}
          <div className="bg-neutral-950/60 p-5 rounded-2xl border border-neutral-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-xs uppercase tracking-wider font-bold text-amber-400 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" /> Dificuldade do Jogo & Poder Aquisitivo da Família
              </label>
              <span className="text-[11px] text-neutral-400">
                Define a classe econômica dos seus pais, mesada e suporte financeiro inicial
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(['facil', 'moderado', 'normal', 'dificil'] as GameDifficulty[]).map((diffKey) => {
                const profile = DIFFICULTY_PROFILES[diffKey];
                const isSelected = difficulty === diffKey;
                const startMoney = profile.startingMoneyByAge[startAge];
                return (
                  <button
                    key={diffKey}
                    type="button"
                    onClick={() => {
                      setDifficulty(diffKey);
                      sounds.playPunch(false);
                    }}
                    className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                        : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${profile.badgeClass}`}>
                          {profile.familyWealthLabel}
                        </span>
                      </div>
                      <div className="font-bold text-white text-sm">{profile.label}</div>
                      <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">
                        {profile.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-neutral-800/80 flex flex-wrap justify-between gap-1 text-[10px] font-bold">
                      <span className="text-emerald-400">Início: R$ {startMoney.toLocaleString('pt-BR')}</span>
                      <span className="text-neutral-300">
                        {profile.monthlyAllowanceUnder18 > 0
                          ? `Mesada <18a: +R$ ${profile.monthlyAllowanceUnder18}/mês`
                          : 'Sem mesada fixa'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Pré-visualização do Calendário de Estreia (Item crucial da ETAPA 1) */}
          <div className="bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 border-2 border-amber-500/40 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-400">
                Linha do Tempo Calculada da Carreira
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
                <span className="text-neutral-500 uppercase font-bold text-[10px] block">Nascimento Oficial</span>
                <span className="text-white font-extrabold text-sm block mt-0.5">
                  {formatGameDate(birthDateObj, 'full')}
                </span>
                <span className="text-neutral-400 text-[11px]">Ano civil: {birthDateObj.year}</span>
              </div>

              <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
                <span className="text-neutral-500 uppercase font-bold text-[10px] block">Data de Estreia da Carreira</span>
                <span className="text-amber-400 font-extrabold text-sm block mt-0.5">
                  {formatGameDate(careerStartDateObj, 'full')}
                </span>
                <span className="text-amber-300/80 text-[11px]">Ano de início: {careerStartDateObj.year}</span>
              </div>

              <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
                <span className="text-neutral-500 uppercase font-bold text-[10px] block">Idade de Início & Base</span>
                <span className="text-emerald-400 font-extrabold text-sm block mt-0.5">
                  {previewAge} anos exatos
                </span>
                <span className="text-neutral-400 text-[11px] truncate block">
                  {currentState.capital} - {currentState.uf}
                </span>
              </div>
            </div>
          </div>

          {/* 6. Escolha da Arte Marcial Inicial */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" /> Arte Marcial Primária
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {(['jiujitsu', 'boxe', 'muaythai', 'karate', 'judo', 'capoeira', 'lutalivre'] as MartialArtType[]).map((art) => {
                const meta = MARTIAL_ARTS_META[art];
                const isSelected = selectedArt === art;
                return (
                  <button
                    key={art}
                    type="button"
                    onClick={() => {
                      setSelectedArt(art);
                      sounds.playPunch(true);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/15 scale-102 shadow-md shadow-amber-500/15'
                        : 'border-neutral-800 bg-neutral-850 hover:border-neutral-700 hover:bg-neutral-800'
                    }`}
                  >
                    <span className="text-2xl mb-1.5">
                      {art === 'boxe' ? '🥊' : art === 'jiujitsu' ? '🥋' : art === 'muaythai' ? '🇹🇭' : art === 'karate' ? '🥋' : art === 'judo' ? '🥋' : art === 'capoeira' ? '🪘' : '🤼'}
                    </span>
                    <span className="font-bold text-xs text-white leading-tight">{meta.name.split(' ')[0]}</span>
                    <span className="text-[10px] text-neutral-400 mt-1">{meta.federation.split('&')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Detalhes da Arte Selecionada */}
            <div className="mt-4 p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-amber-400 text-base">{currentMeta.name}</h3>
                  <span className="text-xs text-neutral-400">({currentMeta.federation})</span>
                </div>
                <p className="text-xs text-neutral-300 mt-1 max-w-xl">{currentMeta.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentMeta.focusAttributes.map((attr) => (
                    <span key={attr} className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-md border border-neutral-700">
                      ⚡ +{attr}
                    </span>
                  ))}
                </div>
              </div>

              <div className="shrink-0 p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-right">
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">Graduação Inicial</span>
                <span className="font-bold text-sm text-white">{currentMeta.ranks[0].name}</span>
              </div>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-purple-950/25 border border-purple-500/30 flex items-start gap-2.5 text-xs text-purple-200">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-purple-300">Talento Oculto por Arte Marcial:</strong>{' '}
                Seu lutador nasce com um nível de talento aleatório (de <em>Comum</em> até <em>Gênio</em>) para cada uma das 8 artes marciais. O talento real permanece oculto e só é revelado após você <strong>se matricular em uma turma</strong> da respectiva arte na Agenda Semanal — liberando bônus permanentes de evolução!
              </div>
            </div>
          </div>

          {/* Botão Iniciar Carreira */}
          <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-neutral-400">
              {dateValidation.isValid ? (
                <span>Tudo pronto! Carreira começará em <strong>{formatGameDate(careerStartDateObj, 'monthYear')}</strong>.</span>
              ) : (
                <span className="text-red-400 font-semibold">Corrija a data de nascimento acima para continuar.</span>
              )}
            </div>

            <button
              type="button"
              disabled={!dateValidation.isValid}
              onClick={handleStart}
              className={`w-full sm:w-auto px-8 py-4 font-black uppercase tracking-wider text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 ${
                dateValidation.isValid
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-amber-500/20 hover:shadow-amber-500/30 cursor-pointer'
                  : 'bg-neutral-800 text-neutral-600 cursor-not-allowed shadow-none'
              }`}
            >
              <Flame className="w-5 h-5 text-neutral-950" />
              Entrar no Tatame & Iniciar Carreira
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
