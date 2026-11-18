/**
 * TESTES: SISTEMA DE VIDA SOCIAL, FAMÍLIA, AMIGOS, INIMIGOS, ROMANCE,
 * CASAMENTO, FILHOS, ROTINAS INDEPENDENTES, INFLUÊNCIA MARCIAL E MORTALIDADE
 */

import {
  advanceMonth,
  buildCompactCharacterForStorage,
  createNewCharacter,
  migrateCharacterData
} from '../utils/characterHelper';
import {
  addWorldFighterToSocialCircle,
  breakupOrDivorceContact,
  deriveOccupationAndRoutineForAge,
  generateNewSocialContact,
  haveChildWithSpouse,
  influenceContactToStartArt,
  interactWithSocialContact,
  marrySocialContact,
  processMonthlySocialWorld,
  startDatingContact
} from '../utils/socialLifeHelper';
import { WORLD_FIGHTERS } from '../data/worldFightersData';

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

function makeDetRng(seedInit = 987654) {
  let seed = seedInit;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

console.log('================================================================');
console.log('TESTES: VIDA SOCIAL, FAMÍLIA, ROTINAS & INFLUÊNCIA MARCIAL');
console.log('================================================================\n');

// -------------------------------------------------------------------------
// TESTE 1: Núcleo familiar inicial, personalidades, gênero do PJ, migração e save compacto
// -------------------------------------------------------------------------
{
  const charFemale = createNewCharacter(
    'Marina',
    'Fênix',
    { day: 10, month: 5, year: 2004 },
    21,
    'jiujitsu',
    '🥋',
    'SP',
    'São Paulo',
    'F'
  );

  const contacts = charFemale.socialContacts || [];
  const hasPai = contacts.some((c) => c.relationType === 'pai');
  const hasMae = contacts.some((c) => c.relationType === 'mae');
  const hasIrmao = contacts.some((c) => c.relationType === 'irmao');
  const hasAmigo = contacts.some((c) => c.relationType === 'amigo');
  const hasInimigo = contacts.some((c) => c.relationType === 'inimigo');
  const allHavePersonalityAndRoutine = contacts.every(
    (c) => Boolean(c.personality) && Boolean(c.occupation) && Boolean(c.dailyRoutine)
  );

  // Simula save legado sem socialContacts nem gender
  const legacyRaw: any = JSON.parse(JSON.stringify(charFemale));
  delete legacyRaw.socialContacts;
  delete legacyRaw.gender;
  delete legacyRaw.maritalStatus;
  delete legacyRaw.isAlive;
  const migrated = migrateCharacterData(legacyRaw);

  const compactBytes = JSON.stringify(buildCompactCharacterForStorage(charFemale, false)).length;
  const aggressiveBytes = JSON.stringify(buildCompactCharacterForStorage(charFemale, true)).length;

  assert(
    charFemale.gender === 'F' &&
      charFemale.maritalStatus === 'solteiro' &&
      charFemale.isAlive === true &&
      hasPai &&
      hasMae &&
      hasIrmao &&
      hasAmigo &&
      hasInimigo &&
      allHavePersonalityAndRoutine &&
      Array.isArray(migrated.socialContacts) &&
      migrated.socialContacts.length >= 6 &&
      migrated.gender === 'M' &&
      compactBytes < 95000 &&
      aggressiveBytes < 65000,
    1,
    `Núcleo inicial completo (${contacts.length} contatos), gênero 'F', migração legada e save enxuto (${compactBytes}B)`,
    `hasPai=${hasPai}, hasMae=${hasMae}, hasIrmao=${hasIrmao}, migratedLen=${migrated.socialContacts?.length}, bytes=${compactBytes}`
  );
}

// -------------------------------------------------------------------------
// TESTE 2: Romance, Casamento, Filhos e Crescimento/Mudança de Rotina do Filho
// -------------------------------------------------------------------------
{
  let char = createNewCharacter(
    'Lucas',
    'Trovão',
    { day: 15, month: 2, year: 2003 },
    21,
    'muaythai',
    '🥊',
    'RJ',
    'Rio de Janeiro',
    'M'
  );
  char.money = 5000;

  // Adiciona uma atleta do circuito (ou cria novo contato adulto) para relacionar
  const femaleFighter = WORLD_FIGHTERS.find((f) => f.gender === 'F' && f.age >= 20)!;
  const addRes = addWorldFighterToSocialCircle(char, femaleFighter.id);
  char = addRes.updatedChar;

  const partnerId = `wf_${femaleFighter.id}`;
  for (let i = 0; i < 4; i++) {
    char.energy = 100;
    char = interactWithSocialContact(char, partnerId, 'sair').updatedChar;
  }

  const datingRes = startDatingContact(char, partnerId);
  char = datingRes.updatedChar;
  const isDating = char.maritalStatus === 'namorando' && char.spouseId === partnerId;

  // Eleva vínculo para casamento
  char = interactWithSocialContact(char, partnerId, 'presentear').updatedChar;
  char = interactWithSocialContact(char, partnerId, 'presentear').updatedChar;
  const marryRes = marrySocialContact(char, partnerId, 'festa');
  char = marryRes.updatedChar;
  const isMarried = char.maritalStatus === 'casado' && char.money === 5000 - 4 * 35 - 2 * 80 - 1800;

  // Ter um filho
  const childRes = haveChildWithSpouse(char, 'Pedro Trovão', makeDetRng(101));
  char = childRes.updatedChar;
  const child = childRes.child!;
  const initialOccupation = child.occupation;

  // Avança 8 anos (96 meses) para o filho crescer e ir ao Ensino Fundamental
  for (let m = 0; m < 96; m++) {
    char.currentDate.month += 1;
    if (char.currentDate.month > 12) {
      char.currentDate.month = 1;
      char.currentDate.year += 1;
      char.age += 1;
    }
    char.currentMonth = char.currentDate.month;
    char.currentYear = char.currentDate.year;
    // Simulação mensal determinística mantendo saúde para testar crescimento
    const res = processMonthlySocialWorld(char, () => 0.99);
    char = res.updatedChar;
  }

  const grownChild = (char.socialContacts || []).find((c) => c.id === child.id)!;
  const routineBaby = deriveOccupationAndRoutineForAge(1).occupation;
  const routineTeen = deriveOccupationAndRoutineForAge(15).occupation;

  // Testa divórcio em uma cópia para garantir integridade do fluxo de término
  const divorceRes = breakupOrDivorceContact(char, partnerId);

  assert(
    addRes.success &&
      datingRes.success &&
      isDating &&
      marryRes.success &&
      isMarried &&
      childRes.success &&
      initialOccupation.includes('Bebê') &&
      grownChild.age === 8 &&
      grownChild.occupation.includes('Fundamental') &&
      routineBaby !== routineTeen &&
      divorceRes.success &&
      divorceRes.updatedChar.maritalStatus === 'solteiro',
    2,
    `Romance -> Casamento -> Filho (0 -> ${grownChild.age} anos: ${grownChild.occupation}) e divórcio validados`,
    `isDating=${isDating}, isMarried=${isMarried}, childAge=${grownChild?.age}, occ=${grownChild?.occupation}`
  );
}

// -------------------------------------------------------------------------
// TESTE 3: Iniciação em Arte Marcial por influência do PJ E por influência autônoma de NPC
// -------------------------------------------------------------------------
{
  let char = createNewCharacter(
    'Rafael',
    'Lobo',
    { day: 12, month: 6, year: 2004 },
    21,
    'karate',
    '🥋',
    'MG',
    'Belo Horizonte',
    'M'
  );

  // Encontra amigo(a) sem arte marcial e garante afinidade para convite do PJ
  const targetFriend = (char.socialContacts || []).find(
    (c) => c.relationType === 'amigo' && !c.martialArt
  )!;
  targetFriend.affinity = 95;
  targetFriend.age = 20;

  // Influência direta do PJ (rng = 0.01 garante aceitação)
  const infRes = influenceContactToStartArt(char, targetFriend.id, 'jiujitsu', () => 0.01);
  char = infRes.updatedChar;
  const influencedFriend = (char.socialContacts || []).find((c) => c.id === targetFriend.id)!;
  const syncedToRivals = char.rivals.some(
    (r) => r.id === `social_fighter_${targetFriend.id}` && r.art === 'jiujitsu'
  );

  // Gera contatos jovens extras sem arte marcial para testar vida independente + influência de outro NPC
  for (let i = 0; i < 6; i++) {
    const gen = generateNewSocialContact(char, 'bairro', makeDetRng(500 + i));
    char = gen.updatedChar;
    const c = char.socialContacts!.find((x) => x.id === gen.contact.id)!;
    c.martialArt = null;
    c.age = 21;
    c.birthDate = { day: 10, month: 1, year: char.currentYear - 21 };
    c.partnerName = undefined;
  }

  const rng = makeDetRng(77777);
  for (let m = 0; m < 36; m++) {
    char = advanceMonth(char).updatedChar;
    char = processMonthlySocialWorld(char, rng).updatedChar;
  }

  const npcInitiated = (char.socialContacts || []).filter((c) => c.martialArtSource === 'npc');
  const independentPartnerOrCareer = (char.socialContacts || []).some(
    (c) => Boolean(c.partnerName) || (c.recentLifeEvents && c.recentLifeEvents.length >= 2)
  );
  const friendProgressed =
    (influencedFriend &&
      (char.socialContacts || []).find((c) => c.id === influencedFriend.id)?.martialArt === 'jiujitsu') ||
    false;

  assert(
    infRes.accepted &&
      influencedFriend.martialArt === 'jiujitsu' &&
      influencedFriend.martialArtSource === 'pj' &&
      syncedToRivals &&
      friendProgressed &&
      npcInitiated.length >= 1 &&
      independentPartnerOrCareer,
    3,
    `Iniciação por influência do PJ (${influencedFriend.name} -> Jiu-Jitsu) e autônoma por outro NPC (${npcInitiated.length} iniciado(s)) validadas`,
    `pjAccepted=${infRes.accepted}, synced=${syncedToRivals}, npcInitiated=${npcInitiated.length}, indep=${independentPartnerOrCareer}`
  );
}

// -------------------------------------------------------------------------
// TESTE 4: Mortalidade realista de NPCs (cônjuge -> viúvo) e ciclo final do PJ em idade avançada
// -------------------------------------------------------------------------
{
  let char = createNewCharacter(
    'Davi',
    'Sábio',
    { day: 1, month: 1, year: 1938 },
    21,
    'judo',
    '🥋',
    'PR',
    'Curitiba',
    'M'
  );
  char.age = 88;
  char.currentYear = 2026;
  char.currentDate = { day: 1, month: 1, year: 2026 };

  // Cria cônjuge idosa frágil para validar viuvez quando falece
  const contacts = char.socialContacts || [];
  contacts.push({
    id: 'spouse_elder',
    name: 'Helena Sábia',
    avatar: '👵',
    gender: 'F',
    relationType: 'conjuge',
    personality: 'leal',
    birthDate: { day: 1, month: 1, year: 1928 },
    age: 98,
    isAlive: true,
    health: 8,
    wealthTier: 'classe_media',
    occupation: 'Aposentado(a)',
    dailyRoutine: 'Caminhadas matinais',
    city: 'Curitiba',
    affinity: 95,
    romanceLevel: 95,
    respect: 95,
    relationshipStage: 'casado',
    martialArt: null,
    recentLifeEvents: []
  });
  char.maritalStatus = 'casado';
  char.spouseId = 'spouse_elder';

  // rng baixo dispara mortalidade natural esperada aos 98 anos (cônjuge) e 88 anos (PJ)
  const res = processMonthlySocialWorld(char, () => 0.005);
  const updatedSpouse = (res.updatedChar.socialContacts || []).find((c) => c.id === 'spouse_elder')!;

  assert(
    updatedSpouse.isAlive === false &&
      Boolean(updatedSpouse.deathDate) &&
      Boolean(updatedSpouse.deathCause) &&
      res.updatedChar.maritalStatus === 'viuvo' &&
      res.updatedChar.spouseId === undefined &&
      res.updatedChar.isAlive === false &&
      Boolean(res.updatedChar.deathCause),
    4,
    `Ciclo de mortalidade validado: cônjuge falecida gerou status 'viuvo' e PJ idoso encerrou legado`,
    `spouseAlive=${updatedSpouse.isAlive}, marital=${res.updatedChar.maritalStatus}, pjAlive=${res.updatedChar.isAlive}`
  );
}

console.log('\n================================================================');
console.log(`RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS COM SUCESSO!`);
console.log('================================================================\n');
