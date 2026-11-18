/**
 * TESTES: RANKINGS MUNDIAIS, ESTILOS VARIADOS, ATLETAS FEMININAS/RICOS,
 * GRADUAÇÃO AUTÔNOMA DE NPCS E VÍNCULO/TRANSFERÊNCIAS DE ACADEMIAS
 */

import { MartialArtType } from '../types/game';
import { WORLD_GYMS } from '../data/martialArtsData';
import {
  WORLD_FIGHTERS,
  getFightingStyleLabel,
  getMergedWorldFighters
} from '../data/worldFightersData';
import {
  advanceMonth,
  buildCompactCharacterForStorage,
  createNewCharacter
} from '../utils/characterHelper';
import { processAutonomousNpcGraduations } from '../utils/graduationHelper';
import { computeWorldRankings } from '../utils/rankingHelper';

let passedTests = 0;
const totalTests = 4;

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
console.log('TESTES: RANKINGS, ESTILOS, DIVERSIDADE & EVOLUÇÃO AUTÔNOMA NPC');
console.log('================================================================\n');

// -------------------------------------------------------------------------
// TESTE 1: Diversidade de estilos, atletas femininas, rivais ricos e vínculo 100% WORLD_GYMS
// -------------------------------------------------------------------------
{
  const arts: MartialArtType[] = [
    'boxe', 'jiujitsu', 'muaythai', 'karate', 'judo', 'capoeira', 'lutalivre', 'mma'
  ];
  const validGymIds = new Set(WORLD_GYMS.map((g) => g.id));

  const femaleCount = WORLD_FIGHTERS.filter((f) => f.gender === 'F').length;
  const artsWithFemales = arts.filter((art) =>
    WORLD_FIGHTERS.some((f) => f.art === art && f.gender === 'F')
  );
  const wealthyCount = WORLD_FIGHTERS.filter(
    (f) => f.wealthTier === 'milionario' || f.wealthTier === 'abastado'
  ).length;
  const sponsoredCount = WORLD_FIGHTERS.filter((f) => Boolean(f.sponsorName)).length;
  const distinctStyles = new Set(WORLD_FIGHTERS.map((f) => f.fightingStyle).filter(Boolean));
  const invalidGyms = WORLD_FIGHTERS.filter((f) => !f.gymId || !validGymIds.has(f.gymId));
  const styleLabelWorks = getFightingStyleLabel('dagestan_pressure').label.length > 0;

  assert(
    femaleCount >= 18 &&
      artsWithFemales.length === 8 &&
      wealthyCount >= 15 &&
      sponsoredCount >= 10 &&
      distinctStyles.size >= 24 &&
      invalidGyms.length === 0 &&
      styleLabelWorks,
    1,
    `Roster (${WORLD_FIGHTERS.length} atletas) possui ${femaleCount} mulheres nas 8 artes, ${wealthyCount} atletas abastados/milionários, ${distinctStyles.size} estilos e 100% vinculados a WORLD_GYMS`,
    `female=${femaleCount}, artsFem=${artsWithFemales.length}, wealthy=${wealthyCount}, styles=${distinctStyles.size}, invalidGyms=${invalidGyms.map((g) => g.id).join(',')}`
  );
}

// -------------------------------------------------------------------------
// TESTE 2: Graduação autônoma + evolução independente + transferência de academia
// -------------------------------------------------------------------------
{
  let char = createNewCharacter(
    'Lucas',
    'Tempestade',
    { day: 15, month: 3, year: 2005 },
    21,
    'jiujitsu',
    '🥋',
    'SP',
    'São Paulo'
  );

  // Simula 24 meses de carreira sem qualquer intervenção do jogador nos rivais
  // usando um PRNG determinístico para garantir cobertura reproduzível
  let seed = 421337;
  const detRng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let m = 0; m < 24; m++) {
    const adv = advanceMonth(char);
    char = adv.updatedChar;
    // Também exercita explicitamente processAutonomousNpcGraduations com rng determinístico
    const res = processAutonomousNpcGraduations(char, detRng);
    char = res.updatedChar;
  }

  const merged = getMergedWorldFighters(char);
  const deltaEntries = Object.values(char.npcWorldState || {});

  const npcsPromoted = deltaEntries.filter((d) => d.rk !== undefined).length;
  const npcsTransferred = merged.filter((f) => (f.gymTransferCount || 0) > 0 && Boolean(f.lastGymTransferNote)).length;
  const npcsWithExtraWins = merged.filter((f) => {
    const seedNpc = WORLD_FIGHTERS.find((w) => w.id === f.id);
    return seedNpc ? f.record.wins > seedNpc.record.wins : false;
  }).length;
  const ageAdvanced = merged[0].age > WORLD_FIGHTERS[0].age;

  assert(
    npcsPromoted >= 5 &&
      npcsTransferred >= 5 &&
      npcsWithExtraWins >= 20 &&
      ageAdvanced,
    2,
    `Após 24 meses autônomos: ${npcsPromoted} NPCs graduados, ${npcsTransferred} transferidos entre academias e ${npcsWithExtraWins} com novas vitórias`,
    `promoted=${npcsPromoted}, transferred=${npcsTransferred}, extraWins=${npcsWithExtraWins}, ageAdvanced=${ageAdvanced}`
  );
}

// -------------------------------------------------------------------------
// TESTE 3: Save compactado permanece enxuto mesmo após evolução de 118+ NPCs
// -------------------------------------------------------------------------
{
  let char = createNewCharacter(
    'Rafael',
    'Corisco',
    { day: 10, month: 6, year: 2000 },
    21,
    'boxe',
    '🥊',
    'BA',
    'Salvador'
  );

  for (let m = 0; m < 18; m++) {
    char = advanceMonth(char).updatedChar;
  }

  const normalBytes = JSON.stringify(buildCompactCharacterForStorage(char, false)).length;
  const aggressiveBytes = JSON.stringify(buildCompactCharacterForStorage(char, true)).length;

  assert(
    normalBytes < 90000 && aggressiveBytes < 60000,
    3,
    `Persistência enxuta após 18 meses de evolução global (normal=${normalBytes} bytes, compact=${aggressiveBytes} bytes)`,
    `normal=${normalBytes}, aggressive=${aggressiveBytes}`
  );
}

// -------------------------------------------------------------------------
// TESTE 4: Sistema de Rankings (P4P, por Arte, Sexo, Academia e Perfil Financeiro)
// -------------------------------------------------------------------------
{
  const char = createNewCharacter(
    'Gabriel',
    'Titan',
    { day: 12, month: 4, year: 2002 },
    21,
    'mma',
    '⚔️',
    'RJ',
    'Rio de Janeiro'
  );
  char.record.wins = 14;
  char.record.kos = 8;
  char.record.submissions = 4;
  char.fame = 280;
  char.money = 60000;

  const p4p = computeWorldRankings(char, { mode: 'p4p' });
  const femaleBjj = computeWorldRankings(char, { mode: 'art', art: 'jiujitsu', gender: 'F' });
  const millionaireOnly = computeWorldRankings(char, { mode: 'p4p', wealthTier: 'milionario' });
  const attGym = computeWorldRankings(char, { mode: 'p4p', gymId: 'gym_american_top_team' });

  const sortedDesc = p4p.entries.every(
    (entry, idx) => idx === 0 || p4p.entries[idx - 1].score >= entry.score
  );
  const playerIncluded = p4p.entries.some((e) => e.isPlayer && e.p4pRank === p4p.playerEntry.p4pRank);
  const allFemaleBjjMatch = femaleBjj.entries.every((e) => e.art === 'jiujitsu' && e.gender === 'F');
  const allMillionairesMatch = millionaireOnly.entries.every((e) => e.wealthTier === 'milionario');
  const allAttMatch = attGym.entries.every((e) => e.gymId === 'gym_american_top_team');

  assert(
    p4p.allRankedCount === WORLD_FIGHTERS.length + 1 &&
      sortedDesc &&
      playerIncluded &&
      femaleBjj.entries.length >= 3 &&
      allFemaleBjjMatch &&
      millionaireOnly.entries.length >= 5 &&
      allMillionairesMatch &&
      attGym.entries.length >= 3 &&
      allAttMatch,
    4,
    `Rankings P4P (${p4p.allRankedCount} ranqueados, PJ #${p4p.playerEntry.p4pRank}), feminino BJJ (${femaleBjj.entries.length}), milionários (${millionaireOnly.entries.length}) e ATT (${attGym.entries.length}) validados`,
    `total=${p4p.allRankedCount}, sorted=${sortedDesc}, femBjj=${femaleBjj.entries.length}, mill=${millionaireOnly.entries.length}, att=${attGym.entries.length}`
  );
}

console.log('\n================================================================');
console.log(`RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS COM SUCESSO!`);
console.log('================================================================\n');
