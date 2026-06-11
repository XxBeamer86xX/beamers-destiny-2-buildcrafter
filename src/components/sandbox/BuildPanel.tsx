import { BUNGIE_ROOT } from '../../lib/bungie-api'
import { DAMAGE_TYPE_COLORS, SOCKET_CATEGORY, TIER_COLORS } from '../../types/destiny'
import type { DestinyItem } from '../../types/destiny'
import { calcWeaponDPS } from '../../lib/dpsCalc'

interface BuildPanelProps {
  virtualLoadout: Partial<Record<string, DestinyItem>>
}

const WEAPON_SLOTS = ['kinetic', 'energy', 'power'] as const
const WEAPON_SLOT_LABELS: Record<string, string> = {
  kinetic: 'Kinetic',
  energy: 'Energy',
  power: 'Power',
}

const WEAPON_STAT_LABELS = [
  { key: 'range', label: 'Range' },
  { key: 'stability', label: 'Stability' },
  { key: 'handling', label: 'Handling' },
  { key: 'reload', label: 'Reload' },
] as const

function SmallStatBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value))
  const color = pct >= 70 ? '#4ade80' : pct >= 40 ? '#facc15' : '#f87171'
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-gray-500 w-12 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-destiny-surface rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] text-gray-400 w-6 text-right">{value}</span>
    </div>
  )
}

function WeaponCard({ item, slotLabel }: { item: DestinyItem; slotLabel: string }) {
  const name = item.definition?.displayProperties?.name ?? 'Unknown Weapon'
  const typeName = item.definition?.itemTypeDisplayName ?? slotLabel
  const icon = item.definition?.displayProperties?.icon
  const tierColor = item.tier ? TIER_COLORS[item.tier] : '#374151'
  const damageColor = item.damageType ? DAMAGE_TYPE_COLORS[item.damageType] : '#9ca3af'
  const ws = item.weaponStats

  // DPS estimate
  const dps = ws ? calcWeaponDPS(ws) : null

  // Intrinsic / exotic perks
  const intrinsicSocket = item.sockets?.find(
    s => s.categoryHash === SOCKET_CATEGORY.INTRINSIC && s.plugDefinition
  )
  const perkSockets = item.sockets?.filter(
    s => s.categoryHash === SOCKET_CATEGORY.PERKS && s.plugDefinition && s.isEnabled
  ) ?? []

  return (
    <div className="bg-destiny-surface border border-destiny-border rounded-lg p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 rounded flex-shrink-0 overflow-hidden bg-destiny-card"
          style={{ border: `2px solid ${tierColor}` }}
        >
          {icon && <img src={`${BUNGIE_ROOT}${icon}`} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{name}</p>
          <p className="text-[10px]" style={{ color: damageColor }}>{typeName}</p>
        </div>
        {item.powerLevel !== undefined && (
          <span className="text-xs font-bold text-exotic flex-shrink-0">{item.powerLevel}</span>
        )}
      </div>

      {/* Weapon stats */}
      {ws && (
        <div className="space-y-1">
          <div className="flex gap-4 text-[10px] text-gray-400 border-b border-destiny-border pb-1 mb-1">
            <span><span className="text-white font-bold">{ws.rpm}</span> RPM</span>
            <span><span className="text-white font-bold">{ws.magazine}</span> Mag</span>
            <span><span className="text-white font-bold">{ws.impact}</span> Impact</span>
          </div>
          <SmallStatBar label="Range" value={ws.range} />
          <SmallStatBar label="Stability" value={ws.stability} />
          <SmallStatBar label="Handling" value={ws.handling} />
          <SmallStatBar label="Reload" value={ws.reloadSpeed} />
        </div>
      )}

      {/* 30s DPS estimate */}
      {dps && (
        <div className="border border-destiny-border rounded p-2 space-y-1">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            30s Estimate
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-600">Shots fired</span>
              <span className="text-white font-bold">{dps.shotsIn30s}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-600">Reloads</span>
              <span className="text-white font-bold">{dps.reloadsIn30s}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-600">Time/mag</span>
              <span className="text-white font-bold">{dps.timePerMag}s</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-600">Reload time</span>
              <span className="text-white font-bold">{dps.estimatedReloadTime}s</span>
            </div>
          </div>
          <p className="text-[9px] text-gray-700 italic mt-1">
            Estimate (Impact proxy, not actual damage)
          </p>
        </div>
      )}

      {/* Intrinsic perk for exotic */}
      {item.tier === 'exotic' && intrinsicSocket?.plugDefinition && (
        <div className="flex items-start gap-2 px-2 py-1.5 rounded bg-exotic/10 border border-exotic/20">
          {intrinsicSocket.plugDefinition.displayProperties?.icon && (
            <img
              src={`${BUNGIE_ROOT}${intrinsicSocket.plugDefinition.displayProperties.icon}`}
              alt=""
              className="w-5 h-5 rounded-sm flex-shrink-0 mt-0.5"
            />
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-exotic">
              {intrinsicSocket.plugDefinition.displayProperties?.name}
            </p>
            <p className="text-[9px] text-gray-500 line-clamp-2 mt-0.5">
              {intrinsicSocket.plugDefinition.displayProperties?.description}
            </p>
          </div>
        </div>
      )}

      {/* Active perks */}
      {perkSockets.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Perks</p>
          <div className="flex gap-1.5 flex-wrap">
            {perkSockets.slice(0, 6).map((s, i) => {
              const perkIcon = s.plugDefinition?.displayProperties?.icon
              const perkName = s.plugDefinition?.displayProperties?.name
              return (
                <div
                  key={i}
                  title={perkName}
                  className="w-6 h-6 rounded bg-destiny-card border border-destiny-border overflow-hidden"
                >
                  {perkIcon && (
                    <img src={`${BUNGIE_ROOT}${perkIcon}`} alt={perkName} className="w-full h-full object-cover" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="bg-destiny-surface border border-dashed border-destiny-border rounded-lg p-3 flex items-center justify-center h-16">
      <p className="text-xs text-gray-700">{label} — Empty</p>
    </div>
  )
}

function ExoticArmorSection({ items }: { items: DestinyItem[] }) {
  if (items.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Exotic Intrinsics</h3>
      {items.map((item, i) => {
        const intrinsic = item.sockets?.find(
          s => s.categoryHash === SOCKET_CATEGORY.INTRINSIC && s.plugDefinition
        )
        if (!intrinsic?.plugDefinition) return null

        return (
          <div
            key={item.instanceId ?? i}
            className="flex items-start gap-2 px-2 py-1.5 rounded bg-exotic/10 border border-exotic/20"
          >
            {intrinsic.plugDefinition.displayProperties?.icon && (
              <img
                src={`${BUNGIE_ROOT}${intrinsic.plugDefinition.displayProperties.icon}`}
                alt=""
                className="w-6 h-6 rounded-sm flex-shrink-0 mt-0.5"
              />
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-exotic">
                {intrinsic.plugDefinition.displayProperties?.name}
              </p>
              <p className="text-[9px] text-gray-500 mt-0.5 line-clamp-3">
                {intrinsic.plugDefinition.displayProperties?.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function BuildPanel({ virtualLoadout }: BuildPanelProps) {
  // Exotic armor pieces
  const exoticArmor = ['helmet', 'gauntlets', 'chest', 'legs', 'classItem']
    .map(s => virtualLoadout[s])
    .filter((item): item is DestinyItem => !!item && item.tier === 'exotic')

  return (
    <div className="bg-destiny-card border border-destiny-border rounded-lg p-3 h-full flex flex-col gap-3 overflow-y-auto">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0">
        Weapons
      </h2>

      {/* Weapon cards */}
      <div className="space-y-2">
        {WEAPON_SLOTS.map(slot => {
          const item = virtualLoadout[slot]
          return item
            ? <WeaponCard key={slot} item={item} slotLabel={WEAPON_SLOT_LABELS[slot]} />
            : <EmptySlot key={slot} label={WEAPON_SLOT_LABELS[slot]} />
        })}
      </div>

      {/* Exotic armor intrinsics */}
      {exoticArmor.length > 0 && (
        <>
          <div className="border-t border-destiny-border" />
          <ExoticArmorSection items={exoticArmor} />
        </>
      )}
    </div>
  )
}
