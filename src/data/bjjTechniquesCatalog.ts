/**
 * CAMINHO DO GUERREIRO: DO TATAME AO OCTÓGONO
 * Módulo Especializado de Jiu-Jitsu Brasileiro (BJJ) — Fase 2: Catálogo Canônico de Técnicas
 *
 * Contém o catálogo estruturado das 80 técnicas canônicas do Jiu-Jitsu,
 * suas exigências posicionais (baseadas nas 47 posições da Fase 1),
 * papéis de atletas, pegadas exigidas, ramos de desfechos múltiplos,
 * defesas especializadas, contragolpes e requisitos estatutários da CBJJ/IBJJF.
 */

import {
  BjjTechnique,
  BjjTechniqueId,
  BjjTechniqueCategory,
  BjjTechniquesValidationReport
} from '../types/bjjCombat';
import { BJJ_POSITIONS_CATALOG } from './bjjPositionsData';

export const BJJ_TECHNIQUES_CATALOG: Record<BjjTechniqueId, BjjTechnique> = {
  // =========================================================================
  // A. QUEDAS E LUTA EM PÉ (9 técnicas)
  // =========================================================================

  bjj_tech_double_leg: {
    id: 'bjj_tech_double_leg',
    technicalName: 'Double Leg (Baiana)',
    displayName: 'Double Leg / Baiana Tradicional',
    category: 'quedas_e_pe',
    objective: 'queda',
    description: 'Entrada explosiva de nível com penetração de joelho, abraçando ambas as pernas do adversário atrás dos joelhos e projetando o tronco para a frente.',
    initialPositions: ['stand_neutral', 'stand_grip_fight', 'stand_takedown_threat'],
    executorRole: 'em_pe',
    positionalPrerequisites: 'Distância média ou fechada, adversário com postura elevada ou peso nos calcanhares.',
    requiredGrips: ['nenhuma', 'disputa_aberta'],
    relevantAttributes: ['speed', 'strength', 'technique'],
    minMasteryLevel: 1,
    staminaCost: 22,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 20,
        staminaCostOpponent: 15,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Queda devastadora de grande impacto! O adversário cai de costas no tatame e o executor aterrissa diretamente no cem quilos.'
      },
      {
        outcomeType: 'sucesso_parcial',
        resultingPositionId: 'guard_half',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 22,
        staminaCostOpponent: 12,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Queda concretizada, mas o adversário fecha a meia-guarda antes da estabilização lateral.'
      },
      {
        outcomeType: 'disputa',
        resultingPositionId: 'trans_scramble',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 25,
        staminaCostOpponent: 18,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'Adversário reage com sprawl tardio e ambos embolam em scramble disputando a subida.'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'stand_front_headlock',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'front_headlock',
        staminaCostExecutor: 24,
        staminaCostOpponent: 10,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Adversário espalma o sprawl perfeito com peso nos quadris, prendendo a cabeça do executor no front headlock.'
      }
    ],
    possibleDefenses: ['bjj_def_sprawl_double_leg'],
    possibleCounters: ['bjj_sub_guillotine'],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_single_leg: {
    id: 'bjj_tech_single_leg',
    technicalName: 'Single Leg (Catada de Uma Perna)',
    displayName: 'Single Leg com Troca de Pegada',
    category: 'quedas_e_pe',
    objective: 'queda',
    description: 'Ataque em mergulho focado em isolar uma perna entre as coxas, subindo com a perna suspensa para desequilíbrio e rasteira.',
    initialPositions: ['stand_neutral', 'stand_grip_fight', 'stand_collar_control'],
    executorRole: 'em_pe',
    positionalPrerequisites: 'Perna dianteira do adversário avançada.',
    requiredGrips: ['disputa_aberta', 'gola_e_manga'],
    relevantAttributes: ['technique', 'speed', 'fightIq'],
    minMasteryLevel: 1,
    staminaCost: 18,
    estimatedDurationSeconds: 5,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_half_guard_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 16,
        staminaCostOpponent: 12,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Perna recolhida com precisão e adversário levado ao solo caindo de costas na meia-guarda.'
      },
      {
        outcomeType: 'sucesso_parcial',
        resultingPositionId: 'guard_open',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_e_calca',
        staminaCostExecutor: 18,
        staminaCostOpponent: 10,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Adversário cai mas empurra com os pés no quadril, abrindo a guarda aberta.'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'stand_clinch',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'overhook_whizzer',
        staminaCostExecutor: 20,
        staminaCostOpponent: 14,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Adversário encaixa o whizzer no braço do executor e equilibra em uma perna só, forçando o clinch.'
      }
    ],
    possibleDefenses: ['bjj_def_sprawl_single_leg'],
    possibleCounters: ['bjj_sub_guillotine', 'bjj_sub_kimura'],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_osoto_gari: {
    id: 'bjj_tech_osoto_gari',
    technicalName: 'Osoto Gari (Grande Ceifa Externa)',
    displayName: 'Osoto Gari de Gola Profunda',
    category: 'quedas_e_pe',
    objective: 'queda',
    description: 'Avanço frontal com desequilíbrio na diagonal traseira, ceifando a perna de apoio do rival por fora com a própria coxa.',
    initialPositions: ['stand_collar_control', 'stand_clinch', 'stand_body_lock'],
    executorRole: 'em_pe',
    positionalPrerequisites: 'Domínio firme de gola cruzada e manga.',
    requiredGrips: ['gola_e_manga', 'gola_cruzada'],
    relevantAttributes: ['strength', 'technique', 'fightIq'],
    minMasteryLevel: 1,
    staminaCost: 16,
    estimatedDurationSeconds: 3,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 14,
        staminaCostOpponent: 18,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Grande ceifa externa executada com força total! Queda espetacular com impacto direto no cem quilos.'
      },
      {
        outcomeType: 'falha_com_reversao',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'gola_e_manga',
        staminaCostExecutor: 18,
        staminaCostOpponent: 12,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Adversário esquiva o calcanhar e contra-ataca a projeção, derrubando o executor na guarda.'
      }
    ],
    possibleDefenses: ['bjj_def_sprawl_single_leg'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_ouchi_gari: {
    id: 'bjj_tech_ouchi_gari',
    technicalName: 'Ouchi Gari (Grande Ceifa Interna)',
    displayName: 'Ouchi Gari Interno',
    category: 'quedas_e_pe',
    objective: 'queda',
    description: 'Gancho interno na perna do adversário abrindo sua base, empurrando a gola para derrubar sentado.',
    initialPositions: ['stand_collar_control', 'stand_grip_fight'],
    executorRole: 'em_pe',
    positionalPrerequisites: 'Base aberta do adversário.',
    requiredGrips: ['gola_e_manga', 'gola_mesmo_lado'],
    relevantAttributes: ['technique', 'speed', 'fightIq'],
    minMasteryLevel: 1,
    staminaCost: 15,
    estimatedDurationSeconds: 3,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_half_guard_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 14,
        staminaCostOpponent: 12,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Ceifa interna encaixada, levando o rival de costas no solo com joelho já posicionado para passagem.'
      },
      {
        outcomeType: 'falha_neutra',
        resultingPositionId: 'stand_grip_fight',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 12,
        staminaCostOpponent: 10,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Adversário recolhe a perna a tempo e a disputa volta para as pegadas em pé.'
      }
    ],
    possibleDefenses: ['bjj_def_sprawl_double_leg'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_kosoto_gari: {
    id: 'bjj_tech_kosoto_gari',
    technicalName: 'Kosoto Gari (Pequena Ceifa Externa)',
    displayName: 'Kosoto Gari de Calcanhar',
    category: 'quedas_e_pe',
    objective: 'queda',
    description: 'Varredura rápida de calcanhar no pé de trás do adversário enquanto empurra o tronco na diagonal oposta.',
    initialPositions: ['stand_collar_control', 'stand_sleeve_control'],
    executorRole: 'em_pe',
    positionalPrerequisites: 'Adversário recuando a perna.',
    requiredGrips: ['gola_e_manga'],
    relevantAttributes: ['technique', 'speed'],
    minMasteryLevel: 1,
    staminaCost: 14,
    estimatedDurationSeconds: 3,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 12,
        staminaCostOpponent: 14,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Toque cirúrgico no calcanhar! O oponente escorrega e o executor cai estabilizado no cem quilos.'
      },
      {
        outcomeType: 'falha_neutra',
        resultingPositionId: 'stand_neutral',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'nenhuma',
        staminaCostExecutor: 10,
        staminaCostOpponent: 8,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O golpe raspa no ar sem pegar apoio e a distância se abre novamente.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_uchi_mata: {
    id: 'bjj_tech_uchi_mata',
    technicalName: 'Uchi Mata (Arremesso pela Coxa Interna)',
    displayName: 'Uchi Mata Clássico',
    category: 'quedas_e_pe',
    objective: 'queda',
    description: 'Giro de costas entrando o quadril com força e erguendo a perna entre as coxas do rival para lançá-lo pelo ar.',
    initialPositions: ['stand_collar_control', 'stand_clinch'],
    executorRole: 'em_pe',
    positionalPrerequisites: 'Pegada profunda nas costas ou gola alta, adversário curvado.',
    requiredGrips: ['gola_cruzada', 'esgrima_simples'],
    relevantAttributes: ['technique', 'flexibility', 'strength'],
    minMasteryLevel: 2,
    staminaCost: 24,
    estimatedDurationSeconds: 3,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 20,
        staminaCostOpponent: 22,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Projeção majestosa de grande amplitude! O adversário voa e cai de costas no tatame.'
      },
      {
        outcomeType: 'falha_com_reversao',
        resultingPositionId: 'stand_back_control',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'cinto_seguranca',
        staminaCostExecutor: 22,
        staminaCostOpponent: 12,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O adversário escorrega pela lateral durante o giro e pega as costas em pé.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: ['bjj_sub_rear_naked_choke'],
    legality: { minBeltRank: 1, minBeltName: 'Faixa Azul', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_seoi_nage: {
    id: 'bjj_tech_seoi_nage',
    technicalName: 'Seoi Nage (Projeção por Cima do Ombro)',
    displayName: 'Ippon Seoi Nage Tradicional',
    category: 'quedas_e_pe',
    objective: 'queda',
    description: 'Entrada rápida de costas abaixando o centro de gravidade, travando o braço do adversário no ombro e projetando para a frente.',
    initialPositions: ['stand_collar_control', 'stand_sleeve_control'],
    executorRole: 'em_pe',
    positionalPrerequisites: 'Domínio estrito de manga ou gola oposta.',
    requiredGrips: ['gola_e_manga', 'manga_simples'],
    relevantAttributes: ['speed', 'technique', 'strength'],
    minMasteryLevel: 1,
    staminaCost: 20,
    estimatedDurationSeconds: 3,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 18,
        staminaCostOpponent: 20,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Alavanca de ombro fulminante! O adversário é lançado girando pelo ar e aterrissa de costas.'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'stand_back_control',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'cinto_seguranca',
        staminaCostExecutor: 22,
        staminaCostOpponent: 10,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O adversário pula os ganchos antes da projeção e grampeia as costas do executor em pé.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: ['bjj_sub_rear_naked_choke'],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_tomoe_nage: {
    id: 'bjj_tech_tomoe_nage',
    technicalName: 'Tomoe Nage (Projeção Circular com Pé no Abdômen)',
    displayName: 'Tomoe Nage / Raspagem Balão em Pé',
    category: 'quedas_e_pe',
    objective: 'queda',
    description: 'Queda de sacrifício onde o executor deita de costas colocando a sola do pé no abdômen do adversário e lançando-o por cima da cabeça.',
    initialPositions: ['stand_collar_control', 'stand_clinch'],
    executorRole: 'em_pe',
    positionalPrerequisites: 'Adversário avançando com peso projetado à frente.',
    requiredGrips: ['gola_e_manga', 'dupla_manga'],
    relevantAttributes: ['technique', 'flexibility', 'fightIq'],
    minMasteryLevel: 2,
    staminaCost: 18,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_mount',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_cruzada',
        staminaCostExecutor: 16,
        staminaCostOpponent: 18,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Projeção espetacular! O adversário voa por cima da cabeça e o executor sobe montando diretamente (+2 da queda).'
      },
      {
        outcomeType: 'sucesso_parcial',
        resultingPositionId: 'guard_open',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'gola_e_manga',
        staminaCostExecutor: 16,
        staminaCostOpponent: 10,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário apoia as mãos no chão para não ser lançado e o executor acomoda a guarda aberta.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_pull_guard: {
    id: 'bjj_tech_pull_guard',
    technicalName: 'Puxada para Guarda',
    displayName: 'Puxada Estratégica para a Guarda',
    category: 'quedas_e_pe',
    objective: 'transicao',
    description: 'Atleta senta deliberadamente no tatame com pegada estabelecida e pé no quadril, trazendo a luta para o solo nos seus termos.',
    initialPositions: ['stand_neutral', 'stand_grip_fight', 'stand_collar_control', 'stand_sleeve_control', 'stand_body_lock'],
    executorRole: 'em_pe',
    positionalPrerequisites: 'Ao menos uma pegada de quimono firme antes de sentar (evitando punição por puxada falsa).',
    requiredGrips: ['gola_cruzada', 'gola_e_manga', 'manga_simples'],
    relevantAttributes: ['technique', 'fightIq'],
    minMasteryLevel: 1,
    staminaCost: 8,
    estimatedDurationSeconds: 2,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'gola_e_manga',
        staminaCostExecutor: 6,
        staminaCostOpponent: 6,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Puxada com pegada profunda na gola, trancando o adversário diretamente na guarda fechada.'
      },
      {
        outcomeType: 'sucesso_parcial',
        resultingPositionId: 'guard_de_la_riva',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'manga_e_calca',
        staminaCostExecutor: 8,
        staminaCostOpponent: 6,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Puxada com gancho externo direto na perna do adversário em guarda De La Riva.'
      },
      {
        outcomeType: 'disputa',
        resultingPositionId: 'guard_open',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 10,
        staminaCostOpponent: 6,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Puxada para guarda aberta mantendo os pés nos quadris para afastar o passador.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: ['bjj_tech_pass_toreando'],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  // =========================================================================
  // B. GUARDA FECHADA (8 técnicas)
  // =========================================================================

  bjj_tech_scissor_sweep: {
    id: 'bjj_tech_scissor_sweep',
    technicalName: 'Raspagem Tesoura (Scissor Sweep)',
    displayName: 'Raspagem Tesoura Tradicional',
    category: 'guarda_fechada',
    objective: 'raspagem',
    description: 'Abertura de quadril com gola e manga dominadas, colocando uma canela cruzando o peito e a outra varrendo a base de baixo como tesoura.',
    initialPositions: ['guard_closed'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Postura de B quebrada, domínio de manga e gola oposta.',
    requiredGrips: ['gola_e_manga'],
    relevantAttributes: ['technique', 'speed', 'fightIq'],
    minMasteryLevel: 1,
    staminaCost: 14,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_mount',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_cruzada',
        staminaCostExecutor: 12,
        staminaCostOpponent: 14,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Tesoura perfeita! O adversário rola de lado e o executor sobe montando diretamente (+2 pontos de raspagem).'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'guard_half',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 16,
        staminaCostOpponent: 10,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'Adversário abre a base e bloqueia a varredura, prendendo a perna do executor na meia-guarda.'
      }
    ],
    possibleDefenses: ['bjj_def_sweep_base'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_pendulum_sweep: {
    id: 'bjj_tech_pendulum_sweep',
    technicalName: 'Raspagem Pêndulo (Flower Sweep)',
    displayName: 'Raspagem Pêndulo / Flor',
    category: 'guarda_fechada',
    objective: 'raspagem',
    description: 'Mergulho do braço sob a coxa do adversário com balanço vigoroso da perna externa como um pêndulo, tombando o rival no cem quilos ou montada.',
    initialPositions: ['guard_closed'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Pegada de manga e mergulho sob a perna de B.',
    requiredGrips: ['gola_e_calca', 'gola_e_manga'],
    relevantAttributes: ['technique', 'flexibility', 'strength'],
    minMasteryLevel: 1,
    staminaCost: 16,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_mount',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_cruzada',
        staminaCostExecutor: 14,
        staminaCostOpponent: 16,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Balanço de pernas impecável! O adversário gira no ar e o executor aterrissa na montada com autoridade.'
      },
      {
        outcomeType: 'sucesso_parcial',
        resultingPositionId: 'def_submission',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'gola_e_manga',
        staminaCostExecutor: 15,
        staminaCostOpponent: 14,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: true,
        submissionDangerLevel: 3,
        description: 'A raspagem não conclui, mas o movimento abre brecha imediata para encaixar um armlock reto.'
      }
    ],
    possibleDefenses: ['bjj_def_sweep_base'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_hip_bump_sweep: {
    id: 'bjj_tech_hip_bump_sweep',
    technicalName: 'Raspagem Hip Bump (Barrigada)',
    displayName: 'Raspagem Hip Bump / Kimura Sweep',
    category: 'guarda_fechada',
    objective: 'raspagem',
    description: 'Apoio de cotovelo ou mão no solo, erguendo o quadril explosivamente contra o peito do adversário enquanto trava seu braço de apoio.',
    initialPositions: ['guard_closed'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Adversário com postura muito ereta ou afastada para trás.',
    requiredGrips: ['manga_simples', 'nenhuma'],
    relevantAttributes: ['speed', 'strength', 'technique'],
    minMasteryLevel: 1,
    staminaCost: 15,
    estimatedDurationSeconds: 3,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_mount',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_cruzada',
        staminaCostExecutor: 12,
        staminaCostOpponent: 12,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Barrigada vigorosa que projeta o adversário para trás, caindo na montada montada limpa.'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 15,
        staminaCostOpponent: 10,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário apoia a mão no solo para amortecer, abrindo janela para ataque de kimura.'
      }
    ],
    possibleDefenses: ['bjj_def_sweep_base'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_arm_drag_closed: {
    id: 'bjj_tech_arm_drag_closed',
    technicalName: 'Arm Drag da Guarda Fechada',
    displayName: 'Arm Drag para as Costas',
    category: 'guarda_fechada',
    objective: 'transicao',
    description: 'Pegada cruzada no punho e no tríceps de B, puxando o braço através do peito enquanto foge o quadril para escalar as costas.',
    initialPositions: ['guard_closed'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Braço do adversário apoiado no abdômen.',
    requiredGrips: ['manga_simples'],
    relevantAttributes: ['speed', 'technique', 'flexibility'],
    minMasteryLevel: 1,
    staminaCost: 12,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_back_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'cinto_seguranca',
        staminaCostExecutor: 12,
        staminaCostOpponent: 14,
        potentialPoints: 4,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Arrastão de braço perfeito! O executor contorna o tronco e grampeia os dois ganchos nas costas (+4 pontos).'
      },
      {
        outcomeType: 'falha_neutra',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'gola_e_manga',
        staminaCostExecutor: 10,
        staminaCostOpponent: 8,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O adversário puxa o cotovelo de volta com força e recompõe a postura na guarda.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 4, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_triangle_closed: {
    id: 'bjj_tech_triangle_closed',
    technicalName: 'Triângulo da Guarda Fechada',
    displayName: 'Triângulo Tradicional (Sankaku-Jime)',
    category: 'guarda_fechada',
    objective: 'finalizacao',
    description: 'Lança uma perna por cima do ombro e outra por baixo da axila, fechando em figura de quatro sobre a nuca para cortar o fluxo das carótidas.',
    initialPositions: ['guard_closed'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Um braço dentro e outro fora da guarda (situação 1-in-1-out).',
    requiredGrips: ['gola_e_manga', 'manga_simples'],
    relevantAttributes: ['flexibility', 'technique', 'fightIq'],
    minMasteryLevel: 1,
    staminaCost: 20,
    estimatedDurationSeconds: 8,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'triangulo_corporal',
        staminaCostExecutor: 18,
        staminaCostOpponent: 35,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 5,
        description: 'Triângulo arrochado sem ar! O adversário bate três vezes no tatame em desistência verbal! Fim de luta!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'guard_open',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 22,
        staminaCostOpponent: 20,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário ergue a postura com força, esconde o ombro e escapa da trava das pernas.'
      }
    ],
    possibleDefenses: ['bjj_def_triangle_posture'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_tech_omoplata_closed: {
    id: 'bjj_tech_omoplata_closed',
    technicalName: 'Omoplata da Guarda Fechada',
    displayName: 'Ataque de Omoplata com as Pernas',
    category: 'guarda_fechada',
    objective: 'finalizacao',
    description: 'Contorna o braço com a perna, sentando-se a 90 graus para isolar o ombro em uma alavanca de torção similar à kimura com as pernas.',
    initialPositions: ['guard_closed'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Braço empurrado para o chão, quebra de postura.',
    requiredGrips: ['manga_simples', 'faixa_e_calca'],
    relevantAttributes: ['technique', 'flexibility'],
    minMasteryLevel: 1,
    staminaCost: 18,
    estimatedDurationSeconds: 7,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'faixa_e_calca',
        staminaCostExecutor: 16,
        staminaCostOpponent: 30,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 4,
        description: 'O ombro é hiper-rotacionado e o adversário bate imediatamente em desistência!'
      },
      {
        outcomeType: 'sucesso_parcial',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 18,
        staminaCostOpponent: 15,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O adversário rola para frente para aliviar a pressão no ombro e o executor acompanha por cima (+2 de raspagem).'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_tech_armlock_closed: {
    id: 'bjj_tech_armlock_closed',
    technicalName: 'Armlock da Guarda Fechada',
    displayName: 'Chave de Braço Reta da Guarda Fechada',
    category: 'guarda_fechada',
    objective: 'finalizacao',
    description: 'Pega de duas mãos no braço, sobe a perna sobre o ombro e passa a outra perna por cima do rosto, estendendo o quadril na articulação do cotovelo.',
    initialPositions: ['guard_closed'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Braço de B isolado e cruzado além da linha média do tronco.',
    requiredGrips: ['gola_e_manga', 'manga_simples'],
    relevantAttributes: ['technique', 'flexibility', 'speed'],
    minMasteryLevel: 0,
    staminaCost: 18,
    estimatedDurationSeconds: 6,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'dupla_manga',
        staminaCostExecutor: 16,
        staminaCostOpponent: 32,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 5,
        description: 'O braço estica por completo! Cotovelo no limite articular e o oponente bate tapinha em desistência!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'guard_open',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 20,
        staminaCostOpponent: 18,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário gira o polegar (hitchhiker escape) e desvencilha o cotovelo no último segundo.'
      }
    ],
    possibleDefenses: ['bjj_def_armlock_hitchhiker'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_tech_posture_break: {
    id: 'bjj_tech_posture_break',
    technicalName: 'Quebra de Postura na Guarda',
    displayName: 'Quebra de Postura & Abraço de Cabeça',
    category: 'guarda_fechada',
    objective: 'estabilizacao',
    description: 'Puxada simultânea de golas com os joelhos trazendo o peito do adversário para baixo, quebrando o alinhamento da coluna.',
    initialPositions: ['guard_closed'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Adversário tentando forçar a abertura da guarda.',
    requiredGrips: ['gola_cruzada', 'gola_e_manga'],
    relevantAttributes: ['technique', 'strength'],
    minMasteryLevel: 0,
    staminaCost: 10,
    estimatedDurationSeconds: 3,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'gola_cruzada',
        staminaCostExecutor: 8,
        staminaCostOpponent: 12,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'Postura de B completamente colapsada com o queixo prensado no peito de A, abrindo leque ofensivo.'
      },
      {
        outcomeType: 'falha_neutra',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 10,
        staminaCostOpponent: 8,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O adversário mantém a base forte nas coxas e empurra com as mãos no bíceps.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  // =========================================================================
  // C. GUARDA ABERTA (8 técnicas)
  // =========================================================================

  bjj_tech_hook_sweep_butterfly: {
    id: 'bjj_tech_hook_sweep_butterfly',
    technicalName: 'Raspagem de Gancho Borboleta',
    displayName: 'Raspagem de Gancho Borboleta',
    category: 'guarda_aberta',
    objective: 'raspagem',
    description: 'Eleva a perna interna com o gancho do pé enquanto domina a esgrima e o braço oposto, capotando o rival de lado.',
    initialPositions: ['guard_butterfly'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Ganchos ativos e esgrima axilar profunda.',
    requiredGrips: ['esgrima_simples', 'overhook_whizzer'],
    relevantAttributes: ['technique', 'timing' as any, 'flexibility'],
    minMasteryLevel: 1,
    staminaCost: 16,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_mount',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_cruzada',
        staminaCostExecutor: 14,
        staminaCostOpponent: 16,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Elevação perfeita de quadril! O adversário voa de lado e o guardeiro sobe direto para a montada.'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'guard_half',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 16,
        staminaCostOpponent: 12,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'Adversário posta a perna oposta e esmaga o gancho, prendendo na meia-guarda.'
      }
    ],
    possibleDefenses: ['bjj_def_sweep_base'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_elevator_sweep: {
    id: 'bjj_tech_elevator_sweep',
    technicalName: 'Raspagem Elevador',
    displayName: 'Raspagem Elevador na Guarda Aberta',
    category: 'guarda_aberta',
    objective: 'raspagem',
    description: 'Usa um pé no quadril e outro gancho por trás do joelho de B, esticando as pernas para erguer o rival e invertê-lo.',
    initialPositions: ['guard_open', 'guard_butterfly', 'guard_lasso'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Domínio de mangas e adversário com peso à frente.',
    requiredGrips: ['dupla_manga', 'gola_e_manga'],
    relevantAttributes: ['technique', 'flexibility'],
    minMasteryLevel: 1,
    staminaCost: 15,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 12,
        staminaCostOpponent: 15,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Adversário erguido pelo elevador e girado de lado, estabilizando o cem quilos por cima.'
      },
      {
        outcomeType: 'falha_neutra',
        resultingPositionId: 'guard_open',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 12,
        staminaCostOpponent: 8,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O adversário recua os joelhos no chão e a luta segue na guarda aberta.'
      }
    ],
    possibleDefenses: ['bjj_def_sweep_base'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_x_guard_sweep: {
    id: 'bjj_tech_x_guard_sweep',
    technicalName: 'Raspagem da Guarda X',
    displayName: 'Raspagem Técnica da Guarda X',
    category: 'guarda_aberta',
    objective: 'raspagem',
    description: 'Empurrão das pernas em X na virilha e joelho oposto com recolhimento do tornozelo, derrubando o passador sentado.',
    initialPositions: ['guard_x'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Posicionamento sob o centro de gravidade do oponente.',
    requiredGrips: ['gola_e_calca', 'manga_e_calca'],
    relevantAttributes: ['technique', 'fightIq'],
    minMasteryLevel: 2,
    staminaCost: 14,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 12,
        staminaCostOpponent: 15,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Extensão cirúrgica das pernas! O passador tomba de costas e o atleta sobe com facilidade para o controle lateral.'
      },
      {
        outcomeType: 'disputa',
        resultingPositionId: 'trans_scramble',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 15,
        staminaCostOpponent: 15,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário cai mas imediatamente salta tentando apoiar as mãos, gerando uma disputa rápida de scramble.'
      }
    ],
    possibleDefenses: ['bjj_def_sweep_base'],
    possibleCounters: [],
    legality: { minBeltRank: 1, minBeltName: 'Faixa Azul', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_single_leg_x_sweep: {
    id: 'bjj_tech_single_leg_x_sweep',
    technicalName: 'Raspagem da Single-Leg X',
    displayName: 'Raspagem de Varredura da Single-Leg X',
    category: 'guarda_aberta',
    objective: 'raspagem',
    description: 'Beliscão de joelho prendendo a coxa com elevação do quadril e pegada de tornozelo, tombando o passador para trás.',
    initialPositions: ['guard_single_leg_x'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Controle firme da perna isolada com pé no quadril.',
    requiredGrips: ['emaranhamento_pernas'],
    relevantAttributes: ['technique', 'speed'],
    minMasteryLevel: 1,
    staminaCost: 14,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_mount',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_cruzada',
        staminaCostExecutor: 12,
        staminaCostOpponent: 14,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Desequilíbrio perfeito! O passador tomba sentado e o executor sobe montando na continuação.'
      },
      {
        outcomeType: 'sucesso_parcial',
        resultingPositionId: 'trans_leg_entanglement',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'emaranhamento_pernas',
        staminaCostExecutor: 14,
        staminaCostOpponent: 14,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário cai mas enrola a perna por dentro, caindo em posição de emaranhamento de pernas.'
      }
    ],
    possibleDefenses: ['bjj_def_sweep_base', 'bjj_def_leg_lock_clear_knee'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_de_la_riva_sweep: {
    id: 'bjj_tech_de_la_riva_sweep',
    technicalName: 'Raspagem De La Riva',
    displayName: 'Raspagem De La Riva com Calcanhar Dominado',
    category: 'guarda_aberta',
    objective: 'raspagem',
    description: 'Chute na coxa distante com o gancho De La Riva tracionando a perna de apoio, desequilibrando o passador de costas.',
    initialPositions: ['guard_de_la_riva'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Gancho externo profundo na coxa e pegada firme de calcanhar.',
    requiredGrips: ['manga_e_calca', 'gola_e_calca'],
    relevantAttributes: ['technique', 'flexibility'],
    minMasteryLevel: 1,
    staminaCost: 15,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 13,
        staminaCostOpponent: 15,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O passador tomba de costas e o atleta avança por cima, estabilizando os pontos da raspagem.'
      },
      {
        outcomeType: 'sucesso_parcial',
        resultingPositionId: 'top_back_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'cinto_seguranca',
        staminaCostExecutor: 18,
        staminaCostOpponent: 16,
        potentialPoints: 4,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Giro de berimbolo conectado a partir da De La Riva, finalizando diretamente nas costas com ganchos!'
      }
    ],
    possibleDefenses: ['bjj_def_sweep_base'],
    possibleCounters: [],
    legality: { minBeltRank: 1, minBeltName: 'Faixa Azul', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_spider_sweep: {
    id: 'bjj_tech_spider_sweep',
    technicalName: 'Raspagem da Guarda Aranha (Balão)',
    displayName: 'Raspagem Balão da Guarda Aranha',
    category: 'guarda_aberta',
    objective: 'raspagem',
    description: 'Estica um braço com o pé no bíceps enquanto chuta a axila oposta para trás, capotando o adversário por cima.',
    initialPositions: ['guard_spider'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Dupla manga dominada e pés firmes nos bíceps.',
    requiredGrips: ['dupla_manga'],
    relevantAttributes: ['technique', 'flexibility'],
    minMasteryLevel: 1,
    staminaCost: 16,
    estimatedDurationSeconds: 5,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_mount',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_cruzada',
        staminaCostExecutor: 14,
        staminaCostOpponent: 18,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O adversário é lançado em arco pelo ar e o atleta monta com extrema elegância técnica!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'guard_open',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'manga_simples',
        staminaCostExecutor: 16,
        staminaCostOpponent: 12,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário solta uma das mangas girando o punho e recolhe a postura.'
      }
    ],
    possibleDefenses: ['bjj_def_sweep_base'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_lasso_sweep: {
    id: 'bjj_tech_lasso_sweep',
    technicalName: 'Raspagem da Guarda Laço',
    displayName: 'Raspagem de Pêndulo da Guarda Laço',
    category: 'guarda_aberta',
    objective: 'raspagem',
    description: 'Perna laçada em volta do braço do rival, abrindo o quadril para tombar o adversário sem apoio lateral.',
    initialPositions: ['guard_lasso'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Laço profundo na axila com manga travada.',
    requiredGrips: ['laco_de_manga'],
    relevantAttributes: ['technique', 'flexibility'],
    minMasteryLevel: 1,
    staminaCost: 15,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 12,
        staminaCostOpponent: 14,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O adversário não consegue postar o braço laçado e tomba sem defesa no cem quilos.'
      },
      {
        outcomeType: 'falha_neutra',
        resultingPositionId: 'guard_lasso',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'laco_de_manga',
        staminaCostExecutor: 10,
        staminaCostOpponent: 10,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O adversário senta nos calcanhares e neutraliza a força da alavanca.'
      }
    ],
    possibleDefenses: ['bjj_def_sweep_base'],
    possibleCounters: [],
    legality: { minBeltRank: 1, minBeltName: 'Faixa Azul', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_kuzushi_offbalance: {
    id: 'bjj_tech_kuzushi_offbalance',
    technicalName: 'Controle e Desequilíbrio (Kuzushi)',
    displayName: 'Desequilíbrio Contínuo na Guarda Aberta',
    category: 'guarda_aberta',
    objective: 'estabilizacao',
    description: 'Trabalho de pés nos quadris e bíceps puxando as mangas e golas, mantendo o passador sempre sem base firme para atacar.',
    initialPositions: ['guard_open', 'guard_seated', 'guard_supine', 'guard_reverse_de_la_riva', 'guard_lasso', 'guard_x', 'guard_fifty_fifty'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Ao menos uma pegada superior e contato de pés ativo.',
    requiredGrips: ['gola_e_manga', 'dupla_manga'],
    relevantAttributes: ['fightIq', 'technique'],
    minMasteryLevel: 0,
    staminaCost: 10,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_open',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'gola_e_manga',
        staminaCostExecutor: 8,
        staminaCostOpponent: 14,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O passador é obrigado a apoiar as duas mãos no chão para não cair, concedendo vantagem tática clara.'
      },
      {
        outcomeType: 'falha_neutra',
        resultingPositionId: 'guard_open',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 8,
        staminaCostOpponent: 8,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O passador recua e reajusta sua postura.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  // =========================================================================
  // D. MEIA-GUARDA (5 técnicas)
  // =========================================================================

  bjj_tech_half_old_school: {
    id: 'bjj_tech_half_old_school',
    technicalName: 'Raspagem Old School',
    displayName: 'Raspagem Old School com Pegada de Calcanhar',
    category: 'meia_guarda',
    objective: 'raspagem',
    description: 'Entrada por baixo com esgrima, alcançando o pé de fora do adversário por trás das costas para derrubá-lo de joelhos.',
    initialPositions: ['guard_half', 'guard_deep_half'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Esgrima ganha no tronco do adversário.',
    requiredGrips: ['esgrima_simples', 'faixa_e_calca'],
    relevantAttributes: ['technique', 'strength'],
    minMasteryLevel: 1,
    staminaCost: 15,
    estimatedDurationSeconds: 5,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 12,
        staminaCostOpponent: 14,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Pegada travada no pé e adversário capotado de costas, com o executor subindo nos cem quilos.'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'top_half_guard_control',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 16,
        staminaCostOpponent: 12,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O passador joga o peso no ombro e bloqueia a subida com um crossface violento.'
      }
    ],
    possibleDefenses: ['bjj_def_sweep_base'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_half_john_wayne: {
    id: 'bjj_tech_half_john_wayne',
    technicalName: 'Raspagem John Wayne (Knee Roll)',
    displayName: 'Raspagem John Wayne de Rolo',
    category: 'meia_guarda',
    objective: 'raspagem',
    description: 'Aperto dos joelhos travando a canela de B e rolamento súbito para o lado onde B não possui apoio de braço.',
    initialPositions: ['guard_half', 'guard_knee_shield', 'guard_z'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Adversário pesando muito o tronco para a frente sem base de mãos.',
    requiredGrips: ['gola_e_manga'],
    relevantAttributes: ['technique', 'timing' as any],
    minMasteryLevel: 1,
    staminaCost: 14,
    estimatedDurationSeconds: 3,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 12,
        staminaCostOpponent: 12,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Rolamento relâmpago! O passador é surpreendido pelo desequilíbrio e cai no chão por baixo.'
      },
      {
        outcomeType: 'falha_neutra',
        resultingPositionId: 'guard_half',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 12,
        staminaCostOpponent: 10,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O passador apoia o cotovelo e estabiliza a base.'
      }
    ],
    possibleDefenses: ['bjj_def_sweep_base'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_half_guard_recovery: {
    id: 'bjj_tech_half_guard_recovery',
    technicalName: 'Recuperação de Guarda da Meia',
    displayName: 'Reposição de Guarda Fechada a partir da Meia',
    category: 'meia_guarda',
    objective: 'fuga',
    description: 'Uso de frames com antebraço e fuga de quadril para puxar a perna presa de volta, fechando a guarda completa.',
    initialPositions: ['guard_half', 'guard_knee_shield', 'guard_deep_half', 'guard_reverse_de_la_riva', 'guard_z', 'top_half_guard_control', 'trans_guard_recovery', 'trans_scramble'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Espaço criado entre os peitos com cotovelo.',
    requiredGrips: ['gola_e_manga'],
    relevantAttributes: ['technique', 'flexibility'],
    minMasteryLevel: 0,
    staminaCost: 12,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'gola_e_manga',
        staminaCostExecutor: 10,
        staminaCostOpponent: 8,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Perna liberada com sucesso e guarda fechada restabelecida com segurança.'
      },
      {
        outcomeType: 'falha_neutra',
        resultingPositionId: 'guard_half',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 12,
        staminaCostOpponent: 8,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O passador grampeia a coxa e impede que a perna saia da meia.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_tech_half_underhook_entry: {
    id: 'bjj_tech_half_underhook_entry',
    technicalName: 'Entrada de Esgrima na Meia-Guarda',
    displayName: 'Conquista de Esgrima Profunda',
    category: 'meia_guarda',
    objective: 'transicao',
    description: 'Mergulho de braço sob a axila do passador com subida no cotovelo, buscando as costas ou a saída para os quatro apoios.',
    initialPositions: ['guard_half', 'guard_deep_half', 'top_half_guard_control'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Cabeça protegida do crossface.',
    requiredGrips: ['esgrima_simples'],
    relevantAttributes: ['speed', 'technique', 'strength'],
    minMasteryLevel: 1,
    staminaCost: 12,
    estimatedDurationSeconds: 3,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_back_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'cinto_seguranca',
        staminaCostExecutor: 14,
        staminaCostOpponent: 12,
        potentialPoints: 4,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Esgrima profunda subindo nas costas! O guardeiro escala e coloca os dois ganchos (+4 pontos).'
      },
      {
        outcomeType: 'sucesso_parcial',
        resultingPositionId: 'guard_deep_half',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'gola_e_calca',
        staminaCostExecutor: 12,
        staminaCostOpponent: 10,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário defende as costas e o executor desliza por baixo para a meia-guarda profunda.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: ['bjj_sub_darce'],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 4, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_technical_standup: {
    id: 'bjj_tech_technical_standup',
    technicalName: 'Levantada Técnica da Meia',
    displayName: 'Levantada Técnica / Subida de Single',
    category: 'meia_guarda',
    objective: 'fuga',
    description: 'Com a esgrima dominada, o guardeiro empurra o adversário e recolhe a perna de trás em levantada técnica, ficando em pé com a perna de B nas mãos.',
    initialPositions: ['guard_half', 'guard_seated', 'guard_x', 'guard_fifty_fifty', 'trans_scramble'],
    executorRole: 'por_baixo',
    positionalPrerequisites: 'Mão ou cotovelo apoiado no tatame.',
    requiredGrips: ['esgrima_simples'],
    relevantAttributes: ['strength', 'speed'],
    minMasteryLevel: 1,
    staminaCost: 14,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'stand_takedown_threat',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'gola_e_calca',
        staminaCostExecutor: 12,
        staminaCostOpponent: 10,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Subida perfeita em pé com a perna de B dominada, pronto para derrubar (+2 da reversão/queda).'
      },
      {
        outcomeType: 'falha_neutra',
        resultingPositionId: 'guard_half',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 14,
        staminaCostOpponent: 8,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O adversário empurra a cabeça para baixo e força o retorno para a meia-guarda.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  // =========================================================================
  // E. PASSAGENS DE GUARDA (8 técnicas)
  // =========================================================================

  bjj_tech_pass_toreando: {
    id: 'bjj_tech_pass_toreando',
    technicalName: 'Passagem Toreando',
    displayName: 'Passagem Toreando de Calça',
    category: 'passagem_guarda',
    objective: 'passagem',
    description: 'Pegada dupla nas calças na altura dos joelhos, empurrando as pernas para um lado e pivotando o corpo rapidamente pelo lado oposto.',
    initialPositions: ['guard_open', 'guard_supine', 'guard_spider', 'guard_de_la_riva', 'guard_reverse_de_la_riva', 'guard_lasso', 'guard_x', 'guard_single_leg_x', 'guard_seated', 'top_passing_process', 'trans_guard_recovery'],
    executorRole: 'por_cima',
    positionalPrerequisites: 'Passador em pé com postura alta e pernas de B livres de ganchos profundos.',
    requiredGrips: ['gola_e_calca', 'manga_e_calca'],
    relevantAttributes: ['speed', 'technique', 'fightIq'],
    minMasteryLevel: 1,
    staminaCost: 18,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 16,
        staminaCostOpponent: 18,
        potentialPoints: 3,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Passagem relâmpago! As pernas são jogadas de lado e o passador aterrissa colado no cem quilos (+3 pontos de passagem na CBJJ).'
      },
      {
        outcomeType: 'sucesso_parcial',
        resultingPositionId: 'top_knee_on_belly',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_e_calca',
        staminaCostExecutor: 18,
        staminaCostOpponent: 16,
        potentialPoints: 3,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Toreada limpa que conecta diretamente com o joelho na barriga no peito do oponente.'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'trans_guard_recovery',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_e_manga',
        staminaCostExecutor: 20,
        staminaCostOpponent: 16,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O guardeiro foge o quadril no limite e coloca a canela na frente, recompondo o espaço.'
      }
    ],
    possibleDefenses: ['bjj_def_guard_retention'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 3, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_pass_pressure: {
    id: 'bjj_tech_pass_pressure',
    technicalName: 'Passagem por Pressão (Folding Pass)',
    displayName: 'Passagem por Pressão / Dobragem de Joelhos',
    category: 'passagem_guarda',
    objective: 'passagem',
    description: 'Dobra as duas pernas do guardeiro para um lado só usando o peso do quadril e peito, amassando as coxas sem dar espaço.',
    initialPositions: ['guard_open', 'guard_half', 'guard_butterfly', 'guard_deep_half', 'guard_lasso', 'guard_z', 'top_passing_process', 'trans_guard_recovery'],
    executorRole: 'por_cima',
    positionalPrerequisites: 'Peso pesado nos quadris, sem espaço entre os corpos.',
    requiredGrips: ['esgrima_simples', 'faixa_e_calca'],
    relevantAttributes: ['strength', 'technique'],
    minMasteryLevel: 1,
    staminaCost: 20,
    estimatedDurationSeconds: 6,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 18,
        staminaCostOpponent: 24,
        potentialPoints: 3,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Pressão asfixiante que dobra as pernas do rival e consolida o cem quilos com maestria (+3 pontos).'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'guard_half',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 18,
        staminaCostOpponent: 16,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O guardeiro resiste ao peso e consegue amarrar a perna na meia-guarda.'
      }
    ],
    possibleDefenses: ['bjj_def_guard_retention', 'bjj_def_pass_frame'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 3, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_pass_knee_cut: {
    id: 'bjj_tech_pass_knee_cut',
    technicalName: 'Knee Cut Pass (Passagem Cruzando o Joelho)',
    displayName: 'Knee Cut / Knee Slice Pass',
    category: 'passagem_guarda',
    objective: 'passagem',
    description: 'Desliza o joelho diagonalmente sobre a coxa de B com esgrima forte na axila, cortando as pernas e caindo no 100kg.',
    initialPositions: ['guard_open', 'guard_half', 'guard_de_la_riva', 'guard_reverse_de_la_riva', 'guard_deep_half', 'guard_z', 'guard_seated', 'top_passing_process', 'trans_guard_recovery'],
    executorRole: 'por_cima',
    positionalPrerequisites: 'Esgrima ganha e joelho apontado entre as pernas de B.',
    requiredGrips: ['esgrima_simples', 'gola_cruzada'],
    relevantAttributes: ['speed', 'technique', 'fightIq'],
    minMasteryLevel: 1,
    staminaCost: 18,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 16,
        staminaCostOpponent: 18,
        potentialPoints: 3,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O joelho corta a coxa como manteiga! Esgrima puxada para o alto e cem quilos estabilizado (+3 pontos).'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'guard_reverse_de_la_riva',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_e_calca',
        staminaCostExecutor: 18,
        staminaCostOpponent: 14,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O guardeiro trava o deslizamento enfiando o gancho de Reverse De La Riva por baixo.'
      }
    ],
    possibleDefenses: ['bjj_def_guard_retention'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 3, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_pass_leg_drag: {
    id: 'bjj_tech_pass_leg_drag',
    technicalName: 'Leg Drag Pass',
    displayName: 'Leg Drag com Domínio de Quadril',
    category: 'passagem_guarda',
    objective: 'passagem',
    description: 'Puxa a perna do adversário cruzando-a pelo seu próprio quadril, sentando sobre ela para travar as costas do guardeiro viradas.',
    initialPositions: ['guard_open', 'guard_de_la_riva'],
    executorRole: 'por_cima',
    positionalPrerequisites: 'Pegada na boca da calça e gola cruzada.',
    requiredGrips: ['gola_e_calca', 'manga_e_calca'],
    relevantAttributes: ['technique', 'speed', 'fightIq'],
    minMasteryLevel: 2,
    staminaCost: 18,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_e_calca',
        staminaCostExecutor: 15,
        staminaCostOpponent: 20,
        potentialPoints: 3,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Perna travada no quadril sem reação do rival! Cem quilos consolidado com quadril de B neutralizado (+3 pts).'
      },
      {
        outcomeType: 'sucesso_parcial',
        resultingPositionId: 'top_back_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'cinto_seguranca',
        staminaCostExecutor: 20,
        staminaCostOpponent: 18,
        potentialPoints: 4,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O adversário vira de costas para não dar a passagem e o executor salta diretamente para o controle das costas (+4 pts).'
      }
    ],
    possibleDefenses: ['bjj_def_guard_retention'],
    possibleCounters: [],
    legality: { minBeltRank: 1, minBeltName: 'Faixa Azul', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 3, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_pass_over_under: {
    id: 'bjj_tech_pass_over_under',
    technicalName: 'Over-Under Pass (Passagem Por Cima e Por Baixo)',
    displayName: 'Passagem Over-Under de Pressão',
    category: 'passagem_guarda',
    objective: 'passagem',
    description: 'Um braço envolve a coxa por cima enquanto o outro entra por baixo da perna oposta, colando a cabeça no quadril do guardeiro.',
    initialPositions: ['guard_open', 'guard_butterfly'],
    executorRole: 'por_cima',
    positionalPrerequisites: 'Nenhum laço de manga ativo.',
    requiredGrips: ['esgrima_simples', 'faixa_e_calca'],
    relevantAttributes: ['strength', 'technique'],
    minMasteryLevel: 2,
    staminaCost: 20,
    estimatedDurationSeconds: 6,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 16,
        staminaCostOpponent: 22,
        potentialPoints: 3,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Pressão metódica inescapável! As pernas de B são abertas e o passador estabelece o cem quilos (+3 pontos).'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_e_manga',
        staminaCostExecutor: 18,
        staminaCostOpponent: 14,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O guardeiro empurra a cabeça de B e recupera a guarda fechada.'
      }
    ],
    possibleDefenses: ['bjj_def_guard_retention'],
    possibleCounters: [],
    legality: { minBeltRank: 1, minBeltName: 'Faixa Azul', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 3, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_pass_double_under: {
    id: 'bjj_tech_pass_double_under',
    technicalName: 'Double Under Pass (Embocada)',
    displayName: 'Passagem na Embocada (Double Under)',
    category: 'passagem_guarda',
    objective: 'passagem',
    description: 'Dois braços mergulham por baixo das coxas de B juntando as mãos na cintura, erguendo o quadril de B para empilhar sobre o pescoço.',
    initialPositions: ['guard_closed', 'guard_open'],
    executorRole: 'por_cima',
    positionalPrerequisites: 'Guarda fechada de B aberta.',
    requiredGrips: ['dupla_esgrima', 'faixa_e_calca'],
    relevantAttributes: ['strength', 'technique'],
    minMasteryLevel: 1,
    staminaCost: 18,
    estimatedDurationSeconds: 5,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 16,
        staminaCostOpponent: 20,
        potentialPoints: 3,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Empilhamento devastador! A coluna de B dobra, o passador contorna a cabeça e cai estabilizado no cem quilos (+3 pts).'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'bottom_turtle',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'nenhuma',
        staminaCostExecutor: 18,
        staminaCostOpponent: 15,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O guardeiro gira sobre o ombro e fecha na tartaruga para não ceder os 3 pontos de passagem.'
      }
    ],
    possibleDefenses: ['bjj_def_guard_retention'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 3, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_pass_smash: {
    id: 'bjj_tech_pass_smash',
    technicalName: 'Smash Pass',
    displayName: 'Smash Pass (Esmagamento de Pernas)',
    category: 'passagem_guarda',
    objective: 'passagem',
    description: 'Cruza a perna do guardeiro sobre a outra e joga todo o peso da barriga e quadril sobre os joelhos dele, imobilizando o quadril.',
    initialPositions: ['guard_open', 'guard_half'],
    executorRole: 'por_cima',
    positionalPrerequisites: 'Pernas de B colapsadas para um dos lados.',
    requiredGrips: ['gola_e_calca', 'esgrima_simples'],
    relevantAttributes: ['strength', 'technique'],
    minMasteryLevel: 2,
    staminaCost: 18,
    estimatedDurationSeconds: 5,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 15,
        staminaCostOpponent: 22,
        potentialPoints: 3,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'As pernas do rival são esmagadas sem mobilidade, permitindo a transição livre para o cem quilos (+3 pts).'
      },
      {
        outcomeType: 'sucesso_parcial',
        resultingPositionId: 'top_mount',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_cruzada',
        staminaCostExecutor: 18,
        staminaCostOpponent: 20,
        potentialPoints: 4,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O passador desliza o joelho diretamente sobre a barriga e monta com facilidade (+4 pts).'
      }
    ],
    possibleDefenses: ['bjj_def_pass_frame'],
    possibleCounters: [],
    legality: { minBeltRank: 1, minBeltName: 'Faixa Azul', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 3, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_pass_half_guard: {
    id: 'bjj_tech_pass_half_guard',
    technicalName: 'Passagem da Meia-Guarda',
    displayName: 'Passagem Tradicional da Meia-Guarda',
    category: 'passagem_guarda',
    objective: 'passagem',
    description: 'Uso de crossface e esgrima profunda para espalmar o oponente no chão, desvencilhando o pé preso com o calcanhar livre.',
    initialPositions: ['top_half_guard_control', 'guard_half', 'top_passing_process', 'trans_guard_recovery', 'trans_reversal', 'trans_scramble'],
    executorRole: 'por_cima',
    positionalPrerequisites: 'Cabeça de B dominada com o ombro no queixo.',
    requiredGrips: ['esgrima_simples'],
    relevantAttributes: ['technique', 'strength', 'fightIq'],
    minMasteryLevel: 0,
    staminaCost: 16,
    estimatedDurationSeconds: 5,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 14,
        staminaCostOpponent: 18,
        potentialPoints: 3,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O pé preso é liberado com maestria técnica e o passador crava os 3 pontos da passagem no cem quilos!'
      },
      {
        outcomeType: 'sucesso_parcial',
        resultingPositionId: 'top_mount',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_cruzada',
        staminaCostExecutor: 18,
        staminaCostOpponent: 16,
        potentialPoints: 4,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Em vez do 100kg, o passador passa a perna diretamente para a montada completa (+4 pts).'
      }
    ],
    possibleDefenses: ['bjj_def_pass_frame'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 3, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  // =========================================================================
  // F. CONTROLES POSICIONAIS (7 técnicas)
  // =========================================================================

  bjj_tech_ctrl_side_stabilize: {
    id: 'bjj_tech_ctrl_side_stabilize',
    technicalName: 'Estabilização do Cem Quilos',
    displayName: 'Pressão e Fixação no Cem Quilos',
    category: 'controle_posicional',
    objective: 'estabilizacao',
    description: 'Quadril baixo, base aberta de joelhos e peso focado no diafragma do adversário com pegada de esgrima e nuca.',
    initialPositions: ['top_side_control', 'top_kesa_gatame', 'top_north_south', 'def_side_control', 'escape_side_control', 'trans_reversal'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Posicionamento lateral consolidado.',
    requiredGrips: ['esgrima_simples'],
    relevantAttributes: ['technique', 'strength', 'durability' as any],
    minMasteryLevel: 0,
    staminaCost: 8,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 6,
        staminaCostOpponent: 16,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Pressão asfixiante que drena o oxigênio do adversário e impede qualquer fuga de quadril.'
      }
    ],
    possibleDefenses: ['bjj_tech_esc_side_hip_escape'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_tech_ctrl_north_south_trans: {
    id: 'bjj_tech_ctrl_north_south_trans',
    technicalName: 'Transição para Norte-Sul',
    displayName: 'Transição de Cem Quilos para Norte-Sul',
    category: 'controle_posicional',
    objective: 'transicao',
    description: 'Gira o tronco por cima da cabeça de B espalmando o peito sobre o rosto e travando os braços de B esticados no tatame.',
    initialPositions: ['top_side_control'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Adversário tentando empurrar o quadril.',
    requiredGrips: ['dupla_esgrima'],
    relevantAttributes: ['technique', 'fightIq'],
    minMasteryLevel: 1,
    staminaCost: 10,
    estimatedDurationSeconds: 3,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_north_south',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'dupla_esgrima',
        staminaCostExecutor: 8,
        staminaCostOpponent: 12,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Transição fluida para o norte-sul, neutralizando completamente as pernas do defensor.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_tech_ctrl_knee_on_belly: {
    id: 'bjj_tech_ctrl_knee_on_belly',
    technicalName: 'Joelho na Barriga',
    displayName: 'Subida para Joelho na Barriga (+2 pts)',
    category: 'controle_posicional',
    objective: 'estabilizacao',
    description: 'Posta a canela firmemente no abdômen do rival erguendo o tronco com pegadas na gola e calça para esticar o oponente.',
    initialPositions: ['top_side_control', 'def_side_control', 'escape_side_control'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Controle lateral estabelecido.',
    requiredGrips: ['gola_e_calca'],
    relevantAttributes: ['technique', 'speed', 'strength'],
    minMasteryLevel: 0,
    staminaCost: 10,
    estimatedDurationSeconds: 3,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_knee_on_belly',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_e_calca',
        staminaCostExecutor: 8,
        staminaCostOpponent: 16,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Joelho cravado no plexo com base aberta! Árbitro marca +2 pontos oficiais na CBJJ/IBJJF após 3 segundos.'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 10,
        staminaCostOpponent: 10,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O adversário empurra o joelho para fora e o atleta recompõe o cem quilos com segurança.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_ctrl_mount_transition: {
    id: 'bjj_tech_ctrl_mount_transition',
    technicalName: 'Transição para Montada',
    displayName: 'Avanço para a Montada Completa (+4 pts)',
    category: 'controle_posicional',
    objective: 'estabilizacao',
    description: 'Desliza o joelho pelo abdômen do oponente abrindo a perna até o outro lado do tatame, sentando com postura firme no peito de B.',
    initialPositions: ['top_side_control', 'top_knee_on_belly', 'top_kesa_gatame', 'top_north_south', 'top_half_guard_control', 'def_side_control', 'escape_side_control', 'trans_reversal'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Braço de B esgrimado ou joelho no abdômen.',
    requiredGrips: ['esgrima_simples', 'gola_cruzada'],
    relevantAttributes: ['technique', 'fightIq'],
    minMasteryLevel: 0,
    staminaCost: 12,
    estimatedDurationSeconds: 3,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_mount',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_cruzada',
        staminaCostExecutor: 10,
        staminaCostOpponent: 16,
        potentialPoints: 4,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Montada consolidada com os dois joelhos no chão! Árbitro sinaliza 4 pontos no placar oficial!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'guard_half',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 12,
        staminaCostOpponent: 10,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário pesca a perna no meio do caminho com a meia-guarda.'
      }
    ],
    possibleDefenses: ['bjj_tech_esc_mount_elbow_knee'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 4, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_ctrl_high_mount_climb: {
    id: 'bjj_tech_ctrl_high_mount_climb',
    technicalName: 'Escalada para Montada Alta',
    displayName: 'Escalada para Montada Alta nas Axilas',
    category: 'controle_posicional',
    objective: 'estabilizacao',
    description: 'Desliza os joelhos para cima empurrando os cotovelos do oponente acima da cabeça, neutralizando defesas de ponte/upa.',
    initialPositions: ['top_mount', 'def_mount', 'escape_mount'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Montada estabelecida com peito de B contido.',
    requiredGrips: ['gola_cruzada'],
    relevantAttributes: ['technique', 'flexibility'],
    minMasteryLevel: 1,
    staminaCost: 10,
    estimatedDurationSeconds: 3,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_high_mount',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_cruzada',
        staminaCostExecutor: 8,
        staminaCostOpponent: 18,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Joelhos encaixados nas axilas! Os braços de B ficam totalmente presos e vulneráveis a armlocks e triângulos.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_tech_ctrl_back_take: {
    id: 'bjj_tech_ctrl_back_take',
    technicalName: 'Transição para as Costas',
    displayName: 'Pegada de Costas com Ganchos (+4 pts)',
    category: 'controle_posicional',
    objective: 'estabilizacao',
    description: 'Aproveita quando o adversário vira de lado para passar a perna por trás, encaixando os dois ganchos na virilha com seatbelt.',
    initialPositions: ['top_mount', 'top_high_mount', 'top_side_control', 'top_kesa_gatame', 'top_north_south', 'top_knee_on_belly', 'top_turtle_control', 'bottom_turtle', 'def_mount', 'escape_mount', 'stand_body_lock', 'stand_back_control'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Adversário dando as costas ou em quatro apoios.',
    requiredGrips: ['cinto_seguranca'],
    relevantAttributes: ['technique', 'speed', 'flexibility'],
    minMasteryLevel: 1,
    staminaCost: 14,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_back_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'cinto_seguranca',
        staminaCostExecutor: 12,
        staminaCostOpponent: 18,
        potentialPoints: 4,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Cinto de segurança travado e ganchos encaixados na virilha! +4 pontos anotados no placar oficial!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'bottom_turtle',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'cinto_seguranca',
        staminaCostExecutor: 14,
        staminaCostOpponent: 12,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário fecha os cotovelos nos joelhos e impede o encaixe do segundo gancho.'
      }
    ],
    possibleDefenses: ['bjj_tech_esc_turtle_defense'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 4, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_ctrl_dominant_retention: {
    id: 'bjj_tech_ctrl_dominant_retention',
    technicalName: 'Retenção de Posição Dominante',
    displayName: 'Manutenção de Pressão e Amarração Ativa',
    category: 'controle_posicional',
    objective: 'estabilizacao',
    description: 'Ajuste de pegadas e contrapeso para anular as tentativas de explosão e pontes do adversário, gastando o cronômetro.',
    initialPositions: ['top_mount', 'top_high_mount', 'top_side_control', 'top_kesa_gatame', 'top_north_south', 'top_back_control', 'top_turtle_control', 'bottom_turtle', 'def_mount', 'escape_mount', 'def_back_control', 'escape_back_control', 'def_submission'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Posição dominante ativa.',
    requiredGrips: ['esgrima_simples', 'cinto_seguranca'],
    relevantAttributes: ['stamina', 'fightIq'],
    minMasteryLevel: 0,
    staminaCost: 8,
    estimatedDurationSeconds: 5,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 6,
        staminaCostOpponent: 16,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Controle firme mantido sem dar espaço para qualquer tentativa de saída.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  // =========================================================================
  // G. FUGAS E RECUPERAÇÕES (8 técnicas)
  // =========================================================================

  bjj_tech_esc_mount_elbow_knee: {
    id: 'bjj_tech_esc_mount_elbow_knee',
    technicalName: 'Fuga de Montada Cotovelo-Joelho',
    displayName: 'Saída de Cotovelo-Joelho na Montada',
    category: 'fugas_e_recuperacoes',
    objective: 'fuga',
    description: 'Vira de lado empurrando o joelho do montador com o cotovelo, pescando a perna dele para recolher a meia-guarda.',
    initialPositions: ['top_mount', 'top_high_mount', 'def_mount', 'escape_mount'],
    executorRole: 'defensor',
    positionalPrerequisites: 'Cotovelos fechados protegendo o tronco.',
    requiredGrips: ['nenhuma'],
    relevantAttributes: ['technique', 'flexibility', 'speed'],
    minMasteryLevel: 0,
    staminaCost: 14,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_half',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 12,
        staminaCostOpponent: 10,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Perna pescada com sucesso! A montada é quebrada e a meia-guarda restabelecida.'
      },
      {
        outcomeType: 'falha_neutra',
        resultingPositionId: 'top_mount',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'gola_cruzada',
        staminaCostExecutor: 16,
        staminaCostOpponent: 8,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O montador abre a base com o joelho alto e neutraliza a saída de cotovelo.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_tech_esc_mount_upa: {
    id: 'bjj_tech_esc_mount_upa',
    technicalName: 'Ponte e Reversão (Upa)',
    displayName: 'Fuga de Upa com Braço Travado',
    category: 'fugas_e_recuperacoes',
    objective: 'fuga',
    description: 'Trava o braço e o pé do montador do mesmo lado, explodindo o quadril em ponte diagonal para capotar o adversário por cima.',
    initialPositions: ['top_mount', 'top_high_mount', 'def_mount', 'escape_mount'],
    executorRole: 'defensor',
    positionalPrerequisites: 'Braço do adversário dominado no peito e pé do mesmo lado grampeado.',
    requiredGrips: ['manga_simples'],
    relevantAttributes: ['strength', 'speed', 'technique'],
    minMasteryLevel: 0,
    staminaCost: 16,
    estimatedDurationSeconds: 3,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_e_manga',
        staminaCostExecutor: 14,
        staminaCostOpponent: 12,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'Barrigada monumental de Upa! O adversário rola de costas e o atleta cai por cima dentro da guarda fechada!'
      },
      {
        outcomeType: 'falha_neutra',
        resultingPositionId: 'top_mount',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'gola_cruzada',
        staminaCostExecutor: 18,
        staminaCostOpponent: 8,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O montador posta a mão livre no chão e absorve o impacto da ponte.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_esc_side_hip_escape: {
    id: 'bjj_tech_esc_side_hip_escape',
    technicalName: 'Fuga de Quadril do Cem Quilos',
    displayName: 'Fuga de Quadril (Shrimping) no 100kg',
    category: 'fugas_e_recuperacoes',
    objective: 'fuga',
    description: 'Cria frames com os antebraços no queixo e quadril de B, fugindo o bumbum com força para abrir espaço e enfiar o joelho de reposição.',
    initialPositions: ['top_side_control', 'top_kesa_gatame', 'top_north_south', 'top_knee_on_belly', 'top_half_guard_control', 'top_passing_process', 'def_side_control', 'escape_side_control', 'trans_reversal'],
    executorRole: 'defensor',
    positionalPrerequisites: 'Mãos e antebraços posicionados como escoras.',
    requiredGrips: ['esgrima_simples', 'nenhuma'],
    relevantAttributes: ['technique', 'flexibility', 'speed'],
    minMasteryLevel: 0,
    staminaCost: 14,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_half',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 12,
        staminaCostOpponent: 10,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Espaço aberto com a fuga de quadril e meia-guarda recomposta com sucesso!'
      },
      {
        outcomeType: 'sucesso_parcial',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'gola_e_manga',
        staminaCostExecutor: 14,
        staminaCostOpponent: 10,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Movimento explosivo que permite contornar a perna inteira e fechar a guarda completa!'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_tech_esc_side_guard_rec: {
    id: 'bjj_tech_esc_side_guard_rec',
    technicalName: 'Recuperação de Guarda do 100kg',
    displayName: 'Giro de Tartaruga e Reposição no 100kg',
    category: 'fugas_e_recuperacoes',
    objective: 'fuga',
    description: 'Gira de bruços em quatro apoios para escapar da imobilização de peito, sentando imediatamente de frente para repor guarda.',
    initialPositions: ['top_side_control', 'top_kesa_gatame', 'top_north_south', 'top_knee_on_belly', 'top_half_guard_control', 'def_side_control', 'escape_side_control'],
    executorRole: 'defensor',
    positionalPrerequisites: 'Braço distante livre para apoiar.',
    requiredGrips: ['esgrima_simples'],
    relevantAttributes: ['speed', 'technique'],
    minMasteryLevel: 1,
    staminaCost: 14,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_open',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 12,
        staminaCostOpponent: 10,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Giro ágil que frustra o controle lateral e coloca a luta de volta na guarda aberta.'
      },
      {
        outcomeType: 'disputa',
        resultingPositionId: 'bottom_turtle',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'cinto_seguranca',
        staminaCostExecutor: 14,
        staminaCostOpponent: 12,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O adversário acompanha o giro e bloqueia a virada de frente, mantendo o controle na tartaruga.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_tech_esc_back_slide: {
    id: 'bjj_tech_esc_back_slide',
    technicalName: 'Fuga de Costas por Deslizamento',
    displayName: 'Deslizamento de Escápulas no Solo',
    category: 'fugas_e_recuperacoes',
    objective: 'fuga',
    description: 'Controla as mãos do estrangulador em 2-contra-1, deslizando o quadril e as costas até o chão sobre o braço fraco de B.',
    initialPositions: ['top_back_control', 'stand_back_control', 'def_back_control', 'escape_back_control'],
    executorRole: 'defensor',
    positionalPrerequisites: 'Dois braços protegendo o pescoço do mata-leão.',
    requiredGrips: ['cinto_seguranca'],
    relevantAttributes: ['technique', 'fightIq', 'durability' as any],
    minMasteryLevel: 1,
    staminaCost: 16,
    estimatedDurationSeconds: 5,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_half',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 14,
        staminaCostOpponent: 14,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Ombros apoiados no chão e quadril girado para dentro! As costas são salvas e a luta cai na meia-guarda.'
      },
      {
        outcomeType: 'falha_neutra',
        resultingPositionId: 'top_back_control',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'cinto_seguranca',
        staminaCostExecutor: 18,
        staminaCostOpponent: 10,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O adversário ajusta o gancho de cima e puxa o executor de volta para o peito.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_tech_esc_turtle_defense: {
    id: 'bjj_tech_esc_turtle_defense',
    technicalName: 'Defesa e Blindagem da Tartaruga',
    displayName: 'Blindagem de Quatro Apoios (Shell Defense)',
    category: 'fugas_e_recuperacoes',
    objective: 'defesa',
    description: 'Cola os cotovelos nos joelhos e esconde o pescoço com as mãos nas golas, negando qualquer entrada de ganchos.',
    initialPositions: ['bottom_turtle', 'top_turtle_control'],
    executorRole: 'defensor',
    positionalPrerequisites: 'Posicionamento em quatro apoios.',
    requiredGrips: ['nenhuma'],
    relevantAttributes: ['durability' as any, 'technique'],
    minMasteryLevel: 0,
    staminaCost: 10,
    estimatedDurationSeconds: 5,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'bottom_turtle',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'nenhuma',
        staminaCostExecutor: 8,
        staminaCostOpponent: 12,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Blindagem perfeita! O oponente não encontra espaço para colocar os ganchos nem enfiar a mão na gola.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_tech_esc_turtle_reversal: {
    id: 'bjj_tech_esc_turtle_reversal',
    technicalName: 'Reversão a partir da Tartaruga (Sit-out)',
    displayName: 'Sit-Out e Reversão na Tartaruga',
    category: 'fugas_e_recuperacoes',
    objective: 'fuga',
    description: 'Chuta a perna por baixo girando o quadril e grampeia a perna de B, invertendo a posição para ficar por cima.',
    initialPositions: ['bottom_turtle', 'top_turtle_control'],
    executorRole: 'defensor',
    positionalPrerequisites: 'Adversário pesando em excesso sobre um dos lados.',
    requiredGrips: ['esgrima_simples'],
    relevantAttributes: ['speed', 'technique', 'strength'],
    minMasteryLevel: 1,
    staminaCost: 16,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 14,
        staminaCostOpponent: 14,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Sit-out relâmpago! O atleta inverte o controle e cai por cima no cem quilos (+2 da reversão).'
      },
      {
        outcomeType: 'disputa',
        resultingPositionId: 'trans_scramble',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 16,
        staminaCostOpponent: 14,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'Ambos se enrolam na virada e disputam quem sobe primeiro em scramble aberto.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: false }
  },

  bjj_tech_esc_turtle_guard_rec: {
    id: 'bjj_tech_esc_turtle_guard_rec',
    technicalName: 'Reposição de Guarda da Tartaruga',
    displayName: 'Sentada com Reposição de Guarda',
    category: 'fugas_e_recuperacoes',
    objective: 'fuga',
    description: 'Gira sobre o ombro externo e senta de frente para o adversário, trazendo as pernas para a guarda fechada ou borboleta.',
    initialPositions: ['bottom_turtle', 'top_turtle_control'],
    executorRole: 'defensor',
    positionalPrerequisites: 'Cabeça protegida de guilhotina.',
    requiredGrips: ['disputa_aberta'],
    relevantAttributes: ['technique', 'flexibility'],
    minMasteryLevel: 1,
    staminaCost: 12,
    estimatedDurationSeconds: 3,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'gola_e_manga',
        staminaCostExecutor: 10,
        staminaCostOpponent: 8,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Giro limpo sentando de frente e fechando a guarda completa com firmeza.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  // =========================================================================
  // H. FINALIZAÇÕES (17 técnicas)
  // =========================================================================

  bjj_sub_rear_naked_choke: {
    id: 'bjj_sub_rear_naked_choke',
    technicalName: 'Mata-Leão (Hadaka Jime)',
    displayName: 'Mata-Leão Pelas Costas',
    category: 'finalizacoes',
    objective: 'finalizacao',
    description: 'Braço envolve o pescoço travando no próprio bíceps oposto, com a mão atrás da nuca de B e expansão peitoral asfixiante.',
    initialPositions: ['top_back_control', 'stand_back_control', 'def_back_control', 'escape_back_control', 'def_submission'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Controle de costas estabelecido com queixo de B exposto.',
    requiredGrips: ['cinto_seguranca'],
    relevantAttributes: ['technique', 'strength', 'fightIq'],
    minMasteryLevel: 0,
    staminaCost: 22,
    estimatedDurationSeconds: 6,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_back_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'cinto_seguranca',
        staminaCostExecutor: 18,
        staminaCostOpponent: 40,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 5,
        description: 'O estrangulamento mais definitivo da arte suave! O adversário bate três vezes no tatame em desistência imediata!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'def_back_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'cinto_seguranca',
        staminaCostExecutor: 20,
        staminaCostOpponent: 18,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário abaixa o queixo e segura as mãos do executor em dois-contra-um, aliviando o fluxo carotídeo.'
      }
    ],
    possibleDefenses: ['bjj_def_rnc_two_on_one'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_sub_cross_collar: {
    id: 'bjj_sub_cross_collar',
    technicalName: 'Estrangulamento Cruzado de Gola',
    displayName: 'Estrangulamento Cruzado Tradicional',
    category: 'finalizacoes',
    objective: 'finalizacao',
    description: 'Pegadas cruzadas profundas nas duas golas do quimono sob as orelhas do adversário, fechando como tesoura de punhos com tração de cotovelos.',
    initialPositions: ['top_mount', 'top_high_mount', 'guard_closed', 'def_mount', 'escape_mount'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Quimono ajustado com pegadas profundas nas golas.',
    requiredGrips: ['gola_cruzada'],
    relevantAttributes: ['technique', 'strength'],
    minMasteryLevel: 0,
    staminaCost: 18,
    estimatedDurationSeconds: 6,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_mount',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_cruzada',
        staminaCostExecutor: 16,
        staminaCostOpponent: 35,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 5,
        description: 'Estrangulamento clássico da linhagem Gracie perfeitamente arrochado! O adversário bate no peito em desistência!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'top_mount',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_cruzada',
        staminaCostExecutor: 18,
        staminaCostOpponent: 15,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O defensor empurra os cotovelos para cima e cria espaço para respirar.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: false, legalNotes: 'Exclusivo com quimono (Gi).' },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_sub_ezequiel: {
    id: 'bjj_sub_ezequiel',
    technicalName: 'Estrangulamento Ezequiel (Sode Guruma Jime)',
    displayName: 'Estrangulamento Ezequiel da Montada',
    category: 'finalizacoes',
    objective: 'finalizacao',
    description: 'Enfia quatro dedos dentro da própria manga do quimono e passa o outro antebraço sob o queixo, comprimindo a traqueia com tesoura frontal.',
    initialPositions: ['top_mount', 'top_high_mount', 'top_side_control', 'guard_closed'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Acesso livre ao pescoço sem que o defensor controle as mangas.',
    requiredGrips: ['gola_e_manga', 'manga_simples'],
    relevantAttributes: ['technique', 'fightIq'],
    minMasteryLevel: 1,
    staminaCost: 16,
    estimatedDurationSeconds: 5,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_mount',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_cruzada',
        staminaCostExecutor: 14,
        staminaCostOpponent: 30,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 4,
        description: 'Ezequiel fatal que fecha a garganta do oponente! Tapout imediato do defensor!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'top_mount',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_e_manga',
        staminaCostExecutor: 16,
        staminaCostOpponent: 12,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário empurra o punho na direção contrária antes do encaixe da faca da mão.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_sub_bow_and_arrow: {
    id: 'bjj_sub_bow_and_arrow',
    technicalName: 'Estrangulamento Arco e Flecha (Bow and Arrow)',
    displayName: 'Estrangulamento Arco e Flecha',
    category: 'finalizacoes',
    objective: 'finalizacao',
    description: 'Pegada profunda na gola oposta pelas costas e na calça do rival, apoiando a perna sobre o ombro e arqueando o corpo como um arco.',
    initialPositions: ['top_back_control'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Controle de costas e pegada cruzada profunda na gola de B.',
    requiredGrips: ['gola_e_calca'],
    relevantAttributes: ['technique', 'flexibility', 'strength'],
    minMasteryLevel: 1,
    staminaCost: 20,
    estimatedDurationSeconds: 6,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_back_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'gola_e_calca',
        staminaCostExecutor: 16,
        staminaCostOpponent: 38,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 5,
        description: 'Pressão estranguladora multiplicada pela alavanca da perna! O adversário bate em desespero verbal!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'escape_back_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'cinto_seguranca',
        staminaCostExecutor: 20,
        staminaCostOpponent: 16,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário puxa a gola com as duas mãos e gira os quadris na direção do executor.'
      }
    ],
    possibleDefenses: ['bjj_def_rnc_two_on_one'],
    possibleCounters: [],
    legality: { minBeltRank: 1, minBeltName: 'Faixa Azul', giAllowed: true, noGiAllowed: false, legalNotes: 'Exclusivo de quimono (Gi).' },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_sub_triangle_choke: {
    id: 'bjj_sub_triangle_choke',
    technicalName: 'Triângulo (Sankaku Jime)',
    displayName: 'Estrangulamento Triangular com Pernas',
    category: 'finalizacoes',
    objective: 'finalizacao',
    description: 'Trava a perna em figura de quatro prendendo a cabeça e um braço do oponente, puxando a cabeça para baixo com as mãos.',
    initialPositions: ['guard_closed', 'guard_open', 'top_mount', 'top_high_mount', 'def_submission'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Um braço dentro e outro fora da linha das pernas.',
    requiredGrips: ['gola_e_manga', 'manga_simples'],
    relevantAttributes: ['flexibility', 'technique'],
    minMasteryLevel: 1,
    staminaCost: 20,
    estimatedDurationSeconds: 7,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'triangulo_corporal',
        staminaCostExecutor: 16,
        staminaCostOpponent: 35,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 5,
        description: 'Carótidas fechadas em tesoura perfeita de pernas! Vitória por finalização por triângulo!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'guard_open',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 20,
        staminaCostOpponent: 18,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário empilha peso sobre a nuca do executor e abre o triângulo com postura forte.'
      }
    ],
    possibleDefenses: ['bjj_def_triangle_posture'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_sub_anaconda: {
    id: 'bjj_sub_anaconda',
    technicalName: 'Estrangulamento Anaconda',
    displayName: 'Estrangulamento Anaconda',
    category: 'finalizacoes',
    objective: 'finalizacao',
    description: 'Passa o braço por baixo do pescoço e através da axila de B, travando no próprio bíceps e rolando como jacaré para apertar.',
    initialPositions: ['top_turtle_control', 'stand_front_headlock'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Controle de cabeça frontal com adversário em quatro apoios.',
    requiredGrips: ['front_headlock'],
    relevantAttributes: ['technique', 'strength', 'flexibility'],
    minMasteryLevel: 2,
    staminaCost: 22,
    estimatedDurationSeconds: 6,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 18,
        staminaCostOpponent: 36,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 5,
        description: 'Rolamento de anaconda perfeito! O fluxo carotídeo é cortado e o oponente bate em desespero!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'bottom_turtle',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'front_headlock',
        staminaCostExecutor: 22,
        staminaCostOpponent: 14,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário caminha os quadris na direção do executor e alivia a pressão do estrangulamento.'
      }
    ],
    possibleDefenses: ['bjj_def_guillotine_tripod'],
    possibleCounters: [],
    legality: { minBeltRank: 1, minBeltName: 'Faixa Azul', giAllowed: true, noGiAllowed: true },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_sub_darce: {
    id: 'bjj_sub_darce',
    technicalName: 'Estrangulamento D\'Arce (Brabo Choke)',
    displayName: 'Estrangulamento D\'Arce / Brabo Choke',
    category: 'finalizacoes',
    objective: 'finalizacao',
    description: 'Entrada oposta à anaconda: braço mergulha por baixo da axila de B e sai ao lado do pescoço, travando no bíceps com pressão no ombro.',
    initialPositions: ['top_half_guard_control', 'top_side_control', 'top_turtle_control'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Braço de B esgrimado ou exposto.',
    requiredGrips: ['esgrima_simples', 'front_headlock'],
    relevantAttributes: ['technique', 'length' as any, 'fightIq'],
    minMasteryLevel: 2,
    staminaCost: 20,
    estimatedDurationSeconds: 6,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 16,
        staminaCostOpponent: 36,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 5,
        description: 'D\'Arce justíssimo! O ombro do próprio oponente comprime a carótida e ele bate em desistência!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'guard_half',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 18,
        staminaCostOpponent: 14,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário gira de costas para o chão e alivia a compressão de nuca.'
      }
    ],
    possibleDefenses: ['bjj_def_guillotine_tripod'],
    possibleCounters: [],
    legality: { minBeltRank: 1, minBeltName: 'Faixa Azul', giAllowed: true, noGiAllowed: true },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_sub_guillotine: {
    id: 'bjj_sub_guillotine',
    technicalName: 'Guilhotina (Guillotine Choke)',
    displayName: 'Guilhotina Ajustada com Guarda Fechada',
    category: 'finalizacoes',
    objective: 'finalizacao',
    description: 'Envolve o pescoço de B sob a axila com pegada nas próprias mãos, fechando a guarda com extensão lombar violenta contra a traqueia.',
    initialPositions: ['guard_closed', 'stand_front_headlock'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Cabeça do oponente abaixada ou tentativa de entrada de queda.',
    requiredGrips: ['front_headlock'],
    relevantAttributes: ['technique', 'strength', 'fightIq'],
    minMasteryLevel: 1,
    staminaCost: 22,
    estimatedDurationSeconds: 5,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'front_headlock',
        staminaCostExecutor: 18,
        staminaCostOpponent: 38,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 5,
        description: 'Guilhotina travada com arqueamento de coluna! O oponente bate em desistência imediata!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 24,
        staminaCostOpponent: 16,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário salta o corpo para o lado oposto ao estrangulamento (saída Von Flue) e neutraliza o golpe.'
      }
    ],
    possibleDefenses: ['bjj_def_guillotine_tripod'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_sub_armlock_straight: {
    id: 'bjj_sub_armlock_straight',
    technicalName: 'Chave de Braço Reta (Juji Gatame)',
    displayName: 'Armlock da Montada / Lateral',
    category: 'finalizacoes',
    objective: 'finalizacao',
    description: 'Prensa o peito no braço do oponente, passa a perna por cima da cabeça e eleva o quadril hiperextendendo a articulação do cotovelo.',
    initialPositions: ['top_mount', 'top_high_mount', 'top_side_control', 'top_knee_on_belly', 'def_mount', 'escape_mount', 'def_submission'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Braço de B isolado.',
    requiredGrips: ['manga_simples', 'dupla_manga'],
    relevantAttributes: ['technique', 'speed', 'flexibility'],
    minMasteryLevel: 0,
    staminaCost: 18,
    estimatedDurationSeconds: 6,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_mount',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'dupla_manga',
        staminaCostExecutor: 15,
        staminaCostOpponent: 35,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 5,
        description: 'Alavanca de cotovelo esticada ao limite anatômico! Três tapinhas no tatame e vitória por armlock!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'guard_open',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 20,
        staminaCostOpponent: 16,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário gira o polegar para fora e escapa no giro da hitchhiker escape.'
      }
    ],
    possibleDefenses: ['bjj_def_armlock_hitchhiker'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_sub_kimura: {
    id: 'bjj_sub_kimura',
    technicalName: 'Chave Kimura (Gyakude Garami)',
    displayName: 'Kimura Lock Tradicional',
    category: 'finalizacoes',
    objective: 'finalizacao',
    description: 'Pegada quatro no punho e cotovelo com braço dobrado a 90 graus, torcendo a articulação do ombro em rotação interna atrás das costas.',
    initialPositions: ['guard_closed', 'top_side_control', 'top_north_south', 'top_kesa_gatame', 'top_half_guard_control', 'guard_half', 'def_side_control', 'escape_side_control'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Punho do adversário no solo ou abdômen.',
    requiredGrips: ['manga_simples'],
    relevantAttributes: ['strength', 'technique'],
    minMasteryLevel: 0,
    staminaCost: 18,
    estimatedDurationSeconds: 6,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 15,
        staminaCostOpponent: 32,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 4,
        description: 'Torção brutal de ombro que força a desistência imediata do oponente!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'guard_half',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'manga_simples',
        staminaCostExecutor: 18,
        staminaCostOpponent: 14,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário segura a própria faixa e calça, bloqueando a extensão do ombro.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_sub_americana: {
    id: 'bjj_sub_americana',
    technicalName: 'Chave Americana (Ude Garami)',
    displayName: 'Chave Americana de Ombro no 100kg',
    category: 'finalizacoes',
    objective: 'finalizacao',
    description: 'Alavanca de ombro em figura de quatro com o braço de B dobrado a 90 graus apontando para cima, girando em rotação externa.',
    initialPositions: ['top_side_control', 'top_kesa_gatame', 'top_north_south', 'top_mount', 'top_high_mount', 'def_side_control', 'escape_side_control', 'def_mount', 'def_submission'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Braço do adversário colado no chão na linha do ombro.',
    requiredGrips: ['manga_simples'],
    relevantAttributes: ['strength', 'technique'],
    minMasteryLevel: 0,
    staminaCost: 16,
    estimatedDurationSeconds: 5,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 14,
        staminaCostOpponent: 30,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 4,
        description: 'Ombro torcido no limite mecânico! Três tapinhas no tatame e finalização por americana!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 16,
        staminaCostOpponent: 12,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O oponente estica o braço para baixo antes da trava e alivia a alavanca.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_sub_omoplata: {
    id: 'bjj_sub_omoplata',
    technicalName: 'Omoplata (Ashi Garami Shoulder Lock)',
    displayName: 'Finalização por Omoplata',
    category: 'finalizacoes',
    objective: 'finalizacao',
    description: 'Trava de ombro com as pernas laçando o braço, sentando na linha da cintura e projetando o tronco para a frente.',
    initialPositions: ['guard_closed', 'guard_open', 'guard_lasso'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Braço isolado e perna sobre as costas de B.',
    requiredGrips: ['faixa_e_calca'],
    relevantAttributes: ['technique', 'flexibility'],
    minMasteryLevel: 1,
    staminaCost: 18,
    estimatedDurationSeconds: 6,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'faixa_e_calca',
        staminaCostExecutor: 15,
        staminaCostOpponent: 32,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 4,
        description: 'O ombro é torcido sem escapatória e o oponente desiste com três tapas!'
      },
      {
        outcomeType: 'sucesso_parcial',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 18,
        staminaCostOpponent: 15,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O adversário rola de frente e o executor estabiliza os 2 pontos da raspagem por cima.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 2, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_sub_straight_ankle_lock: {
    id: 'bjj_sub_straight_ankle_lock',
    technicalName: 'Chave de Tornozelo Reta (Botinha)',
    displayName: 'Botinha / Chave de Tornozelo Reta',
    category: 'finalizacoes',
    objective: 'finalizacao',
    description: 'Prende o calcanhar sob a axila com a faca do antebraço no tendão de Aquiles, arqueando o tronco para trás sem girar o joelho.',
    initialPositions: ['guard_single_leg_x', 'trans_leg_entanglement', 'guard_open', 'guard_fifty_fifty'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Linha do joelho do adversário contida pelas pernas.',
    requiredGrips: ['emaranhamento_pernas'],
    relevantAttributes: ['technique', 'strength'],
    minMasteryLevel: 0,
    staminaCost: 16,
    estimatedDurationSeconds: 5,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'trans_leg_entanglement',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'emaranhamento_pernas',
        staminaCostExecutor: 14,
        staminaCostOpponent: 32,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 4,
        description: 'Compressão violenta no tendão de Aquiles! Desistência incontestável por botinha reta!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'guard_open',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 16,
        staminaCostOpponent: 14,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário pisa com o pé no chão (putting on the boot) e alivia a curvatura do tornozelo.'
      }
    ],
    possibleDefenses: ['bjj_def_leg_lock_clear_knee'],
    possibleCounters: [],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true, legalNotes: 'Liberada a partir da faixa branca na CBJJ (sem torção lateral).' },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_sub_kneebar: {
    id: 'bjj_sub_kneebar',
    technicalName: 'Chave de Joelho Reta (Kneebar)',
    displayName: 'Kneebar / Chave de Joelho Reta',
    category: 'finalizacoes',
    objective: 'finalizacao',
    description: 'Armlock na perna: envolve o joelho de B entre as coxas com a rótula voltada para o peito do executor, hiperextendendo com o quadril.',
    initialPositions: ['guard_single_leg_x', 'guard_half', 'trans_leg_entanglement'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Perna estendida com quadril apoiado na articulação do joelho.',
    requiredGrips: ['emaranhamento_pernas'],
    relevantAttributes: ['technique', 'strength', 'fightIq'],
    minMasteryLevel: 2,
    staminaCost: 20,
    estimatedDurationSeconds: 6,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'trans_leg_entanglement',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'emaranhamento_pernas',
        staminaCostExecutor: 16,
        staminaCostOpponent: 38,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 5,
        description: 'Hiperextensão articular severa no joelho! O oponente bate rapidamente para preservar os ligamentos!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'guard_half',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 20,
        staminaCostOpponent: 16,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário cruza a perna livre em triângulo protegendo o calcanhar e flexionando o joelho.'
      }
    ],
    possibleDefenses: ['bjj_def_leg_lock_clear_knee'],
    possibleCounters: [],
    legality: { minAge: 18, minBeltRank: 3, minBeltName: 'Faixa Marrom', giAllowed: true, noGiAllowed: true, legalNotes: 'Permitida apenas para Faixa Marrom e Preta na CBJJ.' },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_sub_toe_hold: {
    id: 'bjj_sub_toe_hold',
    technicalName: 'Toe Hold (Mata-Leão no Pé)',
    displayName: 'Toe Hold / Chave de Pé em Figura de Quatro',
    category: 'finalizacoes',
    objective: 'finalizacao',
    description: 'Pegada em figura de quatro nos dedos e tornozelo de B, torcendo a ponta do pé em direção aos glúteos do adversário.',
    initialPositions: ['guard_half', 'guard_fifty_fifty', 'trans_leg_entanglement'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Pé do adversário flexionado acessível.',
    requiredGrips: ['emaranhamento_pernas'],
    relevantAttributes: ['technique', 'strength'],
    minMasteryLevel: 2,
    staminaCost: 18,
    estimatedDurationSeconds: 5,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'trans_leg_entanglement',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'emaranhamento_pernas',
        staminaCostExecutor: 15,
        staminaCostOpponent: 35,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 4,
        description: 'Torção aguda dos ligamentos do tornozelo! O adversário bate em sinal de desistência!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'trans_scramble',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 18,
        staminaCostOpponent: 15,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário gira na mesma direção da torção aliviando a tensão no tornozelo.'
      }
    ],
    possibleDefenses: ['bjj_def_leg_lock_clear_knee'],
    possibleCounters: [],
    legality: { minAge: 18, minBeltRank: 3, minBeltName: 'Faixa Marrom', giAllowed: true, noGiAllowed: true, legalNotes: 'Permitida apenas para Faixa Marrom e Preta na CBJJ.' },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_sub_heel_hook: {
    id: 'bjj_sub_heel_hook',
    technicalName: 'Heel Hook (Chave de Calcanhar)',
    displayName: 'Chave de Calcanhar (Heel Hook)',
    category: 'finalizacoes',
    objective: 'finalizacao',
    description: 'Isolamento do joelho com pinçamento das coxas e rotação do calcanhar com o punho, transmitindo torque destrutivo para os ligamentos cruzados do joelho.',
    initialPositions: ['guard_fifty_fifty', 'guard_single_leg_x', 'trans_leg_entanglement'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Linha do joelho de B presa abaixo dos quadris do executor.',
    requiredGrips: ['emaranhamento_pernas'],
    relevantAttributes: ['technique', 'fightIq', 'strength'],
    minMasteryLevel: 3,
    staminaCost: 20,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'trans_leg_entanglement',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'emaranhamento_pernas',
        staminaCostExecutor: 16,
        staminaCostOpponent: 45,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 5,
        description: 'Torque biomecânico devastador nos ligamentos! O adversário dá o tapinha com rapidez para evitar lesão grave!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'trans_scramble',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 20,
        staminaCostOpponent: 18,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário gira em sincronia puxando o joelho para fora do emaranhamento.'
      }
    ],
    possibleDefenses: ['bjj_def_leg_lock_clear_knee'],
    possibleCounters: [],
    legality: {
      minAge: 18,
      minBeltRank: 3,
      minBeltName: 'Faixa Marrom / No-Gi',
      giAllowed: false,
      noGiAllowed: true,
      illegalUnderCbjjRules: true,
      legalNotes: 'Estritamente PROIBIDA de quimono na CBJJ/IBJJF (desqualificação imediata). Liberada apenas no No-Gi avançado.'
    },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  bjj_sub_calf_slicer: {
    id: 'bjj_sub_calf_slicer',
    technicalName: 'Calf Slicer (Compressor de Panturrilha)',
    displayName: 'Calf Slicer / Compressor de Panturrilha',
    category: 'finalizacoes',
    objective: 'finalizacao',
    description: 'Encaixa a canela atrás da dobra do joelho de B, puxando o pé de B contra os glúteos para esmagar os músculos da panturrilha e separar a articulação.',
    initialPositions: ['top_turtle_control', 'guard_half', 'trans_leg_entanglement'],
    executorRole: 'controlador',
    positionalPrerequisites: 'Gancho interno na dobra do joelho com pegada no pé.',
    requiredGrips: ['emaranhamento_pernas', 'faixa_e_calca'],
    relevantAttributes: ['technique', 'strength'],
    minMasteryLevel: 3,
    staminaCost: 18,
    estimatedDurationSeconds: 5,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_turtle_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'cinto_seguranca',
        staminaCostExecutor: 15,
        staminaCostOpponent: 35,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: true,
        submissionDangerLevel: 4,
        description: 'Compressão muscular insuportável na panturrilha! Desistência por dor extrema e alavanca articular!'
      },
      {
        outcomeType: 'defesa',
        resultingPositionId: 'bottom_turtle',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'cinto_seguranca',
        staminaCostExecutor: 18,
        staminaCostOpponent: 12,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'O adversário chuta a perna para a frente e alivia o fulcro da canela.'
      }
    ],
    possibleDefenses: ['bjj_def_leg_lock_clear_knee'],
    possibleCounters: [],
    legality: { minAge: 18, minBeltRank: 3, minBeltName: 'Faixa Marrom', giAllowed: true, noGiAllowed: true, legalNotes: 'Permitida apenas para Faixa Marrom e Preta na CBJJ.' },
    isSubmission: true,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: true, stoppageOnSubmission: true }
  },

  // =========================================================================
  // DEFESAS ESPECIALIZADAS (10 técnicas)
  // =========================================================================

  bjj_def_sprawl_double_leg: {
    id: 'bjj_def_sprawl_double_leg',
    technicalName: 'Sprawl Agressivo de Defesa',
    displayName: 'Sprawl Pesado contra Double Leg',
    category: 'defesas',
    objective: 'defesa',
    description: 'Joga os dois quadris violentamente para trás e para o chão com peito pesado sobre as costas do atacante, neutralizando o ataque de pernas.',
    initialPositions: ['stand_takedown_threat', 'stand_grip_fight'],
    executorRole: 'defensor',
    positionalPrerequisites: 'Reação imediata ao mergulho de pernas.',
    requiredGrips: ['front_headlock', 'nenhuma'],
    relevantAttributes: ['speed', 'durability' as any, 'strength'],
    minMasteryLevel: 0,
    staminaCost: 14,
    estimatedDurationSeconds: 3,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'stand_front_headlock',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'front_headlock',
        staminaCostExecutor: 10,
        staminaCostOpponent: 22,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'Sprawl perfeito! O atacante bate de cara no tatame e o defensor domina no front headlock.'
      },
      {
        outcomeType: 'sucesso_parcial',
        resultingPositionId: 'stand_neutral',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'nenhuma',
        staminaCostExecutor: 12,
        staminaCostOpponent: 18,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'A queda é totalmente frustrada e ambos voltam à base em pé descolados.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: ['bjj_sub_guillotine', 'bjj_sub_anaconda'],
    threatenedTechniqueIds: ['bjj_tech_double_leg', 'bjj_tech_single_leg'],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_def_sprawl_single_leg: {
    id: 'bjj_def_sprawl_single_leg',
    technicalName: 'Defesa de Single Leg com Whizzer',
    displayName: 'Defesa de Single Leg com Whizzer e Base',
    category: 'defesas',
    objective: 'defesa',
    description: 'Passa o braço por cima do ombro do atacante em whizzer profundo, empurrando a cabeça dele para baixo enquanto abre a base em uma perna.',
    initialPositions: ['stand_takedown_threat', 'stand_clinch', 'stand_body_lock'],
    executorRole: 'defensor',
    positionalPrerequisites: 'Perna atacada grampeada pelo oponente.',
    requiredGrips: ['overhook_whizzer'],
    relevantAttributes: ['technique', 'strength', 'fightIq'],
    minMasteryLevel: 1,
    staminaCost: 14,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'stand_clinch',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'overhook_whizzer',
        staminaCostExecutor: 10,
        staminaCostOpponent: 18,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Whizzer pesado que obriga o atacante a largar a perna, fechando o clinch em pé.'
      },
      {
        outcomeType: 'falha_neutra',
        resultingPositionId: 'top_half_guard_control',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 14,
        staminaCostOpponent: 16,
        potentialPoints: 2,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O atacante insiste com a passada de gancho e completa a queda na meia-guarda.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: ['bjj_sub_kimura'],
    threatenedTechniqueIds: ['bjj_tech_single_leg'],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_def_guard_retention: {
    id: 'bjj_def_guard_retention',
    technicalName: 'Retenção e Defesa de Passagem',
    displayName: 'Retenção de Guarda Ativa',
    category: 'defesas',
    objective: 'defesa',
    description: 'Fuga de quadril preventiva, trazendo o joelho para o peito e recolocando os pés nos quadris ou bíceps antes do passador estabilizar.',
    initialPositions: ['guard_open', 'guard_reverse_de_la_riva', 'top_passing_process', 'trans_guard_recovery', 'guard_supine', 'trans_reversal'],
    executorRole: 'defensor',
    positionalPrerequisites: 'Passador iniciando avanço de toreando ou leg drag.',
    requiredGrips: ['gola_e_manga', 'disputa_aberta'],
    relevantAttributes: ['flexibility', 'speed', 'technique'],
    minMasteryLevel: 1,
    staminaCost: 14,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_closed',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'gola_e_manga',
        staminaCostExecutor: 10,
        staminaCostOpponent: 16,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Retenção exemplar! O passador é laçado de volta para a guarda fechada, anulando a ameaça.'
      },
      {
        outcomeType: 'sucesso_parcial',
        resultingPositionId: 'guard_half',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 12,
        staminaCostOpponent: 14,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'A passagem lateral é barrada e o guardeiro prende na meia-guarda.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    threatenedTechniqueIds: ['bjj_tech_pass_toreando', 'bjj_tech_pass_knee_cut', 'bjj_tech_pass_leg_drag'],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_def_sweep_base: {
    id: 'bjj_def_sweep_base',
    technicalName: 'Abertura de Base contra Raspagem',
    displayName: 'Sprawl e Postura contra Raspagem',
    category: 'defesas',
    objective: 'defesa',
    description: 'Abre a perna de apoio e posta a mão no tatame no sentido do desequilíbrio, afundando o centro de gravidade.',
    initialPositions: ['guard_closed', 'guard_half', 'guard_butterfly', 'guard_open', 'guard_deep_half', 'guard_de_la_riva', 'guard_reverse_de_la_riva', 'guard_spider', 'guard_lasso', 'guard_x', 'guard_single_leg_x', 'guard_knee_shield', 'guard_z', 'guard_seated', 'guard_supine'],
    executorRole: 'por_cima',
    positionalPrerequisites: 'Ataque de raspagem em andamento pelo adversário.',
    requiredGrips: ['esgrima_simples', 'nenhuma'],
    relevantAttributes: ['technique', 'fightIq', 'strength'],
    minMasteryLevel: 1,
    staminaCost: 14,
    estimatedDurationSeconds: 3,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_half_guard_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 10,
        staminaCostOpponent: 16,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Base firme como rocha! O golpe de raspagem é esmagado e o passador retoma a ofensiva por cima.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: ['bjj_tech_pass_half_guard'],
    threatenedTechniqueIds: [
      'bjj_tech_scissor_sweep',
      'bjj_tech_pendulum_sweep',
      'bjj_tech_hip_bump_sweep',
      'bjj_tech_hook_sweep_butterfly',
      'bjj_tech_x_guard_sweep',
      'bjj_tech_de_la_riva_sweep'
    ],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_def_triangle_posture: {
    id: 'bjj_def_triangle_posture',
    technicalName: 'Defesa de Triângulo com Postura',
    displayName: 'Postura Ereta e Empilhamento no Triângulo',
    category: 'defesas',
    objective: 'defesa',
    description: 'Mantém as duas mãos unidas na faixa com tronco ereto e queixo alto, empilhando o peso sobre o pescoço do guardeiro para abrir as pernas.',
    initialPositions: ['def_submission', 'guard_closed'],
    executorRole: 'defensor',
    positionalPrerequisites: 'Triângulo ainda em processo de fechamento de trava.',
    requiredGrips: ['gola_e_calca'],
    relevantAttributes: ['strength', 'technique', 'durability' as any],
    minMasteryLevel: 1,
    staminaCost: 16,
    estimatedDurationSeconds: 5,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_open',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 12,
        staminaCostOpponent: 22,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Postura inquebrável que arrebenta a trava das pernas! O triângulo é totalmente desfeito.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: ['bjj_tech_pass_over_under'],
    threatenedTechniqueIds: ['bjj_tech_triangle_closed', 'bjj_sub_triangle_choke'],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_def_armlock_hitchhiker: {
    id: 'bjj_def_armlock_hitchhiker',
    technicalName: 'Defesa Hitchhiker de Armlock',
    displayName: 'Saída Hitchhiker (Giro com Polegar)',
    category: 'defesas',
    objective: 'defesa',
    description: 'Gira o polegar do braço atacado para fora na direção dos pés do oponente e roda o corpo inteiro, aliviando o cotovelo da alavanca.',
    initialPositions: ['def_submission', 'guard_closed', 'top_mount'],
    executorRole: 'defensor',
    positionalPrerequisites: 'Braço sendo esticado pelo rival antes da hiperextensão terminal.',
    requiredGrips: ['manga_simples'],
    relevantAttributes: ['speed', 'technique', 'flexibility'],
    minMasteryLevel: 1,
    staminaCost: 16,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_open',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 14,
        staminaCostOpponent: 18,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Giro de hitchhiker cinematográfico! O cotovelo desliza para fora e o atleta cai por cima na guarda aberta.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    threatenedTechniqueIds: ['bjj_tech_armlock_closed', 'bjj_sub_armlock_straight'],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_def_rnc_two_on_one: {
    id: 'bjj_def_rnc_two_on_one',
    technicalName: 'Defesa 2-on-1 contra Mata-Leão',
    displayName: 'Controle de Dois contra Um no Mata-Leão',
    category: 'defesas',
    objective: 'defesa',
    description: 'Segura o punho e antebraço do braço estrangulador com as duas mãos, colando o queixo e impedindo a mão de alcançar a nuca.',
    initialPositions: ['def_back_control', 'escape_back_control', 'top_back_control', 'stand_back_control', 'def_submission'],
    executorRole: 'defensor',
    positionalPrerequisites: 'Ataque de costas iniciado.',
    requiredGrips: ['cinto_seguranca'],
    relevantAttributes: ['technique', 'fightIq', 'strength'],
    minMasteryLevel: 0,
    staminaCost: 14,
    estimatedDurationSeconds: 5,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'def_back_control',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'cinto_seguranca',
        staminaCostExecutor: 10,
        staminaCostOpponent: 20,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'O braço estrangulador é puxado para baixo no peito, eliminando o risco imediato de asfixia.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: ['bjj_tech_esc_back_slide'],
    threatenedTechniqueIds: ['bjj_sub_rear_naked_choke', 'bjj_sub_bow_and_arrow'],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_def_guillotine_tripod: {
    id: 'bjj_def_guillotine_tripod',
    technicalName: 'Defesa Tripé contra Guilhotina',
    displayName: 'Defesa Tripé e Salto Lateral (Anti-Guilhotina)',
    category: 'defesas',
    objective: 'defesa',
    description: 'Pula com as duas pernas para o lado oposto ao estrangulamento, grampeando o queixo e aliviando a tração na traqueia.',
    initialPositions: ['def_submission', 'guard_closed', 'stand_front_headlock'],
    executorRole: 'defensor',
    positionalPrerequisites: 'Cabeça presa sob a axila do oponente.',
    requiredGrips: ['front_headlock'],
    relevantAttributes: ['speed', 'technique', 'strength'],
    minMasteryLevel: 1,
    staminaCost: 16,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'top_side_control',
        topAthleteAfter: 'executor',
        bottomAthleteAfter: 'opponent',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 12,
        staminaCostOpponent: 20,
        potentialPoints: 0,
        potentialAdvantage: true,
        isSubmission: false,
        description: 'Salto lateral preciso para o cem quilos! O estrangulamento perde todo o efeito e o atleta domina por cima.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    threatenedTechniqueIds: ['bjj_sub_guillotine', 'bjj_sub_anaconda', 'bjj_sub_darce'],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_def_leg_lock_clear_knee: {
    id: 'bjj_def_leg_lock_clear_knee',
    technicalName: 'Defesa de Leg Lock (Limpar a Linha do Joelho)',
    displayName: 'Escape de Leg Lock / Linha do Joelho Livre',
    category: 'defesas',
    objective: 'defesa',
    description: 'Chuta a perna atacada puxando o calcanhar e escorregando o joelho além da linha da bacia do atacante (clearing the knee line).',
    initialPositions: ['trans_leg_entanglement', 'guard_fifty_fifty', 'guard_single_leg_x'],
    executorRole: 'defensor',
    positionalPrerequisites: 'Ataque de chave de perna ou calcanhar engatilhado.',
    requiredGrips: ['emaranhamento_pernas'],
    relevantAttributes: ['fightIq', 'technique', 'speed'],
    minMasteryLevel: 1,
    staminaCost: 16,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'trans_scramble',
        topAthleteAfter: 'none',
        bottomAthleteAfter: 'none',
        gripsAfter: 'disputa_aberta',
        staminaCostExecutor: 12,
        staminaCostOpponent: 18,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Joelho limpo com maestria! A alavanca perde o fulcro e a disputa volta aberta para scramble.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    threatenedTechniqueIds: [
      'bjj_sub_straight_ankle_lock',
      'bjj_sub_kneebar',
      'bjj_sub_toe_hold',
      'bjj_sub_heel_hook',
      'bjj_sub_calf_slicer'
    ],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  },

  bjj_def_pass_frame: {
    id: 'bjj_def_pass_frame',
    technicalName: 'Defesa de Passagem por Frames',
    displayName: 'Frames Rígidos de Antebraço e Bloqueio de Bíceps',
    category: 'defesas',
    objective: 'defesa',
    description: 'Coloca os antebraços e mãos rígidas no ombro e bíceps do passador, impedindo o avanço do peito e criando espaço para o quadril.',
    initialPositions: ['guard_half', 'guard_open', 'def_side_control', 'escape_side_control', 'top_side_control', 'top_kesa_gatame', 'top_north_south', 'top_knee_on_belly', 'top_half_guard_control', 'top_passing_process', 'trans_guard_recovery', 'trans_reversal', 'trans_scramble', 'trans_leg_entanglement', 'def_submission'],
    executorRole: 'defensor',
    positionalPrerequisites: 'Passador em pressão frontal.',
    requiredGrips: ['esgrima_simples', 'nenhuma'],
    relevantAttributes: ['technique', 'durability' as any],
    minMasteryLevel: 0,
    staminaCost: 12,
    estimatedDurationSeconds: 4,
    outcomes: [
      {
        outcomeType: 'sucesso_pleno',
        resultingPositionId: 'guard_half',
        topAthleteAfter: 'opponent',
        bottomAthleteAfter: 'executor',
        gripsAfter: 'esgrima_simples',
        staminaCostExecutor: 10,
        staminaCostOpponent: 16,
        potentialPoints: 0,
        potentialAdvantage: false,
        isSubmission: false,
        description: 'Os frames impedem o avanço do peso e mantêm a distância de segurança ativa.'
      }
    ],
    possibleDefenses: [],
    possibleCounters: [],
    threatenedTechniqueIds: ['bjj_tech_pass_pressure', 'bjj_tech_pass_smash', 'bjj_tech_pass_half_guard'],
    legality: { minBeltRank: 0, minBeltName: 'Faixa Branca', giAllowed: true, noGiAllowed: true },
    isSubmission: false,
    competitiveConsequences: { pointsOnStabilization: 0, awardsAdvantageOnNearSuccess: false, stoppageOnSubmission: false }
  }
};

/** Lista completa de técnicas para iteração */
export const BJJ_TECHNIQUES_LIST: BjjTechnique[] = Object.values(BJJ_TECHNIQUES_CATALOG);

/**
 * Consulta de técnica por ID
 */
export function getBjjTechniqueById(id: BjjTechniqueId): BjjTechnique | undefined {
  return BJJ_TECHNIQUES_CATALOG[id];
}

/**
 * Consulta de técnicas filtradas por categoria
 */
export function getBjjTechniquesByCategory(category: BjjTechniqueCategory): BjjTechnique[] {
  return BJJ_TECHNIQUES_LIST.filter((t) => t.category === category);
}

/**
 * Retorna todas as técnicas possíveis a partir de uma dada posição de origem
 */
export function getAvailableTechniquesForPosition(positionId: string): BjjTechnique[] {
  return BJJ_TECHNIQUES_LIST.filter((t) => t.initialPositions.includes(positionId as any));
}

/**
 * Retorna as defesas disponíveis contra uma técnica específica
 */
export function getDefensesForTechnique(techniqueId: BjjTechniqueId): BjjTechnique[] {
  const tech = BJJ_TECHNIQUES_CATALOG[techniqueId];
  if (!tech) return [];
  return tech.possibleDefenses
    .map((defId) => BJJ_TECHNIQUES_CATALOG[defId])
    .filter((d): d is BjjTechnique => d !== undefined);
}

/**
 * Função de validação rigorosa do catálogo de técnicas (Fase 2).
 * Verifica 100% dos requisitos de integridade, referências posicionais e desfechos múltiplos.
 */
export function validateBjjTechniquesCatalog(
  catalog: Record<BjjTechniqueId, BjjTechnique> = BJJ_TECHNIQUES_CATALOG
): BjjTechniquesValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const registeredIds = new Set<string>();
  const techniques = Object.values(catalog);

  const techniquesByCategory: Record<BjjTechniqueCategory, number> = {
    quedas_e_pe: 0,
    guarda_fechada: 0,
    guarda_aberta: 0,
    meia_guarda: 0,
    passagem_guarda: 0,
    controle_posicional: 0,
    fugas_e_recuperacoes: 0,
    finalizacoes: 0,
    defesas: 0
  };

  let totalDefenses = 0;
  let totalSubmissions = 0;
  let totalPositionalReferencesValidated = 0;

  for (const tech of techniques) {
    // 1. Unicidade de ID
    if (registeredIds.has(tech.id)) {
      errors.push(`ID de técnica duplicado detectado: "${tech.id}"`);
    }
    registeredIds.add(tech.id);

    // Contagem por categoria
    if (tech.category in techniquesByCategory) {
      techniquesByCategory[tech.category] += 1;
    } else {
      errors.push(`Técnica "${tech.id}" possui categoria inválida: "${tech.category}"`);
    }

    if (tech.category === 'defesas') totalDefenses++;
    if (tech.isSubmission) totalSubmissions++;

    // 2. Validação de posições iniciais
    if (!tech.initialPositions || tech.initialPositions.length === 0) {
      errors.push(`Técnica "${tech.id}" não possui nenhuma posição inicial cadastrada.`);
    } else {
      for (const posId of tech.initialPositions) {
        totalPositionalReferencesValidated++;
        if (!BJJ_POSITIONS_CATALOG[posId]) {
          errors.push(`Técnica "${tech.id}" referencia posição inicial inexistente na Fase 1: "${posId}".`);
        }
      }
    }

    // 3. Validação de múltiplos desfechos
    if (!tech.outcomes || tech.outcomes.length === 0) {
      errors.push(`Técnica "${tech.id}" não possui nenhum resultado de desfecho cadastrado.`);
    } else {
      for (const outcome of tech.outcomes) {
        totalPositionalReferencesValidated++;
        if (!BJJ_POSITIONS_CATALOG[outcome.resultingPositionId]) {
          errors.push(
            `Técnica "${tech.id}" possui desfecho que referencia posição resultante inexistente na Fase 1: "${outcome.resultingPositionId}".`
          );
        }

        // Validação de consistência em submissões
        if (outcome.isSubmission && !tech.isSubmission && tech.category !== 'guarda_fechada' && tech.category !== 'guarda_aberta') {
          warnings.push(`Técnica "${tech.id}" possui desfecho com isSubmission=true mas tech.isSubmission é false.`);
        }
      }
    }

    // 4. Validação de defesas referenciadas
    if (tech.possibleDefenses && tech.possibleDefenses.length > 0) {
      for (const defId of tech.possibleDefenses) {
        if (!catalog[defId]) {
          errors.push(`Técnica "${tech.id}" referencia técnica de defesa inexistente: "${defId}".`);
        }
      }
    }

    // 5. Validação de contragolpes referenciados
    if (tech.possibleCounters && tech.possibleCounters.length > 0) {
      for (const counterId of tech.possibleCounters) {
        if (!catalog[counterId]) {
          errors.push(`Técnica "${tech.id}" referencia técnica de contragolpe inexistente: "${counterId}".`);
        }
      }
    }

    // 6. Se for técnica de DEFESA, validar ataques respondidos
    if (tech.category === 'defesas' && tech.threatenedTechniqueIds) {
      for (const attackId of tech.threatenedTechniqueIds) {
        if (!catalog[attackId]) {
          errors.push(`Defesa "${tech.id}" referencia ataque respondido inexistente: "${attackId}".`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    totalTechniques: techniques.length,
    techniquesByCategory,
    totalDefenses,
    totalSubmissions,
    totalPositionalReferencesValidated,
    errors,
    warnings
  };
}
