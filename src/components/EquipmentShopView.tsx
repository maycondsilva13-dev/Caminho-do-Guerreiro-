import React, { useMemo, useState } from 'react';
import {
  Character,
  EquipmentItem,
  EquipmentQualityTier,
  EquipmentSlot
} from '../types/game';
import {
  EQUIPMENT_CATALOG,
  EQUIPMENT_SLOT_META,
  EQUIPMENT_TIER_META
} from '../data/equipmentShopData';
import { MARTIAL_ARTS_META } from '../data/martialArtsData';
import {
  buyEquipmentItem,
  equipEquipmentItem,
  formatEquipmentAttributeBonuses,
  getCharacterEquippedMap,
  getCharacterOwnedEquipmentIds,
  getEquipmentById,
  getEquipmentSummary,
  getEquipmentTotalStatPoints,
  getTierSortWeight,
  unequipEquipmentSlot
} from '../utils/equipmentShopHelper';
import { sounds } from '../utils/audio';
import {
  Check,
  Coins,
  Shield,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react';

const SHOP_IMAGE_MODULES = import.meta.glob('/src/assets/images/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default'
}) as Record<string, string>;

function resolveShopImageSrc(imagePath: string): string | undefined {
  if (SHOP_IMAGE_MODULES[imagePath]) return SHOP_IMAGE_MODULES[imagePath];
  const fileName = imagePath.split('/').pop();
  if (!fileName) return undefined;
  const matchedKey = Object.keys(SHOP_IMAGE_MODULES).find((k) => k.endsWith(`/${fileName}`));
  return matchedKey ? SHOP_IMAGE_MODULES[matchedKey] : undefined;
}

const ProductStudioImage: React.FC<{
  item: EquipmentItem;
  className?: string;
}> = ({ item, className = '' }) => {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = resolveShopImageSrc(item.imagePath);

  if (!resolvedSrc || hasError) {
    return (
      <div
        className={`w-full aspect-[4/3] bg-zinc-900 flex flex-col items-center justify-center gap-2 text-neutral-500 border-b border-neutral-800 ${className}`}
      >
        <Shield className="w-8 h-8 text-neutral-600" />
        <span className="text-[11px] font-medium tracking-wide uppercase">
          {EQUIPMENT_SLOT_META[item.slot]?.shortLabel}
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full aspect-[4/3] bg-zinc-900 overflow-hidden ${className}`}>
      <img
        src={resolvedSrc}
        alt={item.name}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
    </div>
  );
};

interface Props {
  character: Character;
  onUpdateCharacter: (updated: Character) => void;
}

type SlotFilter = 'todos' | EquipmentSlot;
type TierFilter = 'todos' | EquipmentQualityTier;
type SortMode = 'destaque' | 'preco_asc' | 'preco_desc' | 'bonus_desc';

export const EquipmentShopView: React.FC<Props> = ({
  character,
  onUpdateCharacter
}) => {
  const [slotFilter, setSlotFilter] = useState<SlotFilter>('todos');
  const [tierFilter, setTierFilter] = useState<TierFilter>('todos');
  const [onlyOwned, setOnlyOwned] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('destaque');
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const ownedIds = useMemo(() => new Set(getCharacterOwnedEquipmentIds(character)), [character]);
  const equippedMap = useMemo(() => getCharacterEquippedMap(character), [character]);
  const equipSummary = useMemo(() => getEquipmentSummary(character), [character]);

  const orderedSlots = useMemo(
    () => Object.values(EQUIPMENT_SLOT_META).sort((a, b) => a.order - b.order),
    []
  );

  const filteredItems = useMemo(() => {
    const list = EQUIPMENT_CATALOG.filter((item) => {
      if (slotFilter !== 'todos' && item.slot !== slotFilter) return false;
      if (tierFilter !== 'todos' && item.tier !== tierFilter) return false;
      if (onlyOwned && !ownedIds.has(item.id)) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortMode === 'preco_asc') return a.price - b.price;
      if (sortMode === 'preco_desc') return b.price - a.price;
      if (sortMode === 'bonus_desc') {
        const diff = getEquipmentTotalStatPoints(b) - getEquipmentTotalStatPoints(a);
        return diff !== 0 ? diff : b.price - a.price;
      }
      // destaque: ordenado por slot e qualidade
      const slotDiff =
        (EQUIPMENT_SLOT_META[a.slot]?.order || 99) - (EQUIPMENT_SLOT_META[b.slot]?.order || 99);
      if (slotDiff !== 0) return slotDiff;
      return getTierSortWeight(a) - getTierSortWeight(b);
    });
  }, [slotFilter, tierFilter, onlyOwned, sortMode, ownedIds]);

  const showToast = (ok: boolean, text: string) => {
    setFeedback({ ok, text });
    setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  const handleBuy = (item: EquipmentItem) => {
    const res = buyEquipmentItem(character, item.id, true);
    if (!res.success) {
      showToast(false, res.message);
      return;
    }
    sounds.playGraduation();
    onUpdateCharacter(res.updatedChar);
    showToast(true, res.message);
  };

  const handleToggleEquip = (item: EquipmentItem) => {
    const isEquipped = equippedMap[item.slot] === item.id;
    if (isEquipped) {
      const updated = unequipEquipmentSlot(character, item.slot);
      sounds.playWhoosh();
      onUpdateCharacter(updated);
      showToast(true, `${item.name} guardado no armário.`);
    } else {
      const updated = equipEquipmentItem(character, item.id);
      sounds.playPunch(false);
      onUpdateCharacter(updated);
      showToast(true, `${item.name} equipado para treinos e lutas.`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Active Loadout Summary */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4" />
              <span>Loja Oficial de Equipamentos</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Armadura do Lutador & Gear de Combate
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl">
              Invista em kimonos, luvas e proteções de maior padrão técnico. Equipamentos em uso somam atributos reais em combate, aceleram o aprendizado no dojo e reduzem o risco de lesões em sparring.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-neutral-950 border border-neutral-800 rounded-xl p-3 shrink-0 tabular-nums">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">
                Saldo Atual
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-400 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 shrink-0" />
                R$ {character.money.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="border-l border-neutral-800 pl-2 sm:pl-3">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">
                Bônus Ativo
              </span>
              <span className="text-sm sm:text-base font-black text-amber-400">
                +{equipSummary.totalStatBonusPoints} pts
              </span>
            </div>
            <div className="border-l border-neutral-800 pl-2 sm:pl-3">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">
                Armário
              </span>
              <span className="text-sm sm:text-base font-black text-white">
                {ownedIds.size}/{EQUIPMENT_CATALOG.length}
              </span>
            </div>
          </div>
        </div>

        {/* 5-Slot Active Loadout Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {orderedSlots.map((slotMeta) => {
            const equippedId = equippedMap[slotMeta.id];
            const equippedItem = getEquipmentById(equippedId);
            const isSlotSelected = slotFilter === slotMeta.id;
            return (
              <button
                key={slotMeta.id}
                type="button"
                onClick={() => {
                  if (equippedItem) {
                    setSelectedItem(equippedItem);
                  } else {
                    setSlotFilter(isSlotSelected ? 'todos' : slotMeta.id);
                  }
                }}
                className={`text-left p-3 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-1.5 ${
                  equippedItem
                    ? 'bg-neutral-950 border-amber-500/35 hover:border-amber-400'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">
                    {slotMeta.shortLabel}
                  </span>
                  {equippedItem && (
                    <span className="text-[10px] font-bold text-emerald-400 tabular-nums">
                      +{getEquipmentTotalStatPoints(equippedItem)} pts
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-neutral-100 truncate">
                  {equippedItem ? equippedItem.name : 'Slot vazio · Explorar'}
                </div>
              </button>
            );
          })}
        </div>

        {(equipSummary.trainingXpBonusPct > 0 || equipSummary.injuryReductionPct > 0) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400 border-t border-neutral-800 pt-3 tabular-nums">
            <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Efeitos combinados do kit:
            </span>
            {equipSummary.trainingXpBonusPct > 0 && (
              <span className="text-sky-300 font-semibold">
                +{equipSummary.trainingXpBonusPct}% XP de evolução nos treinos
              </span>
            )}
            {equipSummary.injuryReductionPct > 0 && (
              <span className="text-emerald-300 font-semibold">
                -{equipSummary.injuryReductionPct}% risco de lesão no sparring
              </span>
            )}
            {equipSummary.equippedGiColor && (
              <span className="text-neutral-300">
                Kimono padrão: <strong className="text-white capitalize">{equipSummary.equippedGiColor}</strong>
              </span>
            )}
          </div>
        )}
      </section>

      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 ${
            feedback.ok
              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/50 border-red-500/40 text-red-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-neutral-400 hover:text-white cursor-pointer"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Sort Controls */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSlotFilter('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              slotFilter === 'todos'
                ? 'bg-amber-500 text-neutral-950'
                : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Todos ({EQUIPMENT_CATALOG.length})
          </button>
          {orderedSlots.map((slot) => {
            const count = EQUIPMENT_CATALOG.filter((i) => i.slot === slot.id).length;
            const active = slotFilter === slot.id;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSlotFilter(slot.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-neutral-950'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {slot.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['todos', 'basico', 'intermediario', 'profissional', 'elite'] as TierFilter[]).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setTierFilter(tier)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  tierFilter === tier
                    ? 'bg-neutral-200 text-neutral-950'
                    : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                }`}
              >
                {tier === 'todos' ? 'Todas Qualidades' : EQUIPMENT_TIER_META[tier].label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setOnlyOwned((prev) => !prev)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                onlyOwned
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
            >
              Meu Armário ({ownedIds.size})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="shop-sort" className="text-[11px] text-neutral-500 font-semibold">
              Ordenar:
            </label>
            <select
              id="shop-sort"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="destaque">Categoria & Qualidade</option>
              <option value="preco_asc">Menor Preço</option>
              <option value="preco_desc">Maior Preço</option>
              <option value="bonus_desc">Maior Bônus de Atributos</option>
            </select>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center space-y-2">
          <p className="text-sm font-bold text-neutral-300">
            Nenhum equipamento corresponde aos filtros atuais.
          </p>
          <button
            type="button"
            onClick={() => {
              setSlotFilter('todos');
              setTierFilter('todos');
              setOnlyOwned(false);
            }}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredItems.map((item) => {
            const isOwned = ownedIds.has(item.id);
            const isEquipped = equippedMap[item.slot] === item.id;
            const canAfford = character.money >= item.price;
            const tierMeta = EQUIPMENT_TIER_META[item.tier];
            const slotMeta = EQUIPMENT_SLOT_META[item.slot];
            const statBonuses = formatEquipmentAttributeBonuses(item);
            const totalPts = getEquipmentTotalStatPoints(item);

            return (
              <article
                key={item.id}
                className={`group bg-neutral-900 border rounded-2xl overflow-hidden flex flex-col transition-colors ${
                  isEquipped
                    ? 'border-amber-500/60 shadow-lg shadow-amber-500/5'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className="text-left cursor-pointer focus:outline-none"
                  aria-label={`Ver detalhes de ${item.name}`}
                >
                  <ProductStudioImage item={item} />
                </button>

                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                      <span className="text-neutral-400 truncate">
                        {slotMeta.shortLabel} ·{' '}
                        <span className={tierMeta.textClass}>{tierMeta.label}</span> · {item.brand}
                      </span>
                      {isEquipped && (
                        <span className="text-amber-400 font-bold shrink-0">Em uso</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="text-left cursor-pointer"
                    >
                      <h2 className="text-base font-black text-white group-hover:text-amber-400 transition-colors leading-snug">
                        {item.name}
                      </h2>
                    </button>

                    <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Clean inline stat bonuses */}
                  <div className="text-xs text-neutral-300 space-y-1 border-t border-neutral-800/80 pt-2.5">
                    <div className="flex items-center justify-between gap-2 font-bold">
                      <span className="text-neutral-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        Bônus de Habilidades
                      </span>
                      <span className="text-emerald-400 tabular-nums">+{totalPts} pts</span>
                    </div>
                    <div className="text-[11px] text-neutral-300 leading-relaxed tabular-nums">
                      {statBonuses.map((b) => `+${b.value} ${b.label}`).join(' · ')}
                      {item.trainingXpBonusPct ? ` · +${item.trainingXpBonusPct}% XP treino` : ''}
                      {item.injuryReductionPct ? ` · -${item.injuryReductionPct}% lesão` : ''}
                    </div>
                  </div>

                  {/* Card Footer pinned to baseline */}
                  <div className="mt-auto pt-3 border-t border-neutral-800 flex items-center justify-between gap-3">
                    <div className="tabular-nums">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">
                        {isOwned ? 'Adquirido' : 'Valor'}
                      </span>
                      <span className="text-base font-black text-white">
                        R$ {item.price.toLocaleString('pt-BR')}
                      </span>
                    </div>

                    {isOwned ? (
                      <button
                        type="button"
                        onClick={() => handleToggleEquip(item)}
                        className={`min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isEquipped
                            ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                            : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isEquipped ? 'Desequipar' : 'Equipar'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBuy(item)}
                        disabled={!canAfford}
                        className={`min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                          canAfford
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
                            : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                        }`}
                      >
                        {canAfford ? 'Comprar' : 'Saldo insuficiente'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Detail & Comparison Modal */}
      {selectedItem && (() => {
        const isOwned = ownedIds.has(selectedItem.id);
        const isEquipped = equippedMap[selectedItem.slot] === selectedItem.id;
        const canAfford = character.money >= selectedItem.price;
        const currentInSlot = getEquipmentById(equippedMap[selectedItem.slot]);
        const tierMeta = EQUIPMENT_TIER_META[selectedItem.tier];
        const slotMeta = EQUIPMENT_SLOT_META[selectedItem.slot];
        const bonuses = formatEquipmentAttributeBonuses(selectedItem);
        const totalPts = getEquipmentTotalStatPoints(selectedItem);
        const currentPts = currentInSlot ? getEquipmentTotalStatPoints(currentInSlot) : 0;
        const deltaPts = totalPts - currentPts;

        return (
          <div
            className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
            onClick={() => setSelectedItem(null)}
          >
            <div
              className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <ProductStudioImage item={selectedItem} />
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-700 text-neutral-200 flex items-center justify-center cursor-pointer"
                  aria-label="Fechar detalhes"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-neutral-400">
                      {slotMeta.label} ·{' '}
                      <span className={tierMeta.textClass}>{tierMeta.label}</span> ·{' '}
                      {selectedItem.brand}
                    </div>
                    <h2 className="text-xl font-black text-white mt-0.5">
                      {selectedItem.name}
                    </h2>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">
                      Preço de Tabela
                    </span>
                    <span className="text-xl font-black text-emerald-400">
                      R$ {selectedItem.price.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-neutral-300 leading-relaxed">
                  {selectedItem.description}
                </p>

                {selectedItem.specs && (
                  <div className="text-xs text-neutral-400 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5">
                    <span className="text-neutral-500 font-bold">Especificações: </span>
                    {selectedItem.specs}
                  </div>
                )}

                {selectedItem.artAffinity && selectedItem.artAffinity.length > 0 && (
                  <div className="text-xs text-neutral-400">
                    <span className="text-neutral-500 font-bold">Ideal para: </span>
                    {selectedItem.artAffinity
                      .map((art) => MARTIAL_ARTS_META[art]?.name || art)
                      .join(' · ')}
                  </div>
                )}

                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-neutral-300">Impacto Técnico no Lutador</span>
                    <span className="text-emerald-400 tabular-nums">+{totalPts} pts totais</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs tabular-nums">
                    {bonuses.map((b) => (
                      <div
                        key={b.key}
                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between"
                      >
                        <span className="text-neutral-300">{b.label}</span>
                        <span className="font-black text-emerald-400">+{b.value}</span>
                      </div>
                    ))}
                    {selectedItem.trainingXpBonusPct && (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                        <span className="text-neutral-300">XP Treino</span>
                        <span className="font-black text-sky-400">
                          +{selectedItem.trainingXpBonusPct}%
                        </span>
                      </div>
                    )}
                    {selectedItem.injuryReductionPct && (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                        <span className="text-neutral-300">Risco Lesão</span>
                        <span className="font-black text-amber-400">
                          -{selectedItem.injuryReductionPct}%
                        </span>
                      </div>
                    )}
                  </div>

                  {currentInSlot && currentInSlot.id !== selectedItem.id && (
                    <div className="text-xs text-neutral-400 pt-2 border-t border-neutral-800 flex items-center justify-between gap-2 tabular-nums">
                      <span>
                        Comparado ao atual ({currentInSlot.name}):
                      </span>
                      <span
                        className={`font-black ${
                          deltaPts > 0
                            ? 'text-emerald-400'
                            : deltaPts < 0
                            ? 'text-red-400'
                            : 'text-neutral-300'
                        }`}
                      >
                        {deltaPts > 0 ? `+${deltaPts}` : deltaPts} pts de atributo
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold cursor-pointer"
                  >
                    Fechar
                  </button>
                  {isOwned ? (
                    <button
                      type="button"
                      onClick={() => handleToggleEquip(selectedItem)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer ${
                        isEquipped
                          ? 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600'
                          : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                      }`}
                    >
                      {isEquipped ? 'Desequipar do Kit' : 'Equipar Agora'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBuy(selectedItem)}
                      disabled={!canAfford}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer ${
                        canAfford
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
                          : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                      }`}
                    >
                      {canAfford
                        ? `Comprar e Equipar · R$ ${selectedItem.price.toLocaleString('pt-BR')}`
                        : 'Saldo Insuficiente'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
