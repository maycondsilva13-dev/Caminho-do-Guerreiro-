import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { createNewCharacter, migrateCharacterData } from '../utils/characterHelper';
import { EQUIPMENT_CATALOG, EQUIPMENT_SLOT_META, EQUIPMENT_TIER_META } from '../data/equipmentShopData';
import {
  buyEquipmentItem,
  equipEquipmentItem,
  getEffectiveAttributes,
  getEquipmentSummary,
  getEquipmentTotalStatPoints,
  unequipEquipmentSlot
} from '../utils/equipmentShopHelper';
import { checkSparringInjuryRisk } from '../utils/recoveryHelper';

function makeTestCharacter(money = 5000) {
  const char = createNewCharacter(
    'Lucas Ferreira',
    'Cascavel',
    { day: 15, month: 4, year: 2003 },
    21,
    'jiujitsu',
    '🥋',
    'SP',
    'São Paulo',
    'M',
    'normal'
  );
  char.money = money;
  return char;
}

function runTests() {
  console.log('=== Testes do Sistema de Loja de Equipamentos ===');

  // 1. Catálogo variado, IDs únicos, slots válidos e imagens existentes no disco
  assert.ok(EQUIPMENT_CATALOG.length >= 15, 'Catálogo deve ter pelo menos 15 itens variados');
  const seenIds = new Set<string>();
  const slotsSeen = new Set<string>();
  const tiersSeen = new Set<string>();

  for (const item of EQUIPMENT_CATALOG) {
    assert.ok(!seenIds.has(item.id), `ID duplicado encontrado: ${item.id}`);
    seenIds.add(item.id);
    assert.ok(EQUIPMENT_SLOT_META[item.slot], `Slot inválido: ${item.slot}`);
    assert.ok(EQUIPMENT_TIER_META[item.tier], `Tier inválido: ${item.tier}`);
    slotsSeen.add(item.slot);
    tiersSeen.add(item.tier);
    assert.ok(item.price > 0, `Preço inválido em ${item.id}`);
    assert.ok(getEquipmentTotalStatPoints(item) > 0, `Item sem bônus de atributo: ${item.id}`);

    const relativeImg = item.imagePath.replace(/^\//, '');
    assert.ok(
      fs.existsSync(path.resolve(process.cwd(), relativeImg)),
      `Imagem ausente para ${item.id}: ${relativeImg}`
    );
  }

  assert.strictEqual(slotsSeen.size, 5, 'Todos os 5 slots devem possuir itens');
  assert.strictEqual(tiersSeen.size, 4, 'Todas as 4 qualidades devem estar representadas');

  // 2. Progressão coerente entre qualidade, preço e bônus de habilidade
  const byTierAvgPrice: Record<string, number> = {};
  const byTierAvgPoints: Record<string, number> = {};
  for (const tier of ['basico', 'intermediario', 'profissional', 'elite'] as const) {
    const tierItems = EQUIPMENT_CATALOG.filter((i) => i.tier === tier);
    byTierAvgPrice[tier] = tierItems.reduce((s, i) => s + i.price, 0) / tierItems.length;
    byTierAvgPoints[tier] =
      tierItems.reduce((s, i) => s + getEquipmentTotalStatPoints(i), 0) / tierItems.length;
  }
  assert.ok(byTierAvgPrice.basico < byTierAvgPrice.intermediario);
  assert.ok(byTierAvgPrice.intermediario < byTierAvgPrice.profissional);
  assert.ok(byTierAvgPrice.profissional < byTierAvgPrice.elite);
  assert.ok(byTierAvgPoints.basico < byTierAvgPoints.intermediario);
  assert.ok(byTierAvgPoints.intermediario < byTierAvgPoints.profissional);
  assert.ok(byTierAvgPoints.profissional < byTierAvgPoints.elite);

  // 3. Compra, saldo insuficiente, duplicidade e auto-equipamento
  const poorChar = makeTestCharacter(100);
  const failBuy = buyEquipmentItem(poorChar, 'kimono_preto_elite');
  assert.strictEqual(failBuy.success, false);
  assert.strictEqual(failBuy.reason, 'insufficient_funds');
  assert.strictEqual(failBuy.updatedChar.money, 100);

  let richChar = makeTestCharacter(10000);
  const buyKimono = buyEquipmentItem(richChar, 'kimono_preto_elite');
  assert.strictEqual(buyKimono.success, true);
  richChar = buyKimono.updatedChar;
  assert.strictEqual(richChar.money, 10000 - 1480);
  assert.ok(richChar.ownedEquipmentIds?.includes('kimono_preto_elite'));
  assert.strictEqual(richChar.equippedEquipment?.vestuario, 'kimono_preto_elite');

  const duplicateBuy = buyEquipmentItem(richChar, 'kimono_preto_elite');
  assert.strictEqual(duplicateBuy.success, false);
  assert.strictEqual(duplicateBuy.reason, 'already_owned');

  // 4. Troca de item no mesmo slot mantém posse anterior e recalcula atributos efetivos
  const baseTech = richChar.attributes.technique;
  let effective = getEffectiveAttributes(richChar);
  assert.strictEqual(effective.technique, baseTech + 5);

  const buyBasicKimono = buyEquipmentItem(richChar, 'kimono_branco_essencial', false);
  assert.strictEqual(buyBasicKimono.success, true);
  richChar = buyBasicKimono.updatedChar;
  assert.strictEqual(richChar.equippedEquipment?.vestuario, 'kimono_preto_elite');

  richChar = equipEquipmentItem(richChar, 'kimono_branco_essencial');
  assert.strictEqual(richChar.equippedEquipment?.vestuario, 'kimono_branco_essencial');
  effective = getEffectiveAttributes(richChar);
  assert.strictEqual(effective.technique, baseTech + 1);

  richChar = unequipEquipmentSlot(richChar, 'vestuario');
  effective = getEffectiveAttributes(richChar);
  assert.strictEqual(effective.technique, baseTech);

  // 5. Múltiplos slots equipados acumulam atributos, XP e redução de lesão
  richChar = buyEquipmentItem(richChar, 'luvas_muaythai_elite').updatedChar;
  richChar = buyEquipmentItem(richChar, 'protetor_bucal_gel_pro').updatedChar;
  richChar = buyEquipmentItem(richChar, 'capacete_sparring_couro_elite').updatedChar;
  richChar = buyEquipmentItem(richChar, 'corda_velocidade_aco').updatedChar;
  richChar = equipEquipmentItem(richChar, 'kimono_preto_elite');

  const summary = getEquipmentSummary(richChar);
  assert.strictEqual(summary.equippedCount, 5);
  assert.strictEqual(summary.equippedGiColor, 'preto');
  assert.ok(summary.totalStatBonusPoints >= 40);
  assert.ok(summary.trainingXpBonusPct > 10);
  assert.ok(summary.injuryReductionPct >= 30);

  // Verifica integração real no risco de lesão em sparring
  const nakedChar = makeTestCharacter(0);
  const nakedRisk = checkSparringInjuryRisk(nakedChar, undefined, 0.99);
  const armoredRisk = checkSparringInjuryRisk(richChar, undefined, 0.99);
  assert.ok(
    armoredRisk.riskPercentage <= nakedRisk.riskPercentage,
    'Equipamento de proteção deve reduzir risco de lesão'
  );
  assert.ok(
    armoredRisk.contributingFactors.some((f) => f.includes('Proteção de equipamentos')),
    'Fator de proteção de equipamentos deve constar na avaliação'
  );

  // 6. Migração segura de saves antigos sem campos de loja
  const legacyRaw = makeTestCharacter(300) as any;
  delete legacyRaw.ownedEquipmentIds;
  delete legacyRaw.equippedEquipment;
  const migrated = migrateCharacterData(legacyRaw);
  assert.ok(Array.isArray(migrated.ownedEquipmentIds));
  assert.strictEqual(migrated.ownedEquipmentIds?.length, 0);
  assert.deepStrictEqual(migrated.equippedEquipment, {});

  console.log('✅ Todos os testes da Loja de Equipamentos passaram com sucesso!');
}

runTests();
