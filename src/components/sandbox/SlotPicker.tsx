import { useState, useMemo } from 'react'
import { X, Search } from 'lucide-react'
import { BUNGIE_ROOT } from '../../lib/bungie-api'
import { TIER_COLORS, BUCKET_HASH_MAP } from '../../types/destiny'
import type { DestinyItem } from '../../types/destiny'

interface SlotPickerProps {
  bucketHash: number
  currentItem: DestinyItem | undefined
  allItems: DestinyItem[]
  onSelect: (item: DestinyItem | null) => void
  onClose: () => void
}

export function SlotPicker({ bucketHash, currentItem, allItems, onSelect, onClose }: SlotPickerProps) {
  const [query, setQuery] = useState('')

  const slotName = BUCKET_HASH_MAP[bucketHash] ?? 'slot'

  const filtered = useMemo(() => {
    const inSlot = allItems.filter(i => i.bucketHash === bucketHash)
    const sorted = [...inSlot].sort((a, b) => (b.powerLevel ?? 0) - (a.powerLevel ?? 0))
    if (!query.trim()) return sorted
    const q = query.toLowerCase()
    return sorted.filter(i =>
      i.definition?.displayProperties?.name?.toLowerCase().includes(q)
    )
  }, [allItems, bucketHash, query])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-destiny-card border border-destiny-border rounded-xl w-full max-w-lg mx-4 flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-destiny-border">
          <h2 className="text-sm font-semibold text-white capitalize">
            Swap {slotName.replace(/([A-Z])/g, ' $1').trim()}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-destiny-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-destiny-surface border border-destiny-border rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-legendary/50"
              autoFocus
            />
          </div>
        </div>

        {/* Item list */}
        <div className="overflow-y-auto flex-1 px-2 py-2 space-y-1">
          {/* Clear slot option */}
          <button
            onClick={() => { onSelect(null); onClose() }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destiny-hover transition-colors text-left"
          >
            <div className="w-10 h-10 rounded border border-dashed border-destiny-border bg-destiny-surface flex items-center justify-center flex-shrink-0">
              <X className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-xs text-gray-500 italic">Clear slot</span>
          </button>

          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-sm">
              No items found
            </div>
          )}

          {filtered.map((item, idx) => {
            const name = item.definition?.displayProperties?.name ?? 'Unknown'
            const icon = item.definition?.displayProperties?.icon
            const tierColor = item.tier ? TIER_COLORS[item.tier] : '#8A8A8A'
            const isCurrent = item.instanceId === currentItem?.instanceId

            // Quick stats
            let quickStats = ''
            if (item.stats) {
              quickStats = `${item.stats.total} total`
            } else if (item.weaponStats) {
              quickStats = `${item.weaponStats.rpm} RPM · ${item.weaponStats.impact} Impact`
            }

            return (
              <button
                key={item.instanceId ?? `${item.itemHash}-${idx}`}
                onClick={() => { onSelect(item); onClose() }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  isCurrent
                    ? 'bg-legendary/10 border border-legendary/30'
                    : 'hover:bg-destiny-hover'
                }`}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded flex-shrink-0 bg-destiny-surface overflow-hidden"
                  style={{ border: `2px solid ${tierColor}` }}
                >
                  {icon ? (
                    <img src={`${BUNGIE_ROOT}${icon}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{name}</p>
                  {quickStats && (
                    <p className="text-xs text-gray-500 mt-0.5">{quickStats}</p>
                  )}
                </div>

                {/* Power */}
                {item.powerLevel !== undefined && (
                  <span className="text-xs font-bold text-exotic flex-shrink-0">
                    {item.powerLevel}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="px-4 py-2 border-t border-destiny-border">
          <p className="text-xs text-gray-600">{filtered.length} items available</p>
        </div>
      </div>
    </div>
  )
}
