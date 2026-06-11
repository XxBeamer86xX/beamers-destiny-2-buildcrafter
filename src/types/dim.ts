// DIM backup file format

export interface DIMBackup {
  settings?: {
    armorCompare?: string
    itemFeedExpanded?: boolean
    [key: string]: unknown
  }
  loadouts?: DIMLoadout[]
  tags?: DIMTag[]
  itemHashTags?: DIMItemHashTag[]
  triumphs?: number[]
  searches?: DIMSearch[]
}

export interface DIMLoadout {
  id: string
  name: string
  classType: number // 0=Titan, 1=Hunter, 2=Warlock, 3=Any
  clearSpace?: boolean
  equipped: DIMLoadoutItem[]
  unequipped?: DIMLoadoutItem[]
  parameters?: DIMLoadoutParameters
  notes?: string
  lastUpdatedAt?: number
  createdAt?: number
}

export interface DIMLoadoutItem {
  id?: string          // instance ID (for instanced items)
  hash: number         // item definition hash
  amount?: number      // quantity (for consumables)
  socketOverrides?: Record<string, number>  // socketIndex → plugHash
  craftedDate?: number
}

export interface DIMLoadoutParameters {
  statConstraints?: DIMStatConstraint[]
  mods?: number[]        // mod hashes to apply
  exoticArmorHash?: number
  subclassPlugs?: Record<string, number[]>  // subclass instance ID → plug hashes
  assumeArmorMasterwork?: boolean | null
  autoStatMods?: boolean
  query?: string
}

export interface DIMStatConstraint {
  statHash: number
  minTier?: number
  maxTier?: number
}

export interface DIMTag {
  id: string  // item instance ID
  tag?: 'favorite' | 'keep' | 'infuse' | 'junk' | 'archive'
  notes?: string
  craftedDate?: number
}

export interface DIMItemHashTag {
  hash: number  // item definition hash
  tag?: 'favorite' | 'keep' | 'infuse' | 'junk' | 'archive'
  notes?: string
}

export interface DIMSearch {
  platformMembershipId?: string
  destinyVersion?: number
  search: {
    query: string
    usageCount: number
    saved: boolean
    lastUsage: number
    type: number
  }
}
