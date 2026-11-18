import { CombatState, FightFighter, Move, Tournament, CombatPosition } from '../types/game';
import { sounds } from './audio';

export function createInitialCombatState(
  tournament: Tournament,
  playerFighter: FightFighter,
  opponentFighter: FightFighter,
  stageName: string = 'Quartas de Final'
): CombatState {
  return {
    isActive: true,
    tournament,
    stageName,
    round: 1,
    totalRounds: tournament.rounds,
    roundTimeRemaining: tournament.roundDurationSeconds,
    position: 'em_pe',
    player: playerFighter,
    opponent: opponentFighter,
    log: [
      {
        id: 'start_1',
        text: `🥋 Início do combate: ${tournament.name} (${stageName}) sob regras oficiais da ${tournament.organization}!`,
        type: 'info'
      },
      {
        id: 'start_2',
        text: `🔔 Árbitro central dá o sinal: COMBATE INICIADO! Respeitem as regras e toquem as luvas!`,
        type: 'referee'
      }
    ],
    judgeScores: [],
    isPausedForReaction: false,
    isBetweenRounds: false,
    cornerAdviceAvailable: false,
    isFightOver: false,
    winner: null,
    winMethod: null
  };
}

export interface TurnResult {
  nextState: CombatState;
  soundToPlay?: 'punch' | 'heavy_punch' | 'whoosh' | 'whistle' | 'bell' | 'cheer';
}

export function executePlayerMove(state: CombatState, move: Move): TurnResult {
  if (state.isFightOver || state.isBetweenRounds || state.isPausedForReaction) {
    return { nextState: state };
  }

  const s = JSON.parse(JSON.stringify(state)) as CombatState;
  const p = s.player;
  const o = s.opponent;
  let sound: 'punch' | 'heavy_punch' | 'whoosh' | 'whistle' | 'bell' | 'cheer' = 'punch';

  // Consume stamina
  const staminaDrain = Math.max(4, move.staminaCost - Math.floor(p.attributes.stamina / 12));
  p.stamina = Math.max(0, p.stamina - staminaDrain);

  // Time ticks down
  s.roundTimeRemaining = Math.max(0, s.roundTimeRemaining - 15);

  // Accuracy calculation based on technique vs opponent speed
  const hitChance = Math.min(95, Math.max(25, move.accuracy + (p.attributes.technique - o.attributes.speed) * 0.8));
  const isHit = Math.random() * 100 <= hitChance;

  if (!isHit) {
    sound = 'whoosh';
    s.log.unshift({
      id: `miss_${Date.now()}`,
      text: `${p.name} tentou aplicar ${move.name}, mas ${o.name} esquivou com rapidez de reflexos!`,
      type: 'info'
    });
  } else {
    // It hit!
    const isCritical = Math.random() * 100 < (p.attributes.fightIq * 0.35 + 5);
    const damageMultiplier = isCritical ? 1.5 : 1.0;
    const baseDamage = move.damage * damageMultiplier;
    const defenseFactor = Math.max(0.4, 1 - (o.attributes.durability * 0.006));
    const effectiveDamage = Math.round(baseDamage * defenseFactor);

    sound = effectiveDamage > 25 ? 'heavy_punch' : 'punch';

    // Apply HP or Guard damage
    if (o.guard > 20 && move.type === 'strike') {
      const guardDamage = Math.min(o.guard, Math.round(effectiveDamage * 0.8));
      o.guard -= guardDamage;
      const chipDamage = Math.round(effectiveDamage * 0.3);
      o.hp = Math.max(0, o.hp - chipDamage);
      s.log.unshift({
        id: `hit_guard_${Date.now()}`,
        text: `${p.name} conecta ${move.name} firme na guarda de ${o.name}! (Dano: ${chipDamage} | Guarda restante: ${o.guard}%)`,
        type: 'hit'
      });
    } else {
      o.hp = Math.max(0, o.hp - effectiveDamage);
      s.log.unshift({
        id: `hit_clean_${Date.now()}`,
        text: `${p.name} acertou em cheio ${move.name}! ${isCritical ? '💥 GOLPE CRÍTICO DEVASTADOR!' : ''} (-${effectiveDamage} HP)`,
        type: isCritical ? 'knockdown' : 'hit'
      });
    }

    // Ruleset specific mechanics:
    handleRulesetMechanics(s, p, o, move, true);
  }

  // Check victory conditions immediately after player hit
  checkFightEndConditions(s);
  if (s.isFightOver) {
    return { nextState: s, soundToPlay: 'cheer' };
  }

  // If fight didn't end and clock still running, opponent counter-attacks!
  executeOpponentTurn(s);

  // Check victory after opponent's turn
  checkFightEndConditions(s);

  // Check round end
  if (s.roundTimeRemaining <= 0 && !s.isFightOver) {
    advanceRound(s);
    sound = 'bell';
  }

  return { nextState: s, soundToPlay: sound };
}

function handleRulesetMechanics(s: CombatState, attacker: FightFighter, defender: FightFighter, move: Move, isPlayerAttacker: boolean) {
  const rules = s.tournament.rulesType;

  // 1. JUDÔ: Ippon Seoi Nage ou queda perfeita = IPPON direto!
  if (rules === 'judo_ippon') {
    if (move.id === 'judo_ippon_seoi_nage' || (move.type === 'takedown' && Math.random() < 0.35)) {
      attacker.points = 10; // Ippon
      s.log.unshift({
        id: `ippon_${Date.now()}`,
        text: `🥋 IPPON HISTÓRICO! ${attacker.name} projetou ${defender.name} com as costas inteiras no tatame com força e controle perfeitos! FIM DE LUTA!`,
        type: 'point'
      });
      s.isFightOver = true;
      s.winner = isPlayerAttacker ? 'player' : 'opponent';
      s.winMethod = 'Ippon';
      return;
    } else if (move.type === 'takedown' || move.category === 'queda') {
      attacker.points += 1; // Waza-ari
      s.log.unshift({
        id: `wazaari_${Date.now()}`,
        text: `🥋 WAZA-ARI assinalado pelos árbitros para ${attacker.name}! (Dois Waza-aris equivalem a Ippon!)`,
        type: 'point'
      });
      if (attacker.points >= 2) {
        s.log.unshift({
          id: `wazaari_ippon_${Date.now()}`,
          text: `🥋 WAZA-ARI AWASETE IPPON! Segundo waza-ari encerra a disputa de Judô!`,
          type: 'point'
        });
        s.isFightOver = true;
        s.winner = isPlayerAttacker ? 'player' : 'opponent';
        s.winMethod = 'Ippon';
        return;
      }
    }
  }

  // 2. JIU-JITSU BRASILEIRO (CBJJ & IBJJF): Regras Oficiais de Pontuação
  if (rules === 'bjj_points') {
    if (move.id === 'bjj_montada_completa' || move.id === 'bjj_pegada_costas') {
      attacker.points += 4;
      s.position = move.id === 'bjj_montada_completa' ? 'chao_montada' : 'chao_costas';
      s.log.unshift({
        id: `bjj_pts4_${Date.now()}`,
        text: `🥋 Árbitro da CBJJ/IBJJF aponta 4 dedos ao alto: +4 PONTOS para ${attacker.name} por ${move.name} estabilizada por 3s!`,
        type: 'point'
      });
    } else if (move.id.includes('passagem')) {
      attacker.points += 3;
      s.position = 'chao_montada';
      s.log.unshift({
        id: `bjj_pts3_${Date.now()}`,
        text: `🥋 +3 PONTOS para ${attacker.name} por Passagem de Guarda e controle lateral estabilizado!`,
        type: 'point'
      });
    } else if (move.id === 'bjj_joelho_barriga') {
      attacker.points += 2;
      s.log.unshift({
        id: `bjj_pts2_knee_${Date.now()}`,
        text: `🥋 +2 PONTOS para ${attacker.name} por Joelho na Barriga! Postura ereta e base firme!`,
        type: 'point'
      });
    } else if (move.id.includes('raspagem') || move.id === 'bjj_berimbolo') {
      attacker.points += 2;
      s.log.unshift({
        id: `bjj_pts2_sweep_${Date.now()}`,
        text: `🥋 +2 PONTOS de Raspagem assinalados para ${attacker.name}! Inversão de guarda perfeita!`,
        type: 'point'
      });
    } else if (move.type === 'takedown') {
      attacker.points += 2;
      s.log.unshift({
        id: `bjj_pts2_take_${Date.now()}`,
        text: `🥋 +2 PONTOS de Queda concedidos a ${attacker.name}! Projeção com queda de costas no tatame!`,
        type: 'point'
      });
    }

    // Submission check
    if (move.type === 'submission') {
      const subSuccessRate = (attacker.attributes.technique * 1.2) - (defender.attributes.durability * 0.6) - (defender.stamina * 0.3);
      if (Math.random() * 100 < Math.max(30, subSuccessRate)) {
        s.log.unshift({
          id: `sub_win_${Date.now()}`,
          text: `💥 BATEU! ${defender.name} deu três tapinhas no tatame em desistência verbal! Finalização espetacular por ${move.name}!`,
          type: 'submission'
        });
        s.isFightOver = true;
        s.winner = isPlayerAttacker ? 'player' : 'opponent';
        s.winMethod = 'Finalização';
      } else {
        attacker.advantages += 1;
        s.log.unshift({
          id: `sub_adv_${Date.now()}`,
          text: `🥋 ${defender.name} defendeu a chave no limite do braço! Árbitro assinala VANTAGEM para ${attacker.name}!`,
          type: 'point'
        });
      }
    }
  }

  // 3. KARATÊ OLÍMPICO (WKF & CBK: IPPON 3 pts, WAZA-ARI 2 pts, YUKO 1 pt)
  if (rules === 'karate_wkf') {
    if (move.id === 'karate_jodan_mawashi' || move.id === 'karate_ura_mawashi' || move.id === 'karate_varredura_gyaku') {
      attacker.points += 3;
      s.log.unshift({
        id: `wkf_ippon_${Date.now()}`,
        text: `🥋 IPPON WKF (+3 PONTOS)! ${attacker.name} conectou ${move.name} com Kime explosivo e Zanshin impecável! Árbitro central ergue o braço a 45º!`,
        type: 'point'
      });
    } else if (move.id === 'karate_mae_geri' || move.id === 'karate_chudan_mawashi' || move.id === 'karate_ushiro_geri') {
      attacker.points += 2;
      s.log.unshift({
        id: `wkf_wazaari_${Date.now()}`,
        text: `🥋 WAZA-ARI WKF (+2 PONTOS) para ${attacker.name} por chute certeiro de tronco (${move.name})! Bandeiras laterais levantadas!`,
        type: 'point'
      });
    } else if (move.id === 'karate_kime_zanshin') {
      attacker.guard = Math.min(100, attacker.guard + 25);
      attacker.points += 1;
      s.log.unshift({
        id: `wkf_zanshin_${Date.now()}`,
        text: `⛩️ KIME & ZANSHIN! ${attacker.name} demonstra postura de serenidade marcial inabalável e foco absoluto! Recupera a guarda!`,
        type: 'info'
      });
    } else if (move.category === 'esquiva') {
      attacker.guard = Math.min(100, attacker.guard + 20);
      s.log.unshift({
        id: `wkf_uke_${Date.now()}`,
        text: `🥋 DEFESA TÉCNICA (${move.name})! Bloqueio clássico que desvia a trajetória do golpe adversário!`,
        type: 'info'
      });
    } else {
      attacker.points += 1;
      s.log.unshift({
        id: `wkf_yuko_${Date.now()}`,
        text: `🥋 YUKO WKF (+1 PONTO) para ${attacker.name} por soco direto pontual (${move.name})!`,
        type: 'point'
      });
    }

    // Regra dos 8 pontos de diferença no Karatê WKF
    if (Math.abs(attacker.points - defender.points) >= 8) {
      s.log.unshift({
        id: `wkf_mercy_${Date.now()}`,
        text: `🥋 DIFERENÇA DE 8 PONTOS! Combate encerrado por Superioridade Técnica no Karatê WKF!`,
        type: 'point'
      });
      s.isFightOver = true;
      s.winner = isPlayerAttacker ? 'player' : 'opponent';
      s.winMethod = 'Superioridade Técnica';
    }
  }

  // 4. LUTA LIVRE ESPORTIVA (CBLLE): Quedas, Pontuação e Finalizações Sem Quimono
  if (rules === 'lutalivre_sub') {
    if (move.id === 'lutalivre_suplex') {
      attacker.points += 4;
      s.log.unshift({
        id: `lle_pts4_${Date.now()}`,
        text: `🤼 SUPLÊ DA LUTA LIVRE! Queda de grande amplitude sem quimono: 4 PONTOS para ${attacker.name}!`,
        type: 'point'
      });
    } else if (move.type === 'takedown') {
      attacker.points += 2;
      s.log.unshift({
        id: `lle_pts2_${Date.now()}`,
        text: `🤼 Baiana / Takedown de Luta Livre confirmado! +2 PONTOS para ${attacker.name}!`,
        type: 'point'
      });
    }

    if (move.type === 'submission' || move.id === 'lutalivre_guilhotina' || move.id === 'lutalivre_chave_calcanhar') {
      s.log.unshift({
        id: `lle_sub_win_${Date.now()}`,
        text: `🥋 FINALIZAÇÃO CIRÚRGICA NA LUTA LIVRE! ${defender.name} bateu em desistência imediata! FIM DE LUTA!`,
        type: 'submission'
      });
      s.isFightOver = true;
      s.winner = isPlayerAttacker ? 'player' : 'opponent';
      s.winMethod = 'Finalização';
    }
  }

  // 5. CAPOEIRA RODA (CBC - Confederação Brasileira de Capoeira): Pontuação, Rasteiras e Floreios
  if (rules === 'capoeira_roda') {
    if (move.id === 'capoeira_meia_lua_compasso') {
      attacker.points += 3;
      s.log.unshift({
        id: `cap_mlc_${Date.now()}`,
        text: `🪢 MEIA-LUA DE COMPASSO MAGISTRAL! Calcanhar de ${attacker.name} atingiu com força de 360°! +3 PONTOS NA RODA!`,
        type: 'point'
      });
    } else if (move.category === 'queda' || move.id === 'capoeira_rasteira' || move.id === 'capoeira_vingativa' || move.id === 'capoeira_tesoura_chao') {
      attacker.points += 2;
      defender.guard = Math.max(0, defender.guard - 25);
      s.log.unshift({
        id: `cap_rasteira_${Date.now()}`,
        text: `🪢 DERRUBADA LIMPA NA RODA! ${attacker.name} puxou a perna de apoio com ${move.name}! +2 PONTOS DE MALANDRAGEM!`,
        type: 'point'
      });
    } else if (move.category === 'floreio') {
      attacker.points += 1;
      attacker.guard = Math.min(100, attacker.guard + 15);
      s.log.unshift({
        id: `cap_floreio_${Date.now()}`,
        text: `🤸 FLOREIO PLÁSTICO! ${attacker.name} executou ${move.name} com visão no oponente, negando o corpo e cadenciando o jogo (+1 Ponto)!`,
        type: 'point'
      });
    } else if (move.category === 'esquiva') {
      attacker.guard = Math.min(100, attacker.guard + 20);
      s.log.unshift({
        id: `cap_esquiva_${Date.now()}`,
        text: `🪢 ESQUIVA PERFEITA! ${attacker.name} usou ${move.name} saindo rente ao chão da linha de golpe!`,
        type: 'info'
      });
    } else {
      attacker.points += 1;
    }
  }

  // 6. BOXE OLÍMPICO & PROFISSIONAL (10-Point Must System - CBBoxe, World Boxing & WBC)
  if (rules === 'boxing_10must') {
    if (move.id === 'boxe_gancho_figado') {
      attacker.points += 2;
      defender.stamina = Math.max(0, defender.stamina - 35);
      defender.guard = Math.max(0, defender.guard - 40);
      s.log.unshift({
        id: `boxe_liver_${Date.now()}`,
        text: `🥊 GOLPE NO FÍGADO DEVASTADOR! ${move.name} de ${attacker.name} atingiu a costela flutuante! O nervo vago colapsou, drenando todo o oxigênio de ${defender.name}!`,
        type: 'hit'
      });
      // Chance alta de knockdown por golpe no fígado
      if (Math.random() < 0.45 && defender.hp < 45) {
        defender.knockdowns += 1;
        s.log.unshift({
          id: `boxe_liver_kd_${Date.now()}`,
          text: `🚨 QUEDA PELO FÍGADO! ${defender.name} desabou de joelhos sem ar! Árbitro abre a contagem protetora de 10 segundos!`,
          type: 'knockdown'
        });
      }
    } else if (move.id === 'boxe_check_hook') {
      attacker.points += 2;
      defender.guard = Math.max(0, defender.guard - 25);
      s.log.unshift({
        id: `boxe_check_${Date.now()}`,
        text: `🥊 CHECK HOOK MAGISTRAL! ${attacker.name} pivotou 90º e pegou ${defender.name} colidindo no contra-ataque! Juízes anotam ponto limpo!`,
        type: 'point'
      });
    } else if (move.id === 'boxe_philly_shell') {
      attacker.guard = Math.min(100, attacker.guard + 25);
      s.log.unshift({
        id: `boxe_shell_${Date.now()}`,
        text: `🛡️ PHILLY SHELL IMPECÁVEL! ${attacker.name} rolou o golpe no ombro esquerdo com queixo protegido, frustrando o ataque adversário!`,
        type: 'info'
      });
    } else if (move.id === 'boxe_contragolpe_encontro') {
      attacker.points += 2;
      s.log.unshift({
        id: `boxe_counter_${Date.now()}`,
        text: `💥 DIRETO DE ENCONTRO NO QUEIXO! Velocidade dobrada pelo choque de massas! Impacto monumental de ${attacker.name}!`,
        type: 'knockdown'
      });
    } else if (move.id === 'boxe_clinch_tatico') {
      attacker.stamina = Math.min(100, attacker.stamina + 18);
      s.log.unshift({
        id: `boxe_clinch_${Date.now()}`,
        text: `🥊 CLINCH TÁTICO NAS CORDAS! ${attacker.name} travou os braços do oponente até a ordem de "Break!" do árbitro, recuperando o fôlego!`,
        type: 'info'
      });
    } else if (move.id === 'boxe_um_dois' || move.id === 'boxe_cruzado_duplo') {
      attacker.points += 2;
      s.log.unshift({
        id: `boxe_combo_${Date.now()}`,
        text: `🥊 COMBINAÇÃO LIMPA CONECTADA! Dois golpes retos contundentes na face de ${defender.name}! Pontuação clara nos cartões!`,
        type: 'point'
      });
    } else {
      attacker.points += 1;
    }
  }

  // 7. MUAY THAI TRADICIONAL (WMC / Estádios de Bangkok): Pontuação de Tíbias, Joelhos, Clinch e Cotoveladas
  if (rules === 'muaythai_5r') {
    if (move.id === 'mt_dumping_clinch' || move.id === 'mt_catch_and_sweep') {
      attacker.points += 3;
      defender.guard = Math.max(0, defender.guard - 30);
      s.log.unshift({
        id: `mt_dump_${Date.now()}`,
        text: `🥊 DUMPING DE CLASIFICADO! ${attacker.name} usou o giro de tronco e jogou ${defender.name} de costas na lona com estrondo! Juízes tailandeses vibram: +3 PONTOS!`,
        type: 'point'
      });
    } else if (move.id.startsWith('mt_kao')) {
      attacker.points += 2;
      defender.stamina = Math.max(0, defender.stamina - 15);
      s.log.unshift({
        id: `mt_knee_${Date.now()}`,
        text: `🥊 JOELHADA CONTUNDENTE! ${attacker.name} cravou ${move.name} no corpo! Árbitros de Bangkok pontuam alto (+2 Pts) e drenam o gás do rival!`,
        type: 'point'
      });
    } else if (move.id.startsWith('mt_sok')) {
      attacker.points += 2;
      // Chance de corte profundo de cotovelo
      if (Math.random() < 0.40) {
        defender.guard = Math.max(0, defender.guard - 35);
        s.log.unshift({
          id: `mt_cut_${Date.now()}`,
          text: `🩸 CORTE PROFUNDO DE COTOVELO! ${move.name} de ${attacker.name} abriu o supercílio de ${defender.name}! Sangue escorre e o árbitro checa com o médico do ringue!`,
          type: 'knockdown'
        });
      }
    } else if (move.id === 'mt_te_chiang' || move.id === 'mt_te_kankro') {
      attacker.points += 2;
      s.log.unshift({
        id: `mt_kick_${Date.now()}`,
        text: `🥊 CHUTE LIMPO DE CANELA! Tíbia estala no alvo com som de chicote! Ponto limpo para ${attacker.name}!`,
        type: 'point'
      });
    } else if (move.id === 'mt_wai_kru') {
      attacker.points += 1;
      attacker.guard = Math.min(100, attacker.guard + 25);
      attacker.stamina = Math.min(100, attacker.stamina + 15);
      s.log.unshift({
        id: `mt_wai_${Date.now()}`,
        text: `🙏 WAI KRU RAM MUAY SAGRADO! ${attacker.name} reverencia os mestres ancestrais ao som da flauta Pi Java, elevando a compostura e o foco mental!`,
        type: 'info'
      });
    } else if (move.id === 'mt_blok_kha') {
      attacker.guard = Math.min(100, attacker.guard + 20);
      s.log.unshift({
        id: `mt_blok_${Date.now()}`,
        text: `🛡️ BLOK KHA! Bloqueio de canela a 45º protege o lutador e devolve impacto ósseo ao atacante!`,
        type: 'info'
      });
    } else {
      attacker.points += 1;
    }
  }

  // 7. BOXE / MUAY THAI / MMA: Knockdowns
  if (rules === 'boxing_10must' || rules === 'muaythai_5r' || rules === 'mma_unified') {
    if (defender.hp <= 20 && Math.random() < 0.4) {
      defender.knockdowns += 1;
      s.log.unshift({
        id: `knockdown_${Date.now()}`,
        text: `🚨 KNOCKDOWN! ${defender.name} foi à lona desorientado! Árbitro abre a contagem protetora de 10 segundos!`,
        type: 'knockdown'
      });
      if (defender.knockdowns >= 3) {
        s.log.unshift({
          id: `tko_3kd_${Date.now()}`,
          text: `🛑 REGRA DOS 3 KNOCKDOWNS! Árbitro encerra o combate para proteger a integridade do atleta! Vitória por TKO!`,
          type: 'referee'
        });
        s.isFightOver = true;
        s.winner = isPlayerAttacker ? 'player' : 'opponent';
        s.winMethod = 'TKO';
      }
    }
  }
}

function executeOpponentTurn(s: CombatState) {
  const p = s.player;
  const o = s.opponent;

  // AI chooses behavior based on attributes and current state
  const aiActions = [
    { name: 'Soco Direto de Resposta', damage: 18, type: 'strike' as const, category: 'soco' as const },
    { name: 'Chute Baixo na Perna (Low Kick)', damage: 22, type: 'strike' as const, category: 'chute' as const },
    { name: 'Tentativa de Queda / Takedown', damage: 16, type: 'takedown' as const, category: 'queda' as const },
    { name: 'Pressão e Combinação Cruzada', damage: 26, type: 'strike' as const, category: 'soco' as const }
  ];

  const chosenAction = aiActions[Math.floor(Math.random() * aiActions.length)];
  const hitChance = Math.min(85, Math.max(30, 65 + (o.attributes.technique - p.attributes.speed) * 0.7));

  // Stamina drain on opponent
  o.stamina = Math.max(0, o.stamina - 10);

  if (Math.random() * 100 > hitChance) {
    s.log.unshift({
      id: `opp_miss_${Date.now()}`,
      text: `${o.name} avançou com ${chosenAction.name}, mas você leu o movimento e defendeu com maestria!`,
      type: 'info'
    });
  } else {
    // Hits player!
    const baseDamage = Math.round(chosenAction.damage * (1 + o.attributes.strength * 0.015));
    const defense = Math.max(0.4, 1 - (p.attributes.durability * 0.007));
    const takenDamage = Math.round(baseDamage * defense);

    if (p.guard > 20) {
      const guardAbsorb = Math.min(p.guard, takenDamage);
      p.guard -= guardAbsorb;
      const chip = Math.round(takenDamage * 0.35);
      p.hp = Math.max(0, p.hp - chip);
      s.log.unshift({
        id: `opp_guard_${Date.now()}`,
        text: `${o.name} golpeia com ${chosenAction.name} na sua guarda fechada (-${chip} HP | Guarda: ${p.guard}%)`,
        type: 'damage'
      });
    } else {
      p.hp = Math.max(0, p.hp - takenDamage);
      s.log.unshift({
        id: `opp_clean_${Date.now()}`,
        text: `⚠️ Atenção! ${o.name} conectou ${chosenAction.name} no seu corpo! (-${takenDamage} HP)`,
        type: 'damage'
      });
    }

    // Ruleset evaluation for opponent
    const mockMove: Move = {
      id: 'opp_move',
      name: chosenAction.name,
      art: o.art,
      type: chosenAction.type,
      category: chosenAction.category,
      damage: chosenAction.damage,
      staminaCost: 10,
      accuracy: 70,
      minBeltIndex: 0,
      description: '',
      isUnlocked: true,
      masteryLevel: 1
    };
    handleRulesetMechanics(s, o, p, mockMove, false);
  }
}

function checkFightEndConditions(s: CombatState) {
  if (s.isFightOver) return;

  // 1. KO check
  if (s.opponent.hp <= 0) {
    s.log.unshift({
      id: `ko_player_win_${Date.now()}`,
      text: `🔥 NOCAUTE BRUTAL! ${s.opponent.name} desaba no tatame sem condições de continuar! VITÓRIA SENSACIONAL POR KO!`,
      type: 'knockdown'
    });
    s.isFightOver = true;
    s.winner = 'player';
    s.winMethod = 'KO';
    return;
  }

  if (s.player.hp <= 0) {
    s.log.unshift({
      id: `ko_player_loss_${Date.now()}`,
      text: `💀 Você foi atingido por um golpe decisivo e não conseguiu levantar antes da contagem... Derrota por Nocaute.`,
      type: 'knockdown'
    });
    s.isFightOver = true;
    s.winner = 'opponent';
    s.winMethod = 'KO';
    return;
  }
}

function advanceRound(s: CombatState) {
  // Score the completed round
  let pRoundScore = 10;
  let oRoundScore = 9;

  if (s.tournament.rulesType === 'boxing_10must' || s.tournament.rulesType === 'mma_unified' || s.tournament.rulesType === 'muaythai_5r') {
    if (s.opponent.hp < s.player.hp) {
      pRoundScore = 10;
      oRoundScore = s.opponent.knockdowns > 0 ? 8 : 9;
      s.player.roundsWon += 1;
    } else {
      pRoundScore = s.player.knockdowns > 0 ? 8 : 9;
      oRoundScore = 10;
      s.opponent.roundsWon += 1;
    }

    s.judgeScores.push({
      round: s.round,
      playerScore: pRoundScore,
      opponentScore: oRoundScore
    });

    s.log.unshift({
      id: `round_score_${Date.now()}`,
      text: `📋 Fim do Round ${s.round}! Cartões dos juízes laterais: Você ${pRoundScore} x ${oRoundScore} ${s.opponent.name}.`,
      type: 'referee'
    });
  }

  if (s.round >= s.totalRounds) {
    // Fight reached final time limit! Decide by points / cards
    decideByPoints(s);
  } else {
    // Proceed to corner rest
    s.round += 1;
    s.roundTimeRemaining = s.tournament.roundDurationSeconds;
    s.isBetweenRounds = true;
    s.cornerAdviceAvailable = true;
    s.log.unshift({
      id: `corner_break_${Date.now()}`,
      text: `🔔 GONGO! Intervalo de 1 minuto! Vá para o córner descansar, beber água e ouvir as instruções do treinador!`,
      type: 'info'
    });
  }
}

function decideByPoints(s: CombatState) {
  s.isFightOver = true;
  const rules = s.tournament.rulesType;

  if (rules === 'bjj_points' || rules === 'karate_wkf' || rules === 'lutalivre_sub') {
    if (s.player.points > s.opponent.points) {
      s.winner = 'player';
      s.winMethod = 'Pontos';
      s.log.unshift({
        id: `points_win_${Date.now()}`,
        text: `🏆 VITÓRIA POR PONTOS! Você acumulou ${s.player.points} pontos contra ${s.opponent.points} do rival!`,
        type: 'point'
      });
    } else if (s.player.points < s.opponent.points) {
      s.winner = 'opponent';
      s.winMethod = 'Pontos';
      s.log.unshift({
        id: `points_loss_${Date.now()}`,
        text: `Derrota por pontos: ${s.opponent.name} venceu por ${s.opponent.points} a ${s.player.points}.`,
        type: 'info'
      });
    } else {
      // Tie breaker by advantages or coin
      if (s.player.advantages >= s.opponent.advantages) {
        s.winner = 'player';
        s.winMethod = 'Pontos';
        s.log.unshift({
          id: `adv_win_${Date.now()}`,
          text: `🏆 EMPATE EM PONTOS! Você venceu nos critérios de desempate por Vantagens da federação!`,
          type: 'point'
        });
      } else {
        s.winner = 'opponent';
        s.winMethod = 'Pontos';
        s.log.unshift({
          id: `adv_loss_${Date.now()}`,
          text: `Derrota por decisão de vantagens dos juízes.`,
          type: 'info'
        });
      }
    }
  } else {
    // 10-Point Must rounds sum
    const playerTotal = s.judgeScores.reduce((acc, curr) => acc + curr.playerScore, 0);
    const opponentTotal = s.judgeScores.reduce((acc, curr) => acc + curr.opponentScore, 0);

    if (playerTotal > opponentTotal) {
      s.winner = 'player';
      s.winMethod = 'Pontos';
      s.log.unshift({
        id: `decision_win_${Date.now()}`,
        text: `🏆 DECISÃO UNÂNIME DOS JUÍZES! Vitória sua no somatório dos rounds (${playerTotal} a ${opponentTotal})!`,
        type: 'referee'
      });
    } else if (playerTotal < opponentTotal) {
      s.winner = 'opponent';
      s.winMethod = 'Pontos';
      s.log.unshift({
        id: `decision_loss_${Date.now()}`,
        text: `Decisão unânime a favor de ${s.opponent.name} (${opponentTotal} a ${playerTotal}).`,
        type: 'referee'
      });
    } else {
      s.winner = 'draw';
      s.winMethod = 'Pontos';
      s.log.unshift({
        id: `decision_draw_${Date.now()}`,
        text: `EMPATE MAJORITÁRIO nos cartões dos juízes! Uma batalha memorável!`,
        type: 'referee'
      });
    }
  }
}

export function applyCornerRest(state: CombatState, strategy: 'agressivo' | 'estrategico' | 'recuperar'): CombatState {
  const s = JSON.parse(JSON.stringify(state)) as CombatState;
  
  // Cutman and water restores stamina and some HP
  s.player.stamina = Math.min(s.player.maxStamina, s.player.stamina + 40);
  s.player.guard = 100;
  s.opponent.stamina = Math.min(s.opponent.maxStamina, s.opponent.stamina + 35);
  s.opponent.guard = 100;

  if (strategy === 'recuperar') {
    s.player.hp = Math.min(s.player.maxHp, s.player.hp + 25);
    s.log.unshift({
      id: `corner_heal_${Date.now()}`,
      text: `🧊 Córner: O cutman aplicou vaselina e gelo nos hematomas. Você recuperou o fôlego e estabilizou!`,
      type: 'info'
    });
  } else if (strategy === 'agressivo') {
    s.player.attributes.strength += 2;
    s.log.unshift({
      id: `corner_aggro_${Date.now()}`,
      text: `🗣️ Mestre gritou no ouvido: "Não deixa ele respirar! Anda pra frente e solta os cruzados!" (+Força temporária)`,
      type: 'info'
    });
  } else {
    s.player.attributes.fightIq += 2;
    s.log.unshift({
      id: `corner_smart_${Date.now()}`,
      text: `🧠 Mestre instruiu: "Ele está baixando a mão esquerda na saída do golpe. Espere o contragolpe!" (+QI de Luta)`,
      type: 'info'
    });
  }

  s.isBetweenRounds = false;
  s.cornerAdviceAvailable = false;
  sounds.playBell();
  return s;
}
