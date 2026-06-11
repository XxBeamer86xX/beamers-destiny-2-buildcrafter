import { calcTotalStats, getStatEffects, statToTier, tierColor } from '../../lib/statCalc'
import type { CharacterClass, DestinyItem } from '../../types/destiny'

interface StatPanelProps {
  virtualLoadout: Partial<Record<string, DestinyItem>>
  charClass: CharacterClass
}

const STAT_ORDER = ['mobility', 'resilience', 'recovery', 'discipline', 'intellect', 'strength'] as const
type StatKey = typeof STAT_ORDER[number]

const STAT_LABELS: Record<StatKey, string> = {
  mobility: 'MOB',
  resilience: 'RES',
  recovery: 'REC',
  discipline: 'DIS',
  intellect: 'INT',
  strength: 'STR',
}

const STAT_FULL_LABELS: Record<StatKey, string> = {
  mobility: 'Mobility',
  resilience: 'Resilience',
  recovery: 'Recovery',
  discipline: 'Discipline',
  intellect: 'Intellect',
  strength: 'Strength',
}

export function StatPanel({ virtualLoadout, charClass }: StatPanelProps) {
  const { raw, effective } = calcTotalStats(virtualLoadout)
  const effects = getStatEffects(effective, charClass)

  return (
    <div className="bg-destiny-card border border-destiny-border rounded-lg p-3 h-full flex flex-col gap-3">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Armor Stats
      </h2>

      <div className="space-y-3 flex-1">
        {STAT_ORDER.map(statKey => {
          const effect = effects[statKey]
          const rawVal = raw[statKey]
          const effectiveVal = effective[statKey]
          const tier = statToTier(effectiveVal)
          const color = tierColor(tier)

          return (
            <div key={statKey}>
              {/* Label row */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white" style={{ color }}>
                    {STAT_FULL_LABELS[statKey]}
                  </span>
                  <span className="text-[10px] text-gray-600">T{tier}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-white font-mono">{effectiveVal}</span>
                  {rawVal > 100 && (
                    <span className="text-gray-600 text-[10px]">({rawVal} raw)</span>
                  )}
                </div>
              </div>

              {/* 10-segment tier bar */}
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }, (_, i) => {
                  const segmentTier = i + 1
                  const filled = tier >= segmentTier
                  // Last filled segment is partial if effectiveVal % 10 !== 0
                  const pct = effectiveVal % 10
                  const isLastFilled = tier === i
                  const fillWidth = isLastFilled && pct > 0 ? `${pct * 10}%` : '100%'

                  return (
                    <div
                      key={i}
                      className="h-2 flex-1 rounded-sm overflow-hidden"
                      style={{ background: filled ? 'transparent' : '#1f2937' }}
                    >
                      {filled ? (
                        <div
                          className="h-full rounded-sm transition-all"
                          style={{ background: color, width: '100%' }}
                        />
                      ) : isLastFilled && pct > 0 ? (
                        <div className="h-full rounded-sm relative" style={{ background: '#1f2937' }}>
                          <div
                            className="absolute inset-y-0 left-0 rounded-sm"
                            style={{ background: color, width: fillWidth }}
                          />
                        </div>
                      ) : (
                        <div className="h-full rounded-sm" style={{ background: '#1f2937' }} />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Effect description */}
              <p className="text-[10px] text-gray-500 mt-0.5">{effect.description}</p>
              {effect.secondaryDescription && (
                <p className="text-[10px] text-gray-600">{effect.secondaryDescription}</p>
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
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Wasted Points</span>
          <span className="text-gray-500">{raw.total - effective.total}</span>
        </div>
      </div>
    </div>
  )
}
