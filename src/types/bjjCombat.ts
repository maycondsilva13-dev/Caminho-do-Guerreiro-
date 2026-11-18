/**
 * CAMINHO DO GUERREIRO: DO TATAME AO OCTÓGONO
 * Módulo Especializado de Jiu-Jitsu Brasileiro (BJJ) — Fase 1: Tipagem Estrutural
 *
 * Define o modelo de representação posicional, atletas, papéis,
 * pegadas e relações de transição entre estados de combate.
 */

/** Identificação neutra dos participantes no tatame */
export type AthleteRole = 'athlete_a' | 'athlete_b' | 'none';

/** Participante ativo do combate */
export type BjjParticipant = 'athlete_a' | 'athlete_b';

/** Situação de vantagem posicional no combate */
export type PositionalAdvantage = 'athlete_a' | 'athlete_b' | 'neutral' | 'contested';

/** As 4 macrocategorias estruturais de posições do Jiu-Jitsu */
export type BjjPositionCategory = 
  | 'em_pe'                     // A. Em pé
  | 'guarda'                    // B. Guardas
  | 'passagem_e_controle'       // C. Passagem e controle por cima
  | 'defesa_e_transicao';       // D. Defesa e transição

/** Natureza tática da posição */
export type BjjPositionNature = 
  | 'neutra'                    // Nenhum atleta possui superioridade clara
  | 'dominante'                 // Um atleta estabeleceu controle ou ameaça iminente
  | 'defensiva'                 // Posição de proteção ou contenção de dano/finalização
  | 'transitoria';              // Instável, dinâmica, disputa imediata de recomposição

/** Nível de estabilidade e retenção da posição */
export type BjjStabilityLevel = 
  | 'muito_baixa'               // Duração de segundos; desfaz-se com facilidade (scrambles)
  | 'baixa'                     // Exige esforço contínuo para manter (disputa de pegadas)
  | 'media'                     // Equilibrada; ambos possuem opções ativas (guarda aberta/aranha)
  | 'alta'                      // Difícil reversão rápida (guarda fechada, 100kg, montada)
  | 'muito_alta';               // Controle dominante com pouca margem de fuga (costas com ganchos)

/** Orientação corporal no espaço tridimensional do tatame */
export type BjjBodyOrientation = 
  | 'em_pe'                     // Ambos os pés no solo
  | 'postura_alta'              // Em pé ou ajoelhado com tronco ereto
  | 'inclinado_frente'          // Tronco projetado à frente em disputa de pegadas
  | 'ajoelhado'                 // Um ou dois joelhos no chão
  | 'sentado'                   // Sentado no tatame com base ativa (butterfly/seated)
  | 'deitado_supino'            // Decúbito dorsal (costas chapadas no chão)
  | 'deitado_prono'             // Decúbito ventral (barriga para baixo)
  | 'deitado_lateral'           // Decúbito lateral (virado de quadril)
  | 'quatro_apoios'             // Posição de tartaruga / quadrupede
  | 'invertido';                // De ponta-cabeça / giro de quadril / berimbolo

/** Controles e pegadas primárias que sustentam a posição */
export type BjjGripType = 
  | 'nenhuma'
  | 'disputa_aberta'
  | 'gola_cruzada'
  | 'gola_mesmo_lado'
  | 'manga_simples'
  | 'dupla_manga'
  | 'gola_e_manga'
  | 'gola_e_calca'
  | 'manga_e_calca'
  | 'faixa_e_calca'
  | 'cinto_seguranca'           // Seatbelt (um braço por cima do ombro, outro por baixo da axila)
  | 'esgrima_simples'           // Underhook
  | 'dupla_esgrima'
  | 'overhook_whizzer'
  | 'clinch_tailandes_pescoco'
  | 'body_lock_cinturado'
  | 'front_headlock'            // Guilhotina / controle de cabeça frontal
  | 'laco_de_manga'             // Guarda laço
  | 'ganchos_costas'            // Dois pés encaixados na virilha pelas costas
  | 'triangulo_corporal'        // Body triangle pelas costas ou fechada
  | 'emaranhamento_pernas';     // Ashi garami / saddle / 50-50

/**
 * Identificadores estáveis e padronizados para todas as 47 posições do catálogo.
 * Os IDs são slugs semânticos independentes de texto de tela para preservação de dados.
 */
export type BjjPositionId =
  // --- A. EM PÉ (9) ---
  | 'stand_neutral'
  | 'stand_grip_fight'
  | 'stand_collar_control'
  | 'stand_sleeve_control'
  | 'stand_clinch'
  | 'stand_body_lock'
  | 'stand_front_headlock'
  | 'stand_back_control'
  | 'stand_takedown_threat'

  // --- B. GUARDAS (16) ---
  | 'guard_closed'
  | 'guard_open'
  | 'guard_butterfly'
  | 'guard_half'
  | 'guard_deep_half'
  | 'guard_de_la_riva'
  | 'guard_reverse_de_la_riva'
  | 'guard_spider'
  | 'guard_lasso'
  | 'guard_x'
  | 'guard_single_leg_x'
  | 'guard_fifty_fifty'
  | 'guard_knee_shield'
  | 'guard_z'
  | 'guard_seated'
  | 'guard_supine'

  // --- C. PASSAGEM E CONTROLE POR CIMA (10) ---
  | 'top_passing_process'
  | 'top_half_guard_control'
  | 'top_side_control'
  | 'top_kesa_gatame'
  | 'top_north_south'
  | 'top_knee_on_belly'
  | 'top_mount'
  | 'top_high_mount'
  | 'top_back_control'
  | 'top_turtle_control'

  // --- D. DEFESA E TRANSIÇÃO (12) ---
  | 'bottom_turtle'
  | 'trans_guard_recovery'
  | 'def_side_control'
  | 'def_mount'
  | 'def_back_control'
  | 'escape_mount'
  | 'escape_side_control'
  | 'escape_back_control'
  | 'trans_scramble'
  | 'trans_reversal'
  | 'def_submission'
  | 'trans_leg_entanglement';

/**
 * Definição canônica de uma posição de Jiu-Jitsu.
 * Modela o estado completo e relacional de ambos os atletas no tatame.
 */
export interface BjjPosition {
  /** Identificador único, imutável e estável */
  id: BjjPositionId;

  /** Nome oficial da posição em português */
  name: string;

  /** Categoria estrutural da posição */
  category: BjjPositionCategory;

  /** Natureza tática da posição */
  nature: BjjPositionNature;

  /** Nível de estabilidade e retenção */
  stability: BjjStabilityLevel;

  /** Atleta que se encontra por cima (ou 'none' para posições em pé/lado a lado) */
  athleteTop: AthleteRole;

  /** Atleta que se encontra por baixo (ou 'none' para posições em pé) */
  athleteBottom: AthleteRole;

  /** Atleta que exerce o controle mecânico ativo */
  controllingAthlete: AthleteRole;

  /** Atleta que está contido ou sob pressão de controle */
  controlledAthlete: AthleteRole;

  /** Lado em vantagem tática ou pontual da posição */
  advantage: PositionalAdvantage;

  /** Orientação postural do Atleta A */
  orientationAthleteA: BjjBodyOrientation;

  /** Orientação postural do Atleta B */
  orientationAthleteB: BjjBodyOrientation;

  /** Pegadas dominantes e conexões mecânicas */
  primaryGrips: BjjGripType;

  /** Lista de identificadores de posições para as quais pode haver transição direta */
  validTransitions: BjjPositionId[];

  /** Descrição técnica da configuração corporal */
  description: string;

  /** Notas táticas relevantes para mecânicas de jogo futuras */
  tacticalNotes: string;
}

/**
 * Estado posicional instanciado durante uma luta.
 * Mapeia os papéis canônicos de Atleta A e Atleta B para os participantes reais
 * (ex: Jogador vs Rival NPC), preservando a simetria após raspagens ou quedas.
 */
export interface BjjPositionInstance {
  /** ID da posição no catálogo */
  positionId: BjjPositionId;

  /** Quem está no papel canônico de Atleta A */
  actualAthleteA: string;

  /** Quem está no papel canônico de Atleta B */
  actualAthleteB: string;

  /** Segundos que a posição atual está retida de forma ininterrupta */
  durationSeconds: number;

  /** Se a posição cumpriu os 3 segundos regulamentares para consolidação de pontos CBJJ */
  isPointsStabilized: boolean;

  /** Pegada atualmente travada (pode variar durante a luta) */
  currentGrips: BjjGripType;
}

/** Resultado da auditoria de validação do catálogo de posições */
export interface BjjCatalogValidationReport {
  isValid: boolean;
  totalPositions: number;
  totalTransitions: number;
  positionsByCategory: Record<BjjPositionCategory, number>;
  errors: string[];
  warnings: string[];
}

// =========================================================================
// FASE 2: MODELAGEM DE TÉCNICAS, DESFECHOS MÚLTIPLOS E PROFICIÊNCIA
// =========================================================================

/** As 9 macrocategorias técnicas de Jiu-Jitsu */
export type BjjTechniqueCategory =
  | 'quedas_e_pe'               // A. Quedas e luta em pé
  | 'guarda_fechada'            // B. Guarda fechada
  | 'guarda_aberta'             // C. Guarda aberta
  | 'meia_guarda'               // D. Meia-guarda
  | 'passagem_guarda'           // E. Passagens de guarda
  | 'controle_posicional'       // F. Controles posicionais
  | 'fugas_e_recuperacoes'      // G. Fugas e recuperações
  | 'finalizacoes'              // H. Finalizações
  | 'defesas';                  // Defesas especializadas contra ataques

/** Papel do executor da técnica na posição de origem */
export type BjjExecutorRole =
  | 'por_cima'                  // Atleta que está por cima (passador / montado)
  | 'por_baixo'                 // Atleta que está por baixo (guardeiro / sob controle)
  | 'em_pe'                     // Ambos os atletas em pé
  | 'controlador'               // Atleta exercendo domínio mecânico
  | 'defensor'                  // Atleta contido buscando reação
  | 'qualquer';                 // Situação de igualdade simétrica (50/50, scramble)

/** Objetivo tático primário da técnica */
export type BjjTechniqueObjective =
  | 'queda'
  | 'raspagem'
  | 'passagem'
  | 'finalizacao'
  | 'estabilizacao'
  | 'transicao'
  | 'fuga'
  | 'defesa';

/** Tipos de desfechos múltiplos possíveis para a execução de uma técnica */
export type BjjOutcomeType =
  | 'sucesso_pleno'             // Técnica concluída com máxima eficácia (queda estabilizada, raspagem limpa, finalização)
  | 'sucesso_parcial'           // Ação completada, mas adversário minimiza danos (queda com guarda recuperada, quase passagem)
  | 'disputa'                   // Ambos entram em disputa aberta de scramble ou emaranhamento
  | 'defesa'                    // Adversário bloqueia ativamente a técnica, mantendo o controle ou a base
  | 'falha_neutra'              // Tentativa frustrada, retornando à posição de origem sem perda de vantagem
  | 'falha_com_reversao';       // Tentativa frustrada que cede posição dominante ou contra-ataque ao adversário

/** Requisitos regulamentares de legalidade da técnica perante a CBJJ / IBJJF */
export type BjjBeltRankIndex = 0 | 1 | 2 | 3 | 4; // 0=Branca, 1=Azul, 2=Roxa, 3=Marrom, 4=Preta

export interface BjjLegalityRequirement {
  /** Idade mínima oficial exigida pelas regras da CBJJ */
  minAge?: number;
  /** Faixa mínima exigida (0=Branca, 1=Azul, 2=Roxa, 3=Marrom, 4=Preta) */
  minBeltRank: BjjBeltRankIndex;
  /** Nome da faixa mínima para exibição na interface */
  minBeltName: string;
  /** Se a técnica é autorizada em combates com quimono (Gi) */
  giAllowed: boolean;
  /** Se a técnica é autorizada em combates sem quimono (No-Gi) */
  noGiAllowed: boolean;
  /** Se a técnica é estritamente ilegal na CBJJ de quimono (ex: chave de calcanhar, bate-estaca) */
  illegalUnderCbjjRules?: boolean;
  /** Observações estatutárias oficiais */
  legalNotes?: string;
}

/** Consequências de pontuação competitiva da técnica */
export interface BjjCompetitiveConsequences {
  /** Pontos concedidos caso a posição resultante seja estabilizada por 3 segundos (0, 2, 3 ou 4) */
  pointsOnStabilization: number;
  /** Se uma quase-execução da técnica rende Vantagem aos olhos dos árbitros da CBJJ */
  awardsAdvantageOnNearSuccess: boolean;
  /** Se o sucesso da técnica encerra o combate imediatamente por finalização (Desistência/Tapout) */
  stoppageOnSubmission: boolean;
}

/** Resultado estruturado de um ramo de desfecho de uma técnica */
export interface BjjTechniqueOutcome {
  /** Natureza do desfecho */
  outcomeType: BjjOutcomeType;
  /** Posição para a qual a luta migra (deve existir no catálogo de 47 posições) */
  resultingPositionId: BjjPositionId;
  /** Quem termina por cima após o desfecho */
  topAthleteAfter: 'executor' | 'opponent' | 'none';
  /** Quem termina por baixo após o desfecho */
  bottomAthleteAfter: 'executor' | 'opponent' | 'none';
  /** Pegadas que permanecem ativas após o desfecho */
  gripsAfter: BjjGripType;
  /** Custo de estamina consumido pelo executor */
  staminaCostExecutor: number;
  /** Custo de estamina infligido ou sofrido pelo adversário */
  staminaCostOpponent: number;
  /** Potenciais pontos que podem ser contabilizados caso haja estabilização */
  potentialPoints: number;
  /** Potencial vantagem concedida pelo árbitro */
  potentialAdvantage: boolean;
  /** Se este desfecho específico consagra uma finalização */
  isSubmission: boolean;
  /** Nível de perigo da finalização (1 a 5) caso aplicável */
  submissionDangerLevel?: number;
  /** Texto descritivo do desfecho */
  description: string;
}

/** Identificadores de técnicas cadastradas */
export type BjjTechniqueId = string;

/**
 * Definição canônica de uma técnica de Jiu-Jitsu.
 * Modela a mecânica, requisitos posicionais, desfechos múltiplos e ligações com defesas.
 */
export interface BjjTechnique {
  /** Identificador único e estável */
  id: BjjTechniqueId;
  /** Nome técnico oficial (ex: "Double Leg", "Uchi Mata", "Armlock") */
  technicalName: string;
  /** Nome formatado em português para exibição */
  displayName: string;
  /** Categoria técnica */
  category: BjjTechniqueCategory;
  /** Objetivo tático primário */
  objective: BjjTechniqueObjective;
  /** Descrição detalhada da execução biomecânica */
  description: string;
  /** Posições de origem a partir das quais a técnica pode ser engatilhada */
  initialPositions: BjjPositionId[];
  /** Papel do executor na posição de origem */
  executorRole: BjjExecutorRole;
  /** Pré-requisitos posicionais específicos (ex: quebra de postura, esgrima) */
  positionalPrerequisites: string;
  /** Pegadas necessárias para iniciar a técnica */
  requiredGrips: BjjGripType[];
  /** Atributos físicos e mentais mais exigidos para a técnica */
  relevantAttributes: Array<'technique' | 'strength' | 'speed' | 'flexibility' | 'fightIq' | 'stamina'>;
  /** Nível mínimo de domínio sugerido (1 a 5 estrelas) */
  minMasteryLevel: number;
  /** Custo base de estamina para tentar a técnica */
  staminaCost: number;
  /** Duração estimada do movimento em segundos de luta */
  estimatedDurationSeconds: number;
  /** Ramo completo de múltiplos resultados possíveis */
  outcomes: BjjTechniqueOutcome[];
  /** Técnicas de defesa catalogadas que respondem e bloqueiam este golpe */
  possibleDefenses: BjjTechniqueId[];
  /** Técnicas de contragolpe imediato que podem ser exploradas pelo oponente */
  possibleCounters: BjjTechniqueId[];
  /** Se a técnica for de DEFESA: quais IDs de ataque ela é projetada para responder */
  threatenedTechniqueIds?: BjjTechniqueId[];
  /** Requisitos legais conforme o livro de regras da CBJJ */
  legality: BjjLegalityRequirement;
  /** Se é uma técnica de finalização (chave articular ou estrangulamento) */
  isSubmission: boolean;
  /** Consequências de pontuação e encerramento */
  competitiveConsequences: BjjCompetitiveConsequences;
}

/**
 * Representação da proficiência e repertório individual de um atleta.
 * Prepara a futura integração de evolução e árvore técnica individual de jogadores e NPCs.
 */
export interface BjjAthleteTechniqueProficiency {
  /** ID da técnica conhecida */
  techniqueId: BjjTechniqueId;
  /** Se o atleta aprendeu e desbloqueou a técnica */
  isKnown: boolean;
  /** Nível de domínio refinado (1 a 5 estrelas) */
  masteryLevel: number;
  /** Pontos de experiência acumulados na técnica */
  experiencePoints: number;
  /** Quantas vezes tentou aplicar a técnica em combates ou treinos */
  executionsCount: number;
  /** Quantas vezes obteve sucesso pleno */
  successCount: number;
}

/** Relatório de validação do catálogo de técnicas */
export interface BjjTechniquesValidationReport {
  isValid: boolean;
  totalTechniques: number;
  techniquesByCategory: Record<BjjTechniqueCategory, number>;
  totalDefenses: number;
  totalSubmissions: number;
  totalPositionalReferencesValidated: number;
  errors: string[];
  warnings: string[];
}

