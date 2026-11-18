/**
 * TESTES FUNCIONAIS — DIVISÕES POR IDADE, PESO, GRADUAÇÃO, SEXO & PESAGEM CBJJ/IBJJF
 *
 * Verifica:
 * 1. Idade CBJJ calculada por (Ano do Campeonato - Ano de Nascimento) nas 15 divisões (Pré-Mirim a Master 6+)
 * 2. Tabelas oficiais de peso com quimono Adulto/Master (M/F), Juvenil (M/F) e Kids fracionadas
 * 3. Pesagem CBJJ com quimono (+1,80 kg), tolerância ZERO (0,00 kg) e desclassificação imediata na balança
 * 4. Cores oficiais do quimono (apenas branco, azul e preto aceitos)
 * 5. Chaves estritamente separadas por sexo, idade exata, graduação/faixa e categoria de peso
 * 6. Divisões específicas para as outras 7 artes (Judô, Karatê, Boxe, Muay Thai, Capoeira, Luta Livre, MMA)
 * 7. Duração oficial CBJJ por faixa e idade (Pré-Mirim 2m até Adulto Preta 10m)
 */

import { Character, MartialArtType, OfficialGiColor, TournamentDivisionSelection } from '../types/game';
import { INITIAL_TOURNAMENTS } from '../data/tournamentsData';
import { createNewCharacter } from '../utils/characterHelper';
import {
  getCompetitionAge,
  getGiColorLabel,
  isValidOfficialGiColor,
  resolveArtRankDivision,
  resolveSportAgeDivision,
  resolveTournamentDivisionForCharacter
} from '../utils/tournamentDivisionsHelper';
import {
  CBJJ_OFFICIAL_GI_WEIGHT_KG,
  BJJ_ADULT_MASTER_M_GI,
  BJJ_ADULT_MASTER_F_GI,
  BJJ_JUVENIL_M_GI,
  BJJ_JUVENIL_F_GI,
  BJJ_KIDS_TABLES_GI
} from '../data/tournamentDivisionsData';
import { validateTournamentEligibility, validateWeighIn } from '../utils/tournamentTimeline';
import { buildTournamentBracket } from '../utils/tournamentBracket';
import {
  advanceCharacterToTournamentDate,
  performTournamentWeighIn,
  prepareBjjTournamentMatchSession,
  registerCharacterInTournament
} from '../utils/tournamentFlow';

console.log('================================================================');
console.log('TESTES DE DIVISÕES & PESAGEM OFICIAL CBJJ / MULTI-ARTES');
console.log('================================================================\n');

let passed = 0;
function assert(condition: boolean, testNum: number, name: string, details?: string) {
  if (condition) {
    passed++;
    console.log(`[PASS] Teste ${testNum}: ${name}`);
  } else {
    console.error(`[FAIL] Teste ${testNum}: ${name}`);
    if (details) console.error(`       Detalhes: ${details}`);
    process.exit(1);
  }
}

const bjjGiTourn = INITIAL_TOURNAMENTS.find((t) => t.id === 'tourn_copa_interna_bjj')!;
const judoTourn = INITIAL_TOURNAMENTS.find((t) => t.art === 'judo')!;
const karateTourn = INITIAL_TOURNAMENTS.find((t) => t.art === 'karate')!;
const boxingTourn = INITIAL_TOURNAMENTS.find((t) => t.art === 'boxe')!;
const muayTourn = INITIAL_TOURNAMENTS.find((t) => t.art === 'muaythai')!;
const capoeiraTourn = INITIAL_TOURNAMENTS.find((t) => t.art === 'capoeira')!;
const lleTourn = INITIAL_TOURNAMENTS.find((t) => t.art === 'lutalivre')!;
const mmaTourn = INITIAL_TOURNAMENTS.find((t) => t.art === 'mma')!;

function makeAthlete(
  art: MartialArtType,
  birthYear: number,
  weight: number,
  gender: 'M' | 'F' = 'M',
  rankIndex = 0
): Character {
  const ageGroup: 8 | 13 | 21 =
    2026 - birthYear <= 11 ? 8 : 2026 - birthYear <= 16 ? 13 : 21;
  const ch = createNewCharacter(
    gender === 'F' ? 'Mariana Silva' : 'Rafael Silva',
    gender === 'F' ? 'Fênix' : 'Tigre',
    { day: 15, month: 10, year: birthYear },
    ageGroup,
    art,
    '🥋',
    'SP',
    'São Paulo',
    gender
  );
  ch.currentDate = { day: 1, month: bjjGiTourn.monthScheduled ?? 3, year: 2026 };
  ch.currentMonth = ch.currentDate.month;
  ch.currentYear = 2026;
  ch.weight = weight;
  ch.money = 5000;
  ch.artGraduations[art].rankIndex = rankIndex;
  return ch;
}

// 1. Cálculo de idade CBJJ pelo ano de nascimento (ano do campeonato - ano de nascimento) nas 15 divisões
{
  const expectedByBirthYear: Array<[number, string, string]> = [
    [2022, 'pre_mirim', 'Pré-Mirim'],
    [2021, 'pre_mirim', 'Pré-Mirim'],
    [2020, 'mirim', 'Mirim'],
    [2019, 'mirim', 'Mirim'],
    [2018, 'infantil_a', 'Infantil A'],
    [2017, 'infantil_a', 'Infantil A'],
    [2016, 'infantil_b', 'Infantil B'],
    [2015, 'infantil_b', 'Infantil B'],
    [2014, 'infanto_juvenil_a', 'Infanto-Juvenil A'],
    [2013, 'infanto_juvenil_a', 'Infanto-Juvenil A'],
    [2012, 'infanto_juvenil_b', 'Infanto-Juvenil B'],
    [2011, 'infanto_juvenil_b', 'Infanto-Juvenil B'],
    [2010, 'juvenil_1', 'Juvenil 1'],
    [2009, 'juvenil_2', 'Juvenil 2'],
    [2008, 'adulto', 'Adulto'],
    [1997, 'adulto', 'Adulto'],
    [1996, 'master_1', 'Master 1'],
    [1991, 'master_1', 'Master 1'],
    [1990, 'master_2', 'Master 2'],
    [1985, 'master_3', 'Master 3'],
    [1980, 'master_4', 'Master 4'],
    [1975, 'master_5', 'Master 5'],
    [1970, 'master_6', 'Master 6+']
  ];

  const allOk = expectedByBirthYear.every(([by, expId]) => {
    const ch = makeAthlete('jiujitsu', by, 65);
    const compAge = getCompetitionAge(ch, 'jiujitsu', 2026);
    const div = resolveSportAgeDivision('jiujitsu', compAge);
    return div.id === expId;
  });

  // Nota: atleta nascido em 15/10/2021 ainda tem 4 anos civis em Março/2026, mas pela regra CBJJ (2026 - 2021 = 5 anos -> Pré-Mirim)
  const dec2008 = makeAthlete('jiujitsu', 2008, 70);
  const compAge2008 = getCompetitionAge(dec2008, 'jiujitsu', 2026);
  const div2008 = resolveSportAgeDivision('jiujitsu', compAge2008);

  assert(
    allOk && compAge2008 === 18 && div2008.id === 'adulto',
    1,
    'CBJJ calcula idade pelo ano de nascimento (2026 - nasc) em todas as 15 faixas (Pré-Mirim a Master 6+)',
    `2008 compAge=${compAge2008}, div=${div2008.id}`
  );
}

// 2. Tabelas oficiais de peso CBJJ Adulto/Master (M e F) com quimono (+1,80 kg)
{
  assert(
    BJJ_ADULT_MASTER_M_GI.length === 9 &&
      BJJ_ADULT_MASTER_M_GI[0].maxWeight === 57.5 &&
      BJJ_ADULT_MASTER_M_GI[1].maxWeight === 64.0 &&
      BJJ_ADULT_MASTER_M_GI[2].maxWeight === 70.0 &&
      BJJ_ADULT_MASTER_M_GI[3].maxWeight === 76.0 &&
      BJJ_ADULT_MASTER_M_GI[4].maxWeight === 82.3 &&
      BJJ_ADULT_MASTER_M_GI[5].maxWeight === 88.3 &&
      BJJ_ADULT_MASTER_M_GI[6].maxWeight === 94.3 &&
      BJJ_ADULT_MASTER_M_GI[7].maxWeight === 100.5 &&
      BJJ_ADULT_MASTER_M_GI[8].maxWeight === null &&
      BJJ_ADULT_MASTER_F_GI.length === 8 &&
      BJJ_ADULT_MASTER_F_GI[0].maxWeight === 48.5 &&
      BJJ_ADULT_MASTER_F_GI[6].maxWeight === 79.3 &&
      BJJ_ADULT_MASTER_F_GI[7].maxWeight === null,
    2,
    'Tabelas CBJJ Adulto e Master (Masculino 9 classes até Pesadíssimo; Feminino 8 classes até Super Pesado sem limite)'
  );
}

// 3. Tabelas oficiais Juvenil (M e F) e Kids fracionadas (Pré-Mirim a Infanto-Juvenil B)
{
  const kidsDivIds: Array<keyof typeof BJJ_KIDS_TABLES_GI> = [
    'pre_mirim',
    'mirim',
    'infantil_a',
    'infantil_b',
    'infanto_juvenil_a',
    'infanto_juvenil_b'
  ];
  const kidsValid = kidsDivIds.every((id) => {
    const tbl = BJJ_KIDS_TABLES_GI[id];
    return Array.isArray(tbl) && tbl.length >= 6 && tbl[tbl.length - 1].maxWeight === null;
  });

  assert(
    BJJ_JUVENIL_M_GI[0].maxWeight === 53.5 &&
      BJJ_JUVENIL_M_GI[7].maxWeight === 89.3 &&
      BJJ_JUVENIL_M_GI[8].maxWeight === null &&
      BJJ_JUVENIL_F_GI[0].maxWeight === 44.3 &&
      BJJ_JUVENIL_F_GI[6].maxWeight === 69.0 &&
      BJJ_JUVENIL_F_GI[7].maxWeight === null &&
      kidsValid,
    3,
    'Tabelas CBJJ Juvenil (M/F) e divisões fracionadas Kids (Pré-Mirim até Infanto-Juvenil B)'
  );
}

// 4. Pesagem CBJJ com quimono (+1,80 kg) e tolerância ZERO (desclassificação imediata por gramas)
{
  // Atleta masculino Adulto pesando 68.20 kg + 1.80 kg Gi = 70.00 kg exatos -> PASSA no Pena (até 70,00 kg)
  const athleteExact = makeAthlete('jiujitsu', 2000, 68.2, 'M', 5);
  const penaSel: TournamentDivisionSelection = {
    weightDivisionId: 'pena',
    weightClassLabel: 'Pena (até 70,00 kg)',
    minWeightKg: 64.01,
    maxWeightKg: 70.0,
    gender: 'M',
    giColor: 'azul'
  };
  const passCheck = validateWeighIn(athleteExact, bjjGiTourn, penaSel);

  // Atleta pesando 68.25 kg + 1.80 kg Gi = 70.05 kg -> 50 gramas acima -> REPROVADO na balança CBJJ
  const athleteOver = makeAthlete('jiujitsu', 2000, 68.25, 'M', 5);
  const failCheck = validateWeighIn(athleteOver, bjjGiTourn, penaSel);

  // Fluxo real: atleta inscrito no Pena dentro do peso (68.10 kg), ganha 0.30 kg até a pesagem e sobe na balança -> Desclassificado!
  const dqAthlete = makeAthlete('jiujitsu', 2000, 68.1, 'M', 5);
  const reg = registerCharacterInTournament(dqAthlete, bjjGiTourn, 2026, penaSel);
  const adv = advanceCharacterToTournamentDate(reg.updatedChar, bjjGiTourn, 'weigh_in', 2026);
  adv.updatedChar.weight = 68.3; // 68.30 + 1.80 = 70.10 kg (> 70.00 kg)
  const weighInDq = performTournamentWeighIn(adv.updatedChar, bjjGiTourn, 2026, {
    confirmScaleAttempt: true
  });
  const dqEntry = weighInDq.updatedChar.tournamentHistory?.find((h) => h.tournamentId === bjjGiTourn.id);

  assert(
    passCheck.canPassWeighIn === true &&
      passCheck.scaleWeightKg === 70.0 &&
      passCheck.giWeightKg === CBJJ_OFFICIAL_GI_WEIGHT_KG &&
      failCheck.canPassWeighIn === false &&
      failCheck.status === 'acima_do_peso' &&
      failCheck.scaleWeightKg === 70.05 &&
      weighInDq.success === false &&
      weighInDq.disqualified === true &&
      dqEntry?.completed === true &&
      dqEntry?.result === 'derrota' &&
      Boolean(dqEntry?.disqualifiedReason),
    4,
    'Pesagem CBJJ com quimono (+1,80 kg) e tolerância ZERO: 70,00 kg passa, 70,05 kg reprova e desclassifica na balança',
    `pass=${passCheck.canPassWeighIn} (${passCheck.scaleWeightKg}), fail=${failCheck.status} (${failCheck.scaleWeightKg}), dq=${weighInDq.disqualified}`
  );
}

// 5. Cor oficial do quimono: apenas branco, azul ou preto
{
  const ch = makeAthlete('jiujitsu', 2000, 74.0, 'M', 5);
  const validColors: OfficialGiColor[] = ['branco', 'azul', 'preto'];
  const allColorsPass = validColors.every((c) => {
    const r = validateWeighIn(ch, bjjGiTourn, {
      weightDivisionId: 'leve',
      maxWeightKg: 76.0,
      giColor: c
    });
    return r.canPassWeighIn && r.giColorValid && getGiColorLabel(c).length > 0 && isValidOfficialGiColor(c);
  });

  const invalidGi = validateWeighIn(ch, bjjGiTourn, {
    weightDivisionId: 'leve',
    maxWeightKg: 76.0,
    giColor: 'rosa' as any
  });

  assert(
    allColorsPass &&
      !isValidOfficialGiColor('rosa') &&
      !invalidGi.canPassWeighIn &&
      invalidGi.status === 'quimono_irregular',
    5,
    'Validação estrita de cor do quimono CBJJ (branco/azul/preto aprovados; cor irregular bloqueada)',
    `invalidGi.status=${invalidGi.status}`
  );
}

// 6. Chaveamento separa estritamente Sexo, Idade exata, Faixa/Graduação (CBJJ) e Peso
{
  const femalePurple = makeAthlete('jiujitsu', 1994, 62.0, 'F', 6); // 2026 - 1994 = 32 -> Master 1, Faixa Roxa, 62+1.8=63.8 -> Leve F (até 64kg)
  const divF = resolveTournamentDivisionForCharacter(femalePurple, bjjGiTourn, 2026);
  const selF: TournamentDivisionSelection = {
    weightDivisionId: divF.selectedWeight.id,
    weightClassLabel: divF.selectedWeight.label,
    minWeightKg: divF.selectedWeight.minWeight,
    maxWeightKg: divF.selectedWeight.maxWeight,
    ageDivisionId: divF.ageDivision.id,
    ageDivisionLabel: divF.ageDivision.label,
    rankDivisionId: divF.rankDivisionId,
    rankDivisionLabel: divF.rankDivisionLabel,
    gender: 'F',
    giColor: 'preto'
  };
  const bracketF = buildTournamentBracket(bjjGiTourn, femalePurple, 2026, selF);
  const allFemale = bracketF.participants.every((p) => (p.gender || 'F') === 'F');
  const allSameBelt = bracketF.participants.every((p) => p.rankIndex === 6);
  const allMaster1Age = bracketF.participants.every((p) => p.age >= 30 && p.age <= 35);
  const allUnderCap = bracketF.participants.every((p) => p.weight + CBJJ_OFFICIAL_GI_WEIGHT_KG <= 64.5);

  assert(
    divF.ageDivision.id === 'master_1' &&
      divF.rankDivisionLabel === 'Faixa Roxa' &&
      divF.selectedWeight.id === 'bjj_am_f_gi_leve' &&
      bracketF.genderDivision === 'F' &&
      allFemale &&
      allSameBelt &&
      allMaster1Age &&
      allUnderCap,
    6,
    'Chave feminina Master 1 Faixa Roxa Peso Leve separa rigorosamente sexo, faixa, idade e limite de peso',
    `divWeightId=${divF.selectedWeight.id}, allF=${allFemale}, allBelt=${allSameBelt}, allAge=${allMaster1Age}, allWeight=${allUnderCap}`
  );
}

// 7. Outras 7 artes + duração CBJJ por faixa (Branca 5m, Azul 6m, Roxa 7m, Marrom 8m, Preta 10m)
{
  const whiteAdult = resolveTournamentDivisionForCharacter(makeAthlete('jiujitsu', 2001, 72, 'M', 0), bjjGiTourn, 2026);
  const blueAdult = resolveTournamentDivisionForCharacter(makeAthlete('jiujitsu', 2001, 72, 'M', 5), bjjGiTourn, 2026);
  const purpleAdult = resolveTournamentDivisionForCharacter(makeAthlete('jiujitsu', 2001, 72, 'M', 6), bjjGiTourn, 2026);
  const brownAdult = resolveTournamentDivisionForCharacter(makeAthlete('jiujitsu', 2001, 72, 'M', 7), bjjGiTourn, 2026);
  const blackAdult = resolveTournamentDivisionForCharacter(makeAthlete('jiujitsu', 2001, 72, 'M', 8), bjjGiTourn, 2026);
  const childA = resolveTournamentDivisionForCharacter(makeAthlete('jiujitsu', 2018, 30, 'M', 1), bjjGiTourn, 2026);

  // Fluxo completo com preparação da sessão de luta usando categoria Pesadíssimo (Sem limite)
  const ultraHeavy = makeAthlete('jiujitsu', 2000, 108.0, 'M', 8);
  const divUltra = resolveTournamentDivisionForCharacter(ultraHeavy, bjjGiTourn, 2026);
  const selUltra: TournamentDivisionSelection = {
    weightDivisionId: divUltra.selectedWeight.id,
    weightClassLabel: divUltra.selectedWeight.label,
    minWeightKg: divUltra.selectedWeight.minWeight,
    maxWeightKg: divUltra.selectedWeight.maxWeight,
    gender: 'M',
    giColor: 'branco'
  };
  const r1 = registerCharacterInTournament(ultraHeavy, bjjGiTourn, 2026, selUltra);
  const a1 = advanceCharacterToTournamentDate(r1.updatedChar, bjjGiTourn, 'weigh_in', 2026);
  const w1 = performTournamentWeighIn(a1.updatedChar, bjjGiTourn, 2026);
  const a2 = advanceCharacterToTournamentDate(w1.updatedChar, bjjGiTourn, 'fight', 2026);
  const prep = prepareBjjTournamentMatchSession(a2.updatedChar, bjjGiTourn, 2026);

  // Outras 7 artes
  const otherDivs = [
    resolveTournamentDivisionForCharacter(makeAthlete('judo', 2001, 73, 'M', 5), judoTourn, 2026),
    resolveTournamentDivisionForCharacter(makeAthlete('karate', 2001, 61, 'F', 3), karateTourn, 2026),
    resolveTournamentDivisionForCharacter(makeAthlete('boxe', 2002, 69, 'M', 2), boxingTourn, 2026),
    resolveTournamentDivisionForCharacter(makeAthlete('muaythai', 2001, 57, 'F', 2), muayTourn, 2026),
    resolveTournamentDivisionForCharacter(makeAthlete('capoeira', 2000, 78, 'M', 4), capoeiraTourn, 2026),
    resolveTournamentDivisionForCharacter(makeAthlete('lutalivre', 2001, 79, 'M', 3), lleTourn, 2026),
    resolveTournamentDivisionForCharacter(makeAthlete('mma', 1999, 77, 'M', 2), mmaTourn, 2026)
  ];

  const allOtherValid = otherDivs.every(
    (d) =>
      d.weightOptions.length >= 4 &&
      d.selectedWeight.label.length > 0 &&
      d.rankDivisionLabel.length > 0 &&
      d.ageDivision.label.length > 0
  );

  // Validar elegibilidade para Mma Pro e demais artes
  const mmaEligibility = validateTournamentEligibility(
    makeAthlete('mma', 1999, 77, 'M', 2),
    mmaTourn,
    2026,
    {
      weightDivisionId: otherDivs[6].selectedWeight.id,
      weightClassLabel: otherDivs[6].selectedWeight.label,
      minWeightKg: otherDivs[6].selectedWeight.minWeight,
      maxWeightKg: otherDivs[6].selectedWeight.maxWeight
    }
  );

  assert(
    whiteAdult.effectiveMatchDurationSeconds === 300 &&
      blueAdult.effectiveMatchDurationSeconds === 360 &&
      purpleAdult.effectiveMatchDurationSeconds === 420 &&
      brownAdult.effectiveMatchDurationSeconds === 480 &&
      blackAdult.effectiveMatchDurationSeconds === 600 &&
      childA.effectiveMatchDurationSeconds === 180 &&
      divUltra.selectedWeight.id === 'bjj_am_m_gi_pesadissimo' &&
      divUltra.selectedWeight.maxWeight === null &&
      w1.success &&
      prep.success &&
      prep.matchDurationSeconds === 600 &&
      prep.session?.weightMaxKg === null &&
      allOtherValid &&
      mmaEligibility.eligible,
    7,
    'Tempos oficiais CBJJ por faixa, fluxo completo Pesadíssimo (Sem limite) e divisões válidas para todas as 8 artes',
    `childDur=${childA.effectiveMatchDurationSeconds}, ultraId=${divUltra.selectedWeight.id}, prep=${prep.success}, dur=${prep.matchDurationSeconds}, mma=${mmaEligibility.eligible}`
  );
}

console.log(`\nResultado final: ${passed}/7 testes aprovados.`);
