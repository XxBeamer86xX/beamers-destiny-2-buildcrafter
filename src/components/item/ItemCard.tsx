import { useState } from 'react'
import { Lock } from 'lucide-react'
import clsx from 'clsx'
import type { DestinyItem } from '../../types/destiny'
import { TIER_COLORS, DAMAGE_TYPE_COLORS } from '../../types/destiny'
import { BUNGIE_ROOT } from '../../lib/bungie-api'
import { ItemModal } from './ItemModal'

interface ItemCardProps {
  item: DestinyItem
  size?: 'sm' | 'md' | 'lg'
  showPower?: boolean
  onSlotClick?: () => void
  slotLabel?: string
  dimmed?: boolean
}

export function ItemCard({ item, size = 'md', showPower = true, onSlotClick, slotLabel, dimmed }: ItemCardProps) {
  const [showModal, setShowModal] = useState(false)
  const def = item.definition
  const tier = item.tier ?? 'common'
  const tierColor = TIER_COLORS[tier]
  const damageColor = item.damageType ? DAMAGE_TYPE_COLORS[item.damageType] : undefined

  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  }

  if (!def) {
    return (
      <div
        onClick={onSlotClick}
        className={clsx(
          sizes[size],
          'bg-destiny-card border border-dashed border-destiny-border rounded flex items-center justify-center cursor-pointer hover:border-legendary/40 transition-colors flex-shrink-0'
        )}
      >
        {slotLabel && <span className="text-xs text-gray-600 text-center leading-tight px-1">{slotLabel}</span>}
      </div>
    )
  }

  const iconPath = def.displayProperties?.icon

  return (
    <>
      <div
        className={clsx(
          'relative flex-shrink-0 cursor-pointer group',
          sizes[size],
          dimmed && 'opacity-50'
        )}
        onClick={() => setShowModal(true)}
        title={def.displayProperties?.name}
      >
        {/* Tier border */}
        <div
          className="absolute inset-0 rounded border-2 z-10 pointer-events-none"
          style={{ borderColor: tierColor }}
        />

        {/* Exotic glow */}
        {tier === 'exotic' && (
          <div className="absolute inset-0 rounded shadow-exotic pointer-events-none z-0" />
        )}

        {/* Icon */}
        {iconPath ? (
          <img
            src={`${BUNGIE_ROOT}${iconPath}`}
            alt={def.displayProperties.name}
            className="w-full h-full rounded object-cover bg-destiny-card"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full rounded bg-destiny-card flex items-center justify-center">
            <span className="text-xs text-gray-500">?</span>
          </div>
        )}

        {/* Watermark (exotic/season icon) */}
        {def.iconWatermark && (
          <img
            src={`${BUNGIE_ROOT}${def.iconWatermark}`}
            alt=""
            className="absolute bottom-0 right-0 w-1/3 h-1/3 pointer-events-none z-20"
          />
        )}

        {/* Power level */}
        {showPower && item.powerLevel && size !== 'sm' && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-center z-20 rounded-b">
            <span className="text-xs font-bold text-white">{item.powerLevel}</span>
          </div>
        )}

        {/* Damage type dot */}
        {damageColor && size === 'lg' && (
          <div
            className="absolute top-1 left-1 w-2 h-2 rounded-full z-20"
            style={{ backgroundColor: damageColor }}
          />
        )}

        {/* Lock indicator */}
        {(item.state & 1) !== 0 && (
          <div className="absolute top-0.5 right-0.5 z-20">
            <Lock className="w-2.5 h-2.5 text-white/60" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded z-10" />
      </div>

      {showModal && <ItemModal item={item} onClose={() => setShowModal(false)} />}
    </>
  )
}
