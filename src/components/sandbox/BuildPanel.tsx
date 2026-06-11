import { useState } from 'react'
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

const ENEMY_PL_PRESETS: Array<{ label: string; value: number | null }> = [
  { label: 'Equal (your PL)', value: null },
  { label: 'Patrol / Strike (1960)', value: 1960 },
  { label: 'Nightfall (1980)', value: 1980 },
  { label: 'Master / GM Nightfall (2010)', value: 2010 },
  { label: 'Legend Lost Sector (1960)', value: 1960 },
  { label: 'Raid Normal (1980)', value: 1980 },
  { label: 'Raid Master (2010)', value: 2010 },
  { label: 'Trials (1960)', value: 1960 },
  { label: 'Custom...', value: -1 },
]

function calcPLMultiplier(playerPL: number, enemyPL: number): number {
  const delta = playerPL - enemyPL
  if (delta >= 0) return Math.min(1.05, 1 + delta * 0.003)
  return Math.max(0.05, 1 + delta * 0.020)
}

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

  // Damage estimates
  const basePerShot = ws ? ws.impact * 10 : null
  const perMag = ws && basePerShot !== null ? basePerShot * ws.magazine : null
  const dps30 = ws && dps && basePerShot !== null
    ? Math.round((dps.shotsIn30s * basePerShot) / 30)
    : null

  // Perk sockets (icon strip at bottom)
  const perkSockets = item.sockets?.filter(
    s => s.categoryHash === SOCKET_CATEGORY.PERKS && s.plugDefinition && s.isEnabled
  ) ?? []

  // Real DPS Calculator state
  const [expanded, setExpanded] = useState(false)
  const [bodyShots, setBodyShots] = useState<number[]>(Array(10).fill(0))
  const [precShots, setPrecShots] = useState<number[]>(Array(10).fill(0))
  const [playerPL, setPlayerPL] = useState(2010)
  const [enemyPreset, setEnemyPreset] = useState(0) // index into ENEMY_PL_PRESETS
  const [customEnemyPL, setCustomEnemyPL] = useState(1960)

  const presetEntry = ENEMY_PL_PRESETS[enemyPreset]
  const isCustom = presetEntry.value === -1
  const enemyPL = isCustom ? customEnemyPL : (presetEntry.value ?? playerPL)
  const plMultiplier = calcPLMultiplier(playerPL, enemyPL)
  const delta = playerPL - enemyPL

  const avgBody = bodyShots.reduce((a, b) => a + b, 0) / bodyShots.filter(v => v > 0).length || 0
  const avgPrec = precShots.reduce((a, b) => a + b, 0) / precShots.filter(v => v > 0).length || 0

  const adjBodyPerShot = basePerShot !== null ? Math.round(basePerShot * plMultiplier) : null
  const adjPrecPerShot = basePerShot !== null ? Math.round(basePerShot * 1.5 * plMultiplier) : null
  const adjBodyPerMag = ws && adjBodyPerShot !== null ? adjBodyPerShot * ws.magazine : null
  const adjBody30DPS = dps && adjBodyPerShot !== null
    ? Math.round((dps.shotsIn30s * adjBodyPerShot) / 30)
    : null
  const adjPrec30DPS = dps && adjPrecPerShot !== null
    ? Math.round((dps.shotsIn30s * adjPrecPerShot) / 30)
    : null

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

      {/* Quick stats line + stat bars */}
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

      {/* Damage estimates */}
      {ws && basePerShot !== null && (
        <div className="border border-destiny-border rounded p-2 space-y-1">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Damage Estimate</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-600">Per Shot</span>
              <span className="text-white font-bold">{basePerShot}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-600">Per Mag</span>
              <span className="text-white font-bold">{perMag}</span>
            </div>
            {dps30 !== null && (
              <div className="flex justify-between text-[10px] col-span-2">
                <span className="text-gray-600">30s DPS</span>
                <span className="text-white font-bold">{dps30}</span>
              </div>
            )}
          </div>
          {dps && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1 pt-1 border-t border-destiny-border">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-600">Shots fired</span>
                <span className="text-white font-bold">{dps.shotsIn30s}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-600">Reloads</span>
                <span className="text-white font-bold">{dps.reloadsIn30s}</span>
              </div>
            </div>
          )}
          <p className="text-[9px] text-gray-700 italic mt-1">
            Estimate (Impact × 10 proxy, not actual damage)
          </p>
        </div>
      )}

      {/* Real Damage Calculator toggle */}
      {ws && (
        <div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-[10px] text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            Calculate Real DPS {expanded ? '▲' : '▼'}
          </button>

          {expanded && (
            <div className="mt-2 space-y-3">
              {/* Body shots grid */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1">Body Shots</p>
                <div className="grid grid-cols-5 gap-1">
                  {bodyShots.map((v, i) => (
                    <input
                      key={i}
                      type="number"
                      min="0"
                      value={v || ''}
                      onChange={e => {
                        const next = [...bodyShots]
                        next[i] = Number(e.target.value) || 0
                        setBodyShots(next)
                      }}
                      className="w-12 text-center bg-destiny-bg border border-destiny-border rounded text-xs text-white p-0.5 focus:outline-none focus:border-legendary"
                    />
                  ))}
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Avg: <span className="text-gray-400">{avgBody > 0 ? Math.round(avgBody) : '—'}</span>
                </p>
              </div>

              {/* Precision shots grid */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1">Precision Shots</p>
                <div className="grid grid-cols-5 gap-1">
                  {precShots.map((v, i) => (
                    <input
                      key={i}
                      type="number"
                      min="0"
                      value={v || ''}
                      onChange={e => {
                        const next = [...precShots]
                        next[i] = Number(e.target.value) || 0
                        setPrecShots(next)
                      }}
                      className="w-12 text-center bg-destiny-bg border border-destiny-border rounded text-xs text-white p-0.5 focus:outline-none focus:border-legendary"
                    />
                  ))}
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Avg: <span className="text-gray-400">{avgPrec > 0 ? Math.round(avgPrec) : '—'}</span>
                </p>
              </div>

              {/* Power Level Adjustment */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-500">Power Level Adjustment</p>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-600 w-16 flex-shrink-0">Your PL</label>
                  <input
                    type="number"
                    min="0"
                    value={playerPL}
                    onChange={e => setPlayerPL(Number(e.target.value) || 0)}
                    className="w-20 text-center bg-destiny-bg border border-destiny-border rounded text-xs text-white p-0.5 focus:outline-none focus:border-legendary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-600 w-16 flex-shrink-0">Enemy PL</label>
                  <select
                    value={enemyPreset}
                    onChange={e => setEnemyPreset(Number(e.target.value))}
                    className="flex-1 bg-destiny-bg border border-destiny-border rounded text-xs text-white p-0.5 focus:outline-none focus:border-legendary"
                  >
                    {ENEMY_PL_PRESETS.map((p, i) => (
                      <option key={i} value={i}>{p.label}</option>
                    ))}
                  </select>
                </div>
                {isCustom && (
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-gray-600 w-16 flex-shrink-0">Custom PL</label>
                    <input
                      type="number"
                      min="0"
                      value={customEnemyPL}
                      onChange={e => setCustomEnemyPL(Number(e.target.value) || 0)}
                      className="w-20 text-center bg-destiny-bg border border-destiny-border rounded text-xs text-white p-0.5 focus:outline-none focus:border-legendary"
                    />
                  </div>
                )}
                <p className="text-[10px] text-gray-500">
                  δ = {delta >= 0 ? '+' : ''}{delta} → ×{plMultiplier.toFixed(2)}
                </p>
              </div>

              {/* Results */}
              <div className="border border-destiny-border rounded p-2 space-y-0.5">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Results</p>
                {adjBodyPerShot !== null && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-600">Body per shot</span>
                    <span className="text-white font-bold">{adjBodyPerShot}</span>
                  </div>
                )}
                {adjPrecPerShot !== null && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-600">Precision per shot</span>
                    <span className="text-white font-bold">{adjPrecPerShot}</span>
                  </div>
                )}
                {adjBodyPerMag !== null && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-600">Body damage / mag</span>
                    <span className="text-white font-bold">{adjBodyPerMag}</span>
                  </div>
                )}
                {adjBody30DPS !== null && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-600">Body 30s DPS</span>
                    <span className="text-white font-bold">{adjBody30DPS}</span>
                  </div>
                )}
                {adjPrec30DPS !== null && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-600">Precision 30s DPS</span>
                    <span className="text-white font-bold">{adjPrec30DPS}</span>
                  </div>
                )}
                <p className="text-[9px] text-gray-700 italic mt-1">
                  PL scaling is approximate; Bungie's exact formula is proprietary
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active perks — icon strip */}
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

export function BuildPanel({ virtualLoadout }: BuildPanelProps) {
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
    </div>
  )
}
