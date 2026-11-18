import {
  Character,
  EquipmentItem,
  EquipmentSlot,
  FighterAttributes,
  OfficialGiColor
} from '../types/game';
import {
  ATTRIBUTE_SHORT_LABELS,
  EQUIPMENT_CATALOG,
  EQUIPMENT_TIER_META
} from '../data/equipmentShopData';

export interface EquipmentBonusSummary {
  bonuses: FighterAttributes;
  totalStatBonusPoints: number;
  trainingXpBonusPct: number;
  injuryReductionPct: number;
  equippedGiColor?: OfficialGiColor;
  equippedItems: Partial<Record<EquipmentSlot, EquipmentItem>>;
  equippedCount: number;
}

export interface PurchaseEquipmentResult {
  success: boolean;
  reason?: 'not_found' | 'already_owned' | 'insufficient_funds';
  message: string;
  updatedChar: Character;
  item?: EquipmentItem;
}

const EMPTY_BONUSES: FighterAttributes = {
  strength: 0,
  speed: 0,
  stamina: 0,
  durability: 0,
  flexibility: 0,
  fightIq: 0,
  technique: 0,
  mentalFocus: 0
};

export function getEquipmentCatalog(): EquipmentItem[] {
  return EQUIPMENT_CATALOG;
}

export function getEquipmentById(id?: string | null): EquipmentItem | undefined {
  if (!id) return undefined;
  return EQUIPMENT_CATALOG.find((item) => item.id === id);
}

export function getEquipmentTotalStatPoints(item: EquipmentItem): number {
  return Object.values(item.attributeBonuses).reduce((sum, val) => sum + (val || 0), 0);
}

export function formatEquipmentAttributeBonuses(item: EquipmentItem): Array<{
  key: keyof FighterAttributes;
  label: string;
  value: number;
}> {
  return (Object.entries(item.attributeBonuses) as Array<[keyof FighterAttributes, number]>)
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .map(([key, value]) => ({
      key,
      label: ATTRIBUTE_SHORT_LABELS[key] || key,
      value
    }));
}

export function getCharacterOwnedEquipmentIds(character?: Character | null): string[] {
  if (!character || !Array.isArray(character.ownedEquipmentIds)) return [];
  const validSet = new Set(EQUIPMENT_CATALOG.map((i) => i.id));
  const unique = new Set<string>();
  for (const id of character.ownedEquipmentIds) {
    if (validSet.has(id)) unique.add(id);
  }
  return Array.from(unique);
}

export function getCharacterEquippedMap(
  character?: Character | null
): Partial<Record<EquipmentSlot, string>> {
  if (!character || !character.equippedEquipment) return {};
  const owned = new Set(getCharacterOwnedEquipmentIds(character));
  const result: Partial<Record<EquipmentSlot, string>> = {};
  for (const [slotKey, itemId] of Object.entries(character.equippedEquipment) as Array<
    [EquipmentSlot, string | undefined]
  >) {
    if (!itemId || !owned.has(itemId)) continue;
    const item = getEquipmentById(itemId);
    if (item && item.slot === slotKey) {
      result[slotKey] = itemId;
    }
  }
  return result;
}

export function getEquippedItems(character?: Character | null): EquipmentItem[] {
  const map = getCharacterEquippedMap(character);
  const items: EquipmentItem[] = [];
  for (const itemId of Object.values(map)) {
    const item = getEquipmentById(itemId);
    if (item) items.push(item);
  }
  return items;
}

export function getEquipmentSummary(character?: Character | null): EquipmentBonusSummary {
  const bonuses: FighterAttributes = { ...EMPTY_BONUSES };
  const equippedItems: Partial<Record<EquipmentSlot, EquipmentItem>> = {};
  let totalStatBonusPoints = 0;
  let trainingXpBonusPct = 0;
  let injuryReductionPct = 0;
  let equippedGiColor: OfficialGiColor | undefined;

  const list = getEquippedItems(character);
  for (const item of list) {
    equippedItems[item.slot] = item;
    for (const [key, val] of Object.entries(item.attributeBonuses) as Array<
      [keyof FighterAttributes, number | undefined]
    >) {
      if (typeof val === 'number' && val > 0) {
        bonuses[key] += val;
        totalStatBonusPoints += val;
      }
    }
    if (item.trainingXpBonusPct) {
      trainingXpBonusPct += item.trainingXpBonusPct;
    }
    if (item.injuryReductionPct) {
      injuryReductionPct += item.injuryReductionPct;
    }
    if (item.slot === 'vestuario' && item.isGiColor) {
      equippedGiColor = item.isGiColor;
    }
  }

  return {
    bonuses,
    totalStatBonusPoints,
    trainingXpBonusPct: Math.min(35, trainingXpBonusPct),
    injuryReductionPct: Math.min(45, injuryReductionPct),
    equippedGiColor,
    equippedItems,
    equippedCount: list.length
  };
}

export function getEffectiveAttributes(character?: Character | null): FighterAttributes {
  const base: FighterAttributes = character?.attributes || {
    strength: 20,
    speed: 20,
    stamina: 20,
    durability: 20,
    flexibility: 20,
    fightIq: 20,
    technique: 20,
    mentalFocus: 20
  };
  const { bonuses } = getEquipmentSummary(character);
  return {
    strength: Math.min(99, Math.round((base.strength + bonuses.strength) * 10) / 10),
    speed: Math.min(99, Math.round((base.speed + bonuses.speed) * 10) / 10),
    stamina: Math.min(99, Math.round((base.stamina + bonuses.stamina) * 10) / 10),
    durability: Math.min(99, Math.round((base.durability + bonuses.durability) * 10) / 10),
    flexibility: Math.min(99, Math.round((base.flexibility + bonuses.flexibility) * 10) / 10),
    fightIq: Math.min(99, Math.round((base.fightIq + bonuses.fightIq) * 10) / 10),
    technique: Math.min(99, Math.round((base.technique + bonuses.technique) * 10) / 10),
    mentalFocus: Math.min(99, Math.round((base.mentalFocus + bonuses.mentalFocus) * 10) / 10)
  };
}

export function buyEquipmentItem(
  character: Character,
  itemId: string,
  autoEquip: boolean = true
): PurchaseEquipmentResult {
  const item = getEquipmentById(itemId);
  if (!item) {
    return {
      success: false,
      reason: 'not_found',
      message: 'Equipamento não encontrado no catálogo da loja.',
      updatedChar: character
    };
  }

  const owned = getCharacterOwnedEquipmentIds(character);
  if (owned.includes(item.id)) {
    return {
      success: false,
      reason: 'already_owned',
      message: `Você já possui ${item.name} no seu armário.`,
      updatedChar: character,
      item
    };
  }

  if ((character.money || 0) < item.price) {
    return {
      success: false,
      reason: 'insufficient_funds',
      message: `Saldo insuficiente! Faltam R$ ${(item.price - (character.money || 0)).toLocaleString('pt-BR')} para comprar ${item.name}.`,
      updatedChar: character,
      item
    };
  }

  const updated = JSON.parse(JSON.stringify(character)) as Character;
  updated.money = Math.max(0, Math.round((updated.money - item.price) * 100) / 100);
  updated.ownedEquipmentIds = [...owned, item.id];
  updated.equippedEquipment = { ...getCharacterEquippedMap(updated) };

  let equippedNotice = '';
  if (autoEquip) {
    updated.equippedEquipment[item.slot] = item.id;
    equippedNotice = ' e já equipado no seu kit!';
  }

  return {
    success: true,
    message: `${item.name} adquirido por R$ ${item.price.toLocaleString('pt-BR')}${equippedNotice}`,
    updatedChar: updated,
    item
  };
}

export function equipEquipmentItem(character: Character, itemId: string): Character {
  const item = getEquipmentById(itemId);
  const owned = getCharacterOwnedEquipmentIds(character);
  if (!item || !owned.includes(item.id)) return character;

  const updated = JSON.parse(JSON.stringify(character)) as Character;
  updated.ownedEquipmentIds = owned;
  updated.equippedEquipment = {
    ...getCharacterEquippedMap(updated),
    [item.slot]: item.id
  };
  return updated;
}

export function unequipEquipmentSlot(character: Character, slot: EquipmentSlot): Character {
  const updated = JSON.parse(JSON.stringify(character)) as Character;
  const map = { ...getCharacterEquippedMap(updated) };
  delete map[slot];
  updated.equippedEquipment = map;
  return updated;
}

export function getTierSortWeight(item: EquipmentItem): number {
  return EQUIPMENT_TIER_META[item.tier]?.rank ?? 1;
}
