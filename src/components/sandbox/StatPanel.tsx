import { calcTotalStats, getStatEffects, statColor } from '../../lib/statCalc'
import type { DestinyItem } from '../../types/destiny'

interface StatPanelProps {
  virtualLoadout: Partial<Record<string, DestinyItem>>
}

const STAT_ORDER = ['mobility', 'resilience', 'recovery', 'discipline', 'intellect', 'strength'] as const

export function StatPanel({ virtualLoadout }: StatPanelProps) {
  const { raw, effective } = calcTotalStats(virtualLoadout)
  const effects = getStatEffects(effective)

  return (
    <div className="bg-destiny-card border border-destiny-border rounded-lg p-3 h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Armor Stats</h2>
        <span className="text-[9px] text-gray-600">Armor 3.0 · 0–200</span>
      </div>

      <div className="space-y-3 flex-1">
        {STAT_ORDER.map(statKey => {
          const effect = effects[statKey]
          const rawVal = raw[statKey]
          const v = effect.effectiveValue
          const color = statColor(v)

          // Bar: split at 100. Primary 0-100, secondary 101-200.
          const primaryFill = Math.min(100, v)            // 0-100
          const secondaryFill = Math.max(0, v - 100)      // 0-100 in secondary range

          return (
            <div key={statKey}>
              {/* Label row */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold" style={{ color }}>
                  {effect.label}
                </span>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-white font-mono">{v}</span>
                  {rawVal > 200 && (
                    <span className="text-gray-600 text-[10px]">({rawVal} raw)</span>
                  )}
                  {effect.inSecondary && (
                    <span className="text-[9px] text-exotic font-semibold">★</span>
                  )}
                </div>
              </div>

              {/* 0–200 bar with split at 100 */}
              <div className="flex gap-0.5 mb-1">
                {/* Primary zone 0-100 */}
                <div className="flex-1 h-2 bg-gray-800 rounded-l-sm overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{ width: `${primaryFill}%`, background: v > 100 ? color : color }}
                  />
                </div>
                {/* Divider pip at 100 */}
                <div className="w-px h-2 bg-gray-600 flex-shrink-0" />
                {/* Secondary zone 101-200 */}
                <div className="flex-1 h-2 bg-gray-800 rounded-r-sm overflow-hidden">
                  {secondaryFill > 0 && (
                    <div
                      className="h-full transition-all"
                      style={{ width: `${secondaryFill}%`, background: '#C4A55A' }}
                    />
                  )}
                </div>
              </div>

              {/* Primary effects */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                {effect.primaryEffects.map((eff, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-600">{eff.label}</span>
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: eff.highlight ? color : '#6b7280' }}
                    >
                      {eff.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Secondary effects (only shown when stat > 100) */}
              {effect.inSecondary && effect.secondaryEffects.length > 0 && (
                <div className="mt-0.5 pl-1 border-l-2 border-exotic/40 grid grid-cols-2 gap-x-3 gap-y-0.5">
                  {effect.secondaryEffects.map((eff, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-600">{eff.label}</span>
                      <span
                        className="text-[10px] font-medium text-exotic"
                      >
                        {eff.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Totals */}
      <div className="border-t border-destiny-border pt-2 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Effective Total</span>
          <span className="text-white font-bold">{effective.total}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Raw Total</span>
          <span className="text-gray-400">{raw.total}</span>
        </div>
        {raw.total > effective.total && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Over Cap</span>
            <span className="text-gray-500">{raw.total - effective.total}</span>
          </div>
        )}
      </div>
    </div>
  )
}
