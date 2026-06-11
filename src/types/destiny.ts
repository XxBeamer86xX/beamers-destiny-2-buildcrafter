import type { DestinyInventoryItemDefinition } from './bungie'

export type DamageType = 'kinetic' | 'solar' | 'arc' | 'void' | 'stasis' | 'strand' | 'prismatic'
export type ItemTier = 'exotic' | 'legendary' | 'rare' | 'uncommon' | 'common'
export type CharacterClass = 'titan' | 'hunter' | 'warlock'
export type ItemCategory = 'weapon' | 'armor' | 'subclass' | 'ghost' | 'vehicle' | 'ship' | 'emblem' | 'consumable' | 'mod' | 'other'
export type WeaponSlot = 'kinetic' | 'energy' | 'power'
export type ArmorSlot = 'helmet' | 'gauntlets' | 'chest' | 'legs' | 'classItem'

// Bucket hashes → slot names
export const BUCKET_HASH_MAP: Record<number, string> = {
  1498876634: 'kinetic',
  2465295065: 'energy',
  953998645: 'power',
  3448274439: 'helmet',
  3551918588: 'gauntlets',
  14239492: 'chest',
  20886954: 'legs',
  1585787867: 'classItem',
  3284755031: 'subclass',
  4023194814: 'ghost',
  2025709351: 'vehicle',
  284967655: 'ship',
  4274335291: 'emblem',
  1469714392: 'consumables',
  3313201758: 'mods',
}

export const WEAPON_BUCKET_HASHES = [1498876634, 2465295065, 953998645]
export const ARMOR_BUCKET_HASHES = [3448274439, 3551918588, 14239492, 20886954, 1585787867]
export const EQUIPPED_SLOT_ORDER = [
  1498876634, // Kinetic
  2465295065, // Energy
  953998645,  // Power
  3448274439, // Helmet
  3551918588, // Gauntlets
  14239492,   // Chest
  20886954,   // Legs
  1585787867, // Class Item
  3284755031, // Subclass
  4023194814, // Ghost
  2025709351, // Vehicle
  284967655,  // Ship
  4274335291, // Emblem
]

// Damage type hash → type name
export const DAMAGE_TYPE_HASH_MAP: Record<number, DamageType> = {
  3373582085: 'kinetic',
  1847026933: 'solar',
  2303181850: 'arc',
  3454344768: 'void',
  151347233: 'stasis',
  3949783978: 'strand',
}

// Socket category hashes
export const SOCKET_CATEGORY = {
  INTRINSIC: 1744546145,   // Exotic intrinsic / weapon frame
  PERKS: 4241085061,       // Weapon perks
  ARMOR_PERKS: 2518356196, // Armor perks
  MODS: 590099826,         // Armor mods
  COSMETICS: 2048875504,   // Shaders / ornaments
  ABILITIES: 309722977,    // Subclass abilities
  ASPECTS: 2140934067,     // Subclass aspects
  FRAGMENTS: 1313526669,   // Subclass fragments
  SUPER: 457473665,        // Subclass super
}

// Armor stat hashes
export const ARMOR_STAT_HASHES = {
  MOBILITY: 2996146975,
  RESILIENCE: 392767087,
  RECOVERY: 1943323491,
  DISCIPLINE: 1735777505,
  INTELLECT: 144602215,
  STRENGTH: 4244567218,
}

export const ARMOR_STAT_NAMES: Record<number, string> = {
  2996146975: 'Mobility',
  392767087: 'Resilience',
  1943323491: 'Recovery',
  1735777505: 'Discipline',
  144602215: 'Intellect',
  4244567218: 'Strength',
}

// Tier type numbers
export const TIER_TYPE_MAP: Record<number, ItemTier> = {
  6: 'exotic',
  5: 'legendary',
  4: 'rare',
  3: 'uncommon',
  2: 'common',
}

export const TIER_COLORS: Record<ItemTier, string> = {
  exotic: '#C4A55A',
  legendary: '#7B5EA7',
  rare: '#5E88C1',
  uncommon: '#4B7A46',
  common: '#8A8A8A',
}

export const DAMAGE_TYPE_COLORS: Record<DamageType, string> = {
  kinetic: '#C0C0C0',
  solar: '#F0631E',
  arc: '#79C8E2',
  void: '#B185FF',
  stasis: '#4D88FF',
  strand: '#00C457',
  prismatic: '#E2C97E',
}

export const CLASS_TYPE_MAP: Record<number, CharacterClass> = {
  0: 'titan',
  1: 'hunter',
  2: 'warlock',
}

export const CLASS_NAMES: Record<CharacterClass, string> = {
  titan: 'Titan',
  hunter: 'Hunter',
  warlock: 'Warlock',
}

// Enriched item — definition + instance data merged
export interface DestinyItem {
  itemHash: number
  instanceId?: string
  bucketHash: number
  quantity: number
  characterId?: string
  location: number
  transferStatus: number
  lockable: boolean
  state: number
  // From instance
  powerLevel?: number
  damageType?: DamageType
  isEquipped?: boolean
  canEquip?: boolean
  energy?: { capacity: number; used: number; type: number }
  // From definition
  definition?: DestinyInventoryItemDefinition
  tier?: ItemTier
  itemCategory?: ItemCategory
  // Sockets (resolved)
  sockets?: ResolvedSocket[]
  // Stats
  stats?: ArmorStats
  weaponStats?: WeaponStats
}

export interface ResolvedSocket {
  socketIndex: number
  plugHash?: number
  plugDefinition?: DestinyInventoryItemDefinition
  isEnabled: boolean
  isVisible: boolean
  reusablePlugs?: DestinyInventoryItemDefinition[]
  categoryHash?: number
}

export interface ArmorStats {
  mobility: number
  resilience: number
  recovery: number
  discipline: number
  intellect: number
  strength: number
  total: number
}

export const WEAPON_STAT_HASHES = {
  RPM: 4284893193,
  MAGAZINE: 3871231066,
  RELOAD_SPEED: 447667954,
  IMPACT: 4043523819,
  RANGE: 1240592695,
  STABILITY: 155624089,
  HANDLING: 943549884,
  AIM_ASSISTANCE: 1345609583,
  ZOOM: 3555269338,
}

export interface WeaponStats {
  rpm: number
  magazine: number
  reloadSpeed: number
  impact: number
  range: number
  stability: number
  handling: number
  aimAssistance: number
  zoom: number
}

export interface SubclassDetails {
  item: DestinyItem
  element: DamageType
  superAbility?: DestinyInventoryItemDefinition
  classAbility?: DestinyInventoryItemDefinition
  jumpAbility?: DestinyInventoryItemDefinition
  meleeAbility?: DestinyInventoryItemDefinition
  grenadeAbility?: DestinyInventoryItemDefinition
  aspects: DestinyInventoryItemDefinition[]
  fragments: DestinyInventoryItemDefinition[]
}

export interface CharacterLoadout {
  characterId: string
  character: import('./bungie').DestinyCharacterComponent
  equipped: DestinyItem[]
  subclass?: SubclassDetails
}
