import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { bungieApi } from '../lib/bungie-api'
import { useAuthStore } from '../store/authStore'
import {
  getAllActivities,
  getAllCollectibles,
  getAllDestinations,
  getAllRewardSources,
  getItems,
} from '../lib/manifest'
import type { DestinyInventoryItemDefinition } from '../types/bungie'

// DestinyActivityModeType enum values we care about
const MODE = {
  PATROL: 6,
  STORY: 2,
  STRIKE: 3,
  ALL_STRIKES: 17,
  NIGHTFALL: 15,
  HEROIC_NIGHTFALL: 16,
  SCORED_NIGHTFALL: 46,
  SCORED_HEROIC_NIGHTFALL: 47,
  RAID: 4,
  DUNGEON: 82,
  ALL_PVP: 5,
  CONTROL: 10,
  CLASH: 11,
  IRON_BANNER: 18,
  TRIALS_OF_OSIRIS: 84,
  GAMBIT: 63,
  DARES: 85,
  LOST_SECTOR: 87,
} as const

export type ActivityCategory =
  | 'patrol'
  | 'strike'
  | 'nightfall'
  | 'raid'
  | 'dungeon'
  | 'pvp'
  | 'gambit'
  | 'trials'
  | 'dares'
  | 'lost_sector'
  | 'orbit'
  | 'unknown'

export interface ZoneWeapon {
  name: string
  archetype: string
  damageType: string
  damageTypeColor: string
  icon?: string
}

export interface ZoneArmorSet {
  setName: string
  classType: number // 0=Titan, 1=Hunter, 2=Warlock, 3=All
  pieces: string[]
}

export interface ZoneLootData {
  zoneName: string
  activityName: string
  category: ActivityCategory
  armorSets: ZoneArmorSet[]
  weapons: ZoneWeapon[]
  isLoading: boolean
  error?: string
}

const WEAPON_SUBTYPES: Record<number, string> = {
  6: 'Auto Rifle',
  7: 'Shotgun',
  8: 'Machine Gun',
  9: 'Hand Cannon',
  10: 'Rocket Launcher',
  11: 'Fusion Rifle',
  12: 'Sniper Rifle',
  13: 'Pulse Rifle',
  14: 'Scout Rifle',
  17: 'Sidearm',
  18: 'Sword',
  21: 'Linear Fusion Rifle',
  22: 'Grenade Launcher',
  23: 'Submachine Gun',
  24: 'Trace Rifle',
  25: 'Bow',
  26: 'Glaive',
  31: 'Rocket Sidearm',
}

const DAMAGE_TYPES: Record<number, { name: string; color: string }> = {
  1: { name: 'Kinetic', color: '#c0bfbc' },
  2: { name: 'Arc', color: '#79c7e3' },
  3: { name: 'Solar', color: '#f0631a' },
  4: { name: 'Void', color: '#b185df' },
  6: { name: 'Stasis', color: '#4d88ff' },
  7: { name: 'Strand', color: '#35e366' },
  8: { name: 'Prismatic', color: '#e8c84a' },
}

const ARMOR_SLOT_WORDS = new Set([
  'Helm', 'Helmet', 'Hood', 'Mask', 'Crown', 'Cap', 'Casque', 'Headpiece', 'Visor', 'Visage',
  'Gauntlets', 'Gloves', 'Grips', 'Sleeves', 'Handguards', 'Bracers', 'Arms', 'Fists', 'Hands',
  'Chest', 'Plate', 'Vestments', 'Robes', 'Vest', 'Harness', 'Thorax', 'Cuirass', 'Wrap',
  'Greaves', 'Pants', 'Boots', 'Steps', 'Legs', 'Strides', 'Leggings', 'Graves',
  'Mark', 'Bond', 'Cloak', 'Sash', 'Cowl',
  'Armor', // "Chest Armor", "Leg Armor"
])

function extractSetName(itemName: string): string {
  const words = itemName.split(' ')
  const filtered = words.filter(w => !ARMOR_SLOT_WORDS.has(w))
  const result = filtered.join(' ').trim()
  return result || itemName
}

function inSet(value: number, ...modes: number[]): boolean {
  return modes.includes(value)
}

function classifyMode(modeType: number): ActivityCategory {
  if (inSet(modeType, MODE.PATROL)) return 'patrol'
  if (inSet(modeType, MODE.STRIKE, MODE.ALL_STRIKES, MODE.STORY)) return 'strike'
  if (inSet(modeType, MODE.NIGHTFALL, MODE.HEROIC_NIGHTFALL, MODE.SCORED_NIGHTFALL, MODE.SCORED_HEROIC_NIGHTFALL)) return 'nightfall'
  if (modeType === MODE.RAID) return 'raid'
  if (modeType === MODE.DUNGEON) return 'dungeon'
  if (inSet(modeType, MODE.ALL_PVP, MODE.CONTROL, MODE.CLASH, MODE.IRON_BANNER)) return 'pvp'
  if (modeType === MODE.TRIALS_OF_OSIRIS) return 'trials'
  if (modeType === MODE.GAMBIT) return 'gambit'
  if (modeType === MODE.DARES) return 'dares'
  if (modeType === MODE.LOST_SECTOR) return 'lost_sector'
  return 'unknown'
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/^the\s+/, '').trim()
}

function buildWeapon(item: DestinyInventoryItemDefinition): ZoneWeapon | null {
  const archetype = WEAPON_SUBTYPES[item.itemSubType]
  if (!archetype) return null
  const dt = DAMAGE_TYPES[item.defaultDamageType ?? 1]
  return {
    name: item.displayProperties.name,
    archetype,
    damageType: dt?.name ?? 'Kinetic',
    damageTypeColor: dt?.color ?? '#c0bfbc',
    icon: item.displayProperties.icon,
  }
}

async function buildLootFromItems(
  itemDefs: DestinyInventoryItemDefinition[]
): Promise<{ armorSets: ZoneArmorSet[]; weapons: ZoneWeapon[] }> {
  // Legendary only (tierType 5), not ornaments/catalysts (no itemSubType 0 armor)
  const legendaryArmor = itemDefs.filter(
    i => i.itemType === 2 && i.inventory?.tierType === 5 && !i.redacted
  )
  const legendaryWeapons = itemDefs.filter(
    i => i.itemType === 3 && i.inventory?.tierType === 5 && !i.redacted
  )

  // Group armor by class type + set name
  const setMap = new Map<string, ZoneArmorSet>()
  for (const item of legendaryArmor) {
    const setName = extractSetName(item.displayProperties.name)
    const key = `${item.classType}|${setName}`
    if (!setMap.has(key)) {
      setMap.set(key, { setName, classType: item.classType, pieces: [] })
    }
    const existing = setMap.get(key)!
    if (!existing.pieces.includes(item.displayProperties.name)) {
      existing.pieces.push(item.displayProperties.name)
    }
  }

  // Deduplicate weapons by archetype + damage type
  const weaponMap = new Map<string, ZoneWeapon>()
  for (const item of legendaryWeapons) {
    const w = buildWeapon(item)
    if (!w) continue
    const key = `${w.damageType}|${w.archetype}`
    if (!weaponMap.has(key)) weaponMap.set(key, w)
  }

  const armorSets = [...setMap.values()].filter(s => s.setName.length > 0)
  const weapons = [...weaponMap.values()].sort((a, b) =>
    a.archetype.localeCompare(b.archetype) || a.damageType.localeCompare(b.damageType)
  )

  return { armorSets, weapons }
}

// Build loot for patrol/destination zones using reward source name matching
async function buildDestinationLoot(destinationHash: number): Promise<{ armorSets: ZoneArmorSet[]; weapons: ZoneWeapon[] }> {
  const [destinations, rewardSources, collectibles] = await Promise.all([
    getAllDestinations(),
    getAllRewardSources(),
    getAllCollectibles(),
  ])

  const destination = destinations.find(d => d.hash === destinationHash)
  if (!destination) return { armorSets: [], weapons: [] }

  const destNorm = normalizeName(destination.displayProperties.name)

  // Find reward sources whose name fuzzy-matches the destination
  const matchingSourceHashes = new Set<number>(
    rewardSources
      .filter(rs => {
        const rsNorm = normalizeName(rs.displayProperties.name)
        return rsNorm.includes(destNorm) || destNorm.includes(rsNorm)
      })
      .map(rs => rs.hash)
  )

  if (matchingSourceHashes.size === 0) return { armorSets: [], weapons: [] }

  // Find collectibles with matching source hashes
  const itemHashes = collectibles
    .filter(c => matchingSourceHashes.has(c.sourceHash) && c.itemHash && !c.redacted)
    .map(c => c.itemHash)

  if (itemHashes.length === 0) return { armorSets: [], weapons: [] }

  const itemMap = await getItems(itemHashes)
  return buildLootFromItems([...itemMap.values()])
}

// Build loot for specific activities (raids/dungeons/strikes) using activity reward table
async function buildActivityLoot(activityHash: number): Promise<{ armorSets: ZoneArmorSet[]; weapons: ZoneWeapon[] }> {
  const activities = await getAllActivities()
  const activity = activities.find(a => a.hash === activityHash)
  if (!activity) return { armorSets: [], weapons: [] }

  const rewardHashes = activity.rewards.flatMap(r => r.rewardItems.map(i => i.itemHash))
  if (rewardHashes.length === 0) return { armorSets: [], weapons: [] }

  const itemMap = await getItems(rewardHashes)
  return buildLootFromItems([...itemMap.values()])
}

export function useCurrentZone(): ZoneLootData {
  const { selectedMembership, accessToken } = useAuthStore()
  const [lootData, setLootData] = useState<{ armorSets: ZoneArmorSet[]; weapons: ZoneWeapon[] }>({
    armorSets: [],
    weapons: [],
  })
  const [lootLoading, setLootLoading] = useState(false)

  const { data: activityData, isLoading: activityLoading, error } = useQuery({
    queryKey: ['characterActivities', selectedMembership?.membershipId],
    enabled: !!selectedMembership && !!accessToken,
    refetchInterval: 60_000,
    staleTime: 30_000,
    queryFn: async () => {
      if (!selectedMembership) throw new Error('No membership')
      return bungieApi.getActivityStatus(
        selectedMembership.membershipType,
        selectedMembership.membershipId
      )
    },
  })

  // Pick the most recently played character's activities
  const mostRecentActivity = (() => {
    if (!activityData?.characters?.data) return null
    const chars = Object.values(activityData.characters.data)
    if (!chars.length) return null
    const mostRecent = chars.sort(
      (a, b) => new Date(b.dateLastPlayed).getTime() - new Date(a.dateLastPlayed).getTime()
    )[0]
    return activityData.characterActivities?.data?.[mostRecent.characterId] ?? null
  })()

  const activityHash = mostRecentActivity?.currentActivityHash ?? 0
  const modeType = mostRecentActivity?.currentActivityModeType ?? 0

  // Derive zone/activity names
  const [zoneName, setZoneName] = useState('Unknown')
  const [activityName, setActivityName] = useState('')

  const category: ActivityCategory = activityHash === 0 ? 'orbit' : classifyMode(modeType)

  useEffect(() => {
    if (activityHash === 0) {
      setZoneName('In Orbit')
      setActivityName('')
      setLootData({ armorSets: [], weapons: [] })
      return
    }

    let cancelled = false
    setLootLoading(true)

    ;(async () => {
      try {
        const activities = await getAllActivities()
        const activity = activities.find(a => a.hash === activityHash)

        if (!activity || activity.redacted) {
          if (!cancelled) {
            setZoneName('Unknown Zone')
            setActivityName('')
            setLootData({ armorSets: [], weapons: [] })
            setLootLoading(false)
          }
          return
        }

        const destinations = await getAllDestinations()
        const destination = destinations.find(d => d.hash === activity.destinationHash)

        const resolvedZoneName = destination?.displayProperties.name ?? activity.displayProperties.name
        const resolvedActivityName = activity.displayProperties.name !== resolvedZoneName
          ? activity.displayProperties.name
          : ''

        if (!cancelled) {
          setZoneName(resolvedZoneName)
          setActivityName(resolvedActivityName)
        }

        // Choose loot strategy based on activity category
        let loot: { armorSets: ZoneArmorSet[]; weapons: ZoneWeapon[] }
        if (category === 'patrol' || category === 'orbit' || category === 'unknown') {
          loot = activity.destinationHash
            ? await buildDestinationLoot(activity.destinationHash)
            : { armorSets: [], weapons: [] }
        } else {
          // For specific activities try activity rewards first, fall back to destination
          loot = await buildActivityLoot(activityHash)
          if (loot.armorSets.length === 0 && loot.weapons.length === 0 && activity.destinationHash) {
            loot = await buildDestinationLoot(activity.destinationHash)
          }
        }

        if (!cancelled) {
          setLootData(loot)
          setLootLoading(false)
        }
      } catch {
        if (!cancelled) {
          setLootData({ armorSets: [], weapons: [] })
          setLootLoading(false)
        }
      }
    })()

    return () => { cancelled = true }
  }, [activityHash, category])

  return {
    zoneName,
    activityName,
    category,
    armorSets: lootData.armorSets,
    weapons: lootData.weapons,
    isLoading: activityLoading || lootLoading,
    error: error ? String(error) : undefined,
  }
}
