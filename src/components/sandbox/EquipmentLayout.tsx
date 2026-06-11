import { BUNGIE_ROOT } from '../../lib/bungie-api'
import { TIER_COLORS } from '../../types/destiny'
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

export function EquipmentLayout({ virtualLoadout, originalLoadout, onSlotClick }: EquipmentLayoutProps) {
  const slot = (name: string) => (
    <SlotButton
      slot={name}
      item={virtualLoadout[name]}
      originalItem={originalLoadout[name]}
      onClick={() => onSlotClick(name)}
    />
  )

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
    </div>
  )
}

// Export the bucket hash lookup so SandboxPage can use it
export { SLOT_TO_BUCKET }
