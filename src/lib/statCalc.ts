import type { ArmorStats } from '../types/destiny'
import type { CharacterClass } from '../types/destiny'

// Cooldown tables indexed by tier 0-10
// Armor 3.0 values (post-Witch Queen tuning)
const COOLDOWN_TABLES = {
  // Grenade (Discipline) — T0–T4 have steep penalty per Armor 3.0 tuning
  GRENADE: [182, 162, 143, 128, 112, 96, 82, 68, 54, 40, 32],
  // Super (Intellect)
  SUPER: [437, 414, 390, 367, 343, 320, 296, 273, 249, 226, 202],
  // Melee (Strength)
  MELEE: [162, 144, 128, 112, 92, 77, 65, 52, 40, 27, 18],
  // Rift (Recovery, Warlock)
  RIFT: [93, 87, 81, 75, 69, 63, 52, 40, 29, 17, 10],
  // Dodge (Mobility, Hunter)
  DODGE: [29, 27, 26, 24, 22, 20, 17, 14, 11, 9, 6],
  // Barricade (Resilience, Titan)
  BARRICADE: [46, 44, 41, 39, 37, 34, 28, 22, 17, 11, 8],
  // HP (Resilience) — base 200 PvP, bonus at T6+
  HP: [200, 200, 200, 200, 200, 200, 215, 220, 225, 228, 230],
  // PvP Damage Resistance % (Resilience)
  PVP_DR: [0, 0, 0, 0, 0, 0, 7.5, 10, 15, 20, 30],
  // PvE Damage Resistance % (Resilience)
  PVE_DR: [0, 0, 0, 1, 2, 3, 6, 8, 10, 14, 30],
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
  effects: Array<{ label: string; value: string; highlight?: boolean }>
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
  return Math.min(100, Math.max(0, v))
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
    effects: [
      { label: 'Walk/Strafe Speed', value: mobTier >= 5 ? '↑↑' : mobTier >= 2 ? '↑' : '—' },
      { label: 'Jump Height', value: mobTier >= 7 ? '↑↑' : mobTier >= 4 ? '↑' : '—' },
      charClass === 'hunter'
        ? { label: 'Dodge', value: fmtSeconds(COOLDOWN_TABLES.DODGE[mobTier]), highlight: true }
        : { label: 'Class Ability', value: 'N/A' },
    ],
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
    effects: [
      { label: 'HP', value: String(COOLDOWN_TABLES.HP[resTier]), highlight: resTier >= 6 },
      { label: 'PvE DR', value: COOLDOWN_TABLES.PVE_DR[resTier] + '%', highlight: resTier >= 9 },
      { label: 'PvP DR', value: COOLDOWN_TABLES.PVP_DR[resTier] + '%', highlight: resTier >= 6 },
      charClass === 'titan'
        ? { label: 'Barricade', value: fmtSeconds(COOLDOWN_TABLES.BARRICADE[resTier]), highlight: true }
        : { label: 'Class Ability', value: 'N/A' },
    ],
  }

  const recovery: StatEffect = {
    tier: recTier,
    rawValue: stats.recovery,
    effectiveValue: capStat(stats.recovery),
    label: 'Recovery',
    description: charClass === 'warlock'
      ? `${recoveryAbilityLabel}: ${fmtSeconds(COOLDOWN_TABLES.RIFT[recTier])}`
      : `${recoveryAbilityLabel}: N/A`,
    effects: [
      { label: 'Overshield Regen', value: recTier >= 7 ? 'Fast' : recTier >= 4 ? 'Moderate' : 'Slow' },
      charClass === 'warlock'
        ? { label: 'Rift', value: fmtSeconds(COOLDOWN_TABLES.RIFT[recTier]), highlight: true }
        : { label: 'Class Ability', value: 'N/A' },
    ],
  }

  const discipline: StatEffect = {
    tier: disTier,
    rawValue: stats.discipline,
    effectiveValue: capStat(stats.discipline),
    label: 'Discipline',
    description: `Grenade: ${fmtSeconds(COOLDOWN_TABLES.GRENADE[disTier])}`,
    effects: [
      { label: 'Grenade', value: fmtSeconds(COOLDOWN_TABLES.GRENADE[disTier]), highlight: true },
    ],
  }

  const intellect: StatEffect = {
    tier: intTier,
    rawValue: stats.intellect,
    effectiveValue: capStat(stats.intellect),
    label: 'Intellect',
    description: `Super: ${fmtSeconds(COOLDOWN_TABLES.SUPER[intTier])}`,
    effects: [
      { label: 'Super', value: fmtSeconds(COOLDOWN_TABLES.SUPER[intTier]), highlight: true },
    ],
  }

  const strength: StatEffect = {
    tier: strTier,
    rawValue: stats.strength,
    effectiveValue: capStat(stats.strength),
    label: 'Strength',
    description: `Melee: ${fmtSeconds(COOLDOWN_TABLES.MELEE[strTier])}`,
    effects: [
      { label: 'Melee', value: fmtSeconds(COOLDOWN_TABLES.MELEE[strTier]), highlight: true },
    ],
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
