import {
  EquipmentItem,
  EquipmentQualityTier,
  EquipmentSlot,
  FighterAttributes
} from '../types/game';

export interface EquipmentSlotMeta {
  id: EquipmentSlot;
  label: string;
  shortLabel: string;
  description: string;
  order: number;
}

export const EQUIPMENT_SLOT_META: Record<EquipmentSlot, EquipmentSlotMeta> = {
  vestuario: {
    id: 'vestuario',
    label: 'Kimonos & No-Gi',
    shortLabel: 'Vestuário',
    description: 'Kimonos trançados oficiais e conjuntos de compressão para grappling.',
    order: 1
  },
  luvas: {
    id: 'luvas',
    label: 'Luvas de Combate',
    shortLabel: 'Luvas',
    description: 'Luvas de Boxe, Muay Thai e MMA para treino pesado e combate.',
    order: 2
  },
  bucal: {
    id: 'bucal',
    label: 'Protetor Bucal',
    shortLabel: 'Bucal',
    description: 'Proteção de arcada dentária, absorção de impacto e fluxo respiratório.',
    order: 3
  },
  protecao: {
    id: 'protecao',
    label: 'Proteções de Sparring',
    shortLabel: 'Proteções',
    description: 'Caneleiras, capacetes e coquilhas para reduzir riscos de lesão.',
    order: 4
  },
  acessorio: {
    id: 'acessorio',
    label: 'Acessórios & Preparação',
    shortLabel: 'Acessórios',
    description: 'Bandagens elásticas, cordas de velocidade e itens de suporte técnico.',
    order: 5
  }
};

export interface EquipmentTierMeta {
  id: EquipmentQualityTier;
  label: string;
  rank: number;
  textClass: string;
  accentBorderClass: string;
}

export const EQUIPMENT_TIER_META: Record<EquipmentQualityTier, EquipmentTierMeta> = {
  basico: {
    id: 'basico',
    label: 'Iniciante',
    rank: 1,
    textClass: 'text-neutral-300',
    accentBorderClass: 'border-neutral-700'
  },
  intermediario: {
    id: 'intermediario',
    label: 'Intermediário',
    rank: 2,
    textClass: 'text-sky-400',
    accentBorderClass: 'border-sky-500/40'
  },
  profissional: {
    id: 'profissional',
    label: 'Profissional',
    rank: 3,
    textClass: 'text-amber-400',
    accentBorderClass: 'border-amber-500/50'
  },
  elite: {
    id: 'elite',
    label: 'Elite Mundial',
    rank: 4,
    textClass: 'text-emerald-400',
    accentBorderClass: 'border-emerald-500/50'
  }
};

export const ATTRIBUTE_SHORT_LABELS: Record<keyof FighterAttributes, string> = {
  strength: 'Força',
  speed: 'Velocidade',
  stamina: 'Gás',
  durability: 'Queixo',
  flexibility: 'Flexibilidade',
  fightIq: 'QI de Luta',
  technique: 'Técnica',
  mentalFocus: 'Foco Mental'
};

/**
 * Catálogo extensível de equipamentos.
 * Para expandir no futuro, basta adicionar novos objetos respeitando EquipmentItem.
 * A relação qualidade -> preço -> bônus de atributos segue progressão consistente.
 */
export const EQUIPMENT_CATALOG: EquipmentItem[] = [
  // ============================================================================
  // VESTUÁRIO (KIMONOS & NO-GI)
  // ============================================================================
  {
    id: 'kimono_branco_essencial',
    name: 'Kimono Trançado Iniciante Branco',
    brand: 'Tatame Raiz',
    slot: 'vestuario',
    tier: 'basico',
    price: 180,
    description: 'Kimono clássico em algodão trançado leve 350gsm com faixa branca inclusa e corte tradicional confortável.',
    specs: 'Algodão 350gsm · Pré-encolhido · Padrão branco oficial',
    artAffinity: ['jiujitsu', 'judo', 'karate'],
    isGiColor: 'branco',
    attributeBonuses: {
      technique: 1,
      durability: 1
    },
    trainingXpBonusPct: 2,
    imagePath: '/src/assets/images/kimono_branco_iniciante_1794925270122.jpg'
  },
  {
    id: 'rashguard_nogi_impacto',
    name: 'Conjunto Rashguard & Shorts No-Gi',
    brand: 'Forja Atlética',
    slot: 'vestuario',
    tier: 'intermediario',
    price: 340,
    description: 'Malha compressiva respirável em preto e carmesim acompanhada de bermuda ripstop de abertura lateral livre.',
    specs: 'Poliamida compressiva + Ripstop · Costura plana anti-atrito',
    artAffinity: ['jiujitsu', 'lutalivre', 'mma'],
    attributeBonuses: {
      speed: 2,
      stamina: 2,
      flexibility: 1
    },
    trainingXpBonusPct: 4,
    imagePath: '/src/assets/images/rashguard_nogi_pro_1794925270868.jpg'
  },
  {
    id: 'kimono_azul_competicao',
    name: 'Kimono Pearl Weave Competição Azul',
    brand: 'Kombate Sul',
    slot: 'vestuario',
    tier: 'profissional',
    price: 690,
    description: 'Armadura azul royal 450gsm com lapela firme em EVA, calça ripstop reforçada e ajuste atlético homologado.',
    specs: 'Pearl Weave 450gsm · Calça Ripstop · Homologado CBJJ',
    artAffinity: ['jiujitsu', 'judo'],
    isGiColor: 'azul',
    attributeBonuses: {
      technique: 3,
      durability: 2,
      flexibility: 2,
      fightIq: 1
    },
    trainingXpBonusPct: 7,
    imagePath: '/src/assets/images/kimono_azul_competicao_1794925271133.jpg'
  },
  {
    id: 'kimono_preto_elite',
    name: 'Kimono Ouro Negro Edição Campeonato',
    brand: 'Samurai do Brasil',
    slot: 'vestuario',
    tier: 'elite',
    price: 1480,
    description: 'Kimono preto fosco 550gsm de alto rendimento com costura dupla dourada, dificultando pegadas e maximizando alavancas.',
    specs: 'Heavy Pearl Weave 550gsm · Costura dupla dourada · Corte Elite',
    artAffinity: ['jiujitsu', 'judo'],
    isGiColor: 'preto',
    attributeBonuses: {
      technique: 5,
      durability: 4,
      strength: 2,
      mentalFocus: 2
    },
    trainingXpBonusPct: 12,
    imagePath: '/src/assets/images/kimono_preto_elite_1794925300110.jpg'
  },

  // ============================================================================
  // LUVAS (BOXE, MUAY THAI, MMA)
  // ============================================================================
  {
    id: 'luvas_boxe_treino_12oz',
    name: 'Luva de Boxe Treino 12oz',
    brand: 'Punho Urbano',
    slot: 'luvas',
    tier: 'basico',
    price: 160,
    description: 'Luva vermelha clássica de treino em couro sintético resistente com munhequeira larga em velcro.',
    specs: '12oz · Espuma injetada · Fecho largo em velcro',
    artAffinity: ['boxe', 'muaythai'],
    attributeBonuses: {
      strength: 1,
      durability: 1
    },
    injuryReductionPct: 3,
    imagePath: '/src/assets/images/luvas_boxe_treino_1794925272566.jpg'
  },
  {
    id: 'luvas_mma_sparring_4oz',
    name: 'Luva MMA 4oz Dedos Livres',
    brand: 'Octógono Lab',
    slot: 'luvas',
    tier: 'intermediario',
    price: 390,
    description: 'Luva preta com detalhes bronze pré-curvada, permitindo socar com potência sem perder mobilidade nas pegadas.',
    specs: '4oz · Couro legítimo · Palma aberta ergonômica',
    artAffinity: ['mma', 'lutalivre', 'jiujitsu'],
    attributeBonuses: {
      speed: 2,
      technique: 2,
      strength: 1
    },
    injuryReductionPct: 5,
    imagePath: '/src/assets/images/luvas_mma_sparring_1794925271596.jpg'
  },
  {
    id: 'luvas_boxe_couro_pro',
    name: 'Luva Profissional Couro Bordô Cadarço',
    brand: 'Nobre Arte Artesanal',
    slot: 'luvas',
    tier: 'profissional',
    price: 820,
    description: 'Luva profissional confeccionada em couro bovino bordô com amarração em cadarço para encaixe cirúrgico do punho.',
    specs: '10oz Pro · Couro legítimo bordô · Estabilização por cadarço',
    artAffinity: ['boxe', 'mma'],
    attributeBonuses: {
      strength: 3,
      speed: 2,
      technique: 2,
      durability: 1
    },
    injuryReductionPct: 8,
    trainingXpBonusPct: 5,
    imagePath: '/src/assets/images/luvas_boxe_couro_pro_1794925270518.jpg'
  },
  {
    id: 'luvas_muaythai_elite',
    name: 'Luva Muay Thai Artesanal Marinho & Ouro',
    brand: 'Templo Nak Muay',
    slot: 'luvas',
    tier: 'elite',
    price: 1560,
    description: 'Feita à mão com couro selecionado marinho e dourado, punho acolchoado denso para bloquear chutes e dominar o clinch.',
    specs: '14oz Thai Handmade · Punho acolchoado · Couro nobre',
    artAffinity: ['muaythai', 'boxe', 'karate'],
    attributeBonuses: {
      strength: 4,
      durability: 4,
      technique: 3,
      speed: 2
    },
    injuryReductionPct: 12,
    trainingXpBonusPct: 8,
    imagePath: '/src/assets/images/luvas_muaythai_elite_1794925272975.jpg'
  },

  // ============================================================================
  // PROTETORES BUCAIS
  // ============================================================================
  {
    id: 'protetor_bucal_simples',
    name: 'Protetor Bucal Termomoldável Azul',
    brand: 'Guarda Segura',
    slot: 'bucal',
    tier: 'basico',
    price: 55,
    description: 'Protetor bucal translúcido azul moldável em água quente, acompanhado de estojo ventilado higiênico.',
    specs: 'EVA atóxico camada única · Estojo ventilado incluso',
    attributeBonuses: {
      durability: 1
    },
    injuryReductionPct: 4,
    imagePath: '/src/assets/images/protetor_bucal_basico_1794925270994.jpg'
  },
  {
    id: 'protetor_bucal_gel_pro',
    name: 'Protetor Bucal Gel Blindado Pro',
    brand: 'Apex Impacto',
    slot: 'bucal',
    tier: 'profissional',
    price: 580,
    description: 'Estrutura blindada preto e ouro com núcleo em gel absorvedor de impacto e canais frontais para respirar no limite.',
    specs: 'Dupla densidade + Gel · Canais de ar · Estojo rígido anodizado',
    attributeBonuses: {
      durability: 3,
      stamina: 2,
      mentalFocus: 2
    },
    injuryReductionPct: 12,
    imagePath: '/src/assets/images/protetor_bucal_gel_pro_1794925274016.jpg'
  },

  // ============================================================================
  // PROTEÇÕES DE SPARRING
  // ============================================================================
  {
    id: 'coquilha_carbono_pro',
    name: 'Coquilha Anatômica Fibra de Carbono',
    brand: 'Escudo Tático',
    slot: 'protecao',
    tier: 'intermediario',
    price: 290,
    description: 'Proteção rígida em textura de carbono com suspensório elástico largo, mantendo segurança total sem travar o quadril.',
    specs: 'Concha carbono leve · Cintura elástica anatômica',
    artAffinity: ['muaythai', 'mma', 'karate', 'capoeira'],
    attributeBonuses: {
      durability: 2,
      flexibility: 1,
      mentalFocus: 1
    },
    injuryReductionPct: 8,
    imagePath: '/src/assets/images/coquilha_atletica_pro_1794925272630.jpg'
  },
  {
    id: 'caneleira_muaythai_couro',
    name: 'Caneleira Muay Thai Couro Anatômica',
    brand: 'Templo Nak Muay',
    slot: 'protecao',
    tier: 'profissional',
    price: 650,
    description: 'Par de caneleiras em couro fosco preto e grafite com proteção completa de peito do pé e duplo ajuste firme.',
    specs: 'Espuma alta densidade · Duplo velcro · Curvatura tibial',
    artAffinity: ['muaythai', 'karate', 'mma'],
    attributeBonuses: {
      durability: 3,
      strength: 2,
      speed: 2,
      flexibility: 1
    },
    injuryReductionPct: 12,
    imagePath: '/src/assets/images/caneleira_muaythai_pro_1794925271978.jpg'
  },
  {
    id: 'capacete_sparring_couro_elite',
    name: 'Capacete Sparring Integral Couro Pro',
    brand: 'Nobre Arte Artesanal',
    slot: 'protecao',
    tier: 'elite',
    price: 1320,
    description: 'Capacete fechado em couro legítimo preto com protetor de maçãs e queixo reforçado, preservando ângulo de visão.',
    specs: 'Couro bovino integral · Proteção maxilar · Visão periférica aberta',
    artAffinity: ['boxe', 'muaythai', 'mma'],
    attributeBonuses: {
      durability: 5,
      mentalFocus: 3,
      fightIq: 2,
      stamina: 1
    },
    injuryReductionPct: 18,
    imagePath: '/src/assets/images/capacete_sparring_pro_1794925275298.jpg'
  },

  // ============================================================================
  // ACESSÓRIOS & PREPARAÇÃO
  // ============================================================================
  {
    id: 'bandagem_elastica_par',
    name: 'Par de Bandagens Elásticas 4,5m',
    brand: 'Punho Urbano',
    slot: 'acessorio',
    tier: 'basico',
    price: 65,
    description: 'Par de bandagens preta e vermelha em algodão elástico respirável para estabilizar punhos, polegares e metacarpos.',
    specs: '4,5m · Algodão elástico · Alça de polegar + Velcro',
    artAffinity: ['boxe', 'muaythai', 'mma'],
    attributeBonuses: {
      technique: 1,
      durability: 1
    },
    injuryReductionPct: 4,
    imagePath: '/src/assets/images/bandagem_elastica_boxe_1794925272448.jpg'
  },
  {
    id: 'corda_velocidade_aco',
    name: 'Corda de Velocidade Cabo de Aço',
    brand: 'Forja Atlética',
    slot: 'acessorio',
    tier: 'intermediario',
    price: 240,
    description: 'Corda com cabo de aço revestido e manoplas recartilhadas em alumínio com rolamento duplo para agilidade e gás.',
    specs: 'Alumínio anodizado · Rolamento 360° · Cabo de aço ajustável',
    attributeBonuses: {
      speed: 2,
      stamina: 2,
      flexibility: 1
    },
    trainingXpBonusPct: 4,
    imagePath: '/src/assets/images/corda_velocidade_pro_1794925273792.jpg'
  }
];
