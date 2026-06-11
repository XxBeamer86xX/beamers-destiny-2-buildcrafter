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
  { label: 'Master / GM (2010)', value: 2010 },
  { label: 'Raid Normal (1980)', value: 1980 },
  { label: 'Raid Master (2010)', value: 2010 },
  { label: 'Trials (1960)', value: 1960 },
  { label: 'Custom…', value: -1 },
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
      <span className="text-[10px] text-gray-500 w-14 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-destiny-surface rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] text-gray-400 w-6 text-right">{value}</span>
    </div>
  )
}

interface WeaponCardProps {
  item: DestinyItem
  slotLabel: string
  playerPL: number
  enemyPresetIdx: number
  customEnemyPL: number
}

function WeaponCard({ item, slotLabel, playerPL, enemyPresetIdx, customEnemyPL }: WeaponCardProps) {
  const name = item.definition?.displayProperties?.name ?? 'Unknown Weapon'
  const typeName = item.definition?.itemTypeDisplayName ?? slotLabel
  const icon = item.definition?.displayProperties?.icon
  const tierColor = item.tier ? TIER_COLORS[item.tier] : '#374151'
  const damageColor = item.damageType ? DAMAGE_TYPE_COLORS[item.damageType] : '#9ca3af'
  const ws = item.weaponStats

  const dps = ws ? calcWeaponDPS(ws) : null
  const basePerShot = ws ? ws.impact * 10 : null
  const perMag = ws && basePerShot !== null ? basePerShot * ws.magazine : null
  const dps30 = ws && dps && basePerShot !== null
    ? Math.round((dps.shotsIn30s * basePerShot) / 30)
    : null

  const presetEntry = ENEMY_PL_PRESETS[enemyPresetIdx]
  const isCustom = presetEntry.value === -1
  const enemyPL = isCustom ? customEnemyPL : (presetEntry.value ?? playerPL)
  const plMultiplier = calcPLMultiplier(playerPL, enemyPL)

  const perkSockets = item.sockets?.filter(
    s => s.categoryHash === SOCKET_CATEGORY.PERKS && s.plugDefinition && s.isEnabled
  ) ?? []

  const [perksOpen, setPerksOpen] = useState(false)
  const [calcOpen, setCalcOpen] = useState(false)
  const [bodyShots, setBodyShots] = useState<number[]>(Array(10).fill(0))
  const [precShots, setPrecShots] = useState<number[]>(Array(10).fill(0))

  const avgBody = bodyShots.reduce((a, b) => a + b, 0) / (bodyShots.filter(v => v > 0).length || 1)
  const avgPrec = precShots.reduce((a, b) => a + b, 0) / (precShots.filter(v => v > 0).length || 1)
  const realBodyDPS = dps && avgBody > 0
    ? Math.round((dps.shotsIn30s * avgBody * plMultiplier) / 30)
    : null
  const realPrecDPS = dps && avgPrec > 0
    ? Math.round((dps.shotsIn30s * avgPrec * plMultiplier) / 30)
    : null

  return (
    <div className="bg-destiny-surface border border-destiny-border rounded-lg p-2.5 space-y-2">
      {/* Header: icon + name/type + quick stats + perk icons + PL */}
      <div className="flex items-start gap-2">
        <div
          className="w-9 h-9 rounded flex-shrink-0 overflow-hidden bg-destiny-card"
          style={{ border: `2px solid ${tierColor}` }}
        >
          {icon && <img src={`${BUNGIE_ROOT}${icon}`} alt="" className="w-full h-full object-cover" />}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-xs font-semibold text-white truncate max-w-[120px]">{name}</p>
            {ws && (
              <>
                <span className="text-[10px] text-gray-500">·</span>
                <span className="text-[10px] font-bold text-white">{ws.rpm}</span>
                <span className="text-[10px] text-gray-500">RPM</span>
                <span className="text-[10px] text-gray-500">·</span>
                <span className="text-[10px] font-bold text-white">{ws.magazine}</span>
                <span className="text-[10px] text-gray-500">Mag</span>
              </>
            )}
          </div>
          {/* Type */}
          <p className="text-[10px]" style={{ color: damageColor }}>{typeName}</p>

          {/* Perk icon strip */}
          {perkSockets.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {perkSockets.slice(0, 6).map((s, i) => {
                const pIcon = s.plugDefinition?.displayProperties?.icon
                const pName = s.plugDefinition?.displayProperties?.name ?? ''
                return (
                  <button
                    key={i}
                    title={pName}
                    onClick={() => setPerksOpen(o => !o)}
                    className="w-5 h-5 rounded bg-destiny-card border border-destiny-border overflow-hidden hover:border-legendary transition-colors"
                  >
                    {pIcon && <img src={`${BUNGIE_ROOT}${pIcon}`} alt={pName} className="w-full h-full object-cover" />}
                  </button>
                )
              })}
              <button
                onClick={() => setPerksOpen(o => !o)}
                className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors self-center ml-0.5"
              >
                {perksOpen ? '▲' : '▼'}
              </button>
            </div>
          )}
        </div>

        {item.powerLevel !== undefined && (
          <span className="text-xs font-bold text-exotic flex-shrink-0">{item.powerLevel}</span>
        )}
      </div>

      {/* Perk details (collapsible) */}
      {perksOpen && perkSockets.length > 0 && (
        <div className="space-y-1.5 border-t border-destiny-border pt-1.5">
          {perkSockets.slice(0, 6).map((s, i) => {
            const pName = s.plugDefinition?.displayProperties?.name
            const pDesc = s.plugDefinition?.displayProperties?.description
            const pIcon = s.plugDefinition?.displayProperties?.icon
            return (
              <div key={i} className="flex gap-1.5">
                {pIcon && (
                  <img src={`${BUNGIE_ROOT}${pIcon}`} className="w-4 h-4 rounded-sm flex-shrink-0 mt-0.5" alt="" />
                )}
                <div>
                  <p className="text-[10px] font-semibold text-gray-300">{pName}</p>
                  {pDesc && <p className="text-[9px] text-gray-500 leading-tight">{pDesc}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Stat bars */}
      {ws && (
        <div className="space-y-1 border-t border-destiny-border pt-1.5">
          <SmallStatBar label="Impact" value={ws.impact} />
          <SmallStatBar label="Range" value={ws.range} />
          <SmallStatBar label="Stability" value={ws.stability} />
          <SmallStatBar label="Handling" value={ws.handling} />
        </div>
      )}

      {/* Damage estimates (proxy) */}
      {ws && basePerShot !== null && (
        <div className="border border-destiny-border rounded p-1.5 space-y-0.5">
          <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Damage Estimate</p>
          <div className="grid grid-cols-3 gap-x-2">
            <div className="text-center">
              <p className="text-[9px] text-gray-600">Per Shot</p>
              <p className="text-xs font-bold text-white">{basePerShot}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-gray-600">Per Mag</p>
              <p className="text-xs font-bold text-white">{perMag}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-gray-600">30s DPS</p>
              <p className="text-xs font-bold text-white">{dps30 ?? '—'}</p>
            </div>
          </div>
          {dps && (
            <p className="text-[9px] text-gray-700 text-center">
              {dps.shotsIn30s} shots · {dps.reloadsIn30s} reloads
            </p>
          )}
          <p className="text-[9px] text-gray-700 italic">Impact × 10 proxy; not actual damage</p>
        </div>
      )}

      {/* Real DPS Calculator */}
      {ws && (
        <div>
          <button
            onClick={() => setCalcOpen(e => !e)}
            className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            Calculate Real DPS {calcOpen ? '▲' : '▼'}
          </button>

          {calcOpen && (
            <div className="mt-2 space-y-2.5 border-t border-destiny-border pt-2">
              <div>
                <p className="text-[10px] text-gray-500 mb-1">Body Shots (up to 10)</p>
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
                      className="w-full text-center bg-destiny-bg border border-destiny-border rounded text-xs text-white p-0.5 focus:outline-none focus:border-legendary"
                    />
                  ))}
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Avg: <span className="text-gray-400">{bodyShots.some(v => v > 0) ? Math.round(avgBody) : '—'}</span>
                </p>
              </div>

              <div>
                <p className="text-[10px] text-gray-500 mb-1">Precision Shots (up to 10)</p>
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
                      className="w-full text-center bg-destiny-bg border border-destiny-border rounded text-xs text-white p-0.5 focus:outline-none focus:border-legendary"
                    />
                  ))}
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Avg: <span className="text-gray-400">{precShots.some(v => v > 0) ? Math.round(avgPrec) : '—'}</span>
                </p>
              </div>

              {(realBodyDPS !== null || realPrecDPS !== null) && (
                <div className="border border-destiny-border rounded p-1.5 space-y-0.5">
                  <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Results (PL-adjusted)</p>
                  {realBodyDPS !== null && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-600">Body 30s DPS</span>
                      <span className="text-white font-bold">{realBodyDPS}</span>
                    </div>
                  )}
                  {realPrecDPS !== null && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-600">Precision 30s DPS</span>
                      <span className="text-white font-bold">{realPrecDPS}</span>
                    </div>
                  )}
                  <p className="text-[9px] text-gray-700 italic">PL scaling approximate</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="bg-destiny-surface border border-dashed border-destiny-border rounded-lg p-3 flex items-center justify-center h-12">
      <p className="text-xs text-gray-700">{label} — Empty</p>
    </div>
  )
}

export function BuildPanel({ virtualLoadout }: BuildPanelProps) {
  const [playerPL, setPlayerPL] = useState(2010)
  const [enemyPresetIdx, setEnemyPresetIdx] = useState(0)
  const [customEnemyPL, setCustomEnemyPL] = useState(1960)

  const isCustom = ENEMY_PL_PRESETS[enemyPresetIdx].value === -1
  const presetValue = ENEMY_PL_PRESETS[enemyPresetIdx].value
  const enemyPL = isCustom ? customEnemyPL : (presetValue ?? playerPL)
  const delta = playerPL - enemyPL

  return (
    <div className="bg-destiny-card border border-destiny-border rounded-lg p-3 h-full flex flex-col gap-3 overflow-y-auto">
      {/* Header with PL dropdown */}
      <div className="flex-shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Weapons</h2>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-gray-600">vs ⚡</span>
            <select
              value={enemyPresetIdx}
              onChange={e => setEnemyPresetIdx(Number(e.target.value))}
              className="bg-destiny-bg border border-destiny-border rounded text-white text-[10px] px-1 py-0.5 focus:outline-none focus:border-legendary"
            >
              {ENEMY_PL_PRESETS.map((p, i) => (
                <option key={i} value={i}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* PL inputs row */}
        <div className="flex items-center gap-2 text-[10px] flex-wrap">
          <label className="text-gray-600">Your PL</label>
          <input
            type="number"
            min="0"
            value={playerPL}
            onChange={e => setPlayerPL(Number(e.target.value) || 0)}
            className="w-16 text-center bg-destiny-bg border border-destiny-border rounded text-white p-0.5 focus:outline-none focus:border-legendary"
          />
          {isCustom && (
            <>
              <label className="text-gray-600">Enemy PL</label>
              <input
                type="number"
                min="0"
                value={customEnemyPL}
                onChange={e => setCustomEnemyPL(Number(e.target.value) || 0)}
                className="w-16 text-center bg-destiny-bg border border-destiny-border rounded text-white p-0.5 focus:outline-none focus:border-legendary"
              />
            </>
          )}
          <span className="text-gray-600">
            δ {delta >= 0 ? '+' : ''}{delta} → ×{calcPLMultiplier(playerPL, enemyPL).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Weapon cards */}
      <div className="space-y-2">
        {WEAPON_SLOTS.map(slot => {
          const item = virtualLoadout[slot]
          return item
            ? <WeaponCard
                key={slot}
                item={item}
                slotLabel={WEAPON_SLOT_LABELS[slot]}
                playerPL={playerPL}
                enemyPresetIdx={enemyPresetIdx}
                customEnemyPL={customEnemyPL}
              />
            : <EmptySlot key={slot} label={WEAPON_SLOT_LABELS[slot]} />
        })}
      </div>
    </div>
  )
}
