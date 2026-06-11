import type { WeaponStats } from '../types/destiny'

export interface WeaponDPSResult {
  shotsIn30s: number
  reloadsIn30s: number
  timePerMag: number       // seconds to fire one full magazine
  estimatedReloadTime: number  // seconds
  impactProxy: number      // impact stat used as DPS proxy
}

/**
 * Estimate weapon performance over a 30-second window.
 *
 * Assumptions:
 * - RPM = rounds per minute → time between shots = 60/rpm seconds
 * - Reload time estimate: 5 - (reloadSpeed / 100) * 4.1 seconds
 * - Simulation: fire first magazine, then loop (reload → fire magazine) until 30s exhausted
 * - Partial magazines at end of window count their shots
 */
export function calcWeaponDPS(weaponStats: WeaponStats): WeaponDPSResult {
  const { rpm, magazine, reloadSpeed, impact } = weaponStats

  // Guard against degenerate values
  const effectiveRPM = Math.max(rpm, 1)
  const effectiveMag = Math.max(magazine, 1)

  const timePerShot = 60 / effectiveRPM   // seconds per shot
  const estimatedReloadTime = Math.max(0.5, 5 - (reloadSpeed / 100) * 4.1)
  const timePerMag = timePerShot * effectiveMag

  let elapsed = 0
  let shots = 0
  let reloads = 0
  const WINDOW = 30

  // First magazine — no reload before it
  const firstMagShots = Math.min(effectiveMag, Math.floor((WINDOW - elapsed) / timePerShot))
  shots += firstMagShots
  elapsed += firstMagShots * timePerShot

  // Continue reloading and firing until window is exhausted
  while (elapsed < WINDOW) {
    // Reload
    elapsed += estimatedReloadTime
    if (elapsed >= WINDOW) break
    reloads++

    // Fire magazine
    const remainingTime = WINDOW - elapsed
    const shotsFired = Math.min(effectiveMag, Math.floor(remainingTime / timePerShot))
    shots += shotsFired
    elapsed += shotsFired * timePerShot
  }

  return {
    shotsIn30s: shots,
    reloadsIn30s: reloads,
    timePerMag: Math.round(timePerMag * 100) / 100,
    estimatedReloadTime: Math.round(estimatedReloadTime * 100) / 100,
    impactProxy: impact,
  }
}
