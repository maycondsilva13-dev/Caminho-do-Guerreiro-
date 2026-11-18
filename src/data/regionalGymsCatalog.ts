import { BRAZIL_STATES, BrazilStateInfo } from './brazilLocations';
import {
  BrazilUF,
  Gym,
  GymCompetitiveProfile,
  GymInfrastructureLevel,
  GymInstructor,
  GymQualityTier,
  MartialArtType
} from '../types/game';
import type { DailyBlockType, DayOfWeek, GymClassTurma } from '../types/agenda';

interface GymTierBlueprint {
  name: string;
  master: string;
  masterQual: string;
  philosophy: string;
  team: string;
  foundedYear: number;
  history: string;
  arts: MartialArtType[];
  specialties: string[];
  facilities: string[];
  capacity: number;
  weeklyCostFactor?: number;
  scholarship?: string;
  rivalryNote?: string;
  titlesCount: number;
  titlesNote: string;
  coaches?: Array<{
    name: string;
    art: MartialArtType;
    secondaryArt?: MartialArtType;
    qual: string;
    exp: number;
    tech: number;
    method: string;
  }>;
}

interface CapitalGymSeedSpec {
  social: GymTierBlueprint;
  conv?: GymTierBlueprint;
  comp: GymTierBlueprint;
  elite?: GymTierBlueprint;
  localRivalNote?: string;
  intercityRivalUf?: BrazilUF;
  intercityRivalNote?: string;
}

const ART_LABELS: Record<MartialArtType, string> = {
  jiujitsu: 'Jiu-Jitsu',
  boxe: 'Boxe',
  muaythai: 'Muay Thai',
  karate: 'Karatê Shotokan',
  judo: 'Judô',
  capoeira: 'Capoeira',
  lutalivre: 'Luta Livre Esportiva',
  mma: 'MMA'
};

function defaultQualForArt(art: MartialArtType, tier: GymQualityTier): string {
  switch (art) {
    case 'jiujitsu':
      return tier === 'elite' ? 'Faixa Preta 5º Dan CBJJ' : tier === 'competitiva' ? 'Faixa Preta 3º Dan CBJJ' : 'Faixa Preta 1º Dan CBJJ';
    case 'judo':
      return tier === 'elite' ? 'Sensei 6º Dan CBJ' : tier === 'competitiva' ? 'Sensei 4º Dan CBJ' : 'Sensei 2º Dan CBJ';
    case 'karate':
      return tier === 'elite' ? 'Sensei 5º Dan Shotokan WKF' : tier === 'competitiva' ? 'Sensei 3º Dan WKF' : 'Sensei 2º Dan Shotokan';
    case 'capoeira':
      return tier === 'elite' ? 'Mestre Sênior de Capoeira' : tier === 'competitiva' ? 'Contramestre de Capoeira' : 'Professor Formado de Capoeira';
    case 'boxe':
      return tier === 'elite' ? 'Treinador Olímpico Nível III' : tier === 'competitiva' ? 'Treinador Nível II CBB' : 'Instrutor Nível I de Boxe';
    case 'muaythai':
      return tier === 'elite' ? 'Arjan Sênior Muay Thai' : tier === 'competitiva' ? 'Kru de Muay Thai Tradicional' : 'Instrutor Kruang Preto';
    case 'lutalivre':
      return tier === 'elite' ? 'Faixa Preta 4º Dan CBLLE' : tier === 'competitiva' ? 'Faixa Preta 2º Dan CBLLE' : 'Faixa Marrom/Preta CBLLE';
    case 'mma':
      return 'Head Coach Integrado de MMA';
  }
}

/**
 * Catálogo completo e 100% original de identidades regionais nas 27 capitais brasileiras.
 * Nenhuma marca, equipe ou professor real foi utilizado.
 * Capitais polo_nacional recebem 4 níveis (incluindo elite — RJ/BA usam centros históricos da base);
 * Capitais diversificada recebem 3 níveis (social, convencional e competitiva);
 * Capitais essencial recebem 2 níveis (social e competitiva local).
 */
const CAPITAL_GYM_SPECS: Record<BrazilUF, CapitalGymSeedSpec> = {
  AC: {
    social: {
      name: 'Núcleo Tatame da Floresta',
      master: 'Mestre Raimundo Acreano',
      masterQual: 'Faixa Preta 3º Dan CBJJ / Instrutor Social',
      philosophy: 'Da beira do rio ao tatame: disciplina antes da força.',
      team: 'Raízes do Acre Base',
      foundedYear: 2011,
      history: 'Projeto comunitário criado em galpão escolar de Rio Branco para afastar jovens da ociosidade por meio do tatame.',
      arts: ['jiujitsu', 'judo'],
      specialties: ['Defesa de Quedas', 'Pegada de Quimono', 'Guarda Fechada'],
      facilities: ['Tatame Comunitário 90m²', 'Quimonos Solidários', 'Vestiário Simples'],
      capacity: 65,
      scholarship: 'Gratuidade integral com empréstimo de quimono para estudantes.',
      titlesCount: 4,
      titlesNote: '4 medalhas em copas estudantis da Amazônia Ocidental'
    },
    comp: {
      name: 'Centro Marcial Fronteira do Norte',
      master: 'Prof. Josué Bandeira',
      masterQual: 'Faixa Preta 3º Dan CBJJ / Coach Nível II',
      philosophy: 'Quem treina com calma na selva não se assusta em arena alguma.',
      team: 'Fronteira Acreana Combat',
      foundedYear: 2015,
      history: 'Principal academia federada de Rio Branco, formando atletas resistentes em torneios do Norte e Centro-Oeste.',
      arts: ['jiujitsu', 'judo', 'boxe'],
      specialties: ['Passagem de Meia-Guarda', 'Projeções de Quadril', 'Boxe de Curta Distância'],
      facilities: ['Tatame Olímpico 130m²', 'Sacos de Couro', 'Área Funcional'],
      capacity: 85,
      scholarship: 'Isenção de 25% para medalhistas estaduais do Acre.',
      titlesCount: 9,
      titlesNote: 'Bicampeã por equipes da Copa Acre de Lutas'
    },
    intercityRivalUf: 'RO',
    intercityRivalNote: 'Duelo histórico da Amazônia Ocidental contra equipes de Porto Velho.'
  },
  AL: {
    social: {
      name: 'Instituto Ginga & Luvas da Pajuçara',
      master: 'Mestre Cicinho Alagoano',
      masterQual: 'Mestre de Capoeira / Instrutor de Boxe',
      philosophy: 'O balanço do mar ensina o tempo da esquiva e da rasteira.',
      team: 'Brisa da Pajuçara Social',
      foundedYear: 2008,
      history: 'Roda comunitária de praia que ganhou teto e ringue improvisado para formar jovens boxeadores e capoeiristas.',
      arts: ['capoeira', 'boxe'],
      specialties: ['Esquivas Baianas', 'Rasteira de Contragolpe', 'Jab Dobrado'],
      facilities: ['Piso Emborrachado 80m²', 'Berimbaus e Atabaques', '3 Sacos de Pancada'],
      capacity: 60,
      scholarship: 'Aulas gratuitas para moradores e jovens em idade escolar.',
      titlesCount: 6,
      titlesNote: 'Premiada em festivais culturais de Capoeira do Nordeste'
    },
    conv: {
      name: 'Dojô Maresia Arte Suave',
      master: 'Prof. Robson Caldas',
      masterQual: 'Faixa Preta 2º Dan CBJJ',
      philosophy: 'Jiu-Jitsu técnico para quem trabalha o dia todo e ama o tatame.',
      team: 'Maresia BJJ Maceió',
      foundedYear: 2017,
      history: 'Academia especializada exclusivamente em Jiu-Jitsu com turmas noturnas organizadas e baixo risco de lesão.',
      arts: ['jiujitsu'],
      specialties: ['Raspagem de Gancho', 'Estrangulamento Cruzado', 'Defesa Pessoal'],
      facilities: ['Tatame E.V.A 40mm', 'Sala Climatizada', 'Vestiário Completo'],
      capacity: 70,
      titlesCount: 5,
      titlesNote: 'Regular no pódio de faixas coloridas em Maceió'
    },
    comp: {
      name: 'Arena Jaraguá Punho & Tatame',
      master: 'Prof. Valdemir Rocha',
      masterQual: 'Treinador Nível II de Boxe / Faixa Preta BJJ',
      philosophy: 'Mão pesada no ringue e paciência fria no solo.',
      team: 'Jaraguá Combate AL',
      foundedYear: 2013,
      history: 'Fundada próximo ao porto de Maceió, tornou-se referência alagoana na formação de pugilistas amadores e competidores de chão.',
      arts: ['boxe', 'jiujitsu', 'capoeira'],
      specialties: ['Cruzado de Encontro', 'Triângulo Fechado', 'Contragolpe Circular'],
      facilities: ['Ringue Semi-Oficial', 'Tatame 120m²', 'Manoplas e Cronômetro'],
      capacity: 95,
      scholarship: 'Bolsa parcial para convocados à seleção estadual de Boxe.',
      titlesCount: 14,
      titlesNote: 'Tricampeã do Circuito Alagoano de Boxe e Jiu-Jitsu'
    },
    intercityRivalUf: 'SE',
    intercityRivalNote: 'Clássico litorâneo do Nordeste contra clubes de Aracaju.'
  },
  AP: {
    social: {
      name: 'Centro Comunitário Marco Zero Lutas',
      master: 'Mestre Nazaré Tucuju',
      masterQual: 'Faixa Preta 2º Dan CBLLE',
      philosophy: 'Na linha do Equador, ninguém foge do próprio suor.',
      team: 'Guerreiros do Equador',
      foundedYear: 2012,
      history: 'Iniciativa comunitária às margens do Amazonas voltada ao combate agarrado sem quimono e boxe popular.',
      arts: ['lutalivre', 'boxe'],
      specialties: ['Sprawl de Base', 'Baiana Explosiva', 'Esquiva Lateral'],
      facilities: ['Lona Reforçada 85m²', 'Sacos Artesanais', 'Área Aberta'],
      capacity: 60,
      scholarship: 'Gratuito para toda a comunidade estudantil de Macapá.',
      titlesCount: 3,
      titlesNote: 'Revelou campeões juvenis do Torneio Marco Zero'
    },
    comp: {
      name: 'Academia Tucuju Submission & Boxe',
      master: 'Prof. Kleber Amazonas',
      masterQual: 'Faixa Preta 3º Dan CBLLE / Instrutor Boxe',
      philosophy: 'Pressão no clinch e transição limpa para a chave.',
      team: 'Tucuju Combate AP',
      foundedYear: 2016,
      history: 'Principal escola competitiva do Amapá, integrando lutadores de Luta Livre e Jiu-Jitsu para etapas regionais.',
      arts: ['lutalivre', 'jiujitsu', 'boxe'],
      specialties: ['Guilhotina em Pé', 'Chave de Calcanhar', 'Uppercut no Clinch'],
      facilities: ['Tatame Sem Quimono 120m²', 'Ringue de Treino', 'Estação Funcional'],
      capacity: 80,
      scholarship: 'Desconto competitivo de 25% para campeões estaduais.',
      titlesCount: 8,
      titlesNote: 'Líder do ranking estadual de Luta Livre do Amapá'
    },
    intercityRivalUf: 'PA',
    intercityRivalNote: 'Intercâmbio e rivalidade fluvial histórica com academias de Belém.'
  },
  AM: {
    social: {
      name: 'Projeto Social Tatame do Tarumã',
      master: 'Mestre Adalberto Neto',
      masterQual: 'Faixa Preta 4º Dan CBJJ',
      philosophy: 'Manaus respira tatame; aqui todo garoto aprende a nunca bater sem lutar até o fim.',
      team: 'Tarumã Base Amazonas',
      foundedYear: 2005,
      history: 'Celeiro tradicional na periferia de Manaus que já revelou diversos faixas-pretas para circuitos nacionais.',
      arts: ['jiujitsu', 'lutalivre'],
      specialties: ['Berimbolo & Raspagem', 'Armlock da Guarda', 'Defesa de Quedas'],
      facilities: ['Tatame Popular 140m²', 'Banco de Quimonos', 'Ventilação Natural'],
      capacity: 100,
      scholarship: '100% gratuito com bolsa transporte local para juvenis destacados.',
      titlesCount: 16,
      titlesNote: 'Mais de 15 títulos infantis e juvenis no Open Manaus'
    },
    conv: {
      name: 'Clube Rio Negro de Boxe & Submission',
      master: 'Prof. Edílson Barreto',
      masterQual: 'Treinador Nível II de Boxe / Faixa Preta CBLLE',
      philosophy: 'Ritmo constante para quem trabalha no polo industrial e treina à noite.',
      team: 'Rio Negro Lutas AM',
      foundedYear: 2014,
      history: 'Academia estruturada para treinos regulares e preparação recreativa-competitiva em solo e punhos.',
      arts: ['boxe', 'lutalivre'],
      specialties: ['Jab-Direto em Deslocamento', 'Double Leg Curto', 'Controle Lateral'],
      facilities: ['Ringue Fixo', 'Tatame 110m²', 'Sacos de Velocidade'],
      capacity: 85,
      titlesCount: 10,
      titlesNote: 'Destaque constante em copas interclubes de Manaus'
    },
    comp: {
      name: 'Manaus Grappling Club',
      master: 'Prof. Nonato Pantoja',
      masterQual: 'Faixa Preta 4º Dan CBJJ / CBLLE',
      philosophy: 'Pressão amazônica no quadril e transição implacável até as costas.',
      team: 'Manaus Grappling Seleção',
      foundedYear: 2009,
      history: 'Fábrica de passadores e finalizadores temida em campeonatos brasileiros e sul-americanos.',
      arts: ['jiujitsu', 'lutalivre', 'boxe'],
      specialties: ['Passagem Embocada', 'Mata-Leão das Costas', 'Queda de Cinturada'],
      facilities: ['Tatame Olímpico 220m²', 'Parede de Grade', 'Sacos Pesados'],
      capacity: 120,
      scholarship: 'Bolsa de 25% para atletas com medalhas em estaduais ou regionais.',
      rivalryNote: 'Rivalidade direta nos tatames de Manaus contra o Templo Amazônico.',
      titlesCount: 28,
      titlesNote: 'Pentacampeã amazonense de Jiu-Jitsu e Luta Livre'
    },
    elite: {
      name: 'Templo Amazônico Vale-Tudo & BJJ',
      master: 'Mestre Nazareno Solimões',
      masterQual: 'Faixa Preta 6º Dan CBJJ / Head Coach MMA',
      philosophy: 'Técnica pura de Manaus lapidada para os maiores palcos do mundo.',
      team: 'Legião Amazônica Ouro',
      foundedYear: 2001,
      history: 'Centro de alto rendimento que une a tradição centenária do grappling manauara com preparação científica para o octógono.',
      arts: ['jiujitsu', 'lutalivre', 'mma'],
      specialties: ['Finalizações Sem Quimono', 'Ground & Pound Técnico', 'Controle na Grade'],
      facilities: ['Octógono Oficial', 'Tatame de 280m²', 'Fisioterapia & Crioterapia', 'Preparação Metabólica'],
      capacity: 140,
      scholarship: 'Programa de bolsa atleta para campeões nacionais ou do circuito pro.',
      titlesCount: 41,
      titlesNote: '41 troféus entre títulos brasileiros, pan-americanos e cinturões de MMA'
    },
    localRivalNote: 'Disputa feroz entre Manaus Grappling Club e Templo Amazônico pelos títulos absolutos do Amazonas.',
    intercityRivalUf: 'PA',
    intercityRivalNote: 'Clássico histórico do Norte contra equipes tradicionais de Belém.'
  },
  BA: {
    social: {
      name: 'Projeto Roda & Ringue da Ribeira',
      master: 'Mestre Damião do Bonfim',
      masterQual: 'Mestre de Capoeira / Instrutor Nível I Boxe',
      philosophy: 'Mandinga no sangue, guarda alta e respeito ao mais velho.',
      team: 'Ribeira Base Bahia',
      foundedYear: 2004,
      history: 'Projeto na Cidade Baixa de Salvador que forma jovens no Boxe popular e na Capoeira de rua e competição.',
      arts: ['boxe', 'capoeira'],
      specialties: ['Jogo de Cintura', 'Gancho na Linha de Cintura', 'Meia-Lua de Compasso'],
      facilities: ['Ringue Comunitário', 'Tatame Roda 100m²', 'Atabaques e Saco de Areia'],
      capacity: 90,
      scholarship: 'Acesso 100% gratuito com acompanhamento escolar mensal.',
      titlesCount: 14,
      titlesNote: 'Formou dezenas de campeões baianos juvenis de Boxe'
    },
    conv: {
      name: 'Academia Pelourinho Arte Suave',
      master: 'Prof. Ícaro Sampaio',
      masterQual: 'Faixa Preta 2º Dan CBJJ',
      philosophy: 'Constância no quimono e cabeça fria em qualquer posição.',
      team: 'Pelourinho BJJ Salvador',
      foundedYear: 2016,
      history: 'Dojô tradicional dedicado exclusivamente ao Jiu-Jitsu com metodologia progressiva para iniciantes e adultos.',
      arts: ['jiujitsu'],
      specialties: ['Guarda Aberta', 'Estrangulamento de Gola', 'Raspagem Tesoura'],
      facilities: ['Tatame 120m²', 'Sinalizador Eletrônico de Luta', 'Vestiários'],
      capacity: 75,
      titlesCount: 7,
      titlesNote: 'Presença frequente nos pódios do Open Salvador'
    },
    comp: {
      name: 'Centro Baiano de Boxe Olímpico & Lutas',
      master: 'Coach Benedito Bahia',
      masterQual: 'Treinador Olímpico Nível III CBB / Coach MMA',
      philosophy: 'Velocidade de mãos, esquiva limpa e coração baiano até o último gongo.',
      team: 'Nobre Arte Salvador',
      foundedYear: 2007,
      history: 'A escola de boxe olímpico mais respeitada do Nordeste, com estrutura paralela de Jiu-Jitsu e MMA para atletas federados.',
      arts: ['boxe', 'mma', 'jiujitsu'],
      specialties: ['Contragolpe de Direto', 'Footwork Olímpico', 'Boxe para Octógono'],
      facilities: ['2 Ringues Oficiais', 'Octógono de Treino', 'Área de Vídeo & Manoplas'],
      capacity: 130,
      scholarship: 'Bolsa de 25% para atletas ranqueados no Norte-Nordeste.',
      titlesCount: 33,
      titlesNote: 'Hexacampeã baiana de Boxe Olímpico por equipes'
    },
    intercityRivalUf: 'PE',
    intercityRivalNote: 'Grande clássico nordestino entre Salvador e Recife nos ringues e tatames.'
  },
  CE: {
    social: {
      name: 'Instituto Tatame da Jangada',
      master: 'Mestre Expedito Cearense',
      masterQual: 'Faixa Preta 3º Dan CBJJ / Kru Muay Thai',
      philosophy: 'Vento forte do litoral faz atleta que não recua um passo.',
      team: 'Jangada Social Ceará',
      foundedYear: 2010,
      history: 'Instituto litorâneo em Fortaleza dedicado a dar base gratuita no Jiu-Jitsu e Muay Thai para jovens.',
      arts: ['jiujitsu', 'muaythai'],
      specialties: ['Defesa Pessoal', 'Low Kicks Básicos', 'Passagem Simples'],
      facilities: ['Tatame 110m²', 'Aparadores de Chute', 'Espaço Comunitário'],
      capacity: 85,
      scholarship: 'Gratuito com suporte comunitário para competições locais.',
      titlesCount: 11,
      titlesNote: 'Vencedora de etapas estudantis em Fortaleza'
    },
    conv: {
      name: 'Dojô Dragão do Mar Boxe & Karatê',
      master: 'Sensei Alencar Bezerra',
      masterQual: 'Sensei 3º Dan WKF / Instrutor Boxe',
      philosophy: 'Precisão de golpe e distância inteligente antes da troca franca.',
      team: 'Dragão do Mar Lutas',
      foundedYear: 2016,
      history: 'Academia convencional em Fortaleza especializada em esportes de trocação limpa e técnica de linha.',
      arts: ['karate', 'boxe'],
      specialties: ['Gyaku-Zuki de Encontro', 'Jab Veloz', 'Controle de Ma-ai'],
      facilities: ['Tatame WKF', 'Sacos de Boxe', 'Espelhos de Correção'],
      capacity: 75,
      titlesCount: 8,
      titlesNote: 'Vice-campeã cearense de Kumitê por equipes'
    },
    comp: {
      name: 'CT Fortaleza 8 Armas & BJJ',
      master: 'Kru Irapuan Freitas',
      masterQual: 'Kru Sênior Muay Thai / Faixa Preta CBJJ',
      philosophy: 'Clinch duro em pé e pressão sufocante se a luta cair.',
      team: 'Sol Poente Combate CE',
      foundedYear: 2011,
      history: 'Academia competitiva conhecida pelo ritmo alto nos aparadores e transições agressivas entre Muay Thai e Jiu-Jitsu.',
      arts: ['muaythai', 'jiujitsu', 'boxe'],
      specialties: ['Joelhada no Clinch', 'Cotovelo Giratório', 'Armlock Voador'],
      facilities: ['Ringue Oficial', 'Tatame 160m²', 'Sacos Longos de Tailândia'],
      capacity: 110,
      scholarship: 'Bolsa parcial para campeões cearenses e nordestinos.',
      titlesCount: 22,
      titlesNote: 'Tetracampeã cearense de Muay Thai amador e semi-pro'
    },
    elite: {
      name: 'Arena Dragão Kombat Alto Rendimento',
      master: 'Head Coach Guilherme Ceará',
      masterQual: 'Head Coach MMA / Arjan Muay Thai',
      philosophy: 'Volume, gás interminável e leitura cirúrgica do oponente.',
      team: 'Seleção Ceará Kombat',
      foundedYear: 2014,
      history: 'Centro de alta performance de Fortaleza equipado para lutadores nacionais e internacionais de trocação e MMA.',
      arts: ['muaythai', 'jiujitsu', 'boxe', 'mma'],
      specialties: ['Trocação de 5 Rounds', 'Sprawl Contra Grade', 'Transições MMA'],
      facilities: ['Octógono Oficial', 'Ringue Profissional', 'Fisiologia & Recuperação', 'Tatame 220m²'],
      capacity: 145,
      scholarship: 'Apoio de bolsa atleta para detentores de cinturões regionais/nacionais.',
      titlesCount: 29,
      titlesNote: '29 títulos em eventos nacionais e internacionais do Nordeste'
    },
    localRivalNote: 'Forte disputa interna em Fortaleza entre CT Fortaleza 8 Armas e Arena Dragão Kombat.',
    intercityRivalUf: 'RN',
    intercityRivalNote: 'Clássico regional do Nordeste contra equipes de MMA de Natal.'
  },
  DF: {
    social: {
      name: 'Centro Comunitário Ippon da Ceilândia',
      master: 'Sensei Antônio Brasília',
      masterQual: 'Sensei 4º Dan CBJ',
      philosophy: 'Queda limpa, saudação respeitosa e disciplina cidadã.',
      team: 'Cerrado Ippon Base',
      foundedYear: 2006,
      history: 'Projeto social referência no Distrito Federal em formação gratuita de judocas e caratecas.',
      arts: ['judo', 'karate'],
      specialties: ['Ukemi Defensivo', 'Seoi-Nage', 'Kihon Tradicional'],
      facilities: ['Tatame Olímpico 130m²', 'Quimonos Comunitários', 'Sala de Estudos'],
      capacity: 95,
      scholarship: 'Gratuito e integrado com bolsa escolar comunitária.',
      titlesCount: 15,
      titlesNote: 'Campeã brasiliense escolar de Judô por 5 temporadas'
    },
    conv: {
      name: 'Dojô Asa Norte Arte Suave',
      master: 'Prof. Otávio Alencar',
      masterQual: 'Faixa Preta 2º Dan CBJJ',
      philosophy: 'Tatame organizado e técnica sustentável para qualquer rotina.',
      team: 'Asa Norte BJJ',
      foundedYear: 2018,
      history: 'Academia convencional voltada exclusivamente ao Jiu-Jitsu esportivo com foco em longevidade e defesa pessoal.',
      arts: ['jiujitsu'],
      specialties: ['Meia-Guarda Profunda', 'Passagem Toreando', 'Defesa de Quimono'],
      facilities: ['Tatame Anti-Impacto', 'Climatização', 'Vestiários Individuais'],
      capacity: 80,
      titlesCount: 6,
      titlesNote: 'Medalhas frequentes na Copa Planalto de BJJ'
    },
    comp: {
      name: 'Academia Planalto WKF & Grappling',
      master: 'Sensei Roberto Taniguchi',
      masterQual: 'Sensei 4º Dan WKF / Faixa Preta CBJJ',
      philosophy: 'Tempo de entrada milimétrico vale mais que mil golpes no vazio.',
      team: 'Planalto Olímpico DF',
      foundedYear: 2010,
      history: 'Centro competitivo do Plano Piloto que combina Karatê de regras WKF, Judô federado e Jiu-Jitsu.',
      arts: ['karate', 'judo', 'jiujitsu'],
      specialties: ['Kumitê WKF', 'Uchi-Mata', 'Passagem de Guarda Rápida'],
      facilities: ['Tatame WKF Oficial', 'Tatame Judô 180m²', 'Sensores de Velocidade'],
      capacity: 115,
      scholarship: 'Bolsa esportiva de 25% para atletas pontuando no ranking nacional.',
      titlesCount: 24,
      titlesNote: 'Bicampeã do Brasileiro Centro-Oeste de Karatê e Judô'
    },
    elite: {
      name: 'Centro Olímpico Nacional do Planalto',
      master: 'Sensei Takeshi Morita',
      masterQual: 'Sensei 6º Dan CBJ / Técnico Seleção Olímpica',
      philosophy: 'Excelência federativa, biomecânica e calma absoluta sob pressão de pódio.',
      team: 'Vanguarda Olímpica DF',
      foundedYear: 2003,
      history: 'Complexo de alto rendimento da capital federal voltado a seleções de Judô, Karatê olímpico e Jiu-Jitsu de elite.',
      arts: ['judo', 'karate', 'jiujitsu'],
      specialties: ['Kuzushi Olímpico', 'Ippon de Alta Velocidade', 'Ne-Waza de Competição'],
      facilities: ['3 Áreas Oficiais Olímpicas', 'Centro de Biomecânica', 'Fisioterapia Completa', 'Alojamento de Seleção'],
      capacity: 150,
      scholarship: 'Bolsa desempenho para campeões brasileiros ou internacionais.',
      titlesCount: 38,
      titlesNote: '38 títulos nacionais e pan-americanos em modalidades olímpicas'
    },
    localRivalNote: 'Competição técnica acirrada em Brasília entre Academia Planalto e Centro Olímpico.',
    intercityRivalUf: 'GO',
    intercityRivalNote: 'Rivalidade tradicional do Planalto Central contra academias de Goiânia.'
  },
  ES: {
    social: {
      name: 'Projeto Tatame da Ilha',
      master: 'Mestre Gilson Capixaba',
      masterQual: 'Faixa Preta 3º Dan CBJJ',
      philosophy: 'Disciplina de tatame para segurar qualquer tempestade da vida.',
      team: 'Ilha Base ES',
      foundedYear: 2012,
      history: 'Centro comunitário de Vitória com acesso gratuito para jovens e trabalhadores no Jiu-Jitsu e Capoeira.',
      arts: ['jiujitsu', 'capoeira'],
      specialties: ['Guarda Fechada', 'Ginga & Equilíbrio', 'Defesa Pessoal'],
      facilities: ['Tatame Comunitário 95m²', 'Berimbaus', 'Vestiário Simples'],
      capacity: 70,
      scholarship: 'Gratuito com suporte comunitário para inscrições estaduais.',
      titlesCount: 7,
      titlesNote: 'Campeã por equipe juvenil no Estadual Capixaba'
    },
    conv: {
      name: 'Academia Praia do Canto Boxe & Thai',
      master: 'Prof. Marcelino Prado',
      masterQual: 'Instrutor Nível II Boxe / Kru Muay Thai',
      philosophy: 'Treino limpo, cadenciado e inteligente após o expediente.',
      team: 'Praia do Canto Striker ES',
      foundedYear: 2017,
      history: 'Academia convencional especializada na trocação em pé em Vitória, sem exigências de cartel profissional.',
      arts: ['boxe', 'muaythai'],
      specialties: ['Combinado Jab-Cruzado-Low Kick', 'Defesa de Pêndulo', 'Condicionamento'],
      facilities: ['10 Sacos Suspensos', 'Área de Manoplas', 'Tatame Liso 100m²'],
      capacity: 80,
      titlesCount: 5,
      titlesNote: 'Destaque em torneios amadores do Espírito Santo'
    },
    comp: {
      name: 'Vitória Combat & Arte Suave',
      master: 'Prof. Henrique Vitória',
      masterQual: 'Faixa Preta 4º Dan CBJJ / Coach Muay Thai',
      philosophy: 'Pressão técnica sem afobação até conquistar a finalização ou nocaute.',
      team: 'Convento Combat ES',
      foundedYear: 2011,
      history: 'Maior equipe competitiva capixaba de Jiu-Jitsu e trocação, marcando presença constante nos eventos do Sudeste.',
      arts: ['jiujitsu', 'muaythai', 'boxe'],
      specialties: ['Passagem com Joelho na Barriga', 'Clinch de Muay Thai', 'Boxe de Pressão'],
      facilities: ['Tatame Oficial 150m²', 'Ringue de Treino', 'Área de Força'],
      capacity: 110,
      scholarship: 'Bolsa parcial para medalhistas de competições regionais.',
      titlesCount: 18,
      titlesNote: 'Tetracampeã capixaba de Jiu-Jitsu por equipes'
    },
    intercityRivalUf: 'MG',
    intercityRivalNote: 'Intercâmbio competitivo frequente contra equipes de Belo Horizonte.'
  },
  GO: {
    social: {
      name: 'Projeto Luta & Disciplina do Cerrado',
      master: 'Mestre Divino Goiânia',
      masterQual: 'Faixa Preta 3º Dan CBLLE',
      philosophy: 'O chão do cerrado é duro, mas forma lutadores de caráter firme.',
      team: 'Cerrado Social GO',
      foundedYear: 2011,
      history: 'Projeto comunitário em Goiânia voltado à base gratuita de Luta Livre e Jiu-Jitsu.',
      arts: ['lutalivre', 'jiujitsu'],
      specialties: ['Queda Baiana', 'Armlock', 'Resistência Aeróbica'],
      facilities: ['Tatame Lona 100m²', 'Boneco de Arremesso', 'Espaço Funcional'],
      capacity: 75,
      scholarship: 'Gratuidade total com auxílio em taxas municipais.',
      titlesCount: 8,
      titlesNote: 'Premiada na Copa Goiânia de Base'
    },
    conv: {
      name: 'Clube Anhanguera Boxe & Jiu-Jitsu',
      master: 'Prof. Renato Goiás',
      masterQual: 'Faixa Preta 2º Dan CBJJ / Instrutor Boxe',
      philosophy: 'Treino estruturado que respeita o corpo de quem trabalha e estuda.',
      team: 'Anhanguera Lutas GO',
      foundedYear: 2016,
      history: 'Escola convencional de Goiânia que oferece turmas equilibradas de Jiu-Jitsu e Boxe.',
      arts: ['jiujitsu', 'boxe'],
      specialties: ['Guarda-Aranha', 'Esquiva e Jab', 'Controle Postural'],
      facilities: ['Tatame 110m²', '6 Sacos Pesados', 'Área de Alongamento'],
      capacity: 85,
      titlesCount: 7,
      titlesNote: 'Presença constante no circuito goiano'
    },
    comp: {
      name: 'Goiânia Octagon & Grappling',
      master: 'Coach Marcelo Peixoto',
      masterQual: 'Head Coach MMA / Faixa Preta 3º Dan CBLLE',
      philosophy: 'Ritmo alto de quedas, grade controlada e transições sem pausa.',
      team: 'Cerrado Vanguarda GO',
      foundedYear: 2012,
      history: 'Centro competitivo mais forte do Centro-Oeste em Luta Livre e MMA, exportando lutadores para grandes cards.',
      arts: ['mma', 'lutalivre', 'jiujitsu'],
      specialties: ['Wrestling de Grade', 'Chave de Braço no Solo', 'Ground & Pound'],
      facilities: ['Octógono Semi-Oficial', 'Tatame Sem Quimono 160m²', 'Sacos Pesados'],
      capacity: 115,
      scholarship: 'Desconto competitivo de 25% para atletas com histórico de vitórias oficiais.',
      titlesCount: 21,
      titlesNote: '21 troféus em copas de MMA e Submission do Centro-Oeste'
    },
    intercityRivalUf: 'DF',
    intercityRivalNote: 'Duelo regional clássico contra as equipes de Brasília.'
  },
  MA: {
    social: {
      name: 'Instituto Dojô dos Azulejos',
      master: 'Sensei Ribamar Costa',
      masterQual: 'Sensei 3º Dan Shotokan / Mestre Capoeira',
      philosophy: 'Respeito às raízes, postura firme e foco no kata e na roda.',
      team: 'Ilha Rebelde MA',
      foundedYear: 2009,
      history: 'Dojô comunitário no centro histórico de São Luís unindo Karatê e Capoeira gratuitamente.',
      arts: ['karate', 'capoeira'],
      specialties: ['Kata Heian', 'Aú & Esquiva', 'Chute Frontal Rápido'],
      facilities: ['Tatame Tradicional 95m²', 'Instrumentos de Capoeira', 'Makiwara'],
      capacity: 75,
      scholarship: 'Gratuito com bolsas escolares integradas.',
      titlesCount: 9,
      titlesNote: 'Destaque em campeonatos maranhenses escolares'
    },
    conv: {
      name: 'Clube São Luís Judô Tradicional',
      master: 'Sensei Joaquim Travassos',
      masterQual: 'Sensei 3º Dan CBJ',
      philosophy: 'O caminho suave ensina a cair mil vezes para se levantar sempre.',
      team: 'São Luís Ippon MA',
      foundedYear: 2015,
      history: 'Dojô especializado exclusivamente em Judô clássico em São Luís com foco em técnica limpa.',
      arts: ['judo'],
      specialties: ['O-Goshi', 'Osoto-Gari', 'Osaekomi (Imobilização)'],
      facilities: ['Tatame de Palha Sintética 110m²', 'Elásticos de Uchikomi', 'Vestiário'],
      capacity: 65,
      titlesCount: 6,
      titlesNote: 'Tradicional formadora de faixas pretas de Judô no Maranhão'
    },
    comp: {
      name: 'Academia Maranhense Karatê & Judô',
      master: 'Mestre Benedito Maranhão',
      masterQual: 'Sensei 4º Dan WKF / Sensei 3º Dan CBJ',
      philosophy: 'Precisão de ataque e firmeza olímpica em cada disputa.',
      team: 'Maranhão Marcial MA',
      foundedYear: 2011,
      history: 'Principal equipe competitiva do Maranhão nos circuitos federados de Karatê, Judô e Capoeira.',
      arts: ['karate', 'judo', 'capoeira'],
      specialties: ['Mawashi-Geri Pontuado', 'Ippon-Seoi-Nage', 'Rasteira Rápida'],
      facilities: ['Tatame Olímpico WKF/CBJ 150m²', 'Cronômetros Eletrônicos', 'Força Funcional'],
      capacity: 100,
      scholarship: 'Bolsa de 25% para medalhistas do Norte-Nordeste.',
      titlesCount: 17,
      titlesNote: 'Tricampeã maranhense interclubes de Karatê e Judô'
    },
    intercityRivalUf: 'PI',
    intercityRivalNote: 'Rivalidade regional Meio-Norte contra clubes de Teresina.'
  },
  MT: {
    social: {
      name: 'Projeto Guerreiros do Pantanal',
      master: 'Mestre Sebastião Cuiabá',
      masterQual: 'Faixa Preta 3º Dan CBJJ',
      philosophy: 'Sob o sol forte de Cuiabá, quem treina sério endurece o espírito.',
      team: 'Pantanal Social MT',
      foundedYear: 2012,
      history: 'Academia comunitária gratuita em Cuiabá dedicada ao Jiu-Jitsu e Boxe para trabalhadores e jovens.',
      arts: ['jiujitsu', 'boxe'],
      specialties: ['Guarda Baiana', 'Sequência 1-2-Cruzado', 'Pressão de Quadril'],
      facilities: ['Tatame 100m²', '4 Sacos de Lona', 'Espaço Ventilado'],
      capacity: 75,
      scholarship: 'Mensalidade zerada e isenção em graduações comunitárias.',
      titlesCount: 6,
      titlesNote: 'Medalhas frequentes na Copa Cuiabá Aberta'
    },
    conv: {
      name: 'Centro Cuiabá Muay Thai Tradicional',
      master: 'Kru Wellington Araguaia',
      masterQual: 'Kru Muay Thai Nível II',
      philosophy: 'Oito armas afiadas, respiração calma e canela calejada.',
      team: 'Araguaia Thai MT',
      foundedYear: 2017,
      history: 'Academia convencional especializada exclusivamente em Muay Thai técnico e condicionamento físico.',
      arts: ['muaythai'],
      specialties: ['Teep Frontal', 'Chute Circular na Costela', 'Clinch Básico'],
      facilities: ['Ringue de Treino', '8 Sacos Pesados', 'Aparadores Tailandeses'],
      capacity: 70,
      titlesCount: 5,
      titlesNote: 'Revelou campeões estaduais de Muay Thai em Cuiabá'
    },
    comp: {
      name: 'Cuiabá Fight Club & BJJ',
      master: 'Prof. Danilo Araguaia',
      masterQual: 'Faixa Preta 3º Dan CBJJ / Coach MMA',
      philosophy: 'Pressão implacável em pé e domínio completo no chão.',
      team: 'Pantanal Kombat MT',
      foundedYear: 2013,
      history: 'Principal centro competitivo do Mato Grosso para atletas que miram eventos nacionais de Jiu-Jitsu, Muay Thai e MMA.',
      arts: ['jiujitsu', 'muaythai', 'mma'],
      specialties: ['Passagem de Pressão', 'Chutes Baixos Pesados', 'Transição Queda-Montada'],
      facilities: ['Tatame 150m²', 'Octógono de Treino', 'Sacos Longos & Peso Livre'],
      capacity: 105,
      scholarship: 'Bolsa parcial para detentores de títulos do Centro-Oeste.',
      titlesCount: 15,
      titlesNote: 'Bicampeã mato-grossense de MMA amador e Jiu-Jitsu'
    },
    intercityRivalUf: 'MS',
    intercityRivalNote: 'Clássico pantaneiro tradicional contra equipes de Campo Grande.'
  },
  MS: {
    social: {
      name: 'Centro Comunitário Judô da Fronteira',
      master: 'Sensei Kiyoshi Campo Grande',
      masterQual: 'Sensei 4º Dan CBJ',
      philosophy: 'Equilíbrio no corpo e cortesia na vitória e na derrota.',
      team: 'Fronteira Ippon MS',
      foundedYear: 2007,
      history: 'Dojô tradicional em Campo Grande voltado ao ensino gratuito do Judô e Karatê para jovens.',
      arts: ['judo', 'karate'],
      specialties: ['De-Ashi-Barai', 'Morote-Seoi-Nage', 'Defesa de Pegada'],
      facilities: ['Tatame 120m²', 'Área de Uchikomi', 'Quimonos Solidários'],
      capacity: 85,
      scholarship: '100% gratuito com apoio de federação escolar.',
      titlesCount: 12,
      titlesNote: 'Forte tradição em jogos escolares do Centro-Oeste'
    },
    conv: {
      name: 'Clube Guavira Luta Livre & Solo',
      master: 'Prof. Mauro Pantanal',
      masterQual: 'Faixa Preta 2º Dan CBLLE',
      philosophy: 'Sem quimono, o detalhe da alavanca define quem manda no centro do tatame.',
      team: 'Guavira No-Gi MS',
      foundedYear: 2018,
      history: 'Academia convencional especializada em Luta Livre Esportiva para praticantes regulares de Campo Grande.',
      arts: ['lutalivre'],
      specialties: ['Cinturada Lateral', 'Triângulo de Mão', 'Leg-Lock Controlado'],
      facilities: ['Tatame Sem Quimono 95m²', 'Boneco de Treino', 'Área Funcional'],
      capacity: 65,
      titlesCount: 4,
      titlesNote: 'Participação ativa em torneios No-Gi do MS'
    },
    comp: {
      name: 'Campo Grande Grappling & WKF',
      master: 'Prof. Rodrigo Nogueira MS',
      masterQual: 'Sensei 4º Dan CBJ / Faixa Preta CBLLE',
      philosophy: 'Arremesso decisivo e transição instantânea para finalizar.',
      team: 'Guaicurus Combate MS',
      foundedYear: 2010,
      history: 'Maior potência competitiva do Mato Grosso do Sul em Judô, Luta Livre e Karatê WKF.',
      arts: ['judo', 'lutalivre', 'karate'],
      specialties: ['Kuzushi de Competição', 'Quedas de Potência', 'Kumitê Tático'],
      facilities: ['Tatame Olímpico 170m²', 'Área WKF', 'Monitoramento de Quedas'],
      capacity: 110,
      scholarship: 'Bolsa de 25% para atletas campeões estaduais.',
      titlesCount: 20,
      titlesNote: 'Pentacampeã sul-mato-grossense de Judô e Luta Livre'
    },
    intercityRivalUf: 'MT',
    intercityRivalNote: 'Rivalidade pantaneira contra os centros de Cuiabá.'
  },
  MG: {
    social: {
      name: 'Projeto Social Tatame da Pampulha',
      master: 'Mestre Geraldo Gerais',
      masterQual: 'Faixa Preta 4º Dan CBJJ / Instrutor Boxe',
      philosophy: 'Nas montanhas de Minas se aprende a trabalhar duro em silêncio e vencer na hora certa.',
      team: 'Pampulha Base MG',
      foundedYear: 2006,
      history: 'Núcleo comunitário em Belo Horizonte que oferece treinamento gratuito em Jiu-Jitsu e Boxe.',
      arts: ['jiujitsu', 'boxe'],
      specialties: ['Defesa de Quedas', 'Guarda Fechada', 'Jab & Movimentação'],
      facilities: ['Tatame 120m²', '5 Sacos de Boxe', 'Vestiário Comunitário'],
      capacity: 95,
      scholarship: 'Gratuidade total com apoio a atletas estudantis.',
      titlesCount: 14,
      titlesNote: 'Revelou inúmeros campeões mineiros nas categorias de base'
    },
    conv: {
      name: 'Dojô Savassi Shotokan & Judô',
      master: 'Sensei Flávio Guimarães',
      masterQual: 'Sensei 4º Dan Shotokan / 2º Dan CBJ',
      philosophy: 'Técnica limpa, ética marcial e evolução sustentável.',
      team: 'Savassi Budo MG',
      foundedYear: 2015,
      history: 'Dojô convencional bem estruturado em BH para quem busca formação séria em artes tradicionais japonesas.',
      arts: ['karate', 'judo'],
      specialties: ['Kime em Linha', 'Rasteira Ashi-Waza', 'Kata Avançado'],
      facilities: ['Tatame Japonês 130m²', 'Makiwara Tradicional', 'Sala de Vídeo'],
      capacity: 80,
      titlesCount: 10,
      titlesNote: 'Tradicional presença nos pódios mineiros de Karatê e Judô'
    },
    comp: {
      name: 'BH Fight Club & Arte Suave',
      master: 'Prof. Túlio Alvarenga',
      masterQual: 'Faixa Preta 4º Dan CBJJ / Coach Muay Thai',
      philosophy: 'Pressão contínua de guarda e combinações duras de média distância.',
      team: 'Minas Gerais Top Club',
      foundedYear: 2009,
      history: 'Tradicional celeiro de campeões brasileiros e pan-americanos de Jiu-Jitsu e trocação de Belo Horizonte.',
      arts: ['jiujitsu', 'muaythai', 'boxe'],
      specialties: ['Passagem de Meia-Guarda', 'Combo Jab-Low Kick', 'Armlock de Transição'],
      facilities: ['Tatame Olímpico 200m²', 'Ringue Fixo', 'Área de Condicionamento'],
      capacity: 130,
      scholarship: 'Desconto de 25% para medalhistas estaduais e nacionais.',
      titlesCount: 31,
      titlesNote: 'Hexacampeã mineira de Jiu-Jitsu por equipes'
    },
    elite: {
      name: 'Escola Mineira 8 Armas & BJJ Matriz',
      master: 'Kru Márcio Minas',
      masterQual: 'Arjan Muay Thai / Faixa Preta 5º Dan CBJJ',
      philosophy: 'Caminhamos para frente o combate inteiro, com técnica afiada e fôlego sem fim.',
      team: 'Inconfidência Combate MG',
      foundedYear: 2004,
      history: 'Famosa escola mineira de trocação agressiva e grappling integrado, reconhecida nacionalmente no MMA e Muay Thai.',
      arts: ['muaythai', 'jiujitsu', 'mma'],
      specialties: ['Muay Thai de Pressão', 'Clinch com Cotoveladas', 'Finalizações de Octógono'],
      facilities: ['Octógono Oficial', 'Ringue Profissional', 'Fisioterapia & Nutrição', 'Tatame 240m²'],
      capacity: 155,
      scholarship: 'Bolsa alto rendimento de 30% para campeões nacionais/pro.',
      titlesCount: 44,
      titlesNote: '44 conquistas entre mundiais de BJJ, Muay Thai e eventos de MMA'
    },
    localRivalNote: 'Clássico belo-horizontino entre BH Fight Club e Escola Mineira Matriz.',
    intercityRivalUf: 'PR',
    intercityRivalNote: 'Grande rivalidade nacional na escola de Muay Thai agressivo contra Curitiba.'
  },
  PA: {
    social: {
      name: 'Projeto Conde Koma Comunitário',
      master: 'Mestre Juca Paraense',
      masterQual: 'Faixa Preta 4º Dan CBJJ',
      philosophy: 'Belém guardou o berço da arte suave; aqui ensinamos com humildade e raça.',
      team: 'Conde Koma Base PA',
      foundedYear: 2007,
      history: 'Projeto no bairro do Guamá que mantém viva a herança histórica do Jiu-Jitsu em Belém para a juventude.',
      arts: ['jiujitsu', 'lutalivre'],
      specialties: ['Alavancas Básicas', 'Raspagem de Gancho', 'Defesa Pessoal'],
      facilities: ['Tatame 115m²', 'Quimonos Solidários', 'Vestiário'],
      capacity: 85,
      scholarship: '100% gratuito com apoio de projetos culturais de Belém.',
      titlesCount: 11,
      titlesNote: 'Tradição no Campeonato Paraense de Base'
    },
    conv: {
      name: 'Clube Ver-o-Peso Boxe & Capoeira',
      master: 'Prof. Sandoval Belém',
      masterQual: 'Treinador Nível II Boxe / Contramestre Capoeira',
      philosophy: 'Ginga solta e punho reto — a rua e o ringue conversam na cadência.',
      team: 'Ver-o-Peso Combate PA',
      foundedYear: 2016,
      history: 'Academia convencional que reúne praticantes trabalhadores de Boxe e Capoeira com foco em ritmo e condicionamento.',
      arts: ['boxe', 'capoeira'],
      specialties: ['Movimentação de Ringue', 'Ginga & Queixada', 'Gancho no Corpo'],
      facilities: ['Ringue de Treino', 'Sacos Pesados', 'Roda de Madeira'],
      capacity: 75,
      titlesCount: 6,
      titlesNote: 'Destaques no Torneio Paraense de Boxe Popular'
    },
    comp: {
      name: 'Academia Belém Raiz & Luta Livre',
      master: 'Prof. Murilo Amazônia',
      masterQual: 'Faixa Preta 4º Dan CBLLE / 3º Dan CBJJ',
      philosophy: 'Sem quimono ou com kimono, quem controla o pescoço e o quadril vence.',
      team: 'Grão-Pará Grappling PA',
      foundedYear: 2010,
      history: 'Potência amazônica da Luta Livre e Jiu-Jitsu, mantendo intercâmbio intenso e rivalidade com equipes de Manaus.',
      arts: ['jiujitsu', 'lutalivre', 'boxe'],
      specialties: ['Leg-Locks Tradicionais', 'Passagem com Pressão', 'Clinch Sujo de Boxe'],
      facilities: ['Tatame Olímpico 160m²', 'Ringue Semi-Oficial', 'Preparação de Força'],
      capacity: 110,
      scholarship: 'Bolsa de 25% para medalhistas em copas do Norte.',
      titlesCount: 23,
      titlesNote: 'Pentacampeã paraense de Jiu-Jitsu e Luta Livre'
    },
    intercityRivalUf: 'AM',
    intercityRivalNote: 'Clássico histórico do Norte entre Belém e Manaus nos tatames de grappling.'
  },
  PB: {
    social: {
      name: 'Projeto Nascente Marcial',
      master: 'Mestre Severino Paraíba',
      masterQual: 'Faixa Preta 3º Dan CBJJ',
      philosophy: 'Onde o sol nasce primeiro no Brasil, o treino começa antes da preguiça.',
      team: 'Sol Nascente Social PB',
      foundedYear: 2011,
      history: 'Centro comunitário de João Pessoa voltado a jovens no Jiu-Jitsu e Capoeira sem custos.',
      arts: ['jiujitsu', 'capoeira'],
      specialties: ['Postura na Guarda', 'Raspagem Simples', 'Esquivas de Capoeira'],
      facilities: ['Tatame 95m²', 'Instrumentos Musicais', 'Quimonos Solidários'],
      capacity: 75,
      scholarship: 'Gratuito com suporte comunitário para viagens estaduais.',
      titlesCount: 8,
      titlesNote: 'Campeã juvenil da Copa João Pessoa'
    },
    conv: {
      name: 'Dojô Manaíra Karatê Clube',
      master: 'Sensei Kléber Nóbrega',
      masterQual: 'Sensei 4º Dan Shotokan',
      philosophy: 'Um golpe decisivo vale por dez golpes atirados ao vento.',
      team: 'Manaíra Shotokan PB',
      foundedYear: 2015,
      history: 'Dojô tradicional dedicado exclusivamente ao Karatê Shotokan em João Pessoa, respeitando etiqueta e graduações.',
      arts: ['karate'],
      specialties: ['Kihon Avançado', 'Kata Tekki & Bassai', 'Kumitê de Precisão'],
      facilities: ['Tatame Japonês 100m²', 'Makiwara', 'Espelhos de Postura'],
      capacity: 65,
      titlesCount: 9,
      titlesNote: 'Referência técnica no Karatê paraibano'
    },
    comp: {
      name: 'Tambaú Fight & Karatê Clube',
      master: 'Sensei Fábio Lins',
      masterQual: 'Sensei 4º Dan WKF / Faixa Preta CBJJ',
      philosophy: 'Agilidade em pé e alavanca afiada se a luta encostar.',
      team: 'Paraíba Combate PB',
      foundedYear: 2012,
      history: 'Principal equipe competitiva de João Pessoa unindo Karatê WKF, Boxe veloz e Jiu-Jitsu.',
      arts: ['jiujitsu', 'karate', 'boxe'],
      specialties: ['Contra-Ataque Veloz', 'Chave de Braço Justa', 'Jogo de Pernas'],
      facilities: ['Tatame 140m²', 'Área de Boxe com Sacos', 'Força Funcional'],
      capacity: 100,
      scholarship: 'Bolsa parcial de 25% para campeões estaduais da Paraíba.',
      titlesCount: 16,
      titlesNote: 'Tricampeã paraibana interclubes'
    },
    intercityRivalUf: 'PE',
    intercityRivalNote: 'Disputa constante no Nordeste Oriental contra academias de Recife.'
  },
  PR: {
    social: {
      name: 'Instituto Pinheiro Lutas Sociais',
      master: 'Mestre Cícero Paraná',
      masterQual: 'Faixa Preta 3º Dan CBJJ / Instrutor Muay Thai',
      philosophy: 'Frio de Curitiba esquenta rápido quando o tatame ferve com respeito.',
      team: 'Pinheiro Base PR',
      foundedYear: 2008,
      history: 'Instituto comunitário em Curitiba com formação gratuita de base no Jiu-Jitsu e Muay Thai.',
      arts: ['jiujitsu', 'muaythai'],
      specialties: ['Raspagem de Base', 'Chute Frontal (Teep)', 'Defesa de Quedas'],
      facilities: ['Tatame 120m²', '6 Sacos Pesados', 'Aquecedores'],
      capacity: 90,
      scholarship: 'Gratuito com suporte comunitário de equipamentos.',
      titlesCount: 13,
      titlesNote: 'Celebrada formadora juvenil de Curitiba'
    },
    conv: {
      name: 'Academia Batel Boxe & Judô',
      master: 'Prof. Ernesto Kowalski',
      masterQual: 'Treinador Nível II Boxe / Sensei 3º Dan CBJ',
      philosophy: 'Base firme no solo e guarda fechada no ringue — constância sem excesso.',
      team: 'Batel Combate PR',
      foundedYear: 2016,
      history: 'Academia convencional elegante em Curitiba para trabalhadores e estudantes focados em Boxe clássico e Judô.',
      arts: ['boxe', 'judo'],
      specialties: ['Pêndulo Clássico', 'Harai-Goshi', 'Jab de Controle'],
      facilities: ['Ringue Fixo', 'Tatame Judô 115m²', 'Sacos de Couro'],
      capacity: 85,
      titlesCount: 8,
      titlesNote: 'Participação regular em torneios metropolitanos do Paraná'
    },
    comp: {
      name: 'Curitiba Thai & Vale-Tudo Academy',
      master: 'Kru Robson Bastos',
      masterQual: 'Kru Sênior Muay Thai / Faixa Preta CBLLE',
      philosophy: 'Não esperamos o ritmo do adversário — impomos o nosso do primeiro segundo ao último.',
      team: 'Curitiba Striker PR',
      foundedYear: 2005,
      history: 'Tradicional escola paranaense de trocação intensa e preparação de Luta Livre/MMA com sparrings cronometrados.',
      arts: ['muaythai', 'mma', 'lutalivre'],
      specialties: ['Sequência Joelho-Cotovelo', 'Low Kick Demolidor', 'Defesa de Grade'],
      facilities: ['Ringue Oficial', 'Octógono de Treino', 'Tatame 180m²', 'Aparadores Pesados'],
      capacity: 125,
      scholarship: 'Bolsa de 25% para atletas com vitórias em campeonatos paranaenses/sulinos.',
      titlesCount: 29,
      titlesNote: 'Hexacampeã paranaense de Muay Thai e Luta Livre'
    },
    elite: {
      name: 'Templo Paranaense Chute & Octógono',
      master: 'Mestre Valdir Paraná',
      masterQual: 'Arjan Muay Thai / Head Coach MMA',
      philosophy: 'Agressividade técnica, queixo testado no ferro e coração de campeão.',
      team: 'Araucária Combate PR',
      foundedYear: 1998,
      history: 'Lendário templo curitibano da escola agressiva de Muay Thai e MMA brasileiro, com décadas de títulos nacionais e mundiais.',
      arts: ['muaythai', 'mma', 'jiujitsu'],
      specialties: ['Trocação Agressiva de Chute Alto', 'Clinch Mortal no Muay Thai', 'Transição Knockdown-Finalização'],
      facilities: ['Octógono Oficial', '2 Ringues Oficiais', 'Tatame Olímpico 250m²', 'Centro Médico & Recuperação'],
      capacity: 160,
      scholarship: 'Bolsa de alto rendimento para campeões nacionais ou profissionais.',
      titlesCount: 52,
      titlesNote: '52 títulos históricos entre campeonatos nacionais e cinturões de MMA'
    },
    localRivalNote: 'Rivalidade feroz nos ringues de Curitiba entre Curitiba Thai Academy e Templo Paranaense.',
    intercityRivalUf: 'MG',
    intercityRivalNote: 'Clássico nacional do Muay Thai agressivo: Curitiba vs Belo Horizonte.'
  },
  PE: {
    social: {
      name: 'Projeto Roda & Tatame do Recife Antigo',
      master: 'Mestre Chicão Capibaribe',
      masterQual: 'Mestre de Capoeira / Sensei 2º Dan CBJ',
      philosophy: 'Ponte firme, corpo solto e coragem na roda e no tatame.',
      team: 'Capibaribe Social PE',
      foundedYear: 2008,
      history: 'Projeto social recifense que alia Capoeira tradicional e Judô escolar gratuitamente.',
      arts: ['capoeira', 'judo'],
      specialties: ['Ginga Veloz', 'Queda de Quadril', 'Rasteira Baixa'],
      facilities: ['Tatame 110m²', 'Espaço de Roda', 'Vestiário Comunitário'],
      capacity: 85,
      scholarship: 'Gratuidade integral com suporte alimentar comunitário.',
      titlesCount: 12,
      titlesNote: 'Forte base em jogos escolares pernambucanos'
    },
    conv: {
      name: 'Academia Boa Viagem Jiu-Jitsu & Boxe',
      master: 'Prof. Caio Cavalcanti',
      masterQual: 'Faixa Preta 2º Dan CBJJ / Instrutor Boxe',
      philosophy: 'Técnica limpa à beira-mar para construir saúde e confiança.',
      team: 'Boa Viagem Combate PE',
      foundedYear: 2017,
      history: 'Academia convencional bem estruturada na zona sul do Recife, combinando Jiu-Jitsu técnico e Boxe recreativo.',
      arts: ['jiujitsu', 'boxe'],
      specialties: ['Guarda De La Riva', 'Jab-Cruzado', 'Defesa Pessoal'],
      facilities: ['Tatame 110m²', '5 Sacos de Boxe', 'Ambiente Climatizado'],
      capacity: 80,
      titlesCount: 7,
      titlesNote: 'Pódios frequentes em etapas do Open Recife'
    },
    comp: {
      name: 'Recife Ippon & Jiu-Jitsu Clube',
      master: 'Sensei Eduardo Recife',
      masterQual: 'Sensei 4º Dan CBJ / Faixa Preta 3º Dan CBJJ',
      philosophy: 'Quem domina a gola e o quadril escolhe onde a luta acontece.',
      team: 'Leão do Norte Combate PE',
      foundedYear: 2010,
      history: 'Clube competitivo tradicional de Pernambuco especializado em lutas de quimono com forte base olímpica.',
      arts: ['judo', 'jiujitsu'],
      specialties: ['Uchi-Mata & Seoi', 'Passagem Toreando', 'Estrangulamento de Gola'],
      facilities: ['Tatame Olímpico 180m²', 'Sensores de Tempo', 'Área de Força'],
      capacity: 115,
      scholarship: 'Bolsa de 25% para campeões pernambucanos.',
      titlesCount: 25,
      titlesNote: 'Tetracampeã pernambucana de Judô e Jiu-Jitsu'
    },
    elite: {
      name: 'Centro Pernambucano Olímpico de Lutas',
      master: 'Mestre Severino Olímpico',
      masterQual: 'Sensei 6º Dan CBJ / Mestre Sênior Capoeira',
      philosophy: 'Formação olímpica completa unindo tradição nordestina e ciência do esporte.',
      team: 'Pernambuco Vanguarda PE',
      foundedYear: 2002,
      history: 'Principal centro de alta performance do Nordeste para Judô olímpico, Jiu-Jitsu de elite e Capoeira de alto rendimento.',
      arts: ['judo', 'jiujitsu', 'capoeira'],
      specialties: ['Ippon de Seleção', 'Ne-Waza de Competição', 'Acrobacia & Contragolpe'],
      facilities: ['3 Tatames Oficiais', 'Laboratório de Fisiologia', 'Fisioterapia Desportiva', 'Sala Tática'],
      capacity: 145,
      scholarship: 'Bolsa atleta regional para campeões nacionais ou convocados.',
      titlesCount: 36,
      titlesNote: '36 títulos entre Brasileiros de Judô, BJJ e festivais nacionais'
    },
    localRivalNote: 'Disputa acirrada em Recife entre Recife Ippon Clube e Centro Pernambucano Olímpico.',
    intercityRivalUf: 'BA',
    intercityRivalNote: 'Clássico histórico do Nordeste contra clubes tradicionais de Salvador.'
  },
  PI: {
    social: {
      name: 'Projeto Poty de Lutas Amadoras',
      master: 'Sensei Manoel Piauí',
      masterQual: 'Sensei 3º Dan CBJ / Instrutor Boxe',
      philosophy: 'Mesmo com chão simples, quem tem disciplina conquista qualquer tatame.',
      team: 'Poty Base PI',
      foundedYear: 2013,
      history: 'Projeto comunitário em Teresina que garante acesso gratuito ao Judô e Boxe para estudantes.',
      arts: ['judo', 'boxe'],
      specialties: ['Rolamento & Base', 'O-Goshi', 'Guarda Fechada no Boxe'],
      facilities: ['Tatame 85m²', '3 Sacos de Pancada', 'Quimonos Solidários'],
      capacity: 60,
      scholarship: '100% gratuito para jovens e trabalhadores de Teresina.',
      titlesCount: 5,
      titlesNote: 'Premiada em jogos estudantis do Piauí'
    },
    comp: {
      name: 'Teresina Judô & Karatê Clube',
      master: 'Prof. Francisca Mendes',
      masterQual: 'Sensei 4º Dan WKF / 3º Dan CBJ',
      philosophy: 'Precisão, postura ereta e respeito rigoroso às regras olímpicas.',
      team: 'Piauí Marcial PI',
      foundedYear: 2014,
      history: 'Clube mais tradicional de Teresina em esportes olímpicos e tradicionais, com ensino técnico estruturado e mensalidade acessível.',
      arts: ['judo', 'karate', 'boxe'],
      specialties: ['Kumitê WKF', 'Ippon-Seoi', 'Boxe Técnico de Longa Distância'],
      facilities: ['Tatame 125m²', 'Aparadores', 'Área de Aquecimento'],
      capacity: 85,
      scholarship: 'Desconto de 25% para campeões piauienses.',
      titlesCount: 11,
      titlesNote: 'Tricampeã piauiense interclubes'
    },
    intercityRivalUf: 'MA',
    intercityRivalNote: 'Clássico regional do Meio-Norte contra equipes de São Luís.'
  },
  RJ: {
    social: {
      name: 'Projeto Tatame da Lapa & Subúrbio',
      master: 'Mestre Zé Carioca',
      masterQual: 'Faixa Preta 4º Dan CBJJ / CBLLE',
      philosophy: 'Do subúrbio pro mundo: quem sabe cair e raspar nunca fica refém do tamanho.',
      team: 'Subúrbio Raiz RJ',
      foundedYear: 2001,
      history: 'Clássico projeto comunitário carioca que formou gerações no Jiu-Jitsu e na Luta Livre sem cobrar mensalidade.',
      arts: ['jiujitsu', 'lutalivre', 'boxe'],
      specialties: ['Guarda Fechada', 'Queda Baiana', 'Boxe de Rua Técnico'],
      facilities: ['Tatame 130m²', '4 Sacos de Couro', 'Quimonos Comunitários'],
      capacity: 110,
      scholarship: 'Gratuidade integral mantida por ex-alunos e rede comunitária.',
      titlesCount: 19,
      titlesNote: 'Celeiro histórico de campeões estaduais do Rio'
    },
    conv: {
      name: 'Clube Tijuca Boxe & Capoeira',
      master: 'Prof. Renato Guanabara',
      masterQual: 'Treinador Nível II Boxe / Contramestre Capoeira',
      philosophy: 'Cadência carioca, esquiva rápida e condicionamento inteligente.',
      team: 'Tijuca Lutas RJ',
      foundedYear: 2015,
      history: 'Academia convencional tradicional na Zona Norte do Rio para praticantes regulares de Boxe e Capoeira.',
      arts: ['boxe', 'capoeira'],
      specialties: ['Jogo de Cintura Carioca', 'Jab-Direto em Ritmo', 'Meia-Lua & Esquiva'],
      facilities: ['Ringue Fixo', 'Piso de Madeira & E.V.A', 'Espelhos'],
      capacity: 85,
      titlesCount: 8,
      titlesNote: 'Destaque em torneios metropolitanos do Rio de Janeiro'
    },
    comp: {
      name: 'Copacabana Luta Livre & Vale-Tudo',
      master: 'Mestre Oswaldo Leme',
      masterQual: 'Faixa Preta 5º Dan CBLLE / Coach MMA',
      philosophy: 'Sem quimono, sem desculpa: pegada justa, queda forte e chave de pé letal.',
      team: 'Luta Livre Guanabara RJ',
      foundedYear: 1996,
      history: 'Templo competitivo da Luta Livre Esportiva carioca na Zona Sul, mantendo viva a rivalidade clássica com o Jiu-Jitsu de quimono.',
      arts: ['lutalivre', 'mma', 'muaythai'],
      specialties: ['Leg-Locks Sem Quimono', 'Guilhotina & Katagatame', 'Vale-Tudo Clássico'],
      facilities: ['Tatame Sem Quimono 190m²', 'Ringue/Octógono de Treino', 'Sacos Pesados'],
      capacity: 130,
      scholarship: 'Bolsa de 25% para campeões estaduais e brasileiros de Luta Livre.',
      rivalryNote: 'Rivalidade secular carioca contra o Templo Carioca da Arte Suave.',
      titlesCount: 37,
      titlesNote: 'Heptacampeã carioca e brasileira de Luta Livre Esportiva'
    },
    localRivalNote: 'Maior rivalidade do Brasil: Jiu-Jitsu do Templo Carioca vs Luta Livre de Copacabana.',
    intercityRivalUf: 'SP',
    intercityRivalNote: 'Clássico interestadual Rio x São Paulo nos tatames e octógonos.'
  },
  RN: {
    social: {
      name: 'Projeto Tatame das Dunas',
      master: 'Mestre Potiguar Júnior',
      masterQual: 'Faixa Preta 3º Dan CBJJ',
      philosophy: 'Areia fofa dá perna forte e humildade para subir qualquer pódio.',
      team: 'Dunas Base RN',
      foundedYear: 2011,
      history: 'Núcleo comunitário em Natal com acesso gratuito ao Jiu-Jitsu e Muay Thai para jovens do litoral.',
      arts: ['jiujitsu', 'muaythai'],
      specialties: ['Raspagens Rápidas', 'Chutes Circulares', 'Gás Aeróbico'],
      facilities: ['Tatame 100m²', 'Área Funcional na Areia', 'Aparadores'],
      capacity: 80,
      scholarship: 'Gratuito com suporte comunitário para etapas locais.',
      titlesCount: 9,
      titlesNote: 'Premiada em copas potiguares juvenis'
    },
    conv: {
      name: 'Clube Ponta Negra Jiu-Jitsu Puro',
      master: 'Prof. Henrique Dantas',
      masterQual: 'Faixa Preta 3º Dan CBJJ',
      philosophy: 'Alavanca limpa e estudo posicional sem pressa.',
      team: 'Ponta Negra BJJ RN',
      foundedYear: 2016,
      history: 'Academia convencional dedicada exclusivamente ao Jiu-Jitsu com turmas organizadas manhã e noite.',
      arts: ['jiujitsu'],
      specialties: ['Guarda Laço', 'Passagem Emborcada', 'Estrangulamento Relógio'],
      facilities: ['Tatame 110m²', 'Sala Climatizada', 'Vestiários'],
      capacity: 75,
      titlesCount: 7,
      titlesNote: 'Regular nos pódios estaduais do Rio Grande do Norte'
    },
    comp: {
      name: 'Natal Fúria Potiguar Combat',
      master: 'Coach Jonas Potiguar',
      masterQual: 'Head Coach MMA / Faixa Preta CBJJ',
      philosophy: 'Mão precisa, defensa de queda afiada e leitura fria em 3 rounds.',
      team: 'Potiguar MMA Team RN',
      foundedYear: 2010,
      history: 'Potência competitiva nordestina especializada em MMA profissional, Muay Thai e Jiu-Jitsu integrado.',
      arts: ['mma', 'jiujitsu', 'muaythai'],
      specialties: ['Contra-Ataque no Octógono', 'Defesa de Quedas', 'Finalizações em Transição'],
      facilities: ['Octógono Oficial', 'Tatame 160m²', 'Área de Sparring & Fisioterapia'],
      capacity: 115,
      scholarship: 'Bolsa de 25% para campeões estaduais ou do Nordeste.',
      titlesCount: 24,
      titlesNote: '24 troféus e cinturões no circuito Norte-Nordeste de MMA e BJJ'
    },
    intercityRivalUf: 'CE',
    intercityRivalNote: 'Clássico potiguar-cearense contra os CTs de Fortaleza.'
  },
  RS: {
    social: {
      name: 'Projeto Comunitário Guaíba Tatame',
      master: 'Sensei Valdir Gaúcho',
      masterQual: 'Sensei 4º Dan CBJ',
      philosophy: 'Respeito ao quimono e força coletiva para enfrentar qualquer inverno.',
      team: 'Guaíba Social RS',
      foundedYear: 2007,
      history: 'Projeto social às margens do Guaíba oferecendo Judô e Jiu-Jitsu gratuitamente para a comunidade de Porto Alegre.',
      arts: ['judo', 'jiujitsu'],
      specialties: ['Rolamentos', 'Osoto-Gari', 'Guarda Fechada'],
      facilities: ['Tatame 125m²', 'Quimonos Solidários', 'Vestiário'],
      capacity: 90,
      scholarship: '100% gratuito com apoio em torneios gaúchos.',
      titlesCount: 14,
      titlesNote: 'Revelou medalhistas juvenis no Rio Grande do Sul'
    },
    conv: {
      name: 'Academia Moinhos Boxe Clássico',
      master: 'Prof. Augusto Fagundes',
      masterQual: 'Treinador Nível II Boxe',
      philosophy: 'Postura elegante, jab preciso e distância controlada.',
      team: 'Moinhos Boxing RS',
      foundedYear: 2016,
      history: 'Clube convencional de Porto Alegre especializado exclusivamente em Boxe técnico e condicionamento de ringue.',
      arts: ['boxe'],
      specialties: ['Jab-Cruzado Clássico', 'Esquiva Pendular', 'Trabalho de Saco'],
      facilities: ['Ringue Fixo', '12 Sacos de Couro', 'Espelhos & Cronômetro'],
      capacity: 75,
      titlesCount: 6,
      titlesNote: 'Destaques frequentes na Copa Porto Alegre de Boxe'
    },
    comp: {
      name: 'Porto Alegre Muay Thai & BJJ',
      master: 'Prof. Luciano Pampa',
      masterQual: 'Kru Muay Thai / Faixa Preta 3º Dan CBJJ',
      philosophy: 'Chute firme, pegada dura e disciplina tática no Sul.',
      team: 'Pampa Combate RS',
      foundedYear: 2011,
      history: 'Academia competitiva gaúcha de referência em Muay Thai e Jiu-Jitsu, revelando atletas constantes no circuito sul-brasileiro.',
      arts: ['muaythai', 'jiujitsu', 'boxe'],
      specialties: ['Chutes Altos e Médios', 'Passagem de Pressão', 'Boxe de Curta Distância'],
      facilities: ['Ringue Oficial', 'Tatame 170m²', 'Aparadores Tailandeses'],
      capacity: 115,
      scholarship: 'Bolsa de 25% para medalhistas do Campeonato Gaúcho.',
      titlesCount: 22,
      titlesNote: 'Tetracampeã gaúcha de Muay Thai e Jiu-Jitsu'
    },
    elite: {
      name: 'Clube Olímpico Gaúcho de Judô & Lutas',
      master: 'Sensei Kiko Porto Alegre',
      masterQual: 'Sensei 6º Dan CBJ / Técnico Olímpico',
      philosophy: 'Tradição centenária de dojô sulino aliada à ciência olímpica do combate.',
      team: 'Clube Guaíba Olímpico RS',
      foundedYear: 1995,
      history: 'Tradicional clube poliesportivo olímpico do Rio Grande do Sul, reconhecido pela excelência técnica em Judô, Jiu-Jitsu e Muay Thai.',
      arts: ['judo', 'jiujitsu', 'muaythai'],
      specialties: ['Kuzushi Olímpico', 'Ne-Waza de Competição', 'Clinch e Projeções'],
      facilities: ['3 Tatames Olímpicos', 'Ringue Fixo', 'Centro de Preparação Física & Fisioterapia'],
      capacity: 165,
      scholarship: 'Bolsa desempenho olímpico/nacional para campeões brasileiros.',
      titlesCount: 46,
      titlesNote: '46 conquistas nacionais e sul-americanas em clubes olímpicos'
    },
    localRivalNote: 'Disputa tradicional em Porto Alegre entre Porto Alegre Muay Thai & BJJ e Clube Olímpico Gaúcho.',
    intercityRivalUf: 'PR',
    intercityRivalNote: 'Clássico do Sul entre Porto Alegre e Curitiba.'
  },
  RO: {
    social: {
      name: 'Projeto Madeira-Mamoré Lutas',
      master: 'Mestre Tonho Rondônia',
      masterQual: 'Faixa Preta 2º Dan CBJJ / Instrutor Boxe',
      philosophy: 'Com garra na ponta do trilho, todo obstáculo vira combustível.',
      team: 'Madeira Base RO',
      foundedYear: 2013,
      history: 'Projeto social em Porto Velho que promove gratuitamente Jiu-Jitsu e Boxe para jovens locais.',
      arts: ['jiujitsu', 'boxe'],
      specialties: ['Defesa Pessoal', 'Jab Reto', 'Guarda Fechada'],
      facilities: ['Tatame 90m²', '3 Sacos Pesados', 'Vestiário Simples'],
      capacity: 65,
      scholarship: 'Gratuito com empréstimo de material básico.',
      titlesCount: 5,
      titlesNote: 'Destaque na Copa Porto Velho Estudantil'
    },
    comp: {
      name: 'Porto Velho Cage & Boxe',
      master: 'Prof. Anderson Guaporé',
      masterQual: 'Treinador Boxe Nível II / Faixa Preta CBJJ',
      philosophy: 'Firmeza nas trocas em pé e preparo físico para segurar três rounds fortes.',
      team: 'Rondônia Combat RO',
      foundedYear: 2015,
      history: 'Principal centro competitivo de Porto Velho voltado ao Boxe, Jiu-Jitsu e preparação inicial de MMA regional.',
      arts: ['boxe', 'jiujitsu', 'mma'],
      specialties: ['Direto Pesado', 'Sprawl de Grade', 'Passagem Simples'],
      facilities: ['Grade de Treino', 'Ringue Semi-Oficial', 'Tatame 125m²'],
      capacity: 85,
      scholarship: 'Bolsa parcial para campeões estaduais de Rondônia.',
      titlesCount: 10,
      titlesNote: 'Bicampeã rondoniense de lutas combinadas'
    },
    intercityRivalUf: 'AC',
    intercityRivalNote: 'Clássico da Amazônia Ocidental contra equipes de Rio Branco.'
  },
  RR: {
    social: {
      name: 'Centro Social Monte Roraima Lutas',
      master: 'Mestre Macuxi Pedro',
      masterQual: 'Faixa Preta 2º Dan CBLLE',
      philosophy: 'Raiz firme como a serra, mente leve para aprender todo dia.',
      team: 'Monte Roraima Base',
      foundedYear: 2014,
      history: 'Espaço comunitário gratuito em Boa Vista focado em Luta Livre e Karatê para jovens.',
      arts: ['lutalivre', 'karate'],
      specialties: ['Pegada de Cintura', 'Chute Frontal', 'Condicionamento'],
      facilities: ['Tatame 85m²', 'Aparadores', 'Área Coberta'],
      capacity: 60,
      scholarship: '100% gratuito com apoio escolar local.',
      titlesCount: 4,
      titlesNote: 'Revelou jovens talentos nos jogos de Roraima'
    },
    comp: {
      name: 'Boa Vista Submission & Karatê',
      master: 'Prof. Thiago Branco',
      masterQual: 'Faixa Preta 3º Dan CBLLE / Sensei 2º Dan WKF',
      philosophy: 'Precisão na distância em pé e controle absoluto quando a luta vai ao chão.',
      team: 'Roraima Vanguarda RR',
      foundedYear: 2016,
      history: 'Academia competitiva de referência em Boa Vista com intercâmbio constante no extremo norte.',
      arts: ['lutalivre', 'jiujitsu', 'karate'],
      specialties: ['Queda Baiana', 'Kumitê Rápido', 'Chave de Braço'],
      facilities: ['Tatame 120m²', 'Espelhos de Postura', 'Estação Funcional'],
      capacity: 80,
      scholarship: 'Desconto de 25% para atletas premiados em torneios do Norte.',
      titlesCount: 9,
      titlesNote: 'Campeã estadual de Luta Livre e Karatê em Boa Vista'
    },
    intercityRivalUf: 'AM',
    intercityRivalNote: 'Confronto frequente do extremo norte contra equipes de Manaus.'
  },
  SC: {
    social: {
      name: 'Projeto Tatame da Ponte',
      master: 'Mestre Manézinho Silva',
      masterQual: 'Faixa Preta 3º Dan CBJJ',
      philosophy: 'O mar ensina respeito; o tatame ensina a nunca subestimar ninguém.',
      team: 'Ilha Social SC',
      foundedYear: 2009,
      history: 'Projeto social tradicional em Florianópolis voltado a jovens da ilha no Jiu-Jitsu e Capoeira.',
      arts: ['jiujitsu', 'capoeira'],
      specialties: ['Guarda Aberta', 'Rasteira e Ginga', 'Defesa Pessoal'],
      facilities: ['Tatame 110m²', 'Roda de Capoeira', 'Vestiário'],
      capacity: 85,
      scholarship: 'Gratuito com suporte comunitário para eventos catarinenses.',
      titlesCount: 11,
      titlesNote: 'Vencedora em etapas estaduais infantis e juvenis de SC'
    },
    conv: {
      name: 'Dojô Lagoa Karatê & Muay Thai',
      master: 'Sensei Bruno Koerich',
      masterQual: 'Sensei 3º Dan Shotokan / Kru Muay Thai',
      philosophy: 'Foco na respiração e precisão técnica sem perder a alegria de treinar.',
      team: 'Lagoa Lutas SC',
      foundedYear: 2017,
      history: 'Academia convencional na Ilha de Santa Catarina especializada em trocação técnica para adultos e jovens.',
      arts: ['karate', 'muaythai'],
      specialties: ['Chutes Altos Técnicos', 'Kime', 'Aparadores de Precisão'],
      facilities: ['Tatame 115m²', '8 Sacos Pesados', 'Sala Arejada'],
      capacity: 80,
      titlesCount: 7,
      titlesNote: 'Destaque constante em copas abertas da Grande Florianópolis'
    },
    comp: {
      name: 'Floripa Fight & Surf Jiu-Jitsu',
      master: 'Prof. Tavares Ilha',
      masterQual: 'Faixa Preta 4º Dan CBJJ / Kru Muay Thai',
      philosophy: 'Fluidez na guarda e ritmo alto de trocação até o apito final.',
      team: 'Ilha Combate SC',
      foundedYear: 2011,
      history: 'Equipe competitiva catarinense famosa pelo estilo técnico e fluido no Jiu-Jitsu e Muay Thai.',
      arts: ['jiujitsu', 'muaythai', 'boxe'],
      specialties: ['Guarda Berimbolo', 'Combo Low Kick & Cruzado', 'Raspagem de Gancho'],
      facilities: ['Tatame 175m²', 'Ringue de Treino', 'Área Funcional'],
      capacity: 120,
      scholarship: 'Bolsa parcial de 25% para medalhistas catarinenses.',
      titlesCount: 24,
      titlesNote: 'Pentacampeã catarinense de Jiu-Jitsu'
    },
    elite: {
      name: 'Ilha High Performance MMA & BJJ Camp',
      master: 'Head Coach Lucas Medeiros',
      masterQual: 'Head Coach MMA / Faixa Preta 5º Dan CBJJ',
      philosophy: 'Ciência esportiva, sparring tático e preparação de alto nível na ilha.',
      team: 'Magia Elite Camp SC',
      foundedYear: 2014,
      history: 'Centro de alta performance em Florianópolis procurado por atletas profissionais em preparação para lutas nacionais e internacionais.',
      arts: ['jiujitsu', 'muaythai', 'mma'],
      specialties: ['Estratégia de 5 Rounds', 'Transições Grade-Chão', 'Sparring Monitorado'],
      facilities: ['Octógono Oficial', 'Tatame Olímpico 220m²', 'Câmara de Recuperação & Fisioterapia'],
      capacity: 135,
      scholarship: 'Bolsa de alto rendimento para campeões nacionais ou cartel pro sólido.',
      titlesCount: 31,
      titlesNote: '31 troféus em circuitos nacionais de MMA e Jiu-Jitsu'
    },
    localRivalNote: 'Competição intensa em Florianópolis entre Floripa Fight & Surf e Ilha High Performance.',
    intercityRivalUf: 'RS',
    intercityRivalNote: 'Rivalidade sulina contra equipes de Porto Alegre.'
  },
  SP: {
    social: {
      name: 'Projeto Social Tatame da Zona Leste',
      master: 'Mestre Geraldo Paulistano',
      masterQual: 'Faixa Preta 4º Dan CBJJ / Instrutor Boxe',
      philosophy: 'Na maior metrópole do país, o tatame é porto seguro e escola de caráter.',
      team: 'Paulistano Social SP',
      foundedYear: 2002,
      history: 'Referência comunitária da Zona Leste de São Paulo, oferecendo Jiu-Jitsu, Boxe e Capoeira gratuitos a centenas de jovens.',
      arts: ['jiujitsu', 'boxe', 'capoeira'],
      specialties: ['Fundamentos de Solo', 'Boxe Popular', 'Ginga Comunitária'],
      facilities: ['Tatame 160m²', '6 Sacos Pesados', 'Banco de Quimonos'],
      capacity: 130,
      scholarship: 'Gratuidade total com apoio comunitário para inscrições estaduais.',
      titlesCount: 21,
      titlesNote: 'Maior campeã social de categorias infantis e juvenis em SP'
    },
    conv: {
      name: 'Dojô Vila Mariana Budo & Boxe',
      master: 'Sensei Roberto Tanabi',
      masterQual: 'Sensei 4º Dan Shotokan / Treinador Nível II Boxe',
      philosophy: 'Rotina organizada, técnica limpa e proteção articular para vida inteira.',
      team: 'Vila Mariana Budo SP',
      foundedYear: 2014,
      history: 'Academia convencional paulistana focada em Karatê Shotokan e Boxe técnico com horários flexíveis para profissionais.',
      arts: ['karate', 'boxe'],
      specialties: ['Kumitê WKF', 'Boxe de Distância', 'Controle Respiratório'],
      facilities: ['Tatame Japonês 130m²', 'Ringue de Manopla', 'Vestiários Premium'],
      capacity: 95,
      titlesCount: 11,
      titlesNote: 'Constante nos pódios paulistas amadores de Karatê e Boxe'
    },
    comp: {
      name: 'Academia Paulista de Boxe & Jiu-Jitsu',
      master: 'Coach Leandro Paulista',
      masterQual: 'Treinador Nível III CBB / Faixa Preta 4º Dan CBJJ',
      philosophy: 'Volume técnico, estratégia fria e mentalidade preparada para chaves gigantes.',
      team: 'Metrópole Combate SP',
      foundedYear: 2006,
      history: 'Grande academia competitiva da capital paulista, acostumada a disputar os maiores estaduais do continente em Boxe, BJJ e Muay Thai.',
      arts: ['jiujitsu', 'boxe', 'muaythai'],
      specialties: ['Passagem de Pressão Paulista', 'Pêndulo & Contragolpe', 'Clinch Tático'],
      facilities: ['2 Ringues Oficiais', 'Tatame Olímpico 240m²', 'Sala de Análise em Vídeo'],
      capacity: 155,
      scholarship: 'Bolsa de 25% para medalhistas do Campeonato Paulista.',
      titlesCount: 42,
      titlesNote: 'Octacampeã paulista interclubes de Jiu-Jitsu e Boxe'
    },
    elite: {
      name: 'Centro Olímpico Ibirapuera Combat',
      master: 'Sensei Hiroshi Nakamura',
      masterQual: 'Sensei 7º Dan CBJ / Head Coach Integrado',
      philosophy: 'Cada detalhe biomecânico importa quando o título mundial é decidido por um segundo.',
      team: 'São Paulo Vanguarda Olímpica',
      foundedYear: 1999,
      history: 'Maior complexo multidisciplinar de alto rendimento de São Paulo, reunindo medalhistas olímpicos de Judô, faixas-pretas mundiais de BJJ e atletas de MMA.',
      arts: ['jiujitsu', 'judo', 'boxe', 'mma'],
      specialties: ['Judô Olímpico de Alta Rotação', 'BJJ de Campeonato Mundial', 'MMA Científico'],
      facilities: ['Octógono Oficial', 'Ringue Profissional', '2 Tatames Olímpicos', 'Laboratório Biomecânico & Crioterapia'],
      capacity: 210,
      scholarship: 'Bolsa atleta de alto rendimento para campeões nacionais ou mundiais.',
      titlesCount: 64,
      titlesNote: '64 conquistas entre mundiais, pan-americanos, brasileiros e cinturões pro'
    },
    localRivalNote: 'Duelo de gigantes em São Paulo entre Metrópole Combate e Centro Olímpico Ibirapuera.',
    intercityRivalUf: 'RJ',
    intercityRivalNote: 'A maior rivalidade estadual do país: São Paulo vs Rio de Janeiro.'
  },
  SE: {
    social: {
      name: 'Projeto Sergipe Marcial',
      master: 'Sensei Aracaju Lima',
      masterQual: 'Sensei 3º Dan WKF / 2º Dan CBJ',
      philosophy: 'Disciplina tranquila no tatame forma cidadãos firmes fora dele.',
      team: 'Atalaia Base SE',
      foundedYear: 2012,
      history: 'Centro social de Aracaju dedicado à iniciação gratuita em Karatê e Judô.',
      arts: ['karate', 'judo'],
      specialties: ['Kata Básico', 'Ukemi & Quedas', 'Etiqueta Marcial'],
      facilities: ['Tatame 95m²', 'Makiwara', 'Quimonos Solidários'],
      capacity: 70,
      scholarship: 'Gratuito com bolsas escolares locais.',
      titlesCount: 7,
      titlesNote: 'Formadora tradicional de campeões escolares sergipanos'
    },
    conv: {
      name: 'Clube Orla Capoeira & Boxe',
      master: 'Prof. Valter Sergipe',
      masterQual: 'Contramestre Capoeira / Instrutor Boxe',
      philosophy: 'Ritmo leve nos pés e mãos rápidas na linha de guarda.',
      team: 'Orla Lutas SE',
      foundedYear: 2018,
      history: 'Academia convencional na orla de Aracaju voltada ao treino regular de Capoeira e Boxe.',
      arts: ['capoeira', 'boxe'],
      specialties: ['Roda Regional', 'Jab-Cruzado', 'Mobilidade Dinâmica'],
      facilities: ['Piso Amortece-Impacto', '4 Sacos de Boxe', 'Instrumentos'],
      capacity: 65,
      titlesCount: 4,
      titlesNote: 'Participação ativa em festivais regionais de Sergipe'
    },
    comp: {
      name: 'Aracaju Karatê & Submission Club',
      master: 'Prof. Mateus Sergipano',
      masterQual: 'Sensei 4º Dan WKF / Faixa Preta 3º Dan CBJJ',
      philosophy: 'Velocidade de entrada e controle justo até o fim da luta.',
      team: 'Sergipe Combate SE',
      foundedYear: 2013,
      history: 'Principal equipe competitiva de Aracaju em Karatê WKF, Judô e Jiu-Jitsu.',
      arts: ['karate', 'judo', 'jiujitsu'],
      specialties: ['Kumitê WKF', 'Passagem Rápida', 'Imobilização no Solo'],
      facilities: ['Tatame Oficial 135m²', 'Sensores WKF', 'Área de Força'],
      capacity: 95,
      scholarship: 'Bolsa de 25% para medalhistas estaduais de Sergipe.',
      titlesCount: 14,
      titlesNote: 'Tricampeã sergipana por equipes'
    },
    intercityRivalUf: 'AL',
    intercityRivalNote: 'Clássico costeiro nordestino contra equipes de Maceió.'
  },
  TO: {
    social: {
      name: 'Projeto Palmas Tatame Jovem',
      master: 'Mestre Jalapão Souza',
      masterQual: 'Sensei 3º Dan WKF / Faixa Preta CBJJ',
      philosophy: 'Capital jovem merece juventude forte, disciplinada e sem atalhos.',
      team: 'Jalapão Base TO',
      foundedYear: 2014,
      history: 'Projeto comunitário de Palmas que oferece gratuitamente Karatê e Jiu-Jitsu.',
      arts: ['karate', 'jiujitsu'],
      specialties: ['Postura Shotokan', 'Guarda Fechada', 'Condicionamento'],
      facilities: ['Tatame 95m²', 'Aparadores Básicos', 'Quimonos Solidários'],
      capacity: 70,
      scholarship: 'Gratuito com suporte comunitário para competições locais.',
      titlesCount: 6,
      titlesNote: 'Campeã tocantinense estudantil em duas edições'
    },
    comp: {
      name: 'Palmas Fight & Karatê Center',
      master: 'Prof. Beatriz Tocantins',
      masterQual: 'Sensei 4º Dan WKF / Treinadora Boxe Nível II',
      philosophy: 'Planejamento, distância limpa e coragem para crescer no cenário nacional.',
      team: 'Tocantins Marcial TO',
      foundedYear: 2016,
      history: 'Centro competitivo mais bem estruturado do Tocantins, unindo Karatê, Jiu-Jitsu e Boxe.',
      arts: ['karate', 'jiujitsu', 'boxe'],
      specialties: ['Kumitê Tático', 'Chave de Braço', 'Boxe de Longa Distância'],
      facilities: ['Tatame 130m²', '5 Sacos Pesados', 'Área de Preparação Física'],
      capacity: 90,
      scholarship: 'Bolsa de 25% para campeões estaduais do Tocantins.',
      titlesCount: 12,
      titlesNote: 'Tricampeã tocantinense interclubes'
    },
    intercityRivalUf: 'GO',
    intercityRivalNote: 'Intercâmbio competitivo frequente com academias de Goiânia.'
  }
};

function dedupeArts(arts: MartialArtType[]): MartialArtType[] {
  return Array.from(new Set(arts));
}

function buildInstructorsForGym(
  gymId: string,
  tier: GymQualityTier,
  bp: GymTierBlueprint,
  devIdx: number
): GymInstructor[] {
  const instructors: GymInstructor[] = [];
  const headArt = bp.arts[0];
  const baseTech =
    tier === 'elite'
      ? Math.min(94, 82 + Math.round((devIdx - 70) * 0.35))
      : tier === 'competitiva'
      ? Math.min(86, 72 + Math.round((devIdx - 50) * 0.25))
      : tier === 'convencional'
      ? Math.min(78, 65 + Math.round((devIdx - 50) * 0.2))
      : Math.min(72, 60 + Math.round((devIdx - 50) * 0.18));

  const devRate =
    tier === 'elite'
      ? 1.1
      : tier === 'competitiva'
      ? 1.06
      : tier === 'convencional'
      ? 1.02
      : 0.99;

  // Head coach / Mestre principal
  instructors.push({
    id: `inst_${gymId}_head`,
    name: bp.master,
    role: 'head_coach',
    specialtyArt: headArt,
    secondaryArt: bp.arts[1],
    qualification: bp.masterQual,
    experienceYears: tier === 'elite' ? 24 : tier === 'competitiva' ? 16 : 12,
    technicalQuality: baseTech,
    methodology: bp.philosophy,
    reputation: tier === 'elite' ? 88 : tier === 'competitiva' ? 72 : tier === 'convencional' ? 58 : 62,
    athleteDevelopmentRate: devRate
  });

  // Professores auxiliares coerentes para garantir cobertura de todas as modalidades do catálogo
  const extraCoachNames = [
    'Prof. Lucas Tavares',
    'Prof. Camila Duarte',
    'Prof. Renato Bastos',
    'Prof. Beatriz Nogueira',
    'Prof. Diego Peixoto',
    'Prof. Larissa Almeida',
    'Prof. Bruno Cardoso',
    'Prof. Helena Moraes'
  ];

  let hashSeed = 0;
  for (let i = 0; i < gymId.length; i++) hashSeed += gymId.charCodeAt(i);

  bp.arts.forEach((art, idx) => {
    const alreadyCovered = instructors.some(
      (inst) => inst.specialtyArt === art || (inst.secondaryArt === art && bp.arts.length <= 2)
    );
    if (!alreadyCovered) {
      const pickName = extraCoachNames[(hashSeed + idx * 3) % extraCoachNames.length];
      instructors.push({
        id: `inst_${gymId}_${art}`,
        name: pickName,
        role: art === 'mma' ? 'head_coach' : 'titular',
        specialtyArt: art,
        qualification: defaultQualForArt(art, tier),
        experienceYears: tier === 'elite' ? 14 : tier === 'competitiva' ? 10 : 7,
        technicalQuality: Math.max(58, baseTech - 4),
        methodology: `Treino estruturado e progressivo específico de ${ART_LABELS[art]}.`,
        reputation: tier === 'elite' ? 74 : tier === 'competitiva' ? 61 : 48,
        athleteDevelopmentRate: Math.max(0.97, Math.round((devRate - 0.02) * 100) / 100)
      });
    }
  });

  return instructors;
}

function buildGymFromBlueprint(
  state: BrazilStateInfo,
  tier: GymQualityTier,
  bp: GymTierBlueprint,
  suffix: 'social' | 'conv' | 'comp' | 'elite',
  rivalryIds: string[],
  rivalryNote?: string
): Gym {
  const ufLower = state.uf.toLowerCase();
  const id = `gym_cap_${ufLower}_${suffix}`;
  const tuitionMult = state.economy.gymTuitionMultiplier;
  const devIdx = state.sport.sportDevelopmentIndex;
  const arts = dedupeArts(bp.arts);

  let weeklyCost = 0;
  let minFightIq = 0;
  let minRank = 0;
  let reputationReq = 0;
  let learningSpeedMultiplier = 1.0;
  let infrastructureLevel: GymInfrastructureLevel = 'basica';
  let competitiveProfile: GymCompetitiveProfile = 'recreativo';
  let statMultipliers: Gym['statMultipliers'] = { stamina: 1.08, durability: 1.08 };
  let specialPerk = 'Formação Social Gratuita (Sem mensalidade · Base comunitária)';

  if (tier === 'social') {
    const socialSpeed = Math.round((0.96 + (devIdx - 50) * 0.002) * 100) / 100;
    learningSpeedMultiplier = Math.max(0.95, Math.min(1.05, socialSpeed));
    infrastructureLevel = 'basica';
    competitiveProfile = 'misto';
  } else if (tier === 'convencional') {
    weeklyCost = Math.round((bp.weeklyCostFactor || 31) * tuitionMult); // ~R$ 25..40/sem
    minFightIq = 0;
    minRank = 0;
    reputationReq = 0;
    const convSpeed = Math.round((1.06 + (devIdx - 50) * 0.0018) * 100) / 100;
    learningSpeedMultiplier = Math.max(1.05, Math.min(1.15, convSpeed));
    infrastructureLevel = 'convencional';
    competitiveProfile = 'recreativo';
    statMultipliers = { technique: 1.1, mentalFocus: 1.08, flexibility: 1.06 };
    specialPerk = `Rotina Sustentável (-2% risco no sparring · +${Math.round((learningSpeedMultiplier - 1) * 100)}% evolução)`;
  } else if (tier === 'competitiva') {
    weeklyCost = Math.round((bp.weeklyCostFactor || 58) * tuitionMult); // ~R$ 46..75/sem
    minFightIq = 10;
    minRank = 0;
    reputationReq = 12;
    const compSpeed = Math.round((1.16 + (devIdx - 50) * 0.0036) * 100) / 100;
    learningSpeedMultiplier = Math.max(1.16, Math.min(1.34, compSpeed));
    infrastructureLevel = devIdx >= 78 ? 'avancada' : 'convencional';
    competitiveProfile = 'competitivo';
    statMultipliers = { technique: 1.18, fightIq: 1.14, stamina: 1.12 };
    specialPerk = `Escola Competitiva ${state.uf} (+${Math.round((learningSpeedMultiplier - 1) * 100)}% ritmo tático)`;
  } else if (tier === 'elite') {
    weeklyCost = Math.round((bp.weeklyCostFactor || 108) * tuitionMult); // ~R$ 100..140/sem
    minFightIq = 20;
    minRank = 1;
    reputationReq = 35;
    const eliteSpeed = Math.round((1.36 + (devIdx - 75) * 0.005) * 100) / 100;
    learningSpeedMultiplier = Math.max(1.36, Math.min(1.48, eliteSpeed));
    infrastructureLevel = devIdx >= 90 ? 'olimpica' : 'alto_rendimento';
    competitiveProfile = 'alto_rendimento';
    statMultipliers = { technique: 1.3, fightIq: 1.24, speed: 1.18, strength: 1.16 };
    specialPerk = `Alto Rendimento ${state.uf} (+${Math.round((learningSpeedMultiplier - 1) * 100)}% precisão & preparação de pódio)`;
  }

  const instructors = buildInstructorsForGym(id, tier, bp, devIdx);

  return {
    id,
    name: bp.name,
    country: 'Brasil',
    uf: state.uf,
    city: state.capital,
    flag: state.flagEmoji,
    teamName: bp.team,
    qualityTier: tier,
    foundedYear: bp.foundedYear,
    history: bp.history,
    infrastructureLevel,
    infrastructureNote: `${bp.facilities.slice(0, 2).join(' · ')} em ${state.capital} (${state.uf}).`,
    competitiveProfile,
    studentCapacity: bp.capacity,
    technicalSpecialties: bp.specialties,
    facilities: bp.facilities,
    scholarshipSupport: bp.scholarship,
    instructors,
    rivalryGymIds: rivalryIds,
    rivalryNote,
    teamTitlesCount: bp.titlesCount,
    teamTitlesNote: bp.titlesNote,
    focusArts: arts,
    weeklyCost,
    travelCost: 0,
    minFightIq,
    minRank,
    reputationReq,
    description: bp.history,
    masterName: bp.master,
    masterPhilosophy: bp.philosophy,
    statMultipliers,
    specialPerk,
    learningSpeedMultiplier,
    isUnlocked: tier !== 'elite'
  };
}

function buildGymsForCapital(state: BrazilStateInfo): Gym[] {
  const spec = CAPITAL_GYM_SPECS[state.uf];
  const ufLower = state.uf.toLowerCase();
  const intercityCompId = spec.intercityRivalUf
    ? `gym_cap_${spec.intercityRivalUf.toLowerCase()}_comp`
    : undefined;

  const localEliteId =
    state.uf === 'RJ'
      ? 'gym_gracie_rio'
      : state.uf === 'BA'
      ? 'gym_terreiro_salvador'
      : spec.elite
      ? `gym_cap_${ufLower}_elite`
      : undefined;

  const compRivals: string[] = [];
  if (localEliteId) compRivals.push(localEliteId);
  if (intercityCompId) compRivals.push(intercityCompId);

  const result: Gym[] = [
    buildGymFromBlueprint(
      state,
      'social',
      spec.social,
      'social',
      [`gym_cap_${ufLower}_comp`],
      `Formação popular em ${state.capital} que desafia academias particulares nos torneios de base.`
    )
  ];

  if (spec.conv) {
    result.push(
      buildGymFromBlueprint(
        state,
        'convencional',
        spec.conv,
        'conv',
        [`gym_cap_${ufLower}_comp`],
        `Alternativa sustentável em ${state.capital} com foco em evolução segura.`
      )
    );
  }

  result.push(
    buildGymFromBlueprint(
      state,
      'competitiva',
      spec.comp,
      'comp',
      compRivals,
      spec.localRivalNote || spec.intercityRivalNote
    )
  );

  if (spec.elite) {
    const eliteRivals = [`gym_cap_${ufLower}_comp`];
    if (intercityCompId) eliteRivals.push(intercityCompId);
    result.push(
      buildGymFromBlueprint(
        state,
        'elite',
        spec.elite,
        'elite',
        eliteRivals,
        spec.localRivalNote || spec.intercityRivalNote
      )
    );
  }

  return result;
}

/**
 * Catálogo completo de academias regionais vinculadas às 27 capitais do Brasil.
 */
export const REGIONAL_BRAZIL_GYMS: Gym[] = BRAZIL_STATES.flatMap(buildGymsForCapital);

/**
 * Retorna os IDs das academias de uma UF em ordem de nível.
 */
export function getRegionalGymIdsByUf(uf: BrazilUF): {
  socialId: string;
  convId?: string;
  compId: string;
  eliteId?: string;
} {
  const ufLower = uf.toLowerCase();
  const socialId = `gym_cap_${ufLower}_social`;
  const convId = CAPITAL_GYM_SPECS[uf].conv ? `gym_cap_${ufLower}_conv` : undefined;
  const compId = `gym_cap_${ufLower}_comp`;
  let eliteId: string | undefined;

  if (uf === 'RJ') eliteId = 'gym_gracie_rio';
  else if (uf === 'BA') eliteId = 'gym_terreiro_salvador';
  else if (CAPITAL_GYM_SPECS[uf].elite) eliteId = `gym_cap_${ufLower}_elite`;

  return { socialId, convId, compId, eliteId };
}

/**
 * Gera turmas presenciais autênticas para todas as academias das 27 capitais
 * reutilizando exatamente o contrato GymClassTurma da Agenda Semanal,
 * respeitando estritamente focusArts e associando o professor daquela arte.
 */
export function buildRegionalGymTurmas(): GymClassTurma[] {
  const turmas: GymClassTurma[] = [];

  const regularSchedules: Array<{ days: DayOfWeek[]; block: DailyBlockType }> = [
    { days: ['segunda', 'quarta', 'sexta'], block: 'noite' },
    { days: ['terca', 'quinta'], block: 'manha' },
    { days: ['segunda', 'quarta'], block: 'tarde' },
    { days: ['terca', 'quinta'], block: 'noite' },
    { days: ['sabado'], block: 'manha' }
  ];

  for (const gym of REGIONAL_BRAZIL_GYMS) {
    const isSocial = gym.qualityTier === 'social';
    const isConv = gym.qualityTier === 'convencional';
    const isElite = gym.qualityTier === 'elite';

    gym.focusArts.forEach((art, idx) => {
      const sched = regularSchedules[idx % regularSchedules.length];
      const useExtended = !isSocial && !isConv && idx === 0;
      const pointsCost = useExtended ? 2 : 1;

      const matchingInst =
        gym.instructors?.find((i) => i.specialtyArt === art) ||
        gym.instructors?.find((i) => i.secondaryArt === art) ||
        gym.instructors?.[0];

      turmas.push({
        id: `turma_${gym.id}_${art}`,
        gymId: gym.id,
        gymName: gym.name,
        art,
        instructorName: matchingInst?.name || gym.masterName,
        title: `${ART_LABELS[art]}: ${
          isSocial
            ? 'Formação Social & Fundamentos'
            : isConv
            ? 'Técnica Regular & Condicionamento'
            : isElite
            ? 'Alto Rendimento & Sparring Tático'
            : 'Turma Competitiva Regional'
        }`,
        description: `${
          isSocial
            ? 'Aula comunitária gratuita para construir base técnica e condicionamento em'
            : isConv
            ? 'Turma convencional estruturada com foco em consistência técnica e segurança em'
            : isElite
            ? 'Treinamento intensivo de competição com equipe principal em'
            : 'Treino estruturado de preparação técnica e competitiva em'
        } ${gym.city} (${gym.uf}).`,
        daysOfWeek: sched.days,
        block: sched.block,
        pointsCost,
        classType: useExtended ? 'estendida' : 'regular',
        status: 'aberta',
        prerequisites: {
          minRank: gym.minRank,
          minFightIq: gym.minFightIq,
          reputationReq: gym.reputationReq
        }
      });
    });
  }

  return turmas;
}
