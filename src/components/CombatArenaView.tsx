import React, { useState, useEffect } from 'react';
import { CombatState, Move } from '../types/game';
import { executePlayerMove, applyCornerRest } from '../utils/fightEngine';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Shield, 
  Swords, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Trophy, 
  CheckCircle2, 
  ChevronRight,
  Heart,
  Zap,
  Activity,
  Flame,
  UserCheck
} from 'lucide-react';

interface Props {
  combatState: CombatState;
  onFightComplete: (finalState: CombatState) => void;
  playerMoves: Move[];
}

export const CombatArenaView: React.FC<Props> = ({
  combatState: initialCombatState,
  onFightComplete,
  playerMoves
}) => {
  const [state, setState] = useState<CombatState>(initialCombatState);
  const [activeCategory, setActiveCategory] = useState<'todos' | 'soco' | 'chute' | 'queda' | 'finalizacao' | 'defesa' | 'floreio'>('todos');
  const [shaking, setShaking] = useState(false);
  const [lastActionFeedback, setLastActionFeedback] = useState<string | null>(null);

  const { tournament, player, opponent } = state;

  // Trigger celebration on fight end if player won
  useEffect(() => {
    if (state.isFightOver && state.winner === 'player') {
      sounds.playCheer();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Confetti fallback
      }
    }
  }, [state.isFightOver, state.winner]);

  const handleMoveClick = (move: Move) => {
    if (state.isFightOver || state.isBetweenRounds) return;
    if (player.stamina < move.staminaCost) {
      setLastActionFeedback('⚠️ Sem gás/estamina suficiente para este golpe!');
      setTimeout(() => setLastActionFeedback(null), 2000);
      return;
    }

    setShaking(true);
    setTimeout(() => setShaking(false), 300);

    const result = executePlayerMove(state, move);

    // Play synthesized combat sound
    if (result.soundToPlay === 'heavy_punch') sounds.playPunch(true);
    else if (result.soundToPlay === 'punch') sounds.playPunch(false);
    else if (result.soundToPlay === 'whoosh') sounds.playWhoosh();
    else if (result.soundToPlay === 'whistle') sounds.playWhistle();
    else if (result.soundToPlay === 'bell') sounds.playBell();

    setState(result.nextState);
  };

  const handleCornerChoice = (strategy: 'agressivo' | 'estrategico' | 'recuperar') => {
    const updated = applyCornerRest(state, strategy);
    setState(updated);
  };

  // Filter available moves
  const filteredMoves = playerMoves.filter((m) => {
    if (activeCategory === 'todos') return true;
    if (activeCategory === 'defesa') return m.type === 'defense' || m.type === 'counter';
    return m.category === activeCategory;
  });

  return (
    <div className={`min-h-screen bg-neutral-950 text-neutral-100 p-3 md:p-6 transition-transform ${shaking ? 'animate-pulse ring-2 ring-red-500/40' : ''}`}>
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Tournament Banner & Federation Header */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">{tournament.organization}</span>
                <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700">
                  {state.stageName}
                </span>
              </div>
              <h1 className="text-lg md:text-2xl font-black text-white">{tournament.name}</h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Regulamento Oficial: <span className="text-neutral-200 font-semibold">{tournament.rulesType.replace('_', ' ').toUpperCase()}</span> • Categoria: {tournament.weightClass}
              </p>
            </div>
          </div>

          {/* Round Clock */}
          <div className="flex items-center gap-4 bg-neutral-950 px-5 py-2.5 rounded-xl border border-neutral-800 text-center">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">Round</span>
              <span className="text-xl font-black text-amber-400">{state.round} / {state.totalRounds}</span>
            </div>
            <div className="w-px h-8 bg-neutral-800" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">Tempo</span>
              <span className="text-xl font-mono font-black text-white flex items-center gap-1 justify-center">
                <Clock className="w-4 h-4 text-neutral-400" />
                {Math.floor(state.roundTimeRemaining / 60)}:{(state.roundTimeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Fighters Scoreboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Player Card (Corner Azul) */}
          <div className="bg-neutral-900 border-2 border-blue-500/40 rounded-2xl p-4 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600/30 text-blue-400 text-[10px] font-black uppercase rounded-bl-xl border-l border-b border-blue-500/30">
              Córner Azul (Você)
            </div>

            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl p-2 bg-neutral-800 rounded-xl border border-neutral-700">{player.avatar}</span>
              <div>
                <h2 className="text-base font-black text-white">{player.name}</h2>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-400 font-semibold">"{player.nickname}"</span>
                  <span className="text-neutral-400">• {player.rankName}</span>
                </div>
              </div>
            </div>

            {/* Meters: HP, Stamina, Guard */}
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1 text-red-400"><Heart className="w-3.5 h-3.5" /> Vitalidade / Queixo</span>
                  <span className="text-neutral-300">{player.hp} / {player.maxHp}</span>
                </div>
                <div className="h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div 
                    className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all rounded-full"
                    style={{ width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1 text-cyan-400"><Zap className="w-3.5 h-3.5" /> Gás / Estamina</span>
                  <span className="text-neutral-300">{player.stamina} / {player.maxStamina}</span>
                </div>
                <div className="h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div 
                    className="h-full bg-cyan-400 transition-all rounded-full"
                    style={{ width: `${Math.max(0, (player.stamina / player.maxStamina) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1 text-emerald-400"><Shield className="w-3.5 h-3.5" /> Guarda Fechada</span>
                  <span className="text-neutral-300">{player.guard}%</span>
                </div>
                <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div 
                    className="h-full bg-emerald-500 transition-all rounded-full"
                    style={{ width: `${Math.max(0, player.guard)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Points / Federação Badges */}
            <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
              <span className="text-neutral-400">Pontos da Luta:</span>
              <div className="flex items-center gap-3">
                <span className="font-black text-amber-400 text-sm bg-neutral-950 px-2.5 py-0.5 rounded border border-neutral-800">
                  {player.points} pts
                </span>
                {tournament.rulesType === 'bjj_points' && (
                  <span className="text-neutral-400 text-[11px]">Vantagens: {player.advantages}</span>
                )}
                {player.knockdowns > 0 && (
                  <span className="text-red-400 text-[11px] font-bold">Knockdowns: {player.knockdowns}</span>
                )}
              </div>
            </div>
          </div>

          {/* Opponent Card (Corner Vermelho) */}
          <div className="bg-neutral-900 border-2 border-red-500/40 rounded-2xl p-4 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-red-600/30 text-red-400 text-[10px] font-black uppercase rounded-bl-xl border-l border-b border-red-500/30">
              Córner Vermelho (Rival)
            </div>

            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl p-2 bg-neutral-800 rounded-xl border border-neutral-700">{opponent.avatar}</span>
              <div>
                <h2 className="text-base font-black text-white">{opponent.name}</h2>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-400 font-semibold">"{opponent.nickname}"</span>
                  <span className="text-neutral-400">• {opponent.rankName}</span>
                </div>
              </div>
            </div>

            {/* Meters: HP, Stamina, Guard */}
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1 text-red-400"><Heart className="w-3.5 h-3.5" /> Vitalidade / Queixo</span>
                  <span className="text-neutral-300">{opponent.hp} / {opponent.maxHp}</span>
                </div>
                <div className="h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div 
                    className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all rounded-full"
                    style={{ width: `${Math.max(0, (opponent.hp / opponent.maxHp) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1 text-cyan-400"><Zap className="w-3.5 h-3.5" /> Gás / Estamina</span>
                  <span className="text-neutral-300">{opponent.stamina} / {opponent.maxStamina}</span>
                </div>
                <div className="h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div 
                    className="h-full bg-cyan-400 transition-all rounded-full"
                    style={{ width: `${Math.max(0, (opponent.stamina / opponent.maxStamina) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1 text-emerald-400"><Shield className="w-3.5 h-3.5" /> Guarda Fechada</span>
                  <span className="text-neutral-300">{opponent.guard}%</span>
                </div>
                <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div 
                    className="h-full bg-emerald-500 transition-all rounded-full"
                    style={{ width: `${Math.max(0, opponent.guard)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Points / Federação Badges */}
            <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
              <span className="text-neutral-400">Pontos da Luta:</span>
              <div className="flex items-center gap-3">
                <span className="font-black text-amber-400 text-sm bg-neutral-950 px-2.5 py-0.5 rounded border border-neutral-800">
                  {opponent.points} pts
                </span>
                {tournament.rulesType === 'bjj_points' && (
                  <span className="text-neutral-400 text-[11px]">Vantagens: {opponent.advantages}</span>
                )}
                {opponent.knockdowns > 0 && (
                  <span className="text-red-400 text-[11px] font-bold">Knockdowns: {opponent.knockdowns}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ticker / Dynamic Combat Commentary Log */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-400" /> Transmissão do Combate ao Vivo
            </span>
            <span className="text-[10px] text-neutral-500">Narração Oficial</span>
          </div>

          <div className="h-28 overflow-y-auto space-y-1.5 pr-2 font-mono text-xs scrollbar-thin">
            {state.log.map((entry) => {
              const colorClass = 
                entry.type === 'knockdown' ? 'text-amber-400 bg-amber-950/40 border-l-2 border-amber-500 p-1.5 rounded' :
                entry.type === 'submission' ? 'text-purple-400 bg-purple-950/40 border-l-2 border-purple-500 p-1.5 rounded' :
                entry.type === 'damage' ? 'text-red-400 bg-red-950/20 p-1 rounded' :
                entry.type === 'hit' ? 'text-emerald-300 bg-emerald-950/20 p-1 rounded' :
                entry.type === 'point' ? 'text-cyan-300 bg-cyan-950/30 p-1 rounded font-bold' :
                entry.type === 'referee' ? 'text-yellow-200 font-bold italic' :
                'text-neutral-400';

              return (
                <div key={entry.id} className={`${colorClass} transition-all`}>
                  {entry.text}
                </div>
              );
            })}
          </div>
        </div>

        {/* Between Rounds Corner Break Modal */}
        {state.isBetweenRounds && (
          <div className="p-5 bg-gradient-to-r from-blue-950/90 via-neutral-900 to-indigo-950/90 border-2 border-blue-500 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🧊</span>
              <div>
                <h3 className="text-lg font-black text-white uppercase">Intervalo no Córner - Fim do Round {state.round - 1}</h3>
                <p className="text-xs text-neutral-300">
                  O cutman passa vaselina e coloca gelo na sua testa. Seu mestre de córner olha fixamente nos seus olhos para a próxima estratégia:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <button
                type="button"
                onClick={() => handleCornerChoice('recuperar')}
                className="p-3 bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 hover:border-blue-400 rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-sm text-cyan-400">Recuperar Fôlego & Gelo</div>
                <div className="text-xs text-neutral-400 mt-1">Restaura +25 de Vida e reseta a guarda para o próximo round.</div>
              </button>

              <button
                type="button"
                onClick={() => handleCornerChoice('agressivo')}
                className="p-3 bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 hover:border-red-400 rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-sm text-red-400">Partir pro Nocaute / Ataque</div>
                <div className="text-xs text-neutral-400 mt-1">Instrução feroz: aumenta potência de golpes (+Força).</div>
              </button>

              <button
                type="button"
                onClick={() => handleCornerChoice('estrategico')}
                className="p-3 bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-400 rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-sm text-amber-400">Leitura Tática de Contragolpe</div>
                <div className="text-xs text-neutral-400 mt-1">Estuda as falhas do oponente (+QI de Luta e esquiva).</div>
              </button>
            </div>
          </div>
        )}

        {/* Fight Over Resolution Panel */}
        {state.isFightOver && (
          <div className="p-6 bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 border-2 border-amber-500 rounded-2xl text-center space-y-4 shadow-2xl">
            <span className="text-5xl">
              {state.winner === 'player' ? '🏆' : state.winner === 'opponent' ? '💔' : '🤝'}
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase">
              {state.winner === 'player'
                ? `VITÓRIA ESPETACULAR POR ${state.winMethod}!`
                : state.winner === 'opponent'
                ? `DERROTA POR ${state.winMethod}`
                : 'EMPATE DECLARADO PELOS JUÍZES'}
            </h2>
            <p className="text-sm text-neutral-300 max-w-lg mx-auto">
              {state.winner === 'player'
                ? `Você honrou seu mestre, sua academia e superou ${opponent.name} com autoridade sob o regulamento da ${tournament.organization}!`
                : `Foi uma luta dura contra ${opponent.name}. Volte para o dojo, analise seus erros no treino e continue treinando forte.`}
            </p>

            {state.winner === 'player' && (
              state.stageName === 'Grande Final' ? (
                <div className="inline-flex flex-wrap gap-4 justify-center bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs">
                  <span className="text-emerald-400 font-bold">💰 +R$ {tournament.rewardMoney}</span>
                  <span className="text-amber-400 font-bold">🥋 +{tournament.rewardReputation} Reputação</span>
                  <span className="text-purple-400 font-bold">🔥 +{tournament.rewardHype} Hype</span>
                  <span className="text-yellow-300 font-bold">🥇 {tournament.trophyName}</span>
                </div>
              ) : (
                <div className="inline-flex flex-wrap gap-4 justify-center bg-neutral-950 p-4 rounded-xl border border-emerald-500/30 text-xs">
                  <span className="text-emerald-400 font-bold">
                    ⚡ Classificado para a {state.stageName === 'Quartas de Final' ? 'Semifinal' : 'Grande Final'}!
                  </span>
                  <span className="text-amber-400 font-bold">🔥 Chave Oficial Atualizada</span>
                </div>
              )
            )}

            <div>
              <button
                type="button"
                onClick={() => onFightComplete(state)}
                className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black uppercase text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
              >
                {state.winner === 'player' && state.stageName !== 'Grande Final'
                  ? 'Avançar na Chave do Torneio'
                  : 'Voltar aos Campeonatos'}
              </button>
            </div>
          </div>
        )}

        {/* Active Combat Action Buttons (Player Controls) */}
        {!state.isFightOver && !state.isBetweenRounds && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
            {/* Category Filter Pills */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-amber-400" /> Escolha seu Golpe / Movimento:
              </span>
              <div className="flex gap-1.5 overflow-x-auto py-1">
                {(['todos', 'soco', 'chute', 'queda', 'finalizacao', 'defesa', 'floreio'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-amber-500 text-neutral-950 font-black'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {lastActionFeedback && (
              <div className="text-xs font-bold text-amber-400 bg-amber-950/60 p-2 rounded-lg border border-amber-500/30 text-center animate-pulse">
                {lastActionFeedback}
              </div>
            )}

            {/* Action Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {filteredMoves.map((m) => {
                const canAfford = player.stamina >= m.staminaCost;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={!canAfford}
                    onClick={() => handleMoveClick(m)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      canAfford
                        ? 'border-neutral-800 bg-neutral-850 hover:border-amber-500 hover:bg-neutral-800 shadow-xs'
                        : 'border-neutral-800/40 bg-neutral-900/40 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-black text-sm text-white group-hover:text-amber-400">{m.name}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                          {m.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-tight">{m.description}</p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-red-400 font-bold">Dano: {m.damage}</span>
                      <span className="text-cyan-400 font-bold">Gás: -{m.staminaCost}</span>
                      <span className="text-neutral-400">Precisão: {m.accuracy}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
