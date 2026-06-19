import { X, Star } from 'lucide-react'
import clsx from 'clsx'
import type { DestinyItem } from '../../types/destiny'
import {
  TIER_COLORS,
  DAMAGE_TYPE_COLORS,
  ARMOR_STAT_NAMES,
  ARMOR_STAT_HASHES,
  SOCKET_CATEGORY,
} from '../../types/destiny'
import { BUNGIE_ROOT } from '../../lib/bungie-api'

interface ItemModalProps {
  item: DestinyItem
  onClose: () => void
}

export function ItemModal({ item, onClose }: ItemModalProps) {
  const def = item.definition
  if (!def) return null

  const tier = item.tier ?? 'common'
  const tierColor = TIER_COLORS[tier]
  const damageColor = item.damageType ? DAMAGE_TYPE_COLORS[item.damageType] : undefined

  // Intrinsic / exotic perk socket
  const intrinsicSocket = item.sockets?.find(
    s => s.categoryHash === SOCKET_CATEGORY.INTRINSIC && s.plugDefinition
  )
  const isExotic = tier === 'exotic'

  // Weapon perk sockets
  const perkSockets = item.sockets?.filter(
    s => s.categoryHash === SOCKET_CATEGORY.PERKS && s.plugDefinition && s.isVisible
  ) ?? []

  // Armor perk sockets
  const armorPerkSockets = item.sockets?.filter(
    s => s.categoryHash === SOCKET_CATEGORY.ARMOR_PERKS && s.plugDefinition && s.isVisible
  ) ?? []

  // Mod sockets
  const modSockets = item.sockets?.filter(
    s => s.categoryHash === SOCKET_CATEGORY.MODS && s.plugDefinition && s.isVisible
  ) ?? []

  const armorStatOrder = [
    ARMOR_STAT_HASHES.MOBILITY,
    ARMOR_STAT_HASHES.RESILIENCE,
    ARMOR_STAT_HASHES.RECOVERY,
    ARMOR_STAT_HASHES.DISCIPLINE,
    ARMOR_STAT_HASHES.INTELLECT,
    ARMOR_STAT_HASHES.STRENGTH,
  ]

  const statValues = item.stats
    ? [
        item.stats.mobility,
        item.stats.resilience,
        item.stats.recovery,
        item.stats.discipline,
        item.stats.intellect,
        item.stats.strength,
      ]
    : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-destiny-card border border-destiny-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        style={{ borderColor: isExotic ? `${tierColor}60` : undefined }}
        onClick={e => e.stopPropagation()}
      >
        {/* Exotic glow */}
        {isExotic && (
          <div className="absolute inset-0 rounded-xl shadow-exotic pointer-events-none" />
        )}

        {/* Header */}
        <div
          className="relative flex items-start gap-4 p-4 rounded-t-xl"
          style={{
            background: def.screenshot
              ? `linear-gradient(to bottom, rgba(0,0,0,0.5), #1A1D24), url(${BUNGIE_ROOT}${def.screenshot}) center/cover`
              : undefined,
          }}
        >
          {/* Item icon */}
          <div
            className="w-16 h-16 rounded border-2 flex-shrink-0 overflow-hidden"
            style={{ borderColor: tierColor }}
          >
            {def.displayProperties?.icon ? (
              <img
                src={`${BUNGIE_ROOT}${def.displayProperties.icon}`}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-destiny-surface" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {isExotic && <Star className="w-3.5 h-3.5 flex-shrink-0" style={{ color: tierColor }} />}
              <h2 className="text-white font-bold text-lg leading-tight truncate">
                {def.displayProperties?.name}
              </h2>
            </div>
            <p className="text-sm mb-1" style={{ color: tierColor }}>
              {def.itemTypeAndTierDisplayName}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              {item.powerLevel && (
                <span className="font-bold text-white text-sm">{item.powerLevel}</span>
              )}
              {item.damageType && damageColor && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: damageColor }} />
                  <span className="capitalize">{item.damageType}</span>
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-destiny-hover text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Flavor text */}
          {def.flavorText && (
            <p className="text-xs text-gray-400 italic border-l-2 border-destiny-border pl-3">
              {def.flavorText}
            </p>
          )}

          {/* Exotic / Intrinsic perk — highlighted */}
          {intrinsicSocket?.plugDefinition && (
            <div
              className={clsx(
                'rounded-lg p-3 border',
                isExotic
                  ? 'bg-exotic/10 border-exotic/30'
                  : 'bg-destiny-surface border-destiny-border'
              )}
            >
              <div className="flex items-start gap-3">
                {intrinsicSocket.plugDefinition.displayProperties?.icon && (
                  <img
                    src={`${BUNGIE_ROOT}${intrinsicSocket.plugDefinition.displayProperties.icon}`}
                    alt=""
                    className="w-10 h-10 rounded flex-shrink-0"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    {isExotic && <Star className="w-3 h-3 text-exotic flex-shrink-0" />}
                    <p className="text-sm font-semibold" style={{ color: isExotic ? '#C4A55A' : 'white' }}>
                      {intrinsicSocket.plugDefinition.displayProperties?.name}
                    </p>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {intrinsicSocket.plugDefinition.displayProperties?.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Weapon perks */}
          {perkSockets.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Perks</h3>
              <div className="space-y-2">
                {perkSockets.map((s, i) => (
                  <PerkRow key={i} socket={s} />
                ))}
              </div>
            </div>
          )}

          {/* Armor perks */}
          {armorPerkSockets.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Armor Perks</h3>
              <div className="space-y-2">
                {armorPerkSockets.map((s, i) => (
                  <PerkRow key={i} socket={s} />
                ))}
              </div>
            </div>
          )}

          {/* Mods */}
          {modSockets.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mods</h3>
              <div className="flex flex-wrap gap-2">
                {modSockets.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-destiny-surface border border-destiny-border rounded px-2 py-1">
                    {s.plugDefinition?.displayProperties?.icon && (
                      <img
                        src={`${BUNGIE_ROOT}${s.plugDefinition.displayProperties.icon}`}
                        alt=""
                        className="w-5 h-5 rounded-sm"
                      />
                    )}
                    <span className="text-xs text-gray-300">
                      {s.plugDefinition?.displayProperties?.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Armor stats */}
          {item.stats && statValues.some(v => v > 0) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stats</h3>
                <span className="text-xs text-gray-400">
                  Total: <span className="text-white font-semibold">{item.stats.total}</span>
                </span>
              </div>
              <div className="space-y-1.5">
                {armorStatOrder.map((hash, i) => {
                  const value = statValues[i]
                  const name = ARMOR_STAT_NAMES[hash]
                  return (
                    <div key={hash} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-20 flex-shrink-0">{name}</span>
                      <div className="flex-1 bg-destiny-surface rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-legendary transition-all"
                          style={{ width: `${Math.min(value, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-white w-6 text-right">{value}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PerkRow({ socket }: { socket: import('../../types/destiny').ResolvedSocket }) {
  const plug = socket.plugDefinition
  if (!plug) return null
  return (
    <div className="flex items-start gap-2.5">
      {plug.displayProperties?.icon && (
        <img
          src={`${BUNGIE_ROOT}${plug.displayProperties.icon}`}
          alt=""
          className="w-8 h-8 rounded flex-shrink-0 bg-destiny-surface"
        />
      )}
      <div className="min-w-0">
        <p className="text-sm text-white font-medium leading-tight">{plug.displayProperties?.name}</p>
        <p className="text-xs text-gray-400 leading-snug">{plug.displayProperties?.description}</p>
      </div>
      {/* Available options */}
      {socket.reusablePlugs && socket.reusablePlugs.length > 1 && (
        <div className="flex gap-1 flex-shrink-0">
          {socket.reusablePlugs.slice(0, 4).map((p, i) => (
            <img
              key={i}
              src={`${BUNGIE_ROOT}${p.displayProperties?.icon}`}
              alt={p.displayProperties?.name}
              title={p.displayProperties?.name}
              className={clsx(
                'w-5 h-5 rounded border',
                p.hash === plug.hash
                  ? 'border-legendary'
                  : 'border-destiny-border opacity-50'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
