import { create } from 'zustand'
import type { DestinyItem } from '../types/destiny'
import { BUCKET_HASH_MAP } from '../types/destiny'

interface SandboxState {
  virtualLoadout: Partial<Record<string, DestinyItem>>
  characterId: string | null
  initialized: boolean
}

interface SandboxActions {
  initSandbox: (charId: string, equippedItems: DestinyItem[]) => void
  setSlotItem: (slot: string, item: DestinyItem | null) => void
  resetToEquipped: (equippedItems: DestinyItem[]) => void
}

function equippedToLoadout(items: DestinyItem[]): Partial<Record<string, DestinyItem>> {
  const loadout: Partial<Record<string, DestinyItem>> = {}
  for (const item of items) {
    const slot = BUCKET_HASH_MAP[item.bucketHash]
    if (slot) {
      loadout[slot] = item
    }
  }
  return loadout
}

export const useSandboxStore = create<SandboxState & SandboxActions>((set) => ({
  virtualLoadout: {},
  characterId: null,
  initialized: false,

  initSandbox: (charId, equippedItems) => {
    set({
      characterId: charId,
      virtualLoadout: equippedToLoadout(equippedItems),
      initialized: true,
    })
  },

  setSlotItem: (slot, item) => {
    set((state) => {
      const next = { ...state.virtualLoadout }
      if (item === null) {
        delete next[slot]
      } else {
        next[slot] = item
      }
      return { virtualLoadout: next }
    })
  },

  resetToEquipped: (equippedItems) => {
    set({ virtualLoadout: equippedToLoadout(equippedItems) })
  },
}))
