import type { ArmorStats } from '../types/destiny'
import type { CharacterClass } from '../types/destiny'

// Cooldown tables indexed by tier 0-10
const COOLDOWN_TABLES = {
  // Grenade (Discipline)
  GRENADE: [121, 116, 111, 106, 101, 96, 82, 68, 54, 40, 32],
  // Super (Intellect)
  SUPER: [437, 414, 390, 367, 343, 320, 296, 273, 249, 226, 202],
  // Melee (Strength)
  MELEE: [102, 97, 92, 87, 82, 77, 65, 52, 40, 27, 18],
  // Rift (Recovery, Warlock)
  RIFT: [93, 87, 81, 75, 69, 63, 52, 40, 29, 17, 10],
  // Dodge (Mobility, Hunter)
  DODGE: [29, 27, 26, 24, 22, 20, 17, 14, 11, 9, 6],
  // Barricade (Resilience, Titan)
  BARRICADE: [46, 44, 41, 39, 37, 34, 28, 22, 17, 11, 8],
  // HP bonus (Resilience)
  HP: [200, 200, 200, 200, 200, 200, 215, 220, 225, 228, 230],
  // PvP Damage Resistance % (Resilience)
  PVP_DR: [0, 0, 0, 0, 0, 0, 7.5, 10, 15, 20, 30],
}

export interface StatTotals {
  raw: ArmorStats
  effective: ArmorStats
}

export interface StatEffect {
  tier: number
  rawValue: number
  effectiveValue: number
  label: string
  description: string
  secondaryDescription?: string
}

export interface StatEffects {
  mobility: StatEffect
  resilience: StatEffect
  recovery: StatEffect
  discipline: StatEffect
  intellect: StatEffect
  strength: StatEffect
}

export function statToTier(value: number): number {
  return Math.floor(Math.min(100, value) / 10)
}

function capStat(v: number): number {
  return Math.min(100, v)
}

function fmtSeconds(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`
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
    mobility: capStat(raw.mobility),
    resilience: capStat(raw.resilience),
    recovery: capStat(raw.recovery),
    discipline: capStat(raw.discipline),
    intellect: capStat(raw.intellect),
    strength: capStat(raw.strength),
    total: 0,
  }
  effective.total =
    effective.mobility + effective.resilience + effective.recovery +
    effective.discipline + effective.intellect + effective.strength

  return { raw, effective }
}

export function getStatEffects(stats: ArmorStats, charClass: CharacterClass): StatEffects {
  // Class-specific ability label
  const mobilityAbilityLabel =
    charClass === 'hunter' ? 'Dodge' : 'Class Ability'
  const recoveryAbilityLabel =
    charClass === 'warlock' ? 'Rift' : 'Class Ability'
  const resilienceAbilityLabel =
    charClass === 'titan' ? 'Barricade' : 'Class Ability'

  const mobTier = statToTier(capStat(stats.mobility))
  const resTier = statToTier(capStat(stats.resilience))
  const recTier = statToTier(capStat(stats.recovery))
  const disTier = statToTier(capStat(stats.discipline))
  const intTier = statToTier(capStat(stats.intellect))
  const strTier = statToTier(capStat(stats.strength))

  const mobility: StatEffect = {
    tier: mobTier,
    rawValue: stats.mobility,
    effectiveValue: capStat(stats.mobility),
    label: 'Mobility',
    description: charClass === 'hunter'
      ? `${mobilityAbilityLabel}: ${fmtSeconds(COOLDOWN_TABLES.DODGE[mobTier])}`
      : `${mobilityAbilityLabel}: N/A`,
  }

  const resilience: StatEffect = {
    tier: resTier,
    rawValue: stats.resilience,
    effectiveValue: capStat(stats.resilience),
    label: 'Resilience',
    description: charClass === 'titan'
      ? `${resilienceAbilityLabel}: ${fmtSeconds(COOLDOWN_TABLES.BARRICADE[resTier])}`
      : `${resilienceAbilityLabel}: N/A`,
    secondaryDescription: `HP: ${COOLDOWN_TABLES.HP[resTier]} · PvP DR: ${COOLDOWN_TABLES.PVP_DR[resTier]}%`,
  }

  const recovery: StatEffect = {
    tier: recTier,
    rawValue: stats.recovery,
    effectiveValue: capStat(stats.recovery),
    label: 'Recovery',
    description: charClass === 'warlock'
      ? `${recoveryAbilityLabel}: ${fmtSeconds(COOLDOWN_TABLES.RIFT[recTier])}`
      : `${recoveryAbilityLabel}: N/A`,
  }

  const discipline: StatEffect = {
    tier: disTier,
    rawValue: stats.discipline,
    effectiveValue: capStat(stats.discipline),
    label: 'Discipline',
    description: `Grenade: ${fmtSeconds(COOLDOWN_TABLES.GRENADE[disTier])}`,
  }

  const intellect: StatEffect = {
    tier: intTier,
    rawValue: stats.intellect,
    effectiveValue: capStat(stats.intellect),
    label: 'Intellect',
    description: `Super: ${fmtSeconds(COOLDOWN_TABLES.SUPER[intTier])}`,
  }

  const strength: StatEffect = {
    tier: strTier,
    rawValue: stats.strength,
    effectiveValue: capStat(stats.strength),
    label: 'Strength',
    description: `Melee: ${fmtSeconds(COOLDOWN_TABLES.MELEE[strTier])}`,
  }

  return { mobility, resilience, recovery, discipline, intellect, strength }
}

// Color for a given tier level
export function tierColor(tier: number): string {
  if (tier >= 10) return '#C4A55A' // exotic gold
  if (tier >= 7) return '#4ade80'  // green
  if (tier >= 5) return '#60a5fa'  // blue
  if (tier >= 3) return '#facc15'  // yellow
  return '#9ca3af'                 // gray
}
