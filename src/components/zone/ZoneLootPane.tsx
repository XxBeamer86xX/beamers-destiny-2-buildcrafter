import { ChevronRight, MapPin, Loader2, Sword, Shield } from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { useCurrentZone, type ActivityCategory, type ZoneArmorSet, type ZoneWeapon } from '../../hooks/useCurrentZone'

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  patrol: 'Patrol',
  strike: 'Strike',
  nightfall: 'Nightfall',
  raid: 'Raid',
  dungeon: 'Dungeon',
  pvp: 'Crucible',
  trials: 'Trials of Osiris',
  gambit: 'Gambit',
  dares: 'Dares of Eternity',
  lost_sector: 'Lost Sector',
  orbit: 'Orbit',
  unknown: 'Activity',
}

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  patrol: 'text-strand bg-strand/10 border-strand/20',
  strike: 'text-arc bg-arc/10 border-arc/20',
  nightfall: 'text-arc bg-arc/10 border-arc/20',
  raid: 'text-exotic bg-exotic/10 border-exotic/20',
  dungeon: 'text-legendary bg-legendary/10 border-legendary/20',
  pvp: 'text-solar bg-solar/10 border-solar/20',
  trials: 'text-exotic bg-exotic/10 border-exotic/20',
  gambit: 'text-strand bg-strand/10 border-strand/20',
  dares: 'text-prismatic bg-prismatic/10 border-prismatic/20',
  lost_sector: 'text-rare bg-rare/10 border-rare/20',
  orbit: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  unknown: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
}

const CLASS_NAMES: Record<number, string> = {
  0: 'Titan',
  1: 'Hunter',
  2: 'Warlock',
  3: 'All Classes',
}

function ArmorSection({ sets }: { sets: ZoneArmorSet[] }) {
  if (sets.length === 0) return null

  // Group by class type
  const byClass = new Map<number, ZoneArmorSet[]>()
  for (const s of sets) {
    const list = byClass.get(s.classType) ?? []
    list.push(s)
    byClass.set(s.classType, list)
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Shield className="w-3.5 h-3.5 text-legendary" />
        <span className="text-xs font-semibold text-legendary uppercase tracking-wider">Armor Sets</span>
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3].map(classType => {
          const classSets = byClass.get(classType)
          if (!classSets?.length) return null
          return (
            <div key={classType}>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                {CLASS_NAMES[classType]}
              </div>
              <div className="space-y-0.5">
                {classSets.map(s => (
                  <div
                    key={s.setName}
                    className="text-xs text-gray-300 bg-destiny-card rounded px-2 py-1 border border-destiny-border"
                  >
                    {s.setName}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeaponsSection({ weapons }: { weapons: ZoneWeapon[] }) {
  if (weapons.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Sword className="w-3.5 h-3.5 text-rare" />
        <span className="text-xs font-semibold text-rare uppercase tracking-wider">Weapons</span>
      </div>
      <div className="space-y-0.5">
        {weapons.map(w => (
          <div
            key={`${w.damageType}|${w.archetype}`}
            className="flex items-center gap-2 text-xs text-gray-300 bg-destiny-card rounded px-2 py-1 border border-destiny-border"
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: w.damageTypeColor }}
            />
            <span className="font-medium" style={{ color: w.damageTypeColor }}>
              {w.damageType}
            </span>
            <span className="text-gray-400">{w.archetype}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Collapsed tab shown on the right edge when pane is hidden
function CollapsedTab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center w-6 bg-destiny-surface border-l border-destiny-border hover:bg-destiny-hover transition-colors flex-shrink-0 gap-1 py-4"
      title="Show Zone Loot"
    >
      <MapPin className="w-3.5 h-3.5 text-gray-400" />
      <span
        className="text-[9px] text-gray-500 uppercase tracking-widest"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
      >
        Zone Loot
      </span>
      <ChevronRight className="w-3 h-3 text-gray-500 rotate-180" />
    </button>
  )
}

export function ZoneLootPane() {
  const { zonePaneVisible, setZonePaneVisible } = useAppStore()
  const { accessToken } = useAuthStore()
  const zone = useCurrentZone()

  if (!zonePaneVisible) {
    return <CollapsedTab onClick={() => setZonePaneVisible(true)} />
  }

  const hasLoot = zone.armorSets.length > 0 || zone.weapons.length > 0

  return (
    <aside className="w-56 bg-destiny-surface border-l border-destiny-border flex flex-col flex-shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-destiny-border flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-white truncate">Zone Loot</span>
        </div>
        <button
          onClick={() => setZonePaneVisible(false)}
          className="text-gray-500 hover:text-white transition-colors flex-shrink-0 ml-1"
          title="Hide Zone Loot"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {!accessToken ? (
          <p className="text-xs text-gray-500 text-center pt-4">
            Sign in to see zone loot
          </p>
        ) : zone.isLoading ? (
          <div className="flex items-center justify-center pt-8">
            <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Zone name */}
            <div>
              <div
                className={clsx(
                  'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border mb-1',
                  CATEGORY_COLORS[zone.category]
                )}
              >
                {CATEGORY_LABELS[zone.category]}
              </div>
              <div className="text-sm font-semibold text-white leading-tight">
                {zone.zoneName}
              </div>
              {zone.activityName && zone.activityName !== zone.zoneName && (
                <div className="text-xs text-gray-400 mt-0.5 truncate">{zone.activityName}</div>
              )}
            </div>

            {/* Orbit / no data states */}
            {zone.category === 'orbit' && (
              <p className="text-xs text-gray-500">No loot while in orbit.</p>
            )}

            {zone.category === 'pvp' && (
              <p className="text-xs text-gray-500">
                Crucible drops are reputation-based and vary by mode.
              </p>
            )}

            {zone.category === 'gambit' && (
              <p className="text-xs text-gray-500">
                Gambit drops are reputation-based.
              </p>
            )}

            {!hasLoot && !['orbit', 'pvp', 'gambit'].includes(zone.category) && (
              <p className="text-xs text-gray-500">
                No loot data found for this zone.
              </p>
            )}

            {hasLoot && (
              <>
                <ArmorSection sets={zone.armorSets} />
                <WeaponsSection weapons={zone.weapons} />
              </>
            )}

            {/* Refresh note */}
            <p className="text-[10px] text-gray-600 pt-1">
              Updates every 60 seconds
            </p>
          </>
        )}
      </div>
    </aside>
  )
}
