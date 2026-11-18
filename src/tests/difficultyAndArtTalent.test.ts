import assert from 'node:assert/strict';
import { advanceMonth, createNewCharacter, migrateCharacterData } from '../utils/characterHelper';
import { AVAILABLE_TURMAS } from '../data/gymClassesData';
import { enrollCharacterInTurma, completeSessionAttendance } from '../types/agenda';
import { addTrainingGraduationXp } from '../utils/graduationHelper';
import { resolveMonthlyTrainingAttendance } from '../utils/monthlyAttendanceHelper';
import { calculateGymMonthlyExpenses } from '../utils/recoveryHelper';
import { canFamilyAffordBirthday } from '../utils/monthlyAttendanceHelper';
import {
  ALL_MARTIAL_ARTS,
  getActiveArtTalentBonus,
  getDifficultyProfile,
  isArtTalentDiscovered
} from '../utils/talentAndDifficultyHelper';
import { WORLD_GYMS } from '../data/martialArtsData';

console.log('🧪 Executando testes: Dificuldade (Poder Aquisitivo Familiar) & Talento Oculto por Arte...');

// ===========================================================================
// 1. DIFICULDADE DETERMINA PODER AQUISITIVO DA FAMÍLIA E FINANÇAS INICIAIS
// ===========================================================================
{
  const birth = { day: 10, month: 5, year: 2014 };
  const cFacil = createNewCharacter('Enzo', 'Gold', birth, 8, 'jiujitsu', '🥋', 'SP', 'São Paulo', 'M', 'facil');
  const cMod = createNewCharacter('Caio', 'Prata', birth, 8, 'jiujitsu', '🥋', 'SP', 'São Paulo', 'M', 'moderado');
  const cNorm = createNewCharacter('João', 'Médio', birth, 8, 'jiujitsu', '🥋', 'SP', 'São Paulo', 'M', 'normal');
  const cDif = createNewCharacter('Kauã', 'Raiz', birth, 8, 'jiujitsu', '🥋', 'SP', 'São Paulo', 'M', 'dificil');

  assert.equal(cFacil.familyWealthTier, 'milionario');
  assert.equal(cMod.familyWealthTier, 'abastado');
  assert.equal(cNorm.familyWealthTier, 'classe_media');
  assert.equal(cDif.familyWealthTier, 'humilde');

  assert.equal(cFacil.money, getDifficultyProfile('facil').startingMoneyByAge[8]);
  assert.equal(cMod.money, getDifficultyProfile('moderado').startingMoneyByAge[8]);
  assert.equal(cNorm.money, getDifficultyProfile('normal').startingMoneyByAge[8]);
  assert.equal(cDif.money, getDifficultyProfile('dificil').startingMoneyByAge[8]);
  assert.ok(cFacil.money > cMod.money && cMod.money > cNorm.money && cNorm.money > cDif.money);

  const checkParentsTier = (char: ReturnType<typeof createNewCharacter>, expected: string) => {
    const parents = (char.socialContacts || []).filter((c) => c.relationType === 'pai' || c.relationType === 'mae');
    assert.ok(parents.length === 2);
    for (const p of parents) {
      assert.equal(p.wealthTier, expected);
    }
  };
  checkParentsTier(cFacil, 'milionario');
  checkParentsTier(cMod, 'abastado');
  checkParentsTier(cNorm, 'classe_media');
  checkParentsTier(cDif, 'humilde');

  // Família humilde (Difícil) com dinheiro insuficiente (< R$ 120) não comemora festa; Milionária (Fácil) sim
  assert.equal(canFamilyAffordBirthday(cDif, false).canAfford, false);
  assert.equal(canFamilyAffordBirthday(cFacil, false).canAfford, true);

  // Mesada mensal automática para menor de 18 anos no Fácil (+R$ 450)
  const origRand = Math.random;
  Math.random = () => 0.99;
  try {
    const moneyBefore = cFacil.money;
    const advFacil = advanceMonth(cFacil);
    assert.ok(
      advFacil.monthLog.some((l) => l.includes('Mesada da Família') && l.includes('450')),
      'Dificuldade Fácil (< 18 anos) deve gerar mesada mensal de família milionária'
    );
    assert.ok(advFacil.updatedChar.money >= moneyBefore + 450);

    // Família humilde não dá mesada e não paga academia paga
    cDif.currentGymId = 'gym_gracie_rio';
    const expensesDif = calculateGymMonthlyExpenses(cDif);
    const gracieExp = expensesDif.gyms.find((g) => g.gymId === 'gym_gracie_rio')!;
    assert.equal(gracieExp.paidByFamily, false, 'Pais humildes não conseguem pagar mensalidade de academia particular');
    assert.ok(gracieExp.athleteAmount > 0);

    // Família milionária cobre inclusive academia de ponta
    cFacil.currentGymId = 'gym_gracie_rio';
    const expensesFacil = calculateGymMonthlyExpenses(cFacil);
    const gracieExpFacil = expensesFacil.gyms.find((g) => g.gymId === 'gym_gracie_rio')!;
    assert.equal(gracieExpFacil.paidByFamily, true, 'Pais milionários custeiam academia do jovem');
    assert.equal(gracieExpFacil.athleteAmount, 0);
  } finally {
    Math.random = origRand;
  }
  console.log('✅ 1. Dificuldade -> Poder aquisitivo da família, mesada e custeio validados');
}

// ===========================================================================
// 2. TALENTO ALEATÓRIO POR ARTE, DESCOBERTA SÓ NA MATRÍCULA & BÔNUS DE EVOLUÇÃO
// ===========================================================================
{
  let char = createNewCharacter(
    'Marina Lopes',
    'Fúria',
    { day: 15, month: 4, year: 2003 },
    21,
    'jiujitsu',
    '🥋',
    'RJ',
    'Rio de Janeiro',
    'F',
    'normal'
  );
  char.currentDate = { day: 1, month: 3, year: 2026 };
  char.currentMonth = 3;
  char.currentYear = 2026;

  // Todas as 8 artes possuem talento gerado, porém NENHUM está descoberto antes da matrícula
  assert.ok(char.artTalents);
  for (const art of ALL_MARTIAL_ARTS) {
    assert.ok(char.artTalents[art], `Arte ${art} deve ter talento sorteado na criação`);
    assert.equal(isArtTalentDiscovered(char, art), false, `Talento em ${art} deve iniciar oculto`);
    assert.equal(getActiveArtTalentBonus(char, art).xpMultiplier, 1.0, 'Sem matrícula não há bônus ativo ainda');
  }

  // Define explicitamente para testar comparação controlada entre Gênio vs Comum
  char.artTalents!.jiujitsu = 'genio'; // +60% XP, +50% attrs
  char.artTalents!.karate = 'comum';  // +0% XP, +0% attrs

  const bjjTurma = AVAILABLE_TURMAS.find((t) => t.id === 'turma_bairro_jj_iniciante')!;
  const karateTurma = AVAILABLE_TURMAS.find((t) => t.id === 'turma_bairro_karate_kihon')!;
  assert.ok(karateTurma, 'Karatê deve possuir turma inicial disponível para matrícula');

  // Enquanto NÃO matriculado em BJJ, talento permanece oculto
  assert.equal(isArtTalentDiscovered(char, 'jiujitsu'), false);

  // Ao se matricular em BJJ, descobre imediatamente o talento 'genio'
  const enrBjj = enrollCharacterInTurma(char, bjjTurma);
  assert.equal(enrBjj.success, true);
  assert.ok(enrBjj.discoveredTalent, 'Matrícula deve retornar descoberta do talento');
  assert.equal(enrBjj.discoveredTalent!.art, 'jiujitsu');
  assert.equal(enrBjj.discoveredTalent!.level, 'genio');
  assert.equal(enrBjj.discoveredTalent!.xpBonusPercent, 60);
  assert.ok(enrBjj.message.includes('Talento Descoberto'), 'Mensagem de matrícula deve anunciar talento descoberto');

  char = enrBjj.updatedChar;
  assert.equal(isArtTalentDiscovered(char, 'jiujitsu'), true, 'BJJ agora deve estar descoberto');
  assert.equal(isArtTalentDiscovered(char, 'karate'), false, 'Karatê ainda deve permanecer oculto');
  assert.equal(isArtTalentDiscovered(char, 'boxe'), false, 'Outras artes devem permanecer ocultas');

  // Matrícula em Karatê descobre o talento 'comum'
  const enrKar = enrollCharacterInTurma(char, karateTurma);
  assert.equal(enrKar.success, true);
  assert.equal(enrKar.discoveredTalent?.level, 'comum');
  char = enrKar.updatedChar;
  assert.equal(isArtTalentDiscovered(char, 'karate'), true);

  // Comparação direta do bônus de evolução: BJJ ('genio' 1.6x) vs Karatê ('comum' 1.0x)
  const xpResBjj = addTrainingGraduationXp(char, 'jiujitsu', 25, 1.0);
  const xpResKar = addTrainingGraduationXp(char, 'karate', 25, 1.0);
  assert.equal(xpResBjj.xpAdded, 40, '25 XP * 1.60 (Gênio) = 40 XP');
  assert.equal(xpResKar.xpAdded, 25, '25 XP * 1.00 (Comum) = 25 XP');

  // Verifica completeSessionAttendance respeitando bônus de talento
  const sessBjj = char.classSessions!.find((s) => s.art === 'jiujitsu' && s.status === 'agendada')!;
  const attRes = completeSessionAttendance(char, sessBjj.id, (id) => WORLD_GYMS.find((g) => g.id === id));
  assert.equal(attRes.success, true);
  // gym_bairro = +30% XP (normalized: 1 + 0.3*0.25 = 1.075), session base 20 * 1.3 = 26 -> * 1.075 = 28 -> * 1.6 = 45 XP
  assert.ok((attRes.xpEarned || 0) >= 40, `Sessão com talento Gênio deve render alto XP (${attRes.xpEarned})`);

  // Verifica resolveMonthlyTrainingAttendance aplicando bônus de XP e atributos
  const techBefore = char.attributes.technique;
  const monthRes = resolveMonthlyTrainingAttendance(char, { day: 1, month: 3, year: 2026 }, []);
  assert.ok(monthRes.totalXpEarned > 0);
  assert.ok(monthRes.updatedChar.attributes.technique > techBefore, 'Atributo técnico deve evoluir no mês');
  assert.ok(
    monthRes.logs.some((l) => l.includes('Talento')),
    'Log mensal deve mencionar o bônus de talento ativo'
  );

  // Migração de save antigo preenche artTalents e marca artes já matriculadas como descobertas
  const legacySave: any = JSON.parse(JSON.stringify(char));
  delete legacySave.difficulty;
  delete legacySave.familyWealthTier;
  delete legacySave.artTalents;
  delete legacySave.discoveredArtTalents;
  const migrated = migrateCharacterData(legacySave);
  assert.equal(migrated.difficulty, 'normal');
  assert.equal(migrated.familyWealthTier, 'classe_media');
  assert.ok(migrated.artTalents?.boxe);
  assert.equal(migrated.discoveredArtTalents?.jiujitsu, true, 'Arte com matrícula ativa deve ser marcada como descoberta na migração');
  assert.equal(Boolean(migrated.discoveredArtTalents?.boxe), false, 'Arte sem matrícula deve seguir oculta na migração');

  console.log('✅ 2. Talento aleatório oculto, descoberta na matrícula e bônus de evolução validados');
}

console.log('🎉 TESTES DE DIFICULDADE E TALENTOS CONCLUÍDOS COM SUCESSO!');
