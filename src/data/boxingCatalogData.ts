/**
 * CAMINHO DO GUERREIRO: DO TATAME AO OCTÓGONO
 * Módulo Especializado de Boxe (Pugilismo) — Catálogo Oficial de Estados do Ringue e Técnicas
 */

import {
  BoxingStateId,
  BoxingStateMeta,
  BoxingTechnique,
  BoxingTechniqueCategory,
  BoxingAiStyle,
  BoxingPersonality
} from '../types/boxingCombat';

export const BOXING_STATES_CATALOG: Record<BoxingStateId, BoxingStateMeta> = {
  neutro_longa: {
    id: 'neutro_longa',
    distance: 'longa',
    displayName: 'Longa Distância (Centro do Ringue)',
    shortDesc: 'Troca técnica de alcance com jabs, diretos, fintas e jogo de pernas.',
    tacticalNote: 'Favorece alcance, velocidade de jab e contra-golpes em pull-back.'
  },
  troca_media: {
    id: 'troca_media',
    distance: 'media',
    displayName: 'Média Distância (Zona de Troca)',
    shortDesc: 'Alcance clássico de combinações 1-2-3, slips laterais e cruzados limpos.',
    tacticalNote: 'Todas as armas estão vivas; esquivas rendem contragolpes decisivos.'
  },
  infight_curta: {
    id: 'infight_curta',
    distance: 'curta',
    displayName: 'Curta Distância (Infight / Pocket)',
    shortDesc: 'Combate cerrado cabeça com cabeça: ganchos no fígado, uppercuts e pêndulo.',
    tacticalNote: 'Alto desgaste físico, alto potencial de dano no corpo e knockdowns.'
  },
  clinch_boxe: {
    id: 'clinch_boxe',
    distance: 'clinch',
    displayName: 'Clinch / Travamento de Braços',
    shortDesc: 'Pugilistas engalfinhados no corpo a corpo aguardando separação ou golpes curtos.',
    tacticalNote: 'Ideal para desacelerar ritmo e recuperar queixo; árbitro separa após pressão.'
  },
  azul_nas_cordas: {
    id: 'azul_nas_cordas',
    distance: 'cordas',
    displayName: 'Córner Azul Encurralado nas Cordas',
    shortDesc: 'Você está pressionado contra as cordas; é preciso defender, circular ou usar check hook.',
    tacticalNote: 'Permanecer nas cordas amplia o dano recebido e conta contra no domínio de ringue.'
  },
  vermelho_nas_cordas: {
    id: 'vermelho_nas_cordas',
    distance: 'cordas',
    displayName: 'Oponente Encurralado nas Cordas',
    shortDesc: 'Adversário sem espaço de recuo contra as cordas — momento de pressionar ou cortar saída.',
    tacticalNote: 'Combinações e ganchos têm bônus de pressão e pontuação dos juízes.'
  }
};

export const BOXING_TECHNIQUE_LIST: BoxingTechnique[] = [
  // =====================================================================
  // 1. JABS & DIRETOS
  // =====================================================================
  {
    id: 'box_jab_medidor',
    displayName: 'Jab Medidor de Distância',
    shortDesc: 'Golpe rápido com a mão da frente para pontuar, controlar alcance e quebrar ritmo.',
    category: 'jabs_diretos',
    objective: 'golpe_reto',
    allowedDistances: ['longa', 'media', 'cordas'],
    basePower: 7,
    bodyDamage: 1,
    guardDamage: 6,
    stunPower: 5,
    accuracyMod: 0.2,
    pointWeight: 1.35,
    staminaCost: 6,
    durationSeconds: 7,
    nextDistanceOnSuccess: 'longa',
    relevantAttributes: ['punchSpeed', 'technique', 'footwork']
  },
  {
    id: 'box_jab_duplo',
    displayName: 'Jab Duplo Avançando',
    shortDesc: 'Dois jabs sequenciais abrindo a guarda frontal e fechando o espaço para a média.',
    category: 'jabs_diretos',
    objective: 'golpe_reto',
    allowedDistances: ['longa', 'media', 'cordas'],
    basePower: 11,
    bodyDamage: 2,
    guardDamage: 12,
    stunPower: 8,
    accuracyMod: 0.12,
    pointWeight: 1.75,
    staminaCost: 10,
    durationSeconds: 8,
    nextDistanceOnSuccess: 'media',
    relevantAttributes: ['punchSpeed', 'technique', 'footwork']
  },
  {
    id: 'box_jab_corpo',
    displayName: 'Jab Baixo no Plexo',
    shortDesc: 'Mudança rápida de nível atacando o estômago para baixar a guarda alta do rival.',
    category: 'jabs_diretos',
    objective: 'golpe_corpo',
    allowedDistances: ['longa', 'media', 'curta'],
    basePower: 5,
    bodyDamage: 11,
    guardDamage: 9,
    stunPower: 4,
    accuracyMod: 0.14,
    pointWeight: 1.25,
    staminaCost: 8,
    durationSeconds: 7,
    relevantAttributes: ['punchSpeed', 'technique']
  },
  {
    id: 'box_direto_encontro',
    displayName: 'Direto Reto de Poder',
    shortDesc: 'Golpe limpo de mão traseira girando o quadril para punir aberturas frontais.',
    category: 'jabs_diretos',
    objective: 'golpe_reto',
    allowedDistances: ['longa', 'media', 'cordas'],
    basePower: 17,
    bodyDamage: 2,
    guardDamage: 14,
    stunPower: 18,
    accuracyMod: 0.04,
    pointWeight: 1.9,
    staminaCost: 13,
    durationSeconds: 8,
    relevantAttributes: ['punchPower', 'punchSpeed', 'technique']
  },
  {
    id: 'box_overhand',
    displayName: 'Overhand por Cima da Guarda',
    shortDesc: 'Trajetória em arco por cima do jab adversário com altíssimo poder de nocaute.',
    category: 'jabs_diretos',
    objective: 'golpe_poder_alto',
    allowedDistances: ['media', 'curta', 'cordas'],
    basePower: 24,
    bodyDamage: 0,
    guardDamage: 20,
    stunPower: 28,
    accuracyMod: -0.06,
    pointWeight: 2.3,
    staminaCost: 18,
    durationSeconds: 9,
    counterBonusAgainst: ['golpe_reto'],
    relevantAttributes: ['punchPower', 'technique', 'mentalFocus']
  },

  // =====================================================================
  // 2. CRUZADOS & GANCHOS
  // =====================================================================
  {
    id: 'box_cruzado_queixo',
    displayName: 'Cruzado no Queixo',
    shortDesc: 'Hook lateral curto mirando a linha da mandíbula com torque de ombro.',
    category: 'cruzados_ganchos',
    objective: 'golpe_poder_alto',
    allowedDistances: ['media', 'curta', 'cordas'],
    basePower: 21,
    bodyDamage: 0,
    guardDamage: 16,
    stunPower: 25,
    accuracyMod: 0.02,
    pointWeight: 2.1,
    staminaCost: 15,
    durationSeconds: 8,
    relevantAttributes: ['punchPower', 'punchSpeed', 'technique']
  },
  {
    id: 'box_check_hook',
    displayName: 'Check Hook em Pivô',
    shortDesc: 'Cruzado girando o pé de apoio para punir quem avança e escapar das cordas.',
    category: 'cruzados_ganchos',
    objective: 'golpe_poder_alto',
    allowedDistances: ['media', 'curta', 'cordas'],
    basePower: 15,
    bodyDamage: 0,
    guardDamage: 10,
    stunPower: 19,
    accuracyMod: 0.08,
    pointWeight: 2.0,
    staminaCost: 13,
    durationSeconds: 8,
    counterBonusAgainst: ['corte_ringue', 'combinacao'],
    nextDistanceOnSuccess: 'media',
    ropeEscapeBonus: true,
    relevantAttributes: ['footwork', 'technique', 'punchSpeed']
  },
  {
    id: 'box_gancho_figado',
    displayName: 'Gancho Devastador no Fígado',
    shortDesc: 'Golpe cirúrgico nas costelas flutuantes que dobra o oponente e drena o gás.',
    category: 'cruzados_ganchos',
    objective: 'golpe_corpo',
    allowedDistances: ['media', 'curta', 'cordas'],
    basePower: 9,
    bodyDamage: 24,
    guardDamage: 14,
    stunPower: 20,
    accuracyMod: 0.04,
    pointWeight: 1.95,
    staminaCost: 16,
    durationSeconds: 8,
    relevantAttributes: ['punchPower', 'technique']
  },
  {
    id: 'box_cruzado_duplo',
    displayName: 'Cruzado Duplo (Corpo + Cabeça)',
    shortDesc: 'Dobra na linha de cintura para baixar os cotovelos e sobe com hook na têmpora.',
    category: 'cruzados_ganchos',
    objective: 'golpe_poder_alto',
    allowedDistances: ['curta', 'cordas'],
    basePower: 22,
    bodyDamage: 12,
    guardDamage: 22,
    stunPower: 24,
    accuracyMod: -0.02,
    pointWeight: 2.4,
    staminaCost: 20,
    durationSeconds: 9,
    relevantAttributes: ['punchPower', 'punchSpeed', 'stamina']
  },

  // =====================================================================
  // 3. UPPERCUTS & CORPO
  // =====================================================================
  {
    id: 'box_upper_encontro',
    displayName: 'Uppercut de Encontro',
    shortDesc: 'Gancho ascendente pelo centro que levanta o queixo de quem abaixa a cabeça.',
    category: 'uppers_corpo',
    objective: 'golpe_poder_alto',
    allowedDistances: ['media', 'curta', 'cordas'],
    basePower: 20,
    bodyDamage: 0,
    guardDamage: 19,
    stunPower: 26,
    accuracyMod: 0.01,
    pointWeight: 2.15,
    staminaCost: 16,
    durationSeconds: 8,
    counterBonusAgainst: ['esquiva_contra', 'corte_ringue'],
    relevantAttributes: ['punchPower', 'technique', 'mentalFocus']
  },
  {
    id: 'box_upper_clinch',
    displayName: 'Uppercut Curto no Infight / Clinch',
    shortDesc: 'Golpe compacto de curta amplitude com uma mão livre no corpo a corpo.',
    category: 'uppers_corpo',
    objective: 'golpe_poder_alto',
    allowedDistances: ['curta', 'clinch', 'cordas'],
    basePower: 15,
    bodyDamage: 4,
    guardDamage: 15,
    stunPower: 16,
    accuracyMod: 0.08,
    pointWeight: 1.7,
    staminaCost: 13,
    durationSeconds: 7,
    relevantAttributes: ['punchPower', 'durability', 'technique']
  },
  {
    id: 'box_body_rip',
    displayName: 'Série no Corpo no Infight',
    shortDesc: 'Ganchos alternados no plexo e costelas para minar a resistência em múltiplos rounds.',
    category: 'uppers_corpo',
    objective: 'golpe_corpo',
    allowedDistances: ['curta', 'clinch', 'cordas'],
    basePower: 7,
    bodyDamage: 20,
    guardDamage: 16,
    stunPower: 11,
    accuracyMod: 0.1,
    pointWeight: 1.85,
    staminaCost: 14,
    durationSeconds: 8,
    relevantAttributes: ['stamina', 'punchPower', 'durability']
  },

  // =====================================================================
  // 4. COMBINAÇÕES
  // =====================================================================
  {
    id: 'box_combo_um_dois',
    displayName: 'Combinação 1-2 (Jab + Direto)',
    shortDesc: 'O pilar da Nobre Arte: jab abrindo a linha central seguido pelo direto pleno.',
    category: 'combinacoes',
    objective: 'combinacao',
    allowedDistances: ['longa', 'media', 'cordas'],
    basePower: 19,
    bodyDamage: 3,
    guardDamage: 18,
    stunPower: 19,
    accuracyMod: 0.07,
    pointWeight: 2.35,
    staminaCost: 15,
    durationSeconds: 9,
    nextDistanceOnSuccess: 'media',
    relevantAttributes: ['punchSpeed', 'punchPower', 'technique']
  },
  {
    id: 'box_combo_1_2_3',
    displayName: 'Combo 1-2-3 (Jab-Direto-Cruzado)',
    shortDesc: 'Sequência clássica de três tempos com altíssimo volume e impacto contínuo.',
    category: 'combinacoes',
    objective: 'combinacao',
    allowedDistances: ['media', 'curta', 'cordas'],
    basePower: 25,
    bodyDamage: 4,
    guardDamage: 24,
    stunPower: 25,
    accuracyMod: 0.01,
    pointWeight: 2.8,
    staminaCost: 21,
    durationSeconds: 10,
    relevantAttributes: ['punchSpeed', 'punchPower', 'stamina']
  },
  {
    id: 'box_combo_finta_alto',
    displayName: 'Finta Baixa + Cruzado Alto',
    shortDesc: 'Ameça no estômago para forçar a queda da mão e explode com cruzado limpo.',
    category: 'combinacoes',
    objective: 'combinacao',
    allowedDistances: ['media', 'curta', 'cordas'],
    basePower: 20,
    bodyDamage: 6,
    guardDamage: 12,
    stunPower: 23,
    accuracyMod: 0.09,
    pointWeight: 2.25,
    staminaCost: 16,
    durationSeconds: 9,
    counterBonusAgainst: ['defesa_guarda'],
    relevantAttributes: ['technique', 'mentalFocus', 'punchSpeed']
  },
  {
    id: 'box_combo_chuva_cordas',
    displayName: 'Blitz de Pressão (Chuva de Golpes)',
    shortDesc: 'Série agressiva sem pausas para buscar o TKO quando o rival está abalado.',
    category: 'combinacoes',
    objective: 'combinacao',
    allowedDistances: ['curta', 'cordas'],
    basePower: 29,
    bodyDamage: 10,
    guardDamage: 28,
    stunPower: 30,
    accuracyMod: -0.04,
    pointWeight: 3.0,
    staminaCost: 26,
    durationSeconds: 10,
    pushesToRopes: true,
    relevantAttributes: ['punchPower', 'punchSpeed', 'stamina']
  },
  {
    id: 'box_combo_shoeshine',
    displayName: 'Sequência Rápida (Shoe-Shine)',
    shortDesc: 'Combinação veloz de golpes leves em sequência para roubar o round nos pontos.',
    category: 'combinacoes',
    objective: 'combinacao',
    allowedDistances: ['media', 'curta', 'cordas'],
    basePower: 14,
    bodyDamage: 7,
    guardDamage: 15,
    stunPower: 10,
    accuracyMod: 0.16,
    pointWeight: 2.7,
    staminaCost: 15,
    durationSeconds: 8,
    relevantAttributes: ['punchSpeed', 'technique', 'stamina']
  },

  // =====================================================================
  // 5. DEFESAS & ESQUIVAS
  // =====================================================================
  {
    id: 'box_guarda_alta',
    displayName: 'Guarda Fechada Dupla',
    shortDesc: 'Fecha os antebraços sobre têmporas e queixo, absorvendo golpes e recompondo gás.',
    category: 'defesas_esquivas',
    objective: 'defesa_guarda',
    allowedDistances: ['longa', 'media', 'curta', 'cordas'],
    basePower: 0,
    bodyDamage: 0,
    guardDamage: 0,
    stunPower: 0,
    accuracyMod: 0,
    pointWeight: 0.2,
    staminaCost: 0,
    durationSeconds: 7,
    defensiveMitigation: 0.72,
    relevantAttributes: ['defense', 'durability', 'mentalFocus']
  },
  {
    id: 'box_slip_contra',
    displayName: 'Slip Lateral + Direto de Contra',
    shortDesc: 'Desvia a cabeça milímetros para fora do jab/direto e dispara resposta imediata.',
    category: 'defesas_esquivas',
    objective: 'esquiva_contra',
    allowedDistances: ['longa', 'media', 'cordas'],
    basePower: 16,
    bodyDamage: 0,
    guardDamage: 10,
    stunPower: 22,
    accuracyMod: 0.1,
    pointWeight: 2.3,
    staminaCost: 11,
    durationSeconds: 8,
    counterBonusAgainst: ['golpe_reto', 'combinacao'],
    defensiveMitigation: 0.78,
    allowsCounterStrike: true,
    relevantAttributes: ['defense', 'footwork', 'punchSpeed']
  },
  {
    id: 'box_pendulum_contra',
    displayName: 'Pêndulo (Bob & Weave) + Gancho',
    shortDesc: 'Mergulha em U sob cruzados altos e sobe com gancho limpo na curta distância.',
    category: 'defesas_esquivas',
    objective: 'esquiva_contra',
    allowedDistances: ['media', 'curta', 'cordas'],
    basePower: 18,
    bodyDamage: 6,
    guardDamage: 12,
    stunPower: 23,
    accuracyMod: 0.06,
    pointWeight: 2.35,
    staminaCost: 13,
    durationSeconds: 8,
    counterBonusAgainst: ['golpe_poder_alto', 'combinacao'],
    defensiveMitigation: 0.75,
    allowsCounterStrike: true,
    nextDistanceOnSuccess: 'curta',
    relevantAttributes: ['defense', 'footwork', 'punchPower']
  },
  {
    id: 'box_shoulder_roll',
    displayName: 'Shoulder Roll (Philly Shell)',
    shortDesc: 'Desvia cruzados com o ombro adiantado e responde com direto seco no queixo.',
    category: 'defesas_esquivas',
    objective: 'esquiva_contra',
    allowedDistances: ['media', 'curta', 'cordas'],
    basePower: 16,
    bodyDamage: 0,
    guardDamage: 11,
    stunPower: 21,
    accuracyMod: 0.08,
    pointWeight: 2.4,
    staminaCost: 10,
    durationSeconds: 8,
    counterBonusAgainst: ['golpe_reto', 'golpe_poder_alto'],
    defensiveMitigation: 0.82,
    allowsCounterStrike: true,
    relevantAttributes: ['defense', 'technique', 'mentalFocus']
  },
  {
    id: 'box_pull_back_contra',
    displayName: 'Pull-Back + Cruzado de Contra',
    shortDesc: 'Recua o tronco centímetros para fazer o golpe passar no vazio e contra-ataca.',
    category: 'defesas_esquivas',
    objective: 'esquiva_contra',
    allowedDistances: ['longa', 'media'],
    basePower: 18,
    bodyDamage: 0,
    guardDamage: 12,
    stunPower: 24,
    accuracyMod: 0.07,
    pointWeight: 2.45,
    staminaCost: 12,
    durationSeconds: 8,
    counterBonusAgainst: ['golpe_reto', 'golpe_poder_alto'],
    defensiveMitigation: 0.78,
    allowsCounterStrike: true,
    nextDistanceOnSuccess: 'longa',
    relevantAttributes: ['footwork', 'defense', 'mentalFocus']
  },
  {
    id: 'box_amarrar_clinch',
    displayName: 'Amarrar no Clinch (Sobrevivência)',
    shortDesc: 'Fecha os braços no tronco do oponente para frear pressão e recuperar o queixo.',
    category: 'defesas_esquivas',
    objective: 'clinch',
    allowedDistances: ['media', 'curta', 'clinch', 'cordas'],
    basePower: 2,
    bodyDamage: 2,
    guardDamage: 0,
    stunPower: 0,
    accuracyMod: 0.18,
    pointWeight: 0.25,
    staminaCost: 4,
    durationSeconds: 8,
    defensiveMitigation: 0.65,
    nextDistanceOnSuccess: 'clinch',
    relevantAttributes: ['durability', 'defense', 'mentalFocus']
  },

  // =====================================================================
  // 6. MOVIMENTAÇÃO & CONTROLE DE RINGUE
  // =====================================================================
  {
    id: 'box_fechar_distancia',
    displayName: 'Entrar no Pocket (Fechar Distância)',
    shortDesc: 'Avança cortando o ângulo com guarda alta para encurtar e buscar o infight.',
    category: 'movimentacao',
    objective: 'corte_ringue',
    allowedDistances: ['longa', 'media'],
    basePower: 4,
    bodyDamage: 2,
    guardDamage: 5,
    stunPower: 3,
    accuracyMod: 0.16,
    pointWeight: 0.9,
    staminaCost: 9,
    durationSeconds: 7,
    defensiveMitigation: 0.4,
    nextDistanceOnSuccess: 'curta',
    relevantAttributes: ['footwork', 'stamina', 'defense']
  },
  {
    id: 'box_cortar_ringue',
    displayName: 'Cortar o Ringue (Empurrar p/ Cordas)',
    shortDesc: 'Bloqueia as saídas laterais com passos em L e empurra o rival contra as cordas.',
    category: 'movimentacao',
    objective: 'corte_ringue',
    allowedDistances: ['longa', 'media', 'curta'],
    basePower: 7,
    bodyDamage: 3,
    guardDamage: 8,
    stunPower: 6,
    accuracyMod: 0.1,
    pointWeight: 1.4,
    staminaCost: 11,
    durationSeconds: 8,
    pushesToRopes: true,
    nextDistanceOnSuccess: 'cordas',
    relevantAttributes: ['footwork', 'technique', 'mentalFocus']
  },
  {
    id: 'box_step_back_jab',
    displayName: 'Step-Back com Jab (Controlar Espaço)',
    shortDesc: 'Recua rápido mantendo a distância longa favorável e pontua no avanço rival.',
    category: 'movimentacao',
    objective: 'golpe_reto',
    allowedDistances: ['media', 'curta', 'cordas'],
    basePower: 8,
    bodyDamage: 0,
    guardDamage: 5,
    stunPower: 6,
    accuracyMod: 0.15,
    pointWeight: 1.45,
    staminaCost: 9,
    durationSeconds: 7,
    defensiveMitigation: 0.45,
    nextDistanceOnSuccess: 'longa',
    ropeEscapeBonus: true,
    relevantAttributes: ['footwork', 'punchSpeed', 'technique']
  },
  {
    id: 'box_circular_cordas',
    displayName: 'Circular e Sair das Cordas',
    shortDesc: 'Gira rápido com guarda fechada para recuperar o centro do ringue sem apanhar.',
    category: 'movimentacao',
    objective: 'recuperacao',
    allowedDistances: ['curta', 'cordas', 'media'],
    basePower: 3,
    bodyDamage: 0,
    guardDamage: 2,
    stunPower: 2,
    accuracyMod: 0.22,
    pointWeight: 0.8,
    staminaCost: 8,
    durationSeconds: 7,
    defensiveMitigation: 0.58,
    nextDistanceOnSuccess: 'media',
    ropeEscapeBonus: true,
    relevantAttributes: ['footwork', 'defense', 'stamina']
  },
  {
    id: 'box_quebrar_clinch',
    displayName: 'Quebrar Clinch com Soco na Saída',
    shortDesc: 'Cria espaço empurrando o ombro do rival e solta golpe limpo na separação.',
    category: 'movimentacao',
    objective: 'golpe_poder_alto',
    allowedDistances: ['clinch'],
    basePower: 11,
    bodyDamage: 4,
    guardDamage: 9,
    stunPower: 11,
    accuracyMod: 0.18,
    pointWeight: 1.3,
    staminaCost: 10,
    durationSeconds: 7,
    nextDistanceOnSuccess: 'media',
    relevantAttributes: ['punchPower', 'footwork', 'technique']
  }
];

export const BOXING_TECHNIQUES_CATALOG: Record<string, BoxingTechnique> = Object.fromEntries(
  BOXING_TECHNIQUE_LIST.map((t) => [t.id, t])
);

export const BOXING_CATEGORY_LABELS: Record<BoxingTechniqueCategory, string> = {
  jabs_diretos: 'Jabs & Diretos',
  cruzados_ganchos: 'Cruzados & Ganchos',
  uppers_corpo: 'Uppers & Corpo',
  combinacoes: 'Combinações',
  defesas_esquivas: 'Defesa & Esquiva',
  movimentacao: 'Movimentação'
};

export const BOXING_AI_STYLE_META: Record<
  BoxingAiStyle,
  { label: string; desc: string }
> = {
  boxer_tecnico: {
    label: 'Out-Boxer Técnico',
    desc: 'Controla distância com jabs, combinações 1-2 e jogo de pernas limpo.'
  },
  slugger_pegador: {
    label: 'Slugger Pegador',
    desc: 'Caça o nocaute com cruzados pesados, overhands e pressão contínua.'
  },
  swarmer_pressao: {
    label: 'Swarmer de Pressão',
    desc: 'Encurta espaço sem parar, corta o ringue e castiga o corpo no infight.'
  },
  counter_puncher: {
    label: 'Counter-Puncher',
    desc: 'Lê o ataque rival com slips, shoulder roll e contragolpes cirúrgicos.'
  },
  inside_fighter: {
    label: 'Infighter de Curta',
    desc: 'Trabalha cabeça com cabeça usando ganchos no fígado e uppercuts curtos.'
  },
  completo: {
    label: 'Pugilista Completo',
    desc: 'Alterna distância longa, contragolpe e pressão conforme o placar dos rounds.'
  }
};

export const BOXING_PERSONALITY_META: Record<
  BoxingPersonality,
  { label: string }
> = {
  agressivo: { label: 'Agressivo' },
  paciente: { label: 'Paciente' },
  estrategico: { label: 'Estratégico' },
  impulsivo: { label: 'Impulsivo' },
  confiante: { label: 'Confiante' },
  cauteloso: { label: 'Cauteloso' }
};
