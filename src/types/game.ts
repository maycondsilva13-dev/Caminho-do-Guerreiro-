export type MartialArtType = 
  | 'boxe' 
  | 'jiujitsu' 
  | 'muaythai' 
  | 'karate' 
  | 'judo' 
  | 'capoeira' 
  | 'lutalivre' 
  | 'mma';

export type AgeCategory = 'infantil' | 'juvenil' | 'adulto' | 'master';

export type OfficialGiColor = 'branco' | 'azul' | 'preto';

export interface TournamentDivisionSelection {
  weightDivisionId?: string;
  weightClassLabel?: string;
  minWeightKg?: number;
  maxWeightKg?: number | null;
  ageDivisionId?: string;
  ageDivisionLabel?: string;
  rankDivisionId?: string;
  rankDivisionLabel?: string;
  gender?: 'M' | 'F';
  giColor?: OfficialGiColor | string;
}

export type WealthTier = 'humilde' | 'classe_media' | 'abastado' | 'milionario';

export type GameDifficulty = 'facil' | 'moderado' | 'normal' | 'dificil';

export type ArtTalentLevel = 'comum' | 'apto' | 'talentoso' | 'prodigio' | 'genio';

export type BrazilUF =
  | 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO'
  | 'MA' | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR' | 'PE' | 'PI'
  | 'RJ' | 'RN' | 'RS' | 'RO' | 'RR' | 'SC' | 'SP' | 'SE' | 'TO';

export type BrazilRegion = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export type RegionalInfrastructureLevel =
  | 'basica'
  | 'intermediaria'
  | 'avancada'
  | 'metropole_olimpica';

export type RegionalGymVarietyTier = 'essencial' | 'diversificada' | 'polo_nacional';

export interface CapitalEconomicProfile {
  /** Índice geral de custo de vida relativo à média nacional (1.00 = média nacional) */
  costOfLivingIndex: number;
  /** Custo mensal base de moradia individual básica (R$) */
  housingBase: number;
  /** Custo mensal base de alimentação essencial adulta (R$) */
  foodBase: number;
  /** Custo mensal base de transporte urbano/passe (R$) */
  transportBase: number;
  /** Custo mensal base de saúde/consultas/farmácia (R$) */
  healthBase: number;
  /** Multiplicador regional de mensalidades de ensino privado */
  educationMultiplier: number;
  /** Multiplicador regional de remuneração e mercado de trabalho */
  salaryMultiplier: number;
  /** Multiplicador regional de mensalidades de academias e equipamentos */
  gymTuitionMultiplier: number;
}

export interface CapitalSportProfile {
  /** Índice de desenvolvimento esportivo, federações e centros de treino (0-100) */
  sportDevelopmentIndex: number;
  infrastructureLevel: RegionalInfrastructureLevel;
  /** Força do mercado local de patrocínios e eventos comerciais (1.00 = média nacional) */
  sponsorshipMarketIndex: number;
  gymVarietyTier: RegionalGymVarietyTier;
  /** Artes marciais com maior tradição e presença competitiva nesta capital */
  dominantArts: MartialArtType[];
  economicIdentity: string;
  jobOpportunityLabel: string;
}

export type SocialRelationType =
  | 'pai'
  | 'mae'
  | 'irmao'
  | 'conjuge'
  | 'namorado'
  | 'filho'
  | 'amigo'
  | 'conhecido'
  | 'inimigo';

export type SocialPersonality =
  | 'leal'
  | 'ambicioso'
  | 'tranquilo'
  | 'explosivo'
  | 'frio'
  | 'carismatico'
  | 'disciplinado';

export interface SocialContact {
  id: string;
  name: string;
  avatar: string;
  gender: 'M' | 'F';
  relationType: SocialRelationType;
  personality: SocialPersonality;
  birthDate: GameDate;
  age: number;
  isAlive: boolean;
  deathDate?: GameDate;
  deathCause?: string;
  health: number; // 0..100
  wealthTier: WealthTier;
  occupation: string;
  dailyRoutine: string;
  city: string;
  affinity: number; // -100..100
  romanceLevel: number; // 0..100
  respect: number; // 0..100
  relationshipStage:
    | 'conhecido'
    | 'amigo'
    | 'melhor_amigo'
    | 'namorando'
    | 'noivo'
    | 'casado'
    | 'familia'
    | 'inimigo';
  martialArt?: MartialArtType | null;
  martialArtRankIndex?: number;
  martialArtBelt?: string;
  martialArtStripes?: number;
  martialArtMonths?: number;
  martialArtSource?: 'pj' | 'npc' | 'propria';
  martialArtInfluencerName?: string;
  linkedWorldFighterId?: string;
  partnerName?: string;
  partnerMarried?: boolean;
  childrenCount?: number;
  pendingBaptism?: boolean;
  pendingBaptismMonths?: number;
  pendingBaptismChildName?: string;
  recentLifeEvents?: string[];
}

export type WeightClass = 
  | 'Palha (até 52kg)'
  | 'Mosca (até 57kg)'
  | 'Galo (até 61kg)'
  | 'Pena (até 66kg)'
  | 'Leve (até 70kg)'
  | 'Meio-Médio (até 77kg)'
  | 'Médio (até 84kg)'
  | 'Meio-Pesado (até 93kg)'
  | 'Pesado (até 120kg)';

export interface FighterAttributes {
  strength: number;      // Força física e potência
  speed: number;         // Velocidade e explosão
  stamina: number;       // Vigor e gás aeróbico
  durability: number;    // Queixo e absorção de impacto
  flexibility: number;   // Flexibilidade e mobilidade articular
  fightIq: number;       // QI de luta e leitura tática
  technique: number;     // Precisão e refino técnico
  mentalFocus: number;   // Saúde mental, calma sob pressão e foco
}

export interface BeltGraduation {
  rankIndex: number;      // Posição no array de faixas
  name: string;           // Nome da faixa / graduação
  color: string;          // Cor hexadecimal ou classe CSS
  textColor: string;      // Cor do texto
  stripes: number;        // Graus (ex: 0 a 4 no Jiu-Jitsu)
  xp: number;             // XP acumulado no rank
  xpNeeded: number;       // XP para próxima graduação
  masteryTitle: string;   // ex: 'Faixa Azul 2º Grau'
  stageNumber?: number;   // ex: 9º ao 20º Estágio (CBC Capoeira)
  categoryName?: string;  // ex: 'Iniciante', 'Alunos', 'Transformação', 'Docentes', 'Mestre'
  evaluationCriteria?: string; // Critérios avaliados no exame
  estimatedTime?: string; // Tempo estimado de permanência
  gradientStyle?: string; // Gradiente trançado para cordas compostas
  monthsInRank?: number;  // Meses acumulados de prática na graduação atual
}

export interface GraduationHistoryRecord {
  id: string;
  date: GameDate;
  art: MartialArtType;
  previousRank: string;
  newRank: string;
  masterName: string;
  ceremonyCost?: number;
  paidByFamily?: boolean;
  notes?: string;
}

export interface Move {
  id: string;
  name: string;
  art: MartialArtType;
  type: 'strike' | 'takedown' | 'submission' | 'counter' | 'control' | 'defense';
  category: 'soco' | 'chute' | 'queda' | 'finalizacao' | 'esquiva' | 'bloqueio' | 'floreio' | 'clinch';
  damage: number;
  staminaCost: number;
  accuracy: number;       // Chance base de acerto (0 - 100)
  minBeltIndex: number;
  description: string;
  isUnlocked: boolean;
  masteryLevel: number;   // 1 a 5 estrelas
  signature?: boolean;    // Golpe exclusivo de academia especial
}

export type GymQualityTier = 'social' | 'convencional' | 'bairro' | 'competitiva' | 'elite' | 'mundial';

export type GymInfrastructureLevel = 'basica' | 'convencional' | 'avancada' | 'alto_rendimento' | 'olimpica';

export type GymCompetitiveProfile = 'recreativo' | 'misto' | 'competitivo' | 'alto_rendimento';

export interface GymInstructor {
  id: string;
  name: string;
  role: 'head_coach' | 'titular' | 'preparador';
  specialtyArt: MartialArtType;
  secondaryArt?: MartialArtType;
  qualification: string;
  experienceYears: number;
  technicalQuality: number; // 1 a 100
  methodology: string;
  reputation: number; // 1 a 100
  athleteDevelopmentRate: number; // 0.96 a 1.15 (equilibrado)
}

export interface Gym {
  id: string;
  name: string;
  country: string;
  uf?: BrazilUF;
  city: string;
  flag: string;
  teamName?: string;
  qualityTier?: GymQualityTier;
  foundedYear?: number;
  history?: string;
  infrastructureLevel?: GymInfrastructureLevel;
  infrastructureNote?: string;
  competitiveProfile?: GymCompetitiveProfile;
  studentCapacity?: number;
  technicalSpecialties?: string[];
  facilities?: string[];
  scholarshipSupport?: string;
  instructors?: GymInstructor[];
  rivalryGymIds?: string[];
  rivalryNote?: string;
  teamTitlesCount?: number;
  teamTitlesNote?: string;
  focusArts: MartialArtType[];
  weeklyCost: number;
  travelCost: number;
  minFightIq: number;
  minRank: number;
  reputationReq: number;
  description: string;
  masterName: string;
  masterPhilosophy: string;
  statMultipliers: Partial<Record<keyof FighterAttributes, number>>;
  specialPerk: string;
  specialMoveId?: string;
  learningSpeedMultiplier: number; // Curva de aprendizado
  isUnlocked: boolean;
}

export interface RivalNPC {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  age: number;
  ageCategory?: AgeCategory;
  art: MartialArtType;
  rankIndex?: number;
  belt: string;
  stripes?: number;
  weight: number;
  weightClass: WeightClass;
  gymId?: string;
  gymName?: string;
  city?: string;
  country?: string;
  fightingStyle?: string;
  gender?: 'M' | 'F';
  wealthTier?: WealthTier;
  sponsorName?: string;
  npcXp?: number;
  lastGymTransferNote?: string;
  gymTransferCount?: number;
  attributes: FighterAttributes;
  record: { wins: number; losses: number; draws: number; kos: number; subs: number };
  reputation: number;
  personality: 'arrogante' | 'respeitoso' | 'fanfarrao' | 'frio_calculista';
  relationshipScore: number; // -100 (inimigo jurado) a +100 (amigo/irmão de treino)
  lastResult?: 'venceu_jogador' | 'perdeu_jogador' | 'nunca_lutaram';
  socialPost?: string;
  monthsInRank?: number;
  artGraduations?: Partial<Record<MartialArtType, BeltGraduation>>;
}

export interface NpcWorldDelta {
  rk?: number;       // rankIndex atual
  b?: string;        // nome da faixa atual
  sp?: number;       // graus atuais (stripes) na faixa
  g?: string;        // gymId atual
  gn?: string;       // gymName atual
  c?: string;        // city atual
  co?: string;       // country atual
  mi?: number;       // monthsInRank
  xp?: number;       // XP técnico/graduação acumulado pelo NPC
  w?: number;        // wins
  l?: number;        // losses
  kos?: number;      // nocautes
  subs?: number;     // finalizações
  rep?: number;      // reputação
  st?: number;       // boost médio de atributos acumulado
  tr?: string;       // última nota de transferência de academia
  tc?: number;       // total de transferências de academia
}

export interface BracketFighterSlot {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  isPlayer: boolean;
  age: number;
  ageCategory: AgeCategory;
  art: MartialArtType;
  rankIndex: number;
  belt: string;
  stripes?: number;
  weight: number;
  weightClass: WeightClass;
  gymId?: string;
  gymName?: string;
  uf?: BrazilUF;
  city?: string;
  country?: string;
  fightingStyle?: string;
  gender?: 'M' | 'F';
  ageDivisionLabel?: string;
  giColor?: OfficialGiColor;
  wealthTier?: WealthTier;
  attributes: FighterAttributes;
  record: { wins: number; losses: number; draws: number; kos: number; subs: number };
}

export interface TournamentBracketMatch {
  matchId: string;
  stage: 'quartas' | 'semifinal' | 'final';
  matchNumber: number;
  fighterAId: string | null;
  fighterBId: string | null;
  winnerId: string | null;
  loserId?: string | null;
  method?: string;
  scoreSummary?: string;
  tiebreakApplied?: boolean;
  tiebreakCriterion?: string;
  resultType?: 'combate' | 'desempate' | 'bye' | 'wo';
  status: 'pendente' | 'pronta' | 'concluida';
}

export interface TournamentBracketState {
  bracketId?: string;
  tournamentId: string;
  year: number;
  bracketSize: 4 | 8;
  ageCategory: AgeCategory;
  ageDivisionId?: string;
  ageDivisionLabel?: string;
  genderDivision?: 'M' | 'F';
  rankDivisionId?: string;
  rankDivisionLabel?: string;
  weightClass: WeightClass;
  weightDivisionId?: string;
  weightDivisionLabel?: string;
  weightMaxKg?: number | null;
  isGi?: boolean;
  participants: BracketFighterSlot[];
  matches: TournamentBracketMatch[];
  championId?: string | null;
}

export type TournamentTemporalStatus =
  | 'futura'                 // Programada para mês/ano futuro
  | 'inscricoes_abertas'    // Mês atual, aguardando inscrição do atleta
  | 'inscrito'              // Atleta inscrito, pesagem pendente
  | 'pesagem_aprovada'      // Pesagem oficial aprovada, liberado para lutar
  | 'em_disputa'            // Combate em andamento
  | 'concluida'             // Já disputado na edição da temporada
  | 'encerrada';            // Período da competição expirou na linha do tempo

export interface Tournament {
  id: string;
  name: string;
  organization: string;    // ex: IBJJF, CBJ, CBBoxe, WKF, CBLLE, Jungle Fight, UFC
  scope: 'municipal' | 'estadual' | 'regional' | 'nacional' | 'internacional' | 'mundial' | 'mma_pro';
  hostCity?: string;
  hostUf?: BrazilUF;
  hostCountry?: string;
  dynamicLocalHost?: boolean;
  art: MartialArtType;
  minRankIndex: number;
  maxRankIndex?: number;
  minAge?: number;
  maxAge?: number;
  allowedAgeCategories?: AgeCategory[];
  /** Configuração oficial persistente de modalidade para BJJ/Grappling: Gi (true) ou No-Gi (false) */
  isGi?: boolean;
  entryFee: number;
  rewardMoney: number;
  rewardReputation: number;
  rewardHype: number;
  trophyName: string;
  rulesType: 'bjj_points' | 'judo_ippon' | 'karate_wkf' | 'boxing_10must' | 'muaythai_5r' | 'capoeira_roda' | 'lutalivre_sub' | 'mma_unified';
  tiebreakRule?: 'vantagens_penalidades' | 'decisao_arbitro' | 'criterio_interno';
  tiebreakRuleDescription?: string;
  rounds: number;
  roundDurationSeconds: number;
  targetWeight: number;
  weightClass: WeightClass;
  weekScheduled: number;
  monthScheduled?: number;            // 1 a 12 (mês programado no calendário civil anual)
  dayScheduled?: number;              // Dia do mês da disputa (7, 14, 21, 28)
  registrationOpenDay?: number;       // Dia de abertura das inscrições no mês do evento (padrão: 1)
  registrationDeadlineDay?: number;   // Dia limite para inscrição
  weighInDay?: number;                // Dia da pesagem oficial
  yearScheduled: number;
  bracketSize: 4 | 8;
  completed?: boolean;
}

export type EducationLevel = 'fundamental' | 'medio' | 'tecnico' | 'superior';

export type InstitutionType = 'publica' | 'particular';

export type EducationField =
  | 'geral'
  | 'educacao_fisica'
  | 'saude_enfermagem'
  | 'nutricao'
  | 'fisioterapia'
  | 'medicina'
  | 'ti_sistemas'
  | 'administracao'
  | 'direito'
  | 'seguranca_trabalho';

export type EducationShift = 'manha' | 'tarde' | 'noite';

export interface EducationCourse {
  id: string;
  institutionId: string;
  title: string;
  level: EducationLevel;
  field: EducationField;
  durationMonths: number;
  monthlyFee: number;
  minAge: number;
  minGraduationAge?: number;
  prerequisiteLevel?: EducationLevel;
  minEntranceGrade: number;
  allowedShifts: EducationShift[];
  pointsPerSession: number; // 3 para Fundamental/Médio (Seg-Sex), 2 para Técnico/Superior (Seg/Qua/Sex)
  daysPattern: 'seg_sex' | 'seg_qua_sex';
  gradeBonusPerMonth: number;
  graduationBonusDesc: string;
  desc: string;
}

export interface EducationInstitution {
  id: string;
  name: string;
  shortName: string;
  type: InstitutionType;
  level: EducationLevel;
  badge: string;
  prestigeLabel: string;
  description: string;
  courses: EducationCourse[];
}

export interface ActiveEducationEnrollment {
  institutionId: string;
  institutionName: string;
  institutionType: InstitutionType;
  courseId: string;
  courseTitle: string;
  level: EducationLevel;
  field: EducationField;
  shift: EducationShift;
  monthsCompleted: number;
  durationMonths: number;
  monthlyFee: number;
  currentGrade: number;
  startedDate: GameDate;
}

export interface CompletedEducation {
  id: string;
  institutionId: string;
  institutionName: string;
  institutionType: InstitutionType;
  courseId: string;
  courseTitle: string;
  level: EducationLevel;
  field: EducationField;
  finalGrade: number;
  completedDate: GameDate;
}

export interface CharacterEducationState {
  currentEnrollment?: ActiveEducationEnrollment;
  completedDegrees: CompletedEducation[];
  entranceExamScore: number; // 0 a 10
}

export type JobType =
  | 'desempregado'
  | 'panfleteiro'
  | 'entregador'
  | 'garcom'
  | 'seguranca'
  | 'auxiliar_dojo'
  | 'instrutor_artes'
  | 'atleta_patrocinado'
  | 'jovem_aprendiz_adm'
  | 'atendente_academia'
  | 'assistente_comercial'
  | 'tec_enfermagem'
  | 'tec_ti'
  | 'tec_administracao'
  | 'tec_seguranca'
  | 'tec_preparacao_fisica'
  | 'prof_educacao_fisica'
  | 'fisioterapeuta_esportivo'
  | 'nutricionista_esportivo'
  | 'engenheiro_software'
  | 'gestor_executivo'
  | 'advogado'
  | 'medico_esporte';

export interface GameDate {
  day: number;
  month: number;
  year: number;
}

export interface ActiveBjjTournamentMatchSession {
  tournamentId: string;
  year: number;
  category: WeightClass;
  weightDivisionLabel?: string;
  weightMaxKg?: number | null;
  ageCategory: AgeCategory;
  ageDivisionLabel?: string;
  genderDivision?: 'M' | 'F';
  rankDivisionLabel?: string;
  giColor?: OfficialGiColor;
  bracketId: string;
  matchId: string;
  stage: 'quartas' | 'semifinal' | 'final';
  stageName: 'Quartas de Final' | 'Semifinal' | 'Grande Final';
  opponentId: string;
  opponentSlot: BracketFighterSlot;
  isGi: boolean;
  status: 'pendente' | 'em_andamento' | 'concluida';
  startedAtDate: GameDate;
  matchState?: import('./bjjCombatEngine').BjjMatchState;
}

export interface ActiveBoxingTournamentMatchSession {
  tournamentId: string;
  year: number;
  category: WeightClass;
  weightDivisionLabel?: string;
  weightMaxKg?: number | null;
  ageCategory: AgeCategory;
  ageDivisionLabel?: string;
  genderDivision?: 'M' | 'F';
  rankDivisionLabel?: string;
  bracketId: string;
  matchId: string;
  stage: 'quartas' | 'semifinal' | 'final';
  stageName: 'Quartas de Final' | 'Semifinal' | 'Grande Final';
  opponentId: string;
  opponentSlot: BracketFighterSlot;
  rulesMode: 'amador' | 'profissional';
  totalRounds: number;
  roundDurationSeconds: number;
  status: 'pendente' | 'em_andamento' | 'concluida';
  startedAtDate: GameDate;
  matchState?: import('./boxingCombat').BoxingMatchState;
}

export interface CharacterTournamentEntry {
  tournamentId: string;
  year: number;
  month: number;
  registered: boolean;
  weighInPassed: boolean;
  categoryHomologated?: boolean;
  isGi?: boolean;
  giColor?: OfficialGiColor | string;
  genderDivision?: 'M' | 'F';
  ageDivisionId?: string;
  ageDivisionLabel?: string;
  rankDivisionId?: string;
  rankDivisionLabel?: string;
  weightDivisionId?: string;
  weightDivisionLabel?: string;
  weightMinKg?: number;
  weightMaxKg?: number | null;
  disqualifiedReason?: string;
  weightClass?: WeightClass;
  ageCategory?: AgeCategory;
  hostCity?: string;
  hostCountry?: string;
  travelCostPaid?: number;
  completed: boolean;
  result?: 'vitoria' | 'derrota' | 'empate';
  trophyEarned?: string;
  dateCompleted?: GameDate;
  /** Estágio da chave atual: ex: 'semifinal' ou 'final' */
  currentStage?: 'quartas' | 'semifinal' | 'final';
  /** Total de lutas vencidas na chave deste torneio */
  matchesWon?: number;
  /** Lista persistente de matchIds já homologados (proteção contra duplicidade) */
  homologatedMatchIds?: string[];
  /** Marca se premiação financeira, fama, hype e troféu final já foram creditados */
  rewardsClaimed?: boolean;
  /** Sessão persistente do confronto BJJ atual para retomada segura ao sair/recarregar */
  activeMatchSession?: ActiveBjjTournamentMatchSession;
  /** Sessão persistente do confronto de Boxe atual para retomada segura ao sair/recarregar */
  activeBoxingMatchSession?: ActiveBoxingTournamentMatchSession;
  /** Confrontos disputados na chave */
  matchHistory?: Array<{
    matchId: string;
    stage: string;
    opponentName: string;
    winner: 'player' | 'opponent' | 'draw';
    method: string;
    scoreSummary: string;
    isGi?: boolean;
    tiebreakCriterion?: string;
    resultType?: 'combate' | 'desempate' | 'bye' | 'wo';
    recordedAt?: GameDate;
  }>;
  /** Chaveamento completo da edição (4 ou 8 lutadores) */
  bracket?: TournamentBracketState;
}

import { EnrolledClass, ScheduledActivity, ClassSessionRecord } from './agenda';

export interface SavedFightLogEntry {
  id: string;
  arena: 'bjj' | 'boxe' | 'tradicional';
  matchType: 'sparring' | 'competicao';
  art: MartialArtType;
  isGi?: boolean;
  tournamentName?: string;
  stageName?: string;
  date: GameDate;
  opponentName: string;
  opponentNickname?: string;
  winner: 'player' | 'opponent' | 'draw';
  method: string;
  scoreSummary: string;
  durationSeconds?: number;
  totalCyclesOrRounds: number;
  entries: Array<{
    step: number;
    timeLabel: string;
    playerAction?: string;
    opponentAction?: string;
    narration: string;
    factor?: string;
    pointsInfo?: string;
  }>;
}

export interface Character {
  name: string;
  nickname: string;
  avatar: string;
  birthDate: GameDate;
  careerStartDate: GameDate;
  currentDate: GameDate;
  careerMonthsElapsed: number;
  homeState: string;       // UF, ex: 'SP', 'RJ', 'BA'
  homeCity: string;        // Capital ou cidade base, ex: 'São Paulo'
  age: number;
  startAge: number;
  currentWeek?: number;    // Mantido por compatibilidade
  currentMonth: number;    // Sincronizado com currentDate.month (1 a 12)
  currentYear: number;     // Sincronizado com currentDate.year (ano civil, ex: 1997, 2026)
  primaryArt: MartialArtType;
  weight: number;          // kg
  targetWeight: number;    // kg
  weightClass: WeightClass;
  money: number;           // R$
  energy: number;          // 0 a 100
  mentalHealth: number;    // 0 a 100
  stress: number;          // 0 a 100
  honor: number;           // 0 a 100
  fame: number;            // 0 a 1000
  hype: number;            // 0 a 100
  currentGymId: string;
  job: JobType;
  jobShift?: 'manha' | 'tarde' | 'noite' | 'madrugada'; // Turno de trabalho protegido (padrão: 'tarde')
  schoolGrade: number;     // 0 a 10 (se < 18 anos ou nota acadêmica atual)
  isStudying: boolean;
  schoolShift?: 'manha' | 'tarde' | 'noite'; // Turno escolar protegido (padrão: 'manha')
  education?: CharacterEducationState; // Instituições de ensino, formação e diplomas
  sleepPattern?: 'noturno' | 'diurno'; // Padrão circadiano (adultos possuem autonomia para 'diurno')
  dietPlan: 'caseira' | 'bulking' | 'atletica' | 'corte_severo';
  injuries: Array<{ id: string; name: string; severity: 'leve' | 'moderada' | 'grave'; weeksRemaining: number }>;
  accumulatedFatigue?: number;   // 0 a 100 (fadiga física e metabólica crônica)
  recoveryRate?: number;         // 0 a 100% (taxa de recuperação fisiológica mensal)
  currentCity?: string;          // Cidade atual da residência/treino
  currentCountry?: string;       // País atual da residência/treino
  attributes: FighterAttributes;
  artGraduations: Record<MartialArtType, BeltGraduation>;
  moves: Move[];
  /** Repertório técnico especializado de Jiu-Jitsu Brasileiro (Fase 4.1) */
  bjjTechniqueRepertoire?: Record<string, import('./bjjCombat').BjjAthleteTechniqueProficiency>;
  record: {
    wins: number;
    losses: number;
    draws: number;
    kos: number;
    submissions: number;
    pointsWins: number;
    mmaWins: number;
    mmaLosses: number;
  };
  trophies: Array<{ id: string; tournamentId?: string; tournamentName: string; year: number; art: MartialArtType; tier: string; isGi?: boolean }>;
  tournamentHistory?: CharacterTournamentEntry[];
  enrolledClasses?: EnrolledClass[];
  scheduledActivities?: ScheduledActivity[];
  classSessions?: ClassSessionRecord[];
  rivals: RivalNPC[];
  /** Estado compacto de evolução autônoma dos NPCs do mundo (graduação, academia, cartel) */
  npcWorldState?: Record<string, NpcWorldDelta>;
  /** Vida social, família, amigos, inimigos, romances, cônjuge e filhos com rotinas independentes */
  gender?: 'M' | 'F';
  maritalStatus?: 'solteiro' | 'namorando' | 'noivo' | 'casado' | 'viuvo';
  spouseId?: string;
  socialContacts?: SocialContact[];
  isAlive?: boolean;
  deathDate?: GameDate;
  deathCause?: string;
  /** Dinastia e legado familiar */
  dynastyGeneration?: number;
  legacyPredecessorName?: string;
  legacySummary?: string;
  /** Periodização de camp e patrocínio ativo */
  trainingCampIntensity?: 'leve' | 'tecnico' | 'intenso';
  activeSponsorName?: string;
  activeSponsorMonthlyPay?: number;
  /** Torneios em que já atuou no corner nesta temporada */
  coachedTournaments?: string[];
  /** Dificuldade escolhida e poder aquisitivo familiar */
  difficulty?: GameDifficulty;
  familyWealthTier?: WealthTier;
  /** Talento aleatório por arte marcial (oculto até matrícula na arte) */
  artTalents?: Record<MartialArtType, ArtTalentLevel>;
  discoveredArtTalents?: Partial<Record<MartialArtType, boolean>>;
  /** Academia própria fundada pelo jogador quando atinge o nível de Professor */
  playerAcademy?: PlayerAcademy;
  familySupport: number;   // 0 a 100
  ownBirthdayCelebratedYear?: number;
  graduationHistory?: GraduationHistoryRecord[];
  /** Registro detalhado das lutas recentes (Arena BJJ sparring/competição e Arena Tradicional) */
  recentFightLogs?: SavedFightLogEntry[];
  pendingCeremonyNotice?: { art: MartialArtType; rankName: string; cost: number; monthsUntilCeremony: number; masterName: string };
  /** Equipamentos comprados (IDs do catálogo) e equipados por slot */
  ownedEquipmentIds?: string[];
  equippedEquipment?: Partial<Record<EquipmentSlot, string>>;
  socialFeed: Array<{ id: string; author: string; handle: string; text: string; time: string; likes: number; verified?: boolean }>;
}

export type EquipmentSlot = 'vestuario' | 'luvas' | 'bucal' | 'protecao' | 'acessorio';

export type EquipmentQualityTier = 'basico' | 'intermediario' | 'profissional' | 'elite';

export interface EquipmentItem {
  id: string;
  name: string;
  brand: string;
  slot: EquipmentSlot;
  tier: EquipmentQualityTier;
  price: number;
  description: string;
  specs?: string;
  artAffinity?: MartialArtType[];
  isGiColor?: OfficialGiColor;
  attributeBonuses: Partial<FighterAttributes>;
  trainingXpBonusPct?: number;
  injuryReductionPct?: number;
  imagePath: string;
}

export interface AcademyStudent {
  id: string;
  name: string;
  avatar: string;
  gender: 'M' | 'F';
  age: number;
  art: MartialArtType;
  rankIndex: number;
  belt: string;
  stripes: number;
  xp: number;
  xpNeeded: number;
  monthsTrained: number;
  monthsInRank: number;
  attendance: number; // 0..100
  loyalty: number; // 0..100
  technique: number; // 1..99
  personality: SocialPersonality;
  talent: 'dedicado' | 'prodigio' | 'recreativo' | 'competidor';
  linkedContactId?: string;
  lastInteractionNote?: string;
  recentNotes?: string[];
  graduationHistory?: Array<{
    date: GameDate;
    from: string;
    to: string;
    note?: string;
  }>;
}

export interface PlayerAcademy {
  id: string;
  name: string;
  art: MartialArtType;
  city: string;
  country: string;
  foundedDate: GameDate;
  monthlyFeePerStudent: number;
  monthlyRentCost: number;
  reputation: number;
  level: 1 | 2 | 3;
  maxCapacity: number;
  philosophy: string;
  students: AcademyStudent[];
  lastMonthRevenue?: number;
  lastMonthProfit?: number;
  lastSeminarCareerMonth?: number;
}

export interface FightFighter {
  name: string;
  nickname: string;
  isPlayer: boolean;
  avatar: string;
  art: MartialArtType;
  rankName: string;
  weight: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  guard: number;           // 0 a 100
  attributes: FighterAttributes;
  points: number;          // Pontos de federação (BJJ, Karatê, Luta Livre)
  penalties: number;       // Shidos (Judô), Faltas (Boxe/MMA)
  advantages: number;      // Vantagens BJJ
  roundsWon: number;       // Rounds ganhos (Boxe / Muay Thai / MMA)
  knockdowns: number;
  cuts: number;            // Risco de TKO por corte
}

export type CombatPosition = 
  | 'em_pe'                // Trocação aberta em pé
  | 'clinch'               // Clinch de Muay Thai / Greco
  | 'grade_ou_corda'       // Prensado na grade / cordas
  | 'chao_guarda'          // Guarda (um por cima, outro de costas)
  | 'chao_passagem'        // Meia guarda / tentativa de passagem
  | 'chao_montada'         // Montada completa
  | 'chao_costas';         // Pegada de costas com ganchos

export interface CombatRoundScore {
  round: number;
  playerScore: number;
  opponentScore: number;
}

export interface CombatState {
  isActive: boolean;
  tournament: Tournament;
  stageName: string;       // ex: 'Quartas de Final', 'Semifinal', 'Grande Final'
  round: number;
  totalRounds: number;
  roundTimeRemaining: number; // Segundos
  position: CombatPosition;
  player: FightFighter;
  opponent: FightFighter;
  log: Array<{ id: string; text: string; type: 'hit' | 'damage' | 'takedown' | 'submission' | 'point' | 'referee' | 'knockdown' | 'info' }>;
  judgeScores: CombatRoundScore[];
  isPausedForReaction: boolean;
  reactionWindow?: {
    actionRequired: 'esquivar' | 'sprawl' | 'bloquear' | 'reverter' | 'contragolpear';
    promptText: string;
    secondsRemaining: number;
    onSuccessBonus: string;
  };
  isBetweenRounds: boolean;
  cornerAdviceAvailable: boolean;
  isFightOver: boolean;
  winner: 'player' | 'opponent' | 'draw' | null;
  winMethod: 'KO' | 'TKO' | 'Finalização' | 'Pontos' | 'Ippon' | 'Desqualificação' | 'Superioridade Técnica' | null;
}
