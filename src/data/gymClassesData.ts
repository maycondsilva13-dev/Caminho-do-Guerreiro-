import { GymClassTurma } from '../types/agenda';
import { buildRegionalGymTurmas } from './regionalGymsCatalog';

/**
 * Catálogo Oficial de Turmas e Aulas das Academias do Mundo (WORLD_GYMS).
 * Respeita estritamente as academias existentes, seus mestres, modalidades cadastradas
 * e requisitos de progressão. Nenhuma academia ou modalidade fictícia foi inventada.
 */
export const AVAILABLE_TURMAS: GymClassTurma[] = [
  // ============================================================================
  // 1. Academia Força & Honra do Bairro (Mestre Tião) - Centro Poliesportivo (+30% XP)
  // ============================================================================
  {
    id: 'turma_bairro_jj_iniciante',
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    art: 'jiujitsu',
    instructorName: 'Mestre Tião',
    title: 'Jiu-Jitsu: Fundamentos & Defesa Pessoal',
    description: 'Postura básica, guarda fechada e raspagens no tatame de lona tradicional.',
    daysOfWeek: ['segunda', 'quarta', 'sexta'],
    block: 'noite',
    pointsCost: 1,
    classType: 'regular',
    status: 'aberta',
    prerequisites: {
      minRank: 0,
      minFightIq: 0,
      reputationReq: 0
    }
  },
  {
    id: 'turma_bairro_boxe_matinal',
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    art: 'boxe',
    instructorName: 'Mestre Tião',
    title: 'Boxe: Fundamentos & Saco Pesado',
    description: 'Jab, direto, esquivas básicas e trabalho respiratório nas primeiras horas do dia.',
    daysOfWeek: ['terca', 'quinta'],
    block: 'manha',
    pointsCost: 1,
    classType: 'regular',
    status: 'aberta',
    prerequisites: {
      minRank: 0,
      minFightIq: 0,
      reputationReq: 0
    }
  },
  {
    id: 'turma_bairro_muaythai_noite',
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    art: 'muaythai',
    instructorName: 'Mestre Tião',
    title: 'Muay Thai: Chutes & Clinch Tradicional',
    description: 'Golpes de cotovelo, joelhadas e calejamento no saco de pancada rústico.',
    daysOfWeek: ['terca', 'quinta'],
    block: 'noite',
    pointsCost: 1,
    classType: 'regular',
    status: 'aberta',
    prerequisites: {
      minRank: 0,
      minFightIq: 0,
      reputationReq: 0
    }
  },
  {
    id: 'turma_bairro_judo_tarde',
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    art: 'judo',
    instructorName: 'Mestre Tião',
    title: 'Judô: Quedas & Pegadas de Quimono',
    description: 'Ukemi (rolamentos defensivos), Osoto Gari e base sólida para o solo.',
    daysOfWeek: ['segunda', 'quarta'],
    block: 'tarde',
    pointsCost: 1,
    classType: 'regular',
    status: 'aberta',
    prerequisites: {
      minRank: 0,
      minFightIq: 0,
      reputationReq: 0
    }
  },
  {
    id: 'turma_bairro_capoeira_sabado',
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    art: 'capoeira',
    instructorName: 'Mestre Tião',
    title: 'Capoeira: Roda Comunitária & Ginga',
    description: 'Ginga ritmada, queixadas, esquivas baixas e musicalidade no final de semana.',
    daysOfWeek: ['sabado'],
    block: 'tarde',
    pointsCost: 1,
    classType: 'regular',
    status: 'aberta',
    prerequisites: {
      minRank: 0,
      minFightIq: 0,
      reputationReq: 0
    }
  },
  {
    id: 'turma_bairro_lle_estendido',
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    art: 'lutalivre',
    instructorName: 'Mestre Tião',
    title: 'Luta Livre Esportiva: Sprawl & Baiana Rápida',
    description: 'Treino duplo estendido no tatame sem quimono com quedas e transições para finalizações.',
    daysOfWeek: ['sexta'],
    block: 'noite',
    pointsCost: 2,
    classType: 'estendida',
    status: 'aberta',
    prerequisites: {
      minRank: 0,
      minFightIq: 5,
      reputationReq: 0
    }
  },
  {
    id: 'turma_bairro_karate_kihon',
    gymId: 'gym_bairro',
    gymName: 'Academia Força & Honra do Bairro',
    art: 'karate',
    instructorName: 'Mestre Tião',
    title: 'Karatê-Do: Kihon, Kata & Base',
    description: 'Posturas tradicionais, socos em linha, chutes frontais e disciplina marcial matinal.',
    daysOfWeek: ['sabado'],
    block: 'manha',
    pointsCost: 1,
    classType: 'regular',
    status: 'aberta',
    prerequisites: {
      minRank: 0,
      minFightIq: 0,
      reputationReq: 0
    }
  },

  // ============================================================================
  // 2. Templo Carioca da Arte Suave (Grande Mestre Augusto Nogueira) - Especializada (+50% XP)
  // ============================================================================
  {
    id: 'turma_gracie_alavanca_matinal',
    gymId: 'gym_gracie_rio',
    gymName: 'Templo Carioca da Arte Suave',
    art: 'jiujitsu',
    instructorName: 'Grande Mestre Augusto Nogueira',
    title: 'BJJ Puro: Ciência das Alavancas & Pressão',
    description: 'Passagem de guarda justa, estrangulamentos na lapela e domínio posicional clássico.',
    daysOfWeek: ['segunda', 'quarta', 'sexta'],
    block: 'manha',
    pointsCost: 1,
    classType: 'regular',
    status: 'aberta',
    prerequisites: {
      minRank: 1,
      minFightIq: 18,
      reputationReq: 30
    }
  },
  {
    id: 'turma_gracie_sparring_estendido',
    gymId: 'gym_gracie_rio',
    gymName: 'Templo Carioca da Arte Suave',
    art: 'jiujitsu',
    instructorName: 'Grande Mestre Augusto Nogueira',
    title: 'BJJ Avançado: Rolo Livre & Raspagens Cirúrgicas',
    description: 'Sessão estendida de alta rotação contra faixas pretas e marrons de elite.',
    daysOfWeek: ['terca', 'quinta'],
    block: 'noite',
    pointsCost: 2,
    classType: 'estendida',
    status: 'aberta',
    prerequisites: {
      minRank: 1,
      minFightIq: 22,
      reputationReq: 40
    }
  },
  {
    id: 'turma_gracie_judo_transicao',
    gymId: 'gym_gracie_rio',
    gymName: 'Templo Carioca da Arte Suave',
    art: 'judo',
    instructorName: 'Sensei Flávio Yamashita',
    title: 'Judô Ne-Waza & Transições para o Solo',
    description: 'Quedas com quimono projetadas para cair montado ou pegando as costas.',
    daysOfWeek: ['sabado'],
    block: 'manha',
    pointsCost: 1,
    classType: 'regular',
    status: 'aberta',
    prerequisites: {
      minRank: 1,
      minFightIq: 18,
      reputationReq: 30
    }
  },

  // ============================================================================
  // 3. Siam Thunder Muay Thai & MMA Camp (Kru Somchai "Trovão") - Especializada (+50% XP)
  // ============================================================================
  {
    id: 'turma_tiger_muaythai_tradicional',
    gymId: 'gym_tiger_phuket',
    gymName: 'Siam Thunder Muay Thai & MMA Camp',
    art: 'muaythai',
    instructorName: 'Kru Somchai "Trovão"',
    title: 'Muay Thai Tradicional & Calejamento de Canela',
    description: 'Centenas de chutes nos aparadores, corrida matinal nas colinas e clinch tailandês.',
    daysOfWeek: ['segunda', 'quarta', 'sexta'],
    block: 'manha',
    pointsCost: 1,
    classType: 'regular',
    status: 'aberta',
    prerequisites: {
      minRank: 2,
      minFightIq: 25,
      reputationReq: 80
    }
  },
  {
    id: 'turma_tiger_mma_estendido',
    gymId: 'gym_tiger_phuket',
    gymName: 'Siam Thunder Muay Thai & MMA Camp',
    art: 'mma',
    instructorName: 'Kru Somchai "Trovão"',
    title: 'MMA Striking & Defesa de Quedas Extrema',
    description: 'Sessão estendida combinando cotoveladas devastadoras e sprawl sob calor tropical.',
    daysOfWeek: ['terca', 'quinta'],
    block: 'tarde',
    pointsCost: 2,
    classType: 'estendida',
    status: 'aberta',
    prerequisites: {
      minRank: 2,
      minFightIq: 28,
      reputationReq: 90
    }
  },

  // ============================================================================
  // 4. Sunset Boulevard Boxing Club (Coach Arthur "Olho de Águia" Vance) - Especializada (+50% XP)
  // ============================================================================
  {
    id: 'turma_wildcard_pendulo_matinal',
    gymId: 'gym_wild_card_la',
    gymName: 'Sunset Boulevard Boxing Club',
    art: 'boxe',
    instructorName: 'Coach Arthur "Olho de Águia" Vance',
    title: 'Boxe de Precisão: Pêndulo Fantasma & Ângulos',
    description: 'Jogo de pernas, contragolpes de esquerda e ritmo implacável de ringue.',
    daysOfWeek: ['segunda', 'quarta', 'sexta'],
    block: 'manha',
    pointsCost: 1,
    classType: 'regular',
    status: 'aberta',
    prerequisites: {
      minRank: 2,
      minFightIq: 28,
      reputationReq: 90
    }
  },
  {
    id: 'turma_wildcard_manoplas_estendida',
    gymId: 'gym_wild_card_la',
    gymName: 'Sunset Boulevard Boxing Club',
    art: 'boxe',
    instructorName: 'Coach Arthur "Olho de Águia" Vance',
    title: 'Boxe Pro: Manoplas de 10 Rounds & Sparring',
    description: 'Treino estendido com sparrings profissionais de campeonato mundial.',
    daysOfWeek: ['terca', 'quinta'],
    block: 'tarde',
    pointsCost: 2,
    classType: 'estendida',
    status: 'aberta',
    prerequisites: {
      minRank: 2,
      minFightIq: 32,
      reputationReq: 100
    }
  },

  // ============================================================================
  // 5. Caucasus Iron Peak Sambo & Grappling Base (Coach Magomed Rasulov) - Especializada (+50% XP)
  // ============================================================================
  {
    id: 'turma_dagestan_lle_base',
    gymId: 'gym_dagestan_mountains',
    gymName: 'Caucasus Iron Peak Sambo & Grappling Base',
    art: 'lutalivre',
    instructorName: 'Coach Magomed Rasulov',
    title: 'Luta Livre & Grappling de Montanha: Sprawl & Baiana',
    description: 'Pegada de pernas ininterrupta, condicionamento no solo sem quimono e controle por cima.',
    daysOfWeek: ['segunda', 'quarta', 'sexta'],
    block: 'manha',
    pointsCost: 1,
    classType: 'regular',
    status: 'aberta',
    prerequisites: {
      minRank: 2,
      minFightIq: 32,
      reputationReq: 120
    }
  },
  {
    id: 'turma_dagestan_sambo_estendido',
    gymId: 'gym_dagestan_mountains',
    gymName: 'Caucasus Iron Peak Sambo & Grappling Base',
    art: 'mma',
    instructorName: 'Coach Magomed Rasulov',
    title: 'Sambo de Combate: Ground and Pound Implacável',
    description: 'Sessão estendida dominando o adversário no solo com quedas e pressão sem respiro.',
    daysOfWeek: ['terca', 'quinta'],
    block: 'tarde',
    pointsCost: 2,
    classType: 'estendida',
    status: 'aberta',
    prerequisites: {
      minRank: 2,
      minFightIq: 35,
      reputationReq: 130
    }
  },

  // ============================================================================
  // 6. Instituto Budōkaku de Tóquio (Sensei Kenji Takahashi) - Especializada (+50% XP)
  // ============================================================================
  {
    id: 'turma_kodokan_kuzushi_matinal',
    gymId: 'gym_kodokan_tokyo',
    gymName: 'Instituto Budōkaku de Tóquio',
    art: 'judo',
    instructorName: 'Sensei Kenji Takahashi (8º Dan)',
    title: 'Judô Clássico: Kuzushi & Ippon Perfeito',
    description: 'Uchikomi repetitivo, postura tradicional e o ápice da técnica de arremesso limpo.',
    daysOfWeek: ['segunda', 'quarta', 'sexta'],
    block: 'manha',
    pointsCost: 1,
    classType: 'regular',
    status: 'aberta',
    prerequisites: {
      minRank: 2,
      minFightIq: 30,
      reputationReq: 110
    }
  },
  {
    id: 'turma_kodokan_randori_estendido',
    gymId: 'gym_kodokan_tokyo',
    gymName: 'Instituto Budōkaku de Tóquio',
    art: 'judo',
    instructorName: 'Sensei Kenji Takahashi (8º Dan)',
    title: 'Randori Avançado: Combate Livre Contínuo',
    description: 'Sessão dupla de lutas livres no tatame tradicional com os melhores judocas do Japão.',
    daysOfWeek: ['terca', 'quinta'],
    block: 'tarde',
    pointsCost: 2,
    classType: 'estendida',
    status: 'aberta',
    prerequisites: {
      minRank: 2,
      minFightIq: 34,
      reputationReq: 120
    }
  },

  // ============================================================================
  // 7. Terreiro da Malícia & Capoeira Angola (Mestre Roque da Lapa) - Especializada (+50% XP)
  // ============================================================================
  {
    id: 'turma_terreiro_angola_noite',
    gymId: 'gym_terreiro_salvador',
    gymName: 'Terreiro da Malícia & Capoeira Angola',
    art: 'capoeira',
    instructorName: 'Mestre Roque da Lapa',
    title: 'Capoeira Angola: Mandinga, Rasteiras & Jogo Baixo',
    description: 'Jogo no chão, cantoria, berimbau e a essência da malícia da Bahia.',
    daysOfWeek: ['segunda', 'quarta', 'sexta'],
    block: 'noite',
    pointsCost: 1,
    classType: 'regular',
    status: 'aberta',
    prerequisites: {
      minRank: 1,
      minFightIq: 15,
      reputationReq: 25
    }
  },
  {
    id: 'turma_terreiro_acrobacias_estendida',
    gymId: 'gym_terreiro_salvador',
    gymName: 'Terreiro da Malícia & Capoeira Angola',
    art: 'capoeira',
    instructorName: 'Mestre Roque da Lapa',
    title: 'Capoeira Regional: Floreios, Saltos & Martelos',
    description: 'Treino estendido focado em flexibilidade elástica e chutes circulares de contragolpe.',
    daysOfWeek: ['sabado'],
    block: 'tarde',
    pointsCost: 2,
    classType: 'estendida',
    status: 'aberta',
    prerequisites: {
      minRank: 1,
      minFightIq: 20,
      reputationReq: 35
    }
  },

  // ============================================================================
  // 8. Apex Atlantic Octagon Facility (Head Coach Bento Silveira) - Centro Poliesportivo (+30% XP)
  // ============================================================================
  {
    id: 'turma_att_mma_transicoes_estendida',
    gymId: 'gym_american_top_team',
    gymName: 'Apex Atlantic Octagon Facility',
    art: 'mma',
    instructorName: 'Head Coach Bento Silveira',
    title: 'MMA Moderno: Transições de Grade & Solo no Octógono',
    description: 'Treino estendido de alto rendimento com sparrings de 5 rounds e tecnologia de ponta.',
    daysOfWeek: ['segunda', 'quarta', 'sexta'],
    block: 'tarde',
    pointsCost: 2,
    classType: 'estendida',
    status: 'aberta',
    prerequisites: {
      minRank: 3,
      minFightIq: 45,
      reputationReq: 200
    }
  },
  {
    id: 'turma_att_lle_cage',
    gymId: 'gym_american_top_team',
    gymName: 'Apex Atlantic Octagon Facility',
    art: 'lutalivre',
    instructorName: 'Coach Sergei Petrov',
    title: 'LLE & No-Gi para MMA: Defesa de Grade & Guilhotina',
    description: 'Treinamento específico de Luta Livre Esportiva sem quimono adaptado às dimensões do octógono oficial.',
    daysOfWeek: ['terca', 'quinta'],
    block: 'manha',
    pointsCost: 1,
    classType: 'regular',
    status: 'aberta',
    prerequisites: {
      minRank: 3,
      minFightIq: 45,
      reputationReq: 200
    }
  },
  ...buildRegionalGymTurmas()
];

export function getTurmasByGym(gymId: string): GymClassTurma[] {
  return AVAILABLE_TURMAS.filter((t) => t.gymId === gymId);
}

export function getTurmaById(turmaId: string): GymClassTurma | undefined {
  return AVAILABLE_TURMAS.find((t) => t.id === turmaId);
}
