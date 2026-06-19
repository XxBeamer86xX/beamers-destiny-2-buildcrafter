// Core Bungie API response wrapper
export interface BungieResponse<T> {
  Response: T
  ErrorCode: number
  ThrottleSeconds: number
  ErrorStatus: string
  Message: string
}

// OAuth token response
export interface BungieTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  refresh_expires_in: number
  membership_id: string
}

// User memberships
export interface UserMembership {
  membershipType: number
  membershipId: string
  displayName: string
  bungieGlobalDisplayName: string
  bungieGlobalDisplayNameCode: number
  iconPath: string
  crossSaveOverride: number
  applicableMembershipTypes: number[]
  isPublic: boolean
}

export interface GetMembershipsResponse {
  destinyMemberships: UserMembership[]
  primaryMembershipId: string
  bungieNetUser: {
    membershipId: string
    displayName: string
    profilePicturePath: string
  }
}

// Profile components
export interface DestinyProfileResponse {
  profile: { data: ProfileData; privacy: number }
  profileInventory: { data: { items: DestinyItemComponent[] }; privacy: number }
  characters: { data: Record<string, DestinyCharacterComponent>; privacy: number }
  characterInventories: { data: Record<string, { items: DestinyItemComponent[] }>; privacy: number }
  characterEquipment: { data: Record<string, { items: DestinyItemComponent[] }>; privacy: number }
  characterActivities: { data: Record<string, DestinyCharacterActivitiesComponent>; privacy: number }
  itemComponents: {
    instances: { data: Record<string, DestinyItemInstanceComponent> }
    sockets: { data: Record<string, { sockets: DestinyItemSocketState[] }> }
    stats: { data: Record<string, { stats: Record<string, DestinyItemStat> }> }
    reusablePlugs: { data: Record<string, { plugs: Record<string, DestinyItemPlug[]> }> }
    perks: { data: Record<string, { perks: DestinyItemPerk[] }> }
  }
}

export interface ProfileData {
  userInfo: UserMembership
  characterIds: string[]
  dateLastPlayed: string
}

export interface DestinyCharacterComponent {
  membershipId: string
  membershipType: number
  characterId: string
  dateLastPlayed: string
  light: number
  stats: Record<string, number>
  raceHash: number
  genderHash: number
  classHash: number
  classType: number // 0=Titan, 1=Hunter, 2=Warlock
  emblemHash: number
  emblemPath: string
  emblemBackgroundPath: string
  emblemColor: { red: number; green: number; blue: number; alpha: number }
  levelProgression: { level: number }
  baseCharacterLevel: number
  percentToNextLevel: number
  titleRecordHash?: number
}

export interface DestinyItemComponent {
  itemHash: number
  itemInstanceId?: string
  quantity: number
  bucketHash: number
  location: number
  characterId?: string
  transferStatus: number
  lockable: boolean
  state: number
  overrideStyleItemHash?: number
  versionNumber?: number
  itemValueVisibility?: boolean[]
  tooltipNotificationIndexes?: number[]
}

export interface DestinyItemInstanceComponent {
  damageType: number
  damageTypeHash?: number
  primaryStat?: { statHash: number; value: number }
  itemLevel: number
  quality: number
  isEquipped: boolean
  canEquip: boolean
  equipRequiredLevel: number
  cannotEquipReason: number
  energy?: {
    energyTypeHash: number
    energyType: number
    energyCapacity: number
    energyUsed: number
    energyUnused: number
  }
}

export interface DestinyItemSocketState {
  plugHash?: number
  isEnabled: boolean
  isVisible: boolean
  enableFailIndexes?: number[]
}

export interface DestinyItemStat {
  statHash: number
  value: number
}

export interface DestinyItemPlug {
  plugItemHash: number
  canInsert: boolean
  enabled: boolean
}

export interface DestinyItemPerk {
  perkHash: number
  iconPath: string
  isActive: boolean
  visible: boolean
}

// Manifest types
export interface DestinyManifest {
  version: string
  mobileAssetContentPath: string
  jsonWorldComponentContentPaths: Record<string, Record<string, string>>
}

export interface DestinyInventoryItemDefinition {
  hash: number
  redacted?: boolean
  displayProperties: {
    name: string
    description: string
    icon: string
    hasIcon: boolean
  }
  flavorText?: string
  itemTypeDisplayName: string
  itemTypeAndTierDisplayName: string
  classType: number
  itemType: number
  itemSubType: number
  tierType: number
  tierTypeName: string
  inventory: {
    maxStackSize: number
    bucketTypeHash: number
    tierType: number
    tierTypeName: string
    isInstanceItem: boolean
  }
  stats?: {
    stats: Record<string, { statHash: number; value: number }>
  }
  equippingBlock?: {
    equipmentSlotTypeHash: number
    uniqueLabel: string
    uniqueLabelHash: number
    equipmentSlotTypeHash2?: number
  }
  sockets?: {
    socketEntries: DestinyItemSocketEntryDefinition[]
    socketCategories: DestinyItemSocketCategoryDefinition[]
  }
  perks?: Array<{
    requirementDisplayString: string
    perkHash: number
    perkVisibility: number
  }>
  talentGrid?: { talentGridHash: number }
  screenshot?: string
  damageTypeHashes?: number[]
  damageTypes?: number[]
  defaultDamageType?: number
  defaultDamageTypeHash?: number
  iconWatermark?: string
  iconWatermarkShelved?: string
  backgroundColor?: { red: number; green: number; blue: number; alpha: number }
  secondaryIcon?: string
  loreHash?: number
  itemCategoryHashes?: number[]
  traitIds?: string[]
  traitHashes?: number[]
  plug?: {
    plugCategoryHash: number
    plugCategoryIdentifier: string
    energyCost?: { energyTypeHash: number; energyType: number; energyCost: number }
    isDummyPlug: boolean
  }
  investmentStats?: Array<{ statTypeHash: number; value: number; isConditionallyActive: boolean }>
}

export interface DestinyItemSocketEntryDefinition {
  socketTypeHash: number
  singleInitialItemHash: number
  reusablePlugSetHash?: number
  randomizedPlugSetHash?: number
  preventInitializationOnVendorPurchase: boolean
  hidePerksInItemTooltip: boolean
  plugSources: number
  reusablePlugItems?: Array<{ plugItemHash: number }>
  defaultVisible: boolean
}

export interface DestinyItemSocketCategoryDefinition {
  socketCategoryHash: number
  socketIndexes: number[]
}

export interface DestinySocketCategoryDefinition {
  hash: number
  displayProperties: { name: string; description: string }
  uiCategoryStyle: number
  categoryStyle: number
  index: number
  redacted: boolean
}

export interface DestinyStatDefinition {
  hash: number
  displayProperties: { name: string; description: string; icon?: string }
  aggregationType: number
  hasComputedBlock: boolean
  statCategory: number
  index: number
  redacted: boolean
}

export interface DestinyClassDefinition {
  hash: number
  classType: number
  displayProperties: { name: string; description: string }
  genderedClassNames: Record<string, string>
}

export interface DestinyDamageTypeDefinition {
  hash: number
  displayProperties: { name: string; description: string; icon: string; hasIcon: boolean }
  transparentIconPath: string
  showIcon: boolean
  enumValue: number
  color?: { red: number; green: number; blue: number; alpha: number }
  index: number
  redacted: boolean
}

export interface DestinyPlugSetDefinition {
  hash: number
  reusablePlugItems: Array<{ plugItemHash: number; currentlyCanRoll: boolean }>
  isFakePlugSet: boolean
  index: number
  redacted: boolean
}

// CharacterActivities component (204)
export interface DestinyCharacterActivitiesComponent {
  dateActivityStarted: string
  currentActivityHash: number
  currentActivityModeHash: number
  currentActivityModeType: number
  currentPlaylistActivityHash: number
  lastCompletedStoryHash: number
  availableActivities: Array<{ activityHash: number }>
}

// Zone loot manifest types
export interface DestinyActivityDefinition {
  hash: number
  displayProperties: { name: string; description: string; icon?: string }
  activityTypeHash: number
  destinationHash: number
  placeHash: number
  activityModeTypes: number[]
  activityModeHashes: number[]
  rewards: Array<{ rewardItems: Array<{ itemHash: number; quantity: number }> }>
  isPlaylist: boolean
  redacted: boolean
}

export interface DestinyDestinationDefinition {
  hash: number
  displayProperties: { name: string; description: string }
  placeHash: number
  defaultFreeroamActivityHash: number
  redacted: boolean
}

export interface DestinyCollectibleDefinition {
  hash: number
  displayProperties: { name: string; description: string; icon?: string }
  sourceHash: number
  itemHash: number
  redacted: boolean
}

export interface DestinyRewardSourceDefinition {
  hash: number
  displayProperties: { name: string; description: string; icon?: string }
  category: number
  redacted: boolean
}
