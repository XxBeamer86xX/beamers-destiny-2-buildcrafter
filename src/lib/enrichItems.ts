// Merges raw Bungie profile data with manifest definitions into DestinyItem objects
import type {
  DestinyItemComponent,
  DestinyProfileResponse,
  DestinyInventoryItemDefinition,
} from '../types/bungie'
import type { DestinyItem, ResolvedSocket, ArmorStats } from '../types/destiny'
import {
  TIER_TYPE_MAP,
  DAMAGE_TYPE_HASH_MAP,
  ARMOR_STAT_HASHES,
  SOCKET_CATEGORY,
} from '../types/destiny'
import { getItems } from './manifest'

function getItemCategory(def: DestinyInventoryItemDefinition): DestinyItem['itemCategory'] {
  const hashes = def.itemCategoryHashes ?? []
  if (hashes.includes(1)) return 'weapon'
  if (hashes.includes(20)) return 'armor'
  if (hashes.includes(45)) return 'ghost'
  if (hashes.includes(43)) return 'vehicle'
  if (hashes.includes(42)) return 'ship'
  if (hashes.includes(19)) return 'emblem'
  if (hashes.includes(34)) return 'consumable'
  if (hashes.includes(59)) return 'mod'
  if (hashes.includes(3112159218)) return 'subclass'
  return 'other'
}

export async function enrichItems(
  rawItems: DestinyItemComponent[],
  profile: DestinyProfileResponse
): Promise<DestinyItem[]> {
  const allHashes = [...new Set(rawItems.map(i => i.itemHash))]
  const definitionMap = await getItems(allHashes)

  const results: DestinyItem[] = []

  for (const raw of rawItems) {
    const def = definitionMap.get(raw.itemHash < 0 ? raw.itemHash + 4294967296 : raw.itemHash)
    const instance = raw.itemInstanceId
      ? profile.itemComponents?.instances?.data?.[raw.itemInstanceId]
      : undefined
    const socketsData = raw.itemInstanceId
      ? profile.itemComponents?.sockets?.data?.[raw.itemInstanceId]
      : undefined
    const statsData = raw.itemInstanceId
      ? profile.itemComponents?.stats?.data?.[raw.itemInstanceId]
      : undefined
    const reusablePlugsData = raw.itemInstanceId
      ? profile.itemComponents?.reusablePlugs?.data?.[raw.itemInstanceId]
      : undefined

    const tier = def ? TIER_TYPE_MAP[def.inventory?.tierType ?? 0] : undefined
    const damageType = instance?.damageTypeHash
      ? DAMAGE_TYPE_HASH_MAP[instance.damageTypeHash]
      : def?.defaultDamageTypeHash
        ? DAMAGE_TYPE_HASH_MAP[def.defaultDamageTypeHash]
        : undefined

    // Resolve sockets
    const sockets: ResolvedSocket[] = []
    if (socketsData?.sockets && def?.sockets?.socketEntries) {
      // Get all plug hashes we need to look up
      const plugHashes = new Set<number>()
      socketsData.sockets.forEach(s => { if (s.plugHash) plugHashes.add(s.plugHash) })
      if (reusablePlugsData?.plugs) {
        Object.values(reusablePlugsData.plugs).forEach(plugs =>
          plugs.forEach(p => plugHashes.add(p.plugItemHash))
        )
      }
      const plugDefs = await getItems([...plugHashes])

      // Get socket category lookup
      const categoryBySocketIndex = new Map<number, number>()
      def.sockets?.socketCategories?.forEach(cat => {
        cat.socketIndexes.forEach(idx => categoryBySocketIndex.set(idx, cat.socketCategoryHash))
      })

      for (let i = 0; i < socketsData.sockets.length; i++) {
        const s = socketsData.sockets[i]
        const plugHash = s.plugHash ? (s.plugHash < 0 ? s.plugHash + 4294967296 : s.plugHash) : undefined
        const plugDef = plugHash ? plugDefs.get(plugHash) : undefined

        const reusable = reusablePlugsData?.plugs?.[i]?.map(p => {
          const h = p.plugItemHash < 0 ? p.plugItemHash + 4294967296 : p.plugItemHash
          return plugDefs.get(h)
        }).filter(Boolean) as DestinyInventoryItemDefinition[] | undefined

        sockets.push({
          socketIndex: i,
          plugHash,
          plugDefinition: plugDef,
          isEnabled: s.isEnabled,
          isVisible: s.isVisible,
          reusablePlugs: reusable,
          categoryHash: categoryBySocketIndex.get(i),
        })
      }
    }

    // Armor stats
    let stats: ArmorStats | undefined
    if (statsData?.stats) {
      const s = statsData.stats
      const get = (hash: number) => s[hash]?.value ?? 0
      const mobility = get(ARMOR_STAT_HASHES.MOBILITY)
      const resilience = get(ARMOR_STAT_HASHES.RESILIENCE)
      const recovery = get(ARMOR_STAT_HASHES.RECOVERY)
      const discipline = get(ARMOR_STAT_HASHES.DISCIPLINE)
      const intellect = get(ARMOR_STAT_HASHES.INTELLECT)
      const strength = get(ARMOR_STAT_HASHES.STRENGTH)
      const total = mobility + resilience + recovery + discipline + intellect + strength
      if (total > 0) {
        stats = { mobility, resilience, recovery, discipline, intellect, strength, total }
      }
    }

    results.push({
      itemHash: raw.itemHash < 0 ? raw.itemHash + 4294967296 : raw.itemHash,
      instanceId: raw.itemInstanceId,
      bucketHash: raw.bucketHash,
      quantity: raw.quantity,
      characterId: raw.characterId,
      location: raw.location,
      transferStatus: raw.transferStatus,
      lockable: raw.lockable,
      state: raw.state,
      powerLevel: instance?.primaryStat?.value,
      damageType,
      isEquipped: instance?.isEquipped,
      canEquip: instance?.canEquip,
      energy: instance?.energy
        ? {
            capacity: instance.energy.energyCapacity,
            used: instance.energy.energyUsed,
            type: instance.energy.energyType,
          }
        : undefined,
      definition: def,
      tier,
      itemCategory: def ? getItemCategory(def) : undefined,
      sockets,
      stats,
    })
  }

  return results
}

export async function buildSubclassDetails(subclassItem: DestinyItem) {
  if (!subclassItem.sockets || !subclassItem.definition) return null

  const { ABILITIES, ASPECTS, FRAGMENTS, SUPER } = SOCKET_CATEGORY

  const getPlugsByCategory = (categoryHash: number) =>
    subclassItem.sockets!
      .filter(s => s.categoryHash === categoryHash && s.plugDefinition)
      .map(s => s.plugDefinition!)

  // Get damage type from definition
  const damageTypeHash = subclassItem.definition.defaultDamageTypeHash
  const { DAMAGE_TYPE_HASH_MAP: dtMap } = await import('../types/destiny')
  const element = damageTypeHash ? dtMap[damageTypeHash] : undefined

  const abilitySockets = subclassItem.sockets.filter(s => s.categoryHash === ABILITIES)
  const superSocket = subclassItem.sockets.find(s => s.categoryHash === SUPER)

  return {
    item: subclassItem,
    element: element ?? 'kinetic',
    superAbility: superSocket?.plugDefinition,
    aspects: getPlugsByCategory(ASPECTS),
    fragments: getPlugsByCategory(FRAGMENTS),
    abilities: abilitySockets.map(s => s.plugDefinition).filter(Boolean),
  }
}
