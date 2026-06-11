import { useState, useMemo } from 'react'
import { Search, Filter, X, Loader2, AlertCircle } from 'lucide-react'
import { useProfile } from '../../hooks/useProfile'
import { ItemCard } from '../item/ItemCard'
import { TIER_COLORS, DAMAGE_TYPE_COLORS } from '../../types/destiny'
import type { DestinyItem, ItemTier, DamageType } from '../../types/destiny'
import clsx from 'clsx'

type FilterState = {
  search: string
  tier: ItemTier | 'all'
  category: 'all' | 'weapon' | 'armor'
  element: DamageType | 'all'
  class: 'all' | 'titan' | 'hunter' | 'warlock' | 'none'
}

const CLASS_TYPES: Record<number, 'titan' | 'hunter' | 'warlock' | 'none'> = {
  0: 'titan', 1: 'hunter', 2: 'warlock', 3: 'none',
}

export function VaultPage() {
  const { data: profile, isLoading, error } = useProfile()
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    tier: 'all',
    category: 'all',
    element: 'all',
    class: 'all',
  })

  const allItems = useMemo(() => {
    if (!profile) return []
    const charInventories = Object.values(profile.characterInventory).flat()
    return [...profile.vault, ...charInventories].filter(
      i => i.itemCategory === 'weapon' || i.itemCategory === 'armor'
    )
  }, [profile])

  const filtered = useMemo(() => {
    return allItems.filter(item => {
      const name = item.definition?.displayProperties?.name?.toLowerCase() ?? ''
      if (filters.search && !name.includes(filters.search.toLowerCase())) return false
      if (filters.tier !== 'all' && item.tier !== filters.tier) return false
      if (filters.category !== 'all' && item.itemCategory !== filters.category) return false
      if (filters.element !== 'all' && item.damageType !== filters.element) return false
      if (filters.class !== 'all') {
        const cls = CLASS_TYPES[item.definition?.classType ?? 3]
        if (cls !== filters.class) return false
      }
      return true
    })
  }, [allItems, filters])

  // Sort: exotic first, then by power desc
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.tier === 'exotic' && b.tier !== 'exotic') return -1
      if (b.tier === 'exotic' && a.tier !== 'exotic') return 1
      return (b.powerLevel ?? 0) - (a.powerLevel ?? 0)
    })
  }, [filtered])

  const setFilter = <K extends keyof FilterState>(key: K, val: FilterState[K]) =>
    setFilters(f => ({ ...f, [key]: val }))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-legendary animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Vault & Inventory</h1>
        <span className="text-sm text-gray-400">{sorted.length} / {allItems.length} items</span>
      </div>

      {/* Filters */}
      <div className="bg-destiny-card border border-destiny-border rounded-xl p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            placeholder="Search by name…"
            className="w-full bg-destiny-surface border border-destiny-border rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-legendary/50"
          />
          {filters.search && (
            <button
              onClick={() => setFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {/* Category */}
          {(['all', 'weapon', 'armor'] as const).map(v => (
            <FilterChip
              key={v}
              label={v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1) + 's'}
              active={filters.category === v}
              onClick={() => setFilter('category', v)}
            />
          ))}
          <div className="w-px h-5 bg-destiny-border self-center" />
          {/* Tier */}
          {(['all', 'exotic', 'legendary', 'rare'] as const).map(v => (
            <FilterChip
              key={v}
              label={v === 'all' ? 'Any tier' : v.charAt(0).toUpperCase() + v.slice(1)}
              active={filters.tier === v}
              color={v !== 'all' ? TIER_COLORS[v] : undefined}
              onClick={() => setFilter('tier', v)}
            />
          ))}
          <div className="w-px h-5 bg-destiny-border self-center" />
          {/* Element */}
          {(['all', 'solar', 'arc', 'void', 'stasis', 'strand', 'kinetic'] as const).map(v => (
            <FilterChip
              key={v}
              label={v === 'all' ? 'Any element' : v.charAt(0).toUpperCase() + v.slice(1)}
              active={filters.element === v}
              color={v !== 'all' ? DAMAGE_TYPE_COLORS[v] : undefined}
              onClick={() => setFilter('element', v)}
            />
          ))}
        </div>

        {/* Active filter count */}
        {(filters.search || filters.tier !== 'all' || filters.category !== 'all' || filters.element !== 'all') && (
          <button
            onClick={() => setFilters({ search: '', tier: 'all', category: 'all', element: 'all', class: 'all' })}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
            Clear all filters
          </button>
        )}
      </div>

      {/* Items grid */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Filter className="w-8 h-8 text-gray-600 mb-3" />
          <p className="text-gray-400">No items match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
          {sorted.map((item, i) => (
            <VaultItemCell key={item.instanceId ?? `${item.itemHash}-${i}`} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function VaultItemCell({ item }: { item: DestinyItem }) {
  const tierColor = item.tier ? TIER_COLORS[item.tier] : '#8A8A8A'
  const damageColor = item.damageType ? DAMAGE_TYPE_COLORS[item.damageType] : undefined

  return (
    <div className="space-y-1">
      <ItemCard item={item} size="lg" showPower />
      <div className="space-y-0.5 px-0.5">
        <p className="text-xs text-white font-medium leading-tight line-clamp-1 truncate">
          {item.definition?.displayProperties?.name ?? '—'}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: tierColor }}>
            {item.tier?.charAt(0).toUpperCase() ?? '?'}
          </span>
          {damageColor && (
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: damageColor }} />
          )}
          {item.stats && (
            <span className="text-xs text-gray-500">{item.stats.total}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string
  active: boolean
  color?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
        active
          ? 'text-white border-transparent'
          : 'text-gray-400 border-destiny-border hover:text-white hover:border-destiny-hover bg-destiny-surface'
      )}
      style={active ? { backgroundColor: color ?? '#7B5EA7', borderColor: color ?? '#7B5EA7' } : undefined}
    >
      {label}
    </button>
  )
}
