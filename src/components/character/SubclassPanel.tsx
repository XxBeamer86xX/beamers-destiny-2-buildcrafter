import { BUNGIE_ROOT } from '../../lib/bungie-api'
import { DAMAGE_TYPE_COLORS } from '../../types/destiny'
import type { DestinyItem } from '../../types/destiny'
import type { DestinyInventoryItemDefinition } from '../../types/bungie'
import { SOCKET_CATEGORY } from '../../types/destiny'

interface SubclassPanelProps {
  subclassItem: DestinyItem
}

export function SubclassPanel({ subclassItem }: SubclassPanelProps) {
  const def = subclassItem.definition
  if (!def || !subclassItem.sockets) return null

  const element = subclassItem.damageType ?? 'kinetic'
  const elementColor = DAMAGE_TYPE_COLORS[element]

  const getSocketsByCategory = (hash: number) =>
    subclassItem.sockets!.filter(s => s.categoryHash === hash && s.plugDefinition && s.isVisible)

  const superSockets = getSocketsByCategory(SOCKET_CATEGORY.SUPER)
  const abilitySockets = getSocketsByCategory(SOCKET_CATEGORY.ABILITIES)
  const aspectSockets = getSocketsByCategory(SOCKET_CATEGORY.ASPECTS)
  const fragmentSockets = getSocketsByCategory(SOCKET_CATEGORY.FRAGMENTS)

  return (
    <div className="bg-destiny-card border border-destiny-border rounded-xl overflow-hidden">
      {/* Subclass header */}
      <div
        className="px-4 py-3 border-b border-destiny-border"
        style={{ background: `linear-gradient(to right, ${elementColor}18, transparent)` }}
      >
        <div className="flex items-center gap-3">
          {def.displayProperties?.icon && (
            <div
              className="w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0"
              style={{ borderColor: elementColor }}
            >
              <img
                src={`${BUNGIE_ROOT}${def.displayProperties.icon}`}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <h2 className="font-bold text-white">{def.displayProperties?.name}</h2>
            <p className="text-xs capitalize" style={{ color: elementColor }}>{element}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Super */}
        {superSockets.length > 0 && (
          <AbilityRow
            label="Super"
            sockets={superSockets.map(s => s.plugDefinition!)}
            color={elementColor}
          />
        )}

        {/* Abilities */}
        {abilitySockets.length > 0 && (
          <div>
            <SectionLabel label="Abilities" color={elementColor} />
            <div className="flex flex-wrap gap-2 mt-1.5">
              {abilitySockets.map((s, i) => (
                <AbilityBubble key={i} def={s.plugDefinition!} color={elementColor} />
              ))}
            </div>
          </div>
        )}

        {/* Aspects */}
        {aspectSockets.length > 0 && (
          <div>
            <SectionLabel label="Aspects" color={elementColor} />
            <div className="space-y-2 mt-1.5">
              {aspectSockets.map((s, i) => (
                <AspectCard key={i} def={s.plugDefinition!} color={elementColor} />
              ))}
            </div>
          </div>
        )}

        {/* Fragments */}
        {fragmentSockets.length > 0 && (
          <div>
            <SectionLabel label="Fragments" color={elementColor} />
            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
              {fragmentSockets.map((s, i) => (
                <FragmentChip key={i} def={s.plugDefinition!} color={elementColor} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
  )
}

function AbilityRow({ label, sockets, color }: { label: string; sockets: DestinyInventoryItemDefinition[]; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-10 flex-shrink-0">{label}</span>
      <div className="flex gap-2">
        {sockets.map((def, i) => (
          <AbilityBubble key={i} def={def} color={color} large />
        ))}
      </div>
    </div>
  )
}

function AbilityBubble({ def, color, large }: { def: DestinyInventoryItemDefinition; color: string; large?: boolean }) {
  const size = large ? 'w-12 h-12' : 'w-9 h-9'
  return (
    <div
      className={`${size} rounded-full border-2 overflow-hidden flex-shrink-0 bg-destiny-surface cursor-pointer hover:scale-105 transition-transform`}
      style={{ borderColor: `${color}80` }}
      title={`${def.displayProperties?.name}\n${def.displayProperties?.description}`}
    >
      {def.displayProperties?.icon && (
        <img
          src={`${BUNGIE_ROOT}${def.displayProperties.icon}`}
          alt={def.displayProperties.name}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  )
}

function AspectCard({ def, color }: { def: DestinyInventoryItemDefinition; color: string }) {
  return (
    <div
      className="flex items-start gap-3 p-2.5 rounded-lg border"
      style={{ borderColor: `${color}30`, background: `${color}08` }}
    >
      {def.displayProperties?.icon && (
        <img
          src={`${BUNGIE_ROOT}${def.displayProperties.icon}`}
          alt=""
          className="w-9 h-9 rounded border flex-shrink-0"
          style={{ borderColor: `${color}50` }}
        />
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">{def.displayProperties?.name}</p>
        <p className="text-xs text-gray-400 leading-snug mt-0.5">{def.displayProperties?.description}</p>
        {/* Fragment slots count hint */}
        {def.investmentStats?.some(s => s.value > 0) && (
          <div className="flex items-center gap-1 mt-1">
            {def.investmentStats
              .filter(s => s.value > 0)
              .map((_s, i) => (
                <span key={i} className="w-3 h-3 rounded-sm bg-destiny-border border border-destiny-hover" />
              ))}
            <span className="text-xs text-gray-500 ml-0.5">fragment slots</span>
          </div>
        )}
      </div>
    </div>
  )
}

function FragmentChip({ def, color }: { def: DestinyInventoryItemDefinition; color: string }) {
  if (def.plug?.isDummyPlug || !def.displayProperties?.name) return (
    <div className="flex items-center gap-1.5 p-2 rounded border border-dashed border-destiny-border bg-destiny-surface opacity-40">
      <span className="text-xs text-gray-600">Empty slot</span>
    </div>
  )

  return (
    <div
      className="flex items-center gap-1.5 p-2 rounded border cursor-pointer hover:brightness-110 transition-all"
      style={{ borderColor: `${color}25`, background: `${color}06` }}
      title={def.displayProperties?.description}
    >
      {def.displayProperties?.icon && (
        <img
          src={`${BUNGIE_ROOT}${def.displayProperties.icon}`}
          alt=""
          className="w-5 h-5 rounded-sm flex-shrink-0"
        />
      )}
      <span className="text-xs text-gray-200 leading-tight line-clamp-2">{def.displayProperties.name}</span>
    </div>
  )
}
