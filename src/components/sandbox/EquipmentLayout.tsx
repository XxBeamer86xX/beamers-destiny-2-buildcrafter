import { BUNGIE_ROOT } from '../../lib/bungie-api'
import { SOCKET_CATEGORY, TIER_COLORS } from '../../types/destiny'
import type { DestinyItem } from '../../types/destiny'

interface EquipmentLayoutProps {
  virtualLoadout: Partial<Record<string, DestinyItem>>
  originalLoadout: Partial<Record<string, DestinyItem>>
  onSlotClick: (slot: string) => void
}

// Slot → bucket hash (reverse of BUCKET_HASH_MAP)
const SLOT_TO_BUCKET: Record<string, number> = {
  kinetic: 1498876634,
  energy: 2465295065,
  power: 953998645,
  helmet: 3448274439,
  gauntlets: 3551918588,
  chest: 14239492,
  legs: 20886954,
  classItem: 1585787867,
}

const SLOT_LABELS: Record<string, string> = {
  helmet: 'Helmet',
  chest: 'Chest',
  gauntlets: 'Arms',
  classItem: 'Class',
  legs: 'Legs',
  kinetic: 'Kinetic',
  energy: 'Energy',
  power: 'Power',
}

interface SlotButtonProps {
  slot: string
  item: DestinyItem | undefined
  originalItem: DestinyItem | undefined
  onClick: () => void
}

function SlotButton({ slot, item, originalItem, onClick }: SlotButtonProps) {
  const icon = item?.definition?.displayProperties?.icon
  const tierColor = item?.tier ? TIER_COLORS[item.tier] : '#374151'
  const power = item?.powerLevel

  // Detect if this slot differs from originally equipped
  const isSwapped = item?.instanceId !== originalItem?.instanceId

  return (
    <button
      onClick={onClick}
      title={SLOT_LABELS[slot] ?? slot}
      className="relative group w-16 h-16 rounded-lg overflow-hidden bg-destiny-surface transition-all hover:scale-105 hover:brightness-110 focus:outline-none"
      style={{ border: `2px solid ${tierColor}` }}
    >
      {item && icon ? (
        <img
          src={`${BUNGIE_ROOT}${icon}`}
          alt={item.definition?.displayProperties?.name ?? slot}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-gray-700 text-xs text-center leading-tight px-1">
            {SLOT_LABELS[slot] ?? slot}
          </span>
        </div>
      )}

      {/* Power overlay bottom-right */}
      {power !== undefined && (
        <div className="absolute bottom-0.5 right-0.5 bg-black/70 rounded px-0.5">
          <span className="text-exotic text-[10px] font-bold leading-none">{power}</span>
        </div>
      )}

      {/* Swap indicator — glowing dot top-right when item differs from equipped */}
      {isSwapped && (
        <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-arc shadow-[0_0_6px_2px_rgba(121,200,226,0.8)]" />
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
    </button>
  )
}

const ARMOR_SLOTS = ['helmet', 'gauntlets', 'chest', 'legs', 'classItem']
const WEAPON_SLOTS = ['kinetic', 'energy', 'power']

interface ExoticPerkEntry {
  item: DestinyItem
  perks: NonNullable<DestinyItem['sockets']>[number]['plugDefinition'][]
}

function collectExoticPerks(virtualLoadout: Partial<Record<string, DestinyItem>>): ExoticPerkEntry[] {
  const entries: ExoticPerkEntry[] = []

  // Armor
  for (const slotName of ARMOR_SLOTS) {
    const item = virtualLoadout[slotName]
    if (!item || item.tier !== 'exotic') continue
    const perks = (item.sockets ?? [])
      .filter(s => s.categoryHash === SOCKET_CATEGORY.INTRINSIC && s.plugDefinition && (s.plugDefinition.displayProperties?.description?.length ?? 0) > 20)
      .map(s => s.plugDefinition)
    if (perks.length > 0) entries.push({ item, perks })
  }

  // Weapons
  for (const slotName of WEAPON_SLOTS) {
    const item = virtualLoadout[slotName]
    if (!item || item.tier !== 'exotic') continue
    const perks: ExoticPerkEntry['perks'] = []
    for (const s of item.sockets ?? []) {
      if (!s.plugDefinition) continue
      const plug = s.plugDefinition
      const dispDesc = plug.displayProperties?.description ?? ''
      // Intrinsic sockets with a long description
      if (s.categoryHash === SOCKET_CATEGORY.INTRINSIC && dispDesc.length > 30) {
        perks.push(plug)
        continue
      }
      // Perk sockets with a long displayProperties description
      if (s.categoryHash === SOCKET_CATEGORY.PERKS && dispDesc.length > 30) {
        perks.push(plug)
        continue
      }
      // Catalyst sockets
      const plugCat = (plug as { plugCategoryIdentifier?: string }).plugCategoryIdentifier ?? ''
      if (plug.displayProperties?.name?.includes('Catalyst') || plugCat.includes('catalyst')) {
        perks.push(plug)
      }
    }
    if (perks.length > 0) entries.push({ item, perks })
  }

  return entries
}

export function EquipmentLayout({ virtualLoadout, originalLoadout, onSlotClick }: EquipmentLayoutProps) {
  const slot = (name: string) => (
    <SlotButton
      slot={name}
      item={virtualLoadout[name]}
      originalItem={originalLoadout[name]}
      onClick={() => onSlotClick(name)}
    />
  )

  const exoticEntries = collectExoticPerks(virtualLoadout)

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      {/* Helmet — centered top */}
      <div className="flex justify-center">
        {slot('helmet')}
      </div>

      {/* Chest row: classItem | chest | gauntlets */}
      <div className="flex items-center gap-2">
        {slot('classItem')}
        {slot('chest')}
        {slot('gauntlets')}
      </div>

      {/* Legs — centered */}
      <div className="flex justify-center">
        {slot('legs')}
      </div>

      {/* Divider */}
      <div className="w-full border-t border-destiny-border my-1" />

      {/* Weapons row */}
      <div className="flex gap-2">
        {slot('kinetic')}
        {slot('energy')}
        {slot('power')}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-1">
        {['kinetic', 'energy', 'power'].map(s => (
          <span key={s} className="text-[10px] text-gray-600 capitalize">{SLOT_LABELS[s]}</span>
        ))}
      </div>

      {/* Exotic Perks */}
      {exoticEntries.length > 0 && (
        <>
          <div className="w-full border-t border-destiny-border my-1" />
          <div className="w-full">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Exotic Perks</p>
            <div className="max-h-64 overflow-y-auto space-y-3">
              {exoticEntries.map((entry, ei) => {
                const icon = entry.item.definition?.displayProperties?.icon
                return (
                  <div key={ei} className="space-y-1.5 mt-2">
                    {/* Item header */}
                    <div className="flex items-center gap-1.5">
                      <div
                        style={{ borderColor: TIER_COLORS[entry.item.tier ?? 'legendary'] }}
                        className="w-6 h-6 rounded border overflow-hidden flex-shrink-0"
                      >
                        {icon && <img src={`${BUNGIE_ROOT}${icon}`} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <span className="text-xs font-bold text-exotic">
                        {entry.item.definition?.displayProperties?.name}
                      </span>
                    </div>
                    {/* Each perk */}
                    {entry.perks.map((perk, i) => (
                      <div key={i} className="pl-2 border-l-2 border-exotic/30">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {perk?.displayProperties?.icon && (
                            <img
                              src={`${BUNGIE_ROOT}${perk.displayProperties.icon}`}
                              className="w-4 h-4 rounded-sm flex-shrink-0"
                              alt=""
                            />
                          )}
                          <span className="text-[11px] font-semibold text-exotic/90">
                            {perk?.displayProperties?.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">
                          {perk?.displayProperties?.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Export the bucket hash lookup so SandboxPage can use it
export { SLOT_TO_BUCKET }
