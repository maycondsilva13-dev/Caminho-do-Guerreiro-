/**
 * TESTES DO CIRCUITO MUNDIAL DE LUTADORES E CHAVEAMENTOS (4 e 8 ATLETAS)
 * Valida:
 * 1. Cobertura de WORLD_FIGHTERS nas 8 artes marciais, faixas etárias, pesos e graduações válidas (minAge)
 * 2. Montagem de chaves de 4 e 8 atletas por arte, faixa etária e categoria de peso
 * 3. Progressão de chaveamento (Quartas -> Semifinal -> Final) e simulação IA vs IA
 * 4. Simulação automática da chave restante quando o jogador é eliminado
 * 5. Compatibilidade de migração em saves legados e compactação enxuta em localStorage
 * 6. Mapeamento correto das faixas BJJ completas (0..12) e legadas (0..4)
 */

import { MartialArtType } from '../types/game';
import { MARTIAL_ARTS_META } from '../data/martialArtsData';
import { INITIAL_TOURNAMENTS } from '../data/tournamentsData';
import {
  WORLD_FIGHTERS,
  getAgeCategoryFromAge,
  getMergedWorldFighters,
  getStarterRivals,
  resolveBjjCombatBeltRank
} from '../data/worldFightersData';
import { formatBjjBeltWithDegree } from '../utils/bjjDegreeHelper';
import {
  buildTournamentBracket,
  ensureTournamentBracket,
  getPlayerCurrentBracketMatch,
  resolvePlayerBracketMatch
} from '../utils/tournamentBracket';
import {
  buildCompactCharacterForStorage,
  createNewCharacter,
  migrateCharacterData
} from '../utils/characterHelper';

let passedTests = 0;
const totalTests = 6;

function assert(condition: boolean, testNum: number, name: string, details?: string) {
  if (condition) {
    passedTests++;
    console.log(`[PASS] Teste ${testNum}: ${name}`);
  } else {
    console.error(`[FAIL] Teste ${testNum}: ${name}`);
    if (details) console.error(`       Detalhes: ${details}`);
    process.exit(1);
  }
}

console.log('================================================================');
console.log('TESTES: CIRCUITO MUNDIAL DE NPCS & CHAVES DE TORNEIO');
console.log('================================================================\n');

// -------------------------------------------------------------------------
// TESTE 1: Cobertura completa das 8 artes, idades, pesos e minAge de graduação
// -------------------------------------------------------------------------
{
  const arts: MartialArtType[] = [
    'boxe', 'jiujitsu', 'muaythai', 'karate', 'judo', 'capoeira', 'lutalivre', 'mma'
  ];

  const missingArts = arts.filter(
    (art) => WORLD_FIGHTERS.filter((f) => f.art === art).length < 8
  );

  const invalidRanks = WORLD_FIGHTERS.filter((f) => {
    const ranks = MARTIAL_ARTS_META[f.art].ranks;
    const rankDef = ranks[f.rankIndex ?? 0];
    if (!rankDef) return true;
    const expectedBelt =
      f.art === 'jiujitsu'
        ? formatBjjBeltWithDegree(f.rankIndex ?? 0, rankDef.name, f.stripes ?? 0)
        : rankDef.name;
    if (expectedBelt !== f.belt) return true;
    if (rankDef.minAge !== undefined && f.age < rankDef.minAge) return true;
    return false;
  });

  const ageCategoriesFound = new Set(
    WORLD_FIGHTERS.map((f) => f.ageCategory || getAgeCategoryFromAge(f.age))
  );
  const weightClassesFound = new Set(WORLD_FIGHTERS.map((f) => f.weightClass));

  assert(
    WORLD_FIGHTERS.length >= 80 &&
      missingArts.length === 0 &&
      invalidRanks.length === 0 &&
      ageCategoriesFound.has('infantil') &&
      ageCategoriesFound.has('juvenil') &&
      ageCategoriesFound.has('adulto') &&
      ageCategoriesFound.has('master') &&
      weightClassesFound.size >= 6,
    1,
    `WORLD_FIGHTERS (${WORLD_FIGHTERS.length} atletas) cobre todas as 8 artes, idades, pesos e respeita minAge`,
    `missingArts=${missingArts.join(',')}, invalidRanks=${invalidRanks.map((r) => r.id).join(',')}, ages=${Array.from(ageCategoriesFound).join(',')}`
  );
}

// -------------------------------------------------------------------------
// TESTE 2: Montagem de chaves de 4 e 8 lutadores respeitando arte e faixa etária
// -------------------------------------------------------------------------
{
  const bjj4 = INITIAL_TOURNAMENTS.find((t) => t.bracketSize === 4 && t.art === 'jiujitsu')!;
  const bjj8 = INITIAL_TOURNAMENTS.find((t) => t.bracketSize === 8 && t.art === 'jiujitsu')!;

  const infantilChar = createNewCharacter('Pedro', 'Mirin', { day: 10, month: 5, year: 2015 }, 8, 'jiujitsu', '🥋', 'SP', 'São Paulo');
  infantilChar.age = 11;
  infantilChar.weight = 44;

  const adultChar = createNewCharacter('Carlos', 'Aço', { day: 10, month: 5, year: 2001 }, 21, 'jiujitsu', '🥋', 'SP', 'São Paulo');
  adultChar.age = 24;
  adultChar.weight = 70;

  const masterChar = createNewCharacter('Roberto', 'Veterano', { day: 10, month: 5, year: 1989 }, 21, 'jiujitsu', '🥋', 'SP', 'São Paulo');
  masterChar.age = 36;
  masterChar.weight = 76;

  const infBracket = buildTournamentBracket(bjj4, infantilChar, 2026);
  const aduBracket = buildTournamentBracket(bjj8, adultChar, 2026);
  const masBracket = buildTournamentBracket(bjj8, masterChar, 2026);

  const infOpponents = infBracket.participants.filter((p) => !p.isPlayer);
  const aduOpponents = aduBracket.participants.filter((p) => !p.isPlayer);

  const uniqueInfIds = new Set(infBracket.participants.map((p) => p.id)).size === 4;
  const uniqueAduIds = new Set(aduBracket.participants.map((p) => p.id)).size === 8;
  const allInfantilSameAgeCat = infOpponents.every((p) => p.ageCategory === 'infantil');
  const noAdultoMixInfantil = aduOpponents.every((p) => p.ageCategory === 'adulto' || p.ageCategory === 'master');

  assert(
    infBracket.participants.length === 4 &&
      aduBracket.participants.length === 8 &&
      masBracket.participants.length === 8 &&
      uniqueInfIds &&
      uniqueAduIds &&
      allInfantilSameAgeCat &&
      noAdultoMixInfantil,
    2,
    'Chaves de 4 e 8 lutadores preenchidas com atletas distintos por divisão etária',
    `infCount=${infBracket.participants.length}, aduCount=${aduBracket.participants.length}, allInf=${allInfantilSameAgeCat}`
  );
}

// -------------------------------------------------------------------------
// TESTE 3: Progressão completa de 8 lutadores (Quartas -> Semifinal -> Final -> Campeão)
// -------------------------------------------------------------------------
{
  const tourn8 = INITIAL_TOURNAMENTS.find((t) => t.bracketSize === 8 && t.art === 'jiujitsu')!;
  const char = createNewCharacter('Mateus', 'Relâmpago', { day: 1, month: 2, year: 2002 }, 21, 'jiujitsu', '🥋', 'RJ', 'Rio');
  char.age = 24;
  char.weight = 70;

  const { entry } = ensureTournamentBracket(char, tourn8, 2026);
  let bracket = entry.bracket!;

  const qfOpp = getPlayerCurrentBracketMatch(bracket);
  const r1 = resolvePlayerBracketMatch(bracket, tourn8, 'quartas', 'player', 'Finalização (Armlock)', '4x0');
  bracket = r1.updatedBracket;

  const sfOpp = getPlayerCurrentBracketMatch(bracket);
  const r2 = resolvePlayerBracketMatch(bracket, tourn8, 'semifinal', 'player', 'Pontos', '6x2');
  bracket = r2.updatedBracket;

  const finOpp = getPlayerCurrentBracketMatch(bracket);
  const r3 = resolvePlayerBracketMatch(bracket, tourn8, 'final', 'player', 'Finalização (Mata-Leão)', '2x0');
  bracket = r3.updatedBracket;

  assert(
    Boolean(qfOpp) &&
      r1.nextStage === 'semifinal' &&
      r1.simulatedAiResults.length === 3 &&
      Boolean(sfOpp) &&
      sfOpp!.match.stage === 'semifinal' &&
      r2.nextStage === 'final' &&
      r2.simulatedAiResults.length === 1 &&
      Boolean(finOpp) &&
      finOpp!.match.stage === 'final' &&
      bracket.championId === 'player',
    3,
    'Chave de 8 avança Quartas -> Semifinal -> Final simulando lutas paralelas IA vs IA',
    `champ=${bracket.championId}, next1=${r1.nextStage}, next2=${r2.nextStage}`
  );
}

// -------------------------------------------------------------------------
// TESTE 4: Eliminação do jogador conclui restante da chave e coroa campeão NPC
// -------------------------------------------------------------------------
{
  const tourn8 = INITIAL_TOURNAMENTS.find((t) => t.bracketSize === 8 && t.art === 'boxe')!;
  const char = createNewCharacter('João', 'Martelo', { day: 1, month: 2, year: 2000 }, 21, 'boxe', '🥊', 'SP', 'São Paulo');
  char.age = 25;
  char.weight = 64;

  const { entry } = ensureTournamentBracket(char, tourn8, 2026);
  const res = resolvePlayerBracketMatch(entry.bracket!, tourn8, 'quartas', 'opponent', 'Decisão Unânime', '28-29');

  const finalMatch = res.updatedBracket.matches.find((m) => m.stage === 'final');

  assert(
    finalMatch?.status === 'concluida' &&
      Boolean(res.updatedBracket.championId) &&
      res.updatedBracket.championId !== 'player',
    4,
    'Eliminação do jogador nas Quartas simula Semifinais/Final IA vs IA e coroa campeão NPC'
  );
}

// -------------------------------------------------------------------------
// TESTE 5: Migração de save legado + compactação enxuta em localStorage
// -------------------------------------------------------------------------
{
  const starterRivals = getStarterRivals();
  const baseChar = createNewCharacter('Ana', 'Fênix', { day: 3, month: 8, year: 2001 }, 21, 'muaythai', '🥊', 'PR', 'Curitiba');
  baseChar.age = 24;

  // Simula save antigo contendo rival antigo sem ageCategory/rankIndex e rival legado com art: 'wrestling'
  const legacyChar = JSON.parse(JSON.stringify(baseChar));
  legacyChar.rivals = [
    {
      ...starterRivals[0],
      ageCategory: undefined,
      rankIndex: undefined,
      relationshipScore: -77,
      record: { wins: 99, losses: 1, draws: 0, kos: 10, subs: 50 }
    },
    {
      id: 'rival_magomed',
      name: 'Magomed "O Urso" Aliyev',
      nickname: 'O Urso',
      avatar: '🐻',
      age: 19,
      art: 'wrestling',
      belt: 'Mestre Wrestling / Sambo',
      weight: 76,
      weightClass: 'Meio-Médio (até 77kg)',
      attributes: starterRivals[0].attributes,
      record: { wins: 14, losses: 0, draws: 0, kos: 4, subs: 6 },
      reputation: 150,
      personality: 'frio_calculista',
      relationshipScore: -50
    }
  ];

  const migrated = migrateCharacterData(legacyChar);
  const preservedFirst = migrated.rivals.find((r) => r.id === starterRivals[0].id);
  const migratedMagomed = migrated.rivals.find((r) => r.id === 'rival_magomed');
  const mergedWorld = getMergedWorldFighters(migrated);
  const allArtsValid = mergedWorld.every((f) => Boolean(MARTIAL_ARTS_META[f.art]?.ranks));

  // Anexa uma chave concluída e checa compactação
  const tourn8 = INITIAL_TOURNAMENTS.find((t) => t.bracketSize === 8 && t.art === 'jiujitsu')!;
  const { updatedChar, entry } = ensureTournamentBracket(migrated, tourn8, 2026);
  entry.completed = true;
  const compact = buildCompactCharacterForStorage(updatedChar, true);
  const serializedSize = JSON.stringify(compact).length;

  assert(
    migrated.rivals.length >= starterRivals.length &&
      preservedFirst?.relationshipScore === -77 &&
      preservedFirst?.record.wins === 99 &&
      Boolean(preservedFirst?.ageCategory) &&
      migratedMagomed?.art === 'lutalivre' &&
      allArtsValid &&
      serializedSize < 50000,
    5,
    `Migração preserva dados existentes, normaliza art legado ('wrestling' -> 'lutalivre') e mantém save compacto (${serializedSize} bytes)`
  );
}

// -------------------------------------------------------------------------
// TESTE 6: Resolução de faixa CBJJ completa (0..12) vs legada (0..4)
// -------------------------------------------------------------------------
{
  const azuMeta = resolveBjjCombatBeltRank(5, 'Faixa Azul');
  const pretaMeta = resolveBjjCombatBeltRank(8, 'Faixa Preta');
  const verdeKid = resolveBjjCombatBeltRank(4, 'Faixa Verde');
  const legacyAzul = resolveBjjCombatBeltRank(1, 'Faixa Azul');

  assert(
    azuMeta === 1 && pretaMeta === 4 && verdeKid === 0 && legacyAzul === 1,
    6,
    'resolveBjjCombatBeltRank mapeia corretamente faixas infantis, adultas (0..12) e fixtures legados (0..4)'
  );
}

console.log('\n================================================================');
console.log(`RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS COM SUCESSO!`);
console.log('================================================================\n');
