/**
 * CAMINHO DO GUERREIRO: DO TATAME AO OCTÓGONO
 * Módulo Especializado de Jiu-Jitsu Brasileiro (BJJ) — Fase 1: Catálogo Estruturado de Posições
 *
 * Contém o catálogo canônico completo das 47 posições fundamentais de BJJ,
 * suas características mecânicas, orientações corporais, pegadas primárias
 * e grafo de transições válidas entre posições.
 */

import {
  BjjPosition,
  BjjPositionId,
  BjjPositionCategory,
  BjjCatalogValidationReport
} from '../types/bjjCombat';

export const BJJ_POSITIONS_CATALOG: Record<BjjPositionId, BjjPosition> = {
  // =========================================================================
  // A. EM PÉ (9 posições)
  // =========================================================================

  stand_neutral: {
    id: 'stand_neutral',
    name: 'Em Pé Neutro',
    category: 'em_pe',
    nature: 'neutra',
    stability: 'alta',
    athleteTop: 'none',
    athleteBottom: 'none',
    controllingAthlete: 'none',
    controlledAthlete: 'none',
    advantage: 'neutral',
    orientationAthleteA: 'em_pe',
    orientationAthleteB: 'em_pe',
    primaryGrips: 'nenhuma',
    validTransitions: [
      'stand_grip_fight',
      'stand_collar_control',
      'stand_sleeve_control',
      'stand_clinch',
      'guard_open',
      'guard_closed'
    ],
    description: 'Ambos os atletas em pé na base de combate, medindo distância sem contato manual ou pegadas ativas no quimono.',
    tacticalNotes: 'Início padrão da disputa. Permite puxadas imediatas para a guarda ou aproximação para disputa de pegadas.'
  },

  stand_grip_fight: {
    id: 'stand_grip_fight',
    name: 'Disputa de Pegadas',
    category: 'em_pe',
    nature: 'transitoria',
    stability: 'baixa',
    athleteTop: 'none',
    athleteBottom: 'none',
    controllingAthlete: 'none',
    controlledAthlete: 'none',
    advantage: 'contested',
    orientationAthleteA: 'inclinado_frente',
    orientationAthleteB: 'inclinado_frente',
    primaryGrips: 'disputa_aberta',
    validTransitions: [
      'stand_neutral',
      'stand_collar_control',
      'stand_sleeve_control',
      'stand_clinch',
      'stand_takedown_threat',
      'guard_open',
      'guard_seated'
    ],
    description: 'Troca ativa de estocadas de pegada, defesas de mãos e quebras de empunhadura no quimono antes do controle efetivo.',
    tacticalNotes: 'Posição de alta exigência reflexiva e gasto de estamina de antebraço. Quem vencer as pegadas dita a iniciativa da queda ou puxada.'
  },

  stand_collar_control: {
    id: 'stand_collar_control',
    name: 'Controle de Gola em Pé',
    category: 'em_pe',
    nature: 'dominante',
    stability: 'media',
    athleteTop: 'none',
    athleteBottom: 'none',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'em_pe',
    orientationAthleteB: 'inclinado_frente',
    primaryGrips: 'gola_cruzada',
    validTransitions: [
      'stand_grip_fight',
      'stand_sleeve_control',
      'stand_front_headlock',
      'stand_takedown_threat',
      'guard_closed',
      'guard_de_la_riva',
      'guard_open'
    ],
    description: 'Atleta A estabelece pegada profunda na gola cruzada de B, controlando sua postura e quebrando o alinhamento da coluna.',
    tacticalNotes: 'Base para projeções de quadril (Ippon Seoi Nage, Harai Goshi) ou puxadas diretas com pé na virilha.'
  },

  stand_sleeve_control: {
    id: 'stand_sleeve_control',
    name: 'Controle de Manga em Pé',
    category: 'em_pe',
    nature: 'dominante',
    stability: 'media',
    athleteTop: 'none',
    athleteBottom: 'none',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'em_pe',
    orientationAthleteB: 'em_pe',
    primaryGrips: 'manga_simples',
    validTransitions: [
      'stand_collar_control',
      'stand_grip_fight',
      'stand_takedown_threat',
      'guard_spider',
      'guard_open',
      'guard_de_la_riva'
    ],
    description: 'Atleta A domina a manga do braço dominante de B, neutralizando suas pegadas e preparando desequilíbrio (kuzushi).',
    tacticalNotes: 'Essencial para anular passadores fortes e preparar puxada direta para guarda aranha ou guarda aberta.'
  },

  stand_clinch: {
    id: 'stand_clinch',
    name: 'Clinch em Pé',
    category: 'em_pe',
    nature: 'transitoria',
    stability: 'baixa',
    athleteTop: 'none',
    athleteBottom: 'none',
    controllingAthlete: 'none',
    controlledAthlete: 'none',
    advantage: 'contested',
    orientationAthleteA: 'em_pe',
    orientationAthleteB: 'em_pe',
    primaryGrips: 'esgrima_simples',
    validTransitions: [
      'stand_body_lock',
      'stand_front_headlock',
      'stand_back_control',
      'stand_takedown_threat',
      'stand_grip_fight',
      'guard_closed'
    ],
    description: 'Corpos colados em disputa peito a peito por esgrimas axilares e controle de nuca.',
    tacticalNotes: 'Zona de choque de força e alavanca. Pode desembocar rapidamente em quedas de quadril, cinturada ou puxada de guarda fechada.'
  },

  stand_body_lock: {
    id: 'stand_body_lock',
    name: 'Abraço Corporal (Body Lock) em Pé',
    category: 'em_pe',
    nature: 'dominante',
    stability: 'alta',
    athleteTop: 'none',
    athleteBottom: 'none',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'em_pe',
    orientationAthleteB: 'em_pe',
    primaryGrips: 'body_lock_cinturado',
    validTransitions: [
      'stand_back_control',
      'stand_takedown_threat',
      'top_side_control',
      'top_mount',
      'trans_scramble'
    ],
    description: 'Atleta A trava os braços conectados ao redor da linha de cintura ou tronco de B, colando os quadris.',
    tacticalNotes: 'Domínio de alta alavanca no wrestling/bjj. Permite arremesso para trás, queda de gancho ou transição imediata para as costas.'
  },

  stand_front_headlock: {
    id: 'stand_front_headlock',
    name: 'Front Headlock em Pé',
    category: 'em_pe',
    nature: 'dominante',
    stability: 'media',
    athleteTop: 'none',
    athleteBottom: 'none',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'em_pe',
    orientationAthleteB: 'inclinado_frente',
    primaryGrips: 'front_headlock',
    validTransitions: [
      'stand_back_control',
      'top_turtle_control',
      'def_submission',
      'stand_grip_fight',
      'guard_closed'
    ],
    description: 'Atleta A envolve a cabeça de B sob a axila, mantendo o queixo trancado e a postura de B totalmente quebrada para baixo.',
    tacticalNotes: 'Ameaça constante de guilhotina em pé, rotação para as costas (go-behind) ou puxada de guarda travando o pescoço.'
  },

  stand_back_control: {
    id: 'stand_back_control',
    name: 'Controle das Costas em Pé',
    category: 'em_pe',
    nature: 'dominante',
    stability: 'alta',
    athleteTop: 'none',
    athleteBottom: 'none',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'em_pe',
    orientationAthleteB: 'em_pe',
    primaryGrips: 'cinto_seguranca',
    validTransitions: [
      'top_back_control',
      'stand_takedown_threat',
      'top_side_control',
      'stand_clinch',
      'trans_scramble'
    ],
    description: 'Atleta A se posiciona atrás de B, grampeando o tronco com pegada de cinto de segurança (seatbelt).',
    tacticalNotes: 'Posição de risco crítico para B. O atleta A pode puxar para as costas com ganchos na queda ou aplicar queda de mataleão.'
  },

  stand_takedown_threat: {
    id: 'stand_takedown_threat',
    name: 'Ameaça de Queda ou Desequilíbrio',
    category: 'em_pe',
    nature: 'transitoria',
    stability: 'muito_baixa',
    athleteTop: 'none',
    athleteBottom: 'none',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'inclinado_frente',
    orientationAthleteB: 'inclinado_frente',
    primaryGrips: 'gola_e_calca',
    validTransitions: [
      'top_side_control',
      'top_half_guard_control',
      'guard_open',
      'guard_half',
      'bottom_turtle',
      'trans_scramble',
      'stand_neutral'
    ],
    description: 'Atleta A dispara ataque de pernas (baiana/single-leg) ou projeção de quadril; B está em desequilíbrio e tentando sprawl.',
    tacticalNotes: 'Quadro dinâmico de 2 a 3 segundos que define a pontuação de queda (+2 pontos) ou aterrissagem em guarda/scramble.'
  },

  // =========================================================================
  // B. GUARDAS (16 posições)
  // Atleta A é canonicamente o guardeiro (por baixo)
  // Atleta B é canonicamente o passador (por cima)
  // =========================================================================

  guard_closed: {
    id: 'guard_closed',
    name: 'Guarda Fechada',
    category: 'guarda',
    nature: 'dominante',
    stability: 'alta',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'deitado_supino',
    orientationAthleteB: 'ajoelhado',
    primaryGrips: 'gola_e_manga',
    validTransitions: [
      'guard_open',
      'guard_half',
      'top_mount',
      'top_back_control',
      'top_side_control',
      'def_submission',
      'trans_reversal'
    ],
    description: 'Atleta A mantém as pernas cruzadas e travadas atrás das costas de B, que está ajoelhado entre elas.',
    tacticalNotes: 'Posição defensiva e ofensiva sólida. Força B a abrir a guarda antes de conseguir progredir para a passagem.'
  },

  guard_open: {
    id: 'guard_open',
    name: 'Guarda Aberta',
    category: 'guarda',
    nature: 'neutra',
    stability: 'media',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'none',
    controlledAthlete: 'none',
    advantage: 'neutral',
    orientationAthleteA: 'deitado_supino',
    orientationAthleteB: 'postura_alta',
    primaryGrips: 'gola_e_manga',
    validTransitions: [
      'guard_closed',
      'guard_butterfly',
      'guard_de_la_riva',
      'guard_spider',
      'guard_x',
      'top_passing_process',
      'trans_scramble'
    ],
    description: 'Atleta A no solo com pés nos quadris, bíceps ou coxas de B, que permanece em pé ou ajoelhado buscando ângulos de passagem.',
    tacticalNotes: 'Hub central das guardas dinâmicas modernas. Permite transições para De La Riva, Aranha, X e ataques rápidos de raspagem.'
  },

  guard_butterfly: {
    id: 'guard_butterfly',
    name: 'Guarda Borboleta',
    category: 'guarda',
    nature: 'neutra',
    stability: 'media',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'sentado',
    orientationAthleteB: 'ajoelhado',
    primaryGrips: 'esgrima_simples',
    validTransitions: [
      'guard_x',
      'guard_single_leg_x',
      'top_mount',
      'top_side_control',
      'top_passing_process',
      'trans_scramble'
    ],
    description: 'Atleta A sentado com ganchos internos dos pés nas coxas de B, dominando esgrima ou faixa.',
    tacticalNotes: 'Excepcional para raspagens de elevação rápida (raspagem borboleta), guilhotinas e transições fluidas para Guarda X.'
  },

  guard_half: {
    id: 'guard_half',
    name: 'Meia-Guarda',
    category: 'guarda',
    nature: 'neutra',
    stability: 'media',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'none',
    controlledAthlete: 'none',
    advantage: 'contested',
    orientationAthleteA: 'deitado_lateral',
    orientationAthleteB: 'ajoelhado',
    primaryGrips: 'esgrima_simples',
    validTransitions: [
      'guard_closed',
      'guard_deep_half',
      'guard_knee_shield',
      'top_half_guard_control',
      'top_side_control',
      'top_back_control',
      'trans_reversal'
    ],
    description: 'Atleta A laça e prende uma das pernas de B entre as suas pernas, disputando esgrima e controle de cabeça.',
    tacticalNotes: 'Batalha clássica de esgrima. Se A ganha a esgrima, pode ir para as costas ou raspar; se B ganha, amassa para o 100kg.'
  },

  guard_deep_half: {
    id: 'guard_deep_half',
    name: 'Meia-Guarda Profunda',
    category: 'guarda',
    nature: 'dominante',
    stability: 'media',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'deitado_lateral',
    orientationAthleteB: 'ajoelhado',
    primaryGrips: 'gola_e_calca',
    validTransitions: [
      'guard_half',
      'top_back_control',
      'top_side_control',
      'trans_reversal',
      'trans_scramble'
    ],
    description: 'Atleta A mergulha o corpo inteiramente sob o centro de gravidade de B, abraçando o quadril ou coxa oposta.',
    tacticalNotes: 'Neutraliza o peso de B e elimina o perigo de socos/amassamento, abrindo desequilíbrios para subida em double leg ou costas.'
  },

  guard_de_la_riva: {
    id: 'guard_de_la_riva',
    name: 'Guarda De La Riva',
    category: 'guarda',
    nature: 'dominante',
    stability: 'media',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'deitado_supino',
    orientationAthleteB: 'postura_alta',
    primaryGrips: 'manga_e_calca',
    validTransitions: [
      'guard_open',
      'guard_reverse_de_la_riva',
      'guard_spider',
      'top_back_control',
      'top_passing_process',
      'trans_reversal'
    ],
    description: 'Atleta A coloca o gancho externo contornando a perna dianteira de B, segurando o calcanhar e a manga oposta.',
    tacticalNotes: 'Guarda moderna fundamental. Plataforma principal para a manobra de berimbolo, raspagens de desequilíbrio e ida às costas.'
  },

  guard_reverse_de_la_riva: {
    id: 'guard_reverse_de_la_riva',
    name: 'Reverse De La Riva',
    category: 'guarda',
    nature: 'defensiva',
    stability: 'media',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'contested',
    orientationAthleteA: 'deitado_lateral',
    orientationAthleteB: 'postura_alta',
    primaryGrips: 'gola_e_calca',
    validTransitions: [
      'guard_de_la_riva',
      'guard_half',
      'top_passing_process',
      'trans_leg_entanglement',
      'trans_reversal',
      'trans_scramble'
    ],
    description: 'Gancho invertido por dentro da coxa de B, impedindo a passagem cruzando o joelho (knee slide/cut).',
    tacticalNotes: 'Posição essencial para travar passadores explosivos de knee slice e conectar entradas em kissing of the dragon ou leg locks.'
  },

  guard_spider: {
    id: 'guard_spider',
    name: 'Guarda Aranha',
    category: 'guarda',
    nature: 'dominante',
    stability: 'alta',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'deitado_supino',
    orientationAthleteB: 'postura_alta',
    primaryGrips: 'dupla_manga',
    validTransitions: [
      'guard_open',
      'guard_lasso',
      'guard_de_la_riva',
      'def_submission',
      'trans_reversal',
      'top_passing_process'
    ],
    description: 'Pegadas firmes nas duas mangas com as solas dos pés esticando os bíceps de B, manipulando toda a sua distância e postura.',
    tacticalNotes: 'Gera enorme frustração para o passador. Abre caminhos diretos para raspagem balão, triângulo e chave omoplata.'
  },

  guard_lasso: {
    id: 'guard_lasso',
    name: 'Guarda Laço',
    category: 'guarda',
    nature: 'dominante',
    stability: 'muito_alta',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'deitado_lateral',
    orientationAthleteB: 'postura_alta',
    primaryGrips: 'laco_de_manga',
    validTransitions: [
      'guard_spider',
      'guard_open',
      'guard_x',
      'top_side_control',
      'def_submission',
      'trans_reversal'
    ],
    description: 'Perna laçada em volta do braço de B e travada com o pé no meio das costas ou axila, com pegada de manga irremovível.',
    tacticalNotes: 'Uma das guardas mais seguras contra passagens de força. Desacelera a luta e permite raspagens de pêndulo ou omoplatas.'
  },

  guard_x: {
    id: 'guard_x',
    name: 'Guarda X',
    category: 'guarda',
    nature: 'dominante',
    stability: 'alta',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'deitado_supino',
    orientationAthleteB: 'postura_alta',
    primaryGrips: 'gola_e_calca',
    validTransitions: [
      'guard_butterfly',
      'guard_single_leg_x',
      'top_side_control',
      'top_back_control',
      'trans_reversal',
      'trans_scramble'
    ],
    description: 'Atleta A posicionado diretamente debaixo dos quadris de B, cruzando as pernas em "X" na virilha e no joelho oposto de B.',
    tacticalNotes: 'Altíssima probabilidade de raspagem. Desequilibra o passador com facilidade empurrando para frente ou para trás.'
  },

  guard_single_leg_x: {
    id: 'guard_single_leg_x',
    name: 'Single-Leg X (Ashi Garami)',
    category: 'guarda',
    nature: 'dominante',
    stability: 'alta',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'deitado_supino',
    orientationAthleteB: 'postura_alta',
    primaryGrips: 'emaranhamento_pernas',
    validTransitions: [
      'guard_x',
      'guard_butterfly',
      'trans_leg_entanglement',
      'top_side_control',
      'trans_reversal',
      'top_passing_process'
    ],
    description: 'Uma perna envolve a coxa de B com pé no quadril e a outra perna belisca por baixo, pinçando o joelho de B com força.',
    tacticalNotes: 'Posição de transição letal para raspagens de varredura ou ataques a chaves de pé retas (permitidas na faixa branca/azul).'
  },

  guard_fifty_fifty: {
    id: 'guard_fifty_fifty',
    name: 'Guarda 50/50',
    category: 'guarda',
    nature: 'neutra',
    stability: 'muito_alta',
    athleteTop: 'none',
    athleteBottom: 'none',
    controllingAthlete: 'none',
    controlledAthlete: 'none',
    advantage: 'neutral',
    orientationAthleteA: 'sentado',
    orientationAthleteB: 'sentado',
    primaryGrips: 'emaranhamento_pernas',
    validTransitions: [
      'trans_leg_entanglement',
      'trans_reversal',
      'top_passing_process',
      'trans_scramble'
    ],
    description: 'Pernas de ambos os atletas mutuamente entrelaçadas em espelho triangular em torno de uma coxa, com quadris no solo.',
    tacticalNotes: 'Simétrica e estratégica. Muito utilizada em competições para travar o jogo, pontuar vantagem na subida ou finalizar no calcanhar/pé.'
  },

  guard_knee_shield: {
    id: 'guard_knee_shield',
    name: 'Guarda com Joelho Escudo (Knee Shield)',
    category: 'guarda',
    nature: 'defensiva',
    stability: 'alta',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'deitado_lateral',
    orientationAthleteB: 'ajoelhado',
    primaryGrips: 'gola_e_manga',
    validTransitions: [
      'guard_half',
      'guard_z',
      'guard_closed',
      'guard_butterfly',
      'top_half_guard_control',
      'top_passing_process'
    ],
    description: 'Joelho colocado diagonalmente como escudo no peito de B na meia-guarda, impedindo a pressão do peso e do abraço de cabeça.',
    tacticalNotes: 'Estrutura defensiva quase intransponível por pressão direta. Exige que o passador desvie o joelho ou mude para o outro lado.'
  },

  guard_z: {
    id: 'guard_z',
    name: 'Guarda Z',
    category: 'guarda',
    nature: 'defensiva',
    stability: 'alta',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'deitado_lateral',
    orientationAthleteB: 'ajoelhado',
    primaryGrips: 'gola_cruzada',
    validTransitions: [
      'guard_knee_shield',
      'guard_half',
      'def_submission',
      'top_passing_process',
      'trans_reversal'
    ],
    description: 'Variação baixa do knee shield onde a tíbia atua horizontalmente contra o quadril de B com pegadas em gola cruzada.',
    tacticalNotes: 'Excelente para ataques rápidos de estrangulamento baseball choke, kimuras ou transições para chaves de braço.'
  },

  guard_seated: {
    id: 'guard_seated',
    name: 'Guarda Sentada (Shin-to-Shin / Seated)',
    category: 'guarda',
    nature: 'neutra',
    stability: 'media',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'none',
    controlledAthlete: 'none',
    advantage: 'neutral',
    orientationAthleteA: 'sentado',
    orientationAthleteB: 'postura_alta',
    primaryGrips: 'gola_e_calca',
    validTransitions: [
      'guard_butterfly',
      'guard_single_leg_x',
      'guard_de_la_riva',
      'stand_takedown_threat',
      'top_passing_process'
    ],
    description: 'Atleta A sentado ereto no tatame, buscando contato canela com canela com a perna dianteira de B para puxar ou subir nas pernas.',
    tacticalNotes: 'Impede o passador de usar peso por gravidade e conecta rapidamente com ataques de wrestling em pé.'
  },

  guard_supine: {
    id: 'guard_supine',
    name: 'Guarda Deitada (Open Supine)',
    category: 'guarda',
    nature: 'defensiva',
    stability: 'baixa',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'none',
    controlledAthlete: 'none',
    advantage: 'athlete_b',
    orientationAthleteA: 'deitado_supino',
    orientationAthleteB: 'postura_alta',
    primaryGrips: 'nenhuma',
    validTransitions: [
      'guard_open',
      'guard_de_la_riva',
      'trans_guard_recovery',
      'top_passing_process',
      'top_side_control'
    ],
    description: 'Atleta A de costas no chão sem pegadas consolidadas, usando os pés no ar para manter B afastado.',
    tacticalNotes: 'Posição perigosa se B for ágil. A precisa recuperar pegadas imediatamente antes de ser contornado em toreando ou leg drag.'
  },

  // =========================================================================
  // C. PASSAGEM E CONTROLE POR CIMA (10 posições)
  // Atleta A é canonicamente o dominante / por cima
  // Atleta B é canonicamente o dominado / por baixo
  // =========================================================================

  top_passing_process: {
    id: 'top_passing_process',
    name: 'Em Processo de Passagem de Guarda',
    category: 'passagem_e_controle',
    nature: 'transitoria',
    stability: 'muito_baixa',
    athleteTop: 'athlete_a',
    athleteBottom: 'athlete_b',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'postura_alta',
    orientationAthleteB: 'deitado_supino',
    primaryGrips: 'gola_e_calca',
    validTransitions: [
      'top_side_control',
      'top_knee_on_belly',
      'top_mount',
      'guard_half',
      'trans_guard_recovery',
      'bottom_turtle'
    ],
    description: 'Atleta A rompeu a linha das pernas de B e está em movimento ativo de transposição (toreando, knee slice ou leg drag).',
    tacticalNotes: 'Janela de 2 a 3 segundos onde a passagem pode ser consolidada gerando +3 pontos na CBJJ, ou B recuperar a guarda.'
  },

  top_half_guard_control: {
    id: 'top_half_guard_control',
    name: 'Controle de Meia-Guarda por Cima',
    category: 'passagem_e_controle',
    nature: 'dominante',
    stability: 'alta',
    athleteTop: 'athlete_a',
    athleteBottom: 'athlete_b',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'ajoelhado',
    orientationAthleteB: 'deitado_supino',
    primaryGrips: 'esgrima_simples',
    validTransitions: [
      'top_side_control',
      'top_mount',
      'guard_half',
      'trans_guard_recovery',
      'def_submission'
    ],
    description: 'Atleta A amassa o peito de B com esgrima profunda e controle de cabeça (crossface), com o quadril de B chapado no chão.',
    tacticalNotes: 'Controle de muita pressão e isolamento de ombro. Prepara a passagem de guarda definitiva deslizando o joelho preso.'
  },

  top_side_control: {
    id: 'top_side_control',
    name: 'Cem Quilos (Side Control)',
    category: 'passagem_e_controle',
    nature: 'dominante',
    stability: 'alta',
    athleteTop: 'athlete_a',
    athleteBottom: 'athlete_b',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'deitado_prono',
    orientationAthleteB: 'deitado_supino',
    primaryGrips: 'esgrima_simples',
    validTransitions: [
      'top_knee_on_belly',
      'top_mount',
      'top_north_south',
      'top_kesa_gatame',
      'escape_side_control',
      'def_side_control',
      'def_submission'
    ],
    description: 'Controle lateral perpendicular com peito sobre peito, abraçando a cabeça de B e esgrimando o braço distante.',
    tacticalNotes: 'Posição estável após passagem. Ponto de partida para montada, joelho na barriga ou finalizações em chave americana e kimura.'
  },

  top_kesa_gatame: {
    id: 'top_kesa_gatame',
    name: 'Kesa Gatame (Controle Diagonal)',
    category: 'passagem_e_controle',
    nature: 'dominante',
    stability: 'alta',
    athleteTop: 'athlete_a',
    athleteBottom: 'athlete_b',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'sentado',
    orientationAthleteB: 'deitado_supino',
    primaryGrips: 'esgrima_simples',
    validTransitions: [
      'top_side_control',
      'top_mount',
      'top_back_control',
      'escape_side_control',
      'def_submission'
    ],
    description: 'Imobilização lateral de tradição judoca com tronco colado nas costelas de B, abraçando o pescoço e pinçando o braço próximo sob a axila.',
    tacticalNotes: 'Drena a capacidade pulmonar do atleta por baixo. Requer cautela com pegada de costas caso B consiga esgrimar.'
  },

  top_north_south: {
    id: 'top_north_south',
    name: 'Norte-Sul (North-South)',
    category: 'passagem_e_controle',
    nature: 'dominante',
    stability: 'alta',
    athleteTop: 'athlete_a',
    athleteBottom: 'athlete_b',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'deitado_prono',
    orientationAthleteB: 'deitado_supino',
    primaryGrips: 'dupla_esgrima',
    validTransitions: [
      'top_side_control',
      'top_mount',
      'top_back_control',
      'escape_side_control',
      'def_submission'
    ],
    description: 'Atleta A alinha seu corpo na direção oposta ao de B (cabeça com cabeça), controlando os braços de B colados no tatame.',
    tacticalNotes: 'Neutraliza qualquer tentativa de reposição de guarda com pernas. Plataforma de elite para o estrangulamento norte-sul e kimuras.'
  },

  top_knee_on_belly: {
    id: 'top_knee_on_belly',
    name: 'Joelho na Barriga',
    category: 'passagem_e_controle',
    nature: 'dominante',
    stability: 'media',
    athleteTop: 'athlete_a',
    athleteBottom: 'athlete_b',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'postura_alta',
    orientationAthleteB: 'deitado_supino',
    primaryGrips: 'gola_e_calca',
    validTransitions: [
      'top_mount',
      'top_side_control',
      'top_north_south',
      'top_back_control',
      'escape_side_control',
      'def_submission'
    ],
    description: 'Atleta A coloca a canela e joelho sobre o plexo solar de B, mantendo a outra perna aberta e tronco ereto.',
    tacticalNotes: 'Rende +2 pontos oficiais na CBJJ/IBJJF após 3 segundos de estabilização. Força B a se expor com os braços.'
  },

  top_mount: {
    id: 'top_mount',
    name: 'Montada Completa',
    category: 'passagem_e_controle',
    nature: 'dominante',
    stability: 'alta',
    athleteTop: 'athlete_a',
    athleteBottom: 'athlete_b',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'ajoelhado',
    orientationAthleteB: 'deitado_supino',
    primaryGrips: 'gola_cruzada',
    validTransitions: [
      'top_high_mount',
      'top_back_control',
      'top_knee_on_belly',
      'escape_mount',
      'def_mount',
      'def_submission'
    ],
    description: 'Atleta A sentado sobre o tronco de B com os dois joelhos no tatame em ambos os lados, com postura estabilizada.',
    tacticalNotes: 'Posição máxima de controle por cima (+4 pontos CBJJ). Amplo leque de armlocks, estrangulamento cruzado e ezequiel.'
  },

  top_high_mount: {
    id: 'top_high_mount',
    name: 'Montada Alta',
    category: 'passagem_e_controle',
    nature: 'dominante',
    stability: 'muito_alta',
    athleteTop: 'athlete_a',
    athleteBottom: 'athlete_b',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'ajoelhado',
    orientationAthleteB: 'deitado_supino',
    primaryGrips: 'gola_cruzada',
    validTransitions: [
      'top_mount',
      'top_back_control',
      'def_submission',
      'escape_mount'
    ],
    description: 'Joelhos de A deslizados até as axilas de B, isolando completamente os braços de B acima da linha da cabeça.',
    tacticalNotes: 'Quase impossível de escapar com ponte/upa. Perigo iminente de armlock duplo, triângulo montado ou costas.'
  },

  top_back_control: {
    id: 'top_back_control',
    name: 'Controle das Costas com Ganchos',
    category: 'passagem_e_controle',
    nature: 'dominante',
    stability: 'muito_alta',
    athleteTop: 'athlete_a',
    athleteBottom: 'athlete_b',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'deitado_lateral',
    orientationAthleteB: 'deitado_lateral',
    primaryGrips: 'cinto_seguranca',
    validTransitions: [
      'top_mount',
      'escape_back_control',
      'def_back_control',
      'def_submission'
    ],
    description: 'Atleta A nas costas de B com os dois ganchos dos calcanhares encaixados na virilha e cinto de segurança no peito.',
    tacticalNotes: 'A posição mais letal do Jiu-Jitsu (+4 pontos CBJJ). B não possui visão de A. Alvo para o mata-leão e arco e flecha.'
  },

  top_turtle_control: {
    id: 'top_turtle_control',
    name: 'Controle da Tartaruga por Cima',
    category: 'passagem_e_controle',
    nature: 'dominante',
    stability: 'alta',
    athleteTop: 'athlete_a',
    athleteBottom: 'athlete_b',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'ajoelhado',
    orientationAthleteB: 'quatro_apoios',
    primaryGrips: 'cinto_seguranca',
    validTransitions: [
      'top_back_control',
      'top_side_control',
      'bottom_turtle',
      'trans_reversal',
      'def_submission'
    ],
    description: 'Atleta A pesado sobre a espinha dorsal ou lateral de B (em 4 apoios), grampeando com esgrima ou seatbelt.',
    tacticalNotes: 'Acesso primário para colocar ganchos e pontuar costas (+4 pts), aplicar estrangulamento relógio ou rodar para o crucifixo.'
  },

  // =========================================================================
  // D. DEFESA E TRANSIÇÃO (12 posições)
  // Atleta A é canonicamente o atleta em postura defensiva / de reação
  // Atleta B é canonicamente o adversário pressionando
  // =========================================================================

  bottom_turtle: {
    id: 'bottom_turtle',
    name: 'Tartaruga por Baixo',
    category: 'defesa_e_transicao',
    nature: 'defensiva',
    stability: 'alta',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'athlete_b',
    controlledAthlete: 'athlete_a',
    advantage: 'athlete_b',
    orientationAthleteA: 'quatro_apoios',
    orientationAthleteB: 'ajoelhado',
    primaryGrips: 'nenhuma',
    validTransitions: [
      'top_turtle_control',
      'top_back_control',
      'trans_guard_recovery',
      'trans_reversal',
      'stand_neutral'
    ],
    description: 'Atleta A fechado em quatro apoios, com cotovelos colados nos joelhos e queixo no peito para negar pontos de passagem e finalização.',
    tacticalNotes: 'Posição defensiva que não concede pontos de passagem ao adversário, mas dá tempo para sentar e recuperar guarda.'
  },

  trans_guard_recovery: {
    id: 'trans_guard_recovery',
    name: 'Recuperação de Guarda',
    category: 'defesa_e_transicao',
    nature: 'transitoria',
    stability: 'baixa',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'none',
    controlledAthlete: 'none',
    advantage: 'contested',
    orientationAthleteA: 'deitado_lateral',
    orientationAthleteB: 'ajoelhado',
    primaryGrips: 'gola_e_manga',
    validTransitions: [
      'guard_half',
      'guard_closed',
      'guard_open',
      'guard_butterfly',
      'top_side_control',
      'top_half_guard_control'
    ],
    description: 'Atleta A foge o quadril (shrimping), encaixa o joelho ou perna entre os corpos e recompõe uma de suas guardas.',
    tacticalNotes: 'Frustra a passagem de B no último instante. Sucesso reconduz para meia-guarda ou fechada; falha resulta em 100kg de B.'
  },

  def_side_control: {
    id: 'def_side_control',
    name: 'Defesa de Controle Lateral',
    category: 'defesa_e_transicao',
    nature: 'defensiva',
    stability: 'media',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'athlete_b',
    controlledAthlete: 'athlete_a',
    advantage: 'athlete_b',
    orientationAthleteA: 'deitado_lateral',
    orientationAthleteB: 'deitado_prono',
    primaryGrips: 'esgrima_simples',
    validTransitions: [
      'escape_side_control',
      'trans_guard_recovery',
      'top_side_control',
      'bottom_turtle',
      'top_mount'
    ],
    description: 'Atleta A por baixo mantém os antebraços cruzados em frame no pescoço e quadril de B, impedindo o esmagamento.',
    tacticalNotes: 'Postura mandatória para não ser asfixiado no 100kg. Permite fuga de quadril ou giro de tartaruga sob pressão.'
  },

  def_mount: {
    id: 'def_mount',
    name: 'Defesa de Montada',
    category: 'defesa_e_transicao',
    nature: 'defensiva',
    stability: 'media',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'athlete_b',
    controlledAthlete: 'athlete_a',
    advantage: 'athlete_b',
    orientationAthleteA: 'deitado_supino',
    orientationAthleteB: 'ajoelhado',
    primaryGrips: 'nenhuma',
    validTransitions: [
      'escape_mount',
      'top_mount',
      'top_high_mount',
      'guard_half',
      'trans_reversal'
    ],
    description: 'Atleta A mantém os cotovelos colados nas costelas, mãos protegendo o pescoço e pés próximos aos glúteos para a barrigada.',
    tacticalNotes: 'Evita a montada alta e chaves de braço. Prepara a clássica saída de upa (barrigada) ou saída de cotovelo na perna.'
  },

  def_back_control: {
    id: 'def_back_control',
    name: 'Defesa de Controle das Costas',
    category: 'defesa_e_transicao',
    nature: 'defensiva',
    stability: 'baixa',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'athlete_b',
    controlledAthlete: 'athlete_a',
    advantage: 'athlete_b',
    orientationAthleteA: 'deitado_lateral',
    orientationAthleteB: 'deitado_lateral',
    primaryGrips: 'cinto_seguranca',
    validTransitions: [
      'escape_back_control',
      'top_back_control',
      'def_submission',
      'guard_half'
    ],
    description: 'Atleta A usa as duas mãos para segurar o braço estrangulador de B no peito, colando o queixo e protegendo as golas.',
    tacticalNotes: 'Sobrevivência sob o perigo de mata-leão. O atleta precisa defender o pescoço antes de tentar deslizar as costas no tatame.'
  },

  escape_mount: {
    id: 'escape_mount',
    name: 'Fuga de Montada em Andamento',
    category: 'defesa_e_transicao',
    nature: 'transitoria',
    stability: 'muito_baixa',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'none',
    controlledAthlete: 'none',
    advantage: 'contested',
    orientationAthleteA: 'deitado_lateral',
    orientationAthleteB: 'ajoelhado',
    primaryGrips: 'esgrima_simples',
    validTransitions: [
      'trans_reversal',
      'guard_half',
      'guard_closed',
      'top_mount',
      'trans_scramble'
    ],
    description: 'Atleta A executa a ponte explosiva (upa) com braço de B travado ou entra com cotovelo para recolher a meia-guarda.',
    tacticalNotes: 'Movimento explosivo que consome estamina. Se completar a upa, cai por cima na guarda fechada de B (reversão).'
  },

  escape_side_control: {
    id: 'escape_side_control',
    name: 'Fuga de Controle Lateral em Andamento',
    category: 'defesa_e_transicao',
    nature: 'transitoria',
    stability: 'muito_baixa',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'none',
    controlledAthlete: 'none',
    advantage: 'contested',
    orientationAthleteA: 'deitado_lateral',
    orientationAthleteB: 'deitado_prono',
    primaryGrips: 'esgrima_simples',
    validTransitions: [
      'trans_guard_recovery',
      'guard_half',
      'bottom_turtle',
      'top_side_control',
      'trans_scramble'
    ],
    description: 'Atleta A cria espaço com os antebraços e foge o quadril com vigor, buscando esgrimar ou enfiar a canela no peito de B.',
    tacticalNotes: 'Se bem-sucedido, recompõe a guarda; se B bloquear o quadril, B retém o controle lateral.'
  },

  escape_back_control: {
    id: 'escape_back_control',
    name: 'Fuga de Controle das Costas em Andamento',
    category: 'defesa_e_transicao',
    nature: 'transitoria',
    stability: 'muito_baixa',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'none',
    controlledAthlete: 'none',
    advantage: 'contested',
    orientationAthleteA: 'deitado_supino',
    orientationAthleteB: 'deitado_lateral',
    primaryGrips: 'cinto_seguranca',
    validTransitions: [
      'guard_half',
      'guard_closed',
      'top_mount',
      'top_back_control',
      'trans_scramble'
    ],
    description: 'Atleta A desliza os ombros para o chão sobre o braço fraco de B, limpando um dos ganchos e virando de frente para a guarda.',
    tacticalNotes: 'Fuga técnica crucial. Se escapar, neutraliza a pontuação de B e recoloca a luta na meia ou guarda fechada.'
  },

  trans_scramble: {
    id: 'trans_scramble',
    name: 'Scramble (Disputa Dinâmica de Solo)',
    category: 'defesa_e_transicao',
    nature: 'transitoria',
    stability: 'muito_baixa',
    athleteTop: 'none',
    athleteBottom: 'none',
    controllingAthlete: 'none',
    controlledAthlete: 'none',
    advantage: 'contested',
    orientationAthleteA: 'quatro_apoios',
    orientationAthleteB: 'quatro_apoios',
    primaryGrips: 'disputa_aberta',
    validTransitions: [
      'stand_neutral',
      'top_side_control',
      'guard_open',
      'guard_half',
      'bottom_turtle',
      'top_turtle_control',
      'top_mount'
    ],
    description: 'Fase caótica onde nenhum atleta tem controle estabelecido, ambos brigando por apoio, subida ou grampo de perna.',
    tacticalNotes: 'Exige agilidade, QI de luta e reflexos rápidos. Quem colocar os quadris por cima ou levantar primeiro ganha a iniciativa.'
  },

  trans_reversal: {
    id: 'trans_reversal',
    name: 'Reversão (Inversão / Raspagem em Consolidação)',
    category: 'defesa_e_transicao',
    nature: 'transitoria',
    stability: 'muito_baixa',
    athleteTop: 'athlete_a',
    athleteBottom: 'athlete_b',
    controllingAthlete: 'athlete_a',
    controlledAthlete: 'athlete_b',
    advantage: 'athlete_a',
    orientationAthleteA: 'postura_alta',
    orientationAthleteB: 'deitado_supino',
    primaryGrips: 'gola_e_calca',
    validTransitions: [
      'top_side_control',
      'top_mount',
      'top_half_guard_control',
      'top_knee_on_belly',
      'guard_closed',
      'trans_scramble'
    ],
    description: 'Atleta A acabou de inverter o adversário B (vindo de baixo para cima), estando aterrissando no solo.',
    tacticalNotes: 'Janela de consolidação dos +2 pontos de raspagem na CBJJ. A precisa manter B de costas no chão por 3 segundos.'
  },

  def_submission: {
    id: 'def_submission',
    name: 'Defesa de Finalização em Risco',
    category: 'defesa_e_transicao',
    nature: 'defensiva',
    stability: 'baixa',
    athleteTop: 'athlete_b',
    athleteBottom: 'athlete_a',
    controllingAthlete: 'athlete_b',
    controlledAthlete: 'athlete_a',
    advantage: 'athlete_b',
    orientationAthleteA: 'deitado_supino',
    orientationAthleteB: 'postura_alta',
    primaryGrips: 'gola_cruzada',
    validTransitions: [
      'guard_closed',
      'guard_half',
      'top_side_control',
      'top_mount',
      'trans_guard_recovery',
      'trans_scramble'
    ],
    description: 'Atleta B encaixou uma alavanca articular ou estrangulamento; Atleta A luta contra o tempo para aliviar a pressão e defender.',
    tacticalNotes: 'Momento de clímax técnico. Se a defesa tiver sucesso, A desvencilha e volta para guarda ou reverte; se falhar, ocorre a desistência (tapout).'
  },

  trans_leg_entanglement: {
    id: 'trans_leg_entanglement',
    name: 'Emaranhamento de Pernas (Leg Entanglement / Ashi)',
    category: 'defesa_e_transicao',
    nature: 'transitoria',
    stability: 'media',
    athleteTop: 'none',
    athleteBottom: 'none',
    controllingAthlete: 'none',
    controlledAthlete: 'none',
    advantage: 'contested',
    orientationAthleteA: 'sentado',
    orientationAthleteB: 'sentado',
    primaryGrips: 'emaranhamento_pernas',
    validTransitions: [
      'guard_fifty_fifty',
      'guard_single_leg_x',
      'top_side_control',
      'def_submission',
      'trans_scramble'
    ],
    description: 'Ambos os atletas sentados no tatame com pernas entrelaçadas em posições modernas de ashi garami, disputando o domínio do calcanhar.',
    tacticalNotes: 'Área tática com regulamento específico da CBJJ: chaves retas liberadas na branca/azul; chaves de calcanhar e rotação proibidas de quimono.'
  }
};

/** Lista indexada de todas as posições para iteração */
export const BJJ_POSITIONS_LIST: BjjPosition[] = Object.values(BJJ_POSITIONS_CATALOG);

/**
 * Função de consulta rápida por ID
 */
export function getBjjPositionById(id: BjjPositionId): BjjPosition | undefined {
  return BJJ_POSITIONS_CATALOG[id];
}

/**
 * Consulta de posições filtradas por categoria
 */
export function getBjjPositionsByCategory(category: BjjPositionCategory): BjjPosition[] {
  return BJJ_POSITIONS_LIST.filter((p) => p.category === category);
}

/**
 * Retorna os objetos de posições para as quais uma dada posição pode transitar
 */
export function getValidTargetPositions(id: BjjPositionId): BjjPosition[] {
  const current = BJJ_POSITIONS_CATALOG[id];
  if (!current) return [];
  return current.validTransitions
    .map((targetId) => BJJ_POSITIONS_CATALOG[targetId])
    .filter((pos): pos is BjjPosition => pos !== undefined);
}

/**
 * Verifica se há transição válida direta entre duas posições
 */
export function arePositionsConnected(fromId: BjjPositionId, toId: BjjPositionId): boolean {
  const current = BJJ_POSITIONS_CATALOG[fromId];
  if (!current) return false;
  return current.validTransitions.includes(toId);
}

/**
 * Inverte os papéis canônicos de uma posição para representar o inverso
 * (ex: quando o Atleta B for o guardeiro e o Atleta A o passador).
 */
export function invertPositionRoles(position: BjjPosition): BjjPosition {
  const invertRole = (r: 'athlete_a' | 'athlete_b' | 'none'): 'athlete_a' | 'athlete_b' | 'none' => {
    if (r === 'athlete_a') return 'athlete_b';
    if (r === 'athlete_b') return 'athlete_a';
    return 'none';
  };

  const invertAdvantage = (
    adv: 'athlete_a' | 'athlete_b' | 'neutral' | 'contested'
  ): 'athlete_a' | 'athlete_b' | 'neutral' | 'contested' => {
    if (adv === 'athlete_a') return 'athlete_b';
    if (adv === 'athlete_b') return 'athlete_a';
    return adv;
  };

  return {
    ...position,
    athleteTop: invertRole(position.athleteTop),
    athleteBottom: invertRole(position.athleteBottom),
    controllingAthlete: invertRole(position.controllingAthlete),
    controlledAthlete: invertRole(position.controlledAthlete),
    advantage: invertAdvantage(position.advantage),
    orientationAthleteA: position.orientationAthleteB,
    orientationAthleteB: position.orientationAthleteA
  };
}

/**
 * Função de validação rigorosa de consistência do catálogo de posições.
 * Verifica 100% dos requisitos estipulados na Fase 1.
 */
export function validateBjjPositionsCatalog(
  catalog: Record<BjjPositionId, BjjPosition> = BJJ_POSITIONS_CATALOG
): BjjCatalogValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const registeredIds = new Set<string>();
  const positions = Object.values(catalog);

  const positionsByCategory: Record<BjjPositionCategory, number> = {
    em_pe: 0,
    guarda: 0,
    passagem_e_controle: 0,
    defesa_e_transicao: 0
  };

  let totalTransitions = 0;

  for (const pos of positions) {
    // 1. Unicidade de ID
    if (registeredIds.has(pos.id)) {
      errors.push(`ID duplicado detectado: "${pos.id}"`);
    }
    registeredIds.add(pos.id);

    // Contagem por categoria
    if (pos.category in positionsByCategory) {
      positionsByCategory[pos.category] += 1;
    } else {
      errors.push(`Posição "${pos.id}" possui categoria inválida: "${pos.category}"`);
    }

    // 2. Coerência dos atletas
    if (pos.athleteTop !== 'none' && pos.athleteTop === pos.athleteBottom) {
      errors.push(`Posição "${pos.id}": mesmo atleta ("${pos.athleteTop}") está simultaneamente por cima e por baixo.`);
    }

    if (pos.controllingAthlete !== 'none' && pos.controllingAthlete === pos.controlledAthlete) {
      errors.push(`Posição "${pos.id}": mesmo atleta ("${pos.controllingAthlete}") está controlando e sendo controlado.`);
    }

    // Posições em pé devem ter athleteTop e athleteBottom como 'none'
    if (pos.category === 'em_pe') {
      if (pos.athleteTop !== 'none' || pos.athleteBottom !== 'none') {
        warnings.push(`Posição em pé "${pos.id}" possui atletaTop/athleteBottom diferente de 'none'.`);
      }
    }

    // 3. Validação de transições
    if (!pos.validTransitions || pos.validTransitions.length === 0) {
      errors.push(`Posição "${pos.id}" não possui nenhuma transição cadastrada (beco sem saída no grafo).`);
    } else {
      totalTransitions += pos.validTransitions.length;

      for (const targetId of pos.validTransitions) {
        // Auto-referência
        if (targetId === pos.id) {
          errors.push(`Posição "${pos.id}" referencia a si mesma como transição.`);
        }

        // Alvo existente no catálogo
        if (!catalog[targetId]) {
          errors.push(`Posição "${pos.id}" referencia transição inexistente: "${targetId}".`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    totalPositions: positions.length,
    totalTransitions,
    positionsByCategory,
    errors,
    warnings
  };
}
