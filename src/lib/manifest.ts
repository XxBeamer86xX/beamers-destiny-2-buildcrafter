import { openDB, type IDBPDatabase } from 'idb'
import { bungieApi } from './bungie-api'
import type {
  DestinyInventoryItemDefinition,
  DestinyStatDefinition,
  DestinySocketCategoryDefinition,
  DestinyClassDefinition,
  DestinyDamageTypeDefinition,
  DestinyPlugSetDefinition,
  DestinyActivityDefinition,
  DestinyDestinationDefinition,
  DestinyCollectibleDefinition,
  DestinyRewardSourceDefinition,
} from '../types/bungie'

const DB_NAME = 'd2-manifest'
const DB_VERSION = 2

interface ManifestDB {
  meta: { key: string; value: string }
  items: { key: number; value: DestinyInventoryItemDefinition }
  stats: { key: number; value: DestinyStatDefinition }
  socketCategories: { key: number; value: DestinySocketCategoryDefinition }
  classes: { key: number; value: DestinyClassDefinition }
  damageTypes: { key: number; value: DestinyDamageTypeDefinition }
  plugSets: { key: number; value: DestinyPlugSetDefinition }
  activities: { key: number; value: DestinyActivityDefinition }
  destinations: { key: number; value: DestinyDestinationDefinition }
  collectibles: { key: number; value: DestinyCollectibleDefinition }
  rewardSources: { key: number; value: DestinyRewardSourceDefinition }
}

let db: IDBPDatabase<ManifestDB> | null = null

async function getDB() {
  if (db) return db
  db = await openDB<ManifestDB>(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion, _newVersion, transaction) {
      if (!database.objectStoreNames.contains('meta')) {
        database.createObjectStore('meta')
      }
      if (!database.objectStoreNames.contains('items')) {
        database.createObjectStore('items', { keyPath: 'hash' })
      }
      if (!database.objectStoreNames.contains('stats')) {
        database.createObjectStore('stats', { keyPath: 'hash' })
      }
      if (!database.objectStoreNames.contains('socketCategories')) {
        database.createObjectStore('socketCategories', { keyPath: 'hash' })
      }
      if (!database.objectStoreNames.contains('classes')) {
        database.createObjectStore('classes', { keyPath: 'hash' })
      }
      if (!database.objectStoreNames.contains('damageTypes')) {
        database.createObjectStore('damageTypes', { keyPath: 'hash' })
      }
      if (!database.objectStoreNames.contains('plugSets')) {
        database.createObjectStore('plugSets', { keyPath: 'hash' })
      }
      // v2: zone loot tables
      if (!database.objectStoreNames.contains('activities')) {
        database.createObjectStore('activities', { keyPath: 'hash' })
      }
      if (!database.objectStoreNames.contains('destinations')) {
        database.createObjectStore('destinations', { keyPath: 'hash' })
      }
      if (!database.objectStoreNames.contains('collectibles')) {
        database.createObjectStore('collectibles', { keyPath: 'hash' })
      }
      if (!database.objectStoreNames.contains('rewardSources')) {
        database.createObjectStore('rewardSources', { keyPath: 'hash' })
      }
      // Force manifest re-download so new tables get populated
      if (oldVersion < 2 && database.objectStoreNames.contains('meta')) {
        transaction.objectStore('meta').delete('version')
      }
    },
  })
  return db
}

export type ManifestLoadProgress = {
  stage: string
  progress: number // 0-100
  done: boolean
  error?: string
}

export async function loadManifest(
  onProgress: (p: ManifestLoadProgress) => void
): Promise<void> {
  const database = await getDB()

  onProgress({ stage: 'Checking manifest version…', progress: 5, done: false })

  const manifest = await bungieApi.getManifest()
  const newVersion = manifest.version
  const storedVersion = await database.get('meta', 'version')

  if (storedVersion === newVersion) {
    onProgress({ stage: 'Manifest up to date', progress: 100, done: true })
    return
  }

  onProgress({ stage: 'Downloading item definitions…', progress: 10, done: false })

  const paths = manifest.jsonWorldComponentContentPaths['en']

  const tables: Array<{
    key: string
    store: keyof Omit<ManifestDB, 'meta'>
    label: string
    progress: number
  }> = [
    { key: 'DestinyInventoryItemDefinition', store: 'items', label: 'items', progress: 15 },
    { key: 'DestinyStatDefinition', store: 'stats', label: 'stats', progress: 30 },
    { key: 'DestinySocketCategoryDefinition', store: 'socketCategories', label: 'socket categories', progress: 42 },
    { key: 'DestinyClassDefinition', store: 'classes', label: 'classes', progress: 50 },
    { key: 'DestinyDamageTypeDefinition', store: 'damageTypes', label: 'damage types', progress: 58 },
    { key: 'DestinyPlugSetDefinition', store: 'plugSets', label: 'plug sets', progress: 65 },
    { key: 'DestinyActivityDefinition', store: 'activities', label: 'activities', progress: 74 },
    { key: 'DestinyDestinationDefinition', store: 'destinations', label: 'destinations', progress: 80 },
    { key: 'DestinyCollectibleDefinition', store: 'collectibles', label: 'collectibles', progress: 88 },
    { key: 'DestinyRewardSourceDefinition', store: 'rewardSources', label: 'reward sources', progress: 94 },
  ]

  for (const table of tables) {
    onProgress({
      stage: `Downloading ${table.label}…`,
      progress: table.progress,
      done: false,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await bungieApi.fetchManifestTable<any>(paths[table.key])
    const values = Object.values(data)

    // Bulk write in transaction
    const tx = database.transaction(table.store, 'readwrite')
    await tx.store.clear()
    for (const item of values) {
      // Bungie hashes can be negative — normalize to unsigned 32-bit
      if (item.hash < 0) item.hash = item.hash + 4294967296
      await tx.store.put(item)
    }
    await tx.done
  }

  await database.put('meta', newVersion, 'version')
  onProgress({ stage: 'Manifest loaded!', progress: 100, done: true })
}

export async function getItem(hash: number): Promise<DestinyInventoryItemDefinition | undefined> {
  const normalizedHash = hash < 0 ? hash + 4294967296 : hash
  const database = await getDB()
  return database.get('items', normalizedHash)
}

export async function getItems(hashes: number[]): Promise<Map<number, DestinyInventoryItemDefinition>> {
  const database = await getDB()
  const result = new Map<number, DestinyInventoryItemDefinition>()
  await Promise.all(
    hashes.map(async (h) => {
      const normalized = h < 0 ? h + 4294967296 : h
      const item = await database.get('items', normalized)
      if (item) result.set(normalized, item)
    })
  )
  return result
}

export async function getStat(hash: number): Promise<DestinyStatDefinition | undefined> {
  const database = await getDB()
  return database.get('stats', hash)
}

export async function getAllStats(): Promise<DestinyStatDefinition[]> {
  const database = await getDB()
  return database.getAll('stats')
}

export async function getSocketCategory(hash: number): Promise<DestinySocketCategoryDefinition | undefined> {
  const database = await getDB()
  return database.get('socketCategories', hash)
}

export async function getAllDamageTypes(): Promise<DestinyDamageTypeDefinition[]> {
  const database = await getDB()
  return database.getAll('damageTypes')
}

export async function getAllClasses(): Promise<DestinyClassDefinition[]> {
  const database = await getDB()
  return database.getAll('classes')
}

export async function getPlugSet(hash: number): Promise<DestinyPlugSetDefinition | undefined> {
  const database = await getDB()
  return database.get('plugSets', hash)
}

export async function isManifestLoaded(): Promise<boolean> {
  try {
    const database = await getDB()
    const version = await database.get('meta', 'version')
    return !!version
  } catch {
    return false
  }
}

export async function getAllActivities(): Promise<DestinyActivityDefinition[]> {
  const database = await getDB()
  return database.getAll('activities')
}

export async function getActivity(hash: number): Promise<DestinyActivityDefinition | undefined> {
  const database = await getDB()
  return database.get('activities', hash)
}

export async function getAllDestinations(): Promise<DestinyDestinationDefinition[]> {
  const database = await getDB()
  return database.getAll('destinations')
}

export async function getDestination(hash: number): Promise<DestinyDestinationDefinition | undefined> {
  const database = await getDB()
  return database.get('destinations', hash)
}

export async function getAllCollectibles(): Promise<DestinyCollectibleDefinition[]> {
  const database = await getDB()
  return database.getAll('collectibles')
}

export async function getAllRewardSources(): Promise<DestinyRewardSourceDefinition[]> {
  const database = await getDB()
  return database.getAll('rewardSources')
}
