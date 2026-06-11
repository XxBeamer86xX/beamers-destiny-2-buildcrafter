import type { ArmorStats } from '../types/destiny'

// Armor 3.0 (Edge of Fate, July 2025)
// Stats: Weapons / Health / Class / Grenade / Super / Melee
// Range: 0–200. Primary effects scale 0–100, secondary bonuses 101–200.
// No tiers — every point has value.

export interface StatTotals {
  raw: ArmorStats
  effective: ArmorStats
}

export interface StatEffect {
  rawValue: number
  effectiveValue: number    // capped at 200
  label: string
  primaryEffects: Array<{ label: string; value: string; highlight?: boolean }>
  secondaryEffects: Array<{ label: string; value: string; highlight?: boolean }>
  inSecondary: boolean      // stat > 100
}

export interface StatEffects {
  mobility: StatEffect      // "Weapons" in-game
  resilience: StatEffect    // "Health" in-game
  recovery: StatEffect      // "Class" in-game
  discipline: StatEffect    // "Grenade"
  intellect: StatEffect     // "Super"
  strength: StatEffect      // "Melee"
}

function cap(v: number): number {
  return Math.min(200, Math.max(0, v))
}

function pct(statVal: number, max: number, scaleTo: number): number {
  return Math.round((Math.min(statVal, max) / max) * scaleTo)
}

function fmt(n: number, suffix = '%'): string {
  return `${n > 0 ? '+' : ''}${n}${suffix}`
}

// Primary effects scale 0–100
function primaryAt(v: number): number {
  return Math.min(100, Math.max(0, v))
}

// Secondary effects scale 101–200 (0–100 within the secondary range)
function secondaryAt(v: number): number {
  return Math.min(100, Math.max(0, v - 100))
}

export function calcTotalStats(
  loadout: Partial<Record<string, import('../types/destiny').DestinyItem>>
): StatTotals {
  const armorSlots = ['helmet', 'gauntlets', 'chest', 'legs', 'classItem']

  const raw: ArmorStats = {
    mobility: 0,
    resilience: 0,
    recovery: 0,
    discipline: 0,
    intellect: 0,
    strength: 0,
    total: 0,
  }

  for (const slot of armorSlots) {
    const item = loadout[slot]
    if (item?.stats) {
      raw.mobility += item.stats.mobility
      raw.resilience += item.stats.resilience
      raw.recovery += item.stats.recovery
      raw.discipline += item.stats.discipline
      raw.intellect += item.stats.intellect
      raw.strength += item.stats.strength
    }
  }
  raw.total = raw.mobility + raw.resilience + raw.recovery + raw.discipline + raw.intellect + raw.strength

  const effective: ArmorStats = {
    mobility: cap(raw.mobility),
    resilience: cap(raw.resilience),
    recovery: cap(raw.recovery),
    discipline: cap(raw.discipline),
    intellect: cap(raw.intellect),
    strength: cap(raw.strength),
    total: 0,
  }
  effective.total =
    effective.mobility + effective.resilience + effective.recovery +
    effective.discipline + effective.intellect + effective.strength

  return { raw, effective }
}

export function getStatEffects(stats: ArmorStats): StatEffects {
  function makeWeapons(v: number): StatEffect {
    const p = primaryAt(v)
    const s = secondaryAt(v)
    return {
      rawValue: v,
      effectiveValue: cap(v),
      label: 'Weapons',
      inSecondary: v > 100,
      primaryEffects: [
        { label: 'Reload Speed', value: fmt(pct(p, 100, 10)), highlight: p >= 70 },
        { label: 'Handling', value: fmt(pct(p, 100, 10)), highlight: p >= 70 },
        { label: 'PvE Weapon Dmg', value: fmt(pct(p, 100, 15)), highlight: p >= 80 },
        { label: 'vs Guardians', value: fmt(pct(p, 100, 5)) },
      ],
      secondaryEffects: v > 100 ? [
        { label: 'Double Ammo', value: `${pct(s, 100, 100)}% chance`, highlight: s >= 50 },
      ] : [],
    }
  }

  function makeHealth(v: number): StatEffect {
    const p = primaryAt(v)
    const s = secondaryAt(v)
    return {
      rawValue: v,
      effectiveValue: cap(v),
      label: 'Health',
      inSecondary: v > 100,
      primaryEffects: [
        { label: 'Flinch Resist', value: fmt(pct(p, 100, 10)), highlight: p >= 60 },
        { label: 'Orb HP Regen', value: `+${pct(p, 100, 70)} HP`, highlight: p >= 60 },
      ],
      secondaryEffects: v > 100 ? [
        { label: 'Shield Cap', value: `+${pct(s, 100, 20)} HP`, highlight: s >= 50 },
        { label: 'Shield Regen', value: fmt(pct(s, 100, 45)), highlight: s >= 50 },
      ] : [],
    }
  }

  function makeClass(v: number): StatEffect {
    const p = primaryAt(v)
    const s = secondaryAt(v)
    return {
      rawValue: v,
      effectiveValue: cap(v),
      label: 'Class',
      inSecondary: v > 100,
      primaryEffects: [
        { label: 'Ability Cooldown', value: `${fmt(-pct(p, 100, 65))}`, highlight: p >= 70 },
        { label: 'Energy Gain', value: fmt(pct(p, 100, 190)), highlight: p >= 70 },
      ],
      secondaryEffects: v > 100 ? [
        { label: 'Overshield (PvE)', value: `+${pct(s, 100, 40)} HP`, highlight: s >= 50 },
        { label: 'Overshield (PvP)', value: `+${pct(s, 100, 20)} HP` },
      ] : [],
    }
  }

  function makeGrenade(v: number): StatEffect {
    const p = primaryAt(v)
    const s = secondaryAt(v)
    return {
      rawValue: v,
      effectiveValue: cap(v),
      label: 'Grenade',
      inSecondary: v > 100,
      primaryEffects: [
        { label: 'Cooldown', value: `${fmt(-pct(p, 100, 65))}`, highlight: p >= 70 },
        { label: 'Energy Gain', value: fmt(pct(p, 100, 190)), highlight: p >= 70 },
      ],
      secondaryEffects: v > 100 ? [
        { label: 'PvE Damage', value: fmt(pct(s, 100, 65)), highlight: s >= 50 },
        { label: 'PvP Damage', value: fmt(pct(s, 100, 20)) },
      ] : [],
    }
  }

  function makeSuper(v: number): StatEffect {
    const p = primaryAt(v)
    const s = secondaryAt(v)
    return {
      rawValue: v,
      effectiveValue: cap(v),
      label: 'Super',
      inSecondary: v > 100,
      primaryEffects: [
        { label: 'Energy Gain', value: fmt(pct(p, 100, 190)), highlight: p >= 70 },
      ],
      secondaryEffects: v > 100 ? [
        { label: 'PvE Damage', value: fmt(pct(s, 100, 45)), highlight: s >= 50 },
        { label: 'PvP Damage', value: fmt(pct(s, 100, 15)) },
      ] : [],
    }
  }

  function makeMelee(v: number): StatEffect {
    const p = primaryAt(v)
    const s = secondaryAt(v)
    return {
      rawValue: v,
      effectiveValue: cap(v),
      label: 'Melee',
      inSecondary: v > 100,
      primaryEffects: [
        { label: 'Cooldown', value: `${fmt(-pct(p, 100, 65))}`, highlight: p >= 70 },
        { label: 'Energy Gain', value: fmt(pct(p, 100, 190)), highlight: p >= 70 },
      ],
      secondaryEffects: v > 100 ? [
        { label: 'PvE Damage', value: fmt(pct(s, 100, 30)), highlight: s >= 50 },
        { label: 'PvP Damage', value: fmt(pct(s, 100, 20)) },
      ] : [],
    }
  }

  return {
    mobility: makeWeapons(stats.mobility),
    resilience: makeHealth(stats.resilience),
    recovery: makeClass(stats.recovery),
    discipline: makeGrenade(stats.discipline),
    intellect: makeSuper(stats.intellect),
    strength: makeMelee(stats.strength),
  }
}

// Color based on stat value in new 0-200 system
export function statColor(v: number): string {
  if (v > 100) return '#C4A55A'  // gold — in secondary bonus territory
  if (v >= 80) return '#4ade80'  // green
  if (v >= 50) return '#60a5fa'  // blue
  if (v >= 20) return '#facc15'  // yellow
  return '#9ca3af'               // gray
}
