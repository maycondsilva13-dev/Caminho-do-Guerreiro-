import {
  BrazilRegion,
  BrazilUF,
  CapitalEconomicProfile,
  CapitalSportProfile,
  GeoCoordinates
} from '../types/game';

export interface BrazilStateInfo {
  uf: BrazilUF;
  name: string;
  capital: string;
  region: BrazilRegion;
  flagEmoji: string;
  martialHeritage: string; // Tradição ou celeiro de lutas do estado
  coordinates: GeoCoordinates;
  economy: CapitalEconomicProfile;
  sport: CapitalSportProfile;
}

export const BRAZIL_CAPITALS_COUNT = 27;

/**
 * Catálogo único e oficial das 27 localidades jogáveis no Brasil:
 * as 26 capitais estaduais + Brasília (Distrito Federal).
 */
export const BRAZIL_STATES: BrazilStateInfo[] = [
  {
    uf: 'AC',
    name: 'Acre',
    capital: 'Rio Branco',
    region: 'Norte',
    flagEmoji: '⭐️',
    martialHeritage: 'Celeiro de guerreiros da floresta e forte tradição no Jiu-Jitsu e Judô do Norte.',
    coordinates: { lat: -9.97499, lng: -67.8243 },
    economy: {
      costOfLivingIndex: 0.83,
      housingBase: 355,
      foodBase: 243,
      transportBase: 92,
      healthBase: 89,
      educationMultiplier: 0.82,
      salaryMultiplier: 0.84,
      gymTuitionMultiplier: 0.81
    },
    sport: {
      sportDevelopmentIndex: 54,
      infrastructureLevel: 'basica',
      sponsorshipMarketIndex: 0.77,
      gymVarietyTier: 'essencial',
      dominantArts: ['jiujitsu', 'judo', 'mma'],
      economicIdentity: 'Capital amazônica de fronteira com custo de vida acessível e economia baseada em serviços públicos e comércio regional.',
      jobOpportunityLabel: 'Comércio local, setor público e projetos sociais esportivos'
    }
  },
  {
    uf: 'AL',
    name: 'Alagoas',
    capital: 'Maceió',
    region: 'Nordeste',
    flagEmoji: '🌴',
    martialHeritage: 'Terra de grandes talentos do Boxe nordestino e tradição nas rodas de Capoeira praiana.',
    coordinates: { lat: -9.66599, lng: -35.735 },
    economy: {
      costOfLivingIndex: 0.87,
      housingBase: 384,
      foodBase: 239,
      transportBase: 104,
      healthBase: 95,
      educationMultiplier: 0.86,
      salaryMultiplier: 0.85,
      gymTuitionMultiplier: 0.86
    },
    sport: {
      sportDevelopmentIndex: 62,
      infrastructureLevel: 'intermediaria',
      sponsorshipMarketIndex: 0.84,
      gymVarietyTier: 'diversificada',
      dominantArts: ['boxe', 'capoeira', 'jiujitsu'],
      economicIdentity: 'Capital litorânea turística com aluguel moderado e forte presença de esportes ao ar livre e lutas de base.',
      jobOpportunityLabel: 'Turismo, hotelaria, educação física e comércio litorâneo'
    }
  },
  {
    uf: 'AP',
    name: 'Amapá',
    capital: 'Macapá',
    region: 'Norte',
    flagEmoji: '🌿',
    martialHeritage: 'Força na fronteira amazônica, revelando atletas resistentes na Luta Livre Esportiva e Jiu-Jitsu.',
    coordinates: { lat: 0.03493, lng: -51.0694 },
    economy: {
      costOfLivingIndex: 0.84,
      housingBase: 362,
      foodBase: 251,
      transportBase: 94,
      healthBase: 90,
      educationMultiplier: 0.83,
      salaryMultiplier: 0.85,
      gymTuitionMultiplier: 0.83
    },
    sport: {
      sportDevelopmentIndex: 52,
      infrastructureLevel: 'basica',
      sponsorshipMarketIndex: 0.76,
      gymVarietyTier: 'essencial',
      dominantArts: ['lutalivre', 'jiujitsu', 'boxe'],
      economicIdentity: 'Capital do extremo norte cortada pelo Equador, com moradia enxuta e rotina dependente de conexões aéreas.',
      jobOpportunityLabel: 'Administração pública, logística portuária e ensino escolar'
    }
  },
  {
    uf: 'AM',
    name: 'Amazonas',
    capital: 'Manaus',
    region: 'Norte',
    flagEmoji: '🐆',
    martialHeritage: 'Meca mundial do Jiu-Jitsu e Luta Livre. Berço de lendas internacionais do UFC e ADCC.',
    coordinates: { lat: -3.11903, lng: -60.0217 },
    economy: {
      costOfLivingIndex: 0.98,
      housingBase: 455,
      foodBase: 282,
      transportBase: 128,
      healthBase: 112,
      educationMultiplier: 0.95,
      salaryMultiplier: 0.97,
      gymTuitionMultiplier: 0.96
    },
    sport: {
      sportDevelopmentIndex: 88,
      infrastructureLevel: 'avancada',
      sponsorshipMarketIndex: 1.12,
      gymVarietyTier: 'polo_nacional',
      dominantArts: ['jiujitsu', 'lutalivre', 'mma'],
      economicIdentity: 'Metrópole industrial da Zona Franca e potência histórica do grappling brasileiro, com grande rivalidade entre equipes.',
      jobOpportunityLabel: 'Polo industrial, logística, arbitragem e academias de competição'
    }
  },
  {
    uf: 'BA',
    name: 'Bahia',
    capital: 'Salvador',
    region: 'Nordeste',
    flagEmoji: '🪘',
    martialHeritage: 'Berço sagrado da Capoeira e celeiro lendário do Boxe olímpico brasileiro e MMA.',
    coordinates: { lat: -12.9714, lng: -38.5014 },
    economy: {
      costOfLivingIndex: 0.99,
      housingBase: 465,
      foodBase: 265,
      transportBase: 134,
      healthBase: 116,
      educationMultiplier: 0.98,
      salaryMultiplier: 0.96,
      gymTuitionMultiplier: 0.98
    },
    sport: {
      sportDevelopmentIndex: 86,
      infrastructureLevel: 'avancada',
      sponsorshipMarketIndex: 1.10,
      gymVarietyTier: 'polo_nacional',
      dominantArts: ['capoeira', 'boxe', 'mma'],
      economicIdentity: 'Grande metrópole cultural do Nordeste, referência olímpica no Boxe e templo mundial da Capoeira.',
      jobOpportunityLabel: 'Cultura, turismo, centros olímpicos de boxe e clínicas esportivas'
    }
  },
  {
    uf: 'CE',
    name: 'Ceará',
    capital: 'Fortaleza',
    region: 'Nordeste',
    flagEmoji: '☀️',
    martialHeritage: 'Celeiro vibrante de Muay Thai, Boxe e Jiu-Jitsu com atletas de queixo duro e raça.',
    coordinates: { lat: -3.73186, lng: -38.5267 },
    economy: {
      costOfLivingIndex: 0.93,
      housingBase: 425,
      foodBase: 252,
      transportBase: 119,
      healthBase: 108,
      educationMultiplier: 0.93,
      salaryMultiplier: 0.92,
      gymTuitionMultiplier: 0.93
    },
    sport: {
      sportDevelopmentIndex: 81,
      infrastructureLevel: 'avancada',
      sponsorshipMarketIndex: 1.04,
      gymVarietyTier: 'polo_nacional',
      dominantArts: ['muaythai', 'jiujitsu', 'boxe'],
      economicIdentity: 'Centro econômico do Nordeste setentrional, com circuito ativo de lutas em pé, grappling e grandes eventos regionais.',
      jobOpportunityLabel: 'Serviços, turismo, personal training e eventos de combate'
    }
  },
  {
    uf: 'DF',
    name: 'Distrito Federal',
    capital: 'Brasília',
    region: 'Centro-Oeste',
    flagEmoji: '🏛️',
    martialHeritage: 'Polo central de seleções olímpicas de Judô, Karatê WKF e Taekwondo.',
    coordinates: { lat: -15.7942, lng: -47.8822 },
    economy: {
      costOfLivingIndex: 1.22,
      housingBase: 615,
      foodBase: 318,
      transportBase: 178,
      healthBase: 164,
      educationMultiplier: 1.23,
      salaryMultiplier: 1.27,
      gymTuitionMultiplier: 1.22
    },
    sport: {
      sportDevelopmentIndex: 83,
      infrastructureLevel: 'avancada',
      sponsorshipMarketIndex: 1.18,
      gymVarietyTier: 'polo_nacional',
      dominantArts: ['judo', 'karate', 'jiujitsu'],
      economicIdentity: 'Capital federal de alta renda média e aluguel elevado, concentrando confederações, bolsas institucionais e ensino superior.',
      jobOpportunityLabel: 'Administração pública, direito, saúde privada e federações nacionais'
    }
  },
  {
    uf: 'ES',
    name: 'Espírito Santo',
    capital: 'Vitória',
    region: 'Sudeste',
    flagEmoji: '⚓️',
    martialHeritage: 'Forte tradição em circuitos estaduais de Jiu-Jitsu litorâneo e Kickboxing.',
    coordinates: { lat: -20.3155, lng: -40.3128 },
    economy: {
      costOfLivingIndex: 1.03,
      housingBase: 495,
      foodBase: 278,
      transportBase: 140,
      healthBase: 125,
      educationMultiplier: 1.03,
      salaryMultiplier: 1.04,
      gymTuitionMultiplier: 1.02
    },
    sport: {
      sportDevelopmentIndex: 72,
      infrastructureLevel: 'intermediaria',
      sponsorshipMarketIndex: 0.98,
      gymVarietyTier: 'diversificada',
      dominantArts: ['jiujitsu', 'muaythai', 'boxe'],
      economicIdentity: 'Ilha portuária organizada com boa qualidade de vida, custo intermediário do Sudeste e calendário ativo de grappling.',
      jobOpportunityLabel: 'Comércio exterior, portos, engenharia/TI e academias de praia'
    }
  },
  {
    uf: 'GO',
    name: 'Goiás',
    capital: 'Goiânia',
    region: 'Centro-Oeste',
    flagEmoji: '🌽',
    martialHeritage: 'Crescimento explosivo no MMA e Luta Livre Esportiva, com academias de ponta no Centro-Oeste.',
    coordinates: { lat: -16.6869, lng: -49.2648 },
    economy: {
      costOfLivingIndex: 0.95,
      housingBase: 440,
      foodBase: 262,
      transportBase: 124,
      healthBase: 114,
      educationMultiplier: 0.96,
      salaryMultiplier: 0.98,
      gymTuitionMultiplier: 0.95
    },
    sport: {
      sportDevelopmentIndex: 77,
      infrastructureLevel: 'avancada',
      sponsorshipMarketIndex: 1.02,
      gymVarietyTier: 'diversificada',
      dominantArts: ['mma', 'lutalivre', 'jiujitsu'],
      economicIdentity: 'Hub de agronegócio e serviços no Centro-Oeste com custo equilibrado e rápida expansão de equipes competitivas de MMA.',
      jobOpportunityLabel: 'Agronegócio, gestão comercial, saúde esportiva e CTs de MMA'
    }
  },
  {
    uf: 'MA',
    name: 'Maranhão',
    capital: 'São Luís',
    region: 'Nordeste',
    flagEmoji: '🌊',
    martialHeritage: 'Tradição do Karatê, Judô e Capoeira ancestral dos quilombos e da ilha.',
    coordinates: { lat: -2.53073, lng: -44.3068 },
    economy: {
      costOfLivingIndex: 0.82,
      housingBase: 352,
      foodBase: 231,
      transportBase: 96,
      healthBase: 91,
      educationMultiplier: 0.81,
      salaryMultiplier: 0.82,
      gymTuitionMultiplier: 0.82
    },
    sport: {
      sportDevelopmentIndex: 61,
      infrastructureLevel: 'intermediaria',
      sponsorshipMarketIndex: 0.82,
      gymVarietyTier: 'diversificada',
      dominantArts: ['karate', 'judo', 'capoeira'],
      economicIdentity: 'Capital insular histórica com custo acessível, forte base escolar de artes tradicionais e logística marítima.',
      jobOpportunityLabel: 'Logística portuária, comércio, ensino básico e projetos comunitários'
    }
  },
  {
    uf: 'MT',
    name: 'Mato Grosso',
    capital: 'Cuiabá',
    region: 'Centro-Oeste',
    flagEmoji: '🌾',
    martialHeritage: 'Potência em expansão nos esportes de combate e forte base de Jiu-Jitsu e Muay Thai.',
    coordinates: { lat: -15.6014, lng: -56.0979 },
    economy: {
      costOfLivingIndex: 0.94,
      housingBase: 435,
      foodBase: 271,
      transportBase: 121,
      healthBase: 110,
      educationMultiplier: 0.93,
      salaryMultiplier: 0.97,
      gymTuitionMultiplier: 0.94
    },
    sport: {
      sportDevelopmentIndex: 68,
      infrastructureLevel: 'intermediaria',
      sponsorshipMarketIndex: 0.94,
      gymVarietyTier: 'diversificada',
      dominantArts: ['jiujitsu', 'muaythai', 'mma'],
      economicIdentity: 'Capital quente do centro sul-americano impulsionada por serviços agrícolas e crescimento constante de torneios locais.',
      jobOpportunityLabel: 'Comércio, segurança do trabalho, agronegócio e preparação física'
    }
  },
  {
    uf: 'MS',
    name: 'Mato Grosso do Sul',
    capital: 'Campo Grande',
    region: 'Centro-Oeste',
    flagEmoji: '🐂',
    martialHeritage: 'Tradição em Judô de alta precisão e intercâmbio com a Luta Livre de fronteira.',
    coordinates: { lat: -20.4697, lng: -54.6201 },
    economy: {
      costOfLivingIndex: 0.92,
      housingBase: 418,
      foodBase: 258,
      transportBase: 116,
      healthBase: 109,
      educationMultiplier: 0.92,
      salaryMultiplier: 0.94,
      gymTuitionMultiplier: 0.91
    },
    sport: {
      sportDevelopmentIndex: 70,
      infrastructureLevel: 'intermediaria',
      sponsorshipMarketIndex: 0.92,
      gymVarietyTier: 'diversificada',
      dominantArts: ['judo', 'lutalivre', 'karate'],
      economicIdentity: 'Cidade planejada de custo estável, com clubes tradicionais de Judô federado e intercâmbio técnico fronteiriço.',
      jobOpportunityLabel: 'Serviços urbanos, pecuária/gestão e clubes poliesportivos'
    }
  },
  {
    uf: 'MG',
    name: 'Minas Gerais',
    capital: 'Belo Horizonte',
    region: 'Sudeste',
    flagEmoji: '⛰️',
    martialHeritage: 'Berço da lendária escola mineira de Muay Thai agressivo e campeões mundiais de Jiu-Jitsu.',
    coordinates: { lat: -19.9167, lng: -43.9345 },
    economy: {
      costOfLivingIndex: 1.07,
      housingBase: 520,
      foodBase: 282,
      transportBase: 152,
      healthBase: 132,
      educationMultiplier: 1.07,
      salaryMultiplier: 1.08,
      gymTuitionMultiplier: 1.07
    },
    sport: {
      sportDevelopmentIndex: 87,
      infrastructureLevel: 'avancada',
      sponsorshipMarketIndex: 1.15,
      gymVarietyTier: 'polo_nacional',
      dominantArts: ['muaythai', 'jiujitsu', 'mma'],
      economicIdentity: 'Grande polo universitário, tecnológico e esportivo do Sudeste, com escolas duras de trocação e grappling de alto rendimento.',
      jobOpportunityLabel: 'Tecnologia/TI, engenharia, fisioterapia esportiva e grandes equipes'
    }
  },
  {
    uf: 'PA',
    name: 'Pará',
    capital: 'Belém',
    region: 'Norte',
    flagEmoji: '🦅',
    martialHeritage: 'Berço histórico do Jiu-Jitsu Brasileiro no Norte, marcado pelos pioneiros em Belém.',
    coordinates: { lat: -1.45575, lng: -48.4902 },
    economy: {
      costOfLivingIndex: 0.91,
      housingBase: 412,
      foodBase: 256,
      transportBase: 115,
      healthBase: 104,
      educationMultiplier: 0.90,
      salaryMultiplier: 0.89,
      gymTuitionMultiplier: 0.90
    },
    sport: {
      sportDevelopmentIndex: 76,
      infrastructureLevel: 'intermediaria',
      sponsorshipMarketIndex: 0.96,
      gymVarietyTier: 'diversificada',
      dominantArts: ['jiujitsu', 'lutalivre', 'boxe'],
      economicIdentity: 'Metrópole amazônica histórica onde Conde Koma iniciou o Jiu-Jitsu brasileiro, unindo tradição marcial e custo moderado.',
      jobOpportunityLabel: 'Comércio regional, serviços urbanos, ensino e dojos tradicionais'
    }
  },
  {
    uf: 'PB',
    name: 'Paraíba',
    capital: 'João Pessoa',
    region: 'Nordeste',
    flagEmoji: '🌅',
    martialHeritage: 'Forte revelação de pugilistas velozes, caratecas técnicos e campeões mundiais de BJJ.',
    coordinates: { lat: -7.1195, lng: -34.845 },
    economy: {
      costOfLivingIndex: 0.86,
      housingBase: 376,
      foodBase: 236,
      transportBase: 101,
      healthBase: 93,
      educationMultiplier: 0.85,
      salaryMultiplier: 0.86,
      gymTuitionMultiplier: 0.85
    },
    sport: {
      sportDevelopmentIndex: 67,
      infrastructureLevel: 'intermediaria',
      sponsorshipMarketIndex: 0.87,
      gymVarietyTier: 'diversificada',
      dominantArts: ['jiujitsu', 'karate', 'boxe'],
      economicIdentity: 'Capital costeira de ritmo equilibrado e aluguel acessível, revelando competidores técnicos de kimono e ringue.',
      jobOpportunityLabel: 'Turismo, serviços, TI emergente e ensino técnico'
    }
  },
  {
    uf: 'PR',
    name: 'Paraná',
    capital: 'Curitiba',
    region: 'Sul',
    flagEmoji: '🌲',
    martialHeritage: 'Capital histórica da trocação agressiva e de escolas tradicionais de Muay Thai e Vale-Tudo.',
    coordinates: { lat: -25.4284, lng: -49.2733 },
    economy: {
      costOfLivingIndex: 1.09,
      housingBase: 535,
      foodBase: 288,
      transportBase: 148,
      healthBase: 136,
      educationMultiplier: 1.10,
      salaryMultiplier: 1.12,
      gymTuitionMultiplier: 1.09
    },
    sport: {
      sportDevelopmentIndex: 91,
      infrastructureLevel: 'metropole_olimpica',
      sponsorshipMarketIndex: 1.20,
      gymVarietyTier: 'polo_nacional',
      dominantArts: ['muaythai', 'mma', 'jiujitsu'],
      economicIdentity: 'Meca sul-americana do Muay Thai e do Vale-Tudo moderno, com infraestrutura urbana eficiente e forte cultura de sparrings.',
      jobOpportunityLabel: 'Indústria, tecnologia, medicina esportiva e CTs de MMA profissional'
    }
  },
  {
    uf: 'PE',
    name: 'Pernambuco',
    capital: 'Recife',
    region: 'Nordeste',
    flagEmoji: '🦁',
    martialHeritage: 'Polo nordestino de Judô olímpico, BJJ de alto nível técnico e Capoeira de tradição.',
    coordinates: { lat: -8.04756, lng: -34.877 },
    economy: {
      costOfLivingIndex: 0.97,
      housingBase: 452,
      foodBase: 260,
      transportBase: 130,
      healthBase: 118,
      educationMultiplier: 0.97,
      salaryMultiplier: 0.95,
      gymTuitionMultiplier: 0.96
    },
    sport: {
      sportDevelopmentIndex: 82,
      infrastructureLevel: 'avancada',
      sponsorshipMarketIndex: 1.06,
      gymVarietyTier: 'polo_nacional',
      dominantArts: ['judo', 'jiujitsu', 'capoeira'],
      economicIdentity: 'Polo tecnológico, universitário e médico do Nordeste com tradição consolidada em Judô e eventos federativos.',
      jobOpportunityLabel: 'Tecnologia (Porto Digital), saúde, direito e clubes olímpicos'
    }
  },
  {
    uf: 'PI',
    name: 'Piauí',
    capital: 'Teresina',
    region: 'Nordeste',
    flagEmoji: '🌵',
    martialHeritage: 'Celeiro de jovens atletas determinados em Judô, Karatê e Lutas Amadoras.',
    coordinates: { lat: -5.08921, lng: -42.8016 },
    economy: {
      costOfLivingIndex: 0.80,
      housingBase: 340,
      foodBase: 224,
      transportBase: 89,
      healthBase: 85,
      educationMultiplier: 0.80,
      salaryMultiplier: 0.80,
      gymTuitionMultiplier: 0.80
    },
    sport: {
      sportDevelopmentIndex: 58,
      infrastructureLevel: 'basica',
      sponsorshipMarketIndex: 0.78,
      gymVarietyTier: 'essencial',
      dominantArts: ['judo', 'karate', 'boxe'],
      economicIdentity: 'Capital com um dos menores custos de vida do país, favorecendo permanência estudantil e formação disciplinada de base.',
      jobOpportunityLabel: 'Comércio, serviços educacionais, enfermagem e projetos de base'
    }
  },
  {
    uf: 'RJ',
    name: 'Rio de Janeiro',
    capital: 'Rio de Janeiro',
    region: 'Sudeste',
    flagEmoji: '🏖️',
    martialHeritage: 'Meca do BJJ mundial e do Vale Tudo original, epicentro de grandes linhagens cariocas.',
    coordinates: { lat: -22.9068, lng: -43.1729 },
    economy: {
      costOfLivingIndex: 1.26,
      housingBase: 645,
      foodBase: 328,
      transportBase: 188,
      healthBase: 162,
      educationMultiplier: 1.24,
      salaryMultiplier: 1.22,
      gymTuitionMultiplier: 1.25
    },
    sport: {
      sportDevelopmentIndex: 96,
      infrastructureLevel: 'metropole_olimpica',
      sponsorshipMarketIndex: 1.35,
      gymVarietyTier: 'polo_nacional',
      dominantArts: ['jiujitsu', 'lutalivre', 'mma'],
      economicIdentity: 'Berço histórico do Jiu-Jitsu e da Luta Livre Carioca, com altíssima densidade de faixas-pretas, eventos e custo de vida elevado.',
      jobOpportunityLabel: 'Mídia esportiva, turismo, preparação física e academias lendárias'
    }
  },
  {
    uf: 'RN',
    name: 'Rio Grande do Norte',
    capital: 'Natal',
    region: 'Nordeste',
    flagEmoji: '🌪️',
    martialHeritage: 'Celeiro nordestino de atletas profissionais de MMA e Jiu-Jitsu.',
    coordinates: { lat: -5.79448, lng: -35.211 },
    economy: {
      costOfLivingIndex: 0.89,
      housingBase: 396,
      foodBase: 244,
      transportBase: 109,
      healthBase: 99,
      educationMultiplier: 0.88,
      salaryMultiplier: 0.88,
      gymTuitionMultiplier: 0.89
    },
    sport: {
      sportDevelopmentIndex: 78,
      infrastructureLevel: 'avancada',
      sponsorshipMarketIndex: 0.99,
      gymVarietyTier: 'diversificada',
      dominantArts: ['mma', 'jiujitsu', 'muaythai'],
      economicIdentity: 'Polo potiguar de MMA internacional com equipes competitivas, custo moderado e grande apelo em esportes de combate.',
      jobOpportunityLabel: 'Turismo, serviços, nutrição esportiva e equipes de MMA'
    }
  },
  {
    uf: 'RS',
    name: 'Rio Grande do Sul',
    capital: 'Porto Alegre',
    region: 'Sul',
    flagEmoji: '🧉',
    martialHeritage: 'Tradição centenária de clubes olímpicos de Judô gaúcho e forte Muay Thai.',
    coordinates: { lat: -30.0346, lng: -51.2177 },
    economy: {
      costOfLivingIndex: 1.11,
      housingBase: 545,
      foodBase: 295,
      transportBase: 158,
      healthBase: 138,
      educationMultiplier: 1.11,
      salaryMultiplier: 1.10,
      gymTuitionMultiplier: 1.10
    },
    sport: {
      sportDevelopmentIndex: 89,
      infrastructureLevel: 'avancada',
      sponsorshipMarketIndex: 1.16,
      gymVarietyTier: 'polo_nacional',
      dominantArts: ['judo', 'muaythai', 'jiujitsu'],
      economicIdentity: 'Capital gaúcha com clubes poliesportivos olímpicos seculares, forte cultura de Judô de elite e mercado corporativo sólido.',
      jobOpportunityLabel: 'Indústria, clubes olímpicos, medicina esportiva e direito'
    }
  },
  {
    uf: 'RO',
    name: 'Rondônia',
    capital: 'Porto Velho',
    region: 'Norte',
    flagEmoji: '🛶',
    martialHeritage: 'Celeiro de força e garra, com atletas em ascensão no cenário regional de MMA.',
    coordinates: { lat: -8.76116, lng: -63.9004 },
    economy: {
      costOfLivingIndex: 0.87,
      housingBase: 379,
      foodBase: 254,
      transportBase: 107,
      healthBase: 96,
      educationMultiplier: 0.86,
      salaryMultiplier: 0.88,
      gymTuitionMultiplier: 0.85
    },
    sport: {
      sportDevelopmentIndex: 57,
      infrastructureLevel: 'basica',
      sponsorshipMarketIndex: 0.80,
      gymVarietyTier: 'essencial',
      dominantArts: ['mma', 'jiujitsu', 'boxe'],
      economicIdentity: 'Capital amazônica de energia e logística fluvial, com custos enxutos e cena combativa aguerrida em ascensão.',
      jobOpportunityLabel: 'Logística, segurança do trabalho, comércio e eventos regionais'
    }
  },
  {
    uf: 'RR',
    name: 'Roraima',
    capital: 'Boa Vista',
    region: 'Norte',
    flagEmoji: '⛰️',
    martialHeritage: 'Destaque na Luta Livre Esportiva e Jiu-Jitsu com forte intercâmbio caribenho e do Norte.',
    coordinates: { lat: 2.82351, lng: -60.6758 },
    economy: {
      costOfLivingIndex: 0.86,
      housingBase: 374,
      foodBase: 258,
      transportBase: 97,
      healthBase: 94,
      educationMultiplier: 0.85,
      salaryMultiplier: 0.87,
      gymTuitionMultiplier: 0.84
    },
    sport: {
      sportDevelopmentIndex: 55,
      infrastructureLevel: 'basica',
      sponsorshipMarketIndex: 0.78,
      gymVarietyTier: 'essencial',
      dominantArts: ['lutalivre', 'jiujitsu', 'karate'],
      economicIdentity: 'Capital planejada no extremo norte, com vida tranquila, custos básicos controlados e deslocamentos interestaduais longos.',
      jobOpportunityLabel: 'Serviço público, comércio de fronteira e docência esportiva'
    }
  },
  {
    uf: 'SC',
    name: 'Santa Catarina',
    capital: 'Florianópolis',
    region: 'Sul',
    flagEmoji: '🌊',
    martialHeritage: 'Polo do Muay Thai, BJJ e centros de treinamento internacionais na Ilha da Magia.',
    coordinates: { lat: -27.5954, lng: -48.548 },
    economy: {
      costOfLivingIndex: 1.18,
      housingBase: 585,
      foodBase: 308,
      transportBase: 162,
      healthBase: 148,
      educationMultiplier: 1.16,
      salaryMultiplier: 1.17,
      gymTuitionMultiplier: 1.18
    },
    sport: {
      sportDevelopmentIndex: 86,
      infrastructureLevel: 'avancada',
      sponsorshipMarketIndex: 1.22,
      gymVarietyTier: 'polo_nacional',
      dominantArts: ['jiujitsu', 'muaythai', 'mma'],
      economicIdentity: 'Ilha de alta qualidade de vida, tecnologia e turismo premium, atraindo camps técnicos e patrocinadores de lifestyle esportivo.',
      jobOpportunityLabel: 'Tecnologia/TI, turismo, preparação atlética e camps privados'
    }
  },
  {
    uf: 'SP',
    name: 'São Paulo',
    capital: 'São Paulo',
    region: 'Sudeste',
    flagEmoji: '🏙️',
    martialHeritage: 'Maior polo econômico e esportivo do continente. Sede dos maiores estaduais do planeta.',
    coordinates: { lat: -23.5505, lng: -46.6333 },
    economy: {
      costOfLivingIndex: 1.32,
      housingBase: 680,
      foodBase: 340,
      transportBase: 205,
      healthBase: 175,
      educationMultiplier: 1.30,
      salaryMultiplier: 1.29,
      gymTuitionMultiplier: 1.30
    },
    sport: {
      sportDevelopmentIndex: 98,
      infrastructureLevel: 'metropole_olimpica',
      sponsorshipMarketIndex: 1.45,
      gymVarietyTier: 'polo_nacional',
      dominantArts: ['jiujitsu', 'boxe', 'judo'],
      economicIdentity: 'Maior metrópole financeira do Brasil: maior volume de empregos, patrocínios e torneios, mas com o maior custo de moradia e transporte.',
      jobOpportunityLabel: 'Mercado corporativo, TI, medicina, mídia e maiores patrocinadores'
    }
  },
  {
    uf: 'SE',
    name: 'Sergipe',
    capital: 'Aracaju',
    region: 'Nordeste',
    flagEmoji: '⛵️',
    martialHeritage: 'Polo técnico de Karatê, Judô e circuitos estaduais de submission e BJJ.',
    coordinates: { lat: -10.9472, lng: -37.0731 },
    economy: {
      costOfLivingIndex: 0.85,
      housingBase: 370,
      foodBase: 232,
      transportBase: 98,
      healthBase: 92,
      educationMultiplier: 0.84,
      salaryMultiplier: 0.86,
      gymTuitionMultiplier: 0.84
    },
    sport: {
      sportDevelopmentIndex: 63,
      infrastructureLevel: 'intermediaria',
      sponsorshipMarketIndex: 0.85,
      gymVarietyTier: 'diversificada',
      dominantArts: ['karate', 'judo', 'jiujitsu'],
      economicIdentity: 'Capital nordestina compacta e organizada, com deslocamento urbano rápido e ótimo equilíbrio entre renda local e moradia.',
      jobOpportunityLabel: 'Serviços, energia, administração e federações estaduais'
    }
  },
  {
    uf: 'TO',
    name: 'Tocantins',
    capital: 'Palmas',
    region: 'Norte',
    flagEmoji: '☀️',
    martialHeritage: 'Novos dojos e centros de formação de base em Karatê, Jiu-Jitsu e Boxe.',
    coordinates: { lat: -10.184, lng: -48.3336 },
    economy: {
      costOfLivingIndex: 0.88,
      housingBase: 388,
      foodBase: 249,
      transportBase: 106,
      healthBase: 97,
      educationMultiplier: 0.87,
      salaryMultiplier: 0.90,
      gymTuitionMultiplier: 0.87
    },
    sport: {
      sportDevelopmentIndex: 59,
      infrastructureLevel: 'basica',
      sponsorshipMarketIndex: 0.83,
      gymVarietyTier: 'essencial',
      dominantArts: ['karate', 'jiujitsu', 'boxe'],
      economicIdentity: 'Capital jovem e planejada no coração do Brasil, com aluguel moderado e cenário esportivo em plena estruturação.',
      jobOpportunityLabel: 'Agronegócio, administração pública e formação esportiva de base'
    }
  }
];

export function getStateByUf(uf: string): BrazilStateInfo {
  const normalized = (uf || '').trim().toUpperCase();
  return BRAZIL_STATES.find((s) => s.uf === normalized) || BRAZIL_STATES[24]; // default SP
}

export function getCapitalByCity(city: string): BrazilStateInfo | undefined {
  const clean = (city || '').trim().toLowerCase();
  return BRAZIL_STATES.find((s) => s.capital.toLowerCase() === clean);
}
