import { useQuery } from '@tanstack/react-query'
import { bungieApi } from '../lib/bungie-api'
import { enrichItems } from '../lib/enrichItems'
import { useAuthStore } from '../store/authStore'
import type { DestinyItem } from '../types/destiny'
import type { DestinyCharacterComponent } from '../types/bungie'
import { ARMOR_BUCKET_HASHES, WEAPON_BUCKET_HASHES } from '../types/destiny'

export interface ProfileData {
  characters: DestinyCharacterComponent[]
  characterEquipped: Record<string, DestinyItem[]>
  characterInventory: Record<string, DestinyItem[]>
  vault: DestinyItem[]
}

export function useProfile() {
  const { selectedMembership, accessToken } = useAuthStore()

  return useQuery<ProfileData>({
    queryKey: ['profile', selectedMembership?.membershipId],
    enabled: !!selectedMembership && !!accessToken,
    staleTime: 60_000, // 1 minute
    queryFn: async () => {
      if (!selectedMembership) throw new Error('No membership selected')

      const raw = await bungieApi.getProfile(
        selectedMembership.membershipType,
        selectedMembership.membershipId
      )

      const characters = Object.values(raw.characters?.data ?? {}).sort(
        (a, b) => new Date(b.dateLastPlayed).getTime() - new Date(a.dateLastPlayed).getTime()
      )

      const characterEquipped: Record<string, DestinyItem[]> = {}
      const characterInventory: Record<string, DestinyItem[]> = {}

      for (const char of characters) {
        const equippedRaw = raw.characterEquipment?.data?.[char.characterId]?.items ?? []
        const inventoryRaw = raw.characterInventories?.data?.[char.characterId]?.items ?? []

        characterEquipped[char.characterId] = await enrichItems(equippedRaw, raw)
        characterInventory[char.characterId] = await enrichItems(inventoryRaw, raw)
      }

      const vaultRaw = raw.profileInventory?.data?.items ?? []
      const allVault = await enrichItems(vaultRaw, raw)
      const vault = allVault.filter(i =>
        i.itemCategory === 'weapon' ||
        i.itemCategory === 'armor' ||
        WEAPON_BUCKET_HASHES.includes(i.bucketHash) ||
        ARMOR_BUCKET_HASHES.includes(i.bucketHash)
      )

      return { characters, characterEquipped, characterInventory, vault }
    },
  })
}
