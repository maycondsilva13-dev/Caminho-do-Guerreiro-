import { Character } from '../types/game';

export interface LifeEventChoice {
  text: string;
  effectDescription: string;
  apply: (char: Character) => { updatedChar: Character; message: string };
}

export interface LifeRandomEvent {
  id: string;
  title: string;
  description: string;
  category: 'escola' | 'familia' | 'trabalho' | 'treino' | 'rival';
  minAge?: number;
  maxAge?: number;
  choices: LifeEventChoice[];
}

export const RANDOM_LIFE_EVENTS: LifeRandomEvent[] = [
  {
    id: 'event_prova_escola',
    title: 'Semana de Provas Finais na Escola!',
    description: 'Suas notas em matemática e ciências estão no limite. Sua mãe disse que se você tirar nota baixa, vai te proibir de treinar por um mês!',
    category: 'escola',
    maxAge: 17,
    choices: [
      {
        text: 'Virar a noite estudando e faltar aos treinos da semana',
        effectDescription: '+2.0 na nota escolar, -15 de energia, sem ganho de atributos físicos.',
        apply: (char) => {
          const updated = { ...char };
          updated.schoolGrade = Math.min(10, updated.schoolGrade + 2.0);
          updated.energy = Math.max(10, updated.energy - 15);
          updated.familySupport = Math.min(100, updated.familySupport + 15);
          return {
            updatedChar: updated,
            message: 'Você tirou um 9 na prova! Sua mãe preparou seu prato favorito e elogiou sua dedicação.'
          };
        }
      },
      {
        text: 'Tentar equilibrar: estudar 2h e ainda ir para o sparring',
        effectDescription: '+0.8 na nota escolar, +2 de QI de Luta, +10 de estresse.',
        apply: (char) => {
          const updated = { ...char };
          updated.schoolGrade = Math.min(10, updated.schoolGrade + 0.8);
          updated.attributes.fightIq += 1;
          updated.stress = Math.min(100, updated.stress + 10);
          return {
            updatedChar: updated,
            message: 'Foi cansativo, mas você passou de ano raspando e ainda pegou um triângulo no colega de treino!'
          };
        }
      },
      {
        text: 'Focar 100% na luta! Prova é passageira, o tatame é eterno!',
        effectDescription: '-2.0 na nota escolar, +2 de Força, -20 de apoio familiar.',
        apply: (char) => {
          const updated = { ...char };
          updated.schoolGrade = Math.max(1, updated.schoolGrade - 2.0);
          updated.attributes.strength += 2;
          updated.familySupport = Math.max(10, updated.familySupport - 20);
          return {
            updatedChar: updated,
            message: 'Você amassou no treino, mas tomou uma bronca histórica em casa. A tensão no ar é pesada.'
          };
        }
      }
    ]
  },
  {
    id: 'event_desafio_rua',
    title: 'Provocação na Saída do Treino!',
    description: 'Um jovem brigão do bairro rival te cerca na esquina com outros dois garotos, zombando da sua faixa e te chamando para brigar na calçada.',
    category: 'rival',
    choices: [
      {
        text: 'Manter a calma, usar a filosofia do mestre e se afastar com postura',
        effectDescription: '+10 de Honra, +5 de Saúde Mental, evita lesões e confusão.',
        apply: (char) => {
          const updated = { ...char };
          updated.honor = Math.min(100, updated.honor + 10);
          updated.mentalHealth = Math.min(100, updated.mentalHealth + 5);
          return {
            updatedChar: updated,
            message: 'Você olhou nos olhos deles sem medo e continuou andando. Seu mestre soube da sua maturidade e ficou orgulhoso.'
          };
        }
      },
      {
        text: 'Aplicar uma queda limpa de Judô no líder para neutralizar sem machucar',
        effectDescription: '+5 de QI de Luta, +15 de Fama no bairro, risco de estresse.',
        apply: (char) => {
          const updated = { ...char };
          updated.attributes.fightIq += 2;
          updated.fame += 25;
          updated.stress = Math.min(100, updated.stress + 10);
          return {
            updatedChar: updated,
            message: 'Com um Osoto Gari impecável você pregou o valentão no chão. Os amigos dele ficaram em choque e pediram desculpas!'
          };
        }
      }
    ]
  },
  {
    id: 'event_oferta_patrocinio',
    title: 'Marca de Suplementos & Quimonos te Procura!',
    description: 'Uma loja especializada de artigos esportivos notou seu desempenho nos torneios recentes e quer estampar a marca deles no seu calção / quimono.',
    category: 'trabalho',
    minAge: 15,
    choices: [
      {
        text: 'Aceitar contrato de patrocínio com postagens nas redes sociais',
        effectDescription: '+R$ 450 por mês de ajuda de custo, +30 de Hype, exige dedicação ao Instagram.',
        apply: (char) => {
          const updated = { ...char };
          updated.money += 450;
          updated.hype = Math.min(100, updated.hype + 25);
          updated.fame += 50;
          return {
            updatedChar: updated,
            message: 'Contrato assinado! Você recebeu uma caixa de whey protein e quimonos novos novinhos.'
          };
        }
      },
      {
        text: 'Recusar para manter foco total em treinos austeros sem distrações',
        effectDescription: '+15 de Foco Mental e Disciplina pura.',
        apply: (char) => {
          const updated = { ...char };
          updated.mentalHealth = Math.min(100, updated.mentalHealth + 10);
          updated.attributes.mentalFocus += 3;
          return {
            updatedChar: updated,
            message: 'Você preferiu não se vender para marcas neste momento. Sua mente segue focada no ouro.'
          };
        }
      }
    ]
  },
  {
    id: 'event_dores_articulares',
    title: 'Sobrecarga de Treinos: Joelho Estalando!',
    description: 'Após semanas de tiros e sparrings intensos, seu joelho acordou inchado. O campeonato regional se aproxima.',
    category: 'treino',
    choices: [
      {
        text: 'Fazer sessões de gelo, fisioterapia e focar apenas em boxe parado',
        effectDescription: 'Cura o desgaste articular, gasta R$ 80, melhora técnica de mãos.',
        apply: (char) => {
          const updated = { ...char };
          updated.money = Math.max(0, updated.money - 80);
          updated.attributes.technique += 2;
          updated.energy = Math.min(100, updated.energy + 10);
          return {
            updatedChar: updated,
            message: 'A fisioterapia aliviou a inflamação e você aproveitou para afiar o direto e os jabs.'
          };
        }
      },
      {
        text: 'Tomar anti-inflamatório e treinar pesado mesmo assim!',
        effectDescription: '+2 de Força, mas risco de agravar a lesão se cansar.',
        apply: (char) => {
          const updated = { ...char };
          updated.attributes.strength += 2;
          updated.stress = Math.min(100, updated.stress + 15);
          return {
            updatedChar: updated,
            message: 'Treino bruto concluído na raça! O corpo dói, mas seu espírito de batalha está em alta.'
          };
        }
      }
    ]
  }
];

export const DIET_OPTIONS = [
  {
    id: 'caseira' as const,
    name: 'Comida Caseira dos Pais',
    cost: 0,
    desc: 'Arroz, feijão, frango e salada feitos com amor. Custo zero para o bolso.',
    weightTrend: 0, // Mantém peso estável
    energyBonus: 10,
    recoveryBonus: 5
  },
  {
    id: 'bulking' as const,
    name: 'Superávit Hipercalórico (Ganho de Força & Massa)',
    cost: 120,
    desc: 'Batata doce, ovos, carnes vermelhas e shakes. Aumenta força e peso corporal.',
    weightTrend: 0.5, // +0.5 kg por semana
    energyBonus: 20,
    recoveryBonus: 12
  },
  {
    id: 'atletica' as const,
    name: 'Dieta Limpa Atlética de Alta Performance',
    cost: 180,
    desc: 'Macronutrientes milimetricamente pesados por nutricionista esportivo.',
    weightTrend: 0,
    energyBonus: 25,
    recoveryBonus: 20
  },
  {
    id: 'corte_severo' as const,
    name: 'Corte Severo de Peso (Desidratação de Luta)',
    cost: 50,
    desc: 'Restrição calórica extrema, sauna e água destilada para bater a pesagem do torneio.',
    weightTrend: -1.2, // Perde peso rápido
    energyBonus: -20,
    recoveryBonus: -15
  }
];

export const LEISURE_ACTIVITIES = [
  {
    id: 'praia_sol',
    name: 'Tarde de Praia & Banho de Mar',
    cost: 20,
    energyCost: 5,
    mentalHealthGain: 25,
    stressReduction: 30,
    desc: 'Água salgada para descarregar o cansaço dos treinos e renovar o espírito.'
  },
  {
    id: 'videogame_amigos',
    name: 'Jogar Videogame com Amigos',
    cost: 15,
    energyCost: 10,
    mentalHealthGain: 20,
    stressReduction: 25,
    desc: 'Horas de risadas e jogos de luta no sofá para relaxar da rotina austera.'
  },
  {
    id: 'assistir_fita_lutas',
    name: 'Estudo de Fitas Antigas (Pride, UFC, Mundiais)',
    cost: 0,
    energyCost: 10,
    mentalHealthGain: 15,
    stressReduction: 10,
    fightIqGain: 2,
    desc: 'Análise tática de lendas como Rickson Gracie, Fedor Emelianenko, Mike Tyson e Anderson Silva.'
  },
  {
    id: 'almoco_familia',
    name: 'Almoço de Domingo em Família',
    cost: 10,
    energyCost: 0,
    mentalHealthGain: 30,
    stressReduction: 35,
    familyBonus: 20,
    desc: 'Conexão profunda com suas raízes e o abraço daqueles que torcem por você incondicionalmente.'
  }
];

export interface JobDefinition {
  id: import('../types/game').JobType;
  title: string;
  minAge: number;
  weeklyPay: number;
  energyDrain: number;
  desc: string;
  defaultShift?: 'manha' | 'tarde' | 'noite';
  requiredEducationLevel?: import('../types/game').EducationLevel;
  requiredEducationField?: import('../types/game').EducationField;
  minRank?: number;
  minStrength?: number;
  minFame?: number;
  recoveryBonus?: number;
}

export const AVAILABLE_JOBS: JobDefinition[] = [
  {
    id: 'desempregado',
    title: 'Dedicação Exclusiva (Sem Trabalho)',
    minAge: 8,
    weeklyPay: 0,
    energyDrain: 0,
    desc: 'Foco 100% no tatame e estudos, dependendo de família ou prêmios de torneios.'
  },
  {
    id: 'panfleteiro',
    title: 'Distribuidor de Panfletos de Academia',
    minAge: 13,
    weeklyPay: 90,
    energyDrain: 15,
    defaultShift: 'tarde',
    desc: 'Bico entregando panfletos no semáforo para pagar inscrições sem exigir diploma.'
  },
  {
    id: 'auxiliar_dojo',
    title: 'Auxiliar de Limpeza e Recepção do Dojo',
    minAge: 14,
    weeklyPay: 140,
    energyDrain: 15,
    defaultShift: 'tarde',
    desc: 'Limpar tatame, lavar quimonos e ajudar na recepção do dojo.'
  },
  {
    id: 'entregador',
    title: 'Entregador de Aplicativo de Bike',
    minAge: 16,
    weeklyPay: 220,
    energyDrain: 30,
    defaultShift: 'tarde',
    desc: 'Pedalar a cidade inteira. Drena energia mas gera renda rápida sem exigência escolar.'
  },
  {
    id: 'garcom',
    title: 'Garçom Noturno em Restaurante',
    minAge: 17,
    weeklyPay: 300,
    energyDrain: 35,
    defaultShift: 'noite',
    desc: 'Noites servindo mesas. Rende boas gorjetas no período noturno.'
  },
  {
    id: 'jovem_aprendiz_adm',
    title: 'Jovem Aprendiz / Auxiliar de Escritório',
    minAge: 14,
    weeklyPay: 260,
    energyDrain: 15,
    defaultShift: 'tarde',
    requiredEducationLevel: 'fundamental',
    desc: 'Primeiro emprego formal em rotinas administrativas. Requer Ensino Fundamental completo.'
  },
  {
    id: 'atendente_academia',
    title: 'Recepcionista de Academia & Clube',
    minAge: 16,
    weeklyPay: 340,
    energyDrain: 15,
    defaultShift: 'tarde',
    requiredEducationLevel: 'fundamental',
    desc: 'Atendimento a alunos, matrículas e controle de acesso. Requer Ensino Fundamental completo.'
  },
  {
    id: 'seguranca',
    title: 'Segurança de Eventos / Casa Noturna',
    minAge: 18,
    minStrength: 35,
    weeklyPay: 550,
    energyDrain: 40,
    defaultShift: 'noite',
    requiredEducationLevel: 'fundamental',
    desc: 'Ambiente tenso que exige porte físico (Força ≥ 35) e Ensino Fundamental completo.'
  },
  {
    id: 'assistente_comercial',
    title: 'Assistente Administrativo & Comercial',
    minAge: 18,
    weeklyPay: 480,
    energyDrain: 18,
    defaultShift: 'tarde',
    requiredEducationLevel: 'medio',
    desc: 'Atendimento corporativo, planilhas e faturamento. Requer Ensino Médio completo.'
  },
  {
    id: 'instrutor_artes',
    title: 'Professor de Turmas Infantis / Iniciantes',
    minAge: 18,
    minRank: 2,
    weeklyPay: 520,
    energyDrain: 20,
    defaultShift: 'tarde',
    requiredEducationLevel: 'medio',
    desc: 'Ensinar aos mais novos exige Ensino Médio completo e faixa intermediária (Rank ≥ 2).'
  },
  {
    id: 'tec_preparacao_fisica',
    title: 'Monitor Técnico de Musculação & Treino',
    minAge: 18,
    weeklyPay: 720,
    energyDrain: 18,
    defaultShift: 'tarde',
    requiredEducationLevel: 'tecnico',
    requiredEducationField: 'educacao_fisica',
    recoveryBonus: 3,
    desc: 'Monta séries na sala de musculação e acompanha atletas. Exige Técnico em Preparação Física.'
  },
  {
    id: 'tec_enfermagem',
    title: 'Técnico de Enfermagem & Primeiros Socorros',
    minAge: 18,
    weeklyPay: 750,
    energyDrain: 22,
    defaultShift: 'tarde',
    requiredEducationLevel: 'tecnico',
    requiredEducationField: 'saude_enfermagem',
    recoveryBonus: 4,
    desc: 'Plantões clínicos e atendimento médico de base. Exige Técnico em Enfermagem.'
  },
  {
    id: 'tec_administracao',
    title: 'Técnico em Gestão & Finanças',
    minAge: 18,
    weeklyPay: 780,
    energyDrain: 15,
    defaultShift: 'tarde',
    requiredEducationLevel: 'tecnico',
    requiredEducationField: 'administracao',
    desc: 'Controle financeiro, folha e contratos empresariais. Exige Técnico em Administração.'
  },
  {
    id: 'tec_seguranca',
    title: 'Técnico em Segurança do Trabalho',
    minAge: 18,
    weeklyPay: 800,
    energyDrain: 16,
    defaultShift: 'tarde',
    requiredEducationLevel: 'tecnico',
    requiredEducationField: 'seguranca_trabalho',
    desc: 'Inspeção de NRs e prevenção de acidentes em arenas e indústrias. Exige Técnico em Segurança.'
  },
  {
    id: 'tec_ti',
    title: 'Técnico de Suporte e Sistemas TI',
    minAge: 18,
    weeklyPay: 840,
    energyDrain: 14,
    defaultShift: 'tarde',
    requiredEducationLevel: 'tecnico',
    requiredEducationField: 'ti_sistemas',
    desc: 'Suporte de redes, servidores e sistemas corporativos. Exige Técnico em TI.'
  },
  {
    id: 'prof_educacao_fisica',
    title: 'Preparador Físico / Prof. Educação Física',
    minAge: 20,
    weeklyPay: 1350,
    energyDrain: 16,
    defaultShift: 'tarde',
    requiredEducationLevel: 'superior',
    requiredEducationField: 'educacao_fisica',
    recoveryBonus: 5,
    desc: 'Periodização científica de atletas e prescrição avançada. Exige Superior em Educação Física.'
  },
  {
    id: 'nutricionista_esportivo',
    title: 'Nutricionista Esportivo Clínico',
    minAge: 21,
    weeklyPay: 1550,
    energyDrain: 12,
    defaultShift: 'tarde',
    requiredEducationLevel: 'superior',
    requiredEducationField: 'nutricao',
    recoveryBonus: 6,
    desc: 'Consultório de nutrição para atletas e corte de peso seguro. Exige Superior em Nutrição.'
  },
  {
    id: 'fisioterapeuta_esportivo',
    title: 'Fisioterapeuta Esportivo',
    minAge: 21,
    weeklyPay: 1650,
    energyDrain: 15,
    defaultShift: 'tarde',
    requiredEducationLevel: 'superior',
    requiredEducationField: 'fisioterapia',
    recoveryBonus: 8,
    desc: 'Reabilitação de lesões e recuperação muscular de lutadores. Exige Superior em Fisioterapia.'
  },
  {
    id: 'gestor_executivo',
    title: 'Administrador / Gestor Corporativo',
    minAge: 21,
    weeklyPay: 1850,
    energyDrain: 15,
    defaultShift: 'tarde',
    requiredEducationLevel: 'superior',
    requiredEducationField: 'administracao',
    desc: 'Gerência executiva, orçamento e expansão de negócios. Exige Superior em Administração.'
  },
  {
    id: 'advogado',
    title: 'Advogado / Assessor Jurídico Esportivo',
    minAge: 21,
    weeklyPay: 2000,
    energyDrain: 16,
    defaultShift: 'tarde',
    requiredEducationLevel: 'superior',
    requiredEducationField: 'direito',
    desc: 'Contratos esportivos, representação legal e arbitragem. Exige Bacharelado em Direito.'
  },
  {
    id: 'engenheiro_software',
    title: 'Engenheiro de Software / Dev Sênior',
    minAge: 20,
    weeklyPay: 2150,
    energyDrain: 12,
    defaultShift: 'tarde',
    requiredEducationLevel: 'superior',
    requiredEducationField: 'ti_sistemas',
    desc: 'Arquitetura de software e sistemas em escala. Exige Superior em TI / Computação.'
  },
  {
    id: 'medico_esporte',
    title: 'Médico do Esporte & Ortopedia',
    minAge: 22,
    weeklyPay: 3200,
    energyDrain: 20,
    defaultShift: 'tarde',
    requiredEducationLevel: 'superior',
    requiredEducationField: 'medicina',
    recoveryBonus: 10,
    desc: 'Atuação médica em comissões atléticas e clínicas esportivas. Exige Superior em Medicina.'
  },
  {
    id: 'atleta_patrocinado',
    title: 'Atleta Profissional Patrocinado',
    minAge: 18,
    minFame: 150,
    weeklyPay: 1200,
    energyDrain: 10,
    defaultShift: 'tarde',
    desc: 'Viver exclusivamente do esporte! Marcas bancam seus treinos quando sua fama alcança 150+.'
  }
];
