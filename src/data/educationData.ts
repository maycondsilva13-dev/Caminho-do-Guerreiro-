import { EducationField, EducationInstitution, EducationLevel } from '../types/game';

export const EDUCATION_LEVEL_META: Record<
  EducationLevel,
  { label: string; shortLabel: string; order: number; badgeClass: string }
> = {
  fundamental: {
    label: 'Ensino Fundamental',
    shortLabel: 'Fundamental',
    order: 1,
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30'
  },
  medio: {
    label: 'Ensino Médio',
    shortLabel: 'Médio',
    order: 2,
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
  },
  tecnico: {
    label: 'Ensino Técnico',
    shortLabel: 'Técnico',
    order: 3,
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  },
  superior: {
    label: 'Ensino Superior',
    shortLabel: 'Superior',
    order: 4,
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  }
};

export const EDUCATION_FIELD_META: Record<EducationField, { label: string; icon: string }> = {
  geral: { label: 'Formação Geral', icon: '📘' },
  educacao_fisica: { label: 'Educação Física & Esportes', icon: '🏋️' },
  saude_enfermagem: { label: 'Enfermagem & Saúde', icon: '🩺' },
  nutricao: { label: 'Nutrição Esportiva', icon: '🥗' },
  fisioterapia: { label: 'Fisioterapia Esportiva', icon: '🦴' },
  medicina: { label: 'Medicina & Traumatologia', icon: '⚕️' },
  ti_sistemas: { label: 'TI & Desenvolvimento de Sistemas', icon: '💻' },
  administracao: { label: 'Administração & Gestão', icon: '📊' },
  direito: { label: 'Direito', icon: '⚖️' },
  seguranca_trabalho: { label: 'Segurança do Trabalho', icon: '🦺' }
};

export const EDUCATION_INSTITUTIONS: EducationInstitution[] = [
  // =========================================================================
  // 1. ENSINO FUNDAMENTAL (PÚBLICA E PARTICULAR)
  // =========================================================================
  {
    id: 'inst_pub_fundamental',
    name: 'Escola Estadual Professora Cecília Meireles',
    shortName: 'E.E. Cecília Meireles',
    type: 'publica',
    level: 'fundamental',
    badge: '🏛️ Rede Pública Estadual',
    prestigeLabel: 'Gratuita • Ensino Público',
    description:
      'Escola pública tradicional do bairro. Ensino gratuito para formação básica e supletivo/EJA para jovens e adultos.',
    courses: [
      {
        id: 'curso_pub_fundamental',
        institutionId: 'inst_pub_fundamental',
        title: 'Ensino Fundamental Completo (Rede Pública)',
        level: 'fundamental',
        field: 'geral',
        durationMonths: 12,
        monthlyFee: 0,
        minAge: 7,
        minGraduationAge: 13,
        minEntranceGrade: 0,
        allowedShifts: ['manha', 'tarde'],
        pointsPerSession: 3,
        daysPattern: 'seg_sex',
        gradeBonusPerMonth: 0.25,
        graduationBonusDesc: 'Habilita matrículas no Ensino Médio e primeiros empregos formais.',
        desc: 'Base escolar completa em Português, Matemática, Ciências e História em escola pública gratuita.'
      }
    ]
  },
  {
    id: 'inst_priv_fundamental',
    name: 'Colégio Bandeirantes & Objetivo',
    shortName: 'Colégio Bandeirantes',
    type: 'particular',
    level: 'fundamental',
    badge: '🏫 Rede Particular',
    prestigeLabel: 'Ensino Privado de Alto Desempenho',
    description:
      'Instituição particular com reforço acadêmico intensivo, ótimo preparo para vestibulinhos e acompanhamento individual.',
    courses: [
      {
        id: 'curso_priv_fundamental',
        institutionId: 'inst_priv_fundamental',
        title: 'Ensino Fundamental Completo (Rede Particular)',
        level: 'fundamental',
        field: 'geral',
        durationMonths: 12,
        monthlyFee: 650,
        minAge: 7,
        minGraduationAge: 13,
        minEntranceGrade: 0,
        allowedShifts: ['manha', 'tarde'],
        pointsPerSession: 3,
        daysPattern: 'seg_sex',
        gradeBonusPerMonth: 0.4,
        graduationBonusDesc: '+2 Foco Mental e excelente média escolar para vestibulinhos futuros.',
        desc: 'Formação básica privada com laboratórios, idiomas e suporte para manter notas elevadas.'
      }
    ]
  },

  // =========================================================================
  // 2. ENSINO MÉDIO (PÚBLICA E PARTICULAR)
  // =========================================================================
  {
    id: 'inst_pub_medio',
    name: 'Colégio Estadual Tiradentes',
    shortName: 'Colégio Tiradentes',
    type: 'publica',
    level: 'medio',
    badge: '🏛️ Rede Pública Estadual',
    prestigeLabel: 'Gratuita • Turnos Flexíveis (Manhã / Tarde / Noite)',
    description:
      'Colégio público de ensino médio com turno noturno para estudantes que trabalham ou treinam durante o dia.',
    courses: [
      {
        id: 'curso_pub_medio',
        institutionId: 'inst_pub_medio',
        title: 'Ensino Médio Regular (Rede Pública)',
        level: 'medio',
        field: 'geral',
        durationMonths: 12,
        monthlyFee: 0,
        minAge: 14,
        minGraduationAge: 16,
        prerequisiteLevel: 'fundamental',
        minEntranceGrade: 5.0,
        allowedShifts: ['manha', 'tarde', 'noite'],
        pointsPerSession: 3,
        daysPattern: 'seg_sex',
        gradeBonusPerMonth: 0.25,
        graduationBonusDesc: 'Libera Ensino Superior e cargos administrativos de Ensino Médio.',
        desc: 'Ensino médio público gratuito com flexibilidade de turno matutino, vespertino ou noturno.'
      }
    ]
  },
  {
    id: 'inst_priv_medio',
    name: 'Colégio Vértice Pré-Vestibular',
    shortName: 'Colégio Vértice',
    type: 'particular',
    level: 'medio',
    badge: '🏫 Rede Particular',
    prestigeLabel: 'Preparatório Forte para Federais',
    description:
      'Ensino médio particular focado em aprovações em universidades públicas concorridas e gestão do tempo.',
    courses: [
      {
        id: 'curso_priv_medio',
        institutionId: 'inst_priv_medio',
        title: 'Ensino Médio & Pré-Vestibular (Particular)',
        level: 'medio',
        field: 'geral',
        durationMonths: 12,
        monthlyFee: 980,
        minAge: 14,
        minGraduationAge: 16,
        prerequisiteLevel: 'fundamental',
        minEntranceGrade: 5.0,
        allowedShifts: ['manha', 'tarde'],
        pointsPerSession: 3,
        daysPattern: 'seg_sex',
        gradeBonusPerMonth: 0.45,
        graduationBonusDesc: '+3 QI de Luta / Raciocínio e forte preparo para vestibulares de Universidades Públicas.',
        desc: 'Grade avançada com simulados mensais que elevam rapidamente sua média de ingresso universitário.'
      }
    ]
  },

  // =========================================================================
  // 3. ENSINO TÉCNICO EM VÁRIAS ÁREAS (PÚBLICA E PARTICULAR)
  // =========================================================================
  {
    id: 'inst_pub_tecnico',
    name: 'ETEC / Instituto Federal Público (IF)',
    shortName: 'ETEC / IF Público',
    type: 'publica',
    level: 'tecnico',
    badge: '🏛️ Rede Técnica Pública',
    prestigeLabel: 'Gratuita • Exige Vestibulinho (Média ≥ 6.5)',
    description:
      'Referência nacional em ensino técnico gratuito. Carga de 2 pts (Seg/Qua/Sex) compatível com trabalho e treinos.',
    courses: [
      {
        id: 'tec_pub_ti',
        institutionId: 'inst_pub_tecnico',
        title: 'Técnico em Desenvolvimento de Sistemas & TI',
        level: 'tecnico',
        field: 'ti_sistemas',
        durationMonths: 8,
        monthlyFee: 0,
        minAge: 15,
        prerequisiteLevel: 'fundamental',
        minEntranceGrade: 6.5,
        allowedShifts: ['manha', 'tarde', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.3,
        graduationBonusDesc: 'Habilita vagas de Técnico em Suporte e Sistemas TI (+2 QI de Luta).',
        desc: 'Programação, redes, bancos de dados e manutenção de sistemas em instituição federal/estadual gratuita.'
      },
      {
        id: 'tec_pub_enfermagem',
        institutionId: 'inst_pub_tecnico',
        title: 'Técnico em Enfermagem & Primeiros Socorros',
        level: 'tecnico',
        field: 'saude_enfermagem',
        durationMonths: 8,
        monthlyFee: 0,
        minAge: 16,
        prerequisiteLevel: 'fundamental',
        minEntranceGrade: 6.5,
        allowedShifts: ['manha', 'tarde', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.3,
        graduationBonusDesc: 'Habilita Técnico de Enfermagem e melhora noções de prevenção de lesões.',
        desc: 'Anatomia, atendimento clínico, curativos e socorro emergencial de atletas.'
      },
      {
        id: 'tec_pub_adm',
        institutionId: 'inst_pub_tecnico',
        title: 'Técnico em Administração & Gestão Esportiva',
        level: 'tecnico',
        field: 'administracao',
        durationMonths: 8,
        monthlyFee: 0,
        minAge: 15,
        prerequisiteLevel: 'fundamental',
        minEntranceGrade: 6.5,
        allowedShifts: ['manha', 'tarde', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.3,
        graduationBonusDesc: 'Habilita cargos de Técnico Administrativo e gestão de academias.',
        desc: 'Finanças, contabilidade prática, logística e operação de negócios e dojôs.'
      },
      {
        id: 'tec_pub_seguranca',
        institutionId: 'inst_pub_tecnico',
        title: 'Técnico em Segurança do Trabalho',
        level: 'tecnico',
        field: 'seguranca_trabalho',
        durationMonths: 8,
        monthlyFee: 0,
        minAge: 16,
        prerequisiteLevel: 'fundamental',
        minEntranceGrade: 6.5,
        allowedShifts: ['manha', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.3,
        graduationBonusDesc: 'Habilita vagas de Técnico em Segurança do Trabalho em empresas e eventos.',
        desc: 'Normas regulamentadoras (NRs), prevenção de riscos, ergonomia e brigada.'
      },
      {
        id: 'tec_pub_edfisica',
        institutionId: 'inst_pub_tecnico',
        title: 'Técnico em Preparação Física & Musculação',
        level: 'tecnico',
        field: 'educacao_fisica',
        durationMonths: 8,
        monthlyFee: 0,
        minAge: 15,
        prerequisiteLevel: 'fundamental',
        minEntranceGrade: 6.5,
        allowedShifts: ['manha', 'tarde', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.3,
        graduationBonusDesc: 'Habilita Monitor Técnico de Musculação (+2 Resistência física ao concluir).',
        desc: 'Periodização básica de força, hipertrofia e avaliação física esportiva.'
      }
    ]
  },
  {
    id: 'inst_priv_tecnico',
    name: 'SENAC / Escola Técnica Paulista',
    shortName: 'SENAC / Técnica Privada',
    type: 'particular',
    level: 'tecnico',
    badge: '🏫 Rede Técnica Particular',
    prestigeLabel: 'Acesso Amplo • Aulas Práticas (Seg/Qua/Sex)',
    description:
      'Rede particular técnica com ingresso facilitado sem vestibulinho eliminatório e equipamentos modernos.',
    courses: [
      {
        id: 'tec_priv_ti',
        institutionId: 'inst_priv_tecnico',
        title: 'Técnico em Informática & Redes (Particular)',
        level: 'tecnico',
        field: 'ti_sistemas',
        durationMonths: 8,
        monthlyFee: 420,
        minAge: 15,
        prerequisiteLevel: 'fundamental',
        minEntranceGrade: 5.0,
        allowedShifts: ['manha', 'tarde', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.4,
        graduationBonusDesc: 'Habilita vagas de Técnico de Suporte e Sistemas TI.',
        desc: 'Infraestrutura de redes, hardware, cloud e suporte corporativo com laboratórios completos.'
      },
      {
        id: 'tec_priv_enfermagem',
        institutionId: 'inst_priv_tecnico',
        title: 'Técnico em Enfermagem & Reabilitação (Particular)',
        level: 'tecnico',
        field: 'saude_enfermagem',
        durationMonths: 8,
        monthlyFee: 460,
        minAge: 16,
        prerequisiteLevel: 'fundamental',
        minEntranceGrade: 5.0,
        allowedShifts: ['manha', 'tarde', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.4,
        graduationBonusDesc: 'Habilita Técnico de Enfermagem em clínicas e hospitais.',
        desc: 'Estágios supervisionados, atendimento de emergência e recuperação pós-traumática.'
      },
      {
        id: 'tec_priv_adm',
        institutionId: 'inst_priv_tecnico',
        title: 'Técnico em Gestão Financeira & Empreendedorismo',
        level: 'tecnico',
        field: 'administracao',
        durationMonths: 8,
        monthlyFee: 390,
        minAge: 15,
        prerequisiteLevel: 'fundamental',
        minEntranceGrade: 5.0,
        allowedShifts: ['manha', 'tarde', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.4,
        graduationBonusDesc: 'Habilita Técnico em Gestão & Finanças.',
        desc: 'Fluxo de caixa, marketing, contratos e administração de empresas modernas.'
      },
      {
        id: 'tec_priv_seguranca',
        institutionId: 'inst_priv_tecnico',
        title: 'Técnico em Segurança & Prevenção (Particular)',
        level: 'tecnico',
        field: 'seguranca_trabalho',
        durationMonths: 8,
        monthlyFee: 410,
        minAge: 16,
        prerequisiteLevel: 'fundamental',
        minEntranceGrade: 5.0,
        allowedShifts: ['manha', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.4,
        graduationBonusDesc: 'Habilita Técnico em Segurança do Trabalho.',
        desc: 'Auditoria preventiva, inspeção de arenas esportivas e segurança ocupacional.'
      },
      {
        id: 'tec_priv_edfisica',
        institutionId: 'inst_priv_tecnico',
        title: 'Técnico em Treinamento Esportivo (Particular)',
        level: 'tecnico',
        field: 'educacao_fisica',
        durationMonths: 8,
        monthlyFee: 400,
        minAge: 15,
        prerequisiteLevel: 'fundamental',
        minEntranceGrade: 5.0,
        allowedShifts: ['manha', 'tarde', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.4,
        graduationBonusDesc: 'Habilita Monitor Técnico de Musculação & Treino (+2 Resistência).',
        desc: 'Treinamento funcional, biomecânica de sala e acompanhamento de alunos.'
      }
    ]
  },

  // =========================================================================
  // 4. ENSINO SUPERIOR EM VÁRIAS ÁREAS (PÚBLICA E PARTICULAR)
  // =========================================================================
  {
    id: 'inst_pub_superior',
    name: 'Universidade Federal / Estadual Pública (USP / UFRJ)',
    shortName: 'Universidade Pública',
    type: 'publica',
    level: 'superior',
    badge: '🏛️ Universidade Pública',
    prestigeLabel: 'Gratuita • Exige Vestibular (Média ≥ 7.5 | Med ≥ 8.5)',
    description:
      'Ensino superior público de excelência acadêmica, totalmente gratuito para aprovados no vestibular (2 pts Seg/Qua/Sex).',
    courses: [
      {
        id: 'sup_pub_edfisica',
        institutionId: 'inst_pub_superior',
        title: 'Bacharelado em Educação Física & Biomecânica',
        level: 'superior',
        field: 'educacao_fisica',
        durationMonths: 16,
        monthlyFee: 0,
        minAge: 17,
        prerequisiteLevel: 'medio',
        minEntranceGrade: 7.5,
        allowedShifts: ['manha', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.3,
        graduationBonusDesc: 'Habilita Preparador Físico / Prof. Educação Física (+3 Técnica, +3 Resistência).',
        desc: 'Fisiologia do exercício, periodização olímpica e biomecânica aplicada ao combate.'
      },
      {
        id: 'sup_pub_fisioterapia',
        institutionId: 'inst_pub_superior',
        title: 'Bacharelado em Fisioterapia Esportiva',
        level: 'superior',
        field: 'fisioterapia',
        durationMonths: 16,
        monthlyFee: 0,
        minAge: 17,
        prerequisiteLevel: 'medio',
        minEntranceGrade: 7.5,
        allowedShifts: ['manha', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.3,
        graduationBonusDesc: 'Habilita Fisioterapeuta Esportivo (+4 Durabilidade/Prevenção).',
        desc: 'Reabilitação musculoesquelética, prevenção articular e fisioterapia de alto rendimento.'
      },
      {
        id: 'sup_pub_nutricao',
        institutionId: 'inst_pub_superior',
        title: 'Bacharelado em Nutrição Esportiva',
        level: 'superior',
        field: 'nutricao',
        durationMonths: 16,
        monthlyFee: 0,
        minAge: 17,
        prerequisiteLevel: 'medio',
        minEntranceGrade: 7.5,
        allowedShifts: ['manha', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.3,
        graduationBonusDesc: 'Habilita Nutricionista Esportivo (+3 Resistência, +2 Foco Mental).',
        desc: 'Bioquímica metabólica, corte de peso seguro e suplementação científica.'
      },
      {
        id: 'sup_pub_ti',
        institutionId: 'inst_pub_superior',
        title: 'Ciência da Computação & Engenharia de Software',
        level: 'superior',
        field: 'ti_sistemas',
        durationMonths: 16,
        monthlyFee: 0,
        minAge: 17,
        prerequisiteLevel: 'medio',
        minEntranceGrade: 7.5,
        allowedShifts: ['manha', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.3,
        graduationBonusDesc: 'Habilita Engenheiro de Software / Dev Sênior (+5 QI de Luta/Lógica).',
        desc: 'Algoritmos, arquitetura distribuída, inteligência artificial e engenharia de software.'
      },
      {
        id: 'sup_pub_adm',
        institutionId: 'inst_pub_superior',
        title: 'Administração & Economia Corporativa',
        level: 'superior',
        field: 'administracao',
        durationMonths: 16,
        monthlyFee: 0,
        minAge: 17,
        prerequisiteLevel: 'medio',
        minEntranceGrade: 7.5,
        allowedShifts: ['manha', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.3,
        graduationBonusDesc: 'Habilita Administrador / Gestor Executivo (+3 Foco, +25 Honra/Prestígio).',
        desc: 'Estratégia empresarial, finanças corporativas e gestão de franquias e ligas.'
      },
      {
        id: 'sup_pub_direito',
        institutionId: 'inst_pub_superior',
        title: 'Bacharelado em Direito',
        level: 'superior',
        field: 'direito',
        durationMonths: 16,
        monthlyFee: 0,
        minAge: 17,
        prerequisiteLevel: 'medio',
        minEntranceGrade: 7.5,
        allowedShifts: ['manha', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.3,
        graduationBonusDesc: 'Habilita Advogado / Assessor Jurídico Esportivo (+4 QI, +4 Foco).',
        desc: 'Direito civil, trabalhista, contratos de atletas e direito desportivo internacional.'
      },
      {
        id: 'sup_pub_medicina',
        institutionId: 'inst_pub_superior',
        title: 'Medicina & Traumatologia Esportiva',
        level: 'superior',
        field: 'medicina',
        durationMonths: 20,
        monthlyFee: 0,
        minAge: 18,
        prerequisiteLevel: 'medio',
        minEntranceGrade: 8.5,
        allowedShifts: ['manha', 'tarde'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.25,
        graduationBonusDesc: 'Habilita Médico do Esporte (+5 Foco, +4 QI, altíssimo salário e recuperação).',
        desc: 'Curso mais concorrido do país. Formação médica completa com ênfase em medicina do esporte.'
      }
    ]
  },
  {
    id: 'inst_priv_superior',
    name: 'Centro Universitário Metropolitano (PUC / Particular)',
    shortName: 'Centro Univ. Metropolitano',
    type: 'particular',
    level: 'superior',
    badge: '🏫 Faculdade Particular',
    prestigeLabel: 'Turnos Flexíveis • Ingresso Facilitado (Média ≥ 5.5)',
    description:
      'Universidade privada com ampla disponibilidade de horários (Manhã, Tarde, Noite) para conciliar com trabalho e lutas.',
    courses: [
      {
        id: 'sup_priv_edfisica',
        institutionId: 'inst_priv_superior',
        title: 'Educação Física (Faculdade Particular)',
        level: 'superior',
        field: 'educacao_fisica',
        durationMonths: 16,
        monthlyFee: 950,
        minAge: 17,
        prerequisiteLevel: 'medio',
        minEntranceGrade: 5.5,
        allowedShifts: ['manha', 'tarde', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.4,
        graduationBonusDesc: 'Habilita Preparador Físico / Prof. Educação Física.',
        desc: 'Bacharelado completo voltado para preparação de atletas e gestão de centros esportivos.'
      },
      {
        id: 'sup_priv_fisioterapia',
        institutionId: 'inst_priv_superior',
        title: 'Fisioterapia Esportiva (Particular)',
        level: 'superior',
        field: 'fisioterapia',
        durationMonths: 16,
        monthlyFee: 1180,
        minAge: 17,
        prerequisiteLevel: 'medio',
        minEntranceGrade: 5.5,
        allowedShifts: ['manha', 'tarde', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.4,
        graduationBonusDesc: 'Habilita Fisioterapeuta Esportivo.',
        desc: 'Clínica escola moderna com foco em ortopedia desportiva e terapia manual.'
      },
      {
        id: 'sup_priv_nutricao',
        institutionId: 'inst_priv_superior',
        title: 'Nutrição Esportiva (Particular)',
        level: 'superior',
        field: 'nutricao',
        durationMonths: 16,
        monthlyFee: 1080,
        minAge: 17,
        prerequisiteLevel: 'medio',
        minEntranceGrade: 5.5,
        allowedShifts: ['manha', 'tarde', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.4,
        graduationBonusDesc: 'Habilita Nutricionista Esportivo.',
        desc: 'Planejamento nutricional clínico e esportivo para atletas profissionais e amadores.'
      },
      {
        id: 'sup_priv_ti',
        institutionId: 'inst_priv_superior',
        title: 'Engenharia de Software & TI (Particular)',
        level: 'superior',
        field: 'ti_sistemas',
        durationMonths: 16,
        monthlyFee: 1150,
        minAge: 17,
        prerequisiteLevel: 'medio',
        minEntranceGrade: 5.5,
        allowedShifts: ['manha', 'tarde', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.4,
        graduationBonusDesc: 'Habilita Engenheiro de Software / Dev Sênior.',
        desc: 'Desenvolvimento full-stack, nuvem e arquitetura de produtos digitais.'
      },
      {
        id: 'sup_priv_adm',
        institutionId: 'inst_priv_superior',
        title: 'Administração de Empresas (Particular)',
        level: 'superior',
        field: 'administracao',
        durationMonths: 16,
        monthlyFee: 990,
        minAge: 17,
        prerequisiteLevel: 'medio',
        minEntranceGrade: 5.5,
        allowedShifts: ['manha', 'tarde', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.4,
        graduationBonusDesc: 'Habilita Administrador / Gestor Executivo.',
        desc: 'Gestão de negócios, finanças, marketing esportivo e liderança corporativa.'
      },
      {
        id: 'sup_priv_direito',
        institutionId: 'inst_priv_superior',
        title: 'Direito (Faculdade Particular)',
        level: 'superior',
        field: 'direito',
        durationMonths: 16,
        monthlyFee: 1250,
        minAge: 17,
        prerequisiteLevel: 'medio',
        minEntranceGrade: 5.5,
        allowedShifts: ['manha', 'tarde', 'noite'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.4,
        graduationBonusDesc: 'Habilita Advogado / Assessor Jurídico Esportivo.',
        desc: 'Prática jurídica, contratos comerciais, arbitragem e preparação para a OAB.'
      },
      {
        id: 'sup_priv_medicina',
        institutionId: 'inst_priv_superior',
        title: 'Medicina (Faculdade Particular)',
        level: 'superior',
        field: 'medicina',
        durationMonths: 20,
        monthlyFee: 2400,
        minAge: 18,
        prerequisiteLevel: 'medio',
        minEntranceGrade: 6.5,
        allowedShifts: ['manha', 'tarde'],
        pointsPerSession: 2,
        daysPattern: 'seg_qua_sex',
        gradeBonusPerMonth: 0.35,
        graduationBonusDesc: 'Habilita Médico do Esporte & Ortopedia.',
        desc: 'Graduação médica particular com internato hospitalar e traumatologia esportiva.'
      }
    ]
  }
];

export interface EducationOfferingItem {
  institution: EducationInstitution;
  course: EducationInstitution['courses'][number];
}

export function getAllEducationOfferings(): EducationOfferingItem[] {
  const list: EducationOfferingItem[] = [];
  for (const inst of EDUCATION_INSTITUTIONS) {
    for (const course of inst.courses) {
      list.push({ institution: inst, course });
    }
  }
  return list;
}

export function findEducationCourse(
  institutionId: string,
  courseId: string
): EducationOfferingItem | undefined {
  const inst = EDUCATION_INSTITUTIONS.find((i) => i.id === institutionId);
  if (!inst) return undefined;
  const course = inst.courses.find((c) => c.id === courseId);
  if (!course) return undefined;
  return { institution: inst, course };
}
