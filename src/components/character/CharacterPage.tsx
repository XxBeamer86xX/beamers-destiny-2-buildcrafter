import { useEffect } from 'react'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { useProfile } from '../../hooks/useProfile'
import { useAppStore } from '../../store/appStore'
import { ItemCard } from '../item/ItemCard'
import { SubclassPanel } from './SubclassPanel'
import { BUNGIE_ROOT } from '../../lib/bungie-api'
import { CLASS_TYPE_MAP, CLASS_NAMES, DAMAGE_TYPE_COLORS, BUCKET_HASH_MAP } from '../../types/destiny'
import type { DestinyItem } from '../../types/destiny'

const SLOT_LABELS: Record<string, string> = {
  kinetic: 'Kinetic',
  energy: 'Energy',
  power: 'Power',
  helmet: 'Helmet',
  gauntlets: 'Gauntlets',
  chest: 'Chest Armor',
  legs: 'Leg Armor',
  classItem: 'Class Item',
  ghost: 'Ghost',
  vehicle: 'Sparrow',
  ship: 'Ship',
  emblem: 'Emblem',
}

const WEAPON_BUCKETS = [1498876634, 2465295065, 953998645]
const ARMOR_BUCKETS = [3448274439, 3551918588, 14239492, 20886954, 1585787867]
const SUBCLASS_BUCKET = 3284755031

export function CharacterPage() {
  const { data: profile, isLoading, error, refetch } = useProfile()
  const { selectedCharacterId, setSelectedCharacter } = useAppStore()

  // Auto-select first character
  useEffect(() => {
    if (!selectedCharacterId && profile?.characters.length) {
      setSelectedCharacter(profile.characters[0].characterId)
    }
  }, [selectedCharacterId, profile, setSelectedCharacter])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-legendary animate-spin" />
          <p className="text-gray-400 text-sm">Loading character data…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-red-400 font-medium">Failed to load character</p>
          <p className="text-gray-500 text-sm">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-destiny-card border border-destiny-border rounded-lg text-sm hover:bg-destiny-hover transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const charId = selectedCharacterId ?? profile.characters[0]?.characterId
  const character = profile.characters.find(c => c.characterId === charId)
  const equipped = profile.characterEquipped[charId] ?? []

  if (!character) return null

  const equippedByBucket = new Map(equipped.map(i => [i.bucketHash, i]))

  const weapons = WEAPON_BUCKETS.map(b => equippedByBucket.get(b))
  const armor = ARMOR_BUCKETS.map(b => equippedByBucket.get(b))
  const subclassItem = equippedByBucket.get(SUBCLASS_BUCKET)

  // Inventory items for this character (not equipped)
  const inventory = profile.characterInventory[charId] ?? []

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Character header */}
      <CharacterHeader character={character} equipped={equipped} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Equipped gear */}
        <div className="xl:col-span-2 space-y-4">
          {/* Weapons */}
          <GearSection title="Weapons" items={weapons} buckets={WEAPON_BUCKETS} />

          {/* Armor */}
          <GearSection title="Armor" items={armor} buckets={ARMOR_BUCKETS} />

          {/* Character inventory */}
          {inventory.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                In Inventory ({inventory.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {inventory.slice(0, 20).map((item, i) => (
                  <ItemCard key={item.instanceId ?? i} item={item} size="sm" showPower={false} />
                ))}
                {inventory.length > 20 && (
                  <div className="w-12 h-12 bg-destiny-card border border-destiny-border rounded flex items-center justify-center">
                    <span className="text-xs text-gray-500">+{inventory.length - 20}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Subclass panel */}
        <div className="space-y-4">
          {subclassItem ? (
            <SubclassPanel subclassItem={subclassItem} />
          ) : (
            <div className="bg-destiny-card border border-dashed border-destiny-border rounded-xl p-8 text-center">
              <p className="text-gray-500 text-sm">No subclass data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CharacterHeader({
  character,
  equipped,
}: {
  character: import('../../types/bungie').DestinyCharacterComponent
  equipped: DestinyItem[]
}) {
  const cls = CLASS_TYPE_MAP[character.classType]
  const avgPower = equipped.length
    ? Math.round(equipped.reduce((sum, i) => sum + (i.powerLevel ?? 0), 0) / equipped.filter(i => i.powerLevel).length)
    : 0

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-destiny-border"
      style={{
        background: character.emblemBackgroundPath
          ? `linear-gradient(to right, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.3)), url(${BUNGIE_ROOT}${character.emblemBackgroundPath}) center/cover`
          : 'linear-gradient(to right, #1A1D24, #13151A)',
      }}
    >
      <div className="p-4 flex items-center gap-4">
        {character.emblemPath && (
          <img
            src={`${BUNGIE_ROOT}${character.emblemPath}`}
            alt=""
            className="w-12 h-12 rounded border border-destiny-border flex-shrink-0"
          />
        )}
        <div>
          <h1 className="text-xl font-bold text-white">{CLASS_NAMES[cls]}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-300 mt-0.5">
            <span className="text-exotic font-bold text-lg">{character.light}</span>
            <span className="text-gray-500">·</span>
            <span>Avg {avgPower}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function GearSection({
  title,
  items,
  buckets,
}: {
  title: string
  items: (DestinyItem | undefined)[]
  buckets: number[]
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item, i) => {
          const slotName = BUCKET_HASH_MAP[buckets[i]] ?? 'item'
          const label = SLOT_LABELS[slotName] ?? slotName
          return (
            <div key={buckets[i]} className="flex items-center gap-3">
              {item ? (
                <>
                  <ItemCard item={item} size="lg" showPower />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {item.definition?.displayProperties?.name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.definition?.itemTypeDisplayName ?? label}
                      {item.damageType && (
                        <span
                          className="ml-2 capitalize"
                          style={{ color: DAMAGE_TYPE_COLORS[item.damageType] }}
                        >
                          {item.damageType}
                        </span>
                      )}
                    </p>
                    {/* Armor stats summary */}
                    {item.stats && (
                      <div className="flex gap-2 mt-1">
                        {[
                          item.stats.mobility,
                          item.stats.resilience,
                          item.stats.recovery,
                          item.stats.discipline,
                          item.stats.intellect,
                          item.stats.strength,
                        ].map((v, si) => (
                          <span key={si} className="text-xs text-gray-400">
                            {v}
                          </span>
                        ))}
                        <span className="text-xs text-gray-500 ml-1">({item.stats.total})</span>
                      </div>
                    )}
                  </div>
                  {/* Exotic perk name quick-ref */}
                  {item.tier === 'exotic' && (() => {
                    const intrinsic = item.sockets?.find(
                      s => s.categoryHash === 1744546145 && s.plugDefinition
                    )
                    return intrinsic?.plugDefinition ? (
                      <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded bg-exotic/10 border border-exotic/25 max-w-[180px]">
                        {intrinsic.plugDefinition.displayProperties?.icon && (
                          <img
                            src={`${BUNGIE_ROOT}${intrinsic.plugDefinition.displayProperties.icon}`}
                            alt=""
                            className="w-5 h-5 rounded-sm flex-shrink-0"
                          />
                        )}
                        <span className="text-xs text-exotic leading-tight line-clamp-1">
                          {intrinsic.plugDefinition.displayProperties?.name}
                        </span>
                      </div>
                    ) : null
                  })()}
                </>
              ) : (
                <div className="flex items-center gap-3 opacity-30">
                  <div className="w-20 h-20 rounded border border-dashed border-destiny-border bg-destiny-card flex items-center justify-center">
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                  <span className="text-sm text-gray-600">Empty</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
